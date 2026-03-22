package com.thuetoi.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thuetoi.dto.response.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Trả lỗi 401 theo chuẩn ApiResponse để frontend xử lý đồng nhất.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
        throws IOException, ServletException {

        String authorizationHeader = request.getHeader("Authorization");
        String code = authorizationHeader == null || authorizationHeader.isBlank() ? "ERR_AUTH_01" : "ERR_AUTH_12";
        String message = "ERR_AUTH_01".equals(code)
            ? "Người dùng chưa đăng nhập"
            : "Access token không hợp lệ hoặc đã hết hạn";

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(code, message));
    }
}
