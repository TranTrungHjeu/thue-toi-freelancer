# Quy Chuẩn UI/UX "Strict Sharpness" - Thuê Tôi Platform

Tài liệu này quy định các tiêu chuẩn thiết kế và cách sử dụng các thành phần UI để đảm bảo tính đồng nhất, chuyên nghiệp cho toàn bộ hệ thống.

---

## 1. Triết lý Thiết kế: Strict Sharpness

Hệ thống được xây dựng trên sự tối giản, chính xác và mạnh mẽ.

- **Góc vuông tuyệt đối**: `border-radius: 0` cho tất cả Button, Input, Card, Modal.
- **Viền đậm sắc nét**: Sử dụng `border-2` (2px) thay vì 1px cho các thành phần quan trọng để tạo điểm nhấn.
- **Tương phản cao**: Sử dụng màu nền trắng/xám siêu nhạt kết hợp với chữ và viền màu tối (Slate-900/950).

---

## 2. Hệ thống Tokens

### 2.1. Màu sắc (Theme 60-30-10)

- **Primary (60%)**: `bg-white` hoặc `bg-slate-50`. Nền tảng sạch sẽ.
- **Secondary (30%)**: `bg-secondary-900` (Slate-900). Dùng cho Sidebar, Header, các mảng khối điều hướng lớn.
- **Accent (10%)**: `bg-primary-600` (Emerald-600). Dùng cho các hành động quan trọng (Call to Action).

### 2.2. Typography

- **Tiêu đề (Lora)**: Font Serif, dùng cho H1, H2, H3 để tạo cảm giác sang trọng, tin cậy.
- **Nội dung (Manrope)**: Font Sans-serif, dùng cho thân bài, input, nút bấm để đảm bảo độ đọc tốt nhất.

---

## 3. Quy tắc Sử dụng Thành phần

### 3.1. Nhập liệu & Tương tác

- **Input**: Luôn đi kèm Label và Placeholder rõ ràng.
- **TagInput**: Dùng khi cần nhập nhiều giá trị (vd: Kỹ năng). Tự động phân tách bằng dấu "Phẩy".
- **ToggleGroup**: Dùng để chuyển đổi nhanh 2-3 trạng thái cùng cấp (vd: View Grid/List).

### 3.2. Hiển thị Dữ liệu

- **Table**: Chỉ dùng trên Desktop.
- **ResponsiveTable**: Bắt buộc dùng cho các trang quản trị để tự động chuyển sang Card View trên Mobile.
- **StatCard**: Dùng để hiển thị các con số quan trọng trên Dashboard (vd: Thu nhập, Dự án).

### 3.3. Phản hồi & Trạng thái

- **Modal**: Dùng cho Desktop để thực hiện các luồng phức tạp (vd: Tạo hợp đồng).
- **ActionSheet**: **Bắt buộc trên Mobile** thay cho Modal cho các lựa chọn nhanh (vd: Menu tùy chọn dự án).
- **Toast**: Thông báo kết quả hành động (Thành công, Lỗi) ở góc màn hình, tự biến mất sau 3 giây.

---

## 4. Tối ưu hóa Mobile

Mọi thành phần mới phải được kiểm tra theo các tiêu chí sau:

1. **Dễ thao tác bằng một tay**: Các nút quan trọng dùng `BottomNav` hoặc `ActionSheet`.
2. **Hit-area lớn**: Nút bấm trên mobile tối thiểu cao 44px.
3. **PullToRefresh**: Luôn tích hợp cho các danh sách dài để người dùng dễ cập nhật.
4. **FloatingActionButton (FAB)**: Dùng cho hành động duy nhất, quan trọng nhất của màn hình (vd: Đăng tin).

---

## 5. Quy trình làm việc Team

1. **Kiểm tra Gallery**: Trước khi làm thành phần mới, hãy vào `/gallery` để xem đã có thành phần tương tự chưa.
2. **Tái sử dụng**: Tuyệt đối không viết lại CSS/HTML cho những thứ đã có trong `src/components/common`.
3. **Cập nhật Standard**: Nếu có kiến trúc UI mới được duyệt, hãy cập nhật vào file này ngay lập tức.

---

*“Sharp lines, sharp work.”* - Team Thuê Tôi.
