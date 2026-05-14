package com.thuetoi.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thuetoi.dto.response.ApiResponse;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * Trả lỗi 403 theo chuẩn ApiResponse để frontend nhận diện phân quyền.
 */
@Slf4j
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
        throws IOException, ServletException {

        String user = request.getUserPrincipal() == null ? "anonymous" : request.getUserPrincipal().getName();
        log.warn(
            "Access denied: method={} path={} user={} message={}",
            request.getMethod(),
            request.getRequestURI(),
            user,
            accessDeniedException == null ? "" : accessDeniedException.getMessage()
        );

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.error("ERR_AUTH_04", "Bạn không có quyền truy cập tài nguyên này"));
    }
}
