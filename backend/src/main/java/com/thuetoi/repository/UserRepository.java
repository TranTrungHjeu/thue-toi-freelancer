package com.thuetoi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    List<User> findByRole(String role);

    @org.springframework.data.jpa.repository.Query(value = "SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date ASC", nativeQuery = true)
    List<Object[]> getUserGrowthTrend();
}
