-- File import dữ liệu mẫu cho database, phục vụ test nghiệp vụ
-- Thêm user (freelancer, customer, admin)
INSERT INTO users (
        email,
        password_hash,
        full_name,
        role,
        avatar_url,
        profile_description,
        is_active,
        created_at,
        updated_at
    )
VALUES (
        'freelancer1@gmail.com',
        'hash1',
        'Nguyễn Freelancer',
        'freelancer',
        'avatar1.jpg',
        'Chuyên thiết kế logo',
        TRUE,
        '2026-03-01',
        '2026-03-01'
    ),
    (
        'customer1@gmail.com',
        'hash2',
        'Trần Khách Hàng',
        'customer',
        'avatar2.jpg',
        'Cần thuê dịch vụ marketing',
        TRUE,
        '2026-03-02',
        '2026-03-02'
    ),
    (
        'admin@gmail.com',
        'hash3',
        'Admin Hệ Thống',
        'admin',
        NULL,
        'Quản trị hệ thống',
        TRUE,
        '2026-03-03',
        '2026-03-03'
    );
-- Thêm kỹ năng
INSERT INTO skills (name, description)
VALUES (
        'Thiết kế logo',
        'Thiết kế nhận diện thương hiệu'
    ),
    ('Marketing', 'Quảng bá sản phẩm, dịch vụ'),
    (
        'Lập trình web',
        'Xây dựng website chuyên nghiệp'
    );
-- Liên kết user với kỹ năng
INSERT INTO users_skills (user_id, skill_id)
VALUES (1, 1),
    -- freelancer1 có kỹ năng thiết kế logo
    (1, 3);
-- freelancer1 có kỹ năng lập trình web
-- Thêm dự án
INSERT INTO projects (
        user_id,
        title,
        description,
        budget_min,
        budget_max,
        deadline,
        status,
        created_at,
        updated_at
    )
VALUES (
        2,
        'Thiết kế logo công ty ABC',
        'Cần freelancer thiết kế logo chuyên nghiệp cho công ty ABC',
        500,
        1000,
        '2026-04-01',
        'open',
        '2026-03-05',
        '2026-03-05'
    ),
    (
        2,
        'Xây dựng website bán hàng',
        'Dự án website bán hàng, cần freelancer có kinh nghiệm',
        2000,
        3000,
        '2026-05-01',
        'open',
        '2026-03-06',
        '2026-03-06'
    );
-- Liên kết dự án với kỹ năng
INSERT INTO projects_skills (project_id, skill_id)
VALUES (1, 1),
    -- Dự án 1 cần kỹ năng thiết kế logo
    (2, 3);
-- Dự án 2 cần kỹ năng lập trình web
-- Thêm báo giá (bid)
INSERT INTO bids (
        project_id,
        freelancer_id,
        price,
        message,
        estimated_time,
        attachments,
        status,
        created_at
    )
VALUES (
        1,
        1,
        800,
        'Tôi sẽ thiết kế logo trong 7 ngày, đảm bảo chất lượng.',
        '7 ngày',
        NULL,
        'pending',
        '2026-03-07'
    ),
    (
        2,
        1,
        2500,
        'Tôi có kinh nghiệm xây dựng website, hoàn thành trong 20 ngày.',
        '20 ngày',
        NULL,
        'pending',
        '2026-03-08'
    );
-- Thêm hợp đồng (contract)
INSERT INTO contracts (
        project_id,
        freelancer_id,
        customer_id,
        agreed_price,
        progress,
        status,
        start_date,
        end_date
    )
VALUES (
        1,
        1,
        2,
        800,
        0,
        'in_progress',
        '2026-03-10',
        NULL
    ),
    (
        2,
        1,
        2,
        2500,
        0,
        'in_progress',
        '2026-03-11',
        NULL
    );
-- Thêm milestone
INSERT INTO milestones (contract_id, title, amount, due_date, status)
VALUES (
        1,
        'Thiết kế bản nháp logo',
        400,
        '2026-03-15',
        'pending'
    ),
    (
        1,
        'Hoàn thiện logo',
        400,
        '2026-03-25',
        'pending'
    ),
    (
        2,
        'Giao diện website',
        1000,
        '2026-03-20',
        'pending'
    ),
    (
        2,
        'Tính năng bán hàng',
        1500,
        '2026-04-10',
        'pending'
    );
-- Thêm đánh giá (review)
INSERT INTO reviews (
        contract_id,
        reviewer_id,
        rating,
        comment,
        reply,
        created_at,
        updated_at
    )
VALUES (
        1,
        2,
        5,
        'Logo đẹp, đúng yêu cầu!',
        'Cảm ơn bạn đã tin tưởng!',
        '2026-03-30',
        '2026-03-30'
    );
-- Thêm tin nhắn (message)
INSERT INTO messages (
        contract_id,
        sender_id,
        message_type,
        content,
        attachments,
        sent_at
    )
VALUES (
        1,
        2,
        'text',
        'Bạn có thể gửi bản nháp logo không?',
        NULL,
        '2026-03-12'
    ),
    (
        1,
        1,
        'file',
        'Đây là bản nháp logo.',
        'logo_draft.pdf',
        '2026-03-13'
    );
-- Thêm lịch sử giao dịch (transaction_history)
INSERT INTO transaction_history (contract_id, amount, method, status, created_at)
VALUES (
        1,
        400,
        'bank_transfer',
        'completed',
        '2026-03-15'
    ),
    (1, 400, 'bank_transfer', 'pending', '2026-03-25'),
    (2, 1000, 'paypal', 'completed', '2026-03-20');
-- Thêm thông báo (notification)
INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        link,
        is_read,
        created_at
    )
VALUES (
        1,
        'contract',
        'Bạn có hợp đồng mới',
        'Khách hàng đã chọn bạn cho dự án thiết kế logo.',
        NULL,
        FALSE,
        '2026-03-10'
    ),
    (
        2,
        'system',
        'Bạn vừa nhận đánh giá',
        'Freelancer đã hoàn thành hợp đồng, bạn có thể đánh giá.',
        NULL,
        FALSE,
        '2026-03-30'
    );
