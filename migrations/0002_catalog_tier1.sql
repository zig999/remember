-- ============================================================================
-- 0002_catalog_tier1.sql — Remember — EVOLUÇÃO DE ONTOLOGIA, Tier 1 (catálogo)
-- PostgreSQL 17 (Neon). Adição puramente ADITIVA ao catálogo §15, motivada por
-- lacunas expostas nos testes E2E:
--   - fragmento órfão ("as propostas …") -> NodeType `Document`;
--   - evento que TRATA de projetos (aboutness ≠ composição `part_of`) -> `concerns`;
--   - responsabilidade organizacional -> `sponsors` (Org→Project);
--   - entidades "ocas" (`Location`, `Concept`) e `Event` enriquecidos.
--
-- DEPENDE de 0001_init.sql (estrutura) + 0001_seed.sql (catálogo base). Aplicar
-- DEPOIS de ambos. As inserções resolvem FKs por NOME (JOIN node_type/link_type),
-- então a ordem importa: NodeType -> LinkType -> LinkTypeRule -> AttributeKey.
--
-- Idempotente: ON CONFLICT / NOT EXISTS — seguro re-rodar. Catálogo só muda por
-- migração versionada (§12) e exige RESTART do BFF (recarrega o CatalogSnapshot).
--
-- Novos totais após esta migração:
--   9 NodeTypes, 13 LinkTypes (+28 regras), 16 AttributeKeys.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. NodeType novo (1)
-- ----------------------------------------------------------------------------
INSERT INTO node_type (name, description) VALUES
  ('Document', 'Artefato referenciado no conteúdo (proposta, ata, contrato, relatório); não é a fonte ingerida')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. LinkTypes novos (3)
-- ----------------------------------------------------------------------------
INSERT INTO link_type
  (name, label, inverse_name, description,
   is_temporal, allows_multiple_current, requires_valid_from, requires_valid_to_on_change)
VALUES
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
-- 3. LinkTypeRules novas (6) — link_type_rule não tem UNIQUE: guarda NOT EXISTS
-- ----------------------------------------------------------------------------
INSERT INTO link_type_rule (link_type_id, source_node_type_id, target_node_type_id)
SELECT lt.id, s.id, t.id
FROM (VALUES
  ('concerns',     'Document',     'Project'),
  ('concerns',     'Document',     'Event'),
  ('concerns',     'Document',     'Organization'),
  ('concerns',     'Event',        'Project'),
  ('delivered_to', 'Document',     'Person'),
  ('sponsors',     'Organization', 'Project')
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
-- 4. AttributeKeys novos (6)
-- ----------------------------------------------------------------------------
INSERT INTO attribute_key
  (node_type_id, key, value_type, is_temporal, allows_multiple_current,
   requires_valid_from, description)
SELECT nt.id, a.key, a.value_type::attribute_value_type,
       a.is_temporal, a.multi, a.req_vf, a.description
FROM (VALUES
  ('Document', 'doc_type',   'text', false, false, false,
   'Tipo do documento (proposta/ata/contrato…) — texto livre por ora'),
  ('Location', 'city',       'text', false, false, false,
   'Cidade da localização (estável)'),
  ('Location', 'address',    'text', false, false, false,
   'Endereço da localização (estável)'),
  ('Concept',  'definition', 'text', false, false, false,
   'Definição do conceito (estável)'),
  ('Event',    'end_date',   'date', true,  false, true,
   'Data de término do evento (funcional; espelha event_date)'),
  ('Event',    'event_type', 'text', false, false, false,
   'Tipo do evento (reunião/workshop/go-live)')
) AS a(node_type, key, value_type, is_temporal, multi, req_vf, description)
JOIN node_type nt ON nt.name = a.node_type
ON CONFLICT (node_type_id, key) DO NOTHING;

COMMIT;
