---
target: backend
title: Review of the aliases-fuzzy-context delivery
summary: The four passes over the 63 backend files the 14 tasks of the initiative name, with every finding they returned.
reviewed:
- src/__tests__/integration/ingestion/context-model-wiring.spec.ts
- src/__tests__/integration/ingestion/propose-routes.spec.ts
- src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
- src/__tests__/integration/query-retrieval/search-node-match.spec.ts
- src/__tests__/unit/env.spec.ts
- src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
- src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
- src/__tests__/unit/ingestion/default-prompt-version-through-intake-and-extraction.spec.ts
- src/__tests__/unit/ingestion/default-prompt-version.spec.ts
- src/__tests__/unit/ingestion/document-context-dto.spec.ts
- src/__tests__/unit/ingestion/document-context-extraction-world.ts
- src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
- src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
- src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
- src/__tests__/unit/ingestion/entity-resolution.spec.ts
- src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
- src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
- src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
- src/__tests__/unit/ingestion/preliminary-reading-status-by-prompt-version.spec.ts
- src/__tests__/unit/ingestion/preliminary-reading.spec.ts
- src/__tests__/unit/ingestion/retried-run-world.ts
- src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
- src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
- src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
- src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
- src/__tests__/unit/ingestion/run-document-context-fixture.ts
- src/__tests__/unit/mcp-stdio-context-model.spec.ts
- src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
- src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
- src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
- src/__tests__/unit/query-retrieval/search-service-fragment-link-no-match.spec.ts
- src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
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
  missing: run/aliases-fuzzy-context-3 passed; there was no failure to read
coverage:
- criterion: A node proposal named "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq", in a run whose source says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto", creates a node whose canonical alias is "Conselho Nacional de Desenvolvimento Científico".
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — acronym written in the source > creates the node with its canonical name and also holds the alias CNPq
- criterion: That created node also holds the alias "CNPq".
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — acronym written in the source > creates the node with its canonical name and also holds the alias CNPq
  why: 'The test exercises only the recording of an alias the store reports as admitted. The admission itself is decided by the test''s stand-in for the admission query: it re-implements normalization and occurrence in TypeScript (dbNorm plus includes). Whether "CNPq" is admitted when checked against the run''s raw information is never decided by the query the service sends, so a broken admission query would still pass.'
- criterion: Outside a directed ingestion, a proposed alias whose normalized form does not occur in the normalized content of the raw information of the run is not recorded on the knowledge node.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — alias absent from the source > takes the proposal, answers its resolution, records no alias and names the alias as not admitted
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — proposal resolved to an existing node, alias absent from the source > does not add to the matched node an alias the source never writes
  why: The exercised part is the service declining to record an alias the store answers as not admitted. The test's stand-in decides, in TypeScript, that an alias whose normalized form is missing from the normalized content is not admitted. The admission query the service sends is never executed, so the occurrence test the criterion states is unexercised.
- criterion: A node proposal carrying an alias that is not admitted is still resolved, and answers its node identity and resolution.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — alias absent from the source > takes the proposal, answers its resolution, records no alias and names the alias as not admitted
- criterion: A proposed alias that differs from the source text only in case, accents or inner whitespace is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — alias the source holds in another spelling or position > records the alias on the node when the source holds it with $label
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — alias the source holds in another spelling or position, as answered > does not name the alias as not admitted when the source holds it with $label
  why: The test's stand-in judges the case, accent and inner-whitespace variants as admitted, and it does its own folding in TypeScript. The admission query's own normalization never runs, so a query that compared without folding case or accents would still pass. The variants also include whitespace around the alias, which the criterion does not name.
- criterion: A proposed alias that occurs in a chunk other than the one being read is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — alias the source holds in another spelling or position > records the alias on the node when the source holds it with $label
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — alias the source holds in another spelling or position, as answered > does not name the alias as not admitted when the source holds it with $label
  why: No chunk is read in these tests. The "paragraph other than the first" variant stands in for a chunk other than the one being read, and the stand-in compares against the whole raw content. Whether the admission query checks the raw information rather than the chunk being read is never executed.
- criterion: Within a directed ingestion, a proposed alias that no fragment text holds is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — directed ingestion > records an alias that the source never writes on the node
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — directed ingestion > does not name an alias that the source never writes as not admitted
  why: The stand-in decides whether a run is directed by comparing the run's model and prompt version with the identifiers the service sends. So the service's handing over of those identifiers is exercised. The admission query's own rule that a directed run admits any alias is not.
- criterion: A node proposal resolved to an existing knowledge node adds each admitted alias to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — proposal resolved to an existing node > adds the admitted alias to the matched node
  - file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 1: exact alias match -> matched_existing (no trigram query, no node insert)'
  why: Each test proposes a single admitted alias. A fault that added only the first of several admitted aliases would not be caught.
- criterion: A node proposal resolved to an existing knowledge node does not add its proposed name to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — proposal resolved to an existing node, name > does not add the proposed name to the matched node
  - file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 1: exact alias match -> matched_existing (no trigram query, no node insert)'
- criterion: The result of the node-proposal service names each alias it did not admit, with the reason ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — alias absent from the source > takes the proposal, answers its resolution, records no alias and names the alias as not admitted
  why: Only one alias is ever refused, so naming each of several refused aliases is unexercised. The assertion only checks that the serialized result contains the alias text and the reason text somewhere. It does not check that the reason is attached to that alias.
- criterion: After "CNPq" is admitted on a node, a later proposal of the same node type named "CNPq" resolves as matched_existing to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: alias admission — admitted acronym resolves a later proposal > resolves a later proposal named CNPq of the same node type to that node as matched_existing
  why: The exact-name lookup that finds the recorded alias is answered by the test's stand-in (it normalizes alias_norm in TypeScript), not by the lookup query itself.
- criterion: An ingest_document call that names no prompt version opens its LLM run under prompt version v5.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: default prompt version > opens the run under v5 when an ingest_document call names no prompt version
  - file: src/__tests__/unit/ingestion/default-prompt-version-through-intake-and-extraction.spec.ts
    name: default prompt version through intake and extraction > opens the run under v5 and runs extraction with the v5 prompt module when an ingest_document call names no prompt version
- criterion: The prompt registry maps the version v5 to a prompt module.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: prompt version enumeration > resolves exactly v1 to v5 and refuses a version outside them
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: holds exactly the prompt versions v1 to v5, each resolving to a module of its own version
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: fails an extraction under a prompt version the system does not hold without asking the model, and runs every held version under its own prompt
  why: 'Over-assertion: two of these tests claim the registry holds exactly v1 to v5, and the extraction-prompt-v5 test also requires the unknown-version message to list exactly those. Both break the day a later version is legitimately delivered beside v5. The default-prompt-version test also asserts that v6 is refused.'
- criterion: A run under prompt version v5 is extracted without failing as an unknown prompt version.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
    name: completes an extraction run whose prompt version is v5 instead of failing it as an unknown prompt version
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: fails an extraction under a prompt version the system does not hold without asking the model, and runs every held version under its own prompt
- criterion: The v5 system prompt asks the model to propose, with each node, every other name the text gives the same entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
  why: 'Over-assertion: the held-versions test asserts this for every held version from v5 on, so it binds versions not yet written.'
- criterion: The v5 system prompt names an acronym, a short name and another spelling as such other names.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
  why: The checks only find "acronym", "short name" and a spelling phrase somewhere in the v5 system prompt. Nothing asserts they are named as other names of the entity, so a prompt that used those words in any other role would pass. The held-versions test also binds every later held version.
- criterion: The v5 system prompt tells the model that a pronoun alone is not another name of the entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
- criterion: The v5 system prompt tells the model that a role alone is not another name of the entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
- criterion: The v5 system prompt holds every instruction the v4 system prompt holds.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: keeps every instruction line of the v4 system prompt in the v5 system prompt
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: holds each instruction line of the v4 system prompt as a whole line of the v5 system prompt, over a catalog with a link type, a link type rule and an attribute key with valid values
- criterion: The v5 system prompt names "hoje", "ontem" and "amanhã" as relative-date words.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: names hoje, ontem and amanhã as relative-date words in the v4 and v5 system prompts
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: names hoje, ontem and amanhã as relative-date words in the system prompt of every held version from v4 on
  why: 'Over-assertion: the held-versions test binds every held version from v4 on, including versions not yet written.'
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
  why: 'Over-assertion: the test also covers the v1 to v3 system prompts and the shared user prompt. It forbids the words alias, acronym, short name, spelling and pronoun anywhere in them, which is more than the criterion''s "does not ask for other names".'
- criterion: A search for "Petrobrass" returns the knowledge node "Petrobras" at hop 0.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the node layer''s approximate route > answers a knowledge node that only the approximate route reaches as a node item at hop 0'
  why: Only the service placing an approximate-route row at hop 0 is exercised. Whether "Petrobrass" reaches "Petrobras" (word similarity, the 0.6 threshold, the alias-length floor) is decided in the approximate-route SQL. The test replaces that SQL with a stand-in that returns the node for any query.
- criterion: A search for "contrato Petrobrass" returns the knowledge node "Petrobras".
  state: uncovered
  why: Nothing in the set searches for "contrato Petrobrass". The word similarity of a multi-word query to the alias "Petrobras" is computed only in the approximate-route SQL, which every test in the set replaces with a stand-in.
- criterion: A search for "contrato Petrobras" returns the knowledge node "Petrobras" when no alias holds the word "contrato".
  state: uncovered
  why: 'Nothing searches for "contrato Petrobras" over a node whose aliases lack "contrato". Neither half is exercised: the exact route missing that node, nor the approximate route reaching it.'
- criterion: A search for "CNPJ" does not return the knowledge node "CNPq" whose only alias is "CNPq".
  state: uncovered
  why: Nothing searches for "CNPJ" over a node whose only alias is "CNPq". The exclusion depends on the alias-length floor and the similarity threshold inside the approximate-route SQL, and no test runs that SQL.
- criterion: An alias shorter than 5 characters once normalized never matches a knowledge node approximately.
  state: uncovered
  why: The minimum normalized alias length is a parameter of the approximate-route SQL. Nothing runs that SQL with an alias of 4 or fewer characters, so the floor is never applied in a test.
- criterion: A knowledge node whose aliases all have a word similarity below 0.6 to the query text is not matched approximately.
  state: uncovered
  why: Nothing offers a node whose aliases all score below 0.6 to the query. The threshold filter lives in the approximate-route SQL, and every service test replaces that SQL with stand-in rows.
- criterion: The 0.6 threshold is one named constant.
  state: uncovered
  why: No test reads the threshold's constant, and nothing asserts that the threshold has a single named home rather than a repeated literal.
- criterion: A search for "PETROBRÁSS" scores the knowledge node "Petrobras" with the same similarity as a search for "petrobrass".
  state: uncovered
  why: Nothing compares the similarity scored for "PETROBRÁSS" with the one for "petrobrass". Case and accent folding of the query happens in SQL that no test executes.
- criterion: The similarity of "Petrobras" for "contrato Petrobrass" equals its similarity for "Petrobrass".
  state: uncovered
  why: Nothing compares the similarity of "Petrobras" for the two queries. The similarity is computed in the approximate-route SQL, and stand-ins supply it as a fixed value.
- criterion: An approximately matched knowledge node scores the highest word similarity of its aliases to the query text, times 0.9.
  state: uncovered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
    name: searchNodeAliasApproximateLayer SQL contract > selects the similarity as the highest word similarity of the node's aliases to the normalized query, with no layer weight applied
  why: The repository test matches a regex against the query text. It binds how the similarity column is written and never runs the query, and it says nothing about the score or the 0.9 factor. In the service tests the score arrives as a fixed stand-in value, so the score being the highest alias similarity times 0.9 is never computed in a test.
- criterion: A knowledge node matched both exactly and approximately appears once among the search items.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: a node matched by both node-layer routes > answers a knowledge node matched both exactly and approximately once'
- criterion: The node layer keeps at most 200 candidates, counting both routes together.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the node layer''s candidate cap across both routes > keeps at most 200 node candidates when the exact and approximate routes together hold more'
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the node layer''s candidate cap across both routes > reports a total that counts the 200 candidates kept, not the candidates both routes held'
  why: 'Over-assertion: the first test asserts exactly 200 items, so the cap must be filled, which is more than "at most". The second asserts that the reported total equals 200, which the criterion does not state.'
- criterion: A search for "Petrobrass" returns no fragment-layer item for a fragment whose text holds only "Petrobras".
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: prose layers stay lexical > answers no %s-layer item for text that only a trigram match could reach'
  why: The stand-in returns the "Petrobras" fragment only when the fragment-layer query text contains a trigram operator or "similarity". The fragment query itself never runs. A fuzzy match added any other way, or a lexical configuration that folds "Petrobrass" into "Petrobras", would pass.
- criterion: A search for "Petrobrass" returns no chunk-layer item for a chunk whose text holds only "Petrobras".
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: prose layers stay lexical > answers no %s-layer item for text that only a trigram match could reach'
  why: The stand-in returns the "Petrobras" chunk only when the chunk-layer query text contains a trigram operator or "similarity". The chunk query never runs, so a fuzzy reach introduced any other way would pass.
- criterion: A knowledge link one hop from an approximately matched knowledge node is returned with 0.5 times that node's score.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService expansion: a knowledge node matched approximately > expands from it like any matched node, scoring a link at hop h at 0.5 raised to h times the score of the matched node it was reached from, whether that node was matched exactly or approximately'
- criterion: An approximately matched knowledge node ranks after an exactly matched knowledge node whose score is lower.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: approximately matched knowledge nodes > ranks an approximately matched knowledge node after an exactly matched one whose score is lower'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: the whole order of a result set > orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending'
- criterion: A knowledge link reached only through approximately matched knowledge nodes ranks after every item not reached only through them.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: knowledge links by how they were reached > ranks a knowledge link reached only through an approximately matched node after every item not reached only through approximate matches'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: the whole order of a result set > orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending'
- criterion: A knowledge link reached from both an exactly matched and an approximately matched knowledge node ranks among the items not reached only through approximate matches.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: knowledge links by how they were reached > ranks a knowledge link reached from both an exactly and an approximately matched node among the items not reached only through approximate matches'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: the whole order of a result set > orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending'
- criterion: Within each group, items order by score descending.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: within a group > orders by score descending %s'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: the whole order of a result set > orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
    name: 'searchKnowledgeService ranking: the group reached only through approximate matches > orders links of equal score by recording time descending, then by identifier ascending, and a knowledge node of that score last as never recorded'
- criterion: Within each group, items of equal score order by recording time descending, with a knowledge node counting as never recorded.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: within a group > orders items of equal score by recording time descending, a fragment counting as recorded at its creation time'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: within a group > orders a knowledge node, counting as never recorded, after a knowledge link and an information fragment of equal score'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: the whole order of a result set > orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
    name: 'searchKnowledgeService ranking: the group reached only through approximate matches > orders links of equal score by recording time descending, then by identifier ascending, and a knowledge node of that score last as never recorded'
  why: 'Over-assertion: two of the tests settle that an information fragment''s recording time is its creation time, which the criterion does not state.'
- criterion: Within each group, items of equal score and recording time order by identifier ascending.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: within a group > orders items of equal score and equal recording time by identifier ascending'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: the whole order of a result set > orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
    name: 'searchKnowledgeService ranking: the group reached only through approximate matches > orders links of equal score by recording time descending, then by identifier ascending, and a knowledge node of that score last as never recorded'
- criterion: An exactly matched hop-0 knowledge node item carries the match exact.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the match and similarity of a hop-0 knowledge node item > answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: how a knowledge node was matched > answers a node reached by the lexical parse of the query with the match exact and a node reached by the trigram similarity of an alias with the match approximate'
- criterion: An approximately matched hop-0 knowledge node item carries the match approximate.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the match and similarity of a hop-0 knowledge node item > answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score'
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: how a knowledge node was matched > answers a node reached by the lexical parse of the query with the match exact and a node reached by the trigram similarity of an alias with the match approximate'
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: 'query-retrieval search answer: the match of a knowledge node matched approximately > shows the match approximate and its similarity on the node item of the REST search answer'
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: 'query-retrieval search answer: the match of a knowledge node matched approximately > shows the match approximate and its similarity on the node item of the MCP search answer'
- criterion: An approximately matched hop-0 knowledge node item carries its similarity.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the match and similarity of a hop-0 knowledge node item > answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score'
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: 'query-retrieval search answer: the match of a knowledge node matched approximately > shows the match approximate and its similarity on the node item of the REST search answer'
  - file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
    name: 'query-retrieval search answer: the match of a knowledge node matched approximately > shows the match approximate and its similarity on the node item of the MCP search answer'
  why: The similarity value itself comes from stand-in rows. The tests prove the item carries the row's similarity rather than its weighted score. They do not prove the value is the true word similarity.
- criterion: An exactly matched knowledge node item carries no similarity.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the match and similarity of a hop-0 knowledge node item > answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score'
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the match and similarity of a node matched both exactly and approximately > answers a knowledge node matched both exactly and approximately with no similarity, though one of its aliases is similar enough for an approximate match'
- criterion: A search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", each with an accepted information fragment mentioning it, returns both knowledge nodes.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: a search for the correct name of two knowledge nodes > answers the knowledge nodes Petrobras and Petrobrás Distribuidora for petrobras as two node items, each carrying the match exact'
  why: The stand-in returns both nodes from the exact route whatever the query. Neither the accent folding that lets "petrobras" reach "Petrobrás Distribuidora" nor the accepted fragments the criterion names exist in the test's world. Only the service passing both rows through is exercised.
