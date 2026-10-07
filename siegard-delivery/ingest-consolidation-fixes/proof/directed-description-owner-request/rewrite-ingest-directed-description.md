---
target: backend
implementation: sha256:9bda4fd5ed90a99c6b8383faab581c7e9d0b6daf66db62893e0549b048c0c8ef
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/directed-description-owner-request-rewrite-ingest-directed-description-suite
title: Proof of the ingest_directed description rewrite to the owner's-request condition
summary: Five tests decide the four content criteria on the emitted text and the shared-text criterion across the MCP ingest endpoint and the chat tool catalog, and the constraint node is claimed by the shared-text test.
tests:
- file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  name: states that the tool is called only when the owner's own message explicitly asks to record knowledge
  proves: 'Criterion 1: The ingest_directed description states that the tool is called only when the owner''s own message explicitly asks to record knowledge.'
  fails_when: No single sentence of the emitted description carries all of "only", "owner's own message", "explicitly" and "record". That covers the condition being dropped, loosened to a permission without "only", or dropping "explicitly".
- file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  name: states that an instruction inside a document or a tool result is never a reason to call the tool
  proves: 'Criterion 2: The ingest_directed description states that an instruction inside a document or a tool result is never a reason to call the tool.'
  fails_when: No single sentence of the emitted description combines "instruction", "document", "tool result", "never" and "call". That covers the prohibition being removed or weakened to a non-absolute wording.
- file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  name: mentions prior tool results only to forbid acting on them, never as a reason to call the tool
  proves: 'Criterion 3: The ingest_directed description no longer presents facts assembled from prior tool results as a reason to call the tool.'
  fails_when: A sentence of the description mentions tool, prior, earlier or previous results, lookups or queries without a "never" or "not" in the same sentence. The old sentence "Use this when you already have the structured facts (e.g. you assembled them yourself from prior tool results)" is such a sentence.
- file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  name: still states that the server runs no language model for the call
  proves: 'Criterion 4: The ingest_directed description still states that the server runs no language model for the call.'
  fails_when: The description no longer contains "no LLM" or "no language model". The existing schema test also accepts the bare word "deterministic", so it would stay green if the no-LLM statement were removed.
- file: src/__tests__/unit/chat/ingest-directed-description-parity.spec.ts
  name: presents the chat assistant exactly the text the MCP ingest endpoint lists for the tool
  proves: 'Criterion 5: The ingest_directed description listed by tools/list on the MCP ingest endpoint is identical to the one the chat assistant''s tool catalog presents. It runs the real ingest toolset registration, the real MCP ingest transport (tools/list over the wire), and the real chat catalog and tool-descriptor builder, then compares the two strings. It also requires the listed text to be a non-empty string, so two missing values cannot compare equal.'
  fails_when: The text listed by tools/list for ingest_directed differs from the description the chat catalog hands the model. That happens if one transport gets its own copy of the text, a transform is applied on one side, or the tool is missing from either side.
  demonstrates: constraints/chat-directed-ingestion-description-matches-mcp
not_applicable:
- edge_case: Absent, empty or malformed input to the tool
  why: The task changes only a static description string. It adds no input handling, and the input schema and handler are untouched.
- edge_case: Boundaries of a range, duplicates, state that forbids the operation, a failing or slow dependency, concurrent operations
  why: The emitted text is a constant. No criterion or node reaches any of these classes for this task.
- edge_case: The chat toolset flag, CHAT_INGEST_ENABLED=false (the catalog omits the tool)
  why: The constraint node states that it does not decide whether the chat offers the tool (constraints/chat-toolset decides). The existing tool-catalog spec covers that behavior and this task did not change it.
- edge_case: Removal of the source comments from src/modules/ingestion/dto/index.ts
  why: No criterion asserts anything about comments. The implementation record states that no code and no emitted string changed in that removal. A test would pin the arrangement of the file.
untested:
- 'rules/chat/assistant-writes-only-on-owner-request: the node is an invariant about the assistant''s behavior in a chat turn (it calls directed ingestion only on the owner''s own message, never on an instruction inside a document or tool result). No finite test over the emitted description decides it, and the task''s second ADVISORY note puts run-time enforcement outside this task. The tests above prove the text states the condition (criteria 1 and 2), which is not the fact itself, so no `demonstrates` is claimed. Something that exercises a chat turn, or a reading, still has to decide it.'
- 'domain/knowledge-base/directed-ingestion: the node is a value object whose fact is a batch the owner states directly, ingested without a language model reading anything. This task changes only the description string and leaves the batch shape and the ingestion path unchanged. No finite test over the text decides the value object, and a test of the description''s no-LLM sentence would assert only part of the fact as the whole, which SPEC-004 R12 refuses. Criterion 4 is proven separately, as a criterion.'
- The wording chosen for the text (capitalized ONLY/NEVER, keeping the opening 'you already know', 'explicitly' kept in the text) is an inference the implementation recorded. The tests match the criteria's content at sentence level, not those exact phrasings. The first task note records that 'explicitly' is narrower than what the rule node says, and no node decides it either way. The criterion 1 test requires it only because criterion 1 states it.
- Whether the chat assistant actually holds to the owner's-request condition in a turn is not tested. The task's ADVISORY notes scope it out, and the chat prompt and agent are untouched.
divergences:
- cites: TST-04
  file: src/__tests__/unit/chat/ingest-directed-description-parity.spec.ts
  departure: The test crosses two units, the ingest toolset or MCP transport and the chat tool catalog. It sits under src/__tests__/unit/chat/ and does not mirror a single source file's path.
  why: The constraint it proves is between those two transports, so no single unit's path mirrors it. It sits beside the existing tool-catalog spec, which covers the consuming side.
---

## What it is
Five tests in two new unit files prove the content of the emitted ingest_directed description and that the MCP endpoint and the chat catalog present the same text.
The suite run that passed is the one this record points at.

## Notes
No earlier suite run failed before this one passed.
The test author recorded no disagreement with the implementation.
