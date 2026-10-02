---
contract_version: siegard-reconcile/8
title: Reconcile the files bound to the nodes proposal and search-item after /analyse moved them
summary: The source did not change; the specification moved the nodes domain/knowledge-base/proposal (attribute
  value as text) and domain/knowledge-base/search-item (layer, hop and summary required) through /analyse
  and the delivery review-findings; the human states the source is correct.
target: backend
files:
- path: src/modules/ingestion/dto/propose-attribute.dto.ts
  change: unchanged; re-read against proposal, whose text moved.
- path: src/modules/ingestion/dto/propose-fragment.dto.ts
  change: unchanged; re-read against proposal, whose text moved.
- path: src/modules/ingestion/dto/propose-link.dto.ts
  change: unchanged; re-read against proposal, whose text moved.
- path: src/modules/ingestion/dto/propose-node.dto.ts
  change: unchanged; re-read against proposal, whose text moved.
- path: src/modules/ingestion/mcp/mcp-schemas.ts
  change: unchanged; re-read against proposal, whose text moved.
- path: src/modules/query-retrieval/dto/response.dto.ts
  change: unchanged; re-read against search-item, whose text moved.
nodes:
- node: domain/knowledge-base/proposal
  conforms: true
  how: "src/modules/ingestion/dto/propose-attribute.dto.ts: held at ProposeAttributeInputSchema, lines\
    \ 11-59. It declares the attribute proposal's shape: value, confidence, change_hint, valid_from, valid_to\
    \ and valid_from_basis, plus fragment_ids and the node and key it targets. — value: z\n    .string()\n\
    \    .min(1)\n...\n  confidence: z\n    .number()\n    .min(0)\n    .max(1)\n...\n  valid_from_basis:\
    \ ValidFromBasisSchema.optional()\n...\n  change_hint: ChangeHintSchema.default(\"none\")\nsrc/modules/ingestion/dto/propose-fragment.dto.ts:\
    \ held at ProposeFragmentInputSchema (lines 10 to 31) declares the fragment proposal's `confidence`\
    \ and its cited raw chunks as `chunk_ids`. ProposeFragmentResult (lines 34 to 37) declares the recorded\
    \ result. — confidence: z\n  .number()\n  .min(0)\n  .max(1)\n... chunk_ids: z\n  .array(z.string().uuid())\n\
    \  .min(1)\nsrc/modules/ingestion/dto/propose-link.dto.ts: held at ProposeLinkInputSchema (lines 20-64)\
    \ declares the link proposal's confidence, change_hint, valid_from, valid_to and valid_from_basis,\
    \ plus the source, target and cited-fragment fields. — confidence: z.number().min(0).max(1) ... valid_from:\
    \ IsoDateSchema.optional() ... valid_to: IsoDateSchema.optional() ... valid_from_basis: ValidFromBasisSchema.optional()\
    \ ... change_hint: ChangeHintSchema.default(\"none\")\nsrc/modules/ingestion/dto/propose-node.dto.ts:\
    \ held at ProposeNodeInputSchema, lines 10-31. It declares, in part, the shape of the node proposal\
    \ that the node's description covers. — export const ProposeNodeInputSchema = z.object({ node_type:\
    \ z.string().min(1)..., name: z.string().min(1).max(500)..., aliases: z.array(z.string().min(1).max(500)).optional()...\
    \ }); The node's declared attributes (kind, confidence, change_hint, value, valid_from, valid_to,\
    \ valid_from_basis) do not appear in this file. The 1 to 500 character limit on name and aliases matches\
    \ rules/knowledge-base/node-name-length, and the tool descriptions agree with the nodes.\nsrc/modules/ingestion/mcp/mcp-schemas.ts:\
    \ held at Only the proposal's reference to its LLM run, in LlmRunIdField (lines 28-35) and the four\
    \ `.extend(LlmRunIdField)` declarations (lines 41-55). The node's other attributes are declared in\
    \ the dto files. — export const ProposeFragmentMcpInputSchema =\n  ProposeFragmentInputSchema.extend(LlmRunIdField);"
  encoded_at:
  - src/modules/ingestion/dto/propose-attribute.dto.ts
  - src/modules/ingestion/dto/propose-fragment.dto.ts
  - src/modules/ingestion/dto/propose-link.dto.ts
  - src/modules/ingestion/dto/propose-node.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/search-item
  conforms: true
  how: 'src/modules/query-retrieval/dto/response.dto.ts: held at the SearchItem interface, lines 53-62,
    with its supporting types SearchKind, SearchLayer and AssertionFlag at lines 10-12 — export interface
    SearchItem { readonly kind: SearchKind; readonly layer: SearchLayer; readonly id: string; readonly
    score: number; readonly hop: number; readonly summary: string; readonly flags: readonly AssertionFlag[];
    readonly provenance: readonly SearchProvenanceEntry[]; }'
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
- node: rules/knowledge-base/caller-never-states-received
  conforms: true
  how: 'src/modules/ingestion/dto/propose-link.dto.ts: held at ValidFromBasisSchema, line 8. The enum
    admits only stated and document, so a caller-supplied valid_from_basis of received fails parsing.
    — export const ValidFromBasisSchema = z.enum(["stated", "document"]);'
  encoded_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
