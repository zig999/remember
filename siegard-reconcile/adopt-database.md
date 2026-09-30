---
contract_version: siegard-reconcile/8
title: Adoption of the migrations target (7 SQL files) against the knowledge-base and chat specification
summary: 'The source is adopted as it stands: no delivery wrote these 7 files and none of them changed
  for this reconciliation. /analyse wrote the database nodes from material read from this source alone
  (siegard-survey/adopt-database), and the owner names the applied schema and seeds as the behavior being
  adopted; the judgment reads whether the specification holds it, not whether the schema is right.'
target: database
files:
- path: 0001_init.sql
  change: 'Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read.'
- path: 0004_chat_persistence.sql
  change: 'Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read.'
- path: 0005_chat_graph_view.sql
  change: 'Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read.'
- path: 0006_original_input.sql
  change: 'Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read.'
- path: seeds/0001_seed.sql
  change: 'Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read.'
- path: seeds/0002_ontology_status_task.sql
  change: 'Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read.'
- path: seeds/0003_event_type_taxonomy.sql
  change: 'Nothing changed: the file is adopted as it stands, and its behavior is the one the survey read.'
nodes:
- node: domain/chat/conversation
  conforms: false
  how: '0004_chat_persistence.sql, column summary_rolling of CREATE TABLE chat_conversation, line 52:
    summary_rolling text        NULL, — The node names this attribute `rolling_summary`; the table spells
    it `summary_rolling`. The two names for one fact now live apart, so a reader who searches the code
    for the node''s attribute finds nothing, and a change to the node''s name never reaches this column.'
  observed_at:
  - 0004_chat_persistence.sql
- node: domain/chat/graph-view
  conforms: true
  how: '0005_chat_graph_view.sql: held at the CREATE TABLE chat_graph_view statement, which declares the
    graph view''s shape. — snapshot        jsonb       NOT NULL, updated_at      timestamptz NOT NULL
    DEFAULT now()'
  encoded_at:
  - 0005_chat_graph_view.sql
- node: domain/chat/message
  conforms: true
  how: '0004_chat_persistence.sql: held at CREATE TABLE chat_message (lines 95-109) — role            chat_message_role  NOT
    NULL, content         jsonb              NOT NULL, stop_reason     text               NULL, idempotency_key
    uuid               NULL, model           text               NULL, tokens_in       int                NULL,
    tokens_out      int                NULL, latency_ms      int                NULL'
  encoded_at:
  - 0004_chat_persistence.sql
- node: domain/chat/message-role
  conforms: true
  how: '0004_chat_persistence.sql: held at CREATE TYPE chat_message_role, line 33 — CREATE TYPE chat_message_role
    AS ENUM (''user'', ''assistant'');'
  encoded_at:
  - 0004_chat_persistence.sql
- node: domain/chat/tool-call
  conforms: true
  how: '0004_chat_persistence.sql: held at CREATE TABLE chat_tool_call (lines 146-157) — tool_name       text        NOT
    NULL, arguments       jsonb       NOT NULL, result          jsonb       NULL, is_error        boolean     NOT
    NULL DEFAULT false, error_message   text        NULL, duration_ms     int         NOT NULL, message_id      uuid        NULL
    REFERENCES chat_message(id) ON DELETE SET NULL'
  encoded_at:
  - 0004_chat_persistence.sql
