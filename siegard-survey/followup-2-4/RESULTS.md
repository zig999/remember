# Follow-up 2 e 4 da adoção do banco

P = `~/.claude/plugins/cache/siegard-generator/siegard/4.27.0`. Sessão de 2026-09-30.

## Fase 0 — pré-condições

```
$ grep '"version"' $P/.claude-plugin/plugin.json
  "version": "4.27.0"
[exit 0]
```

```
$ git status --porcelain -- specification backend migrations siegard-trace.json siegard-reconcile siegard.json
[exit 0]
```

```
$ python3 -B $P/bin/spec.py specification
specification sound: 50 element(s), 231 rule(s), 8 scenario(s), 2 contract(s), 8 constraint(s) across 2 context(s); 85 decision(s) disclosed, 1 location(s) retired
[exit 0]
```

```
$ python3 -B $P/bin/trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
domain/knowledge-base/accepted-fragment-filter: bound at sha256:1b25aa96d866d21eb71c4539179a67e630f7cd8e0a486ee55d569f750e61c48c, now sha256:a5d33ecf0d633813dfb40119cbdc8b4ca73ba5d8249039fc97b3156eb4a080db; the specification moved since this bind
rules/knowledge-base/page-defaults: bound at sha256:bb7cbf8a74e64bbfd13c556601f21c9e8ef07888fd30286e00c80acb609a0120, now sha256:4a1d00a6c819add84291f8236ccecd6f980bae2fd75b3571fb551f02212b3786; the specification moved since this bind
backend/src/modules/query-retrieval/service/accepted-fragments.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type
backend/src/modules/query-retrieval/service/provenance.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type

4 drift finding(s) over 261 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  2 moved: bound to a node whose text moved since the bind; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
[exit 1]
```

```
$ python3 -B $P/bin/trace.py --owed backend
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/modules/ingestion/chunker/v1.ts
    rules/knowledge-base/speaker-line — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/index.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-attribute.dto.ts
    domain/knowledge-base/value-type — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-fragment.dto.ts
    rules/knowledge-base/fragment-recorded-proposed — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/propose-fragment.handler.ts
    rules/knowledge-base/tool-call-validation-outcome — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/transport.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v4.ts
    rules/knowledge-base/caller-never-states-received — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/affected-nodes.ts
    rules/knowledge-base/affected-nodes-follow-merges — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/directed-ingestion.service.ts
    domain/knowledge-base/directed-item — found against in adopt-ingestion.md
    rules/knowledge-base/every-proposal-audited — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/graph-consolidation.service.ts
    rules/knowledge-base/reaffirmation-consolidates — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/ingestion.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
    scenarios/knowledge-base/held-content-under-another-model — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/llm-run.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/structural.ts
    rules/knowledge-base/attribute-value-parses — found against in adopt-ingestion.md
    scenarios/knowledge-base/impossible-calendar-date-refused — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/temporal.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/dto/search.dto.ts
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/search.repository.ts
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval-r2.md

29 finding(s) no bind closed, over 22 file(s):
  29 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  29 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

19 pair(s) the records answer both ways are not listed above: a clearance closes a finding here. No chronology is available — a record carries no timestamp and several land in one commit — so which judgment is current is a reading of the records themselves.
  `--all` lists them, each with what the trace holds for it now

99 unstated fact(s) the records name, over 43 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  0001_init.sql — CREATE TABLE attribute_key, column version (line 198): The attribute-key node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE attribute_valid_value, column version (line 217): The allowed-value node lists value, label, sort_order and description, and no version. The catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE link_type, column version (line 169): Same as node_type. The link-type node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE node_type, column version (line 156): A per-row version number on catalog rows is a domain fact in the schema alone. The node-type node lists only name and description. The next reader looks in the specification for what the number means and does not find it. [adopt-database.md]
  0001_init.sql — curation_action.reason comment, line 511: The rule that a reason is required on destructive curation actions is stated only here. The curation-action node declares reason as optional and no rule requires it. The DDL comment is the only place a reader finds it. [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337 and the header line 57: That a merged node must point at an active survivor, with path compression on write, is a domain rule the source states. No node in the specification holds it. The specification has only "names the survivor exactly when merged" and "never merged into itself". The rule lives where a reader of the specification will not look. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_message, line 108: A message's creation time is declared and required here, and the chronological index depends on it (idx_chat_message_conversation_created_at). domain/chat/message lists no such attribute. The attribute that orders a conversation's turns is held only in SQL. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_tool_call, line 156: A chat tool call's creation time is declared and required here. domain/chat/tool-call lists no such attribute, so the time a tool call was recorded exists only in the table. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.idempotency_key, line 103 (and lines 86-89): The rule that a user message always carries an idempotency key and an assistant message never does is stated only in a comment; the column allows NULL for every row. The node rules/chat/message-idempotency-key-unique says only that a conversation holds at most one message per key. The rule about which role carries a key has no home in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.stop_reason, lines 100-102: The closed vocabulary of reasons a turn stopped, and the rule that only assistant rows carry one, is stated only in a comment. The column is plain text with no check, and domain/chat/message types stop_reason as a bare string. The vocabulary is a business fact that nobody can find in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_tool_call.tool_name, line 138: The restriction of a chat tool call's tool name to the thirteen query tools is stated only in a comment. The column is unconstrained text, and domain/chat/tool-call types tool_name as a bare string. A reader cannot learn from the specification which tools a chat turn may call. [adopt-database.md]
  0004_chat_persistence.sql — header comment on chat_conversation.title, lines 40-41: A conversation title limited to 1..200 characters is a domain rule. It appears only in this comment, which points to an enforcement in the BFF. No node holds it (domain/chat/conversation types title as a bare string), and no constraint in this file holds it. The next reader looks for the title's limits in the specification, finds none, and cannot tell whether the BFF or the specification is the authority. [adopt-database.md]
  0006_original_input.sql — Line 17-18, the COMMENT ON COLUMN raw_information.original_input statement (text stored in the database catalog).: The statement says the column is null outside chat. The specification does not say that. The raw-information node only lists original_input as an optional string. The candidate rule directed-turn-is-original-input only says a directed ingestion made from a chat turn records the turn's excerpt there. Nothing says original_input stays empty for other sources. A reader of the catalog takes this for a decided rule, and the next reader looks for it in the specification and does not find it. [adopt-database.md]
  seeds/0001_seed.sql — section 2, the description column of the 13 link_type rows (lines 43-81): Each link type's required description is catalog text that only this seed holds. The catalog node states label and inverse and stops there, so a reader who looks in the specification finds no description. Some of it restates permitted pairs in prose that has already drifted from the rule node. The part_of description names org, projeto and evento as sources, but the rule node also permits Task to Project. The node moving would never reach this text. [adopt-database.md]
  seeds/0001_seed.sql — section 4, the description column of the 16 attribute_key rows (lines 139-170): Attribute key descriptions, including remarks on stability and on how corrections are made, live only in this seed. No node holds them. The event_type description lists three values while the allowed-values node lists nine, so the seed text and the specification already disagree in words nobody governs. [adopt-database.md]
  ... and 84 more; `--all` lists them
  each is the analysis's to close, through the node that gives the fact a home

174 place(s) the records name where text in the source restates a node's fact the code holds, over 48 file(s). The pair conforms and none is counted above:
  0001_init.sql — the comment before node_alias_one_canonical_uq, line 371 (rules/knowledge-base/one-canonical-alias) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481 (rules/knowledge-base/attribute-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481, read for links (rules/knowledge-base/link-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment on assertion_status (lines 132-133) and the views banner (lines 529-530) (rules/knowledge-base/effective-status) [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337, and the header line 57 (rules/knowledge-base/merged-node-names-survivor) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_basis_ck, line 402 (rules/knowledge-base/attribute-start-has-basis) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_interval_ck, line 399 (rules/knowledge-base/attribute-validity-ordered) [adopt-database.md]
  0001_init.sql — the header comment lines 58-60 and the comment on raw_information lines 226-228 (rules/knowledge-base/compliance-deletion-tombstones) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — comment above C.3 AttributeKeys, lines 58-60 (rules/knowledge-base/temporal-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the AttributeKey count (rules/knowledge-base/catalog-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the NodeType count (rules/knowledge-base/catalog-node-types) [adopt-database.md]
  seeds/0003_event_type_taxonomy.sql — header comment, lines 6-10 and 26-30 (the "+5 valid_values" list, the original four values, the sort_order note and the totals) (rules/knowledge-base/allowed-event-types) [adopt-database.md]
  src/modules/ingestion/catalog/catalog.ts — `LinkTypeRuleRow` doc comment, lines 47-51 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `domainOf` docstring, lines 227-249 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `isLinkRuleActive` docstring, lines 265-270 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  ... and 159 more; `--all` lists them
  a comment is removed, never refreshed, and the file reconciled after

50 node(s) a refused certification left decided by reading with a testable remainder — the auditor named the assertion that would close each, and a node a certified test decides pays no judge again:
  constraints/ingestion-transports-answer-alike [adopt-ingestion.md]
    would close it: The set of ingestion operations exposed on both transports is finite, and so is the set of refusals each one declares. The remainder is a table: for each shared operation, send one valid input over REST and over MCP and assert the two results are equal. Then, for each refusal that operation declares, send one refusing input over both and assert the two error codes are equal.
    src/modules/ingestion/mcp/propose-link.handler.ts — 6 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/transport.ts — 1 binding(s) a reading decides on this file; closing this one frees its judge
    src/modules/ingestion/routes/ingestion.routes.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/affected-nodes-of-a-run [adopt-ingestion.md]
    would close it: Four checks would close the gap: (a) A link proposal whose outcome is that it superseded a previous assertion, and another whose outcome is disputed, each expected to add both linked nodes to the run's list. (b) An attribute proposal whose outcome is that it superseded a previous assertion, expected to add the node it describes. (c) Two proposals whose nodes both lead to the same surviving node, expected to list that node once, where it was first reached. (d) If the fact is meant to include resolving a merged node to the node it was merged into, a merged node expected to appear as that surviving node. Nothing is needed for (d) if the fact is not meant to include that.
    src/modules/ingestion/service/affected-nodes.ts — 4 binding(s) a reading decides on this file
  rules/knowledge-base/attribute-value-in-allowed-values [adopt-ingestion.md]
    would close it: One input against one expected result. Send a proposal, through proposeAttributeService or POST propose-attribute, for a key with allowed values ("proposta", "relatório"). Give it a value that differs from one of them only by case or accent ("Proposta", "relatorio"). Expect a VALIDATION_INVALID_FORMAT refusal with no node_attribute and no provenance written.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/structural.ts — 2 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/below-confidence-floor-records-nothing [adopt-ingestion.md]
    would close it: Three assertions would close it. First, an attribute proposal at a confidence just under 0.40 (e.g. 0.39) comes back rejected and records no node attribute. Second, a link proposal at 0.39 comes back rejected and records no knowledge link. Third, the same proposals at exactly 0.40 are not rejected with BELOW_CONFIDENCE_FLOOR, which pins the floor at 0.40 for both links and attributes.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/validation/confidence.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-excerpt-is-verbatim [adopt-ingestion.md]
    would close it: Feed inputs that take the `email` header/body split, the `chat` speaker split, the `transcricao` turn split and the BR-07 sentence fallback on an oversize block. For every emitted chunk, the expected result is text exactly equal to the code points of the original between offset_start and offset_end. Then store such content as a raw chunk and read it back: the stored excerpt should equal the same slice of the raw content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-index-follows-content [adopt-ingestion.md]
    would close it: One input would close it: content that has several hard-boundary blocks where at least one is over CHUNK_HARD_MAX. The expected result is that the chunks, taken in order of offset_start, carry chunk_index 0, 1, …, n-1 with no gaps. The same check is needed on the raw chunks read back after ingesting that content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/conflict-disputes [adopt-ingestion.md]
    would close it: One input: a proposal on a type that does not allow multiple current assertions, meeting a current assertion (EXISTING_LINK_ID, and separately EXISTING_ATTR_ID) as a dispute. One expected result: the status write sets disputed on that same assertion's id, shown by the UPDATE's bound id and set status or by reading the assertion back, alongside the new disputed row that supersedes nothing.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/consolidation-records-provenance [adopt-ingestion.md]
    would close it: Each open part takes one input and one expected result. First, a taken link proposal that cites two distinct fragments should leave exactly two provenance rows, one per cited fragment, each on the id of the link it landed on. Second, the same check for a taken attribute proposal, with each row on the attribute it landed on. Third, a taken proposal that consolidates onto an existing link or attribute should add one provenance per cited fragment on that existing assertion, not on a new one.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/content-hash-is-sha256 [adopt-ingestion.md]
    would close it: One input against one expected result. Ingest a raw information whose content includes non-ASCII characters, then read it back. Its content_hash should equal a fixed literal: the known 64-character lowercase hexadecimal SHA-256 digest of that content's UTF-8 bytes, computed independently of sha256Hex. A test built this way exists to check the hash and nothing else.
    src/modules/ingestion/dto/ingest-raw-information.dto.ts — 7 binding(s) a reading decides on this file
    src/modules/ingestion/dto/raw-information.dto.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/hash.ts — 2 binding(s) a reading decides on this file
    src/modules/ingestion/service/ingestion.service.ts — 10 binding(s) a reading decides on this file
  rules/knowledge-base/correction-replaces [adopt-ingestion.md]
    would close it: One input: a proposal with change_hint correction and fragment text with no errata or succession marker, meeting a current assertion. Expected result: the current row closed as superseded, its valid_to untouched, and one new row whose supersedes_*_id is that row's id. Assert this for a link and for an attribute, and if the rule is meant to reach multi-valued types, once for each of those too.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/correction-requires-errata-evidence [adopt-ingestion.md]
    would close it: Each case is one input against one result. A correction whose one cited fragment contains a given word should be accepted, and this should be checked for each of errado, correção, corrigir, correction and correcao. Upper-case and mixed-case forms of at least one word (for example "ERRATA", "Correção") should be accepted. A correction citing several fragments, where exactly one carries a word, should be accepted. A correction citing no fragment should be refused. Each case can be checked at the proposal entry point, so the texts checked are the cited fragments' texts.
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/temporal.ts — 7 binding(s) a reading decides on this file
  rules/knowledge-base/default-prompt-version [adopt-ingestion.md]
    would close it: Input: one document ingestion with no prompt version, with real intake and the extraction orchestrator driven against a fake LLM provider. Expected result: the run it creates records prompt_version "v4", and the system prompt sent to the provider is the v4 system prompt. The same assertion is needed for each other document-ingestion entry point that accepts an omitted prompt version.
    src/modules/ingestion/mcp/ingest-document.handler.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/prompts/index.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/directed-attribute-value-as-text [adopt-ingestion.md]
    would close it: Run directedIngestionService with a directed attribute whose value is the number 30, and a second whose value is the boolean true (and one with false). Expect propose_attribute to receive the value as the strings "30", "true" and "false", checked with a strict type-sensitive equality, not a string interpolation.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dependency-failed [adopt-ingestion.md]
    would close it: Four orchestrator inputs would close it, each with the item reported dependency_failed, its propose handler never called, and the reason naming the expected reference. An attribute whose node and evidence are both missing: the reason names the node. A link whose target is missing and whose source and evidence resolve: the reason names the target. A link whose source, target and evidence are all missing: the reason names the source. A link whose target and evidence are both missing and whose source resolves: the reason names the target. Adding one attribute or link whose reference no item in the payload declares would cover the never-declared case.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dispatch-order [adopt-ingestion.md]
    would close it: Send a directed ingestion with at least two attributes and at least two links, each group in a known order. Expect the attribute proposals, and then the link proposals, in exactly that order. Expect the report to list those attribute and link entries in that same order, after the fragments and nodes. To close the sequencing gap as well, the fragment stubs should settle later than they are called. Then expect that no node proposal starts before every fragment proposal has settled.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  ... and 35 more; `--all` lists them
  each is closed by writing the test named, and the route that writes it is a proof increment: `/deliver-scope`, with an ask naming the proof increment and, per fact to close, the node, the assertion verbatim, the record in brackets and the files above, spelled from the target source root as printed — /plan-work plans one task per fact, /implement-task writes the proof alone, and the review certifies it. Which facts are worth a test is the asker's; name the ones wanted, under a new slug
[exit 1]
```

**Decisão:** tudo bate com o contexto (4.27.0; tree limpo nos pathspecs; spec sound; 4 drifts = 2 moved accepted-fragment-filter/page-defaults + 2 code source-type em accepted-fragments.service.ts e provenance.service.ts). Segue para a Fase A.

## Fase A — /siegard:reconcile --audit sobre o backend

### Conferência do file set contra o trace

Script python lendo `siegard-trace.json` (somente leitura): arquivos `backend/` vinculados aos 12 nós domain/knowledge-base/{accepted-fragment-filter, attribute-key, compliance-deletion, information-fragment, knowledge-link, link-type, node-alias, node-attribute, node-type, raw-chunk, raw-information, source-type} + rules/knowledge-base/page-defaults.

```
nodes missing: set()
22 22
extra in trace: []
missing from trace: []
```

**Decisão:** lista do trace idêntica aos 22 arquivos dados. Sem STOP.

### Situate

```
$ python3 -B $P/bin/project.py /home/siegfriedneto/projects/eternal
standard backend: /home/siegfriedneto/projects/eternal/standards/backend-node-service.yaml
standard database: declared none
specification_root: /home/siegfriedneto/projects/eternal/specification
target backend: /home/siegfriedneto/projects/eternal/backend
target database: /home/siegfriedneto/projects/eternal/migrations
work_root: /home/siegfriedneto/projects/eternal/siegard-work
delivery_root: /home/siegfriedneto/projects/eternal/siegard-delivery
telemetry_root: /home/siegfriedneto/projects/eternal/siegard-telemetry
[exit 0]
$ python3 -B $P/bin/trace.py backend
trace sound: 261 binding(s), 5 of them decided by a certified test, traced against specification
[exit 0]
$ ls siegard-reconcile/audit-db-restamp*
ls: cannot access 'siegard-reconcile/audit-db-restamp*': No such file or directory
[exit 2]
```

**Decisões:** project root = `/home/siegfriedneto/projects/eternal` (git toplevel, onde está `siegard.json`); target `backend` nomeado no pedido. spec.py e o tree limpo já verificados na Fase 0 (mesmo estado, nada escrito entre eles).

### Stage

```
$ W=$(mktemp -d)   # /tmp/tmp.GHE8j95syS
$ python3 -B $P/bin/trace.py --stage backend specification audit-db-restamp $W <os 22 arquivos> --audit
staged audit-db-restamp: 22 file(s) to judge over 238 node(s); staged as an audit — no pair omitted, every standing claim goes to a judge; 0 file(s) with nothing left to judge; 0 file(s) the trace binds nothing to
  manifest and packs at /tmp/tmp.GHE8j95syS; no candidate index — an audit asks whether a claim stands, and both answers a candidate separates release the same claim
  save each delegation's return verbatim at /home/siegfriedneto/projects/eternal/siegard-reconcile/audit-db-restamp.returns/<file path with '/' as '__'>.yaml
[exit 0]
```

Manifest: `mechanical` = [], `omitted` = [], `orphaned` = [], `unbound` = [], `certify` = [], `candidates` = {} — sem tier mecânico, então o passo 3b (run.py) foi pulado e o `--fold` roda sem `--run`.

### Judge

22 delegações `siegard:specification-conformance-reviewer`, uma por arquivo, em background: lote de 20 e depois 2 (máx. 20 simultâneos). Prompt de cada juiz: arquivo absoluto + grafia do pack header, caminho do pack, "candidates: none (audit)", specification root, caminho de `schemas/conformance-return.json`, e: "Return only the contract's keys, as YAML, nothing else. One `read` entry per node in the pack. Omit `findings` entirely rather than returning an empty list. Do not ask anything."

Retornos salvos verbatim em `siegard-reconcile/audit-db-restamp.returns/*.yaml`, extraídos do texto final de cada transcript de subagente (não da notificação, que escapa `>`/`&`/`<` como entidades HTML); só a cerca ```yaml foi removida (5 retornos vieram sem cerca). Nenhuma delegação refeita; nenhuma recusada. Dois juízes abriram candidatos mesmo sem tier (`candidates_opened`: response.dto.ts → fragment-status, raw-information; v1.ts → speaker-line) — está no retorno, não foi alterado.

#### Tabela por arquivo

| arquivo | nós | contradicts | unstated | restates | tokens | wall (s) |
|---|---:|---:|---:|---:|---:|---:|
| src/modules/ingestion/catalog/catalog.ts | 6 | 0 | 0 | 2 | 41539 | 22.9 |
| src/modules/ingestion/chunker/v1.ts | 16 | 1 | 1 | 12 | 59603 | 106.9 |
| src/modules/ingestion/dto/ingest-raw-information.dto.ts | 7 | 1 | 0 | 2 | 38972 | 30.4 |
| src/modules/ingestion/dto/propose-fragment.dto.ts | 4 | 1 | 0 | 1 | 39425 | 29.8 |
| src/modules/ingestion/dto/raw-information.dto.ts | 3 | 0 | 2 | 0 | 38358 | 24.8 |
| src/modules/ingestion/mcp/mcp-schemas.ts | 18 | 0 | 0 | 3 | 58120 | 59.7 |
| src/modules/ingestion/prompts/extraction.v1.ts | 21 | 0 | 3 | 2 | 55066 | 73.0 |
| src/modules/ingestion/repository/ingestion.repository.ts | 5 | 0 | 0 | 1 | 41567 | 25.7 |
| src/modules/ingestion/repository/llm-run.repository.ts | 23 | 0 | 0 | 10 | 58807 | 83.3 |
| src/modules/ingestion/service/entity-resolution.service.ts | 12 | 0 | 1 | 4 | 49993 | 51.6 |
| src/modules/ingestion/service/ingestion.service.ts | 10 | 1 | 0 | 2 | 47402 | 42.0 |
| src/modules/ingestion/service/propose-attribute.service.ts | 13 | 0 | 0 | 2 | 43860 | 34.9 |
| src/modules/ingestion/service/propose-fragment.service.ts | 4 | 0 | 0 | 3 | 40074 | 26.7 |
| src/modules/query-retrieval/dto/fragment.dto.ts | 6 | 0 | 1 | 3 | 40656 | 37.5 |
| src/modules/query-retrieval/dto/response.dto.ts | 8 | 1 | 1 | 0 | 44898 | 51.3 |
| src/modules/query-retrieval/dto/search.dto.ts | 9 | 1 | 0 | 1 | 39898 | 31.5 |
| src/modules/query-retrieval/repository/accepted-fragments.repository.ts | 9 | 0 | 0 | 3 | 45244 | 36.9 |
| src/modules/query-retrieval/repository/provenance.repository.ts | 8 | 1 | 1 | 0 | 45276 | 43.3 |
| src/modules/query-retrieval/routes/query-retrieval.routes.ts | 5 | 0 | 0 | 4 | 45325 | 41.7 |
| src/modules/query-retrieval/service/accepted-fragments.service.ts | 9 | 0 | 0 | 0 | 39052 | 18.2 |
| src/modules/query-retrieval/service/provenance.service.ts | 14 | 0 | 0 | 0 | 42770 | 20.4 |
| src/modules/query-retrieval/service/search.service.ts | 28 | 0 | 2 | 2 | 61036 | 84.9 |
| **total (22)** | 238 | 7 | 12 | 57 | 1016941 | 977.3 (soma) |

Tokens e wall conforme o `usage` de cada notificação de subagente.

### Fold

```
$ python3 -B $P/bin/trace.py --fold backend $W $W/premise.yaml siegard-reconcile/audit-db-restamp.md
folded audit-db-restamp.md: 115 node(s) cleared, 36 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed
  next: trace.py --reconciliation siegard-reconcile/audit-db-restamp.md
