package com.thuetoi.repository;

import com.thuetoi.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {

    boolean existsBySepayTransactionId(String sepayTransactionId);
}
