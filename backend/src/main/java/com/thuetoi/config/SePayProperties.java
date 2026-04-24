package com.thuetoi.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình SePay API v2 (VA orders) và xác thực webhook.
 */
@Data
@ConfigurationProperties(prefix = "sepay")
public class SePayProperties {
    private String baseUrl = "https://userapi.sepay.vn";
    private String apiToken = "";
    private String bankAccountXid = "";
    private String vaPrefix = "";
    private String webhookApiKey = "";
    private int orderDurationSeconds = 86_400;
    private int connectTimeoutMs = 10_000;
    private int readTimeoutMs = 30_000;
}
