package com.thuetoi.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Getter 

@RequiredArgsConstructor
public enum ContractStatus implements StringValuedEnum {
    IN_PROGRESS("in_progress"),
    COMPLETED("completed"),
    CANCELLED("cancelled");

    private final String value;

    public static Optional<ContractStatus> fromValue(String rawValue) {
        return EnumValueResolver.find(ContractStatus.class, rawValue);
    }

    public boolean matches(String rawValue) {
        return value.equals(EnumValueResolver.normalize(rawValue));
    }
}
