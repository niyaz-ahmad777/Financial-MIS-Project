from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_db_connection


def get_user_by_username(username: str) -> dict | None:
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT id, username, password_hash, role FROM users WHERE username = ?",
            (username,)
        ).fetchone()

    return dict(row) if row else None


def user_exists(username: str) -> bool:
    return get_user_by_username(username) is not None


def authenticate_user(username: str, password: str) -> dict | None:
    user = get_user_by_username(username)
    if not user:
        return None

    stored_password = user["password_hash"]
    try:
        valid = check_password_hash(stored_password, password)
    except Exception:
        valid = stored_password == password
    
    if not valid:
        return None

    return {"id": user["id"], "username": user["username"], "role": user["role"]}


def create_user(username: str, password: str, role: str = "analyst") -> dict:
    password_hash = generate_password_hash(password)
    
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, password_hash, role)
        )
        conn.commit()
        
        row = conn.execute(
            "SELECT id, username, role FROM users WHERE username = ?",
            (username,)
        ).fetchone()

    return dict(row) if row else {"username": username, "role": role}

