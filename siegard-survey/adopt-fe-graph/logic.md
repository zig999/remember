---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/graph/hooks/useForceLayout.ts
  - src/features/graph/hooks/useGraphReveal.ts
  - src/features/graph/index.ts
  - src/features/graph/lib/edge-params.ts
  - src/features/graph/lib/layout-radial.ts
  - src/features/graph/lib/layout-tree.ts
  - src/features/graph/lib/map.ts
  - src/features/graph/lib/spanning-tree.ts
  - src/features/graph/state/graph-store.ts
  - src/features/graph/types.ts
read_outside_area:
  - "src/components/ds/StateBadge/StateBadge.types.ts — to list every value of the confidence state that map.ts returns and types.ts imports"
  - "src/components/ds/GraphNode/GraphNode.types.ts — to list every value of the node type union that map.ts mirrors and types.ts imports"
---

## Facts
### Graph delta as received (`domain/chat/graph-delta`, `domain/chat/graph-delta-node`, `domain/chat/graph-delta-link`)
- A graph delta frame carries `source_tool`, `nodes[]` and `links[]`. `src/features/graph/types.ts` (`GraphDeltaWire`).
- A delta node carries `id`, `node_type` (an open-catalog slug), `canonical_name` and `status`. It carries no flags. `src/features/graph/types.ts` (`GraphNodeWire`).
- A delta link carries `id`, `source_node_id`, `target_node_id`, `link_type` and `is_temporal`. It may also carry `link_type_label`, `is_in_effect`, `status` (a free string) and `flags[]`. `src/features/graph/types.ts` (`GraphLinkWire`).
- Once mapped, a graph delta holds `sourceTool` (a free string), `nodes` and `links`. `src/features/graph/types.ts` (`GraphDelta`).
- A mapped node holds `id`, `type` (the mapped node type), `label`, an optional `state` (the confidence state) and an optional `subtitle`. `src/features/graph/types.ts` (`GraphNodeData`).
- A mapped link holds `id`, `source`, `target`, `label` (the link type slug), `linkTypeLabel` (the text shown), `isTemporal`, an optional `inEffect` and an optional `state`. `src/features/graph/types.ts` (`GraphLinkData`).

### Mapping a delta to what the pane shows
- The node type is the slug after trimming and lower-casing. A slug outside the ten known node types becomes `concept`. The mapping never throws. `src/features/graph/lib/map.ts` (`mapNodeType`, `KNOWN_NODE_TYPES`, `FALLBACK_NODE_TYPE`).
- A node's confidence state depends on its status alone: `active` → `accepted`, `needs_review` → `uncertain`. `src/features/graph/lib/map.ts` (`deriveNodeState`).
- `merged`, `deleted` and any unknown node status give no state, which marks the node as one to leave off the pane. `src/features/graph/lib/map.ts` (`deriveNodeState`, `default` branch).
- A node never gets the `superseded`, `disputed` or `low-confidence` state. `src/features/graph/lib/map.ts` (`deriveNodeState`).
- A link's confidence state is chosen in this order of precedence: status `superseded` → `superseded`; then flag `disputed` → `disputed`; then flag `low_confidence` → `low-confidence`; then flag `uncertain` → `uncertain`; otherwise `accepted`. `src/features/graph/lib/map.ts` (`deriveLinkState`).
  - A superseded link shows as `superseded` even when it also carries the `disputed` flag. Missing flags and an empty flag list both mean "no flags".
- `superseded` is the only link status the mapping branches on. Every other status falls through to the flag checks. `src/features/graph/lib/map.ts` (`deriveLinkState`).
- The link text shown is `link_type_label` when the label is present and not blank after trimming. The label is returned untrimmed. `src/features/graph/lib/map.ts` (`mapLinkTypeLabel`).
- Without such a label, the link text is the `link_type` slug with each `_` replaced by a space, with no other change of case or translation. `src/features/graph/lib/map.ts` (`mapLinkTypeLabel`).
- The link type slug is kept as `label` and is never the text shown. `src/features/graph/types.ts` (`GraphLinkData.label`, `linkTypeLabel`).

