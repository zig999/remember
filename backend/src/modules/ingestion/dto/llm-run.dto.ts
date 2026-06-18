// Response / request DTOs for the LLMRun REST endpoints.
//
// Mirrors `openapi.yaml#/components/schemas/{LlmRun, LlmRunSummary, ToolCall,
// RetryLlmRunRequest}`. The Zod schemas are exported so tests can re-use
// them; runtime parse is not performed on outbound payloads — Fastify trusts
// the service layer's typed result.

import { z } from "zod";

/** Mirror of PostgreSQL enum `llm_run_status`. */
export const LlmRunStatusSchema = z.enum(["running", "completed", "failed"]);
export type LlmRunStatus = z.infer<typeof LlmRunStatusSchema>;

/** Mirror of PostgreSQL enum `validation_outcome`. */
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

/** Closed list of ingest tool names — matches the MCP `ingest` toolset. */
export const IngestToolNameSchema = z.enum([
  "propose_fragment",
  "propose_node",
  "propose_link",
  "propose_attribute",
]);
export type IngestToolName = z.infer<typeof IngestToolNameSchema>;

/**
 * Counters for `LlmRun`. The 8 outcome buckets are aggregated from
 * `tool_call.validation_outcome`; `orphaned_fragments` is a separate
 * fragment-level recall signal (see field doc). All fields always present
 * (BR-12).
 */
export const LlmRunSummarySchema = z.object({
  accepted: z.number().int().nonnegative(),
  consolidated: z.number().int().nonnegative(),
  superseded_previous: z.number().int().nonnegative(),
  needs_review: z.number().int().nonnegative(),
  uncertain: z.number().int().nonnegative(),
  disputed: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  error: z.number().int().nonnegative(),
  /**
   * Fragments proposed by this run that carry NO provenance row — i.e. the
   * LLM extracted them but never cited them in any consolidated link/attribute.
   * Such fragments stay `status='proposed'` and are excluded from the partial
   * FTS index (`WHERE status='accepted'`), so they are unsearchable: a silent
   * recall gap. Defined identically to the retry orphan-cleanup (BR-10). For a
   * still-running run this is a live snapshot (a fragment may yet be cited), so
   * it is only conclusive once the run reaches a terminal status.
   */
  orphaned_fragments: z.number().int().nonnegative(),
});
export type LlmRunSummary = z.infer<typeof LlmRunSummarySchema>;

/** Response of `GET /llm-runs/{id}` and `POST /llm-runs/{id}/retry`. */
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
});
export type LlmRunResponse = z.infer<typeof LlmRunResponseSchema>;

/** Single item in the tool-call audit list. */
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

/** Envelope of `GET /llm-runs/{id}/tool-calls` — paginated (UC-05). */
export const ListToolCallsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  items: z.array(ToolCallResponseSchema),
});
export type ListToolCallsResponse = z.infer<typeof ListToolCallsResponseSchema>;

/** Optional body of `POST /llm-runs/{id}/retry`. */
export const RetryLlmRunRequestSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .default({});
export type RetryLlmRunRequest = z.infer<typeof RetryLlmRunRequestSchema>;

/** Query-string schema for `GET /llm-runs/{id}/tool-calls?limit&offset`. */
export const ListToolCallsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListToolCallsQuery = z.infer<typeof ListToolCallsQuerySchema>;
