# Sistema de Segundo Cérebro Baseado em Grafo de Conhecimento

Este arquivo contém o resumo da modelagem discutida.

## Objetivo

Receber informações não estruturadas (PDFs, e-mails, atas, artigos, transcrições etc.), preservar o conteúdo original, extrair conhecimento estruturado, relacionar conceitos e manter histórico temporal das mudanças.

## Arquitetura

LLM -> MCP Server -> Backend Node.js/TypeScript -> Banco de Dados

A LLM nunca acessa diretamente o banco de dados.

## Entidades Principais

### RawInformation
Informação original recebida.

### InformationFragment
Fragmentos extraídos pela LLM.

### KnowledgeNode
Conceitos consolidados da base de conhecimento.

### NodeType
Categorias dos nós.

### KnowledgeLink
Relacionamentos entre nós.

### LinkType
Tipos de relacionamento.

### LinkTypeRule
Regras que definem quais tipos de nós podem ser ligados.

### LLMRun
Execuções da LLM.

### ToolCall
Chamadas de ferramentas realizadas pela LLM.

## Temporalidade

Informações não são sobrescritas.
Relacionamentos possuem validade temporal:

- valid_from
- valid_to
- is_current

Exemplo:
Projeto Apollo → deadline → 30/06/2026

Posteriormente:

Projeto Apollo → deadline → 15/07/2026

O relacionamento anterior é encerrado e o novo passa a ser o atual.

## Validação de Relacionamentos

As regras ficam em LinkTypeRule.

Exemplo:

Permitido:
- Project → has_deadline → Date
- Person → participates_in → Project

Não permitido:
- Date → participates_in → Person

## Princípios

1. A informação original nunca é perdida.
2. A LLM sugere.
3. O backend valida.
4. O banco persiste.
5. Todo conceito relevante é um KnowledgeNode.
6. Toda relação relevante é um KnowledgeLink.
7. Toda informação mutável é temporal.
8. Todo conhecimento deve ser rastreável até sua origem.
