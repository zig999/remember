import { describe, expect, it } from "vitest";
import pino from "pino";
import type { PoolClient } from "pg";

import { complianceDelete } from "../../../modules/compliance-audit/service/compliance-audit.service.js";

interface Counts {
  chunks: number;
  fragments: number;
  links: number;
  attributes: number;
}

interface StatusRow {
  id: string;
  status: string;
  superseded_at: Date | null;
}

interface ChunkRow extends StatusRow {
  raw_information_id: string;
}

interface RawRow {
  id: string;
  status: string;
}

interface FragmentSourceRow {
  fragment_id: string;
  raw_chunk_id: string;
}

interface ProvenanceRow {
  link_id: string | null;
  attribute_id: string | null;
  fragment_id: string;
}

interface RecordedDeletion {
  raw_information_id: string;
  reason: string;
  affected: Counts;
}

interface Store {
  raws: RawRow[];
  chunks: ChunkRow[];
  fragments: StatusRow[];
  fragment_sources: FragmentSourceRow[];
  links: StatusRow[];
  attributes: StatusRow[];
  provenance: ProvenanceRow[];
  compliance_deletions: RecordedDeletion[];
}

interface QueryResult {
  rows: unknown[];
  rowCount: number;
}

type Handler = (store: Store, sql: string, params: unknown[]) => QueryResult;
type ProvenanceKey = "link_id" | "attribute_id";

const TARGET_RAW = "11111111-0000-4000-8000-000000000001";
const OTHER_RAW = "11111111-0000-4000-8000-000000000002";
const CHUNK_LIVE = "22222222-0000-4000-8000-000000000001";
const CHUNK_SUPERSEDED = "22222222-0000-4000-8000-000000000002";
const CHUNK_OTHER = "22222222-0000-4000-8000-000000000003";
const FRAG_TARGET_ONLY = "33333333-0000-4000-8000-000000000001";
const FRAG_OTHER = "33333333-0000-4000-8000-000000000002";
const LINK_A = "44444444-0000-4000-8000-000000000001";
const LINK_B = "44444444-0000-4000-8000-000000000002";
const ATTR_A = "55555555-0000-4000-8000-000000000001";
const ATTR_B = "55555555-0000-4000-8000-000000000002";
const ATTR_C = "55555555-0000-4000-8000-000000000003";
const ATTR_SHARED = "55555555-0000-4000-8000-000000000004";
const DELETION_REASON = "LGPD request";
const ALREADY_SUPERSEDED_AT = new Date("2026-01-01T00:00:00Z");
const SUPERSEDED_GUARD = "superseded_at IS NULL";
const OTHER_RAW_GUARD = "ri.id <> $1";
const EXPECTED_AFFECTED: Counts = {
  chunks: 1,
  fragments: 1,
  links: 2,
  attributes: 3,
};

function liveRow(id: string): StatusRow {
  return { id, status: "active", superseded_at: null };
}

function buildFixture(): Store {
  return {
    raws: [
      { id: TARGET_RAW, status: "active" },
      { id: OTHER_RAW, status: "active" },
    ],
    chunks: [
      { ...liveRow(CHUNK_LIVE), raw_information_id: TARGET_RAW },
      {
        id: CHUNK_SUPERSEDED,
        status: "active",
        superseded_at: ALREADY_SUPERSEDED_AT,
        raw_information_id: TARGET_RAW,
      },
      { ...liveRow(CHUNK_OTHER), raw_information_id: OTHER_RAW },
    ],
    fragments: [liveRow(FRAG_TARGET_ONLY), liveRow(FRAG_OTHER)],
    fragment_sources: [
      { fragment_id: FRAG_TARGET_ONLY, raw_chunk_id: CHUNK_LIVE },
      { fragment_id: FRAG_OTHER, raw_chunk_id: CHUNK_OTHER },
    ],
    links: [liveRow(LINK_A), liveRow(LINK_B)],
    attributes: [
      liveRow(ATTR_A),
      liveRow(ATTR_B),
      liveRow(ATTR_C),
      liveRow(ATTR_SHARED),
    ],
    provenance: [
      { link_id: LINK_A, attribute_id: null, fragment_id: FRAG_TARGET_ONLY },
      { link_id: LINK_B, attribute_id: null, fragment_id: FRAG_TARGET_ONLY },
      { link_id: null, attribute_id: ATTR_A, fragment_id: FRAG_TARGET_ONLY },
      { link_id: null, attribute_id: ATTR_B, fragment_id: FRAG_TARGET_ONLY },
      { link_id: null, attribute_id: ATTR_C, fragment_id: FRAG_TARGET_ONLY },
      {
        link_id: null,
        attribute_id: ATTR_SHARED,
        fragment_id: FRAG_TARGET_ONLY,
      },
      { link_id: null, attribute_id: ATTR_SHARED, fragment_id: FRAG_OTHER },
    ],
    compliance_deletions: [],
  };
}

function rawIdsOfFragments(store: Store, fragmentIds: string[]): string[] {
  return store.fragment_sources
    .filter((source) => fragmentIds.includes(source.fragment_id))
    .map(
      (source) =>
        store.chunks.find((chunk) => chunk.id === source.raw_chunk_id)
          ?.raw_information_id ?? ""
    );
}

function fragmentIdsOf(
  store: Store,
  key: ProvenanceKey,
  ownerId: string
): string[] {
  return store.provenance
    .filter((row) => row[key] === ownerId)
    .map((row) => row.fragment_id);
}

function isEligible(
  store: Store,
  sql: string,
  rawIds: string[],
  target: string
): boolean {
  if (!rawIds.includes(target)) return false;
  if (!sql.includes(OTHER_RAW_GUARD)) return true;
  return !rawIds.some(
    (id) =>
      id !== target &&
      store.raws.find((raw) => raw.id === id)?.status !== "deleted"
  );
}

