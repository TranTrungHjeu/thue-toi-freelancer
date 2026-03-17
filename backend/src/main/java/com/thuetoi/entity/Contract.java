package com.thuetoi.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "contract")
public class Contract extends BaseEntity {
    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "freelancer_id", nullable = false)
    private Long freelancerId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "total_amount")
    private Double totalAmount;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    private List<Milestone> milestones;

    // ...getter, setter...
}
