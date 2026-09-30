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

## Step 4 — the adoption

Invocation: `/siegard:reconcile` as an adoption — slug `adopt-compliance-audit`, ledger `siegard-survey/adopt-compliance-audit/ledger.md`, outside none, certifications none. Preconditions: the module and `siegard-trace.json` clean; specification sound; trace sound (261 bindings, 5 test-decided); `siegard-reconcile/adopt-compliance-audit.md` free. Workspace `/tmp/tmp.YzSeP0BHOM` (mktemp, not committed).

### Staging line (verbatim)

```
staged adopt-compliance-audit: 8 file(s) to judge over 0 node(s); staged as an adoption — 37 candidate node(s) from the ledger, 78 pair(s) over 8 file(s) (23 at most on one file), each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 9 file(s) the trace binds nothing to, 8 of them judged over the candidates alone
  manifest and packs at /tmp/tmp.YzSeP0BHOM; candidate index at /tmp/tmp.YzSeP0BHOM/candidates.txt
  save each delegation's return verbatim at /home/siegfriedneto/projects/eternal/siegard-reconcile/adopt-compliance-audit.returns/<file path with '/' as '__'>.yaml
```

Candidates from the ledger: 37. Pairs: 78 over 8 files, at most 23 on one file. Mechanical tier: none, so no run was captured (Step 3b skipped).

### Node pack sizes

- `src__modules__compliance-audit__dto__compliance-delete.dto.ts.md`: 12497 bytes
- `src__modules__compliance-audit__dto__curation-action.dto.ts.md`: 11756 bytes
- `src__modules__compliance-audit__index.ts.md`: 1203 bytes
- `src__modules__compliance-audit__mcp__compliance-toolset.ts.md`: 10124 bytes
- `src__modules__compliance-audit__repository__compliance-audit.repository.ts.md`: 19329 bytes
- `src__modules__compliance-audit__routes__compliance-audit.routes.ts.md`: 9160 bytes
- `src__modules__compliance-audit__service__compliance-audit.service.ts.md`: 17836 bytes
- `src__modules__compliance-audit__service__errors.ts.md`: 6953 bytes

### Judges

8 `siegard:specification-conformance-reviewer` delegations, one per file, all in one batch. Each return was saved under `siegard-reconcile/adopt-compliance-audit.returns/`. The only change was stripping the outer ```yaml fence and decoding `&gt;`, `&lt;` and `&amp;`, which the task-notification transport had HTML-escaped. The escaped text is not valid YAML, and the characters are the literal ones the judges wrote. No return was refused and none was re-run. `--fold` refused nothing.

### Fold, record check and bind (verbatim)

```
folded adopt-compliance-audit.md: 33 node(s) cleared, 3 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 1 candidate(s) no file of the set holds, listed under `unheld`
  next: trace.py --reconciliation siegard-reconcile/adopt-compliance-audit.md
