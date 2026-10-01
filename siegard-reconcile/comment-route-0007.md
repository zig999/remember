---
contract_version: siegard-reconcile/8
title: Reconciliation of migration 0007 after the comment route
summary: The owner removed the COMMENT ON COLUMN statement from 0007 by the comment route, answering the
  restates finding of review fix-compliance-deletion-affected, with the constraint unchanged; this reconciliation
  asks whether the nodes bound to the file still hold what it carries.
target: database
files:
- path: 0007_compliance_deletion_affected_shape.sql
  change: Drops the '{}' default on compliance_deletion.affected and adds CHECK compliance_deletion_affected_ck,
    NOT VALID, requiring the four counts as non-negative integers; it no longer sets a column comment.
nodes:
- node: domain/knowledge-base/affected-counts
  conforms: true
  how: "0007_compliance_deletion_affected_shape.sql: held at The CHECK constraint compliance_deletion_affected_ck\
    \ (lines 3-9). It names the four attributes chunks, fragments, links and attributes, and requires\
    \ each to be an integer. — COALESCE((affected -> 'chunks')::text     ~ '^[0-9]+$', false)\n    AND\
    \ COALESCE((affected -> 'fragments')::text  ~ '^[0-9]+$', false)\n    AND COALESCE((affected -> 'links')::text\
    \      ~ '^[0-9]+$', false)\n    AND COALESCE((affected -> 'attributes')::text ~ '^[0-9]+$', false)"
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "0007_compliance_deletion_affected_shape.sql: held at Line 1 and the CHECK constraint at lines\
    \ 3-9. Line 1 drops the empty-object default, so a row cannot be written without an affected value.\
    \ The constraint rejects a missing value, because the COALESCE turns a null into false. The column\
    \ itself (jsonb NOT NULL) is declared in 0001_init.sql, outside this file. — ALTER TABLE compliance_deletion\
    \ ALTER COLUMN affected DROP DEFAULT;\n\nALTER TABLE compliance_deletion\n  ADD CONSTRAINT compliance_deletion_affected_ck\
    \ CHECK ("
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
notes: 'Judged by 1 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/comment-route-0007.returns/.

  Candidates: 0 opened across 0 of 1 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/comment-route-0007.returns/`, which are the evidence behind every entry above.
