package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * Entity TransactionHistory: Lịch sử thanh toán hợp đồng theo schema.sql và BaseEntity
 */
@Entity
@Table(name = "transaction_history")
@Data
@EqualsAndHashCode(callSuper = false)
public class TransactionHistory extends BaseEntity {

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "method")
    private String method;

    @Column(name = "status", nullable = false)
    private String status;
}
