---
target: backend
title: 'Proof of the version 4 module an extraction is given: anchor directive and metadata block'
summary: 'Four tests added to the existing v4 prompt spec, all through selectPromptModule: the user message shows the reception time, a real document date and "(unknown)" for none (v4, and v1 to v3), and the v4 system prompt carries the relative-date directive with the reception fallback and states no basis received.'
implementation: sha256:d98366b6efc3daa115c5af24eb8134490440b0baaf7278a277d11af2644a5ca5
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/proof-owed-v4-module-directive-suite
tests:
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: shows the reception time and a real document date in the user message, and (unknown) when the source has none
  proves: 'Criterion 1: selectPromptModule("v4").user with a document_date of 2026-05-10 yields a metadata block containing `- document_date: 2026-05-10`, next to the null case. It also proves the node''s reception-time clause, which no criterion states (first UNDERDETERMINED entry).'
  fails_when: 'The v4 user message drops the `- received_at: <time>` line, renders a real document date as anything but `- document_date: 2026-05-10` (including as "(unknown)"), or renders a null document date as anything but `- document_date: (unknown)`.'
  demonstrates: rules/knowledge-base/extraction-user-prompt-shows-anchor-dates
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: '%s user message shows the reception time and a real document date, and (unknown) when the source has none (it.each over v1, v2, v3)'
  proves: 'Second UNDERDETERMINED entry: the user-message rule is not limited to v4, so the other registered prompt versions show the reception time and the document date as well.'
  fails_when: The user message of v1, v2 or v3 leaves out received_at or document_date, shows a real document date as "(unknown)", or shows a null one as anything but "(unknown)".
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: asks, in the system prompt it hands out, to resolve a relative date in the chunk against the document date when present and otherwise against the date portion of received_at
  proves: 'Criterion 2 and the remainder''s second assertion: the registry''s v4 system(snapshot), minus the v3 text it extends, holds a directive whose subject is a relative date in the chunk, resolved against document_date first and otherwise against the date portion of received_at.'
  fails_when: The registry's v4 module stops carrying the directive (for example it is mapped to the v3 system prompt, so the added text is empty), drops the document_date anchor or the date-portion-of-received_at fallback, or reverses the order of the two anchors.
  demonstrates: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
- file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  name: does not ask, in the system prompt it hands out, to state the basis received for a date taken from the reception fallback
  proves: 'Third UNDERDETERMINED entry: a directive that anchors on document_date, falls back to received_at and tells the model to state the basis received, which meets criterion 2, is refused. The proof is over the module the registry hands an extraction.'
  fails_when: The registry's v4 system prompt, beyond the v3 text, tells the model to state the basis "received" or `received` for a date taken from the reception fallback, or the added text is empty.
not_applicable:
- edge_case: Absent or empty received_at, or a malformed document_date
  why: received_at is a required string of DocumentMetadata and the node states no format for either date. The block echoes what it is given, and no criterion or node decides another behavior.
- edge_case: A null title, an empty chunk, an empty previous-chunk tail
  why: The rule constrains only the reception time and the document date in the user message. The other metadata and blocks belong to no obligation of this task.
- edge_case: An unknown prompt version
  why: The refusal of an unregistered version is not stated by this task's criteria or by the two nodes it implements.
- edge_case: A dependency that fails or answers slowly, and two operations at once
  why: 'The prompt builders are pure functions of their arguments: no store, no network, no shared state.'
untested:
- Whether the model resolves a relative date as the directive asks. The nodes constrain what the extraction asks of the model, which a test decides by the prompt text; the model's compliance is not observable here.
- That the basis stated on a date taken from the reception fallback is never received. That is rules/knowledge-base/caller-never-states-received, which this task does not implement and is held by the proposal's own validation. This proof only shows that the prompt does not ask for that basis.
- Whether v2 and v3 are covered by a stronger guarantee than the sampled cases. They are tested by one real date and one null date each, because the criteria and nodes state no totality over versions beyond the three tested here and v4.
---

## What it is

Four tests added to the existing v4 prompt spec, all through selectPromptModule: the user message shows the reception time, a real document date and "(unknown)" for none (v4, and v1 to v3), and the v4 system prompt carries the relative-date directive with the reception fallback and states no basis received.

## Notes

The proof also decides the reception-time clause of the user message and its extension to the versions v1 to v3, which two underdetermined notes of the task named.
