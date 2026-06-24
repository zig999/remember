/**
 * Curation api — transform unit tests.
 *
 * Spec ref: docs/specs/front/features/curadoria.feature.spec.md §4
 * (Response transforms table). Each transform is exercised with the
 * fixture wire shape that mirrors the openapi.yaml example. The tests
 * encode WHY (Golden Rule 9):
 *
 *   - `created_at` ISO string MUST become a `Date` so consumers can do
 *     relative-time formatting without re-parsing.
 *   - `valid_from` / `valid_to` MUST become `Date | null` — the spec
 *     allows null (open-ended interval). A `null` that becomes `Date`
 *     would break the BatchBar / PeriodTimeline rendering.
 *   - The discriminator (`kind`) MUST be preserved verbatim so the UI
 *     `switch (item.kind)` continues to type-narrow.
 *   - `unwrapOk` MUST surface only the `result` payload — callers must
 *     not see the envelope `ok` boolean (otherwise the cache stores the
 *     wrapper and downstream consumers blow up).
 */
import { describe, expect, it } from "vitest";

import {
  toEntityMatchCandidate,
  toEntityMatchQueueItem,
  toDisputedItemSide,
  toDisputeQueueItem,
  toReviewQueueItem,
  toReviewQueueList,
  toCurationMetrics,
  toProvenanceResponse,
  toAcceptedFragmentList,
  toNodeDetail,
  toAttributeDetail,
  toLinkDetail,
  toLinkHistoryResponse,
  toAttributeHistoryResponse,
  unwrapOk,
} from "../_transforms";

import {
  FIXTURE_ENTITY_MATCH_QUEUE_ITEM,
  FIXTURE_DISPUTE_QUEUE_ITEM,
  FIXTURE_REVIEW_QUEUE_LIST,
  FIXTURE_CURATION_METRICS,
  FIXTURE_PROVENANCE_RESPONSE,
  FIXTURE_ACCEPTED_FRAGMENT_LIST,
  FIXTURE_NODE_DETAIL,
  FIXTURE_LINK_HISTORY,
  FIXTURE_ATTRIBUTE_HISTORY,
} from "./handlers";

describe("toEntityMatchCandidate", () => {
  it("renames snake_case to camelCase but preserves similarity verbatim", () => {
    const wire = FIXTURE_ENTITY_MATCH_QUEUE_ITEM.candidates[0]!;
    const out = toEntityMatchCandidate(wire);
    expect(out.candidateNodeId).toBe(wire.candidate_node_id);
    expect(out.canonicalName).toBe(wire.canonical_name);
    expect(out.similarity).toBe(wire.similarity);
  });
});

describe("toEntityMatchQueueItem", () => {
  it("preserves the `entity_match` discriminator and parses created_at to Date", () => {
    const out = toEntityMatchQueueItem(FIXTURE_ENTITY_MATCH_QUEUE_ITEM);
    expect(out.kind).toBe("entity_match");
    expect(out.createdAt).toBeInstanceOf(Date);
    expect(out.createdAt.toISOString()).toBe(
      new Date(FIXTURE_ENTITY_MATCH_QUEUE_ITEM.created_at).toISOString(),
    );
  });

  it("maps every candidate via toEntityMatchCandidate", () => {
    const out = toEntityMatchQueueItem(FIXTURE_ENTITY_MATCH_QUEUE_ITEM);
    expect(out.candidates.length).toBe(
      FIXTURE_ENTITY_MATCH_QUEUE_ITEM.candidates.length,
    );
    expect(out.candidates[0]?.canonicalName).toBe(
      FIXTURE_ENTITY_MATCH_QUEUE_ITEM.candidates[0]!.canonical_name,
    );
  });
});

describe("toDisputedItemSide", () => {
  it("parses valid_from / valid_to to Date when present, null when null", () => {
    const sideWithDate = FIXTURE_DISPUTE_QUEUE_ITEM.sides[0]!;
    const out = toDisputedItemSide(sideWithDate);
    expect(out.validFrom).toBeInstanceOf(Date);
    expect(out.validTo).toBeNull();
  });

  it("normalises missing target_node_id to null", () => {
    const wire = { ...FIXTURE_DISPUTE_QUEUE_ITEM.sides[0]! };
    // Wire schema: target_node_id can be omitted or explicit-null.
    delete (wire as { target_node_id?: unknown }).target_node_id;
    const out = toDisputedItemSide(wire);
    expect(out.targetNodeId).toBeNull();
  });
});

