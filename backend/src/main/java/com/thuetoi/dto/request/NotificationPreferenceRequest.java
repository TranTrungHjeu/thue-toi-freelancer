package com.thuetoi.dto.request;

import lombok.Data;

@Data
public class NotificationPreferenceRequest {
    private Boolean inAppEnabled;
    private Boolean emailEnabled;
    private Boolean browserEnabled;
}
