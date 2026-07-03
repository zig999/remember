// Integration tests for the TC-mcc-04 MCP curation transport REST↔MCP PARITY.
//
// Acceptance criteria (validation.criteria of dev_tc_mcc_004 — curation.back.md
// BR-32 plus compliance-audit.back.md BR-14 testing row):
//
//   1. Success parity        — REST POST /api/v1/curation/<verb> and MCP
//                              tools/call <verb> on the SAME seeded fixture
//                              return byte-identical payloads after the
//                              transport envelope is stripped.
//   2. Error-code parity     — on forced-error cases (BUSINESS_REVIEW_NOT_PENDING,
//                              BUSINESS_INVALID_TARGET_NODE, BUSINESS_DATE_UNJUSTIFIED,
//                              VALIDATION_INVALID_FORMAT) REST and MCP surface
//                              the same `error.code` via the shared mapper of
//                              BR-30.
//   3. Audit parity          — every successful tool call on EITHER transport
//                              writes EXACTLY ONE curation_action row. The
//                              insertCount probe on the fake-pg client
//                              guarantees REST and MCP issue the same number of
//                              INSERT INTO curation_action statements per call.
//   4. Whitelist enforcement — tools/call on `propose_node` (ingest) and
//                              `get_node` (query) returns { ok: false,
//                              error.code: 'NOT_FOUND' } — even though both
//                              tools live on the SAME McpServer instance
//                              under different toolset keys (BR-29 rule 5).
//   5. compliance_delete     — REST POST /api/v1/compliance/deletions and MCP
//                              tools/call compliance_delete produce the same
//                              `{ outcome, deletion }` discriminated union; on
//                              forced-error (`raw_information_id` missing) BOTH
//                              transports carry the SAME canonical
//                              `RESOURCE_NOT_FOUND` code (P2.1 taxonomy —
//                              compliance-audit.back.md BR-15 v1.4.0). The
//                              pre-P2.1 `NOT_FOUND` short code on MCP has been
//                              retired.
//
// Strategy (Rule 11 — match the codebase's conventions): copy the fake-pg
// Store + buildFakeClient pattern from `curation/routes.spec.ts` (already
// covers seven of the eight tools end-to-end) and extend it with the FIVE
// extra tables exercised by `compliance_delete` (raw_information, raw_chunk,
// information_fragment, fragment_source, provenance, compliance_deletion).
// This keeps REST and MCP on the SAME seeded fixture per the BR-32 contract.
//
// No real DB, no real network: every pg query is intercepted by the in-memory
// client. JWKS / JWT are signed against the same test key pair the rest of
// the integration suite uses (`generateKeyPair` + `SignJWT`, jose).

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
import { buildSnapshot as buildIngestionSnapshot } from "../../../modules/ingestion/catalog/catalog.js";

// ---------------------------------------------------------------------------
// In-memory store — same shape as curation/routes.spec.ts (curation tables)
// extended with the five compliance-audit tables required by `complianceDelete`.
// ---------------------------------------------------------------------------

