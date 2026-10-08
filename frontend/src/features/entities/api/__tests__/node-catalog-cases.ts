import type { UseQueryResult } from "@tanstack/react-query";
import { useAttributeKeys } from "../catalog.hooks";
import { useNodeRead } from "../node.hooks";

export interface ReadCase {
  readonly name: string;
  readonly path: string;
  readonly useRead: () => UseQueryResult<unknown>;
  readonly wire: unknown;
}

const EMPTY_NODE_WIRE = {
  node: {
    id: "n-1",
    node_type: "Project",
    canonical_name: "Projeto Apollo",
    status: "active",
  },
  aliases: [],
  attributes: [],
};

const EMPTY_KEYS_WIRE = { total: 0, items: [] };

export const READS: ReadCase[] = [
  {
    name: "the node read",
    path: "/api/v1/nodes/n-1",
    useRead: () => useNodeRead("n-1"),
    wire: EMPTY_NODE_WIRE,
  },
  {
    name: "the attribute-key read",
    path: "/api/v1/attribute-keys?node_type=Project",
    useRead: () => useAttributeKeys("Project"),
    wire: EMPTY_KEYS_WIRE,
  },
];
