// Fastify routes for the knowledge-graph REST endpoints.
//
// Mounted under `/api/v1/*` by the bootstrap (`app.ts`). The parent scope
// already enforces Neon Auth JWT (BR-01); individual handlers do NOT
// re-check the token.
//
// Endpoints implemented in TC-04 (read-only):
//   - GET /api/v1/node-types                     (UC-01)
//   - GET /api/v1/link-types[?include_rules]     (UC-02)
//   - GET /api/v1/attribute-keys[?node_type]     (UC-03)
//   - GET /api/v1/nodes                          (UC-04)
//   - GET /api/v1/nodes/{node_id}                (UC-05)
//   - GET /api/v1/links/{link_id}                (point read)
//   - GET /api/v1/attributes/{attribute_id}      (point read)
//
// Endpoints implemented in TC-05 (this file):
//   - GET /api/v1/nodes/{node_id}/traverse                    (UC-06)
//   - GET /api/v1/links/{link_id}/history                     (UC-09)
//   - GET /api/v1/attributes/{attribute_id}/history           (UC-10)
//   - GET /api/v1/nodes/{node_id}/attributes/{key}/history    (UC-11)

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  AttributeIdParamSchema,
  GetNodeByIdQuerySchema,
  LinkIdParamSchema,
  ListAttributeKeysQuerySchema,
  ListLinkTypesQuerySchema,
  ListNodesQuerySchema,
  NodeIdParamSchema,
  NodeIdKeyParamSchema,
  TraverseQuerySchema,
} from "../dto/queries.dto.js";
import { mapErrorToHttpResponse } from "../mcp/error-envelope.js";
import { getAttributeByIdService } from "../service/attribute.service.js";
import {
  listAttributeKeysService,
  listLinkTypesService,
  listNodeTypesService,
} from "../service/catalog.service.js";
import {
  InvalidTraverseDepthError,
  NodeDeletedError,
  ResourceNotFoundError,
  UnknownAttributeKeyError,
  UnknownLinkTypeError,
  UnknownNodeTypeError,
} from "../service/errors.js";
import {
  getAttributeHistoryService,
  getAttributeKeyHistoryService,
  getLinkHistoryService,
} from "../service/history.service.js";
import { getLinkByIdService } from "../service/link.service.js";
import {
  getNodeByIdService,
  listNodesService,
} from "../service/node.service.js";
import { traverseNodeService } from "../service/traversal.service.js";

/** Dependencies the route module needs. */
export interface KnowledgeGraphRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

export async function registerKnowledgeGraphRoutes(
  app: FastifyInstance,
  deps: KnowledgeGraphRouteDeps
): Promise<void> {
  // ---------------------------------------------------------------------
  // Catalog
  // ---------------------------------------------------------------------
  app.get("/node-types", async (_req, reply) =>
    withReadOnly(deps.pool, async (client) => {
      const body = await listNodeTypesService(client);
      return reply.status(200).send({ ok: true, result: body });
    })
  );

  app.get(
    "/link-types",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = ListLinkTypesQuerySchema.parse(request.query ?? {});
      return await withReadOnly(deps.pool, async (client) => {
        const body = await listLinkTypesService(client, {
          include_rules: query.include_rules,
        });
        return reply.status(200).send({ ok: true, result: body });
      });
    }
  );

  app.get(
    "/attribute-keys",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = ListAttributeKeysQuerySchema.parse(request.query ?? {});
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await listAttributeKeysService(
            client,
            deps.catalog,
            { node_type: query.node_type }
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        if (err instanceof UnknownNodeTypeError) {
          const { statusCode, envelope } = mapErrorToHttpResponse(err);
          return reply.status(statusCode).send(envelope);
        }
        throw err;
      }
    }
  );

  // ---------------------------------------------------------------------
  // Nodes
  // ---------------------------------------------------------------------
  app.get("/nodes", async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ListNodesQuerySchema.parse(request.query ?? {});
    try {
      return await withReadOnly(deps.pool, async (client) => {
        const body = await listNodesService(client, deps.catalog, {
          node_type: query.node_type,
          name_prefix: query.name_prefix,
          status: query.status,
          limit: query.limit,
          offset: query.offset,
        });
        deps.logger.info(
          {
            route: "GET /api/v1/nodes",
            outcome: "ok",
            result_count: body.items.length,
            total: body.total,
          },
          "knowledge_graph_list_nodes_ok"
        );
        return reply.status(200).send({ ok: true, result: body });
      });
    } catch (err) {
      if (err instanceof UnknownNodeTypeError) {
        const { statusCode, envelope } = mapErrorToHttpResponse(err);
        return reply.status(statusCode).send(envelope);
      }
      throw err;
    }
  });

  app.get(
    "/nodes/:node_id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = NodeIdParamSchema.parse(request.params);
      const query = GetNodeByIdQuerySchema.parse(request.query ?? {});
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getNodeByIdService(
            client,
            {
              nodeId: params.node_id,
              asOf: query.as_of,
              inEffectOnly: query.in_effect_only,
              includeUncertain: query.include_uncertain,
            },
            deps.logger
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        return handleReadError(err, reply, { node_id: params.node_id });
      }
    }
  );

  // ---------------------------------------------------------------------
  // Links / Attributes (point reads)
  // ---------------------------------------------------------------------
  app.get(
    "/links/:link_id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LinkIdParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getLinkByIdService(
            client,
            params.link_id,
            deps.logger
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        return handleReadError(err, reply, { link_id: params.link_id });
      }
    }
  );

  app.get(
    "/attributes/:attribute_id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = AttributeIdParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getAttributeByIdService(
            client,
            params.attribute_id,
            deps.logger
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        return handleReadError(err, reply, {
          attribute_id: params.attribute_id,
        });
      }
    }
  );

  // ---------------------------------------------------------------------
  // Traversal (UC-06)
  // ---------------------------------------------------------------------
  app.get(
    "/nodes/:node_id/traverse",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = NodeIdParamSchema.parse(request.params);
      const query = TraverseQuerySchema.parse(request.query ?? {});
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await traverseNodeService(
            client,
            deps.catalog,
            {
              startingNodeId: params.node_id,
              direction: query.direction,
              linkTypeNames: query.link_types,
              depth: query.depth,
              asOf: query.as_of,
              inEffectOnly: query.in_effect_only,
            },
            deps.logger
          );
          deps.logger.info(
            {
              route: "GET /api/v1/nodes/:node_id/traverse",
              outcome: "ok",
              node_id: params.node_id,
              depth: query.depth,
              direction: query.direction,
              result_count: body.links.length,
            },
            "knowledge_graph_traverse_ok"
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        return handleTraversalError(err, reply, { node_id: params.node_id });
      }
    }
  );

  // ---------------------------------------------------------------------
  // History — link / attribute / (node, key) (UC-09 / UC-10 / UC-11)
  // ---------------------------------------------------------------------
  app.get(
    "/links/:link_id/history",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LinkIdParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getLinkHistoryService(
            client,
            params.link_id,
            deps.logger
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        return handleReadError(err, reply, { link_id: params.link_id });
      }
    }
  );

  app.get(
    "/attributes/:attribute_id/history",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = AttributeIdParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getAttributeHistoryService(
            client,
            params.attribute_id,
            deps.logger
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        return handleReadError(err, reply, {
          attribute_id: params.attribute_id,
        });
      }
    }
  );

  app.get(
    "/nodes/:node_id/attributes/:key/history",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = NodeIdKeyParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getAttributeKeyHistoryService(
            client,
            deps.catalog,
            { nodeId: params.node_id, key: params.key },
            deps.logger
          );
          return reply.status(200).send({ ok: true, result: body });
        });
      } catch (err) {
        return handleAttributeKeyHistoryError(err, reply, {
          node_id: params.node_id,
          key: params.key,
        });
      }
    }
  );
}

