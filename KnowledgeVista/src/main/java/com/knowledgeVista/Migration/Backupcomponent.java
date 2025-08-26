package com.knowledgeVista.Migration;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.knowledgeVista.Migration.model.BackupScheduleConfig;
import com.knowledgeVista.Migration.repo.BackupSheduleConfigRepo;
import com.knowledgeVista.Migration.sheduler.BackupSchedulerService;
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
	@Autowired
	private BackupSchedulerService backupSchedulerService;

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
			BackupScheduleConfig scheduleToSave;
			String result = "Updated";

			if (existingConfigOpt.isPresent()) {
				scheduleToSave = existingConfigOpt.get();
				scheduleToSave.setScheduleType(config.getScheduleType());
				scheduleToSave.setDayOfWeek(config.getDayOfWeek());
				scheduleToSave.setDayOfMonth(config.getDayOfMonth());
				scheduleToSave.setMaxBackupsToKeep(config.getMaxBackupsToKeep());
				scheduleToSave.setBackupTime(config.getBackupTime());
			} else {
				config.setInstitutionName(institutionName);
				scheduleToSave = config;
				result = "Saved";
			}

			configRepo.save(scheduleToSave);
			backupSchedulerService.rescheduleBackupForInstitution(institutionName);
			return ResponseEntity.ok(result);

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ Error while saving/updating the schedule.");
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

}
