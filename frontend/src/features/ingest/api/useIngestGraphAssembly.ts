/**
 * useIngestGraphAssembly — parallel traverse + GraphDelta assembly (dev_tc_005).
 *
 * Step 4 of the ingest flow (`ingest.feature.spec.md §4`). When the caller
 * has a populated `affectedNodes` list (either from `noop_existing` or from
 * a completed `runLlmExtraction`/polling), we fan out one
 * `GET /api/v1/nodes/:id/traverse?depth=1` request per node via
 * `useQueries`, merge the results into a `GraphDelta`, and (once every query
 * has resolved) call `useGraphStore.replaceNodes(delta)`.
 *
 * Why `replaceNodes` (not `addNodes`):
 *  - Each ingest is its own "session" — the spec explicitly says (UI-07 +
 *    UI-08) the graph reflects ONLY this ingest's affected nodes. The
 *    non-cumulative replace is the right primitive (project memory:
 *    "graph-non-cumulative-and-zustand-spyon").
 *
 * Link deduplication:
 *  - The same `KnowledgeLink` row may appear in multiple traversals (when
 *    both endpoints are in `affectedNodes`). We dedupe by `id` while merging
 *    — last-write-wins is fine because every traverse returns the same row.
 *
 * Wire → surface mapping:
 *  - `affectedNodes` already carry id/canonical_name/node_type → mapped to
 *    `GraphNodeData` directly (status defaults to `active` since there is no
 *    confidence state in the affected_nodes payload).
 *  - Traverse `nodes` add depth-1 neighbours; their wire status is mapped via
 *    `deriveNodeState`.
 *  - Traverse `links` use the same shape as the chat dispatcher uses
 *    (`mapLinkTypeLabel`, `deriveLinkState`); the wire field for
 *    `source_node_id`/`target_node_id` maps to surface `source`/`target`.
 */
import { useEffect, useMemo, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { ingestKeys } from "./keys";
import {
  deriveLinkState,
  deriveNodeState,
  mapLinkTypeLabel,
  mapNodeType,
  useGraphStore,
  type GraphDelta,
  type GraphLinkData,
  type GraphNodeData,
} from "@/features/graph";
import type { AffectedNode } from "./_transforms";

const TRAVERSE_STALE_MS = 5 * 60_000;

/**
 * Minimum subset of the traverse response we depend on. We keep the type
 * narrow — the ingest flow only consumes `depth=1&direction=both` and only
 * needs node + link basics.
 */
interface TraverseNodeMinWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status?: "active" | "needs_review" | "merged" | "deleted";
}

interface TraverseLinkMinWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;
  readonly link_type_label?: string;
  readonly is_temporal?: boolean;
  readonly is_in_effect?: boolean;
  readonly status?: string;
  readonly flags?: ReadonlyArray<"uncertain" | "disputed" | "low_confidence">;
}

interface TraverseResultMinWire {
  readonly starting_node_id?: string;
  readonly nodes?: ReadonlyArray<TraverseNodeMinWire>;
  readonly links?: ReadonlyArray<TraverseLinkMinWire>;
}

function mapTraverseNode(wire: TraverseNodeMinWire): GraphNodeData {
  const base: GraphNodeData = {
    id: wire.id,
    type: mapNodeType(wire.node_type),
    label: wire.canonical_name,
  };
  if (wire.status === undefined) return base;
  const state = deriveNodeState(wire.status);
  if (state === undefined) return base;
  return { ...base, state };
}

function mapTraverseLink(wire: TraverseLinkMinWire): GraphLinkData {
  const base: GraphLinkData = {
    id: wire.id,
    source: wire.source_node_id,
    target: wire.target_node_id,
    label: wire.link_type,
    linkTypeLabel: mapLinkTypeLabel(wire.link_type, wire.link_type_label),
    isTemporal: wire.is_temporal === true,
  };
  // `deriveLinkState` requires both status and flags — only call when we have
  // them; otherwise omit `state` (renders as default-confidence).
  const state =
    wire.status !== undefined
      ? deriveLinkState(wire.status, wire.flags)
      : undefined;
  if (wire.is_in_effect !== undefined && state !== undefined) {
    return { ...base, inEffect: wire.is_in_effect, state };
  }
  if (wire.is_in_effect !== undefined) {
    return { ...base, inEffect: wire.is_in_effect };
  }
  if (state !== undefined) {
    return { ...base, state };
  }
  return base;
}

