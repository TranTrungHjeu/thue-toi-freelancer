-- Fix schema drift for transaction_history (entity extends BaseEntity).
-- Some environments are missing updated_at, causing:
-- "Unknown column 'updated_at' in 'field list'".

SET
    @sql = (
        SELECT IF(
                EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE
                        TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'transaction_history'
                ), IF(
                    EXISTS (
                        SELECT 1
                        FROM information_schema.COLUMNS
                        WHERE
                            TABLE_SCHEMA = DATABASE()
                            AND TABLE_NAME = 'transaction_history'
                            AND COLUMN_NAME = 'updated_at'
                    ), 'SELECT 1', 'ALTER TABLE transaction_history ADD COLUMN updated_at DATETIME NULL COMMENT ''Ngay cap nhat'''
                ), 'SELECT 1'
            )
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

SET
    @sql = (
        SELECT IF(
                EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE
                        TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'transaction_history'
                ), 'UPDATE transaction_history SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL', 'SELECT 1'
            )
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

SET
    @sql = (
        SELECT IF(
                EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE
                        TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'transaction_history'
                ), 'ALTER TABLE transaction_history MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''Ngay cap nhat''', 'SELECT 1'
            )
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;
