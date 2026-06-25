// Unit tests for the `ingest_directed` MCP handler (BR-34 / TC-03).
//
// WHY these matter: the handler is a THIN seam between the MCP transport and
// the `directedIngestionService` orchestrator (TC-01). The orchestrator is
// already tested end-to-end (`directed-ingestion.spec.ts`). What this handler
// owns — and what would silently regress if untested — is the transport-shape
// glue:
//   1. Zod parse → on FAILURE the handler returns STRUCTURAL_INVALID and
//      MUST NOT call the orchestrator (no run is opened, no rows are
//      written). A regression that called the service on bad input would
//      leak a run row keyed to invalid arguments.
//   2. Service envelope forwarded VERBATIM on success — the handler never
//      re-shapes `result` (the orchestrator's report is the contract the
//      caller sees).
//   3. Service envelope forwarded VERBATIM on a modelled `ok:false` (intake
//      failure → SYSTEM_SERVICE_UNAVAILABLE or INTERNAL). A regression that
//      remapped these codes would break BR-34's error-code contract.
//   4. UNEXPECTED throw → handler catches and surfaces a clean INTERNAL
//      envelope. Without this catch the SDK kernel would render the raw
//      `err.message` (potentially leaking invariants / ids — BR-30 lesson).

import { describe, expect, it, vi } from "vitest";

import {
  ingestDirectedHandler,
  type IngestDirectedDeps,
} from "../../../modules/ingestion/mcp/directed-ingest.handler.js";

/** Minimal valid payload — the orchestrator is stubbed, so we only need to
 *  satisfy `IngestDirectedMcpInputSchema` at the handler boundary. */
const VALID_INPUT = {
  fragments: [{ ref: "f1", text: "Rodrigo lidera o Projeto Apollo." }],
  nodes: [
    { ref: "n_r", node_type: "Person", name: "Rodrigo" },
    { ref: "n_a", node_type: "Project", name: "Apollo" },
  ],
};

const logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
} as unknown as IngestDirectedDeps["logger"];

const pool = {
  connect: vi.fn(),
} as unknown as IngestDirectedDeps["pool"];

const catalog = {} as unknown as IngestDirectedDeps["catalog"];

function makeDeps(over: Partial<IngestDirectedDeps>): IngestDirectedDeps {
  return { pool, logger, catalog, ...over };
}

