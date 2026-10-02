---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/curation/components/CurationDecision.tsx
  - src/features/curation/components/CurationPage.tsx
  - src/features/curation/components/QueueItem.tsx
  - src/features/curation/components/QueueList.tsx
  - src/features/curation/components/QueueTabs.tsx
  - src/features/curation/components/curation-page-helpers.ts
  - src/features/curation/components/curation-page-parts.tsx
read_outside_area:
  - "src/features/curation/hooks/useCurationQueue.ts - to learn what the page's queue read sends (kind, limit 20, offset 0) and how often it repeats (every 30 s, only while the tab is visible, again on window focus); no fact attributed"
  - "src/features/curation/state/curation-store.ts - to learn how the item search parameter is parsed and written as kind colon id, and that choosing a different item clears the evidence-viewed flag; no fact attributed"
  - "src/features/curation/hooks/useCurationKeyboard.ts - to learn which keys reach the page callbacks (j next, k previous, x check, 1 to 9 select) and that editable fields and Ctrl, Alt or Meta suppress them; no fact attributed"
  - "src/features/curation/hooks/useDecisionDispatch.tsx - to learn what the destructive and immediate decision paths do (a 5 s undo window with the caption, then advance, toasts, the error projection); no fact attributed"
  - "src/router/routes.tsx - grepped to confirm the curation route declares the item search parameter and that nothing calls the curation store reset; no fact attributed"
---

## Facts
### The curation page and its two columns
- The curation page shows two areas side by side: a queue column and a decision column. The queue column holds the new-item pill, the curation metrics strip, the queue tabs and the queue list. `src/features/curation/components/CurationPage.tsx` (`CurationPage`).
- The page reads the review queue through the queue read, filtered by the tab that is active. `src/features/curation/components/CurationPage.tsx` (`useCurationQueue(kindFilter)`).
- The page reads the curation metrics and passes three things to the metrics strip: the metrics, whether the read has settled, and whether it failed. `src/features/curation/components/CurationPage.tsx` (`useCurationMetrics`, `MetricsStrip`).
- The page counts the loaded items per queue and passes the counts to the metrics strip as its fallback. Items of kind `entity_match` count toward the entity-match queue. Every other item counts toward the disputed queue. `src/features/curation/components/CurationPage.tsx` (`metricsFallback`).
- The page lists only the items of the single page that the queue read returns. It has no control to load further pages. `src/features/curation/components/CurationPage.tsx` (`items = data?.items ?? []`).
- The page does not clear its state when the owner leaves it. The selected item, the checked set and the new-item baseline are never reset by anything in the area. `src/features/curation/components/CurationPage.tsx` (no `reset` call).

### Queue tabs
- The queue has three tabs. Tudo reads both review queues with no kind. Entidades reads the entity-match queue (`entity_match`). Disputas reads the disputed queue (`disputed`). `src/features/curation/components/QueueTabs.tsx` (`TABS`).
- The active tab lives only on the page and is not written to the URL. Each time the page mounts, the tab starts at Tudo. `src/features/curation/components/CurationPage.tsx` (`useState<QueueKindFilter>(undefined)`), `src/features/curation/components/QueueTabs.tsx` (`QueueTabs`).

### Queue list states
- If the queue read fails, the queue list is replaced by an error banner with a retry control. Retry runs the queue read again. `src/features/curation/components/CurationPage.tsx` (`isError ? <QueueErrorBanner onRetry={refetch}>`).
- The error banner reads "Não foi possível carregar a fila. Tente novamente." `src/features/curation/components/curation-page-parts.tsx` (`QueueErrorBanner`).
- The error state is checked before the empty state. The empty state shows only when the read is not pending, has not failed, and returned zero items. `src/features/curation/components/CurationPage.tsx` (`isEmpty`, render ternary).
- The empty state reads "Nada pendente" with the description "A fila está limpa.". It shows the same text on every tab, including a filtered tab. `src/features/curation/components/curation-page-parts.tsx` (`EmptyQueue`), `src/features/curation/components/CurationPage.tsx` (`isEmpty`).
- While the queue read is pending, the list shows 5 placeholder rows instead of items, and the queue region is marked busy. `src/features/curation/components/QueueList.tsx` (`SkeletonRows count={5}`), `src/features/curation/components/CurationPage.tsx` (`aria-busy={isPending}`, `skeleton={isPending}`).
- The list shows items in the order the queue read returns them. The screen does not re-sort them. `src/features/curation/components/QueueList.tsx` (`items[v.index]`).

