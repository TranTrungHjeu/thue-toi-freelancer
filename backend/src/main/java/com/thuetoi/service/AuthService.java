package com.thuetoi.service;

import com.thuetoi.dto.response.AuthTokenResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.RefreshToken;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.RefreshTokenRepository;
import com.thuetoi.security.JwtTokenProvider;
import com.thuetoi.util.HashUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserService userService,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public TokenIssueResult login(String email, String password) {
        User user = userService.authenticate(email, password);

        String accessToken = jwtTokenProvider.generateAccessToken(String.valueOf(user.getId()), user.getRole());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(String.valueOf(user.getId()));

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashRefreshToken(refreshTokenValue));
        refreshToken.setExpiresAt(jwtTokenProvider.getRefreshTokenExpiry(refreshTokenValue));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        AuthUserResponse userResponse = userService.toAuthUserResponse(user);
        return new TokenIssueResult(
            new AuthTokenResponse(
                "Bearer",
                accessToken,
                jwtTokenProvider.getAccessTokenExpirationMs(),
                userResponse
            ),
            refreshTokenValue,
            jwtTokenProvider.getRefreshTokenExpirationMs()
        );
    }

    @Transactional
    public TokenIssueResult refresh(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            throw new BusinessException("ERR_AUTH_11", "Refresh token không hợp lệ hoặc đã bị thu hồi", HttpStatus.UNAUTHORIZED);
        }

        if (!jwtTokenProvider.validateRefreshToken(refreshTokenValue)) {
            throw new BusinessException("ERR_AUTH_11", "Refresh token không hợp lệ hoặc đã bị thu hồi", HttpStatus.UNAUTHORIZED);
        }

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashRefreshToken(refreshTokenValue))
            .orElseThrow(() -> new BusinessException("ERR_AUTH_11", "Refresh token không hợp lệ hoặc đã bị thu hồi", HttpStatus.UNAUTHORIZED));

        if (Boolean.TRUE.equals(refreshToken.getRevoked())) {
            throw new BusinessException("ERR_AUTH_11", "Refresh token không hợp lệ hoặc đã bị thu hồi", HttpStatus.UNAUTHORIZED);
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("ERR_AUTH_11", "Refresh token không hợp lệ hoặc đã bị thu hồi", HttpStatus.UNAUTHORIZED);
        }

        User user = refreshToken.getUser();
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            throw new BusinessException("ERR_AUTH_03", "Tài khoản đã bị khoá", HttpStatus.FORBIDDEN);
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        String newAccessToken = jwtTokenProvider.generateAccessToken(String.valueOf(user.getId()), user.getRole());
        String newRefreshTokenValue = jwtTokenProvider.generateRefreshToken(String.valueOf(user.getId()));

        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setUser(user);
        newRefreshToken.setTokenHash(hashRefreshToken(newRefreshTokenValue));
        newRefreshToken.setExpiresAt(jwtTokenProvider.getRefreshTokenExpiry(newRefreshTokenValue));
        newRefreshToken.setRevoked(false);
        refreshTokenRepository.save(newRefreshToken);

        return new TokenIssueResult(
            new AuthTokenResponse(
                "Bearer",
                newAccessToken,
                jwtTokenProvider.getAccessTokenExpirationMs(),
                userService.toAuthUserResponse(user)
            ),
            newRefreshTokenValue,
            jwtTokenProvider.getRefreshTokenExpirationMs()
        );
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenHash(hashRefreshToken(refreshTokenValue))
            .ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
    }

    private String hashRefreshToken(String refreshTokenValue) {
        return HashUtil.sha256(refreshTokenValue == null ? null : refreshTokenValue.trim());
    }

    public record TokenIssueResult(
        AuthTokenResponse response,
        String refreshToken,
        long refreshTokenExpiresIn
    ) {
    }
}
