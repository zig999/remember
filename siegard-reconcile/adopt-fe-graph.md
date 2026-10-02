---
contract_version: siegard-reconcile/8
title: Adoption of the frontend graph context
summary: The graph feature of the frontend is adopted as it stands and did not change; the owner states
  the source is the running system, and this reconciliation asks whether the specification written from
  its survey holds what each file carries.
target: frontend
files:
- path: src/features/graph/api/_request.ts
  change: Builds the authorization header of the graph reads from the access token in the auth store.
- path: src/features/graph/api/_transforms.ts
  change: Maps the node detail answer to the panel's views, with badges, date labels, confidence labels
    and attribute ordering.
- path: src/features/graph/api/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/api/keys.ts
  change: Declares the query keys of the node, relationships, provenance and graph view reads.
- path: src/features/graph/api/mapWireToGraphDelta.ts
  change: Maps a graph delta from the wire to the nodes and links the pane draws, leaving out nodes and
    links it cannot show.
- path: src/features/graph/api/node-detail.types.ts
  change: Declares the wire and view shapes of the node detail read.
- path: src/features/graph/api/provenance.transforms.ts
  change: Maps the full provenance answer to its fragment, chunk and source views.
- path: src/features/graph/api/provenance.types.ts
  change: Declares the wire and view shapes of the full provenance read.
- path: src/features/graph/api/traversal.transforms.ts
  change: Maps the traversal answer to the relationship views of a node.
- path: src/features/graph/api/traversal.types.ts
  change: Declares the wire and view shapes of the relationships read.
- path: src/features/graph/api/use-graph-persistence.ts
  change: Restores and saves the graph view of the active conversation.
- path: src/features/graph/api/useNodeDetail.ts
  change: Reads a node's detail by its id.
- path: src/features/graph/api/useNodeRelationships.ts
  change: Reads a node's relationships at depth one in both directions.
- path: src/features/graph/api/useProvenance.ts
  change: Reads the full provenance of a link or an attribute when the caller enables it.
- path: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  change: Draws the visible nodes and links, wires dragging and the layout controls, and reports the clicked
    node.
- path: src/features/graph/components/GraphCanvas/GraphCanvas.types.ts
  change: Declares the props of GraphCanvas.
- path: src/features/graph/components/GraphCanvas/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  change: Draws one link with its colour, dash, dimming and label.
- path: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.types.ts
  change: Declares the props of GraphEdgeAdapter.
- path: src/features/graph/components/GraphEdgeAdapter/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx
  change: Shows the empty state of the graph pane.
- path: src/features/graph/components/GraphEmptyState/GraphEmptyState.types.ts
  change: Declares the props of GraphEmptyState.
- path: src/features/graph/components/GraphEmptyState/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
  change: Draws one node with its type, label, state and subtitle.
- path: src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.types.ts
  change: Declares the props of GraphNodeAdapter.
- path: src/features/graph/components/GraphNodeAdapter/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/components/GraphSpace/GraphSpace.tsx
  change: Hosts the graph pane with its empty state, canvas and status overlay.
- path: src/features/graph/components/GraphSpace/GraphSpace.types.ts
  change: Declares the props and the handle of the graph pane.
- path: src/features/graph/components/GraphSpace/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
  change: Shows the loading or error overlay over the canvas.
- path: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
  change: Declares the props of the status overlay.
- path: src/features/graph/components/GraphStatusOverlay/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  change: Shows one attribute of a node with its inline provenance and full origin.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  change: Declares the texts of the node detail panel.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts
  change: Derives the curation target of a node.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  change: Shows the loading and failure views and the header of the node detail panel.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx
  change: Shows a loaded node with its aliases, attributes and relationships.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  change: Hosts the node detail panel, its reading, keyboard and curation drawer.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.types.ts
  change: Declares the props of NodeDetailPanel.
- path: src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  change: Shows the full origin of an item as fragments, chunks and sources.
- path: src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
  change: Shows one relationship of a node with its provenance.
- path: src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
  change: Shows the relationships section of the node detail panel.
- path: src/features/graph/components/NodeDetailPanel/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/hooks/useForceLayout.ts
  change: Places the nodes of the pane with the chosen layout algorithm.
- path: src/features/graph/hooks/useGraphReveal.ts
  change: Reveals the queued nodes one at a time or all at once.
- path: src/features/graph/index.ts
  change: Re-exports the public surface of its directory.
- path: src/features/graph/lib/edge-params.ts
  change: Computes where a link meets the borders of its two nodes.
- path: src/features/graph/lib/layout-radial.ts
  change: Lays out the spanning tree in rings around its root.
- path: src/features/graph/lib/layout-tree.ts
  change: Lays out the spanning tree from left to right.
- path: src/features/graph/lib/map.ts
  change: Maps node types, states and link texts from the wire to the pane.
- path: src/features/graph/lib/spanning-tree.ts
  change: Builds the spanning tree the tree and radial layouts share.
- path: src/features/graph/state/graph-store.ts
  change: Holds the graph pane's nodes, links, positions, status and layout.
- path: src/features/graph/types.ts
  change: Declares the shapes of the graph delta, the pane's nodes and links and its status.
nodes:
- node: constraints/every-operation-requires-owner-authentication
  conforms: true
  how: "src/features/graph/api/_request.ts: held at authHeader(), lines 23-26. It reads the token from\
    \ the auth store at call time and attaches it as a bearer Authorization header. — const token = useAuthStore.getState().accessToken;\n\
    \  return token !== null ? { Authorization: `Bearer ${token}` } : {};"
  encoded_at:
  - src/features/graph/api/_request.ts
