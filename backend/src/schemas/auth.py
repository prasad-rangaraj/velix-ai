from pydantic import BaseModel, EmailStr
from typing import Optional

class AnonymousSessionCreate(BaseModel):
    age_group: Optional[str] = None
    profession: Optional[str] = None

class ConvertAnonymousRequest(BaseModel):
    email: EmailStr
    full_name: str
    otp: str
    # Empty password placeholder strategy from KI
    password: str = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
