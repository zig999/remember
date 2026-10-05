import type { ZodType } from "zod";
import { describe, expect, it } from "vitest";

import {
  DocumentContextSchema,
  DocumentContextStatusSchema,
  DocumentEntitySchema,
} from "../../../modules/ingestion/dto/llm-run.dto.js";

const SUMMARY = "Ata da reuniao do comite sobre a renovacao do contrato.";
const MODEL = "claude-haiku-4-5";
const NAMES = ["Maria Souza", "M. Souza", "Maria"];
const ENTITY = { node_type: "Person", names: NAMES };

function refusedFields(schema: ZodType, input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
}

describe("the document context status enumeration the specification declares", () => {
  it("holds exactly produced, single-chunk, too-long and failed", () => {
    const declared = ["produced", "single-chunk", "too-long", "failed"];

    const members = [...DocumentContextStatusSchema.options].sort();

    expect(members).toEqual([...declared].sort());
  });
});

describe("a document context", () => {
  it("is refused when it lacks a summary", () => {
    const withoutSummary = { entities: [ENTITY], model: MODEL };

    const refused = refusedFields(DocumentContextSchema, withoutSummary);

    expect(refused).toEqual(["summary"]);
  });

  it("is refused when it lacks the model that produced it", () => {
    const withoutModel = { summary: SUMMARY, entities: [ENTITY] };

    const refused = refusedFields(DocumentContextSchema, withoutModel);

    expect(refused).toEqual(["model"]);
  });
});

describe("a document entity", () => {
  it("is refused when it lacks a node type", () => {
    const withoutNodeType = { names: NAMES };

    const refused = refusedFields(DocumentEntitySchema, withoutNodeType);

    expect(refused).toEqual(["node_type"]);
  });

  it("is refused when it carries no names at all", () => {
    const withoutNames = { node_type: "Person" };

    const refused = refusedFields(DocumentEntitySchema, withoutNames);

    expect(refused).toEqual(["names"]);
  });

  it("is refused when its names list is empty", () => {
    const withEmptyNames = { node_type: "Person", names: [] };

    const refused = refusedFields(DocumentEntitySchema, withEmptyNames);

    expect(refused).toEqual(["names"]);
  });
});
