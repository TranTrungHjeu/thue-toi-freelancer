package com.thuetoi.service;

import com.thuetoi.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";

    @Value("${resend.api.key}")
    private String apiKey;

    @Value("${resend.from:Thue Toi <onboarding@resend.dev>}")
    private String fromAddress;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String toEmail, String otp) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("ERR_SYS_03", "Dịch vụ gửi email chưa được cấu hình", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String emailHtml = """
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
              <h2 style="margin-bottom:8px;">Ma xac thuc email cua ban</h2>
              <p style="margin:0 0 16px;">Su dung ma OTP ben duoi de kich hoat tai khoan Thuê Tôi.</p>
              <div style="display:inline-block;padding:12px 20px;border:2px solid #0f172a;font-size:24px;font-weight:700;letter-spacing:0.32em;">
                %s
              </div>
              <p style="margin:16px 0 0;">Ma nay se het han sau 5 phut.</p>
            </div>
            """.formatted(otp);

        Map<String, Object> payload = Map.of(
            "from", fromAddress,
            "to", List.of(toEmail),
            "subject", "Thuê Tôi - Ma xac thuc email",
            "html", emailHtml
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(RESEND_URL, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP xác thực email", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            logger.info("OTP email sent successfully to {}", toEmail);
        } catch (HttpStatusCodeException ex) {
            logger.error("Resend rejected OTP email for {} with status {} and body {}", toEmail, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP xác thực email", HttpStatus.INTERNAL_SERVER_ERROR, ex);
        } catch (Exception e) {
            logger.error("Error sending OTP email to {}: {}", toEmail, e.getMessage());
            if (e instanceof BusinessException businessException) {
                throw businessException;
            }
            throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP xác thực email", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    public void sendPasswordChangeOtpEmail(String toEmail, String otp) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("ERR_SYS_03", "Dịch vụ gửi email chưa được cấu hình", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String emailHtml = """
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
              <h2 style="margin-bottom:8px;">Ma xac thuc ban yeu cau doi mat khau</h2>
              <p style="margin:0 0 16px;">Day la ma OTP bao mat de doi mat khau cua ban.</p>
              <div style="display:inline-block;padding:12px 20px;border:2px solid #0f172a;font-size:24px;font-weight:700;letter-spacing:0.32em;">
                %s
              </div>
              <p style="margin:16px 0 0;">Ma nay se het han sau 5 phut. Khong chia se no voi bat ky ai!</p>
            </div>
            """.formatted(otp);

        Map<String, Object> payload = Map.of(
            "from", fromAddress,
            "to", List.of(toEmail),
            "subject", "Thuê Tôi - Ma xac thuc doi mat khau",
            "html", emailHtml
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(RESEND_URL, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP đổi mật khẩu", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            logger.info("Password change OTP email sent successfully to {}", toEmail);
        } catch (HttpStatusCodeException ex) {
            logger.error("Resend rejected password change OTP email for {} with status {} and body {}", toEmail, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP đổi mật khẩu", HttpStatus.INTERNAL_SERVER_ERROR, ex);
        } catch (Exception e) {
            logger.error("Error sending password change OTP email to {}: {}", toEmail, e.getMessage());
            if (e instanceof BusinessException businessException) {
                throw businessException;
            }
            throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP đổi mật khẩu", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }
    
    public void sendEmailChangeOtpEmail(String toEmail, String otp) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("ERR_SYS_03", "Dịch vụ gửi email chưa được cấu hình", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String emailHtml = """
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
              <h2 style="margin-bottom:8px;">Xac minh dia chi email moi</h2>
              <p style="margin:0 0 16px;">Hay dung ma OTP sau day de xac minh dia chi email thay the cho tai khoan Thuê Tôi cua ban.</p>
              <div style="display:inline-block;padding:12px 20px;border:2px solid #0f172a;font-size:24px;font-weight:700;letter-spacing:0.32em;">
                %s
              </div>
              <p style="margin:16px 0 0;">Ma nay se het han sau 5 phut.</p>
            </div>
            """.formatted(otp);

        Map<String, Object> payload = Map.of(
            "from", fromAddress,
            "to", List.of(toEmail),
            "subject", "Thuê Tôi - Xac minh email moi",
            "html", emailHtml
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(RESEND_URL, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP đổi email", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            logger.info("Email change OTP sent successfully to {}", toEmail);
        } catch (HttpStatusCodeException ex) {
            logger.error("Resend rejected email change OTP for {} with status {} and body {}", toEmail, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP đổi email", HttpStatus.INTERNAL_SERVER_ERROR, ex);
        } catch (Exception e) {
            logger.error("Error sending email change OTP to {}: {}", toEmail, e.getMessage());
            if (e instanceof BusinessException businessException) {
                throw businessException;
            }
            throw new BusinessException("ERR_SYS_03", "Không thể gửi OTP đổi email", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }
}
