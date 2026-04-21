# Runbook VPS Production

Tài liệu này dành cho cả team khi cần:

- Đăng nhập vào VPS production
- Kiểm tra tình trạng server sau khi push hoặc merge code
- Xem nhanh backend, frontend, MySQL, Nginx và SSL có đang hoạt động ổn định hay không
- Chạy lại deploy thủ công khi cần

## 1. Thông tin production hiện tại

- Domain chính: `https://thuetoi.id.vn`
- Domain phụ: `https://www.thuetoi.id.vn`
- Thư mục ứng dụng trên VPS: `/opt/thuetoi`
- File Docker Compose production: `/opt/thuetoi/docker-compose.prod.yml`
- File biến môi trường production: `/opt/thuetoi/.env.prod`
- Script deploy: `/opt/thuetoi/deploy-prod.sh`

## 2. Cách đăng nhập vào VPS

### 2.1. Điều kiện cần có

Trước khi đăng nhập, cần chuẩn bị:

- IP public của VPS
- Tài khoản SSH được cấp quyền
- SSH private key dùng để đăng nhập

Nếu máy local chưa có SSH key, có thể tạo mới bằng lệnh:

```bash
ssh-keygen -t ed25519 -C "thuetoi-vps" -f ~/.ssh/thuetoi_vps
```

Public key tương ứng, ví dụ `~/.ssh/thuetoi_vps.pub`, cần được thêm vào file `~/.ssh/authorized_keys` trên VPS.

### 2.2. Lệnh đăng nhập

Windows PowerShell:

```powershell
ssh -i $env:USERPROFILE\.ssh\gitlab_deploy root@160.250.135.10
```

macOS/Linux:

```bash
ssh -i ~/.ssh/gitlab_deploy root@160.250.135.10
```

Nếu sau này VPS đổi IP hoặc đổi user SSH, hãy cập nhật lại tài liệu này để mọi người dùng đúng thông tin mới.

### 2.3. Kiểm tra đã vào đúng máy chưa

Sau khi SSH thành công, chạy:

```bash
whoami
hostname
pwd
```

Kỳ vọng:

- `whoami` trả về đúng user được cấp quyền
- `hostname` là máy production
- `pwd` thường là `/root` hoặc thư mục home của user đang đăng nhập

## 3. Luồng deploy hiện tại

Pipeline GitLab đang được cấu hình như sau:

- Merge Request vào `develop` hoặc `main`: chỉ chạy test
- Push vào `develop`: chỉ chạy test
- Push vào `main`: chạy test, build image và deploy production

Các file liên quan:

- [`.gitlab-ci.yml`](../../.gitlab-ci.yml)
- [`deploy/deploy-prod.sh`](../../deploy/deploy-prod.sh)
- [`docker-compose.prod.yml`](../../docker-compose.prod.yml)

Khi code được merge vào `main`, GitLab sẽ thực hiện lần lượt:

1. Build image backend và frontend lên GitLab Container Registry
2. SSH vào VPS
3. Cập nhật `IMAGE_TAG` và các biến registry trong `/opt/thuetoi/.env.prod`
4. Chạy `/opt/thuetoi/deploy-prod.sh` để kéo image mới và khởi động lại stack

## 4. Các bước kiểm tra sau khi push code

### 4.1. Kiểm tra pipeline trên GitLab

Vào `CI/CD -> Pipelines` và mở pipeline mới nhất.

Cần chú ý các job:

- `build_backend_image`
- `build_frontend_image`
- `deploy_prod`

Chỉ nên kết luận hệ thống đã deploy xong khi `deploy_prod` chạy thành công.

### 4.2. SSH vào VPS và kiểm tra container

Sau khi pipeline `main` chạy xong, SSH vào VPS và chạy:

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Kỳ vọng:

- `mysql-db` ở trạng thái `healthy`
- `backend` ở trạng thái `Up`
- `frontend` ở trạng thái `Up`

Nếu có service nào ở trạng thái `Exit`, cần kiểm tra log ngay.

### 4.3. Kiểm tra health của backend

```bash
curl http://127.0.0.1:8080/api/v1/health
curl -I https://thuetoi.id.vn/api/v1/health
```

Kỳ vọng:

- Lệnh gọi nội bộ trả về JSON thành công
- `https://thuetoi.id.vn/api/v1/health` trả `200 OK`

### 4.4. Kiểm tra frontend

```bash
curl -I https://thuetoi.id.vn
curl -I https://www.thuetoi.id.vn
```

Kỳ vọng:

- `thuetoi.id.vn` trả `200 OK`
- `www.thuetoi.id.vn` có thể trả `200` hoặc redirect về `thuetoi.id.vn`

Ngoài ra nên mở trực tiếp trên trình duyệt để kiểm tra:

- Trang chủ có tải được hay không
- Refresh một route SPA như `/workspace` có bị `404` hay không
- Đăng nhập và điều hướng trong ứng dụng có bình thường không

### 4.5. Xem log khi có vấn đề

Backend:

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 backend
```

Frontend:

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 frontend
```

MySQL:

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 mysql-db
```

Theo dõi log realtime:

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend
```

## 5. Các lệnh vận hành thường dùng

### 5.1. Xem trạng thái container

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

### 5.2. Deploy lại thủ công

Chỉ dùng khi cần chạy lại deploy ngoài pipeline:

```bash
cd /opt/thuetoi
./deploy-prod.sh
```

### 5.3. Khởi động lại stack production

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --remove-orphans
```

### 5.4. Dừng stack production

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

Chỉ dùng lệnh `down` khi bảo trì hoặc cần dừng dịch vụ có chủ đích.

## 6. Kiểm tra Nginx và SSL

Kiểm tra cấu hình Nginx:

```bash
nginx -t
systemctl status nginx --no-pager
```

Reload Nginx:

```bash
systemctl reload nginx
```

Kiểm tra chứng chỉ SSL còn gia hạn được:

```bash
certbot renew --dry-run
```

Xem chứng chỉ đang sử dụng:

```bash
certbot certificates
```

## 7. Kiểm tra file `.env.prod`

Không sao chép hoặc gửi secret vào chat, issue hoặc commit.

Chỉ xem một số biến quan trọng:

```bash
cd /opt/thuetoi
grep -E '^(REGISTRY_HOST|REGISTRY_IMAGE_BASE|IMAGE_TAG|APP_WEB_ALLOWED_ORIGINS|APP_AUTH_REFRESH_COOKIE_SECURE|RESEND_FROM)=' .env.prod
```

Kiểm tra file env có lỗi cú pháp hay không:

```bash
cd /opt/thuetoi
bash -n .env.prod && echo "env syntax ok"
```

Nạp biến môi trường vào shell hiện tại:

```bash
cd /opt/thuetoi
set -a
. ./.env.prod
set +a
```

## 8. Một số lỗi thường gặp

### 8.1. Job `deploy_prod` trên GitLab bị lỗi

Hãy kiểm tra lại các biến CI/CD:

- `PROD_SSH_HOST`
- `PROD_SSH_PORT`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`
- `REGISTRY_DEPLOY_USERNAME`
- `REGISTRY_DEPLOY_PASSWORD`
- `PROD_BASE_URL`

### 8.2. `docker login` thất bại trên VPS

Kiểm tra:

- `REGISTRY_HOST`
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- Deploy Token còn hiệu lực và có quyền `read_registry`

### 8.3. Gặp lỗi `502 Bad Gateway`

Nguyên nhân thường gặp:

- `backend` chưa khởi động xong
- `frontend` chưa khởi động xong
- Nginx proxy đúng port nhưng upstream chưa có process lắng nghe

Cách kiểm tra:

```bash
cd /opt/thuetoi
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 backend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 frontend
```

### 8.4. Đăng nhập được nhưng refresh token không hoạt động

Kiểm tra trong `.env.prod`:

- `APP_AUTH_REFRESH_COOKIE_SECURE=true`
- `APP_AUTH_REFRESH_COOKIE_SAME_SITE=Lax`
- `APP_AUTH_REFRESH_COOKIE_DOMAIN=`
- `APP_WEB_ALLOWED_ORIGINS=https://thuetoi.id.vn`

Nếu site đang chạy bằng HTTPS và domain thật, không được để `APP_AUTH_REFRESH_COOKIE_SECURE=false`.

## 9. Checklist sau mỗi lần deploy

Sau mỗi lần merge vào `main`, người phụ trách nên xác nhận:

1. Pipeline `main` đã chạy thành công hoàn toàn
2. `docker compose ps` trên VPS không có service nào ở trạng thái `Exit`
3. `curl http://127.0.0.1:8080/api/v1/health` trả kết quả thành công
4. `curl -I https://thuetoi.id.vn` trả `200`
5. `certbot renew --dry-run` vẫn pass nếu vừa thay đổi Nginx
6. Đăng nhập vào frontend và tải lại một route bảo vệ như `/workspace` không bị lỗi

## 10. Lưu ý an toàn

- Không gửi secret vào group chat, issue hoặc commit
- Không chỉnh trực tiếp `.env.prod` nếu chưa thông báo cho team
- Không dùng `git reset --hard` hoặc các lệnh xóa dữ liệu trên production nếu chưa có chủ đích rõ ràng
- Nếu cần rotate secret, phải cập nhật đồng thời trên GitLab Variables và `/opt/thuetoi/.env.prod`
