/**
 * SignInForm — RHF + Zod v4 sign-in form (TC-02).
 *
 * Canonical spec:
 *  - docs/specs/front/features/sign-in.feature.spec.md §2 (UI-01..04),
 *    §5 (validations), §8 (accessibility), §9 (BDD).
 *  - temp/login-screen-plan.md §6 (panel + form layout).
 *
 * What this component is NOT (TC-02 scope):
 *  - It does NOT call Stack Auth. The mutation lives in `useSignIn` (TC-03),
 *    which provides `onSubmit`, `isSubmitting` and `error` to this component.
 *    This keeps the form unit-testable without mocking the SDK and lets the
 *    spec-level a11y wiring be verified hermetically.
 *  - It does NOT navigate or persist tokens — those are the UI-04 (success)
 *    side effects, owned by `useSignIn` / the consumer.
 *
 * Accessibility (§8, WCAG 2.2 AA — all enforced here):
 *  - Visible `<label htmlFor>` on both inputs (no aria-label shortcut).
 *  - `aria-invalid` flipped via the `Input invalid` prop on field error.
 *  - `aria-describedby` linking the input to the error message (delegated to
 *    `FormControl` from the shared form layer, which mints stable ids).
 *  - Form-level credential/network/unknown error renders with `role="alert"`
 *    so screen readers announce it immediately.
 *  - Session-expired notice renders with `role="status"` (informational, not
 *    urgent).
 *  - The `Loader2` spinner inside the loading button is rendered by the
 *    shared `Button` component with `aria-hidden="true"`; the button text
 *    changes to "Entrando…" so the state change is announced.
 *  - `autoFocus` on the `login` input on mount (§8 "Focus on mount").
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInSchema, type SignInError, type SignInFormValues } from "../schema";

/**
 * Map a `SignInError` discriminant to its user-facing pt-BR message
 * (sign-in.feature.spec.md §6). Defined as a frozen record so the test suite
 * can enumerate it and the consumer (TC-03 mutation) can rely on the same
 * key set when classifying SDK exceptions.
 */
const SIGN_IN_ERROR_MESSAGE: Readonly<Record<SignInError["type"], string>> = {
  credential: "E-mail ou senha incorretos.",
  network: "Erro de conexão. Verifique sua rede e tente novamente.",
  session: "Erro ao obter sessão. Tente novamente.",
  unknown: "Erro inesperado. Tente novamente.",
};

export interface SignInFormProps {
  /** Submission handler. TC-03 wires the real Stack Auth mutation here. */
  onSubmit: (values: SignInFormValues) => Promise<void> | void;
  /** UI-02 gate — disables fields, swaps the button to its loading state. */
  isSubmitting?: boolean;
  /** UI-03 gate — renders the form-level alert with the mapped message. */
  error?: SignInError | null;
  /** UI-01 conditional — renders the session-expired info notice. */
  sessionExpired?: boolean;
  /** Forwarded to the root `<form>` for layout overrides by the parent panel. */
  className?: string;
}

export function SignInForm({
  onSubmit,
  isSubmitting = false,
  error = null,
  sessionExpired = false,
  className,
}: SignInFormProps) {
  // Validation on submit (and on blur after first touch per §5) — RHF's
  // default `mode: "onSubmit"` plus `reValidateMode: "onBlur"` matches the
  // §5 "blur after first touch + submit" UX rule.
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: { login: "", senha: "" },
  });

  const formLevelError = error ? SIGN_IN_ERROR_MESSAGE[error.type] : null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        // `noValidate` defers required/format to Zod (browser-native UI is
        // not accessible-consistent with our error message wiring).
        noValidate
        className={cn("flex flex-col gap-md", className)}
      >
        {sessionExpired ? (
          <div
            role="status"
            data-testid="session-expired-notice"
            className="text-body-sm text-body"
          >
            Sua sessão expirou. Faça login novamente.
          </div>
        ) : null}

        <FormField
          control={form.control}
          name="login"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Login</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="senha"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {formLevelError ? (
          <div
            role="alert"
            data-testid="sign-in-form-error"
            className="text-body-sm text-danger"
          >
            {formLevelError}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="default"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </Form>
  );
}

/**
 * Re-export the error-message map so the mutation hook (TC-03) and tests can
 * reference the same canonical strings without re-typing them.
 */
export { SIGN_IN_ERROR_MESSAGE };
