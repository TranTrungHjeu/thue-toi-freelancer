# Quy Chuẩn Xử Lý Lỗi (Error Code Dictionary)

Tài liệu này định nghĩa cách Backend báo lỗi cho Frontend, giúp Frontend không cần hardcode (gắn cứng) chữ thông báo lỗi bằng Tiếng Việt, mà chỉ cần xét mã (Code) để tự động dịch ra thông báo tương ứng. 

Điều này thể hiện **Trình Độ Chuyên Nghiệp (Professional Vibe)** cho dự án ứng dụng thực tế phân tán.

## 1. Cấu Trúc Phản Hồi Khi Có Lỗi (ApiResponse)
Khi Backend gặp lỗi, JSON trả về luôn có dạng `success: false` kèm trường `code`:

```json
{
  "success": false,
  "code": "ERR_AUTH_02",
  "message": "Sai mật khẩu hoặc email không tồn tại",
  "data": null
}
```

## 2. Від Điển Mã Lỗi (Error Dictionary)

### 2.1 Lỗi Xác Thực & Phân Quyền (`ERR_AUTH_***`)
| Mã Lỗi (Code) | Ý nghĩa (Meaning) | Action gợi ý cho Frontend |
| ----------- | --------------- | ----------------------- |
| `ERR_AUTH_01` | Người dùng chưa đăng nhập. (401 Unauthorized) | Redirect về `/login`. |
| `ERR_AUTH_02` | Sai email hoặc mật khẩu. | Hiển thị chữ đỏ dưới form đăng nhập. |
| `ERR_AUTH_03` | Tài khoản đã bị khoá / Disable. | Hiện Popup báo "Tài khoản bị cấm". |
| `ERR_AUTH_04` | Không có quyền truy cập (Role). (403 Forbidden) | Báo "Bạn không có quyền vào trang này". |
| `ERR_AUTH_05` | Email đã tồn tại khi đăng ký mới. | Đỏ field Email ở trang Register. |

### 2.2 Lỗi Nghiệp Vụ Giỏ Hàng & Đơn Hàng (`ERR_ORDER_***`)
| Mã Lỗi (Code) | Ý nghĩa (Meaning) | Action gợi ý cho Frontend |
| ----------- | --------------- | ----------------------- |
| `ERR_ORDER_01` | Giỏ hàng trống, không thể thanh toán. | Ẩn nút thanh toán / Báo nhắc thêm đồ. |
| `ERR_ORDER_02` | Dịch vụ (Gig) này đã ngừng bán rồ.i | Đánh dấu đỏ item trong giỏ hàng. |
| `ERR_ORDER_03` | Thanh toán thất bại (Mock error). | Hiện Popup Lỗi Thanh Toán. |
| `ERR_ORDER_04` | Không tìm thấy đơn hàng (Order Not Found). | Điều hướng về trang danh sách đơn. |
| `ERR_ORDER_05` | Đơn hàng đã xử lý xong hoặc huỷ, không thể đổi trạng thái. | Khoá Nút "Huỷ Đơn". |

### 2.3 Lỗi Dịch Vụ / Gig (`ERR_GIG_***`)
| Mã Lỗi (Code) | Ý nghĩa (Meaning) | Action gợi ý cho Frontend |
| ----------- | --------------- | ----------------------- |
| `ERR_GIG_01` | Không tìm thấy dịch vụ tương ứng. (404 Not Found) | Hiển thị màn hình 404 Không Tìm Thấy. |
| `ERR_GIG_02` | Freelancer không được tự mua dịch vụ của chính mình. | Vô hiệu hoá nút Mua của Dịch Vụ này. |

### 2.4 Lỗi Hệ Thống Chung (`ERR_SYS_***`)
| Mã Lỗi (Code) | Ý nghĩa (Meaning) | Action gợi ý cho Frontend |
| ----------- | --------------- | ----------------------- |
| `ERR_SYS_01` | Lỗi phía máy chủ (Exception rác). (500 Internal Error) | Hiện Toast báo "Hệ thống đang bận". |
| `ERR_SYS_02` | Lỗi Validation (Dữ liệu gửi lên sai định dạng). | Quét Object `errors` để đỏ các Input. |

---

## 3. Cách Sử Dụng Trong Spring Boot
Lập trình viên backend khi quăng lỗi `BusinessException` chỉ việc điền đúng mã code này:

```java
// Thay vì ném lỗi tuỳ hứng:
throw new RuntimeException("Bạn không thể mua đồ của chính mình"); // SAI (Vibe Code)

// Phải sử dụng chuẩn Error Code:
throw new BusinessException("ERR_GIG_02", "Không được tự mua dịch vụ của chính mình"); // ĐÚNG XỊN (Professional Code)
```
