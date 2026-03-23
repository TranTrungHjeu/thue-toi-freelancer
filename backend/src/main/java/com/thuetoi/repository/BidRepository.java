package com.thuetoi.repository;

import com.thuetoi.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository Bid: Quản lý truy vấn dữ liệu báo giá
 */
@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByProjectId(Long projectId);
    List<Bid> findByFreelancerId(Long freelancerId);
    List<Bid> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<Bid> findByFreelancerIdOrderByCreatedAtDesc(Long freelancerId);
    List<Bid> findByProjectUserIdOrderByCreatedAtDesc(Long userId);
}
