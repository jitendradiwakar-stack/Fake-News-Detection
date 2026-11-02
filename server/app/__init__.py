import os
import secrets
from flask import Flask, jsonify
from flask_cors import CORS
from app.limiter import limiter
from app.services.ml_service import MLDetectionService
from app.routes.detector import detector_bp
from app.routes.auth_routes import auth_bp
from app.routes.history_routes import history_bp
from app.routes.account_routes import account_bp
from app.routes.fact_check_routes import fact_check_bp
from app.routes.recommendation_routes import recommendation_bp
from app.services.fact_check_service import sync_engine


def create_app(enable_scheduler: bool = True):
    app = Flask(__name__)

    # Secret key configuration
    flask_secret = os.environ.get('SECRET_KEY')
    is_prod = (os.environ.get('FLASK_ENV') == 'production' or 
               os.environ.get('ENV') == 'production' or 
               os.environ.get('ENVIRONMENT') == 'production')
    if not flask_secret:
        if is_prod:
            raise RuntimeError("CRITICAL SECURITY ERROR: SECRET_KEY environment variable is mandatory in production!")
        app.config['SECRET_KEY'] = secrets.token_hex(32)
        app.logger.warning("SECURITY WARNING: SECRET_KEY not set in environment. Generated random ephemeral key for development.")
    else:
        app.config['SECRET_KEY'] = flask_secret

    # Security: Configure CORS with explicit trusted origins and credentials
    trusted_origins = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173"
    ]
    env_origins = os.getenv("CORS_ALLOWED_ORIGINS")
    if env_origins:
        for origin in env_origins.split(","):
            cleaned = origin.strip()
            if cleaned and cleaned not in trusted_origins:
                trusted_origins.append(cleaned)

    CORS(app, resources={
        r"/api/*": {
            "origins": trusted_origins,
            "methods": ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    })

    # Initialize Rate Limiter
    limiter.init_app(app)

    @app.errorhandler(429)
    def ratelimit_exceeded(e):
        return jsonify({
            'error': 'Too Many Requests',
            'message': f'Rate limit exceeded: {e.description or "Too many requests. Please try again later."}'
        }), 429

    # Load offline ML models
    try:
        MLDetectionService.load_models()
        app.logger.info("SatyaCheck: Multilingual ML models loaded successfully")
    except Exception as e:
        app.logger.error(f"Failed to load ML models: {str(e)}")

    # Register API Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(history_bp, url_prefix='/api')
    app.register_blueprint(account_bp, url_prefix='/api')
    app.register_blueprint(detector_bp, url_prefix='/api')
    app.register_blueprint(fact_check_bp, url_prefix='/api')
    app.register_blueprint(recommendation_bp, url_prefix='/api')

    # Initialize automated real-time background fact-check scheduler
    if enable_scheduler and not os.environ.get('DISABLE_FACT_CHECK_SCHEDULER'):
        try:
            sync_engine.start_scheduler()
            app.logger.info("SatyaCheck: Real-Time Fact-Check Background Scheduler initialized")
        except Exception as e:
            app.logger.warning(f"Could not start fact-check scheduler: {e}")

    return app
