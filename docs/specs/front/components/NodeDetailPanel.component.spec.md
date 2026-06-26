# Component Spec — NodeDetailPanel

> File: `frontend/src/features/graph/components/NodeDetailPanel.tsx`
> Version: 2.0.0 | Status: draft

> `NodeDetailPanel` is an inline detail view that renders inside the graph pane (the 60% right column
> of `ChatWorkspace`) when the user clicks a node in `GraphSpace`. It fetches node aliases and
> current attributes via `GET /api/v1/nodes/:id` (`getNodeById`) and displays them without
> leaving the pane or opening a modal.
>
> **v2.0 (progressive-disclosure wave):** the panel now exposes the full knowledge chain
> of a node through three phases of progressive disclosure:
> (A) attribute provenance inline — `attribute.provenance[]` already returned by `getNodeById`, shown
>     under each attribute via a `<details>` disclosure;
> (B) relationships section — `useNodeRelationships(nodeId)` via `traverseNode depth=1`;
> (C) full provenance lazy — per-link / per-attribute `useProvenance(kind, id)` via the
>     query-retrieval provenance endpoints, triggered only when expanded.
>
> Normative source: `temp/chat-graphspace-plan.md` Rev. 2026-06-21 decisions D4 / I-3;
> `docs/specs/front/features/chat.feature.spec.md` UI-14.

---

## §1 Purpose and Responsibilities

**Does:**
- Receive a `nodeId` prop and fetch node detail via `useNodeDetail(nodeId)` (TanStack Query — `getNodeById`).
- Display node canonical name, type, status, aliases list, and current attributes table.
- Under each attribute: render a `<details>` disclosure "Proveniência" that shows the inline
  `provenance[]` entries already present in the `getNodeById` response (Phase A — zero extra fetch).
- Render a "Relações" section below attributes using `useNodeRelationships(nodeId)` that calls
  `traverseNode?depth=1`; for each `KnowledgeLink` show type, neighbor, direction (←/→),
  confidence, temporal state, and an inline provenance disclosure (Phase B).
- Under each relationship link: render a lazy "Ver origem completa" `<details>` that calls
  `useProvenance('links', linkId)` only when expanded, displaying `RawChunk` + `RawInformation`
  detail (Phase C).
- Under each attribute: render a lazy "Ver origem completa" `<details>` that calls
  `useProvenance('attributes', attributeId)` only when expanded (Phase C).
- Provide a close action (`onClose`) that returns to the graph canvas view.
- Show a loading state while the primary fetch is in flight.
- Show an error state when `getNodeById` fails.

**Does NOT:**
- Open a modal, drawer, or navigate to `/graph/:id` — it renders inline inside the graph pane (AC-F.20 / I-3).
- Affect the ChatSpace (left column) in any way — strictly view-only (REQ-6 unidirectionality).
- Import anything from `@/features/chat` — there is a structural test that enforces this.
- Trigger any chat mutation or tool call.
- Allow editing of node data (read-only — graph is read-only).
- Show historical attribute versions or lineage chains (those use the `history` endpoints — deferred).
- Paginate relationships (depth=1 traversal is bounded by the graph size — no UI pagination control).

---

## §2 Props Contract

| Prop Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `nodeId` | `string` | yes | — | UUID of the `KnowledgeNode` to load via `getNodeById`. |
| `nodeLabel` | `string \| undefined` | no | `undefined` | Canonical name already known from `GraphNodeData` — displayed immediately in the loading skeleton to reduce perceived latency. |
| `onClose` | `() => void` | yes | — | Callback fired when the user dismisses the panel; parent unmounts the component and restores the graph canvas view. |
| `className` | `string` | no | `""` | Additional Tailwind classes merged via `cn()`. |

---

## §3 Component States

