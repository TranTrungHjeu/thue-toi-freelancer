package com.thuetoi.repository;

import com.thuetoi.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByContractIdOrderBySentAtAsc(Long contractId);

    List<Message> findByContractIdIsNullAndSenderIdOrderBySentAtAsc(Long senderId);

    List<Message> findByContractIdIsNullAndRecipientIdOrderBySentAtAsc(Long recipientId);

    /**
     * Tìm tất cả tin nhắn chat giữa User và Admin (contract_id is null)
     */
    @org.springframework.data.jpa.repository.Query("SELECT m FROM Message m WHERE m.contractId IS NULL AND " +
            "((m.senderId = :userId1 AND m.recipientId = :userId2) OR " +
            "(m.senderId = :userId2 AND m.recipientId = :userId1)) " +
            "ORDER BY m.sentAt ASC")
    List<Message> findSupportMessagesBetween(Long userId1, Long userId2);
}
