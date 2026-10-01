---
contract_version: siegard-reconcile/8
title: Certification of the content-hash and default-prompt-version rules against the offered unit tests
summary: The source did not change; the owner offers hash.spec.ts, service.spec.ts and original-input-capture.spec.ts,
  run by the registry's step test, as the proof of rules/knowledge-base/content-hash-is-sha256, and ingest-document-handler.spec.ts
  and extraction-prompt-v4.spec.ts, run by the same step, as the proof of rules/knowledge-base/default-prompt-version;
  this reconciliation reads the six files bound to the two rules against their nodes while the auditor
  judges the proofs.
target: backend
files:
- path: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  change: Unchanged; declares the ingest-raw-information request and response shapes, the response carrying
    content_hash as 64 lowercase hexadecimal characters.
- path: src/modules/ingestion/dto/raw-information.dto.ts
  change: Unchanged; declares the raw information and raw chunk response shapes, content_hash among them.
- path: src/modules/ingestion/hash.ts
  change: Unchanged; computes content_hash as the SHA-256 of the content's UTF-8 bytes in lowercase hexadecimal
    and composes the idempotency key.
- path: src/modules/ingestion/mcp/ingest-document.handler.ts
  change: Unchanged; applies DEFAULT_PROMPT_VERSION when an ingest_document call names no prompt version.
- path: src/modules/ingestion/prompts/index.ts
  change: Unchanged; declares DEFAULT_PROMPT_VERSION as the v4 prompt's version and selects the prompt
    module for a version.
- path: src/modules/ingestion/service/ingestion.service.ts
  change: Unchanged; derives content_hash from the content with sha256Hex and ingests or answers noop_existing
    on it.
nodes:
- node: rules/knowledge-base/content-hash-is-sha256
  conforms: true
  how: 'src/modules/ingestion/dto/ingest-raw-information.dto.ts: held at IngestRawInformationResponseSchema,
    the content_hash field (line 68). It declares the 64-lowercase-hexadecimal shape of the hash this
    response returns. — content_hash: z.string().regex(/^[0-9a-f]{64}$/),

    src/modules/ingestion/dto/raw-information.dto.ts: held at the `content_hash` field of RawInformationResponseSchema,
    line 28. Only the format half of the rule is held there: 64 lowercase hexadecimal characters. This
    file declares the response shape and does not compute the digest. — content_hash: z.string().regex(/^[0-9a-f]{64}$/),

    src/modules/ingestion/hash.ts: held at sha256Hex, line 17. — return createHash("sha256").update(content,
    "utf8").digest("hex");

    src/modules/ingestion/service/ingestion.service.ts: held at Line 103, the call that derives the hash.
    This file declares no digest or encoding of its own and delegates to sha256Hex in src/modules/ingestion/hash.ts.
    — "const contentHash = sha256Hex(input.content);" in this file. In hash.ts, which I read only to attribute
    the call: "return createHash("sha256").update(content, "utf8").digest("hex");". The hash is computed
    over input.content alone, and original_input is passed separately and never hashed.'
  encoded_at:
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/dto/raw-information.dto.ts
  - src/modules/ingestion/hash.ts
  - src/modules/ingestion/service/ingestion.service.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'One input: a raw information ingested with non-ASCII content, for example "Olá — mundo".
    One expected result: its persisted content_hash equals the SHA-256 digest of that content''s UTF-8
    bytes, computed independently (node:crypto with "utf8"), as 64 lowercase hexadecimal characters. The
    test should be dedicated to that assertion and not ride on an outcome check.'
- node: rules/knowledge-base/default-prompt-version
  conforms: true
  how: 'src/modules/ingestion/mcp/ingest-document.handler.ts: held at The `prompt_version` field of the
    body in ingestDocumentHandler, line 120. The default is DEFAULT_PROMPT_VERSION, imported from ../prompts/index.js.
    That constant is declared in prompts/index.ts as v4.PROMPT_VERSION, whose value is "v4". — prompt_version:
    input.prompt_version ?? DEFAULT_PROMPT_VERSION,

    src/modules/ingestion/prompts/index.ts: held at the exported constant DEFAULT_PROMPT_VERSION, line
    63. It is applied to a request that names no version in src/modules/ingestion/mcp/ingest-document.handler.ts,
    line 120, outside this file. — export const DEFAULT_PROMPT_VERSION: string = v4.PROMPT_VERSION; (extraction.v4.ts
    declares `export const PROMPT_VERSION = "v4" as const;`)'
  encoded_at:
  - src/modules/ingestion/mcp/ingest-document.handler.ts
  - src/modules/ingestion/prompts/index.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: one document ingestion that names no prompt version, driven through extraction
    against a stub LLM provider. Expected result: the run records prompt_version ''v4'', and the system
    prompt sent to the provider equals the v4 module''s system(snapshot). Only the collaborator at the
    provider boundary should be stubbed, so the test does not pin the argument of an internal ingestRaw
    call.'
