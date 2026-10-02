---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/curation/hooks/useCurationKeyboard.ts
  - src/features/curation/hooks/useCurationQueue.ts
  - src/features/curation/hooks/useDecisionDispatch.tsx
  - src/features/curation/lib/display-mode.ts
  - src/features/curation/state/curation-store.ts
  - src/features/curation/types.ts
read_outside_area:
  - "src/features/curation/components/UndoToast/UndoToast.tsx — opened to resolve the undo window constant `UNDO_WINDOW_MS` that the decision dispatch imports; its value is a fact of that file and not of this area"
  - "src/features/curation/components/QueueTabs.tsx — opened to resolve the `QueueKindFilter` type the queue hook takes (a review queue kind, or undefined for all queues)"
---

## Facts
### Keyboard shortcuts on the curation screen
- The curation screen listens for shortcuts on key-down for the whole window, unless a target element is supplied. `src/features/curation/hooks/useCurationKeyboard.ts` (`useCurationKeyboard`, `el.addEventListener("keydown", ...)`).
- Shortcuts are switched on by default. When they are switched off, the listener is removed and no key does anything. `src/features/curation/hooks/useCurationKeyboard.ts` (`UseCurationKeyboardOptions.enabled`, `if (!enabled) return undefined`).
- A key pressed while the focus is on an input, textarea or select, an element with `contenteditable`, or an element with role `combobox`, `listbox` or `textbox` is not a shortcut, so the owner can type any letter into a reason or correction field. `src/features/curation/hooks/useCurationKeyboard.ts` (`isEditableTarget`).
- The editable-focus check runs first, before the key is mapped. It is decided at the moment of each key press. `src/features/curation/hooks/useCurationKeyboard.ts` (`onKeyDown`).
- A key held with Ctrl, Alt or Meta is never a shortcut. Shift is allowed. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`).
- `j` moves to the next item. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"next"`).
- `k` moves to the previous item. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"prev"`).
- `x` toggles the batch check of the current item. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"toggleCheck"`).
- `e` opens the evidence. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"evidence"`).
- `m` merges, the entity-match decision `merge_into`. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"merge"`).
- `s` keeps the entities separate, the entity-match decision `keep_separate`. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"keepSeparate"`).
- `c` confirms. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"confirm"`).
- `r` rejects. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"reject"`).
- `u` undoes. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"undo"`).
- `?` shows or hides the shortcut help. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `"toggleHelp"`).
- The digits `1` to `9` select the Nth visible queue item, counted from 1. `0` is not a shortcut. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `{ kind: "selectIndex", n }`).
- Letter shortcuts are matched case-sensitively, so an upper-case letter (for example Shift+`j` giving `J`) is not a shortcut. `src/features/curation/hooks/useCurationKeyboard.ts` (`mapKey`, `key === "j"`).
- A shortcut the screen has not wired to an action does nothing and does not stop the key's default behaviour. `src/features/curation/hooks/useCurationKeyboard.ts` (`if (cb.onX !== undefined)`).
- Every wired shortcut except `?` stops the key's default browser behaviour. `?` fires its action and lets the default through. `src/features/curation/hooks/useCurationKeyboard.ts` (`event.preventDefault()`, `case "toggleHelp"`).

### The review queue as the screen loads it
- The screen reads the review queue with `GET /api/v1/curation/queue`, sending the owner's authentication header. `src/features/curation/hooks/useCurationQueue.ts` (`useCurationQueue`, `httpCuration`, `authHeader()`).
- The request sends `kind` only when one review queue kind is chosen. When no kind is chosen, `kind` is left out and every queue is requested. `src/features/curation/hooks/useCurationQueue.ts` (`if (kind !== undefined) qs.set("kind", kind)`).
- The screen always asks for the first page, with `limit=20` and `offset=0`. `src/features/curation/hooks/useCurationQueue.ts` (`QUEUE_LIMIT = 20`, `qs.set("offset", "0")`).
- The queue is always treated as stale, so it is fetched again whenever it is read. `src/features/curation/hooks/useCurationQueue.ts` (`staleTime: 0`).
- The queue is polled every 30 000 ms, only while the browser tab is visible. `src/features/curation/hooks/useCurationQueue.ts` (`QUEUE_POLL_MS = 30_000`, `refetchIntervalInBackground: false`).
- The queue is fetched again when the window regains focus. `src/features/curation/hooks/useCurationQueue.ts` (`refetchOnWindowFocus: true`).
- The queue hook does not reorder the entries. The screen keeps the order the queue answers in. `src/features/curation/hooks/useCurationQueue.ts` (`queryFn`, `toReviewQueueList(wire)`).

