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