| State | Entry condition | UI |
|---|---|---|
| Loading | `useNodeDetail` is `isPending` | Spinner + node label (from `nodeLabel` prop if available, else skeleton line) + close button |
| Success — base | `useNodeDetail` resolves | Node type badge + canonical name + status badge + aliases list + attributes table with inline provenance disclosures (Phase A) + "Relações" section (Phase B) + per-item lazy provenance (Phase C) + close button |
| Success — relationships loading | `useNodeRelationships` is `isPending` after `useNodeDetail` resolved | Base content + "Relações" section shows a spinner skeleton |
| Success — relationships error | `traverseNode` returns a non-404 error | "Relações" section shows an inline notice "Não foi possível carregar as relações." with a retry button |
| Success — relationships empty | `traverseNode` returns `links: []` | "Relações" section shows the copy "Nenhuma relação encontrada." |
| Success — lazy provenance loading | `useProvenance` is `isPending` after user expands "Ver origem completa" | Disclosure body shows a spinner skeleton |
| Success — lazy provenance error | `getProvenanceBy{Link\|Attribute}` returns an error | Disclosure body shows "Não foi possível carregar a origem. " + retry button |
| Success — lazy provenance tombstoned | `getProvenanceBy{Link\|Attribute}` returns 410 `BUSINESS_RAW_INFORMATION_DELETED` | Disclosure body shows "Documento original removido por conformidade." |
| Error (not found) | `getNodeById` returns 404 (`RESOURCE_NOT_FOUND`) | Inline notice "Nó não encontrado." + close button |
| Error (deleted) | `getNodeById` returns 410 (`BUSINESS_NODE_DELETED`) | Inline notice "Este nó foi removido por conformidade." + close button |
| Error (network / 5xx) | Network error or 5xx | Inline notice "Não foi possível carregar os detalhes. Tente novamente." + "Tentar novamente" button + close button |

---

## §4 Events Emitted

| Event | Payload | When emitted | Consumer action |
|---|---|---|---|
| `onClose` | none | User clicks the close button (×) or presses Escape | `ChatWorkspace` unmounts `NodeDetailPanel`; restores graph canvas view |

---

## §5 Variants and Compositions

| Variant | Context | Notes |
|---|---|---|
| Inline (default) | Inside `ChatWorkspace` right pane | Overlays or replaces `GraphSpace` — `ChatWorkspace` decides the layout. No modal veil. |

> There is only one variant. A future `/graph` wave may introduce a drawer or full-panel variant.

---

## §6 Do / Don't

| Do | Don't |
|---|---|
| Show `nodeLabel` from `GraphNodeData` immediately in the loading state | Leave the loading skeleton blank — causes unnecessary perceived latency |
| Use `GlassSurface level="panel"` as the panel background | Use a bare `div` with inline styles for the panel surface |
| Render Phase A provenance (`attribute.provenance[]`) from the `getNodeById` response — no extra fetch | Re-fetch attribute provenance from an endpoint when it is already in the response payload |
| Use `<details>` + `<summary>` for the provenance disclosures; add `aria-expanded` via `open` attribute sync if needed | Use custom accordion state — native `<details>` is simpler and WCAG-compliant |
| Call `useProvenance(kind, id)` only when the disclosure is opened (`enabled: isOpen`) | Pre-fetch all lazy provenances on mount — defeats the purpose of lazy disclosure |
| Show relationships using `useNodeRelationships(nodeId)` which calls `traverseNode?depth=1&direction=both` | Call `traverseNode` more than once per panel mount for the same `nodeId` |
| Mount `NodeDetailPanel` as a direct child of `ChatWorkspace` (not inside `GraphSpace`) | Nest `NodeDetailPanel` inside `GraphSpace` — GraphSpace is a sink and must not own the panel lifecycle |
| Pass `onClose` and unmount cleanly — no leaked state | Leave the panel open when the user switches conversations |
| Split implementation into sub-files (e.g., `NodeAttributeRow.tsx`, `NodeRelationshipRow.tsx`, `NodeProvenanceChain.tsx`) if the main file approaches 300 lines | Put all disclosure logic in a single 400-line file |
| Show direction arrow (← source node / → target node) per link based on `source_node_id === nodeId` | Show direction without indicating which role the current node plays |
| Format `confidence` as a percentage with 0 decimal places (e.g., "92%") | Show raw float (0.92) without formatting |
| Format dates (`valid_from`, `valid_to`, `received_at`) in pt-BR via `Intl.DateTimeFormat` | Render ISO dates verbatim |

---

## §7 BDD Scenarios

### Scenario 1 — Successful load shows aliases, attributes, and inline provenance (Phase A)

**Given** `NodeDetailPanel` receives `nodeId="<uuid>"` and `nodeLabel="Rodrigo"`
**When** `getNodeById` resolves with 2 aliases, 3 attributes (each with `provenance: [{fragment_text, confidence, source_type, received_at}]`)
**Then** the panel shows "Rodrigo" as the heading immediately
**And** a type badge and `StateBadge` for status
**And** an aliases list with 2 entries
**And** an attributes table with 3 rows
**And** each row has a collapsed `<details>` labeled "Proveniência"
**When** the user expands a provenance disclosure
**Then** the disclosure body shows `fragment_text`, confidence as percentage, `source_type`, and `received_at` formatted as pt-BR date
**And** no extra network request is made (data was in `getNodeById` response)

