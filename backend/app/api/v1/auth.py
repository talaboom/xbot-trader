import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenRefresh, TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.services.email_service import (
    generate_verify_code,
    send_login_alert,
    send_verification_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class VerifyEmailRequest(BaseModel):
    email: str
    code: str


class ResendCodeRequest(BaseModel):
    email: str


@router.post("/register")
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Handle referral
    referred_by_id = None
    if data.referral_code:
        ref_result = await db.execute(
            select(User).where(User.referral_code == data.referral_code.upper())
        )
        referrer = ref_result.scalar_one_or_none()
        if referrer:
            referred_by_id = referrer.id
            referrer.referral_count = (referrer.referral_count or 0) + 1
            
            # Grant 1 week of 'trader' plan as a reward
            now = datetime.now(timezone.utc)
            base_date = referrer.subscription_expires_at if (referrer.subscription_expires_at and referrer.subscription_expires_at > now) else now
            referrer.subscription_expires_at = base_date + timedelta(days=7)
            referrer.subscription_tier = "trader"
            referrer.subscription_status = "active"

    code = generate_verify_code()
    user = User(
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
        referred_by=referred_by_id,
        is_email_verified=False,
        email_verify_code=code,
        email_verify_expires=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    try:
        await send_verification_email(data.email, code, data.username)
    except Exception:
        # Email sending failed — auto-verify so user isn't locked out
        user.is_email_verified = True
        user.email_verify_code = None
        await db.commit()

    if user.is_email_verified:
        # Email failed, auto-verified — return tokens directly
        token_data = {"sub": str(user.id)}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    return {
        "status": "verify_email",
        "message": "Account created. Check your email for a 6-digit verification code.",
        "email": data.email,
    }


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if user.is_email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    if not user.email_verify_code or user.email_verify_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if user.email_verify_expires and datetime.now(timezone.utc) > user.email_verify_expires:
        raise HTTPException(status_code=400, detail="Verification code expired. Request a new one.")

    user.is_email_verified = True
    user.email_verify_code = None
    user.email_verify_expires = None
    await db.commit()

    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/resend-code")
async def resend_code(data: ResendCodeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if user.is_email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    code = generate_verify_code()
    user.email_verify_code = code
    user.email_verify_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.commit()

    await send_verification_email(user.email, code, user.username)
    return {"message": "New verification code sent."}


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_email_verified:
        # Resend verification code
        code = generate_verify_code()
        user.email_verify_code = code
        user.email_verify_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        await send_verification_email(user.email, code, user.username)
        raise HTTPException(
            status_code=403,
            detail="Email not verified. A new verification code has been sent.",
        )

    # Send login alert (non-blocking)
    try:
        ip = request.client.host if request.client else "unknown"
        await send_login_alert(user.email, user.username, ip)
    except Exception:
        pass  # Don't block login if email fails

    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


class FacebookLoginRequest(BaseModel):
    access_token: str


@router.post("/facebook", response_model=TokenResponse)
async def facebook_login(data: FacebookLoginRequest, db: AsyncSession = Depends(get_db)):
    # Fetch user info from Facebook Graph API
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://graph.facebook.com/me",
            params={"fields": "id,name,email", "access_token": data.access_token},
            timeout=10.0,
        )

    if resp.status_code != 200 or "error" in resp.json():
        raise HTTPException(status_code=401, detail="Invalid Facebook token")

    fb_data = resp.json()
    fb_id: str = fb_data.get("id", "")
    fb_name: str = fb_data.get("name", "")
    fb_email: str | None = fb_data.get("email")

    if not fb_email:
        raise HTTPException(
            status_code=400,
            detail="Facebook account has no email address. Please use email/password login.",
        )

    # Find existing user by email or facebook_id
    result = await db.execute(
        select(User).where((User.email == fb_email) | (User.facebook_id == fb_id))
    )
    user = result.scalar_one_or_none()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled")
        # Store facebook_id if not yet linked
        if not user.facebook_id:
            user.facebook_id = fb_id
            await db.commit()
    else:
        # Create new user from Facebook data
        base_username = (fb_name.lower().replace(" ", "_") or "user")[:20]
        username = base_username
        suffix = 1
        while True:
            check = await db.execute(select(User).where(User.username == username))
            if not check.scalar_one_or_none():
                break
            username = f"{base_username}{suffix}"
            suffix += 1

        user = User(
            email=fb_email,
            username=username,
            password_hash=hash_password(uuid.uuid4().hex),  # unusable random password
            is_email_verified=True,
            facebook_id=fb_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": str(user.id)}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )
