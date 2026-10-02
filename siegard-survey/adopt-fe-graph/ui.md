---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  - src/features/graph/components/GraphCanvas/GraphCanvas.types.ts
  - src/features/graph/components/GraphCanvas/index.ts
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.types.ts
  - src/features/graph/components/GraphEdgeAdapter/index.ts
  - src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx
  - src/features/graph/components/GraphEmptyState/GraphEmptyState.types.ts
  - src/features/graph/components/GraphEmptyState/index.ts
  - src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
  - src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.types.ts
  - src/features/graph/components/GraphNodeAdapter/index.ts
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
  - src/features/graph/components/GraphSpace/GraphSpace.types.ts
  - src/features/graph/components/GraphSpace/index.ts
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
  - src/features/graph/components/GraphStatusOverlay/index.ts
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.types.ts
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
  - src/features/graph/components/NodeDetailPanel/index.ts
read_outside_area:
  - "src/features/graph/types.ts, to read the full value list of the graph pane status (GraphStatus) that GraphSpace branches on, which is empty, loading, revealing, ready, error"
  - "src/features/graph/state/graph-store.ts, to read the value list of the layout algorithm (GraphLayoutAlgorithm) that GraphCanvas labels, which is force, tree, radial"
  - "src/components/ds/StateBadge/StateBadge.types.ts, to read the value list of the confidence state (ConfidenceState) that GraphEdgeAdapter switches on"
  - "src/features/graph/hooks/useGraphReveal.ts, to read the value of DEFAULT_REVEAL_STAGGER_MS that GraphSpace defaults to, which is 90"
---

## Facts
### Graph pane (graph view, `domain/chat/graph-view`)
- The graph pane is a region whose accessible name is "Grafo de conhecimento". `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`<section role="region" aria-label>`).
- The graph pane takes the nodes, the links, the graph status and an optional error message from its caller. It never writes them. `src/features/graph/components/GraphSpace/GraphSpace.types.ts` (`GraphSpaceProps`).
- The pane shows only the empty state, with no canvas, when the status is `empty` and there are no nodes. When the status is `empty` and nodes are present, it shows the canvas. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`showEmptyState`).
- The empty state shows "A memória aparecerá aqui conforme você conversa." It has no spinner and no action. `src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx` (`GRAPH_EMPTY_STATE_COPY`).
- When the status is `loading`, a loading overlay sits over the canvas. When it is `error`, an error overlay sits over it. When it is `revealing` or `ready`, there is no overlay. Nodes already shown stay on the canvas under the overlay. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`overlayVariant`, `GraphCanvasRegion`).
- The pane is marked busy only while the status is `loading` or `revealing`. In every other status the busy flag is absent. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`isBusy`, `aria-busy`).
- The canvas instance stays mounted through `loading`, `revealing`, `ready` and `error`, so pan and zoom survive status changes. It is unmounted only for the empty state. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`<ReactFlowProvider>` outside the status branch).
- The pause between revealing one node and the next defaults to the reveal hook's own default stagger. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`revealStaggerMs = DEFAULT_REVEAL_STAGGER_MS`).
- The pane wires node dragging to the graph store's `setNodePosition`, the reorganize control to `resetLayout`, and the algorithm picker to `layoutAlgorithm`/`setLayoutAlgorithm`. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`GraphCanvasRegion`).
- The pane passes a node click to its caller's `onNodeSelect` as the node id. That is all it does with the click (see `rules/chat-workspace/selecting-a-node-sends-nothing`, `rules/chat-workspace/clicking-a-node-swaps-the-pane-to-its-detail`). `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`canvasNodeSelectProp`), `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`handleNodeClick`).

### Graph status overlay
- The loading overlay shows a spinner and "Buscando na memória…". `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (`GRAPH_STATUS_LOADING_COPY`).
- The error overlay shows the error message the pane received. If there is none, it shows "Não foi possível carregar o grafo agora." `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (`GRAPH_STATUS_ERROR_DEFAULT_COPY`, `message`).
- The error overlay offers no action, so there is no retry. `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (render, no control).
- The overlay is a polite status live region. Its card is named "Erro do grafo" in the error variant and "Carregando grafo" in the loading variant. `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (`role="status"`, `aria-live="polite"`, `aria-label`).
- The overlay message is clamped to at most 2 lines. `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (`line-clamp-2`).
- The overlay does not capture the pointer, so pan, zoom and click still reach the canvas under it. `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (`pointer-events-none`).

### Graph canvas
- When a reveal set is supplied, only revealed nodes are shown, and a link is shown only when both its endpoints are revealed. With no reveal set, every node and link is shown. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`visibleNodes`, `visibleLinks`).
- A node with no computed position is placed at (0, 0). `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`toRfNodes`).
- The default viewport is x 0, y 0, zoom 0.75. On every change the canvas fits its content with 0.1 padding. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`DEFAULT_VIEWPORT`, `fitView`, `fitViewOptions`).
- Nodes can be dragged only when a position-commit handler is wired. Every position change during a drag is committed with the node id and coordinate, not only the final drop. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`handleNodesChange`, `nodesDraggable`).
- The owner cannot draw links on the canvas. Elements are selectable. Panning by drag and zooming by scroll are on. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`nodesConnectable={false}`, `elementsSelectable`, `panOnDrag`, `zoomOnScroll`).
- `focusNode` centres the viewport on the middle of the node at zoom 1 over 300 ms. If the node is not on the canvas it does nothing. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`useImperativeHandle` `focusNode`).
- `fitView` fits all rendered nodes over 300 ms with 0.1 padding. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`fitView`).
- `recenter` resets the viewport to x 0, y 0, zoom 0.75 over 300 ms. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`recenter`).
- The layout controls appear top-right only when at least one node is visible and at least one control is wired. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`visibleNodes.length > 0 && (...)`).
- The layout algorithm picker (`domain/chat/graph-layout`) appears only when both the current algorithm and its setter are supplied. It offers force, tree, radial in that order, labelled "Força", "Árvore", "Radial". Its accessible name is "Algoritmo de layout do grafo". `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`LAYOUT_ALGORITHM_ORDER`, `LAYOUT_ALGORITHM_LABELS`, `<Select aria-label>`).
- The reorganize control appears when a reset handler is supplied and calls that handler. Its accessible name is "Reorganizar o layout do grafo". `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`<Button aria-label onClick={onResetLayout}>`).

### Graph node (knowledge node, `domain/knowledge-base/knowledge-node`)
- A graph node is drawn with its node type, label, optional confidence state, optional subtitle and its selected flag. `src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx` (`<DsGraphNode>`).
- A node's link endpoints cannot be connected, are hidden from assistive technology, and are invisible and inert. `src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx` (`<Handle isConnectable={false} aria-hidden>`, `HANDLE_CLASSES`).

### Graph link (knowledge link, `domain/knowledge-base/knowledge-link`)
- A link's label shows the link type's display label from the catalogue, never the slug. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`data.linkTypeLabel`).
- A link's colour follows its link type slug, for 13 known slugs. An unknown slug takes the colour of `related_to`. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`LINK_STROKE_CLASS`, `FALLBACK_STROKE_CLASS`).
- A confidence state of `uncertain`, `disputed` or `superseded` replaces the link-type colour. `accepted`, `low-confidence` and no state keep it. The state is checked before the link type. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`stateStrokeClass`, `strokeColorClass`).
- A link is dashed ("4 4") when its state is `uncertain` or it is not temporal. Otherwise it is solid (see `rules/chat/graph-delta-link-temporal`). `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`isDashed`, `strokeDasharray`).
- A link and its label are dimmed to 40% opacity when the link is marked not in effect or its state is `superseded`. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`isDimmed`, `opacity-40`).
- A link is hidden from assistive technology. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`aria-hidden="true"`).
- A link is not drawn while it has no data or while either endpoint node is unmeasured. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`if (!data)`, `if (!params)`).

### Node detail panel (node read, `domain/knowledge-base/graph-read`)
- The panel reads the node's detail by node id. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`useNodeDetail(nodeId)`).
- The panel is a complementary region named "Detalhes do nó: <label>". The label is the loaded canonical name, else the label it was given on click, else "carregando" (see `rules/chat-workspace/node-detail-receives-the-clicked-label`). `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`resolvedLabel`, `aria-label`).
- The panel checks pending first, then failure, then data present. With no data and no failure it shows the loading view. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`if (query.isPending) … else if (query.isError) … else if (query.data !== undefined) … else`).
- While loading, the header shows the label given on click, or nothing. The body shows a spinner and the polite live text "Carregando detalhes…". `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`LoadingView`, `NODE_DETAIL_COPY.loading`).
- The close button's accessible name is "Fechar detalhes do nó". It takes focus when the panel mounts and again whenever the node id changes. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`PanelHeader` `aria-label`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`useEffect … [nodeId]`).
- Escape anywhere in the panel closes it. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`onKeyDown`).
- A failed node read is announced as an alert. A retry is offered only for the generic failure, and it reads the node again. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`ErrorView` `role="alert"`, `showRetry`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`onRetry` → `query.refetch()`).
- To classify a node read failure, a non-object error is generic. Otherwise `RESOURCE_NOT_FOUND` is checked first, then `BUSINESS_NODE_DELETED`, and anything else is generic. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`classifyError`).
- On success, the header shows the canonical name, the node type (`domain/knowledge-base/node-type`) and the node's state badge. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx` (`PanelHeader title={data.canonicalName}`, `data.nodeType`, `StateBadge state={data.badgeState}`).
- Aliases (`domain/knowledge-base/node-alias`) are listed in the order received, in a list named "Aliases". An alias of kind `canonical` is marked "(canônico)". With no aliases the panel shows "Nenhum alias adicional.". `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx` (`data.aliases.map`, `alias.kind === "canonical"`, `NODE_DETAIL_COPY.noAliases`).
- Attributes (`domain/knowledge-base/node-attribute`) are listed in the order received, in a table of attribute, value and state. With no attributes the panel shows "Nenhum atributo registrado.". `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx` (`data.attributes.map`, `NODE_DETAIL_COPY.noAttributes`).
- An attribute row shows the key, the value, and an icon-only state badge. When at least one validity bound is known it also shows "<from> → <to>", with "—" for a missing bound. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`NodeAttributeRow`).
- An attribute with no provenance list is treated as having none. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`attr.provenance ?? []`).
- The inline provenance disclosure (`domain/knowledge-base/provenance`) appears only when the attribute has at least one provenance entry. Its summary reads "Proveniência (N entrada)" when N is 1 and "Proveniência (N entradas)" otherwise. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`hasInlineProvenance`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts` (`attributeProvenanceSummary`).
- Each inline provenance entry shows the fragment text. It also shows the confidence label, source type and received-at label, each only when present. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`InlineProvenance`).
- Every attribute has a "Ver origem completa" disclosure. Its provenance is read (kind `attributes`, attribute id) only while the disclosure is open. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`LazyOrigin`, `useProvenance("attributes", attributeId, open)`).

### Curation from the node detail panel
- The curation target is derived in this order. A node whose status is `needs_review` targets the entity-match queue item keyed by the node id. Otherwise the first attribute, in listed order, whose effective status is `uncertain` or `disputed` targets the disputed item keyed by that attribute's id. Otherwise there is no target. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts` (`deriveCurationTarget`).
- The "Curar" control appears only when a curation target exists. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx` (`curationTarget !== null`).
- "Curar" opens the curation drawer with the target kind, the item id and the node's canonical name as the item label. Opening it does not change the address (see `rules/curation-workspace/drawer-shows-the-callers-label`). `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`<CurationDrawer kind itemId itemLabel>`, local `drawerOpen`).
- When the drawer closes, focus returns to the "Curar" control on the next animation frame. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`handleDrawerOpenChange`).

