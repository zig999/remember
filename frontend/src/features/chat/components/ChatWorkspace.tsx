/**
 * ChatWorkspace — primary /chat workspace component (TC-FE-11).
 *
 * Layout (front.md §3.1 + chat.feature.spec.md UI-01 + plan §7.2):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  ConversationView (40%)  │  GraphSpace OR NodeDetailPanel    │
 *   │  MessageStream + Composer│  (60% — toggled by selectedNodeId)│
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Split rule: 40% / 60% via Tailwind v4 CONTAINER QUERY (`@container`
 * + `@lg:` modifier) — never a CSS @media query (forbidden by
 * front.md §10.2 / project conventions). Below the container's `lg`
 * breakpoint the columns stack vertically (mobile/narrow workstation
 * window); at `@lg` and above they sit side-by-side at 2/5 + 3/5.
 *
 * Search state: reads `?conversation=<uuid>` from the chatRoute search
 * (TC-01 owns the validator). The URL is the single source of truth
 * for the active conversation id (front.md §3.2).
 *
 * TC-FE-11 changes vs. TC-FE-07:
 *  - The static `GlassSurface` stub ("Grafo em breve") is replaced by
 *    `<GraphSpace>` reading nodes/links/status from `useGraphStore`.
 *    The store holds `nodes`/`links` as Maps (O(1) merge — see
 *    graph-store.ts §state.shape); GraphSpace's contract takes them
 *    as `readonly GraphNodeData[]` (props in / RF out) so we convert
 *    via `Array.from(map.values())` HERE (plan §7.2 + TC constraint
 *    "Array.from conversion must happen in ChatWorkspace, not inside
 *    GraphSpace"). The conversion is cheap (subgraphs are dozens of
 *    nodes, not thousands — see plan §11 "centenas+" out of scope).
 *  - Clicking a node fires `onNodeSelect(id)` → we set local
 *    `selectedNodeId`. When non-null the right pane swaps from
 *    GraphSpace to `<NodeDetailPanel>`; closing the panel restores
 *    the canvas. The detail view is inline (spec §3 row Loading,
 *    AC-F.20 / I-3) — never a modal/drawer/route.
 *  - The `data-testid` on the right-column wrapper changes from
 *    `chat-graph-stub` to `graph-space-panel` (TC line 43).
 *
 * Spec divergence (recorded in delivery): chat.feature.spec.md §2 UI-01
 * still describes the right column as a "glass stub panel 'Grafo em
 * breve'". TC-FE-11 + plan §7.2 (Rev. 2026-06-21) override that — UI-01
 * now renders `<GraphSpace status="empty">` which composes the
 * `GraphEmptyState` ("A memória aparecerá aqui conforme você
 * conversa."). The feature spec is stale; reconciliation is a separate
 * SDD pass.
 *
 * Unidirectionality (AC-U.3 / REQ-6):
 *  - This file DOES read from `@/features/chat` (it lives there) and
 *    from `@/features/graph` (it composes the graph surface — the
 *    workspace is the integration point allowed to know both sides).
 *  - It does NOT call any chat write action from the graph callback:
 *    `onNodeSelect` only updates local UI state; `onClose` only
 *    clears that state. Selecting a node has zero impact on the chat
 *    turn (no message sent, no store mutated).
 *
 * Why `getState().clear()` (not a subscribed selector):
 *  - The conversation-change effect (EV-CG-05) is fire-and-forget; we
 *    do not need ChatWorkspace to re-render when the store mutates as
 *    a result. `useGraphStore.getState()` reads the live ref without
 *    creating a subscription, keeping the workspace inert to the
 *    flood of intra-turn updates (`addNodes`/`setStatus`/…).
 *
 * Why the SUBSCRIBED selectors return arrays (Array.from inline):
 *  - The Zustand selector identity matters: returning
 *    `Array.from(s.nodes.values())` from a selector creates a NEW
 *    array on every store update — even ones that did not touch
 *    `nodes`. To keep re-renders tight, we subscribe to the MAP
 *    identity (`s.nodes`) and convert with `useMemo(() => …,
 *    [nodesMap])` so the array is stable as long as the Map identity
 *    is. The Map identity flips only when `addNodes` / `removeNodes`
 *    / `clear` runs — exactly when GraphSpace needs to re-render.
 *
 * Out of scope (later TCs / out-of-wave):
 *  - GraphSpace internals (rendering, force-layout, reveal) — TC-FE-07,
 *    TC-FE-05, TC-FE-09 own them.
 *  - NodeDetailPanel internals (fetch, error mapping, accessibility) —
 *    TC-FE-08 owns it.
 *  - ChatStatusIndicator mount point — TC-FE-10 placed it inside
 *    MessageStream (a child of ConversationView), satisfying this
 *    TC's "mount inside ConversationView" requirement transitively.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { chatRoute } from "@/router/routes";
import {
  GraphSpace,
  NodeDetailPanel,
  useGraphStore,
  type GraphSpaceHandle,
} from "@/features/graph";
import { ConversationView } from "./ConversationView";

export const ChatWorkspace: FC = () => {
  // TC-01 chatRoute.validateSearch returns `{ conversation?: string }`. When
  // the param is absent or empty, the validator yields `{}` — destructuring
  // gives `undefined`, which drives the UI-01 empty state in ConversationView.
  const { conversation } = chatRoute.useSearch();

  // Local UI state — id of the node whose details are currently open. When
  // non-null, the right pane swaps from `<GraphSpace>` to `<NodeDetailPanel>`.
  // The label is captured at click time and forwarded to NodeDetailPanel so
  // the loading state can render the canonical name immediately (no flash of
  // empty heading while the detail fetch is in flight — spec §3 Loading row
  // of NodeDetailPanel.component.spec.md).
  //
  // We keep label and id as a single object so a stale label can never
  // accompany a fresh id (a `useState<{id;label}>` could otherwise be
  // updated out-of-order in a fast click sequence).
  const [selectedNode, setSelectedNode] = useState<
    { id: string; label: string | undefined } | null
  >(null);

  // Optional view-only handle on the GraphSpace. Plumbed for future
  // workflows ("focus the freshly-selected node in the viewport when the
  // detail panel closes" — out of TC-FE-11 scope but the ref shape is in
  // GraphSpaceProps already, so wiring it now avoids a churn commit later).
  // The `unknown` initial value is fine — React 19 ref-as-prop accepts a
  // mutable ref; nothing reads `.current` in this TC.
  const graphRef = useRef<GraphSpaceHandle>(null);

  // Subscribe to the store's MAP identities, not their values. Maps mutate
  // by reference (graph-store.ts always returns `new Map(prev)` from each
  // reducer), so identity tracks "real change". Converting to arrays via
  // `useMemo` keyed by the Map identity gives GraphSpace a stable array
  // reference between unrelated store updates (e.g. `setStatus("loading")`
  // does not allocate a new `nodes` Map → the memoized array reference
  // survives → React reconciliation skips the canvas children).
  const nodesMap = useGraphStore((s) => s.nodes);
  const linksMap = useGraphStore((s) => s.links);
  const status = useGraphStore((s) => s.status);
  const errorMessage = useGraphStore((s) => s.errorMessage);

  const nodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const links = useMemo(() => Array.from(linksMap.values()), [linksMap]);

  // EV-CG-05 (plan §8.2 / TC-FE-04): when the active conversation changes —
  // including the `undefined → uuid` transition on first selection and the
  // `uuid → undefined` transition on leaving — the subgraph must be cleared.
  // Leaking the previous conversation's nodes into a new one would be a
  // coherence (and privacy) bug. We call `getState().clear()` directly to
  // avoid subscribing the workspace to the entire store (re-renders would
  // dwarf the actual mutation cost).
  //
  // We also dismiss any open detail panel — a node id from the previous
  // conversation will not exist after `clear()` (and even if it did, the
  // detail fetch would now point to an unrelated context). Doing this in
  // the SAME effect keeps the two side effects atomically tied to the
  // conversation change.
  useEffect(() => {
    useGraphStore.getState().clear();
    setSelectedNode(null);
  }, [conversation]);

  // `onNodeSelect` is fired by GraphSpace when the user clicks a node. We
  // capture the id AND the click-time label so NodeDetailPanel can show it
  // synchronously while `useNodeDetail` is pending. Looking the label up
  // here (over `nodes`) instead of inside GraphSpace keeps GraphSpace a
  // pure sink — it knows ids, the workspace knows the data shape.
  //
  // `useCallback` so GraphSpace does not re-bind its click handlers on
  // every render (one of React Flow's perf hot paths — each node memoizes
  // against handler identity).
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      const node = nodesMap.get(nodeId);
      setSelectedNode({ id: nodeId, label: node?.label });
    },
    [nodesMap],
  );

  // `onClose` from NodeDetailPanel — clear the selection so the canvas
  // re-renders in place. Memoized for symmetry (the panel does not
  // memoize its own children against this prop today, but a future
  // upgrade might).
  const handleDetailClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    // `@container` marks the workspace as the query container and `flex-1`
    // makes it fill the workspace region (AppShell's <main> is a flex column).
    // The `@lg:` split MUST live on a DESCENDANT, never on this element: a
    // container-query variant resolves against an ANCESTOR container, so an
    // element cannot query its own inline-size.
    <div
      className="@container min-h-0 w-full flex-1"
      data-testid="chat-workspace"
    >
      {/* `flex-col` is the narrow/stacked default; `@lg:flex-row` flips to the
          two-column layout once the WORKSPACE container (not the viewport)
          crosses the `lg` container breakpoint. */}
      <div className="flex h-full w-full flex-col @lg:flex-row">
        {/* Left column — chat, 40% of the workspace at @lg+ (w-2/5 = 40%).
            Stacked above the graph column below @lg (full width). */}
        <div className="min-h-0 flex-1 @lg:w-2/5 @lg:flex-none">
          <ConversationView conversationId={conversation} />
        </div>

        {/* Right column — graph or node detail, 60% at @lg+ (w-3/5).
            Toggled by `selectedNode`: null → GraphSpace canvas;
            non-null → NodeDetailPanel inline panel (spec §3 / AC-F.20).
            The wrapper testid stays stable (`graph-space-panel`) so
            integration tests can anchor against the slot regardless of
            which inner surface is currently mounted. */}
        <div
          className="min-h-0 flex-1 p-lg @lg:w-3/5 @lg:flex-none"
          data-testid="graph-space-panel"
        >
          {selectedNode !== null ? (
            <NodeDetailPanel
              nodeId={selectedNode.id}
              // Only pass `nodeLabel` when defined — `exactOptionalPropertyTypes`
              // forbids explicit `undefined` against an optional prop.
              {...(selectedNode.label !== undefined
                ? { nodeLabel: selectedNode.label }
                : {})}
              onClose={handleDetailClose}
            />
          ) : (
            <GraphSpace
              nodes={nodes}
              links={links}
              status={status}
              // Same `exactOptionalPropertyTypes` discipline — only spread
              // `errorMessage` when the store actually has one.
              {...(errorMessage !== undefined ? { errorMessage } : {})}
              onNodeSelect={handleNodeSelect}
              ref={graphRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};
