# Results — adoption step 6, context `query-retrieval`

Plugin root: `/home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0` (`CLAUDE_PLUGIN_ROOT` was unset in the session shell; the path below is the project-scoped install of 4.19.0 per `~/.claude/plugins/installed_plugins.json`).

## Step 1 — preconditions

Start instant (UTC): `2026-09-30T11:00:11Z`

```
$ mkdir -p siegard-work
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/bin/project.py /home/siegfriedneto/projects/eternal
standard backend: declared none
specification_root: /home/siegfriedneto/projects/eternal/specification
target backend: /home/siegfriedneto/projects/eternal/backend
work_root: /home/siegfriedneto/projects/eternal/siegard-work
delivery_root: /home/siegfriedneto/projects/eternal/siegard-delivery
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
[exit 0]
$ grep '"version"' /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/.claude-plugin/plugin.json
  "version": "4.19.0"
[exit 0]
$ git status --porcelain -- specification backend siegard-trace.json siegard-reconcile
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/bin/trace.py --untraced backend
279 tracked file(s) under backend: 0 bound, 279 no binding names — no trace file at /home/siegfriedneto/projects/eternal/siegard-trace.json, so nothing has been bound yet
  0 holds-nothing: judged by an adoption, which bound none of its candidates to it
  0 outside: kept outside an adoption's judgment
  279 unsurveyed: no binding and no adoption names it

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
  (52 more directories; --all lists every file)
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/bin/trace.py --convergence backend specification siegard-work
84 node(s) of specification; no trace file at /home/siegfriedneto/projects/eternal/siegard-trace.json — nothing has been bound yet
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

0 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
0 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
84 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 5, contract 1, element 21, rule 54, scenario 3

files under backend: 279 tracked, 0 bound, 279 no binding names (279 unsurveyed) — `--untraced` lists them

Kept apart — the judged side, which no state above counts: 0 finding(s) past reconciliations left open and no bind closed (0 unseen, 0 covered, 0 reported); 0 pair(s) the records answer both ways; 0 unstated fact(s) the source states and no node holds; 0 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
```

Version 4.19.0 (≥ 4.19.0) and `git status` printed nothing: preconditions hold.

## Step 2 — the adoption

Invoked `/siegard:reconcile` as an adoption with the runbook's inputs. The skill's own commands, in order:

```
$ (cd backend && git status --porcelain -- <15 files> ../siegard-trace.json)
[exit 0, no output]
$ git -C backend rev-parse --show-toplevel
/home/siegfriedneto/projects/eternal
$ ls siegard-reconcile
ls: cannot access 'siegard-reconcile': No such file or directory
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/bin/spec.py specification
specification sound: 21 element(s), 54 rule(s), 3 scenario(s), 1 contract(s), 5 constraint(s) across 1 context(s); 21 decision(s) disclosed
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/bin/trace.py backend
no trace file: /home/siegfriedneto/projects/eternal/siegard-trace.json does not exist; nothing has been bound yet
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/bin/trace.py --check backend
no trace file: /home/siegfriedneto/projects/eternal/siegard-trace.json does not exist; nothing has been bound yet
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0/bin/trace.py --stage backend specification adopt-query-retrieval /tmp/tmp.5HI07U4HAn <the 15 files> --adopt --node <each of the 84 candidates in candidates.txt>
staged adopt-query-retrieval: 15 file(s) to judge over 0 node(s); staged as an adoption — 84 candidate node(s) read on every file, each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 15 file(s) the trace binds nothing to, 15 of them judged over the candidates alone
  manifest and packs at /tmp/tmp.5HI07U4HAn; candidate index at /tmp/tmp.5HI07U4HAn/candidates.txt
  save each delegation's return verbatim at /home/siegfriedneto/projects/eternal/siegard-reconcile/adopt-query-retrieval.returns/<file path with '/' as '__'>.yaml
```

No trace file exists; on an adoption that is not a stop (the adoption writes the first trace). Workspace `/tmp/tmp.5HI07U4HAn` (mktemp, uncommitted): 15 node packs of ~45 KB each (all 84 candidates), candidate index 215 bytes (header only — nothing is bound). Staging separated nothing under `mechanical` — step 3b (capture) is skipped.

Judges: 15 `siegard:specification-conformance-reviewer` delegations spawned together, one per file, at 2026-09-30T11:02:00Z.

### Judge returns (first wave, 15 delegations)

