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

## Step 4 — the adoption

Invoked `/siegard:reconcile` as an adoption: slug `adopt-shared`, ledger `siegard-survey/adopt-shared/ledger.md`, outside the 19 files the runbook lists (passed as `--outside`), certifications none. Preconditions held: the files and `siegard-trace.json` were clean, the specification sound, the trace sound (`497 binding(s), 5 of them decided by a certified test`), `siegard-reconcile/adopt-shared.md` free.

Staging line (verbatim):

```
staged adopt-shared: 4 file(s) to judge over 0 node(s); staged as an adoption — 14 candidate node(s) from the ledger, 19 pair(s) over 4 file(s) (8 at most on one file), each bound by the fold to the files that hold its fact; 19 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 4 file(s) the trace binds nothing to, 4 of them judged over the candidates alone
  manifest and packs at /tmp/tmp.kXa5evg3Tm; candidate index at /tmp/tmp.kXa5evg3Tm/candidates.txt
  save each delegation's return verbatim at /home/siegfriedneto/projects/eternal/siegard-reconcile/adopt-shared.returns/<file path with '/' as '__'>.yaml
```

Node pack sizes (workspace `/tmp/tmp.kXa5evg3Tm`, not committed):

- `src__middleware__auth.ts.md`: 5220 bytes
- `src__middleware__error-handler.ts.md`: 5162 bytes
- `src__shared__error-mapping.ts.md`: 7162 bytes
- `src__shared__health.ts.md`: 6242 bytes

