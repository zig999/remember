---
contract_version: siegard-reconcile/9
title: 'Entity edit screen: listing, form, review, save and undo'
summary: These files were written by the deliveries of the 21 tasks of the initiative entity-edit-frontend,
  which build the /entities listing, the /entities/{node} form with its review, save and undo, the client
  of the four reads and the edit request, and the two lazy routes in the protected layout.
target: frontend
files:
- path: src/features/entities/api/__tests__/attribute-keys.spec.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads.
- path: src/features/entities/api/__tests__/edit-outcomes-aborted.spec.ts
  change: Written by the delivery of task/review-and-save/other-save-failures.
- path: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  change: Written by the delivery of task/knowledge-base-client/edit-request.
- path: src/features/entities/api/__tests__/edit-request-cutoff.spec.ts
  change: Written by the delivery of task/knowledge-base-client/edit-request.
- path: src/features/entities/api/__tests__/edit-request-failures.spec.ts
  change: Written by the delivery of task/knowledge-base-client/edit-request.
- path: src/features/entities/api/__tests__/edit-request-sending.spec.ts
  change: Written by the delivery of task/knowledge-base-client/edit-request.
- path: src/features/entities/api/__tests__/edit-request-session.spec.ts
  change: Written by the delivery of task/knowledge-base-client/edit-request.
- path: src/features/entities/api/__tests__/edit-request-wire.spec.ts
  change: Written by the delivery of task/knowledge-base-client/edit-request.
- path: src/features/entities/api/__tests__/edit-support.ts
  change: Written by the delivery of task/knowledge-base-client/edit-request.
- path: src/features/entities/api/__tests__/listing-failures.spec.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads.
- path: src/features/entities/api/__tests__/listing-requests.spec.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads.
- path: src/features/entities/api/__tests__/listing-session.spec.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads.
- path: src/features/entities/api/__tests__/listing-through-http.spec.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads.
- path: src/features/entities/api/__tests__/listing-timing.spec.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads.
- path: src/features/entities/api/__tests__/node-catalog-cases.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads.
- path: src/features/entities/api/__tests__/node-catalog-failures.spec.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads.
- path: src/features/entities/api/__tests__/node-catalog-refresh.spec.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads.
- path: src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads.
- path: src/features/entities/api/__tests__/node-catalog-token.spec.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads.
- path: src/features/entities/api/__tests__/node-read.spec.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads.
- path: src/features/entities/api/__tests__/support.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads.
- path: src/features/entities/api/_edit-request.ts
  change: 'By the delivery of task/knowledge-base-client/edit-request: new: entityEdit sends POST /api/v1/nodes/{node_id}/edit
    with the id URL-encoded, a JSON body and a Bearer header re-read on each attempt; each attempt has
    its own 30000 ms cutoff and relays the caller''s cancellation; a 2xx is read without an envelope as
    { node_id, action_id, applied }; a non-2xx with a readable error.code fails with the status, code,
    message (when a string) and details read from the body; without a readable code it always fails with
    the fixed text of its branch, ignoring any body message, and without details, as SYSTEM_UPSTREAM (500
    or above) or SYSTEM_UNKNOWN (below 500); a non-JSON 2xx fails with SYSTEM_INVALID_RESPONSE; no answer
    fails with SYSTEM_TIMEOUT, SYSTEM_ABORTED or SYSTEM_NETWORK; a first-attempt 401 starts one refresh
    and one repeat, and a failed refresh clears the token, goes to /sign-in?reason=session_expired and
    fails with AUTH_SESSION_EXPIRED (401). Exports entityEdit and __setEditRedirectForTests.'
- path: src/features/entities/api/_request.ts
  change: 'By the delivery of task/knowledge-base-client/listing-reads: defines bearerHeaders(), which
    builds the Authorization header on top of the curation feature''s authHeader() and re-reads the token
    each time fetch reads the headers, and entityGet<T>(), a GET that calls http<T>() from src/lib/http.ts
    with that header and the caller''s abort signal and returns or throws exactly what http<T>() does,
    adding no fetch, timeout, refresh or error logic of its own.'
- path: src/features/entities/api/_transforms.ts
  change: 'By the delivery of task/knowledge-base-client/edit-request: extended: adds toEntityEditWire,
    which writes the six members of every change always present with null for an empty member and null
    in value, valid_from and valid_to on a remove change, and toEditAccepted and toAppliedChange, which
    map the accepted answer to camelCase. By the delivery of task/knowledge-base-client/listing-reads:
    maps the wire shapes to domain shapes (toNodeType, toNodeTypes, toListedNode, toNodeListing), renaming
    node_type, canonical_name and merged_into and keeping the total. By the delivery of task/knowledge-base-client/node-and-catalog-reads:
    extended: adds toNodeSummary, toNodeAlias, toNodeAttribute, toNodeRead, toAllowedValue, toAttributeKey
    and toAttributeKeys, leaving the node-type and listing transforms unchanged.'
- path: src/features/entities/api/catalog.hooks.ts
  change: 'By the delivery of task/knowledge-base-client/node-and-catalog-reads: new: useAttributeKeys(nodeType)
    sends GET /api/v1/attribute-keys?node_type=<name> through entityGet and maps the items with toAttributeKeys
    in wire order, and the query is disabled while nodeType is null or empty.'
- path: src/features/entities/api/edit.hooks.ts
  change: 'By the delivery of task/knowledge-base-client/edit-request: new: useEditEntity, a useMutation
    returning as a value, never thrown, the typed outcome accepted, conflict, refused or unreachable;
    BUSINESS_ENTITY_EDIT_CONFLICT becomes conflict with the key and item of the details (item null where
    none); SYSTEM_NETWORK and SYSTEM_TIMEOUT become unreachable; any other failure becomes refused with
    code, status, message and details; an accepted edit invalidates entityKeys.node(nodeId). By the delivery
    of task/review-and-save/other-save-failures: Fixes the failure classification to match rules/entity-workspace/a-save-failure-is-classified-by-its-code.
    SYSTEM_ABORTED joins SYSTEM_NETWORK and SYSTEM_TIMEOUT as "unreachable". AUTH_SESSION_EXPIRED now
    returns the value { kind: "session-ended" }. Every other EnvelopeError stays "refused" with code,
    status, message and details. That covers SYSTEM_INVALID_RESPONSE, SYSTEM_UPSTREAM, SYSTEM_UNKNOWN,
    SYSTEM_SERVICE_UNAVAILABLE and any readable body code. The conflict, the accepted-only invalidation
    and the rethrow of non-EnvelopeError errors are unchanged.'
- path: src/features/entities/api/keys.ts
  change: 'By the delivery of task/knowledge-base-client/listing-reads: holds the query-key factory entityKeys
    under the entities prefix, with separate keys for the node types and for each (name prefix, node type)
    listing, sharing no prefix with the graph or curation nodes keys. By the delivery of task/knowledge-base-client/node-and-catalog-reads:
    extended: adds node(nodeId) and attributeKeys(nodeType) under the entities prefix, leaving the graph
    and curation nodes prefix untouched.'
- path: src/features/entities/api/listing.hooks.ts
  change: 'By the delivery of task/knowledge-base-client/listing-reads: defines useNodeTypes(), which
    requests GET /api/v1/node-types with no parameter, and useNodeListing(narrowing), which requests GET
    /api/v1/nodes with name_prefix and node_type only when each is a non-empty string, both passing the
    query''s abort signal.'
- path: src/features/entities/api/node.hooks.ts
  change: 'By the delivery of task/knowledge-base-client/node-and-catalog-reads: new: useNodeRead(nodeId)
    sends GET /api/v1/nodes/{encodeURIComponent(nodeId)} with no query string through entityGet and maps
    the answer with toNodeRead under the key entityKeys.node(nodeId). By the delivery of task/review-and-save/reload-after-save:
    Adds useReloadedNode, which returns a function (nodeId) that gives the node held under entityKeys.node(nodeId)
    only when that query''s last fetch succeeded, and undefined otherwise. useNodeRead is unchanged. This
    is how the form reads the node the reload delivered without owning a second query.'
- path: src/features/entities/components/EntityForm.tsx
  change: 'By the delivery of task/entity-form/attributes-outside-the-catalog: computes the outside-catalog
    groups with useMemo from node.attributes and attributeKeys and renders OutsideCatalogValues inside
    the form after the field groups; the props, aria-label, data-testid, form hook, review gate (valueTypesAccepted,
    changed) and the groups loop are unchanged. By the delivery of task/entity-form/disputed-keys: passes
    group.heldValues to each EntityFieldGroup; nothing else changed. By the delivery of task/entity-form/entity-page:
    new: the named mount point for the form; it receives the loaded node and the catalog''s attribute
    keys and renders an empty labelled form element with no field. By the delivery of task/entity-form/field-groups:
    modified: keeps its props contract (node, attributeKeys), its aria-label "Formulário de edição" and
    its data-testid entity-form; builds the values and groups with useMemo and runs useForm with zodResolver(entityFormSchema)
    and those values as defaultValues; a useEffect calls reset(values) whenever the node or catalog data
    changes; renders one EntityFieldGroup per catalog key in catalog order; submission is held with preventDefault
    so pressing Enter in a field cannot reload the page. By the delivery of task/entity-form/multi-valued-fields:
    modified: calls useFieldArray on the form''s fields array and builds the groups from the live items;
    wires each group''s onAdd to append(emptyField(key)) and its onRemove to remove(index) so adding and
    removing are reflected in the form state; passes the group''s disputed flag so a disputed key offers
    no add control; props, aria-label, data-testid, submission hold and the reset on node or catalog change
    are unchanged. By the delivery of task/entity-form/validity-fields: modified: takes changed from the
    hook and passes it to every EntityFieldGroup. By the delivery of task/entity-form/value-type-fields:
    modified: takes its form from useEntityEditForm instead of building useForm inline and sets data-value-types-accepted
    on the form element from valueTypesAccepted; props, aria-label, data-testid, the field array with
    add and remove, the groups and the submission hold are unchanged. By the delivery of task/review-and-save/conflict-keeps-typed-values:
    Modified. It renders EntitySaveAlert with save.outcome inside the form, directly after EntityReview,
    which holds the Salvar control. The fields, the review panel, the reason and the gates are untouched.
    The alert is visible while save.outcome is a conflict. By the delivery of task/review-and-save/reload-after-save:
    Renames the incoming prop to mountedNode, passes it to useEntityEditForm, and takes the effective
    `node` the hook returns. buildFieldGroups (disputed keys, held values) and outsideCatalogGroupsOf
    are therefore computed from the reloaded node after a save. The props, the layout and the children
    are otherwise unchanged. By the delivery of task/review-and-save/review-of-changes: Modified: takes
    `review` from the hook and renders <EntityReview review={review} /> inside the form after OutsideCatalogValues.
    Props, aria-label, data-testid, groups, the data-value-types-accepted attribute and the submission
    hold are unchanged. By the delivery of task/review-and-save/undo-window: Modified. It reads save from
    useEntityEditForm and passes save.confirm as onConfirm to EntityReview, so the Salvar control now
    runs the delayed send. By the delivery of task/review-and-save/validity-order: modified: takes validityOrder
    from the hook and passes it to every EntityFieldGroup.'
- path: src/features/entities/components/EntityListPage.tsx
  change: 'By the delivery of task/entity-listing/entity-list-screen: new: the page keeps the prefix and
    node-type narrowings in local state and reads the listing through useNodeListing({namePrefix, nodeType})
    and the types through useNodeTypes; the prefix field and the node listing are always rendered; the
    node-type slot shows a loading indication while the types are pending, the could-not-load-types alert
    with a refetch action once they failed, and the type choice once they are held; the results area shows
    loading, the could-not-load-nodes alert with a refetch action, the no-node statement, or the node
    list.'
- path: src/features/entities/components/EntityPage.tsx
  change: 'By the delivery of task/entity-form/entity-page: new: reads nodeId from the route, calls useNodeRead,
    and calls useAttributeKeys only for an active node; picks one body (not-found alert, deleted alert,
    could-not-load alert with retry, loading, attributes of a non-active node, or the form mount point)
    and stands the node header above it.'
- path: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  change: Written by the delivery of task/entity-form/closed-key-fields.
- path: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
  change: Written by the delivery of task/review-and-save/conflict-keeps-typed-values.
- path: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
  change: Written by the delivery of task/entity-form/disputed-keys.
- path: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
  change: Written by the delivery of task/review-and-save/edit-payload.
- path: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
  change: Written by the delivery of task/entity-form/field-groups.
- path: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
  change: Written by the delivery of task/entity-form/multi-valued-fields.
- path: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
  change: Written by the delivery of task/entity-form/attributes-outside-the-catalog.
- path: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
  change: Written by the delivery of task/review-and-save/reload-after-save.
- path: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
  change: Written by the delivery of task/review-and-save/review-effects.
- path: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  change: Written by the delivery of task/review-and-save/review-of-changes.
- path: src/features/entities/components/__tests__/EntityForm.review-local-date.spec.tsx
  change: Written by the delivery of task/review-and-save/review-of-changes.
- path: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
  change: Written by the delivery of task/review-and-save/review-of-changes.
- path: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
  change: Written by the delivery of task/review-and-save/review-reason.
- path: src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
  change: Written by the delivery of task/review-and-save/other-save-failures.
- path: src/features/entities/components/__tests__/EntityForm.save-unreachable.spec.tsx
  change: Written by the delivery of task/review-and-save/other-save-failures.
- path: src/features/entities/components/__tests__/EntityForm.session-expired.spec.tsx
  change: Written by the delivery of task/review-and-save/other-save-failures.
- path: src/features/entities/components/__tests__/EntityForm.starting-values.spec.tsx
  change: Written by the delivery of task/entity-form/field-groups.
- path: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  change: Written by the delivery of task/review-and-save/undo-window.
- path: src/features/entities/components/__tests__/EntityForm.validity-local-date.spec.tsx
  change: Written by the delivery of task/entity-form/validity-fields.
- path: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  change: Written by the delivery of task/review-and-save/validity-order.
- path: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  change: Written by the delivery of task/entity-form/validity-fields.
- path: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  change: Written by the delivery of task/entity-form/value-type-fields.
- path: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  change: Written by the delivery of task/entity-listing/entity-list-screen.
- path: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
  change: Written by the delivery of task/entity-listing/entity-list-screen.
- path: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
  change: Written by the delivery of task/entity-form/entity-page.
- path: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  change: Written by the delivery of task/entity-form/entity-page.
- path: src/features/entities/components/__tests__/entity-change-effect.spec.ts
  change: Written by the delivery of task/review-and-save/review-effects.
- path: src/features/entities/components/__tests__/entity-edit-payload-support.ts
  change: Written by the delivery of task/review-and-save/edit-payload.
- path: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  change: Written by the delivery of task/review-and-save/edit-payload.
- path: src/features/entities/components/__tests__/entity-field-changed.spec.ts
  change: Written by the delivery of task/entity-form/validity-fields.
- path: src/features/entities/components/__tests__/entity-form-closed-support.ts
  change: Written by the delivery of task/entity-form/closed-key-fields.
- path: src/features/entities/components/__tests__/entity-form-conflict-support.tsx
  change: Written by the delivery of task/review-and-save/conflict-keeps-typed-values.
- path: src/features/entities/components/__tests__/entity-form-effect-support.ts
  change: Written by the delivery of task/review-and-save/review-effects.
- path: src/features/entities/components/__tests__/entity-form-failure-support.ts
  change: Written by the delivery of task/review-and-save/other-save-failures.
- path: src/features/entities/components/__tests__/entity-form-multi-support.tsx
  change: Written by the delivery of task/entity-form/multi-valued-fields.
- path: src/features/entities/components/__tests__/entity-form-order-support.ts
  change: Written by the delivery of task/review-and-save/validity-order.
- path: src/features/entities/components/__tests__/entity-form-outside-support.ts
  change: Written by the delivery of task/entity-form/attributes-outside-the-catalog.
- path: src/features/entities/components/__tests__/entity-form-payload-support.ts
  change: Written by the delivery of task/review-and-save/edit-payload.
- path: src/features/entities/components/__tests__/entity-form-reason-support.ts
  change: Written by the delivery of task/review-and-save/review-reason.
- path: src/features/entities/components/__tests__/entity-form-reload-support.tsx
  change: Written by the delivery of task/review-and-save/reload-after-save.
- path: src/features/entities/components/__tests__/entity-form-review-support.ts
  change: Written by the delivery of task/review-and-save/review-of-changes.
- path: src/features/entities/components/__tests__/entity-form-router-support.tsx
  change: Written by the delivery of task/entity-form/disputed-keys, task/review-and-save/undo-window.
- path: src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
  change: Written by the delivery of task/entity-form/multi-valued-fields, task/entity-form/validity-fields.
- path: src/features/entities/components/__tests__/entity-form-schema.spec.ts
  change: Written by the delivery of task/entity-form/field-groups.
- path: src/features/entities/components/__tests__/entity-form-support.tsx
  change: Written by the delivery of task/entity-form/disputed-keys, task/entity-form/field-groups.
- path: src/features/entities/components/__tests__/entity-form-undo-support.ts
  change: Written by the delivery of task/review-and-save/undo-window.
- path: src/features/entities/components/__tests__/entity-form-validity-support.ts
  change: Written by the delivery of task/entity-form/validity-fields.
- path: src/features/entities/components/__tests__/entity-form-value-type-support.ts
  change: Written by the delivery of task/entity-form/value-type-fields.
- path: src/features/entities/components/__tests__/entity-value-types.spec.ts
  change: Written by the delivery of task/entity-form/value-type-fields.
