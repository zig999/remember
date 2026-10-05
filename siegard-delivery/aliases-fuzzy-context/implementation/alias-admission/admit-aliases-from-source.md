---
target: backend
task: sha256:677ef28d2ee3c2696815c230753bf71719c1bd85b5aa83b947f3d3dfbaf8194c
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/alias-admission-admit-aliases-from-source-build
title: Alias admission against the source in the node-proposal service
summary: A node proposal now records only the aliases whose normalized form occurs in the normalized content of its run's raw information, exempts directed runs, and names each refused alias with ALIAS_NOT_IN_SOURCE in the service result.
files:
- path: src/modules/ingestion/service/entity-resolution.service.ts
  effect: 'Rewritten whole, without comments. resolveOrCreateNode takes the name lock, then runs one admission query (admitAliases) that uses the database norm() on the proposed alias and on the run''s raw information content. It compares by substring and exempts runs whose model is "directed" and prompt version is "directed-v1". Only admitted aliases reach attachAliases and attachCanonicalAndAliases. On a matched-existing resolution the proposed name is never attached, even when an alias equals it. The result now carries aliases_not_admitted, each entry {alias, reason: "ALIAS_NOT_IN_SOURCE"}. The old body is split into named helpers (MNT-01) with the same SQL and the same query order. The trigram LIMIT is now a bound parameter.'
- path: src/modules/ingestion/service/propose-node.service.ts
  effect: Rewritten whole, without comments. proposeNodeService copies aliases_not_admitted from the resolution into the ok:true result next to node_id and resolution.
- path: src/modules/ingestion/dto/propose-node.dto.ts
  effect: Rewritten whole, without comments. Adds the ALIAS_NOT_IN_SOURCE constant, the AliasNotAdmitted type, and an optional aliases_not_admitted on ProposeNodeResult. Input schema and resolution type are unchanged.
- path: src/modules/ingestion/service/directed-run.ts
  effect: New. Sole home of DIRECTED_MODEL ("directed") and DIRECTED_PROMPT_VERSION ("directed-v1"), so entity resolution can identify a directed run without importing the directed-ingestion service. That import would have been a service-to-service import (LAY-04) and an import cycle.
- path: src/modules/ingestion/service/directed-ingestion.service.ts
  effect: The two constant definitions and their comments are replaced by an import from directed-run.ts and a re-export of the same names. The values and the exports are unchanged, so existing importers keep working.
criteria:
- criterion: A node proposal named "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq", in a run whose source says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto", creates a node whose canonical alias is "Conselho Nacional de Desenvolvimento Científico".
  met: true
  how: The name is unchanged by the admission step. createNewNode in entity-resolution.service.ts inserts it as the 'canonical' alias through attachCanonicalAndAliases, as before.
- criterion: That created node also holds the alias "CNPq".
  met: true
  how: ALIAS_ADMISSION_SQL admits "CNPq" because norm("CNPq") = "cnpq" occurs in norm(content), which contains "(cnpq)". admission.admitted then goes to attachCanonicalAndAliases, which inserts it with kind 'alias'.
- criterion: Outside a directed ingestion, a proposed alias whose normalized form does not occur in the normalized content of the raw information of the run is not recorded on the knowledge node.
  met: true
  how: The admission query returns admitted=false for such an alias. It is filtered out of admitted and admittedOtherThanName, so no INSERT INTO node_alias is issued for it. This holds in every branch (exact, strong-unique, needs_review, created).
- criterion: A node proposal carrying an alias that is not admitted is still resolved, and answers its node identity and resolution.
  met: true
  how: Admission only filters the alias list. resolveWithAdmittedAliases still runs the exact and trigram resolution and creation, and proposeNodeService answers ok:true with node_id and resolution.
- criterion: A proposed alias that differs from the source text only in case, accents or inner whitespace is not refused as ALIAS_NOT_IN_SOURCE.
  met: true
  how: Both sides go through the database norm() (lower, unaccent, btrim, whitespace collapse), the same function that stores alias_norm. No TypeScript norm is used. The alias is also admitted, not just spared the refusal.
- criterion: A proposed alias that occurs in a chunk other than the one being read is not refused as ALIAS_NOT_IN_SOURCE.
  met: true
  how: The comparison is against raw_information.content of the run's input raw information (joined through llm_run.input_raw_information_id), not against any chunk or fragment. The alias is admitted and recorded.