interface NodeRow {
  id: string;
  node_type_id: string;
  canonical_name: string;
  status: "active" | "needs_review" | "merged" | "deleted";
  merged_into_node_id: string | null;
}
interface AliasRow {
  id: string;
  node_id: string;
  alias: string;
  kind: "canonical" | "alias";
}
interface LinkRow {
  id: string;
  source_node_id: string;
  target_node_id: string;
  link_type_id: string;
  valid_from: string | null;
  valid_to: string | null;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: string;
  valid_from_source: "stated" | "document" | "received" | null;
  superseded_at: Date | null;
  supersedes_link_id: string | null;
  recorded_at: Date;
  updated_at: Date;
}
interface AttrRow {
  id: string;
  node_id: string;
  attribute_key_id: string;
  value_type: "date" | "number" | "text" | "bool";
  value: string;
  valid_from: string | null;
  valid_to: string | null;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: string;
  valid_from_source: "stated" | "document" | "received" | null;
  superseded_at: Date | null;
  supersedes_attribute_id: string | null;
  recorded_at: Date;
  updated_at: Date;
}
interface EntityMatchReviewRow {
  id: string;
  node_id: string;
  candidate_node_id: string;
  similarity: string;
  created_at: Date;
}
interface CurationActionRow {
  id: string;
  action: string;
  target_kind: string;
  target_id: string;
  payload: Record<string, unknown>;
  reason: string | null;
  created_at: Date;
}
interface ProvRow {
  id: string;
  link_id: string | null;
  attribute_id: string | null;
  fragment_id: string;
  created_at: Date;
}
interface InformationFragmentRow {
  id: string;
  status: string;
  superseded_at: Date | null;
}
// Compliance tables.
interface RawInformationRow {
  id: string;
  content: string;
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
interface FragmentSourceRow {
  fragment_id: string;
  raw_chunk_id: string;
}
interface ComplianceDeletionStoredRow {
  id: string;
  raw_information_id: string;
  reason: string;
  executed_at: Date;
  affected: { chunks: number; fragments: number; links: number; attributes: number };
}

interface Store {
  nodes: NodeRow[];
  aliases: AliasRow[];
  links: LinkRow[];
  attributes: AttrRow[];
  entity_match_reviews: EntityMatchReviewRow[];
  curation_actions: CurationActionRow[];
  provenance: ProvRow[];
  information_fragments: InformationFragmentRow[];
  raws: RawInformationRow[];
  chunks: RawChunkRow[];
  fragment_sources: FragmentSourceRow[];
  compliance_deletions: ComplianceDeletionStoredRow[];
  /**
   * Total number of INSERT INTO curation_action statements observed. BR-32
   * audit-parity assertion #3 hinges on this counter: REST and MCP must each
   * emit EXACTLY ONE INSERT per successful write tool call. The dedicated
   * field is the same probe pattern as the knowledge-graph parity test
   * (mcp-query-kg.spec.ts `store.insertCount`), scoped here to the audit
   * table so we can also assert ZERO inserts on the no-op compliance_delete
   * (BR-08 — `noop_already_deleted` MUST NOT write an audit row).
   */
  curationActionInsertCount: number;
  node_types: { id: string; name: string }[];
  link_types: { id: string; name: string; allows_multiple_current: boolean }[];
  attribute_keys: {
    id: string;
    node_type_id: string;
    key: string;
    value_type: "date" | "number" | "text" | "bool";
    allows_multiple_current: boolean;
  }[];
  attribute_valid_values: {
    attribute_key_id: string;
    value: string;
  }[];
}

const UUID = {
  PROJECT_NT: "11111111-0000-4000-8000-000000000001",
  PERSON_NT: "11111111-0000-4000-8000-000000000002",
  LT_DEPENDS: "22222222-0000-4000-8000-000000000001",
  AK_DEADLINE: "33333333-0000-4000-8000-000000000001",
  AK_EMAIL: "33333333-0000-4000-8000-000000000002",
  FRAG_ACCEPTED: "44444444-0000-4000-8000-000000000001",
  FRAG_PROPOSED: "44444444-0000-4000-8000-0000000000fe",
};

let nextIdCounter = 1;
function nextUuid(prefix = "99"): string {
  const n = nextIdCounter++;
  return `${prefix}${String(n).padStart(6, "0")}-0000-4000-8000-000000000000`.slice(
    0,
    36
  );
}

function buildEmptyStore(): Store {
  return {
    nodes: [],
    aliases: [],
    links: [],
    attributes: [],
    entity_match_reviews: [],
    curation_actions: [],
    provenance: [],
    information_fragments: [
      { id: UUID.FRAG_ACCEPTED, status: "accepted", superseded_at: null },
      // Forced-error fixture for BR-32 assertion #2 — `correct_item` with a
      // fragment whose status='proposed' must raise BUSINESS_DATE_UNJUSTIFIED.
      { id: UUID.FRAG_PROPOSED, status: "proposed", superseded_at: null },
    ],
    raws: [],
    chunks: [],
    fragment_sources: [],
    compliance_deletions: [],
    curationActionInsertCount: 0,
    node_types: [
      { id: UUID.PROJECT_NT, name: "Project" },
      { id: UUID.PERSON_NT, name: "Person" },
    ],
    link_types: [
      {
        id: UUID.LT_DEPENDS,
        name: "depends_on",
        allows_multiple_current: false,
      },
    ],
    attribute_keys: [
      {
        id: UUID.AK_DEADLINE,
        node_type_id: UUID.PROJECT_NT,
        key: "deadline",
        value_type: "date",
        allows_multiple_current: false,
      },
      {
        id: UUID.AK_EMAIL,
        node_type_id: UUID.PERSON_NT,
        key: "email",
        value_type: "text",
        allows_multiple_current: true,
      },
    ],
    attribute_valid_values: [],
  };
}

function countUpdate(_store: Store, _rowId: string): void {
  // BR-20 single-UPDATE invariant is asserted in routes.spec.ts; this test
  // does not need the per-row counter, but we keep the helper signature so
  // the SQL-pattern matchers below stay byte-aligned with routes.spec.ts
  // (Rule 11 — match conventions).
}

// ---------------------------------------------------------------------------
// Fake pg client — same matcher set as curation/routes.spec.ts (preserved
// VERBATIM where possible) extended with the five compliance-audit tables.
// Where a matcher is duplicated from routes.spec.ts, the comment is the
// original one so a reader who already knows that file recognises the shape.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFakeClient(store: Store): any {
  const fakeClient = {
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

      // ============ Curation: loadNodesForUpdate ============
      if (
        text.includes("FROM knowledge_node") &&
        text.includes("WHERE id = ANY($1::uuid[])") &&
        text.includes("FOR UPDATE")
      ) {
        const ids = params[0] as string[];
        const rows = store.nodes
          .filter((n) => ids.includes(n.id))
          .map((n) => ({
            id: n.id,
            node_type_id: n.node_type_id,
            canonical_name: n.canonical_name,
            status: n.status,
            merged_into_node_id: n.merged_into_node_id,
          }));
        return { rows, rowCount: rows.length };
      }

      // ============ Curation: UPDATE keep_separate ============
      if (
        text.includes("UPDATE knowledge_node") &&
        text.includes("SET status = 'active'") &&
        text.includes("AND status = 'needs_review'")
      ) {
        const id = String(params[0]);
        const node = store.nodes.find((n) => n.id === id);
        if (!node || node.status !== "needs_review") {
          return { rows: [], rowCount: 0 };
        }
        node.status = "active";
        return { rows: [{ id }], rowCount: 1 };
      }

      // ============ Curation: UPDATE node merged ============
      if (
        text.includes("UPDATE knowledge_node") &&
        text.includes("SET status = 'merged'") &&
        text.includes("merged_into_node_id = $2")
      ) {
        const absorbedId = String(params[0]);
        const survivorId = String(params[1]);
        const node = store.nodes.find((n) => n.id === absorbedId);
        if (
          !node ||
          (node.status !== "active" && node.status !== "needs_review")
        ) {
          return { rows: [], rowCount: 0 };
        }
        node.status = "merged";
        node.merged_into_node_id = survivorId;
        return { rows: [{ id: absorbedId }], rowCount: 1 };
      }

      // ============ Curation: UPDATE path compression ============
      if (
        text.includes("UPDATE knowledge_node") &&
        text.includes("SET merged_into_node_id = $2") &&
        text.includes("WHERE merged_into_node_id = $1")
      ) {
        const oldTarget = String(params[0]);
        const newTarget = String(params[1]);
        const rows: { id: string }[] = [];
        for (const n of store.nodes) {
          if (n.merged_into_node_id === oldTarget) {
            n.merged_into_node_id = newTarget;
            rows.push({ id: n.id });
          }
        }
        return { rows, rowCount: rows.length };
      }

      // ============ Curation: INSERT copy aliases ============
      if (
        text.includes("INSERT INTO node_alias") &&
        text.includes("ON CONFLICT (node_id, alias_norm) DO NOTHING")
      ) {
        const absorbedId = String(params[0]);
        const survivorId = String(params[1]);
        const survivorNorms = new Set(
          store.aliases
            .filter((a) => a.node_id === survivorId)
            .map((a) => a.alias.toLowerCase())
        );
        const rows: { id: string }[] = [];
        for (const a of store.aliases.filter(
          (a) => a.node_id === absorbedId
        )) {
          const norm = a.alias.toLowerCase();
          if (survivorNorms.has(norm)) continue;
          const newId = nextUuid("aa");
          store.aliases.push({
            id: newId,
            node_id: survivorId,
            alias: a.alias,
            kind: "alias",
          });
          survivorNorms.add(norm);
          rows.push({ id: newId });
        }
        return { rows, rowCount: rows.length };
      }

      // ============ Curation: UPDATE repoint links ============
      if (
        text.includes("UPDATE knowledge_link") &&
        text.includes("CASE WHEN source_node_id = $1") &&
        text.includes("WHERE source_node_id = $1") &&
        text.includes("OR target_node_id = $1")
      ) {
        const absorbedId = String(params[0]);
        const survivorId = String(params[1]);
        const rows: { id: string }[] = [];
        for (const l of store.links) {
          let changed = false;
          if (l.source_node_id === absorbedId) {
            l.source_node_id = survivorId;
            changed = true;
          }
          if (l.target_node_id === absorbedId) {
            l.target_node_id = survivorId;
            changed = true;
          }
          if (changed) rows.push({ id: l.id });
        }
        return { rows, rowCount: rows.length };
      }

      // ============ Curation: UPDATE repoint attributes ============
      if (
        text.includes("UPDATE node_attribute") &&
        text.includes("SET node_id = $2") &&
        text.includes("WHERE node_id = $1")
      ) {
        const absorbedId = String(params[0]);
        const survivorId = String(params[1]);
        const rows: { id: string }[] = [];
        for (const a of store.attributes) {
          if (a.node_id === absorbedId) {
            a.node_id = survivorId;
            rows.push({ id: a.id });
          }
        }
        return { rows, rowCount: rows.length };
      }

      // ============ Curation: DELETE entity_match_review ============
      if (
        text.includes("DELETE FROM entity_match_review") &&
        text.includes("WHERE node_id = $1")
      ) {
        const id = String(params[0]);
        const before = store.entity_match_reviews.length;
        store.entity_match_reviews = store.entity_match_reviews.filter(
          (r) => r.node_id !== id
        );
        const removed = before - store.entity_match_reviews.length;
        return {
          rows: Array.from({ length: removed }).map(() => ({ id: nextUuid() })),
          rowCount: removed,
        };
      }

      // ============ Curation + Compliance: INSERT curation_action ============
      // Probe: BR-32 audit-parity #3 — one INSERT per successful write tool
      // call on EITHER transport.
      if (text.includes("INSERT INTO curation_action")) {
        const action = String(params[0]);
        const targetKind = String(params[1]);
        const targetId = String(params[2]);
        const payload = JSON.parse(String(params[3]));
        const reason = params[4] === null ? null : String(params[4]);
        const id = nextUuid("ca");
        const row: CurationActionRow = {
          id,
          action,
          target_kind: targetKind,
          target_id: targetId,
          payload,
          reason,
          created_at: new Date(),
        };
        store.curation_actions.push(row);
        store.curationActionInsertCount += 1;
        return {
          rows: [{ id, created_at: row.created_at }],
          rowCount: 1,
        };
      }

      // ============ Curation: loadItemsForUpdate (link) ============
      if (
        text.includes("FROM knowledge_link") &&
        text.includes("WHERE id = ANY($1::uuid[])") &&
        text.includes("FOR UPDATE") &&
        text.includes("supersedes_link_id")
      ) {
        const ids = params[0] as string[];
        const rows = store.links
          .filter((l) => ids.includes(l.id))
          .map((l) => ({
            id: l.id,
            source_node_id: l.source_node_id,
            target_node_id: l.target_node_id,
            link_type_id: l.link_type_id,
            valid_from: l.valid_from,
            valid_to: l.valid_to,
            status: l.status,
            confidence: l.confidence,
            valid_from_source: l.valid_from_source,
            superseded_at: l.superseded_at,
            supersedes_id: l.supersedes_link_id,
          }));
        return { rows, rowCount: rows.length };
      }

      // ============ Curation: loadItemsForUpdate (attribute) ============
      if (
        text.includes("FROM node_attribute") &&
        text.includes("WHERE id = ANY($1::uuid[])") &&
        text.includes("FOR UPDATE") &&
        text.includes("supersedes_attribute_id")
      ) {
        const ids = params[0] as string[];
        const rows = store.attributes
          .filter((a) => ids.includes(a.id))
          .map((a) => ({
            id: a.id,
            node_id: a.node_id,
            attribute_key_id: a.attribute_key_id,
            value_type: a.value_type,
            value: a.value,
            valid_from: a.valid_from,
            valid_to: a.valid_to,
            status: a.status,
            confidence: a.confidence,
            valid_from_source: a.valid_from_source,
            superseded_at: a.superseded_at,
            supersedes_id: a.supersedes_attribute_id,
          }));
        return { rows, rowCount: rows.length };
      }

      // ============ Curation: confirmItem (link / attr) ============
      if (
        text.includes("UPDATE knowledge_link") &&
        text.includes("SET status = 'active'") &&
        text.includes("AND status = 'uncertain'")
      ) {
        const id = String(params[0]);
        const link = store.links.find((l) => l.id === id);
        if (!link || link.status !== "uncertain") {
          return { rows: [], rowCount: 0 };
        }
        link.status = "active";
        countUpdate(store, id);
        return { rows: [{ id }], rowCount: 1 };
      }
      if (
        text.includes("UPDATE node_attribute") &&
        text.includes("SET status = 'active'") &&
        text.includes("AND status = 'uncertain'")
      ) {
        const id = String(params[0]);
        const attr = store.attributes.find((a) => a.id === id);
        if (!attr || attr.status !== "uncertain") {
          return { rows: [], rowCount: 0 };
        }
        attr.status = "active";
        countUpdate(store, id);
        return { rows: [{ id }], rowCount: 1 };
      }

      // ============ Curation: rejectItem (link / attr) ============
      if (
        text.includes("UPDATE knowledge_link") &&
        text.includes("SET status = 'deleted'") &&
        text.includes("superseded_at = now()") &&
        text.includes("status IN ('active', 'uncertain', 'disputed')") &&
        text.includes("WHERE id = $1")
      ) {
        const id = String(params[0]);
        const link = store.links.find((l) => l.id === id);
        if (
          !link ||
          !["active", "uncertain", "disputed"].includes(link.status)
        ) {
          return { rows: [], rowCount: 0 };
        }
        link.status = "deleted";
        link.superseded_at = new Date();
        countUpdate(store, id);
        return { rows: [{ id }], rowCount: 1 };
      }
      if (
        text.includes("UPDATE node_attribute") &&
        text.includes("SET status = 'deleted'") &&
        text.includes("superseded_at = now()") &&
        text.includes("status IN ('active', 'uncertain', 'disputed')") &&
        text.includes("WHERE id = $1")
      ) {
        const id = String(params[0]);
        const attr = store.attributes.find((a) => a.id === id);
        if (
          !attr ||
          !["active", "uncertain", "disputed"].includes(attr.status)
        ) {
          return { rows: [], rowCount: 0 };
        }
        attr.status = "deleted";
        attr.superseded_at = new Date();
        countUpdate(store, id);
        return { rows: [{ id }], rowCount: 1 };
      }

      // ============ Curation: information_fragment lookup (correct_item BR-17) ============
      if (
        text.includes("SELECT id, status FROM information_fragment") &&
        text.includes("WHERE id = $1")
      ) {
        const id = String(params[0]);
        const row = store.information_fragments.find((f) => f.id === id);
        return row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      // ============ Compliance: loadRawInformationForUpdate ============
      // SELECT id, status FROM raw_information WHERE id = $1 FOR UPDATE.
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

      // ============ Compliance: tombstoneRawInformation ============
      // BR-04 + BR-18: same UPDATE redacts content AND original_input
      // (CASE preserves null; non-null becomes '[REDACTED]').
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

      // ============ Compliance: tombstoneRawChunksOfRaw ============
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

      // ============ Compliance: tombstoneCascadedFragments (BR-06) ============
      if (
        text.includes("UPDATE information_fragment AS f") &&
        text.includes("status        = 'deleted'") &&
        text.includes("superseded_at = now()")
      ) {
        const rawId = String(params[0]);
        const rows: { id: string }[] = [];
        for (const f of store.fragments_alias(store)) {
          // The fake list iterator below — see helper at the file foot —
          // bridges the two `fragments` shapes used by curation
          // (`information_fragments`) and compliance (we treat the same array
          // as both).
          if (f.status === "deleted") continue;
          const sources = store.fragment_sources.filter(
            (fs) => fs.fragment_id === f.id
          );
          if (sources.length === 0) continue;
          const anchorsTarget = sources.some((fs) => {
            const ch = store.chunks.find((c) => c.id === fs.raw_chunk_id);
            return ch?.raw_information_id === rawId;
          });
          if (!anchorsTarget) continue;
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

      // ============ Compliance: tombstoneCascadedLinks (BR-07) ============
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
            const f = store.information_fragments.find((ff) => ff.id === p.fragment_id);
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
            const f = store.information_fragments.find((ff) => ff.id === p.fragment_id);
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

      // ============ Compliance: tombstoneCascadedAttributes (BR-07) ============
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
            const f = store.information_fragments.find((ff) => ff.id === p.fragment_id);
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
            const f = store.information_fragments.find((ff) => ff.id === p.fragment_id);
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

      // ============ Compliance: insertComplianceDeletion ============
      if (text.includes("INSERT INTO compliance_deletion")) {
        const id = nextUuid("cd");
        const row: ComplianceDeletionStoredRow = {
          id,
          raw_information_id: String(params[0]),
          reason: String(params[1]),
          executed_at: new Date("2026-06-15T12:00:00Z"),
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

      // ============ Compliance: findComplianceDeletionByRawId ============
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

      // Fallback — fail loud (Rule 12). The router-level + transport-level
      // tests above must always exercise a known SQL path; an unknown one
      // means a service drift not yet modelled.
      throw new Error(`fake client: unknown SQL: ${text.slice(0, 200)}`);
    },
    release: () => undefined,
  };
  return fakeClient;
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

// Helper to bridge the two fragment shapes (curation reads
// `information_fragments`, compliance writes statuses on the SAME list). We
// expose it as a method on the store so the fake-pg client can call it from
// inside the SQL matchers above without a closure-capture re-bind on every
// query. The two arrays are intentionally the same physical reference — see
// `fragments_alias` definition below.
declare module "../../../app.js" {
  // No declaration merging — purely a compile-time helper to keep the cast
  // local; we add the alias as a runtime method via Object.defineProperty in
  // the store builder. See `attachFragmentsAlias`.
}
function attachFragmentsAlias(store: Store): void {
  // The compliance fragment matcher iterates `store.fragments_alias(store)`;
  // we route that back to `store.information_fragments` so a single array
  // holds the fragment metadata for both domains. `superseded_at` is a
  // nullable Date that we set on tombstone.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (store as any).fragments_alias = (s: Store) => s.information_fragments;
}

// Local TypeScript-only narrowing — we add the helper to the Store interface
// without exposing it to public consumers.
interface Store {
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  fragments_alias?(s: Store): InformationFragmentRow[];
}

// ---------------------------------------------------------------------------
// Fixtures + Auth — same shape as routes.spec.ts so a reader who knows that
// file recognises the boilerplate (Rule 11).
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

function buildCatalogFromStore(store: Store) {
  return buildSnapshot({
    nodeTypes: store.node_types.map((n) => ({
      id: n.id,
      name: n.name,
      description: n.name,
      version: 1,
    })),
    linkTypes: store.link_types.map((l) => ({
      id: l.id,
      name: l.name,
      label: l.name,
      description: l.name,
      inverse_name: `inv_${l.name}`,
      is_temporal: true,
      allows_multiple_current: l.allows_multiple_current,
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
      allows_multiple_current: a.allows_multiple_current,
      requires_valid_from: false,
      description: a.key,
      version: 1,
    })),
  });
}

function buildIngestionCatalogFromStore(store: Store) {
  return buildIngestionSnapshot({
    nodeTypes: store.node_types.map((n) => ({
      id: n.id,
      name: n.name,
      description: n.name,
    })),
    linkTypes: store.link_types.map((l) => ({
      id: l.id,
      name: l.name,
      is_temporal: true,
      allows_multiple_current: l.allows_multiple_current,
      requires_valid_from: false,
      requires_valid_to_on_change: false,
    })),
    linkTypeRules: [],
    attributeKeys: store.attribute_keys.map((a) => ({
      id: a.id,
      node_type_id: a.node_type_id,
      key: a.key,
      value_type: a.value_type,
      is_temporal: true,
      allows_multiple_current: a.allows_multiple_current,
      requires_valid_from: false,
    })),
    attributeValidValues: store.attribute_valid_values,
  });
}

async function buildAppWith(store: Store, fixture: AuthFixture) {
  attachFragmentsAlias(store);
  return buildApp({
    env: envFixture,
    logger: silentLogger,
    pool: buildFakePool(store),
    auth: buildNeonAuth(envFixture, async () =>
      ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
    ),
    mcp: buildMcpServer(silentLogger),
    catalog: buildCatalogFromStore(store),
    ingestionCatalog: buildIngestionCatalogFromStore(store),
  });
}

// ---------------------------------------------------------------------------
// JSON-RPC helpers — same envelope shape as mcp-query-kg.spec.ts.
// ---------------------------------------------------------------------------

function rpcCall(name: string, args: Record<string, unknown>): unknown {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
}

interface JsonRpcEnvelope {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
}

interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";

/** Parse the JSON payload a successful MCP tools/call carries in its text block. */
function mcpOkPayload(body: JsonRpcEnvelope): unknown {
  return JSON.parse(body.result?.content?.[0]?.text ?? "null");
}

/** Parse the structured { code, message, details } an isError MCP result carries. */
function mcpErrPayload(body: JsonRpcEnvelope): {
  code: string;
  message: string;
  details?: unknown;
} {
  return JSON.parse(body.result?.content?.[0]?.text ?? "{}");
}

/**
 * Strip transport envelopes so REST body and the MCP success payload can be
 * compared byte-for-byte (BR-32 assertion #1). REST returns the bare body; MCP
 * carries it as JSON in the tool result's text content block.
 */
function stripMcpEnvelope(rpcBody: JsonRpcEnvelope): unknown {
  expect(rpcBody.result).toBeDefined();
  expect(rpcBody.result?.isError).toBeFalsy();
  return mcpOkPayload(rpcBody);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP curation parity — success payload (BR-32 #1)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // BR-32 #1 — merge_nodes: identical body REST vs MCP after envelope strip.
  it("merge_nodes: REST and MCP return byte-identical payloads", async () => {
    const store = buildEmptyStore();
    const survivor = "55555555-0000-4000-8000-000000000001";
    const absorbed = "55555555-0000-4000-8000-000000000002";
    for (const id of [survivor, absorbed]) {
      store.nodes.push({
        id,
        node_type_id: UUID.PROJECT_NT,
        canonical_name: id === survivor ? "Apollo Survivor" : "Apollo Absorbed",
        status: "active",
        merged_into_node_id: null,
      });
    }
    const app = await buildAppWith(store, fixture);
    try {
      const restRes = await app.inject({
        method: "POST",
        url: "/api/v1/curation/nodes/merge",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          survivor_id: survivor,
          absorbed_id: absorbed,
          reason: "REST parity probe",
        },
      });
      expect(restRes.statusCode).toBe(200);
      const restBody = restRes.json() as { action_id: string };
      expect(restBody.action_id).toBeDefined();

      // Reseed an equivalent fixture so the MCP call sees the SAME starting
      // state. Reusing the post-REST store would leave `absorbed` already in
      // status='merged' and the MCP call would surface a different error
      // (Rule 9 — tests must encode WHY the parity matters).
      const store2 = buildEmptyStore();
      const survivor2 = "66666666-0000-4000-8000-000000000001";
      const absorbed2 = "66666666-0000-4000-8000-000000000002";
      for (const id of [survivor2, absorbed2]) {
        store2.nodes.push({
          id,
          node_type_id: UUID.PROJECT_NT,
          canonical_name: id === survivor2 ? "Apollo Survivor" : "Apollo Absorbed",
          status: "active",
          merged_into_node_id: null,
        });
      }
      const app2 = await buildAppWith(store2, fixture);
      try {
        const mcpRes = await app2.inject({
          method: "POST",
          url: "/api/v1/mcp/curation",
          headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
          payload: rpcCall("merge_nodes", {
            survivor_id: survivor2,
            absorbed_id: absorbed2,
            reason: "REST parity probe",
          }),
        });
        expect(mcpRes.statusCode).toBe(200);
        const mcpBody = mcpRes.json() as JsonRpcEnvelope;
        const mcpInner = stripMcpEnvelope(mcpBody) as {
          survivor_id: string;
          absorbed_id: string;
          action_id: string;
          affected: Record<string, number>;
        };
        // Strip the two fields that genuinely diverge between independent
        // calls (BR-32 explicit footnote: "only `id` and `created_at` differ").
        const restNorm = { ...restBody, action_id: "<canonical>" };
        const mcpNorm = {
          ...mcpInner,
          action_id: "<canonical>",
          // survivor / absorbed ids are seeded differently per app to keep
          // calls independent — rewrite both to the same canonical value.
          survivor_id: "<canonical-survivor>",
          absorbed_id: "<canonical-absorbed>",
        };
        const restNorm2 = {
          ...restNorm,
          survivor_id: "<canonical-survivor>",
          absorbed_id: "<canonical-absorbed>",
        };
        expect(mcpNorm).toEqual(restNorm2);
      } finally {
        await app2.close();
      }
    } finally {
      await app.close();
    }
  });

  // BR-32 #1 — confirm_item: same body shape across both transports.
  it("confirm_item: REST and MCP return byte-identical payloads", async () => {
    // REST path
    const storeRest = buildEmptyStore();
    const attrIdRest = "66666666-0000-4000-8000-000000000010";
    storeRest.attributes.push({
      id: attrIdRest,
      node_id: "77777777-0000-4000-8000-000000000010",
      attribute_key_id: UUID.AK_DEADLINE,
      value_type: "date",
      value: "2026-07-01",
      valid_from: "2026-01-01",
      valid_to: null,
      status: "uncertain",
      confidence: "0.55",
      valid_from_source: "document",
      superseded_at: null,
      supersedes_attribute_id: null,
      recorded_at: new Date(),
      updated_at: new Date(),
    });
    const appRest = await buildAppWith(storeRest, fixture);
    let restBody: unknown;
    try {
      const res = await appRest.inject({
        method: "POST",
        url: "/api/v1/curation/items/confirm",
        headers: { authorization: `Bearer ${token}` },
        payload: { item_kind: "attribute", item_id: attrIdRest },
      });
      expect(res.statusCode).toBe(200);
      restBody = res.json();
    } finally {
      await appRest.close();
    }

    // MCP path — fresh fixture with a different id so the MCP call is not
    // affected by the REST call's state change.
    const storeMcp = buildEmptyStore();
    const attrIdMcp = "66666666-0000-4000-8000-000000000011";
    storeMcp.attributes.push({
      id: attrIdMcp,
      node_id: "77777777-0000-4000-8000-000000000011",
      attribute_key_id: UUID.AK_DEADLINE,
      value_type: "date",
      value: "2026-07-01",
      valid_from: "2026-01-01",
      valid_to: null,
      status: "uncertain",
      confidence: "0.55",
      valid_from_source: "document",
      superseded_at: null,
      supersedes_attribute_id: null,
      recorded_at: new Date(),
      updated_at: new Date(),
    });
    const appMcp = await buildAppWith(storeMcp, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("confirm_item", {
          item_kind: "attribute",
          item_id: attrIdMcp,
        }),
      });
      expect(res.statusCode).toBe(200);
      const mcpBody = res.json() as JsonRpcEnvelope;
      const mcpInner = stripMcpEnvelope(mcpBody) as {
        item_id: string;
        action_id: string;
      };
      // Normalise the two intrinsically-divergent fields per BR-32 footnote.
      const restNorm = {
        ...(restBody as Record<string, unknown>),
        item_id: "<canonical>",
        action_id: "<canonical>",
      };
      const mcpNorm = {
        ...mcpInner,
        item_id: "<canonical>",
        action_id: "<canonical>",
      };
      expect(mcpNorm).toEqual(restNorm);
    } finally {
      await appMcp.close();
    }
  });
});

describe("MCP curation parity — error codes (BR-32 #2)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // BR-32 #2 — BUSINESS_REVIEW_NOT_PENDING — resolve_entity_match on a node
  // that is NOT in needs_review.
  it("BUSINESS_REVIEW_NOT_PENDING: same code REST vs MCP", async () => {
    function seed(): { store: Store; nodeId: string } {
      const store = buildEmptyStore();
      const nodeId = "55555555-0000-4000-8000-000000000a01";
      store.nodes.push({
        id: nodeId,
        node_type_id: UUID.PROJECT_NT,
        canonical_name: "Already active",
        status: "active", // NOT needs_review — forces BUSINESS_REVIEW_NOT_PENDING
        merged_into_node_id: null,
      });
      return { store, nodeId };
    }

    // REST
    const { store: storeRest, nodeId: nodeRest } = seed();
    const appRest = await buildAppWith(storeRest, fixture);
    let restErrorCode: string;
    try {
      const res = await appRest.inject({
        method: "POST",
        url: `/api/v1/curation/entity-matches/${nodeRest}/resolve`,
        headers: { authorization: `Bearer ${token}` },
        payload: { decision: "keep_separate", reason: "should fail" },
      });
      expect(res.statusCode).toBe(409);
      restErrorCode = (res.json() as ErrorEnvelope).error.code;
      expect(restErrorCode).toBe("BUSINESS_REVIEW_NOT_PENDING");
    } finally {
      await appRest.close();
    }

    // MCP
    const { store: storeMcp, nodeId: nodeMcp } = seed();
    const appMcp = await buildAppWith(storeMcp, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("resolve_entity_match", {
          node_id: nodeMcp,
          decision: "keep_separate",
          reason: "should fail",
        }),
      });
      expect(res.statusCode).toBe(200); // MCP wraps over HTTP 200.
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe(restErrorCode);
    } finally {
      await appMcp.close();
    }
  });

