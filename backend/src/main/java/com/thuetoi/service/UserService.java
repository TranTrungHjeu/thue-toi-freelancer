package com.thuetoi.service;

import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.User;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

/**
 * Service User: Xử lý logic nghiệp vụ người dùng
 */
@Service
public class UserService {
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Đăng ký tài khoản mới.
     * User được tạo với trạng thái chưa xác thực (verified = false).
     * Việc xác thực sẽ được thực hiện qua luồng OTP riêng.
     */
    @Transactional
    public AuthUserResponse register(String email, String password, String fullName, String role, String profileDescription) {
        String normalizedRole = normalizeRole(role);
        if ("admin".equals(normalizedRole)) {
            throw new BusinessException("ERR_AUTH_14", "Không thể đăng ký với vai trò admin");
        }

        String normalizedEmail = normalizeEmail(email);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("ERR_AUTH_05", "Email đã tồn tại");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(normalizedRole);
        user.setProfileDescription(normalizeProfileDescription(profileDescription));
        user.setIsActive(true); // User is active but must be verified to login
        user.setVerified(false);

        User savedUser = userRepository.save(user);

        return toAuthUserResponse(savedUser);
    }

    /**
     * Đăng nhập
     */
    public AuthUserResponse login(String email, String password) {
        User user = authenticate(email, password);
        return toAuthUserResponse(user);
    }

    public User authenticate(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail);
        if (user == null) {
            throw new BusinessException("ERR_AUTH_12", "Sai email");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException("ERR_AUTH_13", "Sai mật khẩu");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BusinessException("ERR_AUTH_03", "Tài khoản đã bị khoá");
        }
        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new BusinessException("ERR_AUTH_16", "Vui lòng xác thực tài khoản trước khi đăng nhập.");
        }
        return user;
    }

    public AuthUserResponse getAuthProfile(String email) {
        User user = getUserByEmail(email);
        if (user == null) {
            throw new BusinessException("ERR_AUTH_04", "Không tìm thấy user");
        }
        return toAuthUserResponse(user);
    }

    /**
     * Lấy thông tin user
     */
    public Optional<User> getUser(Long id) {
        return userRepository.findById(id);
    }

    private String normalizeRole(String role) {
        String normalizedRole = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);
        if (!"freelancer".equals(normalizedRole) && !"customer".equals(normalizedRole) && !"admin".equals(normalizedRole)) {
            throw new BusinessException("ERR_AUTH_06", "Vai trò không hợp lệ. Chỉ chấp nhận freelancer, customer hoặc admin");
        }
        return normalizedRole;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeProfileDescription(String profileDescription) {
        if (profileDescription == null) {
            return null;
        }
        String normalized = profileDescription.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public AuthUserResponse toAuthUserResponse(User user) {
        return new AuthUserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.getAvatarUrl(),
            user.getProfileDescription(),
            user.getIsActive(),
            user.getVerified(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
