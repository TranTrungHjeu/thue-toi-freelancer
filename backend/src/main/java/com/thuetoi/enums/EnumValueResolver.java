package com.thuetoi.enums;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public final class EnumValueResolver {

    private EnumValueResolver() {
    }

    public static String normalize(String rawValue) {
        return rawValue == null ? "" : rawValue.trim().toLowerCase(Locale.ROOT);
    }

    public static <E extends Enum<E> & StringValuedEnum> Optional<E> find(Class<E> enumType, String rawValue) {
        String normalizedValue = normalize(rawValue);
        return Arrays.stream(enumType.getEnumConstants())
            .filter(candidate -> candidate.getValue().equals(normalizedValue))
            .findFirst();
    }
}