  // BR-32 #2 — BUSINESS_INVALID_TARGET_NODE on resolve_entity_match merge_into
  // with mismatched node_type_id (Project vs Person).
  it("BUSINESS_INVALID_TARGET_NODE: same code REST vs MCP", async () => {
    function seed(): { store: Store; proj: string; person: string } {
      const store = buildEmptyStore();
      const proj = "55555555-0000-4000-8000-000000000b01";
      const person = "55555555-0000-4000-8000-000000000b02";
      store.nodes.push({
        id: proj,
        node_type_id: UUID.PROJECT_NT,
        canonical_name: "Apollo",
        status: "needs_review",
        merged_into_node_id: null,
      });
      store.nodes.push({
        id: person,
        node_type_id: UUID.PERSON_NT,
        canonical_name: "Alice",
        status: "active",
        merged_into_node_id: null,
      });
      return { store, proj, person };
    }

    // REST
    const restSeed = seed();
    const appRest = await buildAppWith(restSeed.store, fixture);
    let restCode: string;
    try {
      const res = await appRest.inject({
        method: "POST",
        url: `/api/v1/curation/entity-matches/${restSeed.proj}/resolve`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          decision: "merge_into",
          target_node_id: restSeed.person,
          reason: "ok",
        },
      });
      expect(res.statusCode).toBe(422);
      restCode = (res.json() as ErrorEnvelope).error.code;
      expect(restCode).toBe("BUSINESS_INVALID_TARGET_NODE");
    } finally {
      await appRest.close();
    }

    // MCP
    const mcpSeed = seed();
    const appMcp = await buildAppWith(mcpSeed.store, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("resolve_entity_match", {
          node_id: mcpSeed.proj,
          decision: "merge_into",
          target_node_id: mcpSeed.person,
          reason: "ok",
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe(restCode);
    } finally {
      await appMcp.close();
    }
  });

  // BR-32 #2 — BUSINESS_DATE_UNJUSTIFIED on correct_item passing a fragment id
  // whose status='proposed' (must be 'accepted' per BR-17).
  it("BUSINESS_DATE_UNJUSTIFIED: same code REST vs MCP", async () => {
    function seed(idSuffix: string): { store: Store; predId: string } {
      const store = buildEmptyStore();
      const predId = `aaaaaaaa-0000-4000-8000-0000000${idSuffix}`.slice(0, 36);
      store.attributes.push({
        id: predId,
        node_id: "77777777-0000-4000-8000-000000000c01",
        attribute_key_id: UUID.AK_DEADLINE,
        value_type: "date",
        value: "2026-07-15",
        valid_from: "2026-01-01",
        valid_to: null,
        status: "active",
        confidence: "0.9",
        valid_from_source: "document",
        superseded_at: null,
        supersedes_attribute_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      });
      return { store, predId };
    }

    // REST
    const restSeed = seed("0c01001");
    const appRest = await buildAppWith(restSeed.store, fixture);
    let restCode: string;
    try {
      const res = await appRest.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: restSeed.predId,
          corrected: {
            valid_from: "2026-02-01",
            valid_from_source: "stated",
            valid_from_fragment_id: UUID.FRAG_PROPOSED, // proposed -> BR-17
          },
          reason: "errata",
        },
      });
      expect(res.statusCode).toBe(422);
      restCode = (res.json() as ErrorEnvelope).error.code;
      expect(restCode).toBe("BUSINESS_DATE_UNJUSTIFIED");
    } finally {
      await appRest.close();
    }

