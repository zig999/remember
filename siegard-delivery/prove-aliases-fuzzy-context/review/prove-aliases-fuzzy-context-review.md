---
target: backend
title: Review of the prove-aliases-fuzzy-context proof increment
summary: The four passes over the 14 backend files the 8 delivered proof tasks of the initiative name, with every finding they returned.
reviewed:
- src/__tests__/unit/ingestion/document-context-status-recorded-world.ts
- src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
- src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
- src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
- src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts
- src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v5-keeps-v4-catalogs.spec.ts
- src/__tests__/unit/ingestion/preliminary-reading-status-kept-on-reuse.spec.ts
- src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
- src/modules/ingestion/prompts/extraction.v1.ts
- src/modules/ingestion/prompts/extraction.v5.ts
- src/modules/ingestion/service/extraction.service.ts
- src/modules/ingestion/service/preliminary-reading.ts
- src/modules/query-retrieval/service/search.service.ts
tasks:
- task/close-testable-remainders/document-context-status-kept-on-reuse
- task/close-testable-remainders/document-context-status-recorded
- task/close-testable-remainders/extraction-anchors-to-read-chunk
- task/close-testable-remainders/extraction-asks-for-other-names
- task/close-testable-remainders/extraction-model-call-bounded
- task/close-testable-remainders/extraction-prompt-v5-keeps-v4
- task/close-testable-remainders/extraction-reads-chunks-in-order
- task/close-testable-remainders/link-and-fragment-items-carry-no-match
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/close-testable-remainders-link-and-fragment-items-carry-no-match-suite passed; there was no failure to read
coverage:
- criterion: Two cases would close it. In each, a run holding a document context is extracted with no preliminary reading, and its status must still equal the held value afterwards. The first run has prompt version v5. The second has a version later than v5. In both, the held status must be one that a preliminary reading of the run's document would not record.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/preliminary-reading-status-kept-on-reuse.spec.ts
    name: leaves the held document context status unchanged when a run holding a document context is extracted under v5 and under a later prompt version
  why: The two versions and the held status are both exercised as stated. The held status is produced, and a reading of a three-chunk document of 100001 units would record too-long. A reading that did run would throw and record failed. What is not exercised is the run being extracted. The test calls the preliminary-reading step (produceDocumentContext) directly, with a run object, chunk count and content that the test builds itself. It never runs the extraction (runLlmExtraction), so a status write anywhere else in the extraction of a run holding a context would go unseen. The status is also read only off SQL text matching "SET document_context_status", so a write phrased any other way would go unseen too.
- criterion: An extraction run under a v5-or-later prompt version over a stored raw information of one chunk whose content is longer than 100000 UTF-16 code units records the document context status single-chunk on its run.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records single-chunk on the run when the stored raw information holds one chunk longer than 100000 UTF-16 code units
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records each of the four document context statuses by chunk count, content length in UTF-16 code units and reading outcome under v5 and under a later prompt version
  why: Neither test runs an extraction over a stored raw information. Both reach the preliminary-reading step (produceDocumentContext) through the helper document-context-status-recorded-world.ts, which passes it a chunk count and content the test made up. So the counting of the stored raw information's chunks and the measuring of its own content within an extraction run are never exercised. If the extraction derived either of them differently, these tests would still pass. The combined test also asserts single-chunk for a one-chunk document within the limit, which this criterion does not state.
- criterion: An extraction run under a v5-or-later prompt version over a stored raw information of more than one chunk whose content exceeds 100000 UTF-16 code units records the document context status too-long on its run.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records too-long on the run when the stored raw information holds several chunks whose content exceeds 100000 UTF-16 code units
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records each of the four document context statuses by chunk count, content length in UTF-16 code units and reading outcome under v5 and under a later prompt version
  why: The chunk count and the content are handed straight to the preliminary-reading step (produceDocumentContext). No extraction runs over a stored raw information. Whether an extraction run measures the stored raw information's own content in UTF-16 code units and counts its own chunks is therefore not exercised. The rule that decides the status is exercised, including content of more than 100000 UTF-16 code units that stays within 100000 code points.
- criterion: An extraction run under a v5-or-later prompt version over a stored raw information of more than one chunk whose content is within 100000 UTF-16 code units, where the preliminary reading fails, records the document context status failed on its run.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records failed on the run when the stored raw information holds several chunks within 100000 UTF-16 code units and the preliminary reading fails
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records each of the four document context statuses by chunk count, content length in UTF-16 code units and reading outcome under v5 and under a later prompt version
  why: Only the preliminary-reading step (produceDocumentContext) runs, with a chunk count and content the test supplies. No extraction run over a stored raw information records failed on its run. In the set, the one test that does run a v5 extraction with a failed reading is in extraction-chunk-reception-time-and-sequence.spec.ts, and it asserts nothing about the status.
- criterion: An extraction run under a v5-or-later prompt version over a stored raw information of more than one chunk whose content is within 100000 UTF-16 code units, where the preliminary reading yields a document context, records the document context status produced on its run.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records produced on the run when the stored raw information holds several chunks of exactly 100000 UTF-16 code units and the preliminary reading yields a document context
  - file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records each of the four document context statuses by chunk count, content length in UTF-16 code units and reading outcome under v5 and under a later prompt version
  why: The boundary of exactly 100000 units is exercised, but only through the preliminary-reading step (produceDocumentContext) with a chunk count and content the test supplies. No extraction run over a stored raw information is shown recording produced on its run.
- criterion: 'Two fragments, each proposed while reading chunk 2. One names chunk 2 and chunk 3. The other names a chunk of a different raw information. Expected result: each fragment is anchored to chunk 2 alone, [[chunk 2], [chunk 2]].'
  state: uncovered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
    name: anchors each of two fragments to the chunk being read alone, whether the model names that chunk and another of the same raw information or only a chunk of a different raw information
  why: The test uses exactly the two inputs the criterion states. But what it observes is the chunk_ids argument given to a mocked proposeFragmentHandler by the internal dispatcher (__testing__.dispatchToolUse). That is an internal call, not the anchoring of the fragment as recorded. It would still pass if the fragment ended up anchored to something other than chunk 2 after the handoff. It would fail if the anchoring moved into the handler, even with the behavior unchanged. Nothing in the set observes a recorded fragment anchored to chunk 2 alone.
