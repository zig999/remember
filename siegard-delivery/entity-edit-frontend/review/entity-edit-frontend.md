---
target: frontend
title: 'Entity edit screen: review of the delivered change'
summary: What the coverage, conformance and standard passes found over the 114 files written by the 21 tasks of entity-edit-frontend.
reviewed:
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
- src/features/entities/api/_edit-request.ts
- src/features/entities/api/_request.ts
- src/features/entities/api/_transforms.ts
- src/features/entities/api/catalog.hooks.ts
- src/features/entities/api/edit.hooks.ts
- src/features/entities/api/keys.ts
- src/features/entities/api/listing.hooks.ts
- src/features/entities/api/node.hooks.ts
- src/features/entities/components/EntityForm.tsx
- src/features/entities/components/EntityListPage.tsx
- src/features/entities/components/EntityPage.tsx
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
- src/features/entities/components/entity-allowed-values.ts
- src/features/entities/components/entity-change-effect.ts
- src/features/entities/components/entity-closed-choice.tsx
- src/features/entities/components/entity-disputed-values.tsx
- src/features/entities/components/entity-edit-payload.ts
- src/features/entities/components/entity-field-changed.ts
- src/features/entities/components/entity-field-group.tsx
- src/features/entities/components/entity-form-schema.ts
- src/features/entities/components/entity-list-parts.tsx
- src/features/entities/components/entity-local-date.ts
- src/features/entities/components/entity-outside-catalog-values.tsx
- src/features/entities/components/entity-page-helpers.ts
- src/features/entities/components/entity-page-parts.tsx
- src/features/entities/components/entity-review-entries.ts
- src/features/entities/components/entity-review-reason.ts
- src/features/entities/components/entity-review.tsx
- src/features/entities/components/entity-save-alert.tsx
- src/features/entities/components/entity-validity-fields.tsx
- src/features/entities/components/entity-validity-order.ts
- src/features/entities/components/entity-value-types.ts
- src/features/entities/components/use-entity-edit-form.ts
- src/features/entities/components/use-entity-review.ts
- src/features/entities/components/use-undoable-save.ts
- src/features/entities/components/zod-issue-resolver.ts
- src/features/entities/types.ts
- src/router/__tests__/route-support.tsx
- src/router/__tests__/routes.entity-list.dom.spec.tsx
- src/router/__tests__/routes.entity.dom.spec.tsx
- src/router/routes.tsx
tasks:
- task/entity-form/attributes-outside-the-catalog
- task/entity-form/closed-key-fields
- task/entity-form/disputed-keys
- task/entity-form/entity-page
- task/entity-form/field-groups
- task/entity-form/multi-valued-fields
- task/entity-form/validity-fields
- task/entity-form/value-type-fields
- task/entity-listing/entity-list-screen
- task/knowledge-base-client/edit-request
- task/knowledge-base-client/listing-reads
- task/knowledge-base-client/node-and-catalog-reads
- task/review-and-save/conflict-keeps-typed-values
- task/review-and-save/edit-payload
- task/review-and-save/other-save-failures
- task/review-and-save/reload-after-save
- task/review-and-save/review-effects
- task/review-and-save/review-of-changes
- task/review-and-save/review-reason
- task/review-and-save/undo-window
- task/review-and-save/validity-order
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/entity-edit-frontend passed; there was no failure to read
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
coverage:
- criterion: An attribute whose key the catalog does not hold for the node's type shows its value.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: shows the value of an attribute whose key the catalog does not hold, and adds no field for it
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: shows the value of every attribute outside the catalog, across keys and across several values of one key
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: renders nothing beyond the catalog's field groups when no attribute lies outside the catalog
  why: 'Over-assertion finding. "renders nothing beyond the catalog''s field groups when no attribute lies outside the catalog"
    asserts that all of the form''s text equals the text of its field groups. That claims the whole form, which is shared
    ground: the review control, the reason and the alerts that sibling tasks place in the form are part of it. The claim holds
    only while none of those renders text when the form opens. No criterion states it.'
- criterion: An attribute whose key the catalog does not hold for the node's type shows no field.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: shows the value of an attribute whose key the catalog does not hold, and adds no field for it
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: leaves the form with exactly the controls its catalog keys give, whatever lies outside the catalog
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: gives no input, select, textarea, combobox or button that carries or represents an outside-catalog value
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: adds no field for an attribute whose key the catalog does not hold
- criterion: A field of a key with allowed values offers only those values.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: offers a closed key every allowed value and nothing else, each by its label, a label-less one by its own value,
      in the order the catalog gives them
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: offers a closed key only its allowed values when the node holds a current value outside them
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: adds an entry that is an empty choice offering the allowed values
- criterion: The allowed values are shown by their labels.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: shows each allowed value by its label, not by its own value
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: offers a closed key every allowed value and nothing else, each by its label, a label-less one by its own value,
      in the order the catalog gives them
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: starts with the node's current value selected, shown by its label
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: shows an allowed value that has no label by its own value, neither as an empty option nor left out
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: shows an allowed value whose label is the empty string by its own value, not as an empty option
  why: 'Over-assertion finding. Three tests also fix what happens to an allowed value that has no label, or whose label is
    the empty string: they assert it is shown by its own value, not as an empty option and not left out. These are the first
    test above and the two "shows an allowed value ... by its own value" tests. This criterion names labels only. It says
    nothing about an allowed value without one.'
- criterion: The allowed values are shown in the order the catalog gives them.
  state: partial
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: offers a closed key every allowed value and nothing else, each by its label, a label-less one by its own value,
      in the order the catalog gives them
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: keeps the order the catalog delivers the allowed values in, whatever their sort orders and whatever alphabetical
      order would give
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: returns an attribute key the catalog closes with its allowed values
  why: The form tests feed the form AttributeKey fixtures directly. The client test sorts the allowed values before comparing
    them, and its wire fixture lists them out of sort_order (2, 1, 3). So nothing checks that the client hands the form the
    allowed values in the order the catalog gives them. A client that reordered them would pass every test. Separately, the
    criterion can be read two ways. The tests read "the order the catalog gives them" as the order the values arrive in, and
    they assert that order against a contrary sort_order. But the catalog carries its own sort_order, which is a second possible
    meaning. Under that meaning the form tests assert the opposite of the criterion. This audit does not settle which reading
    holds.
- criterion: A key with a disputed attribute shows its values.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: 'decides a key''s disputed state from the status of its attributes alone: $label'
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: shows every value a disputed key holds
- criterion: A key with a disputed attribute shows no field.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: 'decides a key''s disputed state from the status of its attributes alone: $label'
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: shows no field and no add or remove control for a disputed key that is $label
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: shows the pointer in the disputed key's group alone and keeps the field of a key beside it
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: offers no field, prefilled or empty, for a key holding a disputed attribute
- criterion: A key with a disputed attribute shows a pointer to the curation workspace.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: 'decides a key''s disputed state from the status of its attributes alone: $label'
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: shows the pointer in the disputed key's group alone and keeps the field of a key beside it
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: leads to the curation address when the pointer is followed
  - file: src/features/entities/components/__tests__/EntityForm.disputed-keys.spec.tsx
    name: makes the pointer a link to exactly /curation, with no search, reading exactly 'Abrir na fila de curadoria'
  why: Over-assertion finding. "makes the pointer a link to exactly /curation, with no search, reading exactly 'Abrir na fila
    de curadoria'" asserts the exact wording and that the link has no search part. This criterion asks only for a pointer
    to the curation workspace. A pointer that later narrows the queue to this node would break the test while the criterion
    still holds.
- criterion: /entities/{node identity} renders inside the protected layout.
  state: covered
  tests:
  - file: src/router/__tests__/routes.entity.dom.spec.tsx
    name: redirects a visit without a session to /sign-in instead of showing the page
  - file: src/router/__tests__/routes.entity.dom.spec.tsx
    name: renders the page in the workspace of the application shell for a visit with a session
- criterion: The /entities/{node identity} page is loaded lazily.
  state: covered
  tests:
  - file: src/router/__tests__/routes.entity.dom.spec.tsx
    name: does not fetch the page's code with the initial load of the application
  - file: src/router/__tests__/routes.entity.dom.spec.tsx
    name: does not fetch the page's code when its address is preloaded
  - file: src/router/__tests__/routes.entity-list.dom.spec.tsx
    name: fetch the code of each page only when its address is first opened, never with the initial load or a preload, and
      open the listing at /entities and the form at /entities/{identity}
  why: Over-assertion finding. The preload tests assert that the page's code is not fetched even when its address is preloaded.
    "Loaded lazily" does not state that. A router that preloads on intent would still be lazy and would break these tests.
- criterion: The page shows the node's name.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows the node's $label
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: places the node's $label above the form
  why: Over-assertion finding. "places the node's $label above the form" also asserts where the name sits relative to the
    form. This criterion does not state any placement.
- criterion: The page shows the node's node type.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows the node's $label
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: places the node's $label above the form
  why: Over-assertion finding. "places the node's $label above the form" also asserts placement above the form, which this
    criterion does not state.
