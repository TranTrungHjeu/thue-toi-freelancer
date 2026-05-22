-- Cron settings for expired projects and contracts
INSERT IGNORE INTO
    system_settings (
        setting_key,
        setting_value,
        description,
        updated_at
    )
VALUES (
        'cron_expired_projects_no_contract',
        '0 0 * * * *',
        'Cron expression for scanning expired projects with no contracts (default: every hour)',
        CURRENT_TIMESTAMP
    ),
    (
        'cron_expired_contracts',
        '0 0 */2 * * *',
        'Cron expression for scanning expired contracts for automatic refund (default: every 2 hours)',
        CURRENT_TIMESTAMP
    );
