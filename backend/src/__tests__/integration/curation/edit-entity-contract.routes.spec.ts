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
  ABSENT_NODE_ID,
  CORRECTED_NICKNAME,
  DEADLINE_HELD_ID,
  DEADLINE_SUPERSEDED_ID,
  EMAIL_HELD_ID,
  HELD_NICKNAME,
  NEEDS_REVIEW_NODE_ID,
  NEW_DEADLINE,
  NICKNAME_HELD_ID,
  NICKNAME_KEY_ID,
  NODE_ID,
  OTHER_PHASE_VALUE,
  PHASE_VALUE,
  REASON,
  buildWorld,
  editOf,
  heldAttribute,
  mixedEdit,
  setChange,
} from "../../unit/curation/edit-entity-world.js";
import type {
  EditWorld,
  WorldOptions,
} from "../../unit/curation/edit-entity-world.js";
import type { ServiceModule } from "./edit-entity-routing.js";
import {
  errorLogsOf,
  openRouteApp,
  refusalOf,
  sendEdit,
  serve,
  stopServing,
  unreachablePool,
} from "./edit-entity-route-harness.js";
import type { Answer, RouteApp } from "./edit-entity-route-harness.js";

vi.mock(
  "../../../modules/curation/service/edit-entity.service.js",
  async (importActual) => {
    const { forwardingModule } = await import("./edit-entity-routing.js");
    return forwardingModule(await importActual<ServiceModule>());
  }
);

const FORMAT_CODE = "VALIDATION_INVALID_FORMAT";
const FORMAT_MESSAGE = "Request payload failed validation.";
const NOT_FOUND_CODE = "RESOURCE_NOT_FOUND";
const NOT_ACTIVE_CODE = "BUSINESS_NODE_NOT_ACTIVE";
const UNKNOWN_KEY_CODE = "BUSINESS_UNKNOWN_ATTRIBUTE_KEY";
const INVALID_VALUE_CODE = "BUSINESS_INVALID_ATTRIBUTE_VALUE";
const INCOHERENT_CODE = "BUSINESS_TEMPORAL_INCOHERENT";
const CONFLICT_CODE = "BUSINESS_ENTITY_EDIT_CONFLICT";
const DISPUTED_CODE = "BUSINESS_ENTITY_EDIT_DISPUTED";
const NO_CHANGES_CODE = "BUSINESS_ENTITY_EDIT_NO_CHANGES";
const UNAVAILABLE_CODE = "SYSTEM_SERVICE_UNAVAILABLE";
const UNAVAILABLE_MESSAGE = "A backing service is temporarily unavailable.";
const INTERNAL_CODE = "SYSTEM_INTERNAL_ERROR";
const INTERNAL_MESSAGE = "Internal server error.";

const STATEMENT_TIMEOUT_CODE = "57014";
const UNIQUE_VIOLATION_CODE = "23505";
const UNEXPECTED_STORE_CODE = "XX000";
const CONNECTION_REFUSED = Object.assign(
  new Error("connect ECONNREFUSED 127.0.0.1:5432"),
  { code: "ECONNREFUSED" }
);

const MERGED_NODE_ID = "66666666-0000-4000-8000-0000000000aa";
const NOT_A_UUID = "not-a-uuid";
const NOT_A_DATE = "01/10/2026";
const UNCATALOGUED_KEY = "nonexistent";
const OUTSIDE_THE_DOMAIN = "inexistente";
const ANOTHER_EMAIL = "outro@exemplo.com";
const REASON_OF_1001 = "a".repeat(1001);
const SUPERSEDED_AT = new Date("2026-09-01T10:00:00.000Z");

const SET_PHASE = { attribute_key: "phase", kind: "set", value: PHASE_VALUE };
const SET_UNCATALOGUED = {
  attribute_key: UNCATALOGUED_KEY,
  kind: "set",
  value: "x",
};
const FIRST_VALUE_EDIT = editOf([setChange("phase", PHASE_VALUE)]);

interface Expected {
  readonly status: number;
  readonly body: unknown;
}

interface Scenario {
  readonly node?: string;
  readonly body?: object;
  readonly world?: WorldOptions;
  readonly prepare?: (world: EditWorld) => void;
  readonly unreachable?: boolean;
  readonly expected: Expected;
}

