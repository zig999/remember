---
target: backend
title: Review of the aliases-fuzzy-context delivery
summary: The four passes over the 51 backend files the 14 delivered tasks of aliases-fuzzy-context wrote, with every finding they returned.
reviewed:
- src/__tests__/integration/ingestion/context-model-wiring.spec.ts
- src/__tests__/integration/ingestion/propose-routes.spec.ts
- src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
- src/__tests__/integration/query-retrieval/search-node-match.spec.ts
- src/__tests__/unit/env.spec.ts
- src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
- src/__tests__/unit/ingestion/default-prompt-version.spec.ts
- src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
- src/__tests__/unit/ingestion/entity-resolution.spec.ts
- src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
- src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
- src/__tests__/unit/ingestion/preliminary-reading.spec.ts
- src/__tests__/unit/ingestion/retried-run-world.ts
- src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
- src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
- src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
- src/__tests__/unit/ingestion/run-document-context-fixture.ts
- src/__tests__/unit/mcp-stdio-context-model.spec.ts
- src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
- src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
- src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
- src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
- src/app.ts
- src/config/env.ts
- src/mcp-stdio.ts
- src/modules/ingestion/dto/llm-run.dto.ts
- src/modules/ingestion/dto/preliminary-reading-response.dto.ts
- src/modules/ingestion/dto/propose-node.dto.ts
- src/modules/ingestion/mcp/ingest-document.handler.ts
- src/modules/ingestion/mcp/ingest-toolset.ts
- src/modules/ingestion/mcp/mcp-schemas.ts
- src/modules/ingestion/prompts/extraction.v5.ts
- src/modules/ingestion/prompts/index.ts
- src/modules/ingestion/prompts/preliminary-reading.ts
- src/modules/ingestion/repository/ingestion.repository.ts
- src/modules/ingestion/repository/llm-run.repository.ts
- src/modules/ingestion/routes/ingestion.routes.ts
- src/modules/ingestion/service/directed-ingestion.service.ts
- src/modules/ingestion/service/directed-run.ts
- src/modules/ingestion/service/entity-resolution.service.ts
- src/modules/ingestion/service/extraction.service.ts
- src/modules/ingestion/service/llm-run.service.ts
- src/modules/ingestion/service/preliminary-reading.ts
- src/modules/ingestion/service/propose-node.service.ts
- src/modules/ingestion/service/run-document-context.ts
- src/modules/query-retrieval/dto/response.dto.ts
- src/modules/query-retrieval/repository/scoring.ts
- src/modules/query-retrieval/repository/search.repository.ts
- src/modules/query-retrieval/service/search.service.ts
tasks:
- task/alias-admission/admit-aliases-from-source
- task/alias-admission/default-prompt-version-v5
- task/alias-admission/prompt-v5-asks-for-other-names
- task/approximate-node-search/approximate-node-match
- task/approximate-node-search/rank-approximate-reach-last
- task/approximate-node-search/search-item-shows-match
- task/document-context/chunk-prompt-shows-context
- task/document-context/context-model-setting
- task/document-context/failed-reading-continues
- task/document-context/preliminary-reading
- task/document-context/record-document-context
- task/document-context/retry-reuses-document-context
- task/document-context/run-answers-show-document-context
- task/document-context/skip-preliminary-reading
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/aliases-fuzzy-context passed; there was no failure to read
coverage:
- criterion: A node proposal named "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq", in a run whose source says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto", creates a node whose canonical alias is "Conselho Nacional de Desenvolvimento Científico".
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: creates the node with its canonical name and also holds the alias CNPq
- criterion: That created node also holds the alias "CNPq".
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: creates the node with its canonical name and also holds the alias CNPq
  why: 'The node holds "CNPq" only because "CNPq" is found to occur in the source. The test''s own stand-in makes that decision: answerAdmission compares dbNorm of the alias with dbNorm of the content. The admission query that proposeNodeService issues never makes it. If that query stopped admitting an alias the source writes, the test would still pass. The test does exercise one thing: the service records an alias that the store reports as admitted.'
- criterion: Outside a directed ingestion, a proposed alias whose normalized form does not occur in the normalized content of the raw information of the run is not recorded on the knowledge node.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: takes the proposal, answers its resolution, records no alias and names the alias as not admitted
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not add to the matched node an alias the source never writes
  why: 'The test stand-in (answerAdmission) decides whether the normalized alias occurs in the normalized content. The admission query the service issues does not decide it. Both tests would pass if that query admitted every alias. The tests do exercise one thing: the service records no alias, on a new node or on an existing one, when the store reports the alias as not admitted.'
- criterion: A node proposal carrying an alias that is not admitted is still resolved, and answers its node identity and resolution.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: takes the proposal, answers its resolution, records no alias and names the alias as not admitted
- criterion: A proposed alias that differs from the source text only in case, accents or inner whitespace is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: records the alias on the node when the source holds it with $label
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not name the alias as not admitted when the source holds it with $label
  why: The stand-in's own dbNorm does the comparison that ignores case, accents and inner whitespace. The admission query's norm() is never run. If the query compared un-normalized text, both tests would still pass.
- criterion: A proposed alias that occurs in a chunk other than the one being read is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: records the alias on the node when the source holds it with $label
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not name the alias as not admitted when the source holds it with $label
  why: 'No chunk is being read in these tests: proposeInRun hands the service no chunk, and the "a paragraph other than the first" variant is one raw content. The stand-in itself matches against the whole raw content. Nothing exercises whether the real query looks past the chunk being read.'
- criterion: Within a directed ingestion, a proposed alias that no fragment text holds is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: records an alias that the source never writes on the node
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not name an alias that the source never writes as not admitted
  why: The stand-in grants the directed bypass when the run's model and prompt version equal the parameters the service passes. So what is exercised is that the service passes those values, plus its handling of an admitted alias. The query's own directed rule never runs. No fragment is present in either test, so "no fragment text holds it" is never set against a fragment that exists.
- criterion: A node proposal resolved to an existing knowledge node adds each admitted alias to that node.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: adds the admitted alias to the matched node
  why: Only one admitted alias is proposed, so a service that added only the first admitted alias would pass. "Each", with more than one admitted alias, is unexercised.
- criterion: A node proposal resolved to an existing knowledge node does not add its proposed name to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not add the proposed name to the matched node
- criterion: The result of the node-proposal service names each alias it did not admit, with the reason ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: takes the proposal, answers its resolution, records no alias and names the alias as not admitted
  why: Only one alias goes unadmitted. namesNotAdmitted only checks that the alias string and the reason both appear somewhere in the serialized result. A result that named only the first of several unadmitted aliases would pass, and so would one that attached the reason to something other than that alias.
- criterion: After "CNPq" is admitted on a node, a later proposal of the same node type named "CNPq" resolves as matched_existing to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: resolves a later proposal named CNPq of the same node type to that node as matched_existing
- criterion: An ingest_document call that names no prompt version opens its LLM run under prompt version v5.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: opens the run under v5 when an ingest_document call names no prompt version
- criterion: The prompt registry maps the version v5 to a prompt module.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: holds exactly the prompt versions v1 to v5, each resolving to a module of its own version
  - file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: resolves exactly v1 to v5 and refuses a version outside them
  why: 'Both tests assert more than the criterion: they claim totality over the registry. "holds exactly the prompt versions v1 to v5" requires both the resolved list and the versions named in the refusal message to be exactly v1 to v5. "resolves exactly v1 to v5 and refuses a version outside them" requires v6 to be refused. Both hold today. Both break the day a later prompt version is delivered.'
- criterion: A run under prompt version v5 is extracted without failing as an unknown prompt version.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
    name: completes an extraction run whose prompt version is v5 instead of failing it as an unknown prompt version
- criterion: The v5 system prompt asks the model to propose, with each node, every other name the text gives the same entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
- criterion: The v5 system prompt names an acronym, a short name and another spelling as such other names.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  why: The patterns only check that the words "acronym", "short name" and a spelling variant appear somewhere in the v5 system prompt. A prompt that mentioned them in another role, such as telling the model not to use acronyms, would pass. Naming them "as such other names" is unexercised.
- criterion: The v5 system prompt tells the model that a pronoun alone is not another name of the entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
- criterion: The v5 system prompt tells the model that a role alone is not another name of the entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
- criterion: The v5 system prompt holds every instruction the v4 system prompt holds.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: keeps every instruction line of the v4 system prompt in the v5 system prompt
- criterion: The v5 system prompt names "hoje", "ontem" and "amanhã" as relative-date words.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: names hoje, ontem and amanhã as relative-date words in the v4 and v5 system prompts
- criterion: The v5 system prompt asks the model to resolve a relative date against the document date when the source has one.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks in the v4 and v5 system prompts to resolve a relative date against the document date and, without one, against the reception date
- criterion: The v5 system prompt asks the model to resolve a relative date against the reception date when the source has no document date.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks in the v4 and v5 system prompts to resolve a relative date against the document date and, without one, against the reception date
- criterion: The v4 system prompt does not ask the model for other names of an entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks for no other names of an entity in any v1 to v4 system prompt nor in the user prompt they share
  why: The test asserts more than the criterion. It also checks the v1 to v3 system prompts and the shared user prompt. It forbids any occurrence of the words alias, other name, acronym, short name, spelling or pronoun, in English or Portuguese, which is broader than asking for other names. A v4 prompt that mentioned a pronoun for any other reason would fail it.
- criterion: A search for "Petrobrass" returns the knowledge node "Petrobras" at hop 0.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers a knowledge node that only the approximate route reaches as a node item at hop 0
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: shows the match approximate and its similarity on the node item of the REST search answer
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: shows the match approximate and its similarity on the node item of the MCP search answer
  why: 'The stand-ins return the approximate row whatever the query text is. Nothing runs the word-similarity query that decides whether "Petrobrass" reaches "Petrobras". The tests exercise only this: a row the approximate route returns becomes a node item at hop 0.'
- criterion: A search for "contrato Petrobrass" returns the knowledge node "Petrobras".
  state: uncovered
  why: Nothing in the set searches "contrato Petrobrass". The service stand-ins return rows regardless of query text. The only repository test pins SQL text and never executes it.
- criterion: A search for "contrato Petrobras" returns the knowledge node "Petrobras" when no alias holds the word "contrato".
  state: uncovered
  why: Nothing in the set searches "contrato Petrobras", and no stand-in models alias content against the query, so the condition "no alias holds contrato" is never set up.
- criterion: A search for "CNPJ" does not return the knowledge node "CNPq" whose only alias is "CNPq".
  state: uncovered
  why: Nothing in the set searches "CNPJ" against a node aliased "CNPq". Nothing exercises the refusal half of approximate matching.
- criterion: An alias shorter than 5 characters once normalized never matches a knowledge node approximately.
  state: uncovered
  why: No test models alias length. Stand-ins hand back approximate rows whatever the alias is, and no search runs against an alias under 5 characters.
- criterion: A knowledge node whose aliases all have a word similarity below 0.6 to the query text is not matched approximately.
  state: uncovered
  why: 'No stand-in computes similarity: the rows come back already matched. No node below 0.6 is ever shown to be excluded.'
- criterion: The 0.6 threshold is one named constant.
  state: uncovered
  why: Nothing in the set reads the threshold's value, or where and how it is declared.
- criterion: A search for "PETROBRÁSS" scores the knowledge node "Petrobras" with the same similarity as a search for "petrobrass".
  state: uncovered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
    name: selects the similarity as the highest word similarity of the node's aliases to the normalized query, with no layer weight applied
  why: The repository test matches the similarity column of the SQL text against word_similarity over norm($1::text). That checks the shape of the SQL text, not behavior. It fails if the query is rewritten. It passes if the score or the filter compares the un-normalized query. No two searches, "PETROBRÁSS" and "petrobrass", are ever compared.
- criterion: The similarity of "Petrobras" for "contrato Petrobrass" equals its similarity for "Petrobrass".
  state: uncovered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
    name: selects the similarity as the highest word similarity of the node's aliases to the normalized query, with no layer weight applied
  why: The repository test only checks that the SQL text names word_similarity, which is a shape assertion. No similarity is computed or compared for the two queries.
- criterion: An approximately matched knowledge node scores the highest word similarity of its aliases to the query text, times 0.9.
  state: uncovered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
    name: selects the similarity as the highest word similarity of the node's aliases to the normalized query, with no layer weight applied
  why: Nothing asserts the 0.9 weight. The service stand-ins supply the score (0.72) directly. The repository test asserts only that the similarity column carries no weight, and it does so on the SQL text. The score's derivation is unexercised.
- criterion: A knowledge node matched both exactly and approximately appears once among the search items.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers a knowledge node matched both exactly and approximately once
  why: The stand-in removes the excluded node identifiers from the approximate rows itself. The test would pass if the approximate query stopped honouring the exclusion. What is exercised is that the service passes the exact hits' identifiers as excluded.
- criterion: The node layer keeps at most 200 candidates, counting both routes together.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: keeps at most 200 node candidates when the exact and approximate routes together hold more
- criterion: A search for "Petrobrass" returns no fragment-layer item for a fragment whose text holds only "Petrobras".
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers no %s-layer item for text that only a trigram match could reach
- criterion: A search for "Petrobrass" returns no chunk-layer item for a chunk whose text holds only "Petrobras".
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers no %s-layer item for text that only a trigram match could reach
- criterion: A knowledge link one hop from an approximately matched knowledge node is returned with 0.5 times that node's score.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: expands from it like any matched node, scoring a link at hop h at 0.5 raised to h times the score of the matched node it was reached from, whether that node was matched exactly or approximately
- criterion: An approximately matched knowledge node ranks after an exactly matched knowledge node whose score is lower.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: ranks an approximately matched knowledge node after an exactly matched one whose score is lower
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
- criterion: A knowledge link reached only through approximately matched knowledge nodes ranks after every item not reached only through them.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: ranks a knowledge link reached only through an approximately matched node after every item not reached only through approximate matches
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
- criterion: A knowledge link reached from both an exactly matched and an approximately matched knowledge node ranks among the items not reached only through approximate matches.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: ranks a knowledge link reached from both an exactly and an approximately matched node among the items not reached only through approximate matches
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
- criterion: Within each group, items order by score descending.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders by score descending %s
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
- criterion: Within each group, items of equal score order by recording time descending, with a knowledge node counting as never recorded.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items of equal score by recording time descending, a fragment counting as recorded at its creation time
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders a knowledge node, counting as never recorded, after a knowledge link and an information fragment of equal score
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
  why: Equal scores occur only among items not reached only through approximate matches. In the approximate-only group, no test has two items sharing a score (the whole-order world gives 0.9, 0.7, 0.45 and 0.35). Ordering by recording time inside that group is unexercised.
- criterion: Within each group, items of equal score and recording time order by identifier ascending.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items of equal score and equal recording time by identifier ascending
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
  why: Ties in both score and recording time are set up only among items not reached only through approximate matches. Ordering by identifier inside the approximate-only group is unexercised.
- criterion: An exactly matched hop-0 knowledge node item carries the match exact.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers the knowledge nodes Petrobras and Petrobrás Distribuidora for petrobras as two node items, each carrying the match exact
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: answers a node reached by the lexical parse of the query with the match exact and a node reached by the trigram similarity of an alias with the match approximate
- criterion: An approximately matched hop-0 knowledge node item carries the match approximate.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: answers a node reached by the lexical parse of the query with the match exact and a node reached by the trigram similarity of an alias with the match approximate
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: shows the match approximate and its similarity on the node item of the REST search answer
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: shows the match approximate and its similarity on the node item of the MCP search answer
- criterion: An approximately matched hop-0 knowledge node item carries its similarity.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: shows the match approximate and its similarity on the node item of the REST search answer
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: shows the match approximate and its similarity on the node item of the MCP search answer
- criterion: An exactly matched knowledge node item carries no similarity.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers a knowledge node matched both exactly and approximately with no similarity, though one of its aliases is similar enough for an approximate match
- criterion: A search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", each with an accepted information fragment mentioning it, returns both knowledge nodes.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers the knowledge nodes Petrobras and Petrobrás Distribuidora for petrobras as two node items, each carrying the match exact
  why: The stand-in hands both nodes to the service as exact hits whatever the query is, and invents provenance for any identifier. Nothing runs the full-text query that decides whether "petrobras" reaches "Petrobrás Distribuidora". No accepted fragment mentioning each node is modeled.
- criterion: In a search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", both returned knowledge node items carry the match exact.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers the knowledge nodes Petrobras and Petrobrás Distribuidora for petrobras as two node items, each carrying the match exact
  why: The match exact follows from the stand-in placing both nodes on the exact route. Nothing exercises whether the real exact route reaches "Petrobrás Distribuidora" for "petrobras" rather than leaving it to the approximate route.
- criterion: A knowledge node matched both exactly and approximately carries the match exact.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers a knowledge node matched both exactly and approximately with the match exact
  why: The stand-in itself drops the excluded identifiers from the approximate rows. If the approximate query stopped honouring the exclusion, the test would pass while the node also came back from the approximate route.
