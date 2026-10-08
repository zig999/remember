import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { entityKeys } from "../keys";
import {
  ACCEPTED_WIRE,
  SOME_VARIABLES,
  mountEdit,
  outcomeOf,
  refusalBody,
  unmountEdits,
} from "./edit-support";
import {
  answers,
  answersAfter,
  failsWith,
  jsonResponse,
  stubFetch,
} from "./support";

afterEach(() => {
  unmountEdits();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const CONFLICT = "BUSINESS_ENTITY_EDIT_CONFLICT";

describe("edit outcome", () => {
  it("is accepted with the node, the action and what was applied when the edit is answered 200", async () => {
    stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    expect(await outcomeOf(mountEdit(), SOME_VARIABLES)).toMatchObject({
      kind: "accepted",
      nodeId: "n-1",
      actionId: "act-1",
      applied: [
        {
          attributeKey: "status_text",
          effect: "first_value",
          itemId: "i-1",
          predecessorId: null,
        },
      ],
    });
  });

  it.each([
    "first_value",
    "addition",
    "succession",
    "correction",
    "removal",
    "unchanged",
  ])("reads an applied change answered with the effect %s as that effect", async (effect) => {
    stubFetch(
      answers(() =>
        jsonResponse({
          ...ACCEPTED_WIRE,
          applied: [
            {
              attribute_key: "status_text",
              effect,
              item_id: null,
              predecessor_id: null,
            },
          ],
        }),
      ),
    );
    expect(await outcomeOf(mountEdit(), SOME_VARIABLES)).toMatchObject({
      kind: "accepted",
      applied: [{ effect }],
    });
  });

  it("is a conflict naming the attribute key and the item its refusal's details name", async () => {
    stubFetch(
      answers(() =>
        jsonResponse(
          refusalBody(CONFLICT, "Conflict.", {
            attribute_key: "status_text",
            item_id: "i-9",
          }),
          409,
        ),
      ),
    );
    expect(await outcomeOf(mountEdit(), SOME_VARIABLES)).toMatchObject({
      kind: "conflict",
      attributeKey: "status_text",
      itemId: "i-9",
    });
  });

  it("is a conflict with no item where its refusal's details name none", async () => {
    stubFetch(
      answers(() =>
        jsonResponse(
          refusalBody(CONFLICT, "Conflict.", {
            attribute_key: "status_text",
            item_id: null,
          }),
          409,
        ),
      ),
    );
    expect(await outcomeOf(mountEdit(), SOME_VARIABLES)).toMatchObject({
      kind: "conflict",
      attributeKey: "status_text",
      itemId: null,
    });
  });

  it("is a refusal carrying the status, code, message and details when another code is refused, even at 409", async () => {
    const details = { attribute_key: "status_text", item_id: "i-3" };
    stubFetch(
      answers(() =>
        jsonResponse(
          refusalBody("BUSINESS_ENTITY_EDIT_DISPUTED", "Disputed.", details),
          409,
        ),
      ),
    );
    expect(await outcomeOf(mountEdit(), SOME_VARIABLES)).toMatchObject({
      kind: "refused",
      failure: {
        code: "BUSINESS_ENTITY_EDIT_DISPUTED",
        status: 409,
        message: "Disputed.",
        details,
      },
    });
  });

  it("is unreachable with SYSTEM_NETWORK when the edit gets no answer", async () => {
    stubFetch(failsWith(new TypeError("Failed to fetch")));
    expect(await outcomeOf(mountEdit(), SOME_VARIABLES)).toMatchObject({
      kind: "unreachable",
      failure: { code: "SYSTEM_NETWORK" },
    });
  });

  it("is unreachable with SYSTEM_TIMEOUT when the edit is cut off", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    stubFetch(answersAfter(60_000, () => jsonResponse(ACCEPTED_WIRE)));
    expect(
      await outcomeOf(mountEdit(), SOME_VARIABLES, 30_000),
    ).toMatchObject({
      kind: "unreachable",
      failure: { code: "SYSTEM_TIMEOUT" },
    });
  });

  it("invalidates the node's queries when the edit is accepted", async () => {
    stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    const mounted = mountEdit();
    mounted.queryClient.setQueryData(entityKeys.node("n-1"), { stale: true });
    await outcomeOf(mounted, SOME_VARIABLES);
    expect(
      mounted.queryClient.getQueryState(entityKeys.node("n-1"))?.isInvalidated,
    ).toBe(true);
  });
});
