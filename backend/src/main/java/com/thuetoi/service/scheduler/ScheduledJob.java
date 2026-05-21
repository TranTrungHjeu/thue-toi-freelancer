package com.thuetoi.service.scheduler;

/**
 * Interface for jobs that can be scheduled dynamically.
 */
public interface ScheduledJob extends Runnable {
    /**
     * Unique identifier for the job, matching a key in system_settings for its cron expression.
     */
    String getJobKey();
}