- criterion: For each held version from v5 on, run one extraction and capture the system text it sends. Assert that a single instruction does all of the following. It asks for the other names proposed with each node to be names the text itself gives for that same entity. It gives an acronym, a short name and another spelling as examples of such names. It excludes a pronoun alone and a role alone from them. The test should fail when any one of these is missing from that instruction, even if the same words appear elsewhere in the prompt.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
    name: sends under every held prompt version from v5 on one instruction that asks, with each node, for every other name the text gives that entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  - file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
    name: judges %s as missing a part of the single instruction
  why: 'The test treats an "instruction" as a block of text separated by blank lines or headings. Under that reading, a block whose bullets put the ask in one line and the exclusions in another still passes, so parts spread over separate instructions inside one paragraph would not make it fail. The test also asserts more than the criterion states: it requires the words "every" or "all other name(s)". A prompt asking that the other names proposed with each node be names the text itself gives, without "every", meets the criterion but fails the test. The it.each test checks only the test''s own judge against literal prompt strings. It exercises nothing the system sends.'
- criterion: 'Input: a chunk extraction call to the run model that gets a retryable error (for example 529 overloaded) on every attempt. Expected: that call is attempted at most three times, meaning it is retried at most twice, counted for that chunk alone.'
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts
    name: attempts a chunk extraction call at most three times when the model answers overloaded on every attempt
  - file: src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts
    name: waits at most five minutes per attempt and attempts at most three times when the model never answers
  why: Both tests send one request straight through defaultAnthropicFactory, outside any extraction run. "Counted for that chunk alone" is never exercised. No test makes the calls for two chunks fail, so nothing shows each chunk getting its own budget of at most three attempts, rather than a budget shared across the run. Retrying added by the extraction around that client would also go unseen. The second test's five-minute wait bound per attempt is a fact this criterion does not state.
- criterion: 'Run the same line-containment comparison of v4 against v5 over more catalogs, one per catalog shape the current test leaves out: a non-temporal link type, a link type allowing several current values, a link type requiring neither valid_from nor valid_to on change, an attribute key of each other value type, an attribute key with no valid values, a node type without a description, and an empty catalog. For each catalog the expected result is that no v4 instruction line is missing from v5.'
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v5-keeps-v4-catalogs.spec.ts
    name: keeps every instruction line of the v4 system prompt as a whole, unaltered line of the v5 system prompt, over a catalog of each shape the rich-catalog comparison leaves out
  why: Every named shape is compared, and an empty v4 prompt is caught rather than passing vacuously. But "an attribute key of each other value type" is covered by one catalog that holds date, number and bool keys together, not one catalog per value type as the criterion's "one per catalog shape" reads. A v4 line that appears only when the catalog holds a single value type would never be produced.
- criterion: An extraction over raw information whose received_at differs from the run's started_at shows received_at, and not started_at, in every chunk prompt.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
    name: shows received_at and never the run's started_at in every chunk prompt when the two differ
  why: Covered. Note that the test requires received_at to appear in the ISO form 2026-10-05T12:00:00. A prompt that showed received_at in another format would fail the test even though the criterion would still hold.
- criterion: An extraction of a multi-chunk run that holds no document context (a v4 run, or one whose preliminary reading failed) never has two chunk model calls in flight at the same time.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
    name: never has two chunk model calls in flight at once for a multi-chunk run holding no document context
- criterion: 'One input: a search whose chunk layer matches a raw chunk that supports a fragment the fragment layer itself does not match. One expected result: the fragment item that search answers carries no match and no similarity.'
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
    name: answers no fragment item carrying a match or a similarity when the chunk layer matches a raw chunk that supports a fragment the fragment layer does not match
  why: 'The assertion is that the list of fragment items carrying a match or a similarity is empty. That also holds when the search answers no fragment item at all, and with this fixture it answers none: search.service builds fragment items only from fragment-layer hits, and the fragment layer here returns none. So no fragment item is ever seen to carry no match and no similarity. The test only fails if a fragment item with a match appears.'
unpaired:
- test:
    file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
    name: records single-chunk on the run when the stored raw information holds one chunk within 100000 UTF-16 code units
  asserts: Under v5, the preliminary-reading step (produceDocumentContext), given one chunk and 100 units of content, records the document context status single-chunk.
- test:
    file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
    name: anchors a fragment that names no chunk to the chunk being read
  asserts: When a propose_fragment tool input names no chunk_ids, the internal dispatcher (__testing__.dispatchToolUse) passes the mocked proposeFragmentHandler chunk_ids equal to the read chunk alone.
- test:
    file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
    name: anchors a fragment that names only another chunk of the same raw information to the chunk being read
  asserts: When a propose_fragment tool input names only another chunk of the same raw information, the internal dispatcher (__testing__.dispatchToolUse) passes the mocked proposeFragmentHandler chunk_ids equal to the read chunk alone.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
    name: answers a link reached from an exactly matched node, a link reached from an approximately matched node, and a fragment the fragment layer matched directly, each with no match and no similarity
  asserts: When the node layer matches one node exactly and one approximately, and the fragment layer matches one fragment, the search's non-node items are exactly one fragment and two links, none with a match or a similarity.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-link-and-fragment-items-carry-no-match-suite
