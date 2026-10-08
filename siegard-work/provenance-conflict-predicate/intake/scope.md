# Corrective increment: an edit that records a new attribute answers HTTP 500

Named by the person through the ask "siga com as correções apresentadas acima".
File the wrong behavior lives in: backend/src/modules/curation/repository/curation.repository.ts.

## Observed behavior

POST /api/v1/nodes/8b831532-58fa-436b-b83b-a8e01e3598a0/edit with the body

{"reason":"Correção","changes":[{"attribute_key":"budget","kind":"set","value":"5000","item_id":null,"valid_from":"2026-10-08","valid_to":null}]}

answers HTTP 500 {"ok":false,"error":{"code":"SYSTEM_INTERNAL_ERROR","message":"Internal server error."}} and records nothing.
The node is an active Project that holds no attribute, and the body is a first value of a temporal key.
The same answer follows every edit whose effect records a new attribute: first value, addition, succession and correction.

## Decision the person took

The correction the person approved is to repeat, in the INSERT INTO provenance statements with ON CONFLICT of that file, the predicate of the partial unique indexes provenance_link_fragment_uq (WHERE link_id IS NOT NULL) and provenance_attr_fragment_uq (WHERE attribute_id IS NOT NULL) defined in migrations/0001_init.sql, and to change nothing else.
The database schema is not changed: no migration and no index.
The proof is a test that fails while one of those statements lacks its predicate.

## Reproduction

Send the request above to the backend.
