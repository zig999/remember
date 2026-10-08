import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useAuthStore } from "../../../../state/auth";
import { entityEdit } from "../_edit-request";
import { ACCEPTED_WIRE, SOME_EDIT } from "./edit-support";
import { answers, jsonResponse, stubFetch } from "./support";

beforeEach(() => {
  useAuthStore.getState().clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("edit sent", () => {
  it("is sent as POST /api/v1/nodes/{node_id}/edit with the node identity in the path", async () => {
    const requests = stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    await entityEdit("n-1", SOME_EDIT);
    expect(requests.map((request) => [request.method, request.url.href])).toEqual([
      ["POST", "https://bff.test/api/v1/nodes/n-1/edit"],
    ]);
  });

  it("URL-encodes the node identity in the path", async () => {
    const requests = stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    await entityEdit("a/b c?d#é", SOME_EDIT);
    expect(requests[0]?.url.href).toBe(
      "https://bff.test/api/v1/nodes/a%2Fb%20c%3Fd%23%C3%A9/edit",
    );
  });

  it("carries the owner's token in the Authorization header as Bearer <token>", async () => {
    useAuthStore.getState().setToken("owner.token");
    const requests = stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
    await entityEdit("n-1", SOME_EDIT);
    expect(requests[0]?.authorization).toBe("Bearer owner.token");
  });

  it("reads an HTTP 200 answer without an envelope as node_id, action_id and applied", async () => {
    stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE, 200)));
    await expect(entityEdit("n-1", SOME_EDIT)).resolves.toEqual(ACCEPTED_WIRE);
  });
});
