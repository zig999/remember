---
target: backend
title: Review of the backend delivery of the owner's entity edit (entity-edit-backend)
summary: What four passes found over the 46 files the 17 tasks of entity-edit-backend wrote.
reviewed:
- src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
- src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
- src/__tests__/integration/curation/edit-entity-route-harness.ts
- src/__tests__/integration/curation/edit-entity-routing.ts
- src/__tests__/integration/curation/edit-entity.routes.spec.ts
- src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
- src/__tests__/unit/curation/attribute-change-catalog.spec.ts
- src/__tests__/unit/curation/attribute-change-validity.spec.ts
- src/__tests__/unit/curation/edit-entity-answer.spec.ts
- src/__tests__/unit/curation/edit-entity-records.spec.ts
- src/__tests__/unit/curation/edit-entity-refusals.spec.ts
- src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
- src/__tests__/unit/curation/edit-entity-world.ts
- src/__tests__/unit/curation/edit-entity.dto.spec.ts
- src/__tests__/unit/curation/entity-edit-action.spec.ts
- src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
- src/__tests__/unit/curation/entity-edit-attributes.spec.ts
- src/__tests__/unit/curation/entity-edit-correction.spec.ts
- src/__tests__/unit/curation/entity-edit-effect.spec.ts
- src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
- src/__tests__/unit/curation/entity-edit-node.spec.ts
- src/__tests__/unit/curation/entity-edit-note.spec.ts
- src/__tests__/unit/curation/entity-edit-removal.spec.ts
- src/__tests__/unit/curation/entity-edit-succession.spec.ts
- src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
- src/app.ts
- src/modules/compliance-audit/dto/curation-action.dto.ts
- src/modules/curation/dto/edit-entity.dto.ts
- src/modules/curation/index.ts
- src/modules/curation/repository/curation.repository.ts
- src/modules/curation/routes/curation.routes.ts
- src/modules/curation/routes/edit-entity.routes.ts
- src/modules/curation/routes/send-error.ts
- src/modules/curation/service/attribute-change-catalog.ts
- src/modules/curation/service/attribute-change-validity.ts
- src/modules/curation/service/edit-entity.service.ts
- src/modules/curation/service/entity-edit-action.ts
- src/modules/curation/service/entity-edit-attributes.ts
- src/modules/curation/service/entity-edit-correction.ts
- src/modules/curation/service/entity-edit-effect.ts
- src/modules/curation/service/entity-edit-new-attribute.ts
- src/modules/curation/service/entity-edit-node.ts
- src/modules/curation/service/entity-edit-note.ts
- src/modules/curation/service/entity-edit-removal.ts
- src/modules/curation/service/entity-edit-succession.ts
- src/shared/error-mapping.ts
tasks:
- task/entity-edit-backend/apply-entity-edit
- task/entity-edit-backend/assign-change-effect
- task/entity-edit-backend/check-change-key-and-value
- task/entity-edit-backend/check-change-validity
- task/entity-edit-backend/edit-entity-route
- task/entity-edit-backend/edit-refusal-codes
- task/entity-edit-backend/edit-request-schema
- task/entity-edit-backend/read-edit-entity-actions
- task/entity-edit-backend/record-correction
- task/entity-edit-backend/record-edit-action
- task/entity-edit-backend/record-new-attribute
- task/entity-edit-backend/record-operator-note
- task/entity-edit-backend/record-removal
- task/entity-edit-backend/record-succession
- task/entity-edit-backend/refuse-disputed-change
- task/entity-edit-backend/refuse-inactive-node
- task/entity-edit-backend/refuse-stale-change
passes:
- pass: coverage
- pass: conformance
- pass: standard
- pass: failures
  missing: run/entity-edit-backend passed, so there was no failure for the pass to read
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
coverage:
- criterion: BUSINESS_NODE_NOT_ACTIVE renders as HTTP 409 over REST.
  state: covered
  tests:
  - file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > renders BUSINESS_NODE_NOT_ACTIVE as HTTP 409
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: a not-active refusal > is answered HTTP 409 over REST
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: BUSINESS_ENTITY_EDIT_CONFLICT renders as HTTP 409 over REST.
  state: covered
  tests:
  - file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > renders BUSINESS_ENTITY_EDIT_CONFLICT as HTTP 409
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a conflict refusal over REST > for %s is answered HTTP 409
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: BUSINESS_ENTITY_EDIT_DISPUTED renders as HTTP 409 over REST.
  state: covered
  tests:
  - file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > renders BUSINESS_ENTITY_EDIT_DISPUTED as HTTP 409
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a disputed refusal > is answered HTTP 409 over REST with the disputed code
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: BUSINESS_ENTITY_EDIT_NO_CHANGES renders as HTTP 422 over REST.
  state: covered
  tests:
  - file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > renders BUSINESS_ENTITY_EDIT_NO_CHANGES as HTTP 422
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: BUSINESS_UNKNOWN_ATTRIBUTE_KEY raised by an entity edit renders as HTTP 422 over REST.
  state: covered
  tests:
  - file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > renders BUSINESS_UNKNOWN_ATTRIBUTE_KEY raised as a curation business error as HTTP 422 keeping its code and details
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: rendering the catalog refusals over REST > renders a refusal for $label as HTTP 422
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A reason that holds no character once trimmed is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT
- criterion: A reason that holds 1001 characters once trimmed is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A reason of 1000 characters surrounded by spaces is not refused by the reason-length rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT
- criterion: A reason of 500 characters outside the Basic Multilingual Plane, 1000 UTF-16 code units, is not refused by the reason-length rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT
- criterion: A reason of 501 characters outside the Basic Multilingual Plane, 1002 UTF-16 code units, is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT
- criterion: A reason of 999 characters inside the Basic Multilingual Plane and one character outside it, 1001 UTF-16 code units, is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > holds a reason to between 1 and 1000 UTF-16 code units once trimmed, refusing outside it with VALIDATION_INVALID_FORMAT
- criterion: A body without a reason is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a reason and a changes list and neither coerces nor accepts null for them
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A body without a changes field is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a reason and a changes list and neither coerces nor accepts null for them
- criterion: A change without an attribute key is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional
- criterion: A change whose kind is neither set nor remove is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > accepts exactly the change kinds set and remove
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change that states no value is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a change to state a value exactly when its kind is set
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change whose value is null is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a change to state a value exactly when its kind is set
- criterion: A remove change that states a value is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a change to state a value exactly when its kind is set
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A remove change that names no attribute is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a remove change to name an attribute and asks no such thing of a set change
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A remove change whose item_id is null is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a remove change to name an attribute and asks no such thing of a set change
- criterion: A change whose item_id is not a well-formed identifier is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A change whose valid_from is not written YYYY-MM-DD is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A change whose valid_to is not written YYYY-MM-DD is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional
- criterion: A shape refusal carries the message "Request payload failed validation.".
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > refuses with the message "Request payload failed validation."
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: Each issue of a shape refusal carries its path joined by ".".
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > carries each issue's path joined by a dot, for a refinement issue and a field issue alike
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: a shape refusal over REST > carries issues of path and message in its details, each path joined by a dot
- criterion: A set change that names no attribute and states a value passes the schema.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a change to state a value exactly when its kind is set
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a remove change to name an attribute and asks no such thing of a set change
- criterion: A remove change that names an attribute and states no value passes the schema.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires an attribute key and a kind, types each stated field strictly and leaves value, item, validity start and validity end optional
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a change to state a value exactly when its kind is set
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a remove change to name an attribute and asks no such thing of a set change
- criterion: A body with a reason and a changes field that is an empty list passes the schema.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > requires a reason and a changes list and neither coerces nor accepts null for them
- criterion: A set change whose item_id is null parses as a change that names no attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > reads a null value, item, validity start or validity end exactly as the same field left out
- criterion: A remove change whose value is null parses as a change that states no value.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > reads a null value, item, validity start or validity end exactly as the same field left out
- criterion: A change whose valid_from is null parses as a change that states no validity start.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > reads a null value, item, validity start or validity end exactly as the same field left out
- criterion: A change whose valid_to is null parses as a change that states no validity end.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity.dto.spec.ts
    name: EditEntityBodySchema > reads a null value, item, validity start or validity end exactly as the same field left out
- criterion: A set change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a change's key against the catalog > refuses a set change naming a key the catalog does not hold for the node type
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a change's key against the catalog > refuses a key the catalog holds only for another node type
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a change's key against the catalog > refuses an unknown key before reading a value type its name would have under another node type
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A remove change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a change's key against the catalog > refuses a remove change naming a key the catalog does not hold for the node type
- criterion: An unknown-key refusal names the key.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a change's key against the catalog > names the key in an unknown-key refusal
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An unknown-key refusal names the node type.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a change's key against the catalog > names the node type in an unknown-key refusal
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change of 2024-02-30 for a key whose value type is date is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > refuses $label with the invalid-value code
- criterion: A set change of 1e3 for a key whose value type is number is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > refuses $label with the invalid-value code
- criterion: A set change of True for a key whose value type is bool is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > refuses $label with the invalid-value code
- criterion: A refusal for a value that does not read as its type names the value type.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > names the value type in a refusal for a value that does not read as its type
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A refusal for a value that does not read as its type names the value.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > names the value in a refusal for a value that does not read as its type
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change whose value is none of its key's allowed values is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's allowed values > refuses $label with the invalid-value code
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change whose value differs from an allowed value only in letter case is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's allowed values > refuses $label with the invalid-value code
- criterion: A refusal for a value outside the allowed values names the attribute key.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's allowed values > names the attribute key in a refusal for a value outside the allowed values
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A refusal for a value outside the allowed values names the value.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's allowed values > names the value in a refusal for a value outside the allowed values
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A refusal for a value outside the allowed values names the allowed values.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's allowed values > names every allowed value in a refusal for a value outside the allowed values
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change of any text for a text key that has no allowed values is not refused by these rules.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's allowed values > does not refuse $label for a text key with no allowed values
- criterion: A change to a key that is not temporal that states a validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change to a key that is not temporal > is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A change to a key that is not temporal that states a validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change to a key that is not temporal > is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label
- criterion: A change to a key that is not temporal that states no validity is not refused by the stable-key rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change that states no validity to a key that accepts none > is not refused when the key $label
- criterion: A change to a key that records no temporality that states a validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change to a key that records no temporality > is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label
- criterion: A change to a key that records no temporality that states a validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change to a key that records no temporality > is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label
- criterion: A change to a key that records no temporality that states no validity is not refused by the stable-key rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change that states no validity to a key that accepts none > is not refused when the key $label
- criterion: A change whose validity start equals its validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change that states both a validity start and a validity end > is refused with BUSINESS_TEMPORAL_INCOHERENT when its start is $label
- criterion: A change whose validity start falls later than its validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change that states both a validity start and a validity end > is refused with BUSINESS_TEMPORAL_INCOHERENT when its start is $label
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A change to a temporal key whose validity start falls earlier than its validity end is not refused by these rules.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change that states both a validity start and a validity end > is not refused when its start is one day earlier than its end
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a change that states both a validity start and a validity end > is not held to the defaulted-start rule when its end is not after today
- criterion: A set change to a temporal key that states a validity end of today and no validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a set change to a temporal key that states a validity end and no validity start > answers $expected when the end is $label
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a set change to a temporal key that states a validity end and no validity start > takes today as the UTC calendar date when the server zone is behind UTC
- criterion: A set change to a temporal key that states a validity end earlier than today and no validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a set change to a temporal key that states a validity end and no validity start > answers $expected when the end is $label
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change to a temporal key that states a validity end later than today and no validity start is not refused by the defaulted-start rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a set change to a temporal key that states a validity end and no validity start > answers $expected when the end is $label
  - file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a set change to a temporal key that states a validity end and no validity start > takes today as the UTC calendar date when the server zone is ahead of UTC