### Graph pane status
- The graph pane status has exactly five values and no idle value. `src/features/graph/types.ts` (`GraphStatus`).
- The pane starts and clears to: no nodes, no links, no positions, an empty reveal queue, nothing revealed, status `empty`, no error message, no delta received this turn, no user pins, layout counter `0`, layout algorithm `force`. `src/features/graph/state/graph-store.ts` (`makeInitialState`, `clear`).
- Setting any status other than `error` clears the error message. Setting `error` keeps the message it was given, if any. `src/features/graph/state/graph-store.ts` (`setStatus`).
- When a turn ends with `done` after a delta arrived that turn, the status becomes `ready` and the error message is cleared. `src/features/graph/state/graph-store.ts` (`settleTurn`).
- When a turn ends with `done` and no delta arrived that turn, the status is left as it was. `src/features/graph/state/graph-store.ts` (`settleTurn`).
- When a turn ends with `error` while the status is `loading` or `revealing`, the status becomes `error`. No error message is set by this path. `src/features/graph/state/graph-store.ts` (`settleTurn`, `graphToolInFlight`).
- When a turn ends with `error` while the status is `empty`, `ready` or `error`, the status is left as it was. `src/features/graph/state/graph-store.ts` (`settleTurn`, `graphToolInFlight`).
- Ending a turn, with either `done` or `error`, always resets the "delta received this turn" mark. `src/features/graph/state/graph-store.ts` (`settleTurn`).
- The status moves from `revealing` to `ready` when the reveal queue is empty. This happens when the reveal step mounts or sees an empty queue, after the last staggered reveal, and after a reduced-motion drain. No other status is ever changed by the reveal step. `src/features/graph/hooks/useGraphReveal.ts` (`useGraphReveal` effect, `tick`, `drainAll`).

### Merging deltas (`rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add`)
- Adding a delta merges its nodes and links into the graph by `id`. A node or link already present is overwritten by the newer one. `src/features/graph/state/graph-store.ts` (`addNodes`).
- Adding a delta queues for reveal only the node ids that are neither revealed yet nor already in the graph. A node that is affirmed again is never revealed a second time. `src/features/graph/state/graph-store.ts` (`addNodes`).
- Adding a delta marks that a delta was received this turn, even when every id was already known. `src/features/graph/state/graph-store.ts` (`addNodes`).
- Adding a delta keeps every link, including one whose endpoints are not in the graph. `src/features/graph/state/graph-store.ts` (`addNodes`).
- Replacing with a delta empties the graph first and keeps only that delta's nodes. `src/features/graph/state/graph-store.ts` (`replaceNodes`).
  - It keeps only the links whose source and target are both among those nodes.
  - It clears positions, user pins and the revealed set.
  - It queues every node of the delta for reveal, in delta order.
  - It marks a delta received and leaves the status untouched.
- Removing nodes drops them together with their positions, revealed marks, user pins and queued reveals, and every link that touches one of them. An empty id list changes nothing. `src/features/graph/state/graph-store.ts` (`removeNodes`).
- Changing the conversation clears the graph back to its initial state. `src/features/graph/state/graph-store.ts` (`clear`).

### Progressive reveal
- Nodes are revealed one at a time from the head of the queue, in queue order. The default gap is 90 ms. `src/features/graph/hooks/useGraphReveal.ts` (`DEFAULT_REVEAL_STAGGER_MS`, `tick`, `dequeueReveal`).
- A gap of zero or less is treated as 0 ms, and the reveal stays asynchronous. `src/features/graph/hooks/useGraphReveal.ts` (`Math.max(0, staggerRef.current)`).
- A change to the gap while a reveal is running takes effect from the next reveal. `src/features/graph/hooks/useGraphReveal.ts` (`staggerRef`).
- When the owner prefers reduced motion, every queued node is revealed at once with no stagger. Where the preference cannot be read, motion is assumed on. `src/features/graph/hooks/useGraphReveal.ts` (`prefersReducedMotion`, `drainAll`).
- Revealing an id that is already revealed changes nothing. `src/features/graph/hooks/useGraphReveal.ts` (`revealOne`).
- Stopping the reveal (unmount) cancels the pending step. Revealed nodes stay revealed and queued nodes stay queued. `src/features/graph/hooks/useGraphReveal.ts` (effect cleanup).
- The reveal step marks nodes only. It does not decide which links are visible. `src/features/graph/hooks/useGraphReveal.ts` (`useGraphReveal` returns `revealedIds`).

