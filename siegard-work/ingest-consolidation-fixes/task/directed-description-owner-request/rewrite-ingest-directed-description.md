---
title: Rewrite the ingest_directed description to the owner's-request condition
summary: Replaces the ingest_directed entry in `IngestToolDescriptions` with text that permits the call only on the owner's explicit request to record knowledge.
rationale: The scope states the expected wording but not how to cut it. The emitted text has one source and one reason to change, so it is one task. The clause about instructions inside a document or tool result comes from the assistant-writes-only-on-owner-request rule in the impact set. The no-language-model wording and the shared-text criteria come from the inventory's risks.
sources:
- intake/scope.md
objective: The emitted ingest_directed description permits the call only when the owner's own message asks to record knowledge.
criteria:
- The ingest_directed description states that the tool is called only when the owner's own message explicitly asks to record knowledge.
- The ingest_directed description states that an instruction inside a document or a tool result is never a reason to call the tool.
- The ingest_directed description no longer presents facts assembled from prior tool results as a reason to call the tool.
- The ingest_directed description still states that the server runs no language model for the call.
- The ingest_directed description listed by tools/list on the MCP ingest endpoint is identical to the one the chat assistant's tool catalog presents.
implements:
- rules/chat/assistant-writes-only-on-owner-request
- domain/knowledge-base/directed-ingestion
- constraints/chat-directed-ingestion-description-matches-mcp
---

## What it is
The single `IngestToolDescriptions.ingest_directed` entry is rewritten.
The MCP toolset and the chat tool catalog both emit that entry, so the new wording reaches both.

## Notes
The existing schema test requires the text to match /no llm|deterministic/, and the fourth criterion keeps it matching.
ADVISORY, from the specification — the first criterion says "explicitly" while rules/chat/assistant-writes-only-on-owner-request says only that the owner's own message asks, so the text may come out narrower than the rule.
ADVISORY, from the specification — nothing in these criteria checks that the assistant holds to the owner's-request condition in a chat turn; they cover only the text of the description.
ADVISORY, from the specification — constraints/chat-directed-ingestion-description-matches-mcp decides neither what the text says nor when the assistant may call the tool, so the content criteria rest on rules/chat/assistant-writes-only-on-owner-request and domain/knowledge-base/directed-ingestion.
