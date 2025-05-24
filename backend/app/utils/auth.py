import jwt
from app.settings import settings
from datetime import datetime, timedelta
import hashlib

KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
EXP = settings.ACCESS_TOKEN_EXPIRE_HOURS
AUD = settings.AUDIENCE

def generate_jwt_token(email):
    payload = {
        "sub": email,
        "aud": AUD,
        "exp": datetime.utcnow() + timedelta(hours=EXP)
    }

    token = jwt.encode(payload, KEY, algorithm=ALGORITHM)
    return token

def hash_password(password_string):
    result = hashlib.sha256(password_string.encode()).hexdigest()
    return result