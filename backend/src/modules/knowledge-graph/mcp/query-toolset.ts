// MCP `query` toolset registration — nine read-only tools mirroring the REST
// surface 1:1 (knowledge-graph.back.md BR-23, BR-25).
//
// Each tool wraps the SAME service-layer function that the REST handler in
// `routes/knowledge-graph.routes.ts` invokes, opens its own short
// `BEGIN READ ONLY` transaction (BR-23 rule 4), and returns the canonical MCP
// envelope:
//   success -> { ok: true,  result: <service return value> }
//   failure -> { ok: false, error: { code, message, details? } }
// The failure branch is built by the shared `mapErrorToEnvelope` from TC-01
// (BR-24) so REST and MCP surface byte-identical error codes for the same
// thrown sentinel.
//
// The MCP tool input schema for each tool is the SAME Zod schema as the REST
// DTO (`dto/queries.dto.ts`); for endpoints that combine URL path params and
// query params on REST (`/nodes/:node_id`, `/links/:link_id`, …) the MCP input
// schema flattens them into one object — MCP has no URL path segments
// (assumption documented in the task contract). Catalog-only tools
// (`list_node_types`, `list_link_types`, `list_attribute_keys`,
// `list_nodes`) keep their REST schema unchanged.
//
// JSON Schemas for `tools/list` are derived once at module init via
// `z.toJSONSchema(...)` and pinned (same pattern as `ingestion/mcp/toolset.ts`
// line 76 — BR-25).

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  AttributeIdParamSchema,
  GetNodeByIdQuerySchema,
  LinkIdParamSchema,
  ListAttributeKeysQuerySchema,
  ListLinkTypesQuerySchema,
  ListNodesQuerySchema,
  NodeIdKeyParamSchema,
  NodeIdParamSchema,
  TraverseQuerySchema,
} from "../dto/queries.dto.js";
import type { McpServer } from "../../../mcp/server.js";
import { mapErrorToEnvelope } from "./error-envelope.js";
import {
  listAttributeKeysService,
  listLinkTypesService,
  listNodeTypesService,
} from "../service/catalog.service.js";
import {
  getAttributeHistoryService,
  getAttributeKeyHistoryService,
  getLinkHistoryService,
} from "../service/history.service.js";
import {
  getNodeByIdService,
  listNodesService,
} from "../service/node.service.js";
import { traverseNodeService } from "../service/traversal.service.js";

/** Per-startup dependencies the toolset registrar consumes. */
export interface QueryToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

// ---------------------------------------------------------------------------
// Per-tool input schemas. For endpoints that combine path + query params on
// REST, the MCP schemas flatten them into a single object (MCP tool input is
// a single JSON object; no URL path segments). Each schema is `.strict()` —
// any unknown property surfaces as `VALIDATION_INVALID_FORMAT`.
// ---------------------------------------------------------------------------

/** `get_node` (UC-05) — `node_id` + the GET /nodes/{id} query params. */
export const GetNodeInputSchema = NodeIdParamSchema.extend(
  GetNodeByIdQuerySchema.shape
).strict();
export type GetNodeInput = z.infer<typeof GetNodeInputSchema>;

/** `traverse` (UC-06) — `node_id` + traverse query params. */
export const TraverseInputSchema = NodeIdParamSchema.extend(
  TraverseQuerySchema.shape
).strict();
export type TraverseInput = z.infer<typeof TraverseInputSchema>;

/** `get_history_link` (UC-09) — single `link_id`. */
export const GetHistoryLinkInputSchema = LinkIdParamSchema.strict();
export type GetHistoryLinkInput = z.infer<typeof GetHistoryLinkInputSchema>;

/** `get_history_attribute` (UC-10) — single `attribute_id`. */
export const GetHistoryAttributeInputSchema = AttributeIdParamSchema.strict();
export type GetHistoryAttributeInput = z.infer<
  typeof GetHistoryAttributeInputSchema
>;

/** `get_history_attribute_key` (UC-11) — `node_id` + `key`. */
export const GetHistoryAttributeKeyInputSchema = NodeIdKeyParamSchema.strict();
export type GetHistoryAttributeKeyInput = z.infer<
  typeof GetHistoryAttributeKeyInputSchema
