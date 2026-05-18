-- Make refresh_tokens.token_hash migration resilient across legacy schemas.
-- Handles both cases:
--   1) Legacy table had plaintext token column.
--   2) Current table already stores token_hash and has no token column.

-- Step 1: Ensure token_hash exists (nullable during backfill).
SET @has_token_hash_column = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'refresh_tokens'
      AND column_name = 'token_hash'
);
SET @add_token_hash_column_sql = IF(
    @has_token_hash_column = 0,
    'ALTER TABLE refresh_tokens ADD COLUMN token_hash VARCHAR(128)',
    'SELECT 1'
);
PREPARE add_token_hash_column_stmt FROM @add_token_hash_column_sql;
EXECUTE add_token_hash_column_stmt;
DEALLOCATE PREPARE add_token_hash_column_stmt;

-- Step 2: If legacy token column exists, backfill from token value.
SET @has_token_column = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'refresh_tokens'
      AND column_name = 'token'
);

SET @backfill_from_token_sql = IF(
    @has_token_column > 0,
    'UPDATE refresh_tokens
     SET token_hash = SHA2(COALESCE(NULLIF(TRIM(token), ''''), CONCAT(''empty_'', id)), 256)
     WHERE token_hash IS NULL OR token_hash = ''''',
    'UPDATE refresh_tokens
     SET token_hash = SHA2(CONCAT(''null_token_'', id), 256)
     WHERE token_hash IS NULL OR token_hash = '''''
);
PREPARE backfill_from_token_stmt FROM @backfill_from_token_sql;
EXECUTE backfill_from_token_stmt;
DEALLOCATE PREPARE backfill_from_token_stmt;

-- Step 3: Guarantee non-null/unique token_hash for all remaining rows.
UPDATE refresh_tokens
SET token_hash = SHA2(CONCAT('fallback_', id), 256)
WHERE token_hash IS NULL OR token_hash = '';

-- Step 4: Enforce NOT NULL.
ALTER TABLE refresh_tokens
MODIFY COLUMN token_hash VARCHAR(128) NOT NULL;

-- Step 5: Add a UNIQUE index on token_hash if no unique index exists yet.
SET @has_any_unique_token_hash_index = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'refresh_tokens'
      AND column_name = 'token_hash'
      AND non_unique = 0
);
SET @create_unique_sql = IF(
    @has_any_unique_token_hash_index = 0,
    'ALTER TABLE refresh_tokens ADD UNIQUE KEY uk_refresh_tokens_token_hash (token_hash)',
    'SELECT 1'
);
PREPARE create_unique_stmt FROM @create_unique_sql;
EXECUTE create_unique_stmt;
DEALLOCATE PREPARE create_unique_stmt;
