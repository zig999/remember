---
contract_version: siegard-reconcile/8
title: Adoption of the shared transport context
summary: The shared transport files are adopted as they stand and did not change; the owner states the
  source is the running system, and this reconciliation asks whether the specification written from its
  survey holds what each file carries.
target: backend
files:
- path: src/middleware/auth.ts
  change: Authenticates the owner on every protected request by a verified bearer token, or in development
    by the local operator token.
- path: src/middleware/error-handler.ts
  change: Classifies every error thrown on the REST path into its status and failure envelope.
- path: src/shared/error-mapping.ts
  change: Declares the failure envelope, the code-to-status registry, the store-unavailable detection
    and the MCP rendering of a failure.
- path: src/shared/health.ts
  change: Probes the service and the store and reports the result without ever failing.
nodes:
- node: constraints/curation-transports-answer-alike
  conforms: true
  how: 'src/shared/error-mapping.ts: held at `renderErrorEnvelope` and `toMcpToolResult`, which render
    one classified `error` (same `code`) for REST and for MCP — const statusCode = codeToHttpStatus[code]
    ?? 500;

    ...

    content: [{ type: "text", text: JSON.stringify(envelope.error) }],'
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/every-operation-requires-owner-authentication
  conforms: true
  how: 'src/middleware/auth.ts: held at preHandler in buildNeonAuth (lines 122-166): bearer extraction,
    jwtVerify against the JWKS, then the `sub` check — const token = extractBearer(header);

    if (token === null) { throw new AuthError("AUTH_UNAUTHORIZED", ...) }

    ...

    const verified = await jwtVerify(token, jwks);

    ...

    if (typeof sub !== "string" || sub.length === 0) { throw new AuthError("AUTH_TOKEN_INVALID", "JWT
    missing required `sub` claim.") }'
  encoded_at:
  - src/middleware/auth.ts
- node: constraints/failures-answer-one-envelope
  conforms: true
  how: "src/shared/error-mapping.ts: held at the `ErrorEnvelope` interface and `renderErrorEnvelope`,\
    \ which omits details when they are undefined — readonly ok: false;\nreadonly error: {\n  readonly\
    \ code: string;\n  readonly message: string;\n  readonly details?: unknown;\n};"
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/ingestion-transports-answer-alike
  conforms: true
  how: "src/shared/error-mapping.ts: held at `renderErrorEnvelope` and `toMcpToolResult`, which render\
    \ the same `error.code` for both transports; statuses differ where the registry and the ingestion\
    \ contract disagree (see the BUSINESS_LINK_RULE_VIOLATION finding) — const error: ErrorEnvelope[\"\
    error\"] =\n  details === undefined ? { code, message } : { code, message, details };"
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/internal-failure-withholds-cause
  conforms: true
  how: "src/middleware/error-handler.ts: held at classify(): the final `return internalError();` branch\
    \ 6, and the 5xx message in branch 5 (`isFastifyHttpError`). The fixed message text itself sits in\
    \ ../shared/error-mapping.ts, which this file imports. — // 6. Anything else — generic 500. We do\
    \ NOT leak the underlying message.\n  return internalError();\nand\nmessage: isServerError ? \"Internal\
    \ server error.\" : err.message,\nsrc/shared/error-mapping.ts: held at `internalError()`, which takes\
    \ no cause and returns a fixed message — export function internalError(): MappedError {\n  return\
    \ renderErrorEnvelope(\"SYSTEM_INTERNAL_ERROR\", \"Internal server error.\");\n}"
  encoded_at:
  - src/middleware/error-handler.ts
  - src/shared/error-mapping.ts
- node: constraints/local-operator-token-development-only
  conforms: true
  how: 'src/middleware/auth.ts: held at localOperatorToken resolution (lines 114-119), the bypass branch
    in preHandler (lines 137-143) and constantTimeEqual (lines 187-192) — env.NODE_ENV === "development"
    &&

    typeof env.LOCAL_OPERATOR_TOKEN === "string" &&

    ...

    if (localOperatorToken !== null && constantTimeEqual(token, localOperatorToken)) {'
  encoded_at:
  - src/middleware/auth.ts
- node: constraints/mcp-failure-is-tool-error
  conforms: true
  how: "src/shared/error-mapping.ts: held at `toMcpToolResult` — return {\n  content: [{ type: \"text\"\
    , text: JSON.stringify(envelope.error) }],\n  isError: true,\n};"
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/retrieval-transports-answer-alike
  conforms: true
  how: 'src/shared/error-mapping.ts: held at `renderErrorEnvelope` and `toMcpToolResult`, which render
    the same `error.code` for both transports — const statusCode = codeToHttpStatus[code] ?? 500;

    const logLevel: "warn" | "error" = statusCode >= 500 ? "error" : "warn";'
  encoded_at:
  - src/shared/error-mapping.ts
- node: constraints/unreachable-store-answers-unavailable
  conforms: true
  how: "src/middleware/error-handler.ts: held at classify() branch 4. The detection and the answer are\
    \ delegated to `isPgUnavailable` and `serviceUnavailableError` in ../shared/error-mapping.ts. — if\
    \ (isPgUnavailable(err)) {\n    return serviceUnavailableError();\n  }\nsrc/shared/error-mapping.ts:\
    \ held at `isPgUnavailable` with its SQLSTATE and errno sets, and `serviceUnavailableError()` — \"\
    57014\", // query_canceled (statement timeout)\n...\nreturn renderErrorEnvelope(\n  \"SYSTEM_SERVICE_UNAVAILABLE\"\
    ,\n  \"A backing service is temporarily unavailable.\"\n);"
  encoded_at:
  - src/middleware/error-handler.ts
  - src/shared/error-mapping.ts
- node: contracts/knowledge-base/access
  conforms: false
  how: "src/middleware/auth.ts, mapJoseError, the final fallthrough (line 217), together with the catch\
    \ around jwtVerify in preHandler (lines 146-151): } catch (err) {\n  throw mapJoseError(err);\n}\n\
    ...\n// Unknown — surface as invalid (defensive). We do not leak the underlying\n// message to the\
    \ client; the global error handler logs it server-side.\nreturn new AuthError(\"AUTH_TOKEN_INVALID\"\
    , \"Invalid authentication token.\"); — When the auth provider's key set cannot be fetched (a jose\
    \ JWKS timeout or fetch failure, which is not one of the listed classes), the owner gets a 401 \"\
    Invalid authentication token.\" The contract says HTTP 503 SYSTEM_SERVICE_UNAVAILABLE. A provider\
    \ outage therefore looks like a bad credential. The owner is told to re-authenticate when nothing\
    \ is wrong with the token. The decision log names this exact case: a failure to fetch the key set\
    \ answered as an invalid token, decided as 503.\nsrc/middleware/error-handler.ts, classify(), branch\
    \ 3 (Fastify validation), lines 110-123: message: err.message ?? \"Request payload failed validation.\"\
    ,\n          details: err.validation, — A request that fails Fastify's own schema validation gets\
    \ the framework's message and the raw Fastify `validation` array, not the fixed message with a bare\
    \ list of `{ path, message }`. A client reading the `details` of a 422 sees one shape from ZodError\
    \ and another from schema validation. The node says every validation failure answers with the `{ path,\
    \ message }` list.\nsrc/middleware/error-handler.ts, classify(), branch 5 (Fastify HTTP errors), lines\
    \ 132-147, the message for a 503: const isServerError = err.statusCode >= 500;\n...\nmessage: isServerError\
    \ ? \"Internal server error.\" : err.message, — A framework failure with status 503 is coded SYSTEM_SERVICE_UNAVAILABLE\
    \ by `codeFromHttpStatus`, but its message is \"Internal server error.\" The node says \"A backing\
    \ service is temporarily unavailable.\" The code and the message disagree, and the client is told\
    \ an internal failure for an unavailable service.\nsrc/middleware/error-handler.ts, codeFromHttpStatus(),\
    \ the `case 422` arm, lines 183-184: case 422:\n      return \"VALIDATION_INVALID_FORMAT\"; — A framework-refused\
    \ request with status 422 that carries no `validation` array gets code VALIDATION_INVALID_FORMAT.\
    \ The node gives only 401, 403, 409 and 404 their own codes, and any other status below 500 SYSTEM_INTERNAL_ERROR.\
    \ The 422 mapping is a code rule the specification does not hold."
  observed_at:
  - src/middleware/auth.ts
  - src/middleware/error-handler.ts
- node: domain/knowledge-base/database-status
  conforms: true
  how: 'src/shared/health.ts: held at the `database` member of the HealthReport interface, line 14 — database:
    "ok" | "unreachable";'
  encoded_at:
  - src/shared/health.ts
- node: domain/knowledge-base/health-report
  conforms: true
  how: "src/shared/health.ts: held at the HealthReport interface, lines 11-16 — export interface HealthReport\
    \ {\n  ok: boolean;\n  service: \"remember-bff\";\n  database: \"ok\" | \"unreachable\";\n  checked_at:\
    \ string;\n}"
  encoded_at:
  - src/shared/health.ts
- node: rules/knowledge-base/health-checked-at-probe-start
  conforms: true
  how: "src/shared/health.ts: held at the first statement of collectHealth(), line 25, evaluated before\
    \ pingDatabase is awaited — const checkedAt = new Date().toISOString();\n  try {\n    await pingDatabase(pool);"
  encoded_at:
  - src/shared/health.ts
- node: rules/knowledge-base/health-probe-never-fails
  conforms: true
  how: "src/shared/health.ts: held at the try/catch in collectHealth(), lines 26-41. A failed ping is\
    \ caught and returned as a report with ok false. — } catch {\n    return {\n      ok: false,\n   \
    \   service: \"remember-bff\",\n      database: \"unreachable\",\n      checked_at: checkedAt,\n \
    \   };\n  }"
  encoded_at:
  - src/shared/health.ts
unstated:
- file: src/middleware/auth.ts
  where: buildJwksUrl (lines 85-88)
  evidence: return new URL(`${base}/.well-known/jwks.json`);
  cost: The location of the provider's key set, which is the trust boundary for every token, is fixed
    here and in no node. The access contract says only "The auth provider's key set".
- file: src/middleware/auth.ts
  where: buildNeonAuth, the createRemoteJWKSet options (line 107)
  evidence: 'cooldownDuration: 30_000,'
  cost: The 30-second interval between key-set refetches is a value the code applies and no node holds.
    The next reader looking for it in the specification will not find it. A change to how the system tolerates
    a rotated or unreachable key set has no node to reach.
- file: src/shared/error-mapping.ts
  where: the `codeToHttpStatus` entry in the chat section
  evidence: 'BUSINESS_CHAT_INGEST_DISABLED: 503,'
  cost: A refusal code and its HTTP 503 status are declared here, and no node under the specification
    root states the code. The next reader looks for it in the chat contract and does not find it.
- file: src/shared/error-mapping.ts
  where: the `codeToHttpStatus` entry in the resource section
  evidence: 'RESOURCE_ALREADY_EXISTS: 409,'
  cost: A refusal code and its status are published in the registry, and no node states the code or says
    which operation refuses with it. The code becomes the place that decision lives.
restates:
- file: src/middleware/auth.ts
  where: comments at lines 110-113 and 132-136 ("DEV-ONLY")
  evidence: '// Resolved once at build time: enabled only when running in development AND a

    // token is configured. In any other mode this is `null` and the bypass branch

    // below is dead — production never trusts a static bearer.'
  cost: The comments restate the development-only rule as a second home. The code holds it in the `env.NODE_ENV
    === "development"` guard.
  node: constraints/local-operator-token-development-only
- file: src/middleware/auth.ts
  where: header comment, lines 9-12 ("Error mapping")
  evidence: '// Error mapping (registered in docs/specs/_global/error-codes.md):

    //   - Missing/malformed `Authorization` header     -> 401 AUTH_UNAUTHORIZED

    //   - Token expired (exp <= now)                   -> 401 AUTH_TOKEN_EXPIRED

    //   - Bad signature / wrong issuer / not a JWT     -> 401 AUTH_TOKEN_INVALID'
  cost: The comment restates the authentication refusals as a second home outside behavior. It also lists
    only three outcomes and omits the 503 the contract holds. It will drift from the contract without
    anything noticing.
  node: contracts/knowledge-base/access
- file: src/middleware/error-handler.ts
  where: the header comment, line 14
  evidence: '//   - pg error: ECONNREFUSED / ETIMEDOUT / 57P03 / 57014 -> 503 SYSTEM_SERVICE_UNAVAILABLE'
  cost: The comment restates the unreachable-store rule next to the code that applies it. When the node
    moves, this copy keeps saying the old rule, and the next reader may take it as the decided one.
  node: constraints/unreachable-store-answers-unavailable
- file: src/middleware/error-handler.ts
  where: the header comment, lines 17-19
  evidence: '// The handler MUST NOT leak internal messages on the 500 path — the client

    // gets a generic "internal error" string; the original `err.message` is

    // logged server-side via pino.'
  cost: The comment restates the withhold-the-cause rule, and its wording ("internal error") differs from
    the emitted "Internal server error." The prose can drift from both the node and the code.
  node: constraints/internal-failure-withholds-cause
- file: src/shared/error-mapping.ts
  where: the comment block above `ErrorEnvelope`, lines 1-12, and the docstring on `MappedError`, lines
    24-28
  evidence: '// Before this module the `ErrorEnvelope` type, the pg-detection sets, and the

    // 503/500 terminal envelopes were copy-pasted in all three places

    ...

    * `reply.status(...)`; MCP transports ignore it (they speak JSON-RPC over HTTP

    * 200 and surface the envelope inside the result).'
  cost: 'This is prose about the MCP failure form. The code here already holds it in `toMcpToolResult`,
    which returns `isError: true` with the error as JSON text. The `MappedError` docstring describes JSON-RPC
    over HTTP 200, which does not match that function. A reader looking for what MCP answers on failure
    finds two descriptions, and the prose one is wrong.'
  node: constraints/mcp-failure-is-tool-error
- file: src/shared/error-mapping.ts
  where: the docstring on `internalError`, line 194
  evidence: /** 500 — generic internal error. NEVER leaks `err.message` to the client. */
  cost: The rule that an unexpected failure answers a fixed message and never the cause is restated as
    prose. `internalError()` takes no cause argument and returns the fixed message "Internal server error.",
    so the code already holds it. Prose about that rule is a second home for it.
  node: constraints/internal-failure-withholds-cause
- file: src/shared/health.ts
  where: the docstring above collectHealth(), lines 18-23
  evidence: "* Probe the BFF: confirm the process is up and the database is reachable. Never\n * throws\
    \ — a DB failure surfaces as `{ ok: false, database: \"unreachable\" }`\n * so callers always get\
    \ a usable report"
  cost: The docstring states the never-fails rule, which a node already holds. The catch branch that implements
    it sits in this same file. The prose is a second home for that rule outside behavior. If the node's
    wording moves, this text stays behind and still claims the old rule.
  node: rules/knowledge-base/health-probe-never-fails
adopted: true
outside:
- .env.example
- .gitignore
- package-lock.json
- package.json
- src/app.ts
- src/config/db.ts
- src/config/env.ts
- src/config/logger.ts
- src/mcp-stdio.ts
- src/mcp/sdk-http-transport.ts
- src/mcp/server.ts
- src/mcp/stdio-tools.ts
- src/server.ts
- src/shared/invariant-error.ts
- src/shared/pg-transaction.ts
- src/shared/zod-coercion.ts
- tsconfig.json
- vitest.config.ts
- vitest.setup.ts
notes: "Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/adopt-shared.returns/.\nStaged as an adoption of source no delivery wrote:\
  \ 14 candidate node(s) were read on every file, and each cleared one is bound to the files whose judgment\
  \ holds its fact; 19 file(s) were kept outside the judgment, listed under `outside`.\nA finding in src/shared/error-mapping.ts\
  \ names contracts/knowledge-base/curation, which no file of this set is bound to: the `codeToHttpStatus`\
  \ registry, the curation section, which has no entry for BUSINESS_INVALID_ATTRIBUTE_VALUE (falls through\
  \ `renderErrorEnvelope`'s `?? 500`): // Business — Curation (`curation.spec.md`).\n  BUSINESS_REVIEW_NOT_PENDING:\
  \ 409,\n  ...\n  BUSINESS_REASON_REQUIRED: 422,\n...\nconst statusCode = codeToHttpStatus[code] ?? 500;\n\
  Node: \"error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value, HTTP 422 over\
  \ REST\" — The node gives this code HTTP 422 in correct-item. Any REST response rendered through this\
  \ registry for this code answers 500 and is logged at the error level. The contract says the owner sees\
  \ a refusal. The comment calls this registry the single source of truth for REST status, so the gap\
  \ is not visible from the file.. It blocks nothing here; it is owed a route of its own.\nA finding in\
  \ src/shared/error-mapping.ts names contracts/knowledge-base/curation, which no file of this set is\
  \ bound to: the `codeToHttpStatus` entry `BUSINESS_INVALID_TARGET_NODE: 422` (curation section): BUSINESS_INVALID_TARGET_NODE:\
  \ 422,\nNode: \"error code BUSINESS_REVIEW_NOT_PENDING for keep_separate and BUSINESS_INVALID_TARGET_NODE\
  \ for merge_into, naming the node, HTTP 409 over REST\" — The registry maps each code to a single status.\
  \ The curation contract gives BUSINESS_INVALID_TARGET_NODE HTTP 422 (survivor not active, node-type\
  \ mismatch, absorbed node not active) and HTTP 409 (a concurrent change, in resolve-entity-match and\
  \ merge-nodes). A rendering that resolves through this registry answers 422 for the 409 cases, and the\
  \ registry cannot express the split.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/shared/error-mapping.ts names contracts/knowledge-base/ingestion, which no file of this set\
  \ is bound to: the `codeToHttpStatus` entry `BUSINESS_LINK_RULE_VIOLATION: 422` (ingestion section):\
  \ // Business — Ingestion (`ingestion.spec.md`).\n  BUSINESS_LINK_RULE_VIOLATION: 422,\nNode: \"error\
  \ code BUSINESS_LINK_RULE_VIOLATION naming the source node type, link type and target node type, HTTP\
  \ 200 carrying `{ ok: false, error }` over REST\" — The ingestion contract answers this refusal over\
  \ REST as HTTP 200 carrying `{ ok: false, error }`. The registry answers 422. REST and MCP then disagree\
  \ on the transport status for one refusal if a propose route renders through the registry.. It blocks\
  \ nothing here; it is owed a route of its own.\nCandidates: 3 opened across 1 of 4 delegation(s); each\
  \ return lists its own under `candidates_opened`.\nUnstated: 4 fact(s) the source states that no node\
  \ holds, over 2 file(s), listed under `unstated`. They block no binding here and no rebind closes them\
  \ — the route is the analysis that gives each fact a node.\nRestates: 7 place(s) where text in the source\
  \ restates a node's fact the code holds, over 4 file(s), listed under `restates`. The pair conforms,\
  \ so none blocks a binding — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-shared.returns/`, which are the evidence behind every entry above.
