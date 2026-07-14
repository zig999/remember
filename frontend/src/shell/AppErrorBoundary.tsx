/**
 * AppErrorBoundary — single root error boundary wrapping the router outlet.
 *
 * Spec references:
 *  - front.md §5.1 (single boundary wraps __root; header/footer stay visible)
 *  - front.back.md BR-12 (single AppErrorBoundary mounted in __root)
 *
 * Behaviour:
 *  - Catches render-time errors in the workspace; preserves the 3-region
 *    frame (header + footer stay visible because they live OUTSIDE the
 *    boundary's children — see __root.tsx composition).
 *  - Fallback: in-frame message + Reload action.
 *  - All thrown errors are forwarded to `reportError` (dev: console, prod:
 *    stub — front.back.md §7 item 6).
 *
 * Note: React's Error Boundary contract is class-based — no functional
 * replacement exists. We accept the `extends` here and use `override` per
 * the project's `noImplicitOverride` TS flag.
 */

import { Component, type ReactNode, type ErrorInfo } from "react";
import { reportError } from "@/lib/report-error";

export interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Optional override of the fallback UI. */
  fallback?: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, {
      source: "AppErrorBoundary",
      extra: { componentStack: info.componentStack ?? null },
    });
  }

  private readonly handleReload = (): void => {
    if (typeof window !== "undefined") window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen flex-col items-center justify-center gap-md px-lg text-foreground"
          data-testid="app-error-fallback"
        >
          <h1 className="text-lg font-semibold tracking-tight">Algo deu errado.</h1>
          <p className="text-body text-body">
            A página não pôde ser renderizada. Recarregue para tentar novamente.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md border border-border-focus bg-primary px-lg py-sm text-content-fg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
