package com.knowledgeVista.Migration.sheduler;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ScheduledFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Email.EmailService;
import com.knowledgeVista.Migration.BackupService;
import com.knowledgeVista.Migration.model.BackupScheduleConfig;
import com.knowledgeVista.Migration.repo.BackupSheduleConfigRepo;
import com.knowledgeVista.User.Repository.MuserRepositories;

import jakarta.annotation.PostConstruct;

@Service
public class BackupSchedulerService {

	@Autowired
	private BackupSheduleConfigRepo configRepo;

	@Autowired
	private EmailService emailService;

	@Autowired
	private BackupService backupService;

	@Autowired
	private MuserRepositories muserRepo;

	@Autowired
	private TaskScheduler taskScheduler;

	@Value("${backend.domain}")
	private String backendDomain;

	@Value("${developer.mail}")
	private String devmail;

	private static final Logger logger = LoggerFactory.getLogger(BackupSchedulerService.class);

	private final Map<String, ScheduledFuture<?>> scheduledTasks = new HashMap<>();

	@PostConstruct
	public void scheduleAllBackups() {
		logger.info("🟢 Loading backup configurations from database...");
		List<BackupScheduleConfig> configs = configRepo.findAll();
		for (BackupScheduleConfig config : configs) {
			scheduleBackup(config);
		}
		scheduleDailyBackupTask(); // Optional generic daily 2AM backup
	}

	private void scheduleBackup(BackupScheduleConfig config) {
		LocalTime time = config.getBackupTime();
		if (time == null) {
			logger.info("⚠️ Skipping scheduling due to null time for: " + config.getInstitutionName());
			return;
		}

		Runnable task = () -> {
			logger.info("📦 Running scheduled backup for: " + config.getInstitutionName() + " at " + LocalTime.now());
			LocalDate today = LocalDate.now();
			if (shouldBackupToday(config, today)) {
				try {
					backupService.performBackupAndUpload(config.getInstitutionName(), config.getMaxBackupsToKeep());
				} catch (Exception e) {
					List<String> adminEmails = muserRepo.findAdminEmailfromInstitutionName(config.getInstitutionName());
					handleBackupFailure(e, adminEmails, List.of(devmail));
				}
			}
		};

		scheduleDailyAt(time, task, config.getInstitutionName());
	}

	private void scheduleDailyBackupTask() {
		LocalTime time = LocalTime.of(15, 43); // 2 AM
		Runnable dailyTask = () -> {
			logger.info("🛡️ Running generic daily 2AM backup at " + LocalTime.now());
			try {
				backupService.backupDatabaseToFolder();
			} catch (Exception e) {
				handleBackupFailure(e, List.of(devmail), List.of());
			}
		};

		scheduleDailyAt(time, dailyTask, "generic-daily-backup");
	}

	private void scheduleDailyAt(LocalTime time, Runnable task, String taskKey) {
		ZonedDateTime now = ZonedDateTime.now();
		ZonedDateTime firstRun = now.withHour(time.getHour()).withMinute(time.getMinute()).withSecond(0).withNano(0);
		if (now.compareTo(firstRun) >= 0) {
			firstRun = firstRun.plusDays(1);
		}

		long initialDelay = Duration.between(now, firstRun).toMillis();
		long period = Duration.ofDays(1).toMillis();

		logger.info("⏰ Scheduling task '" + taskKey + "' for " + firstRun);

		ScheduledFuture<?> future = taskScheduler.scheduleAtFixedRate(task,
				new Date(System.currentTimeMillis() + initialDelay), period);
		scheduledTasks.put(taskKey, future);
	}

	private boolean shouldBackupToday(BackupScheduleConfig config, LocalDate today) {
		switch (config.getScheduleType()) {
		case DAILY:
			return true;
		case WEEKLY:
			return config.getDayOfWeek() != null && today.getDayOfWeek().equals(config.getDayOfWeek());
		case MONTHLY:
			return config.getDayOfMonth() != null && today.getDayOfMonth() == config.getDayOfMonth();
		default:
			return false;
		}
	}

	public void handleBackupFailure(Exception e, List<String> developerMails, List<String> adminMails) {
		String timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
		String subject = "🚨 Database Backup Failure Alert";

		try {
			String devBody = "<h2 style='color: #d9534f;'>Database Backup Failed</h2>"
					+ "<p><strong>Timestamp:</strong> " + timestamp + "</p>" + "<p><strong>Backend Server:</strong> "
					+ backendDomain + "</p>" + "<p><strong>Issue:</strong> "
					+ (e.getMessage() != null ? e.getMessage() : "Unknown error") + "</p>"
					+ "<p><strong>Cause:</strong> " + (e.getCause() != null ? e.getCause().toString() : "N/A") + "</p>"
					+ "<pre>" + getStackTraceAsString(e) + "</pre>" + "<p>This is a system-generated alert.</p>";

			String adminBody = "<h2 style='color: #d9534f;'>System Alert: Backup Failed</h2>"
					+ "<p>The backup failed at <strong>" + timestamp + "</strong>.</p>" + "<p><strong>Server:</strong> "
					+ backendDomain + "</p>" + "<p><strong>Issue:</strong> "
					+ (e.getMessage() != null ? e.getMessage() : "Unknown error") + "</p>";

			if (!developerMails.isEmpty()) {
				emailService.sendHtmlEmailAsync("Default", developerMails, List.of(), List.of(), subject, devBody);
			}
			if (!adminMails.isEmpty()) {
				emailService.sendHtmlEmailAsync("Default", adminMails, List.of(), List.of(), subject, adminBody);
			}

		} catch (Exception emailEx) {
			logger.info("❌ Failed to send backup failure email: " + emailEx.getMessage());
		}
	}

	private String getStackTraceAsString(Exception e) {
		StringWriter sw = new StringWriter();
		e.printStackTrace(new PrintWriter(sw));
		return sw.toString();
	}

	public void rescheduleBackupForInstitution(String institutionName) {
		logger.info("at rescheduleBackupForInstitution to shedule for institution=" + institutionName);
		Optional<BackupScheduleConfig> configOpt = configRepo.findByInstitutionName(institutionName);
		if (configOpt.isPresent()) {
			BackupScheduleConfig config = configOpt.get();

			logger.info("got to shedule for institution=" + institutionName);
			// Cancel existing task
			ScheduledFuture<?> existingTask = scheduledTasks.get(institutionName);
			if (existingTask != null) {
				existingTask.cancel(false);
			}

			// Re-schedule with updated time
			scheduleBackup(config);
		} else {
			logger.info("⚠️ No schedule found to re-schedule for: " + institutionName);
		}
	}

}