[exit 0]
$ python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/audit-db-restamp.md
audit-db-restamp.md holds: 22 file(s), 115 node(s) the judgment cleared, 36 it did not, 0 file(s) the trace binds nothing to.
--bind-record will write 115 binding(s) from this record and none for domain/knowledge-base/accepted-fragment-filter, domain/knowledge-base/alias-kind, domain/knowledge-base/attribute-key, domain/knowledge-base/change-hint, domain/knowledge-base/compliance-deletion, domain/knowledge-base/entity-match-review, domain/knowledge-base/fragment-status, domain/knowledge-base/information-fragment, domain/knowledge-base/ingest-tool, domain/knowledge-base/knowledge-link, domain/knowledge-base/knowledge-node, domain/knowledge-base/link-type, domain/knowledge-base/llm-run, domain/knowledge-base/node-alias, domain/knowledge-base/node-attribute, domain/knowledge-base/node-resolution, domain/knowledge-base/node-type, domain/knowledge-base/page, domain/knowledge-base/prompt-version, domain/knowledge-base/provenance, domain/knowledge-base/raw-chunk, domain/knowledge-base/raw-information, domain/knowledge-base/run-status, domain/knowledge-base/run-summary, domain/knowledge-base/search-layer, domain/knowledge-base/search-query, domain/knowledge-base/source-type, domain/knowledge-base/valid-from-basis, domain/knowledge-base/validation-outcome, rules/knowledge-base/correction-requires-errata-evidence, rules/knowledge-base/name-normalization, rules/knowledge-base/required-start-available, rules/knowledge-base/search-total-before-pagination, rules/knowledge-base/stated-start-requires-basis, rules/knowledge-base/unknown-link-type-refused, rules/knowledge-base/validity-start-before-end: a node without `encoded_at` is a node this form cannot bind.
[exit 0]
```

Premise (`$W/premise.yaml`, fora do repo): title "Audit of the 22 backend files bound to the nodes the database adoption changed"; summary = o motivo que você deu (fonte não mudou; vínculos restampados pela adoção sem releitura; as afirmações são o que está sendo relido); cada `change` = "Unchanged — audit; …".

### Bind

```
$ python3 -B $P/bin/trace.py --bind-record backend specification siegard-reconcile/audit-db-restamp.md --workspace $W
bound constraints/document-content-is-data to 2 file(s)
bound constraints/extraction-acts-only-through-proposals to 3 file(s)
bound constraints/retrieval-is-lexical-only to 2 file(s)
bound constraints/retrieval-is-read-only to 2 file(s)
bound constraints/retrieval-transports-answer-alike to 2 file(s)
bound contracts/knowledge-base/retrieval to 3 file(s)
bound domain/knowledge-base/directed-ingestion to 3 file(s)
bound domain/knowledge-base/item-kind to 2 file(s)
bound domain/knowledge-base/link-type-rule to 2 file(s)
bound domain/knowledge-base/proposal to 7 file(s)
bound domain/knowledge-base/search-item to 2 file(s)
bound domain/knowledge-base/tool-call to 7 file(s)
bound rules/knowledge-base/attribute-key-for-node-type to 3 file(s)
bound rules/knowledge-base/attribute-proposal-check-order to 1 file(s)
bound rules/knowledge-base/attribute-value-in-allowed-values to 3 file(s)
bound rules/knowledge-base/below-confidence-floor-records-nothing to 4 file(s)
bound rules/knowledge-base/candidate-similarity to 1 file(s)
bound rules/knowledge-base/chunk-excerpt-is-verbatim to 1 file(s)
bound rules/knowledge-base/chunk-index-follows-content to 1 file(s)
bound rules/knowledge-base/chunk-listing-order to 1 file(s)
bound rules/knowledge-base/chunk-match-cites-its-fragment to 1 file(s)
bound rules/knowledge-base/chunk-offsets-count-code-points to 2 file(s)
bound rules/knowledge-base/chunking-version to 2 file(s)
bound rules/knowledge-base/chunks-never-cross-blocks to 1 file(s)
bound rules/knowledge-base/cited-fragments-anchored to 3 file(s)
bound rules/knowledge-base/cited-fragments-exist to 2 file(s)
bound rules/knowledge-base/cited-fragments-in-run to 2 file(s)
bound rules/knowledge-base/closing-stamps-finish-time to 1 file(s)
bound rules/knowledge-base/compliance-refusal-takes-precedence to 1 file(s)
bound rules/knowledge-base/content-hash-is-sha256 to 4 file(s)
bound rules/knowledge-base/content-hash-unique to 1 file(s)
bound rules/knowledge-base/content-length to 2 file(s)
bound rules/knowledge-base/contentless-blocks-single-chunk to 1 file(s)
bound rules/knowledge-base/directed-attribute-value-shape to 2 file(s)
bound rules/knowledge-base/directed-reference-length to 2 file(s)
bound rules/knowledge-base/directed-requires-fragment-and-node to 3 file(s)
bound rules/knowledge-base/directed-source-label-length to 2 file(s)
bound rules/knowledge-base/directed-turn-is-original-input to 3 file(s)
bound rules/knowledge-base/email-header-block to 1 file(s)
bound rules/knowledge-base/email-quote-blocks to 1 file(s)
bound rules/knowledge-base/empty-provenance-chain-refused to 2 file(s)
bound rules/knowledge-base/exact-alias-resolves to 1 file(s)
bound rules/knowledge-base/expanded-link-requires-provenance to 1 file(s)
bound rules/knowledge-base/expansion-as-of-view to 1 file(s)
bound rules/knowledge-base/expansion-depth-bounds to 1 file(s)
bound rules/knowledge-base/expansion-follows-both-directions to 1 file(s)
bound rules/knowledge-base/expansion-in-effect-only to 1 file(s)
bound rules/knowledge-base/expansion-restricted-to-named-link-types to 1 file(s)
bound rules/knowledge-base/expansion-starts-from-matched-nodes to 1 file(s)
bound rules/knowledge-base/extraction-anchors-to-read-chunk to 2 file(s)
bound rules/knowledge-base/extraction-reads-chunks-in-order to 2 file(s)
bound rules/knowledge-base/fragment-chunks-exist to 1 file(s)
bound rules/knowledge-base/fragment-chunks-in-run-source to 2 file(s)
bound rules/knowledge-base/fragment-item-summary to 1 file(s)
bound rules/knowledge-base/fragment-missing-chunk-first to 1 file(s)
bound rules/knowledge-base/fragment-text-length to 5 file(s)
bound rules/knowledge-base/held-content-records-nothing to 3 file(s)
bound rules/knowledge-base/idempotency-key to 4 file(s)
bound rules/knowledge-base/idempotency-key-unique to 1 file(s)
bound rules/knowledge-base/ingestion-records-chunks-and-run to 1 file(s)
bound rules/knowledge-base/item-flags to 1 file(s)
bound rules/knowledge-base/link-item-summary to 1 file(s)
bound rules/knowledge-base/link-permitted-by-type-rule to 3 file(s)
bound rules/knowledge-base/link-type-in-catalog to 4 file(s)
bound rules/knowledge-base/link-type-rule-in-effect to 1 file(s)
bound rules/knowledge-base/link-types-ignored-without-expansion to 1 file(s)
bound rules/knowledge-base/listing-holds-accepted-only to 1 file(s)
bound rules/knowledge-base/listing-one-entry-per-fragment to 1 file(s)
bound rules/knowledge-base/listing-requires-a-filter to 1 file(s)
bound rules/knowledge-base/listing-total-before-pagination to 2 file(s)
bound rules/knowledge-base/llm-run-lifecycle to 2 file(s)
bound rules/knowledge-base/long-block-sentence-chunks to 2 file(s)
bound rules/knowledge-base/long-sentence-own-chunk to 2 file(s)
bound rules/knowledge-base/matched-node-gains-only-aliases to 1 file(s)
bound rules/knowledge-base/new-assertion-status-from-confidence to 4 file(s)
bound rules/knowledge-base/new-node-aliases to 1 file(s)
bound rules/knowledge-base/no-candidate-creates-active-node to 1 file(s)
bound rules/knowledge-base/node-item-summary to 1 file(s)
bound rules/knowledge-base/node-name-length to 3 file(s)
bound rules/knowledge-base/node-surfaces-only-with-accepted-mention to 2 file(s)
bound rules/knowledge-base/node-type-in-catalog to 4 file(s)
bound rules/knowledge-base/original-input-length to 1 file(s)
bound rules/knowledge-base/orphaned-fragment to 1 file(s)
bound rules/knowledge-base/page-defaults to 2 file(s)
bound rules/knowledge-base/page-limit-bounds to 1 file(s)
bound rules/knowledge-base/page-offset-non-negative to 2 file(s)
bound rules/knowledge-base/pdf-blocks-at-form-feeds to 1 file(s)
bound rules/knowledge-base/proposal-confidence-range to 4 file(s)
bound rules/knowledge-base/provenance-in-recording-order to 2 file(s)
bound rules/knowledge-base/provenance-refused-after-compliance-deletion to 2 file(s)
bound rules/knowledge-base/provenance-requires-accepted-fragment to 2 file(s)
bound rules/knowledge-base/recent-ingestion-latest-run to 1 file(s)
bound rules/knowledge-base/recent-ingestions-limit-bounds to 2 file(s)
bound rules/knowledge-base/recent-ingestions-limit-default to 2 file(s)
bound rules/knowledge-base/recent-ingestions-order to 2 file(s)
bound rules/knowledge-base/refused-proposal-records-only-its-tool-call to 4 file(s)
bound rules/knowledge-base/retry-counts-attempts to 1 file(s)
bound rules/knowledge-base/retry-rejects-orphaned-fragments to 1 file(s)
bound rules/knowledge-base/search-option-defaults to 2 file(s)
bound rules/knowledge-base/search-query-not-blank to 2 file(s)
bound rules/knowledge-base/short-block-one-chunk to 2 file(s)
bound rules/knowledge-base/strong-candidate-resolves to 1 file(s)
bound rules/knowledge-base/summary-counts-orphaned-fragments to 2 file(s)
bound rules/knowledge-base/summary-counts-tool-calls to 2 file(s)
bound rules/knowledge-base/temporal-filters-apply-to-expansion-only to 1 file(s)
bound rules/knowledge-base/tool-call-listing-order to 1 file(s)
bound rules/knowledge-base/tool-call-total-before-pagination to 2 file(s)
bound rules/knowledge-base/turn-blocks to 1 file(s)
bound rules/knowledge-base/uncertain-items-excluded-on-request to 1 file(s)
bound rules/knowledge-base/undivided-sources to 1 file(s)
bound scenarios/knowledge-base/email-without-blank-line-is-one-block to 1 file(s)
bound scenarios/knowledge-base/form-feed-only-pdf-is-one-chunk to 1 file(s)
bound scenarios/knowledge-base/listing-for-unknown-source-is-empty to 2 file(s)
bound scenarios/knowledge-base/stop-words-only-query to 2 file(s)
bound scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing to 2 file(s)
115 binding(s) written at /home/siegfriedneto/projects/eternal/siegard-trace.json, read from audit-db-restamp.md
  this act leaves 2 binding(s) stale — a bind restamps only the nodes it was handed:
    domain/knowledge-base/source-type: backend/src/modules/query-retrieval/service/accepted-fragments.service.ts — this act restamped the file under another node
    domain/knowledge-base/source-type: backend/src/modules/query-retrieval/service/provenance.service.ts — this act restamped the file under another node
    each is a `code` drift finding on the next --check; a reconciliation over these paths is the route, whatever wrote the change
  36 node(s) of audit-db-restamp.md the judgment did not clear, and this bind wrote none of them:
    domain/knowledge-base/accepted-fragment-filter
    domain/knowledge-base/alias-kind
    domain/knowledge-base/attribute-key
    domain/knowledge-base/change-hint
    domain/knowledge-base/compliance-deletion
    domain/knowledge-base/entity-match-review
    domain/knowledge-base/fragment-status
    domain/knowledge-base/information-fragment
    domain/knowledge-base/ingest-tool
    domain/knowledge-base/knowledge-link
    domain/knowledge-base/knowledge-node
    domain/knowledge-base/link-type
    domain/knowledge-base/llm-run
    domain/knowledge-base/node-alias
    domain/knowledge-base/node-attribute
    domain/knowledge-base/node-resolution
    domain/knowledge-base/node-type
    domain/knowledge-base/page
    domain/knowledge-base/prompt-version
    domain/knowledge-base/provenance
    domain/knowledge-base/raw-chunk
    domain/knowledge-base/raw-information
    domain/knowledge-base/run-status
    domain/knowledge-base/run-summary
    domain/knowledge-base/search-layer
    domain/knowledge-base/search-query
    domain/knowledge-base/source-type
    domain/knowledge-base/valid-from-basis
    domain/knowledge-base/validation-outcome
    rules/knowledge-base/correction-requires-errata-evidence
    rules/knowledge-base/name-normalization
    rules/knowledge-base/required-start-available
    rules/knowledge-base/search-total-before-pagination
    rules/knowledge-base/stated-start-requires-basis
    rules/knowledge-base/unknown-link-type-refused
    rules/knowledge-base/validity-start-before-end
    each stays as it stood — its drift, where the file was bound before, is still a finding on the next --check; where it was not, --owed is the only report that will ever say so. The record says what was found against it
[exit 0]
```

### --check backend depois

```
$ python3 -B $P/bin/trace.py --check backend
trace: /home/siegfriedneto/projects/eternal/siegard-trace.json — one file per git toplevel; every target under it reads this same one
domain/knowledge-base/accepted-fragment-filter: bound at sha256:1b25aa96d866d21eb71c4539179a67e630f7cd8e0a486ee55d569f750e61c48c, now sha256:a5d33ecf0d633813dfb40119cbdc8b4ca73ba5d8249039fc97b3156eb4a080db; the specification moved since this bind
backend/src/modules/query-retrieval/service/accepted-fragments.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type
backend/src/modules/query-retrieval/service/provenance.service.ts: the file changed without a rebind — 1 binding(s): domain/knowledge-base/source-type

3 drift finding(s) over 261 binding(s):
  0 orphaned: bound to a node the specification no longer holds — no bind can repair these, and `--prune` is the only thing that clears them
  1 moved: bound to a node whose text moved since the bind; `/reconcile` over the bound files re-reads them against the node as it stands, and a delivery of a task implementing the node restamps it
  0 proof: decided by a test whose text changed since it was certified — the binding is decided by reading again until a judgment certifies the test as it now stands
  2 code over 2 file(s): bound to a file that changed or is gone; `/reconcile` over the files re-reads a file that changed, and `--release` answers one the tree no longer holds
[exit 1]
```

### Relatório do skill (/siegard:reconcile, audit)

- **File set:** os 22 arquivos dados, relativos a `backend/`. Staging: 22 julgados, 0 sem nada a julgar, 0 sem vínculo; 0 pares omitidos (audit); 0 no tier mecânico (nenhum run capturado); nenhuma certificação.
- **Formato do julgamento:** 22 delegações, uma por arquivo, 238 pares nó×arquivo lidos.
- **Resultado por nó:** 151 nós no record: **115 liberados e restampados** e **36 não liberados** (nenhum `collateral`).
  - **33 não liberados porque o fato está "held nowhere"** em pelo menos um arquivo do conjunto, sem finding contra eles. Na maioria, a elementos de domínio que o arquivo só repassa (a forma é declarada em outro lugar). Numa auditoria o caminho é liberar esse par com `--bind … --replace`. As invocações estão abaixo e **não foram executadas**.
  - **3 não liberados por `contradicts`**: `domain/knowledge-base/fragment-status` (response.dto.ts e provenance.repository.ts declaram uma união de 4 valores sem `superseded`), `domain/knowledge-base/raw-chunk` (ingest-raw-information.dto.ts usa `offset_start/offset_end`, e o nó usa `start_offset/end_offset`) e `domain/knowledge-base/search-query` (search.dto.ts usa `query`/`expand_link_types` e limit/offset planos, e o nó usa `text`/`link_types`/`page`). Os três também têm leituras "nowhere" em outros arquivos.
- **Findings em `notes` ("owed a route of its own")**, contra nós aos quais nenhum arquivo do conjunto está vinculado:
  1. `rules/knowledge-base/speaker-line`: `SPEAKER_LINE_REGEX` em chunker/v1.ts:351 aceita formas de timestamp e classe de letras diferentes das do nó (contradicts).
  2. `rules/knowledge-base/fragment-recorded-proposed`: o `.describe` de `confidence` em propose-fragment.dto.ts:22-24 é texto emitido e diz ao modelo que um fragmento <0.40 é "dropped" e ≥0.75 é "stored active" (contradicts).
  3. `contracts/knowledge-base/ingestion`: `noopExisting` em ingestion.service.ts:215-222 busca o run pela idempotency key do request, então reingerir conteúdo já guardado com outro model/prompt_version dá InvariantError onde o contrato promete 200 `noop_existing` (contradicts).
- **Unstated:** 12 fatos em 8 arquivos (lista em `unstated` do record). **Restates:** 57 trechos em 17 arquivos. Nenhum dos dois bloqueia bind; o `--owed` da Fase B lista os dois.
- **Drift depois do bind:** 3 findings, abaixo dos 4 anteriores. `page-defaults` (moved) foi resolvido. `accepted-fragment-filter` continua moved (routes.ts leu nowhere). Os 2 `code` de `source-type` continuam (os dois services leram nowhere).
- **Próxima invocação:** o remainder vem depois de decidir as liberações e os 3 contradicts. Não sai deste run.

#### `--replace` pedido pelo relatório — entregue, NÃO executado (STOP)

`$P` = `~/.claude/plugins/cache/siegard-generator/siegard/4.27.0`. Cada invocação reescreve a entrada inteira do nó, mantendo todo arquivo hoje vinculado menos os que leram "nowhere" nesta auditoria. A lista de "mantidos" foi calculada a partir de `siegard-trace.json` atual e dos retornos.

Antes de rodar, três ressalvas:
1. **`--replace` restampa os arquivos mantidos sem releitura.** O help diz: "A file this call does name is written at the digest read just now". Isso inclui arquivos fora deste conjunto (ex.: `dto/llm-run.dto.ts`, `validation/temporal.ts`, handlers MCP) e `migrations/0001_init.sql`. É o mesmo padrão "restamp sem juiz" que motivou este item.
2. **A grafia de caminhos de outro alvo (`../migrations/…` a partir de `backend`) não foi verificada.** O trace guarda `migrations/0001_init.sql` na mesma entrada, e não confirmei se `--bind backend` aceita esse caminho.
3. **`rules/knowledge-base/name-normalization` ficaria sem arquivo.** O único vínculo é entity-resolution.service.ts, que leu nowhere (`norm()` é função do banco). Nenhuma forma `--replace` libera o último arquivo, e isso fica para decisão sua.

Os 3 nós com `contradicts` (fragment-status, raw-chunk, search-query) estão marcados abaixo. Liberar os pares "nowhere" deles não resolve o finding.

```
# domain/knowledge-base/accepted-fragment-filter: releases src/modules/query-retrieval/routes/query-retrieval.routes.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/accepted-fragment-filter src/modules/query-retrieval/dto/fragment.dto.ts src/modules/query-retrieval/repository/accepted-fragments.repository.ts src/modules/query-retrieval/service/accepted-fragments.service.ts --replace
# domain/knowledge-base/alias-kind: releases src/modules/ingestion/service/entity-resolution.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/alias-kind ../migrations/0001_init.sql --replace
# domain/knowledge-base/attribute-key: releases src/modules/ingestion/prompts/extraction.v1.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/attribute-key src/modules/ingestion/catalog/catalog.ts src/modules/ingestion/service/propose-attribute.service.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/change-hint: releases src/modules/ingestion/prompts/extraction.v1.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/change-hint src/modules/ingestion/dto/propose-link.dto.ts src/modules/ingestion/service/graph-consolidation.service.ts src/modules/ingestion/validation/temporal.ts --replace
# domain/knowledge-base/compliance-deletion: releases src/modules/query-retrieval/service/provenance.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/compliance-deletion src/modules/query-retrieval/repository/accepted-fragments.repository.ts src/modules/query-retrieval/repository/provenance.repository.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/entity-match-review: releases src/modules/ingestion/service/entity-resolution.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/entity-match-review ../migrations/0001_init.sql --replace
# [TAMBÉM CONTRADICTS] domain/knowledge-base/fragment-status: releases src/modules/query-retrieval/service/provenance.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/fragment-status ../migrations/0001_init.sql --replace
# domain/knowledge-base/information-fragment: releases src/modules/ingestion/dto/propose-fragment.dto.ts, src/modules/ingestion/repository/llm-run.repository.ts, src/modules/ingestion/service/propose-fragment.service.ts, src/modules/query-retrieval/service/accepted-fragments.service.ts, src/modules/query-retrieval/service/provenance.service.ts, src/modules/query-retrieval/service/search.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/information-fragment src/modules/ingestion/mcp/mcp-schemas.ts src/modules/query-retrieval/dto/fragment.dto.ts src/modules/query-retrieval/dto/response.dto.ts src/modules/query-retrieval/repository/accepted-fragments.repository.ts src/modules/query-retrieval/repository/provenance.repository.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/ingest-tool: releases src/modules/ingestion/prompts/extraction.v1.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/ingest-tool src/modules/ingestion/dto/index.ts src/modules/ingestion/dto/llm-run.dto.ts src/modules/ingestion/mcp/ingest-toolset.ts src/modules/ingestion/mcp/mcp-schemas.ts src/modules/ingestion/mcp/propose-attribute.handler.ts src/modules/ingestion/mcp/propose-fragment.handler.ts src/modules/ingestion/mcp/propose-link.handler.ts src/modules/ingestion/mcp/propose-node.handler.ts src/modules/ingestion/service/affected-nodes.ts src/modules/ingestion/service/extraction.service.ts --replace
# domain/knowledge-base/knowledge-link: releases src/modules/query-retrieval/repository/provenance.repository.ts, src/modules/query-retrieval/service/provenance.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/knowledge-link ../migrations/0001_init.sql --replace
# domain/knowledge-base/knowledge-node: releases src/modules/ingestion/repository/llm-run.repository.ts, src/modules/ingestion/service/entity-resolution.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/knowledge-node ../migrations/0001_init.sql --replace
# domain/knowledge-base/link-type: releases src/modules/ingestion/prompts/extraction.v1.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/link-type src/modules/ingestion/catalog/catalog.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/llm-run: releases src/modules/ingestion/service/ingestion.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/llm-run src/modules/ingestion/dto/ingest-raw-information.dto.ts src/modules/ingestion/dto/llm-run.dto.ts src/modules/ingestion/mcp/mcp-schemas.ts src/modules/ingestion/mcp/propose-fragment.handler.ts src/modules/ingestion/repository/ingestion.repository.ts src/modules/ingestion/repository/llm-run.repository.ts src/modules/ingestion/service/extraction.service.ts src/modules/ingestion/service/llm-run.service.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/node-alias: releases src/modules/ingestion/service/entity-resolution.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/node-alias src/modules/ingestion/mcp/mcp-schemas.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/node-attribute: releases src/modules/query-retrieval/repository/provenance.repository.ts, src/modules/query-retrieval/service/provenance.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/node-attribute ../migrations/0001_init.sql --replace
# domain/knowledge-base/node-resolution: releases src/modules/ingestion/service/entity-resolution.service.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/node-resolution src/modules/ingestion/dto/propose-node.dto.ts src/modules/ingestion/service/affected-nodes.ts --replace
# domain/knowledge-base/node-type: releases src/modules/ingestion/prompts/extraction.v1.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/node-type src/modules/ingestion/catalog/catalog.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/page: releases src/modules/query-retrieval/dto/search.dto.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/page src/modules/query-retrieval/dto/fragment.dto.ts src/modules/query-retrieval/dto/response.dto.ts src/modules/query-retrieval/mcp/query-toolset.ts src/modules/query-retrieval/repository/accepted-fragments.repository.ts src/modules/query-retrieval/service/accepted-fragments.service.ts src/modules/query-retrieval/service/search.service.ts --replace
# domain/knowledge-base/prompt-version: releases src/modules/ingestion/prompts/extraction.v1.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/prompt-version src/modules/ingestion/prompts/extraction.v2.ts src/modules/ingestion/prompts/extraction.v3.ts src/modules/ingestion/prompts/extraction.v4.ts src/modules/ingestion/prompts/index.ts --replace
# domain/knowledge-base/provenance: releases src/modules/query-retrieval/repository/provenance.repository.ts, src/modules/query-retrieval/service/provenance.service.ts, src/modules/query-retrieval/service/search.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/provenance src/modules/query-retrieval/dto/response.dto.ts ../migrations/0001_init.sql --replace
# [TAMBÉM CONTRADICTS] domain/knowledge-base/raw-chunk: releases src/modules/ingestion/repository/llm-run.repository.ts, src/modules/ingestion/service/ingestion.service.ts, src/modules/query-retrieval/service/accepted-fragments.service.ts, src/modules/query-retrieval/service/provenance.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/raw-chunk src/modules/ingestion/chunker/v1.ts src/modules/ingestion/dto/ingest-raw-information.dto.ts src/modules/ingestion/dto/raw-information.dto.ts src/modules/ingestion/repository/ingestion.repository.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/raw-information: releases src/modules/ingestion/repository/llm-run.repository.ts, src/modules/ingestion/service/ingestion.service.ts, src/modules/query-retrieval/service/accepted-fragments.service.ts, src/modules/query-retrieval/service/provenance.service.ts; also keeps migrations/0001_init.sql, migrations/0006_original_input.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/raw-information src/modules/ingestion/dto/ingest-raw-information.dto.ts src/modules/ingestion/dto/raw-information.dto.ts src/modules/ingestion/mcp/mcp-schemas.ts src/modules/ingestion/prompts/extraction.v1.ts src/modules/ingestion/repository/ingestion.repository.ts ../migrations/0001_init.sql ../migrations/0006_original_input.sql --replace
# domain/knowledge-base/run-status: releases src/modules/ingestion/repository/llm-run.repository.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/run-status src/modules/ingestion/dto/index.ts src/modules/ingestion/dto/llm-run.dto.ts src/modules/ingestion/mcp/mcp-schemas.ts src/modules/ingestion/repository/ingestion.repository.ts src/modules/ingestion/service/extraction.service.ts src/modules/ingestion/service/llm-run.service.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/run-summary: releases src/modules/ingestion/repository/llm-run.repository.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/run-summary src/modules/ingestion/dto/llm-run.dto.ts src/modules/ingestion/mcp/mcp-schemas.ts --replace
# domain/knowledge-base/search-layer: releases src/modules/query-retrieval/service/search.service.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/search-layer src/modules/query-retrieval/dto/response.dto.ts src/modules/query-retrieval/dto/search.dto.ts src/modules/query-retrieval/service/errors.ts --replace
# [TAMBÉM CONTRADICTS] domain/knowledge-base/search-query: releases src/modules/query-retrieval/routes/query-retrieval.routes.ts
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/search-query src/modules/query-retrieval/dto/search.dto.ts src/modules/query-retrieval/mcp/query-toolset.ts src/modules/query-retrieval/service/search.service.ts --replace
# domain/knowledge-base/source-type: releases src/modules/query-retrieval/repository/accepted-fragments.repository.ts, src/modules/query-retrieval/repository/provenance.repository.ts, src/modules/query-retrieval/service/accepted-fragments.service.ts, src/modules/query-retrieval/service/provenance.service.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/source-type src/modules/query-retrieval/dto/response.dto.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/valid-from-basis: releases src/modules/ingestion/prompts/extraction.v1.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/valid-from-basis src/modules/ingestion/dto/propose-link.dto.ts src/modules/ingestion/service/graph-consolidation.service.ts src/modules/ingestion/validation/temporal.ts ../migrations/0001_init.sql --replace
# domain/knowledge-base/validation-outcome: releases src/modules/ingestion/repository/llm-run.repository.ts; also keeps migrations/0001_init.sql (other target)
python3 -B $P/bin/trace.py --bind backend specification domain/knowledge-base/validation-outcome src/modules/ingestion/dto/llm-run.dto.ts src/modules/ingestion/mcp/propose-fragment.handler.ts src/modules/ingestion/mcp/propose-link.handler.ts src/modules/ingestion/service/affected-nodes.ts ../migrations/0001_init.sql --replace
# rules/knowledge-base/correction-requires-errata-evidence: releases src/modules/ingestion/service/propose-attribute.service.ts
python3 -B $P/bin/trace.py --bind backend specification rules/knowledge-base/correction-requires-errata-evidence src/modules/ingestion/validation/temporal.ts --replace
# rules/knowledge-base/name-normalization: releases src/modules/ingestion/service/entity-resolution.service.ts; NOTHING left to keep
# rules/knowledge-base/required-start-available: releases src/modules/ingestion/service/propose-attribute.service.ts
python3 -B $P/bin/trace.py --bind backend specification rules/knowledge-base/required-start-available src/modules/ingestion/validation/temporal.ts --replace
# rules/knowledge-base/search-total-before-pagination: releases src/modules/query-retrieval/dto/response.dto.ts
python3 -B $P/bin/trace.py --bind backend specification rules/knowledge-base/search-total-before-pagination src/modules/query-retrieval/service/search.service.ts --replace
# rules/knowledge-base/stated-start-requires-basis: releases src/modules/ingestion/service/propose-attribute.service.ts
python3 -B $P/bin/trace.py --bind backend specification rules/knowledge-base/stated-start-requires-basis src/modules/ingestion/prompts/extraction.v1.ts src/modules/ingestion/validation/temporal.ts --replace
# rules/knowledge-base/unknown-link-type-refused: releases src/modules/query-retrieval/routes/query-retrieval.routes.ts
python3 -B $P/bin/trace.py --bind backend specification rules/knowledge-base/unknown-link-type-refused src/modules/query-retrieval/service/search.service.ts --replace
# rules/knowledge-base/validity-start-before-end: releases src/modules/ingestion/service/propose-attribute.service.ts
python3 -B $P/bin/trace.py --bind backend specification rules/knowledge-base/validity-start-before-end src/modules/ingestion/validation/temporal.ts --replace
```

**STOP (Fase A).** Para commit (pathspec seu): `siegard-trace.json siegard-reconcile siegard-survey/followup-2-4`. Arquivos novos: `siegard-reconcile/audit-db-restamp.md`, `siegard-reconcile/audit-db-restamp.returns/` (22 yaml). Arquivo alterado: `siegard-trace.json`.

## Fase B — inventário da dívida acumulada

```
$ python3 -B $P/bin/trace.py --owed backend --all
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  backend/src/modules/ingestion/chunker/v1.ts
    rules/knowledge-base/speaker-line — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/index.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-attribute.dto.ts
    domain/knowledge-base/value-type — found against in adopt-ingestion.md
  backend/src/modules/ingestion/dto/propose-fragment.dto.ts
    rules/knowledge-base/fragment-recorded-proposed — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/propose-fragment.handler.ts
    rules/knowledge-base/tool-call-validation-outcome — found against in adopt-ingestion.md
  backend/src/modules/ingestion/mcp/transport.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/ingestion/prompts/extraction.v4.ts
    rules/knowledge-base/caller-never-states-received — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/affected-nodes.ts
    rules/knowledge-base/affected-nodes-follow-merges — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/directed-ingestion.service.ts
    domain/knowledge-base/directed-item — found against in adopt-ingestion.md
    rules/knowledge-base/every-proposal-audited — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    rules/knowledge-base/ambiguous-candidates-need-review — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/graph-consolidation.service.ts
    rules/knowledge-base/reaffirmation-consolidates — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/ingestion.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
    scenarios/knowledge-base/held-content-under-another-model — found against in adopt-ingestion.md
  backend/src/modules/ingestion/service/llm-run.service.ts
    contracts/knowledge-base/ingestion — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/structural.ts
    rules/knowledge-base/attribute-value-parses — found against in adopt-ingestion.md
    scenarios/knowledge-base/impossible-calendar-date-refused — found against in adopt-ingestion.md
  backend/src/modules/ingestion/validation/temporal.ts
    rules/knowledge-base/required-start-fallback — found against in adopt-ingestion.md
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-chunk — found against in adopt-query-retrieval-r2.md
    domain/knowledge-base/raw-information — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/dto/search.dto.ts
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/fragment-status — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/repository/search.repository.ts
    rules/knowledge-base/search-excludes-compliance-deleted-sources — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/search-ranking — found against in adopt-query-retrieval-r2.md
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/assertion-flag — found against in adopt-query-retrieval-r2.md
    rules/knowledge-base/expansion-decay — found against in adopt-query-retrieval-r2.md

29 finding(s) no bind closed, over 22 file(s):
  29 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  29 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

