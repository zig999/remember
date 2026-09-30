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
