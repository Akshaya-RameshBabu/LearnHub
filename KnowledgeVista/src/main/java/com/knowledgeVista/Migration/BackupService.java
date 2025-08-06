package com.knowledgeVista.Migration;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class BackupService {

	@Autowired
	private GoogleDriveOAuthService googleDriveOAuthService;

	@Value("${upload.licence.directory}")
	private String path;

	@Value("${upload.video.directory}")
	private String assetsDirPath;

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

	private static final int MAX_DB_BACKUPS = 5;
	private static final int MAX_MEDIA_BACKUPS = 2;
	private static final String FOLDER_NAME = "Learnhub_Backup";

	private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

	private void ensureBackupDirectoryExists() {
		File backupDir = new File(backupPath);
		if (!backupDir.exists() && backupDir.mkdirs()) {
			logger.info("Backup directory created: {}", backupPath);
		}
	}

	private byte[] createDatabaseBackup() throws Exception {
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
			throw new RuntimeException("❌ pg_dump failed: " + baos.toString());
		}

		return baos.toByteArray();
	}

	public ResponseEntity<byte[]> streamDatabaseBackup() {
		try {
			byte[] sqlData = createDatabaseBackup();
			String fileName = "backup_" + timestamp() + ".sql";

			return ResponseEntity.ok()
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
					.contentType(MediaType.APPLICATION_OCTET_STREAM).contentLength(sqlData.length).body(sqlData);

		} catch (Exception e) {
			logger.error("❌ Backup failed", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	public ResponseEntity<?> backupDatabaseToDriveOnly(String institutionName) {
		try {
			byte[] sqlData = createDatabaseBackup();
			String timestamp = timestamp();
			String zipFileName = "full_backup_" + timestamp + ".zip";

			ByteArrayOutputStream zipBaos = new ByteArrayOutputStream();
			try (ZipOutputStream zos = new ZipOutputStream(zipBaos)) {
				zos.putNextEntry(new ZipEntry("backup_" + timestamp + ".sql"));
				zos.write(sqlData);
				zos.closeEntry();

				// Zip the assets directory
				zipDirectory(new File(assetsDirPath), "assets", zos);
			}

			String driveFileId;
			try (InputStream zipInputStream = new ByteArrayInputStream(zipBaos.toByteArray())) {
				driveFileId = googleDriveOAuthService.uploadFileToDrive(zipInputStream, zipFileName, FOLDER_NAME, // or
																													// your
																													// folderName
						institutionName);
			}

			return ResponseEntity.ok("✅ Backup sent to Google Drive (File ID: " + driveFileId + ")");

		} catch (Exception e) {
			logger.error("❌ Error during Drive backup", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("❌ Error: " + e.getMessage());
		}
	}

	public void performBackupAndUpload(String institutionName, int maxFilesToKeep) throws Exception {
		byte[] sqlData = createDatabaseBackup();
		String timestamp = timestamp();
		String zipFileName = "full_backup_" + timestamp + ".zip";

		ByteArrayOutputStream zipBaos = new ByteArrayOutputStream();
		try (ZipOutputStream zos = new ZipOutputStream(zipBaos)) {
			zos.putNextEntry(new ZipEntry("backup_" + timestamp + ".sql"));
			zos.write(sqlData);
			zos.closeEntry();

			zipDirectory(new File(assetsDirPath), "assets", zos);
		}

		try (InputStream zipInputStream = new ByteArrayInputStream(zipBaos.toByteArray())) {
			googleDriveOAuthService.uploadFileToDrivesheduled(zipInputStream, zipFileName, FOLDER_NAME,
					institutionName);
		}

		googleDriveOAuthService.deleteOldFilesInDriveFolder(FOLDER_NAME, maxFilesToKeep, institutionName);
	}

	public void backupDatabaseToFolder() throws Exception {
		ensureBackupDirectoryExists();

		byte[] sqlData = createDatabaseBackup();
		String timestamp = timestamp();

		Path sqlFilePath = Paths.get(backupPath, "backup_" + timestamp + ".sql");
		Files.write(sqlFilePath, sqlData);

		Path zipFilePath = Paths.get(backupPath, "assets_backup_" + timestamp + ".zip");
		zipDirectory(Paths.get(assetsDirPath), zipFilePath);

		cleanupOldBackups(backupPath, ".sql", MAX_DB_BACKUPS);
		cleanupOldBackups(backupPath, ".zip", MAX_MEDIA_BACKUPS);
	}

	private void zipDirectory(File folder, String parentFolder, ZipOutputStream zos) throws IOException {
		File[] files = folder.listFiles();
		if (files != null) {
			for (File file : files) {
				String entryName = parentFolder + "/" + file.getName();
				if (file.isDirectory()) {
					zipDirectory(file, entryName, zos);
				} else {
					try (FileInputStream fis = new FileInputStream(file)) {
						zos.putNextEntry(new ZipEntry(entryName));
						byte[] buffer = new byte[4096];
						int len;
						while ((len = fis.read(buffer)) > 0) {
							zos.write(buffer, 0, len);
						}
						zos.closeEntry();
					}
				}
			}
		}
	}

	private void zipDirectory(Path sourceDir, Path zipFilePath) throws IOException {
		try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipFilePath))) {
			Files.walk(sourceDir).filter(path -> !Files.isDirectory(path)).forEach(path -> {
				try {
					ZipEntry zipEntry = new ZipEntry(sourceDir.relativize(path).toString().replace("\\", "/"));
					zos.putNextEntry(zipEntry);
					Files.copy(path, zos);
					zos.closeEntry();
				} catch (IOException e) {
					throw new UncheckedIOException("❌ Failed to zip: " + path, e);
				}
			});
		}
	}

	private void cleanupOldBackups(String directoryPath, String extension, int maxFilesToKeep) {
		File dir = new File(directoryPath);
		File[] files = dir.listFiles((d, name) -> name.endsWith(extension));

		if (files != null && files.length > maxFilesToKeep) {
			Arrays.sort(files, Comparator.comparingLong(File::lastModified));
			for (int i = 0; i < files.length - maxFilesToKeep; i++) {
				if (!files[i].delete()) {
					logger.warn("⚠️ Failed to delete: {}", files[i].getName());
				}
			}
		}
	}

	private String timestamp() {
		return new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date());
	}
}
