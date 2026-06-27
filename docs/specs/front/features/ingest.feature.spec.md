# Feature Spec — Ingest (`/ingest`)

> Route: `/ingest` — document ingest workspace
> Domains: ingestion, knowledge-graph
> Version: 1.0.0 | Status: draft | Layer: permanent

> This spec covers the new `/ingest` screen. Today the route is a `StubPage`; the "Ingerir"/Upload
> link already exists in the Header. This screen mirrors the `/chat` 40/60 split layout — IngestPanel
> on the left (40%), GraphSpace on the right (60%). The right-column GraphSpace is **identical** to
> the one used by `/chat` (reuse of `features/graph/` unchanged).
>
> Cross-references: `front.md`, `ingest.flow.md`, `GraphSpace.component.spec.md`,
> `NodeDetailPanel.component.spec.md`, `chat.feature.spec.md` (§11 unidirectionality invariant).

---

## §1 Consumed Endpoints

> Selection map only — Method+Path and Auth are in `domains/ingestion/openapi.yaml` and
> `domains/knowledge-graph/openapi.yaml`. No Method+Path or Auth columns here.

| Domain | operationId | Purpose |
|---|---|---|
| ingestion | `ingestRawInformation` | Step 1 — submit content + source_type; receives `llm_run_id`, `chunk_count`, and idempotency `outcome` |
| ingestion | `runLlmExtraction` | Step 2 — trigger server-side LLM extraction (blocking, LLM-bound minutes); called after `ingestRawInformation` when `outcome === "created"` |
| ingestion | `getLlmRunById` | Step 3 — polling loop: fetch run status every N seconds until `status === "completed" \| "failed"` |
| ingestion | `retryLlmRun` | Error recovery — POST to retry a `failed` run; re-enables the extraction step |
| knowledge-graph | `traverseNode` | Step 4 — for each node in `affected_nodes`, fetch depth-1 traverse to collect links between affected nodes; used to assemble the graph delta |

---

## §2 Feature States (UI)

### UI-01 — idle / empty (dropzone awaiting content)

**Entry condition:** `/ingest` mounted; no content in `IngestPanel`; no extraction in progress.

- `IngestWorkspace` renders the 40%/60% container-query split (same `@container + @lg:flex-row` pattern as `/chat`).
- Left column (`IngestPanel`):
  - Dropzone area: labeled with `<label>` (text "Arraste um arquivo .txt ou cole o texto do documento"), keyboard-accessible (`tabIndex={0}`, `onKeyDown` Enter/Space triggers file dialog).
  - Textarea: `placeholder="Cole aqui o conteúdo do documento…"`, empty.
  - Source type select: `<select>` labeled "Tipo de fonte", default option "Selecione o tipo…" (no pre-selection).
  - "Ingerir" button: `disabled` (content or source_type not yet provided).
  - Progress/summary area: hidden (`aria-live="polite"` region present but empty).
- Right column: `GraphSpace` in `status="empty"` — shows `GraphEmptyState` with copy "Ingerindo um documento, o grafo aparecerá aqui."

### UI-02 — documento-pronto (content and source_type filled)

**Entry condition:** `content.length >= 1` AND `source_type` selected from enum.

- IngestPanel: textarea shows content. "Ingerir" button **enabled**.
- Dropzone: shows file name if file was dropped (e.g., "relatorio.txt — 4.2 KB"); reset (`×`) button appears.
- Source type select: shows selected value.
- Progress/summary area: still hidden.
- GraphSpace right column: unchanged from UI-01.

### UI-03 — enviando (POST ingestRawInformation in flight)

**Entry condition:** User clicks "Ingerir" in UI-02; `useIngestRawInformation` mutation is pending.

- "Ingerir" button replaced by a spinner + "Enviando…" label; `disabled`.
- Source type select: `disabled`.
- Textarea: `disabled`.
- Dropzone: `disabled`.
- Progress/summary area: shows "Enviando documento…" with a spinner (`aria-live="polite"`, `aria-busy="true"` on region root).
- GraphSpace: unchanged.

### UI-04 — já-ingerido (idempotency noop_existing)

**Entry condition:** `ingestRawInformation` returns HTTP 200 with `outcome === "noop_existing"`.

