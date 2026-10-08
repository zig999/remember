---
title: Renovação do token expirado na leitura de pendências da curadoria
summary: A leitura do total pendente da curadoria no shell passa a renovar o token uma única vez diante de um 401 e a repetir a leitura uma única vez com o token novo; a leitura de saúde não mudou.
target: frontend
task: sha256:ff7e6225ac774d84326b4dee53ca063a765cb19609dbb28af5c55106c3f5b40f
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/pending-read-token-renewal-renew-expired-token-on-pending-read-build-2
files:
- path: src/shell/api/use-shell-status.ts
  effect: A leitura do total pendente (useCurationCount) trata um 401 pedindo ao provedor de identidade um token novo, com o cookie de sessão, por fetchAccessToken. Grava o token novo no store de autenticação e repete GET /api/v1/curation/queue?limit=1 uma única vez com ele como bearer. O total mostrado é o da resposta repetida. A leitura de saúde segue sem Authorization e sem renovação.
criteria:
- criterion: A 401 on the pending curation read makes the shell ask the identity provider for a fresh access token exactly once.
  met: true
  how: getPendingJson em src/shell/api/use-shell-status.ts chama renewToken() (fetchAccessToken) exatamente uma vez quando a primeira resposta tem status 401. Não há laço nem segunda chamada de renovação no caminho.
- criterion: The request for a fresh access token is sent with the owner's session cookie.
  met: true
  how: 'Reutiliza fetchAccessToken de src/features/auth/api/neon-auth.ts, que envia GET {auth}/token com credentials: "include". Não escrevi uma segunda chamada ao endpoint.'
- criterion: The repeated pending curation read carries the fresh access token as its bearer.
  met: true
  how: 'getPendingJson repete a leitura com send(PENDING_PATH, fresh), onde fresh é o valor devolvido por renewToken(), e send monta Authorization: Bearer ${fresh}.'
- criterion: The repeated pending curation read does not carry the expired access token as its bearer.
  met: true
  how: A repetição usa só o token devolvido pela renovação, nunca o token capturado na renderização, que é o parâmetro token da primeira leitura.
- criterion: After a successful renewal, the pending curation total is the total of the repeated read's answer.
  met: true
  how: Após renovar com sucesso, getPendingJson devolve readBody(await send(PENDING_PATH, fresh)). useCurationCount extrai total ou result.total desse corpo, como antes.
- criterion: A 401 on the repeated pending curation read does not ask the identity provider for a token a second time.
  met: true
  how: A repetição é um send simples, sem inspeção de status e sem nova chamada a renewToken. O corpo da resposta repetida é devolvido como está.
- criterion: A pending curation read that fails without a 401 is not asked again before the next 20-second interval.
  met: true
  how: 'Só o status 401 aciona a repetição. Qualquer outra resposta, ou uma falha de rede que rejeita a promessa, segue sem repetição. A query mantém retry: false e refetchInterval de REFETCH_MS (20_000).'
- criterion: No pending curation read is made while no access token is held.
  met: true
  how: 'A query mantém enabled: token != null. Nenhum caminho novo chama getPendingJson sem token, e o parâmetro é tipado como string.'
- criterion: The health read carries no Authorization header.
  met: true
  how: getJson passou a aceitar só o path e chama send(path) sem token, então nenhum cabeçalho Authorization é montado. useHealth continua chamando getJson("/health").
- criterion: A failed health read does not ask the identity provider for a token.
  met: true
  how: getJson e useHealth não referenciam renewToken nem fetchAccessToken. A renovação existe só em getPendingJson.
nodes:
- node: rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: 'getPendingJson codifica a regra: um 401 faz uma renovação por fetchAccessToken, com o cookie de sessão, e uma repetição da leitura com o token novo.'
- node: scenarios/application-shell/an-expired-token-is-renewed-and-the-total-shown
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: Dado um token expirado e uma sessão válida, o 401 leva à renovação, à leitura repetida com o token novo e à exibição do total dessa resposta. O rodapé lê o total de useCurationCount, que passa a vir da resposta repetida.
- node: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: 'As duas queries mantêm refetchInterval de 20 s e retry: false. A única repetição é a do pending após a renovação. A saúde segue sem token e sem repetição.'
- node: rules/application-shell/the-pending-total-needs-a-token
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: 'A leitura é GET /api/v1/curation/queue?limit=1 com o token como bearer, guardada por enabled: token != null. Uma resposta sem total continua contando 0 (d?.total ?? d?.result?.total ?? 0), inalterado.'
- node: contracts/application-shell/bff-shell-reads
  encoded_at:
  - src/shell/api/use-shell-status.ts
  how: read-health continua GET /health sem bearer. read-pending-curation continua GET /api/v1/curation/queue?limit=1 com bearer e agora responde, no 401, com o total da leitura repetida com o token novo. A recusa de renovação falhada não foi alcançada, pois pertence a outra tarefa.
