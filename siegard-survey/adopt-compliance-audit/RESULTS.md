# adopt-compliance-audit — RESULTS

Runbook: `siegard-survey/RUNBOOK-adopt-context.md`. Plugin root `P` = `~/.claude/plugins/cache/siegard-generator/siegard/4.28.0`.

Start instant: `2026-09-30T19:12:29Z`

## Step 1 — preconditions

```
$ grep '"version"' /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/.claude-plugin/plugin.json
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
279 tracked file(s) under backend: 60 bound, 219 no binding names
  4 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  215 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
   34  backend/src/__tests__/unit/ingestion
   14  backend/src/modules/chat/service
    9  backend/src/__tests__/unit/chat
    9  backend/src/modules/chat/service/__tests__
    9  backend/src/modules/knowledge-graph/dto
    9  backend/src/modules/knowledge-graph/service
    8  backend/src/modules/curation/service
    7  backend
    7  backend/src/__tests__/unit
    7  backend/src/__tests__/unit/knowledge-graph
    7  backend/src/__tests__/unit/query-retrieval
    6  backend/src/modules/curation/mcp
    5  backend/src/__tests__/integration/ingestion
    5  backend/src/modules/chat/prompts
    5  backend/src/modules/curation/dto
  (39 more directories; --all lists every file)
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/spec.py specification
specification sound: 50 element(s), 231 rule(s), 8 scenario(s), 2 contract(s), 8 constraint(s) across 2 context(s); 85 decision(s) disclosed, 1 location(s) retired
[exit 0]
```

Result: version 4.28.0 (≥ 4.28.0); `git status` printed nothing; specification sound. Preconditions hold.

`--untraced` line recorded: `279 tracked file(s) under backend: 60 bound, 219 no binding names` (4 holds-nothing, 0 outside, 215 unsurveyed).

## Step 2 — the survey

Areas (from `git ls-files`, tests excluded; the context has no tracked test files):

- `service`: `backend/src/modules/compliance-audit/service/compliance-audit.service.ts`, `.../service/errors.ts`, `.../service/transaction.ts`
- `boundary`: `.../dto/compliance-delete.dto.ts`, `.../dto/curation-action.dto.ts`, `.../index.ts`, `.../mcp/compliance-toolset.ts`, `.../repository/compliance-audit.repository.ts`, `.../routes/compliance-audit.routes.ts`

Invocation: `/siegard:survey` — project root `/home/siegfriedneto/projects/eternal`; target `backend`; slug `adopt-compliance-audit`; areas as above.

Disclosures from the run:
- The slug directory already held this `RESULTS.md` (written by Step 1 of the runbook) and no material; the survey proceeded into it rather than treating the slug as taken.
- Tree check `git status --porcelain -- backend/src/modules/compliance-audit` printed nothing.
- The context so far (`spec.py --digest specification`, 35.9 KB) was handed to each surveyor as a file path (`/tmp/digest.txt`) to read once, not pasted inline.
- Two `siegard:domain-surveyor` runs in parallel; each return saved verbatim as `service.md` and `boundary.md`. No return refused; no surveyor re-run.

### Survey report (verbatim)

**Areas as given**
- `service`: `src/modules/compliance-audit/service/compliance-audit.service.ts`, `src/modules/compliance-audit/service/errors.ts`, `src/modules/compliance-audit/service/transaction.ts`
- `boundary`: `src/modules/compliance-audit/dto/compliance-delete.dto.ts`, `src/modules/compliance-audit/dto/curation-action.dto.ts`, `src/modules/compliance-audit/index.ts`, `src/modules/compliance-audit/mcp/compliance-toolset.ts`, `src/modules/compliance-audit/repository/compliance-audit.repository.ts`, `src/modules/compliance-audit/routes/compliance-audit.routes.ts`

**`--untraced` before this survey:** `279 tracked file(s) under backend: 60 bound, 219 no binding names` (4 holds-nothing, 0 outside, 215 unsurveyed).

