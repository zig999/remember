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
