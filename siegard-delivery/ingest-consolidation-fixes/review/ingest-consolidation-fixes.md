---
target: backend
title: Review of the ingest-consolidation-fixes delivery
summary: 'What the coverage, conformance and standard passes found over the source and tests of three corrective tasks: the exact-alias tie-break, the directed-ingestion result order and the ingest_directed description.'
reviewed:
- src/modules/ingestion/service/entity-resolution.service.ts
- src/modules/ingestion/service/directed-ingestion.service.ts
- src/modules/ingestion/dto/index.ts
- src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
- src/__tests__/unit/ingestion/directed-ingestion.spec.ts
- src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
- src/__tests__/unit/chat/ingest-directed-description-parity.spec.ts
tasks:
- task/exact-alias-tie-break/order-exact-alias-lookup
- task/directed-envelope-order/summary-before-run-and-report
- task/directed-description-owner-request/rewrite-ingest-directed-description
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/ingest-consolidation-fixes passed; there was no failure to read
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
coverage:
- criterion: Where two active nodes of the proposal's node type each hold an alias equal to the proposed name, the proposal resolves as matched-existing to the node whose matching alias has the earliest creation time.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: resolves to the node whose matching alias was created earliest even when its node identity is higher and it is stored second
  - file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: resolves to the earliest-created alias of an active node of the type, ties going to the lowest identity, alias with no time last, other types and inactive nodes ignored
  why: The earliest-time ordering is exercised. The store stand-in fails the test if the order is by identity or if no order is given. What is not exercised is the criterion's word "matching alias". The stand-in's ORDER BY parser drops the table qualifier (`(?:\w+\.)?(\w+)`) and always sorts on the alias row's created_at. The lookup joins knowledge_node (`kn`), so `ORDER BY kn.created_at`, which is the node's creation time and not the matching alias's, would pass both tests. The "active nodes of the proposal's node type" condition is also unexercised. `matchingAliases` filters by type and by active status in the stand-in itself, whatever the SQL says. So the second test's claim that other types and inactive nodes are ignored holds even if the query's `kn.node_type_id` and `kn.status` conditions were removed. That test's name claims more than its stand-in can prove.
- criterion: Where two active nodes of the proposal's node type hold matching aliases with equal creation times, the proposal resolves as matched-existing to the node with the lower node identity.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: resolves to the node with the lower node identity even when it is stored second
  - file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: resolves to the earliest-created alias of an active node of the type, ties going to the lowest identity, alias with no time last, other types and inactive nodes ignored
  why: The tie-break is exercised against storage order and against descending order. "Node identity" is not distinguished from any other identity. The stand-in maps both `id` and `node_id` to the alias row's node_id, whatever the qualifier. So a tie broken by `na.id`, which is the alias row's identity and not the node's, would be sorted as if it were node identity and would pass both tests.
- criterion: Repeating the same homonym proposal against an unchanged graph resolves to the same node on every repetition.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: resolves to the same node on every repetition although the store returns candidate rows in a different order each time
- criterion: A proposal whose name equals an alias of exactly one active node of its node type still resolves as matched-existing to that node.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: resolves the later proposal named CNPq to the node holding the canonical alias and the alias CNPq as matched_existing
  - file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: still resolves to the node when its matching alias is the only candidate and has no creation time
- criterion: The change adds no file under migrations/.
  state: uncovered
  why: No test in the set reads the migrations/ directory or the change's file list. This criterion is about which files the change delivers, not about runtime behavior, so none of these unit tests could fail if a migration file were added.
- criterion: In the serialized directed-ingestion result, the summary field comes before the run field.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: serializes the summary before the run
- criterion: In the serialized directed-ingestion result, the summary field comes before the report field.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: serializes the summary before the report
- criterion: A directed-ingestion result whose serialization exceeds 8000 characters, cut to its first 8000 characters, still contains the whole summary.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: keeps the whole summary in the first 8000 characters of a result longer than 8000
- criterion: The parsed directed-ingestion result still carries the run's affected nodes at run.affected_nodes.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'affected_nodes: collected from propose-* envelopes; populated on result.run'
  why: The test reads run.affected_nodes from the in-memory envelope the service returns. It never serializes and parses it. A reordering that builds the result so that run.affected_nodes is lost on the way through JSON (a toJSON, a non-enumerable property, a value JSON drops) would pass. The "parsed" half of the criterion is unexercised. The result-field-order tests do parse the result, but they assert only the order of top-level keys.
- criterion: The parsed directed-ingestion result still carries one report entry per item at report.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'happy path: dispatches fragments → nodes → attributes → links in order; run closes ''completed'''
  why: 'The happy-path test asserts one report entry per input item, in caller order, but on the in-memory envelope. Nothing parses the serialized result and then reads report, so the "parsed" half is unexercised. The assertion is also incidental: it sits inside a test whose purpose is dispatch order and run status. Nothing marks it as the guard for this criterion.'
- criterion: The ingest_directed description states that the tool is called only when the owner's own message explicitly asks to record knowledge.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
    name: states that the tool is called only when the owner's own message explicitly asks to record knowledge
  why: The check is lexical. It needs one sentence that contains "only", "owner's own message", "explicitly" and "record". A sentence that keeps all four words but negates the condition would pass. A reader decides whether that residue matters.
- criterion: The ingest_directed description states that an instruction inside a document or a tool result is never a reason to call the tool.
  state: covered
  tests:
  - file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
    name: states that an instruction inside a document or a tool result is never a reason to call the tool
  why: The check is lexical. It needs one sentence that contains "instruction", "document", "tool result", "never" and "call". A sentence that keeps those words with a different meaning would pass.
