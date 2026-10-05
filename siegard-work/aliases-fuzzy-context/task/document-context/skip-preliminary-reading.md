---
title: Skip the preliminary reading
summary: The single-chunk and too-long paths, where a v5 extraction makes no preliminary reading and records why.
rationale: The skipped paths are cut apart from producing the context because they decide when no reading happens rather than what a reading yields, and they need no reading to be demonstrated.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: Under v5, an extraction that does not qualify for a preliminary reading records why and reads its chunks as before.
criteria:
- Under v5, an extraction over a raw information of 1 chunk makes no preliminary reading.
- Under v5, an extraction over a raw information of 1 chunk records the document context status single-chunk.
- Under v5, an extraction over more than one chunk whose content exceeds 100000 characters makes no preliminary reading.
- Under v5, an extraction over more than one chunk whose content exceeds 100000 characters records the document context status too-long.
- Under v5, an extraction whose content exceeds 100000 characters reads every chunk.
- Under v4, an extraction records no document context status.
depends_on:
- task/document-context/record-document-context
- task/alias-admission/prompt-v5-asks-for-other-names
implements:
- rules/knowledge-base/document-context-status-recorded
- rules/knowledge-base/document-context-read-first
- rules/knowledge-base/no-document-context-before-v5
- rules/knowledge-base/extraction-reads-chunks-in-order
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
- scenarios/knowledge-base/single-chunk-document-has-no-context
---
## What it is
The orchestrator, under v5, records single-chunk or too-long as the document context status when the raw information does not qualify for a preliminary reading.

## Notes

UNDERDETERMINED, from the specification — Criteria 3, 4 and 5 measure the 100000 limit in "characters". rules/knowledge-base/document-context-read-first and rules/knowledge-base/document-context-status-recorded count it in UTF-16 code units, and the decision log beside rules/knowledge-base/document-context-read-first records that this unit was chosen over Unicode code points. As written, the criteria do not fix the unit. Passes: An implementation that counts the content's length in Unicode code points. It makes a preliminary reading of a multi-chunk content of at most 100000 code points but more than 100000 UTF-16 code units, and records produced instead of too-long. That satisfies every criterion as written.
UNDERDETERMINED, from the specification — The objective says a non-qualifying extraction "reads its chunks as before", but only the too-long path has a criterion for reading chunks (criterion 5). Nothing requires that the single-chunk path reads its one chunk. rules/knowledge-base/extraction-reads-chunks-in-order requires every extraction to read its chunks. Passes: An implementation that, for a one-chunk raw information under v5, records single-chunk and makes no preliminary reading but never reads the chunk, so it proposes nothing.
UNDERDETERMINED, from the specification — Criterion 5 asks only that every chunk is read. The rest of rules/knowledge-base/extraction-reads-chunks-in-order reaches no criterion — one at a time in index order, each shown with the source's type, document date, title and reception time and the last 200 Unicode code points of the chunk before it. Nothing pins "as before" in the skip paths. Passes: An implementation that, on the too-long path, reads every chunk but out of index order, or without the previous chunk's 200-code-point tail or the source's type, document date, title and reception time.
UNDERDETERMINED, from the specification — rules/knowledge-base/no-document-context-before-v5 states three clauses for v4 and every earlier prompt version — no preliminary reading, no document context, no document context status. Criterion 6 answers only the status clause, and only for v4. Passes: An implementation that, under v4, makes a preliminary reading and stores its document context on the run but records no document context status. Or one that records a document context status under v3 or an earlier prompt version.
REMAINDER, from the specification — The failed and produced clauses of rules/knowledge-base/document-context-status-recorded reach no criterion of this task. Neither do the read-once-before-the-first-chunk clause of rules/knowledge-base/document-context-read-first ("reads that whole content once, before its first chunk, to produce the run's document context when the run holds none") or the reach of both rules to versions after v5. Here they only bound the skip paths. Belongs: The task (or tasks) delivering the preliminary reading itself (status produced) and its failure path (status failed, governed with rules/knowledge-base/failed-preliminary-reading-continues).
ADVISORY, from the specification — The criteria say "Under v5", while rules/knowledge-base/document-context-read-first and rules/knowledge-base/document-context-status-recorded say "v5 and later". Branching on equality with v5 would satisfy the criteria but not the rules once a later prompt version exists. Whether any later version can run today depends on rules/knowledge-base/prompt-version-known, which is not a candidate here.
Decision, beyond the covers — stand: rules/knowledge-base/prompt-version-known is named only to bound which later prompt versions can run, and the task implements nothing it states; the task implements nothing it states, so the claim does not grow.