### Which decisions wait for undo
- Three decisions are destructive and wait for undo: the entity-match decision `merge_into`, the dispute decision `prefer_one`, and rejecting an item. `src/features/curation/hooks/useDecisionDispatch.tsx` (`DestructiveDispatch`).
- Five decisions are sent at once, with no undo: the entity-match decision `keep_separate`, the dispute decisions `keep_disputed` and `adjust_periods`, confirming an item, and correcting an item. `src/features/curation/hooks/useDecisionDispatch.tsx` (`NonDestructiveDispatch`).
- Both entity-match decisions resolve the entity-match review of the item's node, sending `node_id` and the request body. `src/features/curation/hooks/useDecisionDispatch.tsx` (`runMutation`, `mEntityMatch.mutateAsync({ node_id, body })`).
- All three dispute decisions use the dispute resolution with their body. `src/features/curation/hooks/useDecisionDispatch.tsx` (`runMutation`, `mDispute.mutateAsync`).
- Confirming, rejecting and correcting each use their own curation action. `src/features/curation/hooks/useDecisionDispatch.tsx` (`runMutation`, `mConfirm`, `mReject`, `mCorrect`).

### A destructive decision and its undo
- A destructive decision removes the item from the queue the owner sees and moves to the next item at once, before anything is sent to the server. `src/features/curation/hooks/useDecisionDispatch.tsx` (`dispatchDestructive`, `onItemRemove(optimisticId); advance()`).
- A destructive decision opens an undo toast that shows the caption the screen passes in and the time left in the window. The toast stays open for exactly the undo window. `src/features/curation/hooks/useDecisionDispatch.tsx` (`toast.custom(<UndoToast label deadlineMs/>)`, `duration: UNDO_WINDOW_MS`).
- Nothing is sent to the server during the undo window. The decision is sent only when the window's timer runs out. `src/features/curation/hooks/useDecisionDispatch.tsx` (`setTimeout(..., UNDO_WINDOW_MS)`).
- Undo stops the timer, closes the toast and puts the item back in the queue. Nothing is sent to the server. `src/features/curation/hooks/useDecisionDispatch.tsx` (`cancelPending`).
  - Undo does not select the restored item again, and it does not take the decision back off the session's resolved count. `src/features/curation/hooks/useDecisionDispatch.tsx` (`cancelPending`).
- Only one destructive decision can wait for undo at a time. Starting a second one sends the first to the server at once and closes its toast. `src/features/curation/hooks/useDecisionDispatch.tsx` (`dispatchDestructive`, `if (pendingRef.current !== null) commitPending()`).
- If the owner leaves the curation screen while a decision is waiting for undo, the decision is sent at once and the owner is told «Ação comprometida ao sair.». `src/features/curation/hooks/useDecisionDispatch.tsx` (unmount `useEffect` cleanup, `toast.info`).
- A decision waiting for undo is held only in the open screen's memory. It does not survive a reload. `src/features/curation/hooks/useDecisionDispatch.tsx` (`pendingRef`, `PendingDestructive`).
- The screen supplies the identifier used to remove and restore the item for a destructive decision. `src/features/curation/hooks/useDecisionDispatch.tsx` (`dispatchDestructive(dispatch, optimisticId, label)`).

### Non-destructive decisions
- A non-destructive decision is sent to the server at once. `src/features/curation/hooks/useDecisionDispatch.tsx` (`dispatchNonDestructive`).
- When a non-destructive decision succeeds, the owner is told «Confirmado.» for 2 000 ms and the screen moves to the next item. This holds for every non-destructive decision, including keeping entities separate, keeping a dispute, adjusting periods and correcting. `src/features/curation/hooks/useDecisionDispatch.tsx` (`commit`, `toast.success("Confirmado.", { duration: 2_000 })`).
- When a destructive decision succeeds after its undo window, no success toast is shown and the screen moves to the next item. `src/features/curation/hooks/useDecisionDispatch.tsx` (`commit`, `if (!isDestructive)`, `advance()`).
- The item a non-destructive decision removes when it finds the item already gone is chosen by decision. `src/features/curation/hooks/useDecisionDispatch.tsx` (`optimisticIdOf`).
  - Keeping entities separate removes the item by its node id. `src/features/curation/hooks/useDecisionDispatch.tsx` (`optimisticIdOf`).
  - Keeping a dispute or adjusting periods removes the item by the first `item_ids` entry, or removes nothing when the list is empty. `src/features/curation/hooks/useDecisionDispatch.tsx` (`optimisticIdOf`).
  - Confirming and correcting remove the item by `item_id`. `src/features/curation/hooks/useDecisionDispatch.tsx` (`optimisticIdOf`).

