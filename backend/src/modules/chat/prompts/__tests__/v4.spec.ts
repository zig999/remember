// Unit tests for `prompts/v4.ts` and the prompts registry (chat.back.md
// v2.8 BR-18 v4 — Testing rows xix, xx, xxi v2.8, xxii v2.8).
//
// Coverage map:
//   xix (block 4A byte-stability + completeness + sensitivity — PRESERVED
//        verbatim from v3 in v4):
//     - system(sameCatalogRef) twice -> identical bytes (cache-control inv.)
//     - rendered text contains every NodeType / LinkType / AttributeKey
//       name + description from the fixture catalog
//     - adding a NodeType to the fixture changes the rendered string (hash)
//   xx (block 4B search-discipline directives present — PRESERVED verbatim)
//   xxi v2.8 (block 4C v2.8 directed-ingestion playbook):
//     - `ingest_directed` is the SINGLE write entry; signal phrases
//     - payload `ref` strings + `node_id` pin directive
//     - ASK-the-Owner-for-missing-`valid_from` directive (no silent
//       `received` fallback)
//     - REPORT-inline per-item result directive (accepted/consolidated/
//       needs_review/rejected/dependency_failed)
//     - NO auto-loop directive
//     - v3 post-ingestion playbook (`affected_nodes` -> `get_node`/
//       `traverse`; fallback) PRESERVED for prior ingestions
//     - block 4C does NOT reference `start_async_ingestion` /
//       `get_ingestion_status`
//   xxii v2.8 (registry: v1/v2/v3/v4 resolve; unknown throws; default is v4)

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  type AttributeKeyRow,
  type AttributeValidValueRow,
  type CatalogSnapshot,
  type LinkTypeRow,
  type LinkTypeRuleRow,
  type NodeTypeRow,
} from "../../../knowledge-graph/catalog/catalog.js";
import {
  DEFAULT_CHAT_PROMPT_VERSION,
  selectChatPromptModule,
  UnknownChatPromptVersionError,
} from "../index.js";
import { system as v4System } from "../v4.js";
import { system as v3System } from "../v3.js";
import { system as v2System } from "../v2.js";
import { system as v1System } from "../v1.js";

// ---------------------------------------------------------------------------
// Fixtures (parallel to v3.spec.ts — same catalog so coverage is comparable)
// ---------------------------------------------------------------------------

const NT_PERSON: NodeTypeRow = {
  id: "nt-person",
  name: "Person",
  description: "A natural person mentioned in the corpus.",
  version: 1,
};
const NT_PROJECT: NodeTypeRow = {
  id: "nt-project",
  name: "Project",
  description: "A delivery effort with a sponsor and a goal.",
  version: 1,
};
const NT_TASK: NodeTypeRow = {
  id: "nt-task",
  name: "Task",
  description: "A discrete unit of work owned by a Person.",
  version: 1,
};

const LT_OWNS: LinkTypeRow = {
  id: "lt-owns",
  name: "owns",
  label: "owns",
  description: "Ownership relation between Person and Project/Task.",
  inverse_name: "owned_by",
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: true,
  requires_valid_to_on_change: true,
  version: 1,
};
const LT_PART_OF: LinkTypeRow = {
  id: "lt-part-of",
  name: "part_of",
  label: "part of",
  description: "Structural containment.",
  inverse_name: "contains",
  is_temporal: false,
  allows_multiple_current: false,
  requires_valid_from: false,
  requires_valid_to_on_change: false,
  version: 1,
};

const RULE_PERSON_OWNS_PROJECT: LinkTypeRuleRow = {
  id: "rule-person-owns-project",
  link_type_id: "lt-owns",
  source_node_type_id: "nt-person",
  target_node_type_id: "nt-project",
  valid_from: null,
  valid_to: null,
};
const RULE_PERSON_OWNS_TASK: LinkTypeRuleRow = {
  id: "rule-person-owns-task",
  link_type_id: "lt-owns",
  source_node_type_id: "nt-person",
  target_node_type_id: "nt-task",
  valid_from: null,
  valid_to: null,
};
const RULE_TASK_PART_OF_PROJECT: LinkTypeRuleRow = {
  id: "rule-task-part-of-project",
  link_type_id: "lt-part-of",
  source_node_type_id: "nt-task",
  target_node_type_id: "nt-project",
  valid_from: null,
  valid_to: null,
};

