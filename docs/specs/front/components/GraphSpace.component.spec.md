# Component Spec — GraphSpace

> File: `frontend/src/features/graph/components/GraphSpace.tsx`
> Version: 1.0.0 | Status: draft

> `GraphSpace` is the knowledge-graph visualization panel. It is mounted in the 60% right pane of
> `ChatWorkspace` (the `/chat` route). It receives nodes and links as props from `useGraphStore`
> (which is populated by the `graph_delta` SSE dispatcher) and renders them progressively using
> React Flow (`@xyflow/react` v12) + `d3-force` layout.
>
> Normative sources: `temp/chat-graphspace-plan.md` Rev. 2026-06-21 (§6, decisions D1–D5, REQ-1–8);
> `docs/specs/front/features/chat.feature.spec.md` §2 (UI-05..UI-14).

---

## §1 Purpose and Responsibilities

**Does:**
- Render a subgraph (nodes + edges) as a React Flow canvas inside the chat right pane.
- Consume `nodes: GraphNodeData[]` and `links: GraphLinkData[]` as props (the caller — `ChatWorkspace` — reads `useGraphStore` and passes the data down).
- Show processing state (`GraphStatusOverlay`) when the BFF is running a graph tool.
- Animate new nodes one by one via `useGraphReveal` + Framer Motion (stagger ~90ms, `opacity 0→1` + `scale 0.85→1`).
- Pin existing node positions when new nodes arrive (d3-force `fx`/`fy` — no layout jump, D5).
- Let the user **reposition any node by drag-and-drop** (TC-FE drag, supersedes the v1 "not draggable" stance of D5). The drop commits the node's canvas coordinate to the store (`setNodePosition`) and records it in `userPinned`; because the force pass already pins any node that has a position, the dragged coordinate is honoured on every subsequent force run (AC-F.12 extended: existing **and user-placed** nodes do not jump). Drag stays view-local — it never writes to chat state (REQ-6 / UC-CG-09).
- Render edges: `is_temporal=true → solid`, `is_temporal=false → dashed` (tokens.md §7).
- Derive node visual state from `status` only: `active → accepted` (green), `needs_review → uncertain` (amber).
- Expose a `ref` handle (`GraphSpaceHandle`) with view-only operations: `focusNode`, `fitView`, `recenter`.
- Call `onNodeSelect(nodeId)` when a node is clicked (view-only; parent mounts `NodeDetailPanel`).
- Show `GraphEmptyState` when no nodes are present and status is `"empty"`.

**Does NOT:**
- Own or write to `useGraphStore` — it is a **sink** (read-only view of graph data).
- Trigger new chat messages or mutations when the user interacts with the graph.
- Import or call any action from `useChatTurnStore` (structural unidirectionality — REQ-6).
- Navigate to `/graph` or any other route on node interaction.
- Persist graph positions across page reloads (graph is ephemeral per session — D4).
- Handle the node detail fetch — delegates to parent via `onNodeSelect`; `NodeDetailPanel` is mounted by `ChatWorkspace`.

---

## §2 Props Contract

| Prop Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `nodes` | `GraphNodeData[]` | yes | — | List of nodes to render. Source: `useGraphStore` via `ChatWorkspace`. |
| `links` | `GraphLinkData[]` | yes | — | Edges between the nodes above. |
| `status` | `"empty" \| "loading" \| "revealing" \| "ready" \| "error"` | yes | — | Processing state of the graph pane (REQ-2). Drives overlay and empty-state rendering. |
| `errorMessage` | `string \| undefined` | no | `undefined` | Error message shown in `GraphStatusOverlay` when `status === "error"`. |
| `revealStaggerMs` | `number` | no | `90` | Milliseconds between revealing consecutive nodes. Consumed by `useGraphReveal`. |
| `onNodeSelect` | `(nodeId: string) => void` | no | `undefined` | Callback fired when a node is clicked. Used by parent to mount `NodeDetailPanel`. Never causes a chat mutation. |
| `ref` | `Ref<GraphSpaceHandle>` | no | — | React 19 ref-as-prop — exposes the view-only handle. |
| `className` | `string` | no | `""` | Additional Tailwind classes merged via `cn()`. |

