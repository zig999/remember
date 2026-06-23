// Chat system prompt — version v3 (BR-18 v3, chat.back.md v2.5).
//
// v3 is the first ontology-aware chat prompt. It extends v2 (which itself
// extends v1) with three new blocks rendered from the boot-time
// `CatalogSnapshot` (BR-18 v3):
//
//   - Block 4A ONTOLOGY — a compact catalog dump (NodeType / LinkType /
//     AttributeKey canonical names + descriptions + LinkType rule pairs)
//     rendered DETERMINISTICALLY from the catalog argument. Same snapshot
//     reference -> byte-identical output, which is the precondition for the
//     Anthropic `cache_control` prefix to stay valid across turns (P0 prompt-
//     caching invariant from the `llm-cost-audit` memory).
//   - Block 4B SEARCH DISCIPLINE — explicit directives the model MUST follow:
//     `search` is lexical AND (one specific name per call, never concatenate
//     multiple proper nouns); `list_nodes` MUST carry a `node_type` filter
//     when used as category enumeration; `list_node_types` /
//     `list_link_types` / `list_attribute_keys` are the discovery primitives.
//   - Block 4C POST-INGESTION PLAYBOOK — explicit recipe for "show what was
//     ingested" after `get_ingestion_status` returns `completed`. The model
//     MUST consult `result.affected_nodes` FIRST (TC-5 propagation, BR-43 /
//     BR-45 amendments) and do direct `get_node` / `traverse` lookups; the
//     `search` / `list_nodes(node_type=...)` path is the fallback when
//     `affected_nodes` is empty or absent; an unfiltered `list_nodes(limit:30)`
//     used as "what was ingested" is forbidden.
//
// The renderer NEVER hardcodes a type name. The catalog grows by additive
// migration + BFF restart (see `ontology-extension-playbook` memory); the
// rendered block reflects whatever the database has at boot.
//
// Marker token is REUSED VERBATIM from v1 (BR-20 stable across versions —
// `output-guard.ts` scrubs against the single canary regardless of which
// prompt module the env selected).
//
// Cache-control invariant (chat.back.md §12 v2.5):
//   - All static prose lives in module-scope constants (no `Date.now()`, no
//     random ids, no per-call closures).
//   - The dynamic ontology block iterates the catalog Maps in INSERTION ORDER
//     (which `loadCatalog` populates from the SQL row order — stable for the
//     process lifetime since the catalog mutates only via migration + restart).
//     Sorting alphabetically would be safer in principle, but would also be
//     a deviation from the existing graph-normalizer's iteration discipline
//     and would force a fixture re-baseline for every cache-related test.
//     The insertion-order contract is documented in `catalog.ts`.
//
// References:
//   - chat.back.md §3 BR-18 v3 (signature widening, blocks 4A/4B/4C).
//   - chat.back.md §3 BR-20 (marker token stable across versions).
//   - chat.back.md §1 (cache-control invariant; ontology snapshot boot-time
//     stable; v2.5 known constraints).
//   - chat.back.md §1 Testing rows xix–xxiii (regression contract).
//
// v1 and v2 are preserved verbatim — `CHAT_PROMPT_VERSION=v1|v2` continues to
// resolve through `prompts/index.ts` (BR-18 v3 backward-compat).

import type { CatalogSnapshot } from "../../knowledge-graph/catalog/catalog.js";
import { system as v2System } from "./v2.js";

/** Stable module identifier (parallel to ingestion's `PROMPT_VERSION`). */
export const PROMPT_VERSION = "v3" as const;

/**
 * Re-export of v1's marker token. BR-20 keeps the marker STABLE across prompt
 * versions so the output guard never needs a per-version code path. Exporting
 * it from v3 as a named constant lets callers that pin to v3 import the marker
 * without reaching into v1 — but the value MUST equal `CHAT_PROMPT_MARKER_V1`.
 */
export { CHAT_PROMPT_MARKER_V1 } from "./v1.js";

