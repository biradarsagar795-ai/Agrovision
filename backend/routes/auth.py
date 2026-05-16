import json
import random
import time
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import DATA_DIR

router = APIRouter(prefix="/api/auth", tags=["auth"])

USERS_FILE = DATA_DIR / "users.json"
OTP_STORE = {}  # In-memory store for demo (phone -> {otp, expiry})

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class FarmSetup(BaseModel):
    farm_name: str
    crop_type: str
    lat: float
    lon: float

def load_users():
    if not USERS_FILE.exists():
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

@router.post("/request-otp")
async def request_otp(req: OTPRequest):
    if len(req.phone) != 10 or not req.phone.isdigit():
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    OTP_STORE[req.phone] = {
        "otp": otp,
        "expiry": time.time() + 300 # 5 minutes
    }
    
    # In a real app, send via SMS/WhatsApp here.
    # For demo, we return it as a hint.
    return {"message": "OTP sent successfully", "otp_hint": otp}

@router.post("/verify-otp")
async def verify_otp(req: OTPVerify):
    record = OTP_STORE.get(req.phone)
    if not record or record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if time.time() > record["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired")
        
    del OTP_STORE[req.phone]
    
    users = load_users()
    is_new = req.phone not in users
    token = f"demo_token_{uuid.uuid4().hex}"
    
    if is_new:
        users[req.phone] = {"phone": req.phone, "token": token, "setup_complete": False}
        save_users(users)
        return {"token": token, "is_new_user": True}
    else:
        users[req.phone]["token"] = token
        save_users(users)
        return {"token": token, "is_new_user": not users[req.phone].get("setup_complete"), "user": users[req.phone]}

@router.post("/setup-farm")
async def setup_farm(req: FarmSetup):
    # In a real app, extract user from JWT token
    # For demo, we'll just update the most recently created user or find by some means
    users = load_users()
    
    # Find user (demo simplification)
    user_key = list(users.keys())[-1] if users else None
    if not user_key:
         raise HTTPException(status_code=401, detail="Unauthorized")
         
    users[user_key].update({
        "farm_name": req.farm_name,
        "crop_type": req.crop_type,
        "lat": req.lat,
        "lon": req.lon,
        "setup_complete": True
    })
    save_users(users)
    return {"message": "Setup complete", "user": users[user_key]}
