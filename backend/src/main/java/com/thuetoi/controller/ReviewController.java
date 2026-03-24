package com.thuetoi.controller;

import com.thuetoi.dto.request.ReviewRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.marketplace.ReviewResponse;
import com.thuetoi.entity.Review;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private MarketplaceResponseMapper marketplaceResponseMapper;

    @PostMapping
    public ApiResponse<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Review created = reviewService.createReview(currentUserId, request);
        return ApiResponse.success("Tạo đánh giá thành công", marketplaceResponseMapper.toReviewResponse(created));
    }

    @GetMapping("/contract/{contractId}")
    public ApiResponse<List<ReviewResponse>> getReviewsByContract(@PathVariable Long contractId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Review> reviews = reviewService.getReviewsByContract(contractId, currentUserId);
        return ApiResponse.success("Lấy danh sách đánh giá thành công", marketplaceResponseMapper.toReviewResponses(reviews));
    }
}