- criterion: The run's model is operator.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the run an entity edit's note opens > is one run of model operator and prompt version operator-edit-v1, completed, with no network call to a language model
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the LLM run an accepted entity edit of several changes opens > is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language model
- criterion: The run's prompt version is operator-edit-v1.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the run an entity edit's note opens > is one run of model operator and prompt version operator-edit-v1, completed, with no network call to a language model
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the LLM run an accepted entity edit of several changes opens > is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language model
- criterion: The run is recorded as completed.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the run an entity edit's note opens > is one run of model operator and prompt version operator-edit-v1, completed, with no network call to a language model
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the LLM run an accepted entity edit of several changes opens > is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language model
- criterion: Recording the note calls no language model.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the run an entity edit's note opens > is one run of model operator and prompt version operator-edit-v1, completed, with no network call to a language model
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the LLM run an accepted entity edit of several changes opens > is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language model
  why: Covered through a proxy rather than directly. The tests count calls to a stubbed global fetch and run against a fake store that throws on any statement outside the note's records. A model call that went through a client holding its own transport would not register in the fetch count. It would still be expected to fail in the test environment, which is what makes the test bite.
- criterion: The raw information's source type is other.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the raw information an entity edit's note records > has source type other and metadata of operator_note true and the edited node's identity under node_id
- criterion: The raw information's metadata records that it is an operator note.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the raw information an entity edit's note records > has source type other and metadata of operator_note true and the edited node's identity under node_id
- criterion: The raw information's metadata records the edited node's identity.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the raw information an entity edit's note records > has source type other and metadata of operator_note true and the edited node's identity under node_id
- criterion: The raw information's content holds the edit's reason.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the raw information an entity edit's note records > holds in its content the reason, the moment of the edit and a nonce that keeps two notes of one reason and moment apart as two raw informations
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the raw information of two edits with one reason made at one moment > holds in each content the reason and the moment of the edit and differs between the two by a nonce of its own
- criterion: The raw information's content holds the moment of the edit.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the raw information an entity edit's note records > holds in its content the reason, the moment of the edit and a nonce that keeps two notes of one reason and moment apart as two raw informations
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the raw information of two edits with one reason made at one moment > holds in each content the reason and the moment of the edit and differs between the two by a nonce of its own
- criterion: The raw information's content holds a nonce no other note's content holds.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the raw information an entity edit's note records > holds in its content the reason, the moment of the edit and a nonce that keeps two notes of one reason and moment apart as two raw informations
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the raw information of two edits with one reason made at one moment > holds in each content the reason and the moment of the edit and differs between the two by a nonce of its own
- criterion: Two notes with the same reason are recorded as two raw informations.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the raw information an entity edit's note records > holds in its content the reason, the moment of the edit and a nonce that keeps two notes of one reason and moment apart as two raw informations
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the raw information of two edits with one reason made at one moment > holds in each content the reason and the moment of the edit and differs between the two by a nonce of its own
- criterion: One raw chunk holds all of the raw information's content.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: what an entity edit's note records > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: what an accepted entity edit of several changes records as its note > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
- criterion: One information fragment is anchored to that chunk.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: what an entity edit's note records > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: what an accepted entity edit of several changes records as its note > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
- criterion: That fragment's status is accepted.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: what an entity edit's note records > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: what an accepted entity edit of several changes records as its note > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
- criterion: That fragment's confidence is 1.0.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: what an entity edit's note records > records the information fragment at confidence 1.0
- criterion: That fragment's text is the edit's reason.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: what an entity edit's note records > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: what an accepted entity edit of several changes records as its note > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
- criterion: An edit naming an identity at which no knowledge node is held is refused with RESOURCE_NOT_FOUND.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: an edit naming an identity at which no knowledge node is held > is refused with RESOURCE_NOT_FOUND
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An absent-node refusal names the node.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: an edit naming an identity at which no knowledge node is held > is refused with a message and details that name the node
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An edit naming a node whose status is needs-review is refused with BUSINESS_NODE_NOT_ACTIVE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: an edit naming a node, by the status the node holds > is refused for needs_review, merged and deleted and not refused for active
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An edit naming a node whose status is merged is refused with BUSINESS_NODE_NOT_ACTIVE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: an edit naming a node, by the status the node holds > is refused for needs_review, merged and deleted and not refused for active
- criterion: An edit naming a node whose status is deleted is refused with BUSINESS_NODE_NOT_ACTIVE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: an edit naming a node, by the status the node holds > is refused for needs_review, merged and deleted and not refused for active
- criterion: A not-active refusal names the node.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: a not-active refusal > for a %s node names the node
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A not-active refusal names the node's current status.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: a not-active refusal > for a %s node names that status
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: a not-active refusal > for a node under review names the status as needs_review with its underscore, never as needs-review
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An edit naming an active node is not refused by the active-node rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: an edit naming a node, by the status the node holds > is refused for needs_review, merged and deleted and not refused for active
- criterion: A change naming an attribute of its key whose status is superseded is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted only for a live attribute of the edited node and key, and refused as a conflict for every other identity
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute that is no longer live > is refused as a conflict when a set change states another value for the superseded deadline attribute
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a remove change naming an attribute > is refused as a conflict when the attribute is superseded
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose set change names a superseded deadline attribute > is refused as a conflict and records nothing of the edit
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A change naming an attribute of its key whose status is deleted is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted only for a live attribute of the edited node and key, and refused as a conflict for every other identity
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
- criterion: A change naming an attribute of another key of the edited node is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted only for a live attribute of the edited node and key, and refused as a conflict for every other identity
- criterion: A change naming an attribute of another node is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted only for a live attribute of the edited node and key, and refused as a conflict for every other identity
- criterion: A change naming an identity at which no attribute is held is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted only for a live attribute of the edited node and key, and refused as a conflict for every other identity
- criterion: A set change naming a project's deadline attribute that was superseded once the owner had opened the form is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute that is no longer live > is refused as a conflict when a set change states another value for the superseded deadline attribute
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose set change names a superseded deadline attribute > is refused as a conflict and records nothing of the edit
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: a change naming an attribute that another operation superseded while the edit waited for its lock > is refused as a conflict
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change naming a superseded attribute and stating, character for character, that attribute's own value is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute that is no longer live > is refused as a conflict when a set change names a %s attribute and states that attribute's own value
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A set change naming a deleted attribute and stating, character for character, that attribute's own value is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute that is no longer live > is refused as a conflict when a set change names a %s attribute and states that attribute's own value
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A conflict refusal names the change's attribute key.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a conflict refusal naming the key > for %s names the change's attribute key
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A conflict refusal for a change that names an attribute names that attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a conflict refusal naming the attribute > for %s names the attribute the change names
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A change naming an uncertain attribute of its key on the edited node is not refused by the live-attribute rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
- criterion: A set change naming an active attribute that carries a supersession time and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming an attribute that carries a supersession time > is refused as a conflict only when the attribute is active or uncertain and the change states a value other than its own
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change naming an uncertain attribute that carries a supersession time and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming an attribute that carries a supersession time > is refused as a conflict only when the attribute is active or uncertain and the change states a value other than its own
- criterion: A set change naming an active attribute that carries a supersession time and stating, character for character, that attribute's own value is not refused by the supersession-time conflict rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming an attribute that carries a supersession time > is refused as a conflict only when the attribute is active or uncertain and the change states a value other than its own
- criterion: A set change naming an active attribute that carries no supersession time and stating another value is not refused by the supersession-time conflict rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming an attribute that carries a supersession time > is refused as a conflict only when the attribute is active or uncertain and the change states a value other than its own
- criterion: A set change naming no attribute, to a key that does not allow multiple current values while the node holds an active attribute of that key, is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming no attribute > is refused as a conflict only when a single-current key already holds a live attribute of the edited node
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change naming no attribute, to a key that does not allow multiple current values while the node's only attribute of that key is disputed, is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming no attribute > is refused as a conflict only when a single-current key already holds a live attribute of the edited node
- criterion: A set change naming no attribute, to a key that does not allow multiple current values while every attribute the node holds of that key is superseded or deleted, is not refused by the second-current-value rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming no attribute > is refused as a conflict only when a single-current key already holds a live attribute of the edited node
- criterion: A set change naming no attribute, to a key that allows multiple current values while the node holds an active attribute of that key, is not refused by the second-current-value rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a set change naming no attribute > is refused as a conflict only when a single-current key already holds a live attribute of the edited node
- criterion: A set change naming an attribute whose status is disputed and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a set change naming a disputed attribute > is refused as disputed when it states a value other than the attribute's own
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A set change naming an attribute whose status is disputed and stating a value that differs from that attribute's own only in letter case is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
  state: partial
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a set change naming a disputed attribute > is refused as disputed when it states a value differing from the attribute's own only in letter case
  why: The refusal is shown only by calling checkChangeAgainstHeldAttributes directly. No test sends a value that differs only in letter case through an edit. The one in-edit disputed case, the contract table's disputed row, states a wholly different value. So the criterion's stated setting, "in an edit whose request, knowledge node and earlier changes pass their checks", is never exercised for a case-only difference.
- criterion: A set change naming an attribute whose status is disputed and stating, character for character, that attribute's own value is not refused by the dispute rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a set change naming a disputed attribute > is not refused as disputed when it states the attribute's own value character for character
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A remove change naming an attribute whose status is disputed is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
  state: partial
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a remove change naming a disputed attribute > is refused as disputed
  why: The refusal is shown only by calling checkChangeAgainstHeldAttributes directly. No test sends a remove change naming a disputed attribute through an edit, at the service or at the route. The criterion's stated setting, "in an edit whose request, knowledge node and earlier changes pass their checks", is never exercised for a remove change. Nothing shows that the edit sends a disputed removal to this refusal rather than recording it as a removal.
