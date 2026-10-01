---
contract_version: siegard-reconcile/8
title: Certification of 61 ingestion nodes against the offered unit tests under unit/ingestion
summary: The source did not change; the owner offers, by the entries of siegard-work/certify-ingestion-tests.yaml,
  the unit tests under src/__tests__/unit/ingestion/ as the proof of 61 ingestion nodes, run by the registry's
  step test; this reconciliation reads the 29 source files bound to those nodes against their nodes while
  the auditor judges each proof.
target: backend
files:
- path: src/modules/ingestion/catalog/catalog.ts
  change: Unchanged; builds the catalog snapshot and decides whether a link type rule is in effect for
    a source node type, link type and target node type on a day.
- path: src/modules/ingestion/chunker/config.ts
  change: Unchanged; declares the chunking version and the chunk size constants.
- path: src/modules/ingestion/chunker/v1.ts
  change: Unchanged; cuts content into raw chunks by source type, with code-point offsets, indexes from
    0 and sentence-level cutting of long blocks.
- path: src/modules/ingestion/dto/index.ts
  change: Unchanged; re-exports the ingestion DTOs and declares the JSON schemas and descriptions of the
    four proposal tools.
- path: src/modules/ingestion/dto/propose-link.dto.ts
  change: Unchanged; declares the link proposal input, with the validity basis a caller may state limited
    to stated and document.
- path: src/modules/ingestion/hash.ts
  change: Unchanged; computes the content hash as the SHA-256 of the content's UTF-8 bytes and composes
    the idempotency key.
- path: src/modules/ingestion/mcp/directed-ingest.handler.ts
  change: Unchanged; validates the directed ingestion arguments and forwards the chat turn's excerpt to
    the orchestrator.
- path: src/modules/ingestion/mcp/handler-base.ts
  change: Unchanged; runs a proposal handler in a transaction and records only the tool call of a refused
    or failed proposal.
- path: src/modules/ingestion/mcp/ingest-document.handler.ts
  change: Unchanged; ingests a document and drives its extraction, answering already ingested without
    extracting when the content is held.
- path: src/modules/ingestion/mcp/mcp-schemas.ts
  change: Unchanged; declares the MCP input schemas of the ingestion tools, among them the recent ingestions
    limit with its bounds and default.
- path: src/modules/ingestion/mcp/propose-fragment.handler.ts
  change: Unchanged; handles a fragment proposal through the shared handler base.
- path: src/modules/ingestion/prompts/extraction.v1.ts
  change: Unchanged; declares the first extraction prompt and the block shown to the model for each chunk.
- path: src/modules/ingestion/prompts/extraction.v2.ts
  change: Unchanged; declares the second extraction prompt version.
- path: src/modules/ingestion/prompts/extraction.v3.ts
  change: Unchanged; declares the third extraction prompt version.
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: Unchanged; declares the fourth extraction prompt version.
- path: src/modules/ingestion/prompts/index.ts
  change: Unchanged; registers the four prompt versions, declares the default version and refuses a version
    the system does not hold.
- path: src/modules/ingestion/repository/llm-run.repository.ts
  change: Unchanged; reads and writes LLM runs and tool calls, and counts a run's tool calls by validation
    outcome.
- path: src/modules/ingestion/service/affected-nodes.ts
  change: Unchanged; collects the knowledge nodes a run's proposals reached, each once in the order first
    reached.
- path: src/modules/ingestion/service/directed-ingestion.service.ts
  change: Unchanged; runs a directed ingestion by proposing its fragments, nodes, attributes and links
    in order at full confidence.
- path: src/modules/ingestion/service/entity-resolution.service.ts
  change: Unchanged; resolves a node proposal by exact alias, by trigram similarity or by creating a node.
- path: src/modules/ingestion/service/graph-consolidation.service.ts
  change: Unchanged; consolidates a link or attribute proposal against the current assertion as a new
    assertion, a re-affirmation, a succession, a dispute or a correction.
- path: src/modules/ingestion/service/ingestion.service.ts
  change: Unchanged; records a raw information with its chunks and one LLM run, or answers noop for held
    content.
- path: src/modules/ingestion/service/propose-attribute.service.ts
  change: Unchanged; validates and consolidates an attribute proposal through the layered checks.
- path: src/modules/ingestion/service/propose-link.service.ts
  change: Unchanged; validates and consolidates a link proposal through the layered checks.
- path: src/modules/ingestion/validation/confidence.ts
  change: Unchanged; routes a proposal's confidence to active, uncertain or below the floor.
- path: src/modules/ingestion/validation/graph-rules.ts
  change: Unchanged; refuses a link proposal that no link type rule in effect permits.
- path: src/modules/ingestion/validation/structural.ts
  change: Unchanged; parses an attribute value by its type and checks a value against its key's allowed
    values.
- path: src/modules/ingestion/validation/temporal.ts
  change: Unchanged; checks validity dates, the correction evidence and the date basis of a proposal.
- path: src/shared/health.ts
  change: Unchanged; reports the service name, the store's status and the probe time without ever failing.
nodes:
- node: domain/knowledge-base/health-report
  conforms: true
  how: "src/shared/health.ts: held at the HealthReport interface, lines 11-16, and the two report literals\
    \ returned by collectHealth() — export interface HealthReport {\n  ok: boolean;\n  service: \"remember-bff\"\
    ;\n  database: \"ok\" | \"unreachable\";\n  checked_at: string;\n}"
  encoded_at:
  - src/shared/health.ts
  decided_by: reading
  remainder: testable
  remainder_why: Two checks would close it. With the store answering, checked_at must parse as a datetime
    between the moments just before and just after the probe call. With the store unreachable, the report
    must still carry a non-empty service string and a checked_at that parses as a datetime, next to ok
    false and database unreachable.
- node: domain/knowledge-base/ingest-tool
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/dto/index.ts, src/modules/ingestion/mcp/mcp-schemas.ts,
    src/modules/ingestion/prompts/extraction.v1.ts, and src/modules/ingestion/mcp/propose-fragment.handler.ts
    read `nowhere` — The file only passes the value along as a tool name, `tool_name: "propose_fragment"`,
    and declares no enumeration of the proposal kinds. The enumeration''s shape (propose-fragment, propose-node,
    propose-link, propose-attribute) is not declared here. The snake_case spelling matches the node''s
    note on the material''s spelling.; src/modules/ingestion/service/affected-nodes.ts read `nowhere`
    — This file compares tool names as string literals and does not declare the enumeration''s shape:

    toolName !== "propose_node" &&

    toolName !== "propose_link" &&

    toolName !== "propose_attribute" — a binding asserts the file answers for the node, so the pair that
    stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/mcp/propose-fragment.handler.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/affected-nodes.ts
- node: domain/knowledge-base/prompt-version
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/prompts/extraction.v1.ts,
    src/modules/ingestion/prompts/extraction.v2.ts, src/modules/ingestion/prompts/extraction.v3.ts, src/modules/ingestion/prompts/index.ts,
    and src/modules/ingestion/prompts/extraction.v4.ts read `nowhere` — The file only passes the value
    along and declares no enumeration of versions: `export const PROMPT_VERSION = "v4" as const;`. The
    enumeration v1 to v4 is a shape this file does not declare. — a binding asserts the file answers for
    the node, so the pair that stopped holding it is released by `--bind ... --replace`, never restamped
    here'
  observed_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/prompts/extraction.v2.ts
  - src/modules/ingestion/prompts/extraction.v3.ts
  - src/modules/ingestion/prompts/extraction.v4.ts
  - src/modules/ingestion/prompts/index.ts
- node: domain/knowledge-base/raw-chunk
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/chunker/v1.ts, and src/modules/ingestion/repository/llm-run.repository.ts
    read `nowhere` — The file declares no shape for a raw chunk. It only reads two columns of the table
    in SQL: `JOIN raw_chunk rc       ON rc.id = fs.raw_chunk_id ... AND rc.raw_information_id = $2` and
    `FROM raw_chunk WHERE id = ANY($1::uuid[]) AND raw_information_id = $2`. None of the node''s attributes
    (chunk_index, offset_start, offset_end, text, locator, status) is declared here.; src/modules/ingestion/service/ingestion.service.ts
    read `nowhere` — This file reads the chunk attributes and does not declare their shape: "chunks: chunkRows.map((c)
    => ({ id: c.id, chunk_index: c.chunk_index, offset_start: c.offset_start, offset_end: c.offset_end
    }))". The row type comes from ../repository/ingestion.repository.js. — a binding asserts the file
    answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never
    restamped here'
  observed_at:
  - src/modules/ingestion/chunker/v1.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
- node: domain/knowledge-base/raw-information
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/prompts/extraction.v1.ts,
    and src/modules/ingestion/mcp/mcp-schemas.ts read `nowhere` — The file declares only tool input schemas
    that carry document fields (`content`, `source_type`, `metadata`), for example `IngestDocumentMcpInputSchema`
    with `metadata: z.record(z.string(), z.unknown()).optional()`. It does not declare the raw-information
    element''s shape. Its attributes, such as `content_hash`, `status` and `storage_ref`, are absent here.;
    src/modules/ingestion/repository/llm-run.repository.ts read `nowhere` — The file declares no shape
    for raw information. `RecentIngestionRow` is a projection type that reads some columns (`readonly
    source_type: string; readonly raw_status: string; readonly received_at: Date; readonly content_preview:
    string;`) from a query on `FROM raw_information ri`. It does not declare the element''s attributes.;
    src/modules/ingestion/service/ingestion.service.ts read `nowhere` — This file passes raw-information
    values to `insertRawInformation(client, { source_type: input.source_type, content: input.content,
    content_hash: contentHash, metadata: input.metadata, original_input: input.original_input ?? null
    })` and reads `rawInformationRow.id`. It declares no type, schema or table for the element. — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/modules/ingestion/dto/propose-link.dto.ts: held at ValidFromBasisSchema, line 16, which declares
    the enum in part (stated and document), and the optional `valid_from_basis` field of ProposeLinkInputSchema,
    line 66. — export const ValidFromBasisSchema = z.enum(["stated", "document"]); The node lists three
    values (stated, document, received). This file declares the two that a caller may state. Leaving out
    `received` follows rules/knowledge-base/caller-never-states-received ("A proposal MUST NOT state the
    basis received."), so it is not a contradiction. The full three-value union is declared in validation/temporal.ts
    and service/graph-consolidation.service.ts.

    src/modules/ingestion/prompts/extraction.v1.ts: held at system(), "Dates" section lines 164-167, and
    the worked example''s `valid_from_basis:"document"`. It is emitted text and states the three values
    consistently with the node. — "- Justify it with `valid_from_basis`: `stated` only when the start
    date is", "  written in the chunk (and supported by a cited fragment); `document` uses", "  the document
    date; otherwise omit `valid_from`/basis and the backend", "  records `received`. NEVER invent a date.
    Dates are ISO `YYYY-MM-DD`.",

    src/modules/ingestion/service/graph-consolidation.service.ts: held at the `valid_from_basis` members
    of ConsolidateLinkArgs (line 123) and ConsolidateAttributeArgs (line 139) — readonly valid_from_basis:
    "stated" | "document" | "received" | null;

    src/modules/ingestion/validation/temporal.ts: held at The inline union types of `valid_from_basis`
    in `TemporalLayerInput` (line 34) and `TemporalResolved` (line 58). — readonly valid_from_basis: "stated"
    | "document" | "received" | null;'
  encoded_at:
  - src/modules/ingestion/dto/propose-link.dto.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/graph-consolidation.service.ts
  - src/modules/ingestion/validation/temporal.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Take an assertion whose source states no date and whose document carries no date of
    its own. Run it through the path that records the basis. The expected result is a basis of received,
    with valid_from equal to the source''s received date. Matching assertions, one with a date the source
    states and one with only the document''s own date, would close stated and document the same way: each
    should record that basis and that date.'
- node: rules/knowledge-base/affected-nodes-of-a-run
  conforms: false
  how: "src/modules/ingestion/service/affected-nodes.ts, isContributingOutcome(), lines 87-99, applied\
    \ to propose_link and propose_attribute at line 131: case \"created_new\":\ncase \"matched_existing\"\
    :\ncase \"needs_review\":\ncase \"accepted\":\ncase \"consolidated\":\ncase \"superseded_previous\"\
    :\ncase \"disputed\":\n  return true;\n...\nif (!isContributingOutcome(outcome)) return []; — The\
    \ node limits link and attribute contributions to proposals that were accepted, consolidated, superseded\
    \ a previous assertion or were disputed. The code applies one shared allow-list to both tools. That\
    \ list also admits created_new, matched_existing and needs_review, which are node resolutions. A grep\
    \ of propose*.ts under service/ finds none of the three there. So the wider rule is probably dead\
    \ today. It would take effect without any change here if a link or attribute proposal ever returned\
    \ one of them. The next reader would not find the rule in the specification, because the code states\
    \ a wider rule than the node does."
  observed_at:
  - src/modules/ingestion/service/affected-nodes.ts
- node: rules/knowledge-base/attribute-proposal-check-order
  conforms: true
  how: 'src/modules/ingestion/service/propose-attribute.service.ts: held at the sequence of statements
    in proposeAttributeService, lines 53-183 — `findNodeTypeIdByNodeId` + `assertFound`, then `attributeKeyByNodeTypeAndKey.get(...)`
    + `assertKnownType`, then `parseAttributeValue` and `if (domain !== null) { assertValueInDomain(args.value,
    domain); }`, then the `fragRes` existence and `llm_run_id` ownership checks, then `validateTemporal({...})`,
    then `routeConfidence(args.confidence)` with `route.kind === "below_floor"`, then `countFragmentsAnchoredToSource(...)`.
    Each failure throws or returns before the next statement.'
  encoded_at:
  - src/modules/ingestion/service/propose-attribute.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'The order is a finite chain of eight checks, so a table of seven cases closes it. Each
    case pairs one check with the check right after it. It submits a proposal that fails both, against
    one expected result: refused with the earlier check''s reason and nothing written. The cases are:
    missing node with unknown key; unknown key with unparseable value; value of the wrong type or outside
    the allowed values with a nonexistent or foreign-run fragment; such a fragment with bad dates; bad
    dates with too-low confidence; too-low confidence with unanchored fragments. Add one proposal for
    each check that fails only that check and is refused for that check''s reason.'
- node: rules/knowledge-base/attribute-value-in-allowed-values
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at the valuesSuffix construction in system(),\
    \ lines 106-112. It prints each closed-domain key's allowed values in the catalog section, verbatim\
    \ and JSON-quoted. Enforcement is held in other files. — const valuesSuffix =\n  domain !== null\n\
    \    ? `, values: [${[...domain]\n        .sort()\n        .map((v) => JSON.stringify(v))\n      \
    \  .join(\",\")}]`\n    : \"\";\nsrc/modules/ingestion/service/propose-attribute.service.ts: held\
    \ at the branch at lines 93-96 — const domain = domainOf(deps.catalog, resolvedKey.id);\n  if (domain\
    \ !== null) {\n    assertValueInDomain(args.value, domain);\n  }\nsrc/modules/ingestion/validation/structural.ts:\
    \ held at assertValueInDomain(), lines 109-125: the `domain.has(value)` membership test and the throw\
    \ on a miss — if (domain.has(value)) {\n    return;\n  }\n  const allowed_values = [...domain].sort();\n\
    \  throw new ValidationFailure(\n    \"VALIDATION_INVALID_FORMAT\",\n    \"attribute value not in\
    \ closed domain\",\n    { value, allowed_values }\n  );"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/structural.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result: an attribute correction for a key with allowed
    values (for example doc_type), carrying a value not in that set or differing from a member only in
    case or accent. The expected result is a refusal that leaves the attribute''s current value unchanged.
    Paired with it, a correction carrying an allowed value exactly as written is accepted.'
- node: rules/knowledge-base/below-confidence-floor-records-nothing
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at system(), rule 7, line 153. The prompt\
    \ tells the model the floor truthfully. The code that records nothing below 0.40 is not in this file.\
    \ — \"7. CONFIDENCE ∈ [0,1], be honest: ≥ 0.75 → stored active; 0.40–0.74 →\", \"   `uncertain` (kept,\
    \ flagged); < 0.40 → dropped. Lower it for hedged\",\nsrc/modules/ingestion/service/propose-attribute.service.ts:\
    \ held at the `below_floor` branch at lines 159-167 — if (route.kind === \"below_floor\") {\n    const\
    \ result: ProposeAttributeResult = {\n      attribute_id: null,\n      outcome: \"rejected\",\n  \
    \    reason: \"BELOW_CONFIDENCE_FLOOR\",\n    };\n    return { ok: true, result };\n  }\nsrc/modules/ingestion/service/propose-link.service.ts:\
    \ held at the `route.kind === \"below_floor\"` branch of proposeLinkService (lines 168-178). It returns\
    \ before `countFragmentsAnchoredToSource` and `consolidateLink`, so no knowledge link is written.\
    \ The 0.40 threshold itself is applied in `routeConfidence`, imported from validation/confidence.js\
    \ and not part of this file. — const route = routeConfidence(args.confidence); if (route.kind ===\
    \ \"below_floor\") {\n  const result: ProposeLinkResult = {\n    link_id: null,\n    outcome: \"rejected\"\
    ,\n    reason: \"BELOW_CONFIDENCE_FLOOR\",\n  };\n  return { ok: true, result };\n}\nsrc/modules/ingestion/validation/confidence.ts:\
    \ held at CONFIDENCE_FLOOR (line 14) and the final branch of routeConfidence (line 27), which classifies\
    \ a confidence below the floor as below_floor. The file only classifies. The act of recording nothing\
    \ sits in the caller, outside this file. — export const CONFIDENCE_FLOOR = 0.4 as const; ... if (confidence\
    \ >= CONFIDENCE_FLOOR) return { kind: \"uncertain\" }; return { kind: \"below_floor\" };"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/service/propose-link.service.ts
  - src/modules/ingestion/validation/confidence.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Two inputs, one expected result each. First, a link proposal with confidence 0.39 inside
    a valid run, with valid provenance: the expected result is that no knowledge_link row is recorded
    for it. Second, an attribute proposal with confidence 0.39 under the same conditions: the expected
    result is that no node_attribute row is recorded for it.'
- node: rules/knowledge-base/chunk-excerpt-is-verbatim
  conforms: true
  how: "src/modules/ingestion/chunker/v1.ts: held at buildChunk, lines 417-430 — text: codePoints.slice(start,\
    \ endExclusive).join(\"\"),\n    offset_start: start,\n    offset_end: endExclusive,"
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'For each of these inputs, assert that every emitted chunk''s text equals the original
    content''s code-point slice between that chunk''s offset_start and offset_end: an `email` with headers
    and a body, a multi-speaker `chat`, a timestamped `transcricao`, and an `ata` above CHUNK_HARD_MAX
    that goes through the sentence-level fallback. For a persisted raw chunk, run the same assertion on
    the raw chunk as stored against its raw information''s content.'
- node: rules/knowledge-base/chunk-index-follows-content
  conforms: true
  how: "src/modules/ingestion/chunker/v1.ts: held at the buildChunk calls in chunkV1, lines 82-84, 105-107,\
    \ 115-117 and 127. Each passes `chunks.length` as the index, and blocks and sentences are walked in\
    \ content order. — chunks.push(\n          buildChunk(codePoints, bufferStart, bufferEnd, chunks.length)\n\
    \        );"
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: Chunk one chat input with several speaker lines, and one input above CHUNK_HARD_MAX that
    also crosses a hard boundary, such as a pdf whose page holds an oversize block. For each, assert that
    the chunk_index sequence is exactly 0..n-1. Also assert that, in chunk_index order, the offset_start
    values strictly increase, so that each index follows the chunk's position in the content.
- node: rules/knowledge-base/chunking-version
  conforms: true
  how: 'src/modules/ingestion/chunker/config.ts: held at the CHUNKING_VERSION declaration, line 10 — export
    const CHUNKING_VERSION = "v1" as const;

    src/modules/ingestion/chunker/v1.ts: held at buildChunk, line 428, and the RawChunkInput type, line
    52. The value `v1` itself is declared in ./config.js, outside this file set and not read. — chunking_version:
    CHUNKING_VERSION,'
  encoded_at:
  - src/modules/ingestion/chunker/config.ts
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: Two checks would close it, both comparing to the literal 'v1' rather than the constant.
    First, chunk a non-empty input, assert at least one chunk came back, and assert every chunk's chunking_version
    is 'v1'. Second, ingest a document and read its stored raw chunks back, asserting each one records
    chunking_version 'v1'.
- node: rules/knowledge-base/conflict-disputes
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at branch (d) of consolidateLinkOnce\
    \ (lines 628-649) and of consolidateAttributeOnce (lines 834-851) — SET status = 'disputed'::assertion_status\n\
    ...\nconst newRow = await insertLinkRow(client, args, runCtx, {\n  status: \"disputed\",\n  supersedes_link_id:\
    \ null,\n});"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'The test that would close it: propose an assertion against a current assertion of a
    functional link type, and the same for a functional attribute key, with the proposal meeting it as
    a dispute. The expected result is that the existing assertion, identified by its own id, ends up with
    status ''disputed''. Check this by asserting that the status-setting UPDATE is bound to that id, or
    by reading the assertion back. Keep the existing check that the one new assertion has status ''disputed''
    and supersedes nothing.'
- node: rules/knowledge-base/consolidation-records-provenance
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at insertLinkProvenance and\
    \ insertAttributeProvenance (lines 215-241), called on the row each branch lands on — INSERT INTO\
    \ provenance (link_id, fragment_id)\n   SELECT $1, f FROM unnest($2::uuid[]) AS f\n   ON CONFLICT\
    \ DO NOTHING"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Propose a link, and separately an attribute, citing two distinct fragments in each branch:
    accepted new, consolidated, superseded_previous, disputed and correction. Assert exactly two provenance
    rows each time. Their fragment_ids must equal the two cited ids, and their target must be the assertion
    the outcome names: the existing row''s id for consolidated, and the newly inserted row''s id for every
    other branch.'
- node: rules/knowledge-base/content-hash-is-sha256
  conforms: true
  how: 'src/modules/ingestion/hash.ts: held at sha256Hex, line 17 — return createHash("sha256").update(content,
    "utf8").digest("hex");

    src/modules/ingestion/service/ingestion.service.ts: held at ingestRawInformation, the statement at
    line 103, which takes the hash over the whole content; the digest itself is implemented in ../hash.js
    — const contentHash = sha256Hex(input.content);'
  encoded_at:
  - src/modules/ingestion/hash.ts
  - src/modules/ingestion/service/ingestion.service.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/ingestion/hash.spec.ts
  - src/__tests__/unit/ingestion/original-input-capture.spec.ts
- node: rules/knowledge-base/correction-replaces
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at branch (b) of consolidateLinkOnce\
    \ (lines 562-583) and of consolidateAttributeOnce (lines 787-805) — SET superseded_at = now(),\n \
    \   status        = 'superseded'::assertion_status\nWHERE id = $1\n...\nsupersedes_link_id: vigent.id,"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: The input is a proposal with change_hint='correction' whose cited fragment text is neutral,
    against a current assertion, run once for a link and once for an attribute, including a multi-valued
    type. The expected result has three parts. The met assertion's row, picked out by its id in the UPDATE
    bindings or by reading it back, ends with status 'superseded'. Its valid_to keeps the value it had
    before. One new assertion is recorded whose supersedes_link_id or supersedes_attribute_id equals the
    met assertion's id.
- node: rules/knowledge-base/correction-requires-errata-evidence
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/validation/temporal.ts,
    and src/modules/ingestion/service/propose-attribute.service.ts read `nowhere` — The file only forwards
    the inputs to another module: `change_hint: args.change_hint, fragment_texts: fragmentTexts,` inside
    `validateTemporal({...})`. No errata keyword test appears in this file. — a binding asserts the file
    answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never
    restamped here'
  observed_at:
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/temporal.ts
- node: rules/knowledge-base/default-prompt-version
  conforms: true
  how: 'src/modules/ingestion/mcp/ingest-document.handler.ts: held at line 120, the fallback in the body
    built by ingestDocumentHandler. The value v4 is declared in the imported DEFAULT_PROMPT_VERSION (prompts/index.ts),
    not in this file. — prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION,

    src/modules/ingestion/prompts/index.ts: held at the DEFAULT_PROMPT_VERSION export, line 63. It resolves
    to "v4", per the PROMPT_VERSION declaration in extraction.v4.ts. — export const DEFAULT_PROMPT_VERSION:
    string = v4.PROMPT_VERSION;'
  encoded_at:
  - src/modules/ingestion/mcp/ingest-document.handler.ts
  - src/modules/ingestion/prompts/index.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input: a document ingestion request that names no prompt version. One expected result:
    the run it creates (its llm_run.prompt_version) records "v4", and the prompt sent for extraction is
    the v4 system prompt.'
- node: rules/knowledge-base/directed-attribute-value-as-text
  conforms: true
  how: "src/modules/ingestion/service/directed-ingestion.service.ts: held at canonicaliseAttributeValue,\
    \ lines 941-945, called at line 631 — if (typeof v === \"boolean\") return v ? \"true\" : \"false\"\
    ;\n  return String(v);"
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Two inputs, each with one expected result. A directed attribute with the number value
    30 should reach propose_attribute with value equal to the text "30", checked as a string (for example
    with toBe("30") and typeof "string"). A directed attribute with the boolean value true (and one with
    false) should reach propose_attribute with value equal to the text "true" (and "false").
- node: rules/knowledge-base/directed-defaults
  conforms: false
  how: 'src/modules/ingestion/service/directed-ingestion.service.ts, DirectedAttributeItemSchema and DirectedLinkItemSchema
    `change_hint` (lines 144 and 155), applied at lines 637 and 717: change_hint: ChangeHintSchema.optional(),
    ... change_hint: item.change_hint ?? "none", — The node says a directed attribute or link is proposed
    with change hint none, and gives no other case. The code proposes with whatever change hint the caller
    states, and falls back to none only when it is omitted. A service caller can supply `succession` or
    `correction` and change how the proposal supersedes a current assertion. The decision log of directed-defaults
    says the tool never delivers a change hint, but this file does not enforce that.'
  observed_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
- node: rules/knowledge-base/directed-dependency-failed
  conforms: true
  how: "src/modules/ingestion/service/directed-ingestion.service.ts: held at checkCascade (lines 902-910)\
    \ and checkLinkCascade (lines 912-921), with the report entries at lines 606-611 and 685-690 — if\
    \ (!refToNodeId.has(item.node_ref)) return item.node_ref;\n  if (!refToFragmentId.has(item.evidence_ref))\
    \ return item.evidence_ref;\n... status: \"dependency_failed\",\n  reason: cascade,"
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: The open part can be closed with a few inputs, each with one expected result. In each
    case the item is not proposed and the report shows dependency_failed with the reason given here. (1)
    An attribute whose node and evidence are both missing gives the node reference as the reason. (2)
    A link whose source, target and evidence are all missing gives the source reference. (3) A link whose
    target and evidence are missing, with the source present, gives the target reference. (4) A link whose
    only missing reference is the target gives the target reference. (5) An attribute whose node is present
    but whose evidence is missing, sent through the orchestrator, gives the evidence reference.
- node: rules/knowledge-base/directed-dispatch-order
  conforms: true
  how: "src/modules/ingestion/service/directed-ingestion.service.ts: held at the four loops in directedIngestionService,\
    \ in sequence: fragments (line 472), nodes (513), attributes (603), links (682). The report is pushed\
    \ in that order. — for (const item of payload.fragments) { ...\n  for (const item of payload.nodes)\
    \ {\n...\n  for (const item of attributeItems) {\n...\n  for (const item of linkItems) {"
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Give a directed ingestion two or more attributes and two or more links, each group in
    an order no sort would produce. Assert that the attribute proposals and the link proposals follow
    that given order. Assert that the report's attribute entries and link entries appear in that same
    order, after the fragments and nodes.
- node: rules/knowledge-base/directed-full-confidence
  conforms: true
  how: 'src/modules/ingestion/dto/index.ts: held at Not enforced in this file. The only statement is the
    ingest_directed description text, which agrees with the node. — "the server forces `confidence = 1.0`
    on every dispatched item."

    src/modules/ingestion/service/directed-ingestion.service.ts: held at the fragment input (line 475),
    the attribute input (line 632) and the link input (line 712) — confidence: 1.0,'
  encoded_at:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/service/directed-ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result. Submit a directed ingestion whose fragment, attribute
    and link items each carry a confidence other than 1.0 (for example 0.5), with at least two attributes
    and two links. Expect one of two results: the request is refused, or every dispatched propose_fragment,
    propose_attribute and propose_link argument carries confidence 1.0, never the value the caller supplied.'
- node: rules/knowledge-base/directed-item-status
  conforms: true
  how: 'src/modules/ingestion/service/directed-ingestion.service.ts: held at the fragment report (line
    492), the node report (lines 577-579), the attribute and link outcome mapping (lines 654 and 737,
    and 951-958), and classifyEnvelopeFailureStatus (lines 971-975) — return envelope.error.code.startsWith("SYSTEM_")
    ? "error" : "rejected";'
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Each open part is one input against one expected result, and all of them run through
    directedIngestionService''s report: (1) a node proposal whose resolution sends it to review, expecting
    the node''s report status needs-review; (2) an attribute and a link whose handler returns an outcome
    other than accepted, expecting each report status to equal that outcome; (3) a fragment, node, attribute
    or link handler refusing with a SYSTEM_* code, expecting that item''s report status error, while a
    VALIDATION_* refusal of the same item kind expects rejected.'
- node: rules/knowledge-base/directed-pinned-node
  conforms: true
  how: 'src/modules/ingestion/dto/index.ts: held at Not enforced in this file. The only statement is the
    ingest_directed description text, which agrees with the node. — "Supply `node_id` on a node to PIN
    against a known existing node (skips entity resolution)."

    src/modules/ingestion/service/directed-ingestion.service.ts: held at the pin branch (lines 514-555)
    and verifyNodePin (lines 859-896), with no call to proposeNode on the pin path — const pinResult =
    await verifyPin(deps.pool, item.node_id); ... if (row.status !== "active") {'
  encoded_at:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/service/directed-ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Run the real pin verifier against stored knowledge-node rows and check three cases. First,
    pin an active node while stating a node type, name and aliases that differ from the node's own. It
    should resolve to exactly the pinned id, as matched_existing, without creating or matching any other
    node. Second, pin a node whose status is not active (merged or deleted). It should be refused. Third,
    pin an id that has no knowledge_node row. It should be refused.
- node: rules/knowledge-base/directed-source-content
  conforms: true
  how: "src/modules/ingestion/service/directed-ingestion.service.ts: held at synthesiseContent (lines\
    \ 839-852) and the `source_type: \"chat\"` passed at line 357 — lines.push(`-- source_label=${payload.source_label}`);\n\
    \  }\n  lines.push(`-- directed_at=${at.toISOString()} nonce=${nonce}`);"
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Call directedIngestionService with two fragments, one with a label and one without, and
    a fixed moment of ingestion. Capture the body passed to ingestRaw. Assert that its source type is
    chat. Assert that its content is exactly each fragment's reference and text in caller order, then
    the label line only for the labelled fragment, then the moment of ingestion, then a nonce. Compare
    the whole content for equality, not by containment.
- node: rules/knowledge-base/directed-turn-is-original-input
  conforms: true
  how: "src/modules/ingestion/mcp/directed-ingest.handler.ts: held at this file forwards the turn's excerpt\
    \ to the service in the options object built at lines 177-179. The service records it as the raw information's\
    \ original input (directed-ingestion.service.ts, line 366). — ...(invocationContext?.source_excerpt\
    \ !== undefined\n  ? { sourceExcerpt: invocationContext.source_excerpt }\n  : {}),\nsrc/modules/ingestion/service/directed-ingestion.service.ts:\
    \ held at the ingestRaw call, line 366 — original_input: deps.sourceExcerpt ?? null,\nsrc/modules/ingestion/service/ingestion.service.ts:\
    \ held at the argument object of insertRawInformation in ingestRawInformation, line 125. This file\
    \ stores the turn's excerpt as given. Choosing the excerpt belongs to the directed path in another\
    \ file. — original_input: input.original_input ?? null,"
  encoded_at:
  - src/modules/ingestion/mcp/directed-ingest.handler.ts
  - src/modules/ingestion/service/directed-ingestion.service.ts
  - src/modules/ingestion/service/ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: One input against one expected result. The input is a chat turn whose text is X, which
    leads to a directed ingestion. The expected result is that the raw information this ingestion created,
    read back, has original input equal to the turn's excerpt X. The test must use no stub between the
    turn and the persisted raw information.
- node: rules/knowledge-base/document-ingestion-extracts-new-content
  conforms: true
  how: 'src/modules/ingestion/dto/index.ts: held at Not enforced in this file. The only statement is the
    ingest_document description text, which agrees with the node. — "the server stores the raw text, splits
    it into chunks, and runs structured extraction ... Re-sending the same content is a no-op (returns
    the existing run)."

    src/modules/ingestion/mcp/ingest-document.handler.ts: held at lines 129-131 and 158-190, with the
    extraction call at lines 201-208. A new run is created by ingestRaw, extraction is driven against
    it, and the noop_existing branch returns before any extraction. — ingest = await withTransaction(deps.pool,
    (client) => ingestRaw(client, body)); ... if (outcome === "noop_existing") { ... outcome: "already_ingested"
    ... } ... const run = await runExtraction(deps.pool, llm_run_id, deps.logger, deps.catalog, extractionDeps);'
  encoded_at:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/mcp/ingest-document.handler.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Two ingests of the same document through ingest_document, against a real store. Input
    one is a document whose content is not held yet. Expected: a RawInformation row is recorded, a new
    LLMRun is created for it, and extraction runs under that run''s id (its extraction records carry that
    llm_run_id). Input two is the same content again. Expected: already_ingested, no new LLMRun, and no
    extraction activity recorded under any run.'
- node: rules/knowledge-base/email-header-block
  conforms: true
  how: "src/modules/ingestion/chunker/v1.ts: held at the header branch of splitEmail, lines 233-242 —\
    \ if (!headersClosed && isBlank) {\n      if (line.start > blockStart) {\n        ranges.push({ start:\
    \ blockStart, endExclusive: line.start });\n      }\n      headersClosed = true;\n      seenBlank\
    \ = true;\n      blockStart = nextLineStart(lines, i);"
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: Use one email input with a header block, a first blank line and a body that itself contains
    a later blank line. Expect the first chunk's text to equal the header lines exactly, with no trailing
    break, and its offset_end to stop before the blank line's line break. Expect the next chunk's offset_start
    to come after that line break, so the code point of the break is in neither chunk's [offset_start,
    offset_end). Expect the body's own blank line not to end the header block.
- node: rules/knowledge-base/exact-alias-resolves
  conforms: true
  how: "src/modules/ingestion/service/entity-resolution.service.ts: held at Step 1 of resolveOrCreateNode,\
    \ the exact alias_norm query and the early return, lines 130-151. — WHERE na.alias_norm = norm($1::text)\n\
    \        AND kn.node_type_id = $2\n        AND kn.status = 'active'\n      LIMIT 1\n... return { node_id:\
    \ nodeId, resolution: \"matched_existing\" };"
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Each part is one input against one expected result, run against a real node_alias and
    knowledge_node store rather than a stub that matches on the SQL's text. First, a proposal whose name
    equals an alias of an active node of the same type resolves to that node as matched_existing. Second,
    the same proposal against an equal alias held only by a node that is not active does not resolve to
    it as matched_existing. Third, the same proposal against an equal alias held only by an active node
    of a different node type does not resolve to it as matched_existing.
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at user(), lines 240-273. It builds the metadata\
    \ block (source type, document date, title, reception time) and the previous-chunk-tail block for\
    \ one chunk. The chunk loop, the index order and the 200-character slice are in src/modules/ingestion/service/extraction.service.ts,\
    \ not here. — `- source_type: ${meta.source_type}`, `- received_at: ${meta.received_at}`, meta.document_date\
    \ !== null\n  ? `- document_date: ${meta.document_date}`\n  : \"- document_date: (unknown)\",\nmeta.title\
    \ !== null ? `- title: ${meta.title}` : \"- title: (unknown)\", ... \"## Previous-chunk tail (context,\
    \ do not re-extract)\", args.prevTail,"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: a raw information with a known source type, document date, title and reception
    time. It holds at least three chunks stored out of index order, and the chunk before at least one
    of them is longer than 200 characters. Run an extraction over it. Expected result: one model call
    per chunk, in ascending index order. Each call shows that chunk''s text with the source''s type, document
    date, title and reception time. Each call after the first also shows exactly the last 200 characters
    of the previous chunk by index, and nothing earlier than those 200 characters.'
- node: rules/knowledge-base/health-probe-never-fails
  conforms: true
  how: "src/shared/health.ts: held at the try/catch in collectHealth(), lines 26-41. The catch branch\
    \ returns the unreachable report instead of rethrowing. — } catch {\n    return {\n      ok: false,\n\
    \      service: \"remember-bff\",\n      database: \"unreachable\",\n      checked_at: checkedAt,\n\
    \    };\n  }"
  encoded_at:
  - src/shared/health.ts
  decided_by: reading
  remainder: testable
  remainder_why: Use a pool whose connect() succeeds and whose client query rejects on the health ping.
    Call health. The expected result is a call that does not fail (env.ok true), with result.ok false
    and database "unreachable". If "does not answer" also covers a store that never replies, the same
    assertion applies to a ping that never settles, driven past the probe's bound with fake timers.
- node: rules/knowledge-base/held-content-records-nothing
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/dto/index.ts, src/modules/ingestion/service/ingestion.service.ts,
    and src/modules/ingestion/mcp/ingest-document.handler.ts read `nowhere` — This file records nothing
    itself. It forwards to `ingestRaw(client, body)` and only reads `outcome` from the result. The no-new-record
    rule for held content is carried by the ingestRawInformation service, which is outside this file set.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/mcp/ingest-document.handler.ts
  - src/modules/ingestion/service/ingestion.service.ts
- node: rules/knowledge-base/idempotency-key
  conforms: true
  how: "src/modules/ingestion/hash.ts: held at composeIdempotencyKey, lines 34-39 — const h = createHash(\"\
    sha256\"); h.update(args.content_hash, \"utf8\"); h.update(args.prompt_version, \"utf8\"); h.update(args.model,\
    \ \"utf8\"); h.update(args.chunking_version, \"utf8\"); return h.digest(\"hex\");\nsrc/modules/ingestion/service/ingestion.service.ts:\
    \ held at ingestRawInformation, the composeIdempotencyKey call at lines 104-109; the digest and the\
    \ join order are implemented in ../hash.js — const idempotencyKey = composeIdempotencyKey({\n    content_hash:\
    \ contentHash,\n    prompt_version: input.prompt_version,\n    model: input.model,\n    chunking_version:\
    \ CHUNKING_VERSION,\n  });"
  encoded_at:
  - src/modules/ingestion/hash.ts
  - src/modules/ingestion/service/ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Two assertions would close it. The first gives a content hash, a prompt version, a model
    and a chunking version that are all different from one another, and expects sha256(content_hash +
    prompt_version + model + chunking_version) as lowercase hex. The second creates an LLM run over a
    raw information with a known content hash, prompt version, model and chunking version, and expects
    the run's idempotency key to equal that same digest.
- node: rules/knowledge-base/ingestion-records-chunks-and-run
  conforms: true
  how: "src/modules/ingestion/service/ingestion.service.ts: held at ingestRawInformation, lines 117-175:\
    \ the raw information insert, then the chunks, then one run. The run's initial status `running` is\
    \ not set here; it is left to the insert's database DEFAULT in the repository. — const chunkRows =\
    \ await insertRawChunks(\n    client,\n    rawInformationRow.id,\n    chunkInputs\n  );\n... llmRunRow\
    \ = await insertLlmRun(client, {\n      model: input.model,\n      prompt_version: input.prompt_version,\n\
    \      input_raw_information_id: rawInformationRow.id,\n      idempotency_key: idempotencyKey,\n \
    \   });"
  encoded_at:
  - src/modules/ingestion/service/ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input closes it: new content given to ingestRawInformation. The expected result
    is that the one opened LLM run has status running and an input_raw_information_id equal to the returned
    raw_information_id. Both values must be read from what the service writes, not made up by the fake
    client, so the fake must keep the status it receives or the test must run against a real database.'
- node: rules/knowledge-base/link-permitted-by-type-rule
  conforms: true
  how: "src/modules/ingestion/catalog/catalog.ts: held at isLinkRuleActive, lines 271-296, the permission\
    \ predicate over (source node type, link type, target node type). This file computes whether a rule\
    \ permits the link and does not refuse the proposal itself. — if (\n  r.link_type_id !== args.link_type_id\
    \ ||\n  r.source_node_type_id !== args.source_node_type_id ||\n  r.target_node_type_id !== args.target_node_type_id\n\
    ) {\n  continue;\n} ... return true;\nsrc/modules/ingestion/dto/index.ts: held at Not enforced in\
    \ this file. The only statement is the propose_link description text, which agrees with the node.\
    \ — \"link_type must be a catalog LinkType allowed for the two node types.\"\nsrc/modules/ingestion/validation/graph-rules.ts:\
    \ held at validateGraphRule(), lines 23-46: the `isLinkRuleActive(...)` guard and the `ValidationFailure`\
    \ thrown when it is false — if (!isLinkRuleActive(snapshot, { source_node_type_id: input.source_node_type_id,\
    \ link_type_id: input.link_type_id, target_node_type_id: input.target_node_type_id, today })) { throw\
    \ new ValidationFailure(\"BUSINESS_LINK_RULE_VIOLATION\", \"No active link_type_rule authorises this\
    \ (source_node_type, link_type, target_node_type) triple.\", {...}) }"
  encoded_at:
  - src/modules/ingestion/catalog/catalog.ts
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/validation/graph-rules.ts
  decided_by: reading
  remainder: testable
  remainder_why: Give validateGraphRule (or proposeLinkHandler) a triple whose only matching rule has
    valid_to at or before today, and expect BUSINESS_LINK_RULE_VIOLATION. Do the same for a rule whose
    valid_from is after today, with the same expected result. Then give it a rule whose interval [valid_from,
    valid_to) contains today, and expect the link to be permitted.
- node: rules/knowledge-base/link-proposal-check-order
  conforms: true
  how: 'src/modules/ingestion/service/propose-link.service.ts: held at the sequence of awaited steps in
    proposeLinkService (lines 66-194). Each step either throws a ValidationFailure or returns, so the
    first failing check stops the proposal. — deps.catalog.linkTypeByName.get(args.link_type) + assertKnownType;
    then findNodeTypeIdByNodeId(source) + assertFound, findNodeTypeIdByNodeId(target) + assertFound; then
    fragRes.rows.length !== args.fragment_ids.length and f.llm_run_id !== runCtx.llmRunId; then validateGraphRule(...);
    then validateTemporal({...}); then routeConfidence(args.confidence) with the below_floor return; then
    countFragmentsAnchoredToSource(...) and anchored !== args.fragment_ids.length. This is the order the
    node states.'
  encoded_at:
  - src/modules/ingestion/service/propose-link.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'The order is a finite sequence of seven checks. For each adjacent pair, one proposal
    that fails both checks should get the earlier check''s refusal. The pairs are: unknown link type with
    a missing source node; missing target node with a fragment from another LLM run; a nonexistent fragment
    with no permitting link type rule; incoherent dates with confidence below threshold; confidence below
    threshold with fragments not anchored in the run''s source chunks. The stopping half needs one more
    assertion: after the first failure, the queries recorded for that proposal include none that a later
    check issues.'
- node: rules/knowledge-base/link-type-rule-in-effect
  conforms: true
  how: 'src/modules/ingestion/catalog/catalog.ts: held at isLinkRuleActive, lines 280 and 289-292, with
    stripTime at lines 298-300 truncating to the UTC calendar date. — if (from !== null && today.getTime()
    < from.getTime()) continue; if (to !== null && today.getTime() >= to.getTime()) continue; ... new
    Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))'
  encoded_at:
  - src/modules/ingestion/catalog/catalog.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Each gap is one input against one expected result, using isLinkRuleActive on a snapshot
    with a single rule. A rule whose validity start equals the day should be in effect. A rule whose validity
    start is before the day should be in effect. A rule whose validity end is after the day should be
    in effect. A rule with both bounds around the day should be in effect. One more input catches timestamp
    comparison: a moment whose clock time is earlier than a validity start set later on the same UTC date
    should still count as in effect.'
