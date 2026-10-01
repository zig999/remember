---
target: backend
title: Lint rule table with its test-file relaxation
summary: eslint.config.js now applies typescript-eslint recommended plus the approved rule table at the
  owner's severities, with no-explicit-any and no-unused-vars relaxed to warn in test files.
task: sha256:d4c35e545d96674fcafb209e47d4e1a9ab8ecfa73064e33d22bc97bdd8bcb79b
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/backend-build-steps-lint-rule-table-build
files:
- path: eslint.config.js
  effect: Keeps the global ignores (node_modules, dist, coverage) and spreads tseslint.configs.recommended,
    which registers the @typescript-eslint plugin once for all files. A src/**/*.ts block keeps the typescript-eslint
    parser and sets no-console, no-require-imports, no-empty, no-explicit-any, explicit-module-boundary-types
    and no-unused-vars (argsIgnorePattern '^_') to error. It sets max-lines-per-function (30, blank lines
    and comments skipped), max-params (3) and naming-convention to warn. naming-convention checks typeLike
    as PascalCase, variableLike as camelCase, parameter as camelCase with a leading underscore allowed,
    and const variable as camelCase or UPPER_CASE; interfaces carry no I prefix. A final block for src/__tests__/**/*.ts,
    src/**/*.spec.ts and src/**/*.test.ts sets no-explicit-any and no-unused-vars to warn and leaves every
    other rule as the table sets it. No no-restricted-imports or no-restricted-properties rule is configured.
criteria:
- criterion: typescript-eslint's recommended configuration is applied to TypeScript files under backend/src.
  met: true
  how: eslint.config.js spreads tseslint.configs.recommended after the ignores entry. It has no files
    restriction, so it reaches every src/**/*.ts file.
- criterion: A console call in a TypeScript file under backend/src is reported as an error.
  met: true
  how: 'The src/**/*.ts block sets ''no-console'': ''error''. The test block does not touch it.'
- criterion: A require call in a TypeScript file under backend/src is reported as an error.
  met: true
  how: 'The src/**/*.ts block sets ''@typescript-eslint/no-require-imports'': ''error''.'
- criterion: An empty catch block is reported as an error.
  met: true
  how: 'The src/**/*.ts block sets ''no-empty'': ''error''. Its default allowEmptyCatch is false, so an
    empty catch is reported.'
- criterion: A value annotated with the any type in a non-test TypeScript file under backend/src is reported
    as an error.
  met: true
  how: 'The src/**/*.ts block sets ''@typescript-eslint/no-explicit-any'': ''error''. Only the test-file
    block lowers it.'
- criterion: An exported function that does not declare its return type is reported as an error.
  met: true
  how: 'The src/**/*.ts block sets ''@typescript-eslint/explicit-module-boundary-types'': ''error''.'
- criterion: An exported function with a parameter whose type is not declared is reported as an error.
  met: true
  how: The same explicit-module-boundary-types rule at error also checks argument types.
- criterion: A function of thirty-one lines is reported as a warning.
  met: true
  how: '''max-lines-per-function'': [''warn'', { max: 30, skipBlankLines: true, skipComments: true }].
    Thirty-one counted lines exceeds the max.'
- criterion: A function of thirty lines is not reported by max-lines-per-function.
  met: true
  how: max is 30, and the rule reports only lines above the max.
- criterion: A function with four positional parameters is reported as a warning.
  met: true
  how: '''max-params'': [''warn'', { max: 3 }].'
- criterion: A function with three positional parameters is not reported by max-params.
  met: true
  how: max is 3, and the rule reports only counts above the max.
- criterion: An unused import in a non-test TypeScript file under backend/src is reported as an error.
  met: true
  how: 'The src/**/*.ts block sets ''@typescript-eslint/no-unused-vars'': [''error'', ...]. Unused imports
    are in its default scope.'
- criterion: An unused parameter whose name begins with an underscore is not reported by no-unused-vars.
  met: true
  how: 'The rule''s options carry argsIgnorePattern: ''^_''.'
- criterion: A type alias whose name is not PascalCase is reported as a warning.
  met: true
  how: naming-convention is 'warn', with a typeLike selector requiring PascalCase. typeLike covers type
    aliases.
- criterion: An interface named in PascalCase without an I prefix is not reported by naming-convention.
  met: true
  how: No interface selector sets a prefix. The typeLike selector accepts PascalCase, and an I prefix
    is neither required nor allowed.
- criterion: An interface whose name is not PascalCase is reported as a warning.
  met: true
  how: The typeLike selector covers interfaces and requires PascalCase, at warn.
- criterion: A TypeScript file under backend/src that reads process.env is not reported by any rule in
    the configuration.
  met: true
  how: The configuration holds no no-restricted-properties rule, and none of the configured or recommended
    rules inspects process.env.
- criterion: A TypeScript file under backend/src that imports pg is not reported by no-restricted-imports.
  met: true
  how: The configuration holds no no-restricted-imports rule. The service-import boundary belongs to a
    separate task.
