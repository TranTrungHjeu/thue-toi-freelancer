package com.thuetoi.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Chạy {@link org.flywaydb.core.Flyway#repair()} trước {@code migrate()} để tự xử lý
 * bản ghi migration failed / lệch checksum (ví dụ sau khi đổi tên file migration).
 */
@Configuration
public class FlywayRepairMigrationStrategy {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