- criterion: In a search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", both returned knowledge node items carry the match exact.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: a search for the correct name of two knowledge nodes > answers the knowledge nodes Petrobras and Petrobrás Distribuidora for petrobras as two node items, each carrying the match exact'
  why: The stand-in decides that both nodes arrive through the exact route. If the real lexical query missed "Petrobrás Distribuidora" and only the approximate route reached it, that item would carry approximate, and this test would not see it.
- criterion: A knowledge node matched both exactly and approximately carries the match exact.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the match and similarity of a node matched both exactly and approximately > answers a knowledge node matched both exactly and approximately with the match exact'
- criterion: The flags of an approximately matched knowledge node item hold no value describing its match.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: the flags of an approximately matched knowledge node > answers an approximately matched node with no flag describing its match'
  why: 'Over-assertion: the test asserts the flags are exactly empty. That is more than "no value describing its match" and would break if an unrelated flag legitimately applied to the node.'
- criterion: A knowledge link item reached by expansion carries no match.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService: the items that are neither a knowledge node > answers every knowledge link reached by expansion, from an exactly or an approximately matched node, and every information fragment with no match and no similarity'
  - file: src/__tests__/unit/query-retrieval/search-service-fragment-link-no-match.spec.ts
    name: 'searchKnowledgeService: the link and fragment items of a search over every layer > answers each knowledge link reached from an exactly or an approximately matched node, and the information fragment that the fragment layer and a supporting chunk both matched, with no match and no similarity'
  why: Both tests also assert that information fragment items carry no match and no similarity, which the criterion does not state.
- criterion: For a run holding a document context, each chunk's prompt shows the context's summary.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
  - file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
    name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
  why: 'Over-assertion: the chunk-prompt tests also assert that chunks are read in index order with one model call in flight at a time. The value-in-extraction test asserts that a reading lacking a summary records nothing. No criterion here states either.'
- criterion: For a run holding a document context, each chunk's prompt shows each listed entity with its node type and names.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
  - file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
    name: shows every chunk each entity of the document context with its node type and all its names, and records no context for an entity with no names, an empty names list or no node type
  - file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
    name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
  why: 'Over-assertion: the entity test also asserts that a reading listing an entity with no names, an empty names list or no node type records no context at all. No criterion states that.'
- criterion: For a run holding a document context, each chunk's prompt shows the same source metadata the v4 prompt shows.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
  why: The tests check four fixed metadata values (source type, document date, title, reception time). They do not compare against what the v4 prompt shows, so a metadata field added to v4 later would not be checked.
- criterion: For a run holding a document context, each chunk's prompt shows the last 200 characters of the chunk before it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
  why: 'Over-assertion: the tests pin "characters" to Unicode code points (an astral filler), which the criterion does not state. The preliminary-reading tests in this set pin the 100000-character limit to UTF-16 code units, so the set reads "characters" two ways. The predecessor here is also the index predecessor even when the store returns chunks out of order, which goes beyond the criterion.'
- criterion: Each chunk's prompt presents the document context marked apart from its instructions as data.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: presents the document content, each chunk's text and the document context shown with each chunk in the user turn, labelled as data and outside the instructions
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: presents each chunk's text, each listed entity name and the preliminary reading's content between a data label and a closing delimiter in the user turn and never in the system prompt, for a v5 run, a v4 run, a one-chunk run and a run whose preliminary reading failed
- criterion: For a run holding no document context, each chunk's prompt shows no document context.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: shows no document context in any chunk prompt of a run that holds none, whether the prompt version predates v5, the raw information has one chunk or the preliminary reading failed
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
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
  why: 'Over-assertion: the second test asserts that a fragment is anchored to the chunk being read even when the model names other chunks or none. No criterion here states that override.'
- criterion: With no context model configured, the context model the environment yields is claude-haiku-4-5.
  state: covered
  tests:
  - file: src/__tests__/unit/env.spec.ts
    name: loadEnv context model setting > yields claude-haiku-4-5 as the context model when none is configured
- criterion: With a context model configured, the environment yields that model.
  state: covered
  tests:
  - file: src/__tests__/unit/env.spec.ts
    name: loadEnv context model setting > yields the configured context model when one is configured
- criterion: The REST run-extraction route hands the configured context model to the orchestrator.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
    name: hands the configured context model to the orchestrator from the REST run-extraction route
  why: The proof is the fifth argument (deps.env.CONTEXT_MODEL) captured on a mocked orchestrator. It binds the shape of the handoff the criterion names, so it breaks if that argument is moved even when the model still arrives.
- criterion: The MCP ingest toolset hands the configured context model to the orchestrator.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
    name: hands the configured context model to the orchestrator from the MCP ingest toolset
  why: As with the REST route, the proof is an argument captured on a mocked orchestrator, so it binds the handoff's argument shape.
- criterion: The stdio server hands the configured context model to the orchestrator.
  state: covered
  tests:
  - file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
    name: hands the configured context model to the orchestrator from the stdio server
  why: The proof is an argument captured on a mocked orchestrator, so it binds the handoff's argument shape.
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
  - file: src/__tests__/unit/ingestion/preliminary-reading-status-by-prompt-version.spec.ts
    name: records the same document context status for one chunk, a too-long content, a failed reading and a produced context under v5 and every later prompt version
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
  - file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
    name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
- criterion: The recorded document context names the model that produced it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on the run a document context that names the model that produced it
  - file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
    name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
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
  - file: src/__tests__/unit/ingestion/preliminary-reading-status-by-prompt-version.spec.ts
    name: records the same document context status for one chunk, a too-long content, a failed reading and a produced context under v5 and every later prompt version
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: records the status produced when the preliminary reading made for a retried run whose status was failed yields a document context
- criterion: No recorded document context holds a summary of more than 5 lines.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the first 5 lines of a 7-line summary as the document context summary
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: counts an empty line as a line when it cuts a summary to 5 lines
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: lets a carriage return end no line when it cuts a summary to 5 lines
  why: 'Exercised only through the preliminary reading cutting a 6- or 7-line summary. Nothing hands a summary longer than 5 lines to the record itself (the document context schema or the repository''s record call), so a context recorded any other way is not held to the limit by any test. Over-assertion: the empty-line and carriage-return tests also settle what counts as a line, which the criterion does not state.'
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
  - file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
    name: shows every chunk each entity of the document context with its node type and all its names, and records no context for an entity with no names, an empty names list or no node type
- criterion: The preliminary reading records no tool call.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: proposes nothing and writes nothing but the run's own context columns before its first chunk is read
  why: The assertion only looks at writes made before the first chunk's model call. A tool call recorded for the reading after that point would not be seen.
- criterion: Before the first chunk is read, the knowledge base holds no knowledge node, information fragment, knowledge link or node attribute read from the raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: proposes nothing and writes nothing but the run's own context columns before its first chunk is read
  - file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
    name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
- criterion: The preliminary reading presents the content to the model marked apart from its instructions as data.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: presents the content to the model in the user turn, bracketed and labelled as data, and not among the instructions
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: presents the document content, each chunk's text and the document context shown with each chunk in the user turn, labelled as data and outside the instructions
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: presents each chunk's text, each listed entity name and the preliminary reading's content between a data label and a closing delimiter in the user turn and never in the system prompt, for a v5 run, a v4 run, a one-chunk run and a run whose preliminary reading failed
- criterion: The model call of the preliminary reading waits at most five minutes.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
    name: abandons a model call that never answers within five minutes and attempts it at most three times, for the preliminary reading and for a chunk alike
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes every model call of an extraction, the preliminary reading included, through a client bounded to five minutes and two retries
  why: 'Only the model-call-bounds test proves this: it lets the call hang and checks it is aborted within five minutes. The preliminary-reading test only checks the timeout option handed to a mocked SDK client constructor. It binds that configuration''s shape, not the behavior, and would pass if the option were ignored.'
- criterion: The model call of the preliminary reading is retried at most twice.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
    name: abandons a model call that never answers within five minutes and attempts it at most three times, for the preliminary reading and for a chunk alike
  - file: src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
    name: calls the context model exactly three times for one preliminary reading when it answers a retryable error on every attempt
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes every model call of an extraction, the preliminary reading included, through a client bounded to five minutes and two retries
  why: 'Over-assertion: the second bounds test asserts exactly three attempts, so it requires two retries, which is more than "at most twice". A reading that gave up after one retry would satisfy the criterion and fail that test. The preliminary-reading test only checks the maxRetries option handed to a mocked SDK constructor, so it binds configuration shape, not the behavior.'
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
    name: a run whose document context was recorded > reads back with the summary of that context
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context was recorded, whole > reads back the document context with its summary, every entity and its model
- criterion: A run whose document context was recorded reads back with each listed entity's node type.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context was recorded > reads back with the node type of each listed entity
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context lists an entity > reads back an entity with its one node type and all of its names in the recorded order
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context was recorded, whole > reads back the document context with its summary, every entity and its model
- criterion: A run whose document context was recorded reads back with each listed entity's names.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context was recorded, entity names and model > reads back with the names of each listed entity
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context lists an entity > reads back an entity with its one node type and all of its names in the recorded order
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context was recorded, whole > reads back the document context with its summary, every entity and its model
- criterion: A run whose document context was recorded reads back with the model that produced the context.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context was recorded, entity names and model > reads back with the model that produced the context
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run whose document context was recorded, whole > reads back the document context with its summary, every entity and its model
- criterion: A run whose document context status was recorded reads back with that status.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run's document context status > reads back with the status that was recorded
- criterion: A run with no recorded document context reads back holding none.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run's document context status > reads back holding no document context when none was recorded
- criterion: A run with no recorded document context status reads back holding none.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: a run's document context status > reads back holding no document context status when none was recorded
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
  why: 'Over-assertion: both tests assert that every status (single-chunk, too-long, failed, none) survives a retry, not only produced.'
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
  why: On the retried path the test checks the held summary and entity names. The entities' node types are checked only on a run that was not retried (the document-entity-in-extraction test).
- criterion: When a retried run whose document context status is failed is extracted again, a preliminary reading is made.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: makes a preliminary reading when a retried run whose document context status is failed is extracted again
  - file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
    name: leaves the document context status as it was after a retried run holding a document context is extracted again, whichever status it held
  why: 'The second test includes a retried run with status failed that also holds a context. It asserts the status stays failed after extraction, which means no reading was made. That settles a precedence the criteria leave open: this criterion says status failed brings a reading, while the "holding a document context" criterion says no reading.'
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
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries the document context status of the completed run when it holds one
- criterion: The run-extraction answer carries the document context of the completed run when it holds one.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries the whole document context of the completed run when it holds one
- criterion: A read of a run that holds no document context carries none.
  state: covered
  tests:
  - file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
    name: carries no document context for a run that holds none over REST
  - file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries no document context for a run that holds none over MCP
  - file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries no document context for a completed run that holds none
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
  - file: src/__tests__/unit/ingestion/preliminary-reading-status-by-prompt-version.spec.ts
    name: records the same document context status for one chunk, a too-long content, a failed reading and a produced context under v5 and every later prompt version
  why: 'Over-assertion: the status-by-prompt-version test asserts the same statuses under v6 and v10, versions no criterion and no held prompt module names.'
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters makes no preliminary reading.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading of a v5 raw information of 3 chunks whose content is 100001 characters
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading of a content of 3 chunks past 100000 UTF-16 code units though within 100000 code points
  why: 'Over-assertion: the second test pins "characters" to UTF-16 code units (astral content within 100000 code points still counts as too long), which the criterion does not state. Elsewhere the set pins the 200-character tail to code points.'
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters records the document context status too-long.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on a v5 run the status each chunk count, content length and reading outcome calls for, counting the length in UTF-16 code units
  - file: src/__tests__/unit/ingestion/preliminary-reading-status-by-prompt-version.spec.ts
    name: records the same document context status for one chunk, a too-long content, a failed reading and a produced context under v5 and every later prompt version
  why: 'Over-assertion: both tests include an astral case that pins "characters" to UTF-16 code units, which the criterion does not state. The status-by-prompt-version test also binds v6 and v10.'
- criterion: Under v5, an extraction whose content exceeds 100000 characters reads every chunk.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads every chunk of a v5 raw information whose content exceeds 100000 characters, whether it holds 3 chunks or 1
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the chunks of a v5 raw information past 100000 characters in index order
  why: 'Over-assertion: the second test also requires index order, which no criterion here states.'
- criterion: Under v4, an extraction records no document context status.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records no document context and no status under any prompt version before v5
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading and records no document context and no status under v1 to v4 whatever the chunk count and content length
unpaired:
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: Auth — propose-* mirrors share the plugin-level preHandler > returns 401 when the bearer token is missing
  asserts: A propose-fragment request without a bearer token answers HTTP 401.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-attribute (TC-13 / UC-11) > BR-30 closed-domain in-domain literal → 200 ok:true accepted
  asserts: An attribute whose value is in a closed domain answers 200 ok:true with outcome accepted, inserts one attribute, and writes provenance.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-attribute (TC-13 / UC-11) > BR-30 closed-domain out-of-domain literal → 200 ok:false VALIDATION_INVALID_FORMAT with allowed_values
  asserts: An attribute whose value is outside a closed domain answers 200 ok:false with VALIDATION_INVALID_FORMAT, the value, and the sorted allowed values, and inserts no attribute or provenance.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-attribute (TC-13 / UC-11) > returns HTTP 200 with ok:true envelope and outcome=accepted on the happy path
  asserts: A valid attribute proposal answers 200 ok:true with outcome accepted, inserts one attribute, and writes provenance.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-attribute (TC-13 / UC-11) > returns HTTP 422 on Zod parse failure (missing required field)
  asserts: An attribute proposal missing node_id answers 422 and inserts nothing.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-fragment (TC-13 / UC-08) > returns HTTP 200 with ok:false VALIDATION_INVALID_FORMAT envelope when chunk_ids do not belong to the run's source
  asserts: A fragment naming a chunk of another raw information answers 200 ok:false with VALIDATION_INVALID_FORMAT and inserts no fragment.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-fragment (TC-13 / UC-08) > returns HTTP 200 with ok:true envelope when run is running and input is valid
  asserts: A valid fragment proposal on a running run answers 200 ok:true with status proposed and inserts one fragment.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-fragment (TC-13 / UC-08) > returns HTTP 404 RESOURCE_NOT_FOUND when the llm_run id is unknown
  asserts: A fragment proposal on an unknown run answers 404 with RESOURCE_NOT_FOUND.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-link (TC-13 / UC-10) > returns HTTP 200 with ok:true envelope and outcome=accepted on the happy path
  asserts: A valid link proposal answers 200 ok:true with outcome accepted, inserts one link, and writes provenance.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-link (TC-13 / UC-10) > returns HTTP 404 RESOURCE_NOT_FOUND when the llmRunId is unknown
  asserts: A link proposal on an unknown run answers 404 with RESOURCE_NOT_FOUND and inserts no link.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-node (TC-13 / UC-09) > returns HTTP 200 with ok:true envelope and resolution=created_new on the happy path
  asserts: A node proposal on a running run answers 200 ok:true with resolution created_new and inserts one node. The admission stand-in admits every alias.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-node (TC-13 / UC-09) > returns HTTP 409 BUSINESS_RUN_NOT_RUNNING when the run exists but is completed
  asserts: A node proposal on a completed run answers 409 with BUSINESS_RUN_NOT_RUNNING, details naming the current status and run id, and inserts no node.