### Layout (`domain/chat/graph-layout`)
- The layout algorithm is one of `force`, `tree` and `radial`. The default is `force`, and an unrecognized value falls back to `force`. `src/features/graph/state/graph-store.ts` (`GraphLayoutAlgorithm`, `makeInitialState`); `src/features/graph/hooks/useForceLayout.ts` (`switch (layoutAlgorithm)`).
- The layout re-runs whenever the graph's nodes, its links or the layout counter change. Moving a node by hand does not re-run it. `src/features/graph/hooks/useForceLayout.ts` (`useEffect` deps `[nodes, links, layoutNonce]`).
- A run caused by a change to nodes or links keeps every node that already has a position at that exact position. This applies to every positioned node, not only those the owner moved by hand. Only nodes without a position are placed. `src/features/graph/hooks/useForceLayout.ts` (`pinned = positionsRef.current`); `src/features/graph/hooks/useForceLayout.ts` (`runForceLayout` `fx`/`fy`); `src/features/graph/lib/layout-tree.ts` (`runTreeLayout`); `src/features/graph/lib/layout-radial.ts` (`runRadialLayout`).
- A run caused by a change to the layout counter ignores every position and places every node again. `src/features/graph/hooks/useForceLayout.ts` (`isReset`).
- An empty graph has no positions. `src/features/graph/hooks/useForceLayout.ts` (`nodeIds.length === 0` branch).
- Links whose endpoints are not both in the graph are left out of every layout. `src/features/graph/hooks/useForceLayout.ts` (`runForceLayout` filter); `src/features/graph/lib/spanning-tree.ts` (`buildSpanningTree`).
- Moving a node by hand fixes it at the dropped position and records it as pinned by the owner. A move for a node that is not in the graph changes nothing. `src/features/graph/state/graph-store.ts` (`setNodePosition`).
- Reorganizing clears the owner's pins and advances the layout counter, so every node is placed again. Positions are not cleared beforehand. `src/features/graph/state/graph-store.ts` (`resetLayout`).
- Choosing a different layout algorithm sets it, clears the owner's pins and advances the layout counter. Choosing the algorithm already in use changes nothing. `src/features/graph/state/graph-store.ts` (`setLayoutAlgorithm`).

### Force layout numbers
- The force layout runs 100 synchronous ticks and is not animated. `src/features/graph/hooks/useForceLayout.ts` (`SIM_TICKS`, `.stop()`, `simulation.tick`).
- Each node has a footprint of 270 canvas units. Its collision radius is 135, so node centres end at least 270 apart. `src/features/graph/hooks/useForceLayout.ts` (`NODE_FOOTPRINT`, `COLLIDE_RADIUS`).
- The link distance is 270, the charge strength is −300 (repulsion) and the centre is (0, 0). `src/features/graph/hooks/useForceLayout.ts` (`LINK_DISTANCE`, `CHARGE_STRENGTH`, `CENTER_X`, `CENTER_Y`).
- A node with no links is still placed. A coordinate that cannot be computed becomes 0. `src/features/graph/hooks/useForceLayout.ts` (`runForceLayout`, `n.x ?? 0`).

### Tree and radial layout numbers
- The tree and radial layouts both lay out one spanning tree, built breadth-first over undirected links. `src/features/graph/lib/spanning-tree.ts` (`buildSpanningTree`).
  - Self-links are ignored. Duplicate links count once.
  - Component roots are taken in order of degree, highest first, with ties going to the smaller id (string order).
  - Neighbours are visited in ascending id order.
  - Links that close a cycle are not in the tree.
- With two or more components, the component roots hang under a virtual root. The virtual root's id is `__super_root__` and it is never given a position. `src/features/graph/lib/spanning-tree.ts` (`SUPER_ROOT_ID`); `src/features/graph/lib/layout-tree.ts` (`runTreeLayout`); `src/features/graph/lib/layout-radial.ts` (`runRadialLayout`).
- The tree layout grows left to right: depth runs along x and siblings stack along y. `src/features/graph/lib/layout-tree.ts` (`out.set(id, { x: node.y, y: node.x })`).
  - Siblings are 110 canvas units apart and layers 340 apart (`TREE_SIBLING_GAP`, `TREE_LEVEL_GAP`).
- In the radial layout, the root is at (0, 0) and angle 0 points to the top. `src/features/graph/lib/layout-radial.ts` (`x = r·sin θ`, `y = −r·cos θ`).
  - The angular gap is 1 between siblings and 2 between other neighbours, divided by depth (`separation`).
