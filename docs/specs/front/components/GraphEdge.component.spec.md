# Component Spec — GraphEdge

> File: `frontend/src/features/graph/components/GraphEdgeAdapter.tsx`
> (Registered as `edgeTypes.graphEdge` in the React Flow instance inside `GraphCanvas`)
> Version: 1.0.0 | Status: draft

> `GraphEdge` (registered as a custom React Flow `edgeType`) renders a knowledge-graph link between
> two `GraphNodeAdapter` elements inside `GraphSpace`. Its primary visual responsibility is:
> - **solid line** for temporal links (`is_temporal=true`)
> - **dashed line** for stable links (`is_temporal=false`)
> - **floating path**: the edge connects at the nearest point on each node's boundary (not a fixed handle), recalculating dynamically after every node move or layout change.
>
> This follows `tokens.md §7` and the normative plan decision I-1 in
> `temp/chat-graphspace-plan.md`. Floating-edge strategy: graph-improvement wave (REQ-1).

---

## §1 Purpose and Responsibilities

**Does:**
- Render a labeled SVG edge between two React Flow nodes using the link's color token (`--color-link-{link_type}`).
- **Compute the edge path as a floating edge**: call `useInternalNode(source)` and `useInternalNode(target)` to read the live node geometry (position + measured size), then delegate to the pure helper `getEdgeParams(sourceNode, targetNode)` which computes center-to-center line intersection with each node's bounding rectangle and returns the nearest `Position` direction for each endpoint. Feed the result into `getBezierPath`. If either node is unmeasured, render nothing.
- Apply stroke style: `strokeDasharray: "0"` (solid) when `is_temporal=true`; `strokeDasharray: "4 4"` (dashed) when `is_temporal=false`.
- Render the `link_type` label along the edge path (centered, small, readable).
- Show a hover state that reveals the full link details (link_type, status, flags, `inEffect`).
- Dim the edge visually when `inEffect === false` (edge is out of temporal effect today).
- Color the edge stroke according to the `ConfidenceState` derived from `status` + `flags` (using the `--color-state-*` tokens for uncertain/disputed/superseded links; falling back to the link-type color for accepted links).
- Render a directional arrowhead (`markerEnd`) pointing from source to target (tokens.md §7).

