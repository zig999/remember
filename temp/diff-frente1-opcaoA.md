# Frente 1 — Opção A (diff para revisão) · NÃO aplicado

> **Status: RASCUNHO PARA REVISÃO. Nada foi alterado no código nem na spec.**
> Toca a fonte normativa v7 (§6.5-A, C4, exemplo) → aguardando sua aprovação.
> Base empírica: `temp/plano-item5-eixo-temporal.md` §2.9 (C7 violado, confirmado
> vs Postgres real 2026-06-16) e o harness `temp/e2e/succession-e2e.mts`.

## O que muda, em uma frase

A **sucessão** (§6.5-A) passa a fechar a versão antiga **só no eixo de validade**
(`valid_to`), deixando `superseded_at = NULL` — para que ela continue **visível à
viagem no tempo de validade** (consulta (b)) na sua janela `[valid_from, valid_to)`,
que é o que C7 exige. A **correção** (§6.5-B) continua **inalterada** (fecha só no
eixo de transação). Isso restaura a distinção §5.6 e é o único ponto que faltava.

**Exceção (intra-day):** quando a própria `valid_from` da linha antiga é ≥ à data
de mudança (sucessão no mesmo dia), `valid_to` não pode ser fechado sem violar
`valid_from < valid_to` (granularidade de dia, §5.1). Só nesse caso a linha cai no
eixo de **transação** (`superseded_at = now()`), como hoje. C7 é inalcançável para
sucessão sub-dia — limitação de granularidade já documentada, não regressão.

---

## 1. Código — `backend/src/modules/ingestion/service/graph-consolidation.service.ts`

Função única `closeVigentForSuccession` (L285-305), usada **tanto por link quanto
por atributo** (chamadas em L587 e L804) — um só ponto de mudança.

### ANTES (atual)

```ts
async function closeVigentForSuccession(
  client: PoolClient,
  table: "knowledge_link" | "node_attribute",
  vigentId: string,
  closeDate: string | null
): Promise<void> {
  const closeExpr = closeDate !== null ? "$2::date" : "now()::date";
  const params: unknown[] = closeDate !== null ? [vigentId, closeDate] : [vigentId];
  await client.query(
    `UPDATE ${table}
        SET valid_to = CASE
                         WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}
                           THEN valid_to
                         ELSE ${closeExpr}
                       END,
            superseded_at = now(),                       -- ← fecha SEMPRE no eixo de transação
            status        = 'superseded'::assertion_status
      WHERE id = $1`,
    params
  );
}
```

### DEPOIS (Opção A / Emenda v7.3)

```ts
async function closeVigentForSuccession(
  client: PoolClient,
  table: "knowledge_link" | "node_attribute",
  vigentId: string,
  closeDate: string | null
): Promise<void> {
  const closeExpr = closeDate !== null ? "$2::date" : "now()::date";
  const params: unknown[] = closeDate !== null ? [vigentId, closeDate] : [vigentId];
  // Opção A (Emenda v7.3): sucessão fecha o eixo de VALIDADE (valid_to) e DEIXA
  // superseded_at NULL — a versão antiga permanece visível à consulta (b) na sua
  // janela [valid_from, valid_to). É o que faz C7 passar e o que distingue
  // sucessão (mundo mudou) de correção (registramos errado — §5.6).
  // EXCEÇÃO intra-day: se valid_from >= closeDate, um valid_to dia-granular
  // violaria valid_from < valid_to; então fechamos no eixo de TRANSAÇÃO
  // (superseded_at) só nessa linha — mesmo mecanismo da correção. C7 é
  // inalcançável para sucessão sub-dia (limitação de granularidade, §5.1).
  await client.query(
    `UPDATE ${table}
        SET valid_to = CASE
                         WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}
                           THEN valid_to
                         ELSE ${closeExpr}
                       END,
            superseded_at = CASE
                              WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}
                                THEN now()               -- intra-day → eixo de transação
                              ELSE superseded_at         -- normal → permanece NULL (eixo de validade)
                            END,
            status        = 'superseded'::assertion_status
      WHERE id = $1`,
    params
  );
}
```

