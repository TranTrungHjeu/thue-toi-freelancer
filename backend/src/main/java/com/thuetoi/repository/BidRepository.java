package com.thuetoi.repository;

import com.thuetoi.entity.Bid;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository Bid: Quản lý truy vấn dữ liệu báo giá
 */
@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    @EntityGraph(attributePaths = {"project", "freelancer.skills"})
    List<Bid> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"project", "freelancer.skills"})
    List<Bid> findByFreelancerId(Long freelancerId);

    long countByFreelancerId(Long freelancerId);

    @EntityGraph(attributePaths = {"project", "freelancer.skills"})
    List<Bid> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    @EntityGraph(attributePaths = {"project", "freelancer.skills"})
    List<Bid> findByFreelancerIdOrderByCreatedAtDesc(Long freelancerId);

    @EntityGraph(attributePaths = {"project", "freelancer.skills"})
    List<Bid> findByProjectUserIdOrderByCreatedAtDesc(Long userId);

    @Override
    @EntityGraph(attributePaths = {"project", "freelancer.skills"})
    Optional<Bid> findById(Long id);
}
