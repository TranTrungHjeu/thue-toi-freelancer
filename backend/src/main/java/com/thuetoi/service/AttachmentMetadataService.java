package com.thuetoi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thuetoi.dto.request.FileAttachmentRequest;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.util.FileValidationUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@Service
public class AttachmentMetadataService {
    private static final TypeReference<List<FileAttachmentRequest>> ATTACHMENT_LIST_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public AttachmentMetadataService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String serialize(List<FileAttachmentRequest> attachments) {
        List<FileAttachmentRequest> normalizedAttachments = normalizeAttachments(attachments);
        if (normalizedAttachments.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(normalizedAttachments);
        } catch (JsonProcessingException ex) {
            throw new BusinessException("ERR_FILE_01", "Không thể xử lý metadata tệp đính kèm", HttpStatus.BAD_REQUEST, ex);
        }
    }

    public List<FileAttachmentRequest> deserialize(String rawAttachments) {
        if (rawAttachments == null || rawAttachments.isBlank()) {
            return List.of();
        }

        String trimmed = rawAttachments.trim();
        if (!trimmed.startsWith("[")) {
            return List.of(legacyUrlAttachment(trimmed));
        }

        try {
            return normalizeAttachments(objectMapper.readValue(trimmed, ATTACHMENT_LIST_TYPE));
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    public List<FileAttachmentRequest> normalizeAttachments(List<FileAttachmentRequest> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        if (attachments.size() > FileValidationUtil.MAX_ATTACHMENTS) {
            throw new BusinessException("ERR_FILE_01", "Chỉ được đính kèm tối đa 5 tệp", HttpStatus.BAD_REQUEST);
        }
        return attachments.stream().map(this::normalizeAttachment).toList();
    }

    private FileAttachmentRequest normalizeAttachment(FileAttachmentRequest attachment) {
        if (attachment == null) {
            throw new BusinessException("ERR_FILE_01", "Metadata tệp không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        String url = normalizeRequiredText(attachment.getUrl(), "Đường dẫn tệp không được để trống");
        String name = normalizeRequiredText(attachment.getName(), "Tên tệp không được để trống");
        String contentType = normalizeRequiredText(attachment.getContentType(), "Loại tệp không được để trống").toLowerCase();
        Long size = attachment.getSize();

        if (name.contains("..") || name.contains("/") || name.contains("\\")) {
            throw new BusinessException("ERR_FILE_01", "Tên tệp không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        if (!isHttpsUrl(url)) {
            throw new BusinessException("ERR_FILE_01", "Đường dẫn tệp phải là HTTPS", HttpStatus.BAD_REQUEST);
        }
        if (!FileValidationUtil.isAllowedExtension(name) || !FileValidationUtil.isAllowedContentType(contentType)) {
            throw new BusinessException("ERR_FILE_01", "Định dạng tệp không được hỗ trợ", HttpStatus.BAD_REQUEST);
        }
        if (size == null || size < 0 || size > FileValidationUtil.MAX_FILE_SIZE_BYTES) {
            throw new BusinessException("ERR_FILE_01", "Kích thước tệp không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        FileAttachmentRequest normalized = new FileAttachmentRequest();
        normalized.setUrl(url);
        normalized.setName(name);
        normalized.setContentType(contentType);
        normalized.setSize(size);
        return normalized;
    }

    private FileAttachmentRequest legacyUrlAttachment(String url) {
        FileAttachmentRequest attachment = new FileAttachmentRequest();
        attachment.setUrl(url);
        attachment.setName(resolveLegacyName(url));
        attachment.setContentType("text/plain");
        attachment.setSize(0L);
        return attachment;
    }

    private String resolveLegacyName(String url) {
        int slashIndex = url.lastIndexOf('/');
        if (slashIndex >= 0 && slashIndex < url.length() - 1) {
            return url.substring(slashIndex + 1);
        }
        return "attachment.txt";
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BusinessException("ERR_FILE_01", message, HttpStatus.BAD_REQUEST);
        }
        return value.trim();
    }

    private boolean isHttpsUrl(String value) {
        try {
            URI uri = new URI(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
        } catch (URISyntaxException ex) {
            return false;
        }
    }
}
