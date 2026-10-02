---
target: backend
title: Review of the review-proofs initiative
summary: The conformance, coverage, standard and certification judgments over the five files the three review-proofs tasks stand on or wrote, with the run of the registry's steps.
reviewed:
- src/modules/query-retrieval/service/search.service.ts
- src/modules/ingestion/prompts/extraction.v4.ts
- src/modules/ingestion/prompts/extraction.v1.ts
- src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
- src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
tasks:
- task/proof-owed/expansion-decay-target-end
- task/proof-owed/search-item-flags-provenance
- task/proof-owed/v4-module-directive
passes:
- pass: coverage
- pass: conformance
- pass: failures
  missing: run/review-proofs passed; there was no failure to read
- pass: standard
coverage:
- criterion: 'Input: one matched node scored s, a link whose target is that node, and a further link walked the same way beyond it. Expected result: the first link scores 0.5 times s at hop 1, and the second scores 0.25 times s at hop 2.'
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link whose target is the matched node at 0.5 times its score at hop 1, and the link beyond it walked the same way at 0.25 times at hop 2
  why: The test matches node-a at 0.8, reaches link-t1 (node-b -> node-a) and link-t2 (node-c -> node-b), and checks that their scores are exactly 0.4 and 0.2. If the walk through the target end stopped, the test would fail because it could not find the link item. If the decay changed, the test would fail on the score. The test does not check the item's own `hop` field for link-t1 or link-t2. This only matters if "at hop 1" and "at hop 2" are read as claims on that field. If they are read as saying where each link sits, nothing is missing. The separate hop-numbering test only shows hop 1 for a target-end link (link-in). It never shows hop 2 for a chain walked the same way through target ends.
- criterion: A search whose matched item has confidence in the uncertain band should answer that item with flags holding only assertion-flag values, including the expected one.
  state: partial
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers a link whose confidence is in the uncertain band with the uncertain flag and no other
  why: 'The only item tested at uncertain-band confidence (0.6) is link-u. That link is reached by expansion from the matched node node-a. Nothing the query matches directly is tested at uncertain-band confidence. The fixture''s directly matched fragment has confidence 0.92, and matched nodes carry no confidence in the fixture. So the case of a matched item in the uncertain band is never run. That holds only if "matched item" means an item the query matched. If it means any item in the answer, this test holds the criterion. That word decides the state, and the criterion does not say which reading it means. The fixture also sets link-u''s status to "uncertain" together with the confidence. So the test cannot tell a flag taken from confidence apart from a flag taken from status. Over-assertion: `toEqual(["uncertain"])` says the flags are exactly that one value. The criterion only asks for assertion-flag values that include the expected one. If another assertion flag were legitimately added, the test would break even though the criterion still holds.'
- criterion: For every item of each kind, each provenance entry should name an information fragment that exists in the world and supports that item.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: names, in every entry of a node, a link and a fragment item, only fragments that support that very item
  why: 'The test covers nodes, links and fragments, and gives each item its own separate set of supporting fragments. So if a fragment id were invented, or one item''s provenance were attached to another item, the test would fail. Over-assertion: the expected object has exactly five keys (node-a, node-x, link-1, link-x1, fragment-1). This also asserts that the answer holds exactly those five items. The criterion makes no claim about which items are answered. If an extra item were legitimately answered, for example an expanded endpoint node, the test would fail even though the criterion still holds.'
- criterion: A matched node for which no supporting fragment exists, against the expected result that no item is answered with an empty provenance.
  state: covered
  tests:
  - file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers no item with an empty provenance
- criterion: 'Calling `selectPromptModule("v4").user` with metadata whose `document_date` is a real date, for example 2026-05-10, yields a metadata block containing `- document_date: 2026-05-10`, next to the existing assertion for the null case.'
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: shows the reception time and a real document date in the user message, and (unknown) when the source has none
  - file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4.user() surfaces received_at and an unknown document_date in the metadata block