const AK_PROJECT_STATUS: AttributeKeyRow = {
  id: "ak-project-status",
  node_type_id: "nt-project",
  key: "status",
  value_type: "text",
  is_temporal: true,
  allows_multiple_current: false,
  requires_valid_from: false,
  description: "Lifecycle status (proposed / active / done).",
  version: 1,
};
const AK_TASK_PRIORITY: AttributeKeyRow = {
  id: "ak-task-priority",
  node_type_id: "nt-task",
  key: "priority",
  value_type: "number",
  is_temporal: false,
  allows_multiple_current: false,
  requires_valid_from: false,
  description: "Numeric priority (lower is more urgent).",
  version: 1,
};

function buildFixtureCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [NT_PERSON, NT_PROJECT, NT_TASK],
    linkTypes: [LT_OWNS, LT_PART_OF],
    linkTypeRules: [
      RULE_PERSON_OWNS_PROJECT,
      RULE_PERSON_OWNS_TASK,
      RULE_TASK_PART_OF_PROJECT,
    ],
    attributeKeys: [AK_PROJECT_STATUS, AK_TASK_PRIORITY],
  });
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// ---------------------------------------------------------------------------
// (xix) Block 4A — preserved verbatim from v3 (byte-stability + completeness)
// ---------------------------------------------------------------------------

describe("v4.system(catalog) — block 4A ONTOLOGY (BR-18 v4 inherits v3, Testing xix)", () => {
  it("is byte-stable across calls with the SAME catalog reference (cache-control invariant)", () => {
    const catalog = buildFixtureCatalog();
    const a = v4System(catalog);
    const b = v4System(catalog);
    expect(b).toBe(a);
    expect(sha256(b)).toBe(sha256(a));
  });

  it("rendered text contains canonical name AND description for every NodeType in the catalog", () => {
    const out = v4System(buildFixtureCatalog());
    for (const nt of [NT_PERSON, NT_PROJECT, NT_TASK]) {
      expect(out).toContain(nt.name);
      expect(out).toContain(nt.description);
    }
  });

  it("rendered text contains canonical name AND description for every LinkType + its rule pairs", () => {
    const out = v4System(buildFixtureCatalog());
    for (const lt of [LT_OWNS, LT_PART_OF]) {
      expect(out).toContain(lt.name);
      expect(out).toContain(lt.description);
    }
    expect(out).toContain("Person -> Project");
    expect(out).toContain("Person -> Task");
    expect(out).toContain("Task -> Project");
  });

  it("rendered text contains canonical name + value_type + description for every AttributeKey", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toContain("Project.status");
    expect(out).toContain("(text)");
    expect(out).toContain(AK_PROJECT_STATUS.description);
    expect(out).toContain("Task.priority");
    expect(out).toContain("(number)");
    expect(out).toContain(AK_TASK_PRIORITY.description);
  });

  it("adding a NodeType to the catalog changes the rendered string AND its hash (sensitivity)", () => {
    const base = v4System(buildFixtureCatalog());
    const extended = v4System(
      buildSnapshot({
        nodeTypes: [
          NT_PERSON,
          NT_PROJECT,
          NT_TASK,
          {
            id: "nt-event",
            name: "Event",
            description: "A dated occurrence in the corpus.",
            version: 1,
          },
        ],
        linkTypes: [LT_OWNS, LT_PART_OF],
        linkTypeRules: [
          RULE_PERSON_OWNS_PROJECT,
          RULE_PERSON_OWNS_TASK,
          RULE_TASK_PART_OF_PROJECT,
        ],
        attributeKeys: [AK_PROJECT_STATUS, AK_TASK_PRIORITY],
      })
    );
    expect(extended).not.toBe(base);
    expect(sha256(extended)).not.toBe(sha256(base));
    expect(extended).toContain("Event");
    expect(extended).toContain("A dated occurrence in the corpus.");
  });
});

// ---------------------------------------------------------------------------
// (xix, BR-30) Block 4A — closed value domains flow through v4's renderer
// (xxi, BR-30) Block 4C — attribute write-discipline (root fix for the two
// observed failures: inventing an unrequested `status`, and guessing a foreign
// closed-domain value)
// ---------------------------------------------------------------------------

