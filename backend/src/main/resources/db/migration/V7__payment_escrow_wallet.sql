-- Payment orders (SePay VA v2), webhook idempotency, immutable wallet ledger

ALTER TABLE projects MODIFY COLUMN status ENUM(
    'open',
    'pending_payment',
    'in_progress',
    'completed',
    'cancelled'
) NOT NULL DEFAULT 'open' COMMENT 'Trạng thái dự án';

CREATE TABLE payment_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_code VARCHAR(64) NOT NULL COMMENT 'Mã đơn nội bộ + gửi SePay order_code',
    provider VARCHAR(32) NOT NULL DEFAULT 'sepay',
    bid_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(32) NOT NULL COMMENT 'pending, paid, expired, cancelled, failed',
    sepay_order_xid VARCHAR(64) COMMENT 'UUID đơn SePay v2',
    va_number VARCHAR(128),
    va_holder_name VARCHAR(255),
    bank_name VARCHAR(128),
    account_number VARCHAR(128),
    qr_code MEDIUMTEXT,
    qr_code_url VARCHAR(1024),
    expired_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payment_order_code (order_code),
    FOREIGN KEY (bid_id) REFERENCES bids (id),
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (customer_id) REFERENCES users (id),
    INDEX idx_payment_project_status (project_id, status),
    INDEX idx_payment_bid (bid_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_webhook_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sepay_transaction_id VARCHAR(64) NOT NULL,
    order_code VARCHAR(64),
    reference_code VARCHAR(255),
    transfer_amount DECIMAL(19, 2),
    transfer_type VARCHAR(16),
    raw_payload_json JSON NOT NULL,
    payment_order_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_sepay_tx (sepay_transaction_id),
    INDEX idx_pwe_order_code (order_code),
    FOREIGN KEY (payment_order_id) REFERENCES payment_orders (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wallet_ledger_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    contract_id BIGINT,
    payment_order_id BIGINT,
    entry_type VARCHAR(32) NOT NULL COMMENT 'escrow_in, release_milestone, platform_fee, balance_adjust, withdrawal_hold, withdrawal_payout',
    amount DECIMAL(19, 2) NOT NULL,
    description VARCHAR(512),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (contract_id) REFERENCES contracts (id),
    FOREIGN KEY (payment_order_id) REFERENCES payment_orders (id),
    INDEX idx_wle_user (user_id),
    INDEX idx_wle_contract (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
