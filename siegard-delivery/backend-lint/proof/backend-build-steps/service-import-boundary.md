---
target: backend
title: Proof for the service-import boundary warning
summary: Linting code strings and the real service files shows the **/*.service.js restriction warns in
  *.service.ts, stays silent in other imports and in *.repository.ts, and raises no error over the existing
  services.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
tests:
- file: src/__tests__/unit/lint/service-import-boundary.spec.ts
  name: reports a service file importing a module whose path ends in .service.js as a warning
  proves: A *.service.ts file importing a module through a path ending in .service.js is reported as a
    warning.
  fails_when: The src/**/*.service.ts block is removed. It also fails if the pattern loses the .js suffix,
    if the severity becomes error or off, or if the pattern stops matching a ./other.service.js specifier.
- file: src/__tests__/unit/lint/service-import-boundary.spec.ts
  name: does not report a service file importing a module whose path does not end in .service.js
  proves: A *.service.ts file importing a module whose path does not end in .service.js is not reported
    by this rule.
  fails_when: The restricted group widens to match imports that are not .service.js, for example a catch-all
    pattern or one that restricts ./other.repository.js.
- file: src/__tests__/unit/lint/service-import-boundary.spec.ts
  name: does not report a repository file importing a module whose path ends in .service.js
  proves: A *.repository.ts file importing a module through a path ending in .service.js is not reported
    by this rule.
  fails_when: The restriction is applied outside src/**/*.service.ts, for example by moving it into the
    src/**/*.ts block, so a *.repository.ts file draws a no-restricted-imports message.
- file: src/__tests__/unit/lint/service-import-boundary.spec.ts
  name: raises no error-severity finding from the rule over the existing service files
  proves: The existing service-to-service imports under backend/src/modules raise no error-severity finding
    from this rule.
  fails_when: no-restricted-imports is set to error for src/**/*.service.ts, or any real service file
    under src/modules draws a no-restricted-imports message at error severity.
not_applicable:
- edge_case: Absent or empty source text for the linted file
  why: The criteria concern which import specifiers the rule reports. A file with no imports reaches no
    criterion, and the existing rule-table spec already lints a file with no restricted import.
- edge_case: A .service.spec.ts or .service.test.ts file importing a .service.js module
  why: No criterion or node states the rule's behavior for test files. The implementation's inference
    on this point is recorded under untested.
- edge_case: An extensionless import specifier such as ./other.service
  why: No criterion states this case. The task note only says the .js suffix matches the backend's ESM
    specifiers. The criterion 1 test already shows the .js-suffixed form is the one reported.
- edge_case: Boundary values or collections for the rule's input
  why: The input is an import specifier, and the obligations treat all specifiers alike apart from the
    .service.js suffix and the file kind. That gives three classes (matching service file, non-matching
    service file, repository file), each with one representative.
- edge_case: Dependency failure or concurrency
  why: The lint step has no dependency whose failure or slowness is stated by a criterion, and no state
    shared between operations.
untested:
- 'Inference recorded by the implementation: the block covers a .service.spec.ts or .service.test.ts file
  only if the name also ends in .service.ts. This is behavior no node or criterion decides, so the suite
  does not pin it.'
- The count of nine warnings across the existing tree is not asserted. The criterion states only that
  no error-severity finding arises, and the nine is the owner's probe figure and an observation in the
  delivery notes. A test on that count would break when the owner refactors those imports, which the task
  explicitly leaves free.
- That the lint step exits 0 over the whole tree is already covered by the earlier lint-rule-table spec,
  which asserts no error-severity message anywhere. This proof does not repeat it.
- The task implements no specification node, so no test carries demonstrates.
implementation: sha256:56a00154ee22f0d84f503b5c6bfdc444a300275d4cc4e6bcfe049aa045244b29
run: run/backend-build-steps-service-import-boundary-suite
---
## What it is
One spec that lints code strings through the delivered configuration at service and repository paths, and lints the real service files for error-severity findings from the rule.

## Notes
The count of nine existing warnings is deliberately not asserted, so refactoring those imports does not break the proof.
The suite passed on its first captured run.
