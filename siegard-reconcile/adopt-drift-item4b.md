---
contract_version: siegard-reconcile/8
title: Drift item 4 - files of the nodes aligned with the code
summary: The files named here did not change; the nodes were aligned with the behavior the reconciliations
  found. The owner states the behavior is correct.
target: backend
files:
- path: src/modules/curation/dto/dispute.dto.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/curation/service/dispute.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/curation/service/entity-match.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/dto/propose-link.dto.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/mcp/mcp-schemas.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/service/directed-ingestion.service.ts
  change: unchanged; read against the nodes as they now stand
- path: src/modules/ingestion/service/entity-resolution.service.ts
  change: unchanged; read against the nodes as they now stand
nodes:
- node: rules/knowledge-base/ambiguous-candidates-need-review
  conforms: true
  how: 'src/modules/ingestion/service/entity-resolution.service.ts: held at the candidate query with `LIMIT
    ${TRIGRAM_CANDIDATE_LIMIT}` ordered by similarity descending, decideFromCandidates, and the "ambiguous"
    branch of resolveOrCreateNode — "const aboveFloor = candidates.filter((c) => c.sim >= MATCH_FLOOR);"
    with MATCH_FLOOR = 0.55; "return { kind: "ambiguous", candidates: aboveFloor };"; "VALUES ($1, $2,
    ''needs_review'')"; and "INSERT INTO entity_match_review (node_id, candidate_node_id, similarity)"
    per candidate.'
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: rules/knowledge-base/caller-never-states-received
  conforms: false
  how: 'src/modules/ingestion/dto/propose-link.dto.ts, line 8, ValidFromBasisSchema; the schema is reused
    by ProposeLinkInputSchema.valid_from_basis (lines 58-60): export const ValidFromBasisSchema = z.enum(["stated",
    "document"]); and, in the description of valid_from_basis, "Justification for valid_from: ''stated''
    (written in the chunk) or ''document'' (the document''s date). Omit when valid_from is omitted." The
    file''s own caller path, service/extraction.service.ts line 249, runs `ProposeLinkInputSchema.safeParse(rawInput)`
    on the model''s tool input. The v4 extraction prompt, prompts/extraction.v4.ts, tells that model to
    state the basis: "fall back to the date portion of `received_at` ... use basis `"received"`." — The
    node lets an extraction under prompt version v4 state the basis received for a relative date it resolved
    against the date of reception. This schema has no such value, so the parse refuses a proposal that
    carries it. The exception the node grants is unreachable through the file that declares the shape.
    The caller-facing enum also silently drops one of the three values valid-from-basis holds, so a reader
    of the specification will not find in this file that the exception was cut off.

    src/modules/ingestion/prompts/extraction.v4.ts, RECEIVED_AT_ANCHOR_DIRECTIVE, lines 25-28, the bullet
    on resolving a relative date when document_date is unknown: "  `\"amanhã\"`, `\"semana que vem\"`,
    `\"esta semana\"`, similar pt-BR temporal", ... "`document_date` is `(unknown)`, fall back to the
    date", "  portion of `received_at` (the `YYYY-MM-DD` prefix of the ISO-8601 string) —", "  use basis
    `\"received\"`." — The directive is joined into the system prompt that system() returns and sent to
    the model. It tells the model to state the basis received on a proposal. The node says no proposal
    may state that basis, and the log of this node records that the proposal schema refuses it. A run
    under v4 is therefore asked for something the proposal validation will reject. The reception-date
    fallback appears to reach the knowledge base only through the separate required-start-fallback rule,
    not through the model, and the prompt instructs otherwise.'
  observed_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
  - src/modules/ingestion/prompts/extraction.v4.ts
- node: domain/knowledge-base/alias-kind
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — The file only passes the literals `''canonical''` and `''alias''` into `INSERT INTO
    node_alias (node_id, alias, kind, created_by_run_id) VALUES ($1, $2, ''canonical'', $3)`. It declares
    no enumeration, type or table shape for the kind.'
  observed_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/change-hint
  conforms: true
  how: 'src/modules/ingestion/dto/propose-link.dto.ts: held at line 12, ChangeHintSchema — export const
    ChangeHintSchema = z.enum(["none", "succession", "correction"]);'
  encoded_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
