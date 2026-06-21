# Validation Report — Chat (front phase, GraphSpace wave)

> Triage: VALID (amended 2026-06-21: ISSUE-001 corrected in front.md §7.1)
> Domain: chat (front phase — GraphSpace wave)
> Version: 2.0.0 (chat.feature.spec.md) + component specs v1.0.0
> Date: 2026-06-21
> Mode: Final Validation (front phase) — Mode 1b
> Scope: chat.feature.spec.md (amended), front.md (amended), GraphSpace.component.spec.md (new), GraphEdge.component.spec.md (new), NodeDetailPanel.component.spec.md (new)
> Reference: domains/chat/openapi.yaml v2.1.0, domains/knowledge-graph/openapi.yaml, _global/error-codes.md

---

## Result: INVALID

One blocking inconsistency found. Four warnings noted.

---

## Coverage Map

### UI States (chat.feature.spec.md §2)

| State | Endpoint/trigger | Error codes handled | Status |
|---|---|---|---|
| UI-01 idle/empty | none (no conversation) | — | covered |
| UI-02 loading | `listMessages` | `RESOURCE_NOT_FOUND` | covered |
| UI-03 success | `listMessages` resolves | — | covered |
| UI-04 streaming/thinking | SSE opened (`sendMessage`) | — | covered |
| UI-05 streaming/tool-running | SSE `tool_start` (graph tool) | — | covered |
| UI-06 streaming/graph-revealing | SSE `graph_delta` | — | covered |
| UI-07 streaming/text-flowing | SSE `text_delta` | — | covered |
| UI-08 streaming-done | SSE `done` | — | covered |
| UI-09 streaming-error | SSE `error` | `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR` | covered |
| UI-10 error (history) | `listMessages` fails | — | covered |
| UI-11 archived | `getConversation` → `archived_at` | `BUSINESS_CONVERSATION_ARCHIVED` | covered |
| UI-12 disabled | pre-stream error | `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | covered |
| UI-13 empty conversation | `listMessages` resolves empty | — | covered |
| UI-14 node detail | node click → `getNodeById` | `RESOURCE_NOT_FOUND`, `BUSINESS_NODE_DELETED` | covered |

Minimum coverage: loading (UI-02), success (UI-03), error (UI-10), empty (UI-01/UI-13) — SATISFIED.

### operationId coverage (§1 declared vs openapi)

| operationId | Domain | Exists in openapi.yaml | Status |
|---|---|---|---|
| `listConversations` | chat | yes (GET /api/v1/conversations) | OK |
| `createConversation` | chat | yes (POST /api/v1/conversations) | OK |
| `getConversation` | chat | yes (GET /api/v1/conversations/{id}) | OK |
| `updateConversation` | chat | yes (PATCH /api/v1/conversations/{id}) | OK |
| `deleteConversation` | chat | yes (DELETE /api/v1/conversations/{id}) | OK |
| `listMessages` | chat | yes (GET /api/v1/conversations/{id}/messages) | OK |
| `sendMessage` | chat | yes (POST /api/v1/conversations/{id}/messages) | OK |
| `getConversationUsage` | chat | yes (GET /api/v1/conversations/{id}/usage) | OK |
| `cancelTurn` | chat | yes (POST /api/v1/conversations/{id}/cancel) | OK |
| `getNodeById` | knowledge-graph | yes (GET /api/v1/nodes/{node_id}) | OK |

All 10 declared operationIds exist in their respective domain openapi.yaml files.

### SSE graph_delta contract cross-check

| Check | openapi.yaml | chat.feature.spec.md | Status |
|---|---|---|---|
| Frame name | `graph_delta` | `graph_delta` | consistent |
| Fields | `source_tool`, `nodes: GraphNodeWire[]`, `links: GraphLinkWire[]` | `sourceTool`, `nodes: GraphNodeWire[]`, `links: GraphLinkWire[]` | NOTE: openapi uses `source_tool` (snake_case wire); feature spec data layer mentions `sourceTool` in a TypeScript context — correct if the client parser camelCases the parsed SSE JSON |
| Emitted after | `tool_result{ok:true}` for traverse/get_node/list_nodes/search | same | consistent |
| Not terminal | yes (BR-41) | yes (`graph_delta` never final) | consistent |
| Not emitted on replay | BR-43 | "Wire `graph_delta` payload: malformed frame is skipped silently" (no replay mention but replay path specified in §4) | consistent with BR-43 via openapi invariant #5 |
| GraphNodeWire required fields | id, node_type, canonical_name, status | used in `mapWireToGraphDelta` | consistent |
| GraphLinkWire required fields | id, source_node_id, target_node_id, link_type, is_temporal | used in `mapWireToGraphDelta` | consistent |

### Component prop contract cross-check

**GraphNodeData vs GraphNodeWire:**

| GraphNodeData prop | Source in GraphNodeWire | Transform | Status |
|---|---|---|---|
| `id` | `id` | direct | consistent |
| `type: GraphNodeType` | `node_type: string` | `mapNodeType()` with fallback | consistent (documented in spec §2) |
| `label: string` | `canonical_name` | rename | consistent |
| `state?: ConfidenceState` | `status: "active" | "needs_review"` | derive: active→accepted, needs_review→uncertain | consistent across openapi, feature spec §4, GraphSpace spec §1 and §2 |
| `subtitle?: string` | not in wire | generated (human-readable type name) | consistent (optional, not from wire) |

**GraphLinkData vs GraphLinkWire:**

| GraphLinkData prop | Source in GraphLinkWire | Transform | Status |
|---|---|---|---|
| `id` | `id` | direct | consistent |
| `source` | `source_node_id` | rename | consistent |
| `target` | `target_node_id` | rename | consistent |
| `label` | `link_type` | rename | consistent |
| `isTemporal: boolean` | `is_temporal: boolean` | rename (camelCase) | consistent (is_temporal=true→solid, false→dashed per openapi + all component specs) |
| `inEffect?: boolean` | `is_in_effect?: boolean` | rename | consistent (optional in wire, optional in data) |
| `state?: ConfidenceState` | `status` + `flags[]` | derive (`deriveLinkState`) | consistent |

### Error code catalog cross-check

| error.code | In global catalog | HTTP in catalog | HTTP in openapi | Status |
|---|---|---|---|---|
| `RESOURCE_NOT_FOUND` | yes | 404 | 404 | OK |
| `BUSINESS_NODE_DELETED` | yes (Knowledge Graph) | 410 | 410 (knowledge-graph openapi) | OK |
| `BUSINESS_CONVERSATION_ARCHIVED` | yes (Chat) | 409 | 409 | OK |
| `BUSINESS_TURN_IN_PROGRESS` | yes (Chat) | 409 | 409 | OK |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | yes (Chat) | 409 | 409 | OK |
| `BUSINESS_CHAT_DISABLED` | yes (Chat) | 503 | 503 | OK |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | yes (Chat) | 503 | 503 | OK |
| `VALIDATION_REQUIRED_FIELD` | yes | 422 | 422 | OK |
| `VALIDATION_INVALID_FORMAT` | yes | 422 | 422 | OK |
| `AUTH_UNAUTHORIZED` | yes | 401 | 401 | OK |
| `AUTH_TOKEN_EXPIRED` | yes | 401 | 401 | OK |
| `AUTH_TOKEN_INVALID` | yes | 401 | 401 | OK |
| `SYSTEM_INTERNAL_ERROR` | yes | 500 | 500 | OK |
| `SYSTEM_NETWORK` | **NOT in catalog** | — | — | WARNING |
| `SYSTEM_INVALID_RESPONSE` | **NOT in catalog** | — | — | WARNING |
| `SYSTEM_UPSTREAM` | **NOT in catalog** | — | — | WARNING |

### Design system checks

| Check | Status |
|---|---|
| `front/design-system/` exists with 5 required files | OK — `_index.md`, `tokens.md`, `composition.md`, `components.md`, `implementation.md` present |
| `front/design-system-rules.md` exists | OK |
| `tokens.md` has `## Token Declarations` CSS block with non-placeholder values | OK (§2 CSS block has real OKLCH values) |
| `tokens.md` has `token-manifest` YAML block | OK |
| `design-system/_index.md` has populated Changelog | OK (v1.2.0 changelog) |
| `design-system-rules.md` reflects current tokens | OK (version 1.2.0 matches index) |

