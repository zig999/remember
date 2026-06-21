// Graph normalizer — projects raw tool envelopes from the chat agentic loop
// into `GraphDeltaWire` payloads that the SSE projector emits as `graph_delta`
// frames (chat-graphspace-plan.md §4.1, §11 UC-CG-01/03/04).
//
// Scope. Out of the 13 read-only tools the chat catalog exposes
// (`service/tool-catalog.ts` CHAT_TOOL_NAMES), only four produce a subgraph:
//
//   - traverse   -> N nodes + M links  (subgraph; canonical source).
//   - get_node   -> 1 node  + 0 links.
//   - list_nodes -> N nodes + 0 links.
//   - search     -> hydrate items(kind=node) -> N nodes + 0 links.
//
// Every other tool (`list_node_types`, `list_link_types`, `list_attribute_keys`,
// `get_history_*`, `get_provenance_*`) returns `null` from the dispatcher — a
// quiet no-op, NOT an empty delta. The route handler must NOT emit a
// `graph_delta` frame when the normalizer returns `null` (the diff between
// "no graph data" and "empty graph data" is meaningful for the front-end).
//
// Purity. `traverse`, `get_node`, and `list_nodes` are synchronous pure
// functions of (result, catalog) — no DB access. Only `search` needs a
// `PoolClient` to hydrate `items[]` (which carry just `id`, not the node
// row) via `findNodesByIds` (1 query, no N+1 — graph.repository.ts:346).
// The route obtains the client via `withReadOnly(...)`.
//
// Catalog. The wire shape includes `is_temporal` on every link (drives the
// front-end edge style — temporal = solid, stable = dashed). The tool result
// only carries `link_type` (the slug), so the normalizer resolves
// `is_temporal` via `catalog.linkTypeByName.get(name)?.is_temporal`. If the
// name is missing from the snapshot (a stale catalog cache vs a brand-new
// link-type, or a developer error in tool payload shape), the normalizer
// falls back to `is_temporal: false` rather than crashing — the front-end
// gracefully renders a dashed edge, which is the conservative default.
//
// Type-narrowing. Inputs are `unknown` (the chat loop captures whatever the
// MCP tool returned as `toolEnvelope.result`). Each normalizer uses small
// in-file type guards rather than Zod parsing — the shapes are stable
// internal types (TraversalResultResponse, NodeDetailResponse, NodeListResponse,
// SearchResponse) that are already validated upstream by the MCP toolset. The
// guards exist to reject obviously-malformed input (defensive: a future tool
// version changes its return shape) without paying for a full Zod parse on
// every tool call. A guard miss returns an empty delta (`{nodes:[], links:[]}`)
// rather than throwing, so a broken tool result never crashes the SSE stream.
//
// Boundary note (intentional divergence from chat.back.md §1.1).
//   The back spec §1.1 says: "Nothing inside `chat/` imports from
//   `query-retrieval` or `knowledge-graph` directly". This file imports the
//   catalog type and `findNodesByIds` from `knowledge-graph`. The TC contract
//   (TC-be-001 known_context lines 8 + 10) explicitly grants the
//   `knowledge-graph` exception while preserving the `query-retrieval`
//   boundary: graph data physically lives in knowledge-graph, hydrating
//   search-result node ids requires its repository, and the catalog snapshot
//   is the canonical source for `is_temporal`. Recorded as a spec divergence
//   in the delivery file; a spec reconciliation should fold this into §1.1
//   on the next /u-improve.

import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../../knowledge-graph/catalog/catalog.js";
import { findNodesByIds } from "../../knowledge-graph/repository/graph.repository.js";

// ---------------------------------------------------------------------------
// Wire shapes (snake_case — match the SSE frame contract in §4.1 of the plan).
// These are EXPORTED so the route handler (TC-be-002, B2) can serialise them
// verbatim into the JSON payload of the `event: graph_delta` frame.
// ---------------------------------------------------------------------------

/** Wire shape of a node inside a `graph_delta` frame. */
export interface GraphNodeWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: "active" | "needs_review" | "merged" | "deleted";
}

/** Wire shape of a link inside a `graph_delta` frame. */
export interface GraphLinkWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;
  readonly is_temporal: boolean;
  readonly is_in_effect?: boolean;
  readonly status?: string;
  readonly flags?: readonly ("uncertain" | "disputed" | "low_confidence")[];
}

/** Wire shape of the full `graph_delta` SSE frame payload. */
export interface GraphDeltaWire {
  readonly source_tool: string;
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}

/** Names of tools that the dispatcher knows how to graph-project. */
const GRAPH_TOOL_NAMES = new Set<string>([
  "traverse",
  "get_node",
  "list_nodes",
  "search",
]);

// ---------------------------------------------------------------------------
// Type guards. Defensive, narrow, NOT a full schema parse — we trust the
// MCP toolset upstream validation and only reject obvious shape mismatches
// to keep TypeScript narrowing safe.
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNodeStatus(
  v: unknown
): v is "active" | "needs_review" | "merged" | "deleted" {
  return (
    v === "active" ||
    v === "needs_review" ||
    v === "merged" ||
    v === "deleted"
  );
}

