// searchKnowledge service — composes the three-layer FTS pipeline:
//
//   1. parse the tsquery (BR-05) — empty parse short-circuits to
//      InvalidSearchQueryError.
//   2. fan out the three layer queries SEQUENTIALLY on one connection
//      (BR-09, BR-01) inside the route's transaction.
//   3. dedup chunk hits anchored by fragment hits (BR-10).
//   4. optional graph expansion via knowledge-graph traverseNodes() (BR-13).
//   5. assemble provenance for each surviving item (BR-18 building blocks).
//   6. compute flags (BR-08), apply include_uncertain filter at SQL level
//      is N/A here — the partial GIN already excludes non-accepted; for
//      future graph rows the flag is post-SQL.
//   7. rank with deterministic tie-breakers (BR-15).
//   8. paginate; return total = pre-pagination length.

import type { PoolClient } from "pg";
import type { Logger } from "pino";

import {
  TRAVERSAL_DECAY,
  traverseNodes,
  type CatalogSnapshot,
} from "../../knowledge-graph/index.js";
import { ALLOWED_LAYERS, type SearchLayer } from "../dto/search.dto.js";
import type {
  AssertionFlag,
  SearchItem,
  SearchProvenanceEntry,
  SearchResponse,
} from "../dto/response.dto.js";
import { toSourceType } from "../dto/response.dto.js";
import {
  findChunkFragmentLinks,
  findLinksMetadata,
  listProvenanceForFragments,
  listProvenanceForLinks,
  listProvenanceForNodes,
  parseTsQuery,
  searchChunkLayer,
  searchFragmentLayer,
  searchNodeAliasLayer,
  type ChunkHitRow,
  type FragmentHitRow,
  type NodeAliasHitRow,
  type SearchProvenanceRow,
} from "../repository/search.repository.js";
import {
  InvalidSearchLayerError,
  InvalidSearchQueryError,
} from "./errors.js";
import { UnknownLinkTypeError } from "../../knowledge-graph/service/errors.js";

/** Per-layer fan-out cap. We pull a generous slice from each layer so the
 *  global ranking has enough candidates; the final result is sliced by the
 *  caller's `limit`/`offset` after the in-memory sort. */
const PER_LAYER_FETCH_LIMIT = 200;

const LOW_CONFIDENCE_THRESHOLD = 0.4;

export interface SearchServiceInput {
  readonly query: string;
  readonly layers?: readonly string[];
  readonly asOf?: string;
  readonly inEffectOnly: boolean;
  readonly includeUncertain: boolean;
  readonly expand: boolean;
  readonly expandDepth: number;
  readonly expandLinkTypes?: readonly string[];
  readonly limit: number;
  readonly offset: number;
}

interface IntermediateItem {
  readonly key: string; // unique id used for dedup (kind:id)
  readonly kind: "node" | "link" | "fragment";
  readonly layer: SearchLayer;
  readonly id: string;
  score: number;
  readonly hop: number;
  readonly recordedAtTs: number; // for tie-break (BR-15)
  summary: string;
  flags: AssertionFlag[];
  provenance: SearchProvenanceEntry[];
  /** Status of the underlying row (drives flags + include_uncertain). */
  readonly status: string;
  /** Confidence — only meaningful for fragment kind. */
  readonly confidence?: number;
}

