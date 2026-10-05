---
title: Each chunk is shown the document context
summary: The per-chunk prompt of a run that holds a document context, which shows the context next to the source metadata and the tail of the previous chunk.
rationale: Showing the context is cut apart from producing it because the per-chunk prompt changes for a different reason than the preliminary reading does.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: For a run holding a document context, the model reads each chunk with that context in view.
criteria:
- For a run holding a document context, each chunk's prompt shows the context's summary.
- For a run holding a document context, each chunk's prompt shows each listed entity with its node type and names.
- For a run holding a document context, each chunk's prompt shows the same source metadata the v4 prompt shows.
- For a run holding a document context, each chunk's prompt shows the last 200 characters of the chunk before it.
- Each chunk's prompt presents the document context marked apart from its instructions as data.
- For a run holding no document context, each chunk's prompt shows no document context.
- With a context listing João Silva as also called "o Diretor", a proposal named "João Silva" made while reading chunk 3 resolves to the knowledge node created while reading chunk 1.
- With a context listing João Silva as also called "o Diretor", the fragment proposed while reading chunk 3 is anchored to chunk 3.
depends_on:
- task/document-context/record-document-context
- task/alias-admission/prompt-v5-asks-for-other-names
implements:
- rules/knowledge-base/extraction-reads-chunks-in-order
- constraints/document-content-is-data
- domain/knowledge-base/document-context
- domain/knowledge-base/document-entity
- domain/knowledge-base/llm-run
- scenarios/knowledge-base/context-links-later-mention
- rules/knowledge-base/extraction-anchors-to-read-chunk
---
## What it is
The v5 user prompt renders the document context of the run alongside what the shared user prompt renders today.

## Notes

The shared user() in extraction.v1.ts already renders the document metadata and the 200-character tail of the previous chunk, and PREV_TAIL_CHARS is reused.
UNDERDETERMINED, from the specification — The criterion "For a run holding a document context, each chunk's prompt shows the last 200 characters of the chunk before it." does not say what a character is. rules/knowledge-base/extraction-reads-chunks-in-order says "the last 200 Unicode code points of the chunk before it". Its log (field statement) records that it was decided this way, against UTF-16 code units. The criterion should name code points. Passes: A prompt that takes the previous chunk's tail with a UTF-16 slice (string.slice(-200) in JavaScript). This satisfies "last 200 characters", but it shows a different tail and can split a surrogate pair when the chunk holds characters outside the Basic Multilingual Plane.
UNDERDETERMINED, from the specification — constraints/document-content-is-data says the extraction presents "a document's content, and the document context read from it" marked apart from its instructions as data. The criterion "Each chunk's prompt presents the document context marked apart from its instructions as data." covers only the context. No criterion holds the chunk text in the same prompt to that rule. Passes: A per-chunk prompt that marks the document context apart as data but puts the chunk text inline with the instructions.
UNDERDETERMINED, from the specification — rules/knowledge-base/extraction-reads-chunks-in-order says chunks are read "one at a time in index order". No criterion requires this. The two João Silva criteria only need chunk 1 to be read before chunk 3. Passes: An extraction that reads the chunks of a 3-chunk raw information in the order 1, 3, 2, or reads chunks 2 and 3 at the same time after chunk 1. Each chunk is still shown its context, metadata and previous-chunk tail.
UNDERDETERMINED, from the specification — rules/knowledge-base/extraction-anchors-to-read-chunk anchors a fragment to the chunk being read "whatever raw chunks the model names". The criterion "With a context listing João Silva as also called \"o Diretor\", the fragment proposed while reading chunk 3 is anchored to chunk 3." does not say which chunks the model names. So it never tests the override. Passes: An extraction that anchors each fragment to the chunks the model names in its proposal. It passes whenever the model names chunk 3 while reading chunk 3.
ADVISORY, from the specification — The criterion "For a run holding a document context, each chunk's prompt shows the same source metadata the v4 prompt shows." measures against the v4 prompt, which is not a specification node. rules/knowledge-base/extraction-reads-chunks-in-order names the metadata itself: the source's type, document date, title and reception time. The criterion would be decided by the node if it named those four.
ADVISORY, from the specification — The two João Silva criteria come from scenarios/knowledge-base/context-links-later-mention. In that scenario the model's proposal is fixed as the exact name "João Silva", so the node resolves to the chunk-1 node by name whether or not the context was shown. The name resolution itself is decided by entity-resolution nodes that are not among the candidates. These criteria check anchoring and resolution. Only the other criteria check that the context is shown.
