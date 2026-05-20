package com.thuetoi.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình SePay API v2 (VA orders) và xác thực webhook.
 */
@ConfigurationProperties(prefix = "sepay")
public class SePayProperties {
    private String baseUrl = "https://userapi.sepay.vn";
    private String apiToken = "";
    private String bankAccountXid = "";
    private String vaPrefix = "";
    private String webhookApiKey = "";
    private String vietqrBankId = "";
    private int orderDurationSeconds = 86_400;
    private int connectTimeoutMs = 10_000;
    private int readTimeoutMs = 30_000;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }

    public String getBankAccountXid() {
        return bankAccountXid;
    }

    public void setBankAccountXid(String bankAccountXid) {
        this.bankAccountXid = bankAccountXid;
    }

    public String getVaPrefix() {
        return vaPrefix;
    }

    public void setVaPrefix(String vaPrefix) {
        this.vaPrefix = vaPrefix;
    }

    public String getWebhookApiKey() {
        return webhookApiKey;
    }

    public void setWebhookApiKey(String webhookApiKey) {
        this.webhookApiKey = webhookApiKey;
    }

    public String getVietqrBankId() {
        return vietqrBankId;
    }

    public void setVietqrBankId(String vietqrBankId) {
        this.vietqrBankId = vietqrBankId;
    }

    public int getOrderDurationSeconds() {
        return orderDurationSeconds;
    }

    public void setOrderDurationSeconds(int orderDurationSeconds) {
        this.orderDurationSeconds = orderDurationSeconds;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }
}
