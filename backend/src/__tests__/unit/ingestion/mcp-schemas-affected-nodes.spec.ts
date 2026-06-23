// TC-02 / BR-33 — `GetIngestionStatusOutputSchema` carries `affected_nodes`
// as an optional array.

import { describe, expect, it } from "vitest";

import {
  GetIngestionStatusOutputSchema,
  AffectedNodeOutputSchema,
} from "../../../modules/ingestion/mcp/mcp-schemas.js";

function uuid(n: number): string {
  const hex = n.toString(16).padStart(2, "0");
  return `00000000-0000-4000-8000-0000000000${hex}`;
}

describe("mcp-schemas — GetIngestionStatusOutputSchema (TC-02 / BR-33)", () => {
  const baseRun = {
    id: uuid(1),
    model: "claude-sonnet-4-6",
    prompt_version: "v3",
    started_at: "2026-06-23T10:00:00.000Z",
    finished_at: "2026-06-23T10:00:42.000Z",
    status: "completed" as const,
    attempts: 1,
    input_raw_information_id: uuid(2),
    idempotency_key: "a".repeat(64),
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
  };

  it("accepts a completed run payload WITH affected_nodes", () => {
    const out = GetIngestionStatusOutputSchema.parse({
      ...baseRun,
      affected_nodes: [
        { id: uuid(10), canonical_name: "Alice", node_type: "Person" },
      ],
    });
    expect(out.affected_nodes).toEqual([
      { id: uuid(10), canonical_name: "Alice", node_type: "Person" },
    ]);
  });

  it("accepts a payload WITHOUT affected_nodes (running / failed runs)", () => {
    const out = GetIngestionStatusOutputSchema.parse({
      ...baseRun,
      status: "running",
      finished_at: null,
    });
    expect(out.affected_nodes).toBeUndefined();
  });

  it("accepts an EMPTY affected_nodes array (completed run with only rejected outcomes)", () => {
    const out = GetIngestionStatusOutputSchema.parse({
      ...baseRun,
      affected_nodes: [],
    });
    expect(out.affected_nodes).toEqual([]);
  });

  it("rejects affected_nodes set to null on the wire (serializer contract)", () => {
    // `.optional()` accepts `undefined` but NOT `null`. The wire contract says
    // serializers MUST omit the key entirely when absent; never emit `null`.
    const parsed = GetIngestionStatusOutputSchema.safeParse({
      ...baseRun,
      affected_nodes: null,
    });
    expect(parsed.success).toBe(false);
  });

  it("AffectedNodeOutputSchema requires {id (uuid), canonical_name, node_type}", () => {
    const parsed = AffectedNodeOutputSchema.safeParse({
      id: uuid(1),
      canonical_name: "Alice",
      node_type: "Person",
    });
    expect(parsed.success).toBe(true);

    // Missing required fields
    expect(
      AffectedNodeOutputSchema.safeParse({ id: uuid(1) }).success
    ).toBe(false);

    // Non-uuid id
    expect(
      AffectedNodeOutputSchema.safeParse({
        id: "not-uuid",
        canonical_name: "x",
        node_type: "Person",
      }).success
    ).toBe(false);
  });
});
