// Graph-rule validation layer (Layer 2 of BR-13 / BR-15).
//
// Look up an active `link_type_rule` matching the `(source_node_type,
// link_type, target_node_type)` triple. The 22 seed rules of §15.2 are the v1
// authoritative set. Any other triple yields `RULE_VIOLATION`.
//
// This layer consults the in-process catalog snapshot (loaded at startup) —
// no DB round trip per call.

import { isLinkRuleActive, type CatalogSnapshot } from "../catalog/catalog.js";
import { ValidationFailure } from "./errors.js";

export interface GraphRuleInput {
  readonly source_node_type_id: string;
  readonly link_type_id: string;
  readonly target_node_type_id: string;
}

/**
 * Validate the triple against the active rule set. Pure function — `today` is
 * passed in so tests can stub the clock without `Date.now()` calls.
 */
export function validateGraphRule(
  snapshot: CatalogSnapshot,
  input: GraphRuleInput,
  today: Date
): void {
  if (
    !isLinkRuleActive(snapshot, {
      source_node_type_id: input.source_node_type_id,
      link_type_id: input.link_type_id,
      target_node_type_id: input.target_node_type_id,
      today,
    })
  ) {
    throw new ValidationFailure(
      "RULE_VIOLATION",
      "No active link_type_rule authorises this (source_node_type, link_type, target_node_type) triple.",
      {
        source_node_type_id: input.source_node_type_id,
        link_type_id: input.link_type_id,
        target_node_type_id: input.target_node_type_id,
      }
    );
  }
}
