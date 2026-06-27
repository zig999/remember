// Integration tests for the TC-08 compliance-audit routes.
//
// Acceptance criteria covered (validation.criteria of dev_tc_008):
//   - POST /compliance/deletions on active raw -> 201 outcome=deleted + counters
//   - POST /compliance/deletions on already-deleted raw -> 200
//     outcome=noop_already_deleted; same row, zero new audit rows
//   - Fragment with chunks from two raws survives when one raw is deleted
//     (cross-source invariant — BR-06)
//   - Link with provenance from two raws survives when one raw is deleted
//     (cross-source invariant — BR-07)
//   - Legacy orphan tombstone (status=deleted, no compliance_deletion) -> 500
//   - GET /compliance/deletions?executed_from=X&executed_to=Y semi-open range
//   - GET /audit/curation-actions?action=invalid_action -> 422
//
// Strategy mirrors the curation integration suite: a real Fastify app over a
// fake `pg.Pool` whose client matches a small set of SQL templates against an
// in-memory store. JWT auth is signed against a test JWKS the middleware
// accepts.

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

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

interface RawInformationRow {
  id: string;
  content: string;
  content_hash: string;
  status: "active" | "needs_review" | "merged" | "deleted";
  superseded_at: Date | null;
  metadata: Record<string, unknown>;
  original_input: string | null;
}
interface RawChunkRow {
  id: string;
  raw_information_id: string;
  status: "active" | "deleted";
  superseded_at: Date | null;
}
interface InformationFragmentRow {
  id: string;
  status: "proposed" | "accepted" | "rejected" | "superseded" | "deleted";
  superseded_at: Date | null;
}
interface FragmentSourceRow {
  fragment_id: string;
  raw_chunk_id: string;
}
interface KnowledgeLinkRow {
  id: string;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  superseded_at: Date | null;
}
interface NodeAttributeRow {
  id: string;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  superseded_at: Date | null;
}
interface ProvenanceRow {
  id: string;
  link_id: string | null;
  attribute_id: string | null;
  fragment_id: string;
}
interface ComplianceDeletionStoredRow {
  id: string;
  raw_information_id: string;
  reason: string;
  executed_at: Date;
  affected: { chunks: number; fragments: number; links: number; attributes: number };
}
interface CurationActionStoredRow {
  id: string;
  action: string;
  target_kind: string;
  target_id: string | null;
  payload: Record<string, unknown>;
  reason: string | null;
  created_at: Date;
}

interface Store {
  raws: RawInformationRow[];
  chunks: RawChunkRow[];
  fragments: InformationFragmentRow[];
  fragment_sources: FragmentSourceRow[];
  links: KnowledgeLinkRow[];
  attributes: NodeAttributeRow[];
  provenance: ProvenanceRow[];
  compliance_deletions: ComplianceDeletionStoredRow[];
  curation_actions: CurationActionStoredRow[];
}

function buildEmptyStore(): Store {
  return {
    raws: [],
    chunks: [],
    fragments: [],
    fragment_sources: [],
    links: [],
    attributes: [],
    provenance: [],
    compliance_deletions: [],
    curation_actions: [],
  };
}

let nextIdCounter = 1;
function nextUuid(prefix = "99"): string {
  const n = nextIdCounter++;
  return `${prefix}${String(n).padStart(6, "0")}-0000-4000-8000-000000000000`.slice(
    0,
    36
  );
}

const RAW_1 = "11111111-0000-4000-8000-000000000001";
const RAW_2 = "11111111-0000-4000-8000-000000000002";
const RAW_3 = "11111111-0000-4000-8000-000000000003";
const CHUNK_1 = "22222222-0000-4000-8000-000000000001";
const CHUNK_2 = "22222222-0000-4000-8000-000000000002";
const CHUNK_3 = "22222222-0000-4000-8000-000000000003";
const FRAG_1 = "33333333-0000-4000-8000-000000000001";
const FRAG_2 = "33333333-0000-4000-8000-000000000002";
const LINK_1 = "44444444-0000-4000-8000-000000000001";
const LINK_2 = "44444444-0000-4000-8000-000000000002";
const ATTR_1 = "55555555-0000-4000-8000-000000000001";
const MISSING_ID = "99999999-9999-4999-8999-999999999999";

