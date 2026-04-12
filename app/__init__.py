import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_caching import Cache
from flask_bcrypt import Bcrypt
from flask_dance.contrib.google import make_google_blueprint
from config import config
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
cache = Cache()
bcrypt = Bcrypt()
login_manager.login_view = "auth.login"
login_manager.login_message = None
def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    cache.init_app(app)
    bcrypt.init_app(app)
    from app.logger import setup_logger
    setup_logger(app)
    google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
    google_client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if google_client_id and google_client_secret:
        google_bp = make_google_blueprint(
            client_id=google_client_id,
            client_secret=google_client_secret,
            scope=["profile", "email"],
            redirect_url="/auth/google/callback"
        )
        app.register_blueprint(google_bp, url_prefix="/auth/google/login")
    @app.before_request
    def log_request():
        from flask import request
        app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
    @app.after_request
    def log_response(response):
        app.logger.info(f"Response: {response.status_code}")
        return response
    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Unhandled exception: {e}", exc_info=True)
        return {"error": "Internal server error"}, 500
    from app.routes.auth import auth_bp
    from app.routes.movies import movies_bp
    from app.routes.watchlist import watchlist_bp
    from app.routes.main import main_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(movies_bp, url_prefix="/api/movies")
    app.register_blueprint(watchlist_bp, url_prefix="/api/watchlist")
    app.register_blueprint(main_bp)
    return app