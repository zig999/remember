// Integration tests for the TC-04 knowledge-graph routes.
//
// Acceptance criteria covered (validation.criteria of dev_tc_004):
//   - GET /node-types returns all 8 seeded types
//   - GET /link-types?include_rules=true embeds rules for each LinkType
//   - GET /attribute-keys?node_type=UnknownType returns 422
//     BUSINESS_UNKNOWN_NODE_TYPE
//   - GET /nodes?node_type=Project&name_prefix=Apollo returns matching
//     nodes only
//   - GET /nodes/{id} for deleted node returns 410 BUSINESS_NODE_DELETED
//   - GET /nodes/{id} for merged node returns 200 with
//     merged_into_node_id set
//   - GET /nodes/{id}?as_of=YYYY-MM-DD applies valid-time travel filter
//   - GET /links/{id} assembles provenance in one SQL query (no N+1)
//
// Strategy mirrors the ingestion integration tests: build the real Fastify
// app with a fake pg.Pool whose client interprets a small set of SQL
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
import { norm } from "../../../modules/knowledge-graph/service/norm.js";

/**
 * Unwrap the `{ ok: true, result }` success envelope returned by the KG REST
 * read endpoints (openapi v1.5.0; CLAUDE.md "REST devolve o envelope direto").
 * Success bodies are read through this; ERROR bodies stay raw
 * (`res.json() as { error: { code } }`) — the error envelope has no `result`.
 */
const okResult = (res: { json: () => unknown }): unknown =>
  (res.json() as { ok: true; result: unknown }).result;

// ---------------------------------------------------------------------------
// Test fixture — fake DB
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

interface AttrRowMem {
  id: string;
  node_id: string;
  attribute_key_id: string;
  attribute_key: string;
  value_type: "date" | "number" | "text" | "bool";
  value: string;
  valid_from: string | null;
  valid_to: string | null;
  superseded_at: string | null;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: number;
  valid_from_source: "stated" | "document" | "received" | null;
  supersedes_attribute_id: string | null;
}

interface LinkRowMem {
  id: string;
  source_node_id: string;
  target_node_id: string;
  link_type_id: string;
  link_type: string;
  link_inverse_name: string;
  valid_from: string | null;
  valid_to: string | null;
  superseded_at: string | null;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: number;
  valid_from_source: "stated" | "document" | "received" | null;
  supersedes_link_id: string | null;
}

interface ProvRowMem {
  id: string;
  link_id: string | null;
  attribute_id: string | null;
  fragment_id: string;
  fragment_text: string;
  fragment_confidence: number;
  raw_information_id: string;
  source_type: "pdf" | "email" | "ata" | "chat" | "artigo" | "transcricao" | "outro";
  received_at: Date;
  excerpt: string;
}

interface NodeTypeMem {
  id: string;
  name: string;
  description: string;
  version: number;
}
interface LinkTypeMem {
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
}
interface LinkTypeRuleMem {
  id: string;
  link_type_id: string;
  source_node_type_id: string;
  target_node_type_id: string;
  valid_from: Date | null;
  valid_to: Date | null;
}
interface AttrKeyMem {
  id: string;
  node_type_id: string;
  key: string;
  value_type: "date" | "number" | "text" | "bool";
  is_temporal: boolean;
  allows_multiple_current: boolean;
  requires_valid_from: boolean;
  description: string;
  version: number;
}

interface Store {
  node_types: NodeTypeMem[];
  link_types: LinkTypeMem[];
  link_type_rules: LinkTypeRuleMem[];
  attribute_keys: AttrKeyMem[];
  /** BR-30 closed-domain values (optional; absent -> every key is open). */
  attribute_valid_values?: { attribute_key_id: string; value: string }[];
  nodes: NodeRowMem[];
  aliases: AliasRowMem[];
  attributes: AttrRowMem[];
  links: LinkRowMem[];
  provenance: ProvRowMem[];
  /** Counter for "no N+1" assertion on provenance fetches. */
  provenanceQueryCount: number;
}

