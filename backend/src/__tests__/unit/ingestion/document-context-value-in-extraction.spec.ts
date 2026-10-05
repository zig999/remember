import { expect, it } from "vitest";

import {
  DocumentContextSchema,
  type DocumentContext,
  type DocumentEntity,
} from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  CHUNK_COUNT,
  CONTEXT_MODEL,
  chunkPrompts,
  extract,
  newWorld,
  readerModels,
  recordedContext,
  type ExtractionWorld,
} from "./document-context-extraction-world.js";

const SUMMARY_LINES: readonly string[] = [
  "LINE-A opens the minutes.",
  "LINE-B states the agenda.",
  "LINE-C records the vote.",
  "LINE-D lists the actions.",
  "LINE-E closes the meeting.",
  "LINE-F adds an annex.",
  "LINE-G adds a footnote.",
];
const FIRST_LINE = SUMMARY_LINES[0] ?? "";
const MARIA: DocumentEntity = {
  node_type: "Person",
  names: ["Maria Souza", "M. Souza", "Maria"],
};
const ACME: DocumentEntity = {
  node_type: "Organization",
  names: ["Acme Ltda", "Acme"],
};
const UNKNOWN_TYPE: DocumentEntity = { node_type: "Planet", names: ["Zork Prime"] };
const GHOST_NAME = "Ghost Person";
const GHOST: DocumentEntity = { node_type: "Person", names: [GHOST_NAME] };

const READ_STRINGS: readonly string[] = [
  ...SUMMARY_LINES,
  ...[MARIA, ACME, UNKNOWN_TYPE].flatMap((entity) => entity.names),
];
const SHOWN_WHOLE: readonly string[] = [
  FIRST_LINE,
  ...MARIA.names,
  ...ACME.names,
];
const KNOWLEDGE_TABLES: readonly string[] = [
  "knowledge_node",
  "node_alias",
  "knowledge_link",
  "node_attribute",
  "provenance",
];
const EVERY_CHUNK_TRUE: readonly boolean[] = Array.from(
  { length: CHUNK_COUNT },
  () => true
);

const EXPECTED = {
  incompleteContextRefused: {
    readingWithoutSummaryRecords: null,
    schemaAcceptsContextWithoutModel: false,
    schemaAcceptsContextWithoutSummary: false,
  },
  producedContextShownToEveryChunk: {
    chunksRead: CHUNK_COUNT,
    showsSummaryAndEntities: EVERY_CHUNK_TRUE,
  },
  recordedContextEqualsShownContext: {
    sameStringsInEveryChunk: EVERY_CHUNK_TRUE,
    recordedModel: CONTEXT_MODEL,
    readerModels: [CONTEXT_MODEL],
  },
  entityNoChunkMentions: {
    shownToEveryChunk: EVERY_CHUNK_TRUE,
    knowledgeWritesOrWritesNamingIt: [],
  },
};

async function extractedAfterReading(reading: object): Promise<ExtractionWorld> {
  const world = newWorld({ readingAnswer: JSON.stringify(reading) });
  await extract(world);
  return world;
}

function contextOf(world: ExtractionWorld): DocumentContext | null {
  return DocumentContextSchema.nullable().parse(recordedContext(world));
}

function shownStrings(prompt: string): string[] {
  return READ_STRINGS.filter((text) => prompt.includes(text));
}

function recordedStrings(context: DocumentContext | null): string[] {
  const lines = context?.summary.split("\n") ?? [];
  const names = context?.entities.flatMap((entity) => entity.names) ?? [];
  return READ_STRINGS.filter((text) => lines.includes(text) || names.includes(text));
}

function sameStringsInEveryChunk(world: ExtractionWorld): boolean[] {
  const recorded = recordedStrings(contextOf(world)).join("|");
  return chunkPrompts(world).map((prompt) => shownStrings(prompt).join("|") === recorded);
}

function showsSummaryAndEntities(world: ExtractionWorld): boolean[] {
  return chunkPrompts(world).map((prompt) =>
    SHOWN_WHOLE.every((text) => prompt.includes(text))
  );
}

function writesForTheEntity(world: ExtractionWorld): string[] {
  return world.writes
    .filter(
      (write) =>
        KNOWLEDGE_TABLES.includes(write.table) ||
        JSON.stringify(write.params).includes(GHOST_NAME)
    )
    .map((write) => write.table);
}

async function observeRefusal(): Promise<unknown> {
  const lacksSummary = await extractedAfterReading({ entities: [MARIA] });
  return {
    readingWithoutSummaryRecords: recordedContext(lacksSummary),
    schemaAcceptsContextWithoutModel: DocumentContextSchema.safeParse({
      summary: FIRST_LINE,
      entities: [],
    }).success,
    schemaAcceptsContextWithoutSummary: DocumentContextSchema.safeParse({
      entities: [],
      model: CONTEXT_MODEL,
    }).success,
  };
}

async function observeProducedContext(): Promise<unknown[]> {
  const produced = await extractedAfterReading({
    summary: SUMMARY_LINES.join("\n"),
    entities: [MARIA, ACME, UNKNOWN_TYPE],
  });
  return [
    {
      chunksRead: chunkPrompts(produced).length,
      showsSummaryAndEntities: showsSummaryAndEntities(produced),
    },
    {
      sameStringsInEveryChunk: sameStringsInEveryChunk(produced),
      recordedModel: contextOf(produced)?.model,
      readerModels: readerModels(produced),
    },
  ];
}

async function observeUnmentionedEntity(): Promise<unknown> {
  const unmentioned = await extractedAfterReading({
    summary: FIRST_LINE,
    entities: [GHOST],
  });
  return {
    shownToEveryChunk: chunkPrompts(unmentioned).map((prompt) =>
      prompt.includes(GHOST_NAME)
    ),
    knowledgeWritesOrWritesNamingIt: writesForTheEntity(unmentioned),
  };
}

async function observeTheContextInExtraction(): Promise<unknown> {
  const [shown, recorded] = await observeProducedContext();
  return {
    incompleteContextRefused: await observeRefusal(),
    producedContextShownToEveryChunk: shown,
    recordedContextEqualsShownContext: recorded,
    entityNoChunkMentions: await observeUnmentionedEntity(),
  };
}

it("refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions", async () => {
  const observed = await observeTheContextInExtraction();

  expect(observed).toEqual(EXPECTED);
});