### Moving on after a decision
- Moving on selects the item the screen names as next, or nothing when there is none, and adds one to the session's resolved count. `src/features/curation/hooks/useDecisionDispatch.tsx` (`advance`).
- A destructive decision moves on once when it is made and again when the server accepts it. `src/features/curation/hooks/useDecisionDispatch.tsx` (`dispatchDestructive`, `commit`).
- A server error from the previous decision and the stale signal are both cleared when the next decision is sent. `src/features/curation/hooks/useDecisionDispatch.tsx` (`commit`, `setServerError(null); setStale(false)`).
- The screen shows the decision as sending from the moment it goes to the server until the server answers or fails. `src/features/curation/hooks/useDecisionDispatch.tsx` (`commit`, `setSubmitting`).

### How a decision's failure is read
- A failed decision is checked in this order. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`).
  - First, a failure that does not carry the error envelope.
  - Then the authentication codes.
  - Then the codes meaning the item is gone.
  - Then the field codes.
  - Then an answer status of 500 or above.
  - Last, any other code.
- A field code is shown in the panel even when its answer status is 500 or above, because field codes are checked first. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`).
- When a destructive decision is refused with a code that does not mean the item is gone, the item is put back in the queue so the owner can try again. `src/features/curation/hooks/useDecisionDispatch.tsx` (`commit`, `onItemRestore(optimisticId)`).
- When a destructive decision finds the item already gone, the item is not put back. `src/features/curation/hooks/useDecisionDispatch.tsx` (`commit`, `!VANISHED_CODES.has(err.code)`).

### Deciding between the summary view and the full comparison
- The screen decides from the queue entry alone whether to show the summary view or the full comparison. `src/features/curation/lib/display-mode.ts` (`resolveDisplayMode`).
- An entity-match review shows the summary view only when it has exactly one candidate and that candidate's similarity is at least 0.9. Otherwise it shows the full comparison. `src/features/curation/lib/display-mode.ts` (`HIGH_SIMILARITY_THRESHOLD = 0.9`, `resolveDisplayMode`).
- A disputed entry shows the summary view only when it has exactly two sides and at least one side has an end of validity. Otherwise, with three or more sides or with no end of validity on either side, it shows the full comparison. `src/features/curation/lib/display-mode.ts` (`resolveDisplayMode`, `item.sides.some((s) => s.validTo !== null)`).

### Selection, evidence and session state
- The item the owner is looking at is named by its review queue kind and an id. Nothing selected means the screen is idle. `src/features/curation/state/curation-store.ts` (`SelectedItem`, `selectedItem: null`).
- Selecting a different item, or clearing the selection, marks its evidence as not yet viewed. `src/features/curation/state/curation-store.ts` (`setSelectedItem`, `evidenceViewed: false`).
- Selecting the item already selected, with the same kind and id, changes nothing and keeps its evidence viewed. `src/features/curation/state/curation-store.ts` (`setSelectedItem`, `same`).
- Whether the evidence has been viewed is held per selected item and starts as not viewed. `src/features/curation/state/curation-store.ts` (`evidenceViewed`, `makeInitialState`).
- The session's resolved count starts at 0 and goes up by one on each move to the next item. `src/features/curation/state/curation-store.ts` (`sessionResolved`, `incrementResolved`).
- The last queue total the owner saw is empty until the first queue answer. After that it changes only when the total changes. `src/features/curation/state/curation-store.ts` (`lastSeenTotal: null`, `updateLastSeen`).
- The set of items checked for a batch starts empty. The screen replaces it whole for every change. `src/features/curation/state/curation-store.ts` (`selectedItems`, `setSelectedItems`).
- Resetting puts the selection, evidence-viewed mark, resolved count, last seen total and batch set back to their starting values. `src/features/curation/state/curation-store.ts` (`reset`, `makeInitialState`).
- None of this state is persisted. It lives only in the open page's memory. `src/features/curation/state/curation-store.ts` (`create<CurationState>`, no persistence).

