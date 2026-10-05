import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import { withTransaction } from "../../../shared/pg-transaction.js";
import { z } from "zod";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ListToolCallsQuerySchema,
  RetryLlmRunRequestSchema,
} from "../dto/llm-run.dto.js";
import { IngestRawInformationRequestSchema } from "../dto/ingest-raw-information.dto.js";
import {
  ProposeAttributeInputSchema,
  ProposeFragmentInputSchema,
  ProposeLinkInputSchema,
  ProposeNodeInputSchema,
} from "../dto/index.js";
import { findLlmRunById } from "../repository/llm-run.repository.js";
import {
  ExtractionFatalError,
  LlmProviderFatalError,
  RunNotRunnableError,
  runLlmExtraction,
  type AnthropicFactory,
} from "../service/extraction.service.js";
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
  RunNotRunningError,
} from "../service/llm-run.service.js";
import { proposeAttributeService } from "../service/propose-attribute.service.js";
import { proposeFragmentService } from "../service/propose-fragment.service.js";
import { proposeLinkService } from "../service/propose-link.service.js";
import { proposeNodeService } from "../service/propose-node.service.js";
import type { McpEnvelope } from "../service/propose.types.js";
import { isValidationFailure } from "../validation/errors.js";

export interface IngestionRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog?: CatalogSnapshot;
  readonly now?: () => Date;
  readonly env?: {
    readonly ANTHROPIC_API_KEY: string;
    readonly CONTEXT_MODEL: string;
  };
  readonly anthropicFactory?: AnthropicFactory;
}

const RunLlmExtractionRequestSchema = z.object({}).strict().default({});

const POST_INGEST_BODY_LIMIT = 11 * 1024 * 1024;

const RawInformationIdParamSchema = z.object({
  rawInformationId: z.string().uuid(),
});

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

  if (deps.catalog !== undefined && deps.env !== undefined) {
    const orchestratorCatalog = deps.catalog;
    const orchestratorEnv = deps.env;
    const anthropicFactory = deps.anthropicFactory;
    app.post(
      "/llm-runs/:llmRunId/run",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const params = LlmRunIdParamSchema.parse(request.params);
        RunLlmExtractionRequestSchema.parse(request.body ?? {});

        try {
          const body = await runLlmExtraction(
            deps.pool,
            params.llmRunId,
            deps.logger,
            orchestratorCatalog,
            {
              env: orchestratorEnv,
              ...(anthropicFactory !== undefined ? { anthropicFactory } : {}),
            }
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
          if (err instanceof RunNotRunnableError) {
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
          if (err instanceof LlmProviderFatalError) {
            return reply.status(502).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: {
                  llm_run_id: err.llmRunId,
                  partial_run: err.partialRun,
                },
              },
            });
          }
          if (err instanceof ExtractionFatalError) {
            return reply.status(500).send({
              ok: false,
              error: {
                code: err.code,
                message: err.message,
                details: {
                  llm_run_id: err.llmRunId,
                  partial_run: err.partialRun,
                },
              },
            });
          }
          throw err;
        }
      }
    );
  }

  app.post(
    "/llm-runs/:llmRunId/retry",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LlmRunIdParamSchema.parse(request.params);
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

  app.post(
    "/llm-runs/:llmRunId/propose-fragment",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = LlmRunIdParamSchema.parse(request.params);
      const input = ProposeFragmentInputSchema.parse(request.body);
      return await handleProposeMirror(deps, reply, params.llmRunId, async (client, runCtx) => {
        return await proposeFragmentService(client, input, runCtx);
      });
    }
  );

  if (deps.catalog !== undefined) {
    const catalog = deps.catalog;
    const now: () => Date = deps.now ?? (() => new Date());

    app.post(
      "/llm-runs/:llmRunId/propose-node",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const params = LlmRunIdParamSchema.parse(request.params);
        const input = ProposeNodeInputSchema.parse(request.body);
        return await handleProposeMirror(deps, reply, params.llmRunId, async (client, runCtx) => {
          return await proposeNodeService(client, input, runCtx, { catalog });
        });
      }
    );

    app.post(
      "/llm-runs/:llmRunId/propose-link",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const params = LlmRunIdParamSchema.parse(request.params);
        const input = ProposeLinkInputSchema.parse(request.body);
        return await handleProposeMirror(deps, reply, params.llmRunId, async (client, runCtx) => {
          return await proposeLinkService(client, input, runCtx, { catalog, now });
        });
      }
    );

    app.post(
      "/llm-runs/:llmRunId/propose-attribute",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const params = LlmRunIdParamSchema.parse(request.params);
        const input = ProposeAttributeInputSchema.parse(request.body);
        return await handleProposeMirror(deps, reply, params.llmRunId, async (client, runCtx) => {
          return await proposeAttributeService(client, input, runCtx, { catalog, now });
        });
      }
    );
  } else {
    deps.logger.warn(
      { component: "ingestion.routes" },
      "propose_node_link_attribute_mirrors_skipped_no_catalog"
    );
  }
}

async function handleProposeMirror<R>(
  deps: IngestionRouteDeps,
  reply: FastifyReply,
  llmRunId: string,
  call: (
    client: PoolClient,
    runCtx: { llmRunId: string; rawInformationId: string }
  ) => Promise<McpEnvelope<R>>
): Promise<FastifyReply> {
  try {
    const envelope = await withTransaction(deps.pool, async (client) => {
      const run = await findLlmRunById(client, llmRunId);
      if (run === null) {
        throw new ResourceNotFoundError("llm_run", llmRunId);
      }
      if (run.status !== "running") {
        throw new RunNotRunningError(llmRunId, run.status);
      }
      try {
        return await call(client, {
          llmRunId,
          rawInformationId: run.input_raw_information_id,
        });
      } catch (err) {
        if (isValidationFailure(err)) {
          throw new ProposeMirrorEnvelopeReject({
            ok: false,
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          });
        }
        throw err;
      }
    });
    return reply.status(200).send(envelope);
  } catch (err) {
    if (err instanceof ProposeMirrorEnvelopeReject) {
      return reply.status(200).send(err.envelope);
    }
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
    if (err instanceof RunNotRunningError) {
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
}

class ProposeMirrorEnvelopeReject extends Error {
  public readonly envelope: McpEnvelope<unknown>;
  constructor(envelope: McpEnvelope<unknown>) {
    super("propose-mirror layered-validation rejection");
    this.name = "ProposeMirrorEnvelopeReject";
    this.envelope = envelope;
  }
}
