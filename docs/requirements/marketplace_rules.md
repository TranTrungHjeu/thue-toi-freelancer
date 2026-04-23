# Marketplace Rules

Tài liệu này chốt các rule nghiệp vụ chính cho các module `project`, `bid`, `contract`, `milestone`, `message`, `review`.

## 1. Project

- Chỉ `customer` đã đăng nhập mới được tạo project.
- `project.status` hợp lệ gồm: `open`, `in_progress`, `completed`, `cancelled`.
- `customer` không được tự cập nhật project sang `in_progress` hoặc `completed` bằng tay.
- `in_progress` và `completed` được đồng bộ từ luồng hợp đồng.
- Admin chỉ được moderation project về `open` hoặc `cancelled`.
- Admin không được ép project sang `in_progress` hoặc `completed`, vì đây là trạng thái do contract flow quản lý.

## 2. Bid

- Chỉ `freelancer` mới được gửi bid.
- Freelancer không được gửi bid cho chính project của mình.
- Chỉ project đang `open` mới nhận bid mới.
- `bid.status` hợp lệ gồm: `pending`, `accepted`, `rejected`, `withdrawn`.
- `accepted` chỉ được tạo ra từ endpoint chấp nhận bid của customer.
- Freelancer chỉ được rút bid của chính mình (`withdrawn`) khi bid còn `pending`.
- Khách hàng chỉ được từ chối bid (`rejected`) khi bid còn `pending`.

## 3. Contract

- Hợp đồng chỉ được tạo từ một `bid` hợp lệ của project.
- Khách hàng phải là chủ sở hữu project tương ứng.
- Một project chỉ có tối đa một hợp đồng.
- Khi hợp đồng được tạo:
  - Bid được chọn chuyển sang `accepted`
  - Các bid còn lại chuyển sang `rejected` trừ bid đã `withdrawn`
  - `project.status` chuyển sang `in_progress`
- `contract.status` hợp lệ gồm: `in_progress`, `completed`, `cancelled`.
- Hợp đồng đã ở trạng thái kết thúc không được đổi trạng thái lần nữa.
- Khi hợp đồng chuyển `completed` hoặc `cancelled`, `project.status` phải đồng bộ theo trạng thái đó.

## 4. Milestone

- Chỉ `customer` thuộc hợp đồng mới được tạo milestone.
- Chỉ hợp đồng đang `in_progress` mới được thêm milestone.
- `milestone.status` hợp lệ gồm: `pending`, `completed`, `cancelled`.

## 5. Message

- Chỉ participant của hợp đồng mới được đọc hoặc gửi tin nhắn.
- Chỉ hợp đồng đang `in_progress` mới cho phép gửi tin nhắn mới.
- `message_type` hợp lệ cho client gồm: `text`, `file`.
- Client không được tự gửi `sender_id`; backend phải lấy từ JWT principal.

## 6. Review

- Chỉ participant của hợp đồng mới được xem hoặc tạo review.
- Chỉ hợp đồng `completed` mới được tạo review.
- Mỗi user chỉ được đánh giá một lần cho mỗi hợp đồng.
- Client không được tự gửi `reviewer_id`; backend phải lấy từ JWT principal.

## 7. Skills

- Skills được chuẩn hóa trong bảng `skills`.
- User và Project có thể liên kết nhiều skills qua các bảng junction (`users_skills`, `projects_skills`).
- Khi tạo project hoặc cập nhật profile freelancer, skills phải được liên kết đúng.
- Backend nên validate skills tồn tại trước khi lưu.

## 8. Payments & Transactions

- Tất cả các trường tiền tệ (budget_min/max, price, agreed_price, amount) sử dụng DECIMAL(12,2) để tránh lỗi làm tròn.
- Milestones đại diện cho các khoản thanh toán theo mốc.
- Bảng `transaction_history` theo dõi lịch sử giao dịch (đã implement trigger trong ContractService).
- Thanh toán kích hoạt khi milestone hoàn thành hoặc contract completed.
- Cần enforce rules ownership và trạng thái trước khi xử lý transaction.
- Flyway V1 migration áp dụng schema đầy đủ.

