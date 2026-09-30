---
contract_version: siegard-survey/0-prototype
target: migrations
files:
  - 0001_init.sql
  - 0004_chat_persistence.sql
  - 0005_chat_graph_view.sql
  - 0006_original_input.sql
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
  - seeds/0003_event_type_taxonomy.sql
read_outside_area:
  - /tmp/db-digest.txt — the context so far (node identities), read to reuse names; not source.
---

## Facts

### Name normalization
- The one normalization is `lower(immutable_unaccent(regexp_replace(btrim(t), '\s+', ' ', 'g')))`. It lowercases, strips accents through the `unaccent` dictionary, collapses every run of whitespace to one space, and trims. `0001_init.sql` (`FUNCTION norm`).
- The trim runs before the collapse, and `btrim(t)` with one argument removes only space characters. Leading or trailing tabs or newlines are not removed: they collapse into a single space that remains in the normalized name. `0001_init.sql` (`FUNCTION norm`).
- Normalization is STRICT: a null name normalizes to null. `0001_init.sql` (`norm ... STRICT`).

### Text search configurations
- Prose (chunk text, fragment text) is indexed under `pt_unaccent_v1`: a copy of `portuguese` with `unaccent` then `portuguese_stem` for word, hword and hword_part tokens. `0001_init.sql` (`CREATE TEXT SEARCH CONFIGURATION pt_unaccent_v1`).
- Entity names (aliases) are indexed under `simple_unaccent_v1`: a copy of `simple` with `unaccent` then `simple`, which means no stemming. `0001_init.sql` (`simple_unaccent_v1`).
- Chunk text and fragment text carry a stored tsvector generated from `pt_unaccent_v1`. `0001_init.sql` (`raw_chunk.text_search`, `information_fragment.text_search`).
- Only chunks whose `superseded_at` is null are in the chunk full-text index. `0001_init.sql` (`raw_chunk_fts_idx ... WHERE superseded_at IS NULL`).
- Only accepted fragments are in the fragment full-text index. `0001_init.sql` (`information_fragment_fts_idx ... WHERE status = 'accepted'`).
- Aliases are indexed for full text as `to_tsvector('simple_unaccent_v1', alias)` over the raw alias, not the normalized one, and for trigram similarity over the normalized alias. `0001_init.sql` (`node_alias_fts_idx`, `node_alias_norm_trgm_idx`).

### Canonical value casts
- A date-typed attribute value is cast with `v::date`, and a number-typed value with `v::numeric`. The cast follows PostgreSQL's input parsing, so it accepts any date input the server's DateStyle accepts, not only `YYYY-MM-DD`. `0001_init.sql` (`canonical_date`, `canonical_number`).

### Node type (catalog)
- A node type has a UUID id (`gen_random_uuid()`), a unique non-null name, a non-null description and a version that defaults to 1. `0001_init.sql` (`node_type`).

### Link type (catalog)
- A link type has a unique non-null name and non-null values for label, description, inverse name, `is_temporal`, `allows_multiple_current`, `requires_valid_from` and `requires_valid_to_on_change`. Its version defaults to 1. `0001_init.sql` (`link_type`).

### Link type rule (catalog)
- A rule names a link type, a source node type and a target node type (all non-null foreign keys) plus an optional `valid_from`/`valid_to` date window. `0001_init.sql` (`link_type_rule`).
- When both window ends are present, `valid_from < valid_to`. `0001_init.sql` (`link_type_rule_interval_ck`).
- The DDL puts no uniqueness on (link type, source type, target type). The seeds avoid duplicates only through `WHERE NOT EXISTS`. `0001_init.sql` (`link_type_rule`); `seeds/0001_seed.sql` (§3 insert).
- The seeded rules carry null `valid_from`/`valid_to`. `seeds/0001_seed.sql`, `seeds/0002_ontology_status_task.sql` (insert column list omits the window).

### Attribute key (catalog)
- An attribute key belongs to one node type. It has a key, a value type, `is_temporal`, `allows_multiple_current`, `requires_valid_from`, a description, and a version that defaults to 1. `0001_init.sql` (`attribute_key`).
- A key name is unique per node type. `0001_init.sql` (`UNIQUE (node_type_id, key)`).
- An attribute key has no `requires_valid_to_on_change` column; only link types carry it. `0001_init.sql` (`attribute_key` vs `link_type`).

