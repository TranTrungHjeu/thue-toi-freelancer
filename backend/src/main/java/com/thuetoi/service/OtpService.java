package com.thuetoi.service;

import com.thuetoi.entity.EmailOtp;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.EmailOtpRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.Random;

@Service
public class OtpService {

    private static final String VERIFY_EMAIL_PURPOSE = "verify_email";
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
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