- node: domain/knowledge-base/alias-kind
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE alias_kind, line 137 — CREATE TYPE alias_kind AS ENUM (''canonical'',
    ''alias'');'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/allowed-value
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE attribute_valid_value, lines 210-219 — value            text
    NOT NULL, label            text, sort_order       int, description      text,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/assertion-status
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE assertion_status, lines 134-135 — CREATE TYPE assertion_status
    AS ENUM (''active'', ''uncertain'', ''disputed'', ''superseded'', ''deleted'');'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/attribute-key
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE attribute_key, lines 189-201 — key                     text
    NOT NULL, value_type              attribute_value_type NOT NULL, is_temporal             boolean NOT
    NULL, allows_multiple_current boolean NOT NULL, requires_valid_from     boolean NOT NULL,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE compliance_deletion, lines 518-524 — raw_information_id uuid
    NOT NULL REFERENCES raw_information (id), reason             text NOT NULL, executed_at        timestamptz
    NOT NULL DEFAULT now(), affected           jsonb NOT NULL DEFAULT ''{}''::jsonb'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/curation-action
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE curation_action, lines 505-513 — action      text NOT NULL,
    target_kind text NOT NULL, target_id   uuid, payload     jsonb NOT NULL DEFAULT ''{}''::jsonb, reason      text,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/effective-status
  conforms: true
  how: '0001_init.sql: held at the effective_status CASE in knowledge_link_resolved (lines 540-545) and
    node_attribute_resolved (lines 558-563) — CASE WHEN na.status = ''active'' AND na.valid_to IS NOT
    NULL AND na.valid_to <= current_date THEN ''inactive'' ELSE na.status::text END AS effective_status'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/entity-match-review
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE entity_match_review, lines 492-500 — node_id           uuid
    NOT NULL REFERENCES knowledge_node (id), candidate_node_id uuid NOT NULL REFERENCES knowledge_node
    (id), similarity        numeric NOT NULL CHECK (similarity >= 0 AND similarity <= 1),'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/fragment-status
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE fragment_status, lines 123-124 — CREATE TYPE fragment_status
    AS ENUM (''proposed'', ''accepted'', ''rejected'', ''superseded'', ''deleted'');'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/information-fragment
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE information_fragment, lines 299-309 — "text"        text NOT
    NULL CHECK (char_length("text") <= 1000), confidence    numeric NOT NULL CHECK (confidence >= 0 AND
    confidence <= 1), status        fragment_status NOT NULL DEFAULT ''proposed'', superseded_at timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE knowledge_link, lines 429-451, with provenance at lines 468-476
    — source_node_id     uuid NOT NULL REFERENCES knowledge_node (id), target_node_id     uuid NOT NULL
    REFERENCES knowledge_node (id), link_type_id       uuid NOT NULL REFERENCES link_type (id), supersedes_link_id
    uuid REFERENCES knowledge_link (id),'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/knowledge-node
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE knowledge_node, lines 328-342 — canonical_name      text NOT
    NULL, status              node_status NOT NULL DEFAULT ''active'', merged_into_node_id uuid REFERENCES
    knowledge_node (id),'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/link-type
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE link_type, lines 159-170 — name                        text
    NOT NULL UNIQUE, label                       text NOT NULL, inverse_name                text NOT NULL,
    requires_valid_to_on_change boolean NOT NULL,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/link-type-rule
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE link_type_rule, lines 173-182 — source_node_type_id uuid NOT
    NULL REFERENCES node_type (id), target_node_type_id uuid NOT NULL REFERENCES node_type (id), valid_from          date,
    valid_to            date,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/llm-run
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE llm_run, lines 268-280 — model                    text NOT
    NULL, prompt_version           text NOT NULL, status                   llm_run_status NOT NULL DEFAULT
    ''running'', attempts                 int NOT NULL DEFAULT 1 CHECK (attempts >= 1), idempotency_key          text
    NOT NULL UNIQUE,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-alias
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE node_alias, lines 352-361 — alias             text NOT NULL
    CHECK (btrim(alias) <> ''''), kind              alias_kind NOT NULL DEFAULT ''alias'', created_by_run_id
    uuid REFERENCES llm_run (id),'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE node_attribute, lines 376-407 — value                   text
    NOT NULL, status                  assertion_status NOT NULL, valid_from_source       valid_from_source,
    supersedes_attribute_id uuid REFERENCES node_attribute (id),'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-status
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE node_status, lines 129-130 — CREATE TYPE node_status AS ENUM
    (''active'', ''needs_review'', ''merged'', ''deleted'');'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-type
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE node_type, lines 152-157 — name        text NOT NULL UNIQUE,
    description text NOT NULL,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/provenance
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE provenance, lines 468-476 — fragment_id  uuid NOT NULL REFERENCES
    information_fragment (id), created_at   timestamptz NOT NULL DEFAULT now(), CONSTRAINT provenance_target_ck
    CHECK (num_nonnulls(link_id, attribute_id) = 1)'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/raw-chunk
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE raw_chunk, lines 243-258 — chunk_index        int  NOT NULL
    CHECK (chunk_index >= 0), offset_start       int  NOT NULL CHECK (offset_start >= 0), offset_end         int  NOT
    NULL, chunking_version   text NOT NULL DEFAULT ''v1'', superseded_at      timestamptz,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/raw-information
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE raw_information, lines 229-240 — source_type   source_type
    NOT NULL, content       text NOT NULL, content_hash  text NOT NULL UNIQUE received_at   timestamptz
    NOT NULL DEFAULT now(), superseded_at timestamptz

    0006_original_input.sql: held at Line 16, the ALTER TABLE statement adding the original_input column
    to raw_information. The column is nullable with no default, which matches the node''s optional string
    attribute. The file also declares no other attribute of this node. — ALTER TABLE raw_information ADD
    COLUMN original_input text;'
  encoded_at:
  - 0001_init.sql
  - 0006_original_input.sql
- node: domain/knowledge-base/run-status
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE llm_run_status, line 143 — CREATE TYPE llm_run_status AS ENUM
    (''running'', ''completed'', ''failed'');'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/source-type
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE source_type, lines 120-121 — CREATE TYPE source_type AS ENUM
    (''pdf'', ''email'', ''ata'', ''chat'', ''artigo'', ''transcricao'', ''outro'');'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/tool-call
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE tool_call, lines 284-292 — tool_name          text NOT NULL,
    arguments          jsonb NOT NULL, result             jsonb, validation_outcome validation_outcome
    NOT NULL, created_at         timestamptz NOT NULL DEFAULT now()'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE valid_from_source, line 139 — CREATE TYPE valid_from_source
    AS ENUM (''stated'', ''document'', ''received'');'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/validation-outcome
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE validation_outcome, lines 145-147 — (''accepted'', ''consolidated'',
    ''superseded_previous'', ''needs_review'', ''uncertain'', ''disputed'', ''rejected'', ''error'')'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/value-type
  conforms: true
  how: '0001_init.sql: held at CREATE TYPE attribute_value_type, line 141 — CREATE TYPE attribute_value_type
    AS ENUM (''date'', ''number'', ''text'', ''bool'');'
  encoded_at:
  - 0001_init.sql
- node: rules/chat/message-idempotency-key-unique
  conforms: true
  how: '0004_chat_persistence.sql: held at idx_chat_message_idempotency, lines 119-121 — CREATE UNIQUE
    INDEX idx_chat_message_idempotency ON chat_message (conversation_id, idempotency_key) WHERE idempotency_key
    IS NOT NULL;'
  encoded_at:
  - 0004_chat_persistence.sql
- node: rules/chat/tool-call-outlives-its-message
  conforms: true
  how: '0004_chat_persistence.sql: held at message_id column of chat_tool_call, line 149, together with
    the conversation_id foreign key, line 148 — conversation_id uuid        NOT NULL REFERENCES chat_conversation(id)
    ON DELETE CASCADE, message_id      uuid        NULL REFERENCES chat_message(id) ON DELETE SET NULL,'
  encoded_at:
  - 0004_chat_persistence.sql
- node: rules/knowledge-base/alias-not-blank
  conforms: false
  how: '0001_init.sql, node_alias.alias column CHECK, line 355: alias             text NOT NULL CHECK
    (btrim(alias) <> ''''), — btrim() without a character set trims only spaces. An alias made of a tab
    or a line break passes the CHECK, although the node forbids an alias that is empty once surrounding
    whitespace is trimmed. A blank alias is stored, and its normal form is a lone space.'
  observed_at:
  - 0001_init.sql
- node: rules/knowledge-base/alias-unique-per-node
  conforms: false
  how: '0001_init.sql, function norm(), line 97, feeding node_alias.alias_norm (line 356) and UNIQUE (node_id,
    alias_norm) (line 360): RETURN lower(immutable_unaccent(regexp_replace(btrim(t), ''\s+'', '' '', ''g'')));
    alias_norm        text NOT NULL GENERATED ALWAYS AS (norm(alias)) STORED, UNIQUE (node_id, alias_norm)
    Decision log, located at rules/knowledge-base/alias-unique-per-node.md: "The normalized form is the
    one name-normalization states, with every surrounding whitespace trimmed." — btrim(t) trims only spaces.
    A name with a leading or trailing tab or line break keeps a surrounding space after the collapse.
    "\tSilva" therefore normalizes to " silva", not "silva". Two aliases that differ only by surrounding
    whitespace get different normal forms, so the uniqueness guard does not stop the second one. Exact-match
    resolution also misses the name.'
  observed_at:
  - 0001_init.sql
