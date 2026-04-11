"""
JWT Authentication layer for Kisaan AI.
- passlib[bcrypt] for password hashing
- python-jose for JWT encoding/decoding
- Lightweight: no external auth service needed
"""
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "kisaan-ai-secret-2026-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    phone: str          # used as username
    password: str
    location: str = "India"
    primary_crop: str = "Wheat"

class LoginRequest(BaseModel):
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer_id: int
    name: str

# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)

def create_access_token(farmer_id: int, name: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(farmer_id), "name": name, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_current_farmer_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> int:
    """
    Dependency that extracts farmer_id from JWT.
    Returns farmer_id (int). Raises 401 if token is missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    farmer_id = int(payload.get("sub", 0))
    if not farmer_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return farmer_id

async def get_optional_farmer_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[int]:
    """Same as above but returns None instead of raising — for optional auth."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return int(payload.get("sub", 0)) or None
    except Exception:
        return None
