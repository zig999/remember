---
contract_version: siegard-reconcile/9
title: 'Entity edit screen: merge preparation reconciliation'
summary: The person states these ten files are correct as they stand and asks them to be read again after
  main was merged into the branch and after the decided-fact entries of the contracts bff-entity-reads
  and retrieval; the source did not change in this reconciliation, the specification around it did.
target: frontend
files:
- path: src/features/entities/api/_request.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads and later tasks of the initiative;
    carried by this reconciliation because the node contracts/entity-workspace/bff-entity-reads moved
    when its list-attribute-keys answer gained the allows_multiple_current member.
- path: src/features/entities/api/catalog.hooks.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads; its read of the
    attribute-key listing answers the contract bff-entity-reads as it now stands.
- path: src/features/entities/api/listing.hooks.ts
  change: Written by the delivery of task/knowledge-base-client/listing-reads; its node-type and node
    listing reads answer the contract bff-entity-reads as it now stands.
- path: src/features/entities/api/node.hooks.ts
  change: Written by the delivery of task/knowledge-base-client/node-and-catalog-reads; its read of one
    node answers the contract bff-entity-reads as it now stands.
- path: src/features/entities/components/EntityListPage.tsx
  change: Written by the delivery of task/entity-listing/entity-list-screen; the listing screen consumes
    the reads of bff-entity-reads as it now stands.
- path: src/features/entities/components/EntityPage.tsx
  change: Written by the delivery of task/entity-form/entity-page; the form page consumes the reads of
    bff-entity-reads as it now stands.
- path: src/features/entities/components/entity-allowed-values.ts
  change: Written by the delivery of task/entity-form/closed-key-fields; maps the allowed values of a
    key read through bff-entity-reads as it now stands.
- path: src/features/entities/components/entity-change-effect.ts
  change: Written by the delivery of task/review-and-save/review-effects; the effect rules rules/knowledge-base/entity-edit-first-value
    and entity-edit-removal moved when main was merged.
- path: src/features/entities/components/entity-form-schema.ts
  change: Written by the deliveries of task/entity-form/field-groups and task/entity-form/multi-valued-fields;
    reads the multiple-current-values flag of a key the contract bff-entity-reads now names allows_multiple_current.
- path: src/features/entities/components/entity-review-entries.ts
  change: Written by the delivery of task/review-and-save/review-of-changes; the effect rule rules/knowledge-base/entity-edit-removal
    moved when main was merged.
nodes:
- node: contracts/entity-workspace/bff-entity-reads
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/_request.ts, src/features/entities/api/catalog.hooks.ts,
    src/features/entities/api/listing.hooks.ts, src/features/entities/api/node.hooks.ts, and src/features/entities/components/EntityListPage.tsx
    read `nowhere` — The file issues no read and names no route or parameter. It only calls the hooks,
    `const types = useNodeTypes();` and `const listing = useNodeListing({ namePrefix, nodeType });`. The
    request itself is made outside this file.; src/features/entities/components/EntityPage.tsx read `nowhere`
    — The file issues no request. It only calls the hooks, `const nodeQuery = useNodeRead(nodeId);` and
    `const catalogQuery = useAttributeKeys(formNodeType);`, which are imported from "../api/node.hooks"
    and "../api/catalog.hooks". The request paths, the node_type query parameter and the envelope reading
    are not in this file.; src/features/entities/components/entity-allowed-values.ts read `nowhere` —
    The node governs the GET reads of node types, nodes, one node and attribute keys, with their URLs,
    envelope and refusals. This file makes no request and reads no wire. It only imports `import type
    { AllowedValue } from "../types";` and maps already-read allowed values into `ChoiceOption` entries.
    The label-or-value fallback it applies is held by the candidate node a-closed-key-offers-only-its-allowed-values.;
    src/features/entities/components/entity-form-schema.ts read `nowhere` — The file issues no request
    and declares no wire shape. It only reads `attributeKey.allowsMultiple` and `attributeKey.valueType`
    from `AttributeKey`, imported with `import type { AttributeKey, NodeAttribute, NodeRead } from "../types";`.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/_request.ts
  - src/features/entities/api/catalog.hooks.ts
  - src/features/entities/api/listing.hooks.ts
  - src/features/entities/api/node.hooks.ts
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-allowed-values.ts
  - src/features/entities/components/entity-form-schema.ts