    // MCP
    const mcpSeed = seed("0c01002");
    const appMcp = await buildAppWith(mcpSeed.store, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("correct_item", {
          item_kind: "attribute",
          item_id: mcpSeed.predId,
          corrected: {
            valid_from: "2026-02-01",
            valid_from_source: "stated",
            valid_from_fragment_id: UUID.FRAG_PROPOSED,
          },
          reason: "errata",
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe(restCode);
    } finally {
      await appMcp.close();
    }
  });

  // BR-32 #2 — VALIDATION_INVALID_FORMAT on a non-UUID `item_id`.
  it("VALIDATION_INVALID_FORMAT: same code REST vs MCP", async () => {
    const storeRest = buildEmptyStore();
    const appRest = await buildAppWith(storeRest, fixture);
    let restCode: string;
    try {
      const res = await appRest.inject({
        method: "POST",
        url: "/api/v1/curation/items/confirm",
        headers: { authorization: `Bearer ${token}` },
        payload: { item_kind: "attribute", item_id: "not-a-uuid" },
      });
      expect(res.statusCode).toBe(422);
      restCode = (res.json() as ErrorEnvelope).error.code;
      expect(restCode).toBe("VALIDATION_INVALID_FORMAT");
    } finally {
      await appRest.close();
    }

    const storeMcp = buildEmptyStore();
    const appMcp = await buildAppWith(storeMcp, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("confirm_item", {
          item_kind: "attribute",
          item_id: "not-a-uuid",
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe(restCode);
    } finally {
      await appMcp.close();
    }
  });
});

describe("MCP curation parity — audit row count (BR-32 #3)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // BR-32 #3 — exactly ONE curation_action INSERT per successful tool call,
  // on BOTH transports. We assert via the dedicated insertCount probe so a
  // service-layer regression that wrote zero rows (data loss) or two rows
  // (double-audit) would fail the parity test.
  it("reject_item: REST and MCP each write exactly one curation_action row", async () => {
    function seedLink(idSuffix: string): { store: Store; linkId: string } {
      const store = buildEmptyStore();
      const linkId = `88888888-0000-4000-8000-0000000${idSuffix}`.slice(0, 36);
      store.links.push({
        id: linkId,
        source_node_id: "77777777-0000-4000-8000-000000000d01",
        target_node_id: "77777777-0000-4000-8000-000000000d02",
        link_type_id: UUID.LT_DEPENDS,
        valid_from: null,
        valid_to: null,
        status: "active",
        confidence: "0.8",
        valid_from_source: null,
        superseded_at: null,
        supersedes_link_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      });
      return { store, linkId };
    }

    const restSeed = seedLink("0d01001");
    const appRest = await buildAppWith(restSeed.store, fixture);
    try {
      const res = await appRest.inject({
        method: "POST",
        url: "/api/v1/curation/items/reject",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "link",
          item_id: restSeed.linkId,
          reason: "hallucinated",
        },
      });
      expect(res.statusCode).toBe(200);
      // BR-32 #3 — exactly ONE INSERT INTO curation_action.
      expect(restSeed.store.curationActionInsertCount).toBe(1);
      expect(restSeed.store.curation_actions.length).toBe(1);
      expect(restSeed.store.curation_actions[0]?.action).toBe("reject_item");
    } finally {
      await appRest.close();
    }

    const mcpSeed = seedLink("0d01002");
    const appMcp = await buildAppWith(mcpSeed.store, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("reject_item", {
          item_kind: "link",
          item_id: mcpSeed.linkId,
          reason: "hallucinated",
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBeFalsy();
      // BR-32 #3 — same count on MCP.
      expect(mcpSeed.store.curationActionInsertCount).toBe(1);
      expect(mcpSeed.store.curation_actions.length).toBe(1);
      expect(mcpSeed.store.curation_actions[0]?.action).toBe("reject_item");
      // BR-32 footnote: payload / reason / action / target_kind / target_id
      // are byte-identical between the two transports (only id and
      // created_at differ).
      expect(mcpSeed.store.curation_actions[0]?.action).toBe(
        restSeed.store.curation_actions[0]?.action
      );
      expect(mcpSeed.store.curation_actions[0]?.reason).toBe(
        restSeed.store.curation_actions[0]?.reason
      );
      expect(mcpSeed.store.curation_actions[0]?.target_kind).toBe(
        restSeed.store.curation_actions[0]?.target_kind
      );
      expect(mcpSeed.store.curation_actions[0]?.payload).toEqual(
        restSeed.store.curation_actions[0]?.payload
      );
    } finally {
      await appMcp.close();
    }
  });
});

describe("MCP curation parity — closed whitelist (BR-32 #4 / BR-29 rule 5)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // BR-32 #4 — even though `propose_node` and `get_node` ARE registered on the
  // shared McpServer (under the `ingest` / `query` toolset keys), the curation
  // transport's closed whitelist of 8 names refuses them with NOT_FOUND.
  // mcp-curation-wiring.spec.ts proves the wiring; this test proves the
  // SAME behaviour holds inside the parity test harness — i.e. nothing about
  // the seeded fixture or app-wide composition slips past the gate.
  it("tools/call propose_node returns NOT_FOUND", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("propose_node", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  it("tools/call get_node returns NOT_FOUND", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("get_node", {}),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as JsonRpcEnvelope;
      expect(body.result?.isError).toBe(true);
      expect(mcpErrPayload(body).code).toBe("NOT_FOUND");
    } finally {
      await app.close();
    }
  });
});

