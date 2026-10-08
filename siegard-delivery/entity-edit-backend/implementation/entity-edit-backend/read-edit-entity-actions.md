---
target: backend
title: Audit action filter admits edit_entity
summary: The compliance-audit action-name enum now holds edit_entity as its eighth kind, so the audit listing admits it and filters by it. The read paths needed no change.
task: sha256:c561f0dfb4d0e1875271a933dc8d1e6b7de58b3c25d50abdedf42f2dd243fd80
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-read-edit-entity-actions-build
files:
- path: src/modules/compliance-audit/dto/curation-action.dto.ts
  effect: CurationActionNameSchema now has edit_entity as its eighth member. The audit listing's action query filter admits it, and any other text, including the hyphen spelling edit-entity, is still refused by the schema (VALIDATION_INVALID_FORMAT, HTTP 422, through the existing route parse). The four JSDoc comments in the file were removed under the no-comments rule, and nothing else in the file changed.
criteria:
- criterion: An audit listing over a store holding a curation action recorded with kind edit_entity returns that action.
  met: true
  how: The listing has no gate on the stored value. The repository reads curation_action rows with only parameterized optional filters, and CurationActionSchema declares action as z.string(), which already carries edit_entity (src/modules/compliance-audit/repository/compliance-audit.repository.ts listCurationActions, src/modules/compliance-audit/service/compliance-audit.service.ts curationRowToDto). The only closed set on the audit path was the query-filter enum, which now holds the kind. No code outside the DTO needed to change.
- criterion: The audit listing's action filter admits edit_entity.
  met: true
  how: '"edit_entity" is added to CurationActionNameSchema in src/modules/compliance-audit/dto/curation-action.dto.ts, and ListCurationActionsQuerySchema.action is that schema''s optional form.'
- criterion: Filtering the audit listing by edit_entity returns no action of another kind.
  met: true
  how: A filter value reaches the repository's parameterized `action = $n` equality predicate unchanged (listCurationActions in compliance-audit.repository.ts). The filter is an exact match, so only rows whose action is edit_entity are returned.
- criterion: The audit listing's action filter admits each of the eight kinds of curation-action-kind written with each hyphen as an underscore.
  met: true
  how: The enum now holds resolve_entity_match, merge_nodes, resolve_dispute, confirm_item, reject_item, correct_item, compliance_delete and edit_entity, which are the eight values of domain/knowledge-base/curation-action-kind with each hyphen written as an underscore.
nodes:
- node: domain/knowledge-base/curation-action
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  how: CurationActionSchema declares the action field as a string, so a curation action of the new kind is read back unchanged. This task wrote nothing else for the aggregate.
- node: domain/knowledge-base/curation-action-kind
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  how: CurationActionNameSchema is the closed set of kinds the audit surface knows, and it now holds all eight enumeration values in their underscore spelling.
- node: domain/knowledge-base/curation-action-filter
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  how: 'ListCurationActionsQuerySchema is the filter value object: action typed by the kind enum, target_kind, target_id, created_from, created_to, and the page as limit and offset. Its action member is widened to the eighth kind and the other members are untouched.'
- node: rules/knowledge-base/a-curation-action-kind-is-written-with-underscores
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  how: The listing-filter half of the rule is encoded by the enum members being the underscore spellings, so the hyphen form edit-entity is not accepted. The recording half was written by the earlier record-edit-action task and is not touched here.
- node: contracts/knowledge-base/compliance-audit
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  how: list-curation-actions keeps its closed-set refusal, because a filter outside the enum still fails ListCurationActionsQuerySchema.parse in the route and maps to VALIDATION_INVALID_FORMAT with HTTP 422. read-curation-action maps the stored action through z.string() and returns it with HTTP 200, so an edit_entity action reads without error. The route, service and repository files were read and needed no change.
inferences:
- inferred: The eighth enum member is spelled with the literal string edit_entity in the DTO instead of importing ENTITY_EDIT_ACTION_KIND from the curation module.
  from: z.enum needs a literal tuple, and the compliance-audit module does not import from the curation module anywhere else. The enumeration node's underscore rule fixes the spelling.
- inferred: No change to the response mapping was needed for the read paths, and the spelling of action in list and read answers is the stored underscore text.
  from: CurationActionSchema.action is z.string() and curationRowToDto copies row.action. This also settles the task's ADVISORY note that the specification does not state the response spelling, and the code already returns the stored spelling.
preserved:
- The seven existing action names in CurationActionNameSchema keep their spelling and order, so the existing accepts-each-tool-name case in src/__tests__/unit/compliance-audit/dto.spec.ts still passes.
- 'The unknown-filter refusal (action: invalid_action fails the schema) still holds in that spec and in the audit routes integration spec.'
- TargetKindSchema, the created_from/created_to ordering refinement, the limit and offset bounds, CurationActionSchema, CurationActionListSchema and CurationActionIdParamSchema are unchanged.
- The compliance_delete write path and the repository, service and routes of compliance-audit are not edited.
deferred:
- what: src/__tests__/unit/compliance-audit/dto.spec.ts has a case titled 'accepts each of the 7 curation tool names' that lists seven kinds and never lists edit_entity. The same spec file and src/__tests__/integration/compliance-audit/routes.spec.ts hold no case for the eighth kind.
  why: The delivery writes no tests and must not edit these specs. Neither spec breaks under the change, but both lack coverage of edit_entity admission and of read-curation-action over an edit_entity row, and the test author should add it.
- what: Other comments remain in the compliance-audit module (routes, repository, service, mcp toolset).
  why: This task touched only curation-action.dto.ts. Removing comments from files it did not edit would widen it.
---
## What it is
The compliance-audit action-name enum now holds edit_entity as its eighth kind, so the audit listing admits it and filters by it. The read paths needed no change.

## Notes
Inferred: The eighth enum member is spelled with the literal string edit_entity in the DTO instead of importing ENTITY_EDIT_ACTION_KIND from the curation module.
Inferred: No change to the response mapping was needed for the read paths, and the spelling of action in list and read answers is the stored underscore text.
Deferred: src/__tests__/unit/compliance-audit/dto.spec.ts has a case titled 'accepts each of the 7 curation tool names' that lists seven kinds and never lists edit_entity. The same spec file and src/__tests__/integration/compliance-audit/routes.spec.ts hold no case for the eighth kind.
Deferred: Other comments remain in the compliance-audit module (routes, repository, service, mcp toolset).
