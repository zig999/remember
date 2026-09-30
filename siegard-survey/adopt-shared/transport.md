---
contract_version: siegard-survey/1
target: backend
files:
  - src/shared/error-mapping.ts
  - src/middleware/error-handler.ts
  - src/middleware/auth.ts
  - src/shared/health.ts
read_outside_area:
  - "src/config/env.ts — to see how the NODE_ENV, NEON_AUTH_URL, NEON_AUTH_JWKS_TTL_S and LOCAL_OPERATOR_TOKEN variables read by auth.ts are declared and defaulted"
  - "src/config/db.ts — to see what the database probe called by collectHealth does (pingDatabase)"
  - "src/app.ts — to see where the error handler, the auth preHandler scope and the health probe are mounted and which HTTP status the probe gets"
---

## Facts

### The failure envelope (the logical contract shared by every transport)
- A failed request or tool call answers the envelope `{ ok: false, error: { code, message, details? } }`, where `code` and `message` are strings and `details` is optional and of any shape. `src/shared/error-mapping.ts` (`ErrorEnvelope`).
- When a failure is rendered from a code and a message, the `details` key is left out when no details are given. It is never sent as `undefined` or `null`. `src/shared/error-mapping.ts` (`renderErrorEnvelope`).
- The HTTP status of a rendered failure is looked up from its code in one registry. A code missing from the registry answers HTTP 500 and keeps its own `code` in the envelope. `src/shared/error-mapping.ts` (`renderErrorEnvelope`, `codeToHttpStatus[code] ?? 500`).
- The registry holds only failures. Business outcomes are not in it and do not travel as `ok: false`. `src/shared/error-mapping.ts` (`codeToHttpStatus`).
- The MCP transport renders a failure as a tool result `{ content: [{ type: "text", text: <JSON of the envelope's error> }], isError: true }`. The text is `JSON.stringify(envelope.error)`, which is the `{ code, message, details? }` object alone, without the `ok` key. `src/shared/error-mapping.ts` (`toMcpToolResult`, `McpToolErrorResult`).
- REST and MCP share one classification and one code. The HTTP status is used only by the REST rendering. This is what the specification calls `constraints/ingestion-transports-answer-alike`, `constraints/retrieval-transports-answer-alike` and `constraints/curation-transports-answer-alike`. `src/shared/error-mapping.ts` (`MappedError.statusCode`, `toMcpToolResult`).
- The internal-failure answer never carries the underlying error's message. The caller always gets the fixed message `"Internal server error."`. `src/shared/error-mapping.ts` (`internalError`); `src/middleware/error-handler.ts` (`classify`, step 6).

### Classifying a thrown error into an answer (REST global handler)
- Every error thrown on the REST path goes through one handler. The handler answers `reply.status(statusCode).send(envelope)` using the status and envelope that the classification produced. `src/middleware/error-handler.ts` (`buildErrorHandler`).
- The classification tests an error in this fixed order, and the first test that matches wins:
  1. an authentication error (`AuthError`);
  2. a Zod validation error (`ZodError`);
  3. a framework validation error (an object with a `validation` array);
  4. a database that cannot be reached (`isPgUnavailable`);
  5. a framework HTTP error whose numeric `statusCode` is in `[400, 600)`;
  6. anything else.

  `src/middleware/error-handler.ts` (`classify`).
- An authentication error is tested before the framework HTTP-error test, so it always answers 401 with its own code, even though it carries `statusCode = 401`. `src/middleware/error-handler.ts` (`classify`, step 1 before step 5); `src/middleware/auth.ts` (`AuthError.statusCode`).
- The database test comes before the framework HTTP-error test. An error whose `code` marks the database as unreachable answers 503, even if it also carries a `statusCode`. `src/middleware/error-handler.ts` (`classify`, step 4 before step 5).
- An authentication error answers with its own `code` and `message` and never carries `details`. `src/middleware/error-handler.ts` (`classify`, step 1).
- A Zod validation failure carries `details` as a list of `{ path, message }`, one entry per issue. `path` is the issue's path joined with `"."`. `src/middleware/error-handler.ts` (`classify`, step 2, `err.issues.map`).
- A framework validation failure carries the framework's own `validation` array as `details`. Its message is the framework's message, or `"Request payload failed validation."` when the framework gives none. `src/middleware/error-handler.ts` (`classify`, step 3).
- A framework HTTP error keeps its HTTP status. Its code is derived from that status, and its message depends on the status:
  - status below 500: the framework's own message;
  - status 500 or above: `"Internal server error."`.

  `src/middleware/error-handler.ts` (`classify`, step 5, `codeFromHttpStatus`).