// ---------------------------------------------------------------------------
// Static prose — module-scope constants
// ---------------------------------------------------------------------------
//
// Block 4B (search discipline) and Block 4C (post-ingestion playbook) are
// fully static. They MUST be exact pt-BR strings because the regression tests
// (xx / xxi) regex-match them. Any change to phrasing is a deliberate spec
// change — review against chat.back.md §3 BR-18 v3 first.

const BLOCK_4B_SEARCH_DISCIPLINE: string = [
  "",
  "DISCIPLINA DE BUSCA",
  "1. A ferramenta `search` e LEXICA E TEM SEMANTICA `AND` sobre o texto",
  "   completo de UM mesmo no. Buscar UM NOME ESPECIFICO POR CHAMADA.",
  "   NUNCA concatene varios nomes proprios numa unica chamada `search`",
  "   (ex.: `search('Rodrigo Maria Joao')`) — quando os nomes vivem em nos",
  "   distintos o resultado e SEMPRE zero acertos, e voce nao vai notar.",
  "2. `list_nodes` DEVE ser chamada COM um filtro `node_type` quando voce",
  "   precisa enumerar uma categoria (\"o que existe em X\"). NUNCA use",
  "   `list_nodes` SEM `node_type` para responder \"o que foi ingerido\"",
  "   ou \"o que o banco tem sobre X\" — a primeira linha de uma listagem",
  "   sem filtro pode pertencer a um subgrafo completamente diferente.",
  "3. Quando o bloco de ontologia acima nao tiver detalhe suficiente",
  "   (ex.: voce precisa do `value_type` exaustivo de um AttributeKey, de",
  "   exemplos, ou de restricoes), use `list_node_types`, `list_link_types`",
  "   e `list_attribute_keys` como primitivas de descoberta. O bloco de",
  "   ontologia e um catalogo inicial, nao o schema completo.",
].join("\n");

const BLOCK_4C_POST_INGESTION_PLAYBOOK: string = [
  "",
  "PLAYBOOK POS-INGESTAO",
  "Apos `start_async_ingestion`, informe ao dono que a ingestao foi iniciada",
  "(directive v2 preservada). Quando o dono pedir o resultado, siga ESTE",
  "playbook ANTES de responder:",
  "",
  "1. Chame `get_ingestion_status` UMA UNICA VEZ para confirmar que a",
  "   ingestao alcancou `status: \"completed\"`. Se ainda estiver em",
  "   `running`, informe e PARE — nao tente descrever o que foi ingerido.",
  "2. Quando `status === \"completed\"`, ANTES de qualquer outra ferramenta,",
  "   leia o campo `result.affected_nodes` (TC-5 — array de",
  "   `{id, canonical_name, node_type}`). Esse campo e a PRIMEIRA via de",
  "   consulta apos `get_ingestion_status` retornar `completed`:",
  "   a. Quando `affected_nodes` estiver presente e nao-vazio, use os ids",
  "      diretamente em `get_node(id)` e/ou `traverse(start_node_id=id,",
  "      depth=2)`. Descreva APENAS o que essas chamadas retornaram.",
  "   b. Quando `affected_nodes` estiver ausente ou vazio (runs antigos,",
  "      status nao completado, caminho degradado), recue para UM",
  "      `search` por nome proprio mencionado pelo dono, OU",
  "      `list_nodes(node_type=<tipo plausivel>)` ESCOLHIDO no bloco de",
  "      ontologia. NUNCA uma busca multi-nome concatenada (bloco 4B",
  "      directive 1). NUNCA um `list_nodes` sem `node_type` (bloco 4B",
  "      directive 2).",
  "3. Cite a fonte: o campo `raw_information_id` retornado por",
  "   `get_ingestion_status` identifica o documento ingerido — mencione-o",
  "   ao dono.",
  "4. NUNCA apresente a primeira linha de um `list_nodes` sem filtro como",
  "   resposta para \"o que foi ingerido\" — essa linha pode pertencer a",
  "   um documento completamente nao relacionado. Em caso de duvida,",
  "   recuse a resposta e replaneje pelos passos 2.a / 2.b.",
].join("\n");

