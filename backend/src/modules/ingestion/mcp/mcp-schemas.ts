import { z } from "zod";

import {
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
} from "../dto/index.js";
import {
  DocumentContextSchema,
  DocumentContextStatusSchema,
} from "../dto/llm-run.dto.js";
import { SourceTypeSchema } from "../dto/source-type.js";

const LlmRunIdField = {
  llm_run_id: z
    .string()
    .min(1)
    .describe(
      "Active LLMRun id this proposal belongs to. Required on every MCP call (Option B — arg-based run binding). The handler aborts with RESOURCE_NOT_FOUND when the id is unknown or BUSINESS_RUN_NOT_RUNNING when the row exists but its status is not `running`."
    ),
};

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

export const INGEST_TOOL_NAMES = [
  "propose_fragment",
  "propose_node",
  "propose_link",
  "propose_attribute",
] as const;
export type IngestMcpToolName = (typeof INGEST_TOOL_NAMES)[number];

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

export const HealthMcpInputSchema = z.object({});
export type HealthMcpInput = z.infer<typeof HealthMcpInputSchema>;

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

export const AffectedNodeOutputSchema = z.object({
  id: z.string().uuid(),
  canonical_name: z.string(),
  node_type: z.string(),
});
export type AffectedNodeOutput = z.infer<typeof AffectedNodeOutputSchema>;

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
  document_context_status: DocumentContextStatusSchema.optional(),
  document_context: DocumentContextSchema.optional(),
  affected_nodes: z.array(AffectedNodeOutputSchema).optional(),
});
export type GetIngestionStatusOutput = z.infer<
  typeof GetIngestionStatusOutputSchema
>;

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

const IngestDirectedIsoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "valid_from must be ISO YYYY-MM-DD"
  );

const IngestDirectedRefSchema = z.string().min(1).max(120);

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
      "Optional UUID PIN: when supplied, the server SKIPS entity resolution and binds this ref to the supplied id directly. Use when you already know the target id (e.g. from a prior `query`-toolset read) and want to re-affirm against it without risking trigram drift. Rejected (VALIDATION_INVALID_FORMAT) if the id does not point to an active node."
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
