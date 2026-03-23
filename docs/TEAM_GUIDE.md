# Hướng Dẫn Làm Việc Nhóm (Team Collaboration Guide)

Tài liệu này định nghĩa quy trình làm việc chuẩn cho toàn bộ thành viên trong dự án **Thuê Tôi** nhằm đảm bảo code không bị conflict, chất lượng code đồng đều và ai cũng hiểu code của nhau.

---

## 1. Mục Lục Tài Liệu (Cấu trúc thư mục `/docs`)
Mọi thông tin về dự án phải được lưu trữ trong thư mục `/docs` để tiện tra cứu:
- `/docs/requirements/`: Chứa các file yêu cầu nghiệp vụ, User Story, Use Case.
- `/docs/architecture/`: Chứa sơ đồ hệ thống, quy trình luồng (Flowchart).
- `/docs/database/`: Chứa ERD (Sơ đồ cơ sở dữ liệu), Script SQL tạo bảng mẫu.
- `/docs/api/`: Chứa tài liệu mô tả API (Postman Collection hoặc Swagger/OpenAPI exporter).
- `/docs/meetings/`: Biên bản họp nhóm (Meeting notes) ai đã chốt việc gì, deadline khi nào.

---

## 2. Quy Trình Quản Lý Source Code (Git Workflow)
Tuyệt đối **KHÔNG code trực tiếp và push thẳng lên branch `main` hoặc `master`**.

### Các Nhánh (Branches) Chính:
1. `main`: Nhánh chứa code ổn định nhất, chỉ dùng để nộp bài/deploy. (Cấm push trực tiếp).
2. `develop`: Nhánh chứa code mới nhất đang phát triển. Mọi người sẽ tạo branch mới từ nhánh này.

**Quy tắc bắt buộc về tên nhánh làm việc:**
- Mọi nhánh mới phải theo cú pháp: `dev/<mang>/<owner>-<loai>/<ten-task>`
- Trong đó:
  - `<mang>`: `fe`, `be`, `db`, `fullstack`
  - `<owner>`: slug tên người thực hiện, ví dụ `hieult`, `hieutt`
  - `<loai>`: `feature`, `bugfix`, `hotfix`, `docs`, `refactor`
  - `<ten-task>`: tên ngắn gọn bằng kebab-case, mô tả đúng công việc
- Ví dụ hợp lệ:
  - `dev/be/hieult-feature/auth-api`
  - `dev/fe/hieutt-feature/login-page`
  - `dev/be/hieutt-bugfix/jwt-ownership-contract-flow`
  - `dev/db/hieutt-feature/create-database`
- Không tạo nhánh mới theo kiểu cũ như `feature/login`, `bugfix/cart-error`, `ui/rules`, `db/create-database`.

### Quy Trình Làm Việc Hàng Ngày:
1. **Đồng bộ code mới nhất:**
   ```bash
   git checkout develop
   git pull origin develop
   ```
   Nếu repo chưa có `develop` trên remote, nhóm trưởng phải tạo `develop` từ `main` trước rồi cả team mới tách nhánh tiếp.
2. **Tạo nhánh làm việc riêng mang tên chức năng:**
   ```bash
   # Cú pháp: dev/<mang>/<owner>-<loai>/<ten-task>
   # Ví dụ:
   git checkout -b dev/be/hieult-feature/auth-api
   git checkout -b dev/fe/hieutt-feature/login-page
   git checkout -b dev/be/hieutt-bugfix/jwt-ownership-contract-flow
   ```
3. **Commit code thường xuyên khi xong 1 khối lượng nhỏ:**
   ```bash
   git add .
   # Message commit phải có ý nghĩa, cú pháp: [Tên_Module] Mô tả ngắn gọn
   # Ví dụ:
   git commit -m "[Auth] Hoàn thành giao diện trang Login"
   git commit -m "[DB] Thêm bảng ServiceGig vào cơ sở dữ liệu"
   ```
4. **Đẩy code lên Github:**
   ```bash
   git push origin dev/be/hieult-feature/auth-api
   ```
5. **Tạo Pull Request (PR):**
   - Lên Github, tạo Pull Request báo cáo là "Tôi muốn gộp nhánh `dev/be/hieult-feature/auth-api` vào nhánh `develop`".
   - Phải có ít nhất 1 thành viên khác (hoặc nhóm trưởng) review code (Đọc lướt qua xem có lỗi ngớ ngẩn không) rồi mới bấm `Merge`.

### Quy Tắc Bảo Vệ Nhánh (Branch Protection)
Để tránh tình trạng merge nhầm thẳng vào `main` hoặc bỏ qua bước review, repo phải bật branch protection cho cả `develop` và `main`.

- `develop`:
  - Cấm push trực tiếp.
  - Chỉ được merge qua Pull Request.
  - Bắt buộc pass các check: `frontend-lint`, `frontend-build`, `backend-test`.
  - Bắt buộc có ít nhất 1 approval trước khi merge.
- `main`:
  - Cấm push trực tiếp.
  - Chỉ nhận Pull Request từ `develop` khi chốt bản ổn định để demo, nộp bài hoặc deploy.
  - Bắt buộc pass các check: `main-release-gate`, `frontend-lint`, `frontend-build`, `backend-test`.
  - Bắt buộc có ít nhất 1 approval trước khi merge.

### Luồng Merge Chuẩn
1. Mọi nhánh cá nhân/tính năng đều tách từ `develop`.
2. Mọi Pull Request nghiệp vụ, UI, docs hoặc refactor đều target về `develop`.
3. Sau khi `develop` ổn định và đủ check xanh, nhóm trưởng mới mở Pull Request `develop -> main`.
4. Không merge trực tiếp feature branch, bugfix branch hoặc docs branch vào `main`.

