---
target: backend
title: Proof for the secret-scan step over the backend
summary: Runs the backend's own secret-scan script, secretlint field and .secretlintignore against fixtures
  built at runtime outside backend/, scans the real tree, and checks the devDependency declarations and
  the lockfile root.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
tests:
- file: src/__tests__/integration/tooling/secret-scan.spec.ts
  name: exits non-zero and reports the file when a source file holds a recognized credential
  proves: '"A file under backend/src holding a credential the recommended preset recognizes makes npm
    run secret-scan exit non-zero." The fixture takes the script and the secretlint field from the real
    package.json and the real .secretlintignore. It plants an AWS access key id and a GitHub token, built
    at runtime, at src/nested/leaked.ts. It also carries the script criterion (a secret-scan script running
    secretlint over "**/*", since a nested file must be reached) and the rule-set criterion (the field
    names the recommended preset, since an empty rules array reports nothing).'
  fails_when: the secret-scan script is absent or scans less than every nested file, the secretlint field
    names no rule or an empty rules array, an ignore entry reaches src/, or the scan exits zero or never
    names the planted file.
- file: src/__tests__/integration/tooling/secret-scan.spec.ts
  name: exits non-zero and reports .env.example when it holds a recognized credential
  proves: '"backend/.env.example is scanned by npm run secret-scan." A recognized credential planted in
    .env.example, using the real script, field and ignore file, is reported and fails the scan.'
  fails_when: .env.example is excluded by .secretlintignore, or "**/*" stops covering dotfiles, so the
    credential goes unreported and the scan exits zero.
- file: src/__tests__/integration/tooling/secret-scan.spec.ts
  name: exits zero when the only recognized credential sits under the ignored path %s
  proves: '"backend/.secretlintignore excludes node_modules/.", "excludes dist/.", "excludes coverage/."
    and "excludes .env." One table row per path (node_modules/fixture-package/leaked.js, dist/leaked.js,
    coverage/leaked.txt, .env). Each plants a recognized credential only under that path and expects a
    zero exit.'
  fails_when: .secretlintignore stops excluding any one of the four paths, so the planted credential is
    reported and the scan exits non-zero. The failing row names the path.
- file: src/__tests__/integration/tooling/secret-scan.spec.ts
  name: exits zero over the tree when no recognized credential sits outside the ignored paths
  proves: '"npm run secret-scan exits zero over a backend tree that holds no recognized credential outside
    the ignored paths." It runs npm run secret-scan in the real backend/ directory.'
  fails_when: the real tree holds a credential the preset recognizes outside the ignored paths, for example
    in .env.example or src, or the scan configuration errors.
- file: src/__tests__/integration/tooling/secret-scan.spec.ts
  name: completes within the secret-scan step's 120-second timeout
  proves: '"npm run secret-scan over the backend tree completes within the secret-scan step''s 120-second
    timeout." It measures the wall time of the real-tree scan.'
  fails_when: the scan over the real tree takes 120 seconds or longer, for example because node_modules/
    or dist/ stop being excluded from the walk.
- file: src/__tests__/integration/tooling/secret-scan.spec.ts
  name: declares %s at ^8.0.0 as a devDependency
  proves: '"backend/package.json declares secretlint at ^8.0.0 as a devDependency" and "declares @secretlint/secretlint-rule-preset-recommend
    at ^8.0.0 as a devDependency." One table row per package.'
  fails_when: either package is missing from devDependencies, sits only in dependencies, or is declared
    at a range other than ^8.0.0. The failing row names the package.
- file: src/__tests__/integration/tooling/secret-scan.spec.ts
  name: keeps package-lock.json's root dependency ranges identical to package.json's so npm ci finds no
    mismatch
  proves: '"npm ci inside backend/ completes against the updated package-lock.json without a lockfile
    mismatch." npm ci refuses a lockfile whose root dependency ranges differ from the manifest''s, so
    the test compares the two.'
  fails_when: package.json gains or changes a dependency or devDependency that package-lock.json's root
    entry does not carry, or the reverse, which is the mismatch npm ci refuses.
not_applicable:
- edge_case: absent or empty input to the scan, such as an empty backend or a file with no content
  why: No criterion states behavior for an empty tree or an empty file. The scan reads files and the task
    has no input boundary of its own.
- edge_case: a dependency that fails or answers slowly
  why: The one timing obligation is the 120-second bound over the real tree, which has its own test. The
    scan has no network or service dependency.
- edge_case: two scans of one tree at once
  why: The scan only reads and no criterion states concurrent behavior. Each fixture test uses its own
    mkdtemp directory, so the tests do not share state.
- edge_case: a secret-scan-step UNDERDETERMINED entry in the task's Notes
  why: The only Notes entry says the servicedeskn1 secretlint field has an empty rules array and is not
    copied as-is. It does not open with "UNDERDETERMINED, from the specification —" and names no implementation
    to exclude. The empty-rules implementation is nonetheless excluded by the first test, which expects
    a detection.
untested:
- The task implements no specification node, so no test carries `demonstrates` and no node fact is left
  unproven.
- An actual `npm ci` against the lockfile is not run by any test. The lockfile test checks only that the
  root dependency ranges match the manifest's. Whether the resolved tree installs is decided by the install
  step of the captured run.
- The fixture tests exercise the script string, the secretlint field and .secretlintignore copied from
  the real files into a temporary directory, and not the file at backend/src itself. A credential planted
  in the real backend/src is not tested, because planting it there would make the suite fail the tree's
  own secret-scan step.
- 'The implementation''s inference that the secretlint rule is written as {"id": ...}, and its inference
  about the field''s placement in package.json, are arrangement and are not tested. The inference that
  .env.example''s placeholder connection string is not reported is behavior no node decides. It is exercised
  only incidentally by the real-tree zero-exit test, not pinned by a test of its own.'
- The fixture credentials are an AWS access key id and a GitHub token pattern. If the recommended preset's
  detection changed for both, the two non-zero-exit tests would fail rather than pass vacuously. The ignored-path
  rows, which expect zero, would then no longer prove an exclusion. The non-zero tests are the control
  for them.
divergences:
- cites: TST-04
  file: src/__tests__/integration/tooling/secret-scan.spec.ts
  departure: The test sits at src/__tests__/integration/tooling/secret-scan.spec.ts. It mirrors no unit
    under src, because what it exercises is the build configuration at the backend root (package.json,
    .secretlintignore, package-lock.json), not a source file.
  why: The rule's mirrored-path layout has no unit to mirror here. Putting the file under src/__tests__/integration/
    keeps it inside the paths vitest.config.ts includes and beside the other integration specs.
implementation: sha256:e7eb4bfd74fcc9340c2f57c980bc69f624d182ecba04db671fee1368db8d76d8
run: run/backend-build-steps-secret-scan-step-suite
---
## What it is
One integration spec that runs the backend's own secret-scan script, secretlint field and ignore file against fixtures built at runtime outside backend/, scans the real tree, and checks the devDependency declarations and the lockfile root.

## Notes
Fixture credentials are constructed at runtime and written to temporary directories, so the tree's own secret-scan step never sees a literal credential.
The suite passed on its first captured run.
