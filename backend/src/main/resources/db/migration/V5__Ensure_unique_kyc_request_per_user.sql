-- V5__Ensure_unique_kyc_request_per_user.sql
-- Mỗi user chỉ được có một dòng KYC để tránh tranh chấp dữ liệu và lỗi Optional query.

-- Giữ lại bản ghi mới nhất theo id cho mỗi user (nếu dữ liệu cũ có trùng).
DELETE older
FROM
    kyc_requests older
    INNER JOIN kyc_requests newer ON older.user_id = newer.user_id
    AND older.id < newer.id;

-- Enforce ràng buộc duy nhất cho user_id.
ALTER TABLE kyc_requests
ADD CONSTRAINT uk_kyc_requests_user UNIQUE (user_id);
