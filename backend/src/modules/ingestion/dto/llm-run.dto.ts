import { z } from "zod";

export const LlmRunStatusSchema = z.enum(["running", "completed", "failed"]);
export type LlmRunStatus = z.infer<typeof LlmRunStatusSchema>;

export const ValidationOutcomeSchema = z.enum([
  "accepted",
  "consolidated",
  "superseded_previous",
  "needs_review",
  "uncertain",
  "disputed",
  "rejected",
  "error",
]);
export type ValidationOutcome = z.infer<typeof ValidationOutcomeSchema>;

export const IngestToolNameSchema = z.enum([
  "propose_fragment",
  "propose_node",
  "propose_link",
  "propose_attribute",
]);
export type IngestToolName = z.infer<typeof IngestToolNameSchema>;

export const LlmRunSummarySchema = z.object({
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
export type LlmRunSummary = z.infer<typeof LlmRunSummarySchema>;

export const AffectedNodeSchema = z.object({
  id: z.string().uuid(),
  canonical_name: z.string(),
  node_type: z.string(),
});
export type AffectedNode = z.infer<typeof AffectedNodeSchema>;

export const DocumentContextStatusSchema = z.enum([
  "produced",
  "single-chunk",
  "too-long",
  "failed",
]);
export type DocumentContextStatus = z.infer<typeof DocumentContextStatusSchema>;

export const DocumentEntitySchema = z.object({
  node_type: z.string(),
  names: z.array(z.string()),
});
export type DocumentEntity = z.infer<typeof DocumentEntitySchema>;

export const DocumentContextSchema = z.object({
  summary: z.string(),
  entities: z.array(DocumentEntitySchema),
  model: z.string(),
});
export type DocumentContext = z.infer<typeof DocumentContextSchema>;

export const LlmRunResponseSchema = z.object({
  id: z.string().uuid(),
  model: z.string(),
  prompt_version: z.string(),
  started_at: z.string().datetime({ offset: true }),
  finished_at: z.string().datetime({ offset: true }).nullable(),
  status: LlmRunStatusSchema,
  attempts: z.number().int().positive(),
  input_raw_information_id: z.string().uuid(),
  idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),
  summary: LlmRunSummarySchema,
  affected_nodes: z.array(AffectedNodeSchema).optional(),
});
export type LlmRunResponse = z.infer<typeof LlmRunResponseSchema>;

export const ToolCallResponseSchema = z.object({
  id: z.string().uuid(),
  llm_run_id: z.string().uuid(),
  tool_name: IngestToolNameSchema,
  arguments: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()).nullable(),
  validation_outcome: ValidationOutcomeSchema,
  created_at: z.string().datetime({ offset: true }),
});
export type ToolCallResponse = z.infer<typeof ToolCallResponseSchema>;

export const ListToolCallsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  items: z.array(ToolCallResponseSchema),
});
export type ListToolCallsResponse = z.infer<typeof ListToolCallsResponseSchema>;

export const RetryLlmRunRequestSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .default({});
export type RetryLlmRunRequest = z.infer<typeof RetryLlmRunRequestSchema>;

export const ListToolCallsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListToolCallsQuery = z.infer<typeof ListToolCallsQuerySchema>;