- node: rules/knowledge-base/allowed-document-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 5, the five Document/doc_type rows of the valid_values VALUES
    list (lines 184-188) — (''Document'', ''doc_type'',   ''proposta'',  ''Proposta'',  1), (''Document'',
    ''doc_type'',   ''ata'',       ''Ata'',       2), (''Document'', ''doc_type'',   ''contrato'',  ''Contrato'',  3),
    (''Document'', ''doc_type'',   ''relatório'', ''Relatório'', 4), (''Document'', ''doc_type'',   ''outro'',     ''Outro'',     5)'
  encoded_at:
  - seeds/0001_seed.sql
- node: rules/knowledge-base/allowed-event-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 5, the four Event/event_type rows (lines 189-192). The node
    lists nine values. The five «cobrança», «decisão», «escalonamento», «bloqueio» and «marco» are not
    in this file. — (''Event'',    ''event_type'', ''reunião'',   ''Reunião'',   1), (''Event'',    ''event_type'',
    ''go-live'',   ''Go-live'',   2), (''Event'',    ''event_type'', ''workshop'',  ''Workshop'',  3),
    (''Event'',    ''event_type'', ''outro'',     ''Outro'',     4)

    seeds/0003_event_type_taxonomy.sql: held at the VALUES list of the INSERT, lines 39-45, holding the
    five values added to the four the original seed holds (reunião, go-live, workshop, outro). Values,
    labels and sort orders 5..9 all match the node. The original four rows are in seeds/0001_seed.sql,
    outside this file. — (''Event'', ''event_type'', ''cobrança'',      ''Cobrança/Follow-up'',   5),
    (''Event'', ''event_type'', ''decisão'',       ''Decisão'',              6), (''Event'', ''event_type'',
    ''escalonamento'', ''Escalonamento'',        7), (''Event'', ''event_type'', ''bloqueio'',      ''Bloqueio/Impedimento'',
    8), (''Event'', ''event_type'', ''marco'',         ''Marco/Entrega'',        9)'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0003_event_type_taxonomy.sql