- path: src/features/entities/components/__tests__/list-support.tsx
  change: Written by the delivery of task/entity-listing/entity-list-screen.
- path: src/features/entities/components/__tests__/page-support.tsx
  change: Written by the delivery of task/entity-form/entity-page.
- path: src/features/entities/components/__tests__/session-token.ts
  change: Written by the delivery of task/entity-form/entity-page.
- path: src/features/entities/components/__tests__/value-type-wording.ts
  change: Written by the delivery of task/entity-form/value-type-fields.
- path: src/features/entities/components/entity-allowed-values.ts
  change: 'By the delivery of task/entity-form/closed-key-fields: new: pure helpers; allowedValueLabel
    returns the label, or the value itself when the label is null or blank; allowedValueOptions maps the
    catalog''s allowed values to value+label options keeping their order, with no sorting and no use of
    sortOrder; isAllowedValue tests membership.'
- path: src/features/entities/components/entity-change-effect.ts
  change: 'By the delivery of task/review-and-save/review-effects: New. It exports EditEffect, the five-value
    union first-value, addition, succession, correction, removal. It exports EDIT_EFFECT_WORDING (Primeiro
    valor, Adição, Sucessão, Correção, Remoção, no ending punctuation). It exports FieldChange { kind:
    ''set''|''remove'', effect, itemId } and ChangeSubject (attributeKey, itemId, startedWith, value).
    It exports the pure function changeOfField(field, attributeKey, attributes), which returns the FieldChange
    for one field or null. A field started from an attribute (itemId set) whose value is unchanged gives
    null. If emptied it gives remove/removal naming that itemId. Otherwise it gives set naming that itemId,
    succession for a temporal key and correction for any other key. A field with no started attribute
    and an empty value gives null. If the node holds no attribute of the key with a live status (heldAttributesOf:
    active, uncertain, disputed), it gives set/first-value. If the key allows multiple current values
    and no active or uncertain attribute holds the value, it gives set/addition. Anything else gives null.
    It reads only the field''s own started state and the node''s attributes as loaded, never the other
    fields of the edit. The edit-payload task can call it for the kind and itemId of each change.'
- path: src/features/entities/components/entity-closed-choice.tsx
  change: 'By the delivery of task/entity-form/closed-key-fields: new: ClosedChoice renders the ui-kit
    Select over the allowed values as a role=group container with an aria-label and aria-describedby and
    the placeholder "Selecionar valor" when nothing is selected; a "Limpar <nome>" icon button, shown
    only while a value is held, resets the field to the empty string and returns focus to the combobox;
    a value held that is not among the allowed values is not offered as an option and a muted line "Valor
    atual fora dos valores permitidos: <valor>" shows it, linked through aria-describedby.'
- path: src/features/entities/components/entity-disputed-values.tsx
  change: 'By the delivery of task/entity-form/disputed-keys: new: DisputedValues renders a ul labelled
    "Valores de <key>" with one li per held value, showing the value string exactly as the node read delivers
    it, and below it a typed TanStack Router Link to=''/curation'' with no search or params, reading "Abrir
    na fila de curadoria"; it renders no input, select, textarea or add/remove control.'
- path: src/features/entities/components/entity-edit-payload.ts
  change: 'By the delivery of task/review-and-save/edit-payload: Modified, behavior kept. The what-the-field-states
    decisions are now small exported pure functions. memberOf maps an empty text to null. changeKindOf
    takes the kind from the shared changeOfField mapping, with set as the fallback. validityStatedBy returns
    the field''s validity only for a temporal key, with an empty member as null (an unstated start is
    null, never today), and null for a stable key. fieldsToSend lists the changed fields followed by the
    removed baseline fields. changeOf builds a remove change (null value, valid_from and valid_to, the
    field''s item id) or a set change (the field''s value, the validity it states, the item id it started
    from, null for none). buildEntityEdit keeps its signature and its output: the trimmed reason, and
    changes ordered by catalog key position. New export buildEntityEditBody(...) returns toEntityEditWire(buildEntityEdit(...)),
    the exact { reason, changes } body with six members per change. The item id of any change is now read
    straight from the field, which is identical to what changeOfField returned in every reachable case,
    so the former fallback branch is gone. By the delivery of task/review-and-save/undo-window: New. buildEntityEdit(reason,
    held, changed, baseline, attributeKeys, attributes) is a pure function returning an EntityEdit. The
    reason is trimmedReason(reason). There is one AttributeChange per changed field (changed flags) plus
    one per removed baseline field (removedFieldsOf). Kind and itemId come from changeOfField. A remove
    change carries null value, validFrom and validTo. A set change carries the field''s value, and its
    validity only for a temporal key. Every empty member is written as null, so an unstated start is sent
    empty. Changes are ordered by catalog key position, like the review.'
- path: src/features/entities/components/entity-field-changed.ts
  change: 'By the delivery of task/entity-form/validity-fields: new: the pure function that decides whether
    a field is changed, which the review tasks must reuse; isFieldChanged(field, attributes, allowsMultiple)
    is false when value equals startedWith, whatever validity the field holds, and false for an added
    field (itemId null) of a multi-valued key whose value equals the value of an attribute of that key
    with status active or uncertain, and true otherwise; changedFlags(fields, attributeKeys, attributes)
    applies it to every field by index, looking up allowsMultiple in the catalog, and returns false for
    a key absent from the catalog. By the delivery of task/review-and-save/review-effects: Modified. holdsValue
    is now exported so the effect mapping reuses the ''active or uncertain attribute of the key holds
    this value'' test instead of duplicating it. Its behavior and isFieldChanged are unchanged.'
- path: src/features/entities/components/entity-field-group.tsx
  change: 'By the delivery of task/entity-form/closed-key-fields: modified: for a key whose allowedValues
    is non-null each field of the key renders ClosedChoice instead of the text Input, which covers every
    entry of a multi-valued key; the Controller binds the form value to field.value and field.onChange
    so the form holds the allowed value''s value; for a closed key the title is rendered as a plain p
    rather than a Label htmlFor because no input carries that id; help text, the error paragraph with
    role alert, add and remove, the numbering and the disputed-key behaviour are unchanged. By the delivery
    of task/entity-form/disputed-keys: takes the new heldValues prop and, when disputed is true, renders
    DisputedValues between the group title and the (empty) fields loop; the add button stays gated by
    listed && !disputed and the remove buttons only exist inside the fields loop, which is empty for a
    disputed key; the help text still renders last. By the delivery of task/entity-form/field-groups:
    new: renders a role=group container labelled by the key''s title (a Label tied to the field by htmlFor,
    or a plain title when the key has no field); each field is a ui-kit Input wrapped in a Controller
    on fields.{index}.value; the key''s catalog description is shown as help text linked to the input
    through aria-describedby, and when the description is null or empty no help text and no aria-describedby
    are rendered. By the delivery of task/entity-form/multi-valued-fields: modified: renders each field
    of the group as a row keyed by its RHF field id with the input id derived from it; for a multi-valued
    key each row also has an icon button named "Remover valor N de {key}" and below the rows an "Adicionar
    valor" button named "Adicionar valor a {key}"; where a multi-valued key shows more than one field
    each input is named "{key} (valor N)"; removing a field moves focus to the add button; a single-valued
    key and a disputed key render no add or remove control; a key left with no field shows its title as
    plain text and still offers the add control, except a disputed key; the help text and aria-describedby
    link are unchanged. By the delivery of task/entity-form/validity-fields: modified: takes a changed
    prop; each field row wraps the value Controller and, below it, ValidityFields, rendered only when
    attributeKey.isTemporal is true and changed[index] is true; the inner value column dropped its flex-1
    because the new wrapper carries it; Input, ClosedChoice, error paragraph, help text, add and remove
    controls and numbering are unchanged. By the delivery of task/entity-form/value-type-fields: modified:
    each Controller reads fieldState.error; a field in error shows its message in a p with role alert,
    id entity-error-{rhf id} and data-testid entity-error-{key} under the input, and the input gets aria-invalid
    true and aria-describedby listing the help text id and the error id; a field not in error carries
    no aria-invalid and describes itself by the help text only, as before; the row aligns to the top so
    the remove button stays beside the input. By the delivery of task/review-and-save/validity-order:
    modified: takes a validityOrder prop and passes validityOrder[index] ?? null to ValidityFields as
    orderMessage. Nothing else in the group changed.'
- path: src/features/entities/components/entity-form-schema.ts
  change: 'By the delivery of task/entity-form/attributes-outside-the-catalog: adds isHeldAttribute (status
    active, uncertain or disputed), now used by heldAttributesOf, whose behavior is unchanged; adds OutsideCatalogGroup
    and outsideCatalogGroupsOf(attributes, attributeKeys), which returns the held attributes whose key
    is not among the catalog''s keys, grouped by key in the order the keys first appear in the node read;
    buildFormValues, buildFieldGroups and isDisputedKey are untouched, so these attributes get no field
    entry. By the delivery of task/entity-form/disputed-keys: FieldGroup gains heldValues; the new heldAttributesOf(attributes,
    key) returns the key''s attributes whose status is active, uncertain or disputed, in the node read''s
    order, current or not; buildFieldGroups fills heldValues only for a disputed key (decided by the existing
    isDisputedKey, status alone) and leaves it empty otherwise; buildFormValues is unchanged, so a disputed
    key still gets no form entry. By the delivery of task/entity-form/field-groups: new: declares the
    form state and the pure builders; the state is the Zod schema entityFormSchema, a flat fields array
    of { attributeKey, itemId (string or null), startedWith, value }, with the inferred types EntityFormValues
    and AttributeFieldValues; buildFormValues produces one entry per catalog key in catalog order, taking
    the first attribute of that key whose isCurrent is true, with startedWith and value that attribute''s
    value (empty when none) and itemId its id (null when none), and a key holding an attribute whose status
    is disputed gets no entry; buildFieldGroups maps each catalog key, in order, to its field indexes
    and flags a key as disputed or not. By the delivery of task/entity-form/multi-valued-fields: modified:
    buildFormValues now emits, for a key whose catalog entry has allowsMultiple true, one entry per current
    attribute of the key in the order the node read lists them, each carrying itemId equal to that attribute''s
    id and startedWith and value equal to its value; a multi-valued key holding no current attribute gets
    one empty entry (itemId null, startedWith and value empty); a single-valued key still gets exactly
    one entry from the first current attribute, or an empty one; a key holding a disputed attribute still
    gets no entry; adds currentAttributesOf and emptyField (an entry with itemId null and empty startedWith
    and value); buildFieldGroups now takes the live field-array items, which carry the RHF id, and returns
    for each key a fields list of { index, id } in place of fieldIndexes; adds the IdentifiedFieldValues
    and GroupField types. By the delivery of task/entity-form/validity-fields: modified: attributeFieldSchema
    gains validFrom and validTo as strings where the empty string means unstated; emptyField and fieldStartingFrom
    write both as empty, so every field starts with its validity unstated and does not copy the held attribute''s
    validity; buildFormValues, buildFieldGroups and the value-type schema are otherwise unchanged. By
    the delivery of task/entity-form/value-type-fields: modified: adds buildEntityFormSchema(attributeKeys),
    a Zod object whose fields array carries a superRefine that maps each entry''s attributeKey to the
    catalog''s valueType and adds a custom issue at path [index, "value"] with the wording; entityFormSchema,
    attributeFieldSchema, the types and every builder keep their shape and the EntityFormValues type is
    unchanged.'
- path: src/features/entities/components/entity-list-parts.tsx
  change: 'By the delivery of task/entity-listing/entity-list-screen: new: presentational parts: ListLoading
    ("Carregando nós…", role status, polite), ListErrorAlert and TypesErrorAlert (a destructive Alert
    with role alert and a "Tentar novamente" button, fixed text and no failure code or message), ListEmpty
    ("Nenhum nó encontrado."), TypesLoading, TypeChoice (a labelled group around the ui-kit Select whose
    first option "Todos os tipos" has the empty value and the rest are node type names) and NodeList (one
    router Link per node, preload off, to /entities/$nodeId, followed by the node type and status).'
- path: src/features/entities/components/entity-local-date.ts
  change: 'By the delivery of task/entity-form/validity-fields: new: localCalendarDate(moment) builds
    YYYY-MM-DD from getFullYear, getMonth and getDate, the browser''s local time zone and never toISOString;
    todayLocalDate() reads new Date() at call time so a test can fix the clock with fake timers.'
- path: src/features/entities/components/entity-outside-catalog-values.tsx
  change: 'By the delivery of task/entity-form/attributes-outside-the-catalog: new: OutsideCatalogValues
    renders nothing for no groups, otherwise a section labelled by the visible title "Valores fora do
    catálogo" holding a dl with one div per key: a dt with the key and a dd per held value, shown exactly
    as the node read delivers it; it renders no input, select, textarea, add or remove control, and no
    link.'
- path: src/features/entities/components/entity-page-helpers.ts
  change: 'By the delivery of task/entity-form/entity-page: new: classifyNodeFailure maps an EnvelopeError
    code to not-found (RESOURCE_NOT_FOUND), deleted (BUSINESS_NODE_DELETED) or other, and ACTIVE_NODE_STATUS
    names the status that offers the form.'
- path: src/features/entities/components/entity-page-parts.tsx
  change: 'By the delivery of task/entity-form/entity-page: new: FormLoading, NodeNotFoundAlert, NodeDeletedAlert
    and FormLoadErrorAlert carry the fixed pt-BR wording and no code or message of a failure, and only
    FormLoadErrorAlert has the "Tentar novamente" action; NodeHeader shows name, type and status; NodeAttributeList
    shows the delivered attributes as key and value.'
