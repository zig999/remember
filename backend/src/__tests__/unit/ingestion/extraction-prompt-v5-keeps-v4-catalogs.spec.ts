import { expect, it } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
  type NodeTypeRow,
} from "../../../modules/ingestion/catalog/catalog.js";
import { selectPromptModule } from "../../../modules/ingestion/prompts/index.js";

const PERSON_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_ID = "00000000-0000-4000-8000-000000000002";
const EVENT_ID = "00000000-0000-4000-8000-000000000003";
const TASK_ID = "00000000-0000-4000-8000-000000000004";
const LINK_TYPE_ID = "00000000-0000-4000-8000-000000000010";
const DATE_KEY_ID = "00000000-0000-4000-8000-000000000020";
const NUMBER_KEY_ID = "00000000-0000-4000-8000-000000000021";
const BOOL_KEY_ID = "00000000-0000-4000-8000-000000000022";
const OPEN_TEXT_KEY_ID = "00000000-0000-4000-8000-000000000023";

const DESCRIBED_NODE_TYPES: NodeTypeRow[] = [
  { id: PERSON_ID, name: "Person", description: "a person" },
  { id: PROJECT_ID, name: "Project", description: "a project" },
];

const NON_TEMPORAL_LINK_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: DESCRIBED_NODE_TYPES,
  linkTypes: [
    {
      id: LINK_TYPE_ID,
      name: "concerns",
      is_temporal: false,
      allows_multiple_current: false,
      requires_valid_from: false,
      requires_valid_to_on_change: false,
    },
  ],
  linkTypeRules: [],
  attributeKeys: [],
});

const MULTIPLE_CURRENT_LINK_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: DESCRIBED_NODE_TYPES,
  linkTypes: [
    {
      id: LINK_TYPE_ID,
      name: "participates_in",
      is_temporal: true,
      allows_multiple_current: true,
      requires_valid_from: true,
      requires_valid_to_on_change: true,
    },
  ],
  linkTypeRules: [],
  attributeKeys: [],
});

const NO_REQUIRED_DATES_LINK_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: DESCRIBED_NODE_TYPES,
  linkTypes: [
    {
      id: LINK_TYPE_ID,
      name: "delivered_to",
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: false,
      requires_valid_to_on_change: false,
    },
  ],
  linkTypeRules: [],
  attributeKeys: [],
});

const OTHER_VALUE_TYPES_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: [
    { id: EVENT_ID, name: "Event", description: "an event" },
    { id: PROJECT_ID, name: "Project", description: "a project" },
    { id: PERSON_ID, name: "Person", description: "a person" },
  ],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [
    {
      id: DATE_KEY_ID,
      node_type_id: EVENT_ID,
      key: "event_date",
      value_type: "date",
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: true,
    },
    {
      id: NUMBER_KEY_ID,
      node_type_id: PROJECT_ID,
      key: "budget",
      value_type: "number",
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: true,
    },
    {
      id: BOOL_KEY_ID,
      node_type_id: PERSON_ID,
      key: "is_active",
      value_type: "bool",
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: true,
    },
  ],
});

const NO_VALID_VALUES_KEY_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: DESCRIBED_NODE_TYPES,
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [
    {
      id: OPEN_TEXT_KEY_ID,
      node_type_id: PROJECT_ID,
      key: "note",
      value_type: "text",
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: true,
    },
  ],
});

const NODE_TYPE_WITHOUT_DESCRIPTION_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: [{ id: TASK_ID, name: "Task" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const EMPTY_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: [],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const CATALOGS_BY_SHAPE: Readonly<Record<string, CatalogSnapshot>> = {
  "a non-temporal link type": NON_TEMPORAL_LINK_CATALOG,
  "a link type allowing several current values": MULTIPLE_CURRENT_LINK_CATALOG,
  "a link type requiring neither valid_from nor valid_to on change":
    NO_REQUIRED_DATES_LINK_CATALOG,
  "attribute keys of the date, number and bool value types":
    OTHER_VALUE_TYPES_CATALOG,
  "an attribute key with no valid values": NO_VALID_VALUES_KEY_CATALOG,
  "a node type without a description": NODE_TYPE_WITHOUT_DESCRIPTION_CATALOG,
  "an empty catalog": EMPTY_CATALOG,
};

const V4_PROMPT_WITHOUT_LINES = "(the v4 system prompt held no instruction line)";

function instructionLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function v4LinesMissingFromV5(catalog: CatalogSnapshot): string[] {
  const v4Lines = instructionLines(selectPromptModule("v4").system(catalog));
  const v5Lines = new Set(instructionLines(selectPromptModule("v5").system(catalog)));
  if (v4Lines.length === 0) return [V4_PROMPT_WITHOUT_LINES];
  return v4Lines.filter((line) => !v5Lines.has(line));
}

it("keeps every instruction line of the v4 system prompt as a whole, unaltered line of the v5 system prompt, over a catalog of each shape the rich-catalog comparison leaves out", () => {
  const entries = Object.entries(CATALOGS_BY_SHAPE);

  const missingByShape = Object.fromEntries(
    entries.map(([shape, catalog]) => [shape, v4LinesMissingFromV5(catalog)])
  );

  expect(missingByShape).toEqual(
    Object.fromEntries(entries.map(([shape]) => [shape, []]))
  );
});
