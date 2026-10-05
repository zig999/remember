---
contract_version: siegard-reconcile/8
title: Prose comments removed from the graph frontend files
summary: Every comment that was not a tool directive was removed from these files, answering the restates
  findings the adoption left against them; the facts stay in their nodes and no behaviour changed.
target: frontend
files:
- path: src/features/graph/api/_request.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/_transforms.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/mapWireToGraphDelta.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/node-detail.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/provenance.transforms.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/provenance.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/traversal.transforms.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/traversal.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/use-graph-persistence.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/useNodeDetail.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/useNodeRelationships.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/api/useProvenance.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphSpace/GraphSpace.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphSpace/GraphSpace.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/hooks/useForceLayout.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/hooks/useGraphReveal.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/lib/edge-params.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/lib/layout-radial.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/lib/layout-tree.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/lib/map.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/lib/spanning-tree.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/state/graph-store.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/graph/types.ts
  change: Prose comments removed; behaviour unchanged.
nodes:
- node: constraints/every-operation-requires-owner-authentication
  conforms: true
  how: 'src/features/graph/api/_request.ts: held at authHeader(), lines 3-6: the client side of the constraint,
    presenting the stored token as a bearer credential on every request that spreads it. — return token
    !== null ? { Authorization: `Bearer ${token}` } : {};'
  encoded_at:
  - src/features/graph/api/_request.ts
