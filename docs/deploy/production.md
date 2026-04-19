# Deploy Production tren Ubuntu 22.04

Tai lieu nay mo ta bo file production va CI/CD vua duoc them vao repo.

## 1. File chinh

- `docker-compose.prod.yml`: stack production dung image tu GHCR.
- `frontend/Dockerfile.prod`: build frontend production va serve bang Nginx.
- `deploy/deploy-prod.sh`: script chay tren VPS de pull image va restart stack.
- `deploy/bootstrap-vps.sh`: bootstrap ban dau cho VPS Ubuntu 22.04.
- `deploy/nginx/thuetoi.conf.example`: Nginx reverse proxy cho `/`, `/api`, `/uploads`, `/ws`.
- `deploy/env.prod.example`: mau bien moi truong de tao `/opt/thuetoi/.env.prod`.
- `.github/workflows/ci-cd.yml`: workflow CI/CD cho `develop` va `main`.

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

## 3. GitHub Actions secrets va vars

Can tao cac secrets sau:

- `PROD_SSH_HOST`
- `PROD_SSH_PORT`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`
- `GHCR_USERNAME`
- `GHCR_TOKEN_READ`

Can tao repository variable:

- `PROD_BASE_URL`

Vi du: `https://app.example.com`

## 4. Luong deploy

- Pull request vao `develop`/`main`: chi chay CI.
- Push vao `develop`: chi chay CI.
- Push vao `main`: chay CI, build/push image backend/frontend len GHCR, upload file deploy len VPS, cap nhat `IMAGE_TAG` va `GHCR_OWNER` trong `.env.prod`, sau do chay `deploy-prod.sh`.

## 5. Luu y production

- Production khong mount `schema.sql` va `seed.sql`, DB trong duoc tao qua Flyway.
- Frontend mac dinh goi same-origin (`/api`, `/ws`) de refresh cookie, CORS va WebSocket on dinh hon.
- CORS/WebSocket origin cua backend duoc dieu khien boi `APP_WEB_ALLOWED_ORIGINS`.
- MySQL production dung user rieng `MYSQL_USER`, backend khong dung `root`.
