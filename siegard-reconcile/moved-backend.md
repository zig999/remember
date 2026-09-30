---
contract_version: siegard-reconcile/8
title: Re-read of fourteen backend files stamped against earlier node text
summary: The source did not change; the nodes bound to these files moved in the specification since they
  were stamped, or were restamped on sibling files by a later bind. The owner states the source is correct;
  this reconciliation asks whether each bound node still holds what the file carries as the node now reads.
target: backend
files:
- path: src/modules/ingestion/catalog/catalog.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/ingestion/mcp/mcp-schemas.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/ingestion/prompts/extraction.v1.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/ingestion/service/entity-resolution.service.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/ingestion/service/propose-attribute.service.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/ingestion/validation/structural.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/ingestion/validation/temporal.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/knowledge-graph/dto/attribute.dto.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/knowledge-graph/dto/link.dto.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/knowledge-graph/dto/queries.dto.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/query-retrieval/dto/search.dto.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/query-retrieval/repository/provenance.repository.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
- path: src/modules/query-retrieval/service/search.service.ts
  change: Unchanged; carries the same behavior as when bound, read again against the current text of the
    nodes bound to it.
nodes:
- node: domain/knowledge-base/attribute-key
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/catalog/catalog.ts, and
    src/modules/ingestion/prompts/extraction.v1.ts read `nowhere` — The file declares no shape for AttributeKey.
    It only reads fields of the catalog''s row, in `system()`: "`${ak.key} (${ak.value_type}${ak.is_temporal
    ? ", temporal" : ""}${valuesSuffix})`" with "const domain = domainOf(catalog, ak.id);". The shape
    is declared where `CatalogSnapshot` is defined, in catalog.ts.; src/modules/ingestion/service/propose-attribute.service.ts
    read `nowhere. This file only reads the attribute_key shape (resolvedKey.node_type_id, .value_type,
    .requires_valid_from, .id) from the catalog snapshot and declares no shape of its own.` — const attrKey
    = deps.catalog.attributeKeyByNodeTypeAndKey.get(attributeKeyCacheKey(nodeTypeId!, args.key)); const
    resolvedKey = attrKey!; — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/catalog/catalog.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
- node: domain/knowledge-base/knowledge-link
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/knowledge-graph/dto/link.dto.ts, src/modules/query-retrieval/repository/provenance.repository.ts,
    and src/modules/query-retrieval/service/provenance.service.ts read `nowhere` — The file declares no
    shape of a KnowledgeLink. getProvenanceByLinkService only passes a link id to the repository and groups
    the rows that come back: `const exists = await linkExists(client, linkId);` and `const rows = await
    chainByLink(client, linkId);`. The provenance shape it fills (`ProvenanceResponse`, `ProvenanceFragment`,
    `ProvenanceChunk`) is imported from "../dto/response.dto.js", and the chain row type (`ProvenanceChainRow`)
    is imported from "../repository/provenance.repository.js". This file reads the provenance field of
    a shape declared in other files. — a binding asserts the file answers for the node, so the pair that
    stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/knowledge-graph/dto/link.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/link-type
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/catalog/catalog.ts, and
    src/modules/ingestion/prompts/extraction.v1.ts read `nowhere` — The file declares no LinkType shape.
    It only maps fields of the catalog''s rows: "name: lt.name, temporal: lt.is_temporal, allowsMultipleCurrent:
    lt.allows_multiple_current, requiresValidFrom: lt.requires_valid_from". — a binding asserts the file
    answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never
    restamped here'
  observed_at:
  - src/modules/ingestion/catalog/catalog.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: domain/knowledge-base/node-alias
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/mcp/mcp-schemas.ts read `nowhere` — The
    node declares the NodeAlias shape (alias, kind: alias-kind, created_at, reference to llm-run). This
    file declares no such shape. The only alias-related construct is a field of the directed-ingestion
    node item, which passes alias surface forms along: `aliases: z.array(z.string().min(1).max(500)).optional()`.
    It has no kind, no created_at and no llm-run reference, so it is a value passed along, not the element''s
    shape. The alias row shape is therefore held in another file.; src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — This file does not declare the shape of a node alias. It only inserts rows: `INSERT
    INTO node_alias (node_id, alias, kind, created_by_run_id) VALUES ($1, $2, ''alias'', $3) ON CONFLICT
    DO NOTHING`. The only types it declares are TrigramCandidate, ResolveOrCreateNodeArgs and Decision,
    none of which is the alias element. The values it writes, ''canonical'' and ''alias'', and the run
    reference `created_by_run_id` agree with the node''s attributes.'
  observed_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: false
  how: 'src/modules/knowledge-graph/dto/attribute.dto.ts, line 30, the `valid_from_source` field of AttributeDetailResponseSchema:
    valid_from_source: ValidFromSourceSchema.nullable().optional(), — The node names this attribute `valid_from_basis`,
    typed `valid-from-basis`. This schema declares the same fact as `valid_from_source`, typed `ValidFromSourceSchema`.
    A reader who searches the code for the node''s attribute name will not find it in this shape. The
    wire name and the domain name can also drift apart with no record of which one the business decided.
    Every other attribute in this schema uses the node''s own name: value, status, recorded_at, valid_from,
    valid_to, confidence, superseded_at, provenance.'
  observed_at:
  - src/modules/knowledge-graph/dto/attribute.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-type
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/catalog/catalog.ts, and
    src/modules/ingestion/prompts/extraction.v1.ts read `nowhere` — The file declares no NodeType shape.
    It only maps fields of the catalog''s rows: ".map((nt) => ({ name: nt.name, description: nt.description
    }))". — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/catalog/catalog.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
- node: rules/knowledge-base/attribute-value-in-allowed-values
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at The `valuesSuffix` construct in `system()`,\
    \ lines 106-112, in the text the system emits. It lists each closed-domain key's allowed values. The\
    \ gate that refuses other values is `assertValueInDomain` in structural.ts. — \"`domain !== null ?\
    \ `, values: [${[...domain].sort().map((v) => JSON.stringify(v)).join(\",\")}]` : \"\"\"\nsrc/modules/ingestion/service/propose-attribute.service.ts:\
    \ held at the closed-domain branch, lines 93-96. The file obtains the key's allowed set and calls\
    \ the rejecting assertion on the proposed value. The comparison itself sits in validation/structural.ts.\
    \ — const domain = domainOf(deps.catalog, resolvedKey.id); if (domain !== null) {\n  assertValueInDomain(args.value,\
    \ domain);\n}\nsrc/modules/ingestion/validation/structural.ts: held at assertValueInDomain(value,\
    \ domain), lines 109-125. It is the exact-match gate, and it raises VALIDATION_INVALID_FORMAT with\
    \ the sorted allowed values on a miss. — export function assertValueInDomain(\n  value: string,\n\
    \  domain: ReadonlySet<string>\n): void {\n  if (domain.has(value)) {\n    return;\n  }\n  const allowed_values\
    \ = [...domain].sort();\n  throw new ValidationFailure(\n    \"VALIDATION_INVALID_FORMAT\",\n    \"\
    attribute value not in closed domain\",\n    { value, allowed_values }\n  );\n}"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/expansion-depth-bounds
  conforms: true
  how: 'src/modules/query-retrieval/dto/search.dto.ts: held at SearchQuerySchema.expand_depth, lines 65-67
    — expand_depth: IntegerQuery.pipe(z.number().int().min(1).max(3))'
  encoded_at:
  - src/modules/query-retrieval/dto/search.dto.ts
