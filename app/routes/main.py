from flask import Blueprint, render_template
main_bp = Blueprint("main", __name__)
@main_bp.route("/")
def index():
    return render_template("index.html")
@main_bp.route("/vault")
def vault_page():
    return render_template("vault.html")
@main_bp.route("/watchlist")
def watchlist_page():
    return render_template("watchlist.html")
@main_bp.route("/login")
def login_page():
    return render_template("auth.html", mode="login")
@main_bp.route("/register")
def register_page():
    return render_template("auth.html", mode="register")
