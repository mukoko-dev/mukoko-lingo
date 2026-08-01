"""
Tests for api/analytics/_helpers.py — the shared CORS/auth/db helpers every
Python analytics route imports. Runs against mocks only; never touches a
real MongoDB or WorkOS JWKS endpoint.
"""

import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import _helpers  # noqa: E402


class FakeHeaders(dict):
    """Mimics http.server's case-insensitive header mapping via .get()."""


def make_handler(headers):
    handler = MagicMock()
    handler.headers = FakeHeaders(headers)
    return handler


class TestGetAllowedOrigin:
    def test_allowlisted_origin_is_echoed(self):
        assert _helpers._get_allowed_origin({"Origin": "https://lingo.mukoko.com"}) == "https://lingo.mukoko.com"

    def test_vercel_preview_domain_is_allowed(self):
        assert _helpers._get_allowed_origin({"Origin": "https://mukoko-lingo-git-foo.vercel.app"}) == (
            "https://mukoko-lingo-git-foo.vercel.app"
        )

    def test_unknown_origin_is_rejected(self):
        assert _helpers._get_allowed_origin({"Origin": "https://evil.example.com"}) == ""

    def test_missing_origin_header(self):
        assert _helpers._get_allowed_origin({}) == ""


class TestGetDb:
    def test_uses_the_real_shared_lingo_database_not_the_invented_one(self):
        """
        Regression guard: an earlier version of get_db() pointed at the
        invented, never-populated `mukoko-lingo` database instead of the
        real shared `lingo` database (the same bug the TS side fixed in
        PR #24, never mirrored here). Every analytics query silently
        returned nothing until this was caught.
        """
        _helpers._client = None
        fake_client = MagicMock()
        with patch.dict(os.environ, {"MONGODB_URI": "mongodb://fake-uri"}), \
                patch.object(_helpers, "MongoClient", return_value=fake_client):
            _helpers.get_db()
        fake_client.__getitem__.assert_called_once_with("lingo")
        _helpers._client = None

    def test_raises_without_a_configured_uri(self):
        _helpers._client = None
        with patch.dict(os.environ, {}, clear=True):
            try:
                _helpers.get_db()
                assert False, "expected RuntimeError"
            except RuntimeError:
                pass
        _helpers._client = None


class TestVerifyAdmin:
    def test_missing_authorization_header_returns_none(self):
        assert _helpers.verify_admin(FakeHeaders({})) is None

    def test_non_bearer_authorization_header_returns_none(self):
        assert _helpers.verify_admin(FakeHeaders({"Authorization": "Basic abc123"})) is None

    def test_empty_bearer_token_returns_none(self):
        assert _helpers.verify_admin(FakeHeaders({"Authorization": "Bearer "})) is None

    def test_jwt_verification_failure_returns_none(self):
        with patch.object(_helpers, "_get_workos_jwks_client", side_effect=Exception("jwks unreachable")):
            result = _helpers.verify_admin(FakeHeaders({"Authorization": "Bearer some-token"}))
        assert result is None


class TestJsonResponse:
    def test_writes_status_headers_and_body(self):
        handler = make_handler({"Origin": "https://lingo.mukoko.com"})
        _helpers.json_response(handler, 200, {"ok": True})

        handler.send_response.assert_called_once_with(200)
        handler.wfile.write.assert_called_once()
        written = handler.wfile.write.call_args[0][0]
        assert b'"ok": true' in written


class TestHandleOptions:
    def test_sends_200_with_cors_headers(self):
        handler = make_handler({"Origin": "https://lingo.mukoko.com"})
        _helpers.handle_options(handler)

        handler.send_response.assert_called_once_with(200)
        handler.end_headers.assert_called_once()
