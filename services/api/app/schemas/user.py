"""
User and Authentication Pydantic Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)
    wallet_address: Optional[str] = Field(default=None, pattern=r"^0x[a-fA-F0-9]{40}$")


class UserLogin(BaseModel):
    username: str
    password: str


class WalletConnect(BaseModel):
    wallet_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$")
    chain_id: int = 31337


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    is_active: bool
    wallet_address: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