- The radius of each ring in the radial layout is the largest of three values: depth × 200; 270 / (2·sin(π / ring count)) when the ring holds two or more nodes; and the previous ring's radius + 200. Ring 0 has radius 0. `src/features/graph/lib/layout-radial.ts` (`NODE_FOOTPRINT`, `MIN_RING_GAP`, `radiusPerDepth`).

### Link geometry on the canvas
- A link is drawn only when both of its nodes exist and have a measured non-zero width and height. Otherwise there are no link endpoints. `src/features/graph/lib/edge-params.ts` (`getEdgeParams` returns `null`).
- A link's endpoints sit where the line between the two node centres crosses each node's border. `src/features/graph/lib/edge-params.ts` (`getNodeIntersection`).
- The side a link meets is checked in this order, within 1 unit after rounding: left, right, top, bottom. Bottom is used when no side matches. `src/features/graph/lib/edge-params.ts` (`getEdgePosition`).

### Graph view snapshot (`domain/chat/graph-view`, `rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation`)
- A saved snapshot is version `2` and carries `nodes` (mapped nodes), `links` (mapped links), `positions` (an object of `{x, y}` keyed by node id), `user_pinned` (ids) and `layout_algorithm`. `src/features/graph/state/graph-store.ts` (`getSnapshot`, `GraphSnapshotV2`).
- A version `1` snapshot carries the same fields without `layout_algorithm`. `src/features/graph/state/graph-store.ts` (`GraphSnapshotV1`).
- Restoring a snapshot shows every node at once, with no reveal. `src/features/graph/state/graph-store.ts` (`hydrate`).
  - It restores nodes, links, positions and owner pins.
  - It marks every node revealed and empties the queue.
  - It sets status `ready`, even when the snapshot holds no nodes.
  - It clears the error message and the "delta received" mark.
- A snapshot's layout algorithm is restored only when it is version `2` and carries `layout_algorithm`. Any other snapshot restores as `force`. Restoring never throws on the version. `src/features/graph/state/graph-store.ts` (`hydrate`).
- A restored snapshot keeps positions for ids that are not among its nodes. `src/features/graph/state/graph-store.ts` (`hydrate`, `Object.entries(snapshot.positions)`).

## Answers
- Merge, replace or restore a delta, or a snapshot that holds an unknown node type → no refusal; the node is shown as `concept`. `src/features/graph/lib/map.ts` (`mapNodeType`).
- Map a node whose status is `merged`, `deleted` or unknown → no refusal and no error; the node gets no state, which signals that it should be left off the pane. `src/features/graph/lib/map.ts` (`deriveNodeState`).
- Move a node by hand when its id is not in the graph → no change, no status, no code. `src/features/graph/state/graph-store.ts` (`setNodePosition`).
- Choose the layout algorithm already in use → no change, no status, no code. `src/features/graph/state/graph-store.ts` (`setLayoutAlgorithm`).
- Remove an empty list of nodes → no change, no status, no code. `src/features/graph/state/graph-store.ts` (`removeNodes`).
- Restore a snapshot whose version is not `2` or that lacks `layout_algorithm` → no refusal; it restores with `force`. `src/features/graph/state/graph-store.ts` (`hydrate`).
- Draw a link when either node is missing or unmeasured → no endpoints (`null`); the link is not drawn. `src/features/graph/lib/edge-params.ts` (`getEdgeParams`).
- Turn ends in `error` while a graph tool was in flight → pane status `error`, with no error message from this path. `src/features/graph/state/graph-store.ts` (`settleTurn`).

## Vocabularies
- Graph pane status: `empty`, `loading`, `revealing`, `ready`, `error`. `src/features/graph/types.ts` (`GraphStatus`).
- Layout algorithm (`domain/chat/graph-layout`): `force`, `tree`, `radial`. `src/features/graph/state/graph-store.ts` (`GraphLayoutAlgorithm`).
- Node status on the wire (`domain/knowledge-base/node-status`): `active`, `needs_review`, `merged`, `deleted`. `src/features/graph/types.ts` (`GraphNodeWireStatus`).
- Link flag on the wire (`domain/knowledge-base/assertion-flag`): `uncertain`, `disputed`, `low_confidence`. `src/features/graph/types.ts` (`GraphLinkWireFlag`).
- Confidence state shown: `accepted`, `uncertain`, `low-confidence`, `disputed`, `superseded`. `src/features/graph/lib/map.ts` (`deriveNodeState`, `deriveLinkState`); `src/features/graph/types.ts` (`ConfidenceState` import).
- Known node types (mirroring `domain/knowledge-base/node-type`, `rules/knowledge-base/catalog-node-types`): `person`, `organization`, `project`, `event`, `role`, `category`, `concept`, `location`, `document`, `task`. `src/features/graph/lib/map.ts` (`KNOWN_NODE_TYPES`).
- Terminal frame of a turn as the pane settles it: `done`, `error`. `src/features/graph/state/graph-store.ts` (`settleTurn`).
- Graph view snapshot version: `1`, `2`. `src/features/graph/state/graph-store.ts` (`GraphSnapshotV1`, `GraphSnapshotV2`).

