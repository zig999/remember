---
title: Curation backend and its attribute-write collaborators
summary: The backend area where the owner's entity edit lands, namely the curation
  module, the ingestion attribute-validation and succession code it borrows from,
  and the REST and MCP wiring around them.
rationale: Surveyed from the scope's target of backend, walking the curation module,
  the ingestion validation and consolidation services, the shared transport and error
  mapping, the auth middleware, app wiring and the test layout.
sources:
- intake/scope.md
area:
- src/modules/curation
- src/modules/ingestion/validation
- src/modules/ingestion/service
- src/modules/compliance-audit/dto
- src/mcp
- src/shared
- src/middleware
- src/app.ts
- src/__tests__
modules:
- name: curation
  path: src/modules/curation
  role: touched
- name: curation-item-service
  path: src/modules/curation/service/item.service.ts
  role: touched
- name: curation-repository
  path: src/modules/curation/repository/curation.repository.ts
  role: touched
- name: curation-routes
  path: src/modules/curation/routes/curation.routes.ts
  role: touched
- name: curation-mcp
  path: src/modules/curation/mcp
  role: adjacent
- name: curation-dto
  path: src/modules/curation/dto
  role: touched
- name: ingestion-validation
  path: src/modules/ingestion/validation
  role: depends-on
- name: graph-consolidation
  path: src/modules/ingestion/service/graph-consolidation.service.ts
  role: depends-on
- name: ingestion-catalog
  path: src/modules/ingestion/catalog/catalog.ts
  role: depends-on
- name: compliance-audit-dto
  path: src/modules/compliance-audit/dto/curation-action.dto.ts
  role: touched
- name: error-mapping
  path: src/shared/error-mapping.ts
  role: touched
- name: pg-transaction
  path: src/shared/pg-transaction.ts
  role: depends-on
- name: mcp-transport
  path: src/mcp/sdk-http-transport.ts
  role: adjacent
- name: auth-middleware
  path: src/middleware/auth.ts
  role: depends-on
- name: app-wiring
  path: src/app.ts
  role: touched
conventions:
- statement: A write service opens one transaction with withTransaction, locks the
    target row with loadItemsForUpdate, checks status and throws ResourceNotFoundError
    or ConflictError, mutates, inserts a curation_action row, and logs one pino info
    line naming route, operation and action_id.
  seen_at: src/modules/curation/service/item.service.ts
- statement: Route handlers parse the body with a Zod schema inside try/catch and
    route both parse errors and service errors through a shared sendError that calls
    mapErrorToHttpResponse; routes never re-check the JWT because the parent scope
    enforces auth.
  seen_at: src/modules/curation/routes/curation.routes.ts
- statement: Services take a deps object ({ pool, logger, catalog }), and the curation
    write paths receive the ingestion CatalogSnapshot, the only one carrying the closed
    value domain.
  seen_at: src/modules/curation/service/item.service.ts
- statement: Business refusals are BusinessError or ConflictError carrying namespaced
    BUSINESS_* codes, and the HTTP status for each code is registered in one table,
    so a new code needs an entry there.
  seen_at: src/shared/error-mapping.ts
- statement: curation_action.action is free text with no enum or CHECK in the migrations,
    and the allowed action names are a Zod enum in the compliance-audit DTO, which
    currently lacks edit-entity.
  seen_at: src/modules/compliance-audit/dto/curation-action.dto.ts
- statement: The vigent-row lookup for succession locks with SELECT ... FOR UPDATE
    where valid_to IS NULL and superseded_at IS NULL, keyed by (node, attribute_key)
    for functional keys or by (node, key, value) for multi-valued ones.
  seen_at: src/modules/ingestion/service/graph-consolidation.service.ts
- statement: Curation toolsets mirror REST by calling the same service function, with
    the closed tool-name whitelist composed in app.ts as CURATION_TOOL_NAMES plus
    compliance_delete, and a spec asserting the exact count.
  seen_at: src/modules/curation/mcp/curation-toolset.ts
- statement: Tests live in two layouts, with specs beside the code under modules/curation/mcp
    and unit and integration specs under src/__tests__, where curation has routes,
    mcp-curation-parity and mcp-curation-wiring integration specs and a dto unit spec.
  seen_at: src/__tests__/integration/curation/routes.spec.ts
must_not_duplicate:
- what: Attribute value type parsing (date, number, bool, text), which throws ValidationFailure
    VALIDATION_INVALID_FORMAT
  at: src/modules/ingestion/validation/structural.ts