- criterion: The page shows the node's status.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows the node's $label
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: places the node's $label above the form
  why: Over-assertion finding. "places the node's $label above the form" also asserts placement above the form, which this
    criterion does not state.
- criterion: While the node or the catalog is being fetched, a loading indication stands in place of the form.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: stands a loading indication in place of the form while the node is being fetched
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: stands a loading indication in place of the form while the catalog is being fetched
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: reads the loading indication Carregando formulário…
- criterion: An identity at which no knowledge node is held shows an alert saying the node was not found.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: shows the alert Nó não encontrado.
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: carries no code or message of the failure's own in the $label
- criterion: A node the knowledge base refuses as deleted shows the deleted-node alert reading "Este nó foi apagado.".
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows the deleted-node alert in place of the form, with no action and no code or message of the failure's own
- criterion: A node the knowledge base refuses as deleted shows no form.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows the deleted-node alert in place of the form, with no action and no code or message of the failure's own
- criterion: The deleted-node alert carries no code or message of the failure's own.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows the deleted-node alert in place of the form, with no action and no code or message of the failure's own
- criterion: The deleted-node alert offers no action to try again.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows the deleted-node alert in place of the form, with no action and no code or message of the failure's own
  why: Over-assertion finding. The test's observe() counts as an action any button, any link, any role=button anywhere in
    the workspace, and any workspace text matching /tentar/i. So it asserts that the whole workspace holds no control at all,
    not just that the alert offers no way to try again. A sibling task that puts a link in the workspace, such as one back
    to the listing, would break it.
- criterion: A node or catalog that fails to load for any cause other than no node being held at the identity or the node
    being refused as deleted shows an alert saying the form could not be loaded.
  state: partial
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: shows the could-not-load-form alert when the node read fails for another cause
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: shows the could-not-load-form alert when the catalog read fails for an active node
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: carries no code or message of the failure's own in the $label
  why: The only failure ever put to the page is a refusal at HTTP 500 with a readable code, for the node read and for the
    catalog read. The page never sees a node or catalog read that gets no answer, is cut off, or is refused below 500 with
    another code. So a page that showed another alert for those causes would pass.
- criterion: The could-not-be-loaded alert offers an action that loads the node and the catalog again.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: labels the could-not-load-form alert's action Tentar novamente
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: loads the node and the catalog again when the action is used after the catalog failed
  - file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
    name: loads the node and then the catalog when the action is used after the node failed
- criterion: A node whose status is not active and that the knowledge base still delivers shows its attributes.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: offers the form only for an active node and shows the attributes of any other node without a form (status %s)
- criterion: A node whose status is not active shows no form.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: offers the form only for an active node and shows the attributes of any other node without a form (status %s)
- criterion: A node whose status is not active shows no field.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: shows no field for a node whose status is not active
- criterion: A node whose status is active is offered the form.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: offers the form only for an active node and shows the attributes of any other node without a form (status %s)
  - file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
    name: places the node's $label above the form
- criterion: The form holds one group of fields for each attribute key the catalog holds for the node's type.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: holds one field for every catalog key of the node's type, in the order the catalog lists them
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: keeps an attribute whose key the catalog holds in its own field group, with its own values
- criterion: The groups follow the order in which the catalog lists the keys.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: holds one field for every catalog key of the node's type, in the order the catalog lists them
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: shows each field the description the catalog holds for its own key as help text
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: returns the attribute keys in the order the catalog lists them
- criterion: A field of a key for which the node holds a current attribute starts with that attribute's value.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: holds one field for every catalog key of the node's type, in the order the catalog lists them
  - file: src/features/entities/components/__tests__/EntityForm.starting-values.spec.tsx
    name: starts each field with its key's current attribute value, and empty where the key holds no current attribute
  - file: src/features/entities/components/__tests__/entity-form-schema.spec.ts
    name: records the current attribute a field started from, the value it started with and its value, for a key holding $held
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: starts with the node's current value selected, shown by its label
  - file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: keeps an attribute whose key the catalog holds in its own field group, with its own values
- criterion: A field of a key for which the node holds no current attribute starts empty.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: holds one field for every catalog key of the node's type, in the order the catalog lists them
  - file: src/features/entities/components/__tests__/EntityForm.starting-values.spec.tsx
    name: starts each field with its key's current attribute value, and empty where the key holds no current attribute
  - file: src/features/entities/components/__tests__/entity-form-schema.spec.ts
    name: records the current attribute a field started from, the value it started with and its value, for a key holding $held
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: starts with nothing selected for a closed key the node holds no value for
- criterion: Each field shows as its help text the description the catalog holds for its key.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.field-groups.spec.tsx
    name: shows each field the description the catalog holds for its own key as help text
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: returns each attribute key with its key, value type, whether it is temporal, whether it allows multiple current
      values and its description
- criterion: A key that allows multiple current values shows one field for each current attribute the node holds of it.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: shows one field for each current attribute the node holds of the key and none for a non-current one
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: lists a field per current attribute and lets the owner add one and remove one
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: makes every entry of the key a choice holding its own value, with no text field
  - file: src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
    name: ties each field of a multi-valued key to its own current attribute, with the value it started with
- criterion: Each of those fields starts with the value of its own attribute.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: starts each field of the key with the value of its own attribute
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: makes every entry of the key a choice holding its own value, with no text field
  - file: src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
    name: ties each field of a multi-valued key to its own current attribute, with the value it started with
- criterion: The owner can add a field to a key that allows multiple current values.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: adds one field to the key when the owner adds a field
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: starts an added field empty, whatever values the key already holds, and leaves the held fields as they were
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: lists a field per current attribute and lets the owner add one and remove one
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: adds an entry that is an empty choice offering the allowed values
- criterion: The owner can remove a field from a key that allows multiple current values.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: removes the field the owner removes and leaves the others holding their own values
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: keeps what the owner typed in a field when another field of the key is removed
  - file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: lists a field per current attribute and lets the owner add one and remove one
  - file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: removes the entry the owner removes and leaves the others holding their values
- criterion: A changed field of a temporal key offers a validity start.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: offers a validity start and a validity end for a changed field of a temporal key and accepts the end left empty
- criterion: A changed field of a temporal key offers a validity end.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: offers a validity start and a validity end for a changed field of a temporal key and accepts the end left empty
- criterion: The validity end of a changed field of a temporal key may be left empty.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: offers a validity start and a validity end for a changed field of a temporal key and accepts the end left empty
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: shows an unstated validity start as today in the review and sends the change with no validity start
  - file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: raises no message when no end is stated and there is $label
- criterion: A changed field of a key that is not temporal offers no validity start.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: offers no validity start and no validity end for a changed field of a key that is not temporal
- criterion: A changed field of a key that is not temporal offers no validity end.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: offers no validity start and no validity end for a changed field of a key that is not temporal
- criterion: A validity start the owner has not stated shows as today.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: shows a validity start the owner has not stated as the calendar date of today
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: keeps the validity start empty in the form while it shows as today, even after the owner states an end
  - file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: stops showing today once the owner states a validity start and keeps the start the owner typed
  - file: src/features/entities/components/__tests__/EntityForm.validity-local-date.spec.tsx
    name: shows today as the date in the owner's time zone at an hour when UTC is already on the next day
- criterion: A date field holding a non-empty value refuses it where it does not match ^\d{4}-\d{2}-\d{2}$.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: refuses %j, which does not match the date pattern
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: validates each entry of a multi-valued key by its own key's value type
- criterion: A date field holding a non-empty value refuses it where it matches ^\d{4}-\d{2}-\d{2}$ but names no existing
    day.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: refuses %j, which matches the date pattern but names no existing day
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a
      text field or on a field emptied again
- criterion: A date field does not refuse a value that matches ^\d{4}-\d{2}-\d{2}$ and names an existing day.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: does not refuse %j, which matches the date pattern and names an existing day
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: clears the message and the invalid mark once the owner fixes the value
- criterion: A number field holding a non-empty value refuses it where it does not match ^-?\d+(\.\d+)?$.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: refuses %j, which does not match the number pattern
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a
      text field or on a field emptied again
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: validates each entry of a multi-valued key by its own key's value type
- criterion: A number field holding a non-empty value refuses it where it matches ^-?\d+(\.\d+)?$ but does not read as a finite
    number.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: refuses %s, which matches the number pattern but is not finite
- criterion: A number field does not refuse a value that matches ^-?\d+(\.\d+)?$ and reads as a finite number.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: does not refuse %s, which matches the number pattern and reads as a finite number
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: returns to true once the refused value is fixed
- criterion: A bool field holding a non-empty value refuses it where it is other than exactly true or exactly false.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: refuses %j, which is not exactly true or exactly false
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a
      text field or on a field emptied again
- criterion: A bool field does not refuse exactly true.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: does not refuse exactly %j
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: is true while every field holds a value that reads as its key's type, a text field holding anything
- criterion: A bool field does not refuse exactly false.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: does not refuse exactly %j
- criterion: A text field refuses no text.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: does not refuse the text %j
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a
      text field or on a field emptied again
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: is true while every field holds a value that reads as its key's type, a text field holding anything
- criterion: An empty field of any value type is not refused for its value type.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: does not refuse the empty value of a %s field
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a
      text field or on a field emptied again