- criterion: Within a directed ingestion, a proposed alias that no fragment text holds is not refused as ALIAS_NOT_IN_SOURCE.
  met: true
  how: The query's `directed` column is true when llm_run.model = 'directed' and prompt_version = 'directed-v1'. It short-circuits admitted to true, so the alias is admitted and recorded on the node.
- criterion: A node proposal resolved to an existing knowledge node adds each admitted alias to that node.
  met: true
  how: matchExisting calls attachAliases with the admitted aliases, for both the exact-match and the strong-unique trigram resolution.
- criterion: A node proposal resolved to an existing knowledge node does not add its proposed name to that node.
  met: true
  how: matchExisting never inserts the name. It passes admittedOtherThanName, which excludes any admitted alias whose norm equals norm(name), so listing the name among the aliases does not add it either.
- criterion: The result of the node-proposal service names each alias it did not admit, with the reason ALIAS_NOT_IN_SOURCE.
  met: true
  how: 'admitAliases builds notAdmitted as {alias, reason: ALIAS_NOT_IN_SOURCE}. resolveOrCreateNode returns it as aliases_not_admitted, and proposeNodeService puts it in result. It is always present, empty when nothing was refused.'
- criterion: After "CNPq" is admitted on a node, a later proposal of the same node type named "CNPq" resolves as matched_existing to that node.
  met: true
  how: 'The admitted alias is stored in node_alias with the generated alias_norm. The unchanged exact step (findExactMatch: alias_norm = norm(name), same node type, active) matches it and returns matched_existing.'
nodes:
- node: rules/knowledge-base/alias-admitted-only-from-source
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  - src/modules/ingestion/service/directed-run.ts
  how: 'The invariant is ALIAS_ADMISSION_SQL plus admitAliases: an alias is admitted when its norm occurs in norm(raw_information.content) of the run''s raw information, or when the run is directed (model and prompt version from directed-run.ts).'
- node: rules/knowledge-base/new-node-aliases
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: createNewNode inserts the proposed name as the canonical alias and each admitted alias as an alias (attachCanonicalAndAliases fed admission.admitted).
- node: rules/knowledge-base/matched-node-gains-only-aliases
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: matchExisting attaches only admitted aliases and never the name, excluding aliases that equal the name after norm (admittedOtherThanName).
- node: rules/knowledge-base/name-normalization
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: Alias admission compares through the database norm() (lower, unaccent, trim, whitespace collapse) on both sides, so trimming applies to the proposed alias. Entity resolution already used the same function. The node listing and approximate match are other tasks' and were not reached.
- node: rules/knowledge-base/exact-alias-resolves
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: findExactMatch keeps the exact alias_norm match against active nodes of the proposal's node type, same SQL as before. Admitted aliases are stored in node_alias, so they resolve later proposals. The "active" clause is unchanged and is not covered by a criterion of this task.
- node: contracts/knowledge-base/ingestion
  encoded_at:
  - src/modules/ingestion/dto/propose-node.dto.ts
  - src/modules/ingestion/service/propose-node.service.ts
  how: 'Only the service result of propose-node is answered here: node identity, resolution, and each alias not admitted with ALIAS_NOT_IN_SOURCE. The MCP and REST wire answers, the recorded tool call and the extraction''s tool result are other tasks'' and were not changed.'
- node: scenarios/knowledge-base/acronym-in-source-is-admitted
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: The CNPq scenario is the first two criteria. The source contains "(CNPq)", so the alias is admitted and the node is created with the canonical name and the alias.
- node: scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: The admitted "CNPq" is persisted with alias_norm, and the unchanged exact step resolves a later same-type proposal named "CNPq" as matched_existing.
- node: scenarios/knowledge-base/alias-absent-from-source-not-admitted
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  - src/modules/ingestion/service/propose-node.service.ts
  how: '"Petrobras" against a source that says only "a estatal" is not inserted, the proposal is still resolved, and the result lists it in aliases_not_admitted with ALIAS_NOT_IN_SOURCE. Carrying that list over MCP and REST is the sibling task.'
- node: scenarios/knowledge-base/directed-alias-admitted-without-source
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  - src/modules/ingestion/service/directed-run.ts
  how: A run with model "directed" and prompt version "directed-v1" admits every proposed alias, so "Petrobras" is recorded on the node. domain/knowledge-base/directed-ingestion was read only to identify the run, as the task's decision states.
inferences:
- inferred: The service result field is named aliases_not_admitted, a list of {alias, reason}. It is always set by the service, empty when none, and typed optional on ProposeNodeResult.
  from: The contract says only "each proposed alias that was not admitted, with the reason ALIAS_NOT_IN_SOURCE" and names no field. The sibling task propose-node-answers-unadmitted-aliases consumes this name on the wire. It was optional in the type so the existing directed-ingestion mocks, which build a ProposeNodeResult without the field, still type-check. This field name should be confirmed or settled in the specification.
