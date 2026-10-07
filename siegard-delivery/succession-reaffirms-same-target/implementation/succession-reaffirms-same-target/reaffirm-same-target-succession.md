---
target: backend
task: sha256:f9bda6009d8ce251bb3921b3f07f52f4f4bcc01ff0438916ce5df6785294475d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/succession-reaffirms-same-target-reaffirm-same-target-succession-build
title: Succession proposals that repeat the current target or value re-affirm
summary: Link and attribute consolidation now answers a proposal with change hint succession that meets the current assertion with the same target or value as a re-affirmation, for types that allow multiple current assertions and types that do not.
files:
- path: src/modules/ingestion/service/graph-consolidation.service.ts
  effect: In consolidateLinkOnce and consolidateAttributeOnce, the re-affirmation branch now fires for same target or same value with any change hint other than correction, so none and succession both land there. The branch adds the proposal's provenance to the current assertion and returns outcome consolidated with that assertion's id. It inserts no row, changes no status, and does not touch confidence, validity start, validity end or basis. The correction, succession-closes-previous, dispute and new-assertion branches are unchanged.
criteria:
- criterion: A link proposal with change hint succession whose target is the target of the current link of its source and link type that does not allow multiple current links is answered as a re-affirmation of that link.
  met: true
  how: In consolidateLinkOnce, the functional lookup lockVigentLinkBySourceAndType returns the current link. The test sameTarget && change_hint !== "correction" is then true for succession, and the function returns { outcome "consolidated", link_id vigent.id } before the succession branch is reached.
- criterion: An attribute proposal with change hint succession whose value is the value of the current attribute of its node and attribute key that does not allow multiple current values is answered as a re-affirmation of that attribute.
  met: true
  how: In consolidateAttributeOnce, the current attribute is found by node and key. The test sameValue && change_hint !== "correction" is true for succession, and the function returns outcome "consolidated" with attribute_id vigent.id.
- criterion: A link proposal with change hint succession whose target is the target of a current link of its source and link type that allows multiple current links is answered as a re-affirmation of that link.
  met: true
  how: For a type that allows multiple current links, lockVigentLinkByTriple finds the link with the same target, so sameTarget is always true. Succession used to fall through to the new-assertion insert. It now returns consolidated with the existing link id.
- criterion: An attribute proposal with change hint succession whose value is the value of a current attribute of its node and attribute key that allows multiple current values is answered as a re-affirmation of that attribute.
  met: true
  how: lockVigentAttributeByTriple matches on the same value, so sameValue is true. The branch in consolidateAttributeOnce now returns consolidated with the existing attribute id for succession as well as none.
- criterion: A link proposal with change hint succession that re-affirms the current link records no new link.
  met: true
  how: The re-affirmation branch calls only insertLinkProvenance and returns. It never calls insertLinkRow.
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute records no new attribute.
  met: true
  how: The re-affirmation branch calls only insertAttributeProvenance and returns. It never calls insertAttributeRow.
- criterion: A link proposal with change hint succession that re-affirms the current link leaves that link in the status it holds.
  met: true
  how: The branch issues no UPDATE on knowledge_link. Only the provenance insert and the promotion of fragments from proposed to accepted run.
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute leaves that attribute in the status it holds.
  met: true
  how: The branch issues no UPDATE on node_attribute. Only the provenance insert and the promotion of fragments run.
- criterion: A link proposal with change hint succession that re-affirms the current link adds its provenance to that link.
  met: true
  how: insertLinkProvenance(client, vigent.id, args.fragment_ids) inserts one provenance row per cited fragment, with ON CONFLICT DO NOTHING.
- criterion: An attribute proposal with change hint succession that re-affirms the current attribute adds its provenance to that attribute.
  met: true
  how: insertAttributeProvenance(client, vigent.id, args.fragment_ids) inserts one provenance row per cited fragment, with ON CONFLICT DO NOTHING.
- criterion: The current link keeps the validity start it holds when a link proposal with change hint succession and a different validity start re-affirms it.
  met: true
  how: The branch never reads args.valid_from and writes nothing to knowledge_link. closeVigentForSuccession, which reads valid_from, is not reached.
- criterion: The current attribute keeps the validity start it holds when an attribute proposal with change hint succession and a different validity start re-affirms it.
  met: true
  how: The branch never reads args.valid_from and writes nothing to node_attribute. closeVigentForSuccession is not reached.
- criterion: A link proposal with change hint correction and the target of the current link of its source and link type that does not allow multiple current links is not answered as a re-affirmation.
  met: true
  how: The branch excludes change_hint "correction". Control passes to the correction branch, which supersedes the current link, inserts a new link naming it as superseded, and answers accepted. That behavior is unchanged.
