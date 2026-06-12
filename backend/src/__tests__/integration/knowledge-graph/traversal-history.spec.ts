// Integration tests for the TC-05 traversal + history routes.
//
// Acceptance criteria covered (validation.criteria of dev_tc_005):
//   - GET /nodes/{id}/traverse?depth=5 returns 422 BUSINESS_INVALID_TRAVERSE_DEPTH
//   - GET /nodes/{id}/traverse?link_types=nonexistent returns 422
//     BUSINESS_UNKNOWN_LINK_TYPE
//   - Traversal result substitutes merged nodes with their survivor transparently
//   - direction=both result never duplicates a link
//   - History returns full chain regardless of which version the anchor refers to
//   - GET /nodes/{id}/attributes/unknownKey/history returns 404
//     BUSINESS_UNKNOWN_ATTRIBUTE_KEY
//
// Strategy mirrors `routes.spec.ts`: build the real Fastify app with a
// fake pg.Pool whose client interprets the SQL templates against an
// in-memory store.

import { beforeAll, describe, expect, it } from "vitest";
import pino from "pino";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
} from "jose";

import { buildApp } from "../../../app.js";
import type { Env } from "../../../config/env.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { buildNeonAuth } from "../../../middleware/auth.js";
import { buildSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

interface NodeRowMem {
  id: string;
  node_type_id: string;
  canonical_name: string;
  status: "active" | "needs_review" | "merged" | "deleted";
  merged_into_node_id: string | null;
}
interface LinkRowMem {
  id: string;
  source_node_id: string;
  target_node_id: string;
  link_type_id: string;
  link_type: string;
  link_inverse_name: string;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  valid_from: string | null;
  valid_to: string | null;
  superseded_at: Date | null;
  supersedes_link_id: string | null;
  recorded_at: Date;
  confidence: number;
}
interface AttrRowMem {
  id: string;
  node_id: string;
  attribute_key_id: string;
  attribute_key: string;
  value_type: "date" | "number" | "text" | "bool";
  value: string;
  valid_from: string | null;
  valid_to: string | null;
  superseded_at: Date | null;
  supersedes_attribute_id: string | null;
  recorded_at: Date;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: number;
  valid_from_source: "stated" | "document" | "received" | null;
}
interface NodeTypeMem {
  id: string;
  name: string;
}
interface LinkTypeMem {
  id: string;
  name: string;
  inverse_name: string;
}
interface AttrKeyMem {
  id: string;
  node_type_id: string;
  key: string;
  value_type: "date" | "number" | "text" | "bool";
}

interface Store {
  node_types: NodeTypeMem[];
  link_types: LinkTypeMem[];
  attribute_keys: AttrKeyMem[];
  nodes: NodeRowMem[];
  links: LinkRowMem[];
  attributes: AttrRowMem[];
}

function projectLinkRow(l: LinkRowMem) {
  return {
    id: l.id,
    source_node_id: l.source_node_id,
    target_node_id: l.target_node_id,
    link_type_id: l.link_type_id,
    valid_from: l.valid_from,
    valid_to: l.valid_to,
    recorded_at: l.recorded_at,
    superseded_at: l.superseded_at,
    status: l.status,
    confidence: l.confidence,
    valid_from_source: "document",
    created_by_run_id: null,
    supersedes_link_id: l.supersedes_link_id,
    created_at: l.recorded_at,
    updated_at: l.recorded_at,
    link_type: l.link_type,
    link_inverse_name: l.link_inverse_name,
    is_current: l.valid_to === null && l.superseded_at === null,
    is_in_effect: l.valid_to === null && l.superseded_at === null,
    effective_status: l.status,
  };
}

function projectAttrRow(a: AttrRowMem) {
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

function buildFakeClient(store: Store): import("pg").PoolClient {
  return {
    query: async (sql: string, params: unknown[] = []) => {
      const text = String(sql).trim();
      const upper = text.toUpperCase();
      if (
        upper === "BEGIN" ||
        upper === "BEGIN READ ONLY" ||
        upper === "COMMIT" ||
        upper === "ROLLBACK"
      ) {
        return { rows: [], rowCount: 0 };
      }

      // findNodeById (single id)
      if (text.includes("FROM knowledge_node kn") && text.includes("WHERE kn.id = $1")) {
        const id = String(params[0]);
        const n = store.nodes.find((x) => x.id === id);
        if (n === undefined) return { rows: [], rowCount: 0 };
        const nt = store.node_types.find((x) => x.id === n.node_type_id)!;
        return {
          rows: [
            {
              id: n.id,
              node_type_id: n.node_type_id,
              node_type: nt.name,
              canonical_name: n.canonical_name,
              status: n.status,
              merged_into_node_id: n.merged_into_node_id,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          rowCount: 1,
        };
      }

      // findNodesByIds (ANY)
      if (text.includes("FROM knowledge_node kn") && text.includes("WHERE kn.id = ANY")) {
        const ids = params[0] as string[];
        const rows = store.nodes
          .filter((n) => ids.includes(n.id))
          .map((n) => {
            const nt = store.node_types.find((x) => x.id === n.node_type_id)!;
            return {
              id: n.id,
              node_type_id: n.node_type_id,
              node_type: nt.name,
              canonical_name: n.canonical_name,
              status: n.status,
              merged_into_node_id: n.merged_into_node_id,
              created_at: new Date(),
              updated_at: new Date(),
            };
          });
        return { rows, rowCount: rows.length };
      }

      // fetchTraversalHop — outbound
      if (text.includes("FROM knowledge_link_resolved kl") && text.includes("source_node_id = ANY")) {
        const ids = params[0] as string[];
        const linkTypeIds =
          text.includes("link_type_id = ANY") ? (params[1] as string[]) : undefined;
        const rows = store.links
          .filter((l) => l.status !== "deleted" && ids.includes(l.source_node_id))
          .filter((l) => linkTypeIds === undefined || linkTypeIds.includes(l.link_type_id))
          .filter((l) => l.valid_to === null && l.superseded_at === null) // BR-07 default
          .map(projectLinkRow);
        return { rows, rowCount: rows.length };
      }

      // fetchTraversalHop — inbound
      if (text.includes("FROM knowledge_link_resolved kl") && text.includes("target_node_id = ANY")) {
        const ids = params[0] as string[];
        const linkTypeIds =
          text.includes("link_type_id = ANY") ? (params[1] as string[]) : undefined;
        const rows = store.links
          .filter((l) => l.status !== "deleted" && ids.includes(l.target_node_id))
          .filter((l) => linkTypeIds === undefined || linkTypeIds.includes(l.link_type_id))
          .filter((l) => l.valid_to === null && l.superseded_at === null)
          .map(projectLinkRow);
        return { rows, rowCount: rows.length };
      }

      // History link CTE
      if (text.includes("WITH RECURSIVE") && text.includes("knowledge_link_resolved")) {
        const anchorId = String(params[0]);
        const rows = walkLinkChainStore(store.links, anchorId).map(projectLinkRow);
        return { rows, rowCount: rows.length };
      }

      // History attribute CTE
      if (text.includes("WITH RECURSIVE") && text.includes("node_attribute_resolved")) {
        const anchorId = String(params[0]);
        const rows = walkAttrChainStore(store.attributes, anchorId).map(projectAttrRow);
        return { rows, rowCount: rows.length };
      }

      // UC-11 attribute history listing by (node_id, attribute_key_id)
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
          .map(projectAttrRow);
        return { rows, rowCount: rows.length };
      }

      // listProvenanceByTargets — empty
      if (text.includes("FROM provenance p") && text.includes("= ANY($1::uuid[])")) {
        return { rows: [], rowCount: 0 };
      }

      throw new Error(`fake client: unknown SQL: ${text.slice(0, 120)}`);
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
}

function walkLinkChainStore(links: LinkRowMem[], anchorId: string): LinkRowMem[] {
  if (!links.some((l) => l.id === anchorId)) return [];
  const seen = new Set<string>();
  const result: LinkRowMem[] = [];

  let current: string | null = anchorId;
  while (current !== null && !seen.has(current)) {
    const row = links.find((l) => l.id === current);
    if (row === undefined) break;
    seen.add(row.id);
    result.push(row);
    current = row.supersedes_link_id;
  }

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
  result.sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime() || a.id.localeCompare(b.id));
  return result;
}

function walkAttrChainStore(attrs: AttrRowMem[], anchorId: string): AttrRowMem[] {
  if (!attrs.some((a) => a.id === anchorId)) return [];
  const seen = new Set<string>();
  const result: AttrRowMem[] = [];

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
  result.sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime() || a.id.localeCompare(b.id));
  return result;
}

function buildFakePool(store: Store): import("pg").Pool {
  const client = buildFakeClient(store);
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  } as unknown as import("pg").Pool;
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

function seedStore(): Store {
  return {
    node_types: [{ id: "nt-project", name: "Project" }],
    link_types: [
      { id: "lt-participates_in", name: "participates_in", inverse_name: "inv_participates_in" },
      { id: "lt-related_to", name: "related_to", inverse_name: "inv_related_to" },
    ],
    attribute_keys: [
      {
        id: "ak-deadline",
        node_type_id: "nt-project",
        key: "deadline",
        value_type: "date",
      },
    ],
    nodes: [],
    links: [],
    attributes: [],
  };
}

function buildCatalogFromStore(store: Store) {
  return buildSnapshot({
    nodeTypes: store.node_types.map((n) => ({
      id: n.id,
      name: n.name,
      description: "x",
      version: 1,
    })),
    linkTypes: store.link_types.map((l) => ({
      id: l.id,
      name: l.name,
      label: l.name,
      description: l.name,
      inverse_name: l.inverse_name,
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: false,
      requires_valid_to_on_change: false,
      version: 1,
    })),
    linkTypeRules: [],
    attributeKeys: store.attribute_keys.map((a) => ({
      id: a.id,
      node_type_id: a.node_type_id,
      key: a.key,
      value_type: a.value_type,
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: false,
      description: a.key,
      version: 1,
    })),
  });
}

// ---------------------------------------------------------------------------
// Auth fixture (shared)
// ---------------------------------------------------------------------------

const envFixture: Env = Object.freeze({
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  PG_POOL_MIN: 2,
  PG_POOL_MAX: 10,
  PG_STATEMENT_TIMEOUT_MS: 10_000,
  NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth",
  NEON_AUTH_JWKS_TTL_S: 600,
}) as Env;

const silentLogger = pino({ level: "silent" });

interface AuthFixture {
  publicJwk: JWK & { kid: string; alg: string };
  privateKey: CryptoKey;
}

async function buildAuthFixture(): Promise<AuthFixture> {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  return {
    privateKey,
    publicJwk: { ...publicJwk, kid: "test-kid", alg: "RS256", use: "sig" },
  };
}

async function signValidJwt(privateKey: CryptoKey): Promise<string> {
  return new SignJWT({ sub: "user-123" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
    .sign(privateKey);
}

async function buildAppWith(store: Store, fixture: AuthFixture) {
  return await buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    catalog: buildCatalogFromStore(store),
  });
}

// ---------------------------------------------------------------------------
// Tests — traversal
// ---------------------------------------------------------------------------

describe("Knowledge Graph — traversal (TC-05)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // Acceptance: depth=5 -> 422 BUSINESS_INVALID_TRAVERSE_DEPTH.
  it("GET /nodes/{id}/traverse?depth=5 returns 422 BUSINESS_INVALID_TRAVERSE_DEPTH", async () => {
    const store = seedStore();
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000001",
      node_type_id: "nt-project",
      canonical_name: "Project A",
      status: "active",
      merged_into_node_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000001/traverse?depth=5",
        headers: { authorization: `Bearer ${token}` },
      });
      // Zod's z.number().int().min(1).max(3) check fires first (since the
      // schema enforces the range) and surfaces as VALIDATION_INVALID_FORMAT
      // via the global handler. We accept either error code as long as the
      // status is 422 — but the spec mandates BUSINESS_INVALID_TRAVERSE_DEPTH,
      // so the route DTO must defer the bound check to the service layer.
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_INVALID_TRAVERSE_DEPTH");
    } finally {
      await app.close();
    }
  });

  // Acceptance: nonexistent link_types -> 422 BUSINESS_UNKNOWN_LINK_TYPE.
  it("GET /nodes/{id}/traverse?link_types=nonexistent returns 422 BUSINESS_UNKNOWN_LINK_TYPE", async () => {
    const store = seedStore();
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000001",
      node_type_id: "nt-project",
      canonical_name: "Project A",
      status: "active",
      merged_into_node_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000001/traverse?link_types=nonexistent",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as {
        error: { code: string; details?: { link_type?: string } };
      };
      expect(body.error.code).toBe("BUSINESS_UNKNOWN_LINK_TYPE");
      expect(body.error.details?.link_type).toBe("nonexistent");
    } finally {
      await app.close();
    }
  });

  // BR-13 — merged endpoint substitution is transparent.
  it("substitutes a merged node endpoint by its survivor in the response", async () => {
    const store = seedStore();
    const N1 = "00000000-0000-4000-8000-000000000010";
    const N2_MERGED = "00000000-0000-4000-8000-000000000020";
    const N2_SURVIVOR = "00000000-0000-4000-8000-000000000021";
    store.nodes.push(
      {
        id: N1,
        node_type_id: "nt-project",
        canonical_name: "Source",
        status: "active",
        merged_into_node_id: null,
      },
      {
        id: N2_MERGED,
        node_type_id: "nt-project",
        canonical_name: "Loser",
        status: "merged",
        merged_into_node_id: N2_SURVIVOR,
      },
      {
        id: N2_SURVIVOR,
        node_type_id: "nt-project",
        canonical_name: "Survivor",
        status: "active",
        merged_into_node_id: null,
      }
    );
    store.links.push({
      id: "00000000-0000-4000-8000-0000000000aa",
      source_node_id: N1,
      target_node_id: N2_MERGED,
      link_type_id: "lt-participates_in",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      status: "active",
      valid_from: null,
      valid_to: null,
      superseded_at: null,
      supersedes_link_id: null,
      recorded_at: new Date(),
      confidence: 0.9,
    });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${N1}/traverse?direction=out&depth=1`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        starting_node_id: string;
        nodes: { id: string; status: string }[];
        links: { target_node_id: string; hop: number; score: number }[];
      };
      expect(body.links).toHaveLength(1);
      expect(body.links[0]?.target_node_id).toBe(N2_SURVIVOR);
      expect(body.links[0]?.hop).toBe(1);
      expect(body.links[0]?.score).toBe(0.5);
      const ids = body.nodes.map((n) => n.id);
      expect(ids).toContain(N2_SURVIVOR);
      expect(ids).not.toContain(N2_MERGED);
    } finally {
      await app.close();
    }
  });

  // BR-22 — direction=both dedupes.
  it("direction=both never duplicates a link that appears in both BFS halves", async () => {
    const store = seedStore();
    const N1 = "00000000-0000-4000-8000-000000000030";
    store.nodes.push({
      id: N1,
      node_type_id: "nt-project",
      canonical_name: "Self",
      status: "active",
      merged_into_node_id: null,
    });
    // Self-loop — appears in BOTH outbound (source = N1) and inbound
    // (target = N1) halves; the service must record it once.
    store.links.push({
      id: "00000000-0000-4000-8000-0000000000bb",
      source_node_id: N1,
      target_node_id: N1,
      link_type_id: "lt-related_to",
      link_type: "related_to",
      link_inverse_name: "inv_related_to",
      status: "active",
      valid_from: null,
      valid_to: null,
      superseded_at: null,
      supersedes_link_id: null,
      recorded_at: new Date(),
      confidence: 0.9,
    });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${N1}/traverse?direction=both&depth=1`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { links: { id: string }[] };
      const ids = body.links.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      await app.close();
    }
  });

  it("returns 404 for an unknown starting node", async () => {
    const store = seedStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-0000000099aa/traverse",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("returns 410 for a deleted starting node", async () => {
    const store = seedStore();
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000099",
      node_type_id: "nt-project",
      canonical_name: "Tombstone",
      status: "deleted",
      merged_into_node_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000099/traverse",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(410);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_NODE_DELETED");
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Tests — history endpoints
// ---------------------------------------------------------------------------

describe("Knowledge Graph — history endpoints (TC-05)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // BR-12 — full chain regardless of which version the anchor refers to.
  it("GET /links/{id}/history returns full chain when anchor is the newest version", async () => {
    const store = seedStore();
    const V1 = "00000000-0000-4000-8000-0000000000c1";
    const V2 = "00000000-0000-4000-8000-0000000000c2";
    store.nodes.push(
      {
        id: "00000000-0000-4000-8000-000000000040",
        node_type_id: "nt-project",
        canonical_name: "S",
        status: "active",
        merged_into_node_id: null,
      },
      {
        id: "00000000-0000-4000-8000-000000000041",
        node_type_id: "nt-project",
        canonical_name: "T",
        status: "active",
        merged_into_node_id: null,
      }
    );
    store.links.push(
      {
        id: V1,
        source_node_id: "00000000-0000-4000-8000-000000000040",
        target_node_id: "00000000-0000-4000-8000-000000000041",
        link_type_id: "lt-participates_in",
        link_type: "participates_in",
        link_inverse_name: "inv_participates_in",
        status: "superseded",
        valid_from: "2025-01-01",
        valid_to: "2026-01-01",
        superseded_at: new Date(Date.UTC(2026, 0, 1)),
        supersedes_link_id: null,
        recorded_at: new Date(Date.UTC(2025, 0, 1)),
        confidence: 0.9,
      },
      {
        id: V2,
        source_node_id: "00000000-0000-4000-8000-000000000040",
        target_node_id: "00000000-0000-4000-8000-000000000041",
        link_type_id: "lt-participates_in",
        link_type: "participates_in",
        link_inverse_name: "inv_participates_in",
        status: "active",
        valid_from: "2026-01-01",
        valid_to: null,
        superseded_at: null,
        supersedes_link_id: V1,
        recorded_at: new Date(Date.UTC(2026, 0, 1)),
        confidence: 0.92,
      }
    );
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/links/${V2}/history`, // anchor on the newest version
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { versions: { id: string }[] };
      expect(body.versions.map((v) => v.id)).toEqual([V1, V2]);
    } finally {
      await app.close();
    }
  });

  it("GET /links/{id}/history returns 404 for unknown id", async () => {
    const store = seedStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/links/00000000-0000-4000-8000-0000000099dd/history",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  // BR-20 — unknown attribute key returns 404 BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  it("GET /nodes/{id}/attributes/unknownKey/history returns 404 BUSINESS_UNKNOWN_ATTRIBUTE_KEY", async () => {
    const store = seedStore();
    const NODE = "00000000-0000-4000-8000-000000000050";
    store.nodes.push({
      id: NODE,
      node_type_id: "nt-project",
      canonical_name: "Project Z",
      status: "active",
      merged_into_node_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${NODE}/attributes/unknownKey/history`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as {
        error: { code: string; details?: { key?: string; node_type?: string } };
      };
      expect(body.error.code).toBe("BUSINESS_UNKNOWN_ATTRIBUTE_KEY");
      expect(body.error.details?.key).toBe("unknownKey");
      expect(body.error.details?.node_type).toBe("Project");
    } finally {
      await app.close();
    }
  });

  // BR-20 + UC-11 happy path — chain returned for a known key.
  it("GET /nodes/{id}/attributes/{key}/history returns the chain for a known key", async () => {
    const store = seedStore();
    const NODE = "00000000-0000-4000-8000-000000000060";
    store.nodes.push({
      id: NODE,
      node_type_id: "nt-project",
      canonical_name: "Project Q",
      status: "active",
      merged_into_node_id: null,
    });
    const OLD = "00000000-0000-4000-8000-0000000000e1";
    const NEW = "00000000-0000-4000-8000-0000000000e2";
    store.attributes.push(
      {
        id: OLD,
        node_id: NODE,
        attribute_key_id: "ak-deadline",
        attribute_key: "deadline",
        value_type: "date",
        value: "2025-09-01",
        valid_from: "2025-01-10",
        valid_to: "2026-01-01",
        superseded_at: new Date(Date.UTC(2026, 0, 1)),
        supersedes_attribute_id: null,
        recorded_at: new Date(Date.UTC(2025, 0, 10)),
        status: "superseded",
        confidence: 0.9,
        valid_from_source: "document",
      },
      {
        id: NEW,
        node_id: NODE,
        attribute_key_id: "ak-deadline",
        attribute_key: "deadline",
        value_type: "date",
        value: "2026-07-15",
        valid_from: "2026-01-01",
        valid_to: null,
        superseded_at: null,
        supersedes_attribute_id: OLD,
        recorded_at: new Date(Date.UTC(2026, 0, 1)),
        status: "active",
        confidence: 0.92,
        valid_from_source: "document",
      }
    );
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${NODE}/attributes/deadline/history`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { versions: { id: string; value: string }[] };
      expect(body.versions.map((v) => v.id)).toEqual([OLD, NEW]);
    } finally {
      await app.close();
    }
  });

  it("GET /nodes/{id}/attributes/{key}/history returns 410 when the node is tombstoned", async () => {
    const store = seedStore();
    const NODE = "00000000-0000-4000-8000-000000000070";
    store.nodes.push({
      id: NODE,
      node_type_id: "nt-project",
      canonical_name: "Tombstone",
      status: "deleted",
      merged_into_node_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${NODE}/attributes/deadline/history`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(410);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_NODE_DELETED");
    } finally {
      await app.close();
    }
  });

  it("GET /attributes/{id}/history returns the chain for a single attribute", async () => {
    const store = seedStore();
    const NODE = "00000000-0000-4000-8000-000000000080";
    store.nodes.push({
      id: NODE,
      node_type_id: "nt-project",
      canonical_name: "Project T",
      status: "active",
      merged_into_node_id: null,
    });
    const A1 = "00000000-0000-4000-8000-0000000000f1";
    const A2 = "00000000-0000-4000-8000-0000000000f2";
    store.attributes.push(
      {
        id: A1,
        node_id: NODE,
        attribute_key_id: "ak-deadline",
        attribute_key: "deadline",
        value_type: "date",
        value: "2025-01-01",
        valid_from: "2025-01-01",
        valid_to: "2025-06-01",
        superseded_at: new Date(Date.UTC(2025, 5, 1)),
        supersedes_attribute_id: null,
        recorded_at: new Date(Date.UTC(2025, 0, 1)),
        status: "superseded",
        confidence: 0.9,
        valid_from_source: "document",
      },
      {
        id: A2,
        node_id: NODE,
        attribute_key_id: "ak-deadline",
        attribute_key: "deadline",
        value_type: "date",
        value: "2025-06-01",
        valid_from: "2025-06-01",
        valid_to: null,
        superseded_at: null,
        supersedes_attribute_id: A1,
        recorded_at: new Date(Date.UTC(2025, 5, 1)),
        status: "active",
        confidence: 0.95,
        valid_from_source: "document",
      }
    );

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/attributes/${A1}/history`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { versions: { id: string }[] };
      expect(body.versions.map((v) => v.id)).toEqual([A1, A2]);
    } finally {
      await app.close();
    }
  });
});
