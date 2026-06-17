# Handoff — Endurecer o engine de orquestração (Siegard / orch_core)

> **Para quem implementa:** este documento é autocontido para um agente Claude Code trabalhando no
> repositório **siegard-code** (a fonte do framework). As correções abaixo **não** devem ser
> editadas in-place num projeto consumidor — no projeto "Remember" os arquivos
> `.claude/lib/orch_core.py` e `.claude/skills/orch-state/scripts/reduce.py` são **cópias
> gerenciadas** (re-copiadas a cada update; edições locais se perdem). Faça a mudança em siegard-code
> e propague.
>
> **Referências de linha** são do arquivo como observado em 2026-06-16 no projeto Remember
> (`.claude/lib/orch_core.py`); confirme os números no checkout de siegard-code (podem diferir, mas os
> símbolos/funções são os mesmos).

---

## 0. Contexto mínimo do engine (event sourcing)

O Siegard orquestra workflows (SDD → dev → review → test) com **event sourcing**:
- **Log append-only com hash-chain:** `.orch/log.jsonl` — cada evento tem `seq`, `event_type`,
  `task_id`, `attempt`, `data`, `prev_hash`, `hash`. É a fonte única da verdade.
- **Redução:** `reduce_all()` (`orch_core.py:1726`) reproduz **todos** os eventos via `apply_event`
  num **único `OrchState`**, derivando fases e tasks. A CLI `reduce.py` chama `reduce_all()`.
- **Máquina de estado de task:** `TaskStatus` = `PENDING → READY → RUNNING → {COMPLETED | FAILED}`;
  `FAILED → SCHEDULED → (retry) → PENDING…`; terminais: `COMPLETED`, `SKIPPED`, `DLQ`.
- **Workers assíncronos:** subagentes emitem `task_claimed`/`task_completed`/`task_failed`; um hook
  (`on_subagent_stop`) também pode sintetizar eventos. Logo, **eventos podem chegar fora de ordem /
  atrasados** — o hazard central deste handoff.

---

## 1. Sintoma observado (produção real)

Ao tentar avançar um novo workflow (`mcp-ingest-sdk`), a derivação de estado **travou** para
**todos** os workflows:

```json
// saída de reduce.py (.claude/skills/orch-state/scripts/reduce.py)
{"status": "error", "reason": "illegal_transition",
 "detail": "task_completed: task 'review_dev_tc_mcc_001' is <TaskStatus.READY: 'ready'>, expected running"}
```

E o diagnóstico (`.orch/last_error.json`, escrito pelo hook `on_stop`):

```json
{
  "workflow_id": "mcp-curation-dual",
  "run_status": "stale_orchestrator",
  "last_seq": 1530,
  "diagnostic": {
    "stale_orchestrator": "review",
    "pending_tasks": 4,
    "pending_task_ids": ["review_dev_tc_mcc_001", "review_dev_tc_mcc_002",
                         "review_dev_tc_mcc_003", "review_dev_tc_mcc_004"],
    "action_required": "Orchestrator stopped... Re-invoke /u-orchestrator — the log is intact...",
    "command": "/u-orchestrator"
  }
}
```

**Impacto duplo:** (a) um workflow (`mcp-curation-dual`) ficou **encalhado** (review parou com tasks
pendentes); (b) por causa de UMA transição ilegal no log desse workflow, o **reducer global parou**,
bloqueando o avanço de **qualquer outro** workflow. O reparo exigiu intervenção manual:
`verify_and_recover(from_seq=1539, confirm=True)` (`orch_core.py:759`) — arquivou a cauda corrompida
do log e re-emitiu seq 1540-1606 com a hash-chain corrigida.

---

## 2. Causa-raiz: corrida de "evento de tentativa superada"

