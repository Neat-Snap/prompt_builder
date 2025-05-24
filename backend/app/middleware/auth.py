from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import jwt
from jwt import PyJWTError
from app.settings import settings
from app.db.functions import get_user_by_email

allowed_paths = ["/health", "/auth/signup", "/auth/login"]

def check_url(url):
    for path in allowed_paths:
        if url.startswith(path):
            return True
    return False

class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow OPTIONS requests to pass through
        if request.method == "OPTIONS":
            return await call_next(request)

        if check_url(request.url.path):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                audience=settings.AUDIENCE
            )

            if not get_user_by_email(payload["sub"]):
                return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

            request.state.email = payload["sub"]
        except PyJWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})
        return await call_next(request)