A única diferença é `superseded_at = now()` → `superseded_at = CASE … END`. `status`
e `valid_to` ficam idênticos. (No caminho normal, `ELSE superseded_at` é no-op: a
linha vigente sempre entra com `superseded_at = NULL`, pois `lockVigent*` filtra
`superseded_at IS NULL`.)

### Segurança da mudança (verificado)

- **dup-guard** `UNIQUE(node_id, attribute_key_id, value) WHERE valid_to IS NULL
  AND superseded_at IS NULL`: caso normal → linha antiga sai do índice (`valid_to`
  setado); intra-day → sai por `superseded_at`. Sem colisão.
- **`node_attribute_interval_ck` (`valid_from < valid_to`)**: protegido pela
  guarda intra-day (não fechamos `valid_to` quando colapsaria).
- **Sem CHECK** ligando `status='superseded'` a `superseded_at IS NOT NULL`
  (confirmado em `0001_init.sql`). Estado `status='superseded'` + `superseded_at
  NULL` é legal e coerente (há versão sucessora; ainda acreditamos que valeu no
  passado).
- **`is_current`** = `valid_to IS NULL AND superseded_at IS NULL` → linha antiga
  (valid_to setado) continua **não-corrente**. Visão atual inalterada.
- **`effective_status`** (view): `status='superseded'` cai no `ELSE status` →
  `effective_status='superseded'`. Leitura `as_of` devolve `value` correto +
  `effective_status='superseded'` (rótulo de ciclo de vida, não o valor).
- **history** (`listAttributeHistoryByNodeKey`): não filtra `superseded_at` →
  a linha antiga continua aparecendo na linhagem.

### Sub-decisão a confirmar — `status` da linha antiga

