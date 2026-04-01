# Kiến Trúc Lưu Trữ File (File Storage Workflow)

Hệ thống Thuê Tôi Freelancer hỗ trợ upload avatar cho user, attachments cho project/bid/message.

Tài liệu này định nghĩa phương pháp xử lý file upload, lưu trữ và cách Frontend hiển thị chúng theo marketplace_rules.md và ui_standard.md.

## 1. Phương Án Lưu Trữ (Storage Strategy)
Do tính chất là Đồ án Môn học, việc sử dụng các dịch vụ trả phí bên thứ 3 (như AWS S3, Cloudinary) có thể phức tạp trong việc chấm điểm (hoặc rủi ro thẻ tín dụng/API Key hết hạn).

**=> Quyết định: Sử dụng Local File System Storage (Lưu trực tiếp vào ổ cứng của Server Backend).**

Spring Boot sẽ hứng file từ React, lưu vào một thư mục tĩnh nằm ngoài mã nguồn (`/uploads`), và cấu hình ResourceHandler để biến các file đó thành đường link công khai (Static URL).

## 2. Cấu Trúc Thư Mục Upload (`backend/uploads`)
Thư mục `uploads` sẽ được đặt ngang hàng với backend. Thư mục này **bắt buộc đưa vào `.gitignore`**.

- `backend/uploads/avatars/`: Chứa ảnh đại diện người dùng. Tên file dạng: `user_{id}_timestamp.jpg`
- `backend/uploads/projects/`: Chứa attachments cho project/bid/message. Tên file dạng: `proj_{id}_timestamp.ext` or `msg_{id}_timestamp.ext`

## 3. Luồng Nghiệp Vụ Xử Lý File (File Upload Flow)

### Bước 1: Frontend (ReactJS) gửi File
- React dùng thẻ `<input type="file" accept="image/*" />` or for multiple.
- Gói file vào `FormData`.
- Gọi API với `Content-Type: multipart/form-data` (axiosClient handles).
```javascript
const formData = new FormData();
formData.append('file', selectedFile);
axiosClient.post('/api/v1/projects/{id}/upload', formData)
```

### Bước 2: Backend (Spring Boot) nhận và lưu File
- Controller nhận `MultipartFile` (use @RequestParam).
- Service generates unique name e.g. `proj_{id}_{timestamp}.png`, validates size/type per rules.
- Lưu vào `backend/uploads/projects/` or appropriate subdir.
- Cập nhật URL vào entity (e.g. attachments field).
- Trả về URL trong ApiResponse.

### Bước 3: Cấu hình Spring Boot Expose Thư Mục Tĩnh
Để React có thể render thẻ `<img src="http://localhost:8080/uploads/gigs/gig_1_172938473.png" />`, Spring Boot cần cấu hình `WebMvcConfigurer`:

```java
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Biến url /uploads/** trỏ thẳng vào thư mục file:///path/to/backend/uploads/
    registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:uploads/");
}
```

---
*Quy chuẩn bắt buộc: Luôn Validate kích thước file ở Backend (Ví dụ tối đa 2MB) để tránh bị phình ổ cứng.*
