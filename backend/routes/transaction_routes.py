from flask import Blueprint, g, make_response, request

from ..models.transaction_model import (
    build_transactions_csv,
    build_transactions_pdf,
    create_transaction,
    delete_transaction,
    filter_transactions_by_period,
    filter_transactions_by_query,
    get_summary,
    get_transactions,
    update_transaction,
)
from ..utils.auth import auth_required
from ..utils.fraud_detection import score_transaction_risk

transaction_bp = Blueprint("transactions", __name__)


def require_admin() -> tuple[dict, int] | None:
    current_user = getattr(g, "current_user", {}) or {}
    if str(current_user.get("role", "")).lower() != "admin":
        return {"message": "Admin access required"}, 403
    return None


@transaction_bp.get("")
@auth_required
def list_transactions() -> tuple[dict, int]:
    transactions = get_transactions()
    for tx in transactions:
        tx["risk"] = score_transaction_risk(tx)
    transactions = filter_transactions_by_query(
        transactions,
        search=request.args.get("search"),
        status=request.args.get("status")
    )
    return {"transactions": transactions}, 200


@transaction_bp.post("")
@auth_required
def add_transaction() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    account = str(payload.get("account", "")).strip()
    tx_type = str(payload.get("type", "")).strip().lower()

    try:
        amount = float(payload.get("amount", 0))
    except (TypeError, ValueError):
        return {"message": "Amount must be a number"}, 400

    if not account:
        return {"message": "Account is required"}, 400
    if tx_type not in {"transfer", "withdrawal", "payment"}:
        return {"message": "Type must be transfer, withdrawal or payment"}, 400
    if amount <= 0:
        return {"message": "Amount must be greater than zero"}, 400

    tx = create_transaction(account, amount, tx_type)
    tx["risk"] = score_transaction_risk(tx)
    return {"message": "Transaction created", "transaction": tx}, 201


@transaction_bp.put("/<int:tx_id>")
@auth_required
def edit_transaction(tx_id: int) -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    account = str(payload.get("account", "")).strip()
    tx_type = str(payload.get("type", "")).strip().lower()

    try:
        amount = float(payload.get("amount", 0))
    except (TypeError, ValueError):
        return {"message": "Amount must be a number"}, 400

    if not account:
        return {"message": "Account is required"}, 400
    if tx_type not in {"transfer", "withdrawal", "payment"}:
        return {"message": "Type must be transfer, withdrawal or payment"}, 400
    if amount <= 0:
        return {"message": "Amount must be greater than zero"}, 400

    tx = update_transaction(tx_id, account, amount, tx_type)
    if tx is None:
        return {"message": "Transaction not found"}, 404

    tx["risk"] = score_transaction_risk(tx)
    return {"message": "Transaction updated", "transaction": tx}, 200


@transaction_bp.delete("/<int:tx_id>")
@auth_required
def remove_transaction(tx_id: int) -> tuple[dict, int]:
    admin_error = require_admin()
    if admin_error:
        return admin_error

    if not delete_transaction(tx_id):
        return {"message": "Transaction not found"}, 404
    return {"message": "Transaction deleted"}, 200


@transaction_bp.get("/summary")
@auth_required
def summary() -> tuple[dict, int]:
    return get_summary(), 200


@transaction_bp.get("/report")
@auth_required
def report():
    admin_error = require_admin()
    if admin_error:
        return admin_error

    report_format = (request.args.get("format") or "csv").strip().lower()
    period = (request.args.get("period") or "monthly").strip().lower()

    transactions = get_transactions()
    for tx in transactions:
        tx["risk"] = score_transaction_risk(tx)
    transactions = filter_transactions_by_period(transactions, period)

    if report_format == "pdf":
        pdf_data = build_transactions_pdf(transactions, period)
        response = make_response(pdf_data)
        response.headers["Content-Type"] = "application/pdf"
        response.headers["Content-Disposition"] = f"attachment; filename=transactions_{period}_report.pdf"
        return response

    csv_data = build_transactions_csv(transactions)
    response = make_response(csv_data)
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = f"attachment; filename=transactions_{period}_report.csv"
    return response
