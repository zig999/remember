// TC-02 acceptance criteria covered:
//   - Each of the 13 tool names produces a string <= 200 chars.
//   - Fallback "<n keys>" fires for an unknown tool name AND for an unexpected
//     input shape (missing required fields).
//   - Search query is truncated to first 60 chars; optional layers/expand_depth
//     are appended only when present.
//
// Spec refs: chat.back.md BR-09 (per-tool formats, <=200 chars, no raw values).

import { describe, expect, it } from "vitest";

import {
  buildArgsSummary,
  ARGS_SUMMARY_MAX_CHARS,
} from "../../../modules/chat/service/args-summary.js";
import { CHAT_TOOL_NAMES } from "../../../modules/chat/service/tool-catalog.js";

// Canonical UUIDs used across cases — keeps the assertions readable.
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

describe("chat/args-summary", () => {
  // BR-09: every produced summary is bounded by 200 code points.
  it("every produced summary is <= 200 chars (all 13 tool names, valid inputs)", () => {
    // Hand-built valid inputs per tool. Strings deliberately mundane — we are
    // exercising the upper bound on the producer side.
    const inputs: Record<string, unknown> = {
      search: { query: "reuniao apollo" },
      get_node: { id: UUID_A },
      traverse: { id: UUID_A, depth: 2 },
      get_history_link: { id: UUID_A },
      get_history_attribute: { id: UUID_A },
      get_history_attribute_key: { node_id: UUID_A, key: "title" },
      list_nodes: { node_type: "Person", limit: 20 },
      list_node_types: {},
      list_link_types: {},
      list_attribute_keys: {},
      get_provenance_link: { id: UUID_A },
      get_provenance_attribute: { id: UUID_A },
      get_provenance_fragment: { id: UUID_A },
    };
    for (const tool of CHAT_TOOL_NAMES) {
      const s = buildArgsSummary(tool, inputs[tool]);
      expect([...s].length).toBeLessThanOrEqual(ARGS_SUMMARY_MAX_CHARS);
    }
  });

  // BR-09: search format with first 60 chars + optional fields.
  it("search: query is truncated to first 60 chars", () => {
    const longQuery = "x".repeat(120);
    const s = buildArgsSummary("search", { query: longQuery });
    // Expected: `query="<60 x's>"`
    expect(s).toBe(`query="${"x".repeat(60)}"`);
  });

  it("search: layers and expand_depth appended when present", () => {
    const s = buildArgsSummary("search", {
      query: "Rodrigo",
      layers: ["nodes", "links"],
      expand_depth: 2,
    });
    expect(s).toBe('query="Rodrigo" layers=nodes,links expand_depth=2');
  });

  it("search: omits layers/expand_depth when absent", () => {
    const s = buildArgsSummary("search", { query: "Rodrigo" });
    expect(s).toBe('query="Rodrigo"');
  });

  // BR-09: traverse adds depth when provided.
  it("traverse: id and optional depth", () => {
    expect(buildArgsSummary("traverse", { id: UUID_A })).toBe(`id=${UUID_A}`);
    expect(buildArgsSummary("traverse", { id: UUID_A, depth: 3 })).toBe(
      `id=${UUID_A} depth=3`
    );
  });

  // BR-09: get_node + get_history_link/_attribute + get_provenance_* share format.
  it.each([
    "get_node",
    "get_history_link",
    "get_history_attribute",
    "get_provenance_link",
    "get_provenance_attribute",
    "get_provenance_fragment",
  ])("%s: produces 'id=<uuid>'", (tool) => {
    expect(buildArgsSummary(tool, { id: UUID_B })).toBe(`id=${UUID_B}`);
  });

  // BR-09: get_history_attribute_key emits both fields.
  it("get_history_attribute_key: node_id and key", () => {
    const s = buildArgsSummary("get_history_attribute_key", {
      node_id: UUID_A,
      key: "title",
    });
    expect(s).toBe(`node_id=${UUID_A} key=title`);
  });

  // BR-09: list_nodes is `node_type=<name> limit=<n>`.
  it("list_nodes: node_type and limit", () => {
    const s = buildArgsSummary("list_nodes", { node_type: "Person", limit: 50 });
    expect(s).toBe("node_type=Person limit=50");
  });

  // BR-09: list_node_types / list_link_types / list_attribute_keys -> "" (no args).
  it.each(["list_node_types", "list_link_types", "list_attribute_keys"])(
    "%s: produces empty string",
    (tool) => {
      expect(buildArgsSummary(tool, {})).toBe("");
    }
  );

  // BR-09: fallback "<n keys>" for unknown tool name.
  it("unknown tool name: fallback '<n keys>'", () => {
    const s = buildArgsSummary("nonexistent_tool", { a: 1, b: 2, c: 3 });
    expect(s).toBe("3 keys");
  });

  // BR-09: fallback for unexpected shape (missing required fields).
  it("missing required fields: fallback '<n keys>'", () => {
    // search without `query`
    expect(buildArgsSummary("search", { layers: ["nodes"] })).toBe("1 keys");
    // get_node without `id`
    expect(buildArgsSummary("get_node", { foo: "bar" })).toBe("1 keys");
    // list_nodes missing `limit`
    expect(buildArgsSummary("list_nodes", { node_type: "Person" })).toBe("1 keys");
  });

  // Defensive: non-object input collapses to fallback without throwing.
  it("non-object input: never throws, returns fallback", () => {
    expect(buildArgsSummary("search", null)).toBe("0 keys");
    expect(buildArgsSummary("search", "raw string")).toBe("0 keys");
    expect(buildArgsSummary("search", 42)).toBe("0 keys");
    expect(buildArgsSummary("search", undefined)).toBe("0 keys");
    expect(buildArgsSummary("search", [1, 2])).toBe("0 keys");
  });

  // BR-09 anti-leak: no raw value/text columns or document bodies.
  it("never includes raw text columns or large bodies", () => {
    const longText = "a".repeat(10_000);
    // Even with a giant `query`, output stays bounded and only contains the
    // first 60 chars wrapped in `query="..."` — no echo of the full body.
    const s = buildArgsSummary("search", { query: longText });
    expect([...s].length).toBeLessThanOrEqual(ARGS_SUMMARY_MAX_CHARS);
    expect(s).toBe(`query="${"a".repeat(60)}"`);
  });

  // -------------------------------------------------------------------------
  // v2.4 — TC-05 acceptance criteria
  // -------------------------------------------------------------------------

  // BR-43 step 5 / BR-09: redact content to its length only.
  it("start_async_ingestion: emits source_type and content_len only — NEVER raw content", () => {
    const content = "This is a confidential meeting transcript. Lorem ipsum dolor sit amet.";
    const s = buildArgsSummary("start_async_ingestion", {
      source_type: "transcript",
      content,
    });
    // Format: "source_type=<value> content_len=<n>"
    expect(s).toBe(`source_type=transcript content_len=${[...content].length}`);
    // Anti-leak invariant: the raw content MUST NOT appear in the summary.
    expect(s).not.toContain("confidential");
    expect(s).not.toContain("Lorem ipsum");
  });

  // BR-09: content_len is computed in Unicode code points, not UTF-16 code units.
  it("start_async_ingestion: content_len counts Unicode code points", () => {
    // 4 emoji = 4 code points (each is a surrogate pair = 2 UTF-16 units, i.e.
    // 8 .length characters). The summary MUST report 4, not 8.
    const content = "👋🌍🎉🚀";
    const s = buildArgsSummary("start_async_ingestion", {
      source_type: "note",
      content,
    });
    expect(s).toBe("source_type=note content_len=4");
  });

  // BR-09: very large content stays bounded — only its length is surfaced.
  it("start_async_ingestion: 10 MiB content surfaces as a small numeric length", () => {
    const big = "x".repeat(1_000_000);
    const s = buildArgsSummary("start_async_ingestion", {
      source_type: "document",
      content: big,
    });
    expect(s).toBe("source_type=document content_len=1000000");
    expect([...s].length).toBeLessThanOrEqual(ARGS_SUMMARY_MAX_CHARS);
  });

  // BR-09: fallback when required fields missing.
  it("start_async_ingestion: missing source_type or content -> fallback", () => {
    expect(buildArgsSummary("start_async_ingestion", { source_type: "note" })).toBe(
      "1 keys"
    );
    expect(buildArgsSummary("start_async_ingestion", { content: "x" })).toBe(
      "1 keys"
    );
  });

  // BR-45 step 5: get_ingestion_status emits llm_run_id.
  it("get_ingestion_status: emits llm_run_id only", () => {
    const s = buildArgsSummary("get_ingestion_status", { llm_run_id: UUID_A });
    expect(s).toBe(`llm_run_id=${UUID_A}`);
  });

  // BR-09: fallback when llm_run_id missing.
  it("get_ingestion_status: missing llm_run_id -> fallback", () => {
    expect(buildArgsSummary("get_ingestion_status", {})).toBe("0 keys");
    expect(buildArgsSummary("get_ingestion_status", { other: "x" })).toBe(
      "1 keys"
    );
  });
});