### Deep link to an item
- The selected item is carried in the address as `?item=<kind>:<id>`. `src/features/curation/state/curation-store.ts` (`stringifyItemSearchParam`, `parseItemSearchParam`).
- An item link is read as nothing selected in each of these cases. `src/features/curation/state/curation-store.ts` (`parseItemSearchParam`).
  - The value is not a string, or is empty.
  - It has no `:`, or has no text before the first `:` or after it.
  - The kind before the colon is not `entity_match` or `disputed`.
- The id in an item link is everything after the first `:`, so it may itself contain colons. `src/features/curation/state/curation-store.ts` (`raw.slice(colon + 1)`).
- When nothing is selected, the address carries no `item` parameter. `src/features/curation/state/curation-store.ts` (`stringifyItemSearchParam`, `return undefined`).

### What the screen holds for a queue entry
- The screen holds an entity-match review entry with these fields, its creation time read as a date. `src/features/curation/types.ts` (`EntityMatchQueueItem`).
  - The node id.
  - The node type.
  - The canonical name.
  - Its candidates: each candidate's node id, canonical name and similarity.
- The screen holds a disputed entry with its assertion kind, its dispute scope, its sides and its creation time. The entry has no identifier of its own. `src/features/curation/types.ts` (`DisputeQueueItem`).
- Each side of a disputed entry carries these fields. `src/features/curation/types.ts` (`DisputedItemSide`).
  - The item id.
  - The value, or none.
  - The target node, or none.
  - The start and end of validity, each read as a date or none.
  - The basis for the start of validity.
  - The confidence.
  - The assertion status.

## Answers
- A curation decision: a failure that carries no error envelope → toast «Algo deu errado. Tente novamente.». A destructive item is not put back. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`, `!isEnvelopeError(err)`).
- A curation decision: `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID` or `AUTH_SESSION_EXPIRED` → this screen shows no toast and no field error. A destructive item is put back. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`, `commit`).
- A curation decision: `BUSINESS_REVIEW_NOT_PENDING` → warning toast «Já resolvido em outro lugar.». The item is removed, the stale signal is raised, and the screen moves to the next item. `src/features/curation/hooks/useDecisionDispatch.tsx` (`vanishedToastMessage`, `setStale`).
- A curation decision: `BUSINESS_ITEM_NOT_DISPUTED` → warning toast «Já resolvido em outro lugar.». The item is removed, the stale signal is raised, and the screen moves to the next item. `src/features/curation/hooks/useDecisionDispatch.tsx` (`vanishedToastMessage`, `setStale`).
- A curation decision: `BUSINESS_ITEM_NOT_UNCERTAIN` → warning toast «Este item já não está incerto.». The item is removed and the screen moves to the next item, with no stale signal. `src/features/curation/hooks/useDecisionDispatch.tsx` (`vanishedToastMessage`).
- A curation decision: `BUSINESS_ITEM_NOT_DELETABLE` → warning toast «Este item já foi rejeitado ou substituído.». The item is removed and the screen moves to the next item, with no stale signal. `src/features/curation/hooks/useDecisionDispatch.tsx` (`vanishedToastMessage`).
- A curation decision: `BUSINESS_NODE_DELETED` → warning toast «Este nó foi excluído por conformidade.». The item is removed and the screen moves to the next item, with no stale signal. `src/features/curation/hooks/useDecisionDispatch.tsx` (`vanishedToastMessage`).
- A curation decision: `RESOURCE_NOT_FOUND` → warning toast «Item não encontrado.». The item is removed and the screen moves to the next item, with no stale signal. `src/features/curation/hooks/useDecisionDispatch.tsx` (`vanishedToastMessage`).
- A curation decision: any of the following codes → the code, message and answer status are shown as a field error in the decision panel, with no toast. A destructive item is put back. `src/features/curation/hooks/useDecisionDispatch.tsx` (`INLINE_FIELD_CODES`, `setServerError`).
  - `BUSINESS_REASON_REQUIRED`
  - `BUSINESS_SELF_MERGE_FORBIDDEN`
  - `BUSINESS_TARGET_NODE_REQUIRED`
  - `BUSINESS_INVALID_TARGET_NODE`
  - `BUSINESS_DISPUTE_WINNER_REQUIRED`
  - `BUSINESS_DISPUTE_PERIODS_REQUIRED`
  - `BUSINESS_TEMPORAL_INCOHERENT`
  - `BUSINESS_DATE_UNJUSTIFIED`
  - `BUSINESS_CORRECTION_NO_CHANGES`
  - `BUSINESS_FRAGMENT_NOT_ACCEPTED`
