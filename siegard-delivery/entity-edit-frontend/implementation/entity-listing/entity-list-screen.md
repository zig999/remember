---
target: frontend
title: Entity listing at /entities
summary: Adds the lazily loaded EntityListPage under the protected layout, which lists nodes with name, type and status, narrows them by name prefix and node type, and opens the picked node at /entities/{id}.
task: sha256:d10b3072cee46e348662d5c2e77493ac1998794d9d04045eb6b38f818bcadedc
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-listing-entity-list-screen-build
files:
- path: src/features/entities/components/EntityListPage.tsx
  effect: 'new: the page keeps the prefix and node-type narrowings in local state and reads the listing through useNodeListing({namePrefix, nodeType}) and the types through useNodeTypes; the prefix field and the node listing are always rendered; the node-type slot shows a loading indication while the types are pending, the could-not-load-types alert with a refetch action once they failed, and the type choice once they are held; the results area shows loading, the could-not-load-nodes alert with a refetch action, the no-node statement, or the node list.'
- path: src/features/entities/components/entity-list-parts.tsx
  effect: 'new: presentational parts: ListLoading ("Carregando nós…", role status, polite), ListErrorAlert and TypesErrorAlert (a destructive Alert with role alert and a "Tentar novamente" button, fixed text and no failure code or message), ListEmpty ("Nenhum nó encontrado."), TypesLoading, TypeChoice (a labelled group around the ui-kit Select whose first option "Todos os tipos" has the empty value and the rest are node type names) and NodeList (one router Link per node, preload off, to /entities/$nodeId, followed by the node type and status).'
- path: src/router/routes.tsx
  effect: adds a lazy import of EntityListPage and a new entityListRoute at /entities, a child of protectedLayoutRoute with preload false, rendering the page inside Suspense with a role status, aria-live polite fallback "Carregando nós…"; it is registered in the route tree before entityRoute, and the page chunk is fetched only when the address is first opened.
criteria:
- criterion: /entities renders inside the protected layout.
  met: true
  how: 'entityListRoute in src/router/routes.tsx has getParentRoute: () => protectedLayoutRoute and is listed in protectedLayoutRoute.addChildren, so the application shell layout and its beforeLoad guard apply.'
- criterion: The /entities page is loaded lazily.
  met: true
  how: 'EntityListPage is imported through lazy(() => import(...)) in src/router/routes.tsx and rendered inside Suspense; the route sets preload: false and the node Links set preload={false}; nothing imports the page statically.'
- criterion: Each listed node shows its name.
  met: true
  how: NodeList in entity-list-parts.tsx renders node.canonicalName as the text of the Link.
- criterion: Each listed node shows its node type.
  met: true
  how: NodeList renders node.nodeType in a dd under a screen-reader dt "Tipo" (testid entity-list-item-type).
- criterion: Each listed node shows its status.
  met: true
  how: NodeList renders node.status in a dd under a screen-reader dt "Status" (testid entity-list-item-status), the same way NodeHeader does.
- criterion: A name prefix the owner types narrows the listing to the nodes the knowledge base lists for that prefix.
  met: true
  how: The labelled Input "Prefixo do nome" sets the namePrefix state, which is passed to useNodeListing({namePrefix, nodeType}); that hook sends name_prefix and leaves it out when empty, and the listing shown is the answer for that query key.
- criterion: A node type the owner picks narrows the listing to the nodes the knowledge base lists for that type.
  met: true
  how: TypeChoice onChange sets the nodeType state, which is passed to useNodeListing; the option value is the node type's name, which the hook sends as node_type, and the all-types option has value empty, so the hook leaves node_type out and no sentinel is sent.
- criterion: The node types offered are those the knowledge base lists.
  met: true
  how: TypeChoice builds one option per item of useNodeTypes().data after the all-types option.
