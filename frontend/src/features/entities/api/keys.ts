export const entityKeys = {
  all: ["entities"] as const,
  nodeTypes: () => ["entities", "node-types"] as const,
  nodeListing: (namePrefix: string, nodeType: string) =>
    ["entities", "node-listing", { namePrefix, nodeType }] as const,
  node: (nodeId: string) => ["entities", "node", nodeId] as const,
  attributeKeys: (nodeType: string) =>
    ["entities", "attribute-keys", { nodeType }] as const,
} as const;
