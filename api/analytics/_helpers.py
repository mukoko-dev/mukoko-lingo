"""
Shared helpers for Python analytics API routes.
Not served as a route (underscore prefix).
"""

import os
import json
from pymongo import MongoClient

# MongoDB connection singleton
_client = None

def get_db():
    """Get MongoDB database connection (singleton)."""
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI", "")
        if not uri:
            raise RuntimeError("MONGODB_URI not configured")
        _client = MongoClient(uri, appName="mukoko-analytics")
    return _client["mukoko-lingo"]


def verify_admin(headers):
    """
    Validate Stytch session token and check admin role.
    Returns profile dict or None.
    """
    import stytch

    auth_header = headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]
    if not token:
        return None

    try:
        project_id = os.environ.get("STYTCH_PROJECT_ID", os.environ.get("EXPO_PUBLIC_STYTCH_PROJECT_ID", ""))
        secret = os.environ.get("STYTCH_SECRET", "")
        client = stytch.Client(project_id=project_id, secret=secret)

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
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
    handler.end_headers()
    handler.wfile.write(json.dumps(data, default=str).encode())


def handle_options(handler):
    """Handle CORS preflight."""
    handler.send_response(200)
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
    handler.end_headers()
