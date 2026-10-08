---
target: frontend
title: One field group per catalog key, starting from current values
summary: The entity form now renders one labelled group per catalog attribute key in catalog order, each with a plain text field that starts from the node's current attribute value (or empty) and the key's description as help text, over a Zod and React Hook Form state that the sibling tasks can extend.
task: sha256:6e4ed776060b206f7420c3a88df5a619fc8da7b7fee5ecb2fcc1c98b1cd65845
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-field-groups-build
files:
- path: src/features/entities/components/entity-form-schema.ts
  effect: 'new: declares the form state and the pure builders; the state is the Zod schema entityFormSchema, a flat fields array of { attributeKey, itemId (string or null), startedWith, value }, with the inferred types EntityFormValues and AttributeFieldValues; buildFormValues produces one entry per catalog key in catalog order, taking the first attribute of that key whose isCurrent is true, with startedWith and value that attribute''s value (empty when none) and itemId its id (null when none), and a key holding an attribute whose status is disputed gets no entry; buildFieldGroups maps each catalog key, in order, to its field indexes and flags a key as disputed or not.'
- path: src/features/entities/components/entity-field-group.tsx
  effect: 'new: renders a role=group container labelled by the key''s title (a Label tied to the field by htmlFor, or a plain title when the key has no field); each field is a ui-kit Input wrapped in a Controller on fields.{index}.value; the key''s catalog description is shown as help text linked to the input through aria-describedby, and when the description is null or empty no help text and no aria-describedby are rendered.'
- path: src/features/entities/components/EntityForm.tsx
  effect: 'modified: keeps its props contract (node, attributeKeys), its aria-label "Formulário de edição" and its data-testid entity-form; builds the values and groups with useMemo and runs useForm with zodResolver(entityFormSchema) and those values as defaultValues; a useEffect calls reset(values) whenever the node or catalog data changes; renders one EntityFieldGroup per catalog key in catalog order; submission is held with preventDefault so pressing Enter in a field cannot reload the page.'
