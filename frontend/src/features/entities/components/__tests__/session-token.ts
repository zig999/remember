export function sessionToken(): string {
  const encode = (part: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(part), "utf8")
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${encode({ alg: "EdDSA", typ: "JWT" })}.${encode({ sub: "owner", exp })}.x`;
}
