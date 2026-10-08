---
target: frontend
title: Proof for the entity listing at /entities
summary: Tests over the real routed listing page (global fetch stubbed, real route tree, real hooks) and over the route tree's lazy loading, covering every criterion, the four UNDERDETERMINED entries and four nodes whose fact a finite test decides.
implementation: sha256:2f01a8e7e8bfdb8bd865a0bdec064e602d97bd2a0958819254690f2b6fbeb507
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-listing-entity-list-screen-suite
tests:
- file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  name: each node of the entity listing shows its $label (rows name, node type, status)
  proves: Criteria "Each listed node shows its name.", "Each listed node shows its node type." and "Each listed node shows its status." One row per field; each row asserts that the row of every listed node (three nodes with distinct names, types and statuses) holds that node's value of the field.
  fails_when: a listed node's row omits its canonical name, its node type or its status, or shows the value of another node.
- file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  name: the narrowings of the entity listing lists the nodes the knowledge base lists for the name prefix the owner types
  proves: Criterion "A name prefix the owner types narrows the listing to the nodes the knowledge base lists for that prefix." The stub answers by name_prefix and the narrowed answer holds a node absent from the unnarrowed one, so only a page that requests the prefix and shows the answer passes.
  fails_when: typing a prefix sends no name_prefix, sends it under another name, or the page filters the earlier answer by itself instead of showing the knowledge base's answer for the prefix.
- file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  name: the narrowings of the entity listing lists the nodes the knowledge base lists for the node type the owner picks
  proves: Criterion "A node type the owner picks narrows the listing to the nodes the knowledge base lists for that type." The stub answers only for node_type equal to the type's name; the listed types carry identities distinct from their names.
  fails_when: picking a type sends no node_type, sends the type's identity instead of its name, or the page filters client-side instead of showing the answer for the type.
- file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  name: the narrowings of the entity listing offers as node types the node types the knowledge base lists
  proves: Criterion "The node types offered are those the knowledge base lists." The listed types are deliberately unusual names, so a hard-coded catalog cannot pass; the offered options are the listed names in order plus exactly one other option (the any-type option the fourth UNDERDETERMINED entry presupposes).
  fails_when: the choice offers a type the knowledge base did not list, omits a listed one, or offers a fixed catalog instead of the listing.
- file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  name: the narrowings of the entity listing narrows by the name prefix and the node type together and opens /entities/{identity} of the node the owner picks
  proves: Criterion "Picking a node opens /entities/{that node's identity}." and the node's fact that the screen lists the nodes the knowledge base lists, narrowed by a name prefix and a node type, and opens the one the owner picks. The stub answers differently for prefix alone, type alone and both, and the second node of the joint answer is the one picked.
  fails_when: the joint narrowing drops either narrowing, the listing shown is not the answer for both, picking a node does not navigate, or it navigates to another address than /entities/{the picked node's identity} (for instance the first node's).
  demonstrates: rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type
- file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  name: the requests of the entity listing carry the name prefix under name_prefix and the node type by its name under node_type, and carry neither before the owner gives it
  proves: 'The node''s fact: the node listing request carries the prefix in name_prefix and the node type, by its name rather than its identity, in node_type, and leaves out each narrowing not given. Observed on the recorded request URLs: none, type only, both.'
  fails_when: the first request carries any parameter, the type is sent as its identity or under another parameter name, or the prefix is sent under another name.
  demonstrates: rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
- file: src/features/entities/components/__tests__/EntityListPage.listing.spec.tsx
  name: the requests of the entity listing leave out an emptied name prefix and the all-types option instead of sending an empty value or a sentinel
  proves: UNDERDETERMINED entry 4 (an any-type option that hands a sentinel to the request would send node_type=all) and the node's fact that an empty name prefix or an empty node type is a narrowing not given. After the all-types option is picked the request holds no node_type at all and, after the prefix is emptied, no name_prefix at all; every state is reached through a query not requested before.
  fails_when: picking the all-types option sends node_type=all or node_type= or any other value, or emptying the prefix sends name_prefix=.
  demonstrates: rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
- file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
  name: the entity listing while it is fetched, when it fails and when it holds no node stands the loading indication Carregando nós… in place of the list while the listing is being fetched
  proves: 'Criterion "While the listing is being fetched, a loading indication stands in place of the list." and UNDERDETERMINED entry 2, loading part: the only status indication reads exactly "Carregando nós…", no node is listed, no alert and no no-node statement is shown.'
  fails_when: the loading indication has another text (for example Carregando...), is missing, or is shown beside a list, an alert or the no-node statement.
- file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
  name: the entity listing while it is fetched, when it fails and when it holds no node shows in place of the list the alert Não foi possível carregar os nós. Tente novamente. with the action Tentar novamente, carrying no code or message of the failure
  proves: 'Criterion "A listing that fails shows an alert saying the nodes could not be loaded." and UNDERDETERMINED entry 2: the alert reads exactly "Não foi possível carregar os nós. Tente novamente." (read without its button) though the 500 refusal carries a distinctive code and message, its single action reads "Tentar novamente", and no list and no loading indication remain.'
  fails_when: the alert shows the failure's message or code, reads any other sentence, labels its action Recarregar or anything but "Tentar novamente", is absent, or stands beside a list or a loading indication.
