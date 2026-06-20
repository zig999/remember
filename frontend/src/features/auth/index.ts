/**
 * auth — feature public surface (TC-03).
 *
 * The feature owns sign-in: the Zod schema, the form + panel components, the
 * Stack Auth singleton, and the `useSignIn` mutation hook. Consumers (router
 * components, tests) import from this barrel instead of reaching into the
 * feature's internal layout.
 *
 * Single re-export surface — `export * from` is the stack convention for
 * per-feature index files (CLAUDE.md "feature-based" folder rule).
 */
export { signInSchema } from "./schema";
export type { SignInError, SignInFormValues } from "./schema";
export { SignInPanel } from "./components/SignInPanel";
export type { SignInPanelProps } from "./components/SignInPanel";
export { SignInForm, SIGN_IN_ERROR_MESSAGE } from "./components/SignInForm";
export type { SignInFormProps } from "./components/SignInForm";
export { useSignIn, resolveSafeRedirect, classifySignInError } from "./api/useSignIn";
export type { UseSignInReturn } from "./api/useSignIn";
export { getStackApp } from "./lib/stack-app";
export type { StackApp } from "./lib/stack-app";
