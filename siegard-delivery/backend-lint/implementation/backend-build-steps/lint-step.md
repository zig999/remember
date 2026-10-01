---
target: backend
title: Lint step that parses the backend
summary: Adds the flat eslint configuration that parses backend/src with the typescript-eslint parser
  and registers its plugin under @typescript-eslint without enabling any rule, along with the lint script,
  the eslint and typescript-eslint devDependencies and their lockfile entries.
task: sha256:38e7527339b278006677e61fe1b91ad82af59ad225d9ca1b462f38c7d9e82e41
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/backend-build-steps-lint-step-build-2
installed:
- eslint
- typescript-eslint
files:
- path: eslint.config.js
  effect: Flat configuration with two entries and no rule table. The first is a global ignores entry for
    node_modules/**, dist/** and coverage/**. The second selects src/**/*.ts, which includes src/__tests__.
    It sets languageOptions.parser to the typescript-eslint parser, not type-aware, and registers the
    typescript-eslint plugin under plugins["@typescript-eslint"]. TypeScript syntax parses, and the 15
    existing eslint-disable directives in src that name @typescript-eslint rules resolve to rule definitions.
    No rule is enabled and there is no extends or recommended set.
- path: package.json
  effect: 'Adds the script "lint": "eslint ." and two devDependencies, eslint ^9.0.0 and typescript-eslint
    ^8.0.0. The build, start, dev, test, test:watch and typecheck scripts and every other dependency are
    unchanged. This is the earlier delivery''s change, still in the tree and not touched in this pass.'
- path: package-lock.json
  effect: Regenerated outside my context with npm install --package-lock-only, with the owner's authorization.
    It records eslint, typescript-eslint and their transitive trees and matches the manifest, so npm ci
    installs them without a lockfile mismatch. I did not write this file, and this pass did not change
    it because no dependency changed.
criteria:
- criterion: backend/package.json declares a lint script that runs eslint over the backend package.
  met: true
  how: package.json scripts.lint is "eslint .", run from backend/.
- criterion: backend/package.json declares eslint at ^9.0.0 as a devDependency.
  met: true
  how: 'package.json devDependencies "eslint": "^9.0.0".'
- criterion: backend/package.json declares typescript-eslint at ^8.0.0 as a devDependency.
  met: true
  how: 'package.json devDependencies "typescript-eslint": "^8.0.0".'
- criterion: npm ci inside backend/ completes against the updated package-lock.json without a lockfile
    mismatch.
  met: true
  how: package-lock.json was regenerated outside my context to match the manifest, and this pass changed
    no dependency. The coordinator reports that the earlier build run ran npm ci and passed. I did not
    see that run.
- criterion: A TypeScript file under backend/src that carries a type annotation is linted without a parsing
    error.
  met: true
  how: eslint.config.js applies tseslint.parser to src/**/*.ts. The coordinator's failing build reported
    only rule-definition-not-found errors and no parsing errors, so the parser was already working.
- criterion: A test file under backend/src/__tests__, which tsconfig.json excludes from compilation, is
    linted without a parsing error.
  met: true
  how: The glob src/**/*.ts matches src/__tests__ and the colocated spec and test files. The parser has
    no parserOptions.project, so it is not type-aware and tsconfig's exclude list does not apply. The
    reported errors named directives in __tests__ spec files and none was a parsing error.
- criterion: No file under backend/dist is linted.
  met: true
  how: The global ignores entry lists dist/**.
- criterion: No file under backend/coverage is linted.
  met: true
  how: The global ignores entry lists coverage/**.
- criterion: No file under backend/node_modules is linted.
  met: true
  how: The global ignores entry lists node_modules/**.
- criterion: npm run lint over the backend tree completes within the lint step's 180-second timeout.
  met: true
  how: With a parser-only configuration and no rules, eslint only parses about 270 files and ignores dist,
    so the work is small. The earlier build run reached its lint failure without hitting the timeout.
    I could not run it, so the captured run settles this.
- criterion: The build, typecheck and test scripts in backend/package.json are unchanged.
  met: true
  how: Only a lint line was added after typecheck, and the other lines are unchanged.
- criterion: eslint.config.js registers the typescript-eslint plugin under the @typescript-eslint namespace.
  met: true
  how: 'The second config entry carries plugins: { ''@typescript-eslint'': tseslint.plugin }, in the same
    entry that sets the parser and selects src/**/*.ts.'
