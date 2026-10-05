import { useAuthStore } from "@/state/auth";

export function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token !== null ? { Authorization: `Bearer ${token}` } : {};
}
