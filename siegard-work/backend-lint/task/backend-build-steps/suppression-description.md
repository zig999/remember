---
title: Described lint suppressions
summary: The lint encoding that refuses an eslint-disable comment carrying no stated reason.
rationale: PRH-03 is cut apart from the rule table because the inventory found no ready-made encoding for it in the servicedeskn1 base, so it rests on a mechanism of its own that changes for reasons the rule table does not share.
sources:
  - intake/scope.md
objective: The lint step reports every eslint-disable directive in a TypeScript file under backend/src that carries no description.
criteria:
  - An eslint-disable block comment with no description is reported.
  - An eslint-disable-next-line comment with no description is reported.
  - An eslint-disable-line comment with no description is reported.
  - An eslint-disable-next-line comment followed by a -- description is not reported by this rule.
---
## What it is
The configuration that makes an eslint-disable directive without a stated reason a lint finding.

## Notes
The scope names only eslint and typescript-eslint as lint devDependencies.
The standard's dependencies list no eslint plugin besides typescript-eslint.
The inventory found no eslint-disable comments in backend/src.
