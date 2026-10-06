---
target: backend
title: Implementation of link-and-fragment-items-carry-no-match, standing
summary: The implementation of rules/knowledge-base/link-and-fragment-items-carry-no-match already stands at the files the task lists; this delivery writes no source.
task: sha256:f23d982a57948188c4731e04625aa59a62d92f546ff366cffd62791ec12488a2
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-link-and-fragment-items-carry-no-match-build
stands:
- src/modules/query-retrieval/service/search.service.ts
files: []
criteria:
- criterion: 'One input: a search whose chunk layer matches a raw chunk that supports a fragment the fragment layer itself does not match. One expected result: the fragment item that search answers carries no match and no similarity.'
  met: true
  how: The implementation stands at src/modules/query-retrieval/service/search.service.ts, and the proof beside this record decides it.
nodes:
- node: rules/knowledge-base/link-and-fragment-items-carry-no-match
  how: 'As siegard-reconcile/aliases-fuzzy-context-3.md reads it: src/modules/query-retrieval/service/search.service.ts: held at the fragment item pushed in searchKnowledgeService and the link item built in toExpandedLinkItem, neither of which sets match or similarity — approximateOnly: false, summary: f.text, ... approximateOnly: !reachedExactly, summary: `${meta.source_canonical_name} -[${meta.link_type}]-> ${meta.target_canonical_name}`,'
---
## What it is
This record answers a proof task: the implementation stands at the files under `stands`, and no source was written.
Its build run shows the standing implementation still builds.

## Notes
None.
