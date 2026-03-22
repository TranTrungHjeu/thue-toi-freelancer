package com.thuetoi.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthSchemaCompatibilityInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public AuthSchemaCompatibilityInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (!columnExists("refresh_tokens", "token")) {
                return;
            }

            String isNullable = jdbcTemplate.queryForObject(
                """
                SELECT IS_NULLABLE
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND column_name = ?
                """,
                String.class,
                "refresh_tokens",
                "token"
            );

            if ("NO".equalsIgnoreCase(isNullable)) {
                jdbcTemplate.execute("ALTER TABLE refresh_tokens MODIFY COLUMN token VARCHAR(512) NULL");
                log.info("Adjusted legacy refresh_tokens.token column to nullable for JWT compatibility.");
            }
        } catch (Exception ex) {
            log.warn("Could not apply auth schema compatibility patch: {}", ex.getMessage());
        }
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = ?
              AND column_name = ?
            """,
            Integer.class,
            tableName,
            columnName
        );
        return count != null && count > 0;
    }
}
