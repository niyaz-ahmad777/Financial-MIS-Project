import csv
import importlib
import io
from datetime import datetime

from .db import get_db_connection


def get_transactions() -> list[dict]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT id, account, amount, type, created_at FROM transactions ORDER BY id DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def create_transaction(account: str, amount: float, tx_type: str) -> dict:
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO transactions (account, amount, type) VALUES (?, ?, ?)",
            (account, amount, tx_type)
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, account, amount, type, created_at FROM transactions WHERE id = ?",
            (cursor.lastrowid,)
        ).fetchone()
    return dict(row)


def update_transaction(tx_id: int, account: str, amount: float, tx_type: str) -> dict | None:
    with get_db_connection() as conn:
        result = conn.execute(
            "UPDATE transactions SET account = ?, amount = ?, type = ? WHERE id = ?",
            (account, amount, tx_type, tx_id)
        )
        conn.commit()
        if result.rowcount == 0:
            return None
        row = conn.execute(
            "SELECT id, account, amount, type, created_at FROM transactions WHERE id = ?",
            (tx_id,)
        ).fetchone()
    return dict(row) if row else None


def delete_transaction(tx_id: int) -> bool:
    with get_db_connection() as conn:
        result = conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
        conn.commit()
    return result.rowcount > 0


def get_summary() -> dict:
    with get_db_connection() as conn:
        total_transactions = conn.execute("SELECT COUNT(*) AS total FROM transactions").fetchone()["total"]
        total_alerts = conn.execute("SELECT COUNT(*) AS total FROM alerts").fetchone()["total"]
        high_risk = conn.execute(
            "SELECT COUNT(*) AS total FROM transactions WHERE amount >= 5000"
        ).fetchone()["total"]

    return {
        "total_transactions": total_transactions,
        "total_alerts": total_alerts,
        "high_risk": high_risk
    }


def build_transactions_csv(transactions: list[dict]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "account", "amount", "type", "risk", "created_at"])
    for tx in transactions:
        writer.writerow(
            [
                tx.get("id"),
                tx.get("account"),
                tx.get("amount"),
                tx.get("type"),
                tx.get("risk"),
                tx.get("created_at")
            ]
        )

    return output.getvalue()


def filter_transactions_by_query(
    transactions: list[dict],
    *,
    search: str | None = None,
    status: str | None = None
) -> list[dict]:
    filtered = transactions

    if search:
        needle = search.strip().lower()
        filtered = [
            tx
            for tx in filtered
            if needle in str(tx.get("id", "")).lower()
            or needle in str(tx.get("account", "")).lower()
            or needle in str(tx.get("type", "")).lower()
        ]

    if status and status.lower() in {"fraud", "normal"}:
        want_fraud = status.lower() == "fraud"
        filtered = [
            tx
            for tx in filtered
            if (str(tx.get("risk", "")).upper() == "HIGH") == want_fraud
        ]

    return filtered


def filter_transactions_by_period(transactions: list[dict], period: str) -> list[dict]:
    period_normalized = (period or "monthly").strip().lower()
    if period_normalized not in {"daily", "monthly"}:
        return transactions

    now = datetime.now()
    filtered: list[dict] = []
    for tx in transactions:
        created_raw = tx.get("created_at")
        if not created_raw:
            continue
        try:
            created = datetime.fromisoformat(str(created_raw).replace("Z", "+00:00"))
        except ValueError:
            continue

        if period_normalized == "daily" and created.date() == now.date():
            filtered.append(tx)
        elif period_normalized == "monthly" and created.year == now.year and created.month == now.month:
            filtered.append(tx)

    return filtered


def build_transactions_pdf(transactions: list[dict], period: str) -> bytes:
    try:
        pagesizes = importlib.import_module("reportlab.lib.pagesizes")
        canvas_module = importlib.import_module("reportlab.pdfgen.canvas")
        a4_page = pagesizes.A4
        canvas_class = canvas_module.Canvas
    except Exception as exc:
        raise RuntimeError("reportlab is required for PDF export") from exc

    buffer = io.BytesIO()
    pdf = canvas_class(buffer, pagesize=a4_page)
    page_width, page_height = a4_page

    y = page_height - 48
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, y, f"Financial MIS Transactions Report ({period.title()})")
    y -= 24
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, "ID")
    pdf.drawString(80, y, "Account")
    pdf.drawString(170, y, "Amount")
    pdf.drawString(250, y, "Type")
    pdf.drawString(320, y, "Risk")
    pdf.drawString(380, y, "Created")
    y -= 12
    pdf.line(40, y, page_width - 40, y)
    y -= 14

    for tx in transactions:
        if y < 48:
            pdf.showPage()
            y = page_height - 48
            pdf.setFont("Helvetica", 10)

        created = str(tx.get("created_at", ""))[:19]
        pdf.drawString(40, y, str(tx.get("id", "")))
        pdf.drawString(80, y, str(tx.get("account", ""))[:14])
        pdf.drawString(170, y, str(tx.get("amount", ""))[:10])
        pdf.drawString(250, y, str(tx.get("type", ""))[:10])
        pdf.drawString(320, y, str(tx.get("risk", ""))[:8])
        pdf.drawString(380, y, created)
        y -= 14

    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()
