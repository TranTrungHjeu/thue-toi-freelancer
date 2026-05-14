package com.thuetoi.controller;

import com.thuetoi.dto.request.BidRequest;
import com.thuetoi.dto.request.BidStatusRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.PaymentOrderResponse;
import com.thuetoi.dto.response.marketplace.BidResponse;
import com.thuetoi.entity.Bid;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.BidService;
import com.thuetoi.service.PaymentService;
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

    @Autowired
    private MarketplaceResponseMapper marketplaceResponseMapper;

    @Autowired
    private PaymentService paymentService;

    /**
     * Lấy tất cả bid mà user hiện tại được phép xem
     */
    @GetMapping
    public ApiResponse<List<BidResponse>> getAllBids(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getAllBids(currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá có thể truy cập", marketplaceResponseMapper.toBidResponses(bids));
    }

    /**
     * Freelancer gửi báo giá
     */
    @PostMapping
    public ApiResponse<BidResponse> createBid(@Valid @RequestBody BidRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Bid bid = bidService.createBid(
            request.getProjectId(),
            currentUserId,
            request.getPrice(),
            request.getMessage(),
            request.getEstimatedTime(),
            request.getAttachments()
        );
        return ApiResponse.success("Gửi báo giá thành công", marketplaceResponseMapper.toBidResponse(bid));
    }

    /**
     * Lấy danh sách bid theo dự án
     */
    @GetMapping("/project/{projectId}")
    public ApiResponse<List<BidResponse>> getBidsByProject(@PathVariable Long projectId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getBidsByProject(projectId, currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá theo dự án", marketplaceResponseMapper.toBidResponses(bids));
    }

    /**
     * Lấy danh sách bid của freelancer hiện tại
     */
    @GetMapping("/my")
    public ApiResponse<List<BidResponse>> getMyBids(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getBidsByFreelancer(currentUserId, currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá của Freelancer hiện tại", marketplaceResponseMapper.toBidResponses(bids));
    }

    /**
     * Lấy danh sách bid của freelancer
     */
    @GetMapping("/freelancer/{freelancerId}")
    public ApiResponse<List<BidResponse>> getBidsByFreelancer(@PathVariable Long freelancerId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Bid> bids = bidService.getBidsByFreelancer(freelancerId, currentUserId);
        return ApiResponse.success("Lấy danh sách báo giá của Freelancer", marketplaceResponseMapper.toBidResponses(bids));
    }

    /**
     * Tạo đơn thanh toán SePay (VA) cho bid — tương đương chấp nhận bid sau khi trả tiền.
     */
    @PostMapping("/{bidId}/checkout")
    public ApiResponse<PaymentOrderResponse> checkoutBid(@PathVariable Long bidId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        com.thuetoi.entity.PaymentOrder order = paymentService.startCheckoutForBid(bidId, currentUserId);
        return ApiResponse.success("Tạo đơn thanh toán thành công", paymentService.toResponse(order));
    }

    /**
     * @deprecated Dùng {@code POST /{bidId}/checkout}
     */
    @PostMapping("/{bidId}/accept")
    public ApiResponse<PaymentOrderResponse> acceptBid(@PathVariable Long bidId, Principal principal) {
        return checkoutBid(bidId, principal);
    }

    /**
     * Cập nhật trạng thái bid
     */
    @PutMapping("/{bidId}/status")
    public ApiResponse<BidResponse> updateBidStatus(
        @PathVariable Long bidId,
        @Valid @RequestBody BidStatusRequest request,
        Principal principal
    ) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Bid bid = bidService.updateBidStatus(bidId, currentUserId, request.getStatus());
        return ApiResponse.success("Cập nhật trạng thái báo giá thành công", marketplaceResponseMapper.toBidResponse(bid));
    }

    /**
     * Lấy chi tiết bid
     */
    @GetMapping("/{id}")
    public ApiResponse<BidResponse> getBid(@PathVariable Long id, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Bid bid = bidService.getBid(id, currentUserId)
            .orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá", HttpStatus.NOT_FOUND));
        return ApiResponse.success("Lấy chi tiết báo giá thành công", marketplaceResponseMapper.toBidResponse(bid));
    }
}
