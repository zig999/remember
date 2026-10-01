---
target: backend
title: Review of the backend-lint initiative
summary: Coverage, specification conformance and standard conformance over the thirteen files the five
  backend-lint tasks wrote, with the registry run green.
reviewed:
- .secretlintignore
- eslint.config.js
- package-lock.json
- package.json
- src/__tests__/integration/tooling/secret-scan.spec.ts
- src/__tests__/unit/lint/lint-rule-table.spec.ts
- src/__tests__/unit/lint/non-test-source-declarations.spec.ts
- src/__tests__/unit/lint/service-import-boundary.spec.ts
- src/modules/chat/routes/chat.schemas.ts
- src/modules/chat/service/chat-agent.service.ts
- src/modules/curation/mcp/error-envelope.ts
- src/modules/curation/repository/curation.repository.ts
- src/modules/knowledge-graph/mcp/error-envelope.ts
tasks:
- task/backend-build-steps/lint-step
- task/backend-build-steps/secret-scan-step
- task/backend-build-steps/lint-green-tree
- task/backend-build-steps/lint-rule-table
- task/backend-build-steps/service-import-boundary
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/backend-lint passed; there was no failure to read
coverage:
- criterion: backend/package.json declares a lint script that runs eslint over the backend package.
  state: uncovered
  why: No test in the set reads scripts.lint from backend/package.json or runs npm run lint. The tree-wide
    test in lint-rule-table.spec.ts calls the ESLint API with lintFiles(["."]), so it would still pass
    if the lint script were missing or ran something other than eslint over the package.
- criterion: backend/package.json declares eslint at ^9.0.0 as a devDependency.
  state: uncovered
  why: No test reads devDependencies.eslint. The lockfile test in secret-scan.spec.ts compares the lockfile
    root's ranges with the manifest's ranges. It does not check the eslint range, so any range written
    the same in both files passes.
- criterion: backend/package.json declares typescript-eslint at ^8.0.0 as a devDependency.
  state: uncovered
  why: No test reads devDependencies["typescript-eslint"]. The lockfile test only checks that the manifest
    and the lockfile root agree. It does not check the range.
- criterion: npm ci inside backend/ completes against the updated package-lock.json without a lockfile
    mismatch.
  state: partial
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: keeps package-lock.json's root dependency ranges identical to package.json's so npm ci finds
      no mismatch
  why: 'The test only checks that packages[""].dependencies and devDependencies in the lockfile equal
    the manifest''s. npm ci is never run. A lockfile whose root agrees with the manifest but whose resolved
    node_modules/ entries are missing, or fall outside those ranges, still makes npm ci refuse, and nothing
    in the set exercises that. Under task/backend-build-steps/secret-scan-step, which states the same
    criterion: The test only checks that packages[""].dependencies and devDependencies in the lockfile
    equal the manifest''s. npm ci is never run. A lockfile whose root agrees with the manifest but whose
    resolved node_modules/ entries for secretlint or the preset are missing, or fall outside those ranges,
    still makes npm ci refuse, and nothing exercises that.'
- criterion: A TypeScript file under backend/src that carries a type annotation is linted without a parsing
    error.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function with an untyped parameter as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a value annotated with any as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: leaves no file with a lint error, so npm run lint exits 0
  why: This is only checked in passing. severitiesReported throws on a fatal message before it compares
    rule severities, and the tree test would show a fatal parse error as an error-severity message. No
    test makes parsing a type-annotated file its own assertion, so nothing marks this as load-bearing.
- criterion: A test file under backend/src/__tests__, which tsconfig.json excludes from compilation, is
    linted without a parsing error.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a value annotated with any as a warning in a file under src/__tests__
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: leaves no file with a lint error, so npm run lint exits 0
  why: Also only checked in passing. The relaxation case lints a virtual src/__tests__/unit/example/example.ts
    and throws on a fatal message before it compares severities. The tree test lints the real __tests__
    files but only filters on error severity. Neither test asserts parsing for its own sake.
- criterion: No file under backend/dist is linted.
  state: uncovered
  why: No test checks which files a lint run includes. The tree test lints "." and asserts that no errors
    come back. It would pass whether or not dist/ is linted, as long as whatever is there produces no
    error.
- criterion: No file under backend/coverage is linted.
  state: uncovered
  why: No test checks which files a lint run includes. The tree test passes if coverage/ is linted and
    comes back clean, or if coverage/ is absent.
- criterion: No file under backend/node_modules is linted.
  state: uncovered
  why: No test checks which files a lint run includes, so nothing would fail if node_modules/ were linted.
- criterion: npm run lint over the backend tree completes within the lint step's 180-second timeout.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: leaves no file with a lint error, so npm run lint exits 0
  why: The 180-second limit is enforced as a vitest timeout on an ESLint API call, lintFiles(["."]), not
    on npm run lint. The script's own invocation, including its arguments and process startup, is never
    timed.
- criterion: The build, typecheck and test scripts in backend/package.json are unchanged.
  state: uncovered
  why: No test reads scripts.build, scripts.typecheck or scripts.test, or compares them with a prior value.
- criterion: eslint.config.js registers the typescript-eslint plugin under the @typescript-eslint namespace.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a rule only the recommended configuration enables as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a require call as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a value annotated with any as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function without a declared return type as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function with an untyped parameter as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an unused import as an error
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a type alias that is not PascalCase as a warning
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an interface that is not PascalCase as a warning
  why: Every test in lint-rule-table.spec.ts that expects an @typescript-eslint/ rule id only works if
    the plugin is registered under that namespace. That includes the relaxation cases, the test-file return-type
    cases, and the unpaired unused-parameter test. In each one the namespace is a precondition of a severity
    assertion, not an assertion of its own, so it is not fully covered. Nothing names registration as
    the claim under test.
- criterion: The configuration this task delivers enables no lint rule.
  state: uncovered
  why: No test checks this. eslint.config.js in the current tree carries the rule table from the later
    lint-rule-table task, and lint-rule-table.spec.ts asserts that rules are enabled on that combined
    configuration. No test separates out the part lint-step delivered so it could be checked for enabling
    nothing.
