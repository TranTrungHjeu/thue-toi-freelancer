package com.thuetoi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.thuetoi.entity.User;

import jakarta.persistence.LockModeType;

/**
 * Repository User: Quản lý truy vấn dữ liệu người dùng
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = "skills")
    User findByEmail(String email);

    @Override
    @EntityGraph(attributePaths = "skills")
    Optional<User> findById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

    boolean existsByEmail(String email);

    long countByRole(String role);

    long countByVerified(boolean verified);

    long countByIsActiveTrue();

    long countByIsActiveFalse();

    long countByVerifiedTrue();

    List<User> findByRole(String role);

    @Query(
        value = """
            select distinct u
            from User u
            left join u.skills s
            where (:query is null
                or lower(u.fullName) like lower(concat('%', :query, '%'))
                or lower(u.email) like lower(concat('%', :query, '%'))
                or lower(u.role) like lower(concat('%', :query, '%'))
                or lower(s.name) like lower(concat('%', :query, '%')))
              and (:role is null or u.role = :role)
              and (:active is null or u.isActive = :active)
              and (:verified is null or u.verified = :verified)
            """,
        countQuery = """
            select count(distinct u)
            from User u
            left join u.skills s
            where (:query is null
                or lower(u.fullName) like lower(concat('%', :query, '%'))
                or lower(u.email) like lower(concat('%', :query, '%'))
                or lower(u.role) like lower(concat('%', :query, '%'))
                or lower(s.name) like lower(concat('%', :query, '%')))
              and (:role is null or u.role = :role)
              and (:active is null or u.isActive = :active)
              and (:verified is null or u.verified = :verified)
            """
    )
    Page<User> searchAdminUsers(
        @Param("query") String query,
        @Param("role") String role,
        @Param("active") Boolean active,
        @Param("verified") Boolean verified,
        Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query(value = "SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date ASC", nativeQuery = true)
    List<Object[]> getUserGrowthTrend();
}