- IngestPanel shows an inline notice (info level, not error):
  - Icon: `Info` (lucide).
  - Title: "Documento já ingerido".
  - Body: "Este conteúdo já foi processado anteriormente. O grafo abaixo mostra os nós extraídos."
  - CTA button: "Ver grafo existente" — triggers Step 4 (traverse assembly) using the returned `llm_run_id`; transitions to UI-08 (revealing) immediately (run is already `completed`).
  - Secondary link: "Ingerir outro documento" — resets the form to UI-01.
- "Ingerir" button hidden.
- Progress/summary region: shows the notice described above.
- GraphSpace: status moves to "loading" as traverses fire.

### UI-05 — extraindo (runLlmExtraction blocking call + polling)

**Entry condition:** `ingestRawInformation` returned `outcome === "created"` AND `runLlmExtraction` mutation was fired.

- Progress/summary area shows extraction in progress:
  - Spinner + "Extraindo conhecimento… (pode levar alguns minutos)".
  - `aria-live="polite"`, `aria-busy="true"` on region root.
  - If `runLlmExtraction` times out on the client (network drop), the UI auto-switches to polling mode silently: progress copy becomes "Verificando extração…" while `getLlmRunById` polling continues.
- "Ingerir" button: hidden.
- Source type select, textarea, dropzone: `disabled`.
- GraphSpace right column: `status="loading"` — `GraphStatusOverlay` shows "Extraindo…" (overlay spinner, `aria-live="polite"`).

### UI-06 — erro (extraction failed or network error)

**Entry condition:** `getLlmRunById` polling resolves with `status === "failed"`, OR `runLlmExtraction` returns 500/502, OR `ingestRawInformation` returns 422/401/500.

- Progress/summary area shows an error band:
  - `role="alert"`, `AlertTriangle` icon.
  - Message maps from error code (see §6).
  - "Tentar novamente" button (if run is `failed`): triggers `retryLlmRun` then `runLlmExtraction` (same sequence); transitions back to UI-05.
  - "Ingerir outro" link: resets form to UI-01.
- GraphSpace: unchanged (previous graph stays if any).

### UI-07 — concluído (extraction completed, graph assembled)

**Entry condition:** polling resolves `status === "completed"` AND all traverse calls resolved AND `replaceNodes(delta)` was applied to `useGraphStore`.

- Progress/summary area shows extraction summary (computed from `LlmRunSummary`):
  - Title: "Extração concluída".
  - Summary counts table (inline, compact): `accepted`, `consolidated`, `needs_review`, `uncertain`, `disputed`, `rejected`, `error` (subset of `LlmRunSummary` schema fields; `superseded_previous` and `orphaned_fragments` are present in the schema but intentionally omitted from this display — out of scope v1).
  - If `summary.needs_review > 0`: info notice "Alguns nós aguardam revisão. Acesse Curadoria para detalhes."
  - "Ingerir outro documento" link: resets form to UI-01 (replaces graph on next ingest).
- GraphSpace right column: `status="ready"` — interactive subgraph of nodes from `affected_nodes` with their depth-1 links.
- "Ingerir" button: hidden; form fields disabled.

### UI-08 — revelando (nodes entering 1-by-1 from traverse results)

**Entry condition:** traverse calls resolved; `replaceNodes(delta)` applied; `useGraphStore.status === "revealing"`.

- GraphSpace shows nodes animating in (same Framer Motion entrance as `/chat`: `opacity 0→1` + `scale 0.85→1`, stagger 90ms).
- Progress/summary area: already showing summary (from UI-07 transition) while graph animates.
- `aria-busy="true"` on GraphSpace panel root while queue is draining.

### UI-09 — nó-selecionado (NodeDetailPanel open)

**Entry condition:** User clicks a node in the graph while in UI-07/UI-08; `onNodeSelect(nodeId)` fires; `IngestWorkspace` mounts `NodeDetailPanel` in the right column.

- `NodeDetailPanel` replaces `GraphSpace` in the right column (identical behavior to `/chat` — same component, same `getNodeById` + `traverseNode` + provenance hooks).
- Closing the panel (back button or Esc) returns to UI-07/UI-08.
- Left column (`IngestPanel`) is unaffected by node selection.

