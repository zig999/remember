---
target: backend
title: Compliance deletion counts match what it marked
summary: The standing compliance deletion implementation, answered by a proof that its affected counts
  are the rows it marked deleted.
task: sha256:2b95ca08e0170201329be0d1d29fa381977084345bf265697ff10f3da9febd99
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/compliance-deletion-counts-proof-counts-match-marked-build
stands:
- src/modules/compliance-audit/repository/compliance-audit.repository.ts
- src/modules/compliance-audit/service/compliance-audit.service.ts
files: []
criteria:
- criterion: A compliance deletion is run on a target raw. The rows resting only on that raw are 1 raw
    chunk, 1 information fragment, 2 knowledge links and 3 node attributes. A fourth node attribute also
    has provenance in a second, active raw. A second raw chunk of the target raw is already superseded.
    The deletion records affected as {chunks 1, fragments 1, links 2, attributes 3}.
  met: true
  how: The implementation stands at src/modules/compliance-audit/repository/compliance-audit.repository.ts
    and src/modules/compliance-audit/service/compliance-audit.service.ts, and the proof below decides
    this criterion.
- criterion: For that same deletion, each recorded affected count equals the number of raw chunks, information
    fragments, knowledge links and node attributes whose status the deletion turned to deleted.
  met: true
  how: The implementation stands at src/modules/compliance-audit/repository/compliance-audit.repository.ts
    and src/modules/compliance-audit/service/compliance-audit.service.ts, and the proof below decides
    this criterion.
nodes:
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  how: 'As siegard-reconcile/certify-counts-what-it-marked.md reads it: held at the four count-returning
    UPDATE ... RETURNING functions of compliance-audit.repository.ts (tombstoneRawChunksOfRaw, tombstoneCascadedFragments,
    tombstoneCascadedLinks, tombstoneCascadedAttributes), each returning res.rowCount ?? 0, persisted
    under the keys chunks, fragments, links and attributes by insertComplianceDeletion; and at complianceDelete()
    in compliance-audit.service.ts, which gathers the four counts into affected and hands that object
    to insertComplianceDeletion.'
---
## What it is
A proof increment over the standing compliance deletion implementation: no source is written, and the proof decides that the affected counts are the rows the deletion marked deleted.

## Notes
The implementation stands at the two compliance-audit files the task lists; trace.py --encodes still lists rules/knowledge-base/compliance-deletion-counts-what-it-marked as matching on both, and trace.py --check --all reports no drift on either.
The node answer quotes the reading of siegard-reconcile/certify-counts-what-it-marked.md, the record the scope names, which left this node decided by reading with a testable remainder.
The build ran over the tree as it stands to show the standing implementation still builds.
