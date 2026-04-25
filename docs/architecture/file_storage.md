# Kiến Trúc Lưu Trữ File (File Storage Workflow)

Hệ thống Thuê Tôi Freelancer dùng Cloudinary làm storage provider duy nhất cho avatar và file đính kèm của `project`, `bid`, `message`.

Backend Spring Boot đóng vai trò proxy: frontend gửi multipart tới backend, backend kiểm tra quyền/nghiệp vụ, validate file, upload lên Cloudinary với `resource_type=auto`, rồi trả metadata HTTPS cho API nghiệp vụ lưu trong database.

## 1. Storage Strategy

- Provider: Cloudinary.
- URL lưu trữ: public HTTPS `secure_url` từ Cloudinary.
- Avatar vẫn dùng luồng `/api/v1/users/me/avatar`.
- File nghiệp vụ dùng endpoint chung `POST /api/v1/files/{context}`.
- Metadata nghiệp vụ lưu JSON trong cột `attachments` dạng `TEXT`, chưa tách bảng attachment trong slice này.
- Không có cleanup/delete Cloudinary cho upload bị bỏ dở ở v1.

## 2. Cloudinary Folder

Cloudinary đặt file dưới parent folder `thuetoi/`:

- `thuetoi/avatars/`: ảnh đại diện user.
- `thuetoi/projects/`: file của project.
- `thuetoi/bids/`: file của bid.
- `thuetoi/messages/`: file chat trong contract.

Tên file trên Cloudinary dùng UUID/timestamp để tránh trùng.

## 3. Public Upload API

```http
POST /api/v1/files/{context}
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

`context` hợp lệ:

- `projects`
- `bids`
- `messages`

Form field:

- `files`: một hoặc nhiều file.

Query:

- `projects`: `projectId` optional, dùng khi upload cho project đã tồn tại.
- `bids`: bắt buộc `projectId`.
- `messages`: bắt buộc `contractId`.

Response data:

```json
[
  {
    "url": "https://res.cloudinary.com/demo/raw/upload/v1/thuetoi/messages/file.pdf",
    "name": "file.pdf",
    "contentType": "application/pdf",
    "size": 1200,
    "storageProvider": "cloudinary"
  }
]
```

Frontend phải gửi response metadata này vào `ProjectRequest.attachments`, `BidRequest.attachments`, hoặc `MessageRequest.attachments`.

## 4. Validation

Backend enforce:

- Tối đa 5 file mỗi entity.
- Tối đa 5 MB mỗi file.
- `spring.servlet.multipart.max-request-size` giữ 10 MB.
- Không nhận file rỗng.
- Không nhận filename chứa path traversal (`..`, `/`, `\`).
- Extension hợp lệ: `jpg`, `jpeg`, `png`, `webp`, `pdf`, `docx`, `xlsx`, `pptx`, `txt`.
- MIME hợp lệ: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, MIME chuẩn của `docx/xlsx/pptx`, `text/plain`.
- Metadata lưu nghiệp vụ phải có HTTPS URL, filename an toàn, MIME/extension hợp lệ, size không vượt limit.

Error codes:

- `ERR_FILE_01`: file hoặc metadata không hợp lệ.
- `ERR_FILE_02`: upload storage thất bại.
- `ERR_FILE_03`: context upload không hợp lệ.

## 5. Access Rules

Upload luôn yêu cầu auth và kiểm tra trước khi gửi file lên Cloudinary:

- `projects`: chỉ `customer`; nếu có `projectId` thì phải là owner project.
- `bids`: chỉ `freelancer`; `projectId` bắt buộc; project phải `open`; freelancer không được upload cho project của chính mình.
- `messages`: chỉ participant của contract; contract phải `in_progress`.

## 6. Frontend Flow

1. Người dùng chọn file qua `FileUpload`.
2. Frontend gọi `marketplaceApi.uploadFiles(context, files, params)`.
3. API upload trả `FileUploadResponse[]`.
4. Frontend gửi metadata vào API nghiệp vụ:
   - `POST /projects` hoặc `PUT /projects/{id}`
   - `POST /bids`
   - `POST /messages`
5. UI hiển thị link tải theo `name`, `size`, `contentType`.

Frontend không nhập URL thủ công cho project/bid/chat file.