### Attribute allowed values (catalog)
- An allowed value belongs to one attribute key. It has a non-null value, an optional label, an optional `sort_order`, an optional description, and a version that defaults to 1. `0001_init.sql` (`attribute_valid_value`).
- A value is unique per attribute key. `sort_order` has no uniqueness. `0001_init.sql` (`UNIQUE (attribute_key_id, value)`).
- The schema does not tie an attribute's recorded value to the allowed values. `node_attribute` has no foreign key to `attribute_valid_value`. `0001_init.sql` (`node_attribute`).

### RawInformation
- A source has a UUID id, a non-null `source_type`, non-null `content`, and an optional `storage_ref`. `0001_init.sql` (`raw_information`).
- `content_hash` is non-null and unique, and must match `^[0-9a-f]{64}$` (64 lowercase hex characters). `0001_init.sql` (`raw_information.content_hash`).
- `received_at` is non-null and defaults to the recording time (`now()`). `0001_init.sql` (`raw_information.received_at`).
- `metadata` is non-null jsonb that defaults to `{}`. The schema does not constrain its shape. `0001_init.sql` (`raw_information.metadata`).
- A source's `status` uses the node-status vocabulary, is non-null and defaults to `active`. `superseded_at` is nullable. The DDL accepts all four node-status values here, including `needs_review` and `merged`. `0001_init.sql` (`raw_information.status`).
- `original_input` is nullable text with no default, no CHECK and no text-search index. It is not part of `content_hash`, since the hash CHECK covers only that column. `0006_original_input.sql` (`ADD COLUMN original_input text`).
- Foreign keys to a source have no `ON DELETE` clause (NO ACTION): a source cannot be deleted while chunks, runs or compliance deletions reference it. `0001_init.sql` (`raw_chunk`, `llm_run`, `compliance_deletion` FKs).

### RawChunk
- A chunk belongs to one source. It has a non-null `chunk_index >= 0`, non-null text, `offset_start >= 0`, and `offset_end > offset_start`. `0001_init.sql` (`raw_chunk`, `raw_chunk_offsets_ck`).
- `locator` is nullable jsonb whose shape the schema does not constrain. `0001_init.sql` (`raw_chunk.locator`).
- `chunking_version` is non-null text that defaults to `'v1'`. `0001_init.sql` (`raw_chunk.chunking_version`).
- (source, chunking version, chunk index) is unique. `0001_init.sql` (`UNIQUE (raw_information_id, chunking_version, chunk_index)`).
- A chunk's `status` uses node-status, is non-null and defaults to `active`. `superseded_at` is nullable. `0001_init.sql` (`raw_chunk.status`).

### LLMRun
- A run has a non-null `model` and `prompt_version`, `started_at` defaulting to `now()`, a nullable `finished_at`, a status defaulting to `running`, and `attempts` defaulting to 1 with `attempts >= 1`. `0001_init.sql` (`llm_run`).
- A run references exactly one input source (`input_raw_information_id` NOT NULL). `0001_init.sql` (`llm_run`).
- `idempotency_key` is non-null text, unique across all runs. The schema does not constrain its format. `0001_init.sql` (`llm_run.idempotency_key`).
- A run is `running` exactly when `finished_at` is null: a completed or failed run must carry `finished_at`, and a running one must not. `0001_init.sql` (`llm_run_finished_ck`).

### ToolCall
- A tool call belongs to one run. It has a non-null `tool_name` (free text), non-null jsonb `arguments`, nullable jsonb `result`, a non-null validation outcome, and `created_at` defaulting to `now()`. `0001_init.sql` (`tool_call`).

### InformationFragment
- A fragment belongs to one run. Its text is non-null and at most 1000 characters (`char_length`). `0001_init.sql` (`information_fragment`).
- Confidence is non-null, between 0 and 1 inclusive. `0001_init.sql` (`information_fragment.confidence`).
- Status is non-null and defaults to `proposed`. `superseded_at` is nullable. `created_at` defaults to `now()`. `0001_init.sql` (`information_fragment`).
- A fragment is anchored to chunks through `fragment_source`, with primary key (fragment, chunk). The same pair cannot repeat, and the schema does not require a fragment to have any chunk. `0001_init.sql` (`fragment_source`).
- The schema does not require a fragment's chunks to belong to its run's source. `0001_init.sql` (`fragment_source` has no link to `llm_run`).

