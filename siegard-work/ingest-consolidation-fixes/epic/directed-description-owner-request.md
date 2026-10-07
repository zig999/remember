---
title: ingest_directed description confines its use to the owner's request
summary: Rewrites the emitted ingest_directed tool description so that it permits the call only when the owner explicitly asks to record knowledge.
rationale: The planner asked for one epic per behavior. The scope's item (4) changes text that every MCP client and the chat assistant are shown, which is a different reason to change from the envelope's field order, so it gets its own epic.
sources:
- intake/scope.md
covers:
- rules/chat/assistant-writes-only-on-owner-request
- domain/knowledge-base/directed-ingestion
- constraints/chat-toolset
- rules/chat/chat-prompt-v4-pins-known-entity
- constraints/document-content-is-data
- constraints/chat-directed-ingestion-description-matches-mcp
uncovered:
- node: constraints/chat-toolset
  why: The assistant's set of tools, and the conditions under which directed ingestion is in it, stay as they are. Only the tool's description changes.
- node: rules/chat/chat-prompt-v4-pins-known-entity
  why: The v4 chat prompt is left unchanged. The description must stay consistent with it, but this plan does not touch it.
- node: constraints/document-content-is-data
  why: The constraint governs how an extraction presents document content to the language model. Directed ingestion runs no language model, and this plan changes no extraction.
---

## What it is
The ingest_directed description stops inviting writes the assistant decides on by itself, such as writing facts it assembled from earlier tool results.
It says the tool is called only when the owner's own message asks to record knowledge.

## Notes
The inventory found no specification node holding the description's wording. contracts/knowledge-base/ingestion holds only the tool's validation error message.
The description is text the MCP toolset and the chat tool catalog emit from one `IngestToolDescriptions` entry, not a source comment.
