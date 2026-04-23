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

- `AuthUserResponse`: `id`, `email`, `fullName`, `role`, `avatarUrl`, `profileDescription`, `skills`, `isActive`, `verified`, `createdAt`, `updatedAt`
- `ProjectResponse`: `id`, `user`, `title`, `description`, `budgetMin`, `budgetMax`, `deadline`, `status`, `skills`, `createdAt`, `updatedAt`
- `BidResponse`: `id`, `project`, `freelancer`, `price`, `message`, `estimatedTime`, `attachments`, `status`, `createdAt`
- `ContractResponse`: `id`, `projectId`, `freelancerId`, `customerId`, `totalAmount`, `progress`, `status`, `startDate`, `endDate`
- `MilestoneResponse`: `id`, `contractId`, `title`, `amount`, `dueDate`, `status`
- `MessageResponse`: `id`, `contractId`, `senderId`, `messageType`, `content`, `attachments`, `sentAt`
- `ReviewResponse`: `id`, `contractId`, `reviewerId`, `rating`, `comment`, `reply`, `createdAt`, `updatedAt`
- `NotificationResponse`: `id`, `userId`, `type`, `title`, `content`, `link`, `isRead`, `createdAt`
- `NotificationPageResponse`: `notifications`, `page`, `size`, `totalElements`, `totalPages`, `totalNotifications`, `unreadCount`
- `NotificationReadAllResponse`: `updatedCount`
- `SkillResponse`: `id`, `name`, `description`
- `TransactionResponse`: `id`, `contractId`, `amount`, `method`, `status`, `createdAt`
- `AdminUserSummaryResponse`: `id`, `fullName`, `email`, `role`, `avatarUrl`
- `AdminProjectResponse`: `id`, `user`, `title`, `description`, `budgetMin`, `budgetMax`, `deadline`, `status`, `skills`, `createdAt`, `updatedAt`
- `AdminKycResponse`: `id`, `user`, `status`, `note`, `createdAt`, `updatedAt`
- `AdminReportResponse`: `id`, `reporter`, `targetType`, `targetId`, `reason`, `description`, `status`, `createdAt`, `updatedAt`
- `AdminWithdrawalResponse`: `id`, `user`, `amount`, `bankInfo`, `status`, `note`, `processedBy`, `createdAt`, `updatedAt`
- `AdminAuditLogResponse`: `id`, `adminEmail`, `action`, `entityType`, `entityId`, `detail`, `ipAddress`, `createdAt`
- `SystemSettingAdminResponse`: `key`, `value`, `updatedAt`

## 2. Auth & profile

| Method | Path                            | Auth   | Request                                                        | Data success        | Rule chính                                                    |
| ------ | ------------------------------- | ------ | -------------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `POST` | `/auth/register`                | Không  | `email`, `password`, `fullName`, `role`, `profileDescription?` | `AuthUserResponse`  | Chỉ cho `freelancer` hoặc `customer`; tự gửi OTP verify email |
| `POST` | `/auth/verify-email-otp`        | Không  | `email`, `otp`                                                 | `null`              | OTP đúng, chưa dùng, chưa hết hạn                             |
| `POST` | `/auth/resend-verification-otp` | Không  | `email`                                                        | `null`              | Cooldown resend; không cho user đã verify                     |
| `POST` | `/auth/login`                   | Không  | `email`, `password`                                            | `AuthTokenResponse` | Trả access token trong body, refresh token trong cookie       |
| `POST` | `/auth/refresh`                 | Cookie | Không body                                                     | `AuthTokenResponse` | Rotate refresh token, revoke token cũ                         |
| `POST` | `/auth/logout`                  | Cookie | Không body                                                     | `null`              | Revoke refresh token hiện tại và xóa cookie                   |
| `GET`  | `/auth/profile`                 | Có     | Không                                                          | `AuthUserResponse`  | Lấy profile từ JWT principal                                  |
| `PUT`  | `/users/me/profile`             | Có     | `fullName?`, `profileDescription?`, `avatarUrl?`, `skills?[]`  | `AuthUserResponse`  | Cập nhật hồ sơ hiện tại; skills phải tồn tại trong catalog    |
| `POST` | `/users/me/avatar`              | Có     | `file` (multipart/form-data)                                   | `AuthUserResponse`  | Tải lên avatar mới, hệ thống trả về URL và cập nhật cho user  |
| `PUT`  | `/users/me/password`            | Có     | `oldPassword`, `newPassword`                                   | `null`              | Đổi mật khẩu; cần xác thực mật khẩu cũ trước khi đổi          |

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

