// Fastify routes for the query-retrieval REST endpoints.
//
// Mounted under `/api/v1/*` by the bootstrap (`app.ts`). The parent scope
// already enforces Supabase JWT auth (BR-01); individual handlers do NOT
// re-check the token.
//
// Endpoints (TC-06):
//   - GET  /api/v1/search                              (UC-01)
//   - GET  /api/v1/provenance/links/{link_id}          (UC-07)
//   - GET  /api/v1/provenance/attributes/{attribute_id}(UC-08)
//   - GET  /api/v1/provenance/fragments/{fragment_id}  (UC-09)

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../../knowledge-graph/index.js";
import {
  AttributeIdParamSchema,
  FragmentIdParamSchema,
  LinkIdParamSchema,
  SearchQuerySchema,
} from "../dto/search.dto.js";
import {
  EmptyProvenanceError,
  FragmentNotAcceptedError,
  InvalidSearchLayerError,
  InvalidSearchQueryError,
  RawInformationDeletedError,
} from "../service/errors.js";
import { searchKnowledgeService } from "../service/search.service.js";
import {
  getProvenanceByAttributeService,
  getProvenanceByFragmentService,
  getProvenanceByLinkService,
} from "../service/provenance.service.js";
import { ResourceNotFoundError } from "../../knowledge-graph/service/errors.js";
import { UnknownLinkTypeError } from "../../knowledge-graph/service/errors.js";

export interface QueryRetrievalRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

export async function registerQueryRetrievalRoutes(
  app: FastifyInstance,
  deps: QueryRetrievalRouteDeps
): Promise<void> {
  // ---------------------------------------------------------------
  // GET /search
  // ---------------------------------------------------------------
  app.get("/search", async (request: FastifyRequest, reply: FastifyReply) => {
    const query = SearchQuerySchema.parse(request.query ?? {});
    try {
      return await withReadOnly(deps.pool, async (client) => {
        const body = await searchKnowledgeService(
          client,
          deps.catalog,
          {
            query: query.query,
            layers: query.layers,
            asOf: query.as_of,
            inEffectOnly: query.in_effect_only,
            includeUncertain: query.include_uncertain,
            expand: query.expand,
            expandDepth: query.expand_depth,
            expandLinkTypes: query.expand_link_types,
            limit: query.limit,
            offset: query.offset,
          },
          deps.logger
        );
        return reply.status(200).send(body);
      });
    } catch (err) {
      return handleSearchError(err, reply);
    }
  });

  // ---------------------------------------------------------------
  // GET /provenance/links/{link_id}
  // ---------------------------------------------------------------
  app.get(
    "/provenance/links/:link_id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LinkIdParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getProvenanceByLinkService(
            client,
            params.link_id,
            deps.logger
          );
          return reply.status(200).send(body);
        });
      } catch (err) {
        return handleProvenanceError(err, reply, { link_id: params.link_id });
      }
    }
  );

  // ---------------------------------------------------------------
  // GET /provenance/attributes/{attribute_id}
  // ---------------------------------------------------------------
  app.get(
    "/provenance/attributes/:attribute_id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = AttributeIdParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getProvenanceByAttributeService(
            client,
            params.attribute_id,
            deps.logger
          );
          return reply.status(200).send(body);
        });
      } catch (err) {
        return handleProvenanceError(err, reply, {
          attribute_id: params.attribute_id,
        });
      }
    }
  );

  // ---------------------------------------------------------------
  // GET /provenance/fragments/{fragment_id}
  // ---------------------------------------------------------------
  app.get(
    "/provenance/fragments/:fragment_id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = FragmentIdParamSchema.parse(request.params);
      try {
        return await withReadOnly(deps.pool, async (client) => {
          const body = await getProvenanceByFragmentService(
            client,
            params.fragment_id,
            deps.logger
          );
          return reply.status(200).send(body);
        });
      } catch (err) {
        return handleProvenanceError(err, reply, {
          fragment_id: params.fragment_id,
        });
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Error mappers
// ---------------------------------------------------------------------------

function handleSearchError(err: unknown, reply: FastifyReply): FastifyReply {
  if (err instanceof InvalidSearchQueryError) {
    return reply.status(422).send({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }
  if (err instanceof InvalidSearchLayerError) {
    return reply.status(422).send({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: { invalid: err.invalid, allowed: err.allowed },
      },
    });
  }
  if (err instanceof UnknownLinkTypeError) {
    return reply.status(422).send({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: { link_type: err.linkType },
      },
    });
  }
  throw err;
}

function handleProvenanceError(
  err: unknown,
  reply: FastifyReply,
  details: Record<string, unknown>
): FastifyReply {
  if (err instanceof ResourceNotFoundError) {
    return reply.status(404).send({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: { entity: err.entity, id: err.entityId, ...details },
      },
    });
  }
  if (err instanceof FragmentNotAcceptedError) {
    return reply.status(404).send({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: { fragment_id: err.fragmentId, status: err.status },
      },
    });
  }
  if (err instanceof RawInformationDeletedError) {
    return reply.status(410).send({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: {
          raw_information_id: err.rawInformationId,
          deleted_at: err.deletedAt.toISOString(),
        },
      },
    });
  }
  if (err instanceof EmptyProvenanceError) {
    return reply.status(500).send({
      ok: false,
      error: {
        code: err.code,
        message: "Internal server error.",
      },
    });
  }
  throw err;
}

/** Run `fn` inside a READ ONLY transaction (BR — back spec §1). */
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
      // swallow; surface original
    }
    throw err;
  } finally {
    client.release();
  }
}
