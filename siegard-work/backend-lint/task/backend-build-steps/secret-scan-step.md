---
title: Secret-scan step over the backend
summary: The secret-scan script, the secretlint devDependencies, the manifest's secretlint configuration and the ignore file that bounds what is scanned.
rationale: The scope states the secret-scan step as one addition. I decided to ignore .env and keep .env.example scannable, because the inventory found that the gitignored .env holds real credentials and is not source, while .env.example is committed. I kept the ignore file in the same task as the step because which files the step reads is part of what the step decides.
sources:
  - intake/scope.md
objective: Running npm run secret-scan inside backend/ fails on a credential the recommended preset recognizes in a scanned backend file.
criteria:
  - backend/package.json declares a secret-scan script that runs secretlint over "**/*".
  - backend/package.json declares secretlint at ^8.0.0 as a devDependency.
  - backend/package.json declares @secretlint/secretlint-rule-preset-recommend at ^8.0.0 as a devDependency.
  - The secretlint field in backend/package.json names @secretlint/secretlint-rule-preset-recommend as a rule.
  - A file under backend/src holding a credential the recommended preset recognizes makes npm run secret-scan exit non-zero.
  - npm run secret-scan exits zero over a backend tree that holds no recognized credential outside the ignored paths.
  - backend/.secretlintignore excludes node_modules/.
  - backend/.secretlintignore excludes dist/.
  - backend/.secretlintignore excludes coverage/.
  - backend/.secretlintignore excludes .env.
  - backend/.env.example is scanned by npm run secret-scan.
  - npm ci inside backend/ completes against the updated package-lock.json without a lockfile mismatch.
  - npm run secret-scan over the backend tree completes within the secret-scan step's 120-second timeout.
---
## What it is
The secret-scan script modelled on servicedeskn1's, with secretlint and its recommended preset as devDependencies.
The secretlint field in the manifest, which names the preset rather than an empty rules array.
A backend .secretlintignore based on servicedeskn1's, with .env added.

## Notes
The servicedeskn1 secretlint field has an empty rules array, which decides nothing, so it is not copied as-is.