- node: rules/knowledge-base/long-block-sentence-chunks
  conforms: true
  how: "src/modules/ingestion/chunker/config.ts: held at the values this file declares for the rule, CHUNK_HARD_MAX\
    \ (4000) on line 22 and the upper bound of CHUNK_TARGET (2000) on line 19. The cutting behavior itself\
    \ sits in v1.ts, outside this file. — export const CHUNK_HARD_MAX = 4000 as const; export const CHUNK_TARGET:\
    \ readonly [number, number] = [1500, 2000] as const;\nsrc/modules/ingestion/chunker/v1.ts: held at\
    \ the oversize branch of chunkV1, lines 87-118, and splitBySentences, lines 368-394. The 4000 and\
    \ 2000 values come from the imported CHUNK_HARD_MAX and CHUNK_TARGET in ./config.js, outside this\
    \ file set and not read. — const segmenter = new Intl.Segmenter(\"pt\", { granularity: \"sentence\"\
    \ }); ...\n      if (tentativeSize > CHUNK_TARGET[1]) {\n        chunks.push(\n          buildChunk(codePoints,\
    \ bufferStart, bufferEnd, chunks.length)\n        );"
  encoded_at:
  - src/modules/ingestion/chunker/config.ts
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: a block of more than 4000 code points made of Portuguese sentences of known lengths.
    Expected result: every chunk''s offset_end falls at a sentence end, every chunk is at most 2000 code
    points long, and adding the next sentence to any chunk except the last would take it past 2000. A
    second assertion closes the condition: a block of between 2000 and 4000 code points comes back as
    a single chunk.'
- node: rules/knowledge-base/matched-node-gains-only-aliases
  conforms: true
  how: "src/modules/ingestion/service/entity-resolution.service.ts: held at The matched_existing branches\
    \ (lines 141-151 and 176-184) call attachAliases, which inserts only the proposed aliases. The canonical-name\
    \ insert lives only in attachCanonicalAndAliases (lines 289-309), used by the new-node branches. —\
    \ await attachAliases(client, {\n      nodeId,\n      aliases: args.aliases,\n      runId: args.llmRunId,\n\
    \    });\n    return { node_id: nodeId, resolution: \"matched_existing\" };"
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Two inputs, each against one expected result. First, a proposal with two or more aliases
    and a name that differs from every alias, resolved by exact alias match to an existing node. Expected:
    node_alias rows for that node equal exactly the proposed aliases, one row each, with no row for the
    proposed name. Second, the same proposal resolved by trigram strong-unique match (one candidate at
    or above MATCH_STRONG, none other at or above MATCH_FLOOR). Expected: the same set of rows on the
    matched node, and no row for the proposed name.'
- node: rules/knowledge-base/new-assertion
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at branch (e) of consolidateLinkOnce\
    \ (lines 654-659) and of consolidateAttributeOnce (lines 858-863) — const newRow = await insertLinkRow(client,\
    \ args, runCtx, {\n  status: args.status_for_new_row,\n  supersedes_link_id: null,\n});"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: One input against one result. Propose an attribute (for example key deadline on a Project
    node) while no current node_attribute exists for that node and key. The test should assert that exactly
    one node_attribute row is recorded, that its supersedes_attribute_id is null, and that no node_attribute
    row is updated.
- node: rules/knowledge-base/new-assertion-status-from-confidence
  conforms: true
  how: "src/modules/ingestion/prompts/extraction.v1.ts: held at system(), rule 7, line 153. The prompt\
    \ tells the model the two bands truthfully. The code that assigns the status is not in this file.\
    \ — \"7. CONFIDENCE ∈ [0,1], be honest: ≥ 0.75 → stored active; 0.40–0.74 →\", \"   `uncertain` (kept,\
    \ flagged); < 0.40 → dropped. Lower it for hedged\",\nsrc/modules/ingestion/service/propose-attribute.service.ts:\
    \ held at the mapping at lines 186-187. The 0.75 and 0.40 thresholds are not in this file; they come\
    \ from `routeConfidence`. — const statusForNewRow: \"active\" | \"uncertain\" =\n    route.kind ===\
    \ \"active\" ? \"active\" : \"uncertain\";\nsrc/modules/ingestion/service/propose-link.service.ts:\
    \ held at the statusForNewRow mapping (lines 197-198), passed to consolidateLink as status_for_new_row.\
    \ The 0.75 and 0.40 boundaries are not stated in this file. They sit in `routeConfidence`, which produces\
    \ route.kind. — const statusForNewRow: \"active\" | \"uncertain\" =\n  route.kind === \"active\" ?\
    \ \"active\" : \"uncertain\";\nsrc/modules/ingestion/validation/confidence.ts: held at CONFIDENCE_UNCERTAIN_UPPER\
    \ and CONFIDENCE_FLOOR (lines 14-15), and the first two branches of routeConfidence (lines 25-26),\
    \ which map confidence to active or uncertain. The exclusion of disputes is not in this file. — export\
    \ const CONFIDENCE_UNCERTAIN_UPPER = 0.75 as const; ... if (confidence >= CONFIDENCE_UNCERTAIN_UPPER)\
    \ return { kind: \"active\" }; if (confidence >= CONFIDENCE_FLOOR) return { kind: \"uncertain\" };"
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/service/propose-link.service.ts
  - src/modules/ingestion/validation/confidence.ts
  decided_by: reading
  remainder: testable
  remainder_why: For node attributes, propose a new attribute at confidence 0.75 and expect the recorded
    node_attribute to be active, then at 0.40 and 0.749999 and expect it to be uncertain. For knowledge
    links, make the same boundary proposals at 0.75 and 0.40 and check the recorded status. For a succession
    or correction proposal at a confidence between 0.40 and 0.75, expect the newly recorded row to be
    uncertain, for links and for attributes.
- node: rules/knowledge-base/new-node-aliases
  conforms: true
  how: "src/modules/ingestion/service/entity-resolution.service.ts: held at attachCanonicalAndAliases\
    \ (lines 289-309), called from the needs_review and created_new branches, with attachAliases (lines\
    \ 315-332). — VALUES ($1, $2, 'canonical', $3)\n     ON CONFLICT DO NOTHING\n... VALUES ($1, $2, 'alias',\
    \ $3)"
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: propose a name with no matching candidate, plus two or more distinct aliases.
    Expected result: the newly created node holds exactly the proposed name with kind canonical, and holds
    every proposed alias with kind alias. Read this back from what the node holds, not from the shape
    of the emitted SQL, in a test whose own subject is this fact.'
- node: rules/knowledge-base/no-candidate-creates-active-node
  conforms: true
  how: "src/modules/ingestion/service/entity-resolution.service.ts: held at decideFromCandidates, the\
    \ `novel` return (lines 269-271), and the created_new branch that inserts the node as active (lines\
    \ 219-233). MATCH_FLOOR is 0.55 (line 41). — if (aboveFloor.length === 0) {\n    return { kind: \"\
    novel\" };\n  }\n... VALUES ($1, $2, 'active') ... return { node_id: nodeId, resolution: \"created_new\"\
    \ };"
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Each part is one input against one result, read back from a real store rather than from
    SQL text. First, one active node of the proposal's node type at 0.54 gives created_new with the new
    node stored as active. Second, the same node at exactly 0.55 does not give created_new. Third, a node
    at 0.55 or above that is either of another node type or not active gives created_new with the new
    node stored as active.
- node: rules/knowledge-base/pdf-blocks-at-form-feeds
  conforms: true
  how: "src/modules/ingestion/chunker/v1.ts: held at the pdf case of splitByHardBoundaries, lines 172-173,\
    \ and splitOnCharBoundary, lines 193-211 — case \"pdf\":\n      return splitOnCharBoundary(codePoints,\
    \ \"\\f\");\n...\n    if (codePoints[i] === delimiter) {\n      if (i > cursor) {\n        ranges.push({\
    \ start: cursor, endExclusive: i });\n      }\n      cursor = i + 1;"
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: One input against one expected result would close it. Take pdf content with two form
    feeds in a row, such as "página 1\f\fpágina 2". The expected result is exactly two blocks, with texts
    "página 1" and "página 2" and chunk_index [0, 1]. No block may have an empty text or a zero-width
    offset span.
- node: rules/knowledge-base/prompt-version-known
  conforms: true
  how: "src/modules/ingestion/prompts/index.ts: held at selectPromptModule, lines 88-94, and UnknownPromptVersionError,\
    \ lines 73-81. — const module = REGISTRY[promptVersion];\n  if (module === undefined) {\n    throw\
    \ new UnknownPromptVersionError(promptVersion);\n  }"
  encoded_at:
  - src/modules/ingestion/prompts/index.ts
  decided_by: reading
  remainder: testable
  remainder_why: One input against one expected result. Start an extraction (create the LLMRun / run ingest_document)
    with a prompt_version the system does not hold, for example "v99", and expect it to be refused, with
    no LLMRun recorded under that version and no extraction performed. Starting the same extraction with
    a held version, for example "v4", should be accepted and record that version.
- node: rules/knowledge-base/provenance-accepts-proposed-fragment
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at promoteFragmentsToAccepted\
    \ (lines 252-264) — UPDATE information_fragment\n    SET status = 'accepted'\n  WHERE id = ANY($1::uuid[])\n\
    \    AND status = 'proposed'"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Use a store that holds fragment status, a real database or a fake that applies the UPDATE.
    Case one: record a provenance citing a fragment whose status is proposed, then read the fragment back
    and expect accepted. Case two: for each other fragment status, record a provenance citing a fragment
    in that status, then read it back and expect the status it had before. Run both on every path that
    records a provenance: link and attribute, and each consolidation outcome.'
- node: rules/knowledge-base/recent-ingestions-limit-bounds
  conforms: true
  how: "src/modules/ingestion/dto/index.ts: held at Not enforced in this file. The only statement is the\
    \ list_recent_ingestions description text, which agrees with the node. — \"`limit` 1..50 (default\
    \ 10). Read-only.\"\nsrc/modules/ingestion/mcp/mcp-schemas.ts: held at `ListRecentIngestionsMcpInputSchema.limit`,\
    \ lines 252-260, the `.min(1)` and `.max(50)` bounds — limit: z\n  .number()\n  .int()\n  .min(1)\n\
    \  .max(50)"
  encoded_at:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  decided_by: reading
  remainder: testable
  remainder_why: Call list_recent_ingestions with a limit of 0 and with a limit of 51, and expect each
    to be refused with VALIDATION_INVALID_FORMAT. Call it with a limit of 1 and with a limit of 50, and
    expect each to be accepted, with that same value reaching the raw_information query as its limit parameter.
- node: rules/knowledge-base/recent-ingestions-limit-default
  conforms: true
  how: 'src/modules/ingestion/dto/index.ts: held at Not enforced in this file. The only statement is the
    list_recent_ingestions description text, which agrees with the node. — "`limit` 1..50 (default 10).
    Read-only."

    src/modules/ingestion/mcp/mcp-schemas.ts: held at `ListRecentIngestionsMcpInputSchema.limit`, line
    258, the `.default(10)` call — .default(10)'
  encoded_at:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input, one expected result: with more than ten ingestions stored (say fifteen) and
    a store that honours the query''s limit, a list_recent_ingestions call with no limit returns exactly
    ten items.'
