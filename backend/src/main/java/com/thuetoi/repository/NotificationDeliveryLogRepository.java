package com.thuetoi.repository;

import com.thuetoi.entity.NotificationDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationDeliveryLogRepository extends JpaRepository<NotificationDeliveryLog, Long> {
    List<NotificationDeliveryLog> findTop100ByOrderByCreatedAtDesc();
}
