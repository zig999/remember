---
target: backend
title: Entity edit request schema
summary: A Zod schema for the entity edit body, in a new DTO file, that parses a well-formed edit into a reason and its changes. It refuses a malformed one with a ZodError, which the existing mapper renders as VALIDATION_INVALID_FORMAT.
task: sha256:55ce4d2e0585871e82e25d41fe0cfba058a9d98a6bf01d34f827eafe7e2af483
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-edit-request-schema-build
files:
- path: src/modules/curation/dto/edit-entity.dto.ts
  effect: New DTO file, with no comments. It exports EditEntityBodySchema and EditEntityBody. The reason is trimmed, at least 1 and at most 1000 UTF-16 code units, and required as a string. changes is a required array of AttributeChangeSchema, and an empty array passes. Each change has a required string attribute_key and a required kind of "set" or "remove". value, item_id, valid_from and valid_to are each optional, and null parses as not stated, meaning undefined. item_id must be a UUID and the dates must be YYYY-MM-DD. A set change that states no value is refused at path changes.N.value. A remove change that states a value is refused at changes.N.value. A remove change that names no attribute is refused at changes.N.item_id. It also exports ENTITY_EDIT_REASON_MAX_LENGTH, AttributeChangeKindSchema, AttributeChangeSchema and the matching inferred types. Nothing coerces types.
criteria:
- criterion: A reason that holds no character once trimmed is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: EditEntityBodySchema.reason is ReasonRequiredSchema, which trims and then applies min(1). The resulting ZodError goes through mapZodError and becomes VALIDATION_INVALID_FORMAT, because no issue carries a priority custom code.
- criterion: A reason that holds 1001 characters once trimmed is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: ReasonRequiredSchema.max(ENTITY_EDIT_REASON_MAX_LENGTH) is applied after the trim, and the limit is 1000, so a 1001-unit trimmed reason fails.
- criterion: A reason of 1000 characters surrounded by spaces is not refused by the reason-length rule.
  met: true
  how: The trim runs before the max check, so the spaces are not counted.
- criterion: A reason of 500 characters outside the Basic Multilingual Plane, 1000 UTF-16 code units, is not refused by the reason-length rule.
  met: true
  how: Zod's max check compares the JavaScript string length, which counts UTF-16 code units, and 1000 is within the limit.
- criterion: A reason of 501 characters outside the Basic Multilingual Plane, 1002 UTF-16 code units, is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: The string length is 1002, which is above 1000, so the max check fails.
- criterion: A reason of 999 characters inside the Basic Multilingual Plane and one character outside it, 1001 UTF-16 code units, is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: The string length is 1001, which is above 1000, so the max check fails.
- criterion: A body without a reason is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: reason is a required string, so a missing key is an invalid_type issue.
- criterion: A body without a changes field is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: changes is a required z.array with no optional or nullable wrapper.
- criterion: A change without an attribute key is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: attribute_key is a required z.string().
- criterion: A change whose kind is neither set nor remove is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: kind is AttributeChangeKindSchema, which is z.enum(["set","remove"]).
- criterion: A set change that states no value is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: The change's superRefine adds a custom issue at path value when kind is set and value is undefined. Its message is not one of the mapper's priority codes, so mapZodError yields VALIDATION_INVALID_FORMAT.
- criterion: A set change whose value is null is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: null is transformed to undefined before the refinement runs, so it counts as not stated and the set-without-value issue is raised.
- criterion: A remove change that states a value is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: The superRefine adds a custom issue at path value when kind is remove and value is stated.
- criterion: A remove change that names no attribute is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: The superRefine adds a custom issue at path item_id when kind is remove and item_id is undefined.
- criterion: A remove change whose item_id is null is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: null becomes undefined, which counts as naming no attribute, so the remove-without-item issue is raised.
- criterion: A change whose item_id is not a well-formed identifier is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: item_id is the shared UuidSchema with nullish added, so a non-null malformed string fails the uuid check.
- criterion: A change whose valid_from is not written YYYY-MM-DD is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: valid_from is the shared IsoDateSchema, a regex for ^\d{4}-\d{2}-\d{2}$.
- criterion: A change whose valid_to is not written YYYY-MM-DD is refused with VALIDATION_INVALID_FORMAT.
  met: true
  how: valid_to is the shared IsoDateSchema.