unstated:
- file: src/modules/ingestion/dto/propose-attribute.dto.ts
  where: '`change_hint` field of ProposeAttributeInputSchema, `.default("none")`, line 56'
  evidence: 'change_hint: ChangeHintSchema.default("none")'
  cost: An attribute proposal that states no change hint is given the hint none, which then drives re-affirmation
    and succession. The only node holding a default says "A link proposal that states no change hint carries
    the change hint none". Its decision log records that the attribute schema was not read when it was
    decided. The attribute default therefore lives only in this schema, and the next reader looks for
    it in the specification and does not find it.
- file: src/modules/ingestion/dto/propose-attribute.dto.ts
  where: '`key` field of ProposeAttributeInputSchema, lines 18-23'
  evidence: "key: z\n    .string()\n    .min(1)"
  cost: An empty key is refused at the schema, before the catalog check. The specification gives an unknown
    key the refusal BUSINESS_UNKNOWN_ATTRIBUTE_KEY and states no empty-key refusal. The error code a caller
    sees for an empty key is therefore decided only here.
- file: src/modules/ingestion/dto/propose-attribute.dto.ts
  where: '`value` field of ProposeAttributeInputSchema, `.min(1)`, lines 28-30'
  evidence: "value: z\n    .string()\n    .min(1)"
  cost: An empty value is refused at the schema for every key, including keys of value type text. The
    node says text means "any text" and states no empty-value refusal. Whether the empty string is text
    is decided only here. A reader checking the specification will not find that an empty text value is
    refused.
- file: src/modules/ingestion/dto/propose-fragment.dto.ts
  where: the `.describe(...)` on `text` in ProposeFragmentInputSchema, line 16
  evidence: '"The factual claim, quoted verbatim from the chunk. One assertion only; max 1000 characters."'
  cost: This text goes to the calling model as the tool's input description. It requires a fragment's
    text to be a verbatim quote of the chunk and to hold one assertion only. No node states either requirement.
    Nodes hold the 1–1000 length and the verbatim chunk excerpt, but the fragment's own text is not said
    to be verbatim or single-assertion. A reader looking in the specification for what a fragment's text
    must be will not find these two requirements.
- file: src/modules/ingestion/dto/propose-link.dto.ts
  where: lines 27-29, the link_type field of ProposeLinkInputSchema
  evidence: "link_type: z\n    .string()\n    .min(1)"
  cost: An empty link_type is refused here as a shape failure (VALIDATION_INVALID_FORMAT). The ingestion
    contract's propose-link operation names BUSINESS_UNKNOWN_LINK_TYPE for a link type the catalog does
    not hold, and lists the failing shapes as "a required field or holds one of the wrong shape". It does
    not say that an empty link type counts as a wrong shape. The traversal operation does say so for "an
    empty link-type name". The refusal an empty link type gets is therefore decided only in this schema,
    where the next reader will not look for it.