- criterion: '`selectPromptModule("v4").system(snapshot)`, the module a v4 extraction is given, contains a directive whose subject is a relative date in the chunk, resolved against `document_date` when present and otherwise against the date portion of `received_at`.'
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: asks, in the system prompt it hands out, to resolve a relative date in the chunk against the document date when present and otherwise against the date portion of received_at
  - file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 asks the model to resolve a relative date against the document date when present and otherwise against the date portion of received_at
  why: 'Only the first test goes through `selectPromptModule("v4")`. The second calls the v4 module directly, so it would still pass if the registry handed out a different module. The registry test''s regex requires "relative date in the chunk", then `document_date` before any `received_at`, then the date portion of `received_at`. Between those two dates it accepts any one of the words otherwise, unknown, absent, missing, not present, fall back or fallback, found anywhere. So the order of the two dates is bound. The "when present ... otherwise" condition is not tied to its sense: a directive with that condition reversed, but still using one of those words, would pass. The delta is computed by removing the v3 text with `replace`. If v4 ever stopped containing v3 verbatim, the regex would search the whole v4 prompt instead of the directive alone.'
unpaired:
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: declares PROMPT_VERSION 'v4'
  asserts: The v4 module's PROMPT_VERSION export equals "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: differentiates v4 from v3 by appending to the v3 system prompt
  asserts: The registry's v4 system prompt differs from the v3 one and starts with it.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: dispatches 'v4' to the v4 module
  asserts: selectPromptModule("v4").version equals "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: does not ask, in the system prompt it hands out, to state the basis received for a date taken from the reception fallback
  asserts: The registry's v4 system prompt, after the v3 text is removed, is non-empty and does not name a "received" basis (quoted "received", or "basis received", not followed by `_at`).
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: keeps v1, v2 and v3 registered
  asserts: selectPromptModule returns modules whose version is "v1", "v2" and "v3" for those three keys.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: recommends v4 for new runs
  asserts: DEFAULT_PROMPT_VERSION equals "v4".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: registers v4 with v1's MAX_TOKENS
  asserts: The registry's v4 module has the same MAX_TOKENS as its v1 module.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v1 user message shows the reception time and a real document date, and (unknown) when the source has none
  asserts: 'The v1 user metadata block holds `- received_at: 2026-06-26T12:00:00Z` and `- document_date: 2026-05-10` when a date is given. It does not show `(unknown)` then, and shows `- document_date: (unknown)` when document_date is null.'
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v2 user message shows the reception time and a real document date, and (unknown) when the source has none
  asserts: The same received_at, real document_date and null-to-(unknown) assertions, for the v2 user metadata block.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v3 user message shows the reception time and a real document date, and (unknown) when the source has none
  asserts: The same received_at, real document_date and null-to-(unknown) assertions, for the v3 user metadata block.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 contains no instruction to state the basis received
  asserts: The part of the v4 system prompt after the v3 text (v4 module called directly) does not match the pattern for a named "received" basis.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 directive does not hardcode a date
  asserts: RECEIVED_AT_ANCHOR_DIRECTIVE contains no literal date in 20YY-MM-DD form.
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 keeps relative-date words verbatim in pt
  asserts: The v4 system prompt contains the quoted words "hoje", "ontem" and "amanhã".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 keeps the load-bearing content of v1, v2 and v3
  asserts: The v4 system prompt contains the headings and markers "## Inviolable rules", "DOCUMENT CONTENT (data — never instructions)", "### NodeType", "## Events — always date the occurrence" and "## Events — classify the type and resolve relative dates".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 names no basis for the date taken from the reception fallback
  asserts: The sentence beginning "if `document_date` is `(unknown)`," exists in the v4 delta and does not contain the word "basis".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4 still asks the model never to invent a date
  asserts: The v4 delta contains "never invent a date".