- path: src/features/entities/components/entity-review-entries.ts
  change: 'By the delivery of task/review-and-save/review-effects: Modified. ReviewEntry gains `effect:
    EditEffect | null`. reviewEntriesOf gains a fifth parameter `attributes` (node.attributes as loaded).
    Each live entry takes its effect from changeOfField. Each removed entry is judged as a field with
    an empty value, so it states a removal. Which fields are listed, their order, their validity and their
    removed entries are unchanged. By the delivery of task/review-and-save/review-of-changes: New pure
    function reviewEntriesOf(held, changed, baseline, attributeKeys). It lists a live field once when
    its `changed` flag (from changedFlags/isFieldChanged) is true. It also lists each baseline field that
    has an itemId and a non-empty startedWith but whose itemId is no longer in the live fields, as a removed
    entry with an empty new value. Entries follow the catalog key order. An entry of a temporal key that
    is still in the form carries the validFrom/validTo it holds ('''' means unstated). Removed entries
    and entries of non-temporal keys carry validity null. By the delivery of task/review-and-save/undo-window:
    Modified. The removed-field rule (a baseline field that started with a value and whose item no held
    field keeps) is extracted into the exported removedFieldsOf. reviewEntriesOf now calls it, so review
    and payload share one rule. The entries it returns are unchanged.'
- path: src/features/entities/components/entity-review-reason.ts
  change: 'By the delivery of task/review-and-save/review-reason: New. It exports REASON_MAX_CODE_UNITS
    (1000), trimmedReason (String.prototype.trim), isReasonTooLong and isReasonAccepted. Both predicates
    count the trimmed string with .length, which is UTF-16 code units. They never spread, never use Array.from
    and never use Intl.Segmenter. isReasonAccepted is true exactly when the trimmed length is from 1 to
    1000. The later payload task can reuse trimmedReason to send the reason trimmed.'
- path: src/features/entities/components/entity-review.tsx
  change: 'By the delivery of task/review-and-save/review-effects: Modified. Each review item shows a
    ''Efeito'' term with the effect wording as visible text (data-testid entity-review-effect-{key}) beside
    ''Valor anterior'' and ''Novo valor''. Nothing is rendered when an entry''s effect is null. Gating,
    focus handling, validity display and the ''Sem valor'' display are unchanged. By the delivery of task/review-and-save/review-of-changes:
    New EntityReview component. It renders nothing while the review is not offered. While offered and
    closed it renders a ''Revisar alterações'' button. While open it renders a ui-kit Panel ''Revisão
    das alterações'' holding one list item per entry and a ''Voltar à edição'' button. Each item shows
    the key, ''Valor anterior'' beside ''Novo valor'', ''Sem valor'' for an empty value, and, for a temporal
    key still in the form, ''Início da validade'' and ''Fim da validade'' (only when an end is held).
    An unstated start shows todayLocalDate() with the note ''Início não informado: hoje.''. Focus moves
    to the panel on open and back to the button on close. By the delivery of task/review-and-save/review-reason:
    Modified. The open review panel now holds a "Motivo" field: a ui-kit Label tied by htmlFor/id to a
    controlled Textarea (data-testid entity-review-reason, aria-required, aria-invalid only while the
    trimmed reason is over the limit). A "Salvar" button (data-testid entity-review-confirm, type=button,
    onClick = the optional onConfirm prop) is rendered only while review.saveOffered. A click with no
    onConfirm does nothing. "Voltar à edição" now sits in the same button row. EntityReviewProps gains
    an optional onConfirm. The button, effects, validity display, ''Sem valor'' and focus handling are
    unchanged.'
- path: src/features/entities/components/entity-save-alert.tsx
  change: 'By the delivery of task/review-and-save/conflict-keeps-typed-values: New. It exports EntitySaveAlert,
    which takes the save outcome (EditOutcome | null) and renders by the outcome''s kind, and CONFLICT_ALERT_TEXT,
    which is "Este nó mudou desde que você abriu o formulário." (the wording rule''s conflict text, ending
    with its period). For the conflict kind it renders the ui-kit Alert (variant warning, role="alert",
    data-testid="entity-save-conflict") holding that sentence and nothing else. The server''s code, its
    message, attribute_key and item_id are not shown. For null, accepted, refused and unreachable it renders
    nothing. By the delivery of task/review-and-save/other-save-failures: EntitySaveAlert gains two cases
    and exports COULD_NOT_BE_SENT_ALERT_TEXT ("Não foi possível enviar a edição. Tente novamente."). "refused"
    renders the ui-kit Alert (variant destructive, role="alert", data-testid="entity-save-refused") holding
    only outcome.failure.message, with no code, status or details. "unreachable" renders Alert (variant
    destructive, role="alert", data-testid="entity-save-unreachable") holding only the fixed text, with
    no message of the failure''s own. The conflict case (warning, "entity-save-conflict") is untouched.
    null, accepted and session-ended fall to the default branch and render nothing.'
- path: src/features/entities/components/entity-validity-fields.tsx
  change: 'By the delivery of task/entity-form/validity-fields: new: ValidityFields renders a role=group
    named "Validade de {nome}" holding two ui-kit date inputs bound to fields.N.validFrom and fields.N.validTo,
    each with a visible Label ("Início da validade", "Fim da validade") and an aria-label that adds the
    key and, for numbered multi-valued entries, the position; while validFrom is empty a note "Início
    não informado: aparece como hoje, AAAA-MM-DD." shows today''s local date, linked by aria-describedby,
    and the form value stays empty; the end carries the note "Opcional: pode ficar vazio." and no required
    state or error. By the delivery of task/review-and-save/validity-order: modified: takes an orderMessage
    prop (string | null). With a message, the validity end input gets aria-invalid=true and aria-describedby
    naming both its note and the new error paragraph. The paragraph has id entity-valid-to-{id}-error,
    role=alert, data-testid entity-valid-to-error-{key} and the text-destructive token, and shows the
    message text. With null the end input and its note render as before.'
- path: src/features/entities/components/entity-validity-order.ts
  change: 'By the delivery of task/review-and-save/validity-order: new: exports VALIDITY_ORDER_MESSAGE,
    the fixed text "O início deve ser anterior ao fim.". validityOrderMessage(validFrom, validTo) returns
    null when either side is the empty string. Otherwise it returns null when validFrom < validTo (string
    comparison of YYYY-MM-DD), and the message when the start is equal or later. validityOrderMessages(fields,
    changed, attributeKeys) returns one entry per field index: the message for a field that is changed
    and whose key isTemporal in the catalog and whose two dates fail the order, and null for every other
    field.'
- path: src/features/entities/components/entity-value-types.ts
  change: 'By the delivery of task/entity-form/value-type-fields: new: holds the three exact messages
    the rule writes (date, number, bool) and valueTypeMessage(valueType, value), which returns null for
    an empty string, for text and for any value type it does not know, and otherwise the message for a
    value that does not read as its type; date is ^\d{4}-\d{2}-\d{2}$ plus an existing day, checked by
    month lengths and the leap-year rule with no Date object; number is ^-?\d+(\.\d+)?$ plus Number.isFinite;
    bool is exactly true or false, case-sensitive and untrimmed.'
- path: src/features/entities/components/use-entity-edit-form.ts
  change: 'By the delivery of task/entity-form/validity-fields: modified: the hook also returns changed,
    a readonly boolean per field index, which is changedFlags over the live useWatch values, the catalog
    and node.attributes, memoised; valueTypesAccepted and the resolver are unchanged. By the delivery
    of task/entity-form/value-type-fields: new: hook useEntityEditForm(node, attributeKeys) that owns
    the useForm with the resolver zodIssueResolver over the catalog-built schema (memoised on attributeKeys,
    the resolver rebuilt with it), mode onChange, defaultValues from buildFormValues and the reset(values)
    effect that EntityForm previously held; it returns { form, valueTypesAccepted }, where valueTypesAccepted
    is the schema''s safeParse of the live fields via useWatch, so it is synchronous and true while every
    non-empty value reads as its key''s type. By the delivery of task/review-and-save/reload-after-save:
    The hook now takes the mounted node as propNode and derives an effective node = restarted ?? propNode.
    `restarted` is state holding the reloaded node. It is dropped by a render-phase comparison (seenPropNode
    state) as soon as the propNode reference changes, so the prop wins again once it catches up. Everything
    is computed from the effective node. That covers the baseline `values`, the reset effect, the attributes
    handed to changedFlags, useEntityReview (and so reviewEntriesOf), buildEntityEdit (and so changeOfField)
    and the node id sent. The restart callback given to useUndoableSave sets `restarted` and calls reset(buildFormValues(reloaded,
    attributeKeys)). The explicit reset is kept so the form restarts even when the reloaded node has the
    same reference as the one already held. The hook now also returns `node`, the effective node. The
    existing effect that resets when `values` changes is kept. By the delivery of task/review-and-save/review-effects:
    Modified. It passes node.attributes, the node as loaded, to useEntityReview. The returned shape is
    unchanged. By the delivery of task/review-and-save/review-of-changes: Modified: EntityEditForm gains
    `review: EntityReviewState`, produced by useEntityReview over the live held fields, the `changed`
    flags, the baseline `values` and the catalog. form, valueTypesAccepted and changed are unchanged.
    By the delivery of task/review-and-save/undo-window: Modified. It now calls useUndoableSave with the
    node id, the review state and a closure over buildEntityEdit. The closure reads review.reason, the
    held values, the changed flags, the baseline values, the catalog keys and the node''s attributes.
    The hook returns the new member save, and its other members are unchanged. By the delivery of task/review-and-save/validity-order:
    modified: computes validityOrder (memoised validityOrderMessages over the live useWatch values, the
    changed flags and the catalog) and validityOrderAccepted (true when every entry is null). Both are
    returned beside form, valueTypesAccepted, changed and review. validityOrderAccepted is passed to useEntityReview.
    The schema, the resolver and valueTypesAccepted are unchanged.'
- path: src/features/entities/components/use-entity-review.ts
  change: 'By the delivery of task/review-and-save/review-effects: Modified. useEntityReview takes `attributes`
    after attributeKeys and passes it to reviewEntriesOf, adding it to the memo dependencies. offered,
    open, openReview and closeReview behave as before. By the delivery of task/review-and-save/review-of-changes:
    New hook useEntityReview holding the `reviewing` flag. It returns { entries, offered, open, openReview,
    closeReview }. `offered` is true only when valueTypesAccepted is true and there is at least one entry.
    `open` is `reviewing && offered`, and `reviewing` is reset during render when the review stops being
    offered. A review therefore never reopens by itself once the gate holds again. By the delivery of
    task/review-and-save/review-reason: Modified. The hook now holds the session''s reason as local state
    beside the reviewing flag. EntityReviewState gains reason, setReason, clearReason, reasonTooLong and
    saveOffered. saveOffered is `open && isReasonAccepted(reason)`, and open already means offered, which
    means value types accepted and at least one entry. The reason is kept when the review closes or stops
    being offered, and it is emptied only by clearReason. The parameters, entries, offered, open, openReview
    and closeReview behave as before. By the delivery of task/review-and-save/validity-order: modified:
    useEntityReview takes a last parameter, validityOrderAccepted. saveOffered is now open && validityOrderAccepted
    && isReasonAccepted(reason). offered, open, entries and the reason state are unchanged, so the review
    stays offered and open while an order violation stands and only the save is withheld.'
- path: src/features/entities/components/use-undoable-save.ts
  change: 'By the delivery of task/review-and-save/reload-after-save: useUndoableSave takes a fourth parameter,
    restart(reloaded). On an accepted outcome it still calls clearReason(). It now also calls closeReview(),
    reads the reloaded node through useReloadedNode, and calls restart with it if there is one. Then it
    stores the outcome as before. The conflict, refused, unreachable and session-ended paths, the timer,
    the undo, the busy guard and the clearing of the outcome at each confirmation are unchanged. Those
    paths still do no reset, no reason clear, no review close and no restart. By the delivery of task/review-and-save/undo-window:
    New. It exports useUndoableSave, UNDO_WINDOW_MS (5000), RECORDED_NOTICE ("Edição registrada.") and
    UNDO_ACTION_LABEL ("Desfazer"). confirm() returns at once if a window or a send is already running,
    or if review.saveOffered is false. Otherwise it snapshots the edit through the buildEdit callback
    and starts a setTimeout of UNDO_WINDOW_MS. It also shows a sonner toast with id, duration 5000 and
    an action labelled Desfazer. The undo action clears the timer and releases the guard, and touches
    nothing else, so no send happens and the form, the reason and the review keep their state. When the
    timer fires it dismisses the toast and sends the snapshot through useEditEntity().mutateAsync, exactly
    once. The typed outcome (accepted, conflict, refused or unreachable) is stored in state and returned
    as outcome. An accepted outcome also calls review.clearReason. An unexpected throw is left to the
    global MutationCache handler and clears the outcome. The guard is released when the send settles.'
- path: src/features/entities/components/zod-issue-resolver.ts
  change: 'By the delivery of task/entity-form/value-type-fields: new: zodIssueResolver(schema) returns
    an RHF Resolver that runs schema.safeParse(values); on success it returns { values: parsed.data, errors:
    {} }; on failure it returns { values: {}, errors } with one { type: issue.code, message: issue.message
    } per issue path (the first issue at a path wins), nested through @hookform/resolvers'' toNestErrors
    as zodResolver does, so fields.N.value reaches formState.errors and Controller''s fieldState.error;
    it reads Zod 4''s issues and does not depend on error.errors.'
- path: src/features/entities/types.ts
  change: 'By the delivery of task/knowledge-base-client/edit-request: extended: adds the wire and domain
    types of the edit (AttributeChange, EntityEdit, EntityEditWire, EditAcceptedWire, AppliedChange, EditFailure,
    EditAccepted, EditConflict, EditRefused, EditUnreachable, EditOutcome, EditVariables). By the delivery
    of task/knowledge-base-client/listing-reads: declares the wire shapes of the node-type list and the
    node listing (snake_case, as the knowledge base answers) and the domain shapes the screen consumes
    (NodeType, ListedNode, NodeListing, NodeListingNarrowing). By the delivery of task/knowledge-base-client/node-and-catalog-reads:
    extended: adds the wire types and the domain types NodeAlias, NodeAttribute, NodeRead, AllowedValue
    and AttributeKey, leaving the existing exports unchanged. By the delivery of task/review-and-save/other-save-failures:
    Adds EditSessionEnded ({ kind: "session-ended" }) and includes it in the EditOutcome union, so a lapsed
    session is neither a refusal nor an edit that could not be sent. No existing member changed.'
- path: src/router/__tests__/route-support.tsx
  change: Written by the delivery of task/entity-listing/entity-list-screen.
- path: src/router/__tests__/routes.entity-list.dom.spec.tsx
  change: Written by the delivery of task/entity-listing/entity-list-screen.
- path: src/router/__tests__/routes.entity.dom.spec.tsx
  change: Written by the delivery of task/entity-form/entity-page.
- path: src/router/routes.tsx
  change: 'By the delivery of task/entity-form/entity-page: adds the lazy import of EntityPage and the
    entityRoute at /entities/$nodeId, a child of protectedLayoutRoute, so it runs the same session guard
    as the other pages; the route has preload false and a Suspense fallback reading "Carregando formulário…"
    and is added to the protected layout''s children, so the page chunk is requested only when the address
    renders. By the delivery of task/entity-listing/entity-list-screen: adds a lazy import of EntityListPage
    and a new entityListRoute at /entities, a child of protectedLayoutRoute with preload false, rendering
    the page inside Suspense with a role status, aria-live polite fallback "Carregando nós…"; it is registered
    in the route tree before entityRoute, and the page chunk is fetched only when the address is first
    opened.'
nodes:
- node: contracts/application-shell/shell-screen
  conforms: true
  how: 'src/router/routes.tsx: held at ProtectedLayout and protectedLayoutRoute (the workspace shown inside
    the shell, and the redirect to sign-in for a stale token), plus the notFoundRoute and stub routes
    for the page-state wording. The file does not hold the shell''s header, footer or palette, nor the
    render-failure state. — `<AppShell>` wrapping `<Outlet />`; `throw redirect({ to: "/sign-in", search:
    { reason: "session_expired" } });`; `title="Página não encontrada." hint="O endereço solicitado não
    existe ou foi removido."`; `title="Grafo"`'
  encoded_at:
  - src/router/routes.tsx
- node: contracts/entity-workspace/bff-entity-edit
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/_edit-request.ts, src/features/entities/api/_transforms.ts,
    src/features/entities/api/edit.hooks.ts, src/features/entities/types.ts, and src/features/entities/components/entity-edit-payload.ts
    read `nowhere` — The file builds the body with `return toEntityEditWire(buildEntityEdit(...args));`
    and states no path, method, header or failure code; the request itself is made elsewhere. — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/_edit-request.ts
  - src/features/entities/api/_transforms.ts
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/types.ts
- node: contracts/entity-workspace/bff-entity-reads
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/_request.ts, src/features/entities/api/_transforms.ts,
    src/features/entities/api/catalog.hooks.ts, src/features/entities/api/listing.hooks.ts, src/features/entities/api/node.hooks.ts,
    src/features/entities/types.ts, and src/features/entities/components/EntityListPage.tsx read `nowhere`
    — The file only calls the hooks `useNodeTypes()` and `useNodeListing({ namePrefix, nodeType })`. The
    request paths, parameters and failure reports are not stated here.; src/features/entities/components/EntityPage.tsx
    read `nowhere` — The file only calls hooks: `const nodeQuery = useNodeRead(nodeId);` and `const catalogQuery
    = useAttributeKeys(formNodeType);`. The request, path and query parameters are not stated in this
    file.; src/features/entities/components/entity-allowed-values.ts read `nowhere` — The file makes no
    request. Its only imports and declarations are `import type { AllowedValue } from "../types";` and
    the three functions `allowedValueLabel`, `allowedValueOptions` and `isAllowedValue`.; src/features/entities/components/entity-form-schema.ts
    read `nowhere` — This file makes no request. It only imports the AttributeKey, NodeAttribute and NodeRead
    types. — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/_request.ts
  - src/features/entities/api/_transforms.ts
  - src/features/entities/api/catalog.hooks.ts
  - src/features/entities/api/listing.hooks.ts
  - src/features/entities/api/node.hooks.ts
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-allowed-values.ts
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/types.ts
- node: contracts/entity-workspace/entity-screen
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/EntityListPage.tsx,
    src/features/entities/components/EntityPage.tsx, src/features/entities/components/entity-disputed-values.tsx,
    src/features/entities/components/entity-field-group.tsx, src/features/entities/components/entity-list-parts.tsx,
    src/features/entities/components/entity-page-helpers.ts, src/features/entities/components/entity-page-parts.tsx,
    src/features/entities/components/entity-review.tsx, src/features/entities/components/entity-save-alert.tsx,
    src/features/entities/components/entity-validity-order.ts, src/features/entities/components/use-entity-review.ts,
    src/features/entities/components/use-undoable-save.ts, and src/features/entities/components/EntityForm.tsx
    read `nowhere` — The file renders only `<form aria-label="Formulário de edição" ...>` with its groups,
    `<EntityReview review={review} onConfirm={save.confirm} />` and `<EntitySaveAlert outcome={save.outcome}
    />`. The screen''s loading, not-found and could-not-load states, the review and the notice text are
    not stated in this file.; src/features/entities/components/entity-closed-choice.tsx read `nowhere`
    — The file declares only ClosedChoiceProps and renders one select; it states no list, form, review
    or save answer of the screen: readonly onChange: (value: string) => void;; src/features/entities/components/entity-validity-fields.tsx
    read `nowhere` — The file renders only two date inputs and their notes: `<Label htmlFor={fromId}>Início
    da validade</Label>`. It declares no screen operation, listing, form, review or save.; src/features/entities/components/use-entity-edit-form.ts
    read `nowhere` — The file renders no screen state. It states no alert, loading indication, notice
    or refusal wording, and only returns `{ node, form, valueTypesAccepted, changed, validityOrder, validityOrderAccepted,
    review, save }`. — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-closed-choice.tsx
  - src/features/entities/components/entity-disputed-values.tsx
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-list-parts.tsx
  - src/features/entities/components/entity-page-helpers.ts
  - src/features/entities/components/entity-page-parts.tsx
  - src/features/entities/components/entity-review.tsx
  - src/features/entities/components/entity-save-alert.tsx
  - src/features/entities/components/entity-validity-fields.tsx
  - src/features/entities/components/entity-validity-order.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/use-entity-review.ts
  - src/features/entities/components/use-undoable-save.ts
- node: contracts/knowledge-base/entity-editing
  conforms: true
  how: 'src/features/entities/api/_transforms.ts: held at toEditAccepted, which reads the accepted answer
    as node_id, action_id and applied, and toAppliedChange, which reads each applied entry. — nodeId:
    wire.node_id, actionId: wire.action_id, applied: wire.applied.map(toAppliedChange),

    src/features/entities/types.ts: held at EditAcceptedWire and AppliedChangeWire, lines 175-186 — export
    interface EditAcceptedWire { readonly node_id: string; readonly action_id: string; readonly applied:
    readonly AppliedChangeWire[]; }'
  encoded_at:
  - src/features/entities/api/_transforms.ts
  - src/features/entities/types.ts
