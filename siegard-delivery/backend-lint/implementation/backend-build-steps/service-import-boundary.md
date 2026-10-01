---
target: backend
title: Service-import boundary as a warning
summary: A src/**/*.service.ts block was added to backend/eslint.config.js. It reports as a warning every
  import whose path matches **/*.service.js.
task: sha256:b9fe29b4fcaec7ec87762a509d2956ba3907fef7753f7d00fc3fadb07ad854f9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/backend-build-steps-service-import-boundary-build
files:
- path: eslint.config.js
  effect: Adds one flat-config block, placed after the src/**/*.ts rule table and before the test-file
    relaxation block. The block applies to src/**/*.service.ts and sets no-restricted-imports to warn
    with the pattern group **/*.service.js. Service files that import another service module now draw
    a warning from the lint step. Files of any other suffix are outside the block, so they are not reported.
    No other block was changed.
criteria:
- criterion: A *.service.ts file importing a module through a path ending in .service.js is reported as
    a warning.
  met: true
  how: 'The new block in eslint.config.js has files [''src/**/*.service.ts''] and sets ''no-restricted-imports''
    to [''warn'', { patterns: [{ group: [''**/*.service.js''] }] }]. The pattern carries the .js suffix,
    which is how the backend writes its ESM specifiers. A grep over *.service.ts found 9 import lines
    ending in service.js across 8 files, which matches the owner''s probe of 9 warnings. I did not run
    lint.'
- criterion: A *.service.ts file importing a module whose path does not end in .service.js is not reported
    by this rule.
  met: true
  how: The restricted group is only **/*.service.js, so imports of repository, dto, shared or pg modules
    do not match. No other pattern or path is restricted in the block.
- criterion: A *.repository.ts file importing a module through a path ending in .service.js is not reported
    by this rule.
  met: true
  how: The block's files glob is src/**/*.service.ts, so *.repository.ts files are outside it. No other
    block in eslint.config.js sets no-restricted-imports. typescript-eslint's recommended preset does
    not set it either.
- criterion: The existing service-to-service imports under backend/src/modules raise no error-severity
    finding from this rule.
  met: true
  how: The rule is set to 'warn', never 'error', so the 9 existing service-to-service imports are warnings
    and do not change the exit code of npm run lint. Both the lint-rule-table spec assertions (a pg import
    in a non-service file is not reported; a file reading process.env draws no message) concern files
    outside the new block's glob and rules.
inferences:
- inferred: The block sits between the src/**/*.ts rule table and the test-file relaxation block.
  from: The caller said to add the block without changing any other block. The rule keys are disjoint,
    so the position has no effect on resolution, and this one keeps the relaxation block last as delivered.
- inferred: The block sets no parser. It inherits tseslint.parser from the src/**/*.ts block, which also
    matches these files.
  from: Flat config merges matching blocks. The caller's probe config and the servicedeskn1 base show
    the same pattern.
- inferred: The block applies to .service.spec.ts or .service.test.ts files only if they also end in .service.ts,
    so test files are not covered.
  from: The task states the scope as src/**/*.service.ts, and no node or criterion names test files for
    this rule.
preserved:
- The global ignores block, tseslint.configs.recommended, the src/**/*.ts rule table and the test-file
  relaxation block are unchanged.
- npm run lint keeps exiting 0, because the added rule is warn-severity only.
- The spec src/__tests__/unit/lint/lint-rule-table.spec.ts keeps passing. It asserts that a pg import
  in a non-service file draws no no-restricted-imports message, and that a file reading process.env draws
  no message.
deferred:
- what: The 9 existing service-to-service imports are not refactored. They are in propose-node, directed-ingestion,
    propose-attribute, llm-run, extraction and propose-link under ingestion, in entity-match under curation,
    and twice in chat-agent under chat.
  why: The task reports them as warnings only, and the owner's warn-severity decision is tied to them.
    Refactoring them reaches outside this task's objective.
---
## What it is
A flat-config block over src/**/*.service.ts that sets no-restricted-imports to warn for any import path matching **/*.service.js.

## Notes
The captured lint step reports the nine existing service-to-service imports as warnings and exits 0.
Refactoring those imports is future work by the owner's decision.