reconciliation: siegard-reconcile/prove-aliases-fuzzy-context-review.md
findings:
- pass: conformance
  file: src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
  where: the receptionProblems helper (lines 265-275) and the title of the first test (line 277)
  evidence: "const showsStarted = [STARTED_AT_DATE, STARTED_AT_TIME]\n      .filter((needle) => prompt.includes(needle))\n      .map((needle) => `chunk ${at + 1} shows started_at (${needle})`);\nit(\"shows received_at and never the run's started_at in every chunk prompt when the two differ\", async () => {"
  cost: The test fails any chunk prompt that shows the run's start date or time, so the code now carries a prohibition that is in no node. rules/knowledge-base/extraction-reads-chunks-in-order says what the prompt shows (the source's type, document date, title and reception time) and says nothing about what it must not show. A reader looking for what a chunk prompt may carry will not find this exclusion in the specification, and a later prompt change that legitimately shows the run's start time would fail here with no rule to consult.
  correction: Either a node states that a chunk prompt never shows the run's start time, or the assertion narrows to what the nodes hold, which is that the prompt shows the reception time.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: header comment, lines 22-24, and the comment on `prevTail` in `UserPromptArgs`, line 211
  evidence: '"`prev_tail` carries the last ≤ `PREV_TAIL_CHARS` (200) characters of the previous chunk to provide minimal cross-chunk continuity (BR-26 step 5a)." and "/** Last ≤ 200 chars of the previous chunk (continuity); empty on chunk_index = 0. */"'
  cost: The 200 figure, and the choice to count it in characters, are written in two comments of this file, while the tail is cut in `src/modules/ingestion/service/extraction.service.ts` by `export const PREV_TAIL_CHARS = 200 as const;` and `Array.from(text).slice(-count).join("")` with `prevTail = lastCodePoints(chunk.text, PREV_TAIL_CHARS);`. The node holds the unit as Unicode code points and the comments say "characters". A reader of this file learns the tail rule from prose that no running system reads, and that prose can drift from the cut without anything failing.
  correction: Remove both comments by the route that answers prose. The code that holds the fact is in `src/modules/ingestion/service/extraction.service.ts`.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the SYSTEM prompt text, "## Inviolable rules" item 3, lines 121-122
  evidence: '"3. ATOMICITY: one subject–predicate–object assertion = one fragment. Split", "   compound sentences (\"Ana and Bruno joined X\") into one fragment per fact.",'
  cost: The rule that decides how finely a document is cut into information fragments is a sentence in a prompt string and no node states it. It shapes every fragment the system records, so the code becomes the only place it lives. A reader looking in the specification for how extraction grains a claim will not find it.
  correction: An analysis would give the extraction instruction on fragment granularity a node. No node of this file's set holds it, and a search of the specification root for its terms ("atomic", "subject-predicate") found none.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the SYSTEM prompt text, "## Inviolable rules" item 5, lines 128-131
  evidence: '"5. LITERAL vs ENTITY: a literal value of an entity that matches a catalog", "   AttributeKey → `propose_attribute`; an entity matching a NodeType →", "   `propose_node` (+ `propose_link` if a relation is stated). A date, number", "   or string value is NEVER a node.",'
  cost: The rule that a date, number or string is never a knowledge node, and that a literal goes to an attribute and an entity to a node, decides what kinds of records an extraction produces. It lives only in this prompt string. The next reader looks in the specification for what may become a node and does not find it.
  correction: An analysis would give the extraction's choice between attribute and node a node. A search of the specification root for "literal" and "never a node" found no node holding it.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the SYSTEM prompt text, "## Inviolable rules" item 8, lines 136-138
  evidence: '"8. Extract only what the chunk ASSERTS. Do not invent relations the text", "   does not state (people merely mentioned together are not necessarily", "   related). If nothing is extractable, `end_turn` and call no tools.",'
  cost: The limit on what an extraction may infer from co-mention is a policy about which knowledge links the system comes to hold. It is stated only in a prompt string, so it is decided in the code and not in the specification.
  correction: An analysis would give the extraction's assert-only policy a node. A search of the specification root for its terms ("mentioned together", "extractable") found no node holding it.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: the SYSTEM prompt text, worked example, lines 191-192
  evidence: '"  // a document/event is its own node; `concerns` (aboutness, no valid_from) links it to the topic,", "  // `delivered_to` records the recipient. Do NOT leave \"a proposal\" as a bare fragment.",'
  cost: The instruction that a document or event is modelled as its own node, tied to its topic by `concerns` and to its recipient by `delivered_to`, is a modelling choice made only in a prompt string. The nodes found hold the link types' temporality and validity-start requirement (temporal-link-types, start-requiring-link-types), not this choice of modelling.
  correction: An analysis would give the modelling of documents and events as nodes a node. A search of the specification root for "delivered_to" and "concerns" found only the catalog rules about those link types.
- pass: conformance
  file: src/modules/ingestion/service/extraction.service.ts
  where: runChunkLoop, line 466, the system block built for every model call
  evidence: '{ type: "text", text: systemText, cache_control: { type: "ephemeral" } },'
  cost: Marking the system prompt for ephemeral caching is a rule about how the model is called, and it lives only in this line. No node states it, so a reader looking in the specification for how extraction calls the model finds the timeout, the retries and the token ceiling, each in its own node, and does not find this.
  correction: Either a node for how the extraction calls the model holds the caching mark, or the specification states that it is not a domain fact.
- pass: conformance
  file: src/modules/ingestion/service/extraction.service.ts
  where: runChunkLoop, line 487, the request passed to anthropic.messages.stream
  evidence: 'thinking: { type: "adaptive" },'
  cost: The thinking mode the model runs under on every extraction turn is fixed here. The sibling call parameters, the five-minute wait, the two retries and the 8000-token ceiling, each have a node. The thinking mode has none, so changing it would change what the extraction does without reaching any node.
  correction: A node for the extraction's model-call parameters holds the thinking mode.
