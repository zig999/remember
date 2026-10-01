---
title: Remaining non-test lint findings fixed
summary: The fixes to the six remaining error-severity findings in non-test source, stated as properties of the source rather than as rule output.
rationale: The owner's lint-green decision states the fixes, and the owner's re-cut decision places them before the rule table. I cut them apart from the rule table because they change backend source files, not eslint.config.js, which is a different seam. The criteria describe the source itself, so they can be judged before any rule is configured.
sources:
  - intake/lint-green.md
  - intake/replan-lint-order.md
objective: Non-test source under backend/src carries none of the declarations that the proposal's error-severity rules would refuse.
criteria:
  - Every function exported from a non-test module under backend/src declares its return type.
  - Every parameter of a function exported from a non-test module under backend/src declares its type.
  - No import, variable or parameter in non-test source under backend/src is declared and never used, apart from a parameter whose name begins with an underscore.
  - No let declaration in non-test source under backend/src is left without a reassignment.
  - None of the fixes adds an eslint-disable comment.
  - npm run typecheck inside backend/ exits 0 after the fixes.
  - npm run lint inside backend/ exits 0 over the backend tree after the fixes.
---
## What it is
The four exported declarations missing explicit types, the one unused binding and the one never-reassigned let in non-test source, each fixed in the file that carries it.

## Notes
The counts are those of the probe shown to the owner; the configuration as delivered is what decides the findings.
