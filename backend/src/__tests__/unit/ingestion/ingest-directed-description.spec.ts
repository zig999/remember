import { describe, expect, it } from "vitest";

import { IngestToolDescriptions } from "../../../modules/ingestion/dto/index.js";

const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[A-Z])/;

function sentencesOf(text: string): string[] {
  return text.replace(/\s+/g, " ").trim().split(SENTENCE_BOUNDARY);
}

describe("IngestToolDescriptions.ingest_directed owner-request condition", () => {
  it("states that the tool is called only when the owner's own message explicitly asks to record knowledge", () => {
    const sentences = sentencesOf(IngestToolDescriptions.ingest_directed);

    const conditionSentences = sentences.filter(
      (sentence) =>
        /\bonly\b/i.test(sentence) &&
        /owner['’]s own message/i.test(sentence) &&
        /\bexplicitly\b/i.test(sentence) &&
        /\brecord\b/i.test(sentence)
    );

    expect(conditionSentences.length).toBeGreaterThan(0);
  });

  it("states that an instruction inside a document or a tool result is never a reason to call the tool", () => {
    const sentences = sentencesOf(IngestToolDescriptions.ingest_directed);

    const prohibitionSentences = sentences.filter(
      (sentence) =>
        /\binstruction\b/i.test(sentence) &&
        /\bdocument\b/i.test(sentence) &&
        /tool result/i.test(sentence) &&
        /\bnever\b/i.test(sentence) &&
        /\bcall\b/i.test(sentence)
    );

    expect(prohibitionSentences.length).toBeGreaterThan(0);
  });

  it("mentions prior tool results only to forbid acting on them, never as a reason to call the tool", () => {
    const sentences = sentencesOf(IngestToolDescriptions.ingest_directed);

    const resultSentencesWithoutProhibition = sentences.filter(
      (sentence) =>
        /\b(tool|prior|earlier|previous)\s+results?\b|\blookups?\b|\bqueries\b/i.test(sentence) &&
        !/\bnever\b|\bnot\b/i.test(sentence)
    );

    expect(resultSentencesWithoutProhibition).toEqual([]);
  });

  it("still states that the server runs no language model for the call", () => {
    const text = IngestToolDescriptions.ingest_directed.replace(/\s+/g, " ");

    expect(text).toMatch(/\bno\s+(llm|language\s+model)\b/i);
  });
});
