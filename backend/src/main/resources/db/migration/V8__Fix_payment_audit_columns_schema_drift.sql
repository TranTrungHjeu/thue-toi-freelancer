-- Fix schema drift for payment tables that extend BaseEntity.
-- Some MySQL environments fail with "Unknown column 'updated_at' in 'field list'".
-- Use information_schema checks + dynamic SQL for compatibility.

-- payment_orders.created_at
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'payment_orders'
              AND COLUMN_NAME = 'created_at'
        ),
        'SELECT 1',
        'ALTER TABLE payment_orders ADD COLUMN created_at DATETIME NULL COMMENT ''Ngay tao'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payment_orders.updated_at
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'payment_orders'
              AND COLUMN_NAME = 'updated_at'
        ),
        'SELECT 1',
        'ALTER TABLE payment_orders ADD COLUMN updated_at DATETIME NULL COMMENT ''Ngay cap nhat'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE payment_orders
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE payment_orders
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngay tao',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngay cap nhat';

-- payment_webhook_events.created_at
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'payment_webhook_events'
              AND COLUMN_NAME = 'created_at'
        ),
        'SELECT 1',
        'ALTER TABLE payment_webhook_events ADD COLUMN created_at DATETIME NULL COMMENT ''Ngay tao'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payment_webhook_events.updated_at
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'payment_webhook_events'
              AND COLUMN_NAME = 'updated_at'
        ),
        'SELECT 1',
        'ALTER TABLE payment_webhook_events ADD COLUMN updated_at DATETIME NULL COMMENT ''Ngay cap nhat'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE payment_webhook_events
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE payment_webhook_events
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngay tao',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngay cap nhat';

-- wallet_ledger_entries.created_at
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'wallet_ledger_entries'
              AND COLUMN_NAME = 'created_at'
        ),
        'SELECT 1',
        'ALTER TABLE wallet_ledger_entries ADD COLUMN created_at DATETIME NULL COMMENT ''Ngay tao'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- wallet_ledger_entries.updated_at
SET @sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'wallet_ledger_entries'
              AND COLUMN_NAME = 'updated_at'
        ),
        'SELECT 1',
        'ALTER TABLE wallet_ledger_entries ADD COLUMN updated_at DATETIME NULL COMMENT ''Ngay cap nhat'''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE wallet_ledger_entries
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE wallet_ledger_entries
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngay tao',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngay cap nhat';
