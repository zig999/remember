# adopt-knowledge-graph — RESULTS

Runbook: `siegard-survey/RUNBOOK-adopt-context.md`. Plugin root `P` = `~/.claude/plugins/cache/siegard-generator/siegard/4.28.0`.

Start instant: `2026-09-30T19:44:17Z`

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
$ python3 -B /home/siegfriedneto/.claude/plugins/cache/siegard-generator/siegard/4.28.0/bin/spec.py specification
specification sound: 56 element(s), 250 rule(s), 8 scenario(s), 3 contract(s), 10 constraint(s) across 2 context(s); 88 decision(s) disclosed, 2 location(s) retired
[exit 0]
```

Result: version 4.28.0; `git status` printed nothing; specification sound. Preconditions hold.

`--untraced` line recorded: `279 tracked file(s) under backend: 67 bound, 212 no binding names` (6 holds-nothing, 0 outside, 206 unsurveyed).

## Step 2 — the survey

Areas (`git ls-files`, tests excluded; every non-test file of the module is in exactly one area):

- `service` (10): `service/{attribute,catalog,history,link,node,traversal}.service.ts`, `service/errors.ts`, `service/formatters.ts`, `service/norm.ts`, `traversal/config.ts`
- `boundary` (14): `dto/{attribute,catalog,enums,history,link,node,provenance,queries,traversal}.dto.ts`, `index.ts`, `mcp/{error-envelope,query-toolset,query-transport}.ts`, `routes/knowledge-graph.routes.ts`
- `storage` (4): `catalog/catalog.ts`, `repository/{catalog,graph}.repository.ts`, `repository/temporal-filter.ts`

Invocation: `/siegard:survey` with project root `/home/siegfriedneto/projects/eternal`, target `backend`, slug `adopt-knowledge-graph`, and the areas above.

Disclosures from the run:
- The slug directory already held this `RESULTS.md`, written by Step 1, and no material.
- The tree check over `backend/src/modules/knowledge-graph` printed nothing.
- The context so far, `spec.py --digest specification`, was handed to each surveyor as a file path, `/tmp/digest_kg.txt`.
- Each prompt also asked the surveyor to give the names a caller reads (keys, paths, verbs) in its fact lines. This answers the dropped key name found in compliance-audit.
- The task-notification transport HTML-escapes `<`, `>` and `&`. Each return was saved with those decoded back to the literal characters the surveyor wrote. No other change was made beyond stripping nothing, since no return had a fence.
- **Two areas were run twice.** The first `service` return was refused by `trace.py --survey`:
  ```
  cannot run: siegard-survey/adopt-knowledge-graph/service.md: read_outside_area/1: {...} is not of type 'string'
  ```
  One `read_outside_area` item held ": " in plain YAML, so it parsed as a mapping. The first `boundary` return had the same defect in its last `read_outside_area` item ("...rethrow end up: a Zod failure..."). A YAML parse confirmed it would be refused, so it was never saved into the slug directory. Both surveyors were delegated again from a fresh context with the problem named. Neither file was repaired by hand. The refused service return is kept outside the tree at `/tmp/kg_service.refused1.md`.
- **This is a framework finding.** The surveyor's contract does not warn it that frontmatter list items must be YAML strings. Two of three surveyors tripped on it here, and each re-run cost a full delegation.

### Survey report

**Areas as given:** see the list above (service 10 files, boundary 14 files, storage 4 files).

**`--untraced` before this survey:** `279 tracked file(s) under backend: 67 bound, 212 no binding names` (6 holds-nothing, 0 outside, 206 unsurveyed).

**`trace.py --survey` (verbatim, exit 0)**
```
siegard-survey/adopt-knowledge-graph/service.md: 89 fact line(s) over 10 file(s) — Facts 69, Answers 9, Vocabularies 7, Upstream artifacts 4
siegard-survey/adopt-knowledge-graph/boundary.md: 95 fact line(s) over 14 file(s) — Facts 57, Answers 20, Vocabularies 12, Upstream artifacts 6
siegard-survey/adopt-knowledge-graph/storage.md: 67 fact line(s) over 4 file(s) — Facts 55, Answers 1, Vocabularies 6, Upstream artifacts 5
```
No file is named by no fact.

**Observed and not decided here** (service 4, boundary 4, storage 3)
1. *service.* A deleted node is refused by node detail with 410, while a deleted link or attribute is answered normally by its point read.
2. *service.* A merged starting node whose survivor is missing or deleted stays the start. It is left out of `nodes`, while `starting_node_id` still names it.
3. *service.* A deleted node reached as a link endpoint is never expanded, yet it is listed in `nodes`.
4. *service.* Node-type filters are checked against the cached catalog snapshot, but the catalog listings read stored rows. A type present in the store and absent from the snapshot is listed yet refused as a filter.
5. *boundary.* The same refusal carries different `details`: REST adds the route's identifiers and MCP adds none.
6. *boundary.* REST `GET /node-types` ignores unknown query parameters, while MCP `list_node_types` refuses any property.
7. *boundary.* Point reads of a link and of an attribute exist on REST only, and no MCP tool mirrors them.
8. *boundary.* `limit` and `offset` refuse a non-integer, while `depth` passes a finite non-integer such as 2.5 under the same "must be an integer" message. The service then refuses it.
9. *storage.* The alias listing orders by `kind`, a Postgres enum. The order follows enum declaration, canonical before alias, not the alphabet.
10. *storage.* The provenance excerpt is taken from the chunk's own text starting at `offset_start + 1`. For a chunk with `offset_start > 0` that gives a shifted, possibly empty, slice.
11. *storage.* The traversal hop filters stored status `deleted` explicitly, while the attribute listing relies only on `superseded_at IS NULL`.

**read_outside_area** (gathered)
- service: `src/shared/invariant-error.ts`; `src/modules/knowledge-graph/routes/knowledge-graph.routes.ts`
- boundary: `src/modules/knowledge-graph/service/errors.ts`; `src/modules/query-retrieval/service/errors.ts`; `src/shared/error-mapping.ts`; `src/middleware/error-handler.ts`; `src/mcp/sdk-http-transport.ts`; `src/modules/knowledge-graph/traversal/config.ts`; `src/modules/knowledge-graph/service` (grep)
- storage: `src/shared/invariant-error.ts`; `../migrations/0001_init.sql`

Outside the context, `src/shared/*`, `src/middleware/*` and `src/mcp/*` belong to the shared adoption. The migration belongs to the database target, which is already adopted. `query-retrieval/service/errors.ts` shows that this module's MCP mapper classifies another context's refusals.

**Handoff**
```
/siegard:analyse project root /home/siegfriedneto/projects/eternal; material: siegard-survey/adopt-knowledge-graph/service.md, siegard-survey/adopt-knowledge-graph/boundary.md, siegard-survey/adopt-knowledge-graph/storage.md
```

**STOP (Step 2).** The owner reads every material file under `siegard-survey/adopt-knowledge-graph/`.

## Step 3 — the analysis

Invocation: `/siegard:analyse` with project root `/home/siegfriedneto/projects/eternal` and the three material files. Before writing, `git status --porcelain -- specification` printed nothing and the specification was sound. The survey material had been committed as `b36e447` at the owner's request before this step.

**Modelling choice.** The eleven catalog, node and graph reads were added to `contracts/knowledge-base/retrieval`. They share the owner-only query surface and the MCP query endpoint with search. This makes `retrieval-is-read-only`, `retrieval-requires-owner-authentication` and `retrieval-transports-answer-alike` cover them. The traversal got its own rules, because it has a direction and a starting node that the search's expansion does not.

### Nodes written

Changed (listed from `git status`):
```
contracts/knowledge-base/retrieval
decision-log
domain/knowledge-base/attribute-key
domain/knowledge-base/link-type
domain/knowledge-base/node-alias
domain/knowledge-base/node-type
rules/knowledge-base/expansion-depth-bounds
rules/knowledge-base/expansion-follows-both-directions
rules/knowledge-base/expansion-restricted-to-named-link-types
rules/knowledge-base/expansion-skips-deleted-nodes
rules/knowledge-base/name-normalization
rules/knowledge-base/page-defaults
rules/knowledge-base/unknown-link-type-refused
```

Created (51):
```
constraints/llm-toolset-omits-graph-point-reads
domain/knowledge-base/graph-read
domain/knowledge-base/node-filter
domain/knowledge-base/node-view
domain/knowledge-base/traversal-direction
domain/knowledge-base/traversal-request
rules/knowledge-base/allowed-values-in-string-order
rules/knowledge-base/attribute-key-history-check-order
rules/knowledge-base/attribute-key-history-requires-registered-key
rules/knowledge-base/attribute-key-history
rules/knowledge-base/attribute-key-listing-by-node-type
rules/knowledge-base/attribute-key-listing-order
rules/knowledge-base/deleted-node-read-refused
rules/knowledge-base/graph-item-flags
rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
rules/knowledge-base/graph-provenance-hides-compliance-deleted
rules/knowledge-base/graph-provenance-one-entry-per-chunk
rules/knowledge-base/graph-provenance-order
rules/knowledge-base/graph-read-as-of-view
rules/knowledge-base/graph-read-current-view
rules/knowledge-base/graph-read-in-effect-only
rules/knowledge-base/graph-read-shows-empty-provenance
rules/knowledge-base/history-order
rules/knowledge-base/lineage-history
rules/knowledge-base/link-type-listing-order
rules/knowledge-base/link-type-rules-on-request
rules/knowledge-base/merged-node-read-as-itself
rules/knowledge-base/node-listing-by-status
rules/knowledge-base/node-listing-name-prefix
rules/knowledge-base/node-listing-one-entry-per-node
rules/knowledge-base/node-listing-order
rules/knowledge-base/node-listing-total-before-pagination
rules/knowledge-base/node-read-alias-order
rules/knowledge-base/node-read-attribute-order
rules/knowledge-base/node-read-excludes-uncertain-on-request
rules/knowledge-base/node-type-filter-in-catalog
rules/knowledge-base/node-type-listing-order
rules/knowledge-base/node-view-defaults
rules/knowledge-base/point-reads-answer-any-status
rules/knowledge-base/traversal-check-order
rules/knowledge-base/traversal-defaults
rules/knowledge-base/traversal-direction
rules/knowledge-base/traversal-drops-merge-self-loops
rules/knowledge-base/traversal-expands-live-nodes
rules/knowledge-base/traversal-link-once
rules/knowledge-base/traversal-link-score
rules/knowledge-base/traversal-lists-reached-nodes
rules/knowledge-base/traversal-merged-start
rules/knowledge-base/traversal-order
rules/knowledge-base/traversal-skips-deleted-links
rules/knowledge-base/traversal-substitutes-merged-ends
```

Removed: none. The projections were re-derived (8 files).

### Impact set read

`spec.py --impact` over 39 entry nodes returned 176 nodes. The entry nodes were the graph and catalog elements, the status and flag enumerations, provenance, page, the search query, the retrieval contract, name-normalization, page-defaults, the expansion rules the traversal touches, the current, in-effect and effective-status rules, chunk-excerpt-is-verbatim, and all 10 constraints. They were read in full, along with uncertain-items-excluded-on-request, search-option-defaults, unknown-link-type-refused, attribute-key-for-node-type, node-type-in-catalog, closed-attribute-keys, merged-node-names-survivor, the catalog uniqueness rules, node-layer-skips-merged-and-deleted, empty-provenance-chain-refused, consolidation-records-provenance and one-canonical-alias.

### Decisions logged (9)

1. `rules/knowledge-base/node-listing-name-prefix.md` `statement`: a name prefix is read literally. The code lets `%` and `_` act as wildcards.
2. `rules/knowledge-base/node-read-alias-order.md` `statement`: the canonical alias comes first, then the other aliases alphabetically. The code's order follows the enum declaration.
3. `rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt.md` `statement`: a provenance entry shows the whole chunk excerpt. The code cuts the chunk text from `offset_start + 1` again.
4. `rules/knowledge-base/graph-provenance-hides-compliance-deleted.md` `statement`: a graph read shows no provenance entry from a compliance-deleted source. The code applies no such filter.
5. `rules/knowledge-base/traversal-lists-reached-nodes.md` `statement`: a traversal always lists its starting node. The code drops a merged start that has no usable survivor.
6. `contracts/knowledge-base/retrieval.md` `answers`: the node-type listing refuses unknown parameters on both transports. REST ignores them today.
7. `contracts/knowledge-base/retrieval.md` `answers`: the new operations carry the same authentication refusal as the other retrieval operations. The material does not show authentication.
8. `rules/knowledge-base/expansion-follows-both-directions.md` `statement`: narrowed to the search's expansion. A traversal follows the direction it names.
9. `rules/knowledge-base/expansion-skips-deleted-nodes.md` `statement`: narrowed to the search's expansion. A traversal lists the deleted nodes it reaches.

### Watch items (tensions with no case decided differently)

- **Duplicated view definitions.** `graph-read-as-of-view` and `expansion-as-of-view` state the same temporal filter, and only the graph rule names the supersession time. The search's expansion runs through the same traversal code.
- **Two decays.** `traversal-link-score` is 0.5 to the power h. The search's `expansion-decay` multiplies that by the matched node's score. These are different operations.
- **Empty provenance.** `graph-read-shows-empty-provenance` answers an assertion with no provenance with an empty list, while the provenance reads refuse an empty chain with a 500. This is also in tension with the anti-hallucination premise that every accepted assertion has provenance.
- **Allowed-value order.** `allowed-values-in-string-order` sorts allowed values by string, though an allowed value carries a `sort_order`.
- **Catalog snapshot.** A node type present in the store but absent from the startup catalog snapshot is listed yet refused as a filter. This was left as implementation, because the catalog changes only by migration plus restart.
- **Two query-surface constraints.** `llm-toolset-omits-fragment-listing` and `llm-toolset-omits-graph-point-reads` both describe the query tool surface. They could be merged into one.
- **As-of checks differ.** Search refuses an as-of date that is not a calendar date, while the graph reads check only its year-month-day form.
- **Deleted items differ by kind.** A deleted node is refused by the node read, while a deleted link or attribute is answered by its point read. These are different elements, so no case is decided twice.

### --shape over the 63 nodes written or changed

At or past p90: `llm-toolset-omits-graph-point-reads` (45w), `attribute-key` (109w, now carrying `version`), `graph-read-as-of-view` (60w). Shared phrases are covered by the watch items and by the two narrowings logged above. Prose naming siblings: none. Names held nowhere: none.

### What this increment may have put the delivered code in breach of

The analysis never reads the target. Decisions 1 to 6 each state a behavior different from what the survey shows the code doing. The reconciliation should find them as `contradicts`: the literal prefix, the alias order, the excerpt, the compliance filter on graph provenance, a merged start without a survivor, and the REST node-type listing ignoring parameters.

### Candidates for the reconciliation (the 63 nodes this increment wrote or changed)

```
contracts/knowledge-base/retrieval
domain/knowledge-base/attribute-key
domain/knowledge-base/link-type
domain/knowledge-base/node-alias
domain/knowledge-base/node-type
rules/knowledge-base/expansion-depth-bounds
rules/knowledge-base/expansion-restricted-to-named-link-types
rules/knowledge-base/name-normalization
rules/knowledge-base/page-defaults
rules/knowledge-base/unknown-link-type-refused
constraints/llm-toolset-omits-graph-point-reads
domain/knowledge-base/graph-read
domain/knowledge-base/node-filter
domain/knowledge-base/node-view
domain/knowledge-base/traversal-direction
domain/knowledge-base/traversal-request
rules/knowledge-base/allowed-values-in-string-order
rules/knowledge-base/attribute-key-history-check-order
rules/knowledge-base/attribute-key-history-requires-registered-key
rules/knowledge-base/attribute-key-history
rules/knowledge-base/attribute-key-listing-by-node-type
rules/knowledge-base/attribute-key-listing-order
rules/knowledge-base/deleted-node-read-refused
rules/knowledge-base/graph-item-flags
rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
rules/knowledge-base/graph-provenance-hides-compliance-deleted
rules/knowledge-base/graph-provenance-one-entry-per-chunk
rules/knowledge-base/graph-provenance-order
rules/knowledge-base/graph-read-as-of-view
rules/knowledge-base/graph-read-current-view
rules/knowledge-base/graph-read-in-effect-only
rules/knowledge-base/graph-read-shows-empty-provenance
rules/knowledge-base/history-order
rules/knowledge-base/lineage-history
rules/knowledge-base/link-type-listing-order
rules/knowledge-base/link-type-rules-on-request
rules/knowledge-base/merged-node-read-as-itself
rules/knowledge-base/node-listing-by-status
rules/knowledge-base/node-listing-name-prefix
rules/knowledge-base/node-listing-one-entry-per-node
rules/knowledge-base/node-listing-order
rules/knowledge-base/node-listing-total-before-pagination
rules/knowledge-base/node-read-alias-order
rules/knowledge-base/node-read-attribute-order
rules/knowledge-base/node-read-excludes-uncertain-on-request
rules/knowledge-base/node-type-filter-in-catalog
rules/knowledge-base/node-type-listing-order
rules/knowledge-base/node-view-defaults
rules/knowledge-base/point-reads-answer-any-status
rules/knowledge-base/traversal-check-order
rules/knowledge-base/traversal-defaults
rules/knowledge-base/traversal-direction
rules/knowledge-base/traversal-drops-merge-self-loops
rules/knowledge-base/traversal-expands-live-nodes
rules/knowledge-base/traversal-link-once
rules/knowledge-base/traversal-link-score
rules/knowledge-base/traversal-lists-reached-nodes
rules/knowledge-base/traversal-merged-start
rules/knowledge-base/traversal-order
rules/knowledge-base/traversal-skips-deleted-links
rules/knowledge-base/traversal-substitutes-merged-ends
rules/knowledge-base/expansion-follows-both-directions
rules/knowledge-base/expansion-skips-deleted-nodes
```

### Validator (final, verbatim)

```
specification sound: 61 element(s), 295 rule(s), 8 scenario(s), 3 contract(s), 11 constraint(s) across 2 context(s); 97 decision(s) disclosed, 2 location(s) retired
specification sound: 61 element(s), 295 rule(s), 8 scenario(s), 3 contract(s), 11 constraint(s) across 2 context(s); 97 decision(s) disclosed, 2 location(s) retired
projected 8 file(s) into specification/projections: capability-map.mmd, class-diagram-chat.mmd, class-diagram-knowledge-base.mmd, context-map.mmd, decisions-by-node.md, full-text.md, overview.md, state-knowledge-base-llm-run.mmd
```

### --ledger (verbatim, exit 0)

```
ledger sound: 251 fact line(s) over 3 material file(s) — 219 landed in 83 node(s), 32 left out with a reason
  file set: 28 file(s) the material read; candidates per file:
    src/modules/knowledge-graph/catalog/catalog.ts: 10
    src/modules/knowledge-graph/dto/attribute.dto.ts: 2
    src/modules/knowledge-graph/dto/catalog.dto.ts: 5
    src/modules/knowledge-graph/dto/enums.dto.ts: 8
    src/modules/knowledge-graph/dto/history.dto.ts: 2
    src/modules/knowledge-graph/dto/link.dto.ts: 2
    src/modules/knowledge-graph/dto/node.dto.ts: 2
    src/modules/knowledge-graph/dto/provenance.dto.ts: 1
    src/modules/knowledge-graph/dto/queries.dto.ts: 12
    src/modules/knowledge-graph/dto/traversal.dto.ts: 1
    src/modules/knowledge-graph/index.ts: 3
    src/modules/knowledge-graph/mcp/error-envelope.ts: 3
    src/modules/knowledge-graph/mcp/query-toolset.ts: 7
    src/modules/knowledge-graph/mcp/query-transport.ts: 0
    src/modules/knowledge-graph/repository/catalog.repository.ts: 8
    src/modules/knowledge-graph/repository/graph.repository.ts: 33
    src/modules/knowledge-graph/repository/temporal-filter.ts: 6
    src/modules/knowledge-graph/routes/knowledge-graph.routes.ts: 6
    src/modules/knowledge-graph/service/attribute.service.ts: 3
    src/modules/knowledge-graph/service/catalog.service.ts: 9
    src/modules/knowledge-graph/service/errors.ts: 1
    src/modules/knowledge-graph/service/formatters.ts: 10
    src/modules/knowledge-graph/service/history.service.ts: 7
    src/modules/knowledge-graph/service/link.service.ts: 3
    src/modules/knowledge-graph/service/node.service.ts: 15
    src/modules/knowledge-graph/service/norm.ts: 1
    src/modules/knowledge-graph/service/traversal.service.ts: 19
    src/modules/knowledge-graph/traversal/config.ts: 3
  1 file(s) no fact names; an adoption over this ledger hands them no judge and leaves them unbound: src/modules/knowledge-graph/mcp/query-transport.ts
  candidates, all: constraints/llm-toolset-omits-graph-point-reads constraints/retrieval-is-read-only constraints/retrieval-transports-answer-alike contracts/knowledge-base/retrieval domain/knowledge-base/alias-kind domain/knowledge-base/allowed-value domain/knowledge-base/assertion-flag domain/knowledge-base/assertion-status domain/knowledge-base/attribute-key domain/knowledge-base/effective-status domain/knowledge-base/knowledge-link domain/knowledge-base/link-type domain/knowledge-base/link-type-rule domain/knowledge-base/node-alias domain/knowledge-base/node-attribute domain/knowledge-base/node-filter domain/knowledge-base/node-status domain/knowledge-base/node-type domain/knowledge-base/node-view domain/knowledge-base/search-layer domain/knowledge-base/source-type domain/knowledge-base/traversal-direction domain/knowledge-base/traversal-request domain/knowledge-base/valid-from-basis domain/knowledge-base/value-type rules/knowledge-base/allowed-value-unique-per-key rules/knowledge-base/allowed-values-in-string-order rules/knowledge-base/attribute-key-history rules/knowledge-base/attribute-key-history-check-order rules/knowledge-base/attribute-key-history-requires-registered-key rules/knowledge-base/attribute-key-listing-by-node-type rules/knowledge-base/attribute-key-listing-order rules/knowledge-base/attribute-key-unique-per-node-type rules/knowledge-base/current-assertion rules/knowledge-base/deleted-node-read-refused rules/knowledge-base/effective-status rules/knowledge-base/expansion-depth-bounds rules/knowledge-base/expansion-restricted-to-named-link-types rules/knowledge-base/graph-item-flags rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt rules/knowledge-base/graph-provenance-hides-compliance-deleted rules/knowledge-base/graph-provenance-one-entry-per-chunk rules/knowledge-base/graph-provenance-order rules/knowledge-base/graph-read-as-of-view rules/knowledge-base/graph-read-current-view rules/knowledge-base/graph-read-in-effect-only rules/knowledge-base/graph-read-shows-empty-provenance rules/knowledge-base/history-order rules/knowledge-base/in-effect-assertion rules/knowledge-base/lineage-history rules/knowledge-base/link-type-listing-order rules/knowledge-base/link-type-name-unique rules/knowledge-base/link-type-rules-on-request rules/knowledge-base/merged-node-read-as-itself rules/knowledge-base/name-normalization rules/knowledge-base/node-listing-by-status rules/knowledge-base/node-listing-name-prefix rules/knowledge-base/node-listing-one-entry-per-node rules/knowledge-base/node-listing-order rules/knowledge-base/node-listing-total-before-pagination rules/knowledge-base/node-read-alias-order rules/knowledge-base/node-read-attribute-order rules/knowledge-base/node-read-excludes-uncertain-on-request rules/knowledge-base/node-type-filter-in-catalog rules/knowledge-base/node-type-listing-order rules/knowledge-base/node-type-name-unique rules/knowledge-base/node-view-defaults rules/knowledge-base/page-defaults rules/knowledge-base/page-limit-bounds rules/knowledge-base/page-offset-non-negative rules/knowledge-base/point-reads-answer-any-status rules/knowledge-base/traversal-check-order rules/knowledge-base/traversal-defaults rules/knowledge-base/traversal-direction rules/knowledge-base/traversal-drops-merge-self-loops rules/knowledge-base/traversal-expands-live-nodes rules/knowledge-base/traversal-link-once rules/knowledge-base/traversal-link-score rules/knowledge-base/traversal-lists-reached-nodes rules/knowledge-base/traversal-merged-start rules/knowledge-base/traversal-order rules/knowledge-base/traversal-skips-deleted-links rules/knowledge-base/traversal-substitutes-merged-ends
```

`--ledger` refused nothing on its first run.

Left out, grouped by reason:
- Implementation knowledge: a fallback for a timestamp the store always holds. (1: service.md:85)
- The expansion simply has nothing further to reach; no node states when its loop ends. (2: service.md:102, storage.md:82)
- Implementation knowledge: which item kind a batched provenance read is issued for. (2: service.md:131, storage.md:100)
- Implementation knowledge: which layer computes each read; what the read holds is stated by its own rules. (1: service.md:135)
- Implementation knowledge: the catalog is checked against a snapshot loaded at startup. (4: service.md:136, boundary.md:99, boundary.md:111, boundary.md:155)
- Implementation knowledge: the catalog listings read the stored catalog. (1: service.md:137)
- Wiring: the MCP handler catches every thrown value; what each failure answers is the contract's. (1: boundary.md:38)
- A coercion quirk of the parameter parser; an empty limit read as 0 is then refused by the page bound. (1: boundary.md:46)
- Transport shape: how the MCP input spells the parameters REST splits between path and query. (1: boundary.md:50)
- Which issues one refusal lists follows each transport's parsing order; both transports answer the same code. (2: boundary.md:77, boundary.md:78)
- The answer is the shared MCP transport kernel's, which this context does not decide. (4: boundary.md:115, boundary.md:132, boundary.md:133, boundary.md:158)
- Transport wording and schema derivation that introduce a tool to its caller, not a domain fact. (1: boundary.md:116)
- Shared error mapping, which this context does not decide. (1: boundary.md:157)
- Wiring: the shared tool registry. (1: boundary.md:159)
- Wiring: the traversal is exported for the search expansion to reuse. (1: boundary.md:160)
- Implementation knowledge: how the snapshot holds the rules in memory. (1: storage.md:19)
- Implementation knowledge: a repository read; what each operation does with what it reads is held by that operation's rules. (1: storage.md:37)
- Implementation knowledge: a batched read issued once per operation. (2: storage.md:38, storage.md:70)
- The listing's only guard against deleted attributes is the supersession time, which the current and as-of views already require. (1: storage.md:54)
- Security: the filter's guard against an unsafe table qualifier, which no caller reaches. (1: storage.md:92)
- This system's own storage, which its implementation chose. (2: storage.md:105, storage.md:107)

### Handoff (Step 4)

```
/siegard:reconcile adoption; slug adopt-knowledge-graph; ledger siegard-survey/adopt-knowledge-graph/ledger.md; outside: none; certifications: none
```
(219 fact lines landed in 83 nodes and 32 were left out. The file set is 28 files. `mcp/query-transport.ts` has no candidate.)

**STOP (Step 3).** The owner reviews `git diff -- specification` and commits with pathspec `specification siegard-survey/adopt-knowledge-graph`.