describe("v4.system(catalog) — closed value domains + attribute discipline (BR-30)", () => {
  it("block 4A renders closed domains inline (delegates to v3's renderOntologyBlock)", () => {
    const closedValues: AttributeValidValueRow[] = [
      { attribute_key_id: "ak-project-status", value: "em andamento" },
      { attribute_key_id: "ak-project-status", value: "a fazer" },
    ];
    const out = v4System(
      buildSnapshot({
        nodeTypes: [NT_PERSON, NT_PROJECT, NT_TASK],
        linkTypes: [LT_OWNS, LT_PART_OF],
        linkTypeRules: [
          RULE_PERSON_OWNS_PROJECT,
          RULE_PERSON_OWNS_TASK,
          RULE_TASK_PART_OF_PROJECT,
        ],
        attributeKeys: [AK_PROJECT_STATUS, AK_TASK_PRIORITY],
        attributeValidValues: closedValues,
      })
    );
    expect(out).toContain("[dominio fechado: a fazer | em andamento]");
  });

  it("block 4C tells the model to record ONLY owner-stated attributes (not infer status/state)", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/Grave\s+APENAS\s+atributos\s+que\s+o\s+dono\s+declarou/i);
    expect(out).toMatch(/NAO\s+infira[\s\S]{0,60}status/i);
    expect(out).toMatch(/PERGUNTE\s+antes\s+de\s+gravar/i);
  });

  it("block 4C tells the model to use closed-domain values verbatim, never translate/invent", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/DOMINIO\s+FECHADO/i);
    expect(out).toMatch(/EXATAMENTE\s+um\s+dos\s+valores\s+listados/i);
    expect(out).toMatch(/NUNCA\s+traduza/i);
    // The concrete failure example is spelled out so the guidance is unmissable.
    expect(out).toContain("in_progress");
    expect(out).toContain("em andamento");
  });
});

// ---------------------------------------------------------------------------
// (xx) Block 4B — search-discipline directives preserved verbatim from v3
// ---------------------------------------------------------------------------

describe("v4.system(catalog) — block 4B SEARCH DISCIPLINE (BR-18 v4 inherits v3, Testing xx)", () => {
  it("contains the directive that `search` is lexical AND", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/LEXICA\s+E\s+TEM\s+SEMANTICA\s+`AND`/i);
  });

  it("contains the directive that `search` takes ONE specific name per call (never concatenate)", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/UM\s+NOME\s+ESPECIFICO\s+POR\s+CHAMADA/i);
    expect(out).toMatch(/NUNCA\s+concatene\s+varios\s+nomes/i);
  });

  it("contains the directive that `list_nodes` MUST take `node_type` for category enumeration", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/`list_nodes`\s+DEVE\s+ser\s+chamada\s+COM\s+um\s+filtro\s+`node_type`/i);
    expect(out).toMatch(/NUNCA\s+use[\s\S]{0,40}`list_nodes`\s+SEM\s+`node_type`/i);
  });

  it("contains the discovery-primitives directive (list_node_types / list_link_types / list_attribute_keys)", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toContain("list_node_types");
    expect(out).toContain("list_link_types");
    expect(out).toContain("list_attribute_keys");
    expect(out).toMatch(/primitivas\s+de\s+descoberta/i);
  });
});

// ---------------------------------------------------------------------------
// (xxi v2.8) Block 4C — DIRECTED INGESTION PLAYBOOK
// ---------------------------------------------------------------------------