### Types referenced

```ts
// features/graph/types.ts
export interface GraphNodeData {
  id: string;                    // UUID — React Flow node id
  type: GraphNodeType;           // mapped via mapNodeType() with fallback (UC-CG-12)
  label: string;                 // canonical_name from wire
  state?: ConfidenceState;       // derived ONLY from node status (I-2): active→accepted, needs_review→uncertain
  subtitle?: string;             // optional: human-readable type name (pt-BR)
}

export interface GraphLinkData {
  id: string;                    // UUID — React Flow edge id
  source: string;                // GraphNodeData.id
  target: string;                // GraphNodeData.id
  label: string;                 // link_type slug
  isTemporal: boolean;           // true → solid, false → dashed (tokens.md §7)
  inEffect?: boolean;            // optional: dim edge when false
  state?: ConfidenceState;       // derived from link status + flags
}

export type GraphStatus = "empty" | "loading" | "revealing" | "ready" | "error";

export interface GraphSpaceHandle {
  focusNode(id: string): void;   // centers + highlights the node in the viewport
  fitView(): void;               // fits all nodes into view
  recenter(): void;              // resets zoom to default and centers
}
```

---

## §3 Component States

> Internal state: React Flow viewport (`position`, `zoom`), selected node id for `NodeDetailPanel` trigger, and `revealed` set tracking which nodes are currently visible (driven by `useGraphReveal`). The data-level state (`nodes`, `links`, `status`) is all external (from props).

| State | Condition | Visible elements |
|---|---|---|
| `empty` | `status="empty"` (no nodes) | `GraphEmptyState` centered in pane — "A memória aparecerá aqui conforme você conversa." |
| `loading` | `status="loading"` (graph tool in flight, no nodes yet OR expanding) | `GraphStatusOverlay` "Buscando na memória…" with spinner; existing canvas behind overlay (if any nodes) |
| `revealing` | `status="revealing"` (reveal queue active) | Canvas with nodes animating in one by one; `aria-busy="true"` |
| `ready` | `status="ready"` (reveal queue empty, graph stable) | Canvas fully interactive; pan/zoom/click enabled |
| `error` | `status="error"` | `GraphStatusOverlay` with error message; existing canvas preserved behind overlay |

> **Rule:** the overlay never hides existing nodes. When `status="loading"` during an expansion (existing nodes already visible), the overlay is a partial scrim — nodes already in the canvas remain visible behind it. When the status is `"empty"` and the pane has never had data, only `GraphEmptyState` is shown (no canvas).

---

## §4 Events Emitted

| Event | Payload | When emitted | Consumer action |
|---|---|---|---|
| `onNodeSelect` | `nodeId: string` | User clicks a node in `GraphCanvas` | `ChatWorkspace` mounts `NodeDetailPanel(nodeId)` inside the right pane |

> No other events are emitted upward. Pan/zoom/drag stay local to `GraphCanvas`. Unidirectionality (REQ-6) is structurally enforced: `GraphSpace` has no import of chat write actions.

---

## §5 Variants and Compositions

| Variant | Props combination | Usage context |
|---|---|---|
| Empty | `nodes=[]`, `links=[]`, `status="empty"` | Initial state before any graph tool runs; also after `useGraphStore.clear()` |
| Loading (no prior data) | `nodes=[]`, `links=[]`, `status="loading"` | First tool call of the session |
| Loading (expansion) | `nodes` has existing nodes, `status="loading"` | Subsequent tool call adding to existing graph |
| Revealing | `nodes` has data, `status="revealing"` | During staggered reveal animation |
| Ready | `nodes` has data, `status="ready"` | Stable interactive state |
| Error (no prior data) | `nodes=[]`, `links=[]`, `status="error"` | Tool call failed before any data |
| Error (with prior data) | `nodes` has data, `status="error"` | Tool call failed, preserving prior subgraph |

