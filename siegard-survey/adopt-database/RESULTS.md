# Results — `migrations/` as a second target, adopted

`$P` = `/home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.23.0`

## Step 1 — preconditions

Gate: `siegard-survey/adopt-ingestion/RUNBOOK.md` is finished and committed — its RESULTS.md
covers steps 1–6, the last commit is `c0e4949 adopt(ingestion): reconciliation record, bindings
and telemetry (steps 5-6)`, and `git status --porcelain -- siegard-survey/adopt-ingestion` prints
nothing.

```
$ grep '"version"' $P/.claude-plugin/plugin.json
  "version": "4.23.0"
```

```
$ git status --porcelain -- specification backend migrations siegard-trace.json siegard-reconcile siegard.json
```
(printed nothing)

```
$ git ls-files migrations
migrations/0001_init.sql
migrations/0004_chat_persistence.sql
migrations/0005_chat_graph_view.sql
migrations/0006_original_input.sql
migrations/backup/README.md
migrations/backup/dump-schema.sh
migrations/backup/schema.sql
migrations/ops/truncate_ingested_data.sql
migrations/ops/truncate_ontology.sql
migrations/seeds/0001_seed.sql
migrations/seeds/0002_ontology_status_task.sql
migrations/seeds/0003_event_type_taxonomy.sql
```

Outcome: version 4.23.0 (≥ 4.23.0), `git status` empty — preconditions hold.

The area for step 3 (every tracked `.sql` except `ops/` and `backup/`), 7 files:
`0001_init.sql`, `0004_chat_persistence.sql`, `0005_chat_graph_view.sql`,
`0006_original_input.sql`, `seeds/0001_seed.sql`, `seeds/0002_ontology_status_task.sql`,
`seeds/0003_event_type_taxonomy.sql`.

## Step 2 — declare the target

The owner asked for `/siegard:siegard-config` to be invoked in this session. It updated the
existing `siegard.json`: declared `targets.database` = `"migrations"` and
`standard.database` = `null`; left `delivery_root`, `specification_root`, `standard.backend`,
`targets.backend`, `telemetry_root`, `work_root` untouched. The owner approved and asked for the
commit: `a50c915 config: declare migrations as target database (standard null)`.

```
$ python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal
standard backend: /home/siegfriedneto/projects/eternal/standards/backend-node-service.yaml
standard database: declared none
specification_root: /home/siegfriedneto/projects/eternal/specification
target backend: /home/siegfriedneto/projects/eternal/backend
target database: /home/siegfriedneto/projects/eternal/migrations
work_root: /home/siegfriedneto/projects/eternal/siegard-work
delivery_root: /home/siegfriedneto/projects/eternal/siegard-delivery
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
```
(exit 0) — both targets resolve.

```
$ python3 -B $P/bin/trace.py --untraced migrations
12 tracked file(s) under migrations: 0 bound, 12 no binding names
  0 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  12 unsurveyed: no binding and no adoption names it

directories by unsurveyed files:
    4  migrations
    3  migrations/backup
    3  migrations/seeds
    2  migrations/ops
  (--all lists every file)
```
(exit 0)

## Step 3 — the survey

Delegation: one `general-purpose` subagent, model opus. Deviation in *form*, not content: the
surveyor instructions (`siegard-survey/adopt-ingestion/domain-surveyor.md`, 4336 bytes) and the
context (`spec.py --digest specification`, 28815 bytes, saved to `/tmp/db-digest.txt`, first line
`specification sound: 42 element(s), 179 rule(s), 8 scenario(s), 2 contract(s), 8 constraint(s)
across 1 context(s); 66 decision(s) disclosed, 1 location(s) retired`) were handed by path, the
agent told to read each whole and treat the first as its instructions verbatim — not pasted into
the prompt. The SQL-comments paragraph was pasted verbatim. Target source root, the 7-file area
and the `files`-must-equal-area requirement were stated in the prompt.

Returned: 2026-09-30, one pass, no re-delegation (9 tool uses, 101366 subagent tokens, 143.7 s).
Saved verbatim — the final assistant text extracted programmatically from the agent's transcript —
as `material/database.md` (32267 characters).

Checks:
- Frontmatter present: `contract_version: siegard-survey/0-prototype`, `target: migrations`,
  `files`, `read_outside_area` (`/tmp/db-digest.txt` only — the context, not source).
