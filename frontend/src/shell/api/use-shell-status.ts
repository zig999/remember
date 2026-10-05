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

export function useActiveRun(): { label: string } | null {
  return null;
}