### KnowledgeNode
- A node has one non-null node type, a non-null `canonical_name`, a status defaulting to `active`, and an optional `merged_into_node_id` pointing at another node. `0001_init.sql` (`knowledge_node`).
- A node is `merged` exactly when `merged_into_node_id` is set. `0001_init.sql` (`knowledge_node_merged_ck`).
- A node cannot be merged into itself. `0001_init.sql` (`knowledge_node_no_self_merge_ck`).
- `updated_at` is set to `now()` on every update. `0001_init.sql` (`trg_knowledge_node_updated_at`).
- The DDL does not require the merge target to be active. `0001_init.sql` (`knowledge_node` FK has no predicate).

### NodeAlias
- An alias belongs to one node. It has non-null alias text that is not blank after `btrim`, and a stored `alias_norm = norm(alias)`. `0001_init.sql` (`node_alias`).
- Kind defaults to `alias`. `created_by_run_id` is nullable. `0001_init.sql` (`node_alias.kind`, `.created_by_run_id`).
- A node cannot hold two aliases with the same normalized form. `0001_init.sql` (`UNIQUE (node_id, alias_norm)`).
- A node holds at most one `canonical` alias. The DDL does not require it to hold one. `0001_init.sql` (`node_alias_one_canonical_uq`).
- The same normalized alias may exist on different nodes. `0001_init.sql` (the uniqueness is per `node_id` only).

### NodeAttribute
- An attribute belongs to one node and one attribute key. It has non-null `value` text, a `value_type` that must equal its key's value type (composite FK `(attribute_key_id, value_type)`), and a non-null `status` of the assertion-status vocabulary with no default. `0001_init.sql` (`node_attribute`).
- `value_date` is derived from `value` when the type is `date`, and `value_number` when the type is `number`. A value that does not cast refuses the whole row. `0001_init.sql` (generated columns).
- Confidence is non-null, between 0 and 1 inclusive. `0001_init.sql` (`node_attribute.confidence`).
- When both are present, `valid_from < valid_to` (half-open interval). `0001_init.sql` (`node_attribute_interval_ck`).
- A `valid_from` requires a `valid_from_source` basis. A basis without a `valid_from` is permitted. `0001_init.sql` (`node_attribute_basis_ck`).
- `recorded_at` defaults to `now()`. `superseded_at` is nullable. `created_by_run_id` is nullable. `0001_init.sql` (`node_attribute`).
- `supersedes_attribute_id` optionally points at the attribute this one succeeds, never at itself. `0001_init.sql` (`node_attribute_no_self_supersede_ck`).
- At most one current row (null `valid_to` and null `superseded_at`) exists per (node, key, value). Rows of any status count, including `deleted` and `disputed`, as long as both columns are null. `0001_init.sql` (`node_attribute_current_dup_guard`).
- The DDL does not limit a functional key to one current value per (node, key). `0001_init.sql` (no such index).
- The schema does not require the key's node type to equal the node's node type. `0001_init.sql` (no FK between `node_attribute.node_id` type and `attribute_key.node_type_id`).
- `updated_at` is set to `now()` on update. `0001_init.sql` (`trg_node_attribute_updated_at`).

### KnowledgeLink
- A link has non-null source node, target node and link type, a nullable `valid_from`/`valid_to`, `recorded_at` defaulting to `now()`, a nullable `superseded_at`, a non-null status with no default, confidence in [0,1], an optional `valid_from_source`, an optional `created_by_run_id` and an optional `supersedes_link_id`. `0001_init.sql` (`knowledge_link`).
- `valid_from < valid_to` when both are present; a `valid_from` requires a basis; a link cannot supersede itself. `0001_init.sql` (`knowledge_link_interval_ck`, `_basis_ck`, `_no_self_supersede_ck`).
- At most one current row exists per (source, target, link type), with the same predicate as attributes. `0001_init.sql` (`knowledge_link_current_dup_guard`).
- The DDL permits a link whose source and target are the same node. `0001_init.sql` (no CHECK).
- The DDL does not check the pair of node types against a link type rule. `0001_init.sql` (no FK to `link_type_rule`).
- `updated_at` is set to `now()` on update. `0001_init.sql` (`trg_knowledge_link_updated_at`).