- criterion: An empty field of any value type does not withhold the review.
  state: partial
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: is true while every field of a date, a number and a bool key is empty
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: returns to true once the field holding the refused value is emptied
  why: Both tests read the form's data-value-types-accepted attribute, not the review. No test opens or looks for the review
    while a date, number or bool field is empty. Every test that checks whether the review is offered uses text keys or a
    number field holding a value. So whether an empty field of those types withholds the review is never checked.
- criterion: A field holding a value its key's value type refuses shows a message on that field naming the value type it expects.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a
      text field or on a field emptied again
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: marks only the field holding the refused value as invalid
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: announces the message once as an alert when a field holds a refused value
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: validates each entry of a multi-valued key by its own key's value type
  - file: src/features/entities/components/__tests__/entity-value-types.spec.ts
    name: writes the rule's own text for a %s value that does not read as its type (%s)
  why: Over-assertion finding. "announces the message once as an alert when a field holds a refused value" asserts that the
    form's role=alert elements are exactly that one message. Sibling tasks raise their own alerts in the same form, such as
    the conflict and refusal alerts. The test holds only while none of them is showing.
- criterion: The form does not offer the review while a field holds a value its key's value type refuses.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
    name: offers no review while a value its key's type refuses stands, even though another field is changed, and offers it
      again once the value is fixed
  - file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
    name: is false while one field holds a value its key's type refuses and the others are fine
  why: Only a refused number value is checked against the review. Refused date and bool values are checked only for the field
    message and the data-value-types-accepted attribute.
- criterion: /entities renders inside the protected layout.
  state: covered
  tests:
  - file: src/router/__tests__/routes.entity-list.dom.spec.tsx
    name: redirects a visit without a session to /sign-in instead of showing the listing
  - file: src/router/__tests__/routes.entity-list.dom.spec.tsx
    name: renders the listing in the workspace of the application shell for a visit with a session
- criterion: The /entities page is loaded lazily.
  state: covered
  tests:
  - file: src/router/__tests__/routes.entity-list.dom.spec.tsx
    name: does not fetch the listing page's code with the initial load of the application
  - file: src/router/__tests__/routes.entity-list.dom.spec.tsx
    name: does not fetch the listing page's code when its address is preloaded
  - file: src/router/__tests__/routes.entity-list.dom.spec.tsx
    name: fetch the code of each page only when its address is first opened, never with the initial load or a preload, and
      open the listing at /entities and the form at /entities/{identity}
  why: Over-assertion finding. The preload tests assert that the page's code is not fetched on a preload. "Loaded lazily"
    does not state that. A router that preloads on intent would still be lazy and would break these tests.
- criterion: Each listed node shows its name.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: shows its $label
- criterion: Each listed node shows its node type.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: shows its $label
- criterion: Each listed node shows its status.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: shows its $label
- criterion: A name prefix the owner types narrows the listing to the nodes the knowledge base lists for that prefix.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: lists the nodes the knowledge base lists for the name prefix the owner types
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: narrows by the name prefix and the node type together and opens /entities/{identity} of the node the owner picks
  - file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
    name: keeps offering the name prefix and the node listing with no node-type narrowing, stands a loading indication and
      then the could-not-load-types alert in place of the type choice, and fetches the types again on the alert's action
  why: 'The EntityListPage.states test touches this criterion only along the way. Most of what it asserts is about node types
    still loading or having failed: a loading indication and then the "Não foi possível carregar os tipos de nó. Tente novamente."
    alert in place of the type choice, and a second fetch of the types when the alert''s action is used. No criterion under
    this review states any of that.'
- criterion: A node type the owner picks narrows the listing to the nodes the knowledge base lists for that type.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: lists the nodes the knowledge base lists for the node type the owner picks
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: narrows by the name prefix and the node type together and opens /entities/{identity} of the node the owner picks
- criterion: The node types offered are those the knowledge base lists.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: offers as node types the node types the knowledge base lists
  why: 'Over-assertion finding. The test also asserts that exactly one option is offered beyond the listed types (others:
    1), which is the all-types option. This criterion does not state that option.'
