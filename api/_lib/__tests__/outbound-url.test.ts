/**
 * SSRF guard for caller-supplied outbound URLs (used by the OneRoster sync).
 */

import {
  assertPublicHttpsUrl,
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
