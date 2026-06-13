// Shared types for the `propose_*` service layer.
//
// Per BR-21 (revised) + BR-28: the four `propose_*` services are
// transport-agnostic. Each accepts an open `PoolClient`, a parsed/typed
// argument object, and a `RunContext` that scopes the call to a specific
// LLMRun + its source `RawInformation`.

/** Active-run context plumbed by every transport that calls the propose-* services. */
export interface RunContext {
  readonly llmRunId: string;
  readonly rawInformationId: string;
}

/** Success envelope (matches the MCP transport's `{ ok: true, result }` shape). */
export interface McpOk<R> {
  readonly ok: true;
  readonly result: R;
}

/** Failure envelope (matches the MCP transport's `{ ok: false, error }` shape). */
export interface McpErr {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

export type McpEnvelope<R> = McpOk<R> | McpErr;