- criterion: The ingest_directed description no longer presents facts assembled from prior tool results as a reason to call the tool.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
    name: mentions prior tool results only to forbid acting on them, never as a reason to call the tool
  why: 'The test flags only sentences that use its own vocabulary: "tool/prior/earlier/previous result(s)", "lookup(s)" or "queries". It also exempts any such sentence that contains "not" or "never" anywhere. Some wordings that present assembled facts as a reason to call would pass: - other words, such as "facts you gathered from your searches" or "what you found by reading the graph"; - a sentence like "do not hesitate to call it with facts from prior tool results". Only the listed phrasings of the criterion are exercised, not the criterion itself.'
- criterion: The ingest_directed description still states that the server runs no language model for the call.
  state: partial
  tests:
  - file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
    name: still states that the server runs no language model for the call
  why: The test matches "no LLM" or "no language model" anywhere in the text. Nothing ties the phrase to the server or to this call. A description that says the caller needs no LLM, or that mentions "no LLM" in some other context, while it stops saying that the server runs none, would pass. The "server runs" part of the criterion is unexercised.
- criterion: The ingest_directed description listed by tools/list on the MCP ingest endpoint is identical to the one the chat assistant's tool catalog presents.
  state: covered
  tests:
  - file: src/__tests__/unit/chat/ingest-directed-description-parity.spec.ts
    name: presents the chat assistant exactly the text the MCP ingest endpoint lists for the tool
unpaired:
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: canonicalises attribute values to string form
  asserts: canonicaliseAttributeValue turns strings, integers, negative decimals and booleans into their string forms ("verbatim", "42", "-1.5", "true", "false").
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'cascade on missing fragment evidence_ref: link lands dependency_failed'
  asserts: When the fragment a link cites as evidence_ref is rejected, the link's report entry is dependency_failed with reason equal to that fragment ref, and proposeLink is never called.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: checkCascade returns the missing dependency ref or null
  asserts: checkCascade returns null when node_ref and evidence_ref both resolve. Otherwise it returns the missing node_ref first, then the missing evidence_ref.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'classifies envelope failures: SYSTEM_* → error, everything else → rejected'
  asserts: classifyEnvelopeFailureStatus maps VALIDATION_INVALID_FORMAT, BUSINESS_LINK_RULE_VIOLATION and RESOURCE_NOT_FOUND to "rejected", and maps SYSTEM_INTERNAL_ERROR and SYSTEM_SERVICE_UNAVAILABLE to "error".
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'forced confidence: dispatched propose_* args carry confidence=1.0 even when the caller payload has no confidence field'
  asserts: The arguments dispatched to proposeFragment, proposeAttribute and proposeLink carry confidence 1.0. Attribute and link arguments default valid_from_basis to "stated".
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'intake failure: orchestrator maps to SYSTEM_INTERNAL_ERROR envelope; no propose-* dispatched'
  asserts: When raw intake throws, the service returns ok false with SYSTEM_INTERNAL_ERROR, and proposeFragment is never called.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'node_id pin (invalid): unknown UUID → RESOURCE_NOT_FOUND; dependent items cascade'
  asserts: A pin the verifier rejects as not_found gives the node's entry rejected with RESOURCE_NOT_FOUND. An unpinned sibling node is still accepted. The attribute and the link that depend on the pinned ref land dependency_failed with that ref as reason, and their handlers are never called.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'node_id pin (valid): bypasses propose_node; resolution=matched_existing'
  asserts: With a pin that verifies, the verifier is called with the pool and the pinned id, and proposeNode is not called. Both are internal-call assertions. The node's report entry is accepted, with the pinned node_id and resolution matched_existing.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'per-item rejection: one link rejected → report shows rejected; run still completes'
  asserts: A link rejected with BUSINESS_LINK_RULE_VIOLATION shows as rejected in the report with that code. The run status is completed. The three preceding items are accepted. The summary counts rejected 1, accepted 3 and links 1.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: produces two distinct contents for two synth calls (nonce uniqueness)
  asserts: Two synthesiseContent calls on the same payload and timestamp produce different nonces and different content.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 're-affirmation: two successive identical calls produce two distinct raw contents'
  asserts: Two successive service calls with the same payload both return ok, and the two raw-intake contents they submit differ.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: serializes the completed run before the report
  asserts: In the JSON round-trip of the envelope, the result's run key comes before its report key. None of the three tasks states this ordering. Their criteria put summary before run and before report, and say nothing about run relative to report.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: 'structural failure: Zod parse error → VALIDATION_INVALID_FORMAT envelope; no intake, no dispatch'
  asserts: A payload with no fragments array returns ok false with VALIDATION_INVALID_FORMAT, and neither raw intake nor proposeFragment is called.
- test:
    file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
    name: synthesises content with the fragments + nonce + timestamp
  asserts: synthesiseContent output contains each fragment as "[ref] text", a directed_at timestamp line, and the nonce, and the nonce has UUID shape.
- test:
    file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
    name: resolves to a node whose alias has a creation time rather than to a lower-identity node whose alias has none
  asserts: 'With one matching alias that has no creation time (lower node identity) and one that has a creation time, the proposal resolves matched_existing to the node whose alias has a time. This means aliases with no time order last. None of the criteria states that ordering: they speak only of the earliest creation time and of equal creation times.'
