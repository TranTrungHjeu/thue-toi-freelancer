package com.thuetoi.repository;

import com.thuetoi.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository Project: Quản lý truy vấn dữ liệu dự án
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStatus(String status);
    List<Project> findByUserId(Long userId);
    List<Project> findByStatusOrderByCreatedAtDesc(String status);
    List<Project> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Tìm project theo skills (many-to-many) */
    List<Project> findDistinctBySkillsNameIn(List<String> skillNames);
}
