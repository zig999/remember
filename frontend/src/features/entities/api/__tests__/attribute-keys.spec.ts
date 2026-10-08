import { afterEach, describe, expect, it, vi } from "vitest";
import type { UseQueryResult } from "@tanstack/react-query";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useAttributeKeys } from "../catalog.hooks";
import type { AttributeKey } from "../../types";
import {
  answers,
  jsonResponse,
  mountQuery,
  settled,
  stubFetch,
  unmountAll,
  type Responder,
} from "./support";

const KEYS_WIRE = {
  total: 2,
  items: [
    {
      id: "k-1",
      node_type: "Project",
      key: "status_text",
      value_type: "text",
      is_temporal: true,
      allows_multiple: false,
      requires_valid_from: true,
      description: "Situação do projeto",
      version: 2,
      valid_values: [
        { value: "em_andamento", label: "Em andamento", sort_order: 2 },
        { value: "planejado", label: "Planejado", sort_order: 1 },
        { value: "concluido", label: "Concluído", sort_order: 3 },
      ],
    },
    {
      id: "k-2",
      node_type: "Project",
      key: "inicio_previsto",
      value_type: "date",
      is_temporal: false,
      allows_multiple: true,
      requires_valid_from: false,
      description: "Data prevista de início",
      version: 1,
    },
  ],
};

function keyNamed(key: string) {
  return {
    id: `id-${key}`,
    node_type: "Project",
    key,
    value_type: "text",
    is_temporal: false,
    allows_multiple: false,
    requires_valid_from: false,
    description: key,
    version: 1,
  };
}

function accepted(result: unknown): Responder {
  return answers(() => jsonResponse({ ok: true, result }));
}

async function readKeys(nodeType: string, responder: Responder) {
  const requests = stubFetch(responder);
  function useRead(): UseQueryResult<readonly AttributeKey[]> {
    return useAttributeKeys(nodeType);
  }
  const state = await settled(mountQuery(useRead));
  return { requests, state };
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe("attribute-key read", () => {
  it("requests the attribute keys as GET /api/v1/attribute-keys", async () => {
    const { requests } = await readKeys("Project", accepted(KEYS_WIRE));
    expect(
      requests.map(({ method, url }) => ({ method, pathname: url.pathname })),
    ).toEqual([{ method: "GET", pathname: "/api/v1/attribute-keys" }]);
  });

  it("sends the node type by the name it is given as the node_type parameter and no other parameter", async () => {
    const { requests } = await readKeys("Ação & Co", accepted(KEYS_WIRE));
    expect(
      requests.map(({ url }) => [...url.searchParams.entries()]),
    ).toEqual([[["node_type", "Ação & Co"]]]);
  });

  it("returns each attribute key with its key, value type, whether it is temporal, whether it allows multiple current values and its description", async () => {
    const { state } = await readKeys("Project", accepted(KEYS_WIRE));
    expect(state.data).toMatchObject([
      {
        key: "status_text",
        valueType: "text",
        isTemporal: true,
        allowsMultiple: false,
        description: "Situação do projeto",
      },
      {
        key: "inicio_previsto",
        valueType: "date",
        isTemporal: false,
        allowsMultiple: true,
        description: "Data prevista de início",
      },
    ]);
  });

  it("returns an attribute key the catalog closes with its allowed values", async () => {
    const { state } = await readKeys("Project", accepted(KEYS_WIRE));
    const closed = state.data?.find((item) => item.key === "status_text");
    expect(closed?.allowedValues?.map((item) => item.value).sort()).toEqual([
      "concluido",
      "em_andamento",
      "planejado",
    ]);
  });

  it("returns the attribute keys in the order the catalog lists them", async () => {
    const { state } = await readKeys(
      "Project",
      accepted({
        total: 3,
        items: [keyNamed("m_key"), keyNamed("z_key"), keyNamed("a_key")],
      }),
    );
    expect(state.data?.map((item) => item.key)).toEqual([
      "m_key",
      "z_key",
      "a_key",
    ]);
  });
});