>;

/** `list_nodes` (UC-04) — same as REST query. */
export const ListNodesInputSchema = ListNodesQuerySchema;
export type ListNodesInput = z.infer<typeof ListNodesInputSchema>;

/** `list_node_types` (UC-01) — no params. */
export const ListNodeTypesInputSchema = z.object({}).strict();
export type ListNodeTypesInput = z.infer<typeof ListNodeTypesInputSchema>;

/** `list_link_types` (UC-02) — `include_rules` flag. */
export const ListLinkTypesInputSchema = ListLinkTypesQuerySchema;
export type ListLinkTypesInput = z.infer<typeof ListLinkTypesInputSchema>;

/** `list_attribute_keys` (UC-03) — optional `node_type` filter. */
export const ListAttributeKeysInputSchema = ListAttributeKeysQuerySchema;
export type ListAttributeKeysInput = z.infer<
  typeof ListAttributeKeysInputSchema
>;

// ---------------------------------------------------------------------------
// JSON Schemas — pinned at module init (BR-25). Exported so the MCP query
// transport's `tools/list` can serve the same objects without re-deriving.
// ---------------------------------------------------------------------------

// `unrepresentable: "any"` is required because several REST DTOs use `.transform()`
// for query-string coercion (BooleanQuery, IntegerQuery, LinkTypesArray) — those
// transforms have no JSON-Schema equivalent. Setting `any` causes the derivation
// to emit `{}` for the unrepresentable fragment while keeping the surrounding
// shape, which is exactly the contract LLM callers need: the JSON Schema tells
// them what fields exist and their broad types; the Zod schema does the strict
// runtime validation on dispatch.
const JSON_SCHEMA_OPTS = { unrepresentable: "any" as const };

export const QueryToolInputJsonSchemas = {
  get_node: z.toJSONSchema(GetNodeInputSchema, JSON_SCHEMA_OPTS),
  traverse: z.toJSONSchema(TraverseInputSchema, JSON_SCHEMA_OPTS),
  get_history_link: z.toJSONSchema(GetHistoryLinkInputSchema, JSON_SCHEMA_OPTS),
  get_history_attribute: z.toJSONSchema(
    GetHistoryAttributeInputSchema,
    JSON_SCHEMA_OPTS
  ),
  get_history_attribute_key: z.toJSONSchema(
    GetHistoryAttributeKeyInputSchema,
    JSON_SCHEMA_OPTS
  ),
  list_nodes: z.toJSONSchema(ListNodesInputSchema, JSON_SCHEMA_OPTS),
  list_node_types: z.toJSONSchema(ListNodeTypesInputSchema, JSON_SCHEMA_OPTS),
  list_link_types: z.toJSONSchema(ListLinkTypesInputSchema, JSON_SCHEMA_OPTS),
  list_attribute_keys: z.toJSONSchema(
    ListAttributeKeysInputSchema,
    JSON_SCHEMA_OPTS
  ),
} as const;

export type QueryToolName = keyof typeof QueryToolInputJsonSchemas;

/** Closed enumeration of the nine tool names — used by the transport (BR-23
 *  rule 5: reject `propose_*` / `finalize_run` / `start_run`). */
export const QUERY_TOOL_NAMES: readonly QueryToolName[] = [
  "get_node",
  "traverse",
  "get_history_link",
  "get_history_attribute",
  "get_history_attribute_key",
  "list_nodes",
  "list_node_types",
  "list_link_types",
  "list_attribute_keys",
];