describe("ingestDirectedHandler", () => {
  it("returns STRUCTURAL_INVALID and DOES NOT call the orchestrator when the payload fails Zod", async () => {
    // WHY: a bad payload must short-circuit before the orchestrator opens a
    // run. A regression that passed garbage through would leak a run row.
    const directedIngestion = vi.fn();

    const envelope = await ingestDirectedHandler(
      // missing `nodes` is a hard schema failure (min(1)).
      { fragments: VALID_INPUT.fragments },
      makeDeps({
        directedIngestion:
          directedIngestion as unknown as IngestDirectedDeps["directedIngestion"],
      })
    );

    expect(envelope.ok).toBe(false);
    expect(envelope.error?.code).toBe("STRUCTURAL_INVALID");
    expect(envelope.error?.message).toMatch(/validation/i);
    // The orchestrator MUST NOT have been touched — no run is opened on a
    // schema-level failure (the spec's contract: parse first, dispatch later).
    expect(directedIngestion).not.toHaveBeenCalled();
  });

  it("STRUCTURAL_INVALID envelope carries per-issue details (path + message)", async () => {
    // WHY: the LLM uses these issues to fix its tool call. A regression that
    // dropped `issues` would make the failure opaque and the agentic loop
    // would retry blindly.
    const envelope = await ingestDirectedHandler(
      { fragments: [], nodes: [] },
      makeDeps({
        directedIngestion: vi.fn() as unknown as IngestDirectedDeps["directedIngestion"],
      })
    );

    expect(envelope.ok).toBe(false);
    expect(envelope.error?.code).toBe("STRUCTURAL_INVALID");
    const details = envelope.error?.details as
      | { issues?: Array<{ path: string; message: string }> }
      | undefined;
    expect(details?.issues).toBeDefined();
    expect(details!.issues!.length).toBeGreaterThan(0);
    expect(details!.issues![0]).toMatchObject({
      path: expect.any(String),
      message: expect.any(String),
    });
  });

  it("forwards the orchestrator's success envelope VERBATIM (does not re-shape the result)", async () => {
    // WHY: the per-item report + summary are the orchestrator's wire
    // contract; the handler is only a seam. A regression that wrapped or
    // renamed fields would break every BR-34 caller silently.
    const okEnvelope = {
      ok: true as const,
      result: {
        outcome: "ingested" as const,
        raw_information_id: "raw-1",
        llm_run_id: "run-1",
        chunk_count: 1,
        run: {
          id: "run-1",
          model: "directed" as const,
          prompt_version: "directed-v1" as const,
          status: "completed" as const,
          started_at: "2026-01-01T00:00:00.000Z",
          finished_at: "2026-01-01T00:00:01.000Z",
          attempts: 1,
          input_raw_information_id: "raw-1",
          affected_nodes: [],
        },
        report: [
          { ref: "f1", kind: "fragment" as const, status: "accepted" as const, fragment_id: "frag-1" },
        ],
        summary: {
          fragments: 1,
          nodes: 0,
          attributes: 0,
          links: 0,
          accepted: 1,
          consolidated: 0,
          superseded_previous: 0,
          needs_review: 0,
          uncertain: 0,
          disputed: 0,
          rejected: 0,
          error: 0,
          dependency_failed: 0,
        },
      },
    };
    const directedIngestion = vi.fn().mockResolvedValue(okEnvelope);

    const envelope = await ingestDirectedHandler(
      VALID_INPUT,
      makeDeps({
        directedIngestion:
          directedIngestion as unknown as IngestDirectedDeps["directedIngestion"],
      })
    );

    expect(envelope).toBe(okEnvelope);
    expect(directedIngestion).toHaveBeenCalledOnce();
  });

  it("forwards the orchestrator's SYSTEM_SERVICE_UNAVAILABLE envelope VERBATIM (does not re-classify pg-down)", async () => {
    // WHY: BR-34 names this code for the postgres-down branch and the
    // service is the authority on classification (via `isPgUnavailable`).
    // A regression that re-classified it here would lose the signal.
    const errEnvelope = {
      ok: false as const,
      error: {
        code: "SYSTEM_SERVICE_UNAVAILABLE",
        message: "A backing service is temporarily unavailable.",
      },
    };
    const directedIngestion = vi.fn().mockResolvedValue(errEnvelope);

    const envelope = await ingestDirectedHandler(
      VALID_INPUT,
      makeDeps({
        directedIngestion:
          directedIngestion as unknown as IngestDirectedDeps["directedIngestion"],
      })
    );

    expect(envelope).toEqual(errEnvelope);
  });

  it("forwards an INTERNAL envelope from the orchestrator VERBATIM (intake fallback)", async () => {
    // WHY: when intake fails for a non-pg reason, the service returns
    // INTERNAL with a stable message. A regression that swallowed details
    // or remapped to STRUCTURAL_INVALID would break the contract.
    const errEnvelope = {
      ok: false as const,
      error: {
        code: "INTERNAL",
        message: "Failed to persist the directed payload before dispatch.",
      },
    };
    const directedIngestion = vi.fn().mockResolvedValue(errEnvelope);

    const envelope = await ingestDirectedHandler(
      VALID_INPUT,
      makeDeps({
        directedIngestion:
          directedIngestion as unknown as IngestDirectedDeps["directedIngestion"],
      })
    );

    expect(envelope).toEqual(errEnvelope);
  });

  it("an UNEXPECTED throw from the orchestrator surfaces as a clean INTERNAL envelope (never leaks err.message)", async () => {
    // WHY (BR-30 / BR-32 lesson): a raw throw would let the SDK kernel
    // render `err.message` into the JSON-RPC error — that message can carry
    // ids or invariant text the BFF should never wire-leak. The handler is
    // the LAST line of defence before the kernel.
    const directedIngestion = vi
      .fn()
      .mockRejectedValue(
        new Error("BR-09 invariant violated: raw_information.id = X, llm_run.id = Y")
      );

    const envelope = await ingestDirectedHandler(
      VALID_INPUT,
      makeDeps({
        directedIngestion:
          directedIngestion as unknown as IngestDirectedDeps["directedIngestion"],
      })
    );

    expect(envelope.ok).toBe(false);
    expect(envelope.error?.code).toBe("INTERNAL");
    expect(envelope.error?.message).not.toContain("BR-09");
    expect(envelope.error?.message).not.toContain("raw_information");
    // The cause IS logged server-side (forensic) — but NEVER returned to the
    // caller. We only assert the logger received the diagnostic; the message
    // content is fine to vary.
    expect(logger.error).toHaveBeenCalled();
  });

  it("forwards optional collaborator seams to the orchestrator only when caller provided them", async () => {
    // WHY: `exactOptionalPropertyTypes` is on — accidentally passing
    // `ingestRaw: undefined` would overwrite the orchestrator's default
    // and crash. This test pins the spreader semantics.
    const directedIngestion = vi.fn().mockResolvedValue({
      ok: true,
      result: {
        outcome: "ingested",
        raw_information_id: "raw-x",
        llm_run_id: "run-x",
        chunk_count: 1,
        run: {
          id: "run-x",
          model: "directed",
          prompt_version: "directed-v1",
          status: "completed",
          started_at: "2026-01-01T00:00:00.000Z",
          finished_at: "2026-01-01T00:00:01.000Z",
          attempts: 1,
          input_raw_information_id: "raw-x",
          affected_nodes: [],
        },
        report: [],
        summary: {
          fragments: 0,
          nodes: 0,
          attributes: 0,
          links: 0,
          accepted: 0,
          consolidated: 0,
          superseded_previous: 0,
          needs_review: 0,
          uncertain: 0,
          disputed: 0,
          rejected: 0,
          error: 0,
          dependency_failed: 0,
        },
      },
    });

    await ingestDirectedHandler(
      VALID_INPUT,
      makeDeps({
        directedIngestion:
          directedIngestion as unknown as IngestDirectedDeps["directedIngestion"],
        // Provide a `now` seam; do NOT provide `ingestRaw` — the spread must
        // simply omit the key (not pass `undefined`).
        now: () => new Date(0),
      })
    );

    expect(directedIngestion).toHaveBeenCalledOnce();
    const passedDeps = directedIngestion.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(passedDeps.now).toBeDefined();
    expect("ingestRaw" in passedDeps).toBe(false);
    expect("proposeFragment" in passedDeps).toBe(false);
    expect("verifyNodePin" in passedDeps).toBe(false);
  });
});