### Scenario 2 — Relationships section (Phase B)

**Given** `useNodeDetail` resolved for a node
**When** `useNodeRelationships(nodeId)` resolves with 2 links
**Then** the "Relações" section renders 2 rows
**And** each row shows: link type, neighbor canonical name, direction arrow (← / →), confidence, and `effective_status` badge
**And** each row has a collapsed "Proveniência" disclosure showing the inline `link.provenance[]` (no extra fetch)
**And** each row has a collapsed "Ver origem completa" disclosure in a closed state

### Scenario 3 — Lazy provenance fetch (Phase C)

**Given** the "Ver origem completa" disclosure on a relationship row is closed
**When** the user expands "Ver origem completa"
**Then** `useProvenance('links', linkId)` fires with `enabled: true`
**And** while loading, the disclosure body shows a spinner skeleton
**When** the fetch resolves
**Then** the disclosure body shows `chunk_index`, `offset_start`–`offset_end`, `excerpt`, and `RawInformation` metadata (`source_type`, `received_at`, `metadata.title`, `metadata.document_date` if present)
**And** closing and reopening the disclosure does NOT re-fetch (TanStack Query cache, staleTime: 5 min)

### Scenario 4 — Tombstoned provenance (Phase C)

**Given** the "Ver origem completa" disclosure on a relationship row is opened
**When** `getProvenanceByLink` returns 410 `BUSINESS_RAW_INFORMATION_DELETED`
**Then** the disclosure body shows "Documento original removido por conformidade."
**And** no retry button is shown (tombstone is permanent)

### Scenario 5 — Loading state uses prop label

**Given** `NodeDetailPanel` receives `nodeId="<uuid>"` and `nodeLabel="Apollo"`
**When** the primary fetch is in flight (`isPending`)
**Then** the panel shows "Apollo" as the heading immediately (no blank skeleton)
**And** a spinner replaces the content area
**And** the close button is still accessible

### Scenario 6 — Error (not found)

**Given** `getNodeById` returns 404 `RESOURCE_NOT_FOUND`
**Then** the panel shows "Nó não encontrado."
**And** no attributes table, aliases list, or relationships section is shown
**And** the close button is accessible

### Scenario 7 — Keyboard navigation

**Given** `NodeDetailPanel` mounts
**When** focus is moved to the panel
**Then** the first interactive element (close button) receives focus
**And** Tab moves through the panel: aliases list → attributes rows → each attribute's disclosure summary → attribute's "Ver origem completa" summary → relationships rows → each relationship's disclosures
**And** pressing `Escape` fires `onClose`
**And** pressing `Enter` or `Space` on a `<summary>` toggles the `<details>` disclosure

### Scenario 8 — REQ-6 structural isolation

**Given** the project test suite includes a structural import test
**When** the test scans `features/graph/` imports
**Then** no file imports from `@/features/chat`
**And** `NodeDetailPanel` and its sub-components are confined to `features/graph/`

---

## §8 Accessibility Contract

| Requirement | Implementation |
|---|---|
| Panel role | `<section role="complementary" aria-label="Detalhes do nó: {nodeLabel}">` |
| Focus management on open | `ChatWorkspace` moves focus to the close button when `NodeDetailPanel` mounts |
| Focus return on close | `ChatWorkspace` restores focus to the clicked node element in `GraphSpace` after unmount |
| Escape closes | `onKeyDown` listener on the panel (or document) for `Escape` → `onClose()` |
| Loading announced | `<span aria-live="polite">Carregando detalhes…</span>` during fetch |
| Error announced | `role="alert"` on the error message element |
| Attributes table | `<table>` with `<th scope="col">` headers: "Atributo", "Valor", "Estado" |
| Provenance disclosures (Phase A) | Native `<details>`/`<summary>` — keyboard accessible by default. `<summary>` text: "Proveniência ({n} entrada)" where n = provenance entry count |
| Relationships section | `<section aria-label="Relações">` wrapping the list; each row is a `<li>` with readable text |
| Relationship provenance disclosures (Phase B inline) | Native `<details>`/`<summary>`; `<summary>` text: "Proveniência do link ({n} entrada)" |
| Lazy provenance disclosures (Phase C) | Native `<details>`/`<summary>`; `<summary>` text: "Ver origem completa". When loading, `aria-busy="true"` on the disclosure body. When error, `role="alert"` on the error notice. |
| Relationships loading | `aria-busy="true"` on the relationships section while `useNodeRelationships` is pending |
| Aliases list | `<ul aria-label="Aliases">` |
| Status badge | `StateBadge` component (see `StateBadge.component.spec.md`) |
| Contrast | Panel uses `GlassSurface level="panel"` — tokens.md §9.3 guarantees ≥ 4.5:1 for `text-content` |
| Scrolling | Body of the panel (`overflow-y: auto`) scrolls within the panel — the chat workspace layout does not shift |
| Target size | All `<summary>` elements and close button: `min-h-8` (32 px project floor) |
| Direction indicator | Direction arrows (← / →) accompanied by visually hidden text: `<span class="sr-only">direção: origem</span>` / `<span class="sr-only">direção: destino</span>` |

