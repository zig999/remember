---
target: frontend
title: Entity page at /entities/$nodeId
summary: The lazy, guarded page for one knowledge node, with its header, loading, not-found, deleted and could-not-load states, the attributes of a non-active node and an empty form mount point for an active one.
task: sha256:db01e8875af1e06b496de112593e4639a1f9be5d68f324e8faa90959c23085f5
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-entity-page-build
files:
- path: src/router/routes.tsx
  effect: adds the lazy import of EntityPage and the entityRoute at /entities/$nodeId, a child of protectedLayoutRoute, so it runs the same session guard as the other pages; the route has preload false and a Suspense fallback reading "Carregando formulário…" and is added to the protected layout's children, so the page chunk is requested only when the address renders.
- path: src/features/entities/components/EntityPage.tsx
  effect: 'new: reads nodeId from the route, calls useNodeRead, and calls useAttributeKeys only for an active node; picks one body (not-found alert, deleted alert, could-not-load alert with retry, loading, attributes of a non-active node, or the form mount point) and stands the node header above it.'
- path: src/features/entities/components/entity-page-parts.tsx
  effect: 'new: FormLoading, NodeNotFoundAlert, NodeDeletedAlert and FormLoadErrorAlert carry the fixed pt-BR wording and no code or message of a failure, and only FormLoadErrorAlert has the "Tentar novamente" action; NodeHeader shows name, type and status; NodeAttributeList shows the delivered attributes as key and value.'
- path: src/features/entities/components/entity-page-helpers.ts
  effect: 'new: classifyNodeFailure maps an EnvelopeError code to not-found (RESOURCE_NOT_FOUND), deleted (BUSINESS_NODE_DELETED) or other, and ACTIVE_NODE_STATUS names the status that offers the form.'
- path: src/features/entities/components/EntityForm.tsx
  effect: 'new: the named mount point for the form; it receives the loaded node and the catalog''s attribute keys and renders an empty labelled form element with no field.'
criteria:
- criterion: /entities/{node identity} renders inside the protected layout.
  met: true
  how: 'entityRoute in src/router/routes.tsx has getParentRoute: () => protectedLayoutRoute, so the route renders in the protected layout and goes through its beforeLoad session guard.'
- criterion: The /entities/{node identity} page is loaded lazily.
  met: true
  how: 'EntityPage is a lazy() dynamic import in src/router/routes.tsx and nothing in the router imports the module statically; the route also sets preload: false.'
- criterion: The page shows the node's name.
  met: true
  how: NodeHeader renders node.canonicalName in an h1 (entity-page-parts.tsx).
- criterion: The page shows the node's node type.
  met: true
  how: NodeHeader renders node.nodeType in a dd (data-testid entity-node-type) under a screen-reader label "Tipo".
- criterion: The page shows the node's status.
  met: true
  how: NodeHeader renders node.status in a dd (data-testid entity-node-status) under a screen-reader label "Status".
- criterion: While the node or the catalog is being fetched, a loading indication stands in place of the form.
  met: true
  how: EntityPage renders FormLoading (role status, aria-live polite, "Carregando formulário…") while the node read is undefined and while an active node's catalog is undefined; the EntityForm mount point is not rendered meanwhile.
- criterion: An identity at which no knowledge node is held shows an alert saying the node was not found.
  met: true
  how: classifyNodeFailure returns not-found for an EnvelopeError with code RESOURCE_NOT_FOUND on the node read and EntityPage renders NodeNotFoundAlert, a role alert reading "Nó não encontrado." with no header, form or retry.
- criterion: A node the knowledge base refuses as deleted shows the deleted-node alert reading "Este nó foi apagado.".
  met: true
  how: The code BUSINESS_NODE_DELETED classifies as deleted and EntityPage renders NodeDeletedAlert, a role alert whose only text is "Este nó foi apagado.".
- criterion: A node the knowledge base refuses as deleted shows no form.
  met: true
  how: In the deleted branch the body is only NodeDeletedAlert and EntityForm is not rendered.
- criterion: The deleted-node alert carries no code or message of the failure's own.
  met: true
  how: NodeDeletedAlert has fixed children text and no title, and EntityPage never reads error.code or error.message into the output.
- criterion: The deleted-node alert offers no action to try again.
  met: true
  how: NodeDeletedAlert passes no action to Alert, so it has no button.
- criterion: A node or catalog that fails to load for any cause other than no node being held at the identity or the node being refused as deleted shows an alert saying the form could not be loaded.
  met: true
  how: Any other node-read failure classifies as other and any catalog failure for an active node sets catalogFailed; both render FormLoadErrorAlert, a role alert reading "Não foi possível carregar o formulário. Tente novamente." with no code or message.
- criterion: The could-not-be-loaded alert offers an action that loads the node and the catalog again.
  met: true
  how: FormLoadErrorAlert has a "Tentar novamente" button wired to retry in EntityPage, which calls nodeQuery.refetch() and also catalogQuery.refetch() when a catalog is wanted; if the node itself failed, the catalog loads as soon as the node arrives.