Each return was saved verbatim (the delegation's final text, extracted from its transcript by script) under `siegard-reconcile/adopt-query-retrieval.returns/`. Parse check is PyYAML `safe_load`; the fold's verdict is from the first `--fold`.

| file | bytes | parsed | fold |
|---|---|---|---|
| `src/modules/query-retrieval/index.ts` | 15319 | yes | accepted |
| `src/modules/query-retrieval/routes/query-retrieval.routes.ts` | 17558 | yes | accepted |
| `src/modules/query-retrieval/dto/fragment.dto.ts` | 15161 | yes | accepted |
| `src/modules/query-retrieval/dto/search.dto.ts` | 17231 | yes | accepted |
| `src/modules/query-retrieval/repository/scoring.ts` | 13549 | yes | accepted |
| `src/modules/query-retrieval/service/provenance.service.ts` | 16628 | yes | accepted |
| `src/modules/query-retrieval/repository/accepted-fragments.repository.ts` | 15859 | yes | accepted |
| `src/modules/query-retrieval/service/accepted-fragments.service.ts` | 18101 | no | refused |
| `src/modules/query-retrieval/service/errors.ts` | 21343 | yes | accepted |
| `src/modules/query-retrieval/repository/fts-config.ts` | 17632 | yes | accepted |
| `src/modules/query-retrieval/repository/provenance.repository.ts` | 16509 | yes | accepted |
| `src/modules/query-retrieval/dto/response.dto.ts` | 19553 | yes | accepted |
| `src/modules/query-retrieval/mcp/query-toolset.ts` | 21941 | yes | accepted |
| `src/modules/query-retrieval/repository/search.repository.ts` | 22105 | no | refused |
| `src/modules/query-retrieval/service/search.service.ts` | 24050 | yes | accepted |

First fold (refused whole):

```
$ python3 -B .../bin/trace.py --fold backend /tmp/tmp.5HI07U4HAn /tmp/tmp.5HI07U4HAn/premise.yaml siegard-reconcile/adopt-query-retrieval.md
cannot fold: src/modules/query-retrieval/repository/search.repository.ts: the return does not parse: while parsing a block mapping
  in "<unicode string>", line 33, column 5:
      - file: src/modules/query-retrieva ... 
        ^
expected <block end>, but found '<scalar>'
  in "<unicode string>", line 41, column 6:
         WHERE p.link_id = ANY($1::uuid[])
         ^
cannot fold: src/modules/query-retrieval/service/accepted-fragments.service.ts: the return does not parse: mapping values are not allowed here
  in "<unicode string>", line 75, column 61:
     ... ly counts, selects and maps rows: `const total = await countAcce ... 
                                         ^

2 problem(s); each names a delegation to run again with its prompt fixed — an unusable return is never repaired here, and a follow-up question to the delegation that already answered is not a fresh judgment.
[exit 1]
```

Causes, read from the saved text: `search.repository.ts` — a plain scalar continued across lines holding SQL; `accepted-fragments.service.ts` — a plain scalar containing `: ` (backtick-quoted code), and the same return also carries `kind: contradicks` (a misspelling outside the contract's enum). The two refused returns were moved, unchanged, to `siegard-survey/adopt-query-retrieval/refused-returns/` and each file was re-delegated to a fresh judge (never a follow-up to the first), with the prompt fixed to require block scalars for every free-text value and `kind` exactly from the enum. Re-delegated at 2026-09-30T11:04:18Z.

### Re-delegation (second wave, 2 delegations)

| file | bytes | parsed | fold |
|---|---|---|---|
| `src/modules/query-retrieval/service/accepted-fragments.service.ts` | 17378 | yes | accepted |
| `src/modules/query-retrieval/repository/search.repository.ts` | 20425 | yes | accepted |

**Judges run in total: 17** (15 first wave + 2 re-delegations). Refused by the fold: 2 (both unparseable). No judge was asked a follow-up question.

### Fold, validation, bind

```
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --fold backend /tmp/tmp.5HI07U4HAn /tmp/tmp.5HI07U4HAn/premise.yaml siegard-reconcile/adopt-query-retrieval.md
folded adopt-query-retrieval.md: 53 node(s) cleared, 31 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed
  next: trace.py --reconciliation siegard-reconcile/adopt-query-retrieval.md
[exit 0]
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --reconciliation siegard-reconcile/adopt-query-retrieval.md
adopt-query-retrieval.md holds: 15 file(s), 53 node(s) the judgment cleared, 31 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 53 binding(s) from this record and none for constraints/llm-toolset-omits-fragment-listing, constraints/retrieval-requires-owner-authentication, contracts/knowledge-base/retrieval, domain/knowledge-base/assertion-flag, domain/knowledge-base/assertion-status, domain/knowledge-base/fragment-status, domain/knowledge-base/knowledge-node, domain/knowledge-base/link-type, domain/knowledge-base/node-alias, domain/knowledge-base/raw-chunk, domain/knowledge-base/raw-information, rules/knowledge-base/chunk-match-never-surfaces, rules/knowledge-base/compliance-deletion-propagates, rules/knowledge-base/compliance-refusal-takes-precedence, rules/knowledge-base/empty-provenance-chain-refused, rules/knowledge-base/expansion-current-view, rules/knowledge-base/expansion-decay, rules/knowledge-base/expansion-depth-bounds, rules/knowledge-base/expansion-reaches-merged-node-survivor, rules/knowledge-base/expansion-skips-deleted-nodes, rules/knowledge-base/expansion-skips-superseded-and-deleted-links, rules/knowledge-base/listing-excludes-compliance-deleted, rules/knowledge-base/listing-order, rules/knowledge-base/page-limit-bounds, rules/knowledge-base/provenance-refused-after-compliance-deletion, rules/knowledge-base/provenance-requires-accepted-fragment, rules/knowledge-base/search-excludes-compliance-deleted-sources, rules/knowledge-base/search-layer-outside-set-refused, rules/knowledge-base/search-query-length, rules/knowledge-base/search-query-must-parse, rules/knowledge-base/search-ranking: a node without `encoded_at` is a node this form cannot bind.
[exit 0]
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --bind-record backend specification siegard-reconcile/adopt-query-retrieval.md --workspace /tmp/tmp.5HI07U4HAn
bound constraints/retrieval-is-lexical-only to 2 file(s)
bound constraints/retrieval-is-read-only to 2 file(s)
bound constraints/retrieval-transports-answer-alike to 2 file(s)
bound domain/knowledge-base/accepted-fragment-filter to 4 file(s)
bound domain/knowledge-base/compliance-deletion to 3 file(s)
bound domain/knowledge-base/information-fragment to 7 file(s)
bound domain/knowledge-base/item-kind to 2 file(s)
bound domain/knowledge-base/knowledge-link to 2 file(s)
bound domain/knowledge-base/node-attribute to 2 file(s)
bound domain/knowledge-base/node-status to 1 file(s)
bound domain/knowledge-base/page to 7 file(s)
bound domain/knowledge-base/provenance to 4 file(s)
bound domain/knowledge-base/search-item to 2 file(s)
bound domain/knowledge-base/search-layer to 4 file(s)
bound domain/knowledge-base/search-query to 4 file(s)
bound domain/knowledge-base/source-type to 5 file(s)
bound rules/knowledge-base/alias-matching to 2 file(s)
bound rules/knowledge-base/chunk-layer-matches-current-chunks to 1 file(s)
bound rules/knowledge-base/chunk-match-cites-its-fragment to 1 file(s)
bound rules/knowledge-base/chunk-offsets-count-code-points to 2 file(s)
bound rules/knowledge-base/expanded-link-requires-provenance to 1 file(s)
bound rules/knowledge-base/expansion-as-of-view to 1 file(s)
bound rules/knowledge-base/expansion-follows-both-directions to 1 file(s)
bound rules/knowledge-base/expansion-in-effect-only to 1 file(s)
bound rules/knowledge-base/expansion-restricted-to-named-link-types to 1 file(s)
bound rules/knowledge-base/expansion-starts-from-matched-nodes to 1 file(s)
bound rules/knowledge-base/fragment-item-summary to 1 file(s)
bound rules/knowledge-base/fragment-layer-matches-accepted-only to 1 file(s)
bound rules/knowledge-base/item-flags to 1 file(s)
bound rules/knowledge-base/layer-weights to 2 file(s)
bound rules/knowledge-base/link-item-summary to 1 file(s)
bound rules/knowledge-base/link-types-ignored-without-expansion to 1 file(s)
bound rules/knowledge-base/listing-holds-accepted-only to 1 file(s)
bound rules/knowledge-base/listing-one-entry-per-fragment to 1 file(s)
bound rules/knowledge-base/listing-requires-a-filter to 1 file(s)
bound rules/knowledge-base/listing-total-before-pagination to 2 file(s)
bound rules/knowledge-base/node-item-summary to 1 file(s)
bound rules/knowledge-base/node-layer-matches-through-aliases to 1 file(s)
bound rules/knowledge-base/node-layer-skips-merged-and-deleted to 1 file(s)
bound rules/knowledge-base/node-surfaces-only-with-accepted-mention to 2 file(s)
bound rules/knowledge-base/page-defaults to 2 file(s)
bound rules/knowledge-base/page-offset-non-negative to 2 file(s)
bound rules/knowledge-base/prose-matching to 2 file(s)
bound rules/knowledge-base/provenance-in-recording-order to 2 file(s)
bound rules/knowledge-base/search-option-defaults to 2 file(s)
bound rules/knowledge-base/search-query-not-blank to 2 file(s)
bound rules/knowledge-base/search-total-before-pagination to 2 file(s)
bound rules/knowledge-base/temporal-filters-apply-to-expansion-only to 1 file(s)
bound rules/knowledge-base/uncertain-items-excluded-on-request to 1 file(s)
bound rules/knowledge-base/unknown-link-type-refused to 2 file(s)
bound scenarios/knowledge-base/listing-for-unknown-source-is-empty to 2 file(s)
bound scenarios/knowledge-base/stop-words-only-query to 2 file(s)
bound scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing to 2 file(s)
53 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-query-retrieval.md
  31 node(s) of adopt-query-retrieval.md the judgment did not clear, and this bind wrote none of them:
    constraints/llm-toolset-omits-fragment-listing
    constraints/retrieval-requires-owner-authentication
    contracts/knowledge-base/retrieval
    domain/knowledge-base/assertion-flag
    domain/knowledge-base/assertion-status
    domain/knowledge-base/fragment-status
    domain/knowledge-base/knowledge-node
    domain/knowledge-base/link-type
    domain/knowledge-base/node-alias
    domain/knowledge-base/raw-chunk
    domain/knowledge-base/raw-information
    rules/knowledge-base/chunk-match-never-surfaces
    rules/knowledge-base/compliance-deletion-propagates
    rules/knowledge-base/compliance-refusal-takes-precedence
    rules/knowledge-base/empty-provenance-chain-refused
    rules/knowledge-base/expansion-current-view
    rules/knowledge-base/expansion-decay
    rules/knowledge-base/expansion-depth-bounds
    rules/knowledge-base/expansion-reaches-merged-node-survivor
    rules/knowledge-base/expansion-skips-deleted-nodes
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links
    rules/knowledge-base/listing-excludes-compliance-deleted
    rules/knowledge-base/listing-order
    rules/knowledge-base/page-limit-bounds
    rules/knowledge-base/provenance-refused-after-compliance-deletion
    rules/knowledge-base/provenance-requires-accepted-fragment
    rules/knowledge-base/search-excludes-compliance-deleted-sources
    rules/knowledge-base/search-layer-outside-set-refused
    rules/knowledge-base/search-query-length
    rules/knowledge-base/search-query-must-parse
    rules/knowledge-base/search-ranking
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
[exit 0]
```

Premise file (workspace, uncommitted) carried the title, the summary "adopted as it stands and did not change", target `backend`, and per file the change line "Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation."

End instant (UTC): `2026-09-30T11:06:03Z`

### The skill's report (verbatim)

> **File set, as given:** the 15 files under `src/modules/query-retrieval/` named in the runbook, target `backend`, as an adoption over the 84 candidates in `candidates.txt`, with nothing kept outside and no certifications.
>
> **Staging:** there was no trace file, so no file had bound nodes. All 15 files were "the trace binds nothing to" and were judged against the candidates only. 0 files had nothing left to judge, 0 pairs were omitted as current and unowed, nothing was orphaned, and nothing went to the mechanical tier. Step 3b (capture) was **skipped**: the staging separated no pair under `mechanical`.
>
> **Shape of the judgment:** one `siegard:specification-conformance-reviewer` delegation per file, spawned together (15). The fold refused two returns that did not parse as YAML (`repository/search.repository.ts`, `service/accepted-fragments.service.ts`). Each was re-delegated to a fresh judge with the prompt fixed, which makes 17 delegations. Nothing ran inline. `candidates_opened` was absent from every return.
>
> **What the judgment answered:** 53 candidates were cleared, each bound to the files whose judge read its fact there (`how` in the record carries each `held_at` and its quoted evidence). 31 were not cleared:
> - **10 held by no file.** Every judge answered `nowhere`: `constraints/retrieval-requires-owner-authentication`, `domain/knowledge-base/{assertion-status, knowledge-node, link-type, node-alias}`, `rules/knowledge-base/{compliance-deletion-propagates, expansion-current-view, expansion-reaches-merged-node-survivor, expansion-skips-deleted-nodes, expansion-skips-superseded-and-deleted-links}`.
> - **20 contradicted where they are held.** A `contradicts` finding stands against each in at least one file. The returns carry 26 `contradicts` in all. **16 are prose second homes:** comments or tool descriptions restating a node's fact, in `errors.ts` (×6), `query-toolset.ts` (×4), `provenance.service.ts` (×2), `accepted-fragments.service.ts` (×2), `scoring.ts` and `index.ts`. **9 are behavior or shape departures:**
>   - `search.dto.ts` · `contracts/knowledge-base/retrieval`: `as_of` checks only the digit shape, not a calendar date.
>   - `response.dto.ts` · `raw-information`: `metadata` is an object, not a string.
>   - `response.dto.ts` · `raw-chunk`: `locator` is an object, not a string.
>   - `response.dto.ts` and `provenance.repository.ts` · `fragment-status`: 4 values, with `superseded` missing.
>   - `search.service.ts` · `assertion-flag`: the code spells it `low_confidence`, the node `low-confidence`.
>   - `search.service.ts` · `expansion-decay`: the score falls back to 0 for hop ≥ 2 when neither endpoint is matched.
>   - `search.repository.ts` · `search-ranking`: the node layer breaks ties by `canonical_name` before the LIMIT cut.
>   - `errors.ts` · `search-query-length`: the literal 1000 is repeated in a message string.
>
>   The 26th is the one below.
> - **1 both held by no file and contradicted:** `rules/knowledge-base/search-excludes-compliance-deleted-sources`. The `search.repository.ts` judge found that the link-support lookup (`listProvenanceForLinks`) applies no fragment-status or compliance-deletion filter, so a deleted source's fragment could appear as a link's support.
> - **0 collateral, 0 tainted.** There was no unattributed finding.
> - **11 `unstated` facts over 7 files.** The fold lands them under the record's own `unstated` and they block no binding:
>   - `.strict()` refusal on the listing query
>   - `original_input` → `'[REDACTED]'` after a compliance deletion
>   - `original_input` excluded from `content_hash`
>   - MCP tool names and toolset key
>   - search/provenance wire parameter names
>   - chunk order inside a provenance answer
>   - order of a node item's supporting fragments
>   - a node's score = max over its matching aliases
>   - "legacy-data inconsistency" diagnosis in the empty-chain message
>   - a link item's `layer: "node"`
>   - `PER_LAYER_FETCH_LIMIT = 200` capping the total
>
> **Where it was written:** the record is at `siegard-reconcile/adopt-query-retrieval.md` (validated clean by `--reconciliation`). The returns are at `siegard-reconcile/adopt-query-retrieval.returns/` (15 files; the 2 refused first returns sit unchanged in `siegard-survey/adopt-query-retrieval/refused-returns/`). There was no run. The trace is `siegard-trace.json` (first trace of the target).
>
> **What was bound:** 53 bindings over 14 files. `index.ts` is bound to nothing and `--untraced` lists it as `holds-nothing`. **Not bound:** the 31 nodes listed above, exactly as the bind's receipt names them. Nothing is decided by a test: no certification was offered.
>
> **Routes, not chosen here.**
> - **(1) The fact belongs in the specification.** This covers the 11 `unstated` facts, the 10 held-by-no-file candidates, and every `contradicts` where the code is right and the node is behind: the object shapes of `metadata`/`locator`, the `low_confidence` spelling, `fragment-status` if 4 values is intended, the `canonical_name` tie-break if intended, and the calendar check on `as_of` if the weaker check is intended. Route: `/siegard:analyse` over the record `siegard-reconcile/adopt-query-retrieval.md` (its `unstated` list and the `how` of each not-cleared node) and the files named there, project root `/home/siegfriedneto/projects/eternal`.
> - **(2) The node is right and the behavior is wrong.** Candidates: `search-excludes-compliance-deleted-sources` (link-support lookup lacks the exclusion), `expansion-decay` (0 fallback at hop ≥ 2), `search-total-before-pagination`'s cap (if the cap is not intended), `fragment-status` (missing `superseded`). Route: `/siegard:plan-work` corrective increment, one wrong behavior per invocation as the finding states it, project root `/home/siegfriedneto/projects/eternal`, target `backend`, a new initiative slug.
> - **(3) Comment route.** For the 16 prose second homes the human removes the prose, never refreshes it, and then runs `/siegard:reconcile` over those files under a new slug. The files are `service/errors.ts`, `mcp/query-toolset.ts`, `service/provenance.service.ts`, `service/accepted-fragments.service.ts`, `repository/scoring.ts`, `index.ts`.
> - **(4) Notes naming a node no file is bound to:** none. The record's `notes` carry no "owed a route of its own".
>
> **Next invocation's file set:** the remainder, meaning the files whose readings found against a node. For every node not cleared, the fix changes either the node or the file, so the next reconciliation is over the files any of the above routes touches, under a new slug, never the whole 15 again.
>
> **Target standing (`--untraced`):** 279 tracked, 14 bound, 1 holds-nothing, 264 unsurveyed. Adoption is not complete («no file is unsurveyed and no node is unreached», SPEC-005 R7): 264 files unsurveyed, 31 nodes unreached.

## Step 3 — what the adoption bound

```
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --reconciliation siegard-reconcile/adopt-query-retrieval.md
adopt-query-retrieval.md holds: 15 file(s), 53 node(s) the judgment cleared, 31 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 53 binding(s) from this record and none for constraints/llm-toolset-omits-fragment-listing, constraints/retrieval-requires-owner-authentication, contracts/knowledge-base/retrieval, domain/knowledge-base/assertion-flag, domain/knowledge-base/assertion-status, domain/knowledge-base/fragment-status, domain/knowledge-base/knowledge-node, domain/knowledge-base/link-type, domain/knowledge-base/node-alias, domain/knowledge-base/raw-chunk, domain/knowledge-base/raw-information, rules/knowledge-base/chunk-match-never-surfaces, rules/knowledge-base/compliance-deletion-propagates, rules/knowledge-base/compliance-refusal-takes-precedence, rules/knowledge-base/empty-provenance-chain-refused, rules/knowledge-base/expansion-current-view, rules/knowledge-base/expansion-decay, rules/knowledge-base/expansion-depth-bounds, rules/knowledge-base/expansion-reaches-merged-node-survivor, rules/knowledge-base/expansion-skips-deleted-nodes, rules/knowledge-base/expansion-skips-superseded-and-deleted-links, rules/knowledge-base/listing-excludes-compliance-deleted, rules/knowledge-base/listing-order, rules/knowledge-base/page-limit-bounds, rules/knowledge-base/provenance-refused-after-compliance-deletion, rules/knowledge-base/provenance-requires-accepted-fragment, rules/knowledge-base/search-excludes-compliance-deleted-sources, rules/knowledge-base/search-layer-outside-set-refused, rules/knowledge-base/search-query-length, rules/knowledge-base/search-query-must-parse, rules/knowledge-base/search-ranking: a node without `encoded_at` is a node this form cannot bind.
[exit 0]
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --untraced backend
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
[exit 0]
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --convergence backend specification siegard-work
84 node(s) of specification; 53 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

53 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 3, element 13, rule 34, scenario 3
0 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
31 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 1, element 8, rule 20

files under backend: 279 tracked, 14 bound, 265 no binding names (264 unsurveyed) — `--untraced` lists them

53 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 465 finding(s) past reconciliations left open and no bind closed (465 unseen, 0 covered, 0 reported); 0 pair(s) the records answer both ways; 11 unstated fact(s) the source states and no node holds; 0 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/modules/query-retrieval/dto/fragment.dto.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/dto/response.dto.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/dto/search.dto.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/index.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/mcp/query-toolset.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/repository/fts-config.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/repository/scoring.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/repository/search.repository.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/routes/query-retrieval.routes.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/service/errors.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/service/provenance.service.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md
  backend/src/modules/query-retrieval/service/search.service.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval.md
    constraints/retrieval-requires-owner-authentication — found against in adopt-query-retrieval.md
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval.md
    domain/knowledge-base/assertion-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval.md
    domain/knowledge-base/knowledge-node — found against in adopt-query-retrieval.md
    domain/knowledge-base/link-type — found against in adopt-query-retrieval.md
    domain/knowledge-base/node-alias — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval.md
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-deletion-propagates — found against in adopt-query-retrieval.md
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-current-view — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-reaches-merged-node-survivor — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-deleted-nodes — found against in adopt-query-retrieval.md
    rules/knowledge-base/expansion-skips-superseded-and-deleted-links — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval.md

465 finding(s) no bind closed, over 15 file(s):
  465 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  465 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

11 unstated fact(s) the records name, over 7 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  src/modules/query-retrieval/dto/fragment.dto.ts — ListAcceptedFragmentsQuerySchema, the `.strict()` call on the query object (line 38): A request carrying any query parameter outside llm_run_id, raw_information_id, limit and offset is refused here. The contract's refusals for the listing name only a missing filter, a malformed identifier and out-of-range paging, so this refusal is decided in the DTO. The next reader looks for it in the specification and does not find it. [adopt-query-retrieval.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 81-84: The literal value a compliance-deleted source's original input takes is stated only in this prose. I searched the whole specification root, including the decision log, for REDACTED and found no node that holds it. It reads as a decision the business made, but the next reader will look for it in the specification and not find it. [adopt-query-retrieval.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 83-84: The comment states that the original input is excluded from the content hash. I searched the specification for content_hash and content hash and found no node that holds this. It is a rule of the idempotency identity that lives only in prose here. [adopt-query-retrieval.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QUERY_RETRIEVAL_TOOL_NAMES and the four registerTool calls, lines 118-123 and 219-284: The retrieval contract names its operations search, read-link-provenance, read-attribute-provenance and read-fragment-provenance. The names an MCP client actually calls (get_provenance_link and the others) and the toolset key "query" live only in this file. The next reader who looks in the specification for what the owner's language model calls will not find them. [adopt-query-retrieval.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — search handler input mapping, lines 226-241, and the search description, lines 130-135: The search-query node names its choices text and link_types, and the contract gives no wire names. The input names `query` and `expand_link_types`, and the id parameters `link_id`, `attribute_id` and `fragment_id`, are fixed only in code. A reader comparing the node with the tool sees two vocabularies and no node saying which one the client must send. [adopt-query-retrieval.md]
  src/modules/query-retrieval/repository/provenance.repository.ts — the ORDER BY clauses of the two chain queries in runChainSql (lines 154 and 179): The order of the chunks inside each fragment (chunk index ascending, then chunk id) and the fragment tie-break by fragment id decide what the owner reads first in a provenance answer. The specification holds only that fragments come in recording order. The chunk order lives only in this SQL, so the next reader looks for it in the specification and does not find it. [adopt-query-retrieval.md]
  src/modules/query-retrieval/repository/search.repository.ts — listProvenanceForNodes, the ORDER BY clause (line 373): The order in which the fragments that support a node hit are presented is decided here, newest first, and no node states it. Provenance-in-recording-order covers only links and attributes. A reader looking for how a node's supporting fragments are ordered finds no rule. [adopt-query-retrieval.md]
  src/modules/query-retrieval/repository/search.repository.ts — searchNodeAliasLayer, the SELECT score expression (line 123): A knowledge node's score is decided as the highest rank among its matching aliases, and the specification does not say how a node reached through several aliases is scored. Code becomes the only home of that choice. The next reader who wants to know why a node ranks where it does looks in layer-weights or search-item and finds nothing. [adopt-query-retrieval.md]
  src/modules/query-retrieval/service/errors.ts — message of EmptyProvenanceError, lines 85-87: The message tells the owner that an empty provenance chain means legacy data. The node only says that a read of an existing item with an empty chain is refused, and states no cause. The owner is given a diagnosis that lives only in this string. [adopt-query-retrieval.md]
  src/modules/query-retrieval/service/search.service.ts — line 357, the `layer` of a link search item: The search-item node types `layer` as a search-layer (fragment, node, chunk) and no node says which layer a link item reports. The code decides it is "node". A consumer filtering or grouping by layer inherits that decision, and the next reader will look for it in the specification and find nothing. [adopt-query-retrieval.md]
  src/modules/query-retrieval/service/search.service.ts — line 56, the constant PER_LAYER_FETCH_LIMIT, passed to searchFragmentLayer, searchNodeAliasLayer and searchChunkLayer at lines 129-147: The number 200 is a cap on what a search can ever rank, and no node states it. Matches beyond the 200th on a layer are dropped before ranking. The reported `total` is `filtered.length` (line 391), so it counts only what survived the cap. A reader who trusts search-total-before-pagination ("counts every search item before the page is cut") would not look here for the reason a total stops at some number. [adopt-query-retrieval.md]
  each is the analysis's to close, through the node that gives the fact a home
[exit 1]
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
no drift: 53 binding(s) match the specification and the code as both stand now
[exit 0]
```

`--owed` exits 1 because findings are owed. Its 465 "unseen" = 31 not-cleared nodes × 15 files: each is a pair nothing binds. `--check`: no drift over the 53 bindings.

### Counts, from the record

```
cleared 53 not cleared 31
unattributed contradicts (taint source): 0
held by no file (no finding): 10
   constraints/retrieval-requires-owner-authentication
   domain/knowledge-base/assertion-status
   domain/knowledge-base/knowledge-node
   domain/knowledge-base/link-type
   domain/knowledge-base/node-alias
   rules/knowledge-base/compliance-deletion-propagates
   rules/knowledge-base/expansion-current-view
   rules/knowledge-base/expansion-reaches-merged-node-survivor
   rules/knowledge-base/expansion-skips-deleted-nodes
   rules/knowledge-base/expansion-skips-superseded-and-deleted-links
contradicted (held somewhere, contradicts finding): 20
   constraints/llm-toolset-omits-fragment-listing | held: 1 | contradicted in: index.ts
   contracts/knowledge-base/retrieval | held: 11 | contradicted in: dto/search.dto.ts, service/errors.ts
   domain/knowledge-base/assertion-flag | held: 2 | contradicted in: service/search.service.ts
   domain/knowledge-base/fragment-status | held: 5 | contradicted in: dto/response.dto.ts, repository/provenance.repository.ts
   domain/knowledge-base/raw-chunk | held: 6 | contradicted in: dto/response.dto.ts
   domain/knowledge-base/raw-information | held: 6 | contradicted in: dto/response.dto.ts
   rules/knowledge-base/chunk-match-never-surfaces | held: 1 | contradicted in: repository/scoring.ts
   rules/knowledge-base/compliance-refusal-takes-precedence | held: 1 | contradicted in: service/provenance.service.ts
   rules/knowledge-base/empty-provenance-chain-refused | held: 3 | contradicted in: service/errors.ts, service/provenance.service.ts
   rules/knowledge-base/expansion-decay | held: 1 | contradicted in: service/search.service.ts
   rules/knowledge-base/expansion-depth-bounds | held: 1 | contradicted in: mcp/query-toolset.ts
   rules/knowledge-base/listing-excludes-compliance-deleted | held: 1 | contradicted in: service/accepted-fragments.service.ts
   rules/knowledge-base/listing-order | held: 1 | contradicted in: service/accepted-fragments.service.ts
   rules/knowledge-base/page-limit-bounds | held: 2 | contradicted in: mcp/query-toolset.ts
   rules/knowledge-base/provenance-refused-after-compliance-deletion | held: 4 | contradicted in: mcp/query-toolset.ts, service/errors.ts
   rules/knowledge-base/provenance-requires-accepted-fragment | held: 4 | contradicted in: mcp/query-toolset.ts, service/errors.ts
   rules/knowledge-base/search-layer-outside-set-refused | held: 4 | contradicted in: service/errors.ts
   rules/knowledge-base/search-query-length | held: 2 | contradicted in: service/errors.ts
   rules/knowledge-base/search-query-must-parse | held: 2 | contradicted in: service/errors.ts
   rules/knowledge-base/search-ranking | held: 1 | contradicted in: repository/search.repository.ts
held by no file AND contradicted: 1
   rules/knowledge-base/search-excludes-compliance-deleted-sources | contradicted in: repository/search.repository.ts
tainted: 0 (no unattributed finding; adoption files carry no trace nodes)
unstated findings in record: 11
unstated in returns: 11 | contradicts in returns: 26
```

| measure | count |
|---|---|
| candidates cleared | 53 |
| candidates not cleared | 31 |
| — held by no file (no finding) | 10 |
| — contradicted (held in ≥1 file, `contradicts` against it) | 20 |
| — held by no file **and** contradicted | 1 |
| — tainted (unattributed finding on the file) | 0 |
| `unstated` findings | 11 (over 7 files) |
| `contradicts` findings in the returns | 26 |

### Candidates held by no file: wrong node, or fact outside the 15 files

Where the fact lives is checked by `grep` over `backend/src`. The pilot was the one that read those files, not this adoption.

- `constraints/retrieval-requires-owner-authentication`: **outside.** Authentication is applied by the parent scope (`requireNeonAuth`, in `backend/src/app.ts` / `backend/src/mcp/sdk-http-transport.ts`). The routes file says so only in a comment.
- `domain/knowledge-base/assertion-status`: **outside.** The 15 files carry status as an untyped string (`search.service.ts`, `search.repository.ts`), and the enumeration is declared elsewhere (schema / knowledge-graph).
- `domain/knowledge-base/knowledge-node`: **judge variance, not a wrong node.** The refused first `search.repository.ts` return held it at `NodeAliasHitRow`/`searchNodeAliasLayer`. The accepted re-delegation answered `nowhere` ("only reads, does not declare"). The entity is declared outside the 15 files (knowledge-graph).
- `domain/knowledge-base/link-type`: **judge variance, not a wrong node.** The refused first return held it at `findLinksMetadata`, and the re-delegation answered `nowhere`. It is declared outside (catalog, knowledge-graph).
- `domain/knowledge-base/node-alias`: **judge variance, not a wrong node.** The refused first return held it at `searchNodeAliasLayer`, and the re-delegation answered `nowhere`. It is declared outside.
- `rules/knowledge-base/compliance-deletion-propagates`: **outside.** The propagation is a write, in `backend/src/modules/compliance-audit/`. The 15 files only read.
- `rules/knowledge-base/expansion-current-view`: **outside.** `search.service.ts` passes `asOf` through, and the reach filter is in `backend/src/modules/knowledge-graph/service/traversal.service.ts`.
- `rules/knowledge-base/expansion-reaches-merged-node-survivor`: **outside.** Traversal is in `knowledge-graph/service/traversal.service.ts`.
- `rules/knowledge-base/expansion-skips-deleted-nodes`: **outside.** Traversal is in `knowledge-graph/service/traversal.service.ts`.
- `rules/knowledge-base/expansion-skips-superseded-and-deleted-links`: **outside.** Traversal is in `knowledge-graph/service/traversal.service.ts`.
- `rules/knowledge-base/search-excludes-compliance-deleted-sources` (also contradicted): **not a wrong node.** The fact is partly held indirectly (the fragment layer's `status = 'accepted'`, per the first-wave `search.repository.ts` return). The accepted re-delegation reads the link-support lookup as missing the exclusion. That is a possible code defect, for the human to route.

None is read as a wrong node. Seven facts live outside the 15 files, three are judge variance between two readings of `search.repository.ts`, and one is a contested behavior.

### Compared with the pilot (RESULTS.md step 4: the same files held all 69 nodes of the first increment)

The first increment (commit `b8875e7`) had 68 nodes plus `_context`. 67 of them are still in the specification. `rules/knowledge-base/search-keeps-compliance-deleted-sources` is gone and was replaced in the second increment by `search-excludes-compliance-deleted-sources`. 17 candidates were added since.

The pilot found **24** nodes held that this adoption did not clear:

```
   constraints/llm-toolset-omits-fragment-listing
   contracts/knowledge-base/retrieval
   domain/knowledge-base/assertion-flag
   domain/knowledge-base/assertion-status
   domain/knowledge-base/fragment-status
   domain/knowledge-base/knowledge-node
   domain/knowledge-base/link-type
   domain/knowledge-base/node-alias
   domain/knowledge-base/raw-chunk
   domain/knowledge-base/raw-information
   rules/knowledge-base/chunk-match-never-surfaces
   rules/knowledge-base/compliance-refusal-takes-precedence
   rules/knowledge-base/empty-provenance-chain-refused
   rules/knowledge-base/expansion-decay
   rules/knowledge-base/expansion-depth-bounds
   rules/knowledge-base/listing-excludes-compliance-deleted
   rules/knowledge-base/listing-order
   rules/knowledge-base/page-limit-bounds
   rules/knowledge-base/provenance-refused-after-compliance-deletion
   rules/knowledge-base/provenance-requires-accepted-fragment
   rules/knowledge-base/search-layer-outside-set-refused
   rules/knowledge-base/search-query-length
   rules/knowledge-base/search-query-must-parse
   rules/knowledge-base/search-ranking
```

Of these 24, **20** are held here too, and the 1:1 rule blocked them: a `contradicts` finding in some file. The pilot counted them as held too; its pass B recorded 20 `contradicts`. In an adoption a contradiction in any file blocks the node's binding everywhere. **4** are answered `nowhere` by every accepted return: `assertion-status`, `knowledge-node`, `link-type`, `node-alias`. For the last three, the first-wave `search.repository.ts` return (refused by the fold for YAML) did hold them. The fresh judge did not. Two independent judges read the same bytes differently, and the difference decides three bindings.

Second-increment candidates not cleared: 7. They are `retrieval-requires-owner-authentication`, `compliance-deletion-propagates`, the four `expansion-*` rules above, and `search-excludes-compliance-deleted-sources`. All but the last are facts outside the 15 files.

## Step 4 — tokens

```
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/telemetry.py --probe --since 2026-09-30T11:00:11Z /home/siegfriedneto/projects/eternal
window: 2026-09-30T11:00:11.000Z .. 2026-09-30T11:08:50.217Z (since named)
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable
sessions overlapping the window: 1
  fe6cbae0-fd29-4232-89f4-345eab98de33: 297 entries, 0 human turns, working directories /home/siegfriedneto/projects/eternal, /home/siegfriedneto/projects/eternal/backend/src
what leaves the transcripts: agent types, descriptions, token counts, timestamps, and the command lines that invoked this framework's scripts — no message text
would write: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260930T110850Z.json
[exit 0]
```

Announced to the human before the read: one session transcript is read (agent types, descriptions, token counts, timestamps, framework command lines — no message text), and the report is written under `siegard-telemetry/`.

```
$ python3 -B ${CLAUDE_PLUGIN_ROOT}/bin/telemetry.py --since 2026-09-30T11:00:11Z /home/siegfriedneto/projects/eternal
window: 2026-09-30T11:00:11.000Z .. 2026-09-30T11:08:56.859Z (since named)
framework: 4.19.0 at /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.19.0
transcripts: /home/siegfriedneto/.claude/projects/-home-siegfriedneto-projects-eternal — readable; 1 session(s) overlap the window
agents: 17 spawned (0 of them by another agent), 17 with a transcript, 223438 output tokens, 1366.089s
sessions: 1 orchestrating, 38394 output tokens — never a subagent's, which the line above already carries
commands: 18 invoking this framework's scripts, 0 exiting non-zero
runs: 0 captured
commits: 0; uncommitted: 12
decisions added: 0 (baseline: commit 74dca464c9d15698e49ce27e983bc765360abb60)
notes standing: 0
unavailable: nothing
report: /home/siegfriedneto/projects/eternal/siegard-telemetry/20260930T110856Z.json
[exit 0]
```

Report: `siegard-telemetry/20260930T110856Z.json`, `contract_version: siegard-telemetry/6`. The script wrote the JSON only; no Markdown report sits beside it (that is the `/siegard-telemetry` skill's, which this runbook did not invoke). Every judge ran on `claude-sonnet-5-5`, the model the agent definition sets.

### Per judge delegation

| # | delegation | model | input | cache-creation | output | in+cc+out | cache-read | tool calls | s |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Judge index.ts | claude-sonnet-5-5 | 4 | 53156 | 9567 | 62727 | 25826 | 3 | 54.8 |
| 2 | Judge routes file | claude-sonnet-5-5 | 4 | 49657 | 11286 | 60947 | 32527 | 3 | 66.0 |
| 3 | Judge search.dto | claude-sonnet-5-5 | 4 | 47642 | 10899 | 58545 | 32512 | 3 | 65.7 |
| 4 | Judge fragment.dto | claude-sonnet-5-5 | 6 | 49066 | 10298 | 59370 | 86326 | 5 | 60.7 |
| 5 | Judge response.dto | claude-sonnet-5-5 | 8 | 56266 | 17310 | 73584 | 146085 | 9 | 113.6 |
| 6 | Judge errors.ts | claude-sonnet-5-5 | 4 | 47398 | 14550 | 61952 | 32503 | 3 | 86.1 |
| 7 | Judge search.service | claude-sonnet-5-5 | 8 | 62427 | 21715 | 84150 | 160856 | 9 | 137.7 |
| 8 | Judge provenance.service | claude-sonnet-5-5 | 4 | 48850 | 12241 | 61095 | 32512 | 3 | 72.7 |
| 9 | Judge accepted-fragments.service | claude-sonnet-5-5 | 4 | 47295 | 12107 | 59406 | 32524 | 3 | 72.8 |
| 10 | Judge search.repository | claude-sonnet-5-5 | 8 | 59153 | 18763 | 77924 | 157490 | 8 | 120.6 |
| 11 | Judge provenance.repository | claude-sonnet-5-5 | 6 | 52536 | 12636 | 65178 | 88599 | 6 | 77.8 |
| 12 | Judge accepted-fragments.repository | claude-sonnet-5-5 | 8 | 50491 | 9734 | 60233 | 143969 | 6 | 59.6 |
| 13 | Judge fts-config.ts | claude-sonnet-5-5 | 6 | 47272 | 11269 | 58547 | 85477 | 6 | 61.8 |
| 14 | Judge scoring.ts | claude-sonnet-5-5 | 6 | 47301 | 7837 | 55144 | 85330 | 5 | 44.6 |
| 15 | Judge query-toolset.ts | claude-sonnet-5-5 | 10 | 54414 | 16256 | 70680 | 210685 | 9 | 101.3 |
| 16 | Re-judge search.repository | claude-sonnet-5-5 | 10 | 58808 | 16656 | 75474 | 222099 | 9 | 109.4 |
| 17 | Re-judge accepted-fragments.service | claude-sonnet-5-5 | 4 | 47437 | 10314 | 57755 | 32666 | 3 | 60.8 |
| | **total (17 delegations)** | | 104 | 879169 | 223438 | 1102711 | 1607986 | 93 | |


mean per file (total / 15 files): in+cc+out = 73514; tool calls = 6.20
mean per delegation (total / 17): in+cc+out = 64865

The two refused first-wave returns (#9 accepted-fragments.service, #10 search.repository) cost 59,406 + 77,924 = 137,330 in+cc+out, all of it re-bought by #16 and #17 (133,229).

### Orchestrating session

session `fe6cbae0-fd29-4232-89f4-345eab98de33`, harness 2.1.285: input 126, cache-creation 229104, output 38394, cache-read 10501272; in+cc+out = 267624. Of that, the `reconcile` skill's turns: 55 turns, output 37277.

Note: the window ends at 11:08:56Z, the moment the command ran. The orchestrating session kept working after that (writing this file), and that work is not counted.

## Step 5 — stop

Stopped here. Waiting for the human to review and commit, as one commit with pathspec `siegard-trace.json siegard-reconcile siegard-survey/adopt-query-retrieval siegard-telemetry`.

Commit id: _(pending — to be recorded once the human commits)_

## Re-fold under reconcile/7

Plugin root: `/home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0` (installed 4.21.0).

### Step 1 — preconditions

Start instant (UTC): `2026-09-30T11:49:50Z`

```
$ grep '"version"' /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/.claude-plugin/plugin.json
  "version": "4.21.0"
[exit 0]
$ git status --porcelain -- specification backend
[exit 0]
$ ls siegard-reconcile/adopt-query-retrieval.returns | wc -l
15
[exit 0]
```

Version 4.21.0 (≥ 4.20.0), `git status` printed nothing, 15 returns: preconditions hold.

### Step 2 — discard what the /6 fold wrote

```
$ rm siegard-trace.json siegard-reconcile/adopt-query-retrieval.md
[exit 0]
```

### Step 3 — stage under a new slug and move the returns in

```
$ WS=/tmp/adopt-qr-r2; rm -rf "$WS"
$ FILES=... (15 files)
src/modules/query-retrieval/index.ts
src/modules/query-retrieval/routes/query-retrieval.routes.ts
src/modules/query-retrieval/dto/search.dto.ts
src/modules/query-retrieval/dto/fragment.dto.ts
src/modules/query-retrieval/dto/response.dto.ts
src/modules/query-retrieval/service/errors.ts
src/modules/query-retrieval/service/search.service.ts
src/modules/query-retrieval/service/provenance.service.ts
src/modules/query-retrieval/service/accepted-fragments.service.ts
src/modules/query-retrieval/repository/search.repository.ts
src/modules/query-retrieval/repository/provenance.repository.ts
src/modules/query-retrieval/repository/accepted-fragments.repository.ts
src/modules/query-retrieval/repository/fts-config.ts
src/modules/query-retrieval/repository/scoring.ts
src/modules/query-retrieval/mcp/query-toolset.ts
$ NODES=... (84 candidates)
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --stage backend specification adopt-query-retrieval-r2 "/tmp/adopt-qr-r2" $FILES --adopt $NODES
staged adopt-query-retrieval-r2: 15 file(s) to judge over 0 node(s); staged as an adoption — 84 candidate node(s) read on every file, each bound by the fold to the files that hold its fact; 0 file(s) kept outside the judgment; 0 file(s) with nothing left to judge; 15 file(s) the trace binds nothing to, 15 of them judged over the candidates alone
  manifest and packs at /tmp/adopt-qr-r2; candidate index at /tmp/adopt-qr-r2/candidates.txt
  save each delegation's return verbatim at /home/siegfriedneto/projects/eternal/siegard-reconcile/adopt-query-retrieval-r2.returns/<file path with '/' as '__'>.yaml
[exit 0]
$ mv siegard-reconcile/adopt-query-retrieval.returns/*.yaml siegard-reconcile/adopt-query-retrieval-r2.returns/
[exit 0]
$ rmdir siegard-reconcile/adopt-query-retrieval.returns
[exit 0]
$ ls siegard-reconcile/adopt-query-retrieval-r2.returns | wc -l
15
[exit 0]
```

### Step 4 — fold, validate, bind

```
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --fold backend /tmp/adopt-qr-r2 siegard-survey/adopt-query-retrieval/premise.yaml siegard-reconcile/adopt-query-retrieval-r2.md
folded adopt-query-retrieval-r2.md: 53 node(s) cleared, 21 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 10 candidate(s) no file of the set holds, listed under `unheld`
  next: trace.py --reconciliation siegard-reconcile/adopt-query-retrieval-r2.md
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --reconciliation siegard-reconcile/adopt-query-retrieval-r2.md
adopt-query-retrieval-r2.md holds: 15 file(s), 53 node(s) the judgment cleared, 21 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 53 binding(s) from this record and none for constraints/llm-toolset-omits-fragment-listing, contracts/knowledge-base/retrieval, domain/knowledge-base/assertion-flag, domain/knowledge-base/fragment-status, domain/knowledge-base/raw-chunk, domain/knowledge-base/raw-information, rules/knowledge-base/chunk-match-never-surfaces, rules/knowledge-base/compliance-refusal-takes-precedence, rules/knowledge-base/empty-provenance-chain-refused, rules/knowledge-base/expansion-decay, rules/knowledge-base/expansion-depth-bounds, rules/knowledge-base/listing-excludes-compliance-deleted, rules/knowledge-base/listing-order, rules/knowledge-base/page-limit-bounds, rules/knowledge-base/provenance-refused-after-compliance-deletion, rules/knowledge-base/provenance-requires-accepted-fragment, rules/knowledge-base/search-excludes-compliance-deleted-sources, rules/knowledge-base/search-layer-outside-set-refused, rules/knowledge-base/search-query-length, rules/knowledge-base/search-query-must-parse, rules/knowledge-base/search-ranking: a node without `encoded_at` is a node this form cannot bind.
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --bind-record backend specification siegard-reconcile/adopt-query-retrieval-r2.md --workspace /tmp/adopt-qr-r2
bound constraints/retrieval-is-lexical-only to 2 file(s)
bound constraints/retrieval-is-read-only to 2 file(s)
bound constraints/retrieval-transports-answer-alike to 2 file(s)
bound domain/knowledge-base/accepted-fragment-filter to 4 file(s)
bound domain/knowledge-base/compliance-deletion to 3 file(s)
bound domain/knowledge-base/information-fragment to 7 file(s)
bound domain/knowledge-base/item-kind to 2 file(s)
bound domain/knowledge-base/knowledge-link to 2 file(s)
bound domain/knowledge-base/node-attribute to 2 file(s)
bound domain/knowledge-base/node-status to 1 file(s)
bound domain/knowledge-base/page to 7 file(s)
bound domain/knowledge-base/provenance to 4 file(s)
bound domain/knowledge-base/search-item to 2 file(s)
bound domain/knowledge-base/search-layer to 4 file(s)
bound domain/knowledge-base/search-query to 4 file(s)
bound domain/knowledge-base/source-type to 5 file(s)
bound rules/knowledge-base/alias-matching to 2 file(s)
bound rules/knowledge-base/chunk-layer-matches-current-chunks to 1 file(s)
bound rules/knowledge-base/chunk-match-cites-its-fragment to 1 file(s)
bound rules/knowledge-base/chunk-offsets-count-code-points to 2 file(s)
bound rules/knowledge-base/expanded-link-requires-provenance to 1 file(s)
bound rules/knowledge-base/expansion-as-of-view to 1 file(s)
bound rules/knowledge-base/expansion-follows-both-directions to 1 file(s)
bound rules/knowledge-base/expansion-in-effect-only to 1 file(s)
bound rules/knowledge-base/expansion-restricted-to-named-link-types to 1 file(s)
bound rules/knowledge-base/expansion-starts-from-matched-nodes to 1 file(s)
bound rules/knowledge-base/fragment-item-summary to 1 file(s)
bound rules/knowledge-base/fragment-layer-matches-accepted-only to 1 file(s)
bound rules/knowledge-base/item-flags to 1 file(s)
bound rules/knowledge-base/layer-weights to 2 file(s)
bound rules/knowledge-base/link-item-summary to 1 file(s)
bound rules/knowledge-base/link-types-ignored-without-expansion to 1 file(s)
bound rules/knowledge-base/listing-holds-accepted-only to 1 file(s)
bound rules/knowledge-base/listing-one-entry-per-fragment to 1 file(s)
bound rules/knowledge-base/listing-requires-a-filter to 1 file(s)
bound rules/knowledge-base/listing-total-before-pagination to 2 file(s)
bound rules/knowledge-base/node-item-summary to 1 file(s)
bound rules/knowledge-base/node-layer-matches-through-aliases to 1 file(s)
bound rules/knowledge-base/node-layer-skips-merged-and-deleted to 1 file(s)
bound rules/knowledge-base/node-surfaces-only-with-accepted-mention to 2 file(s)
bound rules/knowledge-base/page-defaults to 2 file(s)
bound rules/knowledge-base/page-offset-non-negative to 2 file(s)
bound rules/knowledge-base/prose-matching to 2 file(s)
bound rules/knowledge-base/provenance-in-recording-order to 2 file(s)
bound rules/knowledge-base/search-option-defaults to 2 file(s)
bound rules/knowledge-base/search-query-not-blank to 2 file(s)
bound rules/knowledge-base/search-total-before-pagination to 2 file(s)
bound rules/knowledge-base/temporal-filters-apply-to-expansion-only to 1 file(s)
bound rules/knowledge-base/uncertain-items-excluded-on-request to 1 file(s)
bound rules/knowledge-base/unknown-link-type-refused to 2 file(s)
bound scenarios/knowledge-base/listing-for-unknown-source-is-empty to 2 file(s)
bound scenarios/knowledge-base/stop-words-only-query to 2 file(s)
bound scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing to 2 file(s)
53 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from adopt-query-retrieval-r2.md
  21 node(s) of adopt-query-retrieval-r2.md the judgment did not clear, and this bind wrote none of them:
    constraints/llm-toolset-omits-fragment-listing
    contracts/knowledge-base/retrieval
    domain/knowledge-base/assertion-flag
    domain/knowledge-base/fragment-status
    domain/knowledge-base/raw-chunk
    domain/knowledge-base/raw-information
    rules/knowledge-base/chunk-match-never-surfaces
    rules/knowledge-base/compliance-refusal-takes-precedence
    rules/knowledge-base/empty-provenance-chain-refused
    rules/knowledge-base/expansion-decay
    rules/knowledge-base/expansion-depth-bounds
    rules/knowledge-base/listing-excludes-compliance-deleted
    rules/knowledge-base/listing-order
    rules/knowledge-base/page-limit-bounds
    rules/knowledge-base/provenance-refused-after-compliance-deletion
    rules/knowledge-base/provenance-requires-accepted-fragment
    rules/knowledge-base/search-excludes-compliance-deleted-sources
    rules/knowledge-base/search-layer-outside-set-refused
    rules/knowledge-base/search-query-length
    rules/knowledge-base/search-query-must-parse
    rules/knowledge-base/search-ranking
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
[exit 0]
```

Fold: 53 cleared, 21 not, 10 under `unheld`; 53 bindings written — as the dry run expected.

### Step 5 — read the result

```
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/dto/search.dto.ts
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/index.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/mcp/query-toolset.ts
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/scoring.ts
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/search.repository.ts
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/errors.ts
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/provenance.service.ts
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval-r2.md

26 finding(s) no bind closed, over 11 file(s):
  26 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  26 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

11 unstated fact(s) the records name, over 7 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  src/modules/query-retrieval/dto/fragment.dto.ts — ListAcceptedFragmentsQuerySchema, the `.strict()` call on the query object (line 38): A request carrying any query parameter outside llm_run_id, raw_information_id, limit and offset is refused here. The contract's refusals for the listing name only a missing filter, a malformed identifier and out-of-range paging, so this refusal is decided in the DTO. The next reader looks for it in the specification and does not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 81-84: The literal value a compliance-deleted source's original input takes is stated only in this prose. I searched the whole specification root, including the decision log, for REDACTED and found no node that holds it. It reads as a decision the business made, but the next reader will look for it in the specification and not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 83-84: The comment states that the original input is excluded from the content hash. I searched the specification for content_hash and content hash and found no node that holds this. It is a rule of the idempotency identity that lives only in prose here. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QUERY_RETRIEVAL_TOOL_NAMES and the four registerTool calls, lines 118-123 and 219-284: The retrieval contract names its operations search, read-link-provenance, read-attribute-provenance and read-fragment-provenance. The names an MCP client actually calls (get_provenance_link and the others) and the toolset key "query" live only in this file. The next reader who looks in the specification for what the owner's language model calls will not find them. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — search handler input mapping, lines 226-241, and the search description, lines 130-135: The search-query node names its choices text and link_types, and the contract gives no wire names. The input names `query` and `expand_link_types`, and the id parameters `link_id`, `attribute_id` and `fragment_id`, are fixed only in code. A reader comparing the node with the tool sees two vocabularies and no node saying which one the client must send. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/provenance.repository.ts — the ORDER BY clauses of the two chain queries in runChainSql (lines 154 and 179): The order of the chunks inside each fragment (chunk index ascending, then chunk id) and the fragment tie-break by fragment id decide what the owner reads first in a provenance answer. The specification holds only that fragments come in recording order. The chunk order lives only in this SQL, so the next reader looks for it in the specification and does not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/search.repository.ts — listProvenanceForNodes, the ORDER BY clause (line 373): The order in which the fragments that support a node hit are presented is decided here, newest first, and no node states it. Provenance-in-recording-order covers only links and attributes. A reader looking for how a node's supporting fragments are ordered finds no rule. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/search.repository.ts — searchNodeAliasLayer, the SELECT score expression (line 123): A knowledge node's score is decided as the highest rank among its matching aliases, and the specification does not say how a node reached through several aliases is scored. Code becomes the only home of that choice. The next reader who wants to know why a node ranks where it does looks in layer-weights or search-item and finds nothing. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/errors.ts — message of EmptyProvenanceError, lines 85-87: The message tells the owner that an empty provenance chain means legacy data. The node only says that a read of an existing item with an empty chain is refused, and states no cause. The owner is given a diagnosis that lives only in this string. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — line 357, the `layer` of a link search item: The search-item node types `layer` as a search-layer (fragment, node, chunk) and no node says which layer a link item reports. The code decides it is "node". A consumer filtering or grouping by layer inherits that decision, and the next reader will look for it in the specification and find nothing. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — line 56, the constant PER_LAYER_FETCH_LIMIT, passed to searchFragmentLayer, searchNodeAliasLayer and searchChunkLayer at lines 129-147: The number 200 is a cap on what a search can ever rank, and no node states it. Matches beyond the 200th on a layer are dropped before ranking. The reported `total` is `filtered.length` (line 391), so it counts only what survived the cap. A reader who trusts search-total-before-pagination ("counts every search item before the page is cut") would not look here for the reason a total stops at some number. [adopt-query-retrieval-r2.md]
  each is the analysis's to close, through the node that gives the fact a home
[exit 1]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --untraced backend
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
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --convergence backend specification siegard-work
84 node(s) of specification; 53 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

53 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 3, element 13, rule 34, scenario 3
0 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
31 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 1, element 8, rule 20

files under backend: 279 tracked, 14 bound, 265 no binding names (264 unsurveyed) — `--untraced` lists them

53 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 26 finding(s) past reconciliations left open and no bind closed (26 unseen, 0 covered, 0 reported); 0 pair(s) the records answer both ways; 11 unstated fact(s) the source states and no node holds; 0 place(s) text restates a node's fact; 0 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.21.0/bin/trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
no drift: 53 binding(s) match the specification and the code as both stand now
[exit 0]
```

`--owed`: 26 findings over 11 files, 11 unstated facts over 7 files (exit 1: open findings remain). `--untraced`: 14 bound, 1 holds-nothing. `--convergence`: 53 current, 0 stale. As expected.

### Step 6 — stop

Stopped here. Waiting for the human to review and commit, as one commit with pathspec `siegard-trace.json siegard-reconcile siegard-survey/adopt-query-retrieval siegard-telemetry`.

Commit id: _(pending — to be recorded once the human commits)_
