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

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
