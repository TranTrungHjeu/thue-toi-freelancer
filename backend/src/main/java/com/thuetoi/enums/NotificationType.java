package com.thuetoi.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Getter
@RequiredArgsConstructor
public enum NotificationType implements StringValuedEnum {
    PROJECT("project"),
    BID("bid"),
    CONTRACT("contract"),
    SYSTEM("system");

    private final String value;

    public static Optional<NotificationType> fromValue(String rawValue) {
        return EnumValueResolver.find(NotificationType.class, rawValue);
    }
}
