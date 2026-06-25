// MCP-facing Zod schemas for the four `ingest` `propose_*` tools.
//
// Per BR-21 (revised, v1.2.4) + BR-24 + BR-28: the MCP-facing schema of each
// tool EXTENDS the canonical business DTO with `llm_run_id: z.string().min(1)`
// (Option B — per-call arg-based run binding). The REST mirror routes keep the
// business DTO unchanged (the REST run id comes from the URL path, not the
// body). The in-process Anthropic tool-use loop also keeps the business DTO
// unchanged (the orchestrator injects `runContext` server-side; the LLM is
// never asked for `llm_run_id`).
//
// This file is loaded by `mcp/ingest-toolset.ts` only — it is NOT re-exported
// from `dto/index.ts` because (a) the canonical business `IngestToolInput
// JsonSchemas` map there is consumed by the in-process orchestrator and the
// REST mirrors, neither of which carries `llm_run_id`, and (b) adding
// `llm_run_id` to those schemas would silently leak the MCP-only argument
// into the other transports.

import { z } from "zod";

import {
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
} from "../dto/index.js";
import { SourceTypeSchema } from "../dto/source-type.js";

const LlmRunIdField = {
  llm_run_id: z
    .string()
    .min(1)
    .describe(
      "Active LLMRun id this proposal belongs to. Required on every MCP call (Option B — arg-based run binding). The handler aborts with STRUCTURAL_INVALID if it does not point to a `running` LLMRun row."
    ),
};

// --------------------------------------------------------------------------
// MCP-extended Zod schemas (business DTO + llm_run_id).
// --------------------------------------------------------------------------

export const ProposeFragmentMcpInputSchema =
  ProposeFragmentInputSchema.extend(LlmRunIdField);
export type ProposeFragmentMcpInput = z.infer<typeof ProposeFragmentMcpInputSchema>;

export const ProposeNodeMcpInputSchema =
  ProposeNodeInputSchema.extend(LlmRunIdField);
export type ProposeNodeMcpInput = z.infer<typeof ProposeNodeMcpInputSchema>;

export const ProposeLinkMcpInputSchema =
  ProposeLinkInputSchema.extend(LlmRunIdField);
export type ProposeLinkMcpInput = z.infer<typeof ProposeLinkMcpInputSchema>;

export const ProposeAttributeMcpInputSchema =
  ProposeAttributeInputSchema.extend(LlmRunIdField);
export type ProposeAttributeMcpInput = z.infer<typeof ProposeAttributeMcpInputSchema>;

// --------------------------------------------------------------------------
// Closed enumeration + descriptions consumed by the toolset registrar and the
// transport's `tools/list` advertisement. Kept here next to the schemas so a
// future tool addition is a single-file change.
// --------------------------------------------------------------------------

export const INGEST_TOOL_NAMES = [
  "propose_fragment",
  "propose_node",
  "propose_link",
  "propose_attribute",
] as const;
export type IngestMcpToolName = (typeof INGEST_TOOL_NAMES)[number];

// --------------------------------------------------------------------------
// `ingest_document` — high-level one-shot ingestion tool (TC-MCI-002). Unlike
// the four `propose_*` writers (which the in-process orchestrator drives with
// chunk ids + a `running` run), this tool lets an EXTERNAL MCP client (e.g.
// Claude Desktop) hand over a whole document; the server persists + chunks it,
// runs server-side extraction, and returns a run summary. It does NOT take an
// `llm_run_id` (it CREATES the run) and is NOT part of INGEST_TOOL_NAMES (that
// enum is the per-proposal `tool_call` audit surface).
// --------------------------------------------------------------------------

/**
 * `start_async_ingestion` (BR-32) — shape-identical to `ingest_document` for
 * caller symmetry. The only difference is the new-run return semantics
 * (immediate vs. awaited) — see the handler. We keep the schema as a separate
 * symbol (not a re-export) so a future divergence stays surgical, and so the
 * `inputSchema` advertised on `tools/list` carries the tool-specific
 * descriptions in `describe(…)`.
 */
export const StartAsyncIngestionMcpInputSchema = z.object({
  content: z
    .string()
    .min(1, "content must not be empty")
    .max(10 * 1024 * 1024, "content must not exceed 10 MiB")
    .describe(
      "The full plain text of the document to ingest. Paste the raw content; the server chunks it, runs structured extraction in the BACKGROUND, and persists the knowledge graph with provenance. No base64/binary."
    ),
  source_type: SourceTypeSchema.describe(
    "What kind of source this is. One of: pdf, email, ata, chat, artigo, transcricao, outro."
  ),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Optional free-form metadata (e.g. title, author, url). Set `document_date` (ISO-8601) when the document states its own date — it justifies temporal validity during extraction."
    ),
  model: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional Anthropic model id the SERVER uses to extract. Defaults server-side; override to trade cost for quality."
    ),
  prompt_version: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional extraction prompt version. Defaults to the current server default."
    ),
});
export type StartAsyncIngestionMcpInput = z.infer<
  typeof StartAsyncIngestionMcpInputSchema
