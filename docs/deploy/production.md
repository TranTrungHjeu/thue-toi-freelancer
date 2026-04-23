# Deploy Production trên Ubuntu 22.04

Tài liệu này mô tả cấu trúc deploy production và GitLab CI/CD hiện đang dùng cho dự án.

## 1. Các file chính

- `docker-compose.prod.yml`: stack production dùng image được build và đẩy lên GitLab Container Registry
- `frontend/Dockerfile.prod`: build frontend production và serve bằng Nginx
- `deploy/deploy-prod.sh`: script chạy trên VPS để pull image mới và khởi động lại stack
- `deploy/bootstrap-vps.sh`: script bootstrap ban đầu cho VPS Ubuntu 22.04
- `deploy/nginx/thuetoi.conf.example`: cấu hình Nginx reverse proxy cho `/`, `/api`, `/uploads`, `/ws`
- `deploy/env.prod.example`: file mẫu để tạo `/opt/thuetoi/.env.prod`
- `.gitlab-ci.yml`: pipeline GitLab CI/CD cho merge request, `develop` và `main`
- `docs/deploy/vps_runbook.md`: tài liệu hướng dẫn đăng nhập VPS và kiểm tra server sau mỗi lần deploy

## 2. Cách chuẩn bị VPS lần đầu

SSH vào VPS rồi chạy:

```bash
chmod +x deploy/bootstrap-vps.sh
./deploy/bootstrap-vps.sh
```

Sau đó thực hiện tiếp các bước sau:

1. Tạo thư mục `/opt/thuetoi`
2. Copy `docker-compose.prod.yml` và `deploy/deploy-prod.sh` vào `/opt/thuetoi`
3. Tạo `/opt/thuetoi/.env.prod` dựa trên `deploy/env.prod.example`
4. Cài cấu hình Nginx từ `deploy/nginx/thuetoi.conf.example`, thay `<your-domain>`, enable site rồi reload Nginx
5. Trỏ domain về VPS, sau đó chạy `sudo certbot --nginx -d <your-domain>`

## 3. GitLab CI/CD variables cần có

Trong `Settings -> CI/CD -> Variables`, cần tạo các biến sau:

- `PROD_SSH_HOST`
- `PROD_SSH_PORT`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`
- `PROD_BASE_URL`
- `REGISTRY_DEPLOY_USERNAME`
- `REGISTRY_DEPLOY_PASSWORD`

Giải thích nhanh:

- `PROD_SSH_KEY`: private key để GitLab Runner SSH vào VPS
- `REGISTRY_DEPLOY_USERNAME` và `REGISTRY_DEPLOY_PASSWORD`: nên dùng GitLab Deploy Token có quyền `read_registry`
- `PROD_BASE_URL`: domain production, ví dụ `https://thuetoi.id.vn`

## 4. Luồng deploy hiện tại

- Merge Request vào `develop` hoặc `main`: chỉ chạy CI
- Push vào `develop`: chỉ chạy CI
- Push vào `main`: chạy CI, build và push image, sau đó deploy production

Khi code được merge vào `main`, pipeline sẽ:

1. Chạy test cho backend và frontend
2. Build image backend và frontend
3. Đẩy image lên GitLab Container Registry
4. SSH vào VPS
5. Cập nhật `IMAGE_TAG`, `REGISTRY_HOST`, `REGISTRY_IMAGE_BASE`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` trong `.env.prod`
6. Chạy `deploy-prod.sh` để kéo image mới và khởi động lại stack

## 5. Một số lưu ý cho production

- Production không mount `schema.sql` và `seed.sql`; database trống sẽ được tạo schema bằng Flyway
- Frontend production dùng same-origin (`/api`, `/ws`) để refresh cookie, CORS và WebSocket hoạt động ổn định hơn
- CORS và WebSocket origin của backend được điều khiển bởi `APP_WEB_ALLOWED_ORIGINS`
- MySQL production dùng user riêng `MYSQL_USER`; backend không kết nối bằng `root`
- VPS phải đăng nhập registry bằng credential riêng để pull image, không dùng credential tạm của pipeline
- GitLab Runner cần hỗ trợ `docker:dind` hoặc runner tự quản lý có Docker daemon sẵn