Judges: 4 `siegard:specification-conformance-reviewer` delegations, one per file, one batch; **4 judges**, none re-run. Same prompt as chat (absolute paths, contract path, only the contract's keys at every depth, `|-` blocks). Returns saved by script (`/tmp/sh/save_judges.py`) from the last assistant message of each `tasks/<id>.output`, fence stripped where present (3 of 4), validated against `schemas/conformance-return.json`. None retyped. Returns refused: **0**; `--fold` refused nothing.

Premise: title "Adoption of the shared transport context"; one `change` line per judged file (4).

```
$ python3 -B $P/bin/trace.py --fold backend /tmp/tmp.kXa5evg3Tm /tmp/tmp.kXa5evg3Tm/premise.yaml siegard-reconcile/adopt-shared.md
folded adopt-shared.md: 13 node(s) cleared, 1 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed
  next: trace.py --reconciliation siegard-reconcile/adopt-shared.md
$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-shared.md
adopt-shared.md holds: 4 file(s), 13 node(s) the judgment cleared, 1 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 13 binding(s) from this record and none for contracts/knowledge-base/access: a node without `encoded_at` is a node this form cannot bind.
$ python3 -B $P/bin/trace.py --bind-record backend specification siegard-reconcile/adopt-shared.md --workspace /tmp/tmp.kXa5evg3Tm
bound constraints/curation-transports-answer-alike to 4 file(s)
bound constraints/every-operation-requires-owner-authentication to 1 file(s)
bound constraints/failures-answer-one-envelope to 1 file(s)
bound constraints/ingestion-transports-answer-alike to 5 file(s)
bound constraints/internal-failure-withholds-cause to 2 file(s)
bound constraints/local-operator-token-development-only to 1 file(s)
bound constraints/mcp-failure-is-tool-error to 1 file(s)
bound constraints/retrieval-transports-answer-alike to 5 file(s)
bound constraints/unreachable-store-answers-unavailable to 2 file(s)
bound domain/knowledge-base/database-status to 1 file(s)
bound domain/knowledge-base/health-report to 1 file(s)
bound rules/knowledge-base/health-checked-at-probe-start to 1 file(s)
bound rules/knowledge-base/health-probe-never-fails to 1 file(s)
13 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-shared.md
  1 node(s) of adopt-shared.md the judgment did not clear, and this bind wrote none of them:
    contracts/knowledge-base/access
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
[exit 0]
```

## Step 5 — what it shows

```
$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-shared.md
adopt-shared.md holds: 4 file(s), 13 node(s) the judgment cleared, 1 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 13 binding(s) from this record and none for contracts/knowledge-base/access: a node without `encoded_at` is a node this form cannot bind.
$ python3 -B $P/bin/trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/middleware/auth.ts
    contracts/knowledge-base/access — found against in adopt-shared.md
  backend/src/middleware/error-handler.ts
    contracts/knowledge-base/access — found against in adopt-shared.md
  backend/src/modules/chat/prompts/chat-summary/v1.ts
    rules/chat/rolling-summary-folds — found against in adopt-chat.md
  backend/src/modules/chat/prompts/v3.ts
    constraints/chat-toolset — found against in adopt-chat.md
  backend/src/modules/chat/repository/chat.repository.ts
    rules/chat/message-listing-pages-backwards — found against in adopt-chat.md
  backend/src/modules/chat/routes/chat.schemas.ts
    contracts/chat/conversations — found against in adopt-chat.md
  backend/src/modules/chat/routes/conversations.routes.ts
    rules/chat/graph-delta-follows-tool-result — found against in adopt-chat.md
    rules/chat/replay-reports-failure — found against in adopt-chat.md
    rules/chat/send-message-check-order — found against in adopt-chat.md
  backend/src/modules/chat/service/conversation.service.ts
    contracts/chat/conversations — found against in adopt-chat.md
  backend/src/modules/chat/service/errors.ts
    contracts/chat/conversations — found against in adopt-chat.md
  backend/src/modules/chat/service/graph-normalizer.ts
    rules/chat/graph-delta-follows-tool-result — found against in adopt-chat.md
    rules/chat/graph-delta-unreadable-result — found against in adopt-chat.md
  backend/src/modules/chat/service/message-sequence.ts
    rules/chat/model-context-well-formed — found against in adopt-chat.md
  backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts
    rules/knowledge-base/compliance-deletion-tombstones — found against in adopt-compliance-audit.md
    rules/knowledge-base/source-status-active-or-deleted — found against in adopt-compliance-audit.md
  backend/src/modules/compliance-audit/service/compliance-audit.service.ts
    rules/knowledge-base/compliance-deletion-redacts-content — found against in adopt-compliance-audit.md
  backend/src/modules/curation/dto/dispute.dto.ts
    domain/knowledge-base/adjusted-period — found against in adopt-curation.md
  backend/src/modules/curation/repository/curation.repository.ts
    rules/knowledge-base/metrics-disputed-queue-count — found against in adopt-curation.md
  backend/src/modules/curation/service/dispute.service.ts
    contracts/knowledge-base/curation — found against in adopt-curation.md
    rules/knowledge-base/dispute-scope — found against in adopt-curation.md
  backend/src/modules/curation/service/errors.ts
    contracts/knowledge-base/curation — found against in adopt-curation.md
  backend/src/modules/curation/service/queue.service.ts
    rules/knowledge-base/review-queue-page-windows-entries — found against in adopt-curation.md
  backend/src/modules/ingestion/chunker/v1.ts
    rules/knowledge-base/speaker-line — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/index.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-attribute.dto.ts
    domain/knowledge-base/value-type — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-fragment.dto.ts
    rules/knowledge-base/fragment-recorded-proposed — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/propose-fragment.handler.ts
    rules/knowledge-base/tool-call-validation-outcome — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/transport.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v4.ts
    rules/knowledge-base/caller-never-states-received — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/affected-nodes.ts
    rules/knowledge-base/affected-nodes-follow-merges — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/directed-ingestion.service.ts
    domain/knowledge-base/directed-item — found against in adopt-ingestion.md
    rules/knowledge-base/every-proposal-audited — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/graph-consolidation.service.ts
    rules/knowledge-base/reaffirmation-consolidates — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/ingestion.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
    scenarios/knowledge-base/held-content-under-another-model — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/llm-run.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/structural.ts
    rules/knowledge-base/attribute-value-parses — found against in adopt-ingestion.md
    scenarios/knowledge-base/impossible-calendar-date-refused — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/temporal.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/knowledge-graph/dto/enums.dto.ts
    domain/knowledge-base/source-type — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/dto/node.dto.ts
    rules/knowledge-base/page-limit-bounds — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/dto/queries.dto.ts
    contracts/knowledge-base/retrieval — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/repository/graph.repository.ts
    rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt — found against in adopt-knowledge-graph.md
    rules/knowledge-base/graph-provenance-hides-compliance-deleted — found against in adopt-knowledge-graph.md
    rules/knowledge-base/node-listing-name-prefix — found against in adopt-knowledge-graph.md
  backend/src/modules/knowledge-graph/service/traversal.service.ts
    rules/knowledge-base/traversal-expands-live-nodes — found against in adopt-knowledge-graph.md
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/dto/search.dto.ts
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/search.repository.ts
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval-r2.md

59 finding(s) no bind closed, over 45 file(s):
  59 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  59 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

118 pair(s) the records answer both ways are not listed above: a clearance closes a finding here. No chronology is available — a record carries no timestamp and several land in one commit — so which judgment is current is a reading of the records themselves.
  `--all` lists them, each with what the trace holds for it now

163 unstated fact(s) the records name, over 70 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  0001_init.sql — CREATE TABLE attribute_key, column version (line 198): The attribute-key node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE attribute_valid_value, column version (line 217): The allowed-value node lists value, label, sort_order and description, and no version. The catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE link_type, column version (line 169): Same as node_type. The link-type node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE node_type, column version (line 156): A per-row version number on catalog rows is a domain fact in the schema alone. The node-type node lists only name and description. The next reader looks in the specification for what the number means and does not find it. [adopt-database.md]
  0001_init.sql — curation_action.reason comment, line 511: The rule that a reason is required on destructive curation actions is stated only here. The curation-action node declares reason as optional and no rule requires it. The DDL comment is the only place a reader finds it. [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337 and the header line 57: That a merged node must point at an active survivor, with path compression on write, is a domain rule the source states. No node in the specification holds it. The specification has only "names the survivor exactly when merged" and "never merged into itself". The rule lives where a reader of the specification will not look. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_message, line 108: A message's creation time is declared and required here, and the chronological index depends on it (idx_chat_message_conversation_created_at). domain/chat/message lists no such attribute. The attribute that orders a conversation's turns is held only in SQL. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_tool_call, line 156: A chat tool call's creation time is declared and required here. domain/chat/tool-call lists no such attribute, so the time a tool call was recorded exists only in the table. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.idempotency_key, line 103 (and lines 86-89): The rule that a user message always carries an idempotency key and an assistant message never does is stated only in a comment; the column allows NULL for every row. The node rules/chat/message-idempotency-key-unique says only that a conversation holds at most one message per key. The rule about which role carries a key has no home in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.stop_reason, lines 100-102: The closed vocabulary of reasons a turn stopped, and the rule that only assistant rows carry one, is stated only in a comment. The column is plain text with no check, and domain/chat/message types stop_reason as a bare string. The vocabulary is a business fact that nobody can find in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_tool_call.tool_name, line 138: The restriction of a chat tool call's tool name to the thirteen query tools is stated only in a comment. The column is unconstrained text, and domain/chat/tool-call types tool_name as a bare string. A reader cannot learn from the specification which tools a chat turn may call. [adopt-database.md]
  0004_chat_persistence.sql — header comment on chat_conversation.title, lines 40-41: A conversation title limited to 1..200 characters is a domain rule. It appears only in this comment, which points to an enforcement in the BFF. No node holds it (domain/chat/conversation types title as a bare string), and no constraint in this file holds it. The next reader looks for the title's limits in the specification, finds none, and cannot tell whether the BFF or the specification is the authority. [adopt-database.md]
  0006_original_input.sql — Line 17-18, the COMMENT ON COLUMN raw_information.original_input statement (text stored in the database catalog).: The statement says the column is null outside chat. The specification does not say that. The raw-information node only lists original_input as an optional string. The candidate rule directed-turn-is-original-input only says a directed ingestion made from a chat turn records the turn's excerpt there. Nothing says original_input stays empty for other sources. A reader of the catalog takes this for a decided rule, and the next reader looks for it in the specification and does not find it. [adopt-database.md]
  seeds/0001_seed.sql — section 2, the description column of the 13 link_type rows (lines 43-81): Each link type's required description is catalog text that only this seed holds. The catalog node states label and inverse and stops there, so a reader who looks in the specification finds no description. Some of it restates permitted pairs in prose that has already drifted from the rule node. The part_of description names org, projeto and evento as sources, but the rule node also permits Task to Project. The node moving would never reach this text. [adopt-database.md]
  seeds/0001_seed.sql — section 4, the description column of the 16 attribute_key rows (lines 139-170): Attribute key descriptions, including remarks on stability and on how corrections are made, live only in this seed. No node holds them. The event_type description lists three values while the allowed-values node lists nine, so the seed text and the specification already disagree in words nobody governs. [adopt-database.md]
  ... and 148 more; `--all` lists them
  each is the analysis's to close, through the node that gives the fact a home

395 place(s) the records name where text in the source restates a node's fact the code holds, over 111 file(s). The pair conforms and none is counted above:
  0001_init.sql — the comment before node_alias_one_canonical_uq, line 371 (rules/knowledge-base/one-canonical-alias) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481 (rules/knowledge-base/attribute-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481, read for links (rules/knowledge-base/link-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment on assertion_status (lines 132-133) and the views banner (lines 529-530) (rules/knowledge-base/effective-status) [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337, and the header line 57 (rules/knowledge-base/merged-node-names-survivor) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_basis_ck, line 402 (rules/knowledge-base/attribute-start-has-basis) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_interval_ck, line 399 (rules/knowledge-base/attribute-validity-ordered) [adopt-database.md]
  0001_init.sql — the header comment lines 58-60 and the comment on raw_information lines 226-228 (rules/knowledge-base/compliance-deletion-tombstones) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — comment above C.3 AttributeKeys, lines 58-60 (rules/knowledge-base/temporal-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the AttributeKey count (rules/knowledge-base/catalog-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the NodeType count (rules/knowledge-base/catalog-node-types) [adopt-database.md]
  seeds/0003_event_type_taxonomy.sql — header comment, lines 6-10 and 26-30 (the "+5 valid_values" list, the original four values, the sort_order note and the totals) (rules/knowledge-base/allowed-event-types) [adopt-database.md]
  src/middleware/auth.ts — comments at lines 110-113 and 132-136 ("DEV-ONLY") (constraints/local-operator-token-development-only) [adopt-shared.md]
  src/middleware/auth.ts — header comment, lines 9-12 ("Error mapping") (contracts/knowledge-base/access) [adopt-shared.md]
  src/middleware/error-handler.ts — the header comment, line 14 (constraints/unreachable-store-answers-unavailable) [adopt-shared.md]
  ... and 380 more; `--all` lists them
  a comment is removed, never refreshed, and the file reconciled after

50 node(s) a refused certification left decided by reading with a testable remainder — the auditor named the assertion that would close each, and a node a certified test decides pays no judge again:
  constraints/ingestion-transports-answer-alike [adopt-ingestion.md]
    would close it: The set of ingestion operations exposed on both transports is finite, and so is the set of refusals each one declares. The remainder is a table: for each shared operation, send one valid input over REST and over MCP and assert the two results are equal. Then, for each refusal that operation declares, send one refusing input over both and assert the two error codes are equal.
    src/modules/ingestion/mcp/propose-link.handler.ts — 6 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/transport.ts — 1 binding(s) a reading decides on this file; closing this one frees its judge
    src/modules/ingestion/routes/ingestion.routes.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/affected-nodes-of-a-run [adopt-ingestion.md]
    would close it: Four checks would close the gap: (a) A link proposal whose outcome is that it superseded a previous assertion, and another whose outcome is disputed, each expected to add both linked nodes to the run's list. (b) An attribute proposal whose outcome is that it superseded a previous assertion, expected to add the node it describes. (c) Two proposals whose nodes both lead to the same surviving node, expected to list that node once, where it was first reached. (d) If the fact is meant to include resolving a merged node to the node it was merged into, a merged node expected to appear as that surviving node. Nothing is needed for (d) if the fact is not meant to include that.
    src/modules/ingestion/service/affected-nodes.ts — 4 binding(s) a reading decides on this file
  rules/knowledge-base/attribute-value-in-allowed-values [adopt-ingestion.md]
    would close it: One input against one expected result. Send a proposal, through proposeAttributeService or POST propose-attribute, for a key with allowed values ("proposta", "relatório"). Give it a value that differs from one of them only by case or accent ("Proposta", "relatorio"). Expect a VALIDATION_INVALID_FORMAT refusal with no node_attribute and no provenance written.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/structural.ts — 2 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/below-confidence-floor-records-nothing [adopt-ingestion.md]
    would close it: Three assertions would close it. First, an attribute proposal at a confidence just under 0.40 (e.g. 0.39) comes back rejected and records no node attribute. Second, a link proposal at 0.39 comes back rejected and records no knowledge link. Third, the same proposals at exactly 0.40 are not rejected with BELOW_CONFIDENCE_FLOOR, which pins the floor at 0.40 for both links and attributes.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/validation/confidence.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-excerpt-is-verbatim [adopt-ingestion.md]
    would close it: Feed inputs that take the `email` header/body split, the `chat` speaker split, the `transcricao` turn split and the BR-07 sentence fallback on an oversize block. For every emitted chunk, the expected result is text exactly equal to the code points of the original between offset_start and offset_end. Then store such content as a raw chunk and read it back: the stored excerpt should equal the same slice of the raw content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-index-follows-content [adopt-ingestion.md]
    would close it: One input would close it: content that has several hard-boundary blocks where at least one is over CHUNK_HARD_MAX. The expected result is that the chunks, taken in order of offset_start, carry chunk_index 0, 1, …, n-1 with no gaps. The same check is needed on the raw chunks read back after ingesting that content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/conflict-disputes [adopt-ingestion.md]
    would close it: One input: a proposal on a type that does not allow multiple current assertions, meeting a current assertion (EXISTING_LINK_ID, and separately EXISTING_ATTR_ID) as a dispute. One expected result: the status write sets disputed on that same assertion's id, shown by the UPDATE's bound id and set status or by reading the assertion back, alongside the new disputed row that supersedes nothing.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/consolidation-records-provenance [adopt-ingestion.md]
    would close it: Each open part takes one input and one expected result. First, a taken link proposal that cites two distinct fragments should leave exactly two provenance rows, one per cited fragment, each on the id of the link it landed on. Second, the same check for a taken attribute proposal, with each row on the attribute it landed on. Third, a taken proposal that consolidates onto an existing link or attribute should add one provenance per cited fragment on that existing assertion, not on a new one.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/content-hash-is-sha256 [adopt-ingestion.md]
    would close it: One input against one expected result. Ingest a raw information whose content includes non-ASCII characters, then read it back. Its content_hash should equal a fixed literal: the known 64-character lowercase hexadecimal SHA-256 digest of that content's UTF-8 bytes, computed independently of sha256Hex. A test built this way exists to check the hash and nothing else.
    src/modules/ingestion/dto/ingest-raw-information.dto.ts — 7 binding(s) a reading decides on this file
    src/modules/ingestion/dto/raw-information.dto.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/hash.ts — 2 binding(s) a reading decides on this file
    src/modules/ingestion/service/ingestion.service.ts — 10 binding(s) a reading decides on this file
  rules/knowledge-base/correction-replaces [adopt-ingestion.md]
    would close it: One input: a proposal with change_hint correction and fragment text with no errata or succession marker, meeting a current assertion. Expected result: the current row closed as superseded, its valid_to untouched, and one new row whose supersedes_*_id is that row's id. Assert this for a link and for an attribute, and if the rule is meant to reach multi-valued types, once for each of those too.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/correction-requires-errata-evidence [adopt-ingestion.md]
    would close it: Each case is one input against one result. A correction whose one cited fragment contains a given word should be accepted, and this should be checked for each of errado, correção, corrigir, correction and correcao. Upper-case and mixed-case forms of at least one word (for example "ERRATA", "Correção") should be accepted. A correction citing several fragments, where exactly one carries a word, should be accepted. A correction citing no fragment should be refused. Each case can be checked at the proposal entry point, so the texts checked are the cited fragments' texts.
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/temporal.ts — 7 binding(s) a reading decides on this file
  rules/knowledge-base/default-prompt-version [adopt-ingestion.md]
    would close it: Input: one document ingestion with no prompt version, with real intake and the extraction orchestrator driven against a fake LLM provider. Expected result: the run it creates records prompt_version "v4", and the system prompt sent to the provider is the v4 system prompt. The same assertion is needed for each other document-ingestion entry point that accepts an omitted prompt version.
    src/modules/ingestion/mcp/ingest-document.handler.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/prompts/index.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/directed-attribute-value-as-text [adopt-ingestion.md]
    would close it: Run directedIngestionService with a directed attribute whose value is the number 30, and a second whose value is the boolean true (and one with false). Expect propose_attribute to receive the value as the strings "30", "true" and "false", checked with a strict type-sensitive equality, not a string interpolation.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dependency-failed [adopt-ingestion.md]
    would close it: Four orchestrator inputs would close it, each with the item reported dependency_failed, its propose handler never called, and the reason naming the expected reference. An attribute whose node and evidence are both missing: the reason names the node. A link whose target is missing and whose source and evidence resolve: the reason names the target. A link whose source, target and evidence are all missing: the reason names the source. A link whose target and evidence are both missing and whose source resolves: the reason names the target. Adding one attribute or link whose reference no item in the payload declares would cover the never-declared case.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dispatch-order [adopt-ingestion.md]
    would close it: Send a directed ingestion with at least two attributes and at least two links, each group in a known order. Expect the attribute proposals, and then the link proposals, in exactly that order. Expect the report to list those attribute and link entries in that same order, after the fragments and nodes. To close the sequencing gap as well, the fragment stubs should settle later than they are called. Then expect that no node proposal starts before every fragment proposal has settled.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  ... and 35 more; `--all` lists them
  each is closed by writing the test named, and the route that writes it is a proof increment: `/deliver-scope`, with an ask naming the proof increment and, per fact to close, the node, the assertion verbatim, the record in brackets and the files above, spelled from the target source root as printed — /plan-work plans one task per fact, /implement-task writes the proof alone, and the review certifies it. Which facts are worth a test is the asker's; name the ones wanted, under a new slug
[exit 1]
$ python3 -B $P/bin/trace.py --untraced backend
279 tracked file(s) under backend: 128 bound, 151 no binding names
  22 holds-nothing: judged by an adoption, which bound none of its candidates to it
  19 outside: kept outside an adoption's judgment
  110 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
   34  backend/src/__tests__/unit/ingestion
    9  backend/src/__tests__/unit/chat
    9  backend/src/modules/chat/service/__tests__
    7  backend/src/__tests__/unit
    7  backend/src/__tests__/unit/knowledge-graph
    7  backend/src/__tests__/unit/query-retrieval
    5  backend/src/__tests__/integration/ingestion
    3  backend/src/__tests__/integration/curation
    3  backend/src/__tests__/integration/knowledge-graph
    3  backend/src/__tests__/unit/compliance-audit
    3  backend/src/modules/chat/prompts/__tests__
    3  backend/src/modules/chat/routes/__tests__
    3  backend/src/modules/curation/mcp
    2  backend/src/__tests__/integration/compliance-audit
    2  backend/src/__tests__/integration/query-retrieval
  (9 more directories; --all lists every file)
[exit 0]
$ python3 -B $P/bin/trace.py --convergence backend specification siegard-work
564 node(s) of specification; 507 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

485 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 21, contract 1, element 75, rule 382, scenario 6
22 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
    contract 1, element 12, rule 9
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
57 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 4, element 4, rule 44, scenario 3

files under backend: 279 tracked, 128 bound, 151 no binding names (110 unsurveyed) — `--untraced` lists them

507 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 59 finding(s) past reconciliations left open and no bind closed (59 unseen, 0 covered, 0 reported); 118 pair(s) the records answer both ways; 163 unstated fact(s) the source states and no node holds; 395 place(s) text restates a node's fact; 50 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
$ python3 -B $P/bin/trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
contracts/knowledge-base/retrieval: bound at sha256:0b56247fe50203561f9d02f09a2c23438a20e28f672cdee5f0fe31ae24eb71c5, now sha256:a7c1c7f87afc4014dd26b0123d83a3f2f8f02b62968a7e1e33928f5620295b67; the specification moved since this bind
domain/chat/graph-view: migrations/0005_chat_graph_view.sql was stamped against sha256:8d4e6c2480dbeb47d09284a37ac6d1abe5ddcb779bb5627b3dff00ff7e95c913, and the node now reads sha256:0e2fa6725c82a0a7d00511c818f8a83e74c0d0022c4c22c82b2cf1ff4cf31caf; a later bind restamped the node on other files and nobody read this one against it
domain/chat/message: migrations/0004_chat_persistence.sql was stamped against sha256:d64aab2749774f99a3422a09a79f23913501e701ad6ef16ed25f2e68bc0240de, and the node now reads sha256:7ee73e120a1ab06a13cd259e2e84c84a0c533bb4d6c8eb90626f6183461c6b48; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/accepted-fragment-filter: bound at sha256:1b25aa96d866d21eb71c4539179a67e630f7cd8e0a486ee55d569f750e61c48c, now sha256:a5d33ecf0d633813dfb40119cbdc8b4ca73ba5d8249039fc97b3156eb4a080db; the specification moved since this bind
domain/knowledge-base/attribute-key: backend/src/modules/ingestion/catalog/catalog.ts was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/attribute-key: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/attribute-key: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/attribute-key: migrations/0001_init.sql was stamped against sha256:189c4a26a14f7fcdd3c11bd2137125bcc7bbc09b0b263d198d1bb703fe01b83b, and the node now reads sha256:52fe7cb3953e31b87c00b776207e1ba64253f4f6bb55e46800c94e748595d769; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/repository/provenance.repository.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/service/provenance.service.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: migrations/0001_init.sql was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/curation-action: migrations/0001_init.sql was stamped against sha256:f8a81f093809fc81823674eb275bc00dddf77b03a5b64be86b3682cc61e05802, and the node now reads sha256:7b7ad69429ff158003ea4190e60389bf753ada085b02b81e739fcfeafabecbc3; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: backend/src/modules/knowledge-graph/dto/link.dto.ts was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: backend/src/modules/query-retrieval/repository/provenance.repository.ts was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: backend/src/modules/query-retrieval/service/provenance.service.ts was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/knowledge-link: migrations/0001_init.sql was stamped against sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef, and the node now reads sha256:d9f2f0ce04c4eb9b9faa8a03a9ca821dabc0767398e1cc6df688f4deb2a93bd9; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/link-type: backend/src/modules/ingestion/catalog/catalog.ts was stamped against sha256:04bd6db04762a40900df598fce04f71c0b7effdcc762b5665ccd817914d5c67b, and the node now reads sha256:1197377da9deedcffa9daade2091b6fd27a3eda05860bbbfd4bc042893d78a4c; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/link-type: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:04bd6db04762a40900df598fce04f71c0b7effdcc762b5665ccd817914d5c67b, and the node now reads sha256:1197377da9deedcffa9daade2091b6fd27a3eda05860bbbfd4bc042893d78a4c; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/link-type: migrations/0001_init.sql was stamped against sha256:04bd6db04762a40900df598fce04f71c0b7effdcc762b5665ccd817914d5c67b, and the node now reads sha256:1197377da9deedcffa9daade2091b6fd27a3eda05860bbbfd4bc042893d78a4c; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-alias: backend/src/modules/ingestion/mcp/mcp-schemas.ts was stamped against sha256:bbe682534ac781ab8f710bd8f1571404e84d239ebf9b7fabed0a77c536aaa055, and the node now reads sha256:65efad208e55f2c1166700b320f20387d98aea055b771bf68f7d7e002cce6452; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-alias: backend/src/modules/ingestion/service/entity-resolution.service.ts was stamped against sha256:bbe682534ac781ab8f710bd8f1571404e84d239ebf9b7fabed0a77c536aaa055, and the node now reads sha256:65efad208e55f2c1166700b320f20387d98aea055b771bf68f7d7e002cce6452; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-alias: migrations/0001_init.sql was stamped against sha256:bbe682534ac781ab8f710bd8f1571404e84d239ebf9b7fabed0a77c536aaa055, and the node now reads sha256:65efad208e55f2c1166700b320f20387d98aea055b771bf68f7d7e002cce6452; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: backend/src/modules/knowledge-graph/dto/attribute.dto.ts was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: backend/src/modules/query-retrieval/repository/provenance.repository.ts was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: backend/src/modules/query-retrieval/service/provenance.service.ts was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-attribute: migrations/0001_init.sql was stamped against sha256:af6bb85f5d6d81065adc0145b5f76301d76ba6057e083d060a84368b6936fcbf, and the node now reads sha256:8ab07420dd477084d39b72050393b5ef5b1c51dd6c1c98f5dc8cc02a4bee6e3e; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-type: backend/src/modules/ingestion/catalog/catalog.ts was stamped against sha256:e02a7a270287441a9381e34edf06e81a576e275fabf8ea65676e43c002eac089, and the node now reads sha256:d10941936802b111d44cfdbea63247beef38598cf5eaa08cf388b3a01bc2a42a; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-type: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:e02a7a270287441a9381e34edf06e81a576e275fabf8ea65676e43c002eac089, and the node now reads sha256:d10941936802b111d44cfdbea63247beef38598cf5eaa08cf388b3a01bc2a42a; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/node-type: migrations/0001_init.sql was stamped against sha256:e02a7a270287441a9381e34edf06e81a576e275fabf8ea65676e43c002eac089, and the node now reads sha256:d10941936802b111d44cfdbea63247beef38598cf5eaa08cf388b3a01bc2a42a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/attribute-value-in-allowed-values: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:682cc63f34d23e29782bcaf95573c52a5aa82e6e87b857913db60c4209d95e87, and the node now reads sha256:00f964ca2064f33ce76b250529f8048feb2f4230eabc68a82e78d36ebb51f447; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/attribute-value-in-allowed-values: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:682cc63f34d23e29782bcaf95573c52a5aa82e6e87b857913db60c4209d95e87, and the node now reads sha256:00f964ca2064f33ce76b250529f8048feb2f4230eabc68a82e78d36ebb51f447; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/attribute-value-in-allowed-values: backend/src/modules/ingestion/validation/structural.ts was stamped against sha256:682cc63f34d23e29782bcaf95573c52a5aa82e6e87b857913db60c4209d95e87, and the node now reads sha256:00f964ca2064f33ce76b250529f8048feb2f4230eabc68a82e78d36ebb51f447; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/expansion-depth-bounds: backend/src/modules/query-retrieval/dto/search.dto.ts was stamped against sha256:c90be4b8b02205731105fa5da1f9d4bfb0aea23e554672446187ec7612a22bb2, and the node now reads sha256:4213883f08928cbebf27a3fb3aa4f2b123269baca64f394c90a49de00d6ed8bb; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/expansion-follows-both-directions: bound at sha256:06e75f47f180986db02effb008c7410a3463f65b093581bdd246749309c28179, now sha256:d81793db2914d0f7ab8564178d3f7a7f5735444a3c912ef4ee5da24be48cdc0c; the specification moved since this bind
rules/knowledge-base/expansion-restricted-to-named-link-types: backend/src/modules/query-retrieval/service/search.service.ts was stamped against sha256:df5f24cb388a42206e23cf72c240266adffd178b20c5225c88f35fdc70a31598, and the node now reads sha256:da0037c9836d1c3a27e7a64ade4446bcdb00a7a2ef821118ea20aa1c584565b1; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/name-normalization: backend/src/modules/ingestion/service/entity-resolution.service.ts was stamped against sha256:a8be293bc290dcebf58ed976eca106fca33bfd0e9aaf46e4904bd9ab6fbe6551, and the node now reads sha256:2df4fe9c812499469c011d9fec04df897c6cc4338f11520ca1dc42438a702dfd; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/page-defaults: backend/src/modules/knowledge-graph/dto/queries.dto.ts was stamped against sha256:09a78d236f2a5770291a5f37b3cb4808421e69ccf89b074f311693c862ccfa8b, and the node now reads sha256:344637121169fecda7e2038167dd1032054333b3c9032367c8bd17954ae8c3c4; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/page-defaults: backend/src/modules/query-retrieval/dto/fragment.dto.ts was stamped against sha256:4a1d00a6c819add84291f8236ccecd6f980bae2fd75b3571fb551f02212b3786, and the node now reads sha256:344637121169fecda7e2038167dd1032054333b3c9032367c8bd17954ae8c3c4; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/page-defaults: backend/src/modules/query-retrieval/dto/search.dto.ts was stamped against sha256:4a1d00a6c819add84291f8236ccecd6f980bae2fd75b3571fb551f02212b3786, and the node now reads sha256:344637121169fecda7e2038167dd1032054333b3c9032367c8bd17954ae8c3c4; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/stated-start-requires-basis: backend/src/modules/ingestion/prompts/extraction.v1.ts was stamped against sha256:64dc720a25c33ae0251be6a4bd10a1f39621a48f99e58c095d90b30300ebdad3, and the node now reads sha256:b7dd3feeb38490e1bf7d99dd1a9fd0e2762ad549dfbdc4ab3de74afdd7b7755a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/stated-start-requires-basis: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:64dc720a25c33ae0251be6a4bd10a1f39621a48f99e58c095d90b30300ebdad3, and the node now reads sha256:b7dd3feeb38490e1bf7d99dd1a9fd0e2762ad549dfbdc4ab3de74afdd7b7755a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/stated-start-requires-basis: backend/src/modules/ingestion/validation/temporal.ts was stamped against sha256:64dc720a25c33ae0251be6a4bd10a1f39621a48f99e58c095d90b30300ebdad3, and the node now reads sha256:b7dd3feeb38490e1bf7d99dd1a9fd0e2762ad549dfbdc4ab3de74afdd7b7755a; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/unknown-link-type-refused: bound at sha256:b26bdfa836f9b597a12a84d4a1169b114c117a18b0a9a919214be879522c33da, now sha256:d397ade65d61fa6ba1940e735ff39ec423454a3aee415e2fdc17d9cec1cda663; the specification moved since this bind
rules/knowledge-base/validity-start-before-end: backend/src/modules/ingestion/service/propose-attribute.service.ts was stamped against sha256:1a4edaf523b358f51d78aa72212db53a8a16d5ea886f45479fbf19dc10283d60, and the node now reads sha256:1b064abbe915cb2e85132079dea39763dffe669cec6de4a964887a7593aebee3; a later bind restamped the node on other files and nobody read this one against it
rules/knowledge-base/validity-start-before-end: backend/src/modules/ingestion/validation/temporal.ts was stamped against sha256:1a4edaf523b358f51d78aa72212db53a8a16d5ea886f45479fbf19dc10283d60, and the node now reads sha256:1b064abbe915cb2e85132079dea39763dffe669cec6de4a964887a7593aebee3; a later bind restamped the node on other files and nobody read this one against it
backend/src/modules/query-retrieval/service/accepted-fragments.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type
backend/src/modules/query-retrieval/service/provenance.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type

48 drift finding(s) over 507 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  46 moved: bound to a node whose text moved since the bind, or a file stamped against an earlier text of a node a later bind restamped elsewhere; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
[exit 1]
```

### Counts from the record

- cleared: **13** (bound); blocked: **1** (`contracts/knowledge-base/access`), none collateral.
- `contradicts`: **7**; `unstated`: **4**; `restates`: **7**; `unheld`: **0**.

- contradicts `src/middleware/auth.ts` → `contracts/knowledge-base/access`
- unstated `src/middleware/auth.ts` → `—`
- unstated `src/middleware/auth.ts` → `—`
- contradicts `src/middleware/error-handler.ts` → `contracts/knowledge-base/access`
- contradicts `src/middleware/error-handler.ts` → `contracts/knowledge-base/access`
- contradicts `src/middleware/error-handler.ts` → `contracts/knowledge-base/access`
- contradicts `src/shared/error-mapping.ts` → `contracts/knowledge-base/curation`
- contradicts `src/shared/error-mapping.ts` → `contracts/knowledge-base/curation`
- contradicts `src/shared/error-mapping.ts` → `contracts/knowledge-base/ingestion`
- unstated `src/shared/error-mapping.ts` → `contracts/chat/conversations`
- unstated `src/shared/error-mapping.ts` → `—`

`contradicts` against `contracts/knowledge-base/access` (4):
- three come from the decisions logged against the code: the key set that cannot be fetched (`auth.ts`), the framework-validation shape and the framework-503 message (`error-handler.ts`);
- one is an **analysis drop**: transport.md:95 (a framework 422 answers VALIDATION_INVALID_FORMAT) was landed on the contract, but the `route-request` refusals I wrote name 401, 403 and 409 only, so the 422 mapping falls under "another status below 500 → SYSTEM_INTERNAL_ERROR" in the node.

`contradicts` against other contracts (3, from `error-mapping.ts`, judged through the specification root rather than the pack): the registry has no status for `BUSINESS_INVALID_ATTRIBUTE_VALUE` (curation answers 422); it maps `BUSINESS_INVALID_TARGET_NODE` to 422 while curation also answers it 409 for a concurrent change; it maps `BUSINESS_LINK_RULE_VIOLATION` to 422 while ingestion answers HTTP 200 `{ ok: false }` over REST. These nodes were not candidates of this adoption, so the fold blocked nothing for them; the findings stand in `siegard-reconcile/adopt-shared.md` and are carried to the corrections.

### unstated (4)

- `auth.ts` ×2 — the key-set refresh cooldown (surveyor: "Outside the domain", performance) and the key-set path (analysis drop, transport.md:126, "vendor boundary").
- `error-mapping.ts` ×2 — `BUSINESS_CHAT_INGEST_DISABLED` 503 and `RESOURCE_ALREADY_EXISTS` 409: registry codes no contract answers (analysis drop, transport.md:104, "each code's status is held by the answers of the contract whose operation raises it" — no contract raises these two).

### Tokens

`telemetry.py --probe --since 2026-09-30T22:46:04Z .` announced one session, agent types, descriptions, token counts, timestamps and command lines, no message text; then run:

```
$ python3 -B $P/bin/telemetry.py --since 2026-09-30T22:46:04Z .
window: 2026-09-30T22:46:04.000Z .. 2026-09-30T22:53:32.160Z (since named)
framework: 4.28.0 at /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable; 1 session(s) overlap the window
agents: 5 spawned (0 of them by another agent), 5 with a transcript, 33992 output tokens, 261.15s
sessions: 1 orchestrating, 25931 output tokens — never a subagent's, which the line above already carries
commands: 17 invoking this framework's scripts, 0 exiting non-zero
runs: 0 captured
commits: 1; uncommitted: 15
decisions added: 7 (baseline: commit a6bf11b0aa968f132d44b48f5dc9a9a886dd9094)
notes standing: 0
unavailable: nothing
report: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260930T225332Z.json
```

| agent | type | output tokens | input+cache tokens | seconds |
|---|---|---|---|---|
| Survey shared transport area | domain-surveyor | 12631 | 398319 | 107 |
| Judge middleware/auth.ts | specification-conformance-reviewer | 4346 | 142499 | 31 |
| Judge middleware/error-handler.ts | specification-conformance-reviewer | 4590 | 63453 | 33 |
| Judge shared/error-mapping.ts | specification-conformance-reviewer | 10471 | 412287 | 75 |
| Judge shared/health.ts | specification-conformance-reviewer | 1954 | 61783 | 16 |

- surveyor: 12 631 output tokens.
- judges: 21 361 output tokens over 4 judged files; mean per judged file 5 340 output and 170 006 input+cache tokens.
- orchestrating session: 25 931 output tokens, analysis included.

## Step 6 — stop

Committed with pathspec `siegard-trace.json siegard-reconcile siegard-survey/adopt-shared siegard-telemetry`.
