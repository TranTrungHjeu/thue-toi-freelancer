package com.thuetoi.controller;

import com.thuetoi.dto.request.BidRequest;
import com.thuetoi.dto.request.BidStatusRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Bid;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.BidService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller Bid: API gửi báo giá, xem danh sách, chọn bid
 */
@RestController
@RequestMapping("/api/v1/bids")
public class BidController {
    @Autowired
    private BidService bidService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    /**
     * Lấy tất cả bid mà user hiện tại được phép xem
     */
    @GetMapping
    public ApiResponse<List<Bid>> getAllBids(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getAllBids(currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá có thể truy cập", bids);
    }

    /**
     * Freelancer gửi báo giá
     */
    @PostMapping
    public ApiResponse<Bid> createBid(@Valid @RequestBody BidRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Bid bid = bidService.createBid(
            request.getProjectId(),
            currentUserId,
            request.getPrice(),
            request.getMessage(),
            request.getEstimatedTime(),
            request.getAttachments()
        );
        return ApiResponse.success("Gửi báo giá thành công", bid);
    }

    /**
     * Lấy danh sách bid theo dự án
     */
    @GetMapping("/project/{projectId}")
    public ApiResponse<List<Bid>> getBidsByProject(@PathVariable Long projectId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getBidsByProject(projectId, currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá theo dự án", bids);
    }

    /**
     * Lấy danh sách bid của freelancer hiện tại
     */
    @GetMapping("/my")
    public ApiResponse<List<Bid>> getMyBids(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getBidsByFreelancer(currentUserId, currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá của freelancer hiện tại", bids);
    }

    /**
     * Lấy danh sách bid của freelancer
     */
    @GetMapping("/freelancer/{freelancerId}")
    public ApiResponse<List<Bid>> getBidsByFreelancer(@PathVariable Long freelancerId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getBidsByFreelancer(freelancerId, currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá của freelancer", bids);
    }

    /**
     * Chọn bid (customer accept)
     */
    @PostMapping("/{bidId}/accept")
    public ApiResponse<Bid> acceptBid(@PathVariable Long bidId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Bid bid = bidService.acceptBid(bidId, currentUserId);
        return ApiResponse.success("Chọn báo giá thành công", bid);
    }

    /**
     * Cập nhật trạng thái bid
     */
    @PutMapping("/{bidId}/status")
    public ApiResponse<Bid> updateBidStatus(
        @PathVariable Long bidId,
        @Valid @RequestBody BidStatusRequest request,
        Principal principal
    ) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Bid bid = bidService.updateBidStatus(bidId, currentUserId, request.getStatus());
        return ApiResponse.success("Cập nhật trạng thái báo giá thành công", bid);
    }

    /**
     * Lấy chi tiết bid
     */
    @GetMapping("/{id}")
    public ApiResponse<Bid> getBid(@PathVariable Long id, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Bid bid = bidService.getBid(id, currentUserId)
            .orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá", HttpStatus.NOT_FOUND));
        return ApiResponse.success("Lấy chi tiết báo giá thành công", bid);
    }
}
