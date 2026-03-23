package com.thuetoi.service;

import com.thuetoi.entity.Review;
import com.thuetoi.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    public Review createReview(Review review) {
        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByContract(Long contractId) {
        return reviewRepository.findByContractId(contractId);
    }
}
