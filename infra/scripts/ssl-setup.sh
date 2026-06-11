#!/bin/bash
# Wave CRM — Configurar SSL com Let's Encrypt
# Uso: ./infra/scripts/ssl-setup.sh seudominio.com.br seu@email.com

set -e

DOMAIN=${1:?"Uso: $0 <dominio> <email>  Ex: $0 wavecrm.com.br admin@wavecrm.com.br"}
EMAIL=${2:?"Uso: $0 <dominio> <email>  Ex: $0 wavecrm.com.br admin@wavecrm.com.br"}
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo ">>> Configurando SSL para $DOMAIN"

# Domínios com mais de 2 labels (ex: dashboard.wavecrm.com.br) são subdomínios:
# não faz sentido (nem existe DNS para) "www.dashboard.wavecrm.com.br".
LABEL_COUNT=$(echo "$DOMAIN" | awk -F. '{print NF}')
if [ "$LABEL_COUNT" -le 2 ]; then
  SERVER_NAMES="$DOMAIN www.$DOMAIN"
  CERTBOT_DOMAINS=(-d "$DOMAIN" -d "www.$DOMAIN")
else
  SERVER_NAMES="$DOMAIN"
  CERTBOT_DOMAINS=(-d "$DOMAIN")
fi

# Atualiza o nginx.conf com o domínio correto
NGINX_CONF="$ROOT_DIR/infra/nginx/sites/wave-crm.conf"
sed -i "s/wavecrm.com.br www.wavecrm.com.br/$SERVER_NAMES/g; s/wavecrm.com.br/$DOMAIN/g" "$NGINX_CONF"
echo ">>> nginx.conf atualizado para $SERVER_NAMES"

# Sobe nginx temporário (HTTP only) para o desafio certbot
docker run --rm \
  -v "$ROOT_DIR/infra/certbot:/etc/letsencrypt" \
  -v "/var/www/certbot:/var/www/certbot" \
  -p 80:80 \
  nginx:alpine sh -c "
    echo 'server { listen 80; server_name $SERVER_NAMES; location /.well-known/acme-challenge/ { root /var/www/certbot; } }' > /etc/nginx/conf.d/certbot.conf
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
  "${CERTBOT_DOMAINS[@]}"

kill $NGINX_PID 2>/dev/null || true

echo ""
echo "=== SSL configurado para $DOMAIN ==="
echo "Certificado em: $ROOT_DIR/infra/certbot/live/$DOMAIN/"
echo ""
echo "Agora atualize o volume do nginx no docker-compose.yml:"
echo "  - ./infra/certbot:/etc/letsencrypt"
echo ""
echo "E suba o nginx: docker compose --profile proxy up -d nginx"
