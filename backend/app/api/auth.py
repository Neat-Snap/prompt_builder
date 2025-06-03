from fastapi import APIRouter, HTTPException, Request
from app.db.functions import *
from app.db.models import User
from app.settings import settings
from app.utils.auth import generate_jwt_token, hash_password
import loguru
import hashlib
import resend
import random

resend.api_key = settings.RESEND_API_KEY

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


email_send_log = {}

EMAIL_SEND_LIMIT = 2
TIME_WINDOW = timedelta(hours=1)

codes = {}

def send_email(email):
    logger.debug(f"Sending email to: {email}")
    code = random.randint(100000, 999999)
    codes[email] = code
    logger.debug(f"Code: {code}")

    params: resend.Emails.SendParams = {
        "from": "Confirmation <onboarding@face-cards.ru>",
        "to": [email],
        "subject": "Email address confirmation",
        "html": f"""
        <html>
        <head>
        <style>
            body {{
                background: #f4f6fb;
                font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 420px;
                margin: 40px auto;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                padding: 32px 28px 28px 28px;
                text-align: center;
            }}
            .title {{
                color: #2d3a4a;
                font-size: 1.7rem;
                margin-bottom: 18px;
                font-weight: 700;
            }}
            .code-box {{
                display: inline-block;
                background: #f0f4fa;
                color: #2d3a4a;
                font-size: 2.2rem;
                letter-spacing: 6px;
                font-weight: 600;
                border-radius: 8px;
                padding: 16px 32px;
                margin: 18px 0 24px 0;
                border: 1.5px solid #e0e6ed;
            }}
            .desc {{
                color: #5a6b7b;
                font-size: 1.05rem;
                margin-bottom: 24px;
            }}
            .footer {{
                color: #b0b8c1;
                font-size: 0.95rem;
                margin-top: 32px;
            }}
        </style>
        </head>
        <body>
        <div class="container">
            <div class="title">Email Address Confirmation</div>
            <div class="desc">Please use the code below to confirm your email address. This code is valid for a limited time.</div>
            <div class="code-box">{code}</div>
            <div class="footer">If you did not request this, you can safely ignore this email.<br>Thank you!</div>
        </div>
        </body>
        </html>
        """
    }

    email = resend.Emails.send(params)
    logger.info(f"Email sent: {email}")
    return email



def can_send_email(email: str):
    now = datetime.now()
    timestamps = email_send_log.get(email, [])
    timestamps = [ts for ts in timestamps if now - ts < TIME_WINDOW]
    if len(timestamps) >= EMAIL_SEND_LIMIT:
        return False
    timestamps.append(now)
    email_send_log[email] = timestamps
    return True


@router.post("/send_email")
async def send_email_endpoint(request: Request):
    email = request.state.email
    if not can_send_email(email):
        raise HTTPException(status_code=429, detail="Too many emails sent")

    email_data = await request.json()
    send_email(email_data["email"])
    return {"success": True, "message": "Email sent successfully"}


@router.post("/verify_code")
async def verify_code_endpoint(request: Request):
    logger.debug(f"Received verify code request for email: {request.state.email}")
    data = await request.json()
    email = request.state.email
    code = data["code"]
    old_email = None
    if "new_email" in data:
        old_email = email
        email = data["new_email"]
    logger.debug(f"Received code: {code}")
    logger.debug(f"Codes: {codes}")
    if int(codes.get(email)) != int(code):
        raise HTTPException(status_code=400, detail="Invalid code")
    del codes[email]

    if old_email:
        user = get_user_by_email(old_email)
    else:
        user = get_user_by_email(email)
    user["is_verified"] = True
    set_user(user)

    return {"success": True, "message": "Code verified successfully"}