- criterion: Picking a node opens /entities/{that node's identity}.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: narrows by the name prefix and the node type together and opens /entities/{identity} of the node the owner picks
  why: The only test that picks a node does it at the end of the combined name-and-type narrowing scenario. The test's name
    does mark the navigation, but no test picks a node from a listing that has not been narrowed. If that scenario changes,
    the only proof of this criterion changes with it.
- criterion: While the listing is being fetched, a loading indication stands in place of the list.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
    name: stands the loading indication Carregando nós… in place of the list while the listing is being fetched
- criterion: A listing that fails shows an alert saying the nodes could not be loaded.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
    name: shows in place of the list the alert Não foi possível carregar os nós. Tente novamente. with the action Tentar novamente,
      carrying no code or message of the failure
- criterion: The failed-listing alert offers an action that fetches the listing again.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
    name: shows in place of the list the alert Não foi possível carregar os nós. Tente novamente. with the action Tentar novamente,
      carrying no code or message of the failure
  - file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
    name: fetches the listing again when the action of the failed-listing alert is used
- criterion: A listing that holds no node states that no node was found.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
    name: states Nenhum nó encontrado. when the listing holds no node
- criterion: The edit is sent as POST /api/v1/nodes/{node_id}/edit, with the node identity in the path.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
    name: is sent as POST /api/v1/nodes/{node_id}/edit with the node identity in the path
- criterion: The node identity in the edit's path is URL-encoded.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
    name: URL-encodes the node identity in the path
- criterion: The request carries the owner's token in the Authorization header as Bearer <token>.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
    name: carries the owner's token in the Authorization header as Bearer <token>
  - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
    name: starts one refresh and repeats the edit once with the new token, the same options and a fresh cutoff, never starting
      a second refresh
  why: 'The edit-request-session test touches this criterion only through its Bearer headers. Most of what it asserts is the
    refresh protocol: one refresh, then one repeat with the same target and body and a fresh cutoff. No criterion under this
    review states that protocol.'
- criterion: The body carries the reason.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-wire.spec.ts
    name: carries the reason
- criterion: The body carries the changes as a list.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-wire.spec.ts
    name: carries the changes as a list
- criterion: Each change in the body carries attribute_key, kind, value, item_id, valid_from and valid_to.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-wire.spec.ts
    name: writes the six members of every change, JSON null in every empty member and null in value and validity of a remove
      change
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: writes JSON null in every member that holds nothing and in the value and validity of a remove change
  why: Over-assertion finding. The test also asserts that the client writes a remove change's value and validity as null even
    when the caller supplies them, and that blank strings become JSON null. No criterion of this task states either rule.
- criterion: An HTTP 200 answer is read without an envelope as node_id, action_id and applied.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
    name: reads an HTTP 200 answer without an envelope as node_id, action_id and applied
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is accepted with the node, the action and what was applied when the edit is answered 200
- criterion: An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the answer's
    status.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with the status, code, message and details read from $name
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a refusal carrying the status, code, message and details when another code is refused, even at 409
- criterion: 'An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the code
    read from error.code in the body { ok: false, error: { code, message, details } }.'
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with the status, code, message and details read from $name
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a refusal carrying the status, code, message and details when another code is refused, even at 409
- criterion: An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the message
    read from error.message in that body.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with the status, code, message and details read from $name
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a refusal carrying the status, code, message and details when another code is refused, even at 409
- criterion: An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the details
    read from error.details in that body.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with the status, code, message and details read from $name
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a refusal carrying the status, code, message and details when another code is refused, even at 409
- criterion: A refusal with code BUSINESS_ENTITY_EDIT_CONFLICT is reported as a conflict.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a conflict naming the attribute key and the item its refusal's details name
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a conflict with no item where its refusal's details name none
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a refusal carrying the status, code, message and details when another code is refused, even at 409
- criterion: A conflict reports the attribute key its refusal's details name.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a conflict naming the attribute key and the item its refusal's details name
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a conflict with no item where its refusal's details name none
- criterion: A conflict reports the item its refusal's details name, or none where the details name none.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a conflict naming the attribute key and the item its refusal's details name
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is a conflict with no item where its refusal's details name none
- criterion: An edit cut off after 30000 milliseconds without an answer fails with SYSTEM_TIMEOUT.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-cutoff.spec.ts
    name: is cut off at 30000 ms and not before, with the abort reading Request timed out after 30s and the failure SYSTEM_TIMEOUT
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is unreachable with SYSTEM_TIMEOUT when the edit is cut off
- criterion: A SYSTEM_TIMEOUT failure reads "Tempo limite excedido na requisição."
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-cutoff.spec.ts
    name: fails with SYSTEM_TIMEOUT reading Tempo limite excedido na requisição.
- criterion: An edit its caller cancels before an answer fails with SYSTEM_ABORTED.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with SYSTEM_ABORTED reading Requisição cancelada. when its caller cancels before an answer
  - file: src/features/entities/api/__tests__/edit-outcomes-aborted.spec.ts
    name: is unreachable with SYSTEM_ABORTED, not a refusal, when the caller cancels the edit before an answer
- criterion: A SYSTEM_ABORTED failure reads "Requisição cancelada."
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with SYSTEM_ABORTED reading Requisição cancelada. when its caller cancels before an answer
- criterion: An edit that gets no answer for a cause other than the cutoff or a cancellation fails with SYSTEM_NETWORK.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with SYSTEM_NETWORK reading Falha de rede ao contactar o servidor. when it gets no answer for another cause
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: is unreachable with SYSTEM_NETWORK when the edit gets no answer
- criterion: A SYSTEM_NETWORK failure reads "Falha de rede ao contactar o servidor."
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with SYSTEM_NETWORK reading Falha de rede ao contactar o servidor. when it gets no answer for another cause
- criterion: An edit whose session refresh fails fails with AUTH_SESSION_EXPIRED.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
    name: clears the stored token, replaces the page with /sign-in?reason=session_expired and fails with AUTH_SESSION_EXPIRED
  why: Over-assertion finding. The same expectation also asserts that the stored token is cleared and that the page is replaced
    with /sign-in?reason=session_expired. No criterion of this task states either.
- criterion: An AUTH_SESSION_EXPIRED failure carries status 401.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
    name: fails carrying status 401 and reading Sua sessão expirou. Faça login novamente.
- criterion: An AUTH_SESSION_EXPIRED failure reads "Sua sessão expirou. Faça login novamente."
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
    name: fails carrying status 401 and reading Sua sessão expirou. Faça login novamente.
- criterion: An edit answered 2xx with a body that is not JSON fails with SYSTEM_INVALID_RESPONSE.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with SYSTEM_INVALID_RESPONSE carrying the answer's status when a 2xx answer is not JSON
- criterion: A SYSTEM_INVALID_RESPONSE failure carries the answer's status.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with SYSTEM_INVALID_RESPONSE carrying the answer's status when a 2xx answer is not JSON
- criterion: A SYSTEM_INVALID_RESPONSE failure reads "Resposta do servidor não é JSON válido."
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with SYSTEM_INVALID_RESPONSE carrying the answer's status when a 2xx answer is not JSON
- criterion: An edit answered with a status that is not 2xx, at 500 or above, and a body carrying no readable error code fails
    with SYSTEM_UPSTREAM.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with $code, the answer's status and its fixed message when the answer is $name
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: reads the fixed upstream message when a 5xx body carries a message but no readable error code
- criterion: A SYSTEM_UPSTREAM failure carries the answer's status.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with $code, the answer's status and its fixed message when the answer is $name
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: reads the fixed upstream message when a 5xx body carries a message but no readable error code
- criterion: A SYSTEM_UPSTREAM failure reads "Algo deu errado. Tente novamente."
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with $code, the answer's status and its fixed message when the answer is $name
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: reads the fixed upstream message when a 5xx body carries a message but no readable error code
- criterion: An edit answered with a status that is not 2xx, below 500, and a body carrying no readable error code fails with
    SYSTEM_UNKNOWN.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with $code, the answer's status and its fixed message when the answer is $name
- criterion: A 401 answer to an edit repeated after a refresh, whose body carries no readable error code, fails with SYSTEM_UNKNOWN.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
    name: fails with SYSTEM_UNKNOWN carrying status 401 when the repeat after a refresh is answered 401 with no readable error
      code
- criterion: A SYSTEM_UNKNOWN failure carries the answer's status.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with $code, the answer's status and its fixed message when the answer is $name
  - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
    name: fails with SYSTEM_UNKNOWN carrying status 401 when the repeat after a refresh is answered 401 with no readable error
      code
- criterion: A SYSTEM_UNKNOWN failure reads "Erro desconhecido do servidor."
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
    name: fails with $code, the answer's status and its fixed message when the answer is $name
  - file: src/features/entities/api/__tests__/edit-request-session.spec.ts
    name: fails with SYSTEM_UNKNOWN carrying status 401 when the repeat after a refresh is answered 401 with no readable error
      code
- criterion: Node types are requested as GET /api/v1/node-types with no parameter.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: requests the node types as GET /api/v1/node-types with no parameter
  - file: src/features/entities/api/__tests__/listing-through-http.spec.ts
    name: is made through the http function and uses no other fetch for $name
- criterion: Each node type returned carries its identity, name, description and version.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: returns each node type with its identity, name, description and version
  why: The test checks that each value from the wire is present among the item's values. It does not check which member holds
    which value. A read that dropped a value would fail, but one that put the description under the name would pass.
- criterion: Nodes are requested as GET /api/v1/nodes.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: requests the nodes as GET /api/v1/nodes
- criterion: A name prefix given is sent as the name_prefix parameter.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: carries each narrowing given under its parameter and leaves out each not given
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: carry the name prefix under name_prefix and the node type by its name under node_type, and carry neither before
      the owner gives it
- criterion: A node type given is sent by its name, not its identity, as the node_type parameter.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: carries each narrowing given under its parameter and leaves out each not given
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: carry the name prefix under name_prefix and the node type by its name under node_type, and carry neither before
      the owner gives it
- criterion: A name prefix not given is left out of the request.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: carries each narrowing given under its parameter and leaves out each not given
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: carry the name prefix under name_prefix and the node type by its name under node_type, and carry neither before
      the owner gives it
- criterion: An empty name prefix is left out of the request.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: treats an empty name prefix or an empty node type as a narrowing not given
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: leave out an emptied name prefix and the all-types option instead of sending an empty value or a sentinel
- criterion: A node type not given is left out of the request.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: carries each narrowing given under its parameter and leaves out each not given
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: carry the name prefix under name_prefix and the node type by its name under node_type, and carry neither before
      the owner gives it
- criterion: An empty node type is left out of the request.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: treats an empty name prefix or an empty node type as a narrowing not given
  - file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
    name: leave out an emptied name prefix and the all-types option instead of sending an empty value or a sentinel
- criterion: Each node returned carries its identity, node-type name, canonical name, status and the node it was merged into,
    or null.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: returns each node with its identity, node-type name, canonical name, status and merge target or null
  why: Like the node-type read test, this test checks only that each wire value is present among the item's values. It does
    not check which member holds which value.
- criterion: The node listing returns the total the knowledge base reports.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: returns the total the knowledge base reports, not the size of the page
- criterion: Every request carries the owner's token in the Authorization header as Bearer <token>.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-requests.spec.ts
    name: is sent as Bearer <token> in the Authorization header by $name
  - file: src/features/entities/api/__tests__/listing-timing.spec.ts
    name: starts one refresh and repeats the read once with the new token, the same options and a fresh cutoff, never starting
      a second refresh
  - file: src/features/entities/api/__tests__/node-catalog-token.spec.ts
    name: is sent as Bearer <token> in the Authorization header by $name
  - file: src/features/entities/api/__tests__/node-catalog-refresh.spec.ts
    name: starts one refresh and repeats $name once with the new token, the same options and a fresh cutoff, never starting
      a second refresh
  why: The listing-timing test touches this criterion only through its Bearer headers. Most of what it asserts is the refresh-and-repeat
    protocol, which no criterion under this review states. The node-catalog-refresh test touches this criterion only through
    its Bearer headers. Most of what it asserts is the refresh-and-repeat protocol, which no criterion under this review states.
- criterion: Every read is made through the http function of src/lib/http.ts, not through a fetch wrapper of its own.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-through-http.spec.ts
    name: is made through the http function and uses no other fetch for $name
  - file: src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
    name: is made through the http function and uses no other fetch for $name
  why: 'The test asserts the call to http itself. Here that is the criterion: what it names is which internal function the
    read goes through. The test also checks that fetch saw exactly the same single path.'
- criterion: A failed read fails with the status the http function gives for that answer.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the session refresh fails
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the repeat after a refresh is answered
      401
  - file: src/features/entities/api/__tests__/node-catalog-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
- criterion: A failed read fails with the code the http function gives for that answer.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the session refresh fails
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the repeat after a refresh is answered
      401
  - file: src/features/entities/api/__tests__/node-catalog-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
- criterion: A failed read fails with the message the http function gives for that answer.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the session refresh fails
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the repeat after a refresh is answered
      401
  - file: src/features/entities/api/__tests__/node-catalog-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
- criterion: A failed read fails with the details the http function gives for that answer.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/listing-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the session refresh fails
  - file: src/features/entities/api/__tests__/listing-session.spec.ts
    name: fails with the status, code, message and details the http function gives when the repeat after a refresh is answered
      401
  - file: src/features/entities/api/__tests__/node-catalog-failures.spec.ts
    name: fails with the status, code, message and details the http function gives for $name
- criterion: A node is requested as GET /api/v1/nodes/{node_id}, with the node identity in the path.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/node-read.spec.ts
    name: requests the node as GET /api/v1/nodes/{node_id} with the node identity in the path
  - file: src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
    name: is made through the http function and uses no other fetch for $name
- criterion: The node identity in the node read's path is URL-encoded.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/node-read.spec.ts
    name: URL-encodes the node identity in the path
- criterion: The node read carries no query parameter.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/node-read.spec.ts
    name: carries no query parameter
  - file: src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
    name: is made through the http function and uses no other fetch for $name
- criterion: The node read returns the node's summary, its aliases and its attributes.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/node-read.spec.ts
    name: returns the node's summary, its aliases and its attributes
- criterion: Each attribute returned carries its identity, attribute-key name, value, validity start, validity end, status
    and whether it is current.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/node-read.spec.ts
    name: returns each attribute with its identity, attribute-key name, value, validity start, validity end, status and whether
      it is current
- criterion: Attribute keys are requested as GET /api/v1/attribute-keys.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: requests the attribute keys as GET /api/v1/attribute-keys
  - file: src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
    name: is made through the http function and uses no other fetch for $name
- criterion: The node type is sent by its name, not its identity, as the node_type parameter of the attribute-key listing.
  state: partial
  tests:
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: sends the node type by the name it is given as the node_type parameter and no other parameter
  - file: src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
    name: is made through the http function and uses no other fetch for $name
  why: 'Both tests show that the read sends whatever string it is handed as node_type. Neither can tell a name from an identity.
    No test reads the attribute-key request that the entity page actually sends: page-support matches that request by pathname
    only. So "by its name, not its identity" is never checked where the value is chosen.'
- criterion: Each attribute key returned carries its key, value type, whether it is temporal, whether it allows multiple current
    values and its description.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: returns each attribute key with its key, value type, whether it is temporal, whether it allows multiple current
      values and its description
- criterion: An attribute key the catalog closes is returned with its allowed values.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: returns an attribute key the catalog closes with its allowed values
- criterion: Attribute keys are returned in the order the catalog lists them.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/attribute-keys.spec.ts
    name: returns the attribute keys in the order the catalog lists them
- criterion: A node read refused with RESOURCE_NOT_FOUND fails with that code.
  state: covered
  tests:
  - file: src/features/entities/api/__tests__/node-read.spec.ts
    name: fails with RESOURCE_NOT_FOUND when the knowledge base refuses the node with that code
- criterion: A conflict answer leaves every typed value in the form.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
    name: still holds the status the owner typed and alerts that the node changed since the form was opened, though the status
      was superseded elsewhere
  - file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
    name: leaves the reason as the owner typed it
- criterion: A conflict answer shows an alert saying the node changed since the form was opened.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
    name: still holds the status the owner typed and alerts that the node changed since the form was opened, though the status
      was superseded elsewhere
  - file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
    name: shows no conflict alert while the edit has not been sent
  - file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
    name: shows no conflict alert when the edit is accepted
- criterion: The edit carries one change for each changed field.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one change for each changed field, a set change for a held or new value and a remove change for an emptied
      or removed one, and none for the fields left as they started
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: 'sends the confirmed edit: the trimmed reason and one change for the changed field'
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends no change for fields added to a multi-valued key that repeat an active value and an uncertain value the node
      holds
  why: '"sends no change for fields added to a multi-valued key that repeat an active value and an uncertain value the node
    holds" treats such added fields as unchanged. This criterion does not say whether they count as changed. See the entry
    for "While a field''s value differs from the value it started with, the review is not withheld for want of a changed field."'
- criterion: An unchanged field contributes no change.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends no change for fields the owner left as they started
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends no change for a field whose value equals the one it started with, whatever validity it holds
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
- criterion: A changed field holding a non-empty value is sent as a set change.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change carrying the value, the validity the field states and the attribute it started from for $label
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change that names no attribute for $label
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change for a field added to a multi-valued key that repeats only a superseded value
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
- criterion: A set change carries the field's value.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change carrying the value, the validity the field states and the attribute it started from for $label
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
- criterion: A set change carries the validity the field states.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change carrying the value, the validity the field states and the attribute it started from for $label
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: writes JSON null in every member that holds nothing and in the value and validity of a remove change
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
- criterion: A set change carries the identity of the attribute the field started from.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change carrying the value, the validity the field states and the attribute it started from for $label
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
  - file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: names the attribute now current, not the superseded one, in the next edit it sends
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
  - file: src/features/entities/components/__tests__/entity-form-schema.spec.ts
    name: records the current attribute a field started from, the value it started with and its value, for a key holding $held
- criterion: A set change of a field that started from no attribute carries no attribute identity.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change that names no attribute for $label
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change for a field added to a multi-valued key that repeats only a superseded value
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: writes JSON null in every member that holds nothing and in the value and validity of a remove change
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
  - file: src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
    name: builds a field added to a key from no current attribute and with no value
- criterion: A field the owner emptied after it started with a value is sent as a remove change.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one remove change naming the attribute it started from, with null value and validity, for $label
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one change for each changed field, a set change for a held or new value and a remove change for an emptied
      or removed one, and none for the fields left as they started
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
- criterion: A field the owner removed after it started with a value is sent as a remove change.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one remove change naming the attribute it started from, with null value and validity, for $label
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one change for each changed field, a set change for a held or new value and a remove change for an emptied
      or removed one, and none for the fields left as they started
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
- criterion: A remove change carries the identity of the attribute the field started from.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one remove change naming the attribute it started from, with null value and validity, for $label
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
- criterion: A validity start the owner did not state is sent empty.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: shows an unstated validity start as today in the review and sends the change with no validity start
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: shows an unstated validity start as today in the review and sends it empty while the owner states a validity end
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a null validity start, and no date of today, when the owner states none and $label
- criterion: The reason is sent trimmed.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends the reason trimmed when the owner typed $label
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: 'sends the confirmed edit: the trimmed reason and one change for the changed field'
- criterion: Each change carries its field's attribute key as attribute_key.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends a set change carrying the value, the validity the field states and the attribute it started from for $label
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one remove change naming the attribute it started from, with null value and validity, for $label
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: 'sends the confirmed edit: the trimmed reason and one change for the changed field'
- criterion: The body is the JSON object { reason, changes }.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed
      form
  - file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
    name: sends one change for each changed field, a set change for a held or new value and a remove change for an emptied
      or removed one, and none for the fields left as they started
- criterion: A refusal other than a conflict shows an alert carrying the refusal's message.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
    name: alerts with the message the refusal carries and with nothing else
  - file: src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
    name: alerts with the fixed text $text when the edit is answered $answered, as a refusal and not as an edit that could
      not be sent
- criterion: A refusal other than a conflict leaves every typed value in the form.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.save-refused.spec.tsx
    name: still holds the status the owner typed, the reason and the open review, though the node was superseded elsewhere
- criterion: An edit that cannot reach the knowledge base shows an alert saying the edit could not be sent.
  state: partial
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.save-unreachable.spec.tsx
    name: alerts that the edit could not be sent, with no message of the failure's own, when thirty seconds pass without an
      answer
  why: Only the 30-second cutoff is checked for this alert. An edit that fails on the network, or that is cancelled, is never
    checked for it. The network case in the same file asserts only the held values. So a form that showed a network failure
    as a refusal alert, reading "Falha de rede ao contactar o servidor.", would pass.
- criterion: An edit that cannot reach the knowledge base leaves every typed value in the form.
  state: partial
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.save-unreachable.spec.tsx
    name: still holds the status the owner typed, the reason and the open review when the request fails on the network
  why: Only a network failure is checked for the held values. After the cutoff the test reads the alert alone. Whether the
    typed status, the reason and the open review survive a timeout is never checked.
- criterion: An accepted edit causes the knowledge node to be read again.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: reads the node again after the edit and shows every field with the value now current
  - file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
    name: invalidates the node's queries when the edit is accepted
  why: '"invalidates the node''s queries when the edit is accepted" asserts the query cache''s invalidated flag. That is a
    mechanism, not a read, and it would pass even if no second read happened. The proof is the reload test, which sees the
    second GET.'
- criterion: After an accepted edit every field starts from the node's value now current.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: reads the node again after the edit and shows every field with the value now current
  - file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: names the attribute now current, not the superseded one, in the next edit it sends
  - file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: lists the value now current as the previous value when the next edit is reviewed
  - file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: starts over from the held values, with the reason cleared and the review closed, when the node read again is the
      same node
- criterion: The review states one effect for each changed field.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states exactly one effect for each changed field, a key with several changed fields included
- criterion: Each stated effect is a first value, an addition, a succession, a correction or a removal.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending
      punctuation
- criterion: A field of a temporal key that started from a current attribute and was changed to a non-empty value other than
    the one it started with is stated as a succession.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states a succession for a field of a temporal key that started from a current attribute and was changed to another
      non-empty value
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending
      punctuation
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
- criterion: A field of a key that is not temporal that started from a current attribute and was changed to a non-empty value
    other than the one it started with is stated as a correction.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states a correction for a field of a key that is not temporal that started from a current attribute and was changed
      to another non-empty value
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending
      punctuation
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
- criterion: A field given a value for a key of which the node holds no attribute with a live status, active, uncertain or
    disputed, is stated as a first value.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states a first value for a field given a value when $label
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states a first value for both of two fields added to a multi-valued key of which the node holds no live attribute
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending
      punctuation
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
- criterion: A field added to a multi-valued key of which the node holds an attribute with a live status, with a value no
    active or uncertain attribute of that key holds, is stated as an addition.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states an addition for a field added to a multi-valued key when $label
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states an addition for both of two fields added to a multi-valued key of which the node holds a live attribute
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states an addition for a field added while the same edit removes the only live attribute of the key
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending
      punctuation
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
- criterion: A field emptied after starting with a value is stated as a removal.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states a removal for a field of $label emptied after starting with a value
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: names a first value, an addition, a succession, a correction and a removal with their exact texts and no ending
      punctuation
  - file: src/features/entities/components/__tests__/entity-change-effect.spec.ts
    name: gives $label
- criterion: A field removed after starting with a value is stated as a removal.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-effects.spec.tsx
    name: states a removal for a field removed from a multi-valued key after starting with a value
- criterion: The form does not offer the review while every field holds the value it started with.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
    name: offers the review only while a field differs from the value it started with
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: offers no save and no reason field once the changed field returns to its starting value, whatever reason was typed
- criterion: While a field's value differs from the value it started with, the review is not withheld for want of a changed
    field.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
    name: offers the review only while a field differs from the value it started with
  - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
    name: does not offer the review for an added field whose value an active attribute holds or an uncertain attribute holds,
      and offers it for an added field with a value nothing holds
  - file: src/features/entities/components/__tests__/entity-field-changed.spec.ts
    name: reads a field as changed $expected when $label
  why: 'Contradiction finding, left for a person to settle. One test in review-offered, "does not offer the review for an
    added field whose value an active attribute holds or an uncertain attribute holds, ...", withholds the review in a specific
    case: a field added to a multi-valued key whose typed value is already held by an active or uncertain attribute of that
    key. The added field started empty and now holds a value, so its value differs from the one it started with. Read literally,
    this criterion forbids withholding the review there. The entity-field-changed rows "it is added to a multi-valued key
    and repeats an active/uncertain value" read such a field as unchanged. The entity-edit-payload test sends no change for
    it. This criterion does not state that rule. It may follow from review-effects'' wording of an addition. The case this
    criterion does state is proved by "offers the review only while a field differs from the value it started with".'
- criterion: The review lists each changed field once.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
    name: lists each changed field once with the value it started with beside the value it now holds
  - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
    name: lists an added field whose value only a superseded attribute holds
  - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
    name: lists a field that started with a value when the owner retypes it to a value another field of the key holds
  - file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
    name: does not list an added field that repeats an active or an uncertain value while another field is changed
  why: '"does not list an added field that repeats an active or an uncertain value while another field is changed" leaves
    out of the review an added field whose value differs from the empty value it started with. This raises the same contradiction
    named under "While a field''s value differs from the value it started with, the review is not withheld for want of a changed
    field." This audit does not settle it.'
- criterion: The review does not list a field whose value equals the value it started with.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
    name: does not list a field that holds the value it started with, whether the owner never touched it or returned it to
      that value
  - file: src/features/entities/components/__tests__/entity-field-changed.spec.ts
    name: reads a field as changed $expected when $label
- criterion: The review does not list a field whose value equals the value it started with even when its validity differs
    from the validity it started with.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
    name: does not list a field of a temporal key whose value is the value it started with while the validity it holds differs
      from the validity it started with
  - file: src/features/entities/components/__tests__/entity-field-changed.spec.ts
    name: reads a field as changed $expected when $label
- criterion: Each listed field shows the value it started with beside the value it now holds.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
    name: lists each changed field once with the value it started with beside the value it now holds
  - file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: lists the value now current as the previous value when the next edit is reviewed
- criterion: Each listed field of a temporal key shows the validity start it holds.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
    name: shows the validity start the field holds
- criterion: Each listed field of a temporal key that holds a validity end shows that validity end.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
    name: shows the validity end the field holds
- criterion: A validity start the owner has not stated shows as today in the review.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
    name: shows a validity start the owner has not stated as the calendar date of today
  - file: src/features/entities/components/__tests__/EntityForm.review-local-date.spec.tsx
    name: shows today in the review as the date in the owner's time zone at an hour when UTC is already on the next day
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: shows an unstated validity start as today in the review and sends the change with no validity start
  - file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
    name: shows an unstated validity start as today in the review and sends it empty while the owner states a validity end
- criterion: The review holds a field for the reason.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: holds a labelled text control for the reason in the open review
- criterion: The save is not offered while the trimmed reason holds no character.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: does not offer the save while no reason has been typed
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: does not offer the save for a reason of $label
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: offers the save only while the reason stands within the limits, withdrawing and offering it again as the reason
      changes
- criterion: The save is not offered while the trimmed reason holds more than 1000 characters.
  state: unauditable
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: does not offer the save for a reason of $label
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: offers the save only while the reason stands within the limits, withdrawing and offering it again as the reason
      changes
  why: 'The criterion does not say what a "character" is. The tests have to pick a meaning, and they count UTF-16 code units
    rather than code points. One row withholds the save for 1000 characters outside the Basic Multilingual Plane (2000 code
    units). Another offers it for 500 such characters. Counted in code points, the first reason holds exactly 1000 characters
    and must not be withheld under this criterion. Which count the criterion means is not stated, and this audit does not
    settle it. For text inside the Basic Multilingual Plane the two counts agree, and the tests check the boundary on both
    sides: 1001 characters, with and without padding that the trim removes.'
- criterion: A trimmed reason of 1 to 1000 characters does not withhold the save.
  state: unauditable
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: offers the save for a reason of $label
  - file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
    name: offers the save only while the reason stands within the limits, withdrawing and offering it again as the reason
      changes
  why: 'The same ambiguity as the 1000-character upper limit: "characters" can mean UTF-16 code units or code points. The
    tests settle it as code units. A reason of 1000 astral characters is 1000 characters counted in code points, yet a test
    in this file withholds the save for it ("does not offer the save for a reason of $label", ASTRAL × 1000). Under a code-point
    reading that row contradicts this criterion. Which count is meant is not stated, and this audit does not settle it. For
    text inside the Basic Multilingual Plane, 1 and 1000 characters are both checked, including 1000 characters surrounded
    by padding that the trim removes.'
- criterion: Confirming the review shows a notice that the edit is recorded.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: shows the notice 'Edição registrada.' once Salvar confirms the review
  why: The notice is checked by looking at the arguments passed to a mocked sonner toast, not at a notice rendered on screen.
    If no Toaster were mounted where the form lives, nothing would appear and the test would still pass.
- criterion: The notice offers an undo.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: offers the undo action labelled 'Desfazer' with the notice
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends nothing and leaves the typed values when the owner undoes three seconds after confirming
  why: The undo is read from the mocked toast's action option, and its onClick is called directly. No rendered notice is clicked.
- criterion: The undo is offered for five seconds.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: offers the undo for five seconds
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends the edit only after five seconds without an undo, and an undo sends nothing and leaves the form as it was
  why: The tests prove by behavior that the undo still works at 4999 ms. That it is withdrawn after five seconds is shown
    only by the duration argument passed to the mocked toast.
- criterion: No edit is sent before five seconds have passed.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends no edit before five seconds have passed
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends the edit only after five seconds without an undo, and an undo sends nothing and leaves the form as it was
- criterion: The edit is sent once five seconds pass without an undo.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends the edit once, as a POST to the node's edit address, when five seconds pass without an undo
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends the edit only after five seconds without an undo, and an undo sends nothing and leaves the form as it was
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: lets the owner press Salvar again after an undo, and sends that edit once its own five seconds pass
- criterion: An undo within the five seconds sends no edit.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends nothing and leaves the typed values when the owner undoes three seconds after confirming
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends the edit only after five seconds without an undo, and an undo sends nothing and leaves the form as it was
- criterion: An undo within the five seconds leaves the form holding the owner's typed values.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends nothing and leaves the typed values when the owner undoes three seconds after confirming
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: leaves the reason as typed and the review open after an undo
  - file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: sends the edit only after five seconds without an undo, and an undo sends nothing and leaves the form as it was
- criterion: A start that is not strictly earlier than the end shows a message on the validity end field.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: puts the fixed message on the validity end field when the start is $label the end
- criterion: A start that is not strictly earlier than the end withholds the save.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: withholds the save despite a valid reason once the start becomes $label the end
  - file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: offers the save again once a violated order is corrected
- criterion: A start strictly earlier than the end does not raise this message.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: raises no message when the start is one day earlier than the end
  - file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: offers the save with a valid reason when the start is strictly earlier than the end
- criterion: A field that states no validity end does not raise this message.
  state: covered
  tests:
  - file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: raises no message when no end is stated and there is $label
unpaired:
- test:
    file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: holds the picked allowed value's own value in the form rather than its label
  asserts: For a closed number key, picking the option labelled "Dois" shows that label and leaves the form's data-value-types-accepted
    attribute "true". So what the form holds is the allowed value "2", not its label.
- test:
    file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: lets the owner return a held closed value to nothing selected
  asserts: A control beside a closed-key choice clears a held value. Afterwards the choice has no option selected.
- test:
    file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
    name: renders a text input for a key without allowed values and a choice for a key with them
  asserts: A key without allowed values renders one text input and no combobox. A key with allowed values renders one combobox
    and no text input.
- test:
    file: src/features/entities/components/__tests__/EntityForm.multi-valued.spec.tsx
    name: offers no add or remove control on a key that does not allow multiple current values
  asserts: The field group of a single-valued key holds no buttons at all, so it offers no add or remove control.
- test:
    file: src/features/entities/components/__tests__/EntityForm.outside-catalog.spec.tsx
    name: keeps the value-type flag true when an outside-catalog value would be refused by a date or a number type
  asserts: The node holds attributes outside the catalog whose values a date or number type would refuse ("2026-02-30", "1,5").
    The form's data-value-types-accepted attribute stays "true", so those values are not checked against any value type.
- test:
    file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: clears the reason, so the next review has an empty reason field and no Salvar
  asserts: After an accepted edit and the reload, the next review opens with an empty reason field, and Salvar is not offered.
- test:
    file: src/features/entities/components/__tests__/EntityForm.reload-after-save.spec.tsx
    name: closes the review, offering neither the open review nor the control to open it
  asserts: After an accepted edit and the reload, neither the review panel nor the control that opens it is present.
- test:
    file: src/features/entities/components/__tests__/EntityForm.session-expired.spec.tsx
    name: shows no alert of either kind, neither the refusal's nor the could-not-be-sent one
  asserts: The edit is answered 401 and the session refresh fails. The form then shows no role=alert element, and the page-replacement
    redirect is called exactly once.
- test:
    file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
    name: schedules no second send when Salvar is pressed again during the window
  asserts: If Salvar is pressed again two seconds into the undo window, exactly one edit request is still sent once the windows
    have passed.
- test:
    file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: offers the save with a valid reason for an end earlier than today when the start is left unstated
  asserts: The validity start is left unstated and the stated end is earlier than today. With a valid reason, Salvar is still
    offered. So the start that shows as today is not compared with the end.
- test:
    file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
    name: raises no message for an end earlier than today when the start is left unstated
  asserts: The validity start is left unstated and the end is earlier than today. No order message appears, and the end field
    does not reference one.
- test:
    file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: offers no validity for an unchanged field of a temporal key while another field of the form is changed
  asserts: An unchanged field of a temporal key renders neither a validity start input nor a validity end input, and keeps
    its held value, while another field of the form is changed.
- test:
    file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
    name: withdraws the validity of a temporal field when its value goes back to the value it started with
  asserts: A temporal field offers both validity inputs while changed. Once its value goes back to the one it started with,
    it offers neither.
- test:
    file: src/router/__tests__/routes.entity.dom.spec.tsx
    name: reads the loading indication Carregando formulário… while the page's code is being fetched
  asserts: While the /entities/{node identity} page's code is still loading, the workspace shows a role=status element reading
    exactly "Carregando formulário…".
findings:
- pass: conformance
  file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  where: the KEYS_WIRE fixture, item k-2 (line 48), and keyNamed() (line 63) (node domain/knowledge-base/attribute-key)
  evidence: 'allows_multiple: true,'
  cost: The fixture gives the wire member that says a key allows multiple current values the name allows_multiple. The attribute-key
    node names that attribute allows_multiple_current, and the retrieval contract's list-attribute-keys answer does not name
    the wire member. The test pins a wire name the specification does not hold. If the knowledge base publishes the node's
    name, the test passes against a shape it never sends. Whoever reads the test for the wire shape will take allows_multiple
    as the decided name. I could not tell from the nodes which name is the wire name.
  correction: Either the retrieval contract's list-attribute-keys answer names the wire member of this fact and the fixture
    follows it, or the fixture uses the attribute-key node's name, allows_multiple_current.
  kind: contradicts
- pass: conformance
  file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  where: line 45, the expected `applied` entry of the first test, "is accepted with the node, the action and what was applied
    when the edit is answered 200". (node domain/knowledge-base/edit-effect)
  evidence: 'effect: "created",'
  cost: 'The test states "created" as the effect a 200 answer reports for a change. The enumeration holds six effects and
    "created" is not one of them: first-value, addition, succession, correction, removal and unchanged. The accepted answer
    the knowledge base publishes lists one effect per change. A reader who takes the accepted outcome''s shape from this test
    will think "created" is an effect the knowledge base can report. The same fixture value is in `edit-support.ts` (`ACCEPTED_WIRE`),
    and `types.ts` types `effect` as a bare `string`, so nothing fails if a value outside the set arrives.'
  correction: The expected effect, and the wire fixture it comes from, should use a value the enumeration holds, for example
    the first-value that a first value on `status_text` would report.
  kind: contradicts
- pass: conformance
  file: src/features/entities/api/__tests__/edit-support.ts
  where: ACCEPTED_WIRE, the first entry of applied (line 34) (node domain/knowledge-base/edit-effect)
  evidence: 'effect: "created",'
  cost: The fixture stands in for the accepted answer the upstream publishes, and it gives that answer an effect the specification
    never names. The effect enumeration holds first-value, addition, succession, correction, removal and unchanged. The wire
    type declares effect as a bare string, so the compiler does not catch the value. Tests that read this fixture assert against
    an effect word the knowledge base never sends. The next reader takes "created" as one of the effects and finds no node
    that holds it.
  correction: The fixture's effect would have to be one of the values the edit-effect enumeration holds, for example first-value
    for a change recorded as a new current value.
  kind: contradicts
- pass: conformance
  file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  where: the test at line 101 and the last catalog entry of the test at line 34, which treat an allowed value whose label
    is the empty string as one that has no label (node rules/entity-workspace/a-closed-key-offers-only-its-allowed-values)
  evidence: it("shows an allowed value whose label is the empty string by its own value, not as an empty option", ... allowed("venus-code",
    ""), ... "venus-code",
  cost: The node and its decision log say a value "that has no label" is shown by its own value. Neither says whether an empty-string
    label counts as no label, and the domain node allowed-value only declares `label` as an optional string. This test makes
    that choice. An owner and a later reader see the rule only here. If the catalog ever ships an empty label on purpose,
    the form and the specification will disagree and no node says which one was decided.
  correction: Give the fact a node, either by extending rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
    or by stating in domain/knowledge-base/allowed-value that an empty label is no label. Otherwise remove the assertion.
  kind: unstated
- pass: conformance
  file: src/features/entities/components/__tests__/EntityForm.closed-keys.spec.tsx
  where: the test at line 67, "keeps the order the catalog delivers the allowed values in, whatever their sort orders and
    whatever alphabetical order would give" (node rules/entity-workspace/a-closed-key-offers-only-its-allowed-values)
  evidence: allowed("k", "Medium", 30), allowed("c", "Urgent", 10), allowed("t", "High", 20), allowed("a", "Low", 40), ...
    toEqual(["Medium", "Urgent", "High", "Low"])
  cost: The node says only "in their order". The allowed-value domain node gives each value a `sort_order` ("its place in
    the key's order"), and the retrieval listing is stated elsewhere to give values in ascending string order. This test decides
    that the form shows the listing's delivery order and ignores `sort_order`. That decides what order the owner sees for
    every closed key, for example the status of a Task, and no node states it. The next reader would look in the specification
    for which order is meant and find two candidates.
  correction: State in the node which order the form shows, either the order the catalog listing delivers or `sort_order`.
    Then this test follows the node.
  kind: unstated
- pass: conformance
  file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  where: the first test of "entity form review listing of changed fields", lines 49-53, the expected order of the listed entries
    (node rules/entity-workspace/review-lists-each-changed-field-once)
  evidence: 'expect(listed.map(({ key, previous, next }) => ({ key, previous, next }))).toEqual([ { key: "tag", previous:
    "Alpha", next: "Alpha-edited" }, { key: "tag", previous: "Beta", next: "Beta-edited" }, { key: "title", previous: "Alpha",
    next: "Gamma" }, ]);'
  cost: 'The test fixes an order for the review''s entries: both tag fields come before title, although the catalog lists
    title first (CATALOG = [catalogKey("title"), temporalKey("role"), catalogKey("note"), multiKey("tag")]). No node of the
    set states how the review orders its entries, so this order is a decision that lives only in the test. The next reader
    will look for it in the specification and not find it.'
  correction: Either a node gives the review's order of entries, with review-lists-each-changed-field-once as the natural
    home, or the assertion stops depending on an order the specification does not decide.
  kind: unstated
