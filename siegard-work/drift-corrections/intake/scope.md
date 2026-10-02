# Corrective increment — owner, 2026-10-01

Three behaviors already delivered disagree with the specification, which is right in each.

1. An attribute proposal for a date-typed key carrying a value such as 2024-02-30 is accepted. Specification: scenarios/knowledge-base/impossible-calendar-date-refused and rules/knowledge-base/attribute-value-parses. File: backend/src/modules/ingestion/validation/structural.ts. Evidence: siegard-reconcile/comment-route-backend.returns/src__modules__ingestion__validation__structural.ts.yaml.
2. A knowledge link reached beyond the first hop in a search expansion is scored 0 instead of 0.5 raised to the hop times the score of the matched node it was reached from. Specification: rules/knowledge-base/expansion-decay. File: backend/src/modules/query-retrieval/service/search.service.ts. Evidence: siegard-reconcile/comment-route-backend.returns/src__modules__query-retrieval__service__search.service.ts.yaml.
3. The version 4 extraction prompt asks the model to state the basis received on a proposal, which rules/knowledge-base/caller-never-states-received forbids and the proposal schema refuses. It must keep resolving a relative date against the date of reception and stop asking for basis received. File: backend/src/modules/ingestion/prompts/extraction.v4.ts.
