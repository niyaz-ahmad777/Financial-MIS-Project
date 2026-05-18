from pathlib import Path
import sqlite3

from flask import current_app
from werkzeug.security import generate_password_hash


SCHEMA_PATH = Path(__file__).resolve().parents[2] / "database" / "schema.sql"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(current_app.config["DATABASE_PATH"])
    conn.row_factory = sqlite3.Row
    return conn


def _seed_users(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]
    if count > 0:
        return

    conn.executemany(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
        [
            ("admin", generate_password_hash("admin123"), "admin"),
            ("analyst", generate_password_hash("analyst123"), "analyst")
        ]
    )


def _seed_transactions(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS total FROM transactions").fetchone()["total"]
    if count > 0:
        return

    conn.executemany(
        "INSERT INTO transactions (account, amount, type) VALUES (?, ?, ?)",
        [
            ("AC001", 1800.00, "transfer"),
            ("AC104", 9200.00, "withdrawal"),
            ("AC988", 400.00, "payment")
        ]
    )


def _seed_alerts(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) AS total FROM alerts").fetchone()["total"]
    if count > 0:
        return

    conn.executemany(
        "INSERT INTO alerts (level, message) VALUES (?, ?)",
        [
            ("HIGH", "Unusual high-value withdrawal detected"),
            ("MEDIUM", "Multiple failed login attempts")
        ]
    )


def init_database() -> None:
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with get_db_connection() as conn:
        conn.executescript(schema)
        _seed_users(conn)
        _seed_transactions(conn)
        _seed_alerts(conn)
        conn.commit()