- criterion: A disputed refusal names the attribute key.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a disputed refusal > names the attribute key of the change
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A disputed refusal names the item.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a disputed refusal > names the disputed item
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A change naming an active attribute is not refused by the dispute rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a change naming a live attribute that is not disputed > is not refused as disputed when it sets another value on an %s attribute
  - file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
    name: a change naming a live attribute that is not disputed > is not refused as disputed when it removes an %s attribute
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
- criterion: A set change naming no attribute, to a key of which the node holds no live attribute, gets the effect first-value.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives first-value to a set change naming no attribute when the key holds no attribute
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives first-value to a set change naming no attribute when the key holds only superseded and deleted attributes
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a set change naming no attribute on a key whose node holds no live attribute > is recorded as a new active attribute that names no predecessor, with the effect first_value
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A set change naming no attribute, whose value no active or uncertain attribute of its key holds, to a key that allows multiple current values of which the node holds a live attribute, gets the effect addition.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives addition to a set change naming no attribute whose value no live attribute holds, on a multi-current key holding a live attribute
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives addition when the only holder of the stated value is a deleted attribute and another attribute is live
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
- criterion: A set change naming no attribute, whose value only a disputed attribute of its key holds, to a key that allows multiple current values, gets the effect addition.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives addition when only a disputed attribute of a multi-current key holds the stated value
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A set change naming a current attribute of a temporal key with another value gets the effect succession.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives succession to a set change naming a current attribute of a temporal key with another value
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a set change stating another value for a current attribute of a temporal key > supersedes that attribute and records a new active attribute that names it as the one it supersedes, with the effect succession
- criterion: A set change naming a current attribute of a temporal key that allows multiple current values with another value gets the effect succession.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives succession to a set change naming a current attribute of a temporal key that allows multiple current values with another value
- criterion: A set change naming a current attribute of a key that is not temporal with another value gets the effect correction.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives correction to a set change naming a current attribute of a key that is not temporal with another value
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
- criterion: A set change naming an active attribute of a temporal key that holds a validity end and no supersession time, with another value, gets the effect correction.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives correction to a set change naming an active attribute of a temporal key with a validity end and no supersession time and another value
- criterion: A set change whose value is, character for character, the value of the attribute it names gets the effect unchanged.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives unchanged to a set change whose value is character for character the value of the attribute it names
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives unchanged to a set change stating the own value of a named attribute that has a validity end
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A set change naming a current attribute of a key that is not temporal, with a value that differs from that attribute's own only in letter case, gets the effect correction.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives correction when the value differs from the named attribute's own only in letter case on a key that is not temporal
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A set change naming an attribute with that attribute's own value and another validity start gets the effect unchanged.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives unchanged to a set change naming an attribute with its own value and another validity start
- criterion: A set change naming no attribute, whose value an active attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives unchanged when an active attribute of a multi-current key holds the stated value and no attribute is named
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
- criterion: A set change naming no attribute, whose value an uncertain attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives unchanged when an uncertain attribute of a multi-current key holds the stated value and no attribute is named
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
- criterion: A remove change gets the effect removal.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives removal to a remove change naming one of several live attributes of the key
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a remove change naming a live attribute > marks that attribute deleted with the moment of the edit as its supersession time, records no attribute, and has the effect removal
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
- criterion: The new attribute's status is active.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: the status of the attribute an entity edit records for a first value or an addition > is active
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a set change naming no attribute on a key whose node holds no live attribute > is recorded as a new active attribute that names no predecessor, with the effect first_value
- criterion: The new attribute's confidence is 1.0.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: the confidence of the attribute an entity edit records for a first value or an addition > is 1.0
- criterion: The new attribute is recorded under the edit's LLM run.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: the run of the attribute an entity edit records for a first value or an addition > is the LLM run of the edit's note
- criterion: The new attribute holds a provenance pointing at the edit's information fragment.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: the provenance of the attribute an entity edit records for a first value or an addition > is exactly one, pointing at the edit's information fragment
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the provenance of the new attribute a correction records > holds the edit's information fragment and every provenance of the superseded attribute
- criterion: A set change to a temporal key that states no validity start is recorded with today as its validity start.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a set change to a temporal key that states no validity start, in a server zone behind UTC > is recorded with today's UTC calendar date as the start and the basis received
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a set change to a temporal key that states no validity start, in a server zone ahead of UTC > is recorded with the UTC calendar date of the edit as the start
- criterion: A set change to a temporal key that states no validity start is recorded with the basis received.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a set change to a temporal key that states no validity start, in a server zone behind UTC > is recorded with today's UTC calendar date as the start and the basis received
- criterion: A set change that states a validity start is recorded with that start.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a set change that states a validity start > is recorded with that start and the basis stated
- criterion: A set change that states a validity start is recorded with the basis stated.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a set change that states a validity start > is recorded with that start and the basis stated
- criterion: A first value supersedes no attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a first value > names no attribute it supersedes and leaves the key's historical attribute as it was
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a set change naming no attribute on a key whose node holds no live attribute > is recorded as a new active attribute that names no predecessor, with the effect first_value
- criterion: An addition leaves every other attribute of its key as it was.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: an addition > leaves every other attribute of its key, and of other keys and nodes, as it was
- criterion: The named attribute's status becomes superseded.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the status of the attribute a succession supersedes > is superseded whether or not the succession gives it a validity end
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a set change stating another value for a current attribute of a temporal key > supersedes that attribute and records a new active attribute that names it as the one it supersedes, with the effect succession
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the status of the attribute a correction supersedes > becomes superseded
- criterion: A succession that gives the superseded attribute no validity end gives it the moment of the supersession as its supersession time.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the supersession time of the attribute a succession supersedes > is the moment of the supersession only where the succession gives it no validity end
- criterion: A succession that gives the superseded attribute a validity end leaves its supersession time unset.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the supersession time of the attribute a succession supersedes > is the moment of the supersession only where the succession gives it no validity end
- criterion: The new attribute names the superseded attribute as the one it supersedes.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the new attribute a succession records and the attribute it supersedes > names that attribute as the one it supersedes
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a set change stating another value for a current attribute of a temporal key > supersedes that attribute and records a new active attribute that names it as the one it supersedes, with the effect succession
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the new attribute a correction records > names the superseded attribute as the one it supersedes
- criterion: The superseded attribute's validity end is the new attribute's validity start when that start falls later than the superseded attribute's start.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the validity end of the attribute a succession supersedes > is the new start, and none when the predecessor holds a start the new start does not pass
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a succession with no stated start, made in a server zone behind UTC at a moment whose UTC date differs from the zone's date > gives the superseded attribute that same UTC calendar date as its validity end
- criterion: The superseded attribute is given no validity end when the new start falls on its start.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the validity end of the attribute a succession supersedes > is the new start, and none when the predecessor holds a start the new start does not pass
- criterion: The superseded attribute is given no validity end when the new start falls earlier than its start.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the validity end of the attribute a succession supersedes > is the new start, and none when the predecessor holds a start the new start does not pass
- criterion: A superseded attribute that holds no validity start is given the new attribute's validity start as its validity end.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the validity end of the attribute a succession supersedes > is the new start, and none when the predecessor holds a start the new start does not pass
- criterion: A superseded attribute that holds no validity start is left with its supersession time unset.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the supersession time of the attribute a succession supersedes > is the moment of the supersession only where the succession gives it no validity end
- criterion: A project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start, gives a new deadline whose validity start is 2026-10-07.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start > gives the new deadline the start 2026-10-07 with the basis received, and the earlier deadline the validity end 2026-10-07 and no supersession time
- criterion: In that same edit the new deadline's validity-start basis is received.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start > gives the new deadline the start 2026-10-07 with the basis received, and the earlier deadline the validity end 2026-10-07 and no supersession time
- criterion: In that same edit the earlier deadline is given the validity end 2026-10-07.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start > gives the new deadline the start 2026-10-07 with the basis received, and the earlier deadline the validity end 2026-10-07 and no supersession time
- criterion: In that same edit the earlier deadline's supersession time is left unset.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a project's deadline of 2026-11-30 starting 2026-03-01, set to 2026-12-15 on 2026-10-07 with no stated start > gives the new deadline the start 2026-10-07 with the basis received, and the earlier deadline the validity end 2026-10-07 and no supersession time
- criterion: A project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01, leaves the earlier status with no validity end.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01 > supersedes the earlier status with no validity end and records the new status starting 2026-09-01 with the basis stated
- criterion: In that same edit the new status's validity start is 2026-09-01.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01 > supersedes the earlier status with no validity end and records the new status starting 2026-09-01 with the basis stated
- criterion: In that same edit the new status's validity-start basis is stated.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a project's status starting 2026-10-01, set to another status with a stated start of 2026-09-01 > supersedes the earlier status with no validity end and records the new status starting 2026-09-01 with the basis stated
- criterion: In that same edit the earlier status is given the moment of the supersession as its supersession time.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the supersession time of the attribute a succession supersedes > is the moment of the supersession only where the succession gives it no validity end
- criterion: The named attribute's supersession time is the moment of the supersession.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the supersession time of the attribute a correction supersedes > is the moment of the supersession when the attribute holds no validity end
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the supersession time of the attribute a correction supersedes > is the moment of the supersession when the attribute already holds a validity end
- criterion: A correction of an attribute that already holds a validity end gives it the moment of the supersession as its supersession time.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the supersession time of the attribute a correction supersedes > is the moment of the supersession when the attribute already holds a validity end
- criterion: An organization's active cnpj with no validity, corrected to another cnpj, keeps no validity end once superseded.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: an organization's active cnpj with no validity, corrected to another cnpj > keeps no validity end once superseded
- criterion: In that same edit the new attribute holds the other cnpj.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: an organization's active cnpj with no validity, corrected to another cnpj > is replaced in that edit by a new attribute holding the other cnpj
- criterion: The new attribute holds every provenance of the superseded attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the provenance of the new attribute a correction records > holds the edit's information fragment and every provenance of the superseded attribute
- criterion: The named attribute's status becomes deleted.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
    name: the status of the attribute a removal names > becomes deleted
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a remove change naming a live attribute > marks that attribute deleted with the moment of the edit as its supersession time, records no attribute, and has the effect removal
- criterion: The named attribute's supersession time is the moment of the edit.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
    name: the supersession time of the attribute a removal names > is the moment of the edit
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: a remove change naming a live attribute > marks that attribute deleted with the moment of the edit as its supersession time, records no attribute, and has the effect removal
- criterion: Removing one of a person's two active email attributes leaves the other email active.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
    name: a person's two active email attributes, one of them removed > leaves the other email active
- criterion: The curation action's kind is recorded as edit_entity.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the kind of the curation action an edit records > is written edit_entity
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: The curation action's target kind is node.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the target of the curation action an edit records > is of the kind node
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: The curation action's target identity is the edited node's.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the target of the curation action an edit records > is the edited node's identity
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: The curation action's reason is the edit's reason.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the reason of the curation action an edit records > is the edit's reason, inner whitespace kept
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the edit a request carries > takes the reason of the recorded curation action from the reason field of the JSON body
- criterion: The curation action's payload is an object whose applied field lists one entry for each applied change of the edit.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > is an object holding an applied list
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > lists one entry for each applied change
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: The payload's applied entries are in the order in which the edit's changes were given.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > lists the entries in the order the changes were given
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: Each payload entry carries exactly the fields attribute_key, effect, item_id and predecessor_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > gives each entry exactly attribute_key, effect, item_id and predecessor_id
- criterion: Each payload entry's values are those of the applied change it lists.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > gives an entry the values of the applied change it lists
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: A first-value entry of the payload carries the effect first_value.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > writes the effect of a first-value entry as first_value
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records the edit_entity action on the edited node with the reason and every applied change
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: An unchanged entry of the payload carries item_id as null rather than omitting it.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > carries item_id as null on an unchanged entry rather than omitting it
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: A first-value entry of the payload carries predecessor_id as null rather than omitting it.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the payload of the curation action an edit records > carries predecessor_id as null on a first-value entry rather than omitting it
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
- criterion: Recording the action returns the identity of the curation action it recorded.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > returns the identity of the action it recorded
- criterion: An audit listing over a store holding a curation action recorded with kind edit_entity returns that action.
  state: covered
  tests:
  - file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
    name: Audit listing over curation actions of kind edit_entity > returns an edit_entity curation action held in the store
- criterion: The audit listing's action filter admits edit_entity.
  state: covered
  tests:
  - file: src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
    name: ListCurationActionsQuerySchema action filter over the eight curation action kinds > admits $written as the action filter
  - file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
    name: Audit listing over curation actions of kind edit_entity > returns only edit_entity actions when filtered by action=edit_entity
- criterion: Filtering the audit listing by edit_entity returns no action of another kind.
  state: covered
  tests:
  - file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
    name: Audit listing over curation actions of kind edit_entity > returns only edit_entity actions when filtered by action=edit_entity
- criterion: The audit listing's action filter admits each of the eight kinds of curation-action-kind written with each hyphen as an underscore.
  state: covered
  tests:
  - file: src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
    name: ListCurationActionsQuerySchema action filter over the eight curation action kinds > admits $written as the action filter
