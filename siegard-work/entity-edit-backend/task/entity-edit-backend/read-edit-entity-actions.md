---
title: Read edit-entity actions on the audit surface
summary: The audit listing reads and filters curation actions of kind edit-entity alongside the other kinds.
rationale: Planning cut the audit read into its own task. The inventory found that the audit's closed action-name enum would refuse or omit the new kind, and that read changes for reasons apart from how the action is written.
sources:
- intake/scope.md
objective: Curation actions of kind edit-entity are listed and filtered by the audit surface.
criteria:
- An audit listing over a store holding a curation action recorded with kind edit_entity returns that action.
- The audit listing's action filter admits edit_entity.
- Filtering the audit listing by edit_entity returns no action of another kind.
- The audit listing's action filter admits each of the eight kinds of curation-action-kind written with each hyphen as an underscore.
implements:
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-action-filter
- rules/knowledge-base/a-curation-action-kind-is-written-with-underscores
- contracts/knowledge-base/compliance-audit
---
## What it is
The audit listing reads and filters curation actions of kind edit-entity alongside the other kinds.

## Notes
UNDERDETERMINED, from the specification — No criterion checks that the list-curation-actions action filter refuses a kind outside its closed set. contracts/knowledge-base/compliance-audit, operation list-curation-actions, refuses 'the action or target kind is outside its closed set' with HTTP 422 VALIDATION_INVALID_FORMAT. rules/knowledge-base/a-curation-action-kind-is-written-with-underscores makes the underscore spelling the only one a listing filters by. So the hyphen spelling edit-entity, and any arbitrary text, must be refused. Implementation that meets every criterion and that the specification refuses: A filter that admits edit_entity and the other seven underscore kinds, and also accepts edit-entity or any other text (answering with an empty or filtered page rather than HTTP 422). It satisfies all four criteria, but the contract refuses it.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — contracts/knowledge-base/compliance-audit, operation read-curation-action, must answer HTTP 200 with the curation action, including its action, for any curation action held. No criterion reads a single curation action of kind edit_entity. A read path that still checks the action against the seven earlier kinds would fail on edit_entity, and nothing in this task would catch it. Implementation that meets every criterion and that the specification refuses: A read-curation-action whose response validation or mapping knows only the seven earlier kinds, so reading an edit_entity action answers an error instead of HTTP 200. The four listing criteria still pass.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — Clause 'wherever a curation action records it' of rules/knowledge-base/a-curation-action-kind-is-written-with-underscores reaches no criterion here. This task only reads and filters. Criterion 1 assumes the action is already stored as edit_entity. Belongs to: The task that records an accepted entity edit's curation action, under rules/knowledge-base/entity-edit-records-curation-action
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — rules/knowledge-base/a-curation-action-kind-is-written-with-underscores fixes the spelling where a curation action is recorded and where a listing filters by kind. It does not say how the action field is spelled in the list-curation-actions or read-curation-action responses. The contract says only that each answer carries the action. No criterion depends on the response spelling, but whoever implements the response mapping should know this is not stated.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Criterion 'The audit listing's action filter admits edit_entity.' is fully contained in criterion 'The audit listing's action filter admits each of the eight kinds of curation-action-kind written with each hyphen as an underscore.' The two overlap. They do not contradict each other.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
