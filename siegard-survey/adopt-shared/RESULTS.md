# adopt-shared — RESULTS

Runbook: `siegard-survey/RUNBOOK-adopt-context.md`. Plugin root `P` = `~/.claude/plugins/cache/siegard-generator/siegard/4.28.0`.

Start instant: `2026-09-30T22:46:04Z`

Authorization: after chat the owner asked "Esse contexto está pronto? Se sim, siga para o próximo"; this run takes the same terms as the earlier invocations — commit at each STOP with the runbook's pathspec, continue through the end of Step 6.

## Step 1 — preconditions

```
$ grep "version" /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/.claude-plugin/plugin.json
  "version": "4.28.0"
[exit 0]
$ git status --porcelain -- specification backend siegard-trace.json siegard-reconcile siegard.json
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/project.py /home/siegfriedneto/projects/eternal
standard backend: /home/siegfriedneto/projects/eternal/standards/backend-node-service.yaml
standard database: declared none
specification_root: /home/siegfriedneto/projects/eternal/specification
target backend: /home/siegfriedneto/projects/eternal/backend
target database: /home/siegfriedneto/projects/eternal/migrations
work_root: /home/siegfriedneto/projects/eternal/siegard-work
delivery_root: /home/siegfriedneto/projects/eternal/siegard-delivery
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/trace.py --untraced backend
279 tracked file(s) under backend: 124 bound, 155 no binding names
  22 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  133 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
   34  backend/src/__tests__/unit/ingestion
    9  backend/src/__tests__/unit/chat
    9  backend/src/modules/chat/service/__tests__
    7  backend
    7  backend/src/__tests__/unit
    7  backend/src/__tests__/unit/knowledge-graph
    7  backend/src/__tests__/unit/query-retrieval
    5  backend/src/__tests__/integration/ingestion
    5  backend/src/shared
    3  backend/src
    3  backend/src/__tests__/integration/curation
    3  backend/src/__tests__/integration/knowledge-graph
    3  backend/src/__tests__/unit/compliance-audit
    3  backend/src/config
    3  backend/src/mcp
  (15 more directories; --all lists every file)
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/spec.py specification
specification sound: 89 element(s), 433 rule(s), 9 scenario(s), 5 contract(s), 18 constraint(s) across 2 context(s); 116 decision(s) disclosed, 2 location(s) retired
[exit 0]
```

Result: version 4.28.0; `git status` printed nothing; specification sound. Preconditions hold.

`--untraced` line recorded: `279 tracked file(s) under backend: 124 bound, 155 no binding names` (22 holds-nothing, 0 outside, 133 unsurveyed).

## Step 2 — the survey

Areas (from the runbook table): `transport` = `src/shared/error-mapping.ts`, `src/middleware/error-handler.ts`, `src/middleware/auth.ts`, `src/shared/health.ts`. Every other unsurveyed non-test file under `backend/` is in the table's outside list (`src/app.ts`, `src/server.ts`, `src/mcp-stdio.ts`, `src/config/{db,env,logger}.ts`, `src/mcp/{sdk-http-transport,server,stdio-tools}.ts`, `src/shared/{invariant-error,pg-transaction,zod-coercion}.ts`, and the seven backend-root files) — checked with `trace.py --untraced backend --all`; no file outside both.

Delegation: one `siegard:domain-surveyor`, handed the target source root, the area's file list, target `backend`, the digest as a file path (`/tmp/sh/digest.txt`, 65 641 bytes), the request to cite the names a caller reads, and the YAML-string warning. The return was saved by script (`/tmp/sh/save_survey.py`) from the last assistant message of `tasks/<id>.output` (unfenced; no edit). Not refused; not re-run. Usage: 90 733 tokens, 11 tool uses, 107 s.

```
$ python3 -B $P/bin/trace.py --survey siegard-survey/adopt-shared/transport.md
siegard-survey/adopt-shared/transport.md: 60 fact line(s) over 4 file(s) — Facts 28, Answers 19, Vocabularies 6, Upstream artifacts 7
[exit 0]
```

Every file is named by a fact.

### Observed and not decided here

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

### read_outside_area

  - "src/config/env.ts — to see how the NODE_ENV, NEON_AUTH_URL, NEON_AUTH_JWKS_TTL_S and LOCAL_OPERATOR_TOKEN variables read by auth.ts are declared and defaulted"
  - "src/config/db.ts — to see what the database probe called by collectHealth does (pingDatabase)"
  - "src/app.ts — to see where the error handler, the auth preHandler scope and the health probe are mounted and which HTTP status the probe gets"

Handoff: `/siegard:analyse` with project root `/home/siegfriedneto/projects/eternal`, material `siegard-survey/adopt-shared/transport.md`.

STOP (Step 2) — material read by the orchestrator; the owner's authorization carries the run on to Step 3.

## Step 3 — the analysis

`/siegard:analyse` run inline over `transport.md`, project root `/home/siegfriedneto/projects/eternal`. Helper scripts `/tmp/sh/nodes.py`, `/tmp/sh/ledger.py` (writes through `lib.py`; decision log appended as text).

Impact set read: every `constraints/*` node (18), the three `*-transports-answer-alike` constraints in particular, `constraints/retrieval-requires-owner-authentication`, the answers of `contracts/knowledge-base/{ingestion,retrieval,curation,compliance-audit}` and `contracts/chat/conversations` (the transport-wide answers they already carry: unavailable store, internal failure, validation shape), and the decision-log entries locating them.

### Nodes