- node: rules/knowledge-base/expansion-follows-both-directions
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at The traverseNodes call in step\
    \ (g), \"Graph expansion (BR-13)\". It passes `direction: \"both\"`. The fan-out over the two ends\
    \ is in knowledge-graph/service/traversal.service.ts, which takes `\"out\" | \"in\" | \"both\"`. —\
    \ const traversal = await traverseNodes(\n  client,\n  {\n    startingNodeIds: startingIds,\n    direction:\
    \ \"both\",\n    linkTypeIds,"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at resolveLinkTypeIds() and the `linkTypeIds`\
    \ computed in step (b). That value is forwarded to traverseNodes in step (g). The filter itself is\
    \ applied in knowledge-graph/repository/graph.repository.ts, where the `filter.linkTypeIds` branch\
    \ (line 400) adds the restriction. This file decides when the restriction applies and hands it on.\
    \ — const linkTypeIds = input.expand\n  ? resolveLinkTypeIds(catalog, input.expandLinkTypes)\n  :\
    \ undefined;\n...\nlinkTypeIds,\ndepth: input.expandDepth,"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/name-normalization
  conforms: true
  how: "src/modules/ingestion/service/entity-resolution.service.ts: held at The exact-match query of resolveOrCreateNode\
    \ (lines 131-139) and the trigram candidate query (lines 156-166). The lock-key query (lines 119-122)\
    \ also runs the name through norm(). The normalization itself is the database function `norm`, which\
    \ this file calls and does not define. — WHERE na.alias_norm = norm($1::text)\n        AND kn.node_type_id\
    \ = $2\n        AND kn.status = 'active'\n...\nAND na.alias_norm % norm($1::text)"
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: rules/knowledge-base/page-defaults
  conforms: true
  how: "src/modules/knowledge-graph/dto/queries.dto.ts: held at ListNodesQuerySchema (lines 61-71), the\
    \ `.default(20)` on `limit` and the `.default(0)` on `offset`. This is the node-listing part of the\
    \ node. The other listings it names (search, accepted-fragment, review queue) are not in this file.\
    \ — limit: IntegerQuery.pipe(z.number().int().min(1).max(100))\n  .optional()\n  .default(20),\noffset:\
    \ IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),\nsrc/modules/query-retrieval/dto/search.dto.ts:\
    \ held at SearchQuerySchema.limit and SearchQuerySchema.offset defaults, lines 69-72 — limit: IntegerQuery.pipe(z.number().int().min(1).max(100))\n\
    \    .optional()\n    .default(20),\n  offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),"
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
  - src/modules/query-retrieval/dto/search.dto.ts
