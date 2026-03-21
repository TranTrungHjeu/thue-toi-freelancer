package com.thuetoi.service;

import com.thuetoi.entity.EmailOtp;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.EmailOtpRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private EmailOtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private final Random random = new SecureRandom();

    public String generateOtp() {
        // 6-digit OTP
        return String.format("%06d", random.nextInt(999999));
    }

    @Transactional
    public void sendOtp(String email) {
        // Ensure user exists before sending OTP
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new BusinessException("ERR_USER_01", "User with this email does not exist.");
        }

        String otp = generateOtp();
        EmailOtp emailOtp = new EmailOtp(email, otp);
        otpRepository.save(emailOtp);
        emailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        EmailOtp emailOtp = otpRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new BusinessException("ERR_OTP_01", "Invalid OTP or email."));

        if (emailOtp.isUsed()) {
            throw new BusinessException("ERR_OTP_02", "OTP has already been used.");
        }

        if (emailOtp.isExpired()) {
            throw new BusinessException("ERR_OTP_03", "OTP has expired.");
        }

        if (!emailOtp.getOtp().equals(otp)) {
            throw new BusinessException("ERR_OTP_01", "Invalid OTP or email.");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            // This should ideally not happen if we check on sendOtp
            throw new BusinessException("ERR_USER_01", "User not found.");
        }

        user.setVerified(true);
        emailOtp.setUsed(true);

        userRepository.save(user);
        otpRepository.save(emailOtp);
    }

    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new BusinessException("ERR_USER_01", "Không tìm thấy người dùng với email này");
        }

        if (Boolean.TRUE.equals(user.getIsActive())) {
            throw new BusinessException("ERR_AUTH_12", "Tài khoản đã được kích hoạt.");
        }

        sendOtp(email);
    }
}
