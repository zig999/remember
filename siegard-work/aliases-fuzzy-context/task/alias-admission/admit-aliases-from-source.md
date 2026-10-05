---
title: Admit aliases only from the source
summary: The alias admission check in the node-proposal service, made against the normalized content of the raw information of the run, with directed ingestion exempt.
rationale: Admission is cut apart from the transport answers because the service result is the interface and the MCP and REST answers are its consumers. The directed exemption stays here because it is the boundary of the same rule, and the run itself identifies a directed ingestion.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: A node proposal records only the aliases whose normalized form occurs in the normalized content of the raw information of its run, outside directed ingestion.
criteria:
- A node proposal named "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq", in a run whose source says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto", creates a node whose canonical alias is "Conselho Nacional de Desenvolvimento Científico".
- That created node also holds the alias "CNPq".
- Outside a directed ingestion, a proposed alias whose normalized form does not occur in the normalized content of the raw information of the run is not recorded on the knowledge node.
- A node proposal carrying an alias that is not admitted is still resolved, and answers its node identity and resolution.
- A proposed alias that differs from the source text only in case, accents or inner whitespace is not refused as ALIAS_NOT_IN_SOURCE.
- A proposed alias that occurs in a chunk other than the one being read is not refused as ALIAS_NOT_IN_SOURCE.
- Within a directed ingestion, a proposed alias that no fragment text holds is not refused as ALIAS_NOT_IN_SOURCE.
- A node proposal resolved to an existing knowledge node adds each admitted alias to that node.
- A node proposal resolved to an existing knowledge node does not add its proposed name to that node.
- The result of the node-proposal service names each alias it did not admit, with the reason ALIAS_NOT_IN_SOURCE.
- After "CNPq" is admitted on a node, a later proposal of the same node type named "CNPq" resolves as matched_existing to that node.
implements:
- rules/knowledge-base/alias-admitted-only-from-source
- rules/knowledge-base/new-node-aliases
- rules/knowledge-base/matched-node-gains-only-aliases
- rules/knowledge-base/name-normalization
- rules/knowledge-base/exact-alias-resolves
- contracts/knowledge-base/ingestion
- scenarios/knowledge-base/acronym-in-source-is-admitted
- scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
- scenarios/knowledge-base/alias-absent-from-source-not-admitted
- scenarios/knowledge-base/directed-alias-admitted-without-source
---
## What it is
The node-proposal service checks each proposed alias against the raw information of its run before the alias is attached.
Aliases that pass are attached as they are today, and aliases that fail are returned in the result of the service with their reason.

## Notes

The check belongs in or beside attachAliases in entity-resolution.service.ts, and not in a second insertion path.
The database norm() is the authority on normalization, and src/modules/knowledge-graph/service/norm.ts is a separate TypeScript implementation of it.
A directed ingestion opens its run with model directed and prompt version directed-v1.
UNDERDETERMINED, from the specification — Three criteria only say that an alias is not refused as ALIAS_NOT_IN_SOURCE. They are "A proposed alias that differs from the source text only in case, accents or inner whitespace is not refused as ALIAS_NOT_IN_SOURCE." and "A proposed alias that occurs in a chunk other than the one being read is not refused as ALIAS_NOT_IN_SOURCE." None of them says the alias is admitted and recorded. Under rules/knowledge-base/alias-admitted-only-from-source such an alias is admitted. Under rules/knowledge-base/new-node-aliases and rules/knowledge-base/matched-node-gains-only-aliases an admitted alias is held by, or added to, its node. Passes: An implementation that drops such an alias. It does not record the alias on the knowledge node and does not list it as not admitted. That satisfies every criterion as written, but the specification requires the alias to be recorded.
UNDERDETERMINED, from the specification — Criterion "Within a directed ingestion, a proposed alias that no fragment text holds is not refused as ALIAS_NOT_IN_SOURCE." only says the alias is not refused. scenarios/knowledge-base/directed-alias-admitted-without-source requires the alias "Petrobras" to be recorded on the knowledge node. rules/knowledge-base/alias-admitted-only-from-source exempts directed ingestion from the check, and rules/knowledge-base/new-node-aliases records every admitted alias. Passes: An implementation that ignores every alias stated in a directed ingestion. It neither refuses the alias nor records it on the node. That satisfies the criterion, but the specification requires the alias to be recorded.
UNDERDETERMINED, from the specification — rules/knowledge-base/name-normalization normalizes names by trimming them, in addition to lower-casing, removing accents and collapsing inner whitespace. Criterion "A proposed alias that differs from the source text only in case, accents or inner whitespace is not refused as ALIAS_NOT_IN_SOURCE." does not mention trimming. No criterion checks leading or trailing whitespace on a proposed alias. Passes: An implementation that does not trim the proposed alias before looking for it in the normalized source. It refuses " CNPq " against a source that says "(CNPq)" with ALIAS_NOT_IN_SOURCE, even though the normalization rule requires trimming. Every criterion as written still passes.
REMAINDER, from the specification — rules/knowledge-base/name-normalization also applies to entity resolution, the node listing and the node layer's approximate match. Only the alias-admission clause reaches a criterion of this task. Belongs: The tasks that deliver entity resolution, the node listing and the approximate node search. The approximate node search is the approximate-match work of this same analysis.
REMAINDER, from the specification — rules/knowledge-base/exact-alias-resolves resolves a name only to an active knowledge node of the proposal's node type. Criterion "After "CNPq" is admitted on a node, a later proposal of the same node type named "CNPq" resolves as matched_existing to that node." covers the node type, but no criterion covers the "active" clause. Belongs: The entity-resolution behavior of node proposals. That behavior is already delivered, or is another task's, and this task depends on it without changing it.
ADVISORY, from the specification — scenarios/knowledge-base/directed-alias-admitted-without-source involves domain/knowledge-base/directed-ingestion, which is not among the candidates. The exemption in criteria 7 and 11 depends on knowing that a run belongs to a directed ingestion. If the executor needs that node to tell which runs are directed, the epic's claim must grow to include it.
Decision, beyond the covers — stand: domain/knowledge-base/directed-ingestion is read only to tell a directed ingestion's run apart, which the run itself already marks by its model and prompt version; the task implements nothing it states, so the claim does not grow.
ADVISORY, from the specification — rules/knowledge-base/extraction-answers-proposals-as-contract also requires the extraction to give the model the aliases that were not admitted, with their reason. That is neighboring work and is not implemented here. The same holds for rules/knowledge-base/every-proposal-audited, which records the node proposal's result, now carrying the aliases that were not admitted, on its tool call. The candidates about prompt versions and extraction prompts (domain/knowledge-base/prompt-version, rules/knowledge-base/extraction-asks-for-other-names, rules/knowledge-base/extraction-before-v5-asks-for-no-other-names, rules/knowledge-base/extraction-prompt-v5-keeps-v4, rules/knowledge-base/default-prompt-version, rules/knowledge-base/prompt-version-known, rules/knowledge-base/extraction-prompt-names-relative-date-words, rules/knowledge-base/extraction-relative-date-falls-back-to-reception) do not govern this task's objective.
