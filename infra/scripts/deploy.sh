#!/bin/bash
# Wave CRM — Production Deploy Script
# Uso: ./infra/scripts/deploy.sh

set -e

COMPOSE="docker compose"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo ">>> Wave CRM Deploy"
echo ">>> Dir: $ROOT_DIR"

cd "$ROOT_DIR"

# Verifica .env
if [ ! -f ".env" ]; then
  echo "[ERRO] Arquivo .env não encontrado. Copie .env.production.example para .env e preencha os valores."
  exit 1
fi

# Carrega .env para verificar NODE_ENV
set -a; source .env; set +a

if [ "$NODE_ENV" != "production" ]; then
  echo "[AVISO] NODE_ENV não é 'production' (atual: $NODE_ENV). Continuando mesmo assim..."
fi

# Pull das imagens base
echo ">>> Atualizando imagens base..."
$COMPOSE pull postgres redis

# Build das imagens da aplicação
echo ">>> Build do backend e frontend..."
$COMPOSE build backend frontend

# Sobe os serviços base (sem nginx ainda)
echo ">>> Subindo banco de dados e redis..."
$COMPOSE up -d postgres redis

echo ">>> Aguardando banco de dados ficar pronto..."
sleep 5

# Roda as migrations
echo ">>> Rodando migrations..."
$COMPOSE run --rm backend sh -c "npx prisma migrate deploy"

# Sobe todos os serviços
echo ">>> Subindo todos os serviços..."
$COMPOSE up -d

# Se o profile proxy estiver ativo, sobe o nginx
if [ "$1" == "--with-nginx" ]; then
  echo ">>> Subindo nginx..."
  $COMPOSE --profile proxy up -d nginx
fi

echo ""
echo "=== Deploy concluído ==="
echo "Backend:  http://localhost:4000/api/v1/health"
echo "Frontend: http://localhost:3000"
echo ""
echo "Para ativar HTTPS com nginx: ./infra/scripts/deploy.sh --with-nginx"
