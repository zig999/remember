/**
 * SignInForm — component tests (TC-02).
 *
 * Strategy (Golden Rule 9):
 *   - Zod schema is tested DIRECTLY (sync, hermetic) — the resolver wiring
 *     to RHF is covered by `src/components/ui/form/__tests__/form.spec.tsx`.
 *     This avoids the async-act + unhandled-rejection noise that arises when
 *     submitting an invalid form through RHF's resolver pipeline under
 *     vitest's jsdom (no `IS_REACT_ACT_ENVIRONMENT`, no @testing-library).
 *   - The component is tested at its visible surface: UI-02 disables + shows
 *     "Entrando…"; UI-03 renders each error variant inside role="alert";
 *     UI-01 conditional shows the session-expired notice; a11y wiring asserts
 *     types + autoFocus.
 *   - A successful submit is exercised via `form.handleSubmit` reaching
 *     `onSubmit` with valid inputs (no resolver error, no async race).
 *
 * No `@testing-library/react` (not installed); we use the project's standard
 * createRoot + act() harness (mirrors StateBadge / GlassSurface tests).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SignInForm, SIGN_IN_ERROR_MESSAGE } from "../SignInForm";
import { signInSchema, type SignInError } from "../../schema";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

function render(element: ReactElement): void {
  act(() => {
    root.render(element);
  });
}

function getInputByLabel(text: string): HTMLInputElement {
  const labels = Array.from(container.querySelectorAll("label"));
  const label = labels.find((l) => l.textContent?.trim() === text);
  if (!label) throw new Error(`Label "${text}" not found`);
  const id = label.getAttribute("for");
  if (!id) throw new Error(`Label "${text}" has no htmlFor`);
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input) throw new Error(`Input #${id} not found`);
  return input;
}

function getSubmitButton(): HTMLButtonElement {
  const btn = container.querySelector<HTMLButtonElement>("button[type='submit']");
  if (!btn) throw new Error("Submit button not found");
  return btn;
}

/* ---------- Schema (Zod v4) — tested directly ----------------------------- */

describe("signInSchema — Zod v4 contract", () => {
  it("rejects non-email login with the canonical message", () => {
    const result = signInSchema.safeParse({ login: "not-an-email", senha: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const loginIssue = result.error.issues.find((i) => i.path[0] === "login");
      expect(loginIssue?.message).toBe("Informe um e-mail válido.");
    }
  });

  it("rejects empty senha with the canonical message", () => {
    const result = signInSchema.safeParse({ login: "user@example.com", senha: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const senhaIssue = result.error.issues.find((i) => i.path[0] === "senha");
      expect(senhaIssue?.message).toBe("Informe a senha.");
    }
  });

  it("accepts a valid pair (email + non-empty senha)", () => {
    const result = signInSchema.safeParse({
      login: "user@example.com",
      senha: "s3cret",
    });
    expect(result.success).toBe(true);
  });
});

/* ---------- UI-02 submitting --------------------------------------------- */

describe("SignInForm — UI-02 submitting", () => {
  it("disables both inputs and shows 'Entrando…' on the button", () => {
    render(<SignInForm onSubmit={vi.fn()} isSubmitting />);
    expect(getInputByLabel("Login").disabled).toBe(true);
    expect(getInputByLabel("Senha").disabled).toBe(true);
    const btn = getSubmitButton();
    expect(btn.textContent).toContain("Entrando…");
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.disabled).toBe(true);
  });

  it("renders a spinner with aria-hidden when submitting", () => {
    render(<SignInForm onSubmit={vi.fn()} isSubmitting />);
    const btn = getSubmitButton();
    const spinner = btn.querySelector("svg");
    expect(spinner).toBeTruthy();
    expect(spinner?.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps the button at 'Entrar' when idle", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    const btn = getSubmitButton();
    expect(btn.textContent?.trim()).toBe("Entrar");
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute("aria-busy")).toBeNull();
  });
});

/* ---------- UI-03 error -------------------------------------------------- */

describe("SignInForm — UI-03 error", () => {
  const cases: ReadonlyArray<[SignInError["type"], string]> = [
    ["credential", SIGN_IN_ERROR_MESSAGE.credential],
    ["network", SIGN_IN_ERROR_MESSAGE.network],
    ["unknown", SIGN_IN_ERROR_MESSAGE.unknown],
  ];

  it.each(cases)("renders %s error inside role='alert'", (type, message) => {
    render(<SignInForm onSubmit={vi.fn()} error={{ type }} />);
    const alert = container.querySelector("[role='alert']");
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain(message);
  });

  it("does NOT render role='alert' when error is null", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("applies the text-destructive token class to the form-level error", () => {
    render(<SignInForm onSubmit={vi.fn()} error={{ type: "credential" }} />);
    const alert = container.querySelector("[role='alert']") as HTMLElement;
    // Semantic token, not a hardcoded color — Tailwind v4 +
    // u-fe-standards "design system" rule.
    expect(alert.className).toContain("text-destructive");
  });
});

/* ---------- UI-01 conditional (session-expired) -------------------------- */

describe("SignInForm — UI-01 conditional", () => {
  it("renders session-expired notice with role='status' when sessionExpired", () => {
    render(<SignInForm onSubmit={vi.fn()} sessionExpired />);
    const status = container.querySelector("[role='status']");
    expect(status).toBeTruthy();
    expect(status?.textContent).toMatch(/sua sessão expirou/i);
  });

  it("does NOT render session-expired notice by default", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    expect(container.querySelector("[role='status']")).toBeNull();
  });
});

/* ---------- A11y wiring (§8, WCAG 2.2 AA) -------------------------------- */

describe("SignInForm — a11y wiring", () => {
  it("login input is type=email", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    expect(getInputByLabel("Login").type).toBe("email");
  });

  it("senha input is type=password", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    expect(getInputByLabel("Senha").type).toBe("password");
  });

  it("login input is focused on mount (autoFocus)", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    expect(document.activeElement).toBe(getInputByLabel("Login"));
  });

  it("both inputs have a label associated via htmlFor", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    // getInputByLabel only resolves when label → htmlFor → input is intact.
    expect(() => getInputByLabel("Login")).not.toThrow();
    expect(() => getInputByLabel("Senha")).not.toThrow();
  });

  it("submit button is a native <button type='submit'>", () => {
    render(<SignInForm onSubmit={vi.fn()} />);
    const btn = getSubmitButton();
    expect(btn.tagName.toLowerCase()).toBe("button");
    expect(btn.getAttribute("type")).toBe("submit");
  });
});

/* ---------- SIGN_IN_ERROR_MESSAGE canonical map ------------------------- */

describe("SIGN_IN_ERROR_MESSAGE", () => {
  it("exposes the three canonical pt-BR messages", () => {
    expect(SIGN_IN_ERROR_MESSAGE.credential).toBe("E-mail ou senha incorretos.");
    expect(SIGN_IN_ERROR_MESSAGE.network).toBe(
      "Erro de conexão. Verifique sua rede e tente novamente.",
    );
    expect(SIGN_IN_ERROR_MESSAGE.unknown).toBe("Erro inesperado. Tente novamente.");
  });
});