- inferred: '"Occurs in" is a plain substring test of norm(alias) in norm(content). There are no word boundaries, and the whole raw content is searched, with no chunk or fragment scoping.'
  from: The rule says "occurs in the normalized content" and the criteria require chunk-independence. Nothing asks for word-boundary matching.
- inferred: An alias whose normalized form is empty (blank) is never admitted. It is reported as ALIAS_NOT_IN_SOURCE instead of reaching an INSERT that the node_alias CHECK (btrim(alias) <> '') would reject.
  from: norm('') occurs vacuously in any text. The rule's intent and the table constraint both say a blank alias cannot be a name.
- inferred: If the run or its raw information cannot be read, the aliases are reported as not admitted (fail closed) rather than silently dropped or admitted.
  from: The rule admits only on evidence from the source. The LEFT JOIN in ALIAS_ADMISSION_SQL guarantees every proposed alias appears in the answer.
- inferred: A directed run is identified by llm_run.model = 'directed' and prompt_version = 'directed-v1', read in the same admission query. No parameter is added to RunContext or to the handlers.
  from: The task Notes state that a directed ingestion opens its run with those two values, and the run row is already the authority the handler uses.
- inferred: The two sentinel constants moved to a new non-service file and are re-exported from directed-ingestion.service.ts, not duplicated and not imported from that service.
  from: The inventory's must_not_duplicate guidance, LAY-04, and the cycle directed-ingestion -> propose-node.handler -> propose-node.service -> entity-resolution -> directed-ingestion.
- inferred: The trigram candidate LIMIT became a bound parameter ($3) in the file this task delivers whole. The value stays 10.
  from: SEC-02 (every statement parameterized). It is behavior-neutral.
preserved:
- 'The resolve-or-create pipeline order: advisory lock, exact alias_norm match, trigram candidates, the A12 decision (MATCH_STRONG 0.85, MATCH_FLOOR 0.55), then create or match, with the same SQL for each step.'
- decideFromCandidates and the exported MATCH_STRONG and MATCH_FLOOR keep their behavior and signatures.
- A proposal with no aliases issues no extra query and resolves exactly as before.
- The needs_review branch still inserts the node, then one entity_match_review row per candidate at or above the floor, then the canonical alias and the aliases.
- Alias inserts remain ON CONFLICT DO NOTHING, with kind 'canonical' for the name on new nodes and 'alias' for the others.
- DIRECTED_MODEL and DIRECTED_PROMPT_VERSION are still exported from directed-ingestion.service.ts with the same values.
- ProposeNodeInputSchema is unchanged, so the MCP and REST input contract is unchanged.
- deriveValidationOutcome still reads only resolution, so the validation outcome of a node proposal is unchanged.
deferred:
- what: The wire answers of propose_node over MCP and REST, the tool_call result row, and the extraction's tool_result returned to the model carrying aliases_not_admitted.
  why: These are the sibling task propose-node-answers-unadmitted-aliases. The field already flows through the handler's result and tool_call_result because both spread the service result, but that task owns and verifies the transport answers.
- what: Existing unit specs entity-resolution.spec.ts and propose-service-layer.spec.ts will need updating. Their SQL stub throws on the new admission query ("SELECT a.alias ...") whenever aliases are supplied. A proposal with no aliases is unaffected.
  why: This delivery writes no tests, and the proof that covers the admission criteria is another judge's.
- what: The remaining pre-existing comments in directed-ingestion.service.ts.
  why: The edit there touched only the constants block, and rewriting 1,100 lines to strip prose would widen the task. The comment route (removal, then reconcile) covers it.
- what: entity-resolution.service.ts now imports the value constants from directed-run.ts, but propose-node.service.ts still imports entity-resolution.service.ts, a service-to-service import that was already there.
  why: LAY-04 on that existing edge predates this task, and the fix (moving shared behavior down or up into a factory) reaches beyond the objective.
---

## What it is

A node proposal now records only the aliases whose normalized form occurs in the normalized content of its run's raw information, exempts directed runs, and names each refused alias with ALIAS_NOT_IN_SOURCE in the service result.

## Notes

The service result field name aliases_not_admitted is the implementation's choice; the specification states the answer, not the field name.
A blank alias is reported as not admitted rather than reaching an insert the table would refuse, and an unreadable run fails closed by reporting every alias as not admitted.