- criterion: A shape refusal carries the message "Request payload failed validation.".
  met: true
  how: The schema throws a plain ZodError, and the existing mapZodError in src/modules/curation/mcp/error-envelope.ts renders it with exactly that message. No custom issue message collides with its priority codes.
- criterion: Each issue of a shape refusal carries its path joined by ".".
  met: true
  how: The schema gives every issue its natural Zod path, for example changes.0.value, and the existing mapper's zodIssuesAsDetails joins it with ".".
- criterion: A set change that names no attribute and states a value passes the schema.
  met: true
  how: item_id is nullish and the item rule applies only to remove.
- criterion: A remove change that names an attribute and states no value passes the schema.
  met: true
  how: value is nullish and the value rule refuses a value only when one is stated.
- criterion: A body with a reason and a changes field that is an empty list passes the schema.
  met: true
  how: z.array(AttributeChangeSchema) has no min, so an empty list passes.
- criterion: A set change whose item_id is null parses as a change that names no attribute.
  met: true
  how: item_id is transformed from null to undefined, and the parsed change carries undefined for item_id.
- criterion: A remove change whose value is null parses as a change that states no value.
  met: true
  how: value is transformed from null to undefined.
- criterion: A change whose valid_from is null parses as a change that states no validity start.
  met: true
  how: valid_from is transformed from null to undefined.
- criterion: A change whose valid_to is null parses as a change that states no validity end.
  met: true
  how: valid_to is transformed from null to undefined.
nodes:
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: 'The schema encodes the request-shape part of the edit-entity operation: a body of reason and changes, a field missing, null where it may not be, of the wrong type, outside its closed set, or not a well-formed identifier or YYYY-MM-DD date is refused. The format answer itself (code, message, 422, dotted paths) is produced by the existing mapZodError. The route, the other refusals and the accepted answer belong to other tasks and are not reached.'
- node: domain/knowledge-base/entity-edit
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: EditEntityBodySchema declares reason as a required string and changes as a required list of attribute changes with no minimum, matching the element's attributes.
- node: domain/knowledge-base/attribute-change
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: AttributeChangeSchema declares attribute_key and kind as required, and value, item_id, valid_from and valid_to as optional, with the date type as YYYY-MM-DD and the identifier as a uuid.
- node: domain/knowledge-base/attribute-change-kind
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: AttributeChangeKindSchema is the closed enumeration set and remove.
- node: rules/knowledge-base/entity-edit-reason-length
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: reason is trimmed, then min(1), then max(ENTITY_EDIT_REASON_MAX_LENGTH = 1000). JavaScript string length counts UTF-16 code units, so the rule's unit is respected, and no minimum above 1 is imposed.
- node: rules/knowledge-base/entity-edit-value-matches-the-kind
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: The change's superRefine refuses a set change with no value and a remove change that states one, both at path value.
- node: rules/knowledge-base/entity-edit-removal-names-an-attribute
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: The change's superRefine refuses a remove change whose item_id is not stated, at path item_id.
- node: rules/knowledge-base/entity-edit-null-field-is-not-stated
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: value, item_id, valid_from and valid_to accept null and are transformed to undefined by nullAsNotStated before the cross-field rules run, so null counts as not stated everywhere.
inferences:
- inferred: The parsed reason is the trimmed text, because the schema reuses the shared ReasonRequiredSchema, which trims before checking.
  from: The ReasonRequiredSchema convention in src/modules/curation/dto/enums.dto.js and the task note that the length check counts the trimmed reason. The recording task still owes its own trim under rules/knowledge-base/entity-edit-reason-trimmed.
