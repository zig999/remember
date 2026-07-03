// TC-09 — Service layer (transport-agnostic) acceptance.
//
// Verifies the four new `propose_*` service functions directly, without the
// MCP handler shell:
//   - `proposeFragmentService(client, args, runCtx)`
//   - `proposeNodeService(client, args, runCtx, deps)`
//   - `proposeLinkService(client, args, runCtx, deps)`
//   - `proposeAttributeService(client, args, runCtx, deps)`
//
// Acceptance from TC-09:
//   - Service signature: `(client, args, runCtx) → Promise<McpEnvelope<R>>`
//   - Service does NOT manage the transaction — it receives an open client
//     (no BEGIN/COMMIT issued by the service).
//   - Behaviour identical to the previous handler-internal logic:
//       * propose_link with confidence < 0.40 -> ok:true, outcome=rejected.
//       * propose_link accepted -> envelope.ok=true, knowledge_link inserted.
//       * propose_link UNKNOWN_TYPE -> ValidationFailure thrown.
//   - BR-21: the service no longer reads the llm_run row itself — that is the
//     caller's job (`assertRunIsRunning` in the handler shell). The service
//     consumes the resolved `rawInformationId` from the run context.
//   - BR-24: the four Zod schemas are derived into JSON Schema at module init
//     via `zod-to-json-schema` and exported from `dto/index.ts`.

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import {
  IngestToolInputJsonSchemas,
  ProposeAttributeInputJsonSchema,
  ProposeFragmentInputJsonSchema,
  ProposeLinkInputJsonSchema,
  ProposeNodeInputJsonSchema,
} from "../../../modules/ingestion/dto/index.js";
import { proposeFragmentService } from "../../../modules/ingestion/service/propose-fragment.service.js";
import { proposeLinkService } from "../../../modules/ingestion/service/propose-link.service.js";
import { proposeNodeService } from "../../../modules/ingestion/service/propose-node.service.js";
import { isValidationFailure } from "../../../modules/ingestion/validation/errors.js";

const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const NODE_TYPE_PROJECT = "00000000-0000-0000-0000-000000000002";
const LINK_TYPE_PARTICIPATES = "00000000-0000-0000-0000-000000000010";

const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const SOURCE_NODE = "11111111-1111-4111-8111-111111111111";
const TARGET_NODE = "22222222-2222-4222-8222-222222222222";
const FRAGMENT_ID = "33333333-3333-4333-8333-333333333333";
const CHUNK_ID = "66666666-6666-4666-8666-666666666666";

const runCtx = { llmRunId: RUN_ID, rawInformationId: RAW_INFO_ID };

function buildCatalog(rules: {
  link_type_id: string;
  source_node_type_id: string;
  target_node_type_id: string;
}[]): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: NODE_TYPE_PERSON, name: "Person" },
      { id: NODE_TYPE_PROJECT, name: "Project" },
    ],
    linkTypes: [
      {
        id: LINK_TYPE_PARTICIPATES,
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true,
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
    ],
    linkTypeRules: rules.map((r) => ({
      link_type_id: r.link_type_id,
      source_node_type_id: r.source_node_type_id,
      target_node_type_id: r.target_node_type_id,
      valid_from: null,
      valid_to: null,
    })),
    attributeKeys: [],
  });
}

interface State {
  toolCalls: number;
  txControl: string[];
  knowledgeLinks: number;
  provenance: Array<{ link_id: string | null; fragment_id: string }>;
  fragments: number;
  knowledgeNodes: number;
  aliases: number;
}

function freshState(): State {
  return {
    toolCalls: 0,
    txControl: [],
    knowledgeLinks: 0,
    provenance: [],
    fragments: 0,
    knowledgeNodes: 0,
    aliases: 0,
  };
}

