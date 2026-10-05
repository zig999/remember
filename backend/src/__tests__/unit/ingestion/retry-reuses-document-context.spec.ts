import { expect, it } from "vitest";

import {
  DocumentContextStatusSchema,
  type DocumentContextStatus,
} from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  DOCUMENT_CONTEXT,
  type HeldDocumentContext,
} from "./run-document-context-fixture.js";
import {
  chunkCalls,
  extractRun,
  failedRunWorld,
  readingCalls,
  retryRun,
  type ModelCall,
  type RetriedRunWorld,
} from "./retried-run-world.js";

type HeldStatus = DocumentContextStatus | null;

const HOLDS_PRODUCED: HeldDocumentContext = {
  status: "produced",
  context: DOCUMENT_CONTEXT,
};
const HOLDS_FAILED_NONE: HeldDocumentContext = { status: "failed", context: null };
const CHUNKS_IN_THE_RAW_INFORMATION = 3;

const EVERY_HELD_STATUS: readonly (readonly [string, HeldStatus])[] = [
  ["produced", "produced"],
  ["single-chunk", "single-chunk"],
  ["too-long", "too-long"],
  ["failed", "failed"],
  ["none", null],
];

function contextHeldWith(status: HeldStatus): HeldDocumentContext {
  return { status, context: status === "produced" ? DOCUMENT_CONTEXT : null };
}

function statusOf(world: RetriedRunWorld): HeldStatus {
  return DocumentContextStatusSchema.nullable().parse(
    world.run["document_context_status"]
  );
}

function showsHeldContext(call: ModelCall): boolean {
  const names = DOCUMENT_CONTEXT.entities.flatMap((entity) => entity.names);
  return [DOCUMENT_CONTEXT.summary, ...names].every((needle) =>
    call.text.includes(needle)
  );
}

it("leaves the document context recorded when a failed run holding one is retried", async () => {
  const world = failedRunWorld(HOLDS_PRODUCED);

  await retryRun(world);

  expect(world.run["document_context"]).toEqual(DOCUMENT_CONTEXT);
});

it("leaves the document context status as it was when a failed run is retried, whichever status it held", async () => {
  const kept: Record<string, HeldStatus> = {};

  for (const [label, status] of EVERY_HELD_STATUS) {
    const world = failedRunWorld(contextHeldWith(status));
    await retryRun(world);
    kept[label] = statusOf(world);
  }

  expect(kept).toEqual({
    produced: "produced",
    "single-chunk": "single-chunk",
    "too-long": "too-long",
    failed: "failed",
    none: null,
  });
});

it("makes no preliminary reading and shows each chunk the context the run held when a retried run holding a document context is extracted again", async () => {
  const world = failedRunWorld(HOLDS_PRODUCED);
  await retryRun(world);

  await extractRun(world);

  expect({
    readings: readingCalls(world).length,
    chunksRead: chunkCalls(world).length,
    chunksShownTheHeldContext: chunkCalls(world).map(showsHeldContext),
  }).toEqual({
    readings: 0,
    chunksRead: CHUNKS_IN_THE_RAW_INFORMATION,
    chunksShownTheHeldContext: [true, true, true],
  });
});

it("leaves the document context status as it was after a retried run holding a document context is extracted again, whichever status it held", async () => {
  const kept: Record<string, HeldStatus> = {};

  for (const [label, status] of EVERY_HELD_STATUS) {
    const world = failedRunWorld({ status, context: DOCUMENT_CONTEXT });
    await retryRun(world);
    await extractRun(world);
    kept[label] = statusOf(world);
  }

  expect(kept).toEqual({
    produced: "produced",
    "single-chunk": "single-chunk",
    "too-long": "too-long",
    failed: "failed",
    none: null,
  });
});

it("makes a preliminary reading when a retried run whose document context status is failed is extracted again", async () => {
  const world = failedRunWorld(HOLDS_FAILED_NONE);
  await retryRun(world);

  await extractRun(world);

  expect(readingCalls(world)).toHaveLength(1);
});

it("records the status produced when the preliminary reading made for a retried run whose status was failed yields a document context", async () => {
  const world = failedRunWorld(HOLDS_FAILED_NONE);
  await retryRun(world);

  await extractRun(world);

  expect(world.run["document_context_status"]).toBe("produced");
});
