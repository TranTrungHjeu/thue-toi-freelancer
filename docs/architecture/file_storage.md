# Kiến Trúc Lưu Trữ File (File Storage Workflow)

Hệ thống Thuê Tôi Freelancer hỗ trợ upload avatar cho user, attachments cho project/bid/message.

Tài liệu này định nghĩa phương pháp xử lý file upload, lưu trữ và cách Frontend hiển thị chúng theo marketplace_rules.md và ui_standard.md.

## 1. Phương Án Lưu Trữ (Storage Strategy)

Sau khi cân nhắc về tốc độ tải trang và áp lực lên băng thông máy chủ nội bộ, dự án đã được nâng cấp lên Hệ thống Lưu trữ Đám mây.

**=> Quyết định: Sử dụng Cloudinary API (Dịch vụ CDN Hình ảnh & Video).**

Spring Boot sẽ đóng vai trò là một Proxy trung chuyển: Hứng file hình ảnh (MultipartFile) từ ReactJS, sau đó kết nối trực tiếp với Cloudinary thông qua SDK `cloudinary-http44` để lưu trữ lên mây. Hình ảnh cuối cùng được lưu trữ trên database sẽ là Link HTTPS của Cloudinary dạng `https://res.cloudinary.com/...`

## 2. Cấu Trúc Thư Mục Upload Trên Cloudinary (`/thuetoi`)

Hệ thống sẽ tạo ra một Parent Folder mang tên `thuetoi/` trên Cloudinary để không bị lẫn lộn nếu bạn dùng chung tài khoản:

- `thuetoi/avatars/`: Chứa ảnh đại diện người dùng.
- `thuetoi/projects/`: Chứa attachments (tài liệu/hình ảnh) đính kèm vào Project/Bids.

Tên file: `UUID + Timestamp` để đảm bảo độc nhất hoàn toàn.

## 3. Luồng Nghiệp Vụ Xử Lý File (File Upload Flow)

### Bước 1: Frontend (ReactJS) gửi File

- React dùng thẻ `<input type="file" accept="image/*" />` or for multiple.
- Gói file vào `FormData`.
- Gọi API với `Content-Type: multipart/form-data` (axiosClient automatic handle).

```javascript
const formData = new FormData();
formData.append("file", selectedFile);
axiosClient.post("/v1/users/me/avatar", formData);
```

### Bước 2: Backend (Spring Boot) nhận và đẩy lên Cloudinary

- Controller nhận `MultipartFile` bằng `@RequestParam("file")`.
- `FileStorageService` kiểm tra kích thước file và tên file (chống upload mã độc).
- Gọi `cloudinary.uploader().upload()` đẩy mảng bytes lên đám mây.
- Trích xuất trường `secure_url` từ kết quả trả về của Cloudinary.
- Backend sẽ save cái `secure_url` này thẳng vào Database.

### Bước 3: Render Ảnh an toàn

Bởi vì `secure_url` là một đường dẫn công khai bắt đầu bằng `HTTPS://`, Frontend `<Avatar>` hay `<img>` có thể render trực tiếp URL đó mà không bị vướng mắc với tính năng phân quyền (CORS hay 403) của Backend. Các thiết lập lộ thư mục `/uploads/**` bị coi là không bảo mật đã bị gỡ bỏ khỏi Spring Security.

---

_Quy chuẩn bắt buộc: Backend vẫn chốt Max limits (5MB) tại application.properties `spring.servlet.multipart.max-file-size=5MB` để phòng chống tấn công băng thông (DDOS Upload) trước khi code chạm tới Cloudinary._
