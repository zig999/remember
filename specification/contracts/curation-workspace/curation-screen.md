---
type: api
direction: published
operations:
- show-queue
- show-metrics
- decide-item
- undo-decision
- read-decision-panel
- correct-item
- show-evidence
- use-batch-bar
- open-drawer
answers:
- operation: show-queue
  accepted: "the tabs Tudo, Entidades and Disputas and, for the tab chosen, each entry with a badge (Para revisar for an entity match, Disputado for a dispute), its age and its scope line (the node's canonical name for an entity match, \"Link · <link type>\" or \"Link\" and \"Atributo · <attribute key>\" or \"Atributo\" for a dispute), and the pill \"1 novo\" or \"N novos\" when entries arrived since the baseline"
  refusals:
  - when: "The queue read fails."
    answer: "the banner \"Não foi possível carregar a fila. Tente novamente.\" replaces the list, with a retry that reads the queue again and no status or code shown"
  - when: "The queue read succeeds with no entries."
    answer: "\"Nada pendente\" with \"A fila está limpa.\", the same on every tab"
  - when: "Nothing is selected or the selection is not in the loaded queue."
    answer: "the decision column reads \"Selecione um item da fila para começar.\""
- operation: show-metrics
  accepted: "the labels Aceitação, Em revisão, Incertos, Disputados and Fila entidades over the acceptance rate as a percentage and the four counts"
  refusals:
  - rule: "rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals"
    answer: "a dash for Aceitação, Em revisão and Incertos and the queue totals for Disputados and Fila entidades, with no error shown"
- operation: decide-item
  accepted: "an immediate decision answers the notice \"Confirmado.\" for two seconds and moves to the next item, and a destructive decision answers the undo toast and moves to the next item at once"
  refusals:
  - when: "The failure carries no error envelope."
    answer: "the notice \"Algo deu errado. Tente novamente.\""
  - when: "The failure is one of the authentication codes AUTH_UNAUTHORIZED, AUTH_TOKEN_EXPIRED, AUTH_TOKEN_INVALID or AUTH_SESSION_EXPIRED."
    answer: "no notice and no field error"
  - when: "The failure is BUSINESS_REVIEW_NOT_PENDING or BUSINESS_ITEM_NOT_DISPUTED."
    answer: "the warning \"Já resolvido em outro lugar.\" with the item removed and the stale signal raised"
  - when: "The failure is BUSINESS_ITEM_NOT_UNCERTAIN."
    answer: "the warning \"Este item já não está incerto.\" with the item removed"
  - when: "The failure is BUSINESS_ITEM_NOT_DELETABLE."
    answer: "the warning \"Este item já foi rejeitado ou substituído.\" with the item removed"
  - when: "The failure is BUSINESS_NODE_DELETED."
    answer: "the warning \"Este nó foi excluído por conformidade.\" with the item removed"
  - when: "The failure is RESOURCE_NOT_FOUND."
    answer: "the warning \"Item não encontrado.\" with the item removed"
  - when: "The failure is one of BUSINESS_REASON_REQUIRED, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_TARGET_NODE_REQUIRED, BUSINESS_INVALID_TARGET_NODE, BUSINESS_DISPUTE_WINNER_REQUIRED, BUSINESS_DISPUTE_PERIODS_REQUIRED, BUSINESS_TEMPORAL_INCOHERENT, BUSINESS_DATE_UNJUSTIFIED, BUSINESS_CORRECTION_NO_CHANGES or BUSINESS_FRAGMENT_NOT_ACCEPTED."
    answer: "the code, the message and the status shown as a field error in the decision panel, with no notice"
  - when: "The failure has status 503 and any other code."
    answer: "the notice \"Serviço temporariamente indisponível. Tente novamente em instantes.\""
  - when: "The failure has a status of 500 or above other than 503 and any other code."
    answer: "the notice \"Algo deu errado. Tente novamente.\""
  - when: "The failure is any other enveloped code below status 500."
    answer: "the code, the message and the status shown as a field error in the decision panel"
  - rule: "rules/curation-workspace/leaving-sends-the-pending-decision-at-once"
    answer: "the notice \"Ação comprometida ao sair.\""
- operation: undo-decision
  accepted: "the undo toast shows the caption Item fundido, Lado preferido or Item rejeitado and the whole seconds left as \"Ns\", announced as \"Tempo restante para desfazer: N segundos\", and offers Desfazer"
