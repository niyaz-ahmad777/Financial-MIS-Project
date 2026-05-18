import sqlite3

from flask import Blueprint, request

from ..models.user_model import authenticate_user, create_user, user_exists
from ..utils.auth import generate_token
from ..utils.security_rules import is_login_allowed

auth_bp = Blueprint("auth", __name__)


def normalize_identity(identity: str) -> str:
    value = (identity or "").strip().lower()
    return value


def identity_candidates(identity: str) -> list[str]:
    normalized = normalize_identity(identity)
    if not normalized:
        return []

    candidates = [normalized]
    if "@" in normalized:
        local_part = normalized.split("@", 1)[0]
        if local_part and local_part not in candidates:
            candidates.append(local_part)
    return candidates


@auth_bp.post("/login")
def login() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    raw_identity = payload.get("email") or payload.get("username") or ""
    candidates = identity_candidates(raw_identity)
    password = payload.get("password", "")

    if not candidates:
        return {"success": False, "message": "Email or username is required"}, 400

    if not any(is_login_allowed(candidate) for candidate in candidates):
        return {"success": False, "message": "Login blocked by security rules"}, 403

    user = None
    for candidate in candidates:
        user = authenticate_user(candidate, password)
        if user:
            break

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
    raw_identity = payload.get("email") or payload.get("username") or ""
    username = normalize_identity(raw_identity)
    password = payload.get("password", "").strip()
    confirm_password = payload.get("confirm_password", "").strip()

    if not username or len(username) < 3:
        return {"success": False, "message": "Email or username must be at least 3 characters"}, 400

    if not password or len(password) < 6:
        return {"success": False, "message": "Password must be at least 6 characters"}, 400

    if password != confirm_password:
        return {"success": False, "message": "Passwords do not match"}, 400

    if user_exists(username):
        return {"success": False, "message": "User already exists"}, 409

    try:
        user = create_user(username, password, role="analyst")
        token = generate_token(user)
        return {
            "success": True,
            "message": "Registration successful",
            "token": token,
            "user": {"username": user["username"], "role": user["role"]}
        }, 201
    except sqlite3.IntegrityError:
        return {"success": False, "message": "User already exists"}, 409
