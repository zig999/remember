// Fastify routes for the ingestion REST endpoints.
//
// Mounted under `/api/v1/ingest/*` from the BFF bootstrap. The parent scope
// (set in `app.ts`) already enforces Neon Auth JWT, so individual handlers
// here do NOT re-check the token.
//
// Endpoints implemented:
//   - POST /api/v1/ingest/raw-information
//   - GET  /api/v1/ingest/raw-information/:rawInformationId
//   - GET  /api/v1/ingest/raw-information/:rawInformationId/chunks
//   - GET  /api/v1/ingest/llm-runs/:llmRunId
//   - GET  /api/v1/ingest/llm-runs/:llmRunId/tool-calls
//   - POST /api/v1/ingest/llm-runs/:llmRunId/retry
//   - POST /api/v1/ingest/llm-runs/:llmRunId/propose-fragment   (TC-13)
//   - POST /api/v1/ingest/llm-runs/:llmRunId/propose-node       (TC-13)
//   - POST /api/v1/ingest/llm-runs/:llmRunId/propose-link       (TC-13)
//   - POST /api/v1/ingest/llm-runs/:llmRunId/propose-attribute  (TC-13)
//
// Transaction boundary (BR-19): each handler opens exactly one transaction
// via `pool.connect()` + `BEGIN`, calls the service, and commits or rolls
// back. The Fastify error handler converts thrown errors to the canonical
// envelope.
//
// TC-13 specifics (BR-28 / UC-08..UC-11 alt 1a REST branch): the four
// propose-* mirrors are HTTP entry points over the same transport-agnostic
// service functions used by the MCP `ingest` toolset. They:
//   1. Zod-parse the request body using the same schemas the MCP transport
//      uses (`dto/index.ts`) — Zod failure -> HTTP 422 via the global error
//      handler.
//   2. Perform a run-state pre-check inside the open transaction that
//      distinguishes 404 (`RESOURCE_NOT_FOUND`, llm_run row absent) from 409
//      (`BUSINESS_RUN_NOT_RUNNING`, row present but `status != 'running'`).
//      The MCP transport collapses the second case into a `STRUCTURAL_INVALID`
//      envelope per BR-21; the REST surface exposes it as a discrete HTTP
//      status because human callers benefit from the explicit code.
//   3. Delegate the business work to the transport-agnostic service function
//      (`proposeFragmentService`, etc. — `service/propose-*.service.ts`),
//      which is the same function the MCP handler shell invokes. No business
//      logic is duplicated.
//   4. Return HTTP 200 for any reachable handler. The `ok: true/false` flag on
//      the body is the outcome indicator — a layered-validation rejection
//      (ValidationFailure) is a *business result*, not a transport error, and
//      surfaces as `{ ok: false, error: { code, message, details } }` with
//      HTTP 200. The open transaction is rolled back in that case.

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

/** Dependencies the route module needs to wire itself. */
export interface IngestionRouteDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  /**
   * Catalog snapshot required by the propose-{node,link,attribute} REST
   * mirrors (TC-13) and the extraction orchestrator (TC-12). When omitted,
   * only the propose-fragment mirror (no catalog dependency) is registered
   * and the runLlmExtraction endpoint is skipped.
   */
  readonly catalog?: CatalogSnapshot;
  /**
   * Clock source for the temporal layer of propose-link / propose-attribute
   * REST mirrors (TC-13). Defaults to `() => new Date()` when omitted; tests
   * inject deterministic clocks here.
   */
  readonly now?: () => Date;
  /**
   * Environment fragment carrying the Anthropic API key (BR-29). Required to
   * mount the `runLlmExtraction` route (TC-12). Same optional reason as `catalog`.
   */
  readonly env?: { readonly ANTHROPIC_API_KEY: string };
  /**
   * Anthropic factory override — defaults to the real SDK. Tests inject a
   * stub to drive the orchestrator without hitting the network (TC-12).
   */
  readonly anthropicFactory?: AnthropicFactory;
}

