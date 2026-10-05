import type { LlmRunResponse } from "../dto/llm-run.dto.js";
import type { LlmRunRow } from "../repository/ingestion.repository.js";

export type RunDocumentContextFields = Pick<
  LlmRunResponse,
  "document_context_status" | "document_context"
>;

export function documentContextFields(
  row: Pick<LlmRunRow, "document_context" | "document_context_status">
): RunDocumentContextFields {
  return {
    ...(row.document_context_status === null
      ? {}
      : { document_context_status: row.document_context_status }),
    ...(row.document_context === null
      ? {}
      : { document_context: row.document_context }),
  };
}