- criterion: An accepted edit answers the edited node's identity as node_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > names the edited node's identity as node_id
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the edit a request carries > is applied to the node whose identity the path names, %s
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An accepted edit answers the identity of the curation action it recorded as action_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > names the identity of the curation action the edit recorded as action_id
- criterion: An accepted edit answers exactly one applied entry for each change it was given.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An accepted edit answers its applied entries in the order in which its changes were given.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > writes every effect with an underscore for each hyphen of its enumeration value
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the edit a request carries > takes the changes it applies from the changes field of the JSON body
- criterion: Each applied entry names its change's attribute key.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: Each applied entry carries its change's effect.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > writes every effect with an underscore for each hyphen of its enumeration value
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An unchanged entry carries a null item_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An unchanged entry carries a null predecessor_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A first-value entry carries a null predecessor_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A removal entry carries a null item_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A removal entry carries the removed attribute as its predecessor_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A succession entry carries the new attribute as its item_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
- criterion: A succession entry carries the superseded attribute as its predecessor_id.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > lists one entry per change in the order given, each with its key, its effect, the attribute it recorded and the one it superseded or rejected
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An unchanged change records no attribute.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
    name: a set change whose value is the value the node already holds > is unchanged and records nothing only where it names a live attribute with that value or, naming none, matches character for character an active or uncertain value of a multiple-current key
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > records nothing when every one of its changes is unchanged
- criterion: An edit whose every change is unchanged is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > is refused exactly when no change has an effect other than unchanged, whether every change is unchanged or the list is empty
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > records nothing when every one of its changes is unchanged
- criterion: An edit refused for changing nothing records no raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > records nothing when every one of its changes is unchanged
- criterion: An edit with one unchanged change and one first value is not refused by the changes-something rule.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > is refused exactly when no change has an effect other than unchanged, whether every change is unchanged or the list is empty
- criterion: An edit of an active node with a reason and an empty list of changes is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > is refused exactly when no change has an effect other than unchanged, whether every change is unchanged or the list is empty
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > is refused as changing nothing, with nothing recorded, when an active node is edited with a reason and an empty list of changes
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An edit with an empty list of changes records no raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > is refused as changing nothing, with nothing recorded, when an active node is edited with a reason and an empty list of changes
- criterion: An edit with an empty list of changes records no LLM run.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > is refused as changing nothing, with nothing recorded, when an active node is edited with a reason and an empty list of changes
- criterion: An edit with an empty list of changes records no curation action.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit that changes nothing > is refused as changing nothing, with nothing recorded, when an active node is edited with a reason and an empty list of changes
- criterion: An accepted edit of several changes records one raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: what an accepted entity edit of several changes records as its note > is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
- criterion: An accepted edit of several changes records one LLM run.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the LLM run an accepted entity edit of several changes opens > is one run of model operator and prompt version operator-edit-v1, completed, with no call to a language model
- criterion: An accepted edit records one curation action.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the answer to an accepted entity edit > names the identity of the curation action the edit recorded as action_id
  - file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
    name: the curation action an accepted entity edit records > is one edit_entity action on the edited node carrying the reason and every applied entry in the order given
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: recording the curation action of an edit > records one action for one accepted edit however many changes it applied
- criterion: An accepted edit whose reason was sent surrounded by whitespace records its curation action's reason trimmed of that whitespace.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: an accepted entity edit whose reason was sent surrounded by whitespace > records its action's reason, its fragment's text and its note's content with the reason trimmed of that whitespace
  - file: src/__tests__/unit/curation/entity-edit-action.spec.ts
    name: the reason of the curation action an edit records > is the edit's reason without its surrounding whitespace
- criterion: An accepted edit whose reason was sent surrounded by whitespace records its information fragment's text trimmed of that whitespace.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: an accepted entity edit whose reason was sent surrounded by whitespace > records its action's reason, its fragment's text and its note's content with the reason trimmed of that whitespace
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: a reason with whitespace around it > is recorded as the information fragment's text without that whitespace
- criterion: An accepted edit whose reason was sent surrounded by whitespace records note content that holds the reason trimmed of that whitespace.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: an accepted entity edit whose reason was sent surrounded by whitespace > records its action's reason, its fragment's text and its note's content with the reason trimmed of that whitespace
  - file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: a reason with whitespace around it > is recorded in the raw information's content without that whitespace on either side
- criterion: An edit whose second change is refused leaves no attribute its first change would have recorded.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit refused after an earlier change would have been recorded > leaves no attribute, raw information, LLM run or curation action of the earlier change
- criterion: A refused edit leaves no LLM run.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit refused after an earlier change would have been recorded > leaves no attribute, raw information, LLM run or curation action of the earlier change
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose set change names a superseded deadline attribute > is refused as a conflict and records nothing of the edit
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose last write fails after every other record was written > leaves no raw information, chunk, fragment, run, attribute, provenance or action, and restores every superseded attribute
- criterion: A refused edit leaves no curation action.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit refused after an earlier change would have been recorded > leaves no attribute, raw information, LLM run or curation action of the earlier change
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose set change names a superseded deadline attribute > is refused as a conflict and records nothing of the edit
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose last write fails after every other record was written > leaves no raw information, chunk, fragment, run, attribute, provenance or action, and restores every superseded attribute
- criterion: An edit refused because its set change names a superseded deadline attribute leaves no raw information.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose set change names a superseded deadline attribute > is refused as a conflict and records nothing of the edit
- criterion: A change naming an attribute that another operation superseded while the edit waited for its lock is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: a change naming an attribute that another operation superseded while the edit waited for its lock > is refused as a conflict
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
  why: No real concurrent writer takes part. The fake store marks the named attribute superseded the first time the service issues a statement matching /FOR\s+UPDATE/, and the tests assert the conflict that follows. The tests would fail if this criterion stopped holding. They would also fail if the lock were taken by a statement worded differently, so they are bound to the shape of the SQL as well as to the behavior.
- criterion: A write that a uniqueness guard of the store refuses answers BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: a write that a uniqueness guard of the store refuses > is answered as a temporal incoherence
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: The edit's writes run inside one database transaction.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-records.spec.ts
    name: the writes of an accepted entity edit of several changes > run on one connection inside one transaction that commits, with no statement outside it
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit whose last write fails after every other record was written > leaves no raw information, chunk, fragment, run, attribute, provenance or action, and restores every superseded attribute
- criterion: A change whose valid_from is not written YYYY-MM-DD and whose key the catalog does not hold for the edited node's type is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: an edit failing a format check and a later check > is refused as VALIDATION_INVALID_FORMAT when it carries %s
  why: Proven only through the REST route. The route parses the body before the edit service is called, so the route's schema parse is what sets the order. The service takes a body that is already parsed, and no test calls it with this edit.
- criterion: A change naming a key the catalog does not hold for the edited node's type and whose validity start falls later than its validity end is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: A change naming a key the catalog does not hold for the edited node's type and naming an attribute whose status is superseded is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: A set change whose value does not read as its key's value type and whose validity start falls later than its validity end is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: A set change whose value is none of its key's allowed values and that names an attribute whose status is superseded is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: A change whose validity start falls later than its validity end and that names an attribute whose status is superseded is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: An edit whose body has no reason and that names an identity at which no knowledge node is held is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: an edit failing a format check and a later check > is refused as VALIDATION_INVALID_FORMAT when it carries %s
  why: Proven only through the REST route. The route parses the body before the edit service is called, so the route's schema parse is what sets the order. The service takes a body that is already parsed, and no test calls it with this edit.
- criterion: An edit whose reason holds 1001 characters once trimmed and that names a node whose status is merged is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: an edit failing a format check and a later check > is refused as VALIDATION_INVALID_FORMAT when it carries %s
  why: Proven only through the REST route. The route parses the body before the edit service is called, so the route's schema parse is what sets the order. The service takes a body that is already parsed, and no test calls it with this edit.
- criterion: An edit carrying a change whose valid_from is not written YYYY-MM-DD and naming an identity at which no knowledge node is held is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: an edit failing a format check and a later check > is refused as VALIDATION_INVALID_FORMAT when it carries %s
  why: Proven only through the REST route. The route parses the body before the edit service is called, so the route's schema parse is what sets the order. The service takes a body that is already parsed, and no test calls it with this edit.
- criterion: An edit whose first change names a key the catalog does not hold for the edited node's type and whose second change's kind is neither set nor remove is refused with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: an edit failing a format check and a later check > is refused as VALIDATION_INVALID_FORMAT when it carries %s
  why: Proven only through the REST route. The route parses the body before the edit service is called, so the route's schema parse is what sets the order. The service takes a body that is already parsed, and no test calls it with this edit.
- criterion: An edit naming an identity at which no knowledge node is held and carrying a change whose validity start falls later than its validity end is refused with RESOURCE_NOT_FOUND.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: An edit naming a node whose status is needs-review and carrying a change naming a key the catalog does not hold for that node's type is refused with BUSINESS_NODE_NOT_ACTIVE.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: An edit whose first change names a key the catalog does not hold for the edited node's type and whose second change's validity start falls later than its validity end is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: An edit whose first change's validity start falls later than its validity end and whose second change names a key the catalog does not hold for the edited node's type is refused with BUSINESS_TEMPORAL_INCOHERENT.
  state: covered
  tests:
  - file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
    name: an entity edit failing more than one check > failing %s is refused by the check that comes first
- criterion: An accepted edit answers HTTP 200.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: an accepted entity edit over REST > answers HTTP 200
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: The accepted answer carries node_id, action_id and applied with no envelope.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: an accepted entity edit over REST > answers node_id, action_id and applied with no envelope around them
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
  why: Over-assertion, recorded for routing and not settled here. "answers node_id, action_id and applied with no envelope around them" asserts that the body's top-level keys are exactly action_id, applied and node_id. The contract table's accepted row asserts the whole body by equality. The criterion establishes that the three fields arrive with no envelope. It does not establish that no other top-level field may ever appear.
- criterion: A body the request schema refuses answers HTTP 422 with VALIDATION_INVALID_FORMAT.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: an edit failing a format check and a later check > is refused as VALIDATION_INVALID_FORMAT when it carries %s
- criterion: A shape refusal's details carry issues of path and message.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: a shape refusal over REST > carries issues of path and message in its details, each path joined by a dot
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An edit naming no held node answers HTTP 404 with RESOURCE_NOT_FOUND.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
  - file: src/__tests__/unit/curation/entity-edit-node.spec.ts
    name: an edit naming an identity at which no knowledge node is held > is answered HTTP 404 over REST
- criterion: An edit refused for an unknown attribute key answers HTTP 422 with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An edit refused as a conflict answers HTTP 409 with BUSINESS_ENTITY_EDIT_CONFLICT.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
  - file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: a conflict refusal over REST > for %s is answered HTTP 409
- criterion: An edit that cannot reach the store answers HTTP 503 with SYSTEM_SERVICE_UNAVAILABLE.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: The unavailable answer carries the message "A backing service is temporarily unavailable.".
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: An edit that fails for an unexpected cause answers HTTP 500 with SYSTEM_INTERNAL_ERROR.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: The internal-failure answer carries the message "Internal server error.".
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: The internal-failure answer does not carry the cause.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: A request without a valid owner bearer token is refused without the edit running.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: a request without a valid owner bearer token > carrying %s is refused without the edit running
- criterion: A refusal for a business or validation cause is not logged at error level.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: 'a refusal for a business or validation cause > is not logged at error level: %s'
- criterion: No language-model tool surface lists a tool that edits an entity.
  state: partial
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the language-model tool surfaces > list no tool that edits an entity on the %s transport
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the language-model tool surfaces > list no tool that edits an entity in the chat tool catalog
  why: 'The tests read only tool names. They check the tools/list of the ingest, query and curation MCP transports, and the chat tool catalog, for any name matching /edit/i. A tool that edits an entity under a name without "edit" in it, such as a set_attribute or update_node tool, would be listed and the tests would still pass. So "a tool that edits an entity" is exercised only as a naming pattern. Over-assertion, recorded for routing: the same pattern also refuses any tool whose name merely contains "edit". That includes a read-only edit-history tool, or a name built on "credit", on every surface, which the criterion does not establish.'