- node: contracts/graph-explorer/bff-graph-view
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the GET in restoreSnapshot (lines 72-75)
    and the PUT in the debounce timer (lines 139-145) — `/api/v1/conversations/${encodeURIComponent(conversationId)}/graph`,

    { method: "GET", headers: authHeader() },

    ...

    method: "PUT",

    headers: { "Content-Type": "application/json", ...authHeader() },

    body: JSON.stringify(snapshot),'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: contracts/graph-explorer/bff-node-reads
  conforms: true
  how: "src/features/graph/api/node-detail.types.ts: held at NodeDetailWire, NodeSummaryWire, NodeAliasWire\
    \ and AttributeWire, lines 54-104. They declare the read-node answer as node, aliases and attributes.\
    \ The traverse and provenance answers are declared in other files of the binding. — export interface\
    \ NodeDetailWire {\n  readonly node: NodeSummaryWire;\n  readonly aliases: ReadonlyArray<NodeAliasWire>;\n\
    \  readonly attributes: ReadonlyArray<AttributeWire>;\n}\nsrc/features/graph/api/provenance.types.ts:\
    \ held at the wire interfaces `ProvenanceResponseWire`, `ProvenanceFragmentWire`, `ProvenanceChunkWire`\
    \ and `ProvenanceRawInformationWire`, lines 25-59, which declare the shape the provenance reads are\
    \ read as. The URLs are not built in this file, only listed in a comment. — export interface ProvenanceResponseWire\
    \ {\n  readonly fragments: ReadonlyArray<ProvenanceFragmentWire>;\n}\nsrc/features/graph/api/traversal.types.ts:\
    \ held at the `TraversalResultWire` and `TraversalLinkWire` interfaces (lines 26-51), which declare\
    \ the traverse answer's shape — export interface TraversalResultWire {\n  readonly starting_node_id:\
    \ string;\n  readonly nodes: ReadonlyArray<NodeSummaryWire>;\n  readonly links: ReadonlyArray<TraversalLinkWire>;\n\
    }\n... readonly link_inverse_name: string; readonly effective_status: AttributeWireEffectiveStatus;\
    \ readonly confidence: number;\nsrc/features/graph/api/useNodeDetail.ts: held at `queryFn` of useNodeDetail,\
    \ lines 55-62. This covers the read-node operation only; traverse and the provenance reads are in\
    \ other files. — const wire = await http<NodeDetailWire>(\n  `/api/v1/nodes/${encodeURIComponent(id\
    \ as string)}`,\n  { method: \"GET\", headers: authHeader() },\n);\nreturn toNodeDetail(wire);\nsrc/features/graph/api/useNodeRelationships.ts:\
    \ held at the queryFn of useNodeRelationships (lines 35-41) — const wire = await http<TraversalResultWire>(\n\
    \  `/api/v1/nodes/${encodeURIComponent(id as string)}/traverse?depth=1&direction=both`,\n  { method:\
    \ \"GET\", headers: authHeader() },\n);\nreturn toTraversalResult(wire);\nsrc/features/graph/api/useProvenance.ts:\
    \ held at The `queryFn` of `useProvenance` (lines 38-44): the GET request for the link and attribute\
    \ provenance paths, with the id URL-encoded. — const wire = await http<ProvenanceResponseWire>(\n\
    \  `/api/v1/provenance/${kind}/${encodeURIComponent(id)}`,\n  { method: \"GET\", headers: authHeader()\
    \ },\n);\nreturn toProvenanceResponse(wire);"
  encoded_at:
  - src/features/graph/api/node-detail.types.ts
  - src/features/graph/api/provenance.types.ts
  - src/features/graph/api/traversal.types.ts
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
- node: contracts/graph-explorer/graph-screen
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the exported `NodeAttributeRow`,
    which renders one attribute of the node detail as a table row. The contract''s other attribute outcomes
    ("Nenhum atributo registrado.", the loading and failure answers) are not in this file. — export const
    NodeAttributeRow: FC<NodeAttributeRowProps> = ({ attr }) => {

    ...

    <td className="p-xs align-top">{attr.key}</td>

    src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at LoadingView (lines
    83-106) for "Carregando detalhes…" with a spinner. ErrorView (lines 116-169) for the three failure
    messages and the retry action. The aria-label on the close button at line 60 for "Fechar detalhes
    do nó". The strings come from NODE_DETAIL_COPY. The ErrorView header title departs from the contract''s
    wording (see the finding). — <Loader2 className="size-5 shrink-0 animate-spin text-foreground" aria-hidden="true"
    /> <span aria-live="polite" className="text-xs text-foreground">{NODE_DETAIL_COPY.loading}</span>;
    aria-label={NODE_DETAIL_COPY.close}; <div ... role="alert" data-testid="node-detail-error" data-variant={variant}>

    src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx: held at the SuccessView
    body, lines 39-147. It renders the header with name, type and state badge, the "Curar" action, the
    aliases section, the attributes section and `<NodeRelationshipsSection nodeId={data.id} />`. — <PanelHeader
    title={data.canonicalName} ... /> ... <section className="mt-md"> <h3 ...>{NODE_DETAIL_COPY.aliasesHeading}</h3>
    ... <NodeRelationshipsSection nodeId={data.id} />

    The close button, the region name "Detalhes do nó: <label>", the loading and failure views and the
    relationships and origin texts sit in other files. The exact copy strings come from NODE_DETAIL_COPY,
    which is not in this file set. This file emits no wording that differs from the node.

    src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the show-origin operation
    is held across the three return branches of NodeProvenanceChain (pending, isError and body, lines
    184-294). The other operations belong to other files. — if (isPending) {

    if (isError) {

    if (data === undefined || data.fragments.length === 0) {

    <article key={frag.id} ...>

    src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at the NodeRelationshipRow
    JSX, lines 124-177. It covers the show-relationships accepted answer: arrow, link type, neighbour,
    confidence and status badge per row. The section name "Relações" and the loading, empty and retry
    texts are not in this file. — <li ... data-testid="node-detail-relationship-row" data-direction={link.direction}>
    ... {link.directionArrow} ... {link.directionLabel} ... {link.neighborName} ... {link.confidenceLabel}
    ... <StateBadge state={badgeState} size="sm" iconOnly />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: domain/chat/graph-delta
  conforms: true
  how: "src/features/graph/types.ts: held at the GraphDeltaWire interface, lines 147-151, and the GraphDelta\
    \ interface, lines 82-88 — export interface GraphDeltaWire {\n  readonly source_tool: string;\n  readonly\
    \ nodes: readonly GraphNodeWire[];\n  readonly links: readonly GraphLinkWire[];\n}"
  encoded_at:
  - src/features/graph/types.ts
- node: domain/chat/graph-delta-link
  conforms: true
  how: 'src/features/graph/types.ts: held at the GraphLinkWire interface, lines 122-144 — readonly link_type:
    string;

    readonly link_type_label?: string;

    readonly is_temporal: boolean;

    readonly is_in_effect?: boolean;

    readonly status?: string;

    readonly flags?: readonly GraphLinkWireFlag[];'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/chat/graph-delta-node
  conforms: true
  how: 'src/features/graph/types.ts: held at the GraphNodeWire interface, lines 111-119 — readonly node_type:
    string;

    readonly canonical_name: string;

    readonly status: GraphNodeWireStatus;'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/chat/graph-layout
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the `layout_algorithm` member of version
    2 of the GraphViewSnapshot type, line 45 — readonly layout_algorithm: "force" | "tree" | "radial";

    src/features/graph/state/graph-store.ts: held at the `GraphLayoutAlgorithm` type, line 57 — export
    type GraphLayoutAlgorithm = "force" | "tree" | "radial";'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
  - src/features/graph/state/graph-store.ts
- node: domain/graph-explorer/graph-link-view
  conforms: true
  how: 'src/features/graph/types.ts: held at the GraphLinkData interface, lines 52-78 — readonly id: string;

    readonly source: string;

    readonly target: string;

    readonly label: string;

    readonly linkTypeLabel: string;

    readonly isTemporal: boolean;

    readonly inEffect?: boolean;

    readonly state?: ConfidenceState;'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/graph-explorer/graph-node-view
  conforms: true
  how: 'src/features/graph/types.ts: held at the GraphNodeData interface, lines 35-49 — readonly id: string;

    readonly type: GraphNodeType;

    readonly label: string;

    readonly state?: ConfidenceState;

    readonly subtitle?: string;'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/graph-explorer/graph-pane
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the GraphViewSnapshot type (lines 31-46)
    declares nodes, links, positions, user_pinned and layout_algorithm. The remaining pane attributes
    (status, reveal queue and the rest) are declared in the store, not this file. — readonly nodes: unknown[];

    readonly links: unknown[];

    readonly positions: Record<string, { x: number; y: number }>;

    readonly user_pinned: string[];'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: domain/graph-explorer/graph-pane-status
  conforms: true
  how: 'src/features/graph/types.ts: held at the GraphStatus type, line 93 — export type GraphStatus =
    "empty" | "loading" | "revealing" | "ready" | "error";'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/graph-explorer/graph-snapshot-version
  conforms: true
  how: "src/features/graph/api/use-graph-persistence.ts: held at the `version` discriminants of the GraphViewSnapshot\
    \ union, lines 33 and 40 — readonly version: 1;\n...\nreadonly version: 2;\nsrc/features/graph/state/graph-store.ts:\
    \ held at the `version` literals of the `GraphSnapshotV1` and `GraphSnapshotV2` interfaces, lines\
    \ 205-222 — export interface GraphSnapshotV1 {\n  version: 1;\nexport interface GraphSnapshotV2 {\n\
    \  version: 2;"
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
  - src/features/graph/state/graph-store.ts
- node: domain/graph-explorer/node-detail-failure
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at line 15, the
    ErrorVariant type — export type ErrorVariant = "not-found" | "deleted" | "generic";'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
- node: domain/graph-explorer/origin-failure
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the exported type\
    \ ProvenanceErrorVariant, lines 31-35 — export type ProvenanceErrorVariant =\n  | \"not-found\"\n\
    \  | \"deleted\"\n  | \"generic\"\n  | \"unknown\";"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: domain/graph-explorer/turn-end
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at the `settleTurn` signature, line 176 — settleTurn:
    (frame: "done" | "error") => void;'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: domain/knowledge-base/alias-kind
  conforms: true
  how: 'src/features/graph/api/node-detail.types.ts: held at the kind field of NodeAliasWire, line 57
    — readonly kind: "canonical" | "alias";'
  encoded_at:
  - src/features/graph/api/node-detail.types.ts
- node: domain/knowledge-base/assertion-flag
  conforms: true
  how: 'src/features/graph/types.ts: held at the GraphLinkWireFlag type, line 108 — export type GraphLinkWireFlag
    = "uncertain" | "disputed" | "low_confidence";'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/knowledge-base/assertion-status
  conforms: false
  how: "src/features/graph/api/node-detail.types.ts, lines 39-44, the exported type AttributeWireAssertionStatus:\
    \ export type AttributeWireAssertionStatus =\n  | \"proposed\"\n  | \"accepted\"\n  | \"uncertain\"\
    \n  | \"disputed\"\n  | \"superseded\";\nNode domain/knowledge-base/assertion-status holds the values:\
    \ active, uncertain, disputed, superseded, deleted. — The file declares the state of an attribute\
    \ with a vocabulary that differs from the node's. It adds proposed and accepted, which the node does\
    \ not hold, and leaves out active and deleted. Anyone who reads this type as the attribute's assertion\
    \ states reads states the business did not decide, and an attribute answered as active or deleted\
    \ has no place in the declared type.\nno file of the set holds this fact beside what was found against\
    \ it"
  observed_at:
  - src/features/graph/api/node-detail.types.ts
- node: domain/knowledge-base/effective-status
  conforms: false
  how: "src/features/graph/api/node-detail.types.ts, lines 47-51, the exported type AttributeWireEffectiveStatus:\
    \ export type AttributeWireEffectiveStatus =\n  | \"active\"\n  | \"inactive\"\n  | \"uncertain\"\n\
    \  | \"disputed\";\nNode domain/knowledge-base/effective-status holds the values: active, inactive,\
    \ uncertain, disputed, superseded, deleted. — The declared enumeration is narrower than the node's.\
    \ superseded and deleted are missing, so an attribute read with either effective status is outside\
    \ the type that NodeAttributeView.effectiveStatus carries to the panel. The panel's types state a\
    \ closed set smaller than the one the business decided.\nno file of the set holds this fact beside\
    \ what was found against it"
  observed_at:
  - src/features/graph/api/node-detail.types.ts
- node: domain/knowledge-base/node-status
  conforms: false
  how: 'src/features/graph/api/node-detail.types.ts, line 36, the exported type NodeWireStatus: export
    type NodeWireStatus = "active" | "needs_review" | "merged" | "deleted";

    Node domain/knowledge-base/node-status holds the values: active, needs-review, merged, deleted. —
    The node-status enumeration spells the second value with a hyphen, and this file''s declaration of
    the node''s states spells it with an underscore. A reader who goes to the node for the value finds
    a different spelling from the one the code compares against. Rules of the same context (node-badge-follows-the-node-status,
    node-state-follows-its-status-alone) also use needs_review, so the specification holds two spellings
    and nobody can tell which was decided.'
  observed_at:
  - src/features/graph/api/node-detail.types.ts
- node: domain/knowledge-base/value-type
  conforms: true
  how: 'src/features/graph/api/node-detail.types.ts: held at the value_type field of AttributeWire, line
    77 — readonly value_type: "text" | "number" | "date" | "bool";'
  encoded_at:
  - src/features/graph/api/node-detail.types.ts
- node: rules/chat/graph-delta-link-label
  conforms: true
  how: 'src/features/graph/types.ts: held at the link_type_label field of GraphLinkWire, line 133, which
    is only declared optional here; the catalog lookup that makes it present or absent runs in the backend
    and is outside this file — readonly link_type_label?: string;'
  encoded_at:
  - src/features/graph/types.ts
- node: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
  conforms: true
  how: "src/features/graph/api/use-graph-persistence.ts: held at handleStoreChange, lines 118-129, in\
    \ the order conversation, nodes, then skip. A further refusal after the wait is reported as a finding.\
    \ — if (!conversationId) return;\nconst { nodes } = useGraphStore.getState();\nif (nodes.size ===\
    \ 0) return;\nif (justHydrated.current) {\n  justHydrated.current = false;\n  return;\n}"
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-chunk-offset-window-is-shown-as-chars
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toChunkView, the offsetRangeLabel property
    (line 89) — offsetRangeLabel: `chars ${wire.offset_start}–${wire.offset_end}`,'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-chunk-shows-its-index-offsets-and-excerpt
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the ChunkDetails
    component, the index and offset spans and the excerpt blockquote, lines 93-105 — chunk #{chunkIndex}

    <span data-testid="node-provenance-offset">{offsetRangeLabel}</span>

    <blockquote ...>{excerpt}</blockquote>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-chunk-shows-its-source
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the dl in ChunkDetails,
    lines 106-127 — <dt className="font-medium">Tipo:</dt>

    <dt className="font-medium">Recebido em:</dt>

    {title !== null && (... <dt className="font-medium">Título:</dt>

    {documentDateLabel !== null && (... <dt className="font-medium">Data do documento:</dt>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-chunk-without-locator-has-an-empty-one
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toChunkView, the locator property (line
    91) — locator: wire.locator ?? {},'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-counter-change-places-every-node-again
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the effect in useForceLayout, lines 256-267
    — const isReset = prevNonceRef.current !== layoutNonce; ... const pinned = isReset ? new Map<string,
    GraphPosition>() : positionsRef.current;'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/a-delta-carries-its-source-tool-unchanged
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the return statement of mapWireToGraphDelta\
    \ (lines 132-136) — return {\n    sourceTool: input.sourceTool,\n    nodes: mappedNodes,\n    links:\
    \ mappedLinks,\n  };"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-delta-without-state-for-a-node-leaves-it-off
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the node loop (lines 80-97) — const state\
    \ = deriveNodeState(wireNode.status);\nif (state === undefined) {\n  continue;\n}\nconst node: GraphNodeData\
    \ = {\n  id: wireNode.id,\n  type: mapNodeType(wireNode.node_type),\n  label: wireNode.canonical_name,\n\
    \  state,\n};"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-failed-node-read-is-an-alert
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at ErrorView, lines\
    \ 128-165: role=\"alert\" on the container and the retry button rendered only when showRetry is true\
    \ — const showRetry = variant === \"generic\"; ... role=\"alert\" ... {showRetry && ( <button type=\"\
    button\" onClick={onRetry} data-testid=\"node-detail-retry\"\nsrc/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx:\
    \ held at the `query.isError` branch of the body selection, lines 116-127. The alert role and the\
    \ rule that a retry is offered only for the generic failure are in ErrorView and classifyError, in\
    \ NodeDetailPanel.shell.tsx, which is outside this file set. — } else if (query.isError) {\n  const\
    \ variant = classifyError(query.error);\n  body = (\n    <ErrorView\n      variant={variant}\n   \
    \   closeRef={closeRef}\n      onClose={onClose}\n      onRetry={() => {\n        void query.refetch();\n\
    \      }}\n    />"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the `query.isError`
    branch, lines 48-73 — role="alert" ... <span>{NODE_DETAIL_COPY.relationshipsError}</span> ... onClick={()
    => { void query.refetch(); }} ... {NODE_DETAIL_COPY.relationshipsRetry}. The branch tests `query.isError`
    only and reads no error code. The strings resolve in NodeDetailPanel.copy.ts to "Não foi possível
    carregar as relações." and "Tentar novamente".'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/a-fragment-shows-confidence-status-text-and-chunks
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the article rendered\
    \ per fragment, lines 259-291 — {frag.confidenceLabel}\n<span>{frag.status}</span>\n{frag.text}\n\
    {frag.chunks.map((chunk) => (\n  <ChunkDetails"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-fragment-status-is-free-text
  conforms: true
  how: 'src/features/graph/api/provenance.types.ts: held at the `status` field of `ProvenanceFragmentWire`
    and `ProvenanceFragmentView`, lines 53 and 101. — readonly status: string;'
  encoded_at:
  - src/features/graph/api/provenance.types.ts
- node: rules/graph-explorer/a-gap-change-applies-from-the-next-reveal
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at the staggerRef write at line 202 and the delay
    read inside the effect at line 232 — staggerRef.current = staggerMs;

    ...

    const delay = Math.max(0, staggerRef.current);'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/a-gap-of-zero-or-less-is-zero
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at the delay computation at line 232 and the
    setTimeout at line 260 (asynchronous even at 0) — const delay = Math.max(0, staggerRef.current);

    ...

    timerRef.current = setTimeout(tick, delay);'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/a-graph-change-keeps-every-positioned-node-where-it-is
  conforms: true
  how: "src/features/graph/hooks/useForceLayout.ts: held at the SimNode construction in runForceLayout,\
    \ lines 159-167, with the pinned set passed from the effect, line 267 — if (pinned !== undefined)\
    \ { return { id, x: pinned.x, y: pinned.y, fx: pinned.x, fy: pinned.y }; } return { id };\nsrc/features/graph/lib/layout-radial.ts:\
    \ held at The pinned branch of the output loop in runRadialLayout (lines 140-144). — const pinned\
    \ = pinnedPositions.get(id);\nif (pinned !== undefined) {\n  out.set(id, { x: pinned.x, y: pinned.y\
    \ });\n  continue;\n}\nsrc/features/graph/lib/layout-tree.ts: held at the pinned branch inside the\
    \ descendants loop of runTreeLayout, lines 93-97 — const pinned = pinnedPositions.get(id);\n    if\
    \ (pinned !== undefined) {\n      out.set(id, { x: pinned.x, y: pinned.y });\n      continue;\n  \
    \  }"
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
  - src/features/graph/lib/layout-radial.ts
  - src/features/graph/lib/layout-tree.ts
- node: rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the `link` literal in the link loop (lines\
    \ 113-128) — label: wireLink.link_type,\nlinkTypeLabel: mapLinkTypeLabel(wireLink.link_type, wireLink.link_type_label),\n\
    isTemporal: wireLink.is_temporal,\nstate: deriveLinkState(wireLink.status, wireLink.flags),\n...(wireLink.is_in_effect\
    \ === undefined\n  ? {}\n  : { inEffect: wireLink.is_in_effect }),"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-late-restore-answer-is-discarded
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the `cancelled` flag in the restore effect,
    lines 67, 76 and 111 — if (cancelled) return;

    ...

    return () => { cancelled = true; };'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-link-is-coloured-by-its-type
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at `LINK_STROKE_CLASS`
    and `FALLBACK_STROKE_CLASS`, lines 58-75, and the lookup at line 148 — participates_in: "stroke-link-participates-in",
    ... sponsors: "stroke-link-sponsors",

    const FALLBACK_STROKE_CLASS = "stroke-link-related-to";

    const linkClass = LINK_STROKE_CLASS[data.label] ?? FALLBACK_STROKE_CLASS;

    The 13 slugs match the thirteen of rules/knowledge-base/catalog-link-types.'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-dashed-unless-temporal-and-sure
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at `isDashed` and `strokeDasharray`,
    lines 153-159 — const isUncertain = data.state === "uncertain";

    const isDashed = isUncertain || !data.isTemporal;

    const strokeDasharray = isDashed ? "4 4" : "0";'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-dimmed-when-out-of-effect
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at `isDimmed`, line
    162, applied to the edge at line 187 and to the label at line 215 — const isDimmed = data.inEffect
    === false || data.state === "superseded";

    isDimmed && "opacity-40",'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-hidden-from-assistive-technology
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at the `aria-hidden`
    prop of `BaseEdge`, line 177 — aria-hidden="true"

    The label `div` rendered through `EdgeLabelRenderer` carries no aria-hidden.'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-kept-only-with-visible-ends
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the endpoint checks in the link loop (lines\
    \ 105-111) — const sourceVisible =\n  visibleIds.has(wireLink.source_node_id) ||\n  useGraphStore.getState().nodes.has(wireLink.source_node_id);\n\
    ...\nif (!sourceVisible || !targetVisible) continue;"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node
  conforms: true
  how: "src/features/graph/api/traversal.transforms.ts: held at toLinkView, the `isOutgoing` and `direction`\
    \ constants, lines 46-47 — const isOutgoing = wire.source_node_id === currentNodeId;\n  const direction:\
    \ LinkDirection = isOutgoing ? \"outgoing\" : \"incoming\";"
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/a-link-meets-each-node-at-its-border
  conforms: true
  how: 'src/features/graph/lib/edge-params.ts: held at getNodeIntersection (lines 56-91, centre-to-centre
    clip at the node''s rectangle) and getEdgePosition (lines 103-123, side selection) — if (px <= nx
    + 1) return Position.Left;

    if (px >= nx + w - 1) return Position.Right;

    if (py <= ny + 1) return Position.Top;

    if (py >= ny + h - 1) return Position.Bottom;

    return Position.Bottom;'
  encoded_at:
  - src/features/graph/lib/edge-params.ts
- node: rules/graph-explorer/a-link-needs-both-measured-nodes-to-be-drawn
  conforms: true
  how: 'src/features/graph/lib/edge-params.ts: held at the guards in getEdgeParams, lines 135-140 — if
    (!source || !target) return null;

    ...

    if (sw === 0 || sh === 0 || tw === 0 || th === 0) return null;'
  encoded_at:
  - src/features/graph/lib/edge-params.ts
- node: rules/graph-explorer/a-link-needs-data-and-measured-nodes
  conforms: true
  how: "src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at the two early returns,\
    \ lines 125-135 — if (!data) {\n  return null;\n}\nconst params = getEdgeParams(sourceNode, targetNode);\n\
    if (!params) {\n  return null;\n}"
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-shows-the-catalog-label
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at the content of the
    label `div`, line 218 — {data.linkTypeLabel}

    The slug `data.label` is used only as the key of `LINK_STROKE_CLASS`.'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-linkless-node-is-still-placed
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the result collection loop in runForceLayout,
    lines 203-205 — for (const n of simNodes) { out.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 }); }'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/a-node-click-only-reports-the-node-id
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at handleNodeClick, lines 240-246\
    \ — (_event: ReactMouseEvent, node: Node) => {\n      if (!onNodeSelect) return;\n      onNodeSelect(node.id);\n\
    \    }\nsrc/features/graph/components/GraphSpace/GraphSpace.tsx: held at GraphSpace forwards `onNodeSelect`\
    \ unchanged (`canvasNodeSelectProp`, spread onto GraphCanvas), lines 141-142 and 160 — const canvasNodeSelectProp\
    \ =\n    onNodeSelect !== undefined ? { onNodeSelect } : {};\n...\n{...canvasNodeSelectProp}"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/a-node-failure-is-classified-by-its-code
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at classifyError,
    lines 19-25 — if (err === null || typeof err !== "object") return "generic"; const code = (err as
    { code?: unknown }).code; if (code === "RESOURCE_NOT_FOUND") return "not-found"; if (code === "BUSINESS_NODE_DELETED")
    return "deleted"; return "generic";'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
- node: rules/graph-explorer/a-node-failure-reads-its-wording
  conforms: false
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx, ErrorView, the PanelHeader\
    \ call at lines 131-135: <PanelHeader\n  title={NODE_DETAIL_COPY.errorNotFound}\n  closeRef={closeRef}\n\
    \  onClose={onClose}\n/> — The header title is always \"Nó não encontrado.\", whatever the variant.\
    \ A node whose read failed with BUSINESS_NODE_DELETED or with a generic failure therefore shows the\
    \ not-found message in the header, above an alert that carries the deleted or generic message. The\
    \ owner is told two different things at once. No node says the failure header shows any text, so the\
    \ not-found header title is a fact the code applies that the specification does not hold."
  observed_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
- node: rules/graph-explorer/a-node-is-drawn-with-its-type-label-state-and-selection
  conforms: true
  how: "src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx: held at the `<DsGraphNode\
    \ ... />` element in GraphNodeAdapter (lines 66-72), with `stateProp` and `subtitleProp` built at\
    \ lines 54 and 56 — <DsGraphNode\n  type={data.type}\n  label={data.label}\n  {...stateProp}\n  {...subtitleProp}\n\
    \  selected={selected ?? false}\n/>"
  encoded_at:
  - src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
- node: rules/graph-explorer/a-node-s-link-endpoints-are-inert
  conforms: true
  how: "src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx: held at the two `<Handle>`\
    \ elements (lines 59-65 and 73-79) and the HANDLE_CLASSES constant (line 45) — <Handle\n  type=\"\
    target\"\n  position={Position.Top}\n  isConnectable={false}\n  aria-hidden=\"true\"\n  className={HANDLE_CLASSES}\n\
    />\nconst HANDLE_CLASSES =\n  \"!size-2 !min-w-0 !rounded-pill !border !border-border-glass !bg-surface-glass-panel\
    \ opacity-0 pointer-events-none\";"
  encoded_at:
  - src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
- node: rules/graph-explorer/a-node-without-position-sits-at-the-origin
  conforms: true
  how: 'src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at toRfNodes, line 108 — position:
    pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 },'
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/a-pending-save-is-dropped-on-leaving
  conforms: true
  how: "src/features/graph/api/use-graph-persistence.ts: held at the cleanup of the subscribe effect,\
    \ lines 167-173, which re-runs when conversationId changes (handleStoreChange depends on it) and when\
    \ the screen unmounts — return () => {\n  unsubscribe();\n  if (debounceTimer.current !== null) {\n\
    \    clearTimeout(debounceTimer.current);\n    debounceTimer.current = null;\n  }\n};"
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-provenance-answer-is-a-list-of-fragments
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toProvenanceResponse, toFragmentView
    and toChunkView (lines 83-113) — return { fragments: wire.fragments.map(toFragmentView) };

    ... id: wire.id, text: wire.text, confidence: wire.confidence, ... status: wire.status, chunks: wire.chunks.map(toChunkView),

    ... id: wire.id, chunkIndex: wire.chunk_index, offsetStart: wire.offset_start, offsetEnd: wire.offset_end,
    ... excerpt: wire.excerpt, locator: wire.locator ?? {}, rawInformation: toRawInformationView(wire.raw_information),

    src/features/graph/api/provenance.types.ts: held at `ProvenanceFragmentWire` and `ProvenanceChunkWire`,
    lines 39-55, with their view counterparts at lines 83-103. — readonly id: string;

    readonly text: string;

    readonly confidence: number;

    readonly status: string;

    readonly chunks: ReadonlyArray<ProvenanceChunkWire>;

    readonly chunk_index: number;

    readonly offset_start: number;

    readonly offset_end: number;

    readonly excerpt: string;

    readonly locator?: Readonly<Record<string, unknown>>;

    readonly raw_information: ProvenanceRawInformationWire;'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
  - src/features/graph/api/provenance.types.ts
- node: rules/graph-explorer/a-read-needs-a-non-empty-identity
  conforms: true
  how: 'src/features/graph/api/useNodeDetail.ts: held at the `enabled` option, line 63. This covers the
    node read. The provenance part of the rule has no counterpart in this file. — enabled: typeof id ===
    "string" && id.length > 0,

    src/features/graph/api/useNodeRelationships.ts: held at the `enabled` option, line 42 — enabled: typeof
    id === "string" && id.length > 0,

    src/features/graph/api/useProvenance.ts: held at The `enabled` option of the `useQuery` call, line
    45. — enabled: enabled && id.length > 0,'
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
- node: rules/graph-explorer/a-read-stays-fresh-five-minutes
  conforms: true
  how: 'src/features/graph/api/useNodeDetail.ts: held at `STALE_MS` and the two options at lines 64-65
    — const STALE_MS = 5 * 60_000;

    staleTime: STALE_MS,

    refetchOnWindowFocus: false,

    src/features/graph/api/useNodeRelationships.ts: held at `STALE_MS` (line 28) and the `staleTime` and
    `refetchOnWindowFocus` options, lines 43-44 — const STALE_MS = 5 * 60_000;

    staleTime: STALE_MS,

    refetchOnWindowFocus: false,

    src/features/graph/api/useProvenance.ts: held at The `STALE_MS` constant at line 29 and the `staleTime`
    and `refetchOnWindowFocus` options at lines 46-47. — const STALE_MS = 5 * 60_000;

    staleTime: STALE_MS,

    refetchOnWindowFocus: false,'
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
- node: rules/graph-explorer/a-redacted-original-input-is-never-shown
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts: held at originalInputRedacted\
    \ and originalInputRedactedAria in NODE_DETAIL_COPY, lines 55 and 57. The sentinel test itself sits\
    \ in NodeProvenanceChain.tsx, outside this file. — originalInputRedacted: \"Texto original redigido.\"\
    ,\noriginalInputRedactedAria: \"Texto original redigido por conformidade.\",\nsrc/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx:\
    \ held at the muted-indicator branch and the exclusion on the disclosure branch, lines 129-154. The\
    \ wording is read from NODE_DETAIL_COPY, which is declared in NodeDetailPanel.copy.ts. — originalInput\
    \ !== REDACTED_SENTINEL && (\n{originalInput === REDACTED_SENTINEL && (\n  <p ... aria-label={NODE_DETAIL_COPY.originalInputRedactedAria}\
    \ ...>\n    {NODE_DETAIL_COPY.originalInputRedacted}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-relationship-badge-follows-its-effective-status
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at line 116, the badgeState
    assignment — const badgeState = mapAttributeStatusToBadge(link.effectiveStatus, "accepted");'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/a-relationship-row-shows-arrow-type-neighbour-confidence-and-status
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at the first flex
    div of the row, lines 130-162, in the order the node states — <span ... aria-hidden="true" ...>{link.directionArrow}</span>

    <span className="sr-only">{directionSr}</span>

    <span ...>{link.directionLabel}</span>

    ...{link.neighborName}...{link.confidenceLabel}

    <StateBadge state={badgeState} size="sm" iconOnly />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/a-relationship-row-shows-its-validity
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at lines 163-169,\
    \ the validity div — {(link.validFromLabel !== null || link.validToLabel !== null) && (\n  <div className=\"\
    text-xs text-muted-foreground\">\n    {link.validFromLabel ?? \"—\"}\n    {\" → \"}\n    {link.validToLabel\
    \ ?? \"—\"}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/a-relationship-shows-fixed-fields
  conforms: true
  how: "src/features/graph/api/traversal.transforms.ts: held at the object returned by toLinkView, lines\
    \ 55-75. It carries linkType, effectiveStatus, isInEffect, confidence, confidenceLabel, validFromLabel,\
    \ validToLabel, flags and provenance. It carries none of status, is_current, recorded_at, superseded_at,\
    \ hop or score. — linkType: wire.link_type,\n    effectiveStatus: wire.effective_status,\n    isInEffect:\
    \ wire.is_in_effect,\n    confidence: wire.confidence,\n    confidenceLabel: formatConfidenceLabel(wire.confidence)\
    \ ?? \"0%\",\n    validFromLabel: formatDateLabel(wire.valid_from),\n    validToLabel: formatDateLabel(wire.valid_to),\n\
    \    flags: wire.flags ?? [],\n    provenance: (wire.provenance ?? []).map(toProvenanceEntryView),\n\
    src/features/graph/api/traversal.types.ts: held at the `TraversalLinkView` interface (lines 60-82),\
    \ which declares the surface fields. It omits `status`, `is_current`, `recorded_at`, `superseded_at`,\
    \ `hop` and `score`, which `TraversalLinkWire` carries. — readonly linkType: string; ... readonly\
    \ effectiveStatus: AttributeWireEffectiveStatus;\nreadonly isInEffect: boolean; ... readonly confidenceLabel:\
    \ string; readonly confidence: number;\nreadonly validFromLabel: string | null; readonly validToLabel:\
    \ string | null;\nreadonly flags: ReadonlyArray<string>; readonly provenance: ReadonlyArray<ProvenanceEntryView>;"
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
  - src/features/graph/api/traversal.types.ts
- node: rules/graph-explorer/a-save-follows-a-graph-change
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the subscribe callback condition, lines
    159-165 — state.nodes !== prevState.nodes ||

    state.positions !== prevState.positions ||

    state.layoutNonce !== prevState.layoutNonce'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-save-is-a-put-of-json
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the http call in the timer callback,
    lines 139-145 — method: "PUT",

    headers: { "Content-Type": "application/json", ...authHeader() },

    body: JSON.stringify(snapshot),'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-save-waits-800-milliseconds
  conforms: true
  how: "src/features/graph/api/use-graph-persistence.ts: held at the setTimeout in handleStoreChange,\
    \ lines 131-150. The previous timer is cleared on each change, so each change restarts the wait. —\
    \ if (debounceTimer.current !== null) {\n  clearTimeout(debounceTimer.current);\n}\ndebounceTimer.current\
    \ = setTimeout(() => {\n...\n}, 800);"
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-saved-view-holds-positions-and-pins
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the GraphViewSnapshot type, lines 31-46.
    The body is built by the store''s getSnapshot, which is not in this file. — readonly version: 2;

    readonly nodes: unknown[];

    readonly links: unknown[];

    readonly positions: Record<string, { x: number; y: number }>;

    readonly user_pinned: string[];

    readonly layout_algorithm: "force" | "tree" | "radial";'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-snapshot-carries-its-version-and-fields
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the `GraphSnapshotV1` and `GraphSnapshotV2` interfaces\
    \ and the `getSnapshot` return, lines 205-222 and 479-486 — return {\n  version: 2 as const,\n  nodes:\
    \ Array.from(nodes.values()),\n  links: Array.from(links.values()),\n  positions: posObj,\n  user_pinned:\
    \ Array.from(userPinned),\n  layout_algorithm: layoutAlgorithm,\n};"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/a-source-date-time-is-short-pt-br
  conforms: true
  how: "src/features/graph/api/provenance.transforms.ts: held at RECEIVED_AT_DATETIME (lines 27-30) and\
    \ formatReceivedAtDateTime (lines 36-40) — const RECEIVED_AT_DATETIME = new Intl.DateTimeFormat(\"\
    pt-BR\", {\n  dateStyle: \"short\",\n  timeStyle: \"short\",\n});\n... if (Number.isNaN(dt.getTime()))\
    \ return iso;\nreturn RECEIVED_AT_DATETIME.format(dt);"
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-source-shows-its-id-type-dates-and-title
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toRawInformationView, the base object
    (lines 65-71) — id: wire.id,

    sourceType: wire.source_type,

    receivedAtLabel: formatReceivedAtDateTime(wire.received_at),

    title: readMetadataTitle(wire.metadata),

    documentDateLabel: readMetadataDocumentDate(wire.metadata),'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-successful-detail-shows-the-node
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx: held at the `trailing`
    and `title` props of PanelHeader, lines 40-53 — title={data.canonicalName} ... <span className="text-xs
    text-muted-foreground" data-testid="node-detail-type">{data.nodeType}</span> <span data-testid="node-detail-status"><StateBadge
    state={data.badgeState} size="sm" /></span>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx
- node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at DATE_FORMATTER and formatDateLabel, lines 107-139
    — `new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone:
    "UTC" })`, `if (date === null) return null;`, `if (parts.length !== 3) return date;`, `if (Number.isNaN(dt.getTime()))
    return date;`, `return DATE_FORMATTER.format(dt);`

    src/features/graph/api/provenance.transforms.ts: held at readMetadataDocumentDate (lines 52-60). It
    holds the guard and hands the day-month-year formatting to formatDateLabel, imported from ./_transforms.
    That function is in another file, which I did not read because it is outside the file set. — if (typeof
    d !== "string" || d.length === 0) return null;

    // `formatDateLabel` returns `null` for `null` input only — `d` is a string.

    return formatDateLabel(d);'
  encoded_at:
  - src/features/graph/api/_transforms.ts
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-weak-state-overrides-the-type-colour
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at `stateStrokeClass`
    and `strokeColorClass`, lines 90-103 and 147-149 — case "uncertain": return "stroke-state-uncertain";
    ... case "accepted": case "low-confidence": case undefined: return null;

    const strokeColorClass = stateClass ?? linkClass;'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/add-keeps-links-whose-nodes-are-missing
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at addNodes, the links loop, lines 288-290 — for\
    \ (const link of delta.links) {\n  nextLinks.set(link.id, link);\n}"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/add-marks-a-delta-received
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at the addNodes return, line 296 — receivedDeltaThisTurn:
    true,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/add-merges-by-identity
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at addNodes, lines 272-290 — const nextNodes = new
    Map(state.nodes);

    nextNodes.set(node.id, node);

    nextLinks.set(link.id, link);'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/add-queues-only-unseen-nodes
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at addNodes, line 282 — if (!state.revealedIds.has(node.id)\
    \ && !nextNodes.has(node.id)) {\n  nextRevealQueue.push(node.id);\n}"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/aliases-are-listed-as-received
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx: held at the aliases
    section, lines 81-108 — {data.aliases.length === 0 ? (<p ...>{NODE_DETAIL_COPY.noAliases}</p>) : (<ul
    aria-label={NODE_DETAIL_COPY.aliasesHeading} ...>{data.aliases.map((alias) => (<li key={alias.id}
    ...><span>{alias.alias}</span>{alias.kind === "canonical" && (<span ...>(canônico)</span>)}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx
- node: rules/graph-explorer/an-absent-original-input-shows-nothing
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the two guards
    at lines 129-130 and 146, neither of which matches null or undefined — {typeof originalInput === "string"
    &&

    {originalInput === REDACTED_SENTINEL && ('
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-attribute-hides-its-bookkeeping-fields
  conforms: true
  how: "src/features/graph/api/_transforms.ts: held at toAttributeView, lines 151-164 — `{ id: wire.id,\
    \ key: wire.attribute_key, value: wire.value, valueType: wire.value_type, effectiveStatus: wire.effective_status,\
    \ isInEffect: wire.is_in_effect, state: mapAttributeStatusToBadge(wire.effective_status, wire.status),\
    \ validFromLabel: ..., validToLabel: ..., provenance: ... }`, with no is_current, confidence or node_id\n\
    src/features/graph/api/node-detail.types.ts: held at the NodeAttributeView interface, lines 126-143\
    \ — export interface NodeAttributeView {\n  readonly id: string;\n  readonly key: string;\n  readonly\
    \ value: string;\n  readonly valueType: AttributeWire[\"value_type\"];\n  readonly effectiveStatus:\
    \ AttributeWireEffectiveStatus;\n  readonly isInEffect: boolean;\n  readonly state: ConfidenceState;\n\
    \  readonly validFromLabel: string | null;\n  readonly validToLabel: string | null;\n  readonly provenance:\
    \ ReadonlyArray<ProvenanceEntryView>;\n}\nThe view carries none of is_current, confidence or node_id."
  encoded_at:
  - src/features/graph/api/_transforms.ts
  - src/features/graph/api/node-detail.types.ts
- node: rules/graph-explorer/an-attribute-row-shows-key-value-state-and-validity
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the primary `<tr data-testid="node-detail-attribute-row">`
    in NodeAttributeRow, lines 128-147 — <td className="p-xs align-top">{attr.key}</td>

    ...

    <span>{attr.value}</span>

    {(attr.validFromLabel !== null || attr.validToLabel !== null) && (

    ...

    {attr.validFromLabel ?? "—"}

    {" → "}

    {attr.validToLabel ?? "—"}

    ...

    <StateBadge state={attr.state} size="sm" iconOnly />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
- node: rules/graph-explorer/an-attribute-without-provenance-has-an-empty-list
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at the provenance line of toAttributeView, line 162
    — provenance: (wire.provenance ?? []).map(toProvenanceEntryView),

    src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the first statement of
    NodeAttributeRow, line 124. The other home of this fact is the transform in `src/features/graph/api/_transforms.ts`,
    which this file''s comment names but which is outside the file set. — const provenance = attr.provenance
    ?? [];

    const hasInlineProvenance = provenance.length > 0;'
  encoded_at:
  - src/features/graph/api/_transforms.ts
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
- node: rules/graph-explorer/an-empty-graph-has-no-positions
  conforms: false
  how: 'src/features/graph/lib/layout-radial.ts, Lines 74-78, in `runRadialLayout`, the two early returns.:
    `if (nodeIds.length === 0) return out;`

    `if (rootSpan === null) return out;` — The "an empty graph has no positions" rule is implemented here
    a second time. The node is bound only to src/features/graph/hooks/useForceLayout.ts, so when it moves,
    `--check` never reaches this file and nobody knows which copy was decided.'
  observed_at:
  - src/features/graph/lib/layout-radial.ts
- node: rules/graph-explorer/an-inline-entry-hides-what-it-lacks
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at toProvenanceEntryView and formatConfidenceLabel,
    lines 175-225 — `typeof wire.confidence === "number" && Number.isFinite(wire.confidence) ? wire.confidence
    : null`, `rawInformationId: wire.raw_information_id ?? null`, `sourceType: wire.source_type ?? null`,
    `excerpt: wire.excerpt ?? null`, `if (!Number.isFinite(confidence)) return null;`'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/an-inline-entry-shows-its-date-only
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at RECEIVED_AT_FORMATTER and formatReceivedAtLabel,
    lines 184-205 — `new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric",
    })` with no timeZone, `if (iso === undefined || iso === null) return null;`, `if (Number.isNaN(dt.getTime()))
    return iso;`'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/an-origin-failure-is-an-alert-with-a-retry-unless-deleted
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the isError branch,
    lines 202-239 — const showRetry = variant !== "deleted";

    role="alert"

    onClick={onRetry}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-origin-failure-is-classified-by-its-code
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at classifyProvenanceError,
    lines 46-53 — if (err === null || typeof err !== "object") return "unknown";

    if (code === "RESOURCE_NOT_FOUND") return "not-found";

    if (code === "BUSINESS_RAW_INFORMATION_DELETED") return "deleted";

    if (typeof code === "string" && code.startsWith("SYSTEM_")) return "generic";

    return "unknown";'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-origin-failure-reads-its-wording
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the message selection\
    \ in the isError branch, lines 204-209. The strings are held in NodeDetailPanel.copy.ts, whose values\
    \ are \"Origem não encontrada.\", \"Documento original removido por conformidade.\" and \"Não foi\
    \ possível carregar a origem.\". — variant === \"deleted\"\n  ? NODE_DETAIL_COPY.originDeleted\n \
    \ : variant === \"not-found\"\n    ? NODE_DETAIL_COPY.originNotFound\n    : NODE_DETAIL_COPY.originError;"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-origin-without-fragments-says-not-found
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the empty-body\
    \ branch, lines 243-252 — if (data === undefined || data.fragments.length === 0) {\n  return (<p ...\
    \ data-testid=\"node-provenance-empty\">{NODE_DETAIL_COPY.originNotFound}</p>"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-original-input-is-shown-verbatim
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the details disclosure\
    \ in ChunkDetails, lines 129-145. The summary text is read from NODE_DETAIL_COPY.originalInputSummary,\
    \ which is \"Texto original do operador\". — <details ... data-testid=\"node-provenance-original-input\"\
    >\n  <summary ...>{NODE_DETAIL_COPY.originalInputSummary}</summary>\n  <p className=\"mt-xs whitespace-pre-wrap\"\
    \ ...>{originalInput}</p>"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-unformatted-confidence-shows-zero-percent
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toFragmentView, the confidenceLabel property
    (line 103) — confidenceLabel: formatConfidenceLabel(wire.confidence) ?? "0%",

    src/features/graph/api/traversal.transforms.ts: held at the confidenceLabel field of toLinkView, line
    70. The 0% fallback for fragment confidence is not in this file. — confidenceLabel: formatConfidenceLabel(wire.confidence)
    ?? "0%",'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/attribute-badge-follows-a-fixed-precedence
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at mapAttributeStatusToBadge, lines 85-97 — `if (effective
    === "disputed") return "disputed"; if (effective === "uncertain") return "uncertain"; if (effective
    === "inactive") return "superseded"; ... if (assertion === "superseded") return "superseded"; return
    "accepted";`'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/attributes-are-listed-as-received
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx: held at the attributes
    section, lines 111-144 — {data.attributes.length === 0 ? (<p ...>{NODE_DETAIL_COPY.noAttributes}</p>)
    : (<table ...><thead>...{NODE_DETAIL_COPY.attrColKey}...{NODE_DETAIL_COPY.attrColValue}...{NODE_DETAIL_COPY.attrColState}...</thead><tbody>{data.attributes.map((attr)
    => (<NodeAttributeRow key={attr.id} attr={attr} />))}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx
- node: rules/graph-explorer/attributes-in-effect-come-first-by-key
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at sortAttributes, lines 235-245 — `if (a.isInEffect
    !== b.isInEffect) { return a.isInEffect ? -1 : 1; } return a.key.localeCompare(b.key, "pt-BR", { sensitivity:
    "base" });` on a copy, `[...attrs].sort(...)`'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/choosing-a-layout-releases-the-pins
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at setLayoutAlgorithm, lines 400-416 — if (state.layoutAlgorithm\
    \ === algo) return {};\nreturn {\n  layoutAlgorithm: algo,\n  userPinned: new Set<string>(),\n  layoutNonce:\
    \ state.layoutNonce + 1,\n};"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/closing-the-drawer-returns-focus-to-curar
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at handleDrawerOpenChange,\
    \ lines 83-90, passed as `onOpenChange` of the CurationDrawer — function handleDrawerOpenChange(next:\
    \ boolean): void {\n  setDrawerOpen(next);\n  if (!next) {\n    requestAnimationFrame(() => {\n  \
    \    curateButtonRef.current?.focus();\n    });\n  }\n}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/confidence-is-a-rounded-percentage
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at formatConfidenceLabel, line 180 — return `${Math.round(confidence
    * 100)}%`;'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/curar-needs-a-target
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx: held at the conditional
    render of the button, lines 54-72 — {curationTarget !== null && (<button ref={curateButtonRef} type="button"
    onClick={onCurate} data-testid="node-detail-curate" ...>...{NODE_DETAIL_COPY.curate}</button>)}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.success.tsx
- node: rules/graph-explorer/curar-opens-the-drawer-for-the-target
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at the CurationDrawer\
    \ element, lines 175-185, and the `onCurate` wiring, line 136. The target itself comes from deriveCurationTarget\
    \ in another file. — <CurationDrawer\n  open={drawerOpen}\n  onOpenChange={handleDrawerOpenChange}\n\
    \  kind={curationTarget.kind}\n  itemId={curationTarget.itemId}\n  {...(query.data?.canonicalName\
    \ !== undefined\n    ? { itemLabel: query.data.canonicalName }\n    : {})}\n/>"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/curation-target-follows-the-node
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts: held at deriveCurationTarget,\
    \ lines 24-39 — if (data.status === \"needs_review\") {\n    return { kind: \"entity_match\", itemId:\
    \ data.id };\n  }\n  for (const attr of data.attributes) {\n    if (\n      attr.effectiveStatus ===\
    \ \"uncertain\" ||\n      attr.effectiveStatus === \"disputed\"\n    ) {\n      return { kind: \"\
    disputed\", itemId: attr.id };\n    }\n  }\n  return null;"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts
- node: rules/graph-explorer/direction-picks-the-link-wording
  conforms: true
  how: "src/features/graph/api/traversal.transforms.ts: held at the directionLabel and directionArrow\
    \ fields of toLinkView, lines 58 and 60 — directionLabel: isOutgoing ? wire.link_type : wire.link_inverse_name,\n\
    \    direction,\n    directionArrow: isOutgoing ? \"→\" : \"←\","
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/empty-reveal-queue-ends-revealing
  conforms: true
  how: "src/features/graph/hooks/useGraphReveal.ts: held at the empty-queue branch of the effect, lines\
    \ 212-217. The same transition is in tick (lines 253-257) and in drainAll (lines 136-145 and 154-156).\
    \ Only `revealing` is moved to `ready`. — if (revealQueue.length === 0) {\n  if (useGraphStore.getState().status\
    \ === \"revealing\") {\n    useGraphStore.getState().setStatus(\"ready\");\n  }\n  return;\n}"
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/empty-state-tells-where-memory-will-appear
  conforms: true
  how: "src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx: held at the exported constant\
    \ GRAPH_EMPTY_STATE_COPY (lines 31-32), rendered as the only content of the `<p>` in GraphEmptyState\
    \ (lines 48-55) — export const GRAPH_EMPTY_STATE_COPY =\n  \"A memória aparecerá aqui conforme você\
    \ conversa.\";\n...\n<p\n  className=\"text-xs text-muted-foreground text-center max-w-md\"\n>\n \
    \ {GRAPH_EMPTY_STATE_COPY}\n</p>"
  encoded_at:
  - src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx
- node: rules/graph-explorer/empty-status-without-nodes-shows-only-the-empty-state
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at `showEmptyState` and the ternary\
    \ in GraphSpace, lines 190 and 219-237 — const showEmptyState = status === \"empty\" && nodes.length\
    \ === 0;\n...\n{showEmptyState ? (\n  <GraphEmptyState />\n) : (\n  <ReactFlowProvider>"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/ending-a-turn-resets-the-delta-mark
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at all four branches of settleTurn, lines 440-466
    — set({ status: "ready", errorMessage: undefined, receivedDeltaThisTurn: false });

    set({ receivedDeltaThisTurn: false });

    set({ status: "error", receivedDeltaThisTurn: false });'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
  conforms: true
  how: "src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at the message constant,\
    \ lines 53-55, with GRAPH_STATUS_ERROR_DEFAULT_COPY at lines 43-44. The JSX has no button or other\
    \ control. — const message = isError\n    ? (errorMessage ?? GRAPH_STATUS_ERROR_DEFAULT_COPY)\n  \
    \  : GRAPH_STATUS_LOADING_COPY;\nexport const GRAPH_STATUS_ERROR_DEFAULT_COPY =\n  \"Não foi possível\
    \ carregar o grafo agora.\";"
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/escape-closes-the-panel
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at onKeyDown, lines 97-102,\
    \ attached to the panel root through `onKeyDown={onKeyDown}` — function onKeyDown(event: KeyboardEvent<HTMLElement>):\
    \ void {\n  if (event.key === \"Escape\") {\n    event.preventDefault();\n    onClose();\n  }\n}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/every-item-offers-its-full-origin
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the `LazyOrigin` component,
    rendered for every attribute at line 154. Its `open` state gates the read. — const [open, setOpen]
    = useState(false);

    const query = useProvenance("attributes", attributeId, open);

    ...

    {NODE_DETAIL_COPY.originSummary}

    ...

    <LazyOrigin attributeId={attr.id} />

    src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at LazyLinkOrigin, lines
    78-103, rendered for every row at line 174. The read is enabled only while the details element is
    open. The wording of the summary comes from NODE_DETAIL_COPY.originSummary in another file. — const
    [open, setOpen] = useState(false);

    const query = useProvenance("links", linkId, open);

    ... onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} ...

    <LazyLinkOrigin linkId={link.id} />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/fit-and-recenter-take-300-milliseconds
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the fitView and recenter functions\
    \ of the imperative handle, lines 220-229 — rfApi.fitView({ duration: 300, padding: 0.1 });\n...\n\
    rfApi.setViewport(\n          { x: DEFAULT_VIEWPORT.x, y: DEFAULT_VIEWPORT.y, zoom: DEFAULT_VIEWPORT.zoom\
    \ },\n          { duration: 300 },\n        );"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/focusing-a-node-centres-it-at-zoom-one
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the focusNode function of the\
    \ imperative handle, lines 205-219 — const node = rfApi.getNode(id);\n        if (!node) return;\n\
    ...\n        rfApi.setCenter(cx, cy, { zoom: 1, duration: 300 });"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/force-layout-keeps-nodes-270-apart
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the constants at lines 76-99 and the simulation
    construction at lines 181-195 — const NODE_FOOTPRINT = 270; const COLLIDE_RADIUS = NODE_FOOTPRINT
    / 2; const LINK_DISTANCE = NODE_FOOTPRINT; const CHARGE_STRENGTH = -300; const CENTER_X = 0; const
    CENTER_Y = 0; ... .force("collide", forceCollide<SimNode>(COLLIDE_RADIUS)) .force("center", forceCenter<SimNode>(CENTER_X,
    CENTER_Y))'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/force-layout-runs-a-hundred-silent-ticks
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at SIM_TICKS at line 71, the `.stop()` at line
    195 and the tick call at line 197 — const SIM_TICKS = 100; ... .stop(); simulation.tick(SIM_TICKS);'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/full-provenance-is-cached-by-kind-and-id
  conforms: true
  how: "src/features/graph/api/keys.ts: held at graphNodeKeys.provenance, lines 29-31 — provenance: (kind:\
    \ string, id: string) =>\n  [\"graph\", \"provenance\", kind, id] as const,"
  encoded_at:
  - src/features/graph/api/keys.ts
- node: rules/graph-explorer/graph-view-requests-carry-the-same-token-header-as-chat
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the import of authHeader from the chat
    feature and its use on both requests, lines 24, 74 and 143 — import { authHeader } from "@/features/chat/api/_request";

    ...

    headers: { "Content-Type": "application/json", ...authHeader() },'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/inline-entries-show-text-and-what-they-have
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the `entries.map`
    list items inside `InlineProvenance`, lines 43-74 — <p className="text-xs text-foreground">{p.fragmentText}</p>

    ...

    {p.confidenceLabel !== null && (

    ...

    {p.sourceType !== null && (

    ...

    {p.receivedAtLabel !== null && ('
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
- node: rules/graph-explorer/inline-provenance-needs-an-entry
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the `hasInlineProvenance\
    \ &&` gate at line 151 and the summary call at line 40. The wording \"Proveniência (n entrada(s))\"\
    \ itself is produced in `NODE_DETAIL_COPY.attributeProvenanceSummary`, which is another file and was\
    \ not opened. — {hasInlineProvenance && (\n  <InlineProvenance entries={provenance} />\n)}\n...\n\
    {NODE_DETAIL_COPY.attributeProvenanceSummary(entries.length)}\nsrc/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts:\
    \ held at the attributeProvenanceSummary and linkProvenanceSummary templates, lines 29-30 and 38-39.\
    \ They hold the wording and the singular/plural count. The \"only when at least one entry\" condition\
    \ is applied in the consuming rows, outside this file. — `Proveniência (${n} ${n === 1 ? \"entrada\"\
    \ : \"entradas\"})`\n`Proveniência do link (${n} ${n === 1 ? \"entrada\" : \"entradas\"})`\nsrc/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx:\
    \ held at the conditional render at lines 121-122 and 171-173. The summary wording (\"Proveniência\
    \ do link\" plus the count and entrada/entradas) is produced by NODE_DETAIL_COPY.linkProvenanceSummary\
    \ in another file, not here. — const hasInlineProvenance = provenance.length > 0;\n...\n{hasInlineProvenance\
    \ && (\n  <LinkInlineProvenance entries={provenance} />\n)}\n... {NODE_DETAIL_COPY.linkProvenanceSummary(entries.length)}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/layout-controls-need-nodes-and-a-handler
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the condition guarding the\
    \ Panel, lines 325-327 — {visibleNodes.length > 0 &&\n        (onResetLayout || (layoutAlgorithm &&\
    \ onLayoutAlgorithmChange)) && (\n          <Panel position=\"top-right\">"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/layout-defaults-to-force
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the dispatch switch in the effect, lines 284-295.
    The default value of the algorithm is held in graph-store.ts, outside this file. — case "force": default:
    next = runForceLayout(nodeIds, linkPairs, pinned); break;

    src/features/graph/state/graph-store.ts: held at makeInitialState, line 259, for the default. The
    fallback for an unrecognized algorithm is not in this file. setLayoutAlgorithm and hydrate pass the
    value through typed but unvalidated, so that half may sit in the layout dispatcher, which is outside
    this file set. — layoutAlgorithm: "force",'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/layout-reruns-on-graph-or-counter-change
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the effect''s dependency array, line 306 —
    }, [nodes, links, layoutNonce]);'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/link-state-follows-a-fixed-precedence
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at the if-chain in deriveLinkState, lines 137-155 — if (status
    === "superseded") { return "superseded"; } ... if (flags.includes("disputed")) { return "disputed";
    } if (flags.includes("low_confidence")) { return "low-confidence"; } if (flags.includes("uncertain"))
    { return "uncertain"; } ... return "accepted";'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/link-text-is-the-catalog-label-or-the-spaced-slug
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at the body of mapLinkTypeLabel, lines 182-191 — if (linkTypeLabel
    !== undefined && linkTypeLabel.trim().length > 0) { return linkTypeLabel; } return linkType.replace(/_/g,
    " ");'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/link-type-slug-is-kept-apart-from-its-text
  conforms: true
  how: 'src/features/graph/types.ts: held at the label and linkTypeLabel fields of GraphLinkData, lines
    63 and 70, which declare the slug and the text apart; the prohibition on showing the slug is applied
    outside this file — readonly label: string;

    readonly linkTypeLabel: string;'
  encoded_at:
  - src/features/graph/types.ts
- node: rules/graph-explorer/links-with-a-missing-endpoint-are-left-out-of-layouts
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the link filter in runForceLayout, lines 173-176.
    The tree and radial runners are in other files, and this file passes them `linkPairs` unfiltered.
    — const nodeIdSet = new Set(nodeIds); const simLinks: SimLink[] = linkPairs .filter((l) => nodeIdSet.has(l.source)
    && nodeIdSet.has(l.target))

    src/features/graph/lib/spanning-tree.ts: held at the guard `if (!srcSet || !tgtSet) continue;` in
    the link loop of buildSpanningTree, line 79 — const srcSet = adj.get(source);

    const tgtSet = adj.get(target);

    if (!srcSet || !tgtSet) continue;'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
  - src/features/graph/lib/spanning-tree.ts
- node: rules/graph-explorer/lists-keep-the-answered-order
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the two `for ... of` loops that append\
    \ to `mappedNodes` and `mappedLinks` (lines 80-97 and 100-130) — for (const wireNode of input.nodes)\
    \ {\n  ...\n  mappedNodes.push(node);\nfor (const wireLink of input.links) {\n  ...\n  mappedLinks.push(link);\n\
    src/features/graph/api/provenance.transforms.ts: held at toProvenanceResponse (line 112) and toFragmentView\
    \ (line 105), by mapping without sorting or filtering — return { fragments: wire.fragments.map(toFragmentView)\
    \ };\nchunks: wire.chunks.map(toChunkView),\nsrc/features/graph/api/traversal.transforms.ts: held\
    \ at toTraversalResult, line 85. The links are mapped one to one, and indexNodes does not reorder\
    \ the nodes. — links: wire.links.map((l) => toLinkView(l, wire.starting_node_id, nodesById)),"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
  - src/features/graph/api/provenance.transforms.ts
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/loading-and-error-overlay-the-canvas
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at `overlayVariant` and the conditional\
    \ `GraphStatusOverlay` rendered after `GraphCanvas` in GraphCanvasRegion, lines 130-131 and 151-165\
    \ — const overlayVariant =\n    status === \"loading\" ? \"loading\" : status === \"error\" ? \"error\"\
    \ : null;\n...\n<GraphCanvas nodes={nodes} links={links} ... />\n{overlayVariant !== null && (\n \
    \ <GraphStatusOverlay variant={overlayVariant} {...overlayErrorProp} />\n)}"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/loading-overlay-says-it-is-searching
  conforms: true
  how: "src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at GRAPH_STATUS_LOADING_COPY\
    \ at line 39, and the Loader2 branch of the JSX at lines 100-105 — export const GRAPH_STATUS_LOADING_COPY\
    \ = \"Buscando na memória…\";\n{!isError && (\n    <Loader2\n      className=\"size-4 shrink-0 animate-spin\
    \ text-foreground\""
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/merged-or-deleted-node-has-no-state-and-is-left-off
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at the merged, deleted and default branches of the switch
    in deriveNodeState, lines 108-116 — case "merged": case "deleted": return undefined; default: return
    undefined;'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/missing-flags-and-provenance-are-empty-lists
  conforms: true
  how: "src/features/graph/api/traversal.transforms.ts: held at the flags and provenance fields of toLinkView,\
    \ lines 73-74 — flags: wire.flags ?? [],\n    provenance: (wire.provenance ?? []).map(toProvenanceEntryView),"
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/moving-a-node-pins-it
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at setNodePosition, lines 379-391 — if (!state.nodes.has(id))
    return {};

    nextPositions.set(id, position);

    nextUserPinned.add(id);'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/node-badge-follows-the-node-status
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at mapNodeStatusToBadge, lines 49-63 — `case "active":
    return "accepted"; case "needs_review": return "uncertain"; case "merged": return "superseded"; case
    "deleted": return "superseded";`'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/node-detail-has-no-merged-into-by-default
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at toNodeDetail and toAliasView, lines 143-149 and
    256-257 — `mergedIntoNodeId: wire.node.merged_into_node_id ?? null,` and `{ id: wire.id, alias: wire.alias,
    kind: wire.kind }`'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/node-detail-reads-share-a-key-by-node
  conforms: true
  how: 'src/features/graph/api/keys.ts: held at graphNodeKeys.detail and graphNodeKeys.relationships,
    lines 24 and 27. The key is by node id. The relationships key sits under a separate prefix, so the
    detail key does not cover it. The placeholder id for the case with no node is not in this file, because
    detail only takes an id string. — detail: (id: string) => ["nodes", id] as const,

    relationships: (id: string) => ["graph", "node", id, "relationships"] as const,

    src/features/graph/api/useNodeDetail.ts: held at the `queryKey` line, 54, which keys the detail by
    node id with a placeholder when none. The separate relationships key is declared in keys.ts, not in
    this file. — queryKey: graphNodeKeys.detail(id ?? "__noop__"),

    src/features/graph/api/useNodeRelationships.ts: held at the queryKey line 34, which calls the relationships
    entry of graphNodeKeys with the placeholder id. The key factory itself, with its separate `["graph",
    "node", id, "relationships"]` shape, is declared in src/features/graph/api/keys.ts. — queryKey: graphNodeKeys.relationships(id
    ?? "__noop__"),'
  encoded_at:
  - src/features/graph/api/keys.ts
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
- node: rules/graph-explorer/node-state-follows-its-status-alone
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at the first two cases of the switch in deriveNodeState, lines
    103-107, with a signature that takes status only — export function deriveNodeState(status: GraphNodeWireStatus):
    ConfidenceState | undefined { switch (status) { case "active": return "accepted"; case "needs_review":
    return "uncertain";'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at mapNodeType together with KNOWN_NODE_TYPES and FALLBACK_NODE_TYPE,
    lines 45-81 — const normalized = wireType.trim().toLowerCase(); return KNOWN_NODE_TYPES.has(normalized
    as GraphNodeType) ? (normalized as GraphNodeType) : FALLBACK_NODE_TYPE;'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/nodes-drag-only-when-a-commit-is-wired
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the nodesDraggable prop, line\
    \ 311, and handleNodesChange, lines 260-273 — nodesDraggable={onNodePositionCommit !== undefined}\n\
    ...\nif (change.type === \"position\" && change.position) {\n          onNodePositionCommit(change.id,\
    \ {\n            x: change.position.x,\n            y: change.position.y,\n          });"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/only-a-version-2-view-restores-its-layout
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the layoutAlgorithm expression in hydrate, lines\
    \ 512-515 — snapshot.version === 2 && \"layout_algorithm\" in snapshot\n  ? snapshot.layout_algorithm\n\
    \  : \"force\";"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/only-revealed-nodes-are-shown
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the visibleNodes and visibleLinks\
    \ memos, lines 173-188 — revealedIds === undefined\n        ? nodes\n        : nodes.filter((n) =>\
    \ revealedIds.has(n.id)),\n...\n(l) => revealedIds.has(l.source) && revealedIds.has(l.target),"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/original-input-is-carried-only-when-answered
  conforms: true
  how: "src/features/graph/api/provenance.transforms.ts: held at toRawInformationView, the conditional\
    \ spread (lines 77-79) — if (wire.original_input !== undefined) {\n  return { ...base, originalInput:\
    \ wire.original_input };\n}\nreturn base;"
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/pane-is-a-region-named-after-the-graph
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at the `<section>` in GraphSpace,\
    \ lines 202-204; nodes, links, status and errorMessage arrive as props and the file never writes them\
    \ — <section\n  role=\"region\"\n  aria-label=\"Grafo de conhecimento\"\nsrc/features/graph/components/GraphSpace/GraphSpace.types.ts:\
    \ held at The `nodes`, `links`, `status` and `errorMessage` props of GraphSpaceProps, which carry\
    \ the caller-fed half of the rule as readonly inputs. The accessible name \"Grafo de conhecimento\"\
    \ appears nowhere in this file. — nodes: readonly GraphNodeData[];\nlinks: readonly GraphLinkData[];\n\
    status: GraphStatus;\nerrorMessage?: string;"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
  - src/features/graph/components/GraphSpace/GraphSpace.types.ts
- node: rules/graph-explorer/pane-is-busy-only-while-loading-or-revealing
  conforms: true
  how: 'src/features/graph/components/GraphSpace/GraphSpace.tsx: held at `isBusy` and the conditional
    `aria-busy` spread in GraphSpace, lines 194 and 208 — const isBusy = status === "loading" || status
    === "revealing";

    ...

    {...(isBusy ? { "aria-busy": true } : {})}'
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/pane-starts-and-clears-empty
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at makeInitialState and clear, lines 234-261 and
    418-420 — status: "empty",

    errorMessage: undefined,

    receivedDeltaThisTurn: false,

    layoutNonce: 0,

    layoutAlgorithm: "force",'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/radial-layout-puts-the-root-at-the-centre
  conforms: true
  how: 'src/features/graph/lib/layout-radial.ts: held at The `tree().size([2 * Math.PI, 1]).separation(...)`
    call (lines 89-91) and the projection in the output loop (lines 150-154). — .separation((a, b) =>
    (a.parent === b.parent ? 1 : 2) / a.depth);

    const x = radius * Math.sin(theta);

    const y = -radius * Math.cos(theta);

    ring 0 has `radius = d === 0 ? 0 : ...`, so a single root lands at (0, 0).'
  encoded_at:
  - src/features/graph/lib/layout-radial.ts
- node: rules/graph-explorer/radial-rings-take-the-largest-radius
  conforms: true
  how: "src/features/graph/lib/layout-radial.ts: held at The radiusPerDepth loop and the constants NODE_FOOTPRINT\
    \ and MIN_RING_GAP (lines 54, 59, 108-135). — const angularTerm = count >= 2\n  ? NODE_FOOTPRINT /\
    \ (2 * Math.sin(Math.PI / count))\n  : 0;\nconst radius = d === 0\n  ? 0\n  : Math.max(d * MIN_RING_GAP,\
    \ angularTerm, prevRadius + MIN_RING_GAP);"
  encoded_at:
  - src/features/graph/lib/layout-radial.ts
- node: rules/graph-explorer/read-failures-pass-through-unchanged
  conforms: true
  how: "src/features/graph/api/useNodeDetail.ts: held at `queryFn`, lines 55-62. The `http` call is not\
    \ wrapped, caught or translated, so the helper's error reaches `query.error`. — const wire = await\
    \ http<NodeDetailWire>(\n  `/api/v1/nodes/${encodeURIComponent(id as string)}`,\n  { method: \"GET\"\
    , headers: authHeader() },\n);\nsrc/features/graph/api/useNodeRelationships.ts: held at the queryFn,\
    \ lines 35-41. The error from `http` propagates with no catch or rewrap. — const wire = await http<TraversalResultWire>(\n\
    \  `/api/v1/nodes/${encodeURIComponent(id as string)}/traverse?depth=1&direction=both`,\n  { method:\
    \ \"GET\", headers: authHeader() },\n);\nsrc/features/graph/api/useProvenance.ts: held at The `queryFn`\
    \ at lines 38-44. It has no catch or remapping, so the error the `http` helper raises reaches the\
    \ query result unchanged. — queryFn: async () => {\n  const wire = await http<ProvenanceResponseWire>(\n\
    \    `/api/v1/provenance/${kind}/${encodeURIComponent(id)}`,\n    { method: \"GET\", headers: authHeader()\
    \ },\n  );\n  return toProvenanceResponse(wire);\n},"
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
- node: rules/graph-explorer/reduced-motion-reveals-everything-at-once
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at prefersReducedMotion() (lines 108-112) and
    the reduced-motion branch of the effect (lines 223-226), which calls drainAll() (lines 134-157) —
    if (typeof window.matchMedia !== "function") return false;

    return window.matchMedia(REDUCED_MOTION_QUERY).matches;

    ...

    for (const id of revealQueue) next.add(id);

    useGraphStore.setState({'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/relationship-rows-keep-the-answered-order
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the success
    branch, lines 83-93 — {query.data.links.map((l) => (<NodeRelationshipRow key={l.id} link={l} />))}.
    The list is mapped in the order received, with no sort or filter.'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/relationships-are-a-named-busy-section
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the `<section>`
    element, lines 96-102, and the branch order in lines 33-94 — aria-label={NODE_DETAIL_COPY.relationshipsHeading}
    ... aria-busy={query.isPending ? "true" : "false"}. The branches run `query.isPending`, then `query.isError`,
    then `query.data === undefined || query.data.links.length === 0`, then the list. The heading resolves
    to "Relações" in NodeDetailPanel.copy.ts.'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/relationships-are-read-at-depth-one-both-ways
  conforms: true
  how: 'src/features/graph/api/useNodeRelationships.ts: held at the request path in the queryFn, line
    37 — `/api/v1/nodes/${encodeURIComponent(id as string)}/traverse?depth=1&direction=both`'
  encoded_at:
  - src/features/graph/api/useNodeRelationships.ts
- node: rules/graph-explorer/relationships-say-loading-or-none
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the pending
    branch (lines 33-47) and the empty branch (lines 74-82) — <span aria-live="polite" ...>{NODE_DETAIL_COPY.relationshipsLoading}</span>
    and <p ... data-testid="node-detail-relationships-empty">{NODE_DETAIL_COPY.relationshipsEmpty}</p>.
    The strings resolve to "Carregando relações…" and "Nenhuma relação encontrada." in NodeDetailPanel.copy.ts.'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/removing-nodes-removes-everything-about-them
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at removeNodes, lines 334-377 — if (ids.length ===\
    \ 0) return;\nconst nextRevealQueue = state.revealQueue.filter((id) => !idSet.has(id));\nif (idSet.has(link.source)\
    \ || idSet.has(link.target)) {\n  nextLinks.delete(linkId);"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/reorganizing-releases-the-pins
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at resetLayout, lines 393-398 — set((state) => ({\n\
    \  userPinned: new Set<string>(),\n  layoutNonce: state.layoutNonce + 1,\n}));"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/replace-keeps-only-the-delta
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at replaceNodes, lines 301-332 — if (nextNodes.has(link.source)\
    \ && nextNodes.has(link.target)) {\n  nextLinks.set(link.id, link);\n}\npositions: new Map<string,\
    \ GraphPosition>(),\nuserPinned: new Set<string>(),\nrevealedIds: new Set<string>(),\nrevealQueue,\n\
    receivedDeltaThisTurn: true,"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/restore-reads-the-saved-view-of-the-conversation
  conforms: true
  how: "src/features/graph/api/use-graph-persistence.ts: held at the restore effect, lines 64-112. The\
    \ effect returns early without a conversation, a null answer changes nothing, and a present view goes\
    \ to hydrate. — if (!conversationId) return;\n...\nif (snapshot !== null) {\n  justHydrated.current\
    \ = true;\n  hydratedFor.current = conversationId;"
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/restore-restores-the-layout-of-a-version-2-view
  conforms: true
  how: "src/features/graph/api/use-graph-persistence.ts: held at the version branch in restoreSnapshot,\
    \ lines 84-101 — if (snapshot.version === 2) {\n  useGraphStore.getState().hydrate({\n    version:\
    \ 2,\n    ...\n    layout_algorithm: snapshot.layout_algorithm,\n} else {\n  useGraphStore.getState().hydrate({\n\
    \    version: 1,"
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/restoring-keeps-orphan-positions
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at hydrate, positions loop, lines 505-507 — for\
    \ (const [id, pos] of Object.entries(snapshot.positions)) {\n  nextPositions.set(id, { x: pos.x, y:\
    \ pos.y });\n}"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/restoring-shows-every-node-at-once
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at the hydrate set call, lines 517-529 — revealedIds:
    new Set<string>(allNodeIds),

    revealQueue: [],

    status: "ready",

    receivedDeltaThisTurn: false,

    errorMessage: undefined,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/reveal-goes-one-node-at-a-time-in-queue-order
  conforms: true
  how: "src/features/graph/hooks/useGraphReveal.ts: held at DEFAULT_REVEAL_STAGGER_MS (line 88) and tick\
    \ (lines 234-258). The 90 ms default and the one-id-per-step timing are here. Taking the head of the\
    \ queue is delegated to `useGraphStore.getState().dequeueReveal()`, which is declared in another file.\
    \ — export const DEFAULT_REVEAL_STAGGER_MS = 90;\n...\nconst id = useGraphStore.getState().dequeueReveal();\n\
    if (id !== undefined) {\n  revealOne(id);\n}"
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/reveal-marks-nodes-only
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at revealOne (lines 165-171) and drainAll (lines
    146-151). Both write only `revealedIds` and `revealQueue`. The file has no edge or link handling.
    — const next = new Set(revealedIds);

    next.add(id);

    useGraphStore.setState({ revealedIds: next });'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/revealing-a-revealed-node-changes-nothing
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at the early return in revealOne, line 167 —
    if (revealedIds.has(id)) return;'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/screen-readers-hear-the-direction
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts: held at directionOutgoingSr\
    \ and directionIncomingSr, lines 40-41 — directionOutgoingSr: \"direção: destino\",\ndirectionIncomingSr:\
    \ \"direção: origem\",\nsrc/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held\
    \ at lines 117-120, the direction branch, rendered in the sr-only span at line 138. The exact wording\
    \ is in NODE_DETAIL_COPY in another file. — const directionSr =\n  link.direction === \"outgoing\"\
    \n    ? NODE_DETAIL_COPY.directionOutgoingSr\n    : NODE_DETAIL_COPY.directionIncomingSr;"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/setting-a-status-keeps-the-error-message-only-for-error
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at setStatus, lines 422-429 — errorMessage: status
    === "error" ? errorMessage : undefined,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/several-components-hang-under-a-virtual-root
  conforms: true
  how: "src/features/graph/lib/layout-radial.ts: held at Both `continue` branches on SUPER_ROOT_ID, in\
    \ the per-depth count loop and in the output loop (lines 99 and 139). The hanging under a virtual\
    \ root, and the id literal, are declared in src/features/graph/lib/spanning-tree.ts, not here. — if\
    \ (id === SUPER_ROOT_ID) continue;\nThe `SUPER_ROOT_ID` import `from \"./spanning-tree\"`, which is\
    \ only read here, never declared.\nsrc/features/graph/lib/layout-tree.ts: held at the skip of the\
    \ virtual root in the loop, line 92. The construction of the virtual root over several components\
    \ sits in buildSpanningTree in spanning-tree.ts, which this file calls and does not declare. — if\
    \ (id === SUPER_ROOT_ID) continue;\nsrc/features/graph/lib/spanning-tree.ts: held at the `SUPER_ROOT_ID`\
    \ constant (line 28) and the final return of buildSpanningTree (lines 139-145). The \"never given\
    \ a position\" half is not in this file, which only supplies the sentinel id. — export const SUPER_ROOT_ID\
    \ = \"__super_root__\";\nif (componentRoots.length === 1) {\n  return componentRoots[0]!;\n}\nreturn\
    \ {\n  id: SUPER_ROOT_ID,\n  children: componentRoots,\n};"
  encoded_at:
  - src/features/graph/lib/layout-radial.ts
  - src/features/graph/lib/layout-tree.ts
  - src/features/graph/lib/spanning-tree.ts
- node: rules/graph-explorer/stopping-the-reveal-keeps-what-it-reached
  conforms: true
  how: "src/features/graph/hooks/useGraphReveal.ts: held at the cleanup function returned by the effect,\
    \ lines 267-272. Nothing in the file deletes from `revealedIds` or `revealQueue`. — return (): void\
    \ => {\n  if (timerRef.current !== null) {\n    clearTimeout(timerRef.current);\n    timerRef.current\
    \ = null;\n  }\n};"
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/the-canvas-opens-at-three-quarters-zoom
  conforms: true
  how: 'src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at DEFAULT_VIEWPORT at line 86
    and the ReactFlow fit props at lines 291 and 297-298 — const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom:
    0.75 } as const;

    ...

    defaultViewport={DEFAULT_VIEWPORT}

    ...

    fitView

    fitViewOptions={{ padding: 0.1 }}'
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/the-canvas-stays-mounted-outside-the-empty-state
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at the else branch of the `showEmptyState`\
    \ ternary, lines 226-236, which renders `ReactFlowProvider` and `GraphCanvasRegion` for every status\
    \ other than the empty state — <ReactFlowProvider>\n  <GraphCanvasRegion\n    nodes={nodes}\n    links={links}\n\
    \    status={status}"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/the-close-button-takes-focus
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at Only the name\
    \ is held here: the aria-label on the close button at line 60, with the button receiving closeRef\
    \ at line 57. The code that moves focus on mount and on a node id change is not in this file, which\
    \ only receives the ref. NodeDetailPanel.tsx is the file in the candidate index bound to it. — <button\
    \ ref={closeRef} type=\"button\" onClick={onClose} aria-label={NODE_DETAIL_COPY.close}\nsrc/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx:\
    \ held at the focus effect, lines 78-80, with closeRef passed to every view. The button's accessible\
    \ name is not in this file. — useEffect(() => {\n  closeRef.current?.focus();\n}, [nodeId]);"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-first-node-id-key-is-a-placeholder
  conforms: true
  how: 'src/features/graph/api/useNodeDetail.ts: held at the `queryKey` line, 54 — queryKey: graphNodeKeys.detail(id
    ?? "__noop__"),'
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
- node: rules/graph-explorer/the-layout-picker-needs-the-algorithm-and-its-setter
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at LAYOUT_ALGORITHM_LABELS and\
    \ LAYOUT_ALGORITHM_ORDER, lines 63-72, and the Select, lines 329-342 — force: \"Força\",\n  tree:\
    \ \"Árvore\",\n  radial: \"Radial\",\n...\n{layoutAlgorithm && onLayoutAlgorithmChange && (\n...\n\
    aria-label=\"Algoritmo de layout do grafo\""
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/the-loading-view-says-it-is-loading
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at LoadingView,
    lines 83-106 — const title = nodeLabel ?? ""; ... <PanelHeader title={title} ... /> ... <span aria-live="polite"
    className="text-xs text-foreground">{NODE_DETAIL_COPY.loading}</span>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
- node: rules/graph-explorer/the-neighbour-is-the-other-end
  conforms: true
  how: "src/features/graph/api/traversal.transforms.ts: held at toLinkView, lines 48-53 and 61-63 — const\
    \ neighborId = isOutgoing ? wire.target_node_id : wire.source_node_id;\n  const neighbor = nodesById.get(neighborId);\n\
    \  const neighborName = neighbor?.canonical_name ?? neighborId;\n  const neighborType = neighbor?.node_type\
    \ ?? \"\";"
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/the-origin-body-checks-pending-failure-then-data
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at the order of the\
    \ three guards in NodeProvenanceChain, lines 184-252, then the list at line 254 — if (isPending) {\n\
    \  <div ... aria-busy=\"true\" ...>\n    <span aria-live=\"polite\" ...>{NODE_DETAIL_COPY.originLoading}</span>\n\
    if (isError) {\nif (data === undefined || data.fragments.length === 0) {"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/the-overlay-is-a-polite-status-region
  conforms: true
  how: 'src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at the outer div
    at lines 76-77 and the aria-label passed to GlassSurface at line 94. Whether GlassSurface forwards
    aria-label to the DOM is not visible in this file. — role="status"

    aria-live="polite"

    aria-label={isError ? "Erro do grafo" : "Carregando grafo"}'
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/the-overlay-lets-the-pointer-through
  conforms: false
  how: "src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx, the className of the\
    \ GlassSurface card, line 90 (inside the JSX at lines 81-95): className={cn(\n          \"pointer-events-auto\"\
    ,\n          \"flex items-center gap-sm px-lg py-md\",\n          \"min-w-0 max-w-md\",\n        )}\
    \ — The node says the overlay must not capture the pointer. The outer wrapper does let events through,\
    \ but the card re-enables them with pointer-events-auto, so the card captures the pointer. Pan, zoom\
    \ and click on the canvas stop working under the card, which sits at the centre of the canvas. A reader\
    \ who trusts the node would expect the whole overlay to be transparent to the pointer. The comments\
    \ in the file (lines 24-27 and 86-88) present the re-enable as intended, so it reads as a decision\
    \ made in code."
  observed_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/the-overlay-message-is-two-lines-at-most
  conforms: true
  how: 'src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at the className
    of the message span, line 116 — "min-w-0 line-clamp-2",'
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/the-owner-cannot-draw-links
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the interaction props on ReactFlow,\
    \ lines 312-317 — nodesConnectable={false}\n      elementsSelectable={true}\n...\n      panOnDrag\n\
    \      zoomOnScroll"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/the-pane-reveals-at-the-hooks-default-gap
  conforms: true
  how: 'src/features/graph/components/GraphSpace/GraphSpace.tsx: held at the default parameter in the
    GraphSpace signature, line 179, and its use at line 126 — revealStaggerMs = DEFAULT_REVEAL_STAGGER_MS,

    ...

    const revealedIds = useGraphReveal(revealStaggerMs);'
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/the-pane-wires-the-owner-s-arrangement-to-the-store
  conforms: true
  how: 'src/features/graph/components/GraphSpace/GraphSpace.tsx: held at the store selectors at lines
    111-119 and the props on `<GraphCanvas>` at lines 156-159 — const setNodePosition = useGraphStore((s)
    => s.setNodePosition);

    const resetLayout = useGraphStore((s) => s.resetLayout);

    ...

    onNodePositionCommit={setNodePosition}

    onResetLayout={resetLayout}

    layoutAlgorithm={layoutAlgorithm}

    onLayoutAlgorithmChange={setLayoutAlgorithm}'
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/the-panel-checks-pending-then-failure-then-data
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at the body selection\
    \ chain, lines 107-147 — if (query.isPending) {\n  body = (<LoadingView ... />);\n} else if (query.isError)\
    \ {\n  ...\n} else if (query.data !== undefined) {\n  body = (<SuccessView ... />);\n} else {\n  body\
    \ = (<LoadingView ... />);\n}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-panel-is-a-region-named-after-the-node
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at resolvedLabel, lines\
    \ 104-105, and the GlassSurface attributes, lines 151-154 — const resolvedLabel =\n  query.data?.canonicalName\
    \ ?? nodeLabel ?? \"carregando\";\n...\nrole=\"complementary\"\naria-label={`Detalhes do nó: ${resolvedLabel}`}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-panel-reads-the-node-by-id
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at line 68 — const query
    = useNodeDetail(nodeId);'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-reorganize-control-needs-its-handler
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the Button rendered when onResetLayout\
    \ is supplied, lines 343-354 — {onResetLayout && (\n                <Button\n...\n               \
    \   onClick={onResetLayout}\n                  aria-label=\"Reorganizar o layout do grafo\""
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/title-and-document-date-come-from-metadata
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at readMetadataTitle (lines 43-49) and readMetadataDocumentDate
    (lines 52-60) — return typeof t === "string" && t.length > 0 ? t : null;

    ... if (typeof d !== "string" || d.length === 0) return null;

    return formatDateLabel(d);'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/tree-and-radial-layouts-share-one-spanning-tree
  conforms: true
  how: "src/features/graph/lib/spanning-tree.ts: held at buildSpanningTree, lines 58-146. The adjacency\
    \ Set (lines 67-82) counts duplicates once. The self-link skip is at line 76. The degree/id comparator\
    \ is at lines 93-98. The breadth-first walk is at lines 113-132, with neighbours sorted by id at line\
    \ 123. — if (source === target) continue;\nconst sortedByDegree = [...nodeIds].sort((a, b) => {\n\
    \  const da = adj.get(a)!.size;\n  const db = adj.get(b)!.size;\n  if (da !== db) return db - da;\n\
    \  return a < b ? -1 : a > b ? 1 : 0;\n});\nconst neighbours = [...adj.get(currentId)!].sort();"
  encoded_at:
  - src/features/graph/lib/spanning-tree.ts
- node: rules/graph-explorer/tree-layout-grows-left-to-right
  conforms: true
  how: "src/features/graph/lib/layout-tree.ts: held at the constants at lines 40 and 45, the nodeSize\
    \ call at lines 81-84 and the axis swap at line 102 — const TREE_SIBLING_GAP = 110;\nconst TREE_LEVEL_GAP\
    \ = 340;\ntree<SpanningTreeNode>().nodeSize([\n    TREE_SIBLING_GAP,\n    TREE_LEVEL_GAP,\n  ]);\n\
    out.set(id, { x: node.y ?? 0, y: node.x ?? 0 });"
  encoded_at:
  - src/features/graph/lib/layout-tree.ts
- node: rules/graph-explorer/turn-done-after-a-delta-makes-the-pane-ready
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at settleTurn, done branch, lines 449-451 — if (receivedDeltaThisTurn)\
    \ {\n  set({ status: \"ready\", errorMessage: undefined, receivedDeltaThisTurn: false });"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/turn-done-without-a-delta-leaves-the-status
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at settleTurn, done branch else, lines 451-453 —\
    \ } else {\n  set({ receivedDeltaThisTurn: false });\n}"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/turn-error-ends-a-busy-pane-in-error
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at graphToolInFlight and the settleTurn error branch,\
    \ lines 227-229 and 461-465 — return status === \"loading\" || status === \"revealing\";\nif (graphToolInFlight(status))\
    \ {\n  set({ status: \"error\", receivedDeltaThisTurn: false });"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/view-failures-are-silent
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the empty `catch {}` of restoreSnapshot
    (lines 103-107) and the `.catch(() => {})` of the PUT (lines 146-149). No retry is issued. — } catch
    {

    ...

    ).catch(() => {'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
unstated:
- file: src/features/graph/api/keys.ts
  where: graphViewKeys, lines 41-48 (the whole key factory, including forConversation)
  evidence: "export const graphViewKeys = {\n  all: [\"graphView\"] as const,\n  forConversation: (conversationId:\
    \ string) =>\n    [\"graphView\", conversationId] as const,\n} as const;"
  cost: The graph view is cached under one entry per conversation, and that scoping lives only in this
    file. The nearest node, rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation, governs
    restoring and saving the view on a conversation change. It says nothing about how the view is cached.
    Anyone looking for what a conversation's graph view is cached by will read the specification and find
    nothing. The sibling node keys (node detail, relationships, provenance) each have a rule; this one
    has none.
- file: src/features/graph/api/provenance.types.ts
  where: the `ProvenanceKind` declaration, line 19. The header comment at lines 9-12 lists the three URL
    shapes.
  evidence: 'export type ProvenanceKind = "links" | "attributes" | "fragments";

    (header comment) GET /api/v1/provenance/fragments/:fragment_id'
  cost: The graph-explorer contract holds only the link and attribute provenance reads. This file declares
    a third read, `fragments`, that no graph-explorer node holds. The `fragments` provenance read is held
    only by the curation-workspace contract. A reader checking what the node detail panel may call finds
    two operations in the graph-explorer node and three in the code, and the third is stated in another
    feature's contract.
- file: src/features/graph/api/use-graph-persistence.ts
  where: the timer callback in handleStoreChange, lines 136-138
  evidence: 'const snapshot = useGraphStore.getState().getSnapshot();

    // nodes.size guard already passed — double-check after debounce.

    if (snapshot.nodes.length === 0) return;'
  cost: 'The code applies a second refusal when the wait ends: a save is skipped if the pane has emptied
    during the 800 ms. The node requires at least one node only at the moment of the change. The step
    lives only here, so the next reader looks for it in the specification and does not find it.'
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: the visible label of the Button, line 352
  evidence: "<Shuffle aria-hidden=\"true\" className=\"size-4\" />\n            Reorganizar"
  cost: The visible wording of the reorganize control, "Reorganizar", is text shown to the owner and is
    held by no node. The node fixes only the accessible name "Reorganizar o layout do grafo". A change
    to this wording would be made here, where nobody looks for it in the specification.
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the `className` of `BaseEdge`, lines 182-188
  evidence: '"[stroke-width:var(--border-thin)]",

    "hover:[stroke-width:var(--border-2)]",

    selected && "[stroke-width:var(--border-thick)]",'
  cost: A link thickens on hover and thickens again when selected, using three width tokens. No node holds
    either behaviour; a search of the specification root for stroke, hover and selected link terms found
    only node-drawing rules. The code becomes the only place this interaction state is decided, and someone
    reading the specification will not find it.
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the `style` of the label `div`, lines 201-210
  evidence: 'position: "absolute",

    transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,

    pointerEvents: "none",'
  cost: The label is centred on the bezier midpoint and ignores the pointer, so a click or drag passes
    through to the node under it. No node holds either decision. The label's own text is also not hidden
    from assistive technology, while the rest of the link is. No node settles whether the label is covered
    by the hidden rule.
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  where: line 19, the attributesHeading entry of NODE_DETAIL_COPY (rendered as the h3 of the attributes
    section in NodeDetailPanel.success.tsx)
  evidence: 'attributesHeading: "Atributos",'
  cost: This is text the system shows the owner, as the heading above the attributes table. No node names
    that heading. The attributes rule only says "a table of attribute, value and state", and the graph-screen
    contract lists the aliases and attributes without naming the heading. The wording therefore lives
    only in this file. A reader looking in the specification for what the attributes section is called
    will not find it, and a change to the specification cannot reach it.
- file: src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
  where: LinkInlineProvenance, lines 47-63 (what each inline entry shows)
  evidence: '<p className="text-xs text-foreground">{p.fragmentText}</p>

    ...

    {p.confidenceLabel !== null && (

    ...

    {p.sourceType !== null && (

    ...

    {p.receivedAtLabel !== null && ('
  cost: 'The code decides what an inline entry shows: the fragment text always, and confidence, source
    type and received-at only when present. No node in this file''s set holds that. The node that does,
    a candidate, is bound only to NodeAttributeRow.tsx. A change to the node would not reach this file.'
restates:
- file: src/features/graph/api/_request.ts
  where: the file header comment (lines 1-19) and the docstring on authHeader(), line 22
  evidence: "/** Build the `Authorization: Bearer <jwt>` header when a token is present. */\nand, in the\
    \ header, \" *  - lib/http.ts contract — JWT is the caller's responsibility (header\n *    injection\
    \ happens here, parsing happens in lib/http).\""
  cost: The bearer-token rule is stated in prose here as well as in the node and in the code of authHeader().
    If the node moves, the comment keeps asserting the old form and no check reaches it. The code in this
    file already holds the fact, so the prose adds a second home and no behavior.
  node: constraints/every-operation-requires-owner-authentication
- file: src/features/graph/api/_transforms.ts
  where: the RECEIVED_AT_FORMATTER comments (lines 183-191) and the formatReceivedAtLabel docstring (lines
    193-197)
  evidence: "`received_at` is a full ISO timestamp, not a date-only field — render in\n  // the user's\
    \ local timezone so the day matches what they would read in a\n  // mail header.\nand\nReturns the\
    \ raw string on parse failure (never throws), `null` when input\n * is absent."
  cost: The local-time-zone choice, its reason, and the absent and unreadable behaviours are restated
    in prose. A change to the node would leave the comments describing the old rule. Code in this file
    holds the fact (a formatter with no `timeZone`, `return iso;` on `Number.isNaN`, `null` when absent),
    so only the prose is owed removal.
  node: rules/graph-explorer/an-inline-entry-shows-its-date-only
- file: src/features/graph/api/_transforms.ts
  where: the docstring of formatConfidenceLabel (lines 168-174)
  evidence: "Format a confidence float (0..1) as a 0-decimal percentage label\n * (`0.923 → \"92%\"`).\
    \ Spec §9 \"Response transforms\" row.\n *\n * Returns `null` when the wire value was undefined/null\
    \ — the row UI\n * collapses the label gracefully (`\"—\"`) without falsely reporting `0%`."
  cost: The rounding rule and the no-label-instead-of-0% rule are restated in prose, with a worked example
    and a claim about what the row UI shows ("—") that no node in this set holds. Code in this file holds
    the fact (`return `${Math.round(confidence * 100)}%`;` and the `null` returns), so only the prose
    is owed removal.
  node: rules/graph-explorer/confidence-is-a-rounded-percentage
- file: src/features/graph/api/_transforms.ts
  where: the docstring of mapAttributeStatusToBadge (lines 67-84) and the inline comment at lines 92-94
  evidence: "The raw assertion\n * status is consulted only for the `disputed` mapping, which the effective\n\
    \ * view also exposes as `disputed` so the precedence is:\nand\n// `active` — but if the underlying\
    \ assertion was 'superseded' (which would\n  // be unusual since effective='active' implies a current\
    \ assertion), keep\n  // 'superseded' as the least misleading."
  cost: The precedence is stated in prose, and the docstring says the assertion status is consulted only
    for `disputed`. The code (`if (assertion === "superseded") return "superseded";`) uses it for `superseded`,
    and so does the node. A reader who trusts the comment would believe the assertion status never affects
    the badge. Code in this file holds the fact, so only the prose is owed removal.
  node: rules/graph-explorer/attribute-badge-follows-a-fixed-precedence
- file: src/features/graph/api/_transforms.ts
  where: the file's header docstring (lines 11-12), the DATE_FORMATTER comment (lines 101-106) and the
    formatDateLabel docstring (lines 114-118)
  evidence: "`valid_from`/`valid_to` formatted as `DD/MM/YYYY` (pt-BR) using\n *        `Intl.DateTimeFormat`.\n\
    and\n`timeZone: 'UTC'` matches the wire date construction (Date.UTC) below so\nand\nReturns `null`\
    \ when input is `null` (open-ended interval). Returns the\n * raw string if parsing fails — never\
    \ throws"
  cost: 'The validity-date format, the UTC reasoning and the absent and unreadable-date behaviours are
    restated in three comments. A change to the node would leave them describing the old behaviour, and
    `--check` does not reach them. Code in this file holds the fact (`timeZone: "UTC"` in DATE_FORMATTER,
    `if (date === null) return null;`, `return date;` on a failed parse), so only the prose is owed removal.'
  node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
- file: src/features/graph/api/_transforms.ts
  where: the file's header docstring (lines 4-9) and the docstring of mapNodeStatusToBadge (lines 35-48)
  evidence: "`node.status` → StateBadge state (`active → accepted`,\n *        `needs_review → uncertain`,\
    \ `merged → superseded`).\nand\n*  - `active`        → `accepted`     (the canonical \"this is the\
    \ truth\" state)\n *  - `needs_review`  → `uncertain`    (review queue, §10 of remember-modelagem)\n\
    \ *  - `merged`        → `superseded`"
  cost: The status-to-badge table is stated a second time in prose, citing a docs/specs component spec
    and a section of the modelagem. When the node moves, the comment keeps saying the old table, and `--check`
    does not reach it. Code in this same file holds the fact (the switch in mapNodeStatusToBadge returns
    "accepted", "uncertain", "superseded" and "superseded" for deleted), so the pair conforms and only
    the prose is owed removal.
  node: rules/graph-explorer/node-badge-follows-the-node-status
- file: src/features/graph/api/_transforms.ts
  where: the file's header docstring (lines 9-10) and the docstring of sortAttributes (lines 227-234)
  evidence: "Attributes sorted: `is_in_effect: true` first, then by `key`\n *        alphabetically (stable).\n\
    and\nSort attributes: `is_in_effect: true` first, then by `attribute_key`\n * (locale-aware, case-insensitive).\
    \ Stable when keys collide"
  cost: 'The ordering rule is stated twice in prose, and the header version says "alphabetically" where
    the node says pt-BR comparison ignoring case and accents. A reader of the comment would take the weaker
    statement as the rule. Code in this file holds the fact (`a.key.localeCompare(b.key, "pt-BR", { sensitivity:
    "base" })` after the isInEffect comparison), so only the prose is owed removal.'
  node: rules/graph-explorer/attributes-in-effect-come-first-by-key
- file: src/features/graph/api/mapWireToGraphDelta.ts
  where: the comment above `linkTypeLabel` in the link literal (lines 118-121)
  evidence: '// The visible label — pt-BR catalog-resolved when the backend projected

    // it, otherwise a humanized slug. The slug (`label` above) stays the

    // color-lookup key; only this string is rendered as text on the canvas.'
  cost: 'Two facts are restated here in prose: the catalog-label-or-spaced-slug text rule and the slug-kept-apart
    rule. The running code that holds the first lives in another file, src/features/graph/lib/map.ts (`mapLinkTypeLabel`).
    A reader of this file gets a second statement of it, and that statement is not updated when the rule
    changes.'
  node: rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
- file: src/features/graph/api/mapWireToGraphDelta.ts
  where: the header docstring, "Cross-delta dedupe" paragraph (lines 35-41), and the comment above `sourceVisible`
    (lines 101-104)
  evidence: '* Cross-delta dedupe: a link whose endpoint is *not* in THIS delta but

    * *is* already in `useGraphStore.nodes` is kept (the store dedupes by id

    * on merge, so the link still resolves).

    ...

    // Drop links whose endpoints are not in the visible set for THIS delta

    // AND not already in the store.'
  cost: The endpoint-visibility rule is stated in prose beside the code that holds it. A future change
    to the rule would have to be made in two places, and only one of them is read by the running system.
  node: rules/graph-explorer/a-link-is-kept-only-with-visible-ends
- file: src/features/graph/api/mapWireToGraphDelta.ts
  where: the header docstring, "Filter rule (I-2)" paragraph (lines 30-33), and the inline comment at
    the `state === undefined` branch (lines 83-87)
  evidence: '* Filter rule (I-2): nodes whose `status` maps to `undefined` (currently

    * `merged` / `deleted`) are dropped — they have no visible representation

    * in the surface store and would render as ghosts. Links anchored on a

    * filtered-out endpoint are dropped too.

    ...

    // Filtered out (merged / deleted) — do not propagate to the surface

    // store.'
  cost: The prose is a second home for the node-state fact, which is the one the nodes hold. The file
    does not carry the status list. When the node-state mapping changes, this comment keeps naming `merged`
    / `deleted` and nothing updates it.
  node: rules/graph-explorer/a-delta-without-state-for-a-node-leaves-it-off
- file: src/features/graph/api/node-detail.types.ts
  where: lines 114-116, the comment on ProvenanceEntryView.confidenceLabel
  evidence: "/** Confidence formatted as integer percent (e.g. `\"92%\"`) — `null` when\n   *  the wire\
    \ field was missing. */"
  cost: The percentage rule is stated in prose on the field, and formatConfidenceLabel in src/features/graph/api/_transforms.ts
    holds it, so there are two homes for the rule.
  node: rules/graph-explorer/confidence-is-a-rounded-percentage
- file: src/features/graph/api/node-detail.types.ts
  where: lines 140-142, the comment on NodeAttributeView.provenance
  evidence: Defaults to `[]` when the wire field is absent.
  cost: The empty default is stated in prose on the field, while toAttributeView in src/features/graph/api/_transforms.ts
    holds it with `(wire.provenance ?? [])`, so there are two homes for the rule.
  node: rules/graph-explorer/an-attribute-without-provenance-has-an-empty-list
- file: src/features/graph/api/node-detail.types.ts
  where: lines 15-18 of the file's header comment
  evidence: "`node.status` → `ConfidenceState` (for the `StateBadge`) via\n *    `mapNodeStatusToBadge`\
    \ (spec §9 \"Response transforms\" row)."
  cost: The node-status-to-badge mapping is cited here in prose, and the code holds it in mapNodeStatusToBadge
    in src/features/graph/api/_transforms.ts. The prose invites the reader to look for the rule in a spec
    section instead of in the node.
  node: rules/graph-explorer/node-badge-follows-the-node-status
- file: src/features/graph/api/node-detail.types.ts
  where: lines 17-20 of the file's header comment
  evidence: "Attributes sorted: `in_effect: true` first, then by `attribute_key`\n *    ascending (spec\
    \ §9)."
  cost: The ordering rule is stated in prose here while the code holds it in sortAttributes in src/features/graph/api/_transforms.ts.
    The comment's wording ("ascending") is not the node's (compared in pt-BR ignoring case and accents),
    so the prose can drift from the rule without anything noticing.
  node: rules/graph-explorer/attributes-in-effect-come-first-by-key
- file: src/features/graph/api/node-detail.types.ts
  where: lines 21-24 of the file's header comment
  evidence: "`valid_from` / `valid_to` formatted as `DD/MM/YYYY` (pt-BR) — the raw\n *    ISO strings\
    \ stay on the surface object too"
  cost: The date format is stated here in prose while formatDateLabel in src/features/graph/api/_transforms.ts
    holds it. The comment also claims that the raw ISO strings stay on the surface object, but NodeAttributeView
    declares only validFromLabel and validToLabel, so the prose says something the types do not.
  node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
- file: src/features/graph/api/provenance.transforms.ts
  where: the comment block in toRawInformationView, lines 72-76
  evidence: '// Only set the field when

    // the wire actually carried a value — TS strict `exactOptionalPropertyTypes`

    // forbids assigning `undefined` to an optional property.'
  cost: The rule that original input is carried only when answered is restated in prose. The comment also
    describes how another component treats the value (disclosure, a '[REDACTED]' indicator, nothing),
    which this file does not implement. Prose in two places is a second home for facts that nodes hold.
  node: rules/graph-explorer/original-input-is-carried-only-when-answered
- file: src/features/graph/api/provenance.transforms.ts
  where: the docstring of formatReceivedAtDateTime, lines 32-35
  evidence: 'Format a `received_at` ISO instant as `DD/MM/YYYY HH:mm` in the user''s

    local timezone. Returns the raw string on parse failure (defensive).'
  cost: The format, the local-time-zone rule and the raw-text fallback are all stated in prose beside
    the code that holds them. Prose and node can disagree, and nobody would know which one the business
    decided.
  node: rules/graph-explorer/a-source-date-time-is-short-pt-br
- file: src/features/graph/api/provenance.transforms.ts
  where: the docstring of readMetadataDocumentDate, line 51
  evidence: /** Read `metadata.document_date` (ISO date) → pt-BR `DD/MM/YYYY`, or null. */
  cost: The metadata source of the document date, its day-month-year display and the null fallback are
    restated in a comment. Code in this file holds the source and the null guard, and the formatting is
    delegated to formatDateLabel. The prose is a second home for a fact a node holds.
  node: rules/graph-explorer/title-and-document-date-come-from-metadata
- file: src/features/graph/api/provenance.transforms.ts
  where: the header docstring, line 8 (Spec references, the received_at row)
  evidence: • `raw_information.received_at` → pt-BR `DD/MM/YYYY HH:mm`.
  cost: 'The received-at format is written in this docstring as well as in the node. The docstring says
    `DD/MM/YYYY HH:mm`, but the code that runs is `new Intl.DateTimeFormat("pt-BR", { dateStyle: "short",
    timeStyle: "short" })`. If the two drift, a reader cannot tell which one was decided.'
  node: rules/graph-explorer/a-source-date-time-is-short-pt-br
- file: src/features/graph/api/provenance.transforms.ts
  where: the header docstring, line 9 (the chunk offset row)
  evidence: • `chunk.offset_start`/`offset_end` → `chars {start}–{end}`.
  cost: The offset-window wording is written in this docstring as well as in the node. Code in this file
    already holds it at offsetRangeLabel, so the prose is a second home that nothing reads.
  node: rules/graph-explorer/a-chunk-offset-window-is-shown-as-chars
- file: src/features/graph/api/provenance.types.ts
  where: the doc comment on `offsetRangeLabel`, line 88.
  evidence: /** `"chars 0–1742"` — pre-formatted offset window (Phase C transform). */
  cost: The label format is stated in prose. The code that produces it is `` `chars ${wire.offset_start}–${wire.offset_end}`
    `` in provenance.transforms.ts.
  node: rules/graph-explorer/a-chunk-offset-window-is-shown-as-chars
- file: src/features/graph/api/provenance.types.ts
  where: the doc comment on `originalInput` in `ProvenanceRawInformationView`, lines 74-79.
  evidence: '* Raw passthrough of `wire.original_input` (v2.1 — TC-04). Three meanings:

    *  - non-null, non-`''[REDACTED]''` string → render disclosure block.

    *  - `''[REDACTED]''` → render muted redaction indicator.'
  cost: 'The passthrough rule and the three display branches are stated in prose. The code that passes
    the value through is `{ ...base, originalInput: wire.original_input }` in provenance.transforms.ts.
    The code that branches on the sentinel is in NodeProvenanceChain.tsx.'
  node: rules/graph-explorer/original-input-is-carried-only-when-answered
- file: src/features/graph/api/provenance.types.ts
  where: the doc comment on `original_input` in `ProvenanceRawInformationWire`, lines 30-35.
  evidence: '* `null` / absent outside the chat path. `''[REDACTED]''` after a

    * `compliance_delete` redacted the row.'
  cost: The redaction sentinel is stated in prose here. The code that tests it is `REDACTED_SENTINEL =
    "[REDACTED]"` in NodeProvenanceChain.tsx, so the literal exists in code and in this comment.
  node: rules/graph-explorer/a-redacted-original-input-is-never-shown
- file: src/features/graph/api/provenance.types.ts
  where: the doc comment on `receivedAtLabel`, line 68.
  evidence: /** Pre-formatted pt-BR label `DD/MM/YYYY HH:mm` for `received_at`. */
  cost: 'The display format is stated in prose. The code that produces it is `Intl.DateTimeFormat("pt-BR",
    { dateStyle: "short", timeStyle: "short" })` in provenance.transforms.ts.'
  node: rules/graph-explorer/a-source-date-time-is-short-pt-br
- file: src/features/graph/api/provenance.types.ts
  where: the doc comments on `title` and `documentDateLabel`, lines 70-72.
  evidence: '/** `metadata.title` if present, else `null`. */

    /** `metadata.document_date` (pt-BR `DD/MM/YYYY`) if present, else `null`. */'
  cost: The source of the title and the document date is stated in prose. The code that derives them is
    `readMetadataTitle` and `readMetadataDocumentDate` in provenance.transforms.ts.
  node: rules/graph-explorer/title-and-document-date-come-from-metadata
- file: src/features/graph/api/provenance.types.ts
  where: the header comment, lines 9-15 (endpoint family and the `useProvenance` kind picking).
  evidence: '* Endpoint family — three URL shapes, identical body:

    *   GET /api/v1/provenance/links/:link_id

    *   GET /api/v1/provenance/attributes/:attribute_id'
  cost: The two URLs are stated in prose while the running code builds them in `useProvenance.ts`. When
    the contract moves, this comment is a second home that no check reaches.
  node: contracts/graph-explorer/bff-node-reads
- file: src/features/graph/api/traversal.transforms.ts
  where: the comment above confidenceLabel, lines 67-69
  evidence: "// `formatConfidenceLabel` returns `null` for `null|undefined|NaN`; here\n    // the wire\
    \ field is required so we coerce defensively to \"0%\" to avoid\n    // a blank cell on a malformed\
    \ payload."
  cost: The comment restates the 0% rule as prose. The code holds it in `formatConfidenceLabel(wire.confidence)
    ?? "0%"`, so the rule has a second home outside behaviour.
  node: rules/graph-explorer/an-unformatted-confidence-shows-zero-percent
- file: src/features/graph/api/traversal.transforms.ts
  where: the comment above neighborName, lines 50-52
  evidence: '// Defensive: if the BFF omitted the neighbor from `nodes[]` (should not

    // happen — `TraversalResult.nodes` MUST include all reachable nodes), fall

    // back to the raw id. Surface still renders; we never throw.'
  cost: The comment states the fall-back to the id with an empty type as prose. The code holds it in `neighbor?.canonical_name
    ?? neighborId` and `neighbor?.node_type ?? ""`, so the fact has two homes.
  node: rules/graph-explorer/the-neighbour-is-the-other-end
- file: src/features/graph/api/traversal.transforms.ts
  where: the module docstring, line 10 (neighbour canonical name lookup)
  evidence: 'neighbor canonical name: look up `result.nodes` by the other endpoint.'
  cost: The docstring restates the neighbour rule in prose. The code holds it in toLinkView through `neighborId`
    and `nodesById.get(neighborId)`, so the comment is a second home for the same fact.
  node: rules/graph-explorer/the-neighbour-is-the-other-end
- file: src/features/graph/api/traversal.transforms.ts
  where: the module docstring, lines 4-11 (spec references, link direction and neighbour lookup)
  evidence: "link direction: `link.source_node_id === nodeId` → \"→\" (outgoing,\n     label from `link.link_type`);\
    \ else \"←\" (incoming, label from\n     `link.link_inverse_name`)."
  cost: The docstring states the direction and wording rule a second time as prose. The code in toLinkView
    already holds it, so a reader may take the comment as the place the rule is decided. The comment cites
    a `docs/specs` path rather than the node, so it will not follow the node if the node moves.
  node: rules/graph-explorer/direction-picks-the-link-wording
- file: src/features/graph/api/traversal.types.ts
  where: the doc comment on `confidenceLabel` in `TraversalLinkView`, line 75
  evidence: '/** `"92%"`-style label for the link confidence. */

    readonly confidenceLabel: string;'
  cost: The percentage format is described in prose beside the type. The format is held by `formatConfidenceLabel`
    in `src/features/graph/api/_transforms.ts`, which `traversal.transforms.ts` calls. The comment is
    a second home for the format rule, and nothing reads it.
  node: rules/graph-explorer/confidence-is-a-rounded-percentage
- file: src/features/graph/api/traversal.types.ts
  where: the doc comments on `directionLabel` (lines 63-64) and `directionArrow` (line 67) in `TraversalLinkView`
  evidence: "/** Label rendered for the link kind — `link_type` for outgoing,\n *  `link_inverse_name`\
    \ for incoming, mirroring spec §9 transform. */\nreadonly directionLabel: string;\n...\n/** `\"→\"\
    ` for outgoing, `\"←\"` for incoming — used in the row arrow. */\nreadonly directionArrow: \"→\" |\
    \ \"←\";"
  cost: 'The wording-and-arrow rule is stated a second time in prose beside the type. The running code
    that holds it is in another file (`src/features/graph/api/traversal.transforms.ts`: `directionLabel:
    isOutgoing ? wire.link_type : wire.link_inverse_name,` and `directionArrow: isOutgoing ? "→" : "←",`).
    The comment also cites "spec §9", an authority that is not a node. If the node moves, the comment
    keeps asserting the old wording and nothing flags it.'
  node: rules/graph-explorer/direction-picks-the-link-wording
- file: src/features/graph/api/traversal.types.ts
  where: the header doc comment, lines 8-11
  evidence: 'The panel only consumes `depth=1&direction=both` so the surface trims the

    wire payload to the fields actually rendered.'
  cost: The request depth and direction are restated in prose in a file that does not issue the request.
    The code that holds them is `src/features/graph/api/useNodeRelationships.ts`, which builds `/traverse?depth=1&direction=both`.
    A change to the node would leave this comment stating the old values.
  node: rules/graph-explorer/relationships-are-read-at-depth-one-both-ways
- file: src/features/graph/api/use-graph-persistence.ts
  where: the GraphViewSnapshot doc comment, lines 27-30
  evidence: "/** Wire shape of the snapshot stored in chat_graph_view.snapshot.\n *  Discriminated by\
    \ `version` — TC-02 bumps to v2 with an additive\n *  `layout_algorithm` field. The hook accepts both\
    \ versions on restore so\n *  pre-TC-02 saved graphs keep working. */"
  cost: The version history and the "v2 adds layout_algorithm" rule are told in prose next to the type
    that declares them. The comment cites a ticket and a table name the node does not carry.
  node: rules/graph-explorer/a-saved-view-holds-positions-and-pins
- file: src/features/graph/api/use-graph-persistence.ts
  where: the catch comments, lines 104-106 and 147-149
  evidence: '// Restore is best-effort — a network error / 404 leaves the graph

    // in its cleared state (the user sees an empty graph until the next

    // turn produces a fresh delta). Do not surface the error.

    // Save is best-effort — a transient failure is silent. The next

    // user interaction will trigger another debounced save attempt.'
  cost: Prose states that failures are silent, and also what happens afterwards (the user sees an empty
    graph, the next interaction saves again). The empty catch blocks hold the silence, and the node holds
    no retry. A reader gets a second, wider account of failure behavior that the node does not state.
  node: rules/graph-explorer/view-failures-are-silent
- file: src/features/graph/api/use-graph-persistence.ts
  where: the header docblock, guards (a) and (b), lines 15-20, and the comments at lines 121 and 124-125
  evidence: '*    (a) skip save when nodes.size === 0 (never overwrite a saved graph

    *        with empty — also makes the clear() on switch a no-op for saving).

    *    (b) skip the store-write caused by hydrate() itself (justHydrated ref)'
  cost: The save-guard order (conversation, then at least one node, then the post-restore skip) is described
    a second time in prose beside the code that holds it. When the node moves, the comment keeps saying
    the old rule.
  node: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
- file: src/features/graph/api/use-graph-persistence.ts
  where: the header docblock, lines 1-21 ("SAVE (debounced ~800ms)")
  evidence: '* - SAVE (debounced ~800ms): subscribe to the store''s nodes/positions/

    *    layoutNonce identity — the 3 change points: graph_delta→addNodes,'
  cost: The 800 ms wait is stated in the docblock as "~800ms", approximate, while the code holds 800 exactly.
    A reader who trusts the comment gets a different number than the node, and the comment is a second
    home for the fact that nothing keeps in step with the node.
  node: rules/graph-explorer/a-save-waits-800-milliseconds
- file: src/features/graph/api/use-graph-persistence.ts
  where: the useEffect subscriber comment, lines 155-158, and the header docblock lines 12-14
  evidence: '// Fire on any of the 3 change points:

    //   1. addNodes       → nodes Map identity changes

    //   2. setNodePosition → positions Map identity changes

    //   3. resetLayout     → layoutNonce increments'
  cost: The save triggers are listed in prose a second time, with store action names the node does not
    use. The comment can drift from the `if` that holds the rule.
  node: rules/graph-explorer/a-save-follows-a-graph-change
- file: src/features/graph/api/useNodeDetail.ts
  where: the "Contract" docstring, lines 17-19, and the comment above `STALE_MS`, lines 38-39
  evidence: "*  - Stable data → `staleTime: 5 * 60_000` (5min, per spec §9).\n *  - `refetchOnWindowFocus:\
    \ false` — opening the panel after a tab switch\n *    must not flash spinner on cached node detail."
  cost: 'The five-minute freshness window and the no-refetch-on-focus rule are written again in prose,
    with a pointer to a section of the component spec. A reader can take that pointer as the place the
    value was decided. The values are held by `staleTime: STALE_MS` and `refetchOnWindowFocus: false`
    in this file.'
  node: rules/graph-explorer/a-read-stays-fresh-five-minutes
- file: src/features/graph/api/useNodeDetail.ts
  where: the "Contract" docstring, lines 20-22, and the comments in `queryFn` (line 56) and above the
    hook (lines 45-47)
  evidence: "*  - `enabled` gate — guards against `useQuery({ queryFn() called with\n *    undefined id\
    \ })` when the parent unmounts the panel mid-flight"
  cost: 'The rule that a read is never requested without a non-empty id is described again in prose. The
    condition itself is `enabled: typeof id === "string" && id.length > 0`. The comment "the cast is safe
    inside queryFn" depends on that condition and would go stale if it changed.'
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- file: src/features/graph/api/useNodeDetail.ts
  where: the "Error surface" docstring, lines 24-29
  evidence: "*  - `useQuery` exposes the raw `EnvelopeError` via `query.error`. [...]\n *    The hook\
    \ itself does NOT translate\n *    the error — the central `QueryCache.onError` mapper in\n *    `lib/error-routing.ts`\
    \ is the single error router."
  cost: The pass-through rule is stated in prose, along with a claim about which module is the single
    error router. The code holds the rule by having no catch or translation around `http<NodeDetailWire>(...)`.
    The routing claim describes a file outside this one.
  node: rules/graph-explorer/read-failures-pass-through-unchanged
- file: src/features/graph/api/useNodeDetail.ts
  where: the comment above the hook, lines 45-49
  evidence: "When `id` is missing we still produce a unique cache slot\n * (`__noop__`) to keep the key\
    \ shape stable."
  cost: The placeholder id is named in prose beside the code that uses it. The code holds it in `graphNodeKeys.detail(id
    ?? "__noop__")`, so the literal can be changed without the comment following.
  node: rules/graph-explorer/the-first-node-id-key-is-a-placeholder
- file: src/features/graph/api/useNodeDetail.ts
  where: the file docstring, lines 1-2, together with the header comment above `STALE_MS`
  evidence: '* useNodeDetail — GET /api/v1/nodes/:id (TC-FE-08).'
  cost: The request path is stated again in prose beside the code that builds it, `/api/v1/nodes/${encodeURIComponent(id
    as string)}`. If the contract moves, there are two places to change, and the comment can go stale
    without any check catching it.
  node: contracts/graph-explorer/bff-node-reads
- file: src/features/graph/api/useNodeRelationships.ts
  where: the file docstring, line 2-3 (header line)
  evidence: '* useNodeRelationships — GET /api/v1/nodes/:id/traverse?depth=1&direction=both'
  cost: The depth and direction of a node's relationships read are written a second time in prose beside
    the code that sends them. When the node changes, a reader can mistake this header for the place the
    rule lives, and `--check` never reaches a comment.
  node: rules/graph-explorer/relationships-are-read-at-depth-one-both-ways
- file: src/features/graph/api/useNodeRelationships.ts
  where: the file docstring, lines 10-12 (Spec references, first bullet)
  evidence: '*    "useNodeRelationships hook" — query key, staleTime 5min, enabled gate.'
  cost: 'The 5-minute freshness window is restated in a comment. Code holds it twice in this file (`STALE_MS`
    and `staleTime: STALE_MS`). The prose is a second home that would go stale unnoticed if the node moved.'
  node: rules/graph-explorer/a-read-stays-fresh-five-minutes
- file: src/features/graph/api/useProvenance.ts
  where: Docstring, lines 11-13 (the "Spec references" entry that cites staleTime 5min), above `const
    STALE_MS = 5 * 60_000;` at line 29
  evidence: '"useProvenance hook" — kind/id arguments, enabled gate, staleTime 5min.'
  cost: 'The five-minute freshness is held by code (`STALE_MS`, `staleTime: STALE_MS`, `refetchOnWindowFocus:
    false`) and by the node. The docstring restates it and cites a `docs/specs/` document as its authority,
    which points a reader to a second home for the fact.'
  node: rules/graph-explorer/a-read-stays-fresh-five-minutes
- file: src/features/graph/api/useProvenance.ts
  where: 'Docstring, lines 5-9 (the lazy-query paragraph), above the `enabled: enabled && id.length >
    0` gate at line 45'
  evidence: 'Lazy TanStack Query hook — the query stays disabled until the consumer

    sets `enabled` to `true` (i.e. the user expands a "Ver origem completa"

    `<details>` disclosure).'
  cost: The rule that a provenance read waits for the caller and needs a non-empty id is held by code
    on line 45 and by the node. The docstring says it a third time, so a change to the node would leave
    this prose describing a rule that no longer applies.
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: comment above the draggable and selectable props, lines 303-310
  evidence: "Draggable\n      // when a position-commit handler is wired (TC-FE drag, supersedes D5):\n\
    ...\n      // behaviour. `nodesConnectable` stays false — this is a read-only graph."
  cost: The drag-only-when-a-commit-is-wired rule is stated again as prose. It also cites a decision identifier,
    "supersedes D5", that no running code reads.
  node: rules/graph-explorer/nodes-drag-only-when-a-commit-is-wired
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: comment above the fitView props, lines 294-296
  evidence: "// Auto-fit when nodes change so a new turn's subgraph centres\n      // without the user\
    \ having to click \"fit\". The `padding: 0.1` keeps\n      // a 10% margin around the bounding box\
    \ (RF default is too tight)."
  cost: The fit-on-change rule and its 0.1 padding value are written a second time in prose beside the
    node that holds them.
  node: rules/graph-explorer/the-canvas-opens-at-three-quarters-zoom
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: comment above the top-right Panel, lines 320-324
  evidence: "Shown only when the canvas has at\n    least one visible node AND at least one of the controls\
    \ is wired:\n    a Panel with neither control is empty noise."
  cost: The condition for showing the controls is stated again as prose beside the node that holds it.
  node: rules/graph-explorer/layout-controls-need-nodes-and-a-handler
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: comment in the focusNode function, lines 210-214
  evidence: "`setCenter(x, y, { zoom, duration })` centers the viewport on\n        // a single point.\
    \ The node's `position` is the top-left; offset\n        // by half its measured size (when known)\
    \ so we centre on the\n        // node's geometric middle."
  cost: The rule that focusing centres on the node's middle is restated as prose and can drift from the
    node.
  node: rules/graph-explorer/focusing-a-node-centres-it-at-zoom-one
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: comment in the useImperativeHandle recenter function, line 224
  evidence: // "Reset to default" — clear pan/zoom to the canvas origin.
  cost: The recenter behaviour is restated as prose. The numeric values live in DEFAULT_VIEWPORT, so a
    reader may take the comment, rather than the node, as the statement of the rule.
  node: rules/graph-explorer/fit-and-recenter-take-300-milliseconds
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: comment inside GraphCanvas above visibleNodes, lines 161-168
  evidence: "When provided → mount only nodes whose id is in the Set, and only\n  //    edges whose BOTH\
    \ endpoints are in the Set (AC-F.15)."
  cost: The reveal-filter rule is written as prose a second time, together with a citation to a requirement
    identifier, AC-F.15, that code never reads.
  node: rules/graph-explorer/only-revealed-nodes-are-shown
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: comments beside the interaction flags, lines 310 and 314-315
  evidence: "`nodesConnectable` stays false — this is a read-only graph.\n...\n      // Pan/zoom are user-driven\
    \ — these are the React Flow\n      // defaults restated for clarity."
  cost: Both comments restate what the node holds, and the second one openly says the code is restated
    for clarity.
  node: rules/graph-explorer/the-owner-cannot-draw-links
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: docblock of toRfNodes, lines 92-94
  evidence: "Position falls back to {0, 0} when missing (the force pass hasn't run\n *   yet for this\
    \ id)."
  cost: The (0, 0) fallback is stated a second time as prose, alongside the node that holds it.
  node: rules/graph-explorer/a-node-without-position-sits-at-the-origin
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: header docblock, lines 10-11, and the handleNodeClick docblock, lines 235-237
  evidence: "Translate React Flow's `onNodeClick(event, node)` to the spec's\n *    `onNodeSelect(nodeId)`\
    \ callback (view-only — never a chat mutation).\n...\n   * View-only: we never trigger a chat mutation\
    \ or navigation."
  cost: The rule that a node click is only reported as an id is also written as prose here. If the node
    moves, nobody will think to update the comment, and the comment can end up contradicting it.
  node: rules/graph-explorer/a-node-click-only-reports-the-node-id
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the comment at lines 175-176 above `aria-hidden="true"`
  evidence: '// `aria-hidden` on the edge — relationship info is announced via

    // node aria-labels + NodeDetailPanel (§8 accessibility).'
  cost: The rule and a rationale, which is itself a fact about how relationships are announced, are in
    a comment citing §8. No node holds that rationale, so the comment becomes its only home.
  node: rules/graph-explorer/a-link-is-hidden-from-assistive-technology
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the comments at lines 122-124 and 129-131 above the two early `return null`
  evidence: '// Defensive: React Flow may briefly call the edge renderer without `data`

    // during reconciliation (e.g. mid-reveal). Render nothing in that case


    // nothing — `getEdgeParams` returns `null` to signal the unmeasured

    // state explicitly (no fallback to 0/0 — see GraphEdge.spec §6).'
  cost: The no-draw rule appears again in prose with an authority citation (GraphEdge.spec §6). A change
    to the node will not reach it.
  node: rules/graph-explorer/a-link-needs-data-and-measured-nodes
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the docstring of `LINK_STROKE_CLASS` and `FALLBACK_STROKE_CLASS`, lines 45-57 and 74
  evidence: '* the Tailwind v4 scanner keeps every variant ... The 13 link types are the normative

    * catalog from

    * `remember-modelagem-v7.md §15.2` + tokens.md §7.


    /** Neutral fallback for unknown link slugs (open ontology — G-B). */'
  cost: The fallback rule for an unknown type is also stated in prose, citing "G-B" and v7 §15.2, so the
    authority is attributed to a document and not to the node. The code holds it anyway in `LINK_STROKE_CLASS[data.label]
    ?? FALLBACK_STROKE_CLASS`.
  node: rules/graph-explorer/a-link-is-coloured-by-its-type
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the header docstring, lines 10-11, and the comment at line 161
  evidence: '* `opacity-40` when `data.inEffect === false` OR `data.state ===

    *    "superseded"` (out-of-effect / historical edge, GraphEdge.spec §3).


    // Dim out-of-effect or superseded edges (§3 — "Out of effect" / "Superseded").'
  cost: The dimming rule is stated in prose against the component spec, a second home outside behaviour.
    A change to the node will not reach it.
  node: rules/graph-explorer/a-link-is-dimmed-when-out-of-effect
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the header docstring, lines 12-17
  evidence: '* The catalog-resolved **pt-BR display label** (`data.linkTypeLabel`)

    *    rendered as a small centred label via `EdgeLabelRenderer`, using the

    *    `text-xs` token. The slug (`data.label`) is **never** rendered as

    *    text'
  cost: The label rule is restated in prose citing "GraphEdge.spec §1, §2, §7 scenarios 7 / 8". Code holds
    it too, so this only adds a second home that a node change will not reach.
  node: rules/graph-explorer/a-link-shows-the-catalog-label
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the header docstring, lines 5-6, and the comment at lines 151-152 above `isDashed`
  evidence: '* Solid stroke when `data.isTemporal === true`; dashed (`4 4`) otherwise


    // Dash pattern: per §3, `uncertain` always reads as dashed (uncertainty

    // supersedes the temporal/stable visual). Otherwise `isTemporal` drives it.'
  cost: The dash rule is written a second time in prose, and the comments cite `tokens.md §7`, `AC-F.11`
    and a component spec §3 as its authority. A reader who follows those citations will look for the rule
    outside the specification, and a node edit will not reach the comments.
  node: rules/graph-explorer/a-link-is-dashed-unless-temporal-and-sure
- file: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  where: the header docstring, lines 7-9, and the docstring of `stateStrokeClass`, lines 77-89
  evidence: '* Confidence-state colour overrides (uncertain / disputed / superseded)

    *    via the `--color-state-*` tokens. When no override is active, the

    *    stroke uses the LinkType colour token (`--color-link-{label}`).


    *  - accepted   → no override

    *  - low-confidence → no override (not normally rendered on edges; the'
  cost: The precedence of state over type is stated again in prose, with colour names (amber, orange,
    muted grey) that no node holds. The comments cite `GraphEdge.component.spec.md §3` as the source.
    The next reader of the code takes the comment for the decision.
  node: rules/graph-explorer/a-weak-state-overrides-the-type-colour
- file: src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx
  where: the file docstring, lines 2-7, and the comment above GRAPH_EMPTY_STATE_COPY, lines 29-30
  evidence: "\" * Rendered by `GraphSpace` when `status === \"empty\"` ... Centered, static pt-BR copy;\
    \ no spinner,\n * no animation, no callback.\" and \"/** Static pt-BR copy. Lives at module scope\
    \ so tests can import + assert\n *  identical strings without re-typing them (`text-as-data` pattern).\
    \ */\""
  cost: 'The docstring restates the node''s "no spinner and no action" in prose, and the node''s copy
    requirement sits beside it as a second home outside behavior. If the node moves, `--check` does not
    reach this prose, and the next reader may take the comment as the rule. The code already holds both
    facts: `GRAPH_EMPTY_STATE_COPY` is the exact string, and the component renders only a `<p>`, with
    no spinner element and no callback prop. The pair conforms. What is owed is removal of the prose.'
  node: rules/graph-explorer/empty-state-tells-where-memory-will-appear
- file: src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
  where: the comment above HANDLE_CLASSES, lines 30-44
  evidence: 'The handles MUST remain in the DOM

    — React Flow still uses them to recognise this node as a routing

    endpoint and to read the cardinal `Position` for the bezier handle

    direction — but they MUST NOT be visible or interactive. `opacity-0`

    removes the visual; `pointer-events-none` removes the hit area so the

    handle never intercepts node drag/click events.'
  cost: The comment says in prose that the link endpoints are invisible and inert. The code already holds
    this through `isConnectable={false}`, `aria-hidden="true"` and the `opacity-0 pointer-events-none`
    classes in HANDLE_CLASSES. The prose is a second home for the node's rule. Anyone who edits the rule
    will see the comment as one more place to keep in step.
  node: rules/graph-explorer/a-node-s-link-endpoints-are-inert
- file: src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
  where: the file header docstring, lines 7-12 (items 2 and 3 of the adapter's responsibilities)
  evidence: '* 2. Maps `NodeProps<GraphNode>.data` (a `GraphNodeData` payload) to the

    *         presentational `GraphNodeProps`.

    *      3. Forwards React Flow''s `selected` flag so the node renders its

    *         focus ring when the user selects it.'
  cost: The docstring says in prose that the node is drawn with its type, label, optional state, optional
    subtitle and selected flag. The component body already does this (`<DsGraphNode type={data.type} label={data.label}
    {...stateProp} {...subtitleProp} selected={selected ?? false} />`). A reader can take the docstring
    as a second home for the fact, and it will not move when the node does.
  node: rules/graph-explorer/a-node-is-drawn-with-its-type-label-state-and-selection
- file: src/features/graph/components/GraphSpace/GraphSpace.tsx
  where: comment at lines 175-178 above `revealStaggerMs = DEFAULT_REVEAL_STAGGER_MS`
  evidence: '// Consumed by `useGraphReveal` (TC-FE-09). Default in this layer must

    // mirror GraphSpace.component.spec.md §2 (90ms). The hook also exports

    // its own DEFAULT_REVEAL_STAGGER_MS — both sources are kept in sync via

    // a shared constant.'
  cost: The comment states a literal gap of 90ms that no node holds. The node says only that the default
    is the reveal step's own default gap. The code takes that default by importing the constant, and the
    literal 90 sits in `src/features/graph/hooks/useGraphReveal.ts` (`export const DEFAULT_REVEAL_STAGGER_MS
    = 90;`). A reader who trusts the comment treats 90ms as decided here.
  node: rules/graph-explorer/the-pane-reveals-at-the-hooks-default-gap
- file: src/features/graph/components/GraphSpace/GraphSpace.tsx
  where: comments at lines 107-119 above `setNodePosition`, `resetLayout`, `layoutAlgorithm` and `setLayoutAlgorithm`
  evidence: '// Drag-and-drop commit (TC-FE drag). The store action pins the dragged

    // node; `useForceLayout` honours the pin on the next force pass.

    // "Reorganizar" (Phase 2) — re-flow the layout, discarding user drags.

    // TC-02 — algorithm picker.'
  cost: 'The comments restate which store action each canvas control is wired to, and add claims about
    pinning and discarding drags. The code holds the wiring: `onNodePositionCommit={setNodePosition}`,
    `onResetLayout={resetLayout}`, `layoutAlgorithm={layoutAlgorithm}` and `onLayoutAlgorithmChange={setLayoutAlgorithm}`.
    The pinning and discarding claims belong to the store''s own nodes.'
  node: rules/graph-explorer/the-pane-wires-the-owner-s-arrangement-to-the-store
- file: src/features/graph/components/GraphSpace/GraphSpace.tsx
  where: comments at lines 192-194 above `isBusy`, and at lines 205-207 above the `aria-busy` spread
  evidence: '// `aria-busy="true"` only while the graph is actively in flight or

    // animating in — covers `loading` AND `revealing` per spec §8.

    // `aria-busy` reflects in-flight state for assistive tech (spec §8).'
  cost: 'The busy rule is stated twice in prose and cites a spec section. The code already holds it in
    `isBusy = status === "loading" || status === "revealing"` and `{...(isBusy ? { "aria-busy": true }
    : {})}`. The citation points at a document rather than the node.'
  node: rules/graph-explorer/pane-is-busy-only-while-loading-or-revealing
- file: src/features/graph/components/GraphSpace/GraphSpace.tsx
  where: header docblock line 18, the composition sketch
  evidence: '*   <section role="region" aria-label="Grafo de conhecimento">'
  cost: The accessible name appears in a docblock sketch as well as in the JSX. A change to the name would
    have to reach two places, and the sketch would stay stale.
  node: rules/graph-explorer/pane-is-a-region-named-after-the-graph
- file: src/features/graph/components/GraphSpace/GraphSpace.tsx
  where: header docblock lines 10-14, and the comment at lines 128-129 above `overlayVariant`
  evidence: '*   - `loading` / `error`         → `GraphStatusOverlay` over the canvas

    *                                    (canvas remains visible when prior

    *                                    nodes existed — overlay is a partial

    *                                    scrim).

    // Loading / error overlay variant. `null` skips the overlay entirely

    // for `revealing` / `ready` — the canvas is fully visible.'
  cost: The overlay rule is stated in prose a second time. The code that holds it is `overlayVariant`
    and the `GraphStatusOverlay` rendered after `GraphCanvas`. The comment adds "partial scrim", which
    is a visual detail no node holds. The comment is where a reader would look for the rule, but it is
    not what runs.
  node: rules/graph-explorer/loading-and-error-overlay-the-canvas
- file: src/features/graph/components/GraphSpace/GraphSpace.tsx
  where: header docblock lines 26-30, and the comment at lines 222-225 above `<ReactFlowProvider>`
  evidence: '* provider stays mounted across status transitions so the React Flow

    * instance is stable — toggling the provider would re-create the viewport

    // Provider stays mounted across loading/revealing/ready/error so

    // the React Flow instance + viewport survive status transitions.'
  cost: The mounted-canvas rule is restated twice in prose. The ternary on `showEmptyState` holds it,
    and `ReactFlowProvider` and `GraphCanvasRegion` are rendered in every non-empty branch. If the node
    changes, the two comments stay behind and a reader will believe them over the ternary.
  node: rules/graph-explorer/the-canvas-stays-mounted-outside-the-empty-state
- file: src/features/graph/components/GraphSpace/GraphSpace.tsx
  where: header docblock lines 9 and 19 (the `empty` bullet and the `{status==="empty" && <GraphEmptyState
    />}` composition line), and the comment at lines 184-189 above `showEmptyState`
  evidence: '* - `empty`                     → `GraphEmptyState` (no canvas mounted).

    // The empty-state shortcut: spec §3 rule — "when status is ''empty'' and

    // the pane has never had data, only `GraphEmptyState` is shown (no

    // canvas)".'
  cost: Three comments restate when the empty state shows alone. `showEmptyState = status === "empty"
    && nodes.length === 0` already holds that. The comments word the condition as "never had data", while
    the node and the code say "holds no nodes". When the node moves, the comments keep the old wording
    and nothing flags them.
  node: rules/graph-explorer/empty-status-without-nodes-shows-only-the-empty-state
- file: src/features/graph/components/GraphSpace/GraphSpace.types.ts
  where: Docblock of the `onNodeSelect` prop, lines 49-51
  evidence: "/** View-only callback fired when a node is clicked. Used by parent to\n *  mount `NodeDetailPanel`.\
    \ Never causes a chat mutation. */\nonNodeSelect?: (nodeId: string) => void;"
  cost: 'The rule that a click is passed on as the node id and nothing else is also written as prose.
    The signature `(nodeId: string) => void` in this file already carries only the id, so the pair conforms.
    The comment is a second statement of the rule that would go stale unnoticed if the node moved.'
  node: rules/graph-explorer/a-node-click-only-reports-the-node-id
- file: src/features/graph/components/GraphSpace/GraphSpace.types.ts
  where: Docblock of the `status` prop, lines 39-41
  evidence: "/** Processing state of the graph pane (REQ-2). Drives overlay /\n *  empty-state rendering.\
    \ Exactly 5 values — no `\"idle\"` (I-4). */\nstatus: GraphStatus;"
  cost: The five phases and the absence of `"idle"` are said again in prose, outside the node that holds
    them. The enumeration is declared as code in src/features/graph/types.ts (`export type GraphStatus
    = "empty" | "loading" | "revealing" | "ready" | "error";`), so the pair conforms. If the node's values
    change, this comment keeps asserting the old count and nothing flags it.
  node: domain/graph-explorer/graph-pane-status
- file: src/features/graph/components/GraphSpace/GraphSpace.types.ts
  where: Header docblock, lines 5-6, restating the pane's input contract
  evidence: '* `useGraphStore`) — it is a sink (no writes to the store from here).'
  cost: 'The caller-fed, no-write half of the pane rule is also said in prose here, a second home for
    a fact the node holds. If the node moves, nothing reaches this comment, and the next reader can take
    it as the rule''s authority. The props that carry the fact are declared in this same file (`nodes:
    readonly GraphNodeData[]`, `status: GraphStatus`, `errorMessage?: string`), so the pair conforms and
    what is owed is removing the prose.'
  node: rules/graph-explorer/pane-is-a-region-named-after-the-graph
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
  where: the comment above the message span's className, lines 113-115
  evidence: '// Truncate horizontally instead of wrapping more than two

    // lines — error messages from the backend are usually short

    // sentences; long-form goes to the chat bubble.'
  cost: Prose restates the two-line clamp that "min-w-0 line-clamp-2" already enforces. It adds a claim
    about backend message length and the chat bubble that no code and no node in this set holds.
  node: rules/graph-explorer/the-overlay-message-is-two-lines-at-most
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
  where: the file header comment line 12 and the comment above GRAPH_STATUS_LOADING_COPY, lines 37-38
  evidence: '*  - `loading` — frosted glass panel with the spinner and "Buscando na memória…".'
  cost: Prose restates the loading overlay's text and spinner a second time. The code holds both, in the
    constant and in the Loader2 branch, so the comment is a second home for the fact outside behavior.
  node: rules/graph-explorer/loading-overlay-says-it-is-searching
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
  where: the file header comment lines 12-14 and 19, and the comment above GRAPH_STATUS_ERROR_DEFAULT_COPY
    lines 41-42
  evidence: "*  - `error`   — same surface with an error-coloured accent and the error\n *           \
    \     blurb (or a default pt-BR sentence when no message is given).\n...\n *  - No retry button (I-6\
    \ from temp/chat-graphspace-plan.md §6.7)."
  cost: Prose states the node's rule (error message or the default, and no action) a second time. The
    code already holds it, in the message expression and in the absence of any control in the JSX. The
    comment cites temp/chat-graphspace-plan.md as the authority, so a reader looking for the rule's home
    is sent to a document that is not the specification.
  node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
  where: the file header comment lines 16-18 and the comment above role/aria-live, lines 73-75
  evidence: "*  - `aria-live=\"polite\"` — status changes are announced to assistive tech\n *    without\
    \ yanking focus (GraphSpace.component.spec.md §8)."
  cost: Prose restates the polite status region rule and cites GraphSpace.component.spec.md as its authority.
    The code holds the rule in role="status", aria-live="polite" and the aria-label on the card, so a
    reader may take the cited document, not the node, as the place where the rule lives.
  node: rules/graph-explorer/the-overlay-is-a-polite-status-region
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
  where: docblock on GraphStatusOverlayVariant, lines 25-28
  evidence: "statuses that do not paint an overlay\n *  (`empty`/`revealing`/`ready`) never reach this\
    \ component."
  cost: The comment names three of the five pane phases. The enumeration is declared as `GraphStatus`
    in src/features/graph/types.ts. If a phase is added or renamed, this comment keeps the old list and
    nothing reaches it, because it is prose.
  node: domain/graph-explorer/graph-pane-status
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
  where: header docblock, "Variant — `error`" bullets, lines 15-17
  evidence: "Renders an error-styled glass panel with `errorMessage` (optional;\n  falls back to a default\
    \ pt-BR sentence when absent).\n - No retry button (I-6 from the plan: \"informa, sem retry\")."
  cost: 'The message-or-default rule and the "no action" rule are restated as prose here. The code holds
    both in GraphStatusOverlay.tsx: `errorMessage ?? GRAPH_STATUS_ERROR_DEFAULT_COPY`, and no button rendered.
    The prose cites a plan item as the authority, which points the next reader away from the node that
    holds the rule.'
  node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
  where: header docblock, "Variant — `loading`" bullet, lines 11-12
  evidence: "`aria-live=\"polite\"` (GraphSpace.component.spec.md §8 row \"Status\n overlay announced\"\
    )."
  cost: The announcement politeness is stated in prose beside a props contract that does not carry it.
    The behaviour lives in GraphStatusOverlay.tsx as `role="status"` and `aria-live="polite"`. The docblock
    is a second home that can drift from both the node and that code.
  node: rules/graph-explorer/the-overlay-is-a-polite-status-region
- file: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
  where: header docblock, "Variant — `loading`" bullet, lines 9-10
  evidence: Renders the spinner + the pt-BR copy "Buscando na memória…".
  cost: The loading copy is written in a second place that nothing reads. When the node's wording moves,
    this docblock keeps the old text and a reader of the types file takes it as the decided copy. The
    running code holds the same string as GRAPH_STATUS_LOADING_COPY in GraphStatusOverlay.tsx.
  node: rules/graph-explorer/loading-overlay-says-it-is-searching
- file: src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  where: the comment above `const provenance = attr.provenance ?? [];` in NodeAttributeRow, lines 121-123
  evidence: '// Defensive against legacy fixtures or wire payloads missing `provenance` —

    // the transform fills `[]` by default, but tests may shape `NodeAttributeView`

    // by hand. A missing `provenance` should hide Phase A, not crash the panel.'
  cost: The comment restates that an attribute with no provenance list gets an empty one. The code holds
    that fact here in `attr.provenance ?? []`, and in `_transforms.ts`, where the comment says the transform
    fills `[]`. The prose is a second home that no running system emits.
  node: rules/graph-explorer/an-attribute-without-provenance-has-an-empty-list
- file: src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  where: the file's header docstring, lines 6-12, the lines describing the "Proveniência" disclosure (Phase
    A)
  evidence: "- Phase A — \"Proveniência\" (inline from `attribute.provenance[]`, no\n  extra fetch);"
  cost: The docstring states, in prose, that the inline provenance disclosure exists and reads no extra
    data. The code holds this fact too, in `InlineProvenance` and in the `hasInlineProvenance &&` gate
    in this file. A second home for the fact sits outside any behaviour. When the node moves, nothing
    reads or updates the prose.
  node: rules/graph-explorer/inline-provenance-needs-an-entry
- file: src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  where: the file's header docstring, lines 6-12, the lines describing the "Ver origem completa" disclosure
    (Phase C)
  evidence: "- Phase C — \"Ver origem completa\" (lazy `useProvenance('attributes', id)`,\n  enabled only\
    \ when expanded)."
  cost: The docstring restates that the full origin is read lazily, only while the disclosure is open.
    The code holds this fact too, in `useProvenance("attributes", attributeId, open)` and in `{open &&
    (`. The prose is a second home outside behaviour and goes stale when the node moves.
  node: rules/graph-explorer/every-item-offers-its-full-origin
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  where: the doc comment above originalInputRedacted, line 54
  evidence: /** Muted indicator shown when `original_input === '[REDACTED]'`. */
  cost: The comment restates the sentinel condition that rules/graph-explorer/a-redacted-original-input-is-never-shown
    holds. Code already holds that condition, so the comment is a second home outside behavior. When the
    rule moves, this comment will still say the old condition.
  node: rules/graph-explorer/a-redacted-original-input-is-never-shown
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts
  where: the header docblock, lines 1-15
  evidence: '* The "Curar" button on the panel header surfaces two distinct curation

    * targets, mutually exclusive:

    *  - `needs_review` nodes belong to the **entity_match** queue (BFF emits

    *    one queue row per `needs_review` node — keyed by `node_id`).

    *  - Nodes with at least one `uncertain`/`disputed` attribute have a

    *    contextual `disputed` target (uncertain is a display flag, not a

    *    dedicated queue, so the drawer surfaces it via the disputed family +

    *    the attribute id).'
  cost: 'The docblock states in prose the same rule that `deriveCurationTarget` implements: the entity-match
    target for `needs_review`, otherwise the disputed target for an `uncertain` or `disputed` attribute,
    otherwise none. If the node moves, the comment keeps asserting the old rule. Nothing checks it, and
    a reader may take it for the authority. The comment also describes the queue and display-flag semantics,
    and no code here carries those.'
  node: rules/graph-explorer/curation-target-follows-the-node
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  where: the docstring of classifyError, lines 17-18
  evidence: "/** Classify a top-level `useNodeDetail` error code into the state row to\n *  render. 404\
    \ / 410 are terminal — only `generic` gets a retry button. */"
  cost: The docstring restates the classification and retry rule a second time as prose. It also speaks
    of HTTP statuses 404 and 410, while the code keys on the codes RESOURCE_NOT_FOUND and BUSINESS_NODE_DELETED.
    If the node moves, this text is not reached by `--check`, and it names different identifiers from
    the ones the code uses. The code holds the fact at lines 20-24 and at `const showRetry = variant ===
    "generic";`.
  node: rules/graph-explorer/a-failed-node-read-is-an-alert
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  where: the comment at line 82 above handleDrawerOpenChange
  evidence: // Restore focus to the trigger when the drawer closes (FL-CURATION-03 §7).
  cost: The focus-return rule is restated beside its implementation, `if (!next) { requestAnimationFrame(()
    => { curateButtonRef.current?.focus(); }); }`. The citation names a flow document, not a node.
  node: rules/graph-explorer/closing-the-drawer-returns-focus-to-curar
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  where: the comment at lines 72-73 above `drawerOpen`
  evidence: '// CurationDrawer open state (TC-07). Local — the drawer never changes the

    // URL (spec §3 row "CurationDrawer abre"), so the parent route is unaware.'
  cost: 'The no-address-change fact is held by code: `const [drawerOpen, setDrawerOpen] = useState(false);`
    and `onCurate={() => setDrawerOpen(true)}`, with no navigation anywhere in the file. The comment repeats
    it and cites a spec row by title instead of by node.'
  node: rules/graph-explorer/curar-opens-the-drawer-for-the-target
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  where: the file's header docstring, lines 4-5 ("fetches `GET /api/v1/nodes/:id` via `useNodeDetail(nodeId)`")
  evidence: '* v1 (TC-FE-08) — fetches `GET /api/v1/nodes/:id` via `useNodeDetail(nodeId)`'
  cost: The docstring is a second home for the read-by-id fact, which the code already holds with `const
    query = useNodeDetail(nodeId);`. The route it quotes is also stated here by hand, so if the route
    moves, the comment keeps asserting the old one and nothing flags it.
  node: rules/graph-explorer/the-panel-reads-the-node-by-id
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  where: the header docstring line 28 ("`Escape` fires `onClose`") and the comment at lines 95-96 above
    onKeyDown
  evidence: '*  - `Escape` fires `onClose`.

    // Escape closes (spec §8). Attached to the panel root so the listener

    // auto-cleans when the panel unmounts.'
  cost: Two prose copies of the Escape rule sit beside the code that holds it, `if (event.key === "Escape")
    { event.preventDefault(); onClose(); }` wired as `onKeyDown` on the panel root. The "spec §8" citation
    points at a section number, not at a node.
  node: rules/graph-explorer/escape-closes-the-panel
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  where: the header docstring line 29 ("Close button receives focus on mount") and the comment at lines
    76-77 above the useEffect
  evidence: '*  - Close button receives focus on mount.

    // Spec §8 — focus the close button on mount so keyboard users can dismiss

    // immediately. The `nodeId` dep re-focuses when the panel swaps nodes.'
  cost: The focus rule is restated twice in prose while the code holds it in `useEffect(() => { closeRef.current?.focus();
    }, [nodeId]);`. The comment also repeats the node-change trigger, which the dependency array already
    encodes.
  node: rules/graph-explorer/the-close-button-takes-focus
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  where: the header docstring, Accessibility block, line 25
  evidence: '*  - `role="complementary"` + `aria-label="Detalhes do nó: <label>"`.'
  cost: 'The accessible name is stated in prose and in code. The code is the `role="complementary"` and
    `aria-label={`Detalhes do nó: ${resolvedLabel}`}` on the GlassSurface, with `resolvedLabel = query.data?.canonicalName
    ?? nodeLabel ?? "carregando"`. A reader changing the name has two places to keep in step, and the
    specification is a third.'
  node: rules/graph-explorer/the-panel-is-a-region-named-after-the-node
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  where: the header docstring, Accessibility block, line 27
  evidence: '*  - Error state announces via `role="alert"`.'
  cost: 'The docstring restates the alert rule for a failed read. Within this file only the dispatch is
    code: `else if (query.isError) { const variant = classifyError(query.error); body = (<ErrorView ...
    onRetry={() => { void query.refetch(); }} />`. The `role="alert"` attribute itself is not in this
    file. It sits in ErrorView, which the candidate index binds to the node under NodeDetailPanel.shell.tsx,
    and I did not read that file because it is outside the file set. If the alert is ever dropped there,
    this line goes on claiming it.'
  node: rules/graph-explorer/a-failed-node-read-is-an-alert
- file: src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  where: the `originalInput` prop docblock (lines 65-70) and the JSX comment at line 128
  evidence: '*  - non-null, non-`''[REDACTED]''` string → render disclosure block.

    *  - `null` / `undefined` → render nothing.

    {/* TC-04 (v2.1) — original_input three branches: disclosure / muted indicator / silence. */}'
  cost: The verbatim-disclosure and the nothing-when-absent rules are stated again in prose. The code
    holds both (`typeof originalInput === "string" && originalInput !== REDACTED_SENTINEL` renders the
    `<details>` with `whitespace-pre-wrap`; `null` and `undefined` match no branch).
  node: rules/graph-explorer/an-original-input-is-shown-verbatim
- file: src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  where: the comment on REDACTED_SENTINEL (lines 74-75), and the `originalInput` prop docblock (lines
    65-70)
  evidence: "/** Sentinel value the BFF writes to `original_input` after a §11\n * `compliance_delete`\
    \ redacts the row. Must NEVER be rendered verbatim. */"
  cost: The never-show-the-sentinel rule is restated in prose, with a claim about what the BFF writes
    and why. The code holds the rule (`originalInput !== REDACTED_SENTINEL` on the disclosure, `=== REDACTED_SENTINEL`
    on the muted indicator), so this is a second home outside behavior.
  node: rules/graph-explorer/a-redacted-original-input-is-never-shown
- file: src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  where: the docblock of classifyProvenanceError, lines 37-41
  evidence: '* Codes are namespaced (`RESOURCE_NOT_FOUND`, `BUSINESS_RAW_INFORMATION_DELETED`,

    * `SYSTEM_*`). Anything else falls back to `generic`.'
  cost: The comment says any other code is `generic`. The node, and the code under the comment (`return
    "unknown";`), make `generic` only a `SYSTEM_` code and `unknown` everything else. A reader who trusts
    the comment will look for a `generic` fallback that does not exist. The two variants read the same
    wording today, so the mismatch is invisible on screen.
  node: rules/graph-explorer/an-origin-failure-is-classified-by-its-code
- file: src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  where: 'the header docblock, line 18 ("When loading: `aria-busy="true"` on the body and a live region")'
  evidence: '*  - When loading: `aria-busy="true"` on the body and a live region.'
  cost: The busy and polite-announcement rule is stated in prose while the pending branch holds it (`aria-busy="true"`,
    `aria-live="polite"`). A change to the node would leave this comment claiming the old rule.
  node: rules/graph-explorer/the-origin-body-checks-pending-failure-then-data
- file: src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  where: 'the header docblock, lines 17-21 (Accessibility, "410 (tombstoned) is permanent — no retry button"
    and "When error: `role="alert"`")'
  evidence: '*  - When error: `role="alert"` on the error notice.

    *  - 410 (tombstoned) is permanent — no retry button.'
  cost: The alert and no-retry-when-deleted rule is stated in prose as well as held by the `role="alert"`
    div and `showRetry = variant !== "deleted"`. The prose speaks of an HTTP 410, while the node and the
    code speak of the variant `deleted`. A second wording of the rule sits where the next reader will
    look for it.
  node: rules/graph-explorer/an-origin-failure-is-an-alert-with-a-retry-unless-deleted
- file: src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
  where: the comment above `badgeState`, lines 112-115
  evidence: "// The wire AssertionStatus enum doesn't include \"active\" — we pass\n  // \"accepted\"\
    \ (the closest analogue for a live link) since the row only\n  // surfaces the effective status badge;\
    \ the inner assertion status is not\n  // consumed at the row level beyond the disputed/superseded\
    \ fallback."
  cost: The rule that the badge comes from the effective status with the assertion status taken as accepted
    is restated as a rationale. The rationale is a claim about the wire enum that no node holds. The code
    holds the rule itself in `mapAttributeStatusToBadge(link.effectiveStatus, "accepted")`.
  node: rules/graph-explorer/a-relationship-badge-follows-its-effective-status
- file: src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
  where: 'the header docstring, lines 1-15 (the row composition: direction arrow, link type, neighbor
    name, confidence, status badge)'
  evidence: "The row\n * shows direction arrow, link type, neighbor name, confidence,\n * temporal/effective-status\
    \ badge, and two stacked disclosures:"
  cost: The row's composition is written a second time in prose that no running system emits. If the node
    changes, this docstring keeps the old order, and nothing reaches it, because the check only follows
    files a node is bound to.
  node: rules/graph-explorer/a-relationship-row-shows-arrow-type-neighbour-confidence-and-status
- file: src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
  where: the header docstring, lines 5-11 (the two stacked disclosures and the lazy read)
  evidence: "*  - \"Proveniência do link\" — inline `link.provenance[]` (no extra fetch).\n *  - \"Ver\
    \ origem completa\" — lazy `useProvenance('links', linkId)`, enabled\n *    only when expanded."
  cost: The rule that provenance is read only while the disclosure is open is stated again in prose. The
    code holds it at `useProvenance("links", linkId, open)`. A reader can take the docstring for the place
    the rule is decided.
  node: rules/graph-explorer/every-item-offers-its-full-origin
- file: src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
  where: the header comment, lines 6-10 (the four-state list)
  evidence: '* Owns the `useNodeRelationships(nodeId)` call and renders the four states

    * declared in the spec:

    *  - loading            → spinner + live copy

    *  - empty (`links=[]`) → "Nenhuma relação encontrada."'
  cost: 'The comment says again, outside any behaviour, the loading and empty wording and the empty-list
    condition that the node holds. The wording is also held in code in src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
    (`relationshipsEmpty: "Nenhuma relação encontrada."`). If the node''s wording moves, the comment still
    reads as the current rule. No check reaches it.'
  node: rules/graph-explorer/relationships-say-loading-or-none
- file: src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
  where: the header comment, lines 9-10 (the error state)
  evidence: '*  - error              → "Não foi possível carregar as relações." + retry'
  cost: The comment says again the alert wording and the retry action that the node holds. Both are also
    held in code in this file (`role="alert"` with `query.refetch()`) and in NodeDetailPanel.copy.ts.
    A second statement in a comment lets a reader mistake it for the place the wording is decided.
  node: rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry
- file: src/features/graph/hooks/useForceLayout.ts
  where: the comment above the dispatch switch, lines 279-282
  evidence: '// `runForceLayout` remains the default and the existing tests still

    // pin its pin-preserving behaviour.'
  cost: 'The force-by-default rule is restated in prose. The code that holds the fallback is `case "force":
    default: next = runForceLayout(nodeIds, linkPairs, pinned);`. The default value of the algorithm itself
    sits in graph-store.ts, which is not part of this file set.'
  node: rules/graph-explorer/layout-defaults-to-force
- file: src/features/graph/hooks/useForceLayout.ts
  where: the comment above the link filter in runForceLayout, lines 169-172
  evidence: '// Drop links whose endpoints are not part of this nodeIds set — d3-force

    // would otherwise throw or create a phantom node. (`removeNodes` already

    // drops orphan links from the store, but the hook still defends the'
  cost: The rule that links without both endpoints are left out is restated in prose, together with a
    claim about what the store does that no node in this set holds. The code that holds the rule here
    is `.filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))`.
  node: rules/graph-explorer/links-with-a-missing-endpoint-are-left-out-of-layouts
- file: src/features/graph/hooks/useForceLayout.ts
  where: the comments on layoutNonce and on the effect's start, lines 235-237 and 254-255
  evidence: '// A "Reorganizar" reset run ignores the pin set so every node re-flows;

    // a normal (delta-driven) run pins existing/user-placed nodes (AC-F.12).'
  cost: 'The counter-change rule is restated as prose, together with a UI label that this file does not
    emit. The code that holds the rule is `const pinned = isReset ? new Map<string, GraphPosition>() :
    positionsRef.current;`, where `isReset` is `prevNonceRef.current !== layoutNonce`.'
  node: rules/graph-explorer/a-counter-change-places-every-node-again
- file: src/features/graph/hooks/useForceLayout.ts
  where: the docstrings on NODE_FOOTPRINT, COLLIDE_RADIUS, LINK_DISTANCE, CHARGE_STRENGTH and CENTER_X/CENTER_Y,
    lines 73-100
  evidence: "/** Footprint reserved per node, in canvas units — the widest node card\n *  (`GraphNode`\
    \ is `max-w-3xs` ≈ 256px) plus margin. Shared calibration with\n...\n/** Center of the simulation\
    \ field. Coordinates are in canvas units; React\n *  Flow's `defaultViewport` is configured to fit.\
    \ (0, 0) keeps the math"
  cost: The footprint, collision radius, link distance, charge and centre are explained a second time
    in prose, along with a figure of about 256px for the card width that no node states. When the node's
    numbers change, the comments still give the old rationale. The code that holds the values is `const
    NODE_FOOTPRINT = 270;`, `const COLLIDE_RADIUS = NODE_FOOTPRINT / 2;`, `const LINK_DISTANCE = NODE_FOOTPRINT;`,
    `const CHARGE_STRENGTH = -300;` and `const CENTER_X = 0;` in this file.
  node: rules/graph-explorer/force-layout-keeps-nodes-270-apart
- file: src/features/graph/hooks/useForceLayout.ts
  where: the header docstring lines 26-31 and the SIM_TICKS docstring, lines 66-71
  evidence: "/** Number of synchronous ticks per simulation run. d3-force's default natural\n *  ticks\
    \ count is ~300 (alpha from 1 → 0.001 with default decay). 100 ticks\n *  is short enough to not block\
    \ the main thread on the small subgraphs the"
  cost: The 100-tick, no-animation rule is also written as prose. Someone changing the tick count in the
    node would not find this comment bound to it, and it would keep saying 100. The code that holds it
    is `const SIM_TICKS = 100;`, `.stop();` and `simulation.tick(SIM_TICKS);` in this file.
  node: rules/graph-explorer/force-layout-runs-a-hundred-silent-ticks
- file: src/features/graph/hooks/useForceLayout.ts
  where: the header docstring, lines 15-19 ("Invariants pinned here")
  evidence: '* - D5 / AC-F.12 — **nodes that already have a position in the store are

    *    pinned via `fx`/`fy`**. After the simulation runs, their `x`/`y` are

    *    snapped back to the pinned values by d3-force on every tick. New nodes

    *    receive freshly computed positions from the force field.'
  cost: 'The keep-in-place rule is stated a second time in prose, beside the code that holds it. When
    the node moves, this paragraph stays behind and reads as a current decision. The code that holds it
    is `return { id, x: pinned.x, y: pinned.y, fx: pinned.x, fy: pinned.y };` in this file.'
  node: rules/graph-explorer/a-graph-change-keeps-every-positioned-node-where-it-is
- file: src/features/graph/hooks/useForceLayout.ts
  where: the runForceLayout docstring, lines 140-141, and the comment on the result loop, lines 199-202
  evidence: '* - Nodes with NO links still receive a position from charge + center, so an

    *   isolated subgraph fragment is still placed.'
  cost: 'The rule that a linkless node is placed and an uncomputable coordinate becomes 0 is repeated
    in prose. The code that holds it is `out.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });` in this file.'
  node: rules/graph-explorer/a-linkless-node-is-still-placed
- file: src/features/graph/hooks/useForceLayout.ts
  where: the runForceLayout docstring, lines 142-143, and the comment in the effect, lines 269-273
  evidence: '* - An empty `nodeIds` short-circuits to an empty Map without instantiating

    *   the simulation.'
  cost: 'The empty-graph rule is stated in prose in two places beside the code that holds it. The code
    is `if (nodeIds.length === 0) { return out; }` and the effect''s branch `useGraphStore.setState({
    positions: new Map<string, GraphPosition>() });`, both in this file.'
  node: rules/graph-explorer/an-empty-graph-has-no-positions
- file: src/features/graph/hooks/useForceLayout.ts
  where: the useForceLayout docstring, lines 217-224, and the closing comment, lines 300-304
  evidence: '* - Re-runs the simulation whenever the store''s `nodes` Map or `links` Map

    *   identity changes (i.e. when `addNodes` / `removeNodes` / `clear` run —

    *   each writes a fresh Map per the store''s contract).'
  cost: The re-run triggers are described in prose, and the account of what the store does can drift from
    the code. The code that holds the rule is the dependency array `}, [nodes, links, layoutNonce]);`,
    which leaves `positions` out, so a manual move does not re-run the layout.
  node: rules/graph-explorer/layout-reruns-on-graph-or-counter-change
- file: src/features/graph/hooks/useGraphReveal.ts
  where: comment above staggerRef, lines 198-200
  evidence: 'Latest staggerMs ref — read inside the timer chain so a prop change

    mid-reveal takes effect on the next tick without re-triggering the

    effect (which would clear the timer chain and lose progress).'
  cost: The rule that a gap change applies from the next reveal is written as prose while code holds it.
    `staggerRef.current = staggerMs;` is read as `Math.max(0, staggerRef.current)` each time the effect
    schedules a step. The comment restates the node's rule and gives a reason the node does not carry.
  node: rules/graph-explorer/a-gap-change-applies-from-the-next-reveal
- file: src/features/graph/hooks/useGraphReveal.ts
  where: docblock of revealOne, lines 159-164
  evidence: 'Idempotent: re-revealing an already-revealed id is a no-op (Set semantics

    + a referential check before setState to avoid spurious renders).'
  cost: The prose repeats the node's rule while `if (revealedIds.has(id)) return;` holds it. The two can
    drift apart without notice.
  node: rules/graph-explorer/revealing-a-revealed-node-changes-nothing
- file: src/features/graph/hooks/useGraphReveal.ts
  where: header docblock, lines 23-28 (AC-F.14) and the comment on DEFAULT_REVEAL_STAGGER_MS, lines 83-87
  evidence: 'the hook does NOT batch the queue

    under normal motion. Each tick reveals exactly one id, separated by

    `staggerMs` (default 90).

    ...

    /** Default inter-node delay used when the consumer does not provide one.

    *  Matches GraphSpace.component.spec.md §2 (`revealStaggerMs` default = 90)'
  cost: The 90 ms default and the one-at-a-time rule are written as prose in several places while code
    holds them at `export const DEFAULT_REVEAL_STAGGER_MS = 90;` and `timerRef.current = setTimeout(tick,
    delay);`. The prose also points at `GraphSpace.component.spec.md` as the authority for the value,
    so a reader is sent away from the node that holds it.
  node: rules/graph-explorer/reveal-goes-one-node-at-a-time-in-queue-order
- file: src/features/graph/hooks/useGraphReveal.ts
  where: header docblock, lines 29-32 (AC-F.15)
  evidence: 'the hook only marks NODES as revealed.

    Edge filtering is the consumer''s responsibility (`GraphCanvas` reads the

    returned Set and drops edges whose endpoints are still queued). This

    file does not import `@xyflow/react`.'
  cost: The prose repeats the node's "nodes only" rule. The code holds it too, since `revealOne` writes
    only `revealedIds` and the file has no edge logic. The prose also claims behavior for GraphCanvas,
    a file this judgment does not read. That claim has no node here and nothing checks it from this file.
  node: rules/graph-explorer/reveal-marks-nodes-only
- file: src/features/graph/hooks/useGraphReveal.ts
  where: header docblock, lines 3-8 and 39-44 (the "Status transition" invariant)
  evidence: 'When the queue empties and the store status is `"revealing"`, advances

    the status to `"ready"` so `GraphStatusOverlay` removes itself.

    ...

    *  - **Status transition** — `revealing → ready` fires only when the queue

    drains AND the current status is `"revealing"`. Any other status

    ("loading", "ready" already, "error", "empty") is left untouched'
  cost: The docblock states the node's rule a second time outside behavior. The same rule is also written
    in code at lines 212-217, 141-143, 154-156 and 253-257. A later change to the node leaves this prose
    saying something else, and `--check` never reaches it.
  node: rules/graph-explorer/empty-reveal-queue-ends-revealing
- file: src/features/graph/hooks/useGraphReveal.ts
  where: header docblock, lines 33-38 (AC-F.16) and the docblock of prefersReducedMotion, lines 96-107
  evidence: 'when

    `window.matchMedia(''(prefers-reduced-motion: reduce)'').matches`, the

    hook reveals every queued id in a single synchronous batch. No stagger,

    no scale.

    ...

    Defaulting to "motion ON" is the safe choice'
  cost: The reduced-motion rule and its "assume motion on when unreadable" fallback are written as prose
    while code holds both. A later change to the node leaves the prose behind, and the prose names AC-F.16
    as the rule's source instead of the node.
  node: rules/graph-explorer/reduced-motion-reveals-everything-at-once
- file: src/features/graph/hooks/useGraphReveal.ts
  where: header docblock, lines 45-49 (AC-E.3) and the cleanup comment, lines 262-266
  evidence: 'on unmount,

    or when the queue becomes empty mid-flight, every scheduled timer is

    cleared. Already-revealed ids remain in `revealedIds`

    ...

    Remaining

    queued ids stay in `revealQueue`'
  cost: The stop semantics (cancel the pending step, keep revealed nodes revealed and queued nodes queued)
    are written as prose while code holds them in the effect cleanup. A later change to the node leaves
    the prose saying the old behavior.
  node: rules/graph-explorer/stopping-the-reveal-keeps-what-it-reached
- file: src/features/graph/hooks/useGraphReveal.ts
  where: the @param staggerMs JSDoc, lines 176-180
  evidence: 'Values ≤ 0 are coerced to a single tick of

    `setTimeout(..., 0)` — the hook never falls back to a

    blocking loop.'
  cost: The zero-or-less rule is written as prose while code holds it at `const delay = Math.max(0, staggerRef.current);`
    followed by `setTimeout(tick, delay)`. The prose is a second statement of the rule that no running
    system reads.
  node: rules/graph-explorer/a-gap-of-zero-or-less-is-zero
- file: src/features/graph/lib/edge-params.ts
  where: the docblock above getEdgePosition, lines 93-102 (tie-breaking), and the comment at lines 120-121
    (fallback)
  evidence: '* Tie-breaking: vertical sides (left/right) take precedence over

    * horizontal (top/bottom) at the corners — this matches the React Flow

    ...

    // Fallback — degenerate cases (rounding) — pick bottom for top-down'
  cost: The side order and the bottom fallback are held by the `if (px <= nx + 1) return Position.Left;`
    chain and the final `return Position.Bottom;`, and the node holds them too. The prose is a third statement
    of them. If the code order changes, the comment keeps saying the old order and nobody can tell which
    one was decided.
  node: rules/graph-explorer/a-link-meets-each-node-at-its-border
- file: src/features/graph/lib/edge-params.ts
  where: the header docblock lines 19-21, and the docblock above getEdgeParams, lines 125-130
  evidence: '* Returns `null` when either node is unmeasured (no `internals` /

    * `positionAbsolute` yet, or zero-sized `measured`). Callers MUST render

    * nothing in that case — never fall back to (0,0).

    ...

    * unmeasured (no measured width/height) — the adapter MUST render

    * nothing in that case (see GraphEdge.spec §1 + §6 Do/Don''t).'
  cost: The rule is held by `if (!source || !target) return null;` and `if (sw === 0 || sh === 0 || tw
    === 0 || th === 0) return null;`, and the node holds it too. The comments repeat it and cite `docs/specs/...`
    paths as if they were authority. A reader may take them for a second home that has to be kept in step.
  node: rules/graph-explorer/a-link-needs-both-measured-nodes-to-be-drawn
- file: src/features/graph/lib/layout-radial.ts
  where: The module docstring (lines 20-22 and 24-28) and the doc comments on `NODE_FOOTPRINT` (lines
    50-54) and `MIN_RING_GAP` (lines 56-59). The inline comments at lines 112-120 repeat the same facts.
  evidence: "\" *    r[d] = max( d · MIN_RING_GAP,                       // radial gap between rings\n\
    \ *                (count[d] · NODE_FOOTPRINT) / (2π) )     // arc ≥ footprint per node\n *    r[d]\
    \ = max( r[d], r[d-1] + MIN_RING_GAP )            // keep rings monotonic\"\n\"`r ≥ footprint / (2·sin(π/count))`.\
    \ With one node on the ring there is no\n    // neighbour, so the term is 0.\"\nThe code holds it\
    \ too: `const NODE_FOOTPRINT = 270;`, `const MIN_RING_GAP = 200;`, `NODE_FOOTPRINT / (2 * Math.sin(Math.PI\
    \ / count))` for `count >= 2`, and `Math.max(d * MIN_RING_GAP, angularTerm, prevRadius + MIN_RING_GAP)`."
  cost: The ring-radius rule and its constants 200 and 270 are written in prose several times as well
    as in code. The docstring formula even uses the arc estimate `count·footprint / 2π`, which differs
    from the chord formula the code and the node use. A reader who trusts the comment gets a different
    radius than the one the system computes.
  node: rules/graph-explorer/radial-rings-take-the-largest-radius
- file: src/features/graph/lib/layout-radial.ts
  where: The module docstring (lines 4-9) and the inline comments at lines 84-88 and 145-149, above the
    `.separation(...)` call and the polar-to-Cartesian projection.
  evidence: "\" * `(angle, radius)` then projects to Cartesian `(x, y)` with\n * `x = r·sin(θ)` / `y =\
    \ -r·cos(θ)`. The negation on y places angle 0 at the\n * top of the canvas\"\n\"`.separation` is\
    \ the canonical radial idiom: siblings get a unit gap,\n   // cousins twice that, and dividing by\
    \ `a.depth` keeps inner rings\"\nThe code holds the same fact: `.separation((a, b) => (a.parent ===\
    \ b.parent ? 1 : 2) / a.depth)`, `const x = radius * Math.sin(theta);` and `const y = -radius * Math.cos(theta);`,\
    \ with ring 0 given `radius` 0."
  cost: The comments restate the node's convention a second time (root at the centre, angle 0 at the top,
    gap 1 for siblings and 2 for other neighbours divided by depth). When the node moves, a comment that
    no tool checks keeps saying the old numbers, and the next reader cannot tell which one was decided.
  node: rules/graph-explorer/radial-layout-puts-the-root-at-the-centre
- file: src/features/graph/lib/layout-radial.ts
  where: The module docstring step 5 (lines 37-38).
  evidence: "\" *  5. Pinned positions override the projection — same contract as the other\n *     two\
    \ runners.\"\nThe code holds the same fact: `const pinned = pinnedPositions.get(id); if (pinned !==\
    \ undefined) { out.set(id, { x: pinned.x, y: pinned.y }); continue; }`"
  cost: The "keep what is positioned" rule has a second home in the docstring. The other runners are cited
    only as "the same contract", so the comment points at a rule it does not state and nothing reads it.
  node: rules/graph-explorer/a-graph-change-keeps-every-positioned-node-where-it-is
- file: src/features/graph/lib/layout-radial.ts
  where: The module docstring step 6 (line 39) and the inline comment at lines 94-96. The comment at lines
    112-114 repeats it.
  evidence: "\" *  6. The virtual super-root (forest case) is dropped from the output.\"\n\"the super-root,\
    \ when present, sits at depth 0\n  // but is not rendered — we skip it so it never inflates a ring\"\
    \nThe code holds it: `if (node.data.id === SUPER_ROOT_ID) continue;` in the count loop, and `if (id\
    \ === SUPER_ROOT_ID) continue;` in the output loop. The id literal is declared in ./spanning-tree\
    \ and only imported here."
  cost: The "virtual root is never positioned" rule is restated in prose where the code already holds
    it. The comment says "not rendered", but the node's rule is about positions, so the comment drifts
    from the node's wording.
  node: rules/graph-explorer/several-components-hang-under-a-virtual-root
- file: src/features/graph/lib/layout-tree.ts
  where: header step 4 (lines 24-25) and the @param pinnedPositions docblock (lines 54-56)
  evidence: "Pinned positions override the layout output — same contract as the\n *  other two runners:\
    \ a pinned node never moves regardless of algorithm."
  cost: 'The keep-positioned-nodes rule is restated in prose while the code holds it at `const pinned
    = pinnedPositions.get(id); if (pinned !== undefined) { out.set(id, { x: pinned.x, y: pinned.y });
    continue; }`. The prose also claims a contract shared with two other runners, which this file cannot
    show. A reader trusting the comment would look for the rule in the wrong place.'
  node: rules/graph-explorer/a-graph-change-keeps-every-positioned-node-where-it-is
- file: src/features/graph/lib/layout-tree.ts
  where: header step 5 (line 26) and the inline comment at line 91
  evidence: The virtual super-root (when present) is dropped from the output.
  cost: The never-positioned virtual root is restated in prose while the code holds it at `if (id ===
    SUPER_ROOT_ID) continue;`. The creation of the virtual root under several components happens in spanning-tree.ts,
    which this file does not hold. The comment's version can drift from both.
  node: rules/graph-explorer/several-components-hang-under-a-virtual-root
- file: src/features/graph/lib/layout-tree.ts
  where: the file header docblock, lines 8-16 ("Orientation — left-to-right (LR)"), and the spacing comments
    on TREE_SIBLING_GAP and TREE_LEVEL_GAP, lines 37-44
  evidence: "DEPTH→canvasX (layers march right) and\n *  BREADTH→canvasY (siblings stack vertically)."
  cost: 'The depth-along-x, siblings-along-y orientation is stated in prose, and the runtime code holds
    it too: `out.set(id, { x: node.y ?? 0, y: node.x ?? 0 })` and the `nodeSize([TREE_SIBLING_GAP, TREE_LEVEL_GAP])`
    call with 110 and 340. The prose is a second home that moves separately from the node. The runTreeLayout
    docblock at line 48 also still reads "Tidy tree (top-down) layout". That contradicts the orientation
    the code implements and the header describes, so a reader of the docstring is told the opposite of
    what the layout does.'
  node: rules/graph-explorer/tree-layout-grows-left-to-right
- file: src/features/graph/lib/map.ts
  where: the JSDoc of mapLinkTypeLabel (lines 158-174) and the inline comments at lines 179-181 and 185-190
  evidence: '* `"participa de"`) alongside the slug `link_type` (`"participates_in"`). The

    * frontend renders the label — never the slug — but legacy frames or unknown

    * link types may omit the projection. In that case we humanize the slug

    * (underscores → spaces) as a graceful fallback'
  cost: The rule that the shown text is the untrimmed label when it is present and not blank, and otherwise
    the slug with underscores replaced by spaces, is restated in prose. The code in mapLinkTypeLabel already
    holds it (`linkTypeLabel.trim().length > 0` then `return linkTypeLabel`, else `linkType.replace(/_/g,
    " ")`). The comments also add behavioural claims no node holds, such as the fallback being "meant
    to look slightly different" and the pt-BR example.
  node: rules/graph-explorer/link-text-is-the-catalog-label-or-the-spaced-slug
- file: src/features/graph/lib/map.ts
  where: the module header comment, lines 14-17 and 96-100 (the `merged` / `deleted` to `undefined` signal),
    and the default-branch comment at lines 112-115
  evidence: '* @returns `undefined` for `merged` / `deleted` — the dispatcher uses this

    *          as the filter signal (do not include this node in the surface

    *          shape).

    // ... At runtime, the default is defensive: an unknown status

    // is treated like `merged`/`deleted` (hidden).'
  cost: 'The rule that a merged, deleted or unknown node gets no state and is left off the pane is stated
    in prose a second time. The code in deriveNodeState holds it (`case "merged": case "deleted": return
    undefined;` and `default: return undefined;`). The prose also claims how the dispatcher consumes the
    value, which this file does not show.'
  node: rules/graph-explorer/merged-or-deleted-node-has-no-state-and-is-left-off
- file: src/features/graph/lib/map.ts
  where: the module header comment, lines 14-19 (the `deriveNodeState` bullet), repeated in the status
    table and JSDoc of deriveNodeState (lines 83-101) and in the comment inside the default branch (lines
    112-115)
  evidence: '* - `deriveNodeState(status)` → `ConfidenceState | undefined`. **Status

    *    ONLY** (I-2) — nodes do not carry `flags`. `merged` / `deleted` map to

    *    `undefined` because the dispatcher filters those nodes out

    *  | "active"       | "accepted"           | green StateBadge                  |

    *  | "needs_review" | "uncertain"          | amber StateBadge                  |'
  cost: 'The status-to-state mapping and the merged/deleted/unknown-means-hidden rule are stated in prose
    while the switch in deriveNodeState already holds them (`case "active": return "accepted"`, `case
    "needs_review": return "uncertain"`, `return undefined`). The table is a second copy of the node''s
    facts, and it adds colour claims such as green and amber that no node holds.'
  node: rules/graph-explorer/node-state-follows-its-status-alone
- file: src/features/graph/lib/map.ts
  where: the module header comment, lines 21-27 (the precedence list), and the JSDoc and inline comment
    of deriveLinkState (lines 120-132, 140, 142-144)
  evidence: '*    Precedence (highest to lowest):

    *      1. `superseded` status → `"superseded"`

    *      2. `disputed` flag → `"disputed"`

    *      3. `low_confidence` flag → `"low-confidence"`

    *      4. `uncertain` flag → `"uncertain"`

    *      5. otherwise → `"accepted"`'
  cost: The precedence of link states is written out in prose while the if-chain in deriveLinkState holds
    it (`if (status === "superseded")`, `flags.includes("disputed")`, `flags.includes("low_confidence")`,
    `flags.includes("uncertain")`, `return "accepted"`). The comments also give a rationale, "StateBadge
    palette severity ladder", that no node holds. A change to the node would leave the comments claiming
    the old order.
  node: rules/graph-explorer/link-state-follows-a-fixed-precedence
- file: src/features/graph/lib/map.ts
  where: the module header comment, lines 28-29, and the JSDoc of deriveLinkState (lines 130-131)
  evidence: '*    This mirrors the §3.5 / §6.6 ConfidenceState vocabulary in

    *    `remember-modelagem-v7.md` and the StateBadge spec.'
  cost: The comment claims the five-value state vocabulary as its own authority. The code does not declare
    that vocabulary in this file. It imports `ConfidenceState` from "@/components/ds/StateBadge", and
    the string literals it returns are checked against that type. The prose is a second statement of the
    node's enumeration, and it points at documents that are not the specification.
  node: domain/graph-explorer/confidence-state
- file: src/features/graph/lib/map.ts
  where: the module header comment, lines 7-12 (the `mapNodeType` bullet), repeated in the comment above
    FALLBACK_NODE_TYPE (lines 58-60) and in the JSDoc of mapNodeType (lines 63-73, 75-76)
  evidence: '* - `mapNodeType(wireType)` → `GraphNodeType`. Safe fallback for unknown

    *    slugs ... We never throw — we return `"concept"`

    * - Trims and lowercases input defensively before lookup so a trailing

    *   space or accidental casing variant from the wire still matches.'
  cost: The prose restates the trim, lower-case and fall back to concept rule that the code already holds
    in mapNodeType (`wireType.trim().toLowerCase()`, `KNOWN_NODE_TYPES.has(...)`, `FALLBACK_NODE_TYPE`).
    The rule now has a second home in comments that nothing keeps in step with the node, so a later change
    to the node leaves comments that say something different.
  node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
- file: src/features/graph/lib/spanning-tree.ts
  where: the comment at lines 72-75, inside the link loop
  evidence: '// Defensive: skip a link whose endpoint is not in nodeIds — same posture

    // as runForceLayout.'
  cost: The rule that a link with a missing endpoint is left out is stated as prose beside the code that
    enforces it. The comment also points at another layout runner as its model. That ties two files together
    in prose only, with no bind between them.
  node: rules/graph-explorer/links-with-a-missing-endpoint-are-left-out-of-layouts
- file: src/features/graph/lib/spanning-tree.ts
  where: the header docstring, lines 14-16, the comment above `SUPER_ROOT_ID` at lines 25-27, and the
    comment at lines 137-138
  evidence: '*      3. If there is more than one component, attach all component roots as

    *         children of a single virtual super-root.

    // Single component → real root. Forest → virtual super-root that wraps

    // every component root. Callers strip the super-root from the output.'
  cost: The virtual-root rule and the rule that it is never positioned are restated as comments. The positioning
    half is enforced in the layout runners, not in this file. A reader of the comment sees a rule with
    no visible enforcement here. The comment can drift from the node unnoticed.
  node: rules/graph-explorer/several-components-hang-under-a-virtual-root
- file: src/features/graph/lib/spanning-tree.ts
  where: the header docstring, lines 9-16, and the comments at lines 84-86 and 119-122
  evidence: '* 1. Pick the highest-degree node as the root of each component (tie:

    *         smallest id — stable across runs so the same delta always lays out

    *         the same way).

    *      2. Run BFS from each component root to derive its spanning tree.

    // Component-by-component BFS. For each unvisited id, pick the highest-

    // degree unvisited node (tiebreak: smallest id) as the component root,

    // Iterate neighbours in stable id order so the tree shape is'
  cost: The roots-by-highest-degree, smaller-id-on-ties and ascending-neighbour-order rules appear as
    prose in a second place. A reader of the comment can mistake it for the home of the rule. When the
    node changes, nothing ties the comment to it, and the comment can keep stating the old rule.
  node: rules/graph-explorer/tree-and-radial-layouts-share-one-spanning-tree
- file: src/features/graph/state/graph-store.ts
  where: GraphState.clear docstring, lines 152-154
  evidence: '/** Reset to empty / `status === "empty"`. Called on conversation

    switch — the right pane goes back to `GraphEmptyState`. Also

    resets `receivedDeltaThisTurn` (new conversation = new turn). */'
  cost: The clear-to-empty rule is restated in prose. The code holds it in `set(makeInitialState())`.
    The comment is a second home for the starts-and-clears-empty fact.
  node: rules/graph-explorer/pane-starts-and-clears-empty
- file: src/features/graph/state/graph-store.ts
  where: GraphState.errorMessage docstring, lines 79-82
  evidence: '/** Optional error blurb rendered by `GraphStatusOverlay` when

    `status === "error"`. Cleared on every non-error transition.'
  cost: 'The rule that only error keeps its message is restated in prose. The code holds it in setStatus
    as `errorMessage: status === "error" ? errorMessage : undefined`. A second statement of it invites
    drift.'
  node: rules/graph-explorer/setting-a-status-keeps-the-error-message-only-for-error
- file: src/features/graph/state/graph-store.ts
  where: GraphState.getSnapshot docstring, lines 180-182
  evidence: '/** Snapshot shape written to / read from the BFF persistence endpoint.

    Bumped to `version: 2` in TC-02 to carry `layoutAlgorithm`.'
  cost: 'The snapshot version and its fields are restated in prose. The code holds them in the GraphSnapshotV2
    interface and the getSnapshot return (`version: 2 as const` with nodes, links, positions, user_pinned,
    layout_algorithm). The comment is a second home.'
  node: rules/graph-explorer/a-snapshot-carries-its-version-and-fields
- file: src/features/graph/state/graph-store.ts
  where: GraphState.hydrate docstring, lines 185-189
  evidence: '* Restore a saved snapshot (BR-42). Sets nodes/links/positions/userPinned

    * from the saved data and makes all nodes immediately visible — NO 1-by-1

    * reveal animation'
  cost: 'The restore-shows-every-node-at-once rule is restated in prose. The code holds it in hydrate
    (`revealedIds: new Set<string>(allNodeIds)`, `revealQueue: []`, `status: "ready"`). The comment is
    a second home.'
  node: rules/graph-explorer/restoring-shows-every-node-at-once
- file: src/features/graph/state/graph-store.ts
  where: GraphState.hydrate docstring, lines 190-197
  evidence: '- `version: 2` snapshots restore the stored `layoutAlgorithm` too.

    - Any other version value is treated like v1 + default algorithm — we

    never throw on hydrate'
  cost: 'The rule that only version 2 restores its layout is restated in prose. The code holds it in `snapshot.version
    === 2 && "layout_algorithm" in snapshot ? snapshot.layout_algorithm : "force"`. A node change would
    leave the comment stating the old behaviour.'
  node: rules/graph-explorer/only-a-version-2-view-restores-its-layout
- file: src/features/graph/state/graph-store.ts
  where: GraphState.layoutAlgorithm docstring, lines 102-103
  evidence: '/** Active layout algorithm (TC-02). Defaults to `''force''` so legacy

    behaviour is preserved.'
  cost: 'The default is restated in prose. The code holds it in makeInitialState (`layoutAlgorithm: "force"`).
    A change to the default would leave this comment stating the old one.'
  node: rules/graph-explorer/layout-defaults-to-force
- file: src/features/graph/state/graph-store.ts
  where: GraphState.receivedDeltaThisTurn docstring, lines 84-87 (set by addNodes)
  evidence: '/** I-7 flag — set `true` by `addNodes` (any successful delta in the

    current turn)'
  cost: 'The rule that adding a delta marks it received is restated in prose. The code holds it as `receivedDeltaThisTurn:
    true` in the addNodes return. The comment is a second home outside behaviour.'
  node: rules/graph-explorer/add-marks-a-delta-received
- file: src/features/graph/state/graph-store.ts
  where: GraphState.receivedDeltaThisTurn docstring, lines 85-87 (reset at turn end)
  evidence: 'reset `false` at turn-start (`clear()` and inside

    `settleTurn`).'
  cost: 'The reset rule is restated in prose, and it is worded as turn-start while the node says turn
    end. The code holds the reset in every settleTurn branch (`receivedDeltaThisTurn: false`). The comment
    is therefore a second home that can mislead as well as drift.'
  node: rules/graph-explorer/ending-a-turn-resets-the-delta-mark
- file: src/features/graph/state/graph-store.ts
  where: GraphState.removeNodes docstring, lines 124-126
  evidence: '/** Remove a set of node ids and any link whose `source` or `target`

    references one of them (orphan cleanup). The positions entry and

    revealed-ids membership for the removed nodes are dropped too. */'
  cost: The removal rule is restated in prose while removeNodes holds it in code. A change to the node
    would leave the comment claiming the earlier scope of removal.
  node: rules/graph-explorer/removing-nodes-removes-everything-about-them
- file: src/features/graph/state/graph-store.ts
  where: GraphState.replaceNodes docstring, lines 114-122
  evidence: 'Links whose

    endpoints are not among THIS delta''s own nodes are dropped (no orphan

    strokes). Leaves `status` untouched so the in-flight `"loading"` set on

    `tool_start` flows into the reveal.'
  cost: 'The replace rule is spelled out again in prose: keep only the delta''s nodes and links, clear
    positions, pins and revealed, queue every node, leave the status. The code holds all of it in replaceNodes.
    A node change would leave this comment stating the old rule.'
  node: rules/graph-explorer/replace-keeps-only-the-delta
- file: src/features/graph/state/graph-store.ts
  where: GraphState.resetLayout docstring, lines 137-143
  evidence: 'Clears

    `userPinned` and bumps `layoutNonce` (the force effect re-runs ignoring

    pins). Positions are NOT cleared here'
  cost: 'The reorganize rule is restated in prose. The code holds it in resetLayout (`userPinned: new
    Set<string>()`, `layoutNonce: state.layoutNonce + 1`, with positions untouched). The comment is a
    second home outside behaviour.'
  node: rules/graph-explorer/reorganizing-releases-the-pins
- file: src/features/graph/state/graph-store.ts
  where: GraphState.setLayoutAlgorithm docstring, lines 145-150
  evidence: 'Sets

    `layoutAlgorithm = algo` AND bumps `layoutNonce` — the

    `useForceLayout` effect re-runs with the new runner and ignores the

    pin set so the fresh layout is unobstructed (same semantics as

    `resetLayout`, but also changes the algorithm). No-op if `algo`

    equals the current algorithm'
  cost: The choose-a-layout rule is restated in prose. The code holds it in setLayoutAlgorithm (`if (state.layoutAlgorithm
    === algo) return {};` followed by the algorithm, a cleared pin set and the nonce bump). A change to
    the node would leave this comment stating the old behaviour.
  node: rules/graph-explorer/choosing-a-layout-releases-the-pins
- file: src/features/graph/state/graph-store.ts
  where: GraphState.settleTurn docstring, lines 166-169
  evidence: '- `"done"`: if `receivedDeltaThisTurn` is `true` → advance to

    `"ready"`. Otherwise leave `status` untouched'
  cost: 'The rule that done after a delta makes the pane ready is restated in prose. The code holds it
    in settleTurn as `set({ status: "ready", errorMessage: undefined, receivedDeltaThisTurn: false })`.
    A second home outside behaviour.'
  node: rules/graph-explorer/turn-done-after-a-delta-makes-the-pane-ready
- file: src/features/graph/state/graph-store.ts
  where: GraphState.userPinned docstring, lines 89-95
  evidence: '/** IDs of nodes the USER has repositioned via drag (TC-FE drag). A node

    in this set keeps its `positions` entry as a permanent pin'
  cost: The rule that a hand-moved node is recorded as pinned is restated in prose. The code holds it
    in setNodePosition (`nextUserPinned.add(id)`). The comment is a second home, and the node's own text
    is where a reader should look.
  node: rules/graph-explorer/moving-a-node-pins-it
- file: src/features/graph/state/graph-store.ts
  where: header docstring, lines 14-15 (invariant I-7, the `done` half)
  evidence: '* I-7 — `settleTurn` only flips status when a graph tool was in

    flight this turn. `done` without delta → status unchanged;'
  cost: 'A second home for the done-without-a-delta rule sits in prose. The code in settleTurn holds it,
    in the `else { set({ receivedDeltaThisTurn: false }); }` branch. When the node moves, this comment
    goes stale and nothing flags it. A reader may also take it as the place the rule was decided.'
  node: rules/graph-explorer/turn-done-without-a-delta-leaves-the-status
- file: src/features/graph/state/graph-store.ts
  where: header docstring, lines 15-16 (invariant I-7, the `error` half)
  evidence: '`error`

    while status is `empty` (no graph tool in flight) → unchanged.'
  cost: The rule that an error turn changes only a busy pane is restated in prose. The code holds it in
    `graphToolInFlight(status)` and the settleTurn error branch. Two homes for one rule means a change
    to the node leaves this text claiming the old behaviour.
  node: rules/graph-explorer/turn-error-ends-a-busy-pane-in-error
- file: src/features/graph/state/graph-store.ts
  where: header docstring, lines 19-21 (only unseen ids enter revealQueue)
  evidence: 'only IDs not yet seen by

    the reveal pipeline enter `revealQueue`.'
  cost: The queue-only-unseen rule is stated in prose while addNodes holds it in `if (!state.revealedIds.has(node.id)
    && !nextNodes.has(node.id))`. A change to the node would leave this sentence claiming the earlier
    rule.
  node: rules/graph-explorer/add-queues-only-unseen-nodes
- file: src/features/graph/state/graph-store.ts
  where: header docstring, lines 19-21 (re-affirmation consolidates)
  evidence: '* Re-affirmation consolidates, never duplicates (project principle):

    `addNodes` merges into the existing Maps; only IDs not yet seen by

    the reveal pipeline enter `revealQueue`.'
  cost: The merge-by-identity rule is restated outside behaviour. The code holds it in addNodes through
    `nextNodes.set(node.id, node)` and `nextLinks.set(link.id, link)`. The comment is a second home that
    nobody reads when the node changes.
  node: rules/graph-explorer/add-merges-by-identity
- file: src/features/graph/types.ts
  where: the GraphLinkData.label docblock, lines 59-63
  evidence: '/** Link type slug (`participates_in`, `member_of`, …). Used **exclusively**

    *  as the stroke-color lookup key (`LINK_STROKE_CLASS[label]`) and as a

    *  diagnostic id — **never** rendered as visible text. The visible text is

    *  `linkTypeLabel`. */'
  cost: The rule that the slug is kept as the label and is never the text shown is told in prose here.
    The interface does declare the `label` and `linkTypeLabel` fields, but nothing in this file prevents
    the slug from being rendered. The code that holds the rule is the `LINK_STROKE_CLASS[data.label]`
    lookup in GraphEdgeAdapter.tsx and `mapLinkTypeLabel` in src/features/graph/lib/map.ts.
  node: rules/graph-explorer/link-type-slug-is-kept-apart-from-its-text
- file: src/features/graph/types.ts
  where: the GraphLinkData.linkTypeLabel docblock, lines 64-70, and the GraphLinkWire.link_type_label
    docblock, lines 127-132
  evidence: 'falls back to the humanized slug

    *  (`link_type.replace(/_/g, " ")`) when the wire field is absent (legacy

    *  frames / unknown link types).'
  cost: The fallback of the shown link text to the slug with spaces is written out in prose here. The
    code that holds it is `return linkType.replace(/_/g, " ");` in `mapLinkTypeLabel` in src/features/graph/lib/map.ts.
    The comment is narrower than the node. It says "absent", while the code and the node also fall back
    when the label is blank.
  node: rules/graph-explorer/link-text-is-the-catalog-label-or-the-spaced-slug
- file: src/features/graph/types.ts
  where: the GraphLinkData.state docblock, lines 75-76
  evidence: '/** Confidence state — derived from link `status` + `flags` (links carry

    *  flags; nodes do not — I-2). */'
  cost: The rule that a link's state comes from its status and flags is mentioned in prose in this file.
    The code that holds it, with its precedence, is `deriveLinkState` in src/features/graph/lib/map.ts.
    The prose gives no precedence, so it reads as the whole rule when it is not.
  node: rules/graph-explorer/link-state-follows-a-fixed-precedence
- file: src/features/graph/types.ts
  where: the GraphNodeData docblock, lines 32-34, and the GraphNodeWire.node_type docblock, lines 113-115
  evidence: '`type` has already been mapped

    *  via `mapNodeType()` — unknown wire types collapse to the safe fallback'
  cost: The fallback to concept for an unknown node type is told in prose here. The code that holds it
    is `mapNodeType` in src/features/graph/lib/map.ts (`wireType.trim().toLowerCase()` then `FALLBACK_NODE_TYPE`).
    The comment cites the plan's G-B and UC-CG-12 as if they were the rule.
  node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
- file: src/features/graph/types.ts
  where: the GraphNodeData.state docblock, lines 42-45, and the GraphNodeWireStatus docblock, lines 101-103
  evidence: '*  `undefined` is emitted for `status` values that do not map to a visible

    *  state (e.g. `merged`, `deleted` — those nodes are filtered out by the

    *  dispatcher before reaching this surface shape).'
  cost: 'The rule that a merged or deleted node gets no state and is left off the pane is told in prose
    here. The code that holds it is the `case "merged": case "deleted": return undefined;` branch of `deriveNodeState`
    in src/features/graph/lib/map.ts, together with the composing mapper in src/features/graph/api/mapWireToGraphDelta.ts.
    The prose is a second home that nothing reads.'
  node: rules/graph-explorer/merged-or-deleted-node-has-no-state-and-is-left-off
- file: src/features/graph/types.ts
  where: the module docblock, lines 11-13, the GraphNodeData.state docblock, lines 42-43, and the GraphNodeWireStatus
    docblock, lines 101-103
  evidence: '*  - `GraphNodeData.state` is derived from the node `status` field only —

    *    nodes do not carry `flags` (I-2 — flags live on links). The wire

    *    `GraphNodeWire` therefore intentionally omits a `flags` field.'
  cost: The rule that a node's state follows its status alone is stated in prose in this file. The code
    that applies it is `deriveNodeState` in src/features/graph/lib/map.ts, which takes only `status`.
    Someone reading the prose would assume it is the rule, and a change to the specification would never
    reach it.
  node: rules/graph-explorer/node-state-follows-its-status-alone
- file: src/features/graph/types.ts
  where: the module docblock, lines 14-17, and the GraphLinkData.isTemporal docblock, line 71
  evidence: /** `true` → solid stroke; `false` → dashed stroke (tokens.md §7, I-1). */
  cost: The prose states the dash rule more narrowly than the node. The node says the stroke is dashed
    4 4 when the state is uncertain or the link is not temporal. A reader trusting this comment would
    not know an uncertain temporal link is dashed too. The code that holds the rule is `const isDashed
    = isUncertain || !data.isTemporal;` in src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx.
  node: rules/graph-explorer/a-link-is-dashed-unless-temporal-and-sure
- file: src/features/graph/types.ts
  where: the module docblock, lines 8-10, and the docblock of GraphStatus, lines 90-92
  evidence: '* - `GraphStatus` has exactly 5 values — there is NO `"idle"` (I-4). Adding

    *    `"idle"` would re-introduce the empty/idle ambiguity the plan removed.'
  cost: The five phases and the absence of an idle phase are written out in prose beside the union that
    already declares them. The comment cites a plan under temp/ as its authority. A later change to the
    phases would need two edits, and a reader could take the comment for the decision.
  node: domain/graph-explorer/graph-pane-status
unbound:
- src/features/graph/api/index.ts
- src/features/graph/components/GraphCanvas/GraphCanvas.types.ts
- src/features/graph/components/GraphCanvas/index.ts
- src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.types.ts
- src/features/graph/components/GraphEdgeAdapter/index.ts
- src/features/graph/components/GraphEmptyState/GraphEmptyState.types.ts
- src/features/graph/components/GraphEmptyState/index.ts
- src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.types.ts
- src/features/graph/components/GraphNodeAdapter/index.ts
- src/features/graph/components/GraphSpace/index.ts
- src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
- src/features/graph/components/GraphStatusOverlay/index.ts
- src/features/graph/components/NodeDetailPanel/NodeDetailPanel.types.ts
- src/features/graph/components/NodeDetailPanel/index.ts
- src/features/graph/index.ts
adopted: true
unheld:
- node: domain/chat/graph-view
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/graph-explorer/confidence-state
  how: 'read on 4 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 39 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-fe-graph.returns/.

  Staged as an adoption of source no delivery wrote: 195 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 43 opened across 18 of 39 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 8 fact(s) the source states that no node holds, over 7 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 168 place(s) where text in the source restates a node''s fact the code holds, over 37 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-fe-graph.returns/`, which are the evidence behind every entry above.