// ---------------------------------------------------------------------------
// Fake pg client — interprets the SQL templates emitted by the repository.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFakeClient(store: Store): any {
  return {
    query: async (sql: string | { text: string }, params: unknown[] = []) => {
      const rawText = typeof sql === "string" ? sql : sql.text;
      const text = rawText.trim();
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

      // ----------- loadRawInformationForUpdate -----------
      if (
        text.includes("FROM raw_information") &&
        text.includes("FOR UPDATE") &&
        text.includes("SELECT id, status")
      ) {
        const id = String(params[0]);
        const row = store.raws.find((r) => r.id === id);
        if (!row) return { rows: [], rowCount: 0 };
        return {
          rows: [{ id: row.id, status: row.status }],
          rowCount: 1,
        };
      }

      // ----------- tombstoneRawInformation -----------
      // BR-04 + BR-18: same UPDATE redacts content AND original_input
      // (CASE preserves null; non-null becomes the literal '[REDACTED]').
      if (
        text.includes("UPDATE raw_information") &&
        text.includes("content        = '[REDACTED]'")
      ) {
        const id = String(params[0]);
        const row = store.raws.find((r) => r.id === id);
        if (!row) return { rows: [], rowCount: 0 };
        row.content = "[REDACTED]";
        if (row.original_input !== null && row.original_input !== undefined) {
          row.original_input = "[REDACTED]";
        }
        row.metadata = { ...row.metadata, compliance_deleted: true };
        row.status = "deleted";
        row.superseded_at = new Date();
        return { rows: [{ id }], rowCount: 1 };
      }

      // ----------- tombstoneRawChunksOfRaw -----------
      // UC-01 step 6: cascades BOTH status='deleted' AND superseded_at=now().
      if (
        text.includes("UPDATE raw_chunk") &&
        text.includes("status        = 'deleted'") &&
        text.includes("superseded_at = now()") &&
        text.includes("WHERE raw_information_id = $1")
      ) {
        const rawId = String(params[0]);
        const rows: { id: string }[] = [];
        for (const ch of store.chunks) {
          if (ch.raw_information_id === rawId && ch.superseded_at === null) {
            ch.status = "deleted";
            ch.superseded_at = new Date();
            rows.push({ id: ch.id });
          }
        }
        return { rows, rowCount: rows.length };
      }

      // ----------- tombstoneCascadedFragments (BR-06) -----------
      // UC-01 step 6: cascades BOTH status='deleted' AND superseded_at=now().
      if (
        text.includes("UPDATE information_fragment AS f") &&
        text.includes("status        = 'deleted'") &&
        text.includes("superseded_at = now()")
      ) {
        const rawId = String(params[0]);
        // For each non-deleted fragment, check predicate.
        const rows: { id: string }[] = [];
        for (const f of store.fragments) {
          if (f.status === "deleted") continue;
          const sources = store.fragment_sources.filter(
            (fs) => fs.fragment_id === f.id
          );
          if (sources.length === 0) continue;
          // EXISTS: any chunk anchored to this raw?
          const anchorsTarget = sources.some((fs) => {
            const ch = store.chunks.find((c) => c.id === fs.raw_chunk_id);
            return ch?.raw_information_id === rawId;
          });
          if (!anchorsTarget) continue;
          // NOT EXISTS: anchor to any OTHER non-deleted raw?
          const anchorsOther = sources.some((fs) => {
            const ch = store.chunks.find((c) => c.id === fs.raw_chunk_id);
            if (!ch) return false;
            if (ch.raw_information_id === rawId) return false;
            const ri = store.raws.find((r) => r.id === ch.raw_information_id);
            return ri && ri.status !== "deleted";
          });
          if (anchorsOther) continue;
          f.status = "deleted";
          f.superseded_at = new Date();
          rows.push({ id: f.id });
        }
        return { rows, rowCount: rows.length };
      }

      // ----------- tombstoneCascadedLinks (BR-07) -----------
      if (
        text.includes("UPDATE knowledge_link AS kl") &&
        text.includes("SET status        = 'deleted'")
      ) {
        const rawId = String(params[0]);
        const rows: { id: string }[] = [];
        for (const kl of store.links) {
          if (kl.status === "deleted") continue;
          const provs = store.provenance.filter((p) => p.link_id === kl.id);
          if (provs.length === 0) continue;
          const anchorsTarget = provs.some((p) => {
            const f = store.fragments.find((ff) => ff.id === p.fragment_id);
            if (!f) return false;
            const fsRows = store.fragment_sources.filter(
              (fs) => fs.fragment_id === f.id
            );
            return fsRows.some((fs) => {
              const ch = store.chunks.find((c) => c.id === fs.raw_chunk_id);
              return ch?.raw_information_id === rawId;
            });
          });
          if (!anchorsTarget) continue;
          const anchorsOther = provs.some((p) => {
            const f = store.fragments.find((ff) => ff.id === p.fragment_id);
            if (!f) return false;
            const fsRows = store.fragment_sources.filter(
              (fs) => fs.fragment_id === f.id
            );
            return fsRows.some((fs) => {
              const ch = store.chunks.find((c) => c.id === fs.raw_chunk_id);
              if (!ch) return false;
              if (ch.raw_information_id === rawId) return false;
              const ri = store.raws.find((r) => r.id === ch.raw_information_id);
              return ri && ri.status !== "deleted";
            });
          });
          if (anchorsOther) continue;
          kl.status = "deleted";
          kl.superseded_at = new Date();
          rows.push({ id: kl.id });
        }
        return { rows, rowCount: rows.length };
      }

      // ----------- tombstoneCascadedAttributes (BR-07) -----------
      if (
        text.includes("UPDATE node_attribute AS na") &&
        text.includes("SET status        = 'deleted'")
      ) {
        const rawId = String(params[0]);
        const rows: { id: string }[] = [];
        for (const na of store.attributes) {
          if (na.status === "deleted") continue;
          const provs = store.provenance.filter(
            (p) => p.attribute_id === na.id
          );
          if (provs.length === 0) continue;
          const anchorsTarget = provs.some((p) => {
            const f = store.fragments.find((ff) => ff.id === p.fragment_id);
            if (!f) return false;
            const fsRows = store.fragment_sources.filter(
              (fs) => fs.fragment_id === f.id
            );
            return fsRows.some((fs) => {
              const ch = store.chunks.find((c) => c.id === fs.raw_chunk_id);
              return ch?.raw_information_id === rawId;
            });
          });
          if (!anchorsTarget) continue;
          const anchorsOther = provs.some((p) => {
            const f = store.fragments.find((ff) => ff.id === p.fragment_id);
            if (!f) return false;
            const fsRows = store.fragment_sources.filter(
              (fs) => fs.fragment_id === f.id
            );
            return fsRows.some((fs) => {
              const ch = store.chunks.find((c) => c.id === fs.raw_chunk_id);
              if (!ch) return false;
              if (ch.raw_information_id === rawId) return false;
              const ri = store.raws.find((r) => r.id === ch.raw_information_id);
              return ri && ri.status !== "deleted";
            });
          });
          if (anchorsOther) continue;
          na.status = "deleted";
          na.superseded_at = new Date();
          rows.push({ id: na.id });
        }
        return { rows, rowCount: rows.length };
      }

      // ----------- insertComplianceDeletion -----------
      if (text.includes("INSERT INTO compliance_deletion")) {
        const id = nextUuid("cd");
        const row: ComplianceDeletionStoredRow = {
          id,
          raw_information_id: String(params[0]),
          reason: String(params[1]),
          executed_at: new Date(),
          affected: {
            chunks: Number(params[2]),
            fragments: Number(params[3]),
            links: Number(params[4]),
            attributes: Number(params[5]),
          },
        };
        store.compliance_deletions.push(row);
        return {
          rows: [
            {
              id: row.id,
              raw_information_id: row.raw_information_id,
              reason: row.reason,
              executed_at: row.executed_at,
              affected: row.affected,
            },
          ],
          rowCount: 1,
        };
      }

      // ----------- findComplianceDeletionByRawId -----------
      if (
        text.includes("FROM compliance_deletion") &&
        text.includes("WHERE raw_information_id = $1") &&
        text.includes("ORDER BY executed_at DESC") &&
        text.includes("LIMIT 1")
      ) {
        const id = String(params[0]);
        const row = store.compliance_deletions
          .filter((r) => r.raw_information_id === id)
          .sort((a, b) => b.executed_at.getTime() - a.executed_at.getTime())[0];
        return row
          ? { rows: [row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }

      // ----------- findComplianceDeletionById -----------
      if (
        text.includes("FROM compliance_deletion") &&
        text.includes("WHERE id = $1") &&
        !text.includes("count(")
      ) {
        const id = String(params[0]);
        const row = store.compliance_deletions.find((r) => r.id === id);
        return row
          ? { rows: [row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }

      // ----------- listComplianceDeletions (data) -----------
      if (
        text.startsWith("SELECT id, raw_information_id, reason, executed_at, affected") &&
        text.includes("FROM compliance_deletion") &&
        text.includes("ORDER BY executed_at DESC")
      ) {
        let rows = [...store.compliance_deletions].sort(
          (a, b) => b.executed_at.getTime() - a.executed_at.getTime()
        );
        let pIdx = 0;
        if (text.includes("raw_information_id = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.raw_information_id === v);
        }
        if (text.includes("executed_at >= $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.executed_at.getTime() >= t);
        }
        if (text.includes("executed_at < $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.executed_at.getTime() < t);
        }
        const limit = Number(params[pIdx++]);
        const offset = Number(params[pIdx++]);
        return {
          rows: rows.slice(offset, offset + limit),
          rowCount: Math.min(rows.length, limit),
        };
      }

      // ----------- listComplianceDeletions (count) -----------
      if (
        text.includes("SELECT count(*)::int AS total") &&
        text.includes("FROM compliance_deletion")
      ) {
        let rows = [...store.compliance_deletions];
        let pIdx = 0;
        if (text.includes("raw_information_id = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.raw_information_id === v);
        }
        if (text.includes("executed_at >= $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.executed_at.getTime() >= t);
        }
        if (text.includes("executed_at < $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.executed_at.getTime() < t);
        }
        return { rows: [{ total: rows.length }], rowCount: 1 };
      }

      // ----------- insertCurationAction -----------
      if (text.includes("INSERT INTO curation_action")) {
        const id = nextUuid("ca");
        const row: CurationActionStoredRow = {
          id,
          action: String(params[0]),
          target_kind: String(params[1]),
          target_id: params[2] === null ? null : String(params[2]),
          payload: JSON.parse(String(params[3])),
          reason: params[4] === null ? null : String(params[4]),
          created_at: new Date(),
        };
        store.curation_actions.push(row);
        return {
          rows: [
            {
              id: row.id,
              action: row.action,
              target_kind: row.target_kind,
              target_id: row.target_id,
              payload: row.payload,
              reason: row.reason,
              created_at: row.created_at,
            },
          ],
          rowCount: 1,
        };
      }

      // ----------- findCurationActionById -----------
      if (
        text.includes("FROM curation_action") &&
        text.includes("WHERE id = $1") &&
        !text.includes("count(")
      ) {
        const id = String(params[0]);
        const row = store.curation_actions.find((r) => r.id === id);
        return row
          ? { rows: [row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }

      // ----------- listCurationActions (data) -----------
      if (
        text.startsWith("SELECT id, action, target_kind, target_id, payload, reason, created_at") &&
        text.includes("FROM curation_action") &&
        text.includes("ORDER BY created_at DESC")
      ) {
        let rows = [...store.curation_actions].sort(
          (a, b) => b.created_at.getTime() - a.created_at.getTime()
        );
        let pIdx = 0;
        if (text.includes("action = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.action === v);
        }
        if (text.includes("target_kind = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.target_kind === v);
        }
        if (text.includes("target_id = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.target_id === v);
        }
        if (text.includes("created_at >= $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.created_at.getTime() >= t);
        }
        if (text.includes("created_at < $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.created_at.getTime() < t);
        }
        const limit = Number(params[pIdx++]);
        const offset = Number(params[pIdx++]);
        return {
          rows: rows.slice(offset, offset + limit),
          rowCount: Math.min(rows.length, limit),
        };
      }

      // ----------- listCurationActions (count) -----------
      if (
        text.includes("SELECT count(*)::int AS total") &&
        text.includes("FROM curation_action")
      ) {
        let rows = [...store.curation_actions];
        let pIdx = 0;
        if (text.includes("action = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.action === v);
        }
        if (text.includes("target_kind = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.target_kind === v);
        }
        if (text.includes("target_id = $")) {
          const v = String(params[pIdx++]);
          rows = rows.filter((r) => r.target_id === v);
        }
        if (text.includes("created_at >= $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.created_at.getTime() >= t);
        }
        if (text.includes("created_at < $")) {
          const v = String(params[pIdx++]);
          const t = Date.parse(v);
          rows = rows.filter((r) => r.created_at.getTime() < t);
        }
        return { rows: [{ total: rows.length }], rowCount: 1 };
      }

      throw new Error(`fake client: unknown SQL: ${text.slice(0, 200)}`);
    },
    release: () => undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFakePool(store: Store): any {
  const client = buildFakeClient(store);
  return {
    connect: async () => client,
    on: () => undefined,
    end: async () => undefined,
  };
}

// ---------------------------------------------------------------------------
// Fixtures + Auth
// ---------------------------------------------------------------------------

const envFixture = Object.freeze({
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
  return buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    // No catalog — compliance-audit routes do not depend on it.
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Compliance-Audit — UC-01 complianceDeleteRawInformation", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("returns 201 outcome=deleted on an active raw with full cascade", async () => {
    // Setup: 1 raw with 3 chunks, 1 fragment anchored to chunk_1 only,
    // 1 link with provenance pointing to that fragment, 1 attribute likewise.
    const store = buildEmptyStore();
    store.raws.push({
      id: RAW_1,
      content: "original",
      content_hash: "a".repeat(64),
      status: "active",
      superseded_at: null,
      metadata: { author: "alice" },
      original_input: null,
    });
    store.chunks.push(
      { id: CHUNK_1, raw_information_id: RAW_1, status: "active", superseded_at: null },
      { id: CHUNK_2, raw_information_id: RAW_1, status: "active", superseded_at: null },
      { id: CHUNK_3, raw_information_id: RAW_1, status: "active", superseded_at: null }
    );
    store.fragments.push({ id: FRAG_1, status: "accepted", superseded_at: null });
    store.fragment_sources.push({ fragment_id: FRAG_1, raw_chunk_id: CHUNK_1 });
    store.links.push({ id: LINK_1, status: "active", superseded_at: null });
    store.provenance.push({
      id: nextUuid("p"),
      link_id: LINK_1,
      attribute_id: null,
      fragment_id: FRAG_1,
    });
    store.attributes.push({ id: ATTR_1, status: "active", superseded_at: null });
    store.provenance.push({
      id: nextUuid("p"),
      link_id: null,
      attribute_id: ATTR_1,
      fragment_id: FRAG_1,
    });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "LGPD request" },
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.outcome).toBe("deleted");
      expect(body.deletion.raw_information_id).toBe(RAW_1);
      expect(body.deletion.reason).toBe("LGPD request");
      expect(body.deletion.affected).toEqual({
        chunks: 3,
        fragments: 1,
        links: 1,
        attributes: 1,
      });

      // BR-04 — content redacted; metadata flag set; content_hash preserved.
      const raw = store.raws.find((r) => r.id === RAW_1)!;
      expect(raw.content).toBe("[REDACTED]");
      expect(raw.metadata.compliance_deleted).toBe(true);
      expect(raw.metadata.author).toBe("alice"); // preserved
      expect(raw.content_hash).toBe("a".repeat(64));
      // BR-05 — status + superseded_at.
      expect(raw.status).toBe("deleted");
      expect(raw.superseded_at).not.toBeNull();
      // BR-06/07 — derived rows tombstoned: UC-01 step 6 cascades BOTH
      // status='deleted' AND superseded_at (a row missing either would stay
      // visible in is_current filters or in retrieval — §5.4, §11).
      expect(
        store.chunks.every(
          (c) => c.status === "deleted" && c.superseded_at !== null
        )
      ).toBe(true);
      expect(store.fragments[0]!.status).toBe("deleted");
      expect(store.fragments[0]!.superseded_at).not.toBeNull();
      expect(store.links[0]!.status).toBe("deleted");
      expect(store.attributes[0]!.status).toBe("deleted");
      // BR-08 — exactly one row in each audit table.
      expect(store.compliance_deletions).toHaveLength(1);
      expect(store.curation_actions).toHaveLength(1);
      const ca = store.curation_actions[0]!;
      expect(ca.action).toBe("compliance_delete");
      expect(ca.target_kind).toBe("raw_information");
      expect(ca.target_id).toBe(RAW_1);
      expect(ca.reason).toBe("LGPD request");
      expect(ca.payload).toEqual({
        reason: "LGPD request",
        affected: { chunks: 3, fragments: 1, links: 1, attributes: 1 },
      });
    } finally {
      await app.close();
    }
  });

  it("returns 200 outcome=noop_already_deleted on the second call (BR-03)", async () => {
    const store = buildEmptyStore();
    store.raws.push({
      id: RAW_1,
      content: "original",
      content_hash: "a".repeat(64),
      status: "active",
      superseded_at: null,
      metadata: {},
      original_input: null,
    });

    const app = await buildAppWith(store, fixture);
    try {
      // First call -> 201 deleted.
      const r1 = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "first" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(r1.statusCode).toBe(201);
      const firstDeletion = r1.json().deletion;

      const audit1Count = store.compliance_deletions.length;
      const action1Count = store.curation_actions.length;

      // Second call -> 200 noop_already_deleted, SAME deletion row.
      const r2 = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "retry" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(r2.statusCode).toBe(200);
      const body = r2.json();
      expect(body.outcome).toBe("noop_already_deleted");
      expect(body.deletion.id).toBe(firstDeletion.id);
      expect(body.deletion.reason).toBe("first"); // original reason preserved

      // Zero new rows in either audit table.
      expect(store.compliance_deletions.length).toBe(audit1Count);
      expect(store.curation_actions.length).toBe(action1Count);
    } finally {
      await app.close();
    }
  });

  it("returns 404 RESOURCE_NOT_FOUND when raw_information_id does not exist (UC-01 alt 4a)", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: MISSING_ID, reason: "any" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("returns 500 SYSTEM_INTERNAL_ERROR on legacy orphan tombstone (UC-01 alt 4c, BR-17)", async () => {
    // Raw is already 'deleted' but no compliance_deletion row exists.
    const store = buildEmptyStore();
    store.raws.push({
      id: RAW_1,
      content: "[REDACTED]",
      content_hash: "a".repeat(64),
      status: "deleted",
      superseded_at: new Date(),
      metadata: { compliance_deleted: true },
      original_input: null,
    });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "anything" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(500);
      expect(res.json().error.code).toBe("SYSTEM_INTERNAL_ERROR");
      // No new rows created.
      expect(store.compliance_deletions).toHaveLength(0);
      expect(store.curation_actions).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it("survives cross-source fragments (BR-06)", async () => {
    // A fragment anchored to chunks of BOTH RAW_1 and RAW_2. Delete RAW_1
    // only — fragment must survive (cross-source invariant).
    const store = buildEmptyStore();
    store.raws.push(
      {
        id: RAW_1,
        content: "x",
        content_hash: "a".repeat(64),
        status: "active",
        superseded_at: null,
        metadata: {},
        original_input: null,
      },
      {
        id: RAW_2,
        content: "y",
        content_hash: "b".repeat(64),
        status: "active",
        superseded_at: null,
        metadata: {},
        original_input: null,
      }
    );
    store.chunks.push(
      { id: CHUNK_1, raw_information_id: RAW_1, status: "active", superseded_at: null },
      { id: CHUNK_2, raw_information_id: RAW_2, status: "active", superseded_at: null }
    );
    // FRAG_1 has sources in BOTH raws (cross-source).
    store.fragments.push({
      id: FRAG_1,
      status: "accepted",
      superseded_at: null,
    });
    store.fragment_sources.push(
      { fragment_id: FRAG_1, raw_chunk_id: CHUNK_1 },
      { fragment_id: FRAG_1, raw_chunk_id: CHUNK_2 }
    );

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "lgpd" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().deletion.affected.fragments).toBe(0);
      // Fragment unchanged.
      expect(store.fragments[0]!.status).toBe("accepted");
    } finally {
      await app.close();
    }
  });

  it("survives cross-source links (BR-07)", async () => {
    // A link with provenance pointing to TWO fragments — one anchored in
    // RAW_1 only, one anchored in RAW_2 only. Deleting RAW_1 must leave the
    // link active (cross-source provenance).
    const store = buildEmptyStore();
    store.raws.push(
      {
        id: RAW_1,
        content: "x",
        content_hash: "a".repeat(64),
        status: "active",
        superseded_at: null,
        metadata: {},
        original_input: null,
      },
      {
        id: RAW_2,
        content: "y",
        content_hash: "b".repeat(64),
        status: "active",
        superseded_at: null,
        metadata: {},
        original_input: null,
      }
    );
    store.chunks.push(
      { id: CHUNK_1, raw_information_id: RAW_1, status: "active", superseded_at: null },
      { id: CHUNK_2, raw_information_id: RAW_2, status: "active", superseded_at: null }
    );
    store.fragments.push(
      { id: FRAG_1, status: "accepted", superseded_at: null },
      { id: FRAG_2, status: "accepted", superseded_at: null }
    );
    store.fragment_sources.push(
      { fragment_id: FRAG_1, raw_chunk_id: CHUNK_1 },
      { fragment_id: FRAG_2, raw_chunk_id: CHUNK_2 }
    );
    store.links.push({ id: LINK_2, status: "active", superseded_at: null });
    store.provenance.push(
      {
        id: nextUuid("p"),
        link_id: LINK_2,
        attribute_id: null,
        fragment_id: FRAG_1,
      },
      {
        id: nextUuid("p"),
        link_id: LINK_2,
        attribute_id: null,
        fragment_id: FRAG_2,
      }
    );

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "lgpd" },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(201);
      // Fragment 1 (anchored only to deleted raw) -> deleted.
      // Fragment 2 (anchored only to surviving raw) -> still accepted.
      expect(store.fragments.find((f) => f.id === FRAG_1)!.status).toBe(
        "deleted"
      );
      expect(store.fragments.find((f) => f.id === FRAG_2)!.status).toBe(
        "accepted"
      );
      // Link survives — its provenance still anchors to FRAG_2.
      expect(store.links[0]!.status).toBe("active");
      expect(res.json().deletion.affected.links).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("rejects missing reason with 422 VALIDATION_REQUIRED_FIELD (BR-01)", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1 },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error.code).toBe("VALIDATION_REQUIRED_FIELD");
    } finally {
      await app.close();
    }
  });

  it("rejects empty-after-trim reason with 422 VALIDATION_OUT_OF_RANGE (BR-01)", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "   " },
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error.code).toBe("VALIDATION_OUT_OF_RANGE");
    } finally {
      await app.close();
    }
  });

  it("returns 401 when JWT is missing", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        payload: { raw_information_id: RAW_1, reason: "any" },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe("AUTH_UNAUTHORIZED");
    } finally {
      await app.close();
    }
  });
});

describe("Compliance-Audit — UC-02 list, UC-03 by-id", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("applies executed_from/executed_to as semi-open range (BR-09)", async () => {
    const store = buildEmptyStore();
    const now = Date.now();
    store.compliance_deletions.push(
      {
        id: nextUuid("cd"),
        raw_information_id: RAW_1,
        reason: "r1",
        executed_at: new Date(now - 3_600_000),
        affected: { chunks: 0, fragments: 0, links: 0, attributes: 0 },
      },
      {
        id: nextUuid("cd"),
        raw_information_id: RAW_2,
        reason: "r2",
        executed_at: new Date(now),
        affected: { chunks: 0, fragments: 0, links: 0, attributes: 0 },
      },
      {
        id: nextUuid("cd"),
        raw_information_id: RAW_3,
        reason: "r3",
        executed_at: new Date(now + 3_600_000),
        affected: { chunks: 0, fragments: 0, links: 0, attributes: 0 },
      }
    );
    const app = await buildAppWith(store, fixture);
    try {
      const fromIso = new Date(now).toISOString();
      const toIso = new Date(now + 3_600_000).toISOString();
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/compliance/deletions?executed_from=${fromIso}&executed_to=${toIso}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      // Inclusive `from` -> RAW_2 included; exclusive `to` -> RAW_3 excluded.
      expect(body.items).toHaveLength(1);
      expect(body.items[0]!.reason).toBe("r2");
      expect(body.total).toBe(1);
    } finally {
      await app.close();
    }
  });

  it("rejects executed_from >= executed_to with 422 VALIDATION_OUT_OF_RANGE", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/compliance/deletions?executed_from=2026-06-30T00:00:00Z&executed_to=2026-06-30T00:00:00Z`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error.code).toBe("VALIDATION_OUT_OF_RANGE");
    } finally {
      await app.close();
    }
  });

  it("GET by id returns 404 RESOURCE_NOT_FOUND for missing row", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/compliance/deletions/${MISSING_ID}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("GET by id returns the audit row", async () => {
    const store = buildEmptyStore();
    const cdId = nextUuid("cd");
    store.compliance_deletions.push({
      id: cdId,
      raw_information_id: RAW_1,
      reason: "x",
      executed_at: new Date("2026-06-01T00:00:00Z"),
      affected: { chunks: 1, fragments: 2, links: 3, attributes: 4 },
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/compliance/deletions/${cdId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(cdId);
      expect(body.affected).toEqual({
        chunks: 1,
        fragments: 2,
        links: 3,
        attributes: 4,
      });
    } finally {
      await app.close();
    }
  });
});

describe("Compliance-Audit — UC-04 list, UC-05 by-id (curation_action)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("rejects unknown action filter with 422 VALIDATION_INVALID_FORMAT (BR-10)", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/audit/curation-actions?action=invalid_action`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error.code).toBe("VALIDATION_INVALID_FORMAT");
    } finally {
      await app.close();
    }
  });

  it("filters by action=compliance_delete", async () => {
    const store = buildEmptyStore();
    store.curation_actions.push(
      {
        id: nextUuid("ca"),
        action: "compliance_delete",
        target_kind: "raw_information",
        target_id: RAW_1,
        payload: {},
        reason: "x",
        created_at: new Date(),
      },
      {
        id: nextUuid("ca"),
        action: "merge_nodes",
        target_kind: "node",
        target_id: null,
        payload: {},
        reason: null,
        created_at: new Date(),
      }
    );
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/audit/curation-actions?action=compliance_delete`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]!.action).toBe("compliance_delete");
      expect(body.items[0]!.target_id).toBe(RAW_1);
      expect(body.total).toBe(1);
    } finally {
      await app.close();
    }
  });

  it("GET by id returns the curation_action row", async () => {
    const store = buildEmptyStore();
    const caId = nextUuid("ca");
    store.curation_actions.push({
      id: caId,
      action: "reject_item",
      target_kind: "link",
      target_id: LINK_1,
      payload: { foo: "bar" },
      reason: "rejected",
      created_at: new Date(),
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/audit/curation-actions/${caId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(caId);
      expect(body.action).toBe("reject_item");
      expect(body.payload).toEqual({ foo: "bar" });
    } finally {
      await app.close();
    }
  });

  it("GET by id returns 404 for missing curation_action", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/audit/curation-actions/${MISSING_ID}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});
