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


class TestGetPhraseText:
    def test_extracts_text_for_the_requested_language_tag(self):
        """
        Regression guard: an earlier version read a flat `phrase["english"]`
        field that doesn't exist on the real lingo.phrases schema — text
        lives in translations[], keyed by BCP-47 languageTag — so this
        always silently returned "Unknown".
        """
        phrase = {
            "translations": [
                {"languageTag": "en", "text": "Hello"},
                {"languageTag": "sn", "text": "Mhoro"},
            ]
        }
        assert _helpers.get_phrase_text(phrase, "en") == "Hello"
        assert _helpers.get_phrase_text(phrase, "sn") == "Mhoro"

    def test_falls_back_to_unknown_for_a_missing_language_tag(self):
        phrase = {"translations": [{"languageTag": "en", "text": "Hello"}]}
        assert _helpers.get_phrase_text(phrase, "zh") == "Unknown"

    def test_falls_back_to_unknown_with_no_translations_array(self):
        assert _helpers.get_phrase_text({}) == "Unknown"


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
    def test_defaults_to_the_real_shared_lingo_database_not_the_invented_one(self):
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

    def test_accepts_a_different_database_name_for_shared_ecosystem_dbs(self):
        """
        Mirrors lib/db/mongo.ts's getDb(name?) — verify_admin needs
        `identity` (for identity.persons) and engagement.py needs
        `shamwari` (for shamwari.conversations); both are sibling
        databases on the same cluster, not Lingo's own `lingo` db.
        """
        _helpers._client = None
        fake_client = MagicMock()
        with patch.dict(os.environ, {"MONGODB_URI": "mongodb://fake-uri"}), \
                patch.object(_helpers, "MongoClient", return_value=fake_client):
            _helpers.get_db("identity")
        fake_client.__getitem__.assert_called_once_with("identity")
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

    def _mock_jwt(self, workos_user_id="workos-user-1"):
        fake_jwks_client = MagicMock()
        fake_jwks_client.get_signing_key_from_jwt.return_value.key = "fake-signing-key"
        jwt_decode_patch = patch("jwt.decode", return_value={"sub": workos_user_id})
        jwks_patch = patch.object(_helpers, "_get_workos_jwks_client", return_value=fake_jwks_client)
        return jwt_decode_patch, jwks_patch

    def test_no_matching_identity_person_returns_none(self):
        """
        identity.persons is keyed on workosUserId, not a `profiles`
        collection — a token for a WorkOS user with no matching person
        document must be rejected, not raise.
        """
        jwt_patch, jwks_patch = self._mock_jwt()
        fake_identity_db = MagicMock()
        fake_identity_db.persons.find_one.return_value = None
        with jwt_patch, jwks_patch, patch.object(_helpers, "get_db", return_value=fake_identity_db) as get_db_mock:
            result = _helpers.verify_admin(FakeHeaders({"Authorization": "Bearer tok"}))
        assert result is None
        get_db_mock.assert_called_once_with("identity")

    def test_person_without_admin_learner_profile_returns_none(self):
        """
        Role lives on lingo.learner_profiles (keyed on person_id), not on
        identity.persons — a real person with a non-admin role must be
        rejected.
        """
        jwt_patch, jwks_patch = self._mock_jwt()
        fake_identity_db = MagicMock()
        fake_identity_db.persons.find_one.return_value = {"_id": "person-1"}
        fake_lingo_db = MagicMock()
        fake_lingo_db.learner_profiles.find_one.return_value = {"person_id": "person-1", "role": "user"}

        def get_db_side_effect(name="lingo"):
            return fake_identity_db if name == "identity" else fake_lingo_db

        with jwt_patch, jwks_patch, patch.object(_helpers, "get_db", side_effect=get_db_side_effect):
            result = _helpers.verify_admin(FakeHeaders({"Authorization": "Bearer tok"}))
        assert result is None

    def test_admin_person_returns_person_id_and_role(self):
        jwt_patch, jwks_patch = self._mock_jwt()
        fake_identity_db = MagicMock()
        fake_identity_db.persons.find_one.return_value = {"_id": "person-1"}
        fake_lingo_db = MagicMock()
        fake_lingo_db.learner_profiles.find_one.return_value = {"person_id": "person-1", "role": "admin"}

        def get_db_side_effect(name="lingo"):
            return fake_identity_db if name == "identity" else fake_lingo_db

        with jwt_patch, jwks_patch, patch.object(_helpers, "get_db", side_effect=get_db_side_effect):
            result = _helpers.verify_admin(FakeHeaders({"Authorization": "Bearer tok"}))
        assert result == {"person_id": "person-1", "role": "admin"}
        fake_lingo_db.learner_profiles.find_one.assert_called_once_with({"person_id": "person-1"})


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
