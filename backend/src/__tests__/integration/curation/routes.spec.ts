// Integration tests for the TC-07 curation routes.
//
// Acceptance criteria covered (validation.criteria of dev_tc_007):
//   - POST resolve_entity_match(merge_into) with mismatched node_type_id
//     returns 422 BUSINESS_INVALID_TARGET_NODE
//   - POST merge_nodes performs path compression
//   - POST correct_item: predecessor valid_to is unchanged after correction
//   - POST reject_item: status='deleted' AND superseded_at IS NOT NULL in one UPDATE
//   - POST confirm_item: confidence value preserved unchanged
//   - POST resolve_dispute(prefer_one) without winner_id returns 422
//     BUSINESS_DISPUTE_WINNER_REQUIRED
//   - POST resolve_dispute(adjust_periods) with overlapping periods for
//     non-multiple-current key returns 422 BUSINESS_TEMPORAL_INCOHERENT
//   - CurationAction row inserted on every successful write (action_id in response)
//   - Vitest: merge flow including alias copy and link repointing
//   - Vitest: correction flow preserves predecessor valid_to and copies provenance
//
// Strategy mirrors the knowledge-graph integration tests: build the real
// Fastify app with a fake pg.Pool whose client interprets a small set of SQL
// templates against an in-memory store. JWT auth is signed against a test
// JWKS the middleware accepts.

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
// In-memory store
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
  /** Count UPDATE statements per row id; used by BR-20 single-UPDATE invariant. */
  updateCountsByRowId: Map<string, number>;
  node_types: { id: string; name: string }[];
  link_types: { id: string; name: string; allows_multiple_current: boolean }[];
  attribute_keys: {
    id: string;
    node_type_id: string;
    key: string;
    value_type: "date" | "number" | "text" | "bool";
    allows_multiple_current: boolean;
  }[];
  /**
   * TC-04 (valid-values-attribute-domains) — closed value domain entries
   * consumed by `correctItemService` via the ingestion catalog snapshot.
   * Empty array = every attribute_key has an open domain (back-compat).
   */
  attribute_valid_values: {
    attribute_key_id: string;
    value: string;
  }[];
}

function genId(prefix: string, n: number): string {
  return `${prefix}${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`.slice(
    0,
    36
  );
}

const UUID = {
  PROJECT_NT: "11111111-0000-4000-8000-000000000001",
  PERSON_NT: "11111111-0000-4000-8000-000000000002",
  LT_DEPENDS: "22222222-0000-4000-8000-000000000001",
  AK_DEADLINE: "33333333-0000-4000-8000-000000000001",
  AK_EMAIL: "33333333-0000-4000-8000-000000000002",
  FRAG_1: "44444444-0000-4000-8000-000000000001",
};

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
      { id: UUID.FRAG_1, status: "accepted" },
    ],
    updateCountsByRowId: new Map(),
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

let nextIdCounter = 1;
function nextUuid(prefix = "99"): string {
  const n = nextIdCounter++;
  return `${prefix}${String(n).padStart(6, "0")}-0000-4000-8000-000000000000`.slice(
    0,
    36
  );
}