function markDeleted(rows: StatusRow[]): QueryResult {
  for (const row of rows) {
    row.status = "deleted";
    row.superseded_at = new Date();
  }
  return { rows: rows.map((row) => ({ id: row.id })), rowCount: rows.length };
}

const loadRaw: Handler = (store, _sql, params) => {
  const row = store.raws.find((raw) => raw.id === String(params[0]));
  return row
    ? { rows: [{ id: row.id, status: row.status }], rowCount: 1 }
    : { rows: [], rowCount: 0 };
};

const tombstoneRaw: Handler = (store, _sql, params) => {
  const row = store.raws.find((raw) => raw.id === String(params[0]));
  if (!row) return { rows: [], rowCount: 0 };
  row.status = "deleted";
  return { rows: [{ id: row.id }], rowCount: 1 };
};

const tombstoneChunks: Handler = (store, sql, params) => {
  const guarded = sql.includes(SUPERSEDED_GUARD);
  return markDeleted(
    store.chunks.filter(
      (chunk) =>
        chunk.raw_information_id === String(params[0]) &&
        (!guarded || chunk.superseded_at === null)
    )
  );
};

const tombstoneFragments: Handler = (store, sql, params) =>
  markDeleted(
    store.fragments.filter(
      (fragment) =>
        fragment.status !== "deleted" &&
        isEligible(
          store,
          sql,
          rawIdsOfFragments(store, [fragment.id]),
          String(params[0])
        )
    )
  );

function tombstoneOwned(
  rows: (store: Store) => StatusRow[],
  key: ProvenanceKey
): Handler {
  return (store, sql, params) =>
    markDeleted(
      rows(store).filter(
        (row) =>
          row.status !== "deleted" &&
          isEligible(
            store,
            sql,
            rawIdsOfFragments(store, fragmentIdsOf(store, key, row.id)),
            String(params[0])
          )
      )
    );
}

const insertDeletion: Handler = (store, _sql, params) => {
  const recorded: RecordedDeletion = {
    raw_information_id: String(params[0]),
    reason: String(params[1]),
    affected: {
      chunks: Number(params[2]),
      fragments: Number(params[3]),
      links: Number(params[4]),
      attributes: Number(params[5]),
    },
  };
  store.compliance_deletions.push(recorded);
  const row = {
    id: "cd-1",
    executed_at: new Date(),
    ...recorded,
  };
  return { rows: [row], rowCount: 1 };
};

const insertAction: Handler = (_store, _sql, params) => ({
  rows: [{ id: "ca-1", action: params[0], created_at: new Date() }],
  rowCount: 1,
});

const HANDLERS: ReadonlyArray<readonly [string, Handler]> = [
  ["FOR UPDATE", loadRaw],
  ["UPDATE raw_information", tombstoneRaw],
  ["UPDATE raw_chunk", tombstoneChunks],
  ["UPDATE information_fragment", tombstoneFragments],
  ["UPDATE knowledge_link", tombstoneOwned((s) => s.links, "link_id")],
  ["UPDATE node_attribute", tombstoneOwned((s) => s.attributes, "attribute_id")],
  ["INSERT INTO compliance_deletion", insertDeletion],
  ["INSERT INTO curation_action", insertAction],
];

function buildFakeClient(store: Store): PoolClient {
  return {
    query: async (sql: string, params: unknown[] = []): Promise<QueryResult> => {
      const entry = HANDLERS.find(([marker]) => sql.includes(marker));
      if (!entry) throw new Error(`fake client: unknown SQL: ${sql.slice(0, 120)}`);
      return entry[1](store, sql, params);
    },
    release: (): void => undefined,
  } as unknown as PoolClient;
}

type StatusSnapshot = Record<keyof Counts, Map<string, string>>;

function statusesOf(rows: StatusRow[]): Map<string, string> {
  return new Map(rows.map((row) => [row.id, row.status]));
}

function snapshotStatuses(store: Store): StatusSnapshot {
  return {
    chunks: statusesOf(store.chunks),
    fragments: statusesOf(store.fragments),
    links: statusesOf(store.links),
    attributes: statusesOf(store.attributes),
  };
}

function turnedToDeleted(
  before: Map<string, string>,
  after: Map<string, string>
): number {
  return [...after].filter(
    ([id, status]) => status === "deleted" && before.get(id) !== "deleted"
  ).length;
}

function countMarked(before: StatusSnapshot, after: StatusSnapshot): Counts {
  return {
    chunks: turnedToDeleted(before.chunks, after.chunks),
    fragments: turnedToDeleted(before.fragments, after.fragments),
    links: turnedToDeleted(before.links, after.links),
    attributes: turnedToDeleted(before.attributes, after.attributes),
  };
}

describe("Compliance deletion — affected counts are the rows it marked deleted", () => {
  it("records chunks 1, fragments 1, links 2 and attributes 3, equal to the rows whose status turned to deleted, leaving the shared attribute and the already superseded chunk out", async () => {
    const store = buildFixture();
    const client = buildFakeClient(store);
    const before = snapshotStatuses(store);

    await complianceDelete({ logger: pino({ level: "silent" }) }, client, {
      raw_information_id: TARGET_RAW,
      reason: DELETION_REASON,
    });

    const after = snapshotStatuses(store);
    expect({
      recorded: store.compliance_deletions[0]?.affected,
      marked: countMarked(before, after),
    }).toEqual({ recorded: EXPECTED_AFFECTED, marked: EXPECTED_AFFECTED });
  });
});
