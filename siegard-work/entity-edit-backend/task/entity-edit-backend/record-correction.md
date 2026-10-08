---
title: Record a correction
summary: A correction supersedes the attribute it names and records the new attribute naming it as the one it supersedes, carrying its provenance and the edit's fragment.
rationale: Planning cut correction away from succession. A correction keeps the superseded validity and copies its provenance, while a succession does neither, so the two change for different reasons.
sources:
- intake/scope.md
objective: A correction of an edit leaves the named attribute superseded, and a new attribute that names it and holds its provenance.
criteria:
- The named attribute's status becomes superseded.
- The named attribute's supersession time is the moment of the supersession.
- A correction of an attribute that already holds a validity end gives it the moment of the supersession as its supersession time.
- The new attribute names the superseded attribute as the one it supersedes.
- An organization's active cnpj with no validity, corrected to another cnpj, keeps no validity end once superseded.
- In that same edit the new attribute holds the other cnpj.
- The new attribute holds every provenance of the superseded attribute.
- The new attribute holds a provenance pointing at the edit's information fragment.
depends_on:
- task/entity-edit-backend/record-new-attribute
implements:
- rules/knowledge-base/entity-edit-correction
- rules/knowledge-base/entity-edit-ended-attribute-correction
- rules/knowledge-base/entity-edit-supersession-time
- rules/knowledge-base/entity-edit-provenance
- scenarios/knowledge-base/stable-key-edit-is-a-correction
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
---
## What it is
A correction supersedes the attribute it names and records the new attribute naming it as the one it supersedes, carrying its provenance and the edit's fragment.

## Notes
UNDERDETERMINED, from the specification — No criterion says the new attribute is recorded as active. rules/knowledge-base/entity-edit-correction and rules/knowledge-base/entity-edit-ended-attribute-correction both state that a correction 'is recorded as a new active attribute'. rules/knowledge-base/entity-edit-new-attribute-state states 'An entity edit records every new attribute as active at confidence 1.0 under the LLM run it opened'. That rule is not in this task's implements and no criterion here checks the new attribute's status. Implementation that meets every criterion and that the specification refuses: When an attribute with a validity end and status uncertain is corrected, the implementation copies the superseded attribute's status onto the new attribute. The new attribute is recorded as uncertain, not active. Every criterion still holds: the old attribute is superseded and stamped, and the new one names it, holds the value and holds every provenance plus the edit's.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — These criteria never say which set change counts as a correction. They assume a correction has already been decided. That decision is the trigger clause of two rules. rules/knowledge-base/entity-edit-correction: 'names a current attribute of a key that is not temporal and states a value other than its own'. rules/knowledge-base/entity-edit-ended-attribute-correction: 'names an attribute with a live status, a validity end and no supersession time and states a value other than its own … whatever its key'. Their closing clause, 'with the effect correction', is not checked here either. Nor is the third 'then' of scenarios/knowledge-base/stable-key-edit-is-a-correction, 'the change is reported with the effect correction'. Belongs to: The task that sorts each set change of an entity edit into its effect (correction, succession and so on) and reports it in the edit's applied list. That act is the edit-entity answer of contracts/knowledge-base/entity-editing.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/entity-edit-supersession-time also covers the attribute that a succession supersedes. It ends with 'leaves its supersession time unset only when the edit itself gives that attribute a validity end'. No correction ever gives an attribute a validity end, because only rules/knowledge-base/entity-edit-succession-closes-the-previous does that. So this clause reaches no criterion of this task. Belongs to: The task that records an entity edit's succession, together with rules/knowledge-base/entity-edit-succession-closes-the-previous.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Two nodes this task needs are outside the candidates: domain/knowledge-base/provenance and domain/knowledge-base/information-fragment. rules/knowledge-base/entity-edit-provenance constrains both. The new attribute's provenance entries are built from them, and the edit's fragment is one of them. They cannot be named in implements, so either the epic's claim grows to include them or the caller accepts that the executor reads them only through domain/knowledge-base/node-attribute's 'provenance' attribute.
Decision, beyond the covers — stand: domain/knowledge-base/information-fragment, domain/knowledge-base/provenance, specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — rules/knowledge-base/entity-edit-supersession-time stamps 'the moment of the supersession'. rules/knowledge-base/entity-edit-removal stamps 'the moment of the edit', and its log says that is when the edit is saved. No node says whether these are the same instant, or whether either equals the new attribute's recorded_at. A test of the supersession-time criterion can only check against an instant inside the edit's transaction (constraints/entity-edit-is-atomic).
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The Description of rules/knowledge-base/entity-edit-ended-attribute-correction says the new attribute's validity is 'the change's own'. For a temporal key that comes from rules/knowledge-base/entity-edit-start-defaults-to-today. For a key that is not temporal it comes from rules/knowledge-base/stable-key-change-states-no-validity. This task leaves that validity to those neighbours: no criterion here sets it.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
