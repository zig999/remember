---
title: Check the validity a change states
summary: A change that states a validity its key does not accept, or a start that is not strictly before its end, is refused with BUSINESS_TEMPORAL_INCOHERENT.
rationale: Planning cut the validity checks away from the key and value checks. They change with the temporal model rather than with the value types, and they can be shown working without them.
sources:
- intake/scope.md
objective: A change whose stated validity breaks the temporal rules is refused with BUSINESS_TEMPORAL_INCOHERENT.
criteria:
- A change to a key that is not temporal that states a validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A change to a key that is not temporal that states a validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A change to a key that is not temporal that states no validity is not refused by the stable-key rule.
- A change to a key that records no temporality that states a validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A change to a key that records no temporality that states a validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A change to a key that records no temporality that states no validity is not refused by the stable-key rule.
- A change whose validity start equals its validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A change whose validity start falls later than its validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A change to a temporal key whose validity start falls earlier than its validity end is not refused by these rules.
- A set change to a temporal key that states a validity end of today and no validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A set change to a temporal key that states a validity end earlier than today and no validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
- A set change to a temporal key that states a validity end later than today and no validity start is not refused by the defaulted-start rule.
implements:
- rules/knowledge-base/stable-key-change-states-no-validity
- rules/knowledge-base/unrecorded-temporality-is-not-temporal
- rules/knowledge-base/validity-start-before-end
- rules/knowledge-base/entity-edit-defaulted-start-precedes-end
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-key
---
## What it is
A change that states a validity its key does not accept, or a start that is not strictly before its end, is refused with BUSINESS_TEMPORAL_INCOHERENT.

## Notes
UNDERDETERMINED, from the specification — contracts/knowledge-base/entity-editing answers each of these three rules with 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 422 over REST'. Every criterion names only the error code and never the HTTP status, so nothing in the criteria holds the transport answer. Implementation that meets every criterion and that the specification refuses: An implementation that refuses each case with error code BUSINESS_TEMPORAL_INCOHERENT but answers HTTP 400 (or 409) over REST. It satisfies every criterion as written, and contracts/knowledge-base/entity-editing refuses it.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — The criteria about a validity end "of today", "earlier than today" and "later than today" never say which day is today. rules/knowledge-base/entity-edit-defaulted-start-precedes-end says "after today", and its Description points to rules/knowledge-base/entity-edit-start-defaults-to-today for the default start. That rule defines today as "the UTC calendar date of the moment of the edit". Implementation that meets every criterion and that the specification refuses: An implementation that takes today from the server's local time zone (for example America/Sao_Paulo). Near midnight UTC it accepts a set change whose stated end is the UTC today, or it refuses a set change whose end is the UTC tomorrow. Tests run away from the day boundary still pass every criterion as written.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — In rules/knowledge-base/validity-start-before-end, the clauses that hold a proposal, an adjusted period and a correction to a start strictly before the end reach no criterion of this task. Only the clause about "a change of an entity edit" is answered here. Belongs to: The ingestion proposal validation (domain/knowledge-base/proposal), the curation period adjustment (domain/knowledge-base/adjusted-period) and the curation correction (domain/knowledge-base/corrected-values), each in its own task or act. Entity editing is not one of them.
Decision, beyond the covers — stand: domain/knowledge-base/adjusted-period, domain/knowledge-base/corrected-values, domain/knowledge-base/proposal, specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — rules/knowledge-base/entity-edit-change-check-order places the validity check after the allowed-values check and before the checks against the node's attributes of the key. rules/knowledge-base/entity-edit-check-order runs the changes in the order given. No criterion here tests where the validity check sits. This task does not implement those ordering rules, so the position has to be held by the task that does.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The criteria "states no validity is not refused by the stable-key rule" also cover a validity start or end sent as null, because rules/knowledge-base/entity-edit-null-field-is-not-stated counts null as not stated. That rule is not in this task's implements. Whoever implements this check has to read null as not stated, or the task that implements the null rule has to run before this one.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
