package com.thuetoi.service;

import com.thuetoi.dto.request.ReviewRequest;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Review;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ContractAccessService contractAccessService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void createReviewSavesReviewerFromCurrentUserAndTrimsComment() {
        ReviewRequest request = new ReviewRequest();
        request.setContractId(7L);
        request.setRating(5);
        request.setComment("  Lam viec rat tot  ");

        when(contractAccessService.requireAccessibleContract(7L, 11L)).thenReturn(contract(7L, "completed"));
        when(reviewRepository.existsByContractIdAndReviewerId(7L, 11L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Review review = reviewService.createReview(11L, request);

        assertThat(review.getContractId()).isEqualTo(7L);
        assertThat(review.getReviewerId()).isEqualTo(11L);
        assertThat(review.getRating()).isEqualTo(5);
        assertThat(review.getComment()).isEqualTo("Lam viec rat tot");
        assertThat(review.getReply()).isNull();
        verify(notificationService).createNotificationForUser(
            1L,
            "contract",
            "Đánh giá mới sau hợp đồng",
            "Đối tác đã gửi đánh giá cho contract #7.",
            "/workspace/contracts"
        );
    }

    @Test
    void createReviewRejectsDuplicateReviewFromSameUser() {
        ReviewRequest request = new ReviewRequest();
        request.setContractId(7L);
        request.setRating(4);

        when(contractAccessService.requireAccessibleContract(7L, 11L)).thenReturn(contract(7L, "completed"));
        when(reviewRepository.existsByContractIdAndReviewerId(7L, 11L)).thenReturn(true);

        assertThatThrownBy(() -> reviewService.createReview(11L, request))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            });

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void createReviewRejectsIncompleteContract() {
        ReviewRequest request = new ReviewRequest();
        request.setContractId(7L);
        request.setRating(4);

        when(contractAccessService.requireAccessibleContract(7L, 11L)).thenReturn(contract(7L, "in_progress"));

        assertThatThrownBy(() -> reviewService.createReview(11L, request))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(reviewRepository, never()).save(any(Review.class));
    }

    private Contract contract(Long id, String status) {
        Contract contract = new Contract();
        contract.setId(id);
        contract.setStatus(status);
        contract.setClientId(1L);
        contract.setFreelancerId(11L);
        return contract;
    }
}