### Provenance
- A provenance row cites one non-null fragment and exactly one of a link or an attribute. `0001_init.sql` (`provenance_target_ck`, `num_nonnulls(link_id, attribute_id) = 1`).
- A fragment cannot cite the same link twice or the same attribute twice. `0001_init.sql` (`provenance_link_fragment_uq`, `provenance_attr_fragment_uq`).
- The DDL does not restrict the cited fragment's status. `0001_init.sql` (`provenance.fragment_id` plain FK).

### Resolved views (derived state)
- `is_current` is true when `valid_to` is null and `superseded_at` is null. This holds for links and attributes alike. `0001_init.sql` (`knowledge_link_resolved`, `node_attribute_resolved`).
- `is_in_effect` is true when the row is current and `valid_from` is either null or on or before `current_date`. `0001_init.sql` (same views).
- `effective_status` is `'inactive'` when the stored status is `active` and `valid_to` is on or before `current_date`. Otherwise it is the stored status as text. `0001_init.sql` (same views).
- The link view adds the link type's `name` and `inverse_name`. The attribute view adds the key's name, `is_temporal` and `allows_multiple_current`. `0001_init.sql` (same views).
- `current_date` is the server session's date, so the derived values depend on the session's time zone. `0001_init.sql` (views use `current_date`).

### Entity match review
- A review pairs a node with a candidate node and a similarity in [0,1]. The two nodes must differ, and each (node, candidate) pair is unique. `0001_init.sql` (`entity_match_review`).

### Curation action
- A curation action records a non-null `action` and `target_kind` (both free text), an optional `target_id`, a jsonb `payload` defaulting to `{}`, and an optional `reason`. It has no actor column. `0001_init.sql` (`curation_action`).

### Compliance deletion
- A compliance deletion references one source. It has a non-null `reason`, `executed_at` defaulting to `now()`, and a jsonb `affected` defaulting to `{}`. `0001_init.sql` (`compliance_deletion`).

### Chat persistence
- A conversation has nullable `title`, `summary_rolling` and `archived_at`, and `created_at`/`updated_at` defaulting to `now()`. `updated_at` is set on every update. The DDL puts no length bound on the title. `0004_chat_persistence.sql` (`chat_conversation`).
- A message belongs to one conversation and is deleted with it (`ON DELETE CASCADE`). It has a non-null role, non-null jsonb `content`, and nullable `stop_reason` (free text), `idempotency_key` (uuid), `model`, `tokens_in`, `tokens_out` and `latency_ms`. `0004_chat_persistence.sql` (`chat_message`).
- Within a conversation a non-null message idempotency key is unique. Null keys may repeat. The DDL does not tie a null or non-null key to the role. `0004_chat_persistence.sql` (`idx_chat_message_idempotency`).
- A chat tool call belongs to one conversation (cascade delete) and optionally to one message (`ON DELETE SET NULL`). It has a non-null `tool_name`, non-null jsonb `arguments`, nullable `result`, `is_error` defaulting to false, a nullable `error_message` and a non-null `duration_ms`. `0004_chat_persistence.sql` (`chat_tool_call`).
- Each conversation has at most one graph view snapshot (its primary key is the conversation), deleted with the conversation. The snapshot is non-null jsonb with `updated_at` defaulting to `now()`. No trigger refreshes `updated_at`. `0005_chat_graph_view.sql` (`chat_graph_view`).
- Chat tables carry no status/tombstone columns. `0004_chat_persistence.sql`, `0005_chat_graph_view.sql`.