- pass: conformance
  file: src/modules/ingestion/service/extraction.service.ts
  where: closeRunSafe, lines 672-687, called at lines 371, 386, 394 and 404
  evidence: "} catch {\n    await client.query(\"ROLLBACK\").catch(() => undefined);\n  } finally {"
  cost: When closing the run fails, nothing is logged and nothing is raised. The extraction goes on and answers the run as read back, which can still be running. No node says what an extraction answers when it cannot close its run. The ingestion contract states the fallback only for ingest-document and ingest-directed. The behavior therefore lives only in this swallow.
  correction: The node that holds the extraction's closing of its run, or the run-extraction operation of the ingestion contract, states what is answered when the close fails.
- pass: conformance
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: readsDocumentFirst(), lines 76-82, with FIRST_PRELIMINARY_READING_VERSION at line 31. It gates both the skipped-status path and the read path.
  evidence: "const FIRST_PRELIMINARY_READING_VERSION = 5 as const; ... return (\n    major !== undefined &&\n    Number.parseInt(major, 10) >= FIRST_PRELIMINARY_READING_VERSION\n  );"
  cost: The rule that v4 and earlier make no preliminary reading and record no document context and no status is implemented here, and the node holding it is not bound to this file. If the node moves, for example to a different first version, `--check` does not reach this file. Two homes then answer which prompt versions read the document first.
  correction: Bind rules/knowledge-base/no-document-context-before-v5 to this file in the trace. Code does not read the specification, so the bind is what makes this declaration claimed.
- pass: conformance
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: shouldReadDocument(), lines 84-92, and PRELIMINARY_READING_MAX_CONTENT_UNITS at line 28.
  evidence: "request.chunkCount > 1 &&\n    request.content.length <= PRELIMINARY_READING_MAX_CONTENT_UNITS &&\n    (request.run.document_context === null ||\n      request.run.document_context === undefined)"
  cost: The conditions under which the whole content is read once to produce a context are implemented here, and the node that states them is not bound to this file. The 100000 limit and the more-than-one-chunk condition can change in the node without `--check` reaching this file.
  correction: Bind rules/knowledge-base/document-context-read-first to this file in the trace.
- pass: conformance
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: 'cutSummaryToLines(), lines 94-99. The line-counting half: a trailing newline starts no line, and an empty line counts.'
  evidence: "const lines = summary.split(LINE_BREAK);\n  if (lines[lines.length - 1] === \"\") lines.pop();\n  if (lines.length <= maxLines) return summary;"
  cost: What counts as a line of the summary is implemented here, and the node defining it is not bound to this file. A change to the definition, such as carriage returns ending a line, would not reach this file through `--check`.
  correction: Bind rules/knowledge-base/document-context-summary-lines to this file in the trace.
- pass: conformance
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: 'cutSummaryToLines(), line 98, applied in readDocumentContext() at line 145. The cutting half: an overlong summary is cut to its first lines, and the reading still counts as produced.'
  evidence: 'return lines.slice(0, maxLines).join(LINE_BREAK); ... summary: cutSummaryToLines(reading.summary, SUMMARY_MAX_LINES),'
  cost: The decision to cut an overlong summary, rather than fail the reading, is implemented here. The node recording that decision is not bound to this file, so a reversal in the node does not reach this code.
  correction: Bind rules/knowledge-base/document-context-summary-cut-to-five-lines to this file in the trace.
- pass: conformance
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: keepCatalogEntities(), lines 101-106, applied at line 146.
  evidence: return entities.filter((e) => catalog.nodeTypeByName.has(e.node_type));
  cost: Dropping an entity listed under a node type the catalog does not hold, while keeping the reading as produced, is implemented here. The node holding that decision is not bound to this file, so a reversal in the node does not reach this code.
  correction: Bind rules/knowledge-base/document-context-entity-type-in-catalog to this file in the trace.
- pass: conformance
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: produceDocumentContext(), the catch block at lines 268-274.
  evidence: "try {\n    context = await readDocumentContext(request);\n  } catch (err) {\n    await recordFailedReading(request, err);\n    return null;\n  }"
  cost: The rule that a failed preliminary reading never fails the extraction is implemented here. The node stating it is not bound to this file. If the node changes, so that a failed reading fails the run, this return-null path stays and nothing reports it.
  correction: Bind rules/knowledge-base/failed-preliminary-reading-continues to this file in the trace.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService, the expansion step (lines 247-256), together with scoreMatchedNodes (lines 329-339)
  evidence: '`if (provenance.length === 0) continue;` skips a node hit before it becomes an item. The expansion is then seeded from the items only: `const expanded = await collectExpandedLinks(context, scoreMatchedNodes(items));`, where scoreMatchedNodes does `for (const it of items) { if (it.kind === "node") { matchedById.set(it.id, ...` and never reads `nodeHits`.'
  cost: A knowledge node the node layer matched but that holds no provenance does not seed expansion, and the links around it never appear. The two nodes say only that a search expands "from its matched knowledge nodes" and that a matched node without provenance does not surface. Neither says whether such a node still seeds expansion. That choice lives only in this code, where the next reader will not look for it in the specification.
  correction: Analysis would have to settle whether an unsurfaced matched node seeds expansion. The answer then belongs in rules/knowledge-base/expansion-starts-from-matched-nodes or in rules/knowledge-base/matched-node-requires-provenance.
- pass: standard
  file: src/__tests__/unit/ingestion/document-context-status-recorded-world.ts
  where: poolRecordingStatusInto, lines 51-65 (the casts at lines 58, 63 and 64)
  evidence: 'store.status = params[1] as DocumentContextStatus; [...] } as unknown as PoolClient; return { connect: async (): Promise<PoolClient> => client } as unknown as Pool; (lines 58, 63 and 64; the […] marks the join)'
  cost: The stand-in is declared to be a PoolClient and a Pool with no check that it has the members the service calls. The status read from params[1] is claimed to be a DocumentContextStatus with no narrowing. If the SQL parameter order in recordDocumentContextStatus changes, the compiler stays silent and the test records whatever sits in params[1] as a status.
  cites: TYP-02
  correction: Narrow params[1] with a guard against the DocumentContextStatus values. Build the stand-in through a typed helper that checks the members the code under test uses, instead of a double cast.
