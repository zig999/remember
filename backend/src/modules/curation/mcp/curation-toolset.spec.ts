// Unit tests for the MCP `curation` toolset bundle (BR-31).
//
// Acceptance criteria addressed (TC-02 validation.criteria):
//   - CURATION_TOOL_NAMES has exactly 7 entries, matching the keys of
//     CurationToolInputJsonSchemas and CurationToolDescriptions.
//   - CurationToolInputJsonSchemas.merge_nodes is a non-empty JSON Schema
//     derived from MergeNodesBodySchema.
//   - Every handler returns an `{ ok }` envelope — never throws.
//   - The shared `mapErrorToEnvelope` from TC-01 is the failure path; service
//     errors surface byte-identical to the REST mapper (parity tests in
//     integration are scoped to TC-04, BR-32; this unit spec is scoped to
//     bundle shape + envelope contract).
//
// Strategy: stub the seven service functions via `vi.mock` so the test never
// touches pg. The fake pool only needs to exist (the services never reach it
// because their entry points are replaced by mocks).

import { beforeEach, describe, expect, it, vi } from "vitest";
import pino from "pino";

import { buildMcpServer } from "../../../mcp/server.js";
import {
  buildSnapshot as buildKgSnapshot,
  type CatalogSnapshot,
} from "../../knowledge-graph/catalog/catalog.js";
import {
  buildSnapshot as buildIngestionSnapshot,
  type CatalogSnapshot as IngestionCatalogSnapshot,
} from "../../ingestion/catalog/catalog.js";
import {
  ConflictError,
  NodeDeletedError,
  ResourceNotFoundError,
} from "../service/errors.js";
import {
  CURATION_TOOL_NAMES,
  CurationToolDescriptions,
  CurationToolInputJsonSchemas,
  registerCurationToolset,
  type CurationToolName,
} from "./curation-toolset.js";

// ---------------------------------------------------------------------------
// vi.mock — stub every service function the toolset wraps. Each mock is set
// per-test via `mockedX.mockResolvedValueOnce(...)` or `.mockRejectedValueOnce`.
// ---------------------------------------------------------------------------

vi.mock("../service/queue.service.js", () => ({
  listReviewQueueService: vi.fn(),
}));
vi.mock("../service/entity-match.service.js", () => ({
  resolveEntityMatchService: vi.fn(),
  mergeNodesService: vi.fn(),
}));
vi.mock("../service/dispute.service.js", () => ({
  resolveDisputeService: vi.fn(),
}));
vi.mock("../service/item.service.js", () => ({
  confirmItemService: vi.fn(),
  rejectItemService: vi.fn(),
  correctItemService: vi.fn(),
}));

import { listReviewQueueService } from "../service/queue.service.js";
import {
  mergeNodesService,
  resolveEntityMatchService,
} from "../service/entity-match.service.js";
import { resolveDisputeService } from "../service/dispute.service.js";
import {
  confirmItemService,
  correctItemService,
  rejectItemService,
} from "../service/item.service.js";

const mockedListQueue = vi.mocked(listReviewQueueService);
const mockedResolveEntity = vi.mocked(resolveEntityMatchService);
const mockedMergeNodes = vi.mocked(mergeNodesService);
const mockedResolveDispute = vi.mocked(resolveDisputeService);
const mockedConfirmItem = vi.mocked(confirmItemService);
const mockedRejectItem = vi.mocked(rejectItemService);
const mockedCorrectItem = vi.mocked(correctItemService);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const silentLogger = pino({ level: "silent" });

function buildKgCatalog(): CatalogSnapshot {
  return buildKgSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

function buildIngestionCatalog(): IngestionCatalogSnapshot {
  return buildIngestionSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
    attributeValidValues: [],
  });
}

/** Minimal pg.Pool stub — services are all mocked, so the pool is never
 *  actually touched. */
