from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
from app.utils.auth import generate_jwt_token, hash_password
import loguru
import hashlib


router = APIRouter(
    prefix="/signup",
    tags=["signup"]
)

logger = loguru.logger

@router.post("/")
async def signup(request: Request):
    signup_data = await request.json()
    logger.info(f"Received signup request for email: {signup_data.get('email')}, name: {signup_data.get('name')}")

    user = get_user_by_email(signup_data["email"])
    if user:
        logger.warning(f"Signup attempt for existing user: {signup_data.get('email')}")
        raise HTTPException(status_code=400, detail="User already exists")

    user_data = {
        "name": signup_data["name"],
        "email": signup_data["email"],
        "password": hash_password(signup_data["password"])
    }

    success = set_user(user_data)
    if success:
        logger.info(f"User created successfully: {signup_data.get('email')}")
    else:
        logger.error(f"User creation failed: {signup_data.get('email')}")
        return

    token = generate_jwt_token(user_data['email'])

    return {"success": True, "message": "User created successfully", "token": token}