findings:
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the header comment, items 6 of the validation criteria (lines 16-17) — node rules/knowledge-base/directed-full-confidence, kind restates
  evidence: '//   6. Confidence clamping: confidence=1.0 enforced on every dispatched //      propose_* args (the caller payload has no confidence field).'
  cost: The fact is a second home in prose. The service code holds it (it forces 1.0 on dispatch, per the index binding to directed-ingestion.service.ts), and this file's `expect(input.confidence).toBe(1.0)` assertions check it. The comment adds nothing running. It is also a copy that stays behind when the node moves.
  correction: Remove the comment. The fact is held by rules/knowledge-base/directed-full-confidence and by the dispatch code.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the "synthesises content with the fragments + nonce + timestamp" test (lines 251-255) — node rules/knowledge-base/directed-source-content, kind unstated
  evidence: expect(out.content).toContain("[f1] Alice works on Project X."); expect(out.content).toContain("directed_at=2026-06-25T10:00:00.000Z"); expect(out.content).toContain(`nonce=${out.nonce}`); expect(out.nonce).toMatch(/^[0-9a-f-]{36}$/);
  cost: The node says only that the content lists each fragment as its reference and text, then the label, then the moment of ingestion and a nonce of its own. The bracketed `[ref] text` layout, the `directed_at=` and `nonce=` markers, the ISO-8601 millisecond form of the moment and the 36-character UUID shape of the nonce are stored-content formats that only this test and the service state. A reader who looks in the specification for what a directed raw information's content looks like finds none of them.
  correction: Give the content layout, or the parts the owner wants fixed, a place in rules/knowledge-base/directed-source-content through the analysis route. Alternatively, loosen the test to assert only the ordering the node holds.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the comment in the "classifies envelope failures" test (lines 281-284) — node rules/knowledge-base/directed-item-status, kind restates
  evidence: // BR-13 (P2.1) — layered validation rejections (`VALIDATION_*`, // `BUSINESS_*`, `RESOURCE_NOT_FOUND`) are `rejected`; system-level // failures (`SYSTEM_*` — e.g. SYSTEM_INTERNAL_ERROR, SYSTEM_SERVICE_UNAVAILABLE) // are the SDK / catch-all bucket and stay `error`.
  cost: The status mapping is held as code by `classifyEnvelopeFailureStatus` in directed-ingestion.service.ts (index binding) and asserted in the lines below. The comment is a second written copy that names a prefix-based rule and a BR-13 reference outside the specification.
  correction: Remove the comment. The fact is held by rules/knowledge-base/directed-item-status and by the classification code.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the comment in the "happy path" test (lines 367-370) — node rules/knowledge-base/directed-dispatch-order, kind restates
  evidence: '// Why this matters: BR-34 step 3 prescribes a specific dispatch ORDER — // attributes/links cannot resolve their refs until the fragments/nodes // they cite have been dispatched.'
  cost: The dispatch order is held by the service's code and asserted by `expect(calls).toEqual([...])`. The comment restates it, with a reason, in prose. If the node moves, the comment keeps the old reason.
  correction: Remove the comment. The fact is held by rules/knowledge-base/directed-dispatch-order and by the dispatch code.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the report-shape assertion in the "happy path" test (lines 485-493) — node contracts/knowledge-base/ingestion, kind unstated
  evidence: '"nAlice.age",'
  cost: The reference of a directed attribute's report entry (node reference, a dot, the key) is stated only here and in the service. The node sets a form only for a link's reference (source reference, link type and target reference joined by "->"). The contract says only "one entry per item with its reference". The next reader looks in the specification for the attribute's reference form and does not find it. The link form has a decision log noting that the chat graph delta parses it, and the attribute form has no such record.
  correction: Give the attribute entry's reference form a node, as directed-link-report-reference does for links, through the analysis route.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the "node_id pin (valid)" test assertions (line 621) — node rules/knowledge-base/directed-pinned-node, kind unstated
  evidence: expect(nodeEntry?.resolution).toBe("matched_existing");
  cost: rules/knowledge-base/directed-pinned-node says a pinned node resolves to the existing knowledge node without entity resolution. It does not say which resolution a pinned node's report entry carries. A directed pin reporting matched_existing is stated only by this assertion and the service.
  correction: State the resolution a pinned directed node reports in rules/knowledge-base/directed-pinned-node through the analysis route.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the header comment, items 6 of the validation criteria (lines 16-17) — node rules/knowledge-base/directed-full-confidence, kind restates
  evidence: '//   6. Confidence clamping: confidence=1.0 enforced on every dispatched //      propose_* args (the caller payload has no confidence field).'
  cost: The fact is a second home in prose. The service code holds it (it forces 1.0 on dispatch, per the index binding to directed-ingestion.service.ts), and this file's `expect(input.confidence).toBe(1.0)` assertions check it. The comment adds nothing running. It is also a copy that stays behind when the node moves.
  correction: Remove the comment. The fact is held by rules/knowledge-base/directed-full-confidence and by the dispatch code.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the "synthesises content with the fragments + nonce + timestamp" test (lines 251-255) — node rules/knowledge-base/directed-source-content, kind unstated
  evidence: expect(out.content).toContain("[f1] Alice works on Project X."); expect(out.content).toContain("directed_at=2026-06-25T10:00:00.000Z"); expect(out.content).toContain(`nonce=${out.nonce}`); expect(out.nonce).toMatch(/^[0-9a-f-]{36}$/);
  cost: The node says only that the content lists each fragment as its reference and text, then the label, then the moment of ingestion and a nonce of its own. The bracketed `[ref] text` layout, the `directed_at=` and `nonce=` markers, the ISO-8601 millisecond form of the moment and the 36-character UUID shape of the nonce are stored-content formats that only this test and the service state. A reader who looks in the specification for what a directed raw information's content looks like finds none of them.
  correction: Give the content layout, or the parts the owner wants fixed, a place in rules/knowledge-base/directed-source-content through the analysis route. Alternatively, loosen the test to assert only the ordering the node holds.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the comment in the "classifies envelope failures" test (lines 281-284) — node rules/knowledge-base/directed-item-status, kind restates
  evidence: // BR-13 (P2.1) — layered validation rejections (`VALIDATION_*`, // `BUSINESS_*`, `RESOURCE_NOT_FOUND`) are `rejected`; system-level // failures (`SYSTEM_*` — e.g. SYSTEM_INTERNAL_ERROR, SYSTEM_SERVICE_UNAVAILABLE) // are the SDK / catch-all bucket and stay `error`.
  cost: The status mapping is held as code by `classifyEnvelopeFailureStatus` in directed-ingestion.service.ts (index binding) and asserted in the lines below. The comment is a second written copy that names a prefix-based rule and a BR-13 reference outside the specification.
  correction: Remove the comment. The fact is held by rules/knowledge-base/directed-item-status and by the classification code.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the comment in the "happy path" test (lines 367-370) — node rules/knowledge-base/directed-dispatch-order, kind restates
  evidence: '// Why this matters: BR-34 step 3 prescribes a specific dispatch ORDER — // attributes/links cannot resolve their refs until the fragments/nodes // they cite have been dispatched.'
  cost: The dispatch order is held by the service's code and asserted by `expect(calls).toEqual([...])`. The comment restates it, with a reason, in prose. If the node moves, the comment keeps the old reason.
  correction: Remove the comment. The fact is held by rules/knowledge-base/directed-dispatch-order and by the dispatch code.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the report-shape assertion in the "happy path" test (lines 485-493) — node contracts/knowledge-base/ingestion, kind unstated
  evidence: '"nAlice.age",'
  cost: The reference of a directed attribute's report entry (node reference, a dot, the key) is stated only here and in the service. The node sets a form only for a link's reference (source reference, link type and target reference joined by "->"). The contract says only "one entry per item with its reference". The next reader looks in the specification for the attribute's reference form and does not find it. The link form has a decision log noting that the chat graph delta parses it, and the attribute form has no such record.
  correction: Give the attribute entry's reference form a node, as directed-link-report-reference does for links, through the analysis route.