- pass: standard
  file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  where: the file's location, src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  evidence: The unit exercised is src/modules/ingestion/service/preliminary-reading.ts (the spec calls statusRecordedOnRun, which calls produceDocumentContext). The test sits at src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts.
  cost: The path does not mirror the unit's path (there is no service/ level and no preliminary-reading name). Someone opening preliminary-reading.ts cannot find its tests by path, and the same behaviour can be tested a second time under another name.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/ingestion/service/preliminary-reading.spec.ts.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
  where: the vi.mock call, lines 9-11
  evidence: "vi.mock(\"../../../modules/ingestion/mcp/propose-fragment.handler.js\", () => ({\n  proposeFragmentHandler: proposeFragmentHandlerMock,\n}));"
  cost: The stand-in replaces the propose-fragment handler, which is where the layered validation and persistence of a proposal lives. It is not the store or the network. The suite therefore never runs the handler's rules against the chunk_ids that dispatchToolUse hands it. The test still passes if the handler stops accepting the single anchored chunk.
  cites: TST-03
  correction: Keep the real handler and stand in only for the boundary beneath it, the pool, as the sibling tests do. Assert on what reaches the store.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
  where: buildDeps, line 26, and proposeWhileReadingChunk, lines 48-50
  evidence: "pool: {} as unknown as Pool, [...] const handed = proposeFragmentHandlerMock.mock.calls.at(-1)?.[0] as\n  | { chunk_ids: readonly string[] }\n  | undefined;\n(lines 26 and 48-50; the […] marks the join)"
  cost: The first cast turns an empty object into a Pool. The second asserts the shape of the arguments the handler received with no guard. If the handler's input shape changes, the test reads chunk_ids from a value that no longer has that shape and fails with a misleading result.
  cites: TYP-02
  correction: Narrow the recorded call with a guard, or parse it with the handler's input schema. Give the pool a typed stand-in.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts
  where: the file's location
  evidence: The unit exercised is src/modules/ingestion/service/extraction.service.ts (__testing__.dispatchToolUse). The test sits at src/__tests__/unit/ingestion/extraction-anchors-to-read-chunk.spec.ts.
  cost: The path does not mirror the unit's path, so the tests of extraction.service.ts cannot be found from the file they cover.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/ingestion/service/extraction.service.spec.ts.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
  where: buildPool, lines 148-157, and textMessage, line 169
  evidence: '} as unknown as PoolClient; return { connect: async (): Promise<PoolClient> => client } as unknown as Pool; [...] } as unknown as Anthropic.Messages.Message; (lines 155-156 and 169; the […] marks the join)'
  cost: The pool, the client and the model message are asserted to be the real types with no check on the members the code under test reads. A new field the service reads from the Message (for example usage) is undefined in the test and the compiler never flags it.
  cites: TYP-02
  correction: Build the Message and the pool stand-in through typed helpers that carry the members the service uses, so a missing member fails at compile time.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
  where: the file's location
  evidence: The unit exercised is src/modules/ingestion/service/extraction.service.ts (runLlmExtraction). The test sits at src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts.
  cost: The path does not mirror the unit's path, so extraction.service.ts has no test file findable from its own path.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/ingestion/service/extraction.service.spec.ts.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts
  where: the file's location
  evidence: The unit exercised is defaultAnthropicFactory in src/modules/ingestion/service/extraction.service.ts. The test sits at src/__tests__/unit/ingestion/extraction-model-call-bounded.spec.ts.
  cost: The path does not mirror the unit's path. The only test of the timeout and retry bounds of defaultAnthropicFactory cannot be found from extraction.service.ts.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/ingestion/service/extraction.service.spec.ts.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  where: buildPool, lines 262-271
  evidence: "const client = {\n  query: async (...args: unknown[]): Promise<QueryResult> => {\n    const sql = String(args[0]).replace(/\\s+/g, \" \").trim();\n    return answer(sql, Array.isArray(args[1]) ? args[1] : [], state);\n  },\n  release: (): undefined => undefined,\n} as unknown as PoolClient; return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;"
  cost: This is the same pool stand-in as buildPool in extraction-chunk-reception-time-and-sequence.spec.ts (lines 148-157). It differs only in the state argument it passes. A fix to how the stand-in normalises the SQL or handles an absent params has to be made in each copy, and the copy nobody remembers keeps the old behaviour.
  cites: MNT-03
  correction: Move the stand-in to one shared test helper, parameterised by the answer function, and import it in both files.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  where: buildPool, lines 269-270
  evidence: '} as unknown as PoolClient; return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;'
  cost: The stand-in is asserted to be a PoolClient and a Pool with no guard. If the service starts calling another member of the client, the test crashes at run time with an undefined call instead of failing to compile.
  cites: TYP-02
  correction: Give the stand-in a typed construction that checks the members the service uses.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts
  where: the file's location
  evidence: The unit exercised is the extraction prompt, src/modules/ingestion/prompts/extraction.v5.ts, reached through runLlmExtraction in extraction.service.ts. The test sits at src/__tests__/unit/ingestion/extraction-other-names-single-instruction.spec.ts.
  cost: The path does not mirror the path of the prompt module under test, so the tests of extraction.v5.ts cannot be found from that file.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/ingestion/prompts/extraction.v5.spec.ts.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-prompt-v5-keeps-v4-catalogs.spec.ts
  where: the file's location
  evidence: The unit exercised is the system function of src/modules/ingestion/prompts/extraction.v5.ts (compared against v4, through selectPromptModule). The test sits at src/__tests__/unit/ingestion/extraction-prompt-v5-keeps-v4-catalogs.spec.ts.
  cost: The path does not mirror the unit's path, so a reader of extraction.v5.ts has no path to follow to the test that guards its v4 catalogue lines.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/ingestion/prompts/extraction.v5.spec.ts.
