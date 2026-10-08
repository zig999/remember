---
target: backend
title: Validity check of an entity-edit attribute change
summary: A change to a non-temporal key that states a validity start or end, a change whose start is not strictly before its end, and a set change to a temporal key whose end is not after the UTC today with no start are each refused with BUSINESS_TEMPORAL_INCOHERENT.
task: sha256:1f82e3b1a6be79fb523be59062ea1a5f36da517662d0583ebab19a8d8b0e35a0
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-check-change-validity-build
files:
- path: src/modules/curation/service/attribute-change-validity.ts
  effect: New helper holding checkChangeValidity(attributeKey, change, editedAt). It refuses with a BusinessError (code BUSINESS_TEMPORAL_INCOHERENT, 422 via the existing table) in three cases. A change to a key whose is_temporal is not true states a validity start or end. A change states both a start and an end with the start not strictly before the end. A set change to a temporal key states an end and no start, and that end is not after the UTC calendar date of editedAt. It runs the three checks in that order. It writes nothing and reads no clock of its own.
- path: src/modules/curation/service/attribute-change-catalog.ts
  effect: resolveAttributeKey is now exported and its body is unchanged, so the orchestration can obtain the AttributeKeyRow that checkChangeValidity takes without repeating the catalog lookup. Nothing else changed.
criteria:
- criterion: A change to a key that is not temporal that states a validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: assertStableKeyStatesNoValidity in attribute-change-validity.ts throws when attributeKey.is_temporal is falsy and change.valid_from is stated. The change kind is not consulted.
- criterion: A change to a key that is not temporal that states a validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: The same function throws when change.valid_to is stated on a key that is not temporal.
- criterion: A change to a key that is not temporal that states no validity is not refused by the stable-key rule.
  met: true
  how: The stable-key check throws only when a start or an end is stated. A null in the body is already read as not stated by the DTO's nullAsNotStated, so null passes. With no validity stated, the other two checks are no-ops for this change.
- criterion: A change to a key that records no temporality that states a validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: The check tests !attributeKey.is_temporal, so a key without a recorded temporality is read as not temporal and refused when it states a start.
- criterion: A change to a key that records no temporality that states a validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: The same !attributeKey.is_temporal test refuses a stated end.
- criterion: A change to a key that records no temporality that states no validity is not refused by the stable-key rule.
  met: true
  how: With neither field stated the stable-key check does not throw, whatever is_temporal holds.
- criterion: A change whose validity start equals its validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: assertStartBeforeEnd throws when both are stated and valid_from >= valid_to, which includes equality. The YYYY-MM-DD strings compare lexicographically as dates.
- criterion: A change whose validity start falls later than its validity end is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: The same valid_from >= valid_to comparison throws when the start is later.
- criterion: A change to a temporal key whose validity start falls earlier than its validity end is not refused by these rules.
  met: true
  how: On a temporal key the stable-key check passes, and assertStartBeforeEnd passes when the start is earlier. The defaulted-start check does nothing because a start is stated.
- criterion: A set change to a temporal key that states a validity end of today and no validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: assertDefaultedStartPrecedesEnd throws for a set change with no start and valid_to <= today, where today is the UTC date of editedAt. An end equal to today is refused.
- criterion: A set change to a temporal key that states a validity end earlier than today and no validity start is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: The same valid_to <= today comparison throws for an earlier end.
- criterion: A set change to a temporal key that states a validity end later than today and no validity start is not refused by the defaulted-start rule.
  met: true
  how: valid_to > today does not throw, and no other check in the file applies when no start is stated on a temporal key.
nodes:
- node: rules/knowledge-base/stable-key-change-states-no-validity
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  how: assertStableKeyStatesNoValidity is the rule's condition. A change, set or remove, to a key that is not temporal and states a start or an end is refused with BUSINESS_TEMPORAL_INCOHERENT.
- node: rules/knowledge-base/unrecorded-temporality-is-not-temporal
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  how: The key is tested with !attributeKey.is_temporal, so an unrecorded, null or false temporality counts as not temporal.
- node: rules/knowledge-base/validity-start-before-end
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  how: assertStartBeforeEnd covers the clause about a change of an entity edit. The proposal, adjusted-period and correction clauses are other acts' and were not touched.
- node: rules/knowledge-base/entity-edit-defaulted-start-precedes-end
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  how: assertDefaultedStartPrecedesEnd refuses a set change with a stated end, no stated start and an end not after today. Today is the UTC calendar date of editedAt.
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  how: The three refusals use error code BUSINESS_TEMPORAL_INCOHERENT through BusinessError. The existing table in src/shared/error-mapping.ts, delivered earlier, maps it to HTTP 422. The helper does not reach the route, the order of the checks, or the other refusals of the contract.
- node: domain/knowledge-base/attribute-change
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  how: The check reads the change's kind, valid_from and valid_to as the DTO delivers them, with null already read as not stated. It does not change the shape.
- node: domain/knowledge-base/attribute-key
  encoded_at:
  - src/modules/curation/service/attribute-change-validity.ts
  how: The check reads the key's is_temporal from the catalog row. It declares no attribute-key shape and holds none of the catalog's own temporal-key set.