- criterion: A node whose status is not active and that the knowledge base still delivers shows its attributes.
  met: true
  how: 'For a delivered node whose status is not active the body is NodeAttributeList over read.attributes: a Panel region "Atributos" listing each attribute''s key and value.'
- criterion: A node whose status is not active shows no form.
  met: true
  how: formNodeType is null for a non-active node, so the EntityForm branch is not reached.
- criterion: A node whose status is not active shows no field.
  met: true
  how: The non-active branch renders only a read-only dl of text (dt/dd), with no input, select or textarea.
- criterion: A node whose status is active is offered the form.
  met: true
  how: For an active node whose catalog has loaded the body is EntityForm, a form element labelled "Formulário de edição" (data-testid entity-form); it holds no fields yet, since the field-groups task fills it.
nodes:
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-page-parts.tsx
  - src/features/entities/components/entity-page-helpers.ts
  how: 'Encodes the show-entity-form answers this task owns: the node''s name, type and status above the body, loading in place of the form, the not-found alert, the could-not-load alert with the try-again action, and for a non-active node the attributes with no form and no field; the field groups, the disputed-key pointer, show-entity-list, show-review and save-edit are not reached. The deleted-node answer is the one the deleted-node rule fixes, as the advisory note says the contract does not list it.'
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/EntityForm.tsx
  how: The open-entity operation is reached as far as identifying the node from the address, reading it and mounting the form; EntityForm receives the loaded node and is where the session's fields, reason, reviewing and undo_deadline will live; the other operations belong to later tasks.
- node: rules/entity-workspace/the-screen-lives-at-the-entities-addresses
  encoded_at:
  - src/router/routes.tsx
  how: 'The form address /entities/{node identity} is entityRoute at /entities/$nodeId; its code is a React.lazy dynamic import fetched only when the address first renders, and preload: false stops a hover from fetching it; the listing clause belongs to the listing task.'
- node: rules/application-shell/every-other-address-is-guarded
  encoded_at:
  - src/router/routes.tsx
  how: entityRoute is a child of protectedLayoutRoute, which shows the application shell and redirects to /sign-in without a fresh session; nothing is added to the guard.
- node: rules/entity-workspace/the-form-is-offered-only-for-an-active-node
  encoded_at:
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-page-helpers.ts
  how: Only a node whose status equals ACTIVE_NODE_STATUS (active) reaches EntityForm; any other delivered node shows NodeAttributeList and no form, and its catalog is not even requested.
- node: rules/entity-workspace/a-deleted-node-shows-its-own-alert
  encoded_at:
  - src/features/entities/components/EntityPage.tsx
  - src/features/entities/components/entity-page-parts.tsx
  - src/features/entities/components/entity-page-helpers.ts
  how: BUSINESS_NODE_DELETED classifies as deleted and NodeDeletedAlert reads "Este nó foi apagado." in place of the form, with no failure code or message and no try-again action.
- node: rules/entity-workspace/the-listing-and-page-states-read-their-wording
  encoded_at:
  - src/features/entities/components/entity-page-parts.tsx
  - src/router/routes.tsx
  how: 'The page''s texts are written as the rule fixes them: "Nó não encontrado.", "Não foi possível carregar o formulário. Tente novamente." with "Tentar novamente", and "Carregando formulário…" both in FormLoading and in the route''s Suspense fallback; no page alert shows a code or message; the listing texts and the recorded-edit notice are not reached.'
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/components/EntityPage.tsx
  how: The page consumes read-node and list-attribute-keys only through the existing useNodeRead and useAttributeKeys hooks, which go through the request helper, adds no request of its own and reads the refusals by the EnvelopeError code; list-node-types and list-nodes are not used by this page.
inferences:
- inferred: The status is shown as the stored value (active, needs-review, merged) and the node type as its name, with no label mapping.
  from: domain/knowledge-base/node-status holds only the values and no node states a label for them; the node read delivers node_type as the type's name.
- inferred: The structural labels "Tipo", "Status" (screen-reader only), "Atributos" (panel title), "Formulário de edição" and "Nó de conhecimento" (aria-labels) were chosen by the implementer.
  from: WCAG 2.2 AA in the project's configuration needs labelled regions, and the wording rule fixes only the alert, loading and action texts; these are labels, not statements of any outcome.
- inferred: A non-active node shows every attribute the read delivers, as key and value only, and shows no region when it has none, since no text is fixed for that case.
  from: rules/entity-workspace/the-form-is-offered-only-for-an-active-node says "shows its attributes" without a filter, a layout or an empty-case wording.
- inferred: The attribute-keys catalog is requested only for an active node; for a non-active node it is never fetched, so a catalog failure cannot affect that page.
  from: The catalog serves only the form's field groups, and the entity-screen contract's loading and failure refusals concern the form.
