---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/curation/components/BatchBar/BatchBar.tsx
  - src/features/curation/components/BatchBar/index.ts
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
  - src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
  - src/features/curation/components/CurationDrawer/index.ts
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
  - src/features/curation/components/MetricsStrip/index.ts
  - src/features/curation/components/StaleBanner/StaleBanner.tsx
  - src/features/curation/components/StaleBanner/index.ts
  - src/features/curation/components/UndoToast/UndoToast.tsx
  - src/features/curation/components/UndoToast/index.ts
read_outside_area:
  - "src/features/curation/types.ts, to read the curation metrics and review queue item shapes the strip and the drawer consume"
  - "src/features/curation/state/curation-store.ts, to read the kinds the drawer accepts (SelectedItemKind)"
  - "src/features/curation/components/DecisionPanel/StaleBanner.tsx, to compare its message with the area's stale banner"
  - "src/features/curation/hooks/useDecisionDispatch.tsx (grep only), to see where the undo window constant is consumed"
  - "frontend/src (grep only, tests excluded), to find which files mount the batch bar, the drawer, the metrics strip and the stale banner"
---

## Facts
### Batch bar
- The batch bar shows nothing when fewer than 2 items are selected. `src/features/curation/components/BatchBar/BatchBar.tsx` (`if (count < 2) return null`).
- The batch bar handles one selection of a single kind at a time: it takes one count and one kind, either entity match, disputed or uncertain. `src/features/curation/components/BatchBar/BatchBar.tsx` (`BatchBarProps.kind`, `BatchKind`).
- The batch bar shows how many items are selected as "N selecionados". `src/features/curation/components/BatchBar/BatchBar.tsx` (`{count} selecionados`).
- The batch bar offers a clear-selection control that hands the clearing to its caller. `src/features/curation/components/BatchBar/BatchBar.tsx` (`onClear`, `aria-label="Limpar seleção"`).
- For a selection of entity-match items, the batch bar offers one action: keep separate, labelled "Manter separados N". `src/features/curation/components/BatchBar/BatchBar.tsx` (`showKeepSeparate`, `onKeepSeparate`).
- For a selection of uncertain items, the batch bar offers two actions: confirm, labelled "Confirmar N", and reject, labelled "Rejeitar N". `src/features/curation/components/BatchBar/BatchBar.tsx` (`showConfirm`, `showReject`).
- For a selection of disputed items, the batch bar offers no action and shows the note "Disputas devem ser resolvidas individualmente.". `src/features/curation/components/BatchBar/BatchBar.tsx` (`isDisputed`, `disputedTooltip`).
- Rejecting a batch of 5 or more items does not act right away. It replaces the action row with the inline confirmation "Você está rejeitando N itens. Confirmar?", with "Confirmar" and "Cancelar", and no modal. `src/features/curation/components/BatchBar/BatchBar.tsx` (`BATCH_REJECT_CONFIRM_THRESHOLD = 5`, `handleRejectClick`, `pendingReject`).
  - The threshold is exported for callers. `src/features/curation/components/BatchBar/index.ts` (`BATCH_REJECT_CONFIRM_THRESHOLD`).
- Rejecting a batch of fewer than 5 items acts at once, with no confirmation. `src/features/curation/components/BatchBar/BatchBar.tsx` (`handleRejectClick`).
- Pressing "Confirmar" on the inline confirmation carries out the batch rejection. Pressing "Cancelar" brings back the action row and does nothing. `src/features/curation/components/BatchBar/BatchBar.tsx` (`handleConfirmReject`, `handleCancelReject`).
- The pending batch-rejection confirmation is component state. Nothing resets it when the selection count or kind changes. `src/features/curation/components/BatchBar/BatchBar.tsx` (`useState(false)`, only set in the reject handlers).
- While a batch action is being submitted, every action button and the inline "Confirmar" show as busy. "Cancelar" and clear-selection do not. `src/features/curation/components/BatchBar/BatchBar.tsx` (`loading={submitting}`).

