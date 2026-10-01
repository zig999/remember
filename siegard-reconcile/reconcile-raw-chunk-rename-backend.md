---
contract_version: siegard-reconcile/8
title: Reconciliation after the raw-chunk attribute rename to text, offset_start and offset_end
summary: 'The source did not change; the specification moved: the owner states the code is the truth and
  the analysis renamed the raw-chunk attributes to text, offset_start and offset_end and followed the
  rename in five rules and the ingestion contract. This reconciliation reads the thirteen files bound
  to the moved nodes against them.'
target: backend
files:
- path: src/modules/ingestion/chunker/v1.ts
  change: Unchanged; splits content into raw chunks with code-point offsets.
- path: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  change: Unchanged; declares the ingest-raw-information request and response shapes.
- path: src/modules/ingestion/dto/raw-information.dto.ts
  change: Unchanged; declares the raw information and raw chunk response shapes.
- path: src/modules/ingestion/mcp/mcp-schemas.ts
  change: Unchanged; declares the MCP tool schemas of the ingestion toolset.
- path: src/modules/ingestion/prompts/extraction.v1.ts
  change: Unchanged; declares the v1 extraction prompt.
- path: src/modules/ingestion/repository/ingestion.repository.ts
  change: Unchanged; reads and writes raw information, raw chunks and LLM runs.
- path: src/modules/ingestion/repository/llm-run.repository.ts
  change: Unchanged; reads LLM runs, tool calls and recent ingestions.
- path: src/modules/ingestion/service/ingestion.service.ts
  change: Unchanged; ingests raw information and answers noop_existing for held content.
- path: src/modules/query-retrieval/repository/fts-config.ts
  change: Unchanged; names the full-text configurations for prose and for names.
- path: src/modules/query-retrieval/repository/provenance.repository.ts
  change: Unchanged; reads provenance chains with each chunk sliced by its offsets.
- path: src/modules/query-retrieval/repository/search.repository.ts
  change: Unchanged; runs the search layers and the provenance lookups.
- path: src/modules/query-retrieval/service/accepted-fragments.service.ts
  change: Unchanged; lists accepted fragments with their source.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Unchanged; reads a fragment's provenance chain.