- pass: conformance
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: the "node_id pin (valid)" test assertions (line 621) — node rules/knowledge-base/directed-pinned-node, kind unstated
  evidence: expect(nodeEntry?.resolution).toBe("matched_existing");
  cost: rules/knowledge-base/directed-pinned-node says a pinned node resolves to the existing knowledge node without entity resolution. It does not say which resolution a pinned node's report entry carries. A directed pin reporting matched_existing is stated only by this assertion and the service.
  correction: State the resolution a pinned directed node reports in rules/knowledge-base/directed-pinned-node through the analysis route.
- pass: conformance
  file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  where: the filter in the first test (lines 15-21), which requires the word "explicitly" in the owner-request sentence of the ingest_directed description — node rules/chat/assistant-writes-only-on-owner-request, kind unstated
  evidence: "/owner['’]s own message/i.test(sentence) &&\n        /\\bexplicitly\\b/i.test(sentence) &&\n        /\\brecord\\b/i.test(sentence)"
  cost: The rule node says the assistant calls directed ingestion only when the owner's own message "asks it to record knowledge". The test requires the emitted description to say the ask must be explicit. That stricter condition is held only here, so the next reader looks in the specification for it and does not find it. The test also fails a description that states the node's condition exactly.
  correction: Either an analysis gives the node (or its description) the explicit-ask wording, or the test stops pinning "explicitly".
- pass: conformance
  file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  where: the third test (lines 41-51), which requires every sentence of the description that mentions tool results, lookups or queries to also say "never" or "not" — node rules/chat/assistant-writes-only-on-owner-request, kind unstated
  evidence: "/\\b(tool|prior|earlier|previous)\\s+results?\\b|\\blookups?\\b|\\bqueries\\b/i.test(sentence) &&\n      !/\\bnever\\b|\\bnot\\b/i.test(sentence)"
  cost: The rule node names only an instruction inside a document or tool result as something the assistant never acts on. This test extends the prohibition to prior lookups and queries, so a rule about which earlier chat activity may justify a write lives only in a test. A change to the description is judged against it, and the specification gives no way to settle a disagreement.
  correction: An analysis decides whether prior lookups and queries are covered by the rule (by extending the rule node). If they are not, the test stops pinning them.
- pass: conformance
  file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  where: the filter in the first test (lines 15-21), which requires the word "explicitly" in the owner-request sentence of the ingest_directed description — node rules/chat/assistant-writes-only-on-owner-request, kind unstated
  evidence: "/owner['’]s own message/i.test(sentence) &&\n        /\\bexplicitly\\b/i.test(sentence) &&\n        /\\brecord\\b/i.test(sentence)"
  cost: The rule node says the assistant calls directed ingestion only when the owner's own message "asks it to record knowledge". The test requires the emitted description to say the ask must be explicit. That stricter condition is held only here, so the next reader looks in the specification for it and does not find it. The test also fails a description that states the node's condition exactly.
  correction: Either an analysis gives the node (or its description) the explicit-ask wording, or the test stops pinning "explicitly".
