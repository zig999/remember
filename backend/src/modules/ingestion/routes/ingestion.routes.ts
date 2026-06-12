// Fastify routes for the ingestion REST endpoints.
//
// Mounted under `/api/v1/ingest/*` from the BFF bootstrap. The parent scope
// (set in `app.ts`) already enforces Supabase JWT auth, so individual handlers
// here do NOT re-check the token.
//
// Endpoints implemented in this TC:
//   - POST /api/v1/ingest/raw-information
//   - GET  /api/v1/ingest/raw-information/:rawInformationId
//   - GET  /api/v1/ingest/raw-information/:rawInformationId/chunks
//
// Transaction boundary (BR-19): each handler opens exactly one transaction
// via `pool.connect()` + `BEGIN`, calls the service, and commits or rolls
// back. The Fastify error handler converts thrown errors to the canonical
// envelope.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import {
  ListToolCallsQuerySchema,
  RetryLlmRunRequestSchema,
} from "../dto/llm-run.dto.js";
import { IngestRawInformationRequestSchema } from "../dto/ingest-raw-information.dto.js";
import {
  getRawInformationById,
  ingestRawInformation,
  listChunksByRawInformationId,
  ResourceNotFoundError,
} from "../service/ingestion.service.js";
import {
  getLlmRunById,
  listToolCallsByLlmRun,
  retryLlmRun,
  RunNotRetryableError,
} from "../service/llm-run.service.js";

/** Dependencies the route module needs to wire itself. */
export interface IngestionRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
}

/** Body limit override for the POST route — 11 MiB per `ingestion.back.md §1`. */
const POST_INGEST_BODY_LIMIT = 11 * 1024 * 1024;

/** Path parameter Zod schema — UUID v4 (or any UUID format). */
const RawInformationIdParamSchema = z.object({
  rawInformationId: z.string().uuid(),
});

/** Path parameter Zod schema for LLMRun endpoints. */
const LlmRunIdParamSchema = z.object({
  llmRunId: z.string().uuid(),
});

export async function registerIngestionRoutes(
  app: FastifyInstance,
  deps: IngestionRouteDeps
): Promise<void> {
  app.post(
    "/raw-information",
    { bodyLimit: POST_INGEST_BODY_LIMIT },
    async (request, reply) => {
      // Zod parse — failure surfaces as ZodError -> 422 via the global handler.
      const body = IngestRawInformationRequestSchema.parse(request.body);
      const { logger } = deps;

      return await withTransaction(deps.pool, async (client) => {
        const result = await ingestRawInformation(client, body);
        logger.info(
          {
            route: "POST /api/v1/ingest/raw-information",
            outcome: result.body.outcome,
            raw_information_id: result.body.raw_information_id,
            llm_run_id: result.body.llm_run_id,
            chunk_count: result.body.chunk_count,
          },
          "ingest_raw_information_ok"
        );
        return reply.status(result.status).send(result.body);
      });
    }
  );

  app.get(
    "/raw-information/:rawInformationId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = RawInformationIdParamSchema.parse(request.params);
      return await withTransaction(deps.pool, async (client) => {
        try {
          const body = await getRawInformationById(client, params.rawInformationId);
          return reply.status(200).send(body);
        } catch (err) {
          if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: { entity: err.entity, id: err.entityId },
              },
            });
          }
          throw err;
        }
      });
    }
  );

  app.get(
    "/raw-information/:rawInformationId/chunks",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = RawInformationIdParamSchema.parse(request.params);
      return await withTransaction(deps.pool, async (client) => {
        try {
          const body = await listChunksByRawInformationId(
            client,
            params.rawInformationId
          );
          return reply.status(200).send(body);
        } catch (err) {
          if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: { entity: err.entity, id: err.entityId },
              },
            });
          }
          throw err;
        }
      });
    }
  );

  // --- LLMRun endpoints (UC-04, UC-05, UC-06) ----------------------------
  app.get(
    "/llm-runs/:llmRunId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LlmRunIdParamSchema.parse(request.params);
      return await withTransaction(deps.pool, async (client) => {
        try {
          const body = await getLlmRunById(client, params.llmRunId);
          return reply.status(200).send(body);
        } catch (err) {
          if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: { entity: err.entity, id: err.entityId },
              },
            });
          }
          throw err;
        }
      });
    }
  );

  app.get(
    "/llm-runs/:llmRunId/tool-calls",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LlmRunIdParamSchema.parse(request.params);
      const query = ListToolCallsQuerySchema.parse(request.query);
      return await withTransaction(deps.pool, async (client) => {
        try {
          const body = await listToolCallsByLlmRun(client, {
            llm_run_id: params.llmRunId,
            limit: query.limit,
            offset: query.offset,
          });
          return reply.status(200).send(body);
        } catch (err) {
          if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: { entity: err.entity, id: err.entityId },
              },
            });
          }
          throw err;
        }
      });
    }
  );

  app.post(
    "/llm-runs/:llmRunId/retry",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LlmRunIdParamSchema.parse(request.params);
      // Body is optional; parse with the schema's default to accept empty bodies.
      RetryLlmRunRequestSchema.parse(request.body ?? {});
      const { logger } = deps;
      return await withTransaction(deps.pool, async (client) => {
        try {
          const body = await retryLlmRun(client, params.llmRunId);
          logger.info(
            {
              route: "POST /api/v1/ingest/llm-runs/:id/retry",
              llm_run_id: params.llmRunId,
              attempts: body.attempts,
            },
            "llm_run_retried"
          );
          return reply.status(200).send(body);
        } catch (err) {
          if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: { entity: err.entity, id: err.entityId },
              },
            });
          }
          if (err instanceof RunNotRetryableError) {
            return reply.status(409).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: {
                  llm_run_id: err.llmRunId,
                  current_status: err.currentStatus,
                },
              },
            });
          }
          throw err;
        }
      });
    }
  );
}

/**
 * Run `fn` inside a single transaction. The caller passes the live `client`
 * to the service / repository. If `fn` throws, we ROLLBACK and re-throw so
 * the global error handler can map the error. We always release the client
 * back to the pool, no matter what.
 *
 * Implemented inline to keep transaction boundaries colocated with the route
 * layer (BR-19 of ingestion.back.md).
 */
async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Swallow ROLLBACK failures — the original error is what we surface.
    }
    throw err;
  } finally {
    client.release();
  }
}
