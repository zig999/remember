---
target: backend
title: Version 4 extraction prompt no longer asks for the basis received
summary: The version 4 directive still resolves a relative date against the document date, else against the date portion of received_at, and no longer tells the model to state the basis received.
task: sha256:462058ad39ab5a4eecad9c32a2cd3d803f37a9a5f33bac53725feb545c409efd
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/v4-basis-prompt-no-received-build
files:
- path: src/modules/ingestion/prompts/extraction.v4.ts
  effect: RECEIVED_AT_ANCHOR_DIRECTIVE no longer contains the line telling the model to use basis "received" on the fallback; the fallback sentence now ends after naming the YYYY-MM-DD prefix of received_at. The two prose doc comments in the file (above PROMPT_VERSION and above system) were removed under the source-carries-no-comments rule. The exported values, the directive's other lines and system()'s behavior are unchanged.
criteria:
- criterion: The system prompt of version 4 tells the model to resolve a relative date against the date of reception when the source has no document date.
  met: true
  how: In extraction.v4.ts, RECEIVED_AT_ANCHOR_DIRECTIVE still says that if `document_date` is `(unknown)` the model falls back to the date portion of `received_at` (the `YYYY-MM-DD` prefix of the ISO-8601 string). It also still says to resolve against `document_date` first when present, which is the order the node requires. system() still appends the directive to the v3 prompt.
- criterion: The system prompt of version 4 contains no instruction to state the basis received on a proposal.
  met: true
  how: The only line that named basis "received" was removed. The directive still carries `received_at` as an anchor name and the existing basis "document" and "stated" mentions, and no basis is named for the fallback. The v3 text composed in by systemV3 was not edited and is outside this task.
nodes:
- node: rules/knowledge-base/caller-never-states-received
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
  how: The v4 directive no longer instructs the model to state basis received on a proposal, so the prompt does not ask for what the rule forbids. Refusing a proposal that states received is validation, which the task's notes record as already done by the proposal schema, and it was not touched.
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
  how: 'The directive keeps the chain: a relative date resolves against `document_date` when present, otherwise against the date portion of `received_at`. This is the instruction the node states for prompt version v4.'
inferences:
- inferred: The parenthetical `basis "document"` on the document-date branch was kept, and no basis wording was added to the fallback branch.
  from: The task's objective removes only the instruction to state received. The caller's instruction says to state no basis for the fallback beyond what the node says, and the node forbids only received.
preserved:
- The instruction to resolve a relative date against `document_date` first when it is present.
- The instruction that this supersedes v3's omit-the-date rule, because received_at is always present.
- The instruction that the rule applies only to relative dates, that absolute dates stated in the chunk remain "stated", and that a date is never invented.
- The exports PROMPT_VERSION, MAX_TOKENS, user, DocumentMetadata, UserPromptArgs, RECEIVED_AT_ANCHOR_DIRECTIVE and system(catalog), and the composition `${systemV3(catalog)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`.
deferred:
- what: Whether the v3 system prompt composed into v4, or other prompt versions, also instruct the model to state basis received.
  why: The scope names only the directive in extraction.v4.ts, and the task's notes record that the sibling rule on never inventing a date is not claimed here.
---

## What it is

The version 4 directive still resolves a relative date against the document date, else against the date portion of received_at, and no longer tells the model to state the basis received.

## Notes

None.
