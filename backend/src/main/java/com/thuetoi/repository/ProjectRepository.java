package com.thuetoi.repository;

import com.thuetoi.entity.Project;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository Project: Quản lý truy vấn dữ liệu dự án
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    long countByStatus(String status);

    @EntityGraph(attributePaths = {"skills", "user.skills"})
    List<Project> findByStatus(String status);

    @EntityGraph(attributePaths = {"skills", "user.skills"})
    List<Project> findAllByOrderByCreatedAtDesc();

    List<Project> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"skills", "user.skills"})
    List<Project> findByStatusOrderByCreatedAtDesc(String status);

    @EntityGraph(attributePaths = {"skills", "user.skills"})
    List<Project> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Override
    @EntityGraph(attributePaths = {"skills", "user.skills"})
    Optional<Project> findById(Long id);

    @EntityGraph(attributePaths = {"skills", "user.skills"})
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
