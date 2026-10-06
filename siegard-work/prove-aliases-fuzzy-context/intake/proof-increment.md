# Proof increment — prove-aliases-fuzzy-context

The human named this proof increment, in their own words: "Resolva as duas situações", then the choice "Os 12 sem banco (Recomendado)" — "Abre uma tarefa de prova para cada um dos 12 nós parciais... Custa 12 entregas só de teste, seguidas de uma revisão."
Constraint stated with the ask: no test may connect to a real database or read DATABASE_URL or any credential.

Of the 12 nodes, domain/knowledge-base/document-context and domain/knowledge-base/document-entity are not planned here: the record siegard-reconcile/aliases-fuzzy-context-3.md carries them with conforms false and no testable remainder.

## Facts

### constraints/document-content-is-data

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/prompts/extraction.v1.ts, src/modules/ingestion/prompts/extraction.v3.ts, src/modules/ingestion/prompts/extraction.v5.ts, src/modules/ingestion/prompts/preliminary-reading.ts
- Assertion (remainder_why, verbatim):

  One input against one expected result. Take a v5 run whose preliminary reading returns a summary carrying an injection string, and whose first chunk ends with an injection string inside its last 200 code points. Every chunk call should show both strings in the user turn only, each between a data label and a closing delimiter, and never in the system prompt.

### constraints/extraction-model-call-bounded

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/service/extraction.service.ts
- Assertion (remainder_why, verbatim):

  Input: a chunk extraction call to the run model that gets a retryable error (for example 529 overloaded) on every attempt. Expected: that call is attempted at most three times, meaning it is retried at most twice, counted for that chunk alone.

### rules/knowledge-base/document-context-status-kept-on-reuse

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/service/preliminary-reading.ts
- Assertion (remainder_why, verbatim):

  Two cases would close it. In each, a run holding a document context is extracted with no preliminary reading, and its status must still equal the held value afterwards. The first run has prompt version v5. The second has a version later than v5. In both, the held status must be one that a preliminary reading of the run's document would not record.

### rules/knowledge-base/document-context-status-recorded

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/service/preliminary-reading.ts
- Assertion (remainder_why, verbatim):

  Run an extraction under a v5-or-later prompt version over a stored raw information and read back the status recorded on its run, once for each shape: - a raw information of one chunk longer than 100000 UTF-16 units gives single-chunk; - several chunks over 100000 units gives too-long; - several chunks within the limit with a reading that fails gives failed; - several chunks within the limit with a reading that yields a context gives produced.

### rules/knowledge-base/extraction-anchors-to-read-chunk

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/service/extraction.service.ts
- Assertion (remainder_why, verbatim):

  Two fragments, each proposed while reading chunk 2. One names chunk 2 and chunk 3. The other names a chunk of a different raw information. Expected result: each fragment is anchored to chunk 2 alone, [[chunk 2], [chunk 2]].

### rules/knowledge-base/extraction-asks-for-other-names

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/prompts/extraction.v5.ts
- Assertion (remainder_why, verbatim):

  For each held version from v5 on, run one extraction and capture the system text it sends. Assert that a single instruction does all of the following. It asks for the other names proposed with each node to be names the text itself gives for that same entity. It gives an acronym, a short name and another spelling as examples of such names. It excludes a pronoun alone and a role alone from them. The test should fail when any one of these is missing from that instruction, even if the same words appear elsewhere in the prompt.

### rules/knowledge-base/extraction-prompt-v5-keeps-v4

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/prompts/extraction.v5.ts
- Assertion (remainder_why, verbatim):

  Run the same line-containment comparison of v4 against v5 over more catalogs, one per catalog shape the current test leaves out: a non-temporal link type, a link type allowing several current values, a link type requiring neither valid_from nor valid_to on change, an attribute key of each other value type, an attribute key with no valid values, a node type without a description, and an empty catalog. For each catalog the expected result is that no v4 instruction line is missing from v5.

### rules/knowledge-base/extraction-reads-chunks-in-order

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/prompts/extraction.v1.ts, src/modules/ingestion/prompts/extraction.v5.ts, src/modules/ingestion/service/extraction.service.ts
- Assertion (remainder_why, verbatim):

  Two assertions would close it. First, an extraction over raw information whose received_at differs from the run's started_at, expecting every chunk prompt to show received_at and not started_at. Second, an extraction of a multi-chunk run that holds no document context (a v4 run, or one whose preliminary reading failed), expecting chunk model calls never to overlap: at most one in flight at any time.

### rules/knowledge-base/link-and-fragment-items-carry-no-match

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/query-retrieval/service/search.service.ts
- Assertion (remainder_why, verbatim):

  One input: a search whose chunk layer matches a raw chunk that supports a fragment the fragment layer itself does not match. One expected result: the fragment item that search answers carries no match and no similarity.

### rules/knowledge-base/prompt-version-known

- Record: siegard-reconcile/aliases-fuzzy-context-3.md
- Files: src/modules/ingestion/prompts/index.ts
- Assertion (remainder_why, verbatim):

  One input, one expected result. Start an extraction run with a prompt version the system does not hold, through whatever path creates the run. Expect a refusal, and expect no LLM run to be recorded with that version.
