import { useMemo, type ReactElement } from "react";
import { SignInPanel } from "@/features/auth/components/SignInPanel";
import { useSignIn } from "@/features/auth/api/useSignIn";

function readSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("reason") === "session_expired";
  } catch {
    return false;
  }
}

export function SignInPage(): ReactElement {
  const { signIn, isLoading, error } = useSignIn();
  const sessionExpired = useMemo(readSessionExpired, []);

  return (
    <SignInPanel
      onSubmit={signIn}
      isSubmitting={isLoading}
      error={error}
      sessionExpired={sessionExpired}
    />
  );
}