### Curation drawer
- The curation drawer is an overlay titled "Curadoria" that holds one review queue item, either an entity match or a dispute. It is identified by kind and id. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`CurationDrawer`), `src/features/curation/components/CurationDrawer/CurationDrawer.types.ts` (`CurationDrawerProps.kind`, `itemId`).
- Whether the drawer is open belongs to the screen that opens it. The drawer calls back to close on Esc, on the close button "Fechar curadoria", on a click on the backdrop, and when a decision removes its item. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`DialogPrimitive.Root onOpenChange`, `DialogPrimitive.Close`, `onItemRemove: forceClose`), `src/features/curation/components/CurationDrawer/CurationDrawer.types.ts` (`onOpenChange`).
- Under its title the drawer shows the caller's label for the item, when that label is not empty. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`itemLabel.length > 0`, `DialogPrimitive.Description`).
- The drawer reads the review queue only while it is open. A closed drawer makes no request. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`open ? <DrawerBody …/> : null`, `useListReviewQueue()`).
- The drawer finds its item in the review queue listing, called with no arguments. It finds an entity-match item when the item's node id equals the given id. It finds a dispute when any of the dispute's sides carries the given id. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`findDrawerItem`).
- While the queue is loading, the drawer shows "Carregando item de curadoria…". `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`queueQuery.isPending`).
- The drawer never changes the URL. Its only way out is the link "Abrir na fila de curadoria", which goes to `/curation` with the search parameter `item=<kind>:<id>` and closes the drawer. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`DrawerInlineError`, `Link to="/curation" search={{ item: escapeItemParam }}`).
- The drawer shows the decision panel for its item, with the dispatcher's server error, stale signal and submitting state. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`DrawerPanel`, `DecisionPanel serverError stale submitting`).
- The drawer has no next item: once a decision removes its item, it closes and moves to nothing else. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`getNextItem: () => null`, `onItemRemove`).
- When a pending destructive decision is undone, the drawer stays open on the same item. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`onItemRestore` no-op).
- In the drawer, decisions on an entity match are enabled at once, with no provenance trail shown. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`provenanceContextOf` returns `null` for `entity_match`, `armedImmediately`).
- In the drawer, decisions on a dispute stay disabled until the provenance trail reports that its evidence was viewed. The trail is mounted for the dispute's item kind and the id of its first side. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`provenanceContextOf`, `ProvenanceTrail onEvidenceViewed`, `effectiveEvidenceViewed`).
- The drawer reads and sets the same evidence-viewed flag as the curation page's shared store. It has no flag of its own. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`useCurationStore((s) => s.evidenceViewed)`, `setEvidenceViewed`).
- Merging an entity match (decision `merge_into`) is destructive and goes through the undo toast with the label "Item fundido". Any other entity-match decision is sent as non-destructive (keep). `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`onResolveEntityMatch`, `isDestructive`).
- Preferring one side of a dispute (`prefer_one`) is destructive and goes through the undo toast with the label "Lado preferido". Its undo target is the first id in `item_ids`, or else the first side's id. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`onResolveDispute`, `optimisticId`).
- Keeping a dispute open (`keep_disputed`) is sent as non-destructive. So is any other dispute decision, which is treated as adjusting periods. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`onResolveDispute` else branch `resolve_dispute_adjust`).
- Confirming an item and correcting an item are sent as non-destructive. Rejecting an item is destructive and goes through the undo toast with the label "Item rejeitado", with `item_id` as its target. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`onConfirm`, `onCorrect`, `onReject`).

