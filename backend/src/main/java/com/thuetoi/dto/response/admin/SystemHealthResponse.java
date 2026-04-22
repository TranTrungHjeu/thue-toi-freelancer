package com.thuetoi.dto.response.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemHealthResponse {
    private double cpuUsage;
    private long totalMemory;
    private long freeMemory;
    private long usedMemory;
    private double memoryUsagePercent;
    
    private long totalDisk;
    private long freeDisk;
    private long usedDisk;
    private double diskUsagePercent;
    
    private String status; // UP, WARNING, CRITICAL
    private long uptime;   // in milliseconds
}
