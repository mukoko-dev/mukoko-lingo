/**
 * Outbound URL guard for server-side requests to caller-supplied hosts.
 *
 * Some endpoints (for example, the OneRoster sync) have to call a URL that an
 * admin supplies. Before the server fetches it, the URL must be https and carry
 * no credentials, and it must resolve only to public addresses. Without that
 * check the endpoint becomes a server-side request forgery (SSRF) proxy into
 * loopback, private networks or the cloud metadata service. Fetches made with
 * these URLs should also refuse redirects (`redirect: "error"`) so a public host
 * can't bounce the request to an internal one.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
];

function ipv4ToInt(ip: string): number {
  return (
    ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
  );
}

function inV4Range(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const PRIVATE_V4: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 3], // multicast + reserved (224.0.0.0 – 255.255.255.255)
];

/** True for any address a server-side request must never reach. */
export function isNonPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    return PRIVATE_V4.some(([base, bits]) => inV4Range(address, base, bits));
  }
  if (family === 6) {
    const a = address.toLowerCase();
    if (a === "::" || a === "::1") return true;
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isNonPublicAddress(mapped[1]);
    if (/^f[cd][0-9a-f]{2}:/.test(a)) return true; // fc00::/7 unique local
    if (/^fe[89ab][0-9a-f]:/.test(a)) return true; // fe80::/10 link-local
    if (/^ff[0-9a-f]{2}:/.test(a)) return true; // multicast
    return false;
  }
  return true; // not an IP at all — refuse rather than guess
}

type Resolver = (host: string) => Promise<string[]>;

const defaultResolver: Resolver = async (host) =>
  (await lookup(host, { all: true, verbatim: true })).map((r) => r.address);

/**
 * Parse and check a caller-supplied URL. Returns the parsed URL when it's
 * https, has no embedded credentials and resolves only to public addresses;
 * throws `UnsafeUrlError` otherwise.
 */
export async function assertPublicHttpsUrl(
  raw: unknown,
  field: string,
  resolve: Resolver = defaultResolver,
): Promise<URL> {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new UnsafeUrlError(`${field} must be a URL`);
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError(`${field} must be a valid URL`);
  }
  if (url.protocol !== "https:") {
    throw new UnsafeUrlError(`${field} must use https`);
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError(`${field} must not contain credentials`);
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
  ) {
    throw new UnsafeUrlError(`${field} must be a public host`);
  }

  let addresses: string[];
  if (isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = await resolve(host);
    } catch {
      throw new UnsafeUrlError(`${field} host could not be resolved`);
    }
  }
  if (addresses.length === 0 || addresses.some(isNonPublicAddress)) {
    throw new UnsafeUrlError(`${field} must be a public host`);
  }
  return url;
}