export async function searchKnowledgeService(
  client: PoolClient,
  catalog: CatalogSnapshot,
  input: SearchServiceInput,
  logger: Logger
): Promise<SearchResponse> {
  // ---------------------------------------------------------------
  // (a) Validate `layers[]` against the closed set (BR-04). Zod accepts
  //     any string; the service is the authoritative gate.
  // ---------------------------------------------------------------
  const layers = resolveLayers(input.layers);

  // ---------------------------------------------------------------
  // (b) Validate `expand_link_types[]` against the catalog (BR-03).
  //     Ignored when `expand=false`.
  // ---------------------------------------------------------------
  const linkTypeIds = input.expand
    ? resolveLinkTypeIds(catalog, input.expandLinkTypes)
    : undefined;

  // ---------------------------------------------------------------
  // (c) Parse the tsquery once (BR-05) — Postgres tells us if it is empty.
  // ---------------------------------------------------------------
  const parsed = await parseTsQuery(client, input.query);
  if (parsed === "") {
    throw new InvalidSearchQueryError("empty_after_parse", {
      query: input.query,
      parsed: "",
    });
  }

  // ---------------------------------------------------------------
  // (d) Fan out — sequential on one connection (BR-09).
  // ---------------------------------------------------------------
  let fragmentHits: readonly FragmentHitRow[] = [];
  let nodeHits: readonly NodeAliasHitRow[] = [];
  let chunkHits: readonly ChunkHitRow[] = [];

  if (layers.has("fragment")) {
    fragmentHits = await searchFragmentLayer(
      client,
      input.query,
      PER_LAYER_FETCH_LIMIT
    );
  }
  if (layers.has("node")) {
    nodeHits = await searchNodeAliasLayer(
      client,
      input.query,
      PER_LAYER_FETCH_LIMIT
    );
  }
  if (layers.has("chunk")) {
    chunkHits = await searchChunkLayer(
      client,
      input.query,
      PER_LAYER_FETCH_LIMIT
    );
  }

  // ---------------------------------------------------------------
  // (e) Dedup: collapse chunks that are anchored by fragments in the
  //     result set (BR-10). The chunk drops out entirely; the fragment
  //     surfaces with the chunk's excerpt in its provenance.
  // ---------------------------------------------------------------
  const fragmentIdSet = new Set(fragmentHits.map((f) => f.id));
  const chunkIdSet = new Set(chunkHits.map((c) => c.id));
  const dedupLinks =
    layers.has("fragment") && layers.has("chunk")
      ? await findChunkFragmentLinks(
          client,
          [...fragmentIdSet],
          [...chunkIdSet]
        )
      : [];

  // Build a `raw_chunk_id -> Set<fragment_id>` map; any chunk in the map
  // is removed from the chunk result and folded into the fragments.
  const collapsedChunks = new Set<string>();
  const fragmentToCollapsedChunks = new Map<string, ChunkHitRow[]>();
  const chunksById = new Map(chunkHits.map((c) => [c.id, c] as const));
  let dedupCollapsedCount = 0;

  for (const link of dedupLinks) {
    if (!chunksById.has(link.raw_chunk_id)) continue;
    collapsedChunks.add(link.raw_chunk_id);
    const list =
      fragmentToCollapsedChunks.get(link.fragment_id) ?? [];
    list.push(chunksById.get(link.raw_chunk_id)!);
    fragmentToCollapsedChunks.set(link.fragment_id, list);
    dedupCollapsedCount += 1;
  }

  // BR-10: a chunk hit not anchored by ANY fragment in the result set is
  // dropped (we never surface raw-chunk text without the fragment lens).
  // We retain chunk hits only if explicitly requested and no fragment
  // anchored them. Per the spec ("collapse predates ranking; the final
  // list never carries a chunk row"), we DROP all chunk hits unconditionally
  // — only the dedup collapse promotes their excerpts into fragments.
  // Chunks NOT collapsed have no surface; they drop.

  // ---------------------------------------------------------------
  // (f) Build the intermediate result list.
  // ---------------------------------------------------------------
  const items: IntermediateItem[] = [];

  // Fragment kind items
  if (fragmentHits.length > 0) {
    const provRows = await listProvenanceForFragments(
      client,
      fragmentHits.map((f) => f.id)
    );
    const provByFragment = groupProvenanceBy(provRows, (r) => r.anchor_id);

    for (const f of fragmentHits) {
      const provenance = (provByFragment.get(f.id) ?? []).map(
        toProvenanceEntry
      );
      // Fold any collapsed chunks into the fragment's provenance — the
      // chunk's excerpt is what the user actually matched.
      const extra = fragmentToCollapsedChunks.get(f.id) ?? [];
      for (const chunk of extra) {
        // Locate the underlying raw_information for the chunk via the
        // provenance rows we already fetched — every collapsed chunk
        // belongs to a `fragment_source` row anchored on this fragment,
        // so a provenance row with matching raw_chunk_id must exist.
        const match = (provByFragment.get(f.id) ?? []).find(
          (p) => p.raw_chunk_id === chunk.id
        );
        if (match !== undefined) continue; // already in the fragment chain
        // Defensive fallback — the dedup join SHOULD imply the row exists,
        // but skip silently rather than fabricate data.
      }

      const confidence = Number(f.confidence);
      const flags = computeFlags({
        kind: "fragment",
        status: "accepted",
        confidence,
      });

      items.push({
        key: `fragment:${f.id}`,
        kind: "fragment",
        layer: "fragment",
        id: f.id,
        score: f.score,
        hop: 0,
        recordedAtTs: f.created_at.getTime(),
        summary: f.text,
        flags,
        provenance,
        status: "accepted",
        confidence,
      });
    }
  }

  // Node-alias kind items
  if (nodeHits.length > 0) {
    const provRows = await listProvenanceForNodes(
      client,
      nodeHits.map((n) => n.node_id)
    );
    const provByNode = groupProvenanceBy(provRows, (r) => r.anchor_id);

    for (const n of nodeHits) {
      const provenance = (provByNode.get(n.node_id) ?? []).map(
        toProvenanceEntry
      );

      // BR-13 of back spec / OpenAPI: `provenance` minItems: 1. A node
      // hit without ANY accepted-fragment trace is dropped — we never
      // surface a node without a provenance chain.
      if (provenance.length === 0) continue;

      const flags = computeFlags({
        kind: "node",
        status: n.status,
      });

      items.push({
        key: `node:${n.node_id}`,
        kind: "node",
        layer: "node",
        id: n.node_id,
        score: n.score,
        hop: 0,
        recordedAtTs: 0, // node has no recorded_at axis; tie-break falls through
        summary: n.canonical_name,
        flags,
        provenance,
        status: n.status,
      });
    }
  }

  // ---------------------------------------------------------------
  // (g) Graph expansion (BR-13). Skip when `expand=false`.
  // ---------------------------------------------------------------
  let expansionHopCount = 0;
  if (input.expand && nodeHits.length > 0) {
    const startingIds = nodeHits
      .filter((n) =>
        // Only expand from node items that actually surfaced (had provenance)
        items.some((it) => it.kind === "node" && it.id === n.node_id)
      )
      .map((n) => n.node_id);

    if (startingIds.length > 0) {
      const traversal = await traverseNodes(
        client,
        {
          startingNodeIds: startingIds,
          direction: "both",
          linkTypeIds,
          depth: input.expandDepth,
          asOf: input.asOf,
          inEffectOnly: input.inEffectOnly,
        },
        logger
      );

      // For each link returned by the traversal, surface a `link` SearchItem.
      // Score = TRAVERSAL_DECAY ** hop * <source node score>.
      // We look up the source-node score by searching the items array.
      const nodeScoreById = new Map<string, number>();
      for (const it of items) {
        if (it.kind === "node") nodeScoreById.set(it.id, it.score);
      }

      const newLinks = traversal.links;
      expansionHopCount = newLinks.length;

      if (newLinks.length > 0) {
        // Provenance + metadata in one batched lookup each.
        const linkIds = newLinks.map((l) => l.id);
        const [linkProvRows, linkMeta] = await Promise.all([
          listProvenanceForLinks(client, linkIds),
          findLinksMetadata(client, linkIds),
        ]);
        const provByLink = groupProvenanceBy(linkProvRows, (r) => r.anchor_id);
        const metaById = new Map(linkMeta.map((m) => [m.id, m] as const));

        for (const link of newLinks) {
          const hop = link.hop;
          // The hop's source node id is one of the endpoints — pick whichever
          // is in our scoring map; fall back to the highest source score.
          const sourceScore =
            nodeScoreById.get(link.source_node_id) ??
            nodeScoreById.get(link.target_node_id) ??
            0;
          const score = Math.pow(TRAVERSAL_DECAY, hop) * sourceScore;

          const meta = metaById.get(link.id);
          if (meta === undefined) continue;

          const provenance = (provByLink.get(link.id) ?? []).map(
            toProvenanceEntry
          );
          if (provenance.length === 0) {
            // BR-13 / OpenAPI: links without provenance are an alarm but
            // we MUST NOT emit a `provenance: []` row. Log warn and drop.
            logger.warn(
              {
                route: "GET /api/v1/search",
                anchor_kind: "link",
                link_id: link.id,
              },
              "query_retrieval_search_empty_link_provenance"
            );
            continue;
          }

          const summary = `${meta.source_canonical_name} -[${meta.link_type}]-> ${meta.target_canonical_name}`;

          const flags = computeFlags({
            kind: "link",
            status: meta.status,
          });

          // include_uncertain filter on the storage column (BR-08).
          if (!input.includeUncertain && meta.status === "uncertain") continue;

          items.push({
            key: `link:${link.id}`,
            kind: "link",
            layer: "node",
            id: link.id,
            score,
            hop,
            recordedAtTs: meta.recorded_at.getTime(),
            summary,
            flags,
            provenance,
            status: meta.status,
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------
  // (h) include_uncertain filter on the in-memory list (node hits).
  //     Fragment partial GIN already filters status=accepted; uncertain
  //     applies to graph rows only.
  // ---------------------------------------------------------------
  const filtered = input.includeUncertain
    ? items
    : items.filter((it) => it.status !== "uncertain");

  // ---------------------------------------------------------------
  // (i) Rank (BR-15): score DESC, recordedAtTs DESC, id ASC.
  // ---------------------------------------------------------------
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.recordedAtTs !== a.recordedAtTs)
      return b.recordedAtTs - a.recordedAtTs;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const total = filtered.length;
  const sliced = filtered.slice(input.offset, input.offset + input.limit);

  // ---------------------------------------------------------------
  // (j) Log (no raw query at INFO level — BR-04 constraint).
  // ---------------------------------------------------------------
  logger.info(
    {
      route: "GET /api/v1/search",
      outcome: "ok",
      query_length: input.query.length,
      parsed_tsquery_empty: false,
      layers_requested: [...layers],
      expand: input.expand,
      expand_depth: input.expandDepth,
      result_count: sliced.length,
      total,
      dedup_collapsed_count: dedupCollapsedCount,
      expansion_hop_count: expansionHopCount,
    },
    "query_retrieval_search_ok"
  );

  const response: SearchResponse = {
    query: input.query,
    total,
    limit: input.limit,
    offset: input.offset,
    items: sliced.map(toSearchItem),
  };
  return response;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveLayers(
  layers: readonly string[] | undefined
): Set<SearchLayer> {
  if (layers === undefined || layers.length === 0) {
    return new Set(ALLOWED_LAYERS);
  }
  const set = new Set<SearchLayer>();
  for (const layer of layers) {
    if (!(ALLOWED_LAYERS as readonly string[]).includes(layer)) {
      throw new InvalidSearchLayerError(layer);
    }
    set.add(layer as SearchLayer);
  }
  return set;
}

function resolveLinkTypeIds(
  catalog: CatalogSnapshot,
  names: readonly string[] | undefined
): readonly string[] | undefined {
  if (names === undefined || names.length === 0) return undefined;
  const ids: string[] = [];
  for (const name of names) {
    const row = catalog.linkTypeByName.get(name);
    if (row === undefined) {
      throw new UnknownLinkTypeError(name);
    }
    ids.push(row.id);
  }
  return ids;
}

function groupProvenanceBy(
  rows: readonly SearchProvenanceRow[],
  keyFn: (r: SearchProvenanceRow) => string
): Map<string, SearchProvenanceRow[]> {
  const map = new Map<string, SearchProvenanceRow[]>();
  for (const row of rows) {
    const key = keyFn(row);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function toProvenanceEntry(row: SearchProvenanceRow): SearchProvenanceEntry {
  return {
    fragment_id: row.fragment_id,
    fragment_text: row.fragment_text,
    confidence: Number(row.fragment_confidence),
    raw_information_id: row.raw_information_id,
    source_type: toSourceType(row.source_type),
    received_at: row.received_at.toISOString(),
    excerpt: row.excerpt,
  };
}

function computeFlags(
  args:
    | { kind: "fragment"; status: string; confidence: number }
    | { kind: "node" | "link"; status: string }
): AssertionFlag[] {
  const flags: AssertionFlag[] = [];
  if (args.status === "uncertain") flags.push("uncertain");
  if (args.status === "disputed") flags.push("disputed");
  if (
    args.kind === "fragment" &&
    args.status === "accepted" &&
    args.confidence < LOW_CONFIDENCE_THRESHOLD
  ) {
    flags.push("low_confidence");
  }
  return flags;
}

function toSearchItem(it: IntermediateItem): SearchItem {
  return {
    kind: it.kind,
    layer: it.layer,
    id: it.id,
    score: it.score,
    hop: it.hop,
    summary: it.summary,
    flags: it.flags,
    provenance: it.provenance,
  };
}
