-- V3__Add_admin_and_financial_tables.sql
-- Thêm các bảng phục vụ quản trị, tài chính và nâng cấp trường dữ liệu cho người dùng

-- 1. Cập nhật bảng users: Thêm trường số dư (balance)
ALTER TABLE users ADD COLUMN balance DECIMAL(19, 2) DEFAULT 0.00 COMMENT 'Số dư tài khoản của người dùng';

-- 2. Bảng withdrawal_requests: Quản lý yêu cầu rút tiền
CREATE TABLE withdrawal_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    bank_info TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    note TEXT,
    processed_by BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_withdrawal_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bảng system_settings: Cấu hình tham số hệ thống
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Bảng kyc_requests: Yêu cầu xác thực tài khoản
CREATE TABLE kyc_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_kyc_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Bảng app_reports: Báo cáo vi phạm (Dùng app_reports để tránh keyword 'report')
CREATE TABLE app_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reporter_id BIGINT NOT NULL,
    target_type VARCHAR(50) NOT NULL COMMENT 'PROJECT, USER',
    target_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, RESOLVED, DISMISSED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    INDEX idx_reports_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dữ liệu mẫu ban đầu cho Cấu hình hệ thống
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('platform_fee_percent', '10', 'Phần trăm phí sàn thu từ mỗi dự án hoàn thành'),
('min_withdrawal_amount', '50000', 'Mức rút tiền tối thiểu cho mỗi lần thực hiện'),
('auto_approve_projects', 'false', 'Tự động duyệt dự án mới đăng'),
('maintenance_mode', 'false', 'Bật/tắt chế độ bảo trì toàn sàn');