---

## §9 Data Layer Notes

### Primary hook: `useNodeDetail`

Defined in `features/graph/api/useNodeDetail.ts`.

```ts
export function useNodeDetail(id: string | null | undefined): UseQueryResult<NodeDetailView> {
  return useQuery({
    queryKey: graphNodeKeys.detail(id ?? "__noop__"),
    queryFn: async () => {
      const wire = await http<NodeDetailWire>(
        `/api/v1/nodes/${encodeURIComponent(id as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toNodeDetail(wire);
    },
    enabled: typeof id === "string" && id.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
```

**Wire response shape:** `{ ok: true, result: NodeDetail }` — `http<T>()` unwraps to `NodeDetail`. Each `attribute` in `result.attributes` carries `provenance: ProvenanceEntry[]` which Phase A renders inline without any extra fetch.

### Phase B hook: `useNodeRelationships`

New hook defined in `features/graph/api/useNodeRelationships.ts`.

```ts
export function useNodeRelationships(id: string | null | undefined) {
  return useQuery({
    queryKey: graphNodeKeys.relationships(id ?? "__noop__"),
    queryFn: async () => {
      const wire = await http<TraversalResultWire>(
        `/api/v1/nodes/${encodeURIComponent(id as string)}/traverse?depth=1&direction=both`,
        { method: "GET", headers: authHeader() },
      );
      return toTraversalResult(wire);
    },
    enabled: typeof id === "string" && id.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
```

Each `TraversalLink` in `result.links` carries `provenance: ProvenanceEntry[]` (same shape as attributes) used for the inline Phase B disclosure. Direction is derived: `link.source_node_id === nodeId` → "→" (outgoing); otherwise "←" (incoming).

### Phase C hook: `useProvenance`

New hook defined in `features/graph/api/useProvenance.ts`.

```ts
type ProvenanceKind = 'links' | 'attributes' | 'fragments';

export function useProvenance(kind: ProvenanceKind, id: string, enabled: boolean) {
  return useQuery({
    queryKey: graphNodeKeys.provenance(kind, id),
    queryFn: async () => {
      const wire = await http<ProvenanceResponseWire>(
        `/api/v1/provenance/${kind}/${encodeURIComponent(id)}`,
        { method: "GET", headers: authHeader() },
      );
      return toProvenanceResponse(wire);
    },
    enabled: enabled && id.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
```

`enabled` is `true` only when the user has opened the "Ver origem completa" `<details>`. The hook is called unconditionally in the component body; the `enabled` gate prevents the fetch until needed.

### Response transforms

| Operation | Transform |
|---|---|
| Phase A — `attribute.provenance[].received_at` | Format as `DD/MM/YYYY` via `Intl.DateTimeFormat('pt-BR')` |
| Phase A — `attribute.provenance[].confidence` | Multiply by 100, round to 0 decimals, append "%" |
| Phase B — link direction | `link.source_node_id === nodeId` → "→" (outgoing, label from `link.link_type`); else "←" (incoming, label from `link.link_inverse_name`) |
| Phase B — neighbor canonical name | Look up `nodeId` in `result.nodes` (from `TraversalResult`) by `source_node_id` or `target_node_id` depending on direction |
| Phase C — `raw_information.received_at` | Format as `DD/MM/YYYY HH:mm` via `Intl.DateTimeFormat('pt-BR', {dateStyle:'short', timeStyle:'short'})` |
| Phase C — `chunk.offset_start`/`offset_end` | Display as "chars {start}–{end}" |
| Attribute row sort | `in_effect` first, then alphabetical by `key` (same rule as v1.1.0) |

### Query key factory additions

`graphNodeKeys` in `features/graph/api/keys.ts` must add:

```ts
relationships: (id: string) => ["graph", "node", id, "relationships"] as const,
provenance: (kind: string, id: string) => ["graph", "provenance", kind, id] as const,
```

### Consumed endpoints (cross-domain summary)

| Domain | operationId | Phase | When called |
|---|---|---|---|
| knowledge-graph | `getNodeById` | primary | On `nodeId` prop change |
| knowledge-graph | `traverseNode` | B | After primary fetch resolves, parallel to rendering |
| query-retrieval | `getProvenanceByLink` | C | Only when user opens "Ver origem completa" on a link row |
| query-retrieval | `getProvenanceByAttribute` | C | Only when user opens "Ver origem completa" on an attribute row |

---

## §10 API Error → UI Mapping (NodeDetailPanel scope)

| error.code | HTTP | Phase | Display | User action |
|---|---|---|---|---|
| `RESOURCE_NOT_FOUND` | 404 | Primary | "Nó não encontrado." | Close button only |
| `BUSINESS_NODE_DELETED` | 410 | Primary | "Este nó foi removido por conformidade." | Close button only |
| `SYSTEM_INTERNAL_ERROR` | 500 | Primary | "Não foi possível carregar os detalhes. Tente novamente." | "Tentar novamente" button + close button |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | Primary | Same as 500 | Same |
| `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` | 401 | Any | Delegate to global auth handler (`front.md §5`) — panel unmounts | Global redirect to sign-in |
| `RESOURCE_NOT_FOUND` | 404 | B (traversal) | Inline in "Relações" section: "Relações não encontradas." | Retry button |
| `SYSTEM_INTERNAL_ERROR` / `SYSTEM_SERVICE_UNAVAILABLE` | 500/503 | B (traversal) | Inline in "Relações" section: "Não foi possível carregar as relações." | Retry button |
| `RESOURCE_NOT_FOUND` | 404 | C (lazy provenance) | Inline in disclosure: "Origem não encontrada." | Retry button |
| `BUSINESS_RAW_INFORMATION_DELETED` | 410 | C (lazy provenance) | Inline in disclosure: "Documento original removido por conformidade." | None (permanent) |
| `SYSTEM_INTERNAL_ERROR` / `SYSTEM_SERVICE_UNAVAILABLE` | 500/503 | C (lazy provenance) | Inline in disclosure: "Não foi possível carregar a origem." | Retry button |

---

## §11 File Size Constraint

Each file in `features/graph/components/NodeDetailPanel/` must remain under 300 lines. Suggested split:

| File | Responsibility |
|---|---|
| `NodeDetailPanel.tsx` | Main panel shell: header, aliases, orchestration of sub-sections |
| `NodeAttributeRow.tsx` | Single attribute row + Phase A disclosure + Phase C lazy disclosure |
| `NodeRelationshipRow.tsx` | Single relationship row + Phase B inline provenance + Phase C lazy disclosure |
| `NodeProvenanceChain.tsx` | Reusable component for rendering a `ProvenanceResponse` (Phase C result) |
| `index.ts` | Re-exports `NodeDetailPanel` only |

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 2.0.0 | 2026-06-26 | Front Spec Agent | spec-change | Progressive-disclosure wave. §1 updated: removed "Does NOT show provenance / link traversal" clause — replaced with full Phase A/B/C scope. §3 updated: 6 new states (relationships loading/error/empty, lazy provenance loading/error/tombstoned). §7 updated: 8 BDD scenarios (3 new: Phase B, Phase C happy path, Phase C tombstoned, REQ-6 structural isolation). §8 updated: provenance and relationships a11y contracts. §9 updated: 2 new hooks (useNodeRelationships / useProvenance), 2 new query key entries, response transforms for direction/provenance. §10 added: API error → UI mapping table covering all 3 phases. §11 added: file-size constraint and suggested split. Consumed endpoints now span both knowledge-graph and query-retrieval domains. |
| 1.1.0 | 2026-06-22 | Front Spec Agent | spec-change | §9 updated: `useNodeDetail` code snippet aligned with actual implementation (direct `http<NodeDetailWire>()` call, no `fetchNodeDetail` wrapper). Documented that the BFF now returns `{ ok: true, result: NodeDetail }` on success (BR-27) and that `http()` unwraps the envelope — no `envelope:false` workaround. |
| 1.0.0 | 2026-06-21 | Front Spec Agent | initial | GraphSpace wave. Inline node detail panel mounted by `ChatWorkspace` inside the graph pane on node click. Fetches `getNodeById`; shows aliases + attributes; 5 states; 5 BDD scenarios; full a11y contract. |