inferences:
- inferred: checkChangeValidity takes the moment of the edit as a Date (editedAt) and derives today as its UTC calendar date with toISOString().slice(0, 10). It does not read the clock itself. Whoever orchestrates the edit passes the one moment used for the whole edit, so the date compared here is the same as the date used for the default start.
  from: rules/knowledge-base/entity-edit-start-defaults-to-today defines today as the UTC calendar date of the moment of the edit. The task's notes say the server's local zone is refused.
- inferred: The refusal message and details (attribute_key, valid_from, valid_to) are written in English in the style of attribute-change-catalog.ts.
  from: contracts/knowledge-base/entity-editing gives only the code and the status for these three refusals, so the wording is not a business fact. The delivered helper's messages and details set the style.
- inferred: resolveAttributeKey was exported from attribute-change-catalog.ts so that the orchestrator that comes after this task gets the AttributeKeyRow without a second catalog lookup.
  from: The inventory's convention that catalog lookups go through the catalog snapshot. The only lookup of this kind was private to the delivered file.
- inferred: A remove change to a temporal key that states only a validity end is not refused by the defaulted-start rule.
  from: The rule's statement names a set change only.
- inferred: Dates are compared as YYYY-MM-DD strings, with no calendar validation beyond what IsoDateSchema in the DTO already does.
  from: Both dates have the fixed-width ISO shape at this point, and the same string comparison is used in src/modules/ingestion/validation/temporal.ts.
preserved:
- checkChangeAgainstCatalog keeps its signature and behavior (unknown key, value parse, allowed values).
- The AttributeChange schema and the null-as-not-stated reading in edit-entity.dto.ts are untouched.
- The BUSINESS_TEMPORAL_INCOHERENT entry in src/shared/error-mapping.ts, and the existing BusinessError class, are used unchanged.
- The ingestion temporal validation (src/modules/ingestion/validation/temporal.ts) and the curation correction and dispute paths are not touched.
deferred:
- what: Putting the validity check after the allowed-values check and before the checks against the node's attributes of the key, and running changes in the order given.
  why: rules/knowledge-base/entity-edit-change-check-order and entity-edit-check-order belong to the task that orchestrates the edit. This task only supplies checkChangeValidity and the exported resolveAttributeKey.
- what: Recording the default start (today, basis received) on a set change to a temporal key with no start.
  why: rules/knowledge-base/entity-edit-start-defaults-to-today is not among this task's nodes. It is written where the edit is applied.
---
## What it is
A change to a non-temporal key that states a validity start or end, a change whose start is not strictly before its end, and a set change to a temporal key whose end is not after the UTC today with no start are each refused with BUSINESS_TEMPORAL_INCOHERENT.

## Notes
Inferred: checkChangeValidity takes the moment of the edit as a Date (editedAt) and derives today as its UTC calendar date with toISOString().slice(0, 10). It does not read the clock itself. Whoever orchestrates the edit passes the one moment used for the whole edit, so the date compared here is the same as the date used for the default start.
Inferred: The refusal message and details (attribute_key, valid_from, valid_to) are written in English in the style of attribute-change-catalog.ts.
Inferred: resolveAttributeKey was exported from attribute-change-catalog.ts so that the orchestrator that comes after this task gets the AttributeKeyRow without a second catalog lookup.
Inferred: A remove change to a temporal key that states only a validity end is not refused by the defaulted-start rule.
Inferred: Dates are compared as YYYY-MM-DD strings, with no calendar validation beyond what IsoDateSchema in the DTO already does.
Deferred: Putting the validity check after the allowed-values check and before the checks against the node's attributes of the key, and running changes in the order given.
Deferred: Recording the default start (today, basis received) on a set change to a temporal key with no start.
