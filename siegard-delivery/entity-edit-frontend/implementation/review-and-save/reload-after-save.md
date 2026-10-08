---
target: frontend
title: Reload after a saved edit
summary: After the knowledge base accepts an edit, the saved node is read again, and the whole basis of the session (fields, baseline, attributes, review, reason, payload) restarts from the reloaded node.
task: sha256:5cf88ff609a0c825f137e1e4f1392dad977e12242a7e9f97ab6312731a652dbe
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-reload-after-save-build-2
files:
- path: src/features/entities/api/node.hooks.ts
  effect: Adds useReloadedNode, which returns a function (nodeId) that gives the node held under entityKeys.node(nodeId) only when that query's last fetch succeeded, and undefined otherwise. useNodeRead is unchanged. This is how the form reads the node the reload delivered without owning a second query.
- path: src/features/entities/components/use-undoable-save.ts
  effect: useUndoableSave takes a fourth parameter, restart(reloaded). On an accepted outcome it still calls clearReason(). It now also calls closeReview(), reads the reloaded node through useReloadedNode, and calls restart with it if there is one. Then it stores the outcome as before. The conflict, refused, unreachable and session-ended paths, the timer, the undo, the busy guard and the clearing of the outcome at each confirmation are unchanged. Those paths still do no reset, no reason clear, no review close and no restart.
- path: src/features/entities/components/use-entity-edit-form.ts
  effect: The hook now takes the mounted node as propNode and derives an effective node = restarted ?? propNode. `restarted` is state holding the reloaded node. It is dropped by a render-phase comparison (seenPropNode state) as soon as the propNode reference changes, so the prop wins again once it catches up. Everything is computed from the effective node. That covers the baseline `values`, the reset effect, the attributes handed to changedFlags, useEntityReview (and so reviewEntriesOf), buildEntityEdit (and so changeOfField) and the node id sent. The restart callback given to useUndoableSave sets `restarted` and calls reset(buildFormValues(reloaded, attributeKeys)). The explicit reset is kept so the form restarts even when the reloaded node has the same reference as the one already held. The hook now also returns `node`, the effective node. The existing effect that resets when `values` changes is kept.
- path: src/features/entities/components/EntityForm.tsx
  effect: Renames the incoming prop to mountedNode, passes it to useEntityEditForm, and takes the effective `node` the hook returns. buildFieldGroups (disputed keys, held values) and outsideCatalogGroupsOf are therefore computed from the reloaded node after a save. The props, the layout and the children are otherwise unchanged.
criteria:
- criterion: An accepted edit causes the knowledge node to be read again.
  met: true
  how: 'Checked end to end, and no fix was needed. useEditEntity.onSuccess (api/edit.hooks.ts) runs `await queryClient.invalidateQueries({ queryKey: entityKeys.node(nodeId) })` only for kind "accepted". useNodeRead (api/node.hooks.ts) uses that same key, entityKeys.node(nodeId) = ["entities","node",nodeId], and has no `enabled` option. EntityPage mounts it, so it is an active query. invalidateQueries marks the query invalid and calls refetchQueries with type ''active'' and cancelRefetch true (@tanstack/query-core queryClient.ts). The 5-minute STABLE_STALE_MS in createQueryClient therefore cannot skip the read, because the refetch is forced rather than staleness-driven. In mutation.ts (query-core 5.x) options.onSuccess is awaited before the mutation promise settles. So mutateAsync in useUndoableSave.send resolves only after the refetch has settled. At that moment the cache already holds the reloaded node. A conflict, refusal or unreachable outcome invalidates nothing.'
- criterion: After an accepted edit every field starts from the node's value now current.
  met: true
  how: In send(), on accepted, useReloadedNode gives the node the reload delivered, and restart in use-entity-edit-form.ts both stores it as `restarted` and runs reset(buildFormValues(reloaded, attributeKeys)). buildFormValues (entity-form-schema.ts) builds each field from the attribute now current (fieldStartingFrom). Its itemId is attribute.id, its startedWith and value are attribute.value, and its validity is empty. The session's whole basis is the reloaded node, not just the field values. Because the effective node is the reloaded one, `values` (the baseline), changedFlags, the attributes given to useEntityReview, reviewEntriesOf, buildEntityEdit and changeOfField all read the new attribute ids. A next edit therefore names the attribute now current, and no removal is invented for the superseded one. With no changed field, `offered` is false, so the review control is not offered. This does not depend on the node prop having caught up, since props can lag a render behind. It does not depend on the node reference changing either. TanStack's structural sharing keeps the same reference when the reloaded node is deeply equal, and the explicit reset runs in that case too. When the prop arrives (its reference differs from the one last seen), `restarted` is dropped during render and the prop, which is the same cache data, wins again. The reason is cleared by clearReason() and the review is closed by closeReview(). The accepted outcome renders no alert (EntitySaveAlert default branch). Earlier conflict, refusal and unreachable alerts were already removed by setOutcome(null) at confirmation.
