---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/graph/api/_request.ts
  - src/features/graph/api/_transforms.ts
  - src/features/graph/api/index.ts
  - src/features/graph/api/keys.ts
  - src/features/graph/api/mapWireToGraphDelta.ts
  - src/features/graph/api/node-detail.types.ts
  - src/features/graph/api/provenance.transforms.ts
  - src/features/graph/api/provenance.types.ts
  - src/features/graph/api/traversal.transforms.ts
  - src/features/graph/api/traversal.types.ts
  - src/features/graph/api/use-graph-persistence.ts
  - src/features/graph/api/useNodeDetail.ts
  - src/features/graph/api/useNodeRelationships.ts
  - src/features/graph/api/useProvenance.ts
read_outside_area:
  - "src/lib/http.ts — every hook in the area calls http<T>; read to see that the hooks pass its EnvelopeError through untranslated (its codes, 30 s cutoff and 401 refresh are its own facts)"
  - "src/features/graph/lib/map.ts — mapWireToGraphDelta drops a node when deriveNodeState returns undefined (merged and deleted there) and takes the link state from deriveLinkState; the mapping itself lives there"
  - "src/features/chat/api/_request.ts — use-graph-persistence imports authHeader from it, not from the graph feature's own _request.ts; read to confirm both helpers build the same header"
---

## Facts
### Owner authentication on graph reads (spec `constraints/every-operation-requires-owner-authentication`)
- Every request in the area carries `Authorization: Bearer <access token>` when the auth store holds an access token, and no Authorization header when it holds none. `src/features/graph/api/_request.ts` (`authHeader`).
  - The token is read from the auth store each time a request is built, not once when the module loads. `src/features/graph/api/_request.ts` (`useAuthStore.getState().accessToken`).
- The graph-view save and restore build their header with the chat feature's `authHeader`, not with the graph feature's own. `src/features/graph/api/use-graph-persistence.ts` (`import { authHeader } from "@/features/chat/api/_request"`).

### Node detail read (spec `domain/knowledge-base/graph-read`, `domain/knowledge-base/knowledge-node`)
- The node detail is read with `GET /api/v1/nodes/{id}`, with the id URI-encoded. `src/features/graph/api/useNodeDetail.ts` (`useNodeDetail` `queryFn`).
- No request is made unless the node id is a non-empty string. `src/features/graph/api/useNodeDetail.ts` (`enabled: typeof id === "string" && id.length > 0`).
- A node detail read stays fresh for 5 minutes. `src/features/graph/api/useNodeDetail.ts` (`STALE_MS = 5 * 60_000`).
- A node detail read is not repeated when the window regains focus. `src/features/graph/api/useNodeDetail.ts` (`refetchOnWindowFocus: false`).
- The answer read is the node (id, node type, canonical name, status, and the node it was merged into if any), its aliases, and its attributes. `src/features/graph/api/node-detail.types.ts` (`NodeDetailWire`, `NodeSummaryWire`).
- Each alias is shown with its id, its text and its alias kind, passed through unchanged. `src/features/graph/api/_transforms.ts` (`toAliasView`).
- When the answer gives no merged-into node, the detail treats it as none (null). `src/features/graph/api/_transforms.ts` (`toNodeDetail`, `merged_into_node_id ?? null`).
- The node badge comes from the node status: an active node shows as accepted, a node needing review as uncertain, a merged node as superseded, and a deleted node as superseded. `src/features/graph/api/_transforms.ts` (`mapNodeStatusToBadge`).

