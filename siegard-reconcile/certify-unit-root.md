---
contract_version: siegard-reconcile/8
title: Certification of five error and authentication constraints against the offered unit tests under
  unit/
summary: The source did not change; the owner offers, by the entries of siegard-work/certify/unit-root.yaml,
  auth.spec.ts, error-handler.spec.ts and mcp-stdio.spec.ts, run by the registry's step test, as the proof
  of five constraints bound to these three files, and this reconciliation reads the three files against
  every node bound to them while the auditor decides whether each offered test would fail if its node's
  fact stopped holding.
target: backend
files:
- path: src/middleware/auth.ts
  change: unchanged; read against its nodes for the certification of the two authentication constraints
    it encodes
- path: src/middleware/error-handler.ts
  change: unchanged; read against its nodes for the certification of the two failure-answer constraints
    it encodes
- path: src/shared/error-mapping.ts
  change: unchanged; read against its nodes for the certification of the failure-answer and MCP tool-error
    constraints it encodes
nodes:
- node: constraints/every-operation-requires-owner-authentication
  conforms: true
  how: 'src/middleware/auth.ts: held at the preHandler returned by buildNeonAuth, lines 113-152, with
    extractBearer (lines 161-166) — `if (token === null) { throw new AuthError("AUTH_UNAUTHORIZED", ...)`;
    `const verified = await jwtVerify(token, jwks);` mapped through `mapJoseError` (expired gives AUTH_TOKEN_EXPIRED);
    `if (typeof sub !== "string" || sub.length === 0) { throw new AuthError("AUTH_TOKEN_INVALID", "JWT
    missing required `sub` claim.")`'
  encoded_at:
  - src/middleware/auth.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'The test would build the application with every route registered. It would list the
    routes Fastify registered, including the three MCP endpoints. For each route it would send one request
    with no Authorization header, one with a token that has expired, and one with a token whose signing
    key the provider''s key set does not hold. Each request should get a 401 AUTH_* response, and the
    route''s handler should run no effect, observed through a stubbed service. Once the node decides what
    "names the owner" means, one more case would close the rest: a validly signed token naming a different
    subject, against the result the node decides for it.'
- node: constraints/internal-failure-withholds-cause
  conforms: true
  how: "src/middleware/error-handler.ts: held at classify(), the final `return internalError();` (line\
    \ 135). Also the 5xx branch of the Fastify HTTP error handling (lines 119-131), which sets the message\
    \ to a fixed \"Internal server error.\" for any status of 500 or above. The `cause_message` is only\
    \ logged and never reaches the envelope. — return internalError(); message: isServerError ? \"Internal\
    \ server error.\" : err.message,\nsrc/shared/error-mapping.ts: held at `internalError()`, lines 183-185.\
    \ It takes no argument, so no cause can reach the answer, and it renders a fixed message under `SYSTEM_INTERNAL_ERROR`.\
    \ — export function internalError(): MappedError {\n  return renderErrorEnvelope(\"SYSTEM_INTERNAL_ERROR\"\
    , \"Internal server error.\");\n}"
  encoded_at:
  - src/middleware/error-handler.ts
  - src/shared/error-mapping.ts
  decided_by: reading
  remainder: testable
  remainder_why: Two single-input assertions would close it. First, pass `classify` a thrown non-Error
    value such as the string "oh no", and expect the envelope message to be exactly the fixed text with
    "oh no" absent from the serialized envelope. Second, make an MCP tool call whose handler throws an
    Error with a distinctive message, and expect the error content to carry the fixed message and not
    that text.
