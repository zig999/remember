---
title: Backend lint and secret-scan steps
summary: The lint and secret-scan steps the backend standard declares, built so that later backend deliveries run them and lint exits 0 over the backend tree.
rationale: The scope's eslint configuration, lint script and secret-scan step are grouped in one epic because each is one step of the same build phase. None of the twenty-three architecture constraints states a fact that a lint or secret-scan step decides. The epic claims one node only because an epic must cover at least one specification node.
sources:
  - intake/scope.md
  - intake/lay-04-warn.md
  - intake/lint-green.md
  - intake/replan-lint-order.md
covers:
  - constraints/chat-content-is-data
uncovered:
  - node: constraints/chat-content-is-data
    why: This plan configures the backend's lint and secret-scan tooling and changes no behavior of the assistant, so no task here answers how the assistant is instructed to treat content. The node is claimed only because an epic must cover at least one specification node.
---
## What it is
The backend gets its lint step: an eslint flat configuration that registers the typescript-eslint plugin, a lint script and the eslint and typescript-eslint devDependencies.
The remaining error-severity findings in non-test source are fixed.
The rule table of the approved proposal, with its test-file relaxation, is encoded in that configuration at the severities the owner decided.
The backend gets its secret-scan step: a secret-scan script, secretlint with its recommended preset, a secretlint configuration and an ignore file.

## Notes
naming-convention, max-lines-per-function, max-params and the service-import boundary are warnings by the owner's decisions, so their findings on existing code do not fail the lint step.
Refactoring the nine existing service-to-service imports is future work by the owner's decision, not part of this plan.
PRH-03 gets no lint encoding and stays decided by reading at review, by the owner's decision.
Describing the fifteen existing eslint-disable directives in backend/src is future work by the owner's decision.