### Node attributes in the detail (spec `domain/knowledge-base/node-attribute`, `domain/knowledge-base/effective-status`)
- Each attribute is shown with its id, key, value, value type, effective status, whether it is in effect, a badge state, its validity-start and validity-end labels, and its provenance entries. `src/features/graph/api/_transforms.ts` (`toAttributeView`).
- The attribute badge is decided in this order: an effective status of disputed shows disputed; then uncertain shows uncertain; then inactive shows superseded; then an assertion status of superseded shows superseded; anything else shows accepted. `src/features/graph/api/_transforms.ts` (`mapAttributeStatusToBadge`).
- Attributes in effect come before those not in effect. Within each group they are ordered by key, compared in pt-BR ignoring case and accents. Attributes with equal keys keep their answered order. `src/features/graph/api/_transforms.ts` (`sortAttributes`, `localeCompare(..., "pt-BR", { sensitivity: "base" })`).
- An attribute whose answer has no provenance list gets an empty provenance list. `src/features/graph/api/_transforms.ts` (`toAttributeView`, `wire.provenance ?? []`).
- The attribute fields `is_current`, `confidence` and `node_id` are read from the answer but not shown in the attribute. `src/features/graph/api/node-detail.types.ts` (`AttributeWire`); `src/features/graph/api/_transforms.ts` (`toAttributeView`).

### Validity dates (spec `domain/knowledge-base/node-attribute`, `domain/knowledge-base/knowledge-link`)
- A validity date given as `YYYY-MM-DD` is shown as `DD/MM/YYYY` in pt-BR, built and formatted in UTC so the calendar day never shifts. `src/features/graph/api/_transforms.ts` (`formatDateLabel`, `DATE_FORMATTER` with `timeZone: "UTC"`, `Date.UTC`).
- An absent validity date (an open-ended interval) gets no label (null). `src/features/graph/api/_transforms.ts` (`formatDateLabel`).
- A date that does not split into three `-` parts, has a non-numeric part, or gives an invalid date is shown as the raw text received. The function never throws. `src/features/graph/api/_transforms.ts` (`formatDateLabel`).

### Inline provenance entries (spec `domain/knowledge-base/provenance`)
- An inline provenance entry is shown with its fragment id, fragment text, confidence, a confidence label, raw information id, source type, a received-at label and an excerpt. `src/features/graph/api/_transforms.ts` (`toProvenanceEntryView`).
- A confidence (0 to 1) is shown as a whole-number percentage: the value times 100, rounded, followed by `%` (`0.923` becomes `92%`). `src/features/graph/api/_transforms.ts` (`formatConfidenceLabel`).
- A missing or non-finite confidence on an inline entry gives no confidence and no label (null), never `0%`. `src/features/graph/api/_transforms.ts` (`toProvenanceEntryView`, `formatConfidenceLabel`).
- A missing raw information id, source type or excerpt on an inline entry becomes null. `src/features/graph/api/_transforms.ts` (`toProvenanceEntryView`).
- The received-at instant on an inline entry is shown as a pt-BR date only (`DD/MM/YYYY`, 2-digit day and month, numeric year) in the owner's local time zone. A missing instant gives null; an unparseable one is shown as the raw text. `src/features/graph/api/_transforms.ts` (`formatReceivedAtLabel`, `RECEIVED_AT_FORMATTER`).

### Node relationships read (spec `domain/knowledge-base/traversal-request`, `domain/knowledge-base/traversal-direction`, `contracts/ingest-workspace/bff-traversal`)
- A node's relationships are read with `GET /api/v1/nodes/{id}/traverse?depth=1&direction=both`, with the id URI-encoded. `src/features/graph/api/useNodeRelationships.ts` (`queryFn`).
- The relationships read always asks for depth 1 and direction both. `src/features/graph/api/useNodeRelationships.ts` (query string `depth=1&direction=both`).
- No request is made unless the node id is a non-empty string. `src/features/graph/api/useNodeRelationships.ts` (`enabled`).
- A relationships read stays fresh for 5 minutes and is not repeated on window focus. `src/features/graph/api/useNodeRelationships.ts` (`STALE_MS = 5 * 60_000`, `refetchOnWindowFocus: false`).
- A link is outgoing when its source node is the starting node the answer names. Every other link is incoming. `src/features/graph/api/traversal.transforms.ts` (`toLinkView`, `wire.source_node_id === currentNodeId`, `starting_node_id`).
  - A link whose source and target are both the starting node is therefore outgoing. `src/features/graph/api/traversal.transforms.ts` (`toLinkView`).
