package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.FileUploadResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.FileAccessService;
import com.thuetoi.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.security.Principal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {
    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private FileAccessService fileAccessService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private final Principal principal = () -> "7";

    @Test
    void uploadFilesReturnsMetadataForAuthorizedContext() {
        FileController controller = new FileController(fileStorageService, fileAccessService, currentUserProvider);
        MockMultipartFile file = new MockMultipartFile("files", "brief.pdf", "application/pdf", "payload".getBytes());
        FileUploadResponse uploadResponse = new FileUploadResponse(
            "https://res.cloudinary.com/demo/brief.pdf",
            "brief.pdf",
            "application/pdf",
            7L,
            "cloudinary"
        );

        when(currentUserProvider.requireCurrentUserId(principal)).thenReturn(7L);
        when(fileAccessService.requireUploadAccess("messages", 7L, null, 5L)).thenReturn("messages");
        when(fileStorageService.storeFileWithMetadata(file, "messages")).thenReturn(uploadResponse);

        ApiResponse<List<FileUploadResponse>> response = controller.uploadFiles("messages", List.of(file), null, null, 5L, principal);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).containsExactly(uploadResponse);
        verify(fileStorageService).storeFileWithMetadata(file, "messages");
    }

    @Test
    void uploadFilesPropagatesForbiddenAccess() {
        FileController controller = new FileController(fileStorageService, fileAccessService, currentUserProvider);
        MockMultipartFile file = new MockMultipartFile("files", "brief.pdf", "application/pdf", "payload".getBytes());

        when(currentUserProvider.requireCurrentUserId(principal)).thenReturn(7L);
        when(fileAccessService.requireUploadAccess("bids", 7L, 10L, null))
            .thenThrow(new BusinessException("ERR_AUTH_04", "Forbidden", HttpStatus.FORBIDDEN));

        assertThatThrownBy(() -> controller.uploadFiles("bids", List.of(file), null, 10L, null, principal))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_AUTH_04"));
    }
}
