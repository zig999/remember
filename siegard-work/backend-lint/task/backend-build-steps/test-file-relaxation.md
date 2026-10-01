---
title: Test-file lint relaxation
summary: The file block that turns no-explicit-any and no-unused-vars down to warn in the backend's test files.
rationale: The owner's lint-green decision states the relaxation. I cut it apart from the rule table because it is a separate file block over the test files, and its severities change with decisions about tests, not with the standard's rules.
sources:
  - intake/lint-green.md
objective: In the backend's test files, the lint step reports no-explicit-any and no-unused-vars findings as warnings instead of errors.
criteria:
  - A value annotated with the any type in a file under backend/src/__tests__ is reported as a warning.
  - A value annotated with the any type in a *.spec.ts file under backend/src is reported as a warning.
  - A value annotated with the any type in a *.test.ts file under backend/src is reported as a warning.
  - An unused import in a file under backend/src/__tests__ is reported as a warning.
  - An unused import in a *.spec.ts file under backend/src is reported as a warning.
  - An unused import in a *.test.ts file under backend/src is reported as a warning.
  - An exported function without a declared return type in a test file under backend/src is reported as an error.
depends_on:
  - task/backend-build-steps/lint-rule-table
---
## What it is
A file block for src/__tests__/**, *.spec.ts and *.test.ts that sets no-explicit-any and no-unused-vars to warn and leaves every other rule as the rule table sets it.

## Notes
The probe the owner saw found all 36 no-explicit-any findings in test files.