### Metrics strip
- The metrics strip shows five curation metrics in this order: acceptance rate "Aceitação", needs-review count "Em revisão", uncertain count "Incertos", disputed count "Disputados", and entity-match queue count "Fila entidades". The acceptance rate is shown first and emphasised, and the four counts below it. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`buildCells`, `[lead, ...counts]`).
- The acceptance rate is a fraction from 0 to 1, shown as a percentage rounded to the nearest whole number with a "%" sign. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`formatPercent`).
- The strip does not show the reject rate by code or the time the metrics were computed. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`buildCells` reads only `acceptRate`, `needsReviewCount`, `uncertainCount`, `disputedCount`, `entityMatchQueueCount`).
- When the metrics read fails and queue totals are supplied, the strip falls back. It shows "—" for "Aceitação", "Em revisão" and "Incertos", the disputed queue total under "Disputados", and the entity-match queue total under "Fila entidades". `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`hasError && fallback`, `MetricsStripFallback`).
- A failed metrics read never makes the strip fail. With no fallback supplied, it keeps showing its loading placeholders. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`buildCells` returns `[]`, `skeleton = !settled || cells.length === 0`).
- Until the metrics read has settled, either resolved or failed, the strip shows loading placeholders labelled "Carregando métrica" and marks itself busy. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`settled`, `aria-busy`, `aria-label="Carregando métrica"`).

### Stale banner
- The stale banner tells the owner "Este item mudou desde que você o abriu." by default, and the caller can replace that message. `src/features/curation/components/StaleBanner/StaleBanner.tsx` (`DEFAULT_MESSAGE`, `message`).
- The stale banner is an alert that does not block, with a "Recarregar" action that hands the reload to its caller. The banner itself does not decide when to appear. `src/features/curation/components/StaleBanner/StaleBanner.tsx` (`role="alert"`, `onReload`).

### Undo toast
- A destructive curation decision can be undone for 5 seconds. `src/features/curation/components/UndoToast/UndoToast.tsx` (`UNDO_WINDOW_MS = 5_000`), `src/features/curation/components/UndoToast/index.ts` (`UNDO_WINDOW_MS`).
- The undo toast shows the caption of the action, e.g. "Item fundido", and the whole seconds left as "Ns". The seconds are rounded up from the deadline and never go below 0. They are announced as "Tempo restante para desfazer: N segundos". `src/features/curation/components/UndoToast/UndoToast.tsx` (`secondsRemaining`, `label`, `aria-label`).
- The undo toast's "Desfazer" action only reports the undo to its caller. The toast neither dismisses itself nor commits the action. `src/features/curation/components/UndoToast/UndoToast.tsx` (`onUndo`).

## Answers
- Curation drawer — the review queue read fails → inline alert "Não foi possível carregar a evidência." with the link "Abrir na fila de curadoria". `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`queueQuery.isError`, `DrawerInlineError`).
- Curation drawer — the item is not in the review queue listing → inline alert "Este item não está mais disponível na fila." with the link "Abrir na fila de curadoria". `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`item === null`, `DrawerInlineError`).
- Curation drawer, order of checks — loading is checked first, then a read failure, then the item missing; only after that is the decision panel shown. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`DrawerBody` branch order).
- Batch bar — the selection is of disputed items → no batch action, note "Disputas devem ser resolvidas individualmente.". `src/features/curation/components/BatchBar/BatchBar.tsx` (`isDisputed`).
- Batch bar — a rejection of 5 or more items → asks first, "Você está rejeitando N itens. Confirmar?". `src/features/curation/components/BatchBar/BatchBar.tsx` (`handleRejectClick`).
- Metrics strip — the metrics read fails → no error shown; the three rates show "—" and the counts come from the queue totals, or the loading placeholders stay when no totals are supplied. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`buildCells`).

## Vocabularies
- Batch selection kind: `entity_match`, `disputed`, `uncertain`. `src/features/curation/components/BatchBar/BatchBar.tsx` (`BatchKind`), `src/features/curation/components/BatchBar/index.ts` (`BatchKind`).
- Batch actions per kind: `entity_match` → "Manter separados N"; `uncertain` → "Confirmar N", "Rejeitar N"; `disputed` → none. `src/features/curation/components/BatchBar/BatchBar.tsx` (`showKeepSeparate`, `showConfirm`, `showReject`).
- Labels of the metrics strip: "Aceitação", "Em revisão", "Incertos", "Disputados", "Fila entidades". `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`buildCells`).
- Drawer decisions and how they are dispatched: `resolve_entity_match_merge` (destructive, "Item fundido"), `resolve_entity_match_keep` (non-destructive), `resolve_dispute_prefer` (destructive, "Lado preferido"), `resolve_dispute_keep` (non-destructive), `resolve_dispute_adjust` (non-destructive), `confirm_item` (non-destructive), `reject_item` (destructive, "Item rejeitado"), `correct_item` (non-destructive). `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`DrawerPanel` `actions`).
- Dispute decisions the drawer tells apart: `prefer_one`, `keep_disputed`, and anything else, treated as adjusting periods. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`onResolveDispute`).
- Entity-match decision the drawer treats as destructive: `merge_into`. Every other value is treated as keep. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`isDestructive`).

## Upstream artifacts
- The curation metrics the backend publishes are read as acceptance rate, needs-review count, uncertain count, disputed count, entity-match queue count, reject rate by code, and computed-at. The strip shows the first five. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`CurationMetrics`, `buildCells`).
- The review queue listing is read without arguments. Entity-match entries are matched by `nodeId`. Dispute entries carry `itemKind` and `sides`, each side with an `itemId`. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`useListReviewQueue`, `findDrawerItem`, `provenanceContextOf`).
- Decision request bodies carry `decision`, and for disputes `item_ids`. Confirm, reject and correct bodies carry `item_id`. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`body.decision`, `body.item_ids`, `body.item_id`).
- Route `/curation` with the search parameter `item` in the form `<kind>:<id>`. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`Link to="/curation"`).

## Outside the domain
- Radix Dialog wiring (portal, overlay, focus trap), GlassSurface levels, z-index layers, slide and overlay animations, the right-anchored width — presentation. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx`.
- `data-testid` attributes and ARIA roles of the drawer, the bar and the strip — test hooks and accessibility wiring. `src/features/curation/components/CurationDrawer/CurationDrawer.tsx`.
- Re-exports of the barrel files — module wiring. `src/features/curation/components/CurationDrawer/index.ts`.
- Re-exports of the barrel files — module wiring. `src/features/curation/components/BatchBar/index.ts`.
- Re-exports of the barrel files — module wiring. `src/features/curation/components/MetricsStrip/index.ts`.
- Re-exports of the barrel files — module wiring. `src/features/curation/components/StaleBanner/index.ts`.
- The 100 ms refresh of the countdown — rendering. `src/features/curation/components/UndoToast/UndoToast.tsx`.
- The two-column grid and the number of placeholder cells in the strip — layout. `src/features/curation/components/MetricsStrip/MetricsStrip.tsx`.
- Button variants, icons, the sticky placement, and the warning background of the banner — surface. `src/features/curation/components/BatchBar/BatchBar.tsx`, `src/features/curation/components/StaleBanner/StaleBanner.tsx`.
- Pure control labels: "Confirmar", "Cancelar", "Recarregar", "Desfazer", "Limpar seleção", "Fechar curadoria", "Ações em lote", "Métricas de curadoria" — surface. `src/features/curation/components/BatchBar/BatchBar.tsx`, `src/features/curation/components/CurationDrawer/CurationDrawer.tsx`, `src/features/curation/components/MetricsStrip/MetricsStrip.tsx`, `src/features/curation/components/UndoToast/UndoToast.tsx`.

