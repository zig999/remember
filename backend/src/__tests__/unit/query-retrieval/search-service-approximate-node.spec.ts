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

const NODE_LAYER_CAP = 200;
const EXACT_CANDIDATES = 150;
const APPROXIMATE_CANDIDATES = 100;
const RESULT_LIMIT = 500;
const EXACT_SCORE = 0.63;
const APPROXIMATE_SCORE = 0.72;
const RECORDED_AT = new Date("2026-06-11T18:30:00Z");
const TRIGRAM_PATTERN = /similarity|<%|%>|\s%\s/;

interface Rows {
  rows: unknown[];
  rowCount: number;
}

interface NodeHit {
  readonly node_id: string;
  readonly canonical_name: string;
  readonly status: "active";
  readonly score: number;
  readonly matched_alias_ids: readonly string[];
}

interface Store {
  readonly exact: readonly NodeHit[];
  readonly approximate: readonly NodeHit[];
  readonly trigramFragment?: unknown;
  readonly trigramChunk?: unknown;
}

const TRIGRAM_FRAGMENT_ROW = {
  id: "fragment-petrobras",
  text: "Petrobras assinou o contrato.",
  confidence: 0.9,
  status: "accepted",
  created_at: RECORDED_AT,
  score: 0.5,
};

const TRIGRAM_CHUNK_ROW = {
  id: "chunk-petrobras",
  raw_information_id: "raw-1",
  chunk_index: 0,
  offset_start: 0,
  offset_end: 29,
  excerpt: "Petrobras assinou o contrato.",
  score: 0.5,
};

function result(rows: unknown[]): Rows {
  return { rows, rowCount: rows.length };
}

function nodeHit(id: string, score: number): NodeHit {
  return {
    node_id: id,
    canonical_name: `Name ${id}`,
    status: "active",
    score,
    matched_alias_ids: [],
  };
}

function nodeHits(prefix: string, count: number, score: number): NodeHit[] {
  return Array.from({ length: count }, (_, index) =>
    nodeHit(`${prefix}-${index}`, score)
  );
}

function idsIn(params: readonly unknown[]): string[] {
  const list: unknown = params.find((param) => Array.isArray(param));
  if (!Array.isArray(list)) return [];
  return list.filter((value): value is string => typeof value === "string");
}

function limitIn(params: readonly unknown[]): number {
  const last = params[params.length - 1];
  return typeof last === "number" && Number.isInteger(last) ? last : Infinity;
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
    received_at: RECORDED_AT,
  };
}

function respondToNodeRoutes(
  store: Store,
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  if (sql.includes("plainto_tsquery")) {
    return result(idsIn(params).map(provenanceRow));
  }
  if (sql.includes("word_similarity") && sql.includes("node_alias")) {
    const excluded = new Set(idsIn(params));
    const candidates = store.approximate.filter(
      (hit) => !excluded.has(hit.node_id)
    );
    return result(candidates.slice(0, limitIn(params)));
  }
  if (sql.includes("FROM node_alias na")) {
    return result(store.exact.slice(0, limitIn(params)));
  }
  return undefined;
}

function respondToProseLayers(
  store: Store,
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  const reachedByTrigram = TRIGRAM_PATTERN.test(sql);
  if (sql.includes("WHERE f.id = ANY")) {
    return result(idsIn(params).map(provenanceRow));
  }
  if (sql.includes("FROM information_fragment f")) {
    const hit = reachedByTrigram ? store.trigramFragment : undefined;
    return result(hit === undefined ? [] : [hit]);
  }
  if (sql.includes("FROM raw_chunk rc")) {
    const hit = reachedByTrigram ? store.trigramChunk : undefined;
    return result(hit === undefined ? [] : [hit]);
  }
  return undefined;
}

function respond(store: Store, sql: string, params: readonly unknown[]): Rows {
  if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
    return result([{ q: "'termo'" }]);
  }
  return (
    respondToNodeRoutes(store, sql, params) ??
    respondToProseLayers(store, sql, params) ??
    result([])
  );
}

