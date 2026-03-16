# Kiến Trúc Nhận Diện Người Dùng (Auth & Session Flow)

Tài liệu này giải thích cách Frontend (ReactJS) và Backend (Spring Boot) giao tiếp bảo mật với nhau để thoả mãn đúng yêu cầu đồ án: **"ReactJS gọi API" + "Giỏ hàng phải dùng HTTP Session"**.

## 1. Vấn Đề Gặp Phải (The Problem)
Theo truyền thống, HTTP Session (JSESSIONID) hoạt động mượt mà khi Backend tự render giao diện (JSP/Thymeleaf) vì nó cùng một tên miền (Origin). 
Tuy nhiên, khi ReactJS (Chạy ở `localhost:5173`) gọi API sang Spring Boot (`localhost:8080`), trình duyệt sẽ chặn Cookie (Cross-Origin Resource Sharing - CORS) khiến 1 người dùng gọi API 2 lần sẽ bị máy chủ coi là 2 Khách Hàng khác nhau (Mất Session Giỏ Hàng).

## 2. Giải Pháp Chuẩn Chuyên Nghiệp (The Solution)
Chúng ta sẽ giải quyết bằng kiến trúc **"Credentials Included CORS" + "Spring Session JDBC"**.

### Cấu hình Backend (Spring Boot)
1. **Bật CORS Origin Explicit:** Chặn dùng `*` cho `allowedOrigins`. Bắt buộc khai báo đích danh `http://localhost:5173`.
2. **Bật AllowCredentials:** Cài đặt `allowCredentials = true` trên bộ lọc CORS. Đây là chìa khoá để Response trả về được đính kèm Header `Set-Cookie`.
3. **Database Session Store:** Thay vì lưu Session trên RAM (Tomcat Memory) rất dễ bay màu khi tắt bật code, ta cài `spring.session.store-type=jdbc`. Khi đó Spring Boot sẽ tự tạo 2 bảng `spring_session` và `spring_session_attributes` trong MySQL để ghim Giỏ hàng vĩnh viễn cho đến khi bị xoá.

### Cấu hình Frontend (ReactJS / Axios)
Tất cả các lệnh `axios.get()` hay `post()` bắt buộc phải truyền cờ `withCredentials: true`.
*(Đã được cấu hình cứng trong file `src/api/axiosClient.js` của dự án, Developer không cần nhớ).*

---

## 3. Luồng Nghiệp Vụ (Business Flows)

### Flow 1: Khách Vô Danh Thêm Vào Giỏ Hàng (Guest Add-to-Cart)
1. **Client**: Người dùng bấm "Thêm dịch vụ Logo vào giỏ". `axiosClient` gọi `POST /api/v1/cart/items`.
2. **Server**: Nhận Request. Thấy chưa có Session ID -> Tạo Session mới (Lưu giỏ hàng vào bảng MySQL Session).
3. **Server**: Trả kết quả `200 OK` kèm Header `Set-Cookie: JSESSIONID=abc123xyz...`
4. **Browser**: Tự động lưu Cookie `JSESSIONID` vào Local.
5. **Client**: Từ lần gọi API thứ 2 trở đi, Browser tự động đính kèm Cookie `JSESSIONID`. Server móc ra được Giỏ hàng cũ.

### Flow 2: Đăng Nhập Hệ Thống (Login Flow)
1. **Client**: Người dùng nhập form, `POST /api/v1/auth/login`.
2. **Server**: Kiểm tra pass (BCrypt). Nếu đúng -> Tìm Session hiện tại (nếu có Giỏ Hàng cũ) và cấp quyền (Authenticate) cho Session đó thành `Authentication=User`.
3. Lúc này, Giỏ hàng lúc Vô Dành (Guest) sẽ chính thức được "Nhập hộ khẩu" vào Tài khoản của khách hàng này.

### Flow 3: Thanh Toán (Checkout & Clear Session)
1. **Client**: Người dùng vào Giỏ Hàng, bấm "Thanh Toán". Gọi `POST /api/v1/orders/checkout`.
2. **Server**: Kiểm tra Security -> Lấy Giỏ Hàng từ Session hiện tại (JSESSIONID).
3. **Server**: Tạo bảng `Order` ghi vào CSDL.
4. **Server**: Xoá sạch (Invalidate / Clear) dữ liệu Giỏ Hàng trong Session.
5. **Client**: Nhận `200 OK`, chuyển trang sang màn "Cảm ơn", gọi API lấy Giỏ Hàng mới sẽ thấy trống rỗng (Đúng yêu cầu đề bài).

---
*Lưu ý cho Developer React: Các bạn không cần thao tác đọc/ghi Cookie thủ công. Việc đó trình duyệt và Axios (`withCredentials`) sẽ tự lo. Chỉ việc quản lý state UI.*