- pass: conformance
  file: src/features/entities/components/entity-closed-choice.tsx
  where: the paragraph shown when heldOutside is true, line 80 (node rules/entity-workspace/a-closed-key-offers-only-its-allowed-values)
  evidence: '{`Valor atual fora dos valores permitidos: ${value}`}'
  cost: 'This is text the running system shows the owner. It states a domain fact: when the node''s current value is not among
    a key''s allowed values, the field keeps showing that value and tells the owner it is outside them. No node holds that
    fact. The entity-screen contract and a-closed-key-offers-only-its-allowed-values say only that a closed key offers its
    allowed values. The next reader looks for this behavior in the specification and finds it only in the component.'
  correction: An analysis would give the fact a node. That node would say what a closed-key field shows, and says, when the
    held value lies outside the allowed values. It would also fix the wording of the notice. Candidates are rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
    or a refusal or answer on contracts/entity-workspace/entity-screen.
  kind: unstated
- pass: conformance
  file: src/features/entities/components/entity-edit-payload.ts
  where: buildEntityEdit, the .sort(...) over the built changes (lines 129-130) (node rules/entity-workspace/save-sends-one-change-per-changed-field)
  evidence: .sort((first, second) => first.position - second.position)
  cost: 'The order in which the edit lists its changes is chosen only here: catalog position of the key, with changed fields
    ahead of removed fields inside one key (the sort is stable over fieldsToSend). The knowledge base answers one `applied`
    entry per change "in the order given", and its conflict and no-second-current-value judgments are made over that edit.
    The next reader looks in the specification for the order a save sends its changes and finds none, so the order reads as
    an implementation accident rather than a decision.'
  correction: Give the order in which a save sends its changes a node, for example by extending rules/entity-workspace/save-sends-one-change-per-changed-field,
    or state that the order is not significant.
  kind: unstated
