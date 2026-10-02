---
target: backend
title: A link reached through its target end scores from the matched node
summary: The implementation of the decayed score of an expanded link already stands; this delivery writes the proof of its target-end case.
task: sha256:5c2e35cf11bd94ef4b0c8dc2e23760e0b47e89bff9c7c4b3b72ade4fad6376e0
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/proof-owed-expansion-decay-target-end-build
stands:
- src/modules/query-retrieval/service/search.service.ts
files: []
criteria:
- criterion: 'Input: one matched node scored s, a link whose target is that node, and a further link walked the same way beyond it. Expected result: the first link scores 0.5 times s at hop 1, and the second scores 0.25 times s at hop 2.'
  met: true
  how: The implementation stands at the files this record lists and the proof beside it decides this criterion.
nodes:
- node: rules/knowledge-base/expansion-decay
  how: 'collectExpandedLinks, the score passed to keepBestPath: `score: Math.pow(TRAVERSAL_DECAY, link.hop) * startScore,` in src/modules/query-retrieval/service/search.service.ts.'
---

## What it is

The implementation of the decayed score of an expanded link already stands; this delivery writes the proof of its target-end case.

## Notes

This delivery writes no source; the implementation stands and the proof is what it adds.
The build run shows the standing implementation still builds.