**`trace.py --survey` (verbatim, exit 0)**
```
siegard-survey/adopt-compliance-audit/service.md: 45 fact line(s) over 3 file(s) — Facts 29, Answers 8, Vocabularies 5, Upstream artifacts 3
  1 file(s) no fact names: src/modules/compliance-audit/service/transaction.ts
siegard-survey/adopt-compliance-audit/boundary.md: 90 fact line(s) over 6 file(s) — Facts 60, Answers 13, Vocabularies 6, Upstream artifacts 11
```
`transaction.ts` is a re-export of the shared transaction wrapper; the surveyor classed it outside the domain (wiring). Carried as a finding, not fixed.

**Observed and not decided here** (service: none; boundary: six)
1. Success shape differs by transport: REST sends bare `{ outcome, deletion }`; MCP wraps `{ ok: true, result }`. Failures share `{ ok: false, error }`.
2. Unexpected failure during deletion: REST re-throws to the framework handler; MCP answers `SYSTEM_INTERNAL_ERROR` itself.
3. Bound violations get different codes by field: reason length → `VALIDATION_OUT_OF_RANGE`; limit/offset out of range → `VALIDATION_INVALID_FORMAT`.
4. Curation action vocabularies closed in the list filter (7 actions, 5 target kinds) but free strings in the answered record and the write path.
5. Cascade "already gone" test differs: chunks by `superseded_at IS NULL`; fragments/links/attributes by `status <> 'deleted'`.
6. Raw information status typed as `active`, `needs_review`, `merged`, `deleted`, but cascades treat every non-`deleted` status (incl. `merged`, `needs_review`) as a surviving source.

**read_outside_area** (gathered)
- service: `src/modules/compliance-audit/repository/compliance-audit.repository.ts`; `src/shared/pg-transaction.ts`
- boundary: `src/modules/compliance-audit/service/errors.ts`; `src/modules/compliance-audit/service/compliance-audit.service.ts`; `src/shared/error-mapping.ts`; `src/mcp/server.ts`; `src/mcp/sdk-http-transport.ts`

The two areas read each other, as expected within one context. Outside the context: `src/shared/*` and `src/mcp/*`, which belong to the `shared` adoption.

**Handoff**
```
/siegard:analyse project root /home/siegfriedneto/projects/eternal; material: siegard-survey/adopt-compliance-audit/service.md, siegard-survey/adopt-compliance-audit/boundary.md
```

Tokens (from the harness): service surveyor 70,968; boundary surveyor 92,013.

**STOP (Step 2).** Awaiting the owner's reading of every material file under `siegard-survey/adopt-compliance-audit/`.

## Step 3 — the analysis

Invocation: `/siegard:analyse` — project root `/home/siegfriedneto/projects/eternal`; material `siegard-survey/adopt-compliance-audit/service.md`, `siegard-survey/adopt-compliance-audit/boundary.md`. Tree check `git status --porcelain -- specification` printed nothing; `spec.py specification` sound before the increment. Context: `knowledge-base` (compliance-deletion and curation-action already lived there from the database adoption).

### Nodes written

Changed (4):
- `domain/knowledge-base/compliance-deletion` — `affected` typed `affected-counts` (was `string`), now required.
- `domain/knowledge-base/curation-action` — `action` typed `curation-action-kind`, `target_kind` typed `curation-target-kind` (both were `string`); gained `created_at` (datetime, required).
- `rules/knowledge-base/compliance-deletion-propagates` — statement revised: only items resting on no other raw information that is not deleted, and not already deleted; description defines "rests on".
- `specification/decision-log.md` — four entries appended (below).

Created (27):
- elements: `domain/knowledge-base/affected-counts`, `compliance-deletion-outcome`, `curation-action-kind`, `curation-target-kind`, `compliance-deletion-filter`, `curation-action-filter`
- rules: `rules/knowledge-base/compliance-deletion-check-order`, `compliance-deletion-reason-length`, `compliance-deletion-reason-trimmed`, `deleted-source-deletion-records-nothing`, `compliance-deletion-redacts-content`, `compliance-deletion-flags-metadata`, `compliance-deletion-keeps-content-hash`, `compliance-deletion-counts-what-it-marked`, `compliance-deletion-records-curation-action`, `deletion-execution-time-is-recording-time`, `curation-action-time-is-recording-time`, `curation-action-reason-length`, `audit-filter-checks-order`, `audit-window-ordered`, `audit-listing-window-half-open`, `audit-filters-match-exactly`, `audit-listing-order`, `audit-listing-total-before-pagination`, `audit-page-defaults`
- contract: `contracts/knowledge-base/compliance-audit` (api, published: compliance-delete, list-compliance-deletions, read-compliance-deletion, list-curation-actions, read-curation-action)
- constraints: `constraints/llm-toolset-omits-audit-reads`, `constraints/compliance-deletion-is-atomic`

