---
target: backend
title: Review again of the aliases-fuzzy-context delivery
summary: The four passes over the 53 backend files the 11 tasks whose proofs were re-delivered after the first review name, with every finding they returned.
reviewed:
- src/__tests__/integration/ingestion/propose-routes.spec.ts
- src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
- src/__tests__/integration/query-retrieval/search-node-match.spec.ts
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
- src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
- src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
- src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
- src/__tests__/unit/query-retrieval/search-service-fragment-link-no-match.spec.ts
- src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
- src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
- src/modules/ingestion/dto/llm-run.dto.ts
- src/modules/ingestion/dto/preliminary-reading-response.dto.ts
- src/modules/ingestion/dto/propose-node.dto.ts
- src/modules/ingestion/mcp/mcp-schemas.ts
- src/modules/ingestion/prompts/extraction.v5.ts
- src/modules/ingestion/prompts/index.ts
- src/modules/ingestion/prompts/preliminary-reading.ts
- src/modules/ingestion/repository/ingestion.repository.ts
- src/modules/ingestion/repository/llm-run.repository.ts
- src/modules/ingestion/service/directed-ingestion.service.ts
- src/modules/ingestion/service/directed-run.ts
- src/modules/ingestion/service/entity-resolution.service.ts
- src/modules/ingestion/service/extraction.service.ts
- src/modules/ingestion/service/llm-run.service.ts
- src/modules/ingestion/service/preliminary-reading.ts
- src/modules/ingestion/service/propose-node.service.ts
- src/modules/ingestion/service/run-document-context.ts
- src/modules/query-retrieval/dto/response.dto.ts
- src/modules/query-retrieval/repository/search.repository.ts
- src/modules/query-retrieval/service/search.service.ts
tasks:
- task/alias-admission/admit-aliases-from-source
- task/alias-admission/default-prompt-version-v5
- task/alias-admission/prompt-v5-asks-for-other-names
- task/approximate-node-search/rank-approximate-reach-last
- task/approximate-node-search/search-item-shows-match
- task/document-context/chunk-prompt-shows-context
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
  missing: run/prove-aliases-fuzzy-context-2 passed; there was no failure to read
coverage:
- criterion: A node proposal named "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq", in a run whose source says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto", creates a node whose canonical alias is "Conselho Nacional de Desenvolvimento Científico".
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: creates the node with its canonical name and also holds the alias CNPq
- criterion: That created node also holds the alias "CNPq".
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: creates the node with its canonical name and also holds the alias CNPq
- criterion: Outside a directed ingestion, a proposed alias whose normalized form does not occur in the normalized content of the raw information of the run is not recorded on the knowledge node.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: takes the proposal, answers its resolution, records no alias and names the alias as not admitted
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not add to the matched node an alias the source never writes
  why: 'The tests prove only that the service records no alias the store reports as not admitted. The test''s own store stand-in decides whether the alias''s normalized form occurs in the run''s normalized content: answerAdmission computes the normalization and the substring check itself. The admission query the service sends does not make that decision. If that query normalized wrongly or tested occurrence wrongly, the tests would still pass.'
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
  why: The case, accent and whitespace folding that admits these variants is done by the test's stand-in (dbNorm inside answerAdmission), not by the admission query under test. The variants show that the service honours an admission the stand-in grants. They do not show that the real query folds case, accents or inner whitespace. A query that compared unnormalized text would leave every variant passing.
- criterion: A proposed alias that occurs in a chunk other than the one being read is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: records the alias on the node when the source holds it with $label
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not name the alias as not admitted when the source holds it with $label
  why: The "a paragraph other than the first" variant has no chunk being read. The proposal is made against a run whose whole content the stand-in searches. The variant does show that the service resolves admission by run rather than by chunk. Whether the real admission query reads the raw information's whole content, rather than one chunk, is answered by the stand-in and never executed.
- criterion: Within a directed ingestion, a proposed alias that no fragment text holds is not refused as ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: records an alias that the source never writes on the node
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not name an alias that the source never writes as not admitted
  why: Recognising the run as directed is done by the stand-in, which compares the model and prompt-version parameters with the run row. The service's choice of directed markers is exercised. The admission query's own test for a directed run is not. The scenario also has no fragment, so "no fragment text holds" is met only because nothing exists.
- criterion: A node proposal resolved to an existing knowledge node adds each admitted alias to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: adds the admitted alias to the matched node
  - file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 1: exact alias match -> matched_existing (no trigram query, no node insert)'
  why: In entity-resolution.spec.ts this is asserted incidentally, inside a test whose subject is the exact-match branch. Only resolution by exact match is exercised. Resolution by trigram strong-unique match adds no alias in any test.
- criterion: A node proposal resolved to an existing knowledge node does not add its proposed name to that node.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: does not add the proposed name to the matched node
  - file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 1: exact alias match -> matched_existing (no trigram query, no node insert)'
  why: 'Both tests resolve by exact match, where the proposed name already normalizes to an alias the node holds. The case where the name would be a new spelling on the node is unexercised: a proposal resolved by trigram strong-unique match whose name the node does not hold. "branch 2: trigram strong-unique" in entity-resolution.spec.ts asserts no alias rows.'
- criterion: The result of the node-proposal service names each alias it did not admit, with the reason ALIAS_NOT_IN_SOURCE.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: takes the proposal, answers its resolution, records no alias and names the alias as not admitted
  why: Only one non-admitted alias is ever proposed, so "each" is unexercised. A result naming only the first of several would pass. namesNotAdmitted also checks only that the alias string and the reason both appear somewhere in the serialized result. It does not check that the reason is attached to that alias.
- criterion: After "CNPq" is admitted on a node, a later proposal of the same node type named "CNPq" resolves as matched_existing to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
    name: resolves a later proposal named CNPq of the same node type to that node as matched_existing
- criterion: An ingest_document call that names no prompt version opens its LLM run under prompt version v5.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/default-prompt-version-through-intake-and-extraction.spec.ts
    name: opens the run under v5 and runs extraction with the v5 prompt module when an ingest_document call names no prompt version
  - file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: opens the run under v5 when an ingest_document call names no prompt version
  why: The default-prompt-version.spec.ts test reads the argument handed to the injected ingestRaw mock. That binds an internal call, not the opened run. The coverage rests on the through-intake test, which asserts the recorded run row.
- criterion: The prompt registry maps the version v5 to a prompt module.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: resolves exactly v1 to v5 and refuses a version outside them
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: holds exactly the prompt versions v1 to v5, each resolving to a module of its own version
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: fails an extraction under a prompt version the system does not hold without asking the model, and runs every held version under its own prompt
  why: Over-assertion. "resolves exactly v1 to v5 and refuses a version outside them" refuses v6. "holds exactly the prompt versions v1 to v5" compares the refusal message's known-versions list to exactly v1 through v5. Both claim the registry holds no other version, which the criterion does not state. Both break the day a sibling task registers v6.
- criterion: A run under prompt version v5 is extracted without failing as an unknown prompt version.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
    name: completes an extraction run whose prompt version is v5 instead of failing it as an unknown prompt version
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: fails an extraction under a prompt version the system does not hold without asking the model, and runs every held version under its own prompt
  - file: src/__tests__/unit/ingestion/default-prompt-version-through-intake-and-extraction.spec.ts
    name: opens the run under v5 and runs extraction with the v5 prompt module when an ingest_document call names no prompt version
- criterion: The v5 system prompt asks the model to propose, with each node, every other name the text gives the same entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
  why: Over-assertion in the held-versions test. It requires every version held from v5 on to ask for other names, which the criterion states of v5 alone. A later version written otherwise would break it.
- criterion: The v5 system prompt names an acronym, a short name and another spelling as such other names.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
  why: 'Same over-assertion as above: the held-versions test binds every version held from v5 on. The criterion binds only v5.'
- criterion: The v5 system prompt tells the model that a pronoun alone is not another name of the entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
  why: 'Same over-assertion as above: the held-versions test binds every version held from v5 on.'
- criterion: The v5 system prompt tells the model that a role alone is not another name of the entity.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
    name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
  why: 'Same over-assertion as above: the held-versions test binds every version held from v5 on.'
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
  why: Over-assertion in the held-versions test. It binds every version held from v4 on. The criterion states this of v5 alone.
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
  why: Over-assertion. The test also binds the v1 to v3 system prompts and the shared user prompt. It bans the bare words alias, acronym, short name, spelling and pronoun, and their Portuguese equivalents, from all of them. That goes beyond a request for other names. A user-prompt change in a sibling task that merely mentions one of those words would break it.
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
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items of equal score by recording time descending, a fragment counting as recorded at its creation time
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders a knowledge node, counting as never recorded, after a knowledge link and an information fragment of equal score
  - file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
    name: orders links of equal score by recording time descending, then by identifier ascending, and a knowledge node of that score last as never recorded
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
- criterion: Within each group, items of equal score and recording time order by identifier ascending.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items of equal score and equal recording time by identifier ascending
  - file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
    name: orders links of equal score by recording time descending, then by identifier ascending, and a knowledge node of that score last as never recorded
  - file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: orders items reached only through approximate matches last, then by score descending, recording time descending with a fragment at its creation time and a knowledge node as never recorded, then identifier ascending
- criterion: An exactly matched hop-0 knowledge node item carries the match exact.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers an exactly matched node with the match exact and no similarity, and an approximately matched node with the match approximate and the highest word similarity of its aliases, not its weighted score
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
  - file: src/__tests__/unit/query-retrieval/search-repository-approximate-node.spec.ts
    name: selects the similarity as the highest word similarity of the node's aliases to the normalized query, with no layer weight applied
  why: The search-repository-approximate-node.spec.ts test matches a regular expression against the SQL text the repository sends. It binds the shape of the query, not the similarity an item carries, and covers nothing on its own. The coverage rests on the service and integration tests.
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
  why: The store stand-in returns both node hits on the exact route whatever the query. The test shows only that the service passes two exact-route hits through as two node items. Whether "petrobras" actually reaches "Petrobrás Distribuidora" is answered by the stand-in, not exercised. That depends on accent folding and on matching a name that holds more than the query. The accepted information fragments named in the criterion are not modelled.
- criterion: In a search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", both returned knowledge node items carry the match exact.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers the knowledge nodes Petrobras and Petrobrás Distribuidora for petrobras as two node items, each carrying the match exact
  why: The test places both nodes on the exact route by fixture, so "exact" follows from the stand-in. If the real exact route failed to reach "Petrobrás Distribuidora" and only the approximate route did, that node would carry the match approximate. The test would not notice.
- criterion: A knowledge node matched both exactly and approximately carries the match exact.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers a knowledge node matched both exactly and approximately with the match exact
- criterion: The flags of an approximately matched knowledge node item hold no value describing its match.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers an approximately matched node with no flag describing its match
  why: Over-assertion. The test asserts the flags equal an empty list. The criterion excludes only a value describing the match. A flag another task legitimately sets on that node would break it.
- criterion: A knowledge link item reached by expansion carries no match.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers every knowledge link reached by expansion, from an exactly or an approximately matched node, and every information fragment with no match and no similarity
  - file: src/__tests__/unit/query-retrieval/search-service-fragment-link-no-match.spec.ts
    name: answers each knowledge link reached from an exactly or an approximately matched node, and the information fragment that the fragment layer and a supporting chunk both matched, with no match and no similarity
- criterion: For a run holding a document context, each chunk's prompt shows the context's summary.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
  - file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
    name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
  why: The two chunk-prompt tests also bind the reading order and one model call in flight at a time. No criterion of this task states either fact. A change to those would fail these tests while the summary is still shown.
- criterion: For a run holding a document context, each chunk's prompt shows each listed entity with its node type and names.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
    name: shows every chunk each entity of the document context with its node type and all its names, and records no context for an entity with no names, an empty names list or no node type
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
- criterion: For a run holding a document context, each chunk's prompt shows the same source metadata the v4 prompt shows.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
- criterion: For a run holding a document context, each chunk's prompt shows the last 200 characters of the chunk before it.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
    name: reads the chunks of a run holding a document context one at a time in index order, showing each the summary, the entities, the source metadata and the last 200 Unicode code points of the chunk before
  - file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
    name: reads the chunks one at a time in index order even when the store returns them out of order, shows every chunk the source type, document date, title, reception time and the last 200 code points of its index predecessor, and shows the run's context only when the run holds one
  why: The criterion does not say what a "character" is. The tests settle it as a Unicode code point, using an astral-character tail. The tests of the 100000-character limit settle the same word as a UTF-16 code unit. A reader should route the divergence; the audit does not settle it.
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
- criterion: Under v5, an extraction whose run holds no document context, over a raw information of 3 chunks and at most 100000 characters, makes exactly one preliminary reading.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes exactly one preliminary reading for a v5 extraction of 3 chunks holding no document context
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes the preliminary reading of a content of exactly 100000 UTF-16 code units
  - file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
    name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
  why: The boundary test settles "characters" as UTF-16 code units, which the criterion does not state. See the chunk-tail criterion, where the tests count code points instead.
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
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the first 5 lines of a 7-line summary as the document context summary
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: counts an empty line as a line when it cuts a summary to 5 lines
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: lets a carriage return end no line when it cuts a summary to 5 lines
  why: 'The criterion does not say what ends a line. Two tests settle it: an empty line counts as a line, and a carriage return ends no line, which leaves a trailing "\r" in the kept summary. A reader should route that as a reading the criterion does not state.'
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
  why: Over-assertion. The test asserts that nothing at all is written before the first chunk except updates to llm_run. That claim is total, broader than a tool call or the four knowledge records. Any legitimate write a sibling task adds before the first chunk would break it.