- criterion: An existing eslint-disable directive under backend/src that names an @typescript-eslint rule
    raises no rule-definition-not-found error.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: leaves no file with a lint error, so npm run lint exits 0
  why: The tree test would catch a "Definition for rule ... was not found" message, because that message
    has error severity, but only as one error among all others. It does not check that such a directive
    exists in the tree, and it does not check that this class of error is absent as its own claim. non-test-source-declarations.spec.ts
    uses its own override config rather than eslint.config.js, so it says nothing about the delivered
    registration.
- criterion: npm run lint inside backend/ exits 0 over the current backend tree.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: leaves no file with a lint error, so npm run lint exits 0
  why: The test calls the ESLint API with the default config over "." and asserts that no error-severity
    message comes back. It never runs npm run lint. If the script were missing, or carried arguments that
    change the exit code (such as a warning ceiling while warnings exist), the test would still pass.
- criterion: backend/package.json declares a secret-scan script that runs secretlint over "**/*".
  state: partial
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits non-zero and reports the file when a source file holds a recognized credential
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits non-zero and reports .env.example when it holds a recognized credential
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero over the tree when no recognized credential sits outside the ignored paths
  why: The fixtures run the manifest's own secret-scan script and show that it scans a nested source file
    and a dotfile. No test reads the script text, so the "**/*" glob is never asserted. A script naming
    narrower patterns that still reach src/nested/ and .env.example would pass.
- criterion: backend/package.json declares secretlint at ^8.0.0 as a devDependency.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: declares secretlint at ^8.0.0 as a devDependency
- criterion: backend/package.json declares @secretlint/secretlint-rule-preset-recommend at ^8.0.0 as a
    devDependency.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: declares @secretlint/secretlint-rule-preset-recommend at ^8.0.0 as a devDependency
- criterion: The secretlint field in backend/package.json names @secretlint/secretlint-rule-preset-recommend
    as a rule.
  state: partial
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits non-zero and reports the file when a source file holds a recognized credential
  why: The fixture copies the manifest's secretlint field and shows that an AWS access key id and a GitHub
    token are detected. No test reads the field, so the preset is never named in any assertion. A field
    listing the individual AWS and GitHub rules would detect the same fixture and pass.
- criterion: A file under backend/src holding a credential the recommended preset recognizes makes npm
    run secret-scan exit non-zero.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits non-zero and reports the file when a source file holds a recognized credential
- criterion: npm run secret-scan exits zero over a backend tree that holds no recognized credential outside
    the ignored paths.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero over the tree when no recognized credential sits outside the ignored paths
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path node_modules/
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path dist/
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path coverage/
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path .env
- criterion: backend/.secretlintignore excludes node_modules/.
  state: partial
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path node_modules/
  why: The test plants a credential under node_modules/ and expects exit zero. secretlint is documented
    to ignore node_modules by default. If it does, this test passes even when .secretlintignore has no
    node_modules/ entry, so it cannot tell the ignore file's exclusion apart from the tool's default.
- criterion: backend/.secretlintignore excludes dist/.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path dist/
- criterion: backend/.secretlintignore excludes coverage/.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path coverage/
- criterion: backend/.secretlintignore excludes .env.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits zero when the only recognized credential sits under the ignored path .env
- criterion: backend/.env.example is scanned by npm run secret-scan.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: exits non-zero and reports .env.example when it holds a recognized credential
- criterion: npm run secret-scan over the backend tree completes within the secret-scan step's 120-second
    timeout.
  state: covered
  tests:
  - file: src/__tests__/integration/tooling/secret-scan.spec.ts
    name: completes within the secret-scan step's 120-second timeout
- criterion: Every function exported from a non-test module under backend/src declares its return type.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
    name: declares a return type on every exported function
  why: The test relies on @typescript-eslint/explicit-module-boundary-types with its default options,
    including allowHigherOrderFunctions. Under that option, an exported function that immediately returns
    another function is not reported when its own return type is undeclared. That shape could stop declaring
    its return type and the test would still pass.
- criterion: Every parameter of a function exported from a non-test module under backend/src declares
    its type.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
    name: declares a type on every parameter of an exported function
  why: The default allowTypedFunctionExpressions option exempts parameters of an exported function expression
    whose type comes from the variable's annotation rather than from the parameter itself. Whether that
    counts as the parameter "declaring its type" is how the criterion is read, and this audit does not
    settle it.
- criterion: No import, variable or parameter in non-test source under backend/src is declared and never
    used, apart from a parameter whose name begins with an underscore.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
    name: leaves no import, variable or parameter declared and never used, apart from underscore-prefixed
      parameters
  why: The test sets @typescript-eslint/no-unused-vars with only argsIgnorePattern "^_", which leaves
    args at its default of "after-used". An unused parameter without an underscore that is followed by
    a used parameter is not reported. That part of the criterion is unexercised.
- criterion: No let declaration in non-test source under backend/src is left without a reassignment.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
    name: leaves no let declaration without a reassignment
  why: The test relies on prefer-const, which reports a let that is written once. It does not report a
    let that is declared with no initializer and never assigned, and that let is also left without a reassignment.
    That case is unexercised.
- criterion: None of the fixes adds an eslint-disable comment.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
    name: adds no eslint-disable comment to any file this task wrote
  why: The test asserts more than the criterion states. It requires the five listed files to hold no eslint-disable
    or eslint-enable comment anywhere, so a directive that was already there, or one a later task legitimately
    adds to the same file, fails it. It also checks only the hard-coded list FILES_WRITTEN_BY_THIS_TASK,
    so a fix in any other file is unexercised.
- criterion: npm run typecheck inside backend/ exits 0 after the fixes.
  state: uncovered
  why: No test in the set runs npm run typecheck or tsc, or asserts anything about type-checking the fixed
    files.
