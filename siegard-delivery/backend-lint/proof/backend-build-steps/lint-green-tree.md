---
title: Proof that non-test source under backend/src carries none of the refused declarations
summary: One spec runs the typescript-eslint rules the criteria describe over every non-test file under
  backend/src, and a second check scans the five files this task wrote for eslint directive comments.
target: backend
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
tests:
- file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  name: declares a return type on every exported function
  proves: Every function exported from a non-test module under backend/src declares its return type.
  fails_when: any exported function, arrow-function export or exported class method in non-test source
    under src has no declared return type (for example buildChatTurnRequestSchema, buildSendMessageRequestSchema
    or either mapErrorToEnvelope reverts to an inferred return type)
- file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  name: declares a type on every parameter of an exported function
  proves: Every parameter of a function exported from a non-test module under backend/src declares its
    type.
  fails_when: any parameter of an exported function in non-test source under src has no declared type
- file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  name: leaves no import, variable or parameter declared and never used, apart from underscore-prefixed
    parameters
  proves: No import, variable or parameter in non-test source under backend/src is declared and never
    used, apart from a parameter whose name begins with an underscore.
  fails_when: any non-test file under src declares an import, variable or non-underscore parameter that
    is never read (for example the removed `_drop` rest-destructure binding in chat-agent.service.ts comes
    back)
- file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  name: leaves no let declaration without a reassignment
  proves: No let declaration in non-test source under backend/src is left without a reassignment.
  fails_when: any non-test file under src has a `let` that is never reassigned (for example rejectRateByCode
    in curation.repository.ts goes back to let)
- file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  name: adds no eslint-disable comment to any file this task wrote
  proves: None of the fixes adds an eslint-disable comment.
  fails_when: any of the five files this task wrote (chat.schemas.ts, chat-agent.service.ts, both error-envelope.ts,
    curation.repository.ts) holds a comment whose text contains an eslint-disable or eslint-enable directive
not_applicable:
- edge_case: absent, empty, duplicate or out-of-range input; concurrent operations; a failing or slow
    dependency
  why: the criteria describe declarations in source text, not a runtime behavior with inputs, so none
    of these classes is reached; the one input a test has is the set of files under src, and the run guards
    that set (it fails loudly if a written file is not linted or a file cannot be parsed) rather than
    treating an empty set as a pass
untested:
- Criterion 'npm run typecheck inside backend/ exits 0 after the fixes' is decided by the typecheck step
  of the captured run (a registry command), not by a vitest test; a test that spawned tsc would repeat
  that step.
- 'Criterion ''npm run lint inside backend/ exits 0 over the backend tree after the fixes'' is decided
  by the lint step of the captured run, but that step cannot decide the findings yet: eslint.config.js
  enables no rule, so it exits 0 over any source. The four declaration tests above are what decide the
  findings, with the rules configured inside the test; the exit code itself is left to the run.'
- The rule options inside the spec (explicit-module-boundary-types at its defaults, no-unused-vars with
  argsIgnorePattern ^_, prefer-const at its defaults) are my reading of the criteria's wording, not the
  rule table the later task configures; if that table sets different options, the criteria are judged
  here by the options in the spec.
- The totality in criteria 1 and 2 ('every function exported') is decided only as far as explicit-module-boundary-types
  inspects exports; an export form the rule does not inspect is not proven.
- 'The behavior that must keep holding after the rewrite (schema validation messages, error mapping, the
  agent loop, the tool input schema minus $schema, every SQL statement, aggregateCurationMetrics rows)
  is not given a new test: no criterion or node states it, and a rearrangement that preserves behavior
  is proven by the existing tests. Those are modules/chat/routes/__tests__/chat.schemas.spec.ts, both
  modules/*/mcp/error-envelope.spec.ts, modules/chat/service/__tests__/build-tool-descriptors.spec.ts,
  __tests__/unit/chat/chat-agent.service.spec.ts, and the reject_rate_by_code cases in __tests__/integration/curation/routes.spec.ts.
  I did not read whether those integration cases run the real aggregateCurationMetrics SQL or a stand-in
  for it.'
- The implementation inference that `delete clean['$schema']` on a spread copy equals the former rest-destructure
  is a behavior inference (same resulting object). It is not pinned by a new test. The existing build-tool-descriptors.spec.ts
  cases assert that $schema is undefined and that properties and enum survive, which covers the observable
  result.
- The implementation's arrangement inferences (the z.ZodObject spelling of the schema builders' return
  types, the ErrorEnvelope type as the declared return type, removal of every comment) get no test, because
  a test would pin the shape of the code.
- The task implements no specification node, so no test carries `demonstrates` and no node is left undecided.
divergences:
- cites: TST-04
  file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  departure: the spec sits under src/__tests__/unit/lint/ and does not mirror the path of a single unit
    under test.
  why: the obligations are over the whole non-test source tree and the eslint configuration, not one module,
    so no unit path exists to mirror; the file is placed in the unit subtree beside the suite's existing
    specs.
implementation: sha256:d1f1d53596943f718de852f4c03e95180b3e2a49c18a0dc46ad8ce1d6113e7f5
run: run/backend-build-steps-lint-green-tree-suite
---
## What it is
One spec that runs explicit-module-boundary-types, no-unused-vars and prefer-const, configured inside the test, over every non-test file under backend/src, and checks the five rewritten files for eslint directive comments.

## Notes
The rule options inside the spec are the test author's reading of the criteria, not the rule table a later task configures.
The suite passed on its first captured run.
