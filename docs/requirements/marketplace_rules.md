# Marketplace Rules

Tài liệu này chốt các rule nghiệp vụ chính cho các module `project`, `bid`, `contract`, `milestone`, `message`, `review`.

## 1. Project

- Chỉ `customer` đã đăng nhập mới được tạo project.
- `project.status` hợp lệ gồm: `open`, `in_progress`, `completed`, `cancelled`.
- `customer` không được tự cập nhật project sang `in_progress` hoặc `completed` bằng tay.
- `in_progress` và `completed` được đồng bộ từ luồng hợp đồng.

## 2. Bid

- Chỉ `freelancer` mới được gửi bid.
- Freelancer không được gửi bid cho chính project của mình.
- Chỉ project đang `open` mới nhận bid mới.
- `bid.status` hợp lệ gồm: `pending`, `accepted`, `rejected`, `withdrawn`.
- `accepted` chỉ được tạo ra từ endpoint chấp nhận bid của customer.
- Freelancer chỉ được rút bid của chính mình (`withdrawn`) khi bid còn `pending`.
- Customer chỉ được từ chối bid (`rejected`) khi bid còn `pending`.

## 3. Contract

- Hợp đồng chỉ được tạo từ một `bid` hợp lệ của project.
- Customer phải là chủ sở hữu project tương ứng.
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
