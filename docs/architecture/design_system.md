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
Mọi nút bấm phải sử dụng `<Button />` component chung từ `common/` (theo ui_standard.md "Strict Sharpness"):
- `!rounded-none`, `border-2`, primary emerald-600.
- Sử dụng Tailwind classes từ tailwind.config.js và common/Button.jsx.
- Hiệu ứng hover transition-all, không dùng shadow nặng.

### 3.2 Khối Thông Tin (Card)
Mọi Project Card, Form hay component hiển thị phải sử dụng Card component chung (theo ui_standard.md):
- Màu nền: `bg-white` hoặc `bg-gray-50`
- **Góc vuông tuyệt đối**: `!rounded-none` (strict sharpness)
- Viền đậm: `border-2 border-slate-900`
- Không dùng shadow nặng; ưu tiên contrast cao và spacing `p-6`

## 4. Hiệu Ứng (Micro-Animations & Glassmorphism)
Một giao diện chết là giao diện không phản hồi.
- Khi Hover vào ảnh Gói Dịch Vụ `<img>`: Cần Zoom nhẹ lên 5% `hover:scale-105 transition-transform duration-300`.
- Khi Hiện Popup (Modal): Nền đằng sau phải được làm mờ (Blur) bằng Backdrop Filter thay vì chỉ lấy màu đen trong suốt.
- Tailwind class: `backdrop-blur-sm bg-black/30`.

## 5. Typography (Phông Chữ)
- Theo ui_standard.md: Tiêu đề dùng **Lora** (serif), nội dung dùng **Manrope** (sans-serif). Load via Google Fonts in index.html.
- Chữ tiêu đề: `font-bold text-slate-900`, nội dung: `text-slate-700`.

**Note**: `ui_standard.md` là tài liệu authoritative cho Strict Sharpness. Design system này được reconcile để phù hợp với current implementation (no rounded corners, border-2, emerald/slate palette).