/** Per-tool human-readable descriptions surfaced over `tools/list`. */
export const QueryToolDescriptions: Record<QueryToolName, string> = {
  get_node:
    "Return a single KnowledgeNode by id with its aliases and attributes. " +
    "Accepts optional `as_of` (YYYY-MM-DD) to view the node at a past point " +
    "in time and `in_effect_only` / `include_uncertain` filters.",
  traverse:
    "Walk the graph from a starting node id up to `depth` (1..3) hops in " +
    "`out`, `in`, or `both` directions; optionally filter by `link_types`. " +
    "Returns nodes + links with merged-node substitution applied.",
  get_history_link:
    "Return the full lineage of a KnowledgeLink — every version that " +
    "preceded or succeeded the supplied `link_id`, with provenance.",
  get_history_attribute:
    "Return the full lineage of a NodeAttribute — every version that " +
    "preceded or succeeded the supplied `attribute_id`, with provenance.",
  get_history_attribute_key:
    "Return every NodeAttribute version recorded for the pair " +
    "(`node_id`, `key`), in chronological order, with provenance.",
  list_nodes:
    "List KnowledgeNodes, optionally filtered by `node_type`, `name_prefix`, " +
    "or `status`. Pagination via `limit` (max 100) and `offset`.",
  list_node_types:
    "List the active NodeType catalog entries (id, name, description, version).",
  list_link_types:
    "List the active LinkType catalog entries. Pass `include_rules=true` " +
    "to also include the per-type allowed (source, target) NodeType pairs.",
  list_attribute_keys:
    "List the active AttributeKey catalog entries, optionally scoped to one " +
    "NodeType via `node_type`.",
};

// ---------------------------------------------------------------------------
// Envelope shape — identical to ingestion's. Kept as a structural type so we
// do not pull a service-layer type into the transport / handler return.
// ---------------------------------------------------------------------------

export interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Local read-only transaction wrapper. Mirrors the helper that lives inside
// `routes/knowledge-graph.routes.ts` — duplicated rather than imported to keep
// the MCP toolset independent of the REST routes file (Rule 3 surgical).
// ---------------------------------------------------------------------------

async function withReadOnly<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await fn(client);
    await client.query("ROLLBACK");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Swallow rollback failure — surface the original error.
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Build the per-tool handler factory. Each handler:
 *   1. Re-parses the input through its Zod schema (the transport already
 *      parsed once for dispatch, but a defensive re-parse here means the
 *      handler can never receive an untyped object — same pattern the
 *      ingest handlers use).
 *   2. Opens a `withReadOnly` transaction.
 *   3. Calls the service-layer function.
 *   4. Wraps the result in `{ ok: true, result }` or, on throw, in the shared
 *      `mapErrorToEnvelope(err)` envelope. The mapper never raises — every
 *      thrown value collapses to a typed `{ ok: false, error }` envelope.
 */
function makeHandler<S extends z.ZodTypeAny, O>(
  schema: S,
  run: (input: z.output<S>, client: PoolClient) => Promise<O>,
  pool: Pool
): (rawInput: unknown) => Promise<McpEnvelopeJson> {
  return async (rawInput: unknown): Promise<McpEnvelopeJson> => {
    try {
      const parsed = schema.parse(rawInput) as z.output<S>;
      const result = await withReadOnly(pool, (client) => run(parsed, client));
      return { ok: true, result };
    } catch (err) {
      // ZodError, business sentinels, pg unavailability, unknowns — all
      // collapse to a typed envelope via the shared mapper (BR-24).
      return mapErrorToEnvelope(err);
    }
  };
}

/**
 * Register the nine `query` MCP tools on `deps.mcp` under the `query` toolset
 * key. Idempotency: re-calling this function in the same process would throw
 * (the underlying `McpServer.registerTool` rejects duplicates) — by design.
 */
