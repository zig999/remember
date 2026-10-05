import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type {
  ProposeNodeInput,
  ProposeNodeResult,
} from "../dto/propose-node.dto.js";
import { assertKnownType } from "../validation/structural.js";

import { resolveOrCreateNode } from "./entity-resolution.service.js";
import type { McpEnvelope, RunContext } from "./propose.types.js";

export interface ProposeNodeDeps {
  readonly catalog: CatalogSnapshot;
}

export async function proposeNodeService(
  client: PoolClient,
  args: ProposeNodeInput,
  runCtx: RunContext,
  deps: ProposeNodeDeps
): Promise<McpEnvelope<ProposeNodeResult>> {
  const nodeType = deps.catalog.nodeTypeByName.get(args.node_type);
  assertKnownType({
    kind: "node_type",
    name: args.node_type,
    found: nodeType !== undefined,
  });
  const resolvedType = nodeType!;

  const resolved = await resolveOrCreateNode(client, {
    nodeTypeId: resolvedType.id,
    name: args.name,
    aliases: args.aliases,
    llmRunId: runCtx.llmRunId,
    catalog: deps.catalog,
  });

  const result: ProposeNodeResult = {
    node_id: resolved.node_id,
    resolution: resolved.resolution,
    aliases_not_admitted: resolved.aliases_not_admitted,
  };
  return { ok: true, result };
}