| Method | Path          | Auth  | Data success       | Rule chính                                          |
| ------ | ------------- | ----- | ------------------ | --------------------------------------------------- |
| `GET`  | `/health`     | Không | health payload     | Kiểm tra hệ thống                                   |
| `GET`  | `/skills`     | Không | `SkillResponse[]`  | Danh mục kỹ năng chuẩn hóa dùng cho project/profile |
| `GET`  | `/users/{id}` | Không | `AuthUserResponse` | Phục vụ tra cứu user theo id                        |

## 4. Project

| Method   | Path                        | Auth  | Request                                                                     | Data success        | Rule chính                                                                                       |
| -------- | --------------------------- | ----- | --------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `GET`    | `/projects`                 | Không | Không                                                                       | `ProjectResponse[]` | Chỉ trả project `open` trên marketplace                                                          |
| `POST`   | `/projects`                 | Có    | `title`, `description?`, `budgetMin`, `budgetMax`, `deadline?`, `skills?[]` | `ProjectResponse`   | Chỉ `customer` được tạo; skills phải tồn tại trong catalog                                       |
| `GET`    | `/projects/status/{status}` | Không | Path `status`                                                               | `ProjectResponse[]` | `status` hợp lệ: `open`, `in_progress`, `completed`, `cancelled`                                 |
| `GET`    | `/projects/search`          | Không | Query `skills?`, `status?`                                                  | `ProjectResponse[]` | Skill-based search (tên kỹ năng), optional status                                                |
| `GET`    | `/projects/my`              | Có    | Không                                                                       | `ProjectResponse[]` | Dự án của user hiện tại                                                                          |
| `GET`    | `/projects/user/{userId}`   | Có    | Path `userId`                                                               | `ProjectResponse[]` | Chỉ cho chính owner xem                                                                          |
| `GET`    | `/projects/{id}`            | Không | Path `id`                                                                   | `ProjectResponse`   | Chi tiết project                                                                                 |
| `PUT`    | `/projects/{id}`            | Có    | `ProjectRequest`                                                            | `ProjectResponse`   | Owner được sửa, nhưng không được tự set `in_progress` hoặc `completed`; có thể cập nhật `skills` |
| `DELETE` | `/projects/{id}`            | Có    | Path `id`                                                                   | `null`              | Chỉ owner được xóa                                                                               |

## 5. Bid

| Method | Path                              | Auth | Request                                                            | Data success    | Rule chính                                                                                    |
| ------ | --------------------------------- | ---- | ------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------- |
| `GET`  | `/bids`                           | Có   | Không                                                              | `BidResponse[]` | Khách hàng thấy bid vào project của mình, Freelancer thấy bid của chính mình                  |
| `POST` | `/bids`                           | Có   | `projectId`, `price`, `message?`, `estimatedTime?`, `attachments?` | `BidResponse`   | Chỉ `freelancer`, không bid project của chính mình, project phải `open`                       |
| `GET`  | `/bids/project/{projectId}`       | Có   | Path `projectId`                                                   | `BidResponse[]` | Chỉ owner project được xem                                                                    |
| `GET`  | `/bids/my`                        | Có   | Không                                                              | `BidResponse[]` | Bid của Freelancer hiện tại                                                                   |
| `GET`  | `/bids/freelancer/{freelancerId}` | Có   | Path `freelancerId`                                                | `BidResponse[]` | Chỉ cho chính Freelancer đó                                                                   |
| `GET`  | `/bids/{id}`                      | Có   | Path `id`                                                          | `BidResponse`   | Chỉ owner bid hoặc owner project được xem                                                     |
| `POST` | `/bids/{bidId}/accept`            | Có   | Path `bidId`                                                       | `BidResponse`   | Khách hàng chấp nhận bid và tạo contract theo luồng chuẩn                                     |
| `PUT`  | `/bids/{bidId}/status`            | Có   | `{ "status": "withdrawn" \| "rejected" }`                          | `BidResponse`   | Freelancer chỉ được `withdrawn`; Khách hàng chỉ được `rejected`; không accept bằng endpoint này |

