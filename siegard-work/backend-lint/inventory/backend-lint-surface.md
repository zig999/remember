---
title: Backend lint and secret-scan surface
summary: 'The backend tree that the new eslint.config.js and secretlint step will run over: a strict-TypeScript Fastify and MCP monolith with no lint, no secret scan and no secretlint configuration yet.'
sources:
- intake/scope.md
area:
- .
modules:
- name: backend-package-manifest
  path: backend/package.json
  role: touched
- name: backend-secret-ignore
  path: backend/.secretlintignore
  role: touched
- name: backend-eslint-config
  path: backend/eslint.config.js
  role: touched
- name: backend-tsconfig
  path: backend/tsconfig.json
  role: adjacent
- name: backend-gitignore
  path: backend/.gitignore
  role: adjacent
- name: backend-src-modules
  path: backend/src/modules
  role: adjacent
- name: backend-src-tests
  path: backend/src/__tests__
  role: adjacent
- name: backend-standard
  path: standards/backend-node-service.yaml
  role: depends-on
- name: servicedeskn1-eslint-config
  path: /home/siegfriedneto/projects/servicedeskn1/src/eslint.config.js
  role: depends-on
- name: servicedeskn1-manifest
  path: /home/siegfriedneto/projects/servicedeskn1/src/package.json
  role: depends-on
conventions:
- statement: 'Source is ESM with "type": "module", and the tsconfig is strict with noUnusedLocals, noUnusedParameters and noUncheckedIndexedAccess already on, so MNT-02 overlaps what tsc already decides.'
  seen_at: backend/tsconfig.json
- statement: The tsconfig excludes src/**/__tests__/**, *.spec.ts and *.test.ts from compilation. Lint without type-aware parsing (no parserOptions.project) therefore works on every file, while a type-aware setup would fail on the test files.
  seen_at: backend/tsconfig.json
- statement: Tests live in two places, the central src/__tests__/{unit,integration}/ tree and colocated *.spec.ts files beside modules, plus a few *.test.ts under src/modules/chat/routes/__tests__/.
  seen_at: backend/src/modules/chat/routes/__tests__/graph-view.test.ts
- statement: The module layout is src/modules/<module>/{dto,service,repository,routes,mcp,prompts,validation} with *.service.ts, *.repository.ts, *.routes.ts, *.handler.ts and *.dto.ts suffixes. src/shared, src/config, src/middleware and src/mcp sit outside modules.
  seen_at: backend/src/modules/ingestion/service/propose-node.service.ts
- statement: Production code states that it never calls console and logs through pino, so PRH-01 should hold on non-test source.
  seen_at: backend/src/middleware/error-handler.ts
- statement: Interfaces carry no I prefix, which matches CON-02 as adopted. Grep for interface I[A-Z] over src finds none.
  seen_at: backend/src/modules/ingestion/service/propose.types.ts
- statement: 'The servicedeskn1 manifest carries its secretlint configuration as a "secretlint" field with "rules": [] and has no .secretlintrc file. Its .secretlintignore lists node_modules/, dist/ and coverage/.'
  seen_at: /home/siegfriedneto/projects/servicedeskn1/src/package.json
- statement: The standard names the manifest as the secretlint configuration home and requires eslint ^9.0.0, typescript-eslint ^8.0.0, secretlint ^8.0.0 and @secretlint/secretlint-rule-preset-recommend ^8.0.0. Its build commands are npm ci, npm run typecheck, npm run lint and npm run secret-scan.
  seen_at: standards/backend-node-service.yaml
must_not_duplicate:
- what: The servicedeskn1 flat config is the base. Reuse its rule table and its per-file blocks, and drop only the domain-module I/O block and the CON-01 I-prefix on interfaces.
  at: /home/siegfriedneto/projects/servicedeskn1/src/eslint.config.js
- what: The servicedeskn1 "lint" and "secret-scan" script strings ("eslint ." and secretlint "**/*") are the model for the backend scripts.
  at: /home/siegfriedneto/projects/servicedeskn1/src/package.json
- what: The servicedeskn1 .secretlintignore content is the base for the backend one.
  at: /home/siegfriedneto/projects/servicedeskn1/src/.secretlintignore
- what: The existing typecheck script and the strict tsconfig are not to be re-expressed as lint rules where tsc already decides them. Add lint scripts beside them and leave the build and typecheck scripts untouched.
  at: backend/package.json
risks:
- risk: 'The servicedeskn1 secretlint field is "rules": [], which decides nothing. Copied as-is, the backend secret-scan would exit 0 while scanning nothing. The backend field must name @secretlint/secretlint-rule-preset-recommend explicitly.'
  consumers:
  - the registry build phase secret-scan step
  - standards/backend-node-service.yaml SEC-03