- node: domain/knowledge-base/dispute-resolution
  conforms: true
  how: 'src/modules/curation/dto/dispute.dto.ts: held at ResolveDisputeBodySchema (lines 28-36), with
    AdjustedPeriodSchema (lines 13-18) for the periods element — item_kind: ItemKindSchema, item_ids:
    z.array(UuidSchema).min(2), decision: DisputeDecisionSchema, winner_id: UuidSchema.optional().nullable(),
    periods: z.array(AdjustedPeriodSchema).optional().nullable(), reason: z.string().trim().min(1).optional().nullable(),
    The node''s assertion_kind is spelled item_kind here, which is also the spelling the curation contract
    uses on the wire. See the finding on valid_from for the adjusted-period element.'
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
- node: domain/knowledge-base/entity-match-review
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — The file only writes rows with `INSERT INTO entity_match_review (node_id, candidate_node_id,
    similarity)`. It declares no shape for the element.'
  observed_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/information-fragment
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/mcp/mcp-schemas.ts read `nowhere` — The
    file declares only the directed ingestion''s input item, `IngestDirectedFragmentItemSchema = z.object({
    ref: ..., text: z.string().min(1).max(1000) ...})`. That is a request item, not the shape of the stored
    fragment with confidence, status and created_at.'
  observed_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/ingest-tool
  conforms: true
  how: "src/modules/ingestion/mcp/mcp-schemas.ts: held at INGEST_TOOL_NAMES, lines 63-68 — export const\
    \ INGEST_TOOL_NAMES = [\n  \"propose_fragment\",\n  \"propose_node\",\n  \"propose_link\",\n  \"propose_attribute\"\
    ,\n] as const;"
  encoded_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/knowledge-node
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — The file only inserts with `INSERT INTO knowledge_node (node_type_id, canonical_name,
    status)` and reads `kn.status = ''active''`. It declares no type, interface or table for the element.'
  observed_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/llm-run
  conforms: true
  how: 'src/modules/ingestion/mcp/mcp-schemas.ts: held at GetIngestionStatusOutputSchema, lines 234-246,
    which declares the run''s attributes in part — model: z.string(), prompt_version: z.string(), started_at:
    ..., finished_at: ....nullable(), status: z.enum(["running", "completed", "failed"]), attempts: z.number().int().positive(),
    input_raw_information_id: z.string().uuid(), idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),
    summary: GetIngestionStatusSummarySchema'
  encoded_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/node-resolution
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/service/entity-resolution.service.ts
    read `nowhere` — The file imports `import type { ProposeNodeResolution } from "../dto/propose-node.dto.js"`
    and returns the literals `"matched_existing"`, `"needs_review"` and `"created_new"`. The enumeration
    is declared in the dto file, not here.'
  observed_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: domain/knowledge-base/prompt-version
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v4.ts: held at PROMPT_VERSION constant, line 11 — export
    const PROMPT_VERSION = "v4" as const;'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
- node: domain/knowledge-base/proposal
  conforms: true
  how: "src/modules/ingestion/dto/propose-link.dto.ts: held at lines 20-64, ProposeLinkInputSchema, which\
    \ declares confidence, valid_from, valid_to, valid_from_basis and change_hint, plus the cited fragment\
    \ ids (the evidence role), in part. The proposal's kind is not declared here. — confidence: z.number().min(0).max(1)\
    \ ... fragment_ids: z.array(z.string().uuid()).min(1) ... valid_from: IsoDateSchema.optional() ...\
    \ valid_to: IsoDateSchema.optional() ... valid_from_basis: ValidFromBasisSchema.optional() ... change_hint:\
    \ ChangeHintSchema.default(\"none\")\nsrc/modules/ingestion/mcp/mcp-schemas.ts: held at ProposeFragmentMcpInputSchema,\
    \ ProposeNodeMcpInputSchema, ProposeLinkMcpInputSchema and ProposeAttributeMcpInputSchema, lines 41-55,\
    \ which bind each proposal to its LLM run; the directed link and attribute items, lines 357-403, carry\
    \ valid_from, valid_from_basis and the evidence reference. The remaining attributes (confidence, change_hint)\
    \ are declared in the dto files. — export const ProposeFragmentMcpInputSchema =\n  ProposeFragmentInputSchema.extend(LlmRunIdField);"
  encoded_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/raw-information
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/mcp/mcp-schemas.ts read `nowhere` — `IngestDocumentMcpInputSchema`
    carries `content`, `source_type` and `metadata`, but as the arguments of a request. The file does
    not declare the stored raw information with its content_hash, status, received_at or original_input,
    and `source_type` is imported from "../dto/source-type.js".'
  observed_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/run-status
  conforms: true
  how: 'src/modules/ingestion/mcp/mcp-schemas.ts: held at the status field of GetIngestionStatusOutputSchema,
    line 240 — status: z.enum(["running", "completed", "failed"]),'
  encoded_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/run-summary
  conforms: true
  how: 'src/modules/ingestion/mcp/mcp-schemas.ts: held at GetIngestionStatusSummarySchema, lines 215-225
    — accepted: z.number().int().nonnegative(), consolidated: ..., superseded_previous: ..., needs_review:
    ..., uncertain: ..., disputed: ..., rejected: ..., error: ..., orphaned_fragments: z.number().int().nonnegative(),'
  encoded_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/modules/ingestion/dto/propose-link.dto.ts: held at line 8, ValidFromBasisSchema, in part.
    It declares two of the node''s three values and omits received; see the finding against rules/knowledge-base/caller-never-states-received.
    — export const ValidFromBasisSchema = z.enum(["stated", "document"]);'
  encoded_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
