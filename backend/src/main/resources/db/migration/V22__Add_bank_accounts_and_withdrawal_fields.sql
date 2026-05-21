-- V22__Add_bank_accounts_and_withdrawal_fields.sql
-- Tách thông tin ngân hàng của user thành bảng riêng để tái sử dụng cho rút tiền,
-- và bổ sung các cột cấu trúc cho withdrawal_requests phục vụ luồng:
--   1) User tạo request -> hold balance
--   2) Admin duyệt thủ công -> ghi order_code vào nội dung chuyển khoản ngân hàng
--   3) SePay webhook (transferType=out) đối soát order_code -> tự động COMPLETED

-- 1. Bảng bank_accounts: Tài khoản ngân hàng đã lưu của user (dùng để chọn nhanh khi rút tiền)
CREATE TABLE bank_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    bank_name VARCHAR(120) NOT NULL COMMENT 'Tên ngân hàng (VD: Vietcombank)',
    bank_code VARCHAR(32) DEFAULT NULL COMMENT 'Mã VietQR (VD: VCB, MB) - optional để build QR động',
    account_number VARCHAR(64) NOT NULL COMMENT 'Số tài khoản',
    account_holder VARCHAR(200) NOT NULL COMMENT 'Tên chủ tài khoản',
    qr_image_url VARCHAR(512) DEFAULT NULL COMMENT 'Ảnh QR do user tự upload (Cloudinary)',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bank_accounts_user (user_id),
    INDEX idx_bank_accounts_user_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Bổ sung các cột cấu trúc cho withdrawal_requests
ALTER TABLE withdrawal_requests
    MODIFY COLUMN bank_info VARCHAR(1000) NULL COMMENT 'Mô tả tự do (backward-compat) hoặc fallback khi thiếu cột cấu trúc',
    ADD COLUMN bank_name VARCHAR(120) NULL COMMENT 'Tên ngân hàng đích chuyển khoản' AFTER amount,
    ADD COLUMN bank_code VARCHAR(32) NULL COMMENT 'Mã VietQR ngân hàng đích (optional)' AFTER bank_name,
    ADD COLUMN account_number VARCHAR(64) NULL COMMENT 'Số tài khoản đích' AFTER bank_code,
    ADD COLUMN account_holder VARCHAR(200) NULL COMMENT 'Tên chủ tài khoản đích' AFTER account_number,
    ADD COLUMN qr_image_url VARCHAR(512) NULL COMMENT 'Ảnh QR do user tự cung cấp' AFTER account_holder,
    ADD COLUMN bank_account_id BIGINT NULL COMMENT 'Snapshot nguồn từ bank_accounts.id nếu user chọn tài khoản đã lưu' AFTER qr_image_url,
    ADD COLUMN order_code VARCHAR(64) NULL COMMENT 'Mã đơn rút tiền (TTW<userId>R<id>X<8hex>) - admin ghi vào nội dung chuyển khoản' AFTER bank_account_id,
    ADD COLUMN approved_at DATETIME NULL COMMENT 'Thời điểm admin duyệt' AFTER processed_by,
    ADD COLUMN completed_at DATETIME NULL COMMENT 'Thời điểm SePay webhook xác nhận đã chuyển ra' AFTER approved_at,
    ADD COLUMN sepay_transaction_id VARCHAR(64) NULL COMMENT 'ID giao dịch SePay khi auto-complete' AFTER completed_at,
    ADD CONSTRAINT fk_withdrawal_bank_account
        FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
    ADD UNIQUE KEY uk_withdrawal_order_code (order_code),
    ADD INDEX idx_withdrawal_status_created (status, created_at);