---

## §6 Do / Don't

| Do | Don't |
|---|---|
| Pass `nodes`/`links` from `useGraphStore` via `ChatWorkspace` | Let `GraphSpace` import `useGraphStore` directly — it is a sink (props only) |
| Use `mapNodeType()` in the data layer before passing `nodes` — `GraphSpace` receives already-mapped `GraphNodeData` | Pass raw `GraphNodeWire[]` directly to `GraphSpace` |
| Animate only `opacity` and `scale/transform` (Framer Motion from `lib/motion.ts`) | Animate `width`, `height`, `padding`, or any layout property |
| Pin revealed nodes via `fx`/`fy` in `useForceLayout` before the delta arrives | Reposition all nodes on every delta update |
| Reveal edges only after both endpoint nodes are in `revealedIds` | Render dangling edges while an endpoint is still in the reveal queue |
| Call `onNodeSelect(nodeId)` on node click — let parent handle the detail | Navigate to `/graph/:id` or any other route on node click |
| Use `var(--color-node-{type})` tokens for node fill | Inline hex colors for node types |
| Use `GraphStatusOverlay` (with `aria-live="polite"`) for both loading and error messages | Use a toast or modal for graph-pane status |
| Derive node visual `state` from `status` field only | Read `flags` from `GraphNodeData` for node state (flags live on links, not nodes — I-2) |

---

## §7 BDD Scenarios

> Regression anchors for this component.

### Scenario 1 — Render default (empty state)

**Given** `GraphSpace` receives `nodes=[]`, `links=[]`, `status="empty"`  
**Then** `GraphEmptyState` is visible  
**And** no React Flow canvas is rendered  
**And** no `aria-busy` attribute is present  

### Scenario 2 — Loading overlay appears

**Given** `GraphSpace` is in `status="ready"` with 3 nodes  
**When** props update to `status="loading"`  
**Then** `GraphStatusOverlay` appears with "Buscando na memória…" and a spinner  
**And** the existing 3 nodes remain visible behind the overlay  
**And** `aria-busy="true"` is set on the graph region  

### Scenario 3 — Progressive reveal (one by one)

**Given** `GraphSpace` receives 5 new nodes via props update and `status="revealing"`  
**Then** nodes appear sequentially (not all at once)  
**And** each node entry animates `opacity: 0→1` and `scale: 0.85→1` (Framer Motion)  
**And** an edge between node A and node B only becomes visible after both A and B are in `revealedIds`  
**And** after all 5 are revealed, `status` becomes `"ready"` (driven by caller via `settleTurn`)  

### Scenario 4 — Existing nodes do not jump within a response (pin invariant)

**Given** `GraphSpace` shows 3 nodes in stable positions  
**When** another `graph_delta` in the **same response** adds 2 more nodes (`addNodes`)  
**Then** the 3 existing nodes retain their positions (no layout change)  
**And** only the 2 new nodes are placed by `d3-force`  
**Note** A *new* response instead `replaceNodes`: the graph is cleared and re-laid out fresh — non-cumulative, pins do not carry over (owner decision 2026-06-22; see chat.feature `UC-CG-02`).  

### Scenario 5 — Error state preserves prior graph

**Given** `GraphSpace` is in `status="ready"` with nodes  
**When** `status` changes to `"error"` with `errorMessage="Ferramenta falhou."`  
**Then** `GraphStatusOverlay` shows the error message discretely  
**And** the previously visible nodes remain in the canvas  

### Scenario 6 — Keyboard navigation and focus

**Given** `GraphSpace` is in `status="ready"`  
**When** the user tabs into the graph region  
**Then** focus enters the canvas with a visible focus ring  
**And** arrow keys or Tab navigate between node elements  
**And** Enter / Space on a focused node fires `onNodeSelect`  

### Scenario 7 — Unidirectionality (no chat write)

