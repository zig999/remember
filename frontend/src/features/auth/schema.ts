/**
 * Auth — Zod v4 schemas (sign-in.feature.spec.md §5).
 *
 * Field names (`login`, `senha`) match the visible UI labels (Login, Senha).
 * `login` is the Stack Auth credential email per D3 — the field is an email
 * input with `z.email()` validation. Custom error messages are user-facing
 * pt-BR strings; the project ships single-locale (CLAUDE.md `i18n: false`).
 *
 * Zod v4 contract:
 *  - `z.email()` is TOP-LEVEL (not `z.string().email()`).
 *  - The string argument to `z.email("...")` is the error message — Zod v4
 *    accepts it as a shorthand for `{ message: "..." }`.
 */
import { z } from "zod";

export const signInSchema = z.object({
  login: z.email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

/** RHF + zodResolver value shape, derived from the schema (front.md Forms §1). */
export type SignInFormValues = z.infer<typeof signInSchema>;

/** Discriminated union of error categories surfaced by the form (UI-03). */
export type SignInError =
  | { type: "credential" }
  | { type: "network" }
  | { type: "unknown" };
