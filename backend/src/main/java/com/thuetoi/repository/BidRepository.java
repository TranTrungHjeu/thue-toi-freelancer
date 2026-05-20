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
    
}
