---
title: propose_node answers its unadmitted aliases
summary: The MCP and REST answers of propose_node, and the tool call recorded for it, carrying each alias that was not admitted.
rationale: The transport answers are cut apart from the admission check because they consume the result of the service rather than decide it.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: Every answer of propose_node lists each proposed alias that was not admitted, with its reason.
criteria:
- Over MCP, the propose_node answer lists each alias that was not admitted, with the reason ALIAS_NOT_IN_SOURCE.
- Over the REST mirror, the propose-node answer lists each alias that was not admitted, with the reason ALIAS_NOT_IN_SOURCE.
- A propose_node answer whose aliases were all admitted lists no alias as not admitted.
- The tool call recorded for a node proposal holds the list of aliases that were not admitted in its result.
- In an extraction, the tool result returned to the model for a node proposal carries the list of aliases that were not admitted.
depends_on:
- task/alias-admission/admit-aliases-from-source
implements:
- contracts/knowledge-base/ingestion
- rules/knowledge-base/alias-admitted-only-from-source
- rules/knowledge-base/extraction-answers-proposals-as-contract
- rules/knowledge-base/every-proposal-audited
- scenarios/knowledge-base/alias-absent-from-source-not-admitted
---
## What it is
The answer contract of propose_node goes from node identity and resolution to node identity, resolution and the aliases that were not admitted.

## Notes

The result is stored verbatim in tool_call.result and echoed back to the extraction model as the tool_result.
Tool descriptions are emitted text shown to the model, and changing one is a contract change.
UNDERDETERMINED, from the specification — The criteria do not stop an answer from listing an admitted alias as not admitted when the proposal mixes admitted and unadmitted aliases. Criterion 3 only covers a proposal whose aliases were all admitted. The criteria are "Over MCP, the propose_node answer lists each alias that was not admitted, with the reason ALIAS_NOT_IN_SOURCE." and "A propose_node answer whose aliases were all admitted lists no alias as not admitted." contracts/knowledge-base/ingestion (propose-node accepted) says the answer carries "each proposed alias that was not admitted". rules/knowledge-base/alias-admitted-only-from-source decides which aliases are admitted, so an admitted alias reported as not admitted is a false answer. Passes: As soon as any one alias of a propose_node call fails admission, the implementation lists every proposed alias of that call as not admitted with the reason ALIAS_NOT_IN_SOURCE, and it lists none when all are admitted. This meets all five criteria, but the answer then names as not admitted aliases that rules/knowledge-base/alias-admitted-only-from-source admitted and new-node-aliases or matched-node-gains-only-aliases recorded on the node.
REMAINDER, from the specification — This task's criteria do not reach the admission test of rules/knowledge-base/alias-admitted-only-from-source, which is "admitted only when its normalized form occurs in the normalized content of the raw information of the proposal's LLM run". They do not reach its exception "except within a directed ingestion" either. The criteria only report the outcome of admission. They do not decide it, and they do not cover recording or skipping the alias (scenarios/knowledge-base/alias-absent-from-source-not-admitted, its "then" saying the alias is not recorded, and scenarios/knowledge-base/directed-alias-admitted-without-source). Belongs: The alias-admission task that decides admission against the run's raw information and records only admitted aliases (with rules/knowledge-base/new-node-aliases and rules/knowledge-base/matched-node-gains-only-aliases), including the directed-ingestion exception.
REMAINDER, from the specification — This task does not reach the general clause of rules/knowledge-base/extraction-answers-proposals-as-contract, "An extraction hands back to the model each proposal call whose arguments parse with the answer the published ingestion contract gives that proposal", for fragment, link and attribute proposals. Only its node-proposal clause is answered here, by the criterion about the extraction tool result. Belongs: The extraction loop's dispatch of parsed proposal calls to the published proposal handlers. Its decision log records this as the loop's existing behavior, so it belongs to the delivered extraction act or the task that verifies it, not to this one.
REMAINDER, from the specification — This task does not reach the clauses of rules/knowledge-base/every-proposal-audited other than the result of a node proposal that was taken. Those clauses are "whichever transport carried it", "whether it was taken, refused or failed", and the exception "unless recording the tool call of a refused or failed proposal itself fails". Criterion 4 relies on them only for the node proposal's recorded result. Belongs: The proposal-audit act that records a tool call for every proposal on both transports, with the stated exception for a failed recording.