- node: contracts/graph-explorer/bff-graph-view
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at restoreSnapshot() issues the GET and
    the debounced timer callback issues the PUT, both in useGraphPersistence — `/api/v1/conversations/${encodeURIComponent(conversationId)}/graph`,
    { method: "GET", headers: authHeader() } ... method: "PUT", ... body: JSON.stringify(snapshot)'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: contracts/graph-explorer/bff-node-reads
  conforms: true
  how: "src/features/graph/api/node-detail.types.ts: held at NodeDetailWire (lines 59-63) for the read-node\
    \ answer. The traverse and provenance reads are shaped in other files. — export interface NodeDetailWire\
    \ {\n  readonly node: NodeSummaryWire;\n  readonly aliases: ReadonlyArray<NodeAliasWire>;\n  readonly\
    \ attributes: ReadonlyArray<AttributeWire>;\n}\nsrc/features/graph/api/provenance.types.ts: held at\
    \ the ProvenanceResponseWire, ProvenanceFragmentWire, ProvenanceChunkWire and ProvenanceRawInformationWire\
    \ interfaces, lines 3-31 — export interface ProvenanceResponseWire {\n  readonly fragments: ReadonlyArray<ProvenanceFragmentWire>;\n\
    }\nsrc/features/graph/api/traversal.types.ts: held at `TraversalResultWire` and `TraversalLinkWire`,\
    \ lines 9-34 — export interface TraversalResultWire {\n  readonly starting_node_id: string;\n  readonly\
    \ nodes: ReadonlyArray<NodeSummaryWire>;\n  readonly links: ReadonlyArray<TraversalLinkWire>;\n}\n\
    with `TraversalLinkWire` carrying `link_inverse_name`, `effective_status` and `confidence`\nsrc/features/graph/api/useNodeDetail.ts:\
    \ held at the queryFn of useNodeDetail, lines 15-21 (the read-node operation only; the traverse and\
    \ provenance operations are not in this file) — const wire = await http<NodeDetailWire>(\n  `/api/v1/nodes/${encodeURIComponent(id\
    \ as string)}`,\n  { method: \"GET\", headers: authHeader() },\n);\nreturn toNodeDetail(wire);\nsrc/features/graph/api/useNodeRelationships.ts:\
    \ held at the queryFn of useNodeRelationships, lines 19-23. This is the traverse operation only. The\
    \ file does not issue the read-node or provenance reads. — const wire = await http<TraversalResultWire>(\n\
    \  `/api/v1/nodes/${encodeURIComponent(id as string)}/traverse?depth=1&direction=both`,\n  { method:\
    \ \"GET\", headers: authHeader() },\n);\nreturn toTraversalResult(wire);\nsrc/features/graph/api/useProvenance.ts:\
    \ held at the queryFn of useProvenance(), lines 21-27. It covers read-link-provenance and read-attribute-provenance\
    \ only. read-node and traverse are not in this file. — const wire = await http<ProvenanceResponseWire>(\n\
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
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at NodeAttributeRow renders
    the attributes part of the show-node-detail row (key, value, state badge). The wording the contract
    names for the origin disclosure comes from NODE_DETAIL_COPY and is not held in this file. — <td className="p-xs
    align-top">{attr.key}</td> ... <StateBadge state={attr.state} size="sm" iconOnly /> ... {NODE_DETAIL_COPY.originSummary}

    src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at LoadingView (spinner
    and loading text, close button) and ErrorView (alert, per-variant message, conditional retry button),
    lines 71-156; the wording itself is read from NODE_DETAIL_COPY in NodeDetailPanel.copy.ts — aria-label={NODE_DETAIL_COPY.close}

    {NODE_DETAIL_COPY.loading}

    variant === "not-found" ? NODE_DETAIL_COPY.errorNotFound : variant === "deleted" ? NODE_DETAIL_COPY.errorDeleted
    : NODE_DETAIL_COPY.errorGeneric

    {NODE_DETAIL_COPY.retry}

    src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The origin portion
    (show-origin) sits in NodeProvenanceChain: the pending, error, empty and body branches. The show-origin
    wording itself is read from NODE_DETAIL_COPY in NodeDetailPanel.copy.ts, which is not in this file
    set. The other operations of the contract (graph, node detail, relationships) belong to other files.
    — if (isPending) { ... {NODE_DETAIL_COPY.originLoading} ... } if (isError) { ... role="alert" ...
    {showRetry && ( <button ... onClick={onRetry} ... {NODE_DETAIL_COPY.originRetry}" } if (data === undefined
    || data.fragments.length === 0) { ... {NODE_DETAIL_COPY.originNotFound}

    src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at NodeRelationshipRow,
    the `<li>` with its arrow, type, neighbour, confidence and status badge row, line 99-137. The loading,
    empty and failed states of the section are not in this file. — <li ... data-testid="node-detail-relationship-row">
    ... {link.directionArrow} ... {link.directionLabel} ... {link.neighborName} ... {link.confidenceLabel}
    ... <StateBadge state={badgeState} size="sm" iconOnly />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: domain/chat/graph-delta
  conforms: true
  how: "src/features/graph/types.ts: held at the interface GraphDeltaWire (lines 54-58) and its view-side\
    \ counterpart GraphDelta (lines 23-27) — export interface GraphDeltaWire {\n  readonly source_tool:\
    \ string;\n  readonly nodes: readonly GraphNodeWire[];\n  readonly links: readonly GraphLinkWire[];\n\
    }"
  encoded_at:
  - src/features/graph/types.ts
- node: domain/chat/graph-delta-link
  conforms: true
  how: 'src/features/graph/types.ts: held at the interface GraphLinkWire (lines 42-52). The only difference
    from the node is the spelling of the flag value, filed as a finding. — readonly link_type: string;

    readonly link_type_label?: string;

    readonly is_temporal: boolean;

    readonly is_in_effect?: boolean;

    readonly status?: string;

    readonly flags?: readonly GraphLinkWireFlag[];'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/chat/graph-delta-node
  conforms: false
  how: 'src/features/graph/types.ts, line 31, the type GraphNodeWireStatus, used by GraphNodeWire.status
    at line 39: export type GraphNodeWireStatus = "active" | "needs_review" | "merged" | "deleted";

    The node domain/knowledge-base/node-status, which graph-delta-node names as the type of status, lists:
    "- active", "- needs-review", "- merged", "- deleted". — The enumeration spells the second value with
    a hyphen and the file declares it with an underscore. A reader who takes the enumeration as the vocabulary
    will not find the value the code compares against. The specification does not record which spelling
    the stream carries. The prose of rules/graph-explorer/node-state-follows-its-status-alone.md also
    uses the underscore ("status needs_review"). The two spellings coexist in the specification and nothing
    says which one is the wire spelling.'
  observed_at:
  - src/features/graph/types.ts
- node: domain/chat/graph-layout
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the layout_algorithm member of the version
    2 arm of GraphViewSnapshot, lines 14-21 — readonly layout_algorithm: "force" | "tree" | "radial";

    src/features/graph/state/graph-store.ts: held at the GraphLayoutAlgorithm type declaration, line 14
    — export type GraphLayoutAlgorithm = "force" | "tree" | "radial";'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
  - src/features/graph/state/graph-store.ts
- node: domain/graph-explorer/graph-link-view
  conforms: true
  how: 'src/features/graph/types.ts: held at the interface GraphLinkData (lines 12-21). The attribute
    names are camelCase. — readonly label: string;

    readonly linkTypeLabel: string;

    readonly isTemporal: boolean;

    readonly inEffect?: boolean;

    readonly state?: ConfidenceState;'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/graph-explorer/graph-node-view
  conforms: true
  how: "src/features/graph/types.ts: held at the interface GraphNodeData (lines 4-10). The type attribute\
    \ uses GraphNodeType imported from \"@/components/ds/GraphNode\", and the state attribute uses ConfidenceState\
    \ imported from \"@/components/ds/StateBadge\". — export interface GraphNodeData {\n  readonly id:\
    \ string;\n  readonly type: GraphNodeType;\n  readonly label: string;\n  readonly state?: ConfidenceState;\n\
    \  readonly subtitle?: string;\n}"
  encoded_at:
  - src/features/graph/types.ts
- node: domain/graph-explorer/graph-pane
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at GraphViewSnapshot declares the pane attributes
    that are persisted (nodes, links, positions, user_pinned, layout_algorithm). The hook reads the store''s
    nodes, positions and layoutNonce. — readonly nodes: unknown[]; readonly links: unknown[]; readonly
    positions: Record<string, { x: number; y: number }>; readonly user_pinned: string[];'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: domain/graph-explorer/graph-pane-status
  conforms: true
  how: 'src/features/graph/types.ts: held at the type alias GraphStatus (line 29) — export type GraphStatus
    = "empty" | "loading" | "revealing" | "ready" | "error";'
  encoded_at:
  - src/features/graph/types.ts
- node: domain/graph-explorer/graph-snapshot-version
  conforms: true
  how: "src/features/graph/api/use-graph-persistence.ts: held at the version discriminant of the two arms\
    \ of GraphViewSnapshot — readonly version: 1; ... readonly version: 2;\nsrc/features/graph/state/graph-store.ts:\
    \ held at the GraphSnapshotV1 and GraphSnapshotV2 interfaces, lines 45-60 — export interface GraphSnapshotV1\
    \ {\n  version: 1;\nexport interface GraphSnapshotV2 {\n  version: 2;"
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
  - src/features/graph/state/graph-store.ts
- node: domain/graph-explorer/node-detail-failure
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at the ErrorVariant
    type, line 7 — export type ErrorVariant = "not-found" | "deleted" | "generic";'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
- node: domain/graph-explorer/origin-failure
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The ProvenanceErrorVariant\
    \ union type declaration, lines 7-11. — export type ProvenanceErrorVariant =\n  | \"not-found\"\n\
    \  | \"deleted\"\n  | \"generic\"\n  | \"unknown\";"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: domain/graph-explorer/turn-end
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at the settleTurn signature in GraphState, line
    38, and its two branches at lines 243 and 252 — settleTurn: (frame: "done" | "error") => void;'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: domain/knowledge-base/alias-kind
  conforms: true
  how: 'src/features/graph/api/node-detail.types.ts: held at NodeAliasWire.kind, line 21 — readonly kind:
    "canonical" | "alias";'
  encoded_at:
  - src/features/graph/api/node-detail.types.ts
- node: domain/knowledge-base/assertion-flag
  conforms: false
  how: 'src/features/graph/types.ts, line 33, the type GraphLinkWireFlag, used by GraphLinkWire.flags
    at line 51: export type GraphLinkWireFlag = "uncertain" | "disputed" | "low_confidence";

    The node domain/knowledge-base/assertion-flag lists: "- uncertain", "- disputed", "- low-confidence".
    — The enumeration''s third value is hyphenated and the declaration is underscored. The log of domain/graph-explorer/confidence-state
    records that the back end''s flag uses an underscore and the screen a hyphen. The assertion-flag node,
    which graph-delta-link names as the type of flags, holds the hyphenated form. Whoever changes the
    enumeration will not know this declaration carries a differently spelled copy of it.'
  observed_at:
  - src/features/graph/types.ts
- node: domain/knowledge-base/value-type
  conforms: true
  how: 'src/features/graph/api/node-detail.types.ts: held at AttributeWire.value_type, line 39 — readonly
    value_type: "text" | "number" | "date" | "bool";'
  encoded_at:
  - src/features/graph/api/node-detail.types.ts
- node: rules/chat/graph-delta-link-label
  conforms: true
  how: 'src/features/graph/types.ts: held at the optional field link_type_label on GraphLinkWire (line
    47). The file only declares that the label may be absent. Deciding what the label is, and when it
    is absent, is done elsewhere. — readonly link_type_label?: string;'
  encoded_at:
  - src/features/graph/types.ts
- node: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at handleStoreChange(), lines 73-82 — if
    (!conversationId) return; const { nodes } = useGraphStore.getState(); if (nodes.size === 0) return;
    if (justHydrated.current) { justHydrated.current = false; return; }'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-chunk-offset-window-is-shown-as-chars
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toChunkView, the offsetRangeLabel property
    — offsetRangeLabel: `chars ${wire.offset_start}–${wire.offset_end}`,'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-chunk-shows-its-index-offsets-and-excerpt
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The ChunkDetails
    component, in the chunk-index span, the offset span and the excerpt blockquote. — <span data-testid="node-provenance-chunk-index">chunk
    #{chunkIndex}</span> ... <span data-testid="node-provenance-offset">{offsetRangeLabel}</span> ...
    <blockquote ...>{excerpt}</blockquote>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-chunk-shows-its-source
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The dl block of
    ChunkDetails, with title and documentDateLabel conditional on being non-null. — <dt className="font-medium">Tipo:</dt>
    ... <dt className="font-medium">Recebido em:</dt> ... {title !== null && ( ... <dt className="font-medium">Título:</dt>
    ...)} {documentDateLabel !== null && ( ... <dt className="font-medium">Data do documento:</dt> ...)}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-chunk-without-locator-has-an-empty-one
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toChunkView, the locator property — locator:
    wire.locator ?? {},'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-counter-change-places-every-node-again
  conforms: true
  how: "src/features/graph/hooks/useForceLayout.ts: held at useForceLayout(), the isReset / pinned lines\
    \ in the effect — const isReset = prevNonceRef.current !== layoutNonce;\nconst pinned = isReset\n\
    \  ? new Map<string, GraphPosition>()\n  : positionsRef.current;"
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/a-delta-carries-its-source-tool-unchanged
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the return statement of mapWireToGraphDelta(),\
    \ lines 67-71 — return {\n    sourceTool: input.sourceTool,\n    nodes: mappedNodes,\n    links: mappedLinks,\n\
    \  };"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-delta-without-state-for-a-node-leaves-it-off
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the node loop, lines 27-40 — const state\
    \ = deriveNodeState(wireNode.status);\n    if (state === undefined) {\n      continue;\n    }\n  \
    \  const node: GraphNodeData = {\n      id: wireNode.id,\n      type: mapNodeType(wireNode.node_type),\n\
    \      label: wireNode.canonical_name,\n      state,\n    };"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-failed-node-read-is-an-alert
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at ErrorView, the\
    \ role=\"alert\" container and the showRetry guard, lines 115-153 — const showRetry = variant ===\
    \ \"generic\";\nrole=\"alert\"\n{showRetry && (\nsrc/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx:\
    \ held at The `query.isError` branch (lines 69-80). It classifies the error and passes a retry that\
    \ reads the node again. The alert markup and the rule that offers retry only for the generic failure\
    \ are not in this file. They sit in `./NodeDetailPanel.shell` (`ErrorView`, `classifyError`), which\
    \ is outside this judgment. — const variant = classifyError(query.error);\nbody = (\n  <ErrorView\n\
    \    variant={variant}\n    closeRef={closeRef}\n    onClose={onClose}\n    onRetry={() => {\n   \
    \   void query.refetch();\n    }}\n  />"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the `query.isError`\
    \ branch (lines 33-58): a `role=\"alert\"` container showing `NODE_DETAIL_COPY.relationshipsError`\
    \ and a button with `NODE_DETAIL_COPY.relationshipsRetry` that calls `query.refetch()`. The branch\
    \ tests only `isError` and never inspects an error code. The strings sit in NodeDetailPanel.copy.ts\
    \ (lines 23-24). — } else if (query.isError) {\n  body = (\n    <div ... role=\"alert\" data-testid=\"\
    node-detail-relationships-error\">\n...\n<span>{NODE_DETAIL_COPY.relationshipsError}</span>\n...\n\
    onClick={() => { void query.refetch(); }}\n...\n{NODE_DETAIL_COPY.relationshipsRetry}\nCopy file:\
    \ relationshipsError: \"Não foi possível carregar as relações.\", relationshipsRetry: \"Tentar novamente\""
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/a-fragment-shows-confidence-status-text-and-chunks
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The data.fragments.map
    article in the body branch of NodeProvenanceChain. — <span data-testid="node-provenance-fragment-confidence">{frag.confidenceLabel}</span>
    ... <span>{frag.status}</span> ... <p ... data-testid="node-provenance-fragment-text">{frag.text}</p>
    {frag.chunks.map((chunk) => ( <ChunkDetails'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-fragment-status-is-free-text
  conforms: true
  how: 'src/features/graph/api/provenance.types.ts: held at the status member of ProvenanceFragmentWire
    (line 25) and ProvenanceFragmentView (line 58) — readonly status: string;'
  encoded_at:
  - src/features/graph/api/provenance.types.ts
- node: rules/graph-explorer/a-gap-change-applies-from-the-next-reveal
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at useGraphReveal(), staggerRef and the effect
    that schedules each step, lines 47-48 and 65 — staggerRef.current = staggerMs;

    ...

    const delay = Math.max(0, staggerRef.current);

    ...

    }, [revealQueue]);'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/a-gap-of-zero-or-less-is-zero
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at the delay computation and setTimeout call
    in the effect, lines 65 and 80 — const delay = Math.max(0, staggerRef.current);

    ...

    timerRef.current = setTimeout(tick, delay);'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/a-graph-change-keeps-every-positioned-node-where-it-is
  conforms: true
  how: "src/features/graph/hooks/useForceLayout.ts: held at runForceLayout(), where simNodes are built,\
    \ plus the non-reset branch of pinned in useForceLayout() — if (pinned !== undefined) {\n  return\
    \ { id, x: pinned.x, y: pinned.y, fx: pinned.x, fy: pinned.y };\n}\nreturn { id };\nsrc/features/graph/lib/layout-radial.ts:\
    \ held at The positioning loop over root.descendants() in runRadialLayout, lines 59-72. A node with\
    \ a pinned position is copied through, and only a node without one is placed from its angle and ring\
    \ radius. — const pinned = pinnedPositions.get(id);\n    if (pinned !== undefined) {\n      out.set(id,\
    \ { x: pinned.x, y: pinned.y });\n      continue;\n    }\nsrc/features/graph/lib/layout-tree.ts: held\
    \ at The pinned branch inside the descendants loop of runTreeLayout, lines 35-39. — const pinned =\
    \ pinnedPositions.get(id);\nif (pinned !== undefined) {\n  out.set(id, { x: pinned.x, y: pinned.y\
    \ });\n  continue;\n}\nout.set(id, { x: node.y ?? 0, y: node.x ?? 0 });"
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
  - src/features/graph/lib/layout-radial.ts
  - src/features/graph/lib/layout-tree.ts
- node: rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the link object built at lines 52-63 —\
    \ label: wireLink.link_type,\n      linkTypeLabel: mapLinkTypeLabel(wireLink.link_type, wireLink.link_type_label),\n\
    \      isTemporal: wireLink.is_temporal,\n      state: deriveLinkState(wireLink.status, wireLink.flags),\n\
    \      ...(wireLink.is_in_effect === undefined\n        ? {}\n        : { inEffect: wireLink.is_in_effect\
    \ }),"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-late-restore-answer-is-discarded
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the cancelled flag in the restore effect,
    lines 33, 42 and 70 — if (cancelled) return; ... return () => { cancelled = true; };'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-link-is-coloured-by-its-type
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at the LINK_STROKE_CLASS
    map (13 slugs), the FALLBACK_STROKE_CLASS constant, and the lookup at line 76 — const linkClass =
    LINK_STROKE_CLASS[data.label] ?? FALLBACK_STROKE_CLASS;

    const FALLBACK_STROKE_CLASS = "stroke-link-related-to";'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-dashed-unless-temporal-and-sure
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at lines 79-81, the
    isUncertain, isDashed and strokeDasharray constants — const isDashed = isUncertain || !data.isTemporal;

    const strokeDasharray = isDashed ? "4 4" : "0";'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-dimmed-when-out-of-effect
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at line 83 (isDimmed),
    applied to the BaseEdge className and to the label div className — const isDimmed = data.inEffect
    === false || data.state === "superseded";

    isDimmed && "opacity-40",'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-hidden-from-assistive-technology
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at the BaseEdge element,
    line 93 — aria-hidden="true"'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-is-kept-only-with-visible-ends
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the visibility check in the link loop,\
    \ lines 44-50 — const sourceVisible =\n      visibleIds.has(wireLink.source_node_id) ||\n      useGraphStore.getState().nodes.has(wireLink.source_node_id);\n\
    ...\n    if (!sourceVisible || !targetVisible) continue;"
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
- node: rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node
  conforms: false
  how: 'src/features/graph/api/traversal.types.ts, the `LinkDirection` type, line 36: export type LinkDirection
    = "outgoing" | "incoming"; — The two direction values are decided by rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node,
    which the candidate index binds only to src/features/graph/api/traversal.transforms.ts. This file
    declares the enumeration as its own vocabulary. A change to the node does not reach this file through
    `--check`.'
  observed_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/a-link-meets-each-node-at-its-border
  conforms: true
  how: 'src/features/graph/lib/edge-params.ts: held at getNodeIntersection (lines 12-43) computes the
    point where the line between the two node centres crosses the node''s border. getEdgePosition (lines
    45-63) picks the side in the order left, right, top, bottom, with bottom as the fallback. — const
    px = Math.round(point.x);

    if (px <= nx + 1) return Position.Left;

    if (px >= nx + w - 1) return Position.Right;

    if (py <= ny + 1) return Position.Top;

    if (py >= ny + h - 1) return Position.Bottom;

    return Position.Bottom;'
  encoded_at:
  - src/features/graph/lib/edge-params.ts
- node: rules/graph-explorer/a-link-needs-both-measured-nodes-to-be-drawn
  conforms: true
  how: 'src/features/graph/lib/edge-params.ts: held at The guard in getEdgeParams (lines 69-74), which
    returns null so no link is drawn unless both nodes exist and have a non-zero measured width and height.
    — if (!source || !target) return null;

    if (sw === 0 || sh === 0 || tw === 0 || th === 0) return null;'
  encoded_at:
  - src/features/graph/lib/edge-params.ts
- node: rules/graph-explorer/a-link-needs-data-and-measured-nodes
  conforms: true
  how: "src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at the two early returns,\
    \ lines 57-64 — if (!data) {\n  return null;\n}\nconst params = getEdgeParams(sourceNode, targetNode);\n\
    if (!params) {\n  return null;\n}"
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-link-shows-the-catalog-label
  conforms: true
  how: 'src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at the label div''s
    child, line 118 — {data.linkTypeLabel}'
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/a-linkless-node-is-still-placed
  conforms: true
  how: "src/features/graph/hooks/useForceLayout.ts: held at the output loop at the end of runForceLayout(),\
    \ which iterates every simNode whether or not it has links — for (const n of simNodes) {\n  out.set(n.id,\
    \ { x: n.x ?? 0, y: n.y ?? 0 });\n}"
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/a-node-click-only-reports-the-node-id
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at handleNodeClick, lines 134-140\
    \ — if (!onNodeSelect) return;\n        onNodeSelect(node.id);\nsrc/features/graph/components/GraphSpace/GraphSpace.tsx:\
    \ held at GraphCanvasRegion, the `canvasNodeSelectProp` spread into `<GraphCanvas ... {...canvasNodeSelectProp}\
    \ />`, and the `onNodeSelect` forwarding in GraphSpace — const canvasNodeSelectProp =\n    onNodeSelect\
    \ !== undefined ? { onNodeSelect } : {};\n... {...canvasNodeSelectProp}"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/a-node-failure-is-classified-by-its-code
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at classifyError,
    lines 9-15 — if (err === null || typeof err !== "object") return "generic";

    const code = (err as { code?: unknown }).code;

    if (code === "RESOURCE_NOT_FOUND") return "not-found";

    if (code === "BUSINESS_NODE_DELETED") return "deleted";

    return "generic";'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
- node: rules/graph-explorer/a-node-is-drawn-with-its-type-label-state-and-selection
  conforms: true
  how: "src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx: held at The DsGraphNode element\
    \ in GraphNodeAdapter's returned fragment (lines 24-30), together with the stateProp and subtitleProp\
    \ spreads built at lines 13-14. — <DsGraphNode\n  type={data.type}\n  label={data.label}\n  {...stateProp}\n\
    \  {...subtitleProp}\n  selected={selected ?? false}\n/>"
  encoded_at:
  - src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
- node: rules/graph-explorer/a-node-s-link-endpoints-are-inert
  conforms: true
  how: 'src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx: held at The two Handle elements
    (lines 17-23 and 31-37) and the HANDLE_CLASSES constant (lines 6-7). — isConnectable={false}

    aria-hidden="true"

    className={HANDLE_CLASSES}

    ...

    "!size-2 !min-w-0 !rounded-pill !border !border-border-glass !bg-surface-glass-panel opacity-0 pointer-events-none"'
  encoded_at:
  - src/features/graph/components/GraphNodeAdapter/GraphNodeAdapter.tsx
- node: rules/graph-explorer/a-node-without-position-sits-at-the-origin
  conforms: true
  how: 'src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at toRfNodes, line 52 — position:
    pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 },'
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/a-pending-save-is-dropped-on-leaving
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the cleanup of the subscribe effect,
    lines 113-119. It reruns when conversationId changes, because handleStoreChange depends on it, and
    when the screen unmounts. — return () => { unsubscribe(); if (debounceTimer.current !== null) { clearTimeout(debounceTimer.current);
    debounceTimer.current = null; } };'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-provenance-answer-is-a-list-of-fragments
  conforms: true
  how: "src/features/graph/api/provenance.transforms.ts: held at toProvenanceResponse, toFragmentView\
    \ and toChunkView — return { fragments: wire.fragments.map(toFragmentView) };\n...\nid: wire.id, text:\
    \ wire.text, confidence: wire.confidence, confidenceLabel: formatConfidenceLabel(wire.confidence)\
    \ ?? \"0%\", status: wire.status, chunks: wire.chunks.map(toChunkView),\n...\nid: wire.id, chunkIndex:\
    \ wire.chunk_index, offsetStart: wire.offset_start, offsetEnd: wire.offset_end, ... excerpt: wire.excerpt,\
    \ locator: wire.locator ?? {}, rawInformation: toRawInformationView(wire.raw_information),\nsrc/features/graph/api/provenance.types.ts:\
    \ held at ProvenanceFragmentWire and ProvenanceChunkWire, lines 11-27, with the view counterparts\
    \ at lines 42-60 — readonly id: string;\n  readonly text: string;\n  readonly confidence: number;\n\
    \  readonly status: string;\n  readonly chunks: ReadonlyArray<ProvenanceChunkWire>;"
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
  - src/features/graph/api/provenance.types.ts
- node: rules/graph-explorer/a-read-needs-a-non-empty-identity
  conforms: true
  how: 'src/features/graph/api/useNodeDetail.ts: held at the enabled option, line 22 (the node read; the
    relationships and provenance reads are not in this file) — enabled: typeof id === "string" && id.length
    > 0,

    src/features/graph/api/useNodeRelationships.ts: held at the enabled option, line 25. The provenance
    half of the rule has no counterpart in this file. — enabled: typeof id === "string" && id.length >
    0,

    src/features/graph/api/useProvenance.ts: held at the enabled option of the useQuery call, line 28
    — enabled: enabled && id.length > 0,'
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
- node: rules/graph-explorer/a-read-stays-fresh-five-minutes
  conforms: true
  how: 'src/features/graph/api/useNodeDetail.ts: held at STALE_MS on line 8, applied on lines 23-24 (the
    node detail read; the relationships and provenance reads are not in this file) — const STALE_MS =
    5 * 60_000;

    staleTime: STALE_MS,

    refetchOnWindowFocus: false,

    src/features/graph/api/useNodeRelationships.ts: held at the STALE_MS constant (line 11) and the staleTime
    and refetchOnWindowFocus options (lines 26-27). — const STALE_MS = 5 * 60_000;

    ...

    staleTime: STALE_MS,

    refetchOnWindowFocus: false,

    src/features/graph/api/useProvenance.ts: held at the STALE_MS constant (line 12) and the staleTime
    and refetchOnWindowFocus options (lines 29-30) — const STALE_MS = 5 * 60_000;

    staleTime: STALE_MS,

    refetchOnWindowFocus: false,'
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
- node: rules/graph-explorer/a-redacted-original-input-is-never-shown
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts: held at the originalInputRedacted
    and originalInputRedactedAria entries of NODE_DETAIL_COPY, lines 38-39 — originalInputRedacted: "Texto
    original redigido.",

    originalInputRedactedAria: "Texto original redigido por conformidade.",

    src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The REDACTED_SENTINEL
    constant and the two originalInput branches of ChunkDetails. The sentinel is excluded from the verbatim
    branch and rendered only as the redacted notice. The notice text and its aria-label are read from
    NODE_DETAIL_COPY. — const REDACTED_SENTINEL = "[REDACTED]"; ... originalInput !== REDACTED_SENTINEL
    && ( ... {originalInput === REDACTED_SENTINEL && ( <p ... aria-label={NODE_DETAIL_COPY.originalInputRedactedAria}
    ...>{NODE_DETAIL_COPY.originalInputRedacted}</p>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/a-relationship-badge-follows-its-effective-status
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at line 91, in NodeRelationshipRow
    — const badgeState = mapAttributeStatusToBadge(link.effectiveStatus, "accepted");'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/a-relationship-row-shows-arrow-type-neighbour-confidence-and-status
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at the first flex
    row of the `<li>`, lines 105-137 — <span ... aria-hidden="true" data-testid="node-detail-relationship-arrow">{link.directionArrow}</span>
    ... {link.directionLabel} ... {link.neighborName} ... {link.confidenceLabel} ... <StateBadge state={badgeState}
    size="sm" iconOnly />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/a-relationship-row-shows-its-validity
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at the conditional
    block at lines 138-144 — {(link.validFromLabel !== null || link.validToLabel !== null) && ( <div ...>{link.validFromLabel
    ?? "—"}{" → "}{link.validToLabel ?? "—"}</div> )}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/a-relationship-shows-fixed-fields
  conforms: true
  how: 'src/features/graph/api/traversal.transforms.ts: held at the object returned by toLinkView, lines
    34-51 — linkType: wire.link_type, effectiveStatus: wire.effective_status, isInEffect: wire.is_in_effect,
    confidence: wire.confidence, confidenceLabel: formatConfidenceLabel(wire.confidence) ?? "0%", validFromLabel:
    formatDateLabel(wire.valid_from), validToLabel: formatDateLabel(wire.valid_to), flags: wire.flags
    ?? [], provenance: (wire.provenance ?? []).map(toProvenanceEntryView)

    The object carries none of status, is_current, recorded_at, superseded_at, hop or score.

    src/features/graph/api/traversal.types.ts: held at `TraversalLinkView`, lines 38-55 — readonly linkType:
    string;

    readonly effectiveStatus: AttributeWireEffectiveStatus;

    readonly isInEffect: boolean;

    readonly confidenceLabel: string;

    readonly validFromLabel: string | null;

    readonly validToLabel: string | null;

    readonly flags: ReadonlyArray<string>;

    readonly provenance: ReadonlyArray<ProvenanceEntryView>;

    The view declares no status, is_current, recorded_at, superseded_at, hop or score.'
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
  - src/features/graph/api/traversal.types.ts
- node: rules/graph-explorer/a-save-follows-a-graph-change
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the useGraphStore.subscribe callback,
    lines 104-112 — state.nodes !== prevState.nodes || state.positions !== prevState.positions || state.layoutNonce
    !== prevState.layoutNonce'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-save-is-a-put-of-json
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the request in the timer callback, lines
    91-97 — method: "PUT", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(snapshot),'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-save-waits-800-milliseconds
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at handleStoreChange(), lines 84-100 — if
    (debounceTimer.current !== null) { clearTimeout(debounceTimer.current); } debounceTimer.current =
    setTimeout(() => { ... }, 800);'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-saved-view-holds-positions-and-pins
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the GraphViewSnapshot type, lines 6-21.
    The save body is built by getSnapshot() in the store, which is not in this file. — readonly version:
    2; readonly nodes: unknown[]; readonly links: unknown[]; readonly positions: Record<string, { x: number;
    y: number }>; readonly user_pinned: string[]; readonly layout_algorithm: "force" | "tree" | "radial";'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/a-snapshot-carries-its-version-and-fields
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at GraphSnapshotV1 and GraphSnapshotV2 (lines 45-60)
    and getSnapshot (lines 259-273) — version: 2 as const,

    nodes: Array.from(nodes.values()),

    links: Array.from(links.values()),

    positions: posObj,

    user_pinned: Array.from(userPinned),

    layout_algorithm: layoutAlgorithm,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/a-source-date-time-is-short-pt-br
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at RECEIVED_AT_DATETIME and formatReceivedAtDateTime
    — const RECEIVED_AT_DATETIME = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short",
    });

    ...

    if (Number.isNaN(dt.getTime())) return iso;

    return RECEIVED_AT_DATETIME.format(dt);'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-source-shows-its-id-type-dates-and-title
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toRawInformationView, the base object
    — id: wire.id, sourceType: wire.source_type, receivedAtLabel: formatReceivedAtDateTime(wire.received_at),
    title: readMetadataTitle(wire.metadata), documentDateLabel: readMetadataDocumentDate(wire.metadata),'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at DATE_FORMATTER and formatDateLabel(), lines 40-64
    — const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year:
    "numeric", timeZone: "UTC", }); if (date === null) return null; if (parts.length !== 3) return date;
    ... if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) { return date;
    } ... if (Number.isNaN(dt.getTime())) return date; return DATE_FORMATTER.format(dt);

    src/features/graph/api/provenance.transforms.ts: held at readMetadataDocumentDate delegates the formatting
    to formatDateLabel, which is declared in _transforms.ts. The day/month/year, UTC and raw-text-fallback
    behavior sits there, not in this file. — return formatDateLabel(d);

    (_transforms.ts: `if (parts.length !== 3) return date;` ... `new Date(Date.UTC(year, month - 1, day))`)'
  encoded_at:
  - src/features/graph/api/_transforms.ts
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/a-weak-state-overrides-the-type-colour
  conforms: true
  how: "src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx: held at stateStrokeClass\
    \ (lines 31-44) and the precedence at line 77 — case \"accepted\":\ncase \"low-confidence\":\ncase\
    \ undefined:\n  return null;\nconst strokeColorClass = stateClass ?? linkClass;"
  encoded_at:
  - src/features/graph/components/GraphEdgeAdapter/GraphEdgeAdapter.tsx