### Owner authentication (the specification's `constraints/retrieval-requires-owner-authentication`)
- A protected request must carry the header `Authorization` in the form `Bearer <token>`:
  - the scheme `Bearer` is matched case-insensitively;
  - it is followed by one or more whitespace characters and exactly one token with no whitespace in it;
  - trailing whitespace is allowed;
  - anything else counts as missing or malformed.

  `src/middleware/auth.ts` (`extractBearer`, `/^Bearer\s+(\S+)\s*$/i`).
- The authentication checks run in this order:
  1. the header is present and well-formed;
  2. the local operator token matches (development only);
  3. the JWT's signature and expiry verify against the provider's key set;
  4. the `sub` claim is present and non-empty.

  `src/middleware/auth.ts` (`buildNeonAuth` `preHandler`).
- A verified token makes the request's owner `{ id: <sub claim>, claims: <frozen full JWT payload> }`. `src/middleware/auth.ts` (`AuthenticatedUser`, `request.user`).
- In development only, a static bearer is accepted as the owner without JWT verification:
  - it applies only when `NODE_ENV === "development"` and `LOCAL_OPERATOR_TOKEN` is a non-empty string;
  - the bearer must equal `LOCAL_OPERATOR_TOKEN`, compared in constant time; a different length never matches;
  - the owner is then `{ id: "local-operator", claims: { sub: "local-operator", local_operator: true } }`.

  `src/middleware/auth.ts` (`localOperatorToken`, `constantTimeEqual`).
- A bearer that does not match the local operator token is not refused for that reason. It falls through to normal JWT verification. `src/middleware/auth.ts` (`preHandler`, bypass branch).
- Outside `NODE_ENV === "development"` the static-bearer path is switched off, and a JWT is the only way in. `src/middleware/auth.ts` (`localOperatorToken` resolved to `null`).
- Authentication has exactly three refusal codes, and every one answers HTTP 401. `src/middleware/auth.ts` (`AuthErrorCode`, `AuthError.statusCode = 401`); `src/middleware/error-handler.ts` (`classify`, step 1).

### Health probe
- The health report has the shape `{ ok, service, database, checked_at }`. `src/shared/health.ts` (`HealthReport`).
- `service` is always `"remember-bff"`. `src/shared/health.ts` (`collectHealth`).
- `checked_at` is taken once, before the database is probed, as an ISO 8601 UTC timestamp (`Date.prototype.toISOString`). `src/shared/health.ts` (`collectHealth`, `checkedAt`).
- When the database probe succeeds the report is `{ ok: true, database: "ok" }`. When the probe fails for any reason the report is `{ ok: false, database: "unreachable" }`. `src/shared/health.ts` (`collectHealth`).
- The health probe never throws. A database failure becomes part of the report, never an error envelope. `src/shared/health.ts` (`collectHealth`, `try/catch`).
- The same health report is what the `health` tool returns and what the health route returns. `src/shared/health.ts` (`HealthReport`, `collectHealth`).

