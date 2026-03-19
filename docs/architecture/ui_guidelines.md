# Quy Chuẩn UI Design (UI Design Guidelines)

Tài liệu này tổng hợp các quy chuẩn UI đã thống nhất cho toàn bộ dự án, mọi thành viên phải tuân thủ khi phát triển giao diện.

## 1. Màu sắc & Theme

- Sử dụng Tailwind CSS, chỉ dùng các màu đã định nghĩa trong tailwind.config.js.
- Primary: #16a34a (bg-primary-600)
- Secondary: #0f172a (bg-secondary-900)
- Background: bg-gray-50, Card: bg-white

## 2. Khoảng trắng & Layout

- Padding tối thiểu cho Box/Card: p-6
- Nội dung chính luôn bọc trong: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

## 3. Component chuẩn (Atomic Components)

- Button: src/components/common/Button.jsx
- Card: src/components/common/Card.jsx
- Typography: src/components/common/Typography.jsx
- Input: src/components/common/Input.jsx

## 4. Hiệu ứng & Animation

- Hover ảnh: hover:scale-105 transition-transform duration-300
- Modal: backdrop-blur-sm bg-black/30

## 5. Typography

- Font: Inter hoặc Roboto (sans-serif)
- Tiêu đề: font-bold, text-gray-900
- Nội dung: text-gray-600

## 6. Quy định bổ sung

- Không tự ý thêm màu mới hoặc class Tailwind ngoài quy chuẩn.
- Tất cả component UI phải tái sử dụng, không lặp code HTML.
- Nếu cần component mới, phải cập nhật guideline này.

---

## Danh sách file component chuẩn

- [frontend/src/components/common/Button.jsx](../../frontend/src/components/common/Button.jsx)
- [frontend/src/components/common/Card.jsx](../../frontend/src/components/common/Card.jsx)
- [frontend/src/components/common/Typography.jsx](../../frontend/src/components/common/Typography.jsx)
- [frontend/src/components/common/Input.jsx](../../frontend/src/components/common/Input.jsx)

## Tham khảo thêm

- [docs/architecture/design_system.md](design_system.md)
- [tailwind.config.js](../../frontend/tailwind.config.js)