- `files` equals the area: the 7 paths, exactly.
- The six sections, in the order `domain-surveyor.md` requires: `## Facts` (l.16),
  `## Answers` (l.227), `## Vocabularies` (l.250), `## Upstream artifacts` (l.263),
  `## Outside the domain` (l.271), `## Observed and not decided here` (l.280).

Counts the material states: 10 node types, 13 link types, 30 link-type rules, 19 attribute keys,
33 allowed values, 10 enumerations. Spot check: `Project.status_text` key seeded in
`seeds/0001_seed.sql:143`, its values in `seeds/0002_ontology_status_task.sql:88ff` — as stated.

Noted for the owner's reading (not edited — the material is saved verbatim): the last bullet of
"Observed and not decided here" says "Two keys seeded as temporal have `requires_valid_from =
false`" and then lists three (Person.email, Person.phone, Organization.website).

STOP — the owner reads the material before step 4.

## Step 4 — the analysis

`/siegard:analyse` invoked with `siegard-survey/adopt-database/material/database.md` as the material
and `/home/siegfriedneto/projects/eternal` as the project root. Plugin 4.23.0.

Preconditions inside the skill: `project.py` resolved `specification_root:
/home/siegfriedneto/projects/eternal/specification`; `git status --porcelain -- specification`
printed nothing; `spec.py specification` was sound before any write (`specification sound: 42
element(s), 179 rule(s), 8 scenario(s), 2 contract(s), 8 constraint(s) across 1 context(s); 66
decision(s) disclosed, 1 location(s) retired`).

Entry nodes for `--impact`: the 25 elements the material speaks to (raw-information, raw-chunk,
llm-run, tool-call, information-fragment, knowledge-node, node-alias, node-attribute,
knowledge-link, provenance, entity-match-review, compliance-deletion, node-type, link-type,
link-type-rule, attribute-key, source-type, fragment-status, node-status, assertion-status,
alias-kind, valid-from-basis, value-type, run-status, validation-outcome) plus all 8
`constraints/` nodes. Read set: 179 files (every element, every rule, the 8 constraints, the
decision log). Read: every element's frontmatter, every rule's statement, the constraints' statements, the
ingestion contract, the decision log's entries on the duplicate guards and on raw-information.

Context boundary: one new context, `chat` — the conversation records use "tool call" for any
tool the assistant used, not for a proposal's audit (decision logged on `domain/chat/tool-call.md`
`type`).

### Nodes created (61)

- `domain/chat/_context`
- `domain/chat/conversation`
- `domain/chat/graph-view`
- `domain/chat/message`
- `domain/chat/message-role`
- `domain/chat/tool-call`
- `domain/knowledge-base/allowed-value`
- `domain/knowledge-base/curation-action`
- `domain/knowledge-base/effective-status`
- `rules/chat/message-idempotency-key-unique`
- `rules/chat/tool-call-outlives-its-message`
- `rules/knowledge-base/alias-not-blank`
- `rules/knowledge-base/alias-unique-per-node`
- `rules/knowledge-base/allowed-document-types`
- `rules/knowledge-base/allowed-event-types`
- `rules/knowledge-base/allowed-project-statuses`
- `rules/knowledge-base/allowed-task-priorities`
- `rules/knowledge-base/allowed-task-statuses`
- `rules/knowledge-base/allowed-value-unique-per-key`
- `rules/knowledge-base/attribute-confidence-range`
- `rules/knowledge-base/attribute-key-unique-per-node-type`
- `rules/knowledge-base/attribute-never-supersedes-itself`
- `rules/knowledge-base/attribute-provenance-once-per-fragment`
- `rules/knowledge-base/attribute-start-has-basis`
- `rules/knowledge-base/attribute-validity-ordered`
- `rules/knowledge-base/catalog-attribute-keys`
- `rules/knowledge-base/catalog-link-type-rules`
- `rules/knowledge-base/catalog-link-types`
- `rules/knowledge-base/catalog-node-types`
- `rules/knowledge-base/chunk-offsets-ordered`
- `rules/knowledge-base/chunk-position-unique`
- `rules/knowledge-base/closed-attribute-keys`
- `rules/knowledge-base/compliance-deletion-tombstones`
- `rules/knowledge-base/effective-status`
- `rules/knowledge-base/end-on-change-link-types`
- `rules/knowledge-base/fragment-confidence-range`
- `rules/knowledge-base/in-effect-assertion`
- `rules/knowledge-base/link-confidence-range`
- `rules/knowledge-base/link-never-supersedes-itself`
- `rules/knowledge-base/link-provenance-once-per-fragment`
- `rules/knowledge-base/link-start-has-basis`
- `rules/knowledge-base/link-type-name-unique`
- `rules/knowledge-base/link-type-rule-window-ordered`
- `rules/knowledge-base/link-validity-ordered`
- `rules/knowledge-base/match-review-distinct-nodes`
- `rules/knowledge-base/match-review-pair-unique`
- `rules/knowledge-base/match-review-similarity-range`
- `rules/knowledge-base/merged-node-names-survivor`
- `rules/knowledge-base/multi-current-attribute-keys`
- `rules/knowledge-base/node-never-merged-into-itself`
- `rules/knowledge-base/node-type-name-unique`
- `rules/knowledge-base/one-canonical-alias`
- `rules/knowledge-base/run-finish-time-when-closed`
- `rules/knowledge-base/run-opens-with-one-attempt`
- `rules/knowledge-base/run-start-is-opening-time`
- `rules/knowledge-base/single-current-link-types`
- `rules/knowledge-base/source-status-active-or-deleted`
- `rules/knowledge-base/start-requiring-attribute-keys`
- `rules/knowledge-base/start-requiring-link-types`
- `rules/knowledge-base/temporal-attribute-keys`
- `rules/knowledge-base/temporal-link-types`

### Nodes changed (9 elements + decision log)

- `domain/knowledge-base/raw-information` — `+content` (string, required), `+status` (node-status, required), `+superseded_at` (datetime).
- `domain/knowledge-base/raw-chunk` — `excerpt` now required; `+status` (node-status, required).
- `domain/knowledge-base/information-fragment` — `+superseded_at` (datetime).
- `domain/knowledge-base/node-alias` — `+relationships: llm-run, reference, 0..1` (the run that created it).
- `domain/knowledge-base/node-attribute` — `+recorded_at` (datetime).
- `domain/knowledge-base/node-type` — `description` now required.
- `domain/knowledge-base/link-type` — `+label`, `+inverse_name`, `+description` (string, required); the four flags now required.
- `domain/knowledge-base/attribute-key` — `+description` (string); `allowed_values` retyped `string` → `allowed-value`.
- `domain/knowledge-base/compliance-deletion` — `+reason` (string, required), `+affected` (string).
- `decision-log` — 19 entries appended (pure append; `git diff` shows no removed line).

### Nodes removed

None. No log entry retired.

### Decision-log entries appended (19)

1. `domain/chat/_context.md` `strategic` → supporting.
2. `domain/chat/tool-call.md` `type` → entity of a separate `chat` context (two meanings of "tool call").
3. `rules/knowledge-base/source-status-active-or-deleted.md` `statement` → a source and its chunks are only active or deleted (schema admits all four node statuses).
4. `rules/knowledge-base/compliance-deletion-tombstones.md` `statement` → compliance deletion marks the source and chunks deleted and stamps supersession time on them, their fragments and every assertion it marks deleted.
5–10. `string` for structured documents with no shape given: `compliance-deletion.affected`, `curation-action.payload`, `chat/message.content`, `chat/tool-call.arguments`, `chat/tool-call.result`, `chat/graph-view.snapshot`.
11. `domain/knowledge-base/curation-action.md` `attributes.target_id.type` → string.
12. `domain/knowledge-base/curation-action.md` `type` → aggregate-root.
13. `domain/chat/conversation.md` `relationships.message.cardinality` → 0..*.
14. `domain/chat/conversation.md` `relationships.tool-call.cardinality` → 0..*.
15. (cross-check) `rules/knowledge-base/alias-not-blank.md` `statement` → the blank-alias refusal stands over new-node-aliases: a blank name records no node.
16. (cross-check) `rules/knowledge-base/alias-unique-per-node.md` `statement` → a name/alias whose normalized form the node holds is held once (vs new-node-aliases / matched-node-gains-only-aliases).
17. (cross-check) `rules/knowledge-base/alias-unique-per-node.md` `statement` → the normalized form is name-normalization's (every surrounding whitespace trimmed), not the schema's `btrim` (spaces only).
18–19. (cross-check) `rules/knowledge-base/{link,attribute}-provenance-once-per-fragment.md` `statement` → a re-affirmation citing a fragment already held adds no second provenance.

### Shape reading (`spec.py --shape --of <the 70 nodes written>`)

- 0 statements with more than one sentence; 0 expressions; 0 normative remarks about the specification; 0 names held nowhere; 0 bare names two nodes answer to; 0 prose naming siblings.
- At or past p90, left standing: the catalog rules (`catalog-node-types` 84w, `catalog-link-types` 82w, `catalog-link-type-rules` 134w, `catalog-attribute-keys` 86w, `allowed-event-types`/`-project-statuses`/`-task-statuses` ~54w) — each is one catalog table stated as one closed set; cutting it would drop rows. `compliance-deletion-tombstones` (62w) — one policy over one event. Elements `node-attribute` (115w) and `raw-information` (107w) — attribute lists, no prose added.
- Shared phrases, left standing: the link/attribute twins (`*-validity-ordered`, `*-start-has-basis`, `*-never-supersedes-itself`, `*-provenance-once-per-fragment`, `*-confidence-range`) — the validator refuses one invariant spanning both aggregates (tested in a scratch copy: "an invariant constrains inside one aggregate, and this one spans …"), and a policy with `eventual` would misstate a row condition. `link-type-rule-window-ordered` shares the interval phrase for the same reason. `alias-not-blank` shares its wording with `search-query-not-blank` (different subjects).

### Cross-check

Pairs opened: alias-not-blank × new-node-aliases / node-name-length; alias-unique-per-node × new-node-aliases / matched-node-gains-only-aliases / name-normalization; one-canonical-alias × new-node-aliases; *-provenance-once-per-fragment × consolidation-records-provenance / reaffirmation-consolidates; *-validity-ordered × succession-closing-date / succession-before-previous-start (consistent); run-finish-time-when-closed × closing-stamps-finish-time / retry-counts-attempts / llm-run-lifecycle (consistent); compliance-deletion-tombstones × compliance-deletion-propagates / current-assertion / chunk-layer-matches-current-chunks (consistent, no overlap: marking vs stamping); in-effect-assertion × expansion-in-effect-only (consistent). Four cases decided (entries 15–19).

Watch items (tension, no case decided differently):
- The schema's duplicate guards count a current row of any status, while the standing `one-current-attribute-per-value` / `one-current-link-per-target` exempt disputed ones (decided in an earlier increment). The schema is strictly stronger; no rule requires two equal current rows. Not reopened.
- `source-type` values: the node holds `meeting-minutes`, `article`, `transcript`, `other`; the schema's enum holds `ata`, `artigo`, `transcricao`, `outro` — the derived code form does not reproduce the stored one.
- "today" in `in-effect-assertion` / `effective-status` is the database session's `current_date`, so it follows the session's time zone.
- `effective-status` derives inactive from active only — an uncertain or disputed assertion that has ended keeps its status; a validity end in the future already makes an assertion not current.
- Event `event_type`'s `outro` has sort order 4, below the later values 5–9.
- Left out, as implementation: SQLSTATE answers (the conditions are held by the invariants), catalog `version` columns, `updated_at` triggers, the `value_date`/`value_number` generated columns and the composite value-type key, referential `ON DELETE NO ACTION`, JSON `{}` defaults, `storage_ref`'s absent use.

### What this increment may have put the delivered code in breach of

The analysis never reads the target. Possible breaches: the schema's `norm` keeps a leading/trailing tab or line break (entry 17); a blank node name reaches the store and fails there instead of being refused (entry 15); a re-affirmation re-citing a held fragment hits the provenance unique key (18–19); compliance deletion may not stamp supersession times nor mark the source/chunks deleted (entry 4 — the curation/compliance code is not adopted). The reconciliation is what discovers it.

### Candidates

`siegard-survey/adopt-database/candidates.txt` — 102 identities: the 70 nodes created or changed (minus `domain/chat/_context`) united with every element and enumeration under `domain/` (50, no `_context`); 50 `domain/` + 52 `rules/`.

### Validator's final output (verbatim)

```
$ python3 -B $P/bin/spec.py specification
specification sound: 50 element(s), 231 rule(s), 8 scenario(s), 2 contract(s), 8 constraint(s) across 2 context(s); 85 decision(s) disclosed, 1 location(s) retired
$ python3 -B $P/bin/spec.py --project specification
specification sound: 50 element(s), 231 rule(s), 8 scenario(s), 2 contract(s), 8 constraint(s) across 2 context(s); 85 decision(s) disclosed, 1 location(s) retired
projected 8 file(s) into specification/projections: capability-map.mmd, class-diagram-chat.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md, state-knowledge-base-llm-run.mmd
```

Handoff (the skill's): `/siegard:reconcile` as an adoption — target `database`, the 7 `.sql` files,
the candidates above, slug and outside left to the owner (the runbook fixes them in step 5).

Nodes were written by scripts under `/tmp/dbgen/` (frontmatter via PyYAML, decision-log entries
appended as text so existing entries stay byte-identical).

STOP — the owner reviews `git diff -- specification` and commits it.

## Step 5 — `/siegard:reconcile` as an adoption (plugin 4.23.0)

### Inputs

- target `database` (`migrations`), slug `adopt-database`, adoption.
- file set: `0001_init.sql`, `0004_chat_persistence.sql`, `0005_chat_graph_view.sql`, `0006_original_input.sql`, `seeds/0001_seed.sql`, `seeds/0002_ontology_status_task.sql`, `seeds/0003_event_type_taxonomy.sql`.
- candidates: the 102 identities of `candidates.txt`.
- outside: `backup/README.md`, `backup/dump-schema.sh`, `backup/schema.sql`, `ops/truncate_ingested_data.sql`, `ops/truncate_ontology.sql`.
- certifications: none. Standard `null`, so no mechanical tier and no run (step 3b skipped).

Situate: the specification sound (50 elements, 231 rules…, 85 decisions); `trace.py migrations` → `trace sound: 204 binding(s), 5 of them decided by a certified test, traced against specification`; the 7 files and `siegard-trace.json` clean; `siegard-reconcile/adopt-database.md` free.

Pre-stage `trace.py --check migrations` (exit 1): 14 findings, 12 `moved` — the 11 elements and `page-defaults` step 4 changed, bound in `backend/` — and 2 `code` on `backend/src/modules/query-retrieval/service/{accepted-fragments,provenance}.service.ts` (source-type). None on the file set.

Stage (`--stage … --adopt`, workspace `/tmp/tmp.zm3J8NhqiP`, not committed):

```
staged adopt-database: 7 file(s) to judge over 0 node(s); staged as an adoption — 102 candidate node(s) read on every file, each bound by the fold to the files that hold its fact; 5 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 7 file(s) the trace binds nothing to, 7 of them judged over the candidates alone
```

Pack size: 7 node packs of ~57 KB each (102 nodes each); candidate index empty apart from its header (no candidate was bound anywhere before).

### Judges run, and returns voided or refused

7 `siegard:specification-conformance-reviewer` delegations, one per file, all spawned together; 7 returned once, none voided, none re-delegated, none refused by the fold. Each return arrived fenced in ```yaml … ```; saved verbatim (final assistant text extracted from the transcript, fence stripped, nothing else touched), all `stop_reason: end_turn`, each with 102 `read` entries.

| file | findings | contradicts | unstated | restates | candidates opened | tokens | wall (s) | tools |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 0001_init.sql | 17 | 3 | 6 | 8 | 1 | 124,105 | 242 | 27 |
| 0004_chat_persistence.sql | 7 | 1 | 6 | 0 | 0 | 82,909 | 97 | 7 |
| 0005_chat_graph_view.sql | 0 | 0 | 0 | 0 | 0 | 68,750 | 44 | 3 |
| 0006_original_input.sql | 1 | 0 | 1 | 0 | 2 | 75,380 | 72 | 9 |
| seeds/0001_seed.sql | 2 | 0 | 2 | 0 | 0 | 82,780 | 111 | 5 |
| seeds/0002_ontology_status_task.sql | 4 | 0 | 1 | 3 | 0 | 75,853 | 77 | 5 |
| seeds/0003_event_type_taxonomy.sql | 1 | 0 | 0 | 1 | 0 | 72,988 | 61 | 3 |

(Tokens = the subagent total the harness reported per delegation.)

### Fold, reconciliation, bind (verbatim)

```
$ python3 -B $P/bin/trace.py --fold migrations /tmp/tmp.zm3J8NhqiP /tmp/tmp.zm3J8NhqiP/premise.yaml siegard-reconcile/adopt-database.md
folded adopt-database.md: 80 node(s) cleared, 4 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 18 candidate(s) no file of the set holds, listed under `unheld`
  next: trace.py --reconciliation siegard-reconcile/adopt-database.md