type Row = readonly [string, Scenario];

function rawEdit(...changes: object[]): object {
  return { reason: REASON, changes };
}

function refusedAs(status: number, error: unknown): Expected {
  return { status, body: { ok: false, error } };
}

function refusedWith(status: number, code: string, details?: unknown): Expected {
  const named = details === undefined ? {} : { details };
  return refusedAs(status, expect.objectContaining({ code, ...named }));
}

const RECORDED = expect.any(String);
const ISSUE_SHAPE = "message+path:dotted,string";
const DOTTED_PATH = /^\w+(\.\w+)*$/;

function issueShapeOf(issue: Record<string, unknown>): string {
  const keys = Object.keys(issue).sort().join("+");
  const path = issue["path"];
  const pathShape =
    typeof path === "string" && DOTTED_PATH.test(path) ? "dotted" : "other";
  return `${keys}:${pathShape},${typeof issue["message"]}`;
}

function withIssueShapes(body: unknown): unknown {
  const refusal = body as { error?: { details?: { issues?: unknown } } };
  const issues = refusal.error?.details?.issues;
  if (!Array.isArray(issues)) {
    return body;
  }
  const shapes = new Set(
    issues.map((issue) => issueShapeOf(issue as Record<string, unknown>))
  );
  return {
    ...refusal,
    error: { ...refusal.error, details: { issues: [...shapes].join("|") } },
  };
}

function appliedAs(
  attributeKey: string,
  effect: string,
  itemId: unknown,
  predecessorId: unknown
): object {
  return {
    attribute_key: attributeKey,
    effect,
    item_id: itemId,
    predecessor_id: predecessorId,
  };
}

function addMergedNode(world: EditWorld): void {
  const [active] = world.store.nodes;
  world.store.nodes.push({
    ...active,
    id: MERGED_NODE_ID,
    status: "merged",
    merged_into_node_id: NODE_ID,
  });
}

const FORMAT_REFUSAL = refusedAs(422, {
  code: FORMAT_CODE,
  message: FORMAT_MESSAGE,
  details: { issues: ISSUE_SHAPE },
});

const INCOHERENT_VALIDITY = { valid_from: "2026-09-01", valid_to: "2026-08-01" };

