from __future__ import annotations
import os
import secrets
import hashlib
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from pydantic import BaseModel
from passlib.context import CryptContext
from database import query, query_one, execute, execute_returning, log_audit
from auth import create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory OTP store: { "type:value": { otp, expires_ms } }
_otp_store: dict = {}


def _generate_otp() -> str:
    if os.getenv("HARDCODE_OTP") == "true":
        return "000000"
    return str(100000 + secrets.randbelow(900000))


def _public_user(u: dict) -> dict:
    import json
    skills = u.get("skills")
    if isinstance(skills, str):
        try:
            skills = json.loads(skills)
        except Exception:
            skills = []
    return {
        "id": u["id"], "name": u["name"], "email": u["email"], "role": u["role"],
        "org_name": u.get("org_name"), "location": u.get("location"), "bio": u.get("bio"),
        "skills": skills or [], "experience_years": u.get("experience_years"),
        "first_name": u.get("first_name"), "middle_name": u.get("middle_name"),
        "last_name": u.get("last_name"), "dob": str(u["dob"]) if u.get("dob") else None,
        "gender": u.get("gender"), "phone": u.get("phone"), "photo": u.get("photo"),
        "address_line1": u.get("address_line1"), "address_line2": u.get("address_line2"),
        "city": u.get("city"), "state_name": u.get("state_name"),
        "country": u.get("country"), "pincode": u.get("pincode"),
    }


# ── Check duplicate ──────────────────────────────────────────────────────────
class CheckDupIn(BaseModel):
    field: str
    value: str

@router.post("/check-duplicate")
async def check_duplicate(body: CheckDupIn):
    if body.field == "email":
        row = await query_one("SELECT id FROM users WHERE LOWER(TRIM(email))=LOWER(TRIM($1))", [body.value])
        if row:
            raise HTTPException(409, detail={"error": "Email is already registered.", "field": "email"})
    elif body.field == "phone":
        digits = "".join(c for c in body.value if c.isdigit())[-10:]
        row = await query_one("SELECT id FROM users WHERE RIGHT(REGEXP_REPLACE(phone,'\\D','','g'),10)=$1", [digits])
        if row:
            raise HTTPException(409, detail={"error": "Mobile number is already registered.", "field": "phone"})
    return {"available": True}


# ── Send OTP ─────────────────────────────────────────────────────────────────
class OtpIn(BaseModel):
    type: str
    value: str

@router.post("/send-otp")
async def send_otp(body: OtpIn):
    otp = _generate_otp()
    key = f"{body.type}:{body.value}"
    import time
    _otp_store[key] = {"otp": otp, "expires": time.time() * 1000 + 10 * 60 * 1000}
    print(f"[OTP] {body.type.upper()} OTP for {body.value}: {otp}")
    resp: dict = {"success": True, "message": f"OTP sent to {'mobile number' if body.type == 'mobile' else 'email address'}"}
    if os.getenv("NODE_ENV") != "production":
        resp["dev_otp"] = otp
    return resp


# ── Verify OTP ────────────────────────────────────────────────────────────────
class VerifyOtpIn(BaseModel):
    type: str
    value: str
    otp: str

@router.post("/verify-otp")
async def verify_otp(body: VerifyOtpIn):
    import time
    if os.getenv("HARDCODE_OTP") == "true" and body.otp == "000000":
        return {"success": True, "verified": True}
    key = f"{body.type}:{body.value}"
    record = _otp_store.get(key)
    if not record:
        raise HTTPException(400, detail="OTP not sent or expired. Please request a new OTP.")
    if time.time() * 1000 > record["expires"]:
        del _otp_store[key]
        raise HTTPException(400, detail="OTP has expired. Please request a new one.")
    if record["otp"] != str(body.otp):
        raise HTTPException(400, detail="Incorrect OTP. Please try again.")
    del _otp_store[key]
    return {"success": True, "verified": True}


# ── Register ──────────────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    name: Optional[str] = None
    email: str
    password: str
    role: str
    org_name: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state_name: Optional[str] = None
    country: Optional[str] = "India"
    pincode: Optional[str] = None
    photo: Optional[str] = None
    mobile_verified: bool = False
    email_verified: bool = False
    registration_number: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None

