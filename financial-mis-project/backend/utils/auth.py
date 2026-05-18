import datetime as dt
from functools import wraps

import jwt
from flask import current_app, g, request


def generate_token(user: dict) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    exp_time = now + dt.timedelta(hours=8)
    payload = {
        "sub": user["username"],
        "role": user["role"],
        "iat": int(now.timestamp()),
        "exp": int(exp_time.timestamp())
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])


def auth_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"message": "Missing bearer token"}, 401

        token = auth_header.removeprefix("Bearer ").strip()
        if not token:
            return {"message": "Missing bearer token"}, 401

        try:
            payload = decode_token(token)
        except jwt.InvalidTokenError:
            return {"message": "Invalid or expired token"}, 401

        g.current_user = payload
        return func(*args, **kwargs)

    return wrapper