- what: Closed value-domain check and the domainOf catalog helper that resolves the
    domain by attribute key id
  at: src/modules/ingestion/validation/structural.ts
- what: The correct_item sequence of parse then domain check, which maps ValidationFailure
    to BUSINESS_INVALID_ATTRIBUTE_VALUE with allowed_values in the details
  at: src/modules/curation/service/item.service.ts
- what: Predecessor supersession, replacement row insertion and provenance copy for
    an attribute, which leaves valid_to unchanged
  at: src/modules/curation/repository/curation.repository.ts
- what: insertCurationAction, the audit-row writer
  at: src/modules/curation/repository/curation.repository.ts
- what: The vigent-attribute FOR UPDATE lookups, which are private to the module today
  at: src/modules/ingestion/service/graph-consolidation.service.ts
- what: withTransaction and withReadOnly
  at: src/shared/pg-transaction.ts
- what: mapErrorToHttpResponse and mapErrorToEnvelope, the shared REST and MCP error
    rendering
  at: src/modules/curation/mcp/error-envelope.ts
- what: Catalog lookups by key id via attributeKeyById
  at: src/modules/ingestion/catalog/catalog.ts
risks:
- risk: Adding edit-entity to the curation action names changes a closed Zod enum
    used to read and filter audit rows, so audit listings and counts could reject
    or omit the new action.
  consumers:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/__tests__/unit/compliance-audit/dto.spec.ts
  - src/__tests__/integration/compliance-audit/routes.spec.ts
- risk: Exposing the edit as an MCP tool would break the constraint that entity editing
    is not a language-model tool, and it would also change the closed curation whitelist
    and its count assertions.
  consumers:
  - src/modules/curation/mcp/curation-toolset.spec.ts
  - src/modules/curation/mcp/curation-transport.spec.ts
  - src/__tests__/integration/curation/mcp-curation-wiring.spec.ts
  - src/__tests__/integration/curation/mcp-curation-parity.spec.ts
- risk: Widening the shared parse and domain validators, or the correct_item error
    shape, would change what the ingestion and correct_item paths accept and report.
  consumers:
  - src/__tests__/unit/ingestion/structural.spec.ts
  - src/__tests__/unit/ingestion/propose-attribute-domain.spec.ts
  - src/__tests__/integration/curation/routes.spec.ts
- risk: New BUSINESS_* or VALIDATION_* codes not registered in the status table fall
    to a default status, and changing existing entries shifts REST statuses and MCP
    isError mapping.
  consumers:
  - src/shared/error-mapping.ts
  - src/__tests__/integration/curation/mcp-curation-parity.spec.ts
- risk: Edits to the vigent attribute row compete with ingestion consolidation for
    the same node_attribute rows, so inconsistent lock order or skipping FOR UPDATE
    could produce two vigent values for a functional key.
  consumers:
  - src/modules/ingestion/service/graph-consolidation.service.ts
  - src/__tests__/unit/ingestion/graph-consolidation.spec.ts
  - src/__tests__/integration/ingestion/propose-routes.spec.ts
---
## What it is
The backend area where the owner's attribute edit of a knowledge node lands is the curation module, whose item service already supersedes and replaces an attribute row inside one locked transaction and writes a curation_action audit row.
It borrows value parsing and closed-domain validation from the ingestion validation module and the vigent-row FOR UPDATE pattern from graph consolidation, and it is exposed through REST routes under /api/v1/curation and an MCP curation toolset mounted in app.ts.
Error codes, their HTTP statuses and the MCP rendering all go through the shared error-mapping table, and the module sits behind the Neon Auth middleware applied by the parent scope.

## Notes
The tree is not empty, and the survey read the curation service, repository, routes and toolset, the validators, the vigent-row locks, the error table and the test layout.
No node-attribute repository exists as its own module, because attribute reads and writes sit in curation.repository.ts and in private functions of graph-consolidation.service.ts.
The survey found no existing check that a validity start precedes its end beyond the BUSINESS_TEMPORAL_INCOHERENT code, and it found no stable-key-change handling in code.
The ingestion catalog snapshot is passed to the curation routes through app.ts as ingestionCatalog, and the knowledge-graph catalog is a separate snapshot.
The curation_action table has no enum or CHECK on action, so adding edit-entity needs no migration, but the compliance-audit action-name enum does need the new value.
