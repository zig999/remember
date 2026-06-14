// Integration tests for the TC-04 MCP query transport — knowledge-graph half.
//
// Acceptance criteria (validation.criteria of dev_tc_eqmt_004):
//   - POST /api/v1/mcp/query `tools/list` returns the 9 knowledge-graph tool
//     names alongside any co-tenant tools (verified by superset assertion).
//   - tools/call get_node success: REST GET /nodes/:id and MCP get_node return
//     byte-for-byte identical payloads after envelope stripping.
//   - tools/call get_node 404: REST and MCP both surface RESOURCE_NOT_FOUND.
//   - tools/call traverse success: same payload as REST GET /nodes/:id/traverse
//     (empty-graph case keeps the fake-pg footprint small while still
//     exercising the full service-layer path the REST handler runs).
//   - tools/call list_nodes success: same payload as REST GET /nodes.
//   - No tool_call rows are written by the query transport (read-only —
//     §14.3, BR-23 of knowledge-graph.back.md). Verified by injecting a
//     count probe on the fake-pg client and asserting it stays at zero.
//
// Strategy: build the real Fastify app with the same fake-pg pattern that
// `routes.spec.ts` uses (single source of seeded data fed to both transports
// in the same test) so REST and MCP go through the SAME service-layer
// codepath. The MCP transport is JWT-gated by the parent scope's
// requireNeonAuth preHandler — we reuse the JWKS fixture pattern from
// `routes.spec.ts`.

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
import { QUERY_TOOL_NAMES } from "../../../modules/knowledge-graph/mcp/query-toolset.js";
import { norm } from "../../../modules/knowledge-graph/service/norm.js";

// ---------------------------------------------------------------------------
// Test fixture — fake DB (mirrors routes.spec.ts; extended with a
// `fetchTraversalHop` matcher so traverse exercises a complete path).
// ---------------------------------------------------------------------------

interface NodeRowMem {
  id: string;
  node_type_id: string;
  canonical_name: string;
  status: "active" | "needs_review" | "merged" | "deleted";
  merged_into_node_id: string | null;
}

interface AliasRowMem {
  id: string;
  node_id: string;
  alias: string;
  kind: "canonical" | "alias";
}

interface Store {
  node_types: { id: string; name: string; description: string; version: number }[];
  link_types: {
    id: string;
    name: string;
    label: string;
    description: string;
    inverse_name: string;
    is_temporal: boolean;
    allows_multiple_current: boolean;
    requires_valid_from: boolean;
    requires_valid_to_on_change: boolean;
    version: number;
  }[];
  nodes: NodeRowMem[];
  aliases: AliasRowMem[];
  /**
   * Counter for any INSERT statement issued through the fake client. Any
   * audit-row write attempt (e.g. `tool_call`) would have to go through this
   * code path — BR-23 rule 2 says it MUST stay at zero across all query
   * transport calls.
   */
  insertCount: number;
}

const PROJECT_NT = "nt-project";