- node: contracts/entity-workspace/entity-screen
  conforms: true
  how: 'src/features/entities/components/EntityListPage.tsx: held at The branch chain over the listing
    state, lines 39-54, which picks the loading, error, empty or list presentation for show-entity-list.
    Lines 56-83 hold the page''s own composition. — if (listing.isPending) { results = <ListLoading />;
    } else if (listing.isError) { results = (<ListErrorAlert onRetry={() => { void listing.refetch();
    }} />); } else if (listing.data.items.length === 0) { results = <ListEmpty />; } else { results =
    <NodeList nodes={listing.data.items} />; }

    src/features/entities/components/EntityPage.tsx: held at the body selection in EntityPage, lines 38-53,
    with the retry at lines 33-36 — `if (nodeFailure === "not-found") { body = <NodeNotFoundAlert />;
    } else if (nodeFailure === "deleted") { body = <NodeDeletedAlert />; } else if (nodeFailure === "other"
    || catalogFailed) { body = <FormLoadErrorAlert onRetry={retry} />; } else if (read === undefined)
    { body = <FormLoading />; } else if (formNodeType === null) { body = <NodeAttributeList attributes={read.attributes}
    />; } else if (catalogQuery.data === undefined) { body = <FormLoading />; } else { body = <EntityForm
    node={read} attributeKeys={catalogQuery.data} />; }`. The form is offered only when `read.node.status
    === ACTIVE_NODE_STATUS`, which is what `formNodeType` tests.'
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/EntityPage.tsx
- node: domain/entity-workspace/attribute-field
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-form-schema.ts,
    and src/features/entities/components/entity-review-entries.ts read `nowhere` — The file imports the
    shape rather than declaring it: `import type { AttributeFieldValues, EntityFormValues, } from "./entity-form-schema";`.
    Its own `ReviewEntry` interface (`readonly startedWith: string; readonly value: string; readonly validity:
    ReviewValidity | null;`) is a review row, not the attribute field''s shape. The file only reads fields
    of `AttributeFieldValues` (`field.attributeKey`, `field.startedWith`, `field.itemId`). — a binding
    asserts the file answers for the node, so the pair that stopped holding it is released by `--bind
    ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-review-entries.ts
- node: domain/entity-workspace/entity-edit-session
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-form-schema.ts,
    and src/features/entities/components/EntityPage.tsx read `nowhere` — The file declares no shape for
    the session, with no type, schema or enumeration of node_id, fields, reason, reviewing or undo_deadline.
    It only reads `nodeId` from `useParams` and passes `node={read}` to `<EntityForm>`. — a binding asserts
    the file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,
    never restamped here'
  observed_at:
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-form-schema.ts
- node: domain/knowledge-base/edit-effect
  conforms: true
  how: "src/features/entities/components/entity-change-effect.ts: held at the `EditEffect` union type,\
    \ lines 12-17. It declares first-value, addition, succession, correction and removal. The sixth enumeration\
    \ value, `unchanged`, is not declared. `changeOfField` returns `null` for an unchanged field instead\
    \ of naming it. — export type EditEffect =\n  | \"first-value\"\n  | \"addition\"\n  | \"succession\"\
    \n  | \"correction\"\n  | \"removal\";"
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
- node: rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
  conforms: true
  how: "src/features/entities/api/_request.ts: held at The lazy `Authorization` getter in bearerHeaders,\
    \ lines 7-10. It is only the part of the rule that says the repeated request carries the new token.\
    \ Starting the refresh, repeating once and the 30000 ms cutoff are not stated in this file. They are\
    \ in the `http` helper, in lib/http.ts. — Object.defineProperty(headers, \"Authorization\", {\n  \
    \  enumerable: true,\n    get: () => authHeader().Authorization ?? \"\",\n  });"
  encoded_at:
  - src/features/entities/api/_request.ts
- node: rules/entity-workspace/a-change-is-judged-against-the-node-as-loaded
  conforms: true
  how: "src/features/entities/components/entity-change-effect.ts: held at `changeOfField`, lines 38-66.\
    \ It judges one field at a time against the `attributes` array it is handed. It takes no other field's\
    \ change as input. — export function changeOfField(\n  field: ChangeSubject,\n  attributeKey: AttributeKey,\n\
    \  attributes: readonly NodeAttribute[],\n): FieldChange | null {"
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
- node: rules/entity-workspace/a-field-accepts-only-its-value-type
  conforms: true
  how: 'src/features/entities/components/entity-form-schema.ts: held at buildEntityFormSchema, the superRefine
    on fields, lines 27-35. The reading of a value as its type is delegated to valueTypeMessage in entity-value-types.
    — const message = valueTypeMessage(valueType, field.value); if (message === null) return; ctx.addIssue({
    code: "custom", message, path: [index, "value"] });'
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
- node: rules/entity-workspace/a-field-added-to-a-multi-valued-key-starts-empty
  conforms: true
  how: 'src/features/entities/components/entity-form-schema.ts: held at emptyField, lines 129-138 — return
    { attributeKey: key, itemId: null, startedWith: "", value: "", validFrom: "", validTo: "", };'
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
- node: rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
  conforms: false
  how: 'no named file holds this fact now: src/features/entities/components/entity-review-entries.ts read
    `nowhere` — The file never compares a field''s value with the held attributes to decide whether it
    counts as changed. It receives the verdict as an argument (`changed: readonly boolean[]`) and applies
    it with `changed[index] === true ? [heldEntry(field, index, keys, attributes)] : []`.'
  observed_at:
  - src/features/entities/components/entity-review-entries.ts
- node: rules/entity-workspace/a-field-is-changed-only-by-its-value
  conforms: false
  how: 'no named file holds this fact now: src/features/entities/components/entity-review-entries.ts read
    `nowhere` — The file does not decide what makes a field changed. It consumes the verdict in `changed[index]
    === true ? [heldEntry(field, index, keys, attributes)] : []`, and no comparison of `field.value` with
    `field.startedWith` appears in it.'
  observed_at:
  - src/features/entities/components/entity-review-entries.ts
- node: rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields
  conforms: true
  how: 'src/features/entities/components/entity-form-schema.ts: held at startingFieldsOf, multi-valued
    branch, line 159. Adding and removing fields is not in this file. The empty-field case for no held
    attribute is reported as a finding. — const held = currentAttributesOf(node.attributes, key); return
    held.length > 0 ? held.map(fieldStartingFrom) : [emptyField(key)];'
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
- node: rules/entity-workspace/a-saved-edit-reloads-the-entity
  conforms: false
  how: 'no named file holds this fact now: src/features/entities/api/node.hooks.ts read `nowhere` — The
    file never refetches or invalidates the node. useReloadedNode only reads the cached state: `state?.status
    === "success" ? state.data : undefined`. The reload after a save is not stated in this file.'
  observed_at:
  - src/features/entities/api/node.hooks.ts
- node: rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
  conforms: true
  how: 'src/features/entities/api/listing.hooks.ts: held at The two guards in buildListingQs(). An empty
    name prefix and an empty node type are each treated as a narrowing not given. — if (namePrefix.length
    > 0) search.set("name_prefix", namePrefix); if (nodeType.length > 0) search.set("node_type", nodeType);'
  encoded_at:
  - src/features/entities/api/listing.hooks.ts
- node: rules/entity-workspace/entity-workspace-requests-carry-the-access-token
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/_request.ts, and src/features/entities/api/catalog.hooks.ts
    read `nowhere` — The file only calls `entityGet<AttributeKeyListWire>(`/api/v1/attribute-keys?${search.toString()}`,
    signal)`. It sets no Authorization header and reads no token. The header, if it is set, is set inside
    `entityGet` in ./_request, which is outside this file.; src/features/entities/api/node.hooks.ts read
    `nowhere` — The file sends its request through `entityGet<NodeReadWire>(..., signal)` and names no
    Authorization header or token. Whatever carries the bearer is in the imported `./_request`, not here.
    — a binding asserts the file answers for the node, so the pair that stopped holding it is released
    by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/_request.ts
  - src/features/entities/api/catalog.hooks.ts
  - src/features/entities/api/node.hooks.ts
- node: rules/entity-workspace/fields-start-from-the-current-values
  conforms: true
  how: 'src/features/entities/components/entity-form-schema.ts: held at fieldStartingFrom, lines 140-149,
    and the single-valued branch of startingFieldsOf, lines 161-162 — startedWith: attribute.value, value:
    attribute.value, and return [current === undefined ? emptyField(key) : fieldStartingFrom(current)];'
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
- node: rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/api/listing.hooks.ts, and
    src/features/entities/components/EntityListPage.tsx read `nowhere` — The file only holds the two owner-typed
    values and hands them on: `const [namePrefix, setNamePrefix] = useState("");`, `const [nodeType, setNodeType]
    = useState("");` and `useNodeListing({ namePrefix, nodeType })`. The `name_prefix` and `node_type`
    query parameter names, and leaving out a narrowing the owner has not given, are not stated here. —
    a binding asserts the file answers for the node, so the pair that stopped holding it is released by
    `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/api/listing.hooks.ts
  - src/features/entities/components/EntityListPage.tsx
