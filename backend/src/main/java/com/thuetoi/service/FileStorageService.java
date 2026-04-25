package com.thuetoi.service;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

import com.thuetoi.dto.response.FileUploadResponse;
import com.thuetoi.util.FileValidationUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.thuetoi.exception.BusinessException;

@Service
public class FileStorageService {

    private final Cloudinary cloudinary;

    public FileStorageService(@Value("${cloudinary.url}") String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            throw new BusinessException("ERR_SYS_01", "Cloudinary credentials are not configured properly", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        this.cloudinary = new Cloudinary(cloudinaryUrl);
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        return storeFileWithMetadata(file, subDirectory).url();
    }

    public FileUploadResponse storeFileWithMetadata(MultipartFile file, String subDirectory) {
        validateFile(file);
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String normalizedContentType = normalizeContentType(file.getContentType());

        try {
            // upload to cloudinary
            java.util.Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "thuetoi/" + subDirectory,
                "public_id", UUID.randomUUID().toString() + "_" + System.currentTimeMillis(),
                "resource_type", "auto"
            ));
            Object secureUrlRaw = uploadResult.get("secure_url");
            if (!(secureUrlRaw instanceof String secureUrl) || secureUrl.isBlank()) {
                throw new BusinessException("ERR_FILE_02", "Cloudinary response is invalid: missing secure_url", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Return HTTPS URL
            return new FileUploadResponse(
                secureUrl,
                originalFileName,
                normalizedContentType,
                file.getSize(),
                "cloudinary"
            );

        } catch (IOException ex) {
            throw new BusinessException("ERR_FILE_02", "Could not store file " + originalFileName + " to Cloudinary. Please try again!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("ERR_FILE_01", "Tệp tải lên không được để trống", HttpStatus.BAD_REQUEST);
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        if (originalFileName.isBlank() || originalFileName.contains("..") || originalFileName.contains("/") || originalFileName.contains("\\")) {
            throw new BusinessException("ERR_FILE_01", "Tên tệp không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > FileValidationUtil.MAX_FILE_SIZE_BYTES) {
            throw new BusinessException("ERR_FILE_01", "Kích thước tệp vượt quá giới hạn 5MB", HttpStatus.BAD_REQUEST);
        }

        if (!FileValidationUtil.isAllowedExtension(originalFileName) || !FileValidationUtil.isAllowedContentType(file.getContentType())) {
            throw new BusinessException("ERR_FILE_01", "Định dạng tệp không được hỗ trợ", HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeContentType(String contentType) {
        return contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
    }
}
