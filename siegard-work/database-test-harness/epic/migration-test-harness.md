---
title: Migrations test harness
summary: What proving a migration needs, from the manifest and suite runner to test scripts that rely on the schema already being applied.
rationale: The scope names one initiative and no epics, so keeping it as a single epic is my cut. It covers the whole impact set handed as candidates so that each constraint the plan leaves alone is recorded with a reason rather than dropped without one.
sources:
- intake/scope.md
- intake/tests-do-not-apply.md
covers:
- constraints/chat-content-is-data
- constraints/chat-reads-are-consistent
- constraints/chat-toolset
- constraints/compliance-deletion-is-atomic
- constraints/curation-is-atomic
- constraints/curation-reads-are-consistent
- constraints/curation-transports-answer-alike
- constraints/document-content-is-data
- constraints/every-operation-requires-owner-authentication
- constraints/extraction-acts-only-through-proposals
- constraints/failures-answer-one-envelope
- constraints/ingestion-transports-answer-alike
- constraints/internal-failure-withholds-cause
- constraints/llm-toolset-omits-audit-reads
- constraints/llm-toolset-omits-curation-metrics
- constraints/llm-toolset-omits-fragment-listing
- constraints/llm-toolset-omits-graph-point-reads
- constraints/local-operator-token-development-only
- constraints/mcp-failure-is-tool-error
- constraints/retrieval-is-lexical-only
- constraints/retrieval-is-read-only
- constraints/retrieval-transports-answer-alike
- constraints/unreachable-store-answers-unavailable
- domain/knowledge-base/affected-counts
- domain/knowledge-base/compliance-deletion
uncovered:
- node: constraints/chat-content-is-data
  why: It governs what the chat assistant is instructed to do; nothing in this plan instructs the assistant.
- node: constraints/chat-reads-are-consistent
  why: It governs the transaction a conversation read runs in; nothing in this plan reads a conversation.
- node: constraints/chat-toolset
  why: It governs which tools the chat assistant has; nothing in this plan changes a tool surface.
- node: constraints/compliance-deletion-is-atomic
  why: It governs the transaction a compliance deletion runs in at the service; the 0007 scripts insert compliance_deletion rows only as fixtures inside a rolled-back transaction and execute no compliance deletion.
- node: constraints/curation-is-atomic
  why: It governs the transaction a curation write runs in; nothing in this plan performs curation.
- node: constraints/curation-reads-are-consistent
  why: It governs the transaction a review queue listing or curation metrics read runs in; nothing in this plan reads either.
- node: constraints/curation-transports-answer-alike
  why: It governs how REST and MCP answer curation; nothing in this plan touches a transport.
- node: constraints/document-content-is-data
  why: It governs how an extraction presents a document to the language model; nothing in this plan extracts.
- node: constraints/every-operation-requires-owner-authentication
  why: It governs the BFF's operations; the harness runs no BFF operation and reaches the database through neonctl and pg.
- node: constraints/extraction-acts-only-through-proposals
  why: It governs the extracting language model's means of acting; nothing in this plan involves extraction.
- node: constraints/failures-answer-one-envelope
  why: It governs how a refused or failed operation answers; the harness answers no operation, and its outcome is an exit code.
- node: constraints/ingestion-transports-answer-alike
  why: It governs how REST and MCP answer ingestion; nothing in this plan touches a transport.
- node: constraints/internal-failure-withholds-cause
  why: It governs what an operation's unexpected failure answers; the harness answers no operation.
- node: constraints/llm-toolset-omits-audit-reads
  why: It governs the language model's curation tool surface; nothing in this plan changes a tool surface.
- node: constraints/llm-toolset-omits-curation-metrics
  why: It governs the language model's curation tool surface; nothing in this plan changes a tool surface.
- node: constraints/llm-toolset-omits-fragment-listing
  why: It governs the language model's query tool surface; nothing in this plan changes a tool surface.
- node: constraints/llm-toolset-omits-graph-point-reads
  why: It governs the language model's query tool surface; nothing in this plan changes a tool surface.
- node: constraints/local-operator-token-development-only
  why: It governs the BFF's local operator token carve-out; nothing in this plan authenticates through the BFF.
- node: constraints/mcp-failure-is-tool-error
  why: It governs how MCP renders a failure; nothing in this plan touches a transport.
- node: constraints/retrieval-is-lexical-only
  why: It governs how retrieval matches text; nothing in this plan retrieves.
- node: constraints/retrieval-is-read-only
  why: It governs the transaction a retrieval runs in; nothing in this plan retrieves.
- node: constraints/retrieval-transports-answer-alike
  why: It governs how REST and MCP answer retrieval; nothing in this plan touches a transport.
- node: constraints/unreachable-store-answers-unavailable
  why: It governs what an operation answers when the store is unreachable; the harness answers no operation.
---

## What it is
The manifest, lockfile, suite runner and production marker that the database-migrations standard presupposes under migrations/.
The three 0007 test scripts, cut back so they rely on the schema already being applied.

## Notes
The scope's wording matched no domain node, so the constraints arrived as candidates rather than as nodes the scope speaks to.