// ---------------------------------------------------------------------------
// Fake pg client
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

      // ============ READ: loadNodesForUpdate ============
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

      // ============ UPDATE: keep_separate ============
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

      // ============ UPDATE: node merged ============
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

      // ============ UPDATE: path compression ============
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

      // ============ INSERT: copy aliases ============
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

      // ============ UPDATE: repoint links ============
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

      // ============ UPDATE: repoint attributes ============
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

      // ============ DELETE: entity_match_review ============
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

      // ============ INSERT: curation_action ============
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
        return {
          rows: [{ id, created_at: row.created_at }],
          rowCount: 1,
        };
      }

      // ============ READ: loadItemsForUpdate (link) ============
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

      // ============ READ: loadItemsForUpdate (attribute) ============
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

      // ============ UPDATE: confirmItem ============
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

      // ============ UPDATE: rejectItem (paired delete + superseded_at) ============
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

      // ============ UPDATE: resolveDisputeWinner (link / attr) ============
      if (
        text.includes("UPDATE knowledge_link") &&
        text.includes("SET status = 'active'") &&
        text.includes("AND status = 'disputed'") &&
        text.includes("WHERE id = $1")
      ) {
        const id = String(params[0]);
        const link = store.links.find((l) => l.id === id);
        if (!link || link.status !== "disputed") {
          return { rows: [], rowCount: 0 };
        }
        link.status = "active";
        return { rows: [{ id }], rowCount: 1 };
      }
      if (
        text.includes("UPDATE node_attribute") &&
        text.includes("SET status = 'active'") &&
        text.includes("AND status = 'disputed'") &&
        text.includes("WHERE id = $1")
      ) {
        const id = String(params[0]);
        const attr = store.attributes.find((a) => a.id === id);
        if (!attr || attr.status !== "disputed") {
          return { rows: [], rowCount: 0 };
        }
        attr.status = "active";
        return { rows: [{ id }], rowCount: 1 };
      }

      // ============ UPDATE: resolveDisputeLosers ============
      if (
        text.includes("UPDATE knowledge_link") &&
        text.includes("SET status = 'deleted'") &&
        text.includes("superseded_at = now()") &&
        text.includes("AND status = 'disputed'") &&
        text.includes("WHERE id = ANY($1::uuid[])")
      ) {
        const ids = params[0] as string[];
        const rows: { id: string }[] = [];
        for (const l of store.links) {
          if (ids.includes(l.id) && l.status === "disputed") {
            l.status = "deleted";
            l.superseded_at = new Date();
            rows.push({ id: l.id });
          }
        }
        return { rows, rowCount: rows.length };
      }
      if (
        text.includes("UPDATE node_attribute") &&
        text.includes("SET status = 'deleted'") &&
        text.includes("superseded_at = now()") &&
        text.includes("AND status = 'disputed'") &&
        text.includes("WHERE id = ANY($1::uuid[])")
      ) {
        const ids = params[0] as string[];
        const rows: { id: string }[] = [];
        for (const a of store.attributes) {
          if (ids.includes(a.id) && a.status === "disputed") {
            a.status = "deleted";
            a.superseded_at = new Date();
            rows.push({ id: a.id });
          }
        }
        return { rows, rowCount: rows.length };
      }

      // ============ UPDATE: adjustItemPeriod ============
      if (
        text.includes("UPDATE knowledge_link") &&
        text.includes("SET valid_from = $2::date") &&
        text.includes("valid_to = $3::date") &&
        text.includes("SET valid_from")
      ) {
        const id = String(params[0]);
        const link = store.links.find((l) => l.id === id);
        if (!link || link.status !== "disputed") {
          return { rows: [], rowCount: 0 };
        }
        link.valid_from = params[1] === null ? null : String(params[1]);
        link.valid_to = params[2] === null ? null : String(params[2]);
        link.status = "active";
        return { rows: [{ id }], rowCount: 1 };
      }
      if (
        text.includes("UPDATE node_attribute") &&
        text.includes("SET valid_from = $2::date") &&
        text.includes("valid_to = $3::date")
      ) {
        const id = String(params[0]);
        const attr = store.attributes.find((a) => a.id === id);
        if (!attr || attr.status !== "disputed") {
          return { rows: [], rowCount: 0 };
        }
        attr.valid_from = params[1] === null ? null : String(params[1]);
        attr.valid_to = params[2] === null ? null : String(params[2]);
        attr.status = "active";
        return { rows: [{ id }], rowCount: 1 };
      }

      // ============ UPDATE: supersedePredecessor ============
      if (
        text.includes("UPDATE knowledge_link") &&
        text.includes("SET status = 'superseded'") &&
        text.includes("superseded_at = now()")
      ) {
        const id = String(params[0]);
        const link = store.links.find((l) => l.id === id);
        if (
          !link ||
          !["active", "uncertain", "disputed"].includes(link.status)
        ) {
          return { rows: [], rowCount: 0 };
        }
        // CRITICAL: valid_to NOT touched (BR-18).
        link.status = "superseded";
        link.superseded_at = new Date();
        return { rows: [{ id }], rowCount: 1 };
      }
      if (
        text.includes("UPDATE node_attribute") &&
        text.includes("SET status = 'superseded'") &&
        text.includes("superseded_at = now()")
      ) {
        const id = String(params[0]);
        const attr = store.attributes.find((a) => a.id === id);
        if (
          !attr ||
          !["active", "uncertain", "disputed"].includes(attr.status)
        ) {
          return { rows: [], rowCount: 0 };
        }
        // CRITICAL: valid_to NOT touched.
        attr.status = "superseded";
        attr.superseded_at = new Date();
        return { rows: [{ id }], rowCount: 1 };
      }

      // ============ INSERT: corrected row (link) ============
      if (
        text.includes("INSERT INTO knowledge_link") &&
        text.includes("supersedes_link_id") &&
        text.includes("SELECT source_node_id")
      ) {
        const predecessorId = String(params[0]);
        const overrideTarget = params[1] === null ? null : String(params[1]);
        const overrideFrom = params[2] === null ? null : String(params[2]);
        const overrideTo = params[3] === null ? null : String(params[3]);
        const overrideSource = params[4] === null ? null : String(params[4]);
        const pred = store.links.find((l) => l.id === predecessorId);
        if (!pred) {
          return { rows: [], rowCount: 0 };
        }
        const newId = nextUuid("nl");
        store.links.push({
          id: newId,
          source_node_id: pred.source_node_id,
          target_node_id: overrideTarget ?? pred.target_node_id,
          link_type_id: pred.link_type_id,
          valid_from: overrideFrom ?? pred.valid_from,
          valid_to: overrideTo ?? pred.valid_to,
          status: "active",
          confidence: pred.confidence,
          valid_from_source: (overrideSource as LinkRow["valid_from_source"]) ??
            pred.valid_from_source,
          superseded_at: null,
          supersedes_link_id: predecessorId,
          recorded_at: new Date(),
          updated_at: new Date(),
        });
        return { rows: [{ id: newId }], rowCount: 1 };
      }

      // ============ INSERT: corrected row (attribute) ============
      if (
        text.includes("INSERT INTO node_attribute") &&
        text.includes("supersedes_attribute_id") &&
        text.includes("SELECT node_id")
      ) {
        const predecessorId = String(params[0]);
        const overrideValue = params[1] === null ? null : String(params[1]);
        const overrideFrom = params[2] === null ? null : String(params[2]);
        const overrideTo = params[3] === null ? null : String(params[3]);
        const overrideSource = params[4] === null ? null : String(params[4]);
        const pred = store.attributes.find((a) => a.id === predecessorId);
        if (!pred) {
          return { rows: [], rowCount: 0 };
        }
        const newId = nextUuid("na");
        store.attributes.push({
          id: newId,
          node_id: pred.node_id,
          attribute_key_id: pred.attribute_key_id,
          value_type: pred.value_type,
          value: overrideValue ?? pred.value,
          valid_from: overrideFrom ?? pred.valid_from,
          valid_to: overrideTo ?? pred.valid_to,
          status: "active",
          confidence: pred.confidence,
          valid_from_source: (overrideSource as AttrRow["valid_from_source"]) ??
            pred.valid_from_source,
          superseded_at: null,
          supersedes_attribute_id: predecessorId,
          recorded_at: new Date(),
          updated_at: new Date(),
        });
        return { rows: [{ id: newId }], rowCount: 1 };
      }

      // ============ INSERT: copy provenance (link) ============
      if (
        text.includes("INSERT INTO provenance") &&
        text.includes("SELECT $2, fragment_id") &&
        text.includes("WHERE link_id = $1")
      ) {
        const predecessorId = String(params[0]);
        const successorId = String(params[1]);
        const existing = new Set(
          store.provenance
            .filter((p) => p.link_id === successorId)
            .map((p) => p.fragment_id)
        );
        const rows: { id: string }[] = [];
        for (const p of store.provenance.filter(
          (p) => p.link_id === predecessorId
        )) {
          if (existing.has(p.fragment_id)) continue;
          const id = nextUuid("pp");
          store.provenance.push({
            id,
            link_id: successorId,
            attribute_id: null,
            fragment_id: p.fragment_id,
            created_at: new Date(),
          });
          existing.add(p.fragment_id);
          rows.push({ id });
        }
        return { rows, rowCount: rows.length };
      }
      // ============ INSERT: copy provenance (attribute) ============
      if (
        text.includes("INSERT INTO provenance") &&
        text.includes("SELECT $2, fragment_id") &&
        text.includes("WHERE attribute_id = $1")
      ) {
        const predecessorId = String(params[0]);
        const successorId = String(params[1]);
        const existing = new Set(
          store.provenance
            .filter((p) => p.attribute_id === successorId)
            .map((p) => p.fragment_id)
        );
        const rows: { id: string }[] = [];
        for (const p of store.provenance.filter(
          (p) => p.attribute_id === predecessorId
        )) {
          if (existing.has(p.fragment_id)) continue;
          const id = nextUuid("pp");
          store.provenance.push({
            id,
            link_id: null,
            attribute_id: successorId,
            fragment_id: p.fragment_id,
            created_at: new Date(),
          });
          existing.add(p.fragment_id);
          rows.push({ id });
        }
        return { rows, rowCount: rows.length };
      }

      // ============ INSERT: append provenance (single fragment, link) ============
      if (
        text.includes("INSERT INTO provenance (link_id, fragment_id, created_at)") &&
        text.includes("VALUES ($1, $2, now())")
      ) {
        const successorId = String(params[0]);
        const fragmentId = String(params[1]);
        const existing = store.provenance.find(
          (p) => p.link_id === successorId && p.fragment_id === fragmentId
        );
        if (existing) return { rows: [], rowCount: 0 };
        const id = nextUuid("pp");
        store.provenance.push({
          id,
          link_id: successorId,
          attribute_id: null,
          fragment_id: fragmentId,
          created_at: new Date(),
        });
        return { rows: [{ id }], rowCount: 1 };
      }
      if (
        text.includes("INSERT INTO provenance (attribute_id, fragment_id, created_at)") &&
        text.includes("VALUES ($1, $2, now())")
      ) {
        const successorId = String(params[0]);
        const fragmentId = String(params[1]);
        const existing = store.provenance.find(
          (p) => p.attribute_id === successorId && p.fragment_id === fragmentId
        );
        if (existing) return { rows: [], rowCount: 0 };
        const id = nextUuid("pp");
        store.provenance.push({
          id,
          link_id: null,
          attribute_id: successorId,
          fragment_id: fragmentId,
          created_at: new Date(),
        });
        return { rows: [{ id }], rowCount: 1 };
      }

      // ============ READ: information_fragment ============
      if (
        text.includes("SELECT id, status FROM information_fragment") &&
        text.includes("WHERE id = $1")
      ) {
        const id = String(params[0]);
        const row = store.information_fragments.find((f) => f.id === id);
        return row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      // ============ READ: list entity_match queue ============
      if (
        text.includes("FROM knowledge_node kn") &&
        text.includes("entity_match_review") &&
        text.includes("WHERE kn.status = 'needs_review'")
      ) {
        const rows = store.nodes
          .filter((n) => n.status === "needs_review")
          .flatMap((n) => {
            const cands = store.entity_match_reviews.filter(
              (r) => r.node_id === n.id
            );
            if (cands.length === 0) {
              return [
                {
                  node_id: n.id,
                  node_type:
                    store.node_types.find((nt) => nt.id === n.node_type_id)
                      ?.name ?? "Unknown",
                  canonical_name: n.canonical_name,
                  created_at: new Date(),
                  candidate_node_id: null,
                  candidate_canonical_name: null,
                  similarity: null,
                },
              ];
            }
            return cands.map((c) => {
              const cn = store.nodes.find((x) => x.id === c.candidate_node_id);
              return {
                node_id: n.id,
                node_type:
                  store.node_types.find((nt) => nt.id === n.node_type_id)
                    ?.name ?? "Unknown",
                canonical_name: n.canonical_name,
                created_at: new Date(),
                candidate_node_id: c.candidate_node_id,
                candidate_canonical_name: cn?.canonical_name ?? null,
                similarity: c.similarity,
              };
            });
          });
        return { rows, rowCount: rows.length };
      }
      if (
        text.includes("count(*)::text AS total FROM knowledge_node") &&
        text.includes("status = 'needs_review'")
      ) {
        const total = String(
          store.nodes.filter((n) => n.status === "needs_review").length
        );
        return { rows: [{ total }], rowCount: 1 };
      }

      // ============ READ: list disputed links ============
      if (
        text.includes("FROM knowledge_link kl") &&
        text.includes("JOIN link_type lt") &&
        text.includes("WHERE kl.status = 'disputed'")
      ) {
        const rows = store.links
          .filter((l) => l.status === "disputed")
          .map((l) => {
            const lt = store.link_types.find((t) => t.id === l.link_type_id);
            return {
              id: l.id,
              source_node_id: l.source_node_id,
              target_node_id: l.target_node_id,
              link_type_id: l.link_type_id,
              link_type_name: lt?.name ?? "Unknown",
              valid_from: l.valid_from,
              valid_to: l.valid_to,
              valid_from_source: l.valid_from_source,
              confidence: l.confidence,
              status: l.status,
              recorded_at: l.recorded_at,
            };
          });
        return { rows, rowCount: rows.length };
      }
      if (
        text.includes("count(*)::text AS total FROM knowledge_link") &&
        text.includes("status = 'disputed'")
      ) {
        return {
          rows: [
            {
              total: String(
                store.links.filter((l) => l.status === "disputed").length
              ),
            },
          ],
          rowCount: 1,
        };
      }

      // ============ READ: list disputed attributes ============
      if (
        text.includes("FROM node_attribute na") &&
        text.includes("JOIN attribute_key ak") &&
        text.includes("WHERE na.status = 'disputed'")
      ) {
        const rows = store.attributes
          .filter((a) => a.status === "disputed")
          .map((a) => {
            const ak = store.attribute_keys.find(
              (k) => k.id === a.attribute_key_id
            );
            return {
              id: a.id,
              node_id: a.node_id,
              attribute_key_id: a.attribute_key_id,
              attribute_key: ak?.key ?? "unknown",
              value: a.value,
              valid_from: a.valid_from,
              valid_to: a.valid_to,
              valid_from_source: a.valid_from_source,
              confidence: a.confidence,
              status: a.status,
              recorded_at: a.recorded_at,
            };
          });
        return { rows, rowCount: rows.length };
      }
      if (
        text.includes("count(*)::text AS total FROM node_attribute") &&
        text.includes("status = 'disputed'")
      ) {
        return {
          rows: [
            {
              total: String(
                store.attributes.filter((a) => a.status === "disputed").length
              ),
            },
          ],
          rowCount: 1,
        };
      }

      // ============ BR-33 metrics: total curation_action count ============
      if (
        text.includes("count(*)::text AS total FROM curation_action") &&
        !text.includes("WHERE")
      ) {
        return {
          rows: [{ total: String(store.curation_actions.length) }],
          rowCount: 1,
        };
      }

      // ============ BR-33 metrics: accepted curation_action count ============
      if (
        text.includes("FROM curation_action") &&
        text.includes("WHERE action = ANY($1::text[])")
      ) {
        const accept = new Set(params[0] as string[]);
        const total = store.curation_actions.filter((r) =>
          accept.has(r.action)
        ).length;
        return {
          rows: [{ total: String(total) }],
          rowCount: 1,
        };
      }

      // ============ BR-33 metrics: reject_rate_by_code grouping ============
      if (
        text.includes("(payload->>'error_code')") &&
        text.includes("WHERE action = 'reject_item'") &&
        text.includes("payload ? 'error_code'") &&
        text.includes("GROUP BY 1")
      ) {
        const grouped = new Map<string, number>();
        for (const r of store.curation_actions) {
          if (r.action !== "reject_item") continue;
          const code = (r.payload as { error_code?: unknown }).error_code;
          if (typeof code !== "string") continue;
          grouped.set(code, (grouped.get(code) ?? 0) + 1);
        }
        return {
          rows: Array.from(grouped.entries()).map(([code, total]) => ({
            code,
            total: String(total),
          })),
          rowCount: grouped.size,
        };
      }

      // ============ BR-33 metrics: needs_review_count ============
      if (
        text.includes("count(*)::text AS total") &&
        text.includes("FROM knowledge_node") &&
        text.includes("status = 'needs_review'")
      ) {
        const total = store.nodes.filter((n) => n.status === "needs_review")
          .length;
        return {
          rows: [{ total: String(total) }],
          rowCount: 1,
        };
      }

      // ============ BR-33 metrics: uncertain_count via resolved views ============
      // Resolved-view rows whose effective_status='uncertain' (§5.4) — the
      // fake store has no separate views, so we approximate by treating
      // `status='uncertain'` on the underlying tables as the resolved value
      // (consistent with what the queue tests already do).
      if (
        text.includes("knowledge_link_resolved") &&
        text.includes("node_attribute_resolved") &&
        text.includes("'uncertain'")
      ) {
        const total =
          store.links.filter((l) => l.status === "uncertain").length +
          store.attributes.filter((a) => a.status === "uncertain").length;
        return {
          rows: [{ total: String(total) }],
          rowCount: 1,
        };
      }

      // ============ BR-33 metrics: disputed_count via resolved views ============
      if (
        text.includes("knowledge_link_resolved") &&
        text.includes("node_attribute_resolved") &&
        text.includes("'disputed'")
      ) {
        const total =
          store.links.filter((l) => l.status === "disputed").length +
          store.attributes.filter((a) => a.status === "disputed").length;
        return {
          rows: [{ total: String(total) }],
          rowCount: 1,
        };
      }

      // ============ BR-33 metrics: disputed_queue_count (conflict groups) ============
      if (
        text.includes("UNION ALL") &&
        text.includes("knowledge_link") &&
        text.includes("node_attribute") &&
        text.includes("'disputed'")
      ) {
        const linkScopes = new Set<string>();
        for (const l of store.links) {
          if (l.status !== "disputed") continue;
          linkScopes.add(
            `${l.source_node_id}\x1F${l.target_node_id}\x1F${l.link_type_id}`
          );
        }
        const attrScopes = new Set<string>();
        for (const a of store.attributes) {
          if (a.status !== "disputed") continue;
          attrScopes.add(`${a.node_id}\x1F${a.attribute_key_id}`);
        }
        return {
          rows: [{ total: String(linkScopes.size + attrScopes.size) }],
          rowCount: 1,
        };
      }

      throw new Error(`fake client: unknown SQL: ${text.slice(0, 200)}`);
    },
    release: () => undefined,
  };
  return fakeClient;
}

