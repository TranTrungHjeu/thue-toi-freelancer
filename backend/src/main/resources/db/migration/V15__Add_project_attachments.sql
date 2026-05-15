-- Idempotent: tránh lỗi khi migration từng fail giữa chừng hoặc cột đã được tạo thủ công.
SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'projects'
      AND COLUMN_NAME = 'attachments'
);

SET @ddl := IF(
    @col_exists > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN attachments TEXT NULL COMMENT ''File đính kèm của project'' AFTER deadline'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