nodes:
- node: domain/knowledge-base/raw-chunk
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/chunker/v1.ts, src/modules/ingestion/dto/ingest-raw-information.dto.ts,
    src/modules/ingestion/dto/raw-information.dto.ts, src/modules/ingestion/repository/ingestion.repository.ts,
    and src/modules/ingestion/repository/llm-run.repository.ts read `nowhere` — The file never declares
    the shape of a raw chunk. It reads two columns of `raw_chunk` in queries: `JOIN raw_chunk rc       ON
    rc.id = fs.raw_chunk_id ... AND rc.raw_information_id = $2` and `FROM raw_chunk WHERE id = ANY($1::uuid[])
    AND raw_information_id = $2`. It never declares chunk_index, offset_start, offset_end, text, locator,
    superseded_at, chunking_version or status.; src/modules/ingestion/service/ingestion.service.ts read
    `nowhere` — This file declares no shape for the element. It forwards chunk values from the repository
    rows: `chunkRows.map((c) => ({ id: c.id, chunk_index: c.chunk_index, offset_start: c.offset_start,
    offset_end: c.offset_end }))`. It reads `chunkInputs = chunkV1(input.content, input.source_type)`
    and calls `insertRawChunks(client, rawInformationRow.id, chunkInputs)`. The declaration is in the
    repository and DTO files.; src/modules/query-retrieval/service/accepted-fragments.service.ts read
    `nowhere` — The file declares no chunk shape. It only reads one field of a row type declared in another
    file: `chunk_index: row.chunk_index,`. `AcceptedFragmentRow` is imported from "../repository/accepted-fragments.repository.js".
    The shape of the element (`text`, `offset_start`, `offset_end`, `locator`, `status` and the rest)
    is not declared here.; src/modules/query-retrieval/service/provenance.service.ts read `nowhere. This
    file declares no shape for the chunk. It reads the fields `chunk_index`, `offset_start`, `offset_end`,
    `excerpt` and `locator` from a `ProvenanceChainRow` typed in `repository/provenance.repository.js`.
    It writes them into a `ProvenanceChunk` typed in `dto/response.dto.js`. Both declarations are in other
    files.` — `const provChunks: ProvenanceChunk[] = chunks.map((c) => ({ id: c.raw_chunk_id, chunk_index:
    c.chunk_index, offset_start: c.offset_start, offset_end: c.offset_end, excerpt: c.excerpt, locator:
    c.locator, ...` — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/chunker/v1.ts
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/dto/raw-information.dto.ts
  - src/modules/ingestion/repository/ingestion.repository.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/raw-information
  conforms: false
  how: 'the fact left part of its ground: still held in src/modules/ingestion/dto/ingest-raw-information.dto.ts,
    src/modules/ingestion/dto/raw-information.dto.ts, src/modules/ingestion/mcp/mcp-schemas.ts, src/modules/ingestion/prompts/extraction.v1.ts,
    src/modules/ingestion/repository/ingestion.repository.ts, and src/modules/ingestion/repository/llm-run.repository.ts
    read `nowhere` — The file never declares the shape of a raw information. `RecentIngestionRow` is a
    read projection (`readonly source_type: string; readonly raw_status: string; readonly received_at:
    Date; readonly content_preview: string;`) that passes along some of its values. The `SELECT ri.id
    AS raw_information_id, ri.source_type ... left(ri.content, 80) AS content_preview` query only reads
    them.; src/modules/ingestion/service/ingestion.service.ts read `nowhere` — This file declares no shape
    for the element. It passes values along: `insertRawInformation(client, { source_type: input.source_type,
    content: input.content, content_hash: contentHash, metadata: input.metadata, original_input: input.original_input
    ?? null })`. It also reads fields of the returned row (`rawInformationRow.id`, `rawInformationRow.content_hash`).
    The declaration is in the repository and DTO files.; src/modules/query-retrieval/service/accepted-fragments.service.ts
    read `nowhere` — The file declares no raw-information shape. It only passes values along from the
    imported row: `raw_information_id: row.raw_information_id,`, `source_type: toSourceType(row.source_type),`,
    `received_at: row.received_at.toISOString(),` and `document_title: row.document_title,`. The shape
    itself lives in the repository and DTO files, which are outside this file set.; src/modules/query-retrieval/service/provenance.service.ts
    read `nowhere. This file only forwards `source_type`, `received_at`, `metadata` and `original_input`
    from the chain row into the response object. The shapes are declared in `repository/provenance.repository.js`
    and `dto/response.dto.js`.` — `raw_information: { id: c.raw_information_id, source_type: toSourceType(c.source_type),
    received_at: c.received_at.toISOString(), metadata: c.metadata, original_input: c.original_input ??
    null, },` — a binding asserts the file answers for the node, so the pair that stopped holding it is
    released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/dto/raw-information.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/prompts/extraction.v1.ts
  - src/modules/ingestion/repository/ingestion.repository.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/ingestion.service.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/chunk-excerpt-is-verbatim
  conforms: true
  how: 'src/modules/ingestion/chunker/v1.ts: held at `buildChunk`, lines 417-430 — text: codePoints.slice(start,
    endExclusive).join(""), offset_start: start, offset_end: endExclusive,'
  encoded_at:
  - src/modules/ingestion/chunker/v1.ts
