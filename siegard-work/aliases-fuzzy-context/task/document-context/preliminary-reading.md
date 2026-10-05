---
title: Preliminary reading produces the document context
summary: The single whole-document model reading that, under v5, yields and records the document context of a multi-chunk run before its first chunk.
rationale: Producing the context is cut apart from the skipped and failed paths and from showing it to each chunk, because each of those changes for its own reason.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: Under v5, an extraction over a raw information of more than one chunk and at most 100000 characters records a document context produced by one preliminary reading.
criteria:
- Under v5, an extraction whose run holds no document context, over a raw information of 3 chunks and at most 100000 characters, makes exactly one preliminary reading.
- The preliminary reading is made before the first chunk is read.
- The preliminary reading is given the whole content of the raw information.
- The preliminary reading calls the configured context model.
- The recorded document context names the model that produced it.
- The run records the document context the preliminary reading yields.
- The run records the document context status produced.
- No recorded document context holds a summary of more than 5 lines.
- A preliminary reading whose summary runs to 7 lines yields a recorded document context whose summary is the first 5 lines of that summary.
- A preliminary reading that lists an entity under a node type the catalog does not hold yields a recorded document context without that entity.
- The preliminary reading records no tool call.
- Before the first chunk is read, the knowledge base holds no knowledge node, information fragment, knowledge link or node attribute read from the raw information.
- The preliminary reading presents the content to the model marked apart from its instructions as data.
- The model call of the preliminary reading waits at most five minutes.
- The model call of the preliminary reading is retried at most twice.
- Under v4, an extraction makes no preliminary reading.
depends_on:
- task/document-context/record-document-context
- task/document-context/context-model-setting
- task/alias-admission/prompt-v5-asks-for-other-names
implements:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context
- domain/knowledge-base/document-entity
- domain/knowledge-base/document-context-status
- rules/knowledge-base/document-context-read-first
- rules/knowledge-base/document-context-status-recorded
- rules/knowledge-base/document-context-model
- rules/knowledge-base/document-context-summary-lines
- rules/knowledge-base/document-context-summary-cut-to-five-lines
- rules/knowledge-base/document-context-entity-type-in-catalog
- rules/knowledge-base/no-document-context-before-v5
- constraints/document-content-is-data
- constraints/extraction-model-call-bounded
- scenarios/knowledge-base/preliminary-reading-proposes-nothing
---
## What it is
The extraction orchestrator, under v5, makes one model call over the whole content before its chunk loop and records the document context it yields.

## Notes

The injectable AnthropicLike factory, the request timeout and the retry constants in extraction.service.ts are reused for the new call.
The preliminary reading sits beside the chunk loop and does not copy it.
UNDERDETERMINED, from the specification — The statement of rules/knowledge-base/document-context-read-first sets three conditions on when the preliminary reading happens: the raw information holds more than one chunk, its content is at most 100000 UTF-16 code units, and the run holds no document context yet. No criterion checks the case where any of these fails. Every criterion uses a 3-chunk content that is within the limit and a run with no context. So no criterion requires that a one-chunk raw information, a content over the limit, or a run that already holds a context gets no preliminary reading. scenarios/knowledge-base/single-chunk-document-has-no-context and scenarios/knowledge-base/retried-run-reuses-context say this, and neither is backed by a criterion of this task. Passes: An implementation that makes the preliminary reading on every v5 extraction. It reads a one-chunk raw information, a multi-chunk content longer than 100000 UTF-16 code units, and a retried run that already holds a document context, where it replaces the context it held.
UNDERDETERMINED, from the specification — The objective and the first criterion give the limit as "at most 100000 characters". rules/knowledge-base/document-context-read-first and rules/knowledge-base/document-context-status-recorded count it in UTF-16 code units, a unit its log entry decided. No criterion pins the unit. Counting in Unicode code points gives a different answer when the content holds characters outside the Basic Multilingual Plane. Passes: An implementation that measures the content in Unicode code points. It makes a preliminary reading of a 3-chunk content of 100000 code points that is longer than 100000 UTF-16 code units, a content the rule says gets no reading.
UNDERDETERMINED, from the specification — The statement of rules/knowledge-base/document-context-model has a second clause: claude-haiku-4-5 is used where no context model is configured. The criteria cover only the configured case ("calls the configured context model"). No criterion covers the case where nothing is configured. Passes: An implementation that, when no context model is configured, makes the preliminary reading with the run's extraction model, or skips the reading. It still calls the configured model whenever one is configured.
UNDERDETERMINED, from the specification — The statement of rules/knowledge-base/document-context-summary-lines defines a line: it ends at a newline character or at the summary's end, a carriage return ends no line, an empty line counts as a line, and a newline that ends the summary starts no further line. The criteria check the 5-line limit and the 7-line cut. No criterion checks how lines are counted, so cutting to "the first 5 lines" can give a different result from what the rule requires. Passes: An implementation that counts lines after dropping empty lines and treats a carriage return as a line end. It keeps the summary "a\n\nb\nc\nd\ne" whole as 5 lines, where the rule counts 6 and cuts it to "a\n\nb\nc\nd".
REMAINDER, from the specification — The statement of rules/knowledge-base/document-context-status-recorded has three more clauses: single-chunk for a one-chunk raw information of any length, too-long for more than one chunk with content over 100000 UTF-16 code units, and failed when the preliminary reading fails. They are not reached here. This task answers only the produced clause. Belongs: The task that records the document context status when no document context is produced (one chunk, content over the limit, failed preliminary reading), together with rules/knowledge-base/failed-preliminary-reading-continues and scenarios/knowledge-base/single-chunk-document-has-no-context and scenarios/knowledge-base/failed-context-reading-keeps-extracting.
REMAINDER, from the specification — The statement of rules/knowledge-base/no-document-context-before-v5 also says a v4 or earlier extraction "records no document context and no document context status". The v4 criterion checks only that no preliminary reading is made. Belongs: The task that records the document context status, where a status written under prompt version v4 or earlier would come from.
REMAINDER, from the specification — The statement of constraints/document-content-is-data also covers how "the document context read from it" is presented to the model. That happens when each chunk is read and shown the run's document context, not in the preliminary reading. Belongs: The task that reads chunks in order and shows each one the run's document context (rules/knowledge-base/extraction-reads-chunks-in-order).
ADVISORY, from the specification — The criterion "The preliminary reading records no tool call." is fully backed only by domain/knowledge-base/tool-call ("The record of one proposal made within an LLM run"), which is not a candidate. Among the candidates, the backing is indirect: scenarios/knowledge-base/preliminary-reading-proposes-nothing ("no proposal is made") and the description of domain/knowledge-base/llm-run ("Its tool calls are the record of every proposal made within it").
Decision, beyond the covers — stand: domain/knowledge-base/tool-call is named only to back that a tool call records a proposal, and the task implements nothing it states.
