// TC-014 — JSON Schemas published by the MCP `tools/list` response match the
// JSON Schemas derived from the canonical Zod DTOs at module init (BR-24).
//
// Acceptance criteria addressed:
//   - "MCP tool propose_fragment input_schema matches the JSON Schema derived
//      from ProposeFragmentInputSchema (snapshot test)"
//   - "MCP tool propose_node input_schema matches the JSON Schema derived
//      from ProposeNodeInputSchema (snapshot test)"
//
// This test ensures a future change to a Zod DTO automatically propagates
// to the MCP wire format with no duplicated source — if the Zod schema and
// the MCP-published schema ever diverge, this test fails loudly.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  IngestToolInputJsonSchemas,
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
} from "../../../modules/ingestion/dto/index.js";

describe("Ingest MCP tool JSON Schemas (BR-24 / TC-014)", () => {
  it("exports a JSON Schema for each of the four propose-* tools", () => {
    expect(Object.keys(IngestToolInputJsonSchemas).sort()).toEqual([
      "propose_attribute",
      "propose_fragment",
      "propose_link",
      "propose_node",
    ]);
  });

  it("propose_fragment.input_schema is the JSON Schema of ProposeFragmentInputSchema", () => {
    // BR-24: the JSON Schema served over MCP is derived from the same Zod
    // source the service layer parses against. Re-deriving in the test and
    // comparing pins the contract — drift means a tool def in production
    // wouldn't match the validator.
    const reDerived = z.toJSONSchema(ProposeFragmentInputSchema);
    expect(IngestToolInputJsonSchemas.propose_fragment).toEqual(reDerived);
  });

  it("propose_node.input_schema is the JSON Schema of ProposeNodeInputSchema", () => {
    const reDerived = z.toJSONSchema(ProposeNodeInputSchema);
    expect(IngestToolInputJsonSchemas.propose_node).toEqual(reDerived);
  });

  it("propose_link.input_schema is the JSON Schema of ProposeLinkInputSchema", () => {
    const reDerived = z.toJSONSchema(ProposeLinkInputSchema);
    expect(IngestToolInputJsonSchemas.propose_link).toEqual(reDerived);
  });

  it("propose_attribute.input_schema is the JSON Schema of ProposeAttributeInputSchema", () => {
    const reDerived = z.toJSONSchema(ProposeAttributeInputSchema);
    expect(IngestToolInputJsonSchemas.propose_attribute).toEqual(reDerived);
  });

  it("all four JSON Schemas are object schemas (MCP tools require object inputs)", () => {
    // MCP tool inputs are objects (the SDK enforces this in `tools/call`).
    // We don't want a future refactor to accidentally surface a non-object
    // top-level schema.
    for (const [name, schema] of Object.entries(IngestToolInputJsonSchemas)) {
      expect((schema as { type?: string }).type, `tool ${name}`).toBe("object");
    }
  });
});