### A sequência exata que quebra (exemplo)
```
seq N    task_failed          attempt=1   → task.status=FAILED,    task.attempts=1
seq N+1  task_scheduled_retry             → task.status=SCHEDULED
seq N+2  task_retried         attempt=2   → task.status=PENDING→READY, task.attempts=2
seq 1539 task_completed       attempt=1   ← LATE: o worker da tentativa 1 terminou e emitiu agora
```
No último evento, a task está em `READY` (já na tentativa 2). O handler de `task_completed`
(`orch_core.py:1506`) tem idempotência só para estados **terminais**; `READY` não é terminal nem
`RUNNING/FAILED`, então cai no `raise`:

```python
# _handle_task_completed (orch_core.py:1506)
def _handle_task_completed(state, event):
    task = state.tasks[task_id]
    if task.status in (COMPLETED, SKIPPED, DLQ):      # idempotência p/ terminais
        return
    if task.status not in (RUNNING, FAILED):          # ← READY cai aqui
        raise IllegalTransition(                       # ← seq 1539 estoura aqui
            f"task_completed: task {task_id!r} is {task.status!r}, expected running")
    ...
```

O `_handle_task_retried` (`orch_core.py:1595`) já avançou `task.attempts` para 2:
```python
def _handle_task_retried(state, event):
    ...
    task.attempts = event.attempt   # = 2
    task.status = TaskStatus.PENDING
    _try_promote_to_ready(task, state)   # → READY
```

**Diagnóstico:** o `task_completed` tardio carrega `event.attempt = 1`, mas a task já está na
tentativa `2`. É um **straggler de uma tentativa superada** — deveria ser **ignorado**, não fatal.
Note que `Event.attempt` está disponível e já é usado (ex.: `task.attempts = event.attempt` em
`_handle_task_failed`, `orch_core.py:1567`).

---

## 3. Mapa do código relevante (orch_core.py / reduce.py)

| Símbolo | Linha aprox. | Papel |
|---|---|---|
| `reduce_all()` | 1726 | reducer **estrito** global (o que `reduce.py` usa) |
| `reduce_all_tolerant()` | 1756 | reducer **tolerante** (coleta `Violation` e pula) — **diagnóstico** |
| `read_events_filtered(...)` | 586 | filtra por `task_id`/`event_type`/`phase`/`tail` — **NÃO** por `workflow_id` |
| `verify_and_recover(from_seq, confirm=True)` | 759 | reparo destrutivo (arquiva cauda + re-emite) — **manual por design** |
| `apply_event` handlers | 1390-1640 | máquina de estado; `_handle_task_completed`@1506, `_handle_task_failed`@1553, `_handle_task_retried`@1595 |
| `stale_tasks(state, now)` | 1798 | tasks **RUNNING** ociosas além do limite do tier |
| `TaskStatus` enum | 290 | `PENDING/READY/RUNNING/COMPLETED/FAILED/SCHEDULED/SKIPPED/DLQ` |
| `Violation` dataclass | 1740 | `(seq, task_id, event_type, workflow_id, phase, message)` |

---

## 4. Correções

### Fix 1 — Tolerância a evento de tentativa superada (CAUSA-RAIZ; obrigatório)

Em `_handle_task_completed` **e** `_handle_task_failed`, antes do `raise`, tratar evento de tentativa
antiga como **no-op idempotente**.

**Antes** (`_handle_task_completed`, 1513-1521):
```python
if task.status in (TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.DLQ):
    return
if task.status not in (TaskStatus.RUNNING, TaskStatus.FAILED):
    raise IllegalTransition(
        f"task_completed: task {task_id!r} is {task.status!r}, expected running")
```

**Depois:**
```python
if task.status in (TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.DLQ):
    return
# Straggler de tentativa superada: um task_retried já avançou a task para uma
# tentativa mais nova (task.attempts). Um task_completed/failed carregando um
# event.attempt ANTERIOR é resíduo do worker da tentativa antiga → no-op.
if event.attempt is not None and event.attempt < task.attempts:
    return  # (opcional: logar um marcador 'stale_attempt' p/ observabilidade)
if task.status not in (TaskStatus.RUNNING, TaskStatus.FAILED):
    raise IllegalTransition(
        f"task_completed: task {task_id!r} is {task.status!r}, expected running")
```
Aplicar o **mesmo guard** em `_handle_task_failed` (antes do `raise` da linha 1562-1565).

