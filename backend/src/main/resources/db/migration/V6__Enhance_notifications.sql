ALTER TABLE notifications
    ADD COLUMN event_key VARCHAR(191) NULL COMMENT 'Khóa idempotency nghiệp vụ',
    ADD COLUMN archived_at DATETIME NULL COMMENT 'Thời điểm lưu trữ notification',
    ADD COLUMN deleted_at DATETIME NULL COMMENT 'Thời điểm xóa mềm notification',
    ADD COLUMN read_at DATETIME NULL COMMENT 'Thời điểm đánh dấu đã đọc',
    ADD COLUMN email_sent_at DATETIME NULL COMMENT 'Thời điểm gửi email notification',
    ADD COLUMN email_delivery_status VARCHAR(32) NULL COMMENT 'Trạng thái gửi email notification';

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at);
CREATE INDEX idx_notifications_user_unread_active ON notifications (user_id, is_read, deleted_at, archived_at);
CREATE INDEX idx_notifications_user_type_active ON notifications (user_id, type, deleted_at, archived_at);
CREATE UNIQUE INDEX uq_notifications_user_event_key ON notifications (user_id, event_key);

CREATE TABLE notification_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính preference',
    user_id BIGINT NOT NULL COMMENT 'Người dùng sở hữu preference',
    type ENUM('project', 'bid', 'contract', 'system') NOT NULL COMMENT 'Loại notification',
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cho phép inbox/realtime trong app',
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Cho phép gửi email',
    browser_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Cho phép hiển thị browser notification',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
    CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE KEY uq_notification_preferences_user_type (user_id, type),
    INDEX idx_notification_preferences_user (user_id)
);

CREATE TABLE notification_delivery_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính delivery log',
    notification_id BIGINT NULL COMMENT 'Notification liên quan',
    user_id BIGINT NOT NULL COMMENT 'Người nhận',
    channel VARCHAR(32) NOT NULL COMMENT 'Kênh gửi: in_app, websocket, email',
    status VARCHAR(32) NOT NULL COMMENT 'Trạng thái: created, sent, skipped, failed',
    detail VARCHAR(500) NULL COMMENT 'Chi tiết ngắn phục vụ vận hành',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày ghi log',
    CONSTRAINT fk_notification_delivery_logs_notification FOREIGN KEY (notification_id) REFERENCES notifications (id),
    CONSTRAINT fk_notification_delivery_logs_user FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_notification_delivery_logs_notification (notification_id),
    INDEX idx_notification_delivery_logs_user_created (user_id, created_at),
    INDEX idx_notification_delivery_logs_channel_status (channel, status)
);
