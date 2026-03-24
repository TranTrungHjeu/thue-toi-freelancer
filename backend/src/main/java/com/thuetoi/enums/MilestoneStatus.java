package com.thuetoi.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Getter
@RequiredArgsConstructor
public enum MilestoneStatus implements StringValuedEnum {
    PENDING("pending"),
    COMPLETED("completed"),
    CANCELLED("cancelled");

    private final String value;

    public static Optional<MilestoneStatus> fromValue(String rawValue) {
        return EnumValueResolver.find(MilestoneStatus.class, rawValue);
    }

    public boolean matches(String rawValue) {
        return value.equals(EnumValueResolver.normalize(rawValue));
    }
}
