-- V23__Enable_support_chat.sql
-- Cho phép contract_id có thể null để phục vụ chat với Admin
-- Thêm recipient_id để xác định người nhận tin nhắn (đặc biệt khi chat với admin)

ALTER TABLE messages MODIFY COLUMN contract_id BIGINT NULL;

ALTER TABLE messages
ADD COLUMN recipient_id BIGINT NULL AFTER sender_id;

-- Index phục vụ truy vấn chat hỗ trợ (contract_id is null)
CREATE INDEX idx_messages_support_chat ON messages (sender_id, recipient_id)
WHERE
    contract_id IS NULL;