- node: rules/knowledge-base/adjust-periods-one-per-item
  conforms: true
  how: 'src/modules/curation/dto/dispute.dto.ts: held at the adjust_periods branch of superRefine, lines
    72-122 — if (value.periods.length !== value.item_ids.length) { if (!value.item_ids.includes(p.item_id))
    { if (periodIds.has(p.item_id)) { each raising BUSINESS_DISPUTE_PERIODS_REQUIRED'
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
- node: rules/knowledge-base/curation-request-check-order
  conforms: true
  how: 'src/modules/curation/dto/dispute.dto.ts: held at the order of the superRefine branches: reason
    (lines 47-58), winner (59-69), periods (72-91), then validity start before end (109-120) — message:
    "BUSINESS_REASON_REQUIRED" is added before message: "BUSINESS_DISPUTE_WINNER_REQUIRED", then "BUSINESS_DISPUTE_PERIODS_REQUIRED",
    then "BUSINESS_TEMPORAL_INCOHERENT". This matches the node''s order. The file adds every violation
    to ctx in one pass. The format issues (the duplicate item_ids issue at line 43, `.min(2)`, `.trim().min(1)`)
    are emitted ahead of the business ones. Which issue is reported first, and so whether format loses
    to the business checks, is decided by the consumer of the issue list. That consumer is outside this
    file and was not read.'
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
- node: rules/knowledge-base/directed-defaults
  conforms: true
  how: 'src/modules/ingestion/service/directed-ingestion.service.ts: held at the attribute input at lines
    628-629 and the link input at lines 708-709 (the item''s own hint or none; the item''s own basis or
    stated) — valid_from_basis: item.valid_from_basis ?? "stated", change_hint: item.change_hint ?? "none",'
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
- node: rules/knowledge-base/directed-later-reference-wins
  conforms: true
  how: "src/modules/ingestion/service/directed-ingestion.service.ts: held at the fragment loop (lines\
    \ 475-477) and the node loop (lines 511 and 561), where a reference is written to the map only on\
    \ acceptance — if (envelope.ok) {\n      refToFragmentId.set(item.ref, envelope.result.fragment_id);\n\
    and, in the pin path, `if (pinResult.kind === \"ok\") { refToNodeId.set(item.ref, item.node_id);`.\
    \ A refused item sets nothing, so the earlier accepted entry stays, and a later accepted one overwrites\
    \ it."
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
- node: rules/knowledge-base/dispute-resolution-single-scope
  conforms: true
  how: 'src/modules/curation/service/dispute.service.ts: held at assertSameScope(), lines 281-315, called
    at line 77 after the disputed-status check — r.source_node_id !== first.source_node_id || r.target_node_id
    !== first.target_node_id || r.link_type_id !== first.link_type_id ... r.node_id !== first.node_id
    || r.attribute_key_id !== first.attribute_key_id -> throw new ConflictError("BUSINESS_ITEM_NOT_DISPUTED",
    "Items do not share the same conflict scope", { scope_mismatch: true })'
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/fragment-text-length
  conforms: true
  how: "src/modules/ingestion/mcp/mcp-schemas.ts: held at the text field of IngestDirectedFragmentItemSchema,\
    \ lines 310-316. It holds the limit for directed fragments only; the propose_fragment limit is in\
    \ the dto file. — text: z\n    .string()\n    .min(1)\n    .max(1000)\nsrc/modules/ingestion/service/directed-ingestion.service.ts:\
    \ held at DirectedFragmentItemSchema, line 106 — text: z.string().min(1).max(1000),"
  encoded_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/service/directed-ingestion.service.ts
- node: rules/knowledge-base/link-or-attribute-cites-a-fragment
  conforms: true
  how: "src/modules/ingestion/dto/propose-link.dto.ts: held at lines 46-51, the fragment_ids field of\
    \ ProposeLinkInputSchema — fragment_ids: z.array(z.string().uuid()).min(1)\nsrc/modules/ingestion/mcp/mcp-schemas.ts:\
    \ held at the required evidence_ref of IngestDirectedAttributeItemSchema (line 370) and IngestDirectedLinkItemSchema\
    \ (line 394). It holds the rule for directed items only. — evidence_ref: IngestDirectedRefSchema.describe(\n\
    \    \"The `ref` of the fragment that evidences this link (must appear in `fragments[]`).\"\nsrc/modules/ingestion/service/directed-ingestion.service.ts:\
    \ held at DirectedAttributeItemSchema and DirectedLinkItemSchema (required `evidence_ref`, lines 138\
    \ and 149), the cascade checks (lines 899-911), and the proposals at lines 625 and 705 — evidence_ref:\
    \ DirectedRefSchema, ... if (!refToFragmentId.has(item.evidence_ref)) return item.evidence_ref; ...\
    \ fragment_ids: [fragmentId],"
  encoded_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/service/directed-ingestion.service.ts
- node: rules/knowledge-base/name-normalization
  conforms: true
  how: 'src/modules/ingestion/service/entity-resolution.service.ts: held at the lock-key query, the exact-match
    query (step 1) and the trigram candidate query (step 2) of resolveOrCreateNode — "WHERE na.alias_norm
    = norm($1::text)" and "AND na.alias_norm % norm($1::text)". Every name comparison goes through the
    database `norm()` function. The file does not define the normalization itself; it applies it.'
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
- node: rules/knowledge-base/prefer-one-requires-winner
  conforms: true
  how: "src/modules/curation/dto/dispute.dto.ts: held at the prefer_one branch of superRefine, lines 59-69\
    \ — value.winner_id === undefined || value.winner_id === null || !value.item_ids.includes(value.winner_id)\
    \ -> message: \"BUSINESS_DISPUTE_WINNER_REQUIRED\"\nsrc/modules/curation/service/dispute.service.ts:\
    \ held at the prefer_one branch, lines 114-121. It refuses a missing winner, but it does not check\
    \ membership in item_ids; that check is in the DTO. — const winnerId = body.winner_id; if (!winnerId)\
    \ {\n  throw new BusinessError(\n    \"BUSINESS_DISPUTE_WINNER_REQUIRED\",\n    \"decision=prefer_one\
    \ requires winner_id\"\n  );\n}"
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/proposal-confidence-range
  conforms: true
  how: 'src/modules/ingestion/dto/propose-link.dto.ts: held at lines 39-45, the confidence field of ProposeLinkInputSchema
    — confidence: z.number().min(0).max(1)'
  encoded_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
- node: rules/knowledge-base/unused-resolution-fields-ignored
  conforms: true
  how: 'src/modules/curation/dto/dispute.dto.ts: held at the decision-gated branches of superRefine (lines
    47 and 72) together with the unconditional field types of winner_id and periods — if (value.decision
    === "prefer_one") { if (value.decision === "adjust_periods") { winner_id: UuidSchema.optional().nullable(),
    periods: z.array(AdjustedPeriodSchema).optional().nullable(), Neither field is inspected by the other
    decision''s branch. Both are still format-typed whatever the decision, so a malformed value is refused.

    src/modules/curation/service/entity-match.service.ts: held at the keep_separate branch of resolveEntityMatchService
    (lines 58-118). It never reads body.target_node_id, and it returns target_node_id null. — payload:
    { decision: "keep_separate" }, ... target_node_id: null, affected: null. The refusal of a malformed
    value is not in this file, because the file never touches the field on this branch. This file only
    partly holds the node: its dispute-resolution half sits in dispute.dto.ts.'
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/validity-start-before-end
  conforms: true
  how: 'src/modules/curation/dto/dispute.dto.ts: held at the period loop of the adjust_periods branch,
    lines 109-120 — p.valid_from !== null && p.valid_to !== null && p.valid_to !== undefined && p.valid_from
    >= p.valid_to -> message: "BUSINESS_TEMPORAL_INCOHERENT" This covers the adjusted-period case only.
    The proposal and correction cases are not in this file.'
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
unstated:
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: DirectedAttributeItemSchema and DirectedLinkItemSchema, lines 140 and 153, and the forwarding
    at lines 627 and 707
  evidence: 'valid_to: IsoDateSchema.optional(), ... ...(item.valid_to !== undefined ? { valid_to: item.valid_to
    } : {}),'
  cost: The service accepts a validity end on a directed attribute or link and proposes it. The node rules/knowledge-base/directed-validity-start-shape
    and its log hold that "Only the validity start is stated" and that "a validity end never arrives".
    No node says the service takes a validity end, so the code is where that behavior lives. A caller
    reaching the service by another door would set an end date the specification says does not exist.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe fallback, lines 1042-1046, and the null `finished_at` branch, lines 1063-1066
  evidence: "const fallback = {\n    started_at: new Date(0).toISOString(),\n    finished_at: new Date(0).toISOString(),\n\
    \    attempts: 1,\n  }; ... row.finished_at === null\n    ? new Date(0).toISOString()"
  cost: When the closed run cannot be read, the response reports the run started and finished at 1970-01-01T00:00:00.000Z
    with one attempt. That is a domain-visible value the specification never states. The ingest-directed
    contract says only "the completed run, reported completed even where closing it failed". A consumer
    cannot tell a real epoch timestamp from this placeholder.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: refForAttribute, lines 921-923, used as the `ref` of every attribute report entry
  evidence: "function refForAttribute(item: DirectedAttributeItem): string {\n  return `${item.node_ref}.${item.key}`;\n\
    }"
  cost: The reference an attribute's report entry carries is built here as node reference, a dot, then
    key, and appears in the specification nowhere. The specification fixes this format only for links
    (rules/knowledge-base/directed-link-report-reference, joined by "->"). A reader looking in the specification
    for what an attribute entry's reference is will not find it, and the link rule's log says a consumer
    parses the link form.
restates:
- file: src/modules/curation/dto/dispute.dto.ts
  where: JSDoc above ResolveDisputeBodySchema, lines 20-27
  evidence: "* ResolveDisputeRequest — implements BR-11 / BR-15 / BR-16:\n *\n *   - `decision = keep_disputed`\
    \ -> no winner/periods; reason optional"
  cost: 'The comment restates that a keep-disputed decision uses no winner or periods. It is prose no
    running system emits. The code holds the fact in this file: the winner_id and periods checks in superRefine
    run only under `value.decision === "prefer_one"` and `value.decision === "adjust_periods"`. The comment
    also cites BR-11, BR-15 and BR-16 as the authority for the behavior. Those are back-spec identifiers,
    not nodes, so it names a second home outside the specification.'
  node: rules/knowledge-base/unused-resolution-fields-ignored
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 24-25, and the comment above the attribute loop, lines 591-593
  evidence: '"- Forces `confidence = 1.0` and defaults `valid_from_basis = ''stated''` when the caller
    omits it (BR-34 step 4)." and "`confidence = 1.0`; `valid_from_basis` defaults to `''stated''` when
    omitted by caller (BR-34 Defaults matrix)."'
  cost: 'The default basis is stated a second time in prose, outside any behavior. The code that holds
    it is `valid_from_basis: item.valid_from_basis ?? "stated"` in this file (lines 628 and 708). When
    the node moves, the comment keeps asserting the old default and nothing flags it.'
  node: rules/knowledge-base/directed-defaults
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the "Ambiguous" bullet of the resolveOrCreateNode docstring, lines 77-80
  evidence: '"Ambiguous → INSERT a new node with `status = ''needs_review''`, one `entity_match_review`
    row per candidate with `sim >= MATCH_FLOOR`, resolution = `needs_review`."'
  cost: The needs-review policy is narrated in prose. The `INSERT INTO knowledge_node ... 'needs_review'`
    branch and the loop over `decision.candidates` already hold it. A second description outside behavior
    is where the next reader may look instead of the node.
  node: rules/knowledge-base/ambiguous-candidates-need-review
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the "Novel" bullet of the resolveOrCreateNode docstring, lines 81-82
  evidence: '"Novel → INSERT a new node with `status = ''active''`, resolution = `created_new`."'
  cost: The created-new outcome is narrated in prose. The `INSERT INTO knowledge_node ... 'active'` branch
    and the `"created_new"` return hold it. The comment is a second home with no reader.
  node: rules/knowledge-base/no-candidate-creates-active-node
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the comment inside decideFromCandidates, lines 236-239
  evidence: '"// Strong-unique requires exactly one strong AND no second above the floor."'
  cost: The strong-candidate rule is restated in a comment above `if (strong.length === 1 && aboveFloor.length
    === 1)`, which holds it. The node strong-candidate-resolves is outside this file's pack and is not
    in the candidate index, so a change to it would not reach this prose.
  node: rules/knowledge-base/strong-candidate-resolves
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the docstring of TRIGRAM_CANDIDATE_LIMIT, lines 24-28
  evidence: '"Hard cap on the trigram candidate set the decision considers. Matches the `LIMIT 10` in
    the candidate query of BR-25 step 2 / §4.2."'
  cost: The ten-candidate cap is stated a second time in prose beside the constant and the `LIMIT ${TRIGRAM_CANDIDATE_LIMIT}`
    query that hold it. When the node moves, the comment still carries the old number and nothing reads
    it.
  node: rules/knowledge-base/ambiguous-candidates-need-review
- file: src/modules/ingestion/service/entity-resolution.service.ts
  where: the docstring of attachCanonicalAndAliases, lines 247-251
  evidence: '"Attach the canonical name as the first alias (`kind = ''canonical''`) plus any LLM-supplied
    aliases (`kind = ''alias''`) to a newly created node."'
  cost: The alias composition of a new node is stated in prose. The two `INSERT INTO node_alias` statements
    in this file hold it. The comment would go stale silently if the node changed.
  node: rules/knowledge-base/new-node-aliases
adopted: true
pairs_omitted:
- node: rules/knowledge-base/curation-reason-required
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-distinct-items
  file: src/modules/curation/dto/dispute.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-is-atomic
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/dispute-decision
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjust-periods-outcome
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/adjusted-periods-single-open
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-check-order
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-records-curation-action
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/dispute-resolution-requires-disputed-items
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/keep-disputed-changes-nothing
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prefer-one-outcome
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-curation-records-nothing
  file: src/modules/curation/service/dispute.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/curation-is-atomic
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/entity-match-decision
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/curation-refuses-deleted-node
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-check-order
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-clears-reviews
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-records-curation-action
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-match-resolution-requires-pending-review
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/keep-separate-activates-node
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merge-into-requires-target
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-merge-absorbs-active-node
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-merge-records-curation-action
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-never-merged-into-itself
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/refused-curation-records-nothing
  file: src/modules/curation/service/entity-match.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
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
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-kind
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-status
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-as-text
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-attribute-value-shape
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-chat-pointer-whole
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-dependency-failed
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-dispatch-order
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-fragments-anchor-first-chunk
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-full-confidence
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-ingestion-run
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-item-status
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-pinned-node
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-reference-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-requires-fragment-and-node
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-run-completes
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-content
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-label-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-source-metadata
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-turn-is-original-input
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-validity-start-shape
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-name-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/candidate-similarity
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/concurrent-proposals-resolve-in-turn
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
notes: "Judged by 8 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/adopt-drift-item4b.returns/.\nStaged as an adoption of source no delivery\
  \ wrote: 2 candidate node(s) were read on every file, and each cleared one is bound to the files whose\
  \ judgment holds its fact.\nA finding in src/modules/curation/dto/dispute.dto.ts names domain/knowledge-base/adjusted-period,\
  \ which no file of this set is bound to: AdjustedPeriodSchema, line 15 (the valid_from field of an entry\
  \ in periods[]): valid_from: IsoDateSchema.nullable(), and the later branch that treats null as a legitimate\
  \ value: p.valid_from !== null && — The adjusted-period node declares valid_from as required, a date.\
  \ This shape accepts a null start. A caller can then give a disputed assertion a period with no start,\
  \ and the specification never decided that. The validity-start-before-end check also skips such a period\
  \ silently. Whoever reads the node will not look here to learn that a period may have no start. This\
  \ is a judgment from the node text alone. The adjusted-period node and its log are silent on null, and\
  \ the contract's refusal for a field that is \"null where it may not be\" is the only nearby statement..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/curation/service/dispute.service.ts\
  \ names contracts/knowledge-base/curation, which no file of this set is bound to: resolveDisputeService,\
  \ the prefer_one branch, lines 116-121 (the BusinessError thrown when winner_id is absent): throw new\
  \ BusinessError(\n  \"BUSINESS_DISPUTE_WINNER_REQUIRED\",\n  \"decision=prefer_one requires winner_id\"\
  \n); — The contract answers this refusal with the message \"decision=prefer_one requires winner_id (member\
  \ of item_ids)\". The service emits the same code with a shorter message that omits the membership clause.\
  \ The request DTO (src/modules/curation/dto/dispute.dto.ts, which issues BUSINESS_DISPUTE_WINNER_REQUIRED\
  \ when winner_id is not in item_ids) is checked before the service. This branch is probably reachable\
  \ only by a caller that skips the DTO. A reader who compares this message with the contract finds two\
  \ wordings of one refusal. The service also never checks that winner_id belongs to item_ids, so the\
  \ \"among its items\" half of the rule is held only in the DTO.. It blocks nothing here; it is owed\
  \ a route of its own.\nA finding in src/modules/curation/service/dispute.service.ts names contracts/knowledge-base/curation,\
  \ which no file of this set is bound to: resolveDisputeService, the adjust_periods branch, lines 199-204\
  \ (the BusinessError thrown when periods is absent or empty): throw new BusinessError(\n  \"BUSINESS_DISPUTE_PERIODS_REQUIRED\"\
  ,\n  \"decision=adjust_periods requires periods[]\"\n); — The contract answers this refusal with the\
  \ message \"decision=adjust_periods requires periods[] (one entry per item_id)\". The service emits\
  \ the same code with a message that omits the \"(one entry per item_id)\" clause. The service also checks\
  \ only that periods is non-empty. The one-period-per-item half of the rule is not checked in this file..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/curation/service/entity-match.service.ts\
  \ names rules/knowledge-base/node-never-merged-into-itself, which no file of this set is bound to: resolveEntityMatchService,\
  \ the self-merge guard before withTransaction (lines 45-55): if (body.decision === \"merge_into\" &&\
  \ body.target_node_id !== null && body.target_node_id === nodeId) { throw new ConflictError(\"BUSINESS_SELF_MERGE_FORBIDDEN\"\
  , \"merge_into target equals the node being resolved\", { node_id: nodeId }); } — The rule that a node\
  \ is never merged into itself is implemented here, a second time beside merge.service.ts and entity-match.dto.ts,\
  \ and the node that holds it is bound to none of the three of them in this batch. When the node moves,\
  \ --check does not reach this file. Nobody can tell which of the copies is the decided one.. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/modules/curation/service/entity-match.service.ts\
  \ names rules/knowledge-base/curation-refuses-deleted-node, which no file of this set is bound to: keep_separate\
  \ branch, deleted-node refusal (lines 66-71): if (node.status === \"deleted\") { throw new NodeDeletedError(\"\
  KnowledgeNode tombstoned by compliance_delete\", { node_id: nodeId }); } — The refusal to resolve a\
  \ deleted node is carried here, and the node that holds it is not bound to this file. A change to the\
  \ node does not reach this branch, and a reader looking for the rule in the specification finds it separated\
  \ from the code that applies it.. It blocks nothing here; it is owed a route of its own.\nA finding\
  \ in src/modules/curation/service/entity-match.service.ts names rules/knowledge-base/entity-match-resolution-requires-pending-review,\
  \ which no file of this set is bound to: keep_separate branch, pending-review check (lines 72-78): if\
  \ (node.status !== \"needs_review\") { throw new ConflictError(\"BUSINESS_REVIEW_NOT_PENDING\", \"Node\
  \ is not in `needs_review` state\", { node_id: nodeId, current_status: node.status }); } — The requirement\
  \ that a resolution act only on a node in needs-review is applied here, and its node is not bound to\
  \ this file. A change to the node leaves this branch behind without any check noticing.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/curation/service/entity-match.service.ts\
  \ names rules/knowledge-base/merge-into-requires-target, which no file of this set is bound to: merge_into\
  \ branch, defensive target check (lines 121-128): if (targetNodeId === null || targetNodeId === undefined)\
  \ { throw new BusinessError(\"BUSINESS_TARGET_NODE_REQUIRED\", \"decision=merge_into requires target_node_id\"\
  ); } — The rule that a merge-into names a target is applied a second time here, after the DTO. Its node\
  \ is not bound to this file, so a change to the node does not reach this refusal.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/ingestion/mcp/mcp-schemas.ts names\
  \ contracts/knowledge-base/ingestion, which no file of this set is bound to: LlmRunIdField, lines 28-35,\
  \ the llm_run_id argument added to the four MCP propose_* schemas: llm_run_id: z\n    .string()\n  \
  \  .min(1)\n    .describe(\n      \"Active LLMRun id this proposal belongs to. Required on every MCP\
  \ call (Option B — arg-based run binding). The handler aborts with RESOURCE_NOT_FOUND when the id is\
  \ unknown or BUSINESS_RUN_NOT_RUNNING when the row exists but its status is not `running`.\" — The contract\
  \ refuses a malformed LLM run identity with VALIDATION_INVALID_FORMAT on both transports, and its decision\
  \ log records that MCP proposals used to accept any non-empty text. This schema still accepts any non-empty\
  \ string, so a value such as \"x\" passes the Zod parse here. Whether a later check refuses it cannot\
  \ be seen from this file. The sibling schema in the same file (`get_ingestion_status`) does use `.uuid()`,\
  \ so the file states the run identity two ways.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/ingestion/mcp/mcp-schemas.ts names constraints/ingest-toolset-offers-no-async-ingestion,\
  \ which no file of this set is bound to: StartAsyncIngestionMcpInputSchema, lines 81-123, including\
  \ its description of the BACKGROUND run: export const StartAsyncIngestionMcpInputSchema = z.object({\
  \ ... \"The full plain text of the document to ingest. Paste the raw content; the server chunks it,\
  \ runs structured extraction in the BACKGROUND, and persists the knowledge graph with provenance. No\
  \ base64/binary.\" — The constraint says the ingest toolset offers no tool that starts an ingestion\
  \ and returns before it completes. Its decision log says the tool is retired because ingestion is one-shot.\
  \ This file still declares the input contract of such a tool and the text a client would read when it\
  \ is advertised. A reader of the specification would believe the tool does not exist, while the code\
  \ is the place it still lives. Whether it is registered is the toolset registrar's, not this file's..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/mcp/mcp-schemas.ts\
  \ names contracts/knowledge-base/ingestion, which no file of this set is bound to: IngestDirectedNodeItemSchema,\
  \ the description of node_id, line 341: Rejected (VALIDATION_INVALID_FORMAT) if the id does not point\
  \ to an active node. — This is text a client reads on `tools/list`. The contract reports a pin that\
  \ names no knowledge node as rejected with RESOURCE_NOT_FOUND, and only a pin naming a node that is\
  \ not active as rejected with VALIDATION_INVALID_FORMAT. The description gives one code for both cases,\
  \ so a caller written to it expects the wrong code for an absent node.. It blocks nothing here; it is\
  \ owed a route of its own.\nCandidates: 24 opened across 6 of 8 delegation(s); each return lists its\
  \ own under `candidates_opened`.\nUnstated: 3 fact(s) the source states that no node holds, over 1 file(s),\
  \ listed under `unstated`. They block no binding here and no rebind closes them — the route is the analysis\
  \ that gives each fact a node.\nRestates: 7 place(s) where text in the source restates a node's fact\
  \ the code holds, over 3 file(s), listed under `restates`. The pair conforms, so none blocks a binding\
  \ — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-drift-item4b.returns/`, which are the evidence behind every entry above.
