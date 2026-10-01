---
title: Lint rule table with its test-file relaxation
summary: The rules of the approved proposal on the servicedeskn1 base, at the owner's severities, with no-explicit-any and no-unused-vars relaxed to warn in test files.
rationale: The scope lists the rules as one proposal. I grouped every rule that applies to all of src into one rule table. The test-file relaxation sits in this task by the owner's re-cut decision. The service-import boundary is cut apart because it applies only to service files and rests on an owner decision of its own. The task builds on the non-test fixes so that its build passes lint as it lands.
sources:
  - intake/scope.md
  - intake/lint-green.md
  - intake/replan-lint-order.md
objective: The lint step reports, at the severity the proposal and the owner's decisions give, every violation of the proposal's whole-source rules in a TypeScript file under backend/src, and exits 0 over the backend tree.
criteria:
  - typescript-eslint's recommended configuration is applied to TypeScript files under backend/src.
  - A console call in a TypeScript file under backend/src is reported as an error.
  - A require call in a TypeScript file under backend/src is reported as an error.
  - An empty catch block is reported as an error.
  - A value annotated with the any type in a non-test TypeScript file under backend/src is reported as an error.
  - An exported function that does not declare its return type is reported as an error.
  - An exported function with a parameter whose type is not declared is reported as an error.
  - A function of thirty-one lines is reported as a warning.
  - A function of thirty lines is not reported by max-lines-per-function.
  - A function with four positional parameters is reported as a warning.
  - A function with three positional parameters is not reported by max-params.
  - An unused import in a non-test TypeScript file under backend/src is reported as an error.
  - An unused parameter whose name begins with an underscore is not reported by no-unused-vars.
  - A type alias whose name is not PascalCase is reported as a warning.
  - An interface named in PascalCase without an I prefix is not reported by naming-convention.
  - An interface whose name is not PascalCase is reported as a warning.
  - A TypeScript file under backend/src that reads process.env is not reported by any rule in the configuration.
  - A TypeScript file under backend/src that imports pg is not reported by no-restricted-imports.
  - A value annotated with the any type in a file under backend/src/__tests__ is reported as a warning.
  - A value annotated with the any type in a *.spec.ts file under backend/src is reported as a warning.
  - A value annotated with the any type in a *.test.ts file under backend/src is reported as a warning.
  - An unused import in a file under backend/src/__tests__ is reported as a warning.
  - An unused import in a *.spec.ts file under backend/src is reported as a warning.
  - An unused import in a *.test.ts file under backend/src is reported as a warning.
  - An exported function without a declared return type in a test file under backend/src is reported as an error.
  - npm run lint inside backend/ exits 0 over the backend tree with the rule table configured.
depends_on:
  - task/backend-build-steps/lint-green-tree
---
## What it is
The servicedeskn1 rule table applied to backend/src: no-console, no-require-imports, no-empty, no-explicit-any, explicit-module-boundary-types and no-unused-vars as errors.
naming-convention, max-lines-per-function at thirty and max-params at three are set as warnings.
The interface naming carries no I prefix, and the servicedeskn1 domain-module I/O block is left out.
A file block for src/__tests__/**, *.spec.ts and *.test.ts sets no-explicit-any and no-unused-vars to warn and leaves every other rule as the table sets it.

## Notes
The owner set naming-convention to warn after a probe found 311 findings, mostly snake_case variables from database rows and PascalCase Zod schema constants.
The probe the owner saw found all 36 no-explicit-any findings in test files.
