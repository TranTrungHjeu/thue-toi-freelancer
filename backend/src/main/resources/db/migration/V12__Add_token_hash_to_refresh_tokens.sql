-- Add token_hash column to refresh_tokens table to match RefreshToken entity

-- Step 1: Add column as nullable first
ALTER TABLE refresh_tokens
ADD COLUMN token_hash VARCHAR(128)
AFTER token;

-- Step 2: Populate token_hash with SHA2 hash of token column for existing rows
UPDATE refresh_tokens SET token_hash = SHA2(COALESCE(token, CONCAT('empty_', id)), 256) WHERE token_hash IS NULL;

-- Step 3: For rows with NULL token, generate a unique hash from id
UPDATE refresh_tokens SET token_hash = SHA2(CONCAT('null_token_', id), 256) WHERE token_hash IS NULL OR token_hash = '';

-- Step 4: Add NOT NULL and UNIQUE constraints
ALTER TABLE refresh_tokens
MODIFY COLUMN token_hash VARCHAR(128) NOT NULL,
ADD UNIQUE KEY uk_refresh_tokens_token_hash (token_hash);

-- Step 5: Create index on token_hash for better query performance
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
