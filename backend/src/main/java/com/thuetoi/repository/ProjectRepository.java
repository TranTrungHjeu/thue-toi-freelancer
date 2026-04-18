package com.thuetoi.repository;

import com.thuetoi.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
        select distinct p
        from Project p
        join p.skills s
        where lower(s.name) in :skillNames
          and (:status is null or p.status = :status)
        order by p.createdAt desc
        """)
    List<Project> searchDistinctBySkillNamesAndOptionalStatus(
        @Param("skillNames") List<String> skillNames,
        @Param("status") String status
    );
}
