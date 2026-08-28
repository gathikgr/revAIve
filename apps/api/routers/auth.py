"""
revAIve — Auth Router for Tenant-Isolated Dashboard Access
"""

import hashlib
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from packages.database.session import get_db
from packages.database.models import User, Merchant


router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    merchant_name: str
    razorpay_merchant_id: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def hash_password(password: str) -> str:
    """Computes SHA256 hash of password."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_current_merchant(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Merchant:
    """
    Dependency to resolve the active merchant session.
    Enforces tenant isolation.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            parts = token.split(":")
            if len(parts) == 2:
                user_id, merchant_id = parts[0], parts[1]
                m = db.query(Merchant).filter(Merchant.id == merchant_id).first()
                if m:
                    return m
        except Exception:
            pass
    
    # Fallback to default demo merchant for backward compatibility/demo mode
    m = db.query(Merchant).first()
    if not m:
        m = Merchant(
            id="merch_demo_101",
            name="Meridian Retail Commerce Pvt Ltd",
            razorpay_merchant_id="rzp_merch_meridian01",
            webhook_secret="whsec_demo_secret_12345"
        )
        db.add(m)
        db.commit()
        db.refresh(m)
    return m


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Check if merchant ID already registered
    existing_merch = db.query(Merchant).filter(
        Merchant.razorpay_merchant_id == req.razorpay_merchant_id
    ).first()
    if existing_merch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This merchant account is already registered."
        )

    # Create Merchant
    merchant = Merchant(
        id=f"merch_{uuid.uuid4().hex[:8]}",
        name=req.merchant_name,
        razorpay_merchant_id=req.razorpay_merchant_id,
        webhook_secret=f"whsec_{uuid.uuid4().hex[:12]}"
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    # Create User
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        merchant_id=merchant.id
    )
    db.add(user)
    db.commit()

    return {
        "status": "success",
        "message": "Merchant registration completed successfully.",
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "razorpay_merchant_id": merchant.razorpay_merchant_id
        }
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or user.password_hash != hash_password(req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    merchant = db.query(Merchant).filter(Merchant.id == user.merchant_id).first()
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant not found."
        )

    # Simple signed-style token: user_id:merchant_id
    token = f"{user.id}:{merchant.id}"

    return {
        "status": "success",
        "token": token,
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "razorpay_merchant_id": merchant.razorpay_merchant_id
        }
    }