function buildClient(state: State, options?: {
  chunkValid?: boolean;
  fragmentAnchored?: boolean;
  existingNodeMatch?: boolean;
}) {
  const chunkValid = options?.chunkValid ?? true;
  const fragmentAnchored = options?.fragmentAnchored ?? true;
  const existingNodeMatch = options?.existingNodeMatch ?? false;
  return {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const params = (args[1] as unknown[]) ?? [];
      const upper = sql.toUpperCase();
      if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
        state.txControl.push(upper);
        return { rows: [], rowCount: 0 };
      }
      // count chunks in source
      if (sql.startsWith("SELECT count(*)") && sql.includes("FROM raw_chunk")) {
        return { rows: [{ n: chunkValid ? "1" : "0" }], rowCount: 1 };
      }
      // node_type_id lookup
      if (sql.startsWith("SELECT node_type_id FROM knowledge_node")) {
        const id = String(params[0]);
        if (id === SOURCE_NODE) {
          return { rows: [{ node_type_id: NODE_TYPE_PERSON }], rowCount: 1 };
        }
        if (id === TARGET_NODE) {
          return { rows: [{ node_type_id: NODE_TYPE_PROJECT }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      // information_fragment fetch
      if (sql.includes("FROM information_fragment WHERE id = ANY")) {
        return {
          rows: [{ id: FRAGMENT_ID, text: "x", llm_run_id: RUN_ID }],
          rowCount: 1,
        };
      }
      // metadata->>document_date
      if (sql.startsWith("SELECT (metadata->>'document_date')")) {
        return { rows: [{ document_date: null }], rowCount: 1 };
      }
      // anti-hallucination count
      if (sql.includes("count(DISTINCT f.id)::text AS n")) {
        return { rows: [{ n: fragmentAnchored ? "1" : "0" }], rowCount: 1 };
      }
      // pg_advisory_xact_lock — its SELECT shape and the hash key SELECT
      if (sql.startsWith("SELECT (CAST")) {
        return { rows: [{ key: "lockkey" }], rowCount: 1 };
      }
      if (sql.startsWith("SELECT PG_ADVISORY_XACT_LOCK") || sql.toLowerCase().startsWith("select pg_advisory_xact_lock")) {
        return { rows: [{}], rowCount: 1 };
      }
      // node_alias exact-match join
      if (
        sql.startsWith("SELECT na.node_id") &&
        sql.includes("FROM node_alias na") &&
        sql.includes("JOIN knowledge_node kn")
      ) {
        return existingNodeMatch
          ? { rows: [{ node_id: SOURCE_NODE }], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      // INSERT knowledge_node
      if (sql.startsWith("INSERT INTO knowledge_node")) {
        state.knowledgeNodes += 1;
        return { rows: [{ id: `node-${state.knowledgeNodes}` }], rowCount: 1 };
      }
      // INSERT node_alias
      if (sql.startsWith("INSERT INTO node_alias")) {
        state.aliases += 1;
        return { rows: [], rowCount: 1 };
      }
      // INSERT information_fragment
      if (sql.startsWith("INSERT INTO information_fragment")) {
        state.fragments += 1;
        return { rows: [{ id: `frag-${state.fragments}` }], rowCount: 1 };
      }
      if (sql.startsWith("INSERT INTO fragment_source")) {
        return { rows: [], rowCount: 1 };
      }
      // INSERT knowledge_link
      if (sql.startsWith("INSERT INTO knowledge_link")) {
        state.knowledgeLinks += 1;
        return { rows: [{ id: `link-${state.knowledgeLinks}` }], rowCount: 1 };
      }
      // INSERT provenance
      if (sql.startsWith("INSERT INTO provenance")) {
        const fragIds = (params[1] as string[]) ?? [];
        for (const fid of fragIds) {
          state.provenance.push({ link_id: String(params[0]), fragment_id: fid });
        }
        return { rows: [], rowCount: fragIds.length };
      }
      if (sql.startsWith("INSERT INTO tool_call")) {
        state.toolCalls += 1;
        return { rows: [{ id: "tool-call-id" }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
}

describe("TC-09 — service contract: transport-agnostic", () => {
  it("proposeFragmentService returns success envelope without issuing BEGIN/COMMIT (transaction is caller's)", async () => {
    const state = freshState();
    const client = buildClient(state);
    const envelope = await proposeFragmentService(
      client,
      {
        text: "alguma sentença válida",
        confidence: 0.9,
        chunk_ids: [CHUNK_ID],
      },
      runCtx
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.status).toBe("proposed");
    expect(envelope.result.fragment_id).toBeDefined();
    expect(state.fragments).toBe(1);
    // Service must NOT manage the transaction (constraint: "do NOT move
    // transaction management into the service — the service receives an
    // open client").
    expect(state.txControl).toEqual([]);
    // Service must NOT write the tool_call audit row — that is the caller's
    // job (handler shell / REST mirror / extraction orchestrator).
    expect(state.toolCalls).toBe(0);
  });

  it("proposeNodeService creates a new node when no exact-norm match exists", async () => {
    const state = freshState();
    const client = buildClient(state);
    const catalog = buildCatalog([]);
    const envelope = await proposeNodeService(
      client,
      { node_type: "Person", name: "Ada Lovelace" },
      runCtx,
      { catalog }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.resolution).toBe("created_new");
    expect(envelope.result.node_id).toBeDefined();
    expect(state.knowledgeNodes).toBe(1);
    // canonical alias was inserted.
    expect(state.aliases).toBeGreaterThanOrEqual(1);
    expect(state.txControl).toEqual([]);
  });

  it("proposeNodeService matches existing node when alias exact-norm hits", async () => {
    const state = freshState();
    const client = buildClient(state, { existingNodeMatch: true });
    const catalog = buildCatalog([]);
    const envelope = await proposeNodeService(
      client,
      { node_type: "Person", name: "Ada Lovelace" },
      runCtx,
      { catalog }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.resolution).toBe("matched_existing");
    // No new node should have been inserted.
    expect(state.knowledgeNodes).toBe(0);
  });

  it("proposeLinkService returns ok:true with outcome=rejected when confidence < 0.40 (BELOW_CONFIDENCE_FLOOR)", async () => {
    const state = freshState();
    const client = buildClient(state);
    const catalog = buildCatalog([
      {
        link_type_id: LINK_TYPE_PARTICIPATES,
        source_node_type_id: NODE_TYPE_PERSON,
        target_node_type_id: NODE_TYPE_PROJECT,
      },
    ]);
    const envelope = await proposeLinkService(
      client,
      {
        source_node_id: SOURCE_NODE,
        target_node_id: TARGET_NODE,
        link_type: "participates_in",
        confidence: 0.1,
        fragment_ids: [FRAGMENT_ID],
        valid_from: "2026-01-01",
        valid_from_basis: "stated",
        change_hint: "none",
      },
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("rejected");
    expect(envelope.result.reason).toBe("BELOW_CONFIDENCE_FLOOR");
    expect(envelope.result.link_id).toBe(null);
    // No knowledge_link inserted in the below-floor branch.
    expect(state.knowledgeLinks).toBe(0);
    expect(state.txControl).toEqual([]);
  });

  it("proposeLinkService accepts and inserts knowledge_link + provenance when all 5 layers pass", async () => {
    const state = freshState();
    const client = buildClient(state);
    const catalog = buildCatalog([
      {
        link_type_id: LINK_TYPE_PARTICIPATES,
        source_node_type_id: NODE_TYPE_PERSON,
        target_node_type_id: NODE_TYPE_PROJECT,
      },
    ]);
    const envelope = await proposeLinkService(
      client,
      {
        source_node_id: SOURCE_NODE,
        target_node_id: TARGET_NODE,
        link_type: "participates_in",
        confidence: 0.9,
        fragment_ids: [FRAGMENT_ID],
        valid_from: "2026-01-01",
        valid_from_basis: "stated",
        change_hint: "none",
      },
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("accepted");
    expect(state.knowledgeLinks).toBe(1);
    expect(state.provenance.length).toBe(1);
    expect(state.provenance[0]!.fragment_id).toBe(FRAGMENT_ID);
    expect(state.txControl).toEqual([]);
  });

  it("proposeLinkService throws ValidationFailure(UNKNOWN_TYPE) when link_type is not in catalog (caller rolls back)", async () => {
    const state = freshState();
    const client = buildClient(state);
    const catalog = buildCatalog([]);
    let thrown: unknown = null;
    try {
      await proposeLinkService(
        client,
        {
          source_node_id: SOURCE_NODE,
          target_node_id: TARGET_NODE,
          link_type: "bogus_link",
          confidence: 0.9,
          fragment_ids: [FRAGMENT_ID],
          change_hint: "none",
        },
        runCtx,
        { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
      );
    } catch (err) {
      thrown = err;
    }
    expect(thrown).not.toBeNull();
    expect(isValidationFailure(thrown)).toBe(true);
    if (!isValidationFailure(thrown)) return;
    expect(thrown.code).toBe("BUSINESS_UNKNOWN_LINK_TYPE");
    // Service does not write tool_call rows — caller does.
    expect(state.toolCalls).toBe(0);
  });
});

describe("TC-09 — BR-24: zod-to-json-schema derivation at module init", () => {
  it("exports a JSON Schema for every ingest tool", () => {
    expect(IngestToolInputJsonSchemas.propose_fragment).toBeDefined();
    expect(IngestToolInputJsonSchemas.propose_node).toBeDefined();
    expect(IngestToolInputJsonSchemas.propose_link).toBeDefined();
    expect(IngestToolInputJsonSchemas.propose_attribute).toBeDefined();
  });

  it("each derived JSON Schema is a JSON-Schema-shaped object (has $schema / $ref / type or definitions)", () => {
    for (const schema of Object.values(IngestToolInputJsonSchemas)) {
      const looksLikeJsonSchema =
        typeof schema === "object" &&
        schema !== null &&
        // either $ref + definitions (named schema) or a direct type
        (("type" in schema) ||
          ("$ref" in schema) ||
          ("definitions" in schema) ||
          ("properties" in schema));
      expect(looksLikeJsonSchema).toBe(true);
    }
  });

  it("ProposeFragmentInput JSON Schema preserves the required fields from Zod", () => {
    // Zod v4 `z.toJSONSchema` returns the JSON Schema inline (no `definitions`
    // wrapping by default).
    const schema = ProposeFragmentInputJsonSchema as {
      properties?: Record<string, unknown>;
      required?: string[];
      type?: string;
    };
    expect(schema.type).toBe("object");
    expect(schema.properties).toBeDefined();
    expect(Object.keys(schema.properties!)).toEqual(
      expect.arrayContaining(["text", "confidence", "chunk_ids"])
    );
    expect(schema.required).toEqual(
      expect.arrayContaining(["text", "confidence", "chunk_ids"])
    );
  });

  it("ProposeNodeInput JSON Schema has node_type, name as required and aliases as optional", () => {
    const schema = ProposeNodeInputJsonSchema as {
      properties?: Record<string, unknown>;
      required?: string[];
      type?: string;
    };
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(expect.arrayContaining(["node_type", "name"]));
    expect(schema.properties).toHaveProperty("aliases");
    // aliases is OPTIONAL — not in `required`.
    expect(schema.required).not.toContain("aliases");
  });

  it("ProposeLinkInput and ProposeAttributeInput JSON Schemas exist and are objects", () => {
    expect(typeof ProposeLinkInputJsonSchema).toBe("object");
    expect(typeof ProposeAttributeInputJsonSchema).toBe("object");
    expect(ProposeLinkInputJsonSchema).not.toBeNull();
    expect(ProposeAttributeInputJsonSchema).not.toBeNull();
  });
});
