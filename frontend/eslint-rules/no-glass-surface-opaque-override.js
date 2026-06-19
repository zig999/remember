/**
 * no-glass-surface-opaque-override — custom ESLint rule (TC-06 stub).
 *
 * Source: docs/specs/front/components/GlassSurface.component.spec.md §11.2.
 *
 * Flags `<GlassSurface className="…">` whose className literal contains a
 * non-glass `bg-*` token (`bg-primary`, `bg-surface`, `bg-elevated`,
 * `bg-action`, `bg-data`, `bg-warning`, `bg-danger`), because such overrides
 * defeat the glass effect via `tailwind-merge` (the consumer's opaque
 * background replaces `bg-surface-glass-<level>`, and the rendered surface
 * stops being a glass surface).
 *
 * Scope (stub): static string literal in the `className` attribute. Template
 * literals and dynamic expressions (`cn(...)`, conditionals) are
 * intentionally out of scope for the stub — covering those is follow-up
 * work and would require either token-scanning of inferred string values or
 * a runtime gate. See spec §11.2: "the custom ESLint rule can be a minimal
 * stub that flags the pattern — full implementation is follow-up work".
 *
 * The rule is registered with ESLint as a "local" rule via the legacy
 * `rulePaths` (`.eslintrc`) flow, or as a flat-config `plugins.local` in the
 * future. The frontend `eslint.config.js` does NOT yet load this rule;
 * wiring is deferred to follow-up TC since the project uses a flat config
 * and local rule loading needs a small plugin wrapper.
 */

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow non-glass bg-* tokens on <GlassSurface className>; opaque overrides defeat the glass effect (spec §11.2).",
      recommended: false,
    },
    schema: [],
    messages: {
      opaqueOverride:
        "GlassSurface className must not include an opaque bg-* token ({{token}}); the consumer should use a plain <div> instead of GlassSurface when opaque is required.",
    },
  },

  create(context) {
    // Closed set of opaque bg tokens that defeat the glass effect (spec §11.2).
    const FORBIDDEN = new Set([
      "bg-primary",
      "bg-surface",
      "bg-elevated",
      "bg-action",
      "bg-data",
      "bg-warning",
      "bg-danger",
    ]);

    function checkClassNameString(value, node) {
      // Tokenise by whitespace — Tailwind class names never contain spaces.
      const tokens = String(value).split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        if (FORBIDDEN.has(token)) {
          context.report({
            node,
            messageId: "opaqueOverride",
            data: { token },
          });
          // Report once per className attribute to avoid noise.
          return;
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (!node.parent || node.parent.type !== "JSXOpeningElement") return;
        const opening = node.parent;
        // Only flag <GlassSurface ... className="...">.
        if (
          opening.name.type !== "JSXIdentifier" ||
          opening.name.name !== "GlassSurface"
        ) {
          return;
        }
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "className") {
          return;
        }
        // Stub scope: only handle static string literal attribute values.
        // <GlassSurface className="bg-surface" />
        if (node.value && node.value.type === "Literal") {
          checkClassNameString(node.value.value, node);
          return;
        }
        // <GlassSurface className={"bg-surface"} />
        if (
          node.value &&
          node.value.type === "JSXExpressionContainer" &&
          node.value.expression.type === "Literal"
        ) {
          checkClassNameString(node.value.expression.value, node);
        }
      },
    };
  },
};

export default rule;
