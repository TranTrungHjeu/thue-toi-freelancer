package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public ApiResponse healthCheck() {
        // Kiểm tra các nghiệp vụ: DB, service, logic
        boolean dbOk = true; // TODO: kiểm tra kết nối DB
        boolean serviceOk = true; // TODO: kiểm tra service
        boolean logicOk = true; // TODO: kiểm tra logic nghiệp vụ
        if (dbOk && serviceOk && logicOk) {
            return ApiResponse.success("Healthy", null);
        } else {
            return ApiResponse.error("Service unhealthy");
        }
    }
}
