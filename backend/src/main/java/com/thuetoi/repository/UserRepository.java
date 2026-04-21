package com.thuetoi.repository;

import com.thuetoi.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

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

    boolean existsByEmail(String email);

    long countByRole(String role);

    long countByVerified(boolean verified);
}
