import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import type { EditVariables } from "../../types";
import {
  ACCEPTED_WIRE,
  mountEdit,
  outcomeOf,
  sentBody,
  unmountEdits,
} from "./edit-support";
import { answers, jsonResponse, stubFetch } from "./support";

afterEach(() => {
  unmountEdits();
  vi.restoreAllMocks();
});

describe("edit body", () => {
  it("carries the reason", async () => {
    stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    const variables: EditVariables = {
      nodeId: "n-1",
      edit: {
        reason: "Corrigir o status",
        changes: [{ attributeKey: "status_text", kind: "set", value: "x" }],
      },
    };
    await outcomeOf(mountEdit(), variables);
    expect(sentBody()["reason"]).toBe("Corrigir o status");
  });

  it("carries the changes as a list", async () => {
    stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    const variables: EditVariables = {
      nodeId: "n-1",
      edit: {
        reason: "Corrigir",
        changes: [
          { attributeKey: "status_text", kind: "set", value: "x" },
          { attributeKey: "owner", kind: "set", value: "y" },
        ],
      },
    };
    await outcomeOf(mountEdit(), variables);
    expect(sentBody()["changes"]).toEqual([
      expect.anything(),
      expect.anything(),
    ]);
  });

  it("writes the six members of every change, JSON null in every empty member and null in value and validity of a remove change", async () => {
    stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    const variables: EditVariables = {
      nodeId: "n-1",
      edit: {
        reason: "Corrigir",
        changes: [
          { attributeKey: "k_absent", kind: "set" },
          {
            attributeKey: "k_null",
            kind: "set",
            value: null,
            itemId: null,
            validFrom: null,
            validTo: null,
          },
          {
            attributeKey: "k_blank",
            kind: "set",
            value: "",
            itemId: "",
            validFrom: "",
            validTo: "",
          },
          {
            attributeKey: "k_full",
            kind: "set",
            value: "v",
            itemId: "i-1",
            validFrom: "2020-01-01",
            validTo: "2021-01-01",
          },
          {
            attributeKey: "k_remove",
            kind: "remove",
            value: "last value",
            itemId: "i-7",
            validFrom: "2020-01-01",
            validTo: "2021-01-01",
          },
        ],
      },
    };
    await outcomeOf(mountEdit(), variables);
    const changes = sentBody()["changes"] as ReadonlyArray<
      Record<string, unknown>
    >;
    const byKey = Object.fromEntries(
      changes.map((change) => [String(change["attribute_key"]), change]),
    );
    expect(byKey).toStrictEqual({
      k_absent: {
        attribute_key: "k_absent",
        kind: "set",
        value: null,
        item_id: null,
        valid_from: null,
        valid_to: null,
      },
      k_null: {
        attribute_key: "k_null",
        kind: "set",
        value: null,
        item_id: null,
        valid_from: null,
        valid_to: null,
      },
      k_blank: {
        attribute_key: "k_blank",
        kind: "set",
        value: null,
        item_id: null,
        valid_from: null,
        valid_to: null,
      },
      k_full: {
        attribute_key: "k_full",
        kind: "set",
        value: "v",
        item_id: "i-1",
        valid_from: "2020-01-01",
        valid_to: "2021-01-01",
      },
      k_remove: {
        attribute_key: "k_remove",
        kind: "remove",
        value: null,
        item_id: "i-7",
        valid_from: null,
        valid_to: null,
      },
    });
  });
});