- test:
    file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
    name: carries no document context status for a run that holds none over REST
  asserts: A v4 run holding neither context nor status reads back over REST with no document_context_status.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > accepts LOCAL_OPERATOR_TOKEN only with explicit NODE_ENV=development
  asserts: With NODE_ENV=development, a 24-character LOCAL_OPERATOR_TOKEN is loaded as given.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > aggregates multiple missing fields in a single error
  asserts: An empty environment raises one EnvValidationError listing DATABASE_URL, NEON_AUTH_URL and ANTHROPIC_API_KEY.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > applies defaults when optional vars are omitted
  asserts: NODE_ENV is "test" and PORT is 3000. Both values are supplied explicitly by the fixture, so the test asserts no default.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > OWNER_TZ (BR-47 v2.9) > InvalidOwnerTimezoneError carries the bad zone string
  asserts: An unknown OWNER_TZ raises InvalidOwnerTimezoneError, which carries the zone in its timezone field and message.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > OWNER_TZ (BR-47 v2.9) > accepts an explicit valid IANA zone (Europe/Lisbon)
  asserts: OWNER_TZ Europe/Lisbon loads as given.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > OWNER_TZ (BR-47 v2.9) > accepts an explicit valid IANA zone (UTC)
  asserts: OWNER_TZ UTC loads as given.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > OWNER_TZ (BR-47 v2.9) > defaults OWNER_TZ to 'America/Sao_Paulo' (BR-47 step 3)
  asserts: Without OWNER_TZ, the environment yields America/Sao_Paulo.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > OWNER_TZ (BR-47 v2.9) > throws InvalidOwnerTimezoneError on an unknown IANA zone (fail-closed)
  asserts: OWNER_TZ Invalid/Zone raises InvalidOwnerTimezoneError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > accepts an override for CHAT_MODEL and CHAT_PROMPT_VERSION
  asserts: CHAT_MODEL and CHAT_PROMPT_VERSION overrides load as given.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > applies spec defaults when no chat env var is set
  asserts: The chat defaults are CHAT_ENABLED true, CHAT_MODEL claude-opus-4-8, CHAT_PROMPT_VERSION v4, MAX_HISTORY_MESSAGES 40, MAX_ITERATIONS 8, TURN_TIMEOUT_MS 90000, TOOL_TIMEOUT_MS 15000 and TOOL_RESULT_MAX_CHARS 8000.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > coerces CHAT_ENABLED='false' to the boolean false (BR-14 kill-switch)
  asserts: CHAT_ENABLED "false" yields the boolean false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > coerces CHAT_ENABLED='true' to the boolean true
  asserts: CHAT_ENABLED "true" yields the boolean true.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > coerces numeric env strings to integers
  asserts: Numeric strings for the history, iteration, timeout and result-size variables yield integers.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > accepts an override for CHAT_UTILITY_MODEL
  asserts: A CHAT_UTILITY_MODEL override loads as given.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > applies the v2 defaults (chat.back.md v2.0.0 §8)
  asserts: The defaults are CHAT_UTILITY_MODEL claude-haiku-4-5, CHAT_RECENT_WINDOW 6, CHAT_SUMMARY_AFTER_TURNS 20, title and summary enabled, and MAX_CONTENT_LENGTH 32768.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > coerces CHAT_INGEST_ENABLED='false' to the boolean false
  asserts: CHAT_INGEST_ENABLED "false" yields false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > coerces CHAT_INGEST_ENABLED='true' to the boolean true
  asserts: CHAT_INGEST_ENABLED "true" yields true.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > coerces CHAT_SUMMARY_ENABLED='false' (BR-33 disable)
  asserts: CHAT_SUMMARY_ENABLED "false" yields false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > coerces CHAT_TITLE_ENABLED='false' (BR-34 disable)
  asserts: CHAT_TITLE_ENABLED "false" yields false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > coerces integer env strings for CHAT_RECENT_WINDOW / CHAT_SUMMARY_AFTER_TURNS / MAX_CONTENT_LENGTH
  asserts: Numeric strings for those three variables yield integers.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > defaults CHAT_INGEST_ENABLED to false (BR-44)
  asserts: Without CHAT_INGEST_ENABLED, the environment yields false.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > chat env vars (chat.back.md §8) > v2 additive chat env vars (TC-02) > preserves legacy MAX_HISTORY_MESSAGES alongside the new MAX_CONTENT_LENGTH
  asserts: The defaults MAX_HISTORY_MESSAGES 40 and MAX_CONTENT_LENGTH 32768 are both present.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > freezes the returned config object
  asserts: The loaded environment object is frozen.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > parses a valid environment
  asserts: A complete environment loads with the given values and the defaults NEON_AUTH_JWKS_TTL_S 600, PG_POOL_MIN 2, PG_POOL_MAX 10 and PG_STATEMENT_TIMEOUT_MS 10000.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > produces a human-readable, multi-line message
  asserts: The validation error message names the configuration as invalid and mentions DATABASE_URL and NEON_AUTH_URL.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > refuses to start when LOCAL_OPERATOR_TOKEN is set but NODE_ENV is absent (default-development is NOT trusted)
  asserts: LOCAL_OPERATOR_TOKEN without an explicit NODE_ENV raises EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > refuses to start when LOCAL_OPERATOR_TOKEN is set with NODE_ENV != development
  asserts: LOCAL_OPERATOR_TOKEN with NODE_ENV production raises EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > rejects a LOCAL_OPERATOR_TOKEN shorter than 16 chars
  asserts: A 5-character LOCAL_OPERATOR_TOKEN raises EnvValidationError even in development.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > rejects an out-of-range PORT
  asserts: PORT 70000 raises EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > rejects an unsupported LOG_LEVEL
  asserts: LOG_LEVEL verbose raises EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > throws EnvValidationError when DATABASE_URL is missing
  asserts: A missing DATABASE_URL raises EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > throws when ANTHROPIC_API_KEY is missing (TC-12 / BR-29)
  asserts: A missing ANTHROPIC_API_KEY raises EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > throws when DATABASE_URL has an unsupported scheme
  asserts: A mysql:// DATABASE_URL raises EnvValidationError.
- test:
    file: src/__tests__/unit/env.spec.ts
    name: loadEnv > throws when NEON_AUTH_URL is missing
  asserts: A missing NEON_AUTH_URL raises EnvValidationError.
