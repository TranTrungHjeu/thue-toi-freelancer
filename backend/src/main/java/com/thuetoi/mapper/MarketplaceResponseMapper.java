package com.thuetoi.mapper;

import com.thuetoi.dto.response.marketplace.BidResponse;
import com.thuetoi.dto.response.marketplace.ContractResponse;
import com.thuetoi.dto.response.marketplace.MessageResponse;
import com.thuetoi.dto.response.marketplace.MilestoneResponse;
import com.thuetoi.dto.response.marketplace.NotificationResponse;
import com.thuetoi.dto.response.marketplace.ProjectResponse;
import com.thuetoi.dto.response.marketplace.ProjectSummaryResponse;
import com.thuetoi.dto.response.marketplace.ReviewResponse;
import com.thuetoi.dto.response.marketplace.SkillResponse;
import com.thuetoi.dto.response.marketplace.TransactionResponse;
import com.thuetoi.dto.response.marketplace.UserSummaryResponse;
import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Message;
import com.thuetoi.entity.Milestone;
import com.thuetoi.entity.Notification;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.Review;
import com.thuetoi.entity.Skill;
import com.thuetoi.entity.TransactionHistory;
import com.thuetoi.entity.User;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;

@Component
public class MarketplaceResponseMapper {

    public ProjectResponse toProjectResponse(Project project) {
        if (project == null) {
            return null;
        }
        return new ProjectResponse(
            project.getId(),
            toUserSummary(project.getUser()),
            project.getTitle(),
            project.getDescription(),
            project.getBudgetMin(),
            project.getBudgetMax(),
            project.getDeadline(),
            project.getStatus(),
            toSkillNames(project.getSkills()),
            project.getCreatedAt(),
            project.getUpdatedAt()
        );
    }

    public List<ProjectResponse> toProjectResponses(List<Project> projects) {
        return projects.stream().map(this::toProjectResponse).toList();
    }

    public BidResponse toBidResponse(Bid bid) {
        if (bid == null) {
            return null;
        }
        return new BidResponse(
            bid.getId(),
            toProjectSummary(bid.getProject()),
            toUserSummary(bid.getFreelancer()),
            bid.getPrice(),
            bid.getMessage(),
            bid.getEstimatedTime(),
            bid.getAttachments(),
            bid.getStatus(),
            bid.getCreatedAt()
        );
    }

    public List<BidResponse> toBidResponses(List<Bid> bids) {
        return bids.stream().map(this::toBidResponse).toList();
    }

    public ContractResponse toContractResponse(Contract contract) {
        if (contract == null) {
            return null;
        }
        return new ContractResponse(
            contract.getId(),
            contract.getProjectId(),
            contract.getFreelancerId(),
            contract.getClientId(),
            contract.getTotalAmount(),
            contract.getProgress(),
            contract.getStatus(),
            contract.getStartDate(),
            contract.getEndDate()
        );
    }

    public List<ContractResponse> toContractResponses(List<Contract> contracts) {
        return contracts.stream().map(this::toContractResponse).toList();
    }

    public MilestoneResponse toMilestoneResponse(Milestone milestone) {
        if (milestone == null) {
            return null;
        }
        return new MilestoneResponse(
            milestone.getId(),
            milestone.getContractId(),
            milestone.getTitle(),
            milestone.getAmount(),
            milestone.getDueDate(),
            milestone.getStatus()
        );
    }

    public List<MilestoneResponse> toMilestoneResponses(List<Milestone> milestones) {
        return milestones.stream().map(this::toMilestoneResponse).toList();
    }

    public MessageResponse toMessageResponse(Message message) {
        if (message == null) {
            return null;
        }
        return new MessageResponse(
            message.getId(),
            message.getContractId(),
            message.getSenderId(),
            message.getMessageType(),
            message.getContent(),
            message.getAttachments(),
            message.getSentAt()
        );
    }

    public List<MessageResponse> toMessageResponses(List<Message> messages) {
        return messages.stream().map(this::toMessageResponse).toList();
    }

    public ReviewResponse toReviewResponse(Review review) {
        if (review == null) {
            return null;
        }
        return new ReviewResponse(
            review.getId(),
            review.getContractId(),
            review.getReviewerId(),
            review.getRating(),
            review.getComment(),
            review.getReply(),
            review.getCreatedAt(),
            review.getUpdatedAt()
        );
    }

    public List<ReviewResponse> toReviewResponses(List<Review> reviews) {
        return reviews.stream().map(this::toReviewResponse).toList();
    }

    public NotificationResponse toNotificationResponse(Notification notification) {
        if (notification == null) {
            return null;
        }
        return new NotificationResponse(
            notification.getId(),
            notification.getUserId(),
            notification.getType(),
            notification.getTitle(),
            notification.getContent(),
            notification.getLink(),
            notification.getIsRead(),
            notification.getCreatedAt()
        );
    }

    public List<NotificationResponse> toNotificationResponses(List<Notification> notifications) {
        return notifications.stream().map(this::toNotificationResponse).toList();
    }

    public SkillResponse toSkillResponse(Skill skill) {
        if (skill == null) {
            return null;
        }
        return new SkillResponse(skill.getId(), skill.getName(), skill.getDescription());
    }

    public List<SkillResponse> toSkillResponses(List<Skill> skills) {
        return skills.stream().map(this::toSkillResponse).toList();
    }

    public TransactionResponse toTransactionResponse(TransactionHistory transactionHistory) {
        if (transactionHistory == null) {
            return null;
        }
        return new TransactionResponse(
            transactionHistory.getId(),
            transactionHistory.getContractId(),
            transactionHistory.getAmount(),
            transactionHistory.getMethod(),
            transactionHistory.getStatus(),
            transactionHistory.getCreatedAt()
        );
    }

    public List<TransactionResponse> toTransactionResponses(List<TransactionHistory> transactionHistories) {
        return transactionHistories.stream().map(this::toTransactionResponse).toList();
    }

    private UserSummaryResponse toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return new UserSummaryResponse(
            user.getId(),
            user.getFullName(),
            user.getRole(),
            user.getAvatarUrl(),
            toSkillNames(user.getSkills())
        );
    }

    private ProjectSummaryResponse toProjectSummary(Project project) {
        if (project == null) {
            return null;
        }
        return new ProjectSummaryResponse(project.getId(), project.getTitle());
    }

    private List<String> toSkillNames(Collection<Skill> skills) {
        if (skills == null || skills.isEmpty()) {
            return List.of();
        }
        return skills.stream()
            .map(Skill::getName)
            .filter(name -> name != null && !name.isBlank())
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .toList();
    }
}