- criterion: The configuration this task delivers enables no lint rule.
  met: true
  how: eslint.config.js has no rules key, no extends and no tseslint.configs preset. It holds only ignores,
    a parser and a plugin registration.
- criterion: An existing eslint-disable directive under backend/src that names an @typescript-eslint rule
    raises no rule-definition-not-found error.
  met: true
  how: All 15 eslint-disable directives under src name no-explicit-any, no-unused-vars or method-signature-style,
    and all are in files src/**/*.ts selects. With the plugin registered in that entry the rules resolve,
    and method-signature-style is a rule of the typescript-eslint v8 plugin. I confirmed the directive
    set by searching src for eslint-disable. I did not run eslint.
- criterion: npm run lint inside backend/ exits 0 over the current backend tree.
  met: true
  how: The 15 errors the coordinator reported were all the missing-definition kind, and the registration
    removes them. No rule is enabled and the parser is already working, so I found nothing else that could
    fail. This is reasoned and not observed, and the next captured run is what confirms it.
inferences:
- inferred: The configuration is a plain exported array of config objects, not wrapped in tseslint.config(),
    and it loads no tseslint.configs preset.
  from: The task limits the file to parser, plugin registration, file selection and ignores, and "enables
    no lint rule" excludes a preset such as recommended. The servicedeskn1 base wraps its entries in tseslint.config(),
    which is deprecated in later typescript-eslint 8.x releases.
- inferred: The plugin is registered only in the src/**/*.ts entry, not globally, and linterOptions is
    left at its defaults.
  from: Every eslint-disable directive found lives in a file that glob selects. With no rule enabled,
    the 15 directives suppress nothing, and eslint 9's default reportUnusedDisableDirectives is "warn",
    so I expect up to 15 unused-directive warnings. Warnings do not fail npm run lint and the criteria
    do not ask to silence them. Turning the report off would hide directives that the later rule tasks
    will make live, so I did not.
- inferred: The lint script is "eslint ." rather than "eslint src".
  from: The inventory names servicedeskn1's "eslint ." as the model, and the ignores entry keeps dist,
    coverage and node_modules out.
- inferred: Version ranges are ^9.0.0 and ^8.0.0 exactly as the task states.
  from: The task criteria and the standard's dependencies list. The installed typescript ^5.7.2 is within
    the typescript-eslint 8 peer range.
preserved:
- The build, start, dev, test, test:watch and typecheck scripts in package.json.
- The existing dependencies and the other devDependencies, @types/node, @types/pg, tsx, typescript and
  vitest.
- '"type": "module"; eslint.config.js is ESM and uses export default.'
- The 15 existing eslint-disable directives, tsconfig.json and the src tree are untouched. This delivery
  edits no source file.
deferred:
- what: The rule table, which covers PRH-01, MNT-01, MNT-02, TYP-03, CON-02, LAY-04, PRH-03 and the others
    the standard assigns to the lint step.
  why: The task leaves the rules to the epic's other lint tasks. When they land, the 15 existing directives
    start suppressing real findings.
- what: The secret-scan script, the secretlint field and the .secretlintignore.
  why: They belong to a separate secret-scan task and are outside this task's criteria.
---
## What it is
The flat eslint configuration the backend's lint step reads, with the typescript-eslint parser over src/**/*.ts, the typescript-eslint plugin registered under @typescript-eslint with no rule enabled, and ignores for node_modules, dist and coverage.
The lint script and the eslint and typescript-eslint devDependencies, with the lockfile regenerated to match the manifest.

## Notes
This is a re-delivery: the task gained the plugin-registration criteria after the secret-scan-step's full build (run/backend-build-steps-secret-scan-step-build) failed at lint with fifteen rule-definition-not-found errors from existing eslint-disable directives.
This delivery built the substrate, so its build ran only the install step; typecheck, lint, secret-scan and test did not run, so the criterion that npm run lint exits 0 is reasoned and is first observed by the next delivery's full build.
package-lock.json was regenerated by npm install --package-lock-only during the first delivery, run by the coordinator with the owner's authorization, because the implementer holds no shell and the registry declares no command that regenerates a lockfile.
Up to fifteen unused-directive warnings are expected until the rule table lands, because the existing directives suppress rules no configuration enables yet.