/** Inputs to the assembly hook. */
export interface UseIngestGraphAssemblyOptions {
  /** Affected nodes returned by `ingestRawInformation` (noop) or by the
   *  completed run (success). When `null` no traverse runs. */
  readonly affectedNodes: ReadonlyArray<AffectedNode> | null;
  /** Caller-controlled gate — set `true` once the upstream step (extraction
   *  or noop reveal CTA) is ready to populate the graph. */
  readonly enabled: boolean;
}

/** Output exposed to the workspace. */
export interface UseIngestGraphAssemblyResult {
  /** `true` while any traverse query is in flight. */
  readonly isAssembling: boolean;
  /** `true` once at least one traverse query has failed. */
  readonly hasError: boolean;
  /** Number of traverse queries that have settled successfully so far. */
  readonly settledCount: number;
  /** Number of traverse queries dispatched (=== affectedNodes.length). */
  readonly totalCount: number;
}

export function useIngestGraphAssembly(
  options: UseIngestGraphAssemblyOptions,
): UseIngestGraphAssemblyResult {
  const { affectedNodes, enabled } = options;

  // Memoize the id list so React Query's `queries` array identity is stable
  // across re-renders (avoids the "queries changed" thrash in dev mode).
  const ids = useMemo(
    () => (affectedNodes ?? []).map((n) => n.id),
    [affectedNodes],
  );

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ingestKeys.traverse(id),
      queryFn: async () => {
        return http<TraverseResultMinWire>(
          `/api/v1/nodes/${encodeURIComponent(id)}/traverse?depth=1&direction=both`,
          { method: "GET", headers: authHeader() },
        );
      },
      enabled,
      staleTime: TRAVERSE_STALE_MS,
      refetchOnWindowFocus: false,
    })),
  });

  // Stable identity for the result tuple so the effect doesn't re-run on
  // every render. We only care whether (a) all settled, (b) any errored.
  const totalCount = ids.length;
  const settledCount = results.filter(
    (r) => r.status === "success" || r.status === "error",
  ).length;
  const successCount = results.filter((r) => r.status === "success").length;
  const hasError = results.some((r) => r.status === "error");
  const isAssembling =
    enabled && totalCount > 0 && settledCount < totalCount && !hasError;

  // Apply `replaceNodes(delta)` exactly once per (enabled + completion). Use
  // a ref to ensure we don't push the same delta twice if React re-renders.
  const lastAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (totalCount === 0) {
      // Nothing to traverse — emit an empty delta so the graph clears and
      // we can move out of "loading" cleanly.
      const key = "empty";
      if (lastAppliedRef.current === key) return;
      lastAppliedRef.current = key;
      const delta: GraphDelta = {
        sourceTool: "ingest_assembly",
        nodes: [],
        links: [],
      };
      useGraphStore.getState().replaceNodes(delta);
      useGraphStore.getState().setStatus("ready");
      return;
    }
    if (successCount !== totalCount) return; // wait for all to settle
    // Build a stable key from the id list — if the caller re-runs the
    // assembly with the same affected nodes (e.g. user clicks "Ver grafo
    // existente" twice) we don't redundantly replace.
    const key = ids.slice().sort().join("|");
    if (lastAppliedRef.current === key) return;
    lastAppliedRef.current = key;

    const nodeMap = new Map<string, GraphNodeData>();
    const linkMap = new Map<string, GraphLinkData>();

    // Seed with affected nodes (canonical labels straight from the ingest
    // response).
    for (const n of affectedNodes ?? []) {
      nodeMap.set(n.id, {
        id: n.id,
        type: mapNodeType(n.nodeType),
        label: n.canonicalName,
      });
    }

    // Merge each traverse result.
    for (const r of results) {
      if (r.status !== "success") continue;
      const wire = r.data as TraverseResultMinWire | undefined;
      if (wire === undefined) continue;
      for (const wn of wire.nodes ?? []) {
        // Don't overwrite the affected-node entry with a thinner traverse
        // node (the affected list is the source of truth for the label).
        if (!nodeMap.has(wn.id)) {
          nodeMap.set(wn.id, mapTraverseNode(wn));
        }
      }
      for (const wl of wire.links ?? []) {
        linkMap.set(wl.id, mapTraverseLink(wl));
      }
    }

    const delta: GraphDelta = {
      sourceTool: "ingest_assembly",
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
    };
    useGraphStore.getState().replaceNodes(delta);
    useGraphStore.getState().setStatus("revealing");
  }, [enabled, totalCount, successCount, ids, affectedNodes, results]);

  return { isAssembling, hasError, settledCount, totalCount };
}
