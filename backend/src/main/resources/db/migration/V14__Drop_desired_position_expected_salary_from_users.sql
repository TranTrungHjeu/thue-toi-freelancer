-- Remove job preference columns from freelancer profile / CV sync.

ALTER TABLE users
    DROP COLUMN desired_position,
    DROP COLUMN expected_salary;