unstated:
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: DEFAULT_INGEST_MODEL (line 49) and its use in the body of ingestDocumentHandler (line 119)
  evidence: 'export const DEFAULT_INGEST_MODEL = "claude-sonnet-4-6"; ... model: input.model ?? deps.ingestModel
    ?? DEFAULT_INGEST_MODEL,'
  cost: When an ingest_document call names no model, the code decides that the run is recorded and extracted
    under claude-sonnet-4-6. The specification does not hold that choice. The default-prompt-version rule
    covers only the prompt version. The ingestion contract refuses a missing model for ingest-raw-information,
    and its ingest-document operation lists no such refusal and no default. The next reader will look
    in the specification for which model an unnamed call uses and will not find it.
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: 'The already_ingested result, lines 177-189, the `message` field and the `run_status: runStatus
    ?? null` field'
  evidence: "message: completed\n  ? \"This exact content was already ingested and its extraction completed;\
    \ returning the existing run. No new extraction was triggered.\"\n  : `This exact content was already\
    \ ingested, but its run is '${runStatus ?? \"unknown\"}' (not completed) — the prior extraction did\
    \ not finish. No new extraction was triggered; recovery requires re-running that LLMRun.`,"
  cost: This text is emitted to the caller and tells it that a non-completed run needs recovery by re-running
    the LLMRun. The accepted answer in the specification lists only the identities, the chunk count and
    the run's status. It holds neither the message nor the guidance, nor the null status when the read
    fails. Callers act on this guidance and the specification does not hold it.
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: The catch around the intake transaction, lines 130-154, in its non-pg-unavailable branch
  evidence: 'code: "SYSTEM_INTERNAL_ERROR", message: "Failed to persist the document before extraction.",'
  cost: The code makes an intake failure a refusal of ingest-document. It answers SYSTEM_INTERNAL_ERROR
    with a message and no failed run. The specification's refusals for ingest-document (content length,
    source type, repeated system errors, unknown prompt version, provider failure) list no intake failure.
    A person reading the contract cannot learn what the tool says when persistence fails.
- file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: The final catch of the extraction try block, lines 246-263
  evidence: 'code: "SYSTEM_INTERNAL_ERROR", message: "Unexpected error during document ingestion.", details:
    { llm_run_id, raw_information_id },'
  cost: For any extraction error that is not a provider or extraction fatal, the code answers a refusal
    with a message and details carrying two identities. The specification's SYSTEM_INTERNAL_ERROR answers
    for this operation cover only repeated system errors and an unknown prompt version, both "carrying
    the failed run". This catch-all answer and its message are held only here.
restates:
- file: src/modules/ingestion/hash.ts
  where: The docstring above composeIdempotencyKey (lines 20-27). The node is outside the file's set.
    I found it by searching the specification root, and the candidate index does not list it.
  evidence: '"`idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`, concatenated
    WITHOUT a separator. The order is exactly as defined in §8 of v7 and as documented in `ingestion.back.md`
    BR-08."'
  cost: The key's composition and operand order is stated again in prose. The code holds it too, as the
    four `h.update(...)` calls in that order. The prose cites v7 §8 and a back-spec as authorities instead
    of the node, so a reader is sent to documents that are not the specification.
  node: rules/knowledge-base/idempotency-key
- file: src/modules/ingestion/hash.ts
  where: The file header comment (lines 1-6) and the docstring above sha256Hex (lines 10-15).
  evidence: '"Both produce a 64-char lowercase hex string. UTF-8 encoding is explicit on every `.update()`
    so the result is portable across platforms with different default encodings." and "`sha256(content)`
    -- 64 char lowercase hex string."'
  cost: The SHA-256 / UTF-8 / 64-lowercase-hex rule is written a second time as prose that no running
    system emits. If the node changes, this text stays behind and says something the node no longer says.
    The code (`createHash("sha256").update(content, "utf8").digest("hex")`) already holds the fact.
  node: rules/knowledge-base/content-hash-is-sha256
- file: src/modules/ingestion/prompts/index.ts
  where: the docstring above DEFAULT_PROMPT_VERSION, line 62
  evidence: '"/** Recommended version for NEW runs — callers SHOULD send this at intake. */"'
  cost: 'The node says an ingestion that names no prompt version runs under v4. The prose says the default
    is only a recommendation that callers should send. A reader who trusts it would look for the default
    at each caller. The default is in fact applied in src/modules/ingestion/mcp/ingest-document.handler.ts
    line 120: `prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION`. The prose is a weaker
    second statement of the node, and no running system emits it.'
  node: rules/knowledge-base/default-prompt-version
- file: src/modules/ingestion/prompts/index.ts
  where: the opening comment block, lines 1-15, and the docstring above selectPromptModule, lines 83-87
  evidence: '"An unknown version is a configuration error, NOT a silent fallback: BR-26 step 2 mandates
    "load the extraction.${prompt_version} module; fail with 500 SYSTEM_INTERNAL_ERROR if the module is
    missing"."'
  cost: The rule that an extraction's prompt version must be one the system holds is stated a second time
    in prose. The prose also quotes a BR-26 status code, so a reader can take the comment for where the
    rule is decided and not look at the node. The code (`if (module === undefined) { throw new UnknownPromptVersionError(promptVersion);
    }`) already enforces the rule, so the comment adds nothing and can only drift from the node.
  node: rules/knowledge-base/prompt-version-known
- file: src/modules/ingestion/service/ingestion.service.ts
  where: The docstring of ingestRawInformation, step 2 of the happy path (line 81).
  evidence: '" *   2. Compute `idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`."'
  cost: The prose states the idempotency key's composition a second time, outside behavior. The code holds
    the fact in composeIdempotencyKey (src/modules/ingestion/hash.ts), which hashes content_hash, prompt_version,
    model and chunking_version in that order with no separator. If the rule moves, this docstring keeps
    saying the old composition and no tool reaches it.
  node: rules/knowledge-base/idempotency-key
pairs_omitted:
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-chunk
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/ingestion/dto/ingest-raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: domain/knowledge-base/raw-chunk
  file: src/modules/ingestion/dto/raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/ingestion/dto/raw-information.dto.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/idempotency-key
  file: src/modules/ingestion/hash.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/document-ingestion-extracts-new-content
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/held-content-records-nothing
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/prompt-version-known
  file: src/modules/ingestion/prompts/index.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-chunk
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/raw-information
  file: src/modules/ingestion/service/ingestion.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
notes: "Judged by 6 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/certify-content-hash-default-prompt.returns/.\nCertification of rules/knowledge-base/content-hash-is-sha256\
  \ did not hold: the auditor answered `partial` — The hash function is proven on its own. In hash.spec.ts,\
  \ sha256Hex is checked for 64 lowercase hex characters, and on the non-ASCII input \"Olá mundo\" it\
  \ is compared against node:crypto SHA-256 over the UTF-8 bytes. One test ties that function to a raw\
  \ information on purpose: \"(c.regression)\" checks that the content_hash written on insert equals sha256Hex(content).\
  \ Its content is \"[f1] Rodrigo lidera o Projeto Apollo.\\n-- nonce=abc\", which is pure ASCII, and\
  \ ASCII has the same bytes in UTF-8, latin1 and similar encodings. So on the raw information path, the\
  \ UTF-8 half of the fact is asserted only incidentally. In service.spec.ts, the two tests whose content\
  \ carries a non-ASCII em dash (\"Ata Apollo de teste — go-live em 2026-07-15.\") compare content_hash\
  \ against sha256Hex(content). The first does it as a self-described \"sanity check\" while testing the\
  \ created outcome. The second does it while testing the noop_existing outcome. Nothing marks either\
  \ assertion as load-bearing, and both will change the day those outcome assertions change. A raw information\
  \ whose content is hashed under some encoding other than UTF-8 is therefore caught only by those incidental\
  \ assertions. \"is deterministic\" in hash.spec.ts was read and bears on no part of the fact.. The node\
  \ is decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: One input: a raw information ingested with non-ASCII content,\
  \ for example \"Olá — mundo\". One expected result: its persisted content_hash equals the SHA-256 digest\
  \ of that content's UTF-8 bytes, computed independently (node:crypto with \"utf8\"), as 64 lowercase\
  \ hexadecimal characters. The test should be dedicated to that assertion and not ride on an outcome\
  \ check..\nCertification of rules/knowledge-base/default-prompt-version did not hold: the auditor answered\
  \ `partial` — The two tests together prove only that the version is recorded. The handler test submits\
  \ a document with no prompt_version. It then checks that the body passed to the injected ingestRaw collaborator\
  \ carries prompt_version equal to the DEFAULT_PROMPT_VERSION constant. The registry test checks that\
  \ this constant is 'v4'. Together they would fail if an ingestion naming no version recorded something\
  \ other than v4. However, the handler test checks this through the argument of an injected collaborator's\
  \ call. That binds where the default is applied, not what the ingestion ends up with: if the default\
  \ were applied inside ingestRaw, the behaviour would be correct and the test would fail. The fact is\
  \ that the ingestion \"runs under v4\", and that part goes unexercised. In the handler test, runExtraction\
  \ is a mock, so nothing in the offered proof runs an extraction for an ingestion that named no version\
  \ and observes which prompt the run used. The dispatch test shows that selectPromptModule('v4') returns\
  \ the v4 module. Nothing shows that the run created for a version-less ingestion is dispatched through\
  \ it. The only entry point the proof exercises is the ingest_document MCP handler. If another ingestion\
  \ path accepts a document without a prompt version, nothing in the offered proof covers that path's\
  \ default.. The node is decided by reading, and a certification standing on it from an earlier reconciliation\
  \ is released by the bind. The remainder is testable: Input: one document ingestion that names no prompt\
  \ version, driven through extraction against a stub LLM provider. Expected result: the run records prompt_version\
  \ 'v4', and the system prompt sent to the provider equals the v4 module's system(snapshot). Only the\
  \ collaborator at the provider boundary should be stubbed, so the test does not pin the argument of\
  \ an internal ingestRaw call..\nA finding in src/modules/ingestion/dto/raw-information.dto.ts names\
  \ domain/knowledge-base/raw-chunk, which no file of this set is bound to: ChunkLocatorSchema (lines\
  \ 11-19), used as the `locator` field of RawChunkResponseSchema (line 44): export const ChunkLocatorSchema\
  \ = z\n  .object({\n    page: z.number().int().nullable().optional(),\n    line: z.number().int().nullable().optional(),\n\
  \    speaker: z.string().nullable().optional(),\n    ts: z.string().nullable().optional(),\n  })\n \
  \ .nullable();\nThe node declares: \"- name: locator\\n  type: string\". Its decision log gives the\
  \ reason: \"The retrieval only passes the locator through to the owner.\" — A chunk's locator is declared\
  \ here as an object with four named keys (page, line, speaker, ts). The node holds it as an opaque string\
  \ that is only passed through. The keys, their types and their nullability now live only in this file.\
  \ A reader who goes to the specification for the locator's shape finds a string. A locator that is a\
  \ plain string, as the node states, would fail this schema on read.. It blocks nothing here; it is owed\
  \ a route of its own.\nA finding in src/modules/ingestion/dto/raw-information.dto.ts names domain/knowledge-base/raw-information,\
  \ which no file of this set is bound to: the `metadata` field of RawInformationResponseSchema, line\
  \ 30: metadata: z.record(z.string(), z.unknown()), The node declares: \"- name: metadata\\n  type: string\"\
  . Its decision log gives the reason: \"The retrieval only passes the metadata through to the owner and\
  \ reads nothing inside it.\" — The response shape treats metadata as a key-value object. The node holds\
  \ it as an opaque string. A reader of the specification would not expect the object shape, and a change\
  \ to either side would not reach the other.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/modules/ingestion/service/ingestion.service.ts names contracts/knowledge-base/ingestion,\
  \ which no file of this set is bound to: The no-op branch: the catch at line 128-130 calls noopExisting(client,\
  \ contentHash, idempotencyKey), and noopExisting looks the run up by the request-derived key at lines\
  \ 215-222.: \"const run = await findLlmRunByIdempotencyKey(client, idempotencyKey);\n  if (run === null)\
  \ {\n    throw new InvariantError(\n      `noopExisting: raw_information ${existing.id} exists for content_hash\
  \ ${contentHash} ` +\n        `but no llm_run row matches idempotency_key ${idempotencyKey}. ` +\n \
  \       `Database is inconsistent — BR-09 invariant violated.`\" — The node answers a re-ingestion of\
  \ held content with HTTP 200 noop_existing and the run the held raw information already has, \"whatever\
  \ model or prompt version the request names\". The key is composed from the request's own model and\
  \ prompt_version, so held content re-sent under a different model or prompt version matches no run.\
  \ The service throws InvariantError (a 500) instead of answering 200. The decision log beside the node\
  \ records this as the exact behavior to correct. The code still treats it as a database inconsistency,\
  \ so a client re-sending known content under a new model gets an internal error where the business decided\
  \ a no-op.. It blocks nothing here; it is owed a route of its own.\nCandidates: 8 opened across 5 of\
  \ 6 delegation(s); each return lists its own under `candidates_opened`.\nUnstated: 4 fact(s) the source\
  \ states that no node holds, over 1 file(s), listed under `unstated`. They block no binding here and\
  \ no rebind closes them — the route is the analysis that gives each fact a node.\nRestates: 5 place(s)\
  \ where text in the source restates a node's fact the code holds, over 3 file(s), listed under `restates`.\
  \ The pair conforms, so none blocks a binding — the route is removing the text, and reconciling the\
  \ file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/certify-content-hash-default-prompt.returns/`, which are the evidence behind every entry above.