- node: domain/application-shell/application-shell
  how: O agregado só honra o que as regras acima o restringem. O atributo curation_pending segue sendo o total exibido, sem mudança de forma, e nenhuma declaração de forma nova foi necessária.
inferences:
- inferred: Quando a renovação falha, a leitura devolve o corpo da própria resposta 401, sem total, então o shell continua mostrando 0 como antes. Não limpo o store e não redireciono.
  from: A recusa da renovação falhada pertence à tarefa end-session-on-failed-pending-renewal, apontada em REMAINDER nas Notes da tarefa. Propagar o erro faria o QueryCache (src/lib/query-client.ts) mostrar um toast a cada 20 s, e isso seria decidir esse comportamento aqui.
- inferred: O token novo é gravado com setToken, para que as leituras seguintes e as demais telas usem o token renovado.
  from: O ADVISORY das Notes sobre o armazenamento do token, o padrão trySilentRefresh de src/features/curation/api/_request.ts e src/lib/http.ts, e o risco do inventário de que repetir o bearer antigo repetiria o 401.
- inferred: A repetição lê o token novo do valor devolvido pela renovação, que é o mesmo gravado no store, e não relê o store.
  from: O risco do inventário sobre o queryFn que fecha sobre um token capturado na renderização.
- inferred: O corpo da resposta repetida é devolvido sem inspecionar o status. Um 401 na repetição vira um corpo sem total e, pela regra existente, 0.
  from: the-pending-total-needs-a-token (resposta sem total conta 0) e o critério de que a repetição não pede token uma segunda vez.
- inferred: A renovação é uma cópia local mínima do padrão de renovação, sem helper compartilhado e sem a parte de limpar e redirecionar.
  from: O rationale da tarefa, que veda unificar as quatro cópias existentes, e o inventário (must_not_duplicate), que pede para seguir o padrão.
preserved:
- 'A leitura de saúde: GET /health sem Authorization, resultado ok ou down ou checking, queryKey ["shell", "health"], 20 s, retry false.'
- O total do rodapé continua sendo total ou result.total, e 0 quando a resposta não traz total.
- 'A query de pendências continua desabilitada enquanto não há token (enabled: token != null), com a queryKey ["shell", "curation-count"] inalterada.'
- A assinatura pública do módulo (useHealth, useCurationCount, useActiveRun) segue igual para AppShell.tsx e Footer.tsx.
- fetchAccessToken, o store de autenticação e os quatro wrappers de requisição não foram tocados.
deferred:
- what: Renovação que falha na leitura de pendências, que deveria limpar a sessão e redirecionar para /sign-in?reason=session_expired.
  why: É a tarefa irmã task/pending-read-token-renewal/end-session-on-failed-pending-renewal, fora do escopo desta (REMAINDER nas Notes).
- what: A quinta cópia do padrão de renovação (trySilentRefresh) em use-shell-status.ts, junto de lib/http.ts e dos wrappers de curation, entities e ingest.
  why: O rationale da tarefa proíbe fundi-las em um helper compartilhado, pois isso mudaria uma interface e os consumidores dela.
- what: 'As lacunas listadas como UNDERDETERMINED nas Notes da tarefa: o limite da repetição, o que mostrar quando a repetição não traz total e a cadência.'
  why: Nenhum critério as fixa. Segui o que as regras do próprio nó já dizem (limit=1, sem total conta 0, 20 s) e não escolhi comportamento além disso.
---
## What it is
The pending curation read of the shell renews an expired access token once and asks the read once more with the fresh token.
The health read is unchanged.

## Notes
The implementer's source was written in an earlier attempt of this delivery, whose build run build failed at lint because typescript-eslint was declared in package.json and not installed.
After the human installed the dependencies, run build-2 passed typecheck and lint over the same source, and this record points at it.
The implementer's return was composed into this record as it stood; the source was not rewritten between the two attempts.
