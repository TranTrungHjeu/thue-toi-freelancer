# Hệ Thống Thiết Kế Giao Diện (UI Design System)

Để website có giao diện **Cực kỳ Chuyên Nghiệp (Premium & High-End)**, khác biệt hoàn toàn với các đồ án sinh viên lộn xộn, toàn thể team Frontend phải tuân thủ nghiêm ngặt hệ thống thiết kế này sử dụng Tailwind CSS.

## 1. Màu Sắc Chủ Đạo (Color Palette)
Bạn KHÔNG được phép dùng các màu tuỳ hứng (như `bg-red-500`, `text-blue-600`) trừ khi là các Alert cảnh báo. Toàn bộ UI sẽ chạy trên Base 3 màu:
- **Primary Color (Xanh ngọc lục bảo - Sáng tạo & Tín nhiệm)**: Dùng cho Nút bấm chính, Icon nổi bật, Link đang hover.
  - Sử dụng Tailwind class: `bg-primary-600` (Mã Hex: `#16a34a`)
- **Secondary Color (Xám đá đậm - Sang trọng)**: Dùng cho Footer, Thanh điều hướng (Navbar) tuỳ chọn, Text tiêu đề to (H1, H2).
  - Sử dụng Tailwind class: `bg-secondary-900` (Mã Hex: `#0f172a`)
- **Background Color**: Không xài `bg-white` tinh khiết làm nền tổng, phải dùng `bg-gray-50` để mắt đỡ mỏi và làm nổi bật các khối Trắng (Card).

## 2. Nghệ Thuật Khoảng Trắng (Spacing & Padding)
Đây là bí mật của một giao diện "đắt tiền". 
- Tuyệt đối không để các thành phần (Chữ, Nút bấm) dính sát vào nhau. 
- Mọi Box, Card luôn phải có tối thiểu `p-6` (24px) Padding.
- Luôn bọc toàn bộ Nội dung chính (Page Content) vào class: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` để website luôn nằm giữa màn hình và không bị vỡ trên màn to (4K).

## 3. Cấu Trúc Thành Phần (Atomic Components)
Thay vì code HTML lặp đi lặp lại ở mọi trang, hãy tạo sẵn các React Component chuẩn:

### 3.1 Nút Bấm (Button)
Mọi nút bấm trong App phải là Component `<Button />`, được bo góc vừa phải (`rounded-md`), có hiệu ứng Bóng (`shadow-sm`) và chuyển màu mượt khi Hover (`transition-all`).
```jsx
// Ví dụ Button Chính
<button className="bg-primary-600 text-white px-5 py-2 rounded-md shadow hover:bg-primary-700 transition">
   Bắt Đầu Ngay
</button>
```

### 3.2 Khối Thông Tin (Card)
Bất kỳ một Gói Dịch Vụ (Gig) hay Form Đăng Nhập nào cũng phải đặt trong một Card:
- Màu nền: `bg-white`
- Bo góc: `rounded-xl`
- Đổ bóng nhẹ: `shadow-sm hover:shadow-md transition-shadow`
- Viền mảnh mờ: `border border-gray-100`

## 4. Hiệu Ứng (Micro-Animations & Glassmorphism)
Một giao diện chết là giao diện không phản hồi.
- Khi Hover vào ảnh Gói Dịch Vụ `<img>`: Cần Zoom nhẹ lên 5% `hover:scale-105 transition-transform duration-300`.
- Khi Hiện Popup (Modal): Nền đằng sau phải được làm mờ (Blur) bằng Backdrop Filter thay vì chỉ lấy màu đen trong suốt.
- Tailwind class: `backdrop-blur-sm bg-black/30`.

## 5. Typography (Phông Chữ)
- Dùng Font sans-serif hiện đại, vuông vức (như `Inter` hoặc `Roboto`). Đã được Tailwind mặc định gán cho thẻ `body`.
- Chữ tiêu đề luôn ưu tiên làm đậm `font-semibold` hoặc `font-bold` và chữ đen than `text-gray-900`. Chữ nội dung làm mờ hơn `text-gray-600`.