### Component specs cross-check (§7 and component.spec.md files)

| Component in feature spec §7 | Has component.spec.md | Adapter block or direct-map | Status |
|---|---|---|---|
| `GlassSurface` | yes (GlassSurface.component.spec.md) | direct-map (level, animate, role, aria-label) | OK |
| `ChatBubble` | yes (ChatBubble.component.spec.md) | adapter block present in §7 | OK |
| `ConversationMenu` | yes (ConversationMenu.component.spec.md) | adapter block present in §7 | OK |
| `Button` | no spec (shadcn/ui primitive) | `direct-map` per note in §7 | OK |
| `Textarea` | no spec (shadcn/ui primitive) | `direct-map` per note in §7 | OK |
| `Input` | no spec (shadcn/ui primitive) | `direct-map` per note in §7 | OK |
| `Switch` | no spec (shadcn/ui primitive) | `direct-map` per note in §7 | OK |

GraphSpace, GraphEdge, NodeDetailPanel are feature-local components (`features/graph/components/`) — correctly NOT listed in chat feature spec §7 (§7 covers only `src/components/` global components). Their own `component.spec.md` files fulfill the spec-completeness requirement.

### BDD scenarios

| Spec file | Scenario count | Minimum met (2) |
|---|---|---|
| chat.feature.spec.md §9 | 9 | yes |
| GraphSpace.component.spec.md §7 | 7 | yes |
| GraphEdge.component.spec.md §7 | 5 | yes |
| NodeDetailPanel.component.spec.md §7 | 5 | yes |

