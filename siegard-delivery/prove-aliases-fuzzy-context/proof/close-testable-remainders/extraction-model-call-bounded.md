---
target: backend
title: Proof of extraction-model-call-bounded
summary: 'Two tests over the real Anthropic client that extraction builds: one decides the retry bound on an overloaded model, the other decides the wait bound and the retry bound when the model never answers.'
implementation: sha256:43daa01386dea5ba919e987e59575f6b6caaade1228ef9f2fd4d3ee26588a849
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-model-call-bounded-suite
tests:
- file: src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts
  name: attempts a chunk extraction call at most three times when the model answers overloaded on every attempt
  proves: 'The criterion: "a chunk extraction call to the run model that gets a retryable error (for example 529 overloaded) on every attempt ... is attempted at most three times, meaning it is retried at most twice." The test builds the client with defaultAnthropicFactory, stubs only the network boundary to answer 529 on every attempt, and counts the requests that one call makes.'
  fails_when: The client built by defaultAnthropicFactory retries an overloaded answer more than twice, so one call makes four or more requests. It also fails when the call never reaches the model, because the failure it expects from a refused call is then absent.
- file: src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts
  name: waits at most five minutes per attempt and attempts at most three times when the model never answers
  proves: The UNDERDETERMINED entry and the node's whole statement, "A call to the language model for extraction waits at most five minutes and is retried at most twice." With fake timers, the stubbed network never answers a call. Over a 20-minute window the test measures how long each attempt waited before the client gave up, and how many attempts were made.
  fails_when: 'An attempt is allowed to wait more than five minutes: the delivered client sets no timeout, so the SDK default of ten minutes applies, or it sets a timeout above five minutes. It also fails when a never-answering call is attempted more than three times within the window.'
  demonstrates: constraints/extraction-model-call-bounded
not_applicable:
- edge_case: Absent or empty input to the extraction call (no chunk text, no tools)
  why: The node and the criterion bound the wait and the retries of a model call. Neither states what is required of the request's content, so no obligation reaches this class.
- edge_case: A non-retryable error (for example 400 or 401) and a model that answers on a later attempt
  why: Neither the node nor the criterion states what happens for these classes. They fix only upper bounds, so a test would pin the SDK's retry policy, which is a behavior no node decides.
- edge_case: Two chunk calls at once or in sequence on one client
  why: The bound is carried by the client options and the SDK applies it per request. Each request gets its own budget of at most three attempts, so a second chunk call would restate the same at-most bound and protect nothing the first test does not.
- edge_case: A dependency that fails or answers slowly
  why: This is exactly the class the two tests cover, with a refused model for the retry bound and a silent model for the wait bound.
untested:
- That runLlmExtraction uses defaultAnthropicFactory when no factory is injected. The tests exercise the client the factory builds, because the bound lives there. Driving it through runLlmExtraction needs the store and the context-reading call stubbed as well, and no node states that wiring. It rests on a reading of the line `deps.anthropicFactory ?? defaultAnthropicFactory`.
- That the retry bound is counted per chunk rather than per run. The delivered bound lives on the SDK client and applies per request. Only the "at most" is decidable here, and a shared budget across chunks would still satisfy it, so no test excludes that implementation. The node never says that extraction makes one call per chunk. That fact comes from nodes outside the claim, as the task's ADVISORY entry recorded.
- That the wait bound holds across retried attempts as a total. The node says "waits at most five minutes". The test pins the bound per attempt, since the node does not say whether the five minutes cover one attempt or the call as a whole, and that reading is the implementation's, with no node deciding it.
contested:
- what: The test that carries demonstrates for constraints/extraction-model-call-bounded decides the retry bound only for a model that never answers, and the 529 test decides it only for the overloaded case.
  why: The node states one bound for "a call to the language model for extraction", whatever the retryable condition. The delivered code sets it in one place, on the client options, so both tests exercise the same setting. A reviewer who reads the node as requiring each retryable condition to be exercised under demonstrates will find the claim covers the node through two tests, not one.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts
  departure: The file sits in src/__tests__/unit/ingestion/ beside the other extraction specs rather than mirroring the unit's path src/modules/ingestion/service/ under the unit subtree.
  why: Every existing extraction spec sits in that directory and the tree has no mirrored layout yet. Placing one file differently would split the extraction specs across two layouts.
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
