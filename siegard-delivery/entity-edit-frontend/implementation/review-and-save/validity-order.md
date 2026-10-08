---
target: frontend
title: Validity start precedes the end
summary: A changed temporal field that states both a validity start and a validity end with the start not strictly earlier than the end shows "O início deve ser anterior ao fim." on the validity end input and withholds only the save, leaving the review offered.
task: sha256:00c76f02655bfc6bbf0d33b156623bb5f42c4a045033d04194ef597cb51eb89f
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-validity-order-build
files:
- path: src/features/entities/components/entity-validity-order.ts
  effect: 'new: exports VALIDITY_ORDER_MESSAGE, the fixed text "O início deve ser anterior ao fim.". validityOrderMessage(validFrom, validTo) returns null when either side is the empty string. Otherwise it returns null when validFrom < validTo (string comparison of YYYY-MM-DD), and the message when the start is equal or later. validityOrderMessages(fields, changed, attributeKeys) returns one entry per field index: the message for a field that is changed and whose key isTemporal in the catalog and whose two dates fail the order, and null for every other field.'
- path: src/features/entities/components/use-entity-edit-form.ts
  effect: 'modified: computes validityOrder (memoised validityOrderMessages over the live useWatch values, the changed flags and the catalog) and validityOrderAccepted (true when every entry is null). Both are returned beside form, valueTypesAccepted, changed and review. validityOrderAccepted is passed to useEntityReview. The schema, the resolver and valueTypesAccepted are unchanged.'
- path: src/features/entities/components/use-entity-review.ts
  effect: 'modified: useEntityReview takes a last parameter, validityOrderAccepted. saveOffered is now open && validityOrderAccepted && isReasonAccepted(reason). offered, open, entries and the reason state are unchanged, so the review stays offered and open while an order violation stands and only the save is withheld.'
- path: src/features/entities/components/EntityForm.tsx
  effect: 'modified: takes validityOrder from the hook and passes it to every EntityFieldGroup.'
- path: src/features/entities/components/entity-field-group.tsx
  effect: 'modified: takes a validityOrder prop and passes validityOrder[index] ?? null to ValidityFields as orderMessage. Nothing else in the group changed.'
- path: src/features/entities/components/entity-validity-fields.tsx
  effect: 'modified: takes an orderMessage prop (string | null). With a message, the validity end input gets aria-invalid=true and aria-describedby naming both its note and the new error paragraph. The paragraph has id entity-valid-to-{id}-error, role=alert, data-testid entity-valid-to-error-{key} and the text-destructive token, and shows the message text. With null the end input and its note render as before.'
criteria:
- criterion: A start that is not strictly earlier than the end shows a message on the validity end field.
  met: true
  how: validityOrderMessage in entity-validity-order.ts returns VALIDITY_ORDER_MESSAGE when both dates are stated and validFrom < validTo is false, so an equal date also gets it. validityOrderMessages applies this per index for changed fields of temporal keys, and useEntityEditForm recomputes it from the live values as the owner types. entity-field-group.tsx passes the entry to ValidityFields, and entity-validity-fields.tsx renders it under the end input as a role=alert paragraph, with aria-invalid and aria-describedby on the end input. The text is the contract's fixed text, verbatim.
- criterion: A start that is not strictly earlier than the end withholds the save.
  met: true
  how: useEntityEditForm computes validityOrderAccepted (every message null) and passes it to useEntityReview. saveOffered there is open && validityOrderAccepted && isReasonAccepted(reason), so entity-review.tsx renders no Salvar button (entity-review-confirm) while a violation stands, whatever the reason holds. The save also reappears once the order is corrected.
- criterion: A start strictly earlier than the end does not raise this message.
  met: true
  how: validityOrderMessage returns null when validFrom < validTo, so no error paragraph renders, aria-invalid stays absent and validityOrderAccepted does not block the save.
- criterion: A field that states no validity end does not raise this message.
  met: true
  how: validityOrderMessage returns null when validTo is the empty string, whatever validFrom holds. A start left unstated is also the empty string and returns null, so the displayed 'today' is never compared with an end (second UNDERDETERMINED note).
nodes:
- node: rules/entity-workspace/validity-start-precedes-the-end
  encoded_at:
  - src/features/entities/components/entity-validity-order.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/use-entity-review.ts
  - src/features/entities/components/entity-validity-fields.tsx
  how: 'The invariant is validityOrderMessage in entity-validity-order.ts: it applies only when the owner gave both a start and an end, and it requires the start to be strictly earlier. The message shows on the end field in entity-validity-fields.tsx. The save is withheld through validityOrderAccepted in use-entity-edit-form.ts and saveOffered in use-entity-review.ts.'
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-validity-order.ts
  how: The check reads the field's valid_from and valid_to members (strings validFrom and validTo, empty meaning unstated, otherwise YYYY-MM-DD) from the delivered AttributeFieldValues. The shape of the field is declared in entity-form-schema.ts, which this task did not change.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-validity-order.ts
  - src/features/entities/components/entity-validity-fields.tsx
  - src/features/entities/components/use-entity-review.ts
  how: The show-review refusal for validity-start-precedes-the-end answers 'the message "O início deve ser anterior ao fim." on the validity end field and no save'. The text is VALIDITY_ORDER_MESSAGE, it shows on the end field, and the save is not offered. The review stays offered, because the contract's answer names no withdrawal of the review. The other operations and refusals of the contract are not reached by this task.