### What a queue item shows
- Each queue item shows a state badge, a relative time and a scope line. `src/features/curation/components/QueueItem.tsx` (`QueueItem`).
- An entity-match review item shows the badge "Para revisar" in the uncertain state. A dispute item shows "Disputado" in the disputed state. `src/features/curation/components/QueueItem.tsx` (`mapKindToBadge`).
- An entity-match review item's scope line is the canonical name of the node. `src/features/curation/components/QueueItem.tsx` (`describeScope`).
- A dispute over a link reads "Link · <link type>", or just "Link" when there is no link type. A dispute over an attribute reads "Atributo · <attribute key>", or just "Atributo" when there is no key. `src/features/curation/components/QueueItem.tsx` (`describeScope`).
- The relative time counts from when the item was created:
  - under 1 minute: "agora"
  - under 60 minutes: "há N min"
  - under 24 hours: "há N h"
  - under 30 days: "há N d"
  - 30 days or more: the date in pt-BR format

  Whole units are floored, and a future creation time counts as zero. `src/features/curation/components/QueueItem.tsx` (`formatRelative`).
- The relative time is worked out once per creation time. It does not advance while the item stays on screen with the same creation time. `src/features/curation/components/QueueItem.tsx` (`useMemo(..., [item.createdAt])`).

### Item identity and selection
- An entity-match review item is identified by its node id. A dispute item is identified by the item id of its first side. If a dispute item has no sides, the list builds an id from the assertion kind, the source node id and the link type or attribute key, using "?" for any missing part. `src/features/curation/components/QueueList.tsx` (`buildItemKey`).
- A selection matches a dispute item when the selection's id equals the item id of any of the dispute's sides. `src/features/curation/components/curation-page-helpers.ts` (`findItemInQueue`, `indexOfSelected`).
- The owner selects an item by clicking it or by pressing Enter or Space on it. The selected item is marked selected and current. `src/features/curation/components/QueueItem.tsx` (`onClick`, `handleKey`, `aria-selected`, `aria-current`).
- Selecting an item writes `?item=<kind>:<id>` to `/curation`, so a reload or a shared link opens the same item. The write replaces the current history entry instead of adding one. `src/features/curation/components/CurationPage.tsx` (`handleSelect`, `navigate({ to: "/curation", search: { item }, replace: true })`).
- Each time the queue read resolves, the page chooses the selection again:
  - the item named by the URL's `item` parameter, if it is in the loaded queue;
  - otherwise the first loaded item;
  - otherwise nothing.

  `src/features/curation/components/curation-page-helpers.ts` (`deriveInitialSelection`), `src/features/curation/components/CurationPage.tsx` (`useEffect` → `setSelectedItem(initial)`).
- When nothing is selected, or the selection is not in the loaded queue, the decision column shows "Selecione um item da fila para começar.". `src/features/curation/components/CurationPage.tsx` (`selectedFull ? … : curation-decision-idle`).