Mantive `status='superseded'` (mudança mínima; preserva o marcador de "foi
substituída"; não afeta a visibilidade `as_of`, que depende de `superseded_at`).
**Alternativa:** setar `status='active'` para uma leitura `as_of` "mais limpa"
(devolveria `effective_status` derivado em vez de `superseded`). **Não recomendo**
— perde o marcador explícito de sucessão e um filtro `status=active` passaria a
listar versões encerradas (embora `effective_status` ainda as distinga). Decisão
sua; o default do diff é **manter `superseded`**.

---

## 2. Impacto em testes

| Teste | Efeito | Ação |
|-------|--------|------|
| `unit/ingestion/graph-consolidation.spec.ts` (L772, 824, 944) | Asseguram a **estrutura do SQL** (`toContain("superseded_at")`, `CASE`, `valid_from >=`, `THEN valid_to`). O SQL novo mantém todos esses tokens. | **Devem continuar verdes** — verificar. |
| `unit/knowledge-graph/{temporal-filter,history,formatters}.spec.ts` | Usam fixtures de leitura com `superseded_at` próprio; não exercitam o consolidador. | Sem efeito. |
| `temp/e2e/succession-e2e.mts` (harness Frente 1) | Foi escrito para **confirmar o bug**; suas asserções de evidência e o C7 PROBE precisam **inverter** pós-fix (é uma sonda). | Inverter (abaixo). |

### Novo teste comportamental (recomendado)

Os unit tests do consolidador só checam a **string** do SQL — não o valor gravado.
Adicionar um teste que rode contra Postgres real (branch efêmera) e asserte o
**comportamento**:
- sucessão normal (dias distintos) → linha antiga `superseded_at IS NULL`,
  `valid_to` setado;
- sucessão intra-day → linha antiga `superseded_at` setado, `valid_to` intocado.
Cobrir **link e atributo** (a função é compartilhada; hoje só o atributo tem
cobertura `as_of` ponta-a-ponta).

### Asserções a inverter no harness (pós-fix)

```ts
// Evidência (Step 3) — caso NORMAL (T1=2026-01-01 < T2=2026-03-01):
assert(
  oldRow && oldRow.superseded_at === null && oldRow.status === "superseded" && oldRow.valid_to === T2,
  `old row closed on VALIDITY axis only: superseded_at NULL, valid_to=${T2}, status='superseded'`
);

// C7 PROBE — agora deve SATISFAZER:
assert(midStatus?.value === OLD_VALUE,
  `C7 SATISFIED: as_of inside [T1,T2) returns the old value '${OLD_VALUE}'`);
```

As asserções de "visão atual" e "as_of após" permanecem `=== NEW_VALUE` (a linha
antiga tem `valid_to=T2`, então é excluída em ambas).

---

## 3. Emenda à fonte normativa (v7.3) — `remember-modelagem-v7.md`

> Como a v7 é fechada, o padrão do projeto é registrar via **Apêndice/Emenda**
> (há o precedente "Emenda v7.2"). Esta seria a **Emenda v7.3 — Sucessão fecha o
> eixo de validade**.

### 3.1 §6.5-A (L619-624) — Fluxo A (Sucessão)

ANTES:
```
**A — Sucessão (mudança no mundo):**
1. Encerra o antigo: `valid_to = data_da_mudança` (se `requires_valid_to_on_change`),
   `superseded_at = now()`, `status = superseded`.
```
DEPOIS:
```
**A — Sucessão (mudança no mundo):**
1. Encerra o antigo **no eixo de validade**: `valid_to = data_da_mudança`,
   `status = superseded`. **`superseded_at` permanece NULL** — a versão antiga
   continua válida (e visível à consulta (b)) na janela `[valid_from, valid_to)`;
   ela só deixou de valer no MUNDO, não deixou de ser a crença do sistema sobre o
   passado. EXCEÇÃO (granularidade de dia, §5.1): se `valid_from ≥ data_da_mudança`
   (sucessão no mesmo dia), `valid_to` colapsaria — então encerra-se no eixo de
   TRANSAÇÃO (`superseded_at = now()`, `valid_to` intocado), como na correção.
```

### 3.2 Exemplo (L658-663)

ANTES: `valid_to=2026-06-10  superseded_at=2026-06-10T14:02Z  status=superseded`
DEPOIS: `valid_to=2026-06-10  superseded_at=null              status=superseded`
(o novo permanece `superseded_at=null status=active`; a linhagem segue por
`supersedes_attribute_id`.)

### 3.3 §5.3, nota da consulta (b) (L479-481)

ANTES:
```
O filtro `superseded_at IS NULL` em (a)/(b) seleciona a versão de transação
corrente — exclui o que foi encerrado por sucessão (6.5-A) ou correção (6.5-B).
```
DEPOIS:
```
O filtro `superseded_at IS NULL` em (a)/(b) exclui o que foi encerrado no **eixo
de transação** — correção (6.5-B) e o caso intra-day de sucessão. A sucessão
normal (6.5-A) é encerrada no **eixo de validade** (`valid_to`) e **permanece
visível** à consulta (b) na sua janela — é o que torna C7 satisfatível. A visão
atual (a) ainda a exclui, pois `valid_to` está setado.
```

### 3.4 C4 (L1434-1437)

Ajustar "o atributo antigo fica `superseded` (`valid_to = 2026-06-20`,
`superseded_at = now`)" → "(`valid_to = 2026-06-20`, **`superseded_at` permanece
NULL**, `status = superseded`)".

### 3.5 C7 (L1448) e §5.6

C7 não muda de texto (já descreve o resultado correto) — passa a ser **testável e
testado** (harness Frente 1). §5.6 ganha reforço: **sucessão = eixo de validade;
correção = eixo de transação** (a implementação agora reflete a distinção).

---

## 4. Plano de verificação (após aprovação)

1. Aplicar o diff de código (§1) e adicionar o teste comportamental (§2).
2. Inverter as asserções do harness (§2) e **re-rodar** contra a branch efêmera
   `frente1-succession-test` (mantida) → C7 **verde**, visão atual/após/história
   verdes.
3. `npm test` (suíte completa) verde + `tsc` limpo.
4. Aplicar a Emenda v7.3 ao `remember-modelagem-v7.md` (§3).

## 5. Como aplicar — duas vias

- **Via `/u-improve`** (recomendada por tocar a spec): pipeline SDD→dev→review→test
  emenda spec+código+testes; depois integro na main e re-rodo o harness.
- **Direta**: aplico o diff de código + testes + a Emenda v7.3 manualmente,
  re-rodo o harness e a suíte. Mais rápido; menos cerimônia de spec.

> Nenhuma das vias roda sem seu OK (toca a spec fechada e muda semântica de
> escrita — Safety Rule). A branch Neon `frente1-succession-test`
> (`br-soft-term-actofu9r`) segue **viva** para revalidar o C7 verde após o fix.