## 9. Reports

- Chỉ user đã đăng nhập mới được gửi report.
- `reporter_id` phải lấy từ JWT principal, client không được tự gửi.
- `report.status` trong luồng admin chỉ chấp nhận `RESOLVED` hoặc `DISMISSED`.
- Khi user submit report, API chỉ trả `success` envelope, không trả raw entity nội bộ.

## 10. KYC

- User chỉ được tạo yêu cầu KYC cho chính mình.
- Admin chỉ được approve/reject các request đang ở trạng thái `PENDING`.
- Khi approve KYC, trạng thái verified của user phải được đồng bộ.

## 11. Admin & Security

- Toàn bộ `/api/v1/admin/**` phải yêu cầu role `ADMIN` ở backend, không chỉ dựa vào frontend.
- Backend phải bật method security để `@PreAuthorize` thực sự có hiệu lực.
- Trường hợp không có quyền phải trả `ERR_AUTH_04` với HTTP `403`, không được rơi xuống lỗi hệ thống `500`.
- Admin không được tự khóa/mở khóa chính mình.
- Admin không được tự hạ quyền của chính mình.
- Bulk admin actions không được bao gồm chính admin đang đăng nhập.
- Frontend phải có route guard riêng cho admin, không chỉ kiểm tra `isAuthenticated`.

## 12. Notification

- Giai đoạn hiện tại chỉ triển khai in-app notification và WebSocket realtime, chưa thêm email, push hoặc browser notification.
- Xưng hô role trong copy hiển thị phải thống nhất: `customer` là `Khách hàng`, `freelancer` là `Freelancer`, `admin` là `Quản trị viên`.
- `notification.type` chỉ dùng các giá trị hiện có: `project`, `bid`, `contract`, `system`.
- Backend phải chuẩn hóa `title`, `content`, `link` trước khi lưu; `type` trống mặc định là `system`, `type` không hợp lệ phải bị chặn.
- Notification nghiệp vụ phải được tạo từ backend service/controller theo event thật; client không được tự gửi `userId` để tạo notification cho người khác.
- Mọi notification được lưu phải emit realtime tới `/user/queue/notifications` bằng payload tương thích `NotificationResponse`.
- Admin broadcast phải lưu notification theo từng user nhận và emit từng user queue; frontend không phụ thuộc `/topic/global-notifications`.
- `PUT /notifications/read-all` chỉ được đánh dấu unread notifications của user hiện tại và phải trả `updatedCount`.
- STOMP `CONNECT` phải có access token hợp lệ; thiếu hoặc sai token phải bị từ chối.
- Inbox chính phải dùng pagination/filter để tránh tải toàn bộ notification khi dữ liệu lớn; `size` API phải có trần an toàn.
- Sau khi WebSocket reconnect, frontend phải reload inbox âm thầm để catch-up notification phát sinh trong lúc mất kết nối.
- Khi user mark read hoặc mark all read ở một tab, các tab khác của cùng user phải sync lại unread badge/inbox.
- Các notification có nguy cơ retry nhanh có thể dùng cơ chế recent duplicate guard theo `userId + type + title + content + link` trong một cửa sổ ngắn; không dùng guard này cho event có thể lặp hợp lệ như message chat.

Event bắt buộc sinh notification:

- Freelancer gửi bid, rút bid; Khách hàng từ chối bid; bid không được chọn khi accept bid khác.
- Contract được tạo, completed hoặc cancelled; milestone created, completed hoặc cancelled.
- Message mới và review mới trong contract.
- User gửi KYC request; KYC được approve hoặc reject.
- User gửi report; report được resolved hoặc dismissed.
- Withdrawal được approve hoặc reject.
- Quản trị viên đổi role, đổi trạng thái user, moderation project hoặc gửi broadcast.

Link workspace chuẩn cho notification:

- Bid/project moderation: `/workspace/projects`
- Contract/milestone/message/review: `/workspace/contracts`
- KYC admin: `/workspace/admin/kyc`
- KYC user: `/workspace/profile`
- Report admin: `/workspace/admin/reports`
- Report/withdrawal/system follow-up: `/workspace/notifications`
