# Manual Smoke Checklist

Checklist này dùng cho vòng QA local, review trước demo và regression sau mỗi slice lớn.

## 1. Chuẩn bị môi trường

1. Chạy `docker compose down -v` nếu cần reset DB sạch.
2. Chạy `docker compose up -d --build`.
3. Xác nhận:
   - Frontend mở được tại `http://localhost:5173`
   - Backend health trả `200` tại `http://localhost:8080/api/v1/health`
4. Xác nhận dữ liệu seed đã nạp khi volume DB rỗng.

## 2. Tài khoản demo

Sau khi import DB sạch từ `docs/database/seed.sql`, có thể đăng nhập bằng:

- `customer1@gmail.com / Demo@123`
- `freelancer1@gmail.com / Demo@123`
- `admin@gmail.com / Demo@123`

Lưu ý:

- `admin` dùng để kiểm tra dashboard quản trị, KYC, reports, withdrawals, broadcast và audit log.
- Auth runtime chuẩn vẫn hỗ trợ register + OTP bằng email thật cho user mới.

## 3. Auth smoke

1. Đăng nhập bằng `customer1@gmail.com`.
   - Kỳ vọng: login thành công, vào workspace, `GET /api/v1/auth/profile` trả đúng role `customer`.
2. Đăng xuất.
   - Kỳ vọng: access state local bị xóa, refresh cookie bị clear, quay lại trang auth nếu vào route bảo vệ.
3. Đăng nhập bằng `freelancer1@gmail.com`.
   - Kỳ vọng: login thành công, profile role là `freelancer`.
4. Tùy chọn: tạo 1 tài khoản mới bằng email thật rồi verify OTP.
   - Kỳ vọng: đăng ký gửi OTP, verify thành công, login được.

## 4. Khách hàng flow

1. Login bằng `customer1@gmail.com`.
2. Vào `Projects`.
3. Tạo 1 project mới với `budgetMin < budgetMax` và đính kèm 1 file hợp lệ.
   - Kỳ vọng: project mới xuất hiện trong danh sách `My Projects` với status `open`; attachment hiển thị tên file và mở được link Cloudinary.
4. Sửa project vừa tạo.
   - Kỳ vọng: title/description/budget cập nhật đúng.
5. Thử set status thủ công sang `in_progress` hoặc `completed` nếu UI/API cho phép.
   - Kỳ vọng: backend chặn với `ERR_SYS_02`.
6. Mở `Notifications`.
   - Kỳ vọng: danh sách notification của Khách hàng tải được, unread badge trên header/sidebar/bottom nav hiển thị đúng.

## 5. Freelancer flow

1. Login bằng `freelancer1@gmail.com`.
2. Vào `Projects`.
3. Xem project vừa tạo ở danh sách project mở.
   - Kỳ vọng: project hiển thị trong marketplace.
4. Gửi bid mới cho project đó và đính kèm 1 file proposal hợp lệ.
   - Kỳ vọng: bid tạo thành công với status `pending`; attachment hiển thị trong bid của Freelancer và danh sách bid của Khách hàng.
5. Mở `Notifications` hoặc quay lại Khách hàng để kiểm tra.
   - Kỳ vọng: Khách hàng nhận notification `bid`.
6. Với Freelancer, vào danh sách bid của mình.
   - Kỳ vọng: thấy bid vừa tạo.
7. Rút một bid còn `pending` nếu có dữ liệu phù hợp.
   - Kỳ vọng: Khách hàng sở hữu project nhận notification `bid` và link về `/workspace/projects`.

## 6. Accept bid -> contract -> milestone

1. Login lại bằng `customer1@gmail.com`.
2. Mở project vừa tạo, xem bid list.
3. Chấp nhận bid của Freelancer.
   - Kỳ vọng:
   - Bid được chọn chuyển `accepted`
   - Project chuyển `in_progress`
   - Hợp đồng mới xuất hiện ở `Contracts`
   - Freelancer nhận notification `contract`
4. Vào `Contracts`, chọn contract mới.
5. Tạo milestone mới với `title`, `amount`, `dueDate`.
   - Kỳ vọng:
   - Milestone mới xuất hiện trong danh sách với status `pending`
   - Freelancer nhận notification milestone mới

## 7. Collaboration flow

1. Trong `Contracts`, ở contract `in_progress`, gửi 1 tin nhắn text bằng Khách hàng.
   - Kỳ vọng: message xuất hiện đúng `senderId`, không cần client gửi `senderId`; Freelancer nhận notification `contract`.
