// Pure DB-row -> DTO mappers shared by node / link / attribute services.
// Tested independently in `__tests__/unit/knowledge-graph/formatters.spec.ts`.

import type {
  AssertionFlag,
  AssertionStatus,
  EffectiveStatus,
} from "../dto/enums.dto.js";
import type { AttributeDetailResponse } from "../dto/attribute.dto.js";
import type { LinkDetailResponse } from "../dto/link.dto.js";
import type {
  NodeAliasResponse,
  NodeSummaryResponse,
} from "../dto/node.dto.js";
import type { ProvenanceEntryResponse } from "../dto/provenance.dto.js";
import type {
  AttributeResolvedRow,
  KnowledgeNodeRow,
  LinkResolvedRow,
  NodeAliasRow,
  ProvenanceRow,
} from "../repository/graph.repository.js";

const ASSERTION_STATUS: ReadonlySet<AssertionStatus> = new Set([
  "active",
  "uncertain",
  "disputed",
  "superseded",
  "deleted",
]);

const EFFECTIVE_STATUS: ReadonlySet<EffectiveStatus> = new Set([
  "active",
  "uncertain",
  "disputed",
  "superseded",
  "deleted",
  "inactive",
]);

/** Format a YYYY-MM-DD date from a `pg` Date (or pass through ISO strings). */
export function formatDateOnly(d: Date | string | null): string | null {
  if (d === null) return null;
  if (typeof d === "string") {
    // `pg` may return DATE values as strings already.
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : d;
  }
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const mo = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Format a timestamptz as ISO 8601 with offset. */
export function formatTimestamptz(d: Date | string | null): string | null {
  if (d === null) return null;
  if (typeof d === "string") return d;
  return d.toISOString();
}

function toNumber(n: string | number): number {
  return typeof n === "number" ? n : Number(n);
}

function toAssertionStatus(s: string): AssertionStatus {
  if (ASSERTION_STATUS.has(s as AssertionStatus)) {
    return s as AssertionStatus;
  }
  throw new Error(`Unexpected assertion_status from DB: ${s}`);
}

function toEffectiveStatus(s: string): EffectiveStatus {
  if (EFFECTIVE_STATUS.has(s as EffectiveStatus)) {
    return s as EffectiveStatus;
  }
  throw new Error(`Unexpected effective_status from DB: ${s}`);
}

/**
 * Derive the display flags surfaced in `LinkDetail.flags` and
 * `AttributeDetail.flags`. Today this mirrors the storage `status` for
 * `uncertain` / `disputed`; `low_confidence` is reserved for a future
 * threshold-based flag.
 */
export function deriveFlags(status: AssertionStatus): AssertionFlag[] {
  const flags: AssertionFlag[] = [];
  if (status === "uncertain") flags.push("uncertain");
  if (status === "disputed") flags.push("disputed");
  return flags;
}

export function toNodeSummary(row: KnowledgeNodeRow): NodeSummaryResponse {
  return {
    id: row.id,
    node_type: row.node_type,
    canonical_name: row.canonical_name,
    status: row.status,
    merged_into_node_id: row.merged_into_node_id,
  };
}

export function toNodeAlias(row: NodeAliasRow): NodeAliasResponse {
  return {
    id: row.id,
    alias: row.alias,
    kind: row.kind,
    created_at: formatTimestamptz(row.created_at) ?? new Date(0).toISOString(),
  };
}

export function toAttributeDetail(
  row: AttributeResolvedRow,
  provenance: readonly ProvenanceEntryResponse[]
): AttributeDetailResponse {
  const status = toAssertionStatus(row.status);
  return {
    id: row.id,
    node_id: row.node_id,
    attribute_key: row.attribute_key,
    value_type: row.value_type,
    value: row.value,
    valid_from: formatDateOnly(row.valid_from),
    valid_to: formatDateOnly(row.valid_to),
    recorded_at: formatTimestamptz(row.recorded_at) ?? new Date(0).toISOString(),
    superseded_at: formatTimestamptz(row.superseded_at),
    status,
    effective_status: toEffectiveStatus(row.effective_status),
    is_current: row.is_current,
    is_in_effect: row.is_in_effect,
    confidence: toNumber(row.confidence),
    valid_from_source: row.valid_from_source,
    flags: deriveFlags(status),
    supersedes_attribute_id: row.supersedes_attribute_id,
    provenance: provenance.slice(),
  };
}

export function toLinkDetail(
  row: LinkResolvedRow,
  provenance: readonly ProvenanceEntryResponse[]
): LinkDetailResponse {
  const status = toAssertionStatus(row.status);
  return {
    id: row.id,
    source_node_id: row.source_node_id,
    target_node_id: row.target_node_id,
    link_type: row.link_type,
    link_inverse_name: row.link_inverse_name,
    valid_from: formatDateOnly(row.valid_from),
    valid_to: formatDateOnly(row.valid_to),
    recorded_at: formatTimestamptz(row.recorded_at) ?? new Date(0).toISOString(),
    superseded_at: formatTimestamptz(row.superseded_at),
    status,
    effective_status: toEffectiveStatus(row.effective_status),
    is_current: row.is_current,
    is_in_effect: row.is_in_effect,
    confidence: toNumber(row.confidence),
    valid_from_source: row.valid_from_source,
    flags: deriveFlags(status),
    supersedes_link_id: row.supersedes_link_id,
    provenance: provenance.slice(),
  };
}

/** Convert ProvenanceRow (DB shape) into the API ProvenanceEntry. */
export function toProvenanceEntry(row: ProvenanceRow): ProvenanceEntryResponse {
  return {
    fragment_id: row.fragment_id,
    fragment_text: row.fragment_text,
    confidence: toNumber(row.fragment_confidence),
    raw_information_id: row.raw_information_id,
    source_type: row.source_type as ProvenanceEntryResponse["source_type"],
    received_at:
      formatTimestamptz(row.received_at) ?? new Date(0).toISOString(),
    excerpt: row.excerpt,
  };
}

/** Group provenance rows by their `target_id` (link_id or attribute_id). */
export function groupProvenance(
  rows: readonly ProvenanceRow[]
): Map<string, ProvenanceEntryResponse[]> {
  const out = new Map<string, ProvenanceEntryResponse[]>();
  for (const r of rows) {
    const entry = toProvenanceEntry(r);
    const arr = out.get(r.target_id);
    if (arr === undefined) out.set(r.target_id, [entry]);
    else arr.push(entry);
  }
  return out;
}
