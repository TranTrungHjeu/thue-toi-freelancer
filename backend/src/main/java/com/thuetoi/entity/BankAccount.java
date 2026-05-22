package com.thuetoi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Tài khoản ngân hàng đã lưu của user. Dùng để chọn nhanh khi tạo yêu cầu rút tiền,
 * giúp tránh phải nhập lại số tài khoản / QR mỗi lần. User vẫn có thể nhập thủ công
 * khi tạo withdrawal request mà không cần tạo bank account.
 */
@Entity
@Table(name = "bank_accounts")
@Data
@EqualsAndHashCode(callSuper = true)
public class BankAccount extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "bank_name", nullable = false, length = 120)
    private String bankName;

    @Column(name = "bank_code", length = 32)
    private String bankCode;

    @Column(name = "account_number", nullable = false, length = 64)
    private String accountNumber;

    @Column(name = "account_holder", nullable = false, length = 200)
    private String accountHolder;

    @Column(name = "qr_image_url", length = 512)
    private String qrImageUrl;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;
}