- file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
  name: the entity listing while it is fetched, when it fails and when it holds no node fetches the listing again when the action of the failed-listing alert is used
  proves: Criterion "The failed-listing alert offers an action that fetches the listing again." The first listing request fails, the action is used, and the recorded requests are two listing requests with the same query.
  fails_when: using the action sends no further listing request, sends one with another narrowing, or refetches only the node types.
- file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
  name: the entity listing while it is fetched, when it fails and when it holds no node states Nenhum nó encontrado. when the listing holds no node
  proves: 'Criterion "A listing that holds no node states that no node was found." and UNDERDETERMINED entry 2, no-node part: an answer with no item makes the page read exactly "Nenhum nó encontrado.".'
  fails_when: an empty answer shows nothing, a loading indication, an alert, or another sentence such as Sem resultados.
- file: src/features/entities/components/__tests__/EntityListPage.states.spec.tsx
  name: the entity listing while the node types are pending or after they failed keeps offering the name prefix and the node listing with no node-type narrowing, stands a loading indication and then the could-not-load-types alert in place of the type choice, and fetches the types again on the alert's action
  proves: 'UNDERDETERMINED entry 1 and the node''s fact. Two pages are observed, one whose node-type listing never answers and one whose first node-type listing fails with a distinctive code and message: in both the name prefix field is offered, the node listing is shown, typing a prefix narrows it with a request carrying name_prefix and no node_type, and no type choice is shown; the pending page shows a status indication, the failed page shows the single alert reading exactly "Não foi possível carregar os tipos de nó. Tente novamente."; using the alert''s action makes the node-type requests two.'
  fails_when: the page shows as loading, or hides the prefix field or the node listing, until the types arrive; the types failure is shown as a generic error that hides the prefix field; the types alert carries the failure's code or message or another sentence; no loading indication stands in place of the type choice while pending; or the alert's action does not request the node types again.
  demonstrates: rules/entity-workspace/the-node-listing-stands-without-the-node-types
- file: src/router/__tests__/routes.entity-list.dom.spec.tsx
  name: /entities route redirects a visit without a session to /sign-in instead of showing the listing
  proves: Criterion "/entities renders inside the protected layout." (the guard of that layout runs on this address).
  fails_when: the /entities route is declared outside the protected layout, so a visit without a session stays at /entities.