- node: rules/knowledge-base/chunk-offsets-count-code-points
  conforms: true
  how: "src/modules/query-retrieval/repository/provenance.repository.ts: held at The `excerpt` expression\
    \ in both SQL branches of `runChainSql` (the fragment-anchored branch and the provenance-anchored\
    \ branch). — substring(rc.\"text\" FROM rc.offset_start + 1\n                   FOR rc.offset_end\
    \ - rc.offset_start) AS excerpt\nsrc/modules/query-retrieval/repository/search.repository.ts: held\
    \ at The substring expressions that slice a chunk by its offsets, in searchChunkLayer (lines 177-178),\
    \ listProvenanceForFragments (lines 264-265), listProvenanceForLinks (lines 301-302) and listProvenanceForNodes\
    \ (lines 360-361). — substring(rc.\"text\" FROM rc.offset_start + 1\n          FOR rc.offset_end -\
    \ rc.offset_start) AS excerpt\nThis reads offset_start as inclusive and offset_end as exclusive. Postgres\
    \ substring counts characters, not bytes. That is the code-point reading the node requires, assuming\
    \ a UTF-8 database."
  encoded_at:
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/prose-matching
  conforms: true
  how: 'src/modules/query-retrieval/repository/fts-config.ts: held at the declaration of FTS_PROSE_CONFIG,
    line 18. It names the `pt_unaccent_v1` configuration, which migrations/0001_init.sql defines as a
    copy of `portuguese` with unaccent. — export const FTS_PROSE_CONFIG = "pt_unaccent_v1" as const;

    src/modules/query-retrieval/repository/search.repository.ts: held at The fragment and chunk queries
    (searchFragmentLayer, searchChunkLayer) and the node-mention join in listProvenanceForNodes. Each
    matches text_search against a tsquery built with FTS_PROSE_CONFIG. The config''s value is declared
    in fts-config.ts, which is outside this file set and which I did not read. — "f.text_search @@ websearch_to_tsquery($1::regconfig,
    $2)" with "FTS_PROSE_CONFIG" bound as $1 in searchFragmentLayer; "rc.text_search @@ websearch_to_tsquery($1::regconfig,
    $2)" in searchChunkLayer; "f.text_search @@ plainto_tsquery($1::regconfig, na.alias_norm)" with FTS_PROSE_CONFIG
    bound as $1 in listProvenanceForNodes.'
  encoded_at:
  - src/modules/query-retrieval/repository/fts-config.ts
  - src/modules/query-retrieval/repository/search.repository.ts
