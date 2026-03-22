# Kiến Trúc Xác Thực JWT + OTP (Auth Flow)

Tài liệu này mô tả luồng xác thực chính thức của dự án **Thuê Tôi** sau khi thống nhất theo mô hình:

- `JWT access token` cho các API nghiệp vụ.
- `Refresh token` lưu dưới dạng `HttpOnly cookie` để refresh an toàn.
- `OTP email` dùng cho bước xác thực tài khoản trước khi đăng nhập.

## 1. Mục tiêu Kiến trúc

Hệ thống cần giải quyết đồng thời 4 yêu cầu nghiệp vụ:

1. ReactJS gọi API tách biệt với Backend Spring Boot.
2. Người dùng đăng nhập được trên SPA mà không phải nhập lại liên tục.
3. Tài khoản mới phải xác thực email trước khi được tham gia nghiệp vụ.
4. Backend vẫn kiểm soát được việc revoke/rotate refresh token khi đăng xuất hoặc refresh.

## 2. Nguyên tắc Kỹ thuật

### 2.1. Access Token

- Là JWT sống ngắn.
- Frontend lưu ở local state hoặc local storage tùy chiến lược UI.
- Mọi request cần đăng nhập phải gửi:

```http
Authorization: Bearer <access_token>
```

### 2.2. Refresh Token

- Không trả về để frontend tự lưu thủ công.
- Được backend set vào `HttpOnly cookie`.
- Frontend phải bật `withCredentials: true` để trình duyệt tự gửi cookie khi gọi `/api/v1/auth/refresh`.
- Refresh token được lưu trong DB dưới dạng mã băm để phục vụ revoke/rotate.

### 2.3. OTP Xác thực Email

- User mới đăng ký sẽ có trạng thái `verified = false`.
- OTP chỉ dùng cho mục đích `verify_email`.
- Chỉ khi OTP hợp lệ, user mới chuyển sang `verified = true` và được phép login.
- Runtime chuẩn không cung cấp endpoint debug để đọc OTP trực tiếp từ hệ thống.

---

## 3. Luồng Nghiệp Vụ Chuẩn

### Flow 1: Đăng ký tài khoản

1. **Client** gọi `POST /api/v1/auth/register`.
2. **Server** validate `email`, `password`, `fullName`, `role`.
3. **Server** chỉ chấp nhận `freelancer` hoặc `customer`.
4. **Server** tạo user với:
   - `is_active = true`
   - `verified = false`
5. **Server** sinh OTP xác thực email, lưu vào DB và gửi email.
6. **Client** nhận thông báo đăng ký thành công và chuyển sang màn nhập OTP.

### Flow 2: Xác thực email bằng OTP

1. **Client** gọi `POST /api/v1/auth/verify-email-otp` với `email` và `otp`.
2. **Server** kiểm tra:
   - OTP có tồn tại hay không
   - OTP đã dùng chưa
   - OTP còn hạn hay không
   - OTP có khớp với email hay không
3. **Server** cập nhật `verified = true` cho user nếu hợp lệ.
4. **Client** nhận thông báo xác thực thành công và có thể chuyển sang bước đăng nhập.

### Flow 3: Gửi lại OTP

1. **Client** gọi `POST /api/v1/auth/resend-verification-otp`.
2. **Server** kiểm tra:
   - User có tồn tại không
   - User đã xác thực chưa
   - Có đang gửi OTP quá nhanh hay không
3. **Server** sinh OTP mới và gửi lại email.

### Flow 4: Đăng nhập

1. **Client** gọi `POST /api/v1/auth/login` với `email`, `password`.
2. **Server** kiểm tra:
   - Email và mật khẩu đúng
   - Tài khoản còn hoạt động
   - Tài khoản đã xác thực email
3. **Server** sinh `access token`.
4. **Server** sinh `refresh token`, lưu bản băm vào DB, đồng thời set vào `HttpOnly cookie`.
5. **Server** trả `accessToken` và `user profile` trong body.
6. **Client** dùng access token cho các request nghiệp vụ tiếp theo.

### Flow 5: Truy cập API yêu cầu đăng nhập

1. **Client** gửi `Authorization: Bearer <access_token>`.
2. **JWT Filter** xác thực token, lấy `userId` và `role` từ claims.
3. **Security Context** gắn user hiện tại vào request.
4. **Controller/Service** đọc principal để kiểm tra quyền và ownership nghiệp vụ.

### Flow 6: Refresh Access Token

1. **Client** nhận `401` khi access token hết hạn hoặc gọi chủ động `POST /api/v1/auth/refresh`.
2. **Browser** tự gửi `refresh token cookie`.
3. **Server** kiểm tra refresh token:
   - JWT hợp lệ
   - Có tồn tại bản ghi băm trong DB
   - Chưa bị revoke
   - Chưa hết hạn
4. **Server** revoke refresh token cũ.
5. **Server** phát hành access token mới và refresh token mới.
6. **Server** set lại `HttpOnly cookie` mới.
7. **Client** dùng access token mới để retry request cũ.

### Flow 7: Đăng xuất

1. **Client** gọi `POST /api/v1/auth/logout`.
2. **Browser** tự gửi refresh token cookie hiện tại.
3. **Server** revoke refresh token đó trong DB.
4. **Server** trả `Set-Cookie` để xóa cookie ở trình duyệt.
5. **Client** xóa access token cục bộ và state user.

---

## 4. Ràng buộc Nghiệp vụ

- User chưa xác thực email:
  - Được đăng ký lại OTP.
  - Chưa được đăng nhập.
  - Chưa được tạo project, gửi bid, hay tham gia nghiệp vụ cần xác thực.
- User role `admin`:
  - Không được phép đăng ký công khai từ frontend.
- Các API mang tính “của tôi”:
  - Không nhận `userId` từ body/query nếu có thể suy ra từ access token.
  - Ưu tiên đọc principal hiện tại từ JWT.

---

## 5. Tác động tới Frontend

- Axios phải bật `withCredentials: true`.
- Axios phải tự gắn header bearer token khi đã đăng nhập.
- Khi gặp `401`, frontend nên thử refresh access token bằng cookie rồi retry request một lần.
- Frontend không đọc hoặc ghi refresh token thủ công.

---

## 6. Tóm tắt Endpoint Chuẩn

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email-otp`
- `POST /api/v1/auth/resend-verification-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/profile`