- inferred: A field that is not stated is represented as undefined, not null, in the parsed output.
  from: rules/knowledge-base/entity-edit-null-field-is-not-stated says null counts as not stated, and a single representation lets later checks test one value. The domain element declares these fields as non-required with no null.
- inferred: The identifier check is the shared UuidSchema, which is z.string().uuid(), and the date check is the shared IsoDateSchema, a regex for YYYY-MM-DD that does not reject impossible calendar dates such as 2024-02-30.
  from: The existing curation DTO convention in src/modules/curation/dto/enums.dto.ts, and the curation contract's own wording "well-formed identifier or YYYY-MM-DD date". No node says whether an impossible date is refused at the shape level.
- inferred: attribute_key and value are plain strings with no minimum length, and keys outside the body schema's declared fields are silently dropped by Zod's default object behaviour.
  from: No node bounds attribute_key or value at the shape level. An unknown key is refused later by BUSINESS_UNKNOWN_ATTRIBUTE_KEY and a bad value by the BUSINESS_INVALID_ATTRIBUTE_VALUE rules, so a shape-level minimum would change which code answers.
- inferred: The refinement messages are plain sentences, not BUSINESS_* codes.
  from: mapZodError in src/modules/curation/mcp/error-envelope.ts promotes any custom issue whose message equals a priority code to that code, so a descriptive message keeps the answer VALIDATION_INVALID_FORMAT.
- inferred: The schema file is named edit-entity.dto.ts and exports EditEntityBodySchema and EditEntityBody.
  from: The edit-entity operation name in the contract, and the existing ConfirmItemBodySchema and ConfirmItemBody naming in src/modules/curation/dto/item.dto.ts.
preserved:
- src/modules/curation/dto/enums.dto.ts and item.dto.ts are untouched, so the exports of IsoDateSchema, UuidSchema and ReasonRequiredSchema keep their behaviour for confirm, reject and correct.
- src/modules/curation/mcp/error-envelope.ts and src/shared/error-mapping.ts are untouched, so the mapping of ZodError to VALIDATION_INVALID_FORMAT keeps its behaviour.
- src/modules/curation/index.ts and src/app.ts are untouched, so the curation route set and MCP whitelist are unchanged.
deferred:
- what: The REST route POST /api/v1/nodes/{node_id}/edit, the service that checks the edit, and the audit action name edit-entity in the compliance-audit DTO.
  why: They belong to later tasks of the epic. This task only builds the request schema.
- what: Existing source files under src/modules/curation, such as item.dto.ts and enums.dto.ts, carry header comments.
  why: This task did not edit them, and the comment rule applies only to files a session writes.
---
## What it is
A Zod schema for the entity edit body, in a new DTO file, that parses a well-formed edit into a reason and its changes. It refuses a malformed one with a ZodError, which the existing mapper renders as VALIDATION_INVALID_FORMAT.

## Notes
Inferred: The parsed reason is the trimmed text, because the schema reuses the shared ReasonRequiredSchema, which trims before checking.
Inferred: A field that is not stated is represented as undefined, not null, in the parsed output.
Inferred: The identifier check is the shared UuidSchema, which is z.string().uuid(), and the date check is the shared IsoDateSchema, a regex for YYYY-MM-DD that does not reject impossible calendar dates such as 2024-02-30.
Inferred: attribute_key and value are plain strings with no minimum length, and keys outside the body schema's declared fields are silently dropped by Zod's default object behaviour.
Inferred: The refinement messages are plain sentences, not BUSINESS_* codes.
Inferred: The schema file is named edit-entity.dto.ts and exports EditEntityBodySchema and EditEntityBody.
Deferred: The REST route POST /api/v1/nodes/{node_id}/edit, the service that checks the edit, and the audit action name edit-entity in the compliance-audit DTO.
Deferred: Existing source files under src/modules/curation, such as item.dto.ts and enums.dto.ts, carry header comments.
