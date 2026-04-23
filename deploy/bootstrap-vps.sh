#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/thuetoi"

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" | \
        sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo mkdir -p "${APP_DIR}"
sudo chown "${USER}:${USER}" "${APP_DIR}"

if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 22/tcp || true
    sudo ufw allow 80/tcp || true
    sudo ufw allow 443/tcp || true
fi

echo "Bootstrap complete."
echo "Next steps:"
echo "1. Copy docker-compose.prod.yml and deploy-prod.sh into ${APP_DIR}"
echo "2. Create ${APP_DIR}/.env.prod from deploy/env.prod.example"
echo "3. Install deploy/nginx/thuetoi.conf.example into /etc/nginx/sites-available"
echo "4. Point your domain to this VPS and run certbot --nginx -d <your-domain>"
