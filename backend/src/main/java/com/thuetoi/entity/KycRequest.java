package com.thuetoi.entity;

import jakarta.persistence.*;

/**
 * Entity KycRequest: Theo dõi yêu cầu xác thực người dùng
 */
@Entity
@Table(name = "kyc_requests")
public class KycRequest extends BaseEntity {
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(length = 20)
    private String idNumber;

    @Column(length = 100)
    private String fullName;

    @Column(length = 20)
    private String birthday;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getIdNumber() {
        return idNumber;
    }

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getBirthday() {
        return birthday;
    }

    public void setBirthday(String birthday) {
        this.birthday = birthday;
    }
}