- criterion: The flags of an approximately matched knowledge node item hold no value describing its match.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers an approximately matched node with no flag describing its match
- criterion: A knowledge link item reached by expansion carries no match.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers every knowledge link reached by expansion, from an exactly or an approximately matched node, and every information fragment with no match and no similarity
- criterion: For a run holding a document context, each chunk's prompt shows the context's summary.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  why: The test asserts more than this task's criteria. It also requires the chunks to be read one at a time, in index order, with at most one model call in flight. No criterion here states that, and the test breaks if chunk reading is legitimately made concurrent.
- criterion: For a run holding a document context, each chunk's prompt shows each listed entity with its node type and names.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
- criterion: For a run holding a document context, each chunk's prompt shows the same source metadata the v4 prompt shows.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  why: 'The test checks four values by literal: source type, document date, title and reception time. It never renders the v4 prompt to compare. Any other source metadata the v4 prompt shows is unexercised.'
- criterion: For a run holding a document context, each chunk's prompt shows the last 200 characters of the chunk before it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
- criterion: Each chunk's prompt presents the document context marked apart from its instructions as data.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: presents the document content, each chunk's text and the document context shown with each chunk in the user turn, labelled as data and outside the instructions
- criterion: For a run holding no document context, each chunk's prompt shows no document context.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: shows no document context in any chunk prompt of a run that holds none, whether the prompt version predates v5, the raw information has one chunk or the preliminary reading failed
- criterion: With a context listing João Silva as also called "o Diretor", a proposal named "João Silva" made while reading chunk 3 resolves to the knowledge node created while reading chunk 1.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: resolves a proposal named João Silva made while reading chunk 3 to the knowledge node created while reading chunk 1 and anchors the chunk 3 fragment to chunk 3
- criterion: With a context listing João Silva as also called "o Diretor", the fragment proposed while reading chunk 3 is anchored to chunk 3.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: resolves a proposal named João Silva made while reading chunk 3 to the knowledge node created while reading chunk 1 and anchors the chunk 3 fragment to chunk 3
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: anchors the fragment proposed while reading a chunk to that chunk alone, whether the model names no chunk, a later chunk or two earlier chunks
- criterion: With no context model configured, the context model the environment yields is claude-haiku-4-5.
  state: covered
  tests:
  - file: src/__tests__/unit/env.spec.ts
    name: yields claude-haiku-4-5 as the context model when none is configured
- criterion: With a context model configured, the environment yields that model.
  state: covered
  tests:
  - file: src/__tests__/unit/env.spec.ts
    name: yields the configured context model when one is configured
- criterion: The REST run-extraction route hands the configured context model to the orchestrator.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
    name: hands the configured context model to the orchestrator from the REST run-extraction route
- criterion: The MCP ingest toolset hands the configured context model to the orchestrator.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
    name: hands the configured context model to the orchestrator from the MCP ingest toolset
- criterion: The stdio server hands the configured context model to the orchestrator.
  state: covered
  tests:
  - file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
    name: hands the configured context model to the orchestrator from the stdio server
- criterion: When the preliminary reading answers a provider error, every chunk of the raw information is read.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads every chunk of the raw information when the preliminary reading answers a provider error
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the 3 chunks, completes the run and records status failed with no document context when the preliminary reading of a 3-chunk v5 raw information answers a provider error
- criterion: When the preliminary reading answers a provider error, the run completes.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: completes the run when the preliminary reading answers a provider error
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the 3 chunks, completes the run and records status failed with no document context when the preliminary reading of a 3-chunk v5 raw information answers a provider error
- criterion: When the preliminary reading answers a provider error, the run records the document context status failed.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the preliminary reading answers a provider error
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the 3 chunks, completes the run and records status failed with no document context when the preliminary reading of a 3-chunk v5 raw information answers a provider error
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on a v5 run the status each chunk count, content length and reading outcome calls for, counting the length in UTF-16 code units
- criterion: When the preliminary reading answers a provider error, the run holds no document context.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: leaves the run holding no document context when the preliminary reading answers a provider error
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the 3 chunks, completes the run and records status failed with no document context when the preliminary reading of a 3-chunk v5 raw information answers a provider error
- criterion: Under v5, an extraction whose run holds no document context, over a raw information of 3 chunks and at most 100000 characters, makes exactly one preliminary reading.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes exactly one preliminary reading for a v5 extraction of 3 chunks holding no document context
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes the preliminary reading of a content of exactly 100000 UTF-16 code units
- criterion: The preliminary reading is made before the first chunk is read.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes the preliminary reading before the first chunk is read
- criterion: The preliminary reading is given the whole content of the raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: gives the preliminary reading the whole content of the raw information
- criterion: The preliminary reading calls the configured context model.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: calls the configured context model for the preliminary reading rather than the run's extraction model
- criterion: The recorded document context names the model that produced it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on the run a document context that names the model that produced it
- criterion: The run records the document context the preliminary reading yields.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on the run the summary and the entities the preliminary reading yielded
- criterion: The run records the document context status produced.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status produced when the preliminary reading yields a context
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on a v5 run the status each chunk count, content length and reading outcome calls for, counting the length in UTF-16 code units
- criterion: No recorded document context holds a summary of more than 5 lines.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the first 5 lines of a 7-line summary as the document context summary
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: counts an empty line as a line when it cuts a summary to 5 lines
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: lets a carriage return end no line when it cuts a summary to 5 lines
- criterion: A preliminary reading whose summary runs to 7 lines yields a recorded document context whose summary is the first 5 lines of that summary.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the first 5 lines of a 7-line summary as the document context summary
- criterion: A preliminary reading that lists an entity under a node type the catalog does not hold yields a recorded document context without that entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records a document context without an entity listed under a node type the catalog does not hold
- criterion: The preliminary reading records no tool call.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: proposes nothing and writes nothing but the run's own context columns before its first chunk is read
- criterion: Before the first chunk is read, the knowledge base holds no knowledge node, information fragment, knowledge link or node attribute read from the raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: proposes nothing and writes nothing but the run's own context columns before its first chunk is read
- criterion: The preliminary reading presents the content to the model marked apart from its instructions as data.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: presents the content to the model in the user turn, bracketed and labelled as data, and not among the instructions
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: presents the document content, each chunk's text and the document context shown with each chunk in the user turn, labelled as data and outside the instructions
- criterion: The model call of the preliminary reading waits at most five minutes.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes every model call of an extraction, the preliminary reading included, through a client bounded to five minutes and two retries
  why: The test asserts more than the criterion. It requires every model call of the extraction to be bounded, chunk calls included, and it fixes a three-chunk run at exactly four model calls. Neither is part of this criterion. The test breaks if the bounds of chunk calls or the number of chunk turns legitimately change.
- criterion: The model call of the preliminary reading is retried at most twice.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes every model call of an extraction, the preliminary reading included, through a client bounded to five minutes and two retries
  why: 'This is the same over-assertion as the previous criterion: the test bounds every model call of the extraction, not only the reading, and fixes the call count at four.'
- criterion: Under v4, an extraction makes no preliminary reading.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records no document context and no status under any prompt version before v5
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records no document context and no status under v1 to v4 whatever the chunk count and content length
- criterion: A run whose document context was recorded reads back with that context's summary.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back with the summary of that context
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back the document context with its summary, every entity and its model
- criterion: A run whose document context was recorded reads back with each listed entity's node type.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back with the node type of each listed entity
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back an entity with its one node type and all of its names in the recorded order
- criterion: A run whose document context was recorded reads back with each listed entity's names.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back with the names of each listed entity
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back an entity with its one node type and all of its names in the recorded order
- criterion: A run whose document context was recorded reads back with the model that produced the context.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back with the model that produced the context
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back the document context with its summary, every entity and its model
- criterion: A run whose document context status was recorded reads back with that status.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back with the status that was recorded
- criterion: A run with no recorded document context reads back holding none.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back holding no document context when none was recorded
- criterion: A run with no recorded document context status reads back holding none.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back holding no document context status when none was recorded
- criterion: Retrying a run that holds a document context leaves that context recorded.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: leaves the document context recorded when a failed run holding one is retried
- criterion: Retrying a run whose document context status is produced leaves that status recorded.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: leaves the document context status as it was when a failed run is retried, whichever status it held
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: leaves the document context status as it was after a retried run holding a document context is extracted again, whichever status it held
- criterion: When a retried run holding a document context is extracted again, no preliminary reading is made.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: makes no preliminary reading and shows each chunk the context the run held when a retried run holding a document context is extracted again
- criterion: When a retried run holding a document context is extracted again, each chunk is shown with the context the run already held.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: makes no preliminary reading and shows each chunk the context the run held when a retried run holding a document context is extracted again
- criterion: When a retried run whose document context status is failed is extracted again, a preliminary reading is made.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: makes a preliminary reading when a retried run whose document context status is failed is extracted again
- criterion: The read-llm-run answer over REST carries the document context status of a run that holds one.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
    name: carries the document context status of a run that holds one over REST
- criterion: The read-llm-run answer over REST carries the document context of a run that holds one.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
    name: carries the whole document context of a run that holds one over REST
  - file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
    name: carries each entity of the document context with its node type and every name in the recorded order over REST
- criterion: The read-llm-run answer over MCP carries the document context status of a run that holds one.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries the document context status of a run that holds one over MCP
- criterion: The read-llm-run answer over MCP carries the document context of a run that holds one.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries the whole document context of a run that holds one over MCP
- criterion: The run-extraction answer carries the document context status of the completed run when it holds one.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries the document context status of the completed run when it holds one
  why: The test reads the run that runLlmExtraction returns. The answer the run-extraction route actually sends (POST /api/v1/ingest/llm-runs/:id/run) is not exercised. A route response shape that dropped the status would leave the test passing.
- criterion: The run-extraction answer carries the document context of the completed run when it holds one.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries the whole document context of the completed run when it holds one
  why: The test reads the run that runLlmExtraction returns. The answer the run-extraction route actually sends is not exercised. A route response shape that dropped the document context would leave the test passing.
- criterion: A read of a run that holds no document context carries none.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
    name: carries no document context for a run that holds none over REST
  - file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries no document context for a run that holds none over MCP
- criterion: Under v5, an extraction over a raw information of 1 chunk makes no preliminary reading.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records the document context status single-chunk for a v5 raw information of 1 chunk
- criterion: Under v5, an extraction over a raw information of 1 chunk records the document context status single-chunk.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records the document context status single-chunk for a v5 raw information of 1 chunk
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on a v5 run the status each chunk count, content length and reading outcome calls for, counting the length in UTF-16 code units
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters makes no preliminary reading.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading of a v5 raw information of 3 chunks whose content is 100001 characters
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading of a content of 3 chunks past 100000 UTF-16 code units though within 100000 code points
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters records the document context status too-long.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on a v5 run the status each chunk count, content length and reading outcome calls for, counting the length in UTF-16 code units
- criterion: Under v5, an extraction whose content exceeds 100000 characters reads every chunk.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads every chunk of a v5 raw information whose content exceeds 100000 characters, whether it holds 3 chunks or 1
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the chunks of a v5 raw information past 100000 characters in index order
- criterion: Under v4, an extraction records no document context status.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records no document context and no status under any prompt version before v5
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records no document context and no status under v1 to v4 whatever the chunk count and content length
unpaired:
- test:
    file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
    name: carries no document context status for a run that holds none over REST
  asserts: For a v4 run holding neither a document context nor a status, the REST read of the run answers with document_context_status absent or null.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: InvalidOwnerTimezoneError carries the bad zone string
  asserts: With OWNER_TZ "Bogus/Zone", loadEnv throws an InvalidOwnerTimezoneError whose timezone field and message carry "Bogus/Zone".
- test:
    file: src/__tests__/unit/env.spec.ts
    name: accepts LOCAL_OPERATOR_TOKEN only with explicit NODE_ENV=development
  asserts: With NODE_ENV "development" and a 24-character LOCAL_OPERATOR_TOKEN, loadEnv yields that token.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: accepts an explicit valid IANA zone (Europe/Lisbon)
  asserts: With OWNER_TZ "Europe/Lisbon", loadEnv yields "Europe/Lisbon".
- test:
    file: src/__tests__/unit/env.spec.ts
    name: accepts an explicit valid IANA zone (UTC)
  asserts: With OWNER_TZ "UTC", loadEnv yields "UTC".
- test:
    file: src/__tests__/unit/env.spec.ts
    name: accepts an override for CHAT_MODEL and CHAT_PROMPT_VERSION
  asserts: With CHAT_MODEL and CHAT_PROMPT_VERSION set, loadEnv yields the configured values.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: accepts an override for CHAT_UTILITY_MODEL
  asserts: With CHAT_UTILITY_MODEL set, loadEnv yields the configured value.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: aggregates multiple missing fields in a single error
  asserts: With an empty environment, loadEnv throws one EnvValidationError whose issues name DATABASE_URL, NEON_AUTH_URL and ANTHROPIC_API_KEY.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: applies defaults when optional vars are omitted
  asserts: loadEnv yields NODE_ENV "test" and PORT 3000. Both values are the ones the fixture supplies explicitly, so no default is exercised.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: applies spec defaults when no chat env var is set
  asserts: With no chat variables set, loadEnv yields CHAT_ENABLED true, CHAT_MODEL claude-opus-4-8, CHAT_PROMPT_VERSION v4, MAX_HISTORY_MESSAGES 40, MAX_ITERATIONS 8, TURN_TIMEOUT_MS 90000, TOOL_TIMEOUT_MS 15000 and TOOL_RESULT_MAX_CHARS 8000.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: applies the v2 defaults (chat.back.md v2.0.0 §8)
  asserts: With none of these set, loadEnv yields CHAT_UTILITY_MODEL claude-haiku-4-5, CHAT_RECENT_WINDOW 6, CHAT_SUMMARY_AFTER_TURNS 20, CHAT_TITLE_ENABLED true, CHAT_SUMMARY_ENABLED true and MAX_CONTENT_LENGTH 32768.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces CHAT_ENABLED='false' to the boolean false (BR-14 kill-switch)
  asserts: CHAT_ENABLED "false" yields the boolean false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces CHAT_ENABLED='true' to the boolean true
  asserts: CHAT_ENABLED "true" yields the boolean true.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces CHAT_INGEST_ENABLED='false' to the boolean false
  asserts: CHAT_INGEST_ENABLED "false" yields the boolean false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces CHAT_INGEST_ENABLED='true' to the boolean true
  asserts: CHAT_INGEST_ENABLED "true" yields the boolean true.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces CHAT_SUMMARY_ENABLED='false' (BR-33 disable)
  asserts: CHAT_SUMMARY_ENABLED "false" yields the boolean false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces CHAT_TITLE_ENABLED='false' (BR-34 disable)
  asserts: CHAT_TITLE_ENABLED "false" yields the boolean false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces integer env strings for CHAT_RECENT_WINDOW / CHAT_SUMMARY_AFTER_TURNS / MAX_CONTENT_LENGTH
  asserts: The numeric strings for CHAT_RECENT_WINDOW, CHAT_SUMMARY_AFTER_TURNS and MAX_CONTENT_LENGTH yield the integers 20, 50 and 16384.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: coerces numeric env strings to integers
  asserts: The numeric strings for MAX_HISTORY_MESSAGES, MAX_ITERATIONS, TURN_TIMEOUT_MS, TOOL_TIMEOUT_MS and TOOL_RESULT_MAX_CHARS yield the corresponding integers.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: defaults CHAT_INGEST_ENABLED to false (BR-44)
  asserts: With CHAT_INGEST_ENABLED unset, loadEnv yields false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: defaults OWNER_TZ to 'America/Sao_Paulo' (BR-47 step 3)
  asserts: With OWNER_TZ unset, loadEnv yields "America/Sao_Paulo".
- test:
    file: src/__tests__/unit/env.spec.ts
    name: freezes the returned config object
  asserts: The object loadEnv returns is frozen.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: parses a valid environment
  asserts: A complete environment yields the supplied PORT, NODE_ENV, LOG_LEVEL, DATABASE_URL and NEON_AUTH_URL, plus NEON_AUTH_JWKS_TTL_S 600, PG_POOL_MIN 2, PG_POOL_MAX 10 and PG_STATEMENT_TIMEOUT_MS 10000.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: preserves legacy MAX_HISTORY_MESSAGES alongside the new MAX_CONTENT_LENGTH
  asserts: With neither set, loadEnv yields MAX_HISTORY_MESSAGES 40 and MAX_CONTENT_LENGTH 32768.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: produces a human-readable, multi-line message
  asserts: With an empty environment, the EnvValidationError message matches "Invalid backend environment configuration" and names DATABASE_URL and NEON_AUTH_URL.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: refuses to start when LOCAL_OPERATOR_TOKEN is set but NODE_ENV is absent (default-development is NOT trusted)
  asserts: With LOCAL_OPERATOR_TOKEN set and NODE_ENV absent, loadEnv throws EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: refuses to start when LOCAL_OPERATOR_TOKEN is set with NODE_ENV != development
  asserts: With LOCAL_OPERATOR_TOKEN set and NODE_ENV "production", loadEnv throws EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: rejects a LOCAL_OPERATOR_TOKEN shorter than 16 chars
  asserts: With NODE_ENV "development", a LOCAL_OPERATOR_TOKEN of 5 characters makes loadEnv throw EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: rejects an out-of-range PORT
  asserts: PORT "70000" makes loadEnv throw EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: rejects an unsupported LOG_LEVEL
  asserts: LOG_LEVEL "verbose" makes loadEnv throw EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: throws EnvValidationError when DATABASE_URL is missing
  asserts: Without DATABASE_URL, loadEnv throws EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: throws InvalidOwnerTimezoneError on an unknown IANA zone (fail-closed)
  asserts: OWNER_TZ "Invalid/Zone" makes loadEnv throw InvalidOwnerTimezoneError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: throws when ANTHROPIC_API_KEY is missing (TC-12 / BR-29)
  asserts: Without ANTHROPIC_API_KEY, loadEnv throws EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: throws when DATABASE_URL has an unsupported scheme
  asserts: A DATABASE_URL with the mysql:// scheme makes loadEnv throw EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: throws when NEON_AUTH_URL is missing
  asserts: Without NEON_AUTH_URL, loadEnv throws EnvValidationError.
