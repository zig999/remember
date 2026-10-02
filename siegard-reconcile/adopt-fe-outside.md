---
contract_version: siegard-reconcile/8
title: Adoption of the frontend files outside the domain
summary: The frontend's configuration, tooling and build files are kept outside the judgment and src/lib/cn.ts
  is adopted as it stands; the source did not change.
target: frontend
files:
- path: src/lib/cn.ts
  change: Merges class names with the project's token scales.
nodes: []
unstated:
- file: src/lib/cn.ts
  where: the extendTailwindMerge call, lines 21-68 (the rounded, font-size, p/m/gap class groups)
  evidence: 'rounded: [{ rounded: ["sm", "md", "lg", "xl", "pill"] }],

    "font-size": [{ text: ["display", "heading", "subheading", "body-lg", "body-sm", "label", "caption",
    "code"] }],

    p: [{ p: ["xs", "sm", "md", "lg", "xl", "2xl"] }],'
  cost: 'The project''s design-token vocabulary is declared as code here: five radius names, eight type-scale
    names and six spacing names. No node in the specification holds it. A reader who looks in the specification
    for the token names finds nothing. The next reader has to open this file to learn which names exist.
    The comment says the list must be kept "in lock-step with theme.css". The specification has no node
    that reaches this file when the tokens change. The mirroring is therefore held only by that comment.'
unbound:
- src/lib/cn.ts
adopted: true
outside:
- .env.example
- .gitignore
- .storybook/decorators/withAmbientBackdrop.tsx
- .storybook/decorators/withQueryClient.tsx
- .storybook/decorators/withRouter.tsx
- .storybook/main.ts
- .storybook/preview.tsx
- .storybook/vitest.setup.ts
- docs/migration/ui-kit-adoption-plan.md
- eslint-rules/no-glass-surface-opaque-override.js
- eslint.config.js
- index.html
- package-lock.json
- package.json
- playwright.config.ts
- postcss.config.js
- public/backdrop/cityscape-dusk.png
- src/features/graph/.gitkeep
- src/features/history/.gitkeep
- src/features/ingest/.gitkeep
- src/features/search/.gitkeep
- src/main.tsx
- src/vite-env.d.ts
- tsconfig.json
- tsconfig.vendor.json
- vite.config.ts
- vitest.config.ts
- vitest.setup.ts
unheld:
- node: domain/application-shell/application-shell
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 1 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-fe-outside.returns/.

  Staged as an adoption of source no delivery wrote: 1 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact; 28 file(s) were kept outside the
  judgment, listed under `outside`.

  Candidates: 0 opened across 0 of 1 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-fe-outside.returns/`, which are the evidence behind every entry above.
