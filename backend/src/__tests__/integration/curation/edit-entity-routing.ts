import type { Pool } from "pg";

import type { EditEntityBody } from "../../../modules/curation/dto/edit-entity.dto.js";
import type {
  EditEntityResult,
  EditEntityServiceDeps,
} from "../../../modules/curation/service/edit-entity.service.js";

const NEVER_CONNECTED_MESSAGE = "the served pool is only a handle and is never connected";

export type ForwardedEdit = (
  nodeId: string,
  body: EditEntityBody
) => Promise<EditEntityResult>;

export interface ServiceModule {
  readonly editEntityService: (
    deps: EditEntityServiceDeps,
    nodeId: string,
    body: EditEntityBody
  ) => Promise<EditEntityResult>;
}

interface Routing {
  readonly pool: Pool;
  forward: ForwardedEdit | undefined;
}

function servedPoolHandle(): Pool {
  return {
    connect: async () => {
      throw new Error(NEVER_CONNECTED_MESSAGE);
    },
    on: () => undefined,
    end: async () => undefined,
  } as unknown as Pool;
}

export const routing: Routing = { pool: servedPoolHandle(), forward: undefined };

export function forwardingModule<M extends ServiceModule>(actual: M): M {
  const editEntityService: ServiceModule["editEntityService"] = (
    deps,
    nodeId,
    body
  ) => {
    const { forward } = routing;
    if (deps.pool === routing.pool && forward !== undefined) {
      return forward(nodeId, body);
    }
    return actual.editEntityService(deps, nodeId, body);
  };
  return { ...actual, editEntityService };
}
