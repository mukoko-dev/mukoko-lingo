/**
 * SSRF guard for caller-supplied outbound URLs (used by the OneRoster sync).
 */

import {
  assertPublicHttpsUrl,
  guardedLookup,
  isNonPublicAddress,
  UnsafeUrlError,
} from "../outbound-url";

const resolvesTo =
  (...addresses: string[]) =>
  async () =>
    addresses;

describe("isNonPublicAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "not-an-ip",
  ])("blocks %s", (address) => {
    expect(isNonPublicAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "172.32.0.1", "203.0.113.10", "2606:4700::1111"])(
    "allows %s",
    (address) => {
      expect(isNonPublicAddress(address)).toBe(false);
    },
  );
});

describe("assertPublicHttpsUrl", () => {
  it("accepts an https URL that resolves to a public address", async () => {
    const url = await assertPublicHttpsUrl(
      "https://oneroster.example.com/api/",
      "oneroster_base_url",
      resolvesTo("203.0.113.10"),
    );
    expect(url.hostname).toBe("oneroster.example.com");
  });

  it.each([
    ["non-string", 42],
    ["empty", ""],
    ["unparseable", "not a url"],
    ["plain http", "http://oneroster.example.com"],
    ["file scheme", "file:///etc/passwd"],
    ["embedded credentials", "https://user:pass@oneroster.example.com"],
    ["localhost", "https://localhost/api"],
    [".internal host", "https://metadata.google.internal/"],
    ["loopback literal", "https://127.0.0.1/"],
    ["metadata literal", "https://169.254.169.254/latest/meta-data"],
    ["IPv6 loopback literal", "https://[::1]/"],
  ])("rejects %s", async (_label, raw) => {
    await expect(
      assertPublicHttpsUrl(
        raw,
        "oneroster_base_url",
        resolvesTo("203.0.113.10"),
      ),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects a hostname that resolves to a private address", async () => {
    await expect(
      assertPublicHttpsUrl(
        "https://sneaky.example.com",
        "oneroster_base_url",
        resolvesTo("203.0.113.10", "10.0.0.5"),
      ),
    ).rejects.toThrow("oneroster_base_url must be a public host");
  });

  it("rejects a hostname that does not resolve", async () => {
    await expect(
      assertPublicHttpsUrl(
        "https://nowhere.example",
        "oneroster_base_url",
        async () => {
          throw new Error("ENOTFOUND");
        },
      ),
    ).rejects.toThrow("could not be resolved");
  });
});

describe("guardedLookup (the connection's own DNS lookup)", () => {
  const answering =
    (...addresses: string[]) =>
    (_host: string, _opts: object, cb: (e: Error | null, a: { address: string; family: number }[]) => void) =>
      cb(
        null,
        addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 })),
      );

  it("passes a public answer through, in both callback shapes", () => {
    const all = jest.fn();
    guardedLookup("roster.example", { all: true }, all, answering("203.0.113.10") as never);
    expect(all).toHaveBeenCalledWith(null, [{ address: "203.0.113.10", family: 4 }]);

    const one = jest.fn();
    guardedLookup("roster.example", {}, one, answering("203.0.113.10") as never);
    expect(one).toHaveBeenCalledWith(null, "203.0.113.10", 4);
  });

  it("refuses a rebound answer that points at the metadata service", () => {
    const cb = jest.fn();
    guardedLookup("rebind.example", { all: true }, cb, answering("169.254.169.254") as never);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(UnsafeUrlError);
  });

  it("refuses an answer that mixes public and private addresses", () => {
    const cb = jest.fn();
    guardedLookup("mixed.example", {}, cb, answering("203.0.113.10", "10.0.0.5") as never);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(UnsafeUrlError);
  });

  it("passes a resolver error through", () => {
    const cb = jest.fn();
    const failing = (_h: string, _o: object, c: (e: Error | null, a: never[]) => void) =>
      c(new Error("ENOTFOUND"), []);
    guardedLookup("nope.example", {}, cb, failing as never);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
