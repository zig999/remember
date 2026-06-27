#!/usr/bin/env bash
# migrations/backup/dump-schema.sh
# ----------------------------------------------------------------------------
# Snapshot SCHEMA-ONLY (DDL) do banco Neon — medida de segurança.
# Extrai TUDO que recria a estrutura: extensões, tipos/enums, funções,
# tabelas, colunas (incl. geradas), PK/FK/CHECK/UNIQUE, índices (incl.
# parciais), triggers, views e sequences. NÃO inclui dados (sem PII).
#
# Requisitos: pg_dump >= 18 (o servidor Neon roda PostgreSQL 18.x; o pg_dump
# recusa dumpar de um servidor mais novo que ele).
#
# Uso:
#   bash migrations/backup/dump-schema.sh
#
# Lê DATABASE_URL de backend/.env (nunca commitado). Saída: schema.sql neste
# diretório. schema.sql é seguro para versionar (só estrutura, zero dados).
# ----------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/migrations/backup/schema.sql"
ENV_FILE="$ROOT/backend/.env"

[ -f "$ENV_FILE" ] || { echo "ERRO: $ENV_FILE não encontrado." >&2; exit 1; }
DB="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
[ -n "$DB" ] || { echo "ERRO: DATABASE_URL ausente em backend/.env." >&2; exit 1; }

command -v pg_dump >/dev/null 2>&1 || {
  echo "ERRO: pg_dump não instalado. Instale o postgresql-client-18:" >&2
  echo "  sudo install -d /usr/share/postgresql-common/pgdg && \\" >&2
  echo "  sudo sh -c 'echo \"deb http://apt.postgresql.org/pub/repos/apt \$(. /etc/os-release; echo \$VERSION_CODENAME)-pgdg main\" > /etc/apt/sources.list.d/pgdg.list' && \\" >&2
  echo "  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg && \\" >&2
  echo "  sudo apt-get update && sudo apt-get install -y postgresql-client-18" >&2
  exit 1
}

# Recusa pg_dump < 18 (server é 18.x).
MAJOR="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"
if [ "$MAJOR" -lt 18 ]; then
  echo "ERRO: pg_dump $MAJOR é mais antigo que o servidor (18). Instale postgresql-client-18." >&2
  exit 1
fi

echo "Gerando schema-only DDL a partir do Neon…"
pg_dump --schema-only --no-owner --no-privileges --no-tablespaces "$DB" > "$OUT"
echo "OK: $OUT ($(wc -l < "$OUT") linhas)"
echo "Lembrete: schema.sql é só estrutura (sem dados). Para recriar um banco"
echo "funcional: aplicar schema.sql + os seeds em migrations/seeds/."
