-- Add freelancer profile columns used by CV auto-fill.

ALTER TABLE users
    ADD COLUMN phone VARCHAR(50) NULL AFTER profile_description,
    ADD COLUMN location VARCHAR(255) NULL AFTER phone,
    ADD COLUMN experience_years INT NULL AFTER location,
    ADD COLUMN education TEXT NULL AFTER experience_years,
    ADD COLUMN desired_position VARCHAR(255) NULL AFTER education,
    ADD COLUMN expected_salary VARCHAR(255) NULL AFTER desired_position;