- pass: standard
  file: src/__tests__/unit/ingestion/preliminary-reading-status-kept-on-reuse.spec.ts
  where: buildPool, lines 41-52
  evidence: "query: async (sql: string, params: unknown[] = []): Promise<{ rows: object[] }> => {\n  if (/SET document_context_status/.test(sql.replace(/\\s+/g, \" \"))) {\n    store.status = params[1] as DocumentContextStatus;\n  }\n  return { rows: [{}] };\n},"
  cost: 'This is the same logic as poolRecordingStatusInto in document-context-status-recorded-world.ts (lines 51-65): the same status-capturing store stand-in, with the same regex and the same params[1] read. A change to the UPDATE statement''s parameter order has to be followed in each copy. The copy that is missed keeps recording the wrong value while its test stays green.'
  cites: MNT-03
  correction: Import the pool stand-in from the shared world file instead of copying it.
- pass: standard
  file: src/__tests__/unit/ingestion/preliminary-reading-status-kept-on-reuse.spec.ts
  where: buildPool, lines 45, 50 and 51
  evidence: 'store.status = params[1] as DocumentContextStatus; [...] } as unknown as PoolClient; return { connect: async (): Promise<PoolClient> => client } as unknown as Pool; (lines 45, 50 and 51; the […] marks the join)'
  cost: The status is claimed to be a DocumentContextStatus with no narrowing, and the stand-in is claimed to be a pool. If the parameter order of the update changes, the store records an arbitrary value that the test then compares as if it were a status.
  cites: TYP-02
  correction: Narrow params[1] with a guard. Type the stand-in through a shared helper.
