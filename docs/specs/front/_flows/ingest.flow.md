# Flow Spec — Ingest (`ingest.flow.md`)

> Feature: `/ingest` — document ingest workspace
> Version: 1.1.0 | Status: draft | Layer: permanent

---

<!-- TO CONFIRM (backend): `affected_nodes` is referenced throughout this flow as a field returned
by `ingestRawInformation` (and present in the `noop_existing` path). The current
`IngestRawInformationResponse` schema in `domains/ingestion/openapi.yaml` does NOT include this
field — the schema only declares `outcome`, `raw_information_id`, `content_hash`, `chunk_count`,
`chunks`, `llm_run_id`, `idempotency_key`. Neither `LlmRun` (returned by `runLlmExtraction` and
`getLlmRunById`) nor `LlmRunSummary` expose a node list. A backend schema extension is required:
`affected_nodes: [{ id, canonical_name, node_type }]` must be added to `IngestRawInformationResponse`
(for the `created` outcome) and to `LlmRun` (for the `noop_existing` and polling paths). Until
this field is confirmed and added to `openapi.yaml`, the graph assembly step (Step 4 / Sub-flow A
step 12) CANNOT be realized without an additional API call or backend change. The frontend spec is
written assuming `affected_nodes` will be added. See §4 fallback note in `ingest.feature.spec.md`. -->

---

## Involved Screens

| Screen | Route | Feature spec |
|---|---|---|
| Ingest workspace | `/ingest` | `features/ingest.feature.spec.md` |
| Sign-in | `/sign-in` | `features/sign-in.feature.spec.md` |
| Curadoria | `/curation` | `features/curadoria.feature.spec.md` |

---

## Happy Path — ASCII Diagram

```
[/ingest mounted]
      |
      ▼
UI-01 idle ──── user pastes text + selects source_type ────► UI-02 documento-pronto
                                                                      |
                                                                 clicks "Ingerir"
                                                                      |
                                                                      ▼
                                                               UI-03 enviando
                                                          POST /ingest/raw-information
                                                                      |
                                               ┌───────────────────────────────────────┐
                                  outcome: "created" (201)        outcome: "noop_existing" (200)
                                               │                             │
                                               ▼                             ▼
                                        UI-05 extraindo               UI-04 já-ingerido
                                   POST /llm-runs/:id/run          clicks "Ver grafo existente"
                                               │                             │
                                     ┌─────────┴───────────┐                │
                               200 completed         connection drop          │
                                     │               (polling mode)           │
                                     │                    │                   │
                                     ▼                    ▼                   │
                              (traverse step)    GET /llm-runs/:id           │
                                     │           every 5s until              │
                                     │           completed|failed             │
                                     │                    │                   │
                                     └─────────┬──────────┘                   │
                                               │◄──────────────────────────────┘
                                               ▼
                                      UI-08 revelando
                             (parallel traverse per affected_node)*
                             GET /nodes/:id/traverse?depth=1 × N
                             replaceNodes(delta) → staggered reveal
                                               │
                                               ▼
                                        UI-07 concluído
                                    summary counts shown
                                    "Ingerir outro" available
                                               │
                                    (click node in graph)
                                               │
                                               ▼
                                      UI-09 nó-selecionado
                                      NodeDetailPanel open
                                               │
                                    (close panel)
                                               │
                                               ▼
                                        UI-07 concluído
```

> *`affected_nodes` must be added to the backend schema before graph assembly can be realized.
> See the `<!-- TO CONFIRM -->` block at the top of this file.

---

## Sub-flows

### Sub-flow A — Submit a new document (created)

1. User navigates to `/ingest` (via Header link "Ingerir").
2. `IngestWorkspace` mounts; `GraphSpace` in `status="empty"`.
3. User pastes text into the `IngestPanel` textarea OR drops a `.txt` file into the dropzone.
4. User selects source type from the select (e.g., "Ata").
5. "Ingerir" button becomes enabled (UI-02).
6. User clicks "Ingerir" → UI-03 (enviando).
7. `useIngestRawInformation.mutate({ content, source_type, model: "claude-opus-4-8", prompt_version: "v3" })` fires.
8. BFF returns 201 `{ outcome: "created", llm_run_id, chunk_count }`.
   > **Note:** `affected_nodes` is expected here once the backend schema is extended (see TO CONFIRM
   > block). Until then, node IDs are not available from this response — graph assembly (step 12) is
   > blocked on the backend change.
