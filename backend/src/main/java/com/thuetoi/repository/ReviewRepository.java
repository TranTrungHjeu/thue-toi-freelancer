package com.thuetoi.repository;

import com.thuetoi.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByContractId(Long contractId);
}
