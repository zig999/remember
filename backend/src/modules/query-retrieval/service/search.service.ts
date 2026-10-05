import type { PoolClient } from "pg";
import type { Logger } from "pino";

import {
  TRAVERSAL_DECAY,
  traverseNodes,
  type CatalogSnapshot,
  type TraverseNodesResult,
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
  searchNodeAliasApproximateLayer,
  searchNodeAliasLayer,
  type ChunkHitRow,
  type FragmentHitRow,
  type LinkMetadataRow,
  type NodeAliasHitRow,
  type SearchProvenanceRow,
} from "../repository/search.repository.js";
import {
  InvalidSearchLayerError,
  InvalidSearchQueryError,
} from "./errors.js";
import { UnknownLinkTypeError } from "../../knowledge-graph/service/errors.js";

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
  readonly key: string;
  readonly kind: "node" | "link" | "fragment";
  readonly layer: SearchLayer;
  readonly id: string;
  score: number;
  readonly hop: number;
  readonly recordedAtTs: number;
  summary: string;
  flags: AssertionFlag[];
  provenance: SearchProvenanceEntry[];
  readonly status: string;
  readonly confidence?: number;
}

type TraversedLink = TraverseNodesResult["links"][number];

interface ExpandedLink {
  readonly link: TraversedLink;
  readonly hop: number;
  readonly score: number;
}

interface ExpansionContext {
  readonly client: PoolClient;
  readonly logger: Logger;
  readonly input: SearchServiceInput;
  readonly linkTypeIds: readonly string[] | undefined;
}

interface LinkLookups {
  readonly metaById: ReadonlyMap<string, LinkMetadataRow>;
  readonly provByLink: ReadonlyMap<string, SearchProvenanceRow[]>;
}

export async function searchKnowledgeService(
  client: PoolClient,
  catalog: CatalogSnapshot,
  input: SearchServiceInput,
  logger: Logger
): Promise<SearchResponse> {
  const layers = resolveLayers(input.layers);

  const linkTypeIds = input.expand
    ? resolveLinkTypeIds(catalog, input.expandLinkTypes)
    : undefined;

  const parsed = await parseTsQuery(client, input.query);
  if (parsed === "") {
    throw new InvalidSearchQueryError("empty_after_parse", {
      query: input.query,
      parsed: "",
    });
  }

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
    nodeHits = await searchNodeLayer(client, input.query);
  }
  if (layers.has("chunk")) {
    chunkHits = await searchChunkLayer(
      client,
      input.query,
      PER_LAYER_FETCH_LIMIT
    );
  }

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

  const chunksById = new Map(chunkHits.map((c) => [c.id, c] as const));
  let dedupCollapsedCount = 0;

  for (const link of dedupLinks) {
    if (!chunksById.has(link.raw_chunk_id)) continue;
    dedupCollapsedCount += 1;
  }

  const items: IntermediateItem[] = [];

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
        recordedAtTs: 0,
        summary: n.canonical_name,
        flags,
        provenance,
        status: n.status,
      });
    }
  }

  let expansionHopCount = 0;
  if (input.expand && nodeHits.length > 0) {
    const context: ExpansionContext = { client, logger, input, linkTypeIds };
    const expanded = await collectExpandedLinks(
      context,
      scoreMatchedNodes(items)
    );
    expansionHopCount = expanded.size;
    items.push(...(await buildExpandedLinkItems(context, expanded)));
  }

  const filtered = input.includeUncertain
    ? items
    : items.filter((it) => it.status !== "uncertain");

  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.recordedAtTs !== a.recordedAtTs)
      return b.recordedAtTs - a.recordedAtTs;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const total = filtered.length;
  const sliced = filtered.slice(input.offset, input.offset + input.limit);

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

