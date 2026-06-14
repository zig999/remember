// MCP `query` toolset registration for the query-retrieval domain — four
// read-only tools (search + the three provenance walks) co-tenanted on the
// shared read-only transport owned by `knowledge-graph` (BR-23 of
// `query-retrieval.back.md`).
//
// Each tool wraps the SAME service-layer function that the REST handler in
// `routes/query-retrieval.routes.ts` invokes, opens its own short
// `BEGIN READ ONLY` transaction (mirrors the REST handler), and returns the
// canonical MCP envelope:
//   success -> { ok: true,  result: <service return value> }
//   failure -> { ok: false, error: { code, message, details? } }
// The failure branch is built by the shared `mapErrorToEnvelope` from TC-01
// (BR-24) so REST and MCP surface byte-identical error codes for the same
// thrown sentinel.
//
// The MCP tool input schema for each tool is the SAME Zod schema as the REST
// DTO (`dto/search.dto.ts`); MCP has no URL path segments, so the provenance
// tools accept the path param schema directly (they are already flat single-
// field objects). `search` reuses `SearchQuerySchema` verbatim — it already
// represents a flat input object.
//
// JSON Schemas for `tools/list` are derived once at module init via
// `z.toJSONSchema(...)` and pinned (same pattern as knowledge-graph's
// `query-toolset.ts` line 133 — BR-25).

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../../knowledge-graph/index.js";
import { mapErrorToEnvelope } from "../../knowledge-graph/mcp/error-envelope.js";
import {
  AttributeIdParamSchema,
  FragmentIdParamSchema,
  LinkIdParamSchema,
  SearchQuerySchema,
} from "../dto/search.dto.js";
import type { McpServer } from "../../../mcp/server.js";
import { searchKnowledgeService } from "../service/search.service.js";
import {
  getProvenanceByAttributeService,
  getProvenanceByFragmentService,
  getProvenanceByLinkService,
} from "../service/provenance.service.js";

/** Per-startup dependencies the toolset registrar consumes. Signature mirrors
 *  `registerQueryToolset` of `knowledge-graph` so the bootstrap can wire both
 *  registrars from the same dependency bag. */
export interface QueryRetrievalToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

// ---------------------------------------------------------------------------
// Per-tool input schemas. Provenance schemas are single-field UUID objects
// already exported from `dto/search.dto.ts`; `search` reuses the REST query
// schema verbatim — its transforms (BooleanQuery / IntegerQuery / arrays) are
// the same shape an MCP caller would send as a flat JSON object.
//
// We intentionally do NOT call `.strict()` on the provenance schemas — they
// are imported from the REST DTO module and any stricter contract must live
// there so REST and MCP stay in lockstep (BR-25 single-source guarantee).
// ---------------------------------------------------------------------------

/** `search` (UC-01) — same shape as `GET /api/v1/search` query params. */
export const SearchInputSchema = SearchQuerySchema;
export type SearchInput = z.infer<typeof SearchInputSchema>;

/** `get_provenance_link` (UC-07) — single `link_id` UUID. */
export const GetProvenanceLinkInputSchema = LinkIdParamSchema;
export type GetProvenanceLinkInput = z.infer<typeof GetProvenanceLinkInputSchema>;

/** `get_provenance_attribute` (UC-08) — single `attribute_id` UUID. */
export const GetProvenanceAttributeInputSchema = AttributeIdParamSchema;
export type GetProvenanceAttributeInput = z.infer<
  typeof GetProvenanceAttributeInputSchema
>;

/** `get_provenance_fragment` (UC-09) — single `fragment_id` UUID. */
export const GetProvenanceFragmentInputSchema = FragmentIdParamSchema;
export type GetProvenanceFragmentInput = z.infer<
  typeof GetProvenanceFragmentInputSchema
>;

// ---------------------------------------------------------------------------
// JSON Schemas — pinned at module init (BR-25). Exported so the shared MCP
// query transport's `tools/list` can serve the same objects without
// re-deriving. Same `unrepresentable: "any"` policy as knowledge-graph —
// several search DTO fields use Zod `.transform()` for query-string coercion
// and those have no JSON Schema equivalent.
// ---------------------------------------------------------------------------

const JSON_SCHEMA_OPTS = { unrepresentable: "any" as const };

export const QueryRetrievalToolInputJsonSchemas = {
  search: z.toJSONSchema(SearchInputSchema, JSON_SCHEMA_OPTS),
  get_provenance_link: z.toJSONSchema(
    GetProvenanceLinkInputSchema,
    JSON_SCHEMA_OPTS
  ),
  get_provenance_attribute: z.toJSONSchema(
    GetProvenanceAttributeInputSchema,
    JSON_SCHEMA_OPTS
  ),
  get_provenance_fragment: z.toJSONSchema(
    GetProvenanceFragmentInputSchema,
    JSON_SCHEMA_OPTS
  ),
} as const;

export type QueryRetrievalToolName = keyof typeof QueryRetrievalToolInputJsonSchemas;

/** Closed enumeration of the four tool names this domain contributes — used
 *  by the shared transport's whitelist (BR-23 rule 5). */
export const QUERY_RETRIEVAL_TOOL_NAMES: readonly QueryRetrievalToolName[] = [
  "search",
  "get_provenance_link",
  "get_provenance_attribute",
  "get_provenance_fragment",
];