- criterion: Before the first chunk is read, the knowledge base holds no knowledge node, information fragment, knowledge link or node attribute read from the raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: proposes nothing and writes nothing but the run's own context columns before its first chunk is read
  why: 'Same over-assertion as above: the test claims there are no writes at all beyond llm_run updates.'
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
  why: The preliminary-reading.spec.ts test reads the timeout and maxRetries options passed to a mocked SDK client constructor. That binds the shape of the client configuration, not the wait. The coverage rests on the model-call-bounds test, which drives a fetch that never answers under fake timers.
- criterion: The model call of the preliminary reading is retried at most twice.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
    name: abandons a model call that never answers within five minutes and attempts it at most three times, for the preliminary reading and for a chunk alike
  - file: src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
    name: calls the context model exactly three times for one preliminary reading when it answers a retryable error on every attempt
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes every model call of an extraction, the preliminary reading included, through a client bounded to five minutes and two retries
  why: '"calls the context model exactly three times" asserts more than the criterion. The criterion bounds retries from above. The test requires exactly two retries, and would fail if the reading retried less. The constructor-options test binds client configuration, not behaviour.'
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
    name: reads back the document context with its summary, every entity and its model
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back an entity with its one node type and all of its names in the recorded order
- criterion: A run whose document context was recorded reads back with each listed entity's names.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back with the names of each listed entity
  - file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: reads back the document context with its summary, every entity and its model
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
  why: On the retried run, showsHeldContext checks the held summary and every entity name, but not the entities' node types. The node types of a held context are asserted per chunk only on a run that was not retried, in document-entity-in-extraction.spec.ts.
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
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries the document context status of a run that holds one over MCP
  why: 'The test calls the registered get_ingestion_status tool handler directly and reads its logical envelope. The answer as served over MCP is unexercised: nothing sends a tools/call through the /api/v1/mcp/ingest transport and reads the rendered content. If the transport dropped the field, the test would still pass.'
- criterion: The read-llm-run answer over MCP carries the document context of a run that holds one.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
    name: carries the whole document context of a run that holds one over MCP
  why: 'Same gap as the status criterion: the handler''s envelope is asserted, but the answer rendered through the MCP transport is never read.'
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
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters makes no preliminary reading.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading of a v5 raw information of 3 chunks whose content is 100001 characters
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: makes no preliminary reading of a content of 3 chunks past 100000 UTF-16 code units though within 100000 code points
  why: The astral-content test settles "characters" as UTF-16 code units, which the criterion does not state. The chunk-tail tests settle the same word as code points.
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters records the document context status too-long.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records on a v5 run the status each chunk count, content length and reading outcome calls for, counting the length in UTF-16 code units
  - file: src/__tests__/unit/ingestion/preliminary-reading-status-by-prompt-version.spec.ts
    name: records the same document context status for one chunk, a too-long content, a failed reading and a produced context under v5 and every later prompt version
  why: Both tests count length in UTF-16 code units, which the criterion's "characters" does not state. The prompt-version test also binds v6 and v10 to the same statuses, beyond the v5 the criterion names.
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
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: BR-30 closed-domain in-domain literal → 200 ok:true accepted
  asserts: A propose-attribute call with an in-domain value of a closed attribute key answers HTTP 200, ok true, outcome accepted, and inserts one attribute with provenance.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: BR-30 closed-domain out-of-domain literal → 200 ok:false VALIDATION_INVALID_FORMAT with allowed_values
  asserts: An out-of-domain value answers HTTP 200, ok false, VALIDATION_INVALID_FORMAT, with the value and the sorted allowed_values in its details. Nothing is inserted.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-attribute (TC-13 / UC-11) > returns HTTP 200 with ok:true envelope and outcome=accepted on the happy path
  asserts: A valid propose-attribute call answers HTTP 200, ok true, outcome accepted, and inserts one attribute with at least one provenance row.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: POST /api/v1/ingest/llm-runs/:id/propose-link (TC-13 / UC-10) > returns HTTP 200 with ok:true envelope and outcome=accepted on the happy path
  asserts: A valid propose-link call answers HTTP 200, ok true, outcome accepted, and inserts one link with at least one provenance row.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns 401 when the bearer token is missing
  asserts: A propose-fragment call without an authorization header answers HTTP 401.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns HTTP 200 with ok:false VALIDATION_INVALID_FORMAT envelope when chunk_ids do not belong to the run's source
  asserts: propose-fragment with a chunk from another raw information answers HTTP 200, ok false, VALIDATION_INVALID_FORMAT, and inserts no fragment.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns HTTP 200 with ok:true envelope and resolution=created_new on the happy path
  asserts: propose-node on a running run answers HTTP 200, ok true, resolution created_new, and inserts one node. The admission stand-in admits every alias.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns HTTP 200 with ok:true envelope when run is running and input is valid
  asserts: A valid propose-fragment call answers HTTP 200, ok true, status proposed, and inserts one fragment.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns HTTP 404 RESOURCE_NOT_FOUND when the llm_run id is unknown
  asserts: propose-fragment on an unknown run answers HTTP 404, ok false, RESOURCE_NOT_FOUND.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns HTTP 404 RESOURCE_NOT_FOUND when the llmRunId is unknown
  asserts: propose-link on an unknown run answers HTTP 404, RESOURCE_NOT_FOUND, and inserts no link.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns HTTP 409 BUSINESS_RUN_NOT_RUNNING when the run exists but is completed
  asserts: propose-node on a completed run answers HTTP 409, BUSINESS_RUN_NOT_RUNNING, with the current status and run id in its details. No node is inserted.
- test:
    file: src/__tests__/integration/ingestion/propose-routes.spec.ts
    name: returns HTTP 422 on Zod parse failure (missing required field)
  asserts: propose-attribute without node_id answers HTTP 422 and inserts no attribute.
- test:
    file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
    name: opens the run under the version an ingest_document call names instead of the default
  asserts: An ingest_document call naming v3 hands prompt_version v3 to the injected intake dependency.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: holds exactly produced, single-chunk, too-long and failed
  asserts: The document context status schema's options are exactly produced, single-chunk, too-long and failed.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: is refused when it carries no names at all
  asserts: The document entity schema refuses an entity without names, on the names path.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: is refused when it lacks a node type
  asserts: The document entity schema refuses an entity without node_type, on the node_type path.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: is refused when it lacks a summary
  asserts: The document context schema refuses a context without summary, on the summary path.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: is refused when it lacks the model that produced it
  asserts: The document context schema refuses a context without model, on the model path.
