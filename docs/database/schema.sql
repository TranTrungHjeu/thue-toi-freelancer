-- Bảng users: Quản lý thông tin người dùng, freelancer, khách hàng
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã người dùng',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email đăng nhập, duy nhất',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Mã hóa mật khẩu',
    full_name VARCHAR(255) NOT NULL COMMENT 'Họ tên đầy đủ',
    role ENUM(
        'freelancer',
        'customer',
        'admin'
    ) NOT NULL COMMENT 'Vai trò: freelancer, khách hàng, admin',
    avatar_url VARCHAR(255) COMMENT 'Đường dẫn ảnh đại diện',
    profile_description TEXT COMMENT 'Mô tả cá nhân, giới thiệu',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái hoạt động',
    verified BOOLEAN DEFAULT FALSE COMMENT 'Tài khoản đã xác thực email hay chưa',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật'
);

-- Bảng email_otps: Lưu mã OTP để xác thực email và hỗ trợ quên mật khẩu về sau
CREATE TABLE email_otps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính',
    email VARCHAR(255) NOT NULL COMMENT 'Email nhận OTP',
    otp VARCHAR(10) NOT NULL COMMENT 'Mã OTP',
    purpose VARCHAR(50) NOT NULL COMMENT 'Mục đích OTP: verify_email, reset_password',
    expire_time DATETIME NOT NULL COMMENT 'Thời điểm hết hạn OTP',
    used BOOLEAN DEFAULT FALSE COMMENT 'OTP đã được sử dụng hay chưa',
    used_at DATETIME COMMENT 'Thời điểm OTP được sử dụng',
    created_at DATETIME NOT NULL COMMENT 'Ngày tạo',
    INDEX idx_email_otps_email_purpose (email, purpose),
    INDEX idx_email_otps_email_otp (email, otp)
);

-- Bảng refresh_tokens: Lưu refresh token để làm mới access token và thu hồi khi logout
CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã refresh token',
    user_id BIGINT NOT NULL COMMENT 'Mã người dùng sở hữu token',
    token_hash VARCHAR(128) UNIQUE NOT NULL COMMENT 'Mã băm SHA-256 của refresh token',
    expires_at DATETIME NOT NULL COMMENT 'Thời điểm hết hạn refresh token',
    revoked BOOLEAN DEFAULT FALSE COMMENT 'Token đã bị thu hồi hay chưa',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
    FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_refresh_user_id (user_id),
    INDEX idx_refresh_revoked (revoked),
    INDEX idx_refresh_expires_at (expires_at)
);
-- Bảng skills: Danh sách kỹ năng chuẩn hóa
CREATE TABLE skills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã kỹ năng',
    name VARCHAR(100) UNIQUE NOT NULL COMMENT 'Tên kỹ năng, duy nhất',
    description TEXT COMMENT 'Mô tả kỹ năng',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật'
);
-- Bảng users_skills: Liên kết người dùng với kỹ năng (many-to-many)
CREATE TABLE users_skills (
    user_id BIGINT NOT NULL COMMENT 'Mã người dùng',
    skill_id BIGINT NOT NULL COMMENT 'Mã kỹ năng',
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (skill_id) REFERENCES skills (id),
    INDEX idx_user_id (user_id),
    INDEX idx_skill_id (skill_id)
);
-- Bảng projects: Quản lý dự án/việc làm
CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã dự án',
    user_id BIGINT NOT NULL COMMENT 'Mã chủ dự án (khách hàng)',
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề dự án',
    description TEXT COMMENT 'Mô tả chi tiết dự án',
    budget_min DECIMAL(12, 2) COMMENT 'Ngân sách tối thiểu',
    budget_max DECIMAL(12, 2) COMMENT 'Ngân sách tối đa',
    deadline DATETIME COMMENT 'Thời hạn hoàn thành mong muốn',
    attachments TEXT COMMENT 'File đính kèm của project',
    status ENUM(
        'open',
        'in_progress',
        'completed',
        'cancelled'
    ) DEFAULT 'open' COMMENT 'Trạng thái dự án',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
    FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);
