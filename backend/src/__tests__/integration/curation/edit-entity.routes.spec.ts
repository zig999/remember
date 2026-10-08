import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CHAT_INGEST_TOOL_NAMES,
  CHAT_TOOL_NAMES,
} from "../../../modules/chat/service/tool-catalog.js";
import { EditEffectSchema } from "../../../modules/curation/dto/edit-entity.dto.js";
import {
  NEEDS_REVIEW_NODE_ID,
  NODE_ID,
  PHASE_VALUE,
  REASON,
  buildWorld,
  editOf,
  mixedEdit,
  mixedEditEntries,
  onlyRow,
  setChange,
} from "../../unit/curation/edit-entity-world.js";
import type { ServiceModule } from "./edit-entity-routing.js";
import {
  OWNER_CLAIMS,
  acceptedOf,
  generateSigningKey,
  openRouteApp,
  refusalOf,
  sendEdit,
  serve,
  signToken,
  stopServing,
} from "./edit-entity-route-harness.js";
import type { RouteApp } from "./edit-entity-route-harness.js";

vi.mock(
  "../../../modules/curation/service/edit-entity.service.js",
  async (importActual) => {
    const { forwardingModule } = await import("./edit-entity-routing.js");
    return forwardingModule(await importActual<ServiceModule>());
  }
);

const FIRST_VALUE_EDIT = editOf([setChange("phase", PHASE_VALUE)]);
const SET_PHASE = { attribute_key: "phase", kind: "set", value: PHASE_VALUE };
const NOT_A_DATE = "01/10/2026";
const NOT_A_UUID = "not-a-uuid";
const STATEMENT_TIMEOUT_CODE = "57014";
const FORMAT_CODE = "VALIDATION_INVALID_FORMAT";
const UNAVAILABLE_CODE = "SYSTEM_SERVICE_UNAVAILABLE";
const EXPIRED_LIFETIME_SECONDS = -60;
const MCP_ENDPOINTS = ["ingest", "query", "curation"];
const MCP_ACCEPT = "application/json, text/event-stream";
const TOOLS_LIST = { jsonrpc: "2.0", id: 1, method: "tools/list" };
const EDIT_TOOL_NAME = /edit/i;

const PATH_NODES: ReadonlyArray<readonly [string, string]> = [
  ["an active node", NODE_ID],
  ["a node in needs_review", NEEDS_REVIEW_NODE_ID],
];

type Credential = (current: RouteApp) => Promise<string | null>;

async function bearerSignedBy(
  key: CryptoKey,
  subject: string | undefined,
  lifetimeSeconds: number
): Promise<string> {
  return `Bearer ${await signToken(key, { subject, lifetimeSeconds })}`;
}

const REFUSED_CREDENTIALS: ReadonlyArray<readonly [string, Credential]> = [
  ["no Authorization header", async () => null],
  [
    "a token signed by a key the provider did not publish",
    async () =>
      bearerSignedBy(
        (await generateSigningKey()).privateKey,
        OWNER_CLAIMS.subject,
        OWNER_CLAIMS.lifetimeSeconds
      ),
  ],
  [
    "an expired token",
    async (current) =>
      bearerSignedBy(
        current.key.privateKey,
        OWNER_CLAIMS.subject,
        EXPIRED_LIFETIME_SECONDS
      ),
  ],
  [
    "a token that names no owner",
    async (current) =>
      bearerSignedBy(
        current.key.privateKey,
        undefined,
        OWNER_CLAIMS.lifetimeSeconds
      ),
  ],
];

let site: RouteApp;

beforeAll(async () => {
  site = await openRouteApp();
});

afterAll(async () => {
  await site.app.close();
});

afterEach(() => {
  stopServing();
  site.records.length = 0;
});

function namedBy(body: unknown): string | undefined {
  const answer = body as {
    node_id?: string;
    error?: { details?: { node_id?: string } };
  };
  return answer.node_id ?? answer.error?.details?.node_id;
}

function identitiesOf(
  entries: ReadonlyArray<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return entries.map((entry) => ({
    attribute_key: entry["attribute_key"],
    item_id: entry["item_id"],
    predecessor_id: entry["predecessor_id"],
  }));
}

async function listedTools(
  current: RouteApp,
  endpoint: string
): Promise<string[]> {
  const response = await current.app.inject({
    method: "POST",
    url: `/api/v1/mcp/${endpoint}`,
    headers: {
      authorization: `Bearer ${current.token}`,
      accept: MCP_ACCEPT,
    },
    payload: TOOLS_LIST,
  });
  const body = response.json() as {
    result?: { tools?: Array<{ name: string }> };
  };
  return (body.result?.tools ?? []).map((tool) => tool.name);
}

describe("an accepted entity edit over REST", () => {
  it("answers HTTP 200", async () => {
    const world = buildWorld();
    serve(world);

    const answer = await sendEdit(site, {
      nodeId: NODE_ID,
      payload: FIRST_VALUE_EDIT,
    });

    expect(answer.status).toBe(200);
  });

  it("answers node_id, action_id and applied with no envelope around them", async () => {
    const world = buildWorld();
    serve(world);

    const answer = await sendEdit(site, {
      nodeId: NODE_ID,
      payload: FIRST_VALUE_EDIT,
    });

    expect(Object.keys(acceptedOf(answer)).sort()).toEqual([
      "action_id",
      "applied",
      "node_id",
    ]);
  });

  it("writes the effect of a first value as first_value", async () => {
    const world = buildWorld();
    serve(world);

    const answer = await sendEdit(site, {
      nodeId: NODE_ID,
      payload: FIRST_VALUE_EDIT,
    });

    expect(acceptedOf(answer).applied.map((entry) => entry.effect)).toEqual([
      "first_value",
    ]);
  });
});

