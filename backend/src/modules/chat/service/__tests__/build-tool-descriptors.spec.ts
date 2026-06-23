// Unit tests for `buildToolDescriptors` (BR-06 advertised-schema invariant).
//
// WHY these matter — the chat agentic loop sends the resolved catalog to
// Anthropic's Messages API as a `tools[]` array of `{name, description,
// input_schema}` descriptors. The `input_schema` was historically a
// permissive `{ type:'object', additionalProperties:true }` — fine for
// dispatch (the handler re-validates via Zod, BR-07) but expensive for
// chat: the model could omit required fields (e.g.
// `start_async_ingestion.source_type`) on its first attempt, the Zod guard
// would reject, and the model would auto-correct on a second tool_use,
// burning a full LLM round-trip per turn.
//
// Fix: derive the JSON Schema from each tool's Zod schema via
// `z.toJSONSchema` and advertise THAT to the model — required fields and
// enums steer the first attempt to the right shape.
//
// Failures these tests are designed to catch:
//
//   1. Required fields missing — model calls without `source_type` and
//      wastes a round-trip.
//   2. Enum values not advertised — model passes a free-form string and
//      the Zod guard rejects.
//   3. Conversion regression — a `z.toJSONSchema` upgrade emits something
//      Anthropic cannot accept (root not type:object, has $defs). We
//      fall back PER-TOOL to the permissive shape and log; this test
//      makes the fallback observable.
//   4. Empty-properties regression — a tool with no required input
//      (e.g. `list_node_types`) must still convert to a valid root-level
//      object schema, not blow up.

import { describe, expect, it, vi } from "vitest";

import { z } from "zod";
import type { Logger } from "pino";

import { buildToolDescriptors } from "../chat-agent.service.js";
import type { McpTool } from "../../../../mcp/server.js";
import type { ResolvedChatToolCatalog } from "../tool-catalog.js";

/** Minimal noop logger that records `warn` / `error` calls for assertion. */
function makeLogger(): {
  logger: Logger;
  warnCalls: Array<{ obj: unknown; msg?: string }>;
  errorCalls: Array<{ obj: unknown; msg?: string }>;
} {
  const warnCalls: Array<{ obj: unknown; msg?: string }> = [];
  const errorCalls: Array<{ obj: unknown; msg?: string }> = [];
  // The chat-agent code only uses `warn` / `error` on the conversion path;
  // we still stub the full surface so the cast to Logger is safe.
  const noop = (): void => {};
  const logger = {
    warn: (obj: unknown, msg?: string) => {
      warnCalls.push({ obj, msg });
    },
    error: (obj: unknown, msg?: string) => {
      errorCalls.push({ obj, msg });
    },
    info: noop,
    debug: noop,
    trace: noop,
    fatal: noop,
    child: (): Logger => logger,
    level: "info",
  } as unknown as Logger;
  return { logger, warnCalls, errorCalls };
}

/** Build a fake `McpTool` carrying the given Zod schema. */
function fakeTool(name: string, inputSchema: McpTool["inputSchema"]): McpTool {
  return {
    name,
    description: `fake ${name}`,
    inputSchema,
    handler: vi.fn().mockResolvedValue({ ok: true, result: {} }),
  };
}

/** Build a fake catalog (preserves key insertion order, which is the
 *  per-`Object.keys` order the descriptor builder iterates). */
function fakeCatalog(entries: Array<[string, McpTool]>): ResolvedChatToolCatalog {
  const out: Record<string, McpTool> = {};
  for (const [k, v] of entries) out[k] = v;
  return out;
}

// ---------------------------------------------------------------------------
// 1. Required fields + enum: start_async_ingestion advertises `source_type`
// ---------------------------------------------------------------------------