-- Bảng projects_skills: Liên kết dự án với kỹ năng (many-to-many)
CREATE TABLE projects_skills (
    project_id BIGINT NOT NULL COMMENT 'Mã dự án',
    skill_id BIGINT NOT NULL COMMENT 'Mã kỹ năng',
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (skill_id) REFERENCES skills (id),
    INDEX idx_project_id (project_id),
    INDEX idx_skill_id (skill_id)
);
-- Bảng bids: Báo giá/đề xuất của freelancer cho dự án
CREATE TABLE bids (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã báo giá',
    project_id BIGINT NOT NULL COMMENT 'Mã dự án',
    freelancer_id BIGINT NOT NULL COMMENT 'Mã freelancer',
    price DECIMAL(12, 2) NOT NULL COMMENT 'Giá đề xuất',
    message TEXT COMMENT 'Nội dung đề xuất, giải pháp',
    estimated_time VARCHAR(50) COMMENT 'Thời gian dự kiến hoàn thành',
    attachments TEXT COMMENT 'File đính kèm (portfolio, proposal)',
    status ENUM(
        'pending',
        'accepted',
        'rejected',
        'withdrawn'
    ) DEFAULT 'pending' COMMENT 'Trạng thái báo giá',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (freelancer_id) REFERENCES users (id),
    INDEX idx_project_id (project_id),
    INDEX idx_freelancer_id (freelancer_id),
    INDEX idx_status (status)
);
-- Bảng contracts: Quản lý hợp đồng giữa khách và freelancer
CREATE TABLE contracts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã hợp đồng',
    project_id BIGINT NOT NULL COMMENT 'Mã dự án',
    freelancer_id BIGINT NOT NULL COMMENT 'Mã freelancer',
    customer_id BIGINT NOT NULL COMMENT 'Mã khách hàng',
    agreed_price DECIMAL(12, 2) NOT NULL COMMENT 'Giá đã thỏa thuận',
    progress INT DEFAULT 0 COMMENT 'Tiến độ hoàn thành (%)',
    status ENUM(
        'in_progress',
        'completed',
        'cancelled'
    ) DEFAULT 'in_progress' COMMENT 'Trạng thái hợp đồng',
    start_date DATETIME COMMENT 'Ngày bắt đầu',
    end_date DATETIME COMMENT 'Ngày kết thúc',
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (freelancer_id) REFERENCES users (id),
    FOREIGN KEY (customer_id) REFERENCES users (id),
    INDEX idx_project_id (project_id),
    INDEX idx_freelancer_id (freelancer_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status)
);
-- Bảng milestones: Quản lý các mốc thanh toán/hợp đồng
CREATE TABLE milestones (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã milestone',
    contract_id BIGINT NOT NULL COMMENT 'Mã hợp đồng',
    title VARCHAR(255) NOT NULL COMMENT 'Tên milestone',
    amount DECIMAL(12, 2) NOT NULL COMMENT 'Số tiền milestone',
    due_date DATETIME COMMENT 'Ngày đến hạn',
    status ENUM(
        'pending',
        'completed',
        'cancelled'
    ) DEFAULT 'pending' COMMENT 'Trạng thái milestone',
    FOREIGN KEY (contract_id) REFERENCES contracts (id),
    INDEX idx_contract_id (contract_id),
    INDEX idx_status (status)
);
-- Bảng reviews: Đánh giá sau khi hoàn thành hợp đồng
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã đánh giá',
    contract_id BIGINT NOT NULL COMMENT 'Mã hợp đồng',
    reviewer_id BIGINT NOT NULL COMMENT 'Mã người đánh giá',
    rating INT CHECK (rating BETWEEN 1 AND 5) COMMENT 'Điểm đánh giá (1-5)',
    comment TEXT COMMENT 'Nội dung đánh giá',
    reply TEXT COMMENT 'Phản hồi của freelancer/khách',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
    FOREIGN KEY (contract_id) REFERENCES contracts (id),
    FOREIGN KEY (reviewer_id) REFERENCES users (id),
    INDEX idx_contract_id (contract_id),
    INDEX idx_reviewer_id (reviewer_id)
);
-- Bảng messages: Trao đổi giữa khách và freelancer trong hợp đồng
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã tin nhắn',
    contract_id BIGINT NOT NULL COMMENT 'Mã hợp đồng',
    sender_id BIGINT NOT NULL COMMENT 'Mã người gửi',
    message_type ENUM('text', 'file', 'system') DEFAULT 'text' COMMENT 'Loại tin nhắn',
    content TEXT COMMENT 'Nội dung tin nhắn',
    attachments TEXT COMMENT 'File đính kèm',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian gửi',
    FOREIGN KEY (contract_id) REFERENCES contracts (id),
    FOREIGN KEY (sender_id) REFERENCES users (id),
    INDEX idx_contract_id (contract_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_message_type (message_type)
);
-- Bảng transaction_history: Lịch sử thanh toán hợp đồng
CREATE TABLE transaction_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã giao dịch',
    contract_id BIGINT NOT NULL COMMENT 'Mã hợp đồng',
    amount DECIMAL(12, 2) NOT NULL COMMENT 'Số tiền giao dịch',
    method VARCHAR(50) COMMENT 'Phương thức thanh toán',
    status ENUM(
        'pending',
        'completed',
        'failed'
    ) DEFAULT 'pending' COMMENT 'Trạng thái giao dịch',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    FOREIGN KEY (contract_id) REFERENCES contracts (id),
    INDEX idx_contract_id (contract_id),
    INDEX idx_status (status)
);
-- Bảng notifications: Thông báo cho người dùng
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'Khóa chính, mã thông báo',
    user_id BIGINT NOT NULL COMMENT 'Mã người nhận',
    type ENUM(
        'project',
        'bid',
        'contract',
        'system'
    ) DEFAULT 'system' COMMENT 'Loại thông báo',
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo',
    content TEXT COMMENT 'Nội dung thông báo',
    link VARCHAR(255) COMMENT 'Đường dẫn liên quan',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc hay chưa',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    FOREIGN KEY (user_id) REFERENCES users (id),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read)
);
