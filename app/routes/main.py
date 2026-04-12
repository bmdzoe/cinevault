from flask import Blueprint, render_template, send_from_directory
import os
main_bp = Blueprint("main", __name__)
@main_bp.route("/", defaults={"path": ""})
@main_bp.route("/<path:path>")
def index(path):
    react_build = os.path.join(os.path.dirname(__file__), '..', 'static', 'react')
    if path and os.path.exists(os.path.join(react_build, path)):
        return send_from_directory(react_build, path)
    return send_from_directory(react_build, 'index.html')