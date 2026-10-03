/**
 * WorkOS answers an unusable refresh token with a 4xx (OAuth `invalid_grant`).
 * Anything else — no status (network), 408, 429, 5xx — is transient.
 * See https://workos.com/docs/authkit/session-resilience
 */
export function isTerminalRefreshError(error: any): boolean {
  if (error?.error === "invalid_grant" || error?.code === "invalid_grant")
    return true;
  const status = typeof error?.status === "number" ? error.status : undefined;
  if (status === undefined) return false;
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}
