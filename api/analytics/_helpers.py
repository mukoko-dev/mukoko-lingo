"""
Shared helpers for Python analytics API routes.
Not served as a route (underscore prefix).
"""

import os
import json
from pymongo import MongoClient

# MongoDB connection singleton
_client = None

# Stytch client singleton
_stytch_client = None

# CORS allowed origins (must match api/_lib/cors.ts)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19006",
    "https://mukoko.com",
    "https://www.mukoko.com",
    "https://lingo.mukoko.com",
    "https://mukoko-lingo.vercel.app",
]


def _get_allowed_origin(headers):
    """Return the origin if it's in the allowlist, otherwise empty string."""
    origin = headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS or origin.endswith(".vercel.app"):
        return origin
    return ""


def get_db():
    """Get MongoDB database connection (singleton)."""
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI", "")
        if not uri:
            raise RuntimeError("MONGODB_URI not configured")
        _client = MongoClient(uri, appName="mukoko-analytics")
    return _client["mukoko-lingo"]


def _get_stytch_client():
    """Get Stytch client (singleton)."""
    global _stytch_client
    if _stytch_client is None:
        import stytch
        project_id = os.environ.get("STYTCH_PROJECT_ID", os.environ.get("EXPO_PUBLIC_STYTCH_PROJECT_ID", ""))
        secret = os.environ.get("STYTCH_SECRET", "")
        _stytch_client = stytch.Client(project_id=project_id, secret=secret)
    return _stytch_client


def verify_admin(headers):
    """
    Validate Stytch session token and check admin role.
    Returns profile dict or None.
    """
    auth_header = headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]
    if not token:
        return None

    try:
        client = _get_stytch_client()
        resp = client.sessions.authenticate(session_token=token)
        stytch_user_id = resp.session.user_id

        db = get_db()
        profile = db.profiles.find_one({"stytch_user_id": stytch_user_id})

        if not profile or profile.get("role") != "admin":
            return None

        return profile
    except Exception:
        return None


def json_response(handler, status, data):
    """Send a JSON response."""
    origin = _get_allowed_origin(handler.headers)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    if origin:
        handler.send_header("Access-Control-Allow-Origin", origin)
    handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
    handler.end_headers()
    handler.wfile.write(json.dumps(data, default=str).encode())


def handle_options(handler):
    """Handle CORS preflight."""
    origin = _get_allowed_origin(handler.headers)
    handler.send_response(200)
    if origin:
        handler.send_header("Access-Control-Allow-Origin", origin)
    handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
    handler.end_headers()
