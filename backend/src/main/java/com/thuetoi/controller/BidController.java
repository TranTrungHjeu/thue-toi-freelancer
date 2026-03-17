package com.thuetoi.controller;

import com.thuetoi.dto.request.BidRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Bid;
import com.thuetoi.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller Bid: API gửi báo giá, xem danh sách, chọn bid
 */
@RestController
@RequestMapping("/api/bids")
public class BidController {
    @Autowired
    private BidService bidService;

    /**
     * Freelancer gửi báo giá
     */
    @PostMapping
    public ApiResponse<Bid> createBid(@RequestBody BidRequest request) {
        Bid bid = bidService.createBid(request.getProjectId(), request.getFreelancerId(), request.getPrice(), request.getMessage(), request.getEstimatedTime(), request.getAttachments());
        return ApiResponse.success("Gửi báo giá thành công", bid);
    }

    /**
     * Lấy danh sách bid theo dự án
     */
    @GetMapping("/project/{projectId}")
    public ApiResponse<List<Bid>> getBidsByProject(@PathVariable Long projectId) {
        List<Bid> bids = bidService.getBidsByProject(projectId);
        return ApiResponse.success("Lấy danh sách báo giá theo dự án", bids);
    }

    /**
     * Lấy danh sách bid của freelancer
     */
    @GetMapping("/freelancer/{freelancerId}")
    public ApiResponse<List<Bid>> getBidsByFreelancer(@PathVariable Long freelancerId) {
        List<Bid> bids = bidService.getBidsByFreelancer(freelancerId);
        return ApiResponse.success("Lấy danh sách báo giá của freelancer", bids);
    }

    /**
     * Chọn bid (customer accept)
     */
    @PostMapping("/{bidId}/accept")
    public ApiResponse<Bid> acceptBid(@PathVariable Long bidId) {
        Bid bid = bidService.acceptBid(bidId);
        return ApiResponse.success("Chọn báo giá thành công", bid);
    }

    /**
     * Cập nhật trạng thái bid
     */
    @PutMapping("/{bidId}/status")
    public ApiResponse<Bid> updateBidStatus(@PathVariable Long bidId, @RequestBody BidRequest request) {
        Bid bid = bidService.updateBidStatus(bidId, request.getStatus());
        return ApiResponse.success("Cập nhật trạng thái báo giá thành công", bid);
    }

    /**
     * Lấy chi tiết bid
     */
    @GetMapping("/{id}")
    public ApiResponse<Bid> getBid(@PathVariable Long id) {
        return bidService.getBid(id)
                .map(bid -> ApiResponse.success("Lấy chi tiết báo giá thành công", bid))
                .orElseGet(() -> ApiResponse.error("Không tìm thấy báo giá"));
    }
}