---

> **§2 — GraphSpace right-column states.** Mirrors `/chat`: `status = "empty" | "loading" | "revealing" | "ready" | "error"`. Driven by `useGraphStore` (the same Zustand slice), fed by `useIngestGraphAssembly` in `features/ingest/api/` (not by SSE). The non-cumulative rule applies: each new ingest replaces the graph via `replaceNodes`.

---

## §3 State Transition Table

| From | Trigger | To | Side Effect |
|---|---|---|---|
| UI-01 | User types or drops text (content.length >= 1 AND source_type selected) | UI-02 | None — button becomes enabled |
| UI-01 | User fills content but not source_type (or vice versa) | UI-01 | Button stays disabled |
| UI-02 | User clears content or deselects source_type | UI-01 | Button disabled |
| UI-02 | User clicks "Ingerir" | UI-03 | `useIngestRawInformation.mutate({ content, source_type, model, prompt_version })` fires |
| UI-03 | `ingestRawInformation` returns 201 (`outcome: "created"`) | UI-05 | `runLlmExtraction.mutate({ llm_run_id })` fires immediately; `useGraphStore.setStatus("loading")` |
| UI-03 | `ingestRawInformation` returns 200 (`outcome: "noop_existing"`) | UI-04 | Store `llm_run_id`; `useGraphStore.setStatus("loading")` |
| UI-03 | `ingestRawInformation` returns 4xx/5xx | UI-06 | `role="alert"` error band; button re-enabled for retry |
| UI-04 | User clicks "Ver grafo existente" | UI-08 | `useIngestGraphAssembly` fires traverse calls using stored `affected_nodes` from the existing completed run |
| UI-04 | User clicks "Ingerir outro documento" | UI-01 | Reset form; `useGraphStore.clear()` |
| UI-05 | `runLlmExtraction` returns 200 (`status: "completed"`) | UI-08 | `useIngestGraphAssembly` fires traverse calls; `replaceNodes(delta)` applied |
| UI-05 | `runLlmExtraction` connection drops (network timeout) | UI-05 (polling mode) | Start `getLlmRunById` polling loop (5s interval); progress copy changes to "Verificando extração…" |
| UI-05 | Polling: `getLlmRunById` returns `status: "completed"` | UI-08 | `useIngestGraphAssembly` fires traverse calls; `replaceNodes(delta)` applied |
| UI-05 | Polling: `getLlmRunById` returns `status: "failed"` | UI-06 | `role="alert"` error band; "Tentar novamente" button available |
| UI-05 | `runLlmExtraction` returns 500/502 | UI-06 | `role="alert"` error band |
| UI-06 | User clicks "Tentar novamente" (run is `failed`) | UI-05 | `retryLlmRun.mutate({ llm_run_id })` then `runLlmExtraction.mutate({ llm_run_id })` |
| UI-06 | User clicks "Ingerir outro" | UI-01 | Reset form; `useGraphStore.clear()` |
| UI-08 | All traverse calls resolved; `replaceNodes(delta)` applied; `revealQueue` draining | UI-07 + UI-08 | `useGraphStore.setStatus("revealing")`; summary shown in left panel simultaneously |
| UI-08 | `revealQueue` drains completely | UI-07 | `useGraphStore.setStatus("ready")` |
| UI-07 | User clicks a graph node | UI-09 | `onNodeSelect(nodeId)` → `IngestWorkspace` mounts `NodeDetailPanel` in right column |
| UI-09 | User closes `NodeDetailPanel` | UI-07 | `NodeDetailPanel` unmounts; `GraphSpace` remounts |
| UI-07 | User clicks "Ingerir outro documento" | UI-01 | Reset form state; `useGraphStore.clear()` clears graph |
| any | JWT expired or 401 received | → `/sign-in?reason=session_expired` | `QueryCache.onError` global handler; `front.md §5` |

---

## §4 Requests, Order and Cache

### Execution order

The ingest flow is **strictly sequential** (each step depends on the previous result):