- node: rules/knowledge-base/stated-start-requires-basis
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at The \"Dates\" section of the SYSTEM prompt\
    \ and the worked example in `system()`, lines 160-167 and 207-210, in the text the system emits. —\
    \ \"- Justify it with `valid_from_basis`: `stated` only when the start date is\", and \"confidence:0.9,\
    \ fragment_ids:[F1], valid_from:\\\"2026-06-11\\\", valid_from_basis:\\\"document\\\"}\"\nsrc/modules/ingestion/service/propose-attribute.service.ts:\
    \ held at the validateTemporal call, lines 147-156. The file passes the stated start and its basis\
    \ to the temporal layer, and forwards the resolved pair to consolidateAttribute. The refusal itself\
    \ is in validation/temporal.ts. — const resolvedTemporal = validateTemporal({\n  valid_from: args.valid_from\
    \ ?? null,\n  valid_to: args.valid_to ?? null,\n  valid_from_basis: args.valid_from_basis ?? null,\n\
    src/modules/ingestion/validation/temporal.ts: held at validateTemporal(), the guard at lines 136-142\
    \ — if (input.valid_from !== null && input.valid_from_basis === null) { throw new ValidationFailure(\"\
    BUSINESS_DATE_UNJUSTIFIED\", \"valid_from supplied without a valid_from_basis (stated | document |\
    \ received).\", { valid_from: input.valid_from } ); }"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/temporal.ts
- node: rules/knowledge-base/unknown-link-type-refused
  conforms: true
  how: "src/modules/query-retrieval/service/search.service.ts: held at resolveLinkTypeIds(), which throws\
    \ UnknownLinkTypeError for a name the catalog snapshot does not hold. Step (b) calls it only when\
    \ `input.expand` is true, which matches \"A search query that expands\". — const row = catalog.linkTypeByName.get(name);\n\
    if (row === undefined) {\n  throw new UnknownLinkTypeError(name);\n}"
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/validity-start-before-end
  conforms: true
  how: "src/modules/ingestion/service/propose-attribute.service.ts: held at the validateTemporal call,\
    \ lines 147-156. The file passes both valid_from and valid_to to the temporal layer, and the strict\
    \ start-before-end check is in validation/temporal.ts. — const resolvedTemporal = validateTemporal({\n\
    \  valid_from: args.valid_from ?? null,\n  valid_to: args.valid_to ?? null,\nsrc/modules/ingestion/validation/temporal.ts:\
    \ held at validateTemporal(), the semi-open interval check at lines 106-115 — if (input.valid_from\
    \ !== null && input.valid_to !== null) { if (input.valid_from >= input.valid_to) { throw new ValidationFailure(\"\
    BUSINESS_TEMPORAL_INCOHERENT\", \"valid_from must be strictly before valid_to.\", ..."
  encoded_at:
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/temporal.ts
restates:
- file: src/modules/ingestion/catalog/catalog.ts
  where: the header comment, lines 13-21. The same closed-domain wording recurs in the docstring on `attributeValidValuesByKeyId`
    (lines 96-112) and the docstring on `domainOf` (lines 227-249).
  evidence: // materializes the closed value domains per `AttributeKey` from the new // `attribute_valid_value`
    table ... A key with // zero rows = open domain (backward-compatible legacy behavior; any literal
    // that parses against `value_type` is accepted). A key with >= 1 rows = // closed domain — only the
    listed values are accepted by the structural // validator.
  cost: 'These comments state, a second time and in prose, which attribute keys are closed and what a
    closed key accepts. That is a fact attribute-key holds through `allowed_values`. The code here already
    holds the distinction: `domainOf` returns `null` for an open key and the set for a closed one, and
    `buildSnapshot` accumulates the set. A reader who looks here finds a second statement of the rule
    with its own wording, such as "backward-compatible legacy behavior". When the node moves, `--check`
    does not reach this prose. The prose also describes enforcement that happens in another file, `validation/structural.ts`,
    which I did not read. The candidate index binds that file to rules/knowledge-base/attribute-value-in-allowed-values.'
  node: domain/knowledge-base/attribute-key
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: lines 89-99, the comment block above `attrKeysByNodeType` in `system()`
  evidence: '"The runtime check (`assertValueInDomain`, BR-30) is still the authoritative gate; this is
    a hint to steer the LLM toward in-domain values."'
  cost: The allowed-values rule is written a second time as prose in the prompt builder. A reader changing
    the rule can take this comment for its home. The running gate is in another file, and the comment
    does not move with it.
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: The docstring of resolveOrCreateNode (lines 88-94) and the comment above the advisory lock (lines
    114-118).
  evidence: '*   2. Tries exact `alias_norm = norm(name)` match against active nodes of

    ...

    // We compute the inner string on the DB so that `norm(name)` uses the

    // canonical implementation from migration 0001 (not a JS approximation).'
  cost: The prose states a second time that entity resolution compares names under norm(). The queries
    in this file hold that fact, at `WHERE na.alias_norm = norm($1::text)` and `na.alias_norm % norm($1::text)`.
    If the rule moves, this prose stays behind, and a reader can take it for where the rule is decided.
  node: rules/knowledge-base/name-normalization