### Relationships section (traversal, `domain/knowledge-base/traversal-request`)
- The section reads the node's relationships by node id. It is named "Relações" and is marked busy while the read is pending. `src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx` (`useNodeRelationships(nodeId)`, `aria-label`, `aria-busy`).
- The section checks pending first, then failure, then no data or zero links, then the list. `src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx` (`if/else` chain).
- While pending, the section shows the polite live text "Carregando relações…". With no links it shows "Nenhuma relação encontrada.". `src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx` (`relationshipsLoading`, `relationshipsEmpty`).
- Any failed relationships read is announced as an alert reading "Não foi possível carregar as relações.". A retry that reads again is always offered, and no error code is examined. `src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx` (`query.isError` branch).
- Relationship rows are listed in the order received. `src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx` (`query.data.links.map`).
- A relationship row shows, in order: a direction arrow (hidden from assistive technology), the link type label, the neighbour's name, the confidence label and an icon-only status badge. `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`NodeRelationshipRow`).
- Screen readers hear "direção: destino" for an `outgoing` link and "direção: origem" for any other direction (`domain/knowledge-base/traversal-direction`). `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`directionSr`).
- The row's badge comes from the link's effective status (`domain/knowledge-base/effective-status`), with the assertion status fixed to `accepted`. `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`mapAttributeStatusToBadge(link.effectiveStatus, "accepted")`).
- When at least one validity bound is known, the row shows "<from> → <to>", with "—" for a missing bound. `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`validFromLabel`/`validToLabel`).
- The inline link provenance disclosure appears only when the link has at least one provenance entry. Its summary reads "Proveniência do link (N entrada)" when N is 1 and "Proveniência do link (N entradas)" otherwise. `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`LinkInlineProvenance`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts` (`linkProvenanceSummary`).
- Every relationship row has a "Ver origem completa" disclosure. Its provenance is read (kind `links`, link id) only while the disclosure is open. `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`LazyLinkOrigin`, `useProvenance("links", linkId, open)`).

