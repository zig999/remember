---
title: Record a succession
summary: A succession supersedes the attribute it names, closes that attribute's validity where its rule says, and records the new attribute naming it as the one it supersedes.
rationale: Planning cut each superseding effect into its own task. Succession closes the previous validity and correction does not, so they change for different reasons, and each can be shown working on its own.
sources:
- intake/scope.md
objective: A succession of an edit leaves the named attribute superseded with the validity end its rule states, and a new attribute that names it as the one it supersedes.
criteria:
- The named attribute's status becomes superseded.
- A succession that gives the superseded attribute no validity end gives it the moment of the supersession as its supersession time.
- A succession that gives the superseded attribute a validity end leaves its supersession time unset.
- The new attribute names the superseded attribute as the one it supersedes.
- The superseded attribute's validity end is the new attribute's validity start when that start falls later than the superseded attribute's start.
- The superseded attribute is given no validity end when the new start falls on its start.
- The superseded attribute is given no validity end when the new start falls earlier than its start.
- A superseded attribute that holds no validity start is given the new attribute's validity start as its validity end.
- A superseded attribute that holds no validity start is left with its supersession time unset.
- A project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start, gives a new deadline whose validity start is 2026-10-07.
- In that same edit the new deadline's validity-start basis is received.
- In that same edit the earlier deadline is given the validity end 2026-10-07.
- In that same edit the earlier deadline's supersession time is left unset.
- A project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01, leaves the earlier status with no validity end.
- In that same edit the new status's validity start is 2026-09-01.
- In that same edit the new status's validity-start basis is stated.
- In that same edit the earlier status is given the moment of the supersession as its supersession time.
depends_on:
- task/entity-edit-backend/record-new-attribute
implements:
- rules/knowledge-base/entity-edit-succession
- rules/knowledge-base/entity-edit-succession-closes-the-previous
- rules/knowledge-base/entity-edit-supersession-time
- rules/knowledge-base/entity-edit-start-defaults-to-today
- rules/knowledge-base/entity-edit-stated-start-is-stated
- rules/knowledge-base/entity-edit-new-attribute-state
- rules/knowledge-base/entity-edit-provenance
- rules/knowledge-base/entity-edit-stated-end-is-held
- scenarios/knowledge-base/temporal-edit-without-a-date-starts-today
- scenarios/knowledge-base/backdated-start-supersedes-without-an-end
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
- domain/knowledge-base/attribute-change
---
## What it is
A succession supersedes the attribute it names, closes that attribute's validity where its rule says, and records the new attribute naming it as the one it supersedes.

## Notes
UNDERDETERMINED, from the specification — The clause "recorded as a new active attribute" in rules/knowledge-base/entity-edit-succession and the whole of rules/knowledge-base/entity-edit-new-attribute-state ("An entity edit records every new attribute as active at confidence 1.0 under the LLM run it opened") are not tested by any criterion here. The task record-new-attribute tests status active, confidence 1.0 and the edit's run only for a first value or an addition, so no task tests them for the attribute a succession records. Implementation that meets every criterion and that the specification refuses: A succession that records the new attribute with status uncertain, at confidence 0.8, under no LLM run. It still supersedes the named attribute, links to it through supersedes and closes its validity as the criteria require.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-provenance says "An entity edit's new attribute holds the provenance of the entity edit's information fragment". No criterion of this task tests that for the attribute a succession records. record-new-attribute tests it only for a first value or an addition, and record-correction only for a correction. Implementation that meets every criterion and that the specification refuses: A succession that records the new attribute with no provenance at all. It still meets every criterion about supersession, supersedes and validity.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-stated-end-is-held says "A new attribute recorded from an entity edit's set change holds as its validity end the validity end the change states, and holds no validity end when the change states none". No criterion of this task tests the new attribute's own validity end. Every validity-end criterion here is about the superseded attribute. Implementation that meets every criterion and that the specification refuses: A succession whose set change states a validity end of 2027-01-31, where the new attribute is recorded with no validity end. Or one that states none, where the new attribute is given an end anyway.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-start-defaults-to-today fixes today as "the UTC calendar date of the moment of the edit". Criteria 14 to 16 test that default only on a date where every time zone gives 2026-10-07. No criterion fixes the time zone used to read the moment of the edit as a date. Implementation that meets every criterion and that the specification refuses: An implementation that reads today in the server's local time zone (for example America/Sao_Paulo). It passes the deadline example run at midday, but an edit made at 2026-10-07T23:30-03:00 gets a validity start of 2026-10-07 where the rule requires 2026-10-08, and the superseded deadline gets that same wrong date as its validity end.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — The clause "with the effect succession" in rules/knowledge-base/entity-edit-succession is not tested by any criterion of this task. The same goes for the then-line "the change is reported with the effect succession" in scenarios/knowledge-base/temporal-edit-without-a-date-starts-today. Belongs to: assign-change-effect (its criteria give a set change naming a current attribute of a temporal key the effect succession), and apply-entity-edit (each applied entry carries its change's effect and the succession entry's item_id and predecessor_id).
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/entity-edit-supersession-time also covers the attribute superseded by a correction, including one that already holds a validity end ("leaves its supersession time unset only when the edit itself gives that attribute a validity end"). This task tests only the succession side of that clause. Belongs to: record-correction (its criteria give the corrected attribute, ended or not, the moment of the supersession as its supersession time).
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Criteria 15 and 20 (validity-start basis received and stated) and the run in rules/knowledge-base/entity-edit-new-attribute-state rely on domain/knowledge-base/valid-from-basis and domain/knowledge-base/llm-run. Neither of those is a candidate. The rules named here state the values "received" and "stated" and the run outright, so the task can be done without them. If the executor needs the enumeration or the run entity itself, the epic's claim has to grow to include those nodes.
Decision, beyond the covers — stand: domain/knowledge-base/llm-run, domain/knowledge-base/valid-from-basis, specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
