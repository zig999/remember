-- ============================================================================
-- 0001_seed.sql — Remember — SEED ÚNICA DA ONTOLOGIA (catálogo §15 completo)
-- PostgreSQL 17 (Neon). Popula TODA a ontologia num único arquivo:
--   9 NodeTypes, 13 LinkTypes (+28 regras), 16 AttributeKeys, 9 valid_values.
--
-- Consolida as antigas 0001_seed (base §15) + 0002_catalog_tier1 (Tier-1:
-- Document, concerns/delivered_to/sponsors, atributos ocos) + 0003 (domínios
-- fechados doc_type/event_type) num só lugar (2026-06-14).
--
-- DEPENDE de 0001_init.sql (estrutura). Aplique DEPOIS do init. Resolve FKs por
-- NOME (JOIN node_type/link_type), então a ordem importa:
--   NodeTypes -> LinkTypes -> LinkTypeRules -> AttributeKeys -> valid_values.
--
-- IDEMPOTENTE (ON CONFLICT / WHERE NOT EXISTS) — seguro re-rodar e usar para
-- RE-CRIAR a ontologia após `ops/truncate_ontology.sql`. Novos tipos de
-- catálogo entram por migração de seed subsequente (§12) + RESTART do BFF.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. NodeTypes (§15.1) — 9
-- ----------------------------------------------------------------------------
INSERT INTO node_type (name, description) VALUES
  ('Person',       'Pessoa física'),
  ('Organization', 'Empresa, órgão, time formal'),
  ('Project',      'Projeto/iniciativa com objetivo e ciclo de vida'),
  ('Event',        'Acontecimento pontual (reunião, go-live, workshop)'),
  ('Role',         'Cargo/função (vocabulário controlado)'),
  ('Category',     'Rótulo taxonômico para classificação'),
  ('Concept',      'Conceito/tema referenciável'),
  ('Location',     'Lugar físico ou lógico'),
  ('Document',     'Artefato referenciado no conteúdo (proposta, ata, contrato, relatório); não é a fonte ingerida')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. LinkTypes (§15.2) — 13 — flags: temporal / multi / req.valid_from / valid_to_on_change
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
   false, true,  false, false),
  ('concerns', 'trata de', 'addressed_by',
   'Documento ou evento trata de / tem como assunto (aboutness estável)',
   false, true,  false, false),
  ('delivered_to', 'entregue a', 'recipient_of',
   'Documento entregue a uma pessoa',
   true,  true,  false, false),
  ('sponsors', 'patrocina', 'sponsored_by',
   'Organização patrocina / mantém projeto',
   true,  true,  true,  false)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. LinkTypeRules (§15.2, "pares permitidos") — 28
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
  ('related_to',          'Project',      'Concept'),
  ('concerns',            'Document',     'Project'),
  ('concerns',            'Document',     'Event'),
  ('concerns',            'Document',     'Organization'),
  ('concerns',            'Event',        'Project'),
  ('delivered_to',        'Document',     'Person'),
  ('sponsors',            'Organization', 'Project')
) AS r(link_name, source_name, target_name)
JOIN link_type lt ON lt.name = r.link_name
JOIN node_type s  ON s.name  = r.source_name
JOIN node_type t  ON t.name  = r.target_name
WHERE NOT EXISTS (
  SELECT 1 FROM link_type_rule x
  WHERE x.link_type_id = lt.id
    AND x.source_node_type_id = s.id
    AND x.target_node_type_id = t.id
);

-- ----------------------------------------------------------------------------
-- 4. AttributeKeys (§15.3) — 16
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
  ('Event',        'end_date',    'date',   true,  false, true,
   'Data de término do evento (funcional; espelha event_date)'),
  ('Event',        'event_type',  'text',   false, false, false,
   'Tipo do evento (reunião/workshop/go-live)'),
  ('Person',       'email',       'text',   true,  true,  false,
   'E-mail da pessoa (multi-valor)'),
  ('Person',       'phone',       'text',   true,  true,  false,
   'Telefone da pessoa (multi-valor)'),
  ('Person',       'birth_date',  'date',   false, false, false,
   'Data de nascimento (estável; correção via 6.5-B)'),
  ('Organization', 'cnpj',        'text',   false, false, false,
   'CNPJ (estável; typo corrige-se via 6.5-B, sem fingir mudança no mundo)'),
  ('Organization', 'website',     'text',   true,  false, false,
   'Site institucional vigente (funcional)'),
  ('Location',     'city',        'text',   false, false, false,
   'Cidade da localização (estável)'),
  ('Location',     'address',     'text',   false, false, false,
   'Endereço da localização (estável)'),
  ('Concept',      'definition',  'text',   false, false, false,
   'Definição do conceito (estável)'),
  ('Document',     'doc_type',    'text',   false, false, false,
   'Tipo do documento (proposta/ata/contrato…) — domínio fechado em valid_values')
) AS a(node_type, key, value_type, is_temporal, multi, req_vf, description)
JOIN node_type nt ON nt.name = a.node_type
ON CONFLICT (node_type_id, key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. valid_values (§ domínios fechados, BR-30) — 9
--    chave com >= 1 linha aqui => domínio FECHADO (backend rejeita fora do conjunto)
-- ----------------------------------------------------------------------------
INSERT INTO attribute_valid_value (attribute_key_id, value, label, sort_order)
SELECT ak.id, v.value, v.label, v.sort_order
FROM attribute_key ak
JOIN node_type nt ON nt.id = ak.node_type_id
JOIN (VALUES
  ('Document', 'doc_type',   'proposta',  'Proposta',  1),
  ('Document', 'doc_type',   'ata',       'Ata',       2),
  ('Document', 'doc_type',   'contrato',  'Contrato',  3),
  ('Document', 'doc_type',   'relatório', 'Relatório', 4),
  ('Document', 'doc_type',   'outro',     'Outro',     5),
  ('Event',    'event_type', 'reunião',   'Reunião',   1),
  ('Event',    'event_type', 'go-live',   'Go-live',   2),
  ('Event',    'event_type', 'workshop',  'Workshop',  3),
  ('Event',    'event_type', 'outro',     'Outro',     4)
) AS v(node_type, key, value, label, sort_order)
  ON v.node_type = nt.name AND v.key = ak.key
WHERE NOT EXISTS (
  SELECT 1 FROM attribute_valid_value x
  WHERE x.attribute_key_id = ak.id AND x.value = v.value
);

COMMIT;
