ALTER TABLE users ADD COLUMN kyc_approved BOOLEAN DEFAULT FALSE;

-- Cập nhật lại những người dùng đã có KycRequest được APPROVED
UPDATE users u
SET
    kyc_approved = TRUE
WHERE
    EXISTS (
        SELECT 1
        FROM kyc_requests k
        WHERE
            k.user_id = u.id
            AND k.status = 'APPROVED'
    );