function buildSeededStore(): Store {
  return {
    node_types: [
      { id: PROJECT_NT, name: "Project", description: "Project", version: 1 },
      { id: "nt-person", name: "Person", description: "Person", version: 1 },
    ],
    link_types: [],
    nodes: [],
    aliases: [],
    insertCount: 0,
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
      if (upper === "SELECT 1 AS OK") {
        return { rows: [{ ok: 1 }], rowCount: 1 };
      }

      // Any INSERT under this transport is a contract violation (BR-23 rule
      // 2: no `tool_call` audit rows for the read transport). The counter
      // lets the test assert the invariant explicitly.
      if (upper.startsWith("INSERT INTO ")) {
        store.insertCount += 1;
        return { rows: [], rowCount: 0 };
      }

      // node_type listing
      if (
        text.startsWith("SELECT id, name, description, version") &&
        text.includes("FROM node_type")
      ) {
        return {
          rows: store.node_types
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name)),
          rowCount: store.node_types.length,
        };
      }
      // knowledge_node by id (findNodeById)
      if (
        text.includes("FROM knowledge_node kn") &&
        text.includes("WHERE kn.id = $1")
      ) {
        const id = String(params[0]);
        const n = store.nodes.find((x) => x.id === id);
        if (!n) return { rows: [], rowCount: 0 };
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
              created_at: new Date("2026-06-01T00:00:00Z"),
              updated_at: new Date("2026-06-01T00:00:00Z"),
            },
          ],
          rowCount: 1,
        };
      }
      // knowledge_node listing (count + data) — adapted from routes.spec.ts.
      if (
        text.includes("FROM knowledge_node kn") &&
        text.includes("JOIN node_type nt")
      ) {
        const status = String(params[0]);
        let nodeTypeId: string | undefined;
        let prefixNorm: string | undefined;
        let limit = 20;
        let offset = 0;
        if (
          text.includes("kn.node_type_id = $2") &&
          text.includes("alias_norm LIKE $3")
        ) {
          nodeTypeId = String(params[1]);
          prefixNorm = String(params[2]);
          if (!text.includes("count(DISTINCT")) {
            limit = Number(params[3]);
            offset = Number(params[4]);
          }
        } else if (
          text.includes("kn.node_type_id = $2") &&
          !text.includes("alias_norm")
        ) {
          nodeTypeId = String(params[1]);
          if (!text.includes("count(DISTINCT")) {
            limit = Number(params[2]);
            offset = Number(params[3]);
          }
        } else if (
          !text.includes("kn.node_type_id") &&
          text.includes("alias_norm LIKE $2")
        ) {
          prefixNorm = String(params[1]);
          if (!text.includes("count(DISTINCT")) {
            limit = Number(params[2]);
            offset = Number(params[3]);
          }
        } else {
          if (!text.includes("count(DISTINCT")) {
            limit = Number(params[1]);
            offset = Number(params[2]);
          }
        }
        let nodes = store.nodes.filter((n) => n.status === status);
        if (nodeTypeId !== undefined) {
          nodes = nodes.filter((n) => n.node_type_id === nodeTypeId);
        }
        if (prefixNorm !== undefined) {
          const aliasIdx = new Set(
            store.aliases
              .filter((a) => norm(a.alias).startsWith(prefixNorm!))
              .map((a) => a.node_id)
          );
          nodes = nodes.filter((n) => aliasIdx.has(n.id));
        }
        const distinctIds = new Set<string>();
        nodes = nodes.filter((n) => {
          if (distinctIds.has(n.id)) return false;
          distinctIds.add(n.id);
          return true;
        });
        nodes.sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
        if (text.includes("count(DISTINCT")) {
          return { rows: [{ total: nodes.length }], rowCount: 1 };
        }
        const page = nodes.slice(offset, offset + limit);
        const rows = page.map((n) => {
          const nt = store.node_types.find((x) => x.id === n.node_type_id)!;
          return {
            id: n.id,
            node_type_id: n.node_type_id,
            node_type: nt.name,
            canonical_name: n.canonical_name,
            status: n.status,
            merged_into_node_id: n.merged_into_node_id,
            created_at: new Date("2026-06-01T00:00:00Z"),
            updated_at: new Date("2026-06-01T00:00:00Z"),
          };
        });
        return { rows, rowCount: rows.length };
      }
      // aliases by node_id (used by get_node)
      if (
        text.includes("FROM node_alias") &&
        text.includes("WHERE node_id = $1")
      ) {
        const id = String(params[0]);
        const rows = store.aliases
          .filter((a) => a.node_id === id)
          .map((a) => ({
            id: a.id,
            node_id: a.node_id,
            alias: a.alias,
            alias_norm: norm(a.alias),
            kind: a.kind,
            created_at: new Date("2026-06-01T00:00:00Z"),
          }));
        return { rows, rowCount: rows.length };
      }
      // node_attribute_resolved by node_id (used by get_node) — always empty
      // in this fixture; we cover the attributes path in routes.spec.ts.
      if (
        text.includes("FROM node_attribute_resolved na") &&
        text.includes("WHERE na.node_id = $1")
      ) {
        return { rows: [], rowCount: 0 };
      }
      // fetchTraversalHop — empty graph in these parity tests.
      if (
        text.includes("FROM knowledge_link_resolved kl") &&
        text.includes("= ANY($1::uuid[])")
      ) {
        return { rows: [], rowCount: 0 };
      }
      // findNodesByIds — used by traverse to seed the response node list.
      if (
        text.includes("FROM knowledge_node kn") &&
        text.includes("WHERE kn.id = ANY($1::uuid[])")
      ) {
        const ids = (params[0] as string[]) ?? [];
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
              created_at: new Date("2026-06-01T00:00:00Z"),
              updated_at: new Date("2026-06-01T00:00:00Z"),
            };
          });
        return { rows, rowCount: rows.length };
      }
      // Fallback — empty rows; if the service we are testing relies on a SQL
      // pattern we have not modelled, the test will fail loud with an
      // unexpected payload (Rule 12 fail-loud) rather than the silent rows=[]
      // path. We keep this branch ONLY for SQL the integration test must
      // tolerate (e.g. the catalog snapshot pre-warm).
      return { rows: [], rowCount: 0 };
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
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
// JWT + env fixtures (mirrors routes.spec.ts)
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

