package com.thuetoi.service;

import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.RefreshToken;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.RefreshTokenRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.security.JwtTokenProvider;
import com.thuetoi.util.HashUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OtpService otpService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private UserService userService;

    @Test
    void registerNormalizesPayloadAndTriggersOtpFlow() {
        when(userRepository.existsByEmail("customer1@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("Demo@123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(5L);
            return savedUser;
        });

        AuthUserResponse response = userService.register(
            "  CUSTOMER1@gmail.com  ",
            "Demo@123",
            "Khach Hang Demo",
            " customer ",
            "  Can tim freelancer fullstack  "
        );

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getEmail()).isEqualTo("customer1@gmail.com");
        assertThat(response.getRole()).isEqualTo("customer");
        assertThat(response.getVerified()).isFalse();
        assertThat(response.getProfileDescription()).isEqualTo("Can tim freelancer fullstack");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("customer1@gmail.com");
        assertThat(savedUser.getPasswordHash()).isEqualTo("encoded-password");
        assertThat(savedUser.getFullName()).isEqualTo("Khach Hang Demo");
        assertThat(savedUser.getRole()).isEqualTo("customer");
        assertThat(savedUser.getProfileDescription()).isEqualTo("Can tim freelancer fullstack");
        assertThat(savedUser.getIsActive()).isTrue();
        assertThat(savedUser.getVerified()).isFalse();
        verify(otpService).sendVerificationOtp("customer1@gmail.com");
    }

    @Test
    void registerRejectsAdminRoleFromPublicFlow() {
        assertThatThrownBy(() -> userService.register(
            "admin@thuetoi.test",
            "Demo@123",
            "Admin Demo",
            "admin",
            null
        ))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_14");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            });

        verify(userRepository, never()).existsByEmail(any());
        verify(userRepository, never()).save(any(User.class));
        verify(otpService, never()).sendVerificationOtp(any());
    }

    @Test
    void authenticateRejectsUnverifiedUser() {
        User user = new User();
        user.setId(7L);
        user.setEmail("freelancer1@gmail.com");
        user.setPasswordHash("encoded-password");
        user.setRole("freelancer");
        user.setIsActive(true);
        user.setVerified(false);

        when(userRepository.findByEmail("freelancer1@gmail.com")).thenReturn(user);
        when(passwordEncoder.matches("Demo@123", "encoded-password")).thenReturn(true);

        assertThatThrownBy(() -> userService.authenticate("  FREELANCER1@gmail.com  ", "Demo@123"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_07");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            });
    }

    @Test
    void authenticateRejectsInactiveUser() {
        User user = new User();
        user.setId(8L);
        user.setEmail("customer2@gmail.com");
        user.setPasswordHash("encoded-password");
        user.setRole("customer");
        user.setIsActive(false);
        user.setVerified(true);

        when(userRepository.findByEmail("customer2@gmail.com")).thenReturn(user);
        when(passwordEncoder.matches("Demo@123", "encoded-password")).thenReturn(true);

        assertThatThrownBy(() -> userService.authenticate("customer2@gmail.com", "Demo@123"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_03");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            });
    }

    @Test
    void authenticateReturnsVerifiedActiveUser() {
        User user = new User();
        user.setId(9L);
        user.setEmail("freelancer2@gmail.com");
        user.setPasswordHash("encoded-password");
        user.setRole("freelancer");
        user.setIsActive(true);
        user.setVerified(true);

        when(userRepository.findByEmail("freelancer2@gmail.com")).thenReturn(user);
        when(passwordEncoder.matches("Demo@123", "encoded-password")).thenReturn(true);

        User authenticatedUser = userService.authenticate("freelancer2@gmail.com", "Demo@123");

        assertThat(authenticatedUser).isSameAs(user);
        verify(passwordEncoder).matches("Demo@123", "encoded-password");
        verify(userRepository).findByEmail(eq("freelancer2@gmail.com"));
    }

    @Test
    void changePasswordRotatesCurrentSessionAndRevokesOtherSessions() {
        User user = verifiedUser(11L, "customer1@gmail.com", "customer");
        user.setPasswordHash("old-hash");
        RefreshToken currentRefreshToken = new RefreshToken();
        currentRefreshToken.setRevoked(false);
        LocalDateTime newRefreshExpiry = LocalDateTime.of(2026, 5, 10, 9, 0);
        String currentRefreshHash = HashUtil.sha256("refresh-token-current");

        when(userRepository.findById(11L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Demo@123", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("Demo@456")).thenReturn("new-hash");
        when(jwtTokenProvider.generateAccessToken("11", "customer")).thenReturn("access-token-new");
        when(jwtTokenProvider.generateRefreshToken("11")).thenReturn("refresh-token-new");
        when(jwtTokenProvider.getRefreshTokenExpiry("refresh-token-new")).thenReturn(newRefreshExpiry);
        when(jwtTokenProvider.getRefreshTokenExpirationMs()).thenReturn(604_800_000L);
        when(refreshTokenRepository.findByTokenHash(currentRefreshHash)).thenReturn(Optional.of(currentRefreshToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserService.PasswordChangeResult result = userService.changePassword(
            11L,
            "Demo@123",
            "Demo@456",
            "123456",
            "refresh-token-current"
        );

        assertThat(result.accessToken()).isEqualTo("access-token-new");
        assertThat(result.refreshToken()).isEqualTo("refresh-token-new");
        assertThat(result.refreshTokenExpiresIn()).isEqualTo(604_800_000L);
        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(currentRefreshToken.getRevoked()).isTrue();

        verify(otpService).verifyPasswordChangeOtp("customer1@gmail.com", "123456");
        verify(refreshTokenRepository).revokeOtherSessionsByUserId(11L, currentRefreshHash);

        ArgumentCaptor<RefreshToken> refreshTokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository, times(2)).save(refreshTokenCaptor.capture());
        RefreshToken replacementRefreshToken = refreshTokenCaptor.getAllValues().get(1);
        assertThat(replacementRefreshToken.getUser()).isSameAs(user);
        assertThat(replacementRefreshToken.getTokenHash()).isEqualTo(HashUtil.sha256("refresh-token-new"));
        assertThat(replacementRefreshToken.getExpiresAt()).isEqualTo(newRefreshExpiry);
        assertThat(replacementRefreshToken.getRevoked()).isFalse();
    }

    @Test
    void changeEmailRejectsAddressTakenAfterOtpWasIssued() {
        User user = verifiedUser(12L, "customer1@gmail.com", "customer");
        user.setPasswordHash("old-hash");
        User existingUser = verifiedUser(99L, "new-email@gmail.com", "freelancer");

        when(userRepository.findById(12L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Demo@123", "old-hash")).thenReturn(true);
        when(userRepository.findByEmail("new-email@gmail.com")).thenReturn(existingUser);

        assertThatThrownBy(() -> userService.changeEmail(
            12L,
            "  NEW-EMAIL@gmail.com  ",
            "Demo@123",
            "123456"
        ))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_05");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            });

        verify(otpService, never()).verifyEmailChangeOtp(any(), any());
        verify(userRepository, never()).save(any(User.class));
        verify(refreshTokenRepository, never()).revokeAllByUserId(any());
    }

    @Test
    void changeEmailUpdatesNormalizedAddressAndRevokesAllSessions() {
        User user = verifiedUser(13L, "customer1@gmail.com", "customer");
        user.setPasswordHash("old-hash");

        when(userRepository.findById(13L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Demo@123", "old-hash")).thenReturn(true);
        when(userRepository.findByEmail("new-email@gmail.com")).thenReturn(null);
        when(userRepository.save(user)).thenReturn(user);

        AuthUserResponse response = userService.changeEmail(
            13L,
            "  NEW-EMAIL@gmail.com  ",
            "Demo@123",
            "123456"
        );

        assertThat(response.getEmail()).isEqualTo("new-email@gmail.com");
        assertThat(user.getEmail()).isEqualTo("new-email@gmail.com");
        assertThat(user.getVerified()).isTrue();
        verify(otpService).verifyEmailChangeOtp("new-email@gmail.com", "123456");
        verify(refreshTokenRepository).revokeAllByUserId(13L);
    }

    private User verifiedUser(Long id, String email, String role) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFullName("User " + id);
        user.setRole(role);
        user.setIsActive(true);
        user.setVerified(true);
        return user;
    }
}
