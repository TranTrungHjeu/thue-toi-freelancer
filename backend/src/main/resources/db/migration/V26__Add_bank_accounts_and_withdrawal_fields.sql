-- V26__Add_bank_accounts_and_withdrawal_fields.sql (Originally V22)
-- Tách thông tin ngân hàng của user thành bảng riêng để tái sử dụng cho rút tiền,
-- và bổ sung các cột cấu trúc cho withdrawal_requests phục vụ luồng:
--   1) User tạo request -> hold balance
--   2) Admin duyệt thủ công -> ghi order_code vào nội dung chuyển khoản ngân hàng
--   3) SePay webhook (transferType=out) đối soát order_code -> tự động COMPLETED

-- 1. Bảng bank_accounts: Tài khoản ngân hàng đã lưu của user (dùng để chọn nhanh khi rút tiền)
CREATE TABLE IF NOT EXISTS bank_accounts (
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
    CONSTRAINT fk_bank_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_bank_accounts_user (user_id),
    INDEX idx_bank_accounts_user_default (user_id, is_default)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2. Bổ sung các cột cấu trúc cho withdrawal_requests (Sử dụng procedure để an toàn)
SET @dbname = DATABASE();

SET @tablename = 'withdrawal_requests';

-- Thêm bank_name
SET @columnname = 'bank_name';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN bank_name VARCHAR(120) NULL COMMENT "Tên ngân hàng đích chuyển khoản" AFTER amount'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm bank_code
SET @columnname = 'bank_code';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN bank_code VARCHAR(32) NULL COMMENT "Mã VietQR ngân hàng đích (optional)" AFTER bank_name'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm account_number
SET @columnname = 'account_number';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN account_number VARCHAR(64) NULL COMMENT "Số tài khoản đích" AFTER bank_code'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm account_holder
SET @columnname = 'account_holder';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN account_holder VARCHAR(200) NULL COMMENT "Tên chủ tài khoản đích" AFTER account_number'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm qr_image_url
SET @columnname = 'qr_image_url';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN qr_image_url VARCHAR(512) NULL COMMENT "Ảnh QR do user tự cung cấp" AFTER account_holder'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm bank_account_id
SET @columnname = 'bank_account_id';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN bank_account_id BIGINT NULL COMMENT "Snapshot nguồn từ bank_accounts.id nếu user chọn tài khoản đã lưu" AFTER qr_image_url'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm order_code
SET @columnname = 'order_code';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN order_code VARCHAR(64) NULL COMMENT "Mã đơn rút tiền" AFTER bank_account_id'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm approved_at
SET @columnname = 'approved_at';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN approved_at DATETIME NULL COMMENT "Thời điểm admin duyệt" AFTER processed_by'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm completed_at
SET @columnname = 'completed_at';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN completed_at DATETIME NULL COMMENT "Thời điểm SePay webhook xác nhận đã chuyển ra" AFTER approved_at'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Thêm sepay_transaction_id
SET @columnname = 'sepay_transaction_id';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD COLUMN sepay_transaction_id VARCHAR(64) NULL COMMENT "ID giao dịch SePay khi auto-complete" AFTER completed_at'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Add constraints/indexes safely
SET @indexname = 'uk_withdrawal_order_code';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND INDEX_NAME = @indexname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD UNIQUE KEY uk_withdrawal_order_code (order_code)'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

SET @indexname = 'idx_withdrawal_status_created';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND INDEX_NAME = @indexname
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD INDEX idx_withdrawal_status_created (status, created_at)'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Foreign key (only add if column exists and constraint doesn't)
SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                    WHERE
                        CONSTRAINT_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND CONSTRAINT_NAME = 'fk_withdrawal_bank_account'
                ) > 0, 'SELECT 1', 'ALTER TABLE withdrawal_requests ADD CONSTRAINT fk_withdrawal_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;
