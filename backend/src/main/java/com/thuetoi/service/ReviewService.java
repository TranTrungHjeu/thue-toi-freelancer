package com.thuetoi.service;

import com.thuetoi.dto.request.ReviewRequest;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Review;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ContractAccessService contractAccessService;

    public Review createReview(Long currentUserId, ReviewRequest request) {
        Contract contract = contractAccessService.requireAccessibleContract(request.getContractId(), currentUserId);
        if (!"completed".equalsIgnoreCase(contract.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể đánh giá hợp đồng đã hoàn thành", HttpStatus.BAD_REQUEST);
        }
        if (reviewRepository.existsByContractIdAndReviewerId(request.getContractId(), currentUserId)) {
            throw new BusinessException("ERR_SYS_02", "Bạn đã đánh giá hợp đồng này rồi", HttpStatus.CONFLICT);
        }

        Review review = new Review();
        review.setContractId(request.getContractId());
        review.setReviewerId(currentUserId);
        review.setRating(request.getRating());
        review.setComment(normalizeText(request.getComment()));
        review.setReply(null);
        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByContract(Long contractId, Long currentUserId) {
        contractAccessService.requireAccessibleContract(contractId, currentUserId);
        return reviewRepository.findByContractIdOrderByCreatedAtDesc(contractId);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
