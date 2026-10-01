# Owner decisions, 2026-10-01 — lint plan re-cut after the first full build

Observed: the secret-scan-step's full build (run/backend-build-steps-secret-scan-step-build) failed at the lint step with 15 errors "Definition for rule '@typescript-eslint/<rule>' was not found". backend/src holds 15 existing eslint-disable directives naming @typescript-eslint rules (no-explicit-any, no-unused-vars, method-signature-style), none carrying a `--` description; the lint-step configuration sets the typescript-eslint parser but registers no plugin, so the directives name rules eslint does not know. The inventory had recorded no eslint-disable comments in backend/src.

The owner chose:
1. The lint-step task gains the requirement that the configuration registers the typescript-eslint plugin under the @typescript-eslint namespace, enabling no rule, so the existing directives resolve and npm run lint exits 0 over the current tree; lint-step is delivered again.
2. Order: the fixes of the remaining error-severity findings in non-test source come before the rule table is switched on, and the rule table carries the test-file relaxation itself, so every delivery's build passes lint as it lands.
3. PRH-03 (a suppression carries its reason) stays decided by reading at review; it gets no lint encoding, because the plugin that would encode it is not authorized by the standard. The suppression-description task leaves the plan. Describing the 15 existing directives is future work.