### Keyboard navigation
- The page connects four keyboard actions: next, previous, select by number, and check. It connects no keyboard action for evidence, merge, keep separate, confirm, reject, undo or help. `src/features/curation/components/CurationPage.tsx` (`useCurationKeyboard({ onNext, onPrev, onSelectIndex, onToggleCheck })`).
- Next and previous move through the loaded queue as a ring: from the last item, next goes to the first, and from the first, previous goes to the last. With no selection that is in the queue, next picks the first item and previous picks the last. `src/features/curation/components/curation-page-helpers.ts` (`neighbour`).
- Select by number picks the Nth loaded item, counting from 1, for N from 1 to 9. `src/features/curation/components/curation-page-helpers.ts` (`selectByIndex`).
- Moving by keyboard goes through the same selection path as a click, so the URL `item` parameter follows. `src/features/curation/components/CurationPage.tsx` (`onNext`/`onPrev`/`onSelectIndex` → `handleSelect`).
- The check action adds the selected item's id to a checked set, or removes it if it is already there. Nothing in the area acts on the checked set. `src/features/curation/components/CurationPage.tsx` (`onToggleCheck`, `setSelectedItems`).

### New-item pill
- The new-item count is the latest queue total minus a baseline, never below zero. The baseline is the first total the page sees. It moves only when the owner clicks the pill, which sets it to the current total. `src/features/curation/components/CurationPage.tsx` (`delta`, `updateLastSeen` effect, `onAck`).
- The baseline is not adjusted when the tab changes, so moving to a tab with a larger total counts the difference as new items. `src/features/curation/components/CurationPage.tsx` (`delta` over `data?.total`, effect gated on `lastSeenTotal === null`).
- The pill shows only when the count is above zero. It reads "1 novo" for one item and "N novos" for more. `src/features/curation/components/curation-page-parts.tsx` (`PollingPill`).

### The decision host
- The decision column opens the decision panel for the selected item, resolved to its full queue entry. `src/features/curation/components/CurationPage.tsx` (`findItemInQueue`, `<CurationDecision item={selectedFull} queue={data}>`).
- An entity-match review item has no provenance trail. Its evidence counts as viewed as soon as it opens, so the decision panel is ready at once. `src/features/curation/components/CurationDecision.tsx` (`provenanceContextOf`, `armedImmediately`).
- A dispute item shows the provenance trail of its first side: the side's assertion kind (link or attribute) and its item id. Its evidence counts as viewed once the trail reports that it was viewed. `src/features/curation/components/CurationDecision.tsx` (`provenanceContextOf`, `onEvidenceViewed` → `setEvidenceViewed(true)`).
- A dispute item with no sides has no provenance trail, so its evidence counts as viewed at once. `src/features/curation/components/CurationDecision.tsx` (`provenanceContextOf`).
- The decision panel receives the item, whether the evidence counts as viewed, the last server error, the stale flag, and whether a decision is being submitted. `src/features/curation/components/CurationDecision.tsx` (`DecisionPanel` props).

### Decisions sent from the page
Two paths exist. "Destructive" means sent through `dispatchDestructive` with a caption; "Immediate" means sent through `dispatchNonDestructive`.
- Entity-match resolution with decision `merge_into` is destructive. It is sent for the item's node with the caption "Item fundido". Any other entity-match decision is immediate. `src/features/curation/components/CurationDecision.tsx` (`onResolveEntityMatch`).
- Dispute resolution with decision `prefer_one` is destructive, with the caption "Lado preferido". Decision `keep_disputed` is immediate. Any other dispute decision is immediate as an adjustment. `src/features/curation/components/CurationDecision.tsx` (`onResolveDispute`).
- For a preference, the id used for the item is chosen in this order: the first item id in the request, then the first side's item id, then the empty string. `src/features/curation/components/CurationDecision.tsx` (`optimisticId`).
- Confirmation (assertion review) is immediate. `src/features/curation/components/CurationDecision.tsx` (`onConfirm`).
- Rejection is destructive. It is sent for the request's item id with the caption "Item rejeitado". `src/features/curation/components/CurationDecision.tsx` (`onReject`).
- Correction (assertion correction) is immediate. `src/features/curation/components/CurationDecision.tsx` (`onCorrect`).
- After a decision, the next item is the ring neighbour after whatever is selected at that moment, taken from the queue as last loaded. `src/features/curation/components/CurationDecision.tsx` (`getNextItem: neighbour(queue, getState().selectedItem, "next")`).
- The page does not remove a decided item from the list, or put it back, by itself. The list changes only when the queue is read again. `src/features/curation/components/CurationDecision.tsx` (`onItemRemove: () => {}`, `onItemRestore: () => {}`).