```

```
bound constraints/compliance-deletion-is-atomic to 2 file(s)
bound constraints/llm-toolset-omits-audit-reads to 1 file(s)
bound contracts/knowledge-base/compliance-audit to 6 file(s)
bound domain/knowledge-base/affected-counts to 1 file(s)
bound domain/knowledge-base/compliance-deletion to 6 file(s)
bound domain/knowledge-base/compliance-deletion-filter to 2 file(s)
bound domain/knowledge-base/compliance-deletion-outcome to 1 file(s)
bound domain/knowledge-base/curation-action to 2 file(s)
bound domain/knowledge-base/curation-action-filter to 2 file(s)
bound domain/knowledge-base/curation-action-kind to 1 file(s)
bound domain/knowledge-base/curation-target-kind to 1 file(s)
bound domain/knowledge-base/node-status to 3 file(s)
bound rules/knowledge-base/audit-filter-checks-order to 2 file(s)
bound rules/knowledge-base/audit-filters-match-exactly to 1 file(s)
bound rules/knowledge-base/audit-listing-order to 1 file(s)
bound rules/knowledge-base/audit-listing-total-before-pagination to 1 file(s)
bound rules/knowledge-base/audit-listing-window-half-open to 1 file(s)
bound rules/knowledge-base/audit-page-defaults to 2 file(s)
bound rules/knowledge-base/audit-window-ordered to 2 file(s)
bound rules/knowledge-base/compliance-deletion-check-order to 2 file(s)
bound rules/knowledge-base/compliance-deletion-counts-what-it-marked to 2 file(s)
bound rules/knowledge-base/compliance-deletion-flags-metadata to 1 file(s)
bound rules/knowledge-base/compliance-deletion-keeps-content-hash to 1 file(s)
bound rules/knowledge-base/compliance-deletion-propagates to 1 file(s)
bound rules/knowledge-base/compliance-deletion-reason-length to 1 file(s)
bound rules/knowledge-base/compliance-deletion-reason-trimmed to 1 file(s)
bound rules/knowledge-base/compliance-deletion-records-curation-action to 1 file(s)
bound rules/knowledge-base/curation-action-reason-length to 1 file(s)
bound rules/knowledge-base/curation-action-time-is-recording-time to 1 file(s)
bound rules/knowledge-base/deleted-source-deletion-records-nothing to 1 file(s)
bound rules/knowledge-base/deletion-execution-time-is-recording-time to 1 file(s)
bound rules/knowledge-base/page-limit-bounds to 3 file(s)
bound rules/knowledge-base/page-offset-non-negative to 4 file(s)
33 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-compliance-audit.md
  3 node(s) of adopt-compliance-audit.md the judgment did not clear, and this bind wrote none of them:
    rules/knowledge-base/compliance-deletion-redacts-content
    rules/knowledge-base/compliance-deletion-tombstones
    rules/knowledge-base/source-status-active-or-deleted
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
```

## Step 5 — what it shows

```
$ trace.py --reconciliation siegard-reconcile/adopt-compliance-audit.md
adopt-compliance-audit.md holds: 9 file(s), 33 node(s) the judgment cleared, 3 it did not, 2 file(s) the trace binds nothing to.
--bind-record will write 33 binding(s) from this record and none for rules/knowledge-base/compliance-deletion-redacts-content, rules/knowledge-base/compliance-deletion-tombstones, rules/knowledge-base/source-status-active-or-deleted: a node without `encoded_at` is a node this form cannot bind.
[exit 0]
$ trace.py --untraced backend
279 tracked file(s) under backend: 67 bound, 212 no binding names
  6 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  206 unsurveyed: no binding and no adoption names it

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
  (33 more directories; --all lists every file)
[exit 0]
$ trace.py --convergence backend specification siegard-work
327 node(s) of specification; 289 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

285 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 8, contract 2, element 49, rule 220, scenario 6
4 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
    element 4
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
38 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 1, element 3, rule 30, scenario 2

files under backend: 279 tracked, 67 bound, 212 no binding names (206 unsurveyed) — `--untraced` lists them

289 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 32 finding(s) past reconciliations left open and no bind closed (32 unseen, 0 covered, 0 reported); 118 pair(s) the records answer both ways; 113 unstated fact(s) the source states and no node holds; 246 place(s) text restates a node's fact; 50 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
$ trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
domain/knowledge-base/accepted-fragment-filter: bound at sha256:1b25aa96d866d21eb71c4539179a67e630f7cd8e0a486ee55d569f750e61c48c, now sha256:a5d33ecf0d633813dfb40119cbdc8b4ca73ba5d8249039fc97b3156eb4a080db; the specification moved since this bind
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/repository/provenance.repository.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: backend/src/modules/query-retrieval/service/provenance.service.ts was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/compliance-deletion: migrations/0001_init.sql was stamped against sha256:056baaa5bdd4bf419fb91cddbba10f60b46a40959726313bc1fc6772235d9dff, and the node now reads sha256:122147f87d3c261809ece79a6a64e5bf206a7f65ea745e906275ea1e6bcd4b17; a later bind restamped the node on other files and nobody read this one against it
domain/knowledge-base/curation-action: migrations/0001_init.sql was stamped against sha256:f8a81f093809fc81823674eb275bc00dddf77b03a5b64be86b3682cc61e05802, and the node now reads sha256:7b7ad69429ff158003ea4190e60389bf753ada085b02b81e739fcfeafabecbc3; a later bind restamped the node on other files and nobody read this one against it
backend/src/modules/query-retrieval/service/accepted-fragments.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type
backend/src/modules/query-retrieval/service/provenance.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type

8 drift finding(s) over 289 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  6 moved: bound to a node whose text moved since the bind, or a file stamped against an earlier text of a node a later bind restamped elsewhere; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
[exit 1]
```

`--owed backend` (exit 1), the lines for this record:
```
$ trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts
    rules/knowledge-base/compliance-deletion-tombstones — found against in adopt-compliance-audit.md
    rules/knowledge-base/source-status-active-or-deleted — found against in adopt-compliance-audit.md
  backend/src/modules/compliance-audit/service/compliance-audit.service.ts
    rules/knowledge-base/compliance-deletion-redacts-content — found against in adopt-compliance-audit.md
  backend/src/modules/ingestion/chunker/v1.ts
```
Totals across all records:
```
32 finding(s) no bind closed, over 24 file(s):
  32 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  32 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