1. **Step 1 — ingestRawInformation (mutation, on user submit):**
   - POST with `{ source_type, content, model: "claude-opus-4-8", prompt_version: "v3" }`.
   - Returns `{ outcome, llm_run_id, chunk_count, affected_nodes? }`.
   - On `outcome: "noop_existing"`: skip step 2 (extraction already done); go directly to step 4.
   - On `outcome: "created"`: proceed to step 2.

2. **Step 2 — runLlmExtraction (mutation, fired immediately after step 1 `"created"`):**
   - POST to `/api/v1/ingest/llm-runs/:llmRunId/run` (blocking — HTTP connection stays open).
   - Client-side timeout: generous (no enforced client timeout — per CLAUDE.md "ingest_document client timeout ≠ failure"). If the connection drops, step 3 (polling) recovers.
   - On 200 (`status: "completed"`): proceed to step 4.
   - On connection drop: start polling loop (step 3) immediately.
   - On 500/502: surface error; run is now `failed`; user can retry via `retryLlmRun`.

3. **Step 3 — getLlmRunById polling (Query, started only on connection drop from step 2):**
   - GET `/api/v1/ingest/llm-runs/:llmRunId` every 5 seconds (`refetchInterval: 5000`).
   - `staleTime: 0` (volatile — run status changes).
   - Stop polling when `status === "completed" | "failed"` (set `enabled: false` on terminal status).
   - On `completed`: proceed to step 4.
   - On `failed`: surface error.

4. **Step 4 — traverseNode (parallel Queries, one per affected node):**
   - Each affected node from `affected_nodes` array gets a `GET /api/v1/nodes/:id/traverse?depth=1`.
   - All traverse calls fire **in parallel** via a `useQueries` batch.
   - `staleTime: 5 min` (stable data — graph links do not change during ingest session).
   - Results are merged into a `GraphDelta` (nodes + links) via `useIngestGraphAssembly`.
   - Link deduplication: links are deduped by `id` (same link may appear in multiple traversals).
   - `replaceNodes(delta)` called once all traverse calls resolve.

### Cache keys

```ts
// features/ingest/api/keys.ts
ingestKeys.run(id: string)       // ["ingest", "run", id]
ingestKeys.traverse(nodeId: string)  // ["ingest", "traverse", nodeId]
```

> `ingestRawInformation` and `runLlmExtraction` are mutations — no cache key needed.
> `retryLlmRun` is a mutation — no cache key needed.

TTL / revalidation summary:

| Query | staleTime | refetchOnWindowFocus | Notes |
|---|---|---|---|
| `getLlmRunById` (polling) | 0 | false | Volatile; polling drives revalidation |
| `traverseNode` (per node) | 5 min | false | Stable — links computed post-extraction |

### Response transforms

Applied in `features/ingest/api/_transforms.ts`:

| operationId | Transform |
|---|---|
| `ingestRawInformation` | Extracts `{ outcome, llm_run_id, chunk_count }` from the response envelope; passes `affected_nodes` (if present) to the graph assembly step |
| `getLlmRunById` | Extracts `{ status, summary, finished_at }` from the `result` envelope; `summary` used to populate the UI-07 counts |
| `traverseNode` | Extracts `result.nodes[]` and `result.links[]`; renames snake_case fields to camelCase (`node_type` → `nodeType`, `canonical_name` → `canonicalName`, `is_temporal` → `isTemporal`); maps to `GraphNodeData` and `GraphLinkData` types in `features/graph/types.ts` |

> **`mapWireToGraphDelta` extraction (anti-pattern prevention):** the wire→surface mapping function is extracted from `features/chat/api/` to `features/graph/api/mapWireToGraphDelta.ts` so both `/chat` and `/ingest` can import it without a cross-feature dependency. `features/ingest` MUST NOT import from `features/chat` — see Requirement.

### Composed models

`IngestGraphDelta` (assembled in `features/ingest/api/useIngestGraphAssembly.ts`) merges:

- `affected_nodes[]` from `ingestRawInformation` response → provides `{ id, canonical_name, node_type }` for each node.
- `traverseNode` results for each `id` → provides link data connecting affected nodes.
- The composed delta is passed to `useGraphStore.replaceNodes(delta)`.

---

## §5 Input Validations

> Technical constraints (required, minLength, maxLength, pattern, enum) are in `openapi.yaml`. This section covers user-facing messages and timing only.

