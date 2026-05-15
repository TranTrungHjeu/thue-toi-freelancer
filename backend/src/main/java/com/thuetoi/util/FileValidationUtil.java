package com.thuetoi.util;

import java.util.Locale;
import java.util.Set;

public final class FileValidationUtil {
    /** Per-file cap for Cloudinary-backed uploads (avatar, project files, etc.). */
    public static final long MAX_FILE_SIZE_BYTES = 15L * 1024L * 1024L;
    public static final int MAX_ATTACHMENTS = 5;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "jpg",
        "jpeg",
        "png",
        "webp",
        "pdf",
        "docx",
        "xlsx",
        "pptx",
        "txt"
    );

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain"
    );

    private FileValidationUtil() {
    }

    public static boolean isAllowedExtension(String fileName) {
        String extension = getExtension(fileName);
        return extension != null && ALLOWED_EXTENSIONS.contains(extension);
    }

    public static boolean isAllowedContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return false;
        }
        return ALLOWED_CONTENT_TYPES.contains(contentType.trim().toLowerCase(Locale.ROOT));
    }

    public static String getExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return null;
        }
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }
}