- test:
    file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
    name: is refused when its names list is empty
  asserts: The document entity schema refuses an entity whose names list is empty, on the names path.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: ambiguous candidates exclude rows below MATCH_FLOOR
  asserts: decideFromCandidates returns ambiguous holding only the candidates at or above 0.55, in input order.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: ambiguous resolution propagates through proposeNodeService as ok:true with resolution='needs_review'
  asserts: proposeNodeService answers ok true with resolution needs_review and the new node id for an ambiguous trigram set. It writes two review rows and a needs_review node.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 2: trigram strong-unique -> matched_existing (no node insert, no review rows)'
  asserts: One candidate at 0.92 with the other below the floor resolves matched_existing to it, with no node insert and no review rows.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 3: ambiguous (one strong + one in [FLOOR, STRONG)) -> needs_review + 2 review rows'
  asserts: Resolves needs_review, inserts a needs_review node and exactly two review rows with their similarities. Writes the canonical name and the alias on the new node.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 3b: ambiguous (two strong candidates) -> needs_review + exactly 2 review rows'
  asserts: Two candidates at or above 0.85 resolve needs_review, with one review row for each in order.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 3c: ambiguous with a below-floor third candidate inserts only 2 review rows'
  asserts: A candidate below 0.55 produces no review row.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 4: novel (no candidate at or above floor) -> created_new with status=''active'''
  asserts: No candidate at or above the floor creates an active node, with no review rows, holding the canonical name and the proposed alias.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: 'branch 4: novel with empty candidate set -> created_new (status=''active'')'
  asserts: An empty candidate set resolves created_new with an active node.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: created_new resolution propagates as ok:true with resolution='created_new'
  asserts: proposeNodeService answers ok true with resolution created_new when no candidate exists.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: exports MATCH_STRONG = 0.85 and MATCH_FLOOR = 0.55
  asserts: The exported thresholds equal the literals 0.85 and 0.55.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: matched_existing (exact) resolution propagates as ok:true with resolution='matched_existing'
  asserts: proposeNodeService answers ok true with resolution matched_existing and the existing node id on an exact match, with no node insert.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: returns ambiguous when one candidate is strong AND a second is in [FLOOR, STRONG)
  asserts: decideFromCandidates returns ambiguous with both candidates.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: returns ambiguous when only one candidate sits in [FLOOR, STRONG)
  asserts: decideFromCandidates returns ambiguous with that single candidate.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: returns ambiguous when two-or-more candidates are >= MATCH_STRONG
  asserts: decideFromCandidates returns ambiguous with both strong candidates.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: returns novel when no candidate is above the floor (including the empty set)
  asserts: decideFromCandidates returns novel for an empty set and for a lone candidate at 0.4.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: returns strong_unique when exactly one candidate is >= MATCH_STRONG and no other is >= MATCH_FLOOR
  asserts: decideFromCandidates returns strong_unique naming the candidate at 0.95.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: the first DB op is the lock-key compose, the second is pg_advisory_xact_lock, the third is the exact-match read
  asserts: The advisory lock is taken before the exact-match read. Its key holds the node type id and a unit separator.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
    name: the lock is also acquired before the trigram query in the no-exact-match path
  asserts: The advisory lock is taken before the trigram candidate read.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: '%s user message shows the reception time and a real document date, and (unknown) when the source has none'
  asserts: For v1, v2 and v3, the user metadata block shows received_at and a given document_date, and shows (unknown) when the document date is absent.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: asks, in the system prompt it hands out, to resolve a relative date in the chunk against the document date when present and otherwise against the date portion of received_at
  asserts: The registry's v4 system prompt, beyond v3's, matches the relative-date-against-document-date- then-received_at pattern.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: declares PROMPT_VERSION 'v4'
  asserts: The v4 module's PROMPT_VERSION equals "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: differentiates v4 from v3 by appending to the v3 system prompt
  asserts: The v4 system prompt differs from v3's and starts with it.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: dispatches 'v4' to the v4 module
  asserts: selectPromptModule("v4") returns a module whose version is v4.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: does not ask, in the system prompt it hands out, to state the basis received for a date taken from the reception fallback
  asserts: The registry's v4 delta over v3 is non-empty and does not name a "received" basis.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: keeps v1, v2 and v3 registered
  asserts: v1, v2 and v3 each resolve to a module of their own version.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: registers v4 with v1's MAX_TOKENS
  asserts: The v4 module's MAX_TOKENS equals v1's.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: shows the reception time and a real document date in the user message, and (unknown) when the source has none
  asserts: The v4 user metadata block shows received_at and a given document_date, and shows (unknown) when the document date is absent.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 asks the model to resolve a relative date against the document date when present and otherwise against the date portion of received_at
  asserts: The v4 delta over v3 matches the document-date-first, then received_at, directive pattern.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 contains no instruction to state the basis received
  asserts: The v4 delta does not name a "received" basis.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 directive does not hardcode a date
  asserts: The received_at-anchor directive contains no YYYY-MM-DD literal.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 keeps relative-date words verbatim in pt
  asserts: The v4 system prompt contains "hoje", "ontem" and "amanhã" in quotes.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 keeps the load-bearing content of v1, v2 and v3
  asserts: The v4 system prompt contains five named section headings and the data-not-instructions label.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 names no basis for the date taken from the reception fallback
  asserts: The fallback sentence of the v4 delta exists and does not mention a basis.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 still asks the model never to invent a date
  asserts: The v4 delta contains "never invent a date".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4.system extends v3.system verbatim with the received_at-anchor directive
  asserts: The v4 system prompt equals the v3 system prompt, a newline and the received_at-anchor directive, exactly.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4.user() surfaces received_at and an unknown document_date in the metadata block
  asserts: v4.user's first block is text showing received_at, and document_date as (unknown).
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
    name: refuses a prompt version the system does not hold instead of falling back to another one
  asserts: selectPromptModule("v99") throws UnknownPromptVersionError.
- test:
    file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
    name: accepts produced, single-chunk, too-long and failed and nothing else
  asserts: The status schema accepts exactly the four declared values. It refuses near-misses such as "single_chunk", "Produced", "pending" and the empty string.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: completes the run when the preliminary reading answers a provider error
  asserts: A v5 run whose reading throws a 529 overloaded error ends with status completed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: leaves the run holding no document context when the preliminary reading answers a provider error
  asserts: After a reading provider error, the run's document_context is null.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads every chunk of the raw information when the preliminary reading answers a provider error
  asserts: After a reading provider error, every one of the three chunk texts is sent in a chunk call.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the 3 chunks, completes the run and records status failed with no document context when the preliminary reading of a 3-chunk v5 raw information answers a provider error
  asserts: 'After a reading provider error: three chunk calls, run completed, status failed, and context null.'
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: reads the one chunk of a v5 raw information of 1 chunk
  asserts: The single chunk of a one-chunk v5 raw information is sent in a chunk call.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the model call of the preliminary reading times out
  asserts: A reading that throws APIConnectionTimeoutError records status failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the preliminary reading answers a provider error
  asserts: A reading that throws a 529 overloaded error records status failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: records the document context status failed when the preliminary reading answers text that is not a document context
  asserts: A reading answering plain prose instead of a context records status failed.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows every chunk the source's type, document date, title and reception time on a v5 run that skipped its preliminary reading
  asserts: On one-chunk and too-long v5 runs, every chunk prompt contains the source type, document date, title and reception time.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows the second chunk of a v5 run past 100000 characters the last 200 Unicode code points of the first chunk when they are astral
  asserts: On a too-long run, the second chunk prompt holds exactly the last 200 astral code points of the first chunk and not the 201st.
- test:
    file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
    name: shows the second chunk of a v5 run past 100000 characters the last 200 characters of the first chunk and no more
  asserts: On a too-long run, the second chunk prompt holds exactly the last 200 characters of the first chunk and not the 201st.
- test:
    file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
    name: leaves the document context status as it was when a retried run under a later prompt version holding a document context is extracted with no preliminary reading
  asserts: A failed run under v6 holding a context with status single-chunk keeps single-chunk after retry and re-extraction. v6 is mocked onto the v5 prompt module.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers a knowledge node matched both exactly and approximately once
  asserts: A node returned by both node-layer routes appears as exactly one item.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers a knowledge node that only the approximate route reaches as a node item at hop 0
  asserts: An approximate-only node hit is answered as the single item, of kind node at hop 0.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: answers no %s-layer item for text that only a trigram match could reach
  asserts: The fragment and chunk layers answer no item when only trigram-shaped SQL would have reached the text.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: keeps at most 200 node candidates when the exact and approximate routes together hold more
  asserts: With 150 exact and 100 approximate hits, the answer holds exactly 200 items.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: reports a total that counts the 200 candidates kept, not the candidates both routes held
  asserts: With 150 exact and 100 approximate hits, total equals 200.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-approximate-node.spec.ts
    name: scores a knowledge node matched both exactly and approximately with its exact-match score
  asserts: A node returned by both routes carries the exact route's score, 0.63, not 0.72.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: '%s'
  asserts: Links at hops 1, 2 and 3 from a node scored 0.8 score 0.4, 0.2 and 0.1.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers a link whose confidence is in the uncertain band with the uncertain flag and no other
  asserts: A link with status uncertain and confidence 0.6 carries flags exactly ["uncertain"].
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment
  asserts: Items of the three kinds each carry kind, layer, score, hop, summary, flags and a non-empty provenance array.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers no item with an empty provenance
  asserts: A matched node with no supporting fragment is not answered with an empty provenance.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: expands from it like any matched node, scoring a link at hop h at 0.5 raised to h times the score of the matched node it was reached from, whether that node was matched exactly or approximately
  asserts: Links reached from an approximate node scored 0.72 score 0.36, 0.18 and 0.09. Links reached from an exact node scored 0.4 score 0.2, 0.1 and 0.05.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: names, in every entry of a node, a link and a fragment item, only fragments that support that very item
  asserts: Each item's provenance names only fragments assigned to that item.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: numbers an expanded link by the links on its path from the matched node, so a link touching the matched node is hop 1 in either direction
  asserts: Expanded links carry hops 1, 1, 2 and 3 by path length, in both directions.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link whose target is the matched node at 0.5 times its score at hop 1, and the link beyond it walked the same way at 0.25 times at hop 2
  asserts: Links walked through their target end score 0.4 at hop 1 and 0.2 at hop 2.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is
  asserts: Two chains from nodes scored 0.8 and 0.4 score 0.4, 0.2, 0.1 and 0.2, 0.1, 0.05.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'scores the link after a change of walking direction at 0.25 times the matched node''s score at hop 2: %s'
  asserts: With a change of direction between hops, the links score 0.4 and 0.2.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: answers a node, a link and a fragment item with no attribute the search item does not declare
  asserts: No item carries a key outside kind, layer, id, score, hop, summary, flags, provenance, match and similarity.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
    name: ranks an approximately matched knowledge node after an information fragment and a knowledge link that were not reached only through approximate matches
  asserts: An approximate node scored 0.8 ranks after a fragment scored 0.5 and a link reached from an exact node.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/prove-aliases-fuzzy-context-2
reconciliation: siegard-reconcile/aliases-fuzzy-context-2.md
findings:
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Header comment, lines 3-18 ("Acceptance criteria addressed here"). The same criteria are repeated as "criterion:" comments inside the tests at lines 504-505, 532-534, 600-601, 667-668 and 739-740.
  evidence: '//   - "POST /llm-runs/:id/propose-node returns 409 BUSINESS_RUN_NOT_RUNNING

    //      when run exists but is completed"

    //   - "POST /llm-runs/:id/propose-link returns 404 RESOURCE_NOT_FOUND when

    //      llmRunId is unknown"

    //   - "POST /llm-runs/:id/propose-attribute returns 422 on Zod parse failure

    //      (malformed body / missing required field)"'
  cost: The refusal statuses and codes of the proposal routes are already held by the ingestion contract, and the assertions in this file (`expect(res.statusCode).toBe(409)`, `expect(body.error.code).toBe("BUSINESS_RUN_NOT_RUNNING")`) hold them as code too. The comments are a second home outside behavior. When the contract moves, they go stale without anything reaching them, and a reader may take them for the decision.
  correction: Remove the comment prose by the comment route. The behavior is already held by the node and by the assertions.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Comment "Note on the envelope semantics", lines 24-28.
  evidence: '// Note on the envelope semantics (BR-28 / SD-1 in delivery): any

    // `ValidationFailure` raised by the propose-* service surfaces as HTTP 200

    // with `{ ok: false, error: ... }`. ZodErrors at the route boundary continue

    // to surface as HTTP 422 via the global error handler — see the inference log'
  cost: 'The contract holds, per refusal, which proposal refusals answer HTTP 200 with `{ ok: false, error }` and which answer HTTP 422 over REST. This prose restates that split as a general rule under its own authority ("BR-28 / SD-1"), so the next reader looks to the comment for the envelope rule and not to the contract. The tests'' status-code assertions hold the behavior.'
  correction: Remove the comment prose by the comment route.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: '`FakeStore.llm_runs` row type, line 76 (the `status` member of the in-test llm_run row declaration).'
  evidence: 'status: "running" | "completed" | "failed";'
  cost: The run-status vocabulary is declared a second time, in a file the run-status node is not bound to. Today the three values agree with the node. When the node adds or renames a state, `--check` never reaches this file and nobody can tell which declaration was decided. The union types a test double of the llm_run row and is not an assertion about the node.
  correction: Remove the second declaration of the vocabulary, for example by typing the fake row's status from the type the binding to run-status already owns. The bind that claims it is what keeps such a declaration closed, since code never reads the specification.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Interpretation-note comment in the test "returns HTTP 200 with ok:false VALIDATION_INVALID_FORMAT envelope when chunk_ids do not belong to the run's source", lines 536-541.
  evidence: '// "text > 1000 chars" as the trigger; Zod''s max(1000) intercepts that

    // before the service runs (it surfaces as HTTP 422 via the global handler,'
  cost: The 1000-character limit of a fragment's text is held by the fragment-text-length rule. Per the candidate index that rule is bound to src/modules/ingestion/mcp/mcp-schemas.ts, and I did not open that file. The comment states the limit again outside behavior, so a change to the rule leaves a stale "1000" here.
  correction: Remove the comment prose by the comment route.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Test "returns HTTP 409 BUSINESS_RUN_NOT_RUNNING when the run exists but is completed", lines 623-624.
  evidence: 'expect(body.error.details.current_status).toBe("completed");

    expect(body.error.details.llm_run_id).toBe(RUN_COMPLETED_ID);'
  cost: The ingestion contract answers the refusal only as "error code BUSINESS_RUN_NOT_RUNNING naming the run's status, HTTP 409 over REST". The detail key names `current_status` and `llm_run_id` appear in no node. They are pinned only here, and presumably in the code that emits them. A reader of the specification cannot learn them, and a client reading them depends on a decision that lives in code and test.
  correction: The analysis would give the BUSINESS_RUN_NOT_RUNNING answer of the ingestion contract the names of its details, or the assertion would stop pinning them.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Comment block "TC-06 (valid-values-attribute-domains)", lines 795-806.
  evidence: '//   - out-of-domain     → 200 ok:false VALIDATION_INVALID_FORMAT envelope with

    //                          (P2.1 namespaced; deprecated: STRUCTURAL_INVALID)

    //                          details = { value, allowed_values }; NO inserts'
  cost: 'The contract holds the closed-domain refusal: VALIDATION_INVALID_FORMAT, details naming the value and the allowed values, HTTP 200 with `{ ok: false, error }`. The assertions at lines 867-884 hold it as code. The comment also cites a "deprecated" code that no node names. It is a second home outside behavior.'
  correction: Remove the comment prose by the comment route.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Comment in the out-of-domain test, lines 865-866.
  evidence: '// Per BR-28 / SD-1: service-layer ValidationFailure surfaces as

    // HTTP 200 with { ok: false, error: ... } envelope.'
  cost: This restates, under the authority of a rule label, the contract's HTTP 200 envelope for service-level refusals. `expect(res.statusCode).toBe(200)` and `expect(body.ok).toBe(false)` already hold it as code.
  correction: Remove the comment prose by the comment route.
- pass: conformance
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: Comment before the allowed_values assertion, line 879.
  evidence: // allowed_values is lexicographically sorted per TC-02/TC-03 contract.
  cost: The contract holds that the allowed values appear "in sorted order". The assertion `toEqual(["Apollo", "Gemini", "Mercury"])` holds it as code. The comment restates it as "lexicographically sorted" and cites a task contract that is not a node, so it reads as the authority for the ordering.
  correction: Remove the comment prose by the comment route.
- pass: conformance
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
  where: the constants DATA_OPENER and BLOCK_CLOSER (lines 74-75), applied by isDelimitedAt and marksViolations to decide that content is "marked apart"
  evidence: const DATA_OPENER = /\bdata\b.*:$/i; const BLOCK_CLOSER = /^END\b/;
  cost: 'The test fixes what the mark is: a line ending in a colon that contains the word "data", and a closing line that starts with "END". The node only says the content is "marked apart from its instructions as data" and names no marker. A prompt that marked the content apart some other way would satisfy the node and fail this test. A reader asking what "marked apart" means will find the answer here, not in the specification.'
  correction: The analysis would either state the presentation marker in constraints/document-content-is-data, or leave the marker to the prompt and have the test assert only the node's own wording.
- pass: conformance
  file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
  where: observeRefusal() (lines 124-137) and the expectation incompleteContextRefused.readingWithoutSummaryRecords in EXPECTED (lines 63-67)
  evidence: 'const lacksSummary = await extractedAfterReading({ entities: [MARIA] }); ... readingWithoutSummaryRecords: recordedContext(lacksSummary), ... readingWithoutSummaryRecords: null,'
  cost: 'The test fixes what an extraction records when the preliminary reading returns entities but no summary: no document context at all. No node says this. domain/knowledge-base/document-context only makes the summary a required attribute, and document-context-status-recorded says only that a failed reading records failed and a reading that yields a document context records produced. It does not say whether a reading missing a required field counts as failed. The next reader looks in the specification for what happens to a summary-less reading and finds nothing. The test becomes the place where that outcome is decided.'
  correction: 'An analysis would have to decide, in a node, what an extraction records when the preliminary reading lacks a required field of the document context (the summary or the model): no context, and which document context status. The node that should hold it is domain/knowledge-base/document-context, or a rule constraining it beside document-context-entity-type-in-catalog.'
- pass: conformance
  file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
  where: MALFORMED_ENTITIES (lines 33-37), EXPECTED.refusedWithNothingRecorded (lines 46-50), observeMalformedEntities (lines 76-83) and the it(...) title (line 107)
  evidence: "\"an entity whose names list is empty\": { node_type: \"Person\", names: [] }, \"an entity with no names\": { node_type: \"Person\" }, \"an entity with no node type\": { names: [\"Maria Souza\"] }, ... refusedWithNothingRecorded: {\n  \"an entity whose names list is empty\": null,\n  \"an entity with no names\": null,\n  \"an entity with no node type\": null,\n},"
  cost: The test fixes what an extraction does when a preliminary reading lists an entity with no names, an empty names list or no node type. The whole document context is dropped and nothing is recorded; the malformed entity is not just left out. No node states this. domain/knowledge-base/document-entity says only that `names` is required and the node type is a reference of cardinality 1. Its log decides that an entity needs a name, but not what happens to the reading that lists one without. rules/knowledge-base/document-context-entity-type-in-catalog drops only an entity of an unknown node type and keeps the context. The log of that rule names the alternatives (drop, keep, or count the reading as failed) for the unknown-type case. Nothing settles them for a malformed entity. A later reader looking for what a malformed entity does to a run's context will look in the specification, find only the required marker, and miss that this test file is where the whole-context refusal lives.
  correction: Analysis would have to decide, in a node such as domain/knowledge-base/document-entity or a rule beside rules/knowledge-base/document-context-entity-type-in-catalog, what a preliminary reading that lists an entity with no names, an empty names list or no node type yields. Examples are a document context without that entity, no document context, or a failed reading. It would also decide which document context status the run records in that case.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: header comment, line 13 (repeated at lines 329-330, inside the test "branch 3")
  evidence: //   - entity_match_review row count = candidates with sim >= MATCH_FLOOR
  cost: The comment says the review rows are one per candidate at or above the floor. It leaves out the cap of ten that the node states. A reader who takes the header as the rule will believe the number of review rows is unbounded. The cap lives in `TRIGRAM_CANDIDATE_LIMIT = 10` in entity-resolution.service.ts, passed as `LIMIT $3`. The comment is a second home for part of this fact, and it is out of step with the node. All the tests use at most two candidates at or above the floor, so none of them exercises the cap.
  correction: Remove the comment prose by the route that answers prose. The fact stays held by the node and by the service code. The comment adds nothing the assertions do not already say.
- pass: conformance
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: header comment, lines 15-16
  evidence: //   - thresholds (MATCH_STRONG = 0.85, MATCH_FLOOR = 0.55) live in the //     entity-resolution module only.
  cost: This comment states the two thresholds a second time, in a file that none of the three nodes holding them binds to. If a node moves one of the values, the comment keeps asserting the old numbers and nothing flags it. The values are held by the nodes and by the constants in entity-resolution.service.ts (`export const MATCH_STRONG = 0.85;`, `export const MATCH_FLOOR = 0.55;`).
  correction: Remove the comment prose by the route that answers prose. The code in the service module is the holder of the values.
- pass: conformance
  file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  where: the fourth test, "fails an extraction under a prompt version the system does not hold without asking the model, ...", and its expected object (lines 321-342)
  evidence: 'unheldVersionModelRequests: refused.systemTexts.length, ... unheldVersionModelRequests: 0,'
  cost: The suite asserts that an extraction under an unheld prompt version makes zero requests to the language model. No node states this. prompt-version-known says only that the version must be one the system holds, and the ingestion contract says only that the refusal carries the failed run. A reader who wants to know whether such a run may reach the model looks in the specification, finds nothing, and takes this test's expected value as the business decision.
  correction: Analysis would have to decide whether an extraction under an unheld prompt version calls the model, and give that decision a node. The natural home is prompt-version-known or a rule beside it.
- pass: conformance
  file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  where: knownVersionsListedBy (lines 104-111) and its use in the first test (line 136)
  evidence: 'const listed = /Known versions:\s*([^.]*)\./.exec(refusalMessage(version))?.[1] ?? ""; ... const known = knownVersionsListedBy(UNHELD_VERSION); expect({ resolved, known }).toEqual({ resolved: expected, known: expected });'
  cost: 'The test treats it as required that the refusal for an unheld prompt version carries the sentence "Known versions: v1, v2, ..." naming every held version. Nowhere in the specification states that this message lists the held versions or how it is worded. The next reader looks in the specification for what the refusal tells a person and finds only that the version must be one the system holds. The message''s content and format then live in the code and in this test, and the test fails if the wording changes, though no business decision fixed it.'
  correction: Either decide into a node (the rule governing the known-version refusal) that the refusal names the held versions, or let the test verify the held set without parsing an implementation message.
- pass: conformance
  file: src/__tests__/unit/ingestion/preliminary-reading-model-call-bounds.spec.ts
  where: the second test, "calls the context model exactly three times for one preliminary reading when it answers a retryable error on every attempt", with the overloadedFetch stub and the constants OVERLOADED_STATUS and MAX_ATTEMPTS_OF_ONE_CALL
  evidence: 'const OVERLOADED_STATUS = 529; ... error: { type: "overloaded_error", message: "Overloaded" }, ... expect(readingAttempts).toHaveLength(MAX_ATTEMPTS_OF_ONE_CALL);'
  cost: The test pins that a 529 overloaded answer is retried, and retried exactly twice. The node says only "is retried at most twice". It says nothing about which failures are retried, and nothing that makes three attempts a floor rather than a ceiling. A reader looking for which answers the extraction retries finds it in this test and not in the specification. If the retry policy changes, nothing in the specification says which is right.
  correction: Analysis would need to decide whether which provider answers are retried, and whether the number of attempts is a floor as well as a ceiling, belong in constraints/extraction-model-call-bounded or in a node of their own. Until then the test states a fact the specification does not hold.
- pass: conformance
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  where: The DECLARED_ITEM_KEYS constant (lines 500-511), asserted at lines 514-543 in the test "answers a node, a link and a fragment item with no attribute the search item does not declare".
  evidence: "const DECLARED_ITEM_KEYS = [\n  \"kind\",\n  \"layer\",\n  \"id\",\n  \"score\",\n  \"hop\",\n  \"summary\",\n  \"flags\",\n  \"provenance\",\n  \"match\",\n  \"similarity\",\n];"
  cost: The test treats `id` as a declared attribute of a search item, and the search-item node lists no `id`. Its attributes are kind, layer, score, hop, summary, flags, match and similarity, plus the provenance relationship. Every ordering assertion in this file also reads `item.id`. The fact that a ranked item carries an identity therefore lives only in this test and in the code, where the next reader will not look for it in the specification.
  correction: The analysis that owns search-item would have to decide whether the item carries an identity attribute and give it a node. Until then the test's list is the only declaration of that attribute outside the code.
- pass: conformance
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: LlmRunResponseSchema, the attempts field (line 74)
  evidence: 'attempts: z.number().int().positive(),'
  cost: The floor of 1 on an LLM run's attempts is applied only here. The llm-run node declares attempts as an integer with no bound, and retry-counts-attempts only says a retry adds one. The next reader looks for the lower bound in the specification and does not find it. A run whose attempts is 0 is refused when the response is built, and no node says why.
  correction: The analysis would have to decide whether an LLM run's attempts is at least 1, and place that on domain/knowledge-base/llm-run or on a rule constraining it. Until then the bound has no node.
- pass: conformance
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: ListToolCallsQuerySchema, the limit field (line 111)
  evidence: 'limit: z.coerce.number().int().min(1).max(100).default(50),'
  cost: rules/knowledge-base/page-limit-bounds holds "A page's limit MUST be between 1 and 100", and this file declares the same bounds. The node is not bound to this file. The identical literal also appears in eight other DTOs, for example src/modules/query-retrieval/dto/search.dto.ts and src/modules/curation/dto/queue.dto.ts. If the node moves, `--check` never reaches this file, and nobody can tell which of the nine copies was the decided one. The default of 50 is a different fact; tool-call-page-defaults holds it, and the pass reads it as conforming.
  correction: Code never reads the specification, so the closure is the bind. rules/knowledge-base/page-limit-bounds would have to be bound to this file by the trace, so that the declaration here is the place the node claims.
- pass: conformance
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: ListToolCallsQuerySchema, the offset field (line 112)
  evidence: 'offset: z.coerce.number().int().min(0).default(0),'
  cost: rules/knowledge-base/page-offset-non-negative holds "A page's offset MUST be at least 0", and this file declares the same bound without being bound to that node. If the node changes, `--check` does not reach this file. The default of 0 is a different fact; tool-call-page-defaults holds it, and the pass reads it as conforming.
  correction: rules/knowledge-base/page-offset-non-negative would have to be bound to this file by the trace, which closes the declaration nobody claims.
- pass: conformance
  file: src/modules/ingestion/dto/propose-node.dto.ts
  where: the ProposeNodeResult interface, line 38, optional member aliases_not_admitted
  evidence: "export interface ProposeNodeResult {\n  readonly node_id: string;\n  readonly resolution: ProposeNodeResolution;\n  readonly aliases_not_admitted?: readonly AliasNotAdmitted[];\n}"
  cost: The name aliases_not_admitted, with the member names node_id, alias and reason, is the key of a published answer, and no node spells it. The contract says only that the answer carries "each proposed alias that was not admitted, with the reason ALIAS_NOT_IN_SOURCE", and a search of the specification root for aliases_not_admitted finds nothing. The wire key therefore lives only in this type. A client or a test reads the shape from the code, because the contract does not say it.
  correction: Give the key of the unadmitted-alias list and the member names of a propose-node answer a node, by analysis. The ingestion contract's propose-node answer is the natural home.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: StartAsyncIngestionMcpInputSchema, lines 48-79 (the content field's description, line 54)
  evidence: export const StartAsyncIngestionMcpInputSchema = z.object({ ... "The full plain text of the document to ingest. Paste the raw content; the server chunks it, runs structured extraction in the BACKGROUND, and persists the knowledge graph with provenance. No base64/binary."
  cost: The file declares and exports the argument schema of a tool that starts an ingestion and returns before it completes. The specification retires that tool kind, and its decision log says the retirement covers a different name for the same behavior. A reader of the specification would not look here for it. If the schema is registered as a tool, the system offers a tool the specification excludes.
  correction: Either the node changes through analysis, or the schema and its description leave the toolset. The decision is the owner's. The file only shows the schema is declared.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: content field of StartAsyncIngestionMcpInputSchema (line 52) and of IngestDocumentMcpInputSchema (line 88)
  evidence: ".min(1, \"content must not be empty\")\n    .max(10 * 1024 * 1024, \"content must not exceed 10 MiB\")"
  cost: The 1 to 10,485,760 content bound is enforced here, and the node that holds it is not bound to this file. If the node moves, `--check` never reaches this schema, and the two values can drift unnoticed.
  correction: The code agrees with the node's value. The rule is declared in a file the node is not bound to, so the bind that claims this file closes it. The code cannot read the node.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: idempotency_key in GetIngestionStatusOutputSchema, line 161
  evidence: 'idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),'
  cost: The shape of the idempotency key (64 lowercase hexadecimal characters) is restated here, and the node that holds it is not bound to this file. A change to the node would not reach this output schema.
  correction: The value agrees with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: limit in ListRecentIngestionsMcpInputSchema, lines 172-178 (.min(1).max(50))
  evidence: ".min(1)\n    .max(50)\n    .default(10)\n    .describe(\"How many recent ingestions to return, newest first. 1..50, default 10.\"),"
  cost: The 1 to 50 bounds are enforced here, and the node that holds them is not bound to this file. If the node moves, `--check` does not reach this schema.
  correction: The values agree with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: limit in ListRecentIngestionsMcpInputSchema, line 177 (.default(10))
  evidence: .default(10)
  cost: The default of 10 entries is applied here, and the node that holds it is not bound to this file. If the node changes the default, nothing reaches this schema.
  correction: The value agrees with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedIsoDateSchema, lines 184-189
  evidence: ".regex(\n    /^\\d{4}-\\d{2}-\\d{2}$/,\n    \"valid_from must be ISO YYYY-MM-DD\"\n  );"
  cost: The shape of a directed validity start is enforced here, and the node that holds it is not bound to this file. If the node moves, `--check` does not reach this regex.
  correction: The shape agrees with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedRefSchema, line 191
  evidence: const IngestDirectedRefSchema = z.string().min(1).max(120);
  cost: The 1 to 120 bound on a directed item's reference is enforced here, and the node that holds it is not bound to this file. If the node changes, this schema is not reached.
  correction: The value agrees with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedValidFromBasisSchema, line 193
  evidence: const IngestDirectedValidFromBasisSchema = z.enum(["stated", "document"]);
  cost: The refusal of the basis received is carried here by leaving that value out of the enumeration. The node that holds the refusal is not bound to this file, so a change to it does not reach this declaration.
  correction: The enumeration agrees with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: text field of IngestDirectedFragmentItemSchema, lines 199-205 (its description)
  evidence: '"The verbatim factual claim quoted from the source (max 1000 chars). One atomic claim per fragment — split compound sentences."'
  cost: The tool tells the caller that a fragment is one atomic claim, quoted verbatim, and that compound sentences must be split. No node holds this. The information fragment node says only "a piece of knowledge a language model proposed", so the shaping rule lives only in this emitted description. The next reader will not find it in the specification.
  correction: Analysis would give the fragment's granularity a node, or the description would stop stating it. The 1000-character bound it quotes is held by fragment-text-length.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: name and aliases of IngestDirectedNodeItemSchema, lines 218-223 and 232-237
  evidence: "name: z\n    .string()\n    .min(1)\n    .max(500)\n... aliases: z\n    .array(z.string().min(1).max(500))"
  cost: The 1 to 500 character bound on a name and on each alias is enforced here, and the node that holds it is not bound to this file. If the node moves, `--check` does not reach these fields.
  correction: The values agree with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: node_id field of IngestDirectedNodeItemSchema, lines 225-231 (its description)
  evidence: '"Optional UUID PIN: ... Rejected (VALIDATION_INVALID_FORMAT) if the id does not point to an active node."'
  cost: The text the system emits says every pin that does not point to an active node is refused with VALIDATION_INVALID_FORMAT. The contract gives two answers. A pinned identity naming no knowledge node is reported rejected with RESOURCE_NOT_FOUND ("node_id pin does not resolve to an existing knowledge_node row."). Only a node that exists but is not active gets VALIDATION_INVALID_FORMAT. A caller who trusts the description will expect the wrong code for a nonexistent id.
  correction: The description would have to state the two answers as the contract gives them, or stop naming a code.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirectedAttributeValueSchema, lines 240-244
  evidence: "z.union([\n  z.string().min(1).max(2000),\n  z.number().finite(),\n  z.boolean(),\n]);"
  cost: The accepted shape of a directed attribute's value is enforced here, and the node that holds it is not bound to this file. If the node moves, `--check` does not reach this union.
  correction: The shape agrees with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: fragments and nodes in IngestDirectedMcpInputSchema, lines 295-306
  evidence: "fragments: z\n    .array(IngestDirectedFragmentItemSchema)\n    .min(1)\n... nodes: z\n    .array(IngestDirectedNodeItemSchema)\n    .min(1)"
  cost: The requirement of at least one fragment and one node is enforced here, and the node that holds it is not bound to this file. If the node moves, `--check` does not reach these arrays.
  correction: The minimums agree with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: source_label in IngestDirectedMcpInputSchema, lines 319-323
  evidence: "source_label: z\n    .string()\n    .min(1)\n    .max(200)\n    .optional()"
  cost: The 1 to 200 bound on a directed ingestion's label is enforced here, and the node that holds it is not bound to this file. If the node moves, `--check` does not reach this field.
  correction: The values agree with the node. The bind claiming this file closes it.
- pass: conformance
  file: src/modules/ingestion/prompts/preliminary-reading.ts
  where: INSTRUCTIONS, the Output section, lines 30-31 (summary language)
  evidence: '"- summary: what the document is about, in the language of the document, in"'
  cost: The summary's language is a decision about what a document context holds, and it lives only in a prompt sent to the model. A reader looking in domain/knowledge-base/document-context finds only "a short summary", so a change of language would be made here and never reach the node.
  correction: Give the summary's language a node, most naturally a statement on domain/knowledge-base/document-context or a rule constraining it, through the analysis. Nothing in this file can close it by itself.
- pass: conformance
  file: src/modules/ingestion/prompts/preliminary-reading.ts
  where: INSTRUCTIONS, the Output section, line 36 (what counts as a name)
  evidence: '"  catalog below. A pronoun alone or a role alone is not a name."'
  cost: The prompt tells the model to leave a role out of a document entity's names. The node says the names are those the document uses, and the scenario's given lists a role among them ("a person the document also calls \"o Diretor\""). Whoever relies on the scenario expects a role such as "o Diretor" to reach the context. The prompt makes the model withhold it, so the later mention in chunk 3 would not link to João Silva.
  correction: Decide in the specification whether a document context may list a role alone as a name, then bring the prompt line or the scenario into line with that decision. The pair now disagrees.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: line 23, the header comment of directedIngestionService's module
  evidence: //   - No chunk loop, no model dispatch — items are pre-structured.
  cost: A second statement of "calls no language model" sits in prose beside the code that holds it (the ingestRaw call with DIRECTED_MODEL and DIRECTED_PROMPT_VERSION and no model client). When the node moves, a reader sees two homes for the fact and the comment is not bound to the node.
  correction: Remove the comment. The behavior is held by the intake call at lines 346-358, which opens the run and calls no model, and by directed-run.ts for the model and prompt-version values. Prose is removed by the comment route followed by /reconcile over this file.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 24-25 in the header comment, and lines 584-586 above the attributes loop
  evidence: //   - Forces `confidence = 1.0` and defaults `valid_from_basis = 'stated'` //     when the caller omits it (BR-34 step 4). ... //     either is missing. `confidence = 1.0`; `valid_from_basis` defaults to //     `'stated'` when omitted by caller (BR-34 Defaults matrix).
  cost: 'The default basis is stated in prose twice, next to the code that applies it (`valid_from_basis: item.valid_from_basis ?? "stated"`, `change_hint: item.change_hint ?? "none"`). The prose cites a "BR-34 Defaults matrix" that is not the specification node, so the next reader may take it as the home of the default.'
  correction: Remove both comments. The default is held by the two ?? expressions at lines 621-622 and 701-702.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 104-106, 129, 139 and 106, the DirectedNodeItemSchema, DirectedAttributeItemSchema and DirectedLinkItemSchema declarations
  evidence: 'node_type: z.string().min(1), ... node_id: z.string().uuid().optional(), ... key: z.string().min(1), ... link_type: z.string().min(1),'
  cost: The code refuses the whole call with VALIDATION_INVALID_FORMAT when a node type, attribute key or link type is empty, or when a node pin is not a well-formed uuid. The ingest-directed contract lists no such refusal, and a pin that names no node is specified as a per-item rejection (RESOURCE_NOT_FOUND), not a refusal of the whole call. The next reader looks in the specification for why a malformed pin refuses the call and finds nothing.
  correction: The analysis should decide whether these shape refusals are part of ingest-directed (and add the rules and refusals), or whether the schema should not state them.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 91-93 (IsoDateSchema) and its use at lines 133 and 143 for valid_to on directed attributes and links, forwarded at lines 620 and 700
  evidence: 'valid_to: IsoDateSchema.optional(), ... ...(item.valid_to !== undefined ? { valid_to: item.valid_to } : {}),'
  cost: The service accepts and proposes a validity end on a directed attribute or link. The decision log of directed-validity-start-shape records that only the validity start is stated, because the tool strips any other field before the service reads it. The code keeps a validity-end path the specification says never arrives, so the code is the only place that says a validity end can be forwarded.
  correction: The analysis should decide whether a directed item may state a validity end and give that a node, or the field should not be declared here.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 266-285, the doc comments on `sourceExcerpt` and `metadataPointer` in DirectedIngestionDeps, and lines 336-338
  evidence: '* it into the `RawInformation.metadata` jsonb. REST / MCP-direct callers * omit this field; the orchestrator emits a metadata document without the * pointer keys. NEVER participates in `content_hash` (lives in metadata, ... // TC-02 / BR-34 — chat-row pointer (non-PII; the verbatim text lives in // `original_input`, not here). Merged in only when the chat dispatch // supplied it; REST / MCP-direct calls emit metadata without these keys.'
  cost: The rule that conversation and message identities are recorded in the metadata when the call comes from a chat turn is restated in prose beside the code that holds it (lines 330-342). The prose cites TC-02 / BR-34 as its authority, so the next reader may treat it as the home of the fact.
  correction: Remove the comments. The fact is held by `intakeMetadata`, built at lines 330-342.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: line 305, the message of the error returned when the Zod parse fails
  evidence: 'code: "VALIDATION_INVALID_FORMAT", message: "Input failed Zod parse.",'
  cost: The ingestion contract names the message of this refusal as "ingest_directed arguments failed validation.". This service emits a different text, so a caller that reaches this branch is told something the specification does not say. The tool's own handler is outside this file and may validate before this branch.
  correction: 'The message emitted here would have to be the one the contract names: "ingest_directed arguments failed validation.".'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 519-523, the comment above the pin-failure code selection
  evidence: '//   - `reason: ''not_found''`  -> RESOURCE_NOT_FOUND (row absent) //   - `reason: ''inactive''`   -> VALIDATION_INVALID_FORMAT (row present //                                but status != ''active''; structural'
  cost: The contract's code mapping for a pin that names no node or an inactive node is restated in prose, next to the `pinCode` expression that holds it. The comment cites "ingestion.back.md v1.6.0", a document that is not the specification, as its authority.
  correction: Remove the comment. The mapping is held by the `pinCode` expression at lines 524-527 and the messages in verifyNodePin at lines 865 and 873.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 914-916, refForAttribute, used for every attribute entry of the report
  evidence: "function refForAttribute(item: DirectedAttributeItem): string {\n  return `${item.node_ref}.${item.key}`;\n}"
  cost: The reference an attribute carries in the report is its node reference and key joined by ".". The specification fixes this only for a link, joined by "->". No node says what an attribute's report reference is, so a client that matches report entries to attributes learns the form only from the code.
  correction: The analysis should give the attribute report reference a node, in the manner of directed-link-report-reference, and extend the ingestion contract's report description.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 1035-1039 and 1052, the fallback in readClosedRunSafe, returned in the response run
  evidence: "const fallback = {\n    started_at: new Date(0).toISOString(),\n    finished_at: new Date(0).toISOString(),\n    attempts: 1,\n  };"
  cost: When the closed run cannot be read, the response reports the run with start and finish at 1970-01-01T00:00:00.000Z and one attempt. The contract says only that the run is reported completed even where closing it failed; it states no values for the run's times and attempts in that case. A caller sees invented timestamps that look like a real record.
  correction: The analysis should decide what the report holds for the run's times and attempts when the run cannot be read, and give that a node.
- pass: conformance
  file: src/modules/ingestion/service/directed-run.ts
  where: lines 1 and 3, the exports DIRECTED_MODEL and DIRECTED_PROMPT_VERSION
  evidence: 'export const DIRECTED_MODEL = "directed" as const;


    export const DIRECTED_PROMPT_VERSION = "directed-v1" as const;'
  cost: The values are declared only in this file. Node rules/knowledge-base/directed-ingestion-run states them ("A directed ingestion opens an LLM run of model directed and prompt version directed-v1"), but the trace binds that node to src/modules/ingestion/service/directed-ingestion.service.ts, which imports the values from here. If the node moves, --check reaches the service and never this file. The constants would then change in a file the node does not answer for, or fail to change, with nobody knowing which was decided. The same constants also feed the alias-admission query in entity-resolution.service.ts, so the value is read in two places and declared in a third.
  correction: 'The bind that claims this declaration has to reach it: rules/knowledge-base/directed-ingestion-run bound to this file as well as to directed-ingestion.service.ts. Code never reads the specification, so nothing in the source can close this.'
- pass: conformance
  file: src/modules/ingestion/service/extraction.service.ts
  where: 'runChunkLoop, the model call at line 487 (`thinking: { type: "adaptive" }`), and the `thinking` field of the ExtractionMessageRequest interface at line 118'
  evidence: 'thinking: { type: "adaptive" },'
  cost: Every extraction turn is sent with adaptive thinking on. That is a choice about how the model reads a chunk, and it affects what each turn costs and how long it takes. No node states it. A reader who looks in the specification for how an extraction calls the model finds the timeout, the retries and the token ceiling, but not this. The decision lives only in this call.
  correction: Analysis would give the extraction's model-call settings a node, or an amendment to rules/knowledge-base/extraction-turn-token-ceiling, so that adaptive thinking is stated where the other model-call bounds are.
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: line 3, the SearchKind type alias
  evidence: export type SearchKind = "node" | "link" | "fragment";
  cost: The values of the item-kind enumeration are declared here, in a file that node is not bound to. When the node moves, a check that follows binds never reaches this file. Nobody can then say which of the two lists was the decision.
  correction: Bind domain/knowledge-base/item-kind to this file, so the declaration here becomes the place that node is held. The code cannot read the specification, so the bind is what closes it.
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: line 55, the `query` field of the SearchResponse interface
  evidence: 'readonly query: string;'
  cost: The search answer carries the query text back, and no node states it. The retrieval contract's search answer names the page of items and the total before pagination, and the page node gives limit and offset. A reader who looks in the specification for what a search returns will not find this field. A client may come to depend on a field that was never decided.
  correction: Analysis would give the search answer's echo of the query a place in contracts/knowledge-base/retrieval, or the field would be dropped from the shape.
- pass: conformance
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: line 84, the `status` field of the ProvenanceFragment interface
  evidence: 'readonly status: "accepted" | "proposed" | "rejected" | "deleted";'
  cost: The fragment-status enumeration holds proposed, accepted, rejected, superseded and deleted. This file redeclares it as a four-value vocabulary without `superseded`. A fragment in that state is outside the type that provenance reads promise. The next reader sees a closed list of four and takes it for the business's list. Nothing reaches this file when the node changes.
  correction: The status type would have to hold the same values as domain/knowledge-base/fragment-status, and that node would have to be bound to this file.
- pass: conformance
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: 'the three ts_rank_cd expressions that set each exact layer''s unweighted score: searchFragmentLayer (line 43), searchNodeAliasLayer (line 76) and searchChunkLayer (line 161)'
  evidence: '(ts_rank_cd(f.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score

    (max(ts_rank_cd(to_tsvector($1::regconfig, na.alias), websearch_to_tsquery($1::regconfig, $2))) * $3::float)::float AS score

    (ts_rank_cd(rc.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score'
  cost: The score of every exact fragment, node and chunk match is the cover-density rank (ts_rank_cd) times the layer weight, and the node that fixes the weights (layer-weights) says only that "a match's strength is weighted by" them. No node says what the unweighted strength is. This file is the only place that decision lives, so a reader who looks in the specification for what orders fragment, chunk and exact node matches will not find the choice of ranking function.
  correction: Analysis would have to give the unweighted strength of an exact layer match a node, or extend rules/knowledge-base/layer-weights to say it. The code cannot read the specification, so nothing is closed by editing this file.
- pass: conformance
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: the ORDER BY and LIMIT of searchFragmentLayer (line 47), searchNodeAliasLayer (line 83), APPROXIMATE_NODE_ALIAS_SQL (line 119) and searchChunkLayer (line 165)
  evidence: 'ORDER BY score DESC, f.created_at DESC, f.id ASC

    ORDER BY score DESC, kn.canonical_name ASC, kn.id ASC

    ORDER BY score DESC, rc.id ASC'
  cost: The cap node says a search keeps at most 200 candidates from each layer but not which ones survive when a layer overflows. Here the survivors are chosen by score, then newest creation time (fragments), canonical name ascending (nodes) or identifier. The tie-break order decides which matches the owner never sees, and it lives only in this file.
  correction: Analysis would have to state how each layer picks its candidates when it holds more than the cap, in rules/knowledge-base/search-layer-candidate-cap or a sibling node.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: buildFakeClient, lines 140-322
  evidence: "function buildFakeClient(store: FakeStore): import(\"pg\").PoolClient {\n  return {\n    query: async (...args: unknown[]) => {\n      const sql = String(args[0]).replace(/\\s+/g, \" \").trim();"
  cost: The fake store is one function of about 180 lines, and its query closure is a chain of about 20 SQL-matching branches. A reader who needs to know why one propose-* test gets a given row has to hold the whole chain in mind. A new route's query is added as a twenty-first branch instead of its own helper.
  cites: MNT-01
  correction: Split the branches into named responders per concern (run lookup, fragment inserts, node resolution, link and attribute consolidation), in the shape the query-retrieval specs already use (respondToGraph, respondToProvenance).
- pass: standard
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: buildCatalog (338-375) and buildCatalogWithClosedProjectName (447-489)
  evidence: "function buildCatalog() {\n  return buildSnapshot({\n    nodeTypes: [\n      { id: NODE_TYPE_PERSON_ID, name: \"Person\" },\n[...] function buildCatalogWithClosedProjectName() {\n  return buildSnapshot({\n    nodeTypes: [\n      { id: NODE_TYPE_PERSON_ID, name: \"Person\" },\n(the two bodies are identical except for the trailing attributeValidValues)"
  cost: The same 40-line catalog is written twice. A change to the Person/Project fixture has to be made in both, and the two can drift so that the closed-domain tests no longer run over the catalog the default tests use.
  cites: MNT-03
  correction: Build the closed-domain variant from buildCatalog(), by passing only the attributeValidValues, instead of restating the node types, link types and rules.
- pass: standard
  file: src/__tests__/integration/ingestion/propose-routes.spec.ts
  where: buildAuthFixture and signValidJwt, lines 404-421
  evidence: "async function buildAuthFixture(): Promise<AuthFixture> {\n  const { privateKey, publicKey } = await generateKeyPair(\"RS256\", {\n    extractable: true,\n  });"
  cost: The RS256 key and JWT fixture is copied unchanged into run-answers-document-context-routes.spec.ts and search-node-match.spec.ts, so a change to how the middleware is faked has to be repeated in three specs.
  cites: MNT-03
  correction: Move the key generation, the signing and the Env fixture into one shared test helper that the three integration specs import.
- pass: standard
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  where: envFixture, buildAuthFixture and signValidJwt, lines 17-55
  evidence: "async function buildAuthFixture(): Promise<AuthFixture> {\n  const { privateKey, publicKey } = await generateKeyPair(\"RS256\", {\n    extractable: true,\n  });"
  cost: This is a second copy of the auth and Env fixture in propose-routes.spec.ts (and a third in search-node-match.spec.ts). A change to how the middleware is faked has to be made in every copy.
  cites: MNT-03
  correction: Import the shared JWT and Env fixture from one helper.
- pass: standard
  file: src/__tests__/integration/query-retrieval/search-node-match.spec.ts
  where: envFixture, buildAuthFixture and signValidJwt, lines 105-141
  evidence: "async function signValidJwt(privateKey: CryptoKey): Promise<string> {\n  return new SignJWT({ sub: \"user-123\" })\n    .setProtectedHeader({ alg: \"RS256\", kid: \"test-kid\" })"
  cost: A third copy of the same JWT fixture. The suite carries three diverging places that decide what a "valid token" is in tests.
  cites: MNT-03
  correction: Import the shared JWT and Env fixture from one helper.
- pass: standard
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts
  where: stand-in plumbing, lines 204-315 (updateRun, ROUTES, answer, buildPool, USAGE, textMessage, streamFor, buildModel)
  evidence: "function updateRun(sql: string, params: unknown[], world: World): QueryResult {\n  const value = String(params[1]);\n  if (sql.includes(\"SET document_context_status\")) {\n    world.run.document_context_status = value;\n  } else if (sql.includes(\"SET document_context =\")) {"
  cost: chunk-prompt-document-context.spec.ts holds the same updateRun, ROUTES, buildPool, USAGE, systemTextOf, blocksOf, indexOfChunk, tick and streamFor, and document-context-extraction-world.ts is the shared helper meant for this. A change in how the run row is updated has to be chased through each copy.
  cites: MNT-03
  correction: Take the run store, the model stand-in and the message builders from one shared world helper.
- pass: standard
  file: src/__tests__/unit/ingestion/chunk-prompt-document-context.spec.ts
  where: NodeProposalSchema, lines 144-147
  evidence: "const NodeProposalSchema = z.object({\n  node_id: z.string(),\n  resolution: z.string(),\n});"
  cost: The test parses the propose_node result with a schema it defines itself, so it proves a copy of the shape and not the contract. The dto directory holds no Zod schema for that result (propose-node.dto.ts declares ProposeNodeResult as an interface), so nothing could be imported. That follows from the departure reported against that file.
  cites: DTO-04
  correction: Once the dto exports a schema for the propose_node result, import it from the dto directory here.
- pass: standard
  file: src/__tests__/unit/ingestion/default-prompt-version-through-intake-and-extraction.spec.ts
  where: chunkRowsOf, lines 76-84
  evidence: "const [rawId, indices, texts, starts, ends, versions] = params as [\n  string,\n  number[],\n  string[],"
  cost: The query parameters are asserted to a six-element tuple with no check. If the production INSERT changes its parameter order, the stand-in silently reads the wrong columns and the test fails somewhere unrelated or keeps passing.
  cites: TYP-02
  correction: Narrow each parameter with a guard before using it (typeof or Array.isArray, as idsIn does in the sibling specs).
- pass: standard
  file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  where: stand-ins for ingestRaw and runExtraction, lines 58-70
  evidence: "const ingestRaw = createdIntake(); const runExtraction = vi\n  .fn()\n  .mockResolvedValue({ id: \"run-1\", status: \"completed\" });"
  cost: The intake service and the extraction run are replaced by mocks, and both are the business logic. The test reads the arguments the handler passed to its own mock. It would stay green if the real intake ignored prompt_version, which the sibling spec default-prompt-version-through-intake-and-extraction.spec.ts avoids by standing in only for the store and the model.
  cites: TST-03
  correction: Stand in for the pool and the model boundary and let the real intake and extraction run, as the sibling spec does.
- pass: standard
  file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  where: runHandlerAndReadOpenedRunBody, line 74
  evidence: 'return ingestRaw.mock.calls[0]?.[1] as { prompt_version: string };'
  cost: The argument of a mock call is asserted to a shape with no guard. If the call count or the argument position changes, the read yields undefined and the failure shows up as a property read on undefined, not as a failed expectation.
  cites: TYP-02
  correction: Check that the call exists and that its second argument carries a string prompt_version before returning it.
- pass: standard
  file: src/__tests__/unit/ingestion/default-prompt-version.spec.ts
  where: baseInput, line 24
  evidence: "const baseInput = {\n  content: \"Rodrigo lidera o Projeto Apollo.\","
  cost: A module-level constant fixture is camelCase while its neighbours in the same file (VERSION_RULE_REQUIRES_WHEN_NONE_IS_NAMED, EXPLICIT_VERSION) are SCREAMING_SNAKE_CASE, so the reader cannot tell it is a fixed value shared by every test.
  cites: CON-02
  correction: Name it in SCREAMING_SNAKE_CASE (BASE_INPUT).
- pass: standard
  file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  where: file location and name
  evidence: src/__tests__/unit/ingestion/document-context-dto.spec.ts imports "../../../modules/ingestion/dto/llm-run.dto.js"
  cost: The unit under test is src/modules/ingestion/dto/llm-run.dto.ts, but the test is named for a behaviour and does not mirror that path. A reader looking for the tests of that dto file will not find this one by following the file. Most other specs under unit/ingestion and unit/query-retrieval are named the same way, by behaviour.
  cites: TST-04
  correction: Place the test at the mirrored path (unit/ingestion/dto/llm-run.dto.spec.ts) or document the behaviour-named layout as the project's accepted form.
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution-alias-admission.spec.ts
  where: answerAdmission, lines 119-144
  evidence: "const directed =\n  run !== undefined &&\n  contentNorm !== null &&\n  run.model === stringAt(params, 1) &&\n  run.prompt_version === stringAt(params, 2);\n[...] admitted: directed || occurs,"
  cost: The store stand-in recomputes the alias-admission rule (directed run, or the alias occurring in the normalised content) in TypeScript. The assertions on which aliases are admitted therefore check the fake's copy of the rule, and they stay green if the SQL in ALIAS_ADMISSION_SQL stops admitting correctly.
  cites: TST-03
  correction: Let the stand-in return fixed admitted rows per scenario and prove the rule in a test that runs against a real database, or assert the SQL's text contract the way search-repository-approximate-node.spec.ts does.
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution.spec.ts
  where: buildClient, lines 85-178
  evidence: "function buildClient(cfg: StubConfig, state: StubState) {\n  const newNodeId = cfg.newNodeId ?? \"ffffffff-ffff-4fff-8fff-ffffffffffff\";\n  return {\n    query: async (...args: unknown[]) => {"
  cost: A 94-line stub function with seven SQL branches inline. Adding a statement to the resolution pipeline means editing one monolith, and a reader has to read all of it to see what the stub answers.
  cites: MNT-01
  correction: Split the stub into one named responder per statement kind.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
  where: END_TURN_MESSAGE, lines 53-70, and buildPool, lines 103-112
  evidence: "const END_TURN_MESSAGE = {\n  id: \"msg_end\",\n  type: \"message\",\n  role: \"assistant\",\n  model: \"claude-opus-4-8\","
  cost: The same end-turn message literal is spelled out again in extraction-prompt-held-versions.spec.ts, run-answers-document-context-extraction.spec.ts and default-prompt-version-through-intake-and-extraction.spec.ts, and the same pool stand-in again in several of them. A change in the SDK message shape is then edited in about four places.
  cites: MNT-03
  correction: Take the message and pool stand-ins from the existing shared fixture helpers (run-document-context-fixture.ts, document-context-extraction-world.ts).
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  where: END_TURN_MESSAGE, lines 75-92, and buildPool, lines 233-242
  evidence: "const END_TURN_MESSAGE = {\n  id: \"msg_end\",\n  type: \"message\",\n  role: \"assistant\",\n  model: \"claude-opus-4-8\","
  cost: A copy of the same message and pool stand-in kept in extraction-orchestrator-prompt-v5.spec.ts and the others, so they drift apart one edit at a time.
  cites: MNT-03
  correction: Import one shared message and pool stand-in.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  where: nodeTypes, line 18
  evidence: 'const nodeTypes: NodeTypeRow[] = ['
  cost: A module-level constant fixture is camelCase while the sibling spec extraction-prompt-v5.spec.ts names the same fixture NODE_TYPES. Two specs for adjacent prompt versions spell it differently, and the reader cannot tell that it is a fixed value.
  cites: CON-02
  correction: Name it NODE_TYPES.
- pass: standard
  file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  where: file location and name
  evidence: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts imports "../../../modules/ingestion/repository/llm-run.repository.js"
  cost: The unit under test is src/modules/ingestion/repository/llm-run.repository.ts. The test sits at a behaviour name directly under unit/ingestion rather than at the mirrored repository path, so it is not found from the file it covers and another test of that repository may be written beside it.
  cites: TST-04
  correction: Place it at unit/ingestion/repository/llm-run.repository.spec.ts or record the behaviour-named layout as the accepted one.
- pass: standard
  file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
  where: vi.mock of prompts/index.js, lines 11-23
  evidence: "selectPromptModule: (promptVersion: string) =>\n  original.selectPromptModule(\n    promptVersion === LATER_PROMPT_VERSION\n      ? PROMPT_VERSION_WITH_A_MODULE\n      : promptVersion\n  ),"
  cost: The prompt registry's version-resolution rule is replaced by a stand-in that maps v6 to v5. That rule is business logic, not a boundary, so the test asserts how its own replacement behaves. If real resolution of a later version changed, this test would not notice.
  cites: TST-03
  correction: Register a real later prompt module for the test, or put the retry behaviour under a prompt version the registry actually holds.
- pass: standard
  file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
  where: END_TURN_MESSAGE and runExtraction pool, lines 59-121
  evidence: "const END_TURN_MESSAGE = {\n  id: \"msg_end\",\n  type: \"message\",\n  role: \"assistant\",\n  model: \"claude-sonnet-4-5\","
  cost: Another copy of the end-turn message and of the pool stand-in whose shared versions already exist in retried-run-world.ts and document-context-extraction-world.ts. Four specs now carry their own.
  cites: MNT-03
  correction: Reuse the shared extraction world helper.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: nodeRow, linkRow, linkMetadataRow, provenanceRow, respondToGraph, lines 74-259
  evidence: "function linkRow(link: GraphLink): unknown {\n  return {\n    id: link.id,\n    source_node_id: link.source,\n    target_node_id: link.target,\n    link_type_id: \"link-type-1\","
  cost: The graph-row builders and the respondTo* routers are repeated in search-service-fragment-link-no-match, search-service-ranking-approximate-group and search-service-ranking, with small differences. A change in the column set of knowledge_link_resolved must be made in four files.
  cites: MNT-03
  correction: Extract the row builders and routers into one shared query-retrieval test helper that each spec configures.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-fragment-link-no-match.spec.ts
  where: nodeRow, linkRow, linkMetadataRow, provenanceRow, respondToGraph, lines 65-246
  evidence: "function linkMetadataRow(link: GraphLink): unknown {\n  return {\n    id: link.id,\n    source_canonical_name: `Name ${link.source}`,\n    target_canonical_name: `Name ${link.target}`,"
  cost: This spec repeats the row builders and routers of search-service-expansion.spec.ts, so the four search-service specs that use them diverge as one is edited.
  cites: MNT-03
  correction: Use the shared query-retrieval test helper.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-ranking-approximate-group.spec.ts
  where: nodeRow, linkRow, linkMetadataRow, provenanceRow, respondToGraph, lines 65-198
  evidence: "function nodeRow(id: string): unknown {\n  return {\n    id,\n    node_type_id: \"type-1\",\n    node_type: \"Person\","
  cost: A further copy of the graph-row stand-ins. The same row shape is now maintained by hand in four places.
  cites: MNT-03
  correction: Use the shared query-retrieval test helper.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-ranking.spec.ts
  where: nodeRow, linkRow, linkMetadataRow, provenanceRow, respondToGraph, lines 74-247
  evidence: "function respondToGraph(\n  world: World,\n  sql: string,\n  params: readonly unknown[]\n): Rows | undefined {"
  cost: The fourth copy of the graph-row stand-ins and routers. A fix in one (for example the direction filter on kl.source_node_id) is not carried to the others.
  cites: MNT-03
  correction: Use the shared query-retrieval test helper.
- pass: standard
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: ListToolCallsResponseSchema, lines 95-101
  evidence: "export const ListToolCallsResponseSchema = z.object({\n  total: z.number().int().nonnegative(),\n  limit: z.number().int().positive(),\n  offset: z.number().int().nonnegative(),\n  items: z.array(ToolCallResponseSchema),\n});"
  cost: A paginated response is declared again here, and search.service's SearchResponse repeats the same total/limit/offset/items shape in its own module. Two declarations of one page envelope can disagree, and a client cannot tell which one the API promised.
  cites: API-01
  correction: Express this response with the shared PaginatedResponse from src/types/pagination.ts.
- pass: standard
  file: src/modules/ingestion/dto/llm-run.dto.ts
  where: type exports, e.g. line 82, and the file name
  evidence: export type LlmRunResponse = z.infer<typeof LlmRunResponseSchema>;
  cost: One file holds the response, request and query shapes of several use cases (LlmRunResponse, RetryLlmRunRequest, ListToolCallsQuery) and the inferred types carry no Dto suffix. A reader looking for what the retry route accepts has to open llm-run.dto.ts and search it, instead of finding retry-llm-run.dto.ts from the route name.
  cites: DTO-03
  correction: Split by use case and name the inferred types for it (for example RetryLlmRunDto in retry-llm-run.dto.ts).
- pass: standard
  file: src/modules/ingestion/dto/propose-node.dto.ts
  where: ProposeNodeResolution, AliasNotAdmitted, ProposeNodeResult, lines 26-39
  evidence: "export interface AliasNotAdmitted {\n  readonly alias: string;\n  readonly reason: typeof ALIAS_NOT_IN_SOURCE;\n}\nexport interface ProposeNodeResult {\n  readonly node_id: string;\n  readonly resolution: ProposeNodeResolution;"
  cost: The result of propose_node is hand-written types beside the Zod input schema, with no schema to check an answer against. Callers (and the tests, which parse it with a local schema) have no source of truth for the answer's shape that the compiler and the runtime both agree on.
  cites: DTO-02
  correction: Declare the result as a Zod object and export the type inferred from it.
- pass: standard
  file: src/modules/ingestion/dto/propose-node.dto.ts
  where: ProposeNodeInput type, line 24
  evidence: export type ProposeNodeInput = z.infer<typeof ProposeNodeInputSchema>;
  cost: The schema is named ...Schema but the inferred type is neither ...Dto nor a use-case name from the Create/Update/Response/Query set, so the file's shape names do not follow the pairing a reader would look for.
  cites: DTO-03
  correction: Name the pair for its use case (for example ProposeNodeSchema/ProposeNodeDto in propose-node.dto.ts).
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: GetIngestionStatusSummarySchema, AffectedNodeOutputSchema, GetIngestionStatusOutputSchema, lines 133-169
  evidence: "const GetIngestionStatusSummarySchema = z.object({\n  accepted: z.number().int().nonnegative(),\n  consolidated: z.number().int().nonnegative(),\n  superseded_previous: z.number().int().nonnegative(),\n[...] status: z.enum([\"running\", \"completed\", \"failed\"]),"
  cost: These restate LlmRunSummarySchema, AffectedNodeSchema and LlmRunResponseSchema from llm-run.dto.ts, down to the status enum. Adding an outcome to the run summary has to be done twice, and the REST and MCP answers can then disagree.
  cites: MNT-03
  correction: Reuse the llm-run.dto.ts schemas for the MCP output.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: StartAsyncIngestionMcpInputSchema (48-79) and IngestDocumentMcpInputSchema (84-115)
  evidence: "export const IngestDocumentMcpInputSchema = z.object({\n  content: z\n    .string()\n    .min(1, \"content must not be empty\")\n    .max(10 * 1024 * 1024, \"content must not exceed 10 MiB\")"
  cost: The two input schemas are the same five fields; only one word in a description differs. A change to a limit or an allowed field has to be made twice.
  cites: MNT-03
  correction: Define the shared fields once and extend or reuse them in both tools.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: IngestDirected*ItemSchema, lines 184-327
  evidence: "const IngestDirectedNodeItemSchema = z.object({\n  ref: IngestDirectedRefSchema.describe(\n[...] node_type: z.string().min(1) [...] name: z.string().min(1).max(500)"
  cost: directed-ingestion.service.ts already declares DirectedNodeItemSchema, DirectedFragmentItemSchema, DirectedAttributeItemSchema and DirectedLinkItemSchema, and its comment says the MCP schema should reuse them verbatim. The copies differ already (the MCP attribute/link items drop valid_to and change_hint), so the input the tool accepts is not the input the service parses.
  cites: MNT-03
  correction: Build the MCP input from the service's schemas, adding only the .describe() text.
- pass: standard
  file: src/modules/ingestion/mcp/mcp-schemas.ts
  where: lines 52 and 88, 161, and the 500-character limits
  evidence: '.max(10 * 1024 * 1024, "content must not exceed 10 MiB") [...] idempotency_key: z.string().regex(/^[0-9a-f]{64}$/),'
  cost: The 10 MiB limit is spelled twice here, the 64-hex pattern again in llm-run.dto.ts, and the 500 and 1000 length limits again in propose-node.dto.ts and directed-ingestion.service.ts. Changing one limit means finding every spelling of it.
  cites: TYP-04
  correction: Give the limits and the pattern names in one place and reference them.
- pass: standard
  file: src/modules/ingestion/repository/ingestion.repository.ts
  where: toRawInformationResponse and toRawChunkResponse, lines 195-220
  evidence: "export function toRawInformationResponse(\n  row: RawInformationRow\n): RawInformationResponse {\n  return {\n    id: row.id,\n    [...] received_at: row.received_at.toISOString(),"
  cost: The repository also builds transport response objects (ISO strings, defaults for metadata and locator), which goes beyond reading and writing. Changing the API shape then means editing the data-access module.
  cites: ARC-04
  correction: Move the row-to-response mapping into the service (as llm-run.service.ts does with toLlmRunResponse) and leave the repository returning rows.
- pass: standard
  file: src/modules/ingestion/repository/llm-run.repository.ts
  where: aggregateToolCallOutcomes, lines 122-164
  evidence: "export async function aggregateToolCallOutcomes(\n  client: PoolClient,\n  llmRunId: string\n): Promise<LlmRunSummary> {"
  cost: 'The function is 43 lines: it queries outcome counts, builds a zeroed summary, folds the rows in, then runs a second orphan query. A reader has to follow four jobs to change one counter.'
  cites: MNT-01
  correction: Extract the outcome fold and the orphan count into named helpers.
- pass: standard
  file: src/modules/ingestion/repository/llm-run.repository.ts
  where: retryLlmRunRow, lines 166-195
  evidence: "`UPDATE information_fragment\n    SET status = 'rejected'\n  WHERE llm_run_id = $1\n    AND status = 'proposed'\n    AND id NOT IN (\n      SELECT fragment_id FROM provenance WHERE fragment_id IS NOT NULL\n    )`"
  cost: The rule that retrying a run rejects its unanchored proposed fragments is decided here, inside the repository. It only runs when this function is called and cannot be exercised or reused as a service rule, and the service's retryLlmRun does not mention it.
  cites: ARC-04
  correction: Have the service decide that orphaned fragments are rejected on retry and call two plain repository writes.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: directedIngestionService, line 294-299
  evidence: "export async function directedIngestionService(\n  input: unknown,\n  deps: DirectedIngestionDeps\n): Promise<McpEnvelope<DirectedIngestionResult>> {\n  // ---- Step 1 — Zod parse (VALIDATION_INVALID_FORMAT on failure — P2.1) ----\n  const parsed = DirectedIngestionInputSchema.safeParse(input);"
  cost: The service takes a raw unknown payload and validates it itself. The REST route and the MCP handler each get a different validation path (this one, plus mcp-schemas.ts's own copy of the schema), and the service cannot be called with a typed value without going through the parse.
  cites: DTO-01
  correction: Parse at the route and the MCP boundary with one schema and make the service accept DirectedIngestionInput.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: import, line 76
  evidence: import { ingestRawInformation } from "./ingestion.service.js";
  cost: One service calls another, so the intake transaction boundary is hidden behind the call (withTransaction wraps ingestRaw here), and the directed flow cannot be tested without the real ingestion service or the ingestRaw seam.
  cites: LAY-04
  correction: Move the shared intake behaviour into a domain module or have a factory compose both services.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: directedIngestionService, lines 294-813
  evidence: export async function directedIngestionService( [...] // 3a. Fragments — confidence forced to 1.0, anchored to the first chunk. [...] // 3d. Links — mirror of attributes.
  cost: One function of about 520 lines holds validation, intake, four dispatch loops, the close and the summary. Each new item kind will add another loop to it, and no part of it can be tested without running the whole thing.
  cites: MNT-01
  correction: Extract intake, one dispatcher per item kind, and the response builder into named helpers taking a context object.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: verifyNodePin, lines 844-881
  evidence: "async function verifyNodePin(\n  pool: Pool,\n  nodeId: string\n):"
  cost: The function acquires a connection, runs the query, maps two rejection cases and releases in 38 lines. The query belongs in a repository and the status decision in the service.
  cites: MNT-01
  correction: Split the read from the decision.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe, lines 1026-1076
  evidence: "async function readClosedRunSafe(\n  pool: Pool,\n  llmRunId: string,\n  logger: Logger"
  cost: 51 lines mixing a fallback literal, a null branch, a mapping and a catch. The fallback logic is repeated in two return paths.
  cites: MNT-01
  correction: Extract the mapping and the fallback into helpers.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: ROLLBACK catch in closeRunCompletedSafe, lines 1002-1006
  evidence: "try {\n  await client.query(\"ROLLBACK\");\n} catch {\n  /* swallow */\n}"
  cost: A failed rollback is dropped with no log and no rethrow. The connection is then released back to the pool as if clean, possibly still inside an aborted transaction, and the next borrower inherits it.
  cites: COR-01
  correction: Log it and release the connection with the discard flag, as insertToolCallStandalone in llm-run.repository.ts does.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: closeRunCompletedSafe, lines 991-1019
  evidence: 'await client.query("BEGIN"); await closeLlmRunRow(client, { llm_run_id: llmRunId, outcome: "completed" }); await client.query("COMMIT");'
  cost: This is the same open-transaction, close-run, commit, rollback sequence as closeRunSafe in extraction.service.ts. The two have already diverged (one logs, the other discards the error), so a fix to how a run is closed has to be applied twice.
  cites: MNT-03
  correction: Call one shared close-run function from both orchestrators.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: error forwarding blocks, lines 484-491, 572-579, 653-660, 736-743
  evidence: "error: {\n  code: envelope.error.code,\n  message: envelope.error.message,\n  ...(envelope.error.details !== undefined\n    ? { details: envelope.error.details }\n    : {}),\n},"
  cost: The same block is written four times, once per item kind. A change in how a handler error is reported (a new field, a redaction) has to be applied four times, and one is easy to miss.
  cites: MNT-03
  correction: Extract it into one function that builds the report error from the envelope.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: 'confidence: 1.0, lines 460, 617, 697'
  evidence: 'confidence: 1.0,'
  cost: The confidence that directed ingestion forces on every item is a bare literal in three places. The value is the sole mark of how directed input is trusted; a change must be found in all three.
  cites: TYP-04
  correction: Name it (for example DIRECTED_CONFIDENCE) and use it in the three places.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: casts at lines 472, 557, 525 and 980
  evidence: 'envelope as unknown as McpEnvelope<Record<string, unknown>> [...] (pinResult.details as { reason?: unknown }).reason [...] summary[`${item.kind}s` as "fragments" | "nodes" | "attributes" | "links"] += 1;'
  cost: Each cast tells the compiler something no check has established. The envelope cast hides that the handler results have different shapes, and the pin cast reads a field from an untyped record. A change to the handlers or to the pin result becomes a wrong value at run time, not a compile error.
  cites: TYP-02
  correction: Give the pin result a typed discriminated reason, narrow the envelope with a guard, and key the summary through a typed lookup.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: unexpected-noop message at lines 409-412 and pin rejection messages at lines 865 and 873
  evidence: "message:\n  \"Directed ingestion intake returned 'noop_existing'; the per-call nonce should make this unreachable.\",\n[...] message: \"node_id pin does not resolve to an existing knowledge_node row.\","
  cost: These messages go into the envelope the client receives. They name the internal table (knowledge_node), the nonce mechanism and the intake outcome names, which tells a caller how the store and the intake are built.
  cites: SEC-04
  correction: Return a client-level message and log the internal wording.
- pass: standard
  file: src/modules/ingestion/service/entity-resolution.service.ts
  where: insertNode, line 244
  evidence: return res.rows[0]!.id;
  cost: The non-null assertion has no guard, unlike insertRawInformation and insertLlmRun in ingestion.repository.ts, which throw InvariantError when no row returns. If an INSERT returns nothing, this fails as a TypeError on undefined instead of naming the broken invariant.
  cites: TYP-02
  correction: Check for the row and throw InvariantError when it is absent.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: RunNotRunnableError (line 57), LlmProviderFatalError (line 77), ExtractionFatalError (line 97)
  evidence: "export class RunNotRunnableError extends Error {\n  public readonly statusCode = 409;\n[...] public readonly statusCode = 502; [...] public readonly statusCode = 500;"
  cost: The service's business errors carry HTTP status codes. Anything else that calls the service (a queue, a job) inherits the transport's status vocabulary, and the status mapping lives in two places, here and in the error middleware.
  cites: COR-03
  correction: Let the errors carry a code only and let the error middleware map code to status.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: import, line 39
  evidence: import { ResourceNotFoundError } from "./ingestion.service.js";
  cost: The extraction service depends on the ingestion service just for its error class, which couples their module graphs. llm-run.service.ts does the same and re-exports it.
  cites: LAY-04
  correction: Move ResourceNotFoundError to a domain errors module imported by both.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: dispatchToolUse, lines 155-217
  evidence: const parsed = ProposeNodeInputSchema.safeParse(rawInput); if (!parsed.success) return zodErrorEnvelope(parsed.error.issues);
  cost: Four tool arguments are validated inside the service, each by its own safeParse. The model's tool call is the boundary, and the service is where its validation lives, so the service cannot be fed already-typed proposals by another caller without repeating the parse.
  cites: DTO-01
  correction: Parse the tool call at the dispatch boundary (outside the service) and have the service receive typed inputs.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: dispatchToolUse, lines 155-217
  evidence: "async function dispatchToolUse(\n  toolName: string,\n  rawInput: unknown,\n  deps: DispatchDeps,\n  chunkId: string\n): Promise<McpEnvelope<Record<string, unknown>>> {"
  cost: 63 lines and four positional parameters, with four near-identical branches. A fifth tool would add a fifth branch.
  cites: MNT-01
  correction: Take one options object and dispatch through a table of tool handlers.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: closeRunSafe, lines 672-687
  evidence: "} catch {\n  await client.query(\"ROLLBACK\").catch(() => undefined);\n} finally {"
  cost: If closing the run fails, the error is dropped without a log. The run stays 'running' with no trace of why, and the caller then reads the final run as if the close had worked.
  cites: COR-01
  correction: Log the failure and either rethrow it or surface it in the result.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runLlmExtraction, lines 297-439
  evidence: "export async function runLlmExtraction(\n  pool: Pool,\n  llmRunId: string,\n  logger: Logger,\n  catalog: CatalogSnapshot,\n  deps: RunExtractionDeps\n): Promise<LlmRunResponse> {"
  cost: 143 lines and five positional parameters. The chunk loop, the error classification, the affected-node resolution and the final logging all share one scope.
  cites: MNT-01
  correction: Pass one options object and extract the failure translation and the affected-node resolution.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runChunkLoop, lines 463-581
  evidence: 'async function runChunkLoop(input: ChunkLoopInput): Promise<ChunkLoopOutcome> {'
  cost: 119 lines of turn handling, stop-reason branching, tool dispatch and the burst counter in one function. The burst counter and the dead `void burstReset;` live inside the same loop and cannot be reasoned about apart.
  cites: MNT-01
  correction: Extract one turn, the stop-reason handling and the tool-result processing.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: loadRunContext, lines 615-664
  evidence: "async function loadRunContext(\n  pool: Pool,\n  llmRunId: string\n): Promise<LoadedRunContext> {"
  cost: 50 lines reading the run, raw information and chunks, mapping metadata and shaping the return. The mapping cannot be reused or tested alone.
  cites: MNT-01
  correction: Extract the metadata mapping and the return shaping.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: casts at lines 145, 164-205, 250-260, 636
  evidence: '})) as McpEnvelope<Record<string, unknown>>; [...] }) as unknown as AnthropicLike; [...] input_schema: schema as unknown as Anthropic.Messages.Tool.InputSchema,'
  cost: The handler envelopes, the SDK client and the JSON schema are each cast to a target type with no guard (and two via unknown). A shape change in a handler result or in the SDK shows up as a run-time error inside an LLM run, not at compile time.
  cites: TYP-02
  correction: Narrow the envelope with a type guard and type the schema builder so no cast through unknown is needed.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: readFinalRun, lines 689-722
  evidence: "const base: LlmRunResponse = {\n  id: row.id,\n  model: row.model,\n  prompt_version: row.prompt_version,\n  started_at: row.started_at.toISOString(),"
  cost: This builds the same LlmRunResponse from a row as toLlmRunResponse in llm-run.service.ts, field by field. A new response field must be added in both or the run answers differently depending on which path produced it.
  cites: MNT-03
  correction: Export and call the one row-to-response mapper.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: uncaught exception translation, lines 394-401
  evidence: "const cause = err instanceof Error ? err.message : String(err); logger.error(\n  { llm_run_id: llmRunId, cause_message: cause },\n  \"extraction_uncaught_exception\"\n); throw new ExtractionFatalError(llmRunId, cause, partial);"
  cost: The message of any uncaught exception (including pg errors) is placed in the message of an error whose class is the one the error middleware turns into a SYSTEM_INTERNAL_ERROR answer. A driver message with table or column names can reach the client.
  cites: SEC-04
  correction: Keep the original message in the log and give the error a fixed client-facing message, carrying the original as cause.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: line 552
  evidence: if (envelope.error.code.startsWith("SYSTEM_")) {
  cost: The "SYSTEM_" prefix that separates infrastructure failures from validation rejections is spelled here and again in directed-ingestion.service.ts (classifyEnvelopeFailureStatus). If the code namespace changes, one place is missed and the burst counting and the report status disagree.
  cites: TYP-04
  correction: Share one named predicate or constant for the prefix.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: RunNotRetryableError (line 32) and RunNotRunningError (line 46)
  evidence: "export class RunNotRetryableError extends Error {\n  public readonly statusCode = 409;"
  cost: Two business errors of the service hold an HTTP status, so the service is tied to the REST vocabulary and the MCP transport maps the same fact through shared/error-mapping.ts, giving two mappings for one condition.
  cites: COR-03
  correction: Carry only the code and let the error middleware choose the status.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: import and re-export, lines 20 and 29
  evidence: import { ResourceNotFoundError } from "./ingestion.service.js"; [...] export { ResourceNotFoundError };
  cost: This service imports the ingestion service for its error class and re-exports it, so a third file can reach ResourceNotFoundError through either service and the dependency direction between the two services is unclear.
  cites: LAY-04
  correction: Import it from a shared domain errors module.
- pass: standard
  file: src/modules/ingestion/service/llm-run.service.ts
  where: getLlmRunById catch, lines 81-83
  evidence: "} catch {\n  affectedNodes = undefined;\n}"
  cost: A failure deriving the affected nodes (a pg error, for example) is dropped with no log. The response simply omits affected_nodes, and nobody can tell from a log whether a completed run really touched no nodes or the derivation broke.
  cites: COR-01
  correction: Log the failure (as the extraction path does with extraction_affected_nodes_resolution_failed) before degrading.
- pass: standard
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: recordProducedContext, lines 151-182
  evidence: "async function recordProducedContext(\n  pool: Pool,\n  llmRunId: string,\n  context: DocumentContext\n): Promise<void> {"
  cost: 32 lines mixing connection handling, the transaction, two writes and the rollback fallback. The same transaction skeleton recurs in insertToolCallStandalone and closeRunSafe.
  cites: MNT-01
  correction: Use a shared withTransaction helper (shared/pg-transaction.ts exists) and keep only the two writes here.
- pass: standard
  file: src/modules/ingestion/service/propose-node.service.ts
  where: import, line 10
  evidence: import { resolveOrCreateNode } from "./entity-resolution.service.js";
  cost: propose-node's transaction behaviour is decided inside another service, entity-resolution, which takes the client and takes the advisory lock. The two cannot be changed or tested independently of each other's transaction handling.
  cites: LAY-04
  correction: Move entity resolution under a domain module that both the service and its tests import.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: whole file, lines 31-90
  evidence: "export interface SearchItem {\n  readonly kind: SearchKind;\n  readonly layer: SearchLayer;\n[...] export interface SearchResponse {"
  cost: The search response shape is hand-written interfaces with no Zod schema. The route cannot validate or document its answer from it, and the type has no runtime twin to drift against, so a change in what the service builds is not checked against what the API declares.
  cites: DTO-02
  correction: Declare the response as a Zod schema and export the type inferred from it.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: SearchResponse, lines 54-60
  evidence: "export interface SearchResponse {\n  readonly query: string;\n  readonly total: number;\n  readonly limit: number;\n  readonly offset: number;\n  readonly items: readonly SearchItem[];\n}"
  cost: A paginated response is declared again in this module (llm-run.dto.ts holds another). When the shared page envelope changes, this one is not changed with it.
  cites: API-01
  correction: Express the response with the shared PaginatedResponse from src/types/pagination.ts.
- pass: standard
  file: src/modules/query-retrieval/dto/response.dto.ts
  where: SourceType and SOURCE_TYPES, lines 7-24, and SearchLayer line 4
  evidence: "export type SourceType =\n  | \"pdf\"\n  | \"email\"\n  | \"ata\"\n[...] const SOURCE_TYPES: ReadonlySet<SourceType> = new Set(["
  cost: The source type list is written out as a union and again as a set, and the ingestion module already has SourceTypeSchema in dto/source-type.js. A new source type has to be added in several places. SearchLayer is likewise declared here and imported from search.dto.js by search.service.ts.
  cites: MNT-03
  correction: Reuse the existing SourceType schema and the SearchLayer from search.dto.ts.
- pass: standard
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: listProvenanceForNodes, lines 273-306
  evidence: "export async function listProvenanceForNodes(\n  client: PoolClient,\n  nodeIds: readonly string[]\n): Promise<readonly NodeProvenanceRow[]> {"
  cost: 34 lines, almost all one SQL string. The projection is the same as in the two other provenance listings, so the function is long because it repeats it.
  cites: MNT-01
  correction: Share the projection and keep the function body short.
- pass: standard
  file: src/modules/query-retrieval/repository/search.repository.ts
  where: listProvenanceForFragments, listProvenanceForLinks, listProvenanceForNodes, lines 217-236, 246-266, 278-300
  evidence: "rc.id         AS raw_chunk_id, rc.offset_start, rc.offset_end, substring(rc.\"text\" FROM rc.offset_start + 1\n          FOR rc.offset_end - rc.offset_start) AS excerpt,\nri.id         AS raw_information_id, ri.source_type::text AS source_type, ri.received_at"
  cost: The same eleven-column provenance projection is pasted into three queries, and the excerpt expression is also in searchChunkLayer. A change to how an excerpt is cut must be made in four SQL strings.
  cites: MNT-03
  correction: Define the projection once as a constant fragment and interpolate only that fixed fragment, or extract a view.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService, lines 109-292
  evidence: "export async function searchKnowledgeService(\n  client: PoolClient,\n  catalog: CatalogSnapshot,\n  input: SearchServiceInput,\n  logger: Logger\n): Promise<SearchResponse> {"
  cost: '184 lines and four positional parameters: layer fetch, deduplication, fragment items, node items, expansion, filtering, slicing and logging in one scope. The fragment and node item-building loops are near twins of each other and cannot be tested or changed separately.'
  cites: MNT-01
  correction: Extract the fragment-item builder, the node-item builder and the log call, and pass one options object.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: toExpandedLinkItem, lines 422-464
  evidence: "function toExpandedLinkItem(\n  context: ExpansionContext,\n  candidate: ExpandedLink,\n  lookups: LinkLookups\n): IntermediateItem | undefined {"
  cost: 43 lines with three early returns (missing metadata, empty provenance, filtered uncertainty) and the item construction in one function.
  cites: MNT-01
  correction: Extract the three eligibility checks and the item construction.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: lines 269 and 437
  evidence: 'route: "GET /api/v1/search",'
  cost: The route name is a string literal in two log calls inside a service, and the real route path lives elsewhere. If the path or version changes, these logs name a route that no longer exists, and the service knows about HTTP.
  cites: TYP-04
  correction: Take the route label from the caller or name it as one constant.
---
## What it is
This review answers the 11 tasks of initiative aliases-fuzzy-context whose proofs the deliver-scope run re-delivered after the first review, over the 53 files their implementation and proof records name.
It names no captured run of its own: it reuses run/prove-aliases-fuzzy-context-2, the suite run that closed the proof re-deliveries over the same tree, which passed, so the failures pass had nothing to read.
The conformance pass ran one judge per file and its returns were folded into siegard-reconcile/aliases-fuzzy-context-2.md and bound into the trace.
The certification pass ran one coverage auditor per node a proof claims to demonstrate, 29 in all.

## Notes
Every conformance return was checked to answer for all 51 nodes of its pack before the fold; propose-node.service.ts took a fresh delegation because its first return was not valid YAML, and the earlier returns that covered only part of their pack were each replaced by a fresh delegation.
The failures pass names the suite run that closed the proof re-deliveries, run/prove-aliases-fuzzy-context-2, instead of a run of its own; that run passed, and the red run before it, run/prove-aliases-fuzzy-context, is named in the proof records of the tasks it concerned.
The standard pass applied only the rules deliver.py --standard --reading listed for this file set; the rules a tool decides rest on the steps of run/prove-aliases-fuzzy-context-2, which passed.
The standard pass reported TST-07 as not answerable because it was not handed the specification's invariants, itemized TST-04 for two representative specs only, and did not itemize the stand-in casts that build test doubles.
Conformance findings are recorded here without the kind and node fields their returns carry; the reconciliation record holds those fields.
This framework does not review runtime behaviour against a real database, performance, or security beyond the rules of the standard.
No pass ran inline; every pass ran in a delegated subagent.
