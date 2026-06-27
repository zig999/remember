/**
 * mapWireToGraphDelta — wire → surface `GraphDelta` mapping (dev_tc_001).
 *
 * Extracted from `features/chat/api/useSendMessage.ts` so both `/chat`
 * (SSE `graph_delta` frames) and `/ingest` (traverse-assembled deltas) can
 * consume it without a cross-feature import. The function is pure (no
 * Zustand reads inside the mapping loop), but it does perform the
 * orphan-link cleanup against the live `useGraphStore` — see "Cross-delta
 * dedupe" below.
 *
 * Why this file lives under `features/graph/api/` (not `lib/map.ts`):
 *  - The transform is wire-level (snake_case → camelCase), conceptually a
 *    sibling of the other api transforms (`_transforms.ts`,
 *    `traversal.transforms.ts`, `provenance.transforms.ts`). `lib/map.ts`
 *    holds the *atomic* per-field mappers (`mapNodeType`,
 *    `deriveNodeState`, …) — this file composes them.
 *  - Both `/chat` and `/ingest` are now consumers, so the function must
 *    live inside `features/graph` to satisfy the cross-feature import
 *    rule (front.md §6.4).
 *
 * Input shape — `MapWireToGraphDeltaInput`:
 *  - `sourceTool` — camelCase, NOT the wire `source_tool`. SSE frames are
 *    already de-snake-cased by the parser in `chat-stream.ts`; the ingest
 *    caller will pass the tool slug from its own transform. Keeping a single
 *    casing here means the function never has to choose between two field
 *    names.
 *  - `nodes` / `links` — wire shape (snake_case fields preserved), as
 *    delivered by both transports.
 *
 * Filter rule (I-2): nodes whose `status` maps to `undefined` (currently
 * `merged` / `deleted`) are dropped — they have no visible representation
 * in the surface store and would render as ghosts. Links anchored on a
 * filtered-out endpoint are dropped too.
 *
 * Cross-delta dedupe: a link whose endpoint is *not* in THIS delta but
 * *is* already in `useGraphStore.nodes` is kept (the store dedupes by id
 * on merge, so the link still resolves). This requires a `getState()`
 * read — the function is therefore not pure in the strict sense, but the
 * Zustand store is the same singleton for both consumers and the read is
 * idempotent.
 *
 * Normative sources:
 *  - docs/specs/front/features/ingest.feature.spec.md §4 (extraction note)
 *  - docs/specs/front/front.md §6.1 / §6.4 (cross-feature import rule)
 */

import { useGraphStore } from "../state/graph-store";
import {
  deriveLinkState,
  deriveNodeState,
  mapLinkTypeLabel,
  mapNodeType,
} from "../lib/map";
import type {
  GraphDelta,
  GraphLinkData,
  GraphLinkWire,
  GraphNodeData,
  GraphNodeWire,
} from "../types";

/**
 * Compatible superset covering both:
 *  - SSE `graph_delta` frames (`ChatSSEFrameGraphDelta`, where `sourceTool`
 *    is already de-snake-cased by the parser), and
 *  - `/ingest` traverse-assembled deltas (where the caller chooses the
 *    `sourceTool` label, typically the tool that produced the traversal).
 */
export interface MapWireToGraphDeltaInput {
  readonly sourceTool: string;
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}

export function mapWireToGraphDelta(
  input: MapWireToGraphDeltaInput,
): GraphDelta {
  const mappedNodes: GraphNodeData[] = [];
  const visibleIds = new Set<string>();
  for (const wireNode of input.nodes) {
    const state = deriveNodeState(wireNode.status);
    if (state === undefined) {
      // Filtered out (merged / deleted) — do not propagate to the surface
      // store. Re-affirmation of a previously visible id by a `merged`
      // status is intentionally NOT applied here either; the dispatcher
      // would need an explicit `removeNodes` to take such a node down.
      continue;
    }
    const node: GraphNodeData = {
      id: wireNode.id,
      type: mapNodeType(wireNode.node_type),
      label: wireNode.canonical_name,
      state,
    };
    mappedNodes.push(node);
    visibleIds.add(wireNode.id);
  }

  const mappedLinks: GraphLinkData[] = [];
  for (const wireLink of input.links) {
    // Drop links whose endpoints are not in the visible set for THIS delta
    // AND not already in the store. The store dedupes by id on merge, so a
    // link whose endpoints were established by a prior delta still lands;
    // a link whose endpoints would be orphan after the filter is dropped.
    const sourceVisible =
      visibleIds.has(wireLink.source_node_id) ||
      useGraphStore.getState().nodes.has(wireLink.source_node_id);
    const targetVisible =
      visibleIds.has(wireLink.target_node_id) ||
      useGraphStore.getState().nodes.has(wireLink.target_node_id);
    if (!sourceVisible || !targetVisible) continue;

    const link: GraphLinkData = {
      id: wireLink.id,
      source: wireLink.source_node_id,
      target: wireLink.target_node_id,
      label: wireLink.link_type,
      // The visible label — pt-BR catalog-resolved when the backend projected
      // it, otherwise a humanized slug. The slug (`label` above) stays the
      // color-lookup key; only this string is rendered as text on the canvas.
      // See GraphEdge.component.spec.md §2.
      linkTypeLabel: mapLinkTypeLabel(wireLink.link_type, wireLink.link_type_label),
      isTemporal: wireLink.is_temporal,
      state: deriveLinkState(wireLink.status, wireLink.flags),
      ...(wireLink.is_in_effect === undefined
        ? {}
        : { inEffect: wireLink.is_in_effect }),
    };
    mappedLinks.push(link);
  }

  return {
    sourceTool: input.sourceTool,
    nodes: mappedNodes,
    links: mappedLinks,
  };
}