**Pré-condição a verificar:** o invariante `event.attempt < task.attempts ⟺ evento superado` só vale
se `task.attempts` for inicializado de forma consistente. Confirme:
- `_handle_task_created` **não** seta `attempts` → cheque o default de `TaskState.attempts` (deve ser
  `1`, ou ≤ o `attempt` do primeiro `task_completed`, senão o caminho feliz seria pulado por engano);
- no caminho feliz: `created (attempts=1) → claimed (attempt=1) → completed (event.attempt=1)` →
  `1 < 1` é `False` → processa normalmente. ✅
- Se o default for `0`/`None`, ajuste o guard para `event.attempt < (task.attempts or 1)`.

> Esse fix **mata o defeito na origem**: sem transições ilegais geradas pela corrida, o reducer
> estrito não tem motivo para parar.

### Fix 2 — Isolamento por workflow (`reduce_workflow`) — recomendado, com nuance

**Objetivo:** um workflow com problema **não** deve inviabilizar o estado dos demais (o reducer hoje
é global).

**Nuance importante (não subestimar):** `read_events_filtered` (586) **não** filtra por
`workflow_id`, e **eventos de task não carregam `workflow_id` em `data`** — só `task_id` + `phase`. A
associação task→workflow é indireta (via `phase_declared`/`phase_entered`, que carregam
`workflow_id`). Logo, um simples `filter(workflow_id==X)` **não funciona** para eventos de task.

**Duas estratégias:**
- **(A) Tag no emit (preferida, à frente):** `append.py` passa a gravar `workflow_id` em **todo**
  evento (o orquestrador conhece o `workflow_id` ativo). Aí `reduce_workflow(wid)` = reduzir só os
  eventos com aquele `workflow_id`. Limpo, mas exige back-fill p/ logs antigos.
- **(B) Derivar na redução (compatível com logs atuais):** primeira passada mapeia
  `task_id → phase → workflow_id` (phases carregam `workflow_id`); segunda passada reduz só os
  eventos pertencentes ao conjunto de phases/tasks do workflow alvo.

**Esboço:**
```python
def reduce_workflow(workflow_id: str) -> OrchState:
    # opção B: descobrir as phases/tasks do workflow, depois reduzir só esses eventos
    task_ids, phases = _tasks_and_phases_for_workflow(workflow_id)  # 1ª passada
    state = OrchState()
    for ev in read_events():
        if _belongs_to(ev, workflow_id, task_ids, phases):
            apply_event(state, ev)
    return state
```
O orquestrador (e o `reduce.py`, via flag `--workflow <id>`) passam a derivar estado **escopado**.

### Fix 3 — Caminho de leitura tolerante — OPCIONAL e com CAVEAT forte

⚠️ **Respeitar a filosofia do autor.** O docstring de `reduce_all_tolerant` (1761) diz textualmente:
> *"The engine MUST use the strict `reduce_all` — the validator rejecting a bad log is a feature, not
> a bug."*

Portanto **NÃO** troque cegamente o engine para o tolerante. A combinação **Fix 1 (sem transições
ilegais) + Fix 2 (isolamento)** já remove a necessidade de enfraquecer o engine. O `reduce_all_tolerant`
deve **permanecer diagnóstico** (monitor, `/orch-state`). Se — e só se — existir um caminho de
**leitura** que não pode falhar duro (ex.: um painel de status), use o tolerante **explicitamente
ali**, **sinalizando as `Violation` em alto relevo** (nunca silencioso). O caminho de **decisão do
orquestrador** continua estrito.

### Fix 4 — Auto-recuperação de `stale_orchestrator`