/**
 * Route-side wrappers around the shared mapper (`mapErrorToHttpResponse`).
 *
 * These wrappers exist to preserve the pre-refactor behaviour of the GET
 * routes: KNOWN business errors are caught and rendered with route context
 * (`extraDetails`); UNKNOWN errors (e.g. pg connection failures, runtime
 * bugs) are re-thrown so they reach the Fastify global error handler
 * (`backend/src/middleware/error-handler.ts`), which logs them via pino and
 * applies its own pg-unavailable / 500 mapping. We deliberately do NOT
 * intercept those paths here — the global handler owns the structured-logging
 * surface for request failures.
 *
 * The classification core itself lives in `mcp/error-envelope.ts`; the MCP
 * query transport (TC-02+) will consume the same module and will NOT re-throw
 * unknown errors (MCP transports must always produce a JSON-RPC `result`, so
 * the shared mapper's "anything else → SYSTEM_INTERNAL_ERROR" branch is the
 * terminal branch on that path).
 */

/** Known sentinels recognised by the shared mapper — anything else falls
 *  through to the global Fastify error handler via `throw`. */
function isMappableServiceError(err: unknown): boolean {
  return (
    err instanceof InvalidTraverseDepthError ||
    err instanceof NodeDeletedError ||
    err instanceof ResourceNotFoundError ||
    err instanceof UnknownAttributeKeyError ||
    err instanceof UnknownLinkTypeError ||
    err instanceof UnknownNodeTypeError
  );
}

/** Error mapper for the traversal endpoint. */
function handleTraversalError(
  err: unknown,
  reply: FastifyReply,
  details: Record<string, unknown>
): FastifyReply {
  if (!isMappableServiceError(err)) throw err;
  const { statusCode, envelope } = mapErrorToHttpResponse(err, details);
  return reply.status(statusCode).send(envelope);
}

/** Error mapper for the `(node, key)` history endpoint. */
function handleAttributeKeyHistoryError(
  err: unknown,
  reply: FastifyReply,
  details: Record<string, unknown>
): FastifyReply {
  if (!isMappableServiceError(err)) throw err;
  const { statusCode, envelope } = mapErrorToHttpResponse(err, details);
  return reply.status(statusCode).send(envelope);
}

/**
 * Shared error -> envelope mapper for the GET endpoints. Returns the reply
 * for branches the global handler should NOT see; re-throws everything else
 * so it lands in the global handler (e.g. pg connection failures).
 */
function handleReadError(
  err: unknown,
  reply: FastifyReply,
  details: Record<string, unknown>
): FastifyReply {
  if (!isMappableServiceError(err)) throw err;
  const { statusCode, envelope } = mapErrorToHttpResponse(err, details);
  return reply.status(statusCode).send(envelope);
}

/**
 * Run `fn` against an acquired connection in READ ONLY mode. The
 * knowledge-graph module owns no INSERT / UPDATE statements (BR-10); we
 * still take a transaction so multi-statement reads observe a stable
 * `current_date` (back spec §1 "Transaction policy"). The transaction
 * is rolled back unconditionally — there is nothing to commit.
 */
async function withReadOnly<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await fn(client);
    await client.query("ROLLBACK");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Swallow rollback failure — surface the original error.
    }
    throw err;
  } finally {
    client.release();
  }
}
