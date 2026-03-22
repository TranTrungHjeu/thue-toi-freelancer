# Thuê Tôi Freelancer Platform

Dự án Đồ án môn học Web - Nền tảng kết nối Freelancer và Khách hàng (Dựa trên mô hình E-commerce dịch vụ).

## Yêu cầu hệ thống (Prerequisites)

Bạn **KHÔNG CẦN** cài đặt Java, Maven, Node.js hay MySQL trên máy thật của mình. Tất cả những gì bạn cần là:

1. **Docker Desktop**: Tải và cài đặt tại [docker.com](https://www.docker.com/products/docker-desktop).
2. Hệ điều hành: Windows 10/11 (khuyến nghị có WSL2), macOS, hoặc Linux.
3. Ram tối thiểu 4GB trống để chạy các Container.

## Hướng dẫn chạy dự án (Getting Started)

### Bước 1: Khởi động Docker Desktop

Hãy đảm bảo bạn đã mở phần mềm **Docker Desktop** và biểu tượng cá voi đã hiển thị màu xanh (Engine running) trên thanh Taskbar.

### Bước 2: Tải các dịch vụ (Build & Run)

Trước khi chạy, hãy tạo file `.env` ở thư mục gốc để Docker Compose nạp các biến bí mật local. Tối thiểu cần có:

```bash
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=Thue Toi <onboarding@resend.dev>
APP_AUTH_REFRESH_COOKIE_SECURE=false
APP_AUTH_REFRESH_COOKIE_SAME_SITE=Lax
```

File `.env` local không được commit lên Git.

Mở Terminal (hoặc Command Prompt / Git Bash) tại thư mục gốc của dự án (`thue-toi-freelancer`) và chạy lệnh sau:

```bash
docker compose up -d --build
```

**Lưu ý:**

- Lần chạy đầu tiên sẽ tốn khoảng 3-5 phút vì Docker phải tải môi trường Maven (để compile Java) và Node.js từ Internet về, sau đó tải các thư viện.
- Những lần sau, bạn chỉ cần chạy `docker compose up -d`.
- Tham số `-d` giúp hệ thống chạy ngầm để bạn có thể tiếp tục sử dụng Terminal.
- Luồng OTP hiện chỉ chạy qua email thật bằng Resend. Không còn endpoint debug đọc OTP local trong runtime chuẩn.

### Bước 3: Kiểm tra hệ thống (Verification)

Sau khi quá trình trên hoàn tất (Terminal hiện chữ `Started` hoặc đưa bạn về dòng lệnh trống), hãy mở trình duyệt và truy cập:

- **Frontend (ReactJS):** [http://localhost:5173](http://localhost:5173)
  _(Cấu hình Hot-reload tĩnh: Bạn sửa code trong thư mục `/frontend`, trình duyệt sẽ tự tải lại)._
- **Backend API (Spring Boot):** [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
  _(Đây là endpoint health-check mẫu. Các API nghiệp vụ sẽ nằm dưới namespace `/api/v1/*`)._

Docker sẽ dựng một máy chủ MySQL ở cổng `3307` trên máy local.

- **Tên Database**: `thuetoi`
- **Username**: `root`
- **Password**: `root`

Nếu bạn muốn dùng công cụ như DBeaver hoặc MySQL Workbench để xem dữ liệu, hãy điền các thông tin trên và trỏ Host về `localhost:3307`.

### Ghi chú deploy VPS

Khi deploy full stack lên VPS, bạn vẫn có thể override các giá trị mặc định của backend bằng biến môi trường chuẩn Spring Boot như:

```bash
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
APP_JWT_ACCESS_TOKEN_SECRET
APP_JWT_REFRESH_TOKEN_SECRET
RESEND_API_KEY
RESEND_FROM
APP_AUTH_REFRESH_COOKIE_SECURE
APP_AUTH_REFRESH_COOKIE_SAME_SITE
```

Các giá trị mặc định local hiện được đặt trong [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties).

### Hỗ trợ (Troubleshoot)

1. **Xem Log hệ thống:** Nếu Backend/Frontend không lên mạng, hãy chạy lệnh này để xem bản ghi lỗi:

   ```bash
   docker compose logs -f
   ```

2. **Tắt máy chủ an toàn:** Khi bạn ngưng code và muốn tắt dự án để giài phóng Ram:

   ```bash
   docker compose down
   ```

3. **Reset Database "sạch sẽ":** Nếu bạn muốn xoá trắng dữ liệu DB hiện diện trong kịch bản dev:

   ```bash
   docker compose down -v
   ```

---

## Quy chuẩn & Quy trình chuyên nghiệp

### 1. Quy chuẩn đặt tên (Naming Conventions)

Tất cả thành viên cần tuân thủ quy chuẩn để đảm bảo code đồng nhất:

- **Database (MySQL):** snake_case, chữ thường, danh từ số nhiều. VD: `users`, `order_details`, `user_id`.
- **API Endpoint:** `/api/v1/resource`, kebab-case, danh từ số nhiều. VD: `/api/v1/users`, `/api/v1/orders/1/checkout`.
- **Java (Spring Boot):**
  - Class/Interface/Enum: PascalCase. VD: `UserService`, `AppConfig`.
  - Biến/hàm: camelCase. VD: `findById()`, `currentUser`.
  - Hằng số: UPPER_SNAKE_CASE. VD: `MAX_PAGE_SIZE`.
  - Package: controller, service, repository, entity, dto.request, dto.response.
- **ReactJS:**
  - Component/file: PascalCase. VD: `UserProfile.jsx`.
  - Hook/thư mục: camelCase. VD: `useAuth.js`, `api/`.
  - Hàm xử lý sự kiện: handleSubmit, onCloseModal.

### 2. Quy trình làm việc nhóm (Git Workflow)

- **Tuyệt đối không code trực tiếp trên `main`!**
- Luôn tạo branch mới từ `develop`:
  - Tên branch: `<loại_task>/<tên_task>`, ví dụ: `feature/login`, `bugfix/cart-error`, `db/add-order-table`.
- Commit message: `[Tên_Module] Mô tả ngắn gọn`, ví dụ: `[Auth] Thêm chức năng đăng nhập`.
- Khi hoàn thành, tạo Pull Request về `develop` để review.

### 3. Kiến trúc xác thực JWT + OTP (Auth Flow)

- **Frontend (ReactJS):**
  - Gửi header `Authorization: Bearer <access_token>` cho các API yêu cầu đăng nhập.
  - Luôn giữ `withCredentials: true` để trình duyệt tự gửi `refresh token` lưu dưới dạng `HttpOnly cookie`.
- **Backend (Spring Boot):**
  - Xác thực stateless bằng JWT access token.
  - Lưu `refresh token` vào bảng `refresh_tokens` dưới dạng mã băm để rotate/revoke.
  - Dùng OTP email để xác thực tài khoản trước khi cho phép đăng nhập.

**Auth API cho FE sử dụng:**

- `POST /api/v1/auth/register`
  - Body: `email`, `password`, `fullName`, `role`, `profileDescription`
  - Tạo tài khoản `freelancer` hoặc `customer`, đồng thời tự động gửi OTP xác thực email.
- `POST /api/v1/auth/verify-email-otp`
  - Body: `email`, `otp`
  - Xác thực email và kích hoạt khả năng đăng nhập.
- `POST /api/v1/auth/resend-verification-otp`
  - Body: `email`
  - Gửi lại OTP xác thực email, có cooldown chống spam.
- `POST /api/v1/auth/login`
  - Body: `email`, `password`
  - Response body: `tokenType`, `accessToken`, `accessTokenExpiresIn`, `user`
  - Response cookie: `thue_toi_refresh_token` (`HttpOnly`)
- `POST /api/v1/auth/refresh`
  - Không gửi body.
  - Trình duyệt tự gửi refresh token cookie, backend rotate cookie và trả access token mới trong body.
- `POST /api/v1/auth/logout`
  - Thu hồi refresh token hiện tại và xóa cookie.
- `GET /api/v1/auth/profile`
  - Lấy thông tin người dùng hiện tại từ access token.

**HTTP Status code (Auth):**

- `200`: thao tác thành công
- `400`: dữ liệu đầu vào không hợp lệ hoặc OTP sai/hết hạn
- `401`: chưa đăng nhập, access token không hợp lệ, refresh token không hợp lệ
- `403`: tài khoản bị khóa hoặc chưa xác thực email
- `409`: email đã tồn tại hoặc tài khoản đã xác thực email
- `429`: gửi lại OTP quá nhanh

---

## Hệ thống UI/UX (Strict Sharpness)

Dự án sử dụng ngôn ngữ thiết kế **Strict Sharpness** (Góc vuông, viền đậm, tương phản cao) để tạo sự chuyên nghiệp cho nền tảng Freelancer.

### 1. Thư viện thành phần (UI Kit)
Tất cả các thành phần được xây dựng sẵn và lưu trữ tại `frontend/src/components/common`. Các thành viên **vui lòng tái sử dụng**, không tự ý viết lại CSS:
- **Navigation**: MobileDrawer, BottomNav, NavGroup, Breadcrumbs.
- **Data Display**: ResponsiveTable, KanbanBoard, ActivityCharts, SkillRadar, MilestoneTracker.
- **Interaction**: ActionSheet, FloatingActionButton (FAB), CommandPalette (Ctrl+K), TagInput.
- **Feedback**: Toast (Success/Error), Modal, SuccessAnimation (Confetti), Skeleton.

### 2. Gallery tương tác

Để xem và test tất cả các thành phần UI đang có, hãy truy cập:

- [http://localhost:5173/gallery](http://localhost:5173/gallery)

---

**Xem chi tiết:**

- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — Quy chuẩn đặt tên & code
- [docs/architecture/ui_standard.md](docs/architecture/ui_standard.md) — **Quy chuẩn UI & Mobile UX (QUAN TRỌNG)**
- [docs/TEAM_GUIDE.md](docs/TEAM_GUIDE.md) — Quy trình làm việc nhóm
- [docs/architecture/auth_session_flow.md](docs/architecture/auth_session_flow.md) — Luồng xác thực JWT + OTP