- An outgoing link is labelled with its link type and the arrow `→`. An incoming link is labelled with the link's inverse name and the arrow `←`. `src/features/graph/api/traversal.transforms.ts` (`directionLabel`, `directionArrow`).
- The neighbour is the endpoint that is not the starting node. Its name and type come from the answer's node list. When the neighbour is missing from that list, its id is shown as the name and its type is empty. `src/features/graph/api/traversal.transforms.ts` (`toLinkView`, `neighbor?.canonical_name ?? neighborId`, `neighbor?.node_type ?? ""`).
- A relationship is shown with its link type, effective status, whether it is in effect, confidence, confidence label, validity-start and validity-end labels, flags and provenance entries. `src/features/graph/api/traversal.transforms.ts` (`toLinkView`).
- A link confidence that cannot be formatted shows as `0%`. `src/features/graph/api/traversal.transforms.ts` (`formatConfidenceLabel(wire.confidence) ?? "0%"`).
- A link with no flags list gets an empty list, and a link with no provenance list gets an empty list. `src/features/graph/api/traversal.transforms.ts` (`wire.flags ?? []`, `wire.provenance ?? []`).
- Relationships keep the order the answer gives them. `src/features/graph/api/traversal.transforms.ts` (`wire.links.map`).
- The link fields `status`, `is_current`, `recorded_at`, `superseded_at`, `hop` and `score` are read from the answer but not shown in the relationship. `src/features/graph/api/traversal.types.ts` (`TraversalLinkWire`); `src/features/graph/api/traversal.transforms.ts` (`toLinkView`).

### Full provenance read (spec `domain/knowledge-base/provenance`, `domain/knowledge-base/raw-chunk`, `domain/knowledge-base/raw-information`, `domain/knowledge-base/information-fragment`)
- Full provenance is read with `GET /api/v1/provenance/{kind}/{id}`, where the kind is `links`, `attributes` or `fragments`. The id is URI-encoded; the kind is not. `src/features/graph/api/useProvenance.ts` (`queryFn`); `src/features/graph/api/provenance.types.ts` (`ProvenanceKind`).
- No request is made until the caller enables the read and the id is non-empty. `src/features/graph/api/useProvenance.ts` (`enabled: enabled && id.length > 0`).
- A full provenance read stays fresh for 5 minutes and is not repeated on window focus. `src/features/graph/api/useProvenance.ts` (`STALE_MS = 5 * 60_000`, `refetchOnWindowFocus: false`).
- The answer is a list of fragments. Each fragment has its id, text, confidence, status and chunks. Each chunk has its id, index, start and end offsets, excerpt, locator and raw information. `src/features/graph/api/provenance.types.ts` (`ProvenanceFragmentWire`, `ProvenanceChunkWire`); `src/features/graph/api/provenance.transforms.ts` (`toFragmentView`, `toChunkView`).
- A fragment confidence that cannot be formatted shows as `0%`. `src/features/graph/api/provenance.transforms.ts` (`formatConfidenceLabel(wire.confidence) ?? "0%"`).
- A fragment's status is passed through as free text, not checked against a closed list. `src/features/graph/api/provenance.types.ts` (`ProvenanceFragmentWire.status: string`).
- A chunk's offset window is shown as `chars {start}–{end}`, joined by an en dash. `src/features/graph/api/provenance.transforms.ts` (`offsetRangeLabel`).
- A chunk with no locator gets an empty locator. `src/features/graph/api/provenance.transforms.ts` (`wire.locator ?? {}`).
- The raw information is shown with its id, source type, a received-at label, a title and a document-date label. `src/features/graph/api/provenance.transforms.ts` (`toRawInformationView`).
- The raw information's received-at instant is shown as a pt-BR short date with a short time, in the owner's local time zone. An unparseable instant is shown as the raw text. `src/features/graph/api/provenance.transforms.ts` (`formatReceivedAtDateTime`, `dateStyle: "short"`, `timeStyle: "short"`).
- The title is the metadata `title` when it is a non-empty string, and null otherwise. `src/features/graph/api/provenance.transforms.ts` (`readMetadataTitle`).
- The document date is the metadata `document_date`, shown as a validity-style `DD/MM/YYYY` label, when it is a non-empty string, and null otherwise. `src/features/graph/api/provenance.transforms.ts` (`readMetadataDocumentDate`).
- The raw information's original input (the owner's captured chat turn) is carried only when the answer includes the field, including when it is null. It is passed through unchanged; the area does not interpret `[REDACTED]`. `src/features/graph/api/provenance.transforms.ts` (`toRawInformationView`, `wire.original_input !== undefined`).
- Fragments and chunks keep the order the answer gives them. `src/features/graph/api/provenance.transforms.ts` (`wire.fragments.map`, `wire.chunks.map`).

