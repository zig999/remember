import { z } from "zod";

export const signInSchema = z.object({
  login: z.email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export type SignInError =
  | { type: "credential" }
  | { type: "network" }
  | { type: "session" }
  | { type: "unknown" };
