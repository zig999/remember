---
contract_version: siegard-reconcile/8
title: Re-read of query-retrieval and knowledge-graph files left stamped against earlier node text
summary: The source did not change; the nodes bound to these eight files moved in the specification, or
  were restamped on sibling files by comment-route-qr-8ab81f9, and nobody had read these files against
  the text as it now stands. The owner states the source is correct; this reconciliation asks whether
  each bound node still holds what the file carries.
target: backend
files:
- path: src/modules/knowledge-graph/dto/attribute.dto.ts
  change: Declares the attribute detail response shape; unchanged, read again against the node's current
    text.
- path: src/modules/knowledge-graph/dto/link.dto.ts
  change: Declares the link detail response shape; unchanged, read again against the node's current text.
- path: src/modules/query-retrieval/dto/fragment.dto.ts
  change: Validates the accepted-fragment listing query and its page defaults; unchanged, read again against
    the node's current text.
- path: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  change: Selects accepted fragments by run or raw information, excluding compliance-deleted sources;
    unchanged, read again against the node's current text.
- path: src/modules/query-retrieval/repository/provenance.repository.ts
  change: Queries provenance chains, existence of links and attributes, and compliance tombstones; unchanged,
    read again against the node's current text.
- path: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  change: Exposes the retrieval routes and maps their refusals; unchanged, read again against the node's
    current text.
- path: src/modules/query-retrieval/service/errors.ts
  change: Declares the retrieval refusals with their codes and statuses; unchanged, read again against
    the node's current text.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Reads a link's, an attribute's or a fragment's provenance chain and refuses a compliance-deleted
    source; unchanged, read again against the node's current text.
nodes:
- node: contracts/knowledge-base/retrieval
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at The five error classes: InvalidSearchQueryError
    (422, BUSINESS_INVALID_SEARCH_QUERY), InvalidSearchLayerError (422, BUSINESS_INVALID_SEARCH_LAYER,
    carrying the allowed layers), FragmentNotAcceptedError (404, BUSINESS_FRAGMENT_NOT_ACCEPTED), RawInformationDeletedError
    (410, BUSINESS_RAW_INFORMATION_DELETED, carrying the raw information id and deletion time) and EmptyProvenanceError
    (500, SYSTEM_INTERNAL_ERROR). Each status/code pair matches the contract''s refusal answers. The one
    departure is the layer vocabulary, reported in the finding above. — public readonly statusCode = 422;
    public readonly code = "BUSINESS_INVALID_SEARCH_QUERY" as const; public readonly code = "BUSINESS_INVALID_SEARCH_LAYER"
    as const; public readonly statusCode = 404; public readonly code = "BUSINESS_FRAGMENT_NOT_ACCEPTED"
    as const; public readonly statusCode = 410; public readonly code = "BUSINESS_RAW_INFORMATION_DELETED"
    as const; public readonly statusCode = 500; public readonly code = "SYSTEM_INTERNAL_ERROR" as const;'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/accepted-fragment-filter
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/query-retrieval/dto/fragment.dto.ts,
    src/modules/query-retrieval/repository/accepted-fragments.repository.ts, and src/modules/query-retrieval/routes/query-retrieval.routes.ts
    read `nowhere` — This file declares no shape for the filter. It parses the query with the imported
    `ListAcceptedFragmentsQuerySchema` and forwards an object literal, `{ llm_run_id: query.llm_run_id,
    raw_information_id: query.raw_information_id, limit: query.limit, offset: query.offset }`, to `listAcceptedFragmentsService`.
    The shape is declared in `backend/src/modules/query-retrieval/dto/fragment.dto.ts`, where `llm_run_id`
    and `raw_information_id` are `z.string().uuid().optional()`. — a binding asserts the file answers
    for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never restamped
    here'
  observed_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "src/modules/query-retrieval/repository/accepted-fragments.repository.ts: held at the NOT EXISTS\
    \ subselect inside FILTER_WHERE, shared by the count and the page query — AND NOT EXISTS (\n     \
    \    SELECT 1 FROM compliance_deletion cd\n          WHERE cd.raw_information_id = r.id\n       )\n\
    src/modules/query-retrieval/repository/provenance.repository.ts: held at findTombstone() together\
    \ with the partial row shape TombstoneRow (lines 192-214). It selects `executed_at` from `compliance_deletion`,\
    \ bound to `raw_information_id`, and returns the earliest row. — `SELECT raw_information_id, executed_at\
    \ AS performed_at\n       FROM compliance_deletion\n      WHERE raw_information_id = ANY($1::uuid[])\n\
    \      ORDER BY executed_at ASC\n      LIMIT 1`\nsrc/modules/query-retrieval/service/provenance.service.ts:\
    \ held at finalise(), lines 75-92: the tombstone lookup over the chain's raw informations, and the\
    \ refusal it throws before the empty-chain check. — const tombstone = await findTombstone(client,\
    \ rawIds);\n  if (tombstone !== null) {\n    ...\n    throw new RawInformationDeletedError(\n    \
    \  tombstone.raw_information_id,\n      tombstone.performed_at\n    );\n  }"
  encoded_at:
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/knowledge-link
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/knowledge-graph/dto/link.dto.ts, src/modules/query-retrieval/service/provenance.service.ts,
    and src/modules/query-retrieval/repository/provenance.repository.ts read `nowhere. The file declares
    no shape for the element. It only checks that a row exists (linkExists) and anchors the chain on `p.link_id`.
    Its `status`, `provenance` and temporal attributes are not read here.` — `SELECT EXISTS(SELECT 1 FROM
    knowledge_link WHERE id = $1) AS exists` — a binding asserts the file answers for the node, so the
    pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/knowledge-graph/dto/link.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/knowledge-graph/dto/attribute.dto.ts,
    src/modules/query-retrieval/service/provenance.service.ts, and src/modules/query-retrieval/repository/provenance.repository.ts
    read `nowhere. The file declares no shape for the element. It only checks that a row exists (attributeExists)
    and anchors the chain on `p.attribute_id`.` — `SELECT EXISTS(SELECT 1 FROM node_attribute WHERE id
    = $1) AS exists` — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/knowledge-graph/dto/attribute.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/page-defaults
  conforms: true
  how: "src/modules/query-retrieval/dto/fragment.dto.ts: held at the `.default(20)` on `limit` and the\
    \ `.default(0)` on `offset` in ListAcceptedFragmentsQuerySchema (lines 33-36) — limit: IntegerQuery.pipe(z.number().int().min(1).max(100))\n\
    \  .optional()\n  .default(20),\noffset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),"
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
- node: rules/knowledge-base/unknown-link-type-refused
  conforms: true
  how: 'src/modules/query-retrieval/routes/query-retrieval.routes.ts: held at `isMappableSearchError`
    and `handleSearchError` (lines 200-221). The `GET /search` catch block turns the refusal into a response.
    The throw itself is in `backend/src/modules/query-retrieval/service/search.service.ts` line 453, not
    in this file. — `err instanceof UnknownLinkTypeError` inside `isMappableSearchError`, and then `const
    { statusCode, envelope } = mapErrorToHttpResponse(err); return reply.status(statusCode).send(envelope);`.
    The shared mapper in `error-envelope.ts` turns `UnknownLinkTypeError` into a 422 with `details: {
    link_type: err.linkType, ...extraDetails }`.'
  encoded_at:
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
restates:
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: the docstring above ListAcceptedFragmentsQuerySchema, lines 27-28 (the last bullet)
  evidence: '" * - `limit` is `[1..100]`, default `20`; `offset >= 0`, default `0` — *   mirrors `SearchQuerySchema`."'
  cost: The page defaults (20 and 0) are written a second time as prose beside the schema that enforces
    them, so a later reader can take the comment for where the default is decided. If the default moves
    in the node, the comment is not reached by `--check` and keeps saying the old number.
  node: rules/knowledge-base/page-defaults
