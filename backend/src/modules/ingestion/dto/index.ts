// Ingestion DTOs — single-source barrel for the `propose_*` tool contracts.
//
// BR-24 ("Tool schemas have a single source: the Zod DTOs"): the four Zod
// schemas below are derived into JSON Schema once, at module init. The
// resulting `*JsonSchema` objects are the single source consumed by:
//   1. MCP tool registration (`mcp/toolset.ts`) — passes them to the
//      transport-level tool def alongside the Zod schema used for runtime
//      validation.
//   2. The future REST mirror (TC-12) — Fastify `schema.body` config.
//   3. The future Anthropic tool-use call (extraction orchestrator, TC-12) —
//      `tools: [{ name, input_schema }]`.
//
// A change to a Zod schema automatically updates every consumer because all
// three sites derive from the same source.
//
// Spec divergence (documented in tc-009-delivery.md, §"Spec divergences"):
// BR-24 names the npm package `zod-to-json-schema` (v3.x) as the derivation
// tool. That package's introspection is built against Zod v3's internal AST;
// against Zod v4 (this project's pinned major) it produces empty `{}`
// definitions (verified by inspection). Zod v4 ships its own functional
// equivalent (`z.toJSONSchema(schema)`) that produces a JSON-Schema-2020-12
// document with all properties, types, and constraints. We use the built-in
// to satisfy BR-24's intent (single Zod source, JSON Schema available to
// every transport) — see the delivery report for the full rationale.

import { z } from "zod";

import {
  ProposeAttributeInputSchema,
  type ProposeAttributeInput,
  type ProposeAttributeResult,
} from "./propose-attribute.dto.js";
import {
  ProposeFragmentInputSchema,
  type ProposeFragmentInput,
  type ProposeFragmentResult,
} from "./propose-fragment.dto.js";
import {
  ProposeLinkInputSchema,
  type ProposeLinkInput,
  type ProposeLinkResult,
} from "./propose-link.dto.js";
import {
  ProposeNodeInputSchema,
  type ProposeNodeInput,
  type ProposeNodeResult,
} from "./propose-node.dto.js";

// --------------------------------------------------------------------------
// Zod schemas — re-exported so any consumer can import everything from `dto/`.
// --------------------------------------------------------------------------

export {
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
};
export type {
  ProposeAttributeInput,
  ProposeAttributeResult,
  ProposeFragmentInput,
  ProposeFragmentResult,
  ProposeLinkInput,
  ProposeLinkResult,
  ProposeNodeInput,
  ProposeNodeResult,
};

// --------------------------------------------------------------------------
// JSON Schemas derived at module init (BR-24). Stable across the process
// lifetime; safe to ship to MCP / Anthropic / Fastify schema config.
// --------------------------------------------------------------------------

export const ProposeFragmentInputJsonSchema = z.toJSONSchema(
  ProposeFragmentInputSchema
);

export const ProposeNodeInputJsonSchema = z.toJSONSchema(
  ProposeNodeInputSchema
);

export const ProposeLinkInputJsonSchema = z.toJSONSchema(
  ProposeLinkInputSchema
);

export const ProposeAttributeInputJsonSchema = z.toJSONSchema(
  ProposeAttributeInputSchema
);

/** Closed mapping of `propose_*` tool name -> derived JSON Schema.
 *  Used by `mcp/toolset.ts` to register the four ingest tools, and by future
 *  transports (REST mirror, Anthropic orchestrator) that need the same
 *  schemas. */
export const IngestToolInputJsonSchemas = {
  propose_fragment: ProposeFragmentInputJsonSchema,
  propose_node: ProposeNodeInputJsonSchema,
  propose_link: ProposeLinkInputJsonSchema,
  propose_attribute: ProposeAttributeInputJsonSchema,
} as const;

export type IngestToolJsonSchemaName = keyof typeof IngestToolInputJsonSchemas;

/**
 * Single source of truth for the four `propose_*` tool DESCRIPTIONS.
 *
 * Consumed by BOTH transports so the LLM sees the same contract regardless of
 * how it connects:
 *   - the MCP registrar (`mcp/toolset.ts`), and
 *   - the in-process Anthropic tool-use loop (`service/extraction.service.ts`).
 *
 * Written for the model deciding when/how to act — prescriptive about WHEN to
 * call each tool, its ordering/dependencies, and the evidence it must cite —
 * not for a developer reading the schema. Keep free of internal jargon (spec
 * §-refs, advisory locks, "5-layer validated", column names): those do not help
 * the caller and only spend prompt tokens.
 */
export const IngestToolDescriptions = {
  propose_fragment:
    "Record one atomic factual claim quoted verbatim from the current chunk " +
    "(max 1000 chars). Call this FIRST — propose_link and propose_attribute must " +
    "cite the fragment_id returned here as their evidence. One claim per call; " +
    "split compound sentences into separate fragments.",
  propose_node:
    "Register an entity mentioned in the chunk (a person, project, document, …). " +
    "Propose every entity freely: the backend matches it to an existing entity or " +
    "creates a new one and never duplicates. Returns a node_id to cite from " +
    "propose_link / propose_attribute. node_type must be one of the catalog NodeTypes.",
  propose_link:
    "Assert a relation between two entities already registered with propose_node " +
    "(e.g. a Person responsible_for a Project). Both nodes must exist first, and you " +
    "must cite at least one fragment_id as evidence. Use only when the chunk " +
    "explicitly states the relation. link_type must be a catalog LinkType allowed " +
    "for the two node types.",
  propose_attribute:
    "Assert a literal value belonging to an entity (e.g. a Project's deadline). " +
    "Use for dates, numbers, or strings that are values OF an entity — never model a " +
    "literal as its own node. The node must exist; cite at least one fragment_id. " +
    "key must be a catalog AttributeKey for that node type, and value must match the " +
    "key's value type.",
  ingest_document:
    "Ingest a whole document into the knowledge base in one step: the server stores " +
    "the raw text, splits it into chunks, and runs structured extraction (entities, " +
    "relations, attributes) with full provenance, then returns a summary of what was " +
    "consolidated. Use this to ADD knowledge from a source; use the query tools to read " +
    "it back. Extraction runs server-side and can take from seconds to a few minutes for " +
    "long documents. Re-sending the same content is a no-op (returns the existing run).",
} as const;
