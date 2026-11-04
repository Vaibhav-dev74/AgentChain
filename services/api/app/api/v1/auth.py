"""
Authentication and User Profile Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User, Wallet
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, WalletConnect
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.execute(
        select(User).where((User.username == user_in.username) | (User.email == user_in.email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role="OPERATOR",  # Default new users to operator role for testing
        is_active=True,
        wallet_address=user_in.wallet_address,
    )
    db.add(user)
    db.flush()

    if user_in.wallet_address:
        wallet = Wallet(
            user_id=user.id,
            address=user_in.wallet_address,
            chain_id=31337,
            is_primary=True,
        )
        db.add(wallet)

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            wallet_address=user.wallet_address,
            created_at=user.created_at.isoformat(),
        ),
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.username == credentials.username)).scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            wallet_address=user.wallet_address,
            created_at=user.created_at.isoformat(),
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        wallet_address=current_user.wallet_address,
        created_at=current_user.created_at.isoformat(),
    )


@router.post("/connect-wallet", response_model=UserResponse)
def connect_wallet(
    data: WalletConnect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.wallet_address = data.wallet_address

    wallet = db.execute(
        select(Wallet).where(Wallet.user_id == current_user.id, Wallet.address == data.wallet_address)
    ).scalar_one_or_none()
    if not wallet:
        new_wallet = Wallet(
            user_id=current_user.id,
            address=data.wallet_address,
            chain_id=data.chain_id,
            is_primary=True,
        )
        db.add(new_wallet)

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        wallet_address=current_user.wallet_address,
        created_at=current_user.created_at.isoformat(),
    )
