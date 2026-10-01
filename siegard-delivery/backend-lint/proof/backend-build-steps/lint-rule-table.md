---
title: Proof for the lint rule table with its test-file relaxation
summary: One spec drives the real eslint.config.js through ESLint.lintText at a representative path for
  each criterion, and lints the whole backend tree for the exit-0 criterion.
tests:
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a rule only the recommended configuration enables as an error
  proves: typescript-eslint's recommended configuration is applied to TypeScript files under backend/src.
    The representative is @typescript-eslint/no-namespace, which the rule table never restates.
  fails_when: tseslint.configs.recommended is removed from, or narrowed out of, the configuration, so
    a namespace declaration under src is no longer reported at error.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a console call as an error
  proves: A console call in a TypeScript file under backend/src is reported as an error.
  fails_when: no-console is dropped from the src block, or set to warn or off.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a require call as an error
  proves: A require call in a TypeScript file under backend/src is reported as an error.
  fails_when: '@typescript-eslint/no-require-imports is dropped, or set below error.'
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an empty catch block as an error
  proves: An empty catch block is reported as an error.
  fails_when: no-empty is dropped, set below error, or given allowEmptyCatch.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a value annotated with any as an error
  proves: A value annotated with the any type in a non-test TypeScript file under backend/src is reported
    as an error.
  fails_when: no-explicit-any is dropped from the non-test path, or is set to warn there.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an exported function without a declared return type as an error
  proves: An exported function that does not declare its return type is reported as an error.
  fails_when: explicit-module-boundary-types is dropped or set below error, or stops checking return types.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an exported function with an untyped parameter as an error
  proves: An exported function with a parameter whose type is not declared is reported as an error.
  fails_when: explicit-module-boundary-types is dropped or set below error, or stops checking argument
    types.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an unused import as an error
  proves: An unused import in a non-test TypeScript file under backend/src is reported as an error.
  fails_when: no-unused-vars is dropped from the non-test path, set below error, or configured to skip
    imports.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an unused parameter without an underscore prefix as an error
  proves: The boundary of the underscore criterion. A parameter without the underscore is reported, so
    the exemption below depends on the prefix and not on the rule being quiet about parameters.
  fails_when: no-unused-vars stops checking parameters, for example when args is set to none. The exemption
    test would then pass for the wrong reason.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: does not report an unused parameter whose name begins with an underscore
  proves: An unused parameter whose name begins with an underscore is not reported by no-unused-vars.
  fails_when: argsIgnorePattern '^_' is removed or changed so that an underscore-prefixed unused parameter
    is reported.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a function of thirty-one lines as a warning
  proves: A function of thirty-one lines is reported as a warning.
  fails_when: The max-lines-per-function limit is raised above thirty, the severity is not warn, or the
    rule is dropped.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: does not report a function of thirty lines
  proves: A function of thirty lines is not reported by max-lines-per-function.
  fails_when: The limit is lowered below thirty, so a thirty-line function is reported.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a function with four positional parameters as a warning
  proves: A function with four positional parameters is reported as a warning.
  fails_when: The max-params limit is raised above three, the severity is not warn, or the rule is dropped.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: does not report a function with three positional parameters
  proves: A function with three positional parameters is not reported by max-params.
  fails_when: The limit is lowered below three, so a three-parameter function is reported.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a type alias that is not PascalCase as a warning
  proves: A type alias whose name is not PascalCase is reported as a warning.
  fails_when: naming-convention loses its typeLike PascalCase selector, or its severity is not warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an interface that is not PascalCase as a warning
  proves: An interface whose name is not PascalCase is reported as a warning.
  fails_when: naming-convention stops covering interfaces, or its severity is not warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: does not report a PascalCase interface without an I prefix
  proves: An interface named in PascalCase without an I prefix is not reported by naming-convention.
  fails_when: An interface selector is added that requires a prefix, or one that rejects a plain PascalCase
    name.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports no rule at all for a file that reads process.env
  proves: A TypeScript file under backend/src that reads process.env is not reported by any rule in the
    configuration.
  fails_when: A rule that flags process.env access is added to the configuration, such as no-restricted-properties
    or no-process-env. The test asserts that the file draws no message from any rule.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: does not report a pg import under no-restricted-imports
  proves: A TypeScript file under backend/src that imports pg is not reported by no-restricted-imports.
  fails_when: A no-restricted-imports rule, base or typescript-eslint, is configured that restricts pg
    for a file that is not a service file.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a value annotated with any as a warning in a file under src/__tests__
  proves: A value annotated with the any type in a file under backend/src/__tests__ is reported as a warning.
  fails_when: The src/__tests__/**/*.ts glob leaves the relaxation block, or the block stops lowering
    no-explicit-any to warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a value annotated with any as a warning in a *.spec.ts file under src
  proves: A value annotated with the any type in a *.spec.ts file under backend/src is reported as a warning.
  fails_when: The src/**/*.spec.ts glob leaves the relaxation block, or the block stops lowering no-explicit-any
    to warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports a value annotated with any as a warning in a *.test.ts file under src
  proves: A value annotated with the any type in a *.test.ts file under backend/src is reported as a warning.
  fails_when: The src/**/*.test.ts glob leaves the relaxation block, or the block stops lowering no-explicit-any
    to warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an unused import as a warning in a file under src/__tests__
  proves: An unused import in a file under backend/src/__tests__ is reported as a warning.
  fails_when: The src/__tests__/**/*.ts glob leaves the relaxation block, or the block stops lowering
    no-unused-vars to warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an unused import as a warning in a *.spec.ts file under src
  proves: An unused import in a *.spec.ts file under backend/src is reported as a warning.
  fails_when: The src/**/*.spec.ts glob leaves the relaxation block, or the block stops lowering no-unused-vars
    to warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an unused import as a warning in a *.test.ts file under src
  proves: An unused import in a *.test.ts file under backend/src is reported as a warning.
  fails_when: The src/**/*.test.ts glob leaves the relaxation block, or the block stops lowering no-unused-vars
    to warn.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an exported function without a declared return type as an error in a file under src/__tests__
  proves: An exported function without a declared return type in a test file under backend/src is reported
    as an error. This is the src/__tests__ location.
  fails_when: The relaxation block lowers or removes explicit-module-boundary-types for src/__tests__/**/*.ts.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an exported function without a declared return type as an error in a *.spec.ts file under
    src
  proves: An exported function without a declared return type in a test file under backend/src is reported
    as an error. This is the *.spec.ts location.
  fails_when: The relaxation block lowers or removes explicit-module-boundary-types for src/**/*.spec.ts.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: reports an exported function without a declared return type as an error in a *.test.ts file under
    src
  proves: An exported function without a declared return type in a test file under backend/src is reported
    as an error. This is the *.test.ts location.
  fails_when: The relaxation block lowers or removes explicit-module-boundary-types for src/**/*.test.ts.
