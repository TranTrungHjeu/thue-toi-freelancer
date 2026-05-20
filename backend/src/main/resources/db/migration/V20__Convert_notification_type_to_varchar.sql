-- Convert 'type' column from ENUM to VARCHAR to support arbitrary types
-- Ensure that it can handle existing data safely.
ALTER TABLE `notifications`
MODIFY COLUMN `type` VARCHAR(50) NOT NULL;
