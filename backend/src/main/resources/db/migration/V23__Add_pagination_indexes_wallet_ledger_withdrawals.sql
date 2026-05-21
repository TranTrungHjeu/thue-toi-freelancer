-- V23__Add_pagination_indexes_wallet_ledger_withdrawals.sql
-- Index composite cho các truy vấn phân trang theo user + sắp xếp giảm dần theo created_at.
-- Theo skill api-pagination: "Index sorting fields" — đảm bảo MySQL có thể dùng B-tree đã
-- sắp sẵn cho ORDER BY created_at DESC, tránh filesort khi list dài.
--
-- Lưu ý: MySQL 8 hỗ trợ DESC index thực sự. Với MySQL 5.7 thì cú pháp DESC vẫn parse
-- nhưng được coi như ASC; vẫn nhanh hơn nhiều so với chỉ index trên (user_id) vì
-- range scan + reverse scan vẫn dùng được index này.

-- 1) wallet_ledger_entries: list lịch sử giao dịch của user, sắp xếp giảm dần.
--    Trước đây chỉ có idx_wle_user(user_id) → bị filesort cho mệnh đề ORDER BY.
CREATE INDEX idx_wle_user_created
    ON wallet_ledger_entries (user_id, created_at DESC);

-- 2) withdrawal_requests: list yêu cầu rút tiền của user, sắp xếp giảm dần.
--    Đã có idx_withdrawal_user_status(user_id, status) và
--    idx_withdrawal_status_created(status, created_at) nhưng không có composite
--    (user_id, created_at) cho query "find by userId order by createdAt desc".
CREATE INDEX idx_withdrawal_user_created
    ON withdrawal_requests (user_id, created_at DESC);
