package com.thuetoi.service;

import com.thuetoi.dto.response.AuthTokenResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.RefreshToken;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.RefreshTokenRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.security.JwtTokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserService userService,
                       UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthTokenResponse login(String email, String password) {
        User user = userService.authenticate(email, password);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getRole());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(user.getEmail());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setExpiresAt(jwtTokenProvider.getRefreshTokenExpiry(refreshTokenValue));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        AuthUserResponse userResponse = userService.toAuthUserResponse(user);
        return new AuthTokenResponse(
            "Bearer",
            accessToken,
            jwtTokenProvider.getAccessTokenExpirationMs(),
            refreshTokenValue,
            jwtTokenProvider.getRefreshTokenExpirationMs(),
            userResponse
        );
    }

    @Transactional
    public AuthTokenResponse refresh(String refreshTokenValue) {
        if (!jwtTokenProvider.validateRefreshToken(refreshTokenValue)) {
            throw new BusinessException("ERR_AUTH_07", "Refresh token không hợp lệ");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_08", "Refresh token không tồn tại"));

        if (Boolean.TRUE.equals(refreshToken.getRevoked())) {
            throw new BusinessException("ERR_AUTH_09", "Refresh token đã bị thu hồi");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("ERR_AUTH_10", "Refresh token đã hết hạn");
        }

        User user = refreshToken.getUser();
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            throw new BusinessException("ERR_AUTH_11", "Tài khoản không tồn tại hoặc đã bị khoá");
        }

        // Rotation: token cũ bị thu hồi, cấp token mới.
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getRole());
        String newRefreshTokenValue = jwtTokenProvider.generateRefreshToken(user.getEmail());

        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setUser(user);
        newRefreshToken.setToken(newRefreshTokenValue);
        newRefreshToken.setExpiresAt(jwtTokenProvider.getRefreshTokenExpiry(newRefreshTokenValue));
        newRefreshToken.setRevoked(false);
        refreshTokenRepository.save(newRefreshToken);

        return new AuthTokenResponse(
            "Bearer",
            newAccessToken,
            jwtTokenProvider.getAccessTokenExpirationMs(),
            newRefreshTokenValue,
            jwtTokenProvider.getRefreshTokenExpirationMs(),
            userService.toAuthUserResponse(user)
        );
    }

    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return;
        }

        List<RefreshToken> activeTokens = refreshTokenRepository.findByUser_IdAndRevokedFalse(user.getId());
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);
    }
}
