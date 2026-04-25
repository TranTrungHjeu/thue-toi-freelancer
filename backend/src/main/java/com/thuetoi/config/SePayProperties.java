package com.thuetoi.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình SePay API v2 (VA orders) và xác thực webhook.
 */
@Data
@ConfigurationProperties(prefix = "sepay")
public class SePayProperties {
    /** "qr" (default, QR-only via VietQR + webhook) or "va" (SePay v2 VA orders). */
    private String mode = "qr";
    private String baseUrl = "https://userapi.sepay.vn";
    private String apiToken = "";
    private String bankAccountXid = "";
    private String vaPrefix = "";
    private String webhookApiKey = "";
    private int orderDurationSeconds = 86_400;
    private int connectTimeoutMs = 10_000;
    private int readTimeoutMs = 30_000;
    /** QR-only: bank account number receiving funds (e.g. "0765917057"). */
    private String accountNumber = "";
    /** QR-only: bank short code (e.g. "VPB", "VCB", "TCB", "MB"). */
    private String bankCode = "";
    /** QR-only: account holder name shown on QR/transfer. */
    private String accountHolderName = "";
    /** QR-only: VietQR image base, override only if needed. */
    private String qrImageBaseUrl = "https://qr.sepay.vn/img";
}
