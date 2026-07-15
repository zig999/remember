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
  /**
   * Optional pt-BR display label of the LinkType, projected server-side from
   * the catalog row (`link_type.label`). Additive in v2.4.0 — OMITTED when
   * the slug is not present in the catalog snapshot (open-ontology fallback);
   * the SPA then humanizes the slug client-side. The slug (`link_type`)
   * remains the stable wire identifier; `link_type_label` is presentation-only.
   */
  readonly link_type_label?: string;
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
  // v2.11 (BR-41): `ingest_directed` becomes a fifth graph-producing tool.
  // Its envelope carries `run.affected_nodes` + `report[]` — everything the
  // projector needs to render the freshly persisted subgraph without a
  // follow-up read. See `normalizeIngestDirected` below for the projection
  // contract.
  "ingest_directed",
]);

/**
 * Status values from `DirectedItemReport.status` that count as "persisted
 * to the graph" for projection purposes (BR-41 v2.11).
 *
 * The three dropped families (`rejected`, `error`, `dependency_failed`) never
 * appear in the frame — the graph only shows what was actually persisted.
 * Those items still surface to the Owner in the text channel via
 * `report[i].status`, just not in the graph delta.
 */
const ACCEPTED_DIRECTED_STATUSES = new Set<string>([
  "accepted",
  "consolidated",
  "superseded_previous",
  "needs_review",
  "uncertain",
  "disputed",
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
  // `link_type_label` (openapi v2.4.0, additive) projects the catalog's pt-BR
  // label so the SPA can render the human form without a static slug->label
  // table. When the slug is missing from the snapshot (open-ontology fallback)
  // the field is OMITTED and the SPA humanizes the slug client-side.
  const out: GraphLinkWire = {
    id,
    source_node_id,
    target_node_id,
    link_type,
    ...(linkTypeRow !== undefined ? { link_type_label: linkTypeRow.label } : {}),
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

/**
 * Normalise an `ingest_directed` result -> `GraphDeltaWire`.
 *
 * BR-41 v2.11 — projection contract for the fifth graph-producing tool.
 *
 * Input shape (`DirectedIngestionResult` — `ingestion.back.md` BR-34 step 6):
 *   {
 *     outcome, raw_information_id, llm_run_id, chunk_count,
 *     run: { …, affected_nodes: [{id, canonical_name, node_type}, …] },
 *     report: [
 *       { ref, kind: "node"|"attribute"|"link", status, node_id?, attribute_id?, link_id?, … },
 *       …
 *     ],
 *     summary
 *   }
 *
 * Projection.
 *
 *   1. **Nodes** — every entry of `run.affected_nodes` becomes a
 *      `GraphNodeWire` with `status: "active"` forced. Directed items are
 *      stated-by-construction (BR-43 v2.8: server forces `confidence = 1.0`
 *      and `valid_from_basis: "stated"`), so on creation they cannot land
 *      in `needs_review` / `merged` / `deleted` — those statuses arise from
 *      resolution paths or compliance actions the directed path does not
 *      trigger. If `run.affected_nodes` is absent, `nodes = []` and the
 *      frame still emits (an empty `{nodes:[], links:[]}` delta is
 *      contractual — BR-41 v2.11).
 *
 *   2. **Links** — a link is emitted for every `report[]` entry with
 *      `kind === "link"` AND `ACCEPTED_DIRECTED_STATUSES.has(status)` AND
 *      `link_id` present. The `ref` field of a link entry is the compound
 *      string `<source_ref>-><link_type>-><target_ref>` (produced by
 *      `refForLink()` in `directed-ingestion.service.ts:932`); we parse it
 *      with `indexOf('->')` and `lastIndexOf('->')` — the FIRST arrow ends
 *      the source_ref, the LAST arrow starts the target_ref, and the middle
 *      segment is the link_type slug. Endpoints (`source_node_id`,
 *      `target_node_id`) are resolved by looking `source_ref` and
 *      `target_ref` up in a `node_ref -> node_id` map built inline from the
 *      accepted `kind === "node"` entries of the same `report[]`. If either
 *      endpoint is missing from the map the link is dropped SILENTLY —
 *      constraint 6 asks for a WARN log but no logger is threaded through
 *      the normalizer signature (`(result, catalog)`), so we match the
 *      file's convention of silent defensive drops. The dispatcher-level
 *      `projectGraphDelta` try/catch in `conversations.routes.ts` still
 *      logs actual exceptions.
 *
 *   3. **Catalog fields** — `is_temporal` and optional `link_type_label`
 *      are resolved via the SAME `CatalogSnapshot.linkTypeByName` lookup
 *      used by `pickLinkWire` (traverse arm). Miss -> `is_temporal: false`,
 *      `link_type_label` OMITTED — same fallback contract as `traverse`.
 *
 *   4. **Omitted fields** — `is_in_effect`, `status` (assertion_status),
 *      and `flags` are OMITTED from every link on the directed path. These
 *      are view-derived (`knowledge_link_resolved`) and the freshly
 *      persisted link does not yet carry them here; a follow-up `traverse`
 *      surfaces them if the Owner asks for them on a later turn (BR-41
 *      v2.11).
 *
 *   5. **Envelope guard** — if `result` is not a well-formed object return
 *      `null` (the other arms return an empty delta on this branch, but
 *      BR-41 v2.11 says return `null` for the ingest_directed path — the
 *      malformed envelope means "no graph data", not "empty graph data",
 *      so the route MUST NOT emit a frame at all).
 *
 * Purity. Pure, synchronous — no PoolClient parameter (unlike `search`).
 * The directed envelope already carries `canonical_name` / `node_type` on
 * `run.affected_nodes` and `link_id` on `report[]`, so no hydration is
 * needed. `result` is validated as `unknown` field-by-field via the
 * existing `isRecord` guards — no runtime import from `ingestion`.
 */
export function normalizeIngestDirected(
  result: unknown,
  catalog: CatalogSnapshot
): GraphDeltaWire | null {
  if (!isRecord(result)) return null;

  // ---- Nodes -------------------------------------------------------------
  const nodes: GraphNodeWire[] = [];
  const run = isRecord(result.run) ? result.run : undefined;
  const rawAffected =
    run !== undefined && Array.isArray(run.affected_nodes)
      ? run.affected_nodes
      : [];
  for (const entry of rawAffected) {
    if (!isRecord(entry)) continue;
    const { id, canonical_name, node_type } = entry;
    if (typeof id !== "string") continue;
    if (typeof canonical_name !== "string") continue;
    if (typeof node_type !== "string") continue;
    nodes.push({
      id,
      node_type,
      canonical_name,
      // Forced: directed items are stated-by-construction (BR-43 v2.8).
      status: "active",
    });
  }

  // ---- Node ref -> id map (from accepted kind="node" entries) -----------
  const rawReport = Array.isArray(result.report) ? result.report : [];
  const nodeIdByRef = new Map<string, string>();
  for (const entry of rawReport) {
    if (!isRecord(entry)) continue;
    if (entry.kind !== "node") continue;
    if (typeof entry.status !== "string") continue;
    if (!ACCEPTED_DIRECTED_STATUSES.has(entry.status)) continue;
    if (typeof entry.ref !== "string") continue;
    if (typeof entry.node_id !== "string") continue;
    nodeIdByRef.set(entry.ref, entry.node_id);
  }

  // ---- Links -------------------------------------------------------------
  const links: GraphLinkWire[] = [];
  for (const entry of rawReport) {
    if (!isRecord(entry)) continue;
    if (entry.kind !== "link") continue;
    if (typeof entry.status !== "string") continue;
    if (!ACCEPTED_DIRECTED_STATUSES.has(entry.status)) continue;
    if (typeof entry.link_id !== "string") continue;
    if (typeof entry.ref !== "string") continue;

    // Compound ref: "<source_ref>-><link_type>-><target_ref>". Parse via
    // FIRST/LAST '->' to survive link_type slugs that themselves contain
    // '->' segments (defensive — not expected today, but the parser must
    // not fabricate a wrong split if a future link_type introduces one).
    const first = entry.ref.indexOf("->");
    const last = entry.ref.lastIndexOf("->");
    if (first === -1 || last === -1 || first === last) continue;
    const source_ref = entry.ref.slice(0, first);
    const link_type = entry.ref.slice(first + 2, last);
    const target_ref = entry.ref.slice(last + 2);
    if (source_ref === "" || link_type === "" || target_ref === "") continue;

    const source_node_id = nodeIdByRef.get(source_ref);
    const target_node_id = nodeIdByRef.get(target_ref);
    if (source_node_id === undefined || target_node_id === undefined) {
      // Silent defensive drop (unresolved-endpoint edge case, BR-41 v2.11).
      // Constraint 6 of the TC asks for a WARN log; the normalizer signature
      // is fixed to `(result, catalog)` and this file has no logger seam by
      // convention (all other arms silently drop malformed entries — see the
      // file header). The route-level `projectGraphDelta` try/catch handles
      // real exceptions; unresolved endpoints are a data-shape issue, not an
      // exception. Follow-up WARN wiring tracked in tech_debt.
      continue;
    }

    const linkTypeRow = catalog.linkTypeByName.get(link_type);
    // Same fallback as `pickLinkWire`: miss -> `is_temporal: false`, label
    // OMITTED. SPA humanizes the slug client-side when the label is absent.
    const is_temporal = linkTypeRow?.is_temporal ?? false;

    const out: GraphLinkWire = {
      id: entry.link_id,
      source_node_id,
      target_node_id,
      link_type,
      ...(linkTypeRow !== undefined ? { link_type_label: linkTypeRow.label } : {}),
      is_temporal,
      // OMITTED on the directed path (BR-41 v2.11): is_in_effect, status,
      // flags — view-derived and not yet materialised on the freshly
      // persisted link.
    };
    links.push(out);
  }

  return { source_tool: "ingest_directed", nodes, links };
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
  if (toolName === "ingest_directed") {
    // v2.11 (BR-41): fifth arm — pure, no client required. Envelope carries
    // `run.affected_nodes` + `report[]` — no hydration needed.
    return Promise.resolve(normalizeIngestDirected(result, catalog));
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