function buildSeededStore(): Store {
  const NT = (n: string) => ({
    id: `nt-${n.toLowerCase()}`,
    name: n,
    description: `${n} description`,
    version: 1,
  });
  const node_types: NodeTypeMem[] = [
    "Project",
    "Person",
    "Organization",
    "Event",
    "Document",
    "Place",
    "Topic",
    "Task",
  ].map(NT);

  const link_types: LinkTypeMem[] = [
    "participates_in",
    "responsible_for",
    "reports_to",
    "member_of",
    "located_at",
    "depends_on",
    "related_to",
    "about",
    "happened_at",
    "produced_by",
  ].map((n) => ({
    id: `lt-${n}`,
    name: n,
    label: n,
    description: `${n} description`,
    inverse_name: `inv_${n}`,
    is_temporal: true,
    allows_multiple_current: false,
    requires_valid_from: true,
    requires_valid_to_on_change: false,
    version: 1,
  }));

  // 22 rules — distribute across link_types (10 base + 12 extras).
  const link_type_rules: LinkTypeRuleMem[] = link_types.flatMap((lt, idx) => {
    const src = node_types[idx % node_types.length]!;
    const tgt = node_types[(idx + 1) % node_types.length]!;
    const tgt2 = node_types[(idx + 2) % node_types.length]!;
    const tgt3 = node_types[(idx + 3) % node_types.length]!;
    const rules: LinkTypeRuleMem[] = [
      {
        id: `rule-${lt.id}-1`,
        link_type_id: lt.id,
        source_node_type_id: src.id,
        target_node_type_id: tgt.id,
        valid_from: null,
        valid_to: null,
      },
    ];
    // First 10 -> +1 rule (base 10 + 10 = 20)
    rules.push({
      id: `rule-${lt.id}-2`,
      link_type_id: lt.id,
      source_node_type_id: src.id,
      target_node_type_id: tgt2.id,
      valid_from: null,
      valid_to: null,
    });
    // First 2 -> +1 more rule (20 + 2 = 22)
    if (idx < 2) {
      rules.push({
        id: `rule-${lt.id}-3`,
        link_type_id: lt.id,
        source_node_type_id: src.id,
        target_node_type_id: tgt3.id,
        valid_from: null,
        valid_to: null,
      });
    }
    return rules;
  });

  const attribute_keys: AttrKeyMem[] = [
    { node_type_id: node_types[0]!.id, key: "deadline", value_type: "date" },
    { node_type_id: node_types[0]!.id, key: "status_label", value_type: "text" },
    { node_type_id: node_types[1]!.id, key: "email", value_type: "text" },
    { node_type_id: node_types[1]!.id, key: "birth_date", value_type: "date" },
    {
      node_type_id: node_types[2]!.id,
      key: "headquarters",
      value_type: "text",
    },
    { node_type_id: node_types[3]!.id, key: "date", value_type: "date" },
    { node_type_id: node_types[4]!.id, key: "doc_date", value_type: "date" },
    { node_type_id: node_types[5]!.id, key: "country", value_type: "text" },
    { node_type_id: node_types[6]!.id, key: "summary", value_type: "text" },
    {
      node_type_id: node_types[7]!.id,
      key: "completed",
      value_type: "bool",
    },
  ].map((r, i) => ({
    id: `ak-${i + 1}`,
    node_type_id: r.node_type_id,
    key: r.key,
    value_type: r.value_type,
    is_temporal: true,
    allows_multiple_current: false,
    requires_valid_from: r.value_type === "date",
    description: `${r.key} description`,
    version: 1,
  }));

  return {
    node_types,
    link_types,
    link_type_rules,
    attribute_keys,
    nodes: [],
    aliases: [],
    attributes: [],
    links: [],
    provenance: [],
    provenanceQueryCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Fake pg client — interprets the SQL templates issued by the module.
// ---------------------------------------------------------------------------

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

      // node_type listing
      if (text.startsWith("SELECT id, name, description, version") && text.includes("FROM node_type")) {
        return { rows: store.node_types.slice().sort((a, b) => a.name.localeCompare(b.name)), rowCount: store.node_types.length };
      }
      // link_type listing
      if (text.startsWith("SELECT id, name, label, description, inverse_name") && text.includes("FROM link_type") && !text.includes("link_type_rule")) {
        return { rows: store.link_types.slice().sort((a, b) => a.name.localeCompare(b.name)), rowCount: store.link_types.length };
      }
      // link_type_rule listing with joins
      if (text.includes("FROM link_type_rule r") && text.includes("JOIN node_type src") && text.includes("JOIN node_type tgt")) {
        const rows = store.link_type_rules.map((r) => ({
          id: r.id,
          link_type_id: r.link_type_id,
          source_node_type: store.node_types.find((n) => n.id === r.source_node_type_id)!.name,
          target_node_type: store.node_types.find((n) => n.id === r.target_node_type_id)!.name,
          valid_from: r.valid_from,
          valid_to: r.valid_to,
        }));
        return { rows, rowCount: rows.length };
      }
      // attribute_key listing (optional node_type_id filter)
      if (text.includes("FROM attribute_key ak") && text.includes("JOIN node_type nt")) {
        let rows = store.attribute_keys.map((ak) => ({
          id: ak.id,
          node_type_id: ak.node_type_id,
          node_type: store.node_types.find((n) => n.id === ak.node_type_id)!.name,
          key: ak.key,
          value_type: ak.value_type,
          is_temporal: ak.is_temporal,
          allows_multiple_current: ak.allows_multiple_current,
          requires_valid_from: ak.requires_valid_from,
          description: ak.description,
          version: ak.version,
        }));
        if (text.includes("WHERE ak.node_type_id = $1")) {
          rows = rows.filter((r) => r.node_type_id === String(params[0]));
        }
        return { rows, rowCount: rows.length };
      }
      // attribute_valid_value listing (BR-30; optional node_type filter via
      // join through attribute_key)
      if (text.includes("FROM attribute_valid_value avv")) {
        let rows = (store.attribute_valid_values ?? []).map((v) => ({
          attribute_key_id: v.attribute_key_id,
          value: v.value,
        }));
        if (text.includes("WHERE ak.node_type_id = $1")) {
          const ntId = String(params[0]);
          const keyIds = new Set(
            store.attribute_keys
              .filter((ak) => ak.node_type_id === ntId)
              .map((ak) => ak.id)
          );
          rows = rows.filter((r) => keyIds.has(r.attribute_key_id));
        }
        return { rows, rowCount: rows.length };
      }
      // knowledge_node by id
      if (text.includes("FROM knowledge_node kn") && text.includes("WHERE kn.id = $1")) {
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
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          rowCount: 1,
        };
      }
      // knowledge_node listing (count + data)
      if (text.includes("FROM knowledge_node kn") && text.includes("JOIN node_type nt")) {
        // Parse filter params positionally.
        // params[0] = status (always present)
        // optional: node_type_id, name_prefix_norm (in either order — we
        // emit them in this fixed order from the repository).
        const status = String(params[0]);
        let nodeTypeId: string | undefined;
        let prefixNorm: string | undefined;
        let limit = 20;
        let offset = 0;
        if (text.includes("kn.node_type_id = $2") && text.includes("alias_norm LIKE $3")) {
          nodeTypeId = String(params[1]);
          prefixNorm = String(params[2]);
          if (text.includes("count(DISTINCT")) {
            // No limit/offset on count.
          } else {
            limit = Number(params[3]);
            offset = Number(params[4]);
          }
        } else if (text.includes("kn.node_type_id = $2") && !text.includes("alias_norm")) {
          nodeTypeId = String(params[1]);
          if (!text.includes("count(DISTINCT")) {
            limit = Number(params[2]);
            offset = Number(params[3]);
          }
        } else if (!text.includes("kn.node_type_id") && text.includes("alias_norm LIKE $2")) {
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
        // DISTINCT by id
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
            created_at: new Date(),
            updated_at: new Date(),
          };
        });
        return { rows, rowCount: rows.length };
      }
      // aliases by node_id
      if (text.includes("FROM node_alias") && text.includes("WHERE node_id = $1")) {
        const id = String(params[0]);
        const rows = store.aliases.filter((a) => a.node_id === id).map((a) => ({
          id: a.id,
          node_id: a.node_id,
          alias: a.alias,
          alias_norm: norm(a.alias),
          kind: a.kind,
          created_at: new Date(),
        }));
        return { rows, rowCount: rows.length };
      }
      // attributes via resolved view
      if (text.includes("FROM node_attribute_resolved na") && text.includes("WHERE na.node_id = $1")) {
        const id = String(params[0]);
        let attrs = store.attributes.filter((a) => a.node_id === id);

        // Detect mode by SQL shape.
        const isAsOfMode = text.includes("na.valid_from <= $2");
        if (isAsOfMode) {
          const asOf = String(params[1]);
          attrs = attrs.filter(
            (a) =>
              a.superseded_at === null &&
              (a.valid_from === null || a.valid_from <= asOf) &&
              (a.valid_to === null || a.valid_to > asOf)
          );
        } else {
          attrs = attrs.filter(
            (a) => a.valid_to === null && a.superseded_at === null
          );
          if (text.includes("valid_from <= current_date")) {
            const today = new Date().toISOString().slice(0, 10);
            attrs = attrs.filter(
              (a) => a.valid_from === null || a.valid_from <= today
            );
          }
        }
        if (text.includes("status <> 'uncertain'")) {
          attrs = attrs.filter((a) => a.status !== "uncertain");
        }
        const rows = attrs.map((a) => ({
          id: a.id,
          node_id: a.node_id,
          attribute_key_id: a.attribute_key_id,
          value_type: a.value_type,
          value: a.value,
          valid_from: a.valid_from,
          valid_to: a.valid_to,
          recorded_at: new Date(),
          superseded_at: a.superseded_at ? new Date(a.superseded_at) : null,
          status: a.status,
          confidence: a.confidence,
          valid_from_source: a.valid_from_source,
          created_by_run_id: null,
          supersedes_attribute_id: a.supersedes_attribute_id,
          created_at: new Date(),
          updated_at: new Date(),
          attribute_key: a.attribute_key,
          key_is_temporal: true,
          key_allows_multiple_current: false,
          is_current: a.valid_to === null && a.superseded_at === null,
          is_in_effect:
            a.valid_to === null &&
            a.superseded_at === null &&
            (a.valid_from === null ||
              a.valid_from <= new Date().toISOString().slice(0, 10)),
          effective_status: a.status,
        }));
        return { rows, rowCount: rows.length };
      }
      // attribute by id (resolved view)
      if (text.includes("FROM node_attribute_resolved na") && text.includes("WHERE na.id = $1")) {
        const id = String(params[0]);
        const a = store.attributes.find((x) => x.id === id);
        if (!a) return { rows: [], rowCount: 0 };
        return {
          rows: [
            {
              id: a.id,
              node_id: a.node_id,
              attribute_key_id: a.attribute_key_id,
              value_type: a.value_type,
              value: a.value,
              valid_from: a.valid_from,
              valid_to: a.valid_to,
              recorded_at: new Date(),
              superseded_at: a.superseded_at ? new Date(a.superseded_at) : null,
              status: a.status,
              confidence: a.confidence,
              valid_from_source: a.valid_from_source,
              created_by_run_id: null,
              supersedes_attribute_id: a.supersedes_attribute_id,
              created_at: new Date(),
              updated_at: new Date(),
              attribute_key: a.attribute_key,
              key_is_temporal: true,
              key_allows_multiple_current: false,
              is_current: a.valid_to === null && a.superseded_at === null,
              is_in_effect:
                a.valid_to === null &&
                a.superseded_at === null &&
                (a.valid_from === null ||
                  a.valid_from <= new Date().toISOString().slice(0, 10)),
              effective_status: a.status,
            },
          ],
          rowCount: 1,
        };
      }
      // link by id (resolved view)
      if (text.includes("FROM knowledge_link_resolved kl") && text.includes("WHERE kl.id = $1")) {
        const id = String(params[0]);
        const l = store.links.find((x) => x.id === id);
        if (!l) return { rows: [], rowCount: 0 };
        return {
          rows: [
            {
              id: l.id,
              source_node_id: l.source_node_id,
              target_node_id: l.target_node_id,
              link_type_id: l.link_type_id,
              valid_from: l.valid_from,
              valid_to: l.valid_to,
              recorded_at: new Date(),
              superseded_at: l.superseded_at ? new Date(l.superseded_at) : null,
              status: l.status,
              confidence: l.confidence,
              valid_from_source: l.valid_from_source,
              created_by_run_id: null,
              supersedes_link_id: l.supersedes_link_id,
              created_at: new Date(),
              updated_at: new Date(),
              link_type: l.link_type,
              link_inverse_name: l.link_inverse_name,
              is_current: l.valid_to === null && l.superseded_at === null,
              is_in_effect:
                l.valid_to === null &&
                l.superseded_at === null &&
                (l.valid_from === null ||
                  l.valid_from <= new Date().toISOString().slice(0, 10)),
              effective_status: l.status,
            },
          ],
          rowCount: 1,
        };
      }
      // Provenance assembled in ONE batched query (BR-16).
      if (text.includes("FROM provenance p") && text.includes("= ANY($1::uuid[])")) {
        store.provenanceQueryCount += 1;
        const ids = (params[0] as string[]) ?? [];
        const targetCol = text.includes("p.link_id AS target_id")
          ? "link_id"
          : "attribute_id";
        const rows = store.provenance
          .filter((p) => {
            const v = targetCol === "link_id" ? p.link_id : p.attribute_id;
            return v !== null && ids.includes(v);
          })
          .map((p) => ({
            target_id: targetCol === "link_id" ? p.link_id! : p.attribute_id!,
            fragment_id: p.fragment_id,
            fragment_text: p.fragment_text,
            fragment_confidence: p.fragment_confidence,
            raw_information_id: p.raw_information_id,
            source_type: p.source_type,
            received_at: p.received_at,
            excerpt: p.excerpt,
          }));
        return { rows, rowCount: rows.length };
      }
      throw new Error(`fake client: unknown SQL: ${text.slice(0, 200)}`);
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
    nodeTypes: store.node_types.map((n) => ({
      id: n.id,
      name: n.name,
      description: n.description,
      version: n.version,
    })),
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
    linkTypeRules: store.link_type_rules.map((r) => ({
      id: r.id,
      link_type_id: r.link_type_id,
      source_node_type_id: r.source_node_type_id,
      target_node_type_id: r.target_node_type_id,
      valid_from: r.valid_from,
      valid_to: r.valid_to,
    })),
    attributeKeys: store.attribute_keys.map((a) => ({
      id: a.id,
      node_type_id: a.node_type_id,
      key: a.key,
      value_type: a.value_type,
      is_temporal: a.is_temporal,
      allows_multiple_current: a.allows_multiple_current,
      requires_valid_from: a.requires_valid_from,
      description: a.description,
      version: a.version,
    })),
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
// Tests
// ---------------------------------------------------------------------------

