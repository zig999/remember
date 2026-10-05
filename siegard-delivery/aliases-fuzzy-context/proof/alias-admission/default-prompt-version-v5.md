---
target: backend
implementation: sha256:eaf73d98b3f0c36c0dcbdd45c77cc3db1569bed17e70f85c9b47e4326bfaab1e
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/alias-admission-default-prompt-version-v5-suite
title: Proof that the default prompt version is v5
summary: A document ingestion that names no prompt version opens its run under the literal v5 and an explicit version is still honored. The v1 to v5 enumeration is decided by one test, and the stale assertion that the default is v4 is removed.
tests:
- file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  name: default prompt version > opens the run under v5 when an ingest_document call names no prompt version
  proves: An ingest_document call that names no prompt version opens its LLM run under prompt version v5. The expected value is the literal v5 the rule states, not the DEFAULT_PROMPT_VERSION constant, so the check does not compare the constant with itself.
  fails_when: 'The body handed to run creation carries any version but v5 when the call names none: the default reverts to v4, is changed to another version, or is dropped.'
  demonstrates: rules/knowledge-base/default-prompt-version
- file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  name: default prompt version > opens the run under the version an ingest_document call names instead of the default
  proves: The boundary of the criterion's scope, 'names no prompt version'. A call that names v3 opens its run under v3, so the v5 default applies only when none is named.
  fails_when: The handler applies v5 whatever the call names, overriding an explicit version.
- file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  name: prompt version enumeration > resolves exactly v1 to v5 and refuses a version outside them
  proves: The enumeration holds v1, v2, v3, v4 and v5. Each declared value selects a prompt module that reports that same version, and v6, a value outside the set, is refused with UnknownPromptVersionError.
  fails_when: A declared version stops resolving, resolves to a module of another version, or a version outside the enumeration is accepted.
  demonstrates: domain/knowledge-base/prompt-version
files:
- path: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  effect: Removes the test 'recommends v4 for new runs', which asserted the superseded default v4, and the DEFAULT_PROMPT_VERSION import it alone used. The v4 module and registry tests are unchanged. The default's value is now held by default-prompt-version.spec.ts.
not_applicable:
- edge_case: An empty or absent prompt_version string
  why: The input schema (mcp-schemas.ts) makes the field optional with min(1), and the existing validation boundary owns refusal of an empty string. Neither the criterion nor a node in this task states it.
- edge_case: An unknown explicit prompt_version
  why: Failing the run through UnknownPromptVersionError is registry behavior this task did not change. Only the enumeration's non-member refusal is exercised, inside the enumeration test.
- edge_case: Concurrent ingestions, a failing dependency, or duplicate content
  why: The change is one constant read when the run body is built. No criterion or node states behavior for these, and the idempotency and error paths belong to other tasks.
- edge_case: Empty collection or numeric range boundaries
  why: The obligation takes no collection or range input. Its only input dimension is whether a version is named.
untested:
- The REST run-creation route, the directed ingestion (directed-v1) and the chat prompt version. The implementation inferred it left them on their existing defaults. That is a choice about behavior no bound node decides, so no test pins it.
- That extraction actually runs under the v5 prompt module for a run opened under v5. The rule's 'runs under v5' is proven at the point the run is opened, with its recorded prompt_version. Following the version through the extraction orchestrator is another unit's behavior, and this task changed only the constant.
- domain/knowledge-base/prompt-version cannot be proven closed. A finite test shows every declared value is accepted and one outside value is refused. No test can enumerate all non-members, so 'exactly these five' is shown by the five accepted values and one refused one, not by exhaustion.
- The existing test 'defaults model + prompt_version when the caller omits them' in ingest-document-handler.spec.ts compares against the DEFAULT_PROMPT_VERSION constant, so it passes whatever the default is. It is left as it was. The default's value is protected by default-prompt-version.spec.ts.
contested:
- what: The implementation record said extraction-prompt-v2.spec.ts and extraction-prompt-v3.spec.ts should keep holding without change.
  why: That holds. They assert the default is not v1 and not v3, which stays true under v5. Only the v4 spec asserted the old value, and it is adjusted under files. This disagrees with nothing; it is recorded so the adjustment is traceable.
---

## What it is

A document ingestion that names no prompt version opens its run under the literal v5 and an explicit version is still honored. The v1 to v5 enumeration is decided by one test, and the stale assertion that the default is v4 is removed.

## Notes

This proof rewrites src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts, a test no task of this plan owns, because it asserted the default v4 that rules/knowledge-base/default-prompt-version no longer states; the fact is now proven by default-prompt-version.spec.ts against the literal v5.