- file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  name: leaves no file with a lint error, so npm run lint exits 0
  proves: npm run lint inside backend/ exits 0 over the backend tree with the rule table configured. ESLint
    is run over "." with the delivered configuration, the same invocation as the lint script, and every
    severity-2 message must be absent.
  fails_when: Any file in the backend tree, test files and eslint.config.js included, draws an error under
    the configuration. That covers a rule at error with a violation, an unresolved eslint-disable directive,
    and a parse failure.
not_applicable:
- edge_case: absent or empty source text for a file under src
  why: No criterion states what an empty file produces, and the rule table decides nothing about emptiness.
    A test would assert a behavior no obligation states.
- edge_case: a file outside backend/src, such as eslint.config.js at the backend root
  why: Every criterion is scoped to a TypeScript file under backend/src. The tree-wide exit-0 test is
    the only obligation that reaches files elsewhere, and it covers them.
- edge_case: an exported function that does declare its types (the passing side of the explicit-module-boundary-types
    criteria)
  why: The criteria state only the refusal. The implementation delivers nothing else on that rule, and
    a clean function is already exercised by the tree-wide exit-0 test.
- edge_case: two lint runs against one subject at once, or a dependency that fails or answers slowly
  why: Linting is a pure function of the source text and the configuration. No criterion states concurrent
    behavior or behavior on a failing dependency.
- edge_case: a duplicate rule registration, such as the plugin being registered twice
  why: No criterion states it. If it occurs it surfaces as a configuration error, which makes the tree-wide
    lint test and every other test in the file fail. A separate test would be the same evidence twice.
untested:
- The inference that the relaxation block's severity-only entries keep argsIgnorePattern '^_' in test
  files is a behavior the implementation chose, and no criterion or node states it. It is recorded as
  unproven and no test pins it.
- The claim in the implementation record's criterion 'how' text that an I prefix is 'neither required
  nor allowed' is not enforced by the configuration, because the PascalCase format accepts a name such
  as IOrder. The criteria state only that a plain PascalCase interface is not reported, so no test asserts
  a refusal of the prefix. CON-02 says interfaces carry no prefix, but it is not a node this task implements.
- Criterion 1 is evidenced by one representative rule of the recommended configuration (no-namespace).
  The recommended set as a whole, and each of its rules, is not individually proven.
- The inferences that the configuration stays a plain array, that the redundant plugins entry was removed,
  and that the test globs were chosen from the survey are arrangement. No test pins them. That the fifteen
  existing eslint-disable directives still resolve is covered only indirectly, because the tree-wide lint
  test fails on an unresolved rule definition.
- The task implements no specification node, so there is no demonstrates claim and no node fact is left
  undecided.
divergences:
- cites: TST-04
  file: src/__tests__/unit/lint/lint-rule-table.spec.ts
  departure: The unit under test is eslint.config.js at the backend root, which has no path under src
    that the test could mirror. The spec sits in src/__tests__/unit/lint/, beside the earlier lint spec.
  why: Mirroring a root file under src/__tests__ is not possible. Placing it beside the existing lint
    spec keeps the lint tests in one subtree, and moving it would split them.
target: backend
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
implementation: sha256:19d02b4047556ab20a7adc592edd12fffa97383755d243d333976292d253c51d
run: run/backend-build-steps-lint-rule-table-suite
---
## What it is
One spec that drives the delivered eslint.config.js through ESLint.lintText at a representative path for each criterion, and lints the whole backend tree for the exit-0 criterion.

## Notes
Rule-violating fixtures are passed as strings to lintText, so the tree's own lint step never sees them.
The suite passed on its first captured run.
