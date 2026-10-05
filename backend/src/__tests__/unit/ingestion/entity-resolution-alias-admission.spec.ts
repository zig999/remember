import type { PoolClient } from "pg";
import { describe, expect, it } from "vitest";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import type {
  ProposeNodeInput,
  ProposeNodeResult,
} from "../../../modules/ingestion/dto/propose-node.dto.js";
import { proposeNodeService } from "../../../modules/ingestion/service/propose-node.service.js";

const ORGANIZATION_TYPE_ID = "00000000-0000-0000-0000-0000000000a1";
const ORGANIZATION_TYPE_NAME = "Organization";
const NOT_ADMITTED_REASON = "ALIAS_NOT_IN_SOURCE";
const DIRECTED_MODEL_VALUE = "directed";
const DIRECTED_PROMPT_VERSION_VALUE = "directed-v1";
const EXTRACTION_MODEL_VALUE = "claude-test-model";
const EXTRACTION_PROMPT_VERSION_VALUE = "v5";
const RUN_A = "44444444-4444-4444-4444-44444444444a";
const RUN_B = "44444444-4444-4444-4444-44444444444b";
const EXISTING_NODE_ID = "existing-node";
const CNPQ_NAME = "Conselho Nacional de Desenvolvimento Científico";
const CNPQ_NAME_UPPERCASE = "CONSELHO NACIONAL DE DESENVOLVIMENTO CIENTÍFICO";
const CNPQ_SOURCE =
  "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto";
const STATE_COMPANY_SOURCE = "a estatal anunciou lucro recorde no trimestre";
const MULTI_PARAGRAPH_SOURCE =
  "Primeiro parágrafo sem siglas.\n\nSegundo parágrafo também sem siglas.\n\nO CNPq encerrou o edital.";