describe("toDisputeQueueItem", () => {
  it("preserves the `disputed` discriminator and maps the scope", () => {
    const out = toDisputeQueueItem(FIXTURE_DISPUTE_QUEUE_ITEM);
    expect(out.kind).toBe("disputed");
    expect(out.itemKind).toBe("attribute");
    expect(out.scope.nodeId).toBe(FIXTURE_DISPUTE_QUEUE_ITEM.scope.node_id);
    expect(out.scope.attributeKey).toBe(
      FIXTURE_DISPUTE_QUEUE_ITEM.scope.attribute_key,
    );
    expect(out.sides.length).toBe(2);
  });
});

describe("toReviewQueueItem", () => {
  it("dispatches by `kind` (entity_match vs disputed)", () => {
    expect(toReviewQueueItem(FIXTURE_ENTITY_MATCH_QUEUE_ITEM).kind).toBe(
      "entity_match",
    );
    expect(toReviewQueueItem(FIXTURE_DISPUTE_QUEUE_ITEM).kind).toBe(
      "disputed",
    );
  });
});

describe("toReviewQueueList", () => {
  it("forwards total/limit/offset and maps every item", () => {
    const out = toReviewQueueList(FIXTURE_REVIEW_QUEUE_LIST);
    expect(out.total).toBe(FIXTURE_REVIEW_QUEUE_LIST.total);
    expect(out.limit).toBe(FIXTURE_REVIEW_QUEUE_LIST.limit);
    expect(out.offset).toBe(FIXTURE_REVIEW_QUEUE_LIST.offset);
    expect(out.items.length).toBe(FIXTURE_REVIEW_QUEUE_LIST.items.length);
    expect(out.items[0]?.kind).toBe("entity_match");
    expect(out.items[1]?.kind).toBe("disputed");
  });
});

describe("toCurationMetrics", () => {
  it("camelCases the snake_case fields and parses computed_at to Date", () => {
    const out = toCurationMetrics(FIXTURE_CURATION_METRICS);
    expect(out.acceptRate).toBe(FIXTURE_CURATION_METRICS.accept_rate);
    expect(out.needsReviewCount).toBe(
      FIXTURE_CURATION_METRICS.needs_review_count,
    );
    expect(out.entityMatchQueueCount).toBe(
      FIXTURE_CURATION_METRICS.entity_match_queue_count,
    );
    expect(out.computedAt).toBeInstanceOf(Date);
    // Reject rates are forwarded by reference (immutable record).
    expect(out.rejectRateByCode).toEqual(
      FIXTURE_CURATION_METRICS.reject_rate_by_code,
    );
  });
});

describe("toProvenanceResponse", () => {
  it("walks fragments → chunks → raw_information, parsing dates", () => {
    const out = toProvenanceResponse(FIXTURE_PROVENANCE_RESPONSE);
    expect(out.fragments.length).toBe(
      FIXTURE_PROVENANCE_RESPONSE.fragments.length,
    );
    const frag = out.fragments[0]!;
    expect(frag.text).toBe(FIXTURE_PROVENANCE_RESPONSE.fragments[0]!.text);
    const chunk = frag.chunks[0]!;
    expect(chunk.chunkIndex).toBe(0);
    expect(chunk.rawInformation.receivedAt).toBeInstanceOf(Date);
    // Metadata flows through verbatim — the UI displays title.
    expect(chunk.rawInformation.metadata).toEqual(
      FIXTURE_PROVENANCE_RESPONSE.fragments[0]!.chunks[0]!.raw_information
        .metadata,
    );
  });

  it("normalises missing optional metadata/locator to empty objects", () => {
    const wire = {
      fragments: [
        {
          ...FIXTURE_PROVENANCE_RESPONSE.fragments[0]!,
          chunks: [
            {
              ...FIXTURE_PROVENANCE_RESPONSE.fragments[0]!.chunks[0]!,
              locator: undefined,
              raw_information: {
                ...FIXTURE_PROVENANCE_RESPONSE.fragments[0]!.chunks[0]!
                  .raw_information,
                metadata: undefined,
              },
            },
          ],
        },
      ],
    };
    const out = toProvenanceResponse(wire);
    expect(out.fragments[0]!.chunks[0]!.locator).toEqual({});
    expect(out.fragments[0]!.chunks[0]!.rawInformation.metadata).toEqual({});
  });
});