- file: src/modules/ingestion/service/propose-attribute.service.ts
  where: the comment block above the closed-domain gate, lines 85-92 ("Closed-domain gate (BR-30)" through
    "Exact match (no normalisation) per spec §1 / BR-30 v1 semantics.")
  evidence: // key is closed and `assertValueInDomain` rejects out-of-domain literals // with `VALIDATION_INVALID_FORMAT`
    carrying `{ value, allowed_values }`. // Exact match (no normalisation) per spec §1 / BR-30 v1 semantics.
  cost: The rule that an attribute value must be one of the allowed values exactly as written is stated
    in prose here, next to the call that enforces it. A reader can take this comment for the place the
    rule is decided. If the node moves, the comment keeps asserting the old wording, and nothing reads
    it or flags it.
  node: rules/knowledge-base/attribute-value-in-allowed-values
pairs_omitted:
- node: domain/knowledge-base/link-type-rule
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-permitted-by-type-rule
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-rule-in-effect
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/raw-information
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-summary
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/content-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-shape
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-reference-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-requires-fragment-and-node
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-label-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-name-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-limit-bounds
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-limit-default
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/ingest-tool
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/below-confidence-floor-records-nothing
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-anchors-to-read-chunk
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/new-assertion-status-from-confidence
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/alias-kind
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/entity-match-review
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/knowledge-node
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/node-resolution
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/candidate-similarity
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/exact-alias-resolves
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/matched-node-gains-only-aliases
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/new-node-aliases
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/no-candidate-creates-active-node
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/strong-candidate-resolves
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-proposal-check-order
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/below-confidence-floor-records-nothing
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-anchored
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-exist
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-in-run
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-requires-errata-evidence
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/new-assertion-status-from-confidence
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/required-start-available
  file: src/modules/ingestion/service/propose-attribute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/validation/structural.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-in-catalog
  file: src/modules/ingestion/validation/structural.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/correction-requires-errata-evidence
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/date-check-order
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/required-start-available
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-filter
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-view
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/traversal-direction
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/traversal-request
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-rules-on-request
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-view-defaults
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/page-offset-non-negative
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/traversal-defaults
  file: src/modules/knowledge-graph/dto/queries.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/dto/search.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/page-limit-bounds
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
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: contracts/knowledge-base/retrieval
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/compliance-deletion
  file: src/modules/query-retrieval/service/provenance.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: constraints/retrieval-is-lexical-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/item-kind
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-item
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-match-cites-its-fragment
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expanded-link-requires-provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-as-of-view
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-in-effect-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-starts-from-matched-nodes
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/item-flags
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-types-ignored-without-expansion
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-total-before-pagination
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/temporal-filters-apply-to-expansion-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/uncertain-items-excluded-on-request
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 14 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/moved-backend.returns/.\nA finding in src/modules/ingestion/prompts/extraction.v1.ts\
  \ names rules/knowledge-base/required-start-fallback, which no file of this set is bound to: the \"\
  Dates\" section of the SYSTEM prompt built by `system()`, lines 164-167: \"- Justify it with `valid_from_basis`:\
  \ `stated` only when the start date is\", \"  written in the chunk (and supported by a cited fragment);\
  \ `document` uses\", \"  the document date; otherwise omit `valid_from`/basis and the backend\", \"\
  \  records `received`. NEVER invent a date. Dates are ISO `YYYY-MM-DD`.\" — The prompt tells the model\
  \ that an omitted start always ends up recorded as `received`. The node says the backend takes the source's\
  \ document date with basis `document` when the source has one, and only falls back to `received` when\
  \ it has none. A model that follows the prompt will believe the document date is lost when it omits\
  \ the start, so the prompt and the backend disagree about what gets recorded.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/modules/ingestion/validation/temporal.ts names rules/knowledge-base/correction-requires-errata-evidence,\
  \ which no file of this set is bound to: the errata-signal block: ERRATA_MARKERS (line 66), hasErrataSignal\
  \ (lines 68-76) and the change_hint === \"correction\" branch (lines 117-126): const ERRATA_MARKERS\
  \ = [\"errata\", \"errado\", \"correção\", \"corrigir\", \"correction\", \"correcao\"] as const; ...\
  \ if (input.change_hint === \"correction\") { if (!hasErrataSignal(input.fragment_texts)) { throw new\
  \ ValidationFailure(\"BUSINESS_TEMPORAL_INCOHERENT\", ... — The marker vocabulary and the refusal of\
  \ a correction proposal are implemented here. The node that holds them, rules/knowledge-base/correction-requires-errata-evidence,\
  \ is not bound to this file. The candidate index lists no binding for it. If the node moves, the trace\
  \ never reaches this file, and nobody can tell whether the node or this list was the decision.. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/validation/temporal.ts\
  \ names rules/knowledge-base/required-start-fallback, which no file of this set is bound to: the document_date\
  \ branch of the requires_valid_from fallback, lines 144-158: if (input.document_date !== null) { ...\
  \ return { valid_from: input.valid_from, valid_from_basis: input.valid_from_basis, }; } — The node says\
  \ a proposal that requires a start and states none takes the source's document date with basis document.\
  \ This branch passes the proposal through with valid_from and basis both null. A row for a type that\
  \ requires a validity start is left without one, and without a justification. The decision log records\
  \ exactly this divergence as the reason the node was decided, yet the code still carries it.. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/validation/temporal.ts\
  \ names rules/knowledge-base/required-start-available, which no file of this set is bound to: the final\
  \ throw of the requires_valid_from branch, lines 167-172: throw new ValidationFailure(\"BUSINESS_DATE_UNJUSTIFIED\"\
  , \"link_type / attribute_key requires_valid_from = true but no date is available (stated, document_date,\
  \ and received_at are all absent).\", { requires_valid_from: input.requires_valid_from } ); — The refusal\
  \ of a proposal that requires a start when no start, document date or reception date exists is held\
  \ here. The node that holds it, rules/knowledge-base/required-start-available, is not bound to this\
  \ file. A change to the node never reaches this refusal, and the next reader looks for the rule in the\
  \ specification and cannot tell it lives here too.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/ingestion/validation/temporal.ts names rules/knowledge-base/caller-never-states-received,\
  \ which no file of this set is bound to: the BUSINESS_DATE_UNJUSTIFIED message for a valid_from without\
  \ a basis, line 139: \"valid_from supplied without a valid_from_basis (stated | document | received).\"\
  \ — This is text the system emits to the caller. It lists received as a basis the caller may supply.\
  \ The node says a proposal must not state basis received. A caller who follows the message is steered\
  \ into supplying a basis that another layer refuses with VALIDATION_INVALID_FORMAT, which is a different\
  \ error code.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/query-retrieval/dto/search.dto.ts\
  \ names rules/knowledge-base/search-query-length, which no file of this set is bound to: QueryString,\
  \ the .max(1000) call, line 51: .max(1000, { message: \"query exceeds 1000 characters\" }) — The 1000-character\
  \ ceiling is declared in this schema and in the error text it emits. A node holds it, but that node\
  \ is not bound to this file. If the node's number moves, nothing reaches this file, and the next reader\
  \ cannot tell whether 1000 was decided by the business or by the code.. It blocks nothing here; it is\
  \ owed a route of its own.\nA finding in src/modules/query-retrieval/dto/search.dto.ts names rules/knowledge-base/search-query-not-blank,\
  \ which no file of this set is bound to: QueryString, the .transform/.refine pair, lines 52-55: .transform((s)\
  \ => s.trim())\n    .refine((s) => s.length > 0, {\n      message: \"query is empty after trim\",\n\
  \    }); — The refusal of a whitespace-only query is implemented here, and a node already holds it.\
  \ That node is not bound to this file, so a change to the node would not reach this refinement.. It\
  \ blocks nothing here; it is owed a route of its own.\nA finding in src/modules/query-retrieval/dto/search.dto.ts\
  \ names rules/knowledge-base/search-option-defaults, which no file of this set is bound to: SearchQuerySchema,\
  \ the defaults for in_effect_only, include_uncertain, expand and expand_depth, lines 62-67: in_effect_only:\
  \ BooleanQuery.optional().default(false),\n    include_uncertain: BooleanQuery.optional().default(true),\n\
  \    expand: BooleanQuery.optional().default(true),\n    expand_depth: IntegerQuery.pipe(z.number().int().min(1).max(3))\n\
  \      .optional()\n      .default(1), — The search option defaults (uncertain included, expansion on\
  \ at depth 1, in-effect-only off) are declared here a second time. The node that holds them is not bound\
  \ to this file. If the node's defaults change, this schema keeps answering with the old ones, and `--check`\
  \ never reaches it.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/query-retrieval/dto/search.dto.ts\
  \ names rules/knowledge-base/page-limit-bounds, which no file of this set is bound to: SearchQuerySchema,\
  \ the limit bound, lines 69-71: limit: IntegerQuery.pipe(z.number().int().min(1).max(100)) — The 1 to\
  \ 100 page limit is declared in this schema. A node holds it, but that node is not bound to this file.\
  \ The default of 20 is covered by page-defaults, which is in this file's set. A change to the bounds\
  \ would miss this file.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/query-retrieval/dto/search.dto.ts\
  \ names rules/knowledge-base/page-offset-non-negative, which no file of this set is bound to: SearchQuerySchema,\
  \ the offset bound, line 72: offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),\
  \ — The non-negative offset rule is declared here, and a node holds it without being bound to this file.\
  \ A change to the node would not reach this schema.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/query-retrieval/dto/search.dto.ts names domain/knowledge-base/search-layer,\
  \ which no file of this set is bound to: ALLOWED_LAYERS, line 101: export const ALLOWED_LAYERS = [\"\
  fragment\", \"node\", \"chunk\"] as const; — The search-layer vocabulary is declared in this file, and\
  \ domain/knowledge-base/search-layer already holds the same three values as an enumeration. That node\
  \ is not bound to this file. If a layer is added to the node, this list goes stale without anything\
  \ signalling it, and the service validates `layers[]` against the stale list.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/modules/query-retrieval/repository/provenance.repository.ts\
  \ names rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt, which no file of this set is\
  \ bound to: runChainSql(), the `excerpt` column in both SQL branches (lines 141-142 in the fragment-anchored\
  \ branch, lines 165-166 in the provenance-anchored branch): substring(rc.\"text\" FROM rc.offset_start\
  \ + 1\n                           FOR rc.offset_end - rc.offset_start) AS excerpt — `raw_chunk.\"text\"\
  ` is the chunk's own text, and its excerpt is already the content between its offsets. The slice starts\
  \ `offset_start` characters into that text and is `offset_end - offset_start` long. For any chunk that\
  \ does not start at offset 0 of its source, the excerpt is shifted, truncated or empty. The provenance\
  \ walk therefore returns a cut of the cited text, not the whole excerpt. The decision log records this\
  \ as the `unstated` entry behind the node (\"offsetting it again cuts away the text the entry exists\
  \ to show\"). The repository's header comment cites BR-11 / A22 for the +1 adjustment, so the next reader\
  \ is sent to a rule that does not say this.. It blocks nothing here; it is owed a route of its own.\n\
  Candidates: 14 opened across 5 of 14 delegation(s); each return lists its own under `candidates_opened`.\n\
  Restates: 4 place(s) where text in the source restates a node's fact the code holds, over 4 file(s),\
  \ listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,\
  \ and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/moved-backend.returns/`, which are the evidence behind every entry above.