- risk: secret-scan over "**/*" with no backend .secretlintignore would walk node_modules, the compiled dist/ (about 4,500 files) and the gitignored backend/.env, which holds real credentials. It would be slow, could trip the 120 s timeout, and could report the local .env. The ignore file needs node_modules/, dist/, coverage/ and .env, and .env.example must remain scannable.
  consumers:
  - the registry build phase secret-scan step
  - any later backend delivery
- risk: The flat config in servicedeskn1 loads no ignores for dist and does not name the test files. With "eslint ." the compiled backend/dist (several thousand JS files) is skipped only through the ignores entry dist/**, so that entry must stay. Test files are not compiled by tsc but would still be linted. Because no-explicit-any, max-lines-per-function and max-params apply there too, a test-file override or an explicit decision is needed.
  consumers:
  - the registry build phase lint step
  - backend/src/__tests__ and colocated *.spec.ts files
- risk: Function length and parameter count are set as warn in this scope (servicedeskn1 used error). There are roughly 510 function declarations across 115 non-test files, and large files such as directed-ingestion.service.ts, chat-agent.service.ts, conversations.routes.ts and curation.repository.ts carry long functions. Many MNT-01 warnings are likely on existing code, but they do not fail the step.
  consumers:
  - the registry build phase lint step output
  - reviewers of later backend deliveries
- risk: LAY-04 (a *.service.ts must not import another service) already has nine violating imports in service files. They include entity-match.service to merge.service, propose-link.service and propose-attribute.service to graph-consolidation.service, propose-node.service to entity-resolution.service, llm-run.service, extraction.service and directed-ingestion.service to ingestion.service, and chat-agent.service to extraction.service. If the rule is set to error, lint fails on first run.
  consumers:
  - the registry build phase lint step
  - src/modules/ingestion/service
  - src/modules/curation/service
  - src/modules/chat/service
- risk: The servicedeskn1 pattern is **/*.service.js, matching ESM imports written with a .js suffix. The backend imports use ./x.service.js too, so the pattern fits. A no-suffix variant would miss them.
  consumers:
  - LAY-04 enforcement across backend/src/modules
- risk: Source already holds about a dozen require( or any matches, but nearly all are prose in comments or prompt strings ("any uncaught exception"). A grep finds no console calls, no I-prefixed interfaces and no empty catch blocks in production code. Real counts for no-explicit-any, explicit-module-boundary-types, naming-convention (snake_case DB-row variables are likely), and unused-vars (tsc already catches those) can only be measured by running eslint once the config exists.
  consumers:
  - the registry build phase lint step
  - the task that adds eslint.config.js
- risk: The PRH-03 rule requiring a description on eslint-disable comments has no stock encoding in servicedeskn1. The unused-disable and require-description setting is in eslint's linterOptions or ESLint core directive comments (a "-- reason" suffix), and has to be written for this scope. Source currently contains no eslint-disable comments, so nothing existing breaks.
  consumers:
  - the task that adds eslint.config.js
  - later backend deliveries that add suppressions
- risk: The backend has no node_modules content for eslint, typescript-eslint or secretlint, and a package-lock.json already exists. Adding devDependencies changes the lockfile, and the build phase runs npm ci, which fails if the lock is out of sync with the manifest.
  consumers:
  - the registry build phase install step (npm ci)
  - backend/package-lock.json
---

## What it is
The survey covers the backend Fastify, MCP and Postgres service as the lint and secret-scan scopes will see it.
It has a manifest with build, dev, test and typecheck scripts and no lint or secret-scan script.
The devDependencies are only @types/node, @types/pg, tsx, typescript and vitest.
There is no eslint.config.js, no secretlint configuration and no .secretlintignore.
The only ignore file is a .gitignore that covers node_modules, dist, .env and coverage.
The src tree holds about 270 files, in src/modules/{ingestion,knowledge-graph,curation,query-retrieval,compliance-audit,chat}, src/shared, src/config, src/middleware, src/mcp and src/__tests__.

## Notes
The base config at servicedeskn1/src/eslint.config.js has the rule table the scope lists, but it sets max-lines-per-function and max-params to error, prefixes interfaces with I, and carries a domain-module I/O block, so those three differ here.
The servicedeskn1 secretlint configuration lives in package.json with an empty rules array, while the standard's own text says the preset must be named.
The survey measured no lint output, because eslint is not installed in the backend; every violation count above is a grep estimate.
The tsconfig is the only compiler configuration, and it excludes the test files that lint will still reach.