9. `useRunLlmExtraction.mutate({ llm_run_id })` fires immediately → UI-05 (extraindo).
10. HTTP connection stays open (LLM-bound, minutes acceptable per §16).
11. BFF returns 200 with `{ status: "completed", summary }` (a `LlmRun` object).
    > `affected_nodes` is expected in the `LlmRun` response once the backend schema is extended.
    > If present here (from `runLlmExtraction` response), use these for step 12.
    > If present in the `ingestRawInformation` (step 8) response, store them at that point.
12. `useIngestGraphAssembly` fires `traverseNode?depth=1` for each node in `affected_nodes` (parallel).
13. All traverses resolve → `mapWireToGraphDelta(results)` → `useGraphStore.replaceNodes(delta)`.
14. `useGraphStore.setStatus("revealing")` → UI-08 (revelando).
15. `useGraphReveal` drains the queue (90ms stagger) → nodes animate in.
16. `useGraphStore.setStatus("ready")` → UI-07 (concluído).
17. Summary counts displayed in `IngestSummary`.

### Sub-flow B — Already-ingested document (noop_existing)

1. Steps 1–7 same as Sub-flow A.
2. BFF returns 200 `{ outcome: "noop_existing", llm_run_id, chunk_count }`.
   > **Note:** `affected_nodes` is expected here once the backend schema is extended (see TO CONFIRM
   > block). The `noop_existing` path implies the prior run is already `completed` — the backend
   > must return the node list from that completed run for the frontend to assemble the graph.
3. UI-04 (já-ingerido) shown: "Documento já ingerido" notice + "Ver grafo existente" CTA.
4. User clicks "Ver grafo existente".
5. `useIngestGraphAssembly` fires traverse calls using the existing run's `affected_nodes`.
6. Steps 13–17 same as Sub-flow A.

### Sub-flow C — Connection drop recovery (polling)

1. Steps 1–10 same as Sub-flow A.
2. HTTP connection to `runLlmExtraction` drops (client timeout or network instability).
3. UI remains in UI-05; progress copy changes to "Verificando extração…".
4. `useIngestRunStatus` starts polling `getLlmRunById` every 5 seconds.
5. **Server continues extraction** — the HTTP drop does not interrupt the server-side process.
6. Polling returns `status: "completed"` (a `LlmRun` object with `summary`).
   > `affected_nodes` is expected in the `LlmRun` polling response once the backend schema is
   > extended. This is the critical path for connection-drop recovery — without `affected_nodes`
   > in `getLlmRunById`, the polling path also cannot assemble the graph.
7. Once `affected_nodes` is available → steps 12–17 of Sub-flow A.
8. If polling returns `status: "failed"` → UI-06 (erro) with "Tentar novamente".

### Sub-flow D — Retry after failure

1. UI-06 active (extraction `failed` or provider unavailable).
2. User clicks "Tentar novamente".
3. `useRetryLlmRun.mutate({ llm_run_id })` fires → transitions run back to `running`.
4. `useRunLlmExtraction.mutate({ llm_run_id })` fires → UI-05.
5. Flow continues as Sub-flow A from step 10.

### Sub-flow E — Node detail inspection

1. UI-07 active, graph is interactive.
2. User clicks a node in `GraphSpace`.
3. `onNodeSelect(nodeId)` fires → `IngestWorkspace` sets `selectedNode = nodeId`.
4. `NodeDetailPanel` replaces `GraphSpace` in the right column.
5. `NodeDetailPanel` fetches `getNodeById(nodeId)` → shows aliases + current attributes (Phase A).
6. Phase B: `traverseNode(nodeId)` loads relationships (depth=1) after Phase A resolves.
7. Phase C: user expands "Ver origem completa" → `getProvenanceByLink` / `getProvenanceByAttribute` fire lazily.
8. User clicks the close button OR presses Esc → `setSelectedNode(null)` → `GraphSpace` restored.
9. Focus returns to the node button in `GraphSpace`.

