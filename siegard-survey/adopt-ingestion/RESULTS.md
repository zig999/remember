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
