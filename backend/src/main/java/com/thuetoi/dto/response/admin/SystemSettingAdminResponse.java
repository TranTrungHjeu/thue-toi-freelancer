package com.thuetoi.dto.response.admin;

import java.util.Date;

public record SystemSettingAdminResponse(
    String key,
    String value,
    String description,
    Date updatedAt
) {
}