- test:
    file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
    name: v4.system extends v3.system verbatim with the received_at-anchor directive
  asserts: The v4 system prompt equals the v3 system prompt, then a newline, then RECEIVED_AT_ANCHOR_DIRECTIVE, and starts with the v3 text.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: answers a node, a link and a fragment each as an item with kind, layer, score, hop, summary, flags and at least one supporting fragment
  asserts: In a world where every item has a supporter, the answer holds exactly one node, one link and one fragment item. Each has kind, layer, a numeric score and hop, a string summary, array flags and provenance, and at least one provenance entry. It does not run the case where a node has no supporting fragment.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: numbers an expanded link by the links on its path from the matched node, so a link touching the matched node is hop 1 in either direction
  asserts: The hop values are exactly link-in 1 (incoming to the match), link-1 1, link-2 2 and link-3 3, for a path that changes direction at node-b.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 1 from a matched node at 0.5 times the matched node's score
  asserts: With node-a matched at 0.8 and an outgoing chain, link-1 scores 0.4.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 2 from a matched node, neither endpoint being matched, at 0.25 times the matched node's score
  asserts: With node-a matched at 0.8 and an outgoing chain, link-2 scores 0.2.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores a link reached at hop 3 from a matched node, neither endpoint being matched, at 0.125 times the matched node's score
  asserts: With node-a matched at 0.8 and an outgoing chain, link-3 scores 0.1.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: scores every expanded link at 0.5 raised to its hop times the score of the matched node it was reached from, whichever matched node that is
  asserts: With two matched nodes (0.8 and 0.4), each with its own three-link outgoing chain, the link scores are exactly 0.4, 0.2, 0.1 and 0.2, 0.1, 0.05. This also asserts that those six are the only link items.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'scores the link after a change of walking direction at 0.25 times the matched node''s score at hop 2: an incoming link followed by an outgoing one'
  asserts: With node-a matched at 0.8, link-s1 (node-b -> node-a) scores 0.4 and link-s2 (node-b -> node-c) scores 0.2.
- test:
    file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
    name: 'scores the link after a change of walking direction at 0.25 times the matched node''s score at hop 2: an outgoing link followed by an incoming one'
  asserts: With node-a matched at 0.8, link-s1 (node-a -> node-b) scores 0.4 and link-s2 (node-c -> node-b) scores 0.2.
findings:
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: The header comment, lines 22-24, and the doc comment on the `prevTail` field of `UserPromptArgs`, line 211.
  evidence: '"// `prev_tail` carries the last ≤ `PREV_TAIL_CHARS` (200) characters of the" and "/** Last ≤ 200 chars of the previous chunk (continuity); empty on chunk_index = 0. */"'
  cost: The 200-character tail is stated in two comments of this file as well as in the rule and in code. If the rule moves, no `--check` reaches this prose, and a reader can take the comment for the place the figure was decided.
  correction: Remove both pieces of prose. The code that holds the fact is `PREV_TAIL_CHARS = 200 as const` at line 377 of /home/siegfriedneto/projects/eternal/backend/src/modules/ingestion/service/extraction.service.ts, where the tail is cut with `chunk.text.slice(-PREV_TAIL_CHARS)`. This file does not hold the figure in code.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: The doc comment on the `source_type` field of `DocumentMetadata`, line 45.
  evidence: '"/** §3.1 source_type enum value (pdf, email, ata, chat, artigo, transcricao, outro). */"'
  cost: The comment lists the enumeration a second time, in the material's old words. The node holds the values as pdf, email, meeting-minutes, chat, article, transcript and other, so a reader of the comment learns a vocabulary that differs from the node's. The field itself is typed `string`.
  correction: Remove the comment. Code holds the enumeration in /home/siegfriedneto/projects/eternal/backend/src/modules/ingestion/dto/source-type.ts, which lists "transcricao" among its values.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: The doc comment on `system()`, lines 61-64.
  evidence: '"The validation layer rejects anything outside this list with the corresponding `BUSINESS_UNKNOWN_{NODE_TYPE|LINK_TYPE|ATTRIBUTE_KEY}` code (BR-14)."'
  cost: The refusal codes are stated in prose here as well as in the refusal contracts and in code. A change to a code name leaves this comment unchanged and misleading.
  correction: Remove the sentence. Code holds the codes in /home/siegfriedneto/projects/eternal/backend/src/modules/ingestion/validation/structural.ts, lines 110-113, and in /home/siegfriedneto/projects/eternal/backend/src/shared/error-mapping.ts, lines 96-98. This file has no refusal code of its own.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: 'The catalog section of the SYSTEM prompt built by `system()`: the `nodeTypes` and `linkTypes` maps and sorts, lines 67-77, and the emitted "## Catalog (read-only)" lines, 157-169.'
  evidence: '".map((lt) => ({ name: lt.name, temporal: lt.is_temporal, allowsMultipleCurrent: lt.allows_multiple_current, requiresValidFrom: lt.requires_valid_from, })).sort((a, b) => a.name.localeCompare(b.name))" and "` [temporal=${lt.temporal}, multi_current=${lt.allowsMultipleCurrent}, requires_valid_from=${lt.requiresValidFrom}]`" and "`  - ${nt.name}${nt.description ? ` — ${nt.description}` : ""}`"'
  cost: What the extraction prompt tells the model about the catalog is a decision no node holds. That covers which attributes of each link type are shown, node types shown with their descriptions, attribute keys shown with value type and a temporal marker, and every list sorted by name. Only the closed-values listing (extraction-prompt-lists-closed-values, extraction-prompt-values-ascending and extraction-prompt-values-verbatim) is held. The chat prompts do have a node for this (rules/chat/chat-prompt-presents-catalog), so a reader who looks in the specification for the extraction counterpart finds nothing and only the code answers.
  correction: 'Analysis would give the extraction prompt''s catalog presentation a node: what is shown for node types, link types and attribute keys, and in what order. Only the closed-values order and spelling have one today.'
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v4.ts
  where: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 22-23, the examples of relative-date words in the prompt text
  evidence: '"  `\"amanhã\"`, `\"semana que vem\"`, `\"esta semana\"`, similar pt-BR temporal",'
  cost: The prompt tells the model that "semana que vem" and "esta semana" are relative dates to resolve, and no node says so. The specification names only "hoje", "ontem" and "amanhã". Someone changing which words count as relative dates would look in the specification, find three words, and miss that the prompt carries two more.
  correction: The analysis would have to decide whether "semana que vem" and "esta semana" belong to the v4 relative-date vocabulary and give that a node, or the prompt would have to carry only the three words the node holds.
