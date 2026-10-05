import { expect, it } from "vitest";

import {
  DocumentContextSchema,
  type DocumentContext,
  type DocumentEntity,
} from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  CHUNK_COUNT,
  chunkPrompts,
  extract,
  newWorld,
  recordedContext,
  type ExtractionWorld,
} from "./document-context-extraction-world.js";

const PERSON: DocumentEntity = {
  node_type: "Person",
  names: ["Maria Souza", "M. Souza", "Maria"],
};
const UNKNOWN_TYPE_NAME = "Zork Prime";
const UNKNOWN_TYPE: DocumentEntity = {
  node_type: "Planet",
  names: [UNKNOWN_TYPE_NAME],
};
const HELD_CONTEXT: DocumentContext = {
  summary: "Ata do comite.",
  entities: [PERSON],
  model: "claude-haiku-4-5",
};
const SUMMARY = "Ata do comite.";

const MALFORMED_ENTITIES: Readonly<Record<string, object>> = {
  "an entity whose names list is empty": { node_type: "Person", names: [] },
  "an entity with no names": { node_type: "Person" },
  "an entity with no node type": { names: ["Maria Souza"] },
};

const EVERY_CHUNK_CARRIES_IT: readonly boolean[] = Array.from(
  { length: CHUNK_COUNT },
  () => true
);

const EXPECTED = {
  carriedToEveryChunk: EVERY_CHUNK_CARRIES_IT,
  refusedWithNothingRecorded: {
    "an entity whose names list is empty": null,
    "an entity with no names": null,
    "an entity with no node type": null,
  },
  entityOfAnUnknownNodeType: {
    recordedEntities: [PERSON],
    shownToAnyChunk: false,
  },
};

function carriesEntity(prompt: string, entity: DocumentEntity): boolean {
  const needles = [entity.node_type, ...entity.names];
  return prompt
    .split("\n")
    .some((line) => needles.every((needle) => line.includes(needle)));
}

async function extractedAfterReading(reading: object): Promise<ExtractionWorld> {
  const world = newWorld({ readingAnswer: JSON.stringify(reading) });
  await extract(world);
  return world;
}

async function observeHeldContext(): Promise<boolean[]> {
  const world = newWorld({ held: { status: "produced", context: HELD_CONTEXT } });
  await extract(world);
  return chunkPrompts(world).map((prompt) => carriesEntity(prompt, PERSON));
}

async function observeMalformedEntities(): Promise<Record<string, unknown>> {
  const recorded: Record<string, unknown> = {};
  for (const [label, entity] of Object.entries(MALFORMED_ENTITIES)) {
    const world = await extractedAfterReading({ summary: SUMMARY, entities: [entity] });
    recorded[label] = recordedContext(world);
  }
  return recorded;
}

async function observeUnknownNodeType(): Promise<unknown> {
  const world = await extractedAfterReading({
    summary: SUMMARY,
    entities: [PERSON, UNKNOWN_TYPE],
  });
  const context = DocumentContextSchema.nullable().parse(recordedContext(world));
  return {
    recordedEntities: context?.entities,
    shownToAnyChunk: chunkPrompts(world).some((prompt) =>
      prompt.includes(UNKNOWN_TYPE_NAME)
    ),
  };
}

async function observeTheEntityInExtraction(): Promise<unknown> {
  return {
    carriedToEveryChunk: await observeHeldContext(),
    refusedWithNothingRecorded: await observeMalformedEntities(),
    entityOfAnUnknownNodeType: await observeUnknownNodeType(),
  };
}

it("shows every chunk each entity of the document context with its node type and all its names, and records no context for an entity with no names, an empty names list or no node type", async () => {
  const observed = await observeTheEntityInExtraction();

  expect(observed).toEqual(EXPECTED);
});