- test:
    file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: opens the run under the version an ingest_document call names instead of the default
  asserts: An ingest_document call naming prompt version v3 hands v3 to the intake that opens the run.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: refuses a prompt version the system does not hold instead of falling back to another one
  asserts: Selecting prompt version v99 throws UnknownPromptVersionError.
- test:
    file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: accepts produced, single-chunk, too-long and failed and nothing else
  asserts: The document context status schema accepts exactly produced, single-chunk, too-long and failed. It rejects pending, the empty string, Produced, single_chunk, too_long and skipped.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the one chunk of a v5 raw information of 1 chunk
  asserts: A v5 extraction over 1 chunk of short content shows that chunk's text to the model.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the model call of the preliminary reading times out
  asserts: When the reading call throws APIConnectionTimeoutError, the run records document_context_status failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the preliminary reading answers text that is not a document context
  asserts: When the reading answers plain text that does not parse as a document context, the run records document_context_status failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows every chunk the source's type, document date, title and reception time on a v5 run that skipped its preliminary reading
  asserts: On v5 runs that skip the reading (1 chunk, or 3 chunks past 100000 code units), every model call carries the source type, document date, title and reception time.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows the second chunk of a v5 run past 100000 characters the last 200 Unicode code points of the first chunk when they are astral
  asserts: On a v5 run that skipped the reading because its content is too long, the second chunk's prompt contains the first chunk's last 200 astral code points and not the code point before them.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows the second chunk of a v5 run past 100000 characters the last 200 characters of the first chunk and no more
  asserts: On a v5 run that skipped the reading because its content is too long, the second chunk's prompt contains the first chunk's last 200 characters and not the character before them.
- test:
    file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: records the status produced when the preliminary reading made for a retried run whose status was failed yields a document context
  asserts: When a retried run whose status was failed is extracted again and the new reading yields a context, the run's document_context_status becomes produced.
- test:
    file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries no document context for a completed run that holds none
  asserts: The run runLlmExtraction returns for a v4 run holding nothing has document_context absent or null.
- test:
    file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries no document context status for a completed run that holds none
  asserts: The run runLlmExtraction returns for a v4 run holding nothing has document_context_status absent or null.
- test:
    file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries no document context status for a run that holds none over MCP
  asserts: For a v4 run holding nothing, the get_ingestion_status tool answers ok with document_context_status absent or null.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: reports a total that counts the 200 candidates kept, not the candidates both routes held
  asserts: With 150 exact and 100 approximate candidates, the search response total is 200.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: scores a knowledge node matched both exactly and approximately with its exact-match score
  asserts: A node returned by both routes is answered once, with the exact-route score (0.63) and not the approximate score (0.72). The approximate duplicate is removed by the stand-in's exclusion.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers a link whose confidence is in the uncertain band with the uncertain flag and no other
  asserts: An expanded link with status uncertain and confidence 0.6 carries the flags ["uncertain"] exactly.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment
  asserts: The items are exactly one fragment, one link and one node. Each carries kind, layer, score, hop, summary, flags and a provenance holding at least one entry.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers no item with an empty provenance
  asserts: A matched node with no supporting fragment is left out, so no item has an empty provenance.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: names, in every entry of a node, a link and a fragment item, only fragments that support that very item
  asserts: Every provenance entry of each node, link and fragment item names only a fragment the store lists as supporting that same item.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: numbers an expanded link by the links on its path from the matched node, so a link touching the matched node is hop 1 in either direction
  asserts: Expanded links are numbered hop 1 for both the incoming and the outgoing link at the matched node, then hop 2 and hop 3 along the path.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 1 from a matched node at 0.5 times the matched node's score
  asserts: From an exactly matched node scored 0.8, the hop-1 link scores 0.4.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 2 from a matched node, neither endpoint being matched, at 0.25 times the matched node's score
  asserts: From an exactly matched node scored 0.8, the hop-2 link scores 0.2.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 3 from a matched node, neither endpoint being matched, at 0.125 times the matched node's score
  asserts: From an exactly matched node scored 0.8, the hop-3 link scores 0.1.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link whose target is the matched node at 0.5 times its score at hop 1, and the link beyond it walked the same way at 0.25 times at hop 2
  asserts: Walking incoming links from a node scored 0.8 gives 0.4 at hop 1 and 0.2 at hop 2.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is
  asserts: With two exactly matched nodes scored 0.8 and 0.4, each link of each three-link chain scores 0.5 to the power of its hop times its own origin's score.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'scores the link after a change of walking direction at 0.25 times the matched node''s score at hop 2: %s'
  asserts: When the walk changes direction (outgoing then incoming, or incoming then outgoing), the links score 0.4 at hop 1 and 0.2 at hop 2.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: answers a node, a link and a fragment item with no attribute the search item does not declare
  asserts: No node, link or fragment item carries a key outside kind, layer, id, score, hop, summary, flags, provenance, match and similarity. This is a totality claim over the item's keys.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: ranks an approximately matched knowledge node after an information fragment and a knowledge link that were not reached only through approximate matches
  asserts: An approximately matched node scored 0.8 is ordered after a fragment scored 0.5 and after a link reached from an exactly matched node.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/aliases-fuzzy-context
reconciliation: siegard-reconcile/aliases-fuzzy-context.md
findings:
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Header comment, lines 3-17 ("Acceptance criteria addressed here"), repeated in the per-test comments at lines 504-505, 532-534, 600-601, 667-669 and 739-740.
  evidence: '"POST /llm-runs/:id/propose-node returns 409 BUSINESS_RUN_NOT_RUNNING when run exists but is completed" and "POST /llm-runs/:id/propose-link returns 404 RESOURCE_NOT_FOUND when llmRunId is unknown"'
  cost: The contract's refusal answers (status and error code per refusal) are written a second time as prose in the test. If a refusal answer changes in the node, this prose keeps saying the old one and nothing reads it, so a later reader can take it for the decided answer.
  correction: Remove the comments. The contract holds the answers, and the test's own assertions (expect(res.statusCode).toBe(409), expect(body.error.code).toBe("BUSINESS_RUN_NOT_RUNNING"), and so on) hold them in code.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Comment "Note on the envelope semantics", lines 24-28, and the in-test comment at lines 865-866.
  evidence: '"any `ValidationFailure` raised by the propose-* service surfaces as HTTP 200 with `{ ok: false, error: ... }`. ZodErrors at the route boundary continue to surface as HTTP 422 via the global error handler"'
  cost: 'The contract''s split between refusals answered as HTTP 200 carrying { ok: false, error } and refusals answered as HTTP 422 is restated as prose naming internal types (ValidationFailure, ZodError). Where the node and the prose drift, the prose becomes a second authority that no check reaches.'
  correction: Remove the comments. The contract holds this split, and the assertions at lines 556 and 867 (expect(res.statusCode).toBe(200)) and line 757 (toBe(422)) hold it in code.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Comment in the second propose-fragment test, lines 536-541 ("Interpretation note (SD-2 in delivery)").
  evidence: '"the original criterion referenced "text > 1000 chars" as the trigger; Zod''s max(1000) intercepts that before the service runs"'
  cost: The 1000-character fragment text limit is written in a test comment as well as in the rule. If the limit moves in the node, this comment still says 1000.
  correction: Remove the comment. The limit is held by rules/knowledge-base/fragment-text-length, and the candidate index binds that rule to src/modules/ingestion/mcp/mcp-schemas.ts and src/modules/ingestion/service/directed-ingestion.service.ts.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Assertions in the "returns HTTP 409 BUSINESS_RUN_NOT_RUNNING" test, lines 623-624.
  evidence: expect(body.error.details.current_status).toBe("completed"); expect(body.error.details.llm_run_id).toBe(RUN_COMPLETED_ID);
  cost: The contract says only that BUSINESS_RUN_NOT_RUNNING "name[s] the run's status". The detail keys current_status and llm_run_id, and the fact that the run's identity is also carried, exist only in this test and in the code it exercises. A client or reader that goes to the specification for the refusal's shape will not find them.
  correction: The analysis that owns the ingestion contract would state the detail keys of the BUSINESS_RUN_NOT_RUNNING refusal (the run's status and the run's identity) in the propose-fragment, propose-node, propose-link and propose-attribute answers.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Comment above the allowed_values assertion, line 879.
  evidence: // allowed_values is lexicographically sorted per TC-02/TC-03 contract.
  cost: The ordering of allowed_values is stated in prose, citing a task-contract number, when the node states it as "in sorted order". If the node's ordering changes, this comment goes on claiming lexicographic order.
  correction: Remove the comment. The contract holds the ordering, and the assertion toEqual(["Apollo", "Gemini", "Mercury"]) holds it in code.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: the "parses a valid environment" test, lines 28-31 (expectations on the JWKS cache lifetime, the connection pool bounds and the statement timeout)
  evidence: "expect(env.NEON_AUTH_JWKS_TTL_S).toBe(600);\n    expect(env.PG_POOL_MIN).toBe(2);\n    expect(env.PG_POOL_MAX).toBe(10);\n    expect(env.PG_STATEMENT_TIMEOUT_MS).toBe(10_000);"
  cost: The values 600 seconds, a pool of 2 to 10 and a 10 000 ms statement timeout are asserted as the defaults, but a search of the specification (projections/full-text.md and the constraints and rules directories) found no node that holds them. The only nearby node, constraints/unreachable-store-answers-unavailable, says what a timed-out statement answers and gives no number. The test is now the only place besides the env loader where these defaults are written down. A later reader who looks in the specification for the statement timeout or the pool size will not find them.
  correction: An analysis would have to decide whether these operational defaults are domain facts and, if they are, give them a node. Otherwise they are configuration the test should not pin as business values.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: the "applies the v2 defaults (chat.back.md v2.0.0 §8)" test, line 211
  evidence: expect(env.CHAT_SUMMARY_AFTER_TURNS).toBe(20);
  cost: 'The test fixes 20 as the number of turns after which a conversation is summarised. The chat nodes hold the neighbouring defaults: the recent window of 6, the overlap of 40, the enabled flag for summaries, and the chat model. None of them holds the 20, and rules/chat/rolling-summary-overlap states the overlap of 40 and no turn threshold. The business rule for when a summary is refolded therefore lives only in the code and in this assertion, where a reader of the specification will not look.'
  correction: The rule that decides when a live turn refolds the rolling summary would need a node stating the turn threshold and its default of 20 where none is configured.
- pass: conformance
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  where: function normOf, lines 188-195, used by findExactNode and insertAlias to stand in for the database's alias comparison
  evidence: "function normOf(text: string): string {\n  return text\n    .normalize(\"NFD\")\n    .replace(/\\p{M}/gu, \"\")\n    .replace(/\\s+/g, \" \")\n    .trim()\n    .toLowerCase();\n}"
  cost: The normalization of a name (lower-casing, removing accents, trimming, collapsing inner whitespace) is implemented here a second time, in a file the node is not bound to. This copy decides whether the mock store finds an alias in the 4th test. If the node's rule moves, the test keeps its own definition and still passes, and nothing says which of the two was decided.
  correction: The test would have to compare names without its own copy of the rule, for example by using the identical strings it already feeds the mock. Failing that, the bind of this file to the node is what claims the stand-in.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: the "TC-10 — thresholds (BR-25)" test, line 181-184
  evidence: "it(\"exports MATCH_STRONG = 0.85 and MATCH_FLOOR = 0.55\", () => {\n    expect(MATCH_STRONG).toBe(0.85);"
  cost: The 0.85 strong-candidate value is written as a literal expectation in a test that no node is bound to. strong-candidate-resolves holds it and is bound only to entity-resolution.service.ts. When the node moves, `--check` never reaches this file. The test then fails on a literal nobody owns, and the next reader cannot tell whether the test or the specification holds the decision.
  correction: Bind this file to rules/knowledge-base/strong-candidate-resolves so a change to the node reaches it. The literal cannot read the node.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: the same "TC-10 — thresholds (BR-25)" test, line 181-184, and the candidate sims used throughout (0.9, 0.6, 0.4, 0.3)
  evidence: expect(MATCH_FLOOR).toBe(0.55);
  cost: The 0.55 floor, below which a proposal creates an active node and at or above which it needs review, is restated here as an authority. no-candidate-creates-active-node holds it (and ambiguous-candidates-need-review reuses it) and is bound to entity-resolution.service.ts only. The test's candidate similarities (0.6, 0.4) are chosen around the same value, so a change to the node would be tracked by neither the bind nor `--check`.
  correction: Bind this file to rules/knowledge-base/no-candidate-creates-active-node and rules/knowledge-base/ambiguous-candidates-need-review.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: the header comment, lines 12-16
  evidence: '//   - entity_match_review row count = candidates with sim >= MATCH_FLOOR

    //   - aliases attempted via INSERT ... ON CONFLICT DO NOTHING

    //   - thresholds (MATCH_STRONG = 0.85, MATCH_FLOOR = 0.55) live in the

    //     entity-resolution module only.'
  cost: A comment restates the strong and floor thresholds, and it says the review row count equals every candidate at or above the floor. ambiguous-candidates-need-review limits the review to "the ten such nodes most similar", so the prose is a second home that is narrower than the node. The thresholds are also held in code (the service, and the literals in this test), so removing the comment loses no behavior.
  correction: Remove the comment. The route is the comment route, then a reconcile over this file.
- pass: conformance
  file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  where: the test "v4.system extends v3.system verbatim with the received_at-anchor directive" (line 82) and the test "v4 keeps the load-bearing content of v1, v2 and v3" (line 89)
  evidence: 'expect(systemV4(s)).toBe(`${systemV3(s)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`);

    expect(s).toContain("## Inviolable rules");

    expect(s).toContain("### NodeType");

    expect(s).toContain("## Events — always date the occurrence");

    expect(s).toContain("## Events — classify the type and resolve relative dates");'
  cost: The test fixes the v4 extraction system prompt as the whole v3 prompt, a newline and one directive, and pins four v1 to v3 section headings as content v4 must keep. No node states either. The v4-to-v3 relationship exists only in this test. The nearby nodes only scope individual v4 instructions (the relative-date words and the reception fallback) to "v4 and later", and v5-keeps-v4 covers v5 over v4. A reader looking in the specification for what v4 carries from earlier versions finds nothing. A change to v3 that the node set never sees would fail this test with no node to say which side was decided.
  correction: An analysis would have to give the fact a node, in the shape of rules/knowledge-base/extraction-prompt-v5-keeps-v4. That node would say what the v4 extraction system prompt keeps from the v3 one, and whether that includes the headings the test pins.
- pass: conformance
  file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  where: lines 501-519, the test "presents the content to the model in the user turn, bracketed and labelled as data, and not among the instructions", the closedAfter entry
  evidence: 'closedAfter: text.slice(at + DEFAULT_CONTENT.length).trim().length > 0, and, expected, closedAfter: true,'
  cost: The test requires non-empty text after the content, a closing marker as well as an opening one. The node only says the content is presented "marked apart from its instructions as data". A prompt that marks the data only at its start conforms to the node and fails this test. The bracketing rule then lives in the test, and a reader checking the specification will not find it.
  correction: The node would have to state that the content is closed by a marker after it as well as marked before it, or the assertion would have to drop to what the node holds, which is the content marked as data and kept out of the instructions.
- pass: conformance
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  where: the DECLARED_ITEM_KEYS constant and the test "answers a node, a link and a fragment item with no attribute the search item does not declare" (lines 500-511 and 513-544)
  evidence: "const DECLARED_ITEM_KEYS = [\n  \"kind\",\n  \"layer\",\n  \"id\",\n  \"score\",\n  \"hop\",\n  \"summary\",\n  \"flags\",\n  \"provenance\",\n  \"match\",\n  \"similarity\",\n];"
  cost: The test states what a search item declares and includes `id`, an attribute the node does not list. The node declares kind, layer, score, hop, summary, flags, match and similarity, plus the provenance association. A search item's identifier is nonetheless relied on by rules/knowledge-base/search-ranking ("then by identifier ascending"). A reader who looks for the item's identity in the specification finds only the ranking rule's passing mention. The test becomes the one place that says the item carries an `id`.
  correction: The analysis would give the search item's identifier an attribute on domain/knowledge-base/search-item. Alternatively it would record that the item deliberately has no `id` attribute of its own, so that this list matches the node.
