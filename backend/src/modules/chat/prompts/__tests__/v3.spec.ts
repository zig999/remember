// Unit tests for `prompts/v3.ts` and the prompts registry (chat.back.md
// v2.5 BR-18 v3 — Testing rows xix, xx, xxi, xxiii).
//
// Coverage map:
//   xix (block 4A byte-stability + completeness + sensitivity + no-hardcoded):
//     - system(sameCatalogRef) twice -> identical bytes (cache-control inv.)
//     - rendered text contains every NodeType / LinkType / AttributeKey
//       name + description from the fixture catalog
//     - adding a NodeType to the fixture changes the rendered string (hash)
//     - rendered text does NOT contain hardcoded type names from a v2 stub
//   xx (block 4B search-discipline directives present)
//   xxi (block 4C post-ingestion playbook + affected_nodes directive)
//   xxiii (registry: v1/v2/v3 resolve; unknown throws; default is v3)

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
import { system as v3System, renderOntologyBlock } from "../v3.js";
import { system as v1System } from "../v1.js";
import { system as v2System } from "../v2.js";

// ---------------------------------------------------------------------------
// Fixtures
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
// (xix) Block 4A — byte-stability + completeness + sensitivity + no-hardcoded
// ---------------------------------------------------------------------------

describe("v3.system(catalog) — block 4A ONTOLOGY (BR-18 v3, Testing xix)", () => {
  it("is byte-stable across calls with the SAME catalog reference (cache-control invariant)", () => {
    // The Anthropic `cache_control` prefix hashes the EXACT system text — any
    // non-determinism (Date.now interpolation, random ids, unstable iteration
    // order) silently invalidates the cache. Same catalog ref MUST yield
    // byte-identical bytes (chat.back.md v2.5 §12).
    const catalog = buildFixtureCatalog();
    const a = v3System(catalog);
    const b = v3System(catalog);
    expect(b).toBe(a);
    expect(sha256(b)).toBe(sha256(a));
  });

  it("rendered text contains canonical name AND description for every NodeType in the catalog", () => {
    const catalog = buildFixtureCatalog();
    const out = v3System(catalog);
    for (const nt of [NT_PERSON, NT_PROJECT, NT_TASK]) {
      expect(out).toContain(nt.name);
      expect(out).toContain(nt.description);
    }
  });

  it("rendered text contains canonical name AND description for every LinkType in the catalog", () => {
    const catalog = buildFixtureCatalog();
    const out = v3System(catalog);
    for (const lt of [LT_OWNS, LT_PART_OF]) {
      expect(out).toContain(lt.name);
      expect(out).toContain(lt.description);
    }
  });

  it("rendered text contains LinkType rule pairs (source -> target) for each LinkType", () => {
    const catalog = buildFixtureCatalog();
    const out = v3System(catalog);
    // The renderer encodes each LinkTypeRule as `<source> -> <target>` next
    // to the LinkType. Spec §1.1: "the pair of NodeTypes it links — derived
    // from LinkTypeRule entries."
    expect(out).toContain("Person -> Project");
    expect(out).toContain("Person -> Task");
    expect(out).toContain("Task -> Project");
  });

  it("rendered text contains canonical name + value_type + description for every AttributeKey", () => {
    const catalog = buildFixtureCatalog();
    const out = v3System(catalog);
    // status (text) on Project, priority (number) on Task
    expect(out).toContain("Project.status");
    expect(out).toContain("(text)");
    expect(out).toContain(AK_PROJECT_STATUS.description);
    expect(out).toContain("Task.priority");
    expect(out).toContain("(number)");
    expect(out).toContain(AK_TASK_PRIORITY.description);
  });

  it("adding a NodeType to the catalog changes the rendered string AND its hash (sensitivity)", () => {
    const base = v3System(buildFixtureCatalog());
    const extended = v3System(
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

  it("renderOntologyBlock alone (the deterministic core) is also byte-stable", () => {
    const catalog = buildFixtureCatalog();
    expect(renderOntologyBlock(catalog)).toBe(renderOntologyBlock(catalog));
  });

  it("rendered text contains NO hardcoded NodeType names from the v2 prompt fixture (no leftover stub list)", () => {
    // BR-18 v3 / §1.1 implementation note: "the renderer does NOT hardcode any
    // type name". If a future regression accidentally inlines a fixture list
    // (e.g. "Person, Project, Task") the test catches it: this fixture catalog
    // contains those three names, but a catalog with totally different names
    // MUST yield a prompt that does NOT mention them.
    const otherCatalog: CatalogSnapshot = buildSnapshot({
      nodeTypes: [
        {
          id: "nt-x",
          name: "Asteroid",
          description: "Out-of-vocabulary placeholder.",
          version: 1,
        },
      ],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    });
    const out = v3System(otherCatalog);
    expect(out).not.toContain("Person");
    expect(out).not.toContain("Project");
    expect(out).not.toContain("Task");
    expect(out).toContain("Asteroid");
  });
});

// ---------------------------------------------------------------------------
// (xix, BR-30) Block 4A — closed value domains rendered inline
//
// Intent: the model must SEE the allowed values of a closed-domain attribute in
// the system prompt so it uses one verbatim instead of guessing a foreign
// convention (the `Task.status = "in_progress"` failure). This is the root fix
// for that failure mode — anchored on rendering, not on post-hoc rejection.
// ---------------------------------------------------------------------------

describe("renderOntologyBlock — closed value domains (BR-30)", () => {
  // Project.status closed to a pt-BR lifecycle vocabulary; Task.priority open.
  const CLOSED_DOMAIN_VALUES: AttributeValidValueRow[] = [
    { attribute_key_id: "ak-project-status", value: "em andamento" },
    { attribute_key_id: "ak-project-status", value: "concluida" },
    { attribute_key_id: "ak-project-status", value: "a fazer" },
  ];

  function buildClosedDomainCatalog(
    extraValues: readonly AttributeValidValueRow[] = []
  ): CatalogSnapshot {
    return buildSnapshot({
      nodeTypes: [NT_PERSON, NT_PROJECT, NT_TASK],
      linkTypes: [LT_OWNS, LT_PART_OF],
      linkTypeRules: [
        RULE_PERSON_OWNS_PROJECT,
        RULE_PERSON_OWNS_TASK,
        RULE_TASK_PART_OF_PROJECT,
      ],
      attributeKeys: [AK_PROJECT_STATUS, AK_TASK_PRIORITY],
      attributeValidValues: [...CLOSED_DOMAIN_VALUES, ...extraValues],
    });
  }

  it("buildSnapshot indexes closed values by key id; open keys stay absent", () => {
    const c = buildClosedDomainCatalog();
    expect(c.attributeValidValuesByKeyId.get("ak-project-status")).toEqual(
      new Set(["em andamento", "concluida", "a fazer"])
    );
    // Task.priority has no attribute_valid_value rows -> OPEN domain (absent).
    expect(
      c.attributeValidValuesByKeyId.get("ak-task-priority")
    ).toBeUndefined();
  });

  it("renders the closed domain inline with SORTED values (model uses one verbatim, never guesses)", () => {
    const out = renderOntologyBlock(buildClosedDomainCatalog());
    // Sorted ascending, ` | `-joined, appended to the owning AttributeKey line.
    expect(out).toContain(
      "Project.status (text): Lifecycle status (proposed / active / done). " +
        "[dominio fechado: a fazer | concluida | em andamento]"
    );
  });

  it("does NOT annotate an OPEN-domain attribute (no noise on Task.priority)", () => {
    const out = renderOntologyBlock(buildClosedDomainCatalog());
    expect(out).toContain(
      "Task.priority (number): Numeric priority (lower is more urgent)."
    );
    expect(out).not.toMatch(/Task\.priority[^\n]*dominio fechado/);
  });

  it("is byte-stable across calls when a closed domain is present (cache-control invariant)", () => {
    const c = buildClosedDomainCatalog();
    expect(v3System(c)).toBe(v3System(c));
    expect(sha256(v3System(c))).toBe(sha256(v3System(c)));
  });

  it("changing a closed-domain value changes the rendered string AND hash (sensitivity)", () => {
    const base = renderOntologyBlock(buildClosedDomainCatalog());
    const changed = renderOntologyBlock(
      buildClosedDomainCatalog([
        { attribute_key_id: "ak-project-status", value: "bloqueada" },
      ])
    );
    expect(changed).not.toBe(base);
    expect(sha256(changed)).not.toBe(sha256(base));
    // New value lands in sorted position: a fazer | bloqueada | concluida | ...
    expect(changed).toContain(
      "[dominio fechado: a fazer | bloqueada | concluida | em andamento]"
    );
  });
});

// ---------------------------------------------------------------------------
// (xx) Block 4B — SEARCH DISCIPLINE directives (regex-matched, pt-BR)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Block 4A — defensive branches (arch/QA Low): catalog rows that reference an
// unresolvable node_type_id must NOT crash the renderer (the IDs are
// unreachable in practice thanks to DB FK constraints, but the renderer guards
// them defensively — these tests lock that guard).
// ---------------------------------------------------------------------------

describe("renderOntologyBlock — defensive: unresolvable ids (Low edge)", () => {
  it("skips a LinkTypeRule whose source/target node_type_id is unresolvable (no throw, pair omitted)", () => {
    const catalog = buildSnapshot({
      nodeTypes: [NT_PERSON, NT_PROJECT],
      linkTypes: [LT_OWNS],
      linkTypeRules: [
        RULE_PERSON_OWNS_PROJECT,
        // Dangling target — must be skipped, not rendered, not thrown.
        {
          id: "rule-dangling",
          link_type_id: "lt-owns",
          source_node_type_id: "nt-person",
          target_node_type_id: "nt-DOES-NOT-EXIST",
          valid_from: null,
          valid_to: null,
        },
      ],
      attributeKeys: [],
    });
    const out = renderOntologyBlock(catalog);
    // The valid pair renders; the dangling rule contributes nothing.
    expect(out).toContain("Person -> Project");
    expect(out).not.toContain("nt-DOES-NOT-EXIST");
    // The LinkType line itself still renders (with only its resolvable pair).
    expect(out).toContain("- owns:");
  });

  it("renders '?' as the owner of an AttributeKey whose node_type_id is unresolvable (no throw)", () => {
    const catalog = buildSnapshot({
      nodeTypes: [NT_PROJECT],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [
        {
          ...AK_PROJECT_STATUS,
          id: "ak-orphan",
          node_type_id: "nt-DOES-NOT-EXIST",
          key: "orphan_attr",
        },
      ],
    });
    const out = renderOntologyBlock(catalog);
    expect(out).toContain("?.orphan_attr");
    expect(out).not.toContain("nt-DOES-NOT-EXIST");
  });
});

describe("v3.system(catalog) — block 4B SEARCH DISCIPLINE (BR-18 v3, Testing xx)", () => {
  it("contains the directive that `search` is lexical AND", () => {
    const out = v3System(buildFixtureCatalog());
    // "LEXICA E TEM SEMANTICA `AND`" — matches the static prose.
    expect(out).toMatch(/LEXICA\s+E\s+TEM\s+SEMANTICA\s+`AND`/i);
  });

  it("contains the directive that `search` takes ONE specific name per call (never concatenate)", () => {
    const out = v3System(buildFixtureCatalog());
    expect(out).toMatch(/UM\s+NOME\s+ESPECIFICO\s+POR\s+CHAMADA/i);
    expect(out).toMatch(/NUNCA\s+concatene\s+varios\s+nomes/i);
  });

  it("contains the directive that `list_nodes` MUST take `node_type` for category enumeration", () => {
    const out = v3System(buildFixtureCatalog());
    expect(out).toMatch(/`list_nodes`\s+DEVE\s+ser\s+chamada\s+COM\s+um\s+filtro\s+`node_type`/i);
    expect(out).toMatch(/NUNCA\s+use[\s\S]{0,40}`list_nodes`\s+SEM\s+`node_type`/i);
  });

  it("contains the discovery-primitives directive (list_node_types / list_link_types / list_attribute_keys)", () => {
    const out = v3System(buildFixtureCatalog());
    expect(out).toContain("list_node_types");
    expect(out).toContain("list_link_types");
    expect(out).toContain("list_attribute_keys");
    expect(out).toMatch(/primitivas\s+de\s+descoberta/i);
  });
});

// ---------------------------------------------------------------------------
// (xxi) Block 4C — POST-INGESTION PLAYBOOK (affected_nodes directive)
// ---------------------------------------------------------------------------

describe("v3.system(catalog) — block 4C POST-INGESTION PLAYBOOK (BR-18 v3, Testing xxi)", () => {
  it("contains the directive to read `result.affected_nodes` after `get_ingestion_status` returns `completed`", () => {
    const out = v3System(buildFixtureCatalog());
    // The directive MUST tie `affected_nodes` to the `completed` status and
    // position it as the FIRST lookup path (per the task spec constraint).
    expect(out).toContain("affected_nodes");
    expect(out).toMatch(/get_ingestion_status[\s\S]{0,300}completed/i);
    expect(out).toMatch(/PRIMEIRA\s+via\s+de\s+consulta/i);
  });

  it("contains the directive to use `get_node(id)` / `traverse` directly when `affected_nodes` is present", () => {
    const out = v3System(buildFixtureCatalog());
    expect(out).toMatch(/get_node\(id\)/);
    expect(out).toMatch(/traverse\(start_node_id=id/);
  });

  it("contains the fallback directive (one-name-per-search OR list_nodes with node_type) when affected_nodes is absent/empty", () => {
    const out = v3System(buildFixtureCatalog());
    expect(out).toMatch(/ausente\s+ou\s+vazio/i);
    expect(out).toMatch(/list_nodes\(node_type=/);
    expect(out).toMatch(/NUNCA\s+uma\s+busca\s+multi-nome\s+concatenada/i);
  });

  it("contains the forbid-unfiltered-list_nodes-as-what-was-ingested directive", () => {
    const out = v3System(buildFixtureCatalog());
    // "NUNCA apresente a primeira linha de um `list_nodes` sem filtro como
    //  resposta para "o que foi ingerido"".
    expect(out).toMatch(/NUNCA\s+apresente\s+a\s+primeira\s+linha\s+de\s+um\s+`list_nodes`\s+sem\s+filtro/i);
  });
});

// ---------------------------------------------------------------------------
// (xxiii) Prompt-version registry
// ---------------------------------------------------------------------------

describe("prompts/index.ts registry (BR-18 v3, Testing xxiii)", () => {
  it("selectChatPromptModule('v3') returns the v3 module", () => {
    const mod = selectChatPromptModule("v3");
    expect(mod.version).toBe("v3");
    // Identity: the module's `system` is v3's system (rendering an ontology
    // block onto the v2 body).
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

  it("DEFAULT_CHAT_PROMPT_VERSION is 'v4' (env default mirror — bumped from v3 in v2.8)", () => {
    // chat.back.md v2.8 BR-18 v4 bumps the default from `v3` to `v4`. v3
    // continues to resolve through the registry (asserted above) so this is
    // a registry-default change, not a v3 retirement.
    expect(DEFAULT_CHAT_PROMPT_VERSION).toBe("v4");
  });

  it("selectChatPromptModule throws UnknownChatPromptVersionError for unregistered versions", () => {
    expect(() => selectChatPromptModule("v999")).toThrow(
      UnknownChatPromptVersionError
    );
  });
});

// ---------------------------------------------------------------------------
// Backward-compat — v1 and v2 ignore the catalog argument
// ---------------------------------------------------------------------------

describe("v1 / v2 backward-compat (BR-18 v3 — system(catalog) ignored)", () => {
  it("v1.system output is identical regardless of the catalog passed in", () => {
    const a = v1System(buildFixtureCatalog());
    const b = v1System(
      buildSnapshot({
        nodeTypes: [
          { id: "x", name: "X", description: "y", version: 1 } as NodeTypeRow,
        ],
        linkTypes: [],
        linkTypeRules: [],
        attributeKeys: [],
      })
    );
    expect(b).toBe(a);
  });

  it("v2.system output is identical regardless of the catalog passed in", () => {
    const a = v2System(buildFixtureCatalog());
    const b = v2System(
      buildSnapshot({
        nodeTypes: [
          { id: "x", name: "X", description: "y", version: 1 } as NodeTypeRow,
        ],
        linkTypes: [],
        linkTypeRules: [],
        attributeKeys: [],
      })
    );
    expect(b).toBe(a);
  });
});
