package com.thuetoi.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

public enum NotificationType implements StringValuedEnum {
    PROJECT("project"),
    BID("bid"),
    CONTRACT("contract"),
    SYSTEM("system"),
    CALL("call");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    @Override
    public String getValue() {
        return value;
    }

    public static Optional<NotificationType> fromValue(String rawValue) {
        return EnumValueResolver.find(NotificationType.class, rawValue);
    }
}