- node: contracts/knowledge-base/retrieval
  conforms: true
  how: 'src/features/entities/api/_transforms.ts: held at toNodeType, toListedNode, toNodeSummary, toNodeAlias,
    toNodeAttribute and toAttributeKey, which read the published answer members. — attributeKey: wire.attribute_key,
    value: wire.value, validFrom: wire.valid_from, validTo: wire.valid_to, status: wire.status, isCurrent:
    wire.is_current,

    src/features/entities/types.ts: held at NodeTypeWire, ListedNodeWire, NodeSummaryWire, NodeAliasWire,
    NodeAttributeWire and AttributeKeyWire — export interface NodeAttributeWire { readonly id: string;
    readonly attribute_key: string; readonly value: string; readonly valid_from: string | null; readonly
    valid_to: string | null; readonly status: string; readonly is_current: boolean; }'
  encoded_at:
  - src/features/entities/api/_transforms.ts
  - src/features/entities/types.ts
- node: domain/application-shell/application-shell
  conforms: false
  how: 'no named file holds this fact now: src/router/routes.tsx read `nowhere` — The file declares no
    shape for health, curation_pending, as_of, palette_open, address or reason. It only builds routes
    with `createRoute(...)` and `RootRoute.addChildren([...])`.'
  observed_at:
  - src/router/routes.tsx
- node: domain/entity-workspace/attribute-field
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-form-schema.ts,
    and src/features/entities/components/entity-edit-payload.ts read `nowhere` — The shape is only imported:
    `import type { AttributeFieldValues, EntityFormValues } from "./entity-form-schema";`. The file''s
    own FieldToSend and FieldValidity are not this value object.; src/features/entities/components/entity-field-changed.ts
    read `nowhere` — the file imports the shape (`import type { AttributeFieldValues } from "./entity-form-schema";`)
    and reads `field.value`, `field.startedWith`, `field.itemId` and `field.attributeKey`, but declares
    no shape of its own; src/features/entities/components/entity-field-group.tsx read `nowhere` — The
    file declares no shape for the element. It only imports it with `import type { EntityFormValues, GroupField
    } from "./entity-form-schema";` and reads `fields.map(({ index, id }, position)`.; src/features/entities/components/entity-review-entries.ts
    read `nowhere` — the file only imports the shape: `AttributeFieldValues,` from "./entity-form-schema";
    it declares no shape of its own for an attribute field; src/features/entities/components/entity-validity-order.ts
    read `nowhere` — the file declares no shape of the element and only reads validFrom and validTo of
    a type declared elsewhere: import type { AttributeFieldValues } from "./entity-form-schema";; src/features/entities/components/use-entity-edit-form.ts
    read `nowhere` — The file declares no shape for a field. It reads `useWatch({ control, name: "fields"
    })` and passes `held` along, and the field shape lives in `EntityFormValues`, imported from "./entity-form-schema".
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/components/entity-field-changed.ts
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-review-entries.ts
  - src/features/entities/components/entity-validity-order.ts
  - src/features/entities/components/use-entity-edit-form.ts
- node: domain/entity-workspace/entity-edit-session
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-form-schema.ts,
    src/features/entities/components/use-entity-review.ts, src/features/entities/components/use-undoable-save.ts,
    and src/features/entities/components/EntityForm.tsx read `nowhere` — The file only reads the session
    from `useEntityEditForm(mountedNode, attributeKeys)`. It declares no shape with `node_id`, `fields`,
    `reason`, `reviewing` or `undo_deadline`.; src/features/entities/components/EntityPage.tsx read `nowhere`
    — The file declares no shape for the session. It reads only `const { nodeId } = useParams({ from:
    entityRoute.id }) as { nodeId: string };` and hands `<EntityForm node={read} attributeKeys={catalogQuery.data}
    />` the data.; src/features/entities/components/entity-edit-payload.ts read `nowhere` — No session,
    reviewing flag or undo deadline is declared; the file holds only pure builders such as `export function
    buildEntityEdit(`.; src/features/entities/components/entity-save-alert.tsx read `nowhere` — the file
    declares no session shape. It only imports `import type { EditOutcome } from "../types";` and declares
    `interface EntitySaveAlertProps { readonly outcome: EditOutcome | null; }`; src/features/entities/components/use-entity-edit-form.ts
    read `nowhere` — `export interface EntityEditForm { readonly node: NodeRead; readonly form: UseFormReturn<EntityFormValues>;
    ... readonly review: EntityReviewState; readonly save: UndoableSave; }` declares none of the session''s
    attributes (node_id, fields, reason, reviewing, undo_deadline). It only composes the hook results.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-save-alert.tsx
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/use-entity-review.ts
  - src/features/entities/components/use-undoable-save.ts
