package com.thuetoi.service;

import com.thuetoi.dto.response.OtpVerificationStatusResponse;
import com.thuetoi.entity.EmailOtp;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.EmailOtpRepository;
import com.thuetoi.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.Random;

@Slf4j
@Service
public class OtpService {

    private static final String VERIFY_EMAIL_PURPOSE = "verify_email";
    private static final String CHANGE_PASSWORD_PURPOSE = "change_password";
    private static final String CHANGE_EMAIL_PURPOSE = "change_email";
    private static final long RESEND_COOLDOWN_SECONDS = 60;

    @Autowired
    private EmailOtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private final Random random = new SecureRandom();

    public String generateOtp() {
        return String.format("%06d", random.nextInt(999999));
    }

    @Transactional
    public void sendVerificationOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail);
        if (user == null) {
            throw new BusinessException("ERR_USER_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND);
        }

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new BusinessException("ERR_AUTH_15", "Tài khoản đã được xác thực email", HttpStatus.CONFLICT);
        }

        EmailOtp latestOtp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, VERIFY_EMAIL_PURPOSE)
            .orElse(null);
        if (latestOtp != null && latestOtp.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(RESEND_COOLDOWN_SECONDS))) {
            throw new BusinessException("ERR_AUTH_10", "Vui lòng chờ trước khi gửi lại OTP", HttpStatus.TOO_MANY_REQUESTS);
        }

        String otp = generateOtp();
        EmailOtp emailOtp = new EmailOtp(normalizedEmail, otp, VERIFY_EMAIL_PURPOSE);
        otpRepository.save(emailOtp);
        emailService.sendOtpEmail(normalizedEmail, otp);
        log.info("Gửi OTP xác thực email đến: {}", normalizedEmail);
    }

    @Transactional
    public void verifyEmailOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        EmailOtp emailOtp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, VERIFY_EMAIL_PURPOSE)
                .orElseThrow(() -> new BusinessException("ERR_AUTH_08", "OTP không hợp lệ", HttpStatus.BAD_REQUEST));

        if (emailOtp.isUsed()) {
            throw new BusinessException("ERR_AUTH_08", "OTP không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        if (emailOtp.isExpired()) {
            throw new BusinessException("ERR_AUTH_09", "OTP đã hết hạn", HttpStatus.BAD_REQUEST);
        }

        if (!emailOtp.getOtp().equals(otp)) {
            throw new BusinessException("ERR_AUTH_08", "OTP không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(normalizedEmail);
        if (user == null) {
            throw new BusinessException("ERR_USER_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND);
        }

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new BusinessException("ERR_AUTH_15", "Tài khoản đã được xác thực email", HttpStatus.CONFLICT);
        }

        user.setVerified(true);
        emailOtp.setUsed(true);
        emailOtp.setUsedAt(LocalDateTime.now());

        userRepository.save(user);
        otpRepository.save(emailOtp);
        log.info("Xác thực email thành công cho: {}", normalizedEmail);
    }

    @Transactional(readOnly = true)
    public OtpVerificationStatusResponse getVerificationOtpStatus(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail);
        if (user == null) {
            throw new BusinessException("ERR_USER_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND);
        }

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new BusinessException("ERR_AUTH_15", "Tài khoản đã được xác thực email", HttpStatus.CONFLICT);
        }

        return getOtpStatus(normalizedEmail, VERIFY_EMAIL_PURPOSE);
    }

    @Transactional
    public void sendPasswordChangeOtp(User user) {
        String normalizedEmail = user.getEmail();

        EmailOtp latestOtp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, CHANGE_PASSWORD_PURPOSE)
            .orElse(null);
        if (latestOtp != null && latestOtp.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(RESEND_COOLDOWN_SECONDS))) {
            throw new BusinessException("ERR_AUTH_10", "Vui lòng chờ trước khi gửi lại OTP", HttpStatus.TOO_MANY_REQUESTS);
        }

        String otp = generateOtp();
        EmailOtp emailOtp = new EmailOtp(normalizedEmail, otp, CHANGE_PASSWORD_PURPOSE);
        otpRepository.save(emailOtp);
        emailService.sendPasswordChangeOtpEmail(normalizedEmail, otp);
        log.info("Gửi OTP đổi mật khẩu đến: {}", normalizedEmail);
    }

    @Transactional
    public void verifyPasswordChangeOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        EmailOtp emailOtp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, CHANGE_PASSWORD_PURPOSE)
                .orElseThrow(() -> new BusinessException("ERR_AUTH_08", "OTP không hợp lệ", HttpStatus.BAD_REQUEST));

        if (emailOtp.isUsed() || emailOtp.isExpired() || !emailOtp.getOtp().equals(otp)) {
            throw new BusinessException("ERR_AUTH_08", "OTP đổi mật khẩu không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST);
        }

        emailOtp.setUsed(true);
        emailOtp.setUsedAt(LocalDateTime.now());
        otpRepository.save(emailOtp);
        log.info("Xác thực OTP đổi mật khẩu thành công cho: {}", email);
    }

    @Transactional
    public void sendEmailChangeOtp(String newEmail) {
        String normalizedEmail = normalizeEmail(newEmail);
        
        // Kiểm tra xem email mới có ai dùng chưa
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("ERR_AUTH_05", "Email này đã được sử dụng bởi một tài khoản khác", HttpStatus.CONFLICT);
        }

        EmailOtp latestOtp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, CHANGE_EMAIL_PURPOSE)
            .orElse(null);
        if (latestOtp != null && latestOtp.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(RESEND_COOLDOWN_SECONDS))) {
            throw new BusinessException("ERR_AUTH_10", "Vui lòng chờ trước khi gửi lại OTP", HttpStatus.TOO_MANY_REQUESTS);
        }

        String otp = generateOtp();
        EmailOtp emailOtp = new EmailOtp(normalizedEmail, otp, CHANGE_EMAIL_PURPOSE);
        otpRepository.save(emailOtp);
        emailService.sendEmailChangeOtpEmail(normalizedEmail, otp);
        log.info("Gửi OTP đổi email đến địa chỉ mới: {}", normalizedEmail);
    }

    @Transactional
    public void verifyEmailChangeOtp(String newEmail, String otp) {
        String normalizedEmail = normalizeEmail(newEmail);
        EmailOtp emailOtp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, CHANGE_EMAIL_PURPOSE)
                .orElseThrow(() -> new BusinessException("ERR_AUTH_08", "OTP không hợp lệ", HttpStatus.BAD_REQUEST));

        if (emailOtp.isUsed() || emailOtp.isExpired() || !emailOtp.getOtp().equals(otp)) {
            throw new BusinessException("ERR_AUTH_08", "OTP đổi email không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST);
        }

        emailOtp.setUsed(true);
        emailOtp.setUsedAt(LocalDateTime.now());
        otpRepository.save(emailOtp);
        log.info("Xác thực OTP đổi email thành công cho địa chỉ mới: {}", newEmail);
    }

    private OtpVerificationStatusResponse getOtpStatus(String email, String purpose) {
        LocalDateTime now = LocalDateTime.now();
        EmailOtp latestOtp = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
            .orElse(null);

        if (latestOtp == null) {
            return new OtpVerificationStatusResponse(null, now, 0, 0);
        }

        LocalDateTime resendAvailableAt = latestOtp.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS);
        long expiresInSeconds = 0;
        if (!latestOtp.isUsed() && !latestOtp.isExpired()) {
            expiresInSeconds = Math.max(0, Duration.between(now, latestOtp.getExpireTime()).getSeconds());
        }

        long resendCooldownSeconds = Math.max(0, Duration.between(now, resendAvailableAt).getSeconds());

        return new OtpVerificationStatusResponse(
            latestOtp.getExpireTime(), resendAvailableAt, expiresInSeconds, resendCooldownSeconds
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
