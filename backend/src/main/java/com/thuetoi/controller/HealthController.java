package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/v1/health")
    public ResponseEntity<ApiResponse<Void>> healthCheck() {
        try {
            Integer databaseReady = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (databaseReady == null || databaseReady != 1) {
                throw new IllegalStateException("Database health check failed");
            }
            return ResponseEntity.ok(ApiResponse.success("Healthy", null));
        } catch (Exception ex) {
            log.error("Health check failed", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("ERR_SYS_01", "Service unhealthy"));
        }
    }
}