- pass: conformance
  file: src/modules/ingestion/prompts/extraction.v4.ts
  where: RECEIVED_AT_ANCHOR_DIRECTIVE, lines 24-25 and 29-30, the basis the prompt asks for on a relative date resolved against the document date and on an absolute date
  evidence: '"  deictics), resolve it AGAINST `document_date` if it is present (basis", "  `\"document\"`). If `document_date` is `(unknown)`, fall back to the date", ... "- The rule applies ONLY to relative dates. Absolute dates stated in the chunk", "  text remain `\"stated\"`; never invent a date.",'
  cost: The prompt tells the model which basis to give a relative date ("document") and an absolute date ("stated"). The node for the anchor fallback leaves the basis out, and its log records that it was withdrawn deliberately. The only node that names basis document is the go-live scenario, and that covers an event_date proposal. This basis rule therefore lives only in the prompt text. A reader checking what the model is asked to state for a relative date will not find it in the specification.
  correction: The analysis would have to decide which basis an extraction asks for on a relative date resolved against the document date, and on an absolute date, and give that a node. The relative-date node as it stands names only the anchor.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: 'searchKnowledgeService, lines 195-239: the node loop skips provenance-less nodes, and the expansion seeds are taken from the surviving node items'
  evidence: '`if (provenance.length === 0) continue;` ... `if (input.expand && nodeHits.length > 0) {` ... `const expanded = await collectExpandedLinks(context, scoreMatchedNodes(items));` where `scoreMatchedNodes` keeps every `it.kind === "node"` item. The `includeUncertain` filter runs only afterwards, at `const filtered = input.includeUncertain ? items : items.filter((it) => it.status !== "uncertain");`'
  cost: Two choices sit only in this code. A matched node without provenance never seeds an expansion. A matched node with status uncertain does seed one when the query excludes uncertain items, so links hang off a node the search itself hides. The specification says only that a search expands "from its matched knowledge nodes". A reader looking there finds neither choice, and a change to which nodes seed the expansion would be made in this function without anyone knowing a decision was involved.
  correction: Analysis would have to state, in expansion-starts-from-matched-nodes or a sibling node, whether a matched node that does not surface (no provenance, or uncertain while uncertain items are excluded) still seeds the expansion.
