---
title: Leave disputed attributes to curation
summary: A change naming a disputed attribute and changing it is refused as disputed.
rationale: Planning cut the dispute refusal into its own task. It answers a rule about disputes being settled through curation, separate from the stale-form conflicts, and it carries its own code.
sources:
- intake/scope.md
objective: A change that would alter a disputed attribute is refused with BUSINESS_ENTITY_EDIT_DISPUTED.
criteria:
- A set change naming an attribute whose status is disputed and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
- A set change naming an attribute whose status is disputed and stating a value that differs from that attribute's own only in letter case is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
- A set change naming an attribute whose status is disputed and stating, character for character, that attribute's own value is not refused by the dispute rule.
- A remove change naming an attribute whose status is disputed is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
- A disputed refusal names the attribute key.
- A disputed refusal names the item.
- A change naming an active attribute is not refused by the dispute rule.
depends_on:
- task/entity-edit-backend/edit-refusal-codes
implements:
- rules/knowledge-base/entity-edit-leaves-disputes-to-curation
- contracts/knowledge-base/entity-editing
- rules/knowledge-base/entity-edit-unchanged-records-nothing
- rules/knowledge-base/entity-edit-change-check-order
- rules/knowledge-base/entity-edit-check-order
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-change-kind
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
- domain/knowledge-base/live-assertion-status
---
## What it is
A change naming a disputed attribute and changing it is refused as disputed.

## Notes
UNDERDETERMINED, from the specification — Criterion 7 only says that a change naming an active attribute is not refused by the dispute rule. No criterion covers an uncertain attribute, which is also live but not disputed. rules/knowledge-base/entity-edit-leaves-disputes-to-curation refuses a change only when the attribute's status is disputed. Implementation that meets every criterion and that the specification refuses: An implementation that refuses with BUSINESS_ENTITY_EDIT_DISPUTED any change naming an attribute whose status is not active, so uncertain as well as disputed, meets every criterion. The specification refuses it because uncertain is not disputed.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — Criteria 1, 2, 4, 5 and 6 give the error code and the fields the refusal names, but not its transport status. contracts/knowledge-base/entity-editing answers rules/knowledge-base/entity-edit-leaves-disputes-to-curation with 'error code BUSINESS_ENTITY_EDIT_DISPUTED naming the attribute key and the item, HTTP 409 over REST'. Implementation that meets every criterion and that the specification refuses: An implementation that answers BUSINESS_ENTITY_EDIT_DISPUTED with the attribute key and the item but with HTTP 422 over REST meets every criterion. The contract refuses it because it requires HTTP 409.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — Criterion 3 only says that a set change stating a disputed attribute's own value, character for character, is not refused by the dispute rule. It does not say what happens to that change instead. rules/knowledge-base/entity-edit-unchanged-records-nothing reports it with the effect unchanged and records nothing, because disputed is a live status. rules/knowledge-base/entity-edit-leaves-disputes-to-curation forbids changing the attribute at all. Implementation that meets every criterion and that the specification refuses: An implementation that does not refuse a set change stating the disputed attribute's own value meets every criterion, even if it then records a new active attribute that supersedes the disputed one (effect succession or correction). The specification refuses this through both rules/knowledge-base/entity-edit-leaves-disputes-to-curation and rules/knowledge-base/entity-edit-unchanged-records-nothing.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — Criteria 1, 2 and 4 put the disputed change in an edit whose earlier changes pass their checks. No criterion says that a refused edit leaves nothing written. constraints/entity-edit-is-atomic requires this but is not among the nodes I named, so the caller must decide whether this task or another one owns it. Implementation that meets every criterion and that the specification refuses: An implementation that writes the earlier, valid changes of the edit and then answers BUSINESS_ENTITY_EDIT_DISPUTED for the later disputed change meets every criterion. constraints/entity-edit-is-atomic refuses it, because an entity edit's attributes, provenance and curation action take effect together or not at all.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/entity-edit-unchanged-records-nothing is named only for the boundary it draws: a character-for-character comparison decides whether a set change changes a live (and so a disputed) attribute. Its other clauses reach no criterion of this task. These are the effect unchanged with nothing recorded for an active or uncertain attribute, and the case of a set change naming no attribute on a key that allows multiple current values. Belongs to: The task that delivers the unchanged effect of an entity edit.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/entity-edit-change-check-order and rules/knowledge-base/entity-edit-check-order are named only for where the dispute check sits: after the change's form, attribute key, value, allowed values and validity checks, and after the request, knowledge node and earlier changes. Their clauses ordering the other checks against each other reach no criterion of this task. Belongs to: The tasks that deliver the other entity-edit refusals: validation format, RESOURCE_NOT_FOUND, BUSINESS_NODE_NOT_ACTIVE, BUSINESS_UNKNOWN_ATTRIBUTE_KEY, BUSINESS_INVALID_ATTRIBUTE_VALUE, BUSINESS_TEMPORAL_INCOHERENT and BUSINESS_ENTITY_EDIT_CONFLICT.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Several rules that record a change's effect put no status condition on the attribute named, so their wording also covers a disputed attribute. rules/knowledge-base/entity-edit-succession and rules/knowledge-base/entity-edit-correction say 'names a current attribute'. rules/knowledge-base/entity-edit-ended-attribute-correction says 'names an attribute with a live status ... whatever its key'. rules/knowledge-base/entity-edit-removal says 'rejects the attribute it names'. Read literally, each would record a change that rules/knowledge-base/entity-edit-leaves-disputes-to-curation refuses. The specification settles which wins: the dispute rule's log says the edit is refused because superseding one side would settle the dispute, and contracts/knowledge-base/entity-editing lists the refusal. By contrast, rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time limits itself to 'active or uncertain' and hands disputed to the dispute rule in its description, while these four rules do not. Adding the same status limit to them would make the rules disjoint, as the rest of the entity-edit rules are.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — contracts/knowledge-base/entity-editing answers BUSINESS_ENTITY_EDIT_CONFLICT when 'Another operation changed an attribute the edit names first'. No node says which refusal answers when that other operation is what made the named attribute disputed. The criteria do not mention concurrency. In that race, criterion 1 reads as requiring BUSINESS_ENTITY_EDIT_DISPUTED, and the contract's conflict entry reads as requiring BUSINESS_ENTITY_EDIT_CONFLICT.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
