-- ============================================================================
-- 0002_ontology_status_task.sql — Remember — EXTENSÃO ADITIVA DO CATÁLOGO
-- PostgreSQL (Neon). Padroniza o status de projeto e introduz o tipo Task.
--
-- Adiciona (NÃO altera schema; só dados de catálogo — extensão versionada §12):
--   A) Project.status_text  -> domínio FECHADO (8 valid_values)
--   C) Task (novo NodeType) + atributos status (fechado) / priority (fechado) /
--      due_date (date, aberto) + 2 regras de link (REUSA part_of e
--      responsible_for — nenhum LinkType novo)
--
-- DEPENDE de 0001_init.sql + 0001_seed.sql. Resolve FKs por NOME; ordem:
--   NodeType -> LinkTypeRules -> AttributeKeys -> valid_values.
-- IDEMPOTENTE (ON CONFLICT / WHERE NOT EXISTS) — seguro re-rodar. Reversível
--   por DELETE das linhas inseridas.
--
-- ⚠️ EXIGE RESTART DO BFF: o catálogo é boot-only — os valid_values entram no
--    snapshot E no prompt de extração (que guia a LLM aos valores canônicos)
--    apenas no boot.
--
-- NOTA (BR-30): fechar Project.status_text valida apenas PROPOSTAS futuras;
--    não reescreve nem invalida node_attribute já gravados.
--
-- Totais após aplicar: 9->10 NodeTypes, 28->30 LinkTypeRules,
--   16->19 AttributeKeys, 9->28 valid_values.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- C.1 NodeType — Task
-- ----------------------------------------------------------------------------
INSERT INTO node_type (name, description) VALUES
  ('Task', 'Tarefa/atividade com responsável, prazo e ciclo de vida')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- C.2 LinkTypeRules — reusa link types existentes
--   part_of (funcional): a tarefa faz parte de UM projeto vigente
--   responsible_for (multi): pessoa responde pela tarefa
-- ----------------------------------------------------------------------------
INSERT INTO link_type_rule (link_type_id, source_node_type_id, target_node_type_id)
SELECT lt.id, s.id, t.id
FROM (VALUES
  ('part_of',         'Task',   'Project'),
  ('responsible_for', 'Person', 'Task')
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
-- C.3 AttributeKeys — Task
--   status / priority: text, temporal, funcional, exige valid_from -> FECHADOS
--   due_date: date, temporal, funcional -> ABERTO (espelha Project.deadline)
-- ----------------------------------------------------------------------------
INSERT INTO attribute_key
  (node_type_id, key, value_type, is_temporal, allows_multiple_current,
   requires_valid_from, description)
SELECT nt.id, a.key, a.value_type::attribute_value_type,
       a.is_temporal, a.multi, a.req_vf, a.description
FROM (VALUES
  ('Task', 'status',   'text', true,  false, true,
   'Situação corrente da tarefa (funcional) — domínio fechado em valid_values'),
  ('Task', 'priority', 'text', true,  false, true,
   'Prioridade corrente da tarefa (funcional) — domínio fechado em valid_values'),
  ('Task', 'due_date', 'date', true,  false, true,
   'Prazo/entrega vigente da tarefa (funcional)')
) AS a(node_type, key, value_type, is_temporal, multi, req_vf, description)
JOIN node_type nt ON nt.name = a.node_type
ON CONFLICT (node_type_id, key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- A + C.4  valid_values (domínios fechados, BR-30)
--   chave com >= 1 linha aqui => domínio FECHADO (backend rejeita fora do conjunto)
-- ----------------------------------------------------------------------------
INSERT INTO attribute_valid_value (attribute_key_id, value, label, sort_order)
SELECT ak.id, v.value, v.label, v.sort_order
FROM attribute_key ak
JOIN node_type nt ON nt.id = ak.node_type_id
JOIN (VALUES
  -- A) Project.status_text — ciclo de vida do projeto
  ('Project', 'status_text', 'planejado',    'Planejado',    1),
  ('Project', 'status_text', 'em aprovação', 'Em aprovação', 2),
  ('Project', 'status_text', 'aprovado',     'Aprovado',     3),
  ('Project', 'status_text', 'em andamento', 'Em andamento', 4),
  ('Project', 'status_text', 'pausado',      'Pausado',      5),
  ('Project', 'status_text', 'concluído',    'Concluído',    6),
  ('Project', 'status_text', 'cancelado',    'Cancelado',    7),
  ('Project', 'status_text', 'outro',        'Outro',        8),
  -- C) Task.status — ciclo de vida da tarefa
  ('Task', 'status', 'a fazer',      'A fazer',      1),
  ('Task', 'status', 'em andamento', 'Em andamento', 2),
  ('Task', 'status', 'bloqueada',    'Bloqueada',    3),
  ('Task', 'status', 'em revisão',   'Em revisão',   4),
  ('Task', 'status', 'concluída',    'Concluída',    5),
  ('Task', 'status', 'cancelada',    'Cancelada',    6),
  ('Task', 'status', 'outro',        'Outro',        7),
  -- C) Task.priority
  ('Task', 'priority', 'baixa',   'Baixa',   1),
  ('Task', 'priority', 'média',   'Média',   2),
  ('Task', 'priority', 'alta',    'Alta',    3),
  ('Task', 'priority', 'crítica', 'Crítica', 4)
) AS v(node_type, key, value, label, sort_order)
  ON v.node_type = nt.name AND v.key = ak.key
WHERE NOT EXISTS (
  SELECT 1 FROM attribute_valid_value x
  WHERE x.attribute_key_id = ak.id AND x.value = v.value
);

COMMIT;