>;

export const IngestDocumentMcpInputSchema = z.object({
  content: z
    .string()
    .min(1, "content must not be empty")
    .max(10 * 1024 * 1024, "content must not exceed 10 MiB")
    .describe(
      "The full plain text of the document to ingest. Paste the raw content; the server chunks it, runs structured extraction, and persists the knowledge graph with provenance. No base64/binary."
    ),
  source_type: SourceTypeSchema.describe(
    "What kind of source this is. One of: pdf, email, ata, chat, artigo, transcricao, outro."
  ),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Optional free-form metadata (e.g. title, author, url). Set `document_date` (ISO-8601) when the document states its own date — it justifies temporal validity during extraction."
    ),
  model: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional Anthropic model id the SERVER uses to extract. Defaults server-side; override to trade cost for quality."
    ),
  prompt_version: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional extraction prompt version. Defaults to the current server default."
    ),
});
export type IngestDocumentMcpInput = z.infer<typeof IngestDocumentMcpInputSchema>;

// --------------------------------------------------------------------------
// Read-only operational tools (additive, no contract change to the writers):
//   - `health`                 — liveness + DB-reachability probe (no args).
//   - `get_ingestion_status`   — poll one run by id.
//   - `list_recent_ingestions` — discover a run after a client-side timeout.
// They take no `llm_run_id` proposal binding and write no `tool_call` audit
// row; they are NOT part of INGEST_TOOL_NAMES (that enum is the per-proposal
// audit surface). Their names are added to the transport whitelist in app.ts.
// --------------------------------------------------------------------------

/** `health` — no input. An empty object keeps `tools/list` schema well-formed. */
export const HealthMcpInputSchema = z.object({});
export type HealthMcpInput = z.infer<typeof HealthMcpInputSchema>;

/** `get_ingestion_status` — a single LLMRun id (as returned by `ingest_document`). */
export const GetIngestionStatusMcpInputSchema = z.object({
  llm_run_id: z
    .string()
    .uuid()
    .describe(
      "The LLMRun id to inspect — the `llm_run_id` returned by `ingest_document` (or found via `list_recent_ingestions`). Returns its status (running | completed | failed), per-outcome counts, and timestamps."
    ),
});
export type GetIngestionStatusMcpInput = z.infer<
  typeof GetIngestionStatusMcpInputSchema
>;

// --------------------------------------------------------------------------
// `get_ingestion_status` OUTPUT shape (TC-02 / BR-31 / BR-33).
//
// The MCP transport renders `{ ok, result }` envelopes via the shared SDK
// kernel — this schema describes the `result` payload returned on success.
// It mirrors `LlmRunResponseSchema` (`dto/llm-run.dto.ts`) plus the OPTIONAL
// `affected_nodes` field added by BR-33; the schema is declared here next to
// the input schema so the toolset registrar has a single import surface for
// both directions. The Zod type is the contract — JSON-Schema generation is
// not currently emitted for outputs (only inputs are advertised by `tools/
// list`), but the schema is the canonical type definition that QA / tests
// assert against.
//
// `affected_nodes` is `.optional()` — serializers must OMIT the key entirely
// when absent (never emit `null` on the wire). It is attached ONLY when
// `result.status === 'completed'`; on `running` / `failed` runs the field is
// absent. Empty array is a valid completed-run payload (a run can complete
// with only `rejected` outcomes).
// --------------------------------------------------------------------------

/** One entry of `result.affected_nodes` — BR-33 wire shape. */
export const AffectedNodeOutputSchema = z.object({
  id: z.string().uuid(),
  canonical_name: z.string(),
  node_type: z.string(),
});
export type AffectedNodeOutput = z.infer<typeof AffectedNodeOutputSchema>;

/** Per-outcome counters — mirror of `LlmRunSummarySchema` (BR-12). */
const GetIngestionStatusSummarySchema = z.object({
  accepted: z.number().int().nonnegative(),
  consolidated: z.number().int().nonnegative(),
  superseded_previous: z.number().int().nonnegative(),
  needs_review: z.number().int().nonnegative(),
  uncertain: z.number().int().nonnegative(),
  disputed: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  error: z.number().int().nonnegative(),
  orphaned_fragments: z.number().int().nonnegative(),
});