describe("Knowledge Graph — Catalog endpoints", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // UC-01: GET /node-types returns all 8 seeded types.
  it("GET /api/v1/node-types returns all 8 seeded types", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/node-types",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as { total: number; items: { name: string }[] };
      expect(body.total).toBe(8);
      expect(body.items.map((i) => i.name).sort()).toEqual(
        [
          "Document",
          "Event",
          "Organization",
          "Person",
          "Place",
          "Project",
          "Task",
          "Topic",
        ].sort()
      );
    } finally {
      await app.close();
    }
  });

  // UC-02: GET /link-types?include_rules=true embeds rules.
  it("GET /api/v1/link-types?include_rules=true embeds rules per LinkType", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/link-types?include_rules=true",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as {
        total: number;
        items: { name: string; rules?: unknown[] }[];
      };
      expect(body.total).toBe(10);
      const totalRules = body.items.reduce(
        (acc, i) => acc + (i.rules?.length ?? 0),
        0
      );
      expect(totalRules).toBe(22);
      // Each LinkType receives an array (possibly empty), guaranteeing the
      // embedding contract.
      for (const item of body.items) {
        expect(Array.isArray(item.rules)).toBe(true);
      }
    } finally {
      await app.close();
    }
  });

  // UC-02 — default mode (no include_rules) does NOT embed rules.
  it("GET /api/v1/link-types omits rules by default", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/link-types",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as { items: { rules?: unknown[] }[] };
      for (const item of body.items) {
        expect(item.rules).toBeUndefined();
      }
    } finally {
      await app.close();
    }
  });

  // UC-03: BR-03 unknown node_type -> 422 BUSINESS_UNKNOWN_NODE_TYPE
  it("GET /api/v1/attribute-keys?node_type=UnknownType returns 422 BUSINESS_UNKNOWN_NODE_TYPE", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/attribute-keys?node_type=UnknownType",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as {
        error: { code: string; details?: { node_type?: string } };
      };
      expect(body.error.code).toBe("BUSINESS_UNKNOWN_NODE_TYPE");
      expect(body.error.details?.node_type).toBe("UnknownType");
    } finally {
      await app.close();
    }
  });

  it("GET /api/v1/attribute-keys?node_type=Project returns only Project keys", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/attribute-keys?node_type=Project",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as {
        items: { key: string; node_type: string }[];
      };
      expect(body.items.every((i) => i.node_type === "Project")).toBe(true);
      expect(body.items.map((i) => i.key).sort()).toEqual(
        ["deadline", "status_label"].sort()
      );
    } finally {
      await app.close();
    }
  });

  it("GET /api/v1/node-types without auth returns 401", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/node-types",
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});

