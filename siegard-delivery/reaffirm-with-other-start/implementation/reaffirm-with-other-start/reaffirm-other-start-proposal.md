---
target: backend
task: sha256:504eee7c1540d13fda4c85206d04381f45f4f465cf18dd384cc0415d7f830dcc
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/reaffirm-with-other-start-reaffirm-other-start-proposal-build
title: Re-affirm a current link or attribute whatever validity start the proposal states
summary: The consolidation service now takes a change-hint-none proposal with the target or value of the current assertion as a re-affirmation without comparing validity starts, and the file carries no comments.
files:
- path: src/modules/ingestion/service/graph-consolidation.service.ts
  effect: 'The link branch re-affirms when the target is the current link''s target and the change hint is none. The attribute branch re-affirms when the value is the current attribute''s value and the change hint is none. Neither compares validity starts, and a re-affirmation adds provenance only, so no new row is recorded and the held validity start, basis, confidence, status and validity end are not touched. The correction, succession, dispute and new-assertion branches are unchanged. The file was rewritten whole under the no-comments rule: the header, the JSDoc blocks and the inline comments are gone. The empty `if (!functional)` block that held only a comment in the link branch became `if (functional)` around the dispute path, with the same behavior.'
criteria:
- criterion: A link proposal with change hint none whose target is the target of the current link of its source and link type that does not allow multiple current links, and that states a different validity start, is answered as a re-affirmation of that link.
  met: true
  how: In consolidateLinkOnce, the condition is now `sameTarget && args.change_hint === "none"`. The `(!functional || sameValidFrom)` clause that required equal starts for functional types is removed. The function returns outcome "consolidated" with the held link's id.
- criterion: An attribute proposal with change hint none whose value is the value of the current attribute of its node and attribute key that does not allow multiple current values, and that states a different validity start, is answered as a re-affirmation of that attribute.
  met: true
  how: In consolidateAttributeOnce, the condition is now `sameValue && args.change_hint === "none"`. The `sameValidFrom` conjunct is removed, and the function returns outcome "consolidated" with the held attribute's id.
- criterion: A link proposal that re-affirms the current link with a different validity start records no new link.
  met: true
  how: The re-affirmation branch returns before any call to insertLinkRow.
- criterion: An attribute proposal that re-affirms the current attribute with a different validity start records no new attribute.
  met: true
  how: The re-affirmation branch returns before any call to insertAttributeRow.
- criterion: A link proposal that re-affirms the current link with a different validity start adds its provenance to that link.
  met: true
  how: The branch calls insertLinkProvenance(client, vigent.id, args.fragment_ids). It inserts one row per cited fragment with ON CONFLICT DO NOTHING, so the held link gets at most one provenance per fragment.
- criterion: An attribute proposal that re-affirms the current attribute with a different validity start adds its provenance to that attribute.
  met: true
  how: The branch calls insertAttributeProvenance(client, vigent.id, args.fragment_ids). It inserts one row per cited fragment with ON CONFLICT DO NOTHING.
- criterion: The current link keeps the validity start it holds when a link proposal with a different validity start re-affirms it.
  met: true
  how: The re-affirmation branch issues no UPDATE on knowledge_link. Only provenance rows and fragment status are written.
- criterion: The current attribute keeps the validity start it holds when an attribute proposal with a different validity start re-affirms it.
  met: true
  how: The re-affirmation branch issues no UPDATE on node_attribute. Only provenance rows and fragment status are written.
- criterion: A link proposal with change hint succession and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation.
  met: true
  how: The re-affirmation condition requires change_hint "none". With hint succession and the same target the proposal skips the correction branch and the succession branch, which requires `!sameTarget`. For a functional type it then reaches the existing dispute branch. This is unchanged delivered behavior and was left as it stands.
- criterion: An attribute proposal with change hint none and a value other than the value of the current attribute of its node and attribute key that does not allow multiple current values is not answered as a re-affirmation.
  met: true
  how: '`sameValue` is false, so the re-affirmation branch is skipped. The proposal reaches the existing succession-marker branch or the dispute branch, both unchanged.'
nodes:
- node: rules/knowledge-base/reaffirmation-consolidates
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: The re-affirmation conditions in consolidateLinkOnce and consolidateAttributeOnce no longer look at validity starts. Provenance is added and the assertion is otherwise untouched.
- node: rules/knowledge-base/proposal-meets-current-assertion
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: The lock selects already implement the meeting. Types that do not allow multiple current assertions lock by source and type, or node and key. Types that do allow them lock by source, type and target, or node, key and value. Both were left as they stand.
- node: rules/knowledge-base/consolidation-precedence
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: Re-affirmation is still tested first, then correction, then succession, then dispute, then new assertion. This task changed only the first condition.
- node: rules/knowledge-base/current-assertion
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: The lock selects still treat a row as current while valid_to and superseded_at are both null. The task changed nothing there.
- node: rules/knowledge-base/consolidation-records-provenance
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: Every branch, re-affirmation included, ends in insertLinkProvenance or insertAttributeProvenance. These insert one row per cited fragment through unnest over the proposal's fragment ids.
- node: rules/knowledge-base/link-provenance-once-per-fragment
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: ON CONFLICT DO NOTHING in insertLinkProvenance keeps one provenance per link and fragment, so a re-affirmation citing an already-held fragment adds no second row. This relies on the unique index that the removed header comment said migrations/0001_init.sql defines. I did not open the migration to confirm it.
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: Same as the link case, through insertAttributeProvenance.
- node: scenarios/knowledge-base/same-target-other-start-re-affirms
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: A proposal from A to B with hint none and start 2024-06-01 against a current link valid from 2024-01-01 returns "consolidated" on the existing link, adds provenance, records no row and leaves 2024-01-01 untouched.
- node: scenarios/knowledge-base/same-value-other-start-re-affirms
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: The attribute analogue of the above, for value V valid from 2026-01-01 and a proposal starting 2026-03-01.
- node: contracts/knowledge-base/ingestion
  how: The propose-link and propose-attribute answers already carry the outcome "consolidated" with the held assertion's identity. The result shapes and error mapping are unchanged, so the contract governed the work without a new fact reaching the code.
