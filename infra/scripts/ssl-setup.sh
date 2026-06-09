#!/bin/bash
# Wave CRM — Configurar SSL com Let's Encrypt
# Uso: ./infra/scripts/ssl-setup.sh seudominio.com.br seu@email.com

set -e

DOMAIN=${1:?"Uso: $0 <dominio> <email>  Ex: $0 wavecrm.com.br admin@wavecrm.com.br"}
EMAIL=${2:?"Uso: $0 <dominio> <email>  Ex: $0 wavecrm.com.br admin@wavecrm.com.br"}
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo ">>> Configurando SSL para $DOMAIN"

# Atualiza o nginx.conf com o domínio correto
NGINX_CONF="$ROOT_DIR/infra/nginx/sites/wave-crm.conf"
sed -i "s/wavecrm.com.br/$DOMAIN/g" "$NGINX_CONF"
echo ">>> nginx.conf atualizado para $DOMAIN"

# Sobe nginx temporário (HTTP only) para o desafio certbot
docker run --rm \
  -v "$ROOT_DIR/infra/certbot:/etc/letsencrypt" \
  -v "/var/www/certbot:/var/www/certbot" \
  -p 80:80 \
  nginx:alpine sh -c "
    echo 'server { listen 80; server_name $DOMAIN www.$DOMAIN; location /.well-known/acme-challenge/ { root /var/www/certbot; } }' > /etc/nginx/conf.d/certbot.conf
    nginx -g 'daemon off;' &
    sleep 3
    echo 'Nginx pronto para desafio certbot'
    wait
  " &
NGINX_PID=$!

sleep 3

# Executa certbot
docker run --rm \
  -v "$ROOT_DIR/infra/certbot:/etc/letsencrypt" \
  -v "/var/www/certbot:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" -d "www.$DOMAIN"

kill $NGINX_PID 2>/dev/null || true

# Atualiza o caminho do certificado no nginx.conf
sed -i "s|/etc/letsencrypt/live/wavecrm.com.br|/etc/letsencrypt/live/$DOMAIN|g" "$NGINX_CONF"

echo ""
echo "=== SSL configurado para $DOMAIN ==="
echo "Certificado em: $ROOT_DIR/infra/certbot/live/$DOMAIN/"
echo ""
echo "Agora atualize o volume do nginx no docker-compose.yml:"
echo "  - ./infra/certbot:/etc/letsencrypt"
echo ""
echo "E suba o nginx: docker compose --profile proxy up -d nginx"
