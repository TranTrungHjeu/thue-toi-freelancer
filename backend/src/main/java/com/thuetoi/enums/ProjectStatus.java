package com.thuetoi.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Getter
@RequiredArgsConstructor
public enum ProjectStatus implements StringValuedEnum {
    OPEN("open"),
    PENDING_PAYMENT("pending_payment"),
    IN_PROGRESS("in_progress"),
    COMPLETED("completed"),
    CANCELLED("cancelled");

    private final String value;

    public static Optional<ProjectStatus> fromValue(String rawValue) {
        return EnumValueResolver.find(ProjectStatus.class, rawValue);
    }

    public boolean matches(String rawValue) {
        return value.equals(EnumValueResolver.normalize(rawValue));
    }
}
