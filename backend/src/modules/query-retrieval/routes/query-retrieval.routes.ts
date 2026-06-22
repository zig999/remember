// Fastify routes for the query-retrieval REST endpoints.
//
// Mounted under `/api/v1/*` by the bootstrap (`app.ts`). The parent scope
// already enforces Neon Auth JWT (BR-01); individual handlers do NOT
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
import { mapErrorToHttpResponse } from "../../knowledge-graph/mcp/error-envelope.js";

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
        return reply.status(200).send({ ok: true, result: body });
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
          return reply.status(200).send({ ok: true, result: body });
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
          return reply.status(200).send({ ok: true, result: body });
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
          return reply.status(200).send({ ok: true, result: body });
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
// Error mappers — route-side wrappers around the shared envelope mapper.
//
// BR-24 (knowledge-graph.back.md / query-retrieval.back.md): both REST and MCP
// transports surface IDENTICAL error codes / messages for any thrown service
// error. The classification core lives in
// `backend/src/modules/knowledge-graph/mcp/error-envelope.ts`; the route
// wrappers below recognise which thrown values are KNOWN business sentinels
// and delegate to the shared mapper, re-throwing everything else so it
// reaches the Fastify global error handler (which logs + maps pg / unknown
// errors to their canonical envelopes). Behaviour is preserved verbatim from
// the previous inline cascade.
// ---------------------------------------------------------------------------

function isMappableSearchError(err: unknown): boolean {
  return (
    err instanceof InvalidSearchQueryError ||
    err instanceof InvalidSearchLayerError ||
    err instanceof UnknownLinkTypeError
  );
}

function isMappableProvenanceError(err: unknown): boolean {
  return (
    err instanceof ResourceNotFoundError ||
    err instanceof FragmentNotAcceptedError ||
    err instanceof RawInformationDeletedError ||
    err instanceof EmptyProvenanceError
  );
}

function handleSearchError(err: unknown, reply: FastifyReply): FastifyReply {
  if (!isMappableSearchError(err)) throw err;
  const { statusCode, envelope } = mapErrorToHttpResponse(err);
  return reply.status(statusCode).send(envelope);
}

function handleProvenanceError(
  err: unknown,
  reply: FastifyReply,
  details: Record<string, unknown>
): FastifyReply {
  if (!isMappableProvenanceError(err)) throw err;
  // Only `ResourceNotFoundError` merges route-scoped extras into `details`;
  // the other branches own structured detail objects whose shape is fixed by
  // the error class (see the shared mapper).
  const extras =
    err instanceof ResourceNotFoundError ? details : undefined;
  const { statusCode, envelope } = mapErrorToHttpResponse(err, extras);
  return reply.status(statusCode).send(envelope);
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
