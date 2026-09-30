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
