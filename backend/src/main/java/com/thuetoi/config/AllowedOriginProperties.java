package com.thuetoi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class AllowedOriginProperties {

    private static final String[] DEFAULT_ALLOWED_ORIGINS = {
        "http://localhost:5173",
        "http://localhost:5174"
    };

    private final String[] allowedOrigins;

    public AllowedOriginProperties(
        @Value("${app.web.allowed-origins:http://localhost:5173,http://localhost:5174}")
        String allowedOriginsValue
    ) {
        String[] parsedOrigins = Arrays.stream(allowedOriginsValue.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isBlank())
            .distinct()
            .toArray(String[]::new);
        this.allowedOrigins = parsedOrigins.length == 0 ? DEFAULT_ALLOWED_ORIGINS : parsedOrigins;
    }

    public String[] asArray() {
        return Arrays.copyOf(allowedOrigins, allowedOrigins.length);
    }
}
