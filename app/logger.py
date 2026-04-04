import logging
import os
from logging.handlers import RotatingFileHandler
def setup_logger(app):
    # Set the logging level — DEBUG captures everything,
    # INFO skips verbose debug messages in production
    log_level = logging.DEBUG if app.config.get("DEBUG") else logging.INFO
    # Create a formatter that adds timestamp, level, and location to every log line
    # This makes it easy to search logs by time or severity
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    # File handler — writes logs to a file on disk
    # Only use this locally since Railway's filesystem is ephemeral
    if not os.environ.get("RAILWAY_ENVIRONMENT"):
        os.makedirs("logs", exist_ok=True)
        file_handler = RotatingFileHandler(
            "logs/cinevault.log",
            maxBytes=1_000_000,  # 1MB per file
            backupCount=5        # keep 5 old files
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)
        app.logger.addHandler(file_handler)
    # Stream handler — prints to console and Railway logs dashboard
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    stream_handler.setLevel(log_level)
    app.logger.addHandler(stream_handler)
    app.logger.setLevel(log_level)
    app.logger.info("CineVault logger initialized.")