## 6. Contract & milestone

| Method | Path                                                         | Auth | Request                                                 | Data success            | Rule chính                                                                                                                             |
| ------ | ------------------------------------------------------------ | ---- | ------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/contracts`                                                 | Có   | Không                                                   | `ContractResponse[]`    | Danh sách hợp đồng user được phép xem                                                                                                  |
| `POST` | `/contracts`                                                 | Có   | `{ "bidId": 123 }`                                      | `ContractResponse`      | Tạo contract từ bid được chọn; một project chỉ có tối đa một contract                                                                  |
| `GET`  | `/contracts/my`                                              | Có   | Không                                                   | `ContractResponse[]`    | Hợp đồng của user hiện tại                                                                                                             |
| `GET`  | `/contracts/user/{userId}`                                   | Có   | Path `userId`                                           | `ContractResponse[]`    | Chỉ cho chính user đó                                                                                                                  |
| `POST` | `/contracts/{contractId}/milestones`                         | Có   | `title`, `amount`, `dueDate?`, `status?`                | `MilestoneResponse`     | Chỉ `customer` của contract; contract phải `in_progress`; backend chỉ chấp nhận `pending` khi khởi tạo, các trạng thái khác bị từ chối |
| `GET`  | `/contracts/{contractId}/milestones`                         | Có   | Path `contractId`                                       | `MilestoneResponse[]`   | Chỉ participant được xem                                                                                                               |
| `PUT`  | `/contracts/{contractId}/status?status=completed\|cancelled` | Có   | Query `status`                                          | `ContractResponse`      | Chỉ participant; chỉ đổi từ `in_progress` sang trạng thái kết thúc                                                                     |
| `GET`  | `/milestones`                                                | Có   | Không                                                   | `MilestoneResponse[]`   | Toàn bộ milestone user được phép xem                                                                                                   |
| `PUT`  | `/milestones/{milestoneId}/status`                           | Có   | `{ "status": "completed" \| "cancelled" \| "pending" }` | `MilestoneResponse`     | Hiện backend enforce `customer` của contract; FE hiện chỉ dùng luồng `pending -> completed/cancelled`                                  |
| `GET`  | `/contracts/{contractId}/transactions`                       | Có   | Path `contractId`                                       | `TransactionResponse[]` | Chỉ participant được xem lịch sử payment/transaction của hợp đồng                                                                      |

### 6.1. `dueDate`

- Chấp nhận `ISO-8601`
- Ví dụ hợp lệ:
  - `2026-03-31T19:02:35`
  - `2026-03-31T19:02:35+07:00`

## 7. Message

| Method | Path                              | Auth | Request                                                  | Data success        | Rule chính                                                                         |
| ------ | --------------------------------- | ---- | -------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `POST` | `/messages`                       | Có   | `contractId`, `messageType?`, `content?`, `attachments?` | `MessageResponse`   | Chỉ participant, contract phải `in_progress`, `messageType` hợp lệ: `text`, `file` |
| `GET`  | `/messages/contract/{contractId}` | Có   | Path `contractId`                                        | `MessageResponse[]` | Chỉ participant được xem                                                           |

Quy tắc payload:

- Nếu `messageType` trống, backend mặc định `text`
- `text` bắt buộc có `content`
- `file` bắt buộc có `attachments`
- Client không gửi `senderId`

## 8. Review

| Method | Path                             | Auth | Request                            | Data success       | Rule chính                                                                        |
| ------ | -------------------------------- | ---- | ---------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `POST` | `/reviews`                       | Có   | `contractId`, `rating`, `comment?` | `ReviewResponse`   | Chỉ participant, contract phải `completed`, mỗi user tối đa 1 review mỗi contract |
| `GET`  | `/reviews/contract/{contractId}` | Có   | Path `contractId`                  | `ReviewResponse[]` | Chỉ participant được xem                                                          |

Quy tắc payload:

- `rating` từ `1` đến `5`
- Client không gửi `reviewerId`

## 9. Notification

| Method | Path                                   | Auth | Request                               | Data success             | Rule chính                                                         |
| ------ | -------------------------------------- | ---- | ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| `GET`  | `/notifications`                       | Có   | Không                                 | `NotificationResponse[]` | Tất cả notification của user hiện tại                              |
| `POST` | `/notifications`                       | Có   | `type?`, `title`, `content?`, `link?` | `NotificationResponse`   | Tạo notification cho chính user hiện tại; `type` mặc định `system` |
| `GET`  | `/notifications/user/{userId}`         | Có   | Path `userId`                         | `NotificationResponse[]` | Chỉ cho chính user đó                                              |
| `GET`  | `/notifications/user/me`               | Có   | Không                                 | `NotificationResponse[]` | Alias tiện dụng cho user hiện tại                                  |
| `GET`  | `/notifications/user/me/page`          | Có   | Query `page?`, `size?`, `type?`, `unreadOnly?` | `NotificationPageResponse` | Inbox phân trang, hỗ trợ filter type và chỉ chưa đọc; `size` tối đa 100 |
| `PUT`  | `/notifications/{notificationId}/read` | Có   | Path `notificationId`                 | `NotificationResponse`   | Chỉ chủ notification được đánh dấu đã đọc                          |
| `PUT`  | `/notifications/read-all`              | Có   | Không                                 | `NotificationReadAllResponse` | Chỉ đánh dấu các notification chưa đọc của user hiện tại; trả số bản ghi đã cập nhật |

Quy tắc notification:

- `type` chỉ dùng các giá trị hiện có: `project`, `bid`, `contract`, `system`.
- `title`, `content`, `link` phải được backend chuẩn hóa trim trước khi lưu và phát realtime.
- Client không được tự gửi `userId` khi tạo notification ở luồng "của tôi".
- Mọi notification lưu thành công phải được phát qua `/user/queue/notifications` với payload `NotificationResponse`.
- Broadcast admin phải lưu từng notification theo user nhận và emit từng user queue; `/topic/global-notifications` chỉ là tín hiệu phụ, frontend không phụ thuộc vào topic này.
- Frontend nên dùng endpoint phân trang cho inbox chính; endpoint list cũ giữ lại để tương thích.
- `read-all` và `mark-read` phải đồng bộ badge giữa các tab bằng cross-tab sync hoặc reload nhẹ.

## 10. Report & KYC

| Method | Path              | Auth | Request                                              | Data success | Rule chính                                                                 |
| ------ | ----------------- | ---- | ---------------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `POST` | `/reports`        | Có   | `targetType`, `targetId`, `reason`, `description?`   | `null`       | Chỉ user đã đăng nhập; backend tự gán `reporterId`, không trả raw entity   |
| `POST` | `/kyc/request`    | Có   | Không                                                | `null`       | User chỉ gửi yêu cầu xác thực cho chính mình                               |
| `GET`  | `/kyc/my-status`  | Có   | Không                                                | `KycStatus`  | Trả trạng thái KYC hiện tại của user                                       |

Quy tắc payload:

- `targetType` hiện dùng các giá trị như `PROJECT` hoặc `USER`
- `reason` phải là enum/frontend catalog đang hỗ trợ: `spam`, `inappropriate`, `harassment`, `other`
- Client không được gửi `reporterId`

## 11. Admin

Tất cả endpoint dưới `/admin/**` đều yêu cầu:

- Access token hợp lệ
- Quyền `admin`
- Backend enforce bằng cả filter-chain lẫn `@EnableMethodSecurity`
- Không có auth trả `401` (`ERR_AUTH_01` hoặc `ERR_AUTH_12`)
- Sai quyền trả `403` (`ERR_AUTH_04`)

| Method | Path                                   | Auth      | Request                                                            | Data success                   | Rule chính                                                                                           |
| ------ | -------------------------------------- | --------- | ------------------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `GET`  | `/admin/stats`                         | Admin     | Không                                                              | `AdminStatsResponse`           | Dashboard tổng quan hệ thống                                                                          |
| `GET`  | `/admin/health-detailed`               | Admin     | Không                                                              | `SystemHealthResponse`         | Theo dõi tài nguyên hệ thống                                                                          |
| `GET`  | `/admin/users`                         | Admin     | Không                                                              | `UserAdminResponse[]`          | Danh sách toàn bộ user                                                                                |
| `PUT`  | `/admin/users/{userId}/toggle-status`  | Admin     | Query `reason?`                                                    | `null`                         | Không được tự khóa/mở khóa chính mình                                                                 |
| `POST` | `/admin/users/bulk-status`             | Admin     | `userIds[]`, `active`, `reason?`                                  | `null`                         | Không được áp dụng bulk action lên chính admin đang đăng nhập                                         |
| `PUT`  | `/admin/users/{userId}/role`           | Admin     | Query `role`                                                       | `null`                         | Không được tự đổi role của chính mình                                                                 |
| `GET`  | `/admin/projects`                      | Admin     | Không                                                              | `AdminProjectResponse[]`       | Dữ liệu admin dùng DTO riêng, gồm owner summary + skills dạng tên                                     |
| `PUT`  | `/admin/projects/{projectId}/status`   | Admin     | Query `status`                                                     | `AdminProjectResponse`         | Admin chỉ được đưa project về `open` hoặc `cancelled`, không can thiệp `in_progress`/`completed`     |
| `POST` | `/admin/projects/bulk-status`          | Admin     | `projectIds[]`, `status`                                           | `null`                         | Chỉ hỗ trợ status phù hợp với moderation flow                                                         |
| `POST` | `/admin/skills`                        | Admin     | `name`, `description?`                                             | `SkillResponse`                | Không nhận raw entity từ client                                                                       |
| `PUT`  | `/admin/skills/{id}`                   | Admin     | `name`, `description?`                                             | `SkillResponse`                | Cập nhật catalog skill chuẩn hóa                                                                      |
| `DELETE` | `/admin/skills/{id}`                 | Admin     | Path `id`                                                          | `null`                         | Xóa skill khỏi catalog                                                                                |
| `POST` | `/admin/broadcast`                     | Admin     | `targetRole`, `type`, `title`, `content`, `link?`                 | `null`                         | Gửi broadcast hệ thống                                                                                |
| `GET`  | `/admin/kyc`                           | Admin     | Không                                                              | `AdminKycResponse[]`           | Dùng DTO đã join user summary                                                                         |
| `PUT`  | `/admin/kyc/{id}/approve`              | Admin     | Không                                                              | `AdminKycResponse`             | Chỉ xử lý request đang `PENDING`                                                                      |
| `PUT`  | `/admin/kyc/{id}/reject`               | Admin     | Query `reason`                                                     | `AdminKycResponse`             | Chỉ xử lý request đang `PENDING`                                                                      |
| `GET`  | `/admin/reports`                       | Admin     | Không                                                              | `AdminReportResponse[]`        | Dùng DTO đã join reporter summary                                                                     |
| `PUT`  | `/admin/reports/{id}/status`           | Admin     | Query `status`                                                     | `AdminReportResponse`          | Chỉ chấp nhận `RESOLVED` hoặc `DISMISSED`                                                             |
| `GET`  | `/admin/withdrawals`                   | Admin     | Không                                                              | `AdminWithdrawalResponse[]`    | Dùng DTO đã join user summary                                                                         |
| `POST` | `/admin/withdrawals/{id}/process`      | Admin     | Query `status`, `note?`                                            | `AdminWithdrawalResponse`      | Chỉ xử lý request `PENDING`; chỉ chấp nhận `APPROVED` hoặc `REJECTED`                                |
| `GET`  | `/admin/settings`                      | Admin     | Không                                                              | `SystemSettingAdminResponse[]` | Dùng DTO admin riêng                                                                                  |
| `POST` | `/admin/settings`                      | Admin     | `key`, `value`                                                     | `SystemSettingAdminResponse`   | Ghi nhận audit log cho thay đổi setting                                                               |
| `GET`  | `/admin/logs`                          | Admin     | Không                                                              | `AdminAuditLogResponse[]`      | Nhật ký hệ thống/audit                                                                                |

Lưu ý cho frontend:

- Admin UI phải guard route theo role, không chỉ dựa vào `isAuthenticated`
- Các màn admin `projects`, `kyc`, `reports`, `withdrawals` phải đọc từ nested DTO `user` / `reporter`, không suy diễn lại bằng fetch phụ
- `/reports` trả `null` trong `data` khi submit thành công, không trả raw `Report`

## 12. Transaction (Payments)

- Public API hiện tại chỉ expose:
  - `GET /contracts/{contractId}/transactions`
- Tạo transaction hiện do backend trigger nội bộ từ business flow:
  - milestone chuyển `completed`
  - contract chuyển `completed`
- `amount` dùng `DECIMAL`
- `status` hiện dùng các giá trị như `pending`, `completed`, `failed`
- Frontend không tự gọi endpoint tạo transaction

## 13. WebSocket / Realtime (STOMP)

- Endpoint: `/ws` (SockJS + STOMP).
- STOMP `CONNECT` nên gửi header:

```http
Authorization: Bearer <access_token>
```

- Subscriptions: `/user/queue/notifications`, `/topic/contract/{id}`.
- Notification queue phát `NotificationResponse`.
- STOMP `CONNECT` thiếu hoặc sai access token phải bị backend từ chối, tránh trạng thái socket anonymous.
- Frontend phải lấy access token mới nhất trong `beforeConnect` và reload inbox sau mỗi lần reconnect để catch-up notification bị lỡ khi mất kết nối.
- Contract topic phát envelope `ContractRealtimeEvent`:

```json
{
  "type": "message.created",
  "contractId": 12,
  "payload": {}
}
```

- Backend: `SimpMessagingTemplate` + `WebSocketAuthChannelInterceptor`.
- Frontend: `NotificationProvider` subscribe `/user/queue/notifications`; `ContractsPage` dùng `useWebSocket` cho topic contract.
- Rule: live updates cho notifications và các biến động contract/milestone/message/review/transaction.

### 13.1. Notification events đang phát sinh tự động

- Có bid mới cho project của Khách hàng
- Bid bị Khách hàng từ chối
- Bid không được chọn khi contract được tạo từ một bid khác
- Freelancer rút bid khỏi project
- Freelancer được chọn và có contract mới
- Freelancer có milestone mới
- Freelancer được báo khi milestone bị hủy
- Participant còn lại được báo khi contract chuyển `completed` hoặc `cancelled`
- Participant còn lại được báo khi có message mới
- Participant còn lại được báo khi có review mới
- Tất cả Quản trị viên được báo khi có KYC request mới
- User gửi KYC được báo khi KYC được approve hoặc reject
- Tất cả Quản trị viên được báo khi user gửi report mới; reporter nhận xác nhận đã ghi nhận
- Reporter được báo khi report chuyển `RESOLVED` hoặc `DISMISSED`
- User yêu cầu rút tiền được báo khi withdrawal được approve hoặc reject
- User bị tác động được báo khi Quản trị viên đổi role, status hoặc moderation project
- Target role nhận notification khi Quản trị viên gửi broadcast

Link workspace chuẩn:

- Bid/project moderation: `/workspace/projects`
- Contract/milestone/message/review: `/workspace/contracts`
- KYC admin: `/workspace/admin/kyc`
- KYC user: `/workspace/profile`
- Report admin: `/workspace/admin/reports`
- Report/withdrawal/system follow-up: `/workspace/notifications`

## 14. Error code cần bám ở frontend

Các lỗi cần ưu tiên xử lý theo `code`, không hardcode chuỗi `message`.

- Auth: `ERR_AUTH_01` đến `ERR_AUTH_15`
- User: `ERR_USER_01`
- Project: `ERR_PROJECT_01`
- Bid: `ERR_BID_01`
- Contract: `ERR_CONTRACT_01`, `ERR_CONTRACT_02`
- Notification: `ERR_NOTIFICATION_01`
- Validation/System: `ERR_SYS_02`, `ERR_SYS_01`

Chi tiết đầy đủ xem tại [docs/architecture/error_codes.md](../architecture/error_codes.md).