- A curation decision: answer status 503 with any other code → error toast «Serviço temporariamente indisponível. Tente novamente em instantes.». A destructive item is put back. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`, `httpStatus === 503`).
- A curation decision: answer status 500 or above, other than 503, with any other code → error toast «Algo deu errado. Tente novamente.». A destructive item is put back. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`, `httpStatus >= 500`).
- A curation decision: any other enveloped code below status 500 → the code, message and answer status are shown as a field error in the decision panel. A destructive item is put back. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`, fallback `setServerError`).

## Vocabularies
- Curation shortcuts: `next`, `prev`, `toggleCheck`, `evidence`, `merge`, `keepSeparate`, `confirm`, `reject`, `undo`, `toggleHelp`, `selectIndex` (1 to 9). `src/features/curation/hooks/useCurationKeyboard.ts` (`CurationShortcut`).
- Destructive decisions: `resolve_entity_match_merge`, `resolve_dispute_prefer`, `reject_item`. `src/features/curation/hooks/useDecisionDispatch.tsx` (`DestructiveDispatch`).
- Non-destructive decisions: `resolve_entity_match_keep`, `resolve_dispute_keep`, `resolve_dispute_adjust`, `confirm_item`, `correct_item`. `src/features/curation/hooks/useDecisionDispatch.tsx` (`NonDestructiveDispatch`).
- Codes meaning the item is gone: `BUSINESS_REVIEW_NOT_PENDING`, `BUSINESS_ITEM_NOT_DISPUTED`, `BUSINESS_ITEM_NOT_UNCERTAIN`, `BUSINESS_ITEM_NOT_DELETABLE`, `BUSINESS_NODE_DELETED`, `RESOURCE_NOT_FOUND`. `src/features/curation/hooks/useDecisionDispatch.tsx` (`VANISHED_CODES`).
- Codes shown as field errors: `BUSINESS_REASON_REQUIRED`, `BUSINESS_SELF_MERGE_FORBIDDEN`, `BUSINESS_TARGET_NODE_REQUIRED`, `BUSINESS_INVALID_TARGET_NODE`, `BUSINESS_DISPUTE_WINNER_REQUIRED`, `BUSINESS_DISPUTE_PERIODS_REQUIRED`, `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_DATE_UNJUSTIFIED`, `BUSINESS_CORRECTION_NO_CHANGES`, `BUSINESS_FRAGMENT_NOT_ACCEPTED`. `src/features/curation/hooks/useDecisionDispatch.tsx` (`INLINE_FIELD_CODES`).
- Authentication codes this screen leaves silent: `AUTH_UNAUTHORIZED`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`, `AUTH_SESSION_EXPIRED`. `src/features/curation/hooks/useDecisionDispatch.tsx` (`handleError`).
- Display mode: `summary`, `full-diff`. `src/features/curation/lib/display-mode.ts` (`DisplayMode`).
- Selected item kind: `entity_match`, `disputed`. `src/features/curation/state/curation-store.ts` (`SelectedItemKind`).
- Review queue kind: `entity_match`, `disputed`. `src/features/curation/types.ts` (`ReviewQueueKind`).
- Assertion kind: `link`, `attribute`. `src/features/curation/types.ts` (`ItemKind`).
- Entity-match decision: `merge_into`, `keep_separate`. `src/features/curation/types.ts` (`EntityMatchDecision`).
- Dispute decision: `prefer_one`, `adjust_periods`, `keep_disputed`. `src/features/curation/types.ts` (`DisputeDecision`).
- Node status: `active`, `needs_review`, `merged`, `deleted`. `src/features/curation/types.ts` (`NodeStatus`).
- Assertion status: `active`, `uncertain`, `disputed`, `superseded`, `deleted`. `src/features/curation/types.ts` (`AssertionStatus`).
- Effective status: `active`, `uncertain`, `disputed`, `superseded`, `deleted`. `src/features/curation/types.ts` (`EffectiveStatus`).
- Basis for the start of validity: `stated`, `document`, `received`. `src/features/curation/types.ts` (`ValidFromSource`).
- Assertion flag: `uncertain`, `disputed`, `low_confidence`. `src/features/curation/types.ts` (`AssertionFlag`).
- Attribute value type: `text`, `date`, `number`, `bool`. `src/features/curation/types.ts` (`AttributeValueType`).
- Alias kind: `canonical`, `alias`. `src/features/curation/types.ts` (`NodeAliasWire.kind`).

