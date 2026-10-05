import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/state/auth";
import { SIGN_IN_ERROR_MESSAGE } from "../components/SignInForm";
import type { SignInError, SignInFormValues } from "../schema";
import { signInWithEmail, fetchAccessToken, AuthError } from "./neon-auth";

export interface UseSignInReturn {
  readonly signIn: (values: SignInFormValues) => Promise<void>;
  readonly isLoading: boolean;
  readonly error: SignInError | null;
  readonly clearError: () => void;
}

function readRedirectParam(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  } catch {
    return null;
  }
}

export function resolveSafeRedirect(candidate: string | null): "/chat" | string {
  if (candidate === null) return "/chat";
  if (candidate.length === 0) return "/chat";
  if (candidate.length > 2048) return "/chat";
  if (!candidate.startsWith("/")) return "/chat";
  if (candidate.startsWith("//")) return "/chat";
  if (candidate.includes("://")) return "/chat";
  if (candidate.includes("\\")) return "/chat";
  return candidate;
}

export function classifySignInError(reason: unknown): SignInError {
  if (reason instanceof AuthError) {
    switch (reason.code) {
      case "INVALID_EMAIL_OR_PASSWORD":
        return { type: "credential" };
      case "NETWORK":
        return { type: "network" };
      case "NO_SESSION":
      case "NO_TOKEN":
        return { type: "session" };
      default:
        return { type: "unknown" };
    }
  }
  if (reason instanceof TypeError) return { type: "network" };
  if (typeof reason === "object" && reason !== null) {
    const msg = (reason as { message?: unknown }).message;
    if (typeof msg === "string") {
      const lower = msg.toLowerCase();
      if (lower.includes("failed to fetch") || lower.includes("network")) {
        return { type: "network" };
      }
    }
  }
  return { type: "unknown" };
}

export function useSignIn(): UseSignInReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SignInError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(
    async (values: SignInFormValues): Promise<void> => {
      setIsLoading(true);
      setError(null);

      let classified: SignInError | null = null;
      try {
        await signInWithEmail(values.login, values.senha);

        const jwt = await fetchAccessToken();

        useAuthStore.getState().setToken(jwt);

        const redirectParam = readRedirectParam();
        const target = resolveSafeRedirect(redirectParam);
        void navigate({ to: target });
      } catch (thrown) {
        classified = classifySignInError(thrown);
      } finally {
        setIsLoading(false);
      }

      if (classified !== null) {
        setError(classified);
        toast.error(SIGN_IN_ERROR_MESSAGE[classified.type]);
      }
    },
    [navigate],
  );

  return { signIn, isLoading, error, clearError };
}