- pass: conformance
  file: src/app.ts
  where: line 55, BODY_LIMIT_BYTES, passed as `bodyLimit` to Fastify at line 59
  evidence: 'const BODY_LIMIT_BYTES = 11 * 1024 * 1024; ... bodyLimit: BODY_LIMIT_BYTES,'
  cost: The 11 MiB ceiling is enforced here for every route, and the same figure is set again in src/modules/ingestion/routes/ingestion.routes.ts (`const POST_INGEST_BODY_LIMIT = 11 * 1024 * 1024;`). The node is bound to the routes file and not to this one, so if the node's figure moves, `--check` never reaches the declaration that applies it to the whole server. The two figures can then disagree and nobody knows which one was decided.
  correction: The bind that claims the node has to claim this file as well as the routes file. The code cannot read the specification to close this itself.
- pass: conformance
  file: src/app.ts
  where: lines 64-67, the fallback list of allowed origins used when CORS_ORIGINS is unset
  evidence: "const corsOrigins = env.CORS_ORIGINS ?? [\n    \"http://localhost:5173\",\n    \"http://127.0.0.1:5173\",\n  ];"
  cost: Which origins are allowed when nothing is configured is a decision made only in this array. The constraint says that an allowed origin is echoed and any other gets none, but no node says which origins are allowed by default. A reader looking in the specification for who may call the system cross-origin finds nothing, and the two values live only here.
  correction: Analysis would have to give the default allowed origins a home in the constraint, or in a new node it names, so the list is stated once.
- pass: conformance
  file: src/app.ts
  where: line 70, the `methods` option of the CORS registration
  evidence: 'methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],'
  cost: The set of methods a preflight answer permits is a rule the code applies and no node states. A method added to or dropped from this list changes what a cross-origin client may do, and the specification would not show that change.
  correction: Analysis would have to state the permitted cross-origin methods in a node, such as the preflight constraint, before the code can be said to hold them.
- pass: conformance
  file: src/app.ts
  where: lines 82-85, the `/_self` route registered in the authenticated scope under /api/v1
  evidence: "scoped.get(\"/_self\", async (request) => ({\n      ok: true,\n      result: { user_id: request.user?.id ?? null },\n    }));"
  cost: This is a published operation that answers the caller's identity as `user_id`, or null, and it appears in no contract. The access contract names only authenticate-owner, route-request and read-health. A client may rely on the shape, and the next reader looks for it in the specification and does not find it.
  correction: Analysis would have to give the operation a place in the access contract, or retire it.
- pass: conformance
  file: src/config/env.ts
  where: line 13, the default of CORS_ORIGINS
  evidence: .default("http://localhost:5173,http://127.0.0.1:5173")
  cost: The set of origins the system answers as allowed is decided here and no node states it. The constraint on allowed origins speaks of "an allowed origin" without saying which origins are allowed. A reader checking which origins are admitted looks in the specification and finds no value.
  correction: The node that governs allowed origins, or a new rule beside it, would have to state which origins are allowed where none is configured. Candidate constraints/answers-carry-allowed-origin states only the behavior toward an allowed origin, not the default set.
- pass: conformance
  file: src/config/env.ts
  where: line 30, the default of PG_STATEMENT_TIMEOUT_MS
  evidence: 'PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(0).default(10_000),'
  cost: The point at which a statement counts as timed out, and so answers "a backing service is unavailable", is decided here as 10 000 ms. The constraint on unreachable stores names the timeout outcome but gives no duration. An owner or reader cannot learn from the specification when that answer appears.
  correction: A node would have to hold the statement time limit and its default. Candidate constraints/unreachable-store-answers-unavailable holds the outcome only.
- pass: conformance
  file: src/config/env.ts
  where: line 39, NEON_AUTH_JWKS_TTL_S with its floor and default
  evidence: 'NEON_AUTH_JWKS_TTL_S: z.coerce.number().int().min(60).default(600),'
  cost: How long a fetched key set is trusted, with a floor of 60 and a default of 600 seconds, affects which tokens are accepted or refused. No node holds either value, so the code becomes the only place the decision can be read.
  correction: The access contract, or a rule beside it, would have to state the key-set freshness window and its bounds.
- pass: conformance
  file: src/config/env.ts
  where: line 50, the default of INGEST_MODEL
  evidence: 'INGEST_MODEL: z.string().min(1).default("claude-sonnet-4-6"),'
  cost: The node holds this default but is bound to another file, so a change to the node does not reach this file in `--check`. If the two disagree, nobody can tell which was decided.
  correction: The value agrees with the node. What closes the finding is a bind of rules/knowledge-base/default-extraction-model to this file. Code cannot read the specification.
- pass: conformance
  file: src/config/env.ts
  where: lines 54-57, the default of CHAT_ENABLED
  evidence: "CHAT_ENABLED: z\n    .union([z.boolean(), z.enum([\"true\", \"false\"])])\n    .transform((v) => (typeof v === \"boolean\" ? v : v === \"true\"))\n    .default(true),"
  cost: The rule holding that the chat is enabled by default is not bound to the file that declares the default. A change to the node does not reach this file in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/chat-enabled-by-default to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 58, the default of CHAT_MODEL
  evidence: 'CHAT_MODEL: z.string().min(1).default("claude-opus-4-8"),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/turn-model-default to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 59, the default of CHAT_UTILITY_MODEL
  evidence: 'CHAT_UTILITY_MODEL: z.string().min(1).default("claude-haiku-4-5"),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/utility-model-default to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 60, the default of CHAT_PROMPT_VERSION
  evidence: 'CHAT_PROMPT_VERSION: z.string().min(1).default("v4"),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/default-chat-prompt-version to this file.
- pass: conformance
  file: src/config/env.ts
  where: lines 61-64, the default of CHAT_INGEST_ENABLED
  evidence: "CHAT_INGEST_ENABLED: z\n    .union([z.boolean(), z.enum([\"true\", \"false\"])])\n    .transform((v) => (typeof v === \"boolean\" ? v : v === \"true\"))\n    .default(false),"
  cost: The node holds that directed ingestion through the chat is disabled by default but is not bound to this file. A change to the node does not reach the default here in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/directed-ingestion-disabled-by-default to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 65, the default and floor of MAX_HISTORY_MESSAGES
  evidence: 'MAX_HISTORY_MESSAGES: z.coerce.number().int().min(1).default(40),'
  cost: A message-count cap of 40, with a floor of 1, is declared here. No node holds it. The recent window (6) and the overlap (40) are held by other nodes, and this one is neither. The next reader cannot tell which of the three the code applies, or whether this is a decided business limit.
  correction: A node under rules/chat would have to hold what this limit bounds and its default. If the setting is not a business fact, that is the analysis's to say.
- pass: conformance
  file: src/config/env.ts
  where: line 66, the default of MAX_CONTENT_LENGTH
  evidence: 'MAX_CONTENT_LENGTH: z.coerce.number().int().min(1).default(32_768),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/message-content-length to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 67, the default of MAX_ITERATIONS
  evidence: 'MAX_ITERATIONS: z.coerce.number().int().min(1).default(8),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/turn-model-call-limit to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 68, the default of TURN_TIMEOUT_MS
  evidence: 'TURN_TIMEOUT_MS: z.coerce.number().int().min(1).default(90_000),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/turn-time-limit to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 69, the default of TOOL_TIMEOUT_MS
  evidence: 'TOOL_TIMEOUT_MS: z.coerce.number().int().min(1).default(15_000),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/tool-failure-continues-turn to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 70, the default of TOOL_RESULT_MAX_CHARS
  evidence: 'TOOL_RESULT_MAX_CHARS: z.coerce.number().int().min(1).default(8000),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/tool-result-truncated to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 71, the default of CHAT_RECENT_WINDOW
  evidence: 'CHAT_RECENT_WINDOW: z.coerce.number().int().min(1).default(6),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/model-context-window to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 72, the default of CHAT_SUMMARY_AFTER_TURNS
  evidence: 'CHAT_SUMMARY_AFTER_TURNS: z.coerce.number().int().min(1).default(20),'
  cost: A turn count of 20 after which summarising applies is declared here. The refresh rule in the specification triggers on messages older than the recent window and names no turn count. The code may apply a threshold the business never decided, and nothing else states it.
  correction: A node, likely beside rules/chat/rolling-summary-refresh, would have to hold the turn threshold and its default, or the analysis would have to say it is not a business fact.
- pass: conformance
  file: src/config/env.ts
  where: line 74, the default of CHAT_SUMMARY_PROMPT_VERSION
  evidence: 'CHAT_SUMMARY_PROMPT_VERSION: z.string().min(1).default("v2"),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/default-summary-prompt-version to this file.
- pass: conformance
  file: src/config/env.ts
  where: lines 75-82, the defaults of CHAT_TITLE_ENABLED and CHAT_SUMMARY_ENABLED
  evidence: "CHAT_TITLE_ENABLED: z\n    .union([z.boolean(), z.enum([\"true\", \"false\"])])\n    .transform((v) => (typeof v === \"boolean\" ? v : v === \"true\"))\n    .default(true),\n  CHAT_SUMMARY_ENABLED: z\n    .union([z.boolean(), z.enum([\"true\", \"false\"])])\n    .transform((v) => (typeof v === \"boolean\" ? v : v === \"true\"))\n    .default(true),"
  cost: The node holds both defaults but is not bound to this file, so a change to the node does not reach them in `--check`.
  correction: The values agree with the node. What closes the finding is a bind of rules/chat/distillation-enabled-by-default to this file.
- pass: conformance
  file: src/config/env.ts
  where: line 83, the default of OWNER_TZ
  evidence: 'OWNER_TZ: z.string().min(1).default("America/Sao_Paulo"),'
  cost: The node holds this default but is not bound to this file, so a change to the node does not reach it in `--check`.
  correction: The value agrees with the node. What closes the finding is a bind of rules/chat/owner-time-zone-default to this file.
- pass: conformance
  file: src/mcp-stdio.ts
  where: the REDACT_PATHS constant (lines 27-43) and the `redact` option of buildStderrLogger (lines 53-57)
  evidence: "const REDACT_PATHS: readonly string[] = [\n  \"content\",\n  \"text\",\n  \"value\",\n  \"*.content\",\n  ...\n  \"req.headers.authorization\",\n  \"*.req.headers.authorization\",\n  \"headers.authorization\",\n];\n...\nredact: {\n  paths: [...REDACT_PATHS],\n  censor: \"[REDACTED]\",\n  remove: false,\n},"
  cost: The redaction rule is implemented a second time. src/config/logger.ts declares an identical REDACT_PATHS list and the same "[REDACTED]" censor, and the node's own statement does not read either copy. If the node changes, for example a new field is redacted, only the file the node is bound to moves. The stdio process then keeps logging that field in clear text to stderr, and nothing signals the divergence. The two copies agree today.
  correction: Build the stdio logger from the one declaration the node is bound to, src/config/logger.ts, so that a single construct holds the redaction paths. Code never reads the specification, so what closes this is one code home and the node's bind reaching it. This file keeps no list of its own.
- pass: conformance
  file: src/mcp-stdio.ts
  where: the buildConfiguredMcpServer call (lines 154-158) and the logger `base` (lines 48-51)
  evidence: "const server = buildConfiguredMcpServer({\n  serverName: \"remember-bff-stdio\",\n  serverVersion: \"0.1.0\",\n  tools,\n});\n...\nbase: {\n  env: env.NODE_ENV,\n  service: \"remember-bff-stdio\",\n},"
  cost: The identity the stdio process advertises to an MCP client, "remember-bff-stdio" at version "0.1.0", and the `service` field it stamps on every log line are values only this file holds. No node names them. The same pattern recurs in the other transports, each with its own name and the same "0.1.0". The next reader looks for these identities in the specification and does not find them. The only node that names a service, the health report's "remember-bff", is a different value.
  correction: An analysis would have to decide whether the transport identity and version of each MCP surface is a fact of the business, and if so give it a node. Otherwise it is configuration and needs no node.
- pass: conformance
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: LlmRunResponseSchema, the attempts field (line 74)
  evidence: 'attempts: z.number().int().positive(),'
  cost: The response schema refuses any run whose attempts is below 1, so the code decides that a run's attempts starts at one and never holds zero. The node domain/knowledge-base/llm-run types attempts only as a required integer, and rules/knowledge-base/retry-counts-attempts only adds one per retry. No node states the starting value or the lower bound. A reader looking for what attempts may hold finds nothing in the specification, and a stored run with a different count would fail this read.
  correction: The analysis that owns domain/knowledge-base/llm-run would have to state the starting value of attempts, or that it is at least 1. Alternatively the schema drops the positivity bound.