### Graph delta mapping (spec `domain/chat/graph-delta`, `domain/chat/graph-delta-node`, `domain/chat/graph-delta-link`)
- A graph delta carries the tool that produced it, unchanged, along with its nodes and links. `src/features/graph/api/mapWireToGraphDelta.ts` (`MapWireToGraphDeltaInput`, `sourceTool`).
- A node whose status the shared node-state mapper leaves without a state is left out of the delta. `src/features/graph/api/mapWireToGraphDelta.ts` (`if (state === undefined) continue`).
- A kept node is shown with its id, its mapped node type, its canonical name as label, and its derived state. `src/features/graph/api/mapWireToGraphDelta.ts` (`GraphNodeData` construction).
- A link is kept only when each endpoint is either a kept node of this delta or a node already in the graph. Otherwise it is left out. `src/features/graph/api/mapWireToGraphDelta.ts` (`sourceVisible`, `targetVisible`, `useGraphStore.getState().nodes.has`).
- A kept link carries its link type slug, used for the colour lookup. `src/features/graph/api/mapWireToGraphDelta.ts` (`label: wireLink.link_type`).
- A kept link also carries a visible label, mapped from the link type and the label the backend sent. `src/features/graph/api/mapWireToGraphDelta.ts` (`mapLinkTypeLabel(wireLink.link_type, wireLink.link_type_label)`).
- A kept link carries whether it is temporal, and a state derived from its status and flags. `src/features/graph/api/mapWireToGraphDelta.ts` (`isTemporal`, `deriveLinkState(wireLink.status, wireLink.flags)`).
- A link carries whether it is in effect only when the answer included that field. `src/features/graph/api/mapWireToGraphDelta.ts` (`wireLink.is_in_effect === undefined ? {} : { inEffect }`).
- Nodes and links keep the order they arrived in. `src/features/graph/api/mapWireToGraphDelta.ts` (`mapWireToGraphDelta` loops).

### Graph view persistence per conversation (spec `domain/chat/graph-view`, `domain/chat/graph-layout`, `rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation`)
- When a conversation is active, its saved graph view is read with `GET /api/v1/conversations/{id}/graph`, with the id URI-encoded. Nothing is read without a conversation. `src/features/graph/api/use-graph-persistence.ts` (`restoreSnapshot`).
- A saved view that is present replaces the graph's contents. An absent view (null) changes nothing. `src/features/graph/api/use-graph-persistence.ts` (`if (snapshot !== null) ... hydrate`).
- A saved view of version 2 is restored together with its layout algorithm. Any other version is restored as version 1, without a layout algorithm. `src/features/graph/api/use-graph-persistence.ts` (`snapshot.version === 2` branch, `else` branch).
- A restore answer that arrives after the active conversation has changed is discarded. `src/features/graph/api/use-graph-persistence.ts` (`cancelled` flag).
- A saved view holds a version, nodes, links, a position (x, y) per node id, and the list of node ids the owner pinned. Version 2 adds the layout algorithm. `src/features/graph/api/use-graph-persistence.ts` (`GraphViewSnapshot`).
- A save is triggered whenever the graph's nodes, node positions or layout reset change. `src/features/graph/api/use-graph-persistence.ts` (`useGraphStore.subscribe`, `nodes`/`positions`/`layoutNonce` comparison).
- On each such change the save checks, in this order: (1) a conversation must be active; (2) the graph must have at least one node, otherwise nothing is saved; (3) if this is the first change after a restore, it is skipped and nothing is saved. `src/features/graph/api/use-graph-persistence.ts` (`handleStoreChange`).
  - Because check (2) runs before check (3), a change that leaves the graph empty does not use up the skip after a restore. The skip is used by the first change that leaves at least one node. `src/features/graph/api/use-graph-persistence.ts` (`handleStoreChange`).
