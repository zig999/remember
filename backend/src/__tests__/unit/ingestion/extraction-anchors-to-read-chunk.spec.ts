import { beforeEach, describe, expect, it, vi } from "vitest";
import pino from "pino";
import type { Pool } from "pg";

const { proposeFragmentHandlerMock } = vi.hoisted(() => ({
  proposeFragmentHandlerMock: vi.fn(),
}));

vi.mock("../../../modules/ingestion/mcp/propose-fragment.handler.js", () => ({
  proposeFragmentHandler: proposeFragmentHandlerMock,
}));

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { __testing__ } from "../../../modules/ingestion/service/extraction.service.js";

const READ_CHUNK_ID = "22222222-2222-4222-8222-222222222222";
const SAME_RAW_OTHER_CHUNK_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_RAW_CHUNK_ID = "99999999-9999-4999-8999-999999999999";
const FRAGMENT_TEXT = "Alice leads the project.";
const FRAGMENT_CONFIDENCE = 0.9;

type DispatchDeps = Parameters<typeof __testing__.dispatchToolUse>[2];

function buildDeps(): DispatchDeps {
  return {
    pool: {} as unknown as Pool,
    logger: pino({ level: "silent" }),
    llm_run_id: "44444444-4444-4444-8444-444444444444",
    catalog: buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    }),
    now: () => new Date("2026-06-11T20:00:00Z"),
  };
}

async function proposeWhileReadingChunk(
  rawInput: Record<string, unknown>
): Promise<readonly string[]> {
  await __testing__.dispatchToolUse(
    "propose_fragment",
    rawInput,
    buildDeps(),
    READ_CHUNK_ID
  );
  const handed = proposeFragmentHandlerMock.mock.calls.at(-1)?.[0] as
    | { chunk_ids: readonly string[] }
    | undefined;
  return handed?.chunk_ids ?? [];
}

describe("extraction anchors a proposed fragment to the chunk being read", () => {
  beforeEach(() => {
    proposeFragmentHandlerMock.mockReset();
    proposeFragmentHandlerMock.mockResolvedValue({
      ok: true,
      result: { fragment_id: "fragment-1", status: "proposed" },
    });
  });

  it("anchors each of two fragments to the chunk being read alone, whether the model names that chunk and another of the same raw information or only a chunk of a different raw information", async () => {
    const namesReadAndNextChunk = {
      text: FRAGMENT_TEXT,
      confidence: FRAGMENT_CONFIDENCE,
      chunk_ids: [READ_CHUNK_ID, SAME_RAW_OTHER_CHUNK_ID],
    };
    const namesOtherRawChunk = {
      text: FRAGMENT_TEXT,
      confidence: FRAGMENT_CONFIDENCE,
      chunk_ids: [OTHER_RAW_CHUNK_ID],
    };

    const first = await proposeWhileReadingChunk(namesReadAndNextChunk);
    const second = await proposeWhileReadingChunk(namesOtherRawChunk);

    expect([first, second]).toEqual([[READ_CHUNK_ID], [READ_CHUNK_ID]]);
  });

  it("anchors a fragment that names only another chunk of the same raw information to the chunk being read", async () => {
    const namesOnlyAnotherChunk = {
      text: FRAGMENT_TEXT,
      confidence: FRAGMENT_CONFIDENCE,
      chunk_ids: [SAME_RAW_OTHER_CHUNK_ID],
    };

    const anchored = await proposeWhileReadingChunk(namesOnlyAnotherChunk);

    expect(anchored).toEqual([READ_CHUNK_ID]);
  });

  it("anchors a fragment that names no chunk to the chunk being read", async () => {
    const namesNoChunk = {
      text: FRAGMENT_TEXT,
      confidence: FRAGMENT_CONFIDENCE,
    };

    const anchored = await proposeWhileReadingChunk(namesNoChunk);

    expect(anchored).toEqual([READ_CHUNK_ID]);
  });
});