2. Login bằng `freelancer1@gmail.com`, mở cùng contract.
   - Kỳ vọng: thấy lịch sử message của contract.
3. Gửi 1 tin nhắn file bằng nút chọn file thật.
   - Kỳ vọng: frontend upload qua `/api/v1/files/messages?contractId=...`, message file được tạo, link hiển thị theo `name`, `size`, `contentType`; participant còn lại nhận notification realtime.
4. Thử gửi message khi contract đã kết thúc.
   - Kỳ vọng: backend chặn với `ERR_SYS_02`.
5. Thử upload file sai loại, file rỗng hoặc quá 5 MB.
   - Kỳ vọng: backend chặn với `ERR_FILE_01`; UI hiển thị lỗi upload thân thiện.

## 8. Complete contract -> review

1. Login bằng một trong hai participant.
2. Cập nhật contract sang `completed`.
   - Kỳ vọng:
   - Contract đổi status `completed`
   - `endDate` được set
   - Project liên quan đổi `completed`
   - Participant còn lại nhận notification trạng thái hợp đồng
3. Tạo review cho contract đã hoàn thành.
   - Kỳ vọng: review tạo thành công; participant còn lại nhận notification `contract`.
4. Thử tạo review lần thứ hai bằng cùng user.
   - Kỳ vọng: backend chặn với `409` và `ERR_SYS_02`.
5. Login user còn lại và tạo review của họ.
   - Kỳ vọng: cả hai review hiển thị đúng ở contract.

## 9. Notification flow

1. Kiểm tra các event sau có sinh notification:
   - bid mới
   - bid bị từ chối, bị rút hoặc không được chọn
   - contract mới
   - milestone mới, hoàn thành hoặc bị hủy
   - contract hoàn thành hoặc bị hủy
   - message mới và review mới
   - user gửi KYC request, Quản trị viên nhận notification ở `/workspace/admin/kyc`
   - KYC approved/rejected, user nhận notification ở `/workspace/profile`
   - user gửi report, Quản trị viên nhận notification ở `/workspace/admin/reports`, reporter nhận xác nhận
   - report resolved/dismissed, reporter nhận notification ở `/workspace/notifications`
   - withdrawal approved/rejected, user nhận notification ở `/workspace/notifications`
   - admin broadcast tới target role, từng user nhận realtime notification
2. Kiểm tra realtime.
   - Kỳ vọng: khi action được trigger từ tab/tài khoản khác, notification mới xuất hiện không cần refresh và unread badge tăng đúng.
3. Ngắt/kết nối lại mạng hoặc restart backend ngắn rồi trigger notification mới.
   - Kỳ vọng: sau khi WebSocket reconnect, inbox tự reload âm thầm và không bỏ sót notification mới.
4. Mở cùng user ở 2 tab, bấm `Đánh dấu đã đọc` hoặc `Đánh dấu tất cả đã đọc` ở tab thứ nhất.
   - Kỳ vọng: tab thứ hai tự sync lại unread badge/inbox mà không cần refresh thủ công.
5. Dùng filter trong `Notifications`.
   - Kỳ vọng: lọc được theo type `project`, `bid`, `contract`, `system` và chế độ chỉ chưa đọc.
6. Nếu có nhiều notification, chuyển trang.
   - Kỳ vọng: range phân trang đúng, nút trang trước/sau không vượt biên.
7. Tại `Notifications`, bấm `Đánh dấu đã đọc`.
   - Kỳ vọng: `isRead` cập nhật về `true`.
8. Tại `Notifications`, bấm `Đánh dấu tất cả đã đọc`.
   - Kỳ vọng: API trả `updatedCount`, unread badge về 0, các item chuyển trạng thái đã đọc.
9. Nếu notification có `link`, bấm mở liên kết.
   - Kỳ vọng: item được mark read trước khi điều hướng đúng workspace liên quan.

## 10. Regression technical gate

Chạy các lệnh sau trước khi review hoặc demo:

- Frontend: `npm run lint`
- Frontend: `npm run build`
- Backend local: `cd backend && mvn test`
- Backend Docker: `docker run --rm -v "${PWD}\\backend:/app" -w /app maven:3.9.6-eclipse-temurin-21 mvn test`

Kỳ vọng:

- Không lỗi lint
- Build production thành công
- Backend test pass toàn bộ
