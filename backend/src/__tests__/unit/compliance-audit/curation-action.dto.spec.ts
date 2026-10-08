import { describe, expect, it } from "vitest";

import { ListCurationActionsQuerySchema } from "../../../modules/compliance-audit/dto/curation-action.dto.js";

interface KindSpelling {
  readonly enumerated: string;
  readonly written: string;
}

const CURATION_ACTION_KINDS: readonly KindSpelling[] = [
  { enumerated: "resolve-entity-match", written: "resolve_entity_match" },
  { enumerated: "merge-nodes", written: "merge_nodes" },
  { enumerated: "resolve-dispute", written: "resolve_dispute" },
  { enumerated: "confirm-item", written: "confirm_item" },
  { enumerated: "reject-item", written: "reject_item" },
  { enumerated: "correct-item", written: "correct_item" },
  { enumerated: "compliance-delete", written: "compliance_delete" },
  { enumerated: "edit-entity", written: "edit_entity" },
];

describe("ListCurationActionsQuerySchema action filter over the eight curation action kinds", () => {
  it.each(CURATION_ACTION_KINDS)(
    "admits $written as the action filter",
    ({ written }) => {
      const parsed = ListCurationActionsQuerySchema.safeParse({ action: written });

      expect(parsed.success).toBe(true);
      expect(parsed.data?.action).toBe(written);
    }
  );

  it.each(CURATION_ACTION_KINDS)(
    "refuses the hyphen spelling $enumerated as the action filter",
    ({ enumerated }) => {
      const parsed = ListCurationActionsQuerySchema.safeParse({ action: enumerated });

      expect(parsed.success).toBe(false);
    }
  );
});
