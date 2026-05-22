-- V27__Add_pagination_indexes_wallet_ledger_withdrawals.sql (Originally V23)
-- Index composite cho các truy vấn phân trang theo user + sắp xếp giảm dần theo created_at.

SET @dbname = DATABASE();

-- 1) wallet_ledger_entries
SET @tablename = 'wallet_ledger_entries';

SET @indexname = 'idx_wle_user_created';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND INDEX_NAME = @indexname
                ) > 0, 'SELECT 1', 'CREATE INDEX idx_wle_user_created ON wallet_ledger_entries (user_id, created_at DESC)'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- 2) withdrawal_requests
SET @tablename = 'withdrawal_requests';

SET @indexname = 'idx_withdrawal_user_created';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND INDEX_NAME = @indexname
                ) > 0, 'SELECT 1', 'CREATE INDEX idx_withdrawal_user_created ON withdrawal_requests (user_id, created_at DESC)'
            )
    );

PREPARE stmt FROM @preparedStatement;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;
