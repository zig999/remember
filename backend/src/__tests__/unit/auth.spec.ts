// TC-01 acceptance criteria covered:
//  - "request without Authorization header returns 401 AUTH_UNAUTHORIZED"
//  - "request with an expired JWT returns 401 AUTH_TOKEN_EXPIRED"
//  - "BR-01 of knowledge-graph.back.md: missing/invalid/expired → AUTH_*"

import { describe, expect, it } from "vitest";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
  type JWTPayload,
} from "jose";

import {
  AuthError,
  buildJwksUrl,
  buildNeonAuth,
  extractBearer,
} from "../../middleware/auth.js";

interface KeyPairFixture {
  privateKey: CryptoKey;
  publicJwk: JWK & { kid: string; alg: string };
}

async function buildKeyPair(kid = "test-kid"): Promise<KeyPairFixture> {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  return {
    privateKey,
    publicJwk: { ...publicJwk, kid, alg: "RS256", use: "sig" },
  };
}

async function signToken(
  privateKey: CryptoKey,
  payload: JWTPayload,
  opts: { kid: string; expSecondsFromNow: number }
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: opts.kid })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + opts.expSecondsFromNow)
    .sign(privateKey);
}

/** Build a stub Fastify request carrying only the `authorization` header. */
function fakeRequest(authorization?: string) {
  return {
    headers: authorization === undefined ? {} : { authorization },
    user: undefined as unknown,
  } as unknown as Parameters<
    ReturnType<typeof buildNeonAuth>["preHandler"]
  >[0];
}

const envFixture = {
  NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth",
  NEON_AUTH_JWKS_TTL_S: 600,
} as const;

describe("extractBearer", () => {
  it("returns the token from a well-formed header", () => {
    expect(extractBearer("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("is case-insensitive on the scheme", () => {
    expect(extractBearer("bearer abc.def.ghi")).toBe("abc.def.ghi");
    expect(extractBearer("BEARER abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("returns null when the header is missing", () => {
    // BR-01 of knowledge-graph.back.md: missing header -> AUTH_UNAUTHORIZED.
    expect(extractBearer(undefined)).toBeNull();
  });

  it("returns null on the wrong scheme", () => {
    expect(extractBearer("Basic abc")).toBeNull();
    expect(extractBearer("Token abc")).toBeNull();
  });

  it("returns null when the token is empty", () => {
    expect(extractBearer("Bearer ")).toBeNull();
    expect(extractBearer("Bearer")).toBeNull();
  });
});

describe("buildJwksUrl", () => {
  it("builds the canonical Neon Auth JWKS URL", () => {
    expect(
      buildJwksUrl("https://ep-test.neon.tech/neondb/auth").toString()
    ).toBe("https://ep-test.neon.tech/neondb/auth/.well-known/jwks.json");
  });

  it("strips a trailing slash from NEON_AUTH_URL", () => {
    expect(
      buildJwksUrl("https://ep-test.neon.tech/neondb/auth/").toString()
    ).toBe("https://ep-test.neon.tech/neondb/auth/.well-known/jwks.json");
  });
});

describe("buildNeonAuth.preHandler", () => {
  it("rejects with AUTH_UNAUTHORIZED when no header is present", async () => {
    // TC-01 acceptance criterion: 401 AUTH_UNAUTHORIZED.
    const auth = buildNeonAuth(envFixture, async () => {
      throw new Error("should not be called");
    });
    const req = fakeRequest();
    await expect(auth.preHandler(req, {} as never)).rejects.toMatchObject({
      name: "AuthError",
      code: "AUTH_UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("rejects with AUTH_UNAUTHORIZED when the header is malformed", async () => {
    const auth = buildNeonAuth(envFixture, async () => {
      throw new Error("should not be called");
    });
    const req = fakeRequest("Basic abc.def.ghi");
    await expect(auth.preHandler(req, {} as never)).rejects.toMatchObject({
      code: "AUTH_UNAUTHORIZED",
    });
  });

  it("accepts a valid, signed token and attaches the user to the request", async () => {
    // BR-01 of knowledge-graph.back.md: the happy path.
    const { privateKey, publicJwk } = await buildKeyPair();
    const token = await signToken(
      privateKey,
      { sub: "user-123", role: "authenticated" },
      { kid: publicJwk.kid, expSecondsFromNow: 60 }
    );
    const auth = buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...publicJwk }) as never
    );
    const req = fakeRequest(`Bearer ${token}`);
    await auth.preHandler(req, {} as never);
    expect(req.user).toMatchObject({ id: "user-123" });
  });

  it("rejects with AUTH_TOKEN_EXPIRED when the JWT has expired", async () => {
    // TC-01 acceptance criterion: expired JWT -> 401 AUTH_TOKEN_EXPIRED.
    const { privateKey, publicJwk } = await buildKeyPair();
    const token = await signToken(
      privateKey,
      { sub: "user-123" },
      { kid: publicJwk.kid, expSecondsFromNow: -60 } // expired 1 minute ago
    );
    const auth = buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...publicJwk }) as never
    );
    const req = fakeRequest(`Bearer ${token}`);
    await expect(auth.preHandler(req, {} as never)).rejects.toMatchObject({
      code: "AUTH_TOKEN_EXPIRED",
      statusCode: 401,
    });
  });

  it("rejects with AUTH_TOKEN_INVALID when the JWT signature does not match", async () => {
    // BR-01 of knowledge-graph.back.md: malformed/unsignable -> AUTH_TOKEN_INVALID.
    const signing = await buildKeyPair("signer");
    const otherJwks = await buildKeyPair("attacker"); // unrelated key
    const token = await signToken(
      signing.privateKey,
      { sub: "user-123" },
      { kid: signing.publicJwk.kid, expSecondsFromNow: 60 }
    );
    // JWKS returns a key whose `kid` does not match -> NoMatchingKey.
    const auth = buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...otherJwks.publicJwk }) as never
    );
    const req = fakeRequest(`Bearer ${token}`);
    await expect(auth.preHandler(req, {} as never)).rejects.toMatchObject({
      code: "AUTH_TOKEN_INVALID",
      statusCode: 401,
    });
  });

  it("rejects with AUTH_TOKEN_INVALID when the JWT is structurally broken", async () => {
    const auth = buildNeonAuth(envFixture, async () => {
      throw new Error("never called — structural failure short-circuits");
    });
    const req = fakeRequest("Bearer not-a-real-jwt");
    await expect(auth.preHandler(req, {} as never)).rejects.toMatchObject({
      code: "AUTH_TOKEN_INVALID",
      statusCode: 401,
    });
  });

  it("rejects when the `sub` claim is missing", async () => {
    const { privateKey, publicJwk } = await buildKeyPair();
    const token = await signToken(
      privateKey,
      { role: "authenticated" }, // no sub
      { kid: publicJwk.kid, expSecondsFromNow: 60 }
    );
    const auth = buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...publicJwk }) as never
    );
    const req = fakeRequest(`Bearer ${token}`);
    await expect(auth.preHandler(req, {} as never)).rejects.toMatchObject({
      code: "AUTH_TOKEN_INVALID",
    });
  });
});

describe("AuthError", () => {
  it("carries statusCode=401 and a typed code", () => {
    const err = new AuthError("AUTH_TOKEN_EXPIRED", "expired");
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("AUTH_TOKEN_EXPIRED");
    expect(err.message).toBe("expired");
  });
});