- criterion: An accepted edit's applied entry for a first value carries the effect first_value.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: an accepted entity edit over REST > writes the effect of a first value as first_value
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the applied entries of an accepted edit on the wire > writes every effect with an underscore for each hyphen of its enumeration value
  - file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
    name: the answers the entity-editing contract states > answers %s
- criterion: The edit is served for the POST method.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: an accepted entity edit over REST > answers HTTP 200
- criterion: The edit is served at the path /api/v1/nodes/{node_id}/edit.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: an accepted entity edit over REST > answers HTTP 200
- criterion: The edit is applied to the node whose identity the path's node_id segment names.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the edit a request carries > is applied to the node whose identity the path names, %s
- criterion: The edit's reason is read from the reason field of the JSON request body.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the edit a request carries > takes the reason of the recorded curation action from the reason field of the JSON body
- criterion: The edit's changes are read from the changes field of the JSON request body.
  state: covered
  tests:
  - file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the edit a request carries > takes the changes it applies from the changes field of the JSON body
unpaired:
- test:
    file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
    name: Audit listing action filter spelled with a hyphen > answers 422 VALIDATION_INVALID_FORMAT for action=edit-entity
  asserts: GET /api/v1/audit/curation-actions?action=edit-entity answers HTTP 422 with error code VALIDATION_INVALID_FORMAT, so the hyphenated spelling of the kind is refused as a listing filter.
- test:
    file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
    name: Reading one curation action of kind edit_entity > answers 200 carrying the edit_entity action and its recorded fields
  asserts: GET /api/v1/audit/curation-actions/{id} for a stored edit_entity action answers HTTP 200. The body holds the stored id, target_kind node, target_id, payload, reason and created_at, plus an action field that is a string. How the action is spelled is not pinned.
- test:
    file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: a shape refusal over REST > answers HTTP 422 VALIDATION_INVALID_FORMAT for a node_id path segment that is not a well-formed identifier
  asserts: POST /api/v1/nodes/not-a-uuid/edit with a valid body answers HTTP 422 with code VALIDATION_INVALID_FORMAT. A malformed node_id in the path is refused as a format error and is not sent to the store.
- test:
    file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: an edit whose statement times out > answers HTTP 503 SYSTEM_SERVICE_UNAVAILABLE, as an unreachable store does
  asserts: A store error with SQLSTATE 57014 (statement timeout), raised while an attribute is inserted during an edit, answers HTTP 503 with code SYSTEM_SERVICE_UNAVAILABLE.
- test:
    file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
    name: the edit effect enumeration > holds exactly first-value, addition, succession, correction, removal and unchanged
  asserts: EditEffectSchema's options are exactly the six values addition, correction, first-value, removal, succession and unchanged. The same assertion appears in entity-edit-effect.spec.ts as "holds exactly the six edit effects".
- test:
    file: src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
    name: ListCurationActionsQuerySchema action filter over the eight curation action kinds > refuses the hyphen spelling $enumerated as the action filter
  asserts: ListCurationActionsQuerySchema refuses each of the eight curation action kinds when it is written with hyphens, from resolve-entity-match to edit-entity, as the action filter.
- test:
    file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's allowed values > accepts a value equal to an allowed value exactly as written
  asserts: A set change of "active" on a key whose allowed values are active and retired passes checkChangeAgainstCatalog, so a value written exactly as an allowed value is accepted.
- test:
    file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > accepts $label
  asserts: 'Well-formed values pass the value-type check: dates 2024-03-15 and 2024-02-29 (a leap year), numbers 42 and -12.5, and bools true and false.'
- test:
    file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > refuses $label
  asserts: 'Ten malformed values are refused with BUSINESS_INVALID_ATTRIBUTE_VALUE: 2024/03/15, 15-03-2024, 2023-02-29, +5, .5, 0x10, Infinity, a 400-digit number, 1 for a bool and yes for a bool.'
- test:
    file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
    name: checking a set change's value against its key's value type > refuses a value that neither reads as its type nor is allowed by naming the value type
  asserts: For a number key that has allowed values, "abc" is refused with a refusal that names "number". The value-type check therefore answers before the allowed-values check.
- test:
    file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: a set change to a temporal key that states a validity end and no validity start > is not refused when it states neither a validity start nor a validity end
  asserts: checkChangeValidity accepts a set change to a temporal key that states no validity at all.
- test:
    file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
    name: the refusal of a change over REST > answers HTTP 422 for the refusal of $label
  asserts: 'mapErrorToHttpResponse renders three refusals of checkChangeValidity as HTTP 422: a validity on a key that is not temporal, a start that is not before its end, and an end not after today with no start.'
- test:
    file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: the rows a stale-form check reads > are locked when the change names an attribute
  asserts: When a change names an attribute, checkChangeAgainstHeldAttributes issues a SELECT ... FOR UPDATE that locks exactly that attribute's row. This is an assertion on the SQL statement the check issues, an internal call, and not on an outcome.
- test:
    file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
    name: the rows a stale-form check reads > include the live attributes of the key, locked, when a set change names none
  asserts: When a set change names no attribute, checkChangeAgainstHeldAttributes reads the key's live attributes with FOR UPDATE, so the live row is among the locked ids. This is an assertion on the SQL statement the check issues, an internal call, and not on an outcome.
- test:
    file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
    name: the state of the new attribute a correction records > is active even when the superseded attribute was uncertain and held a validity end
  asserts: Correcting an uncertain deadline that holds a validity end records the new attribute with status active, not with the superseded attribute's status.
- test:
    file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives correction to a set change naming an active attribute of a key that is not temporal with a validity end and no supersession time and another value
  asserts: decideChangeEffect gives correction to a set change that states another value for an active attribute that holds a validity end and no supersession time, on a key that is not temporal.
- test:
    file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: gives correction to a set change naming an uncertain attribute of a temporal key with a validity end and no supersession time and another value
  asserts: decideChangeEffect gives correction, not succession, to a set change that states another value for an uncertain attribute of a temporal key that holds a validity end and no supersession time.
- test:
    file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: holds exactly active, uncertain and disputed as the live statuses
  asserts: LIVE_STATUSES is exactly active, disputed and uncertain.
- test:
    file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: holds exactly set and remove as the change kinds
  asserts: AttributeChangeKindSchema's options are exactly remove and set.
- test:
    file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: holds exactly the five assertion statuses
  asserts: AssertionStatusSchema's options are exactly active, deleted, disputed, superseded and uncertain. This is a totality claim over a shared enumeration.
- test:
    file: src/__tests__/unit/curation/entity-edit-effect.spec.ts
    name: holds exactly the six edit effects
  asserts: EditEffectSchema's options are exactly addition, correction, first-value, removal, succession and unchanged.
- test:
    file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a new attribute of a key that is not temporal > holds no validity start, no validity end and no basis, whether or not the change states a validity
  asserts: recordNewAttribute writes valid_from, valid_to and valid_from_source as absent or null for a key that is not temporal, both when the change states no validity and when it states a start and an end.
- test:
    file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
    name: a set change to a temporal key and the validity end it states > is recorded holding that end, or none when it states none, whether or not it states a start
  asserts: recordNewAttribute stores the change's stated valid_to on the new attribute, whether or not a start is also stated, and stores none when the change states no end.
- test:
    file: src/__tests__/unit/curation/entity-edit-note.spec.ts
    name: the run that holds an entity edit's note > is the run the edit opened, never a run that already existed, for both the fragment and the raw information it is anchored in
  asserts: With an unrelated run already in the store, the note's fragment is recorded under the operator / operator-edit-v1 run, and that run's input raw information is the note's own raw information.
- test:
    file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
    name: a person's two active email attributes, one of them removed > gives the other email no supersession time
  asserts: After one of two emails is removed, the other email's superseded_at is still null.
- test:
    file: src/__tests__/unit/curation/entity-edit-removal.spec.ts
    name: a person's two active email attributes, one of them removed > leaves an attribute of another key on the same node exactly as it was
  asserts: Removing an email leaves the node's phone attribute, of another key, deep-equal to its seeded row.
- test:
    file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: a succession with no stated start, made in a server zone behind UTC at a moment whose UTC date differs from the zone's date > gives the new attribute the UTC calendar date of the edit as its start
  asserts: With TZ=America/Sao_Paulo and an edit at 2026-10-07T23:30-03:00, a succession with no stated start records the new attribute's valid_from as 2026-10-08, the UTC date.
- test:
    file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the provenance of the new attribute a succession records > holds the edit's information fragment
  asserts: A succession writes a provenance row that links its new attribute to the edit's fragment.
- test:
    file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the state of the new attribute a succession records > is active at confidence 1.0 under the LLM run of the edit's note
  asserts: The attribute a succession records has status active, confidence 1.0 and created_by_run_id equal to the note's run.
- test:
    file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
    name: the validity end of the new attribute a succession records > is the end the change states, or none when it states none
  asserts: The attribute a succession records holds the change's stated valid_to (2027-01-31), and holds none when the change states no end.
- test:
    file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > keeps BUSINESS_UNKNOWN_ATTRIBUTE_KEY at HTTP 404 when rendered by code for the retrieval surface
  asserts: The shared renderErrorEnvelope still maps BUSINESS_UNKNOWN_ATTRIBUTE_KEY to HTTP 404 when it renders by code alone.
- test:
    file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > logs %s as a warning and never at error level
  asserts: renderErrorEnvelope returns logLevel "warn" for BUSINESS_NODE_NOT_ACTIVE, BUSINESS_ENTITY_EDIT_CONFLICT, BUSINESS_ENTITY_EDIT_DISPUTED, BUSINESS_ENTITY_EDIT_NO_CHANGES and BUSINESS_INVALID_ATTRIBUTE_VALUE. The edit route renders its errors through sendError and mapErrorToHttpResponse, not through this renderer. The test also pins "warn" exactly, which is more than "not at error level".
- test:
    file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
    name: entity edit refusal codes rendered over REST > renders BUSINESS_INVALID_ATTRIBUTE_VALUE as HTTP 422 instead of an internal failure
  asserts: renderErrorEnvelope maps BUSINESS_INVALID_ATTRIBUTE_VALUE to HTTP 422.
findings:
- pass: conformance
  file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  where: CONTRACT_ROWS, the `details` objects the expected refusals pin, lines 285, 293-296, 303-306, 313-316, 323-327, 361-364, 393, 403-406 and 425-428.
  evidence: 'expected: refusedWith(404, NOT_FOUND_CODE, { node_id: ABSENT_NODE_ID }),

    expected: refusedWith(409, NOT_ACTIVE_CODE, { node_id: NEEDS_REVIEW_NODE_ID, status: "needs_review" }),

    expected: refusedWith(422, UNKNOWN_KEY_CODE, { attribute_key: UNCATALOGUED_KEY, node_type: "Project" }),

    expected: refusedWith(422, INVALID_VALUE_CODE, { value_type: "date", value: "not-a-date" }),

    allowed_values: expect.arrayContaining([PHASE_VALUE, OTHER_PHASE_VALUE]),'
  cost: The test fixes the wire field names of each refusal's `details`. Those names are `node_id`, `status`, `attribute_key`, `node_type`, `value_type`, `value`, `allowed_values` and `item_id`. The contract says only that the refusal "names" the node, the key and the node type, and so on, and it gives no field name. So a client of the edit route would look in the contract for the shape of `details`, find none, and have to read this test to learn it. A change of a name would be decided here and never reach the contract.
  correction: Analysis would have to give the field names of each entity-edit refusal's `details` a home in contracts/knowledge-base/entity-editing. Alternatively, the test would assert only the code and the HTTP status, which the contract does state.
  kind: unstated
