package com.thuetoi.service;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;

import org.springframework.stereotype.Service;

import com.thuetoi.dto.response.admin.SystemHealthResponse;

@Service
public class SystemHealthService {

    public SystemHealthResponse getSystemHealth() {
        // 1. Memory
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        double memoryUsagePercent = (double) usedMemory / totalMemory * 100.0;

        // 2. CPU
        java.lang.management.OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double cpuLoad = -1.0;
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOSBean) {
            cpuLoad = sunOSBean.getCpuLoad() * 100.0;
        }

        // 3. Disk: aggregate all available roots for cross-platform metrics (Windows/Linux)
        long totalDisk = 0L;
        long freeDisk = 0L;
        File[] roots = File.listRoots();
        if (roots != null) {
            for (File root : roots) {
                totalDisk += Math.max(root.getTotalSpace(), 0L);
                freeDisk += Math.max(root.getUsableSpace(), 0L);
            }
        }
        long usedDisk = totalDisk - freeDisk;
        double diskUsagePercent = totalDisk > 0 ? (double) usedDisk / totalDisk * 100.0 : 0.0;

        // 4. Uptime
        RuntimeMXBean rb = ManagementFactory.getRuntimeMXBean();
        long uptime = rb.getUptime();

        // 5. Status logic
        String status = "UP";
        if (cpuLoad > 90.0 || memoryUsagePercent > 90.0 || diskUsagePercent > 95.0) {
            status = "CRITICAL";
        } else if (cpuLoad > 70.0 || memoryUsagePercent > 80.0 || diskUsagePercent > 85.0) {
            status = "WARNING";
        }

        return SystemHealthResponse.builder()
            .cpuUsage(cpuLoad)
            .totalMemory(totalMemory)
            .freeMemory(freeMemory)
            .usedMemory(usedMemory)
            .memoryUsagePercent(memoryUsagePercent)
            .totalDisk(totalDisk)
            .freeDisk(freeDisk)
            .usedDisk(usedDisk)
            .diskUsagePercent(diskUsagePercent)
            .status(status)
            .uptime(uptime)
            .build();
    }
}
