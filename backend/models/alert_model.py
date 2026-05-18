from .db import get_db_connection


def get_alerts() -> list[dict]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT id, level, message, created_at FROM alerts ORDER BY id DESC"
        ).fetchall()
    return [dict(row) for row in rows]
