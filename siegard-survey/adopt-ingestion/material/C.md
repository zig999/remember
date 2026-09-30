---
contract_version: siegard-survey/0-prototype
target: backend
files:
  - src/modules/ingestion/dto/index.ts
  - src/modules/ingestion/dto/ingest-raw-information.dto.ts
  - src/modules/ingestion/dto/llm-run.dto.ts
  - src/modules/ingestion/dto/propose-attribute.dto.ts
  - src/modules/ingestion/dto/propose-fragment.dto.ts
  - src/modules/ingestion/dto/propose-link.dto.ts
  - src/modules/ingestion/dto/propose-node.dto.ts
  - src/modules/ingestion/dto/raw-information.dto.ts
  - src/modules/ingestion/dto/source-type.ts
  - src/modules/ingestion/validation/confidence.ts
  - src/modules/ingestion/validation/errors.ts
  - src/modules/ingestion/validation/graph-rules.ts
  - src/modules/ingestion/validation/structural.ts
  - src/modules/ingestion/validation/temporal.ts
read_outside_area:
  - None.
---

## Facts
### Raw information ingestion request
- The request needs a source type from the closed source-type set. `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`IngestRawInformationRequestSchema.source_type`).
- Content is required. It must be at least 1 character and at most 10 × 1024 × 1024 characters, counted by JavaScript string length. A whitespace-only content passes the schema. `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`content: z.string().min(1).max(10 * 1024 * 1024)`).
- The storage reference is optional. It accepts any string or null, and the schema puts no further limit on it. `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`storage_ref: z.string().nullable().optional()`).
- Metadata is a free-form object with string keys and values of any type. It defaults to an empty object when omitted. `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`metadata: z.record(...).default({})`).
- The model and the prompt version are required, and each must be a non-empty string. `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`model`, `prompt_version`).
- The original input is optional. It accepts a string of at most 10 × 1024 × 1024 characters, or null. `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`original_input`).
- The ingestion response carries these fields:
  - an outcome (`created` or `noop_existing`)
  - a raw information UUID
  - a content hash of 64 lowercase hexadecimal characters
  - a positive chunk count
  - a list of chunk references, each with a UUID, a non-negative chunk index, a non-negative start offset and a positive end offset
  - a run UUID
  - an idempotency key of 64 lowercase hexadecimal characters

  `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`IngestRawInformationResponseSchema`, `ChunkRefSchema`).

### Raw information and chunk reads
- A raw information read returns these fields:
  - a UUID
  - the source type
  - the content
  - the storage reference (string or null)
  - a content hash of 64 lowercase hexadecimal characters
  - the received-at time as a datetime with offset
  - the metadata object

  `src/modules/ingestion/dto/raw-information.dto.ts` (`RawInformationResponseSchema`).
- A chunk read returns these fields:
  - a UUID and the owning raw information UUID
  - a non-negative chunk index
  - the text
  - a non-negative start offset and a positive end offset
  - a locator, or null
  - a chunking version string

  `src/modules/ingestion/dto/raw-information.dto.ts` (`RawChunkResponseSchema`).
- A locator has four optional fields: page (integer or null), line (integer or null), speaker (string or null) and ts (string or null). `src/modules/ingestion/dto/raw-information.dto.ts` (`ChunkLocatorSchema`).
- The chunk listing returns a non-negative total and the items. It carries no limit or offset. `src/modules/ingestion/dto/raw-information.dto.ts` (`ListRawChunksResponseSchema`).

### LLM run reads, tool-call listing, retry
- A run carries these fields:
  - a UUID, the model and the prompt version
  - started-at, and finished-at (datetime with offset, or null)
  - a status from the run-status set
  - a positive attempt count
  - the input raw information UUID
  - an idempotency key of 64 lowercase hexadecimal characters
  - a summary
  - optionally, the affected nodes

  `src/modules/ingestion/dto/llm-run.dto.ts` (`LlmRunResponseSchema`).
- The run summary always carries 9 non-negative integer counters. Eight are the outcome buckets: accepted, consolidated, superseded_previous, needs_review, uncertain, disputed, rejected and error. The ninth is orphaned_fragments. `src/modules/ingestion/dto/llm-run.dto.ts` (`LlmRunSummarySchema`).
- Each affected node carries a UUID, a canonical name and a node type name. `src/modules/ingestion/dto/llm-run.dto.ts` (`AffectedNodeSchema`).
- A tool-call entry carries these fields:
  - a UUID and the run UUID
  - a tool name from the ingest-tool set
  - the arguments object
  - a result object, or null
  - a validation outcome
  - created-at

  `src/modules/ingestion/dto/llm-run.dto.ts` (`ToolCallResponseSchema`).
- The tool-call listing is paginated. The limit is coerced to an integer between 1 and 100 and defaults to 50. The offset is coerced to an integer of at least 0 and defaults to 0. The response returns the total, the limit, the offset and the items. `src/modules/ingestion/dto/llm-run.dto.ts` (`ListToolCallsQuerySchema`, `ListToolCallsResponseSchema`).
- The retry body is optional and defaults to an empty object. It may carry a reason of at most 500 characters. `src/modules/ingestion/dto/llm-run.dto.ts` (`RetryLlmRunRequestSchema`).

### Propose fragment
- The claim text is 1 to 1000 characters. `src/modules/ingestion/dto/propose-fragment.dto.ts` (`text`).
- The confidence is a number from 0 to 1 inclusive. `src/modules/ingestion/dto/propose-fragment.dto.ts` (`confidence`).
- Chunk ids are a list of at least one UUID. `src/modules/ingestion/dto/propose-fragment.dto.ts` (`chunk_ids`).
- The result is a fragment id with the status `proposed`. `src/modules/ingestion/dto/propose-fragment.dto.ts` (`ProposeFragmentResult`).

### Propose node
- The node type is a non-empty string. `src/modules/ingestion/dto/propose-node.dto.ts` (`node_type`).
- The name is 1 to 500 characters. `src/modules/ingestion/dto/propose-node.dto.ts` (`name`).
- Aliases are optional. When given, each alias is 1 to 500 characters, and the list has no length bound. `src/modules/ingestion/dto/propose-node.dto.ts` (`aliases`).
- The result is a node id and a resolution from the node-resolution set. `src/modules/ingestion/dto/propose-node.dto.ts` (`ProposeNodeResult`).

### Propose link
- The source and target node ids are UUIDs. The link type is a non-empty string. `src/modules/ingestion/dto/propose-link.dto.ts` (`source_node_id`, `target_node_id`, `link_type`).
- The confidence is 0 to 1. Fragment ids are a list of at least one UUID. `src/modules/ingestion/dto/propose-link.dto.ts` (`confidence`, `fragment_ids`).
- `valid_from` and `valid_to` are optional and must match `YYYY-MM-DD`. The schema checks the pattern only, not calendar validity. `src/modules/ingestion/dto/propose-link.dto.ts` (`IsoDateSchema`).
- The date basis is optional and accepts only `stated` or `document`. `src/modules/ingestion/dto/propose-link.dto.ts` (`ValidFromBasisSchema`).
- The change hint defaults to `none`. `src/modules/ingestion/dto/propose-link.dto.ts` (`change_hint: ChangeHintSchema.default("none")`).
- The result is a link id (or null), an outcome, and optionally a superseded link id. It may also carry the reason `BELOW_CONFIDENCE_FLOOR`. `src/modules/ingestion/dto/propose-link.dto.ts` (`ProposeLinkResult`).

### Propose attribute
- The node id is a UUID. The key and the value are non-empty strings. `src/modules/ingestion/dto/propose-attribute.dto.ts` (`node_id`, `key`, `value`).
- Confidence, fragment ids, the date fields, the date basis and the change hint (default `none`) follow the same rules as propose link. `src/modules/ingestion/dto/propose-attribute.dto.ts` (`ProposeAttributeInputSchema`).
- The result is an attribute id (or null), an outcome, and optionally a superseded attribute id. It may also carry the reason `BELOW_CONFIDENCE_FLOOR`. `src/modules/ingestion/dto/propose-attribute.dto.ts` (`ProposeAttributeResult`).

### Attribute value parsing (by the key's value type)
- A `text` value accepts any string. `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue` case `text`).
- A `date` value must match `^\d{4}-\d{2}-\d{2}$`, and `Date.parse` of `<v>T00:00:00Z` must not be NaN. The pattern is checked first. `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue` case `date`).
- A `number` value must match `^-?\d+(?:\.\d+)?$`. That pattern allows no leading `+`, no exponent, no leading or trailing `.`, and no thousands separators. After the pattern, `parseFloat` must give a finite value, so digit strings long enough to overflow are refused. `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue` case `number`).
- A `bool` value must be exactly `true` or `false`, case-sensitive. `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue` case `bool`).

### Closed-domain attribute values
- When a key has a closed domain, the value must be in it by exact string equality: no trimming, no case-folding, no normalisation. `src/modules/ingestion/validation/structural.ts` (`assertValueInDomain`, `domain.has(value)`).
- On a miss, the refusal lists the allowed values sorted by the default JavaScript sort, which orders by UTF-16 code unit. `src/modules/ingestion/validation/structural.ts` (`[...domain].sort()`).

### Referenced rows and catalog membership
- A referenced row that does not exist is refused, naming the kind of entity and the id. `src/modules/ingestion/validation/structural.ts` (`assertFound`).
- A node type, link type or attribute key that is not in the catalog is refused with a code specific to that kind. `src/modules/ingestion/validation/structural.ts` (`assertKnownType`).

### Graph rule
- A link is allowed only when an active link-type rule exists for its source node type, link type and target node type. Whether the rule is active is evaluated against a "today" date passed in by the caller. `src/modules/ingestion/validation/graph-rules.ts` (`validateGraphRule`, `isLinkRuleActive`).

### Confidence routing (links and attributes)
- A confidence of 0.75 or more makes the assertion `active`. `src/modules/ingestion/validation/confidence.ts` (`routeConfidence`, `CONFIDENCE_UNCERTAIN_UPPER = 0.75`).
- A confidence from 0.40 up to, but not including, 0.75 makes the assertion `uncertain`. `src/modules/ingestion/validation/confidence.ts` (`CONFIDENCE_FLOOR = 0.4`).
- A confidence below 0.40 routes the assertion to `below_floor`. `src/modules/ingestion/validation/confidence.ts` (`routeConfidence`).
- For a proposal below the floor, the result's outcome is `rejected`, the id is null, and the reason is `BELOW_CONFIDENCE_FLOOR`. `src/modules/ingestion/dto/propose-link.dto.ts`, `src/modules/ingestion/dto/propose-attribute.dto.ts` (`reason?: "BELOW_CONFIDENCE_FLOOR"`).

### Temporal validation (links and attributes), in order of checks
- 1st (line 107): when both dates are given, `valid_from` must be strictly before `valid_to`. The two are compared as strings. `src/modules/ingestion/validation/temporal.ts` (`validateTemporal`).
- 2nd (line 118): a change hint of `correction` requires at least one cited fragment text to contain, case-insensitively, one of the errata markers. `src/modules/ingestion/validation/temporal.ts` (`hasErrataSignal`).
- 3rd (line 136): a `valid_from` given without a date basis is refused. This holds whether or not the type requires a start date. `src/modules/ingestion/validation/temporal.ts` (`validateTemporal`).
- 4th (line 143): when the type requires a start date and none was given, the fallback runs in this order:
  - If a document date exists, validation passes and both the date and the basis stay null.
  - Otherwise, if received-at has a `YYYY-MM-DD` prefix, the date resolves to that prefix with the basis `received`.
  - Otherwise, the proposal is refused.

  `src/modules/ingestion/validation/temporal.ts` (`validateTemporal`, `toIsoDate`).
- Otherwise the given date and basis are returned unchanged. `src/modules/ingestion/validation/temporal.ts` (`validateTemporal`).
- The date basis `received` is never accepted from a caller. Only the validator produces it. `src/modules/ingestion/dto/propose-link.dto.ts` (`ValidFromBasisSchema`), `src/modules/ingestion/validation/temporal.ts` (`TemporalResolved`).

### Validation failures
- Each failure carries a code from the closed error-code set, a message, and a details object that defaults to empty. `src/modules/ingestion/validation/errors.ts` (`ValidationFailure`).

### Tool descriptions (text the caller receives)
- The four propose tools each have a fixed description string. So do ingest_document, health, get_ingestion_status, list_recent_ingestions, start_async_ingestion and ingest_directed. The behavior those descriptions claim, other than what is listed above, is not implemented in this area. `src/modules/ingestion/dto/index.ts` (`IngestToolDescriptions`).

## Answers
- Every request schema in the area: a missing required field, a wrong type, a length or range bound, a UUID or pattern mismatch, or a value outside a closed set gets a schema rejection. Which code and status it becomes is decided outside this area. The failure codes this area declares include `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT` and `VALIDATION_OUT_OF_RANGE`. `src/modules/ingestion/dto/*.dto.ts` (Zod schemas), `src/modules/ingestion/validation/errors.ts` (`McpEnvelopeErrorCode`).
- raw information ingestion — content empty → schema rejection ("content must not be empty"). `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`content.min`).
- raw information ingestion — content over 10 MiB → schema rejection ("content must not exceed 10 MiB"). `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`content.max`).
- raw information ingestion — model empty or missing → schema rejection ("model is required"). `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`model`).
- raw information ingestion — prompt version empty or missing → schema rejection ("prompt_version is required"). `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`prompt_version`).
- raw information ingestion — original input over 10 MiB → schema rejection ("original_input must not exceed 10 MiB"). `src/modules/ingestion/dto/ingest-raw-information.dto.ts` (`original_input`).
- raw information ingestion — source type outside the closed set → schema rejection. `src/modules/ingestion/dto/source-type.ts`.
- tool-call listing — limit outside 1..100, a non-integer, or an offset below 0 → schema rejection. `src/modules/ingestion/dto/llm-run.dto.ts` (`ListToolCallsQuerySchema`).
- run retry — reason over 500 characters → schema rejection. `src/modules/ingestion/dto/llm-run.dto.ts` (`RetryLlmRunRequestSchema`).
- propose fragment — text empty or over 1000, confidence outside 0..1, chunk ids empty, or a chunk id that is not a UUID → schema rejection. `src/modules/ingestion/dto/propose-fragment.dto.ts`.
- propose node — node type empty, name empty or over 500, or an alias empty or over 500 → schema rejection. `src/modules/ingestion/dto/propose-node.dto.ts`.
- propose link / propose attribute — the date format is wrong → schema rejection ("valid_from / valid_to must be ISO YYYY-MM-DD"). `src/modules/ingestion/dto/propose-link.dto.ts`, `src/modules/ingestion/dto/propose-attribute.dto.ts` (`IsoDateSchema`).
- propose link / propose attribute — basis not `stated`/`document`, change hint not in its set, fragment ids empty, confidence outside 0..1, or an id that is not a UUID → schema rejection. `src/modules/ingestion/dto/propose-link.dto.ts`, `src/modules/ingestion/dto/propose-attribute.dto.ts`.
- propose attribute — date value does not match `YYYY-MM-DD` → `VALIDATION_INVALID_FORMAT` ("value does not parse as a date (YYYY-MM-DD expected)."; details value, value_type). `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue`).
- propose attribute — date value matches the pattern but `Date.parse` gives NaN → `VALIDATION_INVALID_FORMAT` ("value is not a calendar-valid date."; details value). `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue`).
- propose attribute — number value fails the pattern → `VALIDATION_INVALID_FORMAT` ("value does not parse as a number."; details value, value_type). `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue`).
- propose attribute — number value is not finite → `VALIDATION_INVALID_FORMAT` ("value is not a finite number."; details value). `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue`).
- propose attribute — bool value is not `true`/`false` → `VALIDATION_INVALID_FORMAT` ("value does not parse as a bool (expected 'true' or 'false')."; details value). `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue`).
- propose attribute — value outside the key's closed domain → `VALIDATION_INVALID_FORMAT` ("attribute value not in closed domain"; details value, allowed_values sorted). `src/modules/ingestion/validation/structural.ts` (`assertValueInDomain`).
- any propose — a referenced row is missing → `RESOURCE_NOT_FOUND` ("<entity> <id> not found."; details entity, id). `src/modules/ingestion/validation/structural.ts` (`assertFound`).
- propose node / link / attribute — the type is not in the catalog → `BUSINESS_UNKNOWN_NODE_TYPE` / `BUSINESS_UNKNOWN_LINK_TYPE` / `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` ("<kind> '<name>' is not in the seeded catalog."; details kind, name). `src/modules/ingestion/validation/structural.ts` (`assertKnownType`).
- propose link — no active rule for the source type, link type and target type → `BUSINESS_LINK_RULE_VIOLATION` ("No active link_type_rule authorises this (source_node_type, link_type, target_node_type) triple."; details source_node_type_id, link_type_id, target_node_type_id). `src/modules/ingestion/validation/graph-rules.ts` (`validateGraphRule`).
- propose link / attribute — `valid_from` is on or after `valid_to` → `BUSINESS_TEMPORAL_INCOHERENT` ("valid_from must be strictly before valid_to."; details valid_from, valid_to). This is raised first among the temporal checks (line 107). `src/modules/ingestion/validation/temporal.ts`.
- propose link / attribute — correction without an errata marker → `BUSINESS_TEMPORAL_INCOHERENT` ("change_hint = 'correction' requires errata textual evidence in at least one cited fragment."; details change_hint). Checked second (line 118). `src/modules/ingestion/validation/temporal.ts`.
- propose link / attribute — `valid_from` without a basis → `BUSINESS_DATE_UNJUSTIFIED` ("valid_from supplied without a valid_from_basis (stated | document | received)."; details valid_from). Checked third (line 136). `src/modules/ingestion/validation/temporal.ts`.
- propose link / attribute — the type requires a start date, and there is no `valid_from`, no document date and no usable received-at → `BUSINESS_DATE_UNJUSTIFIED` ("link_type / attribute_key requires_valid_from = true but no date is available (stated, document_date, and received_at are all absent)."; details requires_valid_from). Checked fourth (line 168). `src/modules/ingestion/validation/temporal.ts`.
- propose link / attribute — confidence below 0.40 → not an error: the result is an ok with outcome `rejected`, reason `BELOW_CONFIDENCE_FLOOR`, and a null id. `src/modules/ingestion/validation/confidence.ts`, `src/modules/ingestion/dto/propose-link.dto.ts`.
- `BUSINESS_RUN_NOT_RUNNING` and `SYSTEM_INTERNAL_ERROR` are declared in the code set, but nothing in this area raises them. `src/modules/ingestion/validation/errors.ts`.

## Vocabularies
- Source type: `pdf`, `email`, `ata`, `chat`, `artigo`, `transcricao`, `outro`. `src/modules/ingestion/dto/source-type.ts`.
- Ingestion outcome: `created`, `noop_existing`. `src/modules/ingestion/dto/ingest-raw-information.dto.ts`.
- Run status: `running`, `completed`, `failed`. `src/modules/ingestion/dto/llm-run.dto.ts`.
- Validation outcome: `accepted`, `consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`, `rejected`, `error`. `src/modules/ingestion/dto/llm-run.dto.ts`.
- Ingest tool name: `propose_fragment`, `propose_node`, `propose_link`, `propose_attribute`. `src/modules/ingestion/dto/llm-run.dto.ts`.
- Link and attribute proposal outcome: `accepted`, `consolidated`, `superseded_previous`, `disputed`, `rejected`. `src/modules/ingestion/dto/propose-link.dto.ts`, `src/modules/ingestion/dto/propose-attribute.dto.ts`.
- Node resolution: `matched_existing`, `created_new`, `needs_review`. `src/modules/ingestion/dto/propose-node.dto.ts`.
- Fragment proposal status: `proposed`. `src/modules/ingestion/dto/propose-fragment.dto.ts`.
- Date basis (caller input): `stated`, `document`. Resolved date basis: `stated`, `document`, `received`. `src/modules/ingestion/dto/propose-link.dto.ts`, `src/modules/ingestion/validation/temporal.ts`.
- Change hint: `none`, `succession`, `correction`. `src/modules/ingestion/dto/propose-link.dto.ts`.
- Attribute value type: `date`, `number`, `text`, `bool`. `src/modules/ingestion/validation/structural.ts`.
- Confidence route: `active`, `uncertain`, `below_floor`. `src/modules/ingestion/validation/confidence.ts`.
- Errata markers: `errata`, `errado`, `correção`, `corrigir`, `correction`, `correcao`. `src/modules/ingestion/validation/temporal.ts`.
- Catalog kind: `node_type`, `link_type`, `attribute_key`. `src/modules/ingestion/validation/structural.ts`.
- Validation failure code: `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `RESOURCE_NOT_FOUND`, `BUSINESS_UNKNOWN_NODE_TYPE`, `BUSINESS_UNKNOWN_LINK_TYPE`, `BUSINESS_UNKNOWN_ATTRIBUTE_KEY`, `BUSINESS_LINK_RULE_VIOLATION`, `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_DATE_UNJUSTIFIED`, `BUSINESS_RUN_NOT_RUNNING`, `SYSTEM_INTERNAL_ERROR`. `src/modules/ingestion/validation/errors.ts`.
- Proposal refusal reason: `BELOW_CONFIDENCE_FLOOR`. `src/modules/ingestion/dto/propose-link.dto.ts`.

## Upstream artifacts
- The database enums for source type, run status and validation outcome. This area repeats their values but does not own them. `src/modules/ingestion/dto/source-type.ts`, `src/modules/ingestion/dto/llm-run.dto.ts`.
- The in-process catalog snapshot and `isLinkRuleActive`, which decide whether a link rule is active on a date. They are owned by the catalog module. `src/modules/ingestion/validation/graph-rules.ts`.
- Each attribute key's value type and closed-domain set, plus each link type's or attribute key's requires-start-date flag. Callers pass these in from the catalog. `src/modules/ingestion/validation/structural.ts`, `src/modules/ingestion/validation/temporal.ts`.
- The received-at timestamp of the source's raw information and the metadata document date. Callers pass these into the temporal layer. `src/modules/ingestion/validation/temporal.ts` (`TemporalLayerInput`).

## Outside the domain
- JSON Schema is derived from the Zod schemas with `z.toJSONSchema`, and a map from tool name to JSON Schema is exported. `src/modules/ingestion/dto/index.ts`.
- Re-exports of the schemas and types. `src/modules/ingestion/dto/index.ts`.
- The `.describe()` annotations on schema fields. `src/modules/ingestion/dto/propose-*.dto.ts`.
- The `ValidationFailure` class shape and the `isValidationFailure` type guard. `src/modules/ingestion/validation/errors.ts`.
- The `__testing__` export, and passing "today" into the graph-rule check so tests can stub it. `src/modules/ingestion/validation/temporal.ts`, `src/modules/ingestion/validation/graph-rules.ts`.

## Observed and not decided here
- The propose_attribute description (`src/modules/ingestion/dto/index.ts`, `IngestToolDescriptions.propose_attribute`) tells the caller the value must match "date, number, or string". The parser (`src/modules/ingestion/validation/structural.ts`, `parseAttributeValue`) has the value types `date`, `number`, `text` and `bool`.
- The propose_fragment field description (`src/modules/ingestion/dto/propose-fragment.dto.ts`, `confidence.describe`) says "<0.40 dropped" and "0.40–0.74 kept but flagged uncertain". But the fragment result type always has status `proposed` (`ProposeFragmentResult`), and confidence routing is typed for links and attributes only (`src/modules/ingestion/validation/confidence.ts`, `ConfidenceRoute`).
- When a start date is required and missing, the temporal layer treats the fallbacks differently (`src/modules/ingestion/validation/temporal.ts` lines 145–166). With a document date present, it passes and leaves the date and basis null. With only received-at present, it resolves the date and sets the basis to `received`.
- The validation-outcome set (`src/modules/ingestion/dto/llm-run.dto.ts`) includes `uncertain` and `needs_review`. The link and attribute outcome types (`src/modules/ingestion/dto/propose-link.dto.ts`, `src/modules/ingestion/dto/propose-attribute.dto.ts`) contain neither, even though confidence routing produces an `uncertain` status (`src/modules/ingestion/validation/confidence.ts`).
- Whether a date value like `2024-02-30` is refused depends on the runtime's `Date.parse`. The code refuses only when `Date.parse` returns NaN and does no day-of-month check of its own. `src/modules/ingestion/validation/structural.ts` (`parseAttributeValue` case `date`).
