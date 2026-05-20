# Kế Hoạch Hoàn Thiện Production-Ready + SePay

## Summary

- Hiện trạng đã hoàn thành: auth JWT/OTP/refresh, project/bid/contract/milestone/message/review, notification realtime + pagination + tab sync, admin users/projects/skills/KYC/reports/withdrawals/settings/logs, frontend workspace/admin screens, Flyway seed/migrations, docs API/rules/QA.
- Verification hiện tại: `mvn test` pass 55 tests, `npm run lint` pass, `npm run build` pass. Worktree chỉ có thay đổi sẵn ở `frontend/src/pages/LandingPage.tsx`.
- Mục tiêu mới: nâng từ demo-ready lên production-ready, tích hợp SePay thật cho thanh toán/escrow. Dùng SePay API v2 VA Orders, không dùng API v1 deprecated; webhook phải idempotent, xác thực, đối soát được.

## Key Changes

- Cập nhật docs/rules trước khi code: `marketplace_rules.md`, `official_endpoint_contract.md`, `manual_smoke_checklist.md`, `.env.prod.example`.
- Thêm payment domain:
  - `payment_orders`: orderCode, provider=`sepay`, bidId/projectId/customerId, amount, status `pending|paid|expired|cancelled|failed`, SePay order/VA/QR fields, expiresAt/paidAt.
  - `payment_webhook_events`: lưu SePay transaction id/referenceCode/raw payload để chống replay và xử lý idempotent.
  - `wallet_ledger_entries`: sổ cái bất biến cho escrow, platform fee, freelancer balance, withdrawal hold/release.
- Luồng chuẩn mới:
  - Customer chọn bid -> tạo SePay checkout, project chuyển `pending_payment`, chưa tạo contract.
  - SePay webhook paid -> tạo contract `in_progress`, bid được chọn `accepted`, bid còn lại `rejected`, project `in_progress`, ghi escrow ledger, bắn notification/realtime.
  - Checkout hết hạn/hủy -> project quay lại `open`, bid giữ `pending`.
  - Milestone completed -> release escrow cho freelancer balance trừ `platform_fee_percent`; contract completed -> release phần còn lại nếu hợp lệ.
- Public API mới/cập nhật:
  - `POST /api/v1/bids/{bidId}/checkout` -> `PaymentOrderResponse`
  - `GET /api/v1/payments/{orderCode}` -> trạng thái checkout
  - `POST /api/v1/payments/{orderCode}/cancel`
  - `POST /api/v1/payments/sepay/webhook` -> public nhưng bắt buộc verify SePay auth/signature/API key
  - `GET /api/v1/wallet/me`, `GET /api/v1/wallet/me/ledger`
  - `POST /api/v1/withdrawals`, `GET /api/v1/withdrawals/my`
  - Admin withdrawals giữ endpoint hiện có nhưng yêu cầu payout reference/note khi approve.
- Frontend:
  - Projects page đổi nút accept bid thành checkout + màn QR/VA/payment status.
  - Contracts page hiển thị escrow, released amount, remaining amount, ledger/transactions thật.
  - Profile thêm wallet + withdrawal request cho freelancer.
  - Admin finance bỏ số liệu mock/assumption, đọc từ ledger thật.
  - UI audit theo Strict Sharpness: loại `rounded-*` không đúng chuẩn, bỏ mock chart/copy chưa thật.

## Production Hardening

- SePay adapter dùng env: `SEPAY_API_BASE_URL`, `SEPAY_API_TOKEN`, `SEPAY_BANK_ACCOUNT_XID`, `SEPAY_VA_PREFIX`, `SEPAY_WEBHOOK_SECRET`, timeout, retry/backoff theo rate limit.
- Webhook phải trả đúng success response theo SePay, xử lý timeout nhanh, queue phần xử lý nặng nếu cần.
- Bổ sung error codes: `ERR_PAYMENT_*`, `ERR_WALLET_*`, `ERR_WITHDRAWAL_*`.
- Bảo mật: HTTPS-only prod, secure cookie flags, CORS allowlist, no secret logging, audit log cho payment/withdrawal/admin finance, method security cho toàn bộ admin.
- Deploy/ops: health check thêm DB/mail/SePay, log correlation id, backup DB, rollback migration guide, production smoke script.

## Test Plan

- Backend unit/integration: checkout creation, project lock/unlock, webhook paid/idempotent/replay, contract creation, escrow release, withdrawal hold/approve/reject, forbidden ownership cases.
- Frontend: lint/build, checkout UI states, polling/realtime status update, wallet/withdrawal forms, admin finance.
- E2E/manual smoke: register/login, project -> bid -> SePay checkout -> webhook paid -> contract -> milestone release -> withdrawal.
- SePay sandbox: simulate incoming transfer, duplicate webhook, invalid auth, wrong amount, expired checkout.
- Regression gates before PR: `mvn test`, `npm run lint`, `npm run build`, Docker compose smoke.

## Assumptions

- Gateway chính thức: SePay.
- Dùng SePay API v2 VA Orders và webhook; theo docs SePay, v1 không dùng cho tích hợp mới.
- Tiền tệ mặc định: VND, `BigDecimal`/`DECIMAL`, không dùng floating point.
- Phase đầu hỗ trợ customer payment + escrow thật; payout có thể admin/manual nhưng phải có ledger và audit đầy đủ.
- Nguồn tham chiếu: local docs trong `docs/`, SePay VA Orders v2, webhook, auth/rate limit docs:
  - https://developer.sepay.vn/en/sepay-api/v2/don-hang/bat-dau-nhanh
  - https://developer.sepay.vn/en/sepay-webhooks/bat-dau-nhanh
  - https://developer.sepay.vn/en/sepay-api/v2/xac-thuc