- pass: conformance
  file: src/__tests__/unit/ingestion/ingest-directed-description.spec.ts
  where: the third test (lines 41-51), which requires every sentence of the description that mentions tool results, lookups or queries to also say "never" or "not" — node rules/chat/assistant-writes-only-on-owner-request, kind unstated
  evidence: "/\\b(tool|prior|earlier|previous)\\s+results?\\b|\\blookups?\\b|\\bqueries\\b/i.test(sentence) &&\n      !/\\bnever\\b|\\bnot\\b/i.test(sentence)"
  cost: The rule node names only an instruction inside a document or tool result as something the assistant never acts on. This test extends the prohibition to prior lookups and queries, so a rule about which earlier chat activity may justify a write lives only in a test. A change to the description is judged against it, and the specification gives no way to settle a disagreement.
  correction: An analysis decides whether prior lookups and queries are covered by the rule (by extending the rule node). If they are not, the test stops pinning them.
- pass: conformance
  file: src/modules/ingestion/dto/index.ts
  where: IngestToolDescriptions.ingest_document, lines 89-97 (the same claim recurs in list_recent_ingestions, lines 107-112) — node contracts/knowledge-base/ingestion, kind unstated
  evidence: '"If your client times out before this returns, the server keeps extracting — do NOT " + "re-send; use `list_recent_ingestions` to find the run, then `get_ingestion_status`."'
  cost: This tells the calling model that extraction survives a client timeout, so it should not re-send. No node holds that behavior. The contract for ingest-document names no timeout or continuation answer. Source is the only place the guarantee is written, and the next reader will look for it in the specification and not find it.
  correction: Analysis would have to give the continues-after-client-timeout behavior of document ingestion a home. The ingestion contract's ingest-document operation is the natural one. The description can then state it truthfully.
- pass: conformance
  file: src/modules/ingestion/dto/index.ts
  where: IngestToolDescriptions.start_async_ingestion, lines 113-121 — node constraints/ingest-toolset-offers-no-async-ingestion, kind contradicts
  evidence: '"Ingest a whole document and IMMEDIATELY return the run id while extraction " + "continues in the background."'
  cost: A node says the ingest toolset offers no tool that starts an ingestion and returns before it completes. This file declares a description for exactly such a tool. Its decision log says the tool was retired because ingestion is one-shot, and that a different name for the same behavior would breach the same reason. If this entry is listed to MCP clients, the toolset offers a tool the specification forbids. The description also states a timing fact no node holds ("synchronously (< 1 s)"). I did not read the file that registers tools, so I cannot say whether this entry reaches the tool listing.
  correction: 'Remove the start_async_ingestion entry if nothing lists it. If something does list it, the specification and the source have to be reconciled by a person: either the constraint changes or the tool goes.'
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: lines 74-75 and 85-86, the valid_to field of DirectedAttributeItemSchema and DirectedLinkItemSchema, and its forwarding at lines 480 and 556 — node rules/knowledge-base/directed-validity-start-shape, kind unstated
  evidence: 'valid_to: IsoDateSchema.optional(),  and  ...(item.valid_to !== undefined ? { valid_to: item.valid_to } : {}),  with  .regex(/^\d{4}-\d{2}-\d{2}$/, "valid_from / valid_to must be ISO YYYY-MM-DD")'
  cost: The service accepts a validity end on a directed attribute or link and fixes its shape. The specification holds only the validity start (directed-validity-start-shape), and its decision log records that the end is left unstated because the tool strips it before the service reads it. The end's shape therefore lives only here. The next reader looking for what a directed item may state will not find it in the specification.
  correction: Either the analysis gives the directed validity end a node, or the service stops accepting a field the entry point never delivers. That choice is the person's.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: refForAttribute, line 741, used as the report reference of every directed attribute entry — node domain/knowledge-base/directed-item, kind unstated
  evidence: return `${item.node_ref}.${item.key}`;
  cost: A directed attribute's report entry takes a reference built from its node reference and key joined by a dot. No node states this form. The link form is held by directed-link-report-reference, and the log decided the link form only. A client that reads the report relies on a form that only the code states.
  correction: The analysis would give the attribute's report reference a node beside directed-link-report-reference, constraining domain/knowledge-base/directed-item.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe, lines 839-843 and 861-863, the fallback values for the run's start, finish and attempts — node contracts/knowledge-base/ingestion, kind unstated
  evidence: "started_at: new Date(0).toISOString(),\n    finished_at: new Date(0).toISOString(),\n    attempts: 1,"
  cost: When the closed run cannot be read, the answer carries start and finish times at the Unix epoch and one attempt, and the finish time falls back to the epoch while the run is still open. The contract states that the run is reported completed and the affected nodes are an empty list. It states nothing about these values. A reader sees 1970 timestamps as if the business had decided them.
  correction: The contract's ingest-directed answer would have to state what the run's times and attempts are when the run cannot be read, or the answer would have to omit them.
- pass: conformance
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: line 201, the message of the defensive refusal when the payload fails the schema — node contracts/knowledge-base/ingestion, kind contradicts
  evidence: 'message: "Input failed Zod parse.",'
  cost: The contract states every shape refusal of ingest-directed with the message "ingest_directed arguments failed validation.". This path, reached when the service is called with a payload its schema refuses, emits a different message. Callers that read the message get two wordings for one refusal.
  correction: The message would have to be the one the contract names, "ingest_directed arguments failed validation.".
