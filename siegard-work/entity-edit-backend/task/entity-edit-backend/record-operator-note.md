---
title: Record the edit's operator note and its run
summary: An edit records an operator LLM run, one raw information of source type other holding the reason, one chunk and one accepted fragment whose text is the reason.
rationale: Planning kept the run and the note as one task. Their rows point at each other, since the run names the raw information and the fragment belongs to the run, so they cannot be recorded or shown apart.
sources:
- intake/scope.md
objective: Recording an edit's note leaves one completed operator run, one raw information, one raw chunk and one accepted information fragment that carries the reason.
criteria:
- The run's model is operator.
- The run's prompt version is operator-edit-v1.
- The run is recorded as completed.
- Recording the note calls no language model.
- The raw information's source type is other.
- The raw information's metadata records that it is an operator note.
- The raw information's metadata records the edited node's identity.
- The raw information's content holds the edit's reason.
- The raw information's content holds the moment of the edit.
- The raw information's content holds a nonce no other note's content holds.
- Two notes with the same reason are recorded as two raw informations.
- One raw chunk holds all of the raw information's content.
- One information fragment is anchored to that chunk.
- That fragment's status is accepted.
- That fragment's confidence is 1.0.
- That fragment's text is the edit's reason.
implements:
- domain/knowledge-base/entity-edit
- rules/knowledge-base/entity-edit-note
- rules/knowledge-base/entity-edit-note-content
- rules/knowledge-base/entity-edit-note-source
- rules/knowledge-base/entity-edit-note-run
- rules/knowledge-base/entity-edit-note-confidence
- rules/knowledge-base/entity-edit-run
- rules/knowledge-base/entity-edit-reason-trimmed
---
## What it is
An edit records an operator LLM run, one raw information of source type other holding the reason, one chunk and one accepted fragment whose text is the reason.

## Notes
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-note-run states that the information fragment an entity edit records, and the raw information that fragment is anchored in, are recorded under the LLM run that the same entity edit opened. No criterion connects the raw information or the fragment to that run. The objective counts one of each, but it never says they belong to the same run. Implementation that meets every criterion and that the specification refuses: An implementation that opens and completes a new run of model operator and prompt version operator-edit-v1, but records the note's raw information and accepted fragment under a different run that already exists. Every criterion is still met.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-note-source states the exact metadata: operator_note set to true, and node_id holding the edited knowledge node's identity. The criteria say only that the metadata 'records that it is an operator note' and 'records the edited node's identity'. They name neither the keys nor the marking value. Implementation that meets every criterion and that the specification refuses: An implementation that writes metadata { kind: "operator-note", nodeId: <id> } or { is_operator_note: "yes", edited_node: <id> } instead of { operator_note: true, node_id: <id> }.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-reason-trimmed states that an entity edit records its reason trimmed of surrounding whitespace. Its Description says this covers the note's content and the information fragment's text. The criteria say only that the content 'holds the edit's reason' and that the fragment's text 'is the edit's reason'. None of them requires trimming. Implementation that meets every criterion and that the specification refuses: An implementation that writes the reason exactly as received, with leading and trailing whitespace, into the raw information's content and the fragment's text.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The Description of rules/knowledge-base/entity-edit-reason-trimmed also applies the trimmed form to the curation action's reason. Only the note's content and the fragment's text are this task's to answer. Trimming the curation action's reason belongs with whichever task records the curation action under rules/knowledge-base/entity-edit-records-curation-action.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The criteria depend on facts held by specification nodes that are not candidates: domain/knowledge-base/raw-information (content, content_hash, metadata), domain/knowledge-base/raw-chunk, domain/knowledge-base/information-fragment, domain/knowledge-base/fragment-status (accepted), domain/knowledge-base/llm-run (status, which run-status holds 'completed') and domain/knowledge-base/source-type (other). The candidate rules constrain these nodes, but this task cannot name them. Either the epic's claim needs to grow to cover them, or the executor works without reading them.
Decision, beyond the covers — stand: domain/knowledge-base/fragment-status, domain/knowledge-base/information-fragment, domain/knowledge-base/llm-run, domain/knowledge-base/raw-chunk, domain/knowledge-base/raw-information, domain/knowledge-base/source-type, specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — constraints/entity-edit-is-atomic requires the edit's raw information, raw chunk, information fragment and LLM run to take effect together with the attributes, provenance and curation action, or not at all. It neighbours this task and is not named here. Some task in the epic must own the single transaction that holds this note's records.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
