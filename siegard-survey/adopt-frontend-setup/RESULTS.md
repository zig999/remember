# Adoção do frontend — configuração e consolidação

Início: 2026-10-02T10:00:39-03:00

## Etapa 0 — Pré-condições

T0.1 (saídas verbatim):

```
"version": "5.2.0"
git status --porcelain: (vazio)
specification sound: 92 element(s), 532 rule(s), 10 scenario(s), 6 contract(s), 39 constraint(s) across 2 context(s); 241 decision(s) disclosed, 2 location(s) retired
project.py: targets backend e database; tests backend: under src, suffix .spec.ts, nested; under src, suffix .test.ts, nested
```

T0.2 — classificação de todo arquivo rastreado de `frontend/` que não está em `src/features`:

| caminho | classe |
|---|---|
| `src/**/*.spec.ts`, `*.spec.tsx`, `*.test.ts`, `*.stories.tsx` | teste |
| `src/features/curation/api/__tests__/handlers.ts` | teste (fixture MSW, sem sufixo de teste) |
| `e2e/graph-reveal.e2e.spec.ts` | teste |
| `src/features/{auth,ingest,curation,chat,graph}/` (não-teste) | fonte do contexto homônimo |
| `src/features/{history,search}/` (1 arquivo vazio cada) | outside (contexto shared) |
| `src/lib/`, `src/shell/`, `src/router/`, `src/state/`, `src/components/{ds,ui}/`, `src/styles/` (não-teste) | fonte do contexto shared |
| `src/presentation/*.stories.tsx` | teste (stories) |
| `src/main.tsx`, `src/vite-env.d.ts` | outside |
| `.storybook/**`, `eslint-rules/**`, `docs/**`, `public/**` | outside |
| `.env.example`, `.gitignore`, `eslint.config.js`, `index.html`, `package.json`, `package-lock.json`, `playwright.config.ts`, `postcss.config.js`, `tsconfig.json`, `tsconfig.vendor.json`, `vite.config.ts`, `vitest.config.ts`, `vitest.setup.ts` | outside (configuração) |
| `vendor/ui-kit` (gitlink) | outside (submódulo de outro repositório) |
