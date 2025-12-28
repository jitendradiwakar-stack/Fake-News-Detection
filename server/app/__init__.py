from flask import Flask
from flask_cors import CORS
from app.services.ml_service import MLDetectionService
from app.routes.detector import detector_bp


def create_app():
    app = Flask(__name__)

    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:8080", "http://localhost:5173"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    })

    try:
        MLDetectionService.load_models()
        app.logger.info("ML models loaded successfully")
    except Exception as e:
        app.logger.error(f"Failed to load ML models: {str(e)}")

    app.register_blueprint(detector_bp, url_prefix='/api')

    return app
