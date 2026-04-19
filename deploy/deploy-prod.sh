#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/thuetoi"
ENV_FILE=".env.prod"
COMPOSE_FILE="docker-compose.prod.yml"
HEALTHCHECK_URL="http://127.0.0.1:8080/api/v1/health"

read_env_value() {
    local key="$1"
    sed -n "s/^${key}=//p" "${ENV_FILE}" | head -n 1 | tr -d '\r'
}

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Missing ${APP_DIR}/${ENV_FILE}" >&2
    exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
    echo "Missing ${APP_DIR}/${COMPOSE_FILE}" >&2
    exit 1
fi

REGISTRY_HOST="$(read_env_value REGISTRY_HOST)"
REGISTRY_USERNAME="$(read_env_value REGISTRY_USERNAME)"
REGISTRY_PASSWORD="$(read_env_value REGISTRY_PASSWORD)"

if [[ -z "${REGISTRY_HOST}" || -z "${REGISTRY_USERNAME}" || -z "${REGISTRY_PASSWORD}" ]]; then
    echo "REGISTRY_HOST, REGISTRY_USERNAME and REGISTRY_PASSWORD must be set in ${ENV_FILE}" >&2
    exit 1
fi

echo "${REGISTRY_PASSWORD}" | docker login "${REGISTRY_HOST}" -u "${REGISTRY_USERNAME}" --password-stdin
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --remove-orphans

for attempt in $(seq 1 30); do
    if curl --fail --silent --show-error "${HEALTHCHECK_URL}" > /dev/null; then
        echo "Deployment completed and backend is healthy."
        exit 0
    fi
    sleep 5
done

echo "Healthcheck failed after deployment. Current container status:" >&2
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps >&2
echo "Recent backend logs:" >&2
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail=100 backend >&2
echo "Recent frontend logs:" >&2
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail=100 frontend >&2
exit 1
