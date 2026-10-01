---
contract_version: siegard-reconcile/8
title: Review of the compliance_deletion.affected shape delivery
summary: The delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected under
  initiative fix-compliance-deletion-affected wrote migration 0007 and three SQL proof scripts; this review's
  conformance pass reads each file against the nodes the trace binds to it and the nodes the task implements.
target: database
files:
- path: 0007_compliance_deletion_affected_shape.sql
  change: Drops the '{}' default on compliance_deletion.affected and adds CHECK compliance_deletion_affected_ck,
    NOT VALID, requiring chunks, fragments, links and attributes each as a non-negative JSON integer;
    sets a column comment stating the shape.
- path: tests/compliance_deletion_affected_absent.sql
  change: Written by the delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected.
- path: tests/compliance_deletion_affected_counts.sql
  change: Written by the delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected.
- path: tests/compliance_deletion_affected_non_negative.sql
  change: Written by the delivery of task/compliance-deletion-affected-shape/store-refuses-incomplete-affected.
nodes:
- node: domain/knowledge-base/affected-counts
  conforms: true
  how: "0007_compliance_deletion_affected_shape.sql: held at the compliance_deletion_affected_ck CHECK\
    \ constraint (lines 3-9), together with the DROP DEFAULT on line 1 — ALTER TABLE compliance_deletion\
    \ ALTER COLUMN affected DROP DEFAULT; ... CHECK (\n  COALESCE((affected -> 'chunks')::text     ~ '^[0-9]+$',\
    \ false)\n  AND COALESCE((affected -> 'fragments')::text  ~ '^[0-9]+$', false)\n  AND COALESCE((affected\
    \ -> 'links')::text      ~ '^[0-9]+$', false)\n  AND COALESCE((affected -> 'attributes')::text ~ '^[0-9]+$',\
    \ false)\n) NOT VALID;"
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "0007_compliance_deletion_affected_shape.sql: held at the DROP DEFAULT on line 1 and the CHECK\
    \ on lines 3-9. Together they make the `affected` attribute required, with the four-count shape. The\
    \ table, its other attributes and the reference to raw_information are declared in an earlier migration,\
    \ not in this file. — ALTER TABLE compliance_deletion ALTER COLUMN affected DROP DEFAULT; ALTER TABLE\
    \ compliance_deletion\n  ADD CONSTRAINT compliance_deletion_affected_ck CHECK ("
  encoded_at:
  - 0007_compliance_deletion_affected_shape.sql
restates:
- file: 0007_compliance_deletion_affected_shape.sql
  where: lines 11-12, the COMMENT ON COLUMN statement on compliance_deletion.affected
  evidence: "COMMENT ON COLUMN compliance_deletion.affected IS\n  'Contagens do alcance do apagamento:\
    \ objeto com chunks, fragments, links e attributes, cada um inteiro nao negativo. Sem default.';"
  cost: The column's shape (the four counts, each a non-negative integer, no default) is written a second
    time as catalog prose, beside the CHECK in this file that enforces it and beside domain/knowledge-base/affected-counts,
    which holds it. If the node gains or renames a count, the CHECK and the comment can disagree, and
    nothing reads the comment to notice. The next reader of the table description would take it for the
    shape's home.
  node: domain/knowledge-base/affected-counts
unbound:
- tests/compliance_deletion_affected_absent.sql
- tests/compliance_deletion_affected_counts.sql
- tests/compliance_deletion_affected_non_negative.sql
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/fix-compliance-deletion-affected.returns/.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) domain/knowledge-base/compliance-deletion, domain/knowledge-base/affected-counts, rules/knowledge-base/compliance-deletion-counts-what-it-marked
  were read on every file and answered for, and bound from nowhere here — a binding this record writes
  is one the trace already held.

  Candidates: 1 opened across 1 of 4 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 1 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/fix-compliance-deletion-affected.returns/`, which are the evidence behind every entry above.