- node: rules/knowledge-base/allowed-project-statuses
  conforms: true
  how: 'seeds/0002_ontology_status_task.sql: held at the valid_values VALUES block, A) Project.status_text,
    lines 88-95 — (''Project'', ''status_text'', ''planejado'',    ''Planejado'',    1), ... (''Project'',
    ''status_text'', ''em aprovação'', ''Em aprovação'', 2), (''aprovado'', 3), (''em andamento'', 4),
    (''pausado'', 5), (''concluído'', 6), (''cancelado'', 7), (''Project'', ''status_text'', ''outro'',        ''Outro'',        8)'
  encoded_at:
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/allowed-task-priorities
  conforms: true
  how: 'seeds/0002_ontology_status_task.sql: held at the valid_values VALUES block, C) Task.priority,
    lines 105-108 — (''Task'', ''priority'', ''baixa'',   ''Baixa'',   1), (''Task'', ''priority'', ''média'',   ''Média'',   2),
    (''Task'', ''priority'', ''alta'',    ''Alta'',    3), (''Task'', ''priority'', ''crítica'', ''Crítica'',
    4)'
  encoded_at:
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/allowed-task-statuses
  conforms: true
  how: 'seeds/0002_ontology_status_task.sql: held at the valid_values VALUES block, C) Task.status, lines
    97-103 — (''Task'', ''status'', ''a fazer'',      ''A fazer'',      1), (''Task'', ''status'', ''em
    andamento'', ''Em andamento'', 2), (''Task'', ''status'', ''bloqueada'',    ''Bloqueada'',    3),
    (''Task'', ''status'', ''em revisão'',   ''Em revisão'',   4), (''Task'', ''status'', ''concluída'',    ''Concluída'',    5),
    (''Task'', ''status'', ''cancelada'',    ''Cancelada'',    6), (''Task'', ''status'', ''outro'',        ''Outro'',        7)'
  encoded_at:
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/allowed-value-unique-per-key
  conforms: true
  how: '0001_init.sql: held at attribute_valid_value, line 218 — UNIQUE (attribute_key_id, value)

    seeds/0002_ontology_status_task.sql: held at the NOT EXISTS guard on the valid_values INSERT, lines
    111-114 — WHERE NOT EXISTS (SELECT 1 FROM attribute_valid_value x WHERE x.attribute_key_id = ak.id
    AND x.value = v.value)'
  encoded_at:
  - 0001_init.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/attribute-confidence-range
  conforms: true
  how: '0001_init.sql: held at node_attribute.confidence, line 391 — confidence              numeric NOT
    NULL CHECK (confidence >= 0 AND confidence <= 1),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/attribute-key-unique-per-node-type
  conforms: true
  how: '0001_init.sql: held at attribute_key, line 199 — UNIQUE (node_type_id, key),

    seeds/0002_ontology_status_task.sql: held at the ON CONFLICT clause of the C.3 INSERT, line 76 — ON
    CONFLICT (node_type_id, key) DO NOTHING;'
  encoded_at:
  - 0001_init.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/attribute-never-supersedes-itself
  conforms: true
  how: '0001_init.sql: held at node_attribute_no_self_supersede_ck, lines 405-406 — CHECK (supersedes_attribute_id
    IS DISTINCT FROM id)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  conforms: true
  how: '0001_init.sql: held at provenance_attr_fragment_uq, lines 484-485 — CREATE UNIQUE INDEX provenance_attr_fragment_uq
    ON provenance (attribute_id, fragment_id) WHERE attribute_id IS NOT NULL;'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/attribute-start-has-basis
  conforms: true
  how: '0001_init.sql: held at node_attribute_basis_ck, lines 403-404 — CHECK (valid_from IS NULL OR valid_from_source
    IS NOT NULL)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/attribute-validity-ordered
  conforms: true
  how: '0001_init.sql: held at node_attribute_interval_ck, lines 400-401 — CHECK (valid_from IS NULL OR
    valid_to IS NULL OR valid_from < valid_to)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/catalog-attribute-keys
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 4, the VALUES list of attribute_key (lines 138-171). Sixteen
    of the nineteen keys are present with the node''s value types; Task status, priority and due_date
    are not in this file. — (''Project'',      ''deadline'',    ''date'',   true,  false, true, ... (''Document'',     ''doc_type'',    ''text'',   false,
    false, false,

    seeds/0002_ontology_status_task.sql: held at the C.3 VALUES rows, lines 67-74, for Task status, priority
    and due_date only. The other sixteen keys are not in this file. — (''Task'', ''status'',   ''text'',
    true,  false, true, ...), (''Task'', ''priority'', ''text'', true,  false, true, ...), (''Task'',
    ''due_date'', ''date'', true,  false, true, ...)'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/catalog-link-type-rules
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 3, the VALUES list of link_type_rule with no valid_from or
    valid_to column (lines 88-119). It holds 28 pairs. The Task pairs of responsible_for and part_of are
    not in this file. — INSERT INTO link_type_rule (link_type_id, source_node_type_id, target_node_type_id)
    ... (''part_of'',             ''Event'',        ''Project''), ... (''concerns'',            ''Event'',        ''Project''),
    (''delivered_to'',        ''Document'',     ''Person''), (''sponsors'',            ''Organization'',
    ''Project'')

    seeds/0002_ontology_status_task.sql: held at the C.2 VALUES rows, lines 43-46, for the two Task pairs
    only. Both are inserted with no validity window. — (''part_of'',         ''Task'',   ''Project''),
    (''responsible_for'', ''Person'', ''Task'')'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/catalog-link-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 2, the VALUES list of link_type (lines 39-82). All thirteen
    names, labels and inverses match the node. — (''participates_in'', ''participa de'', ''has_participant'',
    ... (''sponsors'', ''patrocina'', ''sponsored_by'','
  encoded_at:
  - seeds/0001_seed.sql
- node: rules/knowledge-base/catalog-node-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 1, the VALUES list of node_type (lines 24-34). Nine of the
    ten types are present with the node''s descriptions; Task «Tarefa/atividade com responsável, prazo
    e ciclo de vida» is not in this file. — (''Document'',     ''Artefato referenciado no conteúdo (proposta,
    ata, contrato, relatório); não é a fonte ingerida'')

    seeds/0002_ontology_status_task.sql: held at the C.1 INSERT, lines 32-34, for the Task row only. The
    other nine types are not in this file. — INSERT INTO node_type (name, description) VALUES (''Task'',
    ''Tarefa/atividade com responsável, prazo e ciclo de vida'')'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/chunk-offsets-ordered
  conforms: true
  how: '0001_init.sql: held at raw_chunk, lines 248-249 and 256 — offset_start       int  NOT NULL CHECK
    (offset_start >= 0), CONSTRAINT raw_chunk_offsets_ck CHECK (offset_end > offset_start),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/chunk-position-unique
  conforms: true
  how: '0001_init.sql: held at raw_chunk, line 257 — UNIQUE (raw_information_id, chunking_version, chunk_index)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/closed-attribute-keys
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 5, valid_values rows exist only for Document/doc_type and
    Event/event_type (lines 184-192). Project/status_text and Task status and priority have no rows in
    this file. — (''Document'', ''doc_type'',   ''outro'',     ''Outro'',     5), (''Event'',    ''event_type'',
    ''outro'',     ''Outro'',     4)

    seeds/0002_ontology_status_task.sql: held at the valid_values VALUES block, lines 86-110, which covers
    Project.status_text, Task.status and Task.priority. doc_type and event_type are not in this file,
    and Task.due_date gets no row. — (''Project'', ''status_text'', ''planejado'', ...), (''Task'', ''status'',
    ''a fazer'', ...), (''Task'', ''priority'', ''baixa'', ...)'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/effective-status
  conforms: true
  how: '0001_init.sql: held at the effective_status CASE in both resolved views, lines 540-545 and 558-563
    — WHEN kl.status = ''active'' AND kl.valid_to IS NOT NULL AND kl.valid_to <= current_date THEN ''inactive''
    ELSE kl.status::text'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/end-on-change-link-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 2, the last flag column, requires_valid_to_on_change, of
    each link_type row (lines 39-81) — (''reports_to'', ''reporta a'', ''manages'', ''Subordinação direta
    entre pessoas (funcional: 1 chefe vigente)'', true,  false, true,  true), and part_of and located_in
    with the same flags; every other row ends in false'
  encoded_at:
  - seeds/0001_seed.sql
- node: rules/knowledge-base/fragment-confidence-range
  conforms: true
  how: '0001_init.sql: held at information_fragment.confidence, line 303 — confidence    numeric NOT NULL
    CHECK (confidence >= 0 AND confidence <= 1),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/in-effect-assertion
  conforms: true
  how: '0001_init.sql: held at the is_in_effect column in both resolved views, lines 538-539 and 556-557
    — (kl.valid_to IS NULL AND kl.superseded_at IS NULL AND (kl.valid_from IS NULL OR kl.valid_from <=
    current_date)) AS is_in_effect,'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/link-confidence-range
  conforms: true
  how: '0001_init.sql: held at knowledge_link.confidence, line 439 — confidence         numeric NOT NULL
    CHECK (confidence >= 0 AND confidence <= 1),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/link-never-supersedes-itself
  conforms: true
  how: '0001_init.sql: held at knowledge_link_no_self_supersede_ck, lines 449-450 — CHECK (supersedes_link_id
    IS DISTINCT FROM id)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/link-provenance-once-per-fragment
  conforms: true
  how: '0001_init.sql: held at provenance_link_fragment_uq, lines 482-483 — CREATE UNIQUE INDEX provenance_link_fragment_uq
    ON provenance (link_id, fragment_id) WHERE link_id IS NOT NULL;'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/link-start-has-basis
  conforms: true
  how: '0001_init.sql: held at knowledge_link_basis_ck, lines 447-448 — CHECK (valid_from IS NULL OR valid_from_source
    IS NOT NULL)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/link-type-name-unique
  conforms: true
  how: '0001_init.sql: held at link_type.name, line 161 — name                        text NOT NULL UNIQUE,'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/link-type-rule-window-ordered
  conforms: true
  how: '0001_init.sql: held at link_type_rule_interval_ck, lines 180-181 — CHECK (valid_from IS NULL OR
    valid_to IS NULL OR valid_from < valid_to)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/link-validity-ordered
  conforms: true
  how: '0001_init.sql: held at knowledge_link_interval_ck, lines 445-446 — CHECK (valid_from IS NULL OR
    valid_to IS NULL OR valid_from < valid_to),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/match-review-distinct-nodes
  conforms: true
  how: '0001_init.sql: held at entity_match_review_distinct_ck, line 499 — CONSTRAINT entity_match_review_distinct_ck
    CHECK (node_id <> candidate_node_id)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/match-review-pair-unique
  conforms: true
  how: '0001_init.sql: held at entity_match_review, line 498 — UNIQUE (node_id, candidate_node_id),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/match-review-similarity-range
  conforms: true
  how: '0001_init.sql: held at entity_match_review.similarity, line 496 — similarity        numeric NOT
    NULL CHECK (similarity >= 0 AND similarity <= 1),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/merged-node-names-survivor
  conforms: true
  how: '0001_init.sql: held at knowledge_node_merged_ck, lines 338-339 — CHECK ((status = ''merged'')
    = (merged_into_node_id IS NOT NULL)),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/multi-current-attribute-keys
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 4, the multi column of the attribute_key VALUES list (lines
    138-171) — (''Person'',       ''email'',       ''text'',   true,  true,  false, and (''Person'',       ''phone'',       ''text'',   true,  true,  false,
    are the only rows with true in the multi position

    seeds/0002_ontology_status_task.sql: held at the allows_multiple_current column of the C.3 rows, lines
    68-73. All three Task keys carry false, so none joins email and phone of Person. — (''Task'', ''status'',   ''text'',
    true,  false, true, ...), (''Task'', ''priority'', ''text'', true,  false, true, ...), (''Task'',
    ''due_date'', ''date'', true,  false, true, ...)'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/node-never-merged-into-itself
  conforms: true
  how: '0001_init.sql: held at knowledge_node_no_self_merge_ck, lines 340-341 — CHECK (merged_into_node_id
    IS DISTINCT FROM id)'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/node-type-name-unique
  conforms: true
  how: '0001_init.sql: held at node_type.name, line 154 — name        text NOT NULL UNIQUE,

    seeds/0002_ontology_status_task.sql: held at the ON CONFLICT clause of the C.1 INSERT, line 34 — ON
    CONFLICT (name) DO NOTHING;'
  encoded_at:
  - 0001_init.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/one-canonical-alias
  conforms: true
  how: '0001_init.sql: held at node_alias_one_canonical_uq, lines 372-373 — CREATE UNIQUE INDEX node_alias_one_canonical_uq
    ON node_alias (node_id) WHERE kind = ''canonical'';'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/run-finish-time-when-closed
  conforms: true
  how: '0001_init.sql: held at llm_run_finished_ck, lines 278-279 — CHECK ((status = ''running'') = (finished_at
    IS NULL))'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/run-opens-with-one-attempt
  conforms: true
  how: '0001_init.sql: held at llm_run.attempts default, line 275 — attempts                 int NOT NULL
    DEFAULT 1 CHECK (attempts >= 1),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/run-start-is-opening-time
  conforms: true
  how: '0001_init.sql: held at llm_run.started_at default, line 272 — started_at               timestamptz
    NOT NULL DEFAULT now(),'
  encoded_at:
  - 0001_init.sql
