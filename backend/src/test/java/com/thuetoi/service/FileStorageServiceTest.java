package com.thuetoi.service;

import com.thuetoi.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceTest {

    private final FileStorageService fileStorageService = new FileStorageService("cloudinary://key:secret@demo");

    @Test
    void storeFileRejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile("files", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> fileStorageService.storeFileWithMetadata(file, "messages"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> org.assertj.core.api.Assertions.assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_FILE_01"));
    }

    @Test
    void storeFileRejectsPathTraversalFileName() {
        MockMultipartFile file = new MockMultipartFile("files", "../evil.pdf", "application/pdf", "payload".getBytes());

        assertThatThrownBy(() -> fileStorageService.storeFileWithMetadata(file, "messages"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> org.assertj.core.api.Assertions.assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_FILE_01"));
    }

    @Test
    void storeFileRejectsUnsupportedMimeType() {
        MockMultipartFile file = new MockMultipartFile("files", "script.sh", "text/x-shellscript", "payload".getBytes());

        assertThatThrownBy(() -> fileStorageService.storeFileWithMetadata(file, "messages"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> org.assertj.core.api.Assertions.assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_FILE_01"));
    }

    @Test
    void storeFileRejectsOversizedFileBeforeCloudinaryUpload() {
        byte[] bytes = new byte[(int) (com.thuetoi.util.FileValidationUtil.MAX_FILE_SIZE_BYTES + 1)];
        MockMultipartFile file = new MockMultipartFile("files", "large.pdf", "application/pdf", bytes);

        assertThatThrownBy(() -> fileStorageService.storeFileWithMetadata(file, "messages"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> org.assertj.core.api.Assertions.assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_FILE_01"));
    }
}