- A save waits 800 ms after the last change. Each new change restarts the wait. `src/features/graph/api/use-graph-persistence.ts` (`setTimeout(..., 800)`, `clearTimeout`).
- When the wait ends, the current graph view is taken. If it has no nodes, nothing is sent. `src/features/graph/api/use-graph-persistence.ts` (`snapshot.nodes.length === 0`).
- Otherwise it is sent with `PUT /api/v1/conversations/{id}/graph`, with a JSON body and `Content-Type: application/json`. `src/features/graph/api/use-graph-persistence.ts` (`method: "PUT"`).
- A save still waiting is dropped when the active conversation changes or the screen closes. `src/features/graph/api/use-graph-persistence.ts` (subscribe effect cleanup on `handleStoreChange` change, `clearTimeout`).
- An empty graph never overwrites a saved view. `src/features/graph/api/use-graph-persistence.ts` (`nodes.size === 0` guard, `snapshot.nodes.length === 0` guard).

### Read caching keys
- The node detail is cached under `["nodes", id]`. `src/features/graph/api/keys.ts` (`graphNodeKeys.detail`).
- With no id, the node detail key uses the placeholder id `__noop__`. `src/features/graph/api/useNodeDetail.ts` (`id ?? "__noop__"`).
- A node's relationships are cached under `["graph", "node", id, "relationships"]`. With no id, the placeholder `__noop__` is used. `src/features/graph/api/keys.ts` (`graphNodeKeys.relationships`); `src/features/graph/api/useNodeRelationships.ts` (`id ?? "__noop__"`).
- Full provenance is cached under `["graph", "provenance", kind, id]`. `src/features/graph/api/keys.ts` (`graphNodeKeys.provenance`).
- The root node key `["nodes"]` covers only node details. It does not cover the relationships or full provenance keys, which start with `"graph"`. `src/features/graph/api/keys.ts` (`graphNodeKeys.all`).
- Graph view keys `["graphView"]` and `["graphView", conversationId]` are declared, but the graph view save and restore do not use the read cache. `src/features/graph/api/keys.ts` (`graphViewKeys`); `src/features/graph/api/use-graph-persistence.ts` (direct `http` calls).

## Answers
- Node detail read — the request helper throws (an envelope with `ok: false`, or a transport failure) → the read's error is the request helper's `EnvelopeError` with its code, unchanged; the hook does not translate it. `src/features/graph/api/useNodeDetail.ts` (`queryFn`, no catch).
- Node detail read — the answer is 200 with a deleted node → no refusal; the node is shown with the superseded badge. `src/features/graph/api/_transforms.ts` (`mapNodeStatusToBadge`, `case "deleted"`).
- Node detail read — no node id, or an empty one → no request is made and there is no answer. `src/features/graph/api/useNodeDetail.ts` (`enabled`).
- Node relationships read — the request helper throws → the read's error is the request helper's `EnvelopeError`, unchanged. `src/features/graph/api/useNodeRelationships.ts` (`queryFn`, no catch).
- Node relationships read — no node id, or an empty one → no request is made. `src/features/graph/api/useNodeRelationships.ts` (`enabled`).
- Full provenance read — the request helper throws → the read's error is the request helper's `EnvelopeError`, unchanged. `src/features/graph/api/useProvenance.ts` (`queryFn`, no catch).
- Full provenance read — not enabled by the caller, or an empty id → no request is made. `src/features/graph/api/useProvenance.ts` (`enabled`).
- Graph view restore — any failure (network, a not-found, an envelope error) → nothing is shown to the owner and the graph stays as it was cleared. `src/features/graph/api/use-graph-persistence.ts` (`restoreSnapshot`, empty `catch`).
- Graph view save — any failure → nothing is shown to the owner and the save is not retried. Only the next graph change starts another save. `src/features/graph/api/use-graph-persistence.ts` (`.catch(() => {})`).
- Validity date, document date or received-at instant that cannot be parsed → no refusal; the raw text received is shown. `src/features/graph/api/_transforms.ts` (`formatDateLabel`, `formatReceivedAtLabel`); `src/features/graph/api/provenance.transforms.ts` (`formatReceivedAtDateTime`).