- node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
  conforms: true
  how: "src/modules/ingestion/mcp/handler-base.ts: held at runIngestHandler: the catch branch that runs\
    \ ROLLBACK, followed by safeWriteAuditOnRollback, which writes only the tool call through insertToolCallStandalone\
    \ — await client.query(\"ROLLBACK\"); await safeWriteAuditOnRollback(args.deps, args.tool_name, args.input,\
    \ errEnv, \"rejected\"); await insertToolCallStandalone(deps.pool, {\nsrc/modules/ingestion/mcp/propose-fragment.handler.ts:\
    \ held at the Zod-failure branch (lines 36-49) and the run callback of proposeFragmentHandler (lines\
    \ 66-95), both executed through runIngestHandler — A parse failure throws inside the run callback,\
    \ so the service is never called: `run: async () => { throw new ValidationFailure(\"VALIDATION_INVALID_FORMAT\"\
    , ...` . A defensive error envelope maps to `validation_outcome: \"rejected\"` with `tool_call_result:\
    \ envelope`. This file persists nothing itself. Recording only the tool call is done by runIngestHandler\
    \ in handler-base.ts, which is outside this file set. The file relies on that delegation.\nsrc/modules/ingestion/repository/llm-run.repository.ts:\
    \ held at insertToolCallStandalone (lines 292-318), which commits the tool_call row in its own short\
    \ transaction — const client = await pool.connect();\n    try {\n      await client.query(\"BEGIN\"\
    );\n      const row = await insertToolCall(client, args);\n      await client.query(\"COMMIT\");\n\
    This write is independent of the caller's business transaction, so the tool call can be recorded alone.\
    \ The file does not decide when a proposal is refused. The caller passes in `validation_outcome`."
  encoded_at:
  - src/modules/ingestion/mcp/handler-base.ts
  - src/modules/ingestion/mcp/propose-fragment.handler.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  decided_by: reading
  remainder: testable
  remainder_why: Refuse a proposal after its business write has been issued, once for each proposal tool,
    and also make one fail with a system error. Capture every write statement across all transactions.
    The expected result is that the only committed write is the single tool_call row with the refused
    or failed outcome, and that no row other than tool_call was committed.
- node: rules/knowledge-base/required-start-available
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/validation/temporal.ts,
    and src/modules/ingestion/service/propose-attribute.service.ts read `nowhere` — The file selects `document_date`
    and `received_at` and passes `requires_valid_from: resolvedKey.requires_valid_from, document_date:
    documentDate, received_at: receivedAt` to `validateTemporal`. It does not itself refuse when no start
    is available. — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/temporal.ts
- node: rules/knowledge-base/short-block-one-chunk
  conforms: true
  how: "src/modules/ingestion/chunker/config.ts: held at the CHUNK_HARD_MAX declaration, line 22. The\
    \ one-chunk branch itself is in v1.ts. — export const CHUNK_HARD_MAX = 4000 as const;\nsrc/modules/ingestion/chunker/v1.ts:\
    \ held at the whole-block branch of chunkV1, lines 80-86. The 4000 value comes from the imported CHUNK_HARD_MAX\
    \ in ./config.js, outside this file set and not read. — if (blockSize <= CHUNK_HARD_MAX) {\n     \
    \ // Whole block fits — emit as a single chunk.\n      chunks.push(\n        buildChunk(codePoints,\
    \ block.start, block.endExclusive, chunks.length)\n      );\n      continue;"
  encoded_at:
  - src/modules/ingestion/chunker/config.ts
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: Take one block with no hard boundary (for example source type `ata`) that is exactly
    4000 code points long, made of sentence-terminated text and including characters outside the BMP so
    that code points and UTF-16 units differ. The expected result is exactly one raw chunk with offset_start
    0, offset_end 4000 and text equal to the whole input.
- node: rules/knowledge-base/stated-start-requires-basis
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/prompts/extraction.v1.ts,
    src/modules/ingestion/validation/temporal.ts, and src/modules/ingestion/service/propose-attribute.service.ts
    read `nowhere` — The file only forwards `valid_from: args.valid_from ?? null, valid_from_basis: args.valid_from_basis
    ?? null` to `validateTemporal`. It makes no basis check of its own. — a binding asserts the file answers
    for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never restamped
    here'
  observed_at:
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/temporal.ts
- node: rules/knowledge-base/strong-candidate-resolves
  conforms: true
  how: "src/modules/ingestion/service/entity-resolution.service.ts: held at decideFromCandidates, the\
    \ strong_unique condition (lines 273-276). MATCH_STRONG is 0.85 (line 32) and MATCH_FLOOR is 0.55\
    \ (line 41). The matched_existing return is in lines 176-184. — if (strong.length === 1 && aboveFloor.length\
    \ === 1) {\n    return { kind: \"strong_unique\", nodeId: strong[0]!.node_id };\n  }"
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Four input-against-result assertions close it, each with no exact alias. (1) A single
    candidate at exactly 0.85 resolves as matched-existing to that node. (2) A strong candidate plus a
    second active node of the same type at exactly 0.55 does not resolve as matched-existing. (3) Against
    a database: a strong active node of the proposal''s type plus an inactive (merged or deleted) node
    of that type at 0.55 or above still resolves as matched-existing to the active node. (4) Against a
    database: a node of a different type at 0.85 or above is not matched, and a same-type node is not
    blocked by a different-type node at 0.55 or above.'
- node: rules/knowledge-base/succession-before-previous-start
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at the CASE expressions of\
    \ closeVigentForSuccession (lines 302-312) — WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}\n\
    \  THEN valid_to\nELSE ${closeExpr}"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Run each case against a store that actually applies the close: a vigent functional link
    and a vigent functional attribute, each succeeded once with a closing date equal to its validity start
    and once with a closing date before it. In every case the expected result has three parts. The closed
    row is superseded. Its valid_to is still null. The new row''s supersedes_link_id or supersedes_attribute_id
    names the closed row.'
- node: rules/knowledge-base/succession-closes-previous
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at branch (c) of consolidateLinkOnce\
    \ (lines 588-614) and of consolidateAttributeOnce (lines 808-831) — functional &&\n!sameTarget &&\n\
    (args.change_hint === \"succession\" ||\n  hasSuccessionSignal(fragmentTexts))"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Three single-input assertions would close it.

    First, a node_attribute proposal on a key that allows a single current assertion, with a different
    value, change_hint ''succession'' and a neutral fragment. Expected: outcome superseded_previous, the
    current attribute closed with status ''superseded'', and the inserted attribute''s supersedes_attribute_id
    equal to the closed one''s id.

    Second, the existing fragment-signal attribute case, also asserting that the close sets status ''superseded''.

    Third, the existing change_hint ''succession'' link case, also asserting that the close sets status
    ''superseded'' and that the inserted link''s supersedes_link_id equals the previous assertion''s id.'
- node: rules/knowledge-base/succession-closing-date
  conforms: true
  how: 'src/modules/ingestion/service/graph-consolidation.service.ts: held at closeVigentForSuccession
    (lines 292-316) — const closeExpr = closeDate !== null ? "$2::date" : "now()::date";'
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: Two tests would close it, each run once for a link and once for an attribute. First,
    a succession whose new assertion starts on a date after the closed assertion's start, for example
    closed starting 2026-01-01 and new starting 2026-06-01, against the closed assertion getting exactly
    2026-06-01 as its validity end. Second, a succession whose new assertion has no validity start, with
    now() fixed at 2026-06-12, against the closed assertion getting 2026-06-12 as its validity end.
- node: rules/knowledge-base/succession-signal
  conforms: true
  how: "src/modules/ingestion/service/graph-consolidation.service.ts: held at SUCCESSION_MARKERS and hasSuccessionSignal\
    \ (lines 83-106) — const lower = f.toLowerCase();\nfor (const m of SUCCESSION_MARKERS) {\n  if (lower.includes(m))\
    \ return true;"
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Each marker the node lists becomes one input: a fragment whose text contains only "nova",
    only "substituido", only "substituido por", only "succeeded", only "passou a", or only "novo". Each
    must signal succession, and must still signal when written in a different letter case such as upper
    case or mixed case. One fragment with none of the markers must not signal. That table, over the nine
    markers the node lists, decides the node completely.'
- node: rules/knowledge-base/summary-counts-tool-calls
  conforms: true
  how: 'src/modules/ingestion/repository/llm-run.repository.ts: held at aggregateToolCallOutcomes (lines
    119-163), the grouped count and the zero-initialised summary — `SELECT validation_outcome, count(*)::text
    AS n FROM tool_call WHERE llm_run_id = $1 GROUP BY validation_outcome` followed by `const summary:
    LlmRunSummary = { accepted: 0, consolidated: 0, superseded_previous: 0, needs_review: 0, uncertain:
    0, disputed: 0, rejected: 0, error: 0, orphaned_fragments: 0, };` and `summary[row.validation_outcome]
    = Number.parseInt(row.n, 10);`'
  encoded_at:
  - src/modules/ingestion/repository/llm-run.repository.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input against one expected result: an LLM run whose tool calls have known validation
    outcomes, next to a second run whose tool calls must not be counted, read through get_ingestion_status
    against a real query path. The expected result is a summary with the exact count of the first run''s
    tool calls for each outcome, and an explicit zero for every other outcome in the validation-outcome
    vocabulary.'
- node: rules/knowledge-base/turn-blocks
  conforms: true
  how: "src/modules/ingestion/chunker/v1.ts: held at splitTurns, lines 267-287; the loop starts at line\
    \ index 1, so the first line opens no new block — for (let i = 1; i < lines.length; i++) {\n    const\
    \ line = lines[i]!;\n    if (isSpeakerLine(codePoints, line)) {\n      if (line.start > blockStart)\
    \ {\n        ranges.push({ start: blockStart, endExclusive: line.start });\n      }\n      blockStart\
    \ = line.start;"
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: Use chat content and transcript content where an opening line with no speaker is followed
    by a multi-line turn and then another speaker line. The expected result is a new block starting exactly
    at each speaker line after the first line, with each block's text beginning with that speaker line
    and the continuation lines staying in the block of the turn before them.
- node: rules/knowledge-base/undivided-sources
  conforms: true
  how: "src/modules/ingestion/chunker/v1.ts: held at the ata, artigo and outro case of splitByHardBoundaries,\
    \ lines 167-170 — case \"ata\":\n    case \"artigo\":\n    case \"outro\":\n      return [{ start:\
    \ 0, endExclusive: total }];"
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'For each of `ata`, `artigo` and `outro`, take content under CHUNK_HARD_MAX that holds
    a form-feed, a blank line, a "João: ..." speaker line and a "[00:01] Maria: ..." timestamped line.
    The expected result is exactly one chunk whose text is the whole content, verbatim.'
- node: rules/knowledge-base/validity-start-before-end
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/validation/temporal.ts,
    and src/modules/ingestion/service/propose-attribute.service.ts read `nowhere` — The file only forwards
    `valid_from: args.valid_from ?? null, valid_to: args.valid_to ?? null` to `validateTemporal`. It makes
    no start-before-end comparison of its own. — a binding asserts the file answers for the node, so the
    pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/service/propose-attribute.service.ts
  - src/modules/ingestion/validation/temporal.ts
unstated:
- file: src/modules/ingestion/chunker/config.ts
  where: line 19, the CHUNK_TARGET declaration (lower bound, index 0)
  evidence: 'export const CHUNK_TARGET: readonly [number, number] = [1500, 2000] as const;'
  cost: The 1500 lower bound of the chunk size window is declared here and no node holds it. The long-block-sentence-chunks
    node holds only the 2000 ceiling and the 4000 threshold. The next reader looking for the minimum chunk
    size in the specification will not find it, and this constant becomes the only place that value is
    decided. The only consumer found, v1.ts, reads only CHUNK_TARGET[1], so nothing in the tree runs on
    the 1500 either.
- file: src/modules/ingestion/chunker/config.ts
  where: lines 24-30, the READING_TAIL declaration
  evidence: export const READING_TAIL = 200 as const;
  cost: A 200 code point "reading tail" overlap for a future retrieval layer is declared here as a domain
    value, and no node holds it for that purpose. The only 200 the specification holds is the last 200
    characters of the previous chunk shown to the model during extraction (the node rules/knowledge-base/extraction-reads-chunks-in-order).
    That is a different use, and its home is prompts/extraction.v1.ts, which carries its own PREV_TAIL_CHARS.
    A reader could take this constant for that rule, or for a retrieval rule that the specification never
    stated. If the two ever disagree, nobody can tell which was decided.
- file: src/modules/ingestion/dto/index.ts
  where: IngestToolDescriptions.propose_link and IngestToolDescriptions.propose_attribute, lines 129-140
  evidence: '"Both nodes must exist first, and you must cite at least one fragment_id as evidence." and
    "The node must exist; cite at least one fragment_id."'
  cost: The tool descriptions tell the model that a link or attribute proposal which cites no fragment
    is not acceptable. No node holds a minimum of one cited fragment for a link or attribute proposal.
    The nodes I found cover only the citation checks (the cited fragments must exist, belong to the run
    and be anchored) and the at-least-one rule for correction evidence. A reader looking in the specification
    for this refusal will not find it, and the model is being taught a rule that only the code and this
    text hold.
- file: src/modules/ingestion/mcp/directed-ingest.handler.ts
  where: the VALIDATION_INVALID_FORMAT envelope returned on a failed parse, lines 131-143
  evidence: "message: \"ingest_directed arguments failed validation.\", details: {\n  issues: parsed.error.issues.map((i)\
    \ => ({"
  cost: The text a caller is told when ingest_directed arguments are refused lives only in this handler.
    The ingest-directed operation in the contract states only "error code VALIDATION_INVALID_FORMAT listing
    each failing field with its path and message" and no message. Other operations state "Request payload
    failed validation." as their message. A reader looking in the specification cannot tell which wording
    is decided, and cannot tell that this operation's wording differs from the other validation refusals.
- file: src/modules/ingestion/mcp/directed-ingest.handler.ts
  where: the catch branch of the delegation, lines 211-227
  evidence: 'code: "SYSTEM_INTERNAL_ERROR", message: "Unexpected error during directed ingestion.",'
  cost: The ingest-directed operation lists no refusal for an unexpected failure. The document ingestion
    operation states SYSTEM_INTERNAL_ERROR with "Unexpected error during document ingestion." and ingest-directed
    has no counterpart. Both the code and the message text that callers receive are decided only here,
    so the specification gives no answer to what a directed ingestion tells someone when it fails unexpectedly.