describe("MCP curation parity — compliance_delete (BR-32 #5 / compliance-audit BR-14)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  function seedRaw(rawId: string): Store {
    const store = buildEmptyStore();
    store.raws.push({
      id: rawId,
      content: "plain content",
      status: "active",
      superseded_at: null,
      metadata: {},
      original_input: null,
    });
    return store;
  }

  // BR-32 #5 — success parity: REST POST /compliance/deletions and MCP
  // tools/call compliance_delete on the SAME raw produce the same
  // discriminated union `{ outcome: 'deleted', deletion }`.
  it("compliance_delete success: REST and MCP return same discriminated union", async () => {
    const rawId = "ee000000-0000-4000-8000-000000000001";
    const restStore = seedRaw(rawId);
    const appRest = await buildAppWith(restStore, fixture);
    let restBody: {
      outcome: "deleted" | "noop_already_deleted";
      deletion: { affected: Record<string, number>; reason: string };
    };
    try {
      const res = await appRest.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          raw_information_id: rawId,
          reason: "owner request",
        },
      });
      expect(res.statusCode).toBe(201);
      restBody = res.json() as typeof restBody;
      expect(restBody.outcome).toBe("deleted");
      // One curation_action INSERT per successful compliance_delete (BR-08).
      expect(restStore.curationActionInsertCount).toBe(1);
    } finally {
      await appRest.close();
    }

    // MCP — fresh raw so the call is independent.
    const rawIdMcp = "ee000000-0000-4000-8000-000000000002";
    const mcpStore = seedRaw(rawIdMcp);
    const appMcp = await buildAppWith(mcpStore, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("compliance_delete", {
          raw_information_id: rawIdMcp,
          reason: "owner request",
        }),
      });
      expect(res.statusCode).toBe(200);
      const env = res.json() as JsonRpcEnvelope;
      expect(env.result?.isError).toBeFalsy();
      const inner = mcpOkPayload(env) as typeof restBody;
      expect(inner.outcome).toBe("deleted");
      // BR-32 #5: discriminated union is byte-identical after stripping the
      // intrinsically-divergent fields (`deletion.id`, `executed_at`,
      // `raw_information_id`).
      const restNorm = {
        outcome: restBody.outcome,
        deletion: {
          reason: restBody.deletion.reason,
          affected: restBody.deletion.affected,
        },
      };
      const mcpNorm = {
        outcome: inner.outcome,
        deletion: {
          reason: inner.deletion.reason,
          affected: inner.deletion.affected,
        },
      };
      expect(mcpNorm).toEqual(restNorm);
      // BR-32 #3 audit parity for compliance_delete: exactly one
      // curation_action INSERT on MCP too.
      expect(mcpStore.curationActionInsertCount).toBe(1);
    } finally {
      await appMcp.close();
    }
  });

  // BR-32 #5 forced-error, POST-P2.1: REST and MCP now emit the SAME canonical
  // `RESOURCE_NOT_FOUND` code. Before P2.1 the MCP path returned the §14 short
  // `NOT_FOUND`; the taxonomy unification (compliance-audit.back.md BR-15
  // v1.4.0) retires the `mcpCode` pair so both transports surface byte-identical
  // envelopes for the same thrown sentinel.
  it("compliance_delete NOT_FOUND: REST and MCP both return RESOURCE_NOT_FOUND (P2.1 canonical parity)", async () => {
    const missing = "ee000000-0000-4000-8000-0000000000ff";
    const storeRest = buildEmptyStore();
    const appRest = await buildAppWith(storeRest, fixture);
    try {
      const res = await appRest.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        headers: { authorization: `Bearer ${token}` },
        payload: { raw_information_id: missing, reason: "owner request" },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as ErrorEnvelope;
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
      // No audit row written on a forced-error path.
      expect(storeRest.curationActionInsertCount).toBe(0);
    } finally {
      await appRest.close();
    }

    const storeMcp = buildEmptyStore();
    const appMcp = await buildAppWith(storeMcp, fixture);
    try {
      const res = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("compliance_delete", {
          raw_information_id: missing,
          reason: "owner request",
        }),
      });
      expect(res.statusCode).toBe(200);
      const env = res.json() as JsonRpcEnvelope;
      expect(env.result?.isError).toBe(true);
      // P2.1 canonical — same code REST emits (compliance-audit BR-15 v1.4.0).
      expect(mcpErrPayload(env).code).toBe("RESOURCE_NOT_FOUND");
      // No audit row on the MCP path either.
      expect(storeMcp.curationActionInsertCount).toBe(0);
    } finally {
      await appMcp.close();
    }
  });

  // BR-32 #5 + constraint "Test must assert zero extra curation_action INSERTs
  // on no-op compliance_delete": a second compliance_delete on an already-
  // tombstoned raw returns outcome=noop_already_deleted AND does NOT write a
  // second audit row. We exercise this on BOTH transports.
  it("compliance_delete idempotency: no-op path writes ZERO extra curation_action rows on both transports", async () => {
    // REST — call compliance_delete TWICE on the same raw against the same
    // store; the second call must be a no-op and NOT bump the audit counter.
    const rawId = "ee000000-0000-4000-8000-000000000003";
    const storeRest = seedRaw(rawId);
    const appRest = await buildAppWith(storeRest, fixture);
    try {
      const first = await appRest.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        headers: { authorization: `Bearer ${token}` },
        payload: { raw_information_id: rawId, reason: "first call" },
      });
      expect(first.statusCode).toBe(201);
      expect(storeRest.curationActionInsertCount).toBe(1);

      const second = await appRest.inject({
        method: "POST",
        url: "/api/v1/compliance/deletions",
        headers: { authorization: `Bearer ${token}` },
        payload: { raw_information_id: rawId, reason: "second call" },
      });
      expect(second.statusCode).toBe(200);
      const body = second.json() as { outcome: string };
      expect(body.outcome).toBe("noop_already_deleted");
      // BR-08 — zero extra audit rows on the no-op path.
      expect(storeRest.curationActionInsertCount).toBe(1);
    } finally {
      await appRest.close();
    }

    // MCP — same shape on the curation transport.
    const rawIdMcp = "ee000000-0000-4000-8000-000000000004";
    const storeMcp = seedRaw(rawIdMcp);
    const appMcp = await buildAppWith(storeMcp, fixture);
    try {
      const first = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("compliance_delete", {
          raw_information_id: rawIdMcp,
          reason: "first call",
        }),
      });
      expect(first.statusCode).toBe(200);
      expect(storeMcp.curationActionInsertCount).toBe(1);

      const second = await appMcp.inject({
        method: "POST",
        url: "/api/v1/mcp/curation",
        headers: { authorization: `Bearer ${token}`, accept: MCP_ACCEPT },
        payload: rpcCall("compliance_delete", {
          raw_information_id: rawIdMcp,
          reason: "second call",
        }),
      });
      expect(second.statusCode).toBe(200);
      const env = second.json() as JsonRpcEnvelope;
      expect(env.result?.isError).toBeFalsy();
      const inner = mcpOkPayload(env) as { outcome: string };
      expect(inner.outcome).toBe("noop_already_deleted");
      // Constraint: zero extra audit rows on the no-op compliance_delete
      // path on the MCP transport too.
      expect(storeMcp.curationActionInsertCount).toBe(1);
    } finally {
      await appMcp.close();
    }
  });
});
