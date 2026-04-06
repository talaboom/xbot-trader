"""Email service using Resend for transactional emails."""

import logging
import random
import string

from app.config import settings

logger = logging.getLogger(__name__)


def generate_verify_code() -> str:
    """Generate a 6-digit verification code."""
    return "".join(random.choices(string.digits, k=6))


async def send_verification_email(to_email: str, code: str, username: str):
    """Send email verification code."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email to %s (code: %s)", to_email, code)
        return

    import resend
    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": [to_email],
        "subject": f"Verify your X Bot Trader account — {code}",
        "html": f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0;">X Bot Trader</h1>
            </div>
            <h2 style="color: #fff; background: #0a0a1a; padding: 20px; border-radius: 12px; text-align: center;">
                Your verification code
            </h2>
            <div style="background: #111127; border-radius: 12px; padding: 30px; text-align: center; margin: 20px 0;">
                <p style="color: #9ca3af; margin: 0 0 10px;">Hey {username}, enter this code to verify your email:</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981; padding: 15px; background: #0a0a1a; border-radius: 8px; display: inline-block;">
                    {code}
                </div>
                <p style="color: #6b7280; margin: 15px 0 0; font-size: 13px;">This code expires in 15 minutes.</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
                If you didn't create an account, you can ignore this email.
            </p>
        </div>
        """,
    })


async def send_login_alert(to_email: str, username: str, ip_address: str):
    """Send new login notification."""
    if not settings.RESEND_API_KEY:
        return

    import resend
    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": [to_email],
        "subject": "New login to your X Bot Trader account",
        "html": f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0;">X Bot Trader</h1>
            </div>
            <div style="background: #111127; border-radius: 12px; padding: 25px; margin: 20px 0;">
                <p style="color: #e5e7eb; margin: 0 0 15px;">Hey {username},</p>
                <p style="color: #9ca3af; margin: 0 0 15px;">We detected a new login to your account.</p>
                <div style="background: #0a0a1a; border-radius: 8px; padding: 15px;">
                    <p style="color: #6b7280; margin: 0; font-size: 13px;">IP Address: <span style="color: #e5e7eb;">{ip_address}</span></p>
                </div>
                <p style="color: #9ca3af; margin: 15px 0 0; font-size: 13px;">If this wasn't you, change your password immediately.</p>
            </div>
        </div>
        """,
    })


async def send_payment_confirmation(to_email: str, username: str, plan: str, amount: str):
    """Send payment confirmation email."""
    if not settings.RESEND_API_KEY:
        return

    import resend
    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": [to_email],
        "subject": f"Payment confirmed — {plan.capitalize()} plan activated!",
        "html": f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0;">X Bot Trader</h1>
            </div>
            <div style="background: #111127; border-radius: 12px; padding: 25px; text-align: center; margin: 20px 0;">
                <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                <h2 style="color: #e5e7eb; margin: 0 0 10px;">Welcome to {plan.capitalize()}!</h2>
                <p style="color: #9ca3af; margin: 0 0 20px;">Hey {username}, your {plan.capitalize()} plan is now active.</p>
                <div style="background: #0a0a1a; border-radius: 8px; padding: 15px; display: inline-block;">
                    <p style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0;">{amount}/month</p>
                </div>
                <p style="color: #6b7280; margin: 15px 0 0; font-size: 13px;">All premium features are now unlocked. Happy trading!</p>
            </div>
            <div style="text-align: center;">
                <a href="{settings.FRONTEND_URL}/dashboard" style="background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
            </div>
        </div>
        """,
    })
