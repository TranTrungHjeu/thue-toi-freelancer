package com.thuetoi.repository;

import com.thuetoi.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findAllByOrderByCreatedAtDesc();
    List<Report> findByStatusOrderByCreatedAtDesc(String status);
}