- pass: conformance
  file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  where: namedBy(), lines 124-130, used by the it.each over PATH_NODES (lines 206-219)
  evidence: '`return answer.node_id ?? answer.error?.details?.node_id;`'
  cost: The test fixes the wire key `details.node_id` as the place a refusal names the node. The contract says only that the refusal is "naming the node". A reader who looks in the specification for where the refused node's identity travels finds no key, and the test is then the only place that decides it. A later change of that key would fail here with no node to say which side was decided.
  correction: Give the entity-editing contract the key under which BUSINESS_NODE_NOT_ACTIVE and RESOURCE_NOT_FOUND carry the node's identity in `details`. Alternatively, have the test assert only what the contract states.
  kind: unstated
- pass: conformance
  file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  where: the assertion of the raw information's source type, in the test "has source type other and metadata of operator_note true and the edited node's identity under node_id" (line 298)
  evidence: 'source_type: "outro",'
  cost: The spelling in which a source type of other is stored sits only in this test. The node says only "source type other". The rule that gives "outro" as the material's word governs how a source type crosses the wire, not how it is stored. Someone who changes the stored spelling reads the specification, finds no stored spelling there, and has no node that tells them this assertion is the one to update.
  correction: Analysis would have to decide whether the stored spelling of a source type is a fact of the specification. If it is, a node holds it, either rules/knowledge-base/a-source-type-crosses-the-wire-in-the-materials-words extended beyond the wire or a new rule. If it is not, the assertion should not pin the stored spelling.
  kind: unstated
- pass: conformance
  file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  where: the it.each over ENTITY_EDIT_BUSINESS_REFUSALS, lines 85-92, and the list declared at lines 11-17
  evidence: '"logs %s as a warning and never at error level" ... expect(result.logLevel).toBe("warn");'
  cost: The node says only that a business or validation refusal is never logged at error level. The test fixes the level at warn for each entity edit refusal code. A later change to info or debug stays inside the node and still fails this test. The next reader will take warn as a decision the business made, and will look in the specification for it and not find it. The node's decision log mentions warn only for the chat streaming case.
  correction: Either the constraint gains the level its refusals are logged at, or the assertion narrows to what the node holds, that the level is not error.
  kind: unstated
- pass: conformance
  file: src/app.ts
  where: the fallback origins of `corsOrigins`, lines 65-68, passed as `origin` to `fastifyCors` at line 69
  evidence: const corsOrigins = env.CORS_ORIGINS ?? [ "http://localhost:5173", "http://127.0.0.1:5173", ];
  cost: Which origins may call the system when no origin list is configured is decided only here. The specification states that an allowed origin is echoed back, and never which origins are allowed or what the default is. A reader looking in the specification for who may reach the API finds no answer.
  correction: The analysis would have to give the default allowed origins a node, or state that the list comes from configuration alone and has no default. The constraint on answers carrying the allowed origin does not decide this.
  kind: unstated
- pass: conformance
  file: src/app.ts
  where: the `/_self` route registered on the authenticated scope, lines 83-86
  evidence: 'scoped.get("/_self", async (request) => ({ ok: true, result: { user_id: request.user?.id ?? null }, }));'
  cost: The code serves an operation at GET /api/v1/_self that answers the caller's identity as `user_id`, null when none. No node of the specification names this operation or its answer. The access contract lists only authenticate-owner, route-request and read-health, so a client depends on an answer nobody decided.
  correction: The analysis would have to add this operation and its answer to a contract, or remove the route. The access contract is the nearest home.
  kind: unstated
- pass: conformance
  file: src/app.ts
  where: the `toolNames` allowlist of `registerIngestMcpTransport`, line 114
  evidence: '"get_ingestion_status",'
  cost: This allowlist names an ingest tool, `get_ingestion_status`, that no node holds. The ingestion contract holds `ingest_document`, `ingest_directed` and `list_recent_ingestions`, and `health` belongs to the access contract. A status tool is also what an asynchronous ingestion would need, and the ingest toolset is constrained not to offer one. The name's presence cannot be weighed against the specification.
  correction: Either the analysis gives the tool a node, or the allowlist drops the name. Nothing outside this file was read to learn whether a tool by this name is registered.
  kind: unstated
- pass: conformance
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: TargetKindSchema, the last enumeration member (line 22)
  evidence: '"raw_information",'
  cost: The curation-target-kind node holds this member as `raw-information`. The only rule that writes hyphens as underscores for curation actions, a-curation-action-kind-is-written-with-underscores, covers the action kind and nothing else. The target-kind filter value a listing accepts is therefore decided only in this schema. The next reader looks in the specification for how `raw-information` is spelled on the wire and finds the hyphen form. A client that follows the node and sends `raw-information` is refused as outside the closed set.
  correction: The analysis should decide the wire spelling of a curation target kind. It could add a rule beside a-curation-action-kind-is-written-with-underscores, or extend that rule to the target kind. The file would then hold a fact a node states.
  kind: unstated
- pass: conformance
  file: src/modules/curation/repository/curation.repository.ts
  where: the reject-rate query inside aggregateCurationMetrics, the rejectsRes statement
  evidence: '`SELECT (payload->>''error_code'') AS code,` ... `WHERE action = ''reject_item'' AND payload ? ''error_code''`'
  cost: The name of the payload field that carries a rejection's error code is stated only in this query. The node says only that a reject-item action's payload "carries" an error code. No node names the field or says what counts as one. A writer of reject-item payloads that spells the field differently drops out of the rate silently, and the next reader looks in the specification for the field's name and finds nothing.
  correction: Analysis would have to give the field that a reject-item curation action's payload carries its error code under a name, held by rules/knowledge-base/reject-rate-by-code or by a node on the payload's shape. The query then reads that name.
  kind: unstated
- pass: conformance
  file: src/modules/curation/routes/curation.routes.ts
  where: the catch block of the GET /metrics handler, lines 80-98 (the logger.warn call)
  evidence: 'deps.logger.warn({ route: "GET /api/v1/curation/metrics", operation: "getCurationMetrics", transport: "rest", original_status: statusCode, outcome: degradedStatus, error_code: degradedEnvelope.error.code, ... cause_message: err instanceof Error ? err.message : String(err), }, "curation_metrics_degraded")'
  cost: The log name, the warn level, and the choice to log the cause of a degraded metrics read live only in this handler. Specification constraints do hold the logging facts of curation (a failed write is logged at error level as curation_request_failed), so the next reader looks for this one there and finds nothing. A person tuning alerts could not tell that a degraded read is logged at warn and a failed write at error.
  correction: An analysis would have to decide whether a degraded metrics read is logged, under what name, at what level and with what fields. It would give that fact a node, probably a refusal clause of read-curation-metrics in contracts/knowledge-base/curation or a sibling logging constraint.
  kind: unstated
- pass: conformance
  file: src/modules/curation/service/edit-entity.service.ts
  where: lazyNote(), line 86, together with the removal branch of recordChange(), lines 204-211. scope.noteOf is called only from writeNewAttribute(), line 178.
  evidence: '`recorded ??= recordOperatorNote(client, input);` and, in the removal branch, `await recordRemoval(scope.client, {` with `attributeId: removedId,` and `editedAt: scope.editedAt,`. The only call of the note is `note: await scope.noteOf(),` inside writeNewAttribute.'
  cost: The node says an accepted entity edit records one raw information, one raw chunk and one accepted information fragment whose text is the reason. This file records them only when a change writes a new attribute. An edit made only of remove changes, such as the scenario that empties one email, is accepted. It rejects the attribute and records its curation action, but it records no note. recordRemoval is handed only `attributeId` and `editedAt`, and recordEditAction only `nodeId`, `reason` and `applied`. Neither receives the note or `scope.noteOf`. The removal then has no raw information, chunk or fragment behind its reason. The decision log of entity-edit-removal says "the note for the same edit records that moment", which assumes the note exists for a removal. A reader who trusts the node will not find the case where the code skips it.
  correction: Make the note unconditional for an accepted edit. Either call scope.noteOf() once an edit is known to change something, before recordEditAction, or drop the laziness. Also state in the specification where the LLM run opens, if an edit that records no note is intended.
  kind: contradicts
- pass: conformance
  file: src/shared/error-mapping.ts
  where: codeToHttpStatus, the RESOURCE_ALREADY_EXISTS entry (line 55)
  evidence: 'RESOURCE_ALREADY_EXISTS: 409,'
  cost: The code and its status exist only in this table. A reader who looks in the specification for what an "already exists" refusal answers finds no node that names the code or its status. The table becomes the place where that decision lives.
  correction: An analysis would have to give the code and its status a node (a contract refusal), or the entry would have to go if no operation answers it.
  kind: unstated
- pass: conformance
  file: src/shared/error-mapping.ts
  where: codeToHttpStatus, the BUSINESS_UNKNOWN_ATTRIBUTE_KEY entry (line 66)
  evidence: 'BUSINESS_UNKNOWN_ATTRIBUTE_KEY: 404,'
  cost: The entity-edit contract says this refusal is HTTP 422 over REST. This table, the only place a code is turned into a status, says 404. Unless the edit route overrides the status, an edit that names a key the catalog does not hold answers a status the contract does not give. The retrieval contract (not in this node set) states 404 for the same code, so one code holds two statuses in the specification and one slot in the code.
  correction: The code-to-status table cannot hold both statuses. Either the edit route sets 422 for this operation, or the specification settles which operation owns the code's status.
  kind: contradicts
- pass: conformance
  file: src/shared/error-mapping.ts
  where: codeToHttpStatus, the BUSINESS_CHAT_INGEST_DISABLED entry (line 99)
  evidence: 'BUSINESS_CHAT_INGEST_DISABLED: 503,'
  cost: A refusal code and its HTTP status that no node in the specification holds. A reader looking in the specification for when chat ingestion is disabled, and what it answers, finds nothing. The decision lives only in this table.
  correction: An analysis would have to give the code a node, probably in the chat conversations contract, or the entry would have to go if nothing answers it.
  kind: unstated
- pass: conformance
  file: src/shared/error-mapping.ts
  where: renderErrorEnvelope, the logLevel derivation (line 120), together with the codeToHttpStatus entries BUSINESS_CHAT_DISABLED and BUSINESS_CHAT_INGEST_DISABLED (lines 94 and 99)
  evidence: 'const logLevel: "warn" | "error" = statusCode >= 500 ? "error" : "warn"; — applied to BUSINESS_CHAT_DISABLED: 503, and to BUSINESS_CHAT_INGEST_DISABLED: 503,'
  cost: The constraint says a refusal for a business cause is never logged at error level, except a failure to build the model provider at the start of a chat turn. Every BUSINESS_* code mapped to 5xx is logged at error. That includes the chat-disabled refusals, which are plain business refusals and not provider-build failures. A switched-off chat surface therefore raises error-level log noise that the owner decided it should not.
  correction: The log level would have to follow the cause of the refusal, not the status. Only the provider-build failure at a chat turn's start may be error, and the other BUSINESS_ and VALIDATION_ codes stay at warn whatever their status.
  kind: contradicts
