package com.thuetoi.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Getter
@RequiredArgsConstructor
public enum MessageType implements StringValuedEnum {
    TEXT("text"),
    FILE("file");

    private final String value;

    public static Optional<MessageType> fromValue(String rawValue) {
        return EnumValueResolver.find(MessageType.class, rawValue);
    }
}
