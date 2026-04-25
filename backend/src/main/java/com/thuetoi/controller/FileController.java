package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.FileUploadResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.FileAccessService;
import com.thuetoi.service.FileStorageService;
import com.thuetoi.util.FileValidationUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {
    private final FileStorageService fileStorageService;
    private final FileAccessService fileAccessService;
    private final CurrentUserProvider currentUserProvider;

    public FileController(
        FileStorageService fileStorageService,
        FileAccessService fileAccessService,
        CurrentUserProvider currentUserProvider
    ) {
        this.fileStorageService = fileStorageService;
        this.fileAccessService = fileAccessService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping(value = "/{context}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<FileUploadResponse>> uploadFiles(
        @PathVariable String context,
        @RequestParam(value = "files", required = false) List<MultipartFile> files,
        @RequestParam(value = "file", required = false) MultipartFile file,
        @RequestParam(value = "projectId", required = false) Long projectId,
        @RequestParam(value = "contractId", required = false) Long contractId,
        Principal principal
    ) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        String uploadContext = fileAccessService.requireUploadAccess(context, currentUserId, projectId, contractId);
        List<MultipartFile> uploadFiles = normalizeFiles(files, file);

        List<FileUploadResponse> responses = uploadFiles.stream()
            .map(uploadFile -> fileStorageService.storeFileWithMetadata(uploadFile, uploadContext))
            .toList();

        return ApiResponse.success("Tải tệp lên thành công", responses);
    }

    private List<MultipartFile> normalizeFiles(List<MultipartFile> files, MultipartFile file) {
        List<MultipartFile> uploadFiles = new ArrayList<>();
        if (files != null) {
            uploadFiles.addAll(files.stream().filter(nextFile -> nextFile != null).toList());
        }
        if (file != null) {
            uploadFiles.add(file);
        }

        if (uploadFiles.isEmpty()) {
            throw new BusinessException("ERR_FILE_01", "Vui lòng chọn ít nhất một tệp", HttpStatus.BAD_REQUEST);
        }
        if (uploadFiles.size() > FileValidationUtil.MAX_ATTACHMENTS) {
            throw new BusinessException("ERR_FILE_01", "Chỉ được tải tối đa 5 tệp mỗi lần", HttpStatus.BAD_REQUEST);
        }
        return uploadFiles;
    }
}
