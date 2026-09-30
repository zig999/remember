# Pilot results — adoption Phase 0, context `query-retrieval`

Runbook: `siegard-survey/pilot-query-retrieval/RUNBOOK.md`. Plugin: siegard 4.17.0 at
`/home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.17.0`.

## Step 1 — declare the project

Status: **not run — blocked, waiting on the human.**

`siegard-config` is not model-invocable: its `SKILL.md` frontmatter declares
`disable-model-invocation: true`, and the skill is absent from the session's invocable-skill list.
The binding rules forbid writing `siegard.json` by hand ("the project file only by
`/siegard-config`"), so the agent cannot perform this step.

Evidence:

```
$ ls /home/siegfriedneto/projects/eternal/siegard.json
ls: cannot access '/home/siegfriedneto/projects/eternal/siegard.json': No such file or directory

$ head -5 $P/skills/siegard-config/SKILL.md
---
name: siegard-config
description: Writes or updates siegard.json — ...
disable-model-invocation: true
effort: low
```

**Resolution:** the human then invoked `/siegard:siegard-config` with the runbook's values. It
created `siegard.json` (no file existed before; `git status --porcelain -- siegard.json` printed
nothing). Validator:

```
$ python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal
standard backend: declared none
specification_root: /home/siegfriedneto/projects/eternal/specification
target backend: /home/siegfriedneto/projects/eternal/backend
work_root: /home/siegfriedneto/projects/eternal/siegard-work
delivery_root: /home/siegfriedneto/projects/eternal/siegard-delivery
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
exit=0
```

Commit id: `929e3fad3e4b1ee7dfd56b3b16f3609bd96eff90` (made by the agent on the human's
instruction; pathspec `siegard.json siegard-survey/pilot-query-retrieval/`; 4 files, 341
insertions).

## Step 2 — first increment, source alone

Start instant: `2026-09-29T23:30:00Z`.

Invocation: `/siegard:analyse` — material `siegard-survey/pilot-query-retrieval/query-retrieval.md` only; project root `/home/siegfriedneto/projects/eternal`.
Pre-checks: `project.py` resolved `specification_root`; `git status --porcelain -- specification` printed nothing; the root was empty (first run, no situate step).

Context decision: one context, `knowledge-base`. The material says the records the module reads come from other modules and leaves open whether they are upstream contracts or another context's elements. The analysis made them elements of the same context: the vocabulary does not change at the module edge. This is logged (entry 2 below).

### Nodes created (69; all new — the root was empty)

```
constraints/llm-toolset-omits-fragment-listing
constraints/retrieval-is-read-only
constraints/retrieval-transports-answer-alike
contracts/knowledge-base/retrieval
domain/knowledge-base/_context
domain/knowledge-base/accepted-fragment-filter
domain/knowledge-base/assertion-flag
domain/knowledge-base/assertion-status
domain/knowledge-base/compliance-deletion
domain/knowledge-base/fragment-status
domain/knowledge-base/information-fragment
domain/knowledge-base/item-kind
domain/knowledge-base/knowledge-link
domain/knowledge-base/knowledge-node
domain/knowledge-base/link-type
domain/knowledge-base/node-alias
domain/knowledge-base/node-attribute
domain/knowledge-base/node-status
domain/knowledge-base/page
domain/knowledge-base/provenance
domain/knowledge-base/raw-chunk
domain/knowledge-base/raw-information
domain/knowledge-base/search-item
domain/knowledge-base/search-layer
domain/knowledge-base/search-query
domain/knowledge-base/source-type
rules/knowledge-base/alias-matching
rules/knowledge-base/chunk-layer-matches-current-chunks
rules/knowledge-base/chunk-match-never-surfaces
rules/knowledge-base/compliance-refusal-takes-precedence
rules/knowledge-base/empty-provenance-chain-refused
rules/knowledge-base/expanded-link-requires-provenance
rules/knowledge-base/expansion-decay
rules/knowledge-base/expansion-depth-bounds
rules/knowledge-base/expansion-follows-both-directions
rules/knowledge-base/expansion-restricted-to-named-link-types
rules/knowledge-base/expansion-starts-from-matched-nodes
rules/knowledge-base/fragment-layer-matches-accepted-only
rules/knowledge-base/item-flags
rules/knowledge-base/layer-weights
rules/knowledge-base/link-item-summary
rules/knowledge-base/link-types-ignored-without-expansion
rules/knowledge-base/listing-excludes-compliance-deleted
rules/knowledge-base/listing-holds-accepted-only
rules/knowledge-base/listing-one-entry-per-fragment
rules/knowledge-base/listing-order
rules/knowledge-base/listing-requires-a-filter
rules/knowledge-base/node-layer-matches-through-aliases
rules/knowledge-base/node-layer-skips-merged-and-deleted
rules/knowledge-base/node-surfaces-only-with-accepted-mention
rules/knowledge-base/page-defaults
rules/knowledge-base/page-limit-bounds
rules/knowledge-base/page-offset-non-negative
rules/knowledge-base/prose-matching
rules/knowledge-base/provenance-in-recording-order
rules/knowledge-base/provenance-refused-after-compliance-deletion
rules/knowledge-base/provenance-requires-accepted-fragment
rules/knowledge-base/search-keeps-compliance-deleted-sources
rules/knowledge-base/search-layer-outside-set-refused
rules/knowledge-base/search-option-defaults
rules/knowledge-base/search-query-length
rules/knowledge-base/search-query-must-parse
rules/knowledge-base/search-query-not-blank
rules/knowledge-base/search-ranking
rules/knowledge-base/search-total-before-pagination
rules/knowledge-base/temporal-filters-apply-to-expansion-only
rules/knowledge-base/uncertain-items-excluded-on-request
rules/knowledge-base/unknown-link-type-refused
scenarios/knowledge-base/stop-words-only-query
```

Plus `decision-log.md` (non-normative) and 6 projections.

### Count per class

| class | count |
|---|---|
| context (`_context`) | 1 |
| Domain Model element | 21 |
| Rule | 42 |
| Scenario | 1 |
| Contract | 1 |
| Architecture Constraint | 3 |

Elements by subtype: aggregate-root 7; entity 2; enumeration 7; value-object 5; 
Rules by subtype: invariant 22; policy 20; 

### Decision-log entries (13), by location

1. `domain/knowledge-base/_context.md` · `strategic` → **core**. Unstated: The material does not say whether the knowledge base is core, supporting or generic. Why: Tracing every answer back to its source is what the system exists for, and no off-the-shelf product does it.
2. `domain/knowledge-base/knowledge-node.md` · `type` → **aggregate-root in the same knowledge-base context, as every other record the retrieval reads**. Unstated: The material leaves open whether the records the retrieval reads, written by other modules, are upstream contracts or elements of another context. Why: The retrieval reads those records under the same names and meanings the rest of the system writes them with, so no translation marks a context boundary.
3. `domain/knowledge-base/raw-information.md` · `relationships.raw-chunk.cardinality` → **1..***. Unstated: The material does not say whether a raw information can hold no chunk. Why: Every fragment is attributed to a chunk of its raw information, so a raw information without a chunk would yield nothing to read.
4. `domain/knowledge-base/knowledge-node.md` · `relationships.node-alias.cardinality` → **1..***. Unstated: The material does not say whether a knowledge node can have no alias. Why: The node layer reaches a node only through its aliases, so a node without one could never be found.
5. `domain/knowledge-base/raw-information.md` · `attributes.metadata.type` → **string**. Unstated: The material names a raw information's metadata without giving its shape. Why: The retrieval only passes the metadata through to the owner and reads nothing inside it.
6. `domain/knowledge-base/information-fragment.md` · `attributes.llm_run.type` → **string**. Unstated: The material names the LLM run a fragment came from only as a filter and a listed field. Why: The retrieval uses the run only as an identifier to filter by and to show, and reads nothing else about it.
7. `domain/knowledge-base/raw-chunk.md` · `attributes.locator.type` → **string**. Unstated: The material names a chunk's locator without giving its shape. Why: The retrieval only passes the locator through to the owner.
8. `rules/knowledge-base/listing-excludes-compliance-deleted.md` · `consistency` → **eventual**. Unstated: The material does not say how this read holds across the separate records it combines. Why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
9. `rules/knowledge-base/listing-one-entry-per-fragment.md` · `consistency` → **eventual**. Unstated: The material does not say how this read holds across the separate records it combines. Why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
10. `rules/knowledge-base/listing-order.md` · `consistency` → **eventual**. Unstated: The material does not say how this read holds across the separate records it combines. Why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
11. `rules/knowledge-base/node-surfaces-only-with-accepted-mention.md` · `consistency` → **eventual**. Unstated: The material does not say how this read holds across the separate records it combines. Why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
12. `rules/knowledge-base/prose-matching.md` · `consistency` → **eventual**. Unstated: The material does not say how this read holds across the separate records it combines. Why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
13. `rules/knowledge-base/search-keeps-compliance-deleted-sources.md` · `consistency` → **eventual**. Unstated: The material does not say how this read holds across the separate records it combines. Why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

### Watch items (tensions with no case both nodes decide differently)

1. **Compliance-deleted sources, three answers.** `search-keeps-compliance-deleted-sources` (search shows them) vs `listing-excludes-compliance-deleted` (the list hides them) vs `provenance-refused-after-compliance-deletion` (the provenance reads refuse them). These are different operations, so no single case gets two different answers. But the business stance is inconsistent, and the material leaves it to step 6 (documentation). The rule records what the code does now, nothing more.
2. **Fragment status, 4 vs 5 values.** The material says the provenance answer's TypeScript type lists 4 values (no `superseded`), while the database lists 5. `fragment-status` was written with the database's 5. The provenance read only serves accepted fragments, so no case is decided today.
3. **Chunk-match collapse count, not recorded.** The material says chunk matches "only count how many chunks a matched fragment already covers" (`dedupCollapsedCount`). It doesn't say where the owner sees that count, so no rule or answer holds it. Only "never surfaces" was recorded (`chunk-match-never-surfaces`).
4. **Refusal answers left out for three DTO rules.** `search-query-length`, `search-query-not-blank` and `listing-requires-a-filter` are refused, but the material states no code or status for them. `contracts/knowledge-base/retrieval` lists no answer for them, and none was invented.
5. **Rules at or past their class's p90 in `--shape`.** These are `compliance-refusal-takes-precedence`, `expansion-decay`, `item-flags`, `node-surfaces-only-with-accepted-mention`, `prose-matching` and `search-ranking`, plus the constraint `retrieval-transports-answer-alike`. Left as written: each statement is one condition, taken word for word from the material's formula or ordering. The material gives no worked example for any of them, so no scenario was invented.

### Cross-check changes made before the final validation

- **Overlap.** The original `search-expands-by-default` repeated the "expansion is on by default" clause of `search-option-defaults`. It is now `expansion-starts-from-matched-nodes`, and the default lives only in `search-option-defaults`.
- **Undecided precedence.** Case: a fragment that is not accepted and whose source was deleted for compliance. The material says the compliance check runs "before anything else" (`findTombstone`). So the precedence rule became `compliance-refusal-takes-precedence`, which covers every refusal and not only the empty chain. This is read from the material, not decided, so no log entry.
- Prose that held obligations or argued with sibling nodes was cut, in 4 rules and 1 element. The search-item answer content moved into the api's `accepted` answer.

### Code the increment may put in breach

This step never read `backend/`. The first rules come from a survey of the code, so they should match it. Nothing checks that until step 3's judges run.

### Validator final output (verbatim)

```
$ python3 -B $P/bin/spec.py specification
specification sound: 21 element(s), 42 rule(s), 1 scenario(s), 1 contract(s), 3 constraint(s) across 1 context(s); 13 decision(s) disclosed
exit=0

$ python3 -B $P/bin/spec.py --project specification
specification sound: 21 element(s), 42 rule(s), 1 scenario(s), 1 contract(s), 3 constraint(s) across 1 context(s); 13 decision(s) disclosed
projected 6 file(s) into specification/projections: capability-map.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md
```

First full validation, before the fixes: exit 1, 6 problems. Each was «immediate across an aggregate boundary is a validation error», on `listing-excludes-compliance-deleted`, `listing-one-entry-per-fragment`, `listing-order`, `node-surfaces-only-with-accepted-mention`, `prose-matching` and `search-keeps-compliance-deleted-sources`. Fix: `consistency: eventual`, disclosed as log entries 8–13.

Process note: the nodes were written by one generator script (`/tmp/pilot-gen/gen.py`, not in the repo), not by one tool call per file.

End instant: `2026-09-29T23:36:07Z`.

Commit id: `b8875e769de25974c2ae4833cf835f175532f8c1` (made by the agent on the human's instruction; pathspec `specification`; 76 files, 2560 insertions).

## Step 3 — judges over the source, in a disposable clone

Clone: `git clone -q /home/siegfriedneto/projects/eternal /tmp/eternal-pilot` at HEAD `b8875e769de25974c2ae4833cf835f175532f8c1`.

Seed binding: node `rules/knowledge-base/alias-matching` (the first Rule in step 2's list), file `src/modules/query-retrieval/repository/fts-config.ts`. That file holds `FTS_NAME_CONFIG = "simple_unaccent_v1"`, the config the name layer uses: unaccent, no stemming.

```
$ python3 -B $P/bin/trace.py --bind backend specification rules/knowledge-base/alias-matching src/modules/query-retrieval/repository/fts-config.ts
bound rules/knowledge-base/alias-matching to 1 file(s) at /tmp/eternal-pilot/siegard-trace.json
  this binding rests on no record: --bind wrote what the caller stated, and the judgment behind it lives nowhere a reader can reopen. A delivery's record or a reconciliation is the recorded route — for a hand edit over bound source, /reconcile writes the same binding with the judgment kept. The trace carries no mark of the difference on rules/knowledge-base/alias-matching; this line is the only one
exit=0
$ git add siegard-trace.json && git commit -qm "pilot: seed trace (disposable)"   # 008038a3692534e40739d390da684863d07dfad2
```

Staging: the runbook's command, with `--review` followed by `--node <id>` once for each of the 69 nodes step 2 wrote. Output, verbatim:

```
staged pilot-qr: 15 file(s) to judge over 1 node(s); staged by a review — 0 pair(s) omitted as cleared by a judgment at these bytes, and 69 plan node(s) read on every file without being bound; 0 file(s) with nothing left to judge; 14 file(s) the trace binds nothing to, 14 of them judged over the plan's nodes alone
  manifest and packs at /tmp/eternal-pilot-ws; candidate index at /tmp/eternal-pilot-ws/candidates.txt
  save each delegation's return verbatim at /tmp/eternal-pilot/siegard-reconcile/pilot-qr.returns/<file path with '/' as '__'>.yaml
exit=0
```

Workspace sizes, in bytes (measurement c):

```
332 /tmp/eternal-pilot-ws/candidates.txt
76310 /tmp/eternal-pilot-ws/manifest.json
36489 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__dto__fragment.dto.ts.md
36489 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__dto__response.dto.ts.md
36483 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__dto__search.dto.ts.md
36456 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__index.ts.md
36492 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__mcp__query-toolset.ts.md
36561 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__repository__accepted-fragments.repository.ts.md
36504 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__repository__fts-config.ts.md
36537 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__repository__provenance.repository.ts.md
36495 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__repository__scoring.ts.md
36525 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__repository__search.repository.ts.md
36528 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__routes__query-retrieval.routes.ts.md
36543 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__service__accepted-fragments.service.ts.md
36483 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__service__errors.ts.md
36519 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__service__provenance.service.ts.md
36507 /tmp/eternal-pilot-ws/packs/src__modules__query-retrieval__service__search.service.ts.md
```

Each pack is 36,456–36,561 bytes (about 36 KB) and carries all 69 nodes. Staging assigned no node to any file: 14 of the 15 files are bound to nothing, so each is judged against all the plan's nodes. Sum of the 15 packs: 547611 bytes.

Judges start: `2026-09-29T23:39:41Z`.

Delegation: 15 `siegard:specification-conformance-reviewer` judges spawned in one message, one per file. Each got the resolved file path, its pack path, `/tmp/eternal-pilot-ws/candidates.txt`, the specification root `/tmp/eternal-pilot/specification`, and `$P/schemas/conformance-return.json`, all as paths, never contents.

Returns were saved verbatim to `/tmp/eternal-pilot/siegard-reconcile/pilot-qr.returns/<file with / as __>.yaml`. Each was extracted by script from the judge's final message, taking the text inside a ```yaml fence when there was one and the whole message otherwise. Nothing was reshaped. `--fold`, `--bind-record` and everything after them were **not run**.

Return sizes, in bytes:

```
17779 src__modules__query-retrieval__dto__fragment.dto.ts.yaml
15776 src__modules__query-retrieval__dto__response.dto.ts.yaml
16408 src__modules__query-retrieval__dto__search.dto.ts.yaml
12132 src__modules__query-retrieval__index.ts.yaml
18681 src__modules__query-retrieval__mcp__query-toolset.ts.yaml
14213 src__modules__query-retrieval__repository__accepted-fragments.repository.ts.yaml
1082 src__modules__query-retrieval__repository__fts-config.ts.yaml
17240 src__modules__query-retrieval__repository__provenance.repository.ts.yaml
10871 src__modules__query-retrieval__repository__scoring.ts.yaml
16692 src__modules__query-retrieval__repository__search.repository.ts.yaml
14057 src__modules__query-retrieval__routes__query-retrieval.routes.ts.yaml
12075 src__modules__query-retrieval__service__accepted-fragments.service.ts.yaml
13136 src__modules__query-retrieval__service__errors.ts.yaml
13249 src__modules__query-retrieval__service__provenance.service.ts.yaml
20253 src__modules__query-retrieval__service__search.service.ts.yaml
```

Judges end: `2026-09-29T23:42:03Z`. The last return arrived about 2 min 22 s after the start. The slowest judge, `search.service.ts`, ran 109 s.

### Observations from the returns (not measurements the runbook asked for)

- **1 of 15 returns is not valid YAML:** `dto__fragment.dto.ts.yaml`, which contains `evidence: readonly llm_run_id: string;` unquoted. The `--fold` would refuse it, so this judge would have to be delegated again.
- **`domain/knowledge-base/_context`:** 12 of 15 judges left it out of `read` because the return contract's node pattern cannot spell a leading `_`. The other 3 listed it anyway: `accepted-fragments.service`, `scoring` and `search.repository`. This is a contract and pack inconsistency: `--stage` puts `_context` in every pack, but the return contract cannot name it.
- **`fts-config.ts` returned only 2 of 69 nodes in `read`.** Every other judge returned 68 or 69.
- **One misspelled identity:** the `scoring.ts` judge wrote `rules/knowledge-base/stop-words-only-query` in `read`. The node is `scenarios/knowledge-base/stop-words-only-query`.
- **Output format varied:** 5 of 15 returns came fenced in ```yaml and 10 came as bare YAML.

## Step 4 — count the returns

The runbook's script, verbatim, fails on the unparseable return:

```
  in "<unicode string>", line 47, column 34:
        evidence: readonly llm_run_id: string;
                                     ^
exit=1
```

Variant run: the same counting logic with a `try` that reports the unparseable file (A). A second pass (B) quotes, **in memory only**, any `evidence:`/`held_at:` scalar that contains `: `. The saved return is untouched. Output, verbatim:

```
== A: unparseable return skipped
skipped (unparseable): ['src__modules__query-retrieval__dto__fragment.dto.ts.yaml']
per file: {'dto__response.dto.ts.yaml': {'held': 12, 'findings': 3, 'candidates_opened': 0}, 'dto__search.dto.ts.yaml': {'held': 14, 'findings': 3, 'candidates_opened': 0}, 'index.ts.yaml': {'held': 0, 'findings': 0, 'candidates_opened': 0}, 'mcp__query-toolset.ts.yaml': {'held': 5, 'findings': 7, 'candidates_opened': 0}, 'repository__accepted-fragments.repository.ts.yaml': {'held': 13, 'findings': 1, 'candidates_opened': 0}, 'repository__fts-config.ts.yaml': {'held': 2, 'findings': 0, 'candidates_opened': 0}, 'repository__provenance.repository.ts.yaml': {'held': 11, 'findings': 4, 'candidates_opened': 0}, 'repository__scoring.ts.yaml': {'held': 3, 'findings': 1, 'candidates_opened': 0}, 'repository__search.repository.ts.yaml': {'held': 26, 'findings': 2, 'candidates_opened': 0}, 'routes__query-retrieval.routes.ts.yaml': {'held': 19, 'findings': 0, 'candidates_opened': 0}, 'service__accepted-fragments.service.ts.yaml': {'held': 8, 'findings': 0, 'candidates_opened': 0}, 'service__errors.ts.yaml': {'held': 13, 'findings': 2, 'candidates_opened': 0}, 'service__provenance.service.ts.yaml': {'held': 14, 'findings': 1, 'candidates_opened': 0}, 'service__search.service.ts.yaml': {'held': 39, 'findings': 6, 'candidates_opened': 0}}
findings by kind: {'contradicts': 19, 'unstated': 11}
nodes held in no file: 2 ['rules/knowledge-base/listing-requires-a-filter', 'rules/knowledge-base/stop-words-only-query']
nodes held in >=1 file: 68
== B: unparseable return quoted in memory (saved file untouched)
skipped (unparseable): []
per file: {'dto__fragment.dto.ts.yaml': {'held': 10, 'findings': 5, 'candidates_opened': 0}, 'dto__response.dto.ts.yaml': {'held': 12, 'findings': 3, 'candidates_opened': 0}, 'dto__search.dto.ts.yaml': {'held': 14, 'findings': 3, 'candidates_opened': 0}, 'index.ts.yaml': {'held': 0, 'findings': 0, 'candidates_opened': 0}, 'mcp__query-toolset.ts.yaml': {'held': 5, 'findings': 7, 'candidates_opened': 0}, 'repository__accepted-fragments.repository.ts.yaml': {'held': 13, 'findings': 1, 'candidates_opened': 0}, 'repository__fts-config.ts.yaml': {'held': 2, 'findings': 0, 'candidates_opened': 0}, 'repository__provenance.repository.ts.yaml': {'held': 11, 'findings': 4, 'candidates_opened': 0}, 'repository__scoring.ts.yaml': {'held': 3, 'findings': 1, 'candidates_opened': 0}, 'repository__search.repository.ts.yaml': {'held': 26, 'findings': 2, 'candidates_opened': 0}, 'routes__query-retrieval.routes.ts.yaml': {'held': 19, 'findings': 0, 'candidates_opened': 0}, 'service__accepted-fragments.service.ts.yaml': {'held': 8, 'findings': 0, 'candidates_opened': 0}, 'service__errors.ts.yaml': {'held': 13, 'findings': 2, 'candidates_opened': 0}, 'service__provenance.service.ts.yaml': {'held': 14, 'findings': 1, 'candidates_opened': 0}, 'service__search.service.ts.yaml': {'held': 39, 'findings': 6, 'candidates_opened': 0}}
findings by kind: {'unstated': 15, 'contradicts': 20}
nodes held in no file: 1 ['rules/knowledge-base/stop-words-only-query']
nodes held in >=1 file: 69
```

### Nodes held in no file (measurement b)

- `rules/knowledge-base/stop-words-only-query` (A and B): **not a node.** It is the `scoring.ts` judge's misspelling of `scenarios/knowledge-base/stop-words-only-query`, which `errors.ts`, `search.repository.ts` and `search.service.ts` hold. This is a return defect, not a wrong node.
- `rules/knowledge-base/listing-requires-a-filter` (A only): an artifact of skipping the unparseable return. In B, `fragment.dto.ts` holds it (the `.refine` at lines 39–45). Not a wrong node.

Result: **0 wrong nodes, and 0 facts living outside the 15 files.** Every one of the 69 nodes is held in at least one of the 15 files. That includes `_context`, held by the 3 judges that listed it.

### Findings by attribution (supporting b; my reading of the returns, one line each)

The findings split between analysis defects, where the node misread or left out something, and real defects in the code that the node exposed.

There are 35 findings in pass B: 20 `contradicts`, 15 `unstated`. By where the defect sits:

| class | count | findings (file · node) |
|---|---|---|
| **Analysis misread (step 2)**: the node renamed or respelled a term the code uses | 3 | `response.dto` · `assertion-flag` (`low-confidence` vs wire `low_confidence`); `search.dto` and `query-toolset` · `search-query` (attributes `text`/`link_types` vs wire `query`/`expand_link_types`) |
| **Material (survey) gap or misread**: the fact is in code, but the survey left it out, placed it "outside the domain", or read it wrong | 18 | answers never given for blank, too-long, missing-filter, `.strict()` and the listing total (`fragment.dto` ×4, `errors`); the UUID format of filter ids; `original_input` `[REDACTED]` (`response.dto`, `provenance.repository`); fragment-status 4 vs 5 (`response.dto`, `provenance.repository`; already watch item 2); title read from `metadata->>'title'`; excerpt as an offset slice; chunk order inside provenance; MCP tool names (placed outside the domain); `PER_LAYER_FETCH_LIMIT` (placed outside the domain); expansion seeds only from *surfaced* nodes; a link item's `layer: "node"`; empty list treated as omitted; **compliance precedence** (`provenance.service`: the material said the tombstone check comes "before anything else", but for fragments the code refuses not-accepted first, so the node built on that reading is contradicted) |
| **Real code defect the node exposed**: behavior diverges from the fact stated | 6 | `search.service` · `search-total-before-pagination` (total capped by the 200-per-layer fetch); `search.service` · `expansion-decay` (score taken from the link's endpoint, 0 at hop ≥2); `search.repository` · `search-ranking` (node-layer tie-break by canonical name before the cut); `search.dto` · `search-layer-outside-set-refused` and `unknown-link-type-refused` (an empty string gets a different code); `fragment.dto` · `information-fragment` (`llm_run_id` non-null) |
| **Prose second home**: a comment or tool description restates a node's fact | 8 | `query-toolset` ×5 (layers, depth 1..3, max 100, 410, 404-if-not-accepted); `scoring` (a comment claims chunks surface); `search.repository` (a comment claims deleted content never comes back); `errors` ("1000" in the message) |

`candidates_opened` was 0 in every return: no judge used the candidate index.

## Step 5 — tokens

Probe:

```
$ python3 -B $P/bin/telemetry.py --probe /home/siegfriedneto/projects/eternal
usage: telemetry.py [-h] --since ISO-8601|last [--until ISO-8601]
                    [--transcripts DIR] [--probe]
                    project_root
telemetry.py: error: the following arguments are required: --since
exit=2
```

The runbook's probe command omits `--since`, and the script requires it even with `--probe`. Rerun with `--since`:

```
$ python3 -B $P/bin/telemetry.py --probe --since 2026-09-29T23:30:00Z /home/siegfriedneto/projects/eternal
window: 2026-09-29T23:30:00.000Z .. 2026-09-29T23:43:10.680Z (since named)
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable
sessions overlapping the window: 1
  b98db2cd-856a-4c3b-9f94-230993ab7de6: 253 entries, 1 human turns, working directories /home/siegfriedneto/projects/eternal, /home/siegfriedneto/projects/eternal/siegard-survey
what leaves the transcripts: agent types, descriptions, token counts, timestamps, and the command lines that invoked this framework's scripts — no message text
would write: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260929T234310Z.json
exit=0
```

Read announced to the human in the session, then run:

```
$ python3 -B $P/bin/telemetry.py --since 2026-09-29T23:30:00Z /home/siegfriedneto/projects/eternal
window: 2026-09-29T23:30:00.000Z .. 2026-09-29T23:43:27.898Z (since named)
framework: 4.17.0 at /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.17.0
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable; 1 session(s) overlap the window
agents: 15 spawned (0 of them by another agent), 15 with a transcript, 146064 output tokens, 905.21s
sessions: 1 orchestrating, 260514 output tokens — never a subagent's, which the line above already carries
commands: 16 invoking this framework's scripts, 1 exiting non-zero
runs: 0 captured
commits: 2; uncommitted: 10
decisions added: 13 (baseline: no commit before 2026-09-29T23:30:00.000Z holds specification/decision-log.md; every current entry is listed)
notes standing: 0
unavailable: nothing
report: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260929T234327Z.json
exit=0
```

(The `commands: … 1 exiting non-zero` is step 2's first `spec.py` validation, which exited 1 with 6 problems.)

### Per judge delegation (measurement a), from `siegard-telemetry/20260929T234327Z.json` → `agents[]`

Model: `claude-sonnet-5-5` for all 15. "in+cc+out" means input + cache-creation + output tokens. Cache reads are excluded, as the runbook specifies.

| judge | in | cache_creation | output | in+cc+out | tool calls | s |
|---|---|---|---|---|---|---|
| accepted-fragments.repository | 16 | 133647 | 8709 | 142372 | 5 | 58.753 |
| accepted-fragments.service | 10 | 105104 | 7902 | 113016 | 3 | 45.435 |
| errors.ts | 16 | 131120 | 8906 | 140042 | 5 | 55.571 |
| fragment.dto | 22 | 131224 | 10662 | 141908 | 7 | 62.503 |
| fts-config | 16 | 127105 | 2258 | 129379 | 5 | 12.693 |
| index.ts | 12 | 97924 | 6797 | 104733 | 4 | 38.262 |
| provenance.repository | 24 | 172292 | 12646 | 184962 | 8 | 78.066 |
| provenance.service | 16 | 112108 | 8886 | 121010 | 5 | 57.028 |
| query-toolset | 22 | 172500 | 12288 | 184810 | 7 | 76.878 |
| response.dto | 28 | 158910 | 10936 | 169874 | 10 | 68.312 |
| routes file | 12 | 90532 | 8657 | 99201 | 3 | 53.572 |
| scoring.ts | 22 | 149534 | 5871 | 155427 | 8 | 34.758 |
| search.dto | 16 | 134710 | 11696 | 146422 | 5 | 72.803 |
| search.repository | 18 | 183524 | 12848 | 196390 | 6 | 81.168 |
| search.service | 22 | 130378 | 17002 | 147402 | 8 | 109.408 |
| **total (15)** | 272 | 2030612 | 146064 | 2176948 | 89 | 905.21 |
mean per judged file (in+cc+out): 145130

Cache reads, excluded above: 3,945,604 across the 15 judges.

### Step 2 and step 3 apart

`telemetry.py` puts all of the orchestrating session's cost in the window under `skill_totals.analyse` (92 turns; output 259,651; cache_creation 454,103; cache_read 15,809,293). No Skill call came after `analyse`, so step 3's orchestration falls inside that skill's span. To separate the steps, I summed the session transcript's assistant-message `usage`, deduplicated by message id, split at the human turn `2026-09-29T23:39:00.661Z`. Counts only; no text was read.

```
step 2 (analyse): api_calls=14 tool_calls=16 input=28 cache_creation=82821 cache_read=1420862 output=43804 in+cc+out=126653
step 3-4 + step 5 so far (orchestrator): api_calls=31 tool_calls=42 input=68 cache_creation=143523 cache_read=6770069 output=23663 in+cc+out=167254
```

| | in+cc+out |
|---|---|
| **Step 2** (analyse, orchestrator only; no subagents) | **126,653** |
| **Step 3** (15 judges) | **2,176,948** |
| Step 3–5 orchestrator (staging, saving returns, counting, telemetry) | 167,254 |
| **Mean per judged file (judges only)** | **145,130** |

The telemetry's session output (260,514) is much higher than the deduplicated sum (43,804 + 23,663 = 67,467). My guess, not verified: `telemetry.py` sums `usage` once per transcript entry, and the harness writes one entry per content block, each repeating the message's `usage`. This is flagged for the maintainer. Treat the per-step figures above as the deduplicated reading.

## Step 6 — second increment, documentation

Start: `2026-09-29T23:52:56.078Z`. End: `2026-09-29T23:57:52.886Z`.

`/siegard:analyse` ran on the existing root `specification` (the pre-check `spec.py` passed, and `git status --porcelain -- specification` printed nothing). The material was only `remember-modelagem-v7.md` lines 727–797, 1062–1074 and 1260–1320, `docs/specs/domains/query-retrieval/query-retrieval.spec.md` and `docs/specs/domains/query-retrieval/back/query-retrieval.back.md`. The OpenAPI file was left out.

Validator, final output (verbatim):

```
specification sound: 21 element(s), 54 rule(s), 3 scenario(s), 1 contract(s), 5 constraint(s) across 1 context(s); 21 decision(s) disclosed
```

`--project`: `projected 6 file(s) into specification/projections: capability-map.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md`

### Nodes created (17)

| class | node |
|---|---|
| Rule | rules/knowledge-base/expansion-current-view |
| Rule | rules/knowledge-base/expansion-as-of-view |
| Rule | rules/knowledge-base/expansion-in-effect-only |
| Rule | rules/knowledge-base/expansion-skips-superseded-and-deleted-links |
| Rule | rules/knowledge-base/expansion-skips-deleted-nodes |
| Rule | rules/knowledge-base/expansion-reaches-merged-node-survivor |
| Rule | rules/knowledge-base/chunk-match-cites-its-fragment |
| Rule | rules/knowledge-base/chunk-offsets-count-code-points |
| Rule | rules/knowledge-base/listing-total-before-pagination |
| Rule | rules/knowledge-base/node-item-summary |
| Rule | rules/knowledge-base/fragment-item-summary |
| Rule | rules/knowledge-base/compliance-deletion-propagates |
| Rule | rules/knowledge-base/search-excludes-compliance-deleted-sources (replaces the removed node) |
| Constraint | constraints/retrieval-is-lexical-only |
| Constraint | constraints/retrieval-requires-owner-authentication |
| Scenario | scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing (scenario C11) |
| Scenario | scenarios/knowledge-base/listing-for-unknown-source-is-empty |

### Nodes changed (6, plus the decision log), measurement (e)

| node | change | corrected or named |
|---|---|---|
| domain/knowledge-base/knowledge-link | + `valid_from`, `valid_to` (date) | **added**: validity attributes the source reading did not capture, because expansion is delegated to knowledge-graph |
| domain/knowledge-base/knowledge-node | + relationship `merged-into` (reference 0..1) | **added**: this fact was missing, not wrong |
| domain/knowledge-base/search-item | provenance cardinality `0..*` → `1..*` | **corrected**: docs BR-13 says every item MUST carry at least one provenance entry |
| rules/knowledge-base/compliance-refusal-takes-precedence | compliance refusal comes first *except* against "fragment not accepted" | **corrected**: back-spec BR-16 orders not-found → not-accepted → 410 |
| constraints/retrieval-transports-answer-alike | "same `{ ok, result }` framing" → "same result and same error code" | **corrected**: docs say the envelope is REST-only and MCP uses `content`/`isError` |
| contracts/knowledge-base/retrieval | + 401 on every operation; + 422 for blank/too-long query, depth, as-of format, limit, offset, malformed identity, listing filter; 404 now names `RESOURCE_NOT_FOUND` | mostly **added** (refusals the source reading left out); the 404 code is **named** only |
| decision-log | 8 entries appended; 1 entry's location moved (see below) | — |

### Nodes removed (1)

- rules/knowledge-base/search-keeps-compliance-deleted-sources: **corrected** and replaced by `search-excludes-compliance-deleted-sources`, because v7 §11 and docs BR-08/BR-14 say deleted content never recirculates.

### Decision-log entries (this increment)

| location | field | decided |
|---|---|---|
| rules/…/search-excludes-compliance-deleted-sources.md | statement | search shows no fragment of a compliance-deleted source (conflict: step-2 source reading vs docs) |
| rules/…/compliance-refusal-takes-precedence.md | statement | compliance refusal comes first except against "not accepted" (conflict) |
| constraints/retrieval-transports-answer-alike.md | statement | same result and same code, framing not fixed (conflict) |
| domain/…/fragment-status.md | values | keep 5 values, including `superseded` (docs list 4; conflict kept in favour of the standing node) |
| domain/…/item-kind.md | values | node/link/fragment; v7 §14.3 lists `attribute`, and the domain doc excludes it (conflict) |
| domain/…/knowledge-link.md | attributes.valid_from.type | date |
| domain/…/knowledge-link.md | attributes.valid_to.type | date |
| rules/…/compliance-deletion-propagates.md | consistency | eventual |

**Deviation from append-only:** the step-2 entry `consistency` of the removed node had its `location` moved to the replacement node. The validator rejects an entry whose location does not resolve, and the decision (eventual) carries over unchanged.

### Watch items (tensions with no case decided)

- **Chunk excerpt base.** The docs slice the excerpt as `raw_chunk.text[offset_start:offset_end)`. The standing `raw-chunk` node describes the offsets as the chunk's position in the raw content, and slicing the chunk's own text by them would be wrong for any chunk not at offset 0. `chunk-offsets-count-code-points` records only the code-point and half-open facts, not the base.
- **Framing of contract answers.** `contracts/knowledge-base/retrieval` answers are written in REST framing (`{ ok: true, result }`, HTTP status), while the constraint now leaves MCP framing open.

### Material not recorded, and why

- FTS configuration names, layer weights as named constants, `websearch_to_tsquery`, SQL, indexes, transactions, logging and p95 budgets are implementation or performance details, which no class admits.
- From §11: redaction of the raw content with the hash preserved, the chunks' `deleted` status, and the `ComplianceDeletion` audit fields (what, why, counts). These are write-side facts of compliance. The model has no raw-chunk status or raw content attribute, so none of them was added.
- From §14.3: `get_node`, `traverse` and `get_history` are point reads that the domain doc says belong to knowledge-graph, which is outside this specification's scope.

## Step 7 — clean up

Step 6 committed as `74dca46` (specification + this file).

```
$ ls -d /tmp/eternal-pilot /tmp/eternal-pilot-ws
/tmp/eternal-pilot
/tmp/eternal-pilot-ws
$ rm -rf /tmp/eternal-pilot /tmp/eternal-pilot-ws
exit=0
$ ls -d /tmp/eternal-pilot /tmp/eternal-pilot-ws
ls: cannot access '/tmp/eternal-pilot': No such file or directory
ls: cannot access '/tmp/eternal-pilot-ws': No such file or directory
```

The disposable trace, the seed binding and the 15 judge returns are gone; their counts survive in steps 3–4 above.
