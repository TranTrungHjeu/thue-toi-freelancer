package com.thuetoi.service;

import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.RefreshToken;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.RefreshTokenRepository;
import com.thuetoi.security.JwtTokenProvider;
import com.thuetoi.util.HashUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginCreatesRefreshTokenRecordAndReturnsAccessPayload() {
        User user = user(1L, "customer", true);
        AuthUserResponse authUserResponse = authUserResponse(user);
        LocalDateTime refreshExpiry = LocalDateTime.of(2026, 4, 1, 9, 0);

        when(userService.authenticate("customer1@gmail.com", "Demo@123")).thenReturn(user);
        when(jwtTokenProvider.generateAccessToken("1", "customer")).thenReturn("access-token-1");
        when(jwtTokenProvider.generateRefreshToken("1")).thenReturn("refresh-token-1");
        when(jwtTokenProvider.getRefreshTokenExpiry("refresh-token-1")).thenReturn(refreshExpiry);
        when(jwtTokenProvider.getAccessTokenExpirationMs()).thenReturn(900_000L);
        when(jwtTokenProvider.getRefreshTokenExpirationMs()).thenReturn(604_800_000L);
        when(userService.toAuthUserResponse(user)).thenReturn(authUserResponse);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthService.TokenIssueResult result = authService.login("customer1@gmail.com", "Demo@123");

        assertThat(result.response().getTokenType()).isEqualTo("Bearer");
        assertThat(result.response().getAccessToken()).isEqualTo("access-token-1");
        assertThat(result.response().getAccessTokenExpiresIn()).isEqualTo(900_000L);
        assertThat(result.response().getUser()).isEqualTo(authUserResponse);
        assertThat(result.refreshToken()).isEqualTo("refresh-token-1");
        assertThat(result.refreshTokenExpiresIn()).isEqualTo(604_800_000L);

        ArgumentCaptor<RefreshToken> refreshTokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(refreshTokenCaptor.capture());
        RefreshToken savedRefreshToken = refreshTokenCaptor.getValue();
        assertThat(savedRefreshToken.getUser()).isSameAs(user);
        assertThat(savedRefreshToken.getTokenHash()).isEqualTo(HashUtil.sha256("refresh-token-1"));
        assertThat(savedRefreshToken.getExpiresAt()).isEqualTo(refreshExpiry);
        assertThat(savedRefreshToken.getRevoked()).isFalse();
    }

    @Test
    void refreshRotatesRefreshTokenAndRevokesPreviousToken() {
        User user = user(1L, "freelancer", true);
        AuthUserResponse authUserResponse = authUserResponse(user);
        RefreshToken existingRefreshToken = new RefreshToken();
        existingRefreshToken.setUser(user);
        existingRefreshToken.setTokenHash(HashUtil.sha256("refresh-token-old"));
        existingRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(5));
        existingRefreshToken.setRevoked(false);
        LocalDateTime newRefreshExpiry = LocalDateTime.of(2026, 4, 2, 10, 0);

        when(jwtTokenProvider.validateRefreshToken("refresh-token-old")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(HashUtil.sha256("refresh-token-old"))).thenReturn(Optional.of(existingRefreshToken));
        when(jwtTokenProvider.generateAccessToken("1", "freelancer")).thenReturn("access-token-new");
        when(jwtTokenProvider.generateRefreshToken("1")).thenReturn("refresh-token-new");
        when(jwtTokenProvider.getRefreshTokenExpiry("refresh-token-new")).thenReturn(newRefreshExpiry);
        when(jwtTokenProvider.getAccessTokenExpirationMs()).thenReturn(900_000L);
        when(jwtTokenProvider.getRefreshTokenExpirationMs()).thenReturn(604_800_000L);
        when(userService.toAuthUserResponse(user)).thenReturn(authUserResponse);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthService.TokenIssueResult result = authService.refresh("refresh-token-old");

        assertThat(result.response().getAccessToken()).isEqualTo("access-token-new");
        assertThat(result.refreshToken()).isEqualTo("refresh-token-new");

        ArgumentCaptor<RefreshToken> refreshTokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository, times(2)).save(refreshTokenCaptor.capture());
        List<RefreshToken> savedTokens = refreshTokenCaptor.getAllValues();

        assertThat(savedTokens.get(0)).isSameAs(existingRefreshToken);
        assertThat(savedTokens.get(0).getRevoked()).isTrue();

        assertThat(savedTokens.get(1).getUser()).isSameAs(user);
        assertThat(savedTokens.get(1).getTokenHash()).isEqualTo(HashUtil.sha256("refresh-token-new"));
        assertThat(savedTokens.get(1).getExpiresAt()).isEqualTo(newRefreshExpiry);
        assertThat(savedTokens.get(1).getRevoked()).isFalse();
    }

    @Test
    void refreshRejectsMissingRefreshToken() {
        assertThatThrownBy(() -> authService.refresh("   "))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_11");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
            });

        verify(refreshTokenRepository, never()).findByTokenHash(any());
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    void refreshRejectsInactiveUser() {
        User user = user(1L, "customer", false);
        RefreshToken existingRefreshToken = new RefreshToken();
        existingRefreshToken.setUser(user);
        existingRefreshToken.setTokenHash(HashUtil.sha256("refresh-token-old"));
        existingRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(2));
        existingRefreshToken.setRevoked(false);

        when(jwtTokenProvider.validateRefreshToken("refresh-token-old")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(HashUtil.sha256("refresh-token-old"))).thenReturn(Optional.of(existingRefreshToken));

        assertThatThrownBy(() -> authService.refresh("refresh-token-old"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_03");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            });

        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    void logoutRevokesStoredRefreshTokenWhenFound() {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setRevoked(false);

        when(refreshTokenRepository.findByTokenHash(HashUtil.sha256("refresh-token-1"))).thenReturn(Optional.of(refreshToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.logout("refresh-token-1");

        assertThat(refreshToken.getRevoked()).isTrue();
        verify(refreshTokenRepository).save(refreshToken);
    }

    private User user(Long id, String role, boolean isActive) {
        User user = new User();
        user.setId(id);
        user.setEmail("user" + id + "@thuetoi.test");
        user.setFullName("User " + id);
        user.setRole(role);
        user.setIsActive(isActive);
        user.setVerified(true);
        return user;
    }

    private AuthUserResponse authUserResponse(User user) {
        return new AuthUserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            null,
            null,
            user.getIsActive(),
            user.getVerified(),
            null,
            null
        );
    }
}
