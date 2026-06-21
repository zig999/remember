# Component Spec — NodeDetailPanel

> File: `frontend/src/features/graph/components/NodeDetailPanel.tsx`
> Version: 1.0.0 | Status: draft

> `NodeDetailPanel` is an inline detail view that renders inside the graph pane (the 60% right column
> of `ChatWorkspace`) when the user clicks a node in `GraphSpace`. It fetches node aliases and
> current attributes via `GET /api/v1/nodes/:id` (`getNodeById`) and displays them without
> leaving the pane or opening a modal.
>
> Normative source: `temp/chat-graphspace-plan.md` Rev. 2026-06-21 decisions D4 / I-3;
> `docs/specs/front/features/chat.feature.spec.md` UI-14.

---

## §1 Purpose and Responsibilities

**Does:**
- Receive a `nodeId` prop and fetch node detail via `useNodeDetail(nodeId)` (TanStack Query — `getNodeById`).
- Display node canonical name, type, status, aliases list, and current attributes table.
- Provide a close action (`onClose`) that returns to the graph canvas view.
- Show a loading state (spinner + node name if available from `GraphNodeData`) while the fetch is in flight.
- Show an error state when `getNodeById` fails (node not found, deleted, or network error).

**Does NOT:**
- Open a modal, drawer, or navigate to `/graph/:id` — it renders inline inside the graph pane.
- Affect the ChatSpace (left column) in any way — strictly view-only (REQ-6).
- Trigger any chat mutation or tool call.
- Allow editing of node data (read-only — v1 graph is read-only).
- Show provenance chains or link traversal (those are for the `/graph` full-screen explorer wave).

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
| Success | `useNodeDetail` resolves | Node type badge + canonical name + status badge + aliases list + attributes table + close button |
| Error (not found) | `getNodeById` returns 404 (`RESOURCE_NOT_FOUND`) | Inline notice "Nó não encontrado." + close button |
| Error (deleted) | `getNodeById` returns 410 (`BUSINESS_NODE_DELETED`) | Inline notice "Este nó foi removido por conformidade." + close button |
| Error (network / 5xx) | Network error or 5xx | Inline notice "Não foi possível carregar os detalhes. Tente novamente." + "Tentar novamente" button + close button |

---

## §4 Events Emitted

| Event | Payload | When emitted | Consumer action |
|---|---|---|---|
| `onClose` | none | User clicks the close button (×) | `ChatWorkspace` unmounts `NodeDetailPanel`; restores graph canvas view |

---

## §5 Variants and Compositions

| Variant | Context | Notes |
|---|---|---|
| Inline (default) | Inside `ChatWorkspace` right pane | Overlays or replaces `GraphSpace` — `ChatWorkspace` decides the layout (absolute overlay or column swap). No modal veil. |

> There is only one variant in v1. A future `/graph` wave may introduce a drawer or full-panel variant.

---

## §6 Do / Don't

| Do | Don't |
|---|---|
| Show `nodeLabel` from `GraphNodeData` immediately in the loading state (no wait for fetch) | Leave the loading skeleton blank — causes unnecessary perceived latency |
| Use `GlassSurface level="panel"` as the panel background | Use a bare `div` with inline styles for the panel surface |
| Show all current attributes in a table (`key | value | status`) | Try to show historical attributes or provenance chains (deferred to later wave) |
| Mount `NodeDetailPanel` as a direct child of `ChatWorkspace` (not inside `GraphSpace`) | Nest `NodeDetailPanel` inside `GraphSpace` — GraphSpace is a sink and must not own the panel lifecycle |
| Pass `onClose` and unmount cleanly — no leaked state | Leave the panel open when the user switches conversations (parent handles cleanup via `useEffect` watching `?conversation`) |
| Link aliases shown as a simple list (`ul`) | Use clickable alias items to trigger traversal — v1 is read-only |

---

## §7 BDD Scenarios

### Scenario 1 — Successful load shows aliases and attributes

**Given** `NodeDetailPanel` receives `nodeId="<uuid>"` and `nodeLabel="Rodrigo"`  
**When** `getNodeById` resolves with 2 aliases and 3 attributes  
**Then** the panel shows "Rodrigo" as the heading immediately  
**And** a type badge (e.g., `text-node-person`) and `StateBadge` for status  
**And** an aliases list with 2 entries  
**And** an attributes table with 3 rows (key, value, status)  
**And** a close button (×) in the top-right corner  