/**
 * `result` shape of `{ ok: true, result }` returned by `get_ingestion_status`.
 *
 * BR-33 v1.3.0 — `affected_nodes` is the optional projection of the run's
 * touched nodes; populated on `status === 'completed'` (cache hit OR derived
 * from `tool_call.result` rows on cache miss), absent otherwise.
 */
export const GetIngestionStatusOutputSchema = z.object({
  id: z.string().uuid(),
  model: z.string(),
  prompt_version: z.string(),
  started_at: z.string().datetime({ offset: true }),
  finished_at: z.string().datetime({ offset: true }).nullable(),
  status: z.enum(["running", "completed", "failed"]),
  attempts: z.number().int().positive(),
  input_raw_information_id: z.string().uuid(),
  idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),
  summary: GetIngestionStatusSummarySchema,
  affected_nodes: z.array(AffectedNodeOutputSchema).optional(),
});
export type GetIngestionStatusOutput = z.infer<
  typeof GetIngestionStatusOutputSchema
>;

/** `list_recent_ingestions` — optional page size (1..50, default 10). */
export const ListRecentIngestionsMcpInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("How many recent ingestions to return, newest first. 1..50, default 10."),
});
export type ListRecentIngestionsMcpInput = z.infer<
  typeof ListRecentIngestionsMcpInputSchema
>;

// --------------------------------------------------------------------------
// `ingest_directed` (BR-34) — one-shot, deterministic directed-ingestion tool.
//
// The caller (typically the chat agentic loop, but any MCP client may use it)
// supplies a fully-structured payload of fragments + nodes + optional
// attributes + optional links carrying LOCAL `ref` identifiers — the server
// opens a `RawInformation` + `LLMRun` (sentinels `model='directed'`,
// `prompt_version='directed-v1'`), then dispatches the items in dependency
// order through the existing `propose_*` handlers. No Anthropic round-trip.
//
// Schema constraints (BR-34, v1.4.1):
//   - `ref` strings are local to the call (1..120 chars, must be non-empty).
//   - `confidence` is DELIBERATELY ABSENT from every item — the server forces
//     `confidence = 1.0` on every dispatched `propose_*` (BR-34 step 4 + the
//     contract: a directed payload is a stated fact by construction; callers
//     cannot lower confidence here).
//   - `valid_from_basis` is restricted to the public `'stated' | 'document'`
//     enum (the `'received'` fallback is server-internal, never accepted from
//     callers — BR-16).
//   - `node_id` on a node item is an OPTIONAL UUID PIN: when present, the
//     handler skips BR-25 trigram resolution and uses the supplied id directly
//     (rejected `STRUCTURAL_INVALID` if the id does not point to an `active`
//     node). When absent, the handler runs the standard `proposeNodeHandler`
//     entity-resolution path.
//   - `source_label` is a free-form caller tag carried into
//     `metadata.source_label` for audit; not parsed.
//
// Unlike the four `propose_*` tools, this schema is NOT extended with an
// `llm_run_id` field — the orchestrator CREATES the run. Mirrors the
// `IngestDocumentMcpInputSchema` pattern in that respect. The tool is NOT
// added to `INGEST_TOOL_NAMES` (that enum is the per-proposal `tool_call`
// audit surface; `ingest_directed` is not a `propose_*` writer).
// --------------------------------------------------------------------------

/** ISO date `YYYY-MM-DD`. Mirrors the service-side regex (`directed-ingestion.service.ts`). */
const IngestDirectedIsoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "valid_from must be ISO YYYY-MM-DD"
  );

/** Local ref string scoped to one call. 1..120 chars; never persisted, never returned. */
const IngestDirectedRefSchema = z.string().min(1).max(120);

/** Public `ValidFromBasis` enum (BR-16): the `'received'` fallback is server-internal. */
const IngestDirectedValidFromBasisSchema = z.enum(["stated", "document"]);

const IngestDirectedFragmentItemSchema = z.object({
  ref: IngestDirectedRefSchema.describe(
    "Local identifier you choose for this fragment (e.g. 'f1'). Cite it from any attribute/link `evidence_ref` to point at this fragment."
  ),
  text: z
    .string()
    .min(1)
    .max(1000)
    .describe(
      "The verbatim factual claim quoted from the source (max 1000 chars). One atomic claim per fragment — split compound sentences."
    ),
});

