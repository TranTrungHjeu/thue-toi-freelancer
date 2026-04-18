package com.thuetoi.service;

import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    @Autowired
    private OtpService otpService;

    @Autowired
    private SkillService skillService;

    /**
     * Đăng ký tài khoản mới.
     * User được tạo với trạng thái chưa xác thực (verified = false).
     * Việc xác thực sẽ được thực hiện qua luồng OTP riêng.
     */
    @Transactional
    public AuthUserResponse register(String email, String password, String fullName, String role, String profileDescription) {
        String normalizedRole = normalizeRole(role);
        if ("admin".equals(normalizedRole)) {
            throw new BusinessException("ERR_AUTH_14", "Không thể đăng ký với vai trò admin", HttpStatus.FORBIDDEN);
        }

        String normalizedEmail = normalizeEmail(email);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("ERR_AUTH_05", "Email đã tồn tại", HttpStatus.CONFLICT);
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
        otpService.sendVerificationOtp(savedUser.getEmail());

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
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException("ERR_AUTH_02", "Sai email hoặc mật khẩu", HttpStatus.UNAUTHORIZED);
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BusinessException("ERR_AUTH_03", "Tài khoản đã bị khoá", HttpStatus.FORBIDDEN);
        }
        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new BusinessException("ERR_AUTH_07", "Tài khoản chưa xác thực email", HttpStatus.FORBIDDEN);
        }
        return user;
    }

    public AuthUserResponse getAuthProfile(Long userId) {
        return toAuthUserResponse(getRequiredUser(userId));
    }

    /**
     * Lấy thông tin user
     */
    public Optional<User> getUser(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public AuthUserResponse updateProfile(Long userId, String fullName, String profileDescription, String avatarUrl, List<String> skills) {
        User user = getRequiredUser(userId);

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }
        if (profileDescription != null) {
            user.setProfileDescription(normalizeProfileDescription(profileDescription));
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(normalizeOptionalText(avatarUrl));
        }
        if (skills != null) {
            user.setSkills(skillService.resolveSkills(skills));
        }

        User savedUser = userRepository.save(user);
        return toAuthUserResponse(savedUser);
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }

    private String normalizeRole(String role) {
        String normalizedRole = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);
        if (!"freelancer".equals(normalizedRole) && !"customer".equals(normalizedRole) && !"admin".equals(normalizedRole)) {
            throw new BusinessException(
                "ERR_AUTH_06",
                "Vai trò không hợp lệ. Chỉ chấp nhận freelancer hoặc customer",
                HttpStatus.BAD_REQUEST
            );
        }
        return normalizedRole;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeProfileDescription(String profileDescription) {
        return normalizeOptionalText(profileDescription);
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public AuthUserResponse toAuthUserResponse(User user) {
        List<String> skills = user.getSkills() == null ? List.of() : user.getSkills().stream()
            .map(skill -> skill.getName())
            .filter(skillName -> skillName != null && !skillName.isBlank())
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .toList();

        return new AuthUserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.getAvatarUrl(),
            user.getProfileDescription(),
            skills,
            user.getIsActive(),
            user.getVerified(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