- pass: standard
  file: src/__tests__/unit/ingestion/preliminary-reading-status-kept-on-reuse.spec.ts
  where: the file's location
  evidence: The unit exercised is src/modules/ingestion/service/preliminary-reading.ts (produceDocumentContext). The test sits at src/__tests__/unit/ingestion/preliminary-reading-status-kept-on-reuse.spec.ts.
  cost: The path does not mirror the unit's path, so the tests of preliminary-reading.ts are spread under behaviour names and cannot be found from the file they cover.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/ingestion/service/preliminary-reading.spec.ts.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
  where: the module-level constants, lines 9 and 11
  evidence: 'const silentLogger = pino({ level: "silent" });

    const emptyCatalog: CatalogSnapshot = {'
  cost: Two module-level constants are camelCase, while every other constant in the file (EXPAND_DEPTH, LINKS, MATCHED_BY_EVERY_LAYER and so on) is screaming snake case. A reader cannot tell from the name that these are fixed fixtures and not per-test variables.
  cites: CON-02
  correction: Rename them to SILENT_LOGGER and EMPTY_CATALOG.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
  where: buildClient, line 279
  evidence: return standIn as unknown as PoolClient;
  cost: The stand-in is claimed to be a PoolClient with no guard. If searchKnowledgeService starts calling a member the stand-in lacks (for example connect or a transaction helper), the failure appears as a runtime TypeError in the test, not as a compile error.
  cites: TYP-02
  correction: Type the stand-in against the members of PoolClient the service uses, so the compiler checks it.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
  where: the file's location
  evidence: The unit exercised is src/modules/query-retrieval/service/search.service.ts (searchKnowledgeService). The test sits at src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts.
  cost: The path does not mirror the unit's path (there is no service/ level and no search.service name), so the search service's tests cannot be found from the file they cover.
  cites: TST-04
  correction: Place the file at the path that mirrors the unit under test, for example src/__tests__/unit/query-retrieval/service/search.service.spec.ts.
- pass: standard
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: function system, lines 66-199
  evidence: "export function system(catalog: CatalogSnapshot): string { [...]\n  ].join(\"\\n\");\n} (lines 66 and 197-199; the […] marks the join)"
  cost: The function runs 134 lines. It builds the node-type list, the link-type list, the attribute section and the whole instruction text in one body. The prose of the rules and the code that assembles the catalogue cannot be read or changed apart.
  cites: MNT-01
  correction: Extract named helpers (the attribute-key section builder, the catalogue renderer) and keep the fixed instruction text in a named constant.
- pass: standard
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: function user, lines 220-253
  evidence: "export function user(\n  args: UserPromptArgs\n): Anthropic.Messages.TextBlockParam[] {"
  cost: The function runs 34 lines (the limit is thirty). The metadata, continuity and document blocks are built inline, so a change to one block means reading all three.
  cites: MNT-01
  correction: Extract one helper per block (metadata, continuity, document), and let user compose them.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: import of ResourceNotFoundError, line 39
  evidence: import { ResourceNotFoundError } from "./ingestion.service.js";
  cost: extraction.service.ts imports ingestion.service.ts, so the extraction service now depends on the intake service's module and on whatever that module imports. The error type is part of a sibling service's surface, and it is invisible where each service opens its transactions.
  cites: LAY-04
  correction: Move ResourceNotFoundError to a shared errors module (as the sibling modules do with errors.ts), and import it from there.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: the error classes, lines 57, 77 and 97
  evidence: public readonly statusCode = 409; [...] public readonly statusCode = 502; [...] public readonly statusCode = 500; (RunNotRunnableError, LlmProviderFatalError and ExtractionFatalError; the […] marks the joins)
  cost: The service raises errors that already carry an HTTP status. Used from a transport that has no HTTP status (the MCP tool path or a job), the service still dictates a status code. The mapping is not left to the error middleware, which is the single place that maps errors to transports.
  cites: COR-03
  correction: Keep the errors as business errors (code and data) and let the error middleware map each code to a status.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: the catch in runLlmExtraction, lines 381-402
  evidence: 'const cause = err instanceof Error ? err.message : String(err); [...] throw new LlmProviderFatalError(llmRunId, cause, partial); [...] throw new ExtractionFatalError(llmRunId, cause, partial); (lines 387, 392 and 401; the […] marks the joins)'
  cost: The catch rethrows a wrapper but passes only err.message, never the original error as its cause. The wrapper's constructor takes a string (causeMessage, reason). The original stack and driver error codes are lost, so a failure in the middle of extraction can only be traced back through the one log line.
  cites: COR-01
  correction: 'Pass the original error through as the cause of the wrapper (new Error(message, { cause: err }) in the three classes).'
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: the error classes LlmProviderFatalError and ExtractionFatalError, lines 87-88 and 107
  evidence: '`Anthropic SDK fatal error during LLMRun ${llmRunId}: ${causeMessage}.` [...] super(`Extraction fatal failure for LLMRun ${llmRunId}: ${reason}.`); (lines 88 and 107; the […] marks the join)'
  cost: 'The message of these errors embeds the raw message of whatever exception was caught: the provider''s error text, or a pg or internal exception message (line 396 passes any err.message). The classes carry a statusCode and a code, so they are meant to leave the service. If the error middleware renders the message, a driver or SDK detail reaches the client. This file does not show how the message is rendered.'
  cites: SEC-04
  correction: Keep the raw cause in the log and in the error's cause, and give the error a fixed message with no interpolated internal text.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: closeRunSafe, lines 672-687
  evidence: "} catch {\n  await client.query(\"ROLLBACK\").catch(() => undefined);\n} finally {"
  cost: The catch rolls back and then discards the error. If closing the run fails (BEGIN, the update or COMMIT), the caller continues as though the run were closed (for example it goes on to read the final run), and nothing is logged. A run left in the running state is only discovered later.
  cites: COR-01
  correction: Log the failure with the run id, or rethrow it wrapped with the original as the cause, so the caller sees that the close did not happen.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: dispatchToolUse, lines 155-217, the safeParse calls at lines 167, 176, 186 and 197
  evidence: "async function dispatchToolUse(\n  toolName: string,\n  rawInput: unknown,\n[...]\n  const parsed = ProposeFragmentInputSchema.safeParse(withChunk);\n  if (!parsed.success) return zodErrorEnvelope(parsed.error.issues);\n(lines 155-157 and 167-168; the […] marks the join)"
  cost: The service takes the model's raw tool arguments as unknown and validates them itself. Every path that reaches the handlers (the REST route, the MCP tool, this loop) now validates in its own place. This service also invents its own error envelope (VALIDATION_INVALID_FORMAT, "Input failed Zod parse."), which can drift from the boundary's. The rule speaks of a raw request body. The model's tool_use input is the nearest equivalent here, and this file does not show a boundary that validates it first.
  cites: DTO-01
  correction: Parse the tool input at a boundary that both transports share, and hand the service a typed DTO.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: dispatchToolUse, lines 163-165 and the four handler casts at lines 173, 183, 194 and 205
  evidence: '...(rawInput as Record<string, unknown>), [...] })) as McpEnvelope<Record<string, unknown>>; (lines 164 and 173; the same cast repeats at 183, 194 and 205; the […] marks the join)'
  cost: rawInput is unknown and is spread as a record with no check that it is an object. The four handler results are claimed to be an envelope of a loosely typed record, so the handlers' result types and this envelope can diverge with no compile error.
  cites: TYP-02
  correction: Narrow rawInput with a guard (a plain-object check) before the spread. Let the handler result types flow to the envelope, or map them through a typed function.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: defaultAnthropicFactory, line 145
  evidence: '}) as unknown as AnthropicLike;'
  cost: The real SDK client is claimed to be AnthropicLike through unknown, so the compiler stops checking that stream accepts the requests and returns what the code reads. An SDK upgrade that changes stream breaks at run time inside a chunk.
  cites: TYP-02
  correction: Adapt the SDK client through a small typed function that returns the AnthropicLike members, instead of the double cast.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: buildTool and stripProperty, lines 250-253, 260, 270 and 275
  evidence: 'let schema = IngestToolInputJsonSchemas[name] as unknown as Record< [...] input_schema: schema as unknown as Anthropic.Messages.Tool.InputSchema, [...] clone.required = (clone.required as string[]).filter((r) => r !== prop); (lines 250, 260 and 275; the […] marks the joins)'
  cost: The JSON schema is cast to a record and then to the SDK's InputSchema, and required is cast to string[] after only an Array.isArray check, which does not check the elements. A schema whose shape differs reaches the model unnoticed, and the tool is advertised wrongly.
  cites: TYP-02
  correction: Type the schemas as the SDK's InputSchema where they are defined. Strip chunk_ids through a typed helper, with a guard on required.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: dispatchToolUse, lines 155-217
  evidence: "async function dispatchToolUse(\n  toolName: string,\n  rawInput: unknown,\n  deps: DispatchDeps,\n  chunkId: string\n): Promise<McpEnvelope<Record<string, unknown>>> {"
  cost: 'The function runs 63 lines and takes four positional parameters (limit: thirty lines, three parameters). It holds four near-identical cases. Adding a tool means adding a fifth block to an already long switch.'
  cites: MNT-01
  correction: Pass an object for the parameters. Replace the cases with a table of tool name to schema-and-handler entries.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runLlmExtraction, lines 297-439
  evidence: "export async function runLlmExtraction(\n  pool: Pool,\n  llmRunId: string,\n  logger: Logger,\n  catalog: CatalogSnapshot,\n  deps: RunExtractionDeps\n): Promise<LlmRunResponse> {"
  cost: 'The function runs 143 lines and takes five positional parameters (limits: thirty lines, three parameters). Loading, prompt selection, preliminary reading, the chunk loop, the three failure paths, closing and affected-node resolution share one body. A change to any one of them means holding all the others in view.'
  cites: MNT-01
  correction: Pass an object for the parameters. Extract the failure handling, the chunk loop and the affected-node resolution into named helpers.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: runChunkLoop, lines 463-581
  evidence: 'async function runChunkLoop(input: ChunkLoopInput): Promise<ChunkLoopOutcome> {'
  cost: The function runs 119 lines. It handles the stop reasons, dispatches each tool call, tracks the error burst and builds the tool results inside one loop. The burst bookkeeping (consecutiveErrors, burstReset) is interleaved with dispatch and is hard to follow.
  cites: MNT-01
  correction: Extract the stop-reason handling, the per-block dispatch-and-tally step and the tool-result construction into named helpers.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: loadRunContext, lines 615-664
  evidence: "async function loadRunContext(\n  pool: Pool,\n  llmRunId: string\n): Promise<LoadedRunContext> {"
  cost: The function runs 50 lines. Fetching the three rows, mapping the metadata and shaping the result all happen in one body.
  cites: MNT-01
  correction: Extract the metadata mapping and the result shaping into named helpers.
- pass: standard
  file: src/modules/ingestion/service/extraction.service.ts
  where: readFinalRun, lines 689-722
  evidence: "async function readFinalRun(\n  pool: Pool,\n  llmRunId: string,\n  affectedNodes?: readonly AffectedNode[]\n): Promise<LlmRunResponse> {"
  cost: The function runs 34 lines (limit thirty). The query and the shaping of the response are in the same body.
  cites: MNT-01
  correction: Extract the response shaping into a named function.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: import of the knowledge-graph module, lines 4-9
  evidence: "import {\n  TRAVERSAL_DECAY,\n  traverseNodes,\n  type CatalogSnapshot,\n  type TraverseNodesResult,\n} from \"../../knowledge-graph/index.js\";"
  cost: traverseNodes is exported by that index from ./service/traversal.service.js. The search service calls another module's service function with its own client. Which transaction the traversal runs in is decided inside the callee and is not visible here.
  cites: LAY-04
  correction: Move the traversal logic to a domain module or repository that both services call, or compose the two from a factory above them.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService, lines 109-292, and resolveLayers, lines 466-480
  evidence: "readonly layers?: readonly string[]; [...] if (!(ALLOWED_LAYERS as readonly string[]).includes(layer)) {\n  throw new InvalidSearchLayerError(layer);\n} (lines 49 and 474-476; the […] marks the join)"
  cost: The service accepts layers as untyped strings and checks them against ALLOWED_LAYERS itself. The same check has to be repeated by every other caller, and a caller that skips it reaches the service with an unvalidated value. The DTO type is not what carries the guarantee.
  cites: DTO-01
  correction: Type layers as SearchLayer[] in the DTO, validate it with the schema at the route, and drop resolveLayers' membership check.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService, lines 109-292
  evidence: "export async function searchKnowledgeService(\n  client: PoolClient,\n  catalog: CatalogSnapshot,\n  input: SearchServiceInput,\n  logger: Logger\n): Promise<SearchResponse> {"
  cost: 'The function runs 184 lines and takes four positional parameters (limits: thirty lines, three parameters). Layer queries, fragment and node item building, expansion, filtering, paging, logging and response shaping share one body. The fragment and node loops are visibly similar and sit apart from the helpers that already exist below.'
  cites: MNT-01
  correction: Pass an object for the parameters. Extract the fragment-item builder and the node-item builder next to the existing expansion helpers.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: toExpandedLinkItem, lines 422-464
  evidence: "function toExpandedLinkItem(\n  context: ExpansionContext,\n  candidate: ExpandedLink,\n  lookups: LinkLookups\n): IntermediateItem | undefined {"
  cost: The function runs 43 lines. Metadata lookup, the empty-provenance warning, the uncertain filter and the item construction are all in one body, so the three early-return conditions are hard to tell apart.
  cites: MNT-01
  correction: Extract the empty-provenance check and the item construction into named helpers.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: lines 269 and 437
  evidence: 'route: "GET /api/v1/search", [...] route: "GET /api/v1/search", (line 269 in searchKnowledgeService and line 437 in toExpandedLinkItem; the […] marks the join)'
  cost: The route label is spelled out in two places. If the route path changes, one of the two log fields keeps the old path and the logs split the same route into two.
  cites: TYP-04
  correction: Name the label once as a constant and use it in both log calls.
- pass: standard
  file: src/modules/ingestion/service/preliminary-reading.ts
  where: recordProducedContext, lines 151-182
  evidence: "async function recordProducedContext(\n  pool: Pool,\n  llmRunId: string,\n  context: DocumentContext\n): Promise<void> {"
  cost: The function runs 32 lines (the limit is thirty). The transaction handling (BEGIN, COMMIT, ROLLBACK and the discard of the connection) is mixed with the two writes, so the transaction mechanics and the business step cannot be read apart.
  cites: MNT-01
  correction: Extract the transaction wrapper (begin, commit, rollback, release) into a named helper and keep the two writes in a short body.
---
## What it is
This review answers the 8 proof tasks of epic close-testable-remainders delivered by the run prove-aliases-fuzzy-context, over the 14 files their implementation and proof records name; each task wrote tests only over an implementation that already stood.
Its captured run is run/close-testable-remainders-link-and-fragment-items-carry-no-match-suite, the last full suite, which passed over the tree holding all 8 deliveries, so the failures pass had nothing to read.
The conformance pass ran one judge per file and its returns were folded into siegard-reconcile/prove-aliases-fuzzy-context-review.md and bound into the trace.
The certification pass ran one coverage auditor per node a proof claims to demonstrate, 8 in all.

## Notes
The coverage pass was handed the criteria of all 9 tasks the plan holds and answered for one criterion of task/close-testable-remainders/prompt-version-known, which has no record and is not under review; that entry was left out of the record, because the review answers for the 8 tasks it names.
The certification pass returned 1 node covered (extraction-asks-for-other-names), 6 partial with a testable remainder and 1 uncovered with a testable remainder (extraction-anchors-to-read-chunk); every return is in siegard-reconcile/prove-aliases-fuzzy-context-review.returns.
The task task/close-testable-remainders/prompt-version-known stays in the plan with no record: its proof was not delivered, because the contract contracts/knowledge-base/ingestion already states that a refused prompt version answers SYSTEM_INTERNAL_ERROR carrying the failed run.
