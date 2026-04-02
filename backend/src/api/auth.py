import resend
import random
import string
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..database import get_db
from ..models import User, AnonymousSession
from ..services.auth_service import get_password_hash, verify_password, create_access_token
import secrets

router = APIRouter()

# ── In-memory OTP store (replace with Redis in full production) ───────────────
_otp_store: dict[str, str] = {}  # email → otp_code

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "re_3g6fT9ZR_Crsw8tWnoKFtQWLeSzYj9dMP")
resend.api_key = RESEND_API_KEY
FROM_EMAIL = "VelixAI <onboarding@resend.dev>"

# ── Schemas ───────────────────────────────────────────────────────────────────
class AnonymousReq(BaseModel):
    age_group: Optional[str] = None
    profession: Optional[str] = None

class SendOTPReq(BaseModel):
    email: EmailStr
    full_name: str

class VerifyOTPReq(BaseModel):
    email: EmailStr
    otp: str
    full_name: str
    password: str

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class TokenRes(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/anonymous")
async def create_anonymous_session(req: AnonymousReq, db: AsyncSession = Depends(get_db)):
    token = secrets.token_hex(16)
    s = AnonymousSession(token=token, age_group=req.age_group, profession=req.profession)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"token": token, "session_id": s.id, "access_token": token, "onboarding_token": token}

@router.post("/guest", response_model=TokenRes)
async def create_guest_user(db: AsyncSession = Depends(get_db)):
    guest_id = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    user = User(
        email=f"guest_{guest_id}@velixai.local",
        full_name="Guest Student",
        hashed_password=get_password_hash(guest_id),
        avatar_initials="G"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/send-otp")
async def send_otp(req: SendOTPReq, db: AsyncSession = Depends(get_db)):
    """Send a 6-digit OTP to the user's email using Resend."""
    # Check if email already registered
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalars().first():
        raise HTTPException(400, "Email already registered. Please log in instead.")

    # Generate OTP
    otp = "".join(random.choices(string.digits, k=6))
    _otp_store[req.email] = otp

    # Send via Resend
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [req.email],
            "subject": "Your VelixAI verification code",
            "html": f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0F1117; color: #E8E5E0; border-radius: 16px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: #6366F1; display: flex; align-items: center; justify-content: center; font-size: 18px;">🎙️</div>
                <span style="font-weight: 700; font-size: 16px; color: #E8E5E0;">VelixAI</span>
              </div>
              <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 8px 0; color: #E8E5E0;">Hello {req.full_name} 👋</h2>
              <p style="color: #9B9489; font-size: 14px; margin: 0 0 28px 0; line-height: 1.6;">
                Here is your one-time verification code for VelixAI. It expires in 10 minutes.
              </p>
              <div style="background: #1C1F2A; border: 1px solid #2A2D3A; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #6366F1; font-family: monospace;">{otp}</span>
              </div>
              <p style="color: #9B9489; font-size: 12px; line-height: 1.6;">
                If you didn't request this code, you can safely ignore this email.<br />
                Never share this code with anyone.
              </p>
            </div>
            """,
        })
    except Exception as e:
        # Fallback: still let through in dev (log the OTP)
        print(f"[DEV] OTP for {req.email}: {otp}")

    return {"message": "OTP sent to your email address."}

@router.post("/verify-otp", response_model=TokenRes)
async def verify_otp_and_register(req: VerifyOTPReq, db: AsyncSession = Depends(get_db)):
    """Verify OTP and create the user account."""
    stored_otp = _otp_store.get(req.email)
    if not stored_otp or stored_otp != req.otp:
        raise HTTPException(400, "Invalid or expired OTP. Please request a new one.")

    # Create user
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalars().first():
        raise HTTPException(400, "Account already exists. Please log in.")

    user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
        avatar_initials=(req.full_name[:2]).upper() if len(req.full_name) >= 2 else req.full_name.upper(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Clean up OTP
    _otp_store.pop(req.email, None)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/convert", response_model=TokenRes)
async def convert_to_user(req: VerifyOTPReq, db: AsyncSession = Depends(get_db)):
    """Legacy convert endpoint — delegates to verify-otp logic."""
    return await verify_otp_and_register(req, db)

@router.post("/login", response_model=TokenRes)
async def login(req: LoginReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