- node: constraints/local-operator-token-development-only
  conforms: true
  how: 'src/middleware/auth.ts: held at the localOperatorToken derivation (lines 105-110), the comparison
    in the preHandler (line 123), and constantTimeEqual (lines 168-173) — `env.NODE_ENV === "development"
    && typeof env.LOCAL_OPERATOR_TOKEN === "string" && env.LOCAL_OPERATOR_TOKEN.length > 0 ? env.LOCAL_OPERATOR_TOKEN
    : null`; `if (localOperatorToken !== null && constantTimeEqual(token, localOperatorToken))`; `return
    timingSafeEqual(ab, bb);`'
  encoded_at:
  - src/middleware/auth.ts
  decided_by: reading
  remainder: untestable
  remainder_why: "Part of what is missing can be closed by tests: - The configured token, presented under\
    \ a test environment and under an unset\n  environment, should be refused with no owner attached.\n\
    - A token of the same length as the configured one, differing in content, should be\n  refused in\
    \ development.\n\nThe constant-time part of the comparison is a property of how long the comparison\
    \ takes, and no finite functional assertion decides it. A test that observes which internal comparison\
    \ routine was called would only bind the shape of the code, not the behavior. So no test can decide\
    \ this node whole."
- node: constraints/mcp-failure-is-tool-error
  conforms: true
  how: "src/shared/error-mapping.ts: held at `toMcpToolResult()`, lines 209-214, and the `McpToolErrorResult`\
    \ interface, which fixes `isError: true` and a text content block. — return {\n    content: [{ type:\
    \ \"text\", text: JSON.stringify(envelope.error) }],\n    isError: true,\n  };"
  encoded_at:
  - src/shared/error-mapping.ts
  decided_by: reading
  remainder: testable
  remainder_why: Through buildConfiguredMcpServer, one handler returns ok:false with an error carrying
    a known code, message and non-empty details, and a second handler throws. Each call should answer
    isError=true. In the first case, content[0].text should parse to the same code, message and details.
    In the second, it should parse to a code and a message, plus details if the fact's mapping requires
    them.
- node: constraints/unreachable-store-answers-unavailable
  conforms: true
  how: "src/middleware/error-handler.ts: held at classify(), the `isPgUnavailable(err)` branch (lines\
    \ 113-115), which returns `serviceUnavailableError()`. This branch comes before the Fastify HTTP error\
    \ branch and the generic fallthrough, so an unreachable store or a statement timeout never reaches\
    \ `internalError()`. — if (isPgUnavailable(err)) {\n  return serviceUnavailableError();\n}\nsrc/shared/error-mapping.ts:\
    \ held at `isPgUnavailable()` with its SQLSTATE and errno sets (lines 39-60), and `serviceUnavailableError()`\
    \ (lines 176-181). Together they classify a connection failure or a statement timeout as unavailable\
    \ and answer `SYSTEM_SERVICE_UNAVAILABLE`. — \"57014\", // query_canceled (statement timeout) ...\
    \ \"ECONNREFUSED\", ... return renderErrorEnvelope(\"SYSTEM_SERVICE_UNAVAILABLE\", \"A backing service\
    \ is temporarily unavailable.\");"
  encoded_at:
  - src/middleware/error-handler.ts
  - src/shared/error-mapping.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'For each unreachable-store cause (connection refused, connect timeout, host not found,
    connection reset, server not accepting connections 57P03) and for statement timeout 57014: an operation
    whose store access throws that error, called through the REST route and through the MCP tool. The
    expected result on each is an answer naming SYSTEM_SERVICE_UNAVAILABLE (503 over REST, isError carrying
    that code over MCP) and never SYSTEM_INTERNAL_ERROR.'
unstated:
- file: src/middleware/auth.ts
  where: buildJwksUrl, lines 73-83
  evidence: return new URL(`${base}/.well-known/jwks.json`);
  cost: The location the auth provider's signing keys are fetched from is decided only here. The docstring
    calls it "part of the spec's trust boundary", but no node states it, so a reader looking in the specification
    will not find where the owner's token is verified against.
- file: src/shared/error-mapping.ts
  where: the `codeToHttpStatus` registry, the `BUSINESS_CHAT_INGEST_DISABLED` entry (line 128)
  evidence: 'BUSINESS_CHAT_INGEST_DISABLED: 503,'
  cost: The registry fixes HTTP 503 for a chat-ingest refusal that no node names. I grepped the whole
    specification root for `CHAT_INGEST_DISABLED` and `CHAT_INGEST` and found nothing. `BUSINESS_CHAT_DISABLED`
    has a scenario in `contracts/chat/conversations`, but this sibling code has none. The next reader
    will look for the refusal in the chat contract and not find it.