- criterion: npm run lint inside backend/ exits 0 over the backend tree after the fixes.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: leaves no file with a lint error, so npm run lint exits 0
  why: The test calls the ESLint API over "." and asserts that no error-severity message comes back. It
    never runs npm run lint, so arguments in the script that change the exit code are unexercised. non-test-source-declarations.spec.ts
    lints with its own override config, not the delivered one.
- criterion: typescript-eslint's recommended configuration is applied to TypeScript files under backend/src.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a rule only the recommended configuration enables as an error
  why: The test samples one rule (@typescript-eslint/no-namespace) in one non-test file. It would not
    fail if the recommended configuration stopped applying to test files under src (__tests__, *.spec.ts,
    *.test.ts), which this criterion also covers, because none of them is checked for a rule that only
    the recommended configuration enables.
- criterion: A console call in a TypeScript file under backend/src is reported as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a console call as an error
- criterion: A require call in a TypeScript file under backend/src is reported as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a require call as an error
- criterion: An empty catch block is reported as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an empty catch block as an error
- criterion: A value annotated with the any type in a non-test TypeScript file under backend/src is reported
    as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a value annotated with any as an error
- criterion: An exported function that does not declare its return type is reported as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function without a declared return type as an error
- criterion: An exported function with a parameter whose type is not declared is reported as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function with an untyped parameter as an error
- criterion: A function of thirty-one lines is reported as a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a function of thirty-one lines as a warning
- criterion: A function of thirty lines is not reported by max-lines-per-function.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: does not report a function of thirty lines
- criterion: A function with four positional parameters is reported as a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a function with four positional parameters as a warning
- criterion: A function with three positional parameters is not reported by max-params.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: does not report a function with three positional parameters
- criterion: An unused import in a non-test TypeScript file under backend/src is reported as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an unused import as an error
- criterion: An unused parameter whose name begins with an underscore is not reported by no-unused-vars.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: does not report an unused parameter whose name begins with an underscore
- criterion: A type alias whose name is not PascalCase is reported as a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a type alias that is not PascalCase as a warning
- criterion: An interface named in PascalCase without an I prefix is not reported by naming-convention.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: does not report a PascalCase interface without an I prefix
- criterion: An interface whose name is not PascalCase is reported as a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an interface that is not PascalCase as a warning
- criterion: A TypeScript file under backend/src that reads process.env is not reported by any rule in
    the configuration.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports no rule at all for a file that reads process.env
- criterion: A TypeScript file under backend/src that imports pg is not reported by no-restricted-imports.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: does not report a pg import under no-restricted-imports
- criterion: A value annotated with the any type in a file under backend/src/__tests__ is reported as
    a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a value annotated with any as a warning in a file under src/__tests__
- criterion: A value annotated with the any type in a *.spec.ts file under backend/src is reported as
    a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a value annotated with any as a warning in a *.spec.ts file under src
- criterion: A value annotated with the any type in a *.test.ts file under backend/src is reported as
    a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports a value annotated with any as a warning in a *.test.ts file under src
- criterion: An unused import in a file under backend/src/__tests__ is reported as a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an unused import as a warning in a file under src/__tests__
- criterion: An unused import in a *.spec.ts file under backend/src is reported as a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an unused import as a warning in a *.spec.ts file under src
- criterion: An unused import in a *.test.ts file under backend/src is reported as a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an unused import as a warning in a *.test.ts file under src
- criterion: An exported function without a declared return type in a test file under backend/src is reported
    as an error.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function without a declared return type as an error in a file under src/__tests__
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function without a declared return type as an error in a *.spec.ts file
      under src
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an exported function without a declared return type as an error in a *.test.ts file
      under src
- criterion: npm run lint inside backend/ exits 0 over the backend tree with the rule table configured.
  state: partial
  tests:
  - file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: leaves no file with a lint error, so npm run lint exits 0
  why: The test calls the ESLint API with the rule table over "." and asserts that no error-severity message
    comes back. It never runs npm run lint. Script arguments that would turn the warnings the table produces
    into a non-zero exit, such as a warning ceiling, are unexercised.
- criterion: A *.service.ts file importing a module through a path ending in .service.js is reported as
    a warning.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/service-import-boundary.spec.ts
    name: reports a service file importing a module whose path ends in .service.js as a warning
- criterion: A *.service.ts file importing a module whose path does not end in .service.js is not reported
    by this rule.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/service-import-boundary.spec.ts
    name: does not report a service file importing a module whose path does not end in .service.js
- criterion: A *.repository.ts file importing a module through a path ending in .service.js is not reported
    by this rule.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/service-import-boundary.spec.ts
    name: does not report a repository file importing a module whose path ends in .service.js
- criterion: The existing service-to-service imports under backend/src/modules raise no error-severity
    finding from this rule.
  state: covered
  tests:
  - file: src/__tests__/unit/lint/service-import-boundary.spec.ts
    name: raises no error-severity finding from the rule over the existing service files
unpaired:
- test:
    file: src/__tests__/unit/lint/lint-rule-table.spec.ts
    name: reports an unused parameter without an underscore prefix as an error
  asserts: In a non-test file under src, an exported function with an unused parameter named without an
    underscore prefix gets @typescript-eslint/no-unused-vars at error severity. No rule-table criterion
    states that an unused parameter without an underscore is an error. The criteria name only unused imports
    as errors and underscore-prefixed parameters as exempt.
findings:
- pass: conformance
  file: src/modules/chat/routes/chat.schemas.ts
  where: buildChatTurnRequestSchema and ChatMessageSchema, lines 5-37 (the messages-history request with
    its minimum, its maximum and its first-role refinement)
  evidence: "messages: z\n  .array(ChatMessageSchema)\n  .min(1, \"messages must contain at least 1 entry\"\
    )\n  .max(\n    opts.maxHistoryMessages,\n    `messages must contain at most ${opts.maxHistoryMessages}\
    \ entries`\n  ),\n...\n.refine((v) => v.messages[0]?.role === \"user\", {\n  message: \"first message\
    \ must have role=user\",\n  path: [\"messages\", 0, \"role\"],\n});"
  cost: This file states a chat turn request that carries a whole history of role and content messages.
    It requires at least one entry, caps the count, and requires the first entry to be from the owner.
    No node holds any of this. The specification's turn is one owner message with its model and idempotency
    key, and its send-message refusals name only content and model. The next reader who looks in the specification
    for what a turn request accepts will not find the rule, and the schema becomes where it lives.
  correction: Analysis would have to decide whether a history-carrying turn request is a fact of the business.
    If it is, a node must hold the history, its bounds and the owner-first rule. If it is not, the schema
    has no specification behind it.
