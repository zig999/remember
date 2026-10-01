---
title: Lint step that parses the backend
summary: The eslint flat configuration, lint script and lint devDependencies that let the backend's lint step parse its TypeScript.
rationale: This task builds eslint.config.js, which the standard presupposes and the tree does not hold, and it implements nothing. It answers to no specification node because the specification holds what the business decided, and how this project is built is not a business decision. Parsing and file selection are cut apart from the rule table because the parser setup and the ignores change with the toolchain and the tree layout, while each rule changes with the standard.
sources:
  - intake/scope.md
objective: Running npm run lint inside backend/ parses every TypeScript file under src with the typescript-eslint parser instead of failing on the first type annotation.
criteria:
  - backend/package.json declares a lint script that runs eslint over the backend package.
  - backend/package.json declares eslint at ^9.0.0 as a devDependency.
  - backend/package.json declares typescript-eslint at ^8.0.0 as a devDependency.
  - npm ci inside backend/ completes against the updated package-lock.json without a lockfile mismatch.
  - A TypeScript file under backend/src that carries a type annotation is linted without a parsing error.
  - A test file under backend/src/__tests__, which tsconfig.json excludes from compilation, is linted without a parsing error.
  - No file under backend/dist is linted.
  - No file under backend/coverage is linted.
  - No file under backend/node_modules is linted.
  - npm run lint over the backend tree completes within the lint step's 180-second timeout.
  - The build, typecheck and test scripts in backend/package.json are unchanged.
produces:
  - eslint.config.js
---
## What it is
The flat configuration the lint step reads its parser from, with the dist, coverage and node_modules ignores.
The lint script and the eslint and typescript-eslint devDependencies in the manifest, with the lockfile kept in sync for npm ci.

## Notes
This task decides none of the standard's rules; the rule set is cut into the epic's other lint tasks.
Parsing is not type-aware, because tsconfig.json excludes the test files that lint still reaches.