/** Per-tool human-readable descriptions surfaced over `tools/list`. */
export const QueryRetrievalToolDescriptions: Record<
  QueryRetrievalToolName,
  string
> = {
  search:
    "Full-text search across fragments, node aliases, and chunks with " +
    "optional graph expansion. Returns ranked items with provenance. " +
    "Filters: `layers[]` (fragment|node|chunk), `as_of` (YYYY-MM-DD), " +
    "`in_effect_only`, `include_uncertain`, `expand`, `expand_depth` (1..3), " +
    "`expand_link_types[]`. Pagination via `limit` (max 100) and `offset`.",
  get_provenance_link:
    "Return the full provenance chain (fragments → chunks → raw_information) " +
    "for a KnowledgeLink id. 404 if missing; 410 if any underlying raw is " +
    "tombstoned by a compliance delete.",
  get_provenance_attribute:
    "Return the full provenance chain (fragments → chunks → raw_information) " +
    "for a NodeAttribute id. 404 if missing; 410 if any underlying raw is " +
    "tombstoned by a compliance delete.",
  get_provenance_fragment:
    "Return the full provenance chain (chunks → raw_information) for an " +
    "InformationFragment id. 404 if missing or if the fragment is not in " +
    "status='accepted'; 410 if any underlying raw is tombstoned.",
};

// ---------------------------------------------------------------------------
// Envelope shape — identical to ingestion's / knowledge-graph's. Kept as a
// structural type so we do not pull a service-layer type into the handler
// return signature.
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
// `routes/query-retrieval.routes.ts` and `knowledge-graph/mcp/query-toolset.ts`
// — duplicated rather than imported to keep the MCP toolset independent of
// the REST routes file (Rule 3 surgical). When a public `withReadOnly`
// re-export becomes available from `knowledge-graph/index.ts` the three
// copies can collapse into one in a separate refactor TC.
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
 *      knowledge-graph handlers use).
 *   2. Opens a `withReadOnly` transaction.
 *   3. Calls the service-layer function.
 *   4. Wraps the result in `{ ok: true, result }` or, on throw, in the shared
 *      `mapErrorToEnvelope(err)` envelope. The mapper never raises — every
 *      thrown value collapses to a typed `{ ok: false, error }` envelope
 *      (BR-24).
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
 * Register the four query-retrieval MCP tools on `deps.mcp` under the `query`
 * toolset key — the SAME toolset name used by `knowledge-graph` so the shared
 * transport's tools/list surfaces all thirteen tools as one set (BR-23 of
 * `query-retrieval.back.md`).
 *
 * Idempotency: re-calling this function in the same process throws (the
 * underlying `McpServer.registerTool` rejects duplicates) — by design.
 */
export function registerQueryRetrievalToolset(
  deps: QueryRetrievalToolsetDeps
): void {
  const { mcp, pool, logger, catalog } = deps;

  const svcLogger = logger.child({ component: "mcp.query-retrieval" });

  // ----- search (UC-01) -----
  mcp.registerTool<SearchInput, unknown>("query", {
    name: "search",
    description: QueryRetrievalToolDescriptions.search,
    inputSchema: SearchInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      SearchInputSchema,
      (input, client) =>
        searchKnowledgeService(
          client,
          catalog,
          {
            query: input.query,
            layers: input.layers,
            asOf: input.as_of,
            inEffectOnly: input.in_effect_only,
            includeUncertain: input.include_uncertain,
            expand: input.expand,
            expandDepth: input.expand_depth,
            expandLinkTypes: input.expand_link_types,
            limit: input.limit,
            offset: input.offset,
          },
          svcLogger
        ),
      pool
    ),
  });

  // ----- get_provenance_link (UC-07) -----
  mcp.registerTool<GetProvenanceLinkInput, unknown>("query", {
    name: "get_provenance_link",
    description: QueryRetrievalToolDescriptions.get_provenance_link,
    inputSchema: GetProvenanceLinkInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      GetProvenanceLinkInputSchema,
      (input, client) =>
        getProvenanceByLinkService(client, input.link_id, svcLogger),
      pool
    ),
  });

  // ----- get_provenance_attribute (UC-08) -----
  mcp.registerTool<GetProvenanceAttributeInput, unknown>("query", {
    name: "get_provenance_attribute",
    description: QueryRetrievalToolDescriptions.get_provenance_attribute,
    inputSchema: GetProvenanceAttributeInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      GetProvenanceAttributeInputSchema,
      (input, client) =>
        getProvenanceByAttributeService(client, input.attribute_id, svcLogger),
      pool
    ),
  });

  // ----- get_provenance_fragment (UC-09) -----
  mcp.registerTool<GetProvenanceFragmentInput, unknown>("query", {
    name: "get_provenance_fragment",
    description: QueryRetrievalToolDescriptions.get_provenance_fragment,
    inputSchema: GetProvenanceFragmentInputSchema as unknown as z.ZodTypeAny,
    handler: makeHandler(
      GetProvenanceFragmentInputSchema,
      (input, client) =>
        getProvenanceByFragmentService(client, input.fragment_id, svcLogger),
      pool
    ),
  });

  logger.info(
    {
      component: "mcp.query-retrieval",
      tools_registered: QUERY_RETRIEVAL_TOOL_NAMES.length,
      tool_names: QUERY_RETRIEVAL_TOOL_NAMES,
    },
    "query_retrieval_toolset_registered"
  );
}