const ASSERTION_FLAGS = new Set<string>([
  "uncertain",
  "disputed",
  "low_confidence",
]);

function isAssertionFlagArray(
  v: unknown
): v is readonly ("uncertain" | "disputed" | "low_confidence")[] {
  return (
    Array.isArray(v) &&
    v.every((f) => typeof f === "string" && ASSERTION_FLAGS.has(f))
  );
}

/**
 * Pull a node out of a `NodeSummaryResponse`-shaped record. Returns
 * `undefined` when any required field is missing or mistyped.
 */
function pickNodeWire(raw: unknown): GraphNodeWire | undefined {
  if (!isRecord(raw)) return undefined;
  const { id, node_type, canonical_name, status } = raw;
  if (typeof id !== "string") return undefined;
  if (typeof node_type !== "string") return undefined;
  if (typeof canonical_name !== "string") return undefined;
  if (!isNodeStatus(status)) return undefined;
  return { id, node_type, canonical_name, status };
}

/**
 * Pull a link out of a `TraversalLinkResponse`-shaped record. Resolves
 * `is_temporal` from the catalog (fallback `false` on a miss). Returns
 * `undefined` when any required field is missing or mistyped.
 */
function pickLinkWire(
  raw: unknown,
  catalog: CatalogSnapshot
): GraphLinkWire | undefined {
  if (!isRecord(raw)) return undefined;
  const {
    id,
    source_node_id,
    target_node_id,
    link_type,
    is_in_effect,
    status,
    flags,
  } = raw;
  if (typeof id !== "string") return undefined;
  if (typeof source_node_id !== "string") return undefined;
  if (typeof target_node_id !== "string") return undefined;
  if (typeof link_type !== "string") return undefined;

  const linkTypeRow = catalog.linkTypeByName.get(link_type);
  // Fallback `false`: assumptions_allowed[2] of the TC explicitly permits
  // this. A missing link-type name in the catalog is a developer/migration
  // bug, not a runtime crash condition for the SSE stream.
  const is_temporal = linkTypeRow?.is_temporal ?? false;

  // Optional fields — pass through when present + well-typed; otherwise omit.
  const out: GraphLinkWire = {
    id,
    source_node_id,
    target_node_id,
    link_type,
    is_temporal,
    ...(typeof is_in_effect === "boolean" ? { is_in_effect } : {}),
    ...(typeof status === "string" ? { status } : {}),
    ...(isAssertionFlagArray(flags) ? { flags } : {}),
  };
  return out;
}

// ---------------------------------------------------------------------------
// Per-tool normalizers — small, focused, individually testable.
// ---------------------------------------------------------------------------

/**
 * Normalise a `traverse` result -> `GraphDeltaWire`.
 *
 * Input shape (TraversalResultResponse):
 *   { starting_node_id, nodes: NodeSummary[], links: TraversalLink[] }
 *
 * Output: every well-formed node and link projected verbatim into the wire
 * shape, with `is_temporal` resolved via the catalog. Malformed entries are
 * silently dropped (defensive — see file header).
 */
export function normalizeTraverse(
  result: unknown,
  catalog: CatalogSnapshot
): GraphDeltaWire {
  if (!isRecord(result)) {
    return { source_tool: "traverse", nodes: [], links: [] };
  }
  const rawNodes = Array.isArray(result.nodes) ? result.nodes : [];
  const rawLinks = Array.isArray(result.links) ? result.links : [];

  const nodes: GraphNodeWire[] = [];
  for (const n of rawNodes) {
    const picked = pickNodeWire(n);
    if (picked !== undefined) nodes.push(picked);
  }
  const links: GraphLinkWire[] = [];
  for (const l of rawLinks) {
    const picked = pickLinkWire(l, catalog);
    if (picked !== undefined) links.push(picked);
  }
  return { source_tool: "traverse", nodes, links };
}

/**
 * Normalise a `get_node` result -> `GraphDeltaWire` with 1 node, 0 links.
 *
 * Input shape (NodeDetailResponse):
 *   { node: NodeSummary, aliases: [...], attributes: [...] }
 *
 * Output: a delta carrying just the `.node` projection. Aliases and
 * attributes are intentionally dropped — the wire is a graph subgraph, not
 * a full node-detail panel (the front-end fetches detail separately, see
 * TC-be-002 F7b NodeDetailPanel).
 */
export function normalizeGetNode(result: unknown): GraphDeltaWire {
  if (!isRecord(result)) {
    return { source_tool: "get_node", nodes: [], links: [] };
  }
  const picked = pickNodeWire(result.node);
  return {
    source_tool: "get_node",
    nodes: picked === undefined ? [] : [picked],
    links: [],
  };
}

/**
 * Normalise a `list_nodes` result -> `GraphDeltaWire` with N nodes, 0 links.
 *
 * Input shape (NodeListResponse):
 *   { total, limit, offset, items: NodeSummary[] }
 *
 * Output: every well-formed item projected as a node. The pagination meta
 * (`total`, `limit`, `offset`) is dropped — the graph wire is a subgraph,
 * not a list view.
 */
