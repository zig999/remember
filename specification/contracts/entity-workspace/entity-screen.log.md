---
entries:
- field: type
  unstated: The material names no such thing.
  decided: api
  why: The material describes a screen, which the other workspaces state as a published api whose answers are what the owner sees.
- field: answers
  unstated: No node and no intake material states what the entity edit screen shows when a field holds a value that does not read as its key's value type, where it shows it, or whether the review is still offered while that value stands.
  decided: Under show-review, a refusal on rules/entity-workspace/a-field-accepts-only-its-value-type answering "a message on that field naming the value type it expects, and no review is offered while the value stands".
  why: A value the knowledge base would refuse for its kind cannot be reviewed as an edit, so the owner is held at the offending field, told the type it expects, before any review is shown.
- field: answers
  unstated: No node and no intake material gives the text of the message the entity screen shows on the validity end field when rules/entity-workspace/validity-start-precedes-the-end refuses a validity start that is not strictly earlier than the end. Whether the message is raised when only the end is given is already held by that rule's statement, which applies only when the owner gives both a start and an end.
  decided: Under show-review, the refusal on rules/entity-workspace/validity-start-precedes-the-end answers 'the message "O início deve ser anterior ao fim." on the validity end field and no save'.
  why: The curation screen already shows the owner "O início deve ser anterior ao fim." on the end field for the same condition, a start not strictly earlier than the end, so the owner reads the same words for the same refusal in both workspaces.
---
