# Kế Hoạch Hoàn Thiện Dự Án

Tài liệu này chốt kế hoạch triển khai giai đoạn hoàn thiện dự án **Thuê Tôi Freelancer Platform** theo hướng logic, bám nghiệp vụ, bám docs hiện có và phù hợp với quy trình team trong repo.

## 1. Mục tiêu hoàn thiện

Mục tiêu của giai đoạn này không chỉ là "có thêm code", mà là đưa dự án tới trạng thái có thể:

- Chạy được toàn bộ luồng chính bằng dữ liệu thật.
- Không lệch khỏi rule nghiệp vụ đã chốt.
- Không lệch khỏi chuẩn auth, error code, UI standard và team workflow.
- Có đủ tài liệu, test và checklist để demo, review và bàn giao.

## 2. Nguồn chuẩn bắt buộc phải bám

Mọi quyết định triển khai phải ưu tiên các tài liệu sau:

- `README.md`: cách chạy dự án, môi trường Docker, nguyên tắc auth và quy chuẩn tổng quan.
- `docs/requirements/marketplace_rules.md`: rule nghiệp vụ cho `project`, `bid`, `contract`, `milestone`, `message`, `review`.
- `docs/architecture/auth_session_flow.md`: chuẩn JWT access token, refresh cookie và OTP verify email.
- `docs/architecture/error_codes.md`: chuẩn response lỗi và mã lỗi frontend phải bám.
- `docs/architecture/ui_standard.md`: chuẩn UI/UX Strict Sharpness, mobile-first và tái sử dụng component.
- `docs/CONVENTIONS.md`: chuẩn naming cho DB, API, Java và React.
- `docs/TEAM_GUIDE.md`: Git workflow, branch naming, local verification trước khi mở PR.
- `docs/database/schema.sql`: schema nghiệp vụ hiện tại đang là nguồn tham chiếu DB chính.

## 3. Đánh giá hiện trạng repo

### 3.1. Backend

- Đã có controller/service/repository/entity cho các module chính: `auth`, `project`, `bid`, `contract`, `milestone`, `message`, `review`, `notification`.
- Luồng auth đã có đủ register, OTP verify, resend OTP, login, refresh, logout, profile.
- Luồng `project -> bid -> contract -> milestone` đã có nền tảng nghiệp vụ và đã bắt đầu bám rule.
- Test backend hiện mới tập trung ở một phần service (`ContractService`, `MessageService`, `ReviewService`), chưa phủ toàn bộ auth/project/bid/notification.
- API hiện vẫn đang trả entity trực tiếp ở nhiều endpoint, dễ phát sinh lệch contract giữa backend và frontend về sau.
- `docs/api/README.md` vẫn chưa có OpenAPI/Postman chính thức, nên rủi ro lệch API contract còn cao.

### 3.2. Frontend

- Đã có landing, auth pages, workspace dashboard, projects, contracts, notifications, profile và component gallery.
- `npm run lint` đang pass.
- `npm run build` đang pass.
- Frontend đã gọi dữ liệu thật cho auth, project, bid, contract, notification.
- Chưa có đủ màn hình nghiệp vụ cho `message`, `review`, và các thao tác contract/milestone ở mức hoàn thiện.
- API client frontend hiện chưa phủ hết toàn bộ endpoint backend đang có.

### 3.3. Tài liệu và quy trình

- Docs nền tảng khá tốt, nhưng docs API chính thức và kế hoạch thi công chi tiết vẫn còn thiếu.
- Local verification theo `TEAM_GUIDE` đang thiếu baseline backend trên máy hiện tại nếu không dùng Maven/Docker.

## 4. Định nghĩa hoàn thành tổng thể

Dự án chỉ được xem là "hoàn thiện" khi đồng thời đạt các điều kiện sau:

- Auth flow chạy đúng: `register -> verify otp -> login -> refresh -> logout -> profile`.
- Customer có thể tạo, quản lý project của mình đúng rule.
- Freelancer có thể xem project mở, gửi bid, rút bid của chính mình đúng rule.
- Customer có thể xem, từ chối hoặc chấp nhận bid đúng rule.
- Khi tạo contract từ bid, toàn bộ trạng thái `bid` và `project` được đồng bộ đúng rule.
- Customer có thể tạo milestone khi contract đang `in_progress`.
- Hai participant có thể xem/gửi message khi contract đang `in_progress`.
- Hai participant có thể tạo review khi contract đã `completed`, mỗi người tối đa một lần mỗi hợp đồng.
- Notification hiển thị đúng user, đánh dấu đã đọc được.
- Frontend không gửi các field backend phải tự suy ra từ JWT như `sender_id`, `reviewer_id`, `userId` trong các API "của tôi".
- Backend có test cho các rule nghiệp vụ trọng yếu.
- Frontend pass `lint` và `build`, backend pass `test`.
- `docs/api` có tài liệu endpoint chính thức, đủ để FE/BE không còn đoán contract của nhau.

## 5. Nguyên tắc triển khai giai đoạn hoàn thiện

### 5.1. Rule-first

Không code trước rồi sửa rule sau. Mọi endpoint và UI phải đối chiếu `marketplace_rules.md` trước khi merge.

### 5.2. Contract-first

Ưu tiên chốt request/response, mã lỗi, field ownership trước khi mở rộng UI. Tránh tình trạng backend đổi payload làm vỡ frontend.

### 5.3. Vertical slice

Làm theo luồng hoàn chỉnh từ backend đến frontend cho từng module thay vì làm rời rạc từng tầng. Mỗi phase nên tạo ra một luồng người dùng có thể test được.

### 5.4. Docs song hành với code

Mỗi khi chốt endpoint hoặc thay đổi rule thực tế, phải cập nhật `docs/api` hoặc `docs/requirements` tương ứng ngay trong cùng nhánh làm việc.

### 5.5. Kiểm tra quyền ở backend

Frontend có thể ẩn nút, nhưng backend mới là nơi chặn quyền thực sự. Không tin dữ liệu client trong các luồng ownership.

## 6. Lộ trình triển khai đề xuất

### Phase 0 - Khóa baseline và dọn nợ kỹ thuật

Mục tiêu: đưa codebase về trạng thái đủ ổn định để team cùng phát triển mà không đạp chân nhau.

Việc cần làm:

- Rà soát độ khớp giữa `schema.sql`, entity, DTO và API response.
- Chuẩn hóa status bằng hằng số hoặc enum cho `project`, `bid`, `contract`, `milestone`, `message`.
- Rà soát các endpoint đang trả entity trực tiếp, xác định danh sách cần chuyển sang response DTO.
- Chuẩn hóa error handling theo `docs/architecture/error_codes.md`.
- Chốt danh sách endpoint chính thức và bắt đầu viết docs trong `docs/api`.
- Chuẩn hóa seed/test accounts cho 3 vai trò: `customer`, `freelancer`, `admin`.

Tiêu chí xong phase:

- Team có baseline API rõ ràng.
- Không còn điểm mơ hồ về status, ownership và mã lỗi.
- Có checklist smoke test tối thiểu cho auth và marketplace core.

### Phase 1 - Hoàn thiện Auth và profile

Mục tiêu: auth phải thật sự ổn định trước khi đẩy mạnh nghiệp vụ marketplace.

Việc cần làm:

- Kiểm tra đầy đủ rule register role, verify email, resend cooldown, login, refresh rotation, logout.
- Bổ sung test cho `AuthService`, OTP flow, refresh token revoke/rotate.
- Rà soát `401/403/409/429` để FE xử lý đúng hành vi.
- Hoàn thiện FE auth bootstrap, retry refresh một lần, logout khi refresh fail.
- Kiểm tra route guard cho guest/protected pages.

Tiêu chí xong phase:

- Một user mới có thể đi hết luồng tạo tài khoản và vào workspace ổn định.
- FE không bị giữ trạng thái đăng nhập sai khi token hết hạn hoặc refresh token bị revoke.

### Phase 2 - Hoàn thiện Project và Bid

