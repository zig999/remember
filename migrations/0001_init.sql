-- ============================================================================
-- 0001_init.sql — Remember (spec v7 + docs/specs, 2026-06-12)
-- PostgreSQL 17 (Neon) — migração ÚNICA de bootstrap: extensões, configs de
-- full-text, funções, tipos, tabelas, índices, views, triggers E o catálogo
-- seed obrigatório (§15). Um banco vazio + este arquivo = projeto pronto.
--
-- Consolida e SUBSTITUI as migrações anteriores:
--   0001_schema.sql (schema, escrita contra a v6 — a v7 preserva o schema),
--   0002_seed.sql   (catálogo §15 — idêntico na v7; validado item a item),
--   0003_compliance_status.sql (parcial — só cobria raw_information; as
--     colunas de tombstone exigidas pelas specs atuais estão TODAS aqui).
--
-- Fontes: remember-modelagem-v7.md (normativa) +
--         docs/specs/domains/*/ (specs atuais — em particular
--         compliance-audit §2 "Tables mutated by status transition").
--
-- DECISÕES DE DDL (pontos que a spec deixa ao implementador):
--  1. Enums nativos (não CHECK em text): vocabulários fechados pela spec;
--     adicionar valor futuro = ALTER TYPE ... ADD VALUE em migração.
--  2. `RawChunk.index` renomeado para `chunk_index` (INDEX é keyword; evita
--     atrito com query builders). Demais nomes seguem a spec.
--  3. `node_attribute.value_type` é DENORMALIZADO de attribute_key via FK
--     composta (attribute_key_id, value_type) → attribute_key(id, value_type).
--     Necessário porque coluna gerada não pode consultar outra tabela
--     (value_date/value_number, §3.3). A FK composta garante consistência.
--  4. Funções IMMUTABLE de apoio (norm, immutable_unaccent, canonical_date,
--     canonical_number): wrappers exigidos por colunas geradas/índices de
--     expressão. canonical_* presume serialização canônica (ISO YYYY-MM-DD,
--     decimal com ponto) — garantida pela validação estrutural (§13.1).
--  5. O índice composto (node_type_id, alias_norm) da §4.2 é realizado por
--     JOIN (btree em node_alias.alias_norm + FK indexada em knowledge_node):
--     node_alias não carrega node_type_id (§3.3). À escala da §16, equivale.
--  6. Exclusion constraint GiST de não-sobreposição (§5.2, "onde fizer
--     sentido") NÃO criada: a guarda funcional é transacional por decisão
--     (A11/A19), e multi-valor sobrepõe legitimamente.
--  7. Guardas de sanidade além da spec (inofensivas): UNIQUE parcial em
--     provenance (mesmo fragmento não justifica 2x o mesmo item), 1 alias
--     canônico por nó, CHECKs de auto-referência.
--  8. TOMBSTONE DE COMPLIANCE (§11; compliance-audit.back.md §2, UC-01 passo 6):
--     `raw_information` e `raw_chunk` carregam `status node_status` (reuso do
--     enum, conforme spec: "cast to node_status") + `superseded_at`;
--     `information_fragment` carrega `superseded_at` (o `status` já existia
--     como fragment_status). DEFAULT 'active' = toda linha nasce ativa. Sem
--     CHECK adicional: a aplicação é o gatekeeper (BR-12). O índice FTS de
--     raw_chunk é PARCIAL (WHERE superseded_at IS NULL) — espelha o padrão do
--     índice parcial de information_fragment e exprime, no nível do índice,
--     que conteúdo tombstonado está fora da recuperação (§11, §7.2).
--
-- INVARIANTES DE APLICAÇÃO (não exprimíveis em DDL — backend garante):
--  - Sucessão funcional (1 vigente por (node,key)/(source,link_type)) via
--    SELECT ... FOR UPDATE (A11); criação de entidade sob advisory lock (§4.5).
--  - merged_into_node_id sempre aponta para nó ATIVO (compressão de caminho
--    na escrita, §4.4).
--  - reject_item / compliance_delete devem gravar superseded_at = now() ao
--    marcar status = 'deleted' — caso contrário a linha continuaria presa na
--    guarda de duplicata parcial e em is_current (§5.4, §6.4).
--  - Cadeia de justificativa de datas (A14) e faixas de confiança (A13).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Extensões (A2, A3)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- 2. Configurações de full-text, nomeadas e versionadas (§7.1)
-- ----------------------------------------------------------------------------
-- prosa (chunks, fragmentos): stemming pt + sem acento
CREATE TEXT SEARCH CONFIGURATION pt_unaccent_v1 (COPY = portuguese);
ALTER TEXT SEARCH CONFIGURATION pt_unaccent_v1
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, portuguese_stem;

-- nomes de entidade: sem stemming ("Silva" não é flexão de "silvar"), só unaccent
CREATE TEXT SEARCH CONFIGURATION simple_unaccent_v1 (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION simple_unaccent_v1
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

-- ----------------------------------------------------------------------------
-- 3. Funções de apoio
-- ----------------------------------------------------------------------------
-- unaccent() é STABLE; wrapper IMMUTABLE é o padrão para uso em coluna gerada.
CREATE FUNCTION immutable_unaccent(t text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
RETURN unaccent('unaccent'::regdictionary, t);

-- norm(x) = lower(unaccent(espaços_colapsados(trim(x)))) — a ÚNICA política de
-- normalização do sistema (§4.1): resolução de entidade, alias_norm e FTS.
CREATE FUNCTION norm(t text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
RETURN lower(immutable_unaccent(regexp_replace(btrim(t), '\s+', ' ', 'g')));

-- Casts canônicos para colunas geradas (decisão 4 do cabeçalho).
CREATE FUNCTION canonical_date(v text) RETURNS date
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
RETURN v::date;

CREATE FUNCTION canonical_number(v text) RETURNS numeric
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
RETURN v::numeric;

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Tipos enum
-- ----------------------------------------------------------------------------
CREATE TYPE source_type AS ENUM
  ('pdf', 'email', 'ata', 'chat', 'artigo', 'transcricao', 'outro');   -- §3.1

CREATE TYPE fragment_status AS ENUM
  ('proposed', 'accepted', 'rejected', 'superseded', 'deleted');       -- §3.2

-- status de KnowledgeNode; também reusado como tombstone de compliance em
-- raw_information/raw_chunk (decisão 8 — só 'active'/'deleted' lá; a
-- aplicação é o gatekeeper, BR-12).
CREATE TYPE node_status AS ENUM
  ('active', 'needs_review', 'merged', 'deleted');                     -- §3.3

-- status de KnowledgeLink/NodeAttribute (§6.4); 'inactive' NUNCA é gravado —
-- é derivado em leitura (effective_status, §5.4 / A9).
CREATE TYPE assertion_status AS ENUM
  ('active', 'uncertain', 'disputed', 'superseded', 'deleted');

CREATE TYPE alias_kind AS ENUM ('canonical', 'alias');                 -- §3.3

CREATE TYPE valid_from_source AS ENUM ('stated', 'document', 'received'); -- §6.5/A14

CREATE TYPE attribute_value_type AS ENUM ('date', 'number', 'text', 'bool'); -- §3.4

CREATE TYPE llm_run_status AS ENUM ('running', 'completed', 'failed'); -- §3.5

CREATE TYPE validation_outcome AS ENUM
  ('accepted', 'consolidated', 'superseded_previous', 'needs_review',
   'uncertain', 'disputed', 'rejected', 'error');                      -- §3.5

-- ----------------------------------------------------------------------------
-- 5. Camada de schema e regras (§3.4)
-- ----------------------------------------------------------------------------
CREATE TABLE node_type (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text NOT NULL,
  version     int  NOT NULL DEFAULT 1
);

CREATE TABLE link_type (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text NOT NULL UNIQUE,
  label                       text NOT NULL,
  description                 text NOT NULL,
  inverse_name                text NOT NULL,
  is_temporal                 boolean NOT NULL,
  allows_multiple_current     boolean NOT NULL,  -- única fonte de verdade sobre multiplicidade (A10)
  requires_valid_from         boolean NOT NULL,
  requires_valid_to_on_change boolean NOT NULL,
  version                     int NOT NULL DEFAULT 1
);

-- Validação estrutural do grafo: pares de tipos permitidos, versionados no tempo (§12).
CREATE TABLE link_type_rule (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type_id        uuid NOT NULL REFERENCES link_type (id),
  source_node_type_id uuid NOT NULL REFERENCES node_type (id),
  target_node_type_id uuid NOT NULL REFERENCES node_type (id),
  valid_from          date,
  valid_to            date,
  CONSTRAINT link_type_rule_interval_ck
    CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to)
);

CREATE INDEX link_type_rule_link_type_idx ON link_type_rule (link_type_id);
CREATE INDEX link_type_rule_source_idx    ON link_type_rule (source_node_type_id);
CREATE INDEX link_type_rule_target_idx    ON link_type_rule (target_node_type_id);

-- Vocabulário governado de chaves de atributo — não existe chave livre (§3.4).
CREATE TABLE attribute_key (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type_id            uuid NOT NULL REFERENCES node_type (id),
  key                     text NOT NULL,
  value_type              attribute_value_type NOT NULL,
  is_temporal             boolean NOT NULL,
  allows_multiple_current boolean NOT NULL,
  requires_valid_from     boolean NOT NULL,
  description             text NOT NULL,
  version                 int NOT NULL DEFAULT 1,
  UNIQUE (node_type_id, key),
  UNIQUE (id, value_type)   -- alvo da FK composta de node_attribute (decisão 3)
);

CREATE INDEX attribute_key_node_type_idx ON attribute_key (node_type_id);

-- ----------------------------------------------------------------------------
-- 6. Camada de origem — a verdade bruta (§3.1)
-- ----------------------------------------------------------------------------
-- Nunca alterada nem apagada; exceção controlada = tombstone via
-- compliance_delete (§11), que redige `content` preservando `content_hash` e
-- grava status = 'deleted' + superseded_at = now() (BR-04/BR-05; decisão 8).
CREATE TABLE raw_information (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   source_type NOT NULL,
  content       text NOT NULL,
  storage_ref   text,                        -- reservado; não usado nesta versão
  content_hash  text NOT NULL UNIQUE
    CHECK (content_hash ~ '^[0-9a-f]{64}$'), -- sha-256 hex; base da idempotência (§8)
  received_at   timestamptz NOT NULL DEFAULT now(),
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb, -- autor, origem, título, document_date (§6.5)
  status        node_status NOT NULL DEFAULT 'active', -- tombstone (decisão 8)
  superseded_at timestamptz                            -- preenchido só no tombstone
);

-- Offsets: 0-based, semiaberto [start, end), em CODE POINTS Unicode (§9.2/A22).
CREATE TABLE raw_chunk (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_information_id uuid NOT NULL REFERENCES raw_information (id),
  chunk_index        int  NOT NULL CHECK (chunk_index >= 0),  -- spec: `index`
  "text"             text NOT NULL,
  offset_start       int  NOT NULL CHECK (offset_start >= 0),
  offset_end         int  NOT NULL,
  locator            jsonb,                 -- { page?, line?, speaker?, ts? } (A23)
  chunking_version   text NOT NULL DEFAULT 'v1',
  status             node_status NOT NULL DEFAULT 'active', -- cascata UC-01 passo 6 (decisão 8)
  superseded_at      timestamptz,                           -- idem
  text_search        tsvector GENERATED ALWAYS AS
                       (to_tsvector('pt_unaccent_v1', "text")) STORED,
  CONSTRAINT raw_chunk_offsets_ck CHECK (offset_end > offset_start),
  UNIQUE (raw_information_id, chunking_version, chunk_index)
);

-- PARCIAL: conteúdo tombstonado fica fora da recuperação no nível do índice
-- (§11, §7.2; decisão 8). A query de busca deve filtrar superseded_at IS NULL.
CREATE INDEX raw_chunk_fts_idx ON raw_chunk USING gin (text_search)
  WHERE superseded_at IS NULL;

-- ----------------------------------------------------------------------------
-- 7. Camada de auditoria da extração (§3.5)
-- ----------------------------------------------------------------------------
CREATE TABLE llm_run (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model                    text NOT NULL,
  prompt_version           text NOT NULL,
  started_at               timestamptz NOT NULL DEFAULT now(),
  finished_at              timestamptz,
  status                   llm_run_status NOT NULL DEFAULT 'running',
  attempts                 int NOT NULL DEFAULT 1 CHECK (attempts >= 1), -- retry reabre o MESMO run (§8)
  input_raw_information_id uuid NOT NULL REFERENCES raw_information (id),
  idempotency_key          text NOT NULL UNIQUE,  -- sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version) (A18)
  CONSTRAINT llm_run_finished_ck
    CHECK ((status = 'running') = (finished_at IS NULL))
);

CREATE INDEX llm_run_input_idx ON llm_run (input_raw_information_id);

CREATE TABLE tool_call (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  llm_run_id         uuid NOT NULL REFERENCES llm_run (id),
  tool_name          text NOT NULL,
  arguments          jsonb NOT NULL,
  result             jsonb,
  validation_outcome validation_outcome NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tool_call_run_idx ON tool_call (llm_run_id);

-- ----------------------------------------------------------------------------
-- 8. Camada de extração — o que a LLM propôs (§3.2)
-- ----------------------------------------------------------------------------
CREATE TABLE information_fragment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  llm_run_id    uuid NOT NULL REFERENCES llm_run (id),
  "text"        text NOT NULL CHECK (char_length("text") <= 1000),  -- contrato de propose_fragment (§14.1)
  confidence    numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status        fragment_status NOT NULL DEFAULT 'proposed',
  superseded_at timestamptz,                -- cascata UC-01 passo 6 (decisão 8)
  text_search   tsvector GENERATED ALWAYS AS
                  (to_tsvector('pt_unaccent_v1', "text")) STORED,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX information_fragment_run_idx ON information_fragment (llm_run_id);
-- Índice GIN PARCIAL: só fragmentos aceitos participam da busca (§3.2/§7.2).
-- Tombstone de compliance move status para 'deleted' ⇒ sai do índice.
CREATE INDEX information_fragment_fts_idx ON information_fragment
  USING gin (text_search) WHERE status = 'accepted';

CREATE TABLE fragment_source (
  fragment_id  uuid NOT NULL REFERENCES information_fragment (id),
  raw_chunk_id uuid NOT NULL REFERENCES raw_chunk (id),
  PRIMARY KEY (fragment_id, raw_chunk_id)
);

CREATE INDEX fragment_source_chunk_idx ON fragment_source (raw_chunk_id);

-- ----------------------------------------------------------------------------
-- 9. Camada de conhecimento consolidado — o grafo (§3.3)
-- ----------------------------------------------------------------------------
CREATE TABLE knowledge_node (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type_id        uuid NOT NULL REFERENCES node_type (id),
  canonical_name      text NOT NULL,
  status              node_status NOT NULL DEFAULT 'active',
  merged_into_node_id uuid REFERENCES knowledge_node (id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- preenchido SSE status = 'merged' (§3.3); apontar para nó ATIVO é
  -- invariante de aplicação (compressão de caminho, §4.4)
  CONSTRAINT knowledge_node_merged_ck
    CHECK ((status = 'merged') = (merged_into_node_id IS NOT NULL)),
  CONSTRAINT knowledge_node_no_self_merge_ck
    CHECK (merged_into_node_id IS DISTINCT FROM id)
);

CREATE INDEX knowledge_node_type_idx   ON knowledge_node (node_type_id);
CREATE INDEX knowledge_node_merged_idx ON knowledge_node (merged_into_node_id)
  WHERE merged_into_node_id IS NOT NULL;
-- suporte à fila entity_match (§10.1)
CREATE INDEX knowledge_node_needs_review_idx ON knowledge_node (created_at)
  WHERE status = 'needs_review';

-- Nomes do nó, inclusive o canônico espelhado — caminho único de resolução (§3.3).
CREATE TABLE node_alias (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id           uuid NOT NULL REFERENCES knowledge_node (id),
  alias             text NOT NULL CHECK (btrim(alias) <> ''),
  alias_norm        text NOT NULL GENERATED ALWAYS AS (norm(alias)) STORED,
  kind              alias_kind NOT NULL DEFAULT 'alias',
  created_by_run_id uuid REFERENCES llm_run (id),  -- nulo quando criado por curadoria
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (node_id, alias_norm)
);

-- igualdade exata da resolução de entidade — passo 1 do pipeline (§4.2)
CREATE INDEX node_alias_norm_idx ON node_alias (alias_norm);
-- similaridade trigram — passo 2 do pipeline (§4.2/A3)
CREATE INDEX node_alias_norm_trgm_idx ON node_alias USING gin (alias_norm gin_trgm_ops);
-- busca de nomes pelo usuário (camada "nós" do §7.2)
CREATE INDEX node_alias_fts_idx ON node_alias
  USING gin (to_tsvector('simple_unaccent_v1', alias));
CREATE INDEX node_alias_run_idx ON node_alias (created_by_run_id);
-- guarda de sanidade: um único alias canônico por nó (espelho de canonical_name)
CREATE UNIQUE INDEX node_alias_one_canonical_uq ON node_alias (node_id)
  WHERE kind = 'canonical';

-- Valores literais temporais (§3.3). Mesma maquinaria temporal/linhagem dos links.
CREATE TABLE node_attribute (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id                 uuid NOT NULL REFERENCES knowledge_node (id),
  attribute_key_id        uuid NOT NULL,
  value_type              attribute_value_type NOT NULL,  -- denormalizado (decisão 3)
  value                   text NOT NULL,                  -- serialização canônica
  value_date              date GENERATED ALWAYS AS
    (CASE WHEN value_type = 'date'   THEN canonical_date(value)   END) STORED,
  value_number            numeric GENERATED ALWAYS AS
    (CASE WHEN value_type = 'number' THEN canonical_number(value) END) STORED,
  valid_from              date,
  valid_to                date,
  recorded_at             timestamptz NOT NULL DEFAULT now(),
  superseded_at           timestamptz,
  status                  assertion_status NOT NULL,
  confidence              numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  valid_from_source       valid_from_source,
  created_by_run_id       uuid REFERENCES llm_run (id),  -- nulo quando criado por curadoria (correct_item, 6.5-B)
  supersedes_attribute_id uuid REFERENCES node_attribute (id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (attribute_key_id, value_type)
    REFERENCES attribute_key (id, value_type),
  -- intervalo semiaberto [from, to) ⇒ estritamente crescente (§5.2/§13.3)
  CONSTRAINT node_attribute_interval_ck
    CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to),
  -- data sem justificativa não existe (A14)
  CONSTRAINT node_attribute_basis_ck
    CHECK (valid_from IS NULL OR valid_from_source IS NOT NULL),
  CONSTRAINT node_attribute_no_self_supersede_ck
    CHECK (supersedes_attribute_id IS DISTINCT FROM id)
);

-- GUARDA DE DUPLICATA (§3.3/§6.5): 1 vigente por (node, key, value).
-- A guarda de SUCESSÃO FUNCIONAL (1 vigente por (node, key)) é transacional (A11).
CREATE UNIQUE INDEX node_attribute_current_dup_guard
  ON node_attribute (node_id, attribute_key_id, value)
  WHERE valid_to IS NULL AND superseded_at IS NULL;

CREATE INDEX node_attribute_node_idx       ON node_attribute (node_id);
CREATE INDEX node_attribute_key_idx        ON node_attribute (attribute_key_id);
CREATE INDEX node_attribute_run_idx        ON node_attribute (created_by_run_id);
CREATE INDEX node_attribute_supersedes_idx ON node_attribute (supersedes_attribute_id);
-- consultas de faixa: "deadlines de julho" (§3.3)
CREATE INDEX node_attribute_value_date_idx   ON node_attribute (value_date)
  WHERE value_date IS NOT NULL;
CREATE INDEX node_attribute_value_number_idx ON node_attribute (value_number)
  WHERE value_number IS NOT NULL;
-- suporte à fila disputed (§10.1)
CREATE INDEX node_attribute_disputed_idx ON node_attribute (recorded_at)
  WHERE status = 'disputed';

-- Relação direcionada temporal entre nós (§3.3).
CREATE TABLE knowledge_link (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id     uuid NOT NULL REFERENCES knowledge_node (id),
  target_node_id     uuid NOT NULL REFERENCES knowledge_node (id),
  link_type_id       uuid NOT NULL REFERENCES link_type (id),
  valid_from         date,
  valid_to           date,
  recorded_at        timestamptz NOT NULL DEFAULT now(),
  superseded_at      timestamptz,
  status             assertion_status NOT NULL,
  confidence         numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  valid_from_source  valid_from_source,
  created_by_run_id  uuid REFERENCES llm_run (id),  -- nulo quando criado por curadoria
  supersedes_link_id uuid REFERENCES knowledge_link (id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_link_interval_ck
    CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to),
  CONSTRAINT knowledge_link_basis_ck
    CHECK (valid_from IS NULL OR valid_from_source IS NOT NULL),
  CONSTRAINT knowledge_link_no_self_supersede_ck
    CHECK (supersedes_link_id IS DISTINCT FROM id)
);

-- GUARDA DE DUPLICATA (§3.3/§6.5): 1 vigente por (source, target, link_type).
CREATE UNIQUE INDEX knowledge_link_current_dup_guard
  ON knowledge_link (source_node_id, target_node_id, link_type_id)
  WHERE valid_to IS NULL AND superseded_at IS NULL;

CREATE INDEX knowledge_link_source_idx     ON knowledge_link (source_node_id);
CREATE INDEX knowledge_link_target_idx     ON knowledge_link (target_node_id);
CREATE INDEX knowledge_link_type_idx       ON knowledge_link (link_type_id);
CREATE INDEX knowledge_link_run_idx        ON knowledge_link (created_by_run_id);
CREATE INDEX knowledge_link_supersedes_idx ON knowledge_link (supersedes_link_id);
CREATE INDEX knowledge_link_disputed_idx   ON knowledge_link (recorded_at)
  WHERE status = 'disputed';

-- Proveniência: liga link/atributo aos fragmentos que o justificam (§3.3).
-- ACUMULA: consolidação por re-afirmação adiciona linhas (§6.5, passo 1).
CREATE TABLE provenance (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id      uuid REFERENCES knowledge_link (id),
  attribute_id uuid REFERENCES node_attribute (id),
  fragment_id  uuid NOT NULL REFERENCES information_fragment (id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- exatamente um entre link_id/attribute_id (§3.3)
  CONSTRAINT provenance_target_ck CHECK (num_nonnulls(link_id, attribute_id) = 1)
);

CREATE INDEX provenance_link_idx     ON provenance (link_id);
CREATE INDEX provenance_attr_idx     ON provenance (attribute_id);
CREATE INDEX provenance_fragment_idx ON provenance (fragment_id);
-- guarda de sanidade: o mesmo fragmento não justifica o mesmo item duas vezes
CREATE UNIQUE INDEX provenance_link_fragment_uq ON provenance (link_id, fragment_id)
  WHERE link_id IS NOT NULL;
CREATE UNIQUE INDEX provenance_attr_fragment_uq ON provenance (attribute_id, fragment_id)
  WHERE attribute_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 10. Curadoria e apagamento controlado (§3.5, §10, §11)
-- ----------------------------------------------------------------------------
-- Contexto dos matches ambíguos; linhas removidas ao resolver a revisão
-- (a decisão fica em curation_action).
CREATE TABLE entity_match_review (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id           uuid NOT NULL REFERENCES knowledge_node (id),
  candidate_node_id uuid NOT NULL REFERENCES knowledge_node (id),
  similarity        numeric NOT NULL CHECK (similarity >= 0 AND similarity <= 1),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (node_id, candidate_node_id),
  CONSTRAINT entity_match_review_distinct_ck CHECK (node_id <> candidate_node_id)
);

CREATE INDEX entity_match_review_candidate_idx ON entity_match_review (candidate_node_id);

-- Trilha de TODA ação de curadoria; mono-usuário ⇒ sem coluna de ator (§2.3/A20).
CREATE TABLE curation_action (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action      text NOT NULL,        -- nome da ferramenta de curadoria (§14.4)
  target_kind text NOT NULL,
  target_id   uuid,                 -- nulo quando a ação tem múltiplos alvos (payload detalha)
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason      text,                 -- obrigatório em ações destrutivas (validação do backend)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX curation_action_target_idx ON curation_action (target_kind, target_id);

-- Auditoria do apagamento controlado (§11).
CREATE TABLE compliance_deletion (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_information_id uuid NOT NULL REFERENCES raw_information (id),
  reason             text NOT NULL,
  executed_at        timestamptz NOT NULL DEFAULT now(),
  affected           jsonb NOT NULL DEFAULT '{}'::jsonb  -- contagens por entidade afetada
);

CREATE INDEX compliance_deletion_raw_idx ON compliance_deletion (raw_information_id);

-- ----------------------------------------------------------------------------
-- 11. Views resolvidas — caminho padrão de leitura (§5.4/A9)
-- is_current / is_in_effect / effective_status DERIVADOS, nunca armazenados.
-- ----------------------------------------------------------------------------
CREATE VIEW knowledge_link_resolved AS
SELECT
  kl.*,
  lt.name         AS link_type,
  lt.inverse_name AS link_inverse_name,
  (kl.valid_to IS NULL AND kl.superseded_at IS NULL) AS is_current,
  (kl.valid_to IS NULL AND kl.superseded_at IS NULL
     AND (kl.valid_from IS NULL OR kl.valid_from <= current_date)) AS is_in_effect,
  CASE
    WHEN kl.status = 'active'
     AND kl.valid_to IS NOT NULL AND kl.valid_to <= current_date
    THEN 'inactive'
    ELSE kl.status::text
  END AS effective_status
FROM knowledge_link kl
JOIN link_type lt ON lt.id = kl.link_type_id;

CREATE VIEW node_attribute_resolved AS
SELECT
  na.*,
  ak.key                     AS attribute_key,
  ak.is_temporal             AS key_is_temporal,
  ak.allows_multiple_current AS key_allows_multiple_current,
  (na.valid_to IS NULL AND na.superseded_at IS NULL) AS is_current,
  (na.valid_to IS NULL AND na.superseded_at IS NULL
     AND (na.valid_from IS NULL OR na.valid_from <= current_date)) AS is_in_effect,
  CASE
    WHEN na.status = 'active'
     AND na.valid_to IS NOT NULL AND na.valid_to <= current_date
    THEN 'inactive'
    ELSE na.status::text
  END AS effective_status
FROM node_attribute na
JOIN attribute_key ak ON ak.id = na.attribute_key_id;

-- ----------------------------------------------------------------------------
-- 12. Triggers de updated_at
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_knowledge_node_updated_at
  BEFORE UPDATE ON knowledge_node
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_node_attribute_updated_at
  BEFORE UPDATE ON node_attribute
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_knowledge_link_updated_at
  BEFORE UPDATE ON knowledge_link
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 13. CATÁLOGO SEED OBRIGATÓRIO (§15) — validado item a item contra a v7 §15:
--     8 NodeTypes, 10 LinkTypes (+22 regras), 10 AttributeKeys.
--     Novos tipos entram por migração versionada (§12).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 13.1 NodeTypes (§15.1)
-- ----------------------------------------------------------------------------
INSERT INTO node_type (name, description) VALUES
  ('Person',       'Pessoa física'),
  ('Organization', 'Empresa, órgão, time formal'),
  ('Project',      'Projeto/iniciativa com objetivo e ciclo de vida'),
  ('Event',        'Acontecimento pontual (reunião, go-live, workshop)'),
  ('Role',         'Cargo/função (vocabulário controlado)'),
  ('Category',     'Rótulo taxonômico para classificação'),
  ('Concept',      'Conceito/tema referenciável'),
  ('Location',     'Lugar físico ou lógico');

-- ----------------------------------------------------------------------------
-- 13.2 LinkTypes (§15.2) — flags: temporal / multi / req.valid_from / valid_to_on_change
-- ----------------------------------------------------------------------------
INSERT INTO link_type
  (name, label, inverse_name, description,
   is_temporal, allows_multiple_current, requires_valid_from, requires_valid_to_on_change)
VALUES
  ('participates_in', 'participa de', 'has_participant',
   'Pessoa participa de projeto ou evento',
   true,  true,  true,  false),
  ('member_of', 'é membro de', 'has_member',
   'Pessoa é membro de organização',
   true,  true,  true,  false),
  ('holds_role', 'exerce o cargo de', 'role_held_by',
   'Pessoa exerce cargo/função (vocabulário controlado)',
   true,  true,  true,  false),
  ('responsible_for', 'é responsável por', 'under_responsibility_of',
   'Pessoa responde por projeto ou evento',
   true,  true,  true,  false),
  ('reports_to', 'reporta a', 'manages',
   'Subordinação direta entre pessoas (funcional: 1 chefe vigente)',
   true,  false, true,  true),
  ('part_of', 'faz parte de', 'has_part',
   'Composição: org⊂org, projeto⊂projeto, evento⊂projeto (funcional)',
   true,  false, true,  true),
  ('located_in', 'localizado em', 'location_of',
   'Localização de organização ou evento (funcional)',
   true,  false, true,  true),
  ('organizes', 'organiza', 'organized_by',
   'Organização ou pessoa organiza evento',
   true,  true,  true,  false),
  ('belongs_to_category', 'pertence à categoria', 'contains',
   'Classificação taxonômica (estável — sem eixo de validade)',
   false, true,  false, false),
  ('related_to', 'relacionado a', 'related_to',
   'Relação temática simétrica (estável — sem eixo de validade)',
   false, true,  false, false);

-- ----------------------------------------------------------------------------
-- 13.3 LinkTypeRules (§15.2, coluna "pares permitidos") — 22 regras
--      valid_from/valid_to nulos = vigentes desde sempre (§5.1)
-- ----------------------------------------------------------------------------
INSERT INTO link_type_rule (link_type_id, source_node_type_id, target_node_type_id)
SELECT lt.id, s.id, t.id
FROM (VALUES
  ('participates_in',     'Person',       'Project'),
  ('participates_in',     'Person',       'Event'),
  ('member_of',           'Person',       'Organization'),
  ('holds_role',          'Person',       'Role'),
  ('responsible_for',     'Person',       'Project'),
  ('responsible_for',     'Person',       'Event'),
  ('reports_to',          'Person',       'Person'),
  ('part_of',             'Organization', 'Organization'),
  ('part_of',             'Project',      'Project'),
  ('part_of',             'Event',        'Project'),
  ('located_in',          'Organization', 'Location'),
  ('located_in',          'Event',        'Location'),
  ('organizes',           'Organization', 'Event'),
  ('organizes',           'Person',       'Event'),
  ('belongs_to_category', 'Person',       'Category'),
  ('belongs_to_category', 'Organization', 'Category'),
  ('belongs_to_category', 'Project',      'Category'),
  ('belongs_to_category', 'Event',        'Category'),
  ('belongs_to_category', 'Concept',      'Category'),
  ('belongs_to_category', 'Location',     'Category'),
  ('related_to',          'Concept',      'Concept'),
  ('related_to',          'Project',      'Concept')
) AS r(link_name, source_name, target_name)
JOIN link_type lt ON lt.name = r.link_name
JOIN node_type s  ON s.name  = r.source_name
JOIN node_type t  ON t.name  = r.target_name;

-- ----------------------------------------------------------------------------
-- 13.4 AttributeKeys (§15.3) — cobre todas as combinações de flags:
--      temporal-funcional, temporal-multi e estável (gabarito para novas chaves)
-- ----------------------------------------------------------------------------
INSERT INTO attribute_key
  (node_type_id, key, value_type, is_temporal, allows_multiple_current,
   requires_valid_from, description)
SELECT nt.id, a.key, a.value_type::attribute_value_type,
       a.is_temporal, a.multi, a.req_vf, a.description
FROM (VALUES
  ('Project',      'deadline',    'date',   true,  false, true,
   'Data-limite/go-live vigente do projeto (funcional)'),
  ('Project',      'start_date',  'date',   true,  false, true,
   'Data de início do projeto (funcional)'),
  ('Project',      'status_text', 'text',   true,  false, true,
   'Situação textual corrente do projeto (funcional)'),
  ('Project',      'budget',      'number', true,  false, true,
   'Orçamento do projeto (funcional)'),
  ('Event',        'event_date',  'date',   true,  false, true,
   'Data do evento (funcional)'),
  ('Person',       'email',       'text',   true,  true,  false,
   'E-mail da pessoa (multi-valor)'),
  ('Person',       'phone',       'text',   true,  true,  false,
   'Telefone da pessoa (multi-valor)'),
  ('Person',       'birth_date',  'date',   false, false, false,
   'Data de nascimento (estável; correção via 6.5-B)'),
  ('Organization', 'cnpj',        'text',   false, false, false,
   'CNPJ (estável; typo corrige-se via 6.5-B, sem fingir mudança no mundo)'),
  ('Organization', 'website',     'text',   true,  false, false,
   'Site institucional vigente (funcional)')
) AS a(node_type, key, value_type, is_temporal, multi, req_vf, description)
JOIN node_type nt ON nt.name = a.node_type;

COMMIT;
