# Demo Runbook

Runbook này giúp team demo dự án theo đúng trục nghiệp vụ marketplace, tránh demo rời rạc từng màn.

## 1. Mục tiêu demo

Demo cần chứng minh được 4 điểm:

1. Auth flow đang chạy theo JWT + refresh cookie + profile.
2. Luồng marketplace core chạy trọn từ project đến contract.
3. Sau khi có contract, hai bên có thể cộng tác bằng milestone, message, review và notification.
4. Hệ thống có đủ tài liệu, test và dữ liệu seed để review lại.

## 2. Chuẩn bị trước demo

1. Nếu cần dữ liệu sạch, chạy `docker compose down -v`.
2. Chạy `docker compose up -d --build`.
3. Xác nhận frontend và backend health đều lên.
4. Dùng sẵn tài khoản seed:
   - `customer1@gmail.com / Demo@123`
   - `freelancer1@gmail.com / Demo@123`
   - `admin@gmail.com / Demo@123`
5. Chuẩn bị sẵn 2 trình duyệt hoặc 1 trình duyệt + 1 cửa sổ ẩn danh để chuyển vai trò nhanh.

## 3. Kịch bản demo khuyến nghị

### Màn 1. Đăng nhập và profile

1. Login bằng `customer1@gmail.com`.
2. Mở `Profile` hoặc khu vực thông tin user.
3. Nhấn mạnh:
   - user lấy từ `GET /api/v1/auth/profile`
   - role đang là `customer`
   - app dùng JWT access token và refresh cookie

### Màn 2. Customer tạo project

1. Vào `Projects`.
2. Tạo project mới với title dễ nhận biết, ví dụ `Demo landing page doanh nghiệp`.
3. Chỉ ra project mới có status `open`.
4. Nếu cần, sửa lại project để chứng minh owner có quyền cập nhật.

### Màn 3. Freelancer gửi bid

1. Chuyển sang tài khoản `freelancer1@gmail.com`.
2. Vào `Projects`, thấy project `open` vừa tạo.
3. Gửi bid với giá, mô tả và thời gian dự kiến.
4. Nhấn mạnh rule:
   - chỉ freelancer được bid
   - bid mới tạo ở trạng thái `pending`

### Màn 4. Customer chấp nhận bid và tạo contract

1. Quay lại `customer1@gmail.com`.
2. Mở project vừa tạo, xem bid list.
3. Chấp nhận bid.
4. Trình bày các hệ quả nghiệp vụ:
   - bid được chọn thành `accepted`
   - project thành `in_progress`
   - contract được tạo
   - notification cho freelancer được phát sinh

### Màn 5. Milestone và collaboration

1. Vào `Contracts`, chọn contract mới.
2. Tạo một milestone mới.
3. Gửi một tin nhắn text trong contract.
4. Chuyển sang freelancer để cho thấy:
   - milestone đã xuất hiện
   - message đã đồng bộ
   - notification contract/milestone hiển thị ở `Notifications`

### Màn 6. Hoàn thành contract và review

1. Dùng một participant cập nhật contract sang `completed`.
2. Chỉ ra:
   - contract có `endDate`
   - project liên quan cũng thành `completed`
3. Tạo review từ một bên.
4. Nếu còn thời gian, tạo review từ bên còn lại để chứng minh rule “mỗi user một lần mỗi contract”.

### Màn 7. Notification center

1. Mở `Notifications`.
2. Cho thấy type badge, unread count, mark-as-read và điều hướng bằng `link`.
3. Nêu các event hiện có:
   - bid mới
   - bid bị từ chối hoặc không được chọn
   - contract mới
   - milestone mới
   - contract hoàn thành hoặc bị hủy

## 4. Fallback demo

Nếu luồng live phát sinh lỗi do dữ liệu hoặc thời gian, có thể dùng dữ liệu seed sẵn:

- Seed đã có project `open`
- Seed đã có contract `in_progress`
- Seed đã có milestone, message, review và notification mẫu

Fallback này giúp vẫn chứng minh được màn hình và contract API ngay cả khi không chạy trọn live flow.

## 5. Quality gate nên nêu khi kết demo

- Frontend `lint` pass
- Frontend `build` pass
- Backend `mvn test` pass qua Docker
- API contract, checklist QA và demo runbook đã được ghi vào `docs/`
