ALTER TABLE withdrawal_requests MODIFY COLUMN bank_info VARCHAR(1000) NULL COMMENT 'Cho phép null vì đã chuyển sang dùng các trường bank_name, bank_code, account_number...';