O caso `mcp-curation-dual` foi tasks em **READY** + orquestrador morto (ninguém as reivindicou).
Note: `stale_tasks(state, now)` (1798) cobre só tasks **RUNNING** ociosas — **não** cobre este caso.
O hook `on_stop` já escreve `last_error.json` com o diagnóstico e recomenda `/u-orchestrator`. **Falta
o passo automático.**

**Ação:** um hook de saúde que, ao detectar "orquestrador parou com tasks READY/PENDING/SCHEDULED
remanescentes no workflow", **re-despache a fase** (o equivalente automático a `/u-orchestrator`), ou
no mínimo **emita um sinal acionável** sem depender de leitura humana do `last_error.json`.
`verify_and_recover` **continua manual** (é destrutivo — arquiva/reescreve log; nunca automático).

---

## 5. Plano de testes (com fixtures)

### T1 — Fix 1 (straggler de tentativa superada)
```python
state = OrchState()
apply_seq(state, [
    ev("task_created",  task_id="t1", attempt=1, data={"phase":"dev","tier":"standard"}),
    ev("phase_entered", data={"phase":"dev","order":1,"workflow_id":"wf"}),  # promove t1→READY
    ev("task_claimed",  task_id="t1", attempt=1),                            # RUNNING
    ev("task_failed",   task_id="t1", attempt=1, data={"retryable":True}),   # FAILED, attempts=1
    ev("task_scheduled_retry", task_id="t1"),                                # SCHEDULED
    ev("task_retried",  task_id="t1", attempt=2),                            # PENDING→READY, attempts=2
])
# AÇÃO: evento tardio do worker da tentativa 1
apply_event(state, ev("task_completed", task_id="t1", attempt=1))   # deve ser NO-OP, sem raise
assert state.tasks["t1"].status in (TaskStatus.READY, TaskStatus.PENDING)   # inalterado
# E a tentativa nova completa normalmente:
apply_event(state, ev("task_claimed",   task_id="t1", attempt=2))
apply_event(state, ev("task_completed", task_id="t1", attempt=2))
assert state.tasks["t1"].status == TaskStatus.COMPLETED
```
Repetir o cenário análogo para um `task_failed` tardio de attempt antiga.

### T2 — Fix 2 (isolamento por workflow)
Construir um log com **workflow A** (são) + **workflow B** com uma transição ilegal forjada.
`reduce_workflow("A")` retorna estado válido; `reduce_workflow("B")` sinaliza o problema —
**nenhum dos dois bloqueia o outro**.

### T4 — Fix 4 (stale)
Simular orquestrador parado com tasks em READY → o hook de saúde detecta e re-despacha (ou emite o
sinal), sem `verify_and_recover`.

### Regressão (obrigatória)
Rodar a suíte de aceitação do framework — `orch_core` é **compartilhado entre projetos**; idempotência
existente (`task_claimed`/`task_failed`/`task_scheduled_retry` já no-op p/ terminais, 1492/1558/1582)
não pode regredir.

---

## 6. Critérios de aceite
1. A sequência de T1 **não** levanta `IllegalTransition`; estado final correto.
2. `reduce_workflow(X)` funciona mesmo com outro workflow corrompido no mesmo log.
3. Engine de decisão segue **estrito** (Fix 3 não relaxou o caminho de decisão).
4. `stale_orchestrator` com tasks READY é detectado e retomado/sinalizado automaticamente.
5. Suíte de regressão do framework verde.

## 7. NÃO fazer
- ❌ Rodar `verify_and_recover` automaticamente (é destrutivo — só manual/confirmado).
- ❌ Trocar o engine de decisão para `reduce_all_tolerant` (contraria a filosofia do autor).
- ❌ Editar `orch_core.py`/`reduce.py` in-place num projeto consumidor (são cópias gerenciadas).
- ❌ "Consertar" a idempotência existente removendo os guards de terminal — eles cobrem o caso TOCTOU
  do hook (`on_subagent_stop`) e são complementares ao Fix 1 (que cobre o caso de tentativa superada).
