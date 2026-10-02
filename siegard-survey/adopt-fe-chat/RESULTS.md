# adopt-fe-chat — frontend, contexto chat

Início: ver /tmp (registrado no telemetry da janela)

## TC.1–TC.2 — survey
- Layout: `api/` (14), `components/` (14), `state/chat-turn.ts`, `types.ts`; 3 áreas: `stream` (7 arquivos), `conversations` (9), `ui` (14). 3 surveyors em paralelo, sem recusa, sem cerca.
- `trace.py --survey`: stream.md `100 fact line(s) over 7 file(s) — Facts 68, Answers 17, Vocabularies 5, Upstream artifacts 10`; conversations.md `69 fact line(s) over 9 file(s) — Facts 55, Answers 6, Vocabularies 4, Upstream artifacts 4`; ui.md `95 fact line(s) over 14 file(s) — Facts 73, Answers 8, Vocabularies 5, Upstream artifacts 9`. Total 264.
- Tokens dos surveyors: 117 593 + 108 842 + 115 906 = 342 341.
- Observed: (a) o cache de mensagens é gravado como `{items, nextCursor}` e lido como `{items, nextBefore}`; (b) o envio e o cancelamento tratam sessão expirada de modo diferente; (c) o delete usa um helper sem cutoff e sem refresh; (d) `UsageBadge`, `ToolCallChip` e `StreamingCursor` não são montados em lugar nenhum fora de testes; (e) o primeiro scroll não reinicia ao trocar de conversa.

## TC.3 — análise
- Contexto novo `domain/chat-workspace`: 6 elementos, 125 regras, 4 cenários, contratos `chat-screen` (published), `bff-conversations` (consumed, upstream `contracts/chat/conversations`). Fatos de formato ligados a nós existentes de `domain/chat` (`conversation`, `message`, `tool-call`, `conversation-usage`, `turn-event-kind`, `message-role`, `assistant-stop-reason`) e `rules/chat/conversation-listing-excludes-archived`.
- 4 decisões em log. `trace.py --ledger`: `ledger sound: 264 fact line(s) over 3 material file(s) — 250 landed in 144 node(s), 14 left out with a reason`.

## TC.4 — adoção
- 23 juízes (um por arquivo com fatos), 7 arquivos só de premissa; 0 retornos recusados pelo fold. `--fold`: `137 node(s) cleared, 6 not — 0 of those collateral, blocked only by an unattributed sibling finding — 0 pair(s) omitted as current and unowed; 1 candidate(s) no file of the set holds, listed under unheld`.
- `--bind-record`: 137 vínculos gravados; sem vínculo: domain/chat-workspace/chat-status, domain/chat/message, rules/chat-workspace/frames-end-at-a-blank-line, rules/chat-workspace/malformed-frames-are-skipped-silently, rules/chat-workspace/owner-message-is-appended-before-the-answer, rules/chat-workspace/streamed-text-growth-scrolls-to-the-bottom.

## TC.5 — medição
- Achados contados nos retornos salvos: contradicts 7, unstated 4, restates 79, unheld 1 (do fold).
- Contradicts em: useSendMessage.ts, types.ts (2: content como lista de blocos × nó `domain/chat/message` com string), chat-stream.ts, chat-turn.ts, MessageStream.tsx (dependências do efeito de scroll). Unstated em: types.ts (ChatContentBlock, ActiveConversation), use-get-conversation-usage.ts, use-list-messages.ts.
- `--check frontend`: 0 orphaned, 0 moved, 2 proof, 0 code.
- Telemetria: relatório siegard-telemetry/20261002T135825Z.json.

## Lições
- O nó `domain/chat/message` tipa `content` como string; contratos e código usam lista de blocos — decisão do dono sobre qual vale.
- Docstrings de cabeçalho repetem regras: a maioria dos 79 restates, resolvidos pela rota do comentário (remover, depois reconciliar).