### Seeded catalog: node types (10)
- Person — "Pessoa física". `seeds/0001_seed.sql`.
- Organization — "Empresa, órgão, time formal". `seeds/0001_seed.sql`.
- Project — "Projeto/iniciativa com objetivo e ciclo de vida". `seeds/0001_seed.sql`.
- Event — "Acontecimento pontual (reunião, go-live, workshop)". `seeds/0001_seed.sql`.
- Role — "Cargo/função (vocabulário controlado)". `seeds/0001_seed.sql`.
- Category — "Rótulo taxonômico para classificação". `seeds/0001_seed.sql`.
- Concept — "Conceito/tema referenciável". `seeds/0001_seed.sql`.
- Location — "Lugar físico ou lógico". `seeds/0001_seed.sql`.
- Document — "Artefato referenciado no conteúdo (proposta, ata, contrato, relatório); não é a fonte ingerida". `seeds/0001_seed.sql`.
- Task — "Tarefa/atividade com responsável, prazo e ciclo de vida". `seeds/0002_ontology_status_task.sql`.

### Seeded catalog: link types (13)
Columns are name / label / inverse name, then temporal, multiple current, requires valid_from, requires valid_to on change.
- participates_in / "participa de" / has_participant — true, true, true, false. `seeds/0001_seed.sql`.
- member_of / "é membro de" / has_member — true, true, true, false. `seeds/0001_seed.sql`.
- holds_role / "exerce o cargo de" / role_held_by — true, true, true, false. `seeds/0001_seed.sql`.
- responsible_for / "é responsável por" / under_responsibility_of — true, true, true, false. `seeds/0001_seed.sql`.
- reports_to / "reporta a" / manages — true, false, true, true. `seeds/0001_seed.sql`.
- part_of / "faz parte de" / has_part — true, false, true, true. `seeds/0001_seed.sql`.
- located_in / "localizado em" / location_of — true, false, true, true. `seeds/0001_seed.sql`.
- organizes / "organiza" / organized_by — true, true, true, false. `seeds/0001_seed.sql`.
- belongs_to_category / "pertence à categoria" / contains — false, true, false, false. `seeds/0001_seed.sql`.
- related_to / "relacionado a" / related_to — false, true, false, false. `seeds/0001_seed.sql`.
- concerns / "trata de" / addressed_by — false, true, false, false. `seeds/0001_seed.sql`.
- delivered_to / "entregue a" / recipient_of — true, true, false, false. `seeds/0001_seed.sql`.
- sponsors / "patrocina" / sponsored_by — true, true, true, false. `seeds/0001_seed.sql`.

### Seeded catalog: link type rules (30), as source type → target type
- participates_in: Person→Project, Person→Event. `seeds/0001_seed.sql`.
- member_of: Person→Organization. `seeds/0001_seed.sql`.
- holds_role: Person→Role. `seeds/0001_seed.sql`.
- responsible_for: Person→Project, Person→Event (`seeds/0001_seed.sql`); Person→Task (`seeds/0002_ontology_status_task.sql`).
- reports_to: Person→Person. `seeds/0001_seed.sql`.
- part_of: Organization→Organization, Project→Project, Event→Project (`seeds/0001_seed.sql`); Task→Project (`seeds/0002_ontology_status_task.sql`).
- located_in: Organization→Location, Event→Location. `seeds/0001_seed.sql`.
- organizes: Organization→Event, Person→Event. `seeds/0001_seed.sql`.
- belongs_to_category: Person, Organization, Project, Event, Concept, Location → Category (six rules; Role, Document and Task have none). `seeds/0001_seed.sql`.
- related_to: Concept→Concept, Project→Concept. `seeds/0001_seed.sql`.
- concerns: Document→Project, Document→Event, Document→Organization, Event→Project. `seeds/0001_seed.sql`.
- delivered_to: Document→Person. `seeds/0001_seed.sql`.
- sponsors: Organization→Project. `seeds/0001_seed.sql`.