- created (11): `contracts/knowledge-base/access` (api, published; operations `authenticate-owner`, `route-request`, `read-health`), `domain/knowledge-base/health-report`, `domain/knowledge-base/database-status`, `rules/knowledge-base/health-probe-never-fails`, `rules/knowledge-base/health-checked-at-probe-start`, `constraints/every-operation-requires-owner-authentication`, `constraints/local-operator-token-development-only`, `constraints/failures-answer-one-envelope`, `constraints/mcp-failure-is-tool-error`, `constraints/internal-failure-withholds-cause`, `constraints/unreachable-store-answers-unavailable` (all constraints scope `system`).
- removed (1): `constraints/retrieval-requires-owner-authentication` — merged into the system constraint; it held no binding in `siegard-trace.json`, no decision-log entry and no ledger entry, so nothing was retired and nothing needs `--prune`.
- changed: `decision-log.md` (7 entries). Projections rederived.

### Decisions logged (7)

1. `contracts/knowledge-base/access.md` `operations` — one published api holds the answers every request can receive before or apart from its operation (authentication, routing and validation, health).
2. `domain/knowledge-base/health-report.md` `type` — value-object in the knowledge-base context.
3. `contracts/knowledge-base/access.md` `answers` — **against the code**: every SYSTEM_SERVICE_UNAVAILABLE answers "A backing service is temporarily unavailable." (a framework 503 answers "Internal server error." today).
4. `contracts/knowledge-base/access.md` `answers` — **against the code**: every validation failure answers "Request payload failed validation." with `details` a bare list of `{ path, message }` (framework validation passes its raw array and message today).
5. `contracts/knowledge-base/access.md` `answers` — **against the code**: a key set that cannot be fetched answers 503 SYSTEM_SERVICE_UNAVAILABLE (401 AUTH_TOKEN_INVALID today).
6. `contracts/knowledge-base/access.md` `answers` — a framework refusal below 500 not otherwise mapped keeps its status with SYSTEM_INTERNAL_ERROR (as the code does).
7. `constraints/every-operation-requires-owner-authentication.md` `statement` — one system constraint for every operation; the retrieval-only constraint removed.

### Watch items

- The token's issuer and audience are not checked; the constraint requires a token the provider signed, unexpired, naming the owner, and says nothing of issuer or audience.
- Whether the health probe itself is authenticated is decided in `src/app.ts`, outside the areas; the system constraint says every operation authenticates the owner.
- `SYSTEM_INTERNAL_ERROR` maps to 500 in the registry and rides a 4xx for unmapped framework refusals (decision 6).

`--shape --of` over the 11 nodes: none at or past its class p90; no shared phrase, no multi-sentence statement.

Cross-check: `every-operation-requires-owner-authentication` × `local-operator-token-development-only` (the second is the one path in without a signed token, bounded to development: consistent); `unreachable-store-answers-unavailable` × the contracts' unavailable answers (same message and code everywhere after decision 3); `failures-answer-one-envelope` × `mcp-failure-is-tool-error` (the MCP rendering carries the same code, message and details). No further case decided.

### What this increment may have put the code in breach of

Decisions 3–5 are against the code on purpose. Beyond them, this step never read the target.

### `--ledger` (verbatim)

```
$ python3 -B $P/bin/trace.py --ledger siegard-survey/adopt-shared/ledger.md specification
ledger sound: 60 fact line(s) over 1 material file(s) — 53 landed in 14 node(s), 7 left out with a reason
  file set: 4 file(s) the material read; candidates per file:
    src/middleware/auth.ts: 3
    src/middleware/error-handler.ts: 3
    src/shared/error-mapping.ts: 8
    src/shared/health.ts: 5
  candidates, all: constraints/curation-transports-answer-alike constraints/every-operation-requires-owner-authentication constraints/failures-answer-one-envelope constraints/ingestion-transports-answer-alike constraints/internal-failure-withholds-cause constraints/local-operator-token-development-only constraints/mcp-failure-is-tool-error constraints/retrieval-transports-answer-alike constraints/unreachable-store-answers-unavailable contracts/knowledge-base/access domain/knowledge-base/database-status domain/knowledge-base/health-report rules/knowledge-base/health-checked-at-probe-start rules/knowledge-base/health-probe-never-fails
[exit 0]
```

Sound on the first run. Left out (7): the code-to-status registry lookup and its fallback (2, implementation: each code's status is held by the contract answers that raise it), the registry vocabulary line (held by those answers), the unique-violation signal (held by each uniqueness rule), the key-set path (vendor boundary), the auth environment names (configuration), the framework's error shapes (implementation).

### Validator and projections

```
$ python3 -B $P/bin/spec.py specification
specification sound: 91 element(s), 435 rule(s), 9 scenario(s), 6 contract(s), 23 constraint(s) across 2 context(s); 123 decision(s) disclosed, 2 location(s) retired
[exit 0]
$ python3 -B $P/bin/spec.py --project specification
specification sound: 91 element(s), 435 rule(s), 9 scenario(s), 6 contract(s), 23 constraint(s) across 2 context(s); 123 decision(s) disclosed, 2 location(s) retired
projected 8 file(s) into specification/projections: capability-map.mmd, class-diagram-chat.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md, state-knowledge-base-llm-run.mmd
[exit 0]
```

Candidates for the adoption: the 11 created nodes, plus `constraints/ingestion-transports-answer-alike`, `constraints/retrieval-transports-answer-alike` and `constraints/curation-transports-answer-alike`, which the ledger lands on transport.md:23 (the ledger's candidate list above is the set the staging reads).

Handoff: `/siegard:reconcile` as an adoption — slug `adopt-shared`, ledger `siegard-survey/adopt-shared/ledger.md`, outside as the runbook lists, certifications none.

STOP (Step 3) — committed with pathspec `specification siegard-survey/adopt-shared`.