118 pair(s) the records answer both ways are not listed above: a clearance closes a finding here. No chronology is available — a record carries no timestamp and several land in one commit — so which judgment is current is a reading of the records themselves.
  backend/src/modules/query-retrieval/index.ts
    constraints/llm-toolset-omits-fragment-listing — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it no binding
  backend/src/modules/query-retrieval/service/errors.ts
    contracts/knowledge-base/retrieval — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/fragment.dto.ts
    domain/knowledge-base/accepted-fragment-filter — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts
    domain/knowledge-base/accepted-fragment-filter — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/routes/query-retrieval.routes.ts
    domain/knowledge-base/accepted-fragment-filter — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    domain/knowledge-base/accepted-fragment-filter — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    domain/knowledge-base/alias-kind — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/catalog/catalog.ts
    domain/knowledge-base/attribute-key — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/attribute-key — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/propose-attribute.service.ts
    domain/knowledge-base/attribute-key — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/change-hint — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts
    domain/knowledge-base/compliance-deletion — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/compliance-deletion — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/compliance-deletion — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    domain/knowledge-base/entity-match-review — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/fragment-status — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/dto/propose-fragment.dto.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/propose-fragment.service.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/fragment.dto.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/information-fragment — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    domain/knowledge-base/ingest-tool — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/ingest-tool — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/knowledge-link — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/knowledge-link — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/knowledge-node — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    domain/knowledge-base/knowledge-node — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/catalog/catalog.ts
    domain/knowledge-base/link-type — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/link-type — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/dto/ingest-raw-information.dto.ts
    domain/knowledge-base/llm-run — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    domain/knowledge-base/llm-run — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/ingestion.repository.ts
    domain/knowledge-base/llm-run — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/llm-run — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/ingestion.service.ts
    domain/knowledge-base/llm-run — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    domain/knowledge-base/node-alias — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    domain/knowledge-base/node-alias — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/node-attribute — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/node-attribute — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    domain/knowledge-base/node-resolution — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/catalog/catalog.ts
    domain/knowledge-base/node-type — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/node-type — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/fragment.dto.ts
    domain/knowledge-base/page — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/page — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/search.dto.ts
    domain/knowledge-base/page — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts
    domain/knowledge-base/page — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    domain/knowledge-base/page — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/page — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/prompt-version — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/provenance — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/provenance — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/provenance — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md, adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/provenance — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/ingestion/chunker/v1.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/dto/ingest-raw-information.dto.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/dto/raw-information.dto.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/ingestion.repository.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/ingestion.service.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/raw-chunk — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/dto/ingest-raw-information.dto.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/dto/raw-information.dto.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/ingestion.repository.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/ingestion.service.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/raw-information — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    domain/knowledge-base/run-status — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/ingestion.repository.ts
    domain/knowledge-base/run-status — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/run-status — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/mcp/mcp-schemas.ts
    domain/knowledge-base/run-summary — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/run-summary — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/search-layer — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/search.dto.ts
    domain/knowledge-base/search-layer — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/search-layer — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/search.dto.ts
    domain/knowledge-base/search-query — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/routes/query-retrieval.routes.ts
    domain/knowledge-base/search-query — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/search.service.ts
    domain/knowledge-base/search-query — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/response.dto.ts
    domain/knowledge-base/source-type — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/accepted-fragments.repository.ts
    domain/knowledge-base/source-type — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/provenance.repository.ts
    domain/knowledge-base/source-type — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    domain/knowledge-base/source-type — found against in adopt-query-retrieval-r4.md, audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and stale
  backend/src/modules/query-retrieval/service/provenance.service.ts
    domain/knowledge-base/source-type — found against in adopt-query-retrieval-r4.md, adopt-query-retrieval-r6.md, audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and stale
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    domain/knowledge-base/valid-from-basis — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/repository/llm-run.repository.ts
    domain/knowledge-base/validation-outcome — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/repository/scoring.ts
    rules/knowledge-base/chunk-match-never-surfaces — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it no binding
  backend/src/modules/query-retrieval/service/provenance.service.ts
    rules/knowledge-base/compliance-refusal-takes-precedence — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md, audit-db-restamp.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/propose-attribute.service.ts
    rules/knowledge-base/correction-requires-errata-evidence — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/errors.ts
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/provenance.service.ts
    rules/knowledge-base/empty-provenance-chain-refused — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md, audit-db-restamp.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/mcp/query-toolset.ts
    rules/knowledge-base/expansion-depth-bounds — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r5b.md; the trace holds it no binding
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    rules/knowledge-base/listing-excludes-compliance-deleted — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it no binding
  backend/src/modules/query-retrieval/service/accepted-fragments.service.ts
    rules/knowledge-base/listing-order — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it no binding
  backend/src/modules/ingestion/service/entity-resolution.service.ts
    rules/knowledge-base/name-normalization — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/mcp/query-toolset.ts
    rules/knowledge-base/page-limit-bounds — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r5b.md; the trace holds it no binding
  backend/src/modules/query-retrieval/mcp/query-toolset.ts
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r5b.md; the trace holds it no binding
  backend/src/modules/query-retrieval/service/errors.ts
    rules/knowledge-base/provenance-refused-after-compliance-deletion — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/mcp/query-toolset.ts
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r5b.md; the trace holds it no binding
  backend/src/modules/query-retrieval/service/errors.ts
    rules/knowledge-base/provenance-requires-accepted-fragment — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/propose-attribute.service.ts
    rules/knowledge-base/required-start-available — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/errors.ts
    rules/knowledge-base/search-layer-outside-set-refused — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/errors.ts
    rules/knowledge-base/search-query-length — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/errors.ts
    rules/knowledge-base/search-query-must-parse — found against in adopt-query-retrieval-r2.md; cleared in adopt-query-retrieval-r4.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/dto/response.dto.ts
    rules/knowledge-base/search-total-before-pagination — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/search.service.ts
    rules/knowledge-base/search-total-before-pagination — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/ingestion/prompts/extraction.v1.ts
    rules/knowledge-base/stated-start-requires-basis — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/propose-attribute.service.ts
    rules/knowledge-base/stated-start-requires-basis — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/routes/query-retrieval.routes.ts
    rules/knowledge-base/unknown-link-type-refused — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/query-retrieval/service/search.service.ts
    rules/knowledge-base/unknown-link-type-refused — found against in audit-db-restamp.md; cleared in adopt-query-retrieval-r2.md; the trace holds it bound, and current
  backend/src/modules/ingestion/service/propose-attribute.service.ts
    rules/knowledge-base/validity-start-before-end — found against in audit-db-restamp.md; cleared in adopt-ingestion.md; the trace holds it bound, and current

