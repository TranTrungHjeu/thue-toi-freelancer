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

Mở Terminal (hoặc Command Prompt / Git Bash) tại thư mục gốc của dự án (`thue-toi-freelancer`) và chạy lệnh sau:

```bash
docker-compose up -d --build
```

**Lưu ý:**

- Lần chạy đầu tiên sẽ tốn khoảng 3-5 phút vì Docker phải tải môi trường Maven (để compile Java) và Node.js từ Internet về, sau đó tải các thư viện.
- Những lần sau, bạn chỉ cần chạy `docker-compose up -d` là dự án lên ngay lập tức.
- Tham số `-d` giúp hệ thống chạy ngầm để bạn có thể tiếp tục sử dụng Terminal.

### Bước 3: Kiểm tra hệ thống (Verification)

Sau khi quá trình trên hoàn tất (Terminal hiện chữ `Started` hoặc đưa bạn về dòng lệnh trống), hãy mở trình duyệt và truy cập:

- **Frontend (ReactJS):** [http://localhost:5173](http://localhost:5173)
  _(Cấu hình Hot-reload tĩnh: Bạn sửa code trong thư mục `/frontend`, trình duyệt sẽ tự tải lại)._
- **Backend API (Spring Boot):** [http://localhost:8080/api](http://localhost:8080/api)
  _(Để xem API, hãy truy cập các endpoint tuỳ chỉnh của Controller sau này)._

**Về cơ sở dữ liệu MySQL:**
Docker đã tự dựng một máy chủ MySQL ở công 3306.

- **Tên Database**: `thuetoi`
- **Username**: `root`
- **Password**: `root`

Nếu bạn muốn dùng công cụ như DBeaver hoặc MySQL Workbench để xem dữ liệu, hãy điền các thông tin trên và trỏ Host về `localhost:3306`.

### Hỗ trợ (Troubleshoot)

1. **Xem Log hệ thống:** Nếu Backend/Frontend không lên mạng, hãy chạy lệnh này để xem bản ghi lỗi:

   ```bash
   docker-compose logs -f
   ```

2. **Tắt máy chủ an toàn:** Khi bạn ngưng code và muốn tắt dự án để giài phóng Ram:

   ```bash
   docker-compose down
   ```

3. **Reset Database "sạch sẽ":** Nếu bạn muốn xoá trắng dữ liệu DB hiện diện trong kịch bản dev:

   ```bash
   docker-compose down -v
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

### 3. Kiến trúc xác thực JWT (Auth Flow)

- **Frontend (ReactJS):** Gửi header `Authorization: Bearer <access_token>` cho các API cần đăng nhập.
- **Backend (Spring Boot):** Xác thực stateless bằng JWT access token, refresh token lưu DB (`refresh_tokens`) để rotate/revoke.

**Auth API cho FE sử dụng:**

- `POST /api/v1/auths/sign-up`
  - Body: `email`, `password`, `fullName`, `role`
- `POST /api/v1/auths/sign-in`
  - Body: `email`, `password`
  - Response: `accessToken`, `refreshToken`, `tokenType`
  - Validation đăng nhập:
    - Nếu sai email, BE trả HTTP `400` với format:
      ```json
      {
        "success": false,
        "message": "Sai email",
        "data": null
      }
      ```
    - Nếu sai mật khẩu, BE trả HTTP `400` với format:
      ```json
      {
        "success": false,
        "message": "Sai mật khẩu",
        "data": null
      }
      ```
- `POST /api/v1/auths/refresh-token`
  - Body: `refreshToken`
  - Response: cặp token mới
- `POST /api/v1/auths/sign-out`
  - Header: `Authorization: Bearer <access_token>`
  - Tác dụng: thu hồi refresh token còn hiệu lực
- `GET /api/v1/auths/current-user`
  - Header: `Authorization: Bearer <access_token>`
  - Tác dụng: lấy thông tin user hiện tại

**HTTP Status code (Auth):**

- `200`: thao tác thành công
- `400`: dữ liệu đầu vào không hợp lệ, sai email, hoặc sai mật khẩu
- `401`: thiếu hoặc token không hợp lệ khi truy cập API yêu cầu đăng nhập

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
- [docs/architecture/auth_session_flow.md](docs/architecture/auth_session_flow.md) — Luồng xác thực/session