$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-database.md
adopt-database.md holds: 7 file(s), 80 node(s) the judgment cleared, 4 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 80 binding(s) from this record and none for domain/chat/conversation, rules/knowledge-base/alias-not-blank, rules/knowledge-base/alias-unique-per-node, rules/knowledge-base/source-status-active-or-deleted: a node without `encoded_at` is a node this form cannot bind.
```

`--bind-record migrations specification siegard-reconcile/adopt-database.md --workspace …` (exit 0), tail verbatim (the 80 `bound …` lines are in the session; each node's file count is in the record):

```
80 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-database.md
  this act leaves 2 binding(s) stale — a bind restamps only the nodes it was handed:
    domain/knowledge-base/source-type: backend/src/modules/query-retrieval/service/accepted-fragments.service.ts — carried forward from an earlier bind, and the file has since changed
    domain/knowledge-base/source-type: backend/src/modules/query-retrieval/service/provenance.service.ts — carried forward from an earlier bind, and the file has since changed
    each is a `code` drift finding on the next --check; a reconciliation over these paths is the route, whatever wrote the change
  4 node(s) of adopt-database.md the judgment did not clear, and this bind wrote none of them:
    domain/chat/conversation
    rules/knowledge-base/alias-not-blank
    rules/knowledge-base/alias-unique-per-node
    rules/knowledge-base/source-status-active-or-deleted
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
```

Observation: rebinding a node restamps its node digest for every file it is bound to. The 10 elements step 4 changed and that the backend already bound (`moved` before the bind) no longer report `moved`, although no backend file was re-read against their new text; only `accepted-fragment-filter` and `page-defaults` (not candidates of this record) still do.

Record: `siegard-reconcile/adopt-database.md`; returns: `siegard-reconcile/adopt-database.returns/` (7 files); no run.

## Step 6 — what it shows

### Trace commands (verbatim)

```
$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-database.md
adopt-database.md holds: 7 file(s), 80 node(s) the judgment cleared, 4 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 80 binding(s) from this record and none for domain/chat/conversation, rules/knowledge-base/alias-not-blank, rules/knowledge-base/alias-unique-per-node, rules/knowledge-base/source-status-active-or-deleted: a node without `encoded_at` is a node this form cannot bind.
(exit 0)