nodes:
- node: rules/entity-workspace/a-saved-edit-reloads-the-entity
  encoded_at:
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/api/node.hooks.ts
  - src/features/entities/components/use-undoable-save.ts
  - src/features/entities/components/use-entity-edit-form.ts
  how: The invariant has two clauses. First, a saved edit reloads the node. useEditEntity invalidates and awaits the refetch of the page's useNodeRead query, which is the part already delivered and verified here. Second, the form starts again from the values now current. The accepted branch of useUndoableSave.send reads the reloaded node through useReloadedNode, and the form hook makes it the effective node and resets the fields to buildFormValues of it, whether or not the reference changed. edit.hooks.ts was not modified.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  - src/features/entities/components/use-entity-edit-form.ts
  how: After an accepted edit the session starts over. fields are rebuilt from the node now current, and the baseline and the attributes the session compares against and sends from are that same node. reason is cleared (clearReason). reviewing is closed (closeReview). The five-second undo_deadline timer has already fired and the busy guard is released when the send settles. node_id is unchanged, because the same node is reloaded. discard-changes is not reached.
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/use-entity-edit-form.ts
  how: attribute_key, item_id, started_with, value, valid_from and valid_to of each field are rebuilt by buildFormValues from the reloaded node, so item_id names the attribute now current and started_with is its value now. The comparison that tells what the owner changed (changedFlags) also reads the reloaded node's attributes. entity-form-schema.ts already declares the field's shape and was not modified. use-entity-edit-form.ts is where the rebuild is applied after a save.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/EntityForm.tsx
  how: The save-edit answer 'then the form reloaded from the values now current' is encoded, and the field groups are drawn from the reloaded node. The refusals (conflict, any other cause, cannot be reached) keep every typed value and are untouched. The task's ADVISORY note about a failed reload is answered by existing behavior. EntityPage shows the form-could-not-be-loaded alert when the refetch ends in error, and useReloadedNode returns nothing unless the query's last fetch succeeded.
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/api/node.hooks.ts
  how: The read-node operation is the one GET /api/v1/nodes/{node_id} that useNodeRead already makes, with the same key. The reload is that same read repeated through invalidation, so no new request and no new failure is added. useReloadedNode only reads the cache and calls nothing.
inferences:
- inferred: The fresh node is taken from the query cache (getQueryState on entityKeys.node(nodeId), only when its status is success) at the moment the accepted outcome arrives, and not from the EntityForm props or a data timestamp passed down from EntityPage. No prop was added to EntityPage, and EntityForm's props are unchanged.
  from: onSuccess of useEditEntity awaits invalidateQueries, which awaits the refetch of active queries, and the mutation promise settles only after options.onSuccess (query-core mutation.ts). At that point the cache is already fresh. The component's props may lag a render behind (notifications are batched), so a prop-based reset keyed on the accepted outcome would risk using the stale node. Reading the cache makes the freshness independent of render order, and it covers the case where structural sharing keeps the same reference.
- inferred: The restarted node is dropped when the node prop's reference differs from the one last rendered (a render-phase comparison with state, the same pattern as use-entity-review.ts). It is not dropped by comparing with a reference captured at restart time.
  from: The restart's closure comes from the confirm render, so a reference captured there could already be stale. Any later change of the prop comes from the same query cache, and the cache only moves forward, so a changed prop is at least as fresh as the restarted node. When the prop arrives it is the very reference that was reloaded, so the effective node does not change, `values` is not recomputed, and no second reset runs. If the prop is a distinct object of equal content, the existing effect resets once more to equal values.