describe("Knowledge Graph — Node endpoints", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  const PROJECT_NT = "nt-project";

  function seedApolloAndAcme(store: Store) {
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000001",
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Apollo",
      status: "active",
      merged_into_node_id: null,
    });
    store.aliases.push({
      id: "00000000-0000-4000-8000-000000000a01",
      node_id: "00000000-0000-4000-8000-000000000001",
      alias: "Projeto Apollo",
      kind: "canonical",
    });
    store.aliases.push({
      id: "00000000-0000-4000-8000-000000000a02",
      node_id: "00000000-0000-4000-8000-000000000001",
      alias: "Apollo",
      kind: "alias",
    });
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000002",
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Acme",
      status: "active",
      merged_into_node_id: null,
    });
    store.aliases.push({
      id: "00000000-0000-4000-8000-000000000a03",
      node_id: "00000000-0000-4000-8000-000000000002",
      alias: "Projeto Acme",
      kind: "canonical",
    });
  }

  // UC-04 (acceptance): node_type=Project & name_prefix=Apollo
  it("GET /nodes?node_type=Project&name_prefix=Apollo returns Apollo only", async () => {
    const store = buildSeededStore();
    seedApolloAndAcme(store);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes?node_type=Project&name_prefix=Apollo",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as {
        total: number;
        items: { id: string; canonical_name: string }[];
      };
      expect(body.total).toBe(1);
      expect(body.items[0]?.canonical_name).toBe("Projeto Apollo");
    } finally {
      await app.close();
    }
  });

  // UC-04 — case- and accent-insensitive prefix (BR-01).
  it("GET /nodes name_prefix is case- and accent-insensitive", async () => {
    const store = buildSeededStore();
    seedApolloAndAcme(store);
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes?node_type=Project&name_prefix=projÉto+apol",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as {
        items: { canonical_name: string }[];
      };
      expect(body.items.length).toBe(1);
      expect(body.items[0]?.canonical_name).toBe("Projeto Apollo");
    } finally {
      await app.close();
    }
  });

  // BR-19 — invalid limit produces 422.
  it("GET /nodes?limit=999 returns 422 (out of range)", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes?limit=999",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });

  // BR-11 — deleted node returns 410.
  it("GET /nodes/{id} for deleted node returns 410 BUSINESS_NODE_DELETED", async () => {
    const store = buildSeededStore();
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000099",
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Tombado",
      status: "deleted",
      merged_into_node_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000099",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(410);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BUSINESS_NODE_DELETED");
    } finally {
      await app.close();
    }
  });

  // BR-11 — merged node returns 200 with merged_into_node_id set.
  it("GET /nodes/{id} for merged node returns 200 with merged_into_node_id", async () => {
    const store = buildSeededStore();
    // Survivor — active.
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000100",
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Survivor",
      status: "active",
      merged_into_node_id: null,
    });
    // Loser — merged into survivor.
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000101",
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Loser",
      status: "merged",
      merged_into_node_id: "00000000-0000-4000-8000-000000000100",
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000101",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as {
        node: { status: string; merged_into_node_id: string | null };
      };
      expect(body.node.status).toBe("merged");
      expect(body.node.merged_into_node_id).toBe(
        "00000000-0000-4000-8000-000000000100"
      );
    } finally {
      await app.close();
    }
  });

  it("GET /nodes/{id} for unknown id returns 404", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000009999",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    } finally {
      await app.close();
    }
  });

  // BR-08 — `as_of` activates the valid-time travel filter.
  it("GET /nodes/{id}?as_of=YYYY-MM-DD applies the valid-time travel filter", async () => {
    const store = buildSeededStore();
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000010",
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Time",
      status: "active",
      merged_into_node_id: null,
    });
    store.aliases.push({
      id: "00000000-0000-4000-8000-000000000a10",
      node_id: "00000000-0000-4000-8000-000000000010",
      alias: "Projeto Time",
      kind: "canonical",
    });
    // Old attribute (valid_to closed before 2026-06-01)
    store.attributes.push({
      id: "00000000-0000-4000-8000-000000000b01",
      node_id: "00000000-0000-4000-8000-000000000010",
      attribute_key_id: "ak-1",
      attribute_key: "deadline",
      value_type: "date",
      value: "2025-09-01",
      valid_from: "2025-01-10",
      valid_to: "2026-01-01",
      superseded_at: null,
      status: "active",
      confidence: 0.9,
      valid_from_source: "document",
      supersedes_attribute_id: null,
    });
    // Current attribute (open valid_to)
    store.attributes.push({
      id: "00000000-0000-4000-8000-000000000b02",
      node_id: "00000000-0000-4000-8000-000000000010",
      attribute_key_id: "ak-1",
      attribute_key: "deadline",
      value_type: "date",
      value: "2026-07-15",
      valid_from: "2026-01-10",
      valid_to: null,
      superseded_at: null,
      status: "active",
      confidence: 0.92,
      valid_from_source: "document",
      supersedes_attribute_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      // Current view (no as_of) — only the open row returns.
      const current = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000010",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(current.statusCode).toBe(200);
      const currentBody = okResult(current) as {
        attributes: { value: string }[];
      };
      expect(currentBody.attributes.length).toBe(1);
      expect(currentBody.attributes[0]?.value).toBe("2026-07-15");

      // as_of mid-2025 — only the old row should be in effect at that anchor.
      const past = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000010?as_of=2025-06-15",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(past.statusCode).toBe(200);
      const pastBody = okResult(past) as { attributes: { value: string }[] };
      expect(pastBody.attributes.length).toBe(1);
      expect(pastBody.attributes[0]?.value).toBe("2025-09-01");
    } finally {
      await app.close();
    }
  });

  it("GET /nodes/{id}?include_uncertain=false filters by status, not flags", async () => {
    const store = buildSeededStore();
    store.nodes.push({
      id: "00000000-0000-4000-8000-000000000020",
      node_type_id: PROJECT_NT,
      canonical_name: "Projeto Confidence",
      status: "active",
      merged_into_node_id: null,
    });
    store.attributes.push({
      id: "00000000-0000-4000-8000-000000000c01",
      node_id: "00000000-0000-4000-8000-000000000020",
      attribute_key_id: "ak-1",
      attribute_key: "deadline",
      value_type: "date",
      value: "2026-07-15",
      valid_from: "2026-01-10",
      valid_to: null,
      superseded_at: null,
      status: "uncertain",
      confidence: 0.5,
      valid_from_source: "document",
      supersedes_attribute_id: null,
    });
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/nodes/00000000-0000-4000-8000-000000000020?include_uncertain=false",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as { attributes: { value: string }[] };
      expect(body.attributes.length).toBe(0);
    } finally {
      await app.close();
    }
  });
});

