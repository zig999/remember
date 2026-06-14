# E2E — Ingestão → Grafo de Conhecimento (texto → grafo)

Teste **end-to-end funcional** do pipeline de ingestão: pega um documento de
texto, dispara o loop real de extração com a LLM (Anthropic) e verifica que o
**grafo de conhecimento foi populado e está consultável**. É o E2E que o projeto
carregava como lacuna conhecida ("functional E2E still untried").

- **Script:** [`ingestion-e2e.mts`](./ingestion-e2e.mts)
- **Tipo:** script standalone (`tsx`) — **não** faz parte de `vitest run`.

## O que ele exercita

Sobe o BFF real **in-process** (`buildApp`) — pool `pg` real → Neon, catálogos
carregados do banco, SDK `@anthropic-ai/sdk` real — escutando numa porta local
efêmera, e bate nele por **HTTP real**:

```
POST /api/v1/ingest/raw-information        → RawInformation + RawChunks + LLMRun (intake, §9)
POST /api/v1/ingest/llm-runs/:id/run       → loop de tool-use real da Anthropic (§9.3, §13)
GET  /api/v1/ingest/llm-runs/:id           → run fechado como `completed`
GET  /api/v1/ingest/llm-runs/:id/tool-calls→ trilha de auditoria por proposta (§3.5)
GET  /api/v1/nodes                         → grafo legível por HTTP
GET  /api/v1/search?query=Rodrigo          → recuperação léxica funciona
```

Antes e depois ele tira um snapshot de contagens no banco e atribui o
crescimento do grafo **a esta execução** (deltas).

### O que é real e o que é stub

| Camada | Neste E2E |
|---|---|
| HTTP / Fastify / rotas / middleware de erro | **real** |
| Validação em camadas (§13), resolução de entidade (§4), consolidação (§6.5) | **real** |
| PostgreSQL (Neon) | **real** — escreve linhas duráveis |
| Anthropic (loop de extração, BR-26) | **real** — gasta tokens da API |
| **Auth (Neon Auth / JWKS)** | **stub** — `preHandler` que injeta o operador single-owner |

> Por que stub na auth? Auth é apenas a **porta de acesso** (single-owner, sem
> entidade `User`) e já tem cobertura própria (`__tests__/.../mcp-endpoint.spec.ts`,
> `unit/auth.spec.ts`). Stubá-la remove a dependência de um JWT real do Neon Auth
> sem afetar nada **abaixo** dela — que é o que este E2E quer provar.

## Pré-requisitos

1. `backend/.env` preenchido (o script o carrega sozinho):
   - `DATABASE_URL` — connection string **direta** do Neon (não a `-pooler`).
   - `ANTHROPIC_API_KEY` — chave da Anthropic (BR-29).
   - `NEON_AUTH_URL` — precisa estar **presente** (a validação de env exige),
     mas o **valor não é usado** (auth está stubada).
2. Banco com schema + catálogo aplicados (migrations `0001_init` + `0001_seed`
   + `0002_catalog_tier1`). Um branch do Neon herda tudo do pai automaticamente.
3. `node_modules` do backend instalado (`tsx` vem de `backend/devDependencies`).

## ⚠️ Segurança — leia antes de rodar

- O teste **escreve linhas duráveis** no banco apontado por `DATABASE_URL`.
- `RawInformation`/`RawChunk` são **imutáveis** (§11): não há delete normal —
  só `compliance_delete`. Cada execução deixa **um documento de teste permanente**.
- Gasta **tokens da API Anthropic** (uma execução pequena ≈ centavos).
- Por isso o script **recusa rodar sem `E2E_CONFIRM=1`**.

**Recomendado: rode contra um branch efêmero do Neon**, não contra `neondb` de
produção. Um branch é um clone copy-on-write do pai (já vem com schema, seed e
dados), e você o descarta no fim — zero poluição da prod.

```bash
# via Neon CLI (ou pelo console: Branches → New branch a partir de 'main')
neonctl branches create --project-id <PROJECT> --name e2e-$(date +%s)
neonctl connection-string <BRANCH> --project-id <PROJECT> --database-name neondb
#   → use essa string (DIRETA, sslmode=require) como DATABASE_URL abaixo
# ...rodar o E2E...
neonctl branches delete <BRANCH> --project-id <PROJECT>
```

> Posso provisionar e destruir esse branch para você via Neon MCP, se preferir —
> é só pedir. (Mexer no banco exige aprovação explícita — ver "Safety Rule" no
> `CLAUDE.md`.)

## Como rodar

A partir da pasta `backend/` (onde o `tsx` e os `node_modules` resolvem):

```bash
cd backend

# contra um branch efêmero (recomendado):
E2E_CONFIRM=1 DATABASE_URL='postgresql://…@ep-…<BRANCH>…/neondb?sslmode=require' \
  ./node_modules/.bin/tsx ../temp/e2e/ingestion-e2e.mts

# ou contra o que estiver em backend/.env (cuidado: provavelmente é a prod):
E2E_CONFIRM=1 ./node_modules/.bin/tsx ../temp/e2e/ingestion-e2e.mts
```