- node: rules/knowledge-base/entity-edit-first-value
  conforms: true
  how: "src/features/entities/components/entity-change-effect.ts: held at the first-value branch of `changeOfField`,\
    \ lines 55-58. A field with no item id and a non-empty value, on a key whose held attributes (via\
    \ `heldAttributesOf`) are empty, takes the effect first-value as a `set` change with a null `itemId`.\
    \ — if (field.value === \"\") return null;\n  if (heldAttributesOf(attributes, field.attributeKey).length\
    \ === 0) {\n    return { kind: \"set\", effect: \"first-value\", itemId: null };\n  }"
  encoded_at:
  - src/features/entities/components/entity-change-effect.ts
- node: rules/knowledge-base/entity-edit-removal
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/entities/components/entity-change-effect.ts,
    and src/features/entities/components/entity-review-entries.ts read `nowhere` — The file rejects no
    attribute, marks nothing deleted and sets no supersession time. It only lists removed fields for the
    review, with `field.itemId !== null && field.startedWith !== "" && !kept.has(field.itemId)`. It takes
    the effect from `effectOf({ ...field, value: "" }, keys, attributes)`, which calls `changeOfField`
    in another file. — a binding asserts the file answers for the node, so the pair that stopped holding
    it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/entities/components/entity-change-effect.ts
  - src/features/entities/components/entity-review-entries.ts