/** Schema for the (currently empty) `runLlmExtraction` request body. */
const RunLlmExtractionRequestSchema = z.object({}).strict().default({});

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

  // --- TC-12: synchronous extraction trigger (UC-12 / BR-26) -------------
  // Mount the run endpoint only when the orchestrator dependencies (catalog
  // + ANTHROPIC_API_KEY) are present. Tests that exercise the read-only
  // surface can omit them.
  if (deps.catalog !== undefined && deps.env !== undefined) {
    const orchestratorCatalog = deps.catalog;
    const orchestratorEnv = deps.env;
    const anthropicFactory = deps.anthropicFactory;
    app.post(
      "/llm-runs/:llmRunId/run",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const params = LlmRunIdParamSchema.parse(request.params);
        // Body is optional in v1 — parse with a strict default so unknown
        // fields surface as 422.
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

  // --- propose-* REST mirrors (TC-13 / UC-08..UC-11 REST branch) --------
  //
  // BR-28: dual-transport exposure of the four `ingest` tools (MCP + REST).
  // Each route:
  //   1. Zod-parses the request body (Zod failure -> 422 via global handler).
  //   2. Opens a single transaction (BR-19) and within it loads the llm_run
  //      row to distinguish 404 (unknown id) from 409 (status != 'running').
  //   3. Calls the transport-agnostic propose-* service from the service
  //      layer — the same function the MCP handler shell calls.
  //   4. Returns the MCP envelope verbatim with HTTP 200; any layered-
  //      validation rejection (ValidationFailure) is mapped to an
  //      `{ ok: false, error: { code, message, details } }` envelope, still
  //      HTTP 200, per BR-28.
  //
  // The propose-node / propose-link / propose-attribute routes require the
  // catalog snapshot. When `deps.catalog` is missing the bootstrap is in
  // "no-catalog mode" (test apps that don't exercise these endpoints) and
  // we skip registering these three mirrors. The propose-fragment mirror
  // does not need the catalog, so it is always registered.

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

/**
 * Shared shell for the four propose-* REST mirrors.
 *
 * Opens ONE transaction (BR-19), loads the `llm_run` row first to distinguish
 * 404 (unknown id) vs 409 (status != 'running'), and invokes the supplied
 * service `call`. Maps:
 *   - `ResourceNotFoundError` -> HTTP 404 with `RESOURCE_NOT_FOUND` envelope.
 *   - `RunNotRunningError`    -> HTTP 409 with `BUSINESS_RUN_NOT_RUNNING` envelope.
 *   - `ValidationFailure`     -> HTTP 200 with `{ ok: false, error: ... }`
 *                                envelope (BR-28 envelope semantics) AND
 *                                ROLLBACK of the open transaction.
 *
 * Any other error re-throws and surfaces via the global error handler (500).
 */
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
      // BR-21 REST branch: load the run row inside the transaction. This is
      // also the source of `input_raw_information_id` for the service's
      // `runCtx` argument (per the task contract's allowed assumption:
      // "load run row for rawInformationId lookup within the same
      // transaction as the service call").
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
        // Map the typed sentinel to the MCP error envelope verbatim and
        // throw a transient marker so `withTransaction` rolls back any
        // partial writes (BR-13). The outer catch unwraps it.
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

/**
 * Carry an MCP error envelope back through the `withTransaction` ROLLBACK
 * path. We throw this from the inner closure so the transaction rolls back
 * cleanly; the outer `.catch` unwraps it and returns the envelope verbatim
 * to the route handler.
 */
class ProposeMirrorEnvelopeReject extends Error {
  public readonly envelope: McpEnvelope<unknown>;
  constructor(envelope: McpEnvelope<unknown>) {
    super("propose-mirror layered-validation rejection");
    this.name = "ProposeMirrorEnvelopeReject";
    this.envelope = envelope;
  }
}

