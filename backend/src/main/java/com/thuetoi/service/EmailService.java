package com.thuetoi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${resend.api.key}")
    private String apiKey;

    private final String RESEND_URL = "https://api.resend.com/emails";

    public void sendOtpEmail(String toEmail, String otp) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String emailHtml = String.format("<h2>Your OTP is: %s</h2><p>This OTP will expire in 5 minutes.</p>", otp);

        String body = String.format("""
        {
          "from": "onboarding@resend.dev",
          "to": ["%s"],
          "subject": "Your One-Time Password (OTP)",
          "html": "%s"
        }
        """, toEmail, emailHtml.replace("\"", "\\\""));

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForObject(RESEND_URL, request, String.class);
            logger.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            logger.error("Error sending OTP email to {}: {}", toEmail, e.getMessage());
            // Consider re-throwing a custom exception to be handled by the controller
        }
    }
}
