package com.knowledgeVista.Migration;

import java.io.File;
import java.io.IOException;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.knowledgeVista.Migration.model.BackupScheduleConfig;
import com.knowledgeVista.Migration.repo.BackupSheduleConfigRepo;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Component
public class Backupcomponent {

	private static final Logger logger = LoggerFactory.getLogger(Backupcomponent.class);

	@Autowired
	private BackupService backupService;
	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	private BackupSheduleConfigRepo configRepo;

	@Value("${upload.backup}")
	private String backupPath;

	@Value("${spring.datasource.username}")
	private String dbUsername;

	@Value("${spring.datasource.url}")
	private String dbUrl;
	@Value("${spring.datasource.password}")
	private String dbPassword;
	@Value("${database.name}")
	private String dbName;

	public ResponseEntity<?> DownloadBackup(String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role) || "SYSADMIN".equals(role)) {
				return backupService.streamDatabaseBackup();
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you are not Authorized to access This..");
			}
		} catch (Exception e) {
			logger.error(e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
	}

	public ResponseEntity<?> BackupAndSaveToDrive(String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String institutionName = jwtUtil.getInstitutionFromToken(token);
			if ("ADMIN".equals(role) || "SYSADMIN".equals(role)) {
				System.out.println("in backup component");
				return backupService.backupDatabaseToDriveOnly(institutionName);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you are not Authorized to access This..");
			}
		} catch (Exception e) {
			logger.error(e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
	}

	// save or edit shedule------------------------

	public ResponseEntity<?> saveOrUpdatebackupSchedule(BackupScheduleConfig config, String token) {
		try {

			String institutionName = jwtUtil.getInstitutionFromToken(token);
			String role = jwtUtil.getRoleFromToken(token);
			if (!"ADMIN".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body("❌ Only ADMINs can configure backup schedules.");
			}

			Optional<BackupScheduleConfig> existingConfigOpt = configRepo.findByInstitutionName(institutionName);
			String res = "Updated";
			BackupScheduleConfig scheduleToSave;
			if (existingConfigOpt.isPresent()) {
				// Update existing
				scheduleToSave = existingConfigOpt.get();
				scheduleToSave.setScheduleType(config.getScheduleType());
				scheduleToSave.setDayOfWeek(config.getDayOfWeek());
				scheduleToSave.setDayOfMonth(config.getDayOfMonth());
				scheduleToSave.setMaxBackupsToKeep(config.getMaxBackupsToKeep());
			} else {
				// Create new
				config.setInstitutionName(institutionName);
				scheduleToSave = config;
				res = "Saved";
			}

			configRepo.save(scheduleToSave);
			return ResponseEntity.ok(res);

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ Internal server error occurred while saving/updating the schedule.");
		}
	}

	public ResponseEntity<?> getBackupShedule(String token) {
		try {

			String institutionName = jwtUtil.getInstitutionFromToken(token);
			String role = jwtUtil.getRoleFromToken(token);
			if (!"ADMIN".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body("❌ Only ADMINs can configure backup schedules.");
			}
			Optional<BackupScheduleConfig> existingConfigOpt = configRepo.findByInstitutionName(institutionName);
			if (existingConfigOpt.isPresent()) {
				BackupScheduleConfig conf = existingConfigOpt.get();
				return ResponseEntity.ok(conf);
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
			}
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ Internal server error occurred while saving/updating the schedule.");
		}
	}

	@PostMapping("/restore-database")
	public String restoreDatabase(@RequestParam String backupFilePath) {
		try {
			File file = new File(backupFilePath);
			if (!file.exists() || !file.isFile()) {
				return "❌ Restore failed: Backup file not found at " + backupFilePath;
			}

			// Prepare psql restore command
			ProcessBuilder pb = new ProcessBuilder("psql", "-U", dbUsername, "-d", extractDbName(dbUrl), "-f",
					backupFilePath);

			pb.environment().put("PGPASSWORD", dbPassword);
			pb.redirectErrorStream(true);
			pb.redirectOutput(ProcessBuilder.Redirect.INHERIT);

			Process process = pb.start();
			int exitCode = process.waitFor();

			if (exitCode == 0) {
				return "✅ Restore completed successfully from: " + backupFilePath;
			} else {
				return "❌ Restore failed. Exit code: " + exitCode
						+ ". Please ensure the file is valid and psql is installed.";
			}

		} catch (IOException e) {
			return "❌ I/O Error during restore: " + e.getMessage();
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			return "❌ Restore interrupted: " + e.getMessage();
		} catch (Exception e) {
			return "❌ Unexpected error during restore: " + e.getMessage();
		}
	}

	private String extractDbName(String url) {
		// Example: jdbc:postgresql://localhost:5432/yourdbname
		int lastSlash = url.lastIndexOf("/");
		if (lastSlash == -1)
			return url;
		String dbName = url.substring(lastSlash + 1);
		int paramIdx = dbName.indexOf("?");
		if (paramIdx != -1)
			dbName = dbName.substring(0, paramIdx);
		return dbName;
	}

}
