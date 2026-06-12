// Unit tests for the searchKnowledge service — exercises the pipeline
// composition with a fake `PoolClient` so we can pin behaviour at the
// service-layer boundary without spinning up Postgres.
//
// Acceptance criteria covered (validation.criteria of dev_tc_006):
//   - Stopword-only query (empty parsed tsquery) -> InvalidSearchQueryError.
//   - expand=false does NOT invoke traverseNodes() — exercised via the
//     absence of any `fetchTraversalHop` SQL in the recorded query log.
//   - Dedup: a chunk hit anchored by a fragment hit collapses (the chunk
//     drops from the final list; the fragment surfaces with its provenance).
//   - Zero-result lexical query returns total=0 / items=[] / 200 (success path).

import { describe, expect, it } from "vitest";
import pino from "pino";

import { searchKnowledgeService } from "../../../modules/query-retrieval/service/search.service.js";
import { InvalidSearchQueryError } from "../../../modules/query-retrieval/service/errors.js";
import type { CatalogSnapshot } from "../../../modules/knowledge-graph/index.js";

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

interface QueryLog {
  sql: string;
  params: unknown[];
}

function buildFakeClient(
  responder: (sql: string, params: unknown[]) => { rows: unknown[]; rowCount: number }
): { client: import("pg").PoolClient; queries: QueryLog[] } {
  const queries: QueryLog[] = [];
  const client = {
    query: async (sql: string, params: unknown[] = []) => {
      queries.push({ sql: String(sql), params });
      return responder(String(sql), params);
    },
    release: () => {},
  } as unknown as import("pg").PoolClient;
  return { client, queries };
}

