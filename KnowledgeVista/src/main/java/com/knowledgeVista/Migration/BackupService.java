package com.knowledgeVista.Migration;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.io.IOException;

@Service
public class BackupService {
	@Autowired
	private GoogleDriveOAuthService googleDriveOAuthService;
	@Value("${upload.licence.directory}")
	private String path;

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
	private int maxFilesToKeep = 2;
	private static final String folderName = "Learnhub_Backup";

	private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

//--------------------akshaya-----------------------------------
	public void ensureBackupDirectoryExists() {
		File backupDir = new File(backupPath);
		if (!backupDir.exists()) {
			boolean isCreated = backupDir.mkdirs();
			if (isCreated) {
				logger.info("Backup directory created: " + backupPath);
			} else {
				logger.error("Failed to create backup directory: " + backupPath);
			}
		} else {
			logger.info("Backup directory already exists: " + backupPath);
		}
	}

	public void backupDatabaseToFolder() throws Exception {
		ensureBackupDirectoryExists();

		ProcessBuilder pb = new ProcessBuilder("pg_dump", "-U", dbUsername, "-F", "p", "--inserts", dbName);
		pb.environment().put("PGPASSWORD", dbPassword);
		pb.redirectErrorStream(true);

		Process process = pb.start();

		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		try (InputStream is = process.getInputStream()) {
			byte[] buffer = new byte[4096];
			int len;
			while ((len = is.read(buffer)) != -1) {
				baos.write(buffer, 0, len);
			}
		}

		int exitCode = process.waitFor();
		if (exitCode != 0) {
			String errorOutput = baos.toString();
			throw new RuntimeException("❌ pg_dump failed: " + errorOutput);
		}

		byte[] sqlData = baos.toByteArray();
		String timestamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date());
		String fileName = "backup_" + timestamp + ".sql";

		Path filePath = Paths.get(backupPath, fileName);
		try (OutputStream out = Files.newOutputStream(filePath)) {
			out.write(sqlData);
		}
		logger.info("✅ Backup saved to: {}", filePath.toString());

		// Retain only the latest 7 backups
		File dir = new File(backupPath);
		File[] sqlFiles = dir.listFiles((d, name) -> name.endsWith(".sql"));

		if (sqlFiles != null && sqlFiles.length > maxFilesToKeep) {
			Arrays.sort(sqlFiles, Comparator.comparingLong(File::lastModified));
			int filesToDelete = sqlFiles.length - maxFilesToKeep;
			for (int i = 0; i < filesToDelete; i++) {
				if (sqlFiles[i].delete()) {
					logger.info("🗑️ Deleted old backup: {}", sqlFiles[i].getName());
				} else {
					logger.warn("⚠️ Failed to delete: {}", sqlFiles[i].getName());
				}
			}
		}
	}

	public ResponseEntity<byte[]> streamDatabaseBackup() {
		try {
			// Run pg_dump and capture its output (stdout)
			ProcessBuilder pb = new ProcessBuilder("pg_dump", "-U", dbUsername, "-F", "p", "--inserts", dbName);
			pb.environment().put("PGPASSWORD", dbPassword);
			pb.redirectErrorStream(true); // merge stdout + stderr

			Process process = pb.start();

			// Read stdout into memory
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			try (InputStream is = process.getInputStream()) {
				byte[] buffer = new byte[4096];
				int len;
				while ((len = is.read(buffer)) != -1) {
					baos.write(buffer, 0, len);
				}
			}

			int exitCode = process.waitFor();
			if (exitCode != 0) {
				String errorOutput = baos.toString();
				logger.error("❌ pg_dump failed: {}", errorOutput);
				return ResponseEntity.status(500).body(null);
			}

			byte[] sqlData = baos.toByteArray();
			String timestamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date());
			String fileName = "backup_" + timestamp + ".sql";

			return ResponseEntity.ok()
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
					.contentType(MediaType.APPLICATION_OCTET_STREAM).contentLength(sqlData.length).body(sqlData);

		} catch (Exception e) {
			logger.error("❌ Backup failed", e);
			return ResponseEntity.status(500).body(null);
		}
	}

	public ResponseEntity<?> backupDatabaseToDriveOnly(String institutionName) {
		try {
			ProcessBuilder pb = new ProcessBuilder("pg_dump", "-U", dbUsername, "-F", "p", "--inserts", dbName);
			pb.environment().put("PGPASSWORD", dbPassword);
			pb.redirectErrorStream(true);

			Process process = pb.start();

			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			try (InputStream is = process.getInputStream()) {
				byte[] buffer = new byte[4096];
				int len;
				while ((len = is.read(buffer)) != -1) {
					baos.write(buffer, 0, len);
				}
			}

			int exitCode = process.waitFor();
			if (exitCode != 0) {
				logger.error("❌ pg_dump failed with exit code {}", exitCode);
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
						.body("❌ Backup failed. pg_dump exited with code: " + exitCode);
			}

			String timestamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date());
			String fileName = "backup_" + timestamp + ".sql";

			InputStream inputStream = new ByteArrayInputStream(baos.toByteArray());

			String driveFileId = googleDriveOAuthService.uploadFileToDrive(inputStream, fileName, folderName,
					institutionName);

			return ResponseEntity.ok("✅ Backup sent to Google Drive (File ID: " + driveFileId + ")");

		} catch (IOException e) {
			logger.error("❌ I/O Error during backup", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("❌ I/O Error: " + e.getMessage());
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			logger.error("❌ Backup interrupted", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("❌ Interrupted: " + e.getMessage());
		} catch (IllegalStateException e) {
			logger.warn("❗ IllegalStateException: {}", e.getMessage());
			// 👇 HTTP 428 - Precondition Required
			return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(e.getMessage());
		} catch (Exception e) {
			logger.error("❌ Unexpected error during backup", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ Unexpected error: " + e.getMessage());
		}
	}

	public void performBackupAndUpload(String institutionName, int maxFilesToKeep) throws Exception {
		ProcessBuilder pb = new ProcessBuilder("pg_dump", "-U", dbUsername, "-F", "p", "--inserts", dbName);
		pb.environment().put("PGPASSWORD", dbPassword);
		pb.redirectErrorStream(true);
		Process process = pb.start();
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		try (InputStream is = process.getInputStream()) {
			byte[] buffer = new byte[4096];
			int len;
			while ((len = is.read(buffer)) != -1) {
				baos.write(buffer, 0, len);
			}
		}
		int exitCode = process.waitFor();
		if (exitCode != 0) {
			logger.error("❌ pg_dump failed with exit code {}", exitCode);
			String errorOutput = baos.toString();
			throw new RuntimeException("❌ pg_dump failed: " + errorOutput);
		}
		String timestamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date());
		String fileName = "backup_" + timestamp + ".sql";
		InputStream inputStream = new ByteArrayInputStream(baos.toByteArray());
		googleDriveOAuthService.uploadFileToDrivesheduled(inputStream, fileName, folderName, institutionName);
		// ✅ Delete old backups if necessary
		googleDriveOAuthService.deleteOldFilesInDriveFolder(folderName, maxFilesToKeep, institutionName);

	}

//--------------------akshaya-----------------------------------

}