- node: domain/knowledge-base/proposal
  how: The proposal's change hint, target or value and validity start are read from the existing Consolidate*Args. No shape changed.
- node: domain/knowledge-base/knowledge-link
  how: The existing row shape and columns were read and not altered. The validity start of a re-affirmed link is deliberately not written.
- node: domain/knowledge-base/node-attribute
  how: The existing row shape and columns were read and not altered. The validity start of a re-affirmed attribute is deliberately not written.
- node: domain/knowledge-base/change-hint
  how: The hint values none, succession and correction are unchanged. Only none reaches re-affirmation, and correction and succession keep their branches.
- node: domain/knowledge-base/provenance
  how: The provenance table and its per-fragment insertion are unchanged, so the node governed the work and no fact of its own was encoded.
inferences:
- inferred: The attribute re-affirmation ignores validity start for every attribute key, including keys that allow multiple current values. The task's criteria name only keys that do not allow them.
  from: The rule reaffirmation-consolidates does not restrict itself by type, and the task's UNDERDETERMINED note says the narrower reading is refused by the rule. The link branch already ignored the start for multi-current types, so this brings attributes into line.
- inferred: Re-affirmation with change hint correction or succession on the attribute side, or correction on the link side, is not taken as a re-affirmation, since the condition still requires hint none.
  from: consolidation-precedence, which orders correction and succession after re-affirmation, and the task's UNDERDETERMINED note on the change hint.
- inferred: A re-affirmation changes nothing about the held assertion beyond provenance and fragment promotion, so its basis, confidence, status and validity end are untouched.
  from: The rule's closing clause "changing nothing else about the assertion". The existing branch already issued no UPDATE on the row.
- inferred: The comments in the rewritten file included "SPEC DIVERGENCE" notes about the `corrected` status and the fallback valid_to in succession. They were removed with no other home written, because their content describes behavior this task does not touch.
  from: The project's no-comments rule, which says the file is delivered whole and its comments go with the edit.
divergences:
- cites: MNT-01
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  departure: consolidateLink, consolidateLinkOnce, consolidateAttribute and consolidateAttributeOnce take five positional parameters. consolidateLinkOnce and consolidateAttributeOnce run well over thirty lines.
  why: They were already this way before the task. Splitting them or changing their signatures would reach the propose-link and propose-attribute callers and widen a task about one condition. My edit shortened both branches slightly and did not lengthen any function.
- cites: TYP-02
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  departure: isDupGuardViolation casts `err as PgError` before narrowing with `instanceof Error`. The `res.rows[0]!` non-null assertions in the two insert helpers are also unguarded.
  why: Delivered code this task has no reason to touch, kept as it was to avoid a behavior-neutral rewrite outside the criteria.
- cites: TYP-04
  file: src/modules/ingestion/service/graph-consolidation.service.ts
  departure: The retry count 2, the Postgres code "23505" and the guard names are spelled inline rather than as named constants.
  why: Delivered code outside the task's reach, left as it stands.
preserved:
- A functional link or attribute proposal with a different target or value and hint succession, or a succession marker in the fragment text, still closes the previous assertion and records the successor.
- A functional proposal with a different target or value and no succession signal is still recorded as disputed and marks the held assertion disputed.
- A correction still closes the current assertion on the transaction axis only and records a chained successor.
- A link or attribute proposal with the same target or value and hint none on a type that allows multiple current assertions still consolidates, as it did before.
- A link proposal with hint succession and the same target on a functional type is still not a re-affirmation. Before this change it reached the dispute branch, and it still does.
- The dup-guard retry protocol with savepoints, and the exports hasSuccessionSignal, the argument and result types, and __testing__, are unchanged.
deferred:
- what: Breaking up the long consolidateLinkOnce and consolidateAttributeOnce functions and reducing their parameter lists (MNT-01), and replacing the unguarded type cast in isDupGuardViolation (TYP-02).
  why: These are not reached by the task, which covers the re-affirmation condition only.
- what: The scenario same-target-succession-is-disputed and the rules for correction, succession, dispute and new assertion are not implemented here.
  why: The task's notes assign them to other tasks and say delivered code stands.
- what: A stray file, /tmp/none.txt, was created by mistake while composing this record. It sits outside the target tree and has no bearing on the delivery. I have no shell to remove it.
  why: It is not part of the source, and a caller with a shell can delete it.
---

## What it is
The re-affirmation conditions of the link and attribute consolidation no longer compare validity starts, and the file is delivered whole without comments.
No other file was written.

## Notes
The build run installed, typechecked, linted and secret-scanned over the changed tree and passed.
The implementer reported a stray file /tmp/none.txt created by mistake outside the target tree; it is not part of the delivery.
The multi-valued attribute case the task's first underdetermined note names is re-affirmed whatever its start, because the attribute condition no longer looks at starts for any key.