### UI control traceability (anti-invention check)

Requirement text: "Adicionar a visualização do grafo de conhecimento (GraphSpace) ao painel direito (60%) da tela /chat: renderizar automaticamente os nós/links que as tools de query do chat retornam, animados 1 a 1, fluxo unidirecional chat→graph, e indicadores de processamento (waiting) nos dois painéis."

Interactive controls introduced in §2 of chat.feature.spec.md for the GraphSpace wave:
- Graph canvas (pan/zoom) — inherent to rendering a graph (not an added filter/search/sort)
- Node click → NodeDetailPanel — node interaction is inherent to a graph visualization
- `ChatStatusIndicator` — "indicadores de processamento" explicitly in requirement
- `GraphStatusOverlay` — "indicadores de processamento" (graph side) explicitly in requirement

No filter, search-input, sort-control, pagination, or bulk-action controls added. All controls trace to the requirement. PASS.

### Flow FL-NN vs §3 consistency

chat.flow.md (v1.0.0) covers only navigation-level flows (FL-01..FL-07). The GraphSpace wave adds intra-page transitions (UI-05..UI-14 in §3) that are within the single `/chat` route — no cross-feature redirects were added. All cross-feature redirects (→ /sign-in, → /chat on delete/archive) were already covered by FL-06 and FL-04/FL-05. No FL-NN inconsistency detected.

---

## Inconsistencies

| # | Type | Source File | Target File | Description | Agent | Severity | Selected |
|---|------|------------|-------------|-------------|-------|----------|----------|
| 1 | cross-ref | `front/front.md §7.1` | `front/front.md §4.3` | Decision table §7.1 "State of the view" row still references `useGraphViewStore` (old name). §4.3 (added v1.4.0) correctly registers `useGraphStore` as the ephemeral graph state. The two sections contradict each other within the same file. | Front Spec Agent | blocking | [ ] |
| 2 | error-code | `front/features/chat.feature.spec.md §6` | `_global/error-codes.md` | `SYSTEM_NETWORK` is referenced in §6 but is NOT registered in the global error code catalog. This is a client-generated synthetic code representing a network failure — it should either be registered in the catalog or clearly annotated as a client-side synthetic code not from the BFF envelope. | Spec Writer | warning | [ ] |
| 3 | error-code | `front/features/chat.feature.spec.md §6` | `_global/error-codes.md` | `SYSTEM_INVALID_RESPONSE` is referenced in §6 but is NOT registered in the global error code catalog. Same situation as SYSTEM_NETWORK — client-generated synthetic code. | Spec Writer | warning | [ ] |
| 4 | error-code | `front/features/chat.feature.spec.md §6` | `_global/error-codes.md` | `SYSTEM_UPSTREAM` is referenced in §6 but is NOT registered in the global error code catalog. Client-generated synthetic code for 5xx pre-stream responses — not a BFF envelope code. | Spec Writer | warning | [ ] |
| 5 | component-gap | `front/design-system/components.md` | `front/features/chat.feature.spec.md §10` | `components.md` does not have a `§4.3 Graph feature` section. `GraphSpace`, `GraphEdge`, `NodeDetailPanel`, `GraphNodeAdapter`, `ChatStatusIndicator` are new feature-local components introduced by the GraphSpace wave that should be listed in §4 for orientation (even though full specs live in their own files). The lack of catalog entry is informational only — development can proceed without it. | Front Spec Agent | warning | [ ] |

---

## Required Actions (for the Orchestrator)

| # | Inconsistency | Responsible Agent | What to fix |
|---|---------------|-------------------|-------------|
| 1 | §7.1 `useGraphViewStore` vs §4.3 `useGraphStore` contradiction | Front Spec Agent | In `front.md §7.1`, update the "State of the view" row to say "Zustand `useGraphStore`" (the ephemeral graph state store defined in §4.3 for the GraphSpace wave). The old `useGraphViewStore` (session-persistent, view state only) is the `/graph` full-screen explorer store — NOT what the chat GraphSpace pane uses. |
| 2–4 | SYSTEM_NETWORK / SYSTEM_INVALID_RESPONSE / SYSTEM_UPSTREAM not in catalog | Spec Writer | Register the three codes in `_global/error-codes.md` under a "System (client-generated)" subsection, noting that these are not BFF envelope codes — they are client-side synthetic codes generated by `lib/http.ts` / `features/chat/api/chat-stream.ts` to normalize network and response parsing failures. HTTP column: N/A (no HTTP status; generated before/after fetch). |
| 5 | components.md missing §4.3 graph feature section | Front Spec Agent | Add `§4.3 Graph feature` to `components.md`, listing: `GraphSpace` (graph panel), `GraphEdge`/`GraphEdgeAdapter` (custom RF edge), `NodeDetailPanel` (inline node detail), `GraphNodeAdapter` (wraps ds/GraphNode for React Flow), `ChatStatusIndicator` (waiting indicator, single-use). |

---

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