`DATABASE_URL` passado na linha de comando tem precedência sobre o `.env`
(o loader só preenche o que ainda não existe em `process.env`).

### Variáveis de configuração

| Var | Default | Para quê |
|---|---|---|
| `E2E_CONFIRM` | — | **obrigatória** = `1`; sem ela o script aborta |
| `E2E_MODEL` | `claude-opus-4-8` | modelo Anthropic (precisa ser um id válido) |
| `E2E_PROMPT_VERSION` | `extraction.v1` | gravado em `llm_run.prompt_version` |
| `E2E_RUN_TIMEOUT_MS` | `600000` | timeout do passo `/run` (LLM-bound) |
| `BACKEND_ENV_FILE` | `backend/.env` | caminho alternativo do `.env` |
| `LOG_LEVEL` | `warn` | suba para `info`/`debug` para ver os logs do BFF |

## Critério de aprovação

**Gate duro** (falha → exit 1):

- `chunk_count >= 1`
- `run.status === 'completed'`
- `Δ information_fragment > 0` — a LLM propôs fragmentos
- `Δ knowledge_node > 0` — entidades viraram nós
- `Δ provenance > 0` — todo aceite remonta à fonte (anti-alucinação, §13)
- `Δ tool_call > 0` — auditoria gravada (§3.5)
- `GET /nodes → 200`

**Sinais soft** (apenas `⚠`, não reprovam — a saída da LLM varia):

- `Δ knowledge_link > 0` (o documento implica ≥1 relação)
- `Δ node_attribute > 0` (implica ≥1 atributo)
- busca por "Rodrigo" retorna hits

Códigos de saída: `0` passou · `1` asserção falhou · `2` abortado (sem
`E2E_CONFIRM`/`.env`) · `3` crash inesperado.

## Saída esperada (exemplo)

```
── Ingestion → Knowledge-Graph functional E2E ───────────────────────
• Target DB : ep-…sa-east-1.aws.neon.tech/neondb
• Model     : claude-opus-4-8
• Catalog   : 9 node types, 13 link types, 16 attribute keys
• BFF up    : http://127.0.0.1:54xxx

[1/5] POST /ingest/raw-information  (nonce=lq3k1a-8f2)
      → outcome=created raw=… run=… chunks=1
      ✓ chunk_count >= 1
[2/5] POST /ingest/llm-runs/…/run  (real Anthropic loop — may take minutes)
      → status=completed attempts=1 (28.7s)
      → summary={"accepted":6,"consolidated":1,"rejected":0,…}
      ✓ run.status === 'completed'
[3/5] GET  /ingest/llm-runs/…/tool-calls
      → 9 tool-call rows recorded
[4/5] GET  /nodes  +  GET /search
      ✓ GET /nodes → 200
      → /nodes returned 4 item(s), total=4
      → /search "Rodrigo" returned 3 hit(s)
[5/5] DB deltas (this run's contribution to the graph)
      → information_fragment   0 → 5  (Δ +5)
      → knowledge_node         0 → 4  (Δ +4)
      → knowledge_link         0 → 3  (Δ +3)
      → node_attribute         0 → 3  (Δ +3)
      → provenance             0 → 8  (Δ +8)
      → tool_call              0 → 9  (Δ +9)
      ✓ Δ information_fragment > 0
      ✓ Δ knowledge_node > 0
      ✓ Δ provenance > 0 (anti-hallucination, §13)
      ✓ Δ tool_call > 0 (audit, §3.5)
─────────────────────────────────────────────────────────────────────
✓ E2E PASSED — 0 warning(s).
```

## Relação com a spec

Cobre o fluxo ponta-a-ponta da ingestão (`remember-modelagem-v7.md` §9), a
validação em camadas (§13) e a proveniência anti-alucinação (§13). É
complementar — não substituto — dos cenários de aceitação **C1–C15** (§17), que
rodam como testes de integração hermético contra Postgres. Este aqui é o único
que fecha o loop com a **LLM real**.

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| `E2E ABORTED: refusing to run without E2E_CONFIRM=1` | falta `E2E_CONFIRM=1` |
| `EnvValidationError … ANTHROPIC_API_KEY` | `.env` incompleto / `BACKEND_ENV_FILE` errado |
| `db_ping` / conexão recusada | `DATABASE_URL` inválida, ou usou o host `-pooler` |
| `run HTTP 409 BUSINESS_RUN_NOT_RUNNABLE` | rodou 2× o mesmo conteúdo; o nonce evita isso — reporte |
| `run HTTP 502 SYSTEM_LLM_PROVIDER_UNAVAILABLE` | chave/modelo Anthropic inválidos ou rede |
| `Δ knowledge_node == 0` mas run `completed` | LLM não extraiu nada — cheque o catálogo carregado e o texto |
| `fetch … HeadersTimeout` no `/run` | documento grande passou de ~300s; mantenha o doc pequeno (1 chunk) |

## Limpeza

- **Branch efêmero:** apague o branch (`neonctl branches delete …`). Pronto.
- **Banco persistente:** as linhas ficam (imutáveis). Para remover, use o fluxo
  de `compliance_delete` (§11) sobre o `raw_information_id` impresso no passo 1.
