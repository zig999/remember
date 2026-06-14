BEGIN;

CREATE TABLE IF NOT EXISTS attribute_valid_value (
  id               uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_key_id uuid  NOT NULL REFERENCES attribute_key(id),
  value            text  NOT NULL,
  label            text,
  sort_order       int,
  description      text,
  version          int   NOT NULL DEFAULT 1,
  UNIQUE (attribute_key_id, value)
);

CREATE INDEX IF NOT EXISTS attribute_valid_value_key_idx
  ON attribute_valid_value (attribute_key_id);

-- Seed: Document.doc_type closed domain (5 values)
INSERT INTO attribute_valid_value (attribute_key_id, value, label, sort_order)
SELECT ak.id, v.value, v.label, v.sort_order
FROM attribute_key ak
JOIN node_type nt ON nt.id = ak.node_type_id
CROSS JOIN (VALUES
  ('proposta',  'Proposta',  1),
  ('ata',       'Ata',       2),
  ('contrato',  'Contrato',  3),
  ('relatório', 'Relatório', 4),
  ('outro',     'Outro',     5)
) AS v(value, label, sort_order)
WHERE nt.name = 'Document'
  AND ak.key   = 'doc_type'
  AND NOT EXISTS (
    SELECT 1 FROM attribute_valid_value x
    WHERE x.attribute_key_id = ak.id AND x.value = v.value
  );

-- Seed: Event.event_type closed domain (4 values)
INSERT INTO attribute_valid_value (attribute_key_id, value, label, sort_order)
SELECT ak.id, v.value, v.label, v.sort_order
FROM attribute_key ak
JOIN node_type nt ON nt.id = ak.node_type_id
CROSS JOIN (VALUES
  ('reunião',   'Reunião',   1),
  ('go-live',   'Go-live',   2),
  ('workshop',  'Workshop',  3),
  ('outro',     'Outro',     4)
) AS v(value, label, sort_order)
WHERE nt.name = 'Event'
  AND ak.key   = 'event_type'
  AND NOT EXISTS (
    SELECT 1 FROM attribute_valid_value x
    WHERE x.attribute_key_id = ak.id AND x.value = v.value
  );

COMMIT;
