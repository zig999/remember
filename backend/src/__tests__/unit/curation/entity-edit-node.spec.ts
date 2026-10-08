import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import { mapErrorToHttpResponse } from "../../../modules/curation/mcp/error-envelope.js";
import { loadActiveNodeForEdit } from "../../../modules/curation/service/entity-edit-node.js";
import {
  ConflictError,
  ResourceNotFoundError,
} from "../../../modules/curation/service/errors.js";

const ABSENT_NODE_ID = "44444444-0000-4000-8000-0000000000a0";
const NODE_TYPE_ID = "55555555-0000-4000-8000-000000000001";
const REVIEW_NODE_ID = "44444444-0000-4000-8000-0000000000a1";
const MERGED_NODE_ID = "44444444-0000-4000-8000-0000000000a2";
const DELETED_NODE_ID = "44444444-0000-4000-8000-0000000000a3";
const ACTIVE_NODE_ID = "44444444-0000-4000-8000-0000000000a4";
const NOT_ACTIVE_CODE = "BUSINESS_NODE_NOT_ACTIVE";
const ACCEPTED = "accepted";

type Row = Record<string, unknown>;

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

const NODES: readonly Row[] = [
  nodeRow(ACTIVE_NODE_ID, "active"),
  nodeRow(REVIEW_NODE_ID, "needs_review"),
  nodeRow(MERGED_NODE_ID, "merged"),
  nodeRow(DELETED_NODE_ID, "deleted"),
];

const NODE_BY_STATUS: Readonly<Record<string, string>> = {
  active: ACTIVE_NODE_ID,
  needs_review: REVIEW_NODE_ID,
  merged: MERGED_NODE_ID,
  deleted: DELETED_NODE_ID,
};

function nodeRow(id: string, status: string): Row {
  return {
    id,
    node_type_id: NODE_TYPE_ID,
    canonical_name: `no ${status}`,
    status,
    merged_into_node_id: null,
  };
}

function buildClient(nodes: readonly Row[] = NODES): PoolClient {
  const query = async (sql: string, params: unknown[] = []): Promise<QueryResult> => {
    if (!/FROM\s+knowledge_node\b/i.test(sql)) {
      throw new Error(`statement outside the node guard's reads: ${sql}`);
    }
    const [ids] = params;
    const wanted = Array.isArray(ids) ? ids : [];
    const rows = nodes.filter((row) => wanted.includes(row.id));
    return { rows: structuredClone(rows), rowCount: rows.length };
  };
  return { query } as unknown as PoolClient;
}

async function refusalOf(
  nodeId: string
): Promise<ResourceNotFoundError | ConflictError> {
  try {
    await loadActiveNodeForEdit(buildClient(), nodeId);
  } catch (error) {
    if (error instanceof ResourceNotFoundError || error instanceof ConflictError) {
      return error;
    }
    throw error;
  }
  throw new Error("expected the edit to be refused");
}

async function outcomeOf(nodeId: string): Promise<string> {
  try {
    await loadActiveNodeForEdit(buildClient(), nodeId);
  } catch (error) {
    if (error instanceof ResourceNotFoundError || error instanceof ConflictError) {
      return error.code;
    }
    throw error;
  }
  return ACCEPTED;
}

function textOf(refusal: ResourceNotFoundError | ConflictError): string {
  return `${refusal.message} ${JSON.stringify(refusal.details)}`;
}

describe("an edit naming an identity at which no knowledge node is held", () => {
  it("is refused with RESOURCE_NOT_FOUND", async () => {
    const refusal = await refusalOf(ABSENT_NODE_ID);

    expect(refusal.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("is refused with a message and details that name the node", async () => {
    const refusal = await refusalOf(ABSENT_NODE_ID);

    expect(textOf(refusal)).toContain(ABSENT_NODE_ID);
  });

  it("is answered HTTP 404 over REST", async () => {
    const refusal = await refusalOf(ABSENT_NODE_ID);

    const answer = mapErrorToHttpResponse(refusal);

    expect({ status: answer.statusCode, code: answer.envelope.error.code }).toEqual({
      status: 404,
      code: "RESOURCE_NOT_FOUND",
    });
  });
});

describe("an edit naming a node, by the status the node holds", () => {
  it("is refused for needs_review, merged and deleted and not refused for active", async () => {
    const outcomes: Record<string, string> = {};

    for (const [status, nodeId] of Object.entries(NODE_BY_STATUS)) {
      outcomes[status] = await outcomeOf(nodeId);
    }

    expect(outcomes).toEqual({
      active: ACCEPTED,
      needs_review: NOT_ACTIVE_CODE,
      merged: NOT_ACTIVE_CODE,
      deleted: NOT_ACTIVE_CODE,
    });
  });
});

describe("a not-active refusal", () => {
  it.each([
    ["needs_review", REVIEW_NODE_ID],
    ["merged", MERGED_NODE_ID],
    ["deleted", DELETED_NODE_ID],
  ])("for a %s node names the node", async (_status, nodeId) => {
    const refusal = await refusalOf(nodeId);

    expect(textOf(refusal)).toContain(nodeId);
  });

  it.each([
    ["merged", MERGED_NODE_ID],
    ["deleted", DELETED_NODE_ID],
  ])("for a %s node names that status", async (status, nodeId) => {
    const refusal = await refusalOf(nodeId);

    expect(textOf(refusal)).toContain(status);
  });

  it("for a node under review names the status as needs_review with its underscore, never as needs-review", async () => {
    const refusal = await refusalOf(REVIEW_NODE_ID);

    expect({
      underscored: textOf(refusal).includes("needs_review"),
      hyphenated: textOf(refusal).includes("needs-review"),
    }).toEqual({ underscored: true, hyphenated: false });
  });

  it("is answered HTTP 409 over REST", async () => {
    const refusal = await refusalOf(REVIEW_NODE_ID);

    const answer = mapErrorToHttpResponse(refusal);

    expect({ status: answer.statusCode, code: answer.envelope.error.code }).toEqual({
      status: 409,
      code: NOT_ACTIVE_CODE,
    });
  });
});
