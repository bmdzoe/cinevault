from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_caching import Cache
from flask_bcrypt import Bcrypt
from config import config
from flask_dance.contrib.google import make_google_blueprint
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
cache = Cache()
bcrypt = Bcrypt()
login_manager.login_view = "auth.login"
login_manager.login_message = None
login_manager.login_message_category = "info"
def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    cache.init_app(app)
    bcrypt.init_app(app)
    google_bp = make_google_blueprint(
    client_id=app.config["GOOGLE_OAUTH_CLIENT_ID"],
    client_secret=app.config["GOOGLE_OAUTH_CLIENT_SECRET"],
    scope=["profile", "email"],
    redirect_url="/auth/google/callback"
)
app.register_blueprint(google_bp, url_prefix="/auth/google/login")
    # Set up logging before anything else so we capture all startup events
    from app.logger import setup_logger
    setup_logger(app)
    # Log every single incoming request automatically
    # This gives you a full picture of traffic without touching every route
    @app.before_request
    def log_request():
        from flask import request
        app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
    # Log every response — useful for spotting patterns in errors
    @app.after_request
    def log_response(response):
        app.logger.info(f"Response: {response.status_code}")
        return response
    # Log unhandled exceptions with full stack trace
    # Without this you just see a 500 error with no details
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