### Seeded catalog: attribute keys (19)
Columns are node type.key, then value type, temporal, multiple current, requires valid_from.
- Project.deadline — date, true, false, true. `seeds/0001_seed.sql`.
- Project.start_date — date, true, false, true. `seeds/0001_seed.sql`.
- Project.status_text — text, true, false, true. `seeds/0001_seed.sql`.
- Project.budget — number, true, false, true. `seeds/0001_seed.sql`.
- Event.event_date — date, true, false, true. `seeds/0001_seed.sql`.
- Event.end_date — date, true, false, true. `seeds/0001_seed.sql`.
- Event.event_type — text, false, false, false. `seeds/0001_seed.sql`.
- Person.email — text, true, true, false. `seeds/0001_seed.sql`.
- Person.phone — text, true, true, false. `seeds/0001_seed.sql`.
- Person.birth_date — date, false, false, false. `seeds/0001_seed.sql`.
- Organization.cnpj — text, false, false, false. `seeds/0001_seed.sql`.
- Organization.website — text, true, false, false. `seeds/0001_seed.sql`.
- Location.city — text, false, false, false. `seeds/0001_seed.sql`.
- Location.address — text, false, false, false. `seeds/0001_seed.sql`.
- Concept.definition — text, false, false, false. `seeds/0001_seed.sql`.
- Document.doc_type — text, false, false, false. `seeds/0001_seed.sql`.
- Task.status — text, true, false, true. `seeds/0002_ontology_status_task.sql`.
- Task.priority — text, true, false, true. `seeds/0002_ontology_status_task.sql`.
- Task.due_date — date, true, false, true. `seeds/0002_ontology_status_task.sql`.
- Role and Category have no attribute keys, and no key has value type `bool`. `seeds/0001_seed.sql`, `seeds/0002_ontology_status_task.sql`.

### Seeded catalog: allowed values (33), as value "label" (sort order)
- Document.doc_type: proposta "Proposta" (1), ata "Ata" (2), contrato "Contrato" (3), relatório "Relatório" (4), outro "Outro" (5). `seeds/0001_seed.sql`.
- Event.event_type: reunião "Reunião" (1), go-live "Go-live" (2), workshop "Workshop" (3), outro "Outro" (4) (`seeds/0001_seed.sql`); cobrança "Cobrança/Follow-up" (5), decisão "Decisão" (6), escalonamento "Escalonamento" (7), bloqueio "Bloqueio/Impedimento" (8), marco "Marco/Entrega" (9) (`seeds/0003_event_type_taxonomy.sql`).
- Project.status_text: planejado "Planejado" (1), em aprovação "Em aprovação" (2), aprovado "Aprovado" (3), em andamento "Em andamento" (4), pausado "Pausado" (5), concluído "Concluído" (6), cancelado "Cancelado" (7), outro "Outro" (8). `seeds/0002_ontology_status_task.sql`.
- Task.status: a fazer "A fazer" (1), em andamento "Em andamento" (2), bloqueada "Bloqueada" (3), em revisão "Em revisão" (4), concluída "Concluída" (5), cancelada "Cancelada" (6), outro "Outro" (7). `seeds/0002_ontology_status_task.sql`.
- Task.priority: baixa "Baixa" (1), média "Média" (2), alta "Alta" (3), crítica "Crítica" (4). `seeds/0002_ontology_status_task.sql`.
- Allowed values are stored with accents and spaces as spelled above. The table applies no normalization to them. `0001_init.sql` (`attribute_valid_value.value` plain text).
- The seeded allowed values carry no description. `seeds/*` (insert column list omits `description`).

