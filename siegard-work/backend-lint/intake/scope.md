# Scope — backend lint and secret-scan (owner, 2026-10-01)

Build backend/eslint.config.js, which standards/backend-node-service.yaml presupposes and the tree lacks, plus the "lint" script in backend/package.json and the eslint and typescript-eslint devDependencies.
Base it on /home/siegfriedneto/projects/servicedeskn1/src/eslint.config.js and the approved proposal:
- no-console (PRH-01)
- @typescript-eslint/no-require-imports (STK-02)
- no-empty (COR-01)
- @typescript-eslint/no-explicit-any (TYP-01)
- @typescript-eslint/explicit-module-boundary-types (TYP-03)
- max-lines-per-function 30 and max-params 3, as warn (MNT-01)
- @typescript-eslint/no-unused-vars with argsIgnorePattern ^_ (MNT-02)
- @typescript-eslint/naming-convention without the I prefix on interfaces (CON-02)
- no-restricted-imports forbidding a *.service.ts from importing another service (LAY-04)
- a rule requiring a description on eslint-disable comments (PRH-03)
The servicedeskn1 domain-module I/O block does not apply.

Also (owner, same day): include the secret-scan step the standard declares — the "secret-scan" script in backend/package.json, secretlint with @secretlint/secretlint-rule-preset-recommend as devDependencies, and a secretlint configuration, based on servicedeskn1.

The registry's build phase runs install, typecheck, lint and secret-scan; this scope is what lets any later backend delivery run them.
