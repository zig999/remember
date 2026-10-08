import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useAuthStore } from "../../../../state/auth";
import { READS } from "./node-catalog-cases";
import {
  answers,
  jsonResponse,
  mountQuery,
  settled,
  stubFetch,
  unmountAll,
} from "./support";

beforeEach(() => {
  useAuthStore.getState().clear();
});

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("owner's token", () => {
  it.each(READS)(
    "is sent as Bearer <token> in the Authorization header by $name",
    async ({ useRead, wire }) => {
      useAuthStore.getState().setToken("access.token.1");
      const requests = stubFetch(
        answers(() => jsonResponse({ ok: true, result: wire })),
      );
      await settled(mountQuery(useRead));
      expect(requests.map((request) => request.authorization)).toEqual([
        "Bearer access.token.1",
      ]);
    },
  );
});