- pass: standard
  file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  where: module-level fixtures, lines 39 and 51
  cites: CON-02
  evidence: 'const envFixture = Object.freeze({

    [...]

    const silentLogger = pino({ level: "silent" });'
  cost: These are fixed module-level values, but they are named like local variables. The sibling harness names the same fixture `ENV`. A reader cannot tell from the name that the value is a constant shared by every test in the file.
  correction: Name them in screaming snake case (`ENV_FIXTURE`, `SILENT_LOGGER`), or reuse the harness's `ENV` (see the MNT-03 finding on this file).
- pass: standard
  file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  where: envFixture (lines 39-49), buildAuthFixture and signValidJwt (lines 115-132)
  cites: MNT-03
  evidence: "const envFixture = Object.freeze({\n  NODE_ENV: \"test\",\n  PORT: 3000,\n  [...]\n  NEON_AUTH_JWKS_TTL_S: 600,\n}) as Env;\n[...]\nasync function buildAuthFixture(): Promise<AuthFixture> {\n  const { privateKey, publicKey } = await generateKeyPair(\"RS256\", {\n[the same environment fixture and the same RS256 key and JWT signing exist in src/__tests__/integration/curation/edit-entity-route-harness.ts as `ENV`, `generateSigningKey` and `signToken`]"
  cost: The environment fixture and the JWT signing are written twice. A change to the auth contract (algorithm, claims, a new `Env` field) has to be made in both. The copy that is forgotten keeps authenticating against a fixture production no longer accepts.
  correction: Import the environment fixture and the key and token helpers from the harness instead of redefining them.
- pass: standard
  file: src/__tests__/integration/curation/edit-entity-route-harness.ts
  where: acceptedOf and refusalOf, lines 204-210
  cites: TYP-02
  evidence: "export function acceptedOf(answer: Answer): AcceptedWire {\n  return answer.body as AcceptedWire;\n}\n\nexport function refusalOf(answer: Answer): RefusedWire {\n  return answer.body as RefusedWire;\n}"
  cost: The wire shape of the answer is asserted, not checked. When the route answers with a different shape, the specs dereference `undefined` and fail with a TypeError far from the cause. Alternatively they pass against a body nothing verified.
  correction: Narrow `answer.body` with a guard or a parse before returning it as `AcceptedWire` or `RefusedWire`.
- pass: standard
  file: src/__tests__/unit/curation/edit-entity-answer.spec.ts
  where: file name and the describe blocks at lines 23 and 59
  cites: TST-04
  evidence: "describe(\"the answer to an accepted entity edit\", () => {\n[...]\n  const answer = await world.edit(mixedEdit());"
  cost: The unit under test is `src/modules/curation/service/edit-entity.service.ts`, and no spec carries its name. Its tests are spread over four topic-named files (`edit-entity-answer`, `-records`, `-refusals`, `-unchanged`) plus `edit-entity-world.ts`. Someone changing the service cannot find its tests from the file they are editing.
  correction: Place the service's tests in a spec that mirrors its path and name under `src/__tests__/unit/`.
- pass: standard
  file: src/__tests__/unit/curation/edit-entity-records.spec.ts
  where: file name and the describe blocks, for example line 61
  cites: TST-04
  evidence: "describe(\"a set change naming no attribute on a key whose node holds no live attribute\", () => {\n[...]\n  const answer = await world.edit(editOf([setChange(\"phase\", PHASE_VALUE)]));"
  cost: The file exercises `editEntityService` through `world.edit` but is named for a topic, not for the unit. A test of the service's recording behaviour is not found from the service's file name, so it can be written a second time elsewhere.
  correction: Place the service's tests in a spec that mirrors the service's path and name.
- pass: standard
  file: src/__tests__/unit/curation/edit-entity-refusals.spec.ts
  where: file name and the describe blocks, for example line 143
  cites: TST-04
  evidence: "describe(\"an entity edit that changes nothing\", () => {\n[...]\n  const code = await settledCode(world, editOf([UNCHANGED]));"
  cost: The refusals of `edit-entity.service.ts` are tested in a file whose name does not lead to it. The service's refusal tests are separated from its record tests, and nothing says that all four `edit-entity-*.spec.ts` files cover one unit.
  correction: Place the service's tests in a spec that mirrors the service's path and name.
- pass: standard
  file: src/__tests__/unit/curation/edit-entity-unchanged.spec.ts
  where: file name and describe at line 151
  cites: TST-04
  evidence: "describe(\"a set change whose value is the value the node already holds\", () => {\n[...]\n  const answer = await world.edit(body);"
  cost: The file is named for a scenario, not for the unit, so the service's tests stay scattered. Its only link to the unit is the `world.edit` call inside a helper.
  correction: Place the service's tests in a spec that mirrors the service's path and name.
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  where: parseInsert (lines 99-118) and supersedeStatement (lines 120-131)
  cites: MNT-03
  evidence: "function parseInsert(\n  sql: string,\n  params: unknown[]\n): { table: string; values: Row } {\n  const match = INSERT_PATTERN.exec(sql.replace(/now\\(\\)/gi, \"NOW\"));\n[the same function, with a different error text, is in entity-edit-new-attribute.spec.ts (line 122), entity-edit-succession.spec.ts (line 113) and edit-entity-world.ts (line 285)]"
  cost: The fake store's INSERT parser exists in four copies, and `supersedeStatement` in two. When the repository's SQL changes shape, each copy has to be updated. The copy that is missed parses the old shape and keeps its spec green against a statement production no longer issues.
  correction: Move the shared fake SQL helpers (insert parsing, supersede, copy provenance) into one test helper that the specs import.
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-new-attribute.spec.ts
  where: parseInsert, lines 122-141
  cites: MNT-03
  evidence: "function parseInsert(\n  sql: string,\n  params: unknown[]\n): { table: string; values: Row } {\n  const match = INSERT_PATTERN.exec(sql.replace(/now\\(\\)/gi, \"NOW\"));\n[identical body to entity-edit-correction.spec.ts line 99 and entity-edit-succession.spec.ts line 113]"
  cost: One more copy of the fake INSERT parser. Fixing a parsing gap (quoted column names, for example, which edit-entity-world.ts already strips) has to be repeated in each copy.
  correction: Import a single shared parser from a test helper.
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  where: acceptFragmentStatement and closeRunStatement (lines 146-166), insertRawChunkStatement (lines 85-101)
  cites: MNT-03
  evidence: "function acceptFragmentStatement(\n  { store }: Context,\n  params: unknown[]\n): QueryResult {\n  const fragment = store.fragment.find(\n    (row) => row.id === params[0] && row.status === \"proposed\"\n  );\n[edit-entity-world.ts lines 436-443 hold the same logic as `acceptFragment`, and lines 341-354 hold `insertChunks`]"
  cost: The fake store's handlers for accepting a fragment, closing a run and inserting chunks are written a second time. The two fakes can disagree about what the repository's statement does. A spec then passes on one fake and would fail on the other.
  correction: Reuse the handlers from `edit-entity-world.ts`, or extract them to a shared helper.
- pass: standard
  file: src/__tests__/unit/curation/entity-edit-succession.spec.ts
  where: parseInsert and supersedeStatement, lines 113-145
  cites: MNT-03
  evidence: "function supersedeStatement(store: Store, params: unknown[]): QueryResult {\n  const [id, validTo, supersededAt] = params;\n  const row = store.attributes.find(\n    (candidate) =>\n      candidate.id === id && LIVE_STATUSES.includes(String(candidate.status))\n  );\n[identical to entity-edit-correction.spec.ts lines 120-131]"
  cost: The supersede fake is duplicated verbatim. A change to which statuses count as live in the fake has to be made in both specs, and in `edit-entity-world.ts`'s `updateAttribute` as well.
  correction: Import one shared supersede and insert fake.
- pass: standard
  file: src/app.ts
  where: buildApp, lines 53-200
  cites: MNT-01
  evidence: 'export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {

    [the function runs from line 53 to line 200, 148 lines]'
  cost: The route wiring of every module, the MCP transports and the toolsets are in one 148-line body. Each new `registerEditEntityRoute`-style addition is another conditional branch in a function nobody can hold in their head. The order dependencies between the registrations are visible only by reading all of it.
  correction: Extract named helpers per concern (REST routes, MCP transports, toolsets) and have `buildApp` call them.
- pass: standard
  file: src/app.ts
  where: Fastify options, line 59
  cites: TYP-02
  evidence: 'loggerInstance: logger as unknown as FastifyBaseLogger,'
  cost: The cast turns off the compiler's check that the pino `Logger` satisfies Fastify's logger interface, with no guard. A mismatch on a pino or Fastify upgrade shows up at runtime in request logging.
  correction: Narrow the logger with a guard, or type `AppDependencies.logger` as `FastifyBaseLogger` so no cast is needed.
- pass: standard
  file: src/app.ts
  where: CORS origin fallback, lines 65-68
  cites: SEC-03
  evidence: "const corsOrigins = env.CORS_ORIGINS ?? [\n  \"http://localhost:5173\",\n  \"http://127.0.0.1:5173\",\n];"
  cost: Environment URLs are fixed in source as the default. Any deployment that forgets `CORS_ORIGINS` silently allows these two origins instead of failing, and the default can only be changed by editing code.
  correction: Require `CORS_ORIGINS` from the environment schema, or give the default through the environment configuration, not in the route wiring.
- pass: standard
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: CurationActionListSchema, lines 62-68
  cites: API-01
  evidence: "export const CurationActionListSchema = z.object({\n  total: z.number().int().min(0),\n  limit: z.number().int().min(1),\n  offset: z.number().int().min(0),\n  items: z.array(CurationActionSchema),\n});"
  cost: The paginated envelope (`total`, `limit`, `offset`, `items`) is declared again in this module. If the shared `PaginatedResponse` in `src/types/pagination.ts` changes, this listing keeps promising the old shape, and nobody can say which of the two the API promised.
  correction: Import `PaginatedResponse` from `src/types/pagination.ts` and parameterize it with `CurationActionSchema`.
- pass: standard
  file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: CurationActionIdParamSchema, lines 70-72
  cites: DTO-02
  evidence: "export const CurationActionIdParamSchema = z.object({\n  curationActionId: UuidSchema,\n});"
  cost: The schema has no inferred type beside it, unlike every other schema in the file. Callers that need the parameter type will write it by hand, and it can drift from the schema.
  correction: Add `export type CurationActionIdParam = z.infer<typeof CurationActionIdParamSchema>;`.
