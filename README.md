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
  *(Cấu hình Hot-reload tĩnh: Bạn sửa code trong thư mục `/frontend`, trình duyệt sẽ tự tải lại).*
- **Backend API (Spring Boot):** [http://localhost:8080/api](http://localhost:8080/api) 
  *(Để xem API, hãy truy cập các endpoint tuỳ chỉnh của Controller sau này).*

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