## Vocabularies
- Node status (spec `domain/knowledge-base/node-status`): `active`, `needs_review`, `merged`, `deleted`. `src/features/graph/api/node-detail.types.ts` (`NodeWireStatus`).
- Assertion status (spec `domain/knowledge-base/assertion-status`): `proposed`, `accepted`, `uncertain`, `disputed`, `superseded`. `src/features/graph/api/node-detail.types.ts` (`AttributeWireAssertionStatus`).
- Effective status (spec `domain/knowledge-base/effective-status`): `active`, `inactive`, `uncertain`, `disputed`. `src/features/graph/api/node-detail.types.ts` (`AttributeWireEffectiveStatus`).
- Alias kind (spec `domain/knowledge-base/alias-kind`): `canonical`, `alias`. `src/features/graph/api/node-detail.types.ts` (`NodeAliasWire.kind`).
- Value type (spec `domain/knowledge-base/value-type`): `text`, `number`, `date`, `bool`. `src/features/graph/api/node-detail.types.ts` (`AttributeWire.value_type`).
- Provenance kind: `links`, `attributes`, `fragments`. `src/features/graph/api/provenance.types.ts` (`ProvenanceKind`).
- Link direction relative to the shown node: `outgoing`, `incoming`, with arrows `→` and `←`. `src/features/graph/api/traversal.types.ts` (`LinkDirection`, `directionArrow`).
- Badge states the area produces: `accepted`, `uncertain`, `superseded`, `disputed`. `src/features/graph/api/_transforms.ts` (`mapNodeStatusToBadge`, `mapAttributeStatusToBadge`).
- Graph view version (spec `domain/chat/graph-view`): `1`, `2`. `src/features/graph/api/use-graph-persistence.ts` (`GraphViewSnapshot.version`).
- Layout algorithm (spec `domain/chat/graph-layout`): `force`, `tree`, `radial`. `src/features/graph/api/use-graph-persistence.ts` (`layout_algorithm`).

## Upstream artifacts
- The BFF node detail answer, inside the `{ ok, result }` envelope: `node` {`id`, `node_type`, `canonical_name`, `status`, `merged_into_node_id`?}, `aliases` [{`id`, `alias`, `kind`, `created_at`?}], `attributes` [{`id`, `node_id`, `attribute_key`, `value_type`, `value`, `status`, `effective_status`, `is_current`, `is_in_effect`, `confidence`, `valid_from`, `valid_to`, `provenance`?}]. `src/features/graph/api/node-detail.types.ts` (`NodeDetailWire`, `AttributeWire`, `NodeAliasWire`, `NodeSummaryWire`).
- The BFF inline provenance entry: `fragment_id`, `fragment_text`, `confidence`?, `raw_information_id`?, `source_type`?, `received_at`?, `excerpt`?. `src/features/graph/api/node-detail.types.ts` (`ProvenanceEntryWire`).
- The BFF traversal answer: `starting_node_id`, `nodes` (node summaries), `links` [{`id`, `source_node_id`, `target_node_id`, `link_type`, `link_inverse_name`, `status`, `effective_status`, `is_current`, `is_in_effect`, `confidence`, `valid_from`, `valid_to`, `recorded_at`?, `superseded_at`?, `flags`?, `hop`, `score`, `provenance`?}]. `src/features/graph/api/traversal.types.ts` (`TraversalResultWire`, `TraversalLinkWire`).
- The BFF provenance answer: `fragments` [{`id`, `text`, `confidence`, `status`, `chunks` [{`id`, `chunk_index`, `offset_start`, `offset_end`, `excerpt`, `locator`?, `raw_information` {`id`, `source_type`, `received_at`, `metadata`?, `original_input`?}}]}]. `src/features/graph/api/provenance.types.ts` (`ProvenanceResponseWire` and its parts).
- The raw information metadata keys the area reads: `title`, `document_date`. `src/features/graph/api/provenance.transforms.ts` (`readMetadataTitle`, `readMetadataDocumentDate`).
- The graph delta input from the chat stream and from ingest: nodes with `id`, `node_type`, `canonical_name`, `status`; links with `id`, `source_node_id`, `target_node_id`, `link_type`, `link_type_label`?, `is_temporal`, `status`, `flags`, `is_in_effect`?. `src/features/graph/api/mapWireToGraphDelta.ts` (`GraphNodeWire`, `GraphLinkWire` usage).
- The BFF conversation graph view resource, read and written at `/api/v1/conversations/{id}/graph`: the read answers a saved view or null. `src/features/graph/api/use-graph-persistence.ts` (`GraphViewSnapshot`).
- The auth store's access token, owned by the sign-in flow. `src/features/graph/api/_request.ts` (`useAuthStore`).
- The graph store's nodes, positions, layout reset counter, restore (`hydrate`) and current-view (`getSnapshot`) operations. `src/features/graph/api/use-graph-persistence.ts`; `src/features/graph/api/mapWireToGraphDelta.ts` (`useGraphStore`).