- file: src/modules/ingestion/mcp/directed-ingest.handler.ts
  where: the metadataPointer forwarding, lines 184-193
  evidence: "...(invocationContext?.pointer !== undefined && typeof invocationContext.pointer.conversation_id\
    \ === \"string\" && typeof invocationContext.pointer.message_id === \"string\"\n  ? {\n      metadataPointer:\
    \ {\n        conversation_id: invocationContext.pointer.conversation_id,\n        message_id: invocationContext.pointer.message_id,\n\
    \      },\n    }\n  : {}),"
  cost: The handler holds a rule that a chat-originated directed ingestion records the conversation and
    message identities in the raw information's metadata. It also holds a rule that a pointer missing
    either identity is dropped silently. The service merges these into the metadata as `intakeMetadata.conversation_id`
    and `intakeMetadata.message_id`. No node states either rule. The raw-information node says only that
    metadata is "a free-form set of named values". The next reader looking in the specification would
    not learn that chat provenance keys are written there, or that a partial pointer vanishes without
    a trace.
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the SYSTEM_INTERNAL_ERROR envelope built for an uncaught error in runIngestHandler, line 197
  evidence: 'error: { code: "SYSTEM_INTERNAL_ERROR", message: "Internal error in MCP handler." },'
  cost: 'What a proposal answers when it fails is wording the owner or the model receives, and it lives
    only here. No node holds this message or that the answer withholds the cause and carries no details.
    The specification fixes the analogous answers for other operations (compliance-audit: "Unexpected
    internal error.", withholding the cause). The next reader looks in the propose-* operations of the
    specification and finds no failure answer there.'
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the catch block of safeWriteAuditOnRollback, lines 227-238
  evidence: "deps.logger.error( {\n  tool_name,\n  llm_run_id: deps.llm_run_id,\n  cause_message: err\
    \ instanceof Error ? err.message : \"unknown\",\n}, \"tool_call_audit_write_failed\" );"
  cost: When recording the tool call of a refused or failed proposal itself fails, the code returns the
    original envelope and keeps no tool call. The proposal then vanishes from its run's account, which
    is counted from its tool calls. No node says that this outcome is acceptable. The audit rule says
    every proposal is recorded, so the exception lives only in this catch.
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: lines 81-123, `StartAsyncIngestionMcpInputSchema` and its docstring and `content` description
  evidence: '"`start_async_ingestion` (BR-32) — shape-identical to `ingest_document` for caller symmetry.
    The only difference is the new-run return semantics (immediate vs. awaited)" and, in the schema, "the
    server chunks it, runs structured extraction in the BACKGROUND, and persists the knowledge graph with
    provenance."'
  cost: A tool that ingests a document and starts extraction in the background, returning before the extraction
    finishes, exists only in this file. The `ingest-document` operation in contracts/knowledge-base/ingestion
    is described as completing the extraction and returning its run summary, and the contract's description
    names no background or asynchronous ingestion. The next reader looks for this tool's existence, its
    immediate-return outcome and its refusals in the specification and finds none.
- file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  where: line 42-46, the ValidationFailure thrown inside the run callback of the Zod-failure branch of
    buildProposeFragmentHandler
  evidence: 'throw new ValidationFailure( "VALIDATION_INVALID_FORMAT", "Input failed Zod parse.", { issues:
    parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } );'
  cost: The refusal's message wording, "Input failed Zod parse.", is text the system tells the calling
    LLM, and no node holds it. The propose-fragment refusal in contracts/knowledge-base/ingestion.md fixes
    only the error code and the listing of each failing field with its path and message. Other contracts
    (curation, retrieval, compliance-audit) fix the message "Request payload failed validation." for the
    same code. The wording therefore lives only in this file, and the next reader looks for it in the
    specification and does not find it. It also differs from the wording other contracts give for the
    same code.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: MAX_TOKENS constant, line 42
  evidence: /** Per-turn Anthropic `max_tokens` (TC-12 known_context — 8000). */ export const MAX_TOKENS
    = 8000 as const;
  cost: The ceiling on one extraction call's output is a value the code applies. No node in the specification
    states it, and a grep of the specification root for max tokens, token ceiling and 8000 found no extraction
    node holding it. The only source cited is a task's "known_context", not a node. The next reader will
    not find it in the specification.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), "Dates" section, lines 164-165
  evidence: '"- Justify it with `valid_from_basis`: `stated` only when the start date is", "  written
    in the chunk (and supported by a cited fragment); `document` uses",'
  cost: The prompt tells the model that a proposal whose start has basis `stated` rests on a cited fragment.
    The specification holds that only for a correction ("A correction whose validity start has the basis
    stated MUST cite an information fragment"). It holds nothing like it for a proposal. The rule reaches
    the model's behavior and so the knowledge recorded, and a reader of the specification cannot find
    it.
- file: src/modules/ingestion/prompts/extraction.v2.ts
  where: EVENT_DATING_DIRECTIVE, lines 40-44 (the first bullet of the "Events — always date the occurrence"
    section), sent to the model through system()
  evidence: '"- When you create an `Event` (meeting, go-live, workshop…), ALWAYS propose its", "  `event_date`
    when the document states the date of the occurrence (and", "  `end_date` when there is a distinct
    end). Justify it with `valid_from_basis`;", "  NEVER invent a date.",'
  cost: The prompt makes it an obligation that extraction proposes event_date, and end_date when the end
    is distinct, for every Event it creates. It also forbids inventing a date. This is what extraction
    does and what the model is told, and it lives only in this string. The catalog nodes hold the keys
    event_date and end_date as attribute keys of Event. The proposal and validity-start nodes hold what
    a proposal must state. No node says extraction must always date an Event. A reader who looks in the
    specification for how Events get their dates finds nothing, and changing the obligation means editing
    this file, which no node reaches.
- file: src/modules/ingestion/prompts/extraction.v2.ts
  where: EVENT_DATING_DIRECTIVE, lines 45-49 (the "CRUCIAL distinction" bullet), sent to the model through
    system()
  evidence: '"- CRUCIAL distinction: `event_date` is the VALUE — the date the event happens.", "  `valid_from`
    is when that date started to hold / became known (typically the", "  document date). E.g. a go-live
    on 2026-08-01 announced in minutes dated", "  2026-06-20 → `event_date`=\"2026-08-01\" (value), `valid_from`=\"2026-06-20\"",
    "  with `valid_from_basis`=\"document\".",'
  cost: The prompt defines what an Event's validity start means, as "when that date started to hold /
    became known". It also fixes how it is justified in the Event case, as the document date with basis
    document. The enumeration valid-from-basis only says what justifies a validity start. The rules on
    a missing validity start only say that the document date is the default. Neither says that for event_date
    the value and the validity start are separate dates, or what the validity start of an event date means.
    The model is taught a business meaning that no node holds.
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: EVENT_CLASSIFICATION_DIRECTIVE, lines 60-62 (the `outro` fallback instruction in the system prompt
    sent to the model)
  evidence: '"- Use `outro` ONLY when NO domain value fits — and, in that case, LOWER the", "  confidence
    (≤ 0.74) to flag a possible catalog gap to curation. Do not force", "  a value that does not describe
    the fact.",'
  cost: The prompt tells the model to use `outro` only as a last resort and to lower confidence so that
    curation sees a catalog gap. No node holds this extraction policy. The allowed-event-types node lists
    `outro` as one value among nine and says nothing about when it applies. The new-assertion-status-from-confidence
    node holds the 0.40-0.75 band, but not the use of that band as a catalog-gap signal. The decision
    therefore lives only in this prompt, and a reader looking in the specification for how `outro` is
    meant to be used will not find it.
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: EVENT_CLASSIFICATION_DIRECTIVE, lines 63-66 (the relative-date instruction in the system prompt)
  evidence: '"- RELATIVE DATES in the text (\"hoje\", \"ontem\", \"amanhã\", \"semana que vem\")", "  resolve
    against `document_date`: `event_date` (the VALUE) gets the computed", "  date and `valid_from_basis`=\"document\".
    With no known `document_date`, omit", "  the date (the backend records `received`). NEVER invent a
    date.",'
  cost: The prompt makes the model compute an Event's date from relative expressions against the document
    date and tag it with basis `document`, or omit the date when there is none. No node holds that extraction
    behavior. The specification holds only the backend fallback (a proposal that states no start takes
    the document date, or else the reception date) and the rule that a caller never states `received`.
    The date-resolution policy therefore sits only in prompt text.
- file: src/modules/ingestion/prompts/extraction.v4.ts
  where: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 57-64 (the system prompt text sent to the model)
  evidence: '"- When you encounter a relative date in the chunk text (`\"hoje\"`, `\"ontem\"`,", "  `\"amanhã\"`,
    `\"semana que vem\"`, `\"esta semana\"`, similar pt-BR temporal", "  deictics), resolve it AGAINST
    `document_date` if it is present (basis", "- This supersedes v3''s rule of \"omit the date when `document_date`
    is unknown\":", "  with `received_at` always present, you now HAVE an anchor — use it.",'
  cost: The rule that a relative date is resolved against the document date, and that the date part of
    the reception time is the fallback, changes which validity starts get recorded and which basis they
    carry. No node holds it. The nearest node, the one on what an extraction shows the model, says only
    that the document date and reception time are shown. The business behavior therefore lives only in
    this prompt, and a reader looking in the specification will not find it.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: DirectedAttributeItemSchema and DirectedLinkItemSchema, lines 141-142 and 152-153 (`IsoDateSchema`,
    lines 99-102)
  evidence: 'valid_from: IsoDateSchema.optional(), valid_to: IsoDateSchema.optional(), ... z.string().regex(/^\d{4}-\d{2}-\d{2}$/,
    "valid_from / valid_to must be ISO YYYY-MM-DD");'
  cost: The code accepts a validity start and end on a directed attribute or link, in the format YYYY-MM-DD,
    and forwards them to the proposal. The directed nodes hold no validity dates for a directed item.
    The decision log of directed-defaults even says the directed tool declares no validity end. The directed
    validity surface therefore lives only in this schema, and the next reader will look for it in the
    specification and not find it.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: intakeMetadata construction, lines 338-351
  evidence: "const intakeMetadata: Record<string, unknown> = {\n    directed: true,\n  };\n  if (payload.source_label\
    \ !== undefined) {\n    intakeMetadata.source_label = payload.source_label;\n  }\n  ...\n    intakeMetadata.conversation_id\
    \ = deps.metadataPointer.conversation_id;\n    intakeMetadata.message_id = deps.metadataPointer.message_id;"
  cost: The metadata a directed raw information carries, namely a `directed` marker, the label and a pointer
    to the chat conversation and message, is a domain fact that only this code states. The directed nodes
    say what the content lists and what the original input is, and nothing about the metadata. The next
    reader who looks for it in the specification will not find it.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: pin-failure branch, lines 534-552, and verifyNodePin, lines 877-891
  evidence: "(pinResult.details as { reason?: unknown }).reason === \"not_found\"\n          ? \"RESOURCE_NOT_FOUND\"\
    \n          : \"VALIDATION_INVALID_FORMAT\";\n... message: `node_id pin resolves to a knowledge_node\
    \ row whose status is '${row.status}' (only 'active' is accepted).`"
  cost: The node holds that a pin must exist and be active. It does not say what a failed pin reports.
    Which error code a missing pin answers, which one an inactive pin answers, and the messages and `details`
    (`reason`, `current_status`) exist only in this code. The code takes the inactive-pin case as VALIDATION_INVALID_FORMAT
    from a spec table (`ingestion.back.md` v1.6.0), but no node holds it.
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: the intake catch block (lines 369-391), the noop_existing guard (lines 405-424) and the no-chunks
    guard (lines 429-447)
  evidence: 'message: "Failed to persist the directed payload before dispatch." ... "Directed ingestion
    intake returned ''noop_existing''; the per-call nonce should make this unreachable." ... message:
    "Directed ingestion intake produced no chunks."'
  cost: The ingest-directed contract lists only the validation refusals. These whole-call refusals (SYSTEM_INTERNAL_ERROR
    with these three messages, and SYSTEM_SERVICE_UNAVAILABLE for an unreachable store) are what the system
    tells the caller, and no node holds them. The analogous ingest-document refusal is held ("Failed to
    persist the document before extraction.").
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: consolidateLink (lines 443-485) and consolidateAttribute (lines 710-745), the two-attempt loop
    on a duplicate-guard violation
  evidence: "// Two attempts max (BR-27 / task contract).\nfor (let attempt = 1; attempt <= 2; attempt\
    \ += 1) {\n...\nif (attempt === 2) {\n  throw new ValidationFailure(\n    \"SYSTEM_INTERNAL_ERROR\"\
    ,\n    \"graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed\
    \ a conflicting row.\",\n    { scope: \"knowledge_link\" }\n  );"
  cost: No node holds the rule that a duplicate-guard race is re-decided exactly once, and that a second
    race is refused as SYSTEM_INTERNAL_ERROR. The retry count and the refusal live only in this file,
    so the next reader looks for them in the specification and does not find them.
restates:
- file: src/modules/ingestion/catalog/catalog.ts
  where: The doc comment on LinkTypeRuleRow, lines 47-51. The comment on the linkTypeRules field, line
    90, repeats it.
  evidence: '"A vigent `link_type_rule` row. We snapshot the whole table — the temporal filter (`valid_to
    IS NULL OR valid_to > current_date`) is applied at lookup time so a rule that expires between reloads
    is honoured."'
  cost: The window in which a rule is in effect is written a second time as prose. It uses `current_date`
    and omits the `valid_from` bound, while the code that applies the window is `isLinkRuleActive` (`today.getTime()
    < from.getTime()`, `today.getTime() >= to.getTime()` over UTC-truncated dates). A reader who trusts
    the comment looks for a database-date filter that does not exist here.
  node: rules/knowledge-base/link-type-rule-in-effect
- file: src/modules/ingestion/catalog/catalog.ts
  where: The doc comment on isLinkRuleActive, lines 265-267, and the header comment, lines 9-11.
  evidence: '"Look up an active `link_type_rule` for the given (source, link, target) triple. Returns
    `true` iff at least one rule covers the triple"'
  cost: The permission rule is stated again as prose, with a citation to "BR-15" of the back-spec instead
    of to the node. The matching code is the triple comparison in `isLinkRuleActive` (`r.link_type_id
    !== args.link_type_id || r.source_node_type_id !== ...`), so the prose is a second home outside behavior.
  node: rules/knowledge-base/link-permitted-by-type-rule
- file: src/modules/ingestion/catalog/catalog.ts
  where: The doc comment on isLinkRuleActive, lines 265-270.
  evidence: '"Returns `true` iff at least one rule covers the triple AND its validity window includes
    today (semi-open `[valid_from, valid_to)`; nulls mean unbounded — §5.1)."'
  cost: The in-effect window and the "nulls mean unbounded" reading are stated again in a comment that
    cites a section of the old v7 document. The running code is `isLinkRuleActive`'s own `from`/`to` comparisons,
    so the prose becomes a second home once the node moves.
  node: rules/knowledge-base/link-type-rule-in-effect
- file: src/modules/ingestion/chunker/config.ts
  where: lines 21-22, the docstring and declaration of CHUNK_HARD_MAX
  evidence: /** Hard ceiling on a single chunk. A block above this size is sentence-split. */ export const
    CHUNK_HARD_MAX = 4000 as const;
  cost: 'The docstring restates in prose the rule that a block over 4000 code points is cut at sentence
    boundaries. Code holds that rule in another file: v1.ts line 80 has `if (blockSize <= CHUNK_HARD_MAX)
    {`. The prose is a second home that no running system emits. If the node moves, the comment stays
    behind and still reads as authoritative. The label "Hard ceiling on a single chunk" is also looser
    than the node. The node says a block of at most 4000 is one chunk and a longer one is cut by sentence
    boundaries; it does not describe a ceiling on every chunk.'
  node: rules/knowledge-base/long-block-sentence-chunks
- file: src/modules/ingestion/chunker/v1.ts
  where: the RawChunkInput docstring, lines 42-46
  evidence: '"Verbatim slice of the original content between `offset_start` and `offset_end` (code points,
    semi-open)."'
  cost: 'The prose restates the verbatim-excerpt invariant. The code holds it in buildChunk: `text: codePoints.slice(start,
    endExclusive).join("")` with `offset_start: start` and `offset_end: endExclusive`. The invariant is
    stated twice and only one copy is read by anything.'
  node: rules/knowledge-base/chunk-excerpt-is-verbatim
- file: src/modules/ingestion/chunker/v1.ts
  where: the RawChunkInput docstring, lines 44-46
  evidence: '"`chunk_index` is the 0-based position within the document."'
  cost: The prose restates the chunk-index rule. The code holds it as `chunks.length` passed as the index
    to buildChunk in chunkV1, so indexes follow emission order from 0. The comment is a second home outside
    behavior.
  node: rules/knowledge-base/chunk-index-follows-content
- file: src/modules/ingestion/chunker/v1.ts
  where: the SPEAKER_LINE_REGEX docstring, lines 341-350
  evidence: "\"- `Name:` followed by white space (Name = ASCII identifier characters\n     plus single\
    \ embedded spaces — we keep it strict to avoid false\n     positives on prose like \"Importante: ...\"\
    ).\n   - Optional bracketed timestamp prefix `[12:00]` or `(12:00)`.\""
  cost: The prose restates the speaker-line definition, and it describes it differently from both the
    node and the regex. It says "ASCII identifier characters", while the regex accepts `À-ÿ`. The code
    holds the definition at SPEAKER_LINE_REGEX, so the pair differs in the code, not in the comment (see
    the contradicts finding on the regex). The comment is a third statement of the definition.
  node: rules/knowledge-base/speaker-line
- file: src/modules/ingestion/chunker/v1.ts
  where: the module header comment, lines 11-12 (step 2)
  evidence: '"For each block, try to keep it as one chunk if its size is at most `CHUNK_HARD_MAX` code
    points."'
  cost: The prose restates the short-block rule. The code holds it at `if (blockSize <= CHUNK_HARD_MAX)`
    in chunkV1. A second statement of the rule outside behavior can drift from the node without anything
    noticing.
  node: rules/knowledge-base/short-block-one-chunk
- file: src/modules/ingestion/chunker/v1.ts
  where: the module header comment, lines 12-18 (steps 2-3), and the splitBySentences comments, lines
    354-356 and 372-374
  evidence: '"fall back to sentence-level split via `Intl.Segmenter(''pt'', {granularity: ''sentence''})`
    (BR-07)."'
  cost: 'The prose restates the oversize sentence-split rule and its buffer-closing condition. The code
    holds both: `new Intl.Segmenter("pt", { granularity: "sentence" })` in splitBySentences and `if (tentativeSize
    > CHUNK_TARGET[1])` in chunkV1. The comment also attributes the rule to BR-07 of a document, not to
    the node. A reader is sent to that document rather than to the specification.'
  node: rules/knowledge-base/long-block-sentence-chunks
- file: src/modules/ingestion/chunker/v1.ts
  where: the module header comment, lines 8-10 (step 1), and the splitByHardBoundaries docstring, lines
    155-158
  evidence: '"For `ata`, `artigo`, `outro`, there are no hard boundaries — the whole content is a single
    block."'
  cost: 'The source restates, in prose, that these sources are one block. The code holds it at the `case
    "ata": case "artigo": case "outro": return [{ start: 0, endExclusive: total }];` branch of splitByHardBoundaries.
    The comment is a second home for the rule that no running system reads. If the node moves, the comment
    stays and keeps asserting the old rule.'
  node: rules/knowledge-base/undivided-sources
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docstring, lines 146-148
  evidence: "\"- `pdf`:          form-feed (`\\f`, U+000C). PDF extractors typically insert\n        \
    \            `\\f` between pages.\""
  cost: 'The prose restates the pdf boundary rule. The code holds it at `case "pdf": return splitOnCharBoundary(codePoints,
    "\f");`, and splitOnCharBoundary drops the delimiter and skips empty spans. The comment is a second
    home outside behavior.'
  node: rules/knowledge-base/pdf-blocks-at-form-feeds
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docstring, lines 148-149, and the splitEmail docstring, lines 213-215
  evidence: "\"- `email`:        first blank line (header/body separator) plus every\n               \
    \     transition into / out of a `>` quotation block.\""
  cost: The prose restates the email header-block rule. The code holds it at `if (!headersClosed && isBlank)`
    in splitEmail, where `blockStart = nextLineStart(lines, i)` leaves the blank line's break in no block.
    The comment is a second home outside behavior.
  node: rules/knowledge-base/email-header-block
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docstring, lines 148-149, and the splitEmail docstring, lines 213-215
  evidence: '"every transition into / out of a `>` quotation block"'
  cost: The prose restates the email quotation-block rule. The code holds it at `if (headersClosed &&
    i > 0 && !isBlank && isQuoted !== prevQuoted)` in splitEmail, with `isQuotedLine`. The comment is
    a second home outside behavior.
  node: rules/knowledge-base/email-quote-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: the splitByHardBoundaries docstring, lines 150-154, and the splitTurns docstring, lines 261-265
  evidence: "\"A line that starts with\n                    `[ \\t]*[A-Za-z0-9_]+[ \\t]*:[ \\t]` (e.g.\
    \ `João:`,\n                    `[12:00] Maria:`) opens a new block. We never fuse two\n         \
    \           consecutive speakers into one chunk.\""
  cost: The prose restates the turn-block rule. The code holds it as `for (let i = 1; i < lines.length;
    i++)` with `isSpeakerLine` in splitTurns. The quoted pattern is not the pattern the code runs, which
    is SPEAKER_LINE_REGEX at line 351. A reader who trusts the comment learns a different speaker-line
    definition than the one applied.
  node: rules/knowledge-base/turn-blocks
- file: src/modules/ingestion/dto/propose-link.dto.ts
  where: the docstring above ValidFromBasisSchema, lines 5-15
  evidence: "\"Only `stated` and `document` are accepted at the API boundary. The third\n value, `received`,\
    \ is a backend-only fallback that the temporal validator\n applies internally when neither `stated`\
    \ nor `document` can justify the\n date — it is never sent by an LLM or any external caller, so it\
    \ MUST NOT\n appear in this input enum.\""
  cost: 'The prohibition on a caller stating `received` is written here in prose, and the same sentence
    says what the backend does when no basis is given. The invariant and the fallback rule are held by
    nodes, and the code already holds them: `z.enum(["stated", "document"])` here, and `valid_from_basis:
    "received"` in src/modules/ingestion/validation/temporal.ts line 164. If either node moves, this paragraph
    keeps saying the old rule and nothing flags it.'
  node: rules/knowledge-base/caller-never-states-received
- file: src/modules/ingestion/hash.ts
  where: the docstring of composeIdempotencyKey, lines 20-27
  evidence: '`idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`, concatenated
    WITHOUT a separator. The order is exactly as defined in §8 of v7 and as documented in `ingestion.back.md`
    BR-08.'
  cost: The key's composition and operand order are stated a second time in prose outside the node. If
    the node changes the order or adds a separator, the docstring keeps asserting the old definition.
    It also points readers to §8 of v7 and a back-spec as the source of the rule, when the specification
    node is the authority.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/hash.ts
  where: the file header comment and the docstring of sha256Hex, lines 1-15
  evidence: // BR-01 (`content_hash`) and BR-08 (`idempotency_key`) of // `ingestion.back.md`. Both produce
    a 64-char lowercase hex string. UTF-8 // encoding is explicit on every `.update()` ... /** `sha256(content)`
    -- 64 char lowercase hex string.
  cost: The content-hash rule is stated a second time in prose outside the node. If the node moves, the
    comment keeps saying the old rule and no check reaches it. The next reader may take the comment as
    where the rule was decided.
  node: rules/knowledge-base/content-hash-is-sha256
- file: src/modules/ingestion/mcp/directed-ingest.handler.ts
  where: the docstring of IngestDirectedInvocationContext, lines 86-92
  evidence: '* The chat agent dispatch supplies `source_excerpt` (the operator''s verbatim * turn) here
    so the orchestrator can persist it as `original_input` on the * `RawInformation` row.'
  cost: 'The prose restates a fact the node already holds, so there are two homes for it. When the node
    moves, the comment keeps saying the old thing and nothing reads it. The code that records the fact
    is `original_input: deps.sourceExcerpt ?? null` in src/modules/ingestion/service/directed-ingestion.service.ts,
    line 366, so the pair conforms and only the prose is owed.'
  node: rules/knowledge-base/directed-turn-is-original-input
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the docstring of deriveValidationOutcome, lines 55-65
  evidence: '"Rule: when `result.outcome === ''rejected''` (the BELOW_CONFIDENCE_FLOOR branch returns
    this), the audit row is `''rejected''` per BR-17. Every other `ok:true` envelope is `''accepted''`."'
  cost: The mapping from a proposal's result to the tool call's validation outcome is restated in prose.
    The switch in the same function holds it, and the docstring departs from the switch by saying "Every
    other `ok:true` envelope is `'accepted'`" where the switch also returns other tags such as `consolidated`
    and `needs_review`. The comment will not follow the node when it changes, and it already disagrees
    with the code beside it.
  node: rules/knowledge-base/tool-call-validation-outcome
- file: src/modules/ingestion/mcp/handler-base.ts
  where: the file-header comment, lines 1-14, steps 4 and 5, and the docstring of runIngestHandler, lines
    125-131
  evidence: '"//   4. On `ValidationFailure`: ROLLBACK the business TX, then open a SEPARATE short TX
    to write the audit `tool_call` row (BR-23). //   5. On uncaught error: ROLLBACK, write `tool_call`
    with `error`, surface `SYSTEM_INTERNAL_ERROR` envelope." and "BR-23: even when the business transaction
    rolls back, the audit row is written via a SEPARATE short transaction (`insertToolCallStandalone`)."'
  cost: The rule that a refused or failed proposal leaves only its tool call is stated a second time in
    prose, next to the code that enforces it (`await client.query("ROLLBACK")` in `runIngestHandler` and
    `insertToolCallStandalone` in `safeWriteAuditOnRollback`). When the node moves, `--check` will not
    reach this prose, so a reader can take the comment for the decision. Nothing is wrong with the behavior.
  node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: lines 18-21, the header comment's Idempotency paragraph
  evidence: '// Idempotency (BR-08): if the same content was already ingested, // `ingestRawInformation`
    returns `noop_existing`; we DO NOT re-run extraction // (the existing run is completed, or running,
    and re-running would either no-op // or 409).'
  cost: The comment states, in prose, the rule that held content is not extracted again. The branch `if
    (outcome === "noop_existing")` at line 158 already holds that rule. A second wording sits beside the
    code, and the next reader may treat it as the place where the rule was decided. The comment adds an
    explanation of 409 and no-op behavior that the node does not hold.
  node: rules/knowledge-base/document-ingestion-extracts-new-content
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: lines 41-48, the docstring on DEFAULT_INGEST_MODEL, and the fallback at line 119
  evidence: '* Hard-coded fallback extraction model used only when the caller omits `model` * AND no `ingestModel`
    is wired (e.g. a bare test harness). Production threads * `env.INGEST_MODEL` through `deps.ingestModel`.'
  cost: 'The docstring restates the default-model order (configured model, otherwise claude-sonnet-4-6).
    The code holds the same order in `export const DEFAULT_INGEST_MODEL = "claude-sonnet-4-6";` and `model:
    input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL`. A reader who changes the model has two statements
    of the fact to keep in step. The docstring also carries cost and validation history ("Cost-optimized
    to Sonnet 4.6", "Opus 4.8 was the original functional-E2E-validated model") that no node holds.'
  node: rules/knowledge-base/default-extraction-model
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: comment inside system(), lines 89-99
  evidence: // `allowed_values` diagnostic, keeping prompt and rejection envelope in // sync). Open-domain
    keys (no rows in `attribute_valid_value`, // `domainOf` returns `null`) print unchanged — backward-compatible.
    The // runtime check (`assertValueInDomain`, BR-30) is still the authoritative // gate; this is a
    hint to steer the LLM toward in-domain values.
  cost: The comment says again that a value for a closed-domain key must come from its allowed values,
    and names a runtime gate that enforces it. The prose is a second home for the rule beside the code,
    and it ages without any check.
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: header comment, lines 29-31, and the UserPromptArgs.prevTail doc comment, line 231
  evidence: // `prev_tail` carries the last ≤ `PREV_TAIL_CHARS` (200) characters of the // previous chunk
    to provide minimal cross-chunk continuity (BR-26 step 5a). // It is empty for `chunk_index = 0`.
  cost: The 200-character window is stated in prose here as well as in code. The prose is a second home
    for the number. A reader who finds it here may take this file for the place that decides it, and the
    comment would not change if the window did.
  node: rules/knowledge-base/extraction-reads-chunks-in-order
- file: src/modules/ingestion/prompts/extraction.v3.ts
  where: the header comment, lines 7-12, and the docstring above EVENT_CLASSIFICATION_DIRECTIVE, lines
    45-51
  evidence: '"events whose kind fell outside the original closed `event_type` domain {reunião, go-live,
    workshop, outro} landed on `outro` with a lowered confidence (→ `uncertain`). Migration `0003_event_type_taxonomy.sql`
    widened that closed domain (cobrança, decisão, escalonamento, bloqueio, marco)"'
  cost: The comment lists the allowed values of Event.event_type, a fact the specification holds as a
    node. A third place now states the list, and nothing keeps it current when the taxonomy changes. The
    values are also held in code at migrations/seeds/0003_event_type_taxonomy.sql (the row `('Event',
    'event_type', 'escalonamento', 'Escalonamento', 7)`), so the comment is prose over a fact code already
    holds.
  node: rules/knowledge-base/allowed-event-types
- file: src/modules/ingestion/prompts/index.ts
  where: the header comment, lines 10-15, and the doc comment of selectPromptModule, lines 83-87
  evidence: '"An unknown version is a configuration error, NOT a silent fallback: BR-26 step 2 mandates
    \"load the extraction.${prompt_version} module; fail with 500 SYSTEM_INTERNAL_ERROR if the module
    is missing\"." and "Throws `UnknownPromptVersionError` for an unregistered version (BR-26 step 2 —
    fail loud, never silently substitute a different prompt than the run declares)."'
  cost: The rule that an extraction's prompt version must be one the system holds is said a second time
    in prose beside the code that enforces it (the `REGISTRY[promptVersion]` lookup and `throw new UnknownPromptVersionError(promptVersion)`).
    The comment also quotes a status and error code (500 SYSTEM_INTERNAL_ERROR) that this file does not
    produce. When the node moves, the comment goes stale and a reader may take it for the decision.
  node: rules/knowledge-base/prompt-version-known
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring above aggregateToolCallOutcomes, lines 111-118
  evidence: "Returns a fully-formed `LlmRunSummary` — every field\n * present, missing buckets default\
    \ to 0 (BR-12)."
  cost: 'The zero-for-an-absent-outcome rule is also written as prose with a BR-12 citation, beside the
    code that holds it (the initialised `summary` object with `accepted: 0 … error: 0`). If the node moves,
    the comment keeps asserting the old rule and nothing reads it. The prose adds a second place that
    claims to decide the rule.'
  node: rules/knowledge-base/summary-counts-tool-calls
- file: src/modules/ingestion/service/affected-nodes.ts
  where: Comments at lines 222-232 (resolveAffectedNodes docblock) and 302-303 (Step 3)
  evidence: '*   - Rows whose `knowledge_node.status = ''merged_into''` are resolved

    *     transparently to the surviving node via `merged_into_node_id`.'
  cost: The prose restates that a merged affected node is listed as the node it was merged into, and cites
    "BR-33" as the authority. The code in this file already holds the fact (the survivor lookup and the
    one-hop follow in Step 3). A second copy in prose can drift from the node.
  node: rules/knowledge-base/affected-nodes-follow-merges
- file: src/modules/ingestion/service/affected-nodes.ts
  where: Comments at lines 27-30 (header), 61-66 and 72-86 (collector and isContributingOutcome), and
    147-149 (createAffectedNodeCollector)
  evidence: '// `rejected` and `error` validation outcomes do NOT contribute (they did not

    // touch the graph). De-dup is by `node_id`; first-write-wins on the entry.

    // Iteration order on the final list is insertion order (deterministic by

    // per-chunk tool-use order).'
  cost: The comments restate which proposals contribute and that each node is listed once in the order
    first reached. They also cite "BR-33" as the authority. The code in this file already holds both facts
    (the allow-list switch, and the `seen` Map with its `has` check and insertion order). A second copy
    in prose can drift from the node without anything noticing.
  node: rules/knowledge-base/affected-nodes-of-a-run
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: DirectedIngestionDeps.sourceExcerpt docstring, lines 274-280
  evidence: '* Verbatim user turn that triggered this directed run (TC-01 / BR-34). ... Forwarded as *
    `original_input` to `ingestRawInformation`; NEVER mixed into'
  cost: 'The rule that the turn''s excerpt is recorded as original input is stated again in a docstring,
    while code holds it at line 366 (`original_input: deps.sourceExcerpt ?? null`).'
  node: rules/knowledge-base/directed-turn-is-original-input
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Step 2 comment, lines 333-337, and the docstring of synthesiseContent, lines 834-838
  evidence: // Content is the concatenation of fragments[].text (one per line, prefixed // with `[ref]`)
    + a trailing line carrying timestamp + nonce.
  cost: The content layout is restated in prose that no running system emits, while `synthesiseContent`
    (lines 839-852) holds it.
  node: rules/knowledge-base/directed-source-content
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Step 3b comment, lines 511-512 ("`node_id` pin bypasses BR-25 fuzzy resolution")
  evidence: // 3b. Nodes — `node_id` pin bypasses BR-25 fuzzy resolution; otherwise //     delegate to
    `propose_node` (advisory lock + resolution).
  cost: The rule that a pinned node skips entity resolution is restated in prose that no running system
    emits, while the branch at line 514 (`if (item.node_id !== undefined)`) and `verifyNodePin` hold it.
  node: rules/knowledge-base/directed-pinned-node
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Step 3c comment, lines 599-601
  evidence: '`confidence = 1.0`; `valid_from_basis` defaults to //     `''stated''` when omitted by caller
    (BR-34 Defaults matrix).'
  cost: 'The basis default is restated in prose that no running system emits, while code holds it at lines
    636 and 716 (`valid_from_basis: item.valid_from_basis ?? "stated"`).'
  node: rules/knowledge-base/directed-defaults
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: docstring above DirectedAttributeValueSchema, lines 119-124
  evidence: '*   - boolean → `"true"` / `"false"` *   - number  → JSON `String(n)` (`5`, `-1.5`)'
  cost: The value-to-text rule is stated again in a docstring, while `canonicaliseAttributeValue` (lines
    941-945) holds it. The docstring is a second home in prose.
  node: rules/knowledge-base/directed-attribute-value-as-text
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 26-27 ("Forces `confidence = 1.0` ...")
  evidence: //   - Forces `confidence = 1.0` and defaults `valid_from_basis = 'stated'`
  cost: 'The confidence value is restated in prose that no running system emits, while code holds it (`confidence:
    1.0` at lines 475, 632 and 712). A reader can take the comment as the place the value was decided.'
  node: rules/knowledge-base/directed-full-confidence
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: 'header comment, lines 28-31 ("Cascade rule: ...") and the docstring at lines 898-900 of checkCascade'
  evidence: '//   - Cascade rule: when a ref dependency is missing (the referenced //     fragment/node
    was rejected at its own step), the dependent item is //     skipped with a synthetic `dependency_failed`
    report entry'
  cost: The cascade rule is stated in prose that no running system emits, while the same rule is held
    in `checkCascade` and `checkLinkCascade` (lines 907-908 and 917-919). If the node moves, the comment
    keeps the old wording.
  node: rules/knowledge-base/directed-dependency-failed
- file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 9-10 ("dispatches the items in dependency order (fragments → nodes → attributes
    → links)")
  evidence: // the items in dependency order (fragments → nodes → attributes → links)
  cost: The dispatch order is stated a second time in prose that no running system emits. If the order
    changes, this comment goes stale beside the loops that actually hold it (3a to 3d, lines 472, 513,
    603 and 682). The node binds this file, so `--check` will never flag the comment.
  node: rules/knowledge-base/directed-dispatch-order
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the docstring of closeVigentForSuccession, lines 266-278
  evidence: "set\n * `valid_to = closeDate` (the new version's `valid_from`, or `today` when the\n * new\
    \ row has none) and LEAVE `superseded_at = NULL`."
  cost: The closing-date rule is restated in prose while `closeVigentForSuccession` holds it. It is a
    second home that can drift when the node moves.
  node: rules/knowledge-base/succession-closing-date
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the docstring of closeVigentForSuccession, lines 279-289 (EXCEPTION — intra-day collapse)
  evidence: "* EXCEPTION — intra-day collapse: validity is day-granular (`date`, §5.1) and\n * `valid_from\
    \ < valid_to` is strict"
  cost: The succession-before-previous-start rule is restated as prose, with spec section numbers and
    a "documented day-granularity limitation". The CASE expressions at lines 302-311 hold it. The prose
    is a second home that drifts from the node.
  node: rules/knowledge-base/succession-before-previous-start
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the docstring of promoteFragmentsToAccepted, lines 243-251
  evidence: "* §6.6 state machine: an InformationFragment cited by an accepted\n * consolidation (a `Provenance`\
    \ row was just created) transitions\n * `proposed -> accepted`."
  cost: The invariant is restated as prose over the UPDATE `SET status = 'accepted' ... AND status = 'proposed'`
    that holds it. The second home can drift from the node.
  node: rules/knowledge-base/provenance-accepts-proposed-fragment
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the header comment, lines 1-39 (the five-branch list)
  evidence: '// decide between the five branches of

    // §6.5:

    //

    //   * consolidated      — same value / same valid_from / change_hint=''none''

    //                         AND a vigent row already exists'
  cost: The consolidation order and the branch conditions are restated as prose beside the code that holds
    them. The prose also states the re-affirmation condition (same value, same valid_from, hint none)
    that the multi-valued case contradicts. A second home for the precedence outside behavior can drift
    from the node, and the cost is carried by whoever believes the comment.
  node: rules/knowledge-base/consolidation-precedence
- file: src/modules/ingestion/service/graph-consolidation.service.ts
  where: the header comment, lines 19-23 and 45-62 (the correction branch and "SPEC DIVERGENCE — status='corrected'")
  evidence: 'close the vigent row (superseded_at=now(),

    //                         status=''superseded''; valid_to untouched) and

    //                         insert the new row chained via supersedes_*.'
  cost: 'The correction rule is restated in prose, together with a history of which spec text said ''corrected''.
    The UPDATE at lines 565-571 and the insert with `supersedes_link_id: vigent.id` hold the fact. The
    history is a claim nobody can check against a node.'
  node: rules/knowledge-base/correction-replaces
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the comment inside the insertRawInformation argument object (lines 122-124)
  evidence: '"// TC-01 / BR-34: pass-through of the verbatim user turn from the\n// chat-directed path.
    `content_hash` is computed above over `content`\n// only — `original_input` never affects idempotency."'
  cost: The relation between the chat turn and original_input is written in prose under a BR/TC identifier,
    not under the node that holds it. If that node changes, the comment becomes a second, stale statement
    of it.
  node: rules/knowledge-base/directed-turn-is-original-input
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the docstring above ingestRawInformation (lines 79-80) and the comment at line 102
  evidence: '" *   1. Compute `content_hash = sha256(content)`." and "// BR-01 — content hash is the idempotency
    anchor."'
  cost: The rule that a content hash is the SHA-256 of the content is written in prose here as well as
    in the node. If the node moves, nothing reaches this prose, and the next reader may take the docstring
    for the decision instead of the node.
  node: rules/knowledge-base/content-hash-is-sha256
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the docstring above ingestRawInformation, "Idempotent no-op path" (lines 87-93), and the docstring
    of noopExisting (lines 196-200)
  evidence: '" * Idempotent no-op path (UC-01 alt 4a):\n *   - Re-read the existing raw_information by
    content_hash." and " * The no-op idempotent branch (BR-09). Returns the existing identifiers; the\n
    * chunks array is empty by spec"'
  cost: The rule that held content records nothing new is narrated in prose beside the code. The prose
    cites BR and UC identifiers that are not this node, so a reader may look for the rule in the wrong
    place.
  node: rules/knowledge-base/held-content-records-nothing
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the docstring above ingestRawInformation, step 2 (line 81)
  evidence: '" *   2. Compute `idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`."'
  cost: The composition and order of the key are written again outside any node. If the node changes the
    order or an operand, this prose keeps saying the old formula and nothing flags it.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the docstring above ingestRawInformation, steps 3-5 (lines 82-85), and the comment at line 153
  evidence: '" *   4. Chunk via `chunkV1`; bulk INSERT raw_chunk.\n *   5. INSERT llm_run with the precomputed
    key." and "// Step 5 — open the LLMRun. Insert with DEFAULTs for status/attempts/started_at."'
  cost: The sequence raw information, then chunks, then one run is stated in prose as well as in code.
    The comment also says the run's initial status comes from a database DEFAULT. A reader looking for
    where status `running` is set will not find it in this file.
  node: rules/knowledge-base/ingestion-records-chunks-and-run
- file: src/modules/ingestion/service/propose-attribute.service.ts
  where: lines 131-134, the comment above the `sourceMetaRes` query
  evidence: "`received_at`\n  // is the LAST link of the date-justification chain (v7 §6.5 / §13c / A14)\n\
    \  // and is consumed by `validateTemporal` as the fallback for\n  // `requires_valid_from = true`\
    \ rows that carry no stated/document date."
  cost: 'The comment restates the required-start-available rule: a start that is stated, or taken from
    the source''s document date, or from its reception date. The code holds this in the query selecting
    `document_date` and `received_at` and in the `validateTemporal(...)` call. The comment names v7 sections
    that are not the node, so the next reader is pointed at the wrong place.'
  node: rules/knowledge-base/required-start-available
- file: src/modules/ingestion/service/propose-attribute.service.ts
  where: lines 85-92, the comment block above `const domain = domainOf(deps.catalog, resolvedKey.id);`
  evidence: Exact match (no normalisation) per spec §1 / BR-30 v1 semantics.
  cost: The comment restates the exact-as-written rule for allowed values, which the code holds in `assertValueInDomain(args.value,
    domain)`. It is a second home outside behavior, and it cites BR-30 and "spec §1" instead of the node
    that holds the rule. When the node moves, the comment will not follow.
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/service/propose-link.service.ts
  where: header comment, lines 17-19 (and the "< 0.40" in the Confidence layer line 13)
  evidence: '// On confidence < 0.40 the service returns `{ ok: true, result: { outcome: // ''rejected'',
    reason: ''BELOW_CONFIDENCE_FLOOR'' } }`. The caller maps this to // `validation_outcome = ''rejected''`
    on the `tool_call` row (BR-17).'
  cost: The 0.40 floor is written as a literal in prose in this file. The number is decided by the node
    `rules/knowledge-base/below-confidence-floor-records-nothing`, and `routeConfidence` in `src/modules/ingestion/validation/confidence.ts`
    applies it. If the floor moves, this comment keeps the old figure.
  node: rules/knowledge-base/below-confidence-floor-records-nothing
- file: src/modules/ingestion/service/propose-link.service.ts
  where: header comment, lines 6-16 (the layered-validation list)
  evidence: '// Layered validation (BR-13) in the documented order. Each layer is a // sequential `await`,
    so layer N+1 only runs when layer N has not thrown: //   1. Structural    — cross-table refs (nodes
    exist, fragments exist, //                      link_type known). //   2. Graph rules   — active link_type_rule
    for the triple (BR-15). //   3. Temporal      — semi-open invariant, change_hint signal, date basis.
    //   4. Confidence    — < 0.40 -> ok:true outcome=rejected (BELOW_CONFIDENCE_FLOOR). //   5. Anti-halluc.  —
    every cited fragment anchors a chunk of the run''s //                      source (BR-18).'
  cost: The check order is written a second time as prose beside the code that runs it. If the node `rules/knowledge-base/link-proposal-check-order`
    moves and the code is reordered, this list stays behind and states an order nobody decided. The next
    reader finds a plausible order in the comment and stops looking.
  node: rules/knowledge-base/link-proposal-check-order
- file: src/modules/ingestion/validation/confidence.ts
  where: the header comment, lines 3-4 (the active and uncertain branches), above CONFIDENCE_FLOOR and
    routeConfidence
  evidence: //   confidence >= 0.75            -> assertion status = 'active' //   0.40 <= confidence
    < 0.75     -> assertion status = 'uncertain'
  cost: The comment states the 0.75 and 0.40 status bands a second time, in prose that nothing runs. If
    the node's thresholds move, the comment goes on asserting the old bands and a reader can take it as
    the decided rule. The code holds the same fact in this file (CONFIDENCE_UNCERTAIN_UPPER, CONFIDENCE_FLOOR
    and the first two branches of routeConfidence), so the pair conforms and only the prose is owed removal.
  node: rules/knowledge-base/new-assertion-status-from-confidence
- file: src/modules/ingestion/validation/confidence.ts
  where: the header comment, lines 5-7 (the below-floor branch), above CONFIDENCE_FLOOR and routeConfidence
  evidence: //   confidence < 0.40             -> link/attribute NOT created;
  cost: 'The comment restates the 0.40 floor and the rule that nothing is recorded below it, in prose
    no running system emits. The code holds the floor in this file (`CONFIDENCE_FLOOR = 0.4` and `return
    { kind: "below_floor" }`), so the pair conforms. The comment is a second home that can drift from
    the node unnoticed.'
  node: rules/knowledge-base/below-confidence-floor-records-nothing
- file: src/modules/ingestion/validation/graph-rules.ts
  where: the header comment, lines 1-8, and the docstring above validateGraphRule, lines 19-22
  evidence: '"Look up an active `link_type_rule` matching the `(source_node_type, link_type, target_node_type)`
    triple. ... Any other triple yields `BUSINESS_LINK_RULE_VIOLATION`."'
  cost: The comment states in prose the rule that a link must be permitted by an active type rule for
    its source and target node types. The code holds that rule by calling `isLinkRuleActive` with `today`,
    imported from "../catalog/catalog.js". If the node moves, a second statement of the rule sits in this
    file where the next reader may take it as the rule itself.
  node: rules/knowledge-base/link-permitted-by-type-rule
- file: src/modules/ingestion/validation/structural.ts
  where: the docstring above assertValueInDomain, lines 88-108, and the inline comment at lines 116-118
  evidence: '"exact-match string equality,\n * no normalisation, no case-folding, no trim (v1 semantics,
    §1 / BR-30)." and "On miss, raises `VALIDATION_INVALID_FORMAT` with deterministic-ordered\n * `allowed_values`"
    and "`[...domain].sort()` is locale-default lexicographic"'
  cost: 'The docstring restates, in prose, the node''s rule that a value must be carried "exactly as written".
    It also restates the refusal''s shape and cites BR-30, BR-26 and TC-03 as authority. The code already
    holds the rule: `domain.has(value)` is an exact-match test with no normalisation, and the throw carries
    `allowed_values` sorted. A second statement of the rule outside behavior can drift from the node,
    and a reader may take the comment, not the node, as where the rule was decided.'
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/ingestion/validation/temporal.ts
  where: Comment block at lines 128-135, above the branches at lines 136-173.
  evidence: // the run's source — it is the LAST link and the reason // BUSINESS_DATE_UNJUSTIFIED should
    fire ONLY when received_at is also absent.
  cost: The comment states that the rejection fires only when `received_at` is also absent. That is not
    what the code does for the `document_date` branch, and it adds a second, divergent statement of the
    availability rule beside the branch at lines 143-173.
  node: rules/knowledge-base/required-start-available
- file: src/modules/ingestion/validation/temporal.ts
  where: Header comment, lines 11-13, and the doc comment above ERRATA_MARKERS, lines 61-65; the code
    at lines 66 and 117-126 holds the same rule.
  evidence: '// - correction signal: `change_hint = ''correction''` requires textual errata //     evidence
    in at least one cited fragment. ... * errata in at least one cited fragment (case-insensitive substring
    of any * of the Portuguese/English markers used in the domain glossary).'
  cost: The errata rule and its marker vocabulary are described in prose twice. The ERRATA_MARKERS constant
    and the `hasErrataSignal` branch already hold them, so a change to the node's marker list can leave
    two comments describing the old list.
  node: rules/knowledge-base/correction-requires-errata-evidence
- file: src/modules/ingestion/validation/temporal.ts
  where: Header comment, lines 4-5 (semi-open invariant bullet); the line 107-115 branch holds the same
    rule.
  evidence: '// - semi-open invariant: `valid_from < valid_to` when both are provided //     (BR-16 /
    §13.3 / §5.2).'
  cost: The start-before-end rule is written a second time as prose beside the branch that enforces it
    (`if (input.valid_from >= input.valid_to)`). A reader can take the comment, with its BR-16 and section
    citations, for the authority. When the node moves, the comment keeps saying the old rule.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/ingestion/validation/temporal.ts
  where: Header comment, lines 6-10 (date justification chain bullet); the branch at lines 136-142 holds
    the same rule.
  evidence: '// - date justification chain (A14 / §6.5): when `requires_valid_from = true` //     for
    the link_type or attribute_key, AND `valid_from` is supplied, the //     caller must declare a non-null
    `valid_from_basis`.'
  cost: The comment restates the basis rule and narrows it to `requires_valid_from = true`. The code at
    line 136 (`input.valid_from !== null && input.valid_from_basis === null`) does not condition on that
    flag. A reader of the comment learns a narrower rule than the code applies and than the node states.
  node: rules/knowledge-base/stated-start-requires-basis
- file: src/shared/health.ts
  where: the docstring of collectHealth(), lines 18-23
  evidence: "Never\n * throws — a DB failure surfaces as `{ ok: false, database: \"unreachable\" }`\n\
    \ * so callers always get a usable report"
  cost: 'The rule that an unanswering store is reported as unreachable and never makes the probe fail
    is stated twice in this file: in the try/catch that holds it, and in this prose. When the node moves,
    the docstring keeps saying the old rule and nothing flags it, because it is not code and `--check`
    does not reach it.'
  node: rules/knowledge-base/health-probe-never-fails
pairs_omitted:
- node: domain/knowledge-base/attribute-key
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/link-type
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/link-type-rule
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-type
  file: src/modules/ingestion/catalog/catalog.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/long-sentence-own-chunk
  file: src/modules/ingestion/chunker/config.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunks-never-cross-blocks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/contentless-blocks-single-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/email-quote-blocks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/long-sentence-own-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/email-without-blank-line-is-one-block
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/form-feed-only-pdf-is-one-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-ingestion
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/directed-item-kind
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-ingestion-run
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-requires-fragment-and-node
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-in-catalog
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-order
  file: src/modules/ingestion/dto/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/dto/propose-link.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/mcp/handler-base.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-requires-running-run
  file: src/modules/ingestion/mcp/handler-base.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-run-checks-first
  file: src/modules/ingestion/mcp/handler-base.ts
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
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
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
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-requires-running-run
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-run-checks-first
  file: src/modules/ingestion/mcp/propose-fragment.handler.ts
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
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-anchors-to-read-chunk
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
- node: rules/knowledge-base/node-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-confidence-range
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/knowledge-node
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-summary
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/tool-call
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/cited-fragments-anchored
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/closing-stamps-finish-time
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-chunks-in-run-source
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/llm-run-lifecycle
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/orphaned-fragment
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestion-latest-run
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/recent-ingestions-order
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/retry-counts-attempts
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/retry-rejects-orphaned-fragments
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/summary-counts-orphaned-fragments
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/tool-call-listing-order
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/tool-call-total-before-pagination
  file: src/modules/ingestion/repository/llm-run.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-resolution
  file: src/modules/ingestion/service/affected-nodes.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: src/modules/ingestion/service/affected-nodes.ts
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
- node: rules/knowledge-base/directed-attribute-value-shape
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-fragments-anchor-first-chunk
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-ingestion-run
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-later-reference-wins
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
- node: rules/knowledge-base/directed-source-label-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-text-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-name-length
  file: src/modules/ingestion/service/directed-ingestion.service.ts
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
- node: rules/knowledge-base/name-normalization
  file: src/modules/ingestion/service/entity-resolution.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/change-hint
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/consolidation-precedence
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/current-assertion
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/proposal-meets-current-assertion
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/same-target-succession-is-disputed
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/content-hash-unique
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key-unique
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-for-node-type
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
- node: constraints/ingestion-transports-answer-alike
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-anchored
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-exist
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/cited-fragments-in-run
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/service/propose-link.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/proposal
  file: src/modules/ingestion/validation/confidence.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
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
- node: rules/knowledge-base/date-check-order
  file: src/modules/ingestion/validation/temporal.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/database-status
  file: src/shared/health.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/health-checked-at-probe-start
  file: src/shared/health.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 29 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/certify-ingestion-tests.returns/.\nCertification of rules/knowledge-base/directed-source-content\
  \ did not hold: the auditor answered `partial` — Part of the fact is tested. \"synthesises content with\
  \ the fragments + nonce + timestamp\" checks that the content contains each fragment as \"[ref] text\"\
  , a directed_at moment and a nonce. The two distinct-contents tests check that every call gets its own\
  \ nonce. Three parts of the fact go untested. First, the order: every assertion uses toContain, so content\
  \ that put the nonce or the moment ahead of the fragments would still pass. Second, the label: no fragment\
  \ in the set has one, so nothing checks that a label follows a fragment's reference and text when present,\
  \ or is left out when absent. Third, the chat raw information: nothing checks the source type of the\
  \ body passed to ingestRaw. The stub ignores it, and the re-affirmation test only compares two captured\
  \ contents for inequality. The layout checks also run against the __testing__.synthesiseContent helper,\
  \ not against the content directedIngestionService actually hands to intake. If the service stopped\
  \ recording the helper's output, these tests would still pass.. The node is decided by reading, and\
  \ a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Call directedIngestionService with two fragments, one with a label and one without, and\
  \ a fixed moment of ingestion. Capture the body passed to ingestRaw. Assert that its source type is\
  \ chat. Assert that its content is exactly each fragment's reference and text in caller order, then\
  \ the label line only for the labelled fragment, then the moment of ingestion, then a nonce. Compare\
  \ the whole content for equality, not by containment..\nCertification of rules/knowledge-base/directed-attribute-value-as-text\
  \ did not hold: the auditor answered `partial` — The text form is checked only on the helper reached\
  \ through `__testing__`. That check covers 42 to \"42\", -1.5 to \"-1.5\", true to \"true\" and false\
  \ to \"false\". No test checks that the attribute the orchestrator actually proposes carries that text\
  \ form. If the orchestrator stopped calling the helper and passed the raw number or boolean to propose_attribute,\
  \ every test in the file would still pass.\nThe test \"happy path: dispatches fragments → nodes → attributes\
  \ → links in order; run closes 'completed'\" does send a directed attribute with the number value 30.\
  \ But it only records that value inside a template literal (\"attribute:age=30\"), which reads the same\
  \ whether 30 arrived as a number or as the text \"30\", so it cannot fail on this fact.\nThe test \"\
  forced confidence: dispatched propose_* args carry confidence=1.0 even when the caller payload has no\
  \ confidence field\" captures the args passed to propose_attribute, but it never asserts their value.\n\
  No test sends a directed attribute with a boolean value through the orchestrator.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Two inputs, each with one expected result. A directed attribute with the\
  \ number value 30 should reach propose_attribute with value equal to the text \"30\", checked as a string\
  \ (for example with toBe(\"30\") and typeof \"string\"). A directed attribute with the boolean value\
  \ true (and one with false) should reach propose_attribute with value equal to the text \"true\" (and\
  \ \"false\")..\nCertification of rules/knowledge-base/directed-item-status did not hold: the auditor\
  \ answered `partial` — Several parts of the fact are exercised. A recorded fragment reports accepted\
  \ (happy path, per-item rejection). A node whose resolution is created_new or matched_existing reports\
  \ accepted (happy path, valid pin). A refusal that is not a system error reports rejected, both for\
  \ a link refused with BUSINESS_LINK_RULE_VIOLATION and for a pinned node refused with RESOURCE_NOT_FOUND.\n\
  Other parts go unexercised. No node in the set has a resolution that sends it to review, so the needs-review\
  \ half of \"needs-review or accepted for a node according to its resolution\" is never asserted. Every\
  \ taken attribute and link returns the outcome \"accepted\", so a status hard-coded to accepted would\
  \ pass just as well as one carrying the item's outcome. \"Its outcome for a taken attribute or link\"\
  \ is therefore not shown to carry anything except accepted. The error half is asserted only on the internal\
  \ __testing__.classifyEnvelopeFailureStatus helper. No orchestrator test has a propose_* handler refuse\
  \ with a SYSTEM_* code and then reads the report entry's status. If the orchestrator stopped routing\
  \ item refusals through that helper, the suite would still pass with the item reported wrongly.\nThe\
  \ fragment refused with VALIDATION_INVALID_FORMAT in the missing-evidence cascade test never has its\
  \ own status asserted. The cascade tests assert dependency_failed for skipped dependents, a status the\
  \ fact does not name. Whether a cascaded skip counts as a refusal that the fact maps to rejected is\
  \ not settled here.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: Each open part is one input against\
  \ one expected result, and all of them run through directedIngestionService's report: (1) a node proposal\
  \ whose resolution sends it to review, expecting the node's report status needs-review; (2) an attribute\
  \ and a link whose handler returns an outcome other than accepted, expecting each report status to equal\
  \ that outcome; (3) a fragment, node, attribute or link handler refusing with a SYSTEM_* code, expecting\
  \ that item's report status error, while a VALIDATION_* refusal of the same item kind expects rejected..\n\
  Certification of rules/knowledge-base/directed-dependency-failed did not hold: the auditor answered\
  \ `partial` — The proof exercises each missing reference on its own. Through the orchestrator, an attribute\
  \ whose node is missing and a link whose source is missing are each reported dependency_failed, name\
  \ that reference, and are not proposed. A link whose evidence is missing gets the same result. The checkCascade\
  \ helper covers an attribute with a missing node and an attribute with missing evidence, but only through\
  \ the __testing__ seam, not through the orchestrator's report. It has no case for links.\nNo test in\
  \ the set has more than one reference missing at once. So the fact's \"first missing reference\" ordering\
  \ is never checked: node before evidence for an attribute, and source, then target, then evidence for\
  \ a link. The comment \"Missing node_ref returned FIRST\" sits on a case where the evidence is present,\
  \ so that assertion would still pass if the order were reversed.\nNo test has a link whose only missing\
  \ reference is the target, so that position in the link's order is never exercised at all. No test sends\
  \ an attribute with missing evidence through the orchestrator and asserts that the report says dependency_failed\
  \ and that nothing is proposed.. The node is decided by reading, and a certification standing on it\
  \ from an earlier reconciliation is released by the bind. The remainder is testable: The open part can\
  \ be closed with a few inputs, each with one expected result. In each case the item is not proposed\
  \ and the report shows dependency_failed with the reason given here. (1) An attribute whose node and\
  \ evidence are both missing gives the node reference as the reason. (2) A link whose source, target\
  \ and evidence are all missing gives the source reference. (3) A link whose target and evidence are\
  \ missing, with the source present, gives the target reference. (4) A link whose only missing reference\
  \ is the target gives the target reference. (5) An attribute whose node is present but whose evidence\
  \ is missing, sent through the orchestrator, gives the evidence reference..\nCertification of rules/knowledge-base/directed-dispatch-order\
  \ did not hold: the auditor answered `partial` — The test checks the order across groups: fragments,\
  \ then nodes, then attributes, then links. It checks this on the proposals made and on the report refs.\
  \ Within a group, the given order is only checked for fragments and nodes. The three fragments are given\
  \ in an order that is not alphabetical, and the two nodes are given in an order a reversal would break.\
  \ The input has one attribute and one link. So if the orchestrator reordered attributes among themselves,\
  \ or links among themselves, both when proposing and when reporting, this test would still pass. The\
  \ fact's \"each group in the order given\" goes unexercised for attributes and links. The other tests\
  \ in the file give at most one attribute and one link. They locate report entries with find() by kind\
  \ or ref, so they assert no order.. The node is decided by reading, and a certification standing on\
  \ it from an earlier reconciliation is released by the bind. The remainder is testable: Give a directed\
  \ ingestion two or more attributes and two or more links, each group in an order no sort would produce.\
  \ Assert that the attribute proposals and the link proposals follow that given order. Assert that the\
  \ report's attribute entries and link entries appear in that same order, after the fragments and nodes..\n\
  Certification of rules/knowledge-base/directed-full-confidence did not hold: the auditor answered `partial`\
  \ — The fact holds that every fragment, attribute and link a directed ingestion proposes carries confidence\
  \ 1.0, whatever the caller sends. In every test the caller payload has no confidence field at all. The\
  \ tests show that 1.0 is what gets proposed when the caller says nothing. They never show that 1.0 is\
  \ what gets proposed when the caller supplies another value. Suppose an implementation passed on a caller-supplied\
  \ confidence and fell back to 1.0 only when none was given. Both named tests would still pass, yet that\
  \ implementation breaks the fact. Coverage of \"every\" item is also thin. The dedicated forced-confidence\
  \ test checks only the first dispatched fragment, attribute and link (index 0), with one of each in\
  \ the input. The happy-path test does check confidence on each of its three fragments. It also checks\
  \ its one attribute and its one link, but it does so inside its handler stubs, on the way to its real\
  \ subject, the dispatch order. That makes the check incidental. No test checks a second attribute or\
  \ a second link.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: One input against one expected\
  \ result. Submit a directed ingestion whose fragment, attribute and link items each carry a confidence\
  \ other than 1.0 (for example 0.5), with at least two attributes and two links. Expect one of two results:\
  \ the request is refused, or every dispatched propose_fragment, propose_attribute and propose_link argument\
  \ carries confidence 1.0, never the value the caller supplied..\nCertification of rules/knowledge-base/directed-defaults\
  \ did not hold: the auditor answered `partial` — Half of the fact is checked, and only on the side.\
  \ Both named tests send a directed attribute and a directed link with no basis, and both check that\
  \ the dispatched args carry valid_from_basis \"stated\". The forced-confidence test checks this on captured\
  \ args, and the happy-path test checks it inside its propose_attribute and propose_link stubs. In both\
  \ tests the check sits beside the assertion the test is named for: confidence 1.0 in one, dispatch order\
  \ in the other. Nothing marks the basis check as the point of either test. The change-hint half is not\
  \ exercised at all. No assertion in the file inspects a change hint on the args passed to propose_attribute\
  \ or propose_link. If those args carried any change hint other than none, or none at all, every test\
  \ in the file would still pass.. The node is decided by reading, and a certification standing on it\
  \ from an earlier reconciliation is released by the bind. The remainder is testable: Input: one directed\
  \ attribute and one directed link, neither stating a basis. Expected: the args captured for propose_attribute\
  \ and propose_link each carry change hint none and valid_from_basis \"stated\", asserted in a test whose\
  \ subject is these defaults..\nCertification of rules/knowledge-base/directed-pinned-node did not hold:\
  \ the auditor answered `partial` — The valid-pin test does check one outcome: a directed node carrying\
  \ a node_id comes back in the report with that id and resolution=matched_existing. Its other assertions\
  \ only check calls inside the code. One is that verifyNodePin was called with (pool, PIN_NODE_ID). The\
  \ other is that proposeNode, the entity-resolution handler, was not called. Neither one binds the fact.\n\
  The test also does not reach \"whatever node type, name or aliases it states\". The node it pins states\
  \ node_type Person and name Alice, which match the test catalog. No pinned node existing under a different\
  \ type or a different name is set up, and no aliases are stated. So nothing would fail if the code refused,\
  \ or re-resolved, a pin whose stated type, name or aliases differ from the existing node's.\nThe proviso\
  \ \"provided the node exists and is active\" is never decided by the code under test. Both tests replace\
  \ verifyNodePin with a stub that returns either ok or rejected/not_found. Whether the pinned node really\
  \ exists, or is active, is never looked up. The invalid-pin test shows only that the orchestrator turns\
  \ the stub's not_found rejection into RESOURCE_NOT_FOUND. Nothing in the set pins an existing but inactive\
  \ node (merged or deleted). The test's comment says an inactive pin maps to VALIDATION_INVALID_FORMAT,\
  \ but no assertion checks that. So the inactive half of the proviso is not tested.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Run the real pin verifier against stored knowledge-node rows and check\
  \ three cases. First, pin an active node while stating a node type, name and aliases that differ from\
  \ the node's own. It should resolve to exactly the pinned id, as matched_existing, without creating\
  \ or matching any other node. Second, pin a node whose status is not active (merged or deleted). It\
  \ should be refused. Third, pin an id that has no knowledge_node row. It should be refused..\nCertification\
  \ of rules/knowledge-base/document-ingestion-extracts-new-content did not hold: the auditor answered\
  \ `partial` — The handler's branching is exercised, and only through stubs. When the stubbed ingestRaw\
  \ says \"created\", the first test checks that the injected runExtraction is called once with the run\
  \ id the stub returned. When the stub says \"noop_existing\", the two noop tests check that runExtraction\
  \ is never called. Three parts of the fact go unexercised. First, nothing checks that the document is\
  \ recorded: ingestRaw is a vi.fn that resolves a canned body, so a broken intake that records no RawInformation\
  \ would still pass every test. Second, nothing checks that the run is new: \"run-1\" is a literal the\
  \ stub hands back, so no test tells a newly created LLM run apart from a reused one. Third, nothing\
  \ checks that held content is detected: \"already held\" is the stub's claim, never decided from content\
  \ a first ingest recorded. Both halves are also asserted only as calls on the injected runExtraction\
  \ seam. Those assertions bind how the handler is wired: they fail if extraction is driven some other\
  \ way, and they pass if runExtraction extracts nothing. The other tests in the file (provider fatal,\
  \ extraction fatal, untyped error, defaults, both intake errors) do not bear on this fact. \"intake\
  \ error (non-pg)\" also asserts that runExtraction is not called, but that is about intake failure,\
  \ not about content already being held.. The node is decided by reading, and a certification standing\
  \ on it from an earlier reconciliation is released by the bind. The remainder is testable: Two ingests\
  \ of the same document through ingest_document, against a real store. Input one is a document whose\
  \ content is not held yet. Expected: a RawInformation row is recorded, a new LLMRun is created for it,\
  \ and extraction runs under that run's id (its extraction records carry that llm_run_id). Input two\
  \ is the same content again. Expected: already_ingested, no new LLMRun, and no extraction activity recorded\
  \ under any run..\nCertification of domain/knowledge-base/health-report did not hold: the auditor answered\
  \ `partial` — Both tests check ok and database together. ok is true when the store answered and false\
  \ when it was unreachable. The other two attributes are only partly checked. checked_at is required\
  \ and typed as a datetime, but the success-path test only asserts typeof string. An empty or unparseable\
  \ string would pass, and so would a timestamp unrelated to when the probe ran. The unreachable-path\
  \ test does not check service or checked_at at all. A report that dropped either field when the store\
  \ is down would still pass, even though the node requires every attribute on every report. Separately,\
  \ the success-path test asserts that service equals the literal \"remember-bff\". The node only says\
  \ \"the service's name\" and states no particular value, so this asserts more than the node establishes.\
  \ It is a finding for a reader to route, not extra coverage.. The node is decided by reading, and a\
  \ certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Two checks would close it. With the store answering, checked_at must parse as a datetime\
  \ between the moments just before and just after the probe call. With the store unreachable, the report\
  \ must still carry a non-empty service string and a checked_at that parses as a datetime, next to ok\
  \ false and database unreachable..\nCertification of rules/knowledge-base/health-probe-never-fails did\
  \ not hold: the auditor answered `partial` — The only way the set makes the store fail to answer is\
  \ a pool whose connect() rejects. On that input the test asserts all three halves of the fact: the call\
  \ succeeds (env.ok true), the store is reported unreachable (database \"unreachable\"), and the system\
  \ is reported not healthy (result.ok false). Two other cases go unexercised. First, a store that accepts\
  \ the connection and then rejects the ping query. Second, a store that never answers at all. A probe\
  \ that caught only connection failures, and threw or returned an error envelope once the ping itself\
  \ failed, would still pass this test. The node does not say whether \"does not answer\" includes a store\
  \ that hangs without replying. That part is left as the node states it and not settled here. The sibling\
  \ test \"reports database: 'ok' when the ping succeeds (MCP call ok)\" uses a store that answers. It\
  \ is outside the fact's condition, so it is not cited.. The node is decided by reading, and a certification\
  \ standing on it from an earlier reconciliation is released by the bind. The remainder is testable:\
  \ Use a pool whose connect() succeeds and whose client query rejects on the health ping. Call health.\
  \ The expected result is a call that does not fail (env.ok true), with result.ok false and database\
  \ \"unreachable\". If \"does not answer\" also covers a store that never replies, the same assertion\
  \ applies to a ping that never settles, driven past the probe's bound with fake timers..\nCertification\
  \ of rules/knowledge-base/summary-counts-tool-calls did not hold: the auditor answered `partial` — The\
  \ test hands the fake pool rows that are already grouped and counted (accepted \"23\", rejected \"2\"\
  ) whenever the SQL contains \"FROM tool_call\" and \"GROUP BY validation_outcome\". It then asserts\
  \ the summary {accepted: 23, rejected: 2, consolidated: 0}. So it does exercise two things: grouped\
  \ rows becoming per-outcome counts, and the zero for one outcome no tool call has (consolidated). It\
  \ does not exercise the counting itself, because the fake answers by substring and never looks at the\
  \ WHERE clause or the count expression. A query that counted another run's tool calls, or counted rows\
  \ other than this run's tool calls, would still get the same canned rows back, and the test would pass.\
  \ The zero half is asserted only for consolidated. toMatchObject ignores any other outcome in the validation-outcome\
  \ vocabulary, so the summary could leave those out or give them a non-zero value and the test would\
  \ still pass. No other test in the file reads a run's summary.. The node is decided by reading, and\
  \ a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: One input against one expected result: an LLM run whose tool calls have known validation\
  \ outcomes, next to a second run whose tool calls must not be counted, read through get_ingestion_status\
  \ against a real query path. The expected result is a summary with the exact count of the first run's\
  \ tool calls for each outcome, and an explicit zero for every other outcome in the validation-outcome\
  \ vocabulary..\nCertification of rules/knowledge-base/recent-ingestions-limit-default did not hold:\
  \ the auditor answered `uncovered` — The only test that bears on the fact is \"returns recent items\
  \ and applies the default limit (10) when omitted\". It calls list_recent_ingestions with no limit,\
  \ and its one assertion about the limit checks that the value 10 reaches the fake pool as the first\
  \ SQL parameter of a query mentioning raw_information (`expect(limitSpy).toHaveBeenCalledWith(10)`).\
  \ That is an assertion about an internal call, so it binds the code's shape and not the fact. It still\
  \ passes if 10 is bound but the query's LIMIT clause is dropped or bound to something else, so the listing\
  \ would no longer hold 10 entries. It fails if the default is moved to another parameter position or\
  \ applied after the fetch, though the listing would still hold 10. The fake pool ignores the parameter\
  \ and returns one row, and the test checks that the listing holds that one row. So nothing in the set\
  \ lists ingestions without a limit against more than ten stored ingestions and counts what comes back.\
  \ How many entries a listing with no limit holds is never observed.. The node is decided by reading,\
  \ and a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: One input, one expected result: with more than ten ingestions stored (say fifteen) and\
  \ a store that honours the query's limit, a list_recent_ingestions call with no limit returns exactly\
  \ ten items..\nCertification of rules/knowledge-base/recent-ingestions-limit-bounds did not hold: the\
  \ auditor answered `partial` — The only limit the set refuses is 999, which is far above the range.\
  \ That test would still pass if the upper bound were 100 or 500, so the bound of 50 is not pinned. No\
  \ test submits 51, and no test submits 50 to show that 50 is accepted. The lower bound is never exercised:\
  \ nothing submits a limit of 0 or below, and nothing submits 1 to show that 1 is accepted. The test\
  \ \"returns recent items and applies the default limit (10) when omitted\" shows only that an omitted\
  \ limit becomes 10. It touches no edge of the 1 to 50 range, so it does not bear on the bounds.. The\
  \ node is decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: Call list_recent_ingestions with a limit of 0 and with a limit\
  \ of 51, and expect each to be refused with VALIDATION_INVALID_FORMAT. Call it with a limit of 1 and\
  \ with a limit of 50, and expect each to be accepted, with that same value reaching the raw_information\
  \ query as its limit parameter..\nCertification of rules/knowledge-base/new-assertion did not hold:\
  \ the auditor answered `partial` — The link half is covered. In \"inserts a new knowledge_link row and\
  \ one provenance row when no vigent exists\", a link proposal meets no current link and the test checks\
  \ three things: the outcome is accepted, exactly one knowledge_link row is inserted, and that row's\
  \ supersedes_link_id is null. That last check is the \"supersedes nothing\" half. The attribute half\
  \ is exercised only partly. In \"accepted (new) — no vigent row\", an attribute proposal meets no current\
  \ attribute, and the test checks only that the outcome is accepted, that one node_attribute row is inserted\
  \ and that one provenance row is written. It never reads the inserted row's supersedes_attribute_id.\
  \ So nothing in the set would fail if an attribute recorded with no current assertion supersedes something.\
  \ Two tests bear on the link half only incidentally, and neither checks supersedes_link_id. \"inserts\
  \ with status='uncertain' when 0.40 <= confidence < 0.75\" is there to assert the status. The first\
  \ call of \"calling proposeLinkService twice with identical args returns accepted then consolidated\
  \ (no dup-guard hit)\" checks the accepted outcome and the single insert on the way to asserting consolidation.\
  \ \"Meets no current assertion\" is set up in every one of these tests by a mock PoolClient.query that\
  \ returns no rows to the SELECT ... FOR UPDATE matched by its SQL text. It is not set up against a real\
  \ store.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: One input against one result. Propose an attribute\
  \ (for example key deadline on a Project node) while no current node_attribute exists for that node\
  \ and key. The test should assert that exactly one node_attribute row is recorded, that its supersedes_attribute_id\
  \ is null, and that no node_attribute row is updated..\nCertification of rules/knowledge-base/consolidation-records-provenance\
  \ did not hold: the auditor answered `partial` — Every proposal in the file cites exactly one fragment,\
  \ [FRAGMENT_ID]. That means \"one provenance for each information fragment it cites\" is only ever checked\
  \ as a count of one. If provenance were recorded only for the first cited fragment, or one row were\
  \ recorded per proposal no matter how many fragments it cites, every test would still pass. The BR-18\
  \ invariant loop asserts only \">= 1\" provenance row, and no test asserts that a recorded provenance's\
  \ fragment_id equals the cited fragment.\n\"On the assertion it lands on\" is asserted only for the\
  \ link re-affirmation branches, where provenance target_id equals EXISTING_LINK_ID. For a link that\
  \ is accepted new, superseded_previous, disputed or a correction, the tests count provenance rows but\
  \ never check that they target the newly inserted row rather than the vigent row that was closed or\
  \ disputed.\nOn the attribute side, the accepted and consolidated tests count one provenance row but\
  \ never check its target_id. The attribute superseded_previous, disputed and correction tests assert\
  \ no provenance at all.\nThe mock-SQL tests \"functional link with different valid_from does NOT auto-consolidate\"\
  , \"does NOT consolidate when change_hint='succession' even on a multi-current link\" and the dup-guard\
  \ race tests are taken proposals too, but they assert nothing about provenance.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Propose a link, and separately an attribute, citing two distinct fragments\
  \ in each branch: accepted new, consolidated, superseded_previous, disputed and correction. Assert exactly\
  \ two provenance rows each time. Their fragment_ids must equal the two cited ids, and their target must\
  \ be the assertion the outcome names: the existing row's id for consolidated, and the newly inserted\
  \ row's id for every other branch..\nCertification of rules/knowledge-base/new-assertion-status-from-confidence\
  \ did not hold: the auditor answered `partial` — Only the knowledge-link half of the fact is exercised\
  \ where a status is actually recorded. A new link proposed at confidence 0.5 is recorded as uncertain,\
  \ and that test is dedicated to it. A new link proposed at 0.9 is recorded as active, but that is checked\
  \ incidentally inside a test whose subject is the accepted-new branch and its provenance row, so nothing\
  \ marks it as load-bearing. The node-attribute half is not exercised at all. No test in the set reads\
  \ the status of a recorded node_attribute: \"accepted (new) — no vigent row\" and the other attribute\
  \ tests check outcome, row counts and supersedes chains, never status. They would still pass if attributes\
  \ were recorded active at 0.5 or uncertain at 0.9. The boundaries 0.75 and 0.40 are checked only against\
  \ the pure routeConfidence function in confidence.spec.ts, never against a recorded link or attribute.\
  \ Those routeConfidence tests prove the classification, not that the recorded assertion gets it, so\
  \ they would keep passing if a proposal service stopped applying it. \"the published constants exactly\
  \ match the spec\" compares exported constants to literals and binds a value, not the recorded status.\
  \ Non-dispute proposals that record a row through succession or correction are never checked for a confidence-derived\
  \ status either: those tests use confidence 0.9 and check only the chain and outcome.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: For node attributes, propose a new attribute at confidence 0.75 and expect\
  \ the recorded node_attribute to be active, then at 0.40 and 0.749999 and expect it to be uncertain.\
  \ For knowledge links, make the same boundary proposals at 0.75 and 0.40 and check the recorded status.\
  \ For a succession or correction proposal at a confidence between 0.40 and 0.75, expect the newly recorded\
  \ row to be uncertain, for links and for attributes..\nCertification of rules/knowledge-base/provenance-accepts-proposed-fragment\
  \ did not hold: the auditor answered `uncovered` — Only one test in the offered file touches fragment\
  \ status: \"promotes the cited fragment proposed -> accepted when provenance is created (§6.6)\". It\
  \ drives one path, proposeLinkService on a new link with no vigent row. It checks that one UPDATE information_fragment\
  \ statement was captured and that the SQL text contains the substrings \"status = 'accepted'\" and \"\
  status = 'proposed'\", bound to [FRAGMENT_ID]. That is a check on the statement the code sends, not\
  \ on a fragment's resulting status. The mock never stores fragment status and answers the UPDATE with\
  \ a row count no matter what the statement says. Two things follow. A statement with SET and WHERE swapped\
  \ (\"SET status = 'proposed' WHERE status = 'accepted'\") would still pass. A correct promotion written\
  \ another way (a CTE inside the provenance INSERT, \"status IN ('proposed')\") would fail. So the test\
  \ pins the shape of the code, not the fact. No fragment in the set is ever proposed and then read back\
  \ as accepted. The other half of the fact is never exercised at all: no fragment in any status other\
  \ than proposed is cited by a recorded provenance and then found unchanged. Several other tests only\
  \ count provenance inserts: the consolidated, superseded_previous, correction and disputed link branches,\
  \ every attribute branch, and the BR-18 loop. None of them looks at fragment status, so the promotion\
  \ is not checked on any recording path except the new-link one.. The node is decided by reading, and\
  \ a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Use a store that holds fragment status, a real database or a fake that applies the UPDATE.\
  \ Case one: record a provenance citing a fragment whose status is proposed, then read the fragment back\
  \ and expect accepted. Case two: for each other fragment status, record a provenance citing a fragment\
  \ in that status, then read it back and expect the status it had before. Run both on every path that\
  \ records a provenance: link and attribute, and each consolidation outcome..\nCertification of rules/knowledge-base/succession-closes-previous\
  \ did not hold: the auditor answered `partial` — Only one path is checked in full: a link proposal on\
  \ a type that allows a single current assertion, with a different target and a fragment that signals\
  \ succession. For that path the tests check the outcome, that the current assertion is closed with status\
  \ 'superseded', and that the new row's supersedes_link_id names the closed one.\nThe change-hint path\
  \ is checked only for links, and only weakly. \"recognizes change_hint='succession' ...\" checks the\
  \ outcome superseded_previous, one UPDATE and one INSERT. It does not check that the UPDATE closes the\
  \ row as 'superseded'. It does not check superseded_link_id, or that the new row's supersedes_link_id\
  \ names the previous assertion. So a hint-driven succession that left the new row unlinked to its predecessor\
  \ would still pass.\nFor node attributes, no test sends change_hint 'succession'. Only the fragment-signal\
  \ path runs, in \"superseded_previous — different value ...\". That test checks the outcome, superseded_attribute_id,\
  \ a valid_to close on node_attribute and the chained supersedes_attribute_id. It never checks that the\
  \ close sets status 'superseded'. So an attribute closed some other way would still pass.\n\"TC-011\
  \ — succession-signal heuristic\" calls the internal __testing__.hasSuccessionSignal directly. That\
  \ binds the helper's shape, not the fact, so it is not cited. The superseded_previous case of the BR-18\
  \ provenance loop checks only that a provenance row exists, so it is not cited either.. The node is\
  \ decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: Three single-input assertions would close it.\nFirst, a node_attribute\
  \ proposal on a key that allows a single current assertion, with a different value, change_hint 'succession'\
  \ and a neutral fragment. Expected: outcome superseded_previous, the current attribute closed with status\
  \ 'superseded', and the inserted attribute's supersedes_attribute_id equal to the closed one's id.\n\
  Second, the existing fragment-signal attribute case, also asserting that the close sets status 'superseded'.\n\
  Third, the existing change_hint 'succession' link case, also asserting that the close sets status 'superseded'\
  \ and that the inserted link's supersedes_link_id equals the previous assertion's id..\nCertification\
  \ of rules/knowledge-base/succession-signal did not hold: the auditor answered `partial` — The node\
  \ names nine markers. Only some of them are tested on their own. \"deixou de\", \"replaced\" and \"\
  substituiu\" each have a fragment whose only marker is that one, so the tests bind them as signals.\
  \ \"passou a\" and \"novo\" show up only together: \"passou a ser o novo líder\" in the heuristic test\
  \ and \"novo prazo: passou a 2026-07-15\" in the attribute succession test. Either one would still pass\
  \ both tests if the other stopped being recognised, so neither is bound alone. Nothing in the set submits\
  \ a fragment containing \"nova\", \"substituido\", \"substituido por\" or \"succeeded\", so recognising\
  \ those four is unexercised. Letter-case insensitivity is tested only for upper-case \"DEIXOU DE\" and\
  \ title-case \"Replaced By\"; it is unexercised for the other seven markers. The only negative input\
  \ is \"completely neutral text\". The integration tests (\"closes vigent ...\", the intra-day succession\
  \ test, the attribute superseded_previous test, and the superseded_previous case of the BR-18 provenance\
  \ loop) check the marker on the way to checking the succession branch. They depend on \"deixou de\"\
  \ or the \"novo\"/\"passou a\" pair as fixtures, and nothing marks the marker itself as the thing under\
  \ test. The node spells \"substituido\" without an accent and does not say whether an accented \"substituído\"\
  \ must also signal. No test touches either spelling, so that question stays open.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Each marker the node lists becomes one input: a fragment whose text contains\
  \ only \"nova\", only \"substituido\", only \"substituido por\", only \"succeeded\", only \"passou a\"\
  , or only \"novo\". Each must signal succession, and must still signal when written in a different letter\
  \ case such as upper case or mixed case. One fragment with none of the markers must not signal. That\
  \ table, over the nine markers the node lists, decides the node completely..\nCertification of rules/knowledge-base/succession-before-previous-start\
  \ did not hold: the auditor answered `partial` — Only the \"on\" half is exercised, and only for a knowledge\
  \ link. The test uses a closing date equal to the closed link's validity start and asserts the outcome\
  \ superseded_previous. That part is behavioural. The other half of the fact is that the closed link\
  \ is left with no validity end, and the test never checks a stored value for it. It checks that the\
  \ issued UPDATE text contains \"CASE\", \"valid_from >=\", \"THEN valid_to\", \"superseded_at\" and\
  \ \"THEN now()\", and it checks the bound close date. The mock client runs no SQL, so these checks follow\
  \ the wording of the statement, not what it does. A rewrite that keeps those words but writes a validity\
  \ end would pass. A rewrite that drops the words but correctly leaves the end empty would fail. In the\
  \ same test, nothing checks that the closed link becomes superseded or that the new row's supersedes_link_id\
  \ points to it. Three cases are not tested at all. Nothing uses a closing date strictly before the closed\
  \ assertion's validity start, so the \"before\" half goes unexercised. Nothing runs this succession\
  \ on a node attribute, which the node also constrains. The attribute \"superseded_previous\" test uses\
  \ a closing date after the start.. The node is decided by reading, and a certification standing on it\
  \ from an earlier reconciliation is released by the bind. The remainder is testable: Run each case against\
  \ a store that actually applies the close: a vigent functional link and a vigent functional attribute,\
  \ each succeeded once with a closing date equal to its validity start and once with a closing date before\
  \ it. In every case the expected result has three parts. The closed row is superseded. Its valid_to\
  \ is still null. The new row's supersedes_link_id or supersedes_attribute_id names the closed row..\n\
  Certification of rules/knowledge-base/succession-closing-date did not hold: the auditor answered `partial`\
  \ — Only one test checks the closing date's value. The intra-day test asserts that the close binds 2026-06-01,\
  \ the new assertion's validity start. But in that fixture the closed assertion also starts on 2026-06-01,\
  \ so code that took the close date from the closed assertion would pass the same way. In that same case\
  \ the guarded UPDATE also leaves valid_to unwritten, so the test never sees a validity end actually\
  \ applied. The ordinary link succession (closed assertion starting 2026-01-01, new one 2026-06-01) and\
  \ the attribute succession (2026-01-10 vs 2026-06-10) check only that the UPDATE's SQL text contains\
  \ \"valid_to\". That ties the test to the query's wording, not to the date the closed assertion ends\
  \ on, so a close at the wrong date would still pass. The second half of the fact is not tested at all:\
  \ no test in the file submits a succession whose new assertion has no validity start. So closing at\
  \ today, the injected now() of 2026-06-12, is never checked for links or for attributes.. The node is\
  \ decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: Two tests would close it, each run once for a link and once\
  \ for an attribute. First, a succession whose new assertion starts on a date after the closed assertion's\
  \ start, for example closed starting 2026-01-01 and new starting 2026-06-01, against the closed assertion\
  \ getting exactly 2026-06-01 as its validity end. Second, a succession whose new assertion has no validity\
  \ start, with now() fixed at 2026-06-12, against the closed assertion getting 2026-06-12 as its validity\
  \ end..\nCertification of rules/knowledge-base/conflict-disputes did not hold: the auditor answered\
  \ `partial` — Two tests cover the second half of the fact, one for links and one for attributes. In\
  \ both, a proposal for a type that allows only one current assertion meets a current assertion with\
  \ no signal. Both tests check that exactly one new assertion is recorded, that its status is 'disputed',\
  \ and that its supersedes reference is null. That holds for the functional link type \"leads\" and for\
  \ the functional attribute key \"deadline\".\nThe first half is not covered: nothing checks that the\
  \ current assertion the proposal met is the one marked disputed. Both tests count one UPDATE and check\
  \ that its SQL text contains the literal 'disputed'. Neither checks that the UPDATE is bound to the\
  \ met assertion (EXISTING_LINK_ID or EXISTING_ATTR_ID), or that the assertion's status afterwards is\
  \ disputed. Two wrong behaviours would still pass: an UPDATE that marks some other row, and an UPDATE\
  \ whose SQL only mentions 'disputed' in a WHERE clause. Both tests would fail only if the SQL stopped\
  \ containing that word.\nThe third test, \"functional link with different valid_from does NOT auto-consolidate\"\
  , touches the fact only in passing. Its purpose is to show that branch (a) still requires the same valid_from.\
  \ Along the way it checks the 'disputed' outcome and one insert. It does not check the new row's status,\
  \ its supersedes reference, or the marking of the existing row.\nThe name \"flags both old and new row\
  \ as disputed and surfaces conflicting_link_id\" claims more than the test checks. No assertion reads\
  \ conflicting_link_id.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: The test that would close it: propose\
  \ an assertion against a current assertion of a functional link type, and the same for a functional\
  \ attribute key, with the proposal meeting it as a dispute. The expected result is that the existing\
  \ assertion, identified by its own id, ends up with status 'disputed'. Check this by asserting that\
  \ the status-setting UPDATE is bound to that id, or by reading the assertion back. Keep the existing\
  \ check that the one new assertion has status 'disputed' and supersedes nothing..\nCertification of\
  \ rules/knowledge-base/correction-replaces did not hold: the auditor answered `partial` — Both correction\
  \ tests, one for a link and one for an attribute, check two parts of the fact. The new assertion names\
  \ the met one in supersedes_link_id or supersedes_attribute_id. The returned superseded id is the met\
  \ assertion's. Three parts are left unexercised or only loosely bound. (1) Every correction proposal\
  \ in the set also carries errata text in its cited fragment (\"errata: ...\"). Nothing submits change_hint='correction'\
  \ over neutral text. If the code needed a textual errata marker as well as the hint, these tests would\
  \ still pass, even though the fact makes the change hint enough on its own. (2) The tests check that\
  \ the met assertion was superseded and that its validity end was left alone only by matching tokens\
  \ in the captured UPDATE text: it contains 'superseded' and superseded_at, and does not contain valid_to.\
  \ The UPDATE's bindings are never checked against the met assertion's id, so an UPDATE that superseded\
  \ the wrong row would pass. The checks are also tied to how the SQL is written. A correct statement\
  \ whose WHERE clause mentions valid_to, or one that binds the status as a parameter, would fail them\
  \ while the behavior stays right. (3) Only functional types (leads, deadline) are corrected, each with\
  \ a different target or value over the same period. Nothing corrects an assertion of a multi-valued\
  \ type, which the fact also covers. The provenance-invariant test for the correction branch only checks\
  \ that a provenance row exists. It touches this fact incidentally and proves none of it.. The node is\
  \ decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: The input is a proposal with change_hint='correction' whose\
  \ cited fragment text is neutral, against a current assertion, run once for a link and once for an attribute,\
  \ including a multi-valued type. The expected result has three parts. The met assertion's row, picked\
  \ out by its id in the UPDATE bindings or by reading it back, ends with status 'superseded'. Its valid_to\
  \ keeps the value it had before. One new assertion is recorded whose supersedes_link_id or supersedes_attribute_id\
  \ equals the met assertion's id..\nCertification of rules/knowledge-base/link-permitted-by-type-rule\
  \ did not hold: the auditor answered `partial` — The tests check that a link is permitted by matching\
  \ link type, source node type and target node type, and they check refusal through validateGraphRule.\
  \ Project participates_in Project is refused while only Person->Project is permitted, so the source\
  \ type is checked. Document concerns Person is refused while concerns has rules to other targets, so\
  \ the target type is checked. The same Document->Person pair is permitted under delivered_to, so the\
  \ link type is checked. Every rule given to validateGraphRule has valid_from and valid_to null. The\
  \ tests never check the \"in effect today\" part of the fact on a proposal. The expired-rule and not-yet-effective\
  \ tests assert only the return value of isLinkRuleActive, and none of them shows that validateGraphRule\
  \ or the proposal handler refuses a link whose only matching rule has expired or has not yet started.\
  \ If validateGraphRule ignored rule dates, all of these tests would still pass. No test permits a link\
  \ under a rule whose dated interval contains today. The validation-order test is the only one that reaches\
  \ a link proposal (proposeLinkHandler), and its refusal is incidental. It asserts that the graph-rule\
  \ layer fires before the temporal layer, using a catalog with no rules at all. It would change if the\
  \ layer order changed, and nothing marks the permission check in it as load-bearing.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Give validateGraphRule (or proposeLinkHandler) a triple whose only matching\
  \ rule has valid_to at or before today, and expect BUSINESS_LINK_RULE_VIOLATION. Do the same for a rule\
  \ whose valid_from is after today, with the same expected result. Then give it a rule whose interval\
  \ [valid_from, valid_to) contains today, and expect the link to be permitted..\nCertification of rules/knowledge-base/link-type-rule-in-effect\
  \ did not hold: the auditor answered `partial` — The proof checks three things. A rule with no validity\
  \ start and no validity end is in effect. A rule whose validity end falls on the day is not in effect,\
  \ which pins the strict \"day < valid_to\" boundary. A rule whose validity start is after the day is\
  \ not in effect. The Tier 1 tests also only use rules with neither bound, so they add nothing beyond\
  \ the first case. Several parts of the fact are never exercised. No rule has a validity start on or\
  \ before the day, so nothing checks that such a rule is in effect. The \"valid_from <= day\" boundary,\
  \ where the start equals the day, is not tested. An implementation that treated any present validity\
  \ start as \"not yet in effect\" would pass. No rule has a validity end after the day, so nothing checks\
  \ that a rule with a future end is still in effect. An implementation that treated any present validity\
  \ end as expired would pass. Nothing checks that \"day\" is the UTC calendar date: the day falls at\
  \ 12:00Z and every bound at 00:00Z, so comparing raw timestamps instead of UTC dates gives the same\
  \ results in every test.. The node is decided by reading, and a certification standing on it from an\
  \ earlier reconciliation is released by the bind. The remainder is testable: Each gap is one input against\
  \ one expected result, using isLinkRuleActive on a snapshot with a single rule. A rule whose validity\
  \ start equals the day should be in effect. A rule whose validity start is before the day should be\
  \ in effect. A rule whose validity end is after the day should be in effect. A rule with both bounds\
  \ around the day should be in effect. One more input catches timestamp comparison: a moment whose clock\
  \ time is earlier than a validity start set later on the same UTC date should still count as in effect..\n\
  Certification of rules/knowledge-base/directed-turn-is-original-input did not hold: the auditor answered\
  \ `partial` — The recording half is exercised. In (c), ingestRawInformation is given an original_input,\
  \ and the test checks that this value goes into the raw_information INSERT through a recording client.\
  \ In (d), the repository's INSERT parameters carry the value, and the row it returns reads it back.\
  \ However, (d)'s regexes over the SQL text only check how the SQL is written, not what gets stored.\n\
  The directed-ingestion-from-a-chat-turn half is exercised only through internal calls. (a) stubs the\
  \ orchestrator and checks the key in the deps object it receives (deps.sourceExcerpt). (g) stubs ingestRaw,\
  \ makes it throw right after intake, and checks the argument it was called with. Each of these binds\
  \ one seam's naming rather than the fact. Renaming a key on both sides breaks them while the behavior\
  \ stays correct. A break between the seams passes them all. Nothing in the set starts at a chat turn.\
  \ So the step where the turn's own excerpt becomes invocation_context.source_excerpt is never exercised.\
  \ Also, no test runs one directed ingestion end to end, from the turn to the raw information it creates,\
  \ and reads that raw information's original input back.\nThe tests about absence and hashing do not\
  \ bear on this fact. These are (b), (b'), (c'), (c''), (e), (e'), (g'), (c.regression) and (f). The\
  \ node says nothing about ingestions that do not come from a chat turn, or about content_hash.. The\
  \ node is decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: One input against one expected result. The input is a chat\
  \ turn whose text is X, which leads to a directed ingestion. The expected result is that the raw information\
  \ this ingestion created, read back, has original input equal to the turn's excerpt X. The test must\
  \ use no stub between the turn and the persisted raw information..\nCertified rules/knowledge-base/content-hash-is-sha256\
  \ as decided by step `test`: src/__tests__/unit/ingestion/hash.spec.ts (sha256Hex > returns 64 lowercase\
  \ hex characters); src/__tests__/unit/ingestion/hash.spec.ts (sha256Hex > matches the canonical sha256\
  \ of UTF-8 bytes); src/__tests__/unit/ingestion/original-input-capture.spec.ts (ingestRawInformation\
  \ — original_input pass-through (TC-01) > (c.regression) content_hash is sha256(content) — original_input\
  \ does NOT participate) would fail if the fact stopped holding.\nCertification of rules/knowledge-base/idempotency-key\
  \ did not hold: the auditor answered `partial` — The SHA-256 digest, the 64 lowercase hexadecimal characters\
  \ and the joining without a separator are all exercised, but only through composeIdempotencyKey called\
  \ with operands the test picks itself. Two parts of the fact go unexercised. First, the order is only\
  \ partly pinned. Every reference-digest test gives the prompt version and the chunking version the same\
  \ value (\"v1\"), and the only swap test exchanges the model and the prompt version. An implementation\
  \ that joined the content hash, the chunking version, the model and the prompt version, in that order,\
  \ would pass every test in the set. Second, nothing ties the key to an LLM run. No test creates a run\
  \ and reads back its key, so a run keyed by anything other than the digest of its own raw information's\
  \ content hash, prompt version, model and chunking version would fail none of these tests. The tests\
  \ \"yields a different key when any single operand changes\", \"is deterministic across calls\", the\
  \ three \"bumping ... changes the key\" tests and \"is deterministic\" only assert that the key differs\
  \ or repeats, so they would still pass if the formula were wrong.. The node is decided by reading, and\
  \ a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Two assertions would close it. The first gives a content hash, a prompt version, a model\
  \ and a chunking version that are all different from one another, and expects sha256(content_hash +\
  \ prompt_version + model + chunking_version) as lowercase hex. The second creates an LLM run over a\
  \ raw information with a known content hash, prompt version, model and chunking version, and expects\
  \ the run's idempotency key to equal that same digest..\nCertification of rules/knowledge-base/strong-candidate-resolves\
  \ did not hold: the auditor answered `partial` — Exercised: a proposal with no exact alias and one candidate\
  \ well above 0.85 (0.92 / 0.95), with the only other candidate well below 0.55 (0.3), resolves as matched-existing\
  \ to that candidate with no node created. A second candidate at 0.6 stops the match. Unexercised: the\
  \ inclusive bounds the fact states. Nothing in the set offers a candidate at exactly 0.85, or a second\
  \ candidate at exactly 0.55 or just under it. So \"at least 0.85\" and \"reaches 0.55\" are never pinned\
  \ against a strict comparison, and moving either boundary would leave every test passing. Also unexercised:\
  \ \"active\" and \"of its node type\". The stub client in buildClient returns its canned candidate rows\
  \ whatever the SQL filters, so nothing shows that an inactive node, or a node of another type, is left\
  \ out as the match and cannot block it. The test \"exports MATCH_STRONG = 0.85 and MATCH_FLOOR = 0.55\"\
  \ is not cited. It checks the values of the exported constants, not how they are compared or whether\
  \ resolution uses them. It still passes if the comparison changes from >= to >, so it binds the code's\
  \ shape rather than the fact.. The node is decided by reading, and a certification standing on it from\
  \ an earlier reconciliation is released by the bind. The remainder is testable: Four input-against-result\
  \ assertions close it, each with no exact alias. (1) A single candidate at exactly 0.85 resolves as\
  \ matched-existing to that node. (2) A strong candidate plus a second active node of the same type at\
  \ exactly 0.55 does not resolve as matched-existing. (3) Against a database: a strong active node of\
  \ the proposal's type plus an inactive (merged or deleted) node of that type at 0.55 or above still\
  \ resolves as matched-existing to the active node. (4) Against a database: a node of a different type\
  \ at 0.85 or above is not matched, and a same-type node is not blocked by a different-type node at 0.55\
  \ or above..\nCertification of rules/knowledge-base/no-candidate-creates-active-node did not hold: the\
  \ auditor answered `partial` — The tests exercise one part of the fact: when no candidate comes back,\
  \ or only candidates well below the threshold (0.3, 0.4), the proposal resolves as created_new and the\
  \ insert is recorded as 'active'. Three stated parts go unexercised. (1) The 0.55 threshold itself.\
  \ Every below-floor input is 0.4 or less and every above-floor input is 0.6 or more. A comparison at\
  \ 0.5, or one that treats exactly 0.55 as not reaching, passes every test. The test \"exports MATCH_STRONG\
  \ = 0.85 and MATCH_FLOOR = 0.55\" checks only the exported constant's value, not where the code uses\
  \ it, so it cannot fail when the boundary behaves wrongly. (2) \"active knowledge node of its node type\"\
  . The stub routes on SQL text and returns its canned candidates whatever the WHERE clause says. No test\
  \ supplies a candidate at 0.55 or above that belongs to another node type or is not active, and expects\
  \ created_new. The code could drop the node-type or active-status filter and every test would still\
  \ pass. (3) \"creates an active knowledge node\". The stub reads the status from a literal in the INSERT\
  \ text and falls back to \"active\" when it finds none (`statusMatch?.[1] ?? \"active\"`). If the novel\
  \ path passed its status as a bind parameter, or left it out, the stub would still report 'active'.\
  \ So the 'active' half is bound to how the SQL is written rather than to the status the database stores..\
  \ The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: Each part is one input against one result, read\
  \ back from a real store rather than from SQL text. First, one active node of the proposal's node type\
  \ at 0.54 gives created_new with the new node stored as active. Second, the same node at exactly 0.55\
  \ does not give created_new. Third, a node at 0.55 or above that is either of another node type or not\
  \ active gives created_new with the new node stored as active..\nCertification of rules/knowledge-base/exact-alias-resolves\
  \ did not hold: the auditor answered `partial` — Both tests check the consequence. When the exact-match\
  \ read returns a node, the resolution is matched_existing, that node is the result, and no knowledge_node\
  \ is inserted. They do not check the condition that makes a proposal resolve. The stub client answers\
  \ any SQL that starts with \"SELECT na.node_id\" and contains \"alias_norm = norm(\" with a fixed row,\
  \ and it ignores the parameters and the rest of the WHERE clause. So nothing in the set checks that\
  \ the proposal's name has to equal the alias. Nothing checks that the aliased node has to be active:\
  \ no merged, deleted or needs_review node holding an equal alias is ever offered. Nothing checks that\
  \ the node has to be of the proposal's node type either: no node of another type holding an equal alias\
  \ is ever offered. Every test also uses a single node type, Person. The tests would still pass if the\
  \ query stopped filtering on status or node type, or compared something other than the proposal's name.\
  \ One more point: the branch 1 test also asserts that no trigram query was issued and checks the exact\
  \ node_alias insert rows. Those are assertions on internal calls and on alias bookkeeping, and the fact\
  \ does not state them.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: Each part is one input against\
  \ one expected result, run against a real node_alias and knowledge_node store rather than a stub that\
  \ matches on the SQL's text. First, a proposal whose name equals an alias of an active node of the same\
  \ type resolves to that node as matched_existing. Second, the same proposal against an equal alias held\
  \ only by a node that is not active does not resolve to it as matched_existing. Third, the same proposal\
  \ against an equal alias held only by an active node of a different node type does not resolve to it\
  \ as matched_existing..\nCertification of rules/knowledge-base/matched-node-gains-only-aliases did not\
  \ hold: the auditor answered `partial` — Only the exact-alias match exercises the fact. In branch 1\
  \ a proposal named \"Ada Lovelace\" with the single alias \"Augusta Ada King\" resolves to an existing\
  \ node. The test then checks that the node_alias writes equal exactly one row, that alias on the matched\
  \ node. So it would fail if the proposed name were added or if the alias were dropped. Three parts of\
  \ the fact go unexercised. (1) \"Each of its proposed aliases\": the only matched case proposes one\
  \ alias, so an implementation that added only the first alias, or only one of several, still passes.\
  \ (2) The trigram strong-unique match also resolves to an existing node. Branch 2 proposes no aliases\
  \ and makes no assertion on the node_alias writes, so neither half of the fact is checked there. If\
  \ that path added the proposed name to the matched node, branch 2 would still pass. (3) The proposeNodeService\
  \ matched_existing test proposes no aliases and makes no assertion on alias writes. It shows only that\
  \ the match is passed through, not that the matched node gains aliases and never the name. The alias\
  \ rows are read off a fake pg client that matches on SQL text (\"INSERT INTO node_alias\") and reads\
  \ the kind from a literal in that text. The writes it observes are persistence effects, but the test\
  \ is tied to that SQL shape.. The node is decided by reading, and a certification standing on it from\
  \ an earlier reconciliation is released by the bind. The remainder is testable: Two inputs, each against\
  \ one expected result. First, a proposal with two or more aliases and a name that differs from every\
  \ alias, resolved by exact alias match to an existing node. Expected: node_alias rows for that node\
  \ equal exactly the proposed aliases, one row each, with no row for the proposed name. Second, the same\
  \ proposal resolved by trigram strong-unique match (one candidate at or above MATCH_STRONG, none other\
  \ at or above MATCH_FLOOR). Expected: the same set of rows on the matched node, and no row for the proposed\
  \ name..\nCertification of rules/knowledge-base/new-node-aliases did not hold: the auditor answered\
  \ `partial` — Both named tests check the aliases only as a side assertion. Each test is mainly about\
  \ something else: the review rows in branch 3, and the created_new resolution with status='active' in\
  \ branch 4. Nothing marks the alias assertion as the main point of either test. Each test proposes exactly\
  \ one alias. So \"each of its proposed aliases\" is never exercised with more than one: code that stored\
  \ only the first proposed alias would pass both. The tests also never read back what the new node holds.\
  \ They record the INSERT INTO node_alias statements sent to an in-memory stub. The stub reads the alias\
  \ kind from the SQL literal with a regex, and when the regex does not match it falls back to \"alias\"\
  . The stub does not model ON CONFLICT DO NOTHING. As a result the tests break if the SQL is rewritten\
  \ without any change in behavior. They still pass if a statement in the expected shape leaves the node\
  \ without the alias it should hold. Two other tests create a new node without checking its aliases:\
  \ \"branch 4: novel with empty candidate set -> created_new (status='active')\" and \"created_new resolution\
  \ propagates as ok:true with resolution='created_new'\". Neither one asserts that the proposed name\
  \ is held as the canonical alias.. The node is decided by reading, and a certification standing on it\
  \ from an earlier reconciliation is released by the bind. The remainder is testable: Input: propose\
  \ a name with no matching candidate, plus two or more distinct aliases. Expected result: the newly created\
  \ node holds exactly the proposed name with kind canonical, and holds every proposed alias with kind\
  \ alias. Read this back from what the node holds, not from the shape of the emitted SQL, in a test whose\
  \ own subject is this fact..\nCertification of rules/knowledge-base/below-confidence-floor-records-nothing\
  \ did not hold: the auditor answered `partial` — The proof covers only the classification. routeConfidence\
  \ returns kind 'below_floor' for 0, 0.39 and 0.399999, and it does not do so at 0.40. Those tests would\
  \ fail if the floor moved. The node's fact is a different thing: a proposal below 0.40 records no knowledge\
  \ link or node attribute. Nothing in the set submits a link proposal or an attribute proposal with confidence\
  \ below 0.40 and then checks that nothing was persisted. A handler could ignore 'below_floor' and still\
  \ write the knowledge_link or node_attribute row, and every test here would still pass. The link half\
  \ and the attribute half are both unexercised. The test \"the published constants exactly match the\
  \ spec\" compares CONFIDENCE_FLOOR to the literal 0.4. That pins a constant, not the behavior: it would\
  \ not fail if the routing or the persistence ignored the constant. So it is not cited as bearing on\
  \ the fact.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: Two inputs, one expected result each. First, a\
  \ link proposal with confidence 0.39 inside a valid run, with valid provenance: the expected result\
  \ is that no knowledge_link row is recorded for it. Second, an attribute proposal with confidence 0.39\
  \ under the same conditions: the expected result is that no node_attribute row is recorded for it..\n\
  Certification of rules/knowledge-base/affected-nodes-of-a-run did not hold: the auditor answered `partial`\
  \ — The proof checks that nodes reached by node proposals are included. It checks that both ends of\
  \ a link proposal are included when the link was accepted or consolidated. It checks that the described\
  \ node of an attribute proposal is included when the attribute was accepted, consolidated or disputed.\
  \ It checks that rejected and ok:false proposals add nothing. It checks that each node appears once,\
  \ in the order it was first reached. The fact also counts proposals that superseded a previous assertion,\
  \ and nothing in the set records a link or attribute proposal with that outcome. The fact also counts\
  \ disputed link proposals, and nothing in the set records a link proposal whose outcome is disputed.\
  \ So the collector could drop the superseded outcome for both kinds, or the disputed outcome for links,\
  \ and every offered test would still pass. The file also asserts several things the node does not state.\
  \ Examples are the LRU cache capacity and recency, the single knowledge_node JOIN node_type query, swapping\
  \ in the survivor through merged_into_node_id, and skipping ids the lookup does not find. These are\
  \ facts beyond this node and do not close the gap above.. The node is decided by reading, and a certification\
  \ standing on it from an earlier reconciliation is released by the bind. The remainder is testable:\
  \ Three single-input assertions would close it. First, record a propose_link proposal whose outcome\
  \ superseded a previous assertion and expect both its source and target node ids in the affected list.\
  \ Second, record a propose_link proposal whose outcome is disputed and expect both its source and target\
  \ node ids in the list. Third, record a propose_attribute proposal whose outcome superseded a previous\
  \ assertion and expect its node id in the list..\nCertification of domain/knowledge-base/ingest-tool\
  \ did not hold: the auditor answered `partial` — The test checks the full value set as it is published.\
  \ It asserts that the keys of IngestToolInputJsonSchemas are exactly propose_attribute, propose_fragment,\
  \ propose_link and propose_node. If one of those values is added, dropped or renamed in that export\
  \ map, the test fails. It does not check what the node actually states, which is that these values are\
  \ the kind of proposal a tool call records. Nothing in the offered proof makes a tool call or reads\
  \ back a recorded tool call. A recording that stored some other kind, or a fifth kind, or no kind at\
  \ all, would still pass. The other five tests in the file compare each tool's input JSON Schema to its\
  \ Zod DTO and check that each schema's top-level type is object. They cover input shape, not this enumeration,\
  \ so they bear on nothing here.. The node is decided by reading, and a certification standing on it\
  \ from an earlier reconciliation is released by the bind. The remainder is testable: Make one call to\
  \ each of the four propose tools inside a run, then read back the recorded tool call. For each call,\
  \ the recorded kind must be propose_fragment, propose_node, propose_link or propose_attribute, matching\
  \ the tool that was invoked. A test over those four inputs and four expected results covers the whole\
  \ enumeration..\nCertification of rules/knowledge-base/refused-proposal-records-only-its-tool-call did\
  \ not hold: the auditor answered `partial` — The test sends one propose_fragment proposal and refuses\
  \ it at the chunk lookup, which the mock answers with a count of zero. It checks that the first transaction\
  \ rolled back with no commit, and that exactly one tool_call row was written with outcome 'rejected',\
  \ tool name propose_fragment and the run id. That covers the half of the fact that says the tool call\
  \ is recorded. The half that says nothing else is recorded is mostly not checked. The mock only captures\
  \ INSERT INTO tool_call. Every other statement is answered silently with an empty result and never inspected.\
  \ So a fragment, provenance or other business row written in the committed audit transaction, or in\
  \ any transaction after the first, would not fail the test. The refusal is also triggered at a lookup,\
  \ before any business write is attempted. That means the rollback check has nothing to undo, and the\
  \ test never shows that a write made before the refusal stays unrecorded. Only one kind of proposal\
  \ (propose_fragment) and one refusal are covered. A proposal that fails with a system error rather than\
  \ a validation refusal is never run. The other proposal tools are never refused here.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Refuse a proposal after its business write has been issued, once for each\
  \ proposal tool, and also make one fail with a system error. Capture every write statement across all\
  \ transactions. The expected result is that the only committed write is the single tool_call row with\
  \ the refused or failed outcome, and that no row other than tool_call was committed..\nCertification\
  \ of domain/knowledge-base/prompt-version did not hold: the auditor answered `partial` — The membership\
  \ half of the enumeration is tested. Each of v1, v2, v3 and v4 is dispatched and resolves to a module\
  \ carrying that version, so dropping any of the four values would fail a named test. The closed half\
  \ is only tested against two outside values, \"v99\" and \"extraction.v1\", and both are refused. No\
  \ test reads the whole set of versions an extraction can run under. A fifth version added beside the\
  \ four would leave every named test passing, so the claim that the versions are exactly v1, v2, v3 and\
  \ v4 is not tested. One test asserts more than this node states. \"recommends v4 for new runs (DEFAULT_PROMPT_VERSION\
  \ === 'v4')\" in extraction-prompt-v4.spec.ts asserts which version is the default. That fact belongs\
  \ to no value of this enumeration, so it is not counted as coverage here.. The node is decided by reading,\
  \ and a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: One assertion would close it: read the full set of versions the registry accepts and\
  \ compare it with exactly {v1, v2, v3, v4}. The test fails if a value is added or one is removed..\n\
  Certification of rules/knowledge-base/prompt-version-known did not hold: the auditor answered `partial`\
  \ — The tests check the prompt registry, not an extraction. selectPromptModule throws UnknownPromptVersionError\
  \ for \"extraction.v1\" and \"v99\", and it resolves v1, v2, v3, v4 and the default to their modules.\
  \ So the registry refuses a version it does not hold. The node states the fact about an extraction (the\
  \ LLMRun it constrains), and nothing in the offered tests starts an extraction or records an LLMRun\
  \ with a prompt_version the system does not hold. If the extraction path stopped calling the registry,\
  \ caught its error, fell back to a default, or recorded the run before refusing, both files would still\
  \ pass. That an extraction carrying an unknown prompt version is refused is not exercised. Every other\
  \ test in the two files asserts prompt text, MAX_TOKENS or user-block content and does not bear on this\
  \ fact.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: One input against one expected result. Start an\
  \ extraction (create the LLMRun / run ingest_document) with a prompt_version the system does not hold,\
  \ for example \"v99\", and expect it to be refused, with no LLMRun recorded under that version and no\
  \ extraction performed. Starting the same extraction with a held version, for example \"v4\", should\
  \ be accepted and record that version..\nCertification of rules/knowledge-base/default-prompt-version\
  \ did not hold: the auditor answered `partial` — The offered proof checks two things. The registry's\
  \ exported DEFAULT_PROMPT_VERSION constant equals \"v4\", and selectPromptModule(\"v4\") returns the\
  \ v4 module. Neither test starts a document ingestion. Nothing in the file submits an ingestion that\
  \ names no prompt version and then looks at the version the run used. So the fact as the node states\
  \ it, that such an ingestion runs under v4, is not exercised. Suppose the ingestion path stopped reading\
  \ DEFAULT_PROMPT_VERSION when no version is given, for example by falling back to a hardcoded \"v3\"\
  \ or by refusing the request. Both tests would still pass. The constant's value is only what the default\
  \ would be if the ingestion path used it. The tests do not show that the ingestion path uses it. The\
  \ file's other tests check v4's prompt content, its MAX_TOKENS parity, and that v1, v2 and v3 are still\
  \ registered. None of them bears on which version an ingestion without a version runs under.. The node\
  \ is decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: One input: a document ingestion request that names no prompt\
  \ version. One expected result: the run it creates (its llm_run.prompt_version) records \"v4\", and\
  \ the prompt sent for extraction is the v4 system prompt..\nCertification of rules/knowledge-base/extraction-reads-chunks-in-order\
  \ did not hold: the auditor answered `partial` — Only one part of the fact is exercised: the prompt\
  \ for a single chunk carries the reception time and a document date. The test checks that the metadata\
  \ block contains \"- received_at: 2026-06-26T12:00:00Z\" and \"- document_date: (unknown)\". That happens\
  \ on the way to its real purpose, which is to show that the v4 directive has a line to point at. Nothing\
  \ in the offered proof runs an extraction across a raw information's chunks. So these parts go unexercised:\
  \ reading the chunks one at a time, reading them in index order, a known document date appearing in\
  \ the prompt, the source's type appearing in the prompt, and the title appearing in the prompt. The\
  \ test passes source_type \"ata\" and title null but never asserts either one in the output. It also\
  \ passes prevTail as an empty string, so no test checks that the model sees the previous chunk's text,\
  \ or that only its last 200 characters are shown. The other tests in the file check the system-prompt\
  \ wording and the prompt registry, and none of them bears on this fact.. The node is decided by reading,\
  \ and a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Input: a raw information with a known source type, document date, title and reception\
  \ time. It holds at least three chunks stored out of index order, and the chunk before at least one\
  \ of them is longer than 200 characters. Run an extraction over it. Expected result: one model call\
  \ per chunk, in ascending index order. Each call shows that chunk's text with the source's type, document\
  \ date, title and reception time. Each call after the first also shows exactly the last 200 characters\
  \ of the previous chunk by index, and nothing earlier than those 200 characters..\nCertification of\
  \ rules/knowledge-base/chunking-version did not hold: the auditor answered `partial` — The test only\
  \ checks that each chunk chunkV1 emits carries a chunking_version equal to the imported constant CHUNKING_VERSION.\
  \ It never compares it to the literal 'v1'. If the version stopped being v1, the constant and the chunker\
  \ would change together and the test would still pass, so the \"that version is v1\" half of the fact\
  \ goes unexercised. The test is also weaker than its name says. It never asserts that \"conteúdo simples\"\
  \ produces any chunk, so the loop passes on an empty result. It exercises only the chunker's output\
  \ for one source type, \"ata\". It never touches a persisted raw chunk, so nothing in the offered proof\
  \ shows that every raw chunk records the version once stored.. The node is decided by reading, and a\
  \ certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Two checks would close it, both comparing to the literal 'v1' rather than the constant.\
  \ First, chunk a non-empty input, assert at least one chunk came back, and assert every chunk's chunking_version\
  \ is 'v1'. Second, ingest a document and read its stored raw chunks back, asserting each one records\
  \ chunking_version 'v1'..\nCertification of rules/knowledge-base/chunk-excerpt-is-verbatim did not hold:\
  \ the auditor answered `partial` — Only one test compares each chunk's text with the content between\
  \ its offset_start and offset_end: the verbatim-slice test. It does this for one input, a `pdf` split\
  \ on form-feed. The emoji test and the length-1 test check the fact only for a single chunk spanning\
  \ the whole content, and only as a side effect of checking offsets. Several other tests check text or\
  \ offsets, but none checks both against each other. The pdf form-feed split test and the `ata`/`artigo`/`outro`\
  \ test check text but not offsets. The `email`, `chat` and `transcricao` tests check text with contains/startsWith\
  \ and never read the offsets. The BR-07 oversize test checks only offset widths and their sum, never\
  \ text. So if the email header/body split, the chat or transcript turn splits, or the sentence-level\
  \ oversize fallback put the wrong content in a chunk for its offsets, every test in the file would still\
  \ pass. The `reconstruct` helper inside the verbatim-slice test is never called and asserts nothing.\
  \ All the tests call chunkV1 directly. None checks a raw chunk after it is stored, so the fact for a\
  \ persisted raw chunk is not exercised by the offered proof.. The node is decided by reading, and a\
  \ certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: For each of these inputs, assert that every emitted chunk's text equals the original\
  \ content's code-point slice between that chunk's offset_start and offset_end: an `email` with headers\
  \ and a body, a multi-speaker `chat`, a timestamped `transcricao`, and an `ata` above CHUNK_HARD_MAX\
  \ that goes through the sentence-level fallback. For a persisted raw chunk, run the same assertion on\
  \ the raw chunk as stored against its raw information's content..\nCertification of rules/knowledge-base/pdf-blocks-at-form-feeds\
  \ did not hold: the auditor answered `partial` — Two parts of the fact are exercised. First, a pdf's\
  \ content is cut into blocks at every form feed. Second, the form feed belongs to no block. \"`pdf`:\
  \ splits on form-feed (U+000C)\" checks that \"página 1\\fpágina 2\\fpágina 3\" gives exactly three\
  \ blocks with texts \"página 1\", \"página 2\" and \"página 3\", none of them holding the form feed.\
  \ \"returns chunks ordered by chunk_index ascending\" checks that \"A\\fB\\fC\\fD\" gives texts [\"\
  A\",\"B\",\"C\",\"D\"].\n\n\"text field is the verbatim slice between offset_start and offset_end\"\
  \ checks that each block's text matches the original between its offsets. Because of that, a block whose\
  \ span took in its form feed would fail there too. The helper `reconstruct` in that test asserts nothing:\
  \ it is defined, voided and never called.\n\nIn \"is deterministic for a multi-block PDF input\", the\
  \ block count of three comes along incidentally on the way to the determinism assertion.\n\nThe third\
  \ part of the fact is unexercised. That an empty span between two form feeds forms no block is never\
  \ tested. Every pdf input in the set has a non-empty span between each pair of form feeds. No input\
  \ holds two form feeds in a row, so an implementation that emitted an empty block there would pass every\
  \ test in the set.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: One input against one expected\
  \ result would close it. Take pdf content with two form feeds in a row, such as \"página 1\\f\\fpágina\
  \ 2\". The expected result is exactly two blocks, with texts \"página 1\" and \"página 2\" and chunk_index\
  \ [0, 1]. No block may have an empty text or a zero-width offset span..\nCertification of rules/knowledge-base/chunk-index-follows-content\
  \ did not hold: the auditor answered `partial` — The fact is only exercised on pdf input split at form-feed.\
  \ The chunker test \"`pdf`: splits on form-feed (U+000C)\" pins chunk_index [0, 1, 2] to the texts \"\
  página 1\", \"página 2\" and \"página 3\" in the order they appear in the content. \"returns chunks\
  \ ordered by chunk_index ascending\" pins chunk_index [0, 1, 2, 3] to \"A\", \"B\", \"C\" and \"D\"\
  \ as they appear in the content, via the service and its fake client. In the chunker test the chunk_index\
  \ assertion is incidental: it rides on a test of the BR-06 pdf hard boundary, and nothing marks it as\
  \ load-bearing. \"returned chunks are sorted by chunk_index ascending\" asserts only the index sequence\
  \ [0, 1, 2] and never ties an index to a position in the content, so on its own it does not bind the\
  \ \"order they appear in its content\" half. Other inputs also yield more than one chunk: a chat or\
  \ transcricao input split per speaker turn, an email split at the header/body boundary, and an oversize\
  \ block split into sentences under BR-07. None of these tests asserts chunk_index on any of them. So\
  \ the tests do not check that their indices start at 0, run without gaps or repeats, or follow content\
  \ order. Nor do they check that they keep doing so when a block is split again by the oversize fallback..\
  \ The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: Chunk one chat input with several speaker lines,\
  \ and one input above CHUNK_HARD_MAX that also crosses a hard boundary, such as a pdf whose page holds\
  \ an oversize block. For each, assert that the chunk_index sequence is exactly 0..n-1. Also assert that,\
  \ in chunk_index order, the offset_start values strictly increase, so that each index follows the chunk's\
  \ position in the content..\nCertification of rules/knowledge-base/email-header-block did not hold:\
  \ the auditor answered `partial` — The test asserts only that there are at least two chunks, that the\
  \ first chunk contains \"From: a@example\" and \"Subject: Olá\", and that the last chunk contains \"\
  Mensagem do corpo\". That would catch a header block cut off before its last header line. It would not\
  \ catch two other failures. First, the input has only one blank line and none in the body, so nothing\
  \ separates \"the first blank line\" from a later one. A header block that ran on to a later blank line\
  \ would still pass. Second, every assertion is a `toContain` and no offsets or exact text are checked,\
  \ so the line break of the blank line is never tested. It could end up at the end of the header chunk,\
  \ at the start of the body chunk, or in both, and the test would still pass. So the half of the fact\
  \ saying that this line break belongs to no block is not exercised. No other test in the file uses the\
  \ `email` source type.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: Use one email input with a header\
  \ block, a first blank line and a body that itself contains a later blank line. Expect the first chunk's\
  \ text to equal the header lines exactly, with no trailing break, and its offset_end to stop before\
  \ the blank line's line break. Expect the next chunk's offset_start to come after that line break, so\
  \ the code point of the break is in neither chunk's [offset_start, offset_end). Expect the body's own\
  \ blank line not to end the header block..\nCertification of rules/knowledge-base/turn-blocks did not\
  \ hold: the auditor answered `partial` — In both tests every line of the content is a speaker line,\
  \ and the first line is one too. The chat test checks that there are three blocks and that each one\
  \ starts at its speaker line. The transcript test checks only that there are three blocks, so a transcript\
  \ block boundary that fell somewhere other than the speaker line would still pass. No content in the\
  \ set has a speaker line that comes after a line that is not a speaker line, such as a turn that runs\
  \ over several lines or an opening line with no speaker. So whether a speaker line starts a new block\
  \ when the line before it is ordinary text is never tested, for chats or for transcripts. The transcript\
  \ test only uses speaker lines that start with a bracketed timestamp. The node does not say whether\
  \ a transcript line with a speaker but no timestamp counts as a speaker line, so that case is not tested\
  \ either.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: Use chat content and transcript content where\
  \ an opening line with no speaker is followed by a multi-line turn and then another speaker line. The\
  \ expected result is a new block starting exactly at each speaker line after the first line, with each\
  \ block's text beginning with that speaker line and the continuation lines staying in the block of the\
  \ turn before them..\nCertification of rules/knowledge-base/undivided-sources did not hold: the auditor\
  \ answered `partial` — I read \"any other source\" as the source type `outro`, beside `ata` (meeting\
  \ minutes) and `artigo` (article). The other reading, every source, would contradict the pdf, email,\
  \ chat and transcricao splitting this node sits beside. The named test checks that a minutes, article\
  \ or other content comes back as exactly one chunk equal to the content. That content holds only single\
  \ newlines and none of the markers the other source types split on: no form-feed (U+000C), no blank\
  \ line, no \"Name:\" speaker line, no \"[00:01] Name:\" timestamped turn. So if minutes, articles or\
  \ other sources started splitting on any of those markers, nothing would fail, and the fact goes unchecked\
  \ for exactly the content most likely to break it. The moderate-size test and the emoji and accent offset\
  \ tests also produce one `ata` chunk, but only along the way to their own assertions, from content that\
  \ carries no markers either. The oversize test splitting an `ata` above CHUNK_HARD_MAX is the size fallback\
  \ (BR-07), not a source boundary. It bears on the fact only if \"one block\" means the unit before that\
  \ fallback, which the node does not say.. The node is decided by reading, and a certification standing\
  \ on it from an earlier reconciliation is released by the bind. The remainder is testable: For each\
  \ of `ata`, `artigo` and `outro`, take content under CHUNK_HARD_MAX that holds a form-feed, a blank\
  \ line, a \"João: ...\" speaker line and a \"[00:01] Maria: ...\" timestamped line. The expected result\
  \ is exactly one chunk whose text is the whole content, verbatim..\nCertification of rules/knowledge-base/short-block-one-chunk\
  \ did not hold: the auditor answered `partial` — Every test here shows that a short block stays one\
  \ raw chunk. None of them tests the 4000 code-point bound the fact names. The largest single block that\
  \ must stay one chunk is the roughly 500 code-point input in \"preserves a moderate-size block (below\
  \ CHUNK_HARD_MAX) as one chunk\". A chunker that split any block longer than about 600 code points would\
  \ pass the whole file. The oversize test would also pass, because it only asserts more than one chunk,\
  \ each at most CHUNK_HARD_MAX. Nothing in the file checks that CHUNK_HARD_MAX is 4000. The oversize\
  \ test is written relative to the imported constant, so changing the constant to a smaller value fails\
  \ nothing. The three emoji and accented-character tests assert one chunk only on the way to asserting\
  \ their offsets, so they bear on the fact incidentally.. The node is decided by reading, and a certification\
  \ standing on it from an earlier reconciliation is released by the bind. The remainder is testable:\
  \ Take one block with no hard boundary (for example source type `ata`) that is exactly 4000 code points\
  \ long, made of sentence-terminated text and including characters outside the BMP so that code points\
  \ and UTF-16 units differ. The expected result is exactly one raw chunk with offset_start 0, offset_end\
  \ 4000 and text equal to the whole input..\nCertification of rules/knowledge-base/long-block-sentence-chunks\
  \ did not hold: the auditor answered `partial` — The test gives an \"ata\" block of more than 4000 code\
  \ points, built from repeated short sentences ending in a full stop. It checks three things: the block\
  \ is split into more than one chunk, no chunk is longer than CHUNK_HARD_MAX (4000), and the chunk spans\
  \ add up to the block's full code-point count. So the block is shown to be cut, but neither part of\
  \ how the fact says it is cut is checked. First, the test never checks where a chunk ends. Nothing compares\
  \ a chunk's offset_end to a sentence end, so a chunker that cut in the middle of a sentence would still\
  \ pass. Second, it never checks the 2000-code-point limit. The only bound it asserts is 4000, so a chunker\
  \ that cut a 4200-code-point block into one chunk of 4000 and one of 200 would pass. Nothing checks\
  \ that each chunk stops before the sentence that would take it past 2000. The test \"preserves a moderate-size\
  \ block (below CHUNK_HARD_MAX) as one chunk\" uses a block of about 500 code points. That is below 2000\
  \ as well as 4000, so it cannot tell whether the \"more than 4000\" condition is in force or a 2000\
  \ one is. Nothing gives a block between 2000 and 4000 code points.. The node is decided by reading,\
  \ and a certification standing on it from an earlier reconciliation is released by the bind. The remainder\
  \ is testable: Input: a block of more than 4000 code points made of Portuguese sentences of known lengths.\
  \ Expected result: every chunk's offset_end falls at a sentence end, every chunk is at most 2000 code\
  \ points long, and adding the next sentence to any chunk except the last would take it past 2000. A\
  \ second assertion closes the condition: a block of between 2000 and 4000 code points comes back as\
  \ a single chunk..\nCertification of domain/knowledge-base/valid-from-basis did not hold: the auditor\
  \ answered `partial` — The node lists three values: stated, document and received. The tests check only\
  \ the caller-facing DTO schemas. They show that stated and document are accepted values of the basis,\
  \ and that ValidFromBasisSchema accepts nothing else (the \"rejects arbitrary strings\" test). Nothing\
  \ in the offered proof uses received as a value of the basis. The three \"rejects 'received'\" tests\
  \ assert the opposite at the API boundary: they pass only while received is refused there. That is an\
  \ extra fact the node does not state. Each of these tests would also keep passing if received were dropped\
  \ from the enumeration everywhere. The file's comments say received is set inside the backend by the\
  \ temporal validator (validation/temporal.ts). A comment is not evidence, and no test of that validator\
  \ is in the offered proof. So the third value is unproven by the named tests. The tests also check value\
  \ labels only. Nothing checks that a stated basis matches a date the source states, a document basis\
  \ the document's own date, or a received basis the date the source was received.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Take an assertion whose source states no date and whose document carries\
  \ no date of its own. Run it through the path that records the basis. The expected result is a basis\
  \ of received, with valid_from equal to the source's received date. Matching assertions, one with a\
  \ date the source states and one with only the document's own date, would close stated and document\
  \ the same way: each should record that basis and that date..\nCertification of rules/knowledge-base/attribute-value-in-allowed-values\
  \ did not hold: the auditor answered `partial` — The proposal half is exercised. proposeAttributeService\
  \ accepts \"proposta\" for a doc_type key that has allowed values. It refuses \"PROPOSAL\" with no attribute\
  \ or provenance written. At the helper level, assertValueInDomain refuses a value that differs only\
  \ in case (\"Proposta\") or only in accent (\"relatorio\"). Together these hold \"one of them exactly\
  \ as written\" for a proposal, although the case-only and accent-only misses are shown only on the helper\
  \ and never through the proposal path. The correction half is not exercised. Nothing in the set submits\
  \ an attribute correction: no curation correction of an attribute value, and no proposal carrying change_hint\
  \ \"correction\". The set therefore never checks that a corrected value for a key with allowed values\
  \ must be one of them. The open-domain test (\"is a no-op on an OPEN domain\") bears on keys without\
  \ allowed values, which the fact does not address. The structural.spec.ts test \"sorts allowed_values\
  \ lexicographically for diagnostic stability\" asserts the order of the diagnostic, which the fact does\
  \ not state.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: One input against one expected result: an attribute\
  \ correction for a key with allowed values (for example doc_type), carrying a value not in that set\
  \ or differing from a member only in case or accent. The expected result is a refusal that leaves the\
  \ attribute's current value unchanged. Paired with it, a correction carrying an allowed value exactly\
  \ as written is accepted..\nCertification of rules/knowledge-base/attribute-proposal-check-order did\
  \ not hold: the auditor answered `partial` — One test touches the order, and only at one point. It sends\
  \ a value outside the key's allowed values and checks that the proposal is refused. It also checks that\
  \ the query fetching fragments, the anchoring count query and the INSERTs never ran. That ties only\
  \ one step of the order: the allowed-values check comes before the cited-fragment check and before the\
  \ anchoring check. The proof watches which SQL strings were sent, not which refusal a proposal gets.\
  \ So it is tied to how the service is built: a reordering that issues no differently-shaped query would\
  \ get past it. It shows the node lookup ran, not that a missing node is refused before the attribute\
  \ key is checked. Nothing in the set submits a proposal for a node that does not exist. None sends an\
  \ attribute key unknown for its node type. None sends a value that does not parse as the key's type.\
  \ None cites a fragment that does not exist or belongs to another LLM run. None has bad dates, confidence\
  \ below the threshold, or fragments that are not anchored. So most of the stated order is never exercised:\
  \ node before key, key before value, cited fragments before dates, dates before confidence, confidence\
  \ before anchoring. Stopping at the first failed check is exercised only for the allowed-values refusal.\
  \ The other two tests in the file are 'accepts an in-domain value (closed domain, value present in set)'\
  \ and 'is a no-op on an OPEN domain — `title` has zero rows in attribute_valid_value'. Both are proposals\
  \ that pass every check, so they show nothing about order or about stopping at the first failure.. The\
  \ node is decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: The order is a finite chain of eight checks, so a table of\
  \ seven cases closes it. Each case pairs one check with the check right after it. It submits a proposal\
  \ that fails both, against one expected result: refused with the earlier check's reason and nothing\
  \ written. The cases are: missing node with unknown key; unknown key with unparseable value; value of\
  \ the wrong type or outside the allowed values with a nonexistent or foreign-run fragment; such a fragment\
  \ with bad dates; bad dates with too-low confidence; too-low confidence with unanchored fragments. Add\
  \ one proposal for each check that fails only that check and is refused for that check's reason..\n\
  Certification of rules/knowledge-base/held-content-records-nothing did not hold: the auditor answered\
  \ `partial` — The named test ingests content whose hash is already held through ingestRawInformation.\
  \ It asserts that the counts of raw information, raw chunks and LLM runs are the same afterwards. This\
  \ applies to one input only: the earlier LLM run has the same model and prompt_version, so its idempotency\
  \ key matches. The fake client then refuses a duplicate llm_run insert by itself. As a result, the LLM-run\
  \ part of the assertion would still hold if the service did try to record a run. A service that recorded\
  \ a new LLM run for held content under a different model, prompt_version or chunking_version would pass\
  \ this test, because nothing in the file ingests held content under a different idempotency key. The\
  \ fact covers ingesting held content in general, but the file only reaches it through ingestRawInformation.\
  \ It does not reach the one-shot ingest_document entry point. It also does not reach the race path,\
  \ where the content-hash lookup misses and the raw_information insert then hits the unique-key conflict.\
  \ The file's header comment says that race path is covered. The sibling test \"returns status 200 with\
  \ outcome=noop_existing and an empty chunks array when content_hash already exists\" checks only the\
  \ response (an empty chunks array and the existing chunk_count). It does not check what was recorded,\
  \ so it does not bear on the fact.. The node is decided by reading, and a certification standing on\
  \ it from an earlier reconciliation is released by the bind. The remainder is testable: Ingest content\
  \ whose hash is already held while using a different model or prompt_version than the earlier run, so\
  \ the idempotency key differs. Do the same through the ingest_document entry point, and once more where\
  \ the hash lookup misses and the raw_information insert hits the unique-key conflict. In each case the\
  \ expected result is that the counts of raw information, raw chunks and LLM runs do not change..\nCertification\
  \ of rules/knowledge-base/ingestion-records-chunks-and-run did not hold: the auditor answered `partial`\
  \ — Several parts are exercised. Ingesting new content records a raw information that can be read back\
  \ by its id (\"returns the row when found\"). It records raw chunks that are read back under that raw\
  \ information's id (\"returns chunks ordered by chunk_index ascending\"). It opens exactly one LLM run\
  \ (llm_runs.size is 1 in \"persists at least one raw_chunk and one llm_run row\"). Two parts are not\
  \ exercised. The first is that the run is opened in status running. No test asserts the run's status.\
  \ The fake client's INSERT INTO llm_run branch also sets status to \"running\" itself and ignores whatever\
  \ the service sends, so the run's status could change and every test would still pass. The second is\
  \ that the run is opened over this raw information. No test asserts that the run's input_raw_information_id\
  \ is the raw_information_id the ingestion returned, so a run opened over a different raw information\
  \ would also pass.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: One input closes it: new content\
  \ given to ingestRawInformation. The expected result is that the one opened LLM run has status running\
  \ and an input_raw_information_id equal to the returned raw_information_id. Both values must be read\
  \ from what the service writes, not made up by the fake client, so the fake must keep the status it\
  \ receives or the test must run against a real database..\nCertification of rules/knowledge-base/validity-start-before-end\
  \ did not hold: the auditor answered `partial` — Only one case is exercised. A proposal that gives the\
  \ same date as both its validity start and its validity end (2026-06-12 for each) is refused, and that\
  \ call goes straight to validateTemporal. Nothing in the set submits a start later than its end. A check\
  \ that refused only equal dates would still pass this test, so the \"start before end\" half of \"strictly\
  \ before\" is not proven. Nothing in the set submits a start strictly before an end with both stated,\
  \ so the test would also pass a check that refused every period stating both dates. The fact covers\
  \ three things: a proposal, an adjusted period and a correction. The offered file calls only the ingestion\
  \ temporal-validation layer, which is how a proposal reaches the check. No adjusted period or correction\
  \ carrying both dates is submitted anywhere in the set, so the fact goes unexercised for domain/knowledge-base/adjusted-period\
  \ and domain/knowledge-base/corrected-values.. The node is decided by reading, and a certification standing\
  \ on it from an earlier reconciliation is released by the bind. The remainder is testable: For each\
  \ of a proposal, an adjusted period and a correction, three checks with one input and one expected result\
  \ each. A start later than the end must be refused. A start equal to the end must be refused. A start\
  \ one day before the end must be accepted..\nCertification of rules/knowledge-base/correction-requires-errata-evidence\
  \ did not hold: the auditor answered `partial` — Two parts of the fact are exercised. A correction proposal\
  \ whose only fragment has none of the words is refused. A correction proposal whose fragment contains\
  \ the lowercase word \"errata\" is accepted. Three parts are not exercised. First, nothing in the set\
  \ offers a fragment carrying errado, correção, corrigir, correction or correcao. The fact names six\
  \ words and only one is ever tried, so a validator that accepted only \"errata\" would pass every test.\
  \ Second, the only word tried is lowercase, so the \"in any letter case\" clause is never tested. A\
  \ case-sensitive match would pass every test. Third, every proposal in the set cites exactly one fragment,\
  \ so \"at least one\" is never tested against a mix of fragments with and without a word. Separately,\
  \ the refusal test checks for the code BUSINESS_TEMPORAL_INCOHERENT. The node names no error code, so\
  \ that check asserts more than the fact establishes.. The node is decided by reading, and a certification\
  \ standing on it from an earlier reconciliation is released by the bind. The remainder is testable:\
  \ For each of errado, correção, corrigir, correction and correcao, a correction proposal whose fragment\
  \ contains that word should be accepted. A correction proposal whose fragment contains one of the words\
  \ in uppercase or mixed case, such as \"ERRATA\" or \"Correção\", should be accepted. A correction proposal\
  \ that cites several fragments, only one of which contains a word, should be accepted. Each of these\
  \ is one input against one expected result..\nCertification of rules/knowledge-base/stated-start-requires-basis\
  \ did not hold: the auditor answered `partial` — The proposal half is exercised for one configuration\
  \ only. A proposal that states valid_from with valid_from_basis null is refused with BUSINESS_DATE_UNJUSTIFIED.\
  \ That proposal also has requires_valid_from true. The fact applies to any proposal that states a validity\
  \ start, and nothing in the set submits a stated valid_from without a basis when requires_valid_from\
  \ is false. So whether the requirement holds apart from that flag is unexercised. The correction half\
  \ is unexercised. Both tests that submit change_hint 'correction' (\"requires errata signal when change_hint\
  \ = 'correction'\" and \"accepts change_hint='correction' when fragment text contains 'errata'\") supply\
  \ valid_from_basis 'stated', and their assertions concern the errata signal. Neither one submits a correction\
  \ that states a validity start without a basis. The pack does not show whether a correction of corrected-values\
  \ reaches validateTemporal at all, and nothing in the offered proof drives a correction through its\
  \ own entry point.. The node is decided by reading, and a certification standing on it from an earlier\
  \ reconciliation is released by the bind. The remainder is testable: Two inputs, each against one expected\
  \ result. First, a correction that states a validity start with no basis, refused with BUSINESS_DATE_UNJUSTIFIED\
  \ and not applied. Second, a proposal with requires_valid_from false that states valid_from with valid_from_basis\
  \ null, refused with the same code..\nCertification of rules/knowledge-base/required-start-available\
  \ did not hold: the auditor answered `partial` — The rule is exercised only inside the temporal validation\
  \ layer, with the requirement and the source's dates handed in as literal arguments (requires_valid_from,\
  \ document_date, received_at). Given those arguments, the tests prove that the proposal is refused when\
  \ no start is stated and the source has no document date and no reception date. They also prove it is\
  \ accepted when a start is stated, when a document date is present, or when a reception date is present.\
  \ The fact, though, is about a proposal for a link type or attribute key whose catalog entry requires\
  \ a validity start, and about the dates of the source that proposal comes from. Nothing in the offered\
  \ proof makes a proposal against a link type or attribute key and checks that the requirement is read\
  \ from that catalog entry. Nothing reads the document date or reception date from the proposal's source\
  \ raw information either. If the flag or the dates stopped reaching the validator from those places,\
  \ the fact would stop holding and every test here would still pass. The test \"rejects BUSINESS_DATE_UNJUSTIFIED\
  \ when valid_from supplied without basis\" refuses a proposal that does state a start. That goes beyond\
  \ this fact, which a stated start already satisfies. It is not cited as proof here.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Two cases close it. First input: a link proposal and an attribute proposal\
  \ whose link type or attribute key requires a validity start, stating no start, in a run whose source\
  \ raw information has neither a document date nor a reception date. Expected result: a refusal with\
  \ BUSINESS_DATE_UNJUSTIFIED. Second input: the same proposals against a source that has one of those\
  \ dates. Expected result: acceptance..\nCertification of rules/knowledge-base/link-proposal-check-order\
  \ did not hold: the auditor answered `partial` — The fact sets an order for seven checks: known link\
  \ type, existing source and target knowledge nodes, cited fragments that exist and belong to the LLM\
  \ run, a permitting link type rule, dates, confidence, and fragment anchoring. It also says checking\
  \ stops at the first check that fails. The named test exercises one pair of those checks. Its proposal\
  \ fails two of them: no link type rule permits it, and its dates are incoherent (valid_from after valid_to).\
  \ The test asserts that the refusal is BUSINESS_LINK_RULE_VIOLATION, so the link-type-rule check returns\
  \ before the date check. Nothing in the set submits a proposal that fails any other pair. An unknown\
  \ link type is never checked against missing nodes. Missing source or target nodes are never checked\
  \ against foreign or missing fragments. Fragments from another run are never checked against a missing\
  \ rule. A bad date is never checked against low confidence. Low confidence is never checked against\
  \ unanchored fragments. So the position of the first three checks and the last two goes unexercised.\
  \ Every check in the test's input passes before the rule check: the link type is known, the fake pool\
  \ returns both nodes, and it returns the fragment under the proposal's run. So the test cannot show\
  \ that those checks run before it. The stopping half is only shown through which refusal comes back.\
  \ The test collects the query list from the fake pool and never asserts on it. A handler that went on\
  \ to the date, confidence or anchoring checks after the rule failure, but still returned the first failure,\
  \ would pass.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: The order is a finite sequence of seven checks.\
  \ For each adjacent pair, one proposal that fails both checks should get the earlier check's refusal.\
  \ The pairs are: unknown link type with a missing source node; missing target node with a fragment from\
  \ another LLM run; a nonexistent fragment with no permitting link type rule; incoherent dates with confidence\
  \ below threshold; confidence below threshold with fragments not anchored in the run's source chunks.\
  \ The stopping half needs one more assertion: after the first failure, the queries recorded for that\
  \ proposal include none that a later check issues..\nA finding in src/modules/ingestion/chunker/v1.ts\
  \ names rules/knowledge-base/speaker-line, which no file of this set is bound to: SPEAKER_LINE_REGEX,\
  \ line 351: const SPEAKER_LINE_REGEX = /^\\s*(?:[[(]\\d{1,2}:\\d{2}(?::\\d{2})?[\\])][\\s\\t]+)?[A-Za-zÀ-ÿ0-9_]+(?:\\\
  s[A-Za-zÀ-ÿ0-9_]+)?:\\s/; — The node names four time stamp forms: [h:mm], [hh:mm], (hh:mm) and (hh:mm:ss).\
  \ The regex accepts any of `[` or `(` closed by any of `]` or `)`, with optional seconds. It therefore\
  \ also treats `[12:00:30] Ana: oi` (square brackets with seconds), `(1:05) Ana: oi` (parentheses with\
  \ one-digit hour) and `[12:00) Ana: oi` (mismatched brackets) as speaker lines, and each of these starts\
  \ a new block in chat and transcript sources. The node says \"letters\", while the class `A-Za-zÀ-ÿ`\
  \ accepts only ASCII and Latin-1 characters, including `×` and `÷`, and refuses letters such as `ł`.\
  \ Block boundaries, and so chunk offsets, differ from what the specification decided for these lines..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/prompts/extraction.v1.ts\
  \ names domain/knowledge-base/proposal, which no file of this set is bound to: system(), \"Output contract\"\
  \ section, lines 195-196: \"- `propose_link` / `propose_attribute` MUST cite ≥ 1 `fragment_id` returned\"\
  , \"  by `propose_fragment` in this same chunk.\", — The prompt requires at least one cited fragment,\
  \ from this same chunk. The node that governs proposals allows a link or attribute proposal any number\
  \ of cited fragments, and every cited-fragment rule is scoped to the LLM run, not to the chunk. The\
  \ model is told something stricter than the specification decided, and the next reader cannot tell which\
  \ is meant.. It blocks nothing here; it is owed a route of its own.\nA finding in src/modules/ingestion/prompts/extraction.v4.ts\
  \ names rules/knowledge-base/caller-never-states-received, which no file of this set is bound to: RECEIVED_AT_ANCHOR_DIRECTIVE,\
  \ lines 57-62 (the system prompt text sent to the model): \"  deictics), resolve it AGAINST `document_date`\
  \ if it is present (basis\", \"  `\\\"document\\\"`). If `document_date` is `(unknown)`, fall back to\
  \ the date\", \"  portion of `received_at` (the `YYYY-MM-DD` prefix of the ISO-8601 string) —\", \"\
  \  use basis `\\\"received\\\"`.\", — The extraction prompt is what the model is told to do, and it\
  \ tells the model to state the basis received on its proposals. The node says a proposal must never\
  \ state that basis. The node leaves received to the system, which applies it when a proposal states\
  \ no validity start and the source has no document date. Every run under v4 on a source with no document\
  \ date is told to produce what the node forbids. The prompt is the only place this instruction lives,\
  \ so the next reader checking the node will not find it.. It blocks nothing here; it is owed a route\
  \ of its own.\nA finding in src/modules/ingestion/service/entity-resolution.service.ts names rules/knowledge-base/ambiguous-candidates-need-review,\
  \ which no file of this set is bound to: TRIGRAM_CANDIDATE_LIMIT (line 47) and its use in the candidate\
  \ query's `LIMIT` clause (line 165). The ambiguous branch (lines 186-217) takes its entity_match_review\
  \ rows from this capped set.: const TRIGRAM_CANDIDATE_LIMIT = 10; ... ORDER BY MAX(similarity(na.alias_norm,\
  \ norm($1::text))) DESC\n      LIMIT ${TRIGRAM_CANDIDATE_LIMIT} — The candidate node says the new needs-review\
  \ node is paired with \"each such node\" at 0.55 or more. The code can pair it with at most 10, so an\
  \ eleventh qualifying node would be dropped without trace. The cap of 10 exists only in this file. The\
  \ next reader looks for it in the specification and does not find it, and the entity-match queue silently\
  \ lists fewer candidates than the rule promises.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/ingestion/service/graph-consolidation.service.ts names rules/knowledge-base/reaffirmation-consolidates,\
  \ which no file of this set is bound to: consolidateLinkOnce, the `reaffirmation` constant of branch\
  \ (a), lines 549-552: const reaffirmation =\n  sameTarget &&\n  args.change_hint === \"none\" &&\n \
  \ (!functional || sameValidFrom); — The node says a type that allows multiple current assertions re-affirms\
  \ whenever the hint is not correction. The code also requires hint none for those types. A multi-valued\
  \ link proposal that meets a current link with the same target and carries hint succession is not re-affirmed.\
  \ It skips branch (b) and (c) (c is functional-only) and falls through to (e), a second insert against\
  \ the current-link duplicate guard (the `knowledge_link_current_dup_guard` index). That ends in the\
  \ retry and then SYSTEM_INTERNAL_ERROR, instead of the consolidation the node decided. The wrong outcome\
  \ sits in code, so a reader of the specification would not expect it.. It blocks nothing here; it is\
  \ owed a route of its own.\nA finding in src/modules/ingestion/service/graph-consolidation.service.ts\
  \ names rules/knowledge-base/reaffirmation-consolidates, which no file of this set is bound to: consolidateAttributeOnce,\
  \ branch (a) re-affirmation, lines 777-781: if (\n  sameValue &&\n  sameValidFrom &&\n  args.change_hint\
  \ === \"none\"\n) { — The node has a multi-valued attribute with the same value re-affirm whatever its\
  \ validity start, as long as the hint is not correction. The code requires the same validity start and\
  \ hint none for every type. A multi-valued attribute re-stated with another validity start, or with\
  \ hint succession, is not consolidated. It falls to (e) and inserts a second row, which meets the current-attribute\
  \ duplicate guard (`node_attribute_current_dup_guard`) and ends in SYSTEM_INTERNAL_ERROR. The comment\
  \ at lines 852-854 (\"different valid_from on a multi-valued attribute is coexistence\") states a rule\
  \ no node holds. The link branch of the same file decides this case differently.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/ingestion/service/graph-consolidation.service.ts\
  \ names domain/knowledge-base/change-hint, which no file of this set is bound to: the `change_hint`\
  \ members of ConsolidateLinkArgs (line 124) and ConsolidateAttributeArgs (line 140): readonly change_hint:\
  \ \"none\" | \"succession\" | \"correction\"; — The change-hint vocabulary is declared a second time\
  \ in a file the node is not bound to. When the enumeration moves, `--check` does not reach this file,\
  \ and the code and the node can disagree with no sign of which was decided.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/modules/ingestion/service/propose-attribute.service.ts\
  \ names rules/knowledge-base/attribute-key-for-node-type, which no file of this set is bound to: lines\
  \ 71-80, the guard after the catalog lookup that compares `resolvedKey.node_type_id` with `nodeTypeId`:\
  \ if (resolvedKey.node_type_id !== nodeTypeId) {\n    throw new ValidationFailure(\n      \"VALIDATION_INVALID_FORMAT\"\
  ,\n      \"attribute_key.node_type_id does not match the node's node_type_id.\", — The attribute-key-for-node-type\
  \ rule is implemented a second time in this file. This copy refuses with VALIDATION_INVALID_FORMAT.\
  \ The contract answers the rule with BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key (contracts/knowledge-base/ingestion.md,\
  \ propose-attribute). If the catalog cache scope ever changes and this branch becomes reachable, the\
  \ same refusal would carry a code the specification does not give it. A reader looking for the refusal\
  \ in the specification would not find this code.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/modules/ingestion/validation/temporal.ts names rules/knowledge-base/required-start-fallback,\
  \ which no file of this set is bound to: The `document_date !== null` branch inside `input.requires_valid_from\
  \ && input.valid_from === null`, lines 144-158.: if (input.document_date !== null) {\n  ...\n  return\
  \ {\n    valid_from: input.valid_from,\n    valid_from_basis: input.valid_from_basis,\n  };\n} against\
  \ the node: \"takes the document date of its source with basis document or, when the source has none,\
  \ the date the source was received with basis received\". — A proposal that requires a validity start\
  \ and states none, from a source with a document date, is accepted with `valid_from` null and no basis.\
  \ The node says it takes the document date with basis document. The received branch does resolve a date\
  \ and a basis, so the two links of the chain decide differently on whether a required start may stay\
  \ empty. The node's log records this exact split as the thing the decision closed. The code's own comment\
  \ says the null was kept on purpose (\"We preserve that\"), so the code departs from the node in a way\
  \ its author knew about.. It blocks nothing here; it is owed a route of its own.\nCandidates: 45 opened\
  \ across 20 of 29 delegation(s); each return lists its own under `candidates_opened`.\nUnstated: 22\
  \ fact(s) the source states that no node holds, over 12 file(s), listed under `unstated`. They block\
  \ no binding here and no rebind closes them — the route is the analysis that gives each fact a node.\n\
  Restates: 60 place(s) where text in the source restates a node's fact the code holds, over 23 file(s),\
  \ listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,\
  \ and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/certify-ingestion-tests.returns/`, which are the evidence behind every entry above.