- pass: standard
  file: src/modules/curation/dto/edit-entity.dto.ts
  where: EditEntityBodySchema and EditEntityBody, lines 63-67, and the file name
  cites: DTO-03
  evidence: "export const EditEntityBodySchema = z.object({\n  reason: ReasonRequiredSchema.max(ENTITY_EDIT_REASON_MAX_LENGTH),\n  changes: z.array(AttributeChangeSchema),\n});\nexport type EditEntityBody = z.infer<typeof EditEntityBodySchema>;"
  cost: The edit request is named after its transport part (`Body`) rather than its use case. The type does not carry the `Dto` suffix, and the file is `edit-entity.dto.ts`, not `update-entity.dto.ts`. Someone looking for the shape the update route accepts has to know that this module spells Update as `Edit...Body`.
  correction: Name them `UpdateEntitySchema` and `UpdateEntityDto` in `update-entity.dto.ts`, or have the standard state that `Edit` is the use-case word here.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: loadItemsForUpdate, lines 159-197
  cites: MNT-01
  evidence: "export async function loadItemsForUpdate(\n  client: PoolClient,\n  itemKind: ItemKind,\n  itemIds: readonly string[]\n): Promise<ItemLockedRow[]> {\n[the function runs from line 159 to line 197, 39 lines]"
  cost: Two statements, one per item kind, are held in one function. A change to the locked column list has to be made in two branches of the same body.
  correction: Extract one named function per item kind and let `loadItemsForUpdate` choose between them.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: adjustItemPeriod, lines 328-357
  cites: MNT-01
  evidence: "export async function adjustItemPeriod(\n  client: PoolClient,\n  itemKind: ItemKind,\n  itemId: string,\n  validFrom: string | null,\n  validTo: string | null\n): Promise<number> {"
  cost: Five positional parameters, three of them adjacent and string-or-null. Swapping `validFrom` and `validTo` at a call site compiles and writes a reversed period.
  correction: Pass an object (`{ itemKind, itemId, validFrom, validTo }`), as `AttributeSupersessionArgs` already does for the edit functions.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: insertCorrectedRow, lines 397-473
  cites: MNT-01
  evidence: "export async function insertCorrectedRow(\n  client: PoolClient,\n  itemKind: ItemKind,\n  args: CorrectionMutationArgs\n): Promise<string> {\n[the function runs from line 397 to line 473, 77 lines]"
  cost: Two long INSERT ... SELECT statements and two empty-row checks sit in one body. A change to the correction columns has to be found and repeated inside the same function, twice.
  correction: Split into one function per item kind, each holding its own statement.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: insertNewAttribute, lines 489-522
  cites: MNT-01
  evidence: "export async function insertNewAttribute(\n  client: PoolClient,\n  args: NewAttributeArgs\n): Promise<string> {\n[the function runs from line 489 to line 522, 34 lines]"
  cost: The function is four lines over the limit, because the eleven-parameter list is spelled inline. Each added column grows a function already past the limit.
  correction: Move the parameter array into a named helper such as `newAttributeParams(args)`.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: supersedeAttributeAtEdit, lines 530-545
  cites: MNT-03
  evidence: "`UPDATE node_attribute\n    SET status = 'superseded',\n        valid_to = COALESCE($2::date, valid_to),\n        superseded_at = $3::timestamptz\n  WHERE id = $1\n    AND status IN ('active', 'uncertain', 'disputed')\n  RETURNING id`\n[supersedePredecessor, line 385, holds the same UPDATE for node_attribute without valid_to and with `superseded_at = now()`]"
  cost: The guard "only a live attribute may be superseded" (`status IN ('active', 'uncertain', 'disputed')`) is written in two functions. If the set of live statuses changes, one of the two keeps the old set and the two curation paths disagree about which attributes can be superseded.
  correction: Have `supersedePredecessor` call the new function with its timestamp, or share the status guard.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: rejectAttributeAtEdit, lines 552-566
  cites: MNT-03
  evidence: "`UPDATE node_attribute\n    SET status = 'deleted',\n        superseded_at = $2::timestamptz\n  WHERE id = $1\n    AND status IN ('active', 'uncertain', 'disputed')\n  RETURNING id`\n[rejectItem, line 263, holds the same attribute UPDATE with `superseded_at = now()`]"
  cost: The attribute branch of `rejectItem` is copied with only the timestamp made a parameter. A fix to one (for the CLAUDE.md gotcha that `reject_item` must write `superseded_at`) has to be remembered for the other.
  correction: Give `rejectItem` an optional timestamp, or have it call `rejectAttributeAtEdit` with `new Date()`.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: copyProvenance, lines 568-596
  cites: MNT-01
  evidence: "export async function copyProvenance(\n  client: PoolClient,\n  itemKind: ItemKind,\n  predecessorId: string,\n  successorId: string\n): Promise<number> {"
  cost: Four positional parameters, two of them adjacent ids of the same type. Swapping predecessor and successor compiles and copies provenance backwards.
  correction: Pass `{ itemKind, predecessorId, successorId }` as one object.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: appendProvenanceFragment, lines 598-622
  cites: MNT-01
  evidence: "export async function appendProvenanceFragment(\n  client: PoolClient,\n  itemKind: ItemKind,\n  successorId: string,\n  fragmentId: string\n): Promise<number> {"
  cost: Four positional parameters, with `successorId` and `fragmentId` both plain strings. Swapping them compiles and inserts a provenance row pointing at the wrong entity.
  correction: Pass `{ itemKind, successorId, fragmentId }` as one object.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, lines 848-930
  cites: ARC-04
  evidence: "let acceptRate = 0;\nif (totalActions > 0) {\n  [...]\n  acceptRate = accepted / totalActions;\n}\n[...]\nrejectRateByCode[row.code] = Number(row.total) / totalActions;"
  cost: The repository computes the accept and reject rates. A calibration rule (what counts as acceptance, how a zero denominator is treated) lives in the data layer. Whatever else needs the same metric, such as a job or a tool, must either call this repository or redo the arithmetic.
  correction: Have the repository return the counts, and compute the rates in the metrics service.
- pass: standard
  file: src/modules/curation/repository/curation.repository.ts
  where: aggregateCurationMetrics, lines 848-930
  cites: MNT-01
  evidence: "export async function aggregateCurationMetrics(\n  client: PoolClient\n): Promise<CurationMetricsRow> {\n[the function runs from line 848 to line 930, 83 lines]"
  cost: Eight statements, several loops and three derived values are in one body. A new metric becomes another branch of the same function.
  correction: Extract one named query function per metric and compose them.
- pass: standard
  file: src/modules/curation/routes/curation.routes.ts
  where: registerCurationRoutes, lines 45-245
  cites: MNT-01
  evidence: "export async function registerCurationRoutes(\n  app: FastifyInstance,\n  deps: CurationRouteDeps\n): Promise<void> {\n[the function runs from line 45 to line 245, 201 lines]"
  cost: All seven curation routes, including the inline degradation logic for metrics, are in one function. A reader changing one route has to scroll past six others to see what the registration shares.
  correction: Register each route in its own function, as `registerEditEntityRoute` does.
- pass: standard
  file: src/modules/curation/routes/curation.routes.ts
  where: GET /metrics catch block, lines 70-79
  cites: MNT-03
  evidence: "ok: false as const,\nerror: {\n  code: \"SYSTEM_SERVICE_UNAVAILABLE\",\n  message: \"A backing service is temporarily unavailable.\",\n},\n[src/shared/error-mapping.ts serviceUnavailableError(), line 126, renders the same code and the message \"A backing service is temporarily unavailable.\"]"
  cost: The 503 envelope is built by hand in the route although the shared mapping already renders it. If the message or code of the shared envelope changes, `/metrics` keeps answering with the old one.
  correction: Use `serviceUnavailableError()` for the degraded answer.
- pass: standard
  file: src/modules/curation/routes/curation.routes.ts
  where: error_class log field, lines 89-92
  cites: TYP-02
  evidence: "error_class:\n  err instanceof Error\n    ? (err as { code?: string }).code ?? err.name\n    : typeof err,"
  cost: '`err instanceof Error` narrows to `Error`, and the cast then claims a `code` string that was never checked. A numeric or object `code` flows into the log field as if it were a string.'
  correction: Read `code` through a guard that checks `typeof code === "string"`, as `isPgUnavailable` does.
- pass: standard
  file: src/modules/curation/routes/edit-entity.routes.ts
  where: parseEditRequest, line 28
  cites: EDG-01
  evidence: "const body = EditEntityBodySchema.parse(request.body ?? {});\n[src/modules/curation/dto/edit-entity.dto.ts, line 65]\n  changes: z.array(AttributeChangeSchema),\n[src/modules/curation/service/edit-entity.service.ts, line 229]\n  if (applied.every((change) => change.effect === UNCHANGED_EFFECT)) {"
  cost: An empty `changes` list passes the validation boundary and reaches the service. It is refused there (`every` on an empty list is true, so `BUSINESS_ENTITY_EDIT_NO_CHANGES`) only after the node has been locked and loaded. An empty `attribute_key` (`z.string()`) or an empty `value` (`z.string().nullish()`) is likewise decided by the service. Two places now decide what an acceptable edit is.
  correction: 'Refuse an empty `changes` list, and an empty `attribute_key` or `value`, in `EditEntityBodySchema` (`.min(1)`). The existing specs `edit-entity.dto.spec.ts` ("a reason and an empty changes list": ACCEPTED) and `edit-entity-refusals.spec.ts` ("emptyList") encode the opposite, so they would change too. The owner of the standard or the specification should say which reading holds.'
- pass: standard
  file: src/modules/curation/service/edit-entity.service.ts
  where: openEditScope, lines 91-96
  cites: MNT-01
  evidence: "function openEditScope(\n  client: PoolClient,\n  catalog: CatalogSnapshot,\n  node: KnowledgeNodeLockedRow,\n  reason: string\n): EditScope {"
  cost: Four positional parameters, where `reason` and the other string-typed arguments are easy to confuse at the one call site and at any future one. `editWithin` already holds all four in `deps`, `client`, `node` and `body`.
  correction: Pass one object (`{ client, catalog, node, reason }`).
- pass: standard
  file: src/modules/curation/service/edit-entity.service.ts
  where: applyChanges, lines 216-226
  cites: EDG-04
  evidence: "for (const change of changes) {\n  const checked = await checkChange(scope, change);\n  applied.push(await recordChange(scope, change, checked));\n}"
  cost: Each change is checked and then written before the next change is checked. A refusal raised by change N (unknown key, disputed attribute, conflict) comes after changes 1..N-1 and the operator note have already been written. Only the surrounding rollback makes the store look as if the refusal came first. The spec "an entity edit refused after an earlier change would have been recorded" exists to prove the rollback.
  correction: Run the checks for all changes before the first write, or state in the standard that a refusal inside a transaction that rolls back satisfies the rule. Changes that touch the same key interact, so a check-all pass has to account for them.
- pass: standard
  file: src/modules/curation/service/edit-entity.service.ts
  where: editEntityService catch block, lines 278-283
  cites: COR-01
  evidence: "} catch (err) {\n  if (isPgUniqueViolation(err)) {\n    throw new TemporalIncoherentError({ node_id: nodeId });\n  }\n  throw err;\n}"
  cost: A unique violation becomes a `TemporalIncoherentError` that carries only the node id. The driver error (constraint name, table) is lost. Any unique violation in the transaction is reported this way, including one from the operator note's `content_hash` or `idempotency_key` insert, and nobody can tell which write was refused. The `throw err` for every other error is a bare rethrow.
  correction: Pass the original as `cause` when wrapping, and keep the bare rethrow only for errors that already are typed.
reconciliation: siegard-reconcile/entity-edit-backend.md
run: run/entity-edit-backend
---

## What it is

The review of the 17 tasks of the entity-edit-backend initiative, over the 46 files they wrote. Coverage and the standard pass ran once each over the whole file set. The conformance pass ran once per file, 46 judgments, folded into siegard-reconcile/entity-edit-backend.md. The captured run run/entity-edit-backend passed, so the failures pass had nothing to read.

## Notes

The first conformance fold refused 35 returns that arrived wrapped in a Markdown code fence. Each of the 35 was delegated again to a fresh judge with the instruction to return bare YAML, and the saved returns were replaced whole; none was repaired by hand.

The standard judge reports that rule TST-07 was in scope and could not be applied, because the specification's invariants were not handed over to it.

A conformance finding's node is not a field of this record; it is held in siegard-reconcile/entity-edit-backend.md and in the saved returns under siegard-reconcile/entity-edit-backend.returns/.
