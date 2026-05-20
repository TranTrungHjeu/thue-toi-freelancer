package com.thuetoi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from:Thue Toi <onboarding@resend.dev>}")
    private String resendFrom;

    @Value("${app.notifications.email.enabled:false}")
    private boolean emailEnabled;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendEmail(String to, String subject, String content) {
        if (!emailEnabled || resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("Email sending is disabled or API Key is missing. Skipping actual send.");
            return;
        }

        try {
            String url = "https://api.resend.com/emails";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", resendFrom);
            body.put("to", to);
            body.put("subject", subject);
            body.put("html", content.replace("\n", "<br/>"));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);

            log.info("Email sent successfully via Resend to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via Resend: {}", e.getMessage());
        }
    }

    public boolean sendNotificationEmail(String to, String subject, String body, String actionUrl) {
        sendEmail(to, subject, body + "\nXem chi tiết tại: " + actionUrl);
        return true;
    }

    public boolean sendOtpEmail(String to, String otp) {
        sendEmail(to, "Mã xác thực OTP của bạn", "Mã xác thực OTP của bạn là: " + otp);
        return true;
    }

    public boolean sendPasswordChangeOtpEmail(String to, String otp) {
        sendEmail(to, "Mã OTP thay đổi mật khẩu", "Mã xác thực OTP thay đổi mật khẩu của bạn là: " + otp);
        return true;
    }

    public boolean sendEmailChangeOtpEmail(String to, String otp) {
        sendEmail(to, "Mã OTP thay đổi địa chỉ email", "Mã xác thực OTP thay đổi địa chỉ email của bạn là: " + otp);
        return true;
    }
}