## Upstream artifacts
- The review queue answers with `total`, `limit`, `offset` and `items`. `src/features/curation/types.ts` (`ReviewQueueListWire`).
- An entity-match review entry arrives with these fields. `src/features/curation/types.ts` (`EntityMatchQueueItemWire`, `EntityMatchCandidateWire`).
  - `kind: "entity_match"`
  - `node_id`
  - `node_type`
  - `canonical_name`
  - `created_at`
  - `candidates`, each with `candidate_node_id`, `canonical_name` and `similarity`.
- A disputed entry arrives with these fields. `src/features/curation/types.ts` (`DisputeQueueItemWire`, `DisputeScopeWire`, `DisputedItemSideWire`).
  - `kind: "disputed"`
  - `item_kind`
  - `created_at`
  - `scope`, with `source_node_id`, `target_node_id`, `link_type`, `node_id` and `attribute_key`.
  - `sides`, each with `item_id`, `value`, an optional `target_node_id`, `valid_from`, `valid_to`, `valid_from_source`, `confidence` and `status`.
- The curation metrics arrive with these fields. `src/features/curation/types.ts` (`CurationMetricsWire`).
  - `accept_rate`
  - `reject_rate_by_code`
  - `needs_review_count`
  - `uncertain_count`
  - `disputed_count`
  - `entity_match_queue_count`
  - `disputed_queue_count`
  - `computed_at`
- An entity-match resolution sends `decision`, an optional `target_node_id` and an optional `reason`. `src/features/curation/types.ts` (`ResolveEntityMatchRequest`).
- An entity-match resolution answers with `node_id`, `decision`, `resulting_status`, an optional `target_node_id`, `action_id`, and optional affected counts. `src/features/curation/types.ts` (`ResolveEntityMatchResponse`, `ResolveEntityMatchAffected`).
  - The affected counts are `links_repointed`, `attributes_repointed`, `aliases_copied` and `path_compressed_nodes`.
- A node merge sends `survivor_id`, `absorbed_id` and `reason`. `src/features/curation/types.ts` (`MergeNodesRequest`).
- A node merge answers with `survivor_id`, `absorbed_id`, all four affected counts and `action_id`. `src/features/curation/types.ts` (`MergeNodesResponse`).
- A dispute resolution sends these fields. `src/features/curation/types.ts` (`ResolveDisputeRequest`, `AdjustedPeriod`).
  - `item_kind`
  - `item_ids`
  - `decision`
  - An optional `winner_id`.
  - An optional `reason`.
  - Optional `periods`, each with `item_id`, `valid_from` and an optional `valid_to`.
- A dispute resolution answers with `item_kind`, `decision`, `action_id`, and `items`. `src/features/curation/types.ts` (`ResolveDisputeResponse`, `ResolveDisputeItemResult`).
  - Each item has `item_id`, `resulting_status`, and optional `valid_from` and `valid_to`.
- Confirming an item sends `item_kind`, `item_id` and an optional `reason`. `src/features/curation/types.ts` (`ConfirmItemRequest`).
- Rejecting an item sends `item_kind`, `item_id` and a `reason` that the type requires. `src/features/curation/types.ts` (`RejectItemRequest`).
- Confirming and rejecting answer with `item_kind`, `item_id`, `resulting_status` and `action_id`. `src/features/curation/types.ts` (`ItemActionResponse`).
- Correcting an item sends `item_kind`, `item_id`, a required `reason`, and the corrected values. `src/features/curation/types.ts` (`CorrectItemRequest`, `CorrectedValues`).
  - Every corrected value is optional: `value`, `target_node_id`, `valid_from`, `valid_to`, `valid_from_source` and `valid_from_fragment_id`.
