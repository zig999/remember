import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../../ingestion/index.js";
import { EditEntityBodySchema } from "../dto/edit-entity.dto.js";
import type { EditEntityBody } from "../dto/edit-entity.dto.js";
import { NodeIdPathSchema } from "../dto/entity-match.dto.js";
import { editEntityService } from "../service/edit-entity.service.js";
import { sendError } from "./send-error.js";

const EDIT_ENTITY_PATH = "/nodes/:node_id/edit";
const ACCEPTED_STATUS = 200;

export interface EditEntityRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

interface EditEntityRequest {
  readonly nodeId: string;
  readonly body: EditEntityBody;
}

function parseEditRequest(request: FastifyRequest): EditEntityRequest {
  const params = NodeIdPathSchema.parse(request.params);
  const body = EditEntityBodySchema.parse(request.body ?? {});
  return { nodeId: params.node_id, body };
}

export async function registerEditEntityRoute(
  app: FastifyInstance,
  deps: EditEntityRouteDeps
): Promise<void> {
  app.post(
    EDIT_ENTITY_PATH,
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const edit = parseEditRequest(request);
        const result = await editEntityService(deps, edit.nodeId, edit.body);
        return reply.status(ACCEPTED_STATUS).send(result);
      } catch (err) {
        return sendError(err, reply, deps.logger);
      }
    }
  );
}