const CATALOG = buildSnapshot({
  nodeTypes: [{ id: ORGANIZATION_TYPE_ID, name: ORGANIZATION_TYPE_NAME }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

interface FakeRun {
  readonly model: string;
  readonly prompt_version: string;
  readonly input_raw_information_id: string;
}

interface FakeNode {
  readonly id: string;
  readonly node_type_id: string;
  readonly status: string;
}

interface FakeAlias {
  readonly node_id: string;
  readonly alias: string;
  readonly alias_norm: string;
  readonly kind: string;
}

interface FakeStore {
  readonly runs: Map<string, FakeRun>;
  readonly contents: Map<string, string>;
  readonly nodes: FakeNode[];
  readonly aliases: FakeAlias[];
}

interface StoreAnswer {
  readonly rows: readonly unknown[];
  readonly rowCount: number;
}

interface SourceVariant {
  readonly label: string;
  readonly source: string;
  readonly alias: string;
}

const SOURCE_VARIANTS: readonly SourceVariant[] = [
  { label: "different case", source: CNPQ_SOURCE, alias: "CNPQ" },
  {
    label: "different accents",
    source: CNPQ_SOURCE,
    alias: "Desenvolvimento Cientifico",
  },
  {
    label: "different inner whitespace",
    source: CNPQ_SOURCE,
    alias: "Desenvolvimento    Científico",
  },
  {
    label: "surrounding whitespace on the alias",
    source: CNPQ_SOURCE,
    alias: "  CNPq  ",
  },
  {
    label: "a paragraph other than the first",
    source: MULTI_PARAGRAPH_SOURCE,
    alias: "CNPq",
  },
];

function dbNorm(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function answerRows(rows: readonly unknown[]): StoreAnswer {
  return { rows, rowCount: rows.length };
}

function stringAt(params: readonly unknown[], index: number): string {
  return String(params[index]);
}

function stringsAt(params: readonly unknown[], index: number): string[] {
  const value = params[index];
  return Array.isArray(value) ? value.map(String) : [];
}

function answerAdmission(
  store: FakeStore,
  params: readonly unknown[]
): StoreAnswer {
  const run = store.runs.get(stringAt(params, 3));
  const content =
    run === undefined ? undefined : store.contents.get(run.input_raw_information_id);
  const contentNorm = content === undefined ? null : dbNorm(content);
  const directed =
    run !== undefined &&
    contentNorm !== null &&
    run.model === stringAt(params, 1) &&
    run.prompt_version === stringAt(params, 2);
  return answerRows(
    stringsAt(params, 0).map((alias) => {
      const aliasNorm = dbNorm(alias);
      const occurs =
        contentNorm !== null && aliasNorm !== "" && contentNorm.includes(aliasNorm);
      return {
        alias,
        admitted: directed || occurs,
        is_name: aliasNorm === dbNorm(stringAt(params, 4)),
      };
    })
  );
}

function answerExactMatch(
  store: FakeStore,
  params: readonly unknown[]
): StoreAnswer {
  const wanted = dbNorm(stringAt(params, 0));
  const typeId = stringAt(params, 1);
  const hit = store.aliases.find(
    (a) =>
      a.alias_norm === wanted &&
      store.nodes.some(
        (n) =>
          n.id === a.node_id && n.node_type_id === typeId && n.status === "active"
      )
  );
  return answerRows(hit === undefined ? [] : [{ node_id: hit.node_id }]);
}

function insertNode(
  store: FakeStore,
  sql: string,
  params: readonly unknown[]
): StoreAnswer {
  const status = /VALUES \(\$1, \$2, '(\w+)'\)/.exec(sql)?.[1] ?? "active";
  const id = `node-${store.nodes.length + 1}`;
  store.nodes.push({ id, node_type_id: stringAt(params, 0), status });
  return answerRows([{ id }]);
}

function insertAlias(
  store: FakeStore,
  sql: string,
  params: readonly unknown[]
): StoreAnswer {
  const kind = /VALUES \(\$1, \$2, '(\w+)', \$3\)/.exec(sql)?.[1] ?? "alias";
  const alias = stringAt(params, 1);
  store.aliases.push({
    node_id: stringAt(params, 0),
    alias,
    alias_norm: dbNorm(alias),
    kind,
  });
  return answerRows([]);
}

function answer(
  store: FakeStore,
  sql: string,
  params: readonly unknown[]
): StoreAnswer {
  if (sql.startsWith("SELECT (CAST")) return answerRows([{ key: "lock-key" }]);
  if (/pg_advisory_xact_lock/i.test(sql)) return answerRows([{}]);
  if (sql.startsWith("SELECT a.alias")) return answerAdmission(store, params);
  if (sql.startsWith("SELECT na.node_id") && sql.includes("alias_norm = norm(")) {
    return answerExactMatch(store, params);
  }
  if (sql.startsWith("SELECT na.node_id") && sql.includes("alias_norm % norm(")) {
    return answerRows([]);
  }
  if (sql.startsWith("INSERT INTO knowledge_node")) {
    return insertNode(store, sql, params);
  }
  if (sql.startsWith("INSERT INTO node_alias")) {
    return insertAlias(store, sql, params);
  }
  throw new Error(`unexpected SQL in store stand-in: ${sql.slice(0, 80)}`);
}

function buildClient(store: FakeStore): PoolClient {
  const query = async (...args: unknown[]): Promise<StoreAnswer> => {
    const sql = String(args[0]).replace(/\s+/g, " ").trim();
    const params: readonly unknown[] = Array.isArray(args[1]) ? args[1] : [];
    return answer(store, sql, params);
  };
  return { query, release: () => undefined } as unknown as PoolClient;
}

function freshStore(): FakeStore {
  return { runs: new Map(), contents: new Map(), nodes: [], aliases: [] };
}

function seedRun(
  store: FakeStore,
  runId: string,
  run: { model: string; promptVersion: string; content: string }
): void {
  const rawId = `raw-${runId}`;
  store.runs.set(runId, {
    model: run.model,
    prompt_version: run.promptVersion,
    input_raw_information_id: rawId,
  });
  store.contents.set(rawId, run.content);
}

function seedExtractionRun(
  store: FakeStore,
  runId: string,
  content: string
): void {
  seedRun(store, runId, {
    model: EXTRACTION_MODEL_VALUE,
    promptVersion: EXTRACTION_PROMPT_VERSION_VALUE,
    content,
  });
}

function seedDirectedRun(
  store: FakeStore,
  runId: string,
  content: string
): void {
  seedRun(store, runId, {
    model: DIRECTED_MODEL_VALUE,
    promptVersion: DIRECTED_PROMPT_VERSION_VALUE,
    content,
  });
}

function seedActiveNode(store: FakeStore, canonicalName: string): void {
  store.nodes.push({
    id: EXISTING_NODE_ID,
    node_type_id: ORGANIZATION_TYPE_ID,
    status: "active",
  });
  store.aliases.push({
    node_id: EXISTING_NODE_ID,
    alias: canonicalName,
    alias_norm: dbNorm(canonicalName),
    kind: "canonical",
  });
}

async function proposeInRun(
  store: FakeStore,
  runId: string,
  input: ProposeNodeInput
): Promise<ProposeNodeResult> {
  const envelope = await proposeNodeService(
    buildClient(store),
    input,
    { llmRunId: runId, rawInformationId: `raw-${runId}` },
    { catalog: CATALOG }
  );
  if (!envelope.ok) throw new Error("the node proposal was refused");
  return envelope.result;
}

function heldBy(
  store: FakeStore,
  nodeId: string
): Array<{ alias: string; kind: string }> {
  return store.aliases
    .filter((a) => a.node_id === nodeId)
    .map((a) => ({ alias: a.alias, kind: a.kind }));
}

function namesNotAdmitted(result: ProposeNodeResult, alias: string): boolean {
  const text = JSON.stringify(result);
  return text.includes(`"${alias}"`) && text.includes(NOT_ADMITTED_REASON);
}

describe("alias admission — acronym written in the source", () => {
  it("creates the node with its canonical name and also holds the alias CNPq", async () => {
    const store = freshStore();
    seedExtractionRun(store, RUN_A, CNPQ_SOURCE);

    const result = await proposeInRun(store, RUN_A, {
      node_type: ORGANIZATION_TYPE_NAME,
      name: CNPQ_NAME,
      aliases: ["CNPq"],
    });

    expect(heldBy(store, result.node_id)).toEqual(
      expect.arrayContaining([
        { alias: CNPQ_NAME, kind: "canonical" },
        { alias: "CNPq", kind: "alias" },
      ])
    );
  });
});

describe("alias admission — alias absent from the source", () => {
  it("takes the proposal, answers its resolution, records no alias and names the alias as not admitted", async () => {
    const store = freshStore();
    seedExtractionRun(store, RUN_A, STATE_COMPANY_SOURCE);

    const result = await proposeInRun(store, RUN_A, {
      node_type: ORGANIZATION_TYPE_NAME,
      name: "Petróleo Brasileiro S.A.",
      aliases: ["Petrobras"],
    });

    const heldAliases = heldBy(store, result.node_id).map((a) => a.alias);
    expect(result.resolution, "the resolution is answered").toBe("created_new");
    expect(result.node_id, "the node identity is answered").toBe(store.nodes[0]?.id);
    expect(heldAliases, "the alias is not recorded").not.toContain("Petrobras");
    expect(
      namesNotAdmitted(result, "Petrobras"),
      "the answer names the alias as not admitted with its reason"
    ).toBe(true);
  });
});

describe("alias admission — alias the source holds in another spelling or position", () => {
  it.each(SOURCE_VARIANTS)(
    "records the alias on the node when the source holds it with $label",
    async (variant) => {
      const store = freshStore();
      seedExtractionRun(store, RUN_A, variant.source);

      const result = await proposeInRun(store, RUN_A, {
        node_type: ORGANIZATION_TYPE_NAME,
        name: CNPQ_NAME,
        aliases: [variant.alias],
      });

      const recorded = heldBy(store, result.node_id).some(
        (a) => a.kind === "alias" && dbNorm(a.alias) === dbNorm(variant.alias)
      );
      expect(recorded).toBe(true);
    }
  );
});

describe("alias admission — alias the source holds in another spelling or position, as answered", () => {
  it.each(SOURCE_VARIANTS)(
    "does not name the alias as not admitted when the source holds it with $label",
    async (variant) => {
      const store = freshStore();
      seedExtractionRun(store, RUN_A, variant.source);

      const result = await proposeInRun(store, RUN_A, {
        node_type: ORGANIZATION_TYPE_NAME,
        name: CNPQ_NAME,
        aliases: [variant.alias],
      });

      expect(JSON.stringify(result)).not.toContain(NOT_ADMITTED_REASON);
    }
  );
});

describe("alias admission — directed ingestion", () => {
  const directedInput: ProposeNodeInput = {
    node_type: ORGANIZATION_TYPE_NAME,
    name: "Empresa estatal de petróleo",
    aliases: ["Petrobras"],
  };

  it("records an alias that the source never writes on the node", async () => {
    const store = freshStore();
    seedDirectedRun(store, RUN_A, "relatório trimestral sem menção à empresa");

    const result = await proposeInRun(store, RUN_A, directedInput);

    expect(heldBy(store, result.node_id)).toContainEqual({
      alias: "Petrobras",
      kind: "alias",
    });
  });

  it("does not name an alias that the source never writes as not admitted", async () => {
    const store = freshStore();
    seedDirectedRun(store, RUN_A, "relatório trimestral sem menção à empresa");

    const result = await proposeInRun(store, RUN_A, directedInput);

    expect(JSON.stringify(result)).not.toContain(NOT_ADMITTED_REASON);
  });
});

describe("alias admission — proposal resolved to an existing node", () => {
  it("adds the admitted alias to the matched node", async () => {
    const store = freshStore();
    seedActiveNode(store, CNPQ_NAME);
    seedExtractionRun(store, RUN_A, CNPQ_SOURCE);

    await proposeInRun(store, RUN_A, {
      node_type: ORGANIZATION_TYPE_NAME,
      name: CNPQ_NAME_UPPERCASE,
      aliases: ["CNPq"],
    });

    expect(heldBy(store, EXISTING_NODE_ID)).toContainEqual({
      alias: "CNPq",
      kind: "alias",
    });
  });
});

describe("alias admission — proposal resolved to an existing node, name", () => {
  it("does not add the proposed name to the matched node", async () => {
    const store = freshStore();
    seedActiveNode(store, CNPQ_NAME);
    seedExtractionRun(store, RUN_A, CNPQ_SOURCE);

    await proposeInRun(store, RUN_A, {
      node_type: ORGANIZATION_TYPE_NAME,
      name: CNPQ_NAME_UPPERCASE,
      aliases: ["CNPq"],
    });

    const holdingTheName = store.aliases.filter(
      (a) => a.node_id === EXISTING_NODE_ID && a.alias_norm === dbNorm(CNPQ_NAME)
    );
    expect(holdingTheName).toHaveLength(1);
  });
});

describe("alias admission — proposal resolved to an existing node, alias absent from the source", () => {
  it("does not add to the matched node an alias the source never writes", async () => {
    const store = freshStore();
    seedActiveNode(store, CNPQ_NAME);
    seedExtractionRun(store, RUN_A, CNPQ_SOURCE);

    await proposeInRun(store, RUN_A, {
      node_type: ORGANIZATION_TYPE_NAME,
      name: CNPQ_NAME_UPPERCASE,
      aliases: ["Petrobras"],
    });

    const heldAliases = heldBy(store, EXISTING_NODE_ID).map((a) => a.alias);
    expect(heldAliases).not.toContain("Petrobras");
  });
});

describe("alias admission — admitted acronym resolves a later proposal", () => {
  it("resolves a later proposal named CNPq of the same node type to that node as matched_existing", async () => {
    const store = freshStore();
    seedExtractionRun(store, RUN_A, CNPQ_SOURCE);
    seedExtractionRun(store, RUN_B, "outro documento sem relação com o anterior");
    const first = await proposeInRun(store, RUN_A, {
      node_type: ORGANIZATION_TYPE_NAME,
      name: CNPQ_NAME,
      aliases: ["CNPq"],
    });

    const later = await proposeInRun(store, RUN_B, {
      node_type: ORGANIZATION_TYPE_NAME,
      name: "CNPq",
    });

    expect({ node_id: later.node_id, resolution: later.resolution }).toEqual({
      node_id: first.node_id,
      resolution: "matched_existing",
    });
  });
});
