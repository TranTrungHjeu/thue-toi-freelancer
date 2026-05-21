package com.thuetoi.service.scheduler;

import com.thuetoi.entity.SystemSetting;
import com.thuetoi.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;

@Service
public class DynamicSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(DynamicSchedulerService.class);

    private final TaskScheduler taskScheduler;
    private final SystemSettingRepository systemSettingRepository;
    private final ApplicationContext applicationContext;

    private final Map<String, ScheduledFuture<?>> scheduledTasks = new HashMap<>();

    public DynamicSchedulerService(TaskScheduler taskScheduler,
                                   SystemSettingRepository systemSettingRepository,
                                   ApplicationContext applicationContext) {
        this.taskScheduler = taskScheduler;
        this.systemSettingRepository = systemSettingRepository;
        this.applicationContext = applicationContext;
    }

    @PostConstruct
    public void init() {
        refreshAllJobs();
    }

    public synchronized void refreshAllJobs() {
        log.info("Refreshing all dynamic scheduled jobs...");
        Map<String, ScheduledJob> jobs = applicationContext.getBeansOfType(ScheduledJob.class);
        jobs.values().forEach(this::scheduleJob);
    }

    public synchronized void scheduleJob(ScheduledJob job) {
        String jobKey = job.getJobKey();

        if (scheduledTasks.containsKey(jobKey)) {
            scheduledTasks.get(jobKey).cancel(false);
            scheduledTasks.remove(jobKey);
        }

        String cronExpression = systemSettingRepository.findById(jobKey)
                .map(setting -> setting.getValue())
                .orElse(null);

        if (cronExpression != null && !cronExpression.isBlank()) {
            try {
                ScheduledFuture<?> future = taskScheduler.schedule(job, new CronTrigger(cronExpression));
                scheduledTasks.put(jobKey, future);
                log.info("Scheduled job [{}] with cron: [{}]", jobKey, cronExpression);
            } catch (IllegalArgumentException e) {
                log.error("Failed to schedule job [{}] with invalid cron: [{}]", jobKey, cronExpression);
            }
        } else {
            log.warn("Job [{}] not scheduled: cron expression not found in system_settings", jobKey);
        }
    }
}