## Answers
- Queue read — any failure → no status or code is shown; the banner "Não foi possível carregar a fila. Tente novamente." replaces the list and offers a retry that reads again. `src/features/curation/components/CurationPage.tsx` (`isError`), `src/features/curation/components/curation-page-parts.tsx` (`QueueErrorBanner`).
- Queue read — succeeds with zero items → "Nada pendente" / "A fila está limpa.". `src/features/curation/components/curation-page-parts.tsx` (`EmptyQueue`), `src/features/curation/components/CurationPage.tsx` (`isEmpty`).
- Deep link — the `item` parameter names nothing in the loaded queue → the first loaded item is selected, or nothing if the queue is empty. `src/features/curation/components/curation-page-helpers.ts` (`deriveInitialSelection`).
- Select by number — N is outside 1 to 9, or larger than the number of loaded items → the selection does not change. `src/features/curation/components/curation-page-helpers.ts` (`selectByIndex`), `src/features/curation/components/CurationPage.tsx` (`onSelectIndex`).
- Entity-match resolution requested on an item that is not an entity-match review item → nothing is sent. `src/features/curation/components/CurationDecision.tsx` (`if (item.kind !== "entity_match") return`).
- Dispute resolution requested on an item that is not a dispute item → nothing is sent. `src/features/curation/components/CurationDecision.tsx` (`if (item.kind !== "disputed") return`).
- Decision refused by the server → the area shows nothing itself; it passes the server error and the stale flag to the decision panel. `src/features/curation/components/CurationDecision.tsx` (`serverError={dispatch.serverError}`, `stale={dispatch.stale}`).

## Vocabularies
- Queue tabs (label → review-queue kind): Tudo → none (both queues); Entidades → `entity_match`; Disputas → `disputed`. `src/features/curation/components/QueueTabs.tsx` (`TABS`).
- Queue item badge (review-queue kind → label, state): `entity_match` → "Para revisar", `uncertain`; `disputed` → "Disputado", `disputed`. `src/features/curation/components/QueueItem.tsx` (`mapKindToBadge`).
- Kinds accepted in a selection and in the `item` link: `entity_match`, `disputed`. `src/features/curation/components/curation-page-helpers.ts` (`findItemInQueue`), `src/features/curation/components/QueueList.tsx` (`buildItemKey`).
- Assertion kinds named on a dispute's scope line: `link` → "Link"; anything else → "Atributo". `src/features/curation/components/QueueItem.tsx` (`describeScope`).
- Entity-match decision values the page tells apart: `merge_into`, and every other value. `src/features/curation/components/CurationDecision.tsx` (`onResolveEntityMatch`).
- Dispute decision values the page tells apart: `prefer_one`, `keep_disputed`, and every other value (sent as an adjustment). `src/features/curation/components/CurationDecision.tsx` (`onResolveDispute`).
- Destructive decision captions: "Item fundido" (merge), "Lado preferido" (preference), "Item rejeitado" (rejection). `src/features/curation/components/CurationDecision.tsx` (`dispatchDestructive` third argument).
- Relative time labels: "agora", "há N min", "há N h", "há N d", or the date in pt-BR format. `src/features/curation/components/QueueItem.tsx` (`formatRelative`).

