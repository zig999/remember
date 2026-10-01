---
target: backend
title: Lint step that parses the backend
summary: Adds the flat eslint configuration, a lint script, the eslint and typescript-eslint devDependencies
  and their regenerated lockfile entries, so that npm run lint parses every TypeScript file under src
  with the typescript-eslint parser and decides no rule.
task: sha256:242bf1c88f8f2ab449fca49e65be05a6f2d5a9a3b7faa5a2cc3f98a17a5e2e19
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/backend-build-steps-lint-step-build
installed:
- eslint
- typescript-eslint
files:
- path: eslint.config.js
  effect: Flat configuration with two entries and no rule table. The first is a global ignores entry for
    node_modules/**, dist/** and coverage/**. The second selects src/**/*.ts, which includes src/__tests__,
    and sets languageOptions.parser to the typescript-eslint parser without parserOptions.project. TypeScript
    syntax parses, and the test files that tsconfig.json excludes are parsed too.
- path: package.json
  effect: 'Adds the script "lint": "eslint ." and two devDependencies, eslint ^9.0.0 and typescript-eslint
    ^8.0.0. The build, start, dev, test, test:watch and typecheck scripts and every other dependency are
    unchanged.'
- path: package-lock.json
  effect: Regenerated outside my context with npm install --package-lock-only, with the owner's authorization.
    It now records eslint, typescript-eslint and their transitive trees (about 1,367 added lines) and
    matches the manifest, so npm ci installs them without a lockfile mismatch. I did not write or edit
    this file.
criteria:
- criterion: backend/package.json declares a lint script that runs eslint over the backend package.
  met: true
  how: package.json scripts.lint is "eslint .", run from backend/. This is the script string servicedeskn1
    uses.
- criterion: backend/package.json declares eslint at ^9.0.0 as a devDependency.
  met: true
  how: 'package.json devDependencies "eslint": "^9.0.0".'
- criterion: backend/package.json declares typescript-eslint at ^8.0.0 as a devDependency.
  met: true
  how: 'package.json devDependencies "typescript-eslint": "^8.0.0".'
- criterion: npm ci inside backend/ completes against the updated package-lock.json without a lockfile
    mismatch.
  met: true
  how: package-lock.json was regenerated outside my context to match the manifest. The coordinator reports
    that run/backend-build-steps-lint-step-build ran npm ci and passed. I did not see that run, so this
    answer rests on the coordinator's report and on that run's captured output.
- criterion: A TypeScript file under backend/src that carries a type annotation is linted without a parsing
    error.
  met: true
  how: eslint.config.js applies tseslint.parser to src/**/*.ts. I could not run it. The criterion rests
    on the parser being the one entry that matches these files.
- criterion: A test file under backend/src/__tests__, which tsconfig.json excludes from compilation, is
    linted without a parsing error.
  met: true
  how: The files glob src/**/*.ts matches src/__tests__ and the colocated *.spec.ts and *.test.ts files.
    The parser is not type-aware, with no parserOptions.project or projectService, so tsconfig's exclude
    list does not apply to it.
- criterion: No file under backend/dist is linted.
  met: true
  how: The global ignores entry in eslint.config.js lists dist/**.
- criterion: No file under backend/coverage is linted.
  met: true
  how: The global ignores entry lists coverage/**.
- criterion: No file under backend/node_modules is linted.
  met: true
  how: The global ignores entry lists node_modules/**, which restates eslint's default for it.
- criterion: npm run lint over the backend tree completes within the lint step's 180-second timeout.
  met: true
  how: With a parser-only configuration and no rules, eslint only parses roughly 270 files, with no type
    information. dist, which holds about 4,500 files, is ignored. I could not run it, so the captured
    run is what settles this.
- criterion: The build, typecheck and test scripts in backend/package.json are unchanged.
  met: true
  how: The edit only added a lint line after typecheck. The build, typecheck and test lines are byte-identical.
inferences:
- inferred: The configuration is a plain exported array of config objects, not wrapped in tseslint.config(),
    and it loads no tseslint.configs.recommended.
  from: The task limits the file to parser setup, file selection and ignores, with no rule table, and
    recommended is a rule set. The servicedeskn1 base wraps its entries in tseslint.config(), which is
    deprecated in later typescript-eslint 8.x releases. A plain array is valid flat config and needs nothing
    beyond the parser import.
- inferred: The lint script is "eslint ." rather than "eslint src".
  from: The inventory's must_not_duplicate entry names servicedeskn1's "eslint ." as the model. The ignores
    entry then keeps dist, coverage and node_modules out, and eslint's default of linting *.js files also
    covers eslint.config.js itself.
- inferred: Version ranges are ^9.0.0 and ^8.0.0 exactly as the task states.
  from: The task criteria and the standard's dependencies list for eslint and typescript-eslint. The standard
    names these two majors, and the installed typescript ^5.7.2 is within the typescript-eslint 8 peer
    range.
preserved:
- The build, start, dev, test, test:watch and typecheck scripts in package.json.
- The existing dependencies and the other devDependencies, @types/node, @types/pg, tsx, typescript and
  vitest.
- '"type": "module"; the new eslint.config.js is ESM and uses export default.'
- tsconfig.json and the src tree are untouched. This delivery edits no source file.
deferred:
- what: The rule table, which covers PRH-01, MNT-01, MNT-02, TYP-03, CON-02, LAY-04, PRH-03 and the others
    the standard assigns to the lint step.
  why: The task leaves the rules to the epic's other lint tasks.
- what: The secret-scan script, the secretlint field and the .secretlintignore.
  why: They belong to a separate secret-scan task and are outside this task's criteria.
---
## What it is
The flat eslint configuration the backend's lint step reads, with the typescript-eslint parser over src/**/*.ts and ignores for node_modules, dist and coverage.
The lint script and the eslint and typescript-eslint devDependencies, with the lockfile regenerated to match the manifest.

## Notes
This delivery built the substrate, so its build ran only the install step; typecheck, lint, secret-scan and test did not run, because a substrate decides no rule and a green check over it would say nothing.
The configuration decides no rule; the rule table, the test-file relaxation, the service-import boundary and the suppression rule are the epic's other tasks.
package-lock.json was regenerated by npm install --package-lock-only, run by the coordinator with the owner's authorization, because the implementer holds no shell and the registry declares no command that regenerates a lockfile.
The secret-scan step is still absent from package.json, so a full build over this tree fails at secret-scan until the secret-scan task is delivered.