export function registerQueryToolset(deps: QueryToolsetDeps): void {
  const { mcp, pool, logger, catalog } = deps;

  // Bind the dispatch logger to the service-layer functions that accept one
  // (history / node / traverse). Catalog endpoints don't need it.
  const svcLogger = logger.child({ component: "mcp.query" });

  // ----- get_node (UC-05) -----
  mcp.registerTool<GetNodeInput, unknown>("query", {
    name: "get_node",
    description: QueryToolDescriptions.get_node,
    inputSchema: GetNodeInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      GetNodeInputSchema,
      (input, client) =>
        getNodeByIdService(
          client,
          {
            nodeId: input.node_id,
            asOf: input.as_of,
            inEffectOnly: input.in_effect_only,
            includeUncertain: input.include_uncertain,
          },
          svcLogger
        ),
      pool
    ),
  });

  // ----- traverse (UC-06) -----
  mcp.registerTool<TraverseInput, unknown>("query", {
    name: "traverse",
    description: QueryToolDescriptions.traverse,
    inputSchema: TraverseInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      TraverseInputSchema,
      (input, client) =>
        traverseNodeService(
          client,
          catalog,
          {
            startingNodeId: input.node_id,
            direction: input.direction,
            linkTypeNames: input.link_types,
            depth: input.depth,
            asOf: input.as_of,
            inEffectOnly: input.in_effect_only,
          },
          svcLogger
        ),
      pool
    ),
  });

  // ----- get_history_link (UC-09) -----
  mcp.registerTool<GetHistoryLinkInput, unknown>("query", {
    name: "get_history_link",
    description: QueryToolDescriptions.get_history_link,
    inputSchema: GetHistoryLinkInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      GetHistoryLinkInputSchema,
      (input, client) => getLinkHistoryService(client, input.link_id, svcLogger),
      pool
    ),
  });

  // ----- get_history_attribute (UC-10) -----
  mcp.registerTool<GetHistoryAttributeInput, unknown>("query", {
    name: "get_history_attribute",
    description: QueryToolDescriptions.get_history_attribute,
    inputSchema: GetHistoryAttributeInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      GetHistoryAttributeInputSchema,
      (input, client) =>
        getAttributeHistoryService(client, input.attribute_id, svcLogger),
      pool
    ),
  });

  // ----- get_history_attribute_key (UC-11) -----
  mcp.registerTool<GetHistoryAttributeKeyInput, unknown>("query", {
    name: "get_history_attribute_key",
    description: QueryToolDescriptions.get_history_attribute_key,
    inputSchema: GetHistoryAttributeKeyInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      GetHistoryAttributeKeyInputSchema,
      (input, client) =>
        getAttributeKeyHistoryService(
          client,
          catalog,
          { nodeId: input.node_id, key: input.key },
          svcLogger
        ),
      pool
    ),
  });

  // ----- list_nodes (UC-04) -----
  mcp.registerTool<ListNodesInput, unknown>("query", {
    name: "list_nodes",
    description: QueryToolDescriptions.list_nodes,
    inputSchema: ListNodesInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      ListNodesInputSchema,
      (input, client) =>
        listNodesService(client, catalog, {
          node_type: input.node_type,
          name_prefix: input.name_prefix,
          status: input.status,
          limit: input.limit,
          offset: input.offset,
        }),
      pool
    ),
  });

  // ----- list_node_types (UC-01) -----
  mcp.registerTool<ListNodeTypesInput, unknown>("query", {
    name: "list_node_types",
    description: QueryToolDescriptions.list_node_types,
    inputSchema: ListNodeTypesInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      ListNodeTypesInputSchema,
      (_input, client) => listNodeTypesService(client),
      pool
    ),
  });

  // ----- list_link_types (UC-02) -----
  mcp.registerTool<ListLinkTypesInput, unknown>("query", {
    name: "list_link_types",
    description: QueryToolDescriptions.list_link_types,
    inputSchema: ListLinkTypesInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      ListLinkTypesInputSchema,
      (input, client) =>
        listLinkTypesService(client, { include_rules: input.include_rules }),
      pool
    ),
  });

  // ----- list_attribute_keys (UC-03) -----
  mcp.registerTool<ListAttributeKeysInput, unknown>("query", {
    name: "list_attribute_keys",
    description: QueryToolDescriptions.list_attribute_keys,
    inputSchema: ListAttributeKeysInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      ListAttributeKeysInputSchema,
      (input, client) =>
        listAttributeKeysService(client, catalog, { node_type: input.node_type }),
      pool
    ),
  });

  logger.info(
    {
      component: "mcp.query",
      tools_registered: QUERY_TOOL_NAMES.length,
      tool_names: QUERY_TOOL_NAMES,
    },
    "query_toolset_registered"
  );
}
