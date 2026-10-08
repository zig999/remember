import { http } from "@/lib/http";
import { authHeader } from "@/features/curation/api/_request";

export function bearerHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (authHeader().Authorization === undefined) return headers;
  Object.defineProperty(headers, "Authorization", {
    enumerable: true,
    get: () => authHeader().Authorization ?? "",
  });
  return headers;
}

export function entityGet<T>(path: string, signal: AbortSignal): Promise<T> {
  return http<T>(path, { method: "GET", headers: bearerHeaders(), signal });
}
