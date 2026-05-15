-- Fix schema drift for email_otps used by EmailOtp entity.
-- Some environments are missing purpose/used_at and related indexes.

-- Add email_otps.purpose
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'email_otps'
              AND COLUMN_NAME = 'purpose'
        ),
        'SELECT 1',
        'ALTER TABLE email_otps ADD COLUMN purpose VARCHAR(50) NOT NULL DEFAULT ''verify_email'' COMMENT ''Mục đích OTP: verify_email, reset_password'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add email_otps.used_at
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'email_otps'
              AND COLUMN_NAME = 'used_at'
        ),
        'SELECT 1',
        'ALTER TABLE email_otps ADD COLUMN used_at DATETIME(6) NULL COMMENT ''Thời điểm OTP được sử dụng'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: (email, purpose)
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'email_otps'
              AND INDEX_NAME = 'idx_email_otps_email_purpose'
        ),
        'SELECT 1',
        'CREATE INDEX idx_email_otps_email_purpose ON email_otps (email, purpose)'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: (email, otp)
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'email_otps'
              AND INDEX_NAME = 'idx_email_otps_email_otp'
        ),
        'SELECT 1',
        'CREATE INDEX idx_email_otps_email_otp ON email_otps (email, otp)'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
