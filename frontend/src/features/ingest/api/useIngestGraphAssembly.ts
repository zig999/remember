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

export interface UseIngestGraphAssemblyOptions {
  readonly affectedNodes: ReadonlyArray<AffectedNode> | null;
  readonly enabled: boolean;
}

export interface UseIngestGraphAssemblyResult {
  readonly isAssembling: boolean;
  readonly hasError: boolean;
  readonly settledCount: number;
  readonly totalCount: number;
}

export function useIngestGraphAssembly(
  options: UseIngestGraphAssemblyOptions,
): UseIngestGraphAssemblyResult {
  const { affectedNodes, enabled } = options;

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

  const totalCount = ids.length;
  const settledCount = results.filter(
    (r) => r.status === "success" || r.status === "error",
  ).length;
  const successCount = results.filter((r) => r.status === "success").length;
  const hasError = results.some((r) => r.status === "error");
  const isAssembling =
    enabled && totalCount > 0 && settledCount < totalCount && !hasError;

  const lastAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (totalCount === 0) {
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
    if (successCount !== totalCount) return;
    const key = ids.slice().sort().join("|");
    if (lastAppliedRef.current === key) return;
    lastAppliedRef.current = key;

    const nodeMap = new Map<string, GraphNodeData>();
    const linkMap = new Map<string, GraphLinkData>();

    for (const n of affectedNodes ?? []) {
      nodeMap.set(n.id, {
        id: n.id,
        type: mapNodeType(n.nodeType),
        label: n.canonicalName,
      });
    }

    for (const r of results) {
      if (r.status !== "success") continue;
      const wire = r.data as TraverseResultMinWire | undefined;
      if (wire === undefined) continue;
      for (const wn of wire.nodes ?? []) {
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