- inferred: Not-found and deleted are read from the node query's error only; a failure of the catalog read, even with RESOURCE_NOT_FOUND, is always the could-not-load-form alert.
  from: The not-found refusal is "no knowledge node is held at the identity in the address", which only the node read can state.
- inferred: A 410 BUSINESS_NODE_DELETED is shown as deleted, not as not found and not as could-not-load; not-found is told by the code RESOURCE_NOT_FOUND alone and deleted by BUSINESS_NODE_DELETED alone, reading the code and not the HTTP status.
  from: The deleted-node rule gives the deleted refusal its own alert; the task's first note says no node places it under not found or the other causes; the codes come from intake/wire-facts.md.
- inferred: Not-found and deleted use the ui-kit Alert variant warning and could-not-load uses destructive; all have role alert.
  from: The curation page's could-not-load banner uses destructive; no node fixes a variant for the other two, so a domain outcome got the milder one.
- inferred: The page shows its header (name, type, status) above the body whenever the node is loaded and its read has not failed, including while the catalog loads or fails; it shows no header while loading nor under the not-found, deleted or other-failure alerts.
  from: The entity-screen contract places name, type and status above the field groups (the task's fourth note), and a failed read delivers no node.
- inferred: 'No parent /entities route was added: TanStack Router accepts the flat route /entities/$nodeId as a direct child of the protected layout, like the other flat routes.'
  from: src/router/routes.tsx declares each protected page as a direct child with a full path; the /entities listing route is the listing task's.
- inferred: 'The route''s lazy chunk is not preloaded or prefetched: the route component wraps a React.lazy page in an inline function, so the router has no component.preload to call, and preload: false also turns off hover (intent) preloading, which router.ts enables by default; no other code imports the page module.'
  from: 'src/router/router.ts has defaultPreload intent; the router-core route options declare preload?: boolean.'
- inferred: 'The global failure router does show something beside these alerts and was left unchanged: RESOURCE_NOT_FOUND returns inline-empty and has no toast; BUSINESS_NODE_DELETED returns a warning toast carrying the server''s message, so the deleted alert is accompanied by a toast with the failure''s own message; any SYSTEM_* or other code gives the could-not-load alert beside a danger toast (generic text, or the server''s message for an unlisted code); SYSTEM_NETWORK gives a "Sem conexão." warning toast and SYSTEM_ABORTED is silent; queries retry once before the error shows.'
  from: src/lib/query-client.ts (QueryCache onError and applyErrorAction) and src/lib/error-routing.ts (routeError); the brief forbids modifying global handlers and the third ADVISORY note says no node states whether the page's states take the place of the router, so this is not settled by the specification.
preserved:
- The existing protected routes (chat, graph, search, ingest, curation, history, not-found) and their lazy plus Suspense pattern are unchanged; the only edits to src/router/routes.tsx are the new import, route and tree child.
- The protected layout's beforeLoad session guard and the /sign-in route are untouched.
- src/lib/http.ts, src/lib/query-client.ts, src/lib/error-routing.ts and everything under backend/ are unchanged.
- The entities api hooks (useNodeRead, useAttributeKeys, keys, transforms and types) are used as they are and not modified.
- Header, graph detail panel and curation page (including its GlassSurface import) are untouched, and no menu entry or button was added.
- No dependency was added and package.json is untouched.
deferred:
- what: 'EntityForm (src/features/entities/components/EntityForm.tsx) is an empty form element (aria-label "Formulário de edição") that receives { node: NodeRead, attributeKeys: readonly AttributeKey[] }; the field-groups task must replace its body with one group of fields per attribute key of the node''s type, each holding the current value, help text and, for a closed key, its allowed values, and the disputed-key and out-of-catalog handling, the review, reason and save flow with the edit session''s state.'
  why: 'Those belong to the field-groups, review and save tasks; this task owns only the frame: which node is shown, the states around it, and whether a form is offered at all.'
- what: The /entities listing route, its lazy page and the listing clause of the addresses and wording rules are not registered or written, and the recorded-edit notice is not shown.
  why: Named as REMAINDER in the task's notes for the listing and save tasks.
- what: src/router/__tests__/routes.spec.tsx test TC-01 lists the expected route ids but not /protected/entities/$nodeId; it only asserts presence, so it still passes, and none of this task's states has a test yet.
  why: The implementer writes no tests and a proof task judges what is written.
- what: The failure router's toast beside the deleted alert (warning toast with the server's message) and beside the could-not-load alert (danger toast); whether the page's states should replace it is open.
  why: The brief forbids modifying global handlers and no node says whether the page's states take the place of the router; it needs a decision in the specification.
---
## What it is
This record answers task/entity-form/entity-page.
It holds the entity page's route, its states and the empty form mount point.

## Notes
The build passed on its first run, run/entity-form-entity-page-build.