- test:
    file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: default prompt version > opens the run under the version an ingest_document call names instead of the default
  asserts: An ingest_document call naming v3 hands v3 as the prompt version to the (mocked) intake.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: a document context > is refused when it lacks a summary
  asserts: The document context schema refuses a context without a summary, with the issue on summary only.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: a document context > is refused when it lacks the model that produced it
  asserts: The document context schema refuses a context without a model, with the issue on model only.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: a document entity > is refused when it carries no names at all
  asserts: The document entity schema refuses an entity without names, with the issue on names.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: a document entity > is refused when it lacks a node type
  asserts: The document entity schema refuses an entity without a node type, with the issue on node_type.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: a document entity > is refused when its names list is empty
  asserts: The document entity schema refuses an entity whose names list is empty, with the issue on names.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: the document context status enumeration the specification declares > holds exactly produced, single-chunk, too-long and failed
  asserts: The status enumeration's options are exactly produced, single-chunk, too-long and failed.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — BR-20: advisory lock acquired BEFORE any node_alias read > the first DB op is the lock-key compose, the second is pg_advisory_xact_lock, the third is the exact-match read'
  asserts: In the logged order of the stub's queries, the advisory lock comes before the exact-match read, and the lock argument contains the node type id and a unit separator. This is an assertion on the order of internal queries.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — BR-20: advisory lock acquired BEFORE any node_alias read > the lock is also acquired before the trigram query in the no-exact-match path'
  asserts: In the logged order of the stub's queries, the advisory lock comes before the trigram query.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — decideFromCandidates (A12, pure) > ambiguous candidates exclude rows below MATCH_FLOOR
  asserts: For similarities 0.7, 0.6 and 0.4, the decision is ambiguous, holding the first two candidates in order.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — decideFromCandidates (A12, pure) > returns ambiguous when one candidate is strong AND a second is in [FLOOR, STRONG)
  asserts: For similarities 0.9 and 0.6, the decision is ambiguous with two candidates.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — decideFromCandidates (A12, pure) > returns ambiguous when only one candidate sits in [FLOOR, STRONG)
  asserts: For a single similarity of 0.7, the decision is ambiguous with one candidate.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — decideFromCandidates (A12, pure) > returns ambiguous when two-or-more candidates are >= MATCH_STRONG
  asserts: For similarities 0.9 and 0.92, the decision is ambiguous with two candidates.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — decideFromCandidates (A12, pure) > returns novel when no candidate is above the floor (including the empty set)
  asserts: No candidates, or one candidate at 0.4, decides novel.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — decideFromCandidates (A12, pure) > returns strong_unique when exactly one candidate is >= MATCH_STRONG and no other is >= MATCH_FLOOR
  asserts: For similarities 0.95 and 0.3, the decision is strong_unique on the first candidate.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — proposeNodeService delegation > ambiguous resolution propagates through proposeNodeService as ok:true with resolution='needs_review'
  asserts: With trigram candidates at 0.9 and 0.6, the service answers ok with needs_review and the new node's id, writes two match-review rows, and inserts the node as needs_review.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — proposeNodeService delegation > created_new resolution propagates as ok:true with resolution='created_new'
  asserts: With no exact or trigram match, the service answers ok with created_new.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — proposeNodeService delegation > matched_existing (exact) resolution propagates as ok:true with resolution='matched_existing'
  asserts: With an exact match, the service answers ok with matched_existing and the existing id, and inserts no node.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 2: trigram strong-unique -> matched_existing (no node insert, no review rows)'
  asserts: A strong unique trigram candidate resolves matched_existing to it, with no node insert and no review rows.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 3: ambiguous (one strong + one in [FLOOR, STRONG)) -> needs_review + 2 review rows'
  asserts: An ambiguous candidate set creates a needs_review node with one review row per candidate, a canonical alias and the one proposed alias.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 3b: ambiguous (two strong candidates) -> needs_review + exactly 2 review rows'
  asserts: Two strong candidates resolve needs_review with exactly two review rows, in candidate order.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 3c: ambiguous with a below-floor third candidate inserts only 2 review rows'
  asserts: A candidate below the floor gets no review row.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 4: novel (no candidate at or above floor) -> created_new with status=''active'''
  asserts: A novel proposal creates an active node whose canonical alias is its name, plus the proposed alias, with no review rows.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'TC-10 — resolveOrCreateNode pipeline branches > branch 4: novel with empty candidate set -> created_new (status=''active'')'
  asserts: With no candidates, resolution is created_new with an active node.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: TC-10 — thresholds (BR-25) > exports MATCH_STRONG = 0.85 and MATCH_FLOOR = 0.55
  asserts: The exported constants equal 0.85 and 0.55.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > declares PROMPT_VERSION 'v4'
  asserts: The v4 module's PROMPT_VERSION constant is "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4 asks the model to resolve a relative date against the document date when present and otherwise against the date portion of received_at
  asserts: The text v4 adds to v3 asks to resolve against document_date when present and otherwise fall back to the date portion of received_at.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4 contains no instruction to state the basis received
  asserts: The text v4 adds names no "received" basis.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4 directive does not hardcode a date
  asserts: The received_at anchor directive holds no literal ISO date.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4 keeps relative-date words verbatim in pt
  asserts: The v4 system prompt contains "hoje", "ontem" and "amanhã" in quotes.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4 keeps the load-bearing content of v1, v2 and v3
  asserts: The v4 system prompt contains five named section headings and the data-not-instructions marker.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4 names no basis for the date taken from the reception fallback
  asserts: The fallback sentence in the text v4 adds does not mention a basis.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4 still asks the model never to invent a date
  asserts: The text v4 adds contains "never invent a date".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4.system extends v3.system verbatim with the received_at-anchor directive
  asserts: The v4 system prompt equals the v3 system prompt, a newline, and the anchor directive.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: extraction v4 prompt > v4.user() surfaces received_at and an unknown document_date in the metadata block
  asserts: 'The first v4 user block shows received_at and "document_date: (unknown)" when there is no date.'
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — the v4 module an extraction is given > %s user message shows the reception time and a real document date, and (unknown) when the source has none
  asserts: For v1, v2 and v3, the user metadata block shows received_at, a real document date, or (unknown) when the source has none.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — the v4 module an extraction is given > asks, in the system prompt it hands out, to resolve a relative date in the chunk against the document date when present and otherwise against the date portion of received_at
  asserts: The registry's v4 system prompt, minus v3, asks to resolve a relative date against document_date, falling back to received_at.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — the v4 module an extraction is given > does not ask, in the system prompt it hands out, to state the basis received for a date taken from the reception fallback
  asserts: The registry's v4 addition is non-empty and names no "received" basis.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — the v4 module an extraction is given > shows the reception time and a real document date in the user message, and (unknown) when the source has none
  asserts: The v4 user metadata block shows received_at, a real document date, or (unknown) when the source has none.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — v4 > differentiates v4 from v3 by appending to the v3 system prompt
  asserts: The v4 system prompt differs from v3's and starts with it.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — v4 > dispatches 'v4' to the v4 module
  asserts: Selecting v4 yields a module whose version is v4.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — v4 > keeps v1, v2 and v3 registered
  asserts: Selecting v1, v2 and v3 yields modules of those versions.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: prompt registry — v4 > registers v4 with v1's MAX_TOKENS
  asserts: The v4 module's MAX_TOKENS equals the v1 module's.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: refuses a prompt version the system does not hold instead of falling back to another one
  asserts: Selecting v99 throws UnknownPromptVersionError.
- test:
    file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: the document context status enumeration > accepts produced, single-chunk, too-long and failed and nothing else
  asserts: Of ten candidate strings, the status schema accepts only produced, single-chunk, too-long and failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the one chunk of a v5 raw information of 1 chunk
  asserts: A v5 extraction over one chunk of short content sends that chunk to the model.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the model call of the preliminary reading times out
  asserts: When the reading's model call throws APIConnectionTimeoutError, the run records the status failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the preliminary reading answers text that is not a document context
  asserts: When the reading answers plain text that does not parse as a document context, the run records the status failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows every chunk the source's type, document date, title and reception time on a v5 run that skipped its preliminary reading
  asserts: On a one-chunk v5 run and on a too-long three-chunk v5 run, every model call shows the source type, document date, title and reception time.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows the second chunk of a v5 run past 100000 characters the last 200 Unicode code points of the first chunk when they are astral
  asserts: On a too-long v5 run holding no context, the second chunk's prompt shows exactly the last 200 astral code points of the first chunk and not the 201st.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows the second chunk of a v5 run past 100000 characters the last 200 characters of the first chunk and no more
  asserts: On a too-long v5 run holding no context, the second chunk's prompt shows exactly the last 200 characters of the first chunk and not the 201st.
- test:
    file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
    name: leaves the document context status as it was when a retried run under a later prompt version holding a document context is extracted with no preliminary reading
  asserts: A failed run under prompt version v6, mocked to use the v5 module, holds a context and the status single-chunk. After it is retried and extracted, the status is still single-chunk.
- test:
    file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
    name: carries no document context status for a completed run that holds none
  asserts: The extraction answer of a v4 run holding neither context nor status carries no document_context_status.
- test:
    file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries no document context status for a run that holds none over MCP
  asserts: The get_ingestion_status answer for a v4 run holding neither context nor status carries no document_context_status.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: 'searchKnowledgeService: a node matched by both node-layer routes > scores a knowledge node matched both exactly and approximately with its exact-match score'
  asserts: A node returned by both routes is scored with the exact route's score (0.63), not the approximate one (0.72).
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService expansion: decayed score of a link reached through its target end > scores a link whose target is the matched node at 0.5 times its score at hop 1, and the link beyond it walked the same way at 0.25 times at hop 2'
  asserts: Links walked from their target end score 0.4 and 0.2 from a matched node scored 0.8.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService expansion: decayed score of a link reached through its target end > scores the link after a change of walking direction at 0.25 times the matched node''s score at hop 2: %s'
  asserts: When the walk changes direction, the hop-2 link scores 0.2 from a matched node scored 0.8.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService expansion: decayed score of an expanded link > %s'
  asserts: Links at hops 1, 2 and 3 from a matched node scored 0.8 score 0.4, 0.2 and 0.1.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService expansion: decayed score of an expanded link > scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is'
  asserts: Two chains from matched nodes scored 0.8 and 0.4 score 0.4, 0.2, 0.1 and 0.2, 0.1, 0.05.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService expansion: the item''s hop > numbers an expanded link by the links on its path from the matched node, so a link touching the matched node is hop 1 in either direction'
  asserts: Expanded links carry hops 1, 1, 2 and 3 by path length, whatever their direction.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService expansion: the search item''s shape > answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment'
  asserts: Each of a node, a link and a fragment item has those fields, with at least one provenance entry.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService: a matched node no fragment supports > answers no item with an empty provenance'
  asserts: A matched node with no supporting fragment does not appear as an item with empty provenance.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService: the flags of a search item > answers a link whose confidence is in the uncertain band with the uncertain flag and no other'
  asserts: A link with status uncertain and confidence 0.6 carries exactly the flag uncertain.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'searchKnowledgeService: the provenance entries of a search item > names, in every entry of a node, a link and a fragment item, only fragments that support that very item'
  asserts: Every provenance entry of each item names a fragment that supports that same item.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: approximately matched knowledge nodes > ranks an approximately matched knowledge node after an information fragment and a knowledge link that were not reached only through approximate matches'
  asserts: An approximately matched node scored 0.8 ranks after a fragment scored 0.5 and a link reached from an exactly matched node.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: 'searchKnowledgeService ranking: the search item''s attributes > answers a node, a link and a fragment item with no attribute the search item does not declare'
  asserts: No item carries a key outside kind, layer, id, score, hop, summary, flags, provenance, match and similarity.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/aliases-fuzzy-context-3
reconciliation: siegard-reconcile/aliases-fuzzy-context-3.md
findings:
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: the file-header comment, lines 3-17 (the acceptance-criteria list)
  evidence: '"//   - "POST /llm-runs/:id/propose-node returns 409 BUSINESS_RUN_NOT_RUNNING when run exists but is completed" //   - "POST /llm-runs/:id/propose-link returns 404 RESOURCE_NOT_FOUND when llmRunId is unknown" //   - "POST /llm-runs/:id/propose-attribute returns 422 on Zod parse failure (malformed body / missing required field)""'
  cost: The comment restates the ingestion contract's refusals (409 BUSINESS_RUN_NOT_RUNNING, 404 RESOURCE_NOT_FOUND, 422 over REST) as a second written home. The it() blocks of this file already assert the same codes and statuses in code. If the contract moves, this prose is not reached and keeps stating the old answer.
  correction: Remove the header comment through the comment route, then run /reconcile over the file. The behavior is already asserted by the it() blocks and the contract already holds the fact.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: the "Note on the envelope semantics" comment, lines 24-28
  evidence: '"// Note on the envelope semantics (BR-28 / SD-1 in delivery): any // `ValidationFailure` raised by the propose-* service surfaces as HTTP 200 // with `{ ok: false, error: ... }`. ZodErrors at the route boundary continue // to surface as HTTP 422 via the global error handler"'
  cost: 'The comment states, in prose, the split the contract holds between a 200 with `{ ok: false, error }` and a 422 over REST. The assertions `expect(res.statusCode).toBe(200)` with `expect(body.ok).toBe(false)` and `expect(res.statusCode).toBe(422)` in this file carry the same fact in code. A reader who trusts the comment looks for the rule in the test file and not in the specification.'
  correction: Remove the comment through the comment route, then run /reconcile over the file. The assertions stay.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: the comment inside the out-of-domain test of propose-fragment, lines 536-541
  evidence: '"// the original criterion referenced // "text > 1000 chars" as the trigger; Zod''s max(1000) intercepts that // before the service runs (it surfaces as HTTP 422 via the global handler"'
  cost: The 1000-character limit on a fragment's text is stated in a comment of a test that never exercises it. The limit is held by the node fragment-text-length. The candidate index binds that node to src/modules/ingestion/mcp/mcp-schemas.ts, which I did not read because it is outside the file set. If the limit moves, this comment keeps stating 1000.
  correction: Remove the comment through the comment route, then run /reconcile over the file.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: the TC-06 block comment, lines 795-806, and the comment above the allowed_values assertion, line 879
  evidence: '"//   - out-of-domain     → 200 ok:false VALIDATION_INVALID_FORMAT envelope with ... //                          details = { value, allowed_values }; NO inserts" and "// allowed_values is lexicographically sorted per TC-02/TC-03 contract."'
  cost: The comments restate the contract's answer for a value outside a closed domain (VALIDATION_INVALID_FORMAT, details value and allowed_values in sorted order, HTTP 200 over REST). The assertions on `body.error?.details.value` and `toEqual(["Apollo","Gemini","Mercury"])` already hold the same fact in code in this file. The comments are a second written home, and "TC-02/TC-03 contract" points to a source that is not a node.
  correction: Remove both comments through the comment route, then run /reconcile over the file.
- pass: conformance
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: getRunAnswer (lines 57-87) and the five assertions at lines 92, 101, 111, 117 and 123, which read fields from the root of the REST body
  evidence: '`return res.json() as Record<string, unknown>;` and then `expect(body.document_context_status).toBe("too-long");`, `expect(body.document_context).toEqual(DOCUMENT_CONTEXT);`'
  cost: 'The read-llm-run answer in contracts/knowledge-base/ingestion is stated as "`{ ok: true, result }` carrying the run''s identity, ... its document context status and document context when it holds them". This test fixes the run fields at the root of the REST body, with no `result` level. A reader who goes to the contract for the shape of this answer finds an envelope the test never reads through. The two assertions that read `body.document_context ?? null` and `body.document_context_status ?? null` would also pass against an enveloped answer, because the root field would be absent. If the answer is enveloped, the two positive assertions fail and the two absence assertions go on passing, so those two would no longer show that anything was checked.'
  correction: Either the contract's accepted answer for read-llm-run is settled to say whether REST carries the run at the root or inside `result`, or the test reads the body as the contract states it. The route's behaviour is not in this file set and was not judged.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: line 28, in the test "parses a valid environment"
  evidence: expect(env.NEON_AUTH_JWKS_TTL_S).toBe(600);
  cost: The 600-second life of the cached signing-key set is a value the test pins as the expected default. No node in the specification states it. The next reader will look for it in the specification and find nothing, so the test and the loader become the place where this decision lives.
  correction: An analysis would need to give this default a node. The constraints under specification/constraints/ that cover authentication, such as every-operation-requires-owner-authentication, are the likely home.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: lines 29-30, in the test "parses a valid environment"
  evidence: "expect(env.PG_POOL_MIN).toBe(2);\n    expect(env.PG_POOL_MAX).toBe(10);"
  cost: The minimum of 2 and maximum of 10 store connections are values the test pins as the expected defaults. A search of the specification root for "pool" finds no node holding them. They live only in code and test, where a reader who looks in the specification will not find them.
  correction: An analysis would need to give these defaults a node.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: line 31, in the test "parses a valid environment"
  evidence: expect(env.PG_STATEMENT_TIMEOUT_MS).toBe(10_000);
  cost: The 10 000 ms store-statement limit is a value the test pins. The constraint that an operation whose statement times out answers that a backing service is unavailable names the behaviour but gives no duration. The value therefore lives only in code and test.
  correction: An analysis would need to give the statement time limit a node, or add it to the node that governs the time-out answer.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: lines 46-51, in the test "throws EnvValidationError when DATABASE_URL is missing"
  evidence: "it(\"throws EnvValidationError when DATABASE_URL is missing\", () => {\n    // TC-01: missing required var crashes with a clear message.\n    const { DATABASE_URL: _unused, ...rest } = baseEnv;\n    void _unused;\n    expect(() => loadEnv(rest)).toThrowError(EnvValidationError);"
  cost: The test states that the system refuses to start without a store connection string. Only the Anthropic key has such a startup constraint (anthropic-key-required), and the owner-time-zone and local-operator-token constraints cover those settings. No node holds this refusal, so it exists only as a test and a loader branch.
  correction: An analysis would need to add a startup constraint for the store connection string, next to anthropic-key-required.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: lines 53-58, in the test "throws when DATABASE_URL has an unsupported scheme"
  evidence: "expect(() => loadEnv({ ...baseEnv, DATABASE_URL: \"mysql://host/db\" })).toThrowError(\n      EnvValidationError\n    );"
  cost: The test states a refusal rule, namely that the connection string must use a postgres or postgresql scheme. A search of the specification found no node holding it, so the format guard is decided only in code and test.
  correction: An analysis would need to give the connection-string format a node, together with the missing-value refusal above.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: lines 60-64, in the test "throws when NEON_AUTH_URL is missing"
  evidence: "it(\"throws when NEON_AUTH_URL is missing\", () => {\n    const { NEON_AUTH_URL: _unused, ...rest } = baseEnv;\n    void _unused;\n    expect(() => loadEnv(rest)).toThrowError(EnvValidationError);"
  cost: The test states that the system does not start without the auth provider address. No node holds this startup refusal, so only code and test decide it.
  correction: An analysis would need to add a startup constraint for the auth provider address.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: lines 101-107, in the test "produces a human-readable, multi-line message"
  evidence: expect(err.message).toMatch(/Invalid backend environment configuration/);
  cost: The text the system prints at a failed start is pinned here as an assertion. No node holds this message or the rule that it names every failing variable. An operator or test relying on the wording has nowhere in the specification to check it.
  correction: An analysis would need to give the startup refusal message a node, or add it to the startup constraints.
- pass: conformance
  file: src/__tests__/unit/env.spec.ts
  where: line 211, in the test "applies the v2 defaults (chat.back.md v2.0.0 §8)"
  evidence: expect(env.CHAT_SUMMARY_AFTER_TURNS).toBe(20);
  cost: The default of 20 turns before a rolling summary starts is pinned as a business value. No node states it. rules/chat/rolling-summary-refold-when-older-messages gives the trigger as owner-written messages older than the recent window, with no turn count. The value lives only in code and test.
  correction: An analysis would need to give the turn threshold a node, or reconcile it with the node that sets the refold trigger.
- pass: conformance
  file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  where: the test "is refused when its names list is empty", in the describe "a document entity" (lines 67-73)
  evidence: "it(\"is refused when its names list is empty\", () => {\n    const withEmptyNames = { node_type: \"Person\", names: [] };\n\n    const refused = refusedFields(DocumentEntitySchema, withEmptyNames);\n\n    expect(refused).toEqual([\"names\"]);"
  cost: 'The test decides that an empty names list is refused, as a minimum of one name. The node document-entity declares names only as `required: true` and `many: true` and sets no minimum. The next reader who asks whether an entity may list no names looks in the node, finds no answer, and finds the answer only in this test and in the DTO''s `.min(1)`.'
  correction: The specification would have to state whether a document entity must list at least one name, in domain/knowledge-base/document-entity or in a rule constraining it. This file cannot close that on its own.
- pass: conformance
  file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
  where: MALFORMED_ENTITIES (lines 33-37), EXPECTED.refusedWithNothingRecorded (lines 46-50), and the test title at line 107
  evidence: '"an entity whose names list is empty": null, "an entity with no names": null, "an entity with no node type": null, and the title "records no context for an entity with no names, an empty names list or no node type"'
  cost: The test asserts that one malformed entity in a preliminary reading leaves the run with no document context at all. That is the whole reading and its other valid entities, not only the malformed one. Nothing in the specification says so. domain/knowledge-base/document-entity makes names required, and its log gives only the reason that an entity with no name gives the model nothing to recognise. rules/knowledge-base/document-context-entity-type-in-catalog drops only the offending entity for an unknown node type and keeps the context. A reader choosing between dropping the entity and discarding the context finds no node that decides it, and this assertion is the only place the choice is written down.
  correction: 'The analysis would have to decide, in a node, what an extraction records when a preliminary reading lists an entity that breaks the document-entity shape: whether the context is absent or the entity is dropped. It would also have to say which document context status the run then records.'
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: header comment, lines 3-9, the list of the four decision branches
  evidence: '// Verifies `resolveOrCreateNode(client, args)` and the wired delegation from // `proposeNodeService`. Covers all four decision branches: // //   1. exact-match              -> matched_existing'
  cost: A comment restates the exact-alias resolution rule next to the test. The file is not bound to rules/knowledge-base/exact-alias-resolves, so when that node changes nothing points a reader at this prose, and it can go on saying a rule the node no longer holds. Code holds the same fact in src/modules/ingestion/service/entity-resolution.service.ts (resolveWithAdmittedAliases, which returns matchExisting when findExactMatch returns a node id).
  correction: Remove the prose. The branch behavior is already carried by the assertions in the `resolveOrCreateNode pipeline branches` tests.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: header comment, lines 15-16, the sentence naming the thresholds
  evidence: //   - thresholds (MATCH_STRONG = 0.85, MATCH_FLOOR = 0.55) live in the //     entity-resolution module only.
  cost: The comment states the 0.85 and 0.55 thresholds, which strong-candidate-resolves and no-candidate-creates-active-node hold. Prose outside behavior is a second home for them. If the nodes move the thresholds, the comment keeps the old numbers and nobody is sent to correct it. Code holds the values in src/modules/ingestion/service/entity-resolution.service.ts (`export const MATCH_STRONG = 0.85;` and `export const MATCH_FLOOR = 0.55;`).
  correction: Remove the prose. The values are held by the nodes and by the constants the comment already names.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: line 267, the comment above the alias assertion in `branch 1`
  evidence: // LLM-supplied alias was attempted (canonical not re-inserted on match).
  cost: A comment restates that a matched node gains only the admitted aliases and never the proposed name. The file is not bound to matched-node-gains-only-aliases, so the prose would outlive a change to that node. Code holds the fact in entity-resolution.service.ts (matchExisting attaches `admission.admittedOtherThanName` and inserts no canonical alias).
  correction: Remove the prose. The `expect(state.aliasRows).toEqual([...])` assertion beneath it already carries the expectation.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: lines 329-330, the comment above the review-rows assertion in `branch 3`
  evidence: // EXACTLY 2 entity_match_review rows — one per candidate at or above // MATCH_FLOOR (BR-25 / TC-10 constraint).
  cost: A comment restates that one entity match review is recorded per candidate at or above the floor. The ambiguous-candidates-need-review node holds that, with its cap of ten, and this file is not bound to it. Code holds it in entity-resolution.service.ts (decideFromCandidates returns `aboveFloor` as the candidates, and insertMatchReviews inserts one row for each).
  correction: Remove the prose. The assertion beneath it already carries the expectation.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: line 335, the comment above the alias assertion in `branch 3`
  evidence: // Canonical alias + 1 LLM-supplied alias for the new node.
  cost: A comment restates that a new node holds its proposed name as its canonical alias and each admitted alias as an alias. The file is not bound to new-node-aliases, so the prose would outlive a change to that node. Code holds the fact in entity-resolution.service.ts (attachCanonicalAndAliases inserts kind 'canonical' and then each admitted alias with kind 'alias').
  correction: Remove the prose. The `expect(state.aliasRows).toEqual([...])` assertion beneath it already carries the expectation.
- pass: conformance
  file: src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
  where: the second test, lines 215-223, together with overloadedFetch (lines 144-156), which answers every attempt with status 529
  evidence: it("calls the context model exactly three times for one preliminary reading when it answers a retryable error on every attempt", async () => { ... expect(readingAttempts).toHaveLength(MAX_ATTEMPTS_OF_ONE_CALL); ... const OVERLOADED_STATUS = 529;
  cost: The test fixes two facts as business facts. A provider answer of overloaded_error (status 529) is a retryable error. A call that keeps meeting one is retried until the retry allowance is used up, so exactly three attempts are made. The constraint only caps retries ("retried at most twice"). It names no retryable error and does not say the cap is always reached. A later reader looking for what is retried will look in the specification and find nothing. The only place this decision lives is this test's assertion, so changing the retry classification would fail the test with no node to say which side was decided.
  correction: Analysis would have to state in constraints/extraction-model-call-bounded, or in a rule beside it, which provider errors a model call retries and that it retries until the cap of two retries. Otherwise the test would have to assert only the cap ("at most three attempts").
- pass: conformance
  file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  where: 'the TRIGRAM_PATTERN constant (line 32), the PROSE_LAYER_STORES table (lines 274-277) and the describe block "searchKnowledgeService: prose layers stay lexical" (lines 279-288)'
  evidence: "const TRIGRAM_PATTERN = /similarity|<%|%>|\\s%\\s/; ... describe(\"searchKnowledgeService: prose layers stay lexical\", () => {\n  it.each(PROSE_LAYER_STORES)(\n    \"answers no %s-layer item for text that only a trigram match could reach\",\n    ... expect(body.items.filter((item) => item.layer === layer)).toEqual([]);"
  cost: 'The test fixes a business decision: the fragment and chunk layers never match by trigram similarity, and only the node layer does. The nodes in the pack do not state it. prose-matching says only "Portuguese stemming and without regard to accents". node-layer-approximate-match and node-match confine trigram similarity to node aliases, but none of them says the prose layers exclude it. The only place that says "The fragment and chunk layers stay full-text only" is the "why" line of the decision log beside rules/knowledge-base/link-and-fragment-items-carry-no-match. That is a log, not a node. A reader who looks in the specification for what the prose layers match on finds no exclusion. If someone later adds fuzzy matching to those layers, nothing in the specification fails; only this test, which a person may edit, does.'
  correction: 'The analysis would need to give the fact a node: the fragment layer and the chunk layer match query text only through the full-text parse, never through trigram similarity. prose-matching could carry it, or a sibling rule could. Until then the test is the only home of the exclusion.'
- pass: conformance
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  where: the constant DECLARED_ITEM_KEYS (lines 500-511) and the test "answers a node, a link and a fragment item with no attribute the search item does not declare" (lines 513-544)
  evidence: "const DECLARED_ITEM_KEYS = [\n  \"kind\",\n  \"layer\",\n  \"id\",\n  \"score\",\n  \"hop\",\n  \"summary\",\n  \"flags\",\n  \"provenance\",\n  \"match\",\n  \"similarity\",\n]; (the node domain/knowledge-base/search-item declares the attributes kind, layer, score, hop, summary, flags, match and similarity, plus the relationship role provenance, and no attribute id)"
  cost: This file holds the search item's attribute vocabulary a second time, as the list its test treats as the authority on what the item "declares". It differs from the node by `id`, an attribute the node does not hold. When the node moves, the test keeps judging items against its own copy, because nothing ties the file to the node. The reader cannot tell whether the list or the node records what was decided.
  correction: Where the item's identifier is a fact of the business, the search-item node has to hold it. The test would then compare against what the bind to that node claims and keep no list of its own. Giving the node an `id` attribute is the analysis's act, not this file's.
- pass: conformance
  file: src/app.ts
  where: line 55, the constant BODY_LIMIT_BYTES, passed as bodyLimit to Fastify() at line 59
  evidence: 'const BODY_LIMIT_BYTES = 11 * 1024 * 1024; ... bodyLimit: BODY_LIMIT_BYTES,'
  cost: The 11 MiB ceiling is applied app-wide here, and the same figure is declared again as POST_INGEST_BODY_LIMIT in src/modules/ingestion/routes/ingestion.routes.ts. The node constraints/request-body-ceiling is bound only to the routes file. If the node's figure changes, --check does not reach this file, and the two copies can drift without anyone knowing which one was decided.
  correction: The node is bound to the routes file only. A bind that also claims this file would make the declaration here a held home, since code never reads the specification. Alternatively the fact is held once, in one bound file.
- pass: conformance
  file: src/app.ts
  where: lines 64-71, the CORS default origins and allowed methods
  evidence: "const corsOrigins = env.CORS_ORIGINS ?? [\n    \"http://localhost:5173\",\n    \"http://127.0.0.1:5173\",\n  ];\n... methods: [\"GET\", \"POST\", \"PUT\", \"PATCH\", \"DELETE\", \"OPTIONS\"],"
  cost: Which browser origins may call the BFF when nothing is configured, and which HTTP methods cross origins, is a rule the code decides and no node holds (a search of the specification for CORS and for 5173 found nothing). The next reader looks for it in the specification and finds nothing. The default origin port is 5173, which the project's CLAUDE.md names as another project's port, so the decision is visible only in this file.
  correction: 'An analysis would have to give the cross-origin policy a node. Candidate home: contracts/knowledge-base/access, which already holds the answers every request receives.'
- pass: conformance
  file: src/app.ts
  where: lines 82-85, the /_self route inside the authenticated scope
  evidence: "scoped.get(\"/_self\", async (request) => ({\n      ok: true,\n      result: { user_id: request.user?.id ?? null },\n    }));"
  cost: An authenticated endpoint that answers the owner's identity as user_id, with null when absent, is stated by the code and by no node (a search of the specification for _self found nothing). The access contract names authenticate-owner, route-request and read-health only. A client reading the specification will not know this operation exists or what it answers.
  correction: 'An analysis would have to decide whether /_self is an operation and, if so, record it in a contract. Candidate home: contracts/knowledge-base/access.'
- pass: conformance
  file: src/app.ts
  where: lines 108-115, the toolNames list handed to registerIngestMcpTransport
  evidence: "\"ingest_document\",\n        \"ingest_directed\",\n        \"health\",\n        \"get_ingestion_status\",\n        \"list_recent_ingestions\","
  cost: The MCP tool get_ingestion_status is exposed on the ingest endpoint, and no node names it (a search of the specification for ingestion_status found nothing). The ingestion contract names read-llm-run, which it says both REST and MCP carry, but it does not say this tool is that operation. Anyone looking for the MCP surface in the specification cannot tell whether the tool is specified.
  correction: An analysis would have to record the tool in contracts/knowledge-base/ingestion, either as read-llm-run's MCP spelling or as an operation of its own.
- pass: conformance
  file: src/config/env.ts
  where: line 12-13, the CORS_ORIGINS schema default
  evidence: 'CORS_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173")'
  cost: Which origins are allowed when nothing configures them is a decision about who may call the system from a browser. It lives only in this default. The next reader looks for it in the specification, finds only that an answer to an allowed origin carries that origin, and cannot tell which origins those are.
  correction: The analysis would give the default set of allowed origins a node, beside constraints/answers-carry-allowed-origin, which states only how an allowed origin is answered.
- pass: conformance
  file: src/config/env.ts
  where: line 39, the NEON_AUTH_JWKS_TTL_S schema entry
  evidence: 'NEON_AUTH_JWKS_TTL_S: z.coerce.number().int().min(60).default(600)'
  cost: The 600-second default and the 60-second floor for how long the auth provider's key set is kept are thresholds the code applies. A token signed with a rotated key is refused or admitted according to them, and no node states them.
  correction: The analysis would give the key-set lifetime, its default and its minimum, a node. The nearest nodes state only that a key set which cannot be fetched is a refusal.
- pass: conformance
  file: src/config/env.ts
  where: line 50, the INGEST_MODEL schema default
  evidence: 'INGEST_MODEL: z.string().min(1).default("claude-sonnet-4-6")'
  cost: The node holds this default, but this declaration is its only code home in this file and the node is not bound here. When the node moves, --check does not reach this file. If the node's bound file also holds the value, there are two homes and nobody knows which was decided.
  correction: Bind rules/knowledge-base/default-extraction-model to src/config/env.ts so the declaration is the claimed home. Code never reads the specification, and the bind is what closes it.
- pass: conformance
  file: src/config/env.ts
  where: lines 54-57, the CHAT_ENABLED schema default
  evidence: 'CHAT_ENABLED: z.union([z.boolean(), z.enum(["true", "false"])]).transform(...).default(true)'
  cost: The chat-enabled default is held here and the node is not bound to this file. A change to the node does not reach this declaration through --check.
  correction: Bind rules/chat/chat-enabled-by-default to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 58, the CHAT_MODEL schema default
  evidence: 'CHAT_MODEL: z.string().min(1).default("claude-opus-4-8")'
  cost: The node's default model is declared here, in a file the node is not bound to. A change to the node does not reach this value through --check.
  correction: Bind rules/chat/turn-model-default to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 59, the CHAT_UTILITY_MODEL schema default
  evidence: 'CHAT_UTILITY_MODEL: z.string().min(1).default("claude-haiku-4-5")'
  cost: The utility-model default is declared here, in a file the node is not bound to. A change to the node does not reach this value through --check.
  correction: Bind rules/chat/utility-model-default to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 60, the CHAT_PROMPT_VERSION schema default
  evidence: 'CHAT_PROMPT_VERSION: z.string().min(1).default("v4")'
  cost: The default chat prompt version is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/default-chat-prompt-version to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: lines 61-64, the CHAT_INGEST_ENABLED schema default
  evidence: 'CHAT_INGEST_ENABLED: z.union([z.boolean(), z.enum(["true", "false"])]).transform(...).default(false)'
  cost: The directed-ingestion-off default is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/directed-ingestion-disabled-by-default to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 65, the MAX_HISTORY_MESSAGES schema default
  evidence: 'MAX_HISTORY_MESSAGES: z.coerce.number().int().min(1).default(40)'
  cost: A cap of 40 history messages is a threshold in what the assistant is given, and no node states it. The nearest node, rules/chat/model-context-window, bounds the history by the recent window of owner-written messages (6 by default) and states no message-count cap. The next reader looks for the cap in the specification and does not find it.
  correction: The analysis would give the maximum number of history messages a node, or settle that it is not a rule.
- pass: conformance
  file: src/config/env.ts
  where: line 66, the MAX_CONTENT_LENGTH schema default
  evidence: 'MAX_CONTENT_LENGTH: z.coerce.number().int().min(1).default(32_768)'
  cost: The message-content limit is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/message-content-length to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 67, the MAX_ITERATIONS schema default
  evidence: 'MAX_ITERATIONS: z.coerce.number().int().min(1).default(8)'
  cost: The model-call limit is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/turn-model-call-limit to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 68, the TURN_TIMEOUT_MS schema default
  evidence: 'TURN_TIMEOUT_MS: z.coerce.number().int().min(1).default(90_000)'
  cost: The turn-time limit is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/turn-time-limit to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 69, the TOOL_TIMEOUT_MS schema default
  evidence: 'TOOL_TIMEOUT_MS: z.coerce.number().int().min(1).default(15_000)'
  cost: The tool-time limit is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/tool-failure-continues-turn to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 70, the TOOL_RESULT_MAX_CHARS schema default
  evidence: 'TOOL_RESULT_MAX_CHARS: z.coerce.number().int().min(1).default(8000)'
  cost: The tool-result cut limit is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/tool-result-truncated to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 71, the CHAT_RECENT_WINDOW schema default
  evidence: 'CHAT_RECENT_WINDOW: z.coerce.number().int().min(1).default(6)'
  cost: The recent-window size is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/model-context-window to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: line 72, the CHAT_SUMMARY_AFTER_TURNS schema default
  evidence: 'CHAT_SUMMARY_AFTER_TURNS: z.coerce.number().int().min(1).default(20)'
  cost: A threshold of 20 turns after which summarising applies is a rule the code states, and no node holds it. rules/chat/rolling-summary-refresh makes a refold depend on owner-written messages older than the recent window, not on a turn count. The two answer differently for a conversation of fewer than 20 turns, and the reader looking in the specification finds only the first.
  correction: The analysis would give the turn count after which summarising applies a node, or settle that the setting is not a rule and remove it.
- pass: conformance
  file: src/config/env.ts
  where: line 74, the CHAT_SUMMARY_PROMPT_VERSION schema default
  evidence: 'CHAT_SUMMARY_PROMPT_VERSION: z.string().min(1).default("v2")'
  cost: The default summary prompt version is declared here, in a file the node is not bound to. A change to the node does not reach it through --check.
  correction: Bind rules/chat/default-summary-prompt-version to src/config/env.ts.
- pass: conformance
  file: src/config/env.ts
  where: lines 75-82, the CHAT_TITLE_ENABLED and CHAT_SUMMARY_ENABLED schema defaults
  evidence: 'CHAT_TITLE_ENABLED: ....default(true), CHAT_SUMMARY_ENABLED: ....default(true)'
  cost: The distillation-enabled defaults are declared here, in a file the node is not bound to. A change to the node does not reach them through --check.
  correction: Bind rules/chat/distillation-enabled-by-default to src/config/env.ts.
- pass: conformance
  file: src/mcp-stdio.ts
  where: The REDACT_PATHS constant (lines 27-43) and the redact option of buildStderrLogger (lines 53-57).
  evidence: 'const REDACT_PATHS: readonly string[] = [ "content", "text", "value", "*.content", "*.text", "*.value", "req.body.content", ... "req.headers.authorization", "*.req.headers.authorization", "headers.authorization", ]; and redact: { paths: [...REDACT_PATHS], censor: "[REDACTED]", remove: false }. The same constant and the same redact block are in backend/src/config/logger.ts (lines 11-29 and 47-51).'
  cost: The rule of which log fields show as [REDACTED] now lives in code twice, once in each logger factory, and nothing reads one from the other. If the node changes, or one list is edited, the stdio process and the HTTP process log different fields while the specification states only one rule. Nobody can tell which list was decided. A rebind of the node never reaches a copy in a file it is not bound to.
  correction: The redaction rule needs one code home that both logger factories use, and the node needs to be bound to the file that holds it. Code cannot read the specification, so the bind is what closes the second copy.
- pass: conformance
  file: src/mcp-stdio.ts
  where: The buildConfiguredMcpServer call (lines 154-158) and the logger base (lines 48-51).
  evidence: 'serverName: "remember-bff-stdio", serverVersion: "0.1.0", and base: { env: env.NODE_ENV, service: "remember-bff-stdio" }'
  cost: The stdio process names itself "remember-bff-stdio" version "0.1.0" in the MCP handshake and in every log line. No node holds that name or version. The only identity the specification holds is the health report's service "remember-bff". A reader looking for what a client is told about the server will look in the specification and find nothing.
  correction: A node of the MCP transport, or of the local process transport, would need to state the server name and version the stdio entry point announces. I cannot say which node should hold them.
- pass: conformance
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: the registration of the read tool in registerIngestToolset (the mcp.registerTool("ingest", ...) call after the health tool), and its repeat in READ_ONLY_TOOL_NAMES
  evidence: "name: \"get_ingestion_status\", description: IngestToolDescriptions.get_ingestion_status, ... const READ_ONLY_TOOL_NAMES = [\n  \"health\",\n  \"get_ingestion_status\",\n  \"list_recent_ingestions\",\n] as const;"
  cost: The MCP name `get_ingestion_status` is the public name a model calls to read an LLM run, and no node holds it. The ingestion contract's operation is `read-llm-run`, and `domain/knowledge-base/ingest-tool` holds only the four `propose_*` names. A reader who looks in the specification for the tool that reads a run's status will not find it, and the name lives only in this file.
  correction: The analysis would give the MCP name of the run read a node, most likely in contracts/knowledge-base/ingestion beside its read-llm-run operation.
- pass: conformance
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: mapReadError, the ResourceNotFoundError branch
  evidence: "if (err instanceof ResourceNotFoundError) {\n  return {\n    ok: false,\n    error: {\n      code: err.code,\n      message: err.message,\n      details: { entity: err.entity, id: err.entityId },\n    },\n  };\n}"
  cost: The not-found answer of the run read over MCP carries the details keys `entity` and `id`, and the ingestion contract's read-llm-run refusal names only the error code RESOURCE_NOT_FOUND. A caller reading the specification cannot learn what the answer names. The retrieval contract spells the equivalent ("naming the entity and identity") for its own reads, so the same fact is stated in one place and omitted in the other.
  correction: The analysis would extend the read-llm-run not-found refusal in contracts/knowledge-base/ingestion with what the answer names, or decide that the details are not part of the contract.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: StartAsyncIngestionMcpInputSchema, lines 48-79 (the description of the `content` field)
  evidence: 'export const StartAsyncIngestionMcpInputSchema = z.object({ content: z.string()... .describe("The full plain text of the document to ingest. Paste the raw content; the server chunks it, runs structured extraction in the BACKGROUND, and persists the knowledge graph with provenance. No base64/binary.")'
  cost: The file declares the input of a tool that starts an ingestion and returns before it completes, and its description tells the model that extraction runs in the BACKGROUND. The constraint says the ingest toolset offers no such tool. Anyone who reads this file learns of an asynchronous ingestion surface that the specification excludes, and a reader of the specification never learns that the code declares one. I did not open anything outside the file set, so I cannot say whether the schema is registered anywhere. If it is, the description is emitted text that contradicts the constraint. If it is not, it is a dead declaration of the excluded surface.
  correction: The declaration of the asynchronous-ingestion input schema would have to leave this file. If the business wants such a tool, the constraint has to change through analysis first.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: GetIngestionStatusOutputSchema, `attempts` field, line 159
  evidence: 'attempts: z.number().int().positive(),'
  cost: The output schema refuses a run read whose attempts is below 1. The llm-run node types `attempts` as an integer and the retry-counts-attempts rule only adds one on retry. Neither states a floor or the value a run starts with. The floor lives only in this schema, so the next reader looks for it in the specification and does not find it.
  correction: Analysis would have to decide whether an LLM run's attempts is at least 1, and the llm-run node would have to hold that.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: GetIngestionStatusOutputSchema, `idempotency_key` field, line 161
  evidence: 'idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),'
  cost: The idempotency-key node fixes the key as 64 lowercase hexadecimal characters. The candidate index binds that node to src/modules/ingestion/dto/llm-run.dto.ts, not to this file. This pattern is a second declaration of that format in a file the node is not bound to. When the node moves, `--check` never reaches this file, and nobody can tell which declaration was the decided one.
  correction: The key's format would have to be declared once, in the file the node is bound to. This file would have to read it from there, or the bind would have to claim this file as well.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedNodeItemSchema, description of `node_id`, line 230
  evidence: Rejected (VALIDATION_INVALID_FORMAT) if the id does not point to an active node.
  cost: This text is a tool description sent to the model. The contract answers a pinned identity that names no knowledge node with RESOURCE_NOT_FOUND (reason not_found). Only a pinned identity that names a non-active node gets VALIDATION_INVALID_FORMAT (reason inactive). The description gives the second code for both cases, so a caller handling the refusal by the description handles a missing node wrongly.
  correction: The description would have to say that an identity naming no node is reported RESOURCE_NOT_FOUND and that an identity naming a non-active node is reported VALIDATION_INVALID_FORMAT.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedAttributeItemSchema, description of `valid_from`, lines 262-264
  evidence: Optional ISO date when this attribute became valid. Required when the catalog AttributeKey requires it.
  cost: The required-start-available rule says a proposal for a key that requires a validity start MUST state one OR come from a source with a document date or a reception date. A directed ingestion's source always has a reception date. The description tells the model the date is required, which is stricter than the rule. This text is emitted to the model, so it states the rule differently from the node that governs it.
  correction: 'The description would have to say what the rule says: the start may be left out where the source supplies a document date or a reception date.'
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedLinkItemSchema, description of `valid_from`, lines 286-288
  evidence: Optional ISO date when this link became valid. Required when the catalog LinkType requires it.
  cost: Same departure as for the attribute item. The description says "Required" where the rule allows the start to come from the source's document date or reception date.
  correction: 'The description would have to say what the rule says: the start may be left out where the source supplies a document date or a reception date.'
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedMcpInputSchema, description of `source_label`, line 325
  evidence: Carried into the run's `metadata.source_label` for audit; not parsed by the server.
  cost: The node says a directed ingestion records its label in its raw information's metadata. The LLM run in the llm-run node has no metadata attribute. The description, emitted to the model, places the label on the run, so a caller who looks for the label on the run will not find it.
  correction: The description would have to name the raw information's metadata, not the run's.
- pass: conformance
  file: src/modules/ingestion/prompts/preliminary-reading.ts
  where: line 5, the exported constant MAX_TOKENS
  evidence: export const MAX_TOKENS = 4000 as const;
  cost: 'The ceiling on the model''s output for a preliminary reading is a value the code applies and no node holds, and the service passes it on as `max_tokens: MAX_TOKENS`. A reader looking in the specification for what a preliminary reading may ask of the model finds nothing. The nearest node, rules/knowledge-base/extraction-turn-token-ceiling, sets 8000 tokens for an extraction''s turns, which is a different call with a different value. That rule''s log decided the ceiling is "a rule of extraction" because the code is the truth, so the same decision is owed here.'
  correction: The analysis would give the preliminary reading's output ceiling a node (or extend the node that holds the extraction turn ceiling), and the constant would then be bound to it.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: The file header comment, lines 20-23, in the bullet list "Distinct from `runLlmExtraction`".
  evidence: '"// Distinct from `runLlmExtraction`: //   - No `LLMRun` pre-check: the orchestrator OPENS the run as part of //     intake (BR-34 step 2). Failure to open the run is the only `failed` //     terminal outcome; otherwise the run always lands `completed`. //   - No chunk loop, no model dispatch — items are pre-structured."'
  cost: The header says in prose that a directed ingestion opens a run and calls no model. The code holds both facts in the `ingestRaw` call with `DIRECTED_MODEL` and `DIRECTED_PROMPT_VERSION`, and in the absence of any model call. A reader who finds the comment will treat it as the home of the rule and will not look in the specification. If the node moves, the comment keeps the old wording.
  correction: Remove the prose by the comment route, then run /reconcile over the file. The code in this file already carries the fact.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: The header comment, lines 24-25, and the comment above the attribute loop, lines 584-586.
  evidence: '"//   - Forces `confidence = 1.0` and defaults `valid_from_basis = ''stated''` //     when the caller omits it (BR-34 step 4)." and "//     either is missing. `confidence = 1.0`; `valid_from_basis` defaults to //     `''stated''` when omitted by caller (BR-34 Defaults matrix)."'
  cost: 'The default basis is stated in prose twice, citing "BR-34", a rule identity from outside the specification. The code holds the same fact at `valid_from_basis: item.valid_from_basis ?? "stated"`, lines 621 and 701. A reader looking for the default finds the comment first and treats it as a second authority. The comments say nothing of the change hint the node also holds, so they do not even agree with the node''s full statement.'
  correction: Remove both comments by the comment route, then run /reconcile over the file. The code at lines 621-622 and 701-702 holds the fact.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: Line 93, the `IsoDateSchema` message, and the `valid_to` fields of `DirectedAttributeItemSchema` (line 133) and `DirectedLinkItemSchema` (line 144), forwarded at lines 620 and 700.
  evidence: "\"const IsoDateSchema = z\n  .string()\n  .regex(/^\\d{4}-\\d{2}-\\d{2}$/, \"valid_from / valid_to must be ISO YYYY-MM-DD\");\"\n\"valid_to: IsoDateSchema.optional(),\" \"...(item.valid_to !== undefined ? { valid_to: item.valid_to } : {}),\""
  cost: The service lets a directed attribute or link state a validity end and proposes it. The specification states only a validity start for a directed item. The decision log of directed-validity-start-shape records "Only the validity start is stated, because the tool strips any other field before the service reads it." A caller who reaches the service directly can state a validity end that no node holds. The code becomes the only place that capability is decided, and the next reader will not look for it there. The validation message the service emits also names `valid_to` as a shape the specification does not hold.
  correction: Either the analysis gives a validity end of a directed item a node, or the service stops accepting it. This pass does not choose between the two.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: '`DirectedNodeItemSchema` (lines 102-108), the `key` of `DirectedAttributeItemSchema` (line 129) and the `link_type` of `DirectedLinkItemSchema` (line 140).'
  evidence: "\"node_type: z.string().min(1),\n  name: z.string().min(1).max(500),\n  node_id: z.string().uuid().optional(),\n  aliases: z.array(z.string().min(1).max(500)).optional(),\"\n\"key: z.string().min(1),\" \"link_type: z.string().min(1),\""
  cost: The service refuses the whole directed request when a node name or alias runs past 500 characters, when a node type, attribute key or link type is empty, or when a pinned identity is not a UUID. The contract lists six rules that refuse an ingest-directed request, and none of them is any of these. node-name-length applies to a node proposal, not to the directed request. A caller cannot learn from the specification that these values fail the entire request before any item is dispatched. The refusal behavior lives only in the schema.
  correction: The analysis would give the directed request these refusals a place in the ingest-directed answers of the contract, or state that they are refused per item through the proposal rules. This pass does not choose.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: The comment on `metadataPointer`, lines 273-281, and the comment above the metadata merge, lines 336-338.
  evidence: "\"* Non-PII pointer back to the chat row that triggered this directed run\n   * (TC-02 / BR-34). When the chat-agent dispatch invoked the tool the route\n   * supplies `{ conversation_id, message_id }` so the orchestrator can merge\n   * it into the `RawInformation.metadata` jsonb.\"\nand \"// TC-02 / BR-34 — chat-row pointer (non-PII; the verbatim text lives in\n  // `original_input`, not here). Merged in only when the chat dispatch\n  // supplied it; REST / MCP-direct calls emit metadata without these keys.\""
  cost: Two comments restate which metadata a directed ingestion records and when. The code holds it at `intakeMetadata.conversation_id = deps.metadataPointer.conversation_id;` and the lines beside it. A reader may treat the comment as the authority for when the pointer is recorded. The comments cite "TC-02 / BR-34", identities that live outside the specification.
  correction: Remove both comments by the comment route, then run /reconcile over the file. The code at lines 330-342 holds the fact.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: The Zod-failure refusal at the start of `directedIngestionService`, lines 299-314.
  evidence: "\"code: \"VALIDATION_INVALID_FORMAT\",\n    message: \"Input failed Zod parse.\",\""
  cost: The contract answers every ingest-directed request refused for shape with the message "ingest_directed arguments failed validation.". The caller-facing handler `directed-ingest.handler.ts` already emits that wording before the service runs. The service emits a different message when its own parse fails. The text is reachable only when the service is called without the handler, and a reader comparing the two sees two messages for one refusal. The service schema is also a second implementation of the shape rules the handler's schema `IngestDirectedMcpInputSchema` already checks.
  correction: The message the service emits on its own parse failure would have to be the one the contract names, or the service would have to stop re-parsing a payload the handler has already validated. This pass does not choose.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: '`refForAttribute`, lines 914-916, which names an attribute''s report entry.'
  evidence: "\"function refForAttribute(item: DirectedAttributeItem): string {\n  return `${item.node_ref}.${item.key}`;\n}\""
  cost: The contract says only that a link's reference is its source reference, link type and target reference joined by "->", and says nothing of the reference of an attribute entry. The form `<node_ref>.<key>` is decided only in this function, and callers that read the report depend on it. Two attributes of one node and key share this reference with no rule saying which the reference names, and the specification does not hold that either.
  correction: The analysis would give the report reference of an attribute entry a place in the ingest-directed answer of the contract, beside the link form it already states.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: The `fallback` of `readClosedRunSafe`, lines 1035-1039, and its use at lines 1052, 1058 and 1072.
  evidence: "\"const fallback = {\n    started_at: new Date(0).toISOString(),\n    finished_at: new Date(0).toISOString(),\n    attempts: 1,\n  };\"\n\"finished_at:\n      row.finished_at === null\n        ? new Date(0).toISOString()\n        : row.finished_at.toISOString(),\""
  cost: When the closed run cannot be read, or has no finish time, the response reports the run starting and finishing at 1970-01-01T00:00:00.000Z with one attempt. The contract says only that the run is reported completed even where closing it failed. It holds no value for the times or attempts of a run that cannot be read. A caller or an audit reading the response receives an invented timestamp that looks like a real one, and no rule says it is a placeholder.
  correction: The analysis would give the times and attempts a directed run reports when its row cannot be read a place in the ingest-directed answer of the contract, or say they are omitted. This pass does not choose.
- pass: conformance
  file: src/modules/ingestion/service/directed-run.ts
  where: lines 1 and 3, the exported constants DIRECTED_MODEL and DIRECTED_PROMPT_VERSION
  evidence: export const DIRECTED_MODEL = "directed" as const; export const DIRECTED_PROMPT_VERSION = "directed-v1" as const;
  cost: The node rules/knowledge-base/directed-ingestion-run states that a directed ingestion opens an LLM run of model directed and prompt version directed-v1. The trace binds that node to directed-ingestion.service.ts only. The two values are declared in directed-run.ts, which the node is not bound to. directed-ingestion.service.ts and entity-resolution.service.ts import them from here. If the node's values change, trace.py --check does not reach this file, so the declaration can drift from the node unnoticed.
  correction: 'The values agree with the node. What is missing is the bind: the node rules/knowledge-base/directed-ingestion-run would have to be bound to this file as well, because this is where the values are declared. The code cannot read the specification, so a rebind or a trace link closes the finding, not a code change.'
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: SearchResponse interface, the `query` field (line 55)
  evidence: "export interface SearchResponse {\n  readonly query: string;\n  readonly total: number;\n  readonly limit: number;\n  readonly offset: number;\n  readonly items: readonly SearchItem[];\n}"
  cost: 'The search answer is declared to carry the query text back to the caller. The retrieval contract''s `search` answer lists the page of ranked items, their node match and similarity, their supporting fragments and the total before pagination, and does not list the query text. No other node does either: domain/knowledge-base/search-query holds the query as a request value and nothing says it is returned. A client that reads `query` is depending on a decision that lives only in this type, and a reader who checks the specification will not find it.'
  correction: Either the retrieval contract's `search` answer gains the query text, by an analysis that decides it, or the field leaves the response.
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: ProvenanceFragment interface, the `status` union (line 84)
  evidence: 'readonly status: "accepted" | "proposed" | "rejected" | "deleted";'
  cost: 'The node holds five fragment states: proposed, accepted, rejected, superseded and deleted. This file declares four and leaves out `superseded`. The decision log of fragment-status records that this exact omission was already corrected in the node, so the type restates a vocabulary the node rejected. A fragment in `superseded` state would be typed as something it cannot be. fragment-status is not bound to this file, so a change to that enumeration will not reach this union.'
  correction: The union has to carry the five values of the node, `superseded` included. Because the node is not bound to this file, the declaration cannot read it, so the correction is the bind that claims this declaration or a reuse of the type from the file the node is bound to.
- pass: conformance
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: The score expressions of searchFragmentLayer, searchNodeAliasLayer (exact node layer) and searchChunkLayer, lines 43, 76 and 161.
  evidence: '`(ts_rank_cd(f.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score`; `(max(ts_rank_cd(to_tsvector($1::regconfig, na.alias), websearch_to_tsquery($1::regconfig, $2))) * $3::float)::float AS score`; `(ts_rank_cd(rc.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score`'
  cost: The strength of a fragment-layer, exact node-layer or chunk-layer match is the cover-density text rank, and that choice lives only in these queries. No node says what a match's strength is on those layers. layer-weights says only that strength is weighted, and approximate-match-strength defines it for the approximate node layer alone. The next reader looks in the specification for what ranks one match above another and finds no answer. Swapping the rank function would change every search ordering with no node to disagree with.
  correction: Give the strength of a match on the fragment, exact node and chunk layers a node. rules/knowledge-base/layer-weights is the natural home, or a sibling of approximate-match-strength.
- pass: conformance
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: The ORDER BY ... LIMIT clauses that choose which candidates each layer keeps, in searchFragmentLayer, searchNodeAliasLayer, APPROXIMATE_NODE_ALIAS_SQL and searchChunkLayer, lines 47-48, 83-84, 119-120 and 165-166.
  evidence: '`ORDER BY score DESC, f.created_at DESC, f.id ASC LIMIT $4`; `ORDER BY score DESC, kn.canonical_name ASC, kn.id ASC LIMIT $4`; `ORDER BY score DESC, rc.id ASC LIMIT $4`'
  cost: 'search-layer-candidate-cap says a layer keeps at most 200 candidates before ranking. It does not say which ones survive the cut when more match. This file decides it, with tie-breaks that differ by layer: newest fragment first, canonical name ascending, chunk identifier ascending. The set of kept candidates, and so the search total, depends on a rule no node holds. search-ranking orders the final items and does not govern this cut.'
  correction: State in a node which candidates a layer keeps when it has more than the cap, tie order included. search-layer-candidate-cap is the node that should hold it.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: 'searchKnowledgeService, lines 216-221 and 248-253: the node loop skips a matched node that holds no provenance, and expansion then starts only from the node items that were kept'
  evidence: "if (provenance.length === 0) continue; ... const expanded = await collectExpandedLinks(\n      context,\n      scoreMatchedNodes(items)\n    );"
  cost: The code decides that a matched knowledge node without provenance, which is not shown, also starts no expansion, so the links around it are never reached. A reader of expansion-starts-from-matched-nodes would expect expansion to start from every matched node. matched-node-requires-provenance only says the node does not surface. The decision exists only in this file, where the next reader will not look for it.
  correction: A node would have to say whether a matched node that does not surface still starts expansion. Candidates are rules/knowledge-base/expansion-starts-from-matched-nodes or rules/knowledge-base/matched-node-requires-provenance.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: resolveLayers, lines 469-471
  evidence: "if (layers === undefined || layers.length === 0) {\n    return new Set(ALLOWED_LAYERS);\n  }"
  cost: The code treats a query that names an empty list of layers as one that omitted them, and searches every layer. search-option-defaults only covers an omitted option. Whether an empty list means "no layers" or "all layers" is therefore a rule that lives only in this branch, and a reader of the specification cannot find it.
  correction: search-option-defaults, or another node of search-query, would have to say how a query that names an empty list of layers is read.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: resolveLinkTypeIds, line 486
  evidence: if (names === undefined || names.length === 0) return undefined;
  cost: The code treats an empty list of link types as no restriction, so expansion follows links of every type. expansion-restricted-to-named-link-types speaks only of a query that names link types. What an empty list does is decided here alone, and a reader of the specification cannot find it.
  correction: expansion-restricted-to-named-link-types, or a node of search-query, would have to say what a query that names an empty list of link types follows.
- pass: standard
  file: src/__tests__/integration/ingestion/context-model-wiring.spec.ts
  where: lines 17-37, the two vi.mock calls
  evidence: 'return { ...actual, runLlmExtraction: mocks.runLlmExtraction }; ... return { ...actual, ingestRawInformation: mocks.ingestRawInformation };'
  cost: runLlmExtraction (the extraction orchestrator) and ingestRawInformation (intake) are business logic. Both are replaced by vi.fn() stand-ins, so the test only proves that app wiring forwards CONTEXT_MODEL to a mock. It would still pass if the real orchestrator ignored the model it was given. The boundary the stand-in should cover is the store and the Anthropic client, which the fake pool and anthropicFactory seams elsewhere in this set already provide.
  cites: TST-03
  correction: Run the real runLlmExtraction and ingestRawInformation against a fake pool and a fake model client (the anthropicFactory seam), and assert on the model named in the captured request.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: buildFakeClient, lines 140-322
  evidence: 'function buildFakeClient(store: FakeStore): import("pg").PoolClient {'
  cost: One function of roughly 180 lines holds about twenty SQL-shape branches in a single callback. A reader cannot hold it in mind, and a new query shape gets another branch instead of a helper.
  cites: MNT-01
  correction: Split into per-table responders (the respondTo* pattern the query-retrieval specs already use) and a small dispatcher.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: envFixture, lines 381-395
  evidence: 'const envFixture: Env = Object.freeze({ NODE_ENV: "test", ... ANTHROPIC_API_KEY: "test-anthropic-key", }) as Env;'
  cost: The literal has no CONTEXT_MODEL, INGEST_MODEL, CHAT_* or OWNER_TZ, yet the assertion presents it to buildApp as a complete Env. buildApp reads env.CONTEXT_MODEL, so the app under test receives undefined for fields the type says are present. The compiler no longer checks this, and the fixture drifts silently whenever Env gains a field.
  cites: TYP-02
  correction: Build the env through loadEnv(...) as context-model-wiring.spec.ts does, so the fixture is parsed rather than asserted.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: envFixture, lines 17-27
  evidence: 'const envFixture: Env = Object.freeze({ NODE_ENV: "test", PORT: 3000, ... NEON_AUTH_JWKS_TTL_S: 600, }) as Env;'
  cost: The assertion hides that ANTHROPIC_API_KEY, CONTEXT_MODEL and the chat settings are missing. buildApp receives a partial Env typed as whole, and a new required field is never flagged here.
  cites: TYP-02
  correction: Obtain the env from loadEnv with the minimal variables, so the schema defaults apply and the type is earned.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: getRunAnswer, lines 57-87
  evidence: expect(res.statusCode).toBe(200); return res.json() as Record<string, unknown>;
  cost: Arrange (app and token), act (the request) and an assertion are all folded into a helper. The test bodies then show only a second expect, so a reader cannot see what is claimed about the status code without opening the helper.
  cites: TST-01
  correction: Have the helper return the response, and assert the status in the test body, after the act and before the body assertion.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: buildAuthFixture / signValidJwt, lines 31-55
  evidence: 'const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true, }); ... return new SignJWT({ sub: "user-123" })'
  cost: The JWT fixture is a verbatim copy of the one in propose-routes.spec.ts and search-node-match.spec.ts. A change to how the test token must be signed has to be made in three places.
  cites: MNT-03
  correction: Move the auth fixture to one shared test helper and import it.
- pass: standard
  file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
  where: envFixture, lines 105-115
  evidence: 'const envFixture: Env = Object.freeze({ NODE_ENV: "test", ... NEON_AUTH_JWKS_TTL_S: 600, }) as Env;'
  cost: 'The same partial-env assertion: the app is built with an Env that lacks required keys, and the compiler cannot tell.'
  cites: TYP-02
  correction: Parse the fixture through loadEnv.
- pass: standard
  file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
  where: buildAuthFixture / signValidJwt, lines 124-141
  evidence: 'async function buildAuthFixture(): Promise<AuthFixture> { const { privateKey, publicKey } = await generateKeyPair("RS256", {'
  cost: A third copy of the same JWT fixture, which is two more places to forget when the token requirements change.
  cites: MNT-03
  correction: Import a shared auth fixture helper.
- pass: standard
  file: src/__tests__/unit/env.spec.ts
  where: the file's path, which tests src/config/env.ts
  evidence: import { EnvValidationError, InvalidOwnerTimezoneError, loadEnv } from "../../config/env.js";
  cost: The unit is src/config/env.ts, but the spec sits at unit/env.spec.ts with no config/ segment. A reader looking for the test of a config file does not find it by mirroring the path. The same holds for the specs under unit/ingestion and unit/query-retrieval in this set, which drop the modules/ and layer segments.
  cites: TST-04
  correction: Place it at src/__tests__/unit/config/env.spec.ts.
- pass: standard
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
  where: the model and store scaffolding, lines 151-331 (updateRun, buildPool, streamFor, tick, systemTextOf, blocksOf, indexOfChunk)
  evidence: 'function buildPool(world: World): Pool { const client = { query: async (...args: unknown[]): Promise<QueryResult> => {'
  cost: These helpers are near-verbatim copies of the ones in chunk-prompt-document-context.spec.ts, and several are repeated again in extraction-orchestrator-prompt-v5.spec.ts and document-context-extraction-world.ts. A change to the run-row shape or the stream contract has to be applied in every copy.
  cites: MNT-03
  correction: Extract the shared world (pool, model stream and run row) into one test helper module and import it.
- pass: standard
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  where: NodeProposalSchema, lines 144-147
  evidence: 'const NodeProposalSchema = z.object({ node_id: z.string(), resolution: z.string(), });'
  cost: The test redefines the shape of a propose_node result instead of importing it from the dto directory. If the production result gains or renames a field, the copy keeps parsing and the test proves the copy, not the contract.
  cites: DTO-04
  correction: Declare a schema for the propose_node result under modules/ingestion/dto (the interface there is hand-written, see propose-node.dto.ts) and import that schema in the test.
- pass: standard
  file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  where: runHandlerAndReadOpenedRunBody, lines 62-70
  evidence: 'ingestRaw: ingestRaw as unknown as IngestDocumentDeps["ingestRaw"], runExtraction: runExtraction as unknown as IngestDocumentDeps["runExtraction"],'
  cost: Intake and extraction are business logic and are stubbed out. The test then reads the prompt_version the handler passed to the stub. It never shows that a run is opened under v5 or that v5 is the prompt used, which is the rule being claimed.
  cites: TST-03
  correction: Use a fake pool and fake model client with the real ingestRawInformation and runLlmExtraction, as default-prompt-version-through-intake-and-extraction.spec.ts does, and assert on what the store received.
- pass: standard
  file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
  where: the single test, lines 180-184
  evidence: "const observed = await observeTheContextInExtraction();\n\n  expect(observed).toEqual(EXPECTED);"
  cost: Arrange and act are hidden inside observeRefusal, observeProducedContext and observeUnmentionedEntity. The test body shows neither the readings fed in nor the claim made about each, only a four-part EXPECTED object. When it fails, the reader must open about 100 lines of helpers to see which behaviour broke.
  cites: TST-01
  correction: One test per behaviour, each arranging its reading, running the extraction and asserting in its own body.
- pass: standard
  file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
  where: the single test, lines 107-111
  evidence: "const observed = await observeTheEntityInExtraction();\n\n  expect(observed).toEqual(EXPECTED);"
  cost: 'The same hiding as above: three behaviours (held context carried to every chunk, malformed entities refused, unknown node type dropped) are arranged, run and gathered in helpers, and asserted as one aggregate.'
  cites: TST-01
  correction: Split into one test per behaviour with the arrangement and the act visible in the body.
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  where: answerAdmission, lines 119-144
  evidence: 'admitted: directed || occurs,'
  cost: The store stand-in re-implements the alias admission rule (directed run, or the normalised alias occurring in the source). The tests then assert that service output agrees with the stand-in's copy of the rule. Deleting or changing the admission rule in ALIAS_ADMISSION_SQL would not fail these tests.
  cites: TST-03
  correction: Keep the stand-in to canned rows per scenario, and leave the admission rule itself to a test that runs the real SQL. Or state in the spec that the rule lives in SQL and test it there.
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: buildClient, lines 85-178
  evidence: 'function buildClient(cfg: StubConfig, state: StubState) {'
  cost: A single function of about 95 lines holds seven SQL branches in one callback. It is harder to extend than separate responders, and it is a second near-copy of the FakeStore in entity-resolution-alias-admission.spec.ts.
  cites: MNT-01
  correction: Split into per-statement responders and share them with the alias-admission spec.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
  where: the store and model scaffolding, lines 21-122
  evidence: 'function buildPool(state: RunState): Pool { const client = { query: async (...args: unknown[]): Promise<QueryResult> => {'
  cost: 'END_TURN_MESSAGE, RAW_INFORMATION_ROW, CHUNK_ROW, buildPool and endTurnClient repeat the scaffolding already in extraction-prompt-held-versions.spec.ts and the world helpers. Each copy diverges the next time the run-row shape changes. This copy has already drifted: it has no document_context columns.'
  cites: MNT-03
  correction: Share one run-extraction fixture across the extraction specs.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  where: OTHER_NAMES_CHECKS, lines 142-153
  evidence: '"asks for every other name with each node":'
  cost: The six regular expressions that define "asks for every other name" are copied verbatim from extraction-prompt-v5.spec.ts. Tightening one pattern leaves the other spec checking a different rule.
  cites: MNT-03
  correction: Export the check table from one place and import it in both specs.
- pass: standard
  file: src/__tests__/unit/ingestion/retried-run-world.ts
  where: userTextOf and endTurn, lines 144-169
  evidence: 'function endTurn(text: string): Anthropic.Messages.Message { return { id: "msg_end", type: "message",'
  cost: endTurn and userTextOf are identical to the helpers in document-context-extraction-world.ts. A change to the Message fixture shape, such as a new SDK field, must be made twice.
  cites: MNT-03
  correction: Import them from a single fixture module.
- pass: standard
  file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
  where: vi.mock of the prompts module, lines 11-23
  evidence: 'selectPromptModule: (promptVersion: string) => original.selectPromptModule( promptVersion === LATER_PROMPT_VERSION ? PROMPT_VERSION_WITH_A_MODULE : promptVersion )'
  cost: 'The prompt-version registry is business logic (BR-26: a version with no module fails the run). The test replaces it with a mapping that makes v6 resolve as v5. The claim becomes "a v6 run behaves like v5 under a registry that was told to treat v6 as v5", which says nothing about the real registry, and the test cannot fail if the registry refuses v6.'
  cites: TST-03
  correction: Register a real prompt module for a later version through the registry, or drive the behaviour at the preliminary-reading boundary, rather than rewriting selectPromptModule.
- pass: standard
  file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  where: readStatusAnswer, lines 22-52
  evidence: "const envelope = (await tool.handler({ llm_run_id: RUN_ID })) as Envelope;\n  expect(envelope.ok).toBe(true);\n  return envelope.result ?? {};"
  cost: Arrange, act and an assertion are bundled into the helper, so each test body shows only the second assertion and not the one that gates it.
  cites: TST-01
  correction: Return the envelope and assert ok in the test body.
- pass: standard
  file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
  where: vi.mock calls, lines 48-68
  evidence: 'return { ...actual, runLlmExtraction: mocks.runLlmExtraction }; ... return { ...actual, ingestRawInformation: mocks.ingestRawInformation };'
  cost: The extraction orchestrator and intake are replaced by mocks, so the test only proves that the stdio entry forwards a string to a mock.
  cites: TST-03
  correction: Keep db.js, the SDK transport and the stdio transport as the stand-ins. Run the real orchestrator against a fake model client.
- pass: standard
  file: src/__tests__/unit/mcp-stdio-context-model.spec.ts
  where: the file's path, which tests src/mcp-stdio.ts
  evidence: await import("../../mcp-stdio.js");
  cost: The unit under test is src/mcp-stdio.ts, which would mirror to unit/mcp-stdio.spec.ts. The behaviour-suffixed name does not point back to the file, so a reader looking for coverage of mcp-stdio.ts has to search.
  cites: TST-04
  correction: Rename it to mirror the unit, for example unit/mcp-stdio.spec.ts.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
  where: the fake client, lines 74-205 (result, idsIn, provenanceRow, respond, buildClient, searchFor)
  evidence: 'function buildClient(store: Store): PoolClient { const standIn = { query: async (sql: string, params: unknown[] = []): Promise<Rows> =>'
  cost: The fake pg client is rebuilt in five search-service specs, with copied provenanceRow, result, asIds, emptyCatalog and searchOver. A change to the query shape or the row shape has to be applied in each, and the copies have already diverged (different matching on word_similarity, different known-node rules).
  cites: MNT-03
  correction: Extract one search-service fake (client, row builders, emptyCatalog) into a shared test helper.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: the fake client, lines 65-298, and itemsThatAreNotNodes at lines 607-617
  evidence: 'function itemsThatAreNotNodes(body: SearchResponse): unknown[] { return body.items .filter((item) => item.kind !== "node")'
  cost: Same duplicated scaffolding as the sibling specs, plus itemsThatAreNotNodes copied verbatim into search-service-fragment-link-no-match.spec.ts.
  cites: MNT-03
  correction: Share the fake and the item projection.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-fragment-link-no-match.spec.ts
  where: the fake client, lines 56-255, and itemsThatAreNotNodes at lines 274-284
  evidence: 'function respondToGraph( sql: string, params: readonly unknown[] ): Rows | undefined {'
  cost: A fourth copy of the graph, provenance and search-layer responders already in the expansion and ranking specs.
  cites: MNT-03
  correction: Use the shared search fake.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
  where: the fake client, lines 56-220
  evidence: 'function respondToProvenance( sql: string, params: readonly unknown[] ): Rows | undefined {'
  cost: Another copy of nodeRow, linkRow, linkMetadataRow, provenanceRow and the responders, so ranking-related fixes land in one spec and not the others.
  cites: MNT-03
  correction: Use the shared search fake.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  where: the fake client, lines 61-286
  evidence: 'function buildClient(world: World): PoolClient { const standIn = {'
  cost: The widest of the copies, with fragment support added. Any of the five can drift from the real queries independently.
  cites: MNT-03
  correction: Use the shared search fake, extended for the fragment case.
- pass: standard
  file: src/app.ts
  where: buildApp, lines 52-194
  evidence: 'export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {'
  cost: One function of about 140 lines mixes CORS, auth scoping, five module registrations, three conditional catalog branches, toolset registration and env mapping. Adding a module means another nested if inside the same body.
  cites: MNT-01
  correction: Extract per-concern registration helpers (REST routes, MCP transports, toolsets) and call them from buildApp.
- pass: standard
  file: src/app.ts
  where: line 58
  evidence: 'loggerInstance: logger as unknown as FastifyBaseLogger,'
  cost: The double assertion discards the type relation between pino's Logger and Fastify's logger interface with no guard. If the logger shape stops matching, the failure appears at request time rather than at compile time.
  cites: TYP-02
  correction: Pass the logger in a form Fastify types accept, or narrow it once in a guarded adapter.
- pass: standard
  file: src/app.ts
  where: lines 64-67
  evidence: const corsOrigins = env.CORS_ORIGINS ?? [ "http://localhost:5173", "http://127.0.0.1:5173", ];
  cost: The same default list is already the default of CORS_ORIGINS in env.ts (".default(\"http://localhost:5173,http://127.0.0.1:5173\")"), so this fallback is unreachable duplication. Changing the dev origin requires editing two places, and one of them is dead.
  cites: MNT-03
  correction: Drop the fallback here and rely on the schema default in env.ts.
- pass: standard
  file: src/app.ts
  where: lines 108-115
  evidence: 'toolNames: [ ...INGEST_TOOL_NAMES, "ingest_document", "ingest_directed", "health", "get_ingestion_status", "list_recent_ingestions", ],'
  cost: The ingest toolset's tool-name list is spelled out here, again in ingest-toolset.ts (tools_registered ... + 2 + READ_ONLY_TOOL_NAMES.length) and again in mcp-stdio.ts. Adding a tool means editing three places, and one that is forgotten is registered but not advertised, or the reverse.
  cites: TYP-04
  correction: Export one named constant for the full ingest tool-name list from the ingestion module and use it in all three places.
- pass: standard
  file: src/config/env.ts
  where: lines 54-82, CHAT_ENABLED, CHAT_INGEST_ENABLED, CHAT_TITLE_ENABLED, CHAT_SUMMARY_ENABLED
  evidence: '.union([z.boolean(), z.enum(["true", "false"])]) .transform((v) => (typeof v === "boolean" ? v : v === "true"))'
  cost: The same coercion is written four times. A change to how booleans are read from the environment must be applied in each, and one that is missed parses differently from its siblings.
  cites: MNT-03
  correction: Declare one boolean env schema constant and reuse it with its own default.
- pass: standard
  file: src/config/env.ts
  where: lines 109-113
  evidence: "} catch (err) {\n    throw new InvalidOwnerTimezoneError(parsed.data.OWNER_TZ, err);"
  cost: 'The original error is flattened into the message text ("Underlying cause: ...") and not passed as the cause. The stack of the underlying RangeError is lost, and tooling that follows error.cause finds nothing.'
  cites: COR-01
  correction: Pass the original through super(message, { cause }) in InvalidOwnerTimezoneError.
- pass: standard
  file: src/mcp-stdio.ts
  where: REDACT_PATHS and buildStderrLogger, lines 27-65
  evidence: 'const REDACT_PATHS: readonly string[] = [ "content", "text", "value",'
  cost: The redact list and logger options are a copy of config/logger.ts, differing only in the destination stream and the service name. A path added to the redaction list in one is silently not redacted by the other, which is the one that logs to stderr for the stdio transport.
  cites: MNT-03
  correction: Have config/logger.ts take a destination and service name, and build this logger from it.
- pass: standard
  file: src/mcp-stdio.ts
  where: main, lines 67-194
  evidence: 'async function main(): Promise<void> {'
  cost: One function of about 130 lines holds env loading, pool setup, catalog load, toolset registration, tool resolution, transport connect and shutdown. Each exit branch repeats its own cleanup, so cleanup is easy to miss on a new branch.
  cites: MNT-01
  correction: Extract named steps (boot env, boot db, load catalogs, register toolsets, connect, shutdown).
- pass: standard
  file: src/mcp-stdio.ts
  where: line 91 (also lines 113, 166, 184)
  evidence: 'logger.fatal({ err_message: (err as Error).message }, "db_ping_failed");'
  cost: A caught value is asserted to be an Error with no guard. If something other than an Error is thrown, err_message is logged as undefined and the failure reason is lost exactly when the process is exiting.
  cites: TYP-02
  correction: Narrow with instanceof Error, or use one helper that formats an unknown error.
- pass: standard
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: ListToolCallsResponseSchema, lines 95-101
  evidence: 'export const ListToolCallsResponseSchema = z.object({ total: z.number().int().nonnegative(), limit: z.number().int().positive(), offset: z.number().int().nonnegative(), items: z.array(ToolCallResponseSchema), });'
  cost: A paginated response is declared in this module. The shared PaginatedResponse in src/types/pagination.ts is not imported (that file does not exist in src/types in this tree). The query-retrieval SearchResponse repeats the same shape. When the pagination contract changes, nobody can say which declaration the API promised.
  cites: API-01
  correction: Define PaginatedResponse once in src/types/pagination.ts and have this schema and SearchResponse use it.
- pass: standard
  file: src/modules/ingestion/dto/propose-node.dto.ts
  where: lines 26-39
  evidence: 'export type ProposeNodeResolution = "matched_existing" | "created_new" | "needs_review"; ... export interface ProposeNodeResult { readonly node_id: string; readonly resolution: ProposeNodeResolution; readonly aliases_not_admitted?: readonly AliasNotAdmitted[]; }'
  cost: The result shape of a DTO file is a hand-written interface and union beside the Zod schema, not a schema plus an inferred type. Nothing ties it to a validator, so the wire shape can drift from it unnoticed. The test that needs to parse the result also has to invent its own schema.
  cites: DTO-02
  correction: Declare Zod schemas for the resolution, the not-admitted entry and the result, and export the inferred types.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: line 18
  evidence: export const DEFAULT_INGEST_MODEL = "claude-sonnet-4-6";
  cost: The same model string is the INGEST_MODEL default in config/env.ts. The two defaults must be edited together, and the handler's copy is the one that applies when ingestModel is absent, so a change made only in env.ts does not take effect here.
  cites: TYP-04
  correction: Export a single default-model constant from the config module and use it in both places.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: readRunStatus, lines 47-60
  evidence: "} catch {\n    return undefined;\n  } finally {"
  cost: A failure to read the run status is dropped with no log. The caller reports "unknown" or null, so an operator cannot tell a missing run from a database fault.
  cites: COR-01
  correction: Log the error at warn before returning undefined, or let it propagate to the mapped error path.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: ingestDocumentHandler, lines 75-209
  evidence: export async function ingestDocumentHandler(
  cost: About 135 lines, with three result branches and their log and envelope construction inline. Adding a fourth outcome grows the same function.
  cites: MNT-01
  correction: Extract intake, already-ingested and extraction-failure rendering into named helpers.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: lines 83-90, 118-147 and readRunStatus 47-60
  evidence: "model: input.model ?? deps.ingestModel ?? DEFAULT_INGEST_MODEL,\n  prompt_version: input.prompt_version ?? DEFAULT_PROMPT_VERSION,\n... if (outcome === \"noop_existing\") {"
  cost: The handler chooses defaults for model and prompt version, decides that already-ingested content with a not-completed run is a no-op with a recovery message, and acquires a pool connection to read run status. That is business logic that exists only for the MCP tool. A REST or job path for one-shot ingestion would have to re-derive it.
  cites: ARC-04
  correction: Move the one-shot ingest flow (defaults, no-op decision, status read) into a service and let the handler map input to a call and the result to an envelope.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-document.handler.ts
  where: lines 105-116
  evidence: 'error: pgDown ? { code: "SYSTEM_SERVICE_UNAVAILABLE", message: "A backing service is temporarily unavailable.", } : { code: "SYSTEM_INTERNAL_ERROR", message: "Failed to persist the document before extraction.", },'
  cost: Both intake-failure errors omit details, while the extraction-failure branch of the same handler carries details. A client that reads error.details gets undefined on one branch and an object on the other, so the envelope is not uniform.
  cites: API-05
  correction: Always send details, an empty object where there is nothing to add.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: lines 64-72
  evidence: 'export interface McpEnvelopeJson { readonly ok: boolean; readonly result?: unknown; readonly error?: {'
  cost: The same interface is declared in ingest-document.handler.ts. Two declarations of the envelope can drift, and neither is the one the other tools return.
  cites: MNT-03
  correction: Declare the envelope type once and import it in both files.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: registerIngestToolset, lines 74-302
  evidence: 'export function registerIngestToolset(deps: IngestToolsetDeps): void {'
  cost: A single function of about 230 lines registers nine tools with their handlers inline. The four propose_* registrations repeat the same parse, audit-on-failure and dispatch shape.
  cites: MNT-01
  correction: Extract a registration helper for the propose_* tools and per-tool registration functions.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: lines 231-233
  evidence: "invocation_context as\n        | import(\"./directed-ingest.handler.js\").IngestDirectedInvocationContext\n        | undefined"
  cost: The invocation context arrives as Record<string, unknown> and is asserted to a typed context with no check. A caller that sends a differently shaped context is trusted, and the handler reads fields that may not be there.
  cites: TYP-02
  correction: Parse the invocation context with a Zod schema where it enters the handler.
- pass: standard
  file: src/modules/ingestion/mcp/ingest-toolset.ts
  where: line 351
  evidence: 'input: rawInput as never,'
  cost: '`as never` removes every type check on the input handed to the audit handler. Whatever the handler does with the input is unchecked, and it is passed the raw, unvalidated tool arguments.'
  cites: TYP-02
  correction: Type the audit entry point to accept unknown and record it as such.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: StartAsyncIngestionMcpInputSchema (48-82), GetIngestionStatusSummarySchema and AffectedNodeOutputSchema (133-169), IngestDirected*Schema (184-327)
  evidence: 'export const StartAsyncIngestionMcpInputSchema = z.object({ content: z ... const GetIngestionStatusSummarySchema = z.object({ accepted: z.number().int().nonnegative(),'
  cost: Several schemas are copies of ones that already exist. StartAsync repeats IngestDocumentMcpInputSchema field for field. The status summary and the affected-node output repeat LlmRunSummarySchema and AffectedNodeSchema in llm-run.dto.ts. The IngestDirected* item schemas repeat the Directed* schemas in directed-ingestion.service.ts. A new field in one copy is missing from the others.
  cites: MNT-03
  correction: Reuse the existing schemas (extend or alias them) and give the tool-specific descriptions through .describe on top.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: lines 52 and 88
  evidence: .max(10 * 1024 * 1024, "content must not exceed 10 MiB")
  cost: The content ceiling is spelled twice here and again as 11 * 1024 * 1024 body limits in app.ts and ingestion.routes.ts. The relation between the 10 MiB content limit and the 11 MiB body limit is nowhere stated, so raising one without the other makes the transport reject what the schema allows.
  cites: TYP-04
  correction: Name the content limit and the body limit as constants in one module and derive the body limit from the content limit.
- pass: standard
  file: src/modules/ingestion/repository/llm-run.repository.ts
  where: retryLlmRunRow, lines 183-192
  evidence: "`UPDATE information_fragment\n        SET status = 'rejected'\n      WHERE llm_run_id = $1\n        AND status = 'proposed'\n        AND id NOT IN ("
  cost: The rule that a retry rejects the run's orphaned proposed fragments is decided inside a repository function. The service only calls "reopen the row", so the rule is invisible where retry is read and cannot be reused or tested apart from SQL.
  cites: ARC-04
  correction: Expose a separate repository write for rejecting orphaned fragments and have retryLlmRun in the service call it as a named step.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: lines 60-70
  evidence: const RunLlmExtractionRequestSchema = z.object({}).strict().default({}); ... const RawInformationIdParamSchema = z.object({ ... const LlmRunIdParamSchema = z.object({
  cost: Request schemas are declared in the route file instead of under a dto directory. The next caller (an MCP tool, a test) cannot import them and redeclares the id parameter shape.
  cites: ARC-05
  correction: Move them to the module's dto directory and import them here.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: registerIngestionRoutes, lines 72-387
  evidence: export async function registerIngestionRoutes(
  cost: A function of about 315 lines registers eleven routes with their handlers and error mapping inline, so a change to one route's error mapping means reading the whole body.
  cites: MNT-01
  correction: Split into one registration function per route group.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: lines 108-120 (repeated at 136-148, 161-173, 191-203, 231-240, 305-314)
  evidence: "if (err instanceof ResourceNotFoundError) {\n        return reply.status(404).send({\n          ok: false,\n          error: {\n            code: err.code,\n            message: err.message,\n            details: { entity: err.entity, id: err.entityId },"
  cost: The same not-found envelope is written out six times in this file and once more in handleProposeMirror, as is the 409 run-status envelope. A change to the envelope has to be made in every place, and the global error handler already formats errors.
  cites: MNT-03
  correction: Let ResourceNotFoundError and the run-status errors reach the error middleware, or call one shared mapper.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: the repeated reply.status(404), 409, 502 and 500 calls, for example lines 110, 242, 255 and 268
  evidence: return reply.status(502).send({
  cost: Status codes appear as bare literals in about fifteen places, while the same codes are stored as statusCode on the error classes in the services. The mapping from error to status is spelled out in two layers, and they can disagree.
  cites: TYP-04
  correction: Name the statuses, or take them from the typed errors in one mapper.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: handleProposeMirror, lines 399-406
  evidence: "if (run.status !== \"running\") {\n      throw new RunNotRunningError(llmRunId, run.status);\n    }"
  cost: The rule "propose-* is only valid while the run is running" is decided inside the controller, along with the repository read and the transaction. The MCP propose handlers have to carry their own copy, so the rule exists once per transport.
  cites: ARC-04
  correction: Move the run lookup and status check into a service that the REST mirror and the MCP handlers both call.
- pass: standard
  file: src/modules/ingestion/routes/ingestion.routes.ts
  where: handleProposeMirror, lines 400-403
  evidence: "const run = await findLlmRunById(client, llmRunId);\n    if (run === null) {\n      throw new ResourceNotFoundError(\"llm_run\", llmRunId);\n    }"
  cost: The missing-resource refusal is raised in the route file. The typed error is not raised in a service, so any other caller of the propose flow must repeat the check or receive a null.
  cites: EDG-02
  correction: Raise ResourceNotFoundError from the service that resolves the run.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: import at line 76
  evidence: import { ingestRawInformation } from "./ingestion.service.js";
  cost: A service calls another service for intake, and then opens its own transactions around the call. The transaction boundary of intake is hidden behind two layers, and the dependency is also wired through a test seam (deps.ingestRaw).
  cites: LAY-04
  correction: Move shared intake behaviour into a domain module or inject it from a factory, so neither service imports the other.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 294-299
  evidence: "export async function directedIngestionService(\n  input: unknown,\n  deps: DirectedIngestionDeps\n): Promise<McpEnvelope<DirectedIngestionResult>> {\n  // ---- Step 1 — Zod parse (VALIDATION_INVALID_FORMAT on failure — P2.1) ----\n  const parsed = DirectedIngestionInputSchema.safeParse(input);"
  cost: The service receives unvalidated input and parses it itself. The schema is declared in the service file, not at the boundary, so the REST, MCP and chat entry points that reach it do not share one place that decides what a payload may be. The mcp-schemas copy of the schema can disagree with this one.
  cites: DTO-01
  correction: Validate at the route or tool boundary with a dto-directory schema, and let this function take the typed DirectedIngestionInput.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: directedIngestionService, lines 294-813
  evidence: export async function directedIngestionService(
  cost: One function of about 520 lines runs intake, four dispatch loops, closure, affected-node resolution and response building. The four loops repeat the same report-building and failure-mapping shape.
  cites: MNT-01
  correction: Extract one function per step and a shared item-dispatch helper.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 461, 617 and 697
  evidence: 'confidence: 1.0,'
  cost: '"Directed items count as fully confident" is a rule written as a bare 1.0 in three places, and the fallback timestamp new Date(0) is spelled in three places as well. A change to the directed confidence must be made three times.'
  cites: TYP-04
  correction: Name DIRECTED_CONFIDENCE and an epoch fallback constant.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 470-473
  evidence: envelope as unknown as McpEnvelope<Record<string, unknown>>
  cost: The double assertion forces the typed fragment envelope into a loose record with no guard, so the collector reads fields that the type system no longer vouches for.
  cites: TYP-02
  correction: Make the affected-node collector accept the typed envelope, or narrow with a guard.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: closeRunCompletedSafe, lines 1002-1006
  evidence: "try {\n      await client.query(\"ROLLBACK\");\n    } catch {\n      /* swallow */\n    }"
  cost: An empty catch. If ROLLBACK fails, the connection returns to the pool in an unknown transaction state with no record, and the next user of that connection inherits it.
  cites: COR-01
  correction: Log the rollback failure and release the client with the discard flag, as insertToolCallStandalone does.
- pass: standard
  file: src/modules/ingestion/service/entity-resolution.service.ts
  where: insertNode, line 244
  evidence: return res.rows[0]!.id;
  cost: The non-null assertion has no guard. If the INSERT returns no row, the failure surfaces as a TypeError later, not as the InvariantError the repository functions raise for the same case.
  cites: TYP-02
  correction: Check the row and throw InvariantError, as insertRawInformation does.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: import at line 39
  evidence: import { ResourceNotFoundError } from "./ingestion.service.js";
  cost: This service imports another service only for an error class, so the two are coupled and a cycle becomes possible. The error should be a shared type. llm-run.service and directed-ingestion.service import the same module.
  cites: LAY-04
  correction: Move ResourceNotFoundError to a shared errors module under the domain and import it from there.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: lines 56-112
  evidence: public readonly statusCode = 409; ... public readonly statusCode = 502; ... public readonly statusCode = 500;
  cost: The business errors carry HTTP statuses. RunNotRunnableError, LlmProviderFatalError and ExtractionFatalError embed transport knowledge in the service. A queue or job that uses the service inherits 409/502/500, and the route and the handler also re-map the same errors by hand.
  cites: COR-03
  correction: Drop statusCode from the service errors and map error classes to statuses in the error middleware.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: line 145
  evidence: '}) as unknown as AnthropicLike;'
  cost: The real SDK client is asserted to the local AnthropicLike interface with no check. If the SDK's stream contract changes, the compiler stays quiet and the break appears at runtime in production extraction.
  cites: TYP-02
  correction: Adapt the SDK client explicitly, so the compiler checks the call used.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: lines 163-166
  evidence: "const withChunk = {\n      ...(rawInput as Record<string, unknown>),\n      chunk_ids: [chunkId],\n    };"
  cost: The model-supplied tool input is spread after asserting it is a record. If the model sends a string or array, the spread silently builds a wrong object that only fails at Zod, with a misleading message.
  cites: TYP-02
  correction: Check that the input is an object before the spread, and return the validation envelope otherwise.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runLlmExtraction, lines 297-439
  evidence: "export async function runLlmExtraction(\n  pool: Pool,\n  llmRunId: string,\n  logger: Logger,\n  catalog: CatalogSnapshot,\n  deps: RunExtractionDeps\n): Promise<LlmRunResponse> {"
  cost: About 140 lines with five positional parameters (the limit is three). Callers must remember the order of pool, id, logger, catalog and deps, and the body mixes loading, the chunk loop, closure, affected-node resolution and logging.
  cites: MNT-01
  correction: Take one object parameter, and extract the chunk iteration and the finalisation into named helpers.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: lines 384-401, the catch of runLlmExtraction
  evidence: 'const cause = err instanceof Error ? err.message : String(err); ... throw new ExtractionFatalError(llmRunId, cause, partial);'
  cost: Any uncaught exception message (for example a pg or driver error) becomes the text of ExtractionFatalError. ingestion.routes.ts and ingest-document.handler.ts send err.message to the client verbatim. Internal detail from the store reaches the response, and the provider error message does too via LlmProviderFatalError.
  cites: SEC-04
  correction: Log the cause, and give the client a fixed message with an error code.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runChunkLoop, lines 463-581
  evidence: 'async function runChunkLoop(input: ChunkLoopInput): Promise<ChunkLoopOutcome> {'
  cost: About 120 lines handling stream, logging, stop reasons, tool dispatch and burst accounting. The unused burstReset flag shows how it has grown by accretion.
  cites: MNT-01
  correction: Extract the per-turn call, the stop-reason handling and the tool-result accounting.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: closeRunSafe, lines 682-684
  evidence: "} catch {\n    await client.query(\"ROLLBACK\").catch(() => undefined);\n  } finally {"
  cost: A failure to close the run is dropped with no log, and the ROLLBACK error is dropped too. The run can stay running after the extraction finished (or after it failed), and the caller then reads back a running run as the result with nothing in the log to explain it.
  cites: COR-01
  correction: Log the failure with the run id, and surface it to the caller.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: readFinalRun, lines 701-714
  evidence: "const base: LlmRunResponse = {\n    id: row.id,\n    model: row.model,\n    prompt_version: row.prompt_version,\n    started_at: row.started_at.toISOString(),"
  cost: This is the same row-to-LlmRunResponse mapping as toLlmRunResponse in llm-run.service.ts. A field added to the response must be added in both, and the one forgotten returns a different shape to the caller.
  cites: MNT-03
  correction: Export toLlmRunResponse from a shared module and call it here.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: import at line 20
  evidence: import { ResourceNotFoundError } from "./ingestion.service.js";
  cost: One service imports and re-exports another service's error (export { ResourceNotFoundError };), coupling the two and letting the routes import it through this one.
  cites: LAY-04
  correction: Import the error from a shared errors module.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: lines 31-59
  evidence: public readonly statusCode = 409;
  cost: RunNotRetryableError and RunNotRunningError carry an HTTP status, so a non-HTTP caller of the service has to ignore a transport detail. The routes also map them by hand.
  cites: COR-03
  correction: Remove statusCode and map them in the error middleware.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: getLlmRunById, lines 81-83
  evidence: "} catch {\n        affectedNodes = undefined;\n      }"
  cost: A failure to derive affected nodes is swallowed with no log. The status answer silently omits affected_nodes for a completed run, and nothing tells an operator why.
  cites: COR-01
  correction: Log the failure at warn before omitting the field.
- pass: standard
  file: src/modules/ingestion/service/propose-node.service.ts
  where: import at line 10
  evidence: import { resolveOrCreateNode } from "./entity-resolution.service.js";
  cost: A service calls another service, so the transaction boundary and the advisory lock sit behind two layers and a reader of proposeNodeService cannot see which statements run under one transaction.
  cites: LAY-04
  correction: Move the resolution logic into a domain module (not a service) that both can use, or compose in a factory.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: lines 3-90, the whole file
  evidence: 'export interface SearchResponse { readonly query: string; readonly total: number;'
  cost: 'A .dto.ts file with no Zod schema at all: every response shape is a hand-written interface or union, SourceType is repeated as a union and as a runtime Set, and SearchLayer is declared again alongside search.dto.ts. The compiler cannot show which of these the wire actually satisfies.'
  cites: DTO-02
  correction: Declare Zod schemas and export the inferred types, with SourceType shared with the ingestion dto.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: SearchResponse, lines 54-60
  evidence: 'export interface SearchResponse { readonly query: string; readonly total: number; readonly limit: number; readonly offset: number; readonly items: readonly SearchItem[];'
  cost: A paginated response (total, limit, offset, items) is declared in this module, the same shape as ListToolCallsResponse in the ingestion dto. The shared PaginatedResponse is not used, so the API has two declarations of pagination.
  cites: API-01
  correction: Express it with the shared PaginatedResponse type.
- pass: standard
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: APPROXIMATE_NODE_ALIAS_SQL and searchNodeAliasApproximateLayer, lines 105-136
  evidence: "AND char_length(na.alias_norm) >= $3::int\n       AND word_similarity(na.alias_norm, norm($1::text)) >= $4::real"
  cost: The minimum alias length, the similarity threshold and the layer weighting (max(word_similarity(...)) * $2::float AS score) are decided in the repository. What counts as an approximate match is a retrieval rule, and the service only sees the already-filtered, already-weighted rows. Tuning it means editing SQL and a scoring file under repository/.
  cites: ARC-04
  correction: Have the repository return candidates with their raw similarity, and let the service apply the thresholds and weights.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: imports at lines 4-9
  evidence: "import {\n  TRAVERSAL_DECAY,\n  traverseNodes,\n  type CatalogSnapshot,\n  type TraverseNodesResult,\n} from \"../../knowledge-graph/index.js\";"
  cost: The search service calls traverseNodes, which lives in knowledge-graph/service/traversal.service.ts, so a service in one module calls a service in another. The transaction and logging behaviour of the expansion is hidden behind the barrel import.
  cites: LAY-04
  correction: Expose traversal as a domain function or inject it from a factory.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService, lines 109-292
  evidence: "export async function searchKnowledgeService(\n  client: PoolClient,\n  catalog: CatalogSnapshot,\n  input: SearchServiceInput,\n  logger: Logger\n): Promise<SearchResponse> {"
  cost: About 185 lines with four positional parameters (the limit is three). Layer retrieval, deduplication, three item builders, expansion, sorting and logging are inline, so a change to one layer's items means reading the whole function.
  cites: MNT-01
  correction: Extract the fragment, node and chunk item builders, and pass an options object.
---
## What it is
This review answers all 14 tasks of initiative aliases-fuzzy-context, over the 63 files their implementation and proof records name, and replaces the first review record, which was retired because it did not list the test files written after it.
Its captured run is run/aliases-fuzzy-context-3, which passed every step, so the failures pass had nothing to read.
The conformance pass ran one judge per file and its returns were folded into siegard-reconcile/aliases-fuzzy-context-3.md and bound into the trace.
The certification pass ran one coverage auditor per node a proof claims to demonstrate, 31 in all.

## Notes
The certification pass returned 19 nodes covered and 12 partial with a testable remainder; of the 19 covered, 14 were bound as decided by a test, and 5 (document-context-status, node-match, prompt-version, extraction-prompt-names-relative-date-words, extraction-relative-date-falls-back-to-reception) were not bound because the fold gave them no encoded_at; every remainder is in siegard-reconcile/aliases-fuzzy-context-3.returns.
The first review record, review/aliases-fuzzy-context.md, was retired in commit 12c0643 and stays in git history.