### Sub-flow F — Ingest another document

1. From UI-07 (concluído) or UI-06 (erro), user clicks "Ingerir outro documento".
2. Form state resets to UI-01 (idle).
3. `useGraphStore.clear()` is called → GraphSpace returns to `status="empty"`.
4. User can now start a new ingestion.

---

## Navigation Rules (FL-NN)

| ID | Condition | Behavior | Fallback |
|---|---|---|---|
| FL-01 | User navigates to `/ingest` without a valid JWT | `protectedLayoutRoute.beforeLoad` redirects to `/sign-in?reason=session_expired` | Sign-in page |
| FL-02 | User navigates to `/ingest` with a valid JWT | `IngestWorkspace` mounts in UI-01 (idle) | — |
| FL-03 | `ingestRawInformation` returns 401 | `QueryCache.onError` clears token + redirects to `/sign-in?reason=session_expired` | Sign-in page |
| FL-04 | User clicks "Ingerir outro documento" from any terminal state (UI-04, UI-06, UI-07) | Reset form (all fields cleared); `useGraphStore.clear()`; return to UI-01 | — |
| FL-05 | `summary.needs_review > 0` in UI-07 | Info notice shown: "Alguns nós aguardam revisão." with link to `/curation` | User ignores it |
| FL-06 | User navigates away from `/ingest` mid-extraction (UI-05) | Server extraction continues; client-side state is abandoned (no cancel). On return to `/ingest`, form is in UI-01 (no resume). | — |
| FL-07 | Deep link `/ingest` (no prior state) | Always mounts in UI-01 (no state to restore — extraction state is ephemeral) | — |
| FL-08 | `affected_nodes` is absent from API response (backend schema not yet extended) | Graph assembly step is skipped; GraphSpace remains in `status="empty"` after extraction completes; a `<!-- TO CONFIRM -->` warning is surfaced in developer tooling only (not exposed to end-user) | GraphSpace stays empty; summary counts still display |

---

## Deep Links

| Entry | Route | Precondition | Behavior |
|---|---|---|---|
| Direct navigation | `/ingest` | JWT present | Mounts in UI-01 (idle). |
| Direct navigation | `/ingest` | JWT absent | Redirected to `/sign-in?reason=session_expired` (FL-01). |
| Header link "Ingerir" | `/ingest` | Any protected route | Standard navigation; no params needed. |

> There are no URL search params for the ingest feature. All extraction state is ephemeral (not persisted in the URL or `localStorage`).

---

## Data Persisted Between Screens

| Data | Mechanism | Scope |
|---|---|---|
| `useGraphStore` (nodes, links, positions, status) | Zustand (in-memory) | Session only — cleared on `clear()` call or page reload |
| `selectedNode` | `useState` in `IngestWorkspace` | Component mount lifetime |
| Form fields (`content`, `source_type`) | React Hook Form local state | Component mount lifetime |
| `llm_run_id` (for retry/polling) | `useState` / mutation result in `IngestWorkspace` | Component mount lifetime |
| `affected_nodes` (for traverse assembly) | Mutation result stored in component state — **pending backend schema extension; see TO CONFIRM block** | Component mount lifetime |

> None of the ingest workflow state is persisted to `localStorage` or `sessionStorage`. If the user refreshes the page, all state is lost and the form returns to UI-01.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-27 | Front Spec Agent | initial | New flow for `/ingest` — 6 sub-flows (created/noop/polling/retry/node-detail/ingest-another), 7 navigation rules, ASCII diagram. | -- |
| 1.1.0 | 2026-06-27 | Front Spec Agent | fix | Added TO CONFIRM block for `affected_nodes` (not in current `IngestRawInformationResponse` or `LlmRun` schemas in `openapi.yaml`); annotated each sub-flow step that depends on this field; added FL-08 fallback rule for absent `affected_nodes`; clarified that graph assembly is blocked until backend schema is extended. | reviewer feedback |
