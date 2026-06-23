// Per-tool `args_summary` builder consumed by the agentic loop dispatcher when
// it yields a `ChatEvent.tool_start` (chat.back.md BR-09). The summary is what
// the SPA renders in the UI to communicate "the assistant just called <tool>
// with these (redacted) arguments". Two contracts apply:
//
//   1. NEVER include raw `value` / `text` column contents or document bodies.
//      The chat surface returns the graph by ID + short labels; document
//      bodies stay behind the provenance tools and are NEVER echoed into a
//      tool_start frame (chat.back.md §3 BR-09 + §9 — args_summary raw values
//      are also forbidden from the pino turn record).
//   2. Bounded length — `<= 200` code points (matches the openapi.yaml
//      ToolStartEvent.args_summary `maxLength: 200` schema, line 489).
//
// Per-tool formats (chat.back.md BR-09, verbatim):
//   - search:                        query="<first 60 chars of query>" (+ optional layers=... expand_depth=<n>)
//   - get_node, traverse:            id=<uuid> (+ depth=<n> for traverse)
//   - get_history_link / _attribute: id=<uuid>
//   - get_history_attribute_key:     node_id=<uuid> key=<key>
//   - list_nodes:                    node_type=<name> limit=<n>
//   - list_node_types/link_types/
//     attribute_keys:                ""  (no args)
//   - get_provenance_*:              id=<uuid>
//   - start_async_ingestion (v2.4):  source_type=<value> content_len=<n>
//   - get_ingestion_status  (v2.4):  llm_run_id=<uuid>
//
// v2.4 redaction invariant (BR-43 step 5 / BR-09): the `args_summary` for
// `start_async_ingestion` MUST NEVER include the raw `content` payload — only
// its code-point length. The audit row (`chat_tool_call.arguments`, BR-32)
// still carries the FULL untruncated content because the Owner accepted that
// chat-side content is auditable; the SSE wire frame surfaces ONLY the length
// so the SPA never re-renders user-pasted documents on the conversation
// transcript view.
//
// Fallback when the input shape is unexpected: `<n keys>` — the dispatcher
// counts top-level keys and emits that string (e.g. `"3 keys"`). The fallback
// also fires for an unknown tool name (defensive; BR-10 guarantees the
// dispatcher itself catches unknown tools, but the summariser is resilient on
// its own so a stray invocation can never throw and crash the loop).

/** Hard cap on the produced string, per openapi.yaml `ToolStartEvent.args_summary.maxLength`. */
export const ARGS_SUMMARY_MAX_CHARS = 200;

/** Per the BR-09 format, only the first 60 chars of a search query are shown. */
const SEARCH_QUERY_MAX_CHARS = 60;

/**
 * Build the `args_summary` string for a given tool invocation.
 *
 * @param toolName  Canonical tool name (one of the 13 in `CHAT_TOOL_NAMES`).
 * @param input     The raw `tool_use.input` object as Anthropic delivered it.
 *                  Treated as `unknown` — the function never trusts the shape
 *                  and falls back to `<n keys>` on any mismatch.
 * @returns A redacted summary, never longer than `ARGS_SUMMARY_MAX_CHARS` Unicode code points.
 */
