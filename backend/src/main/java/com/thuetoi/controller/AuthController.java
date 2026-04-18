package com.thuetoi.controller;

import com.thuetoi.dto.request.LoginRequest;
import com.thuetoi.dto.request.RegisterRequest;
import com.thuetoi.dto.request.ResendVerificationRequest;
import com.thuetoi.dto.request.VerifyOtpRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.OtpVerificationStatusResponse;
import com.thuetoi.dto.response.AuthTokenResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.service.AuthService;
import com.thuetoi.service.OtpService;
import com.thuetoi.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "thue_toi_refresh_token";

    @Value("${app.auth.refresh-cookie.secure:false}")
    private boolean refreshCookieSecure;

    @Value("${app.auth.refresh-cookie.same-site:Lax}")
    private String refreshCookieSameSite;

    @Value("${app.auth.refresh-cookie.path:/api/v1/auth}")
    private String refreshCookiePath;

    @Value("${app.auth.refresh-cookie.domain:}")
    private String refreshCookieDomain;

    private final UserService userService;
    private final AuthService authService;
    private final OtpService otpService;

    public AuthController(UserService userService, AuthService authService, OtpService otpService) {
        this.userService = userService;
        this.authService = authService;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthUserResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthUserResponse user = userService.register(
            request.getEmail(),
            request.getPassword(),
            request.getFullName(),
            request.getRole(),
            request.getProfileDescription()
        );
        return ApiResponse.success("Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.", user);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthService.TokenIssueResult tokenIssueResult = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(tokenIssueResult.refreshToken(), tokenIssueResult.refreshTokenExpiresIn()).toString())
            .body(ApiResponse.success("Đăng nhập thành công", tokenIssueResult.response()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> refresh(
        @CookieValue(value = REFRESH_TOKEN_COOKIE, required = false) String refreshToken
    ) {
        AuthService.TokenIssueResult tokenIssueResult = authService.refresh(refreshToken);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(tokenIssueResult.refreshToken(), tokenIssueResult.refreshTokenExpiresIn()).toString())
            .body(ApiResponse.success("Làm mới token thành công", tokenIssueResult.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
        @CookieValue(value = REFRESH_TOKEN_COOKIE, required = false) String refreshToken
    ) {
        authService.logout(refreshToken);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearRefreshTokenCookie().toString())
            .body(ApiResponse.success("Đăng xuất thành công", null));
    }

    @GetMapping("/profile")
    public ApiResponse<AuthUserResponse> profile(Principal principal) {
        Long userId = extractCurrentUserId(principal);
        return ApiResponse.success("Lấy thông tin người dùng hiện tại thành công", userService.getAuthProfile(userId));
    }

    @PostMapping("/resend-verification-otp")
    public ApiResponse<Void> resendVerificationOtp(@Valid @RequestBody ResendVerificationRequest request) {
        otpService.sendVerificationOtp(request.getEmail());
        return ApiResponse.success("Đã gửi lại OTP xác thực email.", null);
    }

    @PostMapping("/verify-email-otp")
    public ApiResponse<Void> verifyEmailOtp(@Valid @RequestBody VerifyOtpRequest request) {
        otpService.verifyEmailOtp(request.getEmail(), request.getOtp());
        return ApiResponse.success("Xác thực email thành công.", null);
    }

    @GetMapping("/verification-otp-status")
    public ApiResponse<OtpVerificationStatusResponse> getVerificationOtpStatus(@RequestParam String email) {
        return ApiResponse.success(
            "Lấy trạng thái OTP xác thực email thành công.",
            otpService.getVerificationOtpStatus(email)
        );
    }

    private Long extractCurrentUserId(Principal principal) {
        if (principal == null) {
            throw new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException ex) {
            throw new BusinessException("ERR_AUTH_12", "Access token không hợp lệ", HttpStatus.UNAUTHORIZED, ex);
        }
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

    private ResponseCookie clearRefreshTokenCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
            .httpOnly(true)
            .secure(refreshCookieSecure)
            .sameSite(refreshCookieSameSite)
            .path(refreshCookiePath)
            .maxAge(Duration.ZERO);
        if (refreshCookieDomain != null && !refreshCookieDomain.isBlank()) {
            builder.domain(refreshCookieDomain);
        }
        return builder.build();
    }
}
