package com.thuetoi.repository;

import com.thuetoi.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndDeletedAtIsNullAndArchivedAtIsNullOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadFalseAndDeletedAtIsNullAndArchivedAtIsNullOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    long countByUserIdAndDeletedAtIsNullAndArchivedAtIsNull(Long userId);

    long countByUserIdAndIsReadFalseAndDeletedAtIsNullAndArchivedAtIsNull(Long userId);

    Optional<Notification> findFirstByUserIdAndTypeAndTitleAndContentAndLinkAndCreatedAtAfterOrderByCreatedAtDesc(
        Long userId,
        String type,
        String title,
        String content,
        String link,
        LocalDateTime createdAt
    );

    Optional<Notification> findFirstByUserIdAndEventKeyAndCreatedAtAfterOrderByCreatedAtDesc(
        Long userId,
        String eventKey,
        LocalDateTime createdAt
    );

    @Query("""
        SELECT n FROM Notification n
        WHERE n.userId = :userId
          AND n.deletedAt IS NULL
          AND (:archived = true OR n.archivedAt IS NULL)
          AND (:archived = false OR n.archivedAt IS NOT NULL)
          AND (:type IS NULL OR n.type = :type)
          AND (:unreadOnly = false OR n.isRead = false)
          AND (
            :query IS NULL
            OR LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(n.content, '')) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        """)
    Page<Notification> searchUserNotifications(
        @Param("userId") Long userId,
        @Param("type") String type,
        @Param("unreadOnly") boolean unreadOnly,
        @Param("archived") boolean archived,
        @Param("query") String query,
        Pageable pageable
    );
}
