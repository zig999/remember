-- ============================================================================
-- 0001_seed.sql — Remember (spec v7 §15) — CATÁLOGO SEED da aplicação
-- PostgreSQL 17 (Neon). Dados de PREPARAÇÃO da aplicação: o catálogo
-- obrigatório (§15) — NodeTypes, LinkTypes (+ regras de par) e AttributeKeys.
--
-- DEPENDE de 0001_init.sql (estrutura). Aplique SEMPRE depois do init: estas
-- inserções resolvem as FKs por NOME (JOIN node_type / link_type), então a
-- ordem interna importa — NodeTypes → LinkTypes → LinkTypeRules → AttributeKeys.
--
-- Conteúdo validado item a item contra a v7 §15:
--   8 NodeTypes, 10 LinkTypes (+22 regras), 10 AttributeKeys.
-- Novos tipos de catálogo entram por MIGRAÇÃO VERSIONADA subsequente (§12) —
-- não editar este arquivo em produção.
--
-- NÃO idempotente (rodar uma vez). Separado de 0001_init.sql em 2026-06-14:
--   0001_init.sql = 100% estrutural (extensões, funções, tipos, tabelas,
--                   índices, views, triggers);
--   0001_seed.sql = dados de preparação (este arquivo).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. NodeTypes (§15.1)
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
-- 2. LinkTypes (§15.2) — flags: temporal / multi / req.valid_from / valid_to_on_change
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
-- 3. LinkTypeRules (§15.2, coluna "pares permitidos") — 22 regras
--    valid_from/valid_to nulos = vigentes desde sempre (§5.1)
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
-- 4. AttributeKeys (§15.3) — cobre todas as combinações de flags:
--    temporal-funcional, temporal-multi e estável (gabarito para novas chaves)
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
