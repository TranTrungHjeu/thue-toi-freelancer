package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "wallet_ledger_entries")
@Data
@EqualsAndHashCode(callSuper = true)
public class WalletLedgerEntry extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "payment_order_id")
    private Long paymentOrderId;

    @Column(name = "entry_type", nullable = false, length = 32)
    private String entryType;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(length = 512)
    private String description;
}
