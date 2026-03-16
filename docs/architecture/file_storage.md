# Kiến Trúc Lưu Trữ File (File Storage Workflow)

Hệ thống E-commerce Thuê Tôi đòi hỏi người dùng (Freelancer) phải đăng các Gói Dịch Vụ (Gigs) kèm theo Ảnh Minh Hoạ (Thumbnail), hoặc upload Ảnh Đại Diện (Avatar).

Tài liệu này định nghĩa phương pháp xử lý file upload, lưu trữ và cách Frontend hiển thị chúng.

## 1. Phương Án Lưu Trữ (Storage Strategy)
Do tính chất là Đồ án Môn học, việc sử dụng các dịch vụ trả phí bên thứ 3 (như AWS S3, Cloudinary) có thể phức tạp trong việc chấm điểm (hoặc rủi ro thẻ tín dụng/API Key hết hạn).

**=> Quyết định: Sử dụng Local File System Storage (Lưu trực tiếp vào ổ cứng của Server Backend).**

Spring Boot sẽ hứng file từ React, lưu vào một thư mục tĩnh nằm ngoài mã nguồn (`/uploads`), và cấu hình ResourceHandler để biến các file đó thành đường link công khai (Static URL).

## 2. Cấu Trúc Thư Mục Upload (`backend/uploads`)
Thư mục `uploads` sẽ được đặt ngang hàng với file chạy jar (hoặc cấp root của project backend). Thư mục này **bắt buộc đưa vào `.gitignore`**.

- `backend/uploads/avatars/`: Chứa ảnh đại diện người dùng. Tên file dạng: `user_{id}_timestamp.jpg`
- `backend/uploads/gigs/`: Chứa ảnh minh hoạ của gói dịch vụ. Tên file dạng: `gig_{id}_timestamp.png`

## 3. Luồng Nghiệp Vụ Xử Lý File (File Upload Flow)

### Bước 1: Frontend (ReactJS) gửi File
- React dùng thẻ `<input type="file" accept="image/png, image/jpeg" />`
- Gói file vào đối tượng `FormData`.
- Gọi API bằng Axios với Header `Content-Type: multipart/form-data`.
```javascript
const formData = new FormData();
formData.append('image', selectedFile);
axiosClient.post('/api/v1/gigs/1/upload-image', formData)
```

### Bước 2: Backend (Spring Boot) nhận và lưu File
- Controller nhận `MultipartFile`.
- Service lấy đuôi file gốc (extension), tự động đổi tên file theo chuẩn `gig_1_172938473.png` để tránh trùng lặp.
- Lưu file vào thư mục vật lý `backend/uploads/gigs/`.
- Cập nhật đường link Cầm tay (Relative Path) vào CSDL: `/uploads/gigs/gig_1_172938473.png`.
- Trả về API chuỗi URL đó cho Frontend.

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