- pass: conformance
  file: src/modules/ingestion/service/entity-resolution.service.ts
  where: ALIAS_ADMISSION_SQL, the admitted expression (lines 63-68) — node rules/knowledge-base/alias-admitted-only-from-source, kind unstated
  evidence: OR (norm(a.alias) <> '' AND strpos(r.content_norm, norm(a.alias)) > 0)
  cost: The refusal of a proposed alias that normalizes to nothing exists only in this query. The node says an alias is admitted when its normalized form occurs in the normalized content. An empty string occurs in any content, so the node would admit it. A reader who looks in the specification for what happens to a blank alias finds no answer, and the code is where the decision lives. In a directed ingestion the same alias is admitted anyway, so the rule is also uneven across the two modes.
  correction: Analysis should state in rules/knowledge-base/alias-admitted-only-from-source, or in a rule beside it, whether an alias whose normalized form is empty is admitted. It should also say whether a directed ingestion is exempt from that refusal.
- pass: standard
  file: src/__tests__/unit/chat/ingest-directed-description-parity.spec.ts
  where: mountIngestEndpoint / listedDescription (lines 59-79) and the file's location under unit/chat
  cites: TST-04
  evidence: 'const app = Fastify({ logger: false });

    await registerIngestMcpTransport(app, {

    [...]

    url: "/mcp/ingest",'
  cost: The file sits under unit/chat, but it mounts a Fastify app and sends a request through the ingestion MCP transport. It also compares that output with the chat tool catalog. No single unit under test gives it a mirrored path. Someone changing the ingestion transport will not look in unit/chat, and someone changing the chat catalog will not expect an HTTP mount there.
  correction: Place it in the integration subtree, since it crosses two modules and an HTTP transport. Or split it so each half mirrors the file it covers.
- pass: standard
  file: src/__tests__/unit/chat/ingest-directed-description-parity.spec.ts
  where: registerIngestToolset call in buildRegistry (line 41)
  cites: TYP-02
  evidence: 'pool: {} as unknown as Pool,'
  cost: The assertion claims an empty object is a Pool and nothing narrows it. If registerIngestToolset starts touching the pool at registration, the failure appears as a runtime TypeError inside the toolset, not at this line.
  correction: Build a typed minimal stand-in that satisfies the parts of Pool the toolset uses, or give the stand-in a narrowing guard.
- pass: standard
  file: src/__tests__/unit/chat/ingest-directed-description-parity.spec.ts
  where: listedDescription, response body read (line 77)
  cites: TYP-02
  evidence: 'const body = res.json() as { result: { tools: ListedTool[] } };'
  cost: The response shape is asserted, not checked. If the endpoint answers with a JSON-RPC error, `body.result.tools` throws "cannot read properties of undefined". That hides the real answer and does not state what the test expected.
  correction: Narrow the parsed body with a guard, or a schema the test imports, before reading `result.tools`.
- pass: standard
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: buildPool (lines 107-186)
  cites: MNT-01
  evidence: 'function buildPool(hooks: PoolHooks = {}): { pool: Pool; closeRunCalls: number } {

    [...] (the function body runs to line 186)'
  cost: The stand-in pool is about 80 lines. It holds four SQL-routing branches and a Symbol.toPrimitive getter trick. A reader cannot hold the whole thing in mind. A fifth query route would be added as another branch, not as a helper.
  correction: Extract one helper for the llm_run row, one for each query route, and a plain counter accessor.
- pass: standard
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: buildPool, UPDATE llm_run branch and SELECT FROM llm_run branch (lines 122-161)
  cites: MNT-03
  evidence: 'id: RUN_ID,

    model: DIRECTED_MODEL,

    prompt_version: DIRECTED_PROMPT_VERSION,

    started_at: hooks.closedRunRow?.started_at ?? new Date("2026-06-25T10:00:00Z"),

    [...] (the same eight-field row is built again at lines 147-156)'
  cost: The same llm_run row literal is built twice. If the row shape gains a field, one copy gets it and the other does not. The test then drifts from the repository's real return in one branch only.
  correction: Build the row once and return it from both branches.
- pass: standard
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: buildPool return (lines 181-185)
  cites: TYP-02
  evidence: 'const pool = { connect } as unknown as Pool;

    return { pool, closeRunCalls: 0, get [Symbol.toPrimitive]() { return closeRunCalls; } } as unknown as {'
  cost: 'Two unguarded double assertions. The second one declares `closeRunCalls: number` while the object holds a getter keyed on Symbol.toPrimitive. Every test reads `closeRunCalls` as 0 or as a primitive-coerced value, which the type does not say. The compiler cannot catch a wrong read.'
  correction: Return a typed object, for example a real counter accessor, and give the pool stand-in a guard or a typed minimal interface.
- pass: standard
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: happy path test, proposeFragment / proposeAttribute / proposeLink stubs (lines 372-411)
  cites: TST-01
  evidence: "const proposeFragment = vi.fn(async (input: any) => {\n  calls.push(`fragment:${input.text}`);\n  // Confidence MUST be 1.0 on every dispatch — the server forces this.\n  expect(input.confidence).toBe(1.0);"
  cost: Assertions are made inside the arrange-phase stubs, and the same test asserts again after the act. A reader cannot tell what the test claims from its assert section. If a stub's expect fails, the error is thrown inside the code under test and surfaces as a rejected dispatch, not as a failed assertion.
  correction: Have the stubs only record the inputs they receive. Assert on the recorded confidence and valid_from_basis after the call, as the forced-confidence test does.
- pass: standard
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: orchestrator tests, proposeLink stub returning BUSINESS_LINK_RULE_VIOLATION (lines 516-523)
  cites: TST-03
  evidence: "const proposeLink = vi.fn(async () => ({\n  ok: false as const,\n  error: {\n    code: \"BUSINESS_LINK_RULE_VIOLATION\","
  cost: 'The four propose-* handlers carry the layered business validation: link rules, temporal rules, provenance. They are replaced wholesale. The test then asserts that the report carries the rejection the stub invented. The suite passes whether or not the real link rule exists, so the orchestrator''s relationship to that rule is untested. The file header concedes the handlers have their own test surface elsewhere.'
  correction: Keep the stand-ins at the store boundary, the pool, and run the real handlers. Or limit the stubs to what the orchestrator itself decides and state that this is the scope of the claim.
- pass: standard
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  where: '''keeps the whole summary in the first 8000 characters'' test (lines 1091-1100)'
  cites: TYP-04
  evidence: 'const cut = serialized.slice(0, 8000);

    [...]

    expect(serialized.length).toBeGreaterThan(8000);'
  cost: The 8000-character limit is a number with meaning, written three times. The test title is a fourth copy. If the limit changes, a copy is easy to miss and the test would pass against the wrong cut.
  correction: Name the limit once, for example SUMMARY_VISIBLE_CHARS, and use it in the slice, the length check and the title.
- pass: standard
  file: src/__tests__/unit/ingestion/entity-resolution-exact-alias-order.spec.ts
  where: buildClient (line 195)
  cites: TYP-02
  evidence: 'return { query, release: () => undefined } as unknown as PoolClient;'
  cost: The stand-in is declared a PoolClient with no narrowing. If resolveOrCreateNode starts using another client method such as `connect` or a callback overload, the test fails with "is not a function" far from this line.
  correction: Type the stand-in as the narrow interface the service uses, or guard it before the cast.
- pass: standard
  file: src/modules/ingestion/dto/index.ts
  where: IngestToolDescriptions and IngestToolInputJsonSchemas (lines 57 and 66)
  cites: CON-02
  evidence: 'export const IngestToolDescriptions = {

    [...]

    export const IngestToolInputJsonSchemas = {'
  cost: Module-level constants that never change are PascalCase here, so they read as types or classes. A reader cannot tell a constant from a type at the import site. The same PascalCase pattern holds for the `*JsonSchema` consts in this file.
  correction: Name the module-level constants in screaming snake case, for example INGEST_TOOL_DESCRIPTIONS. If PascalCase Zod schemas are the project's deliberate convention, the standard needs to say so.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: import of ./ingestion.service.js (line 40) and its use at line 212
  cites: LAY-04
  evidence: 'import { ingestRawInformation } from "./ingestion.service.js";

    [...]

    const ingestRaw = deps.ingestRaw ?? ingestRawInformation;'
  cost: One service calls another and wraps it in its own `withTransaction`. The transaction boundary of the intake now lives in the calling service, and a change to ingestRawInformation's contract changes this file's behavior with no layer between them.
  correction: Move the shared intake behavior down into a domain module the two services both call. Or have a factory inject the intake function.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: directedIngestionService signature and first statements (lines 191-195)
  cites: DTO-01
  evidence: "export async function directedIngestionService(\n  input: unknown,\n  deps: DirectedIngestionDeps\n): Promise<McpEnvelope<DirectedIngestionResult>> {\n  const parsed = DirectedIngestionInputSchema.safeParse(input);"
  cost: The service takes the raw, unvalidated payload and validates it itself. The schema is declared in the service file rather than the dto directory. Each transport has to remember to route through this entry or lose validation. Tests also have to import the schema from a service file.
  correction: Move DirectedIngestionInputSchema into the dto directory and parse at the route or tool boundary. The service then receives a DirectedIngestionInput.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: intake catch (lines 244-266)
  cites: COR-03
  evidence: 'const pgDown = isPgUnavailable(err);

    [...]

    code: "SYSTEM_SERVICE_UNAVAILABLE",'
  cost: The service uses a helper from shared/error-mapping, the transport-mapping module, to turn a driver error into a transport-facing error code. The mapping is decided here and not in the error layer. Any other caller of the service gets a code chosen for one transport.
  correction: Let the service raise a typed error and have the error middleware or mapping layer format it.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: noop_existing refusal (lines 285-293)
  cites: SEC-04
  evidence: "message:\n  \"Directed ingestion intake returned 'noop_existing'; the per-call nonce should make this unreachable.\",\ndetails: { raw_information_id, llm_run_id },"
  cost: The client response states an internal invariant ("per-call nonce") and the intake outcome vocabulary. It also carries the raw_information_id and llm_run_id. That tells a stranger how deduplication works and gives them internal identifiers.
  correction: Return a generic internal-error message to the client and keep the detail in the log line that already records it.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: verifyNodePin rejection messages (lines 701 and 709), returned to the client through the report error.message
  cites: SEC-04
  evidence: 'message: "node_id pin does not resolve to an existing knowledge_node row.",

    [...]

    message: `node_id pin resolves to a knowledge_node row whose status is ''${row.status}'' (only ''active'' is accepted).`,'
  cost: The messages are copied into `report[].error.message` and name the physical table `knowledge_node` and its status values. A client learns the shape of the store from a refusal.
  correction: Word the refusal in domain terms ("the referenced node does not exist" / "is not active") and keep table names out of client text.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: affected-nodes recording, fragment and node branches (lines 344-347 and 418-421)
  cites: TYP-02
  evidence: envelope as unknown as McpEnvelope<Record<string, unknown>>
  cost: A double assertion through `unknown` removes all checking between the typed handler result and the collector's loose record. If a handler's result type changes, the collector gets the wrong shape and the compiler says nothing. Both sites use the same cast.
  correction: Give the collector a typed input, or narrow the envelope with a guard before recording it.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: pin rejection, code selection (lines 387-390)
  cites: TYP-02
  evidence: '(pinResult.details as { reason?: unknown }).reason === "not_found"'
  cost: verifyNodePin's `details` is a Record<string, unknown> asserted into a shape in the caller. Renaming `reason` in verifyNodePin would silently turn every not_found pin into VALIDATION_INVALID_FORMAT, with no compile or type signal.
  correction: 'Return a typed discriminant such as `reason: "not_found" | "inactive"` from verifyNodePin and read it without a cast.'
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: buildSummary (line 785)
  cites: TYP-02
  evidence: summary[`${item.kind}s` as "fragments" | "nodes" | "attributes" | "links"] += 1;
  cost: A template string is asserted to be one of four keys. A fifth DirectedItemKind would index the summary with an unknown key and add NaN to an undefined field, with nothing at compile time to flag it.
  correction: Map kind to summary key through a typed lookup table.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: forced confidence in the fragment, attribute and link dispatch (lines 334, 477 and 553)
  cites: TYP-04
  evidence: 'confidence: 1.0,'
  cost: The directed-ingestion confidence rule is written three times as a bare literal, and tests repeat it. The meaning ("the server forces full confidence") is stated only in a tool description, not by a name. Changing the policy means finding every `1.0`.
  correction: Define a named constant, for example DIRECTED_CONFIDENCE, and use it at all three dispatch sites.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: logger field `component` across the file (for example lines 248, 278, 299, 459, 534 and 616)
  cites: TYP-04
  evidence: 'component: "ingestion.directed",'
  cost: The log component name is spelled out in more than ten log calls. A rename means editing each one, and a single missed copy splits the logs for this component across two names.
  correction: Name it once as a constant, or derive a child logger bound to the component.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: directedIngestionService (lines 191-663)
  cites: MNT-01
  evidence: 'export async function directedIngestionService(

    [...] (the function body runs to the closing brace at line 663)'
  cost: The function is about 470 lines. It parses, builds the intake, runs four dispatch loops, closes the run and assembles the response. A change to any one stage means reading all of it, and a new behavior tends to become another branch in the loop.
  correction: 'Extract a named helper per stage: intake, dispatch fragments, dispatch nodes, dispatch attributes, dispatch links, finalise.'
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: verifyNodePin (lines 680-717)
  cites: MNT-01
  evidence: "async function verifyNodePin(\n  pool: Pool,\n  nodeId: string\n):"
  cost: The function is about 38 lines and mixes connection handling, a query, and two refusal shapes. It is past the thirty-line limit.
  correction: Split the query from the refusal construction.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: closeRunCompletedSafe (lines 791-828)
  cites: MNT-01
  evidence: "async function closeRunCompletedSafe(\n  pool: Pool,\n  llmRunId: string,\n  logger: Logger\n): Promise<void> {"
  cost: The function is about 38 lines, with a nested try/catch inside a catch. It is past the thirty-line limit, and the double-log path is hard to follow.
  correction: Extract the rollback-and-log into a helper.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: readClosedRunSafe (lines 830-880)
  cites: MNT-01
  evidence: "async function readClosedRunSafe(\n  pool: Pool,\n  llmRunId: string,\n  logger: Logger\n): Promise<{"
  cost: The function is about 50 lines and builds the fallback, handles a missing row, maps the row and handles errors. It is past the thirty-line limit.
  correction: Extract the row mapping and the fallback construction.
- pass: standard
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  where: failure-report block repeated in the fragment, node, attribute and link branches (lines 359-365, 436-442, 511-518 and 591-597)
  cites: MNT-03
  evidence: "error: {\n  code: envelope.error.code,\n  message: envelope.error.message,\n  ...(envelope.error.details !== undefined\n    ? { details: envelope.error.details }\n    : {}),\n},"
  cost: The same envelope-to-report-error conversion is copied four times. A change to what the report exposes of a failure must be made in four places. The copies can diverge, so a fragment failure and a link failure report differently.
  correction: Call one helper that turns a failed envelope into the report's `error` field.
reconciliation: siegard-reconcile/ingest-consolidation-fixes.md
run: run/ingest-consolidation-fixes
---

## What it is
Three passes read the seven files the three tasks wrote, a captured run of the registry's five steps passed over the whole tree, and the conformance pass folded into the reconciliation record named above.
The failures pass did not run because the run passed.

## Notes
The proof of the description task offered the parity test as the proof of constraints/chat-directed-ingestion-description-matches-mcp, and the staging refused to certify it because the trace binds that constraint to no file; the implementation record answered the node by how and not by encoded_at, so that claim was left out of the staging and is uncertified.
The two certifications staged came back partial, each with a testable remainder: the test's store stand-in applies the query's own filters, so what the real query selects is not exercised.
Findings of the conformance pass over dto/index.ts about ingest_document, list_recent_ingestions and start_async_ingestion lie in text this change did not write; the review read the whole file.
A conformance return of three judges came back inside a code fence and was refused by the fold; the three were delegated again with the format fixed, and the first answers were replaced.
The standard pass left out of scope the rules a tool decides and the rules it could not hold against the set; its looked_past text names them.