- file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  where: header comment, lines 12-13 (the tombstone short-circuit bullet)
  evidence: //   - `NOT EXISTS (SELECT 1 FROM compliance_deletion cd //                  WHERE cd.raw_information_id
    = r.id)` — tombstone short-circuit.
  cost: The exclusion of compliance-deleted sources is narrated in a comment that cites back-spec BR-14
    as its authority. The running code holds the exclusion in FILTER_WHERE, so the comment is a second
    home for the fact.
  node: domain/knowledge-base/compliance-deletion
- file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  where: header comment, lines 8-11 (the "Filter" list, LLM run and raw information predicates)
  evidence: //   - `($1::uuid IS NULL OR f.llm_run_id = $1)` //   - `($2::uuid IS NULL OR r.id = $2)`
  cost: The narrowing to an LLM run, a raw information or both is described in prose and applied in FILTER_WHERE.
    A reader who finds the comment will treat it as a second statement of the filter. If the filter changes,
    the code moves and the comment is left saying the old thing.
  node: domain/knowledge-base/accepted-fragment-filter
- file: src/modules/query-retrieval/repository/provenance.repository.ts
  where: the comment inside findTombstone(), lines 202-204
  evidence: // The physical column is `executed_at` (compliance_deletion is owned by the // compliance-audit
    domain — its schema is authoritative). The alias keeps // the `performed_at` name this domain's spec
    uses for the 410 mapping.
  cost: The comment states the compliance deletion's execution-time attribute (`executed_at`) as prose.
    The SQL on line 206 holds that attribute itself, so the prose is a second home outside behavior. It
    also says the spec "uses" the name `performed_at`. A search of the specification's full text finds
    no `performed_at`, so a reader following the comment looks in the specification for a name it does
    not hold.
  node: domain/knowledge-base/compliance-deletion
pairs_omitted:
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/listing-requires-a-filter
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/query-retrieval/dto/fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/source-type
  file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/listing-holds-accepted-only
  file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/listing-one-entry-per-fragment
  file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/listing-total-before-pagination
  file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/listing-for-unknown-source-is-empty
  file: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/source-type
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-offsets-count-code-points
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/provenance-in-recording-order
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-read-only
  file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-transports-answer-alike
  file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/empty-provenance-chain-refused
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-layer-outside-set-refused
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-length
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-must-parse
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-query-not-blank
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/errors.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/retrieval
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/fragment-status
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-chunk
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 8 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/qr-moved-followup.returns/.

  A finding in src/modules/query-retrieval/service/errors.ts names domain/knowledge-base/search-layer,
  which no file of this set is bound to: InvalidSearchLayerError, the `allowed` field declaration (line
  28): public readonly allowed = ["fragment", "node", "chunk"] as const; — The search-layer vocabulary
  is declared a second time here. The first declaration is ALLOWED_LAYERS in backend/src/modules/query-retrieval/dto/search.dto.ts
  (line 101), which search.service.ts reads to decide what to refuse. The specification holds the vocabulary
  once, as the enumeration domain/knowledge-base/search-layer with values fragment, node and chunk. If
  a layer is added or removed, the refusal will keep telling the caller the old list unless someone finds
  this file. The node does not reach this file, so `--check` will not flag it. Nothing here reads the
  validating list, so the two can disagree without anyone deciding which one is right.. It blocks nothing
  here; it is owed a route of its own.

  Candidates: 5 opened across 1 of 8 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 4 place(s) where text in the source restates a node''s fact the code holds, over 3 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/qr-moved-followup.returns/`, which are the evidence behind every entry above.