describe("v4.system(catalog) — block 4C DIRECTED INGESTION (BR-18 v4, Testing xxi v2.8)", () => {
  it("declares `ingest_directed` as the SINGLE write-bearing chat tool", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toContain("ingest_directed");
    expect(out).toMatch(/UNICA\s+ferramenta\s+de\s+escrita/i);
  });

  it("gates `ingest_directed` on EXPLICIT Owner request via the canonical signal phrases", () => {
    const out = v4System(buildFixtureCatalog());
    // The directive must enumerate at least the four canonical signals — they
    // are listed in the task spec as the exact gating vocabulary.
    expect(out).toContain("crie");
    expect(out).toContain("registre");
    expect(out).toContain("linke");
    expect(out).toMatch(/ingerir\s+esta\s+informacao/i);
  });

  it("contains the payload-skeleton directive (fragments / nodes / attributes / links + ref locality)", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toContain("fragments[]");
    expect(out).toContain("nodes[]");
    expect(out).toContain("attributes[]");
    expect(out).toContain("links[]");
    // `ref` locality — the directive must state these are local to the call.
    expect(out).toMatch(/IDENTIFICADORES\s+LOCAIS\s+DA\s+CHAMADA/i);
  });

  it("contains the optional `node_id` PIN directive for re-affirming a known entity", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toContain("node_id");
    expect(out).toMatch(/PIN/);
    expect(out).toMatch(/bypassa\s+a\s+resolucao\s+fuzzy/i);
  });

  it("contains the ASK-the-Owner-for-missing-date directive (no silent `received` fallback)", () => {
    const out = v4System(buildFixtureCatalog());
    // Two halves of the directive must coexist:
    //   (a) when the link/attribute is temporal AND no date was stated, ASK
    //   (b) do NOT fall back to `received` silently
    expect(out).toMatch(/perguntar\s+a\s+data\s+ao\s+dono/i);
    expect(out).toMatch(/NAO\s+chame\s+`ingest_directed`\s+sem\s+`valid_from`/i);
    expect(out).toMatch(/fallback\s+`received`/i);
  });

  it("contains the REPORT-inline-per-item-result directive (all five outcomes named)", () => {
    const out = v4System(buildFixtureCatalog());
    for (const outcome of [
      "accepted",
      "consolidated",
      "needs_review",
      "rejected",
      "dependency_failed",
    ]) {
      expect(out).toContain(outcome);
    }
    expect(out).toMatch(/RELATE\s+ao\s+dono/i);
  });

  it("contains the NO auto-loop directive (single `ingest_directed` per command)", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/UMA\s+UNICA\s+CHAMADA\s+POR\s+COMANDO/i);
    expect(out).toMatch(/NAO\s+faca\s+auto-loop/i);
  });

  it("PRESERVES the v3 post-ingestion playbook (`affected_nodes` -> `get_node` / `traverse`)", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toContain("affected_nodes");
    expect(out).toMatch(/get_node\(id\)/);
    expect(out).toMatch(/traverse\(start_node_id=id/);
    expect(out).toMatch(/PRIMEIRA\s+via\s+de\s+consulta/i);
  });

  it("PRESERVES the v3 fallback when `affected_nodes` is absent/empty", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/ausente\s+ou\s+vazio/i);
    expect(out).toMatch(/list_nodes\(node_type=/);
    expect(out).toMatch(/NUNCA\s+uma\s+busca\s+multi-nome\s+concatenada/i);
  });

  it("PRESERVES the forbid-unfiltered-list_nodes-as-what-was-ingested directive", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).toMatch(/NUNCA\s+apresente\s+a\s+primeira\s+linha\s+de\s+um\s+`list_nodes`\s+sem\s+filtro/i);
  });

  it("does NOT reference the v2/v3 async tools `start_async_ingestion` / `get_ingestion_status`", () => {
    const out = v4System(buildFixtureCatalog());
    expect(out).not.toContain("start_async_ingestion");
    expect(out).not.toContain("get_ingestion_status");
  });
});

// ---------------------------------------------------------------------------
// (xxii v2.8) Prompt-version registry
// ---------------------------------------------------------------------------

describe("prompts/index.ts registry (BR-18 v4, Testing xxii v2.8)", () => {
  it("selectChatPromptModule('v4') returns the v4 module", () => {
    const mod = selectChatPromptModule("v4");
    expect(mod.version).toBe("v4");
    const catalog = buildFixtureCatalog();
    expect(mod.system(catalog)).toBe(v4System(catalog));
  });

  it("selectChatPromptModule('v3') still resolves (no regression)", () => {
    const mod = selectChatPromptModule("v3");
    expect(mod.version).toBe("v3");
    const catalog = buildFixtureCatalog();
    expect(mod.system(catalog)).toBe(v3System(catalog));
  });

  it("selectChatPromptModule('v2') still resolves (no regression)", () => {
    const mod = selectChatPromptModule("v2");
    expect(mod.version).toBe("v2");
    const catalog = buildFixtureCatalog();
    expect(mod.system(catalog)).toBe(v2System(catalog));
  });

  it("selectChatPromptModule('v1') still resolves (no regression)", () => {
    const mod = selectChatPromptModule("v1");
    expect(mod.version).toBe("v1");
    const catalog = buildFixtureCatalog();
    expect(mod.system(catalog)).toBe(v1System(catalog));
  });

  it("DEFAULT_CHAT_PROMPT_VERSION is 'v4' (env default mirror)", () => {
    expect(DEFAULT_CHAT_PROMPT_VERSION).toBe("v4");
  });

  it("selectChatPromptModule throws UnknownChatPromptVersionError for unregistered versions", () => {
    expect(() => selectChatPromptModule("v999")).toThrow(
      UnknownChatPromptVersionError
    );
  });
});
