package com.thuetoi.service;

import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.RefreshToken;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.RefreshTokenRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.security.JwtTokenProvider;
import com.thuetoi.util.HashUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Xử lý toàn bộ logic nghiệp vụ liên quan đến tài khoản người dùng:
 * đăng ký, xác thực, cập nhật hồ sơ, thay đổi mật khẩu và đổi email.
 */
@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OtpService otpService;

    @Autowired
    private SkillService skillService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    /**
     * Đăng ký tài khoản mới.
     * Tài khoản được tạo ở trạng thái chưa xác thực (verified = false)
     * và sẽ kích hoạt sau khi người dùng xác thực OTP qua email.
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
        // Tài khoản hoạt động ngay nhưng cần xác thực email trước khi đăng nhập
        user.setIsActive(true);
        user.setVerified(false);

        User savedUser = userRepository.save(user);
        otpService.sendVerificationOtp(savedUser.getEmail());

        log.info("Tài khoản mới đã được tạo cho email: {}", normalizedEmail);
        return toAuthUserResponse(savedUser);
    }

    /**
     * Xác thực thông tin đăng nhập, kiểm tra trạng thái tài khoản.
     *
     * @param email    Địa chỉ email đăng nhập
     * @param password Mật khẩu thô chưa băm
     * @return Entity User đã xác thực thành công
     * @throws BusinessException nếu sai thông tin, tài khoản bị khoá hoặc chưa xác thực email
     */
    public User authenticate(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("Đăng nhập thất bại - sai thông tin cho email: {}", normalizedEmail);
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

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public AuthUserResponse getAuthProfile(Long userId) {
        return toAuthUserResponse(getRequiredUser(userId));
    }

    /**
     * Lấy thông tin user theo ID.
     */
    public Optional<User> getUser(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Cập nhật thông tin hồ sơ công khai của người dùng.
     * Chỉ cập nhật các trường được truyền vào (không null).
     */
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

    /**
     * Gửi OTP xác thực đến email hiện tại trước khi cho phép đổi mật khẩu.
     */
    @Transactional
    public void requestPasswordChangeOtp(Long userId) {
        User user = getRequiredUser(userId);
        otpService.sendPasswordChangeOtp(user);
    }

    /**
     * Đổi mật khẩu sau khi xác thực OTP.
     * Revoke tất cả session khác, cấp token mới cho session hiện tại
     * để người dùng không bị đăng xuất khỏi thiết bị đang dùng.
     *
     * @param userId              ID người dùng
     * @param oldPassword         Mật khẩu cũ để xác minh danh tính
     * @param newPassword         Mật khẩu mới
     * @param otp                 Mã OTP đã gửi đến email
     * @param currentRefreshToken Refresh token của session hiện tại (từ cookie)
     * @return Cặp token mới để client tiếp tục session
     */
    @Transactional
    public PasswordChangeResult changePassword(Long userId, String oldPassword, String newPassword, String otp, String currentRefreshToken) {
        User user = getRequiredUser(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException("ERR_AUTH_02", "Mật khẩu cũ không chính xác", HttpStatus.UNAUTHORIZED);
        }
        otpService.verifyPasswordChangeOtp(user.getEmail(), otp);

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Revoke tất cả session khác, giữ lại session hiện tại để UX không bị gián đoạn
        String currentHash = HashUtil.sha256(currentRefreshToken != null ? currentRefreshToken.trim() : null);
        if (currentHash != null) {
            refreshTokenRepository.revokeOtherSessionsByUserId(userId, currentHash);
        } else {
            // Không có cookie → revoke toàn bộ (trường hợp gọi API không qua browser)
            refreshTokenRepository.revokeAllByUserId(userId);
        }

        // Cấp token mới thay thế token hiện tại (rotate để tăng bảo mật)
        String newAccessToken = jwtTokenProvider.generateAccessToken(String.valueOf(user.getId()), user.getRole());
        String newRefreshTokenValue = jwtTokenProvider.generateRefreshToken(String.valueOf(user.getId()));

        if (currentHash != null) {
            refreshTokenRepository.findByTokenHash(currentHash).ifPresent(old -> {
                old.setRevoked(true);
                refreshTokenRepository.save(old);
            });
        }

        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setUser(user);
        newRefreshToken.setTokenHash(HashUtil.sha256(newRefreshTokenValue));
        newRefreshToken.setExpiresAt(jwtTokenProvider.getRefreshTokenExpiry(newRefreshTokenValue));
        newRefreshToken.setRevoked(false);
        refreshTokenRepository.save(newRefreshToken);

        log.info("Mật khẩu của user ID {} đã được thay đổi thành công, {} session khác bị thu hồi.", userId,
                currentHash != null ? "các" : "toàn bộ");
        return new PasswordChangeResult(newAccessToken, newRefreshTokenValue, jwtTokenProvider.getRefreshTokenExpirationMs());
    }

    /**
     * Kết quả trả về sau khi đổi mật khẩu thành công,
     * bao gồm cặp token mới để client cập nhật session.
     */
    public record PasswordChangeResult(String accessToken, String refreshToken, long refreshTokenExpiresIn) {}

    /**
     * Gửi OTP đến email mới sau khi xác thực mật khẩu hiện tại.
     * Ngăn truờng hợp kẻ xấu thay email mà không biết mật khẩu.
     */
    @Transactional
    public void requestEmailChangeOtp(Long userId, String oldPassword, String newEmail) {
        User user = getRequiredUser(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException("ERR_AUTH_02", "Mật khẩu hiện tại không chính xác", HttpStatus.UNAUTHORIZED);
        }

        String normalizedEmail = normalizeEmail(newEmail);
        if (user.getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new BusinessException("ERR_AUTH_05", "Email mới không được trùng với email hiện tại", HttpStatus.BAD_REQUEST);
        }

        otpService.sendEmailChangeOtp(newEmail);
    }

    /**
     * Xác nhận đổi email sau khi người dùng nhập OTP được gửi đến email mới.
     * Revoke toàn bộ session cũ vì email là định danh trong JWT.
     *
     * @param userId      ID người dùng
     * @param newEmail    Địa chỉ email mới muốn chuyển sang
     * @param oldPassword Mật khẩu hiện tại để xác minh lần hai
     * @param otp         Mã OTP gửi tới email mới
     * @return Thông tin user sau khi cập nhật email
     */
    @Transactional
    public AuthUserResponse changeEmail(Long userId, String newEmail, String oldPassword, String otp) {
        User user = getRequiredUser(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException("ERR_AUTH_02", "Mật khẩu hiện tại không chính xác", HttpStatus.UNAUTHORIZED);
        }

        otpService.verifyEmailChangeOtp(newEmail, otp);

        user.setEmail(normalizeEmail(newEmail));
        user.setVerified(true);
        User savedUser = userRepository.save(user);

        // Revoke toàn bộ refresh token vì email (định danh trong JWT) đã thay đổi
        refreshTokenRepository.revokeAllByUserId(userId);

        log.info("Email của user ID {} đã được thay đổi thành công. Toàn bộ session cũ bị thu hồi.", userId);
        return toAuthUserResponse(savedUser);
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

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }

    private String normalizeRole(String role) {
        String normalizedRole = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);
        if (!"freelancer".equals(normalizedRole) && !"customer".equals(normalizedRole) && !"admin".equals(normalizedRole)) {
            throw new BusinessException(
                "ERR_AUTH_06",
                "Vai trò không hợp lệ. Chỉ chấp nhận Freelancer hoặc Khách hàng",
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
}
