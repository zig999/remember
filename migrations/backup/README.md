# migrations/backup — snapshot estrutural do banco (medida de segurança)

Contém um **dump SCHEMA-ONLY (DDL)** extraído do banco Neon vivo: toda a
estrutura necessária para recriar o banco — extensões, tipos/enums, funções,
tabelas, colunas (incl. geradas), chaves (PK/FK), constraints (CHECK/UNIQUE),
índices (incl. parciais), triggers, views e sequences. **Sem dados** (zero PII).

## Arquivos

- `schema.sql` — o snapshot DDL mais recente (sobrescrito a cada execução; é
  git-diffável, então o histórico do git mostra a evolução do schema).
- `dump-schema.sh` — gerador. Lê `DATABASE_URL` de `backend/.env`.

## Como gerar / atualizar

```bash
bash migrations/backup/dump-schema.sh
```

Requer `pg_dump >= 18` (o servidor Neon roda PostgreSQL 18.x). Se não estiver
instalado, o script imprime o comando de instalação do `postgresql-client-18`.

## Relação com as migrations

- `migrations/*.sql` (raiz) = **estrutura** versionada (a fonte para aplicar mudanças).
- `migrations/seeds/*.sql` = **dados de catálogo** (ontologia §15).
- `migrations/backup/schema.sql` = **snapshot** do estado real do banco num ponto
  no tempo (não é aplicado em sequência — é a "foto de segurança").

Para **recriar um banco funcional**: aplicar `schema.sql` + os arquivos de
`migrations/seeds/`.

## Segurança

`schema.sql` é seguro para versionar — contém só estrutura, nenhum dado de
usuário. Um backup COM dados (`pg_dump` sem `--schema-only`) conteria PII e
**não deve** ser commitado no repositório (CLAUDE.md — Security).
