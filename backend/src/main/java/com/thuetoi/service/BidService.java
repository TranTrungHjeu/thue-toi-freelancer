package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service Bid: Xử lý logic nghiệp vụ báo giá
 */
@Service
public class BidService {
    @Autowired
    private BidRepository bidRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private UserRepository userRepository;

    /**
     * Freelancer gửi báo giá cho dự án
     */
    public Bid createBid(Long projectId, Long freelancerId, Double price, String message, String estimatedTime, String attachments) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án"));
        User freelancer = userRepository.findById(freelancerId).orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập"));
        Bid bid = new Bid();
        bid.setProject(project);
        bid.setFreelancer(freelancer);
        bid.setPrice(price);
        bid.setMessage(message);
        bid.setEstimatedTime(estimatedTime);
        bid.setAttachments(attachments);
        bid.setStatus("pending");
        return bidRepository.save(bid);
    }

    /**
     * Lấy danh sách bid theo dự án
     */
    public List<Bid> getBidsByProject(Long projectId) {
        return bidRepository.findByProjectId(projectId);
    }

    /**
     * Lấy danh sách bid của freelancer
     */
    public List<Bid> getBidsByFreelancer(Long freelancerId) {
        return bidRepository.findByFreelancerId(freelancerId);
    }

    /**
     * Chọn bid (customer accept)
     */
    public Bid acceptBid(Long bidId) {
        Bid bid = bidRepository.findById(bidId).orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá"));
        bid.setStatus("accepted");
        return bidRepository.save(bid);
    }

    /**
     * Cập nhật trạng thái bid
     */
    public Bid updateBidStatus(Long bidId, String status) {
        Bid bid = bidRepository.findById(bidId).orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá"));
        bid.setStatus(status);
        return bidRepository.save(bid);
    }

    /**
     * Lấy chi tiết bid
     */
    public Optional<Bid> getBid(Long id) {
        return bidRepository.findById(id);
    }
}