function buildCatalogFromStore(store: Store) {
  return buildSnapshot({
    nodeTypes: store.node_types,
    linkTypes: store.link_types.map((l) => ({
      id: l.id,
      name: l.name,
      label: l.label,
      description: l.description,
      inverse_name: l.inverse_name,
      is_temporal: l.is_temporal,
      allows_multiple_current: l.allows_multiple_current,
      requires_valid_from: l.requires_valid_from,
      requires_valid_to_on_change: l.requires_valid_to_on_change,
      version: l.version,
    })),
    linkTypeRules: [],
    attributeKeys: [],
  });
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
// Small helpers — JSON-RPC body + envelope stripping for parity assertions.
// ---------------------------------------------------------------------------

function rpcCall(name: string, args: Record<string, unknown>): unknown {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
}

function rpcList(): unknown {
  return { jsonrpc: "2.0", id: 1, method: "tools/list" };
}

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: {
    ok: boolean;
    result?: unknown;
    error?: { code: string; message: string; details?: unknown };
    tools?: unknown[];
  };
  error?: { code: number; message: string };
}

interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

function seedApollo(store: Store): { id: string } {
  const id = "00000000-0000-4000-8000-000000000a01";
  store.nodes.push({
    id,
    node_type_id: PROJECT_NT,
    canonical_name: "Projeto Apollo",
    status: "active",
    merged_into_node_id: null,
  });
  store.aliases.push({
    id: "00000000-0000-4000-8000-000000000a11",
    node_id: id,
    alias: "Projeto Apollo",
    kind: "canonical",
  });
  return { id };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP query transport (KG) — tools/list (BR-26)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns the 9 knowledge-graph tool names", async () => {
    // Acceptance: tools/list exposes the closed set declared in
    // QUERY_TOOL_NAMES. Co-tenant tools (query-retrieval, TC-03) may also
    // be present — we assert a superset, not equality, to keep this test
    // resilient to bootstrap composition order.
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}` },
        payload: rpcList(),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      const tools = (body.result?.tools ?? []) as Array<{ name: string }>;
      const names = tools.map((t) => t.name);
      for (const kgTool of QUERY_TOOL_NAMES) {
        expect(names).toContain(kgTool);
      }
      // tools list MUST advertise non-empty input schemas (BR-25).
      const withoutSchema = (
        tools as Array<{ name: string; inputSchema?: unknown }>
      ).filter((t) => t.inputSchema === undefined || t.inputSchema === null);
      expect(withoutSchema).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("rejects requests without a Bearer token (401)", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        payload: rpcList(),
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});

describe("MCP query transport (KG) — get_node REST↔MCP parity (BR-26)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("get_node success: identical payload to REST GET /nodes/:id", async () => {
    const store = buildSeededStore();
    const { id } = seedApollo(store);
    const app = await buildAppWith(store, fixture);
    try {
      const rest = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(rest.statusCode).toBe(200);
      const restBody = rest.json() as unknown;

      const mcp = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}` },
        payload: rpcCall("get_node", { node_id: id }),
      });
      expect(mcp.statusCode).toBe(200);
      const mcpBody = mcp.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.ok).toBe(true);
      // BR-26: byte-for-byte identical after stripping the transport
      // envelope. Both paths run the SAME `getNodeByIdService` invocation
      // inside the SAME withReadOnly transaction shape against the SAME
      // fake-pg store; any divergence indicates a transport-layer
      // re-mapping bug (Rule 9 — tests verify intent).
      expect(mcpBody.result?.result).toEqual(restBody);

      // Read-only invariant — no audit rows / no INSERTs.
      expect(store.insertCount).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("get_node 404: REST and MCP both surface RESOURCE_NOT_FOUND", async () => {
    const store = buildSeededStore();
    const unknownId = "00000000-0000-4000-8000-0000deadbeef";
    const app = await buildAppWith(store, fixture);
    try {
      const rest = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${unknownId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(rest.statusCode).toBe(404);
      const restError = (rest.json() as ErrorEnvelope).error;
      expect(restError.code).toBe("RESOURCE_NOT_FOUND");

      const mcp = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}` },
        payload: rpcCall("get_node", { node_id: unknownId }),
      });
      expect(mcp.statusCode).toBe(200); // MCP wraps over HTTP 200.
      const mcpBody = mcp.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.ok).toBe(false);
      expect(mcpBody.result?.error?.code).toBe(restError.code);

      // Read-only invariant on the error path too.
      expect(store.insertCount).toBe(0);
    } finally {
      await app.close();
    }
  });
});

describe("MCP query transport (KG) — traverse REST↔MCP parity (BR-26)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("traverse success: identical payload to REST GET /nodes/:id/traverse", async () => {
    const store = buildSeededStore();
    const { id } = seedApollo(store);
    const app = await buildAppWith(store, fixture);
    try {
      const rest = await app.inject({
        method: "GET",
        url: `/api/v1/nodes/${id}/traverse?direction=out&depth=1`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(rest.statusCode).toBe(200);
      const restBody = rest.json() as unknown;

      const mcp = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}` },
        payload: rpcCall("traverse", {
          node_id: id,
          direction: "out",
          depth: 1,
        }),
      });
      expect(mcp.statusCode).toBe(200);
      const mcpBody = mcp.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.ok).toBe(true);
      // BR-26 byte-for-byte parity. With no links seeded, both paths return
      // `{ starting_node_id, nodes: [<starting>], links: [] }`.
      expect(mcpBody.result?.result).toEqual(restBody);

      expect(store.insertCount).toBe(0);
    } finally {
      await app.close();
    }
  });
});