## Answers
- Any protected request, `Authorization` header absent or not of the form `Bearer <token>` → 401 `AUTH_UNAUTHORIZED` ("Missing or malformed Authorization header (expected `Bearer <jwt>`)."). `src/middleware/auth.ts` (`preHandler`, `extractBearer` returns `null`).
- Any protected request, JWT expired → 401 `AUTH_TOKEN_EXPIRED` ("Authentication token expired."). `src/middleware/auth.ts` (`mapJoseError`, `joseErrors.JWTExpired`).
- Any protected request, JWT fails verification (bad signature, malformed JWS or JWT, claim validation failure, algorithm not allowed, no matching key in the key set) → 401 `AUTH_TOKEN_INVALID` ("Invalid authentication token."). `src/middleware/auth.ts` (`mapJoseError`).
- Any protected request, any other verification failure, including failures of the provider's key set other than a missing key → 401 `AUTH_TOKEN_INVALID` ("Invalid authentication token."). `src/middleware/auth.ts` (`mapJoseError`, defensive fallthrough).
- Any protected request, verified JWT with no `sub` claim or an empty one → 401 `AUTH_TOKEN_INVALID` ("JWT missing required `sub` claim."). `src/middleware/auth.ts` (`preHandler`, `sub` check).
- Any REST request, Zod validation fails → 422 `VALIDATION_INVALID_FORMAT` ("Request payload failed validation.", `details`: `[{ path, message }]`). `src/middleware/error-handler.ts` (`classify`, step 2).
- Any REST request, framework schema validation fails → 422 `VALIDATION_INVALID_FORMAT` (the framework's message, or "Request payload failed validation."; `details`: the framework `validation` array). `src/middleware/error-handler.ts` (`classify`, step 3).
- Any operation, database unreachable or statement timed out (SQLSTATE `57P03`, `57014`, `08000`, `08003`, `08006`, or errno `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `ECONNRESET`) → 503 `SYSTEM_SERVICE_UNAVAILABLE` ("A backing service is temporarily unavailable."). `src/shared/error-mapping.ts` (`isPgUnavailable`, `serviceUnavailableError`); `src/middleware/error-handler.ts` (`classify`, step 4).
- Any REST request, framework HTTP error with status 401 → 401 `AUTH_UNAUTHORIZED` (framework message). `src/middleware/error-handler.ts` (`codeFromHttpStatus`).
- Any REST request, framework HTTP error with status 403 → 403 `AUTH_FORBIDDEN` (framework message). `src/middleware/error-handler.ts` (`codeFromHttpStatus`).
- Any REST request, framework HTTP error with status 404, for example an unknown route → 404 `RESOURCE_NOT_FOUND` (framework message). `src/middleware/error-handler.ts` (`codeFromHttpStatus`).
- Any REST request, framework HTTP error with status 409 → 409 `RESOURCE_CONFLICT` (framework message). `src/middleware/error-handler.ts` (`codeFromHttpStatus`).
- Any REST request, framework HTTP error with status 422 → 422 `VALIDATION_INVALID_FORMAT` (framework message). `src/middleware/error-handler.ts` (`codeFromHttpStatus`).
- Any REST request, framework HTTP error with status 503 → 503 `SYSTEM_SERVICE_UNAVAILABLE` ("Internal server error."). `src/middleware/error-handler.ts` (`classify`, step 5, `codeFromHttpStatus`).
- Any REST request, framework HTTP error with another status in `[400, 500)` → that status, with `SYSTEM_INTERNAL_ERROR` and the framework message. `src/middleware/error-handler.ts` (`codeFromHttpStatus` default).
- Any REST request, framework HTTP error with another status in `[500, 600)` → that status, with `SYSTEM_INTERNAL_ERROR` ("Internal server error."). `src/middleware/error-handler.ts` (`classify`, step 5, `codeFromHttpStatus` default).
- Any operation, any other unhandled failure → 500 `SYSTEM_INTERNAL_ERROR` ("Internal server error."). `src/shared/error-mapping.ts` (`internalError`); `src/middleware/error-handler.ts` (`classify`, step 6).
- Any operation, failure rendered with a code missing from the registry → 500, with that same code and message. `src/shared/error-mapping.ts` (`renderErrorEnvelope`).
- Any MCP tool call that fails → the same `code`, `message` and `details`, carried as JSON text in a `content` block of type `"text"` with `isError: true`. The HTTP status from the registry is not used. `src/shared/error-mapping.ts` (`toMcpToolResult`).

## Vocabularies
- Error code to HTTP status registry (closed, every entry):
  - `AUTH_TOKEN_EXPIRED` 401, `AUTH_TOKEN_INVALID` 401, `AUTH_UNAUTHORIZED` 401, `AUTH_FORBIDDEN` 403;
  - `VALIDATION_REQUIRED_FIELD` 422, `VALIDATION_INVALID_FORMAT` 422, `VALIDATION_OUT_OF_RANGE` 422;
  - `RESOURCE_NOT_FOUND` 404, `RESOURCE_ALREADY_EXISTS` 409, `RESOURCE_CONFLICT` 409;
  - `BUSINESS_RUN_NOT_RETRYABLE` 409, `BUSINESS_RUN_NOT_RUNNABLE` 409, `BUSINESS_RUN_NOT_RUNNING` 409, `BUSINESS_LINK_RULE_VIOLATION` 422;
  - `BUSINESS_NODE_DELETED` 410, `BUSINESS_UNKNOWN_NODE_TYPE` 422, `BUSINESS_UNKNOWN_LINK_TYPE` 422, `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` 404, `BUSINESS_INVALID_TRAVERSE_DEPTH` 422;
  - `BUSINESS_INVALID_SEARCH_QUERY` 422, `BUSINESS_INVALID_SEARCH_LAYER` 422, `BUSINESS_FRAGMENT_NOT_ACCEPTED` 404, `BUSINESS_RAW_INFORMATION_DELETED` 410;
  - `BUSINESS_REVIEW_NOT_PENDING` 409, `BUSINESS_TARGET_NODE_REQUIRED` 422, `BUSINESS_INVALID_TARGET_NODE` 422, `BUSINESS_SELF_MERGE_FORBIDDEN` 409, `BUSINESS_ITEM_NOT_DISPUTED` 409, `BUSINESS_DISPUTE_WINNER_REQUIRED` 422, `BUSINESS_DISPUTE_PERIODS_REQUIRED` 422, `BUSINESS_ITEM_NOT_UNCERTAIN` 409, `BUSINESS_ITEM_NOT_DELETABLE` 409, `BUSINESS_CORRECTION_NO_CHANGES` 422, `BUSINESS_DATE_UNJUSTIFIED` 422, `BUSINESS_TEMPORAL_INCOHERENT` 422, `BUSINESS_REASON_REQUIRED` 422;
  - `BUSINESS_CHAT_DISABLED` 503, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` 503, `BUSINESS_CONVERSATION_ARCHIVED` 409, `BUSINESS_IDEMPOTENCY_MISMATCH` 409, `BUSINESS_TURN_IN_PROGRESS` 409, `BUSINESS_CHAT_INGEST_DISABLED` 503;
  - `SYSTEM_INTERNAL_ERROR` 500, `SYSTEM_SERVICE_UNAVAILABLE` 503, `SYSTEM_LLM_PROVIDER_UNAVAILABLE` 502.

  `src/shared/error-mapping.ts` (`codeToHttpStatus`).
- Authentication refusal codes: `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`. `src/middleware/auth.ts` (`AuthErrorCode`).
- HTTP status to code, for framework HTTP errors: 401 `AUTH_UNAUTHORIZED`, 403 `AUTH_FORBIDDEN`, 404 `RESOURCE_NOT_FOUND`, 409 `RESOURCE_CONFLICT`, 422 `VALIDATION_INVALID_FORMAT`, 503 `SYSTEM_SERVICE_UNAVAILABLE`, any other status `SYSTEM_INTERNAL_ERROR`. `src/middleware/error-handler.ts` (`codeFromHttpStatus`).
- Health report `database` values: `"ok"`, `"unreachable"`. `src/shared/health.ts` (`HealthReport.database`).
- Health report `service` value: `"remember-bff"`. `src/shared/health.ts` (`HealthReport.service`).
- MCP failure content block `type` value: `"text"`. `src/shared/error-mapping.ts` (`McpToolErrorResult`).

## Upstream artifacts
- PostgreSQL SQLSTATEs read as "database unavailable": `57P03`, `57014`, `08000`, `08003`, `08006`, taken from the error's `code` property as a string. `src/shared/error-mapping.ts` (`PG_UNAVAILABLE_SQLSTATES`).
- Node network errnos read as "database unavailable": `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `ECONNRESET`, taken from the error's `code` property. `src/shared/error-mapping.ts` (`PG_UNAVAILABLE_ERRNOS`).
- PostgreSQL SQLSTATE `23505` is recognised as a unique-key violation, for other modules to use. `src/shared/error-mapping.ts` (`isPgUniqueViolation`).
- The auth provider (Neon Auth) publishes its signing keys at `<NEON_AUTH_URL with trailing slashes removed>/.well-known/jwks.json`. Callers cannot override this path. `src/middleware/auth.ts` (`buildJwksUrl`).
- The provider's JWT supplies the owner's identity in the `sub` claim and its expiry in `exp`. The issuer and audience are not checked. `src/middleware/auth.ts` (`jwtVerify(token, jwks)` without options, `payload.sub`).
- The environment variables read by authentication are `NEON_AUTH_URL`, `NEON_AUTH_JWKS_TTL_S`, `NODE_ENV` and `LOCAL_OPERATOR_TOKEN`. `src/middleware/auth.ts` (`buildNeonAuth` `env` parameter).
- The framework's validation error carries a `validation` array, and its HTTP errors carry a numeric `statusCode`. `src/middleware/error-handler.ts` (`isFastifyValidationError`, `isFastifyHttpError`).

## Outside the domain
- The failure log event `request_failed` and its fields `request_id`, `route`, `method`, `error_code`, `cause_message`, `cause_name` (logging). `src/middleware/error-handler.ts`.
- The log level derived from the status, `"warn"` below 500 and `"error"` from 500 up (logging). `src/shared/error-mapping.ts`; `src/middleware/error-handler.ts`.
- The key-set cache length `NEON_AUTH_JWKS_TTL_S * 1000` ms and the 30 000 ms refresh cooldown (performance). `src/middleware/auth.ts`.
- The signing algorithm is chosen from the provider's key by the `jose` library (library wiring). `src/middleware/auth.ts`.
- The auth check is installed as a Fastify `preHandler`, and `request.user` is added to the Fastify request type (framework wiring). `src/middleware/auth.ts`.
- The helper names `mapped`, `renderErrorEnvelope`, `classify`, `buildErrorHandler` and `buildNeonAuth`, the `MappedError` type, and the re-export of `isPgUnavailable` and `ErrorEnvelope` (internal helpers). `src/shared/error-mapping.ts`; `src/middleware/error-handler.ts`.
- The injectable `getKey` parameter used to stub the key set in tests (test seam). `src/middleware/auth.ts`.
- The database probe used by the health check is imported from `pingDatabase` (internal wiring). `src/shared/health.ts`.

## Observed and not decided here
- There are two messages for `SYSTEM_SERVICE_UNAVAILABLE`:
  - a database outage answers "A backing service is temporarily unavailable." (`src/shared/error-mapping.ts`, `serviceUnavailableError`);
  - a framework HTTP 503 answers "Internal server error." (`src/middleware/error-handler.ts`, `classify` step 5).
- The status for `SYSTEM_INTERNAL_ERROR` differs:
  - the registry maps it to 500 (`src/shared/error-mapping.ts`, `codeToHttpStatus`);
  - a framework HTTP error with an unmapped 4xx status (for example 400, 405, 413, 415, 429) answers that 4xx status with code `SYSTEM_INTERNAL_ERROR` and the framework message (`src/middleware/error-handler.ts`, `codeFromHttpStatus` default).
- The same code `VALIDATION_INVALID_FORMAT` has two `details` shapes and two message policies:
  - Zod failures give `[{ path, message }]` with the fixed message "Request payload failed validation." (`src/middleware/error-handler.ts`, `classify` step 2);
  - framework validation failures give the framework's raw `validation` array and the framework's own message (`src/middleware/error-handler.ts`, `classify` step 3).
- An unreachable dependency is answered differently depending on which one:
  - a database outage answers 503 `SYSTEM_SERVICE_UNAVAILABLE` (`src/shared/error-mapping.ts`, `isPgUnavailable`);
  - a failure to reach the auth provider's key set (other than a missing key) falls through to 401 `AUTH_TOKEN_INVALID` "Invalid authentication token." (`src/middleware/auth.ts`, `mapJoseError`, defensive fallthrough).
