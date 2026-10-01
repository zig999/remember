---
title: Lint-green backend tree
summary: The fixes to the six remaining error-severity findings in non-test source that let npm run lint exit 0 over the backend tree.
rationale: The owner's lint-green decision states the fixes and the exit-0 outcome. I cut them apart from the configuration tasks because they change backend source files, not eslint.config.js, which is a different seam. The task depends on the tasks whose severities decide whether lint exits 0 over the tree.
sources:
  - intake/lint-green.md
objective: npm run lint exits 0 over the backend tree, with the remaining error-severity findings in non-test source fixed rather than suppressed.
criteria:
  - npm run lint inside backend/ exits 0 over the backend tree.
  - explicit-module-boundary-types reports no finding in non-test source under backend/src.
  - no-unused-vars reports no error-severity finding in non-test source under backend/src.
  - prefer-const reports no finding in non-test source under backend/src.
  - None of the fixed findings is cleared by an eslint-disable comment.
  - None of the fixed findings is cleared by a change to eslint.config.js.
  - npm run typecheck inside backend/ exits 0 after the fixes.
depends_on:
  - task/backend-build-steps/lint-rule-table
  - task/backend-build-steps/test-file-relaxation
  - task/backend-build-steps/service-import-boundary
---
## What it is
The four explicit-module-boundary-types findings, the one no-unused-vars finding and the one prefer-const finding in non-test source, each fixed in the file that carries it.

## Notes
The counts are those of the probe shown to the owner; the configuration as delivered is what decides the findings.
