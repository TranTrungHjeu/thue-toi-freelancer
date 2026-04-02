# API Contract Chính Thức

Tài liệu này chốt contract API hiện tại của dự án theo code đang chạy trong `backend/src/main/java/com/thuetoi/controller`, đồng thời bám:

- `docs/architecture/auth_session_flow.md`
- `docs/architecture/error_codes.md`
- `docs/requirements/marketplace_rules.md`

## 1. Quy ước chung

- Base URL backend: `/api/v1`
- Mọi response thành công hoặc lỗi đều bọc trong `ApiResponse`
- Access token gửi qua header:

```http
Authorization: Bearer <access_token>
```

- Refresh token không gửi trong body, mà đi qua cookie `thue_toi_refresh_token`
- Frontend phải bật `withCredentials: true`
- Các field ownership như `userId`, `senderId`, `reviewerId` phải suy ra từ JWT nếu endpoint là luồng “của tôi”

### 1.1. Response envelope

```json
{
  "success": true,
  "code": null,
  "message": "Mô tả ngắn gọn",
  "data": {},
  "errors": null
}
```

### 1.2. Response DTO chính

- `AuthUserResponse`: `id`, `email`, `fullName`, `role`, `avatarUrl`, `profileDescription`, `isActive`, `verified`, `createdAt`, `updatedAt`
- `ProjectResponse`: `id`, `user`, `title`, `description`, `budgetMin`, `budgetMax`, `deadline`, `status`, `createdAt`, `updatedAt`
- `BidResponse`: `id`, `project`, `freelancer`, `price`, `message`, `estimatedTime`, `attachments`, `status`, `createdAt`
- `ContractResponse`: `id`, `projectId`, `freelancerId`, `customerId`, `clientId`, `totalAmount`, `progress`, `status`, `startDate`, `endDate`
- `MilestoneResponse`: `id`, `contractId`, `title`, `amount`, `dueDate`, `status`
- `MessageResponse`: `id`, `contractId`, `senderId`, `messageType`, `content`, `attachments`, `sentAt`
- `ReviewResponse`: `id`, `contractId`, `reviewerId`, `rating`, `comment`, `reply`, `createdAt`, `updatedAt`
- `NotificationResponse`: `id`, `userId`, `type`, `title`, `content`, `link`, `isRead`, `createdAt`

## 2. Auth & profile

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | Không | `email`, `password`, `fullName`, `role`, `profileDescription?` | `AuthUserResponse` | Chỉ cho `freelancer` hoặc `customer`; tự gửi OTP verify email |
| `POST` | `/auth/verify-email-otp` | Không | `email`, `otp` | `null` | OTP đúng, chưa dùng, chưa hết hạn |
| `POST` | `/auth/resend-verification-otp` | Không | `email` | `null` | Cooldown resend; không cho user đã verify |
| `POST` | `/auth/login` | Không | `email`, `password` | `AuthTokenResponse` | Trả access token trong body, refresh token trong cookie |
| `POST` | `/auth/refresh` | Cookie | Không body | `AuthTokenResponse` | Rotate refresh token, revoke token cũ |
| `POST` | `/auth/logout` | Cookie | Không body | `null` | Revoke refresh token hiện tại và xóa cookie |
| `GET` | `/auth/profile` | Có | Không | `AuthUserResponse` | Lấy profile từ JWT principal |

### 2.1. `AuthTokenResponse`

```json
{
  "tokenType": "Bearer",
  "accessToken": "jwt",
  "accessTokenExpiresIn": 900000,
  "user": {
    "id": 1,
    "email": "customer1@gmail.com",
    "fullName": "Trần Khách Hàng",
    "role": "customer",
    "verified": true
  }
}
```

## 3. Health & user lookup

| Method | Path | Auth | Data success | Rule chính |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Không | health payload | Kiểm tra hệ thống |
| `GET` | `/users/{id}` | Không | `AuthUserResponse` | Phục vụ tra cứu user theo id |

