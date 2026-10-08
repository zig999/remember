---
target: frontend
title: Proof for the entity page at /entities/$nodeId
summary: Tests over the real routed page and the route tree, written against task/entity-form/entity-page, covering each criterion, the four UNDERDETERMINED entries and two nodes whose fact a finite test decides.
implementation: sha256:7fb1fe3738b1e393b7c735909be232995a16d8e0d29e8c33f785ab9d4d54f71f
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-entity-page-suite
tests:
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: stands a loading indication in place of the form while the node is being fetched
  proves: While the node or the catalog is being fetched, a loading indication stands in place of the form (the node part).
  fails_when: the page shows no status indication while the node read is pending, shows an alert, or mounts the form before the node has arrived.
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: stands a loading indication in place of the form while the catalog is being fetched
  proves: While the node or the catalog is being fetched, a loading indication stands in place of the form (the catalog part, for an active node whose catalog read is pending).
  fails_when: the page mounts the form, or shows nothing, once the node is delivered but the catalog has not answered.
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: reads the loading indication Carregando formulário…
  proves: 'UNDERDETERMINED entry 1 (wording), loading part: the page''s loading indication reads "Carregando formulário…".'
  fails_when: the loading indication is a spinner with no text, or reads any text other than exactly "Carregando formulário…".
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: shows the alert Nó não encontrado.
  proves: 'An identity at which no knowledge node is held shows an alert saying the node was not found. UNDERDETERMINED entry 1 (wording), not-found part: the alert reads exactly "Nó não encontrado." for a 404 RESOURCE_NOT_FOUND.'
  fails_when: the not-found alert reads "Node not found" or any other text, carries extra text, or the 404 RESOURCE_NOT_FOUND refusal is shown as another state.
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: shows the could-not-load-form alert when the node read fails for another cause
  proves: 'A node or catalog that fails to load for any cause other than the two refusals shows an alert saying the form could not be loaded (node part). UNDERDETERMINED entry 1 (wording): the alert reads "Não foi possível carregar o formulário. Tente novamente.".'
  fails_when: a failing node read (500) shows no alert, shows another sentence such as "Erro ao carregar", or is shown as not found or deleted.
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: shows the could-not-load-form alert when the catalog read fails for an active node
  proves: A node or catalog that fails to load for any other cause shows the could-not-load-form alert (catalog part).
  fails_when: a failing catalog read for an active node shows the form, a loading indication forever, or any alert other than the could-not-load-form one.
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: labels the could-not-load-form alert's action Tentar novamente
  proves: 'UNDERDETERMINED entry 1 (wording), action part: the try-again action of the could-not-load-form alert reads "Tentar novamente".'
  fails_when: the alert has no button, or its label reads anything other than exactly "Tentar novamente".
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: loads the node and the catalog again when the action is used after the catalog failed
  proves: The could-not-be-loaded alert offers an action that loads the node and the catalog again (catalog failed, node delivered).
  fails_when: using the action re-requests only the node, only the catalog, or neither, so the requests do not repeat to two node reads and two catalog reads.
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: loads the node and then the catalog when the action is used after the node failed
  proves: The could-not-be-loaded alert offers an action that loads the node and the catalog again (node failed, so the catalog is loaded once the node arrives).
  fails_when: using the action does not request the node again, or the catalog is never requested after the retried node arrives as active.
- file: src/features/entities/components/__tests__/EntityPage.states.spec.tsx
  name: carries no code or message of the failure's own in the $label
  proves: 'UNDERDETERMINED entry 2: the rule fixes that no alert carries a code or message of the failure''s own, and only the deleted alert was held to it by a criterion. One row for the node-not-found alert (404 RESOURCE_NOT_FOUND) and one for the could-not-load-form alert (500 with a distinctive code and message).'
  fails_when: the not-found alert or the could-not-load-form alert shows the failure's code or its message.
- file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
  name: shows the node's $label
  proves: The page shows the node's name; shows the node's node type; shows the node's status (one row each, for a needs-review node).
  fails_when: the page omits the node's canonical name, its node type or its stored status.
- file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
  name: places the node's $label above the form
  proves: 'UNDERDETERMINED entry 4: the screen''s answer places the node''s name, type and status above the form; one row each for name, node type and status of an active node.'
  fails_when: the name, the type or the status is shown after the form in document order.
