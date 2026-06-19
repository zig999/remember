/**
 * Shell status hooks — live data for the footer (frontend-analise-funcional.md §2).
 *
 * Direct fetch (NOT lib/http): `/health` and `/api/v1/curation/queue` return
 * their payload RAW (not the `{ ok, result }` envelope), so the envelope parser
 * doesn't apply. We read defensively (`result?.x ?? x`) in case a route is
 * enveloped later. `/health` is public; the curation queue needs the Neon Auth
 * JWT (read from the auth store).
 *
 * Active ingestion run: there is no plain REST list endpoint yet — only the MCP
 * tools `get_ingestion_status` / `list_recent_ingestions`. `useActiveRun`
 * returns null until a runs-list read exists; the footer simply hides the
 * segment (Phase 2b scope note).
 */
import { useQuery } from "@tanstack/react-query";
import { getEnv } from "@/lib/env";
import { useAuthStore } from "@/state/auth";
import type { HealthStatus } from "@/shell/Footer";

const REFETCH_MS = 20_000;

async function getJson(path: string, token?: string | null): Promise<unknown> {
  const { VITE_BFF_URL } = getEnv();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${VITE_BFF_URL}${path}`, { headers });
  return res.json().catch(() => null);
}

/** ● System health from `GET /health` (database reachable?). */
export function useHealth(): HealthStatus {
  const q = useQuery({
    queryKey: ["shell", "health"],
    queryFn: () => getJson("/health"),
    refetchInterval: REFETCH_MS,
    retry: false,
  });
  if (q.data == null) return "checking";
  const d = q.data as { database?: string; result?: { database?: string } };
  return (d.database ?? d.result?.database) === "ok" ? "ok" : "down";
}

/** ⚖ Pending curation total (entity_match + disputed) from `GET /api/v1/curation/queue`. */
export function useCurationCount(): number {
  const token = useAuthStore((s) => s.accessToken);
  const q = useQuery({
    queryKey: ["shell", "curation-count"],
    queryFn: () => getJson("/api/v1/curation/queue?limit=1", token),
    refetchInterval: REFETCH_MS,
    retry: false,
    enabled: token != null,
  });
  const d = q.data as { total?: number; result?: { total?: number } } | null | undefined;
  return d?.total ?? d?.result?.total ?? 0;
}

/** ⊕ Active ingestion run — no REST list endpoint yet (MCP-only). */
export function useActiveRun(): { label: string } | null {
  return null;
}
