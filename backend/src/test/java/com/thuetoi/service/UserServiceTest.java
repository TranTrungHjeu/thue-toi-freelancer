package com.thuetoi.service;

import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
}
