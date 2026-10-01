# Owner decision, 2026-10-01 — lint passes on the current tree

Shown a probe of the proposed configuration over backend/src (about 360 error-severity findings: naming-convention 311, mostly snake_case variables from database rows and PascalCase Zod schema constants; no-explicit-any 36, all in tests; no-unused-vars 7; explicit-module-boundary-types 4; prefer-const 1), the owner chose:
- @typescript-eslint/naming-convention is set to warn;
- in test files (src/__tests__/**, *.spec.ts, *.test.ts), @typescript-eslint/no-explicit-any and @typescript-eslint/no-unused-vars are set to warn;
- the remaining error-severity findings in non-test source (4 explicit-module-boundary-types, 1 no-unused-vars, 1 prefer-const) are fixed in this delivery;
- npm run lint exits 0 over the backend tree once delivered.
