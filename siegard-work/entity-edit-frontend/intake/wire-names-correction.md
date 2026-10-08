# Corrective increment: members the client reads under names the backend does not send

Named by the person through the approved merge-preparation plan (items G1 and G2, and the effect values of the edit tests).
File the wrong behavior lives in: frontend/src/features/entities/api/_transforms.ts, with the wire types in frontend/src/features/entities/types.ts.

## Observed behavior

The backend now on main answers the attribute-key listing (GET /api/v1/attribute-keys) with the member `allows_multiple_current` for whether a key allows multiple current values. The client reads another name for it, so every key reads as not allowing multiple current values: a multi-valued key shows one field, offers no add control, and a value added to it is not stated as an addition.

The backend answers the node listing (GET /api/v1/nodes) with the member `merged_into_node_id` for the identity a merged node was merged into. The client's listing reads another name for it, so the identity reads as absent. The single-node read of the client already reads `merged_into_node_id`.

The backend answers an accepted edit with `applied` entries whose `effect` is one of first_value, addition, succession, correction, removal, unchanged, each hyphen of the enumeration value written as an underscore (specification/rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores). The applied-change fixtures of the client's edit tests give an effect that is none of these six.

## Reproduction

Read the backend files backend/src/modules/knowledge-graph/dto/catalog.dto.ts and backend/src/modules/knowledge-graph/dto/node.dto.ts and backend/src/modules/curation/service/entity-edit-action.ts, and compare the member names they send with the ones the client reads.

## Not asked

Nothing in backend/ changes.