111 unstated fact(s) the records name, over 43 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  0001_init.sql — CREATE TABLE attribute_key, column version (line 198): The attribute-key node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE attribute_valid_value, column version (line 217): The allowed-value node lists value, label, sort_order and description, and no version. The catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE link_type, column version (line 169): Same as node_type. The link-type node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE node_type, column version (line 156): A per-row version number on catalog rows is a domain fact in the schema alone. The node-type node lists only name and description. The next reader looks in the specification for what the number means and does not find it. [adopt-database.md]
  0001_init.sql — curation_action.reason comment, line 511: The rule that a reason is required on destructive curation actions is stated only here. The curation-action node declares reason as optional and no rule requires it. The DDL comment is the only place a reader finds it. [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337 and the header line 57: That a merged node must point at an active survivor, with path compression on write, is a domain rule the source states. No node in the specification holds it. The specification has only "names the survivor exactly when merged" and "never merged into itself". The rule lives where a reader of the specification will not look. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_message, line 108: A message's creation time is declared and required here, and the chronological index depends on it (idx_chat_message_conversation_created_at). domain/chat/message lists no such attribute. The attribute that orders a conversation's turns is held only in SQL. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_tool_call, line 156: A chat tool call's creation time is declared and required here. domain/chat/tool-call lists no such attribute, so the time a tool call was recorded exists only in the table. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.idempotency_key, line 103 (and lines 86-89): The rule that a user message always carries an idempotency key and an assistant message never does is stated only in a comment; the column allows NULL for every row. The node rules/chat/message-idempotency-key-unique says only that a conversation holds at most one message per key. The rule about which role carries a key has no home in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.stop_reason, lines 100-102: The closed vocabulary of reasons a turn stopped, and the rule that only assistant rows carry one, is stated only in a comment. The column is plain text with no check, and domain/chat/message types stop_reason as a bare string. The vocabulary is a business fact that nobody can find in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_tool_call.tool_name, line 138: The restriction of a chat tool call's tool name to the thirteen query tools is stated only in a comment. The column is unconstrained text, and domain/chat/tool-call types tool_name as a bare string. A reader cannot learn from the specification which tools a chat turn may call. [adopt-database.md]
  0004_chat_persistence.sql — header comment on chat_conversation.title, lines 40-41: A conversation title limited to 1..200 characters is a domain rule. It appears only in this comment, which points to an enforcement in the BFF. No node holds it (domain/chat/conversation types title as a bare string), and no constraint in this file holds it. The next reader looks for the title's limits in the specification, finds none, and cannot tell whether the BFF or the specification is the authority. [adopt-database.md]
  0006_original_input.sql — Line 17-18, the COMMENT ON COLUMN raw_information.original_input statement (text stored in the database catalog).: The statement says the column is null outside chat. The specification does not say that. The raw-information node only lists original_input as an optional string. The candidate rule directed-turn-is-original-input only says a directed ingestion made from a chat turn records the turn's excerpt there. Nothing says original_input stays empty for other sources. A reader of the catalog takes this for a decided rule, and the next reader looks for it in the specification and does not find it. [adopt-database.md]
  seeds/0001_seed.sql — section 2, the description column of the 13 link_type rows (lines 43-81): Each link type's required description is catalog text that only this seed holds. The catalog node states label and inverse and stops there, so a reader who looks in the specification finds no description. Some of it restates permitted pairs in prose that has already drifted from the rule node. The part_of description names org, projeto and evento as sources, but the rule node also permits Task to Project. The node moving would never reach this text. [adopt-database.md]
  seeds/0001_seed.sql — section 4, the description column of the 16 attribute_key rows (lines 139-170): Attribute key descriptions, including remarks on stability and on how corrections are made, live only in this seed. No node holds them. The event_type description lists three values while the allowed-values node lists nine, so the seed text and the specification already disagree in words nobody governs. [adopt-database.md]
  seeds/0002_ontology_status_task.sql — C.3 AttributeKeys VALUES, the description column of the three Task rows, lines 68-73: These are catalog values written into attribute_key.description, which the catalog may show or send to the extraction model. The node holds each key and its value type but no description for any attribute key, so this wording lives only in the seed. The next reader looks for it in the specification and does not find it. [adopt-database.md]
  src/modules/ingestion/chunker/config.ts — line 19, the lower bound of CHUNK_TARGET: 1500 is a chunk-size threshold that no node holds, and nothing reads it. The chunking nodes state only 4000 and 2000. The docstring describes a soft window the chunker does not apply. A later reader would take 1500 as a decided minimum chunk size, and it would live only in this file. [adopt-ingestion.md]
  src/modules/ingestion/chunker/config.ts — line 30, READING_TAIL: A 200-unit chunk overlap for retrieval is stated only here, and no code reads it (a grep of backend/src finds no importer). The only node with a 200 is rules/knowledge-base/extraction-reads-chunks-in-order, which is the tail of the previous chunk shown to the model during extraction. That is a different fact. A reader looking for the overlap rule would find it here, and would either not find it in the specification or confuse it with the extraction tail. [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — scanLines (line 298) and the isBlank test in splitEmail (line 229): The code decides what a line and a blank line are. A line ends only at U+000A. A blank line is one of zero length. A whitespace-only line, or any line of a CRLF email (which keeps a trailing "\r"), is never blank. On a CRLF email the header block then never ends and the whole email stays one block. No node says this, so the next reader looks in the specification and does not find the decision. [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — scanLines (lines 294-307, terminator is only `\n`) and splitEmail (line 229, `const isBlank = line.endExclusive === line.start;`): The code defines a line as ending at `\n` only, and a blank line as a zero-length line. A line holding only spaces, or `\r` in a CRLF email, is therefore not blank. A CRLF email's header block then never ends and its quotation changes start no blocks. No node says what a line or a blank line is, so this decision lives only in the code, where the next reader will not look for it. [audit-db-restamp.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.health, lines 150-153: This is a callable capability, with the fields it returns, that no node holds. A search of the specification root for health finds nothing. The tool is offered to the model and described only here. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.ingest_document, lines 148-149: This promises that extraction continues after the caller disconnects, and tells the caller how to recover. No node holds either. The ingestion contract's ingest-document answers describe only the completed answers and refusals. The recovery behaviour exists only in text sent to the model. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.propose_link and propose_attribute, lines 129-140: This states a minimum of one cited fragment for link and attribute proposals. No node holds that minimum. The proposal node gives its evidence association as 0..*, and the only "at least one fragment" rule is the errata rule for corrections. The threshold is stated only in text sent to the model. Whoever reads the specification will not find it, and the specification's 0..* says zero is allowed. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.start_async_ingestion, lines 165-173: This is a whole ingestion operation, asynchronous and returning the run id at once, that the ingestion contract does not list among its operations. The contract lists ingest-document and ingest-directed only. A search of the specification root finds no asynchronous ingestion, so the behaviour and the promise that "Arguments and defaults match `ingest_document` exactly" live only in the source. [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment, `storage_ref` bullet, line 19: The comment claims a domain rule, that a raw information's storage reference is null in v1.0.0. No node holds it, and the schema (`storage_ref: z.string().nullable().optional()`) accepts any string. The repository INSERT in backend/src/modules/ingestion/repository/ingestion.repository.ts names no `storage_ref` column, so the value is silently dropped rather than refused. The next reader looks in the specification for what a supplied storage reference does and finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the `affected_nodes` field, line 102, with the comment on lines 83-89: The response type lets a completed run carry no affected nodes when the lookup failed, and the comment says so. affected-nodes-only-when-completed and the read-llm-run answer say the nodes are listed when the run is completed, with no failure exception. The best-effort omission is a behaviour decided in code and prose, and a reader of the specification will believe a completed run always lists its nodes. [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the `attempts` field of LlmRunResponseSchema, line 98: The schema fixes a lower bound of 1 on a run's attempts. The llm-run node says only that attempts is an integer, and retry-counts-attempts says only that a retry adds one. Neither states that the first attempt counts as 1. The floor is a decision that now lives in this schema, and a reader looking in the specification will not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — `fragment_ids`, lines 41-46: An attribute proposal that cites no fragment is refused here, as a rule of the business. No node states it. The proposal node gives the cited fragments the cardinality 0..*, and the ingestion contract's refusals for propose-attribute name only a missing or wrongly shaped field. A reader looking in the specification for whether an attribute may be proposed without evidence finds nothing, and this line is the only place that says no. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — the `.describe(...)` text on `valid_to`, lines 50-52: The text tells the model that an assertion's validity intervals are half-open. No node holds this for proposals or assertions. The only half-open statement in the specification is the link type rule's `day < valid_to`, and the validity-start-before-end rule says only that the start is strictly before the end. The convention lives in a tool description, and a reader of the specification cannot learn from it whether the end date is inside the interval. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — Header comment, line 3 ("Layer 1 (structural) of the 5-layer validation").: The comment states that validation has five layers and that this file is the first. No node holds a five-layer division. The nodes hold check orders per proposal (`link-proposal-check-order`, `attribute-proposal-check-order`, `proposal-run-checks-first`), and there is none for a fragment proposal. A reader who takes the comment as the layering of validation will look for it in the specification and not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — The `.describe(...)` on `text`, line 16.: This text is part of the tool's schema, so a model reads it as an instruction. It says a fragment's text is a verbatim quote of the chunk and holds one assertion only. No node holds either rule. The `information-fragment` node and `fragment-text-length` say only that the text is a string of 1 to 1000 characters. Nothing in the specification says a fragment must be verbatim or single-assertion, so those rules live only in this description. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The `change_hint` field's default, line 69.: A link proposal that omits its change hint is treated as change hint none. That decides re-affirmation, because reaffirmation-consolidates needs "change hint is none". The specification states the default only for directed ingestion (directed-defaults), so for a proposal from an extraction the default lives only in this schema. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The `fragment_ids` field of ProposeLinkInputSchema, lines 54-59.: The refusal of a link proposal that cites no fragment is a domain rule, and only this schema states it. The specification says a proposal "cites the information fragments it rests on" with cardinality 0..*, and its cited-fragments rules cover only fragments that exist and belong to the run. The next reader looks in the specification for the minimum of one and does not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The `valid_to` field's description, lines 63-65.: This text is sent to the model as the tool description. It states half-open validity intervals for proposals, and no node in the set holds that. The nearest node, validity-start-before-end, says only that the start is strictly before the end. Half-open is stated for link type rules and chunk offsets, not for assertion validity. The convention therefore lives only in what the model is told. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-node.dto.ts — the describe() text on aliases, lines 27-29: The model-facing text promises that an alias the node already holds is not attached a second time. The alias rules say only that a created node holds each proposed alias and that a matched node adds each proposed alias. Nothing states the no-duplicate behavior, so it is a business rule that appears only in a tool description. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-node.dto.ts — the describe() text on node_type, lines 14-16: The model-facing text states that Person, Project and Document are node types the catalog holds. No node in the specification names any catalog node type. A reader who looks in the specification for the catalog's kinds of entity finds none, and the names live only in this tool description and the seed data. [adopt-ingestion.md]
  src/modules/ingestion/dto/raw-information.dto.ts — ChunkLocatorSchema, lines 11-19, the shape of a chunk's locator: The four keys of a locator and their types are a domain fact stated only here. The raw-chunk node holds the locator as an opaque string, and the decision log records that the material gave no shape. A reader who checks the specification finds an opaque string. The shape lives in this schema, and the log's reason ("the retrieval only passes the locator through") no longer describes the system. [adopt-ingestion.md]
  src/modules/ingestion/dto/raw-information.dto.ts — ChunkLocatorSchema, lines 11-20: The four locator keys and their types are a vocabulary the code declares and no node holds. The node types `locator` as a bare `string`, and the decision log records that the shape was left out ("The material names a chunk's locator without giving its shape"). The next reader will look in raw-chunk for what a locator contains and will not find it. The only other pointer is a comment citing "A23". [audit-db-restamp.md]
  src/modules/ingestion/dto/raw-information.dto.ts — RawChunkResponseSchema offset fields, lines 42-43: The bounds (start at least 0, end strictly greater than 0) are a rule the schema applies to chunk offsets. The node gives `start_offset` and `end_offset` only as `integer`, with no bound. The bound lives only in this DTO, where the next reader will not look for it. [audit-db-restamp.md]
  src/modules/ingestion/dto/raw-information.dto.ts — RawChunkResponseSchema, lines 37-46, the wire names of a chunk's excerpt and offsets: The raw-chunk node names these attributes excerpt, start_offset and end_offset, and the ingestion contract promises the chunk's "excerpt, offsets". The wire vocabulary `text`, `offset_start` and `offset_end` is held by no node. A client or a later reader searching the specification for what the chunk read returns will not find these names. The `positive()` bound on the end offset is likewise stated only here. [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the `metadataPointer` spread, lines 184-193: No node says that a directed ingestion from a chat turn records a conversation and message pointer in its raw information's metadata. No node says that a pointer with only one of the two ids is silently dropped. The handler applies the drop and the service merges the ids into metadata (`intakeMetadata.conversation_id = deps.metadataPointer.conversation_id`). The next reader will look for this in the specification, find nothing, and read the code as the decision. [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the catch branch of the delegation, lines 211-226: The ingest-directed operation lists only validation refusals. The handler emits a system-error refusal, with a fixed code and message, for any unexpected throw. That is what the owner is told when the orchestrator fails, and the specification never states it. [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The catch block of safeWriteAuditOnRollback, lines 227-238.: The code lets a refused or failed proposal end up with no tool call when the audit write fails: it logs `tool_call_audit_write_failed` and returns the original envelope. The node says every proposal is recorded as a tool call, and no node states this exception. A run's summary is counted from its tool calls, so such a proposal would be missing from its run's account with no rule saying that can happen. [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The uncaught-error branch of runIngestHandler, lines 185-201.: The code decides that a failed proposal is answered with SYSTEM_INTERNAL_ERROR and this message, and recorded as `error`. The contract's propose-fragment, propose-node, propose-link and propose-attribute answers list no system-failure answer. The only SYSTEM_INTERNAL_ERROR answers the contract holds are for run-extraction and ingest-document. The next reader looks in the specification for how a failed proposal is answered and finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — DEFAULT_INGEST_MODEL, line 49, and its use at line 119: The model an ingest_document run is recorded under, when the caller names none and no environment default is wired, is decided only here. The contract's ingest-document operation says nothing about which model a document ingestion runs under. The model feeds the run's idempotency key, so the value decides which content counts as already ingested. A reader looking in the specification will not find the default. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — already_ingested result, lines 177-189, and readRunStatus, lines 91-104: The contract's already_ingested answer carries the identities, the chunk count and the run's status. The handler adds a `message` field with a recovery instruction. It also lets the status be null when the best-effort read fails (`catch { return undefined; }`). Neither the field nor the null status is held by a node, so a client cannot know from the specification that the status may be absent. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — final catch branch, lines 256-263 (unknown extraction error): A failure that is neither a provider failure nor an extraction failure is answered with SYSTEM_INTERNAL_ERROR carrying the run and raw information identities, not the failed run. The contract holds SYSTEM_INTERNAL_ERROR only "carrying the failed run", so this answer is decided only in the handler. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — intake catch branch, lines 132-153 (pg unavailable branch): This is a refusal code that ingest-document answers when the database is unreachable at intake. The contract's ingest-document refusals list only content length, source type, repeated system errors, unknown prompt version and provider failure. Clients branch on the code, and it is written down only in this handler. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — intake catch branch, lines 149-152 (any other intake failure): The contract holds SYSTEM_INTERNAL_ERROR for ingest-document only "carrying the failed run", for repeated extraction errors or an unknown prompt version. Here the same code answers a persistence failure before any run exists, carrying no run. The answer for this case exists only in the handler. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-toolset.ts — `mapReadError`, the pg-unavailable and unknown-error branches (lines 425-428): `get_ingestion_status` and `list_recent_ingestions` refuse with a service-unavailable error or an internal error. The refusals listed for read-llm-run and list-recent-ingestions are only VALIDATION_INVALID_FORMAT and RESOURCE_NOT_FOUND. The rule for when these operations answer with a SYSTEM_* code lives only in this branch order. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-toolset.ts — the `health` tool registration (lines 325-333): The `ingest` toolset exposes a liveness and database-ping operation that always answers `ok: true`. The contract's operation list and its description of what MCP carries do not include it. The next reader looks in the ingestion contract for what the toolset offers and does not find it. The rule that a database failure appears inside `result` and not as an error is decided only here, in a comment. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — HealthMcpInputSchema, lines 159-171 (registered as the `health` tool at ingest-toolset.ts:325): A liveness and database-reachability tool is exposed on the ingest toolset. No operation in the ingestion contract names it or states what it answers, so this file and its toolset are the only place the tool is recorded. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — IngestDirectedNodeItemSchema `node_id` description, lines 343-349: The refusal code for a failed pin is told to callers by this description, but no node states it. The directed-pinned-node node says only that a pinned node resolves "provided the node exists and is active". The ingestion contract lists no refusal for it. The service answers RESOURCE_NOT_FOUND when the row is absent and VALIDATION_INVALID_FORMAT only when it is inactive, so the description is also narrower than the code. Callers act on a code that lives only in code and emitted text. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — StartAsyncIngestionMcpInputSchema, lines 81-123 (with the header comment at lines 71-79): A tool that ingests a document and extracts it in the background is a capability no node holds. The published ingestion contract lists ingest-document as the one-shot operation and has no background variant. The schema is exported, but the toolset comment at ingest-toolset.ts:287 calls the tool retired, so it is a stale declaration of an operation the specification never stated. The next reader looks for this operation in the contract and finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 289-290 and the `source_label` description, lines 447-454: That the label is persisted under the key `metadata.source_label` on the raw information is a stored-data fact. The directed-ingestion node holds the label only as an optional string, and directed-source-content places it in the recorded content. The metadata key is written by directed-ingestion.service.ts (`intakeMetadata.source_label = payload.source_label;`) and told to callers by this description, but no node states it. It lives in code and in emitted text only. [adopt-ingestion.md]
  src/modules/ingestion/mcp/transport.ts — the `mountMcpEndpoint` options, line 43: The route under which the ingestion toolset is reached is a fact of the published surface, and no node names it. The contract lists operations and says which transport carries them, but gives no endpoint. The path lives only in this file, so a reader who looks in the specification for where an MCP client connects finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — `system()`, inviolable rule 3 (lines 141-142): The atomicity granularity of fragments is told to the model as a rule. No node holds it: fragment-text-length bounds only the length, and a search for "atomic" and "compound" in the specification finds nothing. The decision about what counts as one fragment lives only in the prompt. [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — `system()`, inviolable rule 5 (lines 148-151): The rule that decides whether a stated thing becomes a node or an attribute is held only in the prompt text. The specification has no node for it, so the next reader who asks why a date never becomes a node will not find the decision. [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — line 42, the `MAX_TOKENS` constant: The per-turn output ceiling for an extraction is a number that decides how much a model can propose from one chunk. It lives only in this constant, and no node holds it (I searched the specification root for `8000` and `max_tokens`). The next reader looks for it in the specification and finds nothing. The v2, v3 and v4 prompt modules re-export this constant, so they inherit it too. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — line 42, the `MAX_TOKENS` constant: The per-turn token ceiling caps how much one chunk's extraction can produce, and its only home is this file. Searching the specification for `max_tokens` or `8000` finds no node. The comment cites "TC-12 known_context", which is not a specification node. A reader looking for what limits an extraction turn will look in the specification and find nothing. [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the "Output contract" section of the SYSTEM prompt, lines 195-196: The prompt states a requirement that a link or attribute proposal cite at least one fragment, and that the fragment come from the same chunk. The DTOs enforce the minimum (`fragment_ids: z.array(z.string().uuid()).min(1)` in `dto/propose-link.dto.ts`). No node holds it: `cited-fragments-exist`, `cited-fragments-in-run` and `cited-fragments-anchored` cover only fragments that are cited. The only "at least one fragment" rules in the specification are about directed ingestion and correction evidence. The minimum-of-one rule lives only in code and prompt, where the next reader does not look. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the worked example, lines 203-206 (node type names): The prompt names `Person`, `Project` and `Document` as node types the catalog holds. No node in the specification holds catalog contents (I searched the root for `Person`). If the seed catalog changes, this example teaches the model names that are refused as unknown, and the specification cannot say which side was decided. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the worked example, lines 207-216 (link type names and the `concerns` note): The prompt asserts that the catalog holds link types `responsible_for`, `concerns` and `delivered_to`. It also asserts that `concerns` carries no validity start, and that `responsible_for` takes one. No node holds either (I searched the root for these names). The temporal behaviour of a named link type is decided only in this prompt and in the seed. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the worked example, lines 209-210 (attribute key `deadline`): The prompt names `deadline` as an attribute key of a Project, with a date value and a validity start. No node holds this key, its value type or its temporal nature (I searched the root for `deadline`). The example is the only place in the specification-facing text that states it. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v2.ts — EVENT_DATING_DIRECTIVE, lines 40-44, the first bullet: The prompt names an Event node type and its event_date and end_date attribute keys. Nothing in the specification holds those catalog entries. The comment points at "§15.3" and the seeds instead. The next reader who asks which attribute keys an Event carries looks in the specification, finds only the generic attribute-key shape, and does not find the answer. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v2.ts — EVENT_DATING_DIRECTIVE, lines 41-49, the "always date the occurrence" instruction and the value versus valid_from distinction: The prompt makes it an extraction obligation to date every Event the document dates, and it defines valid_from for an event date as "when that date started to hold / became known (typically the document date)". No node holds either rule. What the model is told to propose for an Event therefore lives only in the prompt text, where a reader of the specification will not look. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — EVENT_CLASSIFICATION_DIRECTIVE, lines 55-61 and the worked example at lines 71-78 (catalog facts about Event attributes and links): The text sent to the model states catalog facts that no node holds. An Event carries an `event_type` attribute. `event_type` is not temporal. An `event_date` attribute exists and takes a validity start. A `participates_in` link type joins Person to Event. The model is told these as business rules. A search of the specification root for event_type, event_date and participates_in finds nothing. Anyone who changes the catalog has no node telling them this prompt depends on it. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — EVENT_CLASSIFICATION_DIRECTIVE, lines 60-62 (fallback value `outro` and the confidence cap): This is a business rule: an unclassifiable event takes the catch-all value `outro` and is deliberately given a confidence that lands it in `uncertain`, so curation sees the catalog gap. No node holds it. The 0.75 boundary is held by new-assertion-status-from-confidence, but the decision to steer confidence below it as a signal to curation is stated only here. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — EVENT_CLASSIFICATION_DIRECTIVE, lines 63-66 (relative dates resolve against the document date): How a relative expression becomes a date is a domain rule: it resolves against the document's date, and that date is justified as basis `document`. No node holds it. The nodes required-start-fallback and valid-from-basis cover the backend's fallback and the basis vocabulary. Neither covers extraction computing a date from "hoje" or "ontem". The prompt is the only place this decision lives. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 8-12 (the original closed `event_type` domain and the values migration 0003 added): The allowed values of the Event `event_type` key are catalog data, and no node in the specification holds them (a search of the specification root for event_type finds nothing). This comment lists them as if the specification did. The next reader who wants to know which event types exist will look in the specification, find nothing, and have to read a migration and a comment to learn it. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v4.ts — RECEIVED_AT_ANCHOR_DIRECTIVE, lines 57-66: the rule for resolving relative dates against document_date and then against received_at: This states which date a relative expression counts from: the document date first, then the reception date. No node holds it. required-start-fallback covers only a proposal that states no start at all, not one where the model resolves a "hoje" or "ontem" itself. A later reader who wants to know how "ontem" is dated will look in the specification, find nothing, and have no reason to look in this prompt. [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the same docstring above insertLlmRun, lines 200-203, the attempts default: A new run starts with one attempt. That fact appears only in this comment and in the DDL default (migrations/0001_init.sql:275, `attempts int NOT NULL DEFAULT 1`). No node holds it: retry-counts-attempts says only that a retry adds one, and llm-run says only that attempts is a required integer. The value the retry arithmetic starts from therefore lives where nobody looks for a business decision. [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — header comment lines 7-17 and the route registrations from line 142 ("/raw-information", "/llm-runs/:llmRunId/retry", "/llm-runs/:llmRunId/propose-fragment" and the rest): The contract publishes the REST operations but no node states their addresses, so the path scheme exists only in this file and its mount point. A client author who looks in the specification for where to call intake, retry or the propose mirrors finds nothing. If the paths change, no node moves with them. A grep over the specification root for "/api/v1" and "raw-information/" returned no match. [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — line 125-126, POST_INGEST_BODY_LIMIT, applied to app.post("/raw-information") at line 144: The number 11 MiB is a size limit on intake that the code applies and no node holds. It is measured in bytes on the HTTP body, and it cites a back-spec rather than a node. The nodes bound content and original input at 10,485,760 UTF-16 code units each, and answer over-length with HTTP 422 VALIDATION_INVALID_FORMAT. A request carrying valid multi-byte content or both fields near their limits can exceed 11 MiB and be refused by the transport before the contract's answer applies. Nobody reading the specification would learn that a second, byte-based ceiling exists. A grep over the specification root for "11 MiB", "bodyLimit" and "413" returned no match. [adopt-ingestion.md]
  src/modules/ingestion/service/affected-nodes.ts — resolveAffectedNodes, Step 3, lines 306-313, with the comment at lines 229-231: The code drops an affected id that no longer resolves to a node row, and the comment calls this "skipped silently". The affected-nodes node says nothing about an affected node that cannot be found, so the omission is a rule that exists only in this file. The next reader looks in the specification for what a run's affected nodes exclude and finds no such exclusion. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — closeRunCompletedSafe, lines 1006-1034, and readClosedRunSafe, lines 1041-1091: When closing or reading the run fails, the response still says `status: "completed"` and carries the epoch as its start and finish times, with attempts 1. The times are invented values no node holds. The stored run may still be running, and the caller cannot tell. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — refForAttribute and refForLink, lines 929-934: The format of the reference a report gives an attribute or a link is a value no node holds. A client reading the report has to learn it from this file. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the affected-nodes resolution catch, lines 767-787: When resolving the affected nodes fails, the response carries an empty `affected_nodes` list on a completed run and the failure goes only to a log. The affected-nodes nodes hold no such degradation, so the caller cannot tell an empty list from a failed lookup. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the intake catch block, lines 369-391: The contract's ingest-directed operation lists only validation refusals. The refusal a caller gets when persisting the payload fails (which code, and the split between an unavailable backing service and an internal error) is stated only here. A client reading the contract cannot know these answers exist. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the intakeMetadata construction, lines 339-344: The raw information's metadata carries a `directed: true` marker and the label under `source_label`. No node holds either key. The next reader who filters or reports on directed sources looks in the specification, finds nothing, and takes the code as the decision. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the metadataPointer merge, lines 345-351, and its dep type, lines 282-294: A directed ingestion made from a chat turn records a pointer to the chat conversation and message inside the raw information's metadata. The spec holds the turn's excerpt as the original input but says nothing of this pointer or its key names. The link from a raw information back to its chat row lives only here. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the pin-failure branch, lines 533-553, and verifyNodePin details, lines 877-890: A pinned node that is absent is reported with RESOURCE_NOT_FOUND. One that is not active is reported with VALIDATION_INVALID_FORMAT, and the details carry a `reason` and a `current_status`. The node says only that the item is rejected. The codes live only here, and the split has no rationale in the specification. [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — TRIGRAM_CANDIDATE_LIMIT constant (line 47) and its use as LIMIT in the step 2 candidate query (line 165): Only the ten most similar nodes are ever weighed. No node states this cap, so the next reader looks in the specification and finds nothing. The cap also changes outcomes. The strong-candidate rule says "when no other active knowledge node of that type reaches 0.55", and the review rule says to pair the new node with each such node. With more than ten nodes at or above 0.55, the eleventh and later are never seen and never get an entity match review row. [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The advisory lock taken before the first node_alias read (lines 114-128).: The rule that concurrent proposals of one name and node type are serialized, so that they resolve to one node, lives only in this file and its comments. No node holds it. A reader looking for it in the specification does not find it. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — `MAX_TURNS_PER_CHUNK` inside `runChunkLoop`, lines 625-627 and 749-755: After 64 turns on one chunk the extraction stops asking about it, counts it as read, logs a warning and moves on without failing the run. That is a decision about when a chunk is deemed read, with a threshold, and no node states it. A chunk can be left partly extracted with the run still completing, and the specification says nothing of it. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the branch at lines 681-686 of `runChunkLoop`: A model turn that ends with neither a stop signal nor any proposal is taken as the chunk being read, and the run goes on. No node states this. It is the case where a chunk yields nothing, and the code alone decides that it is not a failure. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the constants at lines 200-201, `ANTHROPIC_REQUEST_TIMEOUT_MS` and `ANTHROPIC_MAX_RETRIES`, applied in `defaultAnthropicFactory`: These two values decide when a stalled model call counts as the provider failing. That failure is what the contract answers with SYSTEM_LLM_PROVIDER_UNAVAILABLE and a failed run. The contract states the failure but not the five-minute ceiling or the two retries, so the next reader looks for them in the specification and finds only this file. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the default branch of `dispatchToolUse`, lines 282-293: A tool call from the model that names none of the four proposals gets a VALIDATION_INVALID_FORMAT refusal. It counts as a business refusal, so it resets the fatal-burst counter and never counts toward it. No node states what an extraction does with a tool name outside the four proposals. The behavior lives only in this branch. [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — consolidateLink, the attempt loop and the final throw, lines 443-474, and its mirror in consolidateAttribute, lines 710-736: The code retries a racing consolidation once and then answers a proposal with SYSTEM_INTERNAL_ERROR. The specification's ingestion contract lists no such refusal for propose-link or propose-attribute, and no node holds the retry count. The behavior lives only here, so anyone reading the contract will not find it. The count and the second-failure answer are the code's own decision. [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — consolidateLinkOnce correction branch, lines 578-582, and consolidateAttributeOnce correction branch, lines 800-804: The code reports a correction to the caller as outcome `accepted`, while recording a superseded predecessor. No node says what outcome a correction carries. The contract lists accepted, consolidated, superseded_previous and disputed, and shows the superseded identity only with superseded_previous. The label is the code's own decision, justified only by a comment citing BR-25. [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the try/catch around deriveAffectedNodes in getLlmRunById, lines 109-117: The code makes a rule the specification never states. A completed run's read can answer 200 with no affected nodes when the derivation fails, and the failure is neither logged nor surfaced. The contract says a completed run's read carries its affected nodes. A reader who trusts the node will treat a missing list as "none affected", and nothing tells them the code can omit it on error. [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — result mapping, lines 221-232: The link answer carries the superseded link's identity for a correction that is taken as `accepted`. The contract names that identity only for `superseded_previous`. The behaviour is set by this pass-through together with graph-consolidation.service.ts, which returns `superseded_link_id` on `outcome: "accepted"`. No node holds it, so a client and the specification disagree about what an accepted answer contains. [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the `VALIDATION_OUT_OF_RANGE` member of `McpEnvelopeErrorCode`, line 35 (mapped at comment line 17): The ingestion pipeline declares a numeric-bound refusal code that no ingestion operation in the contract uses. The ingestion contract answers an out-of-range confidence (proposal-confidence-range) and the page limit and offset of the tool-call listing with VALIDATION_INVALID_FORMAT. The retrieval contract uses VALIDATION_OUT_OF_RANGE for its own page bounds only. The code lives here as an ingestion decision that a reader would look for in the specification and not find. [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the `VALIDATION_REQUIRED_FIELD` member of `McpEnvelopeErrorCode`, line 33 (mapped at comment line 15): The file declares that ingestion validation may refuse with a code for a missing field. The ingestion contract names only VALIDATION_INVALID_FORMAT for "The proposal is missing a required field or holds one of the wrong shape", and no node in the specification names VALIDATION_REQUIRED_FIELD. The code becomes the only place this refusal code lives, and the two transports could answer a missing field differently. [adopt-ingestion.md]
  src/modules/ingestion/validation/graph-rules.ts — Header comment, lines 3-5.: The comment states the size and authority of the seeded link-type-rule catalog, and no node holds that. A reader trusting it will take 22 as the decided rule set. CLAUDE.md, in its description of `migrations/seeds/0001_seed.sql`, gives 28 rules, so the number may already be stale. [adopt-ingestion.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — ListAcceptedFragmentsQuerySchema, the `.strict()` call on the query object (line 38): A request carrying any query parameter outside llm_run_id, raw_information_id, limit and offset is refused here. The contract's refusals for the listing name only a missing filter, a malformed identifier and out-of-range paging, so this refusal is decided in the DTO. The next reader looks for it in the specification and does not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — ListAcceptedFragmentsQuerySchema, the `limit` field (line 33), and the docstring bullet above it (line 26): The 1..100 bound is held in code here, but no node in this file's set states it. The node that does is rules/knowledge-base/page-limit-bounds, which constrains domain/knowledge-base/page. A change to that node reaches this file only if the bind is added. Until then a reader of this file's nodes finds the default of 20 and no bounds. [audit-db-restamp.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 81-84: The literal value a compliance-deleted source's original input takes is stated only in this prose. I searched the whole specification root, including the decision log, for REDACTED and found no node that holds it. It reads as a decision the business made, but the next reader will look for it in the specification and not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 83-84: The comment states that the original input is excluded from the content hash. I searched the specification for content_hash and content hash and found no node that holds this. It is a rule of the idempotency identity that lives only in prose here. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/response.dto.ts — the comment on ProvenanceRawInformation.original_input, lines 81-84: The comment states that `original_input` becomes the literal `[REDACTED]` after a compliance deletion, and that null is kept for non-chat rows. No node in the specification holds that literal or that redaction. `domain/knowledge-base/raw-information` declares `original_input` as a plain string. The code that writes the literal is in `backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts`. So the redaction value is a business decision that lives only in code and a back-spec citation. The next reader looks in the specification and does not find it. The comment also sits beside `rules/knowledge-base/provenance-refused-after-compliance-deletion`, which says a provenance read reaching a deleted raw information is refused with HTTP 410. The specification does not say that such a read returns `[REDACTED]`. [audit-db-restamp.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QUERY_RETRIEVAL_TOOL_NAMES and the four registerTool calls, lines 118-123 and 219-284: The retrieval contract names its operations search, read-link-provenance, read-attribute-provenance and read-fragment-provenance. The names an MCP client actually calls (get_provenance_link and the others) and the toolset key "query" live only in this file. The next reader who looks in the specification for what the owner's language model calls will not find them. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — search handler input mapping, lines 226-241, and the search description, lines 130-135: The search-query node names its choices text and link_types, and the contract gives no wire names. The input names `query` and `expand_link_types`, and the id parameters `link_id`, `attribute_id` and `fragment_id`, are fixed only in code. A reader comparing the node with the tool sees two vocabularies and no node saying which one the client must send. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/provenance.repository.ts — the ORDER BY clauses of the two chain queries in runChainSql (lines 154 and 179): The order of the chunks inside each fragment (chunk index ascending, then chunk id) and the fragment tie-break by fragment id decide what the owner reads first in a provenance answer. The specification holds only that fragments come in recording order. The chunk order lives only in this SQL, so the next reader looks for it in the specification and does not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/provenance.repository.ts — the comment on `original_input` in ProvenanceChainRow (lines 76-80): The comment states that compliance deletion leaves the literal value '[REDACTED]' in raw_information.original_input. No node holds that value; a search of the specification root for REDACT finds nothing. The next reader looks in the specification, finds nothing, and treats the comment as the decision. Code in this file does not produce or check the value. [audit-db-restamp.md]
  src/modules/query-retrieval/repository/search.repository.ts — listProvenanceForNodes, the ORDER BY clause (line 373): The order in which the fragments that support a node hit are presented is decided here, newest first, and no node states it. Provenance-in-recording-order covers only links and attributes. A reader looking for how a node's supporting fragments are ordered finds no rule. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/search.repository.ts — searchNodeAliasLayer, the SELECT score expression (line 123): A knowledge node's score is decided as the highest rank among its matching aliases, and the specification does not say how a node reached through several aliases is scored. Code becomes the only home of that choice. The next reader who wants to know why a node ranks where it does looks in layer-weights or search-item and finds nothing. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/errors.ts — message of EmptyProvenanceError, lines 85-87: The message tells the owner that an empty provenance chain means legacy data. The node only says that a read of an existing item with an empty chain is refused, and states no cause. The owner is given a diagnosis that lives only in this string. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — line 357, the `layer` of a link search item: The search-item node types `layer` as a search-layer (fragment, node, chunk) and no node says which layer a link item reports. The code decides it is "node". A consumer filtering or grouping by layer inherits that decision, and the next reader will look for it in the specification and find nothing. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — line 56, the constant PER_LAYER_FETCH_LIMIT, passed to searchFragmentLayer, searchNodeAliasLayer and searchChunkLayer at lines 129-147: The number 200 is a cap on what a search can ever rank, and no node states it. Matches beyond the 200th on a layer are dropped before ranking. The reported `total` is `filtered.length` (line 391), so it counts only what survived the cap. A reader who trusts search-total-before-pagination ("counts every search item before the page is cut") would not look here for the reason a total stops at some number. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — resolveLayers, the empty-list branch (line 431): The node gives the default of every search layer to a query that omits the option. The code also treats a present but empty `layers` list as omitted. That is a rule no node holds, so a caller who sends an empty list gets all three layers searched. The decision now lives only in this function. [audit-db-restamp.md]
  src/modules/query-retrieval/service/search.service.ts — the constant PER_LAYER_FETCH_LIMIT (line 56) and its three uses in the layer fan-out (lines 128-148): The cap of 200 candidates per layer is a value the source decided and no node holds. It also sits upstream of the total, so `total = filtered.length` counts at most what the three capped layers returned. The reader who trusts the specification's "counts every search item" finds no cap there, and a query with more than 200 matching fragments reports a smaller total than the knowledge base holds. [audit-db-restamp.md]
  each is the analysis's to close, through the node that gives the fact a home

231 place(s) the records name where text in the source restates a node's fact the code holds, over 52 file(s). The pair conforms and none is counted above:
  0001_init.sql — the comment before node_alias_one_canonical_uq, line 371 (rules/knowledge-base/one-canonical-alias) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481 (rules/knowledge-base/attribute-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481, read for links (rules/knowledge-base/link-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment on assertion_status (lines 132-133) and the views banner (lines 529-530) (rules/knowledge-base/effective-status) [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337, and the header line 57 (rules/knowledge-base/merged-node-names-survivor) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_basis_ck, line 402 (rules/knowledge-base/attribute-start-has-basis) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_interval_ck, line 399 (rules/knowledge-base/attribute-validity-ordered) [adopt-database.md]
  0001_init.sql — the header comment lines 58-60 and the comment on raw_information lines 226-228 (rules/knowledge-base/compliance-deletion-tombstones) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — comment above C.3 AttributeKeys, lines 58-60 (rules/knowledge-base/temporal-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the AttributeKey count (rules/knowledge-base/catalog-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the NodeType count (rules/knowledge-base/catalog-node-types) [adopt-database.md]
  seeds/0003_event_type_taxonomy.sql — header comment, lines 6-10 and 26-30 (the "+5 valid_values" list, the original four values, the sort_order note and the totals) (rules/knowledge-base/allowed-event-types) [adopt-database.md]
  src/modules/ingestion/catalog/catalog.ts — `LinkTypeRuleRow` doc comment, lines 47-51 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `domainOf` docstring, lines 227-249 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `isLinkRuleActive` docstring, lines 265-270 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — header comment, lines 13-21 (closed and open value domains), repeated in the `attributeValidValuesByKeyId` doc comment, lines 96-112 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — header comment, lines 9-11 ("The catalog covers BR-14 ... and BR-15 ...") (rules/knowledge-base/link-permitted-by-type-rule) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — the docstring on LinkTypeRuleRow, lines 47-51 (rules/knowledge-base/link-type-rule-in-effect) [audit-db-restamp.md]
  src/modules/ingestion/catalog/catalog.ts — the docstring on isLinkRuleActive, lines 265-270 (rules/knowledge-base/link-type-rule-in-effect) [audit-db-restamp.md]
  src/modules/ingestion/chunker/config.ts — docstring above CHUNK_HARD_MAX, line 21 (rules/knowledge-base/long-block-sentence-chunks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — RawChunkInput docblock, lines 42-45 (rules/knowledge-base/chunk-excerpt-is-verbatim) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — RawChunkInput docblock, lines 45-46 (rules/knowledge-base/chunk-index-follows-content) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — comment inside the oversize loop in chunkV1, lines 99-103 (rules/knowledge-base/long-sentence-own-chunk) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — comment inside the oversize loop, lines 99-103 (rules/knowledge-base/long-sentence-own-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — comment on the fallback at lines 121-127 (rules/knowledge-base/contentless-blocks-single-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — comment on the fallback in chunkV1, lines 121-126 (rules/knowledge-base/contentless-blocks-single-chunk) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — docstring of RawChunkInput, lines 42-46 (rules/knowledge-base/chunk-excerpt-is-verbatim) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of RawChunkInput, lines 42-46 (rules/knowledge-base/chunk-index-follows-content) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, chat entry, and docstring of splitTurns, lines 150-154 and 261-266 (rules/knowledge-base/turn-blocks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, email entry, and docstring of splitEmail, lines 147-149 and 213-216 (rules/knowledge-base/email-header-block) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, pdf entry, lines 145-146 (rules/knowledge-base/pdf-blocks-at-form-feeds) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitEmail, lines 213-216 (rules/knowledge-base/email-quote-blocks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — header comment, line 11 (rules/knowledge-base/short-block-one-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 11-13 (algorithm step 2, first sentence) (rules/knowledge-base/short-block-one-chunk) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 12-18 (algorithm steps 2-3, sentence fallback) (rules/knowledge-base/long-block-sentence-chunks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 13-19 (rules/knowledge-base/long-block-sentence-chunks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 8-10 (algorithm step 1) (rules/knowledge-base/undivided-sources) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 8-10, and the docstring of splitByHardBoundaries, lines 155-158 (rules/knowledge-base/undivided-sources) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock lines 148-149, and splitEmail docblock lines 213-214 (rules/knowledge-base/email-header-block) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock lines 148-149, and splitEmail docblock lines 213-215 (rules/knowledge-base/email-quote-blocks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock lines 150-154 and splitTurns docblock lines 261-265 (rules/knowledge-base/turn-blocks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock, lines 139-142 (rules/knowledge-base/chunks-never-cross-blocks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock, lines 146-147 (pdf entry) (rules/knowledge-base/pdf-blocks-at-form-feeds) [audit-db-restamp.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment on IngestRawInformationRequestSchema, `content` bullet, lines 16-19 (rules/knowledge-base/content-length) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment on `original_input`, lines 35-39 (rules/knowledge-base/content-hash-is-sha256) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment on `original_input`, lines 35-39 (rules/knowledge-base/original-input-length) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment, `model` and `prompt_version` bullet, lines 22-23 (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — header comment, lines 1-7 (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — the doc comment on `original_input`, lines 35-39 (rules/knowledge-base/original-input-length) [audit-db-restamp.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — the header comment and the `IngestRawInformationRequestSchema` doc comment, lines 1-24 (the `content` bullet, lines 16-18) (rules/knowledge-base/content-length) [audit-db-restamp.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the comment above LlmRunSummarySchema, lines 36-41 (rules/knowledge-base/summary-counts-tool-calls) [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the doc comment above LlmRunResponseSchema, lines 80-90 (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the doc comment on the `orphaned_fragments` field, lines 51-59 (rules/knowledge-base/orphaned-fragment) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — the JSDoc above the `value` field, lines 24-27 (rules/knowledge-base/attribute-value-parses) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — Header comment, lines 4-6, above `ProposeFragmentInputSchema`. (rules/knowledge-base/fragment-text-length) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — header comment, lines 3-6 (rules/knowledge-base/fragment-text-length) [audit-db-restamp.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The docstring above ValidFromBasisSchema, lines 5-15, the part saying `received` MUST NOT appear in this input enum. (rules/knowledge-base/caller-never-states-received) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The same docstring, lines 5-15, the part describing the temporal validator's fallback to `received`. (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/dto/source-type.ts — the header comment, lines 1-5, and the doc comment on SourceTypeSchema, line 9 (domain/knowledge-base/source-type) [adopt-ingestion.md]
  src/modules/ingestion/hash.ts — the docstring above composeIdempotencyKey (lines 20-27) (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/hash.ts — the file header comment (lines 1-6) and the docstring above sha256Hex (lines 10-15) (rules/knowledge-base/content-hash-is-sha256) [adopt-ingestion.md]
  src/modules/ingestion/hash.ts — the last sentence of the composeIdempotencyKey docstring (line 26-27) (rules/knowledge-base/idempotency-key-unique) [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the `IngestDirectedInvocationContext` docblock (lines 85-105) and the comment at lines 174-176 (rules/knowledge-base/directed-turn-is-original-input) [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the header comment block, lines 1-30 (rules/knowledge-base/directed-ingestion-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The assertRunIsRunning docstring, lines 91-102. (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The deriveValidationOutcome docstring, lines 55-65, and the inline comment at lines 85-86. (rules/knowledge-base/tool-call-validation-outcome) [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The file-header comment (lines 9-12, step 4) and the runIngestHandler docstring (lines 129-130). (rules/knowledge-base/refused-proposal-records-only-its-tool-call) [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — header comment, lines 13-16 (constraints/extraction-acts-only-through-proposals) [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — header comment, lines 18-21 (rules/knowledge-base/document-ingestion-extracts-new-content) [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-toolset.ts — the header comment (lines 11-23), the ingest_document comment (lines 243-247) and the Zod-failure audit comment (lines 431-441) (rules/knowledge-base/every-proposal-audited) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment above GetIngestionStatusOutputSchema, lines 199-203, and its docstring, lines 227-233 (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 270-273 and 292-296 (ingest_directed header) (rules/knowledge-base/directed-ingestion-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 276-277 above IngestDirectedRefSchema, and its docstring at line 307 (rules/knowledge-base/directed-reference-length) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 277-280 (the `confidence` absence in the ingest_directed header) and line 420 (rules/knowledge-base/directed-full-confidence) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 281-283 above IngestDirectedValidFromBasisSchema, and its docstring at line 310 (rules/knowledge-base/caller-never-states-received) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 283-288 (the `node_id` pin in the ingest_directed header) (rules/knowledge-base/directed-pinned-node) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — the BR-34 header comment, line 276, and the docblock above IngestDirectedRefSchema, line 307 (rules/knowledge-base/directed-reference-length) [audit-db-restamp.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — the JSDoc above ListRecentIngestionsMcpInputSchema, line 251 (rules/knowledge-base/recent-ingestions-limit-bounds) [audit-db-restamp.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — the same JSDoc above ListRecentIngestionsMcpInputSchema, line 251 (rules/knowledge-base/recent-ingestions-limit-default) [audit-db-restamp.md]
  src/modules/ingestion/mcp/propose-attribute.handler.ts — the header comment, lines 1-9 (rules/knowledge-base/attribute-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/mcp/propose-fragment.handler.ts — the comment above the assertRunIsRunning call in proposeFragmentHandler (lines 71-72) (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/propose-link.handler.ts — the header comment, lines 1-9 (rules/knowledge-base/link-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/mcp/transport.ts — the header comment, lines 10-12 (rules/knowledge-base/every-proposal-audited) [adopt-ingestion.md]
  src/modules/ingestion/mcp/transport.ts — the header comment, lines 10-12 (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the `DocumentMetadata.source_type` doc comment, line 53 (domain/knowledge-base/source-type) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the `system()` doc comment, lines 68-73 (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the comment inside `system()`, lines 89-99 (BR-30 prompt support) (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment at line 29 and the `prevTail` doc comment at line 231 (rules/knowledge-base/extraction-reads-chunks-in-order) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment, lines 22-27 (anti-injection envelope paragraph) (constraints/document-content-is-data) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment, lines 22-27 (anti-injection envelope paragraph) (constraints/document-content-is-data) [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment, lines 29-31 (prev_tail paragraph), repeated in the `UserPromptArgs.prevTail` doc comment at line 231 (rules/knowledge-base/extraction-reads-chunks-in-order) [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 20-22 (the anti-injection envelope reused from v1) (constraints/document-content-is-data) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 26-27 (the prompt version maps to the prompt that ran, through the registry) (rules/knowledge-base/prompt-version-known) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 26-28 (idempotency key includes the prompt version) (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/prompts/index.ts — the JSDoc above UnknownPromptVersionError (line 72) and the JSDoc above selectPromptModule (lines 83-87) (rules/knowledge-base/prompt-version-known) [adopt-ingestion.md]
  src/modules/ingestion/prompts/index.ts — the comment above DEFAULT_PROMPT_VERSION, line 62 (rules/knowledge-base/default-prompt-version) [adopt-ingestion.md]
  src/modules/ingestion/prompts/index.ts — the header comment, lines 10-15 ("An unknown version is a configuration error ... it must never silently run a different prompt than the audit trail records") (rules/knowledge-base/prompt-version-known) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the doc comment above insertRawChunks (lines 153-154) and the doc comment above findChunksByRawInformationId (lines 182-183) (rules/knowledge-base/chunk-listing-order) [audit-db-restamp.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT, line 31 (rules/knowledge-base/idempotency-key-unique) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above RAW_INFORMATION_CONTENT_HASH_CONSTRAINT, line 27 (rules/knowledge-base/content-hash-unique) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above findChunksByRawInformationId, lines 181-184 (rules/knowledge-base/chunk-listing-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above insertLlmRun, lines 200-203, the status default (rules/knowledge-base/ingestion-records-chunks-and-run) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above insertRawChunks, lines 153-154 (rules/knowledge-base/chunk-listing-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring on RawInformationRow.original_input, lines 44-49 (rules/knowledge-base/directed-turn-is-original-input) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of RecentIngestionRow, lines 38-44 (rules/knowledge-base/recent-ingestion-latest-run) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of RecentIngestionRow, lines 40-43 (contracts/knowledge-base/ingestion) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of aggregateToolCallOutcomes, lines 111-118 (rules/knowledge-base/summary-counts-tool-calls) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of aggregateToolCallOutcomes, lines 111-118, and the comment at lines 148-149 (rules/knowledge-base/summary-counts-orphaned-fragments) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of countChunksInSource, lines 347-350 (rules/knowledge-base/fragment-chunks-in-run-source) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of countFragmentsAnchoredToSource, lines 320-326 (rules/knowledge-base/cited-fragments-anchored) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of findRecentIngestions, lines 59-63 (rules/knowledge-base/recent-ingestions-order) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of findToolCallsByRun, line 237 (rules/knowledge-base/tool-call-listing-order) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of retryLlmRunRow, lines 165-168, and docstring of closeLlmRunRow, lines 204-208 (rules/knowledge-base/llm-run-lifecycle) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of retryLlmRunRow, lines 165-171, and the comment at lines 188-189 (rules/knowledge-base/retry-rejects-orphaned-fragments) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `RecentIngestionRow`, lines 38-44 (rules/knowledge-base/recent-ingestion-latest-run) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `aggregateToolCallOutcomes` (lines 115-117) and the inline comment before the orphan query (lines 148-149) (rules/knowledge-base/summary-counts-orphaned-fragments) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `aggregateToolCallOutcomes`, lines 111-114 (the second bullet continues to line 117) (rules/knowledge-base/summary-counts-tool-calls) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `countChunksInSource`, lines 347-350 (rules/knowledge-base/fragment-chunks-in-run-source) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `countFragmentsAnchoredToSource`, lines 320-326 (rules/knowledge-base/cited-fragments-anchored) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `findRecentIngestions`, lines 59-63 (rules/knowledge-base/recent-ingestions-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `findRecentIngestions`, lines 59-63 (rules/knowledge-base/recent-ingestions-limit-bounds) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `findToolCallsByRun`, line 237 (rules/knowledge-base/tool-call-listing-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `insertToolCallStandalone`, lines 287-290 (rules/knowledge-base/every-proposal-audited) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `retryLlmRunRow` (lines 165-168) and the docstring above `closeLlmRunRow` (lines 204-207) (rules/knowledge-base/llm-run-lifecycle) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `retryLlmRunRow` (lines 165-171) and the inline comment before the second query (lines 188-189) (rules/knowledge-base/retry-rejects-orphaned-fragments) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — comment block lines 409-427 above the propose-* mirrors (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — comment lines 288-289 in the run route (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — docstring of handleProposeMirror, lines 484-497 (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — header comment lines 24-44 (TC-13 specifics, points 2 and 4) (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/service/affected-nodes.ts — header comment, lines 19-25 (the CONTRACT block) (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/service/affected-nodes.ts — header comment, lines 27-30, and the comment inside isContributingOutcome, lines 79-86 (rules/knowledge-base/affected-nodes-of-a-run) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — docblock on DirectedAttributeValueSchema, lines 119-129 (rules/knowledge-base/directed-attribute-value-as-text) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — docblock on the sourceExcerpt dep, lines 274-281, and the comment at lines 362-365 (rules/knowledge-base/directed-turn-is-original-input) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 14-19, and the constant docblocks, lines 83-87 (rules/knowledge-base/directed-ingestion-run) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 21-24, and step 4 comment, line 763 (rules/knowledge-base/directed-run-completes) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 26-27, and step 3c comment, lines 599-601 (rules/knowledge-base/directed-full-confidence) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 26-27, and step 3c comment, lines 599-601 (rules/knowledge-base/directed-defaults) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 28-31 (rules/knowledge-base/directed-dependency-failed) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 5-8, and the docblock on synthesiseContent, lines 834-838 (rules/knowledge-base/directed-source-content) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 9-11 (rules/knowledge-base/directed-dispatch-order) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the anchor comment, lines 449-454 (rules/knowledge-base/directed-fragments-anchor-first-chunk) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the docblock on classifyEnvelopeFailureStatus, lines 960-970 (rules/knowledge-base/directed-item-status) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the pin branch comment, lines 511-512, and the docblock on verifyNodePin, lines 854-858 (rules/knowledge-base/directed-pinned-node) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The comment in the exact-match branch (lines 145-146). (rules/knowledge-base/matched-node-gains-only-aliases) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The docblock of MATCH_FLOOR (lines 34-41), the resolveOrCreateNode docblock, step 4, ambiguous bullet (lines 97-99), the comment above the entity_match_review loop (lines 196-199), and the decideFromCandidates docblock (lines 255-261). (rules/knowledge-base/ambiguous-candidates-need-review) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The docblock of MATCH_STRONG (lines 26-32) and the docblock of decideFromCandidates (lines 249-257). (rules/knowledge-base/strong-candidate-resolves) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, Novel bullet (lines 100-101), and the decideFromCandidates docblock, Novel bullet (line 257). (rules/knowledge-base/no-candidate-creates-active-node) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, step 2 (lines 90-91). (rules/knowledge-base/exact-alias-resolves) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, step 3 (lines 92-94). (rules/knowledge-base/candidate-similarity) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, step 5 (lines 102-104), and the docblock of attachCanonicalAndAliases (lines 284-287). (rules/knowledge-base/new-node-aliases) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — docblock of attachCanonicalAndAliases (lines 284-288) and step 5 of the resolveOrCreateNode docblock (lines 102-104). Code holds the same rule in attachCanonicalAndAliases and attachAliases. (rules/knowledge-base/new-node-aliases) [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — docblock of decideFromCandidates (lines 249-262). Code holds the same decision in decideFromCandidates itself, lines 266-281. (rules/knowledge-base/strong-candidate-resolves) [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — docblocks of MATCH_STRONG and MATCH_FLOOR (lines 26-41). Code holds the values in the constants at lines 32 and 41. (rules/knowledge-base/no-candidate-creates-active-node) [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — step 2 of the resolveOrCreateNode docblock (lines 90-91) and the inline comment before the first attachAliases call (lines 145-146). Code holds the same rule in the step 1 query and in attachAliases, which is called without the canonical name. (rules/knowledge-base/matched-node-gains-only-aliases) [audit-db-restamp.md]
  src/modules/ingestion/service/extraction.service.ts — the comment at lines 235-241, in `dispatchToolUse`'s propose_fragment case, beside `chunk_ids: [chunkId]` (rules/knowledge-base/extraction-anchors-to-read-chunk) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the docstring at line 388 and the slice at lines 492-494, beside `PREV_TAIL_CHARS` (rules/knowledge-base/extraction-reads-chunks-in-order) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, line 21, and the docstring at line 89, beside the pre-check at lines 424-426 (rules/knowledge-base/extraction-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, line 23, the docstring at line 385, and the comment at lines 716-722, beside `FATAL_ERROR_BURST` and the `startsWith("SYSTEM_")` count (rules/knowledge-base/extraction-fails-on-repeated-system-errors) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, lines 27-29, and the comment at line 523, beside `closeRunSafe(pool, llmRunId, "failed")` and `closeRunSafe(pool, llmRunId, "completed")` (rules/knowledge-base/extraction-closes-its-run) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, lines 8-10 ("or 'refusal' — soft skip"), with the branch at lines 661-667 that holds the behavior (rules/knowledge-base/model-refusal-skips-chunk) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstring on SUCCESSION_MARKERS, line 82 (rules/knowledge-base/succession-signal) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstring on closeVigentForSuccession, lines 266-291 (rules/knowledge-base/succession-before-previous-start) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstring on promoteFragmentsToAccepted, lines 243-251 (rules/knowledge-base/provenance-accepts-proposed-fragment) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstrings on status_for_new_row in ConsolidateLinkArgs and ConsolidateAttributeArgs, lines 126 and 142 (rules/knowledge-base/new-assertion-status-from-confidence) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment "SPEC DIVERGENCE — `status='corrected'`", lines 45-62 (rules/knowledge-base/correction-replaces) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment "SPEC DIVERGENCE — `valid_to` in succession branch", lines 64-70 (rules/knowledge-base/succession-closing-date) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment, lines 34-39 (provenance on every branch) (rules/knowledge-base/consolidation-records-provenance) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment, lines 4-33 (the five branches of §6.5 and their precedence) (rules/knowledge-base/consolidation-precedence) [adopt-ingestion.md]
  src/modules/ingestion/service/ingestion.service.ts — Doc comment above ingestRawInformation, step 1 (line 80). (rules/knowledge-base/content-hash-is-sha256) [adopt-ingestion.md]
  src/modules/ingestion/service/ingestion.service.ts — Doc comment above ingestRawInformation, step 2 (line 81). (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/service/ingestion.service.ts — the docstring of ingestRawInformation, step 1 (line 80) (rules/knowledge-base/content-hash-is-sha256) [audit-db-restamp.md]
  src/modules/ingestion/service/ingestion.service.ts — the docstring of ingestRawInformation, step 2 (line 81) (rules/knowledge-base/idempotency-key) [audit-db-restamp.md]
  src/modules/ingestion/service/llm-run.service.ts — the BR-33 comments in getLlmRunById (lines 97-102) and toLlmRunResponse (lines 254-256) (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the docstring of RunNotRunningError, lines 58-69 (constraints/ingestion-transports-answer-alike) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the docstring of retryLlmRun, line 192 ("Orphan-fragment cleanup happens inside `retryLlmRunRow` in the same TX.") (rules/knowledge-base/retry-rejects-orphaned-fragments) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the docstring of retryLlmRun, lines 187-192 (items 1 and 2 of the order) (rules/knowledge-base/llm-run-lifecycle) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the header comment, lines 6-12 ("Errors:" list) (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — comments at lines 130-134 and 196-198 on the received fallback (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — header comment lines 9-11, and the comment on the guard at lines 71-73 (rules/knowledge-base/attribute-key-for-node-type) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — header comment, lines 7-8 ("Structural layer additionally parses the literal `value`") (rules/knowledge-base/attribute-value-parses) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the closed-domain comment block, lines 85-92 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the comment block above the closed-domain gate, lines 85-92 (rules/knowledge-base/attribute-value-in-allowed-values) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the comment block at the start of Layer 3, lines 130-134 (rules/knowledge-base/required-start-available) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the layer headings at lines 52, 126, 130, 158 and 169, and the ordering comment at lines 85-87 (rules/knowledge-base/attribute-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the comment block inside the mismatch branch, lines 50-55 (rules/knowledge-base/fragment-chunks-exist) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the comment block inside the mismatch branch, lines 50-55 (rules/knowledge-base/fragment-chunks-in-run-source) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the comment inside the `matched !== args.chunk_ids.length` branch, lines 50-55 (rules/knowledge-base/fragment-missing-chunk-first) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the header comment, lines 8-10 ("1. Structural ...") (rules/knowledge-base/fragment-chunks-in-run-source) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the header comment, lines 8-10 ("1. Structural ...") (rules/knowledge-base/fragment-chunks-exist) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-link.service.ts — Layer 3 comment, lines 139-142, and the comment at lines 206-208 (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — header comment, lines 13 and 17-19 (the 0.40 floor) (rules/knowledge-base/below-confidence-floor-records-nothing) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — header comment, lines 21-28 (what the consolidator decides) (rules/knowledge-base/consolidation-precedence) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — header comment, lines 6-15 (the five-layer list) (rules/knowledge-base/link-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-node.service.ts — Header comment, lines 6-8 (scope of TC-09), and the comment above the catalog lookup, line 47 (rules/knowledge-base/node-type-in-catalog) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-node.service.ts — Header comment, lines 9-12 (scope of TC-10), and the comment above the delegation, lines 57-58 [adopt-ingestion.md]
  src/modules/ingestion/service/propose.types.ts — the JSDoc comments above McpOk (line 14) and McpErr (line 20) (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/validation/confidence.ts — header comment, lines 3-5 (the active and uncertain thresholds) (rules/knowledge-base/new-assertion-status-from-confidence) [adopt-ingestion.md]
  src/modules/ingestion/validation/confidence.ts — header comment, lines 5-12 (the below-floor branch and the rejected outcome) (rules/knowledge-base/below-confidence-floor-records-nothing) [adopt-ingestion.md]
  src/modules/ingestion/validation/confidence.ts — header comment, lines 6-7 (supporting fragments) (rules/knowledge-base/fragment-recorded-proposed) [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the header comment, lines 27-29 (`BUSINESS_RUN_NOT_RUNNING` paragraph) (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the header comment, lines 3-8 (BR-13 paragraph) (rules/knowledge-base/tool-call-validation-outcome) [adopt-ingestion.md]
  src/modules/ingestion/validation/graph-rules.ts — The header comment, lines 3-5 and 7-8, above the imports. (rules/knowledge-base/link-permitted-by-type-rule) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the docstring of assertValueInDomain (lines 88-108) and the inline comment on the sort (lines 116-118) (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the docstring of parseAttributeValue (lines 22-26) and the inline comments "Strict ISO YYYY-MM-DD; not free-form." (line 37) and "Strict: must be a finite numeric literal (no NaN, no Infinity)." (line 57) (rules/knowledge-base/attribute-value-parses) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the header comment (line 7) and the docstring of assertKnownType (lines 146-149), for the link_type kind (rules/knowledge-base/link-type-in-catalog) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the header comment (line 7, "Type-catalog membership ... node_type, link_type, attribute_key all live in the seeded catalog") and the docstring of assertKnownType (lines 146-149) (rules/knowledge-base/node-type-in-catalog) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment lines 11-13, the ERRATA_MARKERS docstring at lines 61-65, and the comment at line 117 (rules/knowledge-base/correction-requires-errata-evidence) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment lines 15-22 and the comment at line 159 (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment lines 15-22, the comment at line 135, and the comment at line 167 (rules/knowledge-base/required-start-available) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment, lines 4-5, and the comment at line 107 above the interval check (rules/knowledge-base/validity-start-before-end) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment, lines 6-10, and the comment block at lines 128-135 (rules/knowledge-base/stated-start-requires-basis) [adopt-ingestion.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — Docstring of ListAcceptedFragmentsQuerySchema, line 26 (`offset >= 0`) (rules/knowledge-base/page-offset-non-negative) [audit-db-restamp.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — Docstring of ListAcceptedFragmentsQuerySchema, lines 20-24 (at least one filter MUST be supplied) (rules/knowledge-base/listing-requires-a-filter) [audit-db-restamp.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — Docstring of ListAcceptedFragmentsQuerySchema, lines 26-27 (defaults 20 and 0) (rules/knowledge-base/page-defaults) [audit-db-restamp.md]
  src/modules/query-retrieval/dto/search.dto.ts — The docblock above QueryString (lines 37-47), bullet "btrim non-empty after transform (rejects whitespace-only input)" (rules/knowledge-base/search-query-not-blank) [adopt-query-retrieval-r6.md]
  src/modules/query-retrieval/dto/search.dto.ts — The docblock above QueryString (lines 37-47), first bullets "min 1 char (raw)" and "max 1000 chars (raw)" (rules/knowledge-base/search-query-length) [adopt-query-retrieval-r6.md]
  src/modules/query-retrieval/dto/search.dto.ts — the docblock above QueryString, lines 37-47 (rules/knowledge-base/search-query-not-blank) [audit-db-restamp.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.get_provenance_fragment, lines 146-147 (rules/knowledge-base/provenance-requires-accepted-fragment) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.get_provenance_link, get_provenance_attribute and get_provenance_fragment, lines 138-139, 142-143 and 147 (rules/knowledge-base/provenance-refused-after-compliance-deletion) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.search, line 134, the `expand_depth` (1..3) clause (rules/knowledge-base/expansion-depth-bounds) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.search, line 135, the `limit` (max 100) clause (rules/knowledge-base/page-limit-bounds) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/repository/accepted-fragments.repository.ts — header comment lines 15-20 ("Deduplication"), and the doc comment above `selectAcceptedFragments` (rules/knowledge-base/listing-one-entry-per-fragment) [audit-db-restamp.md]
  src/modules/query-retrieval/repository/accepted-fragments.repository.ts — header comment lines 3-6 and the doc comment above `countAcceptedFragments` (rules/knowledge-base/listing-total-before-pagination) [audit-db-restamp.md]
  src/modules/query-retrieval/repository/accepted-fragments.repository.ts — header comment, lines 1-26 (the "Filter" list), and the `FILTER_WHERE` constant that holds the same predicate (rules/knowledge-base/listing-holds-accepted-only) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the comment block above the /fragments/accepted route, lines 158-163 ("at least one required") (rules/knowledge-base/listing-requires-a-filter) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the comment block above the error mappers, lines 189-197 (BR-24) (constraints/retrieval-transports-answer-alike) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the same comment block, line 162 ("Tombstoned sources are silently omitted") (rules/knowledge-base/listing-excludes-compliance-deleted) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the same comment block, lines 160-161 ("status = 'accepted'") (rules/knowledge-base/listing-holds-accepted-only) [audit-db-restamp.md]
  src/modules/query-retrieval/service/errors.ts — InvalidSearchQueryError constructor, the message chosen for reason "too_long" (line 16) (rules/knowledge-base/search-query-length) [adopt-query-retrieval-r4.md]
  src/modules/query-retrieval/service/search.service.ts — the comment above the link provenance guard, lines 331-332 (rules/knowledge-base/expanded-link-requires-provenance) [audit-db-restamp.md]
  src/modules/query-retrieval/service/search.service.ts — the comment above the node-hit provenance guard, lines 241-243 (rules/knowledge-base/node-surfaces-only-with-accepted-mention) [audit-db-restamp.md]
  a comment is removed, never refreshed, and the file reconciled after

50 node(s) a refused certification left decided by reading with a testable remainder — the auditor named the assertion that would close each, and a node a certified test decides pays no judge again:
  constraints/ingestion-transports-answer-alike [adopt-ingestion.md]
    would close it: The set of ingestion operations exposed on both transports is finite, and so is the set of refusals each one declares. The remainder is a table: for each shared operation, send one valid input over REST and over MCP and assert the two results are equal. Then, for each refusal that operation declares, send one refusing input over both and assert the two error codes are equal.
    src/modules/ingestion/mcp/propose-link.handler.ts — 6 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/transport.ts — 1 binding(s) a reading decides on this file; closing this one frees its judge
    src/modules/ingestion/routes/ingestion.routes.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/affected-nodes-of-a-run [adopt-ingestion.md]
    would close it: Four checks would close the gap: (a) A link proposal whose outcome is that it superseded a previous assertion, and another whose outcome is disputed, each expected to add both linked nodes to the run's list. (b) An attribute proposal whose outcome is that it superseded a previous assertion, expected to add the node it describes. (c) Two proposals whose nodes both lead to the same surviving node, expected to list that node once, where it was first reached. (d) If the fact is meant to include resolving a merged node to the node it was merged into, a merged node expected to appear as that surviving node. Nothing is needed for (d) if the fact is not meant to include that.
    src/modules/ingestion/service/affected-nodes.ts — 4 binding(s) a reading decides on this file
  rules/knowledge-base/attribute-value-in-allowed-values [adopt-ingestion.md]
    would close it: One input against one expected result. Send a proposal, through proposeAttributeService or POST propose-attribute, for a key with allowed values ("proposta", "relatório"). Give it a value that differs from one of them only by case or accent ("Proposta", "relatorio"). Expect a VALIDATION_INVALID_FORMAT refusal with no node_attribute and no provenance written.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/structural.ts — 2 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/below-confidence-floor-records-nothing [adopt-ingestion.md]
    would close it: Three assertions would close it. First, an attribute proposal at a confidence just under 0.40 (e.g. 0.39) comes back rejected and records no node attribute. Second, a link proposal at 0.39 comes back rejected and records no knowledge link. Third, the same proposals at exactly 0.40 are not rejected with BELOW_CONFIDENCE_FLOOR, which pins the floor at 0.40 for both links and attributes.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/validation/confidence.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-excerpt-is-verbatim [adopt-ingestion.md]
    would close it: Feed inputs that take the `email` header/body split, the `chat` speaker split, the `transcricao` turn split and the BR-07 sentence fallback on an oversize block. For every emitted chunk, the expected result is text exactly equal to the code points of the original between offset_start and offset_end. Then store such content as a raw chunk and read it back: the stored excerpt should equal the same slice of the raw content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/chunk-index-follows-content [adopt-ingestion.md]
    would close it: One input would close it: content that has several hard-boundary blocks where at least one is over CHUNK_HARD_MAX. The expected result is that the chunks, taken in order of offset_start, carry chunk_index 0, 1, …, n-1 with no gaps. The same check is needed on the raw chunks read back after ingesting that content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/conflict-disputes [adopt-ingestion.md]
    would close it: One input: a proposal on a type that does not allow multiple current assertions, meeting a current assertion (EXISTING_LINK_ID, and separately EXISTING_ATTR_ID) as a dispute. One expected result: the status write sets disputed on that same assertion's id, shown by the UPDATE's bound id and set status or by reading the assertion back, alongside the new disputed row that supersedes nothing.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/consolidation-records-provenance [adopt-ingestion.md]
    would close it: Each open part takes one input and one expected result. First, a taken link proposal that cites two distinct fragments should leave exactly two provenance rows, one per cited fragment, each on the id of the link it landed on. Second, the same check for a taken attribute proposal, with each row on the attribute it landed on. Third, a taken proposal that consolidates onto an existing link or attribute should add one provenance per cited fragment on that existing assertion, not on a new one.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/content-hash-is-sha256 [adopt-ingestion.md]
    would close it: One input against one expected result. Ingest a raw information whose content includes non-ASCII characters, then read it back. Its content_hash should equal a fixed literal: the known 64-character lowercase hexadecimal SHA-256 digest of that content's UTF-8 bytes, computed independently of sha256Hex. A test built this way exists to check the hash and nothing else.
    src/modules/ingestion/dto/ingest-raw-information.dto.ts — 7 binding(s) a reading decides on this file
    src/modules/ingestion/dto/raw-information.dto.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/hash.ts — 2 binding(s) a reading decides on this file
    src/modules/ingestion/service/ingestion.service.ts — 10 binding(s) a reading decides on this file
  rules/knowledge-base/correction-replaces [adopt-ingestion.md]
    would close it: One input: a proposal with change_hint correction and fragment text with no errata or succession marker, meeting a current assertion. Expected result: the current row closed as superseded, its valid_to untouched, and one new row whose supersedes_*_id is that row's id. Assert this for a link and for an attribute, and if the rule is meant to reach multi-valued types, once for each of those too.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/correction-requires-errata-evidence [adopt-ingestion.md]
    would close it: Each case is one input against one result. A correction whose one cited fragment contains a given word should be accepted, and this should be checked for each of errado, correção, corrigir, correction and correcao. Upper-case and mixed-case forms of at least one word (for example "ERRATA", "Correção") should be accepted. A correction citing several fragments, where exactly one carries a word, should be accepted. A correction citing no fragment should be refused. Each case can be checked at the proposal entry point, so the texts checked are the cited fragments' texts.
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/temporal.ts — 7 binding(s) a reading decides on this file
  rules/knowledge-base/default-prompt-version [adopt-ingestion.md]
    would close it: Input: one document ingestion with no prompt version, with real intake and the extraction orchestrator driven against a fake LLM provider. Expected result: the run it creates records prompt_version "v4", and the system prompt sent to the provider is the v4 system prompt. The same assertion is needed for each other document-ingestion entry point that accepts an omitted prompt version.
    src/modules/ingestion/mcp/ingest-document.handler.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/prompts/index.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/directed-attribute-value-as-text [adopt-ingestion.md]
    would close it: Run directedIngestionService with a directed attribute whose value is the number 30, and a second whose value is the boolean true (and one with false). Expect propose_attribute to receive the value as the strings "30", "true" and "false", checked with a strict type-sensitive equality, not a string interpolation.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dependency-failed [adopt-ingestion.md]
    would close it: Four orchestrator inputs would close it, each with the item reported dependency_failed, its propose handler never called, and the reason naming the expected reference. An attribute whose node and evidence are both missing: the reason names the node. A link whose target is missing and whose source and evidence resolve: the reason names the target. A link whose source, target and evidence are all missing: the reason names the source. A link whose target and evidence are both missing and whose source resolves: the reason names the target. Adding one attribute or link whose reference no item in the payload declares would cover the never-declared case.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-dispatch-order [adopt-ingestion.md]
    would close it: Send a directed ingestion with at least two attributes and at least two links, each group in a known order. Expect the attribute proposals, and then the link proposals, in exactly that order. Expect the report to list those attribute and link entries in that same order, after the fragments and nodes. To close the sequencing gap as well, the fragment stubs should settle later than they are called. Then expect that no node proposal starts before every fragment proposal has settled.
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-full-confidence [adopt-ingestion.md]
    would close it: Submit one input: a directed payload with two fragments, two attributes and two links, each carrying its own confidence of 0.5. Expect one result: every dispatched fragment, attribute and link proposal carries confidence 1.0, or the payload is refused as malformed before intake.
    src/modules/ingestion/dto/index.ts — 16 binding(s) a reading decides on this file, 2 by a certified test
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-pinned-node [adopt-ingestion.md]
    would close it: Three assertions against the real pin verifier would close it. First, a directed node whose node_id names an existing active node, but whose node_type, name and aliases differ from that node's, should come back as exactly that node_id, with no new node or alias created. Second, a node_id naming a merged or deleted node should come back rejected with no resolution. Third, a node_id naming no row at all should come back rejected.
    src/modules/ingestion/dto/index.ts — 16 binding(s) a reading decides on this file, 2 by a certified test
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/directed-turn-is-original-input [adopt-ingestion.md]
    would close it: One input against one expected result. The input is a chat turn with excerpt X that dispatches a directed ingestion, running the real handler, orchestrator and ingestRawInformation with nothing stubbed in between. The expected result is that the raw_information row persisted at the database boundary (a recording pg client) carries original_input = X.
    src/modules/ingestion/mcp/directed-ingest.handler.ts — 1 binding(s) a reading decides on this file; closing this one frees its judge
    src/modules/ingestion/service/directed-ingestion.service.ts — 21 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/ingestion.service.ts — 10 binding(s) a reading decides on this file
  rules/knowledge-base/document-ingestion-extracts-new-content [adopt-ingestion.md]
    would close it: Two tests would close it. First, ingest a document whose content the store does not hold. Expect the document to be stored, a new LLM run to exist for it, and extraction to run against that run's id. Second, ingest the same content again. Expect the answer to report it as already held, no second stored document or new run, and no extraction to run.
    src/modules/ingestion/dto/index.ts — 16 binding(s) a reading decides on this file, 2 by a certified test
    src/modules/ingestion/mcp/ingest-document.handler.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/email-header-block [adopt-ingestion.md]
    would close it: Input: an email whose headers are followed by a blank line, and whose body also has a blank line inside it. Expected result: the first chunk's text is exactly the header lines with no trailing line break. Its offset_end is the code point of the blank line's line break, and the next chunk's offset_start is that offset plus one. The body's own blank line is not treated as the header boundary.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/exact-alias-resolves [adopt-ingestion.md]
    would close it: Run against a store that actually evaluates the lookup. Seed an active Person node with an alias. A Person proposal whose name equals that alias must resolve to that node as matched_existing, with no new node created. Two contrasting inputs should not resolve to it: the same alias held only by a node that is not active, and the same alias held only by an active node of a different node type.
    src/modules/ingestion/service/entity-resolution.service.ts — 12 binding(s) a reading decides on this file
  rules/knowledge-base/extraction-closes-its-run [adopt-ingestion.md]
    would close it: One input: a run with two chunks where every turn ends in end_turn. One expected result: the run's status is written exactly once, as completed, and only after the stream has been called for the last chunk. For example, record how many stream calls had been made at the moment the status update runs, assert it equals the number of chunks, and assert the status history equals ["completed"].
    src/modules/ingestion/service/extraction.service.ts — 8 binding(s) a reading decides on this file, 3 by a certified test
  rules/knowledge-base/fragment-chunks-in-run-source [adopt-ingestion.md]
    would close it: Two inputs would close it. (1) A proposal to a running run that cites one chunk of the run's raw information and one chunk of a different raw information. Expected: a refusal and no fragment written. (2) The same refusal and acceptance run against a store that works out chunk membership from the chunk rows' raw_information_id, not from literal ids, with two runs over different raw information. Expected: a chunk accepted for its own run is refused for the other run.
    src/modules/ingestion/repository/llm-run.repository.ts — 23 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-fragment.service.ts — 4 binding(s) a reading decides on this file
  rules/knowledge-base/held-content-records-nothing [adopt-ingestion.md]
    would close it: Two inputs, each against one expected result, would close it. First, re-ingest content whose hash a raw information already holds, under a model or prompt_version that no existing LLM run's idempotency key covers. Expect the raw information, raw chunk and LLM run counts to be unchanged. Second, send the same held content through ingest_document. Expect the same three counts to be unchanged there too.
    src/modules/ingestion/dto/index.ts — 16 binding(s) a reading decides on this file, 2 by a certified test
    src/modules/ingestion/mcp/ingest-document.handler.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/service/ingestion.service.ts — 10 binding(s) a reading decides on this file
  rules/knowledge-base/idempotency-key [adopt-ingestion.md]
    would close it: Two assertions would close it. First, a reference-vector assertion with four pairwise-distinct inputs (for example content hash H, prompt version "P", model "M", chunking version "C"), checking that the key is exactly the SHA-256 lowercase hex of H+"P"+"M"+"C" and not of any other ordering. Second, an assertion that an LLM run created over a raw information with known content hash, prompt version, model and chunking version carries exactly that digest as its idempotency key.
    src/modules/ingestion/dto/ingest-raw-information.dto.ts — 7 binding(s) a reading decides on this file
    src/modules/ingestion/dto/llm-run.dto.ts — 10 binding(s) a reading decides on this file
    src/modules/ingestion/hash.ts — 2 binding(s) a reading decides on this file
    src/modules/ingestion/service/ingestion.service.ts — 10 binding(s) a reading decides on this file
  rules/knowledge-base/link-permitted-by-type-rule [adopt-ingestion.md]
    would close it: Three inputs, each with its expected result, would close it. First, a link proposal whose only matching rule has valid_to on or before today should be refused with BUSINESS_LINK_RULE_VIOLATION. Second, a proposal whose only matching rule has valid_from after today should be refused the same way. Third, a proposal whose matching rule has valid_from before today and valid_to after today should be permitted. Each should go through validateGraphRule or proposeLinkHandler, not through isLinkRuleActive alone.
    src/modules/ingestion/catalog/catalog.ts — 6 binding(s) a reading decides on this file
    src/modules/ingestion/dto/index.ts — 16 binding(s) a reading decides on this file, 2 by a certified test
    src/modules/ingestion/validation/graph-rules.ts — 1 binding(s) a reading decides on this file; closing this one frees its judge
  rules/knowledge-base/link-type-rule-in-effect [adopt-ingestion.md]
    would close it: Each gap is one input with one expected result. (a) A rule with valid_from equal to the day is in effect. (b) A rule with valid_from before the day and valid_to after it is in effect. (c) A rule with valid_to the day after "today" is in effect. (d) A "today" given as an instant whose UTC date differs from its local date, for example 2026-06-12T23:30-03:00 (UTC date 2026-06-13), against a rule with valid_to 2026-06-13. The expected result is that the rule is not in effect, because the UTC date 2026-06-13 is not before valid_to. A rule with valid_from 2026-06-13 on that same instant is in effect.
    src/modules/ingestion/catalog/catalog.ts — 6 binding(s) a reading decides on this file
  rules/knowledge-base/matched-node-gains-only-aliases [adopt-ingestion.md]
    would close it: One input: a proposal resolved by trigram strong-unique match to an existing node. Its name should appear in no existing alias, and it should carry two or more aliases. Expected result: the node_alias writes are exactly those aliases, each written against the matched node's id, and none carries the proposed name.
    src/modules/ingestion/service/entity-resolution.service.ts — 12 binding(s) a reading decides on this file
  rules/knowledge-base/new-assertion [adopt-ingestion.md]
    would close it: One input: an attribute proposal (proposeAttributeService) where no current node_attribute exists for the (node, key). Expected result: a single new node_attribute row whose supersedes_attribute_id is null, and no current row closed. Adding expect(state.inserts.node_attribute[0]!.supersedes_attribute_id).toBeNull() to "accepted (new) — no vigent row" would close it.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/new-assertion-status-from-confidence [adopt-ingestion.md]
    would close it: Propose a node attribute with no vigent row through proposeAttributeService at confidence 0.75 and at 0.9, expecting the inserted row's status to be 'active'. Propose it at 0.40 and at 0.749999, expecting 'uncertain'. Run the same boundary inputs through proposeLinkService for knowledge links. Then run a succession proposal and a correction proposal at 0.5, expecting the new chained row's status to be 'uncertain', and at 0.9, expecting 'active'.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/service/propose-link.service.ts — 7 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/validation/confidence.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/new-node-aliases [adopt-ingestion.md]
    would close it: Propose a novel node with a name and at least two distinct aliases. Then read back the aliases the created node holds: the name must be there as the canonical alias and every proposed alias as an alias, each tied to the new node. Doing the same for a node created as needs_review closes the other creation path.
    src/modules/ingestion/service/entity-resolution.service.ts — 12 binding(s) a reading decides on this file
  rules/knowledge-base/no-candidate-creates-active-node [adopt-ingestion.md]
    would close it: Each gap is one input against one result, and all of them need a store that applies the candidate filters.
For the threshold, two assertions: - a proposal whose best same-type active candidate is at 0.549 resolves created_new, with
  an active node persisted;
- the same proposal with a candidate at exactly 0.55 does not resolve created_new.
For "active" and "of its node type": a proposal whose only candidate at or above 0.55 is a non-active node, or a node of a different type, still resolves created_new with an active node persisted.
For the status: the persisted node's status is read back from the store, not from the SQL text.
    src/modules/ingestion/service/entity-resolution.service.ts — 12 binding(s) a reading decides on this file
  rules/knowledge-base/pdf-blocks-at-form-feeds [adopt-ingestion.md]
    would close it: One input against one expected result. A pdf whose content is "a\f\fb" should give exactly two blocks, with texts "a" and "b". No block should be empty and no text should contain a form feed.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/prompt-version-known [adopt-ingestion.md]
    would close it: One input and one expected result. Start an extraction (create the LLMRun) with a prompt version the system does not hold, such as 'v99'. It must be refused, and no LLMRun may be recorded with that version. Pair this with an extraction under a held version, which records that version.
    src/modules/ingestion/prompts/index.ts — 3 binding(s) a reading decides on this file
  rules/knowledge-base/proposal-requires-running-run [adopt-ingestion.md]
    would close it: A finite table closes it. Send each proposal kind (fragment, node, link, attribute) on each transport (REST mirror and MCP tool) against a run in each non-running status (completed and failed, or whatever set the run-status node declares). Expect each one to be refused with BUSINESS_RUN_NOT_RUNNING and nothing of that kind written, and check that the same input against a running run is accepted.
    src/modules/ingestion/mcp/handler-base.ts — 4 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/propose-attribute.handler.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/propose-fragment.handler.ts — 7 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/propose-link.handler.ts — 6 binding(s) a reading decides on this file
    src/modules/ingestion/routes/ingestion.routes.ts — 3 binding(s) a reading decides on this file
    src/modules/ingestion/validation/errors.ts — 1 binding(s) a reading decides on this file; closing this one frees its judge
  rules/knowledge-base/provenance-accepts-proposed-fragment [adopt-ingestion.md]
    would close it: Record a provenance citing fragments in known statuses, against a store that actually applies the statements (a real Postgres, or a fake that evaluates status). Cite one fragment in status proposed and one in each other status the fragment-status node declares. Then assert the proposed fragment reads back as accepted and every other fragment reads back with the status it had. Repeat this for provenance recorded on an attribute as well as on a link.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/recent-ingestions-limit-default [adopt-ingestion.md]
    would close it: One input against one expected result. Seed a store with more than 10 ingestions (say 12) and call list_recent_ingestions with no limit against a query path that actually applies the SQL. Expect exactly 10 items back.
    src/modules/ingestion/dto/index.ts — 16 binding(s) a reading decides on this file, 2 by a certified test
    src/modules/ingestion/mcp/mcp-schemas.ts — 17 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/refused-proposal-records-only-its-tool-call [adopt-ingestion.md]
    would close it: Two inputs, each checked against a store that captures every committed write. First, a refused proposal: the committed writes must be exactly one tool_call row with outcome 'rejected', and nothing in any other table. Second, a proposal that fails partway through its business writes (the store throws on a write after the fragment insert): the committed writes must again be exactly one tool_call row, with the failure outcome, and no fragment, provenance, node, link or attribute row.
    src/modules/ingestion/mcp/handler-base.ts — 4 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/ingest-toolset.ts — 4 binding(s) a reading decides on this file
    src/modules/ingestion/mcp/propose-fragment.handler.ts — 7 binding(s) a reading decides on this file
    src/modules/ingestion/repository/llm-run.repository.ts — 23 binding(s) a reading decides on this file
  rules/knowledge-base/required-start-available [adopt-ingestion.md]
    would close it: Send one proposal through the ingest path. Use an attribute key or link type whose catalog entry requires a validity start, give no stated start, and anchor it to a source RawInformation that has neither a document date nor a reception date. Assert that it is refused with BUSINESS_DATE_UNJUSTIFIED. Then send the same proposal against a source that has only a document date, and assert that it is accepted. Do the same with a source that has only a reception date. Last, send a proposal for a key that does not require a start, with no dates, and assert that it is accepted.
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/temporal.ts — 7 binding(s) a reading decides on this file
  rules/knowledge-base/stated-start-requires-basis [adopt-ingestion.md]
    would close it: Two inputs, each a proposal with a stated valid_from and a null valid_from_basis. The first has requires_valid_from = false. The second has requires_valid_from = true with document_date and received_at both present. Each is expected to be rejected with BUSINESS_DATE_UNJUSTIFIED. Neither should be accepted, and neither should come back with a basis the proposal did not state.
    src/modules/ingestion/prompts/extraction.v1.ts — 20 binding(s) a reading decides on this file, 1 by a certified test
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/temporal.ts — 7 binding(s) a reading decides on this file
  rules/knowledge-base/strong-candidate-resolves [adopt-ingestion.md]
    would close it: Each gap closes with one input against one expected result. (a) A proposal with no exact alias, one active same-type node at exactly 0.85 and no other at 0.55 or above, should resolve as matched-existing to that node. (b) The same setup plus a second active same-type node at exactly 0.55 should not resolve as matched-existing. (c) Run against a store that applies the candidate query: an inactive same-type node at 0.85 or above, as the only strong candidate, should not be matched. The same holds for a node of another type. And an inactive or other-type node at 0.55 or above should not stop an otherwise unique strong active match of the right type.
    src/modules/ingestion/service/entity-resolution.service.ts — 12 binding(s) a reading decides on this file
  rules/knowledge-base/succession-before-previous-start [adopt-ingestion.md]
    would close it: Close it with one test per constrained kind (knowledge_link and node_attribute) and per boundary (closing date equal to the start, and closing date strictly before it). Each takes a vigent functional assertion whose validity starts at D and a succession proposal closing at or before D. Each runs against a store that actually evaluates the close. Each expects the closed assertion to be superseded with valid_to still null, and the new assertion to be chained to it through supersedes_link_id or supersedes_attribute_id.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/succession-closes-previous [adopt-ingestion.md]
    would close it: One test per missing case, each on a type that does not allow multiple current assertions, closes the gap.
Link, change hint: the current link has a different target, the fragment is neutral, and change_hint='succession'. Expected: the close marks that link superseded, bound to its id, and the new link's supersedes_link_id is that link's id.
Attribute, change hint: the current attribute has a different value, the fragment is neutral, and change_hint='succession'. Expected: the close marks that attribute superseded, bound to its id, and the new attribute's supersedes_attribute_id is that attribute's id.
Attribute, fragment signal: the existing fragment-signal attribute test also needs to check that the close sets status 'superseded' on the current attribute's id.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/succession-closing-date [adopt-ingestion.md]
    would close it: Three checks would close it, each on one input and one expected result. (1) Close a functional link: old assertion valid_from 2026-01-01, new assertion valid_from 2026-06-01, now fixed at 2026-06-12. The old assertion's validity end should be 2026-06-01, not 2026-06-12. (2) The same succession on a functional node_attribute should give the same closing date. (3) Close a link and an attribute whose type does not require valid_from, sending the new assertion with no validity start and now fixed at 2026-06-12. The old assertion's validity end should be 2026-06-12.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/succession-signal [adopt-ingestion.md]
    would close it: For each unpinned marker, one fragment holding that marker and no other ("nova", "substituido", "substituido por", "succeeded", "passou a" without "novo", "novo" without "passou a"), expected to signal succession. Add the same fragments in a changed letter case for the markers not yet tested that way, each also expected to signal.
    src/modules/ingestion/service/graph-consolidation.service.ts — 15 binding(s) a reading decides on this file
  rules/knowledge-base/summary-counts-tool-calls [adopt-ingestion.md]
    would close it: One input against one expected result. The input is a run whose tool calls cover some of the validation outcomes, alongside another run's tool calls, stored in a real database rather than a fake that does the grouping itself. The expected result is a summary with an entry for every outcome in the validation-outcome vocabulary: the count of this run's tool calls for each outcome present, and 0 for each outcome absent, with nothing from the other run.
    src/modules/ingestion/dto/llm-run.dto.ts — 10 binding(s) a reading decides on this file
    src/modules/ingestion/repository/llm-run.repository.ts — 23 binding(s) a reading decides on this file
  rules/knowledge-base/tool-call-total-before-pagination [adopt-ingestion.md]
    would close it: One input against one expected result, with the count's predicate actually evaluated. The input is an LLM run with tool calls of mixed tool names and validation outcomes, seeded next to another run's tool calls, and listed with a limit and offset that cut a page smaller than the run's tool-call set. The expected result is a total equal to the number of that run's tool calls: all of them, and none from the other run.
    src/modules/ingestion/repository/llm-run.repository.ts — 23 binding(s) a reading decides on this file
    src/modules/ingestion/service/llm-run.service.ts — 5 binding(s) a reading decides on this file, 1 by a certified test
  rules/knowledge-base/turn-blocks [adopt-ingestion.md]
    would close it: One input: transcript content of three timestamped speaker lines. One expected result: the second and third blocks begin exactly at the second and third speaker lines. That means their text starts with "[00:15] Maria:" and "[00:30] João:", and each offset_start equals the code-point offset of its speaker line in the original content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/undivided-sources [adopt-ingestion.md]
    would close it: A test would give each of `ata`, `artigo` and `outro` content under CHUNK_HARD_MAX that holds a form feed, a header block followed by a blank line, speaker lines and bracketed timestamped turns. It would expect exactly one chunk for each type, with offset_start 0, offset_end equal to the content's code-point count, and text equal to the whole content.
    src/modules/ingestion/chunker/v1.ts — 16 binding(s) a reading decides on this file
  rules/knowledge-base/validity-start-before-end [adopt-ingestion.md]
    would close it: One input against one result closes it: a proposal whose validity start is after its validity end (for example 2026-06-13 against 2026-06-12) must be refused and nothing consolidated. The case should be submitted through the proposal path, so the refusal is shown to reach every proposal that states both dates.
    src/modules/ingestion/service/propose-attribute.service.ts — 13 binding(s) a reading decides on this file
    src/modules/ingestion/validation/temporal.ts — 7 binding(s) a reading decides on this file
  each is closed by writing the test named, and the route that writes it is a proof increment: `/deliver-scope`, with an ask naming the proof increment and, per fact to close, the node, the assertion verbatim, the record in brackets and the files above, spelled from the target source root as printed — /plan-work plans one task per fact, /implement-task writes the proof alone, and the review certifies it. Which facts are worth a test is the asker's; name the ones wanted, under a new slug
[exit 1]
```

```
$ python3 -B $P/bin/trace.py --owed migrations --all
unseen: nothing binds the pair — `--check` has no digest to compare and never will
  migrations/0001_init.sql
    rules/knowledge-base/alias-not-blank — found against in adopt-database.md
    rules/knowledge-base/alias-unique-per-node — found against in adopt-database.md
    rules/knowledge-base/source-status-active-or-deleted — found against in adopt-database.md
  migrations/0004_chat_persistence.sql
    domain/chat/conversation — found against in adopt-database.md

4 finding(s) no bind closed, over 2 file(s):
  4 unseen: nothing binds the pair — `--check` has no digest to compare and never will
  0 covered: bound at the content on disk now — a bind wrote over the only symptom `--check` had, and the finding stands under it
  0 reported: the binding is stale, so `--check` already carries this one — the record is what says what was found
  4 of them appear in no --check report, and nothing about the files has to change for that to stay true; this form is where they are said

111 unstated fact(s) the records name, over 43 file(s) — the source states them and no node holds them. No bind closes one and none is counted above:
  0001_init.sql — CREATE TABLE attribute_key, column version (line 198): The attribute-key node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE attribute_valid_value, column version (line 217): The allowed-value node lists value, label, sort_order and description, and no version. The catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE link_type, column version (line 169): Same as node_type. The link-type node lists no version, so the catalog versioning lives only in the DDL. [adopt-database.md]
  0001_init.sql — CREATE TABLE node_type, column version (line 156): A per-row version number on catalog rows is a domain fact in the schema alone. The node-type node lists only name and description. The next reader looks in the specification for what the number means and does not find it. [adopt-database.md]
  0001_init.sql — curation_action.reason comment, line 511: The rule that a reason is required on destructive curation actions is stated only here. The curation-action node declares reason as optional and no rule requires it. The DDL comment is the only place a reader finds it. [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337 and the header line 57: That a merged node must point at an active survivor, with path compression on write, is a domain rule the source states. No node in the specification holds it. The specification has only "names the survivor exactly when merged" and "never merged into itself". The rule lives where a reader of the specification will not look. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_message, line 108: A message's creation time is declared and required here, and the chronological index depends on it (idx_chat_message_conversation_created_at). domain/chat/message lists no such attribute. The attribute that orders a conversation's turns is held only in SQL. [adopt-database.md]
  0004_chat_persistence.sql — column created_at of CREATE TABLE chat_tool_call, line 156: A chat tool call's creation time is declared and required here. domain/chat/tool-call lists no such attribute, so the time a tool call was recorded exists only in the table. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.idempotency_key, line 103 (and lines 86-89): The rule that a user message always carries an idempotency key and an assistant message never does is stated only in a comment; the column allows NULL for every row. The node rules/chat/message-idempotency-key-unique says only that a conversation holds at most one message per key. The rule about which role carries a key has no home in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_message.stop_reason, lines 100-102: The closed vocabulary of reasons a turn stopped, and the rule that only assistant rows carry one, is stated only in a comment. The column is plain text with no check, and domain/chat/message types stop_reason as a bare string. The vocabulary is a business fact that nobody can find in the specification. [adopt-database.md]
  0004_chat_persistence.sql — comment on chat_tool_call.tool_name, line 138: The restriction of a chat tool call's tool name to the thirteen query tools is stated only in a comment. The column is unconstrained text, and domain/chat/tool-call types tool_name as a bare string. A reader cannot learn from the specification which tools a chat turn may call. [adopt-database.md]
  0004_chat_persistence.sql — header comment on chat_conversation.title, lines 40-41: A conversation title limited to 1..200 characters is a domain rule. It appears only in this comment, which points to an enforcement in the BFF. No node holds it (domain/chat/conversation types title as a bare string), and no constraint in this file holds it. The next reader looks for the title's limits in the specification, finds none, and cannot tell whether the BFF or the specification is the authority. [adopt-database.md]
  0006_original_input.sql — Line 17-18, the COMMENT ON COLUMN raw_information.original_input statement (text stored in the database catalog).: The statement says the column is null outside chat. The specification does not say that. The raw-information node only lists original_input as an optional string. The candidate rule directed-turn-is-original-input only says a directed ingestion made from a chat turn records the turn's excerpt there. Nothing says original_input stays empty for other sources. A reader of the catalog takes this for a decided rule, and the next reader looks for it in the specification and does not find it. [adopt-database.md]
  seeds/0001_seed.sql — section 2, the description column of the 13 link_type rows (lines 43-81): Each link type's required description is catalog text that only this seed holds. The catalog node states label and inverse and stops there, so a reader who looks in the specification finds no description. Some of it restates permitted pairs in prose that has already drifted from the rule node. The part_of description names org, projeto and evento as sources, but the rule node also permits Task to Project. The node moving would never reach this text. [adopt-database.md]
  seeds/0001_seed.sql — section 4, the description column of the 16 attribute_key rows (lines 139-170): Attribute key descriptions, including remarks on stability and on how corrections are made, live only in this seed. No node holds them. The event_type description lists three values while the allowed-values node lists nine, so the seed text and the specification already disagree in words nobody governs. [adopt-database.md]
  seeds/0002_ontology_status_task.sql — C.3 AttributeKeys VALUES, the description column of the three Task rows, lines 68-73: These are catalog values written into attribute_key.description, which the catalog may show or send to the extraction model. The node holds each key and its value type but no description for any attribute key, so this wording lives only in the seed. The next reader looks for it in the specification and does not find it. [adopt-database.md]
  src/modules/ingestion/chunker/config.ts — line 19, the lower bound of CHUNK_TARGET: 1500 is a chunk-size threshold that no node holds, and nothing reads it. The chunking nodes state only 4000 and 2000. The docstring describes a soft window the chunker does not apply. A later reader would take 1500 as a decided minimum chunk size, and it would live only in this file. [adopt-ingestion.md]
  src/modules/ingestion/chunker/config.ts — line 30, READING_TAIL: A 200-unit chunk overlap for retrieval is stated only here, and no code reads it (a grep of backend/src finds no importer). The only node with a 200 is rules/knowledge-base/extraction-reads-chunks-in-order, which is the tail of the previous chunk shown to the model during extraction. That is a different fact. A reader looking for the overlap rule would find it here, and would either not find it in the specification or confuse it with the extraction tail. [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — scanLines (line 298) and the isBlank test in splitEmail (line 229): The code decides what a line and a blank line are. A line ends only at U+000A. A blank line is one of zero length. A whitespace-only line, or any line of a CRLF email (which keeps a trailing "\r"), is never blank. On a CRLF email the header block then never ends and the whole email stays one block. No node says this, so the next reader looks in the specification and does not find the decision. [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — scanLines (lines 294-307, terminator is only `\n`) and splitEmail (line 229, `const isBlank = line.endExclusive === line.start;`): The code defines a line as ending at `\n` only, and a blank line as a zero-length line. A line holding only spaces, or `\r` in a CRLF email, is therefore not blank. A CRLF email's header block then never ends and its quotation changes start no blocks. No node says what a line or a blank line is, so this decision lives only in the code, where the next reader will not look for it. [audit-db-restamp.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.health, lines 150-153: This is a callable capability, with the fields it returns, that no node holds. A search of the specification root for health finds nothing. The tool is offered to the model and described only here. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.ingest_document, lines 148-149: This promises that extraction continues after the caller disconnects, and tells the caller how to recover. No node holds either. The ingestion contract's ingest-document answers describe only the completed answers and refusals. The recovery behaviour exists only in text sent to the model. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.propose_link and propose_attribute, lines 129-140: This states a minimum of one cited fragment for link and attribute proposals. No node holds that minimum. The proposal node gives its evidence association as 0..*, and the only "at least one fragment" rule is the errata rule for corrections. The threshold is stated only in text sent to the model. Whoever reads the specification will not find it, and the specification's 0..* says zero is allowed. [adopt-ingestion.md]
  src/modules/ingestion/dto/index.ts — IngestToolDescriptions.start_async_ingestion, lines 165-173: This is a whole ingestion operation, asynchronous and returning the run id at once, that the ingestion contract does not list among its operations. The contract lists ingest-document and ingest-directed only. A search of the specification root finds no asynchronous ingestion, so the behaviour and the promise that "Arguments and defaults match `ingest_document` exactly" live only in the source. [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment, `storage_ref` bullet, line 19: The comment claims a domain rule, that a raw information's storage reference is null in v1.0.0. No node holds it, and the schema (`storage_ref: z.string().nullable().optional()`) accepts any string. The repository INSERT in backend/src/modules/ingestion/repository/ingestion.repository.ts names no `storage_ref` column, so the value is silently dropped rather than refused. The next reader looks in the specification for what a supplied storage reference does and finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the `affected_nodes` field, line 102, with the comment on lines 83-89: The response type lets a completed run carry no affected nodes when the lookup failed, and the comment says so. affected-nodes-only-when-completed and the read-llm-run answer say the nodes are listed when the run is completed, with no failure exception. The best-effort omission is a behaviour decided in code and prose, and a reader of the specification will believe a completed run always lists its nodes. [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the `attempts` field of LlmRunResponseSchema, line 98: The schema fixes a lower bound of 1 on a run's attempts. The llm-run node says only that attempts is an integer, and retry-counts-attempts says only that a retry adds one. Neither states that the first attempt counts as 1. The floor is a decision that now lives in this schema, and a reader looking in the specification will not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — `fragment_ids`, lines 41-46: An attribute proposal that cites no fragment is refused here, as a rule of the business. No node states it. The proposal node gives the cited fragments the cardinality 0..*, and the ingestion contract's refusals for propose-attribute name only a missing or wrongly shaped field. A reader looking in the specification for whether an attribute may be proposed without evidence finds nothing, and this line is the only place that says no. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — the `.describe(...)` text on `valid_to`, lines 50-52: The text tells the model that an assertion's validity intervals are half-open. No node holds this for proposals or assertions. The only half-open statement in the specification is the link type rule's `day < valid_to`, and the validity-start-before-end rule says only that the start is strictly before the end. The convention lives in a tool description, and a reader of the specification cannot learn from it whether the end date is inside the interval. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — Header comment, line 3 ("Layer 1 (structural) of the 5-layer validation").: The comment states that validation has five layers and that this file is the first. No node holds a five-layer division. The nodes hold check orders per proposal (`link-proposal-check-order`, `attribute-proposal-check-order`, `proposal-run-checks-first`), and there is none for a fragment proposal. A reader who takes the comment as the layering of validation will look for it in the specification and not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — The `.describe(...)` on `text`, line 16.: This text is part of the tool's schema, so a model reads it as an instruction. It says a fragment's text is a verbatim quote of the chunk and holds one assertion only. No node holds either rule. The `information-fragment` node and `fragment-text-length` say only that the text is a string of 1 to 1000 characters. Nothing in the specification says a fragment must be verbatim or single-assertion, so those rules live only in this description. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The `change_hint` field's default, line 69.: A link proposal that omits its change hint is treated as change hint none. That decides re-affirmation, because reaffirmation-consolidates needs "change hint is none". The specification states the default only for directed ingestion (directed-defaults), so for a proposal from an extraction the default lives only in this schema. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The `fragment_ids` field of ProposeLinkInputSchema, lines 54-59.: The refusal of a link proposal that cites no fragment is a domain rule, and only this schema states it. The specification says a proposal "cites the information fragments it rests on" with cardinality 0..*, and its cited-fragments rules cover only fragments that exist and belong to the run. The next reader looks in the specification for the minimum of one and does not find it. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The `valid_to` field's description, lines 63-65.: This text is sent to the model as the tool description. It states half-open validity intervals for proposals, and no node in the set holds that. The nearest node, validity-start-before-end, says only that the start is strictly before the end. Half-open is stated for link type rules and chunk offsets, not for assertion validity. The convention therefore lives only in what the model is told. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-node.dto.ts — the describe() text on aliases, lines 27-29: The model-facing text promises that an alias the node already holds is not attached a second time. The alias rules say only that a created node holds each proposed alias and that a matched node adds each proposed alias. Nothing states the no-duplicate behavior, so it is a business rule that appears only in a tool description. [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-node.dto.ts — the describe() text on node_type, lines 14-16: The model-facing text states that Person, Project and Document are node types the catalog holds. No node in the specification names any catalog node type. A reader who looks in the specification for the catalog's kinds of entity finds none, and the names live only in this tool description and the seed data. [adopt-ingestion.md]
  src/modules/ingestion/dto/raw-information.dto.ts — ChunkLocatorSchema, lines 11-19, the shape of a chunk's locator: The four keys of a locator and their types are a domain fact stated only here. The raw-chunk node holds the locator as an opaque string, and the decision log records that the material gave no shape. A reader who checks the specification finds an opaque string. The shape lives in this schema, and the log's reason ("the retrieval only passes the locator through") no longer describes the system. [adopt-ingestion.md]
  src/modules/ingestion/dto/raw-information.dto.ts — ChunkLocatorSchema, lines 11-20: The four locator keys and their types are a vocabulary the code declares and no node holds. The node types `locator` as a bare `string`, and the decision log records that the shape was left out ("The material names a chunk's locator without giving its shape"). The next reader will look in raw-chunk for what a locator contains and will not find it. The only other pointer is a comment citing "A23". [audit-db-restamp.md]
  src/modules/ingestion/dto/raw-information.dto.ts — RawChunkResponseSchema offset fields, lines 42-43: The bounds (start at least 0, end strictly greater than 0) are a rule the schema applies to chunk offsets. The node gives `start_offset` and `end_offset` only as `integer`, with no bound. The bound lives only in this DTO, where the next reader will not look for it. [audit-db-restamp.md]
  src/modules/ingestion/dto/raw-information.dto.ts — RawChunkResponseSchema, lines 37-46, the wire names of a chunk's excerpt and offsets: The raw-chunk node names these attributes excerpt, start_offset and end_offset, and the ingestion contract promises the chunk's "excerpt, offsets". The wire vocabulary `text`, `offset_start` and `offset_end` is held by no node. A client or a later reader searching the specification for what the chunk read returns will not find these names. The `positive()` bound on the end offset is likewise stated only here. [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the `metadataPointer` spread, lines 184-193: No node says that a directed ingestion from a chat turn records a conversation and message pointer in its raw information's metadata. No node says that a pointer with only one of the two ids is silently dropped. The handler applies the drop and the service merges the ids into metadata (`intakeMetadata.conversation_id = deps.metadataPointer.conversation_id`). The next reader will look for this in the specification, find nothing, and read the code as the decision. [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the catch branch of the delegation, lines 211-226: The ingest-directed operation lists only validation refusals. The handler emits a system-error refusal, with a fixed code and message, for any unexpected throw. That is what the owner is told when the orchestrator fails, and the specification never states it. [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The catch block of safeWriteAuditOnRollback, lines 227-238.: The code lets a refused or failed proposal end up with no tool call when the audit write fails: it logs `tool_call_audit_write_failed` and returns the original envelope. The node says every proposal is recorded as a tool call, and no node states this exception. A run's summary is counted from its tool calls, so such a proposal would be missing from its run's account with no rule saying that can happen. [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The uncaught-error branch of runIngestHandler, lines 185-201.: The code decides that a failed proposal is answered with SYSTEM_INTERNAL_ERROR and this message, and recorded as `error`. The contract's propose-fragment, propose-node, propose-link and propose-attribute answers list no system-failure answer. The only SYSTEM_INTERNAL_ERROR answers the contract holds are for run-extraction and ingest-document. The next reader looks in the specification for how a failed proposal is answered and finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — DEFAULT_INGEST_MODEL, line 49, and its use at line 119: The model an ingest_document run is recorded under, when the caller names none and no environment default is wired, is decided only here. The contract's ingest-document operation says nothing about which model a document ingestion runs under. The model feeds the run's idempotency key, so the value decides which content counts as already ingested. A reader looking in the specification will not find the default. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — already_ingested result, lines 177-189, and readRunStatus, lines 91-104: The contract's already_ingested answer carries the identities, the chunk count and the run's status. The handler adds a `message` field with a recovery instruction. It also lets the status be null when the best-effort read fails (`catch { return undefined; }`). Neither the field nor the null status is held by a node, so a client cannot know from the specification that the status may be absent. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — final catch branch, lines 256-263 (unknown extraction error): A failure that is neither a provider failure nor an extraction failure is answered with SYSTEM_INTERNAL_ERROR carrying the run and raw information identities, not the failed run. The contract holds SYSTEM_INTERNAL_ERROR only "carrying the failed run", so this answer is decided only in the handler. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — intake catch branch, lines 132-153 (pg unavailable branch): This is a refusal code that ingest-document answers when the database is unreachable at intake. The contract's ingest-document refusals list only content length, source type, repeated system errors, unknown prompt version and provider failure. Clients branch on the code, and it is written down only in this handler. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — intake catch branch, lines 149-152 (any other intake failure): The contract holds SYSTEM_INTERNAL_ERROR for ingest-document only "carrying the failed run", for repeated extraction errors or an unknown prompt version. Here the same code answers a persistence failure before any run exists, carrying no run. The answer for this case exists only in the handler. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-toolset.ts — `mapReadError`, the pg-unavailable and unknown-error branches (lines 425-428): `get_ingestion_status` and `list_recent_ingestions` refuse with a service-unavailable error or an internal error. The refusals listed for read-llm-run and list-recent-ingestions are only VALIDATION_INVALID_FORMAT and RESOURCE_NOT_FOUND. The rule for when these operations answer with a SYSTEM_* code lives only in this branch order. [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-toolset.ts — the `health` tool registration (lines 325-333): The `ingest` toolset exposes a liveness and database-ping operation that always answers `ok: true`. The contract's operation list and its description of what MCP carries do not include it. The next reader looks in the ingestion contract for what the toolset offers and does not find it. The rule that a database failure appears inside `result` and not as an error is decided only here, in a comment. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — HealthMcpInputSchema, lines 159-171 (registered as the `health` tool at ingest-toolset.ts:325): A liveness and database-reachability tool is exposed on the ingest toolset. No operation in the ingestion contract names it or states what it answers, so this file and its toolset are the only place the tool is recorded. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — IngestDirectedNodeItemSchema `node_id` description, lines 343-349: The refusal code for a failed pin is told to callers by this description, but no node states it. The directed-pinned-node node says only that a pinned node resolves "provided the node exists and is active". The ingestion contract lists no refusal for it. The service answers RESOURCE_NOT_FOUND when the row is absent and VALIDATION_INVALID_FORMAT only when it is inactive, so the description is also narrower than the code. Callers act on a code that lives only in code and emitted text. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — StartAsyncIngestionMcpInputSchema, lines 81-123 (with the header comment at lines 71-79): A tool that ingests a document and extracts it in the background is a capability no node holds. The published ingestion contract lists ingest-document as the one-shot operation and has no background variant. The schema is exported, but the toolset comment at ingest-toolset.ts:287 calls the tool retired, so it is a stale declaration of an operation the specification never stated. The next reader looks for this operation in the contract and finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 289-290 and the `source_label` description, lines 447-454: That the label is persisted under the key `metadata.source_label` on the raw information is a stored-data fact. The directed-ingestion node holds the label only as an optional string, and directed-source-content places it in the recorded content. The metadata key is written by directed-ingestion.service.ts (`intakeMetadata.source_label = payload.source_label;`) and told to callers by this description, but no node states it. It lives in code and in emitted text only. [adopt-ingestion.md]
  src/modules/ingestion/mcp/transport.ts — the `mountMcpEndpoint` options, line 43: The route under which the ingestion toolset is reached is a fact of the published surface, and no node names it. The contract lists operations and says which transport carries them, but gives no endpoint. The path lives only in this file, so a reader who looks in the specification for where an MCP client connects finds nothing. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — `system()`, inviolable rule 3 (lines 141-142): The atomicity granularity of fragments is told to the model as a rule. No node holds it: fragment-text-length bounds only the length, and a search for "atomic" and "compound" in the specification finds nothing. The decision about what counts as one fragment lives only in the prompt. [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — `system()`, inviolable rule 5 (lines 148-151): The rule that decides whether a stated thing becomes a node or an attribute is held only in the prompt text. The specification has no node for it, so the next reader who asks why a date never becomes a node will not find the decision. [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — line 42, the `MAX_TOKENS` constant: The per-turn output ceiling for an extraction is a number that decides how much a model can propose from one chunk. It lives only in this constant, and no node holds it (I searched the specification root for `8000` and `max_tokens`). The next reader looks for it in the specification and finds nothing. The v2, v3 and v4 prompt modules re-export this constant, so they inherit it too. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — line 42, the `MAX_TOKENS` constant: The per-turn token ceiling caps how much one chunk's extraction can produce, and its only home is this file. Searching the specification for `max_tokens` or `8000` finds no node. The comment cites "TC-12 known_context", which is not a specification node. A reader looking for what limits an extraction turn will look in the specification and find nothing. [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the "Output contract" section of the SYSTEM prompt, lines 195-196: The prompt states a requirement that a link or attribute proposal cite at least one fragment, and that the fragment come from the same chunk. The DTOs enforce the minimum (`fragment_ids: z.array(z.string().uuid()).min(1)` in `dto/propose-link.dto.ts`). No node holds it: `cited-fragments-exist`, `cited-fragments-in-run` and `cited-fragments-anchored` cover only fragments that are cited. The only "at least one fragment" rules in the specification are about directed ingestion and correction evidence. The minimum-of-one rule lives only in code and prompt, where the next reader does not look. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the worked example, lines 203-206 (node type names): The prompt names `Person`, `Project` and `Document` as node types the catalog holds. No node in the specification holds catalog contents (I searched the root for `Person`). If the seed catalog changes, this example teaches the model names that are refused as unknown, and the specification cannot say which side was decided. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the worked example, lines 207-216 (link type names and the `concerns` note): The prompt asserts that the catalog holds link types `responsible_for`, `concerns` and `delivered_to`. It also asserts that `concerns` carries no validity start, and that `responsible_for` takes one. No node holds either (I searched the root for these names). The temporal behaviour of a named link type is decided only in this prompt and in the seed. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the worked example, lines 209-210 (attribute key `deadline`): The prompt names `deadline` as an attribute key of a Project, with a date value and a validity start. No node holds this key, its value type or its temporal nature (I searched the root for `deadline`). The example is the only place in the specification-facing text that states it. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v2.ts — EVENT_DATING_DIRECTIVE, lines 40-44, the first bullet: The prompt names an Event node type and its event_date and end_date attribute keys. Nothing in the specification holds those catalog entries. The comment points at "§15.3" and the seeds instead. The next reader who asks which attribute keys an Event carries looks in the specification, finds only the generic attribute-key shape, and does not find the answer. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v2.ts — EVENT_DATING_DIRECTIVE, lines 41-49, the "always date the occurrence" instruction and the value versus valid_from distinction: The prompt makes it an extraction obligation to date every Event the document dates, and it defines valid_from for an event date as "when that date started to hold / became known (typically the document date)". No node holds either rule. What the model is told to propose for an Event therefore lives only in the prompt text, where a reader of the specification will not look. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — EVENT_CLASSIFICATION_DIRECTIVE, lines 55-61 and the worked example at lines 71-78 (catalog facts about Event attributes and links): The text sent to the model states catalog facts that no node holds. An Event carries an `event_type` attribute. `event_type` is not temporal. An `event_date` attribute exists and takes a validity start. A `participates_in` link type joins Person to Event. The model is told these as business rules. A search of the specification root for event_type, event_date and participates_in finds nothing. Anyone who changes the catalog has no node telling them this prompt depends on it. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — EVENT_CLASSIFICATION_DIRECTIVE, lines 60-62 (fallback value `outro` and the confidence cap): This is a business rule: an unclassifiable event takes the catch-all value `outro` and is deliberately given a confidence that lands it in `uncertain`, so curation sees the catalog gap. No node holds it. The 0.75 boundary is held by new-assertion-status-from-confidence, but the decision to steer confidence below it as a signal to curation is stated only here. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — EVENT_CLASSIFICATION_DIRECTIVE, lines 63-66 (relative dates resolve against the document date): How a relative expression becomes a date is a domain rule: it resolves against the document's date, and that date is justified as basis `document`. No node holds it. The nodes required-start-fallback and valid-from-basis cover the backend's fallback and the basis vocabulary. Neither covers extraction computing a date from "hoje" or "ontem". The prompt is the only place this decision lives. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 8-12 (the original closed `event_type` domain and the values migration 0003 added): The allowed values of the Event `event_type` key are catalog data, and no node in the specification holds them (a search of the specification root for event_type finds nothing). This comment lists them as if the specification did. The next reader who wants to know which event types exist will look in the specification, find nothing, and have to read a migration and a comment to learn it. [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v4.ts — RECEIVED_AT_ANCHOR_DIRECTIVE, lines 57-66: the rule for resolving relative dates against document_date and then against received_at: This states which date a relative expression counts from: the document date first, then the reception date. No node holds it. required-start-fallback covers only a proposal that states no start at all, not one where the model resolves a "hoje" or "ontem" itself. A later reader who wants to know how "ontem" is dated will look in the specification, find nothing, and have no reason to look in this prompt. [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the same docstring above insertLlmRun, lines 200-203, the attempts default: A new run starts with one attempt. That fact appears only in this comment and in the DDL default (migrations/0001_init.sql:275, `attempts int NOT NULL DEFAULT 1`). No node holds it: retry-counts-attempts says only that a retry adds one, and llm-run says only that attempts is a required integer. The value the retry arithmetic starts from therefore lives where nobody looks for a business decision. [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — header comment lines 7-17 and the route registrations from line 142 ("/raw-information", "/llm-runs/:llmRunId/retry", "/llm-runs/:llmRunId/propose-fragment" and the rest): The contract publishes the REST operations but no node states their addresses, so the path scheme exists only in this file and its mount point. A client author who looks in the specification for where to call intake, retry or the propose mirrors finds nothing. If the paths change, no node moves with them. A grep over the specification root for "/api/v1" and "raw-information/" returned no match. [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — line 125-126, POST_INGEST_BODY_LIMIT, applied to app.post("/raw-information") at line 144: The number 11 MiB is a size limit on intake that the code applies and no node holds. It is measured in bytes on the HTTP body, and it cites a back-spec rather than a node. The nodes bound content and original input at 10,485,760 UTF-16 code units each, and answer over-length with HTTP 422 VALIDATION_INVALID_FORMAT. A request carrying valid multi-byte content or both fields near their limits can exceed 11 MiB and be refused by the transport before the contract's answer applies. Nobody reading the specification would learn that a second, byte-based ceiling exists. A grep over the specification root for "11 MiB", "bodyLimit" and "413" returned no match. [adopt-ingestion.md]
  src/modules/ingestion/service/affected-nodes.ts — resolveAffectedNodes, Step 3, lines 306-313, with the comment at lines 229-231: The code drops an affected id that no longer resolves to a node row, and the comment calls this "skipped silently". The affected-nodes node says nothing about an affected node that cannot be found, so the omission is a rule that exists only in this file. The next reader looks in the specification for what a run's affected nodes exclude and finds no such exclusion. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — closeRunCompletedSafe, lines 1006-1034, and readClosedRunSafe, lines 1041-1091: When closing or reading the run fails, the response still says `status: "completed"` and carries the epoch as its start and finish times, with attempts 1. The times are invented values no node holds. The stored run may still be running, and the caller cannot tell. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — refForAttribute and refForLink, lines 929-934: The format of the reference a report gives an attribute or a link is a value no node holds. A client reading the report has to learn it from this file. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the affected-nodes resolution catch, lines 767-787: When resolving the affected nodes fails, the response carries an empty `affected_nodes` list on a completed run and the failure goes only to a log. The affected-nodes nodes hold no such degradation, so the caller cannot tell an empty list from a failed lookup. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the intake catch block, lines 369-391: The contract's ingest-directed operation lists only validation refusals. The refusal a caller gets when persisting the payload fails (which code, and the split between an unavailable backing service and an internal error) is stated only here. A client reading the contract cannot know these answers exist. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the intakeMetadata construction, lines 339-344: The raw information's metadata carries a `directed: true` marker and the label under `source_label`. No node holds either key. The next reader who filters or reports on directed sources looks in the specification, finds nothing, and takes the code as the decision. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the metadataPointer merge, lines 345-351, and its dep type, lines 282-294: A directed ingestion made from a chat turn records a pointer to the chat conversation and message inside the raw information's metadata. The spec holds the turn's excerpt as the original input but says nothing of this pointer or its key names. The link from a raw information back to its chat row lives only here. [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the pin-failure branch, lines 533-553, and verifyNodePin details, lines 877-890: A pinned node that is absent is reported with RESOURCE_NOT_FOUND. One that is not active is reported with VALIDATION_INVALID_FORMAT, and the details carry a `reason` and a `current_status`. The node says only that the item is rejected. The codes live only here, and the split has no rationale in the specification. [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — TRIGRAM_CANDIDATE_LIMIT constant (line 47) and its use as LIMIT in the step 2 candidate query (line 165): Only the ten most similar nodes are ever weighed. No node states this cap, so the next reader looks in the specification and finds nothing. The cap also changes outcomes. The strong-candidate rule says "when no other active knowledge node of that type reaches 0.55", and the review rule says to pair the new node with each such node. With more than ten nodes at or above 0.55, the eleventh and later are never seen and never get an entity match review row. [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The advisory lock taken before the first node_alias read (lines 114-128).: The rule that concurrent proposals of one name and node type are serialized, so that they resolve to one node, lives only in this file and its comments. No node holds it. A reader looking for it in the specification does not find it. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — `MAX_TURNS_PER_CHUNK` inside `runChunkLoop`, lines 625-627 and 749-755: After 64 turns on one chunk the extraction stops asking about it, counts it as read, logs a warning and moves on without failing the run. That is a decision about when a chunk is deemed read, with a threshold, and no node states it. A chunk can be left partly extracted with the run still completing, and the specification says nothing of it. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the branch at lines 681-686 of `runChunkLoop`: A model turn that ends with neither a stop signal nor any proposal is taken as the chunk being read, and the run goes on. No node states this. It is the case where a chunk yields nothing, and the code alone decides that it is not a failure. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the constants at lines 200-201, `ANTHROPIC_REQUEST_TIMEOUT_MS` and `ANTHROPIC_MAX_RETRIES`, applied in `defaultAnthropicFactory`: These two values decide when a stalled model call counts as the provider failing. That failure is what the contract answers with SYSTEM_LLM_PROVIDER_UNAVAILABLE and a failed run. The contract states the failure but not the five-minute ceiling or the two retries, so the next reader looks for them in the specification and finds only this file. [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the default branch of `dispatchToolUse`, lines 282-293: A tool call from the model that names none of the four proposals gets a VALIDATION_INVALID_FORMAT refusal. It counts as a business refusal, so it resets the fatal-burst counter and never counts toward it. No node states what an extraction does with a tool name outside the four proposals. The behavior lives only in this branch. [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — consolidateLink, the attempt loop and the final throw, lines 443-474, and its mirror in consolidateAttribute, lines 710-736: The code retries a racing consolidation once and then answers a proposal with SYSTEM_INTERNAL_ERROR. The specification's ingestion contract lists no such refusal for propose-link or propose-attribute, and no node holds the retry count. The behavior lives only here, so anyone reading the contract will not find it. The count and the second-failure answer are the code's own decision. [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — consolidateLinkOnce correction branch, lines 578-582, and consolidateAttributeOnce correction branch, lines 800-804: The code reports a correction to the caller as outcome `accepted`, while recording a superseded predecessor. No node says what outcome a correction carries. The contract lists accepted, consolidated, superseded_previous and disputed, and shows the superseded identity only with superseded_previous. The label is the code's own decision, justified only by a comment citing BR-25. [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the try/catch around deriveAffectedNodes in getLlmRunById, lines 109-117: The code makes a rule the specification never states. A completed run's read can answer 200 with no affected nodes when the derivation fails, and the failure is neither logged nor surfaced. The contract says a completed run's read carries its affected nodes. A reader who trusts the node will treat a missing list as "none affected", and nothing tells them the code can omit it on error. [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — result mapping, lines 221-232: The link answer carries the superseded link's identity for a correction that is taken as `accepted`. The contract names that identity only for `superseded_previous`. The behaviour is set by this pass-through together with graph-consolidation.service.ts, which returns `superseded_link_id` on `outcome: "accepted"`. No node holds it, so a client and the specification disagree about what an accepted answer contains. [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the `VALIDATION_OUT_OF_RANGE` member of `McpEnvelopeErrorCode`, line 35 (mapped at comment line 17): The ingestion pipeline declares a numeric-bound refusal code that no ingestion operation in the contract uses. The ingestion contract answers an out-of-range confidence (proposal-confidence-range) and the page limit and offset of the tool-call listing with VALIDATION_INVALID_FORMAT. The retrieval contract uses VALIDATION_OUT_OF_RANGE for its own page bounds only. The code lives here as an ingestion decision that a reader would look for in the specification and not find. [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the `VALIDATION_REQUIRED_FIELD` member of `McpEnvelopeErrorCode`, line 33 (mapped at comment line 15): The file declares that ingestion validation may refuse with a code for a missing field. The ingestion contract names only VALIDATION_INVALID_FORMAT for "The proposal is missing a required field or holds one of the wrong shape", and no node in the specification names VALIDATION_REQUIRED_FIELD. The code becomes the only place this refusal code lives, and the two transports could answer a missing field differently. [adopt-ingestion.md]
  src/modules/ingestion/validation/graph-rules.ts — Header comment, lines 3-5.: The comment states the size and authority of the seeded link-type-rule catalog, and no node holds that. A reader trusting it will take 22 as the decided rule set. CLAUDE.md, in its description of `migrations/seeds/0001_seed.sql`, gives 28 rules, so the number may already be stale. [adopt-ingestion.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — ListAcceptedFragmentsQuerySchema, the `.strict()` call on the query object (line 38): A request carrying any query parameter outside llm_run_id, raw_information_id, limit and offset is refused here. The contract's refusals for the listing name only a missing filter, a malformed identifier and out-of-range paging, so this refusal is decided in the DTO. The next reader looks for it in the specification and does not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — ListAcceptedFragmentsQuerySchema, the `limit` field (line 33), and the docstring bullet above it (line 26): The 1..100 bound is held in code here, but no node in this file's set states it. The node that does is rules/knowledge-base/page-limit-bounds, which constrains domain/knowledge-base/page. A change to that node reaches this file only if the bind is added. Until then a reader of this file's nodes finds the default of 20 and no bounds. [audit-db-restamp.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 81-84: The literal value a compliance-deleted source's original input takes is stated only in this prose. I searched the whole specification root, including the decision log, for REDACTED and found no node that holds it. It reads as a decision the business made, but the next reader will look for it in the specification and not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/response.dto.ts — comment above ProvenanceRawInformation.original_input, lines 83-84: The comment states that the original input is excluded from the content hash. I searched the specification for content_hash and content hash and found no node that holds this. It is a rule of the idempotency identity that lives only in prose here. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/dto/response.dto.ts — the comment on ProvenanceRawInformation.original_input, lines 81-84: The comment states that `original_input` becomes the literal `[REDACTED]` after a compliance deletion, and that null is kept for non-chat rows. No node in the specification holds that literal or that redaction. `domain/knowledge-base/raw-information` declares `original_input` as a plain string. The code that writes the literal is in `backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts`. So the redaction value is a business decision that lives only in code and a back-spec citation. The next reader looks in the specification and does not find it. The comment also sits beside `rules/knowledge-base/provenance-refused-after-compliance-deletion`, which says a provenance read reaching a deleted raw information is refused with HTTP 410. The specification does not say that such a read returns `[REDACTED]`. [audit-db-restamp.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QUERY_RETRIEVAL_TOOL_NAMES and the four registerTool calls, lines 118-123 and 219-284: The retrieval contract names its operations search, read-link-provenance, read-attribute-provenance and read-fragment-provenance. The names an MCP client actually calls (get_provenance_link and the others) and the toolset key "query" live only in this file. The next reader who looks in the specification for what the owner's language model calls will not find them. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — search handler input mapping, lines 226-241, and the search description, lines 130-135: The search-query node names its choices text and link_types, and the contract gives no wire names. The input names `query` and `expand_link_types`, and the id parameters `link_id`, `attribute_id` and `fragment_id`, are fixed only in code. A reader comparing the node with the tool sees two vocabularies and no node saying which one the client must send. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/provenance.repository.ts — the ORDER BY clauses of the two chain queries in runChainSql (lines 154 and 179): The order of the chunks inside each fragment (chunk index ascending, then chunk id) and the fragment tie-break by fragment id decide what the owner reads first in a provenance answer. The specification holds only that fragments come in recording order. The chunk order lives only in this SQL, so the next reader looks for it in the specification and does not find it. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/provenance.repository.ts — the comment on `original_input` in ProvenanceChainRow (lines 76-80): The comment states that compliance deletion leaves the literal value '[REDACTED]' in raw_information.original_input. No node holds that value; a search of the specification root for REDACT finds nothing. The next reader looks in the specification, finds nothing, and treats the comment as the decision. Code in this file does not produce or check the value. [audit-db-restamp.md]
  src/modules/query-retrieval/repository/search.repository.ts — listProvenanceForNodes, the ORDER BY clause (line 373): The order in which the fragments that support a node hit are presented is decided here, newest first, and no node states it. Provenance-in-recording-order covers only links and attributes. A reader looking for how a node's supporting fragments are ordered finds no rule. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/repository/search.repository.ts — searchNodeAliasLayer, the SELECT score expression (line 123): A knowledge node's score is decided as the highest rank among its matching aliases, and the specification does not say how a node reached through several aliases is scored. Code becomes the only home of that choice. The next reader who wants to know why a node ranks where it does looks in layer-weights or search-item and finds nothing. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/errors.ts — message of EmptyProvenanceError, lines 85-87: The message tells the owner that an empty provenance chain means legacy data. The node only says that a read of an existing item with an empty chain is refused, and states no cause. The owner is given a diagnosis that lives only in this string. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — line 357, the `layer` of a link search item: The search-item node types `layer` as a search-layer (fragment, node, chunk) and no node says which layer a link item reports. The code decides it is "node". A consumer filtering or grouping by layer inherits that decision, and the next reader will look for it in the specification and find nothing. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — line 56, the constant PER_LAYER_FETCH_LIMIT, passed to searchFragmentLayer, searchNodeAliasLayer and searchChunkLayer at lines 129-147: The number 200 is a cap on what a search can ever rank, and no node states it. Matches beyond the 200th on a layer are dropped before ranking. The reported `total` is `filtered.length` (line 391), so it counts only what survived the cap. A reader who trusts search-total-before-pagination ("counts every search item before the page is cut") would not look here for the reason a total stops at some number. [adopt-query-retrieval-r2.md]
  src/modules/query-retrieval/service/search.service.ts — resolveLayers, the empty-list branch (line 431): The node gives the default of every search layer to a query that omits the option. The code also treats a present but empty `layers` list as omitted. That is a rule no node holds, so a caller who sends an empty list gets all three layers searched. The decision now lives only in this function. [audit-db-restamp.md]
  src/modules/query-retrieval/service/search.service.ts — the constant PER_LAYER_FETCH_LIMIT (line 56) and its three uses in the layer fan-out (lines 128-148): The cap of 200 candidates per layer is a value the source decided and no node holds. It also sits upstream of the total, so `total = filtered.length` counts at most what the three capped layers returned. The reader who trusts the specification's "counts every search item" finds no cap there, and a query with more than 200 matching fragments reports a smaller total than the knowledge base holds. [audit-db-restamp.md]
  each is the analysis's to close, through the node that gives the fact a home

231 place(s) the records name where text in the source restates a node's fact the code holds, over 52 file(s). The pair conforms and none is counted above:
  0001_init.sql — the comment before node_alias_one_canonical_uq, line 371 (rules/knowledge-base/one-canonical-alias) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481 (rules/knowledge-base/attribute-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment before provenance_attr_fragment_uq, line 481, read for links (rules/knowledge-base/link-provenance-once-per-fragment) [adopt-database.md]
  0001_init.sql — the comment on assertion_status (lines 132-133) and the views banner (lines 529-530) (rules/knowledge-base/effective-status) [adopt-database.md]
  0001_init.sql — the comment on knowledge_node lines 336-337, and the header line 57 (rules/knowledge-base/merged-node-names-survivor) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_basis_ck, line 402 (rules/knowledge-base/attribute-start-has-basis) [adopt-database.md]
  0001_init.sql — the comment on node_attribute_interval_ck, line 399 (rules/knowledge-base/attribute-validity-ordered) [adopt-database.md]
  0001_init.sql — the header comment lines 58-60 and the comment on raw_information lines 226-228 (rules/knowledge-base/compliance-deletion-tombstones) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — comment above C.3 AttributeKeys, lines 58-60 (rules/knowledge-base/temporal-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the AttributeKey count (rules/knowledge-base/catalog-attribute-keys) [adopt-database.md]
  seeds/0002_ontology_status_task.sql — header comment, line 23-24 (the "Totais após aplicar" line), the NodeType count (rules/knowledge-base/catalog-node-types) [adopt-database.md]
  seeds/0003_event_type_taxonomy.sql — header comment, lines 6-10 and 26-30 (the "+5 valid_values" list, the original four values, the sort_order note and the totals) (rules/knowledge-base/allowed-event-types) [adopt-database.md]
  src/modules/ingestion/catalog/catalog.ts — `LinkTypeRuleRow` doc comment, lines 47-51 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `domainOf` docstring, lines 227-249 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — `isLinkRuleActive` docstring, lines 265-270 (rules/knowledge-base/link-type-rule-in-effect) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — header comment, lines 13-21 (closed and open value domains), repeated in the `attributeValidValuesByKeyId` doc comment, lines 96-112 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — header comment, lines 9-11 ("The catalog covers BR-14 ... and BR-15 ...") (rules/knowledge-base/link-permitted-by-type-rule) [adopt-ingestion.md]
  src/modules/ingestion/catalog/catalog.ts — the docstring on LinkTypeRuleRow, lines 47-51 (rules/knowledge-base/link-type-rule-in-effect) [audit-db-restamp.md]
  src/modules/ingestion/catalog/catalog.ts — the docstring on isLinkRuleActive, lines 265-270 (rules/knowledge-base/link-type-rule-in-effect) [audit-db-restamp.md]
  src/modules/ingestion/chunker/config.ts — docstring above CHUNK_HARD_MAX, line 21 (rules/knowledge-base/long-block-sentence-chunks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — RawChunkInput docblock, lines 42-45 (rules/knowledge-base/chunk-excerpt-is-verbatim) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — RawChunkInput docblock, lines 45-46 (rules/knowledge-base/chunk-index-follows-content) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — comment inside the oversize loop in chunkV1, lines 99-103 (rules/knowledge-base/long-sentence-own-chunk) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — comment inside the oversize loop, lines 99-103 (rules/knowledge-base/long-sentence-own-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — comment on the fallback at lines 121-127 (rules/knowledge-base/contentless-blocks-single-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — comment on the fallback in chunkV1, lines 121-126 (rules/knowledge-base/contentless-blocks-single-chunk) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — docstring of RawChunkInput, lines 42-46 (rules/knowledge-base/chunk-excerpt-is-verbatim) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of RawChunkInput, lines 42-46 (rules/knowledge-base/chunk-index-follows-content) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, chat entry, and docstring of splitTurns, lines 150-154 and 261-266 (rules/knowledge-base/turn-blocks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, email entry, and docstring of splitEmail, lines 147-149 and 213-216 (rules/knowledge-base/email-header-block) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitByHardBoundaries, pdf entry, lines 145-146 (rules/knowledge-base/pdf-blocks-at-form-feeds) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — docstring of splitEmail, lines 213-216 (rules/knowledge-base/email-quote-blocks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — header comment, line 11 (rules/knowledge-base/short-block-one-chunk) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 11-13 (algorithm step 2, first sentence) (rules/knowledge-base/short-block-one-chunk) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 12-18 (algorithm steps 2-3, sentence fallback) (rules/knowledge-base/long-block-sentence-chunks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 13-19 (rules/knowledge-base/long-block-sentence-chunks) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 8-10 (algorithm step 1) (rules/knowledge-base/undivided-sources) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — header comment, lines 8-10, and the docstring of splitByHardBoundaries, lines 155-158 (rules/knowledge-base/undivided-sources) [adopt-ingestion.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock lines 148-149, and splitEmail docblock lines 213-214 (rules/knowledge-base/email-header-block) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock lines 148-149, and splitEmail docblock lines 213-215 (rules/knowledge-base/email-quote-blocks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock lines 150-154 and splitTurns docblock lines 261-265 (rules/knowledge-base/turn-blocks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock, lines 139-142 (rules/knowledge-base/chunks-never-cross-blocks) [audit-db-restamp.md]
  src/modules/ingestion/chunker/v1.ts — splitByHardBoundaries docblock, lines 146-147 (pdf entry) (rules/knowledge-base/pdf-blocks-at-form-feeds) [audit-db-restamp.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment on IngestRawInformationRequestSchema, `content` bullet, lines 16-19 (rules/knowledge-base/content-length) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment on `original_input`, lines 35-39 (rules/knowledge-base/content-hash-is-sha256) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment on `original_input`, lines 35-39 (rules/knowledge-base/original-input-length) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — doc comment, `model` and `prompt_version` bullet, lines 22-23 (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — header comment, lines 1-7 (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — the doc comment on `original_input`, lines 35-39 (rules/knowledge-base/original-input-length) [audit-db-restamp.md]
  src/modules/ingestion/dto/ingest-raw-information.dto.ts — the header comment and the `IngestRawInformationRequestSchema` doc comment, lines 1-24 (the `content` bullet, lines 16-18) (rules/knowledge-base/content-length) [audit-db-restamp.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the comment above LlmRunSummarySchema, lines 36-41 (rules/knowledge-base/summary-counts-tool-calls) [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the doc comment above LlmRunResponseSchema, lines 80-90 (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/dto/llm-run.dto.ts — the doc comment on the `orphaned_fragments` field, lines 51-59 (rules/knowledge-base/orphaned-fragment) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-attribute.dto.ts — the JSDoc above the `value` field, lines 24-27 (rules/knowledge-base/attribute-value-parses) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — Header comment, lines 4-6, above `ProposeFragmentInputSchema`. (rules/knowledge-base/fragment-text-length) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-fragment.dto.ts — header comment, lines 3-6 (rules/knowledge-base/fragment-text-length) [audit-db-restamp.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The docstring above ValidFromBasisSchema, lines 5-15, the part saying `received` MUST NOT appear in this input enum. (rules/knowledge-base/caller-never-states-received) [adopt-ingestion.md]
  src/modules/ingestion/dto/propose-link.dto.ts — The same docstring, lines 5-15, the part describing the temporal validator's fallback to `received`. (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/dto/source-type.ts — the header comment, lines 1-5, and the doc comment on SourceTypeSchema, line 9 (domain/knowledge-base/source-type) [adopt-ingestion.md]
  src/modules/ingestion/hash.ts — the docstring above composeIdempotencyKey (lines 20-27) (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/hash.ts — the file header comment (lines 1-6) and the docstring above sha256Hex (lines 10-15) (rules/knowledge-base/content-hash-is-sha256) [adopt-ingestion.md]
  src/modules/ingestion/hash.ts — the last sentence of the composeIdempotencyKey docstring (line 26-27) (rules/knowledge-base/idempotency-key-unique) [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the `IngestDirectedInvocationContext` docblock (lines 85-105) and the comment at lines 174-176 (rules/knowledge-base/directed-turn-is-original-input) [adopt-ingestion.md]
  src/modules/ingestion/mcp/directed-ingest.handler.ts — the header comment block, lines 1-30 (rules/knowledge-base/directed-ingestion-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The assertRunIsRunning docstring, lines 91-102. (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The deriveValidationOutcome docstring, lines 55-65, and the inline comment at lines 85-86. (rules/knowledge-base/tool-call-validation-outcome) [adopt-ingestion.md]
  src/modules/ingestion/mcp/handler-base.ts — The file-header comment (lines 9-12, step 4) and the runIngestHandler docstring (lines 129-130). (rules/knowledge-base/refused-proposal-records-only-its-tool-call) [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — header comment, lines 13-16 (constraints/extraction-acts-only-through-proposals) [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-document.handler.ts — header comment, lines 18-21 (rules/knowledge-base/document-ingestion-extracts-new-content) [adopt-ingestion.md]
  src/modules/ingestion/mcp/ingest-toolset.ts — the header comment (lines 11-23), the ingest_document comment (lines 243-247) and the Zod-failure audit comment (lines 431-441) (rules/knowledge-base/every-proposal-audited) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment above GetIngestionStatusOutputSchema, lines 199-203, and its docstring, lines 227-233 (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 270-273 and 292-296 (ingest_directed header) (rules/knowledge-base/directed-ingestion-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 276-277 above IngestDirectedRefSchema, and its docstring at line 307 (rules/knowledge-base/directed-reference-length) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 277-280 (the `confidence` absence in the ingest_directed header) and line 420 (rules/knowledge-base/directed-full-confidence) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 281-283 above IngestDirectedValidFromBasisSchema, and its docstring at line 310 (rules/knowledge-base/caller-never-states-received) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — comment lines 283-288 (the `node_id` pin in the ingest_directed header) (rules/knowledge-base/directed-pinned-node) [adopt-ingestion.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — the BR-34 header comment, line 276, and the docblock above IngestDirectedRefSchema, line 307 (rules/knowledge-base/directed-reference-length) [audit-db-restamp.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — the JSDoc above ListRecentIngestionsMcpInputSchema, line 251 (rules/knowledge-base/recent-ingestions-limit-bounds) [audit-db-restamp.md]
  src/modules/ingestion/mcp/mcp-schemas.ts — the same JSDoc above ListRecentIngestionsMcpInputSchema, line 251 (rules/knowledge-base/recent-ingestions-limit-default) [audit-db-restamp.md]
  src/modules/ingestion/mcp/propose-attribute.handler.ts — the header comment, lines 1-9 (rules/knowledge-base/attribute-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/mcp/propose-fragment.handler.ts — the comment above the assertRunIsRunning call in proposeFragmentHandler (lines 71-72) (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/mcp/propose-link.handler.ts — the header comment, lines 1-9 (rules/knowledge-base/link-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/mcp/transport.ts — the header comment, lines 10-12 (rules/knowledge-base/every-proposal-audited) [adopt-ingestion.md]
  src/modules/ingestion/mcp/transport.ts — the header comment, lines 10-12 (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the `DocumentMetadata.source_type` doc comment, line 53 (domain/knowledge-base/source-type) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the `system()` doc comment, lines 68-73 (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the comment inside `system()`, lines 89-99 (BR-30 prompt support) (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment at line 29 and the `prevTail` doc comment at line 231 (rules/knowledge-base/extraction-reads-chunks-in-order) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment, lines 22-27 (anti-injection envelope paragraph) (constraints/document-content-is-data) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment, lines 22-27 (anti-injection envelope paragraph) (constraints/document-content-is-data) [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v1.ts — the header comment, lines 29-31 (prev_tail paragraph), repeated in the `UserPromptArgs.prevTail` doc comment at line 231 (rules/knowledge-base/extraction-reads-chunks-in-order) [audit-db-restamp.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 20-22 (the anti-injection envelope reused from v1) (constraints/document-content-is-data) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 26-27 (the prompt version maps to the prompt that ran, through the registry) (rules/knowledge-base/prompt-version-known) [adopt-ingestion.md]
  src/modules/ingestion/prompts/extraction.v3.ts — header comment, lines 26-28 (idempotency key includes the prompt version) (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/prompts/index.ts — the JSDoc above UnknownPromptVersionError (line 72) and the JSDoc above selectPromptModule (lines 83-87) (rules/knowledge-base/prompt-version-known) [adopt-ingestion.md]
  src/modules/ingestion/prompts/index.ts — the comment above DEFAULT_PROMPT_VERSION, line 62 (rules/knowledge-base/default-prompt-version) [adopt-ingestion.md]
  src/modules/ingestion/prompts/index.ts — the header comment, lines 10-15 ("An unknown version is a configuration error ... it must never silently run a different prompt than the audit trail records") (rules/knowledge-base/prompt-version-known) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the doc comment above insertRawChunks (lines 153-154) and the doc comment above findChunksByRawInformationId (lines 182-183) (rules/knowledge-base/chunk-listing-order) [audit-db-restamp.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above LLM_RUN_IDEMPOTENCY_KEY_CONSTRAINT, line 31 (rules/knowledge-base/idempotency-key-unique) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above RAW_INFORMATION_CONTENT_HASH_CONSTRAINT, line 27 (rules/knowledge-base/content-hash-unique) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above findChunksByRawInformationId, lines 181-184 (rules/knowledge-base/chunk-listing-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above insertLlmRun, lines 200-203, the status default (rules/knowledge-base/ingestion-records-chunks-and-run) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring above insertRawChunks, lines 153-154 (rules/knowledge-base/chunk-listing-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/ingestion.repository.ts — the docstring on RawInformationRow.original_input, lines 44-49 (rules/knowledge-base/directed-turn-is-original-input) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of RecentIngestionRow, lines 38-44 (rules/knowledge-base/recent-ingestion-latest-run) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of RecentIngestionRow, lines 40-43 (contracts/knowledge-base/ingestion) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of aggregateToolCallOutcomes, lines 111-118 (rules/knowledge-base/summary-counts-tool-calls) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of aggregateToolCallOutcomes, lines 111-118, and the comment at lines 148-149 (rules/knowledge-base/summary-counts-orphaned-fragments) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of countChunksInSource, lines 347-350 (rules/knowledge-base/fragment-chunks-in-run-source) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of countFragmentsAnchoredToSource, lines 320-326 (rules/knowledge-base/cited-fragments-anchored) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of findRecentIngestions, lines 59-63 (rules/knowledge-base/recent-ingestions-order) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of findToolCallsByRun, line 237 (rules/knowledge-base/tool-call-listing-order) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of retryLlmRunRow, lines 165-168, and docstring of closeLlmRunRow, lines 204-208 (rules/knowledge-base/llm-run-lifecycle) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — docstring of retryLlmRunRow, lines 165-171, and the comment at lines 188-189 (rules/knowledge-base/retry-rejects-orphaned-fragments) [audit-db-restamp.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `RecentIngestionRow`, lines 38-44 (rules/knowledge-base/recent-ingestion-latest-run) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `aggregateToolCallOutcomes` (lines 115-117) and the inline comment before the orphan query (lines 148-149) (rules/knowledge-base/summary-counts-orphaned-fragments) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `aggregateToolCallOutcomes`, lines 111-114 (the second bullet continues to line 117) (rules/knowledge-base/summary-counts-tool-calls) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `countChunksInSource`, lines 347-350 (rules/knowledge-base/fragment-chunks-in-run-source) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `countFragmentsAnchoredToSource`, lines 320-326 (rules/knowledge-base/cited-fragments-anchored) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `findRecentIngestions`, lines 59-63 (rules/knowledge-base/recent-ingestions-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `findRecentIngestions`, lines 59-63 (rules/knowledge-base/recent-ingestions-limit-bounds) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `findToolCallsByRun`, line 237 (rules/knowledge-base/tool-call-listing-order) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `insertToolCallStandalone`, lines 287-290 (rules/knowledge-base/every-proposal-audited) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `retryLlmRunRow` (lines 165-168) and the docstring above `closeLlmRunRow` (lines 204-207) (rules/knowledge-base/llm-run-lifecycle) [adopt-ingestion.md]
  src/modules/ingestion/repository/llm-run.repository.ts — the docstring above `retryLlmRunRow` (lines 165-171) and the inline comment before the second query (lines 188-189) (rules/knowledge-base/retry-rejects-orphaned-fragments) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — comment block lines 409-427 above the propose-* mirrors (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — comment lines 288-289 in the run route (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — docstring of handleProposeMirror, lines 484-497 (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/routes/ingestion.routes.ts — header comment lines 24-44 (TC-13 specifics, points 2 and 4) (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/service/affected-nodes.ts — header comment, lines 19-25 (the CONTRACT block) (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/service/affected-nodes.ts — header comment, lines 27-30, and the comment inside isContributingOutcome, lines 79-86 (rules/knowledge-base/affected-nodes-of-a-run) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — docblock on DirectedAttributeValueSchema, lines 119-129 (rules/knowledge-base/directed-attribute-value-as-text) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — docblock on the sourceExcerpt dep, lines 274-281, and the comment at lines 362-365 (rules/knowledge-base/directed-turn-is-original-input) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 14-19, and the constant docblocks, lines 83-87 (rules/knowledge-base/directed-ingestion-run) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 21-24, and step 4 comment, line 763 (rules/knowledge-base/directed-run-completes) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 26-27, and step 3c comment, lines 599-601 (rules/knowledge-base/directed-full-confidence) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 26-27, and step 3c comment, lines 599-601 (rules/knowledge-base/directed-defaults) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 28-31 (rules/knowledge-base/directed-dependency-failed) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 5-8, and the docblock on synthesiseContent, lines 834-838 (rules/knowledge-base/directed-source-content) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — header comment, lines 9-11 (rules/knowledge-base/directed-dispatch-order) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the anchor comment, lines 449-454 (rules/knowledge-base/directed-fragments-anchor-first-chunk) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the docblock on classifyEnvelopeFailureStatus, lines 960-970 (rules/knowledge-base/directed-item-status) [adopt-ingestion.md]
  src/modules/ingestion/service/directed-ingestion.service.ts — the pin branch comment, lines 511-512, and the docblock on verifyNodePin, lines 854-858 (rules/knowledge-base/directed-pinned-node) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The comment in the exact-match branch (lines 145-146). (rules/knowledge-base/matched-node-gains-only-aliases) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The docblock of MATCH_FLOOR (lines 34-41), the resolveOrCreateNode docblock, step 4, ambiguous bullet (lines 97-99), the comment above the entity_match_review loop (lines 196-199), and the decideFromCandidates docblock (lines 255-261). (rules/knowledge-base/ambiguous-candidates-need-review) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The docblock of MATCH_STRONG (lines 26-32) and the docblock of decideFromCandidates (lines 249-257). (rules/knowledge-base/strong-candidate-resolves) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, Novel bullet (lines 100-101), and the decideFromCandidates docblock, Novel bullet (line 257). (rules/knowledge-base/no-candidate-creates-active-node) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, step 2 (lines 90-91). (rules/knowledge-base/exact-alias-resolves) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, step 3 (lines 92-94). (rules/knowledge-base/candidate-similarity) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — The resolveOrCreateNode docblock, step 5 (lines 102-104), and the docblock of attachCanonicalAndAliases (lines 284-287). (rules/knowledge-base/new-node-aliases) [adopt-ingestion.md]
  src/modules/ingestion/service/entity-resolution.service.ts — docblock of attachCanonicalAndAliases (lines 284-288) and step 5 of the resolveOrCreateNode docblock (lines 102-104). Code holds the same rule in attachCanonicalAndAliases and attachAliases. (rules/knowledge-base/new-node-aliases) [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — docblock of decideFromCandidates (lines 249-262). Code holds the same decision in decideFromCandidates itself, lines 266-281. (rules/knowledge-base/strong-candidate-resolves) [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — docblocks of MATCH_STRONG and MATCH_FLOOR (lines 26-41). Code holds the values in the constants at lines 32 and 41. (rules/knowledge-base/no-candidate-creates-active-node) [audit-db-restamp.md]
  src/modules/ingestion/service/entity-resolution.service.ts — step 2 of the resolveOrCreateNode docblock (lines 90-91) and the inline comment before the first attachAliases call (lines 145-146). Code holds the same rule in the step 1 query and in attachAliases, which is called without the canonical name. (rules/knowledge-base/matched-node-gains-only-aliases) [audit-db-restamp.md]
  src/modules/ingestion/service/extraction.service.ts — the comment at lines 235-241, in `dispatchToolUse`'s propose_fragment case, beside `chunk_ids: [chunkId]` (rules/knowledge-base/extraction-anchors-to-read-chunk) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the docstring at line 388 and the slice at lines 492-494, beside `PREV_TAIL_CHARS` (rules/knowledge-base/extraction-reads-chunks-in-order) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, line 21, and the docstring at line 89, beside the pre-check at lines 424-426 (rules/knowledge-base/extraction-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, line 23, the docstring at line 385, and the comment at lines 716-722, beside `FATAL_ERROR_BURST` and the `startsWith("SYSTEM_")` count (rules/knowledge-base/extraction-fails-on-repeated-system-errors) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, lines 27-29, and the comment at line 523, beside `closeRunSafe(pool, llmRunId, "failed")` and `closeRunSafe(pool, llmRunId, "completed")` (rules/knowledge-base/extraction-closes-its-run) [adopt-ingestion.md]
  src/modules/ingestion/service/extraction.service.ts — the header comment, lines 8-10 ("or 'refusal' — soft skip"), with the branch at lines 661-667 that holds the behavior (rules/knowledge-base/model-refusal-skips-chunk) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstring on SUCCESSION_MARKERS, line 82 (rules/knowledge-base/succession-signal) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstring on closeVigentForSuccession, lines 266-291 (rules/knowledge-base/succession-before-previous-start) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstring on promoteFragmentsToAccepted, lines 243-251 (rules/knowledge-base/provenance-accepts-proposed-fragment) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — docstrings on status_for_new_row in ConsolidateLinkArgs and ConsolidateAttributeArgs, lines 126 and 142 (rules/knowledge-base/new-assertion-status-from-confidence) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment "SPEC DIVERGENCE — `status='corrected'`", lines 45-62 (rules/knowledge-base/correction-replaces) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment "SPEC DIVERGENCE — `valid_to` in succession branch", lines 64-70 (rules/knowledge-base/succession-closing-date) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment, lines 34-39 (provenance on every branch) (rules/knowledge-base/consolidation-records-provenance) [adopt-ingestion.md]
  src/modules/ingestion/service/graph-consolidation.service.ts — header comment, lines 4-33 (the five branches of §6.5 and their precedence) (rules/knowledge-base/consolidation-precedence) [adopt-ingestion.md]
  src/modules/ingestion/service/ingestion.service.ts — Doc comment above ingestRawInformation, step 1 (line 80). (rules/knowledge-base/content-hash-is-sha256) [adopt-ingestion.md]
  src/modules/ingestion/service/ingestion.service.ts — Doc comment above ingestRawInformation, step 2 (line 81). (rules/knowledge-base/idempotency-key) [adopt-ingestion.md]
  src/modules/ingestion/service/ingestion.service.ts — the docstring of ingestRawInformation, step 1 (line 80) (rules/knowledge-base/content-hash-is-sha256) [audit-db-restamp.md]
  src/modules/ingestion/service/ingestion.service.ts — the docstring of ingestRawInformation, step 2 (line 81) (rules/knowledge-base/idempotency-key) [audit-db-restamp.md]
  src/modules/ingestion/service/llm-run.service.ts — the BR-33 comments in getLlmRunById (lines 97-102) and toLlmRunResponse (lines 254-256) (rules/knowledge-base/affected-nodes-only-when-completed) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the docstring of RunNotRunningError, lines 58-69 (constraints/ingestion-transports-answer-alike) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the docstring of retryLlmRun, line 192 ("Orphan-fragment cleanup happens inside `retryLlmRunRow` in the same TX.") (rules/knowledge-base/retry-rejects-orphaned-fragments) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the docstring of retryLlmRun, lines 187-192 (items 1 and 2 of the order) (rules/knowledge-base/llm-run-lifecycle) [adopt-ingestion.md]
  src/modules/ingestion/service/llm-run.service.ts — the header comment, lines 6-12 ("Errors:" list) (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — comments at lines 130-134 and 196-198 on the received fallback (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — header comment lines 9-11, and the comment on the guard at lines 71-73 (rules/knowledge-base/attribute-key-for-node-type) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — header comment, lines 7-8 ("Structural layer additionally parses the literal `value`") (rules/knowledge-base/attribute-value-parses) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the closed-domain comment block, lines 85-92 (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the comment block above the closed-domain gate, lines 85-92 (rules/knowledge-base/attribute-value-in-allowed-values) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the comment block at the start of Layer 3, lines 130-134 (rules/knowledge-base/required-start-available) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-attribute.service.ts — the layer headings at lines 52, 126, 130, 158 and 169, and the ordering comment at lines 85-87 (rules/knowledge-base/attribute-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the comment block inside the mismatch branch, lines 50-55 (rules/knowledge-base/fragment-chunks-exist) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the comment block inside the mismatch branch, lines 50-55 (rules/knowledge-base/fragment-chunks-in-run-source) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the comment inside the `matched !== args.chunk_ids.length` branch, lines 50-55 (rules/knowledge-base/fragment-missing-chunk-first) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the header comment, lines 8-10 ("1. Structural ...") (rules/knowledge-base/fragment-chunks-in-run-source) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-fragment.service.ts — the header comment, lines 8-10 ("1. Structural ...") (rules/knowledge-base/fragment-chunks-exist) [audit-db-restamp.md]
  src/modules/ingestion/service/propose-link.service.ts — Layer 3 comment, lines 139-142, and the comment at lines 206-208 (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — header comment, lines 13 and 17-19 (the 0.40 floor) (rules/knowledge-base/below-confidence-floor-records-nothing) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — header comment, lines 21-28 (what the consolidator decides) (rules/knowledge-base/consolidation-precedence) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-link.service.ts — header comment, lines 6-15 (the five-layer list) (rules/knowledge-base/link-proposal-check-order) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-node.service.ts — Header comment, lines 6-8 (scope of TC-09), and the comment above the catalog lookup, line 47 (rules/knowledge-base/node-type-in-catalog) [adopt-ingestion.md]
  src/modules/ingestion/service/propose-node.service.ts — Header comment, lines 9-12 (scope of TC-10), and the comment above the delegation, lines 57-58 [adopt-ingestion.md]
  src/modules/ingestion/service/propose.types.ts — the JSDoc comments above McpOk (line 14) and McpErr (line 20) (contracts/knowledge-base/ingestion) [adopt-ingestion.md]
  src/modules/ingestion/validation/confidence.ts — header comment, lines 3-5 (the active and uncertain thresholds) (rules/knowledge-base/new-assertion-status-from-confidence) [adopt-ingestion.md]
  src/modules/ingestion/validation/confidence.ts — header comment, lines 5-12 (the below-floor branch and the rejected outcome) (rules/knowledge-base/below-confidence-floor-records-nothing) [adopt-ingestion.md]
  src/modules/ingestion/validation/confidence.ts — header comment, lines 6-7 (supporting fragments) (rules/knowledge-base/fragment-recorded-proposed) [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the header comment, lines 27-29 (`BUSINESS_RUN_NOT_RUNNING` paragraph) (rules/knowledge-base/proposal-requires-running-run) [adopt-ingestion.md]
  src/modules/ingestion/validation/errors.ts — the header comment, lines 3-8 (BR-13 paragraph) (rules/knowledge-base/tool-call-validation-outcome) [adopt-ingestion.md]
  src/modules/ingestion/validation/graph-rules.ts — The header comment, lines 3-5 and 7-8, above the imports. (rules/knowledge-base/link-permitted-by-type-rule) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the docstring of assertValueInDomain (lines 88-108) and the inline comment on the sort (lines 116-118) (rules/knowledge-base/attribute-value-in-allowed-values) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the docstring of parseAttributeValue (lines 22-26) and the inline comments "Strict ISO YYYY-MM-DD; not free-form." (line 37) and "Strict: must be a finite numeric literal (no NaN, no Infinity)." (line 57) (rules/knowledge-base/attribute-value-parses) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the header comment (line 7) and the docstring of assertKnownType (lines 146-149), for the link_type kind (rules/knowledge-base/link-type-in-catalog) [adopt-ingestion.md]
  src/modules/ingestion/validation/structural.ts — the header comment (line 7, "Type-catalog membership ... node_type, link_type, attribute_key all live in the seeded catalog") and the docstring of assertKnownType (lines 146-149) (rules/knowledge-base/node-type-in-catalog) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment lines 11-13, the ERRATA_MARKERS docstring at lines 61-65, and the comment at line 117 (rules/knowledge-base/correction-requires-errata-evidence) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment lines 15-22 and the comment at line 159 (rules/knowledge-base/required-start-fallback) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment lines 15-22, the comment at line 135, and the comment at line 167 (rules/knowledge-base/required-start-available) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment, lines 4-5, and the comment at line 107 above the interval check (rules/knowledge-base/validity-start-before-end) [adopt-ingestion.md]
  src/modules/ingestion/validation/temporal.ts — Header comment, lines 6-10, and the comment block at lines 128-135 (rules/knowledge-base/stated-start-requires-basis) [adopt-ingestion.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — Docstring of ListAcceptedFragmentsQuerySchema, line 26 (`offset >= 0`) (rules/knowledge-base/page-offset-non-negative) [audit-db-restamp.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — Docstring of ListAcceptedFragmentsQuerySchema, lines 20-24 (at least one filter MUST be supplied) (rules/knowledge-base/listing-requires-a-filter) [audit-db-restamp.md]
  src/modules/query-retrieval/dto/fragment.dto.ts — Docstring of ListAcceptedFragmentsQuerySchema, lines 26-27 (defaults 20 and 0) (rules/knowledge-base/page-defaults) [audit-db-restamp.md]
  src/modules/query-retrieval/dto/search.dto.ts — The docblock above QueryString (lines 37-47), bullet "btrim non-empty after transform (rejects whitespace-only input)" (rules/knowledge-base/search-query-not-blank) [adopt-query-retrieval-r6.md]
  src/modules/query-retrieval/dto/search.dto.ts — The docblock above QueryString (lines 37-47), first bullets "min 1 char (raw)" and "max 1000 chars (raw)" (rules/knowledge-base/search-query-length) [adopt-query-retrieval-r6.md]
  src/modules/query-retrieval/dto/search.dto.ts — the docblock above QueryString, lines 37-47 (rules/knowledge-base/search-query-not-blank) [audit-db-restamp.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.get_provenance_fragment, lines 146-147 (rules/knowledge-base/provenance-requires-accepted-fragment) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.get_provenance_link, get_provenance_attribute and get_provenance_fragment, lines 138-139, 142-143 and 147 (rules/knowledge-base/provenance-refused-after-compliance-deletion) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.search, line 134, the `expand_depth` (1..3) clause (rules/knowledge-base/expansion-depth-bounds) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/mcp/query-toolset.ts — QueryRetrievalToolDescriptions.search, line 135, the `limit` (max 100) clause (rules/knowledge-base/page-limit-bounds) [adopt-query-retrieval-r5b.md]
  src/modules/query-retrieval/repository/accepted-fragments.repository.ts — header comment lines 15-20 ("Deduplication"), and the doc comment above `selectAcceptedFragments` (rules/knowledge-base/listing-one-entry-per-fragment) [audit-db-restamp.md]
  src/modules/query-retrieval/repository/accepted-fragments.repository.ts — header comment lines 3-6 and the doc comment above `countAcceptedFragments` (rules/knowledge-base/listing-total-before-pagination) [audit-db-restamp.md]
  src/modules/query-retrieval/repository/accepted-fragments.repository.ts — header comment, lines 1-26 (the "Filter" list), and the `FILTER_WHERE` constant that holds the same predicate (rules/knowledge-base/listing-holds-accepted-only) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the comment block above the /fragments/accepted route, lines 158-163 ("at least one required") (rules/knowledge-base/listing-requires-a-filter) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the comment block above the error mappers, lines 189-197 (BR-24) (constraints/retrieval-transports-answer-alike) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the same comment block, line 162 ("Tombstoned sources are silently omitted") (rules/knowledge-base/listing-excludes-compliance-deleted) [audit-db-restamp.md]
  src/modules/query-retrieval/routes/query-retrieval.routes.ts — the same comment block, lines 160-161 ("status = 'accepted'") (rules/knowledge-base/listing-holds-accepted-only) [audit-db-restamp.md]
  src/modules/query-retrieval/service/errors.ts — InvalidSearchQueryError constructor, the message chosen for reason "too_long" (line 16) (rules/knowledge-base/search-query-length) [adopt-query-retrieval-r4.md]
  src/modules/query-retrieval/service/search.service.ts — the comment above the link provenance guard, lines 331-332 (rules/knowledge-base/expanded-link-requires-provenance) [audit-db-restamp.md]
  src/modules/query-retrieval/service/search.service.ts — the comment above the node-hit provenance guard, lines 241-243 (rules/knowledge-base/node-surfaces-only-with-accepted-mention) [audit-db-restamp.md]
  a comment is removed, never refreshed, and the file reconciled after
[exit 1]
```

```
$ python3 -B $P/bin/trace.py --convergence backend specification siegard-work
299 node(s) of specification; 261 binding(s) in /home/siegfriedneto/projects/eternal/siegard-trace.json
0 initiative(s) read under siegard-work
  0 archived initiative(s) read from git at the commit before each was removed

259 current: bound, and every binding computes to what was recorded — the specification and the code stand as they did when the node was last answered
    constraint 6, contract 1, element 45, rule 201, scenario 6
2 stale: bound, and some binding no longer computes — `--check` lists each by class, and its route is that class's
    element 2
0 planned-unbound: a task implements it or an epic covers it, and no binding holds it — whether the task was delivered, and honored the node without encoding it, is `deliver.py --outstanding`'s answer per initiative
0 declared-uncovered: an epic looked at it and wrote down why it is not being built; a decision somebody made, never a gap
38 unreached: no initiative names it and nothing binds it — a specification describes more than the work has reached, and this is the part it has not
    constraint 2, contract 1, element 3, rule 30, scenario 2

files under backend: 279 tracked, 60 bound, 219 no binding names (215 unsurveyed) — `--untraced` lists them

261 bound node(s) no initiative names — bound by a reconciliation over source that entered outside any task, or by a raw --bind; `--all` lists them

Kept apart — the judged side, which no state above counts: 29 finding(s) past reconciliations left open and no bind closed (29 unseen, 0 covered, 0 reported); 118 pair(s) the records answer both ways; 111 unstated fact(s) the source states and no node holds; 231 place(s) text restates a node's fact; 50 node(s) a refused certification left with a testable remainder. A binding that computes is a fact about bytes and a record that found against a node is a fact about a reading — `--owed` names each record.
[exit 0]
```

**Montagem do `owed.md`:** script python só de leitura sobre as três saídas acima e sobre os campos `unstated`, `restates` e `nodes` dos 7 records em `siegard-reconcile/` (e os retornos, para o `kind` da seção 1). As contagens batem com o `--owed`: 33 findings abertos (29 backend + 4 migrations, todos unseen), 111 unstated, 231 restates (12 em migrations/ + 219 no backend), 50 restos testáveis. Os blocos "answered both ways" (118 pares) ficam só no verbatim acima. Nenhuma decisão foi tomada.

**STOP (Fase B).** Marque em `owed.md` o que entra em cada rota (C1: T*, C2: U*, C3: R* do backend, findings: F*).