- criterion: Picking a node opens /entities/{that node's identity}.
  met: true
  how: 'Each node name is a typed router Link with to=''/entities/$nodeId'' and params={{ nodeId: node.id }}.'
- criterion: While the listing is being fetched, a loading indication stands in place of the list.
  met: true
  how: EntityListPage renders ListLoading ("Carregando nós…", role status, aria-live polite) while listing.isPending instead of the list, which includes a changed narrowing (each narrowing has its own query key) and a retry after a failure (a query with no data returns to pending).
- criterion: A listing that fails shows an alert saying the nodes could not be loaded.
  met: true
  how: When listing.isError, ListErrorAlert renders an Alert with role alert reading "Não foi possível carregar os nós. Tente novamente." and no code or message of the failure.
- criterion: The failed-listing alert offers an action that fetches the listing again.
  met: true
  how: ListErrorAlert has a "Tentar novamente" Button and EntityListPage wires its onRetry to listing.refetch().
- criterion: A listing that holds no node states that no node was found.
  met: true
  how: When the listing succeeds with items.length === 0, ListEmpty renders "Nenhum nó encontrado.".
nodes:
- node: rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/entity-list-parts.tsx
  how: The page lists the nodes the knowledge base returns, narrows them by a name-prefix field and a node-type choice built from the listed types, and opens the picked node through a Link.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/entity-list-parts.tsx
  how: 'Only show-entity-list is encoded: the accepted answer (name, type, status, narrowed by prefix and type) and its three refusals (loading indication, alert with the try-again action, no-node statement); show-entity-form, show-review and save-edit belong to other tasks and were not reached.'
- node: rules/entity-workspace/the-screen-lives-at-the-entities-addresses
  encoded_at:
  - src/router/routes.tsx
  how: entityListRoute at /entities is a lazy page with preload false, so its code is fetched when the address is first opened and not in the initial load; the /entities/{node identity} half was delivered with entityRoute by the entity-page task.
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  how: The page consumes list-node-types and list-nodes only through useNodeTypes and useNodeListing, makes no request of its own and shows no failure's status, code or message; the failure state is the fixed-text alerts.
- node: rules/application-shell/every-other-address-is-guarded
  encoded_at:
  - src/router/routes.tsx
  how: The /entities route is a child of protectedLayoutRoute, so it sits under the guarded layout that shows the application shell.
- node: rules/entity-workspace/the-node-listing-stands-without-the-node-types
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/entity-list-parts.tsx
  how: 'The prefix field and the node listing do not depend on the types query: while the types are pending TypesLoading takes the place of the type choice; when they failed TypesErrorAlert reads "Não foi possível carregar os tipos de nó. Tente novamente." with a button that calls types.refetch(); without types the node type stays empty, so the listing carries no node-type narrowing.'
- node: rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
  encoded_at:
  - src/features/entities/components/EntityListPage.tsx
  - src/features/entities/components/entity-list-parts.tsx
  how: The page hands useNodeListing the typed prefix and the picked node type's name (option value = type.name, never the id); the parameter names name_prefix and node_type and the omission of ungiven narrowings are done by the listing-reads hook.
- node: rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
  encoded_at:
  - src/features/entities/components/entity-list-parts.tsx
  how: The all-types option is the empty string, which the listing-reads hook treats as not given, so no node_type is sent; the empty prefix is the field's initial value, treated the same way.
- node: rules/entity-workspace/the-listing-and-page-states-read-their-wording
  encoded_at:
  - src/features/entities/components/entity-list-parts.tsx
  how: 'The listing''s four texts are written as the node fixes them: "Carregando nós…", "Não foi possível carregar os nós. Tente novamente.", "Tentar novamente" and "Nenhum nó encontrado."; the alerts carry no failure code or message; the page clauses (form, not-found, recorded-edit) belong to other tasks.'
inferences:
- inferred: The name prefix is sent as typed on every change, with no debounce and no trimming; a prefix of spaces is a non-empty narrowing and is sent.
  from: No node states a debounce or a trim, and an-empty-narrowing-is-a-narrowing-not-given speaks only of an empty value.
- inferred: The texts that no node fixes are "Carregando tipos de nó…" (loading in place of the type choice), "Tentar novamente" as the types alert's action label, "Todos os tipos" (the all-types option), "Tipo de nó" and "Prefixo do nome" (field labels), and the h1 and region label "Nós de conhecimento".
  from: the-node-listing-stands-without-the-node-types fixes the types alert text but not the action label, the loading text or the labels; the wording rule's try-again label for the listing is reused for the types alert for consistency.
- inferred: The all-types option has the empty value and is the first option, selected when no type was picked.
  from: The listing-reads hook already treats the empty string as not given (buildListingQs) and an-empty-narrowing-is-a-narrowing-not-given makes an empty node type a narrowing not given.
- inferred: The node-type choice uses the ui-kit Select, labelled by a Label with an id inside a role=group wrapper (aria-labelledby), not by htmlFor.
  from: The ui-kit Select spreads its rest props on a container div and not on the combobox button; the project's other uses (IngestPanel, ThemeSelect) use the same component; the trigger's own name stays the selected option's text.
- inferred: The listing is a list of Links and not a TanStack Table, so its narrowings are page state and not URL search params.
  from: TBL-01 applies to a table, and no node asks for a table or for the narrowing to survive in the address.
- inferred: The status is shown as the knowledge base's raw status string, as NodeHeader does, and the list shows only the items the knowledge base returns by default, with no total and no paging control.
  from: No node maps statuses to labels or states how the listing pages past the default limit (task Notes); NodeHeader is the precedent in the same feature.
- inferred: The global QueryCache onError (routeError) may show a toast beside the in-page alerts when a listing or types read fails; the page does not suppress it and no global handler was modified.
  from: 'Same position as the previous entity-page task: src/lib/query-client.ts and src/lib/error-routing.ts are fixed constraints for this delivery.'
- inferred: The no-node statement is a plain paragraph inside an aria-live polite results region; it does not use the ui-kit Empty and has no role status.
  from: Empty renders its title in uppercase through CSS, which would show the fixed text differently from how it is written; role status is kept for the loading indications only.
- inferred: The loading indication, the failure alert and the empty statement are decided by the listing query's own state (isPending, then isError, then item count), and a retry from an alert returns that query to the loading indication.
  from: TanStack Query v5 sets a query with no data back to pending when refetched; the listing-reads hooks add no placeholderData or keepPreviousData, so a changed narrowing also shows the loading indication in place of the list.
divergences:
- from: src/features/curation/components/curation-page-parts.tsx (EmptyQueue, the empty-state convention using the ui-kit Empty)
  departure: The empty listing statement is a plain paragraph and not an Empty component.
  why: Empty's title is rendered in uppercase by CSS, and the wording rule requires the text exactly as written ("Nenhum nó encontrado.").
preserved:
- The already-delivered /entities/$nodeId route (entityRoute) keeps its path, preload false and "Carregando formulário…" Suspense fallback, and still follows the protected-layout lazy pattern.
- The other protected routes (chat, graph, search, ingest, curation, history, not-found) and the sign-in route are untouched, as is the shape of routeTree around them.
- EntityPage.tsx, entity-page-parts.tsx, entity-page-helpers.ts, EntityForm.tsx and the entities api hooks, keys and types are unchanged.
- src/lib/http.ts, src/lib/query-client.ts, src/lib/error-routing.ts and everything under backend/ are untouched.
- No header menu entry and no button in the graph detail panel were added.
deferred:
- what: No node states how the listing pages past the knowledge base's default limit, so the page shows the first page the knowledge base returns, with no paging control and no total.
  why: Paging is not stated by any node (task Notes) and would be a decision the specification does not hold.
- what: The ui-kit Select does not give its combobox trigger an accessible name from a Label.
  why: The component is vendored (vendor/ui-kit) and outside this task's reach; the page labels the control with a group, and fixing the kit is a change to a shared component.
---
## What it is
This record answers task/entity-listing/entity-list-screen.
It holds the entity listing page, its presentational parts and the /entities route.

## Notes
The build passed on its first run, run/entity-listing-entity-list-screen-build.
