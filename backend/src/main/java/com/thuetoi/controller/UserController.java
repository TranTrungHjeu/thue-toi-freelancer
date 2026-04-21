package com.thuetoi.controller;

import com.thuetoi.dto.request.ChangePasswordRequest;
import com.thuetoi.dto.request.ChangeEmailRequest;
import com.thuetoi.dto.request.ProfileUpdateRequest;
import com.thuetoi.dto.request.RequestEmailChangeOtpRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.FileStorageService;
import com.thuetoi.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.Duration;

/**
 * Cung cấp các API quản lý tài khoản người dùng:
 * hồ sơ cá nhân, ảnh đại diện, thay đổi mật khẩu và đổi email.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private static final String REFRESH_TOKEN_COOKIE = "thue_toi_refresh_token";

    @Autowired
    private UserService userService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${app.auth.refresh-cookie.secure:false}")
    private boolean refreshCookieSecure;

    @Value("${app.auth.refresh-cookie.same-site:Lax}")
    private String refreshCookieSameSite;

    @Value("${app.auth.refresh-cookie.path:/api/v1/auth}")
    private String refreshCookiePath;

    @Value("${app.auth.refresh-cookie.domain:}")
    private String refreshCookieDomain;

    /**
     * Lấy thông tin user theo ID.
     */
    @GetMapping("/{id}")
    public ApiResponse<AuthUserResponse> getUser(@PathVariable Long id) {
        AuthUserResponse user = userService.getUser(id)
            .map(userEntity -> userService.toAuthUserResponse(userEntity))
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
        return ApiResponse.success("Lấy thông tin thành công", user);
    }

    /**
     * Cập nhật hồ sơ công khai của người dùng hiện tại.
     */
    @PutMapping("/me/profile")
    public ApiResponse<AuthUserResponse> updateMyProfile(@RequestBody ProfileUpdateRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        AuthUserResponse updatedUser = userService.updateProfile(
            currentUserId,
            request.getFullName(),
            request.getProfileDescription(),
            request.getAvatarUrl(),
            request.getSkills()
        );
        return ApiResponse.success("Cập nhật hồ sơ thành công", updatedUser);
    }

    /**
     * Upload ảnh đại diện lên Cloudinary, trả về URL.
     * Ảnh chỉ được lưu DB khi người dùng nhấn "Lưu hồ sơ".
     */
    @PostMapping("/me/avatar")
    public ApiResponse<String> uploadMyAvatar(@RequestParam("file") MultipartFile file, Principal principal) {
        currentUserProvider.requireCurrentUserId(principal);
        String avatarUrl = fileStorageService.storeFile(file, "avatars");
        return ApiResponse.success("Tải ảnh lên thành công", avatarUrl);
    }

    /**
     * Gửi OTP đến email hiện tại để xác thực trước khi cho phép đổi mật khẩu.
     */
    @PostMapping("/me/password/otp")
    public ApiResponse<Void> requestPasswordChangeOtp(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        userService.requestPasswordChangeOtp(currentUserId);
        return ApiResponse.success("Đã gửi mã OTP. Vui lòng kiểm tra email của bạn.", null);
    }

    /**
     * Đổi mật khẩu, revoke các session khác và cấp token mới cho session hiện tại.
     * Trả access token mới trong body để client cập nhật mà không cần đăng nhập lại.
     */
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<String>> changeMyPassword(
        @Valid @RequestBody ChangePasswordRequest request,
        @CookieValue(value = REFRESH_TOKEN_COOKIE, required = false) String currentRefreshToken,
        Principal principal
    ) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        UserService.PasswordChangeResult result = userService.changePassword(
            currentUserId, request.getOldPassword(), request.getNewPassword(), request.getOtp(), currentRefreshToken
        );

        ResponseCookie newRefreshCookie = buildRefreshTokenCookie(result.refreshToken(), result.refreshTokenExpiresIn());

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, newRefreshCookie.toString())
            .body(ApiResponse.success("Đổi mật khẩu thành công", result.accessToken()));
    }

    /**
     * Gửi OTP đến email mới sau khi xác thực mật khẩu hiện tại.
     */
    @PostMapping("/me/email/otp")
    public ApiResponse<Void> requestEmailChangeOtp(@Valid @RequestBody RequestEmailChangeOtpRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        userService.requestEmailChangeOtp(currentUserId, request.getOldPassword(), request.getNewEmail());
        return ApiResponse.success("Đã gửi mã OTP. Vui lòng kiểm tra email mới của bạn.", null);
    }

    /**
     * Xác nhận đổi email sau khi nhập OTP.
     * Toàn bộ session cũ sẽ bị thu hồi, client phải đăng nhập lại.
     */
    @PutMapping("/me/email")
    public ApiResponse<AuthUserResponse> changeMyEmail(@Valid @RequestBody ChangeEmailRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        AuthUserResponse updatedUser = userService.changeEmail(
            currentUserId, request.getNewEmail(), request.getOldPassword(), request.getOtp()
        );
        return ApiResponse.success("Đổi email thành công", updatedUser);
    }

    private ResponseCookie buildRefreshTokenCookie(String refreshToken, long maxAgeInMilliseconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_TOKEN_COOKIE, refreshToken)
            .httpOnly(true)
            .secure(refreshCookieSecure)
            .sameSite(refreshCookieSameSite)
            .path(refreshCookiePath)
            .maxAge(Duration.ofMillis(maxAgeInMilliseconds));
        if (refreshCookieDomain != null && !refreshCookieDomain.isBlank()) {
            builder.domain(refreshCookieDomain);
        }
        return builder.build();
    }
}