Mục tiêu: hoàn chỉnh marketplace core trước khi đi vào hợp đồng.

Việc cần làm:

- Hoàn thiện CRUD project của customer.
- Chặn tuyệt đối việc customer tự set `project.status` sang `in_progress` hoặc `completed`.
- Hoàn thiện luồng freelancer xem project mở và gửi bid.
- Hoàn thiện luồng freelancer rút bid `pending` của chính mình.
- Hoàn thiện luồng customer từ chối bid `pending`.
- Hoàn thiện luồng customer chấp nhận bid qua endpoint riêng.
- Bổ sung test cho ownership, status transition và các case forbidden.
- Hoàn thiện UI customer quản lý project và bid list.
- Hoàn thiện UI freelancer xem project, gửi bid, xem lịch sử bid.

Tiêu chí xong phase:

- Luồng `customer đăng project -> freelancer gửi bid -> customer xử lý bid` chạy end-to-end.

### Phase 3 - Hoàn thiện Contract và Milestone

Mục tiêu: khóa chặt logic chuyển từ marketplace sang execution.

Việc cần làm:

- Bảo đảm mỗi project chỉ có tối đa một contract.
- Khi tạo contract:
  - bid được chọn chuyển `accepted`
  - các bid còn lại chuyển `rejected` trừ bid đã `withdrawn`
  - `project.status` chuyển `in_progress`
- Hoàn thiện cập nhật `contract.status` sang `completed` hoặc `cancelled`.
- Đồng bộ ngược `project.status` theo contract khi kết thúc.
- Hoàn thiện tạo milestone chỉ cho customer của contract và chỉ khi contract đang `in_progress`.
- Bổ sung test cho đồng bộ status project-contract-bid.
- Hoàn thiện màn contract detail và milestone management ở frontend.

Tiêu chí xong phase:

- Luồng `accept bid -> contract -> milestone -> complete/cancel contract` chạy trọn vẹn và đúng rule.

### Phase 4 - Hoàn thiện Message, Review, Notification

Mục tiêu: hoàn thiện lớp collaboration và trust sau khi execution flow đã ổn.

Việc cần làm:

- Hoàn thiện message: chỉ participant được xem/gửi, chỉ gửi khi contract `in_progress`.
- Hoàn thiện review: chỉ participant được tạo, chỉ khi contract `completed`, mỗi user một lần mỗi contract.
- Xác định event nào phải bắn notification:
  - bid mới
  - bid bị accept/reject
  - contract mới
  - milestone mới hoặc contract đổi trạng thái nếu team cần
- Hoàn thiện UI notifications center.
- Bổ sung UI chat hợp đồng và review sau hoàn thành.
- Bổ sung test message/review/notification cho forbidden cases và happy path.

Tiêu chí xong phase:

- Sau khi có contract, user có thể cộng tác, theo dõi cập nhật và đánh giá hậu hợp đồng bằng dữ liệu thật.

### Phase 5 - Tài liệu hóa, QA và demo readiness

Mục tiêu: biến code thành sản phẩm có thể review và demo chuyên nghiệp.

Việc cần làm:

- Hoàn thiện `docs/api` bằng OpenAPI hoặc Postman collection chính thức.
- Viết checklist manual test theo 2 vai trò chính: customer và freelancer.
- Chạy đầy đủ local verification:
  - Frontend: `npm run lint`
  - Frontend: `npm run build`
  - Backend: `mvn test` hoặc chạy trong Docker nếu máy không có Maven local
- Bổ sung dữ liệu demo sạch và kịch bản demo chuẩn.
- Rà soát loading state, empty state, error state, mobile usability theo `ui_standard.md`.
- Chốt README với hướng dẫn chạy, tài khoản test, thứ tự demo.

Tiêu chí xong phase:

- Team có thể demo trơn tru từ đầu tới cuối.
- Reviewer có thể đọc docs API và hiểu rõ từng endpoint mà không phải đoán.

## 7. Thứ tự ưu tiên thực thi

Nếu nguồn lực có hạn, ưu tiên theo thứ tự sau:

1. `Auth`
2. `Project`
3. `Bid`
4. `Contract`
5. `Milestone`
6. `Notification`
7. `Message`
8. `Review`
9. `API docs`
10. `UI polish`

Lý do:

- `Auth` là tiền đề của toàn bộ ownership.
- `Project/Bid/Contract/Milestone` là xương sống nghiệp vụ marketplace.
- `Notification/Message/Review` là lớp hoàn thiện trải nghiệm, nhưng vẫn phải làm trước khi chốt demo cuối.

## 8. Phân công theo workstream

### Backend stream

- Chốt business rule ở service layer.
- Chuẩn hóa DTO/request/response.
- Viết test cho rule quan trọng.
- Chuẩn hóa error code và logging.

### Frontend stream

- Kết nối đúng API contract đã chốt.
- Hoàn thiện role-based flow cho customer và freelancer.
- Bổ sung loading, empty, error, success states.
- Bám `Strict Sharpness`, tái sử dụng component trong `components/common`.

### Database stream

- Rà soát schema, index, seed, dữ liệu test.
- Đảm bảo migration bằng script hoặc ít nhất chốt script SQL cập nhật rõ ràng trong docs.

### Docs/QA stream

- Ghi API docs.
- Ghi checklist test.
- Chuẩn hóa kịch bản demo.
- Kiểm tra nhánh, commit message, verification trước PR theo `TEAM_GUIDE.md`.

## 9. Rủi ro chính và cách kiểm soát

### Rủi ro 1: lệch contract giữa FE và BE

Biện pháp:

- Chốt DTO response.
- Viết `docs/api` song song với code.
- Không để frontend tự đoán field từ entity.

### Rủi ro 2: vi phạm ownership nghiệp vụ

Biện pháp:

- Mọi API "của tôi" phải lấy principal từ JWT.
- Viết test cho forbidden case trước các luồng nhạy cảm.

### Rủi ro 3: status transition bị sai dây chuyền

Biện pháp:

- Viết test theo chuỗi `project -> bid -> contract -> milestone -> review`.
- Không cho frontend cập nhật status bằng cách tự do ngoài rule cho phép.

### Rủi ro 4: demo được nhưng khó review

Biện pháp:

- Hoàn thiện `docs/api`.
- Có tài khoản seed, checklist test và script chạy rõ ràng.

## 10. Kế hoạch khởi động ngay cho vòng triển khai kế tiếp

Danh sách công việc nên làm ngay, theo đúng thứ tự:

1. Audit lại toàn bộ API request/response và ghi tài liệu chính thức trong `docs/api`.
2. Chốt baseline auth bằng test và smoke test đầy đủ.
3. Hoàn thiện end-to-end luồng `project -> bid -> accept bid -> contract`.
4. Hoàn thiện contract detail và milestone management.
5. Bổ sung notification theo event nghiệp vụ chính.
6. Hoàn thiện message và review.
7. Chạy lại toàn bộ verification, dọn lỗi UI/UX/mobile, chốt demo script.

## 11. Chuẩn branch khi bắt đầu triển khai

Mỗi phase hoặc sub-phase nên tách branch đúng quy tắc repo, ví dụ:

- `dev/be/<owner>-feature/auth-hardening`
- `dev/be/<owner>-feature/project-bid-workflow`
- `dev/fullstack/<owner>-feature/contract-milestone-flow`
- `dev/fe/<owner>-feature/workspace-polish`
- `dev/docs/<owner>-docs/api-contract`

## 12. Kết luận

Thứ tự hoàn thiện hợp lý nhất cho dự án hiện tại là:

`Baseline -> Auth -> Project/Bid -> Contract/Milestone -> Message/Review/Notification -> Docs/QA/Demo`

Nếu bám đúng thứ tự này, team sẽ tránh được 3 lỗi rất hay gặp ở đồ án web:

- UI làm trước nhưng backend chưa chốt rule.
- Có endpoint nhưng không đủ ownership và status validation.
- Demo được trên máy người viết nhưng thiếu tài liệu và không kiểm chứng được trên môi trường chung.
