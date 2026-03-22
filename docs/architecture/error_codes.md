# Quy Chuẩn Xử Lý Lỗi (Error Code Dictionary)

Tài liệu này định nghĩa chuẩn phản hồi lỗi giữa Backend và Frontend để toàn bộ project xử lý đồng nhất, không hardcode thông báo rời rạc.

## 1. Cấu Trúc Phản Hồi Khi Có Lỗi

Khi backend trả lỗi, JSON phải có dạng:

```json
{
  "success": false,
  "code": "ERR_AUTH_02",
  "message": "Sai email hoặc mật khẩu",
  "data": null,
  "errors": null
}
```

Nếu là lỗi validation, backend trả thêm trường `errors`:

```json
{
  "success": false,
  "code": "ERR_SYS_02",
  "message": "Dữ liệu không hợp lệ",
  "data": null,
  "errors": {
    "email": "Email không đúng định dạng",
    "password": "Mật khẩu không được để trống"
  }
}
```

---

## 2. Error Dictionary

### 2.1. Lỗi Xác Thực & Phân Quyền (`ERR_AUTH_***`)

| Code | Ý nghĩa | HTTP Status | Gợi ý cho Frontend |
| --- | --- | --- | --- |
| `ERR_AUTH_01` | Người dùng chưa đăng nhập | `401` | Điều hướng về màn login hoặc thử refresh token |
| `ERR_AUTH_02` | Sai email hoặc mật khẩu | `401` | Báo lỗi ngay tại form login |
| `ERR_AUTH_03` | Tài khoản đã bị khóa | `403` | Hiện thông báo chặn truy cập |
| `ERR_AUTH_04` | Không có quyền truy cập tài nguyên | `403` | Ẩn hoặc khóa hành động không được phép |
| `ERR_AUTH_05` | Email đã tồn tại | `409` | Highlight trường email |
| `ERR_AUTH_06` | Vai trò không hợp lệ | `400` | Chặn submit form đăng ký |
| `ERR_AUTH_07` | Tài khoản chưa xác thực email | `403` | Điều hướng sang màn nhập OTP |
| `ERR_AUTH_08` | OTP không hợp lệ | `400` | Hiển thị lỗi dưới ô OTP |
| `ERR_AUTH_09` | OTP đã hết hạn | `400` | Gợi ý gửi lại OTP |
| `ERR_AUTH_10` | Gửi lại OTP quá nhanh | `429` | Khóa nút resend tạm thời |
| `ERR_AUTH_11` | Refresh token không hợp lệ hoặc đã bị thu hồi | `401` | Xóa local auth state và về login |
| `ERR_AUTH_12` | Access token không hợp lệ hoặc đã hết hạn | `401` | Thử refresh token và retry request |
| `ERR_AUTH_14` | Không thể đăng ký với vai trò admin | `403` | Chặn submit form đăng ký |
| `ERR_AUTH_15` | Tài khoản đã được xác thực email | `409` | Ẩn flow OTP hoặc thông báo trạng thái |

### 2.2. Lỗi Người dùng (`ERR_USER_***`)

| Code | Ý nghĩa | HTTP Status | Gợi ý cho Frontend |
| --- | --- | --- | --- |
| `ERR_USER_01` | Không tìm thấy người dùng | `404` | Điều hướng về danh sách hoặc hiện empty state |

### 2.3. Lỗi Dự án (`ERR_PROJECT_***`)

| Code | Ý nghĩa | HTTP Status | Gợi ý cho Frontend |
| --- | --- | --- | --- |
| `ERR_PROJECT_01` | Không tìm thấy dự án | `400` hoặc `404` tùy ngữ cảnh | Hiển thị thông báo không tìm thấy dự án |

### 2.4. Lỗi Báo giá (`ERR_BID_***`)

| Code | Ý nghĩa | HTTP Status | Gợi ý cho Frontend |
| --- | --- | --- | --- |
| `ERR_BID_01` | Không tìm thấy báo giá | `400` hoặc `404` tùy ngữ cảnh | Khóa thao tác accept/update bid |

### 2.5. Lỗi Hệ thống (`ERR_SYS_***`)

| Code | Ý nghĩa | HTTP Status | Gợi ý cho Frontend |
| --- | --- | --- | --- |
| `ERR_SYS_01` | Lỗi hệ thống ngoài dự kiến | `500` | Hiện toast lỗi chung |
| `ERR_SYS_02` | Lỗi validation dữ liệu đầu vào | `400` | Highlight từng field theo object `errors` |
| `ERR_SYS_03` | Không thể gửi OTP/email hệ thống | `500` | Báo người dùng thử lại sau |

---

## 3. Nguyên tắc Sử dụng

- Backend phải luôn ưu tiên `BusinessException(code, message, status)` cho lỗi nghiệp vụ có chủ đích.
- Frontend ưu tiên dùng `code` để quyết định hành vi, không dựa vào so sánh chuỗi `message`.
- Message vẫn phải rõ ràng để hiển thị trực tiếp khi cần.