## 4. Project

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/projects` | Không | Không | `ProjectResponse[]` | Chỉ trả project `open` trên marketplace |
| `POST` | `/projects` | Có | `title`, `description?`, `budgetMin`, `budgetMax`, `deadline?` | `ProjectResponse` | Chỉ `customer` được tạo |
| `GET` | `/projects/status/{status}` | Không | Path `status` | `ProjectResponse[]` | `status` hợp lệ: `open`, `in_progress`, `completed`, `cancelled` |
| `GET` | `/projects/search` | Không | Query `skills?`, `status?` | `ProjectResponse[]` | Skill-based search (tên kỹ năng), optional status |
| `GET` | `/projects/my` | Có | Không | `ProjectResponse[]` | Dự án của user hiện tại |
| `GET` | `/projects/user/{userId}` | Có | Path `userId` | `ProjectResponse[]` | Chỉ cho chính owner xem |
| `GET` | `/projects/{id}` | Không | Path `id` | `ProjectResponse` | Chi tiết project |
| `PUT` | `/projects/{id}` | Có | `ProjectRequest` | `ProjectResponse` | Owner được sửa, nhưng không được tự set `in_progress` hoặc `completed` |
| `DELETE` | `/projects/{id}` | Có | Path `id` | `null` | Chỉ owner được xóa |

## 5. Bid

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/bids` | Có | Không | `BidResponse[]` | Customer thấy bid vào project của mình, freelancer thấy bid của chính mình |
| `POST` | `/bids` | Có | `projectId`, `price`, `message?`, `estimatedTime?`, `attachments?` | `BidResponse` | Chỉ `freelancer`, không bid project của chính mình, project phải `open` |
| `GET` | `/bids/project/{projectId}` | Có | Path `projectId` | `BidResponse[]` | Chỉ owner project được xem |
| `GET` | `/bids/my` | Có | Không | `BidResponse[]` | Bid của freelancer hiện tại |
| `GET` | `/bids/freelancer/{freelancerId}` | Có | Path `freelancerId` | `BidResponse[]` | Chỉ cho chính freelancer đó |
| `GET` | `/bids/{id}` | Có | Path `id` | `BidResponse` | Chỉ owner bid hoặc owner project được xem |
| `POST` | `/bids/{bidId}/accept` | Có | Path `bidId` | `BidResponse` | Customer accept bid và tạo contract theo luồng chuẩn |
| `PUT` | `/bids/{bidId}/status` | Có | `{ "status": "withdrawn" \| "rejected" }` | `BidResponse` | Freelancer chỉ được `withdrawn`; customer chỉ được `rejected`; không accept bằng endpoint này |

## 6. Contract & milestone

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/contracts` | Có | Không | `ContractResponse[]` | Danh sách hợp đồng user được phép xem |
| `POST` | `/contracts` | Có | `{ "bidId": 123 }` | `ContractResponse` | Tạo contract từ bid được chọn; một project chỉ có tối đa một contract |
| `GET` | `/contracts/my` | Có | Không | `ContractResponse[]` | Hợp đồng của user hiện tại |
| `GET` | `/contracts/user/{userId}` | Có | Path `userId` | `ContractResponse[]` | Chỉ cho chính user đó |
| `POST` | `/contracts/{contractId}/milestones` | Có | `title`, `amount`, `dueDate?`, `status?` | `MilestoneResponse` | Chỉ `customer` của contract; contract phải `in_progress`; FE nên bỏ `status` để backend default `pending` |
| `GET` | `/contracts/{contractId}/milestones` | Có | Path `contractId` | `MilestoneResponse[]` | Chỉ participant được xem |
| `PUT` | `/contracts/{contractId}/status?status=completed\|cancelled` | Có | Query `status` | `ContractResponse` | Chỉ participant; chỉ đổi từ `in_progress` sang trạng thái kết thúc |
| `GET` | `/milestones` | Có | Không | `MilestoneResponse[]` | Toàn bộ milestone user được phép xem |

### 6.1. `dueDate`

- Chấp nhận `ISO-8601`
- Ví dụ hợp lệ:
  - `2026-03-31T19:02:35`
  - `2026-03-31T19:02:35+07:00`

## 7. Message

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/messages` | Có | `contractId`, `messageType?`, `content?`, `attachments?` | `MessageResponse` | Chỉ participant, contract phải `in_progress`, `messageType` hợp lệ: `text`, `file` |
| `GET` | `/messages/contract/{contractId}` | Có | Path `contractId` | `MessageResponse[]` | Chỉ participant được xem |

