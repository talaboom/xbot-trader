from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.exchange_key import ExchangeKey
from app.models.user import User
from app.schemas.exchange_key import ExchangeKeyCreate, ExchangeKeyResponse, ExchangeKeyVerifyResponse
from app.services.coinbase_service import CoinbaseService
from app.services.crypto_service import encrypt_value

router = APIRouter(prefix="/exchange", tags=["exchange"])


@router.post("/keys", response_model=ExchangeKeyResponse)
async def store_keys(
    data: ExchangeKeyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExchangeKey).where(ExchangeKey.user_id == user.id, ExchangeKey.exchange == "coinbase")
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.flush()

    uid = str(user.id)
    key_ct, key_nonce, key_tag = encrypt_value(data.api_key, uid)
    secret_ct, secret_nonce, secret_tag = encrypt_value(data.api_secret, uid)

    exchange_key = ExchangeKey(
        user_id=user.id,
        api_key_encrypted=key_ct,
        api_secret_encrypted=secret_ct,
        key_nonce=key_nonce,
        secret_nonce=secret_nonce,
        key_tag=key_tag,
        secret_tag=secret_tag,
        label=data.label,
    )
    db.add(exchange_key)
    await db.commit()
    await db.refresh(exchange_key)

    return ExchangeKeyResponse(
        id=exchange_key.id,
        exchange=exchange_key.exchange,
        label=exchange_key.label,
        api_key_masked=data.api_key[:20] + "***",
        is_valid=exchange_key.is_valid,
        created_at=exchange_key.created_at,
    )


@router.get("/keys", response_model=list[ExchangeKeyResponse])
async def list_keys(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExchangeKey).where(ExchangeKey.user_id == user.id))
    keys = result.scalars().all()
    return [
        ExchangeKeyResponse(
            id=k.id,
            exchange=k.exchange,
            label=k.label,
            api_key_masked="***encrypted***",
            is_valid=k.is_valid,
            created_at=k.created_at,
        )
        for k in keys
    ]


@router.delete("/keys/{key_id}")
async def delete_key(
    key_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExchangeKey).where(ExchangeKey.id == key_id, ExchangeKey.user_id == user.id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    await db.delete(key)
    await db.commit()
    return {"message": "Key deleted"}


@router.post("/keys/verify", response_model=ExchangeKeyVerifyResponse)
async def verify_keys(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ExchangeKey).where(ExchangeKey.user_id == user.id, ExchangeKey.exchange == "coinbase")
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="No API keys stored")

    try:
        service = CoinbaseService.from_encrypted(key, str(user.id), sandbox=user.is_paper_mode)
        accounts = await service.get_accounts()
        key.is_valid = True
        await db.commit()
        return ExchangeKeyVerifyResponse(is_valid=True, message="Connection successful", balances=accounts)
    except Exception as e:
        key.is_valid = False
        await db.commit()
        return ExchangeKeyVerifyResponse(is_valid=False, message=f"Connection failed: {str(e)}")