| Field | Trigger | User message |
|---|---|---|
| `content` — empty on submit | submit (button click) | "Cole ou arraste o conteúdo do documento antes de ingerir." |
| `content` — exceeds 10 MiB (10 485 760 chars) | onChange (live, after 1s debounce) | "O conteúdo excede o limite de 10 MiB. Reduza o texto." |
| `source_type` — not selected on submit | submit | "Selecione o tipo de fonte antes de ingerir." |

Validation is realized by `ingestFormSchema` (Zod):

```ts
z.object({
  content: z.string().min(1).max(10485760),
  source_type: z.enum(["pdf", "email", "ata", "chat", "artigo", "transcricao", "outro"]),
})
```

Wired via React Hook Form v7 + `zodResolver`. `mode: "onSubmit"` for the primary gate; `mode: "onChange"` with 1s debounce for the oversized-content case only.

---

## §6 API Error → UI Mapping

| error.code | HTTP / path | Display | Message | Action |
|---|---|---|---|---|
| `VALIDATION_REQUIRED_FIELD` | 422 (ingestRawInformation) | Inline form error below field | "Campo obrigatório ausente." | — (schema guard should prevent this) |
| `VALIDATION_INVALID_FORMAT` | 422 (ingestRawInformation) | Inline form error | "Formato inválido na requisição." | — |
| `VALIDATION_OUT_OF_RANGE` | 422 (ingestRawInformation) | Inline form error | "Conteúdo fora do limite permitido." | Trim content |
| `BUSINESS_RUN_NOT_RUNNABLE` | 409 (runLlmExtraction) | `role="alert"` error band in progress area | "Esta extração já foi concluída ou não está no estado correto." | "Ver grafo existente" → trigger traverse assembly |
| `BUSINESS_RUN_NOT_RETRYABLE` | 409 (retryLlmRun) | `role="alert"` error band | "Esta extração não pode ser reprocessada neste momento." | "Ingerir outro documento" |
| `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | 502 (runLlmExtraction) | `role="alert"` error band | "O provedor de IA está indisponível. Tente novamente em instantes." | "Tentar novamente" (retryLlmRun → runLlmExtraction) |
| `SYSTEM_INTERNAL_ERROR` | 500 (any) | Toast `danger` | "Algo deu errado. Tente novamente." | Retry button or page reload |
| `RESOURCE_NOT_FOUND` | 404 (getLlmRunById / traverseNode) | `role="alert"` error band | "Recurso não encontrado. O run ou nó pode ter sido removido." | "Ingerir outro documento" |
| `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` | 401 | Global: clear token + redirect to `/sign-in?reason=session_expired` | — | Handled by `QueryCache.onError` (see `front.md §5`) |
| `BUSINESS_INVALID_TRAVERSE_DEPTH` | 422 (traverseNode) | Toast `warning` (should never occur — depth is always 1) | "Parâmetro de travessia inválido." | — |
| Network offline (client-generated) | — | Toast `warning` | "Sem conexão. Verificando status da extração…" | Polling continues in background; auto-reconnect |
| Request timeout on runLlmExtraction (client-generated connection drop) | — | **Silent** — UI switches to polling mode automatically; progress copy changes to "Verificando extração…" | — | Polling drives recovery |

---

## §7 Shared Components Used

> Only `src/components/` global components (never feature-local ones).

| Component | File | Used by | Notes |
|---|---|---|---|
| `GlassSurface` | `components/ds/GlassSurface/` | `IngestWorkspace` (graph stub/overlay), `IngestPanel` (panel surface) | See adapter block below |
| `GraphSpace` | `components/ds/GraphSpace/` (feature-local to `features/graph/`) | `IngestWorkspace` (right column) | Reused directly — same props contract as in `/chat`; see adapter block below |
| `NodeDetailPanel` | `components/ds/NodeDetailPanel/` (feature-local to `features/graph/`) | `IngestWorkspace` (right column, replaces GraphSpace on node select) | Reused directly — same `nodeId` prop; see adapter block below |
| `Button` | `components/ui/button/` | `IngestPanel` (Ingerir, Tentar novamente, Ingerir outro) | Direct prop mapping — no adapter needed |
| `Textarea` | `components/ui/textarea/` | `IngestPanel` | See adapter block below |
| `Select` | `components/ui/select/` | `IngestPanel` (source_type picker) | See adapter block below |
| `StateBadge` | `components/ds/StateBadge/` | `IngestSummary` (compact counts per outcome) | See adapter block below |

### Component adapters

**GraphSpace adapter (in `IngestWorkspace`):**

`IngestWorkspace` reads `useGraphStore` and maps to `GraphSpace` props:

| GraphSpace prop | Source / derivation |
|---|---|
| `nodes` | `useGraphStore(s => Array.from(s.nodes.values()))` |
| `links` | `useGraphStore(s => Array.from(s.links.values()))` |
| `status` | `useGraphStore(s => s.status)` |
| `errorMessage` | `useGraphStore(s => s.errorMessage)` |
| `onNodeSelect` | `(nodeId) => setSelectedNode(nodeId)` — local state in `IngestWorkspace` |
| `revealStaggerMs` | `90` (default, same as `/chat`) |

**NodeDetailPanel adapter (in `IngestWorkspace`):**

| NodeDetailPanel prop | Source / derivation |
|---|---|
| `nodeId` | `selectedNode` — local state in `IngestWorkspace` |
| `onClose` | `() => setSelectedNode(null)` |

**Textarea adapter (in `IngestPanel`):**

| Textarea prop | Source / derivation |
|---|---|
| `id` | `"ingest-content"` |
| `invalid` | `!!formState.errors.content` → component maps to `aria-invalid="true"` |
| `disabled` | `isSubmitting \|\| isExtracting` |
| `aria-describedby` | Points at inline error message paragraph ID when `invalid` |
| `aria-label` | `"Conteúdo do documento"` (also has visible `<label htmlFor>`) |

**Select adapter (in `IngestPanel`):**

| Select prop | Source / derivation |
|---|---|
| `id` | `"ingest-source-type"` |
| `invalid` | `!!formState.errors.source_type` |
| `disabled` | `isSubmitting \|\| isExtracting` |
| `aria-label` | `"Tipo de fonte"` (also has visible `<label htmlFor>`) |

**GlassSurface adapter (in `IngestPanel`):**

| GlassSurface prop | Source / derivation |
|---|---|
| `level` | `"ambient"` (same level as `Composer` in `/chat`) |
| `className` | `"flex flex-col h-full"` |

**StateBadge adapter (in `IngestSummary`):**

`LlmRunSummary` fields map to `StateBadge` entries:

| StateBadge prop | Source / derivation |
|---|---|
| `state` | Outcome key: `"accepted" \| "consolidated" \| "needs_review" \| "uncertain" \| "disputed" \| "rejected" \| "error"` |
| `count` | `summary[key]` integer |

---

## §8 Feature Accessibility

> Baseline: WCAG 2.2 AA.

| Requirement | Implementation |
|---|---|
| Dropzone keyboard accessible | `tabIndex={0}`; `role="button"`; `aria-label="Área para arrastar ou carregar arquivo .txt"`; Enter/Space triggers file input click; `aria-describedby` points at helper text "Arraste um .txt ou cole o texto abaixo." |
| Dropzone drag-over feedback | `aria-dropeffect="copy"` on the zone when a drag is in progress |
| Content textarea label | `<label htmlFor="ingest-content">Conteúdo do documento</label>` (visible label above textarea) |
| Source type select label | `<label htmlFor="ingest-source-type">Tipo de fonte</label>` (visible label) |
| Progress/summary live region | `aria-live="polite"` on the progress section root; `aria-busy="true"` while extraction is in progress (UI-03, UI-05); `aria-busy="false"` on completion or error |
| Error announcement | `role="alert"` on the error band (UI-06) so screen readers announce immediately |
| Ingerir button loading state | Button renders `aria-disabled="true"` + spinner + `aria-label="Ingerindo…"` during UI-03/UI-05 |
| `aria-invalid` on form fields | `Textarea` and `Select` receive `invalid={hasError}` — components map to `aria-invalid="true"` |
| `aria-describedby` on invalid fields | Points at inline message paragraph when a validation error is present |
| Graph panel busy state | `aria-busy="true"` on `GraphSpace` panel root while `status === "loading" \| "revealing"` |
| Graph empty state announced | `GraphEmptyState` has `role="status"` and meaningful copy |
| Graph load overlay announced | `GraphStatusOverlay` has `aria-live="polite"` |
| NodeDetailPanel focus management | When `NodeDetailPanel` opens, focus moves to the panel; on close, focus returns to the node button in `GraphSpace` |
| Interactive elements size | All buttons/inputs ≥ 32 px height (project floor, `front.md §10`) |
| Reduced motion | Framer Motion graph animations: `prefers-reduced-motion: reduce` reveals all nodes in one tick (opacity-only, no scale, no stagger) — same as `/chat` |
| Source type select enum | Options: `{ pdf: "PDF", email: "E-mail", ata: "Ata", chat: "Chat", artigo: "Artigo", transcricao: "Transcrição", outro: "Outro" }` — human-readable labels in pt-BR |

---

## §9 BDD Scenarios

> These are feature invariants — regression anchors. They are NOT Task Contract acceptance criteria.

### Scenario 1 — Happy path: ingest a new document and reveal graph

**Given** `/ingest` is mounted and authenticated  
**When** the user pastes text in the textarea and selects "Ata" as source type  
**And** clicks "Ingerir"  
**Then** the button shows a spinner ("Enviando…") and the form is disabled  
**And** after POST /ingest/raw-information succeeds with `outcome: "created"`, the progress area shows "Extraindo conhecimento…"  
**And** after runLlmExtraction completes with `status: "completed"`, traverse calls fire in parallel  
**And** `replaceNodes(delta)` is called on `useGraphStore`  
**And** the graph right-column shows nodes entering 1-by-1 (Framer Motion)  
**And** the summary panel shows accepted/consolidated/etc. counts  
**And** the "Ingerir outro documento" link is available  

### Scenario 2 — Idempotency: already-ingested document

**Given** the user pastes content that was already ingested (same `content_hash`)  
**When** `ingestRawInformation` returns HTTP 200 with `outcome: "noop_existing"`  
**Then** the progress area shows the "Documento já ingerido" info notice  
**And** "Ver grafo existente" button is visible  
**When** the user clicks "Ver grafo existente"  
**Then** traverse calls fire for the returned `affected_nodes`  
**And** the graph reveals the existing subgraph  

### Scenario 3 — Connection drop recovery (polling)

**Given** `runLlmExtraction` POST was sent  
**When** the HTTP connection drops (client-side timeout)  
**Then** the UI does NOT show an error  
**And** the progress copy changes to "Verificando extração…"  
**And** polling via `getLlmRunById` starts at 5s interval  
**When** polling returns `status: "completed"`  
**Then** the graph assembly and reveal sequence starts (same as Scenario 1)  

### Scenario 4 — LLM provider failure with retry

**Given** `runLlmExtraction` returns 502 `SYSTEM_LLM_PROVIDER_UNAVAILABLE`  
**Then** an alert band appears: "O provedor de IA está indisponível."  
**And** "Tentar novamente" button is visible  
**When** the user clicks "Tentar novamente"  
**Then** `retryLlmRun` fires (transitions run back to `running`)  
**And** `runLlmExtraction` fires again  
**And** the UI transitions back to UI-05 (extraindo)  

### Scenario 5 — Node selection opens NodeDetailPanel

**Given** the user is in UI-07 (concluído) with a populated graph  
**When** the user clicks a node in the GraphSpace  
**Then** `NodeDetailPanel` replaces `GraphSpace` in the right column  
**And** the IngestPanel (left column) is unaffected  
**When** the user closes NodeDetailPanel  
**Then** GraphSpace is restored and the selected node's button receives focus  

### Scenario 6 — Accessibility: keyboard ingest flow

**Given** `/ingest` is mounted  
**When** the user focuses the dropzone via Tab and presses Enter  
**Then** the file picker opens (or the textarea receives focus if no file picker is supported)  
**When** the user pastes content into the textarea and tabs to the source type select  
**And** selects a type via keyboard (arrow keys + Enter)  
**And** tabs to "Ingerir" and presses Enter  
**Then** the form submits  
**And** all status updates are announced via `aria-live="polite"`  

---

## §10 Components to Create / Update

| Component Name | Action | Feature | Rationale |
|---|---|---|---|
| `IngestWorkspace` | create | ingest | Feature-local page component (40%/60% container-query split, mirrors `ChatWorkspace`); mounts `IngestPanel` left + `GraphSpace` right; swaps to `NodeDetailPanel` on node select |
| `IngestPanel` | create | ingest | Feature-local left-column: dropzone, textarea, source-type select, submit button, progress/summary area |
| `IngestDropzone` | create | ingest | Feature-local dropzone sub-component; handles drag-and-drop + file picker for .txt; emits `onContent(text)` + `onFile(name, size)` |
| `IngestSummary` | create | ingest | Feature-local summary display: shows `LlmRunSummary` counts as `StateBadge` rows; renders `needs_review` notice |
| `IngestProgressArea` | create | ingest | Feature-local `aria-live` region managing progress copy, spinner, error band, and summary reveal |
| `mapWireToGraphDelta` | update/extract | graph | **Extract** from `features/chat/api/` to `features/graph/api/mapWireToGraphDelta.ts`; both `/chat` and `/ingest` import from this shared graph utility — no cross-feature import |
| `useIngestRawInformation` | create | ingest | TanStack Mutation hook for `ingestRawInformation` (`features/ingest/api/useIngestRawInformation.ts`) |
| `useRunLlmExtraction` | create | ingest | TanStack Mutation hook for `runLlmExtraction` (`features/ingest/api/useRunLlmExtraction.ts`) |
| `useIngestRunStatus` | create | ingest | TanStack Query with `refetchInterval` for `getLlmRunById` polling; enabled only during polling mode (`features/ingest/api/useIngestRunStatus.ts`) |
| `useRetryLlmRun` | create | ingest | TanStack Mutation hook for `retryLlmRun` (`features/ingest/api/useRetryLlmRun.ts`) |
| `useIngestGraphAssembly` | create | ingest | Orchestrates `useQueries` for all `traverseNode` calls; merges results into `GraphDelta`; calls `useGraphStore.replaceNodes` (`features/ingest/api/useIngestGraphAssembly.ts`) |
| `GraphSpace` | update | graph | No prop change needed; `IngestWorkspace` consumes it directly. Update §1 "does" list to note it is also used by `/ingest` |
| `NodeDetailPanel` | update | graph | No prop change needed; `IngestWorkspace` consumes it directly via `onNodeSelect`. Update §1 to note dual usage |

> `IngestWorkspace` and `IngestPanel` are feature-local to `/ingest` (single-use); they do NOT qualify for a shared `component.spec.md`. `mapWireToGraphDelta` extraction is a code reorganization (no new component spec).

---

## §11 Out of Scope (v1)

The following are explicitly deferred from this wave:

- **PDF / binary extraction in the browser** — v1 accepts text pasted directly into the textarea, or a `.txt` file via the dropzone. Binary PDFs are not parsed client-side; the user must paste the text.
- **Streaming graph_delta via SSE during extraction** — the flow uses REST + polling only (Opção B, travada). No SSE frame is emitted by the BFF for the ingestion endpoint.
- **Batch ingestion (multiple documents)** — one document per session. "Ingerir outro" resets the form.
- **Inline curation / edição** — after extraction, the graph is read-only in this screen. Curation happens at `/curation`.
- **Cancellation of an in-progress run** — there is no cancel button; the run continues on the server even if the user navigates away.
- **Upload progress / chunked upload** — content is sent as a single JSON body field (no multipart, no streaming upload).
- **Extraction log / ToolCall audit trail** — the `listToolCallsByLlmRun` endpoint is not consumed by this screen; a future history wave may add it.
- **`as_of` time-travel on the resulting graph** — the traverse calls always use `as_of = now` (no time picker in this screen).
- **Metadata fields (title, author, document_date)** — the v1 form only captures `source_type` and `content`; metadata fields are out of scope.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-27 | Front Spec Agent | initial | New spec for `/ingest` — REST+polling flow (Opção B), 9 UI states, IngestPanel + GraphSpace reuse, WCAG 2.2 AA, BDD scenarios, `mapWireToGraphDelta` extraction note. | -- |
