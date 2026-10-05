---
target: backend
implementation: sha256:38c570dc36f0015f3a55083d6753c769ec600c1940c9f4eb2bdb7c1ff98dad3d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-context-model-setting-suite-2
title: Proof for the context model setting threaded to every orchestrator entry point
summary: The env default and the configured context model are tested directly, and the REST route, the MCP toolset and the stdio server are each tested for handing the configured model to the orchestrator.
tests:
- file: src/__tests__/unit/env.spec.ts
  name: yields claude-haiku-4-5 as the context model when none is configured
  proves: With no context model configured, the context model the environment yields is claude-haiku-4-5.
  fails_when: loadEnv yields anything but the literal claude-haiku-4-5 when CONTEXT_MODEL is absent. That covers an undefined value, a different default such as the INGEST_MODEL default, and a missing schema field.
- file: src/__tests__/unit/env.spec.ts
  name: yields the configured context model when one is configured
  proves: With a context model configured, the environment yields that model.
  fails_when: loadEnv ignores a configured CONTEXT_MODEL, or returns the default or another model setting instead. The configured value is deliberately not the default.
- file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  name: hands the configured context model to the orchestrator from the REST run-extraction route
  proves: '"The REST run-extraction route hands the configured context model to the orchestrator." The test goes from loadEnv through buildApp to POST /api/v1/ingest/llm-runs/:id/run, and reads the deps the orchestrator received.'
  fails_when: The run route, or the app wiring that feeds it, hands the orchestrator no CONTEXT_MODEL, the default instead of the configured value, or another model setting.
- file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  name: hands the configured context model to the orchestrator from the MCP ingest toolset
  proves: '"The MCP ingest toolset hands the configured context model to the orchestrator." The test goes from loadEnv through buildApp, which registers the toolset, to the ingest_document tool, and reads the deps the orchestrator received. INGEST_MODEL is set to a different value.'
  fails_when: The toolset, or the app wiring that feeds it, hands the orchestrator no CONTEXT_MODEL, the default, or INGEST_MODEL in its place.
- file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
  name: hands the configured context model to the orchestrator from the stdio server
  proves: '"The stdio server hands the configured context model to the orchestrator." The test boots mcp-stdio with CONTEXT_MODEL set in the process environment, calls the advertised ingest_document tool, and reads the deps the orchestrator received.'
  fails_when: The stdio boot registers the ingest toolset without CONTEXT_MODEL, with the default, or with another model setting, so the orchestrator receives anything but the configured value.
files:
- path: src/__tests__/unit/env.spec.ts
  effect: An existing spec file extended with a new top-level describe holding the two context model env tests. No existing test in the file is changed.
not_applicable:
- edge_case: The default context model reaching each entry point, as opposed to a configured one
  why: The entry points forward env.CONTEXT_MODEL whatever its origin. The default is decided once, in loadEnv, by criterion 1, so a default run through each entry point is the same class as the configured run and proves nothing more.
- edge_case: An unknown, oversized or whitespace-only context model string
  why: No criterion or node states a closed set or a shape for model names. The implementation record itself says a closed set would be a fact the specification does not hold.
- edge_case: A dependency that fails or is slow (database, Anthropic, JWKS)
  why: The task adds no failure path. The orchestrator's failure mapping (404, 409, 502, 500) is listed as preserved and is covered by the existing orchestrator and route specs.
- edge_case: A run not in a runnable state, an unknown run id, and a duplicate ingestion
  why: These are existing orchestrator, route and handler behaviors that the task does not touch, and the existing specs cover them. The task criteria only add the model handoff.
- edge_case: Two extractions at once against the same run
  why: No criterion or node states concurrent behavior for the context model, and a test would assert a guarantee nobody made.
untested:
- 'UNDERDETERMINED, from the specification — rules/knowledge-base/document-context-model: the clause ''is produced under the configured context model'' reaches no criterion of this task, and the implementation that passes the model along and then runs the preliminary reading under the run''s own extraction model (LLMRun.model) satisfies every criterion here. No test is written for it here. The entry says it is answered in another task if that task''s criteria require the preliminary reading to use the model. task/document-context/preliminary-reading, which depends on this task and implements the same node, holds the criterion ''The preliminary reading calls the configured context model.'' The test that fails over that implementation is owed in that task''s proof. In this task no preliminary reading exists to test, so a test here would pin another task''s behavior.'
- 'Node rules/knowledge-base/document-context-model is not demonstrated by any test in this proof. Its fact is that a document context is produced under the configured model, or under claude-haiku-4-5 where none is configured. No document context is produced in this task: the implementation record states the orchestrator does not read the field and the preliminary reading is task/document-context/preliminary-reading''s. The env tests decide only the ''configured, or claude-haiku-4-5'' clause, and the wiring tests decide only the handoff. Neither decides the fact whole, and the rule is against approximating it by part.'
- 'Behavior inference: an empty CONTEXT_MODEL is refused at boot (min(1)) and does not fall back to the default. No criterion or node decides whether an empty value counts as ''configured'', so it is recorded as unproven and not pinned.'
- Arrangement inferences (the names CONTEXT_MODEL and contextModel, required rather than optional fields at each layer, the DEFAULT_CONTEXT_MODEL constant, the buildExtractionDeps helper) get no test, because a test over them would pin the arrangement.
- The comment removal and the closeRunSafe catch rewrite to .catch(() => undefined) are behavior-preserving rearrangements. They get no new test. The existing orchestrator spec covers the run-close path, but whether it exercises the swallowed-rollback branch was not checked.
- 'The ADVISORY that the stdio server names no operation in contracts/knowledge-base/ingestion: the stdio criterion is tested only as the criterion states it, and no contract operation exists to check it against.'
- 'The ADVISORY that domain/knowledge-base/document-context declares a required model attribute: recording the model on the document context is addressed by no criterion, the node is not implemented by this task, and nothing is tested for it.'
- The deferred item that backend/.env.example and the deployment documentation do not list CONTEXT_MODEL is configuration documentation, not behavior, and nothing is tested for it.
divergences:
- cites: TST-03
  file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  departure: The orchestrator (runLlmExtraction) is replaced by a recorder, and ingestRawInformation is replaced by a canned intake, via vi.mock.
  why: The criteria are about the handoff to the orchestrator, and the real orchestrator ignores the value, so the deps it receives are the only observable. The intake is the store boundary.
- cites: TST-04
  file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  departure: The file is named for the behavior and sits under integration/ingestion. It does not mirror one unit's path, because it goes through app.ts, the ingestion routes and the ingest toolset together.
  why: The two criteria it proves are about the wiring from the environment through app.ts to two different entry points. Splitting them across per-unit files would test the entry points without the app wiring that feeds them.
- cites: TST-03
  file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
  departure: The orchestrator and ingestRawInformation are replaced as above. The pool, the catalog loaders, the stdio transport and buildConfiguredMcpServer are replaced as well, so the real mcp-stdio.ts boot can run under Vitest and its advertised tools can be captured.
  why: The stdio entry point runs main() at import and connects a real stdio transport and database. The orchestrator is replaced because it is the receiver the criterion names, and the real one ignores the value.
---

## What it is

The env default and the configured context model are tested directly, and the REST route, the MCP toolset and the stdio server are each tested for handing the configured model to the orchestrator.

## Notes

Red run run/document-context-context-model-setting-suite failed on a test the author wrote over the document-context-model clause; the diagnosis read cause code, the implementer judged the clause task/document-context/preliminary-reading's, and the author withdrew the test as owed in that task's proof.
Green run run/document-context-context-model-setting-suite-2 is the suite this proof points at.