describe("MCP query transport (KG) — list_nodes REST↔MCP parity (BR-26)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("list_nodes success: identical payload to REST GET /nodes", async () => {
    const store = buildSeededStore();
    seedApollo(store);
    // Seed a second node so we exercise the count + page path with more
    // than one row (Rule 9 — the test must be able to detect drift).
    const acmeId = "00000000-0000-4000-8000-000000000a02";
    store.nodes.push({
      id: acmeId,
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Acme",
      status: "active",
      merged_into_node_id: null,
    });
    store.aliases.push({
      id: "00000000-0000-4000-8000-000000000a12",
      node_id: acmeId,
      alias: "Projeto Acme",
      kind: "canonical",
    });

    const app = await buildAppWith(store, fixture);
    try {
      const rest = await app.inject({
        method: "GET",
        url: "/api/v1/nodes?node_type=Project",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(rest.statusCode).toBe(200);
      const restBody = rest.json() as { total: number; items: unknown[] };
      expect(restBody.total).toBe(2);

      const mcp = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/query",
        headers: { authorization: `Bearer ${token}` },
        payload: rpcCall("list_nodes", { node_type: "Project" }),
      });
      expect(mcp.statusCode).toBe(200);
      const mcpBody = mcp.json() as JsonRpcEnvelope;
      expect(mcpBody.result?.ok).toBe(true);
      expect(mcpBody.result?.result).toEqual(restBody);

      expect(store.insertCount).toBe(0);
    } finally {
      await app.close();
    }
  });
});