unstated:
- file: src/features/entities/components/entity-allowed-values.ts
  where: allowedValueLabel, line 10
  evidence: 'return label === null || label.trim().length === 0 ? allowed.value : label;'
  cost: The code treats a label made only of whitespace as no label, so the owner is shown the value instead.
    The rule states only "for a value that has no label, by its value" and never says that a blank label
    counts as none. The blank-label case therefore lives only in this file, and a reader of the specification
    would not find it there.
- file: src/features/entities/components/entity-form-schema.ts
  where: outsideCatalogGroupsOf (line 92) and buildFieldGroups heldValues (lines 186-188), both through
    isHeldAttribute
  evidence: if (!isHeldAttribute(attribute)) continue;
  cost: The code decides that an attribute outside the catalog, and the values a disputed key lists, are
    shown only when their status is held. Superseded and deleted attributes are left out. The nodes say
    only that such an attribute "MUST show its value without a field" and that a disputed key "MUST show
    its values". The restriction lives only in this file, so the next reader looking for what the form
    shows will not find it in the specification.
- file: src/features/entities/components/entity-form-schema.ts
  where: startingFieldsOf, the multi-valued branch, line 159
  evidence: 'return held.length > 0 ? held.map(fieldStartingFrom) : [emptyField(key)];'
  cost: A multi-valued key whose node holds no current attribute opens with one empty field. The node
    says only "one field for each current attribute the node holds", which gives zero fields for none.
    The one-empty-field starting state is a form decision no node states, so the next reader looking for
    what the form shows at open will not find it in the specification.
pairs_omitted:
- node: rules/entity-workspace/the-node-listing-stands-without-the-node-types
  file: src/features/entities/components/EntityListPage.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type
  file: src/features/entities/components/EntityListPage.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/a-deleted-node-shows-its-own-alert
  file: src/features/entities/components/EntityPage.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/the-form-is-offered-only-for-an-active-node
  file: src/features/entities/components/EntityPage.tsx
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
  file: src/features/entities/components/entity-allowed-values.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/review-names-each-effect-in-its-wording
  file: src/features/entities/components/entity-change-effect.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/review-states-the-effect-of-each-change
  file: src/features/entities/components/entity-change-effect.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-edit-addition
  file: src/features/entities/components/entity-change-effect.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-edit-correction
  file: src/features/entities/components/entity-change-effect.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/entity-edit-succession
  file: src/features/entities/components/entity-change-effect.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation
  file: src/features/entities/components/entity-form-schema.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
  file: src/features/entities/components/entity-form-schema.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field
  file: src/features/entities/components/entity-form-schema.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/the-form-has-a-field-group-per-catalog-key
  file: src/features/entities/components/entity-form-schema.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/review-lists-each-changed-field-once
  file: src/features/entities/components/entity-review-entries.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/entity-workspace/review-states-the-effect-of-each-change
  file: src/features/entities/components/entity-review-entries.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 10 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/entity-edit-frontend-merge-prep.returns/.

  A finding in src/features/entities/components/entity-form-schema.ts names domain/knowledge-base/live-assertion-status,
  which no file of this set is bound to: HELD_ATTRIBUTE_STATUSES and isHeldAttribute, lines 58-66: const
  HELD_ATTRIBUTE_STATUSES: readonly string[] = [ "active", "uncertain", DISPUTED_ATTRIBUTE_STATUS, ];
  — domain/knowledge-base/live-assertion-status already enumerates the statuses of an assertion that is
  still held (active, uncertain, disputed). This array declares that vocabulary a second time, in a file
  that node is not bound to. entity-field-changed.ts also lists "uncertain" in its own copy. If the enumeration
  changes, the node''s own check never reaches this file. The two copies then disagree and nobody can
  tell which one was decided.. It blocks nothing here; it is owed a route of its own.

  Candidates: 4 opened across 2 of 10 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 3 fact(s) the source states that no node holds, over 2 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/entity-edit-frontend-merge-prep.returns/`, which are the evidence behind every entry above.