- operation: read-decision-panel
  accepted: "the labels Fundir neste and Manter separados for an entity match and Preferir este, Manter em disputa and Corrigir… for a dispute; the evidence indicator Ver evidência then Evidência vista; a blocked decision carrying the hint \"Veja a evidência antes de decidir.\"; for a single high-similarity candidate \"Candidato com alta similaridade (≥ 90%): podemos fundir diretamente.\", for several candidates \"Múltiplos candidatos — escolha qual representa a mesma entidade.\", for none \"Nenhum candidato sugerido. Você pode manter separados ou fundir ad-hoc por busca.\"; for a link dispute \"Há N alvos conflitantes para o vínculo <link type>:\" with \"“<link type>” admite apenas um destino vigente por vez, e as vigências abaixo se sobrepõem. Escolha qual vale (os perdedores são arquivados) ou ajuste os períodos para que não se sobreponham.\"; for an attribute dispute \"Há N valores conflitantes para <attribute key>:\" with \"Apenas um valor pode vigorar por vez no mesmo período. Escolha qual vale ou ajuste os períodos.\"; the instruction \"Selecione qual lado prefere.\" in summary and \"Selecione qual lado prefere ou ajuste os períodos.\" otherwise; the period lines \"Lado X: sem datas registradas\", \"Lado X: vigente de <from> em diante\", \"Lado X: vigente até <to>\" and \"Lado X: vigente de <from> a <to>\"; the basis labels Declarada, Doc. and Receb.; and, for a stale item, \"Este item mudou desde que você o abriu.\" with Recarregar"
  refusals:
  - rule: "rules/curation-workspace/blank-reason-blocks-a-destructive-decision"
    answer: "\"Informe um motivo para continuar.\" under the reason field"
  - rule: "rules/curation-workspace/self-merge-refusal-shows-the-fixed-text"
    answer: "the fixed alert \"Não é possível fundir um nó com ele mesmo.\""
- operation: correct-item
  accepted: "the date justification bases Declarada no fragmento (\"A própria fonte diz a data — selecione o fragmento.\"), Data do documento (\"Derivada da data do documento de origem.\") and Data de recebimento (\"Quando o sistema recebeu a informação.\")"
  refusals:
  - rule: "rules/curation-workspace/attribute-correction-needs-a-value"
    answer: "the message \"Informe o valor corrigido.\" on the value field"
  - rule: "rules/curation-workspace/link-correction-needs-a-target"
    answer: "the message \"Selecione o nó-alvo da fusão.\" on the target field"
  - rule: "rules/curation-workspace/correction-dates-have-the-iso-shape"
    answer: "the message \"Data inválida. Use o formato AAAA-MM-DD.\" on the date field"
  - rule: "rules/curation-workspace/correction-start-precedes-the-end"
    answer: "the message \"O início deve ser anterior ao fim.\" on the end field"
  - rule: "rules/curation-workspace/stated-basis-needs-a-fragment"
    answer: "the message \"Selecione o fragmento que justifica a data.\" on the fragment field and Salvar correção disabled"
  - rule: "rules/curation-workspace/correction-reason-is-required-and-trimmed"
    answer: "the message \"Informe um motivo para continuar.\" on the reason field"
  - rule: "rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id"
    answer: "the manual fragment-id input with \"Listagem de fragmentos indisponível — informe o id manualmente.\""
  - when: "The server answers BUSINESS_CORRECTION_NO_CHANGES."
    answer: "the fixed message \"Nenhuma alteração detectada. Modifique pelo menos um campo.\" at the top of the form"
  - when: "The server answers BUSINESS_TEMPORAL_INCOHERENT."
    answer: "the server's message on the end-date field"
  - when: "The server answers BUSINESS_DATE_UNJUSTIFIED."
    answer: "the server's message set on the date-basis field, which no element shows"
  - when: "The server answers BUSINESS_FRAGMENT_NOT_ACCEPTED."
    answer: "the server's message under the fragment picker or the manual input, visible only under stated"
  - when: "The server answers BUSINESS_REASON_REQUIRED."
    answer: "the server's message on the reason field"
- operation: show-evidence
  accepted: "each fragment as \"Fragmento · confiança N%\" with its text and, under it, each chunk with its source type label (Documento, E-mail, Reunião, Conversa, Artigo or Transcrição), the received date and \"trecho <start>–<end>\""
  refusals:
  - when: "The provenance is loading."
    answer: "a placeholder labelled \"Carregando evidência\""
  - when: "The source was removed by compliance deletion."
    answer: "\"A fonte original foi excluída por conformidade. Sem proveniência disponível.\" and no viewed signal"
  - when: "The provenance fails to load for any other reason."
    answer: "\"Não foi possível carregar a evidência.\" and no viewed signal"
  - when: "The provenance loads with no fragments."
    answer: "\"Nenhuma proveniência disponível.\""
- operation: use-batch-bar
  accepted: "the count \"N selecionados\" with the actions \"Manter separados N\" for entity matches and \"Confirmar N\" and \"Rejeitar N\" for uncertain items"
  refusals:
  - rule: "rules/curation-workspace/batch-bar-actions-follow-the-kind"
    answer: "for disputed items no action and the note \"Disputas devem ser resolvidas individualmente.\""
  - rule: "rules/curation-workspace/rejecting-five-or-more-asks-first"
    answer: "for five or more items the inline \"Você está rejeitando N itens. Confirmar?\" with Confirmar and Cancelar"
- operation: open-drawer
  accepted: "an overlay titled \"Curadoria\" holding the decision panel for one item"
  refusals:
  - when: "The queue is loading."
    answer: "\"Carregando item de curadoria…\""
  - when: "The queue read fails."
    answer: "the inline alert \"Não foi possível carregar a evidência.\" with the link \"Abrir na fila de curadoria\""
  - when: "The item is not in the queue listing."
    answer: "the inline alert \"Este item não está mais disponível na fila.\" with the link \"Abrir na fila de curadoria\""
---

## Description

What the owner reads and can do on the curation screen.
The queue column lists the entries and the decision column holds the panel for the selected one.