describe("toAcceptedFragmentList", () => {
  it("camelCases the source ref and parses received_at + created_at to Date", () => {
    const out = toAcceptedFragmentList(FIXTURE_ACCEPTED_FRAGMENT_LIST);
    expect(out.total).toBe(FIXTURE_ACCEPTED_FRAGMENT_LIST.total);
    expect(out.items[0]?.createdAt).toBeInstanceOf(Date);
    expect(out.items[0]?.source.receivedAt).toBeInstanceOf(Date);
    expect(out.items[0]?.source.documentTitle).toBe(
      FIXTURE_ACCEPTED_FRAGMENT_LIST.items[0]!.source.document_title,
    );
  });

  it("normalises missing document_title to null", () => {
    const wire = {
      ...FIXTURE_ACCEPTED_FRAGMENT_LIST,
      items: [
        {
          ...FIXTURE_ACCEPTED_FRAGMENT_LIST.items[0]!,
          source: {
            ...FIXTURE_ACCEPTED_FRAGMENT_LIST.items[0]!.source,
            document_title: null,
          },
        },
      ],
    };
    const out = toAcceptedFragmentList(wire);
    expect(out.items[0]?.source.documentTitle).toBeNull();
  });
});

describe("toAttributeDetail", () => {
  it("maps every required field including derived flags", () => {
    const wire = FIXTURE_NODE_DETAIL.attributes[0]!;
    const out = toAttributeDetail(wire);
    expect(out.id).toBe(wire.id);
    expect(out.nodeId).toBe(wire.node_id);
    expect(out.attributeKey).toBe(wire.attribute_key);
    expect(out.valueType).toBe(wire.value_type);
    expect(out.value).toBe(wire.value);
    expect(out.validFrom).toBeInstanceOf(Date);
    expect(out.validTo).toBeNull();
    expect(out.recordedAt).toBeInstanceOf(Date);
    expect(out.supersededAt).toBeNull();
    expect(out.status).toBe(wire.status);
    expect(out.effectiveStatus).toBe(wire.effective_status);
    expect(out.isCurrent).toBe(true);
    expect(out.isInEffect).toBe(true);
    expect(out.confidence).toBe(wire.confidence);
    expect(out.validFromSource).toBe(wire.valid_from_source);
    expect(out.flags).toEqual([]);
    expect(out.supersedesAttributeId).toBeNull();
  });
});

describe("toNodeDetail", () => {
  it("transforms the full node + alias + attribute graph", () => {
    const out = toNodeDetail(FIXTURE_NODE_DETAIL);
    expect(out.node.canonicalName).toBe(
      FIXTURE_NODE_DETAIL.node.canonical_name,
    );
    expect(out.node.status).toBe("active");
    expect(out.node.mergedIntoNodeId).toBeNull();
    expect(out.aliases.length).toBe(1);
    expect(out.aliases[0]?.kind).toBe("canonical");
    expect(out.attributes.length).toBe(1);
    expect(out.attributes[0]?.attributeKey).toBe("deadline");
  });
});

describe("toLinkDetail", () => {
  it("maps a single LinkDetail row including link_inverse_name", () => {
    const wire = FIXTURE_LINK_HISTORY.versions[0]!;
    const out = toLinkDetail(wire);
    expect(out.sourceNodeId).toBe(wire.source_node_id);
    expect(out.targetNodeId).toBe(wire.target_node_id);
    expect(out.linkType).toBe(wire.link_type);
    expect(out.linkInverseName).toBe(wire.link_inverse_name);
    expect(out.recordedAt).toBeInstanceOf(Date);
  });
});

describe("toLinkHistoryResponse / toAttributeHistoryResponse", () => {
  it("maps `versions[]`", () => {
    const links = toLinkHistoryResponse(FIXTURE_LINK_HISTORY);
    expect(links.versions.length).toBe(1);
    expect(links.versions[0]?.linkType).toBe(
      FIXTURE_LINK_HISTORY.versions[0]!.link_type,
    );
    const attrs = toAttributeHistoryResponse(FIXTURE_ATTRIBUTE_HISTORY);
    expect(attrs.versions.length).toBe(1);
    expect(attrs.versions[0]?.attributeKey).toBe(
      FIXTURE_ATTRIBUTE_HISTORY.versions[0]!.attribute_key,
    );
  });
});

describe("unwrapOk", () => {
  it("surfaces only the result payload (not the wrapper)", () => {
    const inner = { hello: "world" };
    const out = unwrapOk({ ok: true as const, result: inner });
    expect(out).toBe(inner);
  });
});

describe("date parsing — defensive", () => {
  it("throws on malformed ISO strings (fail loud, Golden Rule 12)", () => {
    const badWire = {
      ...FIXTURE_ENTITY_MATCH_QUEUE_ITEM,
      created_at: "not-a-date",
    };
    expect(() => toEntityMatchQueueItem(badWire)).toThrow(
      /Invalid ISO date string/,
    );
  });
});