- file: src/router/__tests__/routes.entity-list.dom.spec.tsx
  name: /entities route renders the listing in the workspace of the application shell for a visit with a session
  proves: Criterion "/entities renders inside the protected layout." (the page sits in the shell's workspace region); it also shows the lazy page is reached when the address is opened, which keeps the two not-fetched tests from passing against a mock that never intercepts.
  fails_when: the listing renders outside the shell's workspace, or never renders for an authenticated visit.
- file: src/router/__tests__/routes.entity-list.dom.spec.tsx
  name: /entities route does not fetch the listing page's code with the initial load of the application
  proves: 'Criterion "The /entities page is loaded lazily." and UNDERDETERMINED entry 3: opening another address fetches no code of the listing page.'
  fails_when: the listing page module is imported statically by the route graph, or fetched after the initial load of another address (a prefetch on idle).
- file: src/router/__tests__/routes.entity-list.dom.spec.tsx
  name: /entities route does not fetch the listing page's code when its address is preloaded
  proves: 'UNDERDETERMINED entry 3: a chunk preloaded on hover must not fetch the page''s code; hover (intent) preloading calls router.preloadRoute, which is what the test calls with a session.'
  fails_when: preloading the address fetches the listing page's code, as when the route component carries a preload hook such as lazyRouteComponent.
- file: src/router/__tests__/routes.entity-list.dom.spec.tsx
  name: the entity workspace's two addresses fetch the code of each page only when its address is first opened, never with the initial load or a preload, and open the listing at /entities and the form at /entities/{identity}
  proves: 'The node''s fact over both its halves in one trajectory: after the initial load of /graph neither page''s code is fetched; after preloading both addresses neither is; opening /entities fetches the listing page''s code once, shows the listing at /entities and does not fetch the form page''s code; opening /entities/n-1 then fetches the form page''s code and shows the form there.'
  fails_when: either page's code is fetched with the initial load, by a preload, or by opening the other address, either address does not show its page, or a page is fetched more than once.
  demonstrates: rules/entity-workspace/the-screen-lives-at-the-entities-addresses
files:
- path: src/features/entities/components/__tests__/list-support.tsx
  effect: 'shared helper for the two listing specs: it signs in, stubs the global fetch with a responder that answers /api/v1/nodes through a function of the request URL and the attempt and /api/v1/node-types through a function of the attempt (any other request never answering), mounts the real route tree at /entities in a memory router under a QueryClientProvider, and offers listing and type fixtures (type identities distinct from names), a responder keyed by the prefix and type a request carries, and helpers to type a prefix, open and pick from the ui-kit Select through role combobox and option, read the listed names, the loading statuses and the alerts, count and read the recorded requests, and unmount.'
- path: src/router/__tests__/route-support.tsx
  effect: 'shared helper for the /entities route spec: installs the stubs the route tests share (a never-answering fetch, mocks of sonner and the environment, fresh module registry), removes them, builds the app for an address with or without a session, and shows and settles it; the existing routes.entity.dom.spec.tsx was not touched.'
not_applicable:
- edge_case: a name prefix with characters that need URL encoding, or a prefix of only spaces
  why: the encoding of the query belongs to the listing-reads hook and its tests, and no node or criterion states trimming or what a prefix of spaces is; the implementation recorded sending it as typed, an inference not pinned.
- edge_case: typing several characters in quick succession
  why: no node or criterion states a debounce or a request per character; each test changes the field once.
- edge_case: a listing larger than the knowledge base's default limit
  why: no node states how the listing pages (the task's Notes), so there is no obligation to test.
- edge_case: a node-type listing that answers with no type
  why: no node or criterion states what the type choice shows then, and the empty case of the listing is a node listing's.
- edge_case: both the node listing and the node-type listing failing at once
  why: each alert is decided by its own query and each is tested alone; no node states their combination.
- edge_case: using either retry action twice, or changing the narrowing while a read is pending
  why: no node or criterion states repeated or concurrent behavior; the hooks' caching by narrowing belongs to the listing-reads task.
- edge_case: a node whose status is merged or needs-review, or one whose identity needs URL encoding
  why: no node maps statuses to different rows or a different address, and the identity's encoding in the address is the router's.
- edge_case: a 401 during the reads
  why: the request helper owns the silent refresh and the redirect, and no criterion or node of this task states what the listing shows for it.
- edge_case: a slow read
  why: the loading indication is the behavior owed for it, and the request timeout belongs to the request helper.
untested:
- 'contracts/entity-workspace/entity-screen: it spans show-entity-list, show-entity-form, show-review and save-edit, of which this task owns only show-entity-list; its accepted answer and three refusals are tested above but not claimed, since no test of this task decides the whole contract.'
- 'contracts/entity-workspace/bff-entity-reads: the fact spans four operations; the request forms and failure shapes of the two reads this page uses are decided by the listing-reads hook tests, the page tests only observe that the screen shows its fixed-text alerts, and read-node and list-attribute-keys belong to the entity-page task.'
- 'rules/application-shell/every-other-address-is-guarded: its fact is a totality over every declared address of the application, a set this task does not own; the /entities address is exercised by the guard and shell tests, but a test over all routes would claim more than the criteria establish.'
- 'rules/entity-workspace/the-listing-and-page-states-read-their-wording: its fact covers the listing and the page, of which the listing texts are tested above under the entries and criteria but not claimed whole; the page clauses belong to the entity-page and undo-window tasks.'
- 'Inference, not pinned: the texts no node fixes ("Carregando tipos de nó…", "Todos os tipos", "Tipo de nó", "Prefixo do nome", the h1 and region label "Nós de conhecimento" and the types alert''s action label); the tests find the field, the choice and the any-type option by role and structure and read the types alert''s action without checking its label.'
- 'Inference, not pinned: the any-type option is the first option with the empty value; the tests assert only that exactly one option beyond the listed types is offered and that choosing it leaves node_type out of the request.'
- 'Inference, not pinned: the name prefix is sent as typed, with no debounce and no trim.'
- 'Inference, not pinned: the narrowings are page state and not URL search params, the list is a list of Links and not a TanStack table, and the status is the knowledge base''s raw string.'
- 'Inference, not pinned: a changed narrowing or a retry returns the listing to the loading indication; the tests assert the loading indication only for the first fetch.'
- 'Inference, not pinned: the no-node statement is a plain paragraph and not the ui-kit Empty, with no status role; the test asserts the text only.'
- 'Not tested: the global QueryCache onError (routeError) may show a toast beside the in-page alerts; the tests mount their own QueryClient without that router, mock sonner, and assert nothing about toasts either way.'
- 'Not tested: no paging control and no total are shown past the knowledge base''s default limit (the implementation''s deferred note); no node decides it.'
- 'Not tested: the Suspense fallback of the /entities route while the page''s chunk is fetched reads "Carregando nós…" like the listing''s own indication; no criterion or entry names it.'
- 'Not tested: the vendored ui-kit Select gives its combobox trigger no accessible name derived from a label (the implementation''s deferred note), so the tests reach the choice through role combobox and option and no test asserts that the choice is labelled.'
- 'Mechanism not tested: route-level preload false and Link preload false; the preload tests decide the behavior through router.preloadRoute whatever the mechanism.'
- src/router/__tests__/routes.spec.tsx test TC-01 still lists the earlier route ids and was left untouched; the new route's presence is decided by the new route spec.
---
## What it is
This record proves task/entity-listing/entity-list-screen.
It holds three spec files and two shared helpers that stub the global fetch and mount the real route tree.

## Notes
The suite passed on its first run, run/entity-listing-entity-list-screen-suite.