Quy tắc payload:

- Nếu `messageType` trống, backend mặc định `text`
- `text` bắt buộc có `content`
- `file` bắt buộc có `attachments`
- Client không gửi `senderId`

## 8. Review

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/reviews` | Có | `contractId`, `rating`, `comment?` | `ReviewResponse` | Chỉ participant, contract phải `completed`, mỗi user tối đa 1 review mỗi contract |
| `GET` | `/reviews/contract/{contractId}` | Có | Path `contractId` | `ReviewResponse[]` | Chỉ participant được xem |

Quy tắc payload:

- `rating` từ `1` đến `5`
- Client không gửi `reviewerId`

## 9. Notification

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/notifications` | Có | Không | `NotificationResponse[]` | Tất cả notification của user hiện tại |
| `POST` | `/notifications` | Có | `type?`, `title`, `content?`, `link?` | `NotificationResponse` | Tạo notification cho chính user hiện tại; `type` mặc định `system` |
| `GET` | `/notifications/user/{userId}` | Có | Path `userId` | `NotificationResponse[]` | Chỉ cho chính user đó |
| `GET` | `/notifications/user/me` | Có | Không | `NotificationResponse[]` | Alias tiện dụng cho user hiện tại |
| `PUT` | `/notifications/{notificationId}/read` | Có | Path `notificationId` | `NotificationResponse` | Chỉ chủ notification được đánh dấu đã đọc |

## 10. Transaction (Payments)

| Method | Path | Auth | Request | Data success | Rule chính |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/transactions` | Có | Không | array | Lịch sử transaction của user/contract |
| `POST` | `/contracts/{id}/transactions` | Có | amount, method | TransactionResponse | Trigger khi milestone/completed (theo ContractService) |

**Note**: Sử dụng DECIMAL, status pending/completed/failed. Realtime qua WebSocket.

## 11. WebSocket / Realtime (STOMP)

- Endpoint: `/ws` (SockJS + STOMP).
- Subscriptions: `/user/queue/notifications`, `/topic/contract/{id}`.
- Backend: `SimpMessagingTemplate` in NotificationService/MessageService.
- Frontend: `useWebSocket` hook in NotificationsPage/ContractsPage.
- Rule: Live updates for status, messages, notifications per rules §3-5,8.

Update demo_runbook.md with realtime demo steps.

### 9.1. Notification events đang phát sinh tự động

- Có bid mới cho project của customer
- Bid bị customer từ chối
- Bid không được chọn khi contract được tạo từ một bid khác
- Freelancer được chọn và có contract mới
- Freelancer có milestone mới
- Participant còn lại được báo khi contract chuyển `completed` hoặc `cancelled`

## 10. Error code cần bám ở frontend

Các lỗi cần ưu tiên xử lý theo `code`, không hardcode chuỗi `message`.

- Auth: `ERR_AUTH_01` đến `ERR_AUTH_15`
- User: `ERR_USER_01`
- Project: `ERR_PROJECT_01`
- Bid: `ERR_BID_01`
- Contract: `ERR_CONTRACT_01`, `ERR_CONTRACT_02`
- Notification: `ERR_NOTIFICATION_01`
- Validation/System: `ERR_SYS_02`, `ERR_SYS_01`

Chi tiết đầy đủ xem tại [docs/architecture/error_codes.md](../architecture/error_codes.md).
