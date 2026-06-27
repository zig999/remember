-- ============================================================================
-- 0003_event_type_taxonomy.sql — Remember — EXTENSÃO ADITIVA DO CATÁLOGO
-- PostgreSQL (Neon). Amplia o domínio fechado de Event.event_type.
--
-- Adiciona (NÃO altera schema; só dados de catálogo — extensão versionada §12):
--   +5 valid_values em Event.event_type (mantém o domínio FECHADO):
--     cobrança, decisão, escalonamento, bloqueio, marco
--   Motivo: o conjunto original {reunião, go-live, workshop, outro} é enviesado
--   para cerimônias de projeto; acontecimentos do tipo ação/comunicação
--   (cobranças, decisões, escalonamentos, bloqueios, marcos) caíam em `outro`
--   com confiança rebaixada (`uncertain`). Esta extensão dá-lhes valor canônico.
--
-- DEPENDE de 0001_init.sql + 0001_seed.sql (cria attribute_key Event.event_type
--   e semeia os 4 valores originais). Resolve FKs por NOME.
-- IDEMPOTENTE (WHERE NOT EXISTS) — seguro re-rodar. Reversível por DELETE das
--   5 linhas inseridas.
--
-- ⚠️ EXIGE RESTART DO BFF: o catálogo é boot-only — os valid_values entram no
--    snapshot E no prompt de extração (que guia a LLM aos valores canônicos)
--    apenas no boot.
--
-- NOTA (BR-30): ampliar o domínio valida apenas PROPOSTAS futuras; não reescreve
--    nem reclassifica node_attribute já gravados (ex.: a "Cobrança ao Caio" já
--    persistida continua como event_type='outro'/uncertain — extração futura).
--
-- NOTA (sort_order): os novos valores entram em 5..9; o `outro` original
--    permanece em 4. sort_order é só ordenação de exibição, não há unicidade —
--    mantido aditivo (sem UPDATE em linha existente, conforme cirurgia mínima).
--
-- Totais após aplicar: 28->33 valid_values (Event.event_type 4->9).
-- ============================================================================

BEGIN;

INSERT INTO attribute_valid_value (attribute_key_id, value, label, sort_order)
SELECT ak.id, v.value, v.label, v.sort_order
FROM attribute_key ak
JOIN node_type nt ON nt.id = ak.node_type_id
JOIN (VALUES
  ('Event', 'event_type', 'cobrança',      'Cobrança/Follow-up',   5),
  ('Event', 'event_type', 'decisão',       'Decisão',              6),
  ('Event', 'event_type', 'escalonamento', 'Escalonamento',        7),
  ('Event', 'event_type', 'bloqueio',      'Bloqueio/Impedimento', 8),
  ('Event', 'event_type', 'marco',         'Marco/Entrega',        9)
) AS v(node_type, key, value, label, sort_order)
  ON v.node_type = nt.name AND v.key = ak.key
WHERE NOT EXISTS (
  SELECT 1 FROM attribute_valid_value x
  WHERE x.attribute_key_id = ak.id AND x.value = v.value
);

COMMIT;
