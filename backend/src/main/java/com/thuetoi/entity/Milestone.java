package com.thuetoi.entity;

import lombok.Data;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "milestone")
@Data
public class Milestone extends BaseEntity {
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "contract_id", insertable = false, updatable = false)
        private Contract contract;
    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "status", nullable = false)
    private String status;

    // ...getter, setter...
}