- pass: conformance
  file: src/modules/chat/service/chat-agent.service.ts
  where: line 53, the constant MAX_TOKENS_PER_ITERATION, passed as max_tokens at line 255
  evidence: 'const MAX_TOKENS_PER_ITERATION = 4096; ... max_tokens: MAX_TOKENS_PER_ITERATION,'
  cost: This number caps how long every answer can be, and it decides when a turn ends as max-tokens.
    It is not configured and no node states it. Someone changing how long answers may be will look in
    the specification, find nothing, and not know this file decides it.
  correction: An analysis would have to give the per-model-call output ceiling a node, or state that it
    is configured like the other limits. domain/chat/turn is the closest home, since it holds how a turn
    ends.
- pass: conformance
  file: src/modules/chat/service/chat-agent.service.ts
  where: lines 416-423, the branch for a tool name absent from the catalog
  evidence: "toolEnvelope = {\n        ok: false,\n        error: {\n          code: \"VALIDATION_INVALID_FORMAT\"\
    ,\n          message: \"unknown tool name\",\n        },\n      };"
  cost: The code and message the assistant receives for a tool outside its toolset are stated only here.
    rules/chat/tool-failure-continues-turn holds that the failure is handed to the assistant and the turn
    continues, but not what the failure says. The text is what the assistant sees and reacts to, and no
    node can be checked against it.
  correction: The failure handed to the assistant for a tool outside its toolset needs a node that states
    its code and message.
- pass: conformance
  file: src/modules/chat/service/chat-agent.service.ts
  where: lines 634-640, the timeout branch of raceToolHandler
  evidence: "resolve({\n        ok: false,\n        error: {\n          code: \"SYSTEM_SERVICE_UNAVAILABLE\"\
    ,\n          message: \"tool timeout\",\n        },\n      });"
  cost: The code and message the assistant receives when a tool runs past the configured tool time are
    stated only here. The node holds that the turn continues, not what the assistant is told.
  correction: The failure handed to the assistant when a tool runs past the tool time needs a node that
    states its code and message.
- pass: conformance
  file: src/modules/chat/service/chat-agent.service.ts
  where: lines 672-679, synthesiseInternalErrorEnvelope
  evidence: "code: \"SYSTEM_INTERNAL_ERROR\",\n    message: errMessage(err) ?? \"tool handler threw\","
  cost: When a tool throws, its raw error message, or the fallback "tool handler threw", is what the assistant
    is told. No node says the cause is passed along or what the fallback reads. Another node says the
    owner-facing internal error withholds the cause, so the next reader cannot tell whether passing the
    cause here was decided.
  correction: The failure handed to the assistant when a tool throws needs a node that states its code
    and whether the thrown message is carried.
- pass: conformance
  file: src/modules/curation/repository/curation.repository.ts
  where: the `valid_from_source` field of ItemLockedRow (line 153), CorrectionMutationArgs.correctedValidFromSource
    (line 342), DisputedLinkRow (line 608) and DisputedAttributeRow (line 657)
  evidence: 'readonly valid_from_source: "stated" | "document" | "received" | null;

    readonly correctedValidFromSource?: "stated" | "document" | "received" | null;'
  cost: The three values of the validity-start basis are spelled out inline four times in this file. The
    same enumeration is already declared as `ValidFromSourceSchema` in `dto/enums.dto.ts`, and this file
    does not use it. Neither this file nor `enums.dto.ts` is bound to `domain/knowledge-base/valid-from-basis`.
    If the enumeration changes, `--check` will not reach these four copies, and nobody can tell which
    spelling was decided.
  correction: Take the type from the one declaration of the enumeration instead of restating the union
    here. This file already imports `AssertionStatus`, `ItemKind` and `NodeStatus` from `../dto/enums.dto.js`,
    so `ValidFromSource` can come from the same place.
- pass: conformance
  file: src/modules/curation/repository/curation.repository.ts
  where: listEntityMatchQueue, lines 565-588 (LIMIT and OFFSET over the joined review rows)
  evidence: "FROM knowledge_node kn\n       JOIN node_type nt ON nt.id = kn.node_type_id\n  LEFT JOIN\
    \ entity_match_review em ON em.node_id = kn.id\n  LEFT JOIN knowledge_node cn ON cn.id = em.candidate_node_id\n\
    \      WHERE kn.status = 'needs_review'\n      ORDER BY kn.created_at ASC, kn.id ASC, em.similarity\
    \ DESC NULLS LAST\n      LIMIT $1 OFFSET $2"
  cost: The query returns one row per candidate review, and the page is cut over those rows, not over
    nodes. A node with several candidates can have its candidate list split across two pages. The offset
    also skips candidate rows instead of entries. The owner then sees a queue entry with only part of
    its candidates, and the next page starts in the middle of that entry.
  correction: Take the page over the knowledge nodes in `needs_review`, in the creation-time-then-identity
    order, and attach each page node's reviews after the cut.
