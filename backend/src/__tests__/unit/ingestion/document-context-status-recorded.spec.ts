import { expect, it } from "vitest";

import type { DocumentContextStatus } from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  CONTENT_LIMIT_UNITS,
  ONE_CHUNK,
  SEVERAL_CHUNKS,
  astralContentOfUnits,
  contentOfUnits,
  statusRecordedOnRun,
  type RunShape,
} from "./document-context-status-recorded-world.js";

const FIRST_READING_VERSION = "v5";
const LATER_VERSION = "v6";
const OVER_LIMIT_UNITS = CONTENT_LIMIT_UNITS + 1;
const SHORT_CONTENT_UNITS = 100;

it("records single-chunk on the run when the stored raw information holds one chunk longer than 100000 UTF-16 code units", async () => {
  const shape: RunShape = {
    chunkCount: ONE_CHUNK,
    content: contentOfUnits(OVER_LIMIT_UNITS),
  };

  const recorded = await statusRecordedOnRun(FIRST_READING_VERSION, shape);

  expect(recorded).toBe("single-chunk");
});

it("records single-chunk on the run when the stored raw information holds one chunk within 100000 UTF-16 code units", async () => {
  const shape: RunShape = {
    chunkCount: ONE_CHUNK,
    content: contentOfUnits(SHORT_CONTENT_UNITS),
  };

  const recorded = await statusRecordedOnRun(FIRST_READING_VERSION, shape);

  expect(recorded).toBe("single-chunk");
});

it("records too-long on the run when the stored raw information holds several chunks whose content exceeds 100000 UTF-16 code units", async () => {
  const shape: RunShape = {
    chunkCount: SEVERAL_CHUNKS,
    content: contentOfUnits(OVER_LIMIT_UNITS),
  };

  const recorded = await statusRecordedOnRun(FIRST_READING_VERSION, shape);

  expect(recorded).toBe("too-long");
});

it("records failed on the run when the stored raw information holds several chunks within 100000 UTF-16 code units and the preliminary reading fails", async () => {
  const shape: RunShape = {
    chunkCount: SEVERAL_CHUNKS,
    content: contentOfUnits(SHORT_CONTENT_UNITS),
    readingFails: true,
  };

  const recorded = await statusRecordedOnRun(FIRST_READING_VERSION, shape);

  expect(recorded).toBe("failed");
});

it("records produced on the run when the stored raw information holds several chunks of exactly 100000 UTF-16 code units and the preliminary reading yields a document context", async () => {
  const shape: RunShape = {
    chunkCount: SEVERAL_CHUNKS,
    content: contentOfUnits(CONTENT_LIMIT_UNITS),
  };

  const recorded = await statusRecordedOnRun(FIRST_READING_VERSION, shape);

  expect(recorded).toBe("produced");
});

const SHAPES: Record<string, RunShape> = {
  oneChunkShort: {
    chunkCount: ONE_CHUNK,
    content: contentOfUnits(SHORT_CONTENT_UNITS),
  },
  oneChunkPastTheLimit: {
    chunkCount: ONE_CHUNK,
    content: contentOfUnits(OVER_LIMIT_UNITS),
  },
  severalChunksOneUnitPastTheLimit: {
    chunkCount: SEVERAL_CHUNKS,
    content: contentOfUnits(OVER_LIMIT_UNITS),
  },
  severalChunksPastTheLimitInUnitsButWithinItInCodePoints: {
    chunkCount: SEVERAL_CHUNKS,
    content: astralContentOfUnits(OVER_LIMIT_UNITS),
  },
  severalChunksReadingFails: {
    chunkCount: SEVERAL_CHUNKS,
    content: contentOfUnits(SHORT_CONTENT_UNITS),
    readingFails: true,
  },
  severalChunksReadingYieldsContext: {
    chunkCount: SEVERAL_CHUNKS,
    content: contentOfUnits(CONTENT_LIMIT_UNITS),
  },
};

const WANTED_STATUS: Record<string, DocumentContextStatus> = {
  oneChunkShort: "single-chunk",
  oneChunkPastTheLimit: "single-chunk",
  severalChunksOneUnitPastTheLimit: "too-long",
  severalChunksPastTheLimitInUnitsButWithinItInCodePoints: "too-long",
  severalChunksReadingFails: "failed",
  severalChunksReadingYieldsContext: "produced",
};

async function statusesUnder(
  promptVersion: string
): Promise<Record<string, DocumentContextStatus | null>> {
  const statuses: Record<string, DocumentContextStatus | null> = {};
  for (const [name, shape] of Object.entries(SHAPES)) {
    statuses[name] = await statusRecordedOnRun(promptVersion, shape);
  }
  return statuses;
}

it("records each of the four document context statuses by chunk count, content length in UTF-16 code units and reading outcome under v5 and under a later prompt version", async () => {
  const wanted = {
    [FIRST_READING_VERSION]: WANTED_STATUS,
    [LATER_VERSION]: WANTED_STATUS,
  };

  const observed = {
    [FIRST_READING_VERSION]: await statusesUnder(FIRST_READING_VERSION),
    [LATER_VERSION]: await statusesUnder(LATER_VERSION),
  };

  expect(observed).toEqual(wanted);
});
