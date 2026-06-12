// Neon Auth (Stack Auth) JWT verification — Fastify `preHandler`.
//
// Implements BR-01 of knowledge-graph.back.md and the corresponding ingestion
// requirement: every request that reaches a protected route must carry
// `Authorization: Bearer <jwt>`. We verify the signature against Neon Auth's
// JWKS, cache the JWKS in process for the configured TTL (default 10 min, per
// knowledge-graph.back.md §1), and refuse to dispatch the route on any failure.
//
// Error mapping (registered in docs/specs/_global/error-codes.md):
//   - Missing/malformed `Authorization` header     -> 401 AUTH_UNAUTHORIZED
//   - Token expired (exp <= now)                   -> 401 AUTH_TOKEN_EXPIRED
//   - Bad signature / wrong issuer / not a JWT     -> 401 AUTH_TOKEN_INVALID
//
// Provider note: Neon Auth (powered by Stack Auth) issues asymmetric access
// tokens — EdDSA (Ed25519) by default — served via a JWKS endpoint derived from
// `NEON_AUTH_URL`. `jose` selects the verification algorithm from the JWKS key,
// so EdDSA/RSA/EC keys all work without extra configuration. Issuer/audience
// hardening is available (issuer = `new URL(NEON_AUTH_URL).origin`) but is left
// off here to preserve the existing verification contract; enable it via the
// `jwtVerify` options when the deployment's issuer/aud are pinned.

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createRemoteJWKSet,
  jwtVerify,
  errors as joseErrors,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";

import type { Env } from "../config/env.js";

/** Authenticated subject attached to `request.user` after JWT verification. */
export interface AuthenticatedUser {
  /** `sub` claim — Neon Auth subject (user) id. */
  readonly id: string;
  /** Full decoded JWT payload (frozen). */
  readonly claims: Readonly<JWTPayload>;
}

/**
 * Error codes accepted by the global error handler. We expose the union here
 * so the handler can map this prefab set without typecasting.
 */
export type AuthErrorCode =
  | "AUTH_UNAUTHORIZED"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_TOKEN_INVALID";

/**
 * Sentinel error thrown by the middleware. The global error handler converts
 * this to a 401 + `{ ok: false, error: { code, message } }` envelope.
 */
export class AuthError extends Error {
  public readonly statusCode = 401;
  public readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

/**
 * Public surface of the auth module — the bootstrap composes one of these and
 * registers `.preHandler` against the protected route scopes.
 */
export interface NeonAuth {
  readonly preHandler: (
    request: FastifyRequest,
    _reply: FastifyReply
  ) => Promise<void>;
}

/**
 * Build the JWKS URL from the Neon Auth base URL.
 *
 * Neon Auth exposes JWKS at `<NEON_AUTH_URL>/.well-known/jwks.json` (e.g.
 * `https://<endpoint>.neon.tech/<db>/auth/.well-known/jwks.json`). We do not
 * allow callers to override this path — it is part of the spec's trust boundary.
 */
export function buildJwksUrl(neonAuthUrl: string): URL {
  const base = neonAuthUrl.replace(/\/+$/, "");
  return new URL(`${base}/.well-known/jwks.json`);
}

/**
 * Build the Neon Auth middleware. The JWKS is created once and reused across
 * requests; `jose` handles the TTL/refresh internally (jose's default is 10 min
 * cache + 30 s cooldown, which matches the spec exactly).
 *
 * The `getKey` parameter is exposed for tests so they can inject a stub JWKS
 * resolver; production callers pass nothing and get the real one.
 */
export function buildNeonAuth(
  env: Pick<Env, "NEON_AUTH_URL" | "NEON_AUTH_JWKS_TTL_S">,
  getKey?: JWTVerifyGetKey
): NeonAuth {
  const jwks: JWTVerifyGetKey =
    getKey ??
    createRemoteJWKSet(buildJwksUrl(env.NEON_AUTH_URL), {
      cacheMaxAge: env.NEON_AUTH_JWKS_TTL_S * 1000,
      cooldownDuration: 30_000,
    });

  return {
    preHandler: async (request) => {
      const header = request.headers.authorization;
      const token = extractBearer(header);
      if (token === null) {
        throw new AuthError(
          "AUTH_UNAUTHORIZED",
          "Missing or malformed Authorization header (expected `Bearer <jwt>`)."
        );
      }

      let payload: JWTPayload;
      try {
        const verified = await jwtVerify(token, jwks);
        payload = verified.payload;
      } catch (err) {
        throw mapJoseError(err);
      }

      const sub = payload.sub;
      if (typeof sub !== "string" || sub.length === 0) {
        throw new AuthError(
          "AUTH_TOKEN_INVALID",
          "JWT missing required `sub` claim."
        );
      }

      const user: AuthenticatedUser = {
        id: sub,
        claims: Object.freeze({ ...payload }),
      };
      request.user = user;
    },
  };
}

/**
 * Return the bearer token from an `Authorization` header, or `null` if the
 * header is absent / malformed. Spec compliance: the scheme MUST be `Bearer`
 * (case-insensitive) and a single non-empty token MUST follow.
 */
export function extractBearer(header: string | undefined): string | null {
  if (typeof header !== "string") return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  if (match === null) return null;
  return match[1] ?? null;
}

/**
 * Map a `jose` verification error to our typed `AuthError`. The mapping is
 * deliberately narrow: we surface only the three codes the global catalog
 * defines under AUTH_, and reuse `AUTH_TOKEN_INVALID` for any non-expiration
 * failure (including signature mismatches, structural issues, and clock-skew
 * problems beyond `exp`).
 */
function mapJoseError(err: unknown): AuthError {
  if (err instanceof joseErrors.JWTExpired) {
    return new AuthError("AUTH_TOKEN_EXPIRED", "Authentication token expired.");
  }
  if (
    err instanceof joseErrors.JWSSignatureVerificationFailed ||
    err instanceof joseErrors.JWSInvalid ||
    err instanceof joseErrors.JWTInvalid ||
    err instanceof joseErrors.JWTClaimValidationFailed ||
    err instanceof joseErrors.JOSEAlgNotAllowed ||
    err instanceof joseErrors.JWKSNoMatchingKey
  ) {
    return new AuthError("AUTH_TOKEN_INVALID", "Invalid authentication token.");
  }
  // Unknown — surface as invalid (defensive). We do not leak the underlying
  // message to the client; the global error handler logs it server-side.
  return new AuthError("AUTH_TOKEN_INVALID", "Invalid authentication token.");
}

// Fastify request typing — augment globally so handlers can read `request.user`
// without manual casts. The `unknown` fallback keeps unauthenticated tests
// honest (they would have to assign it explicitly).
declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
