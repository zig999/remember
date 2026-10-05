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

const EXPAND_DEPTH = 3;
const RESULT_LIMIT = 100;
const FIRST_MATCH_SCORE = 0.8;
const SECOND_MATCH_SCORE = 0.4;
const RECORDED_AT = new Date("2026-06-11T18:30:00Z");

interface Match {
  readonly id: string;
  readonly score: number;
}

interface GraphLink {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly status?: string;
  readonly confidence?: number;
}

interface World {
  readonly matches: readonly Match[];
  readonly approximateMatches?: readonly Match[];
  readonly links: readonly GraphLink[];
  readonly fragmentId?: string;
  readonly supporters?: Readonly<Record<string, readonly string[]>>;
}

interface Rows {
  rows: unknown[];
  rowCount: number;
}

const CHAIN_FROM_A: readonly GraphLink[] = [
  { id: "link-1", source: "node-a", target: "node-b" },
  { id: "link-2", source: "node-b", target: "node-c" },
  { id: "link-3", source: "node-c", target: "node-d" },
];

const CHAIN_FROM_X: readonly GraphLink[] = [
  { id: "link-x1", source: "node-x", target: "node-y" },
  { id: "link-x2", source: "node-y", target: "node-z" },
  { id: "link-x3", source: "node-z", target: "node-w" },
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
    status: link.status ?? "active",
    confidence: link.confidence ?? 0.9,
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
    status: link.status ?? "active",
  };
}

function provenanceRow(anchorId: string, fragmentId: string): unknown {
  return {
    anchor_id: anchorId,
    fragment_id: fragmentId,
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

function nodeHitRow(m: Match): unknown {
  return {
    node_id: m.id,
    canonical_name: `Name ${m.id}`,
    status: "active",
    score: m.score,
    matched_alias_ids: [],
  };
}

const APPROXIMATE_SIMILARITY = 0.8;

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
  const matched = [...world.matches, ...(world.approximateMatches ?? [])];
  const ids = new Set<string>(matched.map((m) => m.id));
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
    return result((world.approximateMatches ?? []).map(approximateHitRow));
  }
  if (sql.includes("FROM node_alias na")) {
    return result(world.matches.map(nodeHitRow));
  }
  if (
    sql.includes("FROM information_fragment f") &&
    sql.includes("f.status = 'accepted'")
  ) {
    if (world.fragmentId === undefined) return result([]);
    return result([
      {
        id: world.fragmentId,
        text: "texto de fragmento",
        confidence: 0.92,
        status: "accepted",
        created_at: RECORDED_AT,
        score: 0.5,
      },
    ]);
  }
  return undefined;
}

function provenanceRowsFor(
  world: World,
  anchorIds: readonly string[],
  defaultSupporter: (anchorId: string) => string
): Rows {
  return result(
    anchorIds.flatMap((anchorId) =>
      (world.supporters?.[anchorId] ?? [defaultSupporter(anchorId)]).map(
        (fragmentId) => provenanceRow(anchorId, fragmentId)
      )
    )
  );
}

