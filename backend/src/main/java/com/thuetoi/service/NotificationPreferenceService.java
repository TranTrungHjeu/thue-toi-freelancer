package com.thuetoi.service;

import com.thuetoi.dto.request.NotificationPreferenceRequest;
import com.thuetoi.dto.response.marketplace.NotificationPreferenceResponse;
import com.thuetoi.entity.NotificationPreference;
import com.thuetoi.enums.NotificationType;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.NotificationPreferenceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository notificationPreferenceRepository;

    public NotificationPreferenceService(NotificationPreferenceRepository notificationPreferenceRepository) {
        this.notificationPreferenceRepository = notificationPreferenceRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationPreferenceResponse> getPreferences(Long userId) {
        Map<String, NotificationPreference> existingPreferences = notificationPreferenceRepository
            .findByUserIdOrderByTypeAsc(userId)
            .stream()
            .collect(Collectors.toMap(NotificationPreference::getType, preference -> preference));

        return Arrays.stream(NotificationType.values())
            .map(type -> toResponse(existingPreferences.get(type.getValue()), type.getValue()))
            .toList();
    }

    @Transactional
    public NotificationPreferenceResponse updatePreference(Long userId, String type, NotificationPreferenceRequest request) {
        String normalizedType = normalizeType(type);
        NotificationPreference preference = notificationPreferenceRepository.findByUserIdAndType(userId, normalizedType)
            .orElseGet(() -> defaultPreference(userId, normalizedType));

        if (request.getInAppEnabled() != null) {
            preference.setInAppEnabled(request.getInAppEnabled());
        }
        if (request.getEmailEnabled() != null) {
            preference.setEmailEnabled(request.getEmailEnabled());
        }
        if (request.getBrowserEnabled() != null) {
            preference.setBrowserEnabled(request.getBrowserEnabled());
        }

        return toResponse(notificationPreferenceRepository.save(preference), normalizedType);
    }

    @Transactional(readOnly = true)
    public boolean isInAppEnabled(Long userId, String type) {
        return notificationPreferenceRepository.findByUserIdAndType(userId, normalizeType(type))
            .map(NotificationPreference::getInAppEnabled)
            .orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean isEmailEnabled(Long userId, String type) {
        return notificationPreferenceRepository.findByUserIdAndType(userId, normalizeType(type))
            .map(NotificationPreference::getEmailEnabled)
            .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isBrowserEnabled(Long userId, String type) {
        return notificationPreferenceRepository.findByUserIdAndType(userId, normalizeType(type))
            .map(NotificationPreference::getBrowserEnabled)
            .orElse(false);
    }

    private NotificationPreference defaultPreference(Long userId, String type) {
        NotificationPreference preference = new NotificationPreference();
        preference.setUserId(userId);
        preference.setType(type);
        preference.setInAppEnabled(true);
        preference.setEmailEnabled(false);
        preference.setBrowserEnabled(false);
        return preference;
    }

    private NotificationPreferenceResponse toResponse(NotificationPreference preference, String type) {
        if (preference == null) {
            return new NotificationPreferenceResponse(type, true, false, false);
        }
        return new NotificationPreferenceResponse(
            type,
            Boolean.TRUE.equals(preference.getInAppEnabled()),
            Boolean.TRUE.equals(preference.getEmailEnabled()),
            Boolean.TRUE.equals(preference.getBrowserEnabled())
        );
    }

    private String normalizeType(String type) {
        return NotificationType.fromValue(type)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Loại thông báo không hợp lệ", HttpStatus.BAD_REQUEST))
            .getValue();
    }
}