- pass: conformance
  file: src/features/entities/components/entity-form-schema.ts
  where: HELD_ATTRIBUTE_STATUSES, lines 58-62, and isHeldAttribute, lines 64-66 (node domain/knowledge-base/live-assertion-status)
  evidence: "const HELD_ATTRIBUTE_STATUSES: readonly string[] = [\n  \"active\",\n  \"uncertain\",\n  DISPUTED_ATTRIBUTE_STATUS,\n\
    ];"
  cost: The three statuses a node attribute can hold while it is still held are already an enumeration in domain/knowledge-base/live-assertion-status
    (active, uncertain, disputed). This file declares them a second time as its own list, and the node is not bound to this
    file. If the enumeration gains or loses a value, no check reaches this list, and nobody can tell which of the two was
    decided.
  correction: The vocabulary needs one home. Either the node binds to this file, so that a change to the node reaches the
    list, or the list is derived from a declaration the node is bound to. Code cannot read the specification, so the correction
    is the bind and not a request that the file read it.
  kind: contradicts
- pass: conformance
  file: src/features/entities/components/entity-form-schema.ts
  where: outsideCatalogGroupsOf, line 92, and heldAttributesOf, lines 68-75 (node rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field)
  evidence: if (!isHeldAttribute(attribute)) continue;
  cost: The node says an attribute whose key the catalog no longer holds "MUST show its value without a field", with no status
    condition. The code drops every attribute that is superseded, deleted or of any status outside the three listed. That
    exclusion is a rule about what the owner sees, and it lives only here. The next reader looks for it in the specification
    and does not find it.
  correction: Add to the outside-the-catalog rule, or to a sibling node, which statuses show their value. The code can then
    stay as it is.
  kind: unstated
