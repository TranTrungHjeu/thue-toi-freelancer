-- V2__Add_audit_columns_to_skills.sql
-- Fix schema drift: Skill extends BaseEntity so skills requires created_at/updated_at.

ALTER TABLE skills
ADD COLUMN created_at DATETIME NULL COMMENT 'Ngày tạo',
ADD COLUMN updated_at DATETIME NULL COMMENT 'Ngày cập nhật';

UPDATE skills
SET
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE
    created_at IS NULL
    OR updated_at IS NULL;

ALTER TABLE skills
MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật';