const IngestDirectedNodeItemSchema = z.object({
  ref: IngestDirectedRefSchema.describe(
    "Local identifier you choose for this node (e.g. 'n_apollo'). Cite it from `node_ref`, `source_ref`, or `target_ref` to reference this node."
  ),
  node_type: z
    .string()
    .min(1)
    .describe(
      "Catalog NodeType name (e.g. 'Person', 'Project'). Must exist in the catalog."
    ),
  name: z
    .string()
    .min(1)
    .max(500)
    .describe(
      "Canonical name of the entity (1..500 chars). The server runs entity resolution against existing nodes of the same type unless `node_id` is supplied."
    ),
  node_id: z
    .string()
    .uuid()
    .optional()
    .describe(
      "Optional UUID PIN: when supplied, the server SKIPS entity resolution and binds this ref to the supplied id directly. Use when you already know the target id (e.g. from a prior `query`-toolset read) and want to re-affirm against it without risking trigram drift. Rejected (STRUCTURAL_INVALID) if the id does not point to an active node."
    ),
  aliases: z
    .array(z.string().min(1).max(500))
    .optional()
    .describe(
      "Optional alternative names (alias surface forms). Used by entity resolution; ignored when `node_id` is supplied."
    ),
});

const IngestDirectedAttributeValueSchema = z.union([
  z.string().min(1).max(2000),
  z.number().finite(),
  z.boolean(),
]);

const IngestDirectedAttributeItemSchema = z.object({
  node_ref: IngestDirectedRefSchema.describe(
    "The `ref` of the node this attribute belongs to (must appear in `nodes[]`)."
  ),
  key: z
    .string()
    .min(1)
    .describe(
      "Catalog AttributeKey for the node's type (e.g. 'deadline', 'status')."
    ),
  value: IngestDirectedAttributeValueSchema.describe(
    "The attribute value (string | number | boolean). Must match the key's catalog value type."
  ),
  evidence_ref: IngestDirectedRefSchema.describe(
    "The `ref` of the fragment that evidences this attribute (must appear in `fragments[]`)."
  ),
  valid_from: IngestDirectedIsoDateSchema.optional().describe(
    "Optional ISO date when this attribute became valid. Required when the catalog AttributeKey requires it."
  ),
  valid_from_basis: IngestDirectedValidFromBasisSchema.optional().describe(
    "Justification for `valid_from`: 'stated' (date is in the fragment text) or 'document' (date taken from the document's own metadata). Defaults to 'stated' when omitted."
  ),
});

const IngestDirectedLinkItemSchema = z.object({
  source_ref: IngestDirectedRefSchema.describe(
    "The `ref` of the source node (must appear in `nodes[]`)."
  ),
  target_ref: IngestDirectedRefSchema.describe(
    "The `ref` of the target node (must appear in `nodes[]`)."
  ),
  link_type: z
    .string()
    .min(1)
    .describe(
      "Catalog LinkType name. Must be allowed for the source-type → target-type pair by an active LinkTypeRule."
    ),
  evidence_ref: IngestDirectedRefSchema.describe(
    "The `ref` of the fragment that evidences this link (must appear in `fragments[]`)."
  ),
  valid_from: IngestDirectedIsoDateSchema.optional().describe(
    "Optional ISO date when this link became valid. Required when the catalog LinkType requires it."
  ),
  valid_from_basis: IngestDirectedValidFromBasisSchema.optional().describe(
    "Justification for `valid_from`: 'stated' (date is in the fragment text) or 'document' (date taken from the document's own metadata). Defaults to 'stated' when omitted."
  ),
});

/**
 * MCP-facing schema for the `ingest_directed` tool (BR-34). The handler
 * (`directed-ingest.handler.ts`, separate Task Contract) Zod-parses with this
 * schema first, then delegates to the deterministic orchestrator in
 * `directed-ingestion.service.ts`.
 *
 * Single source of truth for the tool's input shape — derived into Anthropic
 * `input_schema` via `z.toJSONSchema` at the registration site (per BR-24
 * pattern). `confidence` MUST NOT appear in this schema by design.
 */
export const IngestDirectedMcpInputSchema = z.object({
  fragments: z
    .array(IngestDirectedFragmentItemSchema)
    .min(1)
    .describe(
      "At least one atomic factual claim, each with a local `ref`. Every attribute / link must cite one of these refs as its `evidence_ref`."
    ),
  nodes: z
    .array(IngestDirectedNodeItemSchema)
    .min(1)
    .describe(
      "At least one entity, each with a local `ref`. Use `node_id` to pin against a known existing node (skips resolution)."
    ),
  attributes: z
    .array(IngestDirectedAttributeItemSchema)
    .optional()
    .describe(
      "Optional list of attribute assertions (literal values belonging to a node)."
    ),
  links: z
    .array(IngestDirectedLinkItemSchema)
    .optional()
    .describe(
      "Optional list of relation assertions between two nodes."
    ),
  source_label: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe(
      "Optional free-form caller tag (e.g. 'chat-turn-42'). Carried into the run's `metadata.source_label` for audit; not parsed by the server."
    ),
});
export type IngestDirectedMcpInput = z.infer<typeof IngestDirectedMcpInputSchema>;
