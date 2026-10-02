---
title: The version 4 module a run is given asks for the relative-date fallback and shows a real document date
summary: The version 4 prompt module the registry hands an extraction carries the relative-date directive with the reception fallback, and its user message shows a real document date.
sources:
- intake/scope.md
objective: The version 4 prompt module an extraction is given resolves a relative date against the document date when present and otherwise against the date portion of the reception time, and its user message shows a document date it is given.
criteria:
- 'Calling `selectPromptModule("v4").user` with metadata whose `document_date` is a real date, for example 2026-05-10, yields a metadata block containing `- document_date: 2026-05-10`, next to the existing assertion for the null case.'
- '`selectPromptModule("v4").system(snapshot)`, the module a v4 extraction is given, contains a directive whose subject is a relative date in the chunk, resolved against `document_date` when present and otherwise against the date portion of `received_at`.'
implements:
- rules/knowledge-base/extraction-relative-date-falls-back-to-reception
- rules/knowledge-base/extraction-user-prompt-shows-anchor-dates
stands:
- src/modules/ingestion/prompts/extraction.v4.ts
- src/modules/ingestion/prompts/extraction.v1.ts
---

## What it is

A proof of a delivered fact, owed by the record siegard-reconcile/drift-corrections.md.

## Notes

UNDERDETERMINED, from the specification — rules/knowledge-base/extraction-user-prompt-shows-anchor-dates has three clauses (the user message shows the reception time, shows the document date, and shows the document date as "(unknown)" when the source has none); criterion 1 answers the real-date clause and points to an existing assertion for the "(unknown)" case, and no criterion answers the clause that the user message shows the reception time, so an implementation whose `selectPromptModule("v4").user` drops the `received_at` line and still renders `- document_date: 2026-05-10` for a real date and "(unknown)" for a null one meets both criteria and the rule refuses it.
UNDERDETERMINED, from the specification — rules/knowledge-base/extraction-user-prompt-shows-anchor-dates is not limited to one prompt version and the criteria test only the v4 module, so an implementation whose v4 user message shows both dates correctly while the user message of another prompt version leaves out the dates or shows a real document date as "(unknown)" meets both criteria and the rule refuses it.
UNDERDETERMINED, from the specification — the decision log beside rules/knowledge-base/extraction-relative-date-falls-back-to-reception records that the node states the anchor of a relative date and leaves out the basis, and rules/knowledge-base/caller-never-states-received states that a proposal MUST NOT state the basis received; criterion 2 says nothing about a basis, so a directive that anchors on `document_date`, falls back to the date portion of `received_at` and tells the model to state the basis received on that fallback meets it and caller-never-states-received refuses it.
Decision, beyond the covers — stand: rules/knowledge-base/caller-never-states-received is not claimed; the epic proves the anchor directive and the metadata block, and the basis stated on the fallback is held by the proposal's own validation.