## Upstream artifacts
- The back end's graph delta frame (`domain/chat/graph-delta`) uses the field names `source_tool`, `nodes`, `links`; per node `id`, `node_type`, `canonical_name`, `status`; per link `id`, `source_node_id`, `target_node_id`, `link_type`, `link_type_label`, `is_temporal`, `is_in_effect`, `status`, `flags`. `src/features/graph/types.ts` (`GraphDeltaWire`, `GraphNodeWire`, `GraphLinkWire`).
- The node status values come from the back end's knowledge node status (`domain/knowledge-base/node-status`). `src/features/graph/types.ts` (`GraphNodeWireStatus`).
- The node type slug comes from the back end's open node-type catalog and may fall outside the ten known types. `src/features/graph/types.ts` (`GraphNodeWire.node_type`); `src/features/graph/lib/map.ts` (`mapNodeType`).
- The link text shown comes from the back end's catalog label for the link type (`rules/chat/graph-delta-link-label`). The temporal mark comes from the link type catalog (`rules/chat/graph-delta-link-temporal`). `src/features/graph/types.ts` (`link_type_label`, `is_temporal`).
- The graph view snapshot written and read back through the back end (`domain/chat/graph-view`) has the shape `version`, `nodes`, `links`, `positions`, `user_pinned`, `layout_algorithm`. `src/features/graph/state/graph-store.ts` (`GraphSnapshotV1`, `GraphSnapshotV2`).

## Outside the domain
- The re-exports of the feature's public surface, including components, copy constants and the API hooks that are defined outside the area — wiring. `src/features/graph/index.ts`.
- Zustand as a single module-level store, and building fresh Map/Set objects for change detection — framework. `src/features/graph/state/graph-store.ts`.
- The d3-force force names, `.stop()` with manual ticking, the shadow simulation objects, the ref used to read positions without a dependency, and the lint suppression — implementation. `src/features/graph/hooks/useForceLayout.ts`.
- Chained `setTimeout` instead of `setInterval`, the media-query string, and the SSR guards — implementation. `src/features/graph/hooks/useGraphReveal.ts`.
- The d3-hierarchy `hierarchy` and `tree` calls, and the FIFO head-index queue — implementation. `src/features/graph/lib/layout-tree.ts`, `src/features/graph/lib/layout-radial.ts`, `src/features/graph/lib/spanning-tree.ts`.
- React Flow's `Position` and `InternalNode` types, and the floating-edge clipping formula — framework geometry. `src/features/graph/lib/edge-params.ts`.
- No aria-label, control label or interface copy is defined in the area — none. All ten files.

## Observed and not decided here
- Links whose endpoints are not in the graph are handled two ways:
  - Adding a delta keeps every link: "`for (const link of delta.links) { nextLinks.set(link.id, link); }`" — `src/features/graph/state/graph-store.ts` (`addNodes`).
  - Replacing with a delta drops such a link: "`if (nextNodes.has(link.source) && nextNodes.has(link.target)) { nextLinks.set(link.id, link); }`" — `src/features/graph/state/graph-store.ts` (`replaceNodes`).
  - Both layouts leave such links out: "`.filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))`" — `src/features/graph/hooks/useForceLayout.ts` (`runForceLayout`); "`if (!srcSet || !tgtSet) continue;`" — `src/features/graph/lib/spanning-tree.ts` (`buildSpanningTree`).
- Two paths lead to the `error` status, and only one can carry a message:
  - "`errorMessage: status === "error" ? errorMessage : undefined`" — `src/features/graph/state/graph-store.ts` (`setStatus`).
  - "`set({ status: "error", receivedDeltaThisTurn: false })`" — `src/features/graph/state/graph-store.ts` (`settleTurn`).