- pass: conformance
  file: src/features/entities/components/entity-list-parts.tsx
  where: TypesLoading, the text of the node-type loading indication (line 82) (node rules/entity-workspace/the-node-listing-stands-without-the-node-types)
  evidence: Carregando tipos de nó…
  cost: The wording shown while the node-type listing is fetched lives only in this component. The sibling indications ("Carregando
    nós…", "Carregando formulário…") have their wording written in a node, so a reader checking the specification for what
    the screen says here finds nothing. A change to this wording would never reach a node.
  correction: The analysis would have to give the node-type loading indication's wording a node. The natural home is the-node-listing-stands-without-the-node-types,
    which requires the indication but writes no text for it.
  kind: unstated
- pass: conformance
  file: src/features/entities/components/entity-review.tsx
  where: ReviewValue, line 19, the wording shown for a value that is empty (node contracts/entity-workspace/entity-screen)
  evidence: <span className="italic text-muted-foreground">Sem valor</span>
  cost: The text the review shows for an absent previous or new value, such as a first value or a removal, is a wording no
    node holds. The wording rules of the entity workspace pin the texts the screen shows to the letter ("Edição registrada.",
    "Primeiro valor" and others). This one lives only in this component, so the next reader looks in the specification and
    finds no such text. A later edit to it would not be a decision anyone recorded.
  correction: Give the wording for an empty previous or new value in the review a node. The show-review answer of contracts/entity-workspace/entity-screen,
    or a wording rule beside review-names-each-effect-in-its-wording, could hold it. Until then the string is a domain wording
    decided only in source.
  kind: unstated
- pass: conformance
  file: src/features/entities/types.ts
  where: line 145, the type AttributeChangeKind (node domain/knowledge-base/attribute-change-kind)
  evidence: export type AttributeChangeKind = "set" | "remove";
  cost: The two kinds of an attribute change are declared here and again in the node domain/knowledge-base/attribute-change-kind,
    whose values are `set` and `remove`. That node is not bound to this file, so a change to the enumeration in the node reaches
    no check on this file. If the two disagree later, nobody can tell which one was decided.
  correction: Bind domain/knowledge-base/attribute-change-kind to this file, because the file is where the enumeration is
    declared. Nothing in the code needs to change, since the values agree today.
  kind: contradicts
- pass: standard
  file: src/features/entities/components/EntityForm.tsx
  where: lines 28-37, the destructuring of `useEntityEditForm(mountedNode, attributeKeys)` and `const { control } = form;`.
    This is the only form in the file set. The `useForm` call itself sits in use-entity-edit-form.ts, which FRM-01's scope
    (`.tsx` under `src/features`) does not reach, so the finding is filed on the component that renders the form.
  cites: FRM-01
  evidence: 'From EntityForm.tsx lines 28-37: `const { node, form, valueTypesAccepted, changed, validityOrder, review, save,
    } = useEntityEditForm(mountedNode, attributeKeys); const { control } = form;` The form that hook returns is built in src/features/entities/components/use-entity-edit-form.ts
    lines 48-52, a separate file and not contiguous with the passage above: `const form = useForm<EntityFormValues>({ resolver:
    zodIssueResolver<EntityFormValues>(schema), defaultValues: values, mode: "onChange", });` The resolver is defined in src/features/entities/components/zod-issue-resolver.ts
    lines 5-9: `export function zodIssueResolver<TFieldValues extends FieldValues>( schema: z.ZodType<TFieldValues>, ): Resolver<TFieldValues>
    { return (values, _context, options) => { const parsed = schema.safeParse(values);` A grep of src finds `resolver: zodResolver(...)`
    in the other forms (SignInForm.tsx, CorrectionForm.tsx). The entity form is the only one that does not use it.'
  cost: The entity edit form turns Zod issues into field errors through a resolver written inside this feature (it keeps the
    first issue per path and calls `toNestErrors`), not through the project's `zodResolver`. A reader or maintainer who expects
    every form to go through `zodResolver` has to read this resolver to learn how issues become field errors. Any change in
    how `@hookform/resolvers` handles Zod issues reaches the other forms and does not reach this one. The schema-first order
    does hold here (schema, then `z.infer`, then form). What departs is the resolver, not the schema.
  correction: Either the form resolves through `zodResolver(schema)` like the project's other forms, or the standard records
    the entity form's per-path error mapping as a sanctioned exception. Which of the two is a decision for the standard's
    owner.
reconciliation: siegard-reconcile/entity-edit-frontend.md
run: run/entity-edit-frontend
---

## What it is

The review of the 21 tasks of the initiative entity-edit-frontend, over the 114 files they wrote under the target `frontend`: the client of the four reads and the edit request, the `/entities` listing, the `/entities/$nodeId` form with its review, save and undo, and the two lazy routes in the protected layout. The coverage, conformance and standard passes ran. The failures pass did not: the captured run `run/entity-edit-frontend` passed, so there was no failure to read.

## Notes

- The conformance pass judged each of the 114 files against every node the trace binds to it and every node the plan reads, one judge per file. 61 of the first returns were unusable (53 wrapped in a code fence, 8 answering only part of the node set handed over). Each was replaced by a fresh judgment of the same file with a fixed prompt; the unusable originals are kept outside the repository and are not part of this record. One of those fresh judgments was incomplete again and was replaced a second time. The saved returns under `siegard-reconcile/entity-edit-frontend.returns/` are the judges' replies verbatim.
- The fold cleared 43 nodes and did not clear 31. The bind wrote the 43 and wrote none of the 31. The bind left 33 bindings stale, each a `code` drift on the next trace check until a reconciliation reads those files again.
- The coverage auditor read every criterion of the 21 tasks. Where a `why` names an over-assertion, the test is named there and no state is changed by it. Two criteria are unauditable because the criterion does not say what a character is for a reason of up to 1000 characters; the tests count UTF-16 code units. The audit did not settle which count the criterion means.
- Eight criteria are stated by two tasks alike; the record answers each once, with the tests of both and the weaker state.
- The coverage pass left one contradiction for a person: the tests withhold the review for an added field of a multi-valued key whose value an active or uncertain attribute already holds, while a criterion reads literally that a changed value is never withheld. This audit did not settle it.
- The standard pass was handed the six rules a reading decides in scope for these files. No path of the file set is reached by no rule. The standard's other rules are a tool's and arrive through the project's own suite.
- The standard pass read every non-test source file whole. For the test and support files it applied the rules by searching for the constructs each rule forbids, not by reading each file end to end.