- node: rules/knowledge-base/single-current-link-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 2, the allows_multiple_current column of each link_type row
    (lines 39-81) — (''reports_to'', ... true,  false, true,  true), (''part_of'', ... true,  false, true,  true),
    (''located_in'', ... true,  false, true,  true); every other row has true in the second flag position'
  encoded_at:
  - seeds/0001_seed.sql
- node: rules/knowledge-base/source-status-active-or-deleted
  conforms: false
  how: '0001_init.sql, node_status enum (lines 126-130) used by raw_information.status (line 238) and
    raw_chunk.status (line 252), with the comment on lines 49-51: CREATE TYPE node_status AS ENUM (''active'',
    ''needs_review'', ''merged'', ''deleted''); status        node_status NOT NULL DEFAULT ''active'',
    -- tombstone (decisão 8) "Sem CHECK adicional: a aplicação é o gatekeeper (BR-12)." — The source status
    being only active or deleted appears in this file only as a comment. The column admits needs_review
    and merged, which the node denies. I found no code that restricts it, so the restriction exists only
    in prose.

    no file of the set holds this fact beside what was found against it'
  observed_at:
  - 0001_init.sql
- node: rules/knowledge-base/start-requiring-attribute-keys
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 4, the req_vf column of the attribute_key VALUES list (lines
    138-171) — (''Project'',      ''deadline'',    ''date'',   true,  false, true, ... (''Event'',        ''end_date'',    ''date'',   true,  false,
    true, ...; email, phone and website carry false in the req_vf position

    seeds/0002_ontology_status_task.sql: held at the requires_valid_from column of the C.3 rows, lines
    68-73. All three Task keys are temporal and carry true. — (''Task'', ''status'',   ''text'', true,  false,
    true, ...), (''Task'', ''priority'', ''text'', true,  false, true, ...), (''Task'', ''due_date'',
    ''date'', true,  false, true, ...)'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/start-requiring-link-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 2, the requires_valid_from column of each link_type row (lines
    39-81) — (''delivered_to'', ''entregue a'', ''recipient_of'', ''Documento entregue a uma pessoa'',
    true,  true,  false, false), while the other temporal rows, for example (''sponsors'', ... true,  true,  true,  false),
    carry true in the third flag position'
  encoded_at:
  - seeds/0001_seed.sql
- node: rules/knowledge-base/temporal-attribute-keys
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 4, the is_temporal column of the attribute_key VALUES list
    (lines 138-171). Task status, priority and due_date are not in this file. — (''Organization'', ''website'',     ''text'',   true,  false,
    false, and (''Event'',        ''event_type'',  ''text'',   false, false, false, are examples of true
    and false in the is_temporal position

    seeds/0002_ontology_status_task.sql: held at the is_temporal column of the C.3 rows, lines 68-73,
    for the three Task keys — (''Task'', ''status'',   ''text'', true,  false, true, ...), (''Task'',
    ''priority'', ''text'', true,  false, true, ...), (''Task'', ''due_date'', ''date'', true,  false,
    true, ...)'
  encoded_at:
  - seeds/0001_seed.sql
  - seeds/0002_ontology_status_task.sql
- node: rules/knowledge-base/temporal-link-types
  conforms: true
  how: 'seeds/0001_seed.sql: held at section 2, the is_temporal column of each link_type row (lines 39-81)
    — (''belongs_to_category'', ... false, true,  false, false), (''related_to'', ... false, true,  false,
    false), (''concerns'', ... false, true,  false, false); every other row starts its flags with true'
  encoded_at:
  - seeds/0001_seed.sql
unstated:
- file: 0001_init.sql
  where: CREATE TABLE attribute_key, column version (line 198)
  evidence: version                 int NOT NULL DEFAULT 1,
  cost: The attribute-key node lists no version, so the catalog versioning lives only in the DDL.
- file: 0001_init.sql
  where: CREATE TABLE attribute_valid_value, column version (line 217)
  evidence: version          int  NOT NULL DEFAULT 1,
  cost: The allowed-value node lists value, label, sort_order and description, and no version. The catalog
    versioning lives only in the DDL.
- file: 0001_init.sql
  where: CREATE TABLE link_type, column version (line 169)
  evidence: version                     int NOT NULL DEFAULT 1
  cost: Same as node_type. The link-type node lists no version, so the catalog versioning lives only in
    the DDL.
- file: 0001_init.sql
  where: CREATE TABLE node_type, column version (line 156)
  evidence: version     int  NOT NULL DEFAULT 1
  cost: A per-row version number on catalog rows is a domain fact in the schema alone. The node-type node
    lists only name and description. The next reader looks in the specification for what the number means
    and does not find it.
- file: 0001_init.sql
  where: curation_action.reason comment, line 511
  evidence: reason      text,                 -- obrigatório em ações destrutivas (validação do backend)
  cost: The rule that a reason is required on destructive curation actions is stated only here. The curation-action
    node declares reason as optional and no rule requires it. The DDL comment is the only place a reader
    finds it.
- file: 0001_init.sql
  where: the comment on knowledge_node lines 336-337 and the header line 57
  evidence: '"apontar para nó ATIVO é invariante de aplicação (compressão de caminho, §4.4)" and "merged_into_node_id
    sempre aponta para nó ATIVO (compressão de caminho na escrita, §4.4)"'
  cost: That a merged node must point at an active survivor, with path compression on write, is a domain
    rule the source states. No node in the specification holds it. The specification has only "names the
    survivor exactly when merged" and "never merged into itself". The rule lives where a reader of the
    specification will not look.
- file: 0004_chat_persistence.sql
  where: column created_at of CREATE TABLE chat_message, line 108
  evidence: created_at      timestamptz        NOT NULL DEFAULT now()
  cost: A message's creation time is declared and required here, and the chronological index depends on
    it (idx_chat_message_conversation_created_at). domain/chat/message lists no such attribute. The attribute
    that orders a conversation's turns is held only in SQL.
- file: 0004_chat_persistence.sql
  where: column created_at of CREATE TABLE chat_tool_call, line 156
  evidence: created_at      timestamptz NOT NULL DEFAULT now()
  cost: A chat tool call's creation time is declared and required here. domain/chat/tool-call lists no
    such attribute, so the time a tool call was recorded exists only in the table.
- file: 0004_chat_persistence.sql
  where: comment on chat_message.idempotency_key, line 103 (and lines 86-89)
  evidence: 'idempotency_key uuid               NULL,  -- BR-26: non-null on user rows; null on assistant
    rows.'
  cost: The rule that a user message always carries an idempotency key and an assistant message never
    does is stated only in a comment; the column allows NULL for every row. The node rules/chat/message-idempotency-key-unique
    says only that a conversation holds at most one message per key. The rule about which role carries
    a key has no home in the specification.
- file: 0004_chat_persistence.sql
  where: comment on chat_message.stop_reason, lines 100-102
  evidence: '-- One of: end_turn|max_tokens|stop_sequence -- |max_iterations|turn_timeout|cancelled --
    |provider_error|internal_error  (assistant rows only)'
  cost: The closed vocabulary of reasons a turn stopped, and the rule that only assistant rows carry one,
    is stated only in a comment. The column is plain text with no check, and domain/chat/message types
    stop_reason as a bare string. The vocabulary is a business fact that nobody can find in the specification.
- file: 0004_chat_persistence.sql
  where: comment on chat_tool_call.tool_name, line 138
  evidence: --   - `tool_name`   one of the 13 names of the `query` toolset (BR-05).
  cost: The restriction of a chat tool call's tool name to the thirteen query tools is stated only in
    a comment. The column is unconstrained text, and domain/chat/tool-call types tool_name as a bare string.
    A reader cannot learn from the specification which tools a chat turn may call.
- file: 0004_chat_persistence.sql
  where: header comment on chat_conversation.title, lines 40-41
  evidence: '`title`            NULL until set by the Owner OR by the title-distillation job (BR-34);
    length 1..200 enforced at the BFF (Zod ChatTurnRequest mirror).'
  cost: A conversation title limited to 1..200 characters is a domain rule. It appears only in this comment,
    which points to an enforcement in the BFF. No node holds it (domain/chat/conversation types title
    as a bare string), and no constraint in this file holds it. The next reader looks for the title's
    limits in the specification, finds none, and cannot tell whether the BFF or the specification is the
    authority.
- file: 0006_original_input.sql
  where: Line 17-18, the COMMENT ON COLUMN raw_information.original_input statement (text stored in the
    database catalog).
  evidence: COMMENT ON COLUMN raw_information.original_input IS 'Verbatim do turno de usuario que disparou
    uma ingestao dirigida (chat). Null fora do chat. Coberto por compliance_delete.';
  cost: The statement says the column is null outside chat. The specification does not say that. The raw-information
    node only lists original_input as an optional string. The candidate rule directed-turn-is-original-input
    only says a directed ingestion made from a chat turn records the turn's excerpt there. Nothing says
    original_input stays empty for other sources. A reader of the catalog takes this for a decided rule,
    and the next reader looks for it in the specification and does not find it.
- file: seeds/0001_seed.sql
  where: section 2, the description column of the 13 link_type rows (lines 43-81)
  evidence: '''Pessoa participa de projeto ou evento'' / ''Subordinação direta entre pessoas (funcional:
    1 chefe vigente)'' / ''Composição: org⊂org, projeto⊂projeto, evento⊂projeto (funcional)'' / ''Documento
    ou evento trata de / tem como assunto (aboutness estável)'''
  cost: Each link type's required description is catalog text that only this seed holds. The catalog node
    states label and inverse and stops there, so a reader who looks in the specification finds no description.
    Some of it restates permitted pairs in prose that has already drifted from the rule node. The part_of
    description names org, projeto and evento as sources, but the rule node also permits Task to Project.
    The node moving would never reach this text.
- file: seeds/0001_seed.sql
  where: section 4, the description column of the 16 attribute_key rows (lines 139-170)
  evidence: '''Data-limite/go-live vigente do projeto (funcional)'' / ''Situação textual corrente do projeto
    (funcional)'' / ''Tipo do evento (reunião/workshop/go-live)'' / ''CNPJ (estável; typo corrige-se via
    6.5-B, sem fingir mudança no mundo)'' / ''Tipo do documento (proposta/ata/contrato…) — domínio fechado
    em valid_values'''
  cost: Attribute key descriptions, including remarks on stability and on how corrections are made, live
    only in this seed. No node holds them. The event_type description lists three values while the allowed-values
    node lists nine, so the seed text and the specification already disagree in words nobody governs.
- file: seeds/0002_ontology_status_task.sql
  where: C.3 AttributeKeys VALUES, the description column of the three Task rows, lines 68-73
  evidence: '''Situação corrente da tarefa (funcional) — domínio fechado em valid_values'' ''Prioridade
    corrente da tarefa (funcional) — domínio fechado em valid_values'' ''Prazo/entrega vigente da tarefa
    (funcional)'''
  cost: These are catalog values written into attribute_key.description, which the catalog may show or
    send to the extraction model. The node holds each key and its value type but no description for any
    attribute key, so this wording lives only in the seed. The next reader looks for it in the specification
    and does not find it.
restates:
- file: 0001_init.sql
  where: the comment before node_alias_one_canonical_uq, line 371
  evidence: '"-- guarda de sanidade: um único alias canônico por nó (espelho de canonical_name)" The index
    that holds it: CREATE UNIQUE INDEX node_alias_one_canonical_uq ON node_alias (node_id) WHERE kind
    = ''canonical'';'
  cost: The one-canonical-alias rule is restated in prose next to the index that enforces it.
  node: rules/knowledge-base/one-canonical-alias
- file: 0001_init.sql
  where: the comment before provenance_attr_fragment_uq, line 481
  evidence: '"-- guarda de sanidade: o mesmo fragmento não justifica o mesmo item duas vezes" Held by:
    CREATE UNIQUE INDEX provenance_attr_fragment_uq ON provenance (attribute_id, fragment_id) WHERE attribute_id
    IS NOT NULL;'
  cost: The once-per-fragment rule for attributes is restated in prose beside the unique index that holds
    it.
  node: rules/knowledge-base/attribute-provenance-once-per-fragment
- file: 0001_init.sql
  where: the comment before provenance_attr_fragment_uq, line 481, read for links
  evidence: '"-- guarda de sanidade: o mesmo fragmento não justifica o mesmo item duas vezes" Held by:
    CREATE UNIQUE INDEX provenance_link_fragment_uq ON provenance (link_id, fragment_id) WHERE link_id
    IS NOT NULL;'
  cost: The once-per-fragment rule for links is restated in the same prose. The comment is a second home
    for two nodes.
  node: rules/knowledge-base/link-provenance-once-per-fragment
- file: 0001_init.sql
  where: the comment on assertion_status (lines 132-133) and the views banner (lines 529-530)
  evidence: '"''inactive'' NUNCA é gravado — é derivado em leitura (effective_status, §5.4 / A9)." and
    "is_current / is_in_effect / effective_status DERIVADOS, nunca armazenados." The views hold it in
    code: WHEN kl.status = ''active'' AND kl.valid_to IS NOT NULL AND kl.valid_to <= current_date THEN
    ''inactive'''
  cost: The derivation rule is narrated in comments beside the views that implement it. A change to the
    rule has a second copy in prose to keep in step.
  node: rules/knowledge-base/effective-status
- file: 0001_init.sql
  where: the comment on knowledge_node lines 336-337, and the header line 57
  evidence: '"preenchido SSE status = ''merged'' (§3.3); apontar para nó ATIVO é invariante de aplicação
    (compressão de caminho, §4.4)" The CHECK that holds the first half: CONSTRAINT knowledge_node_merged_ck
    CHECK ((status = ''merged'') = (merged_into_node_id IS NOT NULL))'
  cost: The "exactly when merged" half is prose beside a CHECK that already holds it. The prose is a second
    home for the rule.
  node: rules/knowledge-base/merged-node-names-survivor
- file: 0001_init.sql
  where: the comment on node_attribute_basis_ck, line 402
  evidence: '"-- data sem justificativa não existe (A14)" Held by: CHECK (valid_from IS NULL OR valid_from_source
    IS NOT NULL)'
  cost: The basis rule is restated in prose beside the CHECK that holds it.
  node: rules/knowledge-base/attribute-start-has-basis
- file: 0001_init.sql
  where: the comment on node_attribute_interval_ck, line 399
  evidence: '"-- intervalo semiaberto [from, to) ⇒ estritamente crescente (§5.2/§13.3)" Held by: CHECK
    (valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to)'
  cost: The ordering rule is restated in prose beside the CHECK that holds it.
  node: rules/knowledge-base/attribute-validity-ordered
- file: 0001_init.sql
  where: the header comment lines 58-60 and the comment on raw_information lines 226-228
  evidence: '"reject_item / compliance_delete devem gravar superseded_at = now() ao marcar status = ''deleted''"
    and "compliance_delete (§11), que redige `content` preservando `content_hash` e grava status = ''deleted''
    + superseded_at = now()". Code holds the same fact outside this file, in backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts:
    "SET status        = ''deleted''," followed by "superseded_at = now()".'
  cost: The tombstone rule is written in prose in the DDL header. Someone changing the node would not
    find this copy, and the prose would keep saying the old rule.
  node: rules/knowledge-base/compliance-deletion-tombstones
- file: seeds/0002_ontology_status_task.sql
  where: comment above C.3 AttributeKeys, lines 58-60
  evidence: '--   status / priority: text, temporal, funcional, exige valid_from -> FECHADOS --   due_date:
    date, temporal, funcional -> ABERTO (espelha Project.deadline)'
  cost: The temporal classification of the Task keys is written a second time as prose. The VALUES rows
    (is_temporal true, requires_valid_from true) hold it in this file. A reader may take the comment as
    the decision and edit it instead of the node.
  node: rules/knowledge-base/temporal-attribute-keys
- file: seeds/0002_ontology_status_task.sql
  where: header comment, line 23-24 (the "Totais após aplicar" line), the AttributeKey count
  evidence: --   16->19 AttributeKeys, 9->28 valid_values.
  cost: The attribute-key total of nineteen is stated again in prose. The rows are in this file and in
    seeds/0001_seed.sql. If the catalog changes, the comment disagrees with the node and no bind reaches
    it.
  node: rules/knowledge-base/catalog-attribute-keys
- file: seeds/0002_ontology_status_task.sql
  where: header comment, line 23-24 (the "Totais após aplicar" line), the NodeType count
  evidence: '-- Totais após aplicar: 9->10 NodeTypes, 28->30 LinkTypeRules,'
  cost: The node-type total is stated a second time in a comment. The running rows are in this file and
    in seeds/0001_seed.sql. If the catalog gains or loses a node type, this number goes stale and nothing
    flags it, because it is not bound to the node.
  node: rules/knowledge-base/catalog-node-types
- file: seeds/0003_event_type_taxonomy.sql
  where: header comment, lines 6-10 and 26-30 (the "+5 valid_values" list, the original four values, the
    sort_order note and the totals)
  evidence: '"--   +5 valid_values em Event.event_type (mantém o domínio FECHADO): --     cobrança, decisão,
    escalonamento, bloqueio, marco" and "-- NOTA (sort_order): os novos valores entram em 5..9; o `outro`
    original --    permanece em 4."'
  cost: The event_type value list, its closed domain and its ordering are stated a second time in prose
    beside the VALUES rows that hold them. If the node moves, the comment keeps saying the old list and
    nothing flags it, because the comment is not bound to the node. The rows in this file and the original
    four rows in seeds/0001_seed.sql are what run.
  node: rules/knowledge-base/allowed-event-types
adopted: true
outside:
- backup/README.md
- backup/dump-schema.sh
- backup/schema.sql
- ops/truncate_ingested_data.sql
- ops/truncate_ontology.sql
unheld:
- node: domain/knowledge-base/accepted-fragment-filter
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/assertion-flag
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/change-hint
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/directed-ingestion
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/directed-item
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/directed-item-kind
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/directed-item-status
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/ingest-tool
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/item-kind
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/node-resolution
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/page
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/prompt-version
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/proposal
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/run-summary
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/search-item
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/search-layer
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/search-query
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/compliance-deletion-tombstones
  how: 'read on 7 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 7 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-database.returns/.

  Staged as an adoption of source no delivery wrote: 102 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact; 5 file(s) were kept outside the
  judgment, listed under `outside`.

  Candidates: 3 opened across 2 of 7 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 16 fact(s) the source states that no node holds, over 5 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.

  Restates: 12 place(s) where text in the source restates a node''s fact the code holds, over 3 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-database.returns/`, which are the evidence behind every entry above.