## Answers
These are the answers PostgreSQL gives for the constraints above. The DDL does not fix the order in which one row's violations are reported.
- Record a source or run — a `content_hash` that already exists → SQLSTATE `23505` unique_violation (`raw_information_content_hash_key`). `0001_init.sql` (`raw_information`).
- Record a source — a `content_hash` that is not 64 lowercase hex characters → `23514` check_violation (the column's CHECK). `0001_init.sql` (`raw_information.content_hash`).
- Record a source — a `source_type` outside the vocabulary → `22P02` invalid_text_representation (enum `source_type`). `0001_init.sql`.
- Record a run — an `idempotency_key` that already exists → `23505` (`llm_run_idempotency_key_key`). `0001_init.sql` (`llm_run`).
- Record or close a run — status `running` with `finished_at` set, or a non-running status without it → `23514` (`llm_run_finished_ck`). `0001_init.sql`.
- Record a run — `attempts < 1` → `23514` (the `attempts` CHECK). `0001_init.sql`.
- Record a chunk — `chunk_index < 0` or `offset_start < 0` → `23514`; `offset_end <= offset_start` → `23514` (`raw_chunk_offsets_ck`); a duplicate (source, chunking version, index) → `23505`. `0001_init.sql` (`raw_chunk`).
- Record a fragment — text longer than 1000 characters → `23514`; confidence outside [0,1] → `23514`. `0001_init.sql` (`information_fragment`).
- Anchor a fragment — the same (fragment, chunk) pair twice → `23505` (`fragment_source_pkey`); a nonexistent fragment or chunk → `23503` foreign_key_violation. `0001_init.sql` (`fragment_source`).
- Record a node — `merged` status without a merge target, or a merge target with another status → `23514` (`knowledge_node_merged_ck`); merged into itself → `23514` (`knowledge_node_no_self_merge_ck`). `0001_init.sql`.
- Record an alias — blank after trim → `23514`; a normalized form the node already holds → `23505` (`node_alias_node_id_alias_norm_key`); a second canonical alias on a node → `23505` (`node_alias_one_canonical_uq`). `0001_init.sql`.
- Record an attribute — a value type different from the key's → `23503` (the composite FK to `attribute_key (id, value_type)`); a date value that does not cast → `22007`/`22008` (datetime format or field out of range); a number value that does not cast → `22P02`. `0001_init.sql` (generated `value_date`/`value_number`).
- Record an attribute or link — `valid_from >= valid_to` → `23514` (`node_attribute_interval_ck` / `knowledge_link_interval_ck`); `valid_from` without a basis → `23514` (`*_basis_ck`); superseding itself → `23514` (`*_no_self_supersede_ck`); confidence outside [0,1] → `23514`; a duplicate current row (the same node, key and value, or the same source, target and type) → `23505` (`node_attribute_current_dup_guard` / `knowledge_link_current_dup_guard`). `0001_init.sql`.
- Record provenance — both or neither of link and attribute set → `23514` (`provenance_target_ck`); the same fragment on the same item again → `23505` (`provenance_link_fragment_uq` / `provenance_attr_fragment_uq`). `0001_init.sql`.
- Record an entity match review — node equals candidate → `23514` (`entity_match_review_distinct_ck`); a pair that already exists → `23505`; similarity outside [0,1] → `23514`. `0001_init.sql`.
- Record an allowed value — a value the key already has → `23505`. `0001_init.sql` (`attribute_valid_value`).
- Record an attribute key — a key the node type already has → `23505`. `0001_init.sql` (`attribute_key`).
- Delete a source, chunk, run, fragment, node, link or attribute that anything references → `23503` (NO ACTION foreign keys). `0001_init.sql`.
- Record a chat message — a non-null idempotency key already used in the conversation → `23505` (`idx_chat_message_idempotency`); a role outside `user`/`assistant` → `22P02`. `0004_chat_persistence.sql`.
- Record a second graph view for one conversation → `23505` (`chat_graph_view_pkey`). `0005_chat_graph_view.sql`.

## Vocabularies
- source-type (`source_type`): pdf, email, ata, chat, artigo, transcricao, outro. `0001_init.sql`.
- fragment-status (`fragment_status`): proposed, accepted, rejected, superseded, deleted. `0001_init.sql`.
- node-status (`node_status`): active, needs_review, merged, deleted. It is also the type of source and chunk status. `0001_init.sql`.
- assertion-status (`assertion_status`): active, uncertain, disputed, superseded, deleted. `inactive` is not a stored value; only the views derive it. `0001_init.sql`.
- alias-kind (`alias_kind`): canonical, alias. `0001_init.sql`.
- valid-from-basis (`valid_from_source`): stated, document, received. `0001_init.sql`.
- value-type (`attribute_value_type`): date, number, text, bool. `0001_init.sql`.
- run-status (`llm_run_status`): running, completed, failed. `0001_init.sql`.
- validation-outcome (`validation_outcome`): accepted, consolidated, superseded_previous, needs_review, uncertain, disputed, rejected, error. `0001_init.sql`.
- chat message role (`chat_message_role`): user, assistant. `0004_chat_persistence.sql`.
- Node types, link types, link type rules, attribute keys and allowed values are closed catalogs; every row is listed under Facts. `seeds/0001_seed.sql`, `seeds/0002_ontology_status_task.sql`, `seeds/0003_event_type_taxonomy.sql`.

## Upstream artifacts
- PostgreSQL extensions `unaccent` (dictionary `'unaccent'`) and `pg_trgm` (`gin_trgm_ops`). Their accent table and trigram behavior come from those extensions. `0001_init.sql`.
- The built-in text search templates `portuguese`, `portuguese_stem` and `simple` are copied into the two configurations; stemming behavior is PostgreSQL's. `0001_init.sql`.
- `gen_random_uuid()` (PostgreSQL core) generates every UUID primary key. `0001_init.sql`, `0004_chat_persistence.sql`.
- `chat_conversation`, `chat_message`, `chat_tool_call` and `chat_graph_view` belong to the chat module, not to ingestion. They reference only each other. `0004_chat_persistence.sql`, `0005_chat_graph_view.sql`.
- `raw_information.original_input` is a column on the ingestion source row that chat-directed ingestion populates. `0006_original_input.sql`.
- `curation_action`, `entity_match_review` and `compliance_deletion` are tables the curation and compliance flows write. `0001_init.sql`.

## Outside the domain
- Every non-unique btree/GIN index on foreign keys, `recorded_at`, `created_at` and value columns (for example `*_idx`, `knowledge_node_needs_review_idx`, `*_disputed_idx`, `idx_chat_*`) is an index shape. `0001_init.sql`, `0004_chat_persistence.sql`.
- The `set_updated_at()` trigger function and its triggers are framework wiring for `updated_at`. `0001_init.sql`, `0004_chat_persistence.sql`.
- `BEGIN`/`COMMIT` wrappers, and the seeds' idempotency through `ON CONFLICT DO NOTHING` / `WHERE NOT EXISTS`, are migration mechanics. `seeds/*`.
- `immutable_unaccent`, `canonical_date` and `canonical_number` are helper wrappers declared IMMUTABLE for generated columns; their behavior is recorded under Facts only. `0001_init.sql`.
- `raw_information.storage_ref` is nullable text with no constraint; nothing in the area gives it a use. `0001_init.sql`.
- `COMMENT ON COLUMN raw_information.original_input` is column metadata text and was not used as evidence. `0006_original_input.sql`.
- All `--` comments (requirement citations, "restart the BFF", totals, rationale) were read and not used as evidence. All files.

## Observed and not decided here
- For a link or attribute with `status = 'active'`, a null `superseded_at` and a `valid_to` after today, the views answer `is_current = false` and `is_in_effect = false` (both require `valid_to IS NULL`) but `effective_status = 'active'` (inactive only when `valid_to <= current_date`). `0001_init.sql` (`knowledge_link_resolved`, `node_attribute_resolved`).
- The views derive `inactive` only from the stored status `active`. A row stored as `uncertain` (or `disputed`) with a past `valid_to` keeps answering `uncertain`, although it has also ended. `0001_init.sql` (the `CASE WHEN kl.status = 'active' ...` in both views).
- A compliance tombstone is excluded differently at the index level. Chunks leave the full-text index by `superseded_at IS NULL`, whatever their status. Fragments leave by `status = 'accepted'`, whatever their `superseded_at`. `0001_init.sql` (`raw_chunk_fts_idx` vs `information_fragment_fts_idx`).
- The duplicate guards count a row as current by `valid_to IS NULL AND superseded_at IS NULL`, whatever its status. A `deleted` row whose `superseded_at` is still null keeps blocking a new equal row. The views likewise report it `is_current = true` with `effective_status = 'deleted'`. `0001_init.sql` (`node_attribute_current_dup_guard`, `knowledge_link_current_dup_guard`, the views).
- Source and chunk status accept every node-status value (`active`, `needs_review`, `merged`, `deleted`), and no CHECK narrows them. Nothing in the area gives a source or chunk a meaning for `needs_review` or `merged`. `0001_init.sql` (`raw_information.status`, `raw_chunk.status`).
- Event.event_type's `outro` has sort order 4, while values added later have 5–9, so ordering by `sort_order` does not put `outro` last for that key. For Document.doc_type, Project.status_text and Task.status, `outro` has the highest sort order. `seeds/0001_seed.sql`, `seeds/0003_event_type_taxonomy.sql`, `seeds/0002_ontology_status_task.sql`.
- Two keys seeded as temporal have `requires_valid_from = false` (Person.email, Person.phone, Organization.website), as does link type `delivered_to`. Other temporal keys and link types have `requires_valid_from = true`. `seeds/0001_seed.sql`.
