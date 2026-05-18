from pathlib import Path
import sys

from flask import Flask
from flask_cors import CORS

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from backend.models.db import init_database
from backend.routes.auth_routes import auth_bp
from backend.routes.transaction_routes import transaction_bp
from backend.routes.alert_routes import alert_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object("backend.config.Config")
    CORS(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(transaction_bp, url_prefix="/api/transactions")
    app.register_blueprint(alert_bp, url_prefix="/api/alerts")

    with app.app_context():
        init_database()

    @app.route("/api/health", methods=["GET"])
    def health() -> tuple[dict, int]:
        return {"status": "ok"}, 200

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(debug=True)