### Full origin (provenance chain to fragment, chunk and source)
- The origin body checks pending first, then failure, then no data or zero fragments, then the list. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`NodeProvenanceChain`).
- While pending, the body is marked busy and shows the polite live text "Carregando origem…". `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`isPending` branch).
- To classify an origin read failure, a non-object error is `unknown`. Otherwise `RESOURCE_NOT_FOUND` is checked first, then `BUSINESS_RAW_INFORMATION_DELETED`, then any code starting with `SYSTEM_`, and anything else is `unknown`. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`classifyProvenanceError`).
- A failed origin read is announced as an alert. A retry that reads again is offered for every variant except a deleted source. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`showRetry = variant !== "deleted"`).
- A successful origin read with no fragments shows "Origem não encontrada.". `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`data.fragments.length === 0`).
- Each fragment (`domain/knowledge-base/information-fragment`) shows its confidence label, its status (`domain/knowledge-base/fragment-status`) and its text, followed by its chunks. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`data.fragments.map`).
- Each chunk (`domain/knowledge-base/raw-chunk`) shows "chunk #<index>", its offset range and its excerpt (see `rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt`). `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`ChunkDetails`).
- Each chunk also shows its source (`domain/knowledge-base/raw-information`) as "Tipo:" source type and "Recebido em:" received-at. "Título:" appears only when there is a title, and "Data do documento:" only when there is a document date. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`ChunkDetails` `<dl>`).
- When the source's original input is a string other than `[REDACTED]`, a disclosure "Texto original do operador" shows it verbatim with whitespace kept. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`originalInput !== REDACTED_SENTINEL`).
- When the original input is exactly `[REDACTED]`, the chunk shows "Texto original redigido." with the accessible name "Texto original redigido por conformidade.", and never the sentinel. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`REDACTED_SENTINEL`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts` (`originalInputRedacted`, `originalInputRedactedAria`).
- When the original input is null or absent, nothing is shown for it. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`typeof originalInput === "string"`).