async function searchNodeLayer(
  client: PoolClient,
  query: string
): Promise<readonly NodeAliasHitRow[]> {
  const exactHits = await searchNodeAliasLayer(
    client,
    query,
    PER_LAYER_FETCH_LIMIT
  );
  const remaining = PER_LAYER_FETCH_LIMIT - exactHits.length;
  if (remaining <= 0) return exactHits;
  const approximateHits = await searchNodeAliasApproximateLayer(client, {
    query,
    limit: remaining,
    excludedNodeIds: exactHits.map((hit) => hit.node_id),
  });
  return [...exactHits, ...approximateHits];
}

function scoreMatchedNodes(
  items: readonly IntermediateItem[]
): ReadonlyMap<string, number> {
  const scoreById = new Map<string, number>();
  for (const it of items) {
    if (it.kind === "node") scoreById.set(it.id, it.score);
  }
  return scoreById;
}

function isBetterPath(candidate: ExpandedLink, current: ExpandedLink): boolean {
  if (candidate.score !== current.score) return candidate.score > current.score;
  return candidate.hop < current.hop;
}

function keepBestPath(
  reached: Map<string, ExpandedLink>,
  candidate: ExpandedLink
): void {
  const current = reached.get(candidate.link.id);
  if (current === undefined || isBetterPath(candidate, current)) {
    reached.set(candidate.link.id, candidate);
  }
}

async function collectExpandedLinks(
  context: ExpansionContext,
  matchedNodeScores: ReadonlyMap<string, number>
): Promise<ReadonlyMap<string, ExpandedLink>> {
  const reached = new Map<string, ExpandedLink>();
  for (const [startId, startScore] of matchedNodeScores) {
    const traversal = await traverseNodes(
      context.client,
      {
        startingNodeIds: [startId],
        direction: "both",
        linkTypeIds: context.linkTypeIds,
        depth: context.input.expandDepth,
        asOf: context.input.asOf,
        inEffectOnly: context.input.inEffectOnly,
      },
      context.logger
    );
    for (const link of traversal.links) {
      keepBestPath(reached, {
        link,
        hop: link.hop,
        score: Math.pow(TRAVERSAL_DECAY, link.hop) * startScore,
      });
    }
  }
  return reached;
}

async function buildExpandedLinkItems(
  context: ExpansionContext,
  expanded: ReadonlyMap<string, ExpandedLink>
): Promise<IntermediateItem[]> {
  if (expanded.size === 0) return [];
  const linkIds = [...expanded.keys()];
  const [linkProvRows, linkMeta] = await Promise.all([
    listProvenanceForLinks(context.client, linkIds),
    findLinksMetadata(context.client, linkIds),
  ]);
  const lookups: LinkLookups = {
    metaById: new Map(linkMeta.map((m) => [m.id, m] as const)),
    provByLink: groupProvenanceBy(linkProvRows, (r) => r.anchor_id),
  };

  const items: IntermediateItem[] = [];
  for (const candidate of expanded.values()) {
    const item = toExpandedLinkItem(context, candidate, lookups);
    if (item !== undefined) items.push(item);
  }
  return items;
}

function toExpandedLinkItem(
  context: ExpansionContext,
  candidate: ExpandedLink,
  lookups: LinkLookups
): IntermediateItem | undefined {
  const { link, hop, score } = candidate;
  const meta = lookups.metaById.get(link.id);
  if (meta === undefined) return undefined;

  const provenance = (lookups.provByLink.get(link.id) ?? []).map(
    toProvenanceEntry
  );
  if (provenance.length === 0) {
    context.logger.warn(
      {
        route: "GET /api/v1/search",
        anchor_kind: "link",
        link_id: link.id,
      },
      "query_retrieval_search_empty_link_provenance"
    );
    return undefined;
  }

  if (!context.input.includeUncertain && meta.status === "uncertain") {
    return undefined;
  }

  return {
    key: `link:${link.id}`,
    kind: "link",
    layer: "node",
    id: link.id,
    score,
    hop,
    recordedAtTs: meta.recorded_at.getTime(),
    summary: `${meta.source_canonical_name} -[${meta.link_type}]-> ${meta.target_canonical_name}`,
    flags: computeFlags({ kind: "link", status: meta.status }),
    provenance,
    status: meta.status,
  };
}

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
