import { useQuery } from "@tanstack/react-query";
import { getEnv } from "@/lib/env";
import { fetchAccessToken } from "@/features/auth/api/neon-auth";
import { useAuthStore } from "@/state/auth";
import type { HealthStatus } from "@/shell/Footer";

const REFETCH_MS = 20_000;

const PENDING_PATH = "/api/v1/curation/queue?limit=1";

function send(path: string, token?: string | null): Promise<Response> {
  const { VITE_BFF_URL } = getEnv();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${VITE_BFF_URL}${path}`, { headers });
}

function readBody(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

async function getJson(path: string): Promise<unknown> {
  return readBody(await send(path));
}

async function renewToken(): Promise<string | null> {
  try {
    const fresh = await fetchAccessToken();
    useAuthStore.getState().setToken(fresh);
    return fresh;
  } catch {
    return null;
  }
}

async function getPendingJson(token: string): Promise<unknown> {
  const res = await send(PENDING_PATH, token);
  if (res.status !== 401) return readBody(res);
  const fresh = await renewToken();
  if (fresh === null) return readBody(res);
  return readBody(await send(PENDING_PATH, fresh));
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
    queryFn: () => getPendingJson(token as string),
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