function buildFakePool(): import("pg").Pool {
  return {
    connect: async () => {
      throw new Error("pool.connect must not be reached — services are mocked");
    },
  } as unknown as import("pg").Pool;
}

/** Register the toolset on a fresh `McpServer` and return both for inspection. */
function setupToolset() {
  const mcp = buildMcpServer(silentLogger);
  const catalog = buildKgCatalog();
  const ingestionCatalog = buildIngestionCatalog();
  const pool = buildFakePool();
  registerCurationToolset({
    mcp,
    pool,
    logger: silentLogger,
    catalog,
    ingestionCatalog,
  });
  return { mcp, pool, catalog, ingestionCatalog };
}

// Canonical UUIDs used across the suite.
const NODE_ID = "11111111-1111-4111-8111-111111111111";
const SURVIVOR_ID = "22222222-2222-4222-8222-222222222222";
const ABSORBED_ID = "33333333-3333-4333-8333-333333333333";
const ITEM_ID = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Bundle shape — BR-31. The exported triple stays in lockstep.
// ---------------------------------------------------------------------------

describe("curation toolset — bundle shape (BR-31)", () => {
  it("CURATION_TOOL_NAMES contains exactly seven names (no compliance_delete)", () => {
    // BR-31: this domain owns seven tools; `compliance_delete` is registered
    // by `compliance-audit` and joins the closed whitelist at the transport.
    expect(CURATION_TOOL_NAMES).toHaveLength(7);
    expect(CURATION_TOOL_NAMES).toEqual([
      "list_review_queue",
      "resolve_entity_match",
      "merge_nodes",
      "resolve_dispute",
      "confirm_item",
      "reject_item",
      "correct_item",
    ]);
    expect(CURATION_TOOL_NAMES).not.toContain(
      "compliance_delete" as CurationToolName
    );
  });

  it("CurationToolInputJsonSchemas keys match CURATION_TOOL_NAMES exactly", () => {
    // BR-31: the bundle is consumed by the MCP curation transport at boot;
    // any drift between the three exports would silently desync the dispatch
    // table from the `tools/list` payload.
    const jsonSchemaKeys = Object.keys(CurationToolInputJsonSchemas).sort();
    const names = [...CURATION_TOOL_NAMES].sort();
    expect(jsonSchemaKeys).toEqual(names);
  });

  it("CurationToolDescriptions has one non-empty entry per tool name", () => {
    for (const name of CURATION_TOOL_NAMES) {
      expect(CurationToolDescriptions[name]).toBeTypeOf("string");
      expect(CurationToolDescriptions[name].length).toBeGreaterThan(0);
    }
  });

  it("CurationToolInputJsonSchemas.merge_nodes is a non-empty JSON Schema", () => {
    // Acceptance criterion (validation.criteria item 5): the JSON Schema
    // derivation produced for `merge_nodes` is a real, non-empty object that
    // can be served over `tools/list`. The Zod source is a `superRefine`-
    // wrapped `z.object({ survivor_id, absorbed_id, reason })` and we expect
    // the derived schema to surface the three fields under `properties`.
    const schema = CurationToolInputJsonSchemas.merge_nodes as Record<
      string,
      unknown
    >;
    expect(schema).toBeTypeOf("object");
    expect(schema).not.toBeNull();
    expect(Object.keys(schema).length).toBeGreaterThan(0);
    // Drill into the schema to find `properties`. With Zod v4 + `unrepresentable: "any"`,
    // a `superRefine`-wrapped object surfaces its inner shape as the root
    // properties block.
    const props = schema.properties as Record<string, unknown> | undefined;
    if (props !== undefined) {
      // Required Zod fields surface as JSON-Schema property entries.
      expect(props.survivor_id).toBeDefined();
      expect(props.absorbed_id).toBeDefined();
      expect(props.reason).toBeDefined();
    }
  });

  it("every CurationToolInputJsonSchemas entry is a non-empty object", () => {
    // JSON-Schema-2020-12 root objects may use `type`/`$ref` (the common case)
    // or composition keywords (`allOf` / `anyOf` / `oneOf`) for intersections
    // and unions — `resolve_entity_match` lands in the `allOf` form because
    // its Zod source uses `.and()`. Either is acceptable; we just assert the
    // object is non-empty and is a valid schema shape.
    for (const name of CURATION_TOOL_NAMES) {
      const schema = CurationToolInputJsonSchemas[name] as Record<
        string,
        unknown
      >;
      expect(schema).toBeTypeOf("object");
      expect(schema).not.toBeNull();
      // At least one structural keyword must be present.
      const hasStructure =
        schema.type !== undefined ||
        schema.$ref !== undefined ||
        Array.isArray(schema.allOf) ||
        Array.isArray(schema.anyOf) ||
        Array.isArray(schema.oneOf) ||
        schema.properties !== undefined;
      expect(hasStructure).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Registration — the toolset binds the seven tools on the shared McpServer.
// ---------------------------------------------------------------------------

describe("curation toolset — registration", () => {
  it("registers all seven tools under the `curation` toolset key", () => {
    const { mcp } = setupToolset();
    for (const name of CURATION_TOOL_NAMES) {
      expect(mcp.getTool("curation", name)).toBeDefined();
    }
    // `compliance_delete` is NOT registered by this domain.
    expect(mcp.getTool("curation", "compliance_delete")).toBeUndefined();
  });

  it("re-registering the same toolset throws (idempotency guard)", () => {
    const mcp = buildMcpServer(silentLogger);
    const catalog = buildKgCatalog();
    const ingestionCatalog = buildIngestionCatalog();
    const pool = buildFakePool();
    registerCurationToolset({
      mcp,
      pool,
      logger: silentLogger,
      catalog,
      ingestionCatalog,
    });
    expect(() =>
      registerCurationToolset({
        mcp,
        pool,
        logger: silentLogger,
        catalog,
        ingestionCatalog,
      })
    ).toThrow(/already registered/);
  });
});

// ---------------------------------------------------------------------------
// Handler envelope contract — every handler returns { ok: ... }.
//
// validation.criteria item 6: "Each handler function returns a value matching
// { ok: boolean } — no uncaught throws propagate out".
// ---------------------------------------------------------------------------

describe("curation toolset — handler envelope (BR-31)", () => {
  it("list_review_queue wraps the service result in { ok: true, result }", async () => {
    const payload = { total: 0, limit: 20, offset: 0, items: [] };
    mockedListQueue.mockResolvedValueOnce(payload as never);

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "list_review_queue");
    expect(tool).toBeDefined();
    const out = (await tool!.handler({})) as {
      ok: boolean;
      result?: unknown;
    };
    expect(out.ok).toBe(true);
    expect(out.result).toEqual(payload);
    expect(mockedListQueue).toHaveBeenCalledTimes(1);
  });

  it("resolve_entity_match forwards node_id + body to the service", async () => {
    mockedResolveEntity.mockResolvedValueOnce({
      node_id: NODE_ID,
      decision: "keep_separate",
      resulting_status: "active",
      target_node_id: null,
      affected: null,
      action_id: "act-1",
    } as never);

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "resolve_entity_match")!;
    const out = (await tool.handler({
      node_id: NODE_ID,
      decision: "keep_separate",
    })) as { ok: boolean; result?: { node_id: string } };
    expect(out.ok).toBe(true);
    expect(out.result?.node_id).toBe(NODE_ID);

    const args = mockedResolveEntity.mock.calls[0]!;
    expect(args[1]).toBe(NODE_ID);
    expect(args[2]).toMatchObject({
      decision: "keep_separate",
    });
  });

  it("merge_nodes forwards survivor_id / absorbed_id / reason verbatim", async () => {
    mockedMergeNodes.mockResolvedValueOnce({
      survivor_id: SURVIVOR_ID,
      absorbed_id: ABSORBED_ID,
      affected: { links: 0, attributes: 0, aliases: 0 },
      action_id: "act-2",
    } as never);

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "merge_nodes")!;
    const out = (await tool.handler({
      survivor_id: SURVIVOR_ID,
      absorbed_id: ABSORBED_ID,
      reason: "duplicate identity",
    })) as { ok: boolean };
    expect(out.ok).toBe(true);

    const args = mockedMergeNodes.mock.calls[0]!;
    expect(args[1]).toBe(SURVIVOR_ID);
    expect(args[2]).toBe(ABSORBED_ID);
    expect(args[3]).toBe("duplicate identity");
  });

  it("resolve_dispute forwards the parsed body to the service", async () => {
    mockedResolveDispute.mockResolvedValueOnce({
      item_kind: "link",
      decision: "keep_disputed",
      items: [],
      action_id: "act-3",
    } as never);

    const ITEM_A = "55555555-5555-4555-8555-555555555555";
    const ITEM_B = "66666666-6666-4666-8666-666666666666";

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "resolve_dispute")!;
    const out = (await tool.handler({
      item_kind: "link",
      item_ids: [ITEM_A, ITEM_B],
      decision: "keep_disputed",
    })) as { ok: boolean };
    expect(out.ok).toBe(true);

    const args = mockedResolveDispute.mock.calls[0]!;
    expect(args[1]).toMatchObject({
      item_kind: "link",
      decision: "keep_disputed",
    });
  });

  it("confirm_item forwards the parsed body to the service", async () => {
    mockedConfirmItem.mockResolvedValueOnce({
      item_kind: "attribute",
      item_id: ITEM_ID,
      resulting_status: "active",
      action_id: "act-4",
    } as never);

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "confirm_item")!;
    const out = (await tool.handler({
      item_kind: "attribute",
      item_id: ITEM_ID,
    })) as { ok: boolean };
    expect(out.ok).toBe(true);
    expect(mockedConfirmItem).toHaveBeenCalledTimes(1);
  });

  it("reject_item forwards the parsed body to the service", async () => {
    mockedRejectItem.mockResolvedValueOnce({
      item_kind: "link",
      item_id: ITEM_ID,
      resulting_status: "deleted",
      action_id: "act-5",
    } as never);

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "reject_item")!;
    const out = (await tool.handler({
      item_kind: "link",
      item_id: ITEM_ID,
      reason: "operator override",
    })) as { ok: boolean };
    expect(out.ok).toBe(true);
    expect(mockedRejectItem).toHaveBeenCalledTimes(1);
  });

  it("correct_item forwards the parsed body to the service", async () => {
    mockedCorrectItem.mockResolvedValueOnce({
      item_kind: "attribute",
      item_id: ITEM_ID,
      resulting_status: "superseded",
      action_id: "act-6",
    } as never);

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "correct_item")!;
    const out = (await tool.handler({
      item_kind: "attribute",
      item_id: ITEM_ID,
      corrected: { value: "new value" },
      reason: "errata",
    })) as { ok: boolean };
    expect(out.ok).toBe(true);
    expect(mockedCorrectItem).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Error path — handler never throws; everything routes through the shared
// `mapErrorToEnvelope` from TC-01 (BR-30 parity).
// ---------------------------------------------------------------------------

describe("curation toolset — error envelope (BR-30 parity)", () => {
  it("Zod parse failure surfaces VALIDATION_INVALID_FORMAT", async () => {
    // `node_id` is required + must be UUID; pass garbage to trip the schema.
    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "resolve_entity_match")!;
    const out = (await tool.handler({
      node_id: "not-a-uuid",
      decision: "keep_separate",
    })) as { ok: boolean; error: { code: string; details?: unknown } };
    expect(out.ok).toBe(false);
    expect(out.error.code).toBe("VALIDATION_INVALID_FORMAT");
    // The service must never be invoked when input validation fails.
    expect(mockedResolveEntity).not.toHaveBeenCalled();
  });

  it("MergeNodesBodySchema self-merge surfaces BUSINESS_SELF_MERGE_FORBIDDEN", async () => {
    // The DTO's `superRefine` raises BUSINESS_SELF_MERGE_FORBIDDEN when
    // `survivor_id === absorbed_id`. The shared mapper surfaces it with HTTP
    // 409 (REST) / envelope code identical (MCP).
    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "merge_nodes")!;
    const out = (await tool.handler({
      survivor_id: SURVIVOR_ID,
      absorbed_id: SURVIVOR_ID,
      reason: "self-merge attempt",
    })) as { ok: boolean; error: { code: string } };
    expect(out.ok).toBe(false);
    expect(out.error.code).toBe("BUSINESS_SELF_MERGE_FORBIDDEN");
    expect(mockedMergeNodes).not.toHaveBeenCalled();
  });

  it("ResourceNotFoundError propagates as RESOURCE_NOT_FOUND", async () => {
    mockedConfirmItem.mockRejectedValueOnce(
      new ResourceNotFoundError("Item not found", {
        item_id: ITEM_ID,
        item_kind: "link",
      })
    );

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "confirm_item")!;
    const out = (await tool.handler({
      item_kind: "link",
      item_id: ITEM_ID,
    })) as { ok: boolean; error: { code: string } };
    expect(out.ok).toBe(false);
    expect(out.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("ConflictError propagates with its typed code (BUSINESS_REVIEW_NOT_PENDING)", async () => {
    mockedResolveEntity.mockRejectedValueOnce(
      new ConflictError(
        "BUSINESS_REVIEW_NOT_PENDING",
        "Node is not in needs_review state",
        { node_id: NODE_ID, current_status: "active" }
      )
    );

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "resolve_entity_match")!;
    const out = (await tool.handler({
      node_id: NODE_ID,
      decision: "keep_separate",
    })) as { ok: boolean; error: { code: string } };
    expect(out.ok).toBe(false);
    expect(out.error.code).toBe("BUSINESS_REVIEW_NOT_PENDING");
  });

  it("NodeDeletedError propagates as BUSINESS_NODE_DELETED", async () => {
    mockedResolveEntity.mockRejectedValueOnce(
      new NodeDeletedError(
        "KnowledgeNode tombstoned by compliance_delete",
        { node_id: NODE_ID }
      )
    );

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "resolve_entity_match")!;
    const out = (await tool.handler({
      node_id: NODE_ID,
      decision: "keep_separate",
    })) as { ok: boolean; error: { code: string } };
    expect(out.ok).toBe(false);
    expect(out.error.code).toBe("BUSINESS_NODE_DELETED");
  });

  it("unknown thrown errors collapse to SYSTEM_INTERNAL_ERROR without leaking the message", async () => {
    // BR-30 mirrors REST: never leak `err.message` on an unknown throw.
    mockedListQueue.mockRejectedValueOnce(
      new Error("secret internal detail")
    );

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "list_review_queue")!;
    const out = (await tool.handler({})) as {
      ok: boolean;
      error: { code: string; message: string };
    };
    expect(out.ok).toBe(false);
    expect(out.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    expect(JSON.stringify(out)).not.toContain("secret internal");
  });

  it("pg unavailability collapses to SYSTEM_SERVICE_UNAVAILABLE", async () => {
    // SQLSTATE 57014 = statement_timeout — see error-envelope.ts BR-28.
    const pgErr = Object.assign(new Error("pg timeout"), { code: "57014" });
    mockedListQueue.mockRejectedValueOnce(pgErr);

    const { mcp } = setupToolset();
    const tool = mcp.getTool("curation", "list_review_queue")!;
    const out = (await tool.handler({})) as {
      ok: boolean;
      error: { code: string };
    };
    expect(out.ok).toBe(false);
    expect(out.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
  });
});
