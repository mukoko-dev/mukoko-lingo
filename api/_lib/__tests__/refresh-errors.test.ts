import { isTerminalRefreshError } from "../refresh-errors";

describe("isTerminalRefreshError", () => {
  it("treats invalid_grant as terminal", () => {
    expect(
      isTerminalRefreshError({ status: 400, error: "invalid_grant" }),
    ).toBe(true);
    expect(isTerminalRefreshError({ error: "invalid_grant" })).toBe(true);
  });

  it("treats a 400 as terminal", () => {
    expect(isTerminalRefreshError({ status: 400 })).toBe(true);
  });

  it("does not end the session when our own API key is rejected", () => {
    expect(isTerminalRefreshError({ status: 401 })).toBe(false);
    expect(isTerminalRefreshError({ status: 403 })).toBe(false);
  });

  it("treats timeouts, rate limits and server errors as transient", () => {
    expect(isTerminalRefreshError({ status: 408 })).toBe(false);
    expect(isTerminalRefreshError({ status: 429 })).toBe(false);
    expect(isTerminalRefreshError({ status: 500 })).toBe(false);
    expect(isTerminalRefreshError({ status: 503 })).toBe(false);
  });

  it("treats network errors (no status) as transient", () => {
    expect(isTerminalRefreshError(new Error("socket hang up"))).toBe(false);
    expect(isTerminalRefreshError(undefined)).toBe(false);
  });
});