export function normalizeListNodes(result: unknown): GraphDeltaWire {
  if (!isRecord(result)) {
    return { source_tool: "list_nodes", nodes: [], links: [] };
  }
  const rawItems = Array.isArray(result.items) ? result.items : [];
  const nodes: GraphNodeWire[] = [];
  for (const item of rawItems) {
    const picked = pickNodeWire(item);
    if (picked !== undefined) nodes.push(picked);
  }
  return { source_tool: "list_nodes", nodes, links: [] };
}

/**
 * Normalise a `search` result -> `GraphDeltaWire` with N nodes, 0 links.
 *
 * Input shape (SearchResponse):
 *   { query, total, limit, offset, items: SearchItem[] }
 * where each SearchItem is:
 *   { kind: "node"|"link"|"fragment", layer, id, score, hop, summary, flags, provenance }
 *
 * Only items with `kind === "node"` are emitted; "link" and "fragment" items
 * are silently excluded (G-A in the plan §4.1). The `id` is then hydrated to
 * a full `NodeSummary` via `findNodesByIds` in a single SQL roundtrip
 * (`= ANY($1::uuid[])`, no N+1 — graph.repository.ts:346). Hydrated rows are
 * returned in arbitrary order; the normalizer preserves the original search
 * `items[]` order so the front-end can rely on the search ranking for the
 * reveal sequence.
 *
 * Async because it issues SQL. The route obtains the read-only PoolClient via
 * `withReadOnly(pool, async (client) => normalizeSearch(result, client, catalog))`.
 */
export async function normalizeSearch(
  result: unknown,
  client: PoolClient,
  catalog: CatalogSnapshot
): Promise<GraphDeltaWire> {
  void catalog; // search produces no links — no `is_temporal` lookup needed.

  const empty: GraphDeltaWire = { source_tool: "search", nodes: [], links: [] };
  if (!isRecord(result)) return empty;
  const items = Array.isArray(result.items) ? result.items : [];

  // Collect node ids in original search order, deduped (a search can in
  // principle surface the same node twice via different layers — we emit
  // each node exactly once, in its FIRST appearance order).
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!isRecord(item)) continue;
    if (item.kind !== "node") continue;
    if (typeof item.id !== "string") continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    ids.push(item.id);
  }

  if (ids.length === 0) return empty;

  // 1 query, no N+1. `findNodesByIds` returns rows in arbitrary order — we
  // index by id and project back in search order.
  const rows = await findNodesByIds(client, ids);
  const byId = new Map<string, GraphNodeWire>();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      node_type: row.node_type,
      canonical_name: row.canonical_name,
      status: row.status,
    });
  }

  const nodes: GraphNodeWire[] = [];
  for (const id of ids) {
    const node = byId.get(id);
    if (node !== undefined) nodes.push(node);
    // If `byId.get(id)` is undefined, the node was deleted between the
    // search and the hydration (rare race) — we just drop it. The front-end
    // never knew about it; no need to surface a placeholder.
  }
  return { source_tool: "search", nodes, links: [] };
}

// ---------------------------------------------------------------------------
// Dispatcher — the single entry point the route handler uses.
// ---------------------------------------------------------------------------

/**
 * Dispatcher: project a tool result envelope to a `GraphDeltaWire`, or
 * return `null` when the tool is not graph-producing.
 *
 * Contract:
 *   - `tool_name in {traverse, get_node, list_nodes}` -> sync delta
 *     (the optional `client` parameter is ignored).
 *   - `tool_name === "search"` -> async delta (requires `client`). If the
 *     caller omits `client`, the dispatcher throws synchronously — that is
 *     a programmer error, not a runtime condition.
 *   - Any other tool name -> `null` (NOT an empty delta — see the file
 *     header for the why).
 *
 * The dispatcher always returns a Promise to keep the call-site simple:
 *
 *   const delta = await normalizeToolResult(toolName, result, catalog, client);
 *   if (delta !== null) emitGraphDelta(sse, delta);
 *
 * The route handler should call `normalizeToolResult` with the client even
 * for the synchronous tools — the dispatcher discards it transparently.
 */
export function normalizeToolResult(
  toolName: string,
  result: unknown,
  catalog: CatalogSnapshot,
  client?: PoolClient
): Promise<GraphDeltaWire | null> {
  if (!GRAPH_TOOL_NAMES.has(toolName)) {
    return Promise.resolve(null);
  }
  if (toolName === "traverse") {
    return Promise.resolve(normalizeTraverse(result, catalog));
  }
  if (toolName === "get_node") {
    return Promise.resolve(normalizeGetNode(result));
  }
  if (toolName === "list_nodes") {
    return Promise.resolve(normalizeListNodes(result));
  }
  // toolName === "search" — requires the read-only client.
  if (client === undefined) {
    return Promise.reject(
      new Error(
        "normalizeToolResult: search requires a PoolClient to hydrate items"
      )
    );
  }
  return normalizeSearch(result, client, catalog);
}
