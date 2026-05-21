package com.thuetoi.service.scheduler;

import com.thuetoi.entity.Project;
import com.thuetoi.enums.ProjectStatus; // Still used for comparison with OPEN.getValue()
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.service.NotificationService;
import com.thuetoi.service.TelegramBotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ExpiredProjectJob implements ScheduledJob {

    private static final Logger log = LoggerFactory.getLogger(ExpiredProjectJob.class);

    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final TelegramBotService telegramBotService;

    public ExpiredProjectJob(ProjectRepository projectRepository, NotificationService notificationService, TelegramBotService telegramBotService) {
        this.projectRepository = projectRepository;
        this.notificationService = notificationService;
        this.telegramBotService = telegramBotService;
    }

    @Override
    public String getJobKey() {
        return "cron_expired_projects_no_contract";
    }

    @Override
    @Transactional
    public void run() {
        log.info("Running job: Scanning for expired projects with no contracts...");

        LocalDateTime now = LocalDateTime.now();
        // Use OPEN.getValue() to get the string "open" for the query
        List<Project> expiredProjects = projectRepository.findExpiredProjectsWithNoContracts(ProjectStatus.OPEN.getValue(), now);

        if (expiredProjects.isEmpty()) {
            log.info("No expired projects found.");
            return;
        }

        log.info("Found {} expired projects. Processing...", expiredProjects.size());

        for (Project project : expiredProjects) {
            try {
                // Update status to CANCELLED
                project.setStatus(ProjectStatus.CANCELLED.getValue()); // Use String value
                projectRepository.save(project);

                // Notify client
                String title = "Dự án đã hết hạn";
                String content = String.format("Dự án '%s' của bạn đã hết hạn mà chưa có freelancer nào nhận việc. Hệ thống đã tự động đóng dự án này.",
                        project.getTitle());
                String link = "/projects/" + project.getId();

                // Use getUser().getId() to get the client ID
                notificationService.createNotificationForUser(
                        project.getUser().getId(),
                        "system",
                        title,
                        content,
                        link
                );

                if (project.getUser().getTelegramChatId() != null && !project.getUser().getTelegramChatId().isEmpty()) {
                    telegramBotService.sendNotification(
                        project.getUser().getTelegramChatId(),
                        "⚠️ *" + title + "*\n\n" + content + "\n\n[Xem dự án](https://thuetoi.id.vn" + link + ")"
                    );
                }

                log.info("Project ID {} marked as expired/cancelled.", project.getId());
            } catch (Exception e) {
                log.error("Error processing expired project ID {}: {}", project.getId(), e.getMessage());
            }
        }
    }
}
