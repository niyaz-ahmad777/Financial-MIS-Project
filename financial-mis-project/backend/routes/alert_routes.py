from flask import Blueprint

from ..models.alert_model import get_alerts
from ..utils.auth import auth_required

alert_bp = Blueprint("alerts", __name__)


@alert_bp.get("")
@auth_required
def list_alerts() -> tuple[dict, int]:
    return {"alerts": get_alerts()}, 200
