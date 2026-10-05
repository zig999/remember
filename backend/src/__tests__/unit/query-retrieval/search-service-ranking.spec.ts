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
const APPROXIMATE_SIMILARITY = 0.8;
const DEFAULT_RECORDED_AT = new Date("2026-06-11T18:30:00Z");
const JANUARY = new Date("2026-01-01T00:00:00Z");
const FEBRUARY = new Date("2026-02-01T00:00:00Z");
const MARCH = new Date("2026-03-01T00:00:00Z");
const APRIL = new Date("2026-04-01T00:00:00Z");
const QUARTER_SCORE = 0.25;

interface Match {
  readonly id: string;
  readonly score: number;
}

interface GraphLink {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly recordedAt?: Date;
}

interface FragmentHit {
  readonly id: string;
  readonly score: number;
  readonly createdAt: Date;
}

interface World {
  readonly matches: readonly Match[];
  readonly approximateMatches?: readonly Match[];
  readonly links?: readonly GraphLink[];
  readonly fragment?: FragmentHit;
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

function linksOf(world: World): readonly GraphLink[] {
  return world.links ?? [];
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
    recorded_at: link.recordedAt ?? DEFAULT_RECORDED_AT,
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
    recorded_at: link.recordedAt ?? DEFAULT_RECORDED_AT,
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

function nodeHitRow(m: Match): unknown {
  return {
    node_id: m.id,
    canonical_name: `Name ${m.id}`,
    status: "active",
    score: m.score,
    matched_alias_ids: [],
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

function fragmentRow(hit: FragmentHit): unknown {
  return {
    id: hit.id,
    text: "texto de fragmento",
    confidence: 0.92,
    status: "accepted",
    created_at: hit.createdAt,
    score: hit.score,
  };
}

function knownNodeIds(world: World): Set<string> {
  const matched = [...world.matches, ...(world.approximateMatches ?? [])];
  const ids = new Set<string>(matched.map((m) => m.id));
  for (const link of linksOf(world)) {
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
    return result((world.approximateMatches ?? []).map(approximateHitRow));
  }
  if (sql.includes("FROM node_alias na")) {
    return result(world.matches.map(nodeHitRow));
  }
  if (
    sql.includes("FROM information_fragment f") &&
    sql.includes("f.status = 'accepted'")
  ) {
    return result(
      world.fragment === undefined ? [] : [fragmentRow(world.fragment)]
    );
  }
  return undefined;
}

function respondToProvenance(
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  if (sql.includes("WHERE f.id = ANY")) {
    return result(asIds(params[0]).map(provenanceRow));
  }
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
      linksOf(world)
        .filter((l) => ids.includes(l[side]))
        .map(linkRow)
    );
  }
  if (sql.includes("JOIN node_type nt") && sql.includes("kn.id = ANY")) {
    const known = knownNodeIds(world);
    return result(ids.filter((id) => known.has(id)).map(nodeRow));
  }
  if (sql.includes("FROM knowledge_link kl")) {
    return result(
      linksOf(world)
        .filter((l) => ids.includes(l.id))
        .map(linkMetadataRow)
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

function idsInOrder(body: SearchResponse): string[] {
  return body.items.map((item) => item.id);
}

function idsAmong(body: SearchResponse, wanted: readonly string[]): string[] {
  return idsInOrder(body).filter((id) => wanted.includes(id));
}

describe("searchKnowledgeService ranking: approximately matched knowledge nodes", () => {
  it("ranks an approximately matched knowledge node after an exactly matched one whose score is lower", async () => {
    const world: World = {
      matches: [{ id: "node-exact", score: 0.3 }],
      approximateMatches: [{ id: "node-approximate", score: 0.9 }],
    };

    const body = await searchOver(world);

    expect(idsInOrder(body)).toEqual(["node-exact", "node-approximate"]);
  });

  it("ranks an approximately matched knowledge node after an information fragment and a knowledge link that were not reached only through approximate matches", async () => {
    const world: World = {
      matches: [{ id: "node-x", score: 0.4 }],
      approximateMatches: [{ id: "node-a", score: 0.8 }],
      links: [{ id: "link-x1", source: "node-x", target: "node-y" }],
      fragment: { id: "fragment-1", score: 0.5, createdAt: DEFAULT_RECORDED_AT },
    };

    const body = await searchOver(world);

    expect(idsAmong(body, ["node-a", "fragment-1", "link-x1"])).toEqual([
      "fragment-1",
      "link-x1",
      "node-a",
    ]);
  });
});

describe("searchKnowledgeService ranking: knowledge links by how they were reached", () => {
  it("ranks a knowledge link reached only through an approximately matched node after every item not reached only through approximate matches", async () => {
    const world: World = {
      matches: [{ id: "node-x", score: 0.2 }],
      approximateMatches: [{ id: "node-a", score: 0.9 }],
      links: [
        { id: "link-a", source: "node-a", target: "node-b" },
        { id: "link-x1", source: "node-x", target: "node-y" },
      ],
      fragment: { id: "fragment-1", score: 0.5, createdAt: DEFAULT_RECORDED_AT },
    };

    const body = await searchOver(world);

    expect(
      idsAmong(body, ["fragment-1", "node-x", "link-x1", "link-a"])
    ).toEqual(["fragment-1", "node-x", "link-x1", "link-a"]);
  });

  it("ranks a knowledge link reached from both an exactly and an approximately matched node among the items not reached only through approximate matches", async () => {
    const world: World = {
      matches: [{ id: "node-x", score: 0.2 }],
      approximateMatches: [{ id: "node-a", score: 0.9 }],
      links: [{ id: "link-xa", source: "node-a", target: "node-x" }],
    };

    const body = await searchOver(world);

    expect(idsAmong(body, ["link-xa", "node-a"])).toEqual([
      "link-xa",
      "node-a",
    ]);
  });
});

describe("searchKnowledgeService ranking: within a group", () => {
  it.each<[string, World, string[]]>([
    [
      "among items not reached only through approximate matches",
      {
        matches: [
          { id: "a-low", score: 0.3 },
          { id: "b-high", score: 0.6 },
        ],
      },
      ["b-high", "a-low"],
    ],
    [
      "among items reached only through approximate matches",
      {
        matches: [],
        approximateMatches: [
          { id: "a-low", score: 0.5 },
          { id: "b-high", score: 0.9 },
        ],
      },
      ["b-high", "a-low"],
    ],
  ])("orders by score descending %s", async (_group, world, expected) => {
    const body = await searchOver(world);

    expect(idsInOrder(body)).toEqual(expected);
  });

  it("orders items of equal score by recording time descending, a fragment counting as recorded at its creation time", async () => {
    const world: World = {
      matches: [{ id: "node-x", score: 0.5 }],
      links: [
        { id: "b-link-old", source: "node-x", target: "node-y1", recordedAt: JANUARY },
        { id: "z-link-new", source: "node-x", target: "node-y2", recordedAt: MARCH },
      ],
      fragment: { id: "m-fragment", score: QUARTER_SCORE, createdAt: FEBRUARY },
    };

    const body = await searchOver(world);

    expect(
      idsAmong(body, ["b-link-old", "m-fragment", "z-link-new"])
    ).toEqual(["z-link-new", "m-fragment", "b-link-old"]);
  });

  it("orders a knowledge node, counting as never recorded, after a knowledge link and an information fragment of equal score", async () => {
    const world: World = {
      matches: [
        { id: "node-x", score: 0.5 },
        { id: "a-node", score: QUARTER_SCORE },
      ],
      links: [{ id: "z-link", source: "node-x", target: "node-y" }],
      fragment: { id: "m-fragment", score: QUARTER_SCORE, createdAt: DEFAULT_RECORDED_AT },
    };

    const body = await searchOver(world);

    expect(idsAmong(body, ["a-node", "m-fragment", "z-link"])).toEqual([
      "m-fragment",
      "z-link",
      "a-node",
    ]);
  });

  it("orders items of equal score and equal recording time by identifier ascending", async () => {
    const world: World = {
      matches: [{ id: "node-x", score: 0.5 }],
      links: [
        { id: "link-b", source: "node-x", target: "node-y1" },
        { id: "link-a", source: "node-x", target: "node-y2" },
      ],
    };

    const body = await searchOver(world);

    expect(idsAmong(body, ["link-a", "link-b"])).toEqual(["link-a", "link-b"]);
  });
});

const EVERY_RANKING_KEY_WORLD: World = {
  matches: [
    { id: "node-x", score: 0.5 },
    { id: "a-node-n", score: QUARTER_SCORE },
    { id: "0-low", score: 0.1 },
  ],
  approximateMatches: [
    { id: "node-a", score: 0.9 },
    { id: "node-b", score: 0.7 },
  ],
  links: [
    { id: "z-link-t3b", source: "node-x", target: "node-y2", recordedAt: MARCH },
    { id: "y-link-t3a", source: "node-x", target: "node-y1", recordedAt: MARCH },
    { id: "b-link-old", source: "node-x", target: "node-y3", recordedAt: JANUARY },
    { id: "link-mixed", source: "node-a", target: "node-x", recordedAt: APRIL },
    { id: "link-a1", source: "node-a", target: "node-c" },
    { id: "link-b1", source: "node-b", target: "node-d" },
  ],
  fragment: { id: "m-fragment", score: QUARTER_SCORE, createdAt: FEBRUARY },
};

const EVERY_RANKING_KEY_ORDER = [
  "node-x",
  "link-mixed",
  "y-link-t3a",
  "z-link-t3b",
  "m-fragment",
  "b-link-old",
  "a-node-n",
  "0-low",
  "node-a",
  "node-b",
  "link-a1",
  "link-b1",
];

describe("searchKnowledgeService ranking: the whole order of a result set", () => {
  it("orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending", async () => {
    const body = await searchOver(EVERY_RANKING_KEY_WORLD);

    expect(idsInOrder(body)).toEqual(EVERY_RANKING_KEY_ORDER);
  });
});

describe("searchKnowledgeService ranking: how a knowledge node was matched", () => {
  it("answers a node reached by the lexical parse of the query with the match exact and a node reached by the trigram similarity of an alias with the match approximate", async () => {
    const world: World = {
      matches: [{ id: "node-exact", score: 0.6 }],
      approximateMatches: [{ id: "node-approximate", score: 0.7 }],
    };

    const body = await searchOver(world);

    expect(
      Object.fromEntries(body.items.map((item) => [item.id, item.match]))
    ).toEqual({ "node-exact": "exact", "node-approximate": "approximate" });
  });
});

const DECLARED_ITEM_KEYS = [
  "kind",
  "layer",
  "id",
  "score",
  "hop",
  "summary",
  "flags",
  "provenance",
  "match",
  "similarity",
];

describe("searchKnowledgeService ranking: the search item's attributes", () => {
  it("answers a node, a link and a fragment item with no attribute the search item does not declare", async () => {
    const world: World = {
      matches: [{ id: "node-x", score: 0.5 }],
      approximateMatches: [{ id: "node-a", score: 0.9 }],
      links: [
        { id: "link-1", source: "node-x", target: "node-y" },
        { id: "link-2", source: "node-a", target: "node-b" },
      ],
      fragment: { id: "fragment-1", score: 0.3, createdAt: DEFAULT_RECORDED_AT },
    };

    const body = await searchOver(world);

    expect(
      body.items
        .map((item) => ({
          id: item.id,
          undeclared: Object.keys(item).filter(
            (key) => !DECLARED_ITEM_KEYS.includes(key)
          ),
        }))
        .sort((a, b) => (a.id < b.id ? -1 : 1))
    ).toEqual([
      { id: "fragment-1", undeclared: [] },
      { id: "link-1", undeclared: [] },
      { id: "link-2", undeclared: [] },
      { id: "node-a", undeclared: [] },
      { id: "node-x", undeclared: [] },
    ]);
  });
});