**Given** `GraphSpace` is fully rendered with nodes  
**When** the user clicks any node, pans, or zooms  
**Then** no function from `useChatTurnStore` is called  
**And** no mutation to `sendMessage`, `createConversation`, or any chat endpoint fires  
**And** no import of chat write actions exists in the component tree (structural test)  

---

## §8 Accessibility Contract

| Requirement | Implementation |
|---|---|
| Region landmark | `<section role="region" aria-label="Grafo de conhecimento">` wraps the entire component |
| Busy state | `aria-busy="true"` on the region when `status="loading"` or `status="revealing"`; removed on `"ready"` or `"empty"` |
| Status overlay announced | `GraphStatusOverlay` has `aria-live="polite"` — text changes ("Buscando na memória…" / error message) are announced without focus disruption |
| Node focus and interaction | Each `GraphNodeAdapter` (custom React Flow node) has `role="button"` (or `tabIndex={0}`) and responds to `Enter` / `Space` → `onNodeSelect(id)` |
| Node label | Each node's `aria-label` = `"{type}: {label}"` (e.g., "Pessoa: Rodrigo") |
| Edge accessibility | Edges are decorative — `aria-hidden="true"` on SVG edge elements; relationship information is available via node labels and `NodeDetailPanel` |
| Focus management after node click | `onNodeSelect` is called; `NodeDetailPanel` receives focus on mount (managed by `ChatWorkspace`) |
| Color contrast | Node fill uses `--color-node-{type}` tokens calibrated for WCAG 2.2 AA contrast on the graph depth overlay (`--graph-depth-overlay` — tokens.md §10.2) |
| Empty state | `GraphEmptyState` is a standard text element — readable by screen readers without special ARIA |
| Error message contrast | `GraphStatusOverlay` uses `text-content` over `surface-glass-panel` — minimum 4.5:1 guaranteed by tokens.md §9.3 |

---

## §9 Internal Architecture Notes

### Component tree

```
GraphSpace
├── GraphStatusOverlay  (status="loading" | "error")
├── GraphEmptyState     (status="empty")
└── ReactFlowProvider
    └── GraphCanvas         (<ReactFlow> controlled: nodeTypes, edgeTypes, onNodeClick)
        ├── nodeTypes.graphNode: GraphNodeAdapter  (wraps ds/GraphNode + React Flow <Handle>s)
        └── edgeTypes.graphEdge: GraphEdgeAdapter  (custom edge — solid/dashed, label)

Hooks (feature-local):
  useForceLayout     → d3-force positions; pins existing nodes (fx/fy); outputs {id → {x,y}}
  useGraphReveal     → consumes revealQueue via dequeueReveal(); Framer Motion stagger
```

### Key implementation constraints

- `GraphNodeAdapter` **reuses `components/ds/GraphNode`** — wraps it with `<Handle source>` and `<Handle target>` for React Flow connection points. Does NOT re-implement node styling.
- `useForceLayout` runs d3-force on the node list. Nodes already in `positions` Map are pinned (`fx`/`fy` set). New nodes start unpin, get positioned by force, then pinned after first stable tick.
- The `revealStaggerMs` prop (default 90ms) controls the inter-node animation delay in `useGraphReveal`. The hook calls `useGraphStore.getState().dequeueReveal()` every `revealStaggerMs`ms until the queue is empty.
- `GraphEdgeAdapter` is the `GraphEdge` component spec — see `GraphEdge.component.spec.md`.
- `NodeDetailPanel` is **not** a child of `GraphSpace` — it is mounted by `ChatWorkspace` in the right pane above `GraphSpace` when `onNodeSelect` fires. `GraphSpace` only calls the callback.
- Motion variants come from `lib/motion.ts` (`motion.graph.nodeReveal`). A new factory `motion.graph.nodeReveal` should be added: `{ initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.18, ease: "easeOut" } }`.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-21 | Front Spec Agent | initial | GraphSpace wave. Full spec: props contract, 5 component states, 7 BDD scenarios, accessibility contract, internal architecture notes. Authoritative source: `temp/chat-graphspace-plan.md` Rev. 2026-06-21 §6. |