describe("buildToolDescriptors — required-field projection (BR-06)", () => {
  it("advertises `source_type` as required AND its enum values — model gets it right on the first attempt", () => {
    // Mirrors the real `StartAsyncIngestionMcpInputSchema` shape: a required
    // `content` string, a required `source_type` enum, optional `metadata`,
    // `model`, `prompt_version`. If this projection regresses the model
    // omits `source_type` and burns a round-trip.
    const SourceType = z.enum([
      "pdf",
      "email",
      "ata",
      "chat",
      "artigo",
      "transcricao",
      "outro",
    ]);
    const schema = z.object({
      content: z.string().min(1).max(10 * 1024 * 1024),
      source_type: SourceType,
      metadata: z.record(z.string(), z.unknown()).optional(),
      model: z.string().min(1).optional(),
      prompt_version: z.string().min(1).optional(),
    });
    const { logger, warnCalls } = makeLogger();

    const descriptors = buildToolDescriptors(
      fakeCatalog([["start_async_ingestion", fakeTool("start_async_ingestion", schema)]]),
      logger
    );

    expect(descriptors).toHaveLength(1);
    const desc = descriptors[0]!;
    expect(desc.name).toBe("start_async_ingestion");

    const schemaOut = desc.input_schema as unknown as {
      type: string;
      required?: string[];
      properties?: Record<string, { type?: string; enum?: string[] }>;
    };
    expect(schemaOut.type).toBe("object");
    // Required must include the two mandatory fields and NOT the optionals.
    expect(schemaOut.required).toEqual(expect.arrayContaining(["content", "source_type"]));
    expect(schemaOut.required).not.toContain("metadata");
    expect(schemaOut.required).not.toContain("model");
    expect(schemaOut.required).not.toContain("prompt_version");
    // Enum values for source_type must surface so the model picks one.
    expect(schemaOut.properties?.["source_type"]?.enum).toEqual([
      "pdf",
      "email",
      "ata",
      "chat",
      "artigo",
      "transcricao",
      "outro",
    ]);
    // No fallback emitted → no warn logged.
    expect(warnCalls).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. No-required tool (list_node_types-like) — empty `required` is OK
// ---------------------------------------------------------------------------

describe("buildToolDescriptors — tools with no required input", () => {
  it("emits a valid object schema for a `z.object({})` (no `required` array or empty)", () => {
    // `list_node_types` takes no inputs — must still convert cleanly.
    const schema = z.object({});
    const { logger, warnCalls } = makeLogger();

    const descriptors = buildToolDescriptors(
      fakeCatalog([["list_node_types", fakeTool("list_node_types", schema)]]),
      logger
    );

    const desc = descriptors[0]!;
    const schemaOut = desc.input_schema as unknown as {
      type: string;
      required?: string[];
      properties?: Record<string, unknown>;
    };
    expect(schemaOut.type).toBe("object");
    // Zod emits no `required` key (or empty) when nothing is mandatory —
    // both are valid per JSON Schema. Anthropic accepts either.
    if (schemaOut.required !== undefined) {
      expect(schemaOut.required).toEqual([]);
    }
    expect(warnCalls).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Fallback: a tool whose schema cannot be converted falls back PER-TOOL
// ---------------------------------------------------------------------------

describe("buildToolDescriptors — fallback on conversion failure", () => {
  it("returns permissive `{type:'object', additionalProperties:true}` and warns when z.toJSONSchema throws", () => {
    // Pass a non-Zod sentinel — the real `z.toJSONSchema` will throw on
    // anything that is not a ZodType. This proves the fallback fires on
    // exception, not just on a non-object root.
    const broken = { _def: { typeName: "NotARealZodType" } } as unknown as McpTool["inputSchema"];
    const { logger, warnCalls } = makeLogger();

    const descriptors = buildToolDescriptors(
      fakeCatalog([["broken_tool", fakeTool("broken_tool", broken)]]),
      logger
    );

    expect(descriptors).toHaveLength(1);
    const schemaOut = descriptors[0]!.input_schema as unknown as Record<string, unknown>;
    expect(schemaOut["type"]).toBe("object");
    expect(schemaOut["additionalProperties"]).toBe(true);
    // Exactly one warn for the broken tool.
    expect(warnCalls.length).toBeGreaterThanOrEqual(1);
    const warned = warnCalls.find(
      (c) => typeof c.obj === "object" && c.obj !== null && (c.obj as { tool?: string }).tool === "broken_tool"
    );
    expect(warned).toBeDefined();
  });

  it("falls back when the converted root is not type:'object' (e.g. a scalar schema)", () => {
    // A bare `z.string()` converts to `{type:'string'}` — Anthropic rejects
    // that as a tool input_schema. The fallback must kick in.
    const schema = z.string() as unknown as McpTool["inputSchema"];
    const { logger, warnCalls } = makeLogger();

    const descriptors = buildToolDescriptors(
      fakeCatalog([["scalar_tool", fakeTool("scalar_tool", schema)]]),
      logger
    );

    const schemaOut = descriptors[0]!.input_schema as unknown as Record<string, unknown>;
    expect(schemaOut["type"]).toBe("object");
    expect(schemaOut["additionalProperties"]).toBe(true);
    expect(
      warnCalls.some(
        (c) =>
          typeof c.obj === "object" &&
          c.obj !== null &&
          (c.obj as { event?: string }).event === "chat.tool_schema_non_object_root"
      )
    ).toBe(true);
  });

  it("falls back PER-TOOL — a broken tool does not poison its neighbours", () => {
    // Two tools: one valid, one broken. The valid one must still get the
    // derived schema; the broken one gets the permissive shape. This is
    // the boot-safety contract — never derail the chat surface.
    const ok = z.object({ id: z.string() });
    const broken = { _def: { typeName: "Bogus" } } as unknown as McpTool["inputSchema"];
    const { logger } = makeLogger();

    const descriptors = buildToolDescriptors(
      fakeCatalog([
        ["ok_tool", fakeTool("ok_tool", ok)],
        ["broken_tool", fakeTool("broken_tool", broken)],
      ]),
      logger
    );

    expect(descriptors).toHaveLength(2);
    const okSchema = descriptors[0]!.input_schema as unknown as {
      type: string;
      required?: string[];
      additionalProperties?: unknown;
    };
    expect(okSchema.type).toBe("object");
    expect(okSchema.required).toEqual(["id"]);
    // Derived schemas should NOT carry `additionalProperties: true` —
    // Zod's draft-7 target emits `additionalProperties: false` for
    // `z.object`. (We assert "not true" to allow future Zod tweaks.)
    expect(okSchema.additionalProperties).not.toBe(true);

    const brokenSchema = descriptors[1]!.input_schema as unknown as Record<string, unknown>;
    expect(brokenSchema["additionalProperties"]).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Determinism: the same catalog produces byte-identical descriptors across
// invocations — preserves the P0 prompt-cache prefix byte-stability.
// ---------------------------------------------------------------------------

describe("buildToolDescriptors — determinism (P0 cache prefix stability)", () => {
  it("produces byte-identical JSON for the same catalog across calls", () => {
    // The Anthropic tools[] array is part of the cached prompt prefix.
    // `z.toJSONSchema` is a pure function of the schema, so the output
    // must be deterministic for a fixed catalog — re-cache happens ONCE
    // on rollout, then stable.
    const schema = z.object({
      a: z.string(),
      b: z.number().optional(),
      c: z.enum(["x", "y"]),
    });
    const catalog = fakeCatalog([["t", fakeTool("t", schema)]]);
    const { logger } = makeLogger();

    const a = JSON.stringify(buildToolDescriptors(catalog, logger));
    const b = JSON.stringify(buildToolDescriptors(catalog, logger));
    expect(a).toBe(b);
  });

  it("strips the `$schema` meta-key so the prefix does not carry draft metadata", () => {
    // Zod's draft-7 target prepends `$schema: "http://json-schema.org/draft-07/schema#"`.
    // Anthropic does not need it; keeping it would just bloat the prefix.
    const schema = z.object({ a: z.string() });
    const { logger } = makeLogger();

    const descriptors = buildToolDescriptors(
      fakeCatalog([["t", fakeTool("t", schema)]]),
      logger
    );
    const out = descriptors[0]!.input_schema as unknown as Record<string, unknown>;
    expect(out["$schema"]).toBeUndefined();
  });
});