describe("searchKnowledgeService — BR-05 (parsed tsquery is empty)", () => {
  it("throws InvalidSearchQueryError when websearch_to_tsquery returns empty", async () => {
    // Stopword-only query "o a de" -> Postgres parses to empty.
    const { client } = buildFakeClient((sql) => {
      if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
        return { rows: [{ q: "" }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(
      searchKnowledgeService(
        client,
        emptyCatalog,
        {
          query: "o a de",
          inEffectOnly: false,
          includeUncertain: true,
          expand: false,
          expandDepth: 1,
          limit: 20,
          offset: 0,
        },
        silentLogger
      )
    ).rejects.toBeInstanceOf(InvalidSearchQueryError);
  });
});

describe("searchKnowledgeService — BR-13 (expand=false skips graph expansion)", () => {
  it("does NOT issue any traversal SQL when expand=false", async () => {
    const { client, queries } = buildFakeClient((sql) => {
      if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
        return { rows: [{ q: "'apollo'" }], rowCount: 1 };
      }
      // Every layer returns zero rows — we want to see whether any
      // `fetchTraversalHop` SQL fires regardless.
      return { rows: [], rowCount: 0 };
    });

    const body = await searchKnowledgeService(
      client,
      emptyCatalog,
      {
        query: "apollo",
        inEffectOnly: false,
        includeUncertain: true,
        expand: false,
        expandDepth: 1,
        limit: 20,
        offset: 0,
      },
      silentLogger
    );

    expect(body.total).toBe(0);
    expect(body.items).toEqual([]);
    // BR-13: the traversal SQL has a distinct shape — confirm none was issued.
    const usedTraversalSql = queries.some((q) =>
      q.sql.includes("FROM knowledge_link_resolved")
    );
    expect(usedTraversalSql).toBe(false);
  });
});

describe("searchKnowledgeService — BR-22 (zero results returns 200, not 422/404)", () => {
  it("returns total=0, items=[] for a syntactically valid query with no matches", async () => {
    const { client } = buildFakeClient((sql) => {
      if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
        return { rows: [{ q: "'iniciativa' & 'lunar'" }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    const body = await searchKnowledgeService(
      client,
      emptyCatalog,
      {
        query: "Iniciativa Lunar",
        inEffectOnly: false,
        includeUncertain: true,
        expand: true,
        expandDepth: 1,
        limit: 20,
        offset: 0,
      },
      silentLogger
    );

    expect(body.query).toBe("Iniciativa Lunar");
    expect(body.total).toBe(0);
    expect(body.items).toEqual([]);
    expect(body.limit).toBe(20);
    expect(body.offset).toBe(0);
  });
});

describe("searchKnowledgeService — BR-10 (dedup collapses chunk into fragment)", () => {
  it("removes a chunk hit when fragment_source proves a fragment hit anchors it", async () => {
    const fragmentId = "11111111-1111-1111-1111-111111111111";
    const chunkId = "22222222-2222-2222-2222-222222222222";
    const rawId = "33333333-3333-3333-3333-333333333333";

    const { client } = buildFakeClient((sql) => {
      if (sql.includes("websearch_to_tsquery") && sql.includes("AS q")) {
        return { rows: [{ q: "'apollo'" }], rowCount: 1 };
      }
      // Fragment layer — one fragment hit.
      if (sql.includes("FROM information_fragment f") && sql.includes("status = 'accepted'")) {
        return {
          rows: [
            {
              id: fragmentId,
              text: "Maria Oliveira coordena Apollo.",
              confidence: 0.92,
              status: "accepted",
              created_at: new Date("2026-06-11T18:30:00Z"),
              score: 0.85,
            },
          ],
          rowCount: 1,
        };
      }
      // Node layer — no hits (keeps the test focused on dedup).
      if (sql.includes("FROM node_alias na")) {
        return { rows: [], rowCount: 0 };
      }
      // Chunk layer — one chunk hit pointing at the SAME raw_information_id
      // as the fragment's provenance below.
      if (sql.includes("FROM raw_chunk rc")) {
        return {
          rows: [
            {
              id: chunkId,
              raw_information_id: rawId,
              chunk_index: 0,
              offset_start: 0,
              offset_end: 30,
              excerpt: "Maria Oliveira coordena Apollo",
              score: 0.42,
            },
          ],
          rowCount: 1,
        };
      }
      // fragment_source dedup join — confirms the chunk anchors the fragment.
      if (sql.includes("FROM fragment_source fs") && sql.includes("raw_chunk_id = ANY")) {
        return {
          rows: [{ fragment_id: fragmentId, raw_chunk_id: chunkId }],
          rowCount: 1,
        };
      }
      // Provenance lookup for fragments — one chunk row (the same one).
      if (sql.includes("JOIN fragment_source fs ON fs.fragment_id = f.id") && sql.includes("WHERE f.id = ANY")) {
        return {
          rows: [
            {
              anchor_id: fragmentId,
              fragment_id: fragmentId,
              fragment_text: "Maria Oliveira coordena Apollo.",
              fragment_confidence: 0.92,
              raw_chunk_id: chunkId,
              offset_start: 0,
              offset_end: 30,
              excerpt: "Maria Oliveira coordena Apollo",
              raw_information_id: rawId,
              source_type: "ata",
              received_at: new Date("2026-06-11T18:30:00Z"),
            },
          ],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    });

    const body = await searchKnowledgeService(
      client,
      emptyCatalog,
      {
        query: "Apollo",
        inEffectOnly: false,
        includeUncertain: true,
        expand: false,
        expandDepth: 1,
        limit: 20,
        offset: 0,
      },
      silentLogger
    );

    // The chunk MUST NOT appear as its own row.
    expect(body.items.some((it) => it.kind === "fragment")).toBe(true);
    expect(body.items.some((it) => it.id === chunkId)).toBe(false);
    // total counts the unique fragment row only.
    expect(body.total).toBe(1);
    // The fragment carries its provenance with the chunk excerpt.
    const fragmentItem = body.items.find((it) => it.kind === "fragment");
    expect(fragmentItem?.provenance.length).toBeGreaterThanOrEqual(1);
    expect(fragmentItem?.provenance[0]?.excerpt).toContain("Apollo");
  });
});