- Correcting an item answers with `item_kind`, `predecessor_id`, `new_item_id` and `action_id`. `src/features/curation/types.ts` (`CorrectItemResponse`).
- The provenance answer lists `fragments`. Each fragment has `id`, `text`, `confidence`, `status` and `chunks`. `src/features/curation/types.ts` (`ProvenanceResponseWire`, `ProvenanceFragmentWire`).
  - Each chunk has `id`, `chunk_index`, `offset_start`, `offset_end`, `excerpt`, an optional `locator`, and its raw information.
  - The raw information has `id`, `source_type`, `received_at` and optional `metadata`.
- The accepted-fragment listing answers with `total`, `limit`, `offset` and `items`. `src/features/curation/types.ts` (`AcceptedFragmentListWire`, `AcceptedFragmentItemWire`, `AcceptedFragmentSourceRefWire`).
  - Each item has `fragment_id`, `text`, `confidence`, `llm_run_id`, `created_at` and a source.
  - The source has `raw_information_id`, `chunk_index`, `source_type`, `received_at` and an optional `document_title`.
- The node detail answers with `node`, `aliases` and `attributes`. `src/features/curation/types.ts` (`NodeDetailWire`, `NodeSummaryWire`, `NodeAliasWire`, `AttributeDetailWire`).
  - The node has `id`, `node_type`, `canonical_name`, `status` and an optional `merged_into_node_id`.
  - Each alias has `id`, `alias`, `kind` and an optional `created_at`.
  - Each attribute has `id`, `node_id`, `attribute_key`, `value_type`, `value`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `effective_status`, `is_current`, `is_in_effect` and `confidence`.
  - Each attribute may also have `valid_from_source`, `flags`, `supersedes_attribute_id` and `provenance`.
- Link history answers with `versions`. `src/features/curation/types.ts` (`LinkHistoryResponseWire`, `LinkDetailWire`).
  - Each version has `id`, `source_node_id`, `target_node_id`, `link_type`, `link_inverse_name`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `effective_status`, `is_current`, `is_in_effect` and `confidence`.
  - Each version may also have `valid_from_source` and `supersedes_link_id`.
- Attribute history answers with `versions`, each shaped as an attribute in the node detail. `src/features/curation/types.ts` (`AttributeHistoryResponseWire`).

## Outside the domain
- The JSDoc and inline comments, including their spec citations and the window length they state. They are text, not code. `src/features/curation/hooks/useCurationKeyboard.ts`, `src/features/curation/hooks/useCurationQueue.ts`, `src/features/curation/hooks/useDecisionDispatch.tsx`, `src/features/curation/lib/display-mode.ts`, `src/features/curation/state/curation-store.ts`, `src/features/curation/types.ts`.
- Holding the latest callbacks without re-attaching the listener, the optional `target` ref used to scope the listener in tests, and helpers exported for tests. These are wiring. `src/features/curation/hooks/useCurationKeyboard.ts`.
- The query key factory `curationKeys.queue(kind, 0)` and the request helpers `httpCuration`, `authHeader` and `toReviewQueueList`. These are wiring. `src/features/curation/hooks/useCurationQueue.ts`.
- The toast id built from `useId` plus `-undo-<id>`, the ref-based pending holder, the `eslint-disable-next-line` directive and the `DispatchedItemKind` re-export. These are wiring. `src/features/curation/hooks/useDecisionDispatch.tsx`.
- Using a Zustand store and `ReadonlySet` for batch selection. This is a framework choice. `src/features/curation/state/curation-store.ts`.
- The parallel camelCase shapes with dates parsed into `Date`. This is an internal representation. `src/features/curation/types.ts`.

## Observed and not decided here
- How many times a decision counts toward the session's resolved count depends on the decision. Both behaviors are in `src/features/curation/hooks/useDecisionDispatch.tsx`.
  - A destructive decision calls `advance()` in `dispatchDestructive` when it is made, and again in `commit` on success, or in `handleError` when the item is gone. So one decision adds two to `sessionResolved` and selects the next item twice.
  - A non-destructive decision calls `advance()` once, in `commit` on success.
- Whether a refused destructive decision puts its item back depends on the kind of failure. Both behaviors are in `src/features/curation/hooks/useDecisionDispatch.tsx` (`commit`).
  - An enveloped refusal whose code does not mean the item is gone puts the item back: `isDestructive && isEnvelopeError(err) && !VANISHED_CODES.has(err.code)` → `onItemRestore`.
  - A failure with no envelope, such as a network failure, shows «Algo deu errado. Tente novamente.» and leaves the item removed, because `isEnvelopeError(err)` is false and `onItemRestore` is never called.