## Observed and not decided here
- The live strip and the fallback strip show different measures under the label "Disputados". The live strip shows the disputed count (`{ label: "Disputados", value: String(metrics.disputedCount) }`), while the fallback shows the disputed queue total (`value: String(fallback.disputedQueueCount)`). `src/features/curation/components/MetricsStrip/MetricsStrip.tsx` (`buildCells`).
- The batch bar disables its actions for a disputed selection (`disabled={isDisputed}`). But for that kind it shows no action at all (`showConfirm = kind === "uncertain"`, `showReject = kind === "uncertain"`, `showKeepSeparate = kind === "entity_match"`), so the disabled state is never seen. `src/features/curation/components/BatchBar/BatchBar.tsx` (`BatchBar`).
- Outside tests, no file mounts the batch bar or this area's stale banner. The decision panel mounts its own stale banner with the same message, "Este item mudou desde que você o abriu.". The curation page mounts the metrics strip, and the graph's node detail panel mounts the drawer. `src/features/curation/components/BatchBar/BatchBar.tsx`, `src/features/curation/components/StaleBanner/StaleBanner.tsx`.
- The drawer finds its item only in the review queue listing read without arguments (`useListReviewQueue()`). An item that is in the queue but not on that listing is reported to the owner as "Este item não está mais disponível na fila.". `src/features/curation/components/CurationDrawer/CurationDrawer.tsx` (`DrawerBody`).
