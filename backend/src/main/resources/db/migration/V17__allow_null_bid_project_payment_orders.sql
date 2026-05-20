-- Modify payment_orders to allow null bid_id and project_id for wallet deposits
ALTER TABLE payment_orders MODIFY COLUMN bid_id BIGINT NULL;

ALTER TABLE payment_orders MODIFY COLUMN project_id BIGINT NULL;