describe("Knowledge Graph — Links & Attributes point reads", () => {
  let fixture: AuthFixture;
  let token: string;
  beforeAll(async () => {
    fixture = await buildAuthFixture();
    token = await signValidJwt(fixture.privateKey);
  });

  // BR-16 — provenance is assembled in ONE batched SQL.
  it("GET /links/{id} assembles provenance in ONE SQL query (no N+1)", async () => {
    const store = buildSeededStore();
    const linkId = "00000000-0000-4000-8000-000000000d01";
    store.links.push({
      id: linkId,
      source_node_id: "00000000-0000-4000-8000-000000000001",
      target_node_id: "00000000-0000-4000-8000-000000000002",
      link_type_id: "lt-participates_in",
      link_type: "participates_in",
      link_inverse_name: "inv_participates_in",
      valid_from: "2026-01-10",
      valid_to: null,
      superseded_at: null,
      status: "active",
      confidence: 0.92,
      valid_from_source: "document",
      supersedes_link_id: null,
    });
    // Two provenance entries pointing at the same link.
    for (let i = 0; i < 2; i += 1) {
      store.provenance.push({
        id: `prov-${i}`,
        link_id: linkId,
        attribute_id: null,
        fragment_id: `frag-${i}`,
        fragment_text: `Fragment ${i}`,
        fragment_confidence: 0.91,
        raw_information_id: `ri-${i}`,
        source_type: "ata",
        received_at: new Date(Date.UTC(2026, 5, 11, 18, 30, 0)),
        excerpt: "...go-live...",
      });
    }
    store.provenanceQueryCount = 0;
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/links/${linkId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as {
        id: string;
        provenance: { fragment_id: string }[];
        link_type: string;
      };
      expect(body.id).toBe(linkId);
      expect(body.link_type).toBe("participates_in");
      expect(body.provenance.length).toBe(2);
      // ONE SQL call to assemble provenance — proves no N+1.
      expect(store.provenanceQueryCount).toBe(1);
    } finally {
      await app.close();
    }
  });

  it("GET /links/{id} for unknown id returns 404", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/links/00000000-0000-4000-8000-0000000099aa",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("GET /attributes/{id} returns the attribute with provenance", async () => {
    const store = buildSeededStore();
    const attrId = "00000000-0000-4000-8000-000000000e01";
    store.attributes.push({
      id: attrId,
      node_id: "00000000-0000-4000-8000-000000000001",
      attribute_key_id: "ak-1",
      attribute_key: "deadline",
      value_type: "date",
      value: "2026-07-15",
      valid_from: "2026-01-10",
      valid_to: null,
      superseded_at: null,
      status: "active",
      confidence: 0.92,
      valid_from_source: "document",
      supersedes_attribute_id: null,
    });
    store.provenance.push({
      id: "prov-attr-1",
      link_id: null,
      attribute_id: attrId,
      fragment_id: "frag-attr-1",
      fragment_text: "Fragment text",
      fragment_confidence: 0.92,
      raw_information_id: "ri-attr-1",
      source_type: "ata",
      received_at: new Date(),
      excerpt: "...deadline...",
    });
    store.provenanceQueryCount = 0;
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/attributes/${attrId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = okResult(res) as {
        attribute_key: string;
        provenance: { fragment_id: string }[];
      };
      expect(body.attribute_key).toBe("deadline");
      expect(body.provenance.length).toBe(1);
      expect(store.provenanceQueryCount).toBe(1);
    } finally {
      await app.close();
    }
  });

  it("GET /attributes/{id} for unknown id returns 404", async () => {
    const store = buildSeededStore();
    const app = await buildAppWith(store, fixture);
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/attributes/00000000-0000-4000-8000-0000000099bb",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
