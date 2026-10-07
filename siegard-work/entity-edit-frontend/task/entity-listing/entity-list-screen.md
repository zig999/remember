---
title: Entity listing at /entities
summary: The lazily loaded page under the protected layout that lists knowledge nodes, narrows them by name prefix and node type, and opens the one picked.
rationale: The listing's one rule and its one contract answer make one outcome, so I cut them as one task over the listing reads.
sources:
- intake/scope.md
objective: At /entities the owner sees the nodes the knowledge base lists, narrowed by name prefix and node type, and opens the one they pick.
criteria:
- /entities renders inside the protected layout.
- The /entities page is loaded lazily.
- Each listed node shows its name.
- Each listed node shows its node type.
- Each listed node shows its status.
- A name prefix the owner types narrows the listing to the nodes the knowledge base lists for that prefix.
- A node type the owner picks narrows the listing to the nodes the knowledge base lists for that type.
- The node types offered are those the knowledge base lists.
- Picking a node opens /entities/{that node's identity}.
- While the listing is being fetched, a loading indication stands in place of the list.
- A listing that fails shows an alert saying the nodes could not be loaded.
- The failed-listing alert offers an action that fetches the listing again.
- A listing that holds no node states that no node was found.
depends_on:
- task/knowledge-base-client/listing-reads
implements:
- rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type
- contracts/entity-workspace/entity-screen
- rules/entity-workspace/the-screen-lives-at-the-entities-addresses
- contracts/entity-workspace/bff-entity-reads
- rules/application-shell/every-other-address-is-guarded
- rules/entity-workspace/the-node-listing-stands-without-the-node-types
- rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
- rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
- rules/entity-workspace/the-listing-and-page-states-read-their-wording
---
## What it is
The listing half of the entity screen, from the owner's narrowing to the node they open.

## Notes
The scope decided that no header menu entry and no graph-panel button link to this page.
It follows the protected-layout lazy-plus-Suspense route pattern in src/router/routes.tsx, which src/router/__tests__/routes.spec.tsx asserts.
No node states how the listing pages past the knowledge base's default limit.
UNDERDETERMINED, from the specification — No criterion reaches the rule that the screen keeps offering the name prefix and the node listing while the node-type listing is pending or failed, with a loading indication in place of the type choice and the alert "Não foi possível carregar os tipos de nó. Tente novamente." with an action that fetches the types again. Passes: a screen that shows the whole page as loading until the types arrive, or hides the prefix field behind a generic error when the types fail.
UNDERDETERMINED, from the specification — No criterion fixes the wording the wording rule gives the listing: "Carregando nós…", "Não foi possível carregar os nós. Tente novamente.", "Tentar novamente" and "Nenhum nó encontrado.", with no code or message of the failure's own. Passes: a listing that shows Carregando..., an alert with the failure's message and a Recarregar button, and Sem resultados.
UNDERDETERMINED, from the specification — The criterion that the page is loaded lazily is weaker than the rule, which fetches the code only when the address is first opened. Passes: a chunk preloaded on hover or on idle after start-up.
UNDERDETERMINED, from the specification — No criterion covers leaving out a node type the owner has not given, so an any-type option that hands a sentinel value to the request would send node_type=all. Passes: a type choice whose all-types option sends a sentinel such as all as node_type.
REMAINDER, from the specification — The clauses of the narrowing rules that fix the parameter names and the empty case belong to the listing-reads task.
REMAINDER, from the specification — The page clauses of the wording rule and the recorded-edit notice belong to the entity-page and undo-window tasks.
REMAINDER, from the specification — The clause of the addresses rule that places the form at /entities/{node identity} belongs to the entity-page task.
REMAINDER, from the specification — The guarded-layout rule is answered here only for /entities, and the other addresses belong to the application shell and the entity-page task.
ADVISORY, from the specification — Only list-node-types, list-nodes and show-entity-list govern this task, and the other operations belong to the form and review tasks.
