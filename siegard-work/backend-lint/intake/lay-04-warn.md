# Owner decision, 2026-10-01 — LAY-04 as warn

Told that LAY-04 (a *.service.ts never imports another service) already has nine violating imports in the backend, the owner chose to set its no-restricted-imports rule to warn for now, like MNT-01, so the lint step does not fail on existing code; refactoring the nine imports is future work.