- file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
  name: offers the form only for an active node and shows the attributes of any other node without a form (status %s)
  proves: A node whose status is not active and that the knowledge base still delivers shows its attributes; shows no form; A node whose status is active is offered the form. Rows are the delivered statuses of node-status (active, needs-review, merged); deleted is refused and never delivered.
  fails_when: an active node is not offered the form, a needs-review or merged node is offered the form, or a non-active node does not show its attribute keys and values.
  demonstrates: rules/entity-workspace/the-form-is-offered-only-for-an-active-node
- file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
  name: shows no field for a node whose status is not active
  proves: A node whose status is not active shows no field (no input, select or textarea), with the node loaded.
  fails_when: the page of a non-active node renders any input, select or textarea.
- file: src/features/entities/components/__tests__/EntityPage.node.spec.tsx
  name: shows the deleted-node alert in place of the form, with no action and no code or message of the failure's own
  proves: A node the knowledge base refuses as deleted shows the deleted-node alert reading "Este nó foi apagado."; shows no form; the alert carries no code or message of the failure's own; offers no action to try again. A 410 BUSINESS_NODE_DELETED with a distinctive message is stubbed and the alert text must equal the sentence.
  fails_when: the 410 BUSINESS_NODE_DELETED refusal shows any text but exactly "Este nó foi apagado." in the alert (including the failure's code or message), mounts the form, or offers a try-again action.
  demonstrates: rules/entity-workspace/a-deleted-node-shows-its-own-alert
- file: src/router/__tests__/routes.entity.dom.spec.tsx
  name: redirects a visit without a session to /sign-in instead of showing the page
  proves: /entities/{node identity} renders inside the protected layout (the session guard of that layout runs on this address).
  fails_when: the entity route is declared outside the protected layout, so a visit with no session stays at /entities/n-1 instead of landing on /sign-in.
- file: src/router/__tests__/routes.entity.dom.spec.tsx
  name: renders the page in the workspace of the application shell for a visit with a session
  proves: /entities/{node identity} renders inside the protected layout (the page sits in the shell's workspace region); it also shows the lazy page is reached when the address is opened, which keeps the two not-fetched tests from passing against a mock that never intercepts.
  fails_when: the page renders outside the application shell's workspace, or never renders for an authenticated visit.
- file: src/router/__tests__/routes.entity.dom.spec.tsx
  name: does not fetch the page's code with the initial load of the application
  proves: 'The /entities/{node identity} page is loaded lazily. UNDERDETERMINED entry 3: the code is fetched only when the address is first opened, never with the initial load or prefetched after it.'
  fails_when: the page module is imported statically by the router graph, or fetched after the initial load of another address (a prefetch).
- file: src/router/__tests__/routes.entity.dom.spec.tsx
  name: does not fetch the page's code when its address is preloaded
  proves: 'UNDERDETERMINED entry 3: a chunk preloaded on hover must not fetch the page''s code; hover (intent) preloading calls router.preloadRoute, which is what the test calls with a session.'
  fails_when: preloading the address fetches the page's code, as when the route component carries a preload hook such as lazyRouteComponent.
- file: src/router/__tests__/routes.entity.dom.spec.tsx
  name: reads the loading indication Carregando formulário… while the page's code is being fetched
  proves: 'UNDERDETERMINED entry 1 (wording), loading part, at the moment the page''s code is being fetched: the Suspense fallback reads "Carregando formulário…".'
  fails_when: the fallback shown while the lazy module is pending has no text or reads anything other than exactly "Carregando formulário…".
files:
- path: src/features/entities/components/__tests__/page-support.tsx
  effect: 'shared helper for the two EntityPage specs: it signs in, stubs the global fetch with a responder that answers the node read and the attribute-key read by path (counting attempts per path, any other request such as the shell''s health check never answering), mounts the real route tree at /entities/{id} in a memory router under a QueryClientProvider, and offers node, catalog and refusal answers plus helpers to observe the rendered workspace, wait, click, count requests and unmount.'
- path: src/features/entities/components/__tests__/session-token.ts
  effect: builds a JWT-shaped session token with an expiry one hour ahead, so the protected layout's guard lets a visit through; shared by the page helper and the route spec.
not_applicable:
- edge_case: an empty or absent node identity in the address
  why: the route path /entities/$nodeId requires a segment, and no criterion or node states what an address without one shows.
- edge_case: a node identity with characters that need URL encoding
  why: the encoding of the identity in the request is the node-read hook's, decided and tested by the node-and-catalog-reads task, not by this page.
- edge_case: a network failure or an unreadable answer as the other cause of failing to load
  why: the criterion treats every cause other than the two refusals alike, and a 500 on the node read and a 500 on the catalog read already represent that class.
- edge_case: a 401 with an expired session during the reads
  why: the request helper owns the silent refresh and the redirect, and no criterion or node of this task states what the page shows for it.
- edge_case: a node delivered with no attributes, or an active node whose catalog holds no key
  why: no criterion or node states what a non-active node with no attributes shows, and the groups of an active node's form belong to the field-groups task.
- edge_case: using the try-again action twice, or navigating to another identity while a read is pending
  why: no node or criterion states concurrent or repeated behavior for the page.
- edge_case: a slow read
  why: the loading indication is the behavior owed for it, and the request timeout belongs to the request helper.
untested:
- 'contracts/entity-workspace/entity-screen: it spans show-entity-list, show-review and save-edit and the disputed-key refusal, which belong to other tasks, so no test of this task decides it whole; the show-entity-form answers this task owns are tested above but not claimed.'
- 'domain/entity-workspace/entity-edit-session: the aggregate''s operations other than open-entity (change-field, review-changes, confirm-save, undo-save, discard-changes) and its state belong to later tasks, and EntityForm is an empty mount point here, so no finite test of this task decides it whole.'
- 'rules/entity-workspace/the-screen-lives-at-the-entities-addresses: the listing at /entities and the lazy fetch of the listing page belong to the listing task (the task''s REMAINDER note); the form address''s first-open fetch is exercised by the lazy tests, but half the rule is not claimed.'
- 'rules/application-shell/every-other-address-is-guarded: its fact is a totality over every declared address of the application, a set this task does not own; this task''s own address is exercised by the guard and shell tests, but a test over all routes would assert more than the criteria establish.'
- 'rules/entity-workspace/the-listing-and-page-states-read-their-wording: the listing texts and the recorded-edit notice belong to other tasks; the page''s texts are tested under UNDERDETERMINED entries 1 and 2, but the node is not claimed whole.'
- 'contracts/entity-workspace/bff-entity-reads: list-node-types and list-nodes are not used by this page, and the request forms of read-node and list-attribute-keys are decided by the api hook tests of the node-and-catalog-reads task; the page tests only assert that those reads repeat on retry.'
- 'Inference, not pinned: the attribute-key catalog is requested only for an active node; the tests do not assert it is never requested for a non-active node, and no node decides it.'
- 'Inference, not pinned: not-found and deleted are told by the codes RESOURCE_NOT_FOUND and BUSINESS_NODE_DELETED alone; a 404 with another code, a 410 with another code, and a catalog read refused with RESOURCE_NOT_FOUND have no node deciding their alert, so no test fixes them.'
- 'Inference, not pinned: the structural labels (Tipo, Status, Atributos, Formulário de edição, Nó de conhecimento), the Alert variants, the layout of attributes and the absence of any region for a non-active node with no attributes; the attribute tests assert only that each attribute''s key and value appear, and the header tests only that the stored name, type and status values appear, because no node states a label or a presentation.'
- 'Inference, not pinned: the header is shown whenever the node is loaded and its read has not failed, including while the catalog loads or fails, and is hidden under the loading and failure alerts; the ordering tests assert only the order above the form for an active node.'
- 'Inference, not pinned: the global failure router (QueryCache onError) may show a toast beside these alerts, including a toast carrying the server''s message beside the deleted alert; the tests mount their own QueryClient without that router and assert nothing about toasts either way, and no node decides it (the task''s third ADVISORY note).'
- 'Mechanism not tested: the implementation record says route-level preload false turns off hover preloading; in router-core that option only skips loaders during a preload and the real guarantee is that the inline route component has no preload hook; the preload test decides the behavior regardless of mechanism.'
- src/router/__tests__/routes.spec.tsx test TC-01 still lists the earlier route ids and was left untouched; it asserts only presence, and the new route's presence is decided by the new route spec.
---
## What it is
This record proves task/entity-form/entity-page.
It holds three spec files and two shared helpers that stub the global fetch and mount the real route tree.

## Notes
The suite passed on its first run, run/entity-form-entity-page-suite.