unstated:
- file: src/modules/ingestion/chunker/v1.ts
  where: '`scanLines` (line 298) and the blank-line test in `splitEmail` (line 229)'
  evidence: if (codePoints[i] === "\n") { ... const isBlank = line.endExclusive === line.start;
  cost: The code decides that a line ends only at `\n` and that a blank line is a zero-length one. A CRLF
    email leaves `\r` in every line, so its header/body separator is never recognised. A whitespace-only
    line is not blank either. The nodes for the email header block and the speaker line say "blank line"
    and "line" and never define either. This choice therefore lives only in the code, where a reader of
    the specification will not look for it.
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: lines 343-349, the `node_id` field of IngestDirectedNodeItemSchema, in the description the `tools/list`
    advertisement sends to clients
  evidence: '"Optional UUID PIN: when supplied, the server SKIPS entity resolution and binds this ref
    to the supplied id directly. ... Rejected (VALIDATION_INVALID_FORMAT) if the id does not point to
    an active node."'
  cost: This text, which clients receive, promises that a pin to a non-active node is refused with `VALIDATION_INVALID_FORMAT`.
    `rules/knowledge-base/directed-pinned-node` only says a node that names an existing identity resolves
    to it "provided the node exists and is active". It does not say what happens otherwise. The `ingest-directed`
    refusals in the `knowledge-base-ingestion` contract (an operation contract in the same specification)
    are the four format rules plus `caller-never-states-received`, and none of them is this case. The
    refusal and its error code therefore have no home in the specification. The header comment of the
    same file names a different code for the same case ("rejected `STRUCTURAL_INVALID`"), so the two statements
    in the file already disagree.
- file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: lines 89-120, StartAsyncIngestionMcpInputSchema, and the `content` description at line 95
  evidence: "export const StartAsyncIngestionMcpInputSchema = z.object({\n  content: z\n    .string()\n\
    \    ...\n    .describe(\n      \"The full plain text of the document to ingest. Paste the raw content;\
    \ the server chunks it, runs structured extraction in the BACKGROUND, and persists the knowledge graph\
    \ with provenance. No base64/binary.\""
  cost: The file declares a tool, `start_async_ingestion`, that ingests a document and runs extraction
    in the background. The tool's name and its input contract are the only places this behavior appears.
    I searched `projections/full-text.md` for "start_async_ingestion", "async", "background" and "immediately"
    and found no match. The operation contract lists `ingest-document` and `ingest-directed` but no asynchronous
    ingestion. A reader looking in the specification for how a client starts an ingestion without waiting
    for extraction will not find it.
- file: src/modules/ingestion/prompts/extraction.v1.ts
  where: line 42, the exported constant MAX_TOKENS
  evidence: /** Per-turn Anthropic `max_tokens` (TC-12 known_context — 8000). */ export const MAX_TOKENS
    = 8000 as const;
  cost: The ceiling on how much the model may output in one extraction turn is a value the code applies
    and no node holds. I searched the specification root for "8000", "max_tokens", "per-turn" and "ceiling".
    The only hits were the chat contract's own MAX_TOKENS and the `max-tokens` stop reason, and neither
    concerns extraction. The next reader will look for this limit in the specification and will not find
    it. A change to it would then be a code edit that no node and no decision log records.
restates:
- file: src/modules/ingestion/chunker/v1.ts
  where: comment inside the sentence loop, lines 99-103
  evidence: // Close the running buffer if appending this sentence crosses the upper // soft target. If
    the buffer itself is already empty and the first // sentence is larger than CHUNK_HARD_MAX, emit it
    standalone — we have // no finer atom to split on (a single 5000-char sentence will become one //
    chunk; this is BR-07's documented limit).
  cost: This is prose that no running system emits. It restates the rule that an over-long sentence is
    a chunk of its own, and it names a different threshold than the node does (`CHUNK_HARD_MAX` against
    the node's 2000 code points). The behavior is held by the `tentativeSize > CHUNK_TARGET[1]` branch,
    so the comment is a second, divergent statement of the rule.
  node: rules/knowledge-base/long-sentence-own-chunk
- file: src/modules/ingestion/chunker/v1.ts
  where: docstring of `RawChunkInput`, lines 42-46
  evidence: '* Output of the chunker — one entry per persisted chunk. Verbatim slice of the * original
    content between `offset_start` and `offset_end` (code points, * semi-open).'
  cost: 'This is a docstring that no running system emits. It restates the verbatim-excerpt invariant,
    which this file holds in `buildChunk` (`text: codePoints.slice(start, endExclusive).join("")` beside
    `offset_start: start, offset_end: endExclusive`). It is a second written home for the rule.'
  node: rules/knowledge-base/chunk-excerpt-is-verbatim
- file: src/modules/ingestion/chunker/v1.ts
  where: docstring of `splitByHardBoundaries`, lines 139-143 ("Hard boundaries are **mandatory closures**")
  evidence: '* apply to `sourceType` (BR-06). Hard boundaries are **mandatory closures**: * the chunker
    never produces a chunk that crosses one.'
  cost: 'This is prose that no running system emits. It restates the rule that no raw chunk crosses a
    block edge. The code holds that rule: chunks are built only inside each `block` range in `chunkV1`.
    The docstring is a second written home for it.'
  node: rules/knowledge-base/chunks-never-cross-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: docstring of `splitByHardBoundaries`, the `pdf` entry, lines 146-147
  evidence: '* - `pdf`:          form-feed (`\f`, U+000C). PDF extractors typically insert *                    `\f`
    between pages.'
  cost: This is prose that no running system emits. It restates the form-feed boundary rule, which `splitOnCharBoundary(codePoints,
    "\f")` holds in this file, and it adds a claim about PDF extractors that no node states.
  node: rules/knowledge-base/pdf-blocks-at-form-feeds
- file: src/modules/ingestion/chunker/v1.ts
  where: docstrings of `splitByHardBoundaries` (`chat`/`transcricao` entry, lines 150-154) and `splitTurns`
    (lines 261-265)
  evidence: '* Split chat / transcript: a new "speaker line" opens a new block. A speaker * line is one
    whose trimmed start matches `[A-Za-z0-9_]+:` followed by white * space (e.g. `João: Bom dia`). Bracketed
    timestamps like `[12:00] João:` are * also accepted.'
  cost: 'This is prose that no running system emits. It restates the turn-block rule, which `splitTurns`
    holds (`if (isSpeakerLine(codePoints, line))` for `i` from 1). It also describes the speaker-line
    shape differently from the regex that decides it: `[A-Za-z0-9_]+` against the regex''s `[A-Za-zÀ-ÿ0-9_]+`.
    A reader trusting the comment gets a different rule from the one applied.'
  node: rules/knowledge-base/turn-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: docstrings of `splitByHardBoundaries` (`email` entry, lines 148-149) and `splitEmail` (lines
    213-216)
  evidence: '* - `email`:        first blank line (header/body separator) plus every *                    transition
    into / out of a `>` quotation block.'
  cost: This is prose that no running system emits. It restates the email block rules, which `splitEmail`
    holds as the `headersClosed` branch and the `isQuoted !== prevQuoted` branch. Two written copies of
    the rule sit beside the code that holds it.
  node: rules/knowledge-base/email-quote-blocks
- file: src/modules/ingestion/chunker/v1.ts
  where: header comment, lines 20-24 ("All offsets are 0-based, semi-open, counted in Unicode code points
    of the ORIGINAL content (BR-05)")
  evidence: // All offsets are 0-based, semi-open, counted in Unicode code points of the // ORIGINAL content
    (BR-05). We use `[...content]` to iterate code points and a
  cost: 'This is prose that no running system emits. It states a fact the code already holds: `buildChunk`
    slices the `codePoints` array, and `splitBySentences` converts UTF-16 positions back to code points.
    It is a second written home for the offset unit, kept beside the rule, and it can drift from the rule.'
  node: rules/knowledge-base/chunk-offsets-count-code-points
- file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  where: The doc comment on `original_input`, lines 35-39 ("Capped at 10 MiB to match `content`."), above
    `.max(10 * 1024 * 1024, "original_input must not exceed 10 MiB")` on lines 40-44
  evidence: '"Verbatim user turn that triggered a chat-directed ingestion (TC-01 / BR-34). Omitted (or
    explicit `null`) on every non-chat path. Never factored into `content_hash`. Capped at 10 MiB to match
    `content`."'
  cost: The cap is stated a second time in prose beside the code that enforces it. If the node's bound
    moves, the comment keeps the old figure and nobody is told.
  node: rules/knowledge-base/original-input-length
- file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  where: The docstring on IngestRawInformationRequestSchema, lines 16-18 (the `content` bullet), above
    `.max(10 * 1024 * 1024, "content must not exceed 10 MiB")` on line 30
  evidence: '"- `content`: minLength 1 (empty document is meaningless), maxLength 10 MiB in code points
    — the Fastify `bodyLimit` of 11 MiB on the route is a coarser pre-filter; this Zod check is the precise
    contract from A5."'
  cost: The prose says the 10 MiB cap counts code points. The node counts UTF-16 code units, and the `.max(10
    * 1024 * 1024)` call is what actually enforces it. A reader who trusts the comment will believe astral-plane
    characters count once when they count twice. The prose also names "A5" as the authority in place of
    the node.
  node: rules/knowledge-base/content-length
- file: src/modules/ingestion/dto/raw-information.dto.ts
  where: line 11, the doc comment above ChunkLocatorSchema
  evidence: /** Optional readable anchor (page/line/speaker/ts) — shape per A23. */
  cost: The comment lists the locator's keys and cites "A23", a reference into the old v6/v7 document,
    as the authority for the shape. A reader who follows it lands in a document the specification has
    superseded, not in the node. The keys are already declared by the schema below it, so the comment
    is a second home for a fact that the code and the node both hold.
  node: domain/knowledge-base/chunk-locator
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of RecentIngestionRow, lines 38-44
  evidence: '`content_preview` is the first 80 code points of the raw text — enough for an operator to
    recognise a document after a client timeout without shipping the whole content back.'
  cost: The 80-character preview is held in the code as `left(ri.content, 80) AS content_preview` in this
    file's findRecentIngestions. The docstring says it a second time, and it also says "code points" where
    the contract says "characters". When the contract moves, this prose is not rebound with it and keeps
    stating the old value.
  node: contracts/knowledge-base/ingestion
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of aggregateToolCallOutcomes, lines 111-118
  evidence: '`orphaned_fragments`, the count of this run''s `proposed` fragments with no provenance row
    (uncited → unsearchable; recall-gap signal). Defined identically to the retry orphan-cleanup in `retryLlmRunRow`
    (BR-10).'
  cost: The definition of an orphaned fragment and the summary's count of them are both held by the SQL
    in this same function (`AND status = 'proposed'` and `NOT IN (SELECT fragment_id FROM provenance ...)`).
    The docstring restates them and adds a rationale ("unsearchable; recall-gap signal") that no node
    states.
  node: rules/knowledge-base/summary-counts-orphaned-fragments
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of findRecentIngestions, lines 59-63
  evidence: '`limit` is validated (1..50) at the toolset boundary before it reaches here.'
  cost: The 1..50 bound is enforced by code in another file, `.min(1).max(50).default(10)` in src/modules/ingestion/mcp/mcp-schemas.ts.
    Stated here as prose, it is a third copy of the bound. A reader of this repository file takes the
    comment for the place the bound lives, and it is not.
  node: rules/knowledge-base/recent-ingestions-limit-bounds
- file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the docstring of retryLlmRunRow, lines 165-171, and the comment at lines 188-189
  evidence: In the same transaction, orphan `proposed` fragments of this run are flipped to `rejected`.
  cost: The rejection of a run's orphaned fragments on retry is held by the second `UPDATE information_fragment
    SET status = 'rejected'` in this function. The docstring and the inline comment say it again, citing
    BR-10 and BR-11, so a reader looks for the rule in the code's citations rather than in the nodes.
  node: rules/knowledge-base/retry-rejects-orphaned-fragments
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the docstring of ingestRawInformation, "Idempotent no-op path" (lines 87-93), and the comment
    at lines 122-124
  evidence: '* Idempotent no-op path (UC-01 alt 4a): *   - Re-read the existing raw_information by content_hash.
    // chat-directed path. `content_hash` is computed above over `content` // only — `original_input`
    never affects idempotency.'
  cost: 'The rule that held content records nothing new is stated in prose, and the code behind it is
    also in this file: the `isUniqueViolation(err, RAW_INFORMATION_CONTENT_HASH_CONSTRAINT)` branch into
    `noopExisting`. The prose can drift from the node unnoticed.'
  node: rules/knowledge-base/held-content-records-nothing
- file: src/modules/ingestion/service/ingestion.service.ts
  where: the docstring of ingestRawInformation, happy path steps 1 and 2 (lines 80-81)
  evidence: '* 1. Compute `content_hash = sha256(content)`. *   2. Compute `idempotency_key = sha256(content_hash
    ∥ prompt_version ∥ model ∥ chunking_version)`.'
  cost: The two digest definitions are written a second time as prose in the service. Code holds them
    in `sha256Hex` and `composeIdempotencyKey` in `../hash.js` (`createHash("sha256").update(content,
    "utf8").digest("hex")`). The service also calls both, at lines 103-109. If a node moves, the docstring
    keeps saying the old definition and no check reaches it.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/query-retrieval/repository/fts-config.ts
  where: the header comment line 9 and the docstring on FTS_NAME_CONFIG, line 20
  evidence: '"//   - `simple_unaccent_v1` — names: unaccent without stemming." and "/** FTS config for
    entity names: unaccent without stemming (`simple_unaccent_v1`). */"'
  cost: The alias rule (no language stemming, accents disregarded) is restated in prose. The constant
    `FTS_NAME_CONFIG` and the `simple_unaccent_v1` configuration in the migration already hold it in code,
    so the comment is a second home that nothing keeps in step with the node.
  node: rules/knowledge-base/alias-matching
- file: src/modules/query-retrieval/repository/fts-config.ts
  where: the header comment, lines 6-8, and the docstring on FTS_PROSE_CONFIG, line 17
  evidence: '"//   - `pt_unaccent_v1`     — prose: stemming pt + unaccent." and "/** FTS config for prose:
    stemming pt + unaccent (`pt_unaccent_v1`). */"'
  cost: The fact that prose is matched with Portuguese stemming and without regard to accents is stated
    a second time in prose. The constant `FTS_PROSE_CONFIG = "pt_unaccent_v1"` already holds it in code,
    and the configuration itself is defined in migrations/0001_init.sql (`CREATE TEXT SEARCH CONFIGURATION
    pt_unaccent_v1 (COPY = portuguese)`). If the node changes, these comments keep saying the old rule
    and nothing reads them.
  node: rules/knowledge-base/prose-matching
- file: src/modules/query-retrieval/repository/search.repository.ts
  where: The docblock above listProvenanceForNodes (lines 318-341) and the strategy comment inside it
    (lines 349-351).
  evidence: '"joining to ANY accepted fragment whose `text_search` matches the canonical name" and "surface
    the provenance of every fragment whose text contains the node''s canonical_name token (subset of accepted
    fragments that mention the node)". The code beside them matches on the alias instead: "AND f.text_search
    @@ plainto_tsquery($1::regconfig, na.alias_norm)".'
  cost: 'The prose says which fragments "mention" a node, and the code decides this differently: through
    every alias''s normalized form, not the canonical name. The code also holds the fact in this file,
    with the FTS_PROSE_CONFIG binding. A reader who trusts the comment will look for the canonical-name
    match, which does not exist, and will misjudge which fragments support a node hit.'
  node: rules/knowledge-base/prose-matching
pairs_omitted:
- node: rules/knowledge-base/chunk-index-follows-content
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunking-version
  file: src/modules/ingestion/chunker/v1.ts
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
- node: rules/knowledge-base/email-header-block
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/email-quote-blocks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/long-block-sentence-chunks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/long-sentence-own-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/pdf-blocks-at-form-feeds
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/short-block-one-chunk
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/turn-blocks
  file: src/modules/ingestion/chunker/v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/undivided-sources
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
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/content-hash-is-sha256
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/content-length
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/original-input-length
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/content-hash-is-sha256
  file: src/modules/ingestion/dto/raw-information.dto.ts
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
- node: domain/knowledge-base/valid-from-basis
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/attribute-key-for-node-type
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-value-in-allowed-values
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
- node: rules/knowledge-base/stated-start-requires-basis
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/repository/ingestion.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/run-status
  file: src/modules/ingestion/repository/ingestion.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-listing-order
  file: src/modules/ingestion/repository/ingestion.repository.ts
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
- node: rules/knowledge-base/refused-proposal-records-only-its-tool-call
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
- node: rules/knowledge-base/summary-counts-tool-calls
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
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/content-hash-is-sha256
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/content-hash-unique
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/directed-turn-is-original-input
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/held-content-records-nothing
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/idempotency-key-unique
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/ingestion-records-chunks-and-run
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/alias-matching
  file: src/modules/query-retrieval/repository/fts-config.ts
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
- node: rules/knowledge-base/provenance-in-recording-order
  file: src/modules/query-retrieval/repository/provenance.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/retrieval-is-lexical-only
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-status
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/alias-matching
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-layer-matches-current-chunks
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-layer-matches-accepted-only
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/layer-weights
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-layer-matches-through-aliases
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-layer-skips-merged-and-deleted
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/provenance-in-recording-order
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  file: src/modules/query-retrieval/repository/search.repository.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/retrieval
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/accepted-fragment-filter
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/information-fragment
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/listing-total-before-pagination
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/listing-for-unknown-source-is-empty
  file: src/modules/query-retrieval/service/accepted-fragments.service.ts
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
notes: "Judged by 13 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/reconcile-raw-chunk-rename-backend.returns/.\nA finding in src/modules/ingestion/chunker/v1.ts\
  \ names domain/knowledge-base/source-type, which no file of this set is bound to: the `SourceType` union,\
  \ lines 32-40: /** Source type discriminator — mirrors the PostgreSQL `source_type` enum. */ export\
  \ type SourceType =\n  | \"pdf\"\n  | \"email\"\n  | \"ata\"\n  | \"chat\"\n  | \"artigo\"\n  | \"transcricao\"\
  \n  | \"outro\"; — The source-type vocabulary is declared a second time here. `src/modules/ingestion/dto/source-type.ts`\
  \ already declares it as `SourceTypeSchema = z.enum([...])` with `export type SourceType = z.infer<typeof\
  \ SourceTypeSchema>`. The node `domain/knowledge-base/source-type` is not bound to this file. If a value\
  \ is added or renamed, `--check` never reaches this union. The `switch` in `splitByHardBoundaries` then\
  \ fails to type-check, or silently misses the new value, depending on which copy moved.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/modules/ingestion/chunker/v1.ts names rules/knowledge-base/speaker-line,\
  \ which no file of this set is bound to: `SPEAKER_LINE_REGEX`, line 351: const SPEAKER_LINE_REGEX =\
  \ /^\\s*(?:[[(]\\d{1,2}:\\d{2}(?::\\d{2})?[\\])][\\s\\t]+)?[A-Za-zÀ-ÿ0-9_]+(?:\\s[A-Za-zÀ-ÿ0-9_]+)?:\\\
  s/; — The node lists exactly four time stamp forms: \"[h:mm], [hh:mm], (hh:mm) or (hh:mm:ss)\". The\
  \ regex accepts any bracket pair with a one- or two-digit hour and an optional seconds part. That admits\
  \ forms such as `(h:mm)`, `[hh:mm:ss]` and the mixed `[12:00)`, so a line the node says is not a speaker\
  \ line opens a new block. The regex's letter class `A-Za-zÀ-ÿ` is also narrower than the node's \"letters\"\
  . It excludes letters outside Latin-1 and includes `×` and `÷`. Block edges, and so chunk edges and\
  \ offsets, then differ from what the specification decided.. It blocks nothing here; it is owed a route\
  \ of its own.\nA finding in src/modules/query-retrieval/repository/fts-config.ts names rules/knowledge-base/alias-matching,\
  \ which no file of this set is bound to: the declaration of FTS_NAME_CONFIG, line 21: export const FTS_NAME_CONFIG\
  \ = \"simple_unaccent_v1\" as const; — This constant declares which configuration matches aliases. That\
  \ is the rule held by rules/knowledge-base/alias-matching, a node outside this file's node set and not\
  \ bound to this file. When the alias rule changes, `--check` does not reach this file. The next reader\
  \ looks in the specification for the configuration name and does not find it.. It blocks nothing here;\
  \ it is owed a route of its own.\nCandidates: 14 opened across 8 of 13 delegation(s); each return lists\
  \ its own under `candidates_opened`.\nUnstated: 4 fact(s) the source states that no node holds, over\
  \ 3 file(s), listed under `unstated`. They block no binding here and no rebind closes them — the route\
  \ is the analysis that gives each fact a node.\nRestates: 19 place(s) where text in the source restates\
  \ a node's fact the code holds, over 7 file(s), listed under `restates`. The pair conforms, so none\
  \ blocks a binding — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-raw-chunk-rename-backend.returns/`, which are the evidence behind every entry above.