inferences:
- inferred: The check covers only fields whose validity inputs are offered (changed fields of temporal keys). An unchanged field that still holds typed validity is not checked and does not block the save.
  from: The rule is silent on unchanged fields. The validity-fields record keeps typed validity on a field that stops being changed, and an unchanged field sends no change, so it reaches no payload. A message on an end input that is no longer rendered would be invisible, and a hidden gate would withhold the save with no explanation.
- inferred: Only the save is withheld and the review stays offered and open. The refusal is not part of the schema, and valueTypesAccepted is untouched.
  from: The task criteria say the message shows and the save is withheld. The contract's value-type refusal says 'no review is offered', whereas the order refusal says 'no save'. Putting the check in the Zod schema would have flipped schema.safeParse, and so valueTypesAccepted and offered, which would close the review.
- inferred: The message is derived UI state, computed per field index in the hook and passed down as props. It is not an RHF error, and the form's errors and resolver are not involved.
  from: The least invasive route. Routing it through the resolver would reuse the value-type error path and its gate (valueTypesAccepted and the review's offered). The validity-fields record states that validity is not part of the schema refinement. The message is live because it is recomputed from useWatch values on every keystroke.
- inferred: An emptied field of a temporal key (a removal) is checked like any changed field, since its validity inputs are offered.
  from: The validity-fields record treats an emptied field as changed and offers validity there. The rule makes no exception for it, and the order check follows the inputs that are shown.
- inferred: Strict ordering is plain string comparison (validFrom < validTo) on the YYYY-MM-DD values the native date inputs produce. Equal dates are refused.
  from: The task's instruction and the rule's 'strictly earlier'. A native date input yields a four-digit-year date or an empty value, so lexicographic order equals chronological order for those.
- inferred: The validity end input's accessible description is its note plus the error paragraph, and the error is a role=alert paragraph with text-destructive, the same pattern as the value-type error in entity-field-group.tsx. The review panel itself shows no order message.
  from: No node asks for the message in the review item. The contract says the message shows on the validity end field.
divergences:
- from: The standard's rule FRM-01 (a form is schema-first with React Hook Form and Zod), whose scope reaches .tsx files and so not src/features/entities/components/entity-validity-order.ts where the departure sits
  departure: The order check is a pure function outside the Zod schema, and its message is not delivered through the form's resolver or formState.errors.
  why: Placing it in the schema would make schema.safeParse fail, which would flip valueTypesAccepted and withdraw the whole review, while the contract and criteria withhold only the save. The form still takes the schema-first path for value types, through the local zodIssueResolver. The same file also contains the check's decision logic with the rest of the form's validation split across two places.
preserved:
- 'The value-type gate is unchanged: the schema superRefine, the resolver, valueTypesAccepted, data-value-types-accepted, and the value field''s error message and aria wiring.'
- The review is offered only while a field is changed and every value reads as its key's type. The review's entries, effects, validity display (start shown as today when unstated), removed entries, and the focus move are unchanged.
- 'The reason gate is unchanged: saveOffered still requires a reason of 1 to 1000 trimmed UTF-16 code units, and the reason state is kept as before.'
- 'The validity inputs are still offered only for changed fields of temporal keys, an unstated start still shows the ''hoje'' note, and the end input keeps its ''Opcional: pode ficar vazio.'' note.'
- Field groups, multi-valued add and remove, closed choices, disputed keys and outside-catalog values are untouched.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts and src/lib/error-routing.ts are untouched. No dependency was added. No forwardRef, no GlassSurface, no sibling-feature import, no header entry or graph button, no comment written. zodIssueResolver stays the resolver.
deferred:
- what: 'Tests: none cover the order check. Existing specs that mount EntityForm are unaffected unless they type an equal or inverted pair. Any spec that calls useEntityReview directly would need its new last argument.'
  why: Writing tests is another judge's role. I found no caller of useEntityReview outside use-entity-edit-form.ts.
- what: While the save is withheld for order, the open review shows no text saying why. The message lives only on the validity end field in the form above the panel.
  why: No node asks for the message in the review. Adding one would be a choice no node states.
- what: The edit-payload and confirm-save tasks must re-check review.saveOffered, which now includes the order gate, before sending.
  why: Sending belongs to the undo-window and payload tasks.
- what: Years beyond four digits (six-digit years some browsers accept in date inputs) would compare wrongly under plain string ordering.
  why: The task prescribes lexicographic comparison of YYYY-MM-DD strings. Handling extended years would need a decision the specification does not hold.
---
## What it is


## Notes
None.
