package com.thuetoi.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "milestone")
public class Milestone extends BaseEntity {
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
