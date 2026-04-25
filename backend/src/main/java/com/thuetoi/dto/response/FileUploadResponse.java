package com.thuetoi.dto.response;

public record FileUploadResponse(
    String url,
    String name,
    String contentType,
    Long size,
    String storageProvider
) {
}
