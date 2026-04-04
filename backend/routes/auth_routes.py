from flask import Blueprint, request

from ..models.user_model import authenticate_user, create_user, user_exists
from ..utils.auth import generate_token
from ..utils.security_rules import is_login_allowed

auth_bp = Blueprint("auth", __name__)


def normalize_identity(identity: str) -> str:
    value = (identity or "").strip().lower()
    if "@" in value:
        return value.split("@", 1)[0]
    return value


@auth_bp.post("/login")
def login() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    username = normalize_identity(payload.get("username") or payload.get("email") or "")
    password = payload.get("password", "")

    if not is_login_allowed(username):
        return {"success": False, "message": "Login blocked by security rules"}, 403

    user = authenticate_user(username, password)
    if user:
        token = generate_token(user)
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {"username": user["username"], "role": user["role"]}
        }, 200

    return {"success": False, "message": "Invalid username or password"}, 401


@auth_bp.post("/register")
def register() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()
    confirm_password = payload.get("confirm_password", "").strip()

    if not username or len(username) < 3:
        return {"success": False, "message": "Username must be at least 3 characters"}, 400

    if not password or len(password) < 6:
        return {"success": False, "message": "Password must be at least 6 characters"}, 400

    if password != confirm_password:
        return {"success": False, "message": "Passwords do not match"}, 400

    if user_exists(username):
        return {"success": False, "message": "Username already exists"}, 409

    try:
        user = create_user(username, password, role="analyst")
        token = generate_token(user)
        return {
            "success": True,
            "message": "Registration successful",
            "token": token,
            "user": {"username": user["username"], "role": user["role"]}
        }, 201
    except Exception as e:
        return {"success": False, "message": f"Registration failed: {str(e)}"}, 500
