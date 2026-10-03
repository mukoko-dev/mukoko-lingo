/**
 * WorkOS answers an unusable refresh token (expired, revoked, signed out or
 * already used) with 400 `invalid_grant`: terminal. Anything else — no status
 * (network), 408, 429, 5xx — is transient, and so is 401/403, which means our
 * own API key is wrong rather than the user's session being over.
 * See https://workos.com/docs/authkit/session-resilience
 */
export function isTerminalRefreshError(error: any): boolean {
  if (error?.error === "invalid_grant" || error?.code === "invalid_grant")
    return true;
  return error?.status === 400;
}
