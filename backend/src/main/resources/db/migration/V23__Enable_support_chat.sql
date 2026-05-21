-- V23__Enable_support_chat.sql
-- Cho phép contract_id có thể null để phục vụ chat với Admin
-- Thêm recipient_id để xác định người nhận tin nhắn (đặc biệt khi chat với admin)

ALTER TABLE messages MODIFY COLUMN contract_id BIGINT NULL;

SET @dbname = DATABASE();

SET @tablename = 'messages';

SET @columnname = 'recipient_id';

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
                ) > 0, 'SELECT 1', 'ALTER TABLE messages ADD COLUMN recipient_id BIGINT NULL AFTER sender_id'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- Index phục vụ truy vấn chat hỗ trợ (contract_id is null)
CREATE INDEX idx_messages_support_chat ON messages (sender_id, recipient_id);