function buildClient(store: Store): PoolClient {
  const standIn = {
    query: async (sql: string, params: unknown[] = []): Promise<Rows> =>
      respond(store, String(sql), params),
    release: (): void => undefined,
  };
  return standIn as unknown as PoolClient;
}

function searchFor(store: Store, query: string): Promise<SearchResponse> {
  return searchKnowledgeService(
    buildClient(store),
    emptyCatalog,
    {
      query,
      inEffectOnly: false,
      includeUncertain: true,
      expand: false,
      expandDepth: 1,
      limit: RESULT_LIMIT,
      offset: 0,
    },
    silentLogger
  );
}

function itemsOf(body: SearchResponse, id: string): SearchResponse["items"] {
  return body.items.filter((item) => item.id === id);
}

const BOTH_ROUTES_STORE: Store = {
  exact: [nodeHit("node-both", EXACT_SCORE)],
  approximate: [
    nodeHit("node-both", APPROXIMATE_SCORE),
    nodeHit("node-approximate-only", APPROXIMATE_SCORE),
  ],
};

const CROWDED_STORE: Store = {
  exact: nodeHits("exact", EXACT_CANDIDATES, EXACT_SCORE),
  approximate: nodeHits("approximate", APPROXIMATE_CANDIDATES, APPROXIMATE_SCORE),
};

describe("searchKnowledgeService: the node layer's approximate route", () => {
  it("answers a knowledge node that only the approximate route reaches as a node item at hop 0", async () => {
    const store: Store = {
      exact: [],
      approximate: [nodeHit("node-petrobras", APPROXIMATE_SCORE)],
    };

    const body = await searchFor(store, "Petrobrass");

    expect(
      body.items.map((item) => ({
        kind: item.kind,
        id: item.id,
        hop: item.hop,
      }))
    ).toEqual([{ kind: "node", id: "node-petrobras", hop: 0 }]);
  });
});

describe("searchKnowledgeService: a node matched by both node-layer routes", () => {
  it("answers a knowledge node matched both exactly and approximately once", async () => {
    const body = await searchFor(BOTH_ROUTES_STORE, "Petrobras");

    expect(itemsOf(body, "node-both")).toHaveLength(1);
  });

  it("scores a knowledge node matched both exactly and approximately with its exact-match score", async () => {
    const body = await searchFor(BOTH_ROUTES_STORE, "Petrobras");

    expect(itemsOf(body, "node-both").map((item) => item.score)).toEqual([
      EXACT_SCORE,
    ]);
  });
});

describe("searchKnowledgeService: the node layer's candidate cap across both routes", () => {
  it("keeps at most 200 node candidates when the exact and approximate routes together hold more", async () => {
    const body = await searchFor(CROWDED_STORE, "Petrobras");

    expect(body.items).toHaveLength(NODE_LAYER_CAP);
  });

  it("reports a total that counts the 200 candidates kept, not the candidates both routes held", async () => {
    const body = await searchFor(CROWDED_STORE, "Petrobras");

    expect(body.total).toBe(NODE_LAYER_CAP);
  });
});

const APPROXIMATE_NODE_ONLY: Store = {
  exact: [],
  approximate: [nodeHit("node-petrobras", APPROXIMATE_SCORE)],
};

const PROSE_LAYER_STORES: [string, Store][] = [
  ["fragment", { ...APPROXIMATE_NODE_ONLY, trigramFragment: TRIGRAM_FRAGMENT_ROW }],
  ["chunk", { ...APPROXIMATE_NODE_ONLY, trigramChunk: TRIGRAM_CHUNK_ROW }],
];

describe("searchKnowledgeService: prose layers stay lexical", () => {
  it.each(PROSE_LAYER_STORES)(
    "answers no %s-layer item for text that only a trigram match could reach",
    async (layer, store) => {
      const body = await searchFor(store, "Petrobrass");

      expect(body.items.filter((item) => item.layer === layer)).toEqual([]);
    }
  );
});