export function buildArgsSummary(toolName: string, input: unknown): string {
  const summary = formatByTool(toolName, input);
  return clampToMax(summary);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function formatByTool(toolName: string, input: unknown): string {
  // Defensive guard: any non-object input collapses to the fallback. This
  // catches `null` (typeof null === "object" — needs the explicit check),
  // arrays (the dispatcher should only pass objects), and primitives.
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return fallbackSummary(input);
  }
  const obj = input as Record<string, unknown>;

  switch (toolName) {
    case "search": {
      const query = readString(obj, "query");
      if (query === undefined) return fallbackSummary(obj);
      const parts: string[] = [`query="${truncateCodepoints(query, SEARCH_QUERY_MAX_CHARS)}"`];
      const layers = readStringArray(obj, "layers");
      if (layers !== undefined && layers.length > 0) {
        parts.push(`layers=${layers.join(",")}`);
      }
      const expandDepth = readNumber(obj, "expand_depth");
      if (expandDepth !== undefined) {
        parts.push(`expand_depth=${expandDepth}`);
      }
      return parts.join(" ");
    }

    case "get_node": {
      const id = readString(obj, "id");
      if (id === undefined) return fallbackSummary(obj);
      return `id=${id}`;
    }

    case "traverse": {
      const id = readString(obj, "id");
      if (id === undefined) return fallbackSummary(obj);
      const depth = readNumber(obj, "depth");
      if (depth !== undefined) {
        return `id=${id} depth=${depth}`;
      }
      return `id=${id}`;
    }

    case "get_history_link":
    case "get_history_attribute": {
      const id = readString(obj, "id");
      if (id === undefined) return fallbackSummary(obj);
      return `id=${id}`;
    }

    case "get_history_attribute_key": {
      const nodeId = readString(obj, "node_id");
      const key = readString(obj, "key");
      if (nodeId === undefined || key === undefined) return fallbackSummary(obj);
      return `node_id=${nodeId} key=${key}`;
    }

    case "list_nodes": {
      const nodeType = readString(obj, "node_type");
      const limit = readNumber(obj, "limit");
      if (nodeType === undefined || limit === undefined) return fallbackSummary(obj);
      return `node_type=${nodeType} limit=${limit}`;
    }

    case "list_node_types":
    case "list_link_types":
    case "list_attribute_keys":
      return "";

    case "get_provenance_link":
    case "get_provenance_attribute":
    case "get_provenance_fragment": {
      const id = readString(obj, "id");
      if (id === undefined) return fallbackSummary(obj);
      return `id=${id}`;
    }

    // v2.4 ingestion entries (BR-43 step 5 / BR-45 step 5). Content length is
    // computed in Unicode code points (matches the rest of the BFF) so a
    // surrogate-pair-heavy payload does not under-report its size.
    case "start_async_ingestion": {
      const sourceType = readString(obj, "source_type");
      const content = readString(obj, "content");
      if (sourceType === undefined || content === undefined) {
        return fallbackSummary(obj);
      }
      const contentLen = [...content].length;
      return `source_type=${sourceType} content_len=${contentLen}`;
    }

    case "get_ingestion_status": {
      const llmRunId = readString(obj, "llm_run_id");
      if (llmRunId === undefined) return fallbackSummary(obj);
      return `llm_run_id=${llmRunId}`;
    }

    default:
      // Unknown tool name — BR-10 says the dispatcher should already have
      // caught this, but the summariser is independently resilient.
      return fallbackSummary(obj);
  }
}

function fallbackSummary(input: unknown): string {
  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
    return `${Object.keys(input as Record<string, unknown>).length} keys`;
  }
  return "0 keys";
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function readNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function readStringArray(
  obj: Record<string, unknown>,
  key: string
): readonly string[] | undefined {
  const v = obj[key];
  if (!Array.isArray(v)) return undefined;
  return v.every((x) => typeof x === "string") ? (v as string[]) : undefined;
}

/**
 * Truncate by Unicode code points (not UTF-16 code units). The spread operator
 * on a string yields code points (surrogate pairs counted as one), which is
 * the natural unit for "first N chars" of a user-facing summary.
 */
function truncateCodepoints(s: string, max: number): string {
  const codepoints = [...s];
  if (codepoints.length <= max) return s;
  return codepoints.slice(0, max).join("");
}

/**
 * Final clamp: if a perfectly-formatted summary still exceeds the hard cap
 * (e.g. an unusually long UUID list in a future tool), trim to the maximum.
 * No marker is appended here — the SPA UI is the consumer; this is cosmetic.
 */
function clampToMax(s: string): string {
  const codepoints = [...s];
  if (codepoints.length <= ARGS_SUMMARY_MAX_CHARS) return s;
  return codepoints.slice(0, ARGS_SUMMARY_MAX_CHARS).join("");
}