Removed: none. Projections re-derived (8 files).

### Impact set read

`spec.py --impact` over 20 entry nodes (compliance-deletion, curation-action, raw-information, raw-chunk, the three compliance rules, source-status-active-or-deleted, the page element and its three rules, all 8 constraints) → 80 nodes, one hop. Read in full: the entry nodes, node-status, item-kind, node-resolution, accepted-fragment-filter, fragment-status, assertion-status, link-proposal-check-order, proposal-run-checks-first, listing-total-before-pagination, reception-time-is-recording-time, tool-call-page-defaults, validity-start-before-end, listing-excludes-compliance-deleted, provenance-refused-after-compliance-deletion, search-excludes-compliance-deleted-sources, chunk-layer-matches-current-chunks, the ingestion contract, and decision-log entries 14, 20, 42, 69, 70, 71, 72, 77, 78.

### Decisions logged (4)

1. `domain/knowledge-base/compliance-deletion.md` `attributes.affected.type` — **retired** entry 71 (`string`): the material now states the shape as four counts, held by `affected-counts`.
2. `domain/knowledge-base/curation-action.md` `attributes.action.type` — decided `curation-action-kind` (closed). The filter closes the kinds to seven while the record and the write path take any text. Why: an action under a kind no listing can filter for is one the audit trail cannot find.
3. `domain/knowledge-base/curation-action.md` `attributes.target_kind.type` — decided `curation-target-kind` (closed), same reasoning over the five target kinds.
4. `rules/knowledge-base/compliance-deletion-propagates.md` `statement` — the standing node deleted every fragment of the source and every assertion whose only provenance is one of them; the material spares items that also rest on another raw information not deleted. Decided the material's reading. Why: knowledge another non-deleted source still attests is held by that source.

### Watch items (tensions with no case decided differently)

- **Surviving assertion, refused provenance read.** A link or attribute kept by the revised propagation because another source attests it still has its provenance read refused by `provenance-refused-after-compliance-deletion` whenever one chain reaches the deleted source. The two decide different questions (status vs. read answer).
- **Chunk "already gone" test** (observed item 5). The code marks chunks with no supersession time; `compliance-deletion-tombstones` says each chunk. Nothing in the specification supersedes a chunk except a compliance deletion, and a deleted source is a no-op, so no case separates them.
- **Merged/needs-review sources counted as survivors** (observed item 6). `source-status-active-or-deleted` admits only active or deleted, so the case never arises.
- **Atomic constraint vs. eventual policies.** `compliance-deletion-is-atomic` demands the deletion's changes take effect together, while the compliance policies declare `consistency: eventual` (the validator requires it across aggregates). Eventual permits, it does not demand, partial visibility.
- **Different codes for bound violations** (observed item 3). The reason length answers `VALIDATION_OUT_OF_RANGE` and the page limit and offset answer `VALIDATION_INVALID_FORMAT`. Each is recorded in the contract as the code actually answered, the same way the ingestion and retrieval contracts answer the page rules.
- **REST unexpected failure** (observed item 2). Left to the shared adoption: the REST answer is decided by the framework error handler. The contract records only the MCP answer for "any other cause".
- **Chunk excerpts and fragment text are not stated as redacted.** The material states only that the raw information's content and original input are redacted, and says nothing about chunk excerpts or fragment text. The analysis wrote no fact about them. The reconciliation should look.
- Repeated phrase "compliance-deletion or curation-action listing" across six rules names two elements each time rather than defining anything; left standing. `audit-page-defaults` parallels `page-defaults` and `tool-call-page-defaults` (distinct listings, distinct defaults); left separate.