function countUpdate(store: Store, rowId: string): void {
  const cur = store.updateCountsByRowId.get(rowId) ?? 0;
  store.updateCountsByRowId.set(rowId, cur + 1);
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
  // The ingestion catalog has a narrower AttributeKeyRow shape (no description
  // / version) and additionally materializes `attributeValidValuesByKeyId` —
  // consulted by `correctItemService` for the closed-value-domain leg.
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
// Tests
// ---------------------------------------------------------------------------

describe("Curation — UC-04 (merge_nodes)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // Acceptance: merge_nodes performs path compression (BR-07) +
  //             alias copy (BR-08) + link repointing (BR-09).
  it("BR-04/BR-07/BR-08/BR-09: full merge flow", async () => {
    const store = buildEmptyStore();
    const survivor = "55555555-0000-4000-8000-000000000001";
    const absorbed = "55555555-0000-4000-8000-000000000002";
    const oldMerged = "55555555-0000-4000-8000-000000000003";
    store.nodes.push({
      id: survivor,
      node_type_id: UUID.PROJECT_NT,
      canonical_name: "Apollo Survivor",
      status: "active",
      merged_into_node_id: null,
    });
    store.nodes.push({
      id: absorbed,
      node_type_id: UUID.PROJECT_NT,
      canonical_name: "Apollo Absorbed",
      status: "active",
      merged_into_node_id: null,
    });
    // Path compression target: oldMerged previously pointed at absorbed.
    store.nodes.push({
      id: oldMerged,
      node_type_id: UUID.PROJECT_NT,
      canonical_name: "Apollo OldMerged",
      status: "merged",
      merged_into_node_id: absorbed,
    });
    // Alias on absorbed that survivor lacks.
    store.aliases.push({
      id: nextUuid(),
      node_id: absorbed,
      alias: "Apollo Project",
      kind: "canonical",
    });
    // Link pointing at absorbed.
    store.links.push({
      id: nextUuid("ll"),
      source_node_id: absorbed,
      target_node_id: survivor,
      link_type_id: UUID.LT_DEPENDS,
      valid_from: null,
      valid_to: null,
      status: "active",
      confidence: "0.9",
      valid_from_source: null,
      superseded_at: null,
      supersedes_link_id: null,
      recorded_at: new Date(),
      updated_at: new Date(),
    });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/nodes/merge",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          survivor_id: survivor,
          absorbed_id: absorbed,
          reason: "operator-confirmed duplicate",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        survivor_id: string;
        absorbed_id: string;
        action_id: string;
        affected: {
          links_repointed: number;
          attributes_repointed: number;
          aliases_copied: number;
          path_compressed_nodes: number;
        };
      };
      expect(body.survivor_id).toBe(survivor);
      expect(body.absorbed_id).toBe(absorbed);
      expect(body.affected.path_compressed_nodes).toBe(1);
      expect(body.affected.aliases_copied).toBe(1);
      expect(body.affected.links_repointed).toBe(1);

      // Audit row recorded with the right shape (BR-24, BR-25).
      expect(store.curation_actions.length).toBe(1);
      const action = store.curation_actions[0]!;
      expect(action.action).toBe("merge_nodes");
      expect(action.target_kind).toBe("node");
      expect(action.target_id).toBe(absorbed);
      expect(action.payload).toEqual({ survivor_id: survivor });

      // Path compression invariant: oldMerged now points at survivor.
      expect(
        store.nodes.find((n) => n.id === oldMerged)?.merged_into_node_id
      ).toBe(survivor);

      // Absorbed has status='merged' and merged_into_node_id=survivor.
      const abs = store.nodes.find((n) => n.id === absorbed)!;
      expect(abs.status).toBe("merged");
      expect(abs.merged_into_node_id).toBe(survivor);
    } finally {
      await app.close();
    }
  });

  // Acceptance: 422 BUSINESS_INVALID_TARGET_NODE on node_type mismatch.
  it("BR-06: resolve_entity_match(merge_into) with mismatched node_type returns 422", async () => {
    const store = buildEmptyStore();
    const proj = "55555555-0000-4000-8000-000000000010";
    const person = "55555555-0000-4000-8000-000000000011";
    store.nodes.push({
      id: proj,
      node_type_id: UUID.PROJECT_NT,
      canonical_name: "P",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/curation/entity-matches/${proj}/resolve`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          decision: "merge_into",
          target_node_id: person,
          reason: "ok",
        },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string; details?: unknown } };
      expect(body.error.code).toBe("BUSINESS_INVALID_TARGET_NODE");
    } finally {
      await app.close();
    }
  });
});

describe("Curation — UC-08 (confirm_item) preserves confidence", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("BR-21: confirm_item does not touch confidence", async () => {
    const store = buildEmptyStore();
    const attrId = "66666666-0000-4000-8000-000000000001";
    store.attributes.push({
      id: attrId,
      node_id: "77777777-0000-4000-8000-000000000001",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/confirm",
        headers: { authorization: `Bearer ${token}` },
        payload: { item_kind: "attribute", item_id: attrId },
      });
      expect(res.statusCode).toBe(200);
      const updated = store.attributes.find((a) => a.id === attrId)!;
      expect(updated.status).toBe("active");
      // Confidence preserved verbatim.
      expect(updated.confidence).toBe("0.55");
      // valid_from / valid_to / superseded_at untouched.
      expect(updated.valid_from).toBe("2026-01-01");
      expect(updated.valid_to).toBe(null);
      expect(updated.superseded_at).toBe(null);

      // CurationAction inserted.
      expect(store.curation_actions.length).toBe(1);
      const action = store.curation_actions[0]!;
      expect(action.action).toBe("confirm_item");
      expect(action.target_id).toBe(attrId);
    } finally {
      await app.close();
    }
  });

  it("BR-22: confirm_item on 'active' status returns 409 BUSINESS_ITEM_NOT_UNCERTAIN", async () => {
    const store = buildEmptyStore();
    const attrId = "66666666-0000-4000-8000-000000000002";
    store.attributes.push({
      id: attrId,
      node_id: "77777777-0000-4000-8000-000000000002",
      attribute_key_id: UUID.AK_DEADLINE,
      value_type: "date",
      value: "2026-07-01",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/confirm",
        headers: { authorization: `Bearer ${token}` },
        payload: { item_kind: "attribute", item_id: attrId },
      });
      expect(res.statusCode).toBe(409);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_ITEM_NOT_UNCERTAIN");
    } finally {
      await app.close();
    }
  });
});

describe("Curation — UC-09 (reject_item) pairs deleted + superseded_at", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("BR-20: status='deleted' AND superseded_at set in ONE UPDATE", async () => {
    const store = buildEmptyStore();
    const linkId = "88888888-0000-4000-8000-000000000001";
    store.links.push({
      id: linkId,
      source_node_id: "77777777-0000-4000-8000-000000000010",
      target_node_id: "77777777-0000-4000-8000-000000000011",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/reject",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "link",
          item_id: linkId,
          reason: "hallucinated",
        },
      });
      expect(res.statusCode).toBe(200);
      const link = store.links.find((l) => l.id === linkId)!;
      expect(link.status).toBe("deleted");
      expect(link.superseded_at).not.toBe(null);
      // Exactly ONE update statement was issued on this row.
      expect(store.updateCountsByRowId.get(linkId)).toBe(1);
      // Audit recorded.
      expect(store.curation_actions.length).toBe(1);
      expect(store.curation_actions[0]?.reason).toBe("hallucinated");
    } finally {
      await app.close();
    }
  });

  it("BR-22: reject_item on already-deleted returns 409 BUSINESS_ITEM_NOT_DELETABLE", async () => {
    const store = buildEmptyStore();
    const linkId = "88888888-0000-4000-8000-000000000002";
    store.links.push({
      id: linkId,
      source_node_id: "77777777-0000-4000-8000-000000000010",
      target_node_id: "77777777-0000-4000-8000-000000000011",
      link_type_id: UUID.LT_DEPENDS,
      valid_from: null,
      valid_to: null,
      status: "deleted",
      confidence: "0.8",
      valid_from_source: null,
      superseded_at: new Date(),
      supersedes_link_id: null,
      recorded_at: new Date(),
      updated_at: new Date(),
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/reject",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "link",
          item_id: linkId,
          reason: "ok",
        },
      });
      expect(res.statusCode).toBe(409);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_ITEM_NOT_DELETABLE");
    } finally {
      await app.close();
    }
  });
});

describe("Curation — UC-05 (resolve_dispute)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("BR-15: prefer_one without winner_id returns 422 BUSINESS_DISPUTE_WINNER_REQUIRED", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/disputes/resolve",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_ids: [
            "99999999-0000-4000-8000-000000000001",
            "99999999-0000-4000-8000-000000000002",
          ],
          decision: "prefer_one",
          reason: "ok",
        },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_DISPUTE_WINNER_REQUIRED");
    } finally {
      await app.close();
    }
  });

  it("BR-16: adjust_periods with overlapping open intervals on non-multiple-current returns 422 BUSINESS_TEMPORAL_INCOHERENT", async () => {
    const store = buildEmptyStore();
    const a1 = "99999999-0000-4000-8000-000000000010";
    const a2 = "99999999-0000-4000-8000-000000000011";
    const node = "77777777-0000-4000-8000-000000000020";
    // AK_DEADLINE has allows_multiple_current=false.
    for (const id of [a1, a2]) {
      store.attributes.push({
        id,
        node_id: node,
        attribute_key_id: UUID.AK_DEADLINE,
        value_type: "date",
        value: id === a1 ? "2026-07-15" : "2026-07-20",
        valid_from: "2026-01-01",
        valid_to: null,
        status: "disputed",
        confidence: "0.7",
        valid_from_source: "stated",
        superseded_at: null,
        supersedes_attribute_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      });
    }
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/disputes/resolve",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_ids: [a1, a2],
          decision: "adjust_periods",
          periods: [
            // BOTH rows end with valid_to=null on a non-multiple-current scope.
            { item_id: a1, valid_from: "2026-01-01", valid_to: null },
            { item_id: a2, valid_from: "2026-06-01", valid_to: null },
          ],
        },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_TEMPORAL_INCOHERENT");
    } finally {
      await app.close();
    }
  });

  it("prefer_one happy path: winner becomes active, losers paired deleted+superseded_at", async () => {
    const store = buildEmptyStore();
    const a1 = "99999999-0000-4000-8000-000000000030";
    const a2 = "99999999-0000-4000-8000-000000000031";
    const node = "77777777-0000-4000-8000-000000000030";
    for (const id of [a1, a2]) {
      store.attributes.push({
        id,
        node_id: node,
        attribute_key_id: UUID.AK_DEADLINE,
        value_type: "date",
        value: id === a1 ? "2026-07-15" : "2026-07-20",
        valid_from: "2026-01-01",
        valid_to: null,
        status: "disputed",
        confidence: "0.7",
        valid_from_source: "stated",
        superseded_at: null,
        supersedes_attribute_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      });
    }
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/disputes/resolve",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_ids: [a1, a2],
          decision: "prefer_one",
          winner_id: a2,
          reason: "source A explicitly states 20/07",
        },
      });
      expect(res.statusCode).toBe(200);
      const winner = store.attributes.find((a) => a.id === a2)!;
      expect(winner.status).toBe("active");
      const loser = store.attributes.find((a) => a.id === a1)!;
      expect(loser.status).toBe("deleted");
      expect(loser.superseded_at).not.toBe(null);
    } finally {
      await app.close();
    }
  });
});

describe("Curation — UC-10 (correct_item) preserves predecessor valid_to + provenance", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  it("BR-18: predecessor.valid_to unchanged after correction", async () => {
    const store = buildEmptyStore();
    const predId = "aaaaaaaa-0000-4000-8000-000000000001";
    store.attributes.push({
      id: predId,
      node_id: "77777777-0000-4000-8000-000000000040",
      attribute_key_id: UUID.AK_DEADLINE,
      value_type: "date",
      value: "2026-07-15",
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      status: "active",
      confidence: "0.9",
      valid_from_source: "document",
      superseded_at: null,
      supersedes_attribute_id: null,
      recorded_at: new Date(),
      updated_at: new Date(),
    });
    // 2 provenance rows on predecessor.
    store.provenance.push({
      id: nextUuid("pv"),
      link_id: null,
      attribute_id: predId,
      fragment_id: UUID.FRAG_1,
      created_at: new Date(),
    });
    store.provenance.push({
      id: nextUuid("pv"),
      link_id: null,
      attribute_id: predId,
      fragment_id: "bbbbbbbb-0000-4000-8000-000000000001",
      created_at: new Date(),
    });
    store.information_fragments.push({
      id: "bbbbbbbb-0000-4000-8000-000000000001",
      status: "accepted",
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: predId,
          corrected: { value: "2026-07-16" },
          reason: "errata received",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        new_item_id: string;
        predecessor_id: string;
        action_id: string;
      };

      // Predecessor: valid_to UNCHANGED, status='superseded'.
      const pred = store.attributes.find((a) => a.id === predId)!;
      expect(pred.status).toBe("superseded");
      expect(pred.valid_to).toBe("2026-12-31");
      expect(pred.superseded_at).not.toBe(null);

      // New row: status='active', supersedes_attribute_id=predId, value corrected.
      const newRow = store.attributes.find((a) => a.id === body.new_item_id)!;
      expect(newRow.status).toBe("active");
      expect(newRow.supersedes_attribute_id).toBe(predId);
      expect(newRow.value).toBe("2026-07-16");

      // Provenance: 2 rows copied from predecessor to new row (BR-19).
      const newProv = store.provenance.filter(
        (p) => p.attribute_id === body.new_item_id
      );
      expect(newProv.length).toBe(2);
      const fragments = newProv.map((p) => p.fragment_id).sort();
      expect(fragments).toContain(UUID.FRAG_1);
      expect(fragments).toContain("bbbbbbbb-0000-4000-8000-000000000001");

      // Audit row recorded.
      expect(store.curation_actions.length).toBe(1);
      expect(store.curation_actions[0]?.action).toBe("correct_item");
      expect(store.curation_actions[0]?.target_id).toBe(predId);
    } finally {
      await app.close();
    }
  });

  it("BR-17: valid_from_source=stated with bogus fragment_id returns 422 BUSINESS_DATE_UNJUSTIFIED", async () => {
    const store = buildEmptyStore();
    const predId = "aaaaaaaa-0000-4000-8000-000000000020";
    store.attributes.push({
      id: predId,
      node_id: "77777777-0000-4000-8000-000000000050",
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
    // Fragment with a wrong status is registered.
    const bogusFrag = "bbbbbbbb-0000-4000-8000-0000000000ff";
    store.information_fragments.push({
      id: bogusFrag,
      status: "rejected",
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: predId,
          corrected: {
            valid_from: "2026-02-01",
            valid_from_source: "stated",
            valid_from_fragment_id: bogusFrag,
          },
          reason: "errata",
        },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_DATE_UNJUSTIFIED");
    } finally {
      await app.close();
    }
  });

  // -------------------------------------------------------------------------
  // TC-04 (valid-values-attribute-domains) — BR-23 value validation.
  // Covers the spec acceptance criteria for `correctItemService`:
  //   (a) accept an in-domain corrected.value (existing test exercised the
  //       happy path; this one adds an explicit closed-domain success);
  //   (b) reject out-of-domain literal → 422 BUSINESS_INVALID_ATTRIBUTE_VALUE
  //       (domain leg, details = { attribute_key, value, allowed_values });
  //   (c) reject literal that fails type-parse → 422
  //       BUSINESS_INVALID_ATTRIBUTE_VALUE (type leg, details = { value_type,
  //       value }).
  // -------------------------------------------------------------------------
  it("BR-23 happy path: closed-domain corrected.value is accepted", async () => {
    const store = buildEmptyStore();
    // Add a closed-domain text key (mirrors knowledge-graph seed semantics:
    // Document.doc_type ∈ {proposta, ata, contrato, relatório, outro}).
    const docTypeKey = "33333333-0000-4000-8000-000000000010";
    store.attribute_keys.push({
      id: docTypeKey,
      node_type_id: UUID.PROJECT_NT,
      key: "doc_type",
      value_type: "text",
      allows_multiple_current: false,
    });
    store.attribute_valid_values.push(
      { attribute_key_id: docTypeKey, value: "proposta" },
      { attribute_key_id: docTypeKey, value: "ata" },
      { attribute_key_id: docTypeKey, value: "contrato" }
    );
    const predId = "aaaaaaaa-0000-4000-8000-000000000301";
    store.attributes.push({
      id: predId,
      node_id: "77777777-0000-4000-8000-000000000301",
      attribute_key_id: docTypeKey,
      value_type: "text",
      value: "ata",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: predId,
          corrected: { value: "contrato" },
          reason: "errata received",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { new_item_id: string };
      const newRow = store.attributes.find((a) => a.id === body.new_item_id)!;
      expect(newRow.value).toBe("contrato");
      expect(newRow.status).toBe("active");
    } finally {
      await app.close();
    }
  });

  it("BR-23 domain leg: out-of-domain corrected.value returns 422 BUSINESS_INVALID_ATTRIBUTE_VALUE", async () => {
    const store = buildEmptyStore();
    const docTypeKey = "33333333-0000-4000-8000-000000000011";
    store.attribute_keys.push({
      id: docTypeKey,
      node_type_id: UUID.PROJECT_NT,
      key: "doc_type",
      value_type: "text",
      allows_multiple_current: false,
    });
    store.attribute_valid_values.push(
      { attribute_key_id: docTypeKey, value: "proposta" },
      { attribute_key_id: docTypeKey, value: "ata" },
      { attribute_key_id: docTypeKey, value: "contrato" }
    );
    const predId = "aaaaaaaa-0000-4000-8000-000000000302";
    store.attributes.push({
      id: predId,
      node_id: "77777777-0000-4000-8000-000000000302",
      attribute_key_id: docTypeKey,
      value_type: "text",
      value: "ata",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: predId,
          corrected: { value: "memorando" },
          reason: "errata received",
        },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as {
        error: {
          code: string;
          details: {
            attribute_key: string;
            value: string;
            allowed_values: string[];
          };
        };
      };
      expect(body.error.code).toBe("BUSINESS_INVALID_ATTRIBUTE_VALUE");
      expect(body.error.details.attribute_key).toBe("doc_type");
      expect(body.error.details.value).toBe("memorando");
      // allowed_values is sorted lexicographically (TC-02 contract).
      expect(body.error.details.allowed_values).toEqual([
        "ata",
        "contrato",
        "proposta",
      ]);

      // Predecessor MUST NOT have been mutated (validation runs before
      // supersedePredecessor).
      const pred = store.attributes.find((a) => a.id === predId)!;
      expect(pred.status).toBe("active");
      expect(pred.superseded_at).toBe(null);
      // No new row inserted.
      const successors = store.attributes.filter(
        (a) => a.supersedes_attribute_id === predId
      );
      expect(successors.length).toBe(0);
      // No curation_action audit row written.
      expect(store.curation_actions.length).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("BR-23 type leg: corrected.value that does not parse against value_type returns 422 BUSINESS_INVALID_ATTRIBUTE_VALUE", async () => {
    const store = buildEmptyStore();
    // AK_DEADLINE has value_type='date' in the default fixture — feeding a
    // non-ISO literal triggers the type leg (no closed domain on this key).
    const predId = "aaaaaaaa-0000-4000-8000-000000000303";
    store.attributes.push({
      id: predId,
      node_id: "77777777-0000-4000-8000-000000000303",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: predId,
          corrected: { value: "tomorrow" },
          reason: "errata received",
        },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as {
        error: {
          code: string;
          details: { value_type: string; value: string };
        };
      };
      expect(body.error.code).toBe("BUSINESS_INVALID_ATTRIBUTE_VALUE");
      expect(body.error.details.value_type).toBe("date");
      expect(body.error.details.value).toBe("tomorrow");

      // Predecessor untouched, no audit row.
      const pred = store.attributes.find((a) => a.id === predId)!;
      expect(pred.status).toBe("active");
      expect(pred.superseded_at).toBe(null);
      expect(store.curation_actions.length).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("BR-23 open-domain text key: any string passes (back-compat)", async () => {
    // AK_EMAIL is value_type='text' with no rows in attribute_valid_values
    // — open domain. Any non-empty literal must be accepted.
    const store = buildEmptyStore();
    const predId = "aaaaaaaa-0000-4000-8000-000000000304";
    store.attributes.push({
      id: predId,
      node_id: "77777777-0000-4000-8000-000000000304",
      attribute_key_id: UUID.AK_EMAIL,
      value_type: "text",
      value: "old@example.com",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: predId,
          corrected: { value: "new@example.com" },
          reason: "errata received",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { new_item_id: string };
      const newRow = store.attributes.find((a) => a.id === body.new_item_id)!;
      expect(newRow.value).toBe("new@example.com");
    } finally {
      await app.close();
    }
  });

  it("BR-23 scope: correcting valid_from only (no corrected.value) skips value validation", async () => {
    // When corrected.value is NOT supplied (the curator is only adjusting
    // dates), the new value-validation legs MUST NOT run.
    const store = buildEmptyStore();
    const docTypeKey = "33333333-0000-4000-8000-000000000012";
    store.attribute_keys.push({
      id: docTypeKey,
      node_type_id: UUID.PROJECT_NT,
      key: "doc_type",
      value_type: "text",
      allows_multiple_current: false,
    });
    store.attribute_valid_values.push(
      { attribute_key_id: docTypeKey, value: "proposta" }
    );
    const predId = "aaaaaaaa-0000-4000-8000-000000000305";
    // The predecessor's `value` is NOT in the closed domain — this is a
    // legacy row written before the catalog was closed. correctItem with
    // only date changes MUST still succeed: the rule only fires when the
    // curator is rewriting the literal.
    store.attributes.push({
      id: predId,
      node_id: "77777777-0000-4000-8000-000000000305",
      attribute_key_id: docTypeKey,
      value_type: "text",
      value: "memorando",
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
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/items/correct",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          item_kind: "attribute",
          item_id: predId,
          corrected: {
            valid_from: "2026-02-01",
            valid_from_source: "received",
          },
          reason: "errata received",
        },
      });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});

describe("Curation — Auth", () => {
  it("rejects requests without JWT", async () => {
    const store = buildEmptyStore();
    const fixture = await buildAuthFixture();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/curation/queue",
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});

// ===========================================================================
// BR-33 — GET /api/v1/curation/metrics
// ===========================================================================
describe("Curation — BR-33 GET /metrics", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // Acceptance criterion: empty system returns 200 with `data:[]`-equivalent
  // empty snapshot — accept_rate=0 (zero-division convention) and
  // reject_rate_by_code={} (NEVER omitted; front spec depends on the key
  // being present).
  it("returns 200 with the empty snapshot when no data exists", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/curation/metrics",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      // Bare success body — consistent with every other curation REST
      // endpoint (the SPA's httpCuration returns the raw 2xx JSON; an
      // `{ ok, result }` wrapper would surface as all-undefined fields and
      // throw in toCurationMetrics). Error/degraded paths stay enveloped.
      const body = res.json() as {
        accept_rate: number;
        reject_rate_by_code: Record<string, number>;
        needs_review_count: number;
        uncertain_count: number;
        disputed_count: number;
        entity_match_queue_count: number;
        disputed_queue_count: number;
        computed_at: string;
      };
      // Zero-division convention: empty curation_action → accept_rate = 0.
      expect(body.accept_rate).toBe(0);
      // The empty map is surfaced as `{}` — NEVER omitted.
      expect(body.reject_rate_by_code).toEqual({});
      expect(body.needs_review_count).toBe(0);
      expect(body.uncertain_count).toBe(0);
      expect(body.disputed_count).toBe(0);
      expect(body.entity_match_queue_count).toBe(0);
      expect(body.disputed_queue_count).toBe(0);
      // ISO-8601 wall-clock anchor.
      expect(typeof body.computed_at).toBe("string");
      expect(new Date(body.computed_at).toString()).not.toBe("Invalid Date");
    } finally {
      await app.close();
    }
  });

  // Acceptance criterion: counts and rates derived from seeded fixtures
  // exercise each SQL source AND prove mutual coherence (every count
  // populated against the same snapshot).
  it("aggregates accept_rate, queues, uncertain/disputed counts from the snapshot", async () => {
    const store = buildEmptyStore();

    // 2 needs_review nodes → entity_match_queue_count = needs_review_count = 2
    store.nodes.push(
      {
        id: nextUuid("nn"),
        node_type_id: UUID.PROJECT_NT,
        canonical_name: "Pending A",
        status: "needs_review",
        merged_into_node_id: null,
      },
      {
        id: nextUuid("nn"),
        node_type_id: UUID.PROJECT_NT,
        canonical_name: "Pending B",
        status: "needs_review",
        merged_into_node_id: null,
      },
      {
        id: nextUuid("nn"),
        node_type_id: UUID.PROJECT_NT,
        canonical_name: "Active C",
        status: "active",
        merged_into_node_id: null,
      }
    );

    // 1 uncertain link + 1 uncertain attribute → uncertain_count = 2
    store.links.push({
      id: nextUuid("lu"),
      source_node_id: store.nodes[0].id,
      target_node_id: store.nodes[2].id,
      link_type_id: UUID.LT_DEPENDS,
      valid_from: null,
      valid_to: null,
      status: "uncertain",
      confidence: "0.60",
      valid_from_source: null,
      superseded_at: null,
      supersedes_link_id: null,
      recorded_at: new Date(),
      updated_at: new Date(),
    });
    store.attributes.push({
      id: nextUuid("au"),
      node_id: store.nodes[2].id,
      attribute_key_id: UUID.AK_DEADLINE,
      value_type: "date",
      value: "2026-07-15",
      valid_from: null,
      valid_to: null,
      status: "uncertain",
      confidence: "0.55",
      valid_from_source: null,
      superseded_at: null,
      supersedes_attribute_id: null,
      recorded_at: new Date(),
      updated_at: new Date(),
    });

    // 2 disputed link rows on the SAME scope (same source/target/link_type) →
    // 1 conflict GROUP. Plus 2 disputed attribute rows on the SAME (node, key)
    // scope → 1 conflict GROUP. → disputed_queue_count = 2, disputed_count = 4.
    const linkScopeA = store.nodes[0].id;
    const linkScopeB = store.nodes[2].id;
    store.links.push(
      {
        id: nextUuid("ld"),
        source_node_id: linkScopeA,
        target_node_id: linkScopeB,
        link_type_id: UUID.LT_DEPENDS,
        valid_from: null,
        valid_to: null,
        status: "disputed",
        confidence: "0.80",
        valid_from_source: null,
        superseded_at: null,
        supersedes_link_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: nextUuid("ld"),
        source_node_id: linkScopeA,
        target_node_id: linkScopeB,
        link_type_id: UUID.LT_DEPENDS,
        valid_from: null,
        valid_to: null,
        status: "disputed",
        confidence: "0.82",
        valid_from_source: null,
        superseded_at: null,
        supersedes_link_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      }
    );
    store.attributes.push(
      {
        id: nextUuid("ad"),
        node_id: store.nodes[2].id,
        attribute_key_id: UUID.AK_DEADLINE,
        value_type: "date",
        value: "2026-07-15",
        valid_from: null,
        valid_to: null,
        status: "disputed",
        confidence: "0.82",
        valid_from_source: "document",
        superseded_at: null,
        supersedes_attribute_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: nextUuid("ad"),
        node_id: store.nodes[2].id,
        attribute_key_id: UUID.AK_DEADLINE,
        value_type: "date",
        value: "2026-07-20",
        valid_from: null,
        valid_to: null,
        status: "disputed",
        confidence: "0.85",
        valid_from_source: "stated",
        superseded_at: null,
        supersedes_attribute_id: null,
        recorded_at: new Date(),
        updated_at: new Date(),
      }
    );

    // 8 curation actions in the audit trail:
    //   - 6 accept-typed (confirm_item, resolve_dispute, …) → accepted = 6
    //   - 2 reject_item:
    //       * 1 with payload.error_code = "BUSINESS_INVALID_TARGET_NODE"
    //       * 1 with payload.error_code = "BUSINESS_TEMPORAL_INCOHERENT"
    //   → accept_rate = 6 / 8 = 0.75
    //   → reject_rate_by_code:
    //       * "BUSINESS_INVALID_TARGET_NODE": 1/8 = 0.125
    //       * "BUSINESS_TEMPORAL_INCOHERENT": 1/8 = 0.125
    const acceptVerbs = [
      "confirm_item",
      "resolve_dispute",
      "resolve_dispute",
      "merge_nodes",
      "resolve_entity_match",
      "correct_item",
    ] as const;
    for (const a of acceptVerbs) {
      store.curation_actions.push({
        id: nextUuid("ca"),
        action: a,
        target_kind: "link",
        target_id: store.nodes[0].id,
        payload: {},
        reason: null,
        created_at: new Date(),
      });
    }
    store.curation_actions.push({
      id: nextUuid("ca"),
      action: "reject_item",
      target_kind: "link",
      target_id: store.nodes[0].id,
      payload: { error_code: "BUSINESS_INVALID_TARGET_NODE" },
      reason: "wrong target",
      created_at: new Date(),
    });
    store.curation_actions.push({
      id: nextUuid("ca"),
      action: "reject_item",
      target_kind: "attribute",
      target_id: store.nodes[0].id,
      payload: { error_code: "BUSINESS_TEMPORAL_INCOHERENT" },
      reason: "bad period",
      created_at: new Date(),
    });

    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/curation/metrics",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      // Bare success body (see the cold-start metrics test above).
      const body = res.json() as {
        accept_rate: number;
        reject_rate_by_code: Record<string, number>;
        needs_review_count: number;
        uncertain_count: number;
        disputed_count: number;
        entity_match_queue_count: number;
        disputed_queue_count: number;
      };
      // accept_rate = 6 / 8 = 0.75 (in [0,1]).
      expect(body.accept_rate).toBeCloseTo(0.75, 6);
      // reject_rate_by_code surfaces ONE entry per distinct error_code with
      // the fraction over total actions (NOT over rejects only).
      expect(body.reject_rate_by_code).toEqual({
        BUSINESS_INVALID_TARGET_NODE: 0.125,
        BUSINESS_TEMPORAL_INCOHERENT: 0.125,
      });
      // Every count is non-negative and matches the seeded fixture.
      expect(body.needs_review_count).toBe(2);
      expect(body.entity_match_queue_count).toBe(2);
      expect(body.uncertain_count).toBe(2);
      // 2 disputed links + 2 disputed attrs = 4 assertions.
      expect(body.disputed_count).toBe(4);
      // 1 link group + 1 attribute group = 2 conflict groups.
      expect(body.disputed_queue_count).toBe(2);
    } finally {
      await app.close();
    }
  });

  // Acceptance criterion: 401 without JWT (inherited from the shared
  // requireNeonAuth preHandler — BR-01).
  it("returns 401 without a JWT", async () => {
    const store = buildEmptyStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/curation/metrics",
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  // Acceptance criterion: 503 (NOT 500) when Neon is unreachable —
  // graceful-degradation override of BR-28 so the front spec MetricsStrip
  // can fall back to listReviewQueue totals.
  it("returns 503 SYSTEM_SERVICE_UNAVAILABLE on pg ECONNREFUSED", async () => {
    const store = buildEmptyStore();
    // Pool that fails every connect/query with ECONNREFUSED — same shape as
    // the observability regression test below.
    const fail = (): never => {
      throw Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432"), {
        code: "ECONNREFUSED",
      });
    };
    const failingPool: any = {
      connect: async () => ({
        query: async () => fail(),
        release: () => undefined,
      }),
      on: () => undefined,
      end: async () => undefined,
    };
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: failingPool,
      auth: buildNeonAuth(envFixture, async () =>
        ({
          type: "public",
          algorithm: "RS256",
          ...fixture.publicJwk,
        }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      catalog: buildCatalogFromStore(store),
      ingestionCatalog: buildIngestionCatalogFromStore(store),
    });
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/curation/metrics",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(503);
      const body = res.json() as {
        ok: boolean;
        error: { code: string; message: string };
      };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
      // The masked envelope NEVER leaks the underlying ECONNREFUSED message.
      expect(body.error.message).not.toContain("ECONNREFUSED");
    } finally {
      await app.close();
    }
  });

  // BR-33 graceful-degradation contract: ANY non-pg-mapped fault (residual
  // 500 from the shared mapper) must be re-mapped to 503 so the front spec
  // never sees a 500. Exercised by a non-pg throw inside the service.
  it("re-maps residual 500 outcomes to 503 (graceful degradation)", async () => {
    const store = buildEmptyStore();
    // Pool whose query throws a non-pg, non-Zod error — `mapErrorToHttpResponse`
    // would normally return 500 SYSTEM_INTERNAL_ERROR; the route's local
    // mapper re-maps it to 503.
    const opaqueError = new Error("opaque view-not-found");
    const failingPool: any = {
      connect: async () => ({
        query: async () => {
          throw opaqueError;
        },
        release: () => undefined,
      }),
      on: () => undefined,
      end: async () => undefined,
    };
    const app = await buildApp({
      env: envFixture,
      logger: silentLogger,
      pool: failingPool,
      auth: buildNeonAuth(envFixture, async () =>
        ({
          type: "public",
          algorithm: "RS256",
          ...fixture.publicJwk,
        }) as never
      ),
      mcp: buildMcpServer(silentLogger),
      catalog: buildCatalogFromStore(store),
      ingestionCatalog: buildIngestionCatalogFromStore(store),
    });
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/curation/metrics",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(503);
      const body = res.json() as {
        ok: boolean;
        error: { code: string };
      };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
    } finally {
      await app.close();
    }
  });
});

describe("Curation — observability (BUG-01 regression)", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // pino logger that captures every emitted record so we can assert what is
  // logged server-side. A plain object with `write` is a valid pino destination.
  function buildCaptureLogger() {
    const records: Array<Record<string, unknown>> = [];
    const logger = pino(
      { level: "trace" },
      { write: (s: string) => records.push(JSON.parse(s)) }
    );
    return { logger, records };
  }

  // A pool that behaves as if Postgres were unreachable — both `connect` and
  // the returned client's `query` raise an ECONNREFUSED error, so whichever
  // path a service takes lands in the shared mapper's `logLevel: "error"`
  // (503 SYSTEM_SERVICE_UNAVAILABLE) branch.
  function buildUnavailablePool(): any {
    const fail = (): never => {
      throw Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432"), {
        code: "ECONNREFUSED",
      });
    };
    const client = { query: async () => fail(), release: () => undefined };
    return {
      connect: async () => client,
      query: async () => fail(),
      on: () => undefined,
      end: async () => undefined,
    };
  }

  async function buildAppWithLogger(
    logger: ReturnType<typeof pino>,
    pool: unknown
  ) {
    const store = buildEmptyStore();
    return buildApp({
      env: envFixture,
      logger: logger as never,
      pool: pool as never,
      auth: buildNeonAuth(envFixture, async () =>
        ({ type: "public", algorithm: "RS256", ...fixture.publicJwk }) as never
      ),
      mcp: buildMcpServer(logger as never),
      catalog: buildCatalogFromStore(store),
      ingestionCatalog: buildIngestionCatalogFromStore(store),
    });
  }

  // The regression: `sendError` previously discarded the mapper's `logLevel`,
  // so pg-unavailable / unknown faults on curation routes stopped being logged
  // server-side after the BR-30 refactor (the masked envelope hides the cause).
  it("logs pg-unavailable on a write route at error level (cause preserved server-side)", async () => {
    const { logger, records } = buildCaptureLogger();
    const app = await buildAppWithLogger(logger, buildUnavailablePool());
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/nodes/merge",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          survivor_id: "11111111-1111-4111-8111-111111111111",
          absorbed_id: "22222222-2222-4222-8222-222222222222",
          reason: "operator dedup merge",
        },
      });

      // Client gets the masked 503 — `err.message` is never leaked.
      expect(res.statusCode).toBe(503);
      const body = res.json() as {
        ok: boolean;
        error: { code: string; message: string };
      };
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
      expect(body.error.message).not.toContain("ECONNREFUSED");

      // Server-side: the cause IS logged at error level (this is what BUG-01
      // had regressed).
      const failureLog = records.find(
        (r) => r.msg === "curation_request_failed"
      );
      expect(failureLog).toBeDefined();
      expect(failureLog?.level).toBe(50); // pino numeric level for "error"
      expect(failureLog?.error_code).toBe("SYSTEM_SERVICE_UNAVAILABLE");
      expect(String(failureLog?.cause_message)).toContain("ECONNREFUSED");
    } finally {
      await app.close();
    }
  });

  // Counterpart: expected client-driven faults (warn) must NOT be logged at
  // error level — preserving the pre-refactor behaviour and avoiding noise.
  it("does NOT log expected business/validation faults at error level", async () => {
    const { logger, records } = buildCaptureLogger();
    // Self-merge fails Zod validation before the pool is touched -> warn path.
    const app = await buildAppWithLogger(logger, buildUnavailablePool());
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/curation/nodes/merge",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          survivor_id: "11111111-1111-4111-8111-111111111111",
          absorbed_id: "11111111-1111-4111-8111-111111111111",
          reason: "self merge",
        },
      });

      expect(res.statusCode).toBe(409);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_SELF_MERGE_FORBIDDEN");

      const errorFailureLogs = records.filter(
        (r) => r.msg === "curation_request_failed" && r.level === 50
      );
      expect(errorFailureLogs).toHaveLength(0);
    } finally {
      await app.close();
    }
  });
});
