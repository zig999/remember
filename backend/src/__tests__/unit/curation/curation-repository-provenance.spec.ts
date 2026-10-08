import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import type { ItemKind } from "../../../modules/curation/dto/enums.dto.js";
import {
  appendProvenanceFragment,
  copyProvenance,
} from "../../../modules/curation/repository/curation.repository.js";

const PREDECESSOR_ID = "88888888-0000-4000-8000-000000000001";
const SUCCESSOR_ID = "88888888-0000-4000-8000-000000000002";
const FRAGMENT_ID = "11111111-0000-4000-8000-000000000004";

const CONFLICT_CLAUSE =
  /ON CONFLICT\s*\(([^)]*)\)\s*(?:WHERE\s+(.*?)\s+)?DO\s+(\w+)/is;
const WHITESPACE = /\s+/g;
const COLUMN_SEPARATOR = ",";

interface ConflictClause {
  readonly columns: readonly string[];
  readonly predicate: string | null;
  readonly action: string;
}

interface RecordingFunction {
  readonly name: string;
  readonly record: (client: PoolClient, kind: ItemKind) => Promise<number>;
}

interface Branch {
  readonly kind: ItemKind;
  readonly indexColumns: readonly string[];
  readonly indexPredicate: string;
}

const RECORDING_FUNCTIONS: readonly RecordingFunction[] = [
  {
    name: "copyProvenance",
    record: (client, kind) =>
      copyProvenance(client, kind, PREDECESSOR_ID, SUCCESSOR_ID),
  },
  {
    name: "appendProvenanceFragment",
    record: (client, kind) =>
      appendProvenanceFragment(client, kind, SUCCESSOR_ID, FRAGMENT_ID),
  },
];

const BRANCHES: readonly Branch[] = [
  {
    kind: "link",
    indexColumns: ["fragment_id", "link_id"],
    indexPredicate: "link_id is not null",
  },
  {
    kind: "attribute",
    indexColumns: ["attribute_id", "fragment_id"],
    indexPredicate: "attribute_id is not null",
  },
];

function statementsOf(sent: string[]): PoolClient {
  const query = async (
    sql: string
  ): Promise<{ rows: never[]; rowCount: number }> => {
    sent.push(sql);
    return { rows: [], rowCount: 0 };
  };
  return { query } as unknown as PoolClient;
}

function conflictClauseOf(sql: string): ConflictClause {
  const match = CONFLICT_CLAUSE.exec(sql.replace(WHITESPACE, " "));
  if (match === null) throw new Error(`no ON CONFLICT clause in: ${sql}`);
  const [, columnList = "", predicate, action = ""] = match;
  return {
    columns: columnList
      .split(COLUMN_SEPARATOR)
      .map((column) => column.trim())
      .sort(),
    predicate: predicate === undefined ? null : predicate.toLowerCase(),
    action: action.toLowerCase(),
  };
}

describe("the provenance statement a repository function sends for an item that may already hold the fragment", () => {
  describe.each(RECORDING_FUNCTIONS)("$name", ({ record }) => {
    it.each(BRANCHES)(
      "names the arbiter columns and the predicate of the partial unique index of a $kind, and skips the conflicting row",
      async ({ kind, indexColumns, indexPredicate }) => {
        const sent: string[] = [];
        const client = statementsOf(sent);

        await record(client, kind);

        expect(sent.map(conflictClauseOf)).toEqual([
          {
            columns: indexColumns,
            predicate: indexPredicate,
            action: "nothing",
          },
        ]);
      }
    );
  });
});