### --shape over the 31 nodes

At or past p90: `compliance-deletion-propagates` (96w, reread; one redundant description sentence cut), `audit-filter-checks-order` (67w, same form as the standing check-order rules), `compliance-deletion-records-curation-action` (59w), `compliance-deletion-is-atomic` (46w). Shared phrases are the watch items above. Prose naming siblings: none. Names held nowhere: none. Bare names two nodes answer to: none.

### What this increment may have put the delivered code in breach of

The analysis never reads the target. Two decisions are likely to contradict the code as it stands:
- The closed curation-action kinds and target kinds, where the survey shows the recorded record and the write path taking any text.
- The `curation-action-reason-length` rule, stated from the answer schema only.

Any node here can contradict delivered source; the reconciliation (Step 4) is what finds it.

### Candidates for the reconciliation (the 31 nodes this increment wrote)

```
domain/knowledge-base/compliance-deletion
domain/knowledge-base/curation-action
rules/knowledge-base/compliance-deletion-propagates
constraints/compliance-deletion-is-atomic
constraints/llm-toolset-omits-audit-reads
contracts/knowledge-base/compliance-audit
domain/knowledge-base/affected-counts
domain/knowledge-base/compliance-deletion-filter
domain/knowledge-base/compliance-deletion-outcome
domain/knowledge-base/curation-action-filter
domain/knowledge-base/curation-action-kind
domain/knowledge-base/curation-target-kind
rules/knowledge-base/audit-filter-checks-order
rules/knowledge-base/audit-filters-match-exactly
rules/knowledge-base/audit-listing-order
rules/knowledge-base/audit-listing-total-before-pagination
rules/knowledge-base/audit-listing-window-half-open
rules/knowledge-base/audit-page-defaults
rules/knowledge-base/audit-window-ordered
rules/knowledge-base/compliance-deletion-check-order
rules/knowledge-base/compliance-deletion-counts-what-it-marked
rules/knowledge-base/compliance-deletion-flags-metadata
rules/knowledge-base/compliance-deletion-keeps-content-hash
rules/knowledge-base/compliance-deletion-reason-length
rules/knowledge-base/compliance-deletion-reason-trimmed
rules/knowledge-base/compliance-deletion-records-curation-action
rules/knowledge-base/compliance-deletion-redacts-content
rules/knowledge-base/curation-action-reason-length
rules/knowledge-base/curation-action-time-is-recording-time
rules/knowledge-base/deleted-source-deletion-records-nothing
rules/knowledge-base/deletion-execution-time-is-recording-time
```

### Validator (final, verbatim)

```
specification sound: 56 element(s), 250 rule(s), 8 scenario(s), 3 contract(s), 10 constraint(s) across 2 context(s); 88 decision(s) disclosed, 2 location(s) retired
specification sound: 56 element(s), 250 rule(s), 8 scenario(s), 3 contract(s), 10 constraint(s) across 2 context(s); 88 decision(s) disclosed, 2 location(s) retired
projected 8 file(s) into specification/projections: capability-map.mmd, class-diagram-chat.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md, state-knowledge-base-llm-run.mmd
```

### --ledger (verbatim, exit 0)

