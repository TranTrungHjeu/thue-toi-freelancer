package com.thuetoi.controller;

import com.thuetoi.dto.profile.CvExtractedData;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.ProfileCvService;
import com.thuetoi.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileCvController {

    private final ProfileCvService profileCvService;
    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;

    public ProfileCvController(ProfileCvService profileCvService, UserService userService, CurrentUserProvider currentUserProvider) {
        this.profileCvService = profileCvService;
        this.userService = userService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping(value = "/cv-extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CvExtractedData> extractCv(@RequestParam("file") MultipartFile file) {
        CvExtractedData extractedData = profileCvService.extractFromPdf(file);
        return ApiResponse.success("Trích xuất CV thành công", extractedData);
    }

    @PatchMapping("/update-from-cv")
    public ApiResponse<AuthUserResponse> updateFromCv(@RequestBody CvExtractedData request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        AuthUserResponse updatedUser = userService.updateProfileFromCv(currentUserId, request);
        return ApiResponse.success("Cập nhật hồ sơ từ CV thành công", updatedUser);
    }
}