118 pair(s) the records answer both ways are not listed above: a clearance closes a finding here. No chronology is available — a record carries no timestamp and several land in one commit — so which judgment is current is a reading of the records themselves.
  `--all` lists them, each with what the trace holds for it now
```

### Count from the record

| outcome | count |
|---|---|
| cleared | 33 |
| contradicts | 3 |
| unstated | 2 |
| restates | 15 |
| unheld | 1 |

**Contradicts, all three unbound:**
1. `rules/knowledge-base/compliance-deletion-redacts-content` against `service/compliance-audit.service.ts`. The exported `REDACTED_LITERAL` is a second home of the literal, and nothing reads it. The repository redacts with its own inline `'[REDACTED]'`. Route: `/plan-work` corrective increment to remove the constant and its re-export, or `/analyse` if the constant is meant to hold the value.
2. `rules/knowledge-base/compliance-deletion-tombstones` against `repository/compliance-audit.repository.ts`. Chunks are marked only where `superseded_at IS NULL`, and the node says each chunk. This is the Step 3 watch item turned into a finding. Route: `/analyse` to state the restriction, or `/plan-work` to mark every chunk.
3. `rules/knowledge-base/source-status-active-or-deleted` against `repository/compliance-audit.repository.ts`. The locked row types the status with four values where the node admits two. Route: `/plan-work` corrective increment to narrow the type, or `/analyse`.

**Unstated, both analysis drops:**
- `dto/compliance-delete.dto.ts` line 108: the list key `items`. The survey stated it at `boundary.md:73` ("the total, the limit, the offset and the items"). The analysis wrote "the page of compliance deletions" and dropped the key's name.
- `routes/compliance-audit.routes.ts`: the five paths and verbs. The surveyor classed them under Outside the domain as routing, so they never became a fact line. The analysis also keeps a published surface's own routes out on purpose. Either way the fact sits outside the survey's fact lines, and whether routes belong in the contract is for `/analyse` to decide.

**Unheld: one fact outside the areas.** `domain/knowledge-base/raw-information` came from `service.md:94`, the source status that ingestion writes. The service only reads that status and holds no fact of the element. The element's facts live in the ingestion context and the migrations, which already bind it.

**Restates: 15 comment findings over 7 files.** Every file except `index.ts` and `transaction.ts` has some. Each one owes removal of the prose through the comment route, then this route over the file again.

**Unbound, 2 files.** `index.ts` holds nothing, and its judge answered nowhere. `service/transaction.ts` has no fact line.

**Moved nodes the Step 3 increment caused, still reported by `--check`.** `domain/knowledge-base/compliance-deletion` is stale on four other files: the query-retrieval accepted-fragments repository, provenance repository and provenance service, and `migrations/0001_init.sql`. `domain/knowledge-base/curation-action` is stale on `migrations/0001_init.sql`. These files need a `/reconcile` under a new slug.

### Tokens

`telemetry.py --probe --since 2026-09-30T19:12:29Z` reported the transcripts readable, with one session. The read was announced and run, and the report is `siegard-telemetry/20260930T194017Z.json`.

| agent | output | cache write | cache read | seconds |
|---|---|---|---|---|
| Survey compliance-audit service area | 9,307 | 62,585 | 130,582 | 90 |
| Survey compliance-audit boundary area | 19,256 | 70,361 | 311,355 | 176 |
| Judge compliance-delete.dto.ts | 6,317 | 44,463 | 108,835 | 47 |
| Judge curation-action.dto.ts | 5,029 | 35,213 | 153,710 | 37 |
| Judge compliance-audit index.ts | 1,138 | 24,245 | 34,285 | 10 |
| Judge compliance-toolset.ts | 5,180 | 36,094 | 150,493 | 41 |
| Judge compliance-audit.repository.ts | 11,770 | 46,086 | 81,421 | 82 |
| Judge compliance-audit.routes.ts | 5,589 | 36,395 | 73,364 | 44 |
| Judge compliance-audit.service.ts | 7,990 | 43,534 | 173,589 | 58 |
| Judge compliance-audit errors.ts | 2,180 | 27,227 | 34,294 | 17 |

Mean per judged file (8 judges): output 5,649, cache write 36,657, cache read 101,249.

The analysis ran in the orchestrating session. The harness counts that session as one figure, 106,481 output tokens for the whole window from Step 1 to Step 5, so the analysis's own share cannot be separated out.

## Step 6 — stop

**STOP.** The owner reviews and commits with pathspec `siegard-trace.json siegard-reconcile siegard-survey/adopt-compliance-audit siegard-telemetry`.
