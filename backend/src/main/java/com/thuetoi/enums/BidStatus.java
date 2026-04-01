package com.thuetoi.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Getter
@RequiredArgsConstructor
public enum BidStatus implements StringValuedEnum {
    PENDING("pending"),
    ACCEPTED("accepted"),
    REJECTED("rejected"),
    WITHDRAWN("withdrawn");

    private final String value;

    public static Optional<BidStatus> fromValue(String rawValue) {
        return EnumValueResolver.find(BidStatus.class, rawValue);
    }

    public boolean matches(String rawValue) {
        return value.equals(EnumValueResolver.normalize(rawValue));
    }
}