$ python3 -B $P/bin/trace.py --untraced migrations
12 tracked file(s) under migrations: 7 bound, 5 no binding names
  0 holds-nothing: judged by an adoption, which bound none of its candidates to it
  5 outside: kept outside an adoption's judgment
  0 unsurveyed: no binding and no adoption names it
(exit 0)

$ python3 -B $P/bin/trace.py --owed migrations
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  migrations/0001_init.sql
    rules/knowledge-base/alias-not-blank — found against in adopt-database.md
    rules/knowledge-base/alias-unique-per-node — found against in adopt-database.md
    rules/knowledge-base/source-status-active-or-deleted — found against in adopt-database.md
  migrations/0004_chat_persistence.sql
    domain/chat/conversation — found against in adopt-database.md

4 finding(s) no bind closed, over 2 file(s):
  4 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  4 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

99 unstated fact(s) the records name, over 43 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
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
  ... and 84 more; `--all` lists them
  each is the analysis's to close, through the node that gives the fact a home

174 place(s) the records name where text in the source restates a node's fact the code holds, over 48 file(s). The pair conforms and none is counted above:
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
  src/modules/ingestion/catalog/catalog.ts — `LinkTypeRuleRow` doc comment, lines 47-51 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `domainOf` docstring, lines 227-249 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `isLinkRuleActive` docstring, lines 265-270 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  ... and 159 more; `--all` lists them
  a comment is removed, never refreshed, and the file reconciled after