- file: src/shared/error-mapping.ts
  where: the `codeToHttpStatus` registry, the `RESOURCE_ALREADY_EXISTS` entry (line 85)
  evidence: 'RESOURCE_ALREADY_EXISTS: 409,'
  cost: The registry fixes HTTP 409 for a code that no node of the specification names. I grepped the
    whole specification root, including the projections, for `RESOURCE_ALREADY_EXISTS` and found nothing.
    The status is a decision that lives only in this table. A reader who looks in the contracts for what
    the system answers when something already exists will not find it.
restates:
- file: src/middleware/auth.ts
  where: the docstring of extractBearer, lines 156-160
  evidence: '* header is absent / malformed. Spec compliance: the scheme MUST be `Bearer` * (case-insensitive)
    and a single non-empty token MUST follow.'
  cost: The access contract's refusal for an absent or non-Bearer header is restated as prose beside the
    regex that enforces it. The two can drift apart without anything noticing.
  node: contracts/knowledge-base/access
- file: src/middleware/auth.ts
  where: the header comment, lines 1-15 (the first paragraph restates the gate, and the "Implements BR-01
    of knowledge-graph.back.md" citation sits in the same block)
  evidence: '// Implements BR-01 of knowledge-graph.back.md and the corresponding ingestion // requirement:
    every request that reaches a protected route must carry // `Authorization: Bearer <jwt>`. We verify
    the signature against Neon Auth''s // JWKS, ... and refuse to dispatch the route on any failure.'
  cost: The owner-authentication gate is written a second time as prose, and it cites a rule identifier
    from a document outside the specification. A reader who follows that citation is sent away from the
    node that holds the fact. When the node moves, nothing reaches this comment.
  node: constraints/every-operation-requires-owner-authentication
- file: src/middleware/error-handler.ts
  where: the comment above the final return of classify(), line 134
  evidence: // 6. Anything else — generic 500. We do NOT leak the underlying message.
  cost: 'The comment states, in prose, the fact the node holds: an unexpected failure answers a fixed
    message and never the cause. The code already holds that fact, in `return internalError();` here and
    in the `internalError()` body in src/shared/error-mapping.ts (`renderErrorEnvelope("SYSTEM_INTERNAL_ERROR",
    "Internal server error.")`). The comment is a second home outside behavior. If the rule changes, the
    comment keeps saying the old one and nothing flags it.'
  node: constraints/internal-failure-withholds-cause
pairs_omitted:
- node: constraints/curation-transports-answer-alike
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/failures-answer-one-envelope
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/ingestion-transports-answer-alike
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/shared/error-mapping.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/certify-unit-root.returns/.\nCertification of constraints/every-operation-requires-owner-authentication\
  \ did not hold: the auditor answered `partial` — The tests exercise the token check alone. They call\
  \ buildNeonAuth's preHandler directly with a stub request. They show that the check refuses a missing\
  \ or malformed bearer, a token that has expired, a token whose signing key the provider's key set does\
  \ not hold, a token that is structurally broken, and a token that carries no subject. They also show\
  \ that it accepts a valid token that has not expired.\nWhat is not exercised is the claim that every\
  \ operation reached over the network goes through that check. No test in the offered proof sends a request\
  \ to any REST route or to the MCP routes /api/v1/mcp/{ingest,query,curation}. So a route registered\
  \ without the preHandler would leave every one of these tests passing. Nothing shows that the operation\
  \ does not run when authentication fails, either. The tests only observe that the preHandler rejects.\
  \ They never observe that the handler behind it has no effect.\n\"Names the owner\" is exercised only\
  \ as \"names some subject\". The accepting test lets \"user-123\" through, and nothing submits a token\
  \ that is validly signed and not expired but names someone other than the owner. The node does not say\
  \ whether, in a single-owner system, any subject the provider signed counts as the owner. A reader should\
  \ settle that, not this audit.\nTwo tests are not a sign of missed coverage. \"AuthError carries statusCode=401\
  \ and a typed code\" asserts what a constructor returns for literal inputs, so it cannot fail if the\
  \ fact stops holding. The extractBearer and buildJwksUrl tests check internal helpers, so they tie down\
  \ the shape of the code rather than the fact.\nThe DEV-ONLY local operator tests go beyond the fact.\
  \ \"accepts the configured token as `local-operator` WITHOUT touching JWKS\" asserts that a bearer token\
  \ the auth provider never signed is accepted in development. The node has no such carve-out, so that\
  \ test contradicts the fact as stated rather than proving it. Whether the node or the bypass is what\
  \ needs to change is for a person to decide.. The node is decided by reading, and a certification standing\
  \ on it from an earlier reconciliation is released by the bind. The remainder is testable: The test\
  \ would build the application with every route registered. It would list the routes Fastify registered,\
  \ including the three MCP endpoints. For each route it would send one request with no Authorization\
  \ header, one with a token that has expired, and one with a token whose signing key the provider's key\
  \ set does not hold. Each request should get a 401 AUTH_* response, and the route's handler should run\
  \ no effect, observed through a stubbed service. Once the node decides what \"names the owner\" means,\
  \ one more case would close the rest: a validly signed token naming a different subject, against the\
  \ result the node decides for it..\nCertification of constraints/local-operator-token-development-only\
  \ did not hold: the auditor answered `partial` — Three parts of the fact are exercised. In development,\
  \ the configured token admits the owner without the signing keys ever being consulted. A different token\
  \ does not admit anyone. The configured token is refused when the environment is production.\nThe word\
  \ \"only\" is not exercised over anything other than production. The one other case without development\
  \ (\"is DISABLED when no LOCAL_OPERATOR_TOKEN is configured\") also has no token configured. That means\
  \ it changes two inputs at once and cannot isolate the environment gate. A gate rewritten as \"not production\"\
  \ would still pass every test in the set, while admitting the token under a test environment or an unset\
  \ one.\nThe comparison is checked only against a token of a different length (26 characters against\
  \ 31). A check that compared lengths alone would still pass.\nThe constant-time property of the comparison\
  \ is not asserted anywhere. Replacing it with plain equality leaves every test green.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is untestable: Part of what is missing can be closed by tests: - The configured token,\
  \ presented under a test environment and under an unset\n  environment, should be refused with no owner\
  \ attached.\n- A token of the same length as the configured one, differing in content, should be\n \
  \ refused in development.\n\nThe constant-time part of the comparison is a property of how long the\
  \ comparison takes, and no finite functional assertion decides it. A test that observes which internal\
  \ comparison routine was called would only bind the shape of the code, not the behavior. So no test\
  \ can decide this node whole..\nCertification of constraints/internal-failure-withholds-cause did not\
  \ hold: the auditor answered `partial` — For a thrown Error, the fact is exercised: the first test asserts\
  \ the fixed message \"Internal server error.\" and checks that the cause's text does not appear in the\
  \ serialized envelope. The second test throws a non-Error cause (the string \"oh no\"). It asserts only\
  \ the status and code, never the message, and never that \"oh no\" is absent. So the suite never checks\
  \ that a thrown value other than an Error is withheld. If the handler echoed such a value it would still\
  \ pass. The node's scope is system, but both tests call only `classify`, which is the REST global handler's\
  \ mapping. Nothing in the offered proof fails an operation reached through an MCP tool endpoint. Nothing\
  \ checks that the content rendered there carries the fixed message rather than the cause. So every unexpected\
  \ failure outside the REST error path goes unexercised.. The node is decided by reading, and a certification\
  \ standing on it from an earlier reconciliation is released by the bind. The remainder is testable:\
  \ Two single-input assertions would close it. First, pass `classify` a thrown non-Error value such as\
  \ the string \"oh no\", and expect the envelope message to be exactly the fixed text with \"oh no\"\
  \ absent from the serialized envelope. Second, make an MCP tool call whose handler throws an Error with\
  \ a distinctive message, and expect the error content to carry the fixed message and not that text..\n\
  Certification of constraints/unreachable-store-answers-unavailable did not hold: the auditor answered\
  \ `partial` — Only two cases are checked end to end through the answer, both at the `classify` mapping.\
  \ A refused connection (ECONNREFUSED) and a statement timeout (57014) are each shown to answer 503 SYSTEM_SERVICE_UNAVAILABLE\
  \ rather than SYSTEM_INTERNAL_ERROR. The other ways the store can be unreachable (ETIMEDOUT, ENOTFOUND,\
  \ ECONNRESET, 57P03) are checked only against the `isPgUnavailable` predicate, never against the answer.\
  \ Those predicate tests pin how the code is built, not the fact. If `classify` stopped asking the predicate\
  \ and special-cased ECONNREFUSED and 57014, every test here would still pass while a DNS failure or\
  \ a reset connection answered as an internal failure. Nothing in the set runs an operation either. No\
  \ REST route and no MCP tool whose store access fails is shown to reach the operator as \"a backing\
  \ service is unavailable\". The fact covers every operation in the system, but the proof stops at one\
  \ function. It does not show that the MCP transport's error rendering gives the same answer for these\
  \ errors.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: For each unreachable-store cause (connection refused,\
  \ connect timeout, host not found, connection reset, server not accepting connections 57P03) and for\
  \ statement timeout 57014: an operation whose store access throws that error, called through the REST\
  \ route and through the MCP tool. The expected result on each is an answer naming SYSTEM_SERVICE_UNAVAILABLE\
  \ (503 over REST, isError carrying that code over MCP) and never SYSTEM_INTERNAL_ERROR..\nCertification\
  \ of constraints/mcp-failure-is-tool-error did not hold: the auditor answered `partial` — The suite\
  \ tests one failure: a call to a tool name that is not registered. For that call it asserts isError=true,\
  \ that content[0].text parses as JSON, that code is NOT_FOUND and that message names the tool. It never\
  \ asserts details, so the fact could lose details from the JSON text and this test would still pass.\
  \ It also never tests an operation that a reached handler refuses or fails. Every handler in the fixture\
  \ returns ok:true. No handler returns an error envelope with code, message and details. No handler throws.\
  \ So the suite never checks how a refused or failed operation, as opposed to a missing tool, is turned\
  \ into a tool error. The file's own comment says that mapping is covered by the knowledge-graph MCP\
  \ suite. That suite is not in the offered proof, and the comment is not evidence. The success test (\"\
  list_node_types returns isError=false and a JSON-parseable OK payload\") tests the path that succeeds\
  \ and does not bear on the fact.. The node is decided by reading, and a certification standing on it\
  \ from an earlier reconciliation is released by the bind. The remainder is testable: Through buildConfiguredMcpServer,\
  \ one handler returns ok:false with an error carrying a known code, message and non-empty details, and\
  \ a second handler throws. Each call should answer isError=true. In the first case, content[0].text\
  \ should parse to the same code, message and details. In the second, it should parse to a code and a\
  \ message, plus details if the fact's mapping requires them..\nCandidates: 1 opened across 1 of 3 delegation(s);\
  \ each return lists its own under `candidates_opened`.\nUnstated: 3 fact(s) the source states that no\
  \ node holds, over 2 file(s), listed under `unstated`. They block no binding here and no rebind closes\
  \ them — the route is the analysis that gives each fact a node.\nRestates: 3 place(s) where text in\
  \ the source restates a node's fact the code holds, over 2 file(s), listed under `restates`. The pair\
  \ conforms, so none blocks a binding — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/certify-unit-root.returns/`, which are the evidence behind every entry above.