### Scenario 2 — Loading state uses prop label

**Given** `NodeDetailPanel` receives `nodeId="<uuid>"` and `nodeLabel="Apollo"`  
**When** the fetch is in flight (`isPending`)  
**Then** the panel shows "Apollo" as the heading immediately (no blank skeleton)  
**And** a spinner replaces the content area  
**And** the close button is still accessible  

### Scenario 3 — Error (not found)

**Given** `getNodeById` returns 404 `RESOURCE_NOT_FOUND`  
**Then** the panel shows "Nó não encontrado."  
**And** no attributes table or aliases list is shown  
**And** the close button is accessible  

### Scenario 4 — Keyboard navigation

**Given** `NodeDetailPanel` mounts  
**When** focus is moved to the panel (by `ChatWorkspace` on mount)  
**Then** the first interactive element (close button) receives focus  
**And** Tab moves through aliases list items and attribute rows  
**And** pressing `Escape` fires `onClose`  

### Scenario 5 — Close restores graph view

**Given** `NodeDetailPanel` is visible  
**When** the user clicks the × close button or presses `Escape`  
**Then** `onClose` fires  
**And** `ChatWorkspace` unmounts `NodeDetailPanel`  
**And** the graph canvas (`GraphSpace`) is visible again without data loss  

---

## §8 Accessibility Contract

| Requirement | Implementation |
|---|---|
| Panel role | `<section role="complementary" aria-label="Detalhes do nó: {nodeLabel}">` |
| Focus management on open | `ChatWorkspace` moves focus to the close button (`ref` on close button) when `NodeDetailPanel` mounts |
| Focus return on close | `ChatWorkspace` restores focus to the clicked node element in `GraphSpace` after unmount (`graphRef.current?.focusNode(nodeId)`) |
| Escape closes | `onKeyDown` listener on the panel (or document) for `Escape` → `onClose()` |
| Loading announced | `<span aria-live="polite">Carregando detalhes…</span>` inside the panel during fetch |
| Error announced | `role="alert"` on the error message element (immediate announcement without focus move) |
| Attributes table | `<table>` with `<th scope="col">` headers: "Atributo", "Valor", "Estado" |
| Aliases list | `<ul aria-label="Aliases">` |
| Status badge | `StateBadge` component (already accessible — see `StateBadge.component.spec.md`) |
| Contrast | Panel uses `GlassSurface level="panel"` — tokens.md §9.3 guarantees ≥ 4.5:1 for `text-content` |

---

## §9 Data Layer Notes

### `useNodeDetail` hook

Defined in `features/graph/api/useNodeDetail.ts`.

```ts
export function useNodeDetail(nodeId: string | undefined) {
  return useQuery({
    queryKey: graphNodeKeys.detail(nodeId ?? ""),
    queryFn: () => fetchNodeDetail(nodeId!),
    enabled: !!nodeId,
    staleTime: 5 * 60 * 1000,    // 5 min — node detail is stable data
    refetchOnWindowFocus: false,
  });
}
```

`fetchNodeDetail` calls `GET /api/v1/nodes/:id` (domain: knowledge-graph, operationId: `getNodeById`). Response shape: `NodeDetail` from `knowledge-graph/openapi.yaml` (node + aliases[] + attributes[]).

### Response transforms

The `NodeDetail` API response is used near-verbatim. Minor adaptations:
- `node.status` + the `StateBadge` state mapping: `active → accepted`, `needs_review → uncertain`, `merged → superseded` (node is merged, shown with notice), `deleted` → handled by 410 error path.
- Attributes are sorted: `in_effect` first, then by `key` alphabetically.
- `valid_from` / `valid_to` dates formatted as `DD/MM/YYYY` (pt-BR) using `Intl.DateTimeFormat`.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0 | 2026-06-21 | Front Spec Agent | initial | GraphSpace wave. Inline node detail panel mounted by `ChatWorkspace` inside the graph pane on node click. Fetches `getNodeById`; shows aliases + attributes; 5 states; 5 BDD scenarios; full a11y contract. |
