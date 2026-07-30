"""
Shared helpers for Python analytics API routes.
Not served as a route (underscore prefix).
"""

import os
import json
from pymongo import MongoClient

# MongoDB connection singleton
_client = None

# WorkOS JWKS client singleton (verifies access tokens locally, no network
# round trip per request beyond the JWKS key fetch, which PyJWKClient caches)
_workos_jwks_client = None

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


def _get_workos_jwks_client():
    """Get the WorkOS JWKS client (singleton)."""
    global _workos_jwks_client
    if _workos_jwks_client is None:
        import jwt
        client_id = os.environ.get("WORKOS_CLIENT_ID", os.environ.get("EXPO_PUBLIC_WORKOS_CLIENT_ID", ""))
        jwks_url = f"https://api.workos.com/sso/jwks/{client_id}"
        _workos_jwks_client = jwt.PyJWKClient(jwks_url)
    return _workos_jwks_client


def verify_admin(headers):
    """
    Validate a WorkOS access token and check admin role.
    Returns profile dict or None.
    """
    import jwt

    auth_header = headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]
    if not token:
        return None

    try:
        jwks_client = _get_workos_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(token, signing_key.key, algorithms=["RS256"])
        workos_user_id = payload.get("sub")
        if not workos_user_id:
            return None

        db = get_db()
        profile = db.profiles.find_one({"workos_user_id": workos_user_id})

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
