import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import { searchNodeAliasApproximateLayer } from "../../../modules/query-retrieval/repository/search.repository.js";

const UNWEIGHTED_SIMILARITY_COLUMN =
  /max\(word_similarity\(na\.alias_norm,\s*norm\(\$1::text\)\)\)\s+AS\s+similarity\b/;

function buildCapturingClient(): { client: PoolClient; captured: string[] } {
  const captured: string[] = [];
  const client = {
    query: async (sql: string | { text: string }) => {
      captured.push(typeof sql === "string" ? sql : sql.text);
      return { rows: [], rowCount: 0 };
    },
  } as unknown as PoolClient;
  return { client, captured };
}

describe("searchNodeAliasApproximateLayer SQL contract", () => {
  it("selects the similarity as the highest word similarity of the node's aliases to the normalized query, with no layer weight applied", async () => {
    const { client, captured } = buildCapturingClient();

    await searchNodeAliasApproximateLayer(client, {
      query: "Petrobrass",
      limit: 10,
      excludedNodeIds: [],
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatch(UNWEIGHTED_SIMILARITY_COLUMN);
  });
});
