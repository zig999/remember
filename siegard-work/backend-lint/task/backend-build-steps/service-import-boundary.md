---
title: Service-import boundary as a warning
summary: The no-restricted-imports block that reports a service file importing another service, set to warn.
rationale: LAY-04 is cut apart from the whole-source rule table because it applies only to *.service.ts files and its warn severity rests on a separate owner decision tied to nine existing imports. Its severity can change when those imports are refactored, independently of every other rule.
sources:
  - intake/scope.md
  - intake/lay-04-warn.md
objective: The lint step reports as a warning every import of a *.service.js module from a *.service.ts file under backend/src.
criteria:
  - A *.service.ts file importing a module through a path ending in .service.js is reported as a warning.
  - A *.service.ts file importing a module whose path does not end in .service.js is not reported by this rule.
  - A *.repository.ts file importing a module through a path ending in .service.js is not reported by this rule.
  - The existing service-to-service imports under backend/src/modules raise no error-severity finding from this rule.
---
## What it is
A file block for src/**/*.service.ts with no-restricted-imports forbidding the **/*.service.js pattern, at warn severity.

## Notes
The .js-suffixed pattern matches the backend's ESM import specifiers; a pattern without the suffix would not match them.