- pass: conformance
  file: src/modules/curation/repository/curation.repository.ts
  where: listDisputedLinks (lines 614-640) and listDisputedAttributes (lines 663-688), LIMIT and OFFSET
    over individual disputed items
  evidence: "WHERE kl.status = 'disputed'\n      ORDER BY kl.recorded_at ASC, kl.id ASC\n      LIMIT $1\
    \ OFFSET $2\nWHERE na.status = 'disputed'\n      ORDER BY na.recorded_at ASC, na.id ASC\n      LIMIT\
    \ $1 OFFSET $2"
  cost: The disputed queue holds one entry per dispute scope, listing each disputed item as a side. These
    queries cut the page over single items. A scope's sides can fall on either side of the page boundary,
    and the offset skips items, not entries. The same item-level cut leaves an entry's creation time (the
    earliest recording time among its items) dependent on where the page falls.
  correction: Apply the offset and limit to dispute scopes, in the entry order, and return every disputed
    item of each scope on the page.
- pass: conformance
  file: src/modules/curation/repository/curation.repository.ts
  where: countDisputedLinks (lines 642-647) and countDisputedAttributes (lines 690-697)
  evidence: 'SELECT count(*)::text AS total FROM knowledge_link WHERE status = ''disputed''

    SELECT count(*)::text AS total FROM node_attribute WHERE status = ''disputed'''
  cost: The totals for the disputed queue count disputed items, but an entry of that queue is a dispute
    scope holding several items. Any scope with two or more items is counted once per item. The total
    a listing reports is then larger than the number of entries it holds.
  correction: Count dispute scopes holding disputed items, not the disputed rows themselves.
- pass: conformance
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, the disputedQueueRes query, lines 776-788
  evidence: "SELECT DISTINCT 'link' AS k, source_node_id, target_node_id, link_type_id\n           FROM\
    \ knowledge_link\n          WHERE status = 'disputed'\n         UNION ALL\n         SELECT DISTINCT\
    \ 'attribute', node_id, attribute_key_id, NULL::uuid\n           FROM node_attribute\n          WHERE\
    \ status = 'disputed'"
  cost: The count groups every disputed link by source, target and link type, whatever the link type.
    Under the dispute-scope rule, links of a link type that does not allow multiple current links share
    one scope by source node and link type, whatever their targets. Two disputed links from one node to
    different targets of such a type are one queue entry but count as two here. `disputed_queue_count`
    then reports more disputes than the disputed queue lists.
  correction: Group disputed links by source node and link type alone where the link type does not allow
    multiple current links, and by source node, link type and target node where it does. Keep the attribute
    grouping by node and attribute key. This makes the count the number of entries the disputed queue
    holds.
- pass: standard
  file: src/__tests__/integration/tooling/secret-scan.spec.ts
  where: readManifest, line 31
  evidence: return JSON.parse(readBackendFile("package.json")) as Manifest;
  cost: The Manifest shape is claimed, not checked. If package.json drops or renames "secretlint" or "devDependencies",
    the tests that read it fail later with an undefined-property error, or assert against undefined. The
    failure then points away from the manifest.
  cites: TYP-02
  correction: Narrow the parsed value with a guard (or a schema) before it is used as Manifest.
- pass: standard
  file: src/__tests__/integration/tooling/secret-scan.spec.ts
  where: test "keeps package-lock.json's root dependency ranges identical...", line 170
  evidence: const lockfile = JSON.parse(readBackendFile("package-lock.json")) as Lockfile;
  cost: The lockfile shape is asserted without a guard. The next line reads `lockfile.packages[""]`, so
    a lockfile with a different layout surfaces as a TypeError inside the test instead of a statement
    that the lockfile is malformed.
  cites: TYP-02
  correction: Narrow the parsed value with a guard before the Lockfile type is relied on.
- pass: standard
  file: src/__tests__/integration/tooling/secret-scan.spec.ts
  where: the describe callback opening at line 65 ("secret-scan over a fixture built from...")
  evidence: describe("secret-scan over a fixture built from the backend's own manifest and ignore file",
    () => { ... closes at line 139
  cost: The callback runs 75 lines. It holds the fixture state, the fixture builder, the cleanup hook
    and three tests, so a reader cannot take it in at once. The sibling file lint-rule-table.spec.ts splits
    its describe bodies into named functions, so the two files now follow different shapes.
  cites: MNT-01
  correction: Extract the fixture builder and the test groups into named helpers, as lint-rule-table.spec.ts
    does.
- pass: standard
  file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  where: the file's location, and FILES_WRITTEN_BY_THIS_TASK (lines 14-20)
  evidence: '"src/modules/chat/routes/chat.schemas.ts", "src/modules/chat/service/chat-agent.service.ts",
    "src/modules/curation/mcp/error-envelope.ts", "src/modules/knowledge-graph/mcp/error-envelope.ts",
    "src/modules/curation/repository/curation.repository.ts",'
  cost: The spec is about five named files under src/modules, but it sits at unit/lint/. Someone opening
    any of those files cannot find its test by path. The spec also names its subject by the task that
    wrote it, so the link between file and test lasts only as long as that task is remembered.
  cites: TST-04
  correction: Place the checks beside the mirrored path of the unit each one covers, under src/__tests__/unit/modules/...,
    or state in the standard where tests of whole-tree properties live.
- pass: standard
  file: src/__tests__/unit/lint/non-test-source-declarations.spec.ts
  where: the describe callback opening at line 109 ("non-test source under backend/src")
  evidence: describe("non-test source under backend/src", () => { ... closes at line 158
  cost: The callback runs 50 lines with shared mutable state (`let findings`) and a hook. The reader has
    to hold all five tests plus the state to know what any one of them claims.
  cites: MNT-01
  correction: Split the callback into named helper functions per concern.
- pass: standard
  file: src/modules/chat/routes/chat.schemas.ts
  where: exported schema constants, for example line 3 (also lines 5, 43, 48, 87, 97, 103, 105, 108, 135)
  evidence: export const ChatRoleSchema = z.enum(["user", "assistant"]);
  cost: These are module-level constants but are spelled like types or classes. At the call site a reader
    cannot tell a schema value from a type, which is the extra file open the rule exists to prevent. The
    backend's own `naming-convention` configuration allows only camelCase or UPPER_CASE for a const variable,
    so these names conflict with it.
  cites: CON-02
  correction: Name the constants in screaming snake case (or camelCase, if the standard treats schemas
    as ordinary values), and update the importers.
- pass: standard
  file: src/modules/chat/routes/chat.schemas.ts
  where: title length limits, lines 44 and 50
  evidence: 'title: z.string().min(1).max(200).optional(), ... title: z.union([z.string().min(1).max(200),
    z.null()]).optional(),'
  cost: The title length limit of 200 is written twice, in the create and update schemas. Changing it
    in one place leaves the other accepting titles the first now refuses.
  cites: TYP-04
  correction: Introduce one named constant for the maximum title length and use it in both schemas.
- pass: standard
  file: src/modules/chat/routes/chat.schemas.ts
  where: snapshot node and link limits, lines 114-119
  evidence: .max(2000, "nodes must contain at most 2000 entries"), ... .max(2000, "links must contain
    at most 2000 entries"),
  cost: The limit of 2000 is written four times, as two numbers and two message strings. Raising the limit
    means editing four places, and missing a message string leaves the refusal text contradicting the
    limit.
  cites: TYP-04
  correction: Define the limit as a named constant and build the message from it.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: imports, lines 23-24
  evidence: import { defaultAnthropicFactory } from "../../ingestion/service/extraction.service.js"; import
    type { AnthropicFactory } from "../../ingestion/service/extraction.service.js";
  cost: The chat service depends on the ingestion service for its default client factory, so a change
    to extraction.service.ts changes how chat constructs its provider. The coupling crosses a module boundary
    through a service, and the shared behavior has no home of its own.
  cites: LAY-04
  correction: Move the Anthropic factory and its type into a shared module or a factory both services
    receive, so neither service imports the other.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: createChatAgentService, lines 65-125
  evidence: "export function createChatAgentService(\n  deps: ChatAgentServiceFactoryDeps\n): ChatAgentServiceWithStats\
    \ { ... closes at line 125"
  cost: The factory runs 61 lines. It mixes the client cache, the prompt selection, the tool wiring, the
    stats state and the service object, so it cannot be held in the head at once.
  cites: MNT-01
  correction: Extract the client-cache and service-object construction into named helpers.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: getClient, line 81
  evidence: cachedClient = factory(env.ANTHROPIC_API_KEY) as unknown as ChatAnthropicLike;
  cost: A double assertion discards whatever type the factory returns and claims the chat-specific shape
    with no guard. If the SDK's stream surface differs from ChatAnthropicLike, the mismatch appears at
    the first `messages.stream` call during a user's turn, not at the compiler.
  cites: TYP-02
  correction: Type the factory's return to include the chat surface, or narrow it with a guard before
    use.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: runTurnGenerator, lines 148-523
  evidence: "async function* runTurnGenerator(\n  ctx: RunTurnContext\n): AsyncGenerator<ChatEvent, void,\
    \ void> { ... closes at line 523"
  cost: One generator of about 375 lines owns the timer, abort wiring, the delta queue, the stream loop,
    tool execution, usage logging and termination. A change to any one of them has to be made inside it,
    and none can be exercised or read apart from the rest.
  cites: MNT-01
  correction: Extract named helpers (abort wiring, stream draining, tool execution, iteration logging)
    called from a short loop.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: abort-reason mapping, lines 223-226 and again lines 322-324
  evidence: "const reason = turnController.signal.reason; const stopReason: DoneStopReason =\n  reason\
    \ === TURN_TIMEOUT_REASON ? \"turn_timeout\" : \"cancelled\";"
  cost: The rule that decides a timeout versus a cancellation is written twice in the same generator.
    If a third abort cause is added, one copy is likely to be updated and the other to keep reporting
    "cancelled".
  cites: MNT-03
  correction: Move the mapping into one named function and call it from both places.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: tool list passed to the stream, line 256
  evidence: 'tools: ctx.tools as Anthropic.Messages.Tool[],'
  cost: The assertion removes `readonly` from the array with no guard. If the SDK later mutates the array
    it is given, the shared `tools` held by the service is changed for every later turn.
  cites: TYP-02
  correction: Make the request type accept a readonly array, or pass a copy.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: error code literals, lines 358, 501 and 676
  evidence: '"SYSTEM_INTERNAL_ERROR",'
  cost: The same error code is spelled out in three places, with the synthetic stop reason "internal_error"
    repeated beside two of them. A rename or typo in one copy would leave the clients and the metrics
    seeing two different codes for one failure.
  cites: TYP-04
  correction: Name constants for the code and the synthetic stop reason and use them at all three sites.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: terminate, lines 525-532
  evidence: "async function* terminate(\n  ctx: RunTurnContext,\n  stopReason: DoneStopReason,\n  model:\
    \ string,\n  turnTimer: NodeJS.Timeout,\n  externalAbortListener: () => void,\n  iterationBlocks:\
    \ readonly unknown[]\n)"
  cost: Six positional parameters, with most of the tail repeated unchanged at every one of the call sites.
    A caller can swap two same-shaped arguments (`turnTimer`, `externalAbortListener`) with nothing to
    notice.
  cites: MNT-01
  correction: Pass an object, or put the timer, listener and blocks on the context.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: terminateError, lines 548-556
  evidence: "async function* terminateError(\n  ctx: RunTurnContext,\n  code: string,\n  message: string,\n\
    \  turnTimer: NodeJS.Timeout,\n  externalAbortListener: () => void,\n  syntheticStopReason: ErrorSyntheticStopReason,\n\
    \  iterationBlocks: readonly unknown[]\n)"
  cost: Seven positional parameters, two of them adjacent strings (`code`, `message`) that are easy to
    transpose. Every call site repeats a long tail of arguments.
  cites: MNT-01
  correction: Pass an object, or put the shared teardown state on the context.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: createStatsAccumulator locals, lines 587-591
  evidence: 'let tokens_in = 0; let tokens_out = 0; ... const tools_called: string[] = []; let stop_reason:
    ChatRunStats["stop_reason"] = "end_turn";'
  cost: Local variables are in snake_case, which the standard reserves for database tables and columns.
    A reader takes them for column names, and the file mixes this style with camelCase such as `totalActions`
    elsewhere in the module.
  cites: CON-02
  correction: Rename the locals to camelCase and map them to the snake_case keys only where the snapshot
    is built.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: raceToolHandler, lines 622-658
  evidence: "export async function raceToolHandler(\n  handler: (\n    input: unknown,\n    invocation_context?:\
    \ Record<string, unknown>\n  ) => Promise<unknown>,\n  input: unknown,\n  timeoutMs: number,\n  invocation_context?:\
    \ Record<string, unknown>\n): Promise<ToolEnvelope> {"
  cost: Four positional parameters, and the function is 37 lines. Two of the parameters (`input`, `invocation_context`)
    are loosely typed and adjacent in meaning, so a transposed call still compiles.
  cites: MNT-01
  correction: Pass an options object and extract the timeout promise into a named helper.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: raceToolHandler parameter, lines 625 and 629
  evidence: 'invocation_context?: Record<string, unknown>'
  cost: A function parameter named in snake_case, in a file whose other parameters are camelCase (`timeoutMs`,
    `handler`), so the name reads as a column or a wire field.
  cites: CON-02
  correction: Rename the parameter to `invocationContext`.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: synthesiseInternalErrorEnvelope, lines 672-679
  evidence: 'message: errMessage(err) ?? "tool handler threw",'
  cost: The raw message of whatever a tool handler threw is placed in the envelope. That envelope is yielded
    as `error_message` on the `tool_result` event to the client and sent to the model. A driver or internal
    error therefore tells the reader the shape of the store, and the client-facing text depends on what
    a handler happened to throw.
  cites: SEC-04
  correction: Return a fixed message for the internal-error envelope and log the original error server-side.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: PERMISSIVE_INPUT_SCHEMA, lines 682-685
  evidence: "const PERMISSIVE_INPUT_SCHEMA: Anthropic.Messages.Tool.InputSchema = {\n  type: \"object\"\
    ,\n  additionalProperties: true,\n} as unknown as Anthropic.Messages.Tool.InputSchema;"
  cost: A double assertion hides whether the literal is a valid InputSchema. If the SDK type changes,
    the compiler no longer says so and the failure shows up as a rejected tool definition at run time.
  cites: TYP-02
  correction: Write the literal so it satisfies the SDK type directly, without the double assertion.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: toolInputSchemaFromZod, lines 687-736
  evidence: "function toolInputSchemaFromZod(\n  toolName: string,\n  inputSchema: unknown,\n  logger:\
    \ Logger\n): Anthropic.Messages.Tool.InputSchema | undefined { ... closes at line 736"
  cost: The function is 50 lines. It converts, runs three validity checks that each log and return undefined,
    then strips the schema key, so the three failure cases are hard to tell apart or to test one by one.
  cites: MNT-01
  correction: Extract the root-shape checks into a named validator that returns a reason.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: toolInputSchemaFromZod, line 693
  evidence: const raw = z.toJSONSchema(inputSchema as Parameters<typeof z.toJSONSchema>[0], {
  cost: An `unknown` tool schema is asserted to be a Zod schema with no guard. A catalog entry that is
    not a schema is only caught by the surrounding try/catch, as a thrown conversion error, and is logged
    as a conversion failure rather than as a bad catalog entry.
  cites: TYP-02
  correction: Narrow `inputSchema` to a Zod schema with a guard before conversion.
- pass: standard
  file: src/modules/chat/service/chat-agent.service.ts
  where: toolInputSchemaFromZod, line 724
  evidence: return clean as unknown as Anthropic.Messages.Tool.InputSchema;
  cost: A double assertion turns a generic record into the SDK's InputSchema. The checks above it verify
    only the root `type`, so a schema with a wrong inner shape passes as valid and is first refused by
    the provider during a live turn.
  cites: TYP-02
  correction: Validate the converted shape (or construct it field by field) instead of asserting it.
- pass: standard
  file: src/modules/curation/mcp/error-envelope.ts
  where: ZOD_CUSTOM_CODE_PRIORITY and messageForZodCustomCode, lines 22-54, and the check at line 72
  evidence: 'const status = code === "BUSINESS_SELF_MERGE_FORBIDDEN" ? 409 : 422;'
  cost: Each business code is spelled in the priority list and again in the switch, and "BUSINESS_SELF_MERGE_FORBIDDEN"
    a third time in the status test. The status codes 409 and 422 are also repeated as bare numbers across
    the mapper. Adding or renaming a code means editing several unconnected places, and a miss silently
    falls to the default message.
  cites: TYP-04
  correction: Define the codes and their statuses once, in a single table that the priority list, message
    lookup and status decision all read.
- pass: standard
  file: src/modules/curation/mcp/error-envelope.ts
  where: mapErrorToHttpResponse, lines 87-141
  evidence: "export function mapErrorToHttpResponse(err: unknown): MappedError {\n  if (err instanceof\
    \ ResourceNotFoundError) {\n... closes at line 141"
  cost: The function is 55 lines. Four of its branches are identical apart from the class tested, so a
    change to the shape of the mapped error has to be made in each branch.
  cites: MNT-01
  correction: Collapse the identical branches into one lookup over the error classes.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: loadItemsForUpdate, lines 158-196
  evidence: "export async function loadItemsForUpdate(\n  client: PoolClient,\n  itemKind: ItemKind,\n\
    \  itemIds: readonly string[]\n): Promise<ItemLockedRow[]> { ... closes at line 196"
  cost: The function is 39 lines because it carries two SELECT statements. The link and attribute paths
    cannot be read or changed independently of each other.
  cites: MNT-01
  correction: Split into one function per item kind and dispatch from a short function.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: adjustItemPeriod, lines 305-311
  evidence: "export async function adjustItemPeriod(\n  client: PoolClient,\n  itemKind: ItemKind,\n \
    \ itemId: string,\n  validFrom: string | null,\n  validTo: string | null\n): Promise<number> {"
  cost: Five positional parameters, and `validFrom` and `validTo` are the same type and adjacent. A swapped
    call compiles and writes an inverted period to a disputed item.
  cites: MNT-01
  correction: Pass the period as one object.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: insertCorrectedRow, lines 374-450
  evidence: "export async function insertCorrectedRow(\n  client: PoolClient,\n  itemKind: ItemKind,\n\
    \  args: CorrectionMutationArgs\n): Promise<string> { ... closes at line 450"
  cost: The function is 77 lines because it holds two INSERT ... SELECT statements and two row-missing
    checks. A change to the correction semantics has to be repeated in both halves.
  cites: MNT-01
  correction: Split into one function per item kind.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: insertCorrectedRow, lines 380-408 (and the same pattern in adjustItemPeriod, line 313)
  evidence: "`INSERT INTO knowledge_link (\n    source_node_id, target_node_id, link_type_id,\n    valid_from,\
    \ valid_to, status, confidence,\n..."
  cost: The writes in this file can collide with the duplicate-guard index, and the curation error-envelope
    maps that case from a raw driver error ("A duplicate-guard index rejected the resolution"). The repository
    does not catch it where it is raised, so the pg error crosses the service layer untyped. Any caller
    that does not apply that mapper turns the conflict into an internal failure that exposes the schema.
  cites: EDG-03
  correction: Catch the unique-violation in the repository write that raises it and rethrow a typed error
    carrying the original as its cause.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: copyProvenance, lines 452-457
  evidence: "export async function copyProvenance(\n  client: PoolClient,\n  itemKind: ItemKind,\n  predecessorId:\
    \ string,\n  successorId: string\n): Promise<number> {"
  cost: Four positional parameters, with two adjacent id strings. Swapping predecessor and successor compiles
    and copies provenance in the wrong direction.
  cites: MNT-01
  correction: Pass the two ids as one object.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: appendProvenanceFragment, lines 482-487
  evidence: "export async function appendProvenanceFragment(\n  client: PoolClient,\n  itemKind: ItemKind,\n\
    \  successorId: string,\n  fragmentId: string\n): Promise<number> {"
  cost: Four positional parameters, with two adjacent id strings. A swapped call links a fragment to the
    wrong row without a compiler complaint.
  cites: MNT-01
  correction: Pass the two ids as one object.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, lines 717-799
  evidence: acceptRate = accepted / totalActions; ... rejectRateByCode[row.code] = Number(row.total) /
    totalActions; ... const entityMatchQueueCount = needsReviewCount;
  cost: The repository decides what counts as an accepted action (ACCEPT_ACTIONS), computes the rates
    and defines the entity-match queue as the needs_review count. These are business rules in a layer
    that should only read and write, so a job or another transport that needs the same metric must copy
    them.
  cites: ARC-04
  correction: Have the repository return the raw counts and let a service compute the rates and queue
    sizes.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, lines 717-799
  evidence: "export async function aggregateCurationMetrics(\n  client: PoolClient\n): Promise<CurationMetricsRow>\
    \ { ... closes at line 799"
  cost: The function is 83 lines and runs seven queries with their post-processing in sequence. No single
    metric can be read or changed without reading the rest.
  cites: MNT-01
  correction: Extract one named helper per metric and compose them.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, lines 752-757 against countEntityMatchQueue, lines 590-597
  evidence: "`SELECT count(*)::text AS total\n       FROM knowledge_node\n      WHERE status = 'needs_review'`"
  cost: The same needs_review count already exists as `countEntityMatchQueue` in this file and is written
    out again here (and the disputed counts follow the same pattern). If the queue definition changes,
    the metric and the queue length drift apart.
  cites: MNT-03
  correction: Call `countEntityMatchQueue` (and the existing disputed counters) from the aggregate.
- pass: standard
  file: src/modules/knowledge-graph/mcp/error-envelope.ts
  where: mapErrorToHttpResponse, lines 29-134
  evidence: "export function mapErrorToHttpResponse(\n  err: unknown,\n  extraDetails?: Record<string,\
    \ unknown>\n): MappedError { ... closes at line 134"
  cost: The function is 106 lines made of near-identical branches, one per error class. Adding an error
    class means copying a branch, and a branch whose status or details are copied wrongly is not caught
    by the compiler.
  cites: MNT-01
  correction: Drive the mapping from a table of error class, status and detail extractor.
- pass: standard
  file: src/modules/knowledge-graph/mcp/error-envelope.ts
  where: status literals, lines 34, 40, 48, 55, 62, 69, 81, 88, 95, 102 and 119
  evidence: return mapped(422, "warn", {
  cost: The HTTP statuses 404, 410, 422 and 500 are bare numbers repeated across the mapper, with 422
    used seven times. The status for a class of failure is changed by hunting for every copy, and one
    forgotten branch ends up answering differently.
  cites: TYP-04
  correction: Name constants for the statuses (or the per-class table suggested above) and reference them.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
reconciliation: siegard-reconcile/backend-lint.md
run: run/backend-lint
---
## What it is
The review of the five backend-lint tasks over the thirteen files they wrote, read by four coverage, conformance and standard judgments and one green registry run.

## Notes
The npm ci criterion is stated word for word by lint-step and secret-scan-step, so its one coverage entry carries both judgments.
The failures pass did not run because the captured run passed every step.
The conformance pass judged the four files the trace binds nodes to; the nine files bound to nothing were staged as unbound and handed no judge, because the tasks implement no specification node.
The conformance return for curation.repository.ts was delegated three times: the first return spelled a finding's kind outside the contract's vocabulary and the second did not parse, so each was set aside and a fresh delegation answered.
The standard judge answered a second time after a message the coordinator sent once it had already returned; the first answer is the one recorded here.
The coverage and standard slices and the reading rules were handed to the standard judge as file paths rather than pasted.
This framework does not review runtime behavior beyond the project's own suite, performance, security beyond the rules the standard states, or the lint rules' own correctness.
