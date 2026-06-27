/**
 * `_transforms.ts` — wire→surface mapping unit tests (dev_tc_005).
 *
 * These tests pin the camelCase surface shape promised in
 * `ingest.feature.spec.md §4 Response transforms`. The mapping is pure;
 * if the wire field names ever change on the backend, these tests fail
 * loudly (better than a silent contract drift through the workspace).
 */
import { describe, expect, it } from "vitest";
import {
  toIngestRawInformationResponse,
  toLlmRun,
  toLlmRunSummary,
} from "../_transforms";

describe("toIngestRawInformationResponse", () => {
  it("maps the wire response to camelCase and preserves the outcome", () => {
    const view = toIngestRawInformationResponse({
      outcome: "created",
      raw_information_id: "raw-1",
      content_hash: "h",
      chunk_count: 3,
      llm_run_id: "run-1",
      idempotency_key: "k",
    });
    expect(view).toEqual({
      outcome: "created",
      rawInformationId: "raw-1",
      contentHash: "h",
      chunkCount: 3,
      llmRunId: "run-1",
      idempotencyKey: "k",
    });
    expect("affectedNodes" in view).toBe(false);
  });

  it("maps optional affected_nodes into camelCase when present (noop_existing)", () => {
    const view = toIngestRawInformationResponse({
      outcome: "noop_existing",
      raw_information_id: "raw-1",
      content_hash: "h",
      chunk_count: 1,
      llm_run_id: "run-1",
      idempotency_key: "k",
      affected_nodes: [
        { id: "n1", canonical_name: "Apollo", node_type: "project" },
      ],
    });
    expect(view.outcome).toBe("noop_existing");
    expect(view.affectedNodes).toEqual([
      { id: "n1", canonicalName: "Apollo", nodeType: "project" },
    ]);
  });
});

describe("toLlmRunSummary", () => {
  it("renames superseded_previous → supersededPrevious and friends", () => {
    expect(
      toLlmRunSummary({
        accepted: 1,
        consolidated: 2,
        superseded_previous: 3,
        needs_review: 4,
        uncertain: 5,
        disputed: 6,
        rejected: 7,
        error: 8,
        orphaned_fragments: 9,
      }),
    ).toEqual({
      accepted: 1,
      consolidated: 2,
      supersededPrevious: 3,
      needsReview: 4,
      uncertain: 5,
      disputed: 6,
      rejected: 7,
      error: 8,
      orphanedFragments: 9,
    });
  });
});

describe("toLlmRun", () => {
  it("maps the LlmRun wire shape including the nested summary", () => {
    const view = toLlmRun({
      id: "run-1",
      model: "claude-opus-4-8",
      prompt_version: "v3",
      started_at: "2026-01-01T00:00:00Z",
      finished_at: "2026-01-01T00:00:10Z",
      status: "completed",
      attempts: 1,
      input_raw_information_id: "raw-1",
      idempotency_key: "k",
      summary: {
        accepted: 1,
        consolidated: 0,
        superseded_previous: 0,
        needs_review: 0,
        uncertain: 0,
        disputed: 0,
        rejected: 0,
        error: 0,
        orphaned_fragments: 0,
      },
    });
    expect(view.id).toBe("run-1");
    expect(view.promptVersion).toBe("v3");
    expect(view.inputRawInformationId).toBe("raw-1");
    expect(view.summary.accepted).toBe(1);
  });
});
