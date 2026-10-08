import type { FastifyInstance } from "fastify";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import type { JWK } from "jose";
import type { Pool } from "pg";
import pino from "pino";
import type { Logger } from "pino";

import { buildApp } from "../../../app.js";
import type { Env } from "../../../config/env.js";
import { buildMcpServer } from "../../../mcp/server.js";
import { buildNeonAuth } from "../../../middleware/auth.js";
import { buildSnapshot as buildIngestionSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { buildSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";
import type { EditWorld } from "../../unit/curation/edit-entity-world.js";
import { routing } from "./edit-entity-routing.js";

const KEY_ID = "test-kid";
const ALGORITHM = "RS256";
const OWNER_ID = "owner-1";
const VALID_LIFETIME_SECONDS = 60;
const ERROR_LOG_LEVEL = 50;
const MILLISECONDS_PER_SECOND = 1000;

const ENV = Object.freeze({
  NODE_ENV: "test",
  PORT: 3000,
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  PG_POOL_MIN: 2,
  PG_POOL_MAX: 10,
  PG_STATEMENT_TIMEOUT_MS: 10_000,
  NEON_AUTH_URL: "https://ep-test.neon.tech/neondb/auth",
  NEON_AUTH_JWKS_TTL_S: 600,
}) as Env;

export type LogRecord = Record<string, unknown>;

export interface SigningKey {
  readonly privateKey: CryptoKey;
  readonly publicJwk: JWK;
}

export interface TokenClaims {
  readonly subject: string | undefined;
  readonly lifetimeSeconds: number;
}

export interface RouteApp {
  readonly app: FastifyInstance;
  readonly key: SigningKey;
  readonly token: string;
  readonly records: LogRecord[];
}

export interface EditRequest {
  readonly nodeId: string;
  readonly payload?: object | undefined;
  readonly authorization?: string | null;
}

export interface Answer {
  readonly status: number;
  readonly body: unknown;
}

export type AppliedWire = {
  attribute_key: string;
  effect: string;
  item_id: string | null;
  predecessor_id: string | null;
};

export type AcceptedWire = {
  node_id: string;
  action_id: string;
  applied: AppliedWire[];
};

export type RefusedWire = {
  ok: boolean;
  error: { code: string; message: string; details?: unknown };
};

export const OWNER_CLAIMS: TokenClaims = {
  subject: OWNER_ID,
  lifetimeSeconds: VALID_LIFETIME_SECONDS,
};

export async function generateSigningKey(): Promise<SigningKey> {
  const { privateKey, publicKey } = await generateKeyPair(ALGORITHM, {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  return {
    privateKey,
    publicJwk: { ...publicJwk, kid: KEY_ID, alg: ALGORITHM, use: "sig" },
  };
}

export async function signToken(
  key: CryptoKey,
  claims: TokenClaims
): Promise<string> {
  const expiresAt =
    Math.floor(Date.now() / MILLISECONDS_PER_SECOND) + claims.lifetimeSeconds;
  const jwt = new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM, kid: KEY_ID })
    .setIssuedAt()
    .setExpirationTime(expiresAt);
  if (claims.subject !== undefined) {
    jwt.setSubject(claims.subject);
  }
  return jwt.sign(key);
}

function captureLogger(records: LogRecord[]): Logger {
  return pino(
    { level: "info" },
    {
      write: (line: string): void => {
        records.push(JSON.parse(line) as LogRecord);
      },
    }
  );
}

function emptyKnowledgeGraphCatalog(): ReturnType<typeof buildSnapshot> {
  return buildSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

function emptyIngestionCatalog(): ReturnType<typeof buildIngestionSnapshot> {
  return buildIngestionSnapshot({
    nodeTypes: [],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
    attributeValidValues: [],
  });
}

export async function openRouteApp(
  pool: Pool = routing.pool
): Promise<RouteApp> {
  const key = await generateSigningKey();
  const records: LogRecord[] = [];
  const logger = captureLogger(records);
  const app = await buildApp({
    env: ENV,
    logger,
    pool,
    auth: buildNeonAuth(
      ENV,
      async () =>
        ({ type: "public", algorithm: ALGORITHM, ...key.publicJwk }) as never
    ),
    mcp: buildMcpServer(logger),
    catalog: emptyKnowledgeGraphCatalog(),
    ingestionCatalog: emptyIngestionCatalog(),
  });
  const token = await signToken(key.privateKey, OWNER_CLAIMS);
  return { app, key, token, records };
}

export function unreachablePool(error: Error): Pool {
  return {
    connect: async () => {
      throw error;
    },
    on: () => undefined,
    end: async () => undefined,
  } as unknown as Pool;
}

export function serve(world: EditWorld): void {
  routing.forward = (nodeId, body) => world.edit(body, nodeId);
}

export function stopServing(): void {
  routing.forward = undefined;
}

export async function sendEdit(
  site: RouteApp,
  request: EditRequest
): Promise<Answer> {
  const authorization =
    request.authorization === undefined
      ? `Bearer ${site.token}`
      : request.authorization;
  const response = await site.app.inject({
    method: "POST",
    url: `/api/v1/nodes/${request.nodeId}/edit`,
    headers: authorization === null ? {} : { authorization },
    ...(request.payload === undefined ? {} : { payload: request.payload }),
  });
  return { status: response.statusCode, body: response.json() as unknown };
}

export function acceptedOf(answer: Answer): AcceptedWire {
  return answer.body as AcceptedWire;
}

export function refusalOf(answer: Answer): RefusedWire {
  return answer.body as RefusedWire;
}

export function errorLogsOf(site: RouteApp): LogRecord[] {
  return site.records.filter((record) => {
    const level = record["level"];
    return typeof level === "number" && level >= ERROR_LOG_LEVEL;
  });
}
