# Deploy Production tren Ubuntu 22.04

Tai lieu nay mo ta bo file production va GitLab CI/CD dang dung cho repo.

## 1. File chinh

- `docker-compose.prod.yml`: stack production dung image tu GitLab Container Registry.
- `frontend/Dockerfile.prod`: build frontend production va serve bang Nginx.
- `deploy/deploy-prod.sh`: script chay tren VPS de pull image va restart stack.
- `deploy/bootstrap-vps.sh`: bootstrap ban dau cho VPS Ubuntu 22.04.
- `deploy/nginx/thuetoi.conf.example`: Nginx reverse proxy cho `/`, `/api`, `/uploads`, `/ws`.
- `deploy/env.prod.example`: mau bien moi truong de tao `/opt/thuetoi/.env.prod`.
- `.gitlab-ci.yml`: pipeline GitLab CI/CD cho merge request, `develop` va `main`.

## 2. Bootstrap VPS

SSH vao VPS va chay:

```bash
chmod +x deploy/bootstrap-vps.sh
./deploy/bootstrap-vps.sh
```

Sau do:

1. Tao thu muc `/opt/thuetoi`.
2. Copy `docker-compose.prod.yml` va `deploy/deploy-prod.sh` vao `/opt/thuetoi`.
3. Tao `/opt/thuetoi/.env.prod` tu `deploy/env.prod.example`.
4. Cai Nginx site tu `deploy/nginx/thuetoi.conf.example`, thay `<your-domain>`, enable site va reload Nginx.
5. Tro domain ve VPS, sau do chay `sudo certbot --nginx -d <your-domain>`.

## 3. GitLab CI/CD Variables

Can tao cac Variables sau trong `Settings -> CI/CD -> Variables`:

- `PROD_SSH_HOST`
- `PROD_SSH_PORT`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`
- `PROD_BASE_URL`
- `REGISTRY_DEPLOY_USERNAME`
- `REGISTRY_DEPLOY_PASSWORD`

Goi y:
- `PROD_SSH_KEY`: private key dung de GitLab Runner SSH vao VPS.
- `REGISTRY_DEPLOY_USERNAME` va `REGISTRY_DEPLOY_PASSWORD`: nen dung GitLab Deploy Token co quyen `read_registry`.

Vi du: `https://app.example.com`

## 4. Luong deploy

- Merge Request vao `develop`/`main`: chi chay CI.
- Push vao `develop`: chi chay CI.
- Push vao `main`: chay CI, build/push image backend/frontend len GitLab Container Registry, upload file deploy len VPS, cap nhat `IMAGE_TAG`, `REGISTRY_HOST`, `REGISTRY_IMAGE_BASE`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` trong `.env.prod`, sau do chay `deploy-prod.sh`.

## 5. Luu y production

- Production khong mount `schema.sql` va `seed.sql`, DB trong duoc tao qua Flyway.
- Frontend mac dinh goi same-origin (`/api`, `/ws`) de refresh cookie, CORS va WebSocket on dinh hon.
- CORS/WebSocket origin cua backend duoc dieu khien boi `APP_WEB_ALLOWED_ORIGINS`.
- MySQL production dung user rieng `MYSQL_USER`, backend khong dung `root`.
- VPS can pull image bang credential registry rieng, khong dung credential tam thoi cua pipeline.
- GitLab Runner can quyen chay `docker:dind` hoac runner tu quan ly co Docker daemon san.