- file: src/modules/ingestion/dto/propose-node.dto.ts
  where: ProposeNodeInputSchema.node_type, lines 11-16
  evidence: "node_type: z\n  .string()\n  .min(1)"
  cost: The code refuses an empty node type as a structural failure, which is VALIDATION_INVALID_FORMAT
    with HTTP 422. The node says only that a proposal "MUST name a node type the catalog holds", and the
    contract refuses an unknown type with BUSINESS_UNKNOWN_NODE_TYPE. No node states a minimum length
    for the node type. An empty string is therefore refused under a different code than the specification's
    unknown-type refusal would give it, and that decision lives only in this schema.
- file: src/modules/query-retrieval/dto/response.dto.ts
  where: SearchItem interface, the `id` member, line 56
  evidence: 'readonly id: string;'
  cost: The shape gives every search item an identity. The search-item node lists kind, layer, score,
    hop, summary, flags and the provenance relationship, and no identity. A reader who goes to the specification
    for what a search answer carries will not find the field that clients use to follow a hit.
- file: src/modules/query-retrieval/dto/response.dto.ts
  where: SearchResponse interface, the `query` member, line 65
  evidence: 'readonly query: string;'
  cost: The search answer echoes the query back to the caller. The accepted answer of `search` in contracts/knowledge-base/retrieval
    says only "the page of ranked search items ... and the total before pagination". The echo exists only
    in this type, so the next reader will not find it in the contract.
restates:
- file: src/modules/ingestion/dto/propose-attribute.dto.ts
  where: the block comment above `value`, lines 24-27
  evidence: "Canonical-serialized value (string form). The structural layer parses\n   * this against\
    \ the `attribute_key.value_type` and rejects on mismatch."
  cost: The comment states the rule that a value must read as its key's value type, which a node holds.
    The code that enforces it is in validation/structural.ts, which switches on `args.value_type`. The
    comment is a second home for the fact outside behavior. If the node moves, nothing points a reader
    to it.
  node: rules/knowledge-base/attribute-value-parses
- file: src/modules/ingestion/dto/propose-fragment.dto.ts
  where: the header comment, lines 3 to 6, above the import
  evidence: // Layer 1 (structural) of the 5-layer validation. The DB CHECK on // `information_fragment.text`
    (≤ 1000 chars) is mirrored here so the failure // surfaces as a typed `VALIDATION_INVALID_FORMAT`
    instead of a SQLSTATE
  cost: The comment states the 1–1000 character limit of a fragment's text a second time, as prose. The
    node rules/knowledge-base/fragment-text-length holds it and `.min(1).max(1000)` in this file implements
    it. The pair conforms. The comment is a second home for the limit, and it will go stale if the node
    changes.
  node: rules/knowledge-base/fragment-text-length
