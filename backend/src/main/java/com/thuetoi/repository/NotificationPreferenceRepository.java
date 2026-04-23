package com.thuetoi.repository;

import com.thuetoi.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    List<NotificationPreference> findByUserIdOrderByTypeAsc(Long userId);

    Optional<NotificationPreference> findByUserIdAndType(Long userId, String type);
}
