---
target: backend
task: sha256:32f05555f083d64ab891cf96283cebe3e8ab3ff4ef15a734f5b650ac78098fe8
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/alias-admission-default-prompt-version-v5-build
title: Default prompt version moves to v5
summary: DEFAULT_PROMPT_VERSION is now bound to the v5 module's PROMPT_VERSION, so an ingest_document call that names no prompt version opens its run under v5.
files:
- path: src/modules/ingestion/prompts/index.ts
  effect: DEFAULT_PROMPT_VERSION is now v5.PROMPT_VERSION ("v5") instead of v4.PROMPT_VERSION. The v5 module and its registry entry already existed, so the registry and the unknown-version failure are unchanged. The ingest_document handler reads this constant as the fallback when the call names no prompt_version, so new runs are recorded and extracted under v5.
criteria:
- criterion: An ingest_document call that names no prompt version opens its LLM run under prompt version v5.
  met: true
  how: 'src/modules/ingestion/mcp/ingest-document.handler.ts line 104 builds the run body with `prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION`. DEFAULT_PROMPT_VERSION in src/modules/ingestion/prompts/index.ts is now bound to v5.PROMPT_VERSION, which is "v5" in extraction.v5.ts. selectPromptModule("v5") resolves because the registry already holds the v5 entry.'
nodes:
- node: rules/knowledge-base/default-prompt-version
  encoded_at:
  - src/modules/ingestion/prompts/index.ts
  how: The invariant "a document ingestion that names no prompt version runs under v5" is the value of the single exported constant DEFAULT_PROMPT_VERSION. The only consumer that applies it to a document ingestion is the ingest_document handler's `??` fallback.
- node: domain/knowledge-base/prompt-version
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v5.ts
  - src/modules/ingestion/prompts/index.ts
  how: The enumeration v1..v5 is already held by the five prompt modules and their registry in prompts/index.ts. This delivery adds no value to it. v5 was added earlier by the dependency task, and this task only selects it as the default.
inferences:
- inferred: The default is changed in the one constant that the ingest_document handler reads. The REST run route, the directed ingestion (DIRECTED_PROMPT_VERSION "directed-v1") and the chat prompt version (CHAT_PROMPT_VERSION in env.ts) are left alone.
  from: The task's Notes say the ingest_document handler reads the default when it creates a run. The inventory records the default as a single constant read by that handler. A grep of src/ found no other reader of DEFAULT_PROMPT_VERSION outside tests. The chat and directed versions are separate namespaces from the extraction registry.
preserved:
- An explicit prompt_version on ingest_document is still honored, because the `??` fallback only applies when none is named.
- Versions v1 through v4 stay registered and selectable, so runs already recorded under them and retries of those runs still resolve their modules.
- An unknown prompt_version still fails the run through UnknownPromptVersionError, with no substitution.
- The v5 module, its content and its registry entry are untouched.
deferred:
- what: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts line 163 asserts `expect(DEFAULT_PROMPT_VERSION).toBe("v4")`, so it will fail against this change.
  why: I write no tests, and the assertion encodes the superseded default. The test author must update it to match the new rule. extraction-prompt-v2.spec.ts, extraction-prompt-v3.spec.ts and ingest-document-handler.spec.ts compare against the constant or against "not v1" or "not v3", so they should keep holding. They were not run.
---

## What it is

DEFAULT_PROMPT_VERSION is now bound to the v5 module's PROMPT_VERSION, so an ingest_document call that names no prompt version opens its run under v5.

## Notes

None.