(exit 1)

$ python3 -B $P/bin/trace.py --convergence backend specification siegard-work
299 node(s) of specification; 261 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

258 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 6, contract 1, element 45, rule 200, scenario 6
3 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
    element 2, rule 1
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
38 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 1, element 3, rule 30, scenario 2

files under backend: 279 tracked, 60 bound, 219 no binding names (215 unsurveyed) — `--untraced` lists them

261 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 29 finding(s) past reconciliations left open and no bind closed (29 unseen, 0 covered, 0 reported); 19 pair(s) the records answer both ways; 99 unstated fact(s) the source states and no node holds; 174 place(s) text restates a node's fact; 50 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
(exit 0)

$ python3 -B $P/bin/trace.py --check migrations
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
domain/knowledge-base/accepted-fragment-filter: bound at sha256:1b25aa96d866d21eb71c4539179a67e630f7cd8e0a486ee55d569f750e61c48c, now sha256:a5d33ecf0d633813dfb40119cbdc8b4ca73ba5d8249039fc97b3156eb4a080db; the specification moved since this bind
rules/knowledge-base/page-defaults: bound at sha256:bb7cbf8a74e64bbfd13c556601f21c9e8ef07888fd30286e00c80acb609a0120, now sha256:4a1d00a6c819add84291f8236ccecd6f980bae2fd75b3571fb551f02212b3786; the specification moved since this bind
backend/src/modules/query-retrieval/service/accepted-fragments.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type
backend/src/modules/query-retrieval/service/provenance.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type

