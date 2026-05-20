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
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
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
        User user = Mockito.mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getRole()).thenReturn("customer");

        AuthUserResponse authUserResponse = new AuthUserResponse();
        authUserResponse.setId(1L);

        LocalDateTime refreshExpiry = LocalDateTime.now().plusDays(7);

        when(userService.authenticate(anyString(), anyString())).thenReturn(user);
        when(jwtTokenProvider.generateAccessToken("1", "customer")).thenReturn("access-token-1");
        when(jwtTokenProvider.generateRefreshToken("1")).thenReturn("refresh-token-1");
        when(jwtTokenProvider.getRefreshTokenExpiry("refresh-token-1")).thenReturn(refreshExpiry);
        when(jwtTokenProvider.getAccessTokenExpirationMs()).thenReturn(900_000L);
        when(jwtTokenProvider.getRefreshTokenExpirationMs()).thenReturn(604_800_000L);
        when(userService.toAuthUserResponse(user)).thenReturn(authUserResponse);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthService.TokenIssueResult result = authService.login("customer1@gmail.com", "Demo@123");

        assertThat(result.response().getAccessToken()).isEqualTo("access-token-1");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void refreshRejectsMissingRefreshToken() {
        assertThatThrownBy(() -> authService.refresh("   "))
            .isInstanceOf(BusinessException.class);

        verify(refreshTokenRepository, never()).findByTokenHash(any());
    }

    @Test
    void logoutRevokesStoredRefreshTokenWhenFound() {
        RefreshToken refreshToken = Mockito.mock(RefreshToken.class);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(refreshToken));

        authService.logout("refresh-token-1");

        verify(refreshToken).setRevoked(true);
        verify(refreshTokenRepository).save(refreshToken);
    }
}
