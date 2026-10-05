---
title: Context model setting
summary: The configured model for the preliminary reading, with its default, threaded to every place that builds the extraction orchestrator.
rationale: The setting is cut apart from the preliminary reading because it changes with the deployment configuration and is threaded through the env, app, stdio and route wiring, none of which the reading itself touches.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: Every entry point that runs an extraction hands the orchestrator the configured context model.
criteria:
- With no context model configured, the context model the environment yields is claude-haiku-4-5.
- With a context model configured, the environment yields that model.
- The REST run-extraction route hands the configured context model to the orchestrator.
- The MCP ingest toolset hands the configured context model to the orchestrator.
- The stdio server hands the configured context model to the orchestrator.
implements:
- rules/knowledge-base/document-context-model
---
## What it is
The env schema gains a context model setting with its default, and the wiring passes it into the orchestrator dependencies.

## Notes

Today the REST run route passes only ANTHROPIC_API_KEY, the MCP toolset passes ANTHROPIC_API_KEY and INGEST_MODEL, and the stdio server builds its own env.
UNDERDETERMINED, from the specification — rules/knowledge-base/document-context-model states "A document context is produced under the configured context model, or under claude-haiku-4-5 where none is configured." The task's criteria answer the "configured, or claude-haiku-4-5 where none is configured" clause through criteria 1 and 2. Criteria 3 to 5 only require each entry point to hand the model to the orchestrator. No criterion requires that a document context is actually produced under the model that was handed over, so the clause "is produced under the configured context model" is answered by no criterion here. If another task's criteria require the preliminary reading to use that model, this note is answered there. Otherwise the clause has to reach a criterion. Passes: The environment yields the configured context model, or claude-haiku-4-5 when none is set. The REST run-extraction route, the MCP ingest toolset and the stdio server each pass that value to the orchestrator. The orchestrator then ignores the value and runs the preliminary reading under the run's own extraction model (LLMRun.model). So the document context is produced under a model other than the configured context model.
ADVISORY, from the specification — The criterion "The stdio server hands the configured context model to the orchestrator." names an entry point that no candidate names. contracts/knowledge-base/ingestion describes only REST and MCP surfaces. The criterion is still backed, because the rule in rules/knowledge-base/document-context-model applies to every document context whatever the entry point. But the stdio server cannot be checked against any operation in a contract.
ADVISORY, from the specification — domain/knowledge-base/document-context declares a required `model` attribute, and rules/knowledge-base/document-context-model constrains that node. This task only sets up and passes along the configured model. Recording the model on the document context is not addressed by any criterion here. So the node is left out of `implements` as a neighbor, and it belongs to whichever task produces and stores the document context.