4 drift finding(s) over 261 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  2 moved: bound to a node whose text moved since the bind; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
(exit 1)

```

(`--owed` and `--convergence` truncate their own lists — `--all` prints them; the two `(exit 1)` are `--owed` and `--check` reporting open items.)

### Counts, from the record

- Candidates: 102 → **80 cleared** and bound, **4 not cleared** (all `contradicts`, none collateral), **18 `unheld`**.
- `contradicts`: **4**. `unstated`: **16**, over 5 files. `restates`: **12**, over 3 files.
- `--untraced migrations`: 7 bound, 5 outside, 0 unsurveyed, 0 holds-nothing — the file half of SPEC-005 R7 is complete for `migrations/`.

`unheld` (18) — every one a node the schema does not carry (request/read value objects and their enumerations, all bound in `backend/`): `accepted-fragment-filter`, `assertion-flag`, `change-hint`, `directed-ingestion`, `directed-item`, `directed-item-kind`, `directed-item-status`, `ingest-tool`, `item-kind`, `node-resolution`, `page`, `prompt-version`, `proposal`, `run-summary`, `search-item`, `search-layer`, `search-query`; and `rules/knowledge-base/compliance-deletion-tombstones`, which the `0001_init.sql` judge located in `backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts` (outside both adoptions so far) — so it is unbound in both targets.

### `contradicts` — where the schema and a node disagree

1. `rules/knowledge-base/alias-unique-per-node` × `0001_init.sql` `norm()` — node (via the decision logged in step 4): «The normalized form is the one name-normalization states, with every surrounding whitespace trimmed.»; schema: `RETURN lower(immutable_unaccent(regexp_replace(btrim(t), '\s+', ' ', 'g')));` — `btrim` trims only spaces, so `"\tSilva"` normalizes to `" silva"`.
2. `rules/knowledge-base/alias-not-blank` × `0001_init.sql` — node: «A node alias MUST NOT be empty once surrounding whitespace is trimmed.»; schema: `alias text NOT NULL CHECK (btrim(alias) <> '')` — an alias of only a tab or line break passes.
3. `rules/knowledge-base/source-status-active-or-deleted` × `0001_init.sql` — node: «A raw information's status and each of its raw chunks' status is active or deleted.»; schema: `status node_status NOT NULL DEFAULT 'active'` over `CREATE TYPE node_status AS ENUM ('active', 'needs_review', 'merged', 'deleted');`, the restriction only in the comment «Sem CHECK adicional: a aplicação é o gatekeeper (BR-12)».
4. `domain/chat/conversation` × `0004_chat_persistence.sql` — node attribute `rolling_summary`; schema column `summary_rolling text NULL`.

Items 1–3 are the breaches step 4 predicted (entries 3 and 17 of that step's log); item 4 is a naming choice the analysis made (`summary_rolling` → `rolling_summary`).

### `unstated` (16), by file

- `0001_init.sql` (6): `version` on `node_type`, `link_type`, `attribute_key`, `attribute_valid_value` (4 — left out as implementation in step 4); merged node must point at an ACTIVE survivor (comment only); `curation_action.reason` required on destructive actions (comment only).
- `0004_chat_persistence.sql` (6): title 1..200 (comment only); `stop_reason` vocabulary, assistant rows only (comment only); idempotency key non-null on user rows / null on assistant rows (comment only); `chat_message.created_at`; `chat_tool_call.created_at`; `tool_name` one of the 13 `query` tools (comment only).
- `0006_original_input.sql` (1): `COMMENT ON COLUMN … 'Null fora do chat'` — original input absent outside chat.
- `seeds/0001_seed.sql` (2): link-type descriptions (13 rows); attribute-key descriptions (16 rows).
- `seeds/0002_ontology_status_task.sql` (1): the 3 Task attribute-key descriptions.

Nine of the sixteen rest on comment text alone (the judges reported them as unstated rather than as evidence of behavior).

### `restates` (12)

`0001_init.sql` (8): tombstone prose (vs the backend compliance repository), `inactive` never stored, merged ⇔ merged-into, one canonical alias, validity interval, basis, provenance once per fragment (attribute and link). `seeds/0002_ontology_status_task.sql` (3): totals line (node types, attribute keys), Task-keys temporal comment. `seeds/0003_event_type_taxonomy.sql` (1): the event_type list/sort-order comment. Per the runbook's decision, applied migrations are **not edited**: these stay, listed in `--owed`.

### Nodes bound in both targets (23) — facts the schema and the code both hold

`domain/knowledge-base/`: alias-kind, attribute-key, compliance-deletion, entity-match-review, fragment-status, information-fragment, knowledge-link, knowledge-node, link-type, link-type-rule, llm-run, node-alias, node-attribute, node-status, node-type, provenance, raw-chunk, raw-information, run-status, source-type, tool-call, valid-from-basis, validation-outcome. All are elements/enumerations; no rule is bound in both — the backend's rules were written from proposal-time checks, the database's from row constraints. `source-type` cleared on `0001_init.sql` although the enum spells `ata`/`artigo`/`transcricao`/`outro` and the node `meeting-minutes`/`article`/`transcript`/`other` (the step-4 watch item): the judge did not report it.

`--check migrations` after the bind: 4 findings (2 `moved` — accepted-fragment-filter, page-defaults; 2 `code` — the two query-retrieval files on source-type), all in `backend/`, none on `migrations/`.

### Tokens

Announced, then run: `telemetry.py --probe --since 2026-09-30T15:50:00Z .` (readable; 2 sessions overlap), then `telemetry.py --since 2026-09-30T15:50:00Z .`:

```
window: 2026-09-30T15:50:00.000Z .. 2026-09-30T17:34:25.997Z (since named)
framework: 4.23.0 at /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.23.0
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable; 2 session(s) overlap the window
agents: 8 spawned (0 of them by another agent), 8 with a transcript, 134644 output tokens, 848.49s
sessions: 2 orchestrating, 90224 output tokens — never a subagent's, which the line above already carries
commands: 21 invoking this framework's scripts, 2 exiting non-zero
runs: 0 captured
commits: 3; uncommitted: 13
decisions added: 19 (baseline: commit 2b3f70453b1421eaa6d4c5001cd806b7517ad6b9)
notes standing: 0
unavailable: nothing
report: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260930T173425Z.json
```

| group | agents | subagent tokens (harness total) | wall (s) |
|---|---:|---:|---:|
| surveyor (step 3, general-purpose opus) | 1 | 101,366 | 144 |
| analysis (step 4, in the session) | — | — | — |
| judges (step 5, 7 × conformance reviewer) | 7 | 582,765 | 704 |

The telemetry line counts 8 agents / 134,644 output tokens / 848 s (output only); the table's figures are the per-delegation totals the harness reported. The window overlaps a second session (the telemetry names 2); the orchestrating figure (90,224 output tokens) is both. CLAUDE.md Rule 6's per-session budget (30k) was exceeded, as in the ingestion runbook.

## Step 7 — stop

STOP — the owner reviews and commits with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/adopt-database siegard-telemetry`.
