from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.utils.auth import generate_jwt_token, hash_password
import loguru
import hashlib


router = APIRouter(
    prefix="/login",
    tags=["login"]
)

logger = loguru.logger

@router.post("/")
async def signup(request: Request):
    login_data = await request.json()
    logger.info(f"Received login request for email: {login_data.get('email')}, name: {login_data.get('name')}")

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
