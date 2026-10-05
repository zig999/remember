import type { PoolClient } from "pg";
import pino from "pino";
import { describe, expect, it } from "vitest";

import type { CatalogSnapshot } from "../../../modules/knowledge-graph/index.js";
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
const EXACT_NODE_SCORE = 0.4;
const APPROXIMATE_NODE_SCORE = 0.72;
const APPROXIMATE_SIMILARITY = 0.8;
const FRAGMENT_SCORE = 0.5;
const CHUNK_SCORE = 0.3;
const RECORDED_AT = new Date("2026-06-11T18:30:00Z");

const FRAGMENT_ID = "fragment-1";
const CHUNK_ID = "chunk-1";

interface GraphLink {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

interface Rows {
  rows: unknown[];
  rowCount: number;
}

const LINKS: readonly GraphLink[] = [
  { id: "link-a", source: "node-approximate", target: "node-b" },
  { id: "link-x", source: "node-exact", target: "node-y" },
];

const NODE_IDS: readonly string[] = [
  "node-approximate",
  "node-exact",
  "node-b",
  "node-y",
];

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
    created_at: RECORDED_AT,
    updated_at: RECORDED_AT,
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
    recorded_at: RECORDED_AT,
    superseded_at: null,
    status: "active",
    confidence: 0.9,
    valid_from_source: null,
    created_by_run_id: null,
    supersedes_link_id: null,
    created_at: RECORDED_AT,
    updated_at: RECORDED_AT,
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
    recorded_at: RECORDED_AT,
    status: "active",
  };
}

function provenanceRow(anchorId: string, fragmentId: string): unknown {
  return {
    anchor_id: anchorId,
    fragment_id: fragmentId,
    fragment_text: "texto",
    fragment_confidence: 0.9,
    raw_chunk_id: CHUNK_ID,
    offset_start: 0,
    offset_end: 5,
    excerpt: "texto",
    raw_information_id: "raw-1",
    source_type: "ata",
    received_at: RECORDED_AT,
  };
}

function nodeHitRow(id: string, score: number): Record<string, unknown> {
  return {
    node_id: id,
    canonical_name: `Name ${id}`,
    status: "active",
    score,
    matched_alias_ids: [],
  };
}

function respondToSearchLayers(sql: string): Rows | undefined {
  if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
    return result([{ q: "'termo'" }]);
  }
  if (sql.includes("word_similarity")) {
    return result([
      {
        ...nodeHitRow("node-approximate", APPROXIMATE_NODE_SCORE),
        similarity: APPROXIMATE_SIMILARITY,
      },
    ]);
  }
  if (sql.includes("FROM node_alias na")) {
    return result([nodeHitRow("node-exact", EXACT_NODE_SCORE)]);
  }
  return undefined;
}

function respondToProseLayers(sql: string): Rows | undefined {
  if (
    sql.includes("FROM information_fragment f") &&
    sql.includes("f.status = 'accepted'")
  ) {
    return result([
      {
        id: FRAGMENT_ID,
        text: "texto de fragmento",
        confidence: 0.92,
        status: "accepted",
        created_at: RECORDED_AT,
        score: FRAGMENT_SCORE,
      },
    ]);
  }
  if (sql.includes("FROM raw_chunk rc")) {
    return result([
      {
        id: CHUNK_ID,
        raw_information_id: "raw-1",
        chunk_index: 0,
        offset_start: 0,
        offset_end: 5,
        excerpt: "texto",
        score: CHUNK_SCORE,
      },
    ]);
  }
  if (sql.includes("FROM fragment_source fs")) {
    return result([{ fragment_id: FRAGMENT_ID, raw_chunk_id: CHUNK_ID }]);
  }
  return undefined;
}

function respondToProvenance(
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  if (sql.includes("WHERE f.id = ANY")) {
    return result(asIds(params[0]).map((id) => provenanceRow(id, id)));
  }
  if (sql.includes("plainto_tsquery")) {
    return result(
      asIds(params[1]).map((id) => provenanceRow(id, `fragment-for-${id}`))
    );
  }
  if (sql.includes("FROM provenance p") && sql.includes("AS anchor_id")) {
    return result(
      asIds(params[0]).map((id) => provenanceRow(id, `fragment-for-${id}`))
    );
  }
  if (sql.includes("FROM provenance p") && sql.includes("AS target_id")) {
    return result([]);
  }
  return undefined;
}

function respondToGraph(
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  const ids = asIds(params[0]);
  if (sql.includes("FROM knowledge_link_resolved kl")) {
    const side = sql.includes("kl.source_node_id = ANY") ? "source" : "target";
    return result(
      LINKS.filter((l) => ids.includes(l[side])).map(linkRow)
    );
  }
  if (sql.includes("JOIN node_type nt") && sql.includes("kn.id = ANY")) {
    return result(ids.filter((id) => NODE_IDS.includes(id)).map(nodeRow));
  }
  if (sql.includes("FROM knowledge_link kl")) {
    return result(
      LINKS.filter((l) => ids.includes(l.id)).map(linkMetadataRow)
    );
  }
  return undefined;
}

function respond(sql: string, params: readonly unknown[]): Rows {
  return (
    respondToSearchLayers(sql) ??
    respondToProseLayers(sql) ??
    respondToProvenance(sql, params) ??
    respondToGraph(sql, params) ??
    result([])
  );
}

function buildClient(): PoolClient {
  const standIn = {
    query: async (sql: string, params: unknown[] = []): Promise<Rows> =>
      respond(String(sql), params),
    release: (): void => undefined,
  };
  return standIn as unknown as PoolClient;
}

function searchAcrossAllLayers(): Promise<SearchResponse> {
  return searchKnowledgeService(
    buildClient(),
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

function itemsThatAreNotNodes(body: SearchResponse): unknown[] {
  return body.items
    .filter((item) => item.kind !== "node")
    .map((item) => ({
      kind: item.kind,
      id: item.id,
      match: item.match ?? undefined,
      similarity: item.similarity ?? undefined,
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

describe("searchKnowledgeService: the link and fragment items of a search over every layer", () => {
  it("answers each knowledge link reached from an exactly or an approximately matched node, and the information fragment that the fragment layer and a supporting chunk both matched, with no match and no similarity", async () => {
    const body = await searchAcrossAllLayers();

    expect(itemsThatAreNotNodes(body)).toEqual([
      { kind: "fragment", id: FRAGMENT_ID },
      { kind: "link", id: "link-a" },
      { kind: "link", id: "link-x" },
    ]);
  });
});
