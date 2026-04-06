import urllib.parse
import uuid

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.auth_service import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])

BACKEND_URL = settings.FRONTEND_URL.replace(":3000", ":8000") if "localhost" in settings.FRONTEND_URL else ""


def _get_backend_url():
    """Get the backend URL for OAuth callbacks."""
    if BACKEND_URL:
        return BACKEND_URL
    # In production, derive from FRONTEND_URL
    return settings.FRONTEND_URL.replace("xbot-trader.vercel.app", "backend-production-dd0c.up.railway.app")


# ─── Google OAuth ────────────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
async def google_login():
    """Redirect user to Google OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    callback_url = f"{settings.FRONTEND_URL}/auth/callback?provider=google"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": callback_url,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.post("/google/callback")
async def google_callback(code: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Exchange Google auth code for user info, create/login user."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    callback_url = f"{settings.FRONTEND_URL}/auth/callback?provider=google"

    # Exchange code for tokens
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": callback_url,
        })

        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google auth code")

        tokens = token_resp.json()
        access_token = tokens["access_token"]

        # Get user info
        user_resp = await client.get(GOOGLE_USERINFO_URL, headers={
            "Authorization": f"Bearer {access_token}"
        })

        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Google user info")

        user_info = user_resp.json()

    google_id = user_info["id"]
    email = user_info.get("email", "")
    name = user_info.get("name", "")
    picture = user_info.get("picture", "")

    return await _oauth_login_or_create(
        db, provider="google", oauth_id=google_id,
        email=email, name=name, avatar_url=picture,
    )


# ─── Microsoft OAuth ────────────────────────────────────────────────────────

MS_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
MS_USERINFO_URL = "https://graph.microsoft.com/v1.0/me"


@router.get("/microsoft")
async def microsoft_login():
    """Redirect user to Microsoft OAuth consent screen."""
    if not settings.MICROSOFT_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Microsoft OAuth not configured")

    callback_url = f"{settings.FRONTEND_URL}/auth/callback?provider=microsoft"
    params = {
        "client_id": settings.MICROSOFT_CLIENT_ID,
        "redirect_uri": callback_url,
        "response_type": "code",
        "scope": "openid email profile User.Read",
        "response_mode": "query",
        "prompt": "select_account",
    }
    url = f"{MS_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.post("/microsoft/callback")
async def microsoft_callback(code: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Exchange Microsoft auth code for user info, create/login user."""
    if not settings.MICROSOFT_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Microsoft OAuth not configured")

    callback_url = f"{settings.FRONTEND_URL}/auth/callback?provider=microsoft"

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.post(MS_TOKEN_URL, data={
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "client_secret": settings.MICROSOFT_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": callback_url,
            "scope": "openid email profile User.Read",
        })

        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Microsoft auth code")

        tokens = token_resp.json()
        access_token = tokens["access_token"]

        user_resp = await client.get(MS_USERINFO_URL, headers={
            "Authorization": f"Bearer {access_token}"
        })

        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Microsoft user info")

        user_info = user_resp.json()

    ms_id = user_info["id"]
    email = user_info.get("mail") or user_info.get("userPrincipalName", "")
    name = user_info.get("displayName", "")

    return await _oauth_login_or_create(
        db, provider="microsoft", oauth_id=ms_id,
        email=email, name=name, avatar_url="",
    )


# ─── Facebook OAuth ──────────────────────────────────────────────────────────

FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth"
FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"
FB_USERINFO_URL = "https://graph.facebook.com/v19.0/me"


@router.get("/facebook")
async def facebook_login():
    """Redirect user to Facebook OAuth consent screen."""
    if not settings.FACEBOOK_APP_ID:
        raise HTTPException(status_code=501, detail="Facebook OAuth not configured")

    callback_url = f"{settings.FRONTEND_URL}/auth/callback?provider=facebook"
    params = {
        "client_id": settings.FACEBOOK_APP_ID,
        "redirect_uri": callback_url,
        "scope": "email,public_profile",
        "response_type": "code",
    }
    url = f"{FB_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.post("/facebook/callback")
async def facebook_callback(code: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Exchange Facebook auth code for user info, create/login user."""
    if not settings.FACEBOOK_APP_ID:
        raise HTTPException(status_code=501, detail="Facebook OAuth not configured")

    callback_url = f"{settings.FRONTEND_URL}/auth/callback?provider=facebook"

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.get(FB_TOKEN_URL, params={
            "client_id": settings.FACEBOOK_APP_ID,
            "client_secret": settings.FACEBOOK_APP_SECRET,
            "code": code,
            "redirect_uri": callback_url,
        })

        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Facebook auth code")

        tokens = token_resp.json()
        access_token = tokens["access_token"]

        user_resp = await client.get(FB_USERINFO_URL, params={
            "fields": "id,name,email,picture.type(large)",
            "access_token": access_token,
        })

        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Facebook user info")

        user_info = user_resp.json()

    fb_id = user_info["id"]
    email = user_info.get("email", "")
    name = user_info.get("name", "")
    picture = user_info.get("picture", {}).get("data", {}).get("url", "")

    return await _oauth_login_or_create(
        db, provider="facebook", oauth_id=fb_id,
        email=email, name=name, avatar_url=picture,
    )


# ─── Shared helper ───────────────────────────────────────────────────────────

async def _oauth_login_or_create(
    db: AsyncSession,
    provider: str,
    oauth_id: str,
    email: str,
    name: str,
    avatar_url: str,
):
    """Find existing user by OAuth ID or email, or create new one. Return JWT tokens."""

    # 1. Check if user exists with this OAuth provider + ID
    result = await db.execute(
        select(User).where(User.oauth_provider == provider, User.oauth_id == oauth_id)
    )
    user = result.scalar_one_or_none()

    if not user and email:
        # 2. Check if user exists with this email (link accounts)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link OAuth to existing account
            user.oauth_provider = provider
            user.oauth_id = oauth_id
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
            await db.commit()

    if not user:
        # 3. Create new user
        username = name.replace(" ", "").lower()[:15] or f"user{uuid.uuid4().hex[:6]}"

        # Ensure unique username
        existing = await db.execute(select(User).where(User.username == username))
        if existing.scalar_one_or_none():
            username = f"{username}{uuid.uuid4().hex[:4]}"

        user = User(
            email=email,
            username=username,
            password_hash=None,
            oauth_provider=provider,
            oauth_id=oauth_id,
            avatar_url=avatar_url,
            is_email_verified=True,  # OAuth emails are already verified
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": str(user.id)}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }
