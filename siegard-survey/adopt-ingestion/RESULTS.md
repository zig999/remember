# RESULTS — adopt `ingestion`

Executed by Claude Code (Opus 5.5) from `RUNBOOK.md`. `P` = `/home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.2`.

## Step 1 — preconditions

Start instant: **2026-09-30T14:06:10Z**

Installed plugin (project scope, `installed_plugins.json`): siegard 4.21.2 at `/home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.2`.

```
$ grep '"version"' $P/.claude-plugin/plugin.json
  "version": "4.21.2"
$ git status --porcelain -- specification backend siegard-trace.json siegard-reconcile siegard.json
$ python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal
standard backend: /home/siegfriedneto/projects/eternal/standards/backend-node-service.yaml
specification_root: /home/siegfriedneto/projects/eternal/specification
target backend: /home/siegfriedneto/projects/eternal/backend
work_root: /home/siegfriedneto/projects/eternal/siegard-work
delivery_root: /home/siegfriedneto/projects/eternal/siegard-delivery
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
$ python3 -B $P/bin/trace.py --untraced backend
279 tracked file(s) under backend: 14 bound, 265 no binding names
  1 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  264 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
   34  backend/src/__tests__/unit/ingestion
   14  backend/src/modules/chat/service
   12  backend/src/modules/ingestion/service
   10  backend/src/modules/ingestion/mcp
    9  backend/src/__tests__/unit/chat
    9  backend/src/modules/chat/service/__tests__
    9  backend/src/modules/ingestion/dto
    9  backend/src/modules/knowledge-graph/dto
    9  backend/src/modules/knowledge-graph/service
    8  backend/src/modules/curation/service
    7  backend
    7  backend/src/__tests__/unit
    7  backend/src/__tests__/unit/knowledge-graph
    7  backend/src/__tests__/unit/query-retrieval
    6  backend/src/modules/curation/mcp
  (49 more directories; --all lists every file)
```

Verdict: `git status` printed nothing; `standard backend:` points at `standards/backend-node-service.yaml`. Preconditions hold.

## Step 2 — the survey

File lists (`git ls-files` from `backend/`, excluding `*.spec.ts` and `__tests__/`):

### Area A — services (14 files)

- `src/modules/ingestion/hash.ts`
- `src/modules/ingestion/index.ts`
- `src/modules/ingestion/service/affected-nodes.ts`
- `src/modules/ingestion/service/directed-ingestion.service.ts`
- `src/modules/ingestion/service/entity-resolution.service.ts`
- `src/modules/ingestion/service/extraction.service.ts`
- `src/modules/ingestion/service/graph-consolidation.service.ts`
- `src/modules/ingestion/service/ingestion.service.ts`
- `src/modules/ingestion/service/llm-run.service.ts`
- `src/modules/ingestion/service/propose-attribute.service.ts`
- `src/modules/ingestion/service/propose-fragment.service.ts`
- `src/modules/ingestion/service/propose-link.service.ts`
- `src/modules/ingestion/service/propose-node.service.ts`
- `src/modules/ingestion/service/propose.types.ts`

### Area B — transports (12 files)

- `src/modules/ingestion/catalog/catalog.ts`
- `src/modules/ingestion/mcp/directed-ingest.handler.ts`
- `src/modules/ingestion/mcp/handler-base.ts`
- `src/modules/ingestion/mcp/ingest-document.handler.ts`
- `src/modules/ingestion/mcp/ingest-toolset.ts`
- `src/modules/ingestion/mcp/mcp-schemas.ts`
- `src/modules/ingestion/mcp/propose-attribute.handler.ts`
- `src/modules/ingestion/mcp/propose-fragment.handler.ts`
- `src/modules/ingestion/mcp/propose-link.handler.ts`
- `src/modules/ingestion/mcp/propose-node.handler.ts`
- `src/modules/ingestion/mcp/transport.ts`
- `src/modules/ingestion/routes/ingestion.routes.ts`

### Area C — input and validation (14 files)

- `src/modules/ingestion/dto/index.ts`
- `src/modules/ingestion/dto/ingest-raw-information.dto.ts`
- `src/modules/ingestion/dto/llm-run.dto.ts`
- `src/modules/ingestion/dto/propose-attribute.dto.ts`
- `src/modules/ingestion/dto/propose-fragment.dto.ts`
- `src/modules/ingestion/dto/propose-link.dto.ts`
- `src/modules/ingestion/dto/propose-node.dto.ts`
- `src/modules/ingestion/dto/raw-information.dto.ts`
- `src/modules/ingestion/dto/source-type.ts`
- `src/modules/ingestion/validation/confidence.ts`
- `src/modules/ingestion/validation/errors.ts`
- `src/modules/ingestion/validation/graph-rules.ts`
- `src/modules/ingestion/validation/structural.ts`
- `src/modules/ingestion/validation/temporal.ts`

### Area D — extraction and storage (9 files)

- `src/modules/ingestion/chunker/config.ts`
- `src/modules/ingestion/chunker/v1.ts`
- `src/modules/ingestion/prompts/extraction.v1.ts`
- `src/modules/ingestion/prompts/extraction.v2.ts`
- `src/modules/ingestion/prompts/extraction.v3.ts`
- `src/modules/ingestion/prompts/extraction.v4.ts`
- `src/modules/ingestion/prompts/index.ts`
- `src/modules/ingestion/repository/ingestion.repository.ts`
- `src/modules/ingestion/repository/llm-run.repository.ts`

Union: 49 distinct files; duplicates across areas: 0; `git ls-files src/modules/ingestion/` (non-test): 49; diff between the two: 0 lines. **The four areas together are exactly the 49 files.**

### Delegation

Four `general-purpose` subagents, model opus, spawned together at **2026-09-30T14:06:55Z**. Each
was handed verbatim: the whole of `domain-surveyor.md` as its instructions; the target source root
`/home/siegfriedneto/projects/eternal/backend` (target key `backend`); its area's file list; and,
as "the context so far", the output of `python3 -B $P/bin/spec.py --digest specification`
(exit 0, 10327 bytes; first line: `specification sound: 21 element(s), 54 rule(s), 3 scenario(s),
1 contract(s), 5 constraint(s) across 1 context(s); 21 decision(s) disclosed`). Each was told it
may use only Read, Grep and Glob and returns text only.

Each return was saved verbatim (the agent's final text message, extracted mechanically from its
transcript) as `material/<area>.md`.

| area | returned at (dispatch + reported duration) | duration | tool uses | subagent tokens | bytes | frontmatter + 6 sections | `files` == area | `read_outside_area` |
|---|---|---|---|---|---|---|---|---|
| A | ≈14:10:22Z | 207.5 s | 16 | 158,362 | 41,781 | yes | yes (14) | 2 files (`validation/structural.ts`, `validation/confidence.ts`) |
| B | ≈14:09:36Z | 161.0 s | 18 | 129,038 | 29,602 | yes | yes (12) | 6 files (`dto/source-type.ts`, `dto/llm-run.dto.ts`, parts of `service/llm-run.service.ts` and `service/ingestion.service.ts`, `shared/error-mapping.ts`, `middleware/error-handler.ts`) |
| C | ≈14:09:00Z | 124.8 s | 14 | 82,888 | 25,611 | yes | yes (14) | None |
| D | ≈14:08:55Z | 119.6 s | 9 | 90,430 | 23,531 | yes | yes (9) | None |

Return instants are dispatch instant + the duration each agent reported (the harness gives no
wall-clock stamp per return); the notifications arrived in the order A, B, C, D, each after the
previous had been processed, so arrival order is not return order.

No return failed the checks; **no re-delegation**.

Notes for the reader (not acted on):
- D's last "Observed and not decided here" bullet appeals to "the project instructions" (the
  `superseded_at` gotcha in CLAUDE.md, which the harness injects into every agent) — a text source
  outside the code, which the surveyor contract says is never evidence. It is flagged as undecided,
  not stated as a fact.
- A and B both flag the affected-nodes / ok-wrapping-ok:false discrepancies; B and C both record
  the `valid_from_basis` caller set as `stated|document` only.

**STOP (step 2)** — waiting for the owner to read the four material files before any analysis.

### Owner's review of the material (after the step-2 STOP)

The owner read the four files and cleared step 3, with one cut. `material/D.md`, 4th item of
"Observed and not decided here" (line 148): the two sentences that relied on the project
instructions (CLAUDE.md text, not code) were removed, so only the fact read from code remains.

Removed, verbatim:

> The project instructions require superseded-at to be set whenever a row is marked deleted. That requirement is about deletion, not rejection, so whether it applies here is not decided in this area.

The line now reads:

> - Rejecting orphaned fragments on retry sets status `rejected` and leaves superseded-at unset (`src/modules/ingestion/repository/llm-run.repository.ts`, `retryLlmRunRow`).

`material/D.md` went from 23,531 to 23,333 bytes. Nothing else in any material file was changed.
Lesson for the domain-surveyor, recorded by the owner: the project's instructions are text too.

## Step 3 — the analysis

`/siegard:analyse` invoked with the four material files (after the owner's cut to `material/D.md`) as the material and `/home/siegfriedneto/projects/eternal` as the project root. Plugin 4.21.2.

Preconditions inside the skill: `project.py` resolved `specification_root: /home/siegfriedneto/projects/eternal/specification`; `git status --porcelain -- specification` printed nothing; `spec.py specification` was sound before any write (`specification sound: 21 element(s), 54 rule(s), 3 scenario(s), 1 contract(s), 5 constraint(s) across 1 context(s); 21 decision(s) disclosed`).

Entry nodes for `--impact`: the 14 elements the material speaks to (raw-information, raw-chunk, information-fragment, fragment-status, knowledge-node, node-alias, node-attribute, knowledge-link, link-type, provenance, assertion-status, source-type, node-status, compliance-deletion) plus all 5 `constraints/` nodes. The closure's read set was 55 files (those, `accepted-fragment-filter`, `search-item`, the decision log and 33 rules); `page` was read too because the tool-call listing speaks to it.

Context boundary: no new context. Ingestion speaks the same nouns with the same meanings as the standing `knowledge-base` context (decision logged on `llm-run.type`).

### Nodes created (155)

**elements (21):** `domain/knowledge-base/alias-kind`, `domain/knowledge-base/attribute-key`, `domain/knowledge-base/change-hint`, `domain/knowledge-base/directed-ingestion`, `domain/knowledge-base/directed-item`, `domain/knowledge-base/directed-item-kind`, `domain/knowledge-base/directed-item-status`, `domain/knowledge-base/entity-match-review`, `domain/knowledge-base/ingest-tool`, `domain/knowledge-base/link-type-rule`, `domain/knowledge-base/llm-run`, `domain/knowledge-base/node-resolution`, `domain/knowledge-base/node-type`, `domain/knowledge-base/prompt-version`, `domain/knowledge-base/proposal`, `domain/knowledge-base/run-status`, `domain/knowledge-base/run-summary`, `domain/knowledge-base/tool-call`, `domain/knowledge-base/valid-from-basis`, `domain/knowledge-base/validation-outcome`, `domain/knowledge-base/value-type`

**rules (125):** `rules/knowledge-base/affected-nodes-follow-merges`, `rules/knowledge-base/affected-nodes-of-a-run`, `rules/knowledge-base/affected-nodes-only-when-completed`, `rules/knowledge-base/ambiguous-candidates-need-review`, `rules/knowledge-base/attribute-key-for-node-type`, `rules/knowledge-base/attribute-proposal-check-order`, `rules/knowledge-base/attribute-value-in-allowed-values`, `rules/knowledge-base/attribute-value-parses`, `rules/knowledge-base/below-confidence-floor-records-nothing`, `rules/knowledge-base/caller-never-states-received`, `rules/knowledge-base/candidate-similarity`, `rules/knowledge-base/chunk-excerpt-is-verbatim`, `rules/knowledge-base/chunk-index-follows-content`, `rules/knowledge-base/chunk-listing-order`, `rules/knowledge-base/chunking-version`, `rules/knowledge-base/chunks-never-cross-blocks`, `rules/knowledge-base/cited-fragments-anchored`, `rules/knowledge-base/cited-fragments-exist`, `rules/knowledge-base/cited-fragments-in-run`, `rules/knowledge-base/closing-stamps-finish-time`, `rules/knowledge-base/conflict-disputes`, `rules/knowledge-base/consolidation-precedence`, `rules/knowledge-base/consolidation-records-provenance`, `rules/knowledge-base/content-hash-is-sha256`, `rules/knowledge-base/content-hash-unique`, `rules/knowledge-base/content-length`, `rules/knowledge-base/contentless-blocks-single-chunk`, `rules/knowledge-base/correction-replaces`, `rules/knowledge-base/correction-requires-errata-evidence`, `rules/knowledge-base/current-assertion`, `rules/knowledge-base/date-check-order`, `rules/knowledge-base/default-prompt-version`, `rules/knowledge-base/directed-attribute-value-as-text`, `rules/knowledge-base/directed-attribute-value-shape`, `rules/knowledge-base/directed-defaults`, `rules/knowledge-base/directed-dependency-failed`, `rules/knowledge-base/directed-dispatch-order`, `rules/knowledge-base/directed-fragments-anchor-first-chunk`, `rules/knowledge-base/directed-full-confidence`, `rules/knowledge-base/directed-ingestion-run`, `rules/knowledge-base/directed-item-status`, `rules/knowledge-base/directed-later-reference-wins`, `rules/knowledge-base/directed-pinned-node`, `rules/knowledge-base/directed-reference-length`, `rules/knowledge-base/directed-requires-fragment-and-node`, `rules/knowledge-base/directed-run-completes`, `rules/knowledge-base/directed-source-content`, `rules/knowledge-base/directed-source-label-length`, `rules/knowledge-base/directed-turn-is-original-input`, `rules/knowledge-base/document-ingestion-extracts-new-content`, `rules/knowledge-base/email-header-block`, `rules/knowledge-base/email-quote-blocks`, `rules/knowledge-base/every-proposal-audited`, `rules/knowledge-base/exact-alias-resolves`, `rules/knowledge-base/extraction-anchors-to-read-chunk`, `rules/knowledge-base/extraction-closes-its-run`, `rules/knowledge-base/extraction-fails-on-repeated-system-errors`, `rules/knowledge-base/extraction-reads-chunks-in-order`, `rules/knowledge-base/extraction-requires-running-run`, `rules/knowledge-base/fragment-chunks-exist`, `rules/knowledge-base/fragment-chunks-in-run-source`, `rules/knowledge-base/fragment-missing-chunk-first`, `rules/knowledge-base/fragment-recorded-proposed`, `rules/knowledge-base/fragment-text-length`, `rules/knowledge-base/held-content-records-nothing`, `rules/knowledge-base/idempotency-key`, `rules/knowledge-base/idempotency-key-unique`, `rules/knowledge-base/ingestion-records-chunks-and-run`, `rules/knowledge-base/link-permitted-by-type-rule`, `rules/knowledge-base/link-proposal-check-order`, `rules/knowledge-base/link-type-in-catalog`, `rules/knowledge-base/link-type-rule-in-effect`, `rules/knowledge-base/llm-run-lifecycle`, `rules/knowledge-base/long-block-sentence-chunks`, `rules/knowledge-base/long-sentence-own-chunk`, `rules/knowledge-base/matched-node-gains-only-aliases`, `rules/knowledge-base/model-refusal-skips-chunk`, `rules/knowledge-base/name-normalization`, `rules/knowledge-base/new-assertion`, `rules/knowledge-base/new-assertion-status-from-confidence`, `rules/knowledge-base/new-node-aliases`, `rules/knowledge-base/no-candidate-creates-active-node`, `rules/knowledge-base/node-name-length`, `rules/knowledge-base/node-type-in-catalog`, `rules/knowledge-base/one-current-attribute-per-functional-key`, `rules/knowledge-base/one-current-attribute-per-value`, `rules/knowledge-base/one-current-link-per-functional-type`, `rules/knowledge-base/one-current-link-per-target`, `rules/knowledge-base/original-input-length`, `rules/knowledge-base/orphaned-fragment`, `rules/knowledge-base/pdf-blocks-at-form-feeds`, `rules/knowledge-base/prompt-version-known`, `rules/knowledge-base/proposal-confidence-range`, `rules/knowledge-base/proposal-meets-current-assertion`, `rules/knowledge-base/proposal-requires-running-run`, `rules/knowledge-base/proposal-run-checks-first`, `rules/knowledge-base/provenance-accepts-proposed-fragment`, `rules/knowledge-base/reaffirmation-consolidates`, `rules/knowledge-base/recent-ingestion-latest-run`, `rules/knowledge-base/recent-ingestions-limit-bounds`, `rules/knowledge-base/recent-ingestions-limit-default`, `rules/knowledge-base/recent-ingestions-order`, `rules/knowledge-base/reception-time-is-recording-time`, `rules/knowledge-base/refused-proposal-records-only-its-tool-call`, `rules/knowledge-base/required-start-available`, `rules/knowledge-base/required-start-fallback`, `rules/knowledge-base/retry-counts-attempts`, `rules/knowledge-base/retry-rejects-orphaned-fragments`, `rules/knowledge-base/short-block-one-chunk`, `rules/knowledge-base/speaker-line`, `rules/knowledge-base/stated-start-requires-basis`, `rules/knowledge-base/strong-candidate-resolves`, `rules/knowledge-base/succession-before-previous-start`, `rules/knowledge-base/succession-closes-previous`, `rules/knowledge-base/succession-closing-date`, `rules/knowledge-base/succession-signal`, `rules/knowledge-base/summary-counts-orphaned-fragments`, `rules/knowledge-base/summary-counts-tool-calls`, `rules/knowledge-base/tool-call-listing-order`, `rules/knowledge-base/tool-call-page-defaults`, `rules/knowledge-base/tool-call-total-before-pagination`, `rules/knowledge-base/tool-call-validation-outcome`, `rules/knowledge-base/turn-blocks`, `rules/knowledge-base/undivided-sources`, `rules/knowledge-base/validity-start-before-end`

**scenarios (5):** `scenarios/knowledge-base/email-without-blank-line-is-one-block`, `scenarios/knowledge-base/form-feed-only-pdf-is-one-chunk`, `scenarios/knowledge-base/held-content-under-another-model`, `scenarios/knowledge-base/impossible-calendar-date-refused`, `scenarios/knowledge-base/same-target-succession-is-disputed`

**contracts (1):** `contracts/knowledge-base/ingestion`

**constraints (3):** `constraints/document-content-is-data`, `constraints/extraction-acts-only-through-proposals`, `constraints/ingestion-transports-answer-alike`

### Nodes changed (11)

- `decision-log` — 46 entries appended (45 decided, 1 retirement); no earlier entry edited
- `domain/knowledge-base/accepted-fragment-filter` — attribute `llm_run` (string) replaced by a reference to `llm-run`
- `domain/knowledge-base/information-fragment` — attribute `llm_run` (string) replaced by a reference to `llm-run`
- `domain/knowledge-base/knowledge-link` — + `valid_from_basis`, `confidence`, `superseded_at`; + references to `llm-run` and to the link it `supersedes`
- `domain/knowledge-base/knowledge-node` — + reference to `node-type`
- `domain/knowledge-base/link-type` — + four catalog flags; + composition of `link-type-rule`
- `domain/knowledge-base/node-alias` — + `kind` (alias-kind)
- `domain/knowledge-base/node-attribute` — + `value`, validity dates and basis, `confidence`, `superseded_at`; + references to `attribute-key`, `llm-run` and the attribute it `supersedes`
- `domain/knowledge-base/raw-chunk` — + `chunking_version`
- `domain/knowledge-base/raw-information` — + `content_hash` (required), `document_date`, `storage_ref`
- `rules/knowledge-base/page-defaults` — statement narrowed to search and accepted-fragment listing pages (tool-call listing defaults to 50)

### Nodes removed

None. One field left the specification (`information-fragment.attributes.llm_run`); its decision-log entry was retired by a new entry, never edited.

### Decision-log entries appended (46)

- **retired** `domain/knowledge-base/information-fragment.md` `attributes.llm_run.type` — The fragment's LLM run is now the reference to domain/knowledge-base/llm-run in information-fragment's relationships.
- `domain/knowledge-base/llm-run.md` `type` — decided: aggregate-root in the knowledge-base context — why: Ingestion writes the raw informations, fragments, nodes, links and attributes the retrieval reads under the same names and meanings, so no translation marks a boundary between them.
- `domain/knowledge-base/tool-call.md` `attributes.arguments.type` — decided: string — why: Nothing in the material reads inside the arguments; they are kept and shown as recorded.
- `domain/knowledge-base/tool-call.md` `attributes.result.type` — decided: string — why: Nothing in the material reads inside the result except the outcome, which the validation outcome already holds.
- `domain/knowledge-base/raw-information.md` `attributes.document_date.type` — decided: date — why: It is used as a validity start, which is a calendar date.
- `domain/knowledge-base/attribute-key.md` `type` — decided: aggregate-root referencing its node type — why: Node attributes point at their key directly, and a reference only reaches an aggregate root.
- `domain/knowledge-base/link-type-rule.md` `type` — decided: entity inside the link-type aggregate — why: A rule is looked up by its link type and has no meaning apart from it.
- `domain/knowledge-base/entity-match-review.md` `type` — decided: aggregate-root — why: Each review is worked on its own in the curation queue, apart from the nodes it pairs.
- `domain/knowledge-base/proposal.md` `type` — decided: value-object, carrying the kind, confidence, change hint, validity dates and basis, the LLM run and what it cites — why: Every check and consolidation of the four operations is stated about what is proposed, and a proposal has no identity before it is taken.
- `domain/knowledge-base/directed-ingestion.md` `type` — decided: value-object — why: It is recorded only through the raw information and LLM run it produces.
- `rules/knowledge-base/name-normalization.md` `statement` — decided: Lower-casing, removing accents, trimming and collapsing inner whitespace. — why: The material names the normalization as the database's own, and one normalization for every name comparison keeps resolution and alias matching from disagreeing about the same name.
- `rules/knowledge-base/affected-nodes-of-a-run.md` `statement` — decided: The nodes that landed link and attribute proposals join or describe are affected nodes on every path. — why: The collector is built to take those nodes, and only the extraction's results fail to carry them.
- `rules/knowledge-base/reaffirmation-consolidates.md` `statement` — decided: For a type that allows multiple current assertions, a proposal with the same target or value that is not a correction re-affirms; for one that does not, it needs change hint none and the same validity start. — why: A multi-valued type holds only one current assertion per target or value, so a second one with the same target or value can only consolidate into it.
- `contracts/knowledge-base/ingestion.md` `answers` — decided: Held content answers HTTP 200 with outcome noop_existing and the run the held raw information already has, whatever model or prompt version the request names. — why: Intake is idempotent by content hash, and a request that records nothing has nothing to fail on.
- `rules/knowledge-base/every-proposal-audited.md` `statement` — decided: Every proposal within a run records its tool call, whichever transport carried it. — why: A run's summary is counted from its tool calls, so a proposal without one would vanish from its run's account.
- `contracts/knowledge-base/ingestion.md` `answers` — decided: A validation refusal of a REST proposal answers HTTP 200 carrying `{ ok: false, error }` with the refusal's code. — why: A validation refusal of a proposal is a result its run records, not a failure of the request that carried it.
- `contracts/knowledge-base/ingestion.md` `answers` — decided: A malformed LLM run identity is refused with VALIDATION_INVALID_FORMAT on both transports. — why: An LLM run's identity is a UUID everywhere else the material names one.
- `constraints/ingestion-transports-answer-alike.md` `statement` — decided: The two transports carry the same result and the same error code for every ingestion operation both expose, so MCP answers such a refusal as a refusal. — why: Nothing in the material makes the ingestion transports differ in what they answer, only in how they frame it.
- `rules/knowledge-base/required-start-fallback.md` `statement` — decided: It takes the document date with basis document or, failing that, the reception date with basis received. — why: A type that requires a validity start is never left without one, and every start carries its justification.
- `rules/knowledge-base/attribute-value-parses.md` `statement` — decided: Only a real calendar date is a date value. — why: A date attribute names a day, and no such day exists.
- `rules/knowledge-base/directed-defaults.md` `statement` — decided: A directed attribute or link is proposed with change hint none. — why: The directed tool is the only way a directed ingestion is made, and it carries no change hint.
- `rules/knowledge-base/page-defaults.md` `statement` — decided: The default of 20 holds for search and the accepted-fragment listing, and the tool-call listing defaults to 50. — why: The tool-call listing's default is stated in its own request schema.
- `rules/knowledge-base/affected-nodes-of-a-run.md` `consistency` — decided: eventual — why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- `rules/knowledge-base/affected-nodes-follow-merges.md` `consistency` — decided: eventual — why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- `rules/knowledge-base/summary-counts-orphaned-fragments.md` `consistency` — decided: eventual — why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- `rules/knowledge-base/recent-ingestion-latest-run.md` `consistency` — decided: eventual — why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- `rules/knowledge-base/ingestion-records-chunks-and-run.md` `consistency` — decided: eventual — why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- `rules/knowledge-base/retry-rejects-orphaned-fragments.md` `consistency` — decided: eventual — why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- `rules/knowledge-base/ambiguous-candidates-need-review.md` `consistency` — decided: eventual — why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- `rules/knowledge-base/document-ingestion-extracts-new-content.md` `consistency` — decided: eventual — why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- `rules/knowledge-base/current-assertion.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/proposal-meets-current-assertion.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/consolidation-precedence.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/reaffirmation-consolidates.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/correction-replaces.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/succession-closes-previous.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/succession-before-previous-start.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/conflict-disputes.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/new-assertion.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/new-assertion-status-from-confidence.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/consolidation-records-provenance.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/succession-closing-date.md` `consistency` — decided: eventual — why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- `rules/knowledge-base/one-current-link-per-functional-type.md` `statement` — decided: At most one current assertion that is not disputed; disputed assertions are exempt. — why: A dispute exists to hold both conflicting assertions until curation settles it.
- `rules/knowledge-base/one-current-link-per-target.md` `statement` — decided: At most one current assertion that is not disputed; disputed assertions are exempt. — why: A dispute exists to hold both conflicting assertions until curation settles it.
- `rules/knowledge-base/one-current-attribute-per-functional-key.md` `statement` — decided: At most one current assertion that is not disputed; disputed assertions are exempt. — why: A dispute exists to hold both conflicting assertions until curation settles it.
- `rules/knowledge-base/one-current-attribute-per-value.md` `statement` — decided: At most one current assertion that is not disputed; disputed assertions are exempt. — why: A dispute exists to hold both conflicting assertions until curation settles it.
### Shape reading (`spec.py --shape --of <every node written>`)

- 0 statements with more than one sentence; 0 expressions longer than their statement; 0 names held nowhere; 0 bare names two nodes answer to; 0 prose naming more siblings than fields declare.
- Acted on: `succession-closes-previous` was the longest statement (70w) and carried two conditions (the case and its closing date); split into `succession-closes-previous` + `succession-closing-date`.
- Left standing, with reason:
  - Elements at or past p90 (`proposal` 134w, `llm-run` 127w, `knowledge-link` 121w, `node-attribute` 110w, `run-summary` 107w): the length is frontmatter (attributes and relationships), not prose.
  - Shared phrases between sibling rules (`cited-fragments-exist`/`-in-run`/`-anchored`, `fragment-chunks-exist`/`-in-run-source`, the four `one-current-*` rules, the two check-order rules, `required-start-fallback`/`-available`): each pair states a different condition about the same subject, so the shared words are the subject, not a definition kept twice.
  - The recurring clause "type that does not allow multiple current assertions" names the `allows_multiple_current` flag of `link-type`/`attribute-key`; a separate defining node would have to span two aggregates for a restatement of one flag.
  - `constraints/ingestion-transports-answer-alike` shares its clause with `constraints/retrieval-transports-answer-alike`: they govern disjoint operation sets, and merging them would remove the retrieval node and sever its standing trace bindings to the query-retrieval files.
  - Long statements with no scenario (the check-order rules, `speaker-line`, `ambiguous-candidates-need-review`, …): abstract orderings and definitions, which the material gives no worked case for.

### Cross-check (step 5)

- **Decided (logged):** a dispute records a second current assertion beside the one it disputes, which the four `one-current-*` rules as first written forbade. Decided that the uniqueness holds among assertions that are not disputed (4 entries).
- **Watch items (no case both nodes decide differently, or not held by the specification):**
  1. With a disputed pair both current, which of the two a later single-current proposal "meets" is undecided (the material says the code takes the first row returned, unordered).
  2. `page-limit-bounds` is answered `VALIDATION_OUT_OF_RANGE` by the retrieval contract and `VALIDATION_INVALID_FORMAT` by `list-tool-calls`. Different operations, same rule.
  3. `VALIDATION_INVALID_FORMAT` details take two shapes (`{ issues: [...] }` vs a bare array); the answers name the code and the listed issues, not the shape.
  4. `validation-outcome: uncertain` and `directed-item-status: uncertain` are values nothing produces (a link accepted at uncertain confidence is audited `accepted`).
  5. Tool descriptions disagree with nodes: `propose_attribute` says "date, number, or string" (value types are date/number/text/bool); the fragment confidence description says "<0.40 dropped" (`fragment-recorded-proposed`). Descriptions are emitted text the specification does not hold.
  6. The v3 and v4 prompt sections give the model two different relative-date instructions: prompt text, not held.
  7. The chunk-size window's lower bound (1500) is declared and never read; only the 2000 upper bound is held.
  8. Recent ingestions and the raw-information read include compliance-deleted sources; no node decides whether they should (search and the accepted-fragment listing exclude them).
  9. A link or attribute proposal citing the same fragment twice is refused as not found (row count); not held.
  10. A directed ingestion's refusal paths after intake leave its run open; they are unreachable given the nonce; not held.
  11. The "run not found" and "run not running" details differ by transport (`{llm_run_id}` vs `{entity,id}`; `status` vs `current_status`); the answers name only the code.
  12. Needs-review nodes are never resolution candidates (only active ones are), so an ambiguous name proposed again creates another needs-review node each time.
- **Read and left out as implementation:** the 10-candidate cap on entity resolution; the 64-turn cap, `pause_turn` and provider timeouts/retries; the catalog snapshot's caching (changes unseen until reload); advisory locks and `FOR UPDATE`; the affected-nodes cache; the duplicate-guard retry; the `health` tool; the declared, never-registered `start_async_ingestion`; the default ingest model; the 11 MiB intake body limit; the directed conversation/message metadata pointer; database-unavailable answers.

### What this increment may have put the delivered code in breach of

The analysis does not read the target. These decisions are expected to contradict delivered code, and only the reconciliation will find out:
- `affected-nodes-of-a-run` (extraction path and rebuild count only node proposals)
- `reaffirmation-consolidates` (attribute re-affirmation without a same start; multi-valued proposals with change hint succession)
- the `ingest-raw-information` answer for held content under another model or prompt version (code: internal error)
- `every-proposal-audited` (REST proposals write no tool call)
- the MCP malformed-run-identity answer
- `ingestion-transports-answer-alike` (the MCP ok-wrapping-ok:false case)
- `required-start-fallback` (code leaves start and basis empty when a document date exists)
- `attribute-value-parses` (impossible calendar dates)
- the `one-current-*` dispute exemption, if the database guard does not spare disputed rows

### Candidates

165 identities (155 created + 10 changed, no `_context`, no decision log) written to `siegard-survey/adopt-ingestion/candidates.txt`.

### Validator's final output (verbatim)

```
$ python3 -B $P/bin/spec.py specification
specification sound: 42 element(s), 179 rule(s), 8 scenario(s), 2 contract(s), 8 constraint(s) across 1 context(s); 66 decision(s) disclosed, 1 location(s) retired
$ python3 -B $P/bin/spec.py --project specification
projected 7 file(s) into specification/projections: capability-map.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md, state-knowledge-base-llm-run.mmd
```

Nothing was committed, stashed or reset. The analysis ran in the orchestrating session itself; `/siegard:analyse` spawns no subagent.

**STOP (step 3)**: waiting for the owner to review `git diff -- specification` and commit it.

## Step 4 — the certifications

The owner committed the specification: `2b3f704 spec(ingestion): adoption analysis of the ingestion context (step 3)` (pathspec `specification`).

**Plugin updated before this step:** the owner ran `/plugin` ("✔ Updated siegard.") and `/reload-plugins`. `installed_plugins.json` for `eternal` now reads **4.21.3** at `~/.claude/plugins/cache/siegard-generator/siegard/4.21.3`. Steps 1–3 ran on 4.21.2; from here on `P` = the 4.21.3 root.

The first attempt refused because the delivery root did not exist:

```
$ python3 -B $P/bin/run.py siegard-delivery/adopt-ingestion --run baseline --cwd backend --timeout-seconds 2400 --step 'install=npm ci' --step 'test=npm test'
cannot run: delivery root siegard-delivery/adopt-ingestion is not a directory
```

Created `siegard-delivery/adopt-ingestion/` (empty) and reran the same command at 2026-09-30T15:04:30Z:

| step | command | outcome | exit | started | ended |
|---|---|---|---|---|---|
| install | `npm ci` | passed | 0 | 15:04:30.980Z | 15:04:37.309Z |
| test | `npm test` | passed | 0 | 15:04:37.309Z | 15:04:59.563Z |

Run outcome `passed`, `failed_step: null`, captured at `siegard-delivery/adopt-ingestion/run/baseline/` (`run.json`, `install.log`, `test.log`, `run.log`).
From `test.log`: `Test Files  110 passed (110)` / `Tests  1329 passed (1329)`; 0 skipped. All 40 ingestion test files appear in the log. The integration tests under `src/__tests__/integration/ingestion/` passed without a database.

`test` passed, so certifications are proposed. The 40 test files were split into four groups (G1: consolidation and validation, 9; G2: resolution, chunking, hashing, runs and affected nodes, 12; G3: extraction, prompts and document ingestion, 9; G4: directed, MCP and propose routes, 10; together exactly the 40). Each group was read by one `general-purpose` opus subagent restricted to Read/Grep/Glob. Each was told to propose a certification only where a test asserts the node's own condition, and to list apart every test that asserts the opposite of a candidate.

### Certification readers

| group | files | returned (dispatch ≈15:06Z + duration) | duration | tool uses | subagent tokens | proposed | contradicted |
|---|---|---|---|---|---|---|---|
| G1 consolidation/validation | 9 | ≈15:07:40Z | 95.6 s | 13 | 112,038 | 21 | 2 |
| G2 resolution/chunking/runs | 12 | ≈15:07:52Z | 107.2 s | 14 | 118,104 | 21 | 0 |
| G3 extraction/prompts/document | 9 | ≈15:07:06Z | 60.9 s | 11 | 102,113 | 9 | 0 |
| G4 directed/MCP/propose routes | 10 | ≈15:07:44Z | 98.9 s | 14 | 130,159 | 14 | 0 |

The returns are saved verbatim, with each group's file list, in `certify-returns/`. G2's return also names the nodes it considered and left out, with its reasons.

Consolidation: 65 proposals covering 59 distinct nodes. Where two groups proposed the same node, their proof files were joined (`summary-counts-tool-calls`, `link-type-in-catalog`, `link-permitted-by-type-rule`, `attribute-value-in-allowed-values`, `exact-alias-resolves`, `fragment-recorded-proposed`). Every node is a candidate and every proof path exists under `backend/`.

**Held back by the orchestrator (2).** A reader proposed these, but they are not offered:
- `rules/knowledge-base/affected-nodes-of-a-run`: the proof tests only the collector. The node decides "on every path", and the material says the extraction path and the rebuild count only node proposals.
- `constraints/ingestion-transports-answer-alike`: the parity tests cover two error codes on one operation. The constraint spans every operation both transports expose, and its decided case (MCP wrapping a refusal in a success) is what the material says the code does.

**Contradicted (2).** A test asserts the opposite of the node, so these are never certified. Both are expected to come back from the adoption as `contradicts`:
- `rules/knowledge-base/reaffirmation-consolidates`: `graph-consolidation.spec.ts`, "does NOT consolidate when change_hint='succession' even on a multi-current link".
- `rules/knowledge-base/required-start-fallback`: `temporal.spec.ts`, "AC-3: no behaviour change when document_date is the source". It asserts that the start and basis stay null.

**Written: `siegard-survey/adopt-ingestion/certify.yaml`.** It holds 57 entries (`node`, `proof`, `step: test`), each preceded by the readers' reasons as comments, with the held-back and contradicted nodes listed at the end as comments. It parses as a plain YAML list. Readers' notes on partial coverage to weigh before approving:
- `succession-closing-date`: the "today when it has none" fallback is untested.
- `consolidation-records-provenance`: only one link citing one fragment is tested.

**STOP (step 4)**: waiting for the owner to edit and approve `certify.yaml`. The certifications are the owner's to name.

### Owner's approval (after the step-4 STOP)

The owner approved `certify.yaml` with the two held-back certifications included, and the two contradictions left out:
- `rules/knowledge-base/affected-nodes-of-a-run`, proof `src/__tests__/unit/ingestion/affected-nodes.spec.ts`
- `constraints/ingestion-transports-answer-alike`, proof `src/__tests__/integration/ingestion/mcp-parity.spec.ts`

`certify.yaml` now holds 59 entries, all with step `test`. Warned before approval: the coverage auditor may return either of the two below `covered`.

---

## Step 5 — `/siegard:reconcile` as an adoption (plugin 4.21.3)

Owner's go-ahead: "pode fazer e seguir" (after the step 4 commit 8c0b9f5), and, after a pause to ask about a pasted plan from another session, "pode seguir e terminar o passo 5".

### Inputs

- slug `adopt-ingestion`; target `backend` (the only key `siegard.json` declares — decided, not asked); project root `/home/siegfriedneto/projects/eternal`
- file set: the 49 files of `/tmp/files49.txt` (listed in the table below)
- candidates: every identity in `candidates.txt` (165)
- outside: none
- certifications: `certify.yaml` (59 entries, step `test`)
- workspace: `/tmp/tmp.mVlHJdBFW9` (not committed); staged at 2026-09-30T15:21:09Z
- premise: `/tmp/tmp.mVlHJdBFW9/premise.yaml` — title "Adoption of the ingestion context of the backend (49 files) against the knowledge-base specification"; summary states the source is adopted as it stands and did not change; one `change` line per file: "Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read."

The staging separated no mechanical tier (every candidate goes to a judge on an adoption), so no step 3b run was made.

### Node packs, candidate counts and judge results

Every file pack carries 0 bound nodes and 165 candidates (the candidate index `candidates.txt` in the workspace is empty on an adoption; the candidates are in each pack). File packs total 4,892,528 bytes (min 99,794, max 99,887). The 59 certification packs total 63,849 bytes.

"saved" says whether the return was saved as the delegation's final text as-is, or with a surrounding ```` ```yaml ```` fence stripped (the only change ever made to a return).

| file | pack bytes | bound nodes | candidates | contradicts | unstated | restates | saved |
|---|---:|---:|---:|---:|---:|---:|---|
| `src/modules/ingestion/catalog/catalog.ts` | 99827 | 0 | 165 | 0 | 0 | 5 | as-is |
| `src/modules/ingestion/chunker/config.ts` | 99824 | 0 | 165 | 0 | 2 | 1 | as-is |
| `src/modules/ingestion/chunker/v1.ts` | 99812 | 0 | 165 | 1 | 1 | 11 | as-is |
| `src/modules/ingestion/dto/index.ts` | 99809 | 0 | 165 | 1 | 4 | 0 | as-is |
| `src/modules/ingestion/dto/ingest-raw-information.dto.ts` | 99872 | 0 | 165 | 0 | 1 | 5 | as-is |
| `src/modules/ingestion/dto/llm-run.dto.ts` | 99827 | 0 | 165 | 0 | 2 | 3 | fence-stripped |
| `src/modules/ingestion/dto/propose-attribute.dto.ts` | 99857 | 0 | 165 | 1 | 2 | 1 | as-is |
| `src/modules/ingestion/dto/propose-fragment.dto.ts` | 99854 | 0 | 165 | 1 | 2 | 1 | as-is |
| `src/modules/ingestion/dto/propose-link.dto.ts` | 99842 | 0 | 165 | 0 | 3 | 2 | fence-stripped |
| `src/modules/ingestion/dto/propose-node.dto.ts` | 99842 | 0 | 165 | 0 | 2 | 0 | fence-stripped |
| `src/modules/ingestion/dto/raw-information.dto.ts` | 99851 | 0 | 165 | 0 | 2 | 0 | as-is |
| `src/modules/ingestion/dto/source-type.ts` | 99827 | 0 | 165 | 0 | 0 | 1 | as-is |
| `src/modules/ingestion/hash.ts` | 99794 | 0 | 165 | 0 | 0 | 3 | as-is |
| `src/modules/ingestion/index.ts` | 99797 | 0 | 165 | 0 | 0 | 0 | fence-stripped |
| `src/modules/ingestion/mcp/directed-ingest.handler.ts` | 99863 | 0 | 165 | 0 | 2 | 2 | as-is |
| `src/modules/ingestion/mcp/handler-base.ts` | 99830 | 0 | 165 | 0 | 2 | 3 | fence-stripped |
| `src/modules/ingestion/mcp/ingest-document.handler.ts` | 99863 | 0 | 165 | 0 | 5 | 2 | as-is |
| `src/modules/ingestion/mcp/ingest-toolset.ts` | 99836 | 0 | 165 | 0 | 2 | 1 | as-is |
| `src/modules/ingestion/mcp/mcp-schemas.ts` | 99827 | 0 | 165 | 1 | 4 | 6 | as-is |
| `src/modules/ingestion/mcp/propose-attribute.handler.ts` | 99869 | 0 | 165 | 0 | 0 | 1 | as-is |
| `src/modules/ingestion/mcp/propose-fragment.handler.ts` | 99866 | 0 | 165 | 1 | 0 | 1 | fence-stripped |
| `src/modules/ingestion/mcp/propose-link.handler.ts` | 99854 | 0 | 165 | 0 | 0 | 1 | as-is |
| `src/modules/ingestion/mcp/propose-node.handler.ts` | 99854 | 0 | 165 | 0 | 0 | 0 | as-is |
| `src/modules/ingestion/mcp/transport.ts` | 99821 | 0 | 165 | 1 | 1 | 2 | as-is |
| `src/modules/ingestion/prompts/extraction.v1.ts` | 99845 | 0 | 165 | 1 | 5 | 5 | as-is |
| `src/modules/ingestion/prompts/extraction.v2.ts` | 99845 | 0 | 165 | 0 | 2 | 0 | as-is |
| `src/modules/ingestion/prompts/extraction.v3.ts` | 99845 | 0 | 165 | 0 | 4 | 3 | fence-stripped |
| `src/modules/ingestion/prompts/extraction.v4.ts` | 99845 | 0 | 165 | 1 | 1 | 0 | fence-stripped |
| `src/modules/ingestion/prompts/index.ts` | 99821 | 0 | 165 | 0 | 0 | 3 | fence-stripped |
| `src/modules/ingestion/repository/ingestion.repository.ts` | 99875 | 0 | 165 | 0 | 1 | 6 | fence-stripped |
| `src/modules/ingestion/repository/llm-run.repository.ts` | 99869 | 0 | 165 | 0 | 0 | 11 | as-is |
| `src/modules/ingestion/routes/ingestion.routes.ts` | 99851 | 0 | 165 | 0 | 2 | 4 | fence-stripped |
| `src/modules/ingestion/service/affected-nodes.ts` | 99848 | 0 | 165 | 1 | 1 | 2 | fence-stripped |
| `src/modules/ingestion/service/directed-ingestion.service.ts` | 99884 | 0 | 165 | 2 | 7 | 12 | fence-stripped |
| `src/modules/ingestion/service/entity-resolution.service.ts` | 99881 | 0 | 165 | 1 | 1 | 7 | fence-stripped |
| `src/modules/ingestion/service/extraction.service.ts` | 99860 | 0 | 165 | 0 | 4 | 6 | as-is |
| `src/modules/ingestion/service/graph-consolidation.service.ts` | 99887 | 0 | 165 | 2 | 2 | 8 | as-is |
| `src/modules/ingestion/service/ingestion.service.ts` | 99857 | 0 | 165 | 2 | 0 | 2 | fence-stripped |
| `src/modules/ingestion/service/llm-run.service.ts` | 99851 | 0 | 165 | 1 | 1 | 5 | as-is |
| `src/modules/ingestion/service/propose-attribute.service.ts` | 99881 | 0 | 165 | 0 | 0 | 5 | fence-stripped |
| `src/modules/ingestion/service/propose-fragment.service.ts` | 99878 | 0 | 165 | 0 | 0 | 2 | as-is |
| `src/modules/ingestion/service/propose-link.service.ts` | 99866 | 0 | 165 | 0 | 1 | 4 | fence-stripped |
| `src/modules/ingestion/service/propose-node.service.ts` | 99866 | 0 | 165 | 0 | 0 | 2 | as-is |
| `src/modules/ingestion/service/propose.types.ts` | 99845 | 0 | 165 | 0 | 0 | 1 | as-is |
| `src/modules/ingestion/validation/confidence.ts` | 99845 | 0 | 165 | 0 | 0 | 3 | as-is |
| `src/modules/ingestion/validation/errors.ts` | 99833 | 0 | 165 | 0 | 2 | 2 | as-is |
| `src/modules/ingestion/validation/graph-rules.ts` | 99848 | 0 | 165 | 0 | 1 | 1 | fence-stripped |
| `src/modules/ingestion/validation/structural.ts` | 99845 | 0 | 165 | 2 | 0 | 4 | as-is |
| `src/modules/ingestion/validation/temporal.ts` | 99839 | 0 | 165 | 1 | 0 | 5 | as-is |

Totals over the 49 returns folded: 21 contradicts, 72 unstated, 155 restates (14 findings name no node).

### Certification packs and auditor results

| node | pack bytes | state | remainder | saved |
|---|---:|---|---|---|
| `constraints/ingestion-transports-answer-alike` | 967 | partial | testable | fence-stripped |
| `rules/knowledge-base/affected-nodes-follow-merges` | 1021 | partial | testable | fence-stripped |
| `rules/knowledge-base/affected-nodes-of-a-run` | 1218 | partial | testable | fence-stripped |
| `rules/knowledge-base/affected-nodes-only-when-completed` | 1010 | covered | — | fence-stripped |
| `rules/knowledge-base/ambiguous-candidates-need-review` | 1368 | partial | testable | fence-stripped |
| `rules/knowledge-base/attribute-value-in-allowed-values` | 1230 | partial | testable | fence-stripped |
| `rules/knowledge-base/below-confidence-floor-records-nothing` | 1011 | partial | testable | fence-stripped |
| `rules/knowledge-base/caller-never-states-received` | 962 | partial | testable | fence-stripped |
| `rules/knowledge-base/chunk-excerpt-is-verbatim` | 920 | partial | testable | fence-stripped |
| `rules/knowledge-base/chunk-index-follows-content` | 947 | partial | testable | fence-stripped |
| `rules/knowledge-base/conflict-disputes` | 1195 | partial | testable | fence-stripped |
| `rules/knowledge-base/consolidation-records-provenance` | 1138 | partial | testable | fence-stripped |
| `rules/knowledge-base/content-hash-is-sha256` | 1172 | partial | testable | fence-stripped |
| `rules/knowledge-base/correction-replaces` | 1210 | partial | testable | fence-stripped |
| `rules/knowledge-base/correction-requires-errata-evidence` | 1151 | partial | testable | fence-stripped |
| `rules/knowledge-base/default-prompt-version` | 1067 | partial | testable | fence-stripped |
| `rules/knowledge-base/directed-attribute-value-as-text` | 1028 | partial | testable | fence-stripped |
| `rules/knowledge-base/directed-dependency-failed` | 1173 | partial | testable | fence-stripped |
| `rules/knowledge-base/directed-dispatch-order` | 1120 | partial | testable | fence-stripped |
| `rules/knowledge-base/directed-full-confidence` | 988 | partial | testable | fence-stripped |
| `rules/knowledge-base/directed-pinned-node` | 1123 | partial | testable | fence-stripped |
| `rules/knowledge-base/directed-requires-fragment-and-node` | 1090 | covered | — | fence-stripped |
| `rules/knowledge-base/directed-turn-is-original-input` | 1047 | partial | testable | fence-stripped |
| `rules/knowledge-base/document-ingestion-extracts-new-content` | 1097 | partial | testable | fence-stripped |
| `rules/knowledge-base/email-header-block` | 967 | partial | testable | fence-stripped |
| `rules/knowledge-base/exact-alias-resolves` | 1198 | partial | testable | fence-stripped |
| `rules/knowledge-base/extraction-closes-its-run` | 1008 | partial | testable | fence-stripped |
| `rules/knowledge-base/extraction-requires-running-run` | 986 | covered | — | fence-stripped |
| `rules/knowledge-base/fragment-chunks-in-run-source` | 1017 | partial | testable | fence-stripped |
| `rules/knowledge-base/fragment-recorded-proposed` | 1218 | partial | testable | fence-stripped |
| `rules/knowledge-base/held-content-records-nothing` | 1089 | partial | testable | fence-stripped |
| `rules/knowledge-base/idempotency-key` | 1144 | partial | testable | fence-stripped |
| `rules/knowledge-base/link-permitted-by-type-rule` | 1180 | partial | testable | fence-stripped |
| `rules/knowledge-base/link-type-in-catalog` | 1138 | covered | — | fence-stripped |
| `rules/knowledge-base/link-type-rule-in-effect` | 1136 | partial | testable | fence-stripped |
| `rules/knowledge-base/matched-node-gains-only-aliases` | 1053 | partial | testable | fence-stripped |
| `rules/knowledge-base/model-refusal-skips-chunk` | 943 | covered | — | fence-stripped |
| `rules/knowledge-base/new-assertion-status-from-confidence` | 1322 | partial | testable | fence-stripped |
| `rules/knowledge-base/new-assertion` | 1036 | partial | testable | as-is |
| `rules/knowledge-base/new-node-aliases` | 1036 | partial | testable | fence-stripped |
| `rules/knowledge-base/no-candidate-creates-active-node` | 1143 | partial | testable | fence-stripped |
| `rules/knowledge-base/pdf-blocks-at-form-feeds` | 1039 | partial | testable | as-is |
| `rules/knowledge-base/prompt-version-known` | 973 | partial | testable | fence-stripped |
| `rules/knowledge-base/proposal-requires-running-run` | 1117 | partial | testable | fence-stripped |
| `rules/knowledge-base/provenance-accepts-proposed-fragment` | 1135 | uncovered | testable | fence-stripped |
| `rules/knowledge-base/recent-ingestions-limit-default` | 954 | uncovered | testable | fence-stripped |
| `rules/knowledge-base/refused-proposal-records-only-its-tool-call` | 1013 | partial | testable | fence-stripped |
| `rules/knowledge-base/required-start-available` | 1045 | partial | testable | fence-stripped |
| `rules/knowledge-base/stated-start-requires-basis` | 963 | partial | testable | fence-stripped |
| `rules/knowledge-base/strong-candidate-resolves` | 1155 | partial | testable | fence-stripped |
| `rules/knowledge-base/succession-before-previous-start` | 1107 | partial | testable | fence-stripped |
| `rules/knowledge-base/succession-closes-previous` | 1364 | partial | testable | fence-stripped |
| `rules/knowledge-base/succession-closing-date` | 1065 | partial | testable | fence-stripped |
| `rules/knowledge-base/succession-signal` | 1038 | partial | testable | fence-stripped |
| `rules/knowledge-base/summary-counts-tool-calls` | 1160 | partial | testable | fence-stripped |
| `rules/knowledge-base/tool-call-total-before-pagination` | 982 | partial | testable | as-is |
| `rules/knowledge-base/turn-blocks` | 952 | partial | testable | fence-stripped |
| `rules/knowledge-base/undivided-sources` | 956 | partial | testable | fence-stripped |
| `rules/knowledge-base/validity-start-before-end` | 964 | partial | testable | fence-stripped |

States: 5 covered, 52 partial, 2 uncovered; all 54 non-covered carry `remainder: testable`.

### Judges run, and returns voided or refused

Judges run in total: **52** (49 files + 3 re-delegations). Auditors run: **59**.

- Concurrency: the first batch hit the 20-subagent limit; 20 judge dispatches were refused at launch (they never ran) and were dispatched again in later batches. They are not counted as judges run.
- Voided before the fold (never saved): `src/modules/ingestion/mcp/propose-node.handler.ts` — the judge returned an empty `read` and asked a question instead of judging. Re-delegated with the prompt clarified (answer `nowhere` where the file holds no fact; ask nothing).
- **Refused by the fold** (first `--fold`, verbatim):
  ```
  cannot fold: src/modules/ingestion/service/propose.types.ts: findings: [] is too short
  cannot fold: src/modules/ingestion/validation/structural.ts: read: no entry for scenarios/knowledge-base/same-target-succession-is-disputed; the return answers for the node set the delegation was handed, whole

  2 problem(s); each names a delegation to run again with its prompt fixed — an unusable return is never repaired here, and a follow-up question to the delegation that already answered is not a fresh judgment.
  ```
  Both returns were moved out of `.returns/` (kept in `/tmp/refused/`) and re-delegated with the prompt fixed (omit `findings` rather than write an empty list; one `read` entry per node of the pack, scenarios included). The second `--fold` accepted all 49.
- Four returns (the `source-type.ts` judge and three auditors) were saved from a final assistant message whose transcript record carried no `end_turn` stop reason; the text was complete in each (it ended with the contract's last key) and is saved as-is apart from fence stripping.

### Fold, reconciliation, bind (verbatim)

```
$ trace.py --fold backend /tmp/tmp.mVlHJdBFW9 /tmp/tmp.mVlHJdBFW9/premise.yaml siegard-reconcile/adopt-ingestion.md
folded adopt-ingestion.md: 141 node(s) cleared, 15 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 9 candidate(s) no file of the set holds, listed under `unheld`
  next: trace.py --reconciliation siegard-reconcile/adopt-ingestion.md
```

```
$ trace.py --reconciliation siegard-reconcile/adopt-ingestion.md
adopt-ingestion.md holds: 49 file(s), 141 node(s) the judgment cleared, 15 it did not, 3 file(s) the trace binds nothing to.
5 node(s) certified as decided by a test — rules/knowledge-base/affected-nodes-only-when-completed by step `test` over src/__tests__/unit/ingestion/llm-run-affected-nodes.spec.ts; rules/knowledge-base/directed-requires-fragment-and-node by step `test` over src/__tests__/unit/ingestion/directed-ingest-handler.spec.ts, src/modules/ingestion/mcp/__tests__/ingest-directed-schema.spec.ts; rules/knowledge-base/extraction-requires-running-run by step `test` over src/__tests__/unit/ingestion/extraction-orchestrator.spec.ts; rules/knowledge-base/link-type-in-catalog by step `test` over src/__tests__/integration/ingestion/mcp-parity.spec.ts, src/__tests__/unit/ingestion/mcp-ingest.spec.ts, src/__tests__/unit/ingestion/propose-service-layer.spec.ts; rules/knowledge-base/model-refusal-skips-chunk by step `test` over src/__tests__/unit/ingestion/extraction-orchestrator.spec.ts: --bind-record writes each binding as one a test decides, pinning the proof beside the files.
--bind-record will write 141 binding(s) from this record and none for contracts/knowledge-base/ingestion, domain/knowledge-base/directed-item, domain/knowledge-base/value-type, rules/knowledge-base/affected-nodes-follow-merges, rules/knowledge-base/ambiguous-candidates-need-review, rules/knowledge-base/attribute-value-parses, rules/knowledge-base/caller-never-states-received, rules/knowledge-base/every-proposal-audited, rules/knowledge-base/fragment-recorded-proposed, rules/knowledge-base/reaffirmation-consolidates, rules/knowledge-base/required-start-fallback, rules/knowledge-base/speaker-line, rules/knowledge-base/tool-call-validation-outcome, scenarios/knowledge-base/held-content-under-another-model, scenarios/knowledge-base/impossible-calendar-date-refused: a node without `encoded_at` is a node this form cannot bind.
```

```
$ trace.py --bind-record backend specification siegard-reconcile/adopt-ingestion.md --workspace /tmp/tmp.mVlHJdBFW9
bound constraints/document-content-is-data to 2 file(s)
bound constraints/extraction-acts-only-through-proposals to 3 file(s)
bound constraints/ingestion-transports-answer-alike to 4 file(s)
bound domain/knowledge-base/alias-kind to 1 file(s)
bound domain/knowledge-base/attribute-key to 3 file(s)
bound domain/knowledge-base/change-hint to 4 file(s)
bound domain/knowledge-base/directed-ingestion to 3 file(s)
bound domain/knowledge-base/directed-item-kind to 2 file(s)
bound domain/knowledge-base/directed-item-status to 1 file(s)
bound domain/knowledge-base/entity-match-review to 1 file(s)
bound domain/knowledge-base/information-fragment to 11 file(s)
bound domain/knowledge-base/ingest-tool to 11 file(s)
bound domain/knowledge-base/knowledge-node to 2 file(s)
bound domain/knowledge-base/link-type to 2 file(s)
bound domain/knowledge-base/link-type-rule to 1 file(s)
bound domain/knowledge-base/llm-run to 9 file(s)
bound domain/knowledge-base/node-alias to 2 file(s)
bound domain/knowledge-base/node-resolution to 3 file(s)
bound domain/knowledge-base/node-type to 2 file(s)
bound domain/knowledge-base/prompt-version to 5 file(s)
bound domain/knowledge-base/proposal to 7 file(s)
bound domain/knowledge-base/raw-chunk to 8 file(s)
bound domain/knowledge-base/raw-information to 9 file(s)
bound domain/knowledge-base/run-status to 7 file(s)
bound domain/knowledge-base/run-summary to 3 file(s)
bound domain/knowledge-base/tool-call to 6 file(s)
bound domain/knowledge-base/valid-from-basis to 4 file(s)
bound domain/knowledge-base/validation-outcome to 5 file(s)
bound rules/knowledge-base/affected-nodes-of-a-run to 1 file(s)
bound rules/knowledge-base/affected-nodes-only-when-completed to 2 file(s)
  rules/knowledge-base/affected-nodes-only-when-completed is decided by a test from here: step `test` over backend/src/__tests__/unit/ingestion/llm-run-affected-nodes.spec.ts; a drift on its files is that step's to answer, a drift on the test is a fresh certification's
bound rules/knowledge-base/attribute-key-for-node-type to 3 file(s)
bound rules/knowledge-base/attribute-proposal-check-order to 1 file(s)
bound rules/knowledge-base/attribute-value-in-allowed-values to 3 file(s)
bound rules/knowledge-base/below-confidence-floor-records-nothing to 4 file(s)
bound rules/knowledge-base/candidate-similarity to 1 file(s)
bound rules/knowledge-base/chunk-excerpt-is-verbatim to 1 file(s)
bound rules/knowledge-base/chunk-index-follows-content to 1 file(s)
bound rules/knowledge-base/chunk-listing-order to 1 file(s)
bound rules/knowledge-base/chunking-version to 2 file(s)
bound rules/knowledge-base/chunks-never-cross-blocks to 1 file(s)
bound rules/knowledge-base/cited-fragments-anchored to 3 file(s)
bound rules/knowledge-base/cited-fragments-exist to 2 file(s)
bound rules/knowledge-base/cited-fragments-in-run to 2 file(s)
bound rules/knowledge-base/closing-stamps-finish-time to 1 file(s)
bound rules/knowledge-base/conflict-disputes to 1 file(s)
bound rules/knowledge-base/consolidation-precedence to 1 file(s)
bound rules/knowledge-base/consolidation-records-provenance to 1 file(s)
bound rules/knowledge-base/content-hash-is-sha256 to 4 file(s)
bound rules/knowledge-base/content-hash-unique to 1 file(s)
bound rules/knowledge-base/content-length to 2 file(s)
bound rules/knowledge-base/contentless-blocks-single-chunk to 1 file(s)
bound rules/knowledge-base/correction-replaces to 1 file(s)
bound rules/knowledge-base/correction-requires-errata-evidence to 2 file(s)
bound rules/knowledge-base/current-assertion to 1 file(s)
bound rules/knowledge-base/date-check-order to 1 file(s)
bound rules/knowledge-base/default-prompt-version to 2 file(s)
bound rules/knowledge-base/directed-attribute-value-as-text to 1 file(s)
bound rules/knowledge-base/directed-attribute-value-shape to 2 file(s)
bound rules/knowledge-base/directed-defaults to 1 file(s)
bound rules/knowledge-base/directed-dependency-failed to 1 file(s)
bound rules/knowledge-base/directed-dispatch-order to 1 file(s)
bound rules/knowledge-base/directed-fragments-anchor-first-chunk to 1 file(s)
bound rules/knowledge-base/directed-full-confidence to 2 file(s)
bound rules/knowledge-base/directed-ingestion-run to 2 file(s)
bound rules/knowledge-base/directed-item-status to 1 file(s)
bound rules/knowledge-base/directed-later-reference-wins to 1 file(s)
bound rules/knowledge-base/directed-pinned-node to 2 file(s)
bound rules/knowledge-base/directed-reference-length to 2 file(s)
bound rules/knowledge-base/directed-requires-fragment-and-node to 3 file(s)
  rules/knowledge-base/directed-requires-fragment-and-node is decided by a test from here: step `test` over backend/src/__tests__/unit/ingestion/directed-ingest-handler.spec.ts, backend/src/modules/ingestion/mcp/__tests__/ingest-directed-schema.spec.ts; a drift on its files is that step's to answer, a drift on the test is a fresh certification's
bound rules/knowledge-base/directed-run-completes to 1 file(s)
bound rules/knowledge-base/directed-source-content to 1 file(s)
bound rules/knowledge-base/directed-source-label-length to 2 file(s)
bound rules/knowledge-base/directed-turn-is-original-input to 3 file(s)
bound rules/knowledge-base/document-ingestion-extracts-new-content to 2 file(s)
bound rules/knowledge-base/email-header-block to 1 file(s)
bound rules/knowledge-base/email-quote-blocks to 1 file(s)
bound rules/knowledge-base/exact-alias-resolves to 1 file(s)
bound rules/knowledge-base/extraction-anchors-to-read-chunk to 2 file(s)
bound rules/knowledge-base/extraction-closes-its-run to 1 file(s)
bound rules/knowledge-base/extraction-fails-on-repeated-system-errors to 1 file(s)
bound rules/knowledge-base/extraction-reads-chunks-in-order to 2 file(s)
bound rules/knowledge-base/extraction-requires-running-run to 1 file(s)
  rules/knowledge-base/extraction-requires-running-run is decided by a test from here: step `test` over backend/src/__tests__/unit/ingestion/extraction-orchestrator.spec.ts; a drift on its files is that step's to answer, a drift on the test is a fresh certification's
bound rules/knowledge-base/fragment-chunks-exist to 1 file(s)
bound rules/knowledge-base/fragment-chunks-in-run-source to 2 file(s)
bound rules/knowledge-base/fragment-missing-chunk-first to 1 file(s)
bound rules/knowledge-base/fragment-text-length to 5 file(s)
bound rules/knowledge-base/held-content-records-nothing to 3 file(s)
bound rules/knowledge-base/idempotency-key to 4 file(s)
bound rules/knowledge-base/idempotency-key-unique to 1 file(s)
bound rules/knowledge-base/ingestion-records-chunks-and-run to 1 file(s)
bound rules/knowledge-base/link-permitted-by-type-rule to 3 file(s)
bound rules/knowledge-base/link-proposal-check-order to 1 file(s)
bound rules/knowledge-base/link-type-in-catalog to 4 file(s)
  rules/knowledge-base/link-type-in-catalog is decided by a test from here: step `test` over backend/src/__tests__/integration/ingestion/mcp-parity.spec.ts, backend/src/__tests__/unit/ingestion/mcp-ingest.spec.ts, backend/src/__tests__/unit/ingestion/propose-service-layer.spec.ts; a drift on its files is that step's to answer, a drift on the test is a fresh certification's
bound rules/knowledge-base/link-type-rule-in-effect to 1 file(s)
bound rules/knowledge-base/llm-run-lifecycle to 2 file(s)
bound rules/knowledge-base/long-block-sentence-chunks to 2 file(s)
bound rules/knowledge-base/long-sentence-own-chunk to 2 file(s)
bound rules/knowledge-base/matched-node-gains-only-aliases to 1 file(s)
bound rules/knowledge-base/model-refusal-skips-chunk to 1 file(s)
  rules/knowledge-base/model-refusal-skips-chunk is decided by a test from here: step `test` over backend/src/__tests__/unit/ingestion/extraction-orchestrator.spec.ts; a drift on its files is that step's to answer, a drift on the test is a fresh certification's
bound rules/knowledge-base/name-normalization to 1 file(s)
bound rules/knowledge-base/new-assertion to 1 file(s)
bound rules/knowledge-base/new-assertion-status-from-confidence to 4 file(s)
bound rules/knowledge-base/new-node-aliases to 1 file(s)
bound rules/knowledge-base/no-candidate-creates-active-node to 1 file(s)
bound rules/knowledge-base/node-name-length to 3 file(s)
bound rules/knowledge-base/node-type-in-catalog to 4 file(s)
bound rules/knowledge-base/original-input-length to 1 file(s)
bound rules/knowledge-base/orphaned-fragment to 1 file(s)
bound rules/knowledge-base/pdf-blocks-at-form-feeds to 1 file(s)
bound rules/knowledge-base/prompt-version-known to 1 file(s)
bound rules/knowledge-base/proposal-confidence-range to 4 file(s)
bound rules/knowledge-base/proposal-meets-current-assertion to 1 file(s)
bound rules/knowledge-base/proposal-requires-running-run to 6 file(s)
bound rules/knowledge-base/proposal-run-checks-first to 7 file(s)
bound rules/knowledge-base/provenance-accepts-proposed-fragment to 1 file(s)
bound rules/knowledge-base/recent-ingestion-latest-run to 1 file(s)
bound rules/knowledge-base/recent-ingestions-limit-bounds to 2 file(s)
bound rules/knowledge-base/recent-ingestions-limit-default to 2 file(s)
bound rules/knowledge-base/recent-ingestions-order to 2 file(s)
bound rules/knowledge-base/refused-proposal-records-only-its-tool-call to 4 file(s)
bound rules/knowledge-base/required-start-available to 2 file(s)
bound rules/knowledge-base/retry-counts-attempts to 1 file(s)
bound rules/knowledge-base/retry-rejects-orphaned-fragments to 1 file(s)
bound rules/knowledge-base/short-block-one-chunk to 2 file(s)
bound rules/knowledge-base/stated-start-requires-basis to 3 file(s)
bound rules/knowledge-base/strong-candidate-resolves to 1 file(s)
bound rules/knowledge-base/succession-before-previous-start to 1 file(s)
bound rules/knowledge-base/succession-closes-previous to 1 file(s)
bound rules/knowledge-base/succession-closing-date to 1 file(s)
bound rules/knowledge-base/succession-signal to 1 file(s)
bound rules/knowledge-base/summary-counts-orphaned-fragments to 2 file(s)
bound rules/knowledge-base/summary-counts-tool-calls to 2 file(s)
bound rules/knowledge-base/tool-call-listing-order to 1 file(s)
bound rules/knowledge-base/tool-call-page-defaults to 1 file(s)
bound rules/knowledge-base/tool-call-total-before-pagination to 2 file(s)
bound rules/knowledge-base/turn-blocks to 1 file(s)
bound rules/knowledge-base/undivided-sources to 1 file(s)
bound rules/knowledge-base/validity-start-before-end to 2 file(s)
bound scenarios/knowledge-base/email-without-blank-line-is-one-block to 1 file(s)
bound scenarios/knowledge-base/form-feed-only-pdf-is-one-chunk to 1 file(s)
bound scenarios/knowledge-base/same-target-succession-is-disputed to 1 file(s)
141 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-ingestion.md
  15 node(s) of adopt-ingestion.md the judgment did not clear, and this bind wrote none of them:
    contracts/knowledge-base/ingestion
    domain/knowledge-base/directed-item
    domain/knowledge-base/value-type
    rules/knowledge-base/affected-nodes-follow-merges
    rules/knowledge-base/ambiguous-candidates-need-review
    rules/knowledge-base/attribute-value-parses
    rules/knowledge-base/caller-never-states-received
    rules/knowledge-base/every-proposal-audited
    rules/knowledge-base/fragment-recorded-proposed
    rules/knowledge-base/reaffirmation-consolidates
    rules/knowledge-base/required-start-fallback
    rules/knowledge-base/speaker-line
    rules/knowledge-base/tool-call-validation-outcome
    scenarios/knowledge-base/held-content-under-another-model
    scenarios/knowledge-base/impossible-calendar-date-refused
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
```

### The skill's report (verbatim)

> **File set, as given.** 49 files under target `backend`, reconciled as an adoption under slug `adopt-ingestion`, with the 165 candidates `/analyse` wrote (every identity in `candidates.txt`), no file kept outside, and 59 certifications (step `test`).
>
> **Staging.** All 49 files were judged: each carried 165 candidates and no bound node. None had nothing left to judge, none was unbound at staging, 0 pairs were omitted as current and unowed, and no pair was answered by a run (the mechanical tier was empty — on an adoption every candidate goes to a judge).
>
> **Shape of the judgment.** One `specification-conformance-reviewer` delegation per file, 49 in all; 52 judges ran, because three returns were unusable and each was replaced by a fresh delegation: `mcp/propose-node.handler.ts` (empty `read`, a question instead of a judgment), and two the fold refused — `service/propose.types.ts` (`findings: [] is too short`) and `validation/structural.ts` (no `read` entry for `scenarios/knowledge-base/same-target-succession-is-disputed`). 59 `coverage-auditor` delegations certified one node each.
>
> **What the judgment answered.** 141 nodes cleared; 15 did not, none of them collateral. 9 candidates are held by no file of the set and are listed under `unheld`: `domain/knowledge-base/accepted-fragment-filter`, `domain/knowledge-base/knowledge-link`, `domain/knowledge-base/node-attribute`, `rules/knowledge-base/one-current-attribute-per-functional-key`, `rules/knowledge-base/one-current-attribute-per-value`, `rules/knowledge-base/one-current-link-per-functional-type`, `rules/knowledge-base/one-current-link-per-target`, `rules/knowledge-base/page-defaults`, `rules/knowledge-base/reception-time-is-recording-time`. Three files bind nothing: `dto/source-type.ts`, `index.ts`, `service/propose.types.ts`. Across the 49 returns: 21 `contradicts`, 72 `unstated`, 155 `restates`. The 15 not cleared, each with the contradiction against it (evidence verbatim in the record):
>
> - `contracts/knowledge-base/ingestion` — `mcp/mcp-schemas.ts` (the mirrored output schema), `mcp/transport.ts` (comments state "4 tools" while the surface carries nine), `service/ingestion.service.ts` (held content under another model/prompt version looks up the run by the new idempotency key and ends in an InvariantError, where the contract answers 200 `noop_existing`), `service/llm-run.service.ts` (the retry race branch refuses naming status `running` for a run read as `failed`)
> - `domain/knowledge-base/directed-item` — `service/directed-ingestion.service.ts` (attribute and link items carry no `ref`)
> - `domain/knowledge-base/value-type` — `dto/propose-attribute.dto.ts` (value types omit `bool`)
> - `rules/knowledge-base/affected-nodes-follow-merges` — `service/affected-nodes.ts` (compares status to `"merged_into"`; the enum value is `merged`, so merges are never followed)
> - `rules/knowledge-base/ambiguous-candidates-need-review` — `dto/index.ts` (propose_node description says it "never duplicates"), `service/entity-resolution.service.ts` (the trigram query caps candidates at 10, so an 11th candidate at ≥ 0.55 gets no review)
> - `rules/knowledge-base/attribute-value-parses` and `scenarios/knowledge-base/impossible-calendar-date-refused` — `validation/structural.ts` (`Date.parse` NaN test lets 2024-02-30 through)
> - `rules/knowledge-base/caller-never-states-received` — `prompts/extraction.v4.ts` (the directive tells the model to state basis `received`)
> - `rules/knowledge-base/every-proposal-audited` — `service/directed-ingestion.service.ts` (a pinned node records no tool call)
> - `rules/knowledge-base/fragment-recorded-proposed` — `dto/propose-fragment.dto.ts` (the confidence description)
> - `rules/knowledge-base/reaffirmation-consolidates` — `service/graph-consolidation.service.ts`, twice (multi-current links and attributes require hint `none` and the same start, so a re-affirmation duplicates or ends in SYSTEM_INTERNAL_ERROR)
> - `rules/knowledge-base/required-start-fallback` — `validation/temporal.ts` (the document-date branch leaves the start null), `prompts/extraction.v1.ts` (the prompt says the fallback is always `received`)
> - `rules/knowledge-base/speaker-line` — `chunker/v1.ts` (SPEAKER_LINE_REGEX is wider than the node)
> - `rules/knowledge-base/tool-call-validation-outcome` — `mcp/propose-fragment.handler.ts` (a non-ok envelope is always recorded `rejected`, never `error`)
> - `scenarios/knowledge-base/held-content-under-another-model` — `service/ingestion.service.ts` (same lookup as the contract finding)
>
> **Where it was written.** Record `siegard-reconcile/adopt-ingestion.md`; returns `siegard-reconcile/adopt-ingestion.returns/` (49 judge returns + 59 `certify__*`); no run directory (no mechanical tier).
>
> **What was bound.** 141 bindings written to `siegard-trace.json` from the record (the trace's first bindings over these files). None was written for the 15 nodes above; each stays as it stood, and `trace.py --owed` is what reports them.
>
> **Decided by a test from here.** 5 nodes: `rules/knowledge-base/affected-nodes-only-when-completed`, `rules/knowledge-base/directed-requires-fragment-and-node`, `rules/knowledge-base/extraction-requires-running-run`, `rules/knowledge-base/link-type-in-catalog`, `rules/knowledge-base/model-refusal-skips-chunk`. The other 54 certifications did not hold — 52 `partial`, 2 `uncovered` (`provenance-accepts-proposed-fragment`, `recent-ingestions-limit-default`) — and every one carries `remainder: testable`; the auditor's own `why` and the assertion that would close each are in the record and in `siegard-reconcile/adopt-ingestion.returns/certify__*.yaml`, and `trace.py --owed backend` lists them with each file's count of bindings a reading decides. The route that closes them is one proof increment: `/deliver-scope` under a new slug, with an ask naming the proof increment and, per testable remainder, the node, the auditor's assertion verbatim, `siegard-reconcile/adopt-ingestion.md` and the files the node is bound to — which to include is the owner's.
>
> **Routes for what did not clear — the owner chooses; this skill chooses neither.**
> - Where the source is right and the node behind it (e.g. the 10-candidate cap, the `bool` value type, the wider speaker line): `/siegard:analyse` with the finding's evidence, its file and the node as material, project root `/home/siegfriedneto/projects/eternal`; then this skill again over the remainder under a new slug.
> - Where the node is right and the behavior wrong (e.g. `merged_into` vs `merged`, `Date.parse` on 2024-02-30, the held-content lookup, the multi-current re-affirmation, the pinned-node audit): `/siegard:plan-work` for a corrective increment, scope = the one wrong behavior as the finding states it, project root as above, target `backend`.
> - The 155 `restates` (and the contradicting comments in `mcp/transport.ts`): the comment route — remove the prose, never refresh it — then this skill over each such file under a new slug.
> - The 72 `unstated` facts: `/siegard:analyse` with each finding as material.
> - The 9 `unheld` candidates: the analysis's to revisit, or the adoption of the files that hold them (none of the 49 does).
>
> **Next invocation's file set** — the remainder, never the whole set: the 17 files the 15 uncleared nodes were observed at — `chunker/v1.ts`, `dto/index.ts`, `dto/propose-attribute.dto.ts`, `dto/propose-fragment.dto.ts`, `mcp/mcp-schemas.ts`, `mcp/propose-fragment.handler.ts`, `mcp/transport.ts`, `prompts/extraction.v1.ts`, `prompts/extraction.v4.ts`, `service/affected-nodes.ts`, `service/directed-ingestion.service.ts`, `service/entity-resolution.service.ts`, `service/graph-consolidation.service.ts`, `service/ingestion.service.ts`, `service/llm-run.service.ts`, `validation/structural.ts`, `validation/temporal.ts` (all under `src/modules/ingestion/`) — plus whatever `--check` reports `moved` after the `/analyse` that answers them. `--check` right now reports 6 findings (4 moved: `accepted-fragment-filter`, `knowledge-link`, `node-attribute`, `page-defaults`, bound to query-retrieval files; 2 code: `query-retrieval/service/accepted-fragments.service.ts` and `provenance.service.ts`), none in this file set — down from 9 before staging.
>
> **Target standing** (`trace.py --untraced backend`): 279 tracked files, 60 bound, 219 no binding names — 4 holds-nothing (judged by an adoption, none of its candidates bound to it), 0 outside, 215 unsurveyed. Adoption of `backend` is not complete.

---

## Step 6 — what it shows

Owner: "pode seguir para o passo 6".

### Trace commands (verbatim, `$P` = plugin 4.21.3)

```
===== $ trace.py --reconciliation siegard-reconcile/adopt-ingestion.md
adopt-ingestion.md holds: 49 file(s), 141 node(s) the judgment cleared, 15 it did not, 3 file(s) the trace binds nothing to.
5 node(s) certified as decided by a test — rules/knowledge-base/affected-nodes-only-when-completed by step `test` over src/__tests__/unit/ingestion/llm-run-affected-nodes.spec.ts; rules/knowledge-base/directed-requires-fragment-and-node by step `test` over src/__tests__/unit/ingestion/directed-ingest-handler.spec.ts, src/modules/ingestion/mcp/__tests__/ingest-directed-schema.spec.ts; rules/knowledge-base/extraction-requires-running-run by step `test` over src/__tests__/unit/ingestion/extraction-orchestrator.spec.ts; rules/knowledge-base/link-type-in-catalog by step `test` over src/__tests__/integration/ingestion/mcp-parity.spec.ts, src/__tests__/unit/ingestion/mcp-ingest.spec.ts, src/__tests__/unit/ingestion/propose-service-layer.spec.ts; rules/knowledge-base/model-refusal-skips-chunk by step `test` over src/__tests__/unit/ingestion/extraction-orchestrator.spec.ts: --bind-record writes each binding as one a test decides, pinning the proof beside the files.
--bind-record will write 141 binding(s) from this record and none for contracts/knowledge-base/ingestion, domain/knowledge-base/directed-item, domain/knowledge-base/value-type, rules/knowledge-base/affected-nodes-follow-merges, rules/knowledge-base/ambiguous-candidates-need-review, rules/knowledge-base/attribute-value-parses, rules/knowledge-base/caller-never-states-received, rules/knowledge-base/every-proposal-audited, rules/knowledge-base/fragment-recorded-proposed, rules/knowledge-base/reaffirmation-consolidates, rules/knowledge-base/required-start-fallback, rules/knowledge-base/speaker-line, rules/knowledge-base/tool-call-validation-outcome, scenarios/knowledge-base/held-content-under-another-model, scenarios/knowledge-base/impossible-calendar-date-refused: a node without `encoded_at` is a node this form cannot bind.
[exit 0]
===== $ trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
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

29 finding(s) no bind closed, over 22 file(s):
  29 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  29 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

19 pair(s) the records answer both ways are not listed above: a clearance closes a finding here. No chronology is available — a record carries no timestamp and several land in one commit — so which judgment is current is a reading of the records themselves.
  `--all` lists them, each with what the trace holds for it now

83 unstated fact(s) the records name, over 38 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  src/modules/ingestion/chunker/config.ts — line 19, the lower bound of CHUNK_TARGET: 1500 is a chunk-size threshold that no node holds, and nothing reads it. The chunking nodes state only 4000 and 2000. The docstring describes a soft window the chunker does not apply. A later reader would take 1500 as a decided minimum chunk size, and it would live only in this file. [adopt-ingestion.md]
  src/modules/ingestion/chunker/config.ts — line 30, READING_TAIL: A 200-unit chunk overlap for retrieval is stated only here, and no code reads it (a grep of backend/src finds no importer). The only node with a 200 is rules/knowledge-base/extraction-reads-chunks-in-order, which is the tail of the previous chunk shown to the model during extraction. That is a different fact. A reader looking for the overlap rule would find it here, and would either not find it in the specification or confuse it with the extraction tail. [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — scanLines (line 298) and the isBlank test in splitEmail (line 229): The code decides what a line and a blank line are. A line ends only at U+000A. A blank line is one of zero length. A whitespace-only line, or any line of a CRLF email (which keeps a trailing "\r"), is never blank. On a CRLF email the header block then never ends and the whole email stays one block. No node says this, so the next reader looks in the specification and does not find the decision. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.health, lines 150-153: This is a callable capability, with the fields it returns, that no node holds. A search of the specification root for health finds nothing. The tool is offered to the model and described only here. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.ingest_document, lines 148-149: This promises that extraction continues after the caller disconnects, and tells the caller how to recover. No node holds either. The ingestion contract's ingest-document answers describe only the completed answers and refusals. The recovery behaviour exists only in text sent to the model. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.propose_link and propose_attribute, lines 129-140: This states a minimum of one cited fragment for link and attribute proposals. No node holds that minimum. The proposal node gives its evidence association as 0..*, and the only "at least one fragment" rule is the errata rule for corrections. The threshold is stated only in text sent to the model. Whoever reads the specification will not find it, and the specification's 0..* says zero is allowed. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.start_async_ingestion, lines 165-173: This is a whole ingestion operation, asynchronous and returning the run id at once, that the ingestion contract does not list among its operations. The contract lists ingest-document and ingest-directed only. A search of the specification root finds no asynchronous ingestion, so the behaviour and the promise that "Arguments and defaults match `ingest_document` exactly" live only in the source. [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment, `storage_ref` bullet, line 19: The comment claims a domain rule, that a raw information's storage reference is null in v1.0.0. No node holds it, and the schema (`storage_ref: z.string().nullable().optional()`) accepts any string. The repository INSERT in backend/src/modules/ingestion/repository/ingestion.repository.ts names no `storage_ref` column, so the value is silently dropped rather than refused. The next reader looks in the specification for what a supplied storage reference does and finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the `affected_nodes` field, line 102, with the comment on lines 83-89: The response type lets a completed run carry no affected nodes when the lookup failed, and the comment says so. affected-nodes-only-when-completed and the read-llm-run answer say the nodes are listed when the run is completed, with no failure exception. The best-effort omission is a behaviour decided in code and prose, and a reader of the specification will believe a completed run always lists its nodes. [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the `attempts` field of LlmRunResponseSchema, line 98: The schema fixes a lower bound of 1 on a run's attempts. The llm-run node says only that attempts is an integer, and retry-counts-attempts says only that a retry adds one. Neither states that the first attempt counts as 1. The floor is a decision that now lives in this schema, and a reader looking in the specification will not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — `fragment_ids`, lines 41-46: An attribute proposal that cites no fragment is refused here, as a rule of the business. No node states it. The proposal node gives the cited fragments the cardinality 0..*, and the ingestion contract's refusals for propose-attribute name only a missing or wrongly shaped field. A reader looking in the specification for whether an attribute may be proposed without evidence finds nothing, and this line is the only place that says no. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — the `.describe(...)` text on `valid_to`, lines 50-52: The text tells the model that an assertion's validity intervals are half-open. No node holds this for proposals or assertions. The only half-open statement in the specification is the link type rule's `day < valid_to`, and the validity-start-before-end rule says only that the start is strictly before the end. The convention lives in a tool description, and a reader of the specification cannot learn from it whether the end date is inside the interval. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — Header comment, line 3 ("Layer 1 (structural) of the 5-layer validation").: The comment states that validation has five layers and that this file is the first. No node holds a five-layer division. The nodes hold check orders per proposal (`link-proposal-check-order`, `attribute-proposal-check-order`, `proposal-run-checks-first`), and there is none for a fragment proposal. A reader who takes the comment as the layering of validation will look for it in the specification and not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — The `.describe(...)` on `text`, line 16.: This text is part of the tool's schema, so a model reads it as an instruction. It says a fragment's text is a verbatim quote of the chunk and holds one assertion only. No node holds either rule. The `information-fragment` node and `fragment-text-length` say only that the text is a string of 1 to 1000 characters. Nothing in the specification says a fragment must be verbatim or single-assertion, so those rules live only in this description. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The `change_hint` field's default, line 69.: A link proposal that omits its change hint is treated as change hint none. That decides re-affirmation, because reaffirmation-consolidates needs "change hint is none". The specification states the default only for directed ingestion (directed-defaults), so for a proposal from an extraction the default lives only in this schema. [adopt-ingestion.md]
  ... and 68 more; `--all` lists them
  each is the analysis's to close, through the node that gives the fact a home

162 place(s) the records name where text in the source restates a node's fact the code holds, over 45 file(s). The pair conforms and none is counted above:
  src/modules/ingestion/catalog/catalog.ts — `LinkTypeRuleRow` doc comment, lines 47-51 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `domainOf` docstring, lines 227-249 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `isLinkRuleActive` docstring, lines 265-270 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — header comment, lines 13-21 (closed and open value domains), repeated in the `attributeValidValuesByKeyId` doc comment, lines 96-112 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — header comment, lines 9-11 ("The catalog covers BR-14 ... and BR-15 ...") (rules/knowledge-base/link-permitted-by-type-rule) [adopt-ingestion.md]
  src/modules/ingestion/chunker/config.ts — docstring above CHUNK_HARD_MAX, line 21 (rules/knowledge-base/long-block-sentence-chunks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — comment inside the oversize loop, lines 99-103 (rules/knowledge-base/long-sentence-own-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — comment on the fallback at lines 121-127 (rules/knowledge-base/contentless-blocks-single-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of RawChunkInput, lines 42-46 (rules/knowledge-base/chunk-excerpt-is-verbatim) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of RawChunkInput, lines 42-46 (rules/knowledge-base/chunk-index-follows-content) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, chat entry, and docstring of splitTurns, lines 150-154 and 261-266 (rules/knowledge-base/turn-blocks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, email entry, and docstring of splitEmail, lines 147-149 and 213-216 (rules/knowledge-base/email-header-block) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, pdf entry, lines 145-146 (rules/knowledge-base/pdf-blocks-at-form-feeds) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitEmail, lines 213-216 (rules/knowledge-base/email-quote-blocks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — header comment, line 11 (rules/knowledge-base/short-block-one-chunk) [adopt-ingestion.md]
  ... and 147 more; `--all` lists them
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
===== $ trace.py --untraced backend
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
===== $ trace.py --convergence backend specification siegard-work
239 node(s) of specification; 204 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

199 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 6, contract 1, element 34, rule 152, scenario 6
5 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
    element 4, rule 1
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
35 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 1, element 4, rule 26, scenario 2

files under backend: 279 tracked, 60 bound, 219 no binding names (215 unsurveyed) — `--untraced` lists them

204 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 29 finding(s) past reconciliations left open and no bind closed (29 unseen, 0 covered, 0 reported); 19 pair(s) the records answer both ways; 83 unstated fact(s) the source states and no node holds; 162 place(s) text restates a node's fact; 50 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
===== $ trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
domain/knowledge-base/accepted-fragment-filter: bound at sha256:1b25aa96d866d21eb71c4539179a67e630f7cd8e0a486ee55d569f750e61c48c, now sha256:a5d33ecf0d633813dfb40119cbdc8b4ca73ba5d8249039fc97b3156eb4a080db; the specification moved since this bind
domain/knowledge-base/knowledge-link: bound at sha256:3b8ec94b83478c148f7ed0dfd537033a6a834f63715806cd6438fe6386067193, now sha256:d861bbe18ec8f790d7c8ee6fc33dc2b3f294f49beaf50aa61249fe7dc61249ef; the specification moved since this bind
domain/knowledge-base/node-attribute: bound at sha256:9c68df5fe67fe642000fcde362d6eefc17c44c49ad3854dbb6fcf0c811f23213, now sha256:f0926d79f5165fdccca42a8788d6dd38ddffe8471822df58aa4e268b54823cc1; the specification moved since this bind
rules/knowledge-base/page-defaults: bound at sha256:bb7cbf8a74e64bbfd13c556601f21c9e8ef07888fd30286e00c80acb609a0120, now sha256:4a1d00a6c819add84291f8236ccecd6f980bae2fd75b3571fb551f02212b3786; the specification moved since this bind
backend/src/modules/query-retrieval/service/accepted-fragments.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type
backend/src/modules/query-retrieval/service/provenance.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type

6 drift finding(s) over 204 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  4 moved: bound to a node whose text moved since the bind; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
[exit 1]
```

`--owed` and `--check` exit 1 because they report open items; that is their normal answer when something is owed, not a failure. `--convergence` ran with `siegard-work` absent and answered "0 initiative(s) read".

### Counts, from the record

| measure | count |
|---|---:|
| candidates | 165 |
| cleared (bound) | 141 |
| not cleared (contradicted) | 15 |
| unheld | 9 |
| certified (decided by a test) | 5 |
| certification partial / uncovered | 52 / 2 (all 54 `remainder: testable`) |
| `contradicts` | 21 (over 15 nodes) |
| `unstated` | 72 |
| `restates` | 155 |

### Classification of each `unheld` and `unstated`

Classified by two read-only general-purpose subagents (U01–U36 + H1–H9, and U37–U72), each told to grep the material and the specification and quote the material line or report no match. `Uxx` is the order of `unstated` in the record; `Hx` the order of `unheld`.

```
U01 | src/modules/ingestion/chunker/config.ts | analysis misread | D.md:39 reports "The lower soft bound, 1500, is never read by the chunking code" (also D.md:146), but no node or decision-log entry holds 1500.
U02 | src/modules/ingestion/chunker/config.ts | analysis misread | D.md:41 reports "The 200-code-point reading-tail constant is defined but not used by the chunker. No overlap is persisted with a chunk.", but no node holds it (the only 200 in the specification is the extraction tail).
U03 | src/modules/ingestion/chunker/v1.ts | analysis misread | D.md:35 reports "Lines end at `\n`. The terminator is not part of the line.", but email-header-block and email-quote-blocks use "blank line" without defining a line or a blank line (the zero-length blank test itself is not stated in the material).
U04 | src/modules/ingestion/dto/index.ts | analysis misread | B.md:70 reports "health takes no arguments and always answers ok:true. The health report is the result." (C.md:156 only notes the description exists), yet the specification holds nothing for health.
U05 | src/modules/ingestion/dto/index.ts | survey gap (C) | no match for "times out"/"re-send"/"keeps extracting"; C.md:156 says only that ingest_document has "a fixed description string".
U06 | src/modules/ingestion/dto/index.ts | analysis misread | C.md:105 reports "Fragment ids are a list of at least one UUID" (C.md:171 "fragment ids empty → schema rejection"), but proposal.md gives the cited fragments 0..* and no rule holds the minimum of one.
U07 | src/modules/ingestion/dto/index.ts | survey gap (C) | no match for "IMMEDIATELY"/"background"/"returns the run id"; C.md:156 names start_async_ingestion's description only as existing, and B.md:169 reports only that its schema is declared and never registered.
U08 | src/modules/ingestion/dto/ingest-raw-information.dto.ts | survey gap (C) | no match for "must be null"/"v1.0.0"; C.md:27 reports only "It accepts any string or null, and the schema puts no further limit on it."
U09 | src/modules/ingestion/dto/llm-run.dto.ts | analysis misread | A.md:43 reports "If rebuilding fails, the field is left out.", but affected-nodes-only-when-completed and the read-llm-run answer hold no exception for a failed lookup.
U10 | src/modules/ingestion/dto/llm-run.dto.ts | analysis misread | C.md:70 reports "a positive attempt count" (B.md:71 "attempts (at least 1)"), but domain/llm-run.md types attempts only as an integer.
U11 | src/modules/ingestion/dto/propose-attribute.dto.ts | analysis misread | C.md:113 reports that attribute fragment ids "follow the same rules as propose link" (C.md:105 "at least one UUID"), but the proposal node gives 0..* and no minimum is held.
U12 | src/modules/ingestion/dto/propose-attribute.dto.ts | survey gap (C) | no match for "half-open"/"[from, to)" in C.md (the only half-open in any material is D.md:24, about chunk offsets).
U13 | src/modules/ingestion/dto/propose-fragment.dto.ts | survey gap (C) | no match for "5-layer"/"Layer 1"/"five layers" in any material.
U14 | src/modules/ingestion/dto/propose-fragment.dto.ts | analysis misread | D.md:95 reports the prompt says "fragments are verbatim and at most 1000 characters" (C.md:92 gives only the length), but no node holds verbatim; "one assertion only" is in no material.
U15 | src/modules/ingestion/dto/propose-link.dto.ts | analysis misread | C.md:108 reports "The change hint defaults to `none`.", but the specification holds that default only for directed ingestion (directed-defaults).
U16 | src/modules/ingestion/dto/propose-link.dto.ts | analysis misread | C.md:105 reports "Fragment ids are a list of at least one UUID.", but proposal.md gives 0..* and no rule holds the minimum.
U17 | src/modules/ingestion/dto/propose-link.dto.ts | survey gap (C) | no match for "half-open"/"[from, to)" in C.md for validity intervals.
U18 | src/modules/ingestion/dto/propose-node.dto.ts | analysis misread | A.md:61 reports "All are recorded with the run id and duplicates are ignored.", but new-node-aliases and the matched-node alias rule do not hold the no-duplicate behaviour.
U19 | src/modules/ingestion/dto/propose-node.dto.ts | fact outside the 49 files | The names Person/Project/Document are catalog rows from migrations/seeds/0001_seed.sql, and B.md:29 reports the catalog is "read once, as a whole snapshot, from node_type, …" at runtime.
U20 | src/modules/ingestion/dto/raw-information.dto.ts | analysis misread | C.md:62 reports "A locator has four optional fields: page (integer or null), line (integer or null), speaker (string or null) and ts (string or null).", yet decision-log.md:35 records "The material names a chunk's locator without giving its shape."
U21 | src/modules/ingestion/dto/raw-information.dto.ts | analysis misread | C.md:57-59 report "the text" and "a non-negative start offset and a positive end offset" (D.md:24 names `[offset_start, offset_end)`), but raw-chunk holds excerpt/start_offset/end_offset and no positive bound.
U22 | src/modules/ingestion/mcp/directed-ingest.handler.ts | analysis misread | B.md:66 reports "A conversation pointer is passed on only when both conversation_id and message_id are strings; a partial pointer is dropped." (A.md:197 keys written include conversation_id, message_id), and no node mentions it.
U23 | src/modules/ingestion/mcp/directed-ingest.handler.ts | analysis misread | B.md:114 reports "ingest_directed — the service throws unexpectedly → isError `SYSTEM_INTERNAL_ERROR` ("Unexpected error during directed ingestion.", no details)", but the ingest-directed contract lists no such answer.
U24 | src/modules/ingestion/mcp/handler-base.ts | analysis misread | B.md:46 reports "A failure to write the audit row is swallowed. The caller still receives the original answer.", but every-proposal-audited states no exception.
U25 | src/modules/ingestion/mcp/handler-base.ts | analysis misread | B.md:107 reports "MCP propose_* — any other error → isError `SYSTEM_INTERNAL_ERROR` ("Internal error in MCP handler.", no details)", but the propose-* contract answers hold no system-failure answer.
U26 | src/modules/ingestion/mcp/ingest-document.handler.ts | analysis misread | B.md:55 reports "model is the caller's value or else the server's configured ingest model or else "claude-sonnet-4-6"", but no node holds a default model.
U27 | src/modules/ingestion/mcp/ingest-document.handler.ts | analysis misread | B.md:57 reports "the existing run's run_status (null when it cannot be read) and a message", but the contract's already_ingested answer holds neither the message nor the null status.
U28 | src/modules/ingestion/mcp/ingest-document.handler.ts | analysis misread | B.md:112 reports "`SYSTEM_INTERNAL_ERROR` ("Unexpected error during document ingestion.", details { llm_run_id, raw_information_id })", but the contract holds SYSTEM_INTERNAL_ERROR only "carrying the failed run".
U29 | src/modules/ingestion/mcp/ingest-document.handler.ts | analysis misread | B.md:109 reports "intake fails because the database is unavailable → isError `SYSTEM_SERVICE_UNAVAILABLE`", but SYSTEM_SERVICE_UNAVAILABLE appears nowhere in the specification.
U30 | src/modules/ingestion/mcp/ingest-document.handler.ts | analysis misread | B.md:110 reports "intake fails for any other reason → isError `SYSTEM_INTERNAL_ERROR` ("Failed to persist the document before extraction.", no details)", but the contract has no such answer.
U31 | src/modules/ingestion/mcp/ingest-toolset.ts | analysis misread | B.md:117 reports "the database is unavailable → isError `SYSTEM_SERVICE_UNAVAILABLE`; any other error → isError `SYSTEM_INTERNAL_ERROR`", but read-llm-run and list-recent-ingestions list only VALIDATION_INVALID_FORMAT and RESOURCE_NOT_FOUND.
U32 | src/modules/ingestion/mcp/ingest-toolset.ts | analysis misread | B.md:70 reports "health takes no arguments and always answers ok:true." (B.md:77 lists health among the registered tools), but no node holds health.
U33 | src/modules/ingestion/mcp/mcp-schemas.ts | analysis misread | B.md:70 reports "health takes no arguments and always answers ok:true. The health report is the result.", but the ingestion contract names no health operation.
U34 | src/modules/ingestion/mcp/mcp-schemas.ts | analysis misread | A.md:172 reports "a node given by id that is not active → report item `rejected`, `VALIDATION_INVALID_FORMAT` (node_id, reason `inactive`, current_status)" (A.md:190 "Pin rejection reasons: `not_found`, `inactive`"), but directed-pinned-node holds no refusal code (B.md has no match).
U35 | src/modules/ingestion/mcp/mcp-schemas.ts | analysis misread | B.md:169 reports "`StartAsyncIngestionMcpInputSchema` is declared … `registerIngestToolset` never reads the switch and registers no such tool", but the specification holds nothing about the declared, unregistered async operation.
U36 | src/modules/ingestion/mcp/mcp-schemas.ts | analysis misread | A.md:119 reports "metadata `{directed: true}` plus source_label, conversation_id and message_id when present" (B.md:61 gives only "source_label, optional, 1 to 200 characters"), but directed-ingestion holds source_label only as a string.
U37 | src/modules/ingestion/mcp/transport.ts | analysis misread | B.md reports it under "Outside the domain" as "Transport paths: POST /mcp/ingest", and no spec node holds "/mcp/ingest".
U38 | src/modules/ingestion/prompts/extraction.v1.ts | analysis misread | D.md reports "Every version uses a per-turn output ceiling of 8000 tokens", and the spec has no match for 8000 or max_tokens.
U39 | src/modules/ingestion/prompts/extraction.v1.ts | analysis misread | D.md has "links and attributes must cite fragment ids from the same chunk" and C.md has "Fragment ids are a list of at least one UUID", but the spec's only "at least one" rules cover directed ingestion and correction evidence.
U40 | src/modules/ingestion/prompts/extraction.v1.ts | fact outside the 49 files | The Person, Project and Document node types are seed catalog data (migrations/seeds/0001_seed.sql), and the prompt only shows them in a few-shot example (D.md: "Worked examples in the prompts (Ana/Zeus, Caio) are few-shot text").
U41 | src/modules/ingestion/prompts/extraction.v1.ts | fact outside the 49 files | The link types responsible_for, concerns and delivered_to and their requires_valid_from flags live in the seed catalog, and the prompt only repeats them in an example.
U42 | src/modules/ingestion/prompts/extraction.v1.ts | fact outside the 49 files | The Project `deadline` attribute key, its value type and its temporal flag are seed catalog data, and the prompt only uses the key in an example.
U43 | src/modules/ingestion/prompts/extraction.v2.ts | fact outside the 49 files | The Event node type and its event_date and end_date keys come from the seed catalog (§15.3), and the prompt only refers to them.
U44 | src/modules/ingestion/prompts/extraction.v2.ts | survey gap (D) | D.md only says "v2 adds event dating", with no match for event_date, "ALWAYS propose" or the value-versus-valid_from distinction.
U45 | src/modules/ingestion/prompts/extraction.v3.ts | fact outside the 49 files | event_type (not temporal), event_date and participates_in are seed catalog entries; D.md repeats "`event_type` is not temporal and takes no `valid_from`" as prompt text only.
U46 | src/modules/ingestion/prompts/extraction.v3.ts | analysis misread | D.md reports "`outro` is used only when nothing fits, with confidence at most 0.74", and the spec has no match for outro-as-event-type or 0.74.
U47 | src/modules/ingestion/prompts/extraction.v3.ts | analysis misread | D.md quotes the v3 rule under "Observed" ("With no known `document_date`, omit the date (the backend records `received`)"), and the spec has no match for relative or hoje.
U48 | src/modules/ingestion/prompts/extraction.v3.ts | fact outside the 49 files | The allowed event_type values are catalog data set by migrations/seeds/0003_event_type_taxonomy.sql, and the header comment only mentions them.
U49 | src/modules/ingestion/prompts/extraction.v4.ts | analysis misread | D.md reports "resolve relative dates against the document date (basis `document`), or else against the date part of received-at (basis `received`)", and the spec has no node for it.
U50 | src/modules/ingestion/repository/ingestion.repository.ts | fact outside the 49 files | The value attempts=1 is the DDL default in migrations/0001_init.sql, and D.md notes the fields "take the database's values".
U51 | src/modules/ingestion/routes/ingestion.routes.ts | analysis misread | B.md reports "REST under /raw-information and /llm-runs/:llmRunId/{run,retry,tool-calls,propose-*}", and the spec has no match for /api/v1 or raw-information/.
U52 | src/modules/ingestion/routes/ingestion.routes.ts | analysis misread | B.md reports "11 MiB body limit on POST raw-information", and the spec has no match for 11 MiB or bodyLimit.
U53 | src/modules/ingestion/service/affected-nodes.ts | analysis misread | A.md reports "Ids not found are skipped silently", but affected-nodes-of-a-run and affected-nodes-follow-merges hold no such exclusion.
U54 | src/modules/ingestion/service/directed-ingestion.service.ts | analysis misread | A.md reports "If the closed run cannot be read back, started_at and finished_at are the epoch and attempts is 1" and "a failure to close is swallowed", and the spec has no match for epoch.
U55 | src/modules/ingestion/service/directed-ingestion.service.ts | analysis misread | A.md reports "an attribute is keyed `<node_ref>.<key>` and a link `<source_ref>-><link_type>-><target_ref>`", and no spec node holds the key format.
U56 | src/modules/ingestion/service/directed-ingestion.service.ts | survey gap (A) | A.md reports the empty-list fallback only for extraction.service.ts ("If resolving affected nodes fails, the answer carries an empty list"); nothing reports it for directed ingestion.
U57 | src/modules/ingestion/service/directed-ingestion.service.ts | analysis misread | A.md reports "intake fails with the database unavailable → `SYSTEM_SERVICE_UNAVAILABLE`; any other intake failure → `SYSTEM_INTERNAL_ERROR`", and the spec has no match for SYSTEM_SERVICE_UNAVAILABLE.
U58 | src/modules/ingestion/service/directed-ingestion.service.ts | analysis misread | A.md reports "metadata `{directed: true}` plus source_label, conversation_id and message_id when present", and no node holds these metadata keys.
U59 | src/modules/ingestion/service/directed-ingestion.service.ts | analysis misread | A.md reports "Keys written: `directed`, `source_label`, `conversation_id`, `message_id`", but directed-turn-is-original-input covers only the excerpt, and the spec has no match for conversation_id.
U60 | src/modules/ingestion/service/directed-ingestion.service.ts | analysis misread | A.md reports "`RESOURCE_NOT_FOUND` (node_id, reason `not_found`)" and "`VALIDATION_INVALID_FORMAT` (node_id, reason `inactive`, current_status)", but directed-pinned-node states no codes.
U61 | src/modules/ingestion/service/entity-resolution.service.ts | analysis misread | A.md reports "Resolution runs under a transaction-scoped advisory lock keyed on node-type id + `\x1F` + norm(name)", and the spec has no match for advisory.
U62 | src/modules/ingestion/service/extraction.service.ts | analysis misread | A.md reports "After 64 turns it finishes softly", and no node holds the turn cap (only model-refusal-skips-chunk exists).
U63 | src/modules/ingestion/service/extraction.service.ts | analysis misread | A.md reports "A response with no tool use finishes it", and no node holds this.
U64 | src/modules/ingestion/service/extraction.service.ts | analysis misread | A.md reports under "Outside the domain": "Anthropic timeout (5 min), maxRetries 2", and the spec has no match for timeout or retries.
U65 | src/modules/ingestion/service/extraction.service.ts | analysis misread | A.md reports "extraction tool dispatch — unknown tool name → `VALIDATION_INVALID_FORMAT` (tool_name)", and the spec has no match for an unknown tool.
U66 | src/modules/ingestion/service/graph-consolidation.service.ts | analysis misread | A.md reports "retried once. A second hit refuses", but the ingestion contract lists no such refusal for propose-link or propose-attribute and no node holds the retry count.
U67 | src/modules/ingestion/service/graph-consolidation.service.ts | analysis misread | A.md reports for correction "The outcome is `accepted`, with the superseded id", but correction-replaces states no outcome.
U68 | src/modules/ingestion/service/llm-run.service.ts | analysis misread | A.md reports "If rebuilding fails, the field is left out", but affected-nodes-only-when-completed does not cover omission on failure.
U69 | src/modules/ingestion/service/propose-link.service.ts | analysis misread | A.md reports "plus `superseded_link_id` when consolidation superseded a row" and "The outcome is `accepted`, with the superseded id", but the contract shows the superseded id only with superseded_previous.
U70 | src/modules/ingestion/validation/errors.ts | analysis misread | C.md lists "Validation failure code: `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`…", but VALIDATION_OUT_OF_RANGE appears only in the retrieval contract.
U71 | src/modules/ingestion/validation/errors.ts | analysis misread | C.md lists "`VALIDATION_REQUIRED_FIELD`" among the declared codes, and the spec has no match for VALIDATION_REQUIRED_FIELD.
U72 | src/modules/ingestion/validation/graph-rules.ts | fact outside the 49 files | The size of the link-type-rule set is seed data in migrations/seeds/0001_seed.sql, and the comment only refers to it; C.md has no match for "22".
H1 | domain/knowledge-base/accepted-fragment-filter | fact outside the 49 files | The node was created in b8875e7 "first increment from query-retrieval source survey" (2b3f704 only changed llm_run to a reference); the accepted-fragment listing lives in the query-retrieval module, and the ingestion material has no match for "accepted-fragment".
H2 | domain/knowledge-base/knowledge-link | fact outside the 49 files | The node was created in b8875e7 from the query-retrieval survey, and its entity shape (status, validity, supersedes) is the knowledge_link table and knowledge_link_resolved view in migrations/0001_init.sql; A.md:195 lists it only as "Tables written: … `knowledge_link`".
H3 | domain/knowledge-base/node-attribute | fact outside the 49 files | The node was created in b8875e7 from the query-retrieval survey, and its shape is the node_attribute table and node_attribute_resolved view in migrations/0001_init.sql; A.md:195 lists it only as "Tables written: … `node_attribute`".
H4 | rules/knowledge-base/one-current-attribute-per-functional-key | fact outside the 49 files | The node was taken from A.md:199 under "## Upstream artifacts" ("the constraint names `knowledge_link_current_dup_guard` and `node_attribute_current_dup_guard`"), and the guard is a unique index at migrations/0001_init.sql:411 (the disputed exemption was decided in decision-log.md:326).
H5 | rules/knowledge-base/one-current-attribute-per-value | fact outside the 49 files | The node was taken from A.md:94/199 ("current-row duplicate guard", `node_attribute_current_dup_guard`), whose (node_id, attribute_key_id, value) uniqueness is the index at migrations/0001_init.sql:411, not ingestion code.
H6 | rules/knowledge-base/one-current-link-per-functional-type | fact outside the 49 files | The node was taken from A.md:199 "Upstream artifacts" (`knowledge_link_current_dup_guard`), a unique index at migrations/0001_init.sql:454 (decision-log.md:316 added the disputed exemption).
H7 | rules/knowledge-base/one-current-link-per-target | fact outside the 49 files | The node was taken from A.md:94/199 (`knowledge_link_current_dup_guard`), whose (source, target, link_type) uniqueness is the index at migrations/0001_init.sql:454.
H8 | rules/knowledge-base/page-defaults | fact outside the 49 files | The node was created in b8875e7 from the query-retrieval survey (search and accepted-fragment page defaults of 20 and 0), which the query-retrieval module holds; the ingestion material has no match for a default of 20.
H9 | rules/knowledge-base/reception-time-is-recording-time | fact outside the 49 files | The node was taken from D.md:44 "The database assigns the identifier and the received-at timestamp.", and that assignment is `received_at timestamptz NOT NULL DEFAULT now()` at migrations/0001_init.sql:236.
```

**Tally.** Of the 72 `unstated`: 55 analysis misread, 8 survey gap (area C: 6 — U05, U07, U08, U12, U13, U17; area D: 1 — U44; area A: 1 — U56), 9 fact outside the 49 files (seed catalog or DDL defaults: U19, U40–U43, U45, U48, U50, U72). Of the 9 `unheld`: 9 fact outside the 49 files — four (H1 accepted-fragment-filter, H2 knowledge-link, H3 node-attribute, H8 page-defaults) are nodes the earlier query-retrieval adoption wrote and this analysis only changed, and five (H4–H7 the one-current guards, H9 reception time) are facts the material read as upstream artifacts that the migrations hold.

Two patterns stand out. Most analysis misreads are facts the material *did* report under "Outside the domain", "Upstream artifacts" or as transport/system-failure details (routes, body limit, SDK timeout, SYSTEM_* answers, health, metadata keys) that `/analyse` did not turn into nodes. The survey gaps concentrate in area C (DTO descriptions and comments the surveyor summarised as "a fixed description string").

### Tokens

Announced, then run: `telemetry.py --probe --since 2026-09-30T14:06:10Z .` (readable, 1 session, would write `siegard-telemetry/20260930T154849Z.json`), then `telemetry.py --since 2026-09-30T14:06:10Z .`:

```
window: 2026-09-30T14:06:10.000Z .. 2026-09-30T15:48:54.992Z (since named)
framework: 4.21.3 at /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.3
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable; 1 session(s) overlap the window
agents: 141 spawned (0 of them by another agent), 121 with a transcript, 1473397 output tokens, 10697.905s
sessions: 1 orchestrating, 254109 output tokens — never a subagent's, which the line above already carries
commands: 38 invoking this framework's scripts, 1 exiting non-zero
runs: 1 captured
commits: 2; uncommitted: 13
decisions added: 46 (baseline: commit 74dca464c9d15698e49ce27e983bc765360abb60)
notes standing: 0
unavailable: nothing
report: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260930T154854Z.json
```

Window 2026-09-30T14:06:10Z – 15:48:54Z; everything after 15:48:54 (this write-up) is outside it. Input figures are input + cache-creation + cache-read.

| group | agents | output tokens | input-side tokens | wall (s) |
|---|---:|---:|---:|---:|
| surveyors (step 1, 4 × general-purpose) | 4 | 68,432 | 1,151,621 | 613 |
| analysis (step 3, in the session: `analyse` skill span, 55 turns) | — | 118,461 | 16,269,349 | — |
| certification readers (step 4, 4 × general-purpose) | 4 | 28,945 | 1,580,602 | 363 |
| judges (step 5, `specification-conformance-reviewer`) | 52 run (+20 refused at launch, no transcript) | 1,232,677 | 24,215,727 | 7,615 |
| auditors (step 5, `coverage-auditor`) | 59 | 116,423 | 5,561,268 | 1,756 |
| classifiers (step 6, 2 × general-purpose) | 2 | 26,920 | 3,320,814 | 352 |
| orchestrating session (all steps, total) | 1 | 254,109 | 67,062,785 | — |

The orchestrating session's 254,109 split by skill span (a ceiling per skill; the owner's turns land in the spans): `analyse` 118,461 (step 3 and step 4, until `/reconcile` was invoked), `reconcile` 94,563 (steps 5 and 6), none 41,085 (steps 1–2). The analysis row above is that `analyse` span; the analysis ran no subagent of its own.

Judges: mean per judge 23,705 output / 465,687 input-side; mean per file (49 files, the 3 re-judges charged to their files) 25,157 output / 494,198 input-side. Per judge (output, input-side, wall, tool calls):

```
Judge catalog.ts                                19017    268369   110s   5
Judge chunker/config.ts                         18607    337376   104s  10
Judge chunker/v1.ts                             35572    563583   215s  18
Judge dto/index.ts                              28837    440587   176s  11
Judge ingest-raw-information.dto.ts             21388    781871   135s  18
Judge llm-run.dto.ts                            22493    538765   140s  16
Judge propose-attribute.dto.ts                  26334    529939   168s  13
Judge propose-fragment.dto.ts                   24943    336546   141s   9
Judge propose-link.dto.ts                       27088    707840   182s  15
Judge propose-node.dto.ts                       16810    408207   117s   9
Judge raw-information.dto.ts                    24569    419573   142s  11
Judge source-type.ts                             4098    592386   107s  14
Judge hash.ts                                   16677    248169    95s   6
Judge ingestion/index.ts                        17430    342305    96s   6
Judge directed-ingest.handler.ts                20277    702923   129s  16
Judge handler-base.ts                           23184    427403   147s  10
Judge ingest-document.handler.ts                20100    636421   125s  15
Judge ingest-toolset.ts                         19715    373639   122s   9
Judge mcp-schemas.ts                            37954   1339822   248s  28
Judge propose-attribute.handler.ts              26355    333584   176s   9
Judge affected-nodes.ts                         19462    666464   120s  14
Judge directed-ingestion.service.ts             38541    412415   239s   8
Judge propose-attribute.service.ts              33171    659646   225s  14
Judge propose-link.service.ts                   31879    465066   199s  14
Judge propose-node.service.ts                   19355    337801   117s   9
Judge propose.types.ts                          15380    415845    94s   9
Judge confidence.ts                             25349    434327   143s   9
Judge graph-rules.ts                            19580    470681   112s  12
Judge temporal.ts                               22313    350160   131s   7
Judge graph-consolidation.service.ts            28193    812867   185s  13
Judge extraction.service.ts                     31224    509901   187s  12
Judge ingestion.routes.ts                       28299    472715   170s   8
Judge entity-resolution.service.ts              24312    555976   148s  11
Judge ingestion.service.ts                      24795    260149   146s   6
Judge llm-run.service.ts                        25639    369854   183s   7
Judge llm-run.repository.ts                     28220    364717   169s   7
Judge ingestion.repository.ts                   31669    468942   192s  13
Judge propose-fragment.service.ts               18885    253985   109s   6
Judge structural.ts                             24412    410415   150s   8
Judge validation/errors.ts                      21141    438225   121s  11
Judge propose-fragment.handler.ts               20391    167000   121s   4
Judge propose-link.handler.ts                   21232    253440   139s   6
Judge propose-node.handler.ts                    6873    166507    55s   4
Judge mcp/transport.ts                          18455    602646   112s  13
Judge extraction.v1.ts                          45467    647443   264s  19
Judge extraction.v2.ts                          22889    422319   130s  12
Judge extraction.v3.ts                          27718    774988   167s  20
Judge extraction.v4.ts                          20059    525203   116s  12
Judge prompts/index.ts                          22732    171334   122s   5
Re-judge propose-node.handler.ts                16927    440064    98s  10
Re-judge propose.types.ts                       19454    415670   114s   9
Re-judge structural.ts                          27213    169654   162s   4
```