**Does NOT:**
- Use the `sourceX` / `sourceY` / `targetX` / `targetY` values injected by React Flow from fixed Handle positions — these are ignored in favor of the floating geometry computed via `useInternalNode` + `getEdgeParams`.
- Own any graph state — pure presentational component (receives all data from React Flow's `EdgeProps` + internal-node hooks).
- Trigger any interaction on click (edges are not clickable in v1 — only nodes are).
- Navigate or call any chat mutation.
- Render if either endpoint node is not yet in `revealedIds` — the parent `GraphSpace` controls edge visibility (an edge is only mounted in the React Flow graph once both endpoints are revealed).

---

## §2 Props Contract

> `GraphEdge` is a **custom React Flow edge component**. React Flow injects all props via `EdgeProps<GraphLinkData>`. The data payload is `GraphLinkData` (passed via `data` prop from the React Flow edge definition). The table below documents both React Flow injected props and the custom `data` shape.

| Prop Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | yes (RF injected) | — | Edge id (UUID of `KnowledgeLink`) |
| `source` | `string` | yes (RF injected) | — | Source node id |
| `target` | `string` | yes (RF injected) | — | Target node id |
| `sourceX` / `sourceY` | `number` | yes (RF injected) | — | SVG coordinates of the source handle — **not used for path geometry** in the floating-edge implementation; retained because RF's `EdgeProps` type includes them. |
| `targetX` / `targetY` | `number` | yes (RF injected) | — | SVG coordinates of the target handle — **not used for path geometry** in the floating-edge implementation; retained because RF's `EdgeProps` type includes them. |
| `markerEnd` | `string` | no (RF injected) | — | Arrow marker id from React Flow's marker defs |
| `data.label` | `string` | yes | — | `link_type` slug (e.g., `"responsible_for"`) — displayed along the edge path |
| `data.isTemporal` | `boolean` | yes | — | `true` → solid stroke; `false` → dashed stroke (tokens.md §7, I-1) |
| `data.inEffect` | `boolean \| undefined` | no | `true` | When `false`, the edge is rendered at 40% opacity to indicate it is out of temporal effect |
| `data.state` | `ConfidenceState \| undefined` | no | `undefined` | Confidence state of the link (`uncertain`/`disputed`/`superseded`); drives stroke color override |
| `data.source` | `string` | yes | — | Same as RF `source` (duplicate for data-layer use) |
| `data.target` | `string` | yes | — | Same as RF `target` (duplicate for data-layer use) |

> The `data.label` value is the raw `link_type` slug. For display, a lookup table in `features/graph/types/link-type-map.ts` provides the human-readable pt-BR label (e.g., `"responsible_for"` → `"é responsável por"`). The display label is used in the hover tooltip; the slug is always shown in the edge label itself.

---

## §3 Component States

| State | Condition | Visual |
|---|---|---|
| Default (temporal, accepted) | `isTemporal=true`, `state` absent or `"accepted"` | Solid stroke in `--color-link-{link_type}`, full opacity, arrowhead |
| Default (stable, accepted) | `isTemporal=false`, `state` absent or `"accepted"` | Dashed stroke (`4 4`) in `--color-link-{link_type}`, full opacity, arrowhead |
| Uncertain | `state="uncertain"` | Stroke color overridden to `--color-state-uncertain`; dashed regardless of `isTemporal` (uncertainty supersedes the temporal/stable distinction visually) |
| Disputed | `state="disputed"` | Stroke color overridden to `--color-state-disputed`; default dash from `isTemporal` |
| Superseded | `state="superseded"` | Stroke color overridden to `--color-state-superseded`; opacity 40% |
| Out of effect | `inEffect=false` | opacity 40% (may combine with other states) |
| Hover | User hovers the edge path | Stroke width increases to `--border-2` (2px); tooltip appears showing link_type (pt-BR), status, flags, temporal info |

---

## §4 Events Emitted

> `GraphEdge` emits no events. Edges are not interactive in v1 (REQ-6 — graph is a sink; all user interaction is pan/zoom/node-click via `GraphNodeAdapter`). The hover tooltip is a CSS/Framer Motion hover state, not an event.

---

## §5 Variants and Compositions

| Variant | Props combination | Visual |
|---|---|---|
| Temporal accepted | `isTemporal=true`, no `state` | Solid, link-type color, full opacity |
| Stable accepted | `isTemporal=false`, no `state` | Dashed `4 4`, link-type color, full opacity |
| Uncertain | `state="uncertain"` | Dashed (override), amber (`--color-state-uncertain`) |
| Disputed | `state="disputed"` | Dashed (override), orange (`--color-state-disputed`) |
| Superseded | `state="superseded"` | Grey (`--color-state-superseded`), 40% opacity |
| Out of effect | `inEffect=false` | 40% opacity, keeps stroke style |

---

## §6 Do / Don't

| Do | Don't |
|---|---|
| Use `--color-link-{link_type}` token for the default stroke color | Inline hex values for link colors |
| Use `strokeDasharray: "0"` for temporal, `strokeDasharray: "4 4"` for stable | Invent a different dash pattern |
| Override stroke color (not dash pattern) for `uncertain` / `disputed` / `superseded` states | Override both color AND dash pattern for confidence states (confusing visual signal) |
| Show the `link_type` slug as the edge label (small, centered, `text-caption` token) | Hide the label entirely (loses semantic information) |
| Use `opacity: 0.4` for out-of-effect and superseded edges | Use `display: none` (breaks React Flow layout and removes the edge from the a11y tree) |
| Use `--border-thin` (1px) as default stroke width | Hard-code `1` in SVG attributes |
| Increase to `--border-2` (2px) on hover only | Permanently render thicker edges (visual noise) |
| Ensure hover tooltip appears above the edge path (z-index `z-popover`) | Render tooltip at z-base (gets clipped by other canvas elements) |
| Use `useInternalNode(sourceId)` + `useInternalNode(targetId)` + `getEdgeParams` for the floating geometry | Use the RF-injected `sourceX`/`sourceY`/`targetX`/`targetY` (those come from fixed Handle offsets, not from the nearest node boundary) |
| Return `null` (render nothing) when `getEdgeParams` returns `null` (either node unmeasured) | Crash or use fallback coordinates (0,0) |

---

## §7 BDD Scenarios

### Scenario 1 — Temporal edge renders solid

**Given** `GraphEdge` receives `data.isTemporal=true` with `state` absent  
**Then** the SVG path has `strokeDasharray="0"` (solid line)  
**And** stroke color is `var(--color-link-{label})`  

### Scenario 2 — Stable edge renders dashed

**Given** `GraphEdge` receives `data.isTemporal=false` with `state` absent  
**Then** the SVG path has `strokeDasharray="4 4"` (dashed line)  
**And** stroke color is `var(--color-link-{label})`  

### Scenario 3 — Uncertain edge renders in amber

**Given** `GraphEdge` receives `data.state="uncertain"`  
**Then** stroke color is `var(--color-state-uncertain)` (amber)  
**And** `strokeDasharray="4 4"` (uncertainty overrides to dashed)  

### Scenario 4 — Out-of-effect edge is dimmed

**Given** `GraphEdge` receives `data.inEffect=false`  
**Then** the edge path has `opacity: 0.4`  
**And** it remains in the React Flow graph (not hidden)  

### Scenario 5 — Hover shows full details

**Given** `GraphEdge` is in default state  
**When** the user hovers the edge path  
**Then** stroke width increases to `--border-2`  
**And** a tooltip appears above the edge with: pt-BR link name, status, flags (if any), temporal indicator  
**And** tooltip disappears on mouse leave  

### Scenario 6 — Floating edge reconnects after node drag

**Given** two nodes A and B are connected by an edge  
**And** `GraphEdge` is rendering in `status="ready"`  
**When** node A is dragged to a new canvas position  
**Then** `useInternalNode(A.id)` returns the updated position and measured size  
**And** `getEdgeParams` recomputes the intersection with A's new bounding rectangle  
**And** the edge path origin moves to the nearest boundary point of A's new position  
**And** the path does NOT use the old fixed-handle coordinate  

---

## §8 Accessibility Contract

| Requirement | Implementation |
|---|---|
| Decorative SVG | The edge SVG path element has `aria-hidden="true"` — relationship information is conveyed through node labels and `NodeDetailPanel` |
| Hover tooltip accessible | Tooltip text is also available via `title` attribute on the edge `<g>` wrapper for keyboard/AT fallback |
| Color not the only signal | Solid vs dashed stroke communicates temporal vs stable **in addition** to color — color-blind users get the structural cue |
| Sufficient contrast | Link color tokens from tokens.md §7 are calibrated for ≥ 3:1 (large non-text element) against `--graph-depth-overlay`; confidence-state colors (uncertain/disputed) are the same as the StateBadge palette (WCAG-verified) |

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.1.0 | 2026-06-23 | Front Spec Agent | minor | Graph-improvement wave (REQ-1 floating edges): header updated; §1 Does adds floating-edge path computation (`useInternalNode` + `getEdgeParams`); §1 Does NOT clarifies RF-injected sourceX/Y are ignored; §2 sourceX/Y rows annotated as not used for geometry; §6 Do/Don't rows added for floating-edge pattern; BDD Scenario 6 added. |
| 1.0.0 | 2026-06-21 | Front Spec Agent | initial | GraphSpace wave. Custom React Flow edge renderer: solid/dashed by `is_temporal`, link-type color tokens, confidence-state overrides, hover details, accessibility contract. |