// ---------------------------------------------------------------------------
// Ontology block renderer (Block 4A)
// ---------------------------------------------------------------------------

const ONTOLOGY_HEADER: string = [
  "",
  "ONTOLOGIA (catalogo carregado no boot)",
  "Este e o vocabulario do grafo nesta instalacao. Use estes nomes verbatim",
  "ao chamar `list_nodes(node_type=...)`, `search`, `traverse` e demais",
  "ferramentas. O catalogo cresce por migracao + restart — o que aparece",
  "abaixo e o que existe agora.",
].join("\n");

/**
 * Render the ONTOLOGY block (4A). Deterministic: given the same
 * `CatalogSnapshot` reference, the returned string is byte-identical. The
 * iteration order is the catalog Map insertion order (set by `loadCatalog`'s
 * SQL row order — stable per process; chat.back.md v2.5 §12).
 *
 * Exported for the regression tests (xix) which assert byte-stability and
 * sensitivity to catalog changes.
 */
export function renderOntologyBlock(catalog: CatalogSnapshot): string {
  const parts: string[] = [ONTOLOGY_HEADER, "", "NodeTypes (tipos de no):"];

  for (const nodeType of catalog.nodeTypeByName.values()) {
    parts.push(`- ${nodeType.name}: ${nodeType.description}`);
  }

  parts.push("", "LinkTypes (tipos de relacao):");
  // Pre-index rule pairs per link_type_id so each LinkType lists its valid
  // (source, target) node-type pairs alongside its description.
  const rulePairsByLinkType = new Map<string, string[]>();
  for (const rule of catalog.linkTypeRules) {
    const source = catalog.nodeTypeById.get(rule.source_node_type_id);
    const target = catalog.nodeTypeById.get(rule.target_node_type_id);
    if (source === undefined || target === undefined) {
      continue;
    }
    const pair = `${source.name} -> ${target.name}`;
    const existing = rulePairsByLinkType.get(rule.link_type_id);
    if (existing === undefined) {
      rulePairsByLinkType.set(rule.link_type_id, [pair]);
    } else {
      existing.push(pair);
    }
  }
  for (const linkType of catalog.linkTypeByName.values()) {
    const pairs = rulePairsByLinkType.get(linkType.id) ?? [];
    const pairSuffix = pairs.length > 0 ? ` [${pairs.join("; ")}]` : "";
    parts.push(`- ${linkType.name}: ${linkType.description}${pairSuffix}`);
  }

  parts.push("", "AttributeKeys (atributos literais por NodeType):");
  for (const attr of catalog.attributeKeyById.values()) {
    const owner = catalog.nodeTypeById.get(attr.node_type_id);
    const ownerName = owner !== undefined ? owner.name : "?";
    parts.push(
      `- ${ownerName}.${attr.key} (${attr.value_type}): ${attr.description}`
    );
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build the SYSTEM prompt content for v3. The body is the verbatim v2 prompt
 * (which carries v1's persona + marker + v2's ingestion directives) followed
 * by the three ontology-aware blocks: 4A (rendered from `catalog`), 4B
 * (search discipline), 4C (post-ingestion playbook).
 *
 * Deterministic: `system(sameCatalogRef)` returns byte-identical strings
 * across invocations — the precondition for the Anthropic `cache_control`
 * prefix to stay valid across turns (BR-18 v3 cache-control invariant).
 */
export function system(catalog: CatalogSnapshot): string {
  const v2Body = v2System(catalog);
  const block4A = renderOntologyBlock(catalog);
  return [
    v2Body,
    block4A,
    BLOCK_4B_SEARCH_DISCIPLINE,
    BLOCK_4C_POST_INGESTION_PLAYBOOK,
  ].join("\n");
}
