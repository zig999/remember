---
entries:
- field: type
  unstated: 'The specification contradicts itself for a deleted node: rules/entity-workspace/the-form-is-offered-only-for-an-active-node says any other node shows its attributes without a form, while rules/knowledge-base/deleted-node-read-refused makes the node read refuse a deleted node with HTTP 410, so its attributes never reach the screen, and contracts/entity-workspace/entity-screen sends any other load failure to an alert that the form could not be loaded.'
  decided: A deleted node shows its own alert, "Este nó foi apagado.", in place of the form with no action to try again, and the active-node rule is narrowed to the nodes the knowledge base still delivers.
  why: The person chose a dedicated deleted-node alert over the generic could-not-be-loaded alert, with no retry because a deleted node does not come back. The wording follows the application's short fixed sentences, and was chosen by the planner, not by the person.
---
