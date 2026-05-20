ALTER TABLE kyc_requests ADD COLUMN id_number VARCHAR(20);

ALTER TABLE kyc_requests ADD COLUMN full_name VARCHAR(100);

ALTER TABLE kyc_requests ADD COLUMN birthday VARCHAR(20);