describe("the edit a request carries", () => {
  it.each(PATH_NODES)(
    "is applied to the node whose identity the path names, %s",
    async (_label, pathNodeId) => {
      const world = buildWorld();
      serve(world);

      const answer = await sendEdit(site, {
        nodeId: pathNodeId,
        payload: FIRST_VALUE_EDIT,
      });

      expect(namedBy(answer.body)).toBe(pathNodeId);
    }
  );

  it("takes the reason of the recorded curation action from the reason field of the JSON body", async () => {
    const world = buildWorld();
    serve(world);

    await sendEdit(site, { nodeId: NODE_ID, payload: FIRST_VALUE_EDIT });

    expect(onlyRow(world.store.curationAction)["reason"]).toBe(REASON);
  });

  it("takes the changes it applies from the changes field of the JSON body", async () => {
    const world = buildWorld();
    serve(world);
    const sent = mixedEdit();

    const answer = await sendEdit(site, { nodeId: NODE_ID, payload: sent });

    expect(acceptedOf(answer).applied.map((entry) => entry.attribute_key)).toEqual(
      sent.changes.map((change) => change.attribute_key)
    );
  });
});

describe("the applied entries of an accepted edit on the wire", () => {
  it("writes every effect with an underscore for each hyphen of its enumeration value", async () => {
    const world = buildWorld();
    serve(world);

    const answer = await sendEdit(site, {
      nodeId: NODE_ID,
      payload: mixedEdit(),
    });

    expect(acceptedOf(answer).applied.map((entry) => entry.effect)).toEqual([
      "first_value",
      "unchanged",
      "succession",
      "removal",
      "addition",
      "correction",
    ]);
  });

  it("keeps item_id and predecessor_id on every entry, null where the effect has none", async () => {
    const world = buildWorld();
    serve(world);

    const answer = await sendEdit(site, {
      nodeId: NODE_ID,
      payload: mixedEdit(),
    });

    expect(identitiesOf(acceptedOf(answer).applied)).toStrictEqual(
      identitiesOf(mixedEditEntries(world))
    );
  });
});

describe("the edit effect enumeration", () => {
  it("holds exactly first-value, addition, succession, correction, removal and unchanged", () => {
    const values = [...EditEffectSchema.options].sort();

    expect(values).toEqual([
      "addition",
      "correction",
      "first-value",
      "removal",
      "succession",
      "unchanged",
    ]);
  });
});

describe("a shape refusal over REST", () => {
  it("carries issues of path and message in its details, each path joined by a dot", async () => {
    const payload = {
      reason: REASON,
      changes: [{ ...SET_PHASE, valid_from: NOT_A_DATE }],
    };

    const answer = await sendEdit(site, { nodeId: NODE_ID, payload });

    expect(
      (refusalOf(answer).error.details as { issues: unknown[] }).issues
    ).toContainEqual({
      path: "changes.0.valid_from",
      message: expect.any(String),
    });
  });

  it("answers HTTP 422 VALIDATION_INVALID_FORMAT for a node_id path segment that is not a well-formed identifier", async () => {
    const world = buildWorld();
    serve(world);

    const answer = await sendEdit(site, {
      nodeId: NOT_A_UUID,
      payload: FIRST_VALUE_EDIT,
    });

    expect({ status: answer.status, code: refusalOf(answer).error.code }).toEqual(
      { status: 422, code: FORMAT_CODE }
    );
  });
});

describe("an edit whose statement times out", () => {
  it("answers HTTP 503 SYSTEM_SERVICE_UNAVAILABLE, as an unreachable store does", async () => {
    const world = buildWorld({
      failInsert: { table: "node_attribute", code: STATEMENT_TIMEOUT_CODE },
    });
    serve(world);

    const answer = await sendEdit(site, {
      nodeId: NODE_ID,
      payload: FIRST_VALUE_EDIT,
    });

    expect({ status: answer.status, code: refusalOf(answer).error.code }).toEqual(
      { status: 503, code: UNAVAILABLE_CODE }
    );
  });
});

describe("a request without a valid owner bearer token", () => {
  it.each(REFUSED_CREDENTIALS)(
    "carrying %s is refused without the edit running",
    async (_label, credential) => {
      const world = buildWorld();
      serve(world);
      const authorization = await credential(site);

      const answer = await sendEdit(site, {
        nodeId: NODE_ID,
        payload: FIRST_VALUE_EDIT,
        authorization,
      });

      expect({
        status: answer.status,
        connections: world.events.length,
        store: world.store,
      }).toEqual({ status: 401, connections: 0, store: world.untouched });
    }
  );
});

describe("the language-model tool surfaces", () => {
  it.each(MCP_ENDPOINTS)(
    "list no tool that edits an entity on the %s transport",
    async (endpoint) => {
      const names = await listedTools(site, endpoint);

      expect({
        listed: names.length > 0,
        editing: names.filter((name) => EDIT_TOOL_NAME.test(name)),
      }).toEqual({ listed: true, editing: [] });
    }
  );

  it("list no tool that edits an entity in the chat tool catalog", () => {
    const names = [...CHAT_TOOL_NAMES, ...CHAT_INGEST_TOOL_NAMES];

    expect(names.filter((name) => EDIT_TOOL_NAME.test(name))).toEqual([]);
  });
});
