---
target: frontend
title: Proof for the reload after a saved edit
summary: Six tests mount EntityForm over a real node query whose reads come from a stubbed fetch and prove that, once the edit is accepted, the node is read again and the form, its item identities, the review and the reason start over, including when the reloaded node is deeply equal to the old one.
implementation: sha256:7d194812fbae7f69f913479542c3ae6576e7535706cb27f42aba147003b9b863
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-reload-after-save-suite-2
tests:
- file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
  name: reads the node again after the edit and shows every field with the value now current
  proves: Criteria "An accepted edit causes the knowledge node to be read again." and "After an accepted edit every field starts from the node's value now current." The recorded sequence is a GET of the node, the edit POST, then a GET of the node. The edited field shows the reloaded value, which differs from what was typed, and an untouched field shows its reloaded value.
  fails_when: An accepted edit causes no second read of /api/v1/nodes/n-1, the read comes before the POST, or either field still shows the value from before the save (the typed value, or the old title).
  demonstrates: rules/entity-workspace/a-saved-edit-reloads-the-entity
- file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
  name: names the attribute now current, not the superseded one, in the next edit it sends
  proves: UNDERDETERMINED note 1, item_id half. After the reload, a second edit of the same key sends a change whose item_id is the id of the attribute now current, and only that one change.
  fails_when: The reload shows the current values but each field keeps its item_id from before the save, so the second POST names the superseded attribute (at-status_text-1) instead of at-status_text-2.
- file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
  name: lists the value now current as the previous value when the next edit is reviewed
  proves: UNDERDETERMINED note 1, started_with half. After the reload, the review of a second edit shows the value now current as the previous value.
  fails_when: A field keeps started_with from before the save. The review then shows the superseded value as the previous one, or the form treats the reloaded field as already changed.
- file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
  name: closes the review, offering neither the open review nor the control to open it
  proves: UNDERDETERMINED note 2, review half. After an accepted edit no review panel is open and the control to review is not offered, because no field is changed.
  fails_when: The review panel stays open after the accepted edit, or the control to review is offered. For example the fields are reset against a stale baseline and still count as changed.
- file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
  name: clears the reason, so the next review has an empty reason field and no Salvar
  proves: UNDERDETERMINED note 2, reason half. After the reload, a new edit opened in review shows an empty reason field and does not offer Salvar until a new reason is typed.
  fails_when: The reason typed before the save survives into the next review, so the field is not empty or Salvar is offered without a new reason.
- file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
  name: starts over from the held values, with the reason cleared and the review closed, when the node read again is the same node
  proves: The structural-sharing trap behind "After an accepted edit every field starts from the node's value now current." The server answers a node deeply equal to the old one, so the node reference does not change. The value typed before the save, which differs from the held value, is still replaced by the held value, the review is not offered, and the next review has an empty reason.
  fails_when: The form is rebuilt only when the node reference changes. The typed value then survives the save, the control to review stays offered, or the reason is cleared only on the reference-change path.
files:
- path: src/features/entities/components/__tests__/entity-form-reload-support.tsx
  effect: A new helper shared by the spec. It mounts EntityForm in a router and QueryClientProvider, fed by the real useNodeRead query on entityKeys.node('n-1') whose reads come from a stubbed fetch. The stub answers the edit POST as accepted. It answers the node GET with a first node and, after the POST, either a second node (superseded and new current attributes with new ids) or the same node again. It also provides the wait for the refetch under fake timers, the recorded call sequence and the bodies of the edit POSTs.
not_applicable:
- edge_case: A multi-valued key, a disputed key or a closed-choice key among the reloaded fields
  why: The criterion states one requirement for every field, and the single-valued status field plus the untouched title are its representatives. Those key kinds are rebuilt by the shared buildFormValues, whose per-kind starting values the starting-values and multi-valued specs of the entity-form tasks already protect. A reload test per kind would multiply cases along a dimension this task does not alter.
- edge_case: Conflict, refused, unreachable or session-ended answers keeping typed values, reason and review
  why: They are the obligations of the conflict, failure and session-ended tasks, already proven by their own specs. This task asserts nothing about them, and a copy would be the same evidence twice.
- edge_case: A failed edit causing no read of the node
  why: No criterion or node states that a refusal does not read the node, so a test would assert a guarantee nobody made.
- edge_case: Salvar pressed again, or an undo, while the reload is in flight
  why: The busy guard and the undo window belong to the undo-window task and its tests. This task's two criteria do not reach them.
- edge_case: A slow answer to the reload
  why: No obligation states a time bound or an intermediate state for the reload. Whether the form restarts before or after the read settles is an implementation choice, so a test would pin an arrangement.
untested:
- 'domain/entity-workspace/entity-edit-session: the node describes one sitting (node_id, fields, reason, reviewing, undo_deadline and six operations) and states no finite checkable fact beyond the rule that constrains it. The tests above exercise only its fields, reason and reviewing after a save. Its other operations and the undo_deadline belong to other tasks, so no single test decides the node whole.'
- 'domain/entity-workspace/attribute-field: item_id, started_with, value and validity are exercised only after a reload (the item_id and previous-value tests). The node''s wider fact, what each field starts from on first open and what it lets the form tell apart, belongs to the entity-form tasks, so a test claiming the node would assert part of it as the whole.'
- 'contracts/entity-workspace/entity-screen: seven answers across four operations. This task owns one clause of save-edit, "then the form reloaded from the values now current", which the first test exercises. The other operations and the refusals belong to other tasks, so the node''s declared answers are not decided whole here.'
- 'contracts/entity-workspace/bff-entity-reads: four read operations. The first test records only that the read after the save is a GET of /api/v1/nodes/n-1. It does not check URL-encoding of the id, the absence of a query parameter, or the list, node-type and attribute-key reads, which belong to other tasks.'
- ADVISORY note of the task, a failed reload after the save, and the implementation's inference that no explicit reset is made when the reload failed or the node is absent from the cache. They are behavior that no criterion or node decides, and the note itself says no criterion addresses it, so no test pins the choice.
- The inference that the reset uses the attributeKeys of the render that confirmed the edit, so a catalog that changed during the five-second window is corrected only at the next props update. No node decides that behavior and no test pins it.
- The implementation's deferred cases, a refetch of the node caused by something other than the edit, and an edit accepted after the owner left the page. Neither is a criterion of this task, so they are not tested.
---
## What it is
This record proves task/review-and-save/reload-after-save.
It holds the specs and helpers listed in its tests and files.

## Notes
The run run/review-and-save-reload-after-save-suite was red with the diagnosis cause code (the session's baseline and attributes still came from the node prop after the restart); the tests were left as written, the implementation was revised, and run/review-and-save-reload-after-save-suite-2 passed.