@router.post("/register", status_code=201)
async def register(body: RegisterIn, request: Request):
    import json
    valid_roles = ["candidate", "employer", "trainer", "placement_agency", "csr_org", "training_vendor"]
    if body.role not in valid_roles:
        raise HTTPException(400, detail="Invalid role")

    if body.role in ["candidate", "trainer", "employer", "csr_org", "placement_agency"]:
        if not body.mobile_verified:
            raise HTTPException(400, detail="Mobile OTP verification is required")
        if not body.email_verified:
            raise HTTPException(400, detail="Email OTP verification is required")
        if body.role in ["candidate", "trainer"] and not (body.first_name and body.last_name):
            raise HTTPException(400, detail="First name and last name are required")
        elif body.role not in ["candidate", "trainer"] and not body.first_name:
            raise HTTPException(400, detail="Contact Person Name is required")

    existing = await query_one("SELECT id FROM users WHERE email = $1", [body.email])
    if existing and body.role != "training_vendor":
        raise HTTPException(409, detail={"error": "Email already registered", "field": "email"})

    if body.role != "training_vendor" and body.phone:
        digits = "".join(c for c in body.phone if c.isdigit())[-10:]
        dup = await query_one("SELECT id FROM users WHERE RIGHT(REGEXP_REPLACE(phone,'\\D','','g'),10)=$1", [digits])
        if dup:
            raise HTTPException(409, detail={"error": "Mobile number is already registered.", "field": "phone"})

    full_name = (
        " ".join(filter(None, [body.first_name, body.middle_name, body.last_name]))
        if body.role in ["candidate", "trainer"]
        else (body.first_name or body.name or body.email.split("@")[0])
    )

    password_hash = pwd.hash(body.password)
    row = await execute_returning(
        """INSERT INTO users (name,email,password_hash,role,org_name,location,bio,skills,experience_years,
             first_name,middle_name,last_name,dob,gender,phone,
             address_line1,address_line2,city,state_name,country,pincode,photo)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
           RETURNING id""",
        [full_name, body.email, password_hash, body.role,
         body.org_name, body.location or body.city, body.bio,
         json.dumps(body.skills or []),
         body.first_name, body.middle_name, body.last_name,
         body.dob, body.gender, body.phone,
         body.address_line1, body.address_line2, body.city,
         body.state_name, body.country or "India", body.pincode, body.photo],
    )
    user = await query_one("SELECT * FROM users WHERE id = $1", [row["id"]])
    token = create_token(user)
    await log_audit(user, "User registered", "user", user["id"], f"Role: {user['role']}", request.client.host)
    return {"token": token, "user": _public_user(user)}


# ── Login ─────────────────────────────────────────────────────────────────────
class LoginIn(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(body: LoginIn, request: Request):
    user = await query_one("SELECT * FROM users WHERE email = $1", [body.email])
    if not user or not pwd.verify(body.password or "", user["password_hash"]):
        await log_audit(None, "Login failed", detail=f"Email: {body.email}", ip=request.client.host)
        raise HTTPException(401, detail="Invalid email or password")
    token = create_token(user)
    await log_audit(user, "Login", "user", user["id"], f"Role: {user['role']}", request.client.host)
    return {"token": token, "user": _public_user(user)}


# ── Forgot password ───────────────────────────────────────────────────────────
class ForgotIn(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(body: ForgotIn, request: Request):
    user = await query_one("SELECT * FROM users WHERE email = $1", [body.email])
    if not user:
        return {"success": True}
    import time
    token = secrets.token_hex(32)
    expires = int(time.time() * 1000) + 3600000
    await execute("UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE id=$3", [token, expires, user["id"]])
    await log_audit(user, "Password reset requested", "user", user["id"], ip=request.client.host)
    print(f"[RESET] Token for {body.email}: {token}")
    resp: dict = {"success": True}
    if os.getenv("NODE_ENV") != "production":
        resp["dev_token"] = token
    return resp


# ── Reset password ────────────────────────────────────────────────────────────
class ResetIn(BaseModel):
    token: str
    password: str

@router.post("/reset-password")
async def reset_password(body: ResetIn, request: Request):
    import time
    if len(body.password) < 6:
        raise HTTPException(400, detail="Password must be at least 6 characters")
    user = await query_one("SELECT * FROM users WHERE reset_token=$1", [body.token])
    if not user:
        raise HTTPException(400, detail="Invalid or expired reset link")
    if time.time() * 1000 > (user.get("reset_token_expires") or 0):
        await execute("UPDATE users SET reset_token=NULL, reset_token_expires=NULL WHERE id=$1", [user["id"]])
        raise HTTPException(400, detail="Reset link has expired. Please request a new one.")
    new_hash = pwd.hash(body.password)
    await execute("UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL WHERE id=$2", [new_hash, user["id"]])
    await log_audit(user, "Password reset completed", "user", user["id"], ip=request.client.host)
    return {"success": True}