## Upstream artifacts
- The review-queue read (contracts/knowledge-base/curation) returns a `total` and `items`. Each item has a `kind`. An entity-match review item carries `nodeId`, `canonicalName` and `createdAt`. A dispute item carries `itemKind`, `scope.linkType`, `scope.attributeKey`, `scope.sourceNodeId`, `sides[].itemId` and `createdAt`. `src/features/curation/components/QueueItem.tsx` (`describeScope`, `item.createdAt`), `src/features/curation/components/QueueList.tsx` (`buildItemKey`), `src/features/curation/components/CurationPage.tsx` (`data.total`, `data.items`).
- Entity-match resolution requests are sent for a node id with a body carrying `decision`. `src/features/curation/components/CurationDecision.tsx` (`resolve_entity_match_merge`, `resolve_entity_match_keep`).
- Dispute resolution requests carry `decision` and `item_ids`. `src/features/curation/components/CurationDecision.tsx` (`resolve_dispute_prefer`, `resolve_dispute_keep`, `resolve_dispute_adjust`).
- Confirmation, rejection and correction requests carry `item_id`. `src/features/curation/components/CurationDecision.tsx` (`confirm_item`, `reject_item`, `correct_item`).
- The curation metrics read (curation metrics) is passed to the metrics strip unchanged. `src/features/curation/components/CurationPage.tsx` (`useCurationMetrics`).
- The `/curation` route carries the optional search parameter `item`. `src/features/curation/components/CurationPage.tsx` (`useSearch({ from: curationRoute.id })`).

## Outside the domain
- List virtualisation (estimated row height 72 px, overscan 5) and virtual item keys: performance. `src/features/curation/components/QueueList.tsx`.
- Placeholder row height, container-query breakpoints, column widths, GlassSurface panels, spacing, colours and icons: surface. `src/features/curation/components/CurationPage.tsx`, `src/features/curation/components/QueueList.tsx`, `src/features/curation/components/QueueItem.tsx`, `src/features/curation/components/curation-page-parts.tsx`.
- Control labels and headings ("Curadoria", "Tentar novamente"), aria labels ("Fila de curadoria", "Painel de decisão", "Filtrar fila por tipo"), listbox, option, tab and status roles: surface and accessibility wiring. `src/features/curation/components/CurationPage.tsx`, `src/features/curation/components/QueueList.tsx`, `src/features/curation/components/QueueTabs.tsx`, `src/features/curation/components/curation-page-parts.tsx`.
- `data-testid` attributes: test wiring. Every file of the area.
- Zustand store subscriptions, the Radix Tabs `all` sentinel, and memoisation: framework wiring. `src/features/curation/components/CurationPage.tsx`, `src/features/curation/components/QueueTabs.tsx`, `src/features/curation/components/CurationDecision.tsx`.

## Observed and not decided here
- After a decision, two behaviours set the selection and can disagree.
  - The decision host moves the selection to the ring neighbour after the current item: `src/features/curation/components/CurationDecision.tsx` (`getNextItem: neighbour(queue, …, "next")`). That move does not update the URL `item` parameter.
  - When the queue is read again, the page re-selects the item named by the URL `item` parameter if it is still in the queue, and otherwise the first item: `src/features/curation/components/CurationPage.tsx` (`useEffect` → `deriveInitialSelection(data, deepLink)`), `src/features/curation/components/curation-page-helpers.ts` (`deriveInitialSelection`).
- A dispute item with no sides is handled two ways.
  - The list gives it a built id (`<itemKind>:<sourceNodeId|?>:<linkType|attributeKey|?>`) and lets it be clicked and selected: `src/features/curation/components/QueueList.tsx` (`buildItemKey`).
  - The page's lookup matches dispute items only by a side's item id, so that selection never opens a decision panel: `src/features/curation/components/curation-page-helpers.ts` (`findItemInQueue`). Keyboard moves and the initial selection give nothing for such an item: `src/features/curation/components/curation-page-helpers.ts` (`toSelectedItem`, `deriveInitialSelection` return `null`).