criteria:
- criterion: The form holds one group of fields for each attribute key the catalog holds for the node's type.
  met: true
  how: buildFieldGroups maps every entry of attributeKeys (the catalog read for the node's type) to a FieldGroup and EntityForm renders one EntityFieldGroup per entry; a disputed key still gets its group (title and help text) but renders no input, the minimal choice recorded under inferences, and the disputed-keys task owns what that group shows.
- criterion: The groups follow the order in which the catalog lists the keys.
  met: true
  how: buildFieldGroups and buildFormValues iterate attributeKeys in the order received and nothing sorts it; the groups array maps straight to the rendered order.
- criterion: A field of a key for which the node holds a current attribute starts with that attribute's value.
  met: true
  how: buildFormValues takes currentAttributeOf, the first attribute with the key and isCurrent true, and sets both value and startedWith to its value; the same values are the RHF defaultValues and the reset(values) argument.
- criterion: A field of a key for which the node holds no current attribute starts empty.
  met: true
  how: With no current attribute, startedWith and value are empty and itemId is null, so the Input renders empty; an attribute that is not current is ignored for the starting value.
- criterion: Each field shows as its help text the description the catalog holds for its key.
  met: true
  how: entity-field-group.tsx renders attributeKey.description in a p with an id that the input references through aria-describedby; a null or empty description renders nothing.
nodes:
- node: rules/entity-workspace/the-form-has-a-field-group-per-catalog-key
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/EntityForm.tsx
  how: One FieldGroup per catalog key, built in catalog order by buildFieldGroups and rendered one-to-one by EntityForm; the catalog read itself comes from the existing useAttributeKeys hook through EntityPage and is not re-sorted.
- node: rules/entity-workspace/fields-start-from-the-current-values
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/EntityForm.tsx
  how: buildFormValues seeds value and startedWith from the key's attribute with isCurrent true and seeds empty when none is held, reading status only for the disputed check; EntityForm loads them through defaultValues and reset.
- node: rules/entity-workspace/a-field-shows-its-key-description-as-help-text
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  how: The help text is the key's catalog description, shown under the field and linked with aria-describedby; the error-description part of an-invalid-field-is-described is not reached because there are no errors yet.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/EntityForm.tsx
  how: entityFormSchema.fields is the session's fields (one attribute-field per key); EntityForm holds them in RHF state, loaded from the node, and nothing is sent; reason, reviewing, undo_deadline and the operations change-field, review-changes, confirm-save, undo-save and discard-changes are not reached, though typing is already held in the form state as change-field implies.
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  how: attributeFieldSchema carries attribute_key as attributeKey, item_id as itemId (the id of the current attribute it started from, null if none), startedWith and value; valid_from and valid_to are not in the shape yet because the validity task adds them.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/entity-field-group.tsx
  how: Encodes the show-entity-form answer for one group of fields per attribute key, each field holding the current value and its help text; the closed keys' allowed values, the disputed-key refusal answer, show-review and save-edit are not reached; the contract names "help text" without its source and the description is the reading the task's note fixes.
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  how: Consumes the already-delivered read-node attributes (isCurrent, status, value, id) and the list-attribute-keys items (key, description) as given, adds no request, and keeps the order the contract states.
inferences:
- inferred: '"Current" means the node read''s own flag, NodeAttribute.isCurrent === true; when a key holds several such attributes, the first in the read''s order seeds the single field; no status filtering is applied beyond the disputed check.'
  from: fields-start-from-the-current-values says "current attribute" and the wire facts list is_current per attribute; an unfiltered read of that flag is the least reading, and the multi-valued task owns the several-current case.
- inferred: A key counts as disputed when any attribute of the node with that key has status disputed, whether or not it is current; for such a key the form state holds no field entry (nothing is prefilled) and the group shows only its title and help text, with no input, no values and no curation pointer.
  from: The rule a-disputed-key-shows-without-a-field-and-points-to-curation, with its decision log entry, defines a disputed key by status only; prefilling a field there would break that rule; it is the minimal choice that stops the skeleton from violating the rule, and the disputed-keys task adds the values display and the pointer.
- inferred: The form state is a flat array fields of { attributeKey, itemId, startedWith, value }; field identity is the position in the array and a group finds its fields through fieldIndexes (entries whose attributeKey equals the key); today each editable key has exactly one entry; itemId is the current attribute's id (null when none) and startedWith is a copy of the starting value used to tell changed from unchanged.
  from: The nodes entity-edit-session (fields, many of attribute-field) and attribute-field (attribute_key, item_id, started_with, value, valid_from, valid_to) and the rules a-field-is-changed-only-by-its-value and a-field-added-to-a-multi-valued-key-starts-empty, which need the started-with value and the item id per field; a flat array lets the multi-valued task use several entries per key without rewriting the groups.
- inferred: valid_from and valid_to are left out of the field schema for now and are expected to be added as nullable strings by the validity task.
  from: Validity fields are explicitly owned by a sibling task; adding them now would be unused state.
- inferred: Each field is a plain text input (type text), whatever the key's value type.
  from: The task brief and scope discipline assign value-type inputs and closed-key choices to sibling tasks.
- inferred: The visible label of each group is the key's name as the catalog gives it, and the help text is omitted when the description is null or empty; the role=group container and its title are structural choices.
  from: AttributeKey carries only key and description as text, and the entity-screen contract says "help text" without naming its source; WCAG 2.2 AA needs a label and a described-by link.
- inferred: Typed values are reset to the node's current values whenever the node or catalog data reference changes (a useEffect calling reset(values)), and Enter in a field does not submit (preventDefault).
  from: The brief asks for form.reset(data) to load server data; a form with no handler and one text field would otherwise reload the page on Enter, and the review and save flow is a later task.
preserved:
- 'EntityForm keeps its props contract { node: NodeRead, attributeKeys: readonly AttributeKey[] }, its aria-label "Formulário de edição" and its data-testid entity-form.'
- EntityPage.tsx, entity-page-parts.tsx and entity-page-helpers.ts (loading, not-found, deleted and could-not-load states, the non-active node's attribute list, the header) are untouched.
- The entities api hooks, keys, transforms and types.ts, src/lib/http.ts, query-client.ts and error-routing.ts, the router, the header and the graph panel, and everything under backend/ are unchanged.
- No dependency was added; zod, react-hook-form and @hookform/resolvers are the ones CorrectionForm already uses.
deferred:
- what: 'Disputed keys: the skeleton renders only the title and help text for a key holding a disputed attribute and creates no field entry; still owed are the key''s values, the pointer to the curation workspace and the link to the queue.'
  why: Owned by the disputed-keys task; this task only avoids prefilling an editable field there.
- what: 'Attributes outside the catalog: a held attribute whose key the catalog does not list has no group, since groups come only from the catalog.'
  why: Owned by the attributes-outside-the-catalog task.
- what: 'Multi-valued keys: a key that allows multiple values currently gets one field seeded from the first current attribute; the flat fields array identified by { attributeKey, itemId } lets that task emit one entry per current attribute, append added entries with itemId null and empty values, and let buildFieldGroups return all indexes; EntityFieldGroup already loops over fieldIndexes; switching to useFieldArray and adding and removing controls are that task''s work.'
  why: Owned by the multi-valued-fields task.
- what: Value-type inputs, closed-key choices with allowed values, the validity fields (validFrom and validTo on attributeFieldSchema), the value-type error messages and aria-invalid and error text from formState.errors, the changed-field computation (value versus startedWith), the review, the reason, the save, the undo and the conflict handling.
  why: Each is a sibling task of the field-groups task.
- what: A refetch that changes the node data (for example after a save, or a window-focus refetch that returns different data) resets the form and replaces typed values; keeping typed values on a conflict is the save task's rule, so it must replace or gate the reset effect in EntityForm.
  why: The reload and conflict behavior belongs to the review and save tasks; this task only loads the starting values.
---
## What it is
This record answers task/entity-form/field-groups.
It holds the form's field groups, their Zod and React Hook Form state and the starting values.

## Notes
The build passed on its first run, run/entity-form-field-groups-build.