---

## 3. Cách Phân Chia Công Việc
Dự án có 2 modules (Frontend và Backend). Nên chia team thành 2 nhóm nhỏ hoặc chia theo "Tính năng dọc (Vertical Feature)":
- **Gợi ý 1 (Chia theo Tech Stack - Khuyên dùng nếu người mới):** 
  - 1-2 bạn chuyên làm ReactJS (Chỉ tập trung vẽ UI và gọi API).
  - 1-2 bạn chuyên làm Spring Boot (Chỉ tập trung viết API trả JSON).
- **Gợi ý 2 (Chia theo Tính năng - Khuyên dùng nếu team cứng):**
  - Bạn A: Làm từ A-Z tính năng "Đăng nhập/Đăng ký" (Tự viết cả React lẫn Spring DB).
  - Bạn B: Làm từ A-Z tính năng "Quản lý Giỏ hàng".

---

## 4. Tiêu Chuẩn Viết Code, Comment & Log (Clean Code & Professional Vibe)

Dự án này đánh giá cao sự **chuyên nghiệp, chuẩn mực (Standard)**. Tuyệt đối **KHÔNG dùng "Vibe Code"** (code dạo, tuỳ hứng) hoặc các biểu hiện của việc copy paste AI mà không hiểu.

### 4.1 Quy Tắc Thống Nhất (Anti-AI Vibe)
1. **Tuyệt đối KHÔNG sử dụng biểu tượng cảm xúc (Emoji)** trong Toàn bộ dự án:
   - Không có Emoji trong mã nguồn (Codebase).
   - Không có Emoji trong tin nhắn Commit Git (`[Auth] Create Login` thay vì `🔑 Create login`).
   - Không có Emoji trong Comment của code, hoặc trong nội dung Log in ra console.
2. **Ngôn ngữ Log và Code:** Biến, tên class, hàm phải có ý nghĩa chuẩn xác bằng Tiếng Anh. Tuy nhiên, toàn bộ **Comment trong code bắt buộc phải viết bằng Tiếng Việt chuẩn** để team dễ đọc, dễ hiểu nghiệp vụ.

### 4.2 Viết Comment Tiêu Chuẩn
- **Chỉ Comment để giải thích "TẠI SAO", không giải thích "LÀM GÌ":**
  - Không cần comment `// Cộng 2 số` cho lệnh `c = a + b`. Hành động phức tạp (thuật toán, logic nghiệp vụ) mới cần comment.
- Sử dụng **JavaDoc** cho chức năng Spring Boot và **JSDoc** cho chức năng ReactJS. Comment mang tính học thuật và rõ ràng.

**Ví dụ JavaDoc (Backend):**
```java
/**
 * Xử lý thanh toán cho giỏ hàng hiện tại.
 * Kiểm tra tính sẵn có của dịch vụ, trừ tiền trong tài khoản nếu có,
 * tạo bản ghi Đơn hàng (Order) và xoá Session giỏ hàng của User.
 * 
 * @param cartId Mã định danh giỏ hàng lưu trong Session
 * @param user Đối tượng tài khoản người dùng đang thực hiện thanh toán
 * @return Entity Đơn hàng (Order) đã được tạo thành công
 * @throws BusinessException nếu giỏ hàng trống hoặc xác thực thanh toán thất bại
 */
public Order processCheckout(String cartId, User user) {
    // Chờ thực thi...
}
```

**Ví dụ JSDoc (Frontend):**
```javascript
/**
 * Custom hook quản lý trạng thái Giỏ hàng (Cart) đồng bộ với Session ở Backend.
 * Cung cấp các hàm để thay đổi giỏ hàng và tự động cập nhật dữ liệu mới nhất.
 * 
 * @returns {Object} { cartItems, addToCart, removeFromCart, checkout }
 */
export const useCart = () => {
    // Chờ thực thi...
}
```

### 4.3 Quy Tắc Bắn Log (Logging Standards)
Backend tuyệt đối **không được dùng `System.out.println`**. Mọi lỗi hoặc thông tin quan trọng đều phải đưa qua Logger (như `SLF4J`, `Logback`) với các cấp độ (Level) rõ ràng:

1. **`log.error(...)`**: Dành cho các lỗi nghiêm trọng làm ngắt quãng luồng xử lý hoặc Exception đụng tới Hệ thống (vd: Mất kết nối DB). Cần đính kèm stacktrace.
2. **`log.warn(...)`**: Dành cho các luồng xử lý bị chặn bởi Validation nghiệp vụ (vd: User nhập sai mật khẩu quá 5 lần, hoặc Giỏ hàng đã bị người khác mua mất).
3. **`log.info(...)`**: Dành cho các cột mốc quan trọng của hệ thống (vd: "User ABC vừa thanh toán thành công đơn hàng số 102").
4. **`log.debug(...)`**: Dành cho các dữ liệu chi tiết phục vụ việc debug khi code (vd: Câu lệnh SQL được sinh ra, payload raw từ Client gọi lên).

**Ví dụ Log Chuẩn:**
```java
@Slf4j
@Service
public class OrderService {
    public void createOrder(String userId) {
        log.info("Bắt đầu quy trình tạo đơn hàng cho user ID: {}", userId);
        try {
            // Xử lý logic...
        } catch (DataAccessException ex) {
            log.error("Lỗi truy xuất cơ sở dữ liệu khi tạo đơn hàng cho user: {}", userId, ex);
            throw new SystemException("Dịch vụ không khả dụng");
        }
    }
}
```
