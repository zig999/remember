---
contract_version: siegard-reconcile/8
title: Adoption of the query-retrieval MCP toolset file (context query-retrieval), r5b
summary: The query-retrieval MCP toolset file is source no delivery wrote; the human states it is adopted
  as it stands and did not change. It re-runs the discarded r5 under plugin 4.21.2, with the same four
  nodes whose facts r2 found restated in this file's emitted tool descriptions as the candidates.
target: backend
files:
- path: src/modules/query-retrieval/mcp/query-toolset.ts
  change: Behaves as before — nothing in it changed; adopted as it stands.
nodes: []
restates:
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: QueryRetrievalToolDescriptions.get_provenance_fragment, lines 146-147
  evidence: '"InformationFragment id. 404 if missing or if the fragment is not in " + "status=''accepted'';
    410 if any underlying raw is tombstoned."'
  cost: The accepted-only condition is restated in description prose. The code that holds it is `if (fragment.status
    !== "accepted") { throw new FragmentNotAcceptedError(...) }` in `service/provenance.service.ts`. If
    the condition changes there, the tool description stays behind.
  node: rules/knowledge-base/provenance-requires-accepted-fragment
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: QueryRetrievalToolDescriptions.get_provenance_link, get_provenance_attribute and get_provenance_fragment,
    lines 138-139, 142-143 and 147
  evidence: '"for a KnowledgeLink id. 404 if missing; 410 if any underlying raw is " + "tombstoned by
    a compliance delete."'
  cost: The refusal after a compliance deletion is stated three times in description prose. No code in
    this file refuses anything. The refusal is decided in `service/provenance.service.ts` (`findTombstone(client,
    rawIds)` and the `tombstone !== null` branch). A reader of the tool list takes the description for
    the rule's home.
  node: rules/knowledge-base/provenance-refused-after-compliance-deletion
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: QueryRetrievalToolDescriptions.search, line 134, the `expand_depth` (1..3) clause
  evidence: '"`in_effect_only`, `include_uncertain`, `expand`, `expand_depth` (1..3), "'
  cost: The 1..3 bound is spelled in prose served over `tools/list`, and no code in this file enforces
    it. The enforcing code is `.min(1).max(3)` in `dto/search.dto.ts`. If the node or the DTO moves, this
    description keeps saying 1..3, and `--check` never reaches it because it is text and not code.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: QueryRetrievalToolDescriptions.search, line 135, the `limit` (max 100) clause
  evidence: '"`expand_link_types[]`. Pagination via `limit` (max 100) and `offset`."'
  cost: The page-limit ceiling is restated as prose in a description served to MCP callers. The enforcing
    code is `.min(1).max(100)` in `dto/search.dto.ts`. If the ceiling changes there, the served description
    goes on advertising 100.
  node: rules/knowledge-base/page-limit-bounds
adopted: true
unheld:
- node: rules/knowledge-base/expansion-depth-bounds
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/page-limit-bounds
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
pairs_omitted:
- node: constraints/retrieval-is-read-only
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/mcp/query-toolset.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 1 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-query-retrieval-r5b.returns/.

  Staged as an adoption of source no delivery wrote: 4 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 0 opened across 0 of 1 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 4 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-query-retrieval-r5b.returns/`, which are the evidence behind every entry above.