- node: domain/knowledge-base/attribute-change
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/types.ts, and src/features/entities/api/_transforms.ts
    read `nowhere. The shape is declared in ../types, and this file only builds an AttributeChangeWire
    from it.` — function toAttributeChangeWire(change: AttributeChange): AttributeChangeWire {; src/features/entities/components/entity-edit-payload.ts
    read `nowhere` — The shape is imported, not declared: `import type { AttributeChange, AttributeChangeKind,
    ... } from "../types";`. The file only constructs values of it, e.g. `kind: "remove",`. — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/_transforms.ts
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/types.ts
- node: domain/knowledge-base/edit-effect
  conforms: false
  how: 'src/features/entities/api/__tests__/edit-outcomes.spec.ts, line 45, the expected `applied` entry
    of the first test, "is accepted with the node, the action and what was applied when the edit is answered
    200".: effect: "created", — The test states "created" as the effect a 200 answer reports for a change.
    The enumeration holds six effects and "created" is not one of them: first-value, addition, succession,
    correction, removal and unchanged. The accepted answer the knowledge base publishes lists one effect
    per change. A reader who takes the accepted outcome''s shape from this test will think "created" is
    an effect the knowledge base can report. The same fixture value is in `edit-support.ts` (`ACCEPTED_WIRE`),
    and `types.ts` types `effect` as a bare `string`, so nothing fails if a value outside the set arrives.

    src/features/entities/api/__tests__/edit-support.ts, ACCEPTED_WIRE, the first entry of applied (line
    34): effect: "created", — The fixture stands in for the accepted answer the upstream publishes, and
    it gives that answer an effect the specification never names. The effect enumeration holds first-value,
    addition, succession, correction, removal and unchanged. The wire type declares effect as a bare string,
    so the compiler does not catch the value. Tests that read this fixture assert against an effect word
    the knowledge base never sends. The next reader takes "created" as one of the effects and finds no
    node that holds it.'
  observed_at:
  - src/features/entities/components/entity-change-effect.ts
- node: rules/application-shell/a-failed-refresh-ends-the-session
  conforms: true
  how: 'src/features/entities/api/_edit-request.ts: held at refreshSession() catch branch and the throw
    in entityEdit() — useAuthStore.getState().clear();

    redirectImpl(SIGN_IN_EXPIRED);

    const SIGN_IN_EXPIRED = "/sign-in?reason=session_expired";

    code: "AUTH_SESSION_EXPIRED",'
  encoded_at:
  - src/features/entities/api/_edit-request.ts
  decided_by: reading
  remainder: testable
  remainder_why: Set up a request through the request helper that gets a 401, then make the refresh fail.
    Run it with the real redirect in place and the browser's location stubbed. Expect the stored token
    to be cleared, the caller to get AUTH_SESSION_EXPIRED, and the page to be replaced with "/sign-in?reason=session_expired"
    (location.replace called with that address, and no history-keeping navigation made).
  read_at:
    node: sha256:4de53bb7ac99e124792842291b5e804ea2593b6b7fd683d7f5c1fd259ceb562a
    proof:
    - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
      digest: sha256:263b899e6ba2243de100822309f95ffef53e7d1afeae05ff99f7306855e0e957
- node: rules/application-shell/a-fresh-owner-skips-sign-in
  conforms: true
  how: 'src/router/routes.tsx: held at signInRoute beforeLoad, lines 96-106 — `try { fresh = useAuthStore.getState().isFresh();
    } catch { fresh = false; } if (fresh) { throw redirect({ to: "/chat" }); }`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/a-loading-workspace-says-so-politely
  conforms: true
  how: 'src/router/routes.tsx: held at the Suspense fallbacks of chatRoute, ingestRoute and curationRoute
    — `role="status" aria-live="polite"` around "Carregando conversa…", "Carregando ingestão…" and "Carregando
    curadoria…"'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/a-request-is-cut-off-after-thirty-seconds
  conforms: true
  how: "src/features/entities/api/_edit-request.ts: held at the timer in sendOnce() — controller.abort(\n\
    \      new DOMException(\"Request timed out after 30s\", \"TimeoutError\"),\n    );\n  }, DEFAULT_TIMEOUT_MS);"
  encoded_at:
  - src/features/entities/api/_edit-request.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Call the request helper itself with a non-ingestion request, whose server answers only
    after 30000 ms. Expected result: the request is not aborted at 29999 ms, and at 30000 ms it is aborted
    with the reason "Request timed out after 30s". The helper is the single place the fact is put on,
    so that one input against that one result decides the fact for every non-ingestion request.'
  read_at:
    node: sha256:8b5dc757d5dcda2028e17ae37b7db3e9c7bb8e02390e6e185f92636d4cda9aa6
    proof:
    - file: src/features/entities/api/__tests__/edit-request-cutoff.spec.ts
      digest: sha256:89a27dd97fc53595795573c0a307df93f8922e18488f1aff10176f649bbc96b2
- node: rules/application-shell/an-unknown-address-says-page-not-found
  conforms: true
  how: 'src/router/routes.tsx: held at notFoundRoute, lines 217-227, for the not-found address. The handling
    of an address that matches no route is not in this file. — `path: "/not-found"` with `title="Página
    não encontrada." hint="O endereço solicitado não existe ou foi removido."`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/chat-and-curation-keep-one-search-key
  conforms: true
  how: 'src/router/routes.tsx: held at validateSearch of chatRoute and of curationRoute — `if (typeof
    raw === "string" && raw.length > 0) { return { conversation: raw }; } return {};` and the same for
    `{ item: raw }`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/every-other-address-is-guarded
  conforms: true
  how: 'src/router/routes.tsx: held at the routeTree and protectedLayoutRoute with ProtectedLayout — `protectedLayoutRoute.addChildren([
    indexRoute, chatRoute, graphRoute, searchRoute, ingestRoute, curationRoute, entityListRoute, entityRoute,
    historyRoute, notFoundRoute, ])` and `<AppShell><Outlet /></AppShell>`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/sign-in-shows-the-expiry-notice-for-its-reason
  conforms: false
  how: 'no named file holds this fact now: src/router/routes.tsx read `nowhere` — signInRoute declares
    no search validation and no notice, only `component: () => <SignInPage />`. The reading of the reason
    lives in SignInPage, another file.'
  observed_at:
  - src/router/routes.tsx
- node: rules/application-shell/sign-in-sits-outside-the-guarded-shell
  conforms: true
  how: 'src/router/routes.tsx: held at signInRoute and the routeTree — `getParentRoute: () => RootRoute,
    path: "/sign-in"` and `RootRoute.addChildren([ signInRoute, protectedLayoutRoute.addChildren([`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/some-addresses-show-only-a-placeholder
  conforms: true
  how: 'src/router/routes.tsx: held at graphRoute, searchRoute and historyRoute carry the three titles.
    The line "Conteúdo em breve." is not in this file. — `<StubPage title="Grafo" testId="graph-page"
    />`, `<StubPage title="Busca" testId="search-page" />`, `<StubPage title="Histórico" testId="history-page"
    />`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-guard-needs-a-fresh-token
  conforms: true
  how: 'src/router/routes.tsx: held at protectedLayoutRoute beforeLoad, lines 46-54 — `const fresh = useAuthStore.getState().isFresh();
    if (!fresh) { throw redirect({ to: "/sign-in", search: { reason: "session_expired" }, }); }`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-palette-lives-inside-the-shell
  conforms: false
  how: 'no named file holds this fact now: src/router/routes.tsx read `nowhere` — The file mounts only
    `<AppShell><Outlet /></AppShell>` and names no palette or shortcut.'
  observed_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-root-address-leads-to-chat
  conforms: true
  how: 'src/router/routes.tsx: held at indexRoute, lines 58-64, a child of the guarded layout so the guard''s
    beforeLoad runs first — `getParentRoute: () => protectedLayoutRoute, path: "/", beforeLoad: () =>
    { throw redirect({ to: "/chat" }); }`'
  encoded_at:
  - src/router/routes.tsx
- node: rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/_edit-request.ts, and
    src/features/entities/api/_request.ts read `nowhere` — the file calls http<T>(path, { method: "GET",
    headers: bearerHeaders(), signal }) and states no refresh, no repeat and no 30000 millisecond cutoff.
    The Authorization getter only reads the token afresh at each send. — a binding asserts the file answers
    for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never restamped
    here'
  observed_at:
  - src/features/entities/api/_edit-request.ts
  - src/features/entities/api/_request.ts
- node: rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-change-effect.ts,
    and src/features/entities/components/use-entity-edit-form.ts read `nowhere` — The file only passes
    `values` and `node.attributes` to `useEntityReview(held, changed, values, attributeKeys, node.attributes,
    ...)`. Judging an effect happens in another file. — a binding asserts the file answers for the node,
    so the pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-change-effect.ts
  - src/features/entities/components/use-entity-edit-form.ts
- node: rules/entity-workspace/a-change-writes-an-empty-member-as-null
  conforms: true
  how: "src/features/entities/api/_transforms.ts: held at memberOrNull and toAttributeChangeWire. Every\
    \ member is always present, an empty member is written as null, and a remove change sends null in\
    \ value, valid_from and valid_to. — if (member === undefined || member === null || member.length ===\
    \ 0) { return null; } and value: removes ? null : memberOrNull(change.value), item_id: memberOrNull(change.itemId),\
    \ valid_from: removes ? null : memberOrNull(change.validFrom), valid_to: removes ? null : memberOrNull(change.validTo),\n\
    src/features/entities/components/entity-edit-payload.ts: held at memberOf, NO_VALIDITY and removeChangeOf,\
    \ lines 28-62; setChangeOf, lines 64-75 — return text === \"\" ? null : text;  /  const NO_VALIDITY:\
    \ FieldValidity = { validFrom: null, validTo: null };  /  kind: \"remove\",\n    value: null,\n  \
    \  itemId: field.itemId,\n    ...NO_VALIDITY,"
  encoded_at:
  - src/features/entities/api/_transforms.ts
  - src/features/entities/components/entity-edit-payload.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/api/__tests__/edit-request-wire.spec.ts
  - src/features/entities/components/__tests__/entity-edit-payload.spec.ts
- node: rules/entity-workspace/a-changed-stable-field-offers-no-validity
  conforms: true
  how: 'src/features/entities/components/entity-field-group.tsx: held at The condition that gates ValidityFields
    on the key being temporal. — {attributeKey.isTemporal && changed[index] === true ? (<ValidityFields
    ... />) : null}'
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
- node: rules/entity-workspace/a-changed-temporal-field-offers-its-validity
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-field-group.tsx,
    src/features/entities/components/entity-validity-fields.tsx, and src/features/entities/components/entity-field-changed.ts
    read `nowhere` — `isFieldChanged` tests only `field.value === field.startedWith`; it offers no validity
    start or end; src/features/entities/components/use-entity-edit-form.ts read `nowhere` — The file states
    no validity-start or validity-end offer. It only computes `validityOrderMessages(held, changed, attributeKeys)`
    through an import. — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-field-changed.ts
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-validity-fields.tsx
  - src/features/entities/components/use-entity-edit-form.ts
- node: rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
  conforms: true
  how: 'src/features/entities/components/entity-allowed-values.ts: held at `allowedValueOptions` and `allowedValueLabel`,
    lines 8-20. `isAllowedValue`, lines 22-27, tests membership in the same list. — `return allowedValues.map((allowed)
    => ({ value: allowed.value, label: allowedValueLabel(allowed), }));` and `return label === null ||
    label.trim().length === 0 ? allowed.value : label;`

    src/features/entities/components/entity-closed-choice.tsx: held at the Select binding at line 56 over
    the options built at lines 28-31 from allowedValues; the in-order, label-or-value construction is
    in entity-allowed-values.ts, which this file imports — const options = useMemo(() => allowedValueOptions(allowedValues),
    [allowedValues]); ... options={options}

    src/features/entities/components/entity-field-group.tsx: held at The branch that hands the key''s
    allowed values to ClosedChoice instead of a free-text Input. The order and labels of the values are
    decided in the imported ClosedChoice. — <ClosedChoice name={numbered ? `${key} (valor ${position +
    1})` : key} ... value={field.value} allowedValues={allowedValues} describedBy={described} onChange={field.onChange}
    />'
  encoded_at:
  - src/features/entities/components/entity-allowed-values.ts
  - src/features/entities/components/entity-closed-choice.tsx
  - src/features/entities/components/entity-field-group.tsx
  decided_by: reading
  read_at:
    node: sha256:6bef8ea28169b326ca4f764debc93a14e02475607e27703b8ee56db52c5c5a5a
    proof:
    - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
      digest: sha256:5fcc07b1225d1669abbae38e2f8bf9f3c10c3583e4714286542472a91c15857e
- node: rules/entity-workspace/a-conflict-keeps-the-typed-values
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-save-alert.tsx,
    src/features/entities/components/use-undoable-save.ts, and src/features/entities/api/edit.hooks.ts
    read `nowhere` — The file only returns `{ kind: "conflict", ...conflictFacts(error.details) }`. Nothing
    in it keeps typed values or alerts the owner, because that belongs to the form. — a binding asserts
    the file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,
    never restamped here'
  observed_at:
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/components/entity-save-alert.tsx
  - src/features/entities/components/use-undoable-save.ts
- node: rules/entity-workspace/a-deleted-node-shows-its-own-alert
  conforms: true
  how: "src/features/entities/components/EntityPage.tsx: held at the `nodeFailure === \"deleted\"` branch\
    \ of the body chain — `} else if (nodeFailure === \"deleted\") { body = <NodeDeletedAlert />;` takes\
    \ the place of the form, and the `NodeDeletedAlert` element is given no retry prop, unlike `<FormLoadErrorAlert\
    \ onRetry={retry} />`.\nsrc/features/entities/components/entity-page-helpers.ts: held at NODE_DELETED_CODE\
    \ and the \"deleted\" branch of classifyNodeFailure(), lines 7 and 14. The alert text and the absence\
    \ of a retry are not in this file. — export const NODE_DELETED_CODE = \"BUSINESS_NODE_DELETED\"; if\
    \ (error.code === NODE_DELETED_CODE) return \"deleted\";\nsrc/features/entities/components/entity-page-parts.tsx:\
    \ held at NodeDeletedAlert. It carries no retry action and no failure code or message. — <Alert variant=\"\
    warning\" role=\"alert\" data-testid=\"entity-deleted\">\n    Este nó foi apagado.\n  </Alert>"
  encoded_at:
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-page-helpers.ts
  - src/features/entities/components/entity-page-parts.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityPage.node.spec.tsx
- node: rules/entity-workspace/a-disputed-key-links-to-the-curation-queue
  conforms: true
  how: "src/features/entities/components/entity-disputed-values.tsx: held at The Link element at lines\
    \ 33-42. It targets the curation address with no search key and reads the written text. — <Link\n\
    \      to=\"/curation\"\n      data-testid={`entity-curation-link-${attributeKey}`}\n...\n      Abrir\
    \ na fila de curadoria\n    </Link>"
  encoded_at:
  - src/features/entities/components/entity-disputed-values.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
- node: rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation
  conforms: true
  how: 'src/features/entities/components/entity-disputed-values.tsx: held at The DisputedValues component.
    It renders each value as plain list text with no input, and renders the pointer to curation. Deciding
    which key is disputed is not done in this file; the component receives the key''s values through its
    props. — {values.map((attribute) => (<li key={attribute.id} ... >{attribute.value}</li>))} followed
    by <Link to="/curation" ...>

    src/features/entities/components/entity-field-group.tsx: held at The DisputedValues branch and the
    guard that hides the add button for a disputed key. Whether the key has any field is decided by the
    `fields` prop the caller passes. This file does not itself drop fields when `disputed` is true. —
    {disputed ? (<DisputedValues attributeKey={key} values={heldValues} />) : null} and {listed && !disputed
    ? (<Button ref={addRef} ...

    src/features/entities/components/entity-form-schema.ts: held at DISPUTED_ATTRIBUTE_STATUS, line 5,
    isDisputedKey, lines 100-109, and the early return in startingFieldsOf, line 156. The pointer text
    is not in this file. — attribute.attributeKey === key && attribute.status === DISPUTED_ATTRIBUTE_STATUS
    ... if (isDisputedKey(node.attributes, key)) return [];'
  encoded_at:
  - src/features/entities/components/entity-disputed-values.tsx
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-form-schema.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
- node: rules/entity-workspace/a-failed-save-reads-its-wording
  conforms: true
  how: 'src/features/entities/components/entity-save-alert.tsx: held at the constants CONFLICT_ALERT_TEXT
    and COULD_NOT_BE_SENT_ALERT_TEXT and the conflict and unreachable cases that render them — `export
    const CONFLICT_ALERT_TEXT = "Este nó mudou desde que você abriu o formulário.";` and `export const
    COULD_NOT_BE_SENT_ALERT_TEXT = "Não foi possível enviar a edição. Tente novamente.";`'
  encoded_at:
  - src/features/entities/components/entity-save-alert.tsx
- node: rules/entity-workspace/a-field-accepts-only-its-value-type
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-form-schema.ts,
    src/features/entities/components/entity-value-types.ts, and src/features/entities/components/use-entity-edit-form.ts
    read `nowhere` — The file only asks the schema built elsewhere whether the held values pass, with
    `schema.safeParse({ fields: held }).success`. The value-type rule itself sits in `buildEntityFormSchema`,
    in another file.; src/features/entities/components/zod-issue-resolver.ts read `nowhere` — the file
    only forwards what the schema reported: `flat[path] = { type: issue.code, message: issue.message };`.
    It reads no value type. — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-value-types.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/zod-issue-resolver.ts
- node: rules/entity-workspace/a-field-added-to-a-multi-valued-key-starts-empty
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-form-schema.ts,
    and src/features/entities/components/EntityForm.tsx read `nowhere` — `onAdd={() => append(emptyField(group.attributeKey.key))}`
    only calls `emptyField`. What an added field starts with is decided where `emptyField` is declared,
    which is not this file. — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/entity-form-schema.ts
- node: rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-field-changed.ts,
    and src/features/entities/components/entity-review-entries.ts read `nowhere` — the file receives the
    verdict and decides nothing: `changed: readonly boolean[],` and `changed[index] === true` — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-field-changed.ts
  - src/features/entities/components/entity-review-entries.ts
- node: rules/entity-workspace/a-field-is-changed-only-by-its-value
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-field-changed.ts,
    and src/features/entities/components/entity-review-entries.ts read `nowhere` — `changed[index] ===
    true ? [heldEntry(field, index, keys, attributes)] : []` takes the changed flags as given and never
    compares value with startedWith — a binding asserts the file answers for the node, so the pair that
    stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-field-changed.ts
  - src/features/entities/components/entity-review-entries.ts
- node: rules/entity-workspace/a-field-shows-its-key-description-as-help-text
  conforms: true
  how: 'src/features/entities/components/entity-field-group.tsx: held at The help paragraph, which is
    wired into each field''s aria-describedby. — const description = attributeKey.description; ... {hasHelp
    ? (<p id={helpId} className="text-xs text-muted-foreground">{description}</p>) : null}'
  encoded_at:
  - src/features/entities/components/entity-field-group.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
- node: rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-field-group.tsx,
    src/features/entities/components/entity-form-schema.ts, and src/features/entities/components/EntityForm.tsx
    read `nowhere` — `onAdd={() => append(emptyField(group.attributeKey.key))}` and `onRemove={remove}`
    are passed to every group alike. Whether a key allows multiple values, and which fields it shows,
    is not decided in this file. — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-form-schema.ts
- node: rules/entity-workspace/a-save-failure-is-classified-by-its-code
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/edit.hooks.ts, and src/features/entities/types.ts
    read `nowhere` — The file declares only the outcome vocabulary, `export type EditOutcome = | EditAccepted
    | EditConflict | EditRefused | EditUnreachable | EditSessionEnded;`. It holds no mapping from a failure
    code to an outcome. — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/types.ts
- node: rules/entity-workspace/a-saved-edit-reloads-the-entity
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/edit.hooks.ts, src/features/entities/components/use-entity-edit-form.ts,
    src/features/entities/components/use-undoable-save.ts, and src/features/entities/api/node.hooks.ts
    read `nowhere` — useReloadedNode only reads the cache: `return state?.status === "success" ? state.data
    : undefined;`. It starts no refetch or invalidation, so the reload is not held here. — a binding asserts
    the file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,
    never restamped here'
  observed_at:
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/api/node.hooks.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/use-undoable-save.ts
- node: rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-value-types.ts,
    and src/features/entities/components/entity-field-group.tsx read `nowhere` — The file only shows whatever
    message the form schema produced: `const message = fieldState.error?.message;` ... {message}. It states
    no wording and no type check. — a binding asserts the file answers for the node, so the pair that
    stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-value-types.ts
- node: rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/listing.hooks.ts, and
    src/features/entities/components/entity-list-parts.tsx read `nowhere. The file only declares the "all
    types" choice value. The request is built elsewhere.` — export const ALL_TYPES_VALUE = ""; — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/listing.hooks.ts
  - src/features/entities/components/entity-list-parts.tsx
- node: rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
  conforms: true
  how: 'src/features/entities/components/entity-edit-payload.ts: held at validityStatedBy, lines 43-52
    (the sent-empty half; the shows-as-today half is not in this file) — validFrom: memberOf(field.validFrom),
    validTo: memberOf(field.validTo),

    src/features/entities/components/entity-form-schema.ts: held at the empty validity start of fieldStartingFrom,
    line 146, and emptyField, line 135. Showing it as today is not in this file. — validFrom: "", validTo:
    "",

    src/features/entities/components/entity-review.tsx: held at ReviewItem, the validity-start span, which
    shows today for an unstated start. What is sent is not decided in this file. — const startStated =
    validity !== null && validity.from !== ""; ... {startStated ? validity.from : today}

    src/features/entities/components/entity-validity-fields.tsx: held at the `unstated` branch of the
    validFrom Controller, which shows today in a note while the field keeps its empty value — `const unstated
    = field.value === "";` and `{`Início não informado: aparece como hoje, ${todayLocalDate()}.`}`. The
    input stays bound to `{...field}`, so it is not filled in. What the save sends is not decided in this
    file.'
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-review.tsx
  - src/features/entities/components/entity-validity-fields.tsx
  decided_by: reading
  remainder: testable
  remainder_why: 'Input: an attribute field in the edit form whose value the owner changes without stating
    a validity start, with the clock fixed. Expected result: that field''s own validity start shows as
    the fixed day, before the review opens.'
  read_at:
    node: sha256:a0017c1dfe274b8ab220524e1ca1436251dc6c6cb392d613ec9c80d27d38206d
    proof:
    - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
      digest: sha256:710fd87ee84cb8e822ff9ff86102af41aebf81ee1bcf3564af9c15a15c7259db
- node: rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-local-date.ts,
    and src/features/entities/components/entity-review.tsx read `nowhere` — const today = todayLocalDate();
    ... the file only calls the helper imported from "./entity-local-date". It states no time zone or
    clock itself.; src/features/entities/components/entity-validity-fields.tsx read `nowhere` — The file
    only calls `todayLocalDate()`, imported from "./entity-local-date". It states nothing about the time
    zone or the clock. — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-local-date.ts
  - src/features/entities/components/entity-review.tsx
  - src/features/entities/components/entity-validity-fields.tsx
- node: rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field
  conforms: true
  how: 'src/features/entities/components/EntityForm.tsx: held at the `outsideCatalog` memo and the `<OutsideCatalogValues
    groups={outsideCatalog} />` render, which show the values without a field. What counts as outside
    the catalog is decided in `outsideCatalogGroupsOf`, which is not in this file. — `const outsideCatalog
    = useMemo(() => outsideCatalogGroupsOf(node.attributes, attributeKeys), [node, attributeKeys]);` and
    `<OutsideCatalogValues groups={outsideCatalog} />`

    src/features/entities/components/entity-form-schema.ts: held at outsideCatalogGroupsOf, lines 82-98
    — if (catalogKeys.has(attribute.attributeKey)) continue; if (!isHeldAttribute(attribute)) continue;

    src/features/entities/components/entity-outside-catalog-values.tsx: held at the OutsideCatalogValues
    component, which renders each group as a dt with the key and a dd with the value. It declares no field
    or input anywhere. The choice of which attributes count as outside the catalog is made by outsideCatalogGroupsOf
    in entity-form-schema.ts, not in this file. — <dt className="text-xs text-muted-foreground">{key}</dt>
    ... <dd key={attribute.id} data-testid={`entity-outside-catalog-value-${key}`} className="text-sm
    text-foreground"> {attribute.value} </dd>'
  encoded_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-outside-catalog-values.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
- node: rules/entity-workspace/entity-workspace-requests-carry-the-access-token
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/_edit-request.ts, src/features/entities/api/_request.ts,
    and src/features/entities/api/catalog.hooks.ts read `nowhere. This file only calls entityGet, and
    the bearer header is built in _request.ts, which is outside this file set.` — await entityGet<AttributeKeyListWire>(`/api/v1/attribute-keys?${search.toString()}`,
    signal); src/features/entities/api/node.hooks.ts read `nowhere` — `await entityGet<NodeReadWire>(`/api/v1/nodes/${encodeURIComponent(nodeId)}`,
    signal)` sets no Authorization header. The header is not in this file. — a binding asserts the file
    answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never
    restamped here'
  observed_at:
  - src/features/entities/api/_edit-request.ts
  - src/features/entities/api/_request.ts
  - src/features/entities/api/catalog.hooks.ts
  - src/features/entities/api/node.hooks.ts
- node: rules/entity-workspace/fields-start-from-the-current-values
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-form-schema.ts,
    and src/features/entities/components/EntityForm.tsx read `nowhere` — `const { fields, append, remove
    } = useFieldArray({ control, name: "fields" });` only reads the fields. The initial values are set
    in `useEntityEditForm`, which is not this file. — a binding asserts the file answers for the node,
    so the pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/entity-form-schema.ts
- node: rules/entity-workspace/review-lists-each-changed-field-once
  conforms: true
  how: 'src/features/entities/components/entity-review-entries.ts: held at reviewEntriesOf, with the ReviewEntry
    shape — `return [...changedEntries, ...removedEntries].sort(` over held fields with `changed[index]
    === true` and baseline fields from `removedFieldsOf(held, baseline)`, each entry carrying `readonly
    startedWith: string;` and `readonly value: string;`

    src/features/entities/components/entity-review.tsx: held at The entries.map in EntityReview, which
    renders one ReviewItem per entry, and the ReviewItem dl that puts the previous value beside the new
    value. — {entries.map((entry) => ( <ReviewItem key={entry.id} entry={entry} today={today} /> ))}'
  encoded_at:
  - src/features/entities/components/entity-review-entries.ts
  - src/features/entities/components/entity-review.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
- node: rules/entity-workspace/review-names-each-effect-in-its-wording
  conforms: true
  how: 'src/features/entities/components/entity-change-effect.ts: held at the EDIT_EFFECT_WORDING record,
    lines 19-25 — "first-value": "Primeiro valor", addition: "Adição", succession: "Sucessão", correction:
    "Correção", removal: "Remoção",'
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
- node: rules/entity-workspace/review-needs-a-changed-field
  conforms: true
  how: 'src/features/entities/components/entity-review.tsx: held at The guard at the top of EntityReview,
    which renders no review and no button while `offered` is false. What counts as changed is decided
    in the review state, not here. — if (!offered) return null;

    src/features/entities/components/use-entity-review.ts: held at the `offered` declaration, line 38,
    which requires entries derived from changed fields — `const offered = valueTypesAccepted && entries.length
    > 0;`'
  encoded_at:
  - src/features/entities/components/entity-review.tsx
  - src/features/entities/components/use-entity-review.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'For each field kind the form renders (temporal, multi-valued held, multi-valued added),
    use one input: change that field, then return it to the value it started with. An added field is emptied
    or removed. The expected result each time is that the review is not offered.'
  read_at:
    node: sha256:46329254475470490e76b067da81491064eeebd2c0e1a82ec3ea38a0e26297df
    proof:
    - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
      digest: sha256:382e60f38d657042da09ff84f1b178d26abf61bf7da7e10a04bac79ef4488919
- node: rules/entity-workspace/review-requires-a-trimmed-reason
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-edit-payload.ts,
    src/features/entities/components/entity-review-reason.ts, src/features/entities/components/use-entity-review.ts,
    and src/features/entities/components/entity-review.tsx read `nowhere` — The file holds no length bound
    and no trimming. It reads `reasonTooLong` and `saveOffered` from the review state, uses the first
    only as `aria-invalid={reasonTooLong}`, and gates the button with `{saveOffered ? (`. Both values
    are decided elsewhere. — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/components/entity-review-reason.ts
  - src/features/entities/components/entity-review.tsx
  - src/features/entities/components/use-entity-review.ts
- node: rules/entity-workspace/review-states-the-effect-of-each-change
  conforms: true
  how: 'src/features/entities/components/entity-change-effect.ts: held at the effect member of the FieldChange
    that changeOfField returns for each changed field, lines 27-31 and 38-66 — return { kind: "set", effect:
    "first-value", itemId: null };

    src/features/entities/components/entity-review-entries.ts: held at effectOf, used by heldEntry and
    removedEntry, and the ReviewEntry.effect member — `return changeOfField(field, attributeKey, attributes)?.effect
    ?? null;` and `effect: effectOf(field, keys, attributes),`

    src/features/entities/components/entity-review.tsx: held at ReviewItem, the Efeito block, which shows
    the entry''s effect. — {EDIT_EFFECT_WORDING[entry.effect]}'
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
  - src/features/entities/components/entity-review-entries.ts
  - src/features/entities/components/entity-review.tsx
- node: rules/entity-workspace/save-sends-one-change-per-changed-field
  conforms: true
  how: "src/features/entities/components/entity-edit-payload.ts: held at fieldsToSend, changeOf, removeChangeOf\
    \ and setChangeOf, lines 54-101 — changed[index] === true ? [{ field, removed: false }] : []  /  return\
    \ changeKindOf(item, attributeKey, attributes) === \"remove\"\n    ? removeChangeOf(item.field)\n\
    \    : setChangeOf(item.field, attributeKey);  /  kind: \"set\",\n    value: memberOf(field.value),\n\
    \    itemId: field.itemId,"
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/entity-edit-payload.spec.ts
- node: rules/entity-workspace/saving-waits-for-undo
  conforms: true
  how: 'src/features/entities/components/use-undoable-save.ts: held at UNDO_WINDOW_MS and the setTimeout
    in confirm(). The send runs only in the timer callback, and the undo action clears the timer. — export
    const UNDO_WINDOW_MS = 5_000; const timer = setTimeout(() => { toast.dismiss(toastId); void send(variables);
    }, UNDO_WINDOW_MS); clearTimeout(timer);'
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
- node: rules/entity-workspace/the-form-has-a-field-group-per-catalog-key
  conforms: true
  how: 'src/features/entities/components/EntityForm.tsx: held at the `groups.map` that renders one `EntityFieldGroup`
    per group, keyed by `group.attributeKey.key`. Which groups exist, and their order, come from `buildFieldGroups`,
    which is not in this file. — `const groups = useMemo(() => buildFieldGroups(node, attributeKeys, fields),
    [node, attributeKeys, fields]);` and `{groups.map((group) => ( <EntityFieldGroup key={group.attributeKey.key}
    attributeKey={group.attributeKey}`

    src/features/entities/components/entity-field-group.tsx: held at The component renders the group for
    one catalog key. The one-group-per-key iteration and its order sit in the caller. — <div role="group"
    aria-labelledby={titleId} data-testid={`entity-group-${key}`} ...> with `const key = attributeKey.key;`

    src/features/entities/components/entity-form-schema.ts: held at buildFieldGroups, lines 176-196, and
    buildFormValues, lines 165-174. Both follow the catalog''s order. — return attributeKeys.map((attributeKey)
    => {'
  encoded_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/entity-field-group.tsx
  - src/features/entities/components/entity-form-schema.ts
  decided_by: reading
  remainder: testable
  remainder_why: 'Each gap closes with one input against one expected result. First input: a catalog that
    lists a key taking several values, a key carrying dates, and a key with a closed list of allowed values,
    mixed with text keys. Expected result: one group per key, in catalog order, found by key rather than
    by counting `input` elements. Second input: a catalog key whose only attribute is disputed. Expected
    result under the node as written: the form still holds a group for that key. That assertion contradicts
    what "offers no field, prefilled or empty, for a key holding a disputed attribute" pins now, so a
    person decides between the node and that test before such a test can be written.'
  read_at:
    node: sha256:b7d88fb05c2789bd1ae85f7adf81debe60c00636510b0295f5df830c07ff01a8
    proof:
    - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
      digest: sha256:0c6b55a5d222635d9c96c1cf9677b08c6ca291979239bf3fd3d21bf680d073cd
- node: rules/entity-workspace/the-form-is-offered-only-for-an-active-node
  conforms: true
  how: 'src/features/entities/components/EntityPage.tsx: held at the formNodeType derivation and the `formNodeType
    === null` branch — `read !== undefined && read.node.status === ACTIVE_NODE_STATUS ? read.node.nodeType
    : null` and `} else if (formNodeType === null) { body = <NodeAttributeList attributes={read.attributes}
    />;`

    src/features/entities/components/entity-page-helpers.ts: held at the ACTIVE_NODE_STATUS declaration,
    line 9. The test that withholds the form is not in this file. — export const ACTIVE_NODE_STATUS =
    "active";'
  encoded_at:
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-page-helpers.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityPage.node.spec.tsx
- node: rules/entity-workspace/the-listing-and-page-states-read-their-wording
  conforms: true
  how: 'src/features/entities/components/entity-list-parts.tsx: held at ListLoading, ListErrorAlert, ListEmpty
    and RetryAlert. The listing wording and the try-again action label are held here. The page-level texts
    (node not found, form load failure, edit notice, undo) are not in this file. — "Carregando nós…";
    "Não foi possível carregar os nós. Tente novamente."; "Nenhum nó encontrado."; the RetryAlert button
    text "Tentar novamente"; the alert takes only message, onRetry and test ids and carries no code or
    message of the failure''s own.

    src/features/entities/components/entity-page-parts.tsx: held at FormLoading, NodeNotFoundAlert and
    FormLoadErrorAlert hold the page-side wording. The listing wording and the recorded-edit notice are
    not in this file. — "Carregando formulário…"; "Nó não encontrado."; "Não foi possível carregar o formulário.
    Tente novamente."; "Tentar novamente". None of these carries a code or message of the failure''s own.

    src/features/entities/components/use-undoable-save.ts: held at The RECORDED_NOTICE and UNDO_ACTION_LABEL
    constants. Both match the node''s wording. The other texts of the node are not in this file. — export
    const RECORDED_NOTICE = "Edição registrada."; export const UNDO_ACTION_LABEL = "Desfazer";

    src/router/routes.tsx: held at the Suspense fallbacks of entityListRoute and entityRoute. The alerts,
    no-node statement and edit notice are not in this file. — `Carregando nós…` and `Carregando formulário…`,
    each in a `role="status" aria-live="polite"` div'
  encoded_at:
  - src/features/entities/components/entity-list-parts.tsx
  - src/features/entities/components/entity-page-parts.tsx
  - src/features/entities/components/use-undoable-save.ts
  - src/router/routes.tsx
- node: rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/listing.hooks.ts, and
    src/features/entities/components/EntityListPage.tsx read `nowhere` — The file hands the two narrowings
    to the hook as `useNodeListing({ namePrefix, nodeType })`. The parameter names name_prefix and node_type,
    and the omission of a narrowing not given, are not stated in this file.; src/features/entities/components/entity-list-parts.tsx
    read `nowhere. The file builds no request. TypeChoice offers the type by name, but the query parameters
    are set elsewhere.` — ...types.map((type) => ({ value: type.name, label: type.name })) — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/listing.hooks.ts
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/entity-list-parts.tsx
- node: rules/entity-workspace/the-node-listing-stands-without-the-node-types
  conforms: true
  how: 'src/features/entities/components/EntityListPage.tsx: held at the `typeChoice` chain, with `listing`
    computed independently of `types` — if (types.data !== undefined) { typeChoice = (<TypeChoice types={types.data}
    value={nodeType} onChange={setNodeType} />); } else if (types.isError) { typeChoice = (<TypesErrorAlert
    onRetry={() => { void types.refetch(); }} />); } else { typeChoice = <TypesLoading />; } and `const
    listing = useNodeListing({ namePrefix, nodeType });`

    src/features/entities/components/entity-list-parts.tsx: held at TypesLoading and TypesErrorAlert hold
    the loading indication and the could-not-load-types alert with its retry action. That the node listing
    stays offered meanwhile is not decided here. — message="Não foi possível carregar os tipos de nó.
    Tente novamente." with retryTestId="entity-list-types-retry" and the "Tentar novamente" action; TypesLoading
    renders role="status" "Carregando tipos de nó…"'
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/entity-list-parts.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
- node: rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type
  conforms: true
  how: 'src/features/entities/components/EntityListPage.tsx: held at the `namePrefix` and `nodeType` state,
    the prefix input, and the call to useNodeListing, plus the NodeList render — const [namePrefix, setNamePrefix]
    = useState(""); const [nodeType, setNodeType] = useState(""); const listing = useNodeListing({ namePrefix,
    nodeType }); results = <NodeList nodes={listing.data.items} />;

    src/features/entities/components/entity-list-parts.tsx: held at NodeList, which lists each node with
    its name, type and status and links to open it. TypeChoice offers the type narrowing. — <Link to="/entities/$nodeId"
    params={{ nodeId: node.id }} ...>{node.canonicalName}</Link> with node.nodeType and node.status in
    the list item'
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/entity-list-parts.tsx
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
- node: rules/entity-workspace/the-screen-lives-at-the-entities-addresses
  conforms: true
  how: 'src/router/routes.tsx: held at entityListRoute (path "/entities"), entityRoute (path "/entities/$nodeId")
    and the lazy() imports, lines 19-28 — `const EntityPage = lazy(() => import("@/features/entities/components/EntityPage")...`
    and `const EntityListPage = lazy(() => import("@/features/entities/components/EntityListPage")...`'
  encoded_at:
  - src/router/routes.tsx
  decided_by: reading
  remainder: testable
  remainder_why: Start the application at /graph with a session. Open /entities/{node identity} directly,
    without opening /entities first. Expect the form page's code to be fetched once, the form to be shown
    at /entities/{node identity}, and the listing page's code not to be fetched.
  read_at:
    node: sha256:cdad032f9476bace0d4575115b9f83a85f4071d9d4ecd7c4a88cbac088e494f2
    proof:
    - file: src/router/__tests__/routes.entity-list.dom.spec.tsx
      digest: sha256:1658e89c7bccaf730ff0de3150e9d51d04467d61243c844b2bb62844ca9b271a
- node: rules/entity-workspace/validity-start-precedes-the-end
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-validity-fields.tsx,
    src/features/entities/components/entity-validity-order.ts, and src/features/entities/components/use-entity-edit-form.ts
    read `nowhere` — The file only consumes the result of the rule through `const validityOrder = useMemo(()
    => validityOrderMessages(held, changed, attributeKeys), ...)` and `validityOrder.every((message) =>
    message === null)`. It states neither the ordering comparison nor the message.; src/features/entities/components/use-entity-review.ts
    read `nowhere` — the file receives only a boolean, `validityOrderAccepted: boolean`, and uses it in
    `saveOffered: open && validityOrderAccepted && isReasonAccepted(reason)`. It compares no dates and
    shows no message on an end field. — a binding asserts the file answers for the node, so the pair that
    stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-validity-fields.tsx
  - src/features/entities/components/entity-validity-order.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/use-entity-review.ts
- node: rules/knowledge-base/attribute-value-parses
  conforms: true
  how: 'src/features/entities/components/entity-value-types.ts: held at DATE_PATTERN, NUMBER_PATTERN,
    namesExistingDay, readsAsDate, readsAsNumber and readsAsBool (lines 6-37). — const DATE_PATTERN =
    /^\d{4}-\d{2}-\d{2}$/; const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/; return NUMBER_PATTERN.test(value)
    && Number.isFinite(Number(value)); return value === "true" || value === "false";'
  encoded_at:
  - src/features/entities/components/entity-value-types.ts
- node: rules/knowledge-base/entity-edit-addition
  conforms: true
  how: 'src/features/entities/components/entity-change-effect.ts: held at the addition branch of changeOfField,
    lines 59-64. It sets no itemId, requires a key that allows multiple values and a value the key does
    not already hold, and states no closure. — attributeKey.allowsMultiple && !holdsValue(attributes,
    field.attributeKey, field.value) ... return { kind: "set", effect: "addition", itemId: null };'
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
- node: rules/knowledge-base/entity-edit-correction
  conforms: true
  how: 'src/features/entities/components/entity-change-effect.ts: held at the set branch for a field that
    carries an itemId, line 51, when the key is not temporal — effect: attributeKey.isTemporal ? "succession"
    : "correction",'
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
- node: rules/knowledge-base/entity-edit-first-value
  conforms: true
  how: 'src/features/entities/components/entity-change-effect.ts: held at the first-value branch of changeOfField,
    lines 56-58. A set change with no itemId, made to a key of which the node holds no attribute, takes
    the effect first-value. — if (heldAttributesOf(attributes, field.attributeKey).length === 0) { return
    { kind: "set", effect: "first-value", itemId: null }; }'
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
- node: rules/knowledge-base/entity-edit-removal
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-change-effect.ts,
    and src/features/entities/components/entity-review-entries.ts read `nowhere` — the file builds a removal
    entry but leaves the effect to changeOfField in another file: `effect: effectOf({ ...field, value:
    "" }, keys, attributes),` — a binding asserts the file answers for the node, so the pair that stopped
    holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-change-effect.ts
  - src/features/entities/components/entity-review-entries.ts
- node: rules/knowledge-base/entity-edit-succession
  conforms: true
  how: 'src/features/entities/components/entity-change-effect.ts: held at the set branch for a field that
    carries an itemId, line 51, when the key is temporal — effect: attributeKey.isTemporal ? "succession"
    : "correction",'
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
- node: scenarios/entity-workspace/a-conflict-keeps-what-the-owner-typed
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-save-alert.tsx,
    and src/features/entities/components/EntityForm.tsx read `nowhere` — `<EntitySaveAlert outcome={save.outcome}
    />` only passes the outcome along. The conflict handling and the typed values are not stated in this
    file. — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/entity-save-alert.tsx
- node: scenarios/entity-workspace/an-unstated-start-is-sent-empty
  conforms: true
  how: 'src/features/entities/components/entity-edit-payload.ts: held at validityStatedBy, lines 43-52
    (the change is sent with no validity start) — validFrom: memberOf(field.validFrom),'
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
- node: scenarios/entity-workspace/undo-within-five-seconds-sends-nothing
  conforms: true
  how: 'src/features/entities/components/use-undoable-save.ts: held at The undo action''s onClick in confirm().
    It cancels the pending send and clears none of the form. — onClick: () => { clearTimeout(timer); busy.current
    = false; }'
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  decided_by: test
  step: test
  proof:
  - src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
unstated:
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  where: the test at line 101 and the last catalog entry of the test at line 34, which treat an allowed
    value whose label is the empty string as one that has no label
  evidence: it("shows an allowed value whose label is the empty string by its own value, not as an empty
    option", ... allowed("venus-code", ""), ... "venus-code",
  cost: The node and its decision log say a value "that has no label" is shown by its own value. Neither
    says whether an empty-string label counts as no label, and the domain node allowed-value only declares
    `label` as an optional string. This test makes that choice. An owner and a later reader see the rule
    only here. If the catalog ever ships an empty label on purpose, the form and the specification will
    disagree and no node says which one was decided.
- file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  where: the test at line 67, "keeps the order the catalog delivers the allowed values in, whatever their
    sort orders and whatever alphabetical order would give"
  evidence: allowed("k", "Medium", 30), allowed("c", "Urgent", 10), allowed("t", "High", 20), allowed("a",
    "Low", 40), ... toEqual(["Medium", "Urgent", "High", "Low"])
  cost: The node says only "in their order". The allowed-value domain node gives each value a `sort_order`
    ("its place in the key's order"), and the retrieval listing is stated elsewhere to give values in
    ascending string order. This test decides that the form shows the listing's delivery order and ignores
    `sort_order`. That decides what order the owner sees for every closed key, for example the status
    of a Task, and no node states it. The next reader would look in the specification for which order
    is meant and find two candidates.
- file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  where: the first test of "entity form review listing of changed fields", lines 49-53, the expected order
    of the listed entries
  evidence: 'expect(listed.map(({ key, previous, next }) => ({ key, previous, next }))).toEqual([ { key:
    "tag", previous: "Alpha", next: "Alpha-edited" }, { key: "tag", previous: "Beta", next: "Beta-edited"
    }, { key: "title", previous: "Alpha", next: "Gamma" }, ]);'
  cost: 'The test fixes an order for the review''s entries: both tag fields come before title, although
    the catalog lists title first (CATALOG = [catalogKey("title"), temporalKey("role"), catalogKey("note"),
    multiKey("tag")]). No node of the set states how the review orders its entries, so this order is a
    decision that lives only in the test. The next reader will look for it in the specification and not
    find it.'
- file: src/features/entities/components/entity-closed-choice.tsx
  where: the paragraph shown when heldOutside is true, line 80
  evidence: '{`Valor atual fora dos valores permitidos: ${value}`}'
  cost: 'This is text the running system shows the owner. It states a domain fact: when the node''s current
    value is not among a key''s allowed values, the field keeps showing that value and tells the owner
    it is outside them. No node holds that fact. The entity-screen contract and a-closed-key-offers-only-its-allowed-values
    say only that a closed key offers its allowed values. The next reader looks for this behavior in the
    specification and finds it only in the component.'
- file: src/features/entities/components/entity-edit-payload.ts
  where: buildEntityEdit, the .sort(...) over the built changes (lines 129-130)
  evidence: .sort((first, second) => first.position - second.position)
  cost: 'The order in which the edit lists its changes is chosen only here: catalog position of the key,
    with changed fields ahead of removed fields inside one key (the sort is stable over fieldsToSend).
    The knowledge base answers one `applied` entry per change "in the order given", and its conflict and
    no-second-current-value judgments are made over that edit. The next reader looks in the specification
    for the order a save sends its changes and finds none, so the order reads as an implementation accident
    rather than a decision.'
- file: src/features/entities/components/entity-form-schema.ts
  where: outsideCatalogGroupsOf, line 92, and heldAttributesOf, lines 68-75
  evidence: if (!isHeldAttribute(attribute)) continue;
  cost: The node says an attribute whose key the catalog no longer holds "MUST show its value without
    a field", with no status condition. The code drops every attribute that is superseded, deleted or
    of any status outside the three listed. That exclusion is a rule about what the owner sees, and it
    lives only here. The next reader looks for it in the specification and does not find it.
- file: src/features/entities/components/entity-list-parts.tsx
  where: TypesLoading, the text of the node-type loading indication (line 82)
  evidence: Carregando tipos de nó…
  cost: The wording shown while the node-type listing is fetched lives only in this component. The sibling
    indications ("Carregando nós…", "Carregando formulário…") have their wording written in a node, so
    a reader checking the specification for what the screen says here finds nothing. A change to this
    wording would never reach a node.
- file: src/features/entities/components/entity-review.tsx
  where: ReviewValue, line 19, the wording shown for a value that is empty
  evidence: <span className="italic text-muted-foreground">Sem valor</span>
  cost: The text the review shows for an absent previous or new value, such as a first value or a removal,
    is a wording no node holds. The wording rules of the entity workspace pin the texts the screen shows
    to the letter ("Edição registrada.", "Primeiro valor" and others). This one lives only in this component,
    so the next reader looks in the specification and finds no such text. A later edit to it would not
    be a decision anyone recorded.
unbound:
- src/features/entities/api/__tests__/attribute-keys.spec.ts
- src/features/entities/api/__tests__/edit-outcomes-aborted.spec.ts
- src/features/entities/api/__tests__/edit-outcomes.spec.ts
- src/features/entities/api/__tests__/edit-request-cutoff.spec.ts
- src/features/entities/api/__tests__/edit-request-failures.spec.ts
- src/features/entities/api/__tests__/edit-request-sending.spec.ts
- src/features/entities/api/__tests__/edit-request-session.spec.ts
- src/features/entities/api/__tests__/edit-request-wire.spec.ts
- src/features/entities/api/__tests__/edit-support.ts
- src/features/entities/api/__tests__/listing-failures.spec.ts
- src/features/entities/api/__tests__/listing-requests.spec.ts
- src/features/entities/api/__tests__/listing-session.spec.ts
- src/features/entities/api/__tests__/listing-through-http.spec.ts
- src/features/entities/api/__tests__/listing-timing.spec.ts
- src/features/entities/api/__tests__/node-catalog-cases.ts
- src/features/entities/api/__tests__/node-catalog-failures.spec.ts
- src/features/entities/api/__tests__/node-catalog-refresh.spec.ts
- src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
- src/features/entities/api/__tests__/node-catalog-token.spec.ts
- src/features/entities/api/__tests__/node-read.spec.ts
- src/features/entities/api/__tests__/support.ts
- src/features/entities/api/keys.ts
- src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
- src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
- src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
- src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
- src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
- src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
- src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
- src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
- src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
- src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
- src/features/entities/components/__tests__/EntityForm.review-local-date.spec.tsx
- src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
- src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
- src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
- src/features/entities/components/__tests__/EntityForm.save-unreachable.spec.tsx
- src/features/entities/components/__tests__/EntityForm.session-expired.spec.tsx
- src/features/entities/components/__tests__/EntityForm.starting-values.spec.tsx
- src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
- src/features/entities/components/__tests__/EntityForm.validity-local-date.spec.tsx
- src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
- src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
- src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
- src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
- src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
- src/features/entities/components/__tests__/EntityPage.node.spec.tsx
- src/features/entities/components/__tests__/EntityPage.states.spec.tsx
- src/features/entities/components/__tests__/entity-change-effect.spec.ts
- src/features/entities/components/__tests__/entity-edit-payload-support.ts
- src/features/entities/components/__tests__/entity-edit-payload.spec.ts
- src/features/entities/components/__tests__/entity-field-changed.spec.ts
- src/features/entities/components/__tests__/entity-form-closed-support.ts
- src/features/entities/components/__tests__/entity-form-conflict-support.tsx
- src/features/entities/components/__tests__/entity-form-effect-support.ts
- src/features/entities/components/__tests__/entity-form-failure-support.ts
- src/features/entities/components/__tests__/entity-form-multi-support.tsx
- src/features/entities/components/__tests__/entity-form-order-support.ts
- src/features/entities/components/__tests__/entity-form-outside-support.ts
- src/features/entities/components/__tests__/entity-form-payload-support.ts
- src/features/entities/components/__tests__/entity-form-reason-support.ts
- src/features/entities/components/__tests__/entity-form-reload-support.tsx
- src/features/entities/components/__tests__/entity-form-review-support.ts
- src/features/entities/components/__tests__/entity-form-router-support.tsx
- src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
- src/features/entities/components/__tests__/entity-form-schema.spec.ts
- src/features/entities/components/__tests__/entity-form-support.tsx
- src/features/entities/components/__tests__/entity-form-undo-support.ts
- src/features/entities/components/__tests__/entity-form-validity-support.ts
- src/features/entities/components/__tests__/entity-form-value-type-support.ts
- src/features/entities/components/__tests__/entity-value-types.spec.ts
- src/features/entities/components/__tests__/list-support.tsx
- src/features/entities/components/__tests__/page-support.tsx
- src/features/entities/components/__tests__/session-token.ts
- src/features/entities/components/__tests__/value-type-wording.ts
- src/router/__tests__/route-support.tsx
- src/router/__tests__/routes.entity-list.dom.spec.tsx
- src/router/__tests__/routes.entity.dom.spec.tsx
notes: "Judged by 114 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/entity-edit-frontend.returns/.\nCertification of rules/application-shell/a-failed-refresh-ends-the-session\
  \ did not hold: the auditor answered `partial` — In this test the refresh is rejected after a 401 on\
  \ an entity edit. It checks that the stored token is null afterwards and that the caller gets the code\
  \ AUTH_SESSION_EXPIRED. It also checks that \"/sign-in?reason=session_expired\" was handed to the redirect\
  \ function the test installed through __setEditRedirectForTests. Because the test swaps in its own redirect\
  \ function, it only sees which address was handed over, not how the browser went there. If the page\
  \ were opened with a navigation that keeps a history entry, rather than replaced, every assertion would\
  \ still pass, so the \"replace the page\" part of the fact is not tested. The fact applies to the request\
  \ helper, but the set only tests it through entityEdit and its edit-specific redirect function. Nothing\
  \ in the set tests a failed refresh on any other request that goes through the helper. The sibling test\
  \ \"fails carrying status 401 and reading Sua sessão expirou. Faça login novamente.\" checks status\
  \ and message only, not the token, the redirect or the code, so it is not cited.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Set up a request through the request helper that gets a 401, then make\
  \ the refresh fail. Run it with the real redirect in place and the browser's location stubbed. Expect\
  \ the stored token to be cleared, the caller to get AUTH_SESSION_EXPIRED, and the page to be replaced\
  \ with \"/sign-in?reason=session_expired\" (location.replace called with that address, and no history-keeping\
  \ navigation made)..\nCertification of rules/application-shell/a-request-is-cut-off-after-thirty-seconds\
  \ did not hold: the auditor answered `partial` — The fact covers every request that is not an ingestion\
  \ request, and it is placed on the request helper. The offered proof sends exactly one such request:\
  \ the entity edit, through entityEdit. For that one request, the named test checks three things. The\
  \ signal is not aborted at 29999 ms. It is aborted at 30000 ms. The abort reason reads \"Request timed\
  \ out after 30s\". The test would fail if any of those stopped holding for the edit. Nothing in the\
  \ set sends any other non-ingestion request, such as a read or a request with another method or path,\
  \ and nothing calls the request helper directly. So the cutoff for every other non-ingestion request\
  \ is never exercised. If the edit got its 30 s cutoff some way other than the shared helper, these tests\
  \ would still pass while the helper's fact failed. The named test also checks the failure code SYSTEM_TIMEOUT\
  \ in the same toEqual. The fact does not state that code, so the test asserts more than the fact, and\
  \ changing that code would also break this proof. The sibling test \"fails with SYSTEM_TIMEOUT reading\
  \ Tempo limite excedido na requisição.\" checks a user-facing message the fact does not state. It also\
  \ moves the clock straight past 30000 ms without checking the boundary, so it would still pass with\
  \ any cutoff earlier than 60000 ms. For that reason it is not cited as proof of this fact.. The node\
  \ is decided by reading, and a certification standing on it from an earlier reconciliation is released\
  \ by the bind. The remainder is testable: Call the request helper itself with a non-ingestion request,\
  \ whose server answers only after 30000 ms. Expected result: the request is not aborted at 29999 ms,\
  \ and at 30000 ms it is aborted with the reason \"Request timed out after 30s\". The helper is the single\
  \ place the fact is put on, so that one input against that one result decides the fact for every non-ingestion\
  \ request..\nCertified rules/entity-workspace/a-change-writes-an-empty-member-as-null as decided by\
  \ step `test`: src/features/entities/api/__tests__/edit-request-wire.spec.ts (writes the six members\
  \ of every change, JSON null in every empty member and null in value and validity of a remove change);\
  \ src/features/entities/components/__tests__/entity-edit-payload.spec.ts (writes JSON null in every\
  \ member that holds nothing and in the value and validity of a remove change); src/features/entities/components/__tests__/entity-edit-payload.spec.ts\
  \ (sends one remove change naming the attribute it started from, with null value and validity, for $label);\
  \ src/features/entities/components/__tests__/entity-edit-payload.spec.ts (sends a set change that names\
  \ no attribute for $label); src/features/entities/components/__tests__/entity-edit-payload.spec.ts (sends\
  \ a null validity start, and no date of today, when the owner states none and $label) would fail if\
  \ the fact stopped holding.\nCertified rules/entity-workspace/a-changed-stable-field-offers-no-validity\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx\
  \ (offers no validity start and no validity end for a changed field of a key that is not temporal) would\
  \ fail if the fact stopped holding.\nCertification of rules/entity-workspace/a-changed-temporal-field-offers-its-validity\
  \ held (src/features/entities/components/__tests__/EntityForm.validity.spec.tsx, src/features/entities/components/__tests__/EntityForm.validity.spec.tsx\
  \ would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and\
  \ a test-decided binding rests on a reading that did.\nCertification of rules/entity-workspace/a-closed-key-offers-only-its-allowed-values\
  \ did not hold: the auditor answered `unauditable` — The fact says the field offers the allowed values\
  \ \"in their order\", and that phrase can be read two ways. It could mean the order the catalog delivers\
  \ the values in. It could also mean the order set by each value's own sort order, which the fixtures\
  \ carry as `sortOrder` (`allowed(value, label, sortOrder)`). On the input these tests use, the two readings\
  \ expect different results. In \"offers a closed key every allowed value and nothing else...\" and \"\
  keeps the order the catalog delivers...\", the fixtures deliberately give sort orders that disagree\
  \ with delivery order: k/30, c/10, t/20, a/40. Both tests then assert the delivery order (Medium, Urgent,\
  \ High, Low), and they name it as theirs \"whatever their sort orders\". Under the sort-order reading,\
  \ the same input expects Urgent, High/t, Medium, Low. So if that reading is the one meant, these two\
  \ tests would fail on a correct implementation instead of proving the fact. The node does not say which\
  \ order is meant, and choosing one here would certify a fact nobody wrote.\nThe rest of the fact is\
  \ exercised: - \"Only those values\": the offered options are compared by exact array equality, including\n\
  \  when the node holds a current value outside the allowed set, and for an added entry of a\n  multi-valued\
  \ key.\n- \"Each by its label\": labels are shown instead of the values themselves. - A value with no\
  \ label is shown by its value. The tests cover both a null label and an\n  empty-string label, and the\
  \ value is neither dropped nor shown as an empty option.\n\nThe offered list is read from the rendered\
  \ `role=\"option\"` elements after the choice is opened (helper `openChoice` in entity-form-closed-support.ts).\
  \ So those parts would fail if they stopped holding.. The node is decided by reading, and a certification\
  \ standing on it from an earlier reconciliation is released by the bind.\nCertified rules/entity-workspace/a-deleted-node-shows-its-own-alert\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityPage.node.spec.tsx (shows\
  \ the deleted-node alert in place of the form, with no action and no code or message of the failure's\
  \ own) would fail if the fact stopped holding.\nCertified rules/entity-workspace/a-disputed-key-links-to-the-curation-queue\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx\
  \ (makes the pointer a link to exactly /curation, with no search, reading exactly 'Abrir na fila de\
  \ curadoria'); src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx (leads to\
  \ the curation address when the pointer is followed) would fail if the fact stopped holding.\nCertified\
  \ rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation as decided by step\
  \ `test`: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx (decides a key's\
  \ disputed state from the status of its attributes alone: $label); src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx\
  \ (shows every value a disputed key holds); src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx\
  \ (shows no field and no add or remove control for a disputed key that is $label); src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx\
  \ (shows the pointer in the disputed key's group alone and keeps the field of a key beside it); src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx\
  \ (leads to the curation address when the pointer is followed); src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx\
  \ (makes the pointer a link to exactly /curation, with no search, reading exactly 'Abrir na fila de\
  \ curadoria') would fail if the fact stopped holding.\nCertification of rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed\
  \ held (src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx, src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx, src/features/entities/components/__tests__/entity-edit-payload.spec.ts,\
  \ src/features/entities/components/__tests__/entity-edit-payload.spec.ts would fail if the fact stopped\
  \ holding) and is not written: the judgment did not clear the node, and a test-decided binding rests\
  \ on a reading that did.\nCertification of rules/entity-workspace/a-field-is-changed-only-by-its-value\
  \ held (src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx, src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx,\
  \ src/features/entities/components/__tests__/entity-edit-payload.spec.ts, src/features/entities/components/__tests__/entity-edit-payload.spec.ts\
  \ would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and\
  \ a test-decided binding rests on a reading that did.\nCertified rules/entity-workspace/a-field-shows-its-key-description-as-help-text\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx\
  \ (shows each field the description the catalog holds for its own key as help text) would fail if the\
  \ fact stopped holding.\nCertification of rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields\
  \ held (src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx, src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx, src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx, src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx would fail if the fact\
  \ stopped holding) and is not written: the judgment did not clear the node, and a test-decided binding\
  \ rests on a reading that did.\nCertification of rules/entity-workspace/a-saved-edit-reloads-the-entity\
  \ held (src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx, src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx, src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx, src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx\
  \ would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and\
  \ a test-decided binding rests on a reading that did.\nCertification of rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording\
  \ held (src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx, src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx, src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx\
  \ would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and\
  \ a test-decided binding rests on a reading that did.\nCertification of rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given\
  \ held (src/features/entities/api/__tests__/listing-requests.spec.ts, src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx\
  \ would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and\
  \ a test-decided binding rests on a reading that did.\nCertification of rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty\
  \ did not hold: the auditor answered `partial` — The \"sent empty\" half is fully exercised. The deadline\
  \ is changed without stating a start, both with and without a stated end. Both tests assert the sent\
  \ change carries valid_from null, and that today's date appears nowhere in the request body. The clock\
  \ is pinned to 2026-06-15, so a start that silently became today would make them fail.\nThe \"show as\
  \ today\" half is exercised only in the review panel. Each test reads that panel's validity-start text\
  \ for the deadline and checks it contains 2026-06-15. The node constrains the attribute field and names\
  \ no place where the start shows. Nothing in the offered proof reads the attribute field in the form,\
  \ so an unstated start that stopped showing as today there would pass both tests. The review panel would\
  \ still say today.\nBoth tests also assert more than the fact states. \"Sent empty\" is pinned to an\
  \ explicit null: an omitted valid_from would fail them even though it is arguably also \"empty\". That\
  \ pinning is a fact for a reader to route, not one this audit settles. The file's first test states\
  \ a start of 2026-06-14 and bears on this fact not at all.. The node is decided by reading, and a certification\
  \ standing on it from an earlier reconciliation is released by the bind. The remainder is testable:\
  \ Input: an attribute field in the edit form whose value the owner changes without stating a validity\
  \ start, with the clock fixed. Expected result: that field's own validity start shows as the fixed day,\
  \ before the review opens..\nCertification of rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date\
  \ did not hold: the auditor answered `partial` — Both tests fix the browser clock at 23:30 on 2026-01-31\
  \ in America/Sao_Paulo, an instant where UTC has already reached 2026-02-01. They assert that the today\
  \ shown for an unstated start reads 2026-01-31 and not 2026-02-01: one checks the field's today note,\
  \ the other checks the review listing. So a today read in UTC would fail them, and so would any date\
  \ not taken from the browser clock. But both tests run under only one time zone, so they cannot tell\
  \ the zone the browser reports apart from a zone written into the code. An implementation that pinned\
  \ America/Sao_Paulo or a fixed UTC-3 offset would pass both, and the \"as the browser reports it\" part\
  \ of the fact is not exercised. Nothing in the set tests a zone east of UTC either, where the local\
  \ date is ahead of the UTC date.. The node is decided by reading, and a certification standing on it\
  \ from an earlier reconciliation is released by the bind. The remainder is testable: Fix the same kind\
  \ of instant under a second time zone the browser reports, one that is ahead of UTC. For example, use\
  \ Asia/Tokyo at 08:30 local on 2026-02-01, when UTC is still on 2026-01-31. The today shown for an unstated\
  \ start, in both the field note and the review, should read 2026-02-01 and not 2026-01-31. That checks\
  \ the shown date follows the zone the browser reports rather than a fixed one..\nCertified rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx\
  \ (shows the value of an attribute whose key the catalog does not hold, and adds no field for it); src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx\
  \ (shows the value of every attribute outside the catalog, across keys and across several values of\
  \ one key); src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx (leaves the\
  \ form with exactly the controls its catalog keys give, whatever lies outside the catalog); src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx\
  \ (gives no input, select, textarea, combobox or button that carries or represents an outside-catalog\
  \ value) would fail if the fact stopped holding.\nCertification of rules/entity-workspace/fields-start-from-the-current-values\
  \ did not hold: the auditor answered `partial` — Both halves of the fact are exercised. A key holding\
  \ a current attribute starts with that value: location gives \"Lisbon\", and status_text gives \"New-status\"\
  \ over its stale \"Old-status\". A key holding none starts empty: owner, whose only attribute is stale,\
  \ and deadline, which holds nothing. The gap is the word \"current\". The fixtures come from staleAttribute,\
  \ which sets status \"superseded\" and isCurrent false together, and heldAttribute, which sets status\
  \ \"active\" and isCurrent true together. No attribute in the set is current with a status other than\
  \ \"active\", and none is non-current with status \"active\". So a form that picks a field's starting\
  \ value by status instead of by whether the attribute is current passes this test while breaking the\
  \ fact. A separate point to route, not settle: valuesByKey pairs keys to fields by position, taking\
  \ every input in the container in catalog order. The test therefore also requires that the form renders\
  \ no other input and lays fields out in catalog order. The fact states neither.. The node is decided\
  \ by reading, and a certification standing on it from an earlier reconciliation is released by the bind.\
  \ The remainder is testable: Two inputs, each against one expected result. First, a node whose only\
  \ attribute for a key is current but has a status other than \"active\": the field must start with that\
  \ value. Second, a node whose only attribute for a key has status \"active\" but is not current: the\
  \ field must start empty..\nCertified rules/entity-workspace/review-lists-each-changed-field-once as\
  \ decided by step `test`: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx\
  \ (lists each changed field once with the value it started with beside the value it now holds) would\
  \ fail if the fact stopped holding.\nCertified rules/entity-workspace/review-names-each-effect-in-its-wording\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (names a first value, an addition, a succession, a correction and a removal with their exact texts\
  \ and no ending punctuation); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (states a succession for a field of a temporal key that started from a current attribute and was changed\
  \ to another non-empty value); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (states a correction for a field of a key that is not temporal that started from a current attribute\
  \ and was changed to another non-empty value); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (states a first value for a field given a value when $label); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (states an addition for a field added to a multi-valued key when $label); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (states a removal for a field of $label emptied after starting with a value); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (states a removal for a field removed from a multi-valued key after starting with a value); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx\
  \ (states a first value for both of two fields added to a multi-valued key of which the node holds no\
  \ live attribute); src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx (states\
  \ an addition for both of two fields added to a multi-valued key of which the node holds a live attribute);\
  \ src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx (states an addition\
  \ for a field added while the same edit removes the only live attribute of the key) would fail if the\
  \ fact stopped holding.\nCertification of rules/entity-workspace/review-needs-a-changed-field did not\
  \ hold: the auditor answered `partial` — The fact applies to every field on the form. This test fails\
  \ if the review is offered when the form opens, before anything is edited. It also fails if the review\
  \ stays offered after the single-valued \"title\" field is typed back to the value it started with,\
  \ so it tells \"differs\" apart from \"was touched\" for that one field kind. Nothing in the set does\
  \ the same for the other field kinds the form renders. The temporal \"role\" field and the multi-valued\
  \ \"tag\" field are both on this form but neither is edited. No test edits a temporal field's value\
  \ and then restores it. No test retypes a held multi-valued field and then restores it. No test adds\
  \ a value field and then empties or removes it. In each of those cases, a form that offered the review\
  \ after the field came back to its starting value would still pass. The test also checks that the review\
  \ is offered while the title differs (whileChanged: true). The node does not state that: it only forbids\
  \ the offer while nothing differs. That assertion bears on a sibling fact, not this one. The other tests\
  \ in the file assert other refusals: no review while a value its key's type refuses stands, and no review\
  \ for an added field that repeats an active or uncertain value. They do not exercise a form where no\
  \ field differs from its starting value.. The node is decided by reading, and a certification standing\
  \ on it from an earlier reconciliation is released by the bind. The remainder is testable: For each\
  \ field kind the form renders (temporal, multi-valued held, multi-valued added), use one input: change\
  \ that field, then return it to the value it started with. An added field is emptied or removed. The\
  \ expected result each time is that the review is not offered..\nCertified rules/entity-workspace/save-sends-one-change-per-changed-field\
  \ as decided by step `test`: src/features/entities/components/__tests__/entity-edit-payload.spec.ts\
  \ (sends a set change carrying the value, the validity the field states and the attribute it started\
  \ from for $label); src/features/entities/components/__tests__/entity-edit-payload.spec.ts (sends a\
  \ set change that names no attribute for $label); src/features/entities/components/__tests__/entity-edit-payload.spec.ts\
  \ (sends one remove change naming the attribute it started from, with null value and validity, for $label);\
  \ src/features/entities/components/__tests__/entity-edit-payload.spec.ts (sends no change for fields\
  \ the owner left as they started); src/features/entities/components/__tests__/entity-edit-payload.spec.ts\
  \ (sends one change for each changed field, a set change for a held or new value and a remove change\
  \ for an emptied or removed one, and none for the fields left as they started); src/features/entities/components/__tests__/entity-edit-payload.spec.ts\
  \ (writes JSON null in every member that holds nothing and in the value and validity of a remove change);\
  \ src/features/entities/components/__tests__/entity-edit-payload.spec.ts (sends no change for a field\
  \ whose value equals the one it started with, whatever validity it holds) would fail if the fact stopped\
  \ holding.\nCertified rules/entity-workspace/saving-waits-for-undo as decided by step `test`: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx\
  \ (sends no edit before five seconds have passed); src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx\
  \ (sends the edit once, as a POST to the node's edit address, when five seconds pass without an undo);\
  \ src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx (sends nothing and leaves\
  \ the typed values when the owner undoes three seconds after confirming); src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx\
  \ (leaves the reason as typed and the review open after an undo); src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx\
  \ (lets the owner press Salvar again after an undo, and sends that edit once its own five seconds pass);\
  \ src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx (sends the edit only after\
  \ five seconds without an undo, and an undo sends nothing and leaves the form as it was) would fail\
  \ if the fact stopped holding.\nCertification of rules/entity-workspace/the-form-has-a-field-group-per-catalog-key\
  \ did not hold: the auditor answered `partial` — \"holds one field for every catalog key...\" covers\
  \ part of the fact. It uses a catalog of three keys listed out of alphabetical order (gamma, alpha,\
  \ beta). One key holds no value. All three keys are plain text keys that take one value and carry no\
  \ dates. The test checks that every `input` in the form appears in catalog order ([\"G-value\", \"\"\
  , \"B-value\"]). It would fail if a group were dropped, if the order changed, or if a key holding no\
  \ value lost its group. The fact's \"every attribute key the catalog holds\" goes unchecked for any\
  \ other kind of key. Nothing in the set uses a key that takes several values, a key that carries dates,\
  \ or a key with a closed list of allowed values. Such a key may render a group with more than one input,\
  \ or with a control that is not an `input`. The helper `valuesOf` counts only `input` elements, so it\
  \ would never see that control. So nothing shows that such keys get their group, or get it in catalog\
  \ order.\n\"offers no field, prefilled or empty, for a key holding a disputed attribute\" pins the opposite\
  \ of the node as written. The catalog holds alpha and beta, and alpha holds a disputed attribute. The\
  \ test asserts that the form holds only beta's field, so the form has no group for a key the catalog\
  \ holds. If the fact held whole, that test would fail. The node states no exception for disputed attributes.\
  \ Which one stands, the node or the test, is a person's decision. This audit does not settle it.\n\"\
  adds no field for an attribute whose key the catalog does not hold\" asserts more than this node says.\
  \ The node requires a group for every catalog key. It does not say there is no group for a key outside\
  \ the catalog. That exclusion is not a fact this node states.\n\"shows each field the description the\
  \ catalog holds for its own key as help text\" pairs each key with an input by position. It would also\
  \ fail if the order changed, but only as a side effect of checking help text. Nothing in that test marks\
  \ the order as the point.. The node is decided by reading, and a certification standing on it from an\
  \ earlier reconciliation is released by the bind. The remainder is testable: Each gap closes with one\
  \ input against one expected result. First input: a catalog that lists a key taking several values,\
  \ a key carrying dates, and a key with a closed list of allowed values, mixed with text keys. Expected\
  \ result: one group per key, in catalog order, found by key rather than by counting `input` elements.\
  \ Second input: a catalog key whose only attribute is disputed. Expected result under the node as written:\
  \ the form still holds a group for that key. That assertion contradicts what \"offers no field, prefilled\
  \ or empty, for a key holding a disputed attribute\" pins now, so a person decides between the node\
  \ and that test before such a test can be written..\nCertified rules/entity-workspace/the-form-is-offered-only-for-an-active-node\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityPage.node.spec.tsx (offers\
  \ the form only for an active node and shows the attributes of any other node without a form (status\
  \ %s)); src/features/entities/components/__tests__/EntityPage.node.spec.tsx (shows no field for a node\
  \ whose status is not active) would fail if the fact stopped holding.\nCertification of rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name\
  \ held (src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx, src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx,\
  \ src/features/entities/api/__tests__/listing-requests.spec.ts, src/features/entities/api/__tests__/listing-requests.spec.ts\
  \ would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and\
  \ a test-decided binding rests on a reading that did.\nCertified rules/entity-workspace/the-node-listing-stands-without-the-node-types\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx\
  \ (keeps offering the name prefix and the node listing with no node-type narrowing, stands a loading\
  \ indication and then the could-not-load-types alert in place of the type choice, and fetches the types\
  \ again on the alert's action) would fail if the fact stopped holding.\nCertified rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx\
  \ (shows its $label); src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx (lists\
  \ the nodes the knowledge base lists for the name prefix the owner types); src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx\
  \ (lists the nodes the knowledge base lists for the node type the owner picks); src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx\
  \ (offers as node types the node types the knowledge base lists); src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx\
  \ (narrows by the name prefix and the node type together and opens /entities/{identity} of the node\
  \ the owner picks); src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx (carry\
  \ the name prefix under name_prefix and the node type by its name under node_type, and carry neither\
  \ before the owner gives it) would fail if the fact stopped holding.\nCertification of rules/entity-workspace/the-screen-lives-at-the-entities-addresses\
  \ did not hold: the auditor answered `partial` — The tests exercise most of the fact. They show the\
  \ listing at /entities and the form at /entities/n-1. They check that neither page's code is fetched\
  \ when the application first loads at /graph. They check that opening /entities fetches the listing\
  \ code and not the form code. Their only order of visits is the listing first and then the form. Nothing\
  \ in the set opens /entities/{node identity} directly without visiting /entities first. So no test checks\
  \ that opening the form's address leaves the listing page's code unfetched, which the rule requires\
  \ (\"each\" page's code fetched \"only when its address is first opened\"). If a route arrangement fetched\
  \ the listing code whenever the form address opens, the combined test would still pass, because the\
  \ listing code is already loaded by then. Two cited tests also check that preloading an address does\
  \ not fetch its code. The rule follows from that wording and states it nowhere else. The test \"redirects\
  \ a visit without a session to /sign-in instead of showing the listing\" is about the guarded layout,\
  \ which the node's description leaves to rules/application-shell/every-other-address-is-guarded. For\
  \ that reason it is not cited here.. The node is decided by reading, and a certification standing on\
  \ it from an earlier reconciliation is released by the bind. The remainder is testable: Start the application\
  \ at /graph with a session. Open /entities/{node identity} directly, without opening /entities first.\
  \ Expect the form page's code to be fetched once, the form to be shown at /entities/{node identity},\
  \ and the listing page's code not to be fetched..\nCertification of rules/entity-workspace/validity-start-precedes-the-end\
  \ held (src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx, src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx, src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx,\
  \ src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx, src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx\
  \ would fail if the fact stopped holding) and is not written: the judgment did not clear the node, and\
  \ a test-decided binding rests on a reading that did.\nCertification of scenarios/entity-workspace/a-conflict-keeps-what-the-owner-typed\
  \ held (src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx would fail if the fact\
  \ stopped holding) and is not written: the judgment did not clear the node, and a test-decided binding\
  \ rests on a reading that did.\nCertified scenarios/entity-workspace/an-unstated-start-is-sent-empty\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx\
  \ (shows an unstated validity start as today in the review and sends the change with no validity start);\
  \ src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx (shows an unstated validity\
  \ start as today in the review and sends it empty while the owner states a validity end) would fail\
  \ if the fact stopped holding.\nCertified scenarios/entity-workspace/undo-within-five-seconds-sends-nothing\
  \ as decided by step `test`: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx\
  \ (sends nothing and leaves the typed values when the owner undoes three seconds after confirming);\
  \ src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx (sends the edit only after\
  \ five seconds without an undo, and an undo sends nothing and leaves the form as it was) would fail\
  \ if the fact stopped holding.\nStaged by a review over files a delivery wrote: every pair a delivery\
  \ or a hand stamped was judged, and a pair was omitted only where a reconciliation's judgment had cleared\
  \ it at these very bytes; the plan's node(s) contracts/entity-workspace/bff-entity-edit, contracts/entity-workspace/bff-entity-reads,\
  \ contracts/entity-workspace/entity-screen, contracts/knowledge-base/entity-editing, contracts/knowledge-base/retrieval,\
  \ domain/entity-workspace/attribute-field, domain/entity-workspace/entity-edit-session, domain/knowledge-base/attribute-change,\
  \ domain/knowledge-base/edit-effect, rules/application-shell/a-failed-refresh-ends-the-session, rules/application-shell/a-request-is-cut-off-after-thirty-seconds,\
  \ rules/application-shell/every-other-address-is-guarded, rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once,\
  \ rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded, rules/entity-workspace/a-change-writes-an-empty-member-as-null,\
  \ rules/entity-workspace/a-changed-stable-field-offers-no-validity, rules/entity-workspace/a-changed-temporal-field-offers-its-validity,\
  \ rules/entity-workspace/a-closed-key-offers-only-its-allowed-values, rules/entity-workspace/a-conflict-keeps-the-typed-values,\
  \ rules/entity-workspace/a-deleted-node-shows-its-own-alert, rules/entity-workspace/a-disputed-key-links-to-the-curation-queue,\
  \ rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation, rules/entity-workspace/a-failed-save-reads-its-wording,\
  \ rules/entity-workspace/a-field-accepts-only-its-value-type, rules/entity-workspace/a-field-added-to-a-multi-valued-key-starts-empty,\
  \ rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed, rules/entity-workspace/a-field-is-changed-only-by-its-value,\
  \ rules/entity-workspace/a-field-shows-its-key-description-as-help-text, rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields,\
  \ rules/entity-workspace/a-save-failure-is-classified-by-its-code, rules/entity-workspace/a-saved-edit-reloads-the-entity,\
  \ rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording, rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given,\
  \ rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty, rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date,\
  \ rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field, rules/entity-workspace/entity-workspace-requests-carry-the-access-token,\
  \ rules/entity-workspace/fields-start-from-the-current-values, rules/entity-workspace/review-lists-each-changed-field-once,\
  \ rules/entity-workspace/review-names-each-effect-in-its-wording, rules/entity-workspace/review-needs-a-changed-field,\
  \ rules/entity-workspace/review-requires-a-trimmed-reason, rules/entity-workspace/review-states-the-effect-of-each-change,\
  \ rules/entity-workspace/save-sends-one-change-per-changed-field, rules/entity-workspace/saving-waits-for-undo,\
  \ rules/entity-workspace/the-form-has-a-field-group-per-catalog-key, rules/entity-workspace/the-form-is-offered-only-for-an-active-node,\
  \ rules/entity-workspace/the-listing-and-page-states-read-their-wording, rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name,\
  \ rules/entity-workspace/the-node-listing-stands-without-the-node-types, rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type,\
  \ rules/entity-workspace/the-screen-lives-at-the-entities-addresses, rules/entity-workspace/validity-start-precedes-the-end,\
  \ rules/knowledge-base/attribute-value-parses, rules/knowledge-base/entity-edit-addition, rules/knowledge-base/entity-edit-correction,\
  \ rules/knowledge-base/entity-edit-first-value, rules/knowledge-base/entity-edit-removal, rules/knowledge-base/entity-edit-succession,\
  \ scenarios/entity-workspace/a-conflict-keeps-what-the-owner-typed, scenarios/entity-workspace/an-unstated-start-is-sent-empty,\
  \ scenarios/entity-workspace/undo-within-five-seconds-sends-nothing were read on every file and answered\
  \ for, and bound from nowhere here — a binding this record writes is one the trace already held.\nA\
  \ finding in src/features/entities/api/__tests__/attribute-keys.spec.ts names domain/knowledge-base/attribute-key,\
  \ which no file of this set is bound to: the KEYS_WIRE fixture, item k-2 (line 48), and keyNamed() (line\
  \ 63): allows_multiple: true, — The fixture gives the wire member that says a key allows multiple current\
  \ values the name allows_multiple. The attribute-key node names that attribute allows_multiple_current,\
  \ and the retrieval contract's list-attribute-keys answer does not name the wire member. The test pins\
  \ a wire name the specification does not hold. If the knowledge base publishes the node's name, the\
  \ test passes against a shape it never sends. Whoever reads the test for the wire shape will take allows_multiple\
  \ as the decided name. I could not tell from the nodes which name is the wire name.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/features/entities/components/entity-form-schema.ts\
  \ names domain/knowledge-base/live-assertion-status, which no file of this set is bound to: HELD_ATTRIBUTE_STATUSES,\
  \ lines 58-62, and isHeldAttribute, lines 64-66: const HELD_ATTRIBUTE_STATUSES: readonly string[] =\
  \ [\n  \"active\",\n  \"uncertain\",\n  DISPUTED_ATTRIBUTE_STATUS,\n]; — The three statuses a node attribute\
  \ can hold while it is still held are already an enumeration in domain/knowledge-base/live-assertion-status\
  \ (active, uncertain, disputed). This file declares them a second time as its own list, and the node\
  \ is not bound to this file. If the enumeration gains or loses a value, no check reaches this list,\
  \ and nobody can tell which of the two was decided.. It blocks nothing here; it is owed a route of its\
  \ own.\nA finding in src/features/entities/types.ts names domain/knowledge-base/attribute-change-kind,\
  \ which no file of this set is bound to: line 145, the type AttributeChangeKind: export type AttributeChangeKind\
  \ = \"set\" | \"remove\"; — The two kinds of an attribute change are declared here and again in the\
  \ node domain/knowledge-base/attribute-change-kind, whose values are `set` and `remove`. That node is\
  \ not bound to this file, so a change to the enumeration in the node reaches no check on this file.\
  \ If the two disagree later, nobody can tell which one was decided.. It blocks nothing here; it is owed\
  \ a route of its own.\nCandidates: 8 opened across 5 of 114 delegation(s); each return lists its own\
  \ under `candidates_opened`.\nUnstated: 8 fact(s) the source states that no node holds, over 7 file(s),\
  \ listed under `unstated`. They block no binding here and no rebind closes them — the route is the analysis\
  \ that gives each fact a node."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/entity-edit-frontend.returns/`, which are the evidence behind every entry above.