function respondToProvenance(
  world: World,
  sql: string,
  params: readonly unknown[]
): Rows | undefined {
  const own = (anchorId: string): string => anchorId;
  const invented = (anchorId: string): string => `fragment-for-${anchorId}`;
  if (sql.includes("WHERE f.id = ANY")) {
    return provenanceRowsFor(world, asIds(params[0]), own);
  }
  if (sql.includes("plainto_tsquery")) {
    return provenanceRowsFor(world, asIds(params[1]), invented);
  }
  if (sql.includes("FROM provenance p") && sql.includes("AS anchor_id")) {
    return provenanceRowsFor(world, asIds(params[0]), invented);
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
    respondToProvenance(world, sql, params) ??
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

function linkItems(body: SearchResponse): SearchResponse["items"] {
  return body.items.filter((item) => item.kind === "link");
}

function linkItem(body: SearchResponse, id: string): SearchResponse["items"][number] {
  const found = linkItems(body).find((item) => item.id === id);
  if (found === undefined) {
    throw new Error(`no link item ${id} in the search response`);
  }
  return found;
}

describe("searchKnowledgeService expansion: decayed score of an expanded link", () => {
  it.each<[string, string, number]>([
    [
      "scores a link reached at hop 1 from a matched node at 0.5 times the matched node's score",
      "link-1",
      0.4,
    ],
    [
      "scores a link reached at hop 2 from a matched node, neither endpoint being matched, at 0.25 times the matched node's score",
      "link-2",
      0.2,
    ],
    [
      "scores a link reached at hop 3 from a matched node, neither endpoint being matched, at 0.125 times the matched node's score",
      "link-3",
      0.1,
    ],
  ])("%s", async (_name, linkId, expectedScore) => {
    const world: World = {
      matches: [{ id: "node-a", score: FIRST_MATCH_SCORE }],
      links: CHAIN_FROM_A,
    };

    const body = await searchOver(world);

    expect(linkItem(body, linkId).score).toBeCloseTo(expectedScore, 10);
  });

  it("scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is", async () => {
    const world: World = {
      matches: [
        { id: "node-a", score: FIRST_MATCH_SCORE },
        { id: "node-x", score: SECOND_MATCH_SCORE },
      ],
      links: [...CHAIN_FROM_A, ...CHAIN_FROM_X],
    };

    const body = await searchOver(world);

    const scoreByLink = Object.fromEntries(
      linkItems(body).map((item) => [item.id, Number(item.score.toFixed(6))])
    );
    expect(scoreByLink).toEqual({
      "link-1": 0.4,
      "link-2": 0.2,
      "link-3": 0.1,
      "link-x1": 0.2,
      "link-x2": 0.1,
      "link-x3": 0.05,
    });
  });
});

const TARGET_END_CHAIN: readonly GraphLink[] = [
  { id: "link-t1", source: "node-b", target: "node-a" },
  { id: "link-t2", source: "node-c", target: "node-b" },
];

const OUTGOING_THEN_INCOMING: readonly GraphLink[] = [
  { id: "link-s1", source: "node-a", target: "node-b" },
  { id: "link-s2", source: "node-c", target: "node-b" },
];

const INCOMING_THEN_OUTGOING: readonly GraphLink[] = [
  { id: "link-s1", source: "node-b", target: "node-a" },
  { id: "link-s2", source: "node-b", target: "node-c" },
];

function scoresOf(
  body: SearchResponse,
  ids: readonly string[]
): Record<string, number> {
  return Object.fromEntries(
    ids.map((id) => [id, Number(linkItem(body, id).score.toFixed(6))])
  );
}

describe("searchKnowledgeService expansion: decayed score of a link reached through its target end", () => {
  it("scores a link whose target is the matched node at 0.5 times its score at hop 1, and the link beyond it walked the same way at 0.25 times at hop 2", async () => {
    const world: World = {
      matches: [{ id: "node-a", score: FIRST_MATCH_SCORE }],
      links: TARGET_END_CHAIN,
    };

    const body = await searchOver(world);

    expect(scoresOf(body, ["link-t1", "link-t2"])).toEqual({
      "link-t1": 0.4,
      "link-t2": 0.2,
    });
  });

  it.each<[string, readonly GraphLink[]]>([
    [
      "an outgoing link followed by an incoming one",
      OUTGOING_THEN_INCOMING,
    ],
    [
      "an incoming link followed by an outgoing one",
      INCOMING_THEN_OUTGOING,
    ],
  ])(
    "scores the link after a change of walking direction at 0.25 times the matched node's score at hop 2: %s",
    async (_name, links) => {
      const world: World = {
        matches: [{ id: "node-a", score: FIRST_MATCH_SCORE }],
        links,
      };

      const body = await searchOver(world);

      expect(scoresOf(body, ["link-s1", "link-s2"])).toEqual({
        "link-s1": 0.4,
        "link-s2": 0.2,
      });
    }
  );
});

describe("searchKnowledgeService expansion: the item's hop", () => {
  it("numbers an expanded link by the links on its path from the matched node, so a link touching the matched node is hop 1 in either direction", async () => {
    const world: World = {
      matches: [{ id: "node-a", score: FIRST_MATCH_SCORE }],
      links: [
        { id: "link-in", source: "node-e", target: "node-a" },
        { id: "link-1", source: "node-a", target: "node-b" },
        { id: "link-2", source: "node-c", target: "node-b" },
        { id: "link-3", source: "node-c", target: "node-d" },
      ],
    };

    const body = await searchOver(world);

    const hopByLink = Object.fromEntries(
      linkItems(body).map((item) => [item.id, item.hop])
    );
    expect(hopByLink).toEqual({
      "link-in": 1,
      "link-1": 1,
      "link-2": 2,
      "link-3": 3,
    });
  });
});

describe("searchKnowledgeService expansion: the search item's shape", () => {
  it("answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment", async () => {
    const world: World = {
      matches: [{ id: "node-a", score: FIRST_MATCH_SCORE }],
      links: [{ id: "link-1", source: "node-a", target: "node-b" }],
      fragmentId: "fragment-1",
    };

    const body = await searchOver(world);

    expect(body.items.map((item) => item.kind).sort()).toEqual([
      "fragment",
      "link",
      "node",
    ]);
    for (const item of body.items) {
      expect(item).toEqual(
        expect.objectContaining({
          kind: expect.stringMatching(/^(node|link|fragment)$/),
          layer: expect.stringMatching(/^(fragment|node|chunk)$/),
          score: expect.any(Number),
          hop: expect.any(Number),
          summary: expect.any(String),
          flags: expect.any(Array),
          provenance: expect.any(Array),
        })
      );
      expect(item.provenance.length).toBeGreaterThanOrEqual(1);
    }
  });
});

const UNCERTAIN_BAND_CONFIDENCE = 0.6;

const SUPPORTING_FRAGMENTS: Readonly<Record<string, readonly string[]>> = {
  "node-a": ["fragment-a1", "fragment-a2"],
  "node-x": ["fragment-x1"],
  "link-1": ["fragment-l1"],
  "link-x1": ["fragment-lx1"],
  "fragment-1": ["fragment-1"],
};

describe("searchKnowledgeService: the flags of a search item", () => {
  it("answers a link whose confidence is in the uncertain band with the uncertain flag and no other", async () => {
    const world: World = {
      matches: [{ id: "node-a", score: FIRST_MATCH_SCORE }],
      links: [
        {
          id: "link-u",
          source: "node-a",
          target: "node-b",
          status: "uncertain",
          confidence: UNCERTAIN_BAND_CONFIDENCE,
        },
      ],
    };

    const body = await searchOver(world);

    expect(linkItem(body, "link-u").flags).toEqual(["uncertain"]);
  });
});

describe("searchKnowledgeService: the provenance entries of a search item", () => {
  it("names, in every entry of a node, a link and a fragment item, only fragments that support that very item", async () => {
    const world: World = {
      matches: [
        { id: "node-a", score: FIRST_MATCH_SCORE },
        { id: "node-x", score: SECOND_MATCH_SCORE },
      ],
      links: [
        { id: "link-1", source: "node-a", target: "node-b" },
        { id: "link-x1", source: "node-x", target: "node-y" },
      ],
      fragmentId: "fragment-1",
      supporters: SUPPORTING_FRAGMENTS,
    };

    const body = await searchOver(world);

    const unsupportedByItem = Object.fromEntries(
      body.items.map((item) => [
        item.id,
        item.provenance
          .map((entry) => entry.fragment_id)
          .filter((id) => !(SUPPORTING_FRAGMENTS[item.id] ?? []).includes(id)),
      ])
    );
    expect(unsupportedByItem).toEqual({
      "node-a": [],
      "node-x": [],
      "link-1": [],
      "link-x1": [],
      "fragment-1": [],
    });
  });
});

describe("searchKnowledgeService: a matched node no fragment supports", () => {
  it("answers no item with an empty provenance", async () => {
    const world: World = {
      matches: [{ id: "node-a", score: FIRST_MATCH_SCORE }],
      links: [],
      supporters: { "node-a": [] },
    };

    const body = await searchOver(world);

    const itemsWithoutProvenance = body.items
      .filter((item) => item.provenance.length === 0)
      .map((item) => item.id);
    expect(itemsWithoutProvenance).toEqual([]);
  });
});

const APPROXIMATE_MATCH_SCORE = 0.72;

describe("searchKnowledgeService expansion: a knowledge node matched approximately", () => {
  it("expands from it like any matched node, scoring a link at hop h at 0.5 raised to h times the score of the matched node it was reached from, whether that node was matched exactly or approximately", async () => {
    const world: World = {
      matches: [{ id: "node-x", score: SECOND_MATCH_SCORE }],
      approximateMatches: [{ id: "node-a", score: APPROXIMATE_MATCH_SCORE }],
      links: [...CHAIN_FROM_A, ...CHAIN_FROM_X],
    };

    const body = await searchOver(world);

    expect(
      scoresOf(body, ["link-1", "link-2", "link-3", "link-x1", "link-x2", "link-x3"])
    ).toEqual({
      "link-1": 0.36,
      "link-2": 0.18,
      "link-3": 0.09,
      "link-x1": 0.2,
      "link-x2": 0.1,
      "link-x3": 0.05,
    });
  });
});

const MATCHED_AND_EXPANDED_WORLD: World = {
  matches: [{ id: "node-x", score: SECOND_MATCH_SCORE }],
  approximateMatches: [{ id: "node-a", score: APPROXIMATE_MATCH_SCORE }],
  links: [
    { id: "link-1", source: "node-a", target: "node-b" },
    { id: "link-x1", source: "node-x", target: "node-y" },
  ],
  fragmentId: "fragment-1",
};

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

describe("searchKnowledgeService: the items that are neither a knowledge node", () => {
  it("answers every knowledge link reached by expansion, from an exactly or an approximately matched node, and every information fragment with no match and no similarity", async () => {
    const body = await searchOver(MATCHED_AND_EXPANDED_WORLD);

    expect(itemsThatAreNotNodes(body)).toEqual([
      { kind: "fragment", id: "fragment-1" },
      { kind: "link", id: "link-1" },
      { kind: "link", id: "link-x1" },
    ]);
  });
});