- criterion: A link proposal with change hint none, a target other than the target of the current link of its source and link type that does not allow multiple current links, and no fragment that signals succession is answered as a dispute.
  met: true
  how: sameTarget is false, so the re-affirmation branch is skipped. The branch is not correction, and the succession branch needs a succession hint or a succession signal in the fragments. Control reaches the functional dispute branch, which marks the current link disputed, inserts the new link in status disputed with supersedes_link_id null, and answers disputed. This is unchanged.
nodes:
- node: rules/knowledge-base/reaffirmation-consolidates
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: The re-affirmation condition is now sameTarget or sameValue with a hint of none or succession. Any validity start is ignored. The only effect is added provenance, so status, validity, confidence and basis are left as they were.
- node: rules/knowledge-base/consolidation-precedence
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: Re-affirmation is checked first, then correction, then succession, then dispute, then new assertion. The re-affirmation test sits ahead of the others and now also catches same-target succession before the succession branch is reached.
- node: rules/knowledge-base/proposal-meets-current-assertion
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: This was already encoded and is untouched. A type that does not allow multiple current assertions meets the current one by node and type or key, and a type that allows them meets the one with the same target or value, through the lockVigent* helpers.
- node: rules/knowledge-base/consolidation-records-provenance
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: The re-affirmation branch inserts one provenance per cited fragment on the assertion it lands on, through insertLinkProvenance and insertAttributeProvenance. This is existing behavior, now reached for succession as well.
- node: rules/knowledge-base/conflict-disputes
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: The dispute branch is unchanged. A different target or value without a succession signal still marks the current assertion disputed and records a disputed assertion that supersedes nothing.
- node: contracts/knowledge-base/ingestion
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: A re-affirmation returns outcome "consolidated" carrying link_id or attribute_id of the assertion re-affirmed. That is the identity the propose-link and propose-attribute answers fix.
- node: scenarios/knowledge-base/same-target-succession-re-affirms
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: A same-target succession on a functional link type with a later validity start takes the re-affirmation branch. It adds provenance, records no link, leaves the status alone and keeps valid_from.
- node: scenarios/knowledge-base/same-target-succession-re-affirms-multi-current
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: A same-target succession on a type that allows multiple current links finds the link by triple and takes the re-affirmation branch. It adds provenance and records no new link.
- node: scenarios/knowledge-base/different-target-without-signal-is-disputed
  encoded_at:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  how: Behavior is unchanged. A different target with hint none and no signal still reaches the functional dispute branch.
inferences:
- inferred: Re-affirmation is tested as change_hint !== "correction" rather than as an explicit none or succession, and the same-target and same-value branches return the existing assertion without touching confidence, validity end or basis.
  from: The change_hint union has exactly none, succession and correction. The re-affirmation rule names none and succession, and the Notes say that overwriting confidence, validity end or basis is refused by the rule's "changing nothing else". The negation reads the same as the rule and keeps the function's line count from growing.
- inferred: Provenance idempotence per fragment rests on the existing ON CONFLICT DO NOTHING in the insert helpers, so no new guard was added.
  from: insertLinkProvenance and insertAttributeProvenance already use ON CONFLICT DO NOTHING, and the neighbor rules link-provenance-once-per-fragment and attribute-provenance-once-per-fragment are held outside this task.
preserved:
- Same-target or same-value proposals with change hint none still re-affirm and answer consolidated, including with another validity start.
- Change hint correction still supersedes the current assertion, records a new one naming it as superseded, and answers accepted.
- A different target or value with change hint succession, or with a succession signal in the fragments, on a type that does not allow multiple current assertions still closes the previous assertion and answers superseded_previous.
- A different target or value with change hint none and no signal still marks the current assertion disputed and records a disputed assertion that supersedes nothing.
- A proposal that meets no current assertion still records a new assertion with status_for_new_row.
- The retry on dup-guard violation under savepoint and the exported API (hasSuccessionSignal, consolidateLink, consolidateAttribute, __testing__) are untouched.
deferred:
- what: consolidateLinkOnce and consolidateAttributeOnce each exceed the thirty lines MNT-01 allows, and the ATTRIBUTE and LINK variants copy the same branch structure (MNT-03).
  why: The excess was there before this task and the edit adds no lines. Splitting or merging them is a refactor outside the objective.
- what: A concurrent proposal that commits first, which the rule on a race decided again re-decides, now lands on re-affirmation for a same-target succession. No criterion covers that path.
  why: The task's own Notes mark it ADVISORY, and the rule is a neighbor held by another task.
---

## What it is
The re-affirmation condition of the link and attribute consolidation now holds for any change hint other than correction, so a succession proposal that repeats the target or value of the current assertion re-affirms it.
One source file changed, by two lines.

## Notes
The build run installed, typechecked, linted and secret-scanned over the changed tree and passed.
No disagreement and no stray file were reported.