- pass: conformance
  file: src/modules/query-retrieval/service/search.service.ts
  where: computeFlags, line 473 (the value emitted for the low-confidence flag)
  evidence: '`flags.push("low_confidence");`. The governing node domain/knowledge-base/assertion-flag lists `values: - uncertain - disputed - low-confidence`, and rules/knowledge-base/item-flags says "low-confidence when it is an accepted information fragment whose confidence is below 0.4".'
  cost: The flag value a search item carries is spelled `low_confidence`, and the enumeration the node holds spells it `low-confidence`. Someone reading the specification to learn what a client receives gets a value the system never emits. Other nodes (curation, ingestion) do spell `low_confidence`, so the specification itself is not consistent about which spelling is the decided one.
  correction: Either the code emits the node's `low-confidence`, or the assertion-flag node is brought to the spelling the system emits. That choice is for the person who owns the enumeration. The type `AssertionFlag` itself is declared in response.dto.ts, outside this file set.
- pass: standard
  file: src/__tests__/unit/ingestion/extraction-prompt-v4.spec.ts
  where: the it() at lines 196-204 and the it.each body at lines 206-217
  cites: MNT-03
  evidence: 'Line 197-203 (v4 case) reads: `const withDate = metadataBlockText("v4", REAL_DOCUMENT_DATE);` `const withoutDate = metadataBlockText("v4", null);` `expect(withDate).toContain(`- received_at: ${RECEIVED_AT}`);` `expect(withDate).toContain(`- document_date: ${REAL_DOCUMENT_DATE}`);` `expect(withDate).not.toContain("- document_date: (unknown)");` `expect(withoutDate).toContain("- document_date: (unknown)");`. The it.each body at lines 209-215 repeats the same six statements, differing only in `version`.'
  cost: The metadata-block claim is written twice in one file. If the block's wording changes, the v4 case and the v1-v3 cases must both be edited, and a reader of one has no way to know the other carries the same claim.
  correction: Run the v4 case through the same it.each, with the versions ["v1", "v2", "v3", "v4"], so the claim exists once.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: buildClient, lines 254-261
  cites: TYP-02
  evidence: '`return standIn as unknown as PoolClient;` (standIn is `{ query: ..., release: ... }`)'
  cost: The double assertion removes the compiler's check that the stand-in satisfies the part of PoolClient the service uses. If the service starts calling another PoolClient member (for example `connect`), the test fails at runtime with "is not a function" instead of failing to compile. Nothing narrows the cast.
  correction: Narrow the stand-in with a guard, or type it against a Pick of PoolClient with the members the service uses, so the compiler keeps checking it.
- pass: standard
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  where: respondToSearchLayers, lines 147-179
  cites: MNT-01
  evidence: '`function respondToSearchLayers(world: World, sql: string): Rows | undefined {` ... `  return undefined;` `}` (lines 147-179, 33 lines)'
  cost: The function mixes three SQL branches (the tsquery parse, the alias layer and the fragment layer) in one body. A fourth layer would add a fourth branch to it instead of a new function.
  correction: Split it into one responder per layer, as respondToProvenance and respondToGraph already are.
- pass: standard
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: system(), lines 66-199
  cites: MNT-01
  evidence: '`export function system(catalog: CatalogSnapshot): string {` ... `].join("\n");` `}` (lines 66-199, 134 lines)'
  cost: One function holds the catalog grouping, the attribute-section formatting and the whole prompt text. Changing one prompt section means opening a 134-line body, and v2 to v4 build on this function's output.
  correction: Extract named helpers for the catalog sections (node types, link types, attribute keys), and keep the static prompt text as constants.