- pass: conformance
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: 'the registration of the get_ingestion_status tool, line 248 to 263 (mcp.registerTool("ingest", { name: "get_ingestion_status", ...))'
  evidence: "mcp.registerTool(\"ingest\", {\n    name: \"get_ingestion_status\",\n    description: IngestToolDescriptions.get_ingestion_status,"
  cost: The name a caller uses to read an LLM run over MCP is stated only here and in the schema and description files. The contract's operation is named read-llm-run. The other ingest tools carry names a node spells (propose_fragment and the other three propose_* in domain/knowledge-base/ingest-tool, health in contracts/knowledge-base/access, and ingest_document and ingest_directed in the refusal messages of contracts/knowledge-base/ingestion). get_ingestion_status is not spelled anywhere in the specification, so a reader who looks there for the run-read tool's name does not find it, and a rename in code would pass without any node disagreeing.
  correction: Contracts/knowledge-base/ingestion would have to state that the run read over MCP is offered as the tool get_ingestion_status. That is for the analysis route to decide. It is not a change to this file.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: StartAsyncIngestionMcpInputSchema, lines 48-79, and its content description at line 53-55
  evidence: export const StartAsyncIngestionMcpInputSchema = z.object({ ... .describe("The full plain text of the document to ingest. Paste the raw content; the server chunks it, runs structured extraction in the BACKGROUND, and persists the knowledge graph with provenance. No base64/binary.")
  cost: The file declares the input shape, and the text a tool listing would show, for a tool that starts an ingestion and runs extraction in the background. The candidate constraint says the ingest toolset offers no such tool, and no operation of the ingestion contract names one. A reader looking in the specification would find the opposite of what this schema describes. Whether the toolset registers the schema is outside this file set and was not checked.
  correction: Whoever owns the file should decide, through the specification, whether the schema has a place. If the constraint stands, the declaration and its description are not held by any node.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDocumentMcpInputSchema, the model and prompt_version fields, lines 101-114
  evidence: 'model: z.string().min(1).optional() ... prompt_version: z.string().min(1).optional()'
  cost: An empty model or an empty prompt version is refused at the schema as a validation failure. The ingestion contract lists only content length and source type as validation refusals for ingest-document, and says nothing about a model or prompt version stated empty. The refusal lives only here, so the next reader looks for it in the contract and does not find it.
  correction: The contract's ingest-document refusals would have to name an empty model or prompt version, or the schema would have to stop refusing it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: GetIngestionStatusOutputSchema, the attempts field, line 159
  evidence: 'attempts: z.number().int().positive(),'
  cost: The LLM run node holds attempts as a required integer, and the retry rule only adds one to it. The floor of at least 1 is stated by this schema alone, so a stored run with 0 attempts would fail the output parse here while no node says that 0 is impossible.
  correction: The llm-run node, or a rule on it, would have to hold the lower bound of attempts, or the schema would have to drop it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: GetIngestionStatusOutputSchema, the idempotency_key field, line 161
  evidence: 'idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),'
  cost: The idempotency-key rule holds this fact, as 64 lowercase hexadecimal characters of a SHA-256 digest. It is bound to another file, not this one. The pattern is implemented a second time here, so a change to the node's format would not reach this file through its bind and the two would disagree without anyone knowing which was decided.
  correction: The pattern should be read from the one declaration the node is bound to, or this file should be bound to the node. Code cannot read the specification, so the bind is what closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedNodeItemSchema, the node_id description, lines 225-231
  evidence: Rejected (VALIDATION_INVALID_FORMAT) if the id does not point to an active node.
  cost: The ingestion contract answers a pinned identity that names no knowledge node with error code RESOURCE_NOT_FOUND (reason not_found). It uses VALIDATION_INVALID_FORMAT only for a node that exists and is not active (reason inactive). This text, which the system emits to callers, gives one code for both cases, so a caller is told VALIDATION_INVALID_FORMAT for a missing node and receives RESOURCE_NOT_FOUND.
  correction: 'The description should say what the contract says: RESOURCE_NOT_FOUND when no node is held at the identity, and VALIDATION_INVALID_FORMAT when the node is not active.'
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedAttributeItemSchema.valid_from, line 262-264, and IngestDirectedLinkItemSchema.valid_from, line 286-288
  evidence: Optional ISO date when this attribute became valid. Required when the catalog AttributeKey requires it. / Optional ISO date when this link became valid. Required when the catalog LinkType requires it.
  cost: The rule says a proposal that requires a validity start and states none takes the date its source was received, with basis received, when the source has no document date. A directed ingestion records its own raw information with no document date. The text emitted to callers says the start is required of them, which differs from the rule, so a caller may supply dates the system would have filled in itself. The text is also inconsistent with itself, saying Optional and then Required.
  correction: The two descriptions should state what the rule holds, or stop stating a requirement the node does not place on the caller.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedMcpInputSchema.source_label description, lines 324-326
  evidence: Carried into the run's `metadata.source_label` for audit; not parsed by the server.
  cost: The rule records the label in the raw information's metadata. The LLM run node holds no metadata attribute. The text emitted to callers names the run as the place the label lands, so someone looking for the label on the run, following this text, would not find it where the node puts it.
  correction: The description should name the raw information's metadata, as directed-source-metadata states.
- pass: conformance
  file: src/modules/ingestion/prompts/preliminary-reading.ts
  where: line 5, the exported constant MAX_TOKENS
  evidence: export const MAX_TOKENS = 4000 as const;
  cost: The preliminary reading's output ceiling is a value that decides when the model's answer is cut, and the only place it is stated is this constant. The nearest node, extraction-turn-token-ceiling, says an extraction asks for at most 8000 tokens on each turn. Its decision log says it covers every model call of the four extraction prompt versions. So a reader who looks in the specification for the preliminary reading's ceiling finds 8000 and not 4000. The code has become the home of that decision.
  correction: The analysis would have to give the preliminary reading's output ceiling a node. Either rules/knowledge-base/extraction-turn-token-ceiling is widened to say whether it covers the preliminary reading, or a sibling rule states 4000 for the reading.
- pass: conformance
  file: src/modules/ingestion/prompts/preliminary-reading.ts
  where: line 30, the "summary" instruction in the Output section of INSTRUCTIONS
  evidence: '"- summary: what the document is about, in the language of the document, in",'
  cost: This fixes the language of the document context's summary, which the owner sees in the run's document context and which the model reads while extracting. No node holds it. domain/knowledge-base/document-context says only "a short summary", and document-context-summary-lines holds only the 5-line cap. A reader looking for what language the summary is written in finds nothing in the specification.
  correction: The analysis would have to state the summary's language in domain/knowledge-base/document-context, or in a rule constraining it.
- pass: conformance
  file: src/modules/ingestion/prompts/preliminary-reading.ts
  where: lines 32-36, the "entities" instruction in the Output section of INSTRUCTIONS
  evidence: '"- entities: each entity the document speaks of, listed once, with EVERY name" ... "document denote the same entity. `node_type` is ONLY a NodeType name of the catalog below. A pronoun alone or a role alone is not a name."'
  cost: 'This states two rules about what the document context lists: an entity appears once, and a pronoun or a role alone is never one of its names. domain/knowledge-base/document-entity holds only "the names the document uses for it". The pronoun and role exclusion is held for the extraction proper by rules/knowledge-base/extraction-asks-for-other-names, but not for the preliminary reading. The scenario scenarios/knowledge-base/context-links-later-mention has a context listing João Silva as a person the document also calls "o Diretor", a role, which this instruction tells the model not to list. Which of the two the business decided is not recoverable from the specification.'
  correction: The analysis would have to state, in domain/knowledge-base/document-entity or a rule constraining it, whether an entity is listed once and whether a pronoun or a role alone may be one of its names. That would also settle the tension with the context-links-later-mention scenario.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 4-8 and 25-28 of step 2 (line 325 onward), also the docstring of synthesiseContent
  evidence: '// `RawInformation` (stamped with a nonce so the `content_hash` is unique per

    // call — no `noop_existing` branch on this path)

    // Content is the concatenation of fragments[].text (one per line, prefixed

    // with `[ref]`) + a trailing line carrying timestamp + nonce.'
  cost: The order of the directed raw content (fragments, then label, then moment and nonce) has a second home in prose. When the node changes, the comment keeps saying the old order, and nothing flags it because the prose is not bound to the node.
  correction: Remove the comments. The behavior is held by synthesiseContent, lines 829-836 of this file.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 5-8 and 22-23
  evidence: '// `RawInformation` (stamped with a nonce so the `content_hash` is unique per

    // call — no `noop_existing` branch on this path), opens an `LLMRun` carrying

    //   - No chunk loop, no model dispatch — items are pre-structured.'
  cost: The model name and prompt version of the directed run, and the fact that no language model is called, are restated in prose. The sentence at lines 7-8 is also left unfinished ("opens an `LLMRun` carrying" then "dispatches"), so the prose does not even state the fact whole.
  correction: 'Remove the comments. The code opens the run through the ingestRaw call passing `model: DIRECTED_MODEL` and `prompt_version: DIRECTED_PROMPT_VERSION` (values declared in directed-run.ts), and calls no model.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 9-10; comments at "Step 3" (line 442) and 3a to 3d
  evidence: // the items in dependency order (fragments → nodes → attributes → links)
  cost: The dispatch order has a second home in prose that nothing reads. If the node's order changes, the comment goes stale unnoticed.
  correction: Remove the comments. The loops 3a, 3b, 3c and 3d, in that sequence, hold the order, and `report.push` in each makes the report follow it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 20-23, and the comment at Step 4 (line 748)
  evidence: '//     intake (BR-34 step 2). Failure to open the run is the only `failed`

    //     terminal outcome; otherwise the run always lands `completed`.

    // ---- Step 4 — close the run (always ''completed'' on this path) ----'
  cost: The rule that the run completes whatever the item statuses is restated in prose beside the code that holds it.
  correction: 'Remove the comments. closeRunCompletedSafe closes with `outcome: "completed"`, and the response carries `status: "completed"`.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment line 24, and the comment of loop 3a (line 456)
  evidence: '//   - Forces `confidence = 1.0` and defaults `valid_from_basis = ''stated''`

    // 3a. Fragments — confidence forced to 1.0, anchored to the first chunk.'
  cost: The full-confidence value is restated in prose. A change to the node leaves the comment holding the old value.
  correction: 'Remove the comments. `confidence: 1.0` appears in the fragment, attribute and link inputs.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment lines 24-25, and the comment of loop 3c (lines 584-586)
  evidence: '//   - Forces `confidence = 1.0` and defaults `valid_from_basis = ''stated''`

    //     when the caller omits it (BR-34 step 4).

    //     either is missing. `confidence = 1.0`; `valid_from_basis` defaults to

    //     `''stated''` when omitted by caller (BR-34 Defaults matrix).'
  cost: The default basis is restated in prose twice. The comment cites "BR-34 Defaults matrix", a document no node names, so a reader is sent to a source that is not the specification.
  correction: 'Remove the comments. `valid_from_basis: item.valid_from_basis ?? "stated"` and `change_hint: item.change_hint ?? "none"` hold the defaults, for attributes and for links.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: header comment, lines 26-29; comment of loop 3c; docstring of checkCascade (line 883)
  evidence: "//   - Cascade rule: when a ref dependency is missing (the referenced\n//     fragment/node was rejected at its own step), the dependent item is\n//     skipped with a synthetic `dependency_failed` report entry — no\n/**\n * Cascade check for an attribute item — returns the FIRST missing dependency\n * ref encountered, or `null` if every ref resolves.\n */"
  cost: The dependency-failed rule and its order of checking are restated in prose, so the order can be read from either place and a change reaches only one.
  correction: 'Remove the comments. checkCascade and checkLinkCascade hold the order, node then evidence for an attribute and source, target, evidence for a link, and the loops report `status: "dependency_failed"`.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: line 90, docstring of IsoDateSchema
  evidence: /** ISO date `YYYY-MM-DD`. */
  cost: The shape of the validity start is restated in prose beside the regex that enforces it.
  correction: Remove the docstring. The regex `/^\d{4}-\d{2}-\d{2}$/` holds the shape.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: line 104, `node_type`; line 129, `key`; line 140, `link_type` in the item schemas
  evidence: 'node_type: z.string().min(1),

    key: z.string().min(1),

    link_type: z.string().min(1),'
  cost: The refusal of an empty node type, attribute key or link type lives only in this schema. A reader looking in the specification finds length rules for the reference, name, text, label and value but none for these three, and takes them to be unbounded.
  correction: The analysis that gives these three minimum lengths a node, or the removal of the minimum, closes it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: line 106, `node_id` in DirectedNodeItemSchema
  evidence: 'node_id: z.string().uuid().optional(),'
  cost: The refusal of a pinned identity that is not a well-formed UUID lives only in this schema. The node states what happens to a pin naming no node or an inactive one, and says nothing of one that is not written as an identity.
  correction: The analysis that gives the shape of a pinned identity a node closes it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: docstrings of DirectedAttributeValueSchema (lines 110-119) and of canonicaliseAttributeValue (lines 921-925)
  evidence: '* canonicalises to the string form `propose_attribute` expects:

    *   - boolean → `"true"` / `"false"`

    *   - number  → JSON `String(n)` (`5`, `-1.5`)'
  cost: The text form of a number and a boolean is restated in prose beside the function that produces it.
  correction: Remove the docstrings. canonicaliseAttributeValue holds it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 133 and 143 (`valid_to` in the attribute and link schemas), and lines 620 and 700 (forwarded in the proposal inputs)
  evidence: 'valid_to: IsoDateSchema.optional(),

    ...(item.valid_to !== undefined ? { valid_to: item.valid_to } : {}),'
  cost: The service accepts, shapes and forwards a validity end for a directed attribute or link. The node states only the validity start, and its decision log says the directed tool strips any other field, so a validity end never arrives. The code carries a rule the specification decided not to state, and a reader of the specification would not know the service takes one.
  correction: Removing `valid_to` from the two schemas and the two forwardings would bring the code to what the node and its log hold. Stating the validity end in a node would also close it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: docstrings of DirectedItemStatus (line 170) and of classifyEnvelopeFailureStatus (line 945)
  evidence: '* Closed status set for the report. Mirrors the eight `validation_outcome`

    * buckets of BR-12 plus the directed-only `dependency_failed` synthetic

    *   - System-level failures (`SYSTEM_*` — e.g. `SYSTEM_INTERNAL_ERROR`,

    *     `SYSTEM_SERVICE_UNAVAILABLE`) collapse to `''error''` (SDK / catch-all'
  cost: The rule that a system refusal is reported error and any other refusal rejected is restated in prose, together with a mirror claim ("the eight `validation_outcome` buckets of BR-12") that no node states.
  correction: 'Remove the docstrings. The type DirectedItemStatus and the function classifyEnvelopeFailureStatus (`startsWith("SYSTEM_") ? "error" : "rejected"`) hold the fact.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: docstring of `sourceExcerpt` (lines 265-272) and the comment in the ingestRaw call (lines 353-356)
  evidence: '* Verbatim user turn that triggered this directed run (TC-01 / BR-34).

    * `invocation_context.source_excerpt` here; REST / MCP direct callers omit it. Forwarded as

    * `original_input` to `ingestRawInformation`'
  cost: The rule that a chat turn's excerpt is recorded as the original input is restated in prose, cited to "TC-01 / BR-34", which are not nodes.
  correction: 'Remove the comments. `original_input: deps.sourceExcerpt ?? null` holds it.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: docstring of `metadataPointer` (lines 273-285)
  evidence: '* Non-PII pointer back to the chat row that triggered this directed run

    * (TC-02 / BR-34). When the chat-agent dispatch invoked the tool the route

    * supplies `{ conversation_id, message_id }` so the orchestrator can merge'
  cost: The rule that the two chat identities are recorded together or not at all is restated in prose.
  correction: Remove the docstring. The type of `metadataPointer` (both fields required in one object) and the single `if (deps.metadataPointer !== undefined)` hold it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: comment before the metadata pointer merge (lines 336-338)
  evidence: '// TC-02 / BR-34 — chat-row pointer (non-PII; the verbatim text lives in

    // `original_input`, not here). Merged in only when the chat dispatch

    // supplied it; REST / MCP-direct calls emit metadata without these keys.'
  cost: What the raw information's metadata records is restated in prose beside the code that builds it.
  correction: 'Remove the comment. `intakeMetadata` (`directed: true`, `source_label`, `conversation_id`, `message_id`) holds the fact.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: comment of the chunk guard (lines 417-419)
  evidence: '// We need at least one chunk id to anchor every dispatched fragment to.

    // `chunkV1` always emits at least one chunk for non-empty content (BR-03),'
  cost: The anchoring of every fragment to the first chunk is restated in prose, cited to "BR-03".
  correction: 'Remove the comment. `const anchorChunkId = chunks[0]!.id;` and `chunk_ids: [anchorChunkId]` hold it.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: comment of loop 3b (lines 496-501) and docstring of verifyNodePin (lines 839-842)
  evidence: '// 3b. Nodes — `node_id` pin bypasses BR-25 fuzzy resolution; otherwise

    // Verify a caller-supplied `node_id` pin: the node row must exist AND its

    * `status` must be `''active''`.'
  cost: The pinned-node rule is restated in prose, with a reference to "BR-25 fuzzy resolution", which is not a node.
  correction: Remove the comments. The `if (item.node_id !== undefined)` branch and verifyNodePin (`row.status !== "active"`) hold the fact.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: comment on the pin-failure branch (lines 519-523)
  evidence: '// P2.1 pin-failure discriminator (ingestion.back.md v1.6.0 BR-34 note):

    //   - `reason: ''not_found''`  -> RESOURCE_NOT_FOUND (row absent)

    //   - `reason: ''inactive''`   -> VALIDATION_INVALID_FORMAT (row present'
  cost: The error code of each pin refusal is restated in prose and cited to a back-end document, so the contract that names them is not the one a reader is sent to.
  correction: 'Remove the comment. `pinCode` (`=== "not_found" ? "RESOURCE_NOT_FOUND" : "VALIDATION_INVALID_FORMAT"`) holds the codes.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: synthesiseContent, lines 829-835
  evidence: '(f) => `[${f.ref}] ${f.text}`

    lines.push(`-- source_label=${payload.source_label}`);

    lines.push(`-- directed_at=${at.toISOString()} nonce=${nonce}`);'
  cost: The node fixes the order of the content (reference and text, label, moment, nonce) but not its written form. The brackets, the "-- source_label=" and "-- directed_at=" markers, the ISO form of the moment and the "nonce=" key are held only here, and they are what is stored as the raw content and later searched. A reader of the specification cannot tell what the stored content looks like.
  correction: The analysis that states the written form of the directed content in a node closes it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: refForAttribute, lines 914-916
  evidence: "function refForAttribute(item: DirectedAttributeItem): string {\n  return `${item.node_ref}.${item.key}`;\n}"
  cost: The contract and the rule state the reference of a link's report entry, joined by "->", but no node states an attribute's. The form node reference, dot, key is held only here, so a reader of the report has no specification to read it from.
  correction: The analysis that states an attribute entry's reference form in a node closes it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe, lines 1035-1039 and 1056-1060
  evidence: "const fallback = {\n  started_at: new Date(0).toISOString(),\n  finished_at: new Date(0).toISOString(),\n  attempts: 1,\n};"
  cost: When the closed run cannot be read, or its finish time is null, the answer carries 1970-01-01T00:00:00.000Z as the start and finish times and 1 as the attempts. The contract states that the run is reported completed and that affected nodes are an empty list where unreadable, and nothing about these values. A caller reads a run that began and ended in 1970 as a fact.
  correction: The analysis that decides what a completed run reports when its row cannot be read, whether a placeholder moment or none, closes it.
- pass: conformance
  file: src/modules/ingestion/service/directed-run.ts
  where: lines 1 and 3, the two exported constants DIRECTED_MODEL and DIRECTED_PROMPT_VERSION
  evidence: 'export const DIRECTED_MODEL = "directed" as const;

    export const DIRECTED_PROMPT_VERSION = "directed-v1" as const;'
  cost: The node rules/knowledge-base/directed-ingestion-run states "A directed ingestion opens an LLM run of model directed and prompt version directed-v1". The candidate index binds that node only to src/modules/ingestion/service/directed-ingestion.service.ts, not to this file. This file is where both values are declared. If the node moves, `--check` does not reach this file, and nothing tells a reader that these two strings are the node's decision and not the code's.
  correction: The values already agree with the node. What is missing is the bind. The trace would have to bind rules/knowledge-base/directed-ingestion-run to this file, the file that declares the two values. Code never reads the specification, so no change to the source closes this.
- pass: conformance
  file: src/modules/ingestion/service/llm-run.service.ts
  where: retryLlmRun(), the branch taken when retryLlmRunRow returns null (lines 154-161)
  evidence: "const refreshed = await findLlmRunById(client, llmRunId);\n    const currentStatus = refreshed?.status ?? \"running\";\n    if (currentStatus === \"failed\") {\n      throw new RunNotRetryableError(llmRunId, \"running\");\n    }"
  cost: When the run is read again and is still failed, the refusal BUSINESS_RUN_NOT_RETRYABLE says the run is in status 'running'. A caller reading the refusal is told a status the run does not have. The rewrite from 'failed' to 'running' exists only in this branch, so the next reader looks for the status the refusal names in the specification and finds a different one.
  correction: The refusal would have to name the status the run actually holds, as the contract states ("naming the run's status"), or the node would have to state why a failed run that cannot be retried is reported as running.
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: interface SearchItem, line 44 (the `id` field)
  evidence: 'export interface SearchItem { readonly kind: SearchKind; readonly layer: SearchLayer; readonly id: string; readonly score: number;'
  cost: A search item's identity is a shape the code declares and the search-item node never lists among its attributes (kind, layer, score, hop, summary, flags, match, similarity). The next reader of search-item will not find that every item carries the identity of the node, link or fragment it stands for, and will find it only here.
  correction: The search-item node should hold the identity the item carries, or the analysis should decide it is not part of the item's shape.
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: interface SearchResponse, lines 55, 57 and 58 (the `query`, `limit` and `offset` fields)
  evidence: 'export interface SearchResponse { readonly query: string; readonly total: number; readonly limit: number; readonly offset: number; readonly items: readonly SearchItem[]; }'
  cost: The retrieval contract's search answer is "the page of ranked search items ... and the total before pagination". It does not say the answer echoes the query text or carries the page's limit and offset (the contract does say so for list-nodes and list-tool-calls). The code states what a search answer carries, and the next reader looks in the contract and finds neither the echoed query nor the window.
  correction: The accepted answer of the search operation in the retrieval contract should name what it carries beyond the items and the total, or the analysis should decide the answer carries only those.
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: interface ProvenanceFragment, line 84 (the `status` field)
  evidence: 'readonly status: "accepted" | "proposed" | "rejected" | "deleted";'
  cost: 'The fragment-status enumeration, which types the information fragment''s status, holds five values: proposed, accepted, rejected, superseded and deleted. The code declares four and omits superseded. A provenance read that reaches a superseded fragment has no declared status to carry it, and the narrower set is stated only in this file.'
  correction: The declared status values should agree with the fragment-status enumeration, or the specification should state why a provenance fragment never carries superseded.
- pass: conformance
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: the score expressions of searchFragmentLayer (line 43), searchNodeAliasLayer (line 76) and searchChunkLayer (line 161)
  evidence: '(ts_rank_cd(f.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score

    (max(ts_rank_cd(to_tsvector($1::regconfig, na.alias), websearch_to_tsquery($1::regconfig, $2))) * $3::float)::float AS score

    (ts_rank_cd(rc.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score'
  cost: The measure of a match's strength on the fragment, chunk and exact node layers is PostgreSQL's cover-density rank. For the exact node layer it is the highest such rank over the matching aliases. No node says so. The weights node says a strength is weighted, and the approximate-match nodes define the strength of an approximate match. The base measure for every other match lives only in these three queries. The next reader looks in the specification for what a match's strength is and finds no answer. A change to the measure would not reach any node.
  correction: Give the strength of an exact node-layer, fragment-layer and chunk-layer match a statement, in rules/knowledge-base/layer-weights or in a sibling rule, through an analysis of the node set.
- pass: conformance
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: the ORDER BY and LIMIT of searchFragmentLayer (lines 47-48), searchNodeAliasLayer (lines 83-84), APPROXIMATE_NODE_ALIAS_SQL (lines 119-120) and searchChunkLayer (lines 165-166)
  evidence: 'ORDER BY score DESC, f.created_at DESC, f.id ASC

    ORDER BY score DESC, kn.canonical_name ASC, kn.id ASC

    ORDER BY score DESC, rc.id ASC'
  cost: The cap node says a search keeps at most 200 candidates per layer, but not which candidates survive when a layer holds more. This file decides it. Fragments tie-break by creation time descending then identity. Nodes tie-break by canonical name ascending then identity. Chunks tie-break by identity. The node-layer tie-break by canonical name matches neither the final ranking nor any node. The set of surviving candidates, and so the total, depends on a rule only the SQL states.
  correction: State in a node which candidates a layer keeps under the cap, and how ties between equal scores are broken, through an analysis of the node set.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: resolveLayers, lines 466-471, the branch taken when the layer list is absent or empty
  evidence: "if (layers === undefined || layers.length === 0) {\n    return new Set(ALLOWED_LAYERS);\n  }"
  cost: The code treats an empty layer list the same as an omitted one and searches every layer. The defaults node speaks only of an option the query omits, and no node says what an empty list means. The next reader will look for that in the specification and will not find it. The decision lives only in this branch.
  correction: A node should state whether a search query that names an empty layer list reads every layer, or is refused. search-option-defaults or search-layer-outside-set-refused are the nodes the statement would sit with.
- pass: standard
  file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  where: vi.mock of extraction.service.js and ingestion.service.js (lines 17-37)
  evidence: 'return { ...actual, runLlmExtraction: mocks.runLlmExtraction };

    [...]

    return { ...actual, ingestRawInformation: mocks.ingestRawInformation };'
  cost: Both stand-ins replace service functions that hold business logic (the extraction orchestrator and the raw-information intake), not a boundary. The assertion only reads the arguments the route and the toolset hand to the replaced orchestrator. It cannot show that the real orchestrator uses the context model it is given.
  cites: TST-03
  correction: Keep the real services and stand in only for the store (pg) and the model client, which is what the neighbouring unit specs already do through anthropicFactory and a fake pool.
- pass: standard
  file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  where: orchestratorDeps and buildConfiguredApp (lines 86 and 91)
  evidence: "ingestionCatalog: {} as unknown as CatalogSnapshot,\n[...]\nreturn mocks.runLlmExtraction.mock.calls[0]?.[4] as\n  | RunExtractionDeps\n  | undefined;"
  cost: An empty object is declared to be a catalog, and an untyped mock argument is declared to be RunExtractionDeps. Nothing narrows either claim, so a change to either shape leaves the test compiling and asserting on the wrong thing.
  cites: TYP-02
  correction: Build the catalog with buildSnapshot as the sibling specs do, and read the captured argument through a guard or a typed spy.
- pass: standard
  file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  where: file path
  evidence: import { buildApp } from "../../../app.js";
  cost: The spec exercises app.ts wiring but its path ("integration/ingestion/context-model-wiring") does not mirror the path of the unit it covers. A reader looking for the tests of app.ts finds none under that name.
  cites: TST-04
  correction: Place the file at the mirrored path of the unit under test, under src/__tests__/integration.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: envFixture (lines 381-395)
  evidence: "const envFixture: Env = Object.freeze({\n  NODE_ENV: \"test\",\n[...]\n  ANTHROPIC_API_KEY: \"test-anthropic-key\",\n}) as Env;"
  cost: Env requires INGEST_MODEL, CONTEXT_MODEL and the CHAT_* fields, none of which the literal carries. buildApp reads env.CONTEXT_MODEL and env.INGEST_MODEL, so the code under test receives undefined typed as string. The compiler cannot report it because the assertion silences it.
  cites: TYP-02
  correction: Obtain the fixture from loadEnv with a complete source map, as env.spec.ts and context-model-wiring.spec.ts do.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: buildFakeClient (lines 140-322)
  evidence: 'function buildFakeClient(store: FakeStore): import("pg").PoolClient {'
  cost: One function of about 180 lines pattern-matches roughly 25 SQL shapes in sequence. Adding a query to a propose-* service means finding the right slot in the chain, and a missed slot only shows up as the "unknown SQL" throw at run time.
  cites: MNT-01
  correction: Split the fake into named responders per statement family, as the unit specs under query-retrieval do with respondToGraph and respondToProvenance.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: envFixture (lines 17-27)
  evidence: "const envFixture: Env = Object.freeze({\n[...]\n  NEON_AUTH_JWKS_TTL_S: 600,\n}) as Env;"
  cost: The literal lacks ANTHROPIC_API_KEY, CONTEXT_MODEL and INGEST_MODEL, all of which Env requires, and the assertion hides that. Any route that later reads one of them gets undefined, and this spec stays green.
  cites: TYP-02
  correction: Build the fixture with loadEnv from a complete source map.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: buildAuthFixture and signValidJwt (lines 31-55)
  evidence: "async function buildAuthFixture(): Promise<AuthFixture> {\n  const { privateKey, publicKey } = await generateKeyPair(\"RS256\", {\n    extractable: true,\n  });"
  cost: The key-pair and JWT signing helpers are copied verbatim from propose-routes.spec.ts and search-node-match.spec.ts. A change to how the auth middleware is faked has to be made in every copy.
  cites: MNT-03
  correction: Move the helpers to one shared test fixture and import it.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: getRunAnswer (lines 77-83)
  evidence: 'expect(res.statusCode).toBe(200);

    return res.json() as Record<string, unknown>;'
  cost: An assertion sits inside the helper that performs the request. Each test reads as arrange, act, assert, but one of the claims is made where the test body does not show it. A failure of the status check is reported against a helper line, not against the behaviour named in the test.
  cites: TST-01
  correction: Return the response and assert the status in the test body.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: file path
  evidence: 'url: `/api/v1/ingest/llm-runs/${RUN_ID}`,'
  cost: The file covers the llm-runs GET route but is named for a behaviour, and it imports its fixture from the unit tree. Its path does not mirror the path of the routes unit it exercises.
  cites: TST-04
  correction: Place the file at the mirrored path of the unit under test.
- pass: standard
  file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
  where: envFixture (lines 105-115)
  evidence: "const envFixture: Env = Object.freeze({\n[...]\n  NEON_AUTH_JWKS_TTL_S: 600,\n}) as Env;"
  cost: The same incomplete Env asserted as complete. The required ANTHROPIC_API_KEY, INGEST_MODEL and CONTEXT_MODEL are absent and the compiler is told not to look.
  cites: TYP-02
  correction: Build the fixture with loadEnv from a complete source map.
- pass: standard
  file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
  where: buildAuthFixture and signValidJwt (lines 119-141)
  evidence: "async function signValidJwt(privateKey: CryptoKey): Promise<string> {\n  return new SignJWT({ sub: \"user-123\" })"
  cost: A third copy of the auth fixture (also in propose-routes.spec.ts and run-answers-document-context-routes.spec.ts), so one change to the faked auth has to be made three times.
  cites: MNT-03
  correction: Share one fixture.
- pass: standard
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  where: file path
  evidence: "import {\n  runLlmExtraction,"
  cost: The spec covers the extraction orchestrator in extraction.service.ts, but nothing in its path names that unit. The path does not mirror the unit's path, so the tests of that service are spread across files found only by their behaviour names.
  cites: TST-04
  correction: Place the file at the mirrored path of the unit under test.
- pass: standard
  file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  where: runHandlerAndReadOpenedRunBody (lines 55-75)
  evidence: "ingestRaw: ingestRaw as unknown as IngestDocumentDeps[\"ingestRaw\"],\nrunExtraction:\n  runExtraction as unknown as IngestDocumentDeps[\"runExtraction\"],"
  cost: The two stand-ins replace the intake service and the extraction orchestrator. These are business logic, not a boundary. The test proves only what the handler passes to a replaced function, so it still passes if the real intake ignores the prompt version it receives.
  cites: TST-03
  correction: Stand in for the store and the model client, and read the opened run's prompt_version from the fake store.
- pass: standard
  file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  where: file path
  evidence: "import {\n  selectPromptModule,\n  UnknownPromptVersionError,\n} from \"../../../modules/ingestion/prompts/index.js\";"
  cost: The file covers the ingest_document handler and the prompts registry, and its name matches neither unit. Its path does not mirror the path of either.
  cites: TST-04
  correction: Split by unit or place each part at the mirrored path of its unit.
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  where: answerAdmission (lines 119-144)
  evidence: "const directed =\n  run !== undefined &&\n  contentNorm !== null &&\n  run.model === stringAt(params, 1) &&\n  run.prompt_version === stringAt(params, 2);\n[...]\nadmitted: directed || occurs,"
  cost: The admission rule (an alias is admitted when the run is directed or the source contains it) is implemented in production by ALIAS_ADMISSION_SQL. The stand-in reimplements that rule in TypeScript, so the specs assert the stand-in's rule. They keep passing if the real SQL condition is deleted or inverted.
  cites: TST-03
  correction: Let the stand-in return rows the store would return for each case and put the rule's decision in the database layer under test, or cover the SQL with an integration test.
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  where: dbNorm (lines 97-104)
  evidence: "function dbNorm(text: string): string {\n  return text\n    .normalize(\"NFD\")\n    .replace(/\\p{M}/gu, \"\")"
  cost: A second TypeScript copy of the norm() policy, beside normOf in chunk-prompt-document-context.spec.ts. The two differ in the order of trim and whitespace collapse. If the policy changes, each copy has to be edited and the specs can disagree about what "normalized" means.
  cites: MNT-03
  correction: One shared test helper for norm().
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: buildClient (lines 85-178)
  evidence: 'function buildClient(cfg: StubConfig, state: StubState) {'
  cost: A 93-line function with seven chained SQL matchers and the bookkeeping for each. A new statement in the resolution pipeline needs a new branch in the middle of it.
  cites: MNT-01
  correction: Extract one named responder per statement kind.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
  where: file path
  evidence: "import {\n  runLlmExtraction,\n  type AnthropicLike,"
  cost: The spec covers extraction.service.ts, and nothing in the path names that unit, so it does not mirror the unit's path.
  cites: TST-04
  correction: Place the file at the mirrored path of the unit under test.
- pass: standard
  file: src/__tests__/unit/ingestion/retried-run-world.ts
  where: endTurn (lines 150-169)
  evidence: "usage: {\n  input_tokens: 1,\n  output_tokens: 1,\n  cache_creation_input_tokens: 0,\n  cache_read_input_tokens: 0,"
  cost: The same model-message builder (and the same usage block) is written out again as END_TURN_MESSAGE in extraction-orchestrator-prompt-v5.spec.ts and run-answers-document-context-extraction.spec.ts, as messageOf in preliminary-reading.spec.ts, and as USAGE in chunk-prompt-document-context.spec.ts. A change to the SDK message shape needs five edits.
  cites: MNT-03
  correction: Share one message builder among the extraction specs.
- pass: standard
  file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  where: file path
  evidence: import { retryLlmRun } from "../../../modules/ingestion/service/llm-run.service.js";
  cost: The spec covers retryLlmRun and runLlmExtraction together. Its path mirrors neither unit.
  cites: TST-04
  correction: Place the file at the mirrored path of the unit under test.
- pass: standard
  file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
  where: file path
  evidence: "import {\n  runLlmExtraction,\n  type AnthropicLike,"
  cost: The spec covers extraction.service.ts and is named for a behaviour. Its path does not mirror the path of the unit.
  cites: TST-04
  correction: Place the file at the mirrored path of the unit under test.
- pass: standard
  file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  where: readStatusAnswer (lines 49-51)
  evidence: 'const envelope = (await tool.handler({ llm_run_id: RUN_ID })) as Envelope;'
  cost: The tool's untyped return is asserted to be the local Envelope shape with no narrowing. If the handler's envelope changes, the test reads a field that is not there and fails far from the cause.
  cites: TYP-02
  correction: Parse the return with a schema or narrow it with a guard before reading result.
- pass: standard
  file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  where: readStatusAnswer (line 50)
  evidence: expect(envelope.ok).toBe(true);
  cost: An assertion is made inside the helper that performs the call, so the claim does not appear in the test body where the behaviour is named.
  cites: TST-01
  correction: Return the envelope and assert ok in the test body.
- pass: standard
  file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  where: file path
  evidence: import { registerIngestToolset } from "../../../modules/ingestion/index.js";
  cost: The spec covers the ingest toolset's get_ingestion_status tool. Its behaviour-named path does not mirror the path of that unit.
  cites: TST-04
  correction: Place the file at the mirrored path of the unit under test.
- pass: standard
  file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
  where: vi.mock of extraction.service.js and ingestion.service.js (lines 48-68)
  evidence: 'return { ...actual, runLlmExtraction: mocks.runLlmExtraction };

    [...]

    return { ...actual, ingestRawInformation: mocks.ingestRawInformation };'
  cost: The orchestrator and the intake service, both business logic, are replaced. The spec checks only that mcp-stdio.ts forwards the configured model, not that the extraction actually uses it.
  cites: TST-03
  correction: Keep the services and replace only the pool and the model client.
- pass: standard
  file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
  where: advertisedStdioTools and the spy setup (lines 100-117)
  evidence: "const options = mocks.buildConfiguredMcpServer.mock.calls[0]?.[0] as {\n  tools: readonly McpHttpTool[];\n};\n[...]\n}) as never);"
  cost: Untyped mock arguments are declared to be typed shapes, and process.exit is replaced through `as never`. A change to buildConfiguredMcpServer's options shape no longer fails here at compile time.
  cites: TYP-02
  correction: Type the mock with the function's own signature and narrow the captured argument.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: nodeRow, linkRow, linkMetadataRow, provenanceRow, respondToGraph and buildClient (lines 74-281)
  evidence: "function respondToGraph(\n  world: World,\n  sql: string,\n  params: readonly unknown[]\n): Rows | undefined {"
  cost: About 200 lines of row builders and SQL responders are repeated almost verbatim in search-service-ranking.spec.ts and in part in search-service-approximate-node.spec.ts. A schema or query change in the search path must be applied to every copy, and a copy that is missed keeps asserting against a shape the repository no longer returns.
  cites: MNT-03
  correction: Put the shared world and responders in one test fixture.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  where: nodeRow, linkRow, linkMetadataRow, provenanceRow, respondToGraph and buildClient (lines 74-269)
  evidence: "function respondToGraph(\n  world: World,\n  sql: string,\n  params: readonly unknown[]\n): Rows | undefined {"
  cost: The same fake graph store as search-service-expansion.spec.ts, copied rather than called, so the two drift apart when one is fixed.
  cites: MNT-03
  correction: Put the shared world and responders in one test fixture.
- pass: standard
  file: src/app.ts
  where: buildApp (lines 52-194)
  evidence: 'export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {'
  cost: One function of about 140 lines wires CORS, the error handler, health, the auth scope, five modules' routes, MCP transports and toolsets, under four nested catalog-presence conditions. To know which routes exist when ingestionCatalog or catalog is absent, a reader has to trace all of them in one pass.
  cites: MNT-01
  correction: Extract named registration helpers, such as one for the authenticated scope and one for the toolsets.
- pass: standard
  file: src/app.ts
  where: Fastify options (line 58)
  evidence: 'loggerInstance: logger as unknown as FastifyBaseLogger,'
  cost: The double cast removes the compiler's check that the pino Logger satisfies Fastify's logger contract. A pino or Fastify upgrade that breaks it surfaces at run time, not in the build.
  cites: TYP-02
  correction: Type the logger so it satisfies FastifyBaseLogger, or narrow it with a guard.
- pass: standard
  file: src/app.ts
  where: corsOrigins fallback (lines 64-67)
  evidence: "const corsOrigins = env.CORS_ORIGINS ?? [\n  \"http://localhost:5173\",\n  \"http://127.0.0.1:5173\",\n];"
  cost: 'The same two origins are the schema default in config/env.ts, so this fallback can never run: env.CORS_ORIGINS always has a value. When the allowed origins change, the unreachable copy here is edited or forgotten independently of the live one.'
  cites: TYP-04
  correction: Read the origins only from env, and keep one definition of the default.
- pass: standard
  file: src/app.ts
  where: toolNames of registerIngestMcpTransport (lines 108-115)
  evidence: '"ingest_document",

    "ingest_directed",

    "health",

    "get_ingestion_status",

    "list_recent_ingestions",'
  cost: The same tool names are spelled again in ingest-toolset.ts (READ_ONLY_TOOL_NAMES and the registered list) and in mcp-stdio.ts. Adding a tool means editing each list, and a list that is missed silently omits the tool from that transport.
  cites: TYP-04
  correction: Export one constant list of the ingest tool names from the toolset module and use it everywhere.
- pass: standard
  file: src/config/env.ts
  where: the four boolean flags (lines 54-82)
  evidence: '.union([z.boolean(), z.enum(["true", "false"])])

    .transform((v) => (typeof v === "boolean" ? v : v === "true"))'
  cost: The same coercion appears in CHAT_ENABLED, CHAT_INGEST_ENABLED, CHAT_TITLE_ENABLED and CHAT_SUMMARY_ENABLED. A fix to how a flag is parsed has to be made four times, and the copy that is missed parses its flag differently from the rest.
  cites: MNT-03
  correction: Define one boolean-flag schema and reuse it in all four.
- pass: standard
  file: src/config/env.ts
  where: INGEST_MODEL default (line 50)
  evidence: 'INGEST_MODEL: z.string().min(1).default("claude-sonnet-4-6"),'
  cost: The literal is not a named constant, while its sibling CONTEXT_MODEL uses DEFAULT_CONTEXT_MODEL. The same string is also DEFAULT_INGEST_MODEL in ingest-document.handler.ts, and "claude-haiku-4-5" appears both as DEFAULT_CONTEXT_MODEL and as the CHAT_UTILITY_MODEL default. A model upgrade has to find each copy.
  cites: TYP-04
  correction: Name the default once and let the handler and the schema read the same constant.
- pass: standard
  file: src/config/env.ts
  where: CORS_ORIGINS default (line 13)
  evidence: .default("http://localhost:5173,http://127.0.0.1:5173")
  cost: A development environment's URLs are written in source as the default allowed origins. A deployment that does not set CORS_ORIGINS runs with the development origins instead of failing to start, and the value is only visible by reading this file.
  cites: SEC-03
  correction: Require CORS_ORIGINS outside development, or take the development default from the environment file instead of source.
- pass: standard
  file: src/mcp-stdio.ts
  where: main (lines 67-194)
  evidence: 'async function main(): Promise<void> {'
  cost: One function of about 128 lines loads env, builds the pool, loads two catalogs, registers three toolsets, builds the server and installs shutdown handlers. It has five separate process.exit(1) paths. A change to the boot order has to be made by reading all of them.
  cites: MNT-01
  correction: 'Extract named steps: load env, connect, load catalogs, register toolsets, install shutdown.'
- pass: standard
  file: src/mcp-stdio.ts
  where: REDACT_PATHS and buildStderrLogger (lines 27-65)
  evidence: "const REDACT_PATHS: readonly string[] = [\n  \"content\",\n  \"text\",\n  \"value\","
  cost: The redaction list and the pino options are a full copy of buildLogger in config/logger.ts (lines 11-62), except for the destination. A field added to the redaction list in logger.ts is still written in clear by the stdio server, which carries document content.
  cites: MNT-03
  correction: Let buildLogger accept a destination and call it from here.
- pass: standard
  file: src/mcp-stdio.ts
  where: db_ping_failed and related handlers (lines 91, 113, 166)
  evidence: 'logger.fatal({ err_message: (err as Error).message }, "db_ping_failed");'
  cost: A caught value is asserted to be an Error without a check, and the same assertion appears in four handlers. A thrown string or object makes err_message undefined in the fatal log that explains why the server stopped.
  cites: TYP-02
  correction: Narrow with `err instanceof Error` as the rest of the code does.
- pass: standard
  file: src/mcp-stdio.ts
  where: failure paths of main (lines 92, 117, 169)
  evidence: await pool.end().catch(() => undefined);
  cost: A failure to close the pool is discarded without a log line or a rethrow, on three exit paths. A leaked connection on shutdown leaves no trace.
  cites: COR-01
  correction: Log the failure from pool.end() before exiting.
- pass: standard
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: ListToolCallsResponseSchema (lines 95-101)
  evidence: "export const ListToolCallsResponseSchema = z.object({\n  total: z.number().int().nonnegative(),\n  limit: z.number().int().positive(),\n  offset: z.number().int().nonnegative(),\n  items: z.array(ToolCallResponseSchema),\n});"
  cost: A paginated response is declared in this module, and query-retrieval declares the same shape as SearchResponse. The two can disagree about the pagination contract. The shared PaginatedResponse type the rule names is not present in the tree (no file under src/types), so there is nothing to import yet.
  cites: API-01
  correction: Create the shared PaginatedResponse type at src/types/pagination.ts and derive this response from it.
- pass: standard
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: type and file naming (lines 82, 93, 108, 114)
  evidence: 'export type LlmRunResponse = z.infer<typeof LlmRunResponseSchema>;

    [...]

    export type ListToolCallsQuery = z.infer<typeof ListToolCallsQuerySchema>;'
  cost: One file llm-run.dto.ts holds Response, Request and Query shapes for different use cases, and the inferred types carry no Dto suffix. A reader looking for the shape the retry route accepts or the tool-calls listing returns cannot find it from the use case's name.
  cites: DTO-03
  correction: One file per use case (for example list-tool-calls-query.dto.ts), with <UseCase>Schema and <UseCase>Dto.
- pass: standard
  file: src/modules/ingestion/dto/propose-node.dto.ts
  where: ProposeNodeResolution, AliasNotAdmitted, ProposeNodeResult (lines 26-39)
  evidence: 'export type ProposeNodeResolution = "matched_existing" | "created_new" | "needs_review";

    [...]

    export interface ProposeNodeResult {'
  cost: The result shape is written by hand instead of being inferred from a Zod object, so nothing checks it against what the service returns. The set of resolutions is repeated in DirectedItemStatus in directed-ingestion.service.ts, with no schema to keep them equal.
  cites: DTO-02
  correction: Declare the result as a Zod object and infer the type from it.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: readRunStatus (lines 47-60)
  evidence: "} catch {\n  return undefined;\n} finally {"
  cost: A failed status read (a dropped connection, a missing run) is discarded and reported to the client as run_status null. A database failure is indistinguishable from "run not found", with no log line to tell them apart.
  cites: COR-01
  correction: Log the error and rethrow it, or return a typed failure.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: ingestDocumentHandler (lines 75-209)
  evidence: export async function ingestDocumentHandler(
  cost: One function of about 135 lines covers intake, the idempotent no-op branch, extraction and three kinds of failure mapping. A change to one branch has to be read against the others.
  cites: MNT-01
  correction: Extract the intake, the already-ingested response and the failure mapping into named helpers.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: McpEnvelopeJson (lines 20-28)
  evidence: "export interface McpEnvelopeJson {\n  readonly ok: boolean;\n  readonly result?: unknown;"
  cost: The same interface is declared again in ingest-toolset.ts (line 64), next to the McpEnvelope in handler-base. Two declarations of the logical envelope can drift, and nobody can say which one the tools promise.
  cites: MNT-03
  correction: Import the one envelope type.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: intake failure branch (lines 96-116)
  evidence: 'const pgDown = isPgUnavailable(err);

    [...]

    code: "SYSTEM_SERVICE_UNAVAILABLE",

    message: "A backing service is temporarily unavailable.",'
  cost: The "backing service unavailable" envelope is hand-built here and in directed-ingestion.service.ts, although error-mapping already provides serviceUnavailableError() and internalError(), which ingest-toolset.ts uses. The message wording or code can now differ by tool.
  cites: MNT-03
  correction: Call serviceUnavailableError() and internalError().
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: body defaults and the noop_existing branch (lines 83-90 and 120-147)
  evidence: 'model: input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL,

    prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION,

    [...]

    outcome: "already_ingested",'
  cost: The rules that choose the default model and prompt version, and decide when an ingestion counts as "already ingested and completed", are decided in the handler. A caller over REST (POST /raw-information) or from a job cannot reuse them and would have to restate them.
  cites: ARC-04
  correction: Move the defaulting and the idempotent-outcome decision into a service the handler calls.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: log and tool labels
  evidence: 'component: "mcp.ingest",

    tool: "ingest_document",'
  cost: These two strings are written out in each of the five log calls of this handler, and "mcp.ingest" again in ingest-toolset.ts. Renaming the tool means editing each one, and a missed one splits the logs.
  cites: TYP-04
  correction: Name the component and the tool once as constants.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: tool handlers and runZodFailureAudit (lines 91-98, 231-234, 351)
  evidence: "})) as McpEnvelopeJson;\n[...]\ninvocation_context as\n  | import(\"./directed-ingest.handler.js\").IngestDirectedInvocationContext\n  | undefined\n[...]\ninput: rawInput as never,"
  cost: Handler returns are asserted to be McpEnvelopeJson, the tool's invocation context is asserted to be a typed object, and the audit input is cast to never. The context comes from outside the tool's own code. None of these claims is checked, so a change in the shape surfaces as a wrong value in an audit row.
  cites: TYP-02
  correction: Return the handlers' own envelope type, and parse the invocation context with a schema.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: registerIngestToolset (lines 74-302)
  evidence: 'export function registerIngestToolset(deps: IngestToolsetDeps): void {'
  cost: One function of about 230 lines registers nine tools with a near-identical safeParse, audit, handler body for four of them. Adding a tool or a field means editing the middle of it.
  cites: MNT-01
  correction: Extract one registration helper per tool, or a shared one for the four propose_* tools.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: runZodFailureAudit (lines 340-346)
  evidence: "async function runZodFailureAudit(\n  pool: Pool,\n  logger: Logger,\n  rawInput: unknown,\n  zodError: z.ZodError,\n  toolName: IngestToolName"
  cost: Five positional parameters, and every caller has to remember their order. Two of them (rawInput and zodError) have the same shape from the caller's point of view.
  cites: MNT-01
  correction: Pass one options object.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: zod issue mapping (lines 192-195, 311-314, 357-360)
  evidence: "issues: parsed.error.issues.map((i) => ({\n  path: i.path.map((seg) => String(seg)).join(\".\"),\n  message: i.message,\n})),"
  cost: The same issue-to-wire mapping is written three times here and again as zodErrorEnvelope in extraction.service.ts and in directed-ingestion.service.ts. A change to the validation error shape reaches some tools and not others.
  cites: MNT-03
  correction: One function that maps Zod issues to the wire shape.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: tools_registered count (lines 282-299)
  evidence: INGEST_TOOL_NAMES.length + 2 + READ_ONLY_TOOL_NAMES.length,
  cost: The "+ 2" stands for ingest_document and ingest_directed, which the next lines spell again by name. Adding a tool to either list leaves the logged count wrong with no failure.
  cites: TYP-04
  correction: Count the names from the list that is logged.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: StartAsyncIngestionMcpInputSchema and IngestDocumentMcpInputSchema (lines 48-115)
  evidence: 'export const StartAsyncIngestionMcpInputSchema = z.object({

    [...]

    export const IngestDocumentMcpInputSchema = z.object({'
  cost: Two schemas of about 35 lines each that differ only in one describe() text. A field or limit changed in one leaves the other accepting what the first refuses.
  cites: MNT-03
  correction: Derive one from the other, or share the common shape.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: GetIngestionStatusSummarySchema, AffectedNodeOutputSchema, GetIngestionStatusOutputSchema (lines 133-166)
  evidence: "const GetIngestionStatusSummarySchema = z.object({\n  accepted: z.number().int().nonnegative(),"
  cost: These are field-for-field copies of LlmRunSummarySchema, AffectedNodeSchema and LlmRunResponseSchema in dto/llm-run.dto.ts, which this file already imports from. A field added to the run response there (as document_context was) has to be added here by hand.
  cites: MNT-03
  correction: Reuse the schemas from llm-run.dto.ts.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirected item schemas (lines 184-292)
  evidence: const IngestDirectedRefSchema = z.string().min(1).max(120);
  cost: The directed-ingestion item schemas (ref, fragment, node, attribute, link) are written again as DirectedRefSchema and the Directed*ItemSchema family in directed-ingestion.service.ts. The service's own comment says the handler will reuse its schema verbatim. A limit changed on one side still passes on the other.
  cites: MNT-03
  correction: Share one set of schemas and add the describe() text where it is used.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: content limit (lines 52 and 88)
  evidence: .max(10 * 1024 * 1024, "content must not exceed 10 MiB")
  cost: The 10 MiB limit is spelled in two schemas here, and its sibling 11 MiB body limit is spelled in app.ts and in ingestion.routes.ts. The relation between the body limit and the content limit is only visible by comparing literals.
  cites: TYP-04
  correction: One named constant for the content limit, from which the body limit is derived.
- pass: standard
  file: src/modules/ingestion/repository/llm-run.repository.ts
  where: the llm_run column list (lines 76-78, 95-97, 114-116, 176-178, 206-208)
  evidence: "RETURNING id, model, prompt_version, started_at, finished_at, status,\n          attempts, input_raw_information_id, idempotency_key,\n          document_context, document_context_status"
  cost: The same column list is written out in seven statements across this file and ingestion.repository.ts. Adding document_context_status required each of them to be edited, and the one that was missed would return a row without the column that LlmRunRow promises.
  cites: MNT-03
  correction: Keep the column list in one constant that the statements embed.
- pass: standard
  file: src/modules/ingestion/repository/llm-run.repository.ts
  where: aggregateToolCallOutcomes (lines 122-164)
  evidence: export async function aggregateToolCallOutcomes(
  cost: 43 lines that run two queries, build the zeroed summary and fold the rows into it. The zero-initialised summary has to be kept in step with LlmRunSummary by hand.
  cites: MNT-01
  correction: Split the outcome count and the orphan count into two functions.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: schemas declared in the routes file (lines 60-70)
  evidence: 'const RunLlmExtractionRequestSchema = z.object({}).strict().default({});

    [...]

    const RawInformationIdParamSchema = z.object({

    [...]

    const LlmRunIdParamSchema = z.object({'
  cost: Three request shapes are declared in the controller, not in a dto directory. The next route that needs the llmRunId param declares it again.
  cites: ARC-05
  correction: Move them to files under dto/.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: handleProposeMirror (lines 389-456)
  evidence: "const run = await findLlmRunById(client, llmRunId);\nif (run === null) {\n  throw new ResourceNotFoundError(\"llm_run\", llmRunId);\n}\nif (run.status !== \"running\") {\n  throw new RunNotRunningError(llmRunId, run.status);\n}"
  cost: The route reads the run through the repository and enforces "propose-* only while the run is running" itself. The MCP propose_* tools enforce the same rule in their own handler base, so the rule exists once per transport and each copy can change separately.
  cites: ARC-04
  correction: Move the lookup and the status rule into a service that both transports call.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: ResourceNotFoundError mapping (lines 109-118, 137-146, 162-171, 192-201, 231-240, 305-314, 431-440)
  evidence: "return reply.status(404).send({\n  ok: false,\n  error: {\n    code: err.code,\n    message: err.message,\n    details: { entity: err.entity, id: err.entityId },\n  },\n});"
  cost: The same 404 mapping is copied seven times, and the 409 mapping for run status twice. Changing the envelope for one means finding the rest, and a copy that is missed answers in a different shape from the others.
  cites: MNT-03
  correction: Map typed errors once in the error handler, or in one function.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: registerIngestionRoutes and handleProposeMirror (lines 72-387 and 389-397)
  evidence: "export async function registerIngestionRoutes(\n[...]\nasync function handleProposeMirror<R>(\n  deps: IngestionRouteDeps,\n  reply: FastifyReply,\n  llmRunId: string,\n  call: ("
  cost: registerIngestionRoutes is about 315 lines, so a route's behaviour is found by scrolling past ten others. handleProposeMirror takes four positional parameters and is 68 lines.
  cites: MNT-01
  correction: One registration function per route group, and an options object for handleProposeMirror.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: POST_INGEST_BODY_LIMIT (line 62)
  evidence: const POST_INGEST_BODY_LIMIT = 11 * 1024 * 1024;
  cost: The same 11 MiB is BODY_LIMIT_BYTES in app.ts. The route limit and the global limit change separately, and the route-level limit would silently stop being the larger of the two.
  cites: TYP-04
  correction: One exported constant, or a limit read from configuration.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: import of ingestRawInformation (line 76)
  evidence: import { ingestRawInformation } from "./ingestion.service.js";
  cost: One service calls another, so the intake transaction opened here and the one opened inside ingestRawInformation are decided by whoever reads both files. The shared behaviour has no single owner below or above them.
  cites: LAY-04
  correction: Move the shared intake behaviour into a domain module or inject it from a factory.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: directedIngestionService (lines 294-299)
  evidence: "export async function directedIngestionService(\n  input: unknown,\n[...]\nconst parsed = DirectedIngestionInputSchema.safeParse(input);"
  cost: The service receives raw input and validates it itself, then builds its own error envelope. The MCP layer's mcp-schemas.ts also validates the same payload with its own copy of the schema, so two places decide what is acceptable.
  cites: DTO-01
  correction: Validate at the transport boundary and have the service take the typed DirectedIngestionInput.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: directedIngestionService (lines 294-813)
  evidence: export async function directedIngestionService(
  cost: One function of about 520 lines does the parse, intake, four dispatch loops, run close, node resolution and response. The four loops repeat the same shape, so a fix to one loop's error handling is easy to leave out of the other three.
  cites: MNT-01
  correction: One named function per step, and one shared dispatch helper for the four item kinds.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: envelope casts and pin details (lines 472, 557, 525)
  evidence: 'envelope as unknown as McpEnvelope<Record<string, unknown>>

    [...]

    (pinResult.details as { reason?: unknown }).reason === "not_found"'
  cost: Handler envelopes are cast through unknown to the collector's input type, and the pin result's details are cast to read one field. A change in the propose_* result shapes breaks the affected-nodes collection with no compile error.
  cites: TYP-02
  correction: Make the collector accept the handlers' typed envelopes, and return a typed reason from verifyNodePin.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: closeRunCompletedSafe (lines 1002-1006)
  evidence: "} catch {\n  /* swallow */\n}"
  cost: A failed ROLLBACK is dropped with no log or rethrow. A connection left in an aborted transaction is released back to the pool, and the next caller to use it fails with no link to this cause.
  cites: COR-01
  correction: Log the rollback failure, and release the client with the discard flag as llm-run.repository.ts does.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: error forwarding in the four dispatch loops (lines 485-491, 573-579, 654-660, 737-743)
  evidence: "error: {\n  code: envelope.error.code,\n  message: envelope.error.message,\n  ...(envelope.error.details !== undefined\n    ? { details: envelope.error.details }\n    : {}),\n},"
  cost: The same block is written four times, one per item kind. A change to what is forwarded to the caller (a redacted detail, say) has to be made in all four.
  cites: MNT-03
  correction: One function that turns a failed envelope into a report entry.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: closeRunCompletedSafe and the affected-nodes block (lines 752-772 and 991-1019)
  evidence: "const client = await pool.connect();\ntry {\n  await client.query(\"BEGIN\");\n  await closeLlmRunRow(client, { llm_run_id: llmRunId, outcome: \"completed\" });\n  await client.query(\"COMMIT\");"
  cost: closeRunCompletedSafe repeats closeRunSafe from extraction.service.ts, and the resolveAffectedNodes/setCachedAffectedNodes block repeats the one in runLlmExtraction. The two runs of a document (extracted and directed) can end up closed by code that has drifted apart, although withTransaction exists in shared/pg-transaction.
  cites: MNT-03
  correction: Call one close-run function and one affected-nodes function from both paths.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: confidence and epoch fallbacks (lines 460, 617, 697, 1036-1038, 1058)
  evidence: 'confidence: 1.0,'
  cost: The forced directed confidence is spelled three times and the epoch fallback `new Date(0).toISOString()` three times. Changing the confidence given to directed items means finding every copy.
  cites: TYP-04
  correction: Name DIRECTED_CONFIDENCE and an epoch constant.
- pass: standard
  file: src/modules/ingestion/service/entity-resolution.service.ts
  where: insertNode (line 244)
  evidence: return res.rows[0]!.id;
  cost: A non-null assertion on the row returned by INSERT ... RETURNING with no guard. Elsewhere in the module a missing row is raised as an InvariantError. Here an empty result becomes a TypeError with no mention of which insert failed.
  cites: TYP-02
  correction: Check for the row and throw InvariantError as the repositories do.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: RunNotRunnableError, LlmProviderFatalError, ExtractionFatalError (lines 57, 77, 97)
  evidence: 'public readonly statusCode = 409;

    [...]

    public readonly statusCode = 502;

    [...]

    public readonly statusCode = 500;'
  cost: The service's errors carry HTTP statuses, so the service raises transport decisions. The MCP and stdio paths read the same classes and have no use for them. Changing a status means editing a business error.
  cites: COR-03
  correction: Keep the codes in the service errors and map them to statuses in the error middleware or the routes.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: import of ingestion.service (line 39)
  evidence: import { ResourceNotFoundError } from "./ingestion.service.js";
  cost: One service imports another only to reach an error class. The dependency makes extraction.service load ingestion.service, so a test or a caller of one drags in the other.
  cites: LAY-04
  correction: Move ResourceNotFoundError to a shared errors module.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: uncaught-exception branch of runLlmExtraction (lines 394-401)
  evidence: "const cause = err instanceof Error ? err.message : String(err);\nlogger.error(\n  { llm_run_id: llmRunId, cause_message: cause },\n  \"extraction_uncaught_exception\"\n);\nthrow new ExtractionFatalError(llmRunId, cause, partial);"
  cost: The raw message of any unexpected exception, including a driver error with SQL or constraint names, becomes the message of ExtractionFatalError. ingestion.routes.ts and ingest-document.handler.ts send err.message to the client, so internal detail reaches the response.
  cites: SEC-04
  correction: Log the cause and give the client a fixed message with the run id.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: closeRunSafe (lines 672-687)
  evidence: "} catch {\n  await client.query(\"ROLLBACK\").catch(() => undefined);\n} finally {"
  cost: A failure to close the run is dropped without a log line, and the ROLLBACK error is discarded too. The run stays "running" with no record of why, and the following readFinalRun reports it as if the close had worked.
  cites: COR-01
  correction: Log the failure, and release with the discard flag if the rollback fails.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runLlmExtraction (lines 297-439)
  evidence: "export async function runLlmExtraction(\n  pool: Pool,\n  llmRunId: string,\n  logger: Logger,\n  catalog: CatalogSnapshot,\n  deps: RunExtractionDeps"
  cost: A function of about 143 lines with five positional parameters, called in that order from the routes, the handler, the toolset and nine specs. Adding a dependency means changing every caller.
  cites: MNT-01
  correction: Take one options object, and extract the context, chunk and close phases.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runChunkLoop (lines 463-581)
  evidence: 'async function runChunkLoop(input: ChunkLoopInput): Promise<ChunkLoopOutcome> {'
  cost: About 118 lines mixing the model call, usage logging, stop-reason handling, tool dispatch and the error-burst counter. The `burstReset` variable is assigned and then discarded with `void burstReset;`.
  cites: MNT-01
  correction: Extract the turn, the dispatch and the burst accounting into named functions.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: defaultAnthropicFactory, dispatchToolUse, buildTool (lines 140-145, 163-173, 250-260)
  evidence: '}) as unknown as AnthropicLike;

    [...]

    ...(rawInput as Record<string, unknown>),

    [...]

    schema as unknown as Anthropic.Messages.Tool.InputSchema,'
  cost: The real SDK client is asserted to be the local AnthropicLike, and model tool input and JSON Schema are asserted into typed shapes without a check. An SDK change in the stream signature would pass the build and fail on the first extraction.
  cites: TYP-02
  correction: Adapt the SDK client through a typed wrapper, and parse the model's tool input with the propose schemas first.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: RunNotRetryableError, RunNotRunningError (lines 32, 46)
  evidence: public readonly statusCode = 409;
  cost: Both business errors carry an HTTP status, so the service decides a transport mapping. The routes already do the mapping themselves, so the status is stated twice and can disagree.
  cites: COR-03
  correction: Map the error codes to statuses in the error layer.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: import of ingestion.service (line 20)
  evidence: import { ResourceNotFoundError } from "./ingestion.service.js";
  cost: This service imports another service and re-exports its error (line 29), so callers import the error through llm-run.service and the dependency between the two services is hidden.
  cites: LAY-04
  correction: Move ResourceNotFoundError to a shared errors module.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: getLlmRunById (lines 77-83)
  evidence: "} catch {\n  affectedNodes = undefined;\n}"
  cost: A failure while deriving the affected nodes of a completed run is discarded and the run is returned without them, with no log line. The client sees a completed run that simply has no affected_nodes, with nothing telling it that the lookup failed.
  cites: COR-01
  correction: Log the failure with the run id, or rethrow it wrapped with the cause.
- pass: standard
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: recordProducedContext (lines 151-182)
  evidence: "await client.query(\"BEGIN\");\n[...]\nawait client.query(\"COMMIT\");\n} catch (err) {\n  try {\n    await client.query(\"ROLLBACK\");\n  } catch {\n    discardConnection = true;\n  }\n  throw err;"
  cost: A hand-written transaction block that withTransaction (shared/pg-transaction.js, used by ingest-document.handler.ts) already provides. The same block is in llm-run.repository.ts (insertToolCallStandalone) and, in a weaker form, in extraction.service.ts and directed-ingestion.service.ts. A fix to rollback handling reaches only some of them.
  cites: MNT-03
  correction: Call withTransaction.
- pass: standard
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: recordProducedContext (lines 151-182)
  evidence: async function recordProducedContext(
  cost: The function is 32 lines, over the thirty-line limit, because it carries the transaction handling itself and not just the two writes.
  cites: MNT-01
  correction: Using withTransaction brings it under the limit.
- pass: standard
  file: src/modules/ingestion/service/propose-node.service.ts
  where: import of entity-resolution.service (line 10)
  evidence: import { resolveOrCreateNode } from "./entity-resolution.service.js";
  cost: One service calls another, so this service's transaction boundary is whatever resolveOrCreateNode assumes about the client. The shared behaviour has no module beneath it.
  cites: LAY-04
  correction: Move entity resolution into a domain module that both services use, or inject it.
- pass: standard
  file: src/modules/ingestion/service/propose-node.service.ts
  where: line 29
  evidence: const resolvedType = nodeType!;
  cost: 'The non-null assertion relies on assertKnownType having thrown, but assertKnownType receives only `found: boolean` and does not narrow nodeType. If the assertion''s behaviour changes, the next line dereferences undefined.'
  cites: TYP-02
  correction: Narrow with an explicit `if (nodeType === undefined) throw` or make assertKnownType an assertion function over the value.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: the whole file
  evidence: "export interface SearchResponse {\n  readonly query: string;\n  readonly total: number;"
  cost: The search response and the provenance shapes are hand-written interfaces, with no Zod object. The wire shape of /search and of the MCP search tool is unchecked against what the service builds, and the MCP output schema cannot be derived from it.
  cites: DTO-02
  correction: Declare the response as Zod objects and infer the types.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: SearchResponse (lines 54-60)
  evidence: "export interface SearchResponse {\n  readonly query: string;\n  readonly total: number;\n  readonly limit: number;\n  readonly offset: number;"
  cost: The same total/limit/offset/items shape as ListToolCallsResponseSchema in the ingestion module, declared again. The shared PaginatedResponse type of src/types/pagination.ts is not in the tree.
  cites: API-01
  correction: Create the shared type and extend it here.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: naming (lines 3-90)
  evidence: export interface SearchResponse {
  cost: The file is named response.dto.ts for the whole module, and its types carry no Dto suffix and no use-case name. A reader looking for the search route's response does not find a SearchResponseDto in a search-response.dto.ts.
  cites: DTO-03
  correction: Name the file and its Schema/Dto pair for the use case.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: SOURCE_TYPES and SourceType (lines 7-24)
  evidence: "const SOURCE_TYPES: ReadonlySet<SourceType> = new Set([\n  \"pdf\",\n  \"email\",\n  \"ata\","
  cost: The seven source types are listed again, although the ingestion module already owns SourceTypeSchema (dto/source-type). Adding a source type there leaves search rejecting the new value with an InvariantError at read time.
  cites: MNT-03
  correction: Reuse the one source-type definition.
- pass: standard
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: listProvenanceForFragments, listProvenanceForLinks, listProvenanceForNodes (lines 212-306)
  evidence: "substring(rc.\"text\" FROM rc.offset_start + 1\n          FOR rc.offset_end - rc.offset_start) AS excerpt,\nri.id         AS raw_information_id,\nri.source_type::text AS source_type,\nri.received_at"
  cost: The same 11-column SELECT list and joins from fragment to chunk to raw information are in three statements. A change to the provenance columns, such as the excerpt rule, must be made three times, and a missed one gives search items different excerpts for the same chunk.
  cites: MNT-03
  correction: Keep the shared select list and joins in one constant.
- pass: standard
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: listProvenanceForNodes (lines 273-306)
  evidence: export async function listProvenanceForNodes(
  cost: The function is 34 lines, over the thirty-line limit, mostly because it repeats the SQL of the two functions above it.
  cites: MNT-01
  correction: Sharing the select list brings it under the limit.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService (lines 109-292)
  evidence: "export async function searchKnowledgeService(\n  client: PoolClient,\n  catalog: CatalogSnapshot,\n  input: SearchServiceInput,\n  logger: Logger"
  cost: A function of about 184 lines with four positional parameters. It runs three layer searches, the dedup, the item building, the expansion, the ordering and the logging. The helpers below it show the split already exists in part.
  cites: MNT-01
  correction: Extract the layer item builders and the log, and take an options object.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: resolveLayers (lines 466-480)
  evidence: "if (!(ALLOWED_LAYERS as readonly string[]).includes(layer)) {\n  throw new InvalidSearchLayerError(layer);\n}"
  cost: The service checks the layer names itself because SearchServiceInput.layers is typed readonly string[]. The route's schema (LayersArray in search.dto.ts) accepts any strings, so what counts as a valid layer is decided inside the service and every other caller has to rely on it.
  cites: DTO-01
  correction: Validate layers as a Zod enum at the route and tool boundary and type the input as SearchLayer.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: import of traverseNodes (lines 4-9)
  evidence: "import {\n  TRAVERSAL_DECAY,\n  traverseNodes,"
  cost: traverseNodes is exported by the knowledge-graph module's index from ./service/traversal.service.js, so the search service calls another module's service, and the traversal's own transaction handling (it is given the same client) is part of this service's behaviour.
  cites: LAY-04
  correction: Move the traversal into a domain module that both services use.
---
## What it is
This review answers the 14 tasks of initiative aliases-fuzzy-context over the 51 files their implementation and proof records name.
The captured run over the registry's five steps passed, so the failures pass had nothing to read.
The conformance pass ran one judge per file and its returns were folded into siegard-reconcile/aliases-fuzzy-context.md and bound into the trace.
The certification pass ran one coverage auditor per node a proof claims to demonstrate, 36 in all.

## Notes
Three conformance returns (mcp-schemas.ts, extraction.v5.ts, search.repository.ts) first answered for only part of their node pack and were each replaced by a fresh delegation before the fold; extraction.v5.ts took two.
The standard pass applied only the rules deliver.py --standard --reading listed for this file set; the two rules a tool decides rest on the typecheck step, which passed.
The standard pass reported TST-07 as not applicable because it was not handed the specification's rules.
The standard pass did not itemize the stand-in casts that build test doubles, and named several things no rule in scope reaches, among them reply.send inside a transaction callback in ingestion.routes.ts and the dead variable burstReset in extraction.service.ts.
Conformance findings are recorded here without the kind and node fields their returns carry; the reconciliation record holds those fields.
This framework does not review runtime behaviour against a real database, performance, or security beyond the rules of the standard.
No pass ran inline; every pass ran in a delegated subagent.
