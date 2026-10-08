import { afterEach, describe, expect, it, vi } from "vitest";
import type { UseQueryResult } from "@tanstack/react-query";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import { useNodeRead } from "../node.hooks";
import type { NodeRead } from "../../types";
import {
  answers,
  factsOf,
  jsonResponse,
  mountQuery,
  settled,
  stubFetch,
  unmountAll,
  type Responder,
} from "./support";

const NODE_WIRE = {
  node: {
    id: "n-1",
    node_type: "Project",
    canonical_name: "Projeto Apollo",
    status: "active",
  },
  aliases: [
    {
      id: "al-1",
      alias: "Apollo",
      kind: "synonym",
      created_at: "2024-03-01T10:00:00Z",
    },
    {
      id: "al-2",
      alias: "Projeto A",
      kind: "abbreviation",
      created_at: "2024-04-02T11:30:00Z",
    },
  ],
  attributes: [
    {
      id: "at-1",
      attribute_key: "status_text",
      value: "Em andamento",
      valid_from: "2024-01-15",
      valid_to: "2025-06-30",
      status: "superseded",
      is_current: false,
    },
    {
      id: "at-2",
      attribute_key: "status_text",
      value: "Concluído",
      valid_from: "2025-07-01",
      valid_to: null,
      status: "active",
      is_current: true,
    },
    {
      id: "at-3",
      attribute_key: "sigla",
      value: "APL",
      valid_from: null,
      valid_to: null,
      status: "active",
      is_current: true,
    },
  ],
};

function accepted(result: unknown): Responder {
  return answers(() => jsonResponse({ ok: true, result }));
}

async function readNode(nodeId: string, responder: Responder) {
  const requests = stubFetch(responder);
  function useRead(): UseQueryResult<NodeRead> {
    return useNodeRead(nodeId);
  }
  const state = await settled(mountQuery(useRead));
  return { requests, state };
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe("node read", () => {
  it("requests the node as GET /api/v1/nodes/{node_id} with the node identity in the path", async () => {
    const { requests } = await readNode("n-1", accepted(NODE_WIRE));
    expect(
      requests.map(({ method, url }) => ({ method, pathname: url.pathname })),
    ).toEqual([{ method: "GET", pathname: "/api/v1/nodes/n-1" }]);
  });

  it("URL-encodes the node identity in the path", async () => {
    const { requests } = await readNode("a/b ?c#d é", accepted(NODE_WIRE));
    expect(requests.map(({ url }) => url.pathname)).toEqual([
      "/api/v1/nodes/a%2Fb%20%3Fc%23d%20%C3%A9",
    ]);
  });

  it("carries no query parameter", async () => {
    const { requests } = await readNode("n-1", accepted(NODE_WIRE));
    expect(requests.map(({ url }) => url.search)).toEqual([""]);
  });

  it("returns the node's summary, its aliases and its attributes", async () => {
    const { state } = await readNode("n-1", accepted(NODE_WIRE));
    expect(state.data).toMatchObject({
      node: {
        id: "n-1",
        nodeType: "Project",
        canonicalName: "Projeto Apollo",
        status: "active",
      },
      aliases: [
        { id: "al-1", alias: "Apollo", kind: "synonym" },
        { id: "al-2", alias: "Projeto A", kind: "abbreviation" },
      ],
      attributes: [{ id: "at-1" }, { id: "at-2" }, { id: "at-3" }],
    });
  });

  it("returns each attribute with its identity, attribute-key name, value, validity start, validity end, status and whether it is current", async () => {
    const { state } = await readNode("n-1", accepted(NODE_WIRE));
    expect(state.data?.attributes).toMatchObject([
      {
        id: "at-1",
        attributeKey: "status_text",
        value: "Em andamento",
        validFrom: "2024-01-15",
        validTo: "2025-06-30",
        status: "superseded",
        isCurrent: false,
      },
      {
        id: "at-2",
        attributeKey: "status_text",
        value: "Concluído",
        validFrom: "2025-07-01",
        validTo: null,
        status: "active",
        isCurrent: true,
      },
      {
        id: "at-3",
        attributeKey: "sigla",
        value: "APL",
        validFrom: null,
        validTo: null,
        status: "active",
        isCurrent: true,
      },
    ]);
  });

  it("fails with RESOURCE_NOT_FOUND when the knowledge base refuses the node with that code", async () => {
    const { state } = await readNode(
      "n-9",
      answers(() =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "RESOURCE_NOT_FOUND",
              message: "KnowledgeNode not found",
              details: { entity: "KnowledgeNode", id: "n-9" },
            },
          },
          404,
        ),
      ),
    );
    expect(factsOf(state.error).code).toBe("RESOURCE_NOT_FOUND");
  });
});