- pass: standard
  file: src/modules/ingestion/prompts/extraction.v1.ts
  where: user(), lines 220-253
  cites: MNT-01
  evidence: '`export function user(` `  args: UserPromptArgs` `): Anthropic.Messages.TextBlockParam[] {` ... `}` (lines 220-253, 34 lines)'
  cost: The function builds the metadata, continuity and document blocks inline, so each block is edited inside one body that is over the limit.
  correction: Extract one helper per block (metadata, continuity, document).
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: imports, lines 4-9 (traverseNodes)
  cites: LAY-04
  evidence: '`import {` `  TRAVERSAL_DECAY,` `  traverseNodes,` ... `} from "../../knowledge-graph/index.js";` The barrel re-exports it from the service file: `export { traverseNodes } from "./service/traversal.service.js";`'
  cost: search.service.ts calls traverseNodes, a service of the knowledge-graph module, through the barrel, and passes the same client to it. The traversal's transaction and read-consistency boundary is hidden inside the search service's flow. The barrel also hides from a reader of this file that the import is service to service.
  correction: Move the traversal behavior into a domain module, or compose both from a factory, so the search service does not import traversal.service.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: searchKnowledgeService, lines 92-280
  cites: MNT-01
  evidence: '`export async function searchKnowledgeService(` `  client: PoolClient,` `  catalog: CatalogSnapshot,` `  input: SearchServiceInput,` `  logger: Logger` `): Promise<SearchResponse> {` ... `  return response;` `}` (lines 92-280, about 189 lines, four positional parameters)'
  cost: Layer fetching, deduplication counting, fragment and node item building, expansion, filtering, sorting, paging and logging live in one body. The fragment and node blocks (lines 159-228) are two near-identical loops. A new layer or filter becomes another branch in a function nobody can hold in their head. The four positional parameters exceed the limit of three.
  correction: Extract named helpers for the layer fetch, the fragment items, the node items and the page and log step, as the expansion code already does. Pass client, catalog and logger as an object.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: status literals "accepted" and "uncertain", lines 174, 189, 243, 383, 466, 469
  cites: TYP-04
  evidence: '`status: "accepted",` (lines 174 and 189); `items.filter((it) => it.status !== "uncertain")` (line 243); `meta.status === "uncertain"` (line 383); `args.status === "uncertain"` (line 466); `args.status === "accepted" &&` (line 469)'
  cost: The same status values are spelled out in six places in one file. A rename or a new status means finding every occurrence, and one missed occurrence silently changes which items the uncertain filter and the flags see.
  correction: Name the status values once (for example as constants or a typed union) and use them at each site.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: route literal in the logger payloads, lines 257 and 374
  cites: TYP-04
  evidence: '`route: "GET /api/v1/search",` (line 257 and, inside the warn payload, line 374)'
  cost: The route name is spelled in two places in this file. If the route changes, the success log and the empty-provenance warning can disagree about which route they belong to, which breaks a log query that filters on it.
  correction: Hold the route label in one named constant.
- pass: standard
  file: src/modules/query-retrieval/service/search.service.ts
  where: toExpandedLinkItem, lines 359-400
  cites: MNT-01
  evidence: '`function toExpandedLinkItem(` `  context: ExpansionContext,` `  candidate: ExpandedLink,` `  lookups: LinkLookups` `): IntermediateItem | undefined {` ... `  };` `}` (lines 359-400, 42 lines)'
  cost: Metadata lookup, the empty-provenance warning, the uncertain filter and the item construction are all in one body. Each of the three early returns is a place to add a fourth refusal without a new function.
  correction: Extract the provenance check and the item construction into named helpers.
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/review-proofs
reconciliation: siegard-reconcile/review-proofs.md
---

## What it is

A review of the review-proofs initiative: three proof tasks over implementations that already stand, five files, one captured run of the registry's five steps.
The conformance pass read each file against the nodes the trace binds to it and the nodes the tasks implement.
The coverage pass paired the tasks' criteria with their tests, and four certifications were judged.

## Notes

The failures pass did not run because run/review-proofs passed every step; there was no failure to read.
A step that exits 0 settles that the command exited 0, and nothing about whether the registry configures it to decide the rules resting on it.
Two of the standard's rules are decided by the typecheck step, and 52 by reading; the standard pass read only the 52.
This framework does not review performance, security beyond the rules the standard states, or any rule whose text the project has not authored.
The task search-item-flags-provenance carries a compound note over its first criterion that the binder returned after the skeleton had been split once, and the criterion proceeded as last written.