- criterion: A value annotated with the any type in a file under backend/src/__tests__ is reported as
    a warning.
  met: true
  how: 'The last block matches src/__tests__/**/*.ts and sets ''@typescript-eslint/no-explicit-any'':
    ''warn''.'
- criterion: A value annotated with the any type in a *.spec.ts file under backend/src is reported as
    a warning.
  met: true
  how: The last block matches src/**/*.spec.ts with the same setting.
- criterion: A value annotated with the any type in a *.test.ts file under backend/src is reported as
    a warning.
  met: true
  how: The last block matches src/**/*.test.ts with the same setting.
- criterion: An unused import in a file under backend/src/__tests__ is reported as a warning.
  met: true
  how: 'The last block sets ''@typescript-eslint/no-unused-vars'': ''warn'' for src/__tests__/**/*.ts.
    A severity-only override keeps the options from the earlier block.'
- criterion: An unused import in a *.spec.ts file under backend/src is reported as a warning.
  met: true
  how: The last block matches src/**/*.spec.ts with the same setting.
- criterion: An unused import in a *.test.ts file under backend/src is reported as a warning.
  met: true
  how: The last block matches src/**/*.test.ts with the same setting.
- criterion: An exported function without a declared return type in a test file under backend/src is reported
    as an error.
  met: true
  how: The last block does not mention explicit-module-boundary-types, so the error set by the src/**/*.ts
    block still applies to test files.
- criterion: npm run lint inside backend/ exits 0 over the backend tree with the rule table configured.
  met: true
  how: 'Not run, because I have no shell. The configuration is the one the owner''s probe measured: every
    rule still at error was reported clean in non-test src after the delivered fixes (the one no-unused-vars,
    four explicit-module-boundary-types and one prefer-const were fixed), and the remaining findings sit
    at warn. The caller''s lint run is what confirms the exit code.'
inferences:
- inferred: The plugins entry that registered '@typescript-eslint' in the src/**/*.ts block is removed.
    tseslint.configs.recommended registers the same plugin object for all files through its base config,
    so keeping it would risk a "Cannot redefine plugin" refusal. The 15 existing eslint-disable directives
    still resolve through the base registration.
  from: backend/node_modules/@typescript-eslint/eslint-plugin/dist/configs/flat/recommended.js, which
    spreads the base config (plugin and parser)
- inferred: The config stays a plain array rather than the tseslint.config(...) helper the servicedeskn1
    base uses, because the lint-step delivery wrote it that way.
  from: the existing backend/eslint.config.js and the caller's instruction to keep its shape
- inferred: The test-file block gives only a severity to no-explicit-any and no-unused-vars. Flat config
    keeps the options of the earlier definition in that case, so argsIgnorePattern '^_' still applies
    in tests.
  from: ESLint flat-config merge behavior for a severity-only rule entry
- inferred: A separate naming-convention selector for interface is left out. The typeLike selector already
    covers interfaces as PascalCase and the I prefix is dropped, so one selector answers both criteria.
  from: the owner's probe configuration, which listed typeLike PascalCase with no interface entry, and
    CON-02, which requires interfaces PascalCase with no prefix
- inferred: The test-file globs are src/__tests__/**/*.ts, src/**/*.spec.ts and src/**/*.test.ts, matching
    the test locations the survey found.
  from: inventory convention on tests living in src/__tests__, colocated *.spec.ts and src/modules/chat/routes/__tests__/*.test.ts
divergences:
- from: /home/siegfriedneto/projects/servicedeskn1/src/eslint.config.js (the base the inventory says to
    reuse)
  departure: max-lines-per-function, max-params and naming-convention are warn instead of error. Interfaces
    carry no I prefix. The domain-module I/O block and the service-import block are not carried over.
    The test-file relaxation block is added.
  why: The owner's decisions after the probe, and the task's own statement of what is left out. The service-import
    boundary is a separate task.
preserved:
- The global ignores for node_modules/**, dist/**, coverage/** stay, so npm run lint does not walk the
  compiled dist.
- The typescript-eslint parser on src/**/*.ts stays.
- The 15 eslint-disable directives in backend/src are untouched. Their @typescript-eslint rule names still
  resolve because the recommended configuration registers the plugin.
- The lint script (eslint .), the tsconfig and the typecheck step are untouched.
---
## What it is
The backend's lint rule table: typescript-eslint recommended plus the approved rules at the owner's severities, on the typescript-eslint parser over src/**/*.ts.
A test-file block that lowers no-explicit-any and no-unused-vars to warn in src/__tests__, *.spec.ts and *.test.ts and leaves every other rule as the table sets it.

## Notes
The captured lint step exits 0 over the tree with 0 errors and 1029 warnings, from max-lines-per-function, naming-convention, max-params and the relaxed test-file rules.
The explicit plugin registration delivered by lint-step is removed, because the recommended configuration registers the same plugin for all files and the fifteen existing directives resolve through it.
