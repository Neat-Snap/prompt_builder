from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
from app.utils.auth import generate_jwt_token, hash_password
import loguru
import hashlib


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

logger = loguru.logger

@router.post("/signup")
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
        "password": signup_data["password"]
    }

    success = create_user(user_data)
    if success:
        logger.info(f"User created successfully: {signup_data.get('email')}")
    else:
        logger.error(f"User creation failed: {signup_data.get('email')}")
        return

    token = generate_jwt_token(user_data['email'])

    return {"success": True, "message": "User created successfully", "token": token}


@router.post("/login")
async def signup(request: Request):
    login_data = await request.json()
    logger.info(f"Received login request for email: {login_data.get('email')}")

    user = get_user_by_email(login_data["email"])
    if not user:
        logger.warning(f"Loging attempt for non-existing user: {login_data.get('email')}")
        raise HTTPException(status_code=400, detail="User does not exists")

    existing_hashed_password = user["hashed_password"]
    given_password = login_data.get("password")
    given_hashed_password = hash_password(given_password)

    if existing_hashed_password != given_hashed_password:
        logger.info(f"Logging attempt failed due to the incorrect password for user {login_data.get("email")}")
        return HTTPException(status_code=400, detail="Incorrect password")

    token = generate_jwt_token(user['email'])

    return {"success": True, "message": "User logged in successfully", "token": token}