## Answers
- Graph pane — status `error` with an error message → the overlay shows that message, no retry. `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (`message`).
- Graph pane — status `error` with no message → "Não foi possível carregar o grafo agora.", no retry. `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx` (`GRAPH_STATUS_ERROR_DEFAULT_COPY`).
- Node detail read — failure with code `RESOURCE_NOT_FOUND` → `RESOURCE_NOT_FOUND` ("Nó não encontrado.", alert, no retry). `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`classifyError`, `ErrorView`).
- Node detail read — failure with code `BUSINESS_NODE_DELETED` → `BUSINESS_NODE_DELETED` ("Este nó foi removido por conformidade.", alert, no retry). `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`classifyError`, `ErrorView`).
- Node detail read — any other code, or a non-object error → generic ("Não foi possível carregar os detalhes. Tente novamente.", alert, retry "Tentar novamente"). `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`classifyError`, `showRetry`).
- Relationships read — any failure → "Não foi possível carregar as relações." (alert, retry "Tentar novamente"). `src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx` (`query.isError`).
- Origin read — failure with code `RESOURCE_NOT_FOUND` → `RESOURCE_NOT_FOUND` ("Origem não encontrada.", alert, retry). `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`classifyProvenanceError`, `message`).
- Origin read — failure with code `BUSINESS_RAW_INFORMATION_DELETED` → `BUSINESS_RAW_INFORMATION_DELETED` ("Documento original removido por conformidade.", alert, no retry). `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`classifyProvenanceError`, `showRetry`).
- Origin read — failure with a code starting `SYSTEM_` → generic ("Não foi possível carregar a origem.", alert, retry). `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`classifyProvenanceError`).
- Origin read — any other code, or a non-object error → `unknown` ("Não foi possível carregar a origem.", alert, retry). `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`classifyProvenanceError`).

## Vocabularies
- Graph pane status: `empty`, `loading`, `revealing`, `ready`, `error`. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`showEmptyState`, `overlayVariant`, `isBusy`), `src/features/graph/components/GraphSpace/GraphSpace.types.ts` (`status: GraphStatus`).
- Graph overlay variant: `loading`, `error`. `src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts` (`GraphStatusOverlayVariant`).
- Graph layout algorithm, with its labels: `force` "Força", `tree` "Árvore", `radial` "Radial". `src/features/graph/components/GraphCanvas/GraphCanvas.tsx` (`LAYOUT_ALGORITHM_ORDER`, `LAYOUT_ALGORITHM_LABELS`).
- Link type slugs with their own colour: `participates_in`, `member_of`, `holds_role`, `responsible_for`, `reports_to`, `part_of`, `located_in`, `organizes`, `belongs_to_category`, `related_to`, `concerns`, `delivered_to`, `sponsors`. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`LINK_STROKE_CLASS`).
- Confidence state: `accepted`, `uncertain`, `low-confidence`, `disputed`, `superseded`. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx` (`stateStrokeClass`).
- Node detail failure variant: `not-found`, `deleted`, `generic`. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`ErrorVariant`).
- Origin failure variant: `not-found`, `deleted`, `generic`, `unknown`. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`ProvenanceErrorVariant`).
- Curation target kind derived by the panel: `entity_match`, `disputed`. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts` (`deriveCurationTarget`).
- Provenance read kind: `attributes`, `links`. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`useProvenance("attributes", …)`), `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`useProvenance("links", …)`).
- Relationship direction, with its screen-reader text: `outgoing` "direção: destino", and any other value "direção: origem". `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`directionSr`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts` (`directionOutgoingSr`, `directionIncomingSr`).

## Upstream artifacts
- The error codes read from a failed node read: `RESOURCE_NOT_FOUND`, `BUSINESS_NODE_DELETED`. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` (`classifyError`).
- The error codes read from a failed origin read: `RESOURCE_NOT_FOUND`, `BUSINESS_RAW_INFORMATION_DELETED`, and the `SYSTEM_` family. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`classifyProvenanceError`).
- The `[REDACTED]` value the back end puts in a source's original input after a compliance deletion (`domain/knowledge-base/compliance-deletion`). `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`REDACTED_SENTINEL`).
- The node detail fields read: id, canonical name, node type, badge state, node status (`needs_review` is examined), aliases (id, alias, kind `canonical`), and attributes. The attribute fields are id, key, value, validity labels, state, in-effect flag, effective status (`uncertain`/`disputed` examined) and provenance entries. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx` (`NodeDetailView`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts` (`data.status`, `attr.effectiveStatus`), `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`NodeAttributeView`).
- The traversal link fields read: id, direction, direction arrow, direction label, neighbour name, confidence label, effective status, validity labels and provenance entries. `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (`TraversalLinkView`).
- The provenance entry fields read: fragment id, fragment text, confidence label, source type and received-at label. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx` (`ProvenanceEntryView`).
- The origin response fields read: fragments (id, confidence label, status, text) and their chunks (id, chunk index, offset range label, excerpt). Each chunk's source supplies source type, received-at label, title, document date label and original input. `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` (`ProvenanceResponseView`).
- The curation feature's drawer, opened with `open`, `onOpenChange`, `kind`, `itemId` and `itemLabel`, and its selected-item kind (`domain/curation-workspace/selected-item`). `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx` (`CurationDrawer`), `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts` (`SelectedItemKind`).
- The graph store's `setNodePosition`, `resetLayout`, `layoutAlgorithm` and `setLayoutAlgorithm`, plus the force-layout positions and the reveal set. `src/features/graph/components/GraphSpace/GraphSpace.tsx` (`useGraphStore`, `useForceLayout`, `useGraphReveal`).
- The badge mapping from link effective status `mapAttributeStatusToBadge`, owned by the graph API transforms. `src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx` (import from `../../api/_transforms`).

## Outside the domain
- React Flow wiring: `nodeTypes`/`edgeTypes` registration, controlled-mode props, the provider placement seam, `proOptions.hideAttribution`, and the `as unknown` data casts. Framework. `src/features/graph/components/GraphCanvas/GraphCanvas.tsx`.
- React Flow index-signature type aliases (`GraphNodeDataRF`, `GraphLinkDataRF`, `GraphNode`, `GraphEdge`). Typing. `src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.types.ts`, `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.types.ts`.
- Floating-edge geometry (`getEdgeParams`, `getBezierPath`, label transform) and the label not intercepting the pointer. Rendering. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx`.
- Stroke colour classes, the thin/2/thick stroke widths on hover and selection, and handle styling (top target, bottom source). Surface. `src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx`, `src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx`.
- Tailwind classes, tokens, icons (`Shuffle`, `Loader2`, `X`, `AlertTriangle`, `Network`, `Stethoscope`), glass surface level and accent, and z-index utility. Surface. All component files.
- Control labels and headings: "Reorganizar", "Curar", "Tentar novamente", "Ver origem completa", "Aliases", "Atributos", "Relações", and the "Atributo"/"Valor"/"Estado" column labels. Surface per P1. `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts`, `src/features/graph/components/GraphCanvas/GraphCanvas.tsx`.
- `COLSPAN = 3`, the disclosure row spanning the three attribute columns. Layout. `src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx`.
- `data-testid`, `data-status`, `data-variant`, `data-direction`, `data-in-effect` and `data-curate-kind` attributes. Test hooks. All component files.
- Per-component `index.ts` re-exports. Packaging. All `index.ts` files of the area.
- Comments and docstrings citing spec sections, TC/AC/REQ ids and plan documents. Text, not evidence. All files.

## Observed and not decided here
- On a failed node read, the header title and the body disagree for two of the three variants. The header always reads "Nó não encontrado." (`title={NODE_DETAIL_COPY.errorNotFound}`, `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` `ErrorView`). The body reads "Este nó foi removido por conformidade." for `deleted` and "Não foi possível carregar os detalhes. Tente novamente." for `generic` (`message`, same construct).
- `RESOURCE_NOT_FOUND` is final in one place and retryable in another. On the node read it offers no retry (`const showRetry = variant === "generic"`, `src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx` `ErrorView`). On the origin read it offers a retry (`const showRetry = variant !== "deleted"`, `src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx` `NodeProvenanceChain`).
