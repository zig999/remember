// Unit tests for pure DB row -> DTO mappers.

import { describe, expect, it } from "vitest";

import {
  deriveFlags,
  formatDateOnly,
  formatTimestamptz,
  groupProvenance,
  toAttributeDetail,
  toLinkDetail,
  toNodeAlias,
  toNodeSummary,
} from "../../../modules/knowledge-graph/service/formatters.js";

describe("formatDateOnly / formatTimestamptz", () => {
  it("formats Date as YYYY-MM-DD using UTC components", () => {
    const d = new Date(Date.UTC(2026, 0, 10));
    expect(formatDateOnly(d)).toBe("2026-01-10");
  });

  it("passes through ISO strings on the date path", () => {
    expect(formatDateOnly("2026-07-15")).toBe("2026-07-15");
  });

  it("formats timestamptz as ISO 8601", () => {
    const d = new Date(Date.UTC(2026, 5, 11, 18, 42, 0));
    expect(formatTimestamptz(d)).toBe("2026-06-11T18:42:00.000Z");
  });

  it("returns null for null inputs", () => {
    expect(formatDateOnly(null)).toBeNull();
    expect(formatTimestamptz(null)).toBeNull();
  });
});

describe("deriveFlags", () => {
  it("flags uncertain attributes/links", () => {
    expect(deriveFlags("uncertain")).toEqual(["uncertain"]);
  });
  it("flags disputed attributes/links", () => {
    expect(deriveFlags("disputed")).toEqual(["disputed"]);
  });
  it("returns no flags for terminal/normal statuses", () => {
    expect(deriveFlags("active")).toEqual([]);
    expect(deriveFlags("superseded")).toEqual([]);
    expect(deriveFlags("deleted")).toEqual([]);
  });
});

describe("toNodeSummary / toNodeAlias", () => {
  it("maps a knowledge_node row to a NodeSummary", () => {
    const out = toNodeSummary({
      id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      node_type_id: "n-type-id",
      node_type: "Project",
      canonical_name: "Projeto Apollo",
      status: "active",
      merged_into_node_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    expect(out).toEqual({
      id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      node_type: "Project",
      canonical_name: "Projeto Apollo",
      status: "active",
      merged_into_node_id: null,
    });
  });

  it("emits the canonical alias correctly", () => {
    const out = toNodeAlias({
      id: "8a1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
      alias: "Projeto Apollo",
      alias_norm: "projeto apollo",
      kind: "canonical",
      created_at: new Date(Date.UTC(2026, 5, 11, 18, 42, 0)),
    });
    expect(out.kind).toBe("canonical");
    expect(out.alias).toBe("Projeto Apollo");
    expect(out.created_at).toBe("2026-06-11T18:42:00.000Z");
  });
});

describe("toAttributeDetail", () => {
  it("emits a complete AttributeDetail with derived flags", () => {
    const out = toAttributeDetail(
      {
        id: "a11c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
        node_id: "9b1c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
        attribute_key_id: "ak-id",
        value_type: "date",
        value: "2026-07-15",
        valid_from: "2026-01-10",
        valid_to: null,
        recorded_at: new Date(Date.UTC(2026, 5, 11, 18, 42, 0)),
        superseded_at: null,
        status: "active",
        confidence: "0.92",
        valid_from_source: "document",
        created_by_run_id: null,
        supersedes_attribute_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        attribute_key: "deadline",
        key_is_temporal: true,
        key_allows_multiple_current: false,
        is_current: true,
        is_in_effect: true,
        effective_status: "active",
      },
      []
    );
    expect(out.confidence).toBe(0.92);
    expect(out.effective_status).toBe("active");
    expect(out.flags).toEqual([]);
    expect(out.provenance).toEqual([]);
  });
});

describe("toLinkDetail", () => {
  it("maps a knowledge_link_resolved row", () => {
    const out = toLinkDetail(
      {
        id: "l11c1e2f-0e57-4d3f-99b1-1d22ce5e0001",
        source_node_id: "src",
        target_node_id: "tgt",
        link_type_id: "lt-id",
        valid_from: "2026-01-10",
        valid_to: null,
        recorded_at: new Date(Date.UTC(2026, 5, 11, 18, 42, 0)),
        superseded_at: null,
        status: "uncertain",
        confidence: "0.50",
        valid_from_source: "stated",
        created_by_run_id: null,
        supersedes_link_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        link_type: "participates_in",
        link_inverse_name: "has_participant",
        is_current: true,
        is_in_effect: true,
        effective_status: "uncertain",
      },
      []
    );
    expect(out.confidence).toBe(0.5);
    expect(out.flags).toEqual(["uncertain"]);
    expect(out.link_type).toBe("participates_in");
    expect(out.link_inverse_name).toBe("has_participant");
  });
});

describe("groupProvenance", () => {
  it("groups by target_id and converts confidence/excerpt fields", () => {
    const grouped = groupProvenance([
      {
        target_id: "x",
        fragment_id: "f1",
        fragment_text: "t1",
        fragment_confidence: "0.91",
        raw_information_id: "ri",
        source_type: "ata",
        received_at: new Date(Date.UTC(2026, 5, 11, 18, 30, 0)),
        excerpt: "...go-live...",
      },
      {
        target_id: "x",
        fragment_id: "f2",
        fragment_text: "t2",
        fragment_confidence: 0.5,
        raw_information_id: "ri",
        source_type: "ata",
        received_at: new Date(Date.UTC(2026, 5, 11, 18, 31, 0)),
        excerpt: "...",
      },
    ]);
    expect(grouped.get("x")?.length).toBe(2);
    expect(grouped.get("x")?.[0]?.confidence).toBe(0.91);
    expect(grouped.get("x")?.[1]?.confidence).toBe(0.5);
  });
});
