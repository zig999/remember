import type { ConfidenceState } from "@/components/ds/StateBadge";
import type {
  AttributeWire,
  AttributeWireAssertionStatus,
  AttributeWireEffectiveStatus,
  NodeAliasView,
  NodeAliasWire,
  NodeAttributeView,
  NodeDetailView,
  NodeDetailWire,
  NodeWireStatus,
  ProvenanceEntryView,
  ProvenanceEntryWire,
} from "./node-detail.types";

export function mapNodeStatusToBadge(status: NodeWireStatus): ConfidenceState {
  switch (status) {
    case "active":
      return "accepted";
    case "needs_review":
      return "uncertain";
    case "merged":
      return "superseded";
    case "deleted":
      return "superseded";
  }
}

export function mapAttributeStatusToBadge(
  effective: AttributeWireEffectiveStatus,
  assertion: AttributeWireAssertionStatus,
): ConfidenceState {
  if (effective === "disputed") return "disputed";
  if (effective === "uncertain") return "uncertain";
  if (effective === "inactive") return "superseded";
  if (assertion === "superseded") return "superseded";
  return "accepted";
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDateLabel(date: string | null): string | null {
  if (date === null) return null;
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const [y, m, d] = parts;
  const yearStr = y ?? "";
  const monthStr = m ?? "";
  const dayStr = d ?? "";
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return date;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(dt.getTime())) return date;
  return DATE_FORMATTER.format(dt);
}

function toAliasView(wire: NodeAliasWire): NodeAliasView {
  return {
    id: wire.id,
    alias: wire.alias,
    kind: wire.kind,
  };
}

function toAttributeView(wire: AttributeWire): NodeAttributeView {
  return {
    id: wire.id,
    key: wire.attribute_key,
    value: wire.value,
    valueType: wire.value_type,
    effectiveStatus: wire.effective_status,
    isInEffect: wire.is_in_effect,
    state: mapAttributeStatusToBadge(wire.effective_status, wire.status),
    validFromLabel: formatDateLabel(wire.valid_from),
    validToLabel: formatDateLabel(wire.valid_to),
    provenance: (wire.provenance ?? []).map(toProvenanceEntryView),
  };
}

export function formatConfidenceLabel(
  confidence: number | undefined | null,
): string | null {
  if (confidence === undefined || confidence === null) return null;
  if (!Number.isFinite(confidence)) return null;
  return `${Math.round(confidence * 100)}%`;
}

const RECEIVED_AT_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatReceivedAtLabel(
  iso: string | undefined | null,
): string | null {
  if (iso === undefined || iso === null) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return RECEIVED_AT_FORMATTER.format(dt);
}

export function toProvenanceEntryView(
  wire: ProvenanceEntryWire,
): ProvenanceEntryView {
  const confidence =
    typeof wire.confidence === "number" && Number.isFinite(wire.confidence)
      ? wire.confidence
      : null;
  return {
    fragmentId: wire.fragment_id,
    fragmentText: wire.fragment_text,
    confidence,
    confidenceLabel: formatConfidenceLabel(confidence),
    rawInformationId: wire.raw_information_id ?? null,
    sourceType: wire.source_type ?? null,
    receivedAtLabel: formatReceivedAtLabel(wire.received_at),
    excerpt: wire.excerpt ?? null,
  };
}

function sortAttributes(
  attrs: ReadonlyArray<NodeAttributeView>,
): ReadonlyArray<NodeAttributeView> {
  return [...attrs].sort((a, b) => {
    if (a.isInEffect !== b.isInEffect) {
      return a.isInEffect ? -1 : 1;
    }
    return a.key.localeCompare(b.key, "pt-BR", { sensitivity: "base" });
  });
}

export function toNodeDetail(wire: NodeDetailWire): NodeDetailView {
  const sortedAttrs = sortAttributes(wire.attributes.map(toAttributeView));
  return {
    id: wire.node.id,
    canonicalName: wire.node.canonical_name,
    nodeType: wire.node.node_type,
    status: wire.node.status,
    badgeState: mapNodeStatusToBadge(wire.node.status),
    mergedIntoNodeId: wire.node.merged_into_node_id ?? null,
    aliases: wire.aliases.map(toAliasView),
    attributes: sortedAttrs,
  };
}