- inferred: When the reload failed (query status error with the old data kept) or the node is absent from the cache, no restart is made.
  from: The task's ADVISORY note on a failed reload says it is answered by the refusals of show-entity-form and read-node. EntityPage replaces the form with the could-not-be-loaded alert when nodeQuery.isError. Restarting from a node the reload did not deliver would break 'must use the fresh node'. In an EntityForm mounted alone, with no node query, there is nothing fresh to restart from, and the props-driven effect handles any later node.
- inferred: closeReview() is called explicitly on accepted, in addition to the review's own render-time auto-close.
  from: The rule 'if (reviewing && !offered) setReviewing(false)' in use-entity-review.ts closes the review once no field is changed, and `offered` depends only on changes, so `reviewing` cannot stay latched. The task's UNDERDETERMINED note asks that the review be closed, and the explicit call makes the closing independent of render order.
- inferred: restart uses the attributeKeys of the render that confirmed the edit, because the timer's closure comes from that render.
  from: The catalog is stable data (5-minute staleTime). The effect keyed on `values` runs again with the current catalog when it changes, so a catalog that moved during the five seconds is corrected then.
- inferred: EntityForm builds its field groups and the outside-catalog values from the effective node the hook returns, not from the mounted prop.
  from: The groups use the node's attributes (disputed keys, held values). If they stayed on the stale prop for the render before it catches up, a field could be drawn against a different node from the one its values were built from.
preserved:
- The review is offered only while a field is changed and every value reads as its key's type. The reason gate on Salvar (1 to 1000 code units) and the validity-order gate are unchanged.
- The five-second undo window is unchanged. It still sends once only after five seconds, the undo still sends nothing and leaves the form, the reason and the review as they were, and the busy guard and the outcome clearing at each confirmation are untouched.
- The conflict, refused, unreachable and session-ended paths keep every typed value and do no reset, no restart, no reason clear, no review close and no invalidation. The review stays as typed. The alerts in entity-save-alert.tsx are untouched.
- The existing reset on a change of the node or catalog props keeps working. It runs from the effective node, which is the prop whenever nothing was restarted. A restart does not cause an extra reset when the prop arrives with the same reference.
- useEditEntity (typed outcomes, accepted-only invalidation of entityKeys.node), buildEntityEdit and the payload are unchanged.
- The field groups, multi-valued add and remove, closed choices, validity inputs, disputed keys and outside-catalog values are untouched. zodIssueResolver is still the form's resolver.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts and src/lib/error-routing.ts are untouched. No dependency was added, no forwardRef, no GlassSurface, no sibling-feature import, no header menu entry or graph-panel button, and no comment written.
deferred:
- what: 'No test covers the reload. The cases that would prove it are: the node read again after an accepted edit; every field starting from the reloaded value with the new item_id and started_with; a reloaded node deeply equal to the old one still resetting the form; the reason cleared and the review closed and not offered; the next edit''s payload and review naming only the new attribute; no restart on a conflict, refusal or unreachable outcome.'
  why: Writing tests belongs to another judge.
- what: Existing EntityForm specs that mount EntityForm without a QueryClientProvider need one, because useUndoableSave now also calls useQueryClient through useReloadedNode. EntityForm already needed one for useEditEntity (see the undo-window record).
  why: Tests belong to another judge. The EntityPage specs already wrap a provider.
- what: A refetch of the node caused by something other than the edit would still reset the form if the reloaded node differs in content. Equal content keeps the reference, so nothing resets.
  why: It sits in the delivered reset-on-props behavior of use-entity-edit-form.ts and is not part of the saved-edit path. It was already deferred by the conflict and failure records.
- what: If the owner leaves the page during the five-second window and the edit is accepted afterward, restart runs on a form that is no longer mounted. It does nothing visible, and the node query is inactive so it is not refetched by the invalidation.
  why: That follows the earlier decision that the timer outlives the page (undo-window record). The next visit reads the node from scratch.
- what: The node header on EntityPage still reads the prop node, so it shows the reloaded node one render after the form does.
  why: EntityPage is outside the form's session and catches up on its own with the same query data. The task does not reach it.
---
## What it is


## Notes
The first build, run/review-and-save-reload-after-save-build, passed; the first suite run was red because the baseline and the attributes of the session still came from the node prop after the explicit restart (diagnosis cause code); the implementation was revised to make the reloaded node the effective node of the whole session, and run/review-and-save-reload-after-save-build-2 passed.
