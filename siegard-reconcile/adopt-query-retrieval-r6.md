---
contract_version: siegard-reconcile/8
title: Adoption of the query-retrieval search DTO and provenance service (context query-retrieval), r6
summary: The query-retrieval search DTO and provenance service are source no delivery wrote; the human
  states they are adopted as they stand and did not change. The candidates are the four nodes r5b found
  restated in the MCP toolset's descriptions and held by no file of that set, whose facts that judge located
  in these two files.
target: backend
files:
- path: src/modules/query-retrieval/dto/search.dto.ts
  change: Behaves as before — nothing in it changed; adopted as it stands.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Behaves as before — its source comments were removed by the comment route (8ab81f9) and no code
    changed; adopted as it stands.
nodes:
- node: rules/knowledge-base/expansion-depth-bounds
  conforms: true
  how: 'src/modules/query-retrieval/dto/search.dto.ts: held at SearchQuerySchema.expand_depth, line 65
    — expand_depth: IntegerQuery.pipe(z.number().int().min(1).max(3))'
  encoded_at:
  - src/modules/query-retrieval/dto/search.dto.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: true
  how: 'src/modules/query-retrieval/dto/search.dto.ts: held at SearchQuerySchema.limit, line 69 — limit:
    IntegerQuery.pipe(z.number().int().min(1).max(100))'
  encoded_at:
  - src/modules/query-retrieval/dto/search.dto.ts
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  conforms: true
  how: 'src/modules/query-retrieval/service/provenance.service.ts: held at finalise(), lines 75-92. It
    looks up a tombstone across every raw information id in the chain and throws before anything is returned.
    All three anchor routes (link, attribute, fragment) go through finalise. — const tombstone = await
    findTombstone(client, rawIds); if (tombstone !== null) { ... throw new RawInformationDeletedError('
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  conforms: true
  how: "src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByFragmentService(),\
    \ lines 56-62. The fragment's status is read and a non-accepted fragment is refused before the chain\
    \ is read. — if (fragment.status !== \"accepted\") {\n  throw new FragmentNotAcceptedError(fragmentId,\
    \ fragment.status);\n}"
  encoded_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/source-type
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/provenance.service.ts read
    `nowhere in this file. The file only calls toSourceType(c.source_type) inside groupChain (line 153).
    The enumeration itself is declared in dto/response.dto.ts, which is outside the file set.` — source_type:
    toSourceType(c.source_type),'
  observed_at:
  - src/modules/query-retrieval/service/provenance.service.ts
restates:
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: The docblock above QueryString (lines 37-47), bullet "btrim non-empty after transform (rejects
    whitespace-only input)"
  evidence: '*   - btrim non-empty after transform (rejects whitespace-only input)'
  cost: The rule that a blank query is refused is restated in prose beside the code that enforces it,
    as `.transform((s) => s.trim()).refine((s) => s.length > 0, ...)`. The comment also cites "BR-04 of
    the back spec" as the authority, which points a reader to a document other than the node.
  node: rules/knowledge-base/search-query-not-blank
- file: src/modules/query-retrieval/dto/search.dto.ts
  where: The docblock above QueryString (lines 37-47), first bullets "min 1 char (raw)" and "max 1000
    chars (raw)"
  evidence: "* `query` validation per BR-04 of the back spec:\n *   - min 1 char (raw)\n *   - max 1000\
    \ chars (raw)"
  cost: 'The 1000-character ceiling is written a second time in prose beside the code that enforces it,
    as `.max(1000, { message: "query exceeds 1000 characters" })`. If the node''s limit moves, the comment
    still reads as a decided limit, and a reader can take it for the source of the number instead of the
    node.'
  node: rules/knowledge-base/search-query-length
adopted: true
pairs_omitted:
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-defaults
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-query-not-blank
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/retrieval
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/fragment-status
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/knowledge-link
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-attribute
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/raw-chunk
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/raw-information
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/compliance-refusal-takes-precedence
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/empty-provenance-chain-refused
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
notes: 'Judged by 2 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-query-retrieval-r6.returns/.

  Staged as an adoption of source no delivery wrote: 4 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 3 opened across 2 of 2 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 2 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-query-retrieval-r6.returns/`, which are the evidence behind every entry above.
