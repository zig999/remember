import type { PoolClient } from "pg";
import pino from "pino";
import { describe, expect, it } from "vitest";

import {
  TRAVERSAL_DECAY,
  type CatalogSnapshot,
} from "../../../modules/knowledge-graph/index.js";
import type { SearchResponse } from "../../../modules/query-retrieval/dto/response.dto.js";
import { searchKnowledgeService } from "../../../modules/query-retrieval/service/search.service.js";

const silentLogger = pino({ level: "silent" });

const emptyCatalog: CatalogSnapshot = {
  nodeTypeByName: new Map(),
  nodeTypeById: new Map(),
  linkTypeByName: new Map(),
  linkTypeById: new Map(),
  linkTypeRules: [],
  attributeKeyByNodeTypeAndKey: new Map(),
  attributeKeyById: new Map(),
};

const EXPAND_DEPTH = 1;
const RESULT_LIMIT = 100;
const APPROXIMATE_SIMILARITY = 0.8;
const DEFAULT_RECORDED_AT = new Date("2026-06-11T18:30:00Z");
const JANUARY = new Date("2026-01-01T00:00:00Z");
const MARCH = new Date("2026-03-01T00:00:00Z");
const REACHING_NODE_SCORE = 0.8;
const ONE_HOP = 1;
const SHARED_SCORE = Math.pow(TRAVERSAL_DECAY, ONE_HOP) * REACHING_NODE_SCORE;

interface Match {
  readonly id: string;
  readonly score: number;
}

interface GraphLink {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly recordedAt: Date;
}

interface World {
  readonly approximateMatches: readonly Match[];
  readonly links: readonly GraphLink[];
}

interface Rows {
  rows: unknown[];
  rowCount: number;
}

function result(rows: unknown[]): Rows {
  return { rows, rowCount: rows.length };
}

function asIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function nodeRow(id: string): unknown {
  return {
    id,
    node_type_id: "type-1",
    node_type: "Person",
    canonical_name: `Name ${id}`,
    status: "active",
    merged_into_node_id: null,
    created_at: DEFAULT_RECORDED_AT,
    updated_at: DEFAULT_RECORDED_AT,
  };
}

function linkRow(link: GraphLink): unknown {
  return {
    id: link.id,
    source_node_id: link.source,
    target_node_id: link.target,
    link_type_id: "link-type-1",
    valid_from: null,
    valid_to: null,
    recorded_at: link.recordedAt,
    superseded_at: null,
    status: "active",
    confidence: 0.9,
    valid_from_source: null,
    created_by_run_id: null,
    supersedes_link_id: null,
    created_at: DEFAULT_RECORDED_AT,
    updated_at: DEFAULT_RECORDED_AT,
    link_type: "colabora",
    link_inverse_name: "colabora_com",
    is_current: true,
    is_in_effect: true,
    effective_status: "active",
  };
}

function linkMetadataRow(link: GraphLink): unknown {
  return {
    id: link.id,
    source_canonical_name: `Name ${link.source}`,
    target_canonical_name: `Name ${link.target}`,
    link_type: "colabora",
    recorded_at: link.recordedAt,
    status: "active",
  };
}

function provenanceRow(anchorId: string): unknown {
  return {
    anchor_id: anchorId,
    fragment_id: `fragment-for-${anchorId}`,
    fragment_text: "texto",
    fragment_confidence: 0.9,
    raw_chunk_id: "chunk-1",
    offset_start: 0,
    offset_end: 5,
    excerpt: "texto",
    raw_information_id: "raw-1",
    source_type: "ata",
    received_at: DEFAULT_RECORDED_AT,
  };
}

function approximateHitRow(m: Match): unknown {
  return {
    node_id: m.id,
    canonical_name: `Name ${m.id}`,
    status: "active",
    score: m.score,
    similarity: APPROXIMATE_SIMILARITY,
    matched_alias_ids: [],
  };
}

function knownNodeIds(world: World): Set<string> {
  const ids = new Set<string>(world.approximateMatches.map((m) => m.id));
  for (const link of world.links) {
    ids.add(link.source);
    ids.add(link.target);
  }
  return ids;
}

function respondToSearchLayers(world: World, sql: string): Rows | undefined {
  if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
    return result([{ q: "'termo'" }]);
  }
  if (sql.includes("word_similarity")) {
    return result(world.approximateMatches.map(approximateHitRow));
  }
  return undefined;
}

function respondToProvenance(
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  if (sql.includes("plainto_tsquery")) {
    return result(asIds(params[1]).map(provenanceRow));
  }
  if (sql.includes("FROM provenance p") && sql.includes("AS anchor_id")) {
    return result(asIds(params[0]).map(provenanceRow));
  }
  if (sql.includes("FROM provenance p") && sql.includes("AS target_id")) {
    return result([]);
  }
  return undefined;
}

function respondToGraph(
  world: World,
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  const ids = asIds(params[0]);
  if (sql.includes("FROM knowledge_link_resolved kl")) {
    const side = sql.includes("kl.source_node_id = ANY") ? "source" : "target";
    return result(
      world.links.filter((l) => ids.includes(l[side])).map(linkRow)
    );
  }
  if (sql.includes("JOIN node_type nt") && sql.includes("kn.id = ANY")) {
    const known = knownNodeIds(world);
    return result(ids.filter((id) => known.has(id)).map(nodeRow));
  }
  if (sql.includes("FROM knowledge_link kl")) {
    return result(
      world.links.filter((l) => ids.includes(l.id)).map(linkMetadataRow)
    );
  }
  return undefined;
}

function respond(
  world: World,
  sql: string,
  params: readonly unknown[]
): Rows {
  return (
    respondToSearchLayers(world, sql) ??
    respondToProvenance(sql, params) ??
    respondToGraph(world, sql, params) ??
    result([])
  );
}

function buildClient(world: World): PoolClient {
  const standIn = {
    query: async (sql: string, params: unknown[] = []): Promise<Rows> =>
      respond(world, String(sql), params),
    release: (): void => undefined,
  };
  return standIn as unknown as PoolClient;
}

function searchOver(world: World): Promise<SearchResponse> {
  return searchKnowledgeService(
    buildClient(world),
    emptyCatalog,
    {
      query: "termo",
      inEffectOnly: false,
      includeUncertain: true,
      expand: true,
      expandDepth: EXPAND_DEPTH,
      limit: RESULT_LIMIT,
      offset: 0,
    },
    silentLogger
  );
}

const APPROXIMATE_ONLY_WORLD: World = {
  approximateMatches: [
    { id: "node-reaching", score: REACHING_NODE_SCORE },
    { id: "a-node", score: SHARED_SCORE },
  ],
  links: [
    { id: "k-link-old", source: "node-reaching", target: "node-y1", recordedAt: JANUARY },
    { id: "z-link-late", source: "node-reaching", target: "node-y2", recordedAt: MARCH },
    { id: "b-link-late", source: "node-reaching", target: "node-y3", recordedAt: MARCH },
  ],
};

describe("searchKnowledgeService ranking: the group reached only through approximate matches", () => {
  it("orders links of equal score by recording time descending, then by identifier ascending, and a knowledge node of that score last as never recorded", async () => {
    const body = await searchOver(APPROXIMATE_ONLY_WORLD);

    expect(body.items.map((item) => item.id)).toEqual([
      "node-reaching",
      "b-link-late",
      "z-link-late",
      "k-link-old",
      "a-node",
    ]);
  });
});
