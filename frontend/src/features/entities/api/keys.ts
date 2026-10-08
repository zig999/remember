export const entityKeys = {
  all: ["entities"] as const,
  nodeTypes: () => ["entities", "node-types"] as const,
  nodeListing: (namePrefix: string, nodeType: string) =>
    ["entities", "node-listing", { namePrefix, nodeType }] as const,
} as const;
