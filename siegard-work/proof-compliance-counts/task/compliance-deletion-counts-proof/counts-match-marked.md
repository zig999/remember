---
title: Compliance deletion counts match what it marked
summary: A proof that a compliance deletion records in affected exactly the rows it marked deleted, apart from rows it leaves alone.
rationale: The scope stated its assertion as a single sentence; cutting it into one criterion for the recorded counts and one for their match to the rows marked deleted was a planning decision, made on a binder's compound note, and both stay in one task because both are read off the same deletion and decide the same invariant.
sources:
- intake/scope.md
objective: A test decides that a compliance deletion's affected counts are the numbers of rows it marked deleted.
criteria:
- A compliance deletion is run on a target raw. The rows resting only on that raw are 1 raw chunk, 1 information fragment, 2 knowledge links and 3 node attributes. A fourth node attribute also has provenance in a second, active raw. A second raw chunk of the target raw is already superseded. The deletion records affected as {chunks 1, fragments 1, links 2, attributes 3}.
- For that same deletion, each recorded affected count equals the number of raw chunks, information fragments, knowledge links and node attributes whose status the deletion turned to deleted.
implements:
- rules/knowledge-base/compliance-deletion-counts-what-it-marked
stands:
- src/modules/compliance-audit/repository/compliance-audit.repository.ts
- src/modules/compliance-audit/service/compliance-audit.service.ts
---

## What it is

A test that runs one compliance deletion over a fixture mixing rows that rest only on the target raw with rows that must be left alone, checking the recorded counts against the expected numbers and against the rows actually marked deleted.

## Notes

ADVISORY, from the specification — Criterion 1 expects affected.chunks 1 with a second raw chunk already superseded, which rests on rules/knowledge-base/compliance-deletion-tombstones (marks each raw chunk not already superseded) outside the epic's covers, and the decision log entry of 2026-10-01 on that node's statement says a chunk already superseded keeps its status and is not counted.
Decision, beyond the covers — stand: rules/knowledge-base/compliance-deletion-tombstones is not claimed; a proof task implements the one node the owner named, and the fixture's expected values are read from the specification as it stands.
ADVISORY, from the specification — Criterion 1 expects affected.attributes 3 with a fourth attribute also resting on a second active raw, and its fragment and link counts likewise rest on rules/knowledge-base/compliance-deletion-propagates outside the epic's covers.
Decision, beyond the covers — stand: rules/knowledge-base/compliance-deletion-propagates is not claimed; a proof task implements the one node the owner named, and the fixture's expected values are read from the specification as it stands.