```
ledger sound: 135 fact line(s) over 2 material file(s) — 111 landed in 37 node(s), 24 left out with a reason
  file set: 9 file(s) the material read; candidates per file:
    src/modules/compliance-audit/dto/compliance-delete.dto.ts: 12
    src/modules/compliance-audit/dto/curation-action.dto.ts: 11
    src/modules/compliance-audit/index.ts: 1
    src/modules/compliance-audit/mcp/compliance-toolset.ts: 7
    src/modules/compliance-audit/repository/compliance-audit.repository.ts: 23
    src/modules/compliance-audit/routes/compliance-audit.routes.ts: 5
    src/modules/compliance-audit/service/compliance-audit.service.ts: 18
    src/modules/compliance-audit/service/errors.ts: 1
    src/modules/compliance-audit/service/transaction.ts: 0
  1 file(s) no fact names; an adoption over this ledger hands them no judge and leaves them unbound: src/modules/compliance-audit/service/transaction.ts
  candidates, all: constraints/compliance-deletion-is-atomic constraints/llm-toolset-omits-audit-reads contracts/knowledge-base/compliance-audit domain/knowledge-base/affected-counts domain/knowledge-base/compliance-deletion domain/knowledge-base/compliance-deletion-filter domain/knowledge-base/compliance-deletion-outcome domain/knowledge-base/curation-action domain/knowledge-base/curation-action-filter domain/knowledge-base/curation-action-kind domain/knowledge-base/curation-target-kind domain/knowledge-base/node-status domain/knowledge-base/raw-information rules/knowledge-base/audit-filter-checks-order rules/knowledge-base/audit-filters-match-exactly rules/knowledge-base/audit-listing-order rules/knowledge-base/audit-listing-total-before-pagination rules/knowledge-base/audit-listing-window-half-open rules/knowledge-base/audit-page-defaults rules/knowledge-base/audit-window-ordered rules/knowledge-base/compliance-deletion-check-order rules/knowledge-base/compliance-deletion-counts-what-it-marked rules/knowledge-base/compliance-deletion-flags-metadata rules/knowledge-base/compliance-deletion-keeps-content-hash rules/knowledge-base/compliance-deletion-propagates rules/knowledge-base/compliance-deletion-reason-length rules/knowledge-base/compliance-deletion-reason-trimmed rules/knowledge-base/compliance-deletion-records-curation-action rules/knowledge-base/compliance-deletion-redacts-content rules/knowledge-base/compliance-deletion-tombstones rules/knowledge-base/curation-action-reason-length rules/knowledge-base/curation-action-time-is-recording-time rules/knowledge-base/deleted-source-deletion-records-nothing rules/knowledge-base/deletion-execution-time-is-recording-time rules/knowledge-base/page-limit-bounds rules/knowledge-base/page-offset-non-negative rules/knowledge-base/source-status-active-or-deleted
```

`--ledger` refused nothing on its first run.

Left out, grouped by reason:
- Implementation knowledge: the service runs on a transaction its caller opens. (1: service.md:35)
- Implementation knowledge: a defensive reading of stored counts that this system only ever writes as non-negative integers. (1: service.md:47)
- No operation in this context raises the service's validation refusal, so no caller reads this answer. (3: service.md:72, service.md:84, boundary.md:109)
- Every refusal raised in this context carries details, so no caller reads an empty details object. (1: service.md:74)
- Internal failure reasons reach the log and not the caller. (1: service.md:89)
- Implementation knowledge: where in the module the request and answer shapes are declared. (1: service.md:95)
- Implementation knowledge: the MCP tool declares its input by reusing the request schema. (1: boundary.md:37)
- Transport wording that introduces the tool to its caller, not a domain fact. (1: boundary.md:38)
- Implementation knowledge: the row lock that serializes concurrent compliance deletions of one raw information. (1: boundary.md:41)
- Which operations write is no fact apart from the rules that govern what each operation does. (1: boundary.md:94)
- The answer is the shared REST error handler's, which this context does not decide. (1: boundary.md:111)
- The answer is the MCP transport kernel's, which this context does not decide. (1: boundary.md:114)
- This system's own storage, which its implementation chose. (8: boundary.md:126, boundary.md:127, boundary.md:128, boundary.md:129, boundary.md:130, boundary.md:131, boundary.md:132, boundary.md:133)
- Implementation knowledge: a shared helper that renders failure answers. (1: boundary.md:135)
- Wiring: which layer the transports call. (1: boundary.md:136)

### Handoff (Step 4)

```
/siegard:reconcile adoption; slug adopt-compliance-audit; ledger siegard-survey/adopt-compliance-audit/ledger.md; outside: none; certifications: none
```
(111 fact lines landed in 37 nodes and 24 were left out; 9 files in the file set, 1 with no candidate: `service/transaction.ts`.)

**STOP (Step 3).** The owner reviews `git diff -- specification` and commits with pathspec `specification siegard-survey/adopt-compliance-audit`.
