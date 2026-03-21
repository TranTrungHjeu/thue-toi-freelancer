package com.thuetoi.controller;

import com.thuetoi.entity.Review;
import com.thuetoi.service.ReviewService;
import com.thuetoi.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public ApiResponse createReview(@RequestBody Review review) {
        Review created = reviewService.createReview(review);
        return ApiResponse.success(created);
    }

    @GetMapping("/contract/{contractId}")
    public ApiResponse getReviewsByContract(@PathVariable Long contractId) {
        List<Review> reviews = reviewService.getReviewsByContract(contractId);
        return ApiResponse.success(reviews);
    }
}
