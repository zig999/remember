The human's words: "entregue este plan work proposto", then "comite e siga pro deliver scope".
Corrective increment named by the human.
The wrong behavior, as the human described it: a link or attribute proposal with change hint none that meets a current assertion with the same target or value but a different validity start, for a type that does not allow multiple current assertions, is sent to dispute and then fails on the unique indexes of the store with a system error saying a dup-guard constraint was hit on retry.
By the specification as it now stands (rules/knowledge-base/reaffirmation-consolidates and the scenarios same-target-other-start-re-affirms and same-value-other-start-re-affirms) it must re-affirm: add its provenance, record no new assertion, leave the validity start the assertion holds.
Not in scope: the database, and the cases with a different value or target, or with a change hint other than none, which stay as they are.
The error was found by reading, not reproduced.
The file the wrong behavior lives in: backend/src/modules/ingestion/service/graph-consolidation.service.ts
