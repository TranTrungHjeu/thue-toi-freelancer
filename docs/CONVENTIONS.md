# Hướng Dẫn Ký Hiệu & Đặt Tên (Standard Naming Conventions)

Tất cả thành viên trong quá trình phát triển dự án cần tuân thủ bảng quy chuẩn đặt tên dưới đây để mã nguồn đồng nhất.

## 1. Cơ Sở Dữ Liệu (MySQL)
**Nguyên tắc chung: Dùng chữ thường, phân cách bằng dấu gạch dưới `_` (snake_case), danh từ số nhiều.**
- Tên bảng: `users`, `skills`, `users_skills`, `projects`, `projects_skills`, `bids`, `contracts`, `milestones`, `reviews`, `messages`, `notifications`, `refresh_tokens`, `email_otps`.
- Tên cột: `id`, `full_name`, `email`, `created_at`, `budget_min`.
- Khoá ngoại (Foreign Key): `<table>_id`. VD: `user_id`, `project_id`, `skill_id`.

## 2. API Endpoints (RESTful URL)
**Nguyên tắc chung: Cấu trúc `/api/v1/resource`, dùng chữ thường, phân cách bằng dấu gạch ngang (kebab-case), danh từ số nhiều.**

| Phương thức HTTP | Chức năng (REST) | Ví dụ Endpoint Chuẩn | Sai / Không dùng |
| --- | --- | --- | --- |
| `GET` | Đọc danh sách | `/api/v1/users` | `/api/v1/getUsers` |
| `GET` | Đọc 1 bản ghi | `/api/v1/users/1` | `/api/v1/getUserById?id=1` |
| `POST` | Thêm mới (Create) | `/api/v1/users` | `/api/v1/createUser` |
| `PUT` | Cập nhật (Update) | `/api/v1/users/1` | `/api/v1/updateUser` |
| `DELETE` | Xoá (Delete) | `/api/v1/users/1` | `/api/v1/deleteUser` |
| `POST` | Hành động logic (Phi chuẩn) | `/api/v1/bids/{id}/accept` | `/api/v1/acceptBid/{id}` |

## 3. Spring Boot (Java)
**Nguyên tắc chung (CamelCase):**
- **Class / Interface / Enum:** Dùng `PascalCase`. (VD: `UserService`, `AppConfig`)
- **Tên biến / Tên phương thức:** Dùng `camelCase`. (VD: `findById()`, `currentUser`)
- **Hằng số (Constant):** Tên in hoa viết cách bằng dấu gạch dưới `_`. (VD: `MAX_PAGE_SIZE`, `ROLE_ADMIN`)

**Cấu trúc Package Standard:**
- `com.thuetoi.controller`: Class gắn cờ `@RestController`. Tên kết thúc bằng `Controller` (VD: `UserController`).
- `com.thuetoi.service`: Chứa `interface` và class implements logic. (VD: `UserService`, `UserServiceImpl`).
- `com.thuetoi.repository`: Giao tiếp DB kéo dữ liệu. (VD: `UserRepository extends JpaRepository`).
- `com.thuetoi.entity`: Model Class. (VD: `User`).
- `com.thuetoi.dto.request`: Object nhận đầu vào. (VD: `UserRegisterRequest`).
- `com.thuetoi.dto.response`: Object trả về. (VD: `UserDTO`, `ApiResponse`).

## 4. ReactJS (Frontend)
**Nguyên tắc chung:**
- **Component / File chứa Component:** Dùng `PascalCase`. (VD: `Header.jsx`, `UserProfile.jsx`).
- **Tên File Hook / Tên thư mục:** Dùng camelCase chữ thường. (VD: `useAuth.js`, `api/`, `pages/`).
- **Hàm xử lý sự kiện trong Component:** Thêm hậu tố/tiền tố ngữ cảnh. (VD: `handleSubmit`, `onCloseModal`).
