---
title: Entity page at /entities/$nodeId
summary: The lazily loaded page under the protected layout that shows the node in the address with its loading and failure states, and offers the form only for an active node.
rationale: I cut the page from the field groups because what the page shows around the form (its header, states and the non-active case) changes for different reasons than how the form is drawn from the catalog.
sources:
- intake/scope.md
objective: At /entities/{node} the owner sees the node identified in the address with its name, type and status, a form only if the node is active, or the reason the node cannot be shown.
criteria:
- /entities/{node identity} renders inside the protected layout.
- The /entities/{node identity} page is loaded lazily.
- The page shows the node's name.
- The page shows the node's node type.
- The page shows the node's status.
- While the node or the catalog is being fetched, a loading indication stands in place of the form.
- An identity at which no knowledge node is held shows an alert saying the node was not found.
- A node the knowledge base refuses as deleted shows the deleted-node alert reading "Este nó foi apagado.".
- A node the knowledge base refuses as deleted shows no form.
- The deleted-node alert carries no code or message of the failure's own.
- The deleted-node alert offers no action to try again.
- A node or catalog that fails to load for any cause other than no node being held at the identity or the node being refused as deleted shows an alert saying the form could not be loaded.
- The could-not-be-loaded alert offers an action that loads the node and the catalog again.
- A node whose status is not active and that the knowledge base still delivers shows its attributes.
- A node whose status is not active shows no form.
- A node whose status is not active shows no field.
- A node whose status is active is offered the form.
depends_on:
- task/knowledge-base-client/node-and-catalog-reads
implements:
- contracts/entity-workspace/entity-screen
- domain/entity-workspace/entity-edit-session
- rules/entity-workspace/the-screen-lives-at-the-entities-addresses
- rules/application-shell/every-other-address-is-guarded
- rules/entity-workspace/the-form-is-offered-only-for-an-active-node
- rules/entity-workspace/a-deleted-node-shows-its-own-alert
- rules/entity-workspace/the-listing-and-page-states-read-their-wording
- contracts/entity-workspace/bff-entity-reads
---
## What it is
The frame of the entity form: which node is shown, the states around it, and whether a form is offered at all.

## Notes
No node states whether a node the knowledge base refuses as deleted (410 BUSINESS_NODE_DELETED) counts as not found or as failing for any other cause.
The inventory flags that the curation page imports GlassSurface, which the owner is removing app-wide.
UNDERDETERMINED, from the specification — No criterion holds the page to the wording the wording rule fixes: "Nó não encontrado.", "Não foi possível carregar o formulário. Tente novamente." with the action "Tentar novamente", and the loading indication "Carregando formulário…". Passes: a page whose not-found alert reads Node not found, whose could-not-load alert reads Erro ao carregar and whose loading indication is a spinner with no text.
UNDERDETERMINED, from the specification — Only the deleted-node alert is held to carrying no code or message of the failure's own, while the rule covers the not-found and could-not-load-form alerts too. Passes: a could-not-load-form alert that also shows the failure's code and message.
UNDERDETERMINED, from the specification — The criterion that the page is loaded lazily is weaker than the rule, which fetches the code only when the address is first opened. Passes: a chunk preloaded on hover or prefetched after the initial load.
UNDERDETERMINED, from the specification — The criteria say only that the page shows the node's name, type and status, while the screen's answer places them above the groups of fields. Passes: a page that shows them below the form's fields.
REMAINDER, from the specification — The listing clause of the addresses rule and of the wording rule, and the recorded-edit notice, belong to the listing and save tasks.
ADVISORY, from the specification — contracts/entity-workspace/entity-screen does not list the deleted-node rule among the refusals of show-entity-form, so its any-other-cause refusal literally reaches a deleted node, and the contract should be made to read the same way as the rule.
ADVISORY, from the specification — The codes that tell not held, 404 RESOURCE_NOT_FOUND, from deleted, 410 BUSINESS_NODE_DELETED, are stated in contracts/knowledge-base/retrieval and rules/knowledge-base/deleted-node-read-refused, outside the candidates.
ADVISORY, from the specification — The application shell's failure router may also show the server's message beside the page's own alerts, and no node states whether the page's states take the place of the router for these reads.
Decision, beyond the covers — stand: contracts/knowledge-base/retrieval is not claimed by the epic, because its answers for the node read are the upstream of bff-entity-reads, which this task already consumes, and no task of this epic implements it.
Decision, beyond the covers — stand: rules/knowledge-base/deleted-node-read-refused is not claimed by the epic, because the deleted-node refusal is stated again in rules/entity-workspace/a-deleted-node-shows-its-own-alert, which this task implements, and the backend delivers the refusal itself.
