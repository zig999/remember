/**
 * Wire → domain transform contract tests.
 *
 * Spec ref: docs/specs/front/features/ingest.feature.spec.md §4 (Response
 * transforms). These pin the camelCase rename + Date parsing so consumers
 * read a domain shape, not a wire shape.
 */
import { describe, expect, it } from "vitest";
import {
  toIngestRawInformationResult,
  toLlmRun,
  toLlmRunSummary,
  type IngestRawInformationResponseWire,
  type LlmRunSummaryWire,
  type LlmRunWire,
} from "../_transforms";

describe("toIngestRawInformationResult", () => {
  it("camelCases the fields and forwards chunks/idempotency_key", () => {
    const wire: IngestRawInformationResponseWire = {
      outcome: "created",
      raw_information_id: "raw-1",
      content_hash: "a".repeat(64),
      chunk_count: 2,
      chunks: [
        {
          id: "c1",
          chunk_index: 0,
          offset_start: 0,
          offset_end: 100,
        },
        {
          id: "c2",
          chunk_index: 1,
          offset_start: 100,
          offset_end: 200,
        },
      ],
      llm_run_id: "run-1",
      idempotency_key: "b".repeat(64),
    };
    const out = toIngestRawInformationResult(wire);
    expect(out.outcome).toBe("created");
    expect(out.rawInformationId).toBe("raw-1");
    expect(out.contentHash).toBe(wire.content_hash);
    expect(out.chunkCount).toBe(2);
    expect(out.chunks).toHaveLength(2);
    expect(out.llmRunId).toBe("run-1");
    expect(out.idempotencyKey).toBe(wire.idempotency_key);
    // affectedNodes is absent in the wire — must be omitted from the result
    // (not `undefined` under exactOptionalPropertyTypes — see header note).
    expect("affectedNodes" in out).toBe(false);
  });

  it("forwards affected_nodes when the wire carries it (forward-compat)", () => {
    const wire: IngestRawInformationResponseWire = {
      outcome: "noop_existing",
      raw_information_id: "raw-2",
      content_hash: "c".repeat(64),
      chunk_count: 1,
      chunks: [],
      llm_run_id: "run-2",
      idempotency_key: "d".repeat(64),
      affected_nodes: [
        { id: "n1", node_type: "Project", canonical_name: "Apollo" },
      ],
    };
    const out = toIngestRawInformationResult(wire);
    expect(out.affectedNodes).toEqual([
      { id: "n1", nodeType: "Project", canonicalName: "Apollo" },
    ]);
  });
});

describe("toLlmRunSummary", () => {
  it("renames superseded_previous/needs_review/orphaned_fragments", () => {
    const wire: LlmRunSummaryWire = {
      accepted: 5,
      consolidated: 2,
      superseded_previous: 1,
      needs_review: 3,
      uncertain: 1,
      disputed: 0,
      rejected: 0,
      error: 0,
      orphaned_fragments: 4,
    };
    const out = toLlmRunSummary(wire);
    expect(out.supersededPrevious).toBe(1);
    expect(out.needsReview).toBe(3);
    expect(out.orphanedFragments).toBe(4);
    expect(out.accepted).toBe(5);
  });
});

describe("toLlmRun", () => {
  const baseSummary: LlmRunSummaryWire = {
    accepted: 1,
    consolidated: 0,
    superseded_previous: 0,
    needs_review: 0,
    uncertain: 0,
    disputed: 0,
    rejected: 0,
    error: 0,
    orphaned_fragments: 0,
  };

  it("parses started_at as a Date and finished_at as Date|null", () => {
    const wire: LlmRunWire = {
      id: "run-1",
      model: "claude-opus-4-8",
      prompt_version: "v3",
      started_at: "2026-06-11T20:24:00Z",
      finished_at: "2026-06-11T20:29:42Z",
      status: "completed",
      attempts: 1,
      input_raw_information_id: "raw-1",
      idempotency_key: "x".repeat(64),
      summary: baseSummary,
    };
    const out = toLlmRun(wire);
    expect(out.startedAt).toBeInstanceOf(Date);
    expect(out.finishedAt).toBeInstanceOf(Date);
    expect(out.finishedAt?.toISOString()).toBe("2026-06-11T20:29:42.000Z");
    expect(out.status).toBe("completed");
    expect(out.promptVersion).toBe("v3");
    expect(out.summary.accepted).toBe(1);
  });

  it("returns finishedAt: null when wire field is null (running run)", () => {
    const wire: LlmRunWire = {
      id: "run-1",
      model: "claude-opus-4-8",
      prompt_version: "v3",
      started_at: "2026-06-11T20:24:00Z",
      finished_at: null,
      status: "running",
      attempts: 1,
      input_raw_information_id: "raw-1",
      idempotency_key: "x".repeat(64),
      summary: baseSummary,
    };
    const out = toLlmRun(wire);
    expect(out.finishedAt).toBeNull();
    expect(out.status).toBe("running");
  });

  it("throws loudly on a malformed started_at (fail-loud contract)", () => {
    const wire: LlmRunWire = {
      id: "run-1",
      model: "claude-opus-4-8",
      prompt_version: "v3",
      started_at: "not-a-date",
      finished_at: null,
      status: "running",
      attempts: 1,
      input_raw_information_id: "raw-1",
      idempotency_key: "x".repeat(64),
      summary: baseSummary,
    };
    expect(() => toLlmRun(wire)).toThrow(/Invalid ISO date string/);
  });
});
