"""
FastAPI Router: Auth (signup / login)
Roles: student | runner | admin | canteen_owner
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database import get_supabase
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str          # student | runner | admin | canteen_owner
    phone: str = ""
    location: str = "" # campus node id for runners/students


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
async def signup(req: SignupRequest):
    if req.role not in ("student", "runner", "admin", "canteen_owner"):
        raise HTTPException(400, "Invalid role")

    db = get_supabase()
    # Check duplicate email
    existing = db.table("users").select("id").eq("email", req.email).execute()
    if existing.data:
        raise HTTPException(400, "Email already registered")

    hashed = hash_password(req.password)
    wallet_balance = 200.0 if req.role == "student" else 0.0  # starter wallet

    result = db.table("users").insert({
        "email": req.email,
        "password_hash": hashed,
        "name": req.name,
        "role": req.role,
        "phone": req.phone,
        "location": req.location,
        "wallet_balance": wallet_balance,
        "is_active": True,
        "rating": 0.0,
        "rating_count": 0,
    }).execute()

    user = result.data[0]
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    return {"token": token, "user": {k: user[k] for k in ["id", "email", "name", "role", "wallet_balance"]}}


@router.post("/login")
async def login(req: LoginRequest):
    db = get_supabase()
    result = db.table("users").select("*").eq("email", req.email).execute()
    if not result.data:
        raise HTTPException(401, "Invalid credentials")

    user = result.data[0]
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    return {"token": token, "user": {k: user[k] for k in ["id", "email", "name", "role", "wallet_balance", "location"]}}


@router.get("/me")
async def me_endpoint():
    """Placeholder – actual validation via bearer token in middleware."""
    return {"message": "Use Authorization: Bearer <token>"}
