---
target: backend
title: Implementation of extraction-model-call-bounded, standing
summary: The implementation of constraints/extraction-model-call-bounded already stands at the files the task lists; this delivery writes no source.
task: sha256:877a25442d2a84953e4bb245307935c7b309334ee0f128e65bbad74b4933eadc
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-model-call-bounded-build
stands:
- src/modules/ingestion/service/extraction.service.ts
files: []
criteria:
- criterion: 'Input: a chunk extraction call to the run model that gets a retryable error (for example 529 overloaded) on every attempt. Expected: that call is attempted at most three times, meaning it is retried at most twice, counted for that chunk alone.'
  met: true
  how: The implementation stands at src/modules/ingestion/service/extraction.service.ts, and the proof beside this record decides it.
nodes:
- node: constraints/extraction-model-call-bounded
  how: 'As siegard-reconcile/aliases-fuzzy-context-3.md reads it: src/modules/ingestion/service/extraction.service.ts: held at the two constants at the top of the Anthropic factory, handed to the client built in defaultAnthropicFactory — const ANTHROPIC_REQUEST_TIMEOUT_MS = 5 * 60 * 1000; const ANTHROPIC_MAX_RETRIES = 2; new AnthropicClient({ apiKey, timeout: ANTHROPIC_REQUEST_TIMEOUT_MS, maxRetries: ANTHROPIC_MAX_RETRIES })'
---
## What it is
This record answers a proof task: the implementation stands at the files under `stands`, and no source was written.
Its build run shows the standing implementation still builds.

## Notes
None.
