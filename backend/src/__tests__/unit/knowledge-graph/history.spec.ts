// Unit tests for the lineage-chain history walkers.
//
// Acceptance criteria coverage (dev_tc_005 validation.criteria):
//   - BR-12: history chain walk covers BOTH succession and correction
//     scenarios; the bidirectional CTE returns the full chain regardless
//     of which version the anchor id refers to.
//   - BR-20: getAttributeKeyHistory resolves (node_type, key) via catalog;
//     unknown key -> UnknownAttributeKeyError (404).
//   - BR-11: getAttributeKeyHistory on deleted node -> NodeDeletedError;
//     on unknown node -> ResourceNotFoundError.
//   - Edge case: anchor id not in the DB -> ResourceNotFoundError.
//   - Edge case: empty UC-11 result (catalog key valid but no history) is
//     returned as `{ versions: [] }`, not 404.

import { describe, expect, it } from "vitest";
import pino from "pino";
import type { PoolClient } from "pg";

import { buildSnapshot, type CatalogSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";
import {
  getAttributeHistoryService,
  getAttributeKeyHistoryService,
  getLinkHistoryService,
} from "../../../modules/knowledge-graph/service/history.service.js";
import {
  NodeDeletedError,
  ResourceNotFoundError,
  UnknownAttributeKeyError,
} from "../../../modules/knowledge-graph/service/errors.js";

const silentLogger = pino({ level: "silent" });

// ---------------------------------------------------------------------------
// In-memory store and fake pg client
// ---------------------------------------------------------------------------

interface LinkVersion {
  id: string;
  source_node_id: string;
  target_node_id: string;
  link_type_id: string;
  link_type: string;
  link_inverse_name: string;
  valid_from: string | null;
  valid_to: string | null;
  recorded_at: Date;
  superseded_at: Date | null;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: number;
  valid_from_source: "stated" | "document" | "received" | null;
  supersedes_link_id: string | null;
}

interface AttrVersion {
  id: string;
  node_id: string;
  attribute_key_id: string;
  attribute_key: string;
  value_type: "date" | "number" | "text" | "bool";
  value: string;
  valid_from: string | null;
  valid_to: string | null;
  recorded_at: Date;
  superseded_at: Date | null;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: number;
  valid_from_source: "stated" | "document" | "received" | null;
  supersedes_attribute_id: string | null;
}

interface NodeRowMem {
  id: string;
  node_type_id: string;
  node_type: string;
  canonical_name: string;
  status: "active" | "needs_review" | "merged" | "deleted";
  merged_into_node_id: string | null;
}

interface Store {
  links: LinkVersion[];
  attributes: AttrVersion[];
  nodes: NodeRowMem[];
}

function buildFakeClient(store: Store): PoolClient {
  return {
    query: async (sql: string, params: unknown[] = []) => {
      const text = String(sql).trim();

      // findNodeById (joins node_type)
      if (text.includes("FROM knowledge_node kn") && text.includes("WHERE kn.id = $1")) {
        const id = String(params[0]);
        const n = store.nodes.find((x) => x.id === id);
        if (n === undefined) return { rows: [], rowCount: 0 };
        return {
          rows: [{ ...n, created_at: new Date(), updated_at: new Date() }],
          rowCount: 1,
        };
      }

      // Link history recursive CTE — match by the FROM clause shape.
      if (text.includes("WITH RECURSIVE") && text.includes("knowledge_link_resolved")) {
        const anchorId = String(params[0]);
        // Compute the chain by walking the supersedes links graph both ways.
        const rows = walkLinkChain(store.links, anchorId);
        return {
          rows: rows.map((l) => projectLink(l)),
          rowCount: rows.length,
        };
      }

      // Attribute history recursive CTE
      if (text.includes("WITH RECURSIVE") && text.includes("node_attribute_resolved")) {
        const anchorId = String(params[0]);
        const rows = walkAttrChain(store.attributes, anchorId);
        return {
          rows: rows.map((a) => projectAttr(a)),
          rowCount: rows.length,
        };
      }

      // UC-11 — listAttributeHistoryByNodeKey
      if (
        text.includes("FROM node_attribute_resolved na") &&
        text.includes("na.node_id = $1") &&
        text.includes("na.attribute_key_id = $2")
      ) {
        const nodeId = String(params[0]);
        const akId = String(params[1]);
        const rows = store.attributes
          .filter((a) => a.node_id === nodeId && a.attribute_key_id === akId)
          .sort((x, y) => x.recorded_at.getTime() - y.recorded_at.getTime())
          .map(projectAttr);
        return { rows, rowCount: rows.length };
      }

      // listProvenanceByTargets — empty (unit tests don't exercise provenance)
      if (text.includes("FROM provenance p") && text.includes("= ANY($1::uuid[])")) {
        return { rows: [], rowCount: 0 };
      }

      throw new Error(`fake client: unknown SQL: ${text.slice(0, 120)}`);
    },
    release: () => undefined,
  } as unknown as PoolClient;
}

function walkLinkChain(links: LinkVersion[], anchorId: string): LinkVersion[] {
  if (!links.some((l) => l.id === anchorId)) return [];
  const seen = new Set<string>();
  const result: LinkVersion[] = [];

  // Walk up: follow supersedes_link_id from anchor.
  let current: string | null = anchorId;
  while (current !== null && !seen.has(current)) {
    const row = links.find((l) => l.id === current);
    if (row === undefined) break;
    seen.add(row.id);
    result.push(row);
    current = row.supersedes_link_id;
  }

  // Walk down: anyone whose supersedes_link_id leads back to a row in `seen`.
  // BFS — keep expanding until no new rows are added.
  let frontier = [...seen];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      const successors = links.filter(
        (l) => l.supersedes_link_id === id && !seen.has(l.id)
      );
      for (const s of successors) {
        seen.add(s.id);
        result.push(s);
        next.push(s.id);
      }
    }
    frontier = next;
  }

  // Sort ASC by recorded_at then id.
  result.sort((a, b) => {
    const d = a.recorded_at.getTime() - b.recorded_at.getTime();
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
  return result;
}

function walkAttrChain(attrs: AttrVersion[], anchorId: string): AttrVersion[] {
  if (!attrs.some((a) => a.id === anchorId)) return [];
  const seen = new Set<string>();
  const result: AttrVersion[] = [];

  let current: string | null = anchorId;
  while (current !== null && !seen.has(current)) {
    const row = attrs.find((a) => a.id === current);
    if (row === undefined) break;
    seen.add(row.id);
    result.push(row);
    current = row.supersedes_attribute_id;
  }

  let frontier = [...seen];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      const successors = attrs.filter(
        (a) => a.supersedes_attribute_id === id && !seen.has(a.id)
      );
      for (const s of successors) {
        seen.add(s.id);
        result.push(s);
        next.push(s.id);
      }
    }
    frontier = next;
  }

  result.sort((a, b) => {
    const d = a.recorded_at.getTime() - b.recorded_at.getTime();
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
  return result;
}

function projectLink(l: LinkVersion) {
  return {
    id: l.id,
    source_node_id: l.source_node_id,
    target_node_id: l.target_node_id,
    link_type_id: l.link_type_id,
    link_type: l.link_type,
    link_inverse_name: l.link_inverse_name,
    valid_from: l.valid_from,
    valid_to: l.valid_to,
    recorded_at: l.recorded_at,
    superseded_at: l.superseded_at,
    status: l.status,
    confidence: l.confidence,
    valid_from_source: l.valid_from_source,
    created_by_run_id: null,
    supersedes_link_id: l.supersedes_link_id,
    created_at: l.recorded_at,
    updated_at: l.recorded_at,
    is_current: l.valid_to === null && l.superseded_at === null,
    is_in_effect: l.valid_to === null && l.superseded_at === null,
    effective_status: l.status,
  };
}

function projectAttr(a: AttrVersion) {
  return {
    id: a.id,
    node_id: a.node_id,
    attribute_key_id: a.attribute_key_id,
    value_type: a.value_type,
    value: a.value,
    valid_from: a.valid_from,
    valid_to: a.valid_to,
    recorded_at: a.recorded_at,
    superseded_at: a.superseded_at,
    status: a.status,
    confidence: a.confidence,
    valid_from_source: a.valid_from_source,
    created_by_run_id: null,
    supersedes_attribute_id: a.supersedes_attribute_id,
    created_at: a.recorded_at,
    updated_at: a.recorded_at,
    attribute_key: a.attribute_key,
    key_is_temporal: true,
    key_allows_multiple_current: false,
    is_current: a.valid_to === null && a.superseded_at === null,
    is_in_effect: a.valid_to === null && a.superseded_at === null,
    effective_status: a.status,
  };
}

function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: "nt-project", name: "Project", description: "x", version: 1 },
    ],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [
      {
        id: "ak-deadline",
        node_type_id: "nt-project",
        key: "deadline",
        value_type: "date",
        is_temporal: true,
        allows_multiple_current: false,
        requires_valid_from: true,
        description: "deadline",
        version: 1,
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Link history — succession + correction + 404
// ---------------------------------------------------------------------------

describe("getLinkHistoryService — BR-12 bidirectional chain walk", () => {
  it("returns the full chain when the anchor is the OLDEST version", async () => {
    // Chain: v1 (oldest, anchor) <- v2 (succession) <- v3 (correction)
    const v1: LinkVersion = {
      id: "v1",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-01-01",
      valid_to: "2025-06-01",
      recorded_at: new Date(Date.UTC(2025, 0, 1)),
      superseded_at: new Date(Date.UTC(2025, 5, 1)),
      status: "superseded",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_link_id: null,
    };
    const v2: LinkVersion = {
      id: "v2",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-06-01",
      valid_to: null,
      recorded_at: new Date(Date.UTC(2025, 5, 1)),
      superseded_at: new Date(Date.UTC(2025, 11, 15)),
      status: "superseded",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_link_id: "v1",
    };
    const v3: LinkVersion = {
      id: "v3",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-06-15", // correction of v2's valid_from
      valid_to: null,
      recorded_at: new Date(Date.UTC(2025, 11, 15)),
      superseded_at: null,
      status: "active",
      confidence: 0.95,
      valid_from_source: "stated",
      supersedes_link_id: "v2",
    };
    const store: Store = { links: [v1, v2, v3], attributes: [], nodes: [] };
    const client = buildFakeClient(store);
    const result = await getLinkHistoryService(client, "v1", silentLogger);

    expect(result.versions.map((v) => v.id)).toEqual(["v1", "v2", "v3"]);
  });

  it("returns the full chain when the anchor is the MIDDLE version", async () => {
    // Same chain — anchor is v2.
    const v1: LinkVersion = {
      id: "v1",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-01-01",
      valid_to: "2025-06-01",
      recorded_at: new Date(Date.UTC(2025, 0, 1)),
      superseded_at: new Date(Date.UTC(2025, 5, 1)),
      status: "superseded",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_link_id: null,
    };
    const v2: LinkVersion = {
      id: "v2",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-06-01",
      valid_to: null,
      recorded_at: new Date(Date.UTC(2025, 5, 1)),
      superseded_at: new Date(Date.UTC(2025, 11, 15)),
      status: "superseded",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_link_id: "v1",
    };
    const v3: LinkVersion = {
      id: "v3",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-06-15",
      valid_to: null,
      recorded_at: new Date(Date.UTC(2025, 11, 15)),
      superseded_at: null,
      status: "active",
      confidence: 0.95,
      valid_from_source: "stated",
      supersedes_link_id: "v2",
    };
    const store: Store = { links: [v1, v2, v3], attributes: [], nodes: [] };
    const client = buildFakeClient(store);
    const result = await getLinkHistoryService(client, "v2", silentLogger);
    expect(result.versions.map((v) => v.id)).toEqual(["v1", "v2", "v3"]);
  });

  it("returns the full chain when the anchor is the NEWEST version", async () => {
    const v1: LinkVersion = {
      id: "v1",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-01-01",
      valid_to: "2025-06-01",
      recorded_at: new Date(Date.UTC(2025, 0, 1)),
      superseded_at: new Date(Date.UTC(2025, 5, 1)),
      status: "superseded",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_link_id: null,
    };
    const v2: LinkVersion = {
      id: "v2",
      source_node_id: "s",
      target_node_id: "t",
      link_type_id: "lt",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2025-06-01",
      valid_to: null,
      recorded_at: new Date(Date.UTC(2025, 5, 1)),
      superseded_at: null,
      status: "active",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_link_id: "v1",
    };
    const store: Store = { links: [v1, v2], attributes: [], nodes: [] };
    const client = buildFakeClient(store);
    const result = await getLinkHistoryService(client, "v2", silentLogger);
    expect(result.versions.map((v) => v.id)).toEqual(["v1", "v2"]);
  });

  it("returns 404 when the link id does not exist", async () => {
    const store: Store = { links: [], attributes: [], nodes: [] };
    const client = buildFakeClient(store);
    await expect(
      getLinkHistoryService(client, "missing", silentLogger)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// Attribute history — same bidirectional invariants
// ---------------------------------------------------------------------------

describe("getAttributeHistoryService — BR-12 succession AND correction", () => {
  it("covers a succession scenario (6.5-A) ordered ASC by recorded_at", async () => {
    const old: AttrVersion = {
      id: "old",
      node_id: "n1",
      attribute_key_id: "ak-deadline",
      attribute_key: "deadline",
      value_type: "date",
      value: "2025-09-01",
      valid_from: "2025-01-10",
      valid_to: "2026-01-01",
      recorded_at: new Date(Date.UTC(2025, 0, 10)),
      superseded_at: new Date(Date.UTC(2026, 0, 1)),
      status: "superseded",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_attribute_id: null,
    };
    const current: AttrVersion = {
      id: "current",
      node_id: "n1",
      attribute_key_id: "ak-deadline",
      attribute_key: "deadline",
      value_type: "date",
      value: "2026-07-15",
      valid_from: "2026-01-01",
      valid_to: null,
      recorded_at: new Date(Date.UTC(2026, 0, 1)),
      superseded_at: null,
      status: "active",
      confidence: 0.92,
      valid_from_source: "document",
      supersedes_attribute_id: "old",
    };
    const store: Store = { links: [], attributes: [old, current], nodes: [] };
    const client = buildFakeClient(store);
    const result = await getAttributeHistoryService(client, "old", silentLogger);
    expect(result.versions.map((v) => v.id)).toEqual(["old", "current"]);
  });

  it("covers a correction scenario (6.5-B) where valid_to is unchanged on the predecessor", async () => {
    // 6.5-B: predecessor's valid_to is UNCHANGED, only superseded_at is
    // stamped; successor has corrected valid_from.
    const predecessor: AttrVersion = {
      id: "pred",
      node_id: "n1",
      attribute_key_id: "ak-deadline",
      attribute_key: "deadline",
      value_type: "date",
      value: "2025-09-01",
      valid_from: "2025-01-10",
      valid_to: null, // unchanged
      recorded_at: new Date(Date.UTC(2025, 0, 10)),
      superseded_at: new Date(Date.UTC(2025, 11, 15)),
      status: "superseded",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_attribute_id: null,
    };
    const successor: AttrVersion = {
      id: "succ",
      node_id: "n1",
      attribute_key_id: "ak-deadline",
      attribute_key: "deadline",
      value_type: "date",
      value: "2025-09-01",
      valid_from: "2025-02-01", // corrected
      valid_to: null,
      recorded_at: new Date(Date.UTC(2025, 11, 15)),
      superseded_at: null,
      status: "active",
      confidence: 0.95,
      valid_from_source: "stated",
      supersedes_attribute_id: "pred",
    };
    const store: Store = {
      links: [],
      attributes: [predecessor, successor],
      nodes: [],
    };
    const client = buildFakeClient(store);
    // Anchor on successor — walk must surface the predecessor too.
    const result = await getAttributeHistoryService(client, "succ", silentLogger);
    expect(result.versions.map((v) => v.id)).toEqual(["pred", "succ"]);
    expect(result.versions[0]?.valid_to).toBeNull();
    expect(result.versions[1]?.valid_from).toBe("2025-02-01");
  });

  it("returns 404 when the attribute id does not exist", async () => {
    const store: Store = { links: [], attributes: [], nodes: [] };
    const client = buildFakeClient(store);
    await expect(
      getAttributeHistoryService(client, "missing", silentLogger)
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UC-11 — getAttributeKeyHistory (BR-20)
// ---------------------------------------------------------------------------

describe("getAttributeKeyHistoryService — BR-20 + BR-11", () => {
  function projectNode(): NodeRowMem {
    return {
      id: "n1",
      node_type_id: "nt-project",
      node_type: "Project",
      canonical_name: "Project A",
      status: "active",
      merged_into_node_id: null,
    };
  }

  it("returns the chain when the (node, key) pair resolves cleanly", async () => {
    const a: AttrVersion = {
      id: "a1",
      node_id: "n1",
      attribute_key_id: "ak-deadline",
      attribute_key: "deadline",
      value_type: "date",
      value: "2026-07-15",
      valid_from: "2026-01-10",
      valid_to: null,
      recorded_at: new Date(Date.UTC(2026, 0, 10)),
      superseded_at: null,
      status: "active",
      confidence: 0.92,
      valid_from_source: "document",
      supersedes_attribute_id: null,
    };
    const store: Store = {
      links: [],
      attributes: [a],
      nodes: [projectNode()],
    };
    const client = buildFakeClient(store);
    const catalog = buildCatalog();
    const result = await getAttributeKeyHistoryService(
      client,
      catalog,
      { nodeId: "n1", key: "deadline" },
      silentLogger
    );
    expect(result.versions).toHaveLength(1);
    expect(result.versions[0]?.attribute_key).toBe("deadline");
  });

  it("returns 404 BUSINESS_UNKNOWN_ATTRIBUTE_KEY for a key absent from the catalog", async () => {
    const store: Store = {
      links: [],
      attributes: [],
      nodes: [projectNode()],
    };
    const client = buildFakeClient(store);
    const catalog = buildCatalog();
    await expect(
      getAttributeKeyHistoryService(
        client,
        catalog,
        { nodeId: "n1", key: "unknownKey" },
        silentLogger
      )
    ).rejects.toBeInstanceOf(UnknownAttributeKeyError);
  });

  it("returns 410 BUSINESS_NODE_DELETED when the node is tombstoned", async () => {
    const deleted: NodeRowMem = { ...projectNode(), status: "deleted" };
    const store: Store = { links: [], attributes: [], nodes: [deleted] };
    const client = buildFakeClient(store);
    const catalog = buildCatalog();
    await expect(
      getAttributeKeyHistoryService(
        client,
        catalog,
        { nodeId: "n1", key: "deadline" },
        silentLogger
      )
    ).rejects.toBeInstanceOf(NodeDeletedError);
  });

  it("returns 404 RESOURCE_NOT_FOUND when the node id is unknown", async () => {
    const store: Store = { links: [], attributes: [], nodes: [] };
    const client = buildFakeClient(store);
    const catalog = buildCatalog();
    await expect(
      getAttributeKeyHistoryService(
        client,
        catalog,
        { nodeId: "n1", key: "deadline" },
        silentLogger
      )
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("returns `{ versions: [] }` when the catalog key is valid but the node has no history yet", async () => {
    const store: Store = {
      links: [],
      attributes: [],
      nodes: [projectNode()],
    };
    const client = buildFakeClient(store);
    const catalog = buildCatalog();
    const result = await getAttributeKeyHistoryService(
      client,
      catalog,
      { nodeId: "n1", key: "deadline" },
      silentLogger
    );
    expect(result.versions).toEqual([]);
  });
});