- node: rules/graph-explorer/add-keeps-links-whose-nodes-are-missing
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the link loop in addNodes, lines 111-113 — for\
    \ (const link of delta.links) {\n  nextLinks.set(link.id, link);\n}"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/add-marks-a-delta-received
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at the object returned by addNodes, line 119 — receivedDeltaThisTurn:
    true,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/add-merges-by-identity
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at addNodes, lines 100-113 — nextNodes.set(node.id,
    node);

    nextLinks.set(link.id, link);'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/add-queues-only-unseen-nodes
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the node loop in addNodes, lines 104-109 — if\
    \ (!state.revealedIds.has(node.id) && !nextNodes.has(node.id)) {\n  nextRevealQueue.push(node.id);\n\
    }"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/an-absent-original-input-shows-nothing
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The typeof originalInput
    === "string" guard and the === REDACTED_SENTINEL guard of ChunkDetails. Null or undefined satisfies
    neither, so nothing renders. — {typeof originalInput === "string" && originalInput !== REDACTED_SENTINEL
    && ( <details'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-attribute-hides-its-bookkeeping-fields
  conforms: true
  how: "src/features/graph/api/_transforms.ts: held at toAttributeView(), lines 74-87 — return { id: wire.id,\
    \ key: wire.attribute_key, value: wire.value, valueType: wire.value_type, effectiveStatus: wire.effective_status,\
    \ isInEffect: wire.is_in_effect, state: mapAttributeStatusToBadge(wire.effective_status, wire.status),\
    \ validFromLabel: formatDateLabel(wire.valid_from), validToLabel: formatDateLabel(wire.valid_to),\
    \ provenance: (wire.provenance ?? []).map(toProvenanceEntryView), };\nsrc/features/graph/api/node-detail.types.ts:\
    \ held at NodeAttributeView, lines 76-87 — export interface NodeAttributeView {\n  readonly id: string;\n\
    \  readonly key: string;\n  readonly value: string;\n  readonly valueType: AttributeWire[\"value_type\"\
    ];\n  readonly effectiveStatus: AttributeWireEffectiveStatus;\n  readonly isInEffect: boolean;\n \
    \ readonly state: ConfidenceState;\n  readonly validFromLabel: string | null;\n  readonly validToLabel:\
    \ string | null;\n  readonly provenance: ReadonlyArray<ProvenanceEntryView>;\n}\nThe view carries\
    \ the id, key, value, value type, effective status, in-effect flag, badge, validity labels and provenance.\
    \ It declares no is_current, confidence or node_id. The wire shape AttributeWire carries those three,\
    \ which is the wire and not what is shown."
  encoded_at:
  - src/features/graph/api/_transforms.ts
  - src/features/graph/api/node-detail.types.ts
- node: rules/graph-explorer/an-attribute-row-shows-key-value-state-and-validity
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the first <tr> of
    NodeAttributeRow, lines 103-122 — <td className="p-xs align-top">{attr.key}</td> ... <span>{attr.value}</span>
    ... {(attr.validFromLabel !== null || attr.validToLabel !== null) && ( ... {attr.validFromLabel ??
    "—"}{" → "}{attr.validToLabel ?? "—"} ... <StateBadge state={attr.state} size="sm" iconOnly />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
- node: rules/graph-explorer/an-attribute-without-provenance-has-an-empty-list
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at the provenance field of toAttributeView(), line
    85 — provenance: (wire.provenance ?? []).map(toProvenanceEntryView),

    src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the first statement of
    NodeAttributeRow, line 99 — const provenance = attr.provenance ?? [];'
  encoded_at:
  - src/features/graph/api/_transforms.ts
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
- node: rules/graph-explorer/an-inline-entry-hides-what-it-lacks
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at toProvenanceEntryView() and formatConfidenceLabel(),
    lines 89-129 — const confidence = typeof wire.confidence === "number" && Number.isFinite(wire.confidence)
    ? wire.confidence : null; return { fragmentId: wire.fragment_id, fragmentText: wire.fragment_text,
    confidence, confidenceLabel: formatConfidenceLabel(confidence), rawInformationId: wire.raw_information_id
    ?? null, sourceType: wire.source_type ?? null, receivedAtLabel: formatReceivedAtLabel(wire.received_at),
    excerpt: wire.excerpt ?? null, };'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/an-inline-entry-shows-its-date-only
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at RECEIVED_AT_FORMATTER and formatReceivedAtLabel(),
    lines 97-110 — const RECEIVED_AT_FORMATTER = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month:
    "2-digit", year: "numeric", }); if (iso === undefined || iso === null) return null; const dt = new
    Date(iso); if (Number.isNaN(dt.getTime())) return iso; return RECEIVED_AT_FORMATTER.format(dt);'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/an-origin-failure-is-an-alert-with-a-retry-unless-deleted
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The isError branch
    of NodeProvenanceChain. — const showRetry = variant !== "deleted"; ... role="alert" ... {showRetry
    && ( <button type="button" onClick={onRetry}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-origin-failure-is-classified-by-its-code
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at classifyProvenanceError,
    lines 13-20. — if (err === null || typeof err !== "object") return "unknown"; ... if (code === "RESOURCE_NOT_FOUND")
    return "not-found"; if (code === "BUSINESS_RAW_INFORMATION_DELETED") return "deleted"; if (typeof
    code === "string" && code.startsWith("SYSTEM_")) return "generic"; return "unknown";'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-origin-failure-reads-its-wording
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The message selection
    in the isError branch. Each variant picks its copy key, and the strings themselves are in NodeDetailPanel.copy.ts:
    originNotFound "Origem não encontrada.", originDeleted "Documento original removido por conformidade.",
    originError "Não foi possível carregar a origem.". — variant === "deleted" ? NODE_DETAIL_COPY.originDeleted
    : variant === "not-found" ? NODE_DETAIL_COPY.originNotFound : NODE_DETAIL_COPY.originError'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-origin-without-fragments-says-not-found
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The empty branch
    of NodeProvenanceChain, after the pending and error branches. — if (data === undefined || data.fragments.length
    === 0) { return ( <p ... data-testid="node-provenance-empty"> {NODE_DETAIL_COPY.originNotFound}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-original-input-is-shown-verbatim
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The details element
    in ChunkDetails. The summary text is NODE_DETAIL_COPY.originalInputSummary, which reads "Texto original
    do operador" in NodeDetailPanel.copy.ts. — <details ...><summary ...>{NODE_DETAIL_COPY.originalInputSummary}</summary><p
    className="mt-xs whitespace-pre-wrap" ...>{originalInput}</p></details>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/an-unformatted-confidence-shows-zero-percent
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at toFragmentView, the confidenceLabel property
    — confidenceLabel: formatConfidenceLabel(wire.confidence) ?? "0%",

    src/features/graph/api/traversal.transforms.ts: held at toLinkView, line 46 — confidenceLabel: formatConfidenceLabel(wire.confidence)
    ?? "0%",'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/attribute-badge-follows-a-fixed-precedence
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at mapAttributeStatusToBadge(), lines 29-38 — if (effective
    === "disputed") return "disputed"; if (effective === "uncertain") return "uncertain"; if (effective
    === "inactive") return "superseded"; if (assertion === "superseded") return "superseded"; return "accepted";'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/attributes-in-effect-come-first-by-key
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at sortAttributes(), lines 131-140 — return [...attrs].sort((a,
    b) => { if (a.isInEffect !== b.isInEffect) { return a.isInEffect ? -1 : 1; } return a.key.localeCompare(b.key,
    "pt-BR", { sensitivity: "base" }); });'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/choosing-a-layout-releases-the-pins
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at setLayoutAlgorithm, lines 209-218 — if (state.layoutAlgorithm\
    \ === algo) return {};\nreturn {\n  layoutAlgorithm: algo,\n  userPinned: new Set<string>(),\n  layoutNonce:\
    \ state.layoutNonce + 1,\n};"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/closing-the-drawer-returns-focus-to-curar
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at `handleDrawerOpenChange`,\
    \ lines 38-45. It is wired to `CurationDrawer` through `onOpenChange`. — if (!next) {\n  requestAnimationFrame(()\
    \ => {\n    curateButtonRef.current?.focus();\n  });\n}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/confidence-is-a-rounded-percentage
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at formatConfidenceLabel(), lines 89-95 — return `${Math.round(confidence
    * 100)}%`;'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/curar-opens-the-drawer-for-the-target
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at The `onCurate` prop\
    \ given to `SuccessView` and the `CurationDrawer` element, lines 89 and 128-138. It opens the drawer\
    \ with the target's kind and item id and the node's canonical name as the label. No navigation is\
    \ performed. `deriveCurationTarget` is in `./NodeDetailPanel.curation`. — onCurate={() => setDrawerOpen(true)}\n\
    ...\nkind={curationTarget.kind}\nitemId={curationTarget.itemId}\n{...(query.data?.canonicalName !==\
    \ undefined\n  ? { itemLabel: query.data.canonicalName }\n  : {})}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/curation-target-follows-the-node
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts: held at deriveCurationTarget(),\
    \ lines 9-24: the needs_review branch, then the loop over data.attributes, then the null return —\
    \ if (data.status === \"needs_review\") {\n    return { kind: \"entity_match\", itemId: data.id };\n\
    \  }\n  for (const attr of data.attributes) {\n    if (\n      attr.effectiveStatus === \"uncertain\"\
    \ ||\n      attr.effectiveStatus === \"disputed\"\n    ) {\n      return { kind: \"disputed\", itemId:\
    \ attr.id };\n    }\n  }\n  return null;"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.curation.ts
- node: rules/graph-explorer/direction-picks-the-link-wording
  conforms: false
  how: 'src/features/graph/api/traversal.types.ts, the `directionArrow` member of `TraversalLinkView`,
    line 43: readonly directionArrow: "→" | "←"; — The rule that an outgoing link carries → and an incoming
    link ← is held by rules/graph-explorer/direction-picks-the-link-wording, whose candidate index entry
    binds only src/features/graph/api/traversal.transforms.ts. This file declares the two arrow characters
    as a vocabulary of its own. If the node moves, `--check` does not reach this file, and the two declarations
    can disagree with no way to tell which one was decided.'
  observed_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/empty-reveal-queue-ends-revealing
  conforms: true
  how: "src/features/graph/hooks/useGraphReveal.ts: held at the empty-queue branch of the effect (lines\
    \ 53-58), drainAll() (lines 14-31) and the end of tick() (lines 73-77) — if (revealQueue.length ===\
    \ 0) {\n  if (useGraphStore.getState().status === \"revealing\") {\n    useGraphStore.getState().setStatus(\"\
    ready\");\n  }\n  return;\n}"
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/empty-state-tells-where-memory-will-appear
  conforms: true
  how: "src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx: held at GRAPH_EMPTY_STATE_COPY\
    \ (lines 5-6) and its sole render inside the <p> of GraphEmptyState (lines 20-24) — export const GRAPH_EMPTY_STATE_COPY\
    \ =\n  \"A memória aparecerá aqui conforme você conversa.\";\n...\n<p\n  className=\"text-xs text-muted-foreground\
    \ text-center max-w-md\"\n>\n  {GRAPH_EMPTY_STATE_COPY}\n</p>\nThe copy matches the node's statement\
    \ exactly. The rendered tree is a single div holding a single p, with no spinner, no button and no\
    \ link, so there is no action."
  encoded_at:
  - src/features/graph/components/GraphEmptyState/GraphEmptyState.tsx
- node: rules/graph-explorer/empty-status-without-nodes-shows-only-the-empty-state
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at GraphSpace, `showEmptyState`\
    \ and the ternary that renders `<GraphEmptyState />` or the canvas — const showEmptyState = status\
    \ === \"empty\" && nodes.length === 0;\n... {showEmptyState ? (\n        <GraphEmptyState />\n   \
    \   ) : (\n        <ReactFlowProvider>"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/ending-a-turn-resets-the-delta-mark
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at every branch of settleTurn, lines 240-257 — set({
    status: "ready", errorMessage: undefined, receivedDeltaThisTurn: false });

    set({ receivedDeltaThisTurn: false });

    set({ status: "error", receivedDeltaThisTurn: false });'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
  conforms: true
  how: "src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at GRAPH_STATUS_ERROR_DEFAULT_COPY,\
    \ and the `message` expression in GraphStatusOverlay (lines 9-21). The component renders only the\
    \ message span, with no button or link. — export const GRAPH_STATUS_ERROR_DEFAULT_COPY =\n  \"Não\
    \ foi possível carregar o grafo agora.\";\nconst message = isError\n  ? (errorMessage ?? GRAPH_STATUS_ERROR_DEFAULT_COPY)\n\
    \  : GRAPH_STATUS_LOADING_COPY;"
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/escape-closes-the-panel
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at `onKeyDown` on the\
    \ panel root (lines 50-55 and 109). — if (event.key === \"Escape\") {\n  event.preventDefault();\n\
    \  onClose();\n}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/every-item-offers-its-full-origin
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at LazyOrigin, lines
    66-92, rendered unconditionally for every attribute at line 129. The provenance read is enabled only
    while the disclosure is open. — const [open, setOpen] = useState(false); const query = useProvenance("attributes",
    attributeId, open); ... onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} ...
    <LazyOrigin attributeId={attr.id} />

    src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at LazyLinkOrigin (lines
    59-84), rendered for every row at line 149. The disclosure label comes from NODE_DETAIL_COPY.originSummary,
    defined in another file. — const query = useProvenance("links", linkId, open); ... onToggle={(e) =>
    setOpen((e.currentTarget as HTMLDetailsElement).open)} ... {open && (<NodeProvenanceChain ... />)}
    ... <LazyLinkOrigin linkId={link.id} />'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/fit-and-recenter-take-300-milliseconds
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the fitView and recenter members\
    \ of the imperative handle, lines 121-129, with DEFAULT_VIEWPORT on line 41 — rfApi.fitView({ duration:\
    \ 300, padding: 0.1 });\nrfApi.setViewport(\n          { x: DEFAULT_VIEWPORT.x, y: DEFAULT_VIEWPORT.y,\
    \ zoom: DEFAULT_VIEWPORT.zoom },\n          { duration: 300 },\n        );\nconst DEFAULT_VIEWPORT\
    \ = { x: 0, y: 0, zoom: 0.75 } as const;"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/focusing-a-node-centres-it-at-zoom-one
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the focusNode member of the\
    \ imperative handle, lines 113-120 — const node = rfApi.getNode(id);\n        if (!node) return;\n\
    \        const cx = node.position.x + (measured?.width ?? 0) / 2;\n        const cy = node.position.y\
    \ + (measured?.height ?? 0) / 2;\n        rfApi.setCenter(cx, cy, { zoom: 1, duration: 300 });"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/force-layout-keeps-nodes-270-apart
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the constants NODE_FOOTPRINT, COLLIDE_RADIUS,
    LINK_DISTANCE, CHARGE_STRENGTH, CENTER_X and CENTER_Y, and the forces built from them in runForceLayout()
    — const NODE_FOOTPRINT = 270;

    const COLLIDE_RADIUS = NODE_FOOTPRINT / 2;

    const LINK_DISTANCE = NODE_FOOTPRINT;

    const CHARGE_STRENGTH = -300;

    const CENTER_X = 0;

    const CENTER_Y = 0;

    .force("center", forceCenter<SimNode>(CENTER_X, CENTER_Y))'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/force-layout-runs-a-hundred-silent-ticks
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at SIM_TICKS and the stop-then-tick sequence
    in runForceLayout() — const SIM_TICKS = 100;

    .stop();

    simulation.tick(SIM_TICKS);'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/graph-view-requests-carry-the-same-token-header-as-chat
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the authHeader import and its two uses,
    on the GET and on the PUT — import { authHeader } from "@/features/chat/api/_request"; ... headers:
    authHeader() ... headers: { "Content-Type": "application/json", ...authHeader() }'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/inline-entries-show-text-and-what-they-have
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at the entries.map in
    InlineProvenance, lines 25-56 — <p className="text-xs text-foreground">{p.fragmentText}</p> ... {p.confidenceLabel
    !== null && ( ... )} {p.sourceType !== null && ( ... )} {p.receivedAtLabel !== null && ( ... )}'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
- node: rules/graph-explorer/inline-provenance-needs-an-entry
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx: held at The guard on the inline\
    \ disclosure, line 126-128. The summary wording (Proveniência, count in parentheses, entrada/entradas)\
    \ is delegated to NODE_DETAIL_COPY.attributeProvenanceSummary in NodeDetailPanel.copy.ts, where `Proveniência\
    \ (${n} ${n === 1 ? \"entrada\" : \"entradas\"})` is declared. The \"Proveniência do link\" variant\
    \ belongs to the relationship row, not this file. — const hasInlineProvenance = provenance.length\
    \ > 0; ... {hasInlineProvenance && (<InlineProvenance entries={provenance} />)} ... {NODE_DETAIL_COPY.attributeProvenanceSummary(entries.length)}\n\
    src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts: held at the attributeProvenanceSummary\
    \ and linkProvenanceSummary functions, lines 17-18 and 25-26. The count and the singular/plural wording\
    \ sit here. The rule that the disclosure appears only when at least one entry exists is held in the\
    \ consuming components, not in this file. — attributeProvenanceSummary: (n: number) =>\n    `Proveniência\
    \ (${n} ${n === 1 ? \"entrada\" : \"entradas\"})`,\nlinkProvenanceSummary: (n: number) =>\n    `Proveniência\
    \ do link (${n} ${n === 1 ? \"entrada\" : \"entradas\"})`,\nsrc/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx:\
    \ held at line 97 and line 146-148, with the summary built by NODE_DETAIL_COPY.linkProvenanceSummary(entries.length)\
    \ at line 21. The wording (\"Proveniência do link\", the count, entrada/entradas) sits in NodeDetailPanel.copy.ts,\
    \ outside this file. — const hasInlineProvenance = provenance.length > 0; ... {hasInlineProvenance\
    \ && (<LinkInlineProvenance entries={provenance} />)}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeAttributeRow.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/layout-controls-need-nodes-and-a-handler
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the Panel condition, lines\
    \ 180-182 — {visibleNodes.length > 0 &&\n        (onResetLayout || (layoutAlgorithm && onLayoutAlgorithmChange))\
    \ && (\n          <Panel position=\"top-right\">"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/layout-defaults-to-force
  conforms: true
  how: "src/features/graph/hooks/useForceLayout.ts: held at the switch on layoutAlgorithm in useForceLayout()\
    \ — case \"force\":\ndefault:\n  next = runForceLayout(nodeIds, linkPairs, pinned);\n  break;\nsrc/features/graph/state/graph-store.ts:\
    \ held at makeInitialState (line 91) and the hydrate fallback (lines 292-295). The fallback for an\
    \ unrecognized algorithm sits in the switch default of src/features/graph/hooks/useForceLayout.ts,\
    \ not in this file. — layoutAlgorithm: \"force\",\nsnapshot.version === 2 && \"layout_algorithm\"\
    \ in snapshot\n  ? snapshot.layout_algorithm\n  : \"force\";"
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/layout-reruns-on-graph-or-counter-change
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the dependency array of the useEffect in useForceLayout().
    Positions are read through positionsRef and are not a dependency, so a hand move does not re-run the
    layout. — const positionsRef = useRef(positions);

    positionsRef.current = positions;

    }, [nodes, links, layoutNonce]);'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
- node: rules/graph-explorer/link-state-follows-a-fixed-precedence
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at deriveLinkState(), lines 41-60 — if (status === "superseded")
    { return "superseded"; } ... if (flags.includes("disputed")) { return "disputed"; } if (flags.includes("low_confidence"))
    { return "low-confidence"; } if (flags.includes("uncertain")) { return "uncertain"; } ... return "accepted";'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/link-text-is-the-catalog-label-or-the-spaced-slug
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at mapLinkTypeLabel(), lines 62-70 — if (linkTypeLabel !==
    undefined && linkTypeLabel.trim().length > 0) { return linkTypeLabel; } return linkType.replace(/_/g,
    " ");'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/link-type-slug-is-kept-apart-from-its-text
  conforms: true
  how: 'src/features/graph/types.ts: held at the interface GraphLinkData (lines 12-21), which declares
    label and linkTypeLabel as two separate required fields. The file declares the shape only. Nothing
    in it says the label holds the slug or that the slug is never the shown text, so the rule''s enforcement
    is outside this file. — readonly label: string;

    readonly linkTypeLabel: string;'
  encoded_at:
  - src/features/graph/types.ts
- node: rules/graph-explorer/links-with-a-missing-endpoint-are-left-out-of-layouts
  conforms: true
  how: 'src/features/graph/hooks/useForceLayout.ts: held at the simLinks filter in runForceLayout(). The
    tree and radial layouts live in lib/layout-tree.ts and lib/layout-radial.ts, which are outside this
    file set. — .filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))

    src/features/graph/lib/spanning-tree.ts: held at buildSpanningTree, the link loop at lines 23-30,
    guard at line 27 — const srcSet = adj.get(source);

    const tgtSet = adj.get(target);

    if (!srcSet || !tgtSet) continue;'
  encoded_at:
  - src/features/graph/hooks/useForceLayout.ts
  - src/features/graph/lib/spanning-tree.ts
- node: rules/graph-explorer/lists-keep-the-answered-order
  conforms: true
  how: "src/features/graph/api/mapWireToGraphDelta.ts: held at the two in-order loops that push to mappedNodes\
    \ and mappedLinks, lines 27-40 and 43-65 — for (const wireNode of input.nodes) {\n...\n    mappedNodes.push(node);\n\
    ...\n  for (const wireLink of input.links) {\n...\n    mappedLinks.push(link);\nsrc/features/graph/api/provenance.transforms.ts:\
    \ held at toProvenanceResponse and toFragmentView, which map without sorting or filtering — return\
    \ { fragments: wire.fragments.map(toFragmentView) };\n...\nchunks: wire.chunks.map(toChunkView),\n\
    src/features/graph/api/traversal.transforms.ts: held at toTraversalResult, line 60, and indexNodes,\
    \ lines 15-21 — links: wire.links.map((l) => toLinkView(l, wire.starting_node_id, nodesById)),\nThe\
    \ map keeps the order of wire.links, and the nodes are only indexed by id, so no sort or reorder is\
    \ applied."
  encoded_at:
  - src/features/graph/api/mapWireToGraphDelta.ts
  - src/features/graph/api/provenance.transforms.ts
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/loading-and-error-overlay-the-canvas
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at GraphCanvasRegion, `overlayVariant`\
    \ and the overlay rendered after `<GraphCanvas>` in the same container — const overlayVariant =\n\
    \    status === \"loading\" ? \"loading\" : status === \"error\" ? \"error\" : null;\n... {overlayVariant\
    \ !== null && (\n        <GraphStatusOverlay variant={overlayVariant} {...overlayErrorProp} />\n \
    \     )}"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/loading-overlay-says-it-is-searching
  conforms: true
  how: "src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at GRAPH_STATUS_LOADING_COPY\
    \ (line 7), the spinner rendered when `!isError` (lines 47-52), and the message span (lines 53-60).\
    \ — export const GRAPH_STATUS_LOADING_COPY = \"Buscando na memória…\";\n{!isError && (\n  <Loader2\n\
    \    className=\"size-4 shrink-0 animate-spin text-foreground\"\n    aria-hidden=\"true\"\n  />\n\
    )}"
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/merged-or-deleted-node-has-no-state-and-is-left-off
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at the merged, deleted and default branches of deriveNodeState(),
    lines 33-37 — case "merged": case "deleted": return undefined; default: return undefined;'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/missing-flags-and-provenance-are-empty-lists
  conforms: true
  how: 'src/features/graph/api/traversal.transforms.ts: held at toLinkView, lines 49-50 — flags: wire.flags
    ?? [],

    provenance: (wire.provenance ?? []).map(toProvenanceEntryView),'
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/moving-a-node-pins-it
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at setNodePosition, lines 191-200 — if (!state.nodes.has(id))
    return {};

    nextPositions.set(id, position);

    nextUserPinned.add(id);'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/node-badge-follows-the-node-status
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at mapNodeStatusToBadge(), lines 16-27 — case "active":
    return "accepted"; case "needs_review": return "uncertain"; case "merged": return "superseded"; case
    "deleted": return "superseded";'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/node-detail-has-no-merged-into-by-default
  conforms: true
  how: 'src/features/graph/api/_transforms.ts: held at toNodeDetail() and toAliasView(), lines 66-72 and
    142-154 — mergedIntoNodeId: wire.node.merged_into_node_id ?? null, aliases: wire.aliases.map(toAliasView),
    ... return { id: wire.id, alias: wire.alias, kind: wire.kind, };'
  encoded_at:
  - src/features/graph/api/_transforms.ts
- node: rules/graph-explorer/node-detail-reads-share-a-key-by-node
  conforms: true
  how: 'src/features/graph/api/useNodeDetail.ts: held at the queryKey of useNodeDetail, line 14 (the node
    detail key only; the separate relationships key is declared elsewhere) — queryKey: graphNodeKeys.detail(id
    ?? "__noop__"),

    src/features/graph/api/useNodeRelationships.ts: held at the queryKey option, line 17. This is the
    relationships key by node id, with a placeholder id when none is given. The key factory''s own shape
    is declared in ./keys, which is outside this file. — queryKey: graphNodeKeys.relationships(id ?? "__noop__"),'
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
- node: rules/graph-explorer/node-state-follows-its-status-alone
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at the active and needs_review branches of deriveNodeState(),
    lines 29-32 — case "active": return "accepted"; case "needs_review": return "uncertain";'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
  conforms: true
  how: 'src/features/graph/lib/map.ts: held at KNOWN_NODE_TYPES, FALLBACK_NODE_TYPE and mapNodeType(),
    lines 5-25 — const normalized = wireType.trim().toLowerCase(); return KNOWN_NODE_TYPES.has(normalized
    as GraphNodeType) ? (normalized as GraphNodeType) : FALLBACK_NODE_TYPE;'
  encoded_at:
  - src/features/graph/lib/map.ts
- node: rules/graph-explorer/nodes-drag-only-when-a-commit-is-wired
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at handleNodesChange, lines 142-155,\
    \ and the nodesDraggable prop, line 173 — onNodePositionCommit(change.id, {\n            x: change.position.x,\n\
    \            y: change.position.y,\n          });\nnodesDraggable={onNodePositionCommit !== undefined}"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/only-a-version-2-view-restores-its-layout
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at hydrate, lines 292-295 — snapshot.version ===\
    \ 2 && \"layout_algorithm\" in snapshot\n  ? snapshot.layout_algorithm\n  : \"force\";"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/only-revealed-nodes-are-shown
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at visibleNodes and visibleLinks,\
    \ lines 87-102 — revealedIds === undefined\n        ? nodes\n        : nodes.filter((n) => revealedIds.has(n.id)),\n\
    : links.filter(\n            (l) => revealedIds.has(l.source) && revealedIds.has(l.target),\n    \
    \      ),"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/original-input-is-carried-only-when-answered
  conforms: true
  how: "src/features/graph/api/provenance.transforms.ts: held at toRawInformationView, the original_input\
    \ branch — if (wire.original_input !== undefined) {\n  return { ...base, originalInput: wire.original_input\
    \ };\n}\nreturn base;"
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/pane-is-a-region-named-after-the-graph
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at the `<section>` element returned\
    \ by GraphSpace — <section\n      role=\"region\"\n      aria-label=\"Grafo de conhecimento\"\nsrc/features/graph/components/GraphSpace/GraphSpace.types.ts:\
    \ held at GraphSpaceProps (lines 10-19), the props the pane takes from its caller. This file declares\
    \ no accessible name. The \"region named Grafo de conhecimento\" half of the node is not held here.\
    \ — export interface GraphSpaceProps {\n  nodes: readonly GraphNodeData[];\n  links: readonly GraphLinkData[];\n\
    \  status: GraphStatus;\n  errorMessage?: string;"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
  - src/features/graph/components/GraphSpace/GraphSpace.types.ts
- node: rules/graph-explorer/pane-is-busy-only-while-loading-or-revealing
  conforms: true
  how: 'src/features/graph/components/GraphSpace/GraphSpace.tsx: held at GraphSpace, `isBusy` and the
    conditional `aria-busy` attribute on the section — const isBusy = status === "loading" || status ===
    "revealing";

    ... {...(isBusy ? { "aria-busy": true } : {})}'
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/pane-starts-and-clears-empty
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at makeInitialState (lines 66-93), used for the
    initial state at line 96 and by clear at line 221 — status: "empty",

    errorMessage: undefined,

    receivedDeltaThisTurn: false,

    layoutNonce: 0,

    layoutAlgorithm: "force",'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/radial-layout-puts-the-root-at-the-centre
  conforms: true
  how: "src/features/graph/lib/layout-radial.ts: held at The d3 tree layout configuration (lines 27-30)\
    \ and the polar-to-Cartesian conversion (lines 67-71). The separation callback gives the gap of 1\
    \ between siblings and 2 between other neighbours, divided by depth. Radius 0 at depth 0 puts the\
    \ root at (0, 0). Angle 0 maps to the top because y is -radius*cos(theta). — .separation((a, b) =>\
    \ (a.parent === b.parent ? 1 : 2) / a.depth);\nconst x = radius * Math.sin(theta);\nconst y = -radius\
    \ * Math.cos(theta);\nconst radius = d === 0\n      ? 0"
  encoded_at:
  - src/features/graph/lib/layout-radial.ts
- node: rules/graph-explorer/radial-rings-take-the-largest-radius
  conforms: true
  how: "src/features/graph/lib/layout-radial.ts: held at The NODE_FOOTPRINT and MIN_RING_GAP constants\
    \ (lines 10-12) and the ring radius loop (lines 41-57). The loop takes the largest of depth*200, 270/(2*sin(pi/count))\
    \ for a ring of two or more nodes, and the previous radius plus 200. Ring 0 has radius 0. — const\
    \ NODE_FOOTPRINT = 270;\nconst MIN_RING_GAP = 200;\nconst angularTerm = count >= 2\n      ? NODE_FOOTPRINT\
    \ / (2 * Math.sin(Math.PI / count))\n      : 0;\n: Math.max(\n          d * MIN_RING_GAP,\n      \
    \    angularTerm,\n          prevRadius + MIN_RING_GAP,\n        );"
  encoded_at:
  - src/features/graph/lib/layout-radial.ts
- node: rules/graph-explorer/read-failures-pass-through-unchanged
  conforms: true
  how: "src/features/graph/api/useNodeDetail.ts: held at the queryFn, lines 15-21, which has no catch\
    \ or error mapping around the http call (the node detail read only) — const wire = await http<NodeDetailWire>(\n\
    \  `/api/v1/nodes/${encodeURIComponent(id as string)}`,\n  { method: \"GET\", headers: authHeader()\
    \ },\n);\nsrc/features/graph/api/useNodeRelationships.ts: held at the queryFn, lines 19-23. The http\
    \ helper's failure propagates with no catch or rewrapping. — const wire = await http<TraversalResultWire>(\n\
    \  `/api/v1/nodes/${encodeURIComponent(id as string)}/traverse?depth=1&direction=both`,\n  { method:\
    \ \"GET\", headers: authHeader() },\n);\nsrc/features/graph/api/useProvenance.ts: held at the queryFn,\
    \ lines 21-27. It has no catch or rewrap, so the error from http() propagates to the query result\
    \ unchanged. — const wire = await http<ProvenanceResponseWire>(\n  `/api/v1/provenance/${kind}/${encodeURIComponent(id)}`,\n\
    \  { method: \"GET\", headers: authHeader() },\n);"
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
- node: rules/graph-explorer/reduced-motion-reveals-everything-at-once
  conforms: true
  how: "src/features/graph/hooks/useGraphReveal.ts: held at prefersReducedMotion() (lines 8-12), the branch\
    \ in the effect (lines 60-63) and drainAll() — if (typeof window === \"undefined\") return false;\n\
    if (typeof window.matchMedia !== \"function\") return false;\nreturn window.matchMedia(REDUCED_MOTION_QUERY).matches;\n\
    ...\nif (prefersReducedMotion()) {\n  drainAll();\n  return;\n}"
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/relationship-rows-keep-the-answered-order
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the list branch\
    \ (lines 68-78), which maps `query.data.links` directly to `NodeRelationshipRow` elements with no\
    \ sort, filter or regrouping. — {query.data.links.map((l) => (\n  <NodeRelationshipRow key={l.id}\
    \ link={l} />\n))}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/relationships-are-a-named-busy-section
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the returned
    `<section>` (lines 81-92), carrying `aria-label` and `aria-busy`, together with the if / else-if chain
    in lines 18-79 that checks pending, then error, then empty, then the list. — <section ... aria-label={NODE_DETAIL_COPY.relationshipsHeading}
    ... aria-busy={query.isPending ? "true" : "false"}>

    if (query.isPending) { ... } else if (query.isError) { ... } else if (query.data === undefined ||
    query.data.links.length === 0) { ... } else { ... }

    Copy file: relationshipsHeading: "Relações"'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/relationships-are-read-at-depth-one-both-ways
  conforms: true
  how: 'src/features/graph/api/useNodeRelationships.ts: held at the request path in the queryFn, line
    20. — /traverse?depth=1&direction=both'
  encoded_at:
  - src/features/graph/api/useNodeRelationships.ts
- node: rules/graph-explorer/relationships-say-loading-or-none
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx: held at the pending\
    \ branch (lines 18-32), a `<span aria-live=\"polite\">` showing `NODE_DETAIL_COPY.relationshipsLoading`,\
    \ and the empty branch (lines 59-67), a `<p>` showing `NODE_DETAIL_COPY.relationshipsEmpty`. The strings\
    \ sit in NodeDetailPanel.copy.ts (lines 21-22). — <span aria-live=\"polite\" className=\"text-xs text-muted-foreground\"\
    >\n  {NODE_DETAIL_COPY.relationshipsLoading}\n</span>\n...\n{NODE_DETAIL_COPY.relationshipsEmpty}\n\
    Copy file: relationshipsLoading: \"Carregando relações…\", relationshipsEmpty: \"Nenhuma relação encontrada.\""
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipsSection.tsx
- node: rules/graph-explorer/removing-nodes-removes-everything-about-them
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at removeNodes, lines 152-189 — if (ids.length ===\
    \ 0) return;\nif (idSet.has(link.source) || idSet.has(link.target)) {\n  nextLinks.delete(linkId);\n\
    }\nconst nextRevealQueue = state.revealQueue.filter((id) => !idSet.has(id));"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/reorganizing-releases-the-pins
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at resetLayout, lines 202-207 — userPinned: new
    Set<string>(),

    layoutNonce: state.layoutNonce + 1,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/replace-keeps-only-the-delta
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at replaceNodes, lines 124-150 — if (nextNodes.has(link.source)\
    \ && nextNodes.has(link.target)) {\n  nextLinks.set(link.id, link);\n}\npositions: new Map<string,\
    \ GraphPosition>(),\nuserPinned: new Set<string>(),\nrevealedIds: new Set<string>(),\nrevealQueue,\n\
    receivedDeltaThisTurn: true,"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/restore-reads-the-saved-view-of-the-conversation
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at restoreSnapshot(), lines 35-67. The read
    runs only when conversationId is set, a non-null snapshot is hydrated into the store, and null changes
    nothing. — if (!conversationId) return; ... if (snapshot !== null) { justHydrated.current = true;
    ... useGraphStore.getState().hydrate({'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/restore-restores-the-layout-of-a-version-2-view
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the version branch in restoreSnapshot(),
    lines 46-63 — if (snapshot.version === 2) { useGraphStore.getState().hydrate({ version: 2, ... layout_algorithm:
    snapshot.layout_algorithm, }); } else { useGraphStore.getState().hydrate({ version: 1, ...'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
- node: rules/graph-explorer/restoring-keeps-orphan-positions
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the positions loop in hydrate, lines 288-290\
    \ — for (const [id, pos] of Object.entries(snapshot.positions)) {\n  nextPositions.set(id, { x: pos.x,\
    \ y: pos.y });\n}"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/restoring-shows-every-node-at-once
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at the set call in hydrate, lines 297-308 — revealedIds:
    new Set<string>(allNodeIds),

    revealQueue: [],

    status: "ready",

    receivedDeltaThisTurn: false,

    errorMessage: undefined,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/reveal-goes-one-node-at-a-time-in-queue-order
  conforms: true
  how: "src/features/graph/hooks/useGraphReveal.ts: held at DEFAULT_REVEAL_STAGGER_MS (line 4) and tick()\
    \ (lines 67-78), which dequeues the head and reveals a single id per timer — export const DEFAULT_REVEAL_STAGGER_MS\
    \ = 90;\n...\nconst id = useGraphStore.getState().dequeueReveal();\nif (id !== undefined) {\n  revealOne(id);\n\
    }"
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/reveal-marks-nodes-only
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at revealOne() (lines 33-39), which writes only
    revealedIds — const next = new Set(revealedIds);

    next.add(id);

    useGraphStore.setState({ revealedIds: next });'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/revealing-a-revealed-node-changes-nothing
  conforms: true
  how: 'src/features/graph/hooks/useGraphReveal.ts: held at the early return in revealOne(), line 35 —
    if (revealedIds.has(id)) return;'
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/screen-readers-hear-the-direction
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts: held at the directionOutgoingSr
    and directionIncomingSr entries, lines 27-28. Choosing which one applies is done by the consuming
    component, not by this file. — directionOutgoingSr: "direção: destino",

    directionIncomingSr: "direção: origem",

    src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx: held at lines 92-95 choose
    the text and line 113 renders it. The exact words "direção: destino" and "direção: origem" sit in
    NodeDetailPanel.copy.ts, outside this file. — const directionSr = link.direction === "outgoing" ?
    NODE_DETAIL_COPY.directionOutgoingSr : NODE_DETAIL_COPY.directionIncomingSr; ... <span className="sr-only">{directionSr}</span>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  - src/features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx
- node: rules/graph-explorer/setting-a-status-keeps-the-error-message-only-for-error
  conforms: true
  how: 'src/features/graph/state/graph-store.ts: held at setStatus, lines 224-229 — errorMessage: status
    === "error" ? errorMessage : undefined,'
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/several-components-hang-under-a-virtual-root
  conforms: true
  how: "src/features/graph/lib/layout-radial.ts: held at Only the half of the fact that this file holds:\
    \ lines 34 and 61 skip SUPER_ROOT_ID, so the virtual root is never given a position and never counts\
    \ toward a ring. The id value `__super_root__` and the act of hanging several component roots under\
    \ it are declared and done in ./spanning-tree (SUPER_ROOT_ID, buildSpanningTree), which this file\
    \ imports and does not redeclare. — if (id === SUPER_ROOT_ID) continue;\nconst rootSpan = buildSpanningTree(nodeIds,\
    \ linkPairs);\nsrc/features/graph/lib/layout-tree.ts: held at Line 34, where the virtual root is skipped\
    \ so it never reaches the output map. The grouping of component roots under the virtual root is built\
    \ in spanning-tree.ts, which this file calls through buildSpanningTree. SUPER_ROOT_ID = \"__super_root__\"\
    \ is declared there, line 1, and this file only imports it. — if (id === SUPER_ROOT_ID) continue;\n\
    src/features/graph/lib/spanning-tree.ts: held at SUPER_ROOT_ID at line 1 and the closing return of\
    \ buildSpanningTree, lines 70-76. The file declares the id and builds the virtual root over two or\
    \ more component roots. The part that the virtual root is never given a position is not stated in\
    \ this file, because the file only builds the tree and positions nothing. — export const SUPER_ROOT_ID\
    \ = \"__super_root__\";\nif (componentRoots.length === 1) {\n  return componentRoots[0]!;\n}\nreturn\
    \ {\n  id: SUPER_ROOT_ID,\n  children: componentRoots,\n};"
  encoded_at:
  - src/features/graph/lib/layout-radial.ts
  - src/features/graph/lib/layout-tree.ts
  - src/features/graph/lib/spanning-tree.ts
- node: rules/graph-explorer/stopping-the-reveal-keeps-what-it-reached
  conforms: true
  how: "src/features/graph/hooks/useGraphReveal.ts: held at the effect's cleanup function, lines 82-87,\
    \ which clears the pending timer and does not touch revealQueue or revealedIds — return (): void =>\
    \ {\n  if (timerRef.current !== null) {\n    clearTimeout(timerRef.current);\n    timerRef.current\
    \ = null;\n  }\n};"
  encoded_at:
  - src/features/graph/hooks/useGraphReveal.ts
- node: rules/graph-explorer/the-canvas-opens-at-three-quarters-zoom
  conforms: true
  how: 'src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the ReactFlow props defaultViewport,
    fitView and fitViewOptions, lines 167 and 170-171 — defaultViewport={DEFAULT_VIEWPORT}

    fitView

    fitViewOptions={{ padding: 0.1 }}'
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/the-canvas-stays-mounted-outside-the-empty-state
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at GraphSpace's ternary. Every status\
    \ other than the empty state with no nodes renders the same `ReactFlowProvider` and `GraphCanvasRegion`\
    \ branch. The overlay is a sibling of the canvas, so it does not unmount it. — ) : (\n      <ReactFlowProvider>\n\
    \        <GraphCanvasRegion"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/the-close-button-takes-focus
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at the close button\
    \ in PanelHeader, lines 45-60, which receives closeRef and takes its name from NODE_DETAIL_COPY.close\
    \ (\"Fechar detalhes do nó\" in NodeDetailPanel.copy.ts). Nothing in this file focuses it on mount\
    \ or on a node id change; that is outside this file. — <button\n  ref={closeRef}\n  type=\"button\"\
    \n  onClick={onClose}\n  aria-label={NODE_DETAIL_COPY.close}\nsrc/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx:\
    \ held at The `useEffect` keyed on `nodeId`, lines 34-36. It focuses the button held by `closeRef`,\
    \ and the ref is passed to every view. The accessible name \"Fechar detalhes do nó\" is not stated\
    \ in this file. It belongs to the button in the shell and success views. — useEffect(() => {\n  closeRef.current?.focus();\n\
    }, [nodeId]);"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-first-node-id-key-is-a-placeholder
  conforms: true
  how: 'src/features/graph/api/useNodeDetail.ts: held at the queryKey argument, line 14 — queryKey: graphNodeKeys.detail(id
    ?? "__noop__"),'
  encoded_at:
  - src/features/graph/api/useNodeDetail.ts
- node: rules/graph-explorer/the-layout-picker-needs-the-algorithm-and-its-setter
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at LAYOUT_ALGORITHM_LABELS and\
    \ LAYOUT_ALGORITHM_ORDER, lines 27-36, and the Select block, lines 184-197 — force: \"Força\",\n \
    \ tree: \"Árvore\",\n  radial: \"Radial\",\n{layoutAlgorithm && onLayoutAlgorithmChange && (\naria-label=\"\
    Algoritmo de layout do grafo\""
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/the-loading-view-says-it-is-loading
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx: held at LoadingView,\
    \ lines 71-94 — const title = nodeLabel ?? \"\";\n<PanelHeader title={title} closeRef={closeRef} onClose={onClose}\
    \ />\n<span aria-live=\"polite\" className=\"text-xs text-foreground\">\n  {NODE_DETAIL_COPY.loading}\n\
    </span>"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx
- node: rules/graph-explorer/the-neighbour-is-the-other-end
  conforms: true
  how: 'src/features/graph/api/traversal.transforms.ts: held at toLinkView, lines 30-33 and 40-42 — const
    neighborId = isOutgoing ? wire.target_node_id : wire.source_node_id;

    const neighbor = nodesById.get(neighborId);

    const neighborName = neighbor?.canonical_name ?? neighborId;

    const neighborType = neighbor?.node_type ?? "";'
  encoded_at:
  - src/features/graph/api/traversal.transforms.ts
- node: rules/graph-explorer/the-origin-body-checks-pending-failure-then-data
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx: held at The order of the
    early-return branches in NodeProvenanceChain: isPending, then isError, then empty, then the fragment
    list. — if (isPending) { return ( <div ... aria-busy="true" ...> ... <span aria-live="polite" ...>{NODE_DETAIL_COPY.originLoading}</span>'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeProvenanceChain.tsx
- node: rules/graph-explorer/the-overlay-is-a-polite-status-region
  conforms: true
  how: 'src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at The root div''s
    role and aria-live attributes (lines 32-33), and the GlassSurface aria-label (line 45). — role="status"

    aria-live="polite"

    aria-label={isError ? "Erro do grafo" : "Carregando grafo"}'
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/the-overlay-message-is-two-lines-at-most
  conforms: true
  how: 'src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx: held at The class list
    of the message span (lines 54-57). — "min-w-0 line-clamp-2",'
  encoded_at:
  - src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.tsx
- node: rules/graph-explorer/the-owner-cannot-draw-links
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the ReactFlow props, lines\
    \ 174-177 — nodesConnectable={false}\n      elementsSelectable={true}\n      panOnDrag\n      zoomOnScroll"
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/the-pane-reveals-at-the-hooks-default-gap
  conforms: true
  how: 'src/features/graph/components/GraphSpace/GraphSpace.tsx: held at the `revealStaggerMs` default
    in GraphSpace''s destructured props, passed to `useGraphReveal` — revealStaggerMs = DEFAULT_REVEAL_STAGGER_MS,

    ... const revealedIds = useGraphReveal(revealStaggerMs);'
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/the-pane-wires-the-owner-s-arrangement-to-the-store
  conforms: true
  how: "src/features/graph/components/GraphSpace/GraphSpace.tsx: held at GraphCanvasRegion, the store\
    \ selectors and the props passed to `<GraphCanvas>` — onNodePositionCommit={setNodePosition}\n   \
    \     onResetLayout={resetLayout}\n        layoutAlgorithm={layoutAlgorithm}\n        onLayoutAlgorithmChange={setLayoutAlgorithm}"
  encoded_at:
  - src/features/graph/components/GraphSpace/GraphSpace.tsx
- node: rules/graph-explorer/the-panel-checks-pending-then-failure-then-data
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at The `if / else if`\
    \ chain on lines 61-100. — if (query.isPending) {\n...\n} else if (query.isError) {\n...\n} else if\
    \ (query.data !== undefined) {\n...\n} else {\n  body = (\n    <LoadingView"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-panel-is-a-region-named-after-the-node
  conforms: true
  how: "src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at `resolvedLabel` and\
    \ the `role` / `aria-label` props on the panel root, lines 57-58 and 106-107. — const resolvedLabel\
    \ =\n  query.data?.canonicalName ?? nodeLabel ?? \"carregando\";\n...\nrole=\"complementary\"\naria-label={`Detalhes\
    \ do nó: ${resolvedLabel}`}"
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-panel-reads-the-node-by-id
  conforms: true
  how: 'src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx: held at Line 28. — const query
    = useNodeDetail(nodeId);'
  encoded_at:
  - src/features/graph/components/NodeDetailPanel/NodeDetailPanel.tsx
- node: rules/graph-explorer/the-reorganize-control-needs-its-handler
  conforms: true
  how: "src/features/graph/components/GraphCanvas/GraphCanvas.tsx: held at the Button block, lines 198-209\
    \ — {onResetLayout && (\n          <Button\n            type=\"button\"\n            variant=\"secondary\"\
    \n            size=\"sm\"\n            onClick={onResetLayout}\n            aria-label=\"Reorganizar\
    \ o layout do grafo\""
  encoded_at:
  - src/features/graph/components/GraphCanvas/GraphCanvas.tsx
- node: rules/graph-explorer/title-and-document-date-come-from-metadata
  conforms: true
  how: 'src/features/graph/api/provenance.transforms.ts: held at readMetadataTitle and readMetadataDocumentDate
    — return typeof t === "string" && t.length > 0 ? t : null;

    ...

    if (typeof d !== "string" || d.length === 0) return null;

    return formatDateLabel(d);'
  encoded_at:
  - src/features/graph/api/provenance.transforms.ts
- node: rules/graph-explorer/tree-and-radial-layouts-share-one-spanning-tree
  conforms: true
  how: 'src/features/graph/lib/spanning-tree.ts: held at buildSpanningTree, lines 13-77. Adjacency is
    undirected and deduplicated through Set, self-links are skipped at line 24, component roots are ordered
    by degree descending then id ascending (lines 35-40), and the BFS visits neighbours sorted ascending
    (line 56). — if (source === target) continue;

    srcSet.add(target);

    tgtSet.add(source);

    if (da !== db) return db - da;

    return a < b ? -1 : a > b ? 1 : 0;

    const neighbours = [...adj.get(currentId)!].sort();'
  encoded_at:
  - src/features/graph/lib/spanning-tree.ts
- node: rules/graph-explorer/tree-layout-grows-left-to-right
  conforms: true
  how: "src/features/graph/lib/layout-tree.ts: held at The gap constants (lines 10-11), the nodeSize call\
    \ (lines 26-29) and the axis swap on line 40. — const TREE_SIBLING_GAP = 110;\nconst TREE_LEVEL_GAP\
    \ = 340;\n...\ntree<SpanningTreeNode>().nodeSize([\n  TREE_SIBLING_GAP,\n  TREE_LEVEL_GAP,\n]);\n\
    ...\nout.set(id, { x: node.y ?? 0, y: node.x ?? 0 });"
  encoded_at:
  - src/features/graph/lib/layout-tree.ts
- node: rules/graph-explorer/turn-done-after-a-delta-makes-the-pane-ready
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the done branch of settleTurn, lines 243-246\
    \ — if (receivedDeltaThisTurn) {\n  set({ status: \"ready\", errorMessage: undefined, receivedDeltaThisTurn:\
    \ false });"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/turn-done-without-a-delta-leaves-the-status
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the done branch of settleTurn, lines 246-248\
    \ — } else {\n  set({ receivedDeltaThisTurn: false });\n}"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/turn-error-ends-a-busy-pane-in-error
  conforms: true
  how: "src/features/graph/state/graph-store.ts: held at the error path of settleTurn and graphToolInFlight,\
    \ lines 62-64 and 252-256 — return status === \"loading\" || status === \"revealing\";\nif (graphToolInFlight(status))\
    \ {\n  set({ status: \"error\", receivedDeltaThisTurn: false });"
  encoded_at:
  - src/features/graph/state/graph-store.ts
- node: rules/graph-explorer/view-failures-are-silent
  conforms: true
  how: 'src/features/graph/api/use-graph-persistence.ts: held at the empty catch on the restore, line
    65, and the empty .catch on the save, line 98. Neither retries. — } catch { } ... ).catch(() => {
    });'
  encoded_at:
  - src/features/graph/api/use-graph-persistence.ts
unstated:
- file: src/features/graph/api/provenance.types.ts
  where: line 1, the ProvenanceKind union
  evidence: export type ProvenanceKind = "links" | "attributes" | "fragments";
  cost: The graph-explorer contract lists only read-link-provenance and read-attribute-provenance. The
    "fragments" kind is held by a node of the curation-workspace feature, so a reader of the graph-explorer
    nodes has no sign that this file also reads provenance by fragment. A change to that operation reaches
    this file only through a bind that does not exist.
- file: src/features/graph/api/provenance.types.ts
  where: lines 3-27, the ProvenanceRawInformationWire, ProvenanceChunkWire and ProvenanceFragmentWire
    interfaces
  evidence: "readonly chunk_index: number;\n  readonly offset_start: number;\n  readonly offset_end: number;\n\
    ...\n  readonly source_type: string;\n  readonly received_at: string;\n  readonly metadata?: Readonly<Record<string,\
    \ unknown>>;"
  cost: The graph-explorer nodes in this set name the chunk's index, offsets and raw information only
    in general terms. The wire attribute names are spelled out only in the curation-workspace contract,
    so the set holds no field name the file declares. A rename of those names would be decided in a node
    this file is not bound to.
- file: src/features/graph/components/GraphCanvas/GraphCanvas.tsx
  where: the visible label inside the reorganize Button, line 207
  evidence: "<Shuffle aria-hidden=\"true\" className=\"size-4\" />\n                  Reorganizar"
  cost: The text a person reads on the control is "Reorganizar". The only node that speaks of it, rules/graph-explorer/the-reorganize-control-needs-its-handler,
    fixes the control's name as "Reorganizar o layout do grafo", which the aria-label carries. A search
    of the specification finds no node holding the visible text. Anyone changing the control's wording
    looks in the specification, finds only the accessible name, and has no node that decides what is displayed.
- file: src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts
  where: line 9, the attributesHeading entry of NODE_DETAIL_COPY, rendered at NodeDetailPanel.success.tsx
    line 113
  evidence: 'attributesHeading: "Atributos",'
  cost: The panel emits a heading, "Atributos", over the attributes table, and no node under the specification
    root states that text. The graph-explorer nodes name the table's columns (attribute, value, state),
    the list "Aliases" and the section "Relações". A reader who looks in the specification for what the
    attributes section is called will not find it. The label lives only in this file.
unbound:
- src/features/graph/components/GraphStatusOverlay/GraphStatusOverlay.types.ts
notes: "Judged by 36 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/restates-fe-graph.returns/.\nA finding in src/features/graph/api/node-detail.types.ts\
  \ names domain/knowledge-base/node-status, which no file of this set is bound to: line 3, the NodeWireStatus\
  \ union: export type NodeWireStatus = \"active\" | \"needs_review\" | \"merged\" | \"deleted\";\nNode\
  \ domain/knowledge-base/node-status declares `values: active, needs-review, merged, deleted`. The graph-explorer\
  \ rules rules/graph-explorer/node-badge-follows-the-node-status and rules/graph-explorer/node-state-follows-its-status-alone\
  \ spell the value `needs_review`. — The file declares a second vocabulary for the node status that domain/knowledge-base/node-status\
  \ does not reach. That node is not bound to this file, so a change to it never touches this union. The\
  \ two spellings of the needs-review value (`needs-review` in the enumeration, `needs_review` here and\
  \ in the graph-explorer rules) leave the next reader unsure which one the business decided.. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/features/graph/api/node-detail.types.ts\
  \ names domain/knowledge-base/assertion-status, which no file of this set is bound to: lines 5-10, the\
  \ AttributeWireAssertionStatus union: export type AttributeWireAssertionStatus =\n  | \"proposed\"\n\
  \  | \"accepted\"\n  | \"uncertain\"\n  | \"disputed\"\n  | \"superseded\";\nNode domain/knowledge-base/assertion-status\
  \ declares `values: active, uncertain, disputed, superseded, deleted`, described as \"The state a knowledge\
  \ link or a node attribute is in.\" — The file lists `proposed` and `accepted`, which the node does\
  \ not hold, and omits `active` and `deleted`, which it does. The node is the business decision, and\
  \ a reader of this type learns a different set of attribute states. The node is also not bound to this\
  \ file, so it will not report when it changes.. It blocks nothing here; it is owed a route of its own.\n\
  A finding in src/features/graph/api/node-detail.types.ts names domain/knowledge-base/effective-status,\
  \ which no file of this set is bound to: lines 12-16, the AttributeWireEffectiveStatus union: export\
  \ type AttributeWireEffectiveStatus =\n  | \"active\"\n  | \"inactive\"\n  | \"uncertain\"\n  | \"disputed\"\
  ;\nNode domain/knowledge-base/effective-status declares `values: active, inactive, uncertain, disputed,\
  \ superseded, deleted`. — The union drops `superseded` and `deleted`, which the node holds. NodeAttributeView.effectiveStatus\
  \ takes its type from this union, so the view cannot represent the two values the node says an attribute\
  \ can be read with. The node is not bound to this file, so a change to it never reaches this declaration..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx\
  \ names rules/graph-explorer/a-node-failure-reads-its-wording, which no file of this set is bound to:\
  \ ErrorView, the PanelHeader title prop (lines 118-122): <PanelHeader\n  title={NODE_DETAIL_COPY.errorNotFound}\n\
  \  closeRef={closeRef}\n  onClose={onClose}\n/> — Whatever the variant, the header of a failed panel\
  \ reads \"Nó não encontrado.\". For a deleted node the alert reads \"Este nó foi removido por conformidade.\"\
  \ while the header above it says the node was not found. For a generic failure the header says not found\
  \ while the alert asks for a retry. The owner is shown two messages that disagree, and the not-found\
  \ wording is the one the specification reserves for RESOURCE_NOT_FOUND. No node says what the header\
  \ shows in a failed state, so the code is where that decision now lives.. It blocks nothing here; it\
  \ is owed a route of its own.\nCandidates: 11 opened across 7 of 36 delegation(s); each return lists\
  \ its own under `candidates_opened`.\nUnstated: 4 fact(s) the source states that no node holds, over\
  \ 3 file(s), listed under `unstated`. They block no binding here and no rebind closes them — the route\
  \ is the analysis that gives each fact a node."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/restates-fe-graph.returns/`, which are the evidence behind every entry above.
