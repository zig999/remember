#!/bin/bash

# Diretório do projeto = diretório onde este script vive (portável)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION_NAME="eternal"

BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
TMUX_CONF="$PROJECT_DIR/tmux.conf"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Erro: diretório backend não encontrado: $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Erro: diretório frontend não encontrado: $FRONTEND_DIR"
  exit 1
fi

if [ ! -f "$TMUX_CONF" ]; then
  echo "Erro: arquivo tmux.conf não encontrado: $TMUX_CONF"
  exit 1
fi

# Sempre começa do zero: mata qualquer sessão anterior para reiniciar os servidores.
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Sessão $SESSION_NAME já existe — encerrando para reiniciar os servidores..."
  tmux kill-session -t "$SESSION_NAME"
fi

# Janela única com a config do projeto. A pane 0 já nasce no backend.
tmux new-session -d -s "$SESSION_NAME" -n servers -c "$BACKEND_DIR"
tmux source-file "$TMUX_CONF"

# Sem estado residual: ao fazer detach (fechar o terminal), a sessão é destruída
# em vez de continuar rodando em background. Via hook (não via destroy-unattached),
# pois a sessão nasce detached e destroy-unattached a mataria durante a montagem.
tmux set-hook -t "$SESSION_NAME" client-detached "kill-session -t $SESSION_NAME"

# =========================
# JANELA ÚNICA — duas colunas: backend | frontend
# =========================

# Coluna esquerda — backend
tmux select-pane -t "$SESSION_NAME":0.0 -T "backend-server"
tmux send-keys -t "$SESSION_NAME":0.0 "npm run dev" C-m

# Coluna direita — frontend
tmux split-window -h -t "$SESSION_NAME":0 -c "$FRONTEND_DIR"
tmux select-pane -t "$SESSION_NAME":0.1 -T "frontend-server"
tmux send-keys -t "$SESSION_NAME":0.1 "npm run dev" C-m

# Foco no backend e conecta
tmux select-pane -t "$SESSION_NAME":0.0
tmux attach -t "$SESSION_NAME"
