// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { AppShell } from "../AppShell";

describe("AppShell", () => {
  it("renders the 3-region layout: header (z-frame fixed), workspace (z-base scrollable), footer (z-frame fixed), and AmbientBackdrop (z-backdrop)", () => {
    const html = renderToString(
      <AppShell>
        <div data-testid="content">hello</div>
      </AppShell>,
    );

    // Backdrop region — fixed inset-0 z-backdrop
    expect(html).toContain('data-testid="ambient-backdrop"');
    expect(html).toMatch(/class="[^"]*\bz-backdrop\b/);

    // Header — banner role + fixed top-0 + z-frame
    expect(html).toContain('role="banner"');
    expect(html).toContain('aria-label="Cabeçalho"');
    expect(html).toMatch(/class="[^"]*\bz-frame\b/);

    // Footer — contentinfo role + fixed bottom-0 + z-frame
    expect(html).toContain('role="contentinfo"');
    expect(html).toContain('aria-label="Rodapé"');

    // Workspace — only region that scrolls (overflow-y-auto), pt-12 pb-8 reserves
    // the fixed header/footer.
    expect(html).toContain('data-testid="app-workspace"');
    expect(html).toMatch(/class="[^"]*\bz-base\b/);
    expect(html).toMatch(/class="[^"]*\boverflow-y-auto\b/);
    expect(html).toMatch(/class="[^"]*\bpt-12\b/);
    expect(html).toMatch(/class="[^"]*\bpb-8\b/);

    // The child renders inside the workspace.
    expect(html).toContain('data-testid="content"');
    expect(html).toContain("hello");
  });

  it("header and footer use the canonical GlassSurface ambient composition", () => {
    const html = renderToString(<AppShell>x</AppShell>);
    // GlassSurface level="ambient" composes the canonical class list per
    // GlassSurface.component.spec.md §6.1.
    expect(html).toContain("bg-surface-glass-ambient");
    expect(html).toContain("backdrop-blur-glass-sm");
    expect(html).toContain("border-border-glass");
    expect(html).toContain("shadow-sm");
    expect(html).toContain("rounded-none");
  });
});