## Outside the domain
- The barrel module's re-exports: wiring only. `src/features/graph/api/index.ts`.
- The query helper choice, the cast of id to string inside the read functions, and the `exactOptionalPropertyTypes` handling: implementation choices. `src/features/graph/api/useNodeDetail.ts`, `src/features/graph/api/provenance.transforms.ts`.
- The view and wire type names and the camelCase surface field names: internal naming. `src/features/graph/api/node-detail.types.ts`, `src/features/graph/api/traversal.types.ts`, `src/features/graph/api/provenance.types.ts`.
- The `hydratedFor` reference: it is written and never read, so it has no effect. `src/features/graph/api/use-graph-persistence.ts`.
- Indexing nodes by id for the neighbour lookup: a performance shape. `src/features/graph/api/traversal.transforms.ts`.
- Formatters created once when the module loads: a performance shape. `src/features/graph/api/_transforms.ts`, `src/features/graph/api/provenance.transforms.ts`.
- Comments that cite `410 BUSINESS_NODE_DELETED`, `RESOURCE_NOT_FOUND` and `SYSTEM_*` as what the panel branches on, the "DD/MM/YYYY HH:mm" pattern, and the meaning of `[REDACTED]`: text only, no code in the area. `src/features/graph/api/_transforms.ts`, `src/features/graph/api/useNodeDetail.ts`, `src/features/graph/api/provenance.types.ts`.
- The comment on `graphNodeKeys.all` saying it invalidates all graph-node queries: text, contradicted by the key shapes recorded under Facts. `src/features/graph/api/keys.ts`.

## Observed and not decided here
- A missing or non-finite confidence shows differently by place. On an inline provenance entry it shows no label: "`if (!Number.isFinite(confidence)) return null;`" `src/features/graph/api/_transforms.ts` (`formatConfidenceLabel`, used by `toProvenanceEntryView`). On a relationship and on a full-provenance fragment it shows `0%`: "`confidenceLabel: formatConfidenceLabel(wire.confidence) ?? "0%"`" `src/features/graph/api/traversal.transforms.ts` (`toLinkView`) and `src/features/graph/api/provenance.transforms.ts` (`toFragmentView`).
- The received-at instant of the same source shows two ways. On an inline provenance entry it is date only: "`day: "2-digit", month: "2-digit", year: "numeric"`" `src/features/graph/api/_transforms.ts` (`RECEIVED_AT_FORMATTER`). In the full provenance view it is date and time: "`dateStyle: "short", timeStyle: "short"`" `src/features/graph/api/provenance.transforms.ts` (`RECEIVED_AT_DATETIME`).
- A relationship's state comes from different fields by place. In the node relationships list it is shown from the effective status: "`effectiveStatus: wire.effective_status`" `src/features/graph/api/traversal.transforms.ts` (`toLinkView`). On the graph canvas it is derived from the assertion status and flags: "`state: deriveLinkState(wireLink.status, wireLink.flags)`" `src/features/graph/api/mapWireToGraphDelta.ts`.
