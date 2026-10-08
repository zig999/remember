---
title: Record a removal
summary: A remove change rejects the attribute it names, marking it deleted and stamping its supersession time, and touches no other attribute.
rationale: Planning cut removal into its own task. It records no new attribute and changes with the rejection rule alone.
sources:
- intake/scope.md
objective: A removal of an edit leaves the named attribute deleted with its supersession time stamped and every other attribute of the node as it was.
criteria:
- The named attribute's status becomes deleted.
- The named attribute's supersession time is the moment of the edit.
- Removing one of a person's two active email attributes leaves the other email active.
implements:
- rules/knowledge-base/entity-edit-removal
- scenarios/knowledge-base/emptying-one-email-rejects-only-that-email
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-change-kind
---
## What it is
A remove change rejects the attribute it names, marking it deleted and stamping its supersession time, and touches no other attribute.

## Notes
REMAINDER, from the specification — The last clause of rules/knowledge-base/entity-edit-removal's statement, "with the effect removal", reaches no criterion of this task. The then-line "the change is reported with the effect removal" in scenarios/knowledge-base/emptying-one-email-rejects-only-that-email has the same gap. This task's criteria cover only the stored state of the named attribute and its sibling. Nothing here says the applied change is reported or recorded with the effect removal. Belongs to: The task that reports each applied change's effect. That means the edit-entity accepted answer's `applied` entries in contracts/knowledge-base/entity-editing and the curation action payload in rules/knowledge-base/entity-edit-records-curation-action. Both name domain/knowledge-base/edit-effect and domain/knowledge-base/applied-change, including the removal's `predecessor_id`/`item_id`.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — The objective says every other attribute of the node is left as it was, and scenarios/knowledge-base/emptying-one-email-rejects-only-that-email's Description says "A remove change reaches only the attribute it names". The criteria check only the sibling email's status. So an implementation can change other attributes in ways none of the three criteria detect, and the specification refuses it. Implementation that meets every criterion and that the specification refuses: An implementation that marks the named email deleted and stamps its supersession time with the moment of the edit, and keeps the other email's status active, but also stamps the other email's supersession time or changes attributes of other keys on the same node. It satisfies all three criteria, but it violates "A remove change reaches only the attribute it names", and stamping the sibling stops it from counting as current.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
