---
target: backend
title: Proof that the version 4 extraction prompt no longer asks for the basis received
summary: Four tests over the text version 4 appends to the version 3 system prompt hold the reception fallback behind the document date, the absence of any basis on that fallback, the absence of the basis received, and the surviving instruction never to invent a date.
implementation: sha256:f327a16d7ff1ff81023b27fb88e58dab8edb38149c22405beaffbc0a97fcc4a2
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/v4-basis-prompt-no-received-suite
tests:
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: v4 asks the model to resolve a relative date against the document date when present and otherwise against the date portion of received_at
  proves: 'Criterion 1, "The system prompt of version 4 tells the model to resolve a relative date against the date of reception when the source has no document date", and the fact of rules/knowledge-base/extraction-relative-date-falls-back-to-reception whole: the chain document date when present, otherwise the date portion of received_at. It also closes the entry "Criterion 1 covers only the reception fallback; a prompt resolving every relative date against reception even when the source has a document date", because the document-date branch must come first and name no received_at.'
  fails_when: the appended text drops the fallback to the date portion of received_at, drops the instruction to resolve against document_date when it is present, orders them the other way round, or mentions received_at inside the document-date branch.
  demonstrates: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: v4 contains no instruction to state the basis received
  proves: Criterion 2, "The system prompt of version 4 contains no instruction to state the basis received on a proposal", over the text version 4 itself appends to the version 3 prompt.
  fails_when: the appended text names received as a quoted label or as "basis received" anywhere, which is the sentence the correction removed.
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: v4 names no basis for the date taken from the reception fallback
  proves: 'The entry "Criterion 2 only removes the instruction to state received; a rewrite asking for another basis on the fallback meets it": the fallback sentence states the anchor and leaves the basis out, as the log of rules/knowledge-base/extraction-relative-date-falls-back-to-reception decided.'
  fails_when: the fallback sentence of the appended text mentions a basis of any kind, received or any other value, or the fallback sentence is absent.
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: v4 still asks the model never to invent a date
  proves: 'The entry "No criterion checks that the instruction never to invent a date survives the edit (rules/knowledge-base/extraction-never-invents-a-date)": the text version 4 appends still carries the instruction. The node is not claimed by the task, so the test names none under demonstrates.'
  fails_when: the appended text no longer tells the model never to invent a date.
not_applicable:
- edge_case: an empty or different catalog snapshot
  why: the appended directive does not read the catalog, and the tests compare only the text beyond the version 3 prompt, so no catalog changes what any obligation requires
- edge_case: a document that states an absolute date, or a source with a document date or without one, at run time
  why: what the prompt asks of the model is a text; how a model answers it is not decided by a finite test, and the criteria and nodes constrain the text only
- edge_case: a failing or slow dependency, or two operations at once
  why: the system prompt is a pure function of the catalog; nothing in the task reaches a dependency or shared state
- edge_case: absent or empty input
  why: the task's criteria concern the text produced for a valid catalog; no refusal is stated for the prompt builder
untested:
- 'rules/knowledge-base/caller-never-states-received, whole: its fact is that a proposal must not state the basis received, which is decided where proposals are validated, not in the prompt. The task''s notes record that refusal as already done by the proposal schema and this task did not touch it. The prompt half is evidenced by the test named "v4 contains no instruction to state the basis received", which exercises only that half and so does not claim the node. The refusal itself is exercised by existing tests outside this proof (src/__tests__/unit/ingestion/dto-valid-from-basis.spec.ts and src/modules/ingestion/mcp/__tests__/ingest-directed-schema.spec.ts), which this record does not claim.'
- The text inherited from the version 3 and version 1 system prompts still says the backend records `received` when no date is known. Every test here scans only the text version 4 appends, because scanning the whole prompt would fail on that inherited sentence, which the implementation record defers as outside the task. Whether the inherited text asks for the basis received is therefore unproven.
- 'The implementation''s choice to keep the parenthetical basis "document" on the document-date branch: no node decides it, so no test pins it.'
- 'Which basis, if any, the reception fallback should carry beyond forbidding received: the node''s log says the rule leaves the basis out and names no other. The test "v4 names no basis for the date taken from the reception fallback" is owed to the binder''s entry and rests on that log; the specification decides nothing further about the fallback''s basis.'
- 'Whether a model, given the prompt, resolves relative dates as asked: that is a model''s behavior at run time and no finite test decides it.'
---

## What it is

Four tests over the text version 4 appends to the version 3 system prompt hold the reception fallback behind the document date, the absence of any basis on that fallback, the absence of the basis received, and the surviving instruction never to invent a date.

## Notes

None.
