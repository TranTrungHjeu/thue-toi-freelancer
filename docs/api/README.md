# API Docs

Thư mục này lưu tài liệu API chính thức của dự án, dùng làm nguồn tham chiếu cho frontend, backend và QA.

- `official_endpoint_contract.md`: danh sách endpoint chính thức đang chạy, request/response chuẩn, ownership và rule nghiệp vụ kèm theo.

Nguyên tắc sử dụng:

- Ưu tiên đối chiếu file này trước khi sửa API client hoặc service layer.
- Khi thay đổi request/response hoặc business rule, phải cập nhật tài liệu trong cùng nhánh làm việc.
- Mọi payload lỗi phải tiếp tục bám `docs/architecture/error_codes.md`.