const CONTRACT_ROWS: ReadonlyArray<Row> = [
  [
    "an accepted edit with HTTP 200 and node_id, action_id and applied with no envelope",
    {
      body: mixedEdit(),
      expected: {
        status: 200,
        body: {
          node_id: NODE_ID,
          action_id: expect.any(String),
          applied: [
            appliedAs("phase", "first_value", RECORDED, null),
            appliedAs("stakeholder", "unchanged", null, null),
            appliedAs("deadline", "succession", RECORDED, DEADLINE_HELD_ID),
            appliedAs("email", "removal", null, EMAIL_HELD_ID),
            appliedAs("stakeholder", "addition", RECORDED, null),
            appliedAs("nickname", "correction", RECORDED, NICKNAME_HELD_ID),
          ],
        },
      },
    },
  ],
  [
    "a reason of 1001 characters with HTTP 422 VALIDATION_INVALID_FORMAT",
    {
      body: { reason: REASON_OF_1001, changes: [SET_PHASE] },
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a set change that states no value with HTTP 422 VALIDATION_INVALID_FORMAT",
    {
      body: rawEdit({ attribute_key: "phase", kind: "set" }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a remove change that states a value with HTTP 422 VALIDATION_INVALID_FORMAT",
    {
      body: rawEdit({
        attribute_key: "email",
        kind: "remove",
        item_id: EMAIL_HELD_ID,
        value: "x",
      }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a remove change that names no attribute with HTTP 422 VALIDATION_INVALID_FORMAT",
    {
      body: rawEdit({ attribute_key: "email", kind: "remove" }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a body with no reason with HTTP 422 VALIDATION_INVALID_FORMAT",
    { body: { changes: [SET_PHASE] }, expected: FORMAT_REFUSAL },
  ],
  [
    "a null reason with HTTP 422 VALIDATION_INVALID_FORMAT",
    { body: { reason: null, changes: [SET_PHASE] }, expected: FORMAT_REFUSAL },
  ],
  [
    "changes of the wrong type with HTTP 422 VALIDATION_INVALID_FORMAT",
    { body: { reason: REASON, changes: "none" }, expected: FORMAT_REFUSAL },
  ],
  [
    "a change kind outside its closed set with HTTP 422 VALIDATION_INVALID_FORMAT",
    {
      body: rawEdit({ ...SET_PHASE, kind: "replace" }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "an item_id that is not a well-formed identifier with HTTP 422 VALIDATION_INVALID_FORMAT",
    {
      body: rawEdit({ ...SET_PHASE, item_id: NOT_A_UUID }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a valid_from that is not YYYY-MM-DD with HTTP 422 VALIDATION_INVALID_FORMAT",
    {
      body: rawEdit({ ...SET_PHASE, valid_from: NOT_A_DATE }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a request carrying no body with HTTP 422 VALIDATION_INVALID_FORMAT",
    { expected: FORMAT_REFUSAL },
  ],
  [
    "a node_id path segment that is not a well-formed identifier with HTTP 422 VALIDATION_INVALID_FORMAT",
    { node: NOT_A_UUID, body: FIRST_VALUE_EDIT, expected: FORMAT_REFUSAL },
  ],
  [
    "a node that is not held with HTTP 404 RESOURCE_NOT_FOUND naming the node",
    {
      node: ABSENT_NODE_ID,
      body: FIRST_VALUE_EDIT,
      expected: refusedWith(404, NOT_FOUND_CODE, { node_id: ABSENT_NODE_ID }),
    },
  ],
  [
    "a node that is not active with HTTP 409 BUSINESS_NODE_NOT_ACTIVE naming the node and its status",
    {
      node: NEEDS_REVIEW_NODE_ID,
      body: FIRST_VALUE_EDIT,
      expected: refusedWith(409, NOT_ACTIVE_CODE, {
        node_id: NEEDS_REVIEW_NODE_ID,
        status: "needs_review",
      }),
    },
  ],
  [
    "a key the catalog does not hold for the node type with HTTP 422 BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key and the type",
    {
      body: editOf([setChange(UNCATALOGUED_KEY, "x")]),
      expected: refusedWith(422, UNKNOWN_KEY_CODE, {
        attribute_key: UNCATALOGUED_KEY,
        node_type: "Project",
      }),
    },
  ],
  [
    "a value that does not read as its value type with HTTP 422 BUSINESS_INVALID_ATTRIBUTE_VALUE naming the type and the value",
    {
      body: editOf([setChange("deadline", "not-a-date")]),
      expected: refusedWith(422, INVALID_VALUE_CODE, {
        value_type: "date",
        value: "not-a-date",
      }),
    },
  ],
  [
    "a value outside the allowed values with HTTP 422 BUSINESS_INVALID_ATTRIBUTE_VALUE naming the key, the value and the allowed values",
    {
      body: editOf([setChange("phase", OUTSIDE_THE_DOMAIN)]),
      expected: refusedWith(422, INVALID_VALUE_CODE, {
        attribute_key: "phase",
        value: OUTSIDE_THE_DOMAIN,
        allowed_values: expect.arrayContaining([PHASE_VALUE, OTHER_PHASE_VALUE]),
      }),
    },
  ],
  [
    "a validity stated on a key that is not temporal with HTTP 422 BUSINESS_TEMPORAL_INCOHERENT",
    {
      body: editOf([
        setChange("phase", PHASE_VALUE, { valid_from: "2026-09-01" }),
      ]),
      expected: refusedWith(422, INCOHERENT_CODE),
    },
  ],
  [
    "a validity start that is not before its end with HTTP 422 BUSINESS_TEMPORAL_INCOHERENT",
    {
      body: editOf([setChange("deadline", NEW_DEADLINE, INCOHERENT_VALIDITY)]),
      expected: refusedWith(422, INCOHERENT_CODE),
    },
  ],
  [
    "a validity end stated without a start and not after today with HTTP 422 BUSINESS_TEMPORAL_INCOHERENT",
    {
      body: editOf([
        setChange("deadline", NEW_DEADLINE, { valid_to: "2020-01-01" }),
      ]),
      expected: refusedWith(422, INCOHERENT_CODE),
    },
  ],
  [
    "a named attribute that is not live with HTTP 409 BUSINESS_ENTITY_EDIT_CONFLICT naming the key and the item",
    {
      body: editOf([
        setChange("deadline", NEW_DEADLINE, { item_id: DEADLINE_SUPERSEDED_ID }),
      ]),
      expected: refusedWith(409, CONFLICT_CODE, {
        attribute_key: "deadline",
        item_id: DEADLINE_SUPERSEDED_ID,
      }),
    },
  ],
  [
    "a named attribute that carries a supersession time with HTTP 409 BUSINESS_ENTITY_EDIT_CONFLICT naming the key and the item",
    {
      world: {
        attributes: [
          heldAttribute({
            id: NICKNAME_HELD_ID,
            attribute_key_id: NICKNAME_KEY_ID,
            value: HELD_NICKNAME,
            superseded_at: SUPERSEDED_AT,
          }),
        ],
      },
      body: editOf([
        setChange("nickname", CORRECTED_NICKNAME, { item_id: NICKNAME_HELD_ID }),
      ]),
      expected: refusedWith(409, CONFLICT_CODE, {
        attribute_key: "nickname",
        item_id: NICKNAME_HELD_ID,
      }),
    },
  ],
  [
    "a second current value of a key that allows one with HTTP 409 BUSINESS_ENTITY_EDIT_CONFLICT naming the key",
    {
      body: editOf([setChange("email", ANOTHER_EMAIL)]),
      expected: refusedWith(409, CONFLICT_CODE, { attribute_key: "email" }),
    },
  ],
  [
    "an attribute another operation changed first with HTTP 409 BUSINESS_ENTITY_EDIT_CONFLICT naming the key and the item",
    {
      world: { supersedeWhileWaiting: DEADLINE_HELD_ID },
      body: editOf([
        setChange("deadline", NEW_DEADLINE, { item_id: DEADLINE_HELD_ID }),
      ]),
      expected: refusedWith(409, CONFLICT_CODE, {
        attribute_key: "deadline",
        item_id: DEADLINE_HELD_ID,
      }),
    },
  ],
  [
    "a disputed attribute with HTTP 409 BUSINESS_ENTITY_EDIT_DISPUTED naming the key and the item",
    {
      world: {
        attributes: [
          heldAttribute({
            id: NICKNAME_HELD_ID,
            attribute_key_id: NICKNAME_KEY_ID,
            value: HELD_NICKNAME,
            status: "disputed",
          }),
        ],
      },
      body: editOf([
        setChange("nickname", CORRECTED_NICKNAME, { item_id: NICKNAME_HELD_ID }),
      ]),
      expected: refusedWith(409, DISPUTED_CODE, {
        attribute_key: "nickname",
        item_id: NICKNAME_HELD_ID,
      }),
    },
  ],
  [
    "an edit that changes nothing with HTTP 422 BUSINESS_ENTITY_EDIT_NO_CHANGES",
    { body: editOf([]), expected: refusedWith(422, NO_CHANGES_CODE) },
  ],
  [
    "a write a uniqueness guard of the store refuses with HTTP 422 BUSINESS_TEMPORAL_INCOHERENT",
    {
      world: {
        failInsert: { table: "node_attribute", code: UNIQUE_VIOLATION_CODE },
      },
      body: FIRST_VALUE_EDIT,
      expected: refusedWith(422, INCOHERENT_CODE),
    },
  ],
  [
    "an unreachable store with HTTP 503 SYSTEM_SERVICE_UNAVAILABLE and its fixed message",
    {
      unreachable: true,
      body: FIRST_VALUE_EDIT,
      expected: refusedAs(503, {
        code: UNAVAILABLE_CODE,
        message: UNAVAILABLE_MESSAGE,
      }),
    },
  ],
  [
    "a statement that times out with HTTP 503 SYSTEM_SERVICE_UNAVAILABLE and its fixed message",
    {
      world: {
        failInsert: { table: "node_attribute", code: STATEMENT_TIMEOUT_CODE },
      },
      body: FIRST_VALUE_EDIT,
      expected: refusedAs(503, {
        code: UNAVAILABLE_CODE,
        message: UNAVAILABLE_MESSAGE,
      }),
    },
  ],
  [
    "an unexpected cause with HTTP 500 SYSTEM_INTERNAL_ERROR, its fixed message and no cause",
    {
      world: {
        failInsert: { table: "node_attribute", code: UNEXPECTED_STORE_CODE },
      },
      body: FIRST_VALUE_EDIT,
      expected: refusedAs(500, { code: INTERNAL_CODE, message: INTERNAL_MESSAGE }),
    },
  ],
];

const PRECEDENCE_ROWS: ReadonlyArray<Row> = [
  [
    "a change whose valid_from is not written YYYY-MM-DD and whose key the catalog does not hold",
    {
      body: rawEdit({ ...SET_UNCATALOGUED, valid_from: NOT_A_DATE }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a body with no reason and an identity at which no knowledge node is held",
    {
      node: ABSENT_NODE_ID,
      body: { changes: [SET_PHASE] },
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a reason of 1001 characters and a node whose status is merged",
    {
      node: MERGED_NODE_ID,
      prepare: addMergedNode,
      body: { reason: REASON_OF_1001, changes: [SET_PHASE] },
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a change whose valid_from is not written YYYY-MM-DD and an identity at which no knowledge node is held",
    {
      node: ABSENT_NODE_ID,
      body: rawEdit({ ...SET_PHASE, valid_from: NOT_A_DATE }),
      expected: FORMAT_REFUSAL,
    },
  ],
  [
    "a first change naming a key the catalog does not hold and a second change whose kind is neither set nor remove",
    {
      body: rawEdit(SET_UNCATALOGUED, { ...SET_PHASE, kind: "replace" }),
      expected: FORMAT_REFUSAL,
    },
  ],
];

const CLIENT_ERROR_FLOOR = 400;
const SERVER_ERROR_FLOOR = 500;

const REFUSED_BY_THE_CALLER: ReadonlyArray<Row> = CONTRACT_ROWS.filter(
  ([, scenario]) =>
    scenario.expected.status >= CLIENT_ERROR_FLOOR &&
    scenario.expected.status < SERVER_ERROR_FLOOR
);

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

async function respondWithStoreDown(scenario: Scenario): Promise<Answer> {
  const down = await openRouteApp(unreachablePool(CONNECTION_REFUSED));
  try {
    return await sendEdit(down, {
      nodeId: scenario.node ?? NODE_ID,
      payload: scenario.body,
    });
  } finally {
    await down.app.close();
  }
}

async function respondTo(scenario: Scenario): Promise<Answer> {
  if (scenario.unreachable === true) {
    return respondWithStoreDown(scenario);
  }
  const world = buildWorld(scenario.world);
  scenario.prepare?.(world);
  serve(world);
  return sendEdit(site, {
    nodeId: scenario.node ?? NODE_ID,
    payload: scenario.body,
  });
}

describe("the answers the entity-editing contract states", () => {
  it.each(CONTRACT_ROWS)("answers %s", async (_label, scenario) => {
    const answer = await respondTo(scenario);

    expect({ status: answer.status, body: withIssueShapes(answer.body) }).toEqual(
      scenario.expected
    );
  });
});

describe("an edit failing a format check and a later check", () => {
  it.each(PRECEDENCE_ROWS)(
    "is refused as VALIDATION_INVALID_FORMAT when it carries %s",
    async (_label, scenario) => {
      const answer = await respondTo(scenario);

      expect({ status: answer.status, code: refusalOf(answer).error.code }).toEqual({
        status: 422,
        code: FORMAT_CODE,
      });
    }
  );
});

describe("a refusal for a business or validation cause", () => {
  it.each(REFUSED_BY_THE_CALLER)(
    "is not logged at error level: %s",
    async (_label, scenario) => {
      const answer = await respondTo(scenario);

      expect({
        status: answer.status,
        errorLogs: errorLogsOf(site),
      }).toEqual({ status: scenario.expected.status, errorLogs: [] });
    }
  );
});