- file: src/modules/ingestion/dto/propose-node.dto.ts
  where: the header comment, lines 1-6
  evidence: // Entity resolution belongs to a future domain (`entity-resolution`) — this TC // implements
    the structural layer plus the create-with-advisory-lock path // (BR-20). When that future domain is
    wired in, the handler delegates to it // from inside this same transaction.
  cost: This prose states that concurrent proposals of one name are serialised by an advisory lock. The
    node concurrent-proposals-resolve-in-turn already holds that fact, and code holds it too in backend/src/modules/ingestion/service/entity-resolution.service.ts,
    where the lock is taken (`SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`). The comment
    also calls entity resolution a "future domain", but that service exists. A reader who trusts the comment
    is misled about where the rule lives and whether it is already wired in.
  node: rules/knowledge-base/concurrent-proposals-resolve-in-turn
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: Header comment of the `ingest_directed` section, lines 272-274, and the JSDoc at line 300
  evidence: //   - `ref` strings are local to the call (1..120 chars, must be non-empty).
  cost: The reference length is restated in prose twice while `IngestDirectedRefSchema = z.string().min(1).max(120)`
    holds it in this file. A change to the node's bounds would leave two comments claiming the old figure.
  node: rules/knowledge-base/directed-reference-length
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: Header comment, lines 275-277, and the JSDoc at line 303
  evidence: //   - `valid_from_basis` is restricted to the public `'stated' | 'document'` //     enum
    (the `'received'` fallback is server-internal, never accepted from //     callers — BR-16).
  cost: The exclusion of the basis `received` is stated in prose while `z.enum(["stated", "document"])`
    holds it in this file. The comments claim a business decision (BR-16) that a reader may take for a
    second authority.
  node: rules/knowledge-base/caller-never-states-received
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: JSDoc of IngestDirectedIsoDateSchema, line 292
  evidence: /** ISO date `YYYY-MM-DD`. Mirrors the service-side regex (`directed-ingestion.service.ts`).
    */
  cost: The shape of a validity start is restated in prose and claimed to mirror a second regex in the
    service. The regex `/^\d{4}-\d{2}-\d{2}$/` already holds it in this file, so the comment adds a second
    home the node cannot reach.
  node: rules/knowledge-base/directed-validity-start-shape
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: JSDoc of ListRecentIngestionsMcpInputSchema, line 251
  evidence: /** `list_recent_ingestions` — optional page size (1..50, default 10). */
  cost: The limit's bounds and default are stated in prose a second time, while the code directly below
    holds them with `.min(1).max(50).default(10)`. If the node's figures move, this line goes stale without
    anything noticing.
  node: rules/knowledge-base/recent-ingestions-limit-bounds
- file: src/modules/query-retrieval/dto/response.dto.ts
  where: the comment on ProvenanceRawInformation.original_input, lines 81-84
  evidence: "\"`'[REDACTED]'` after compliance_delete (BR-18 of\n  // compliance-audit).\""
  cost: The comment restates the redaction of the original input that rules/knowledge-base/compliance-deletion-redacts-content
    holds. A reader of this DTO takes the comment as the home of the rule. The code that applies it is
    in another file, and the comment would not follow if the rule changed.
  node: rules/knowledge-base/compliance-deletion-redacts-content
- file: src/modules/query-retrieval/dto/response.dto.ts
  where: the doc comment above toSourceType(), lines 32-37
  evidence: '"an out-of-domain value means TS/DB drift — a programmer/migration bug surfaced as a generic
    500 (not a 422), never a silent `as` cast."'
  cost: 'The doc comment states the retrieval contract''s refusal for a stored source type outside its
    closed set, which is a second home for that fact. The code holds the same fact in this file at `throw
    new InvariantError(\`Unexpected source_type from DB: ${s}\`);`. If the contract moves, the comment
    is not reached and goes stale without anyone noticing.'
  node: contracts/knowledge-base/retrieval
pairs_omitted:
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/dto/propose-attribute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/dto/propose-attribute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/dto/propose-attribute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/ingestion/dto/propose-fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/dto/propose-fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/dto/propose-fragment.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/node-resolution
  file: src/modules/ingestion/dto/propose-node.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-name-length
  file: src/modules/ingestion/dto/propose-node.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
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
- node: rules/knowledge-base/caller-never-states-received
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
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
- node: rules/knowledge-base/directed-validity-start-shape
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/dto/response.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/item-kind
  file: src/modules/query-retrieval/dto/response.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/dto/response.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/provenance
  file: src/modules/query-retrieval/dto/response.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-layer
  file: src/modules/query-retrieval/dto/response.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/source-type
  file: src/modules/query-retrieval/dto/response.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/search-total-before-pagination
  file: src/modules/query-retrieval/dto/response.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
notes: "Judged by 6 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/reconcile-review-findings-2.returns/.\nA finding in src/modules/ingestion/dto/propose-attribute.dto.ts\
  \ names rules/knowledge-base/attribute-value-parses, which no file of this set is bound to: `.describe(...)`\
  \ of `value`, lines 31-33. This is the tool description sent to the model.: The literal value, serialized\
  \ as a string. Must parse as the key's declared type (date, number, or string). — The text the model\
  \ is told names three value types, and the node names four: date, number, bool and text. It leaves out\
  \ bool and calls text \"string\". A model following this description has no instruction for bool values,\
  \ and the system tells it a different vocabulary from the one the node decided.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/modules/ingestion/dto/propose-fragment.dto.ts names\
  \ rules/knowledge-base/fragment-recorded-proposed, which no file of this set is bound to: the `.describe(...)`\
  \ on `confidence` in ProposeFragmentInputSchema, line 23: \"Confidence 0–1 that this claim is correctly\
  \ extracted. ≥0.75 stored active; 0.40–0.74 kept but flagged uncertain; <0.40 dropped.\" — This text\
  \ goes to the calling model as the description of a fragment proposal's confidence. It says a fragment\
  \ is stored active at 0.75 or above, uncertain from 0.40 to 0.74, and dropped below 0.40. The node rules/knowledge-base/fragment-recorded-proposed\
  \ says \"A fragment proposal records an information fragment in status proposed, whatever its confidence.\"\
  \ The result type in this same file also carries `status: \"proposed\"` only. The 0.75 and 0.40 thresholds\
  \ belong to link and attribute proposals (rules/knowledge-base/new-assertion-status-from-confidence\
  \ and rules/knowledge-base/below-confidence-floor-records-nothing). The model is therefore told the\
  \ wrong consequence of the confidence it sends for a fragment.. It blocks nothing here; it is owed a\
  \ route of its own.\nA finding in src/modules/ingestion/dto/propose-link.dto.ts names domain/knowledge-base/change-hint,\
  \ which no file of this set is bound to: line 12, ChangeHintSchema: export const ChangeHintSchema =\
  \ z.enum([\"none\", \"succession\", \"correction\"]); — The change-hint vocabulary is declared here\
  \ as well as in its node. The node is not bound to this file, so if the node's values move, `--check`\
  \ never reaches this enum. Nobody could then say which of the two lists was decided.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/ingestion/dto/propose-link.dto.ts names\
  \ rules/knowledge-base/omitted-change-hint-is-none, which no file of this set is bound to: line 61,\
  \ the change_hint field of ProposeLinkInputSchema: change_hint: ChangeHintSchema.default(\"none\").describe(\
  \ — The default of none when a proposal omits change_hint is applied here. The rule that holds it is\
  \ not bound to this file, so a change to the rule would not reach this default.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/modules/ingestion/dto/propose-link.dto.ts names contracts/knowledge-base/ingestion,\
  \ which no file of this set is bound to: lines 67-80, ProposeLinkOutcome and ProposeLinkResult.reason:\
  \ export type ProposeLinkOutcome =\n  | \"accepted\"\n  | \"consolidated\"\n  | \"superseded_previous\"\
  \n  | \"disputed\"\n  | \"rejected\";\n...\n  readonly reason?: \"BELOW_CONFIDENCE_FLOOR\"; — The closed\
  \ list of propose-link outcomes and the BELOW_CONFIDENCE_FLOOR reason are declared here. The ingestion\
  \ contract holds them in its propose-link answer, and that node is not bound to this file. A change\
  \ to the contract's outcomes would not reach this type through `--check`.. It blocks nothing here; it\
  \ is owed a route of its own.\nA finding in src/modules/ingestion/dto/propose-node.dto.ts names domain/knowledge-base/node-resolution,\
  \ which no file of this set is bound to: ProposeNodeResolution type, line 33: export type ProposeNodeResolution\
  \ = \"matched_existing\" | \"created_new\" | \"needs_review\"; — This file declares a second copy of\
  \ the node-resolution vocabulary, a closed set of three values. The enumeration node domain/knowledge-base/node-resolution\
  \ is not bound to this file. If the node's values change, `--check` never reaches this declaration,\
  \ and nobody can tell which of the two was decided.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/ingestion/mcp/mcp-schemas.ts names contracts/knowledge-base/ingestion,\
  \ which no file of this set is bound to: LlmRunIdField, lines 28-35 (the `llm_run_id` field every MCP\
  \ proposal schema is extended with): llm_run_id: z\n    .string()\n    .min(1)\n    .describe(\n   \
  \   \"Active LLMRun id this proposal belongs to. ... The handler aborts with RESOURCE_NOT_FOUND when\
  \ the id is unknown or BUSINESS_RUN_NOT_RUNNING when the row exists but its status is not `running`.\"\
  \ — The contract's decision log settles that a malformed LLM run identity is refused with VALIDATION_INVALID_FORMAT\
  \ on both transports, and the log's reason is that a run identity is a UUID everywhere else the specification\
  \ names one. This schema accepts any non-empty string, and its own description sends an unknown id to\
  \ RESOURCE_NOT_FOUND. A reader who trusts the contract expects a malformed id to be refused as invalid\
  \ format. The schema, as declared here, lets it through to the handler. I did not read the handler,\
  \ which is outside the file set.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/ingestion/mcp/mcp-schemas.ts names constraints/ingest-toolset-offers-no-async-ingestion,\
  \ which no file of this set is bound to: StartAsyncIngestionMcpInputSchema and its docstring, lines\
  \ 81-123: `start_async_ingestion` (BR-32) — shape-identical to `ingest_document` for\n caller symmetry.\
  \ ... so the\n `inputSchema` advertised on `tools/list` carries the tool-specific\n descriptions in\
  \ `describe(…)`. — The constraint says the ingest toolset offers no tool that starts an ingestion and\
  \ returns before it completes. Its log records the tool as retired because ingestion is one-shot. This\
  \ file still declares the input contract of such a tool, and its docstring says that contract is advertised\
  \ on `tools/list`. Someone reading the specification would conclude the tool does not exist, while the\
  \ code carries a tool-specific input shape and descriptions for it. I did not check whether the registrar\
  \ in another file still lists the tool.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/ingestion/mcp/mcp-schemas.ts names contracts/knowledge-base/ingestion, which no file\
  \ of this set is bound to: `node_id` field of IngestDirectedNodeItemSchema, description string, lines\
  \ 336-342: Rejected (VALIDATION_INVALID_FORMAT) if the id does not point to an active node. — This description\
  \ is sent to MCP clients on `tools/list`. The contract reports a pinned node that names no knowledge\
  \ node as rejected with RESOURCE_NOT_FOUND, and VALIDATION_INVALID_FORMAT only for a node that exists\
  \ but is not active. The text tells a caller the first case is an invalid-format refusal, so a caller\
  \ who branches on the advertised code mishandles it.. It blocks nothing here; it is owed a route of\
  \ its own.\nA finding in src/modules/query-retrieval/dto/response.dto.ts names domain/knowledge-base/fragment-status,\
  \ which no file of this set is bound to: ProvenanceFragment.status, line 102: readonly status: \"accepted\"\
  \ | \"proposed\" | \"rejected\" | \"deleted\"; — The fragment-status enumeration holds five values:\
  \ proposed, accepted, rejected, superseded and deleted. This type leaves out `superseded`, so a provenance\
  \ fragment in that state has no valid value in the shape. The contract's accepted answer lists a status\
  \ for each provenance fragment without restricting it.. It blocks nothing here; it is owed a route of\
  \ its own.\nCandidates: 6 opened across 3 of 6 delegation(s); each return lists its own under `candidates_opened`.\n\
  Unstated: 8 fact(s) the source states that no node holds, over 5 file(s), listed under `unstated`. They\
  \ block no binding here and no rebind closes them — the route is the analysis that gives each fact a\
  \ node.\nRestates: 9 place(s) where text in the source restates a node's fact the code holds, over 5\
  \ file(s), listed under `restates`. The pair conforms, so none blocks a binding — the route is removing\
  \ the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-review-findings-2.returns/`, which are the evidence behind every entry above.
