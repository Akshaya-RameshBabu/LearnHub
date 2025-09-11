package com.knowledgeVista.Migration;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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

	private static final int MAX_BACKUPS = 7;
	private static final String FOLDER_NAME = "Learnhub_Backup";

	private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

	private void ensureBackupDirectoryExists() {
		File backupDir = new File(backupPath);
		if (!backupDir.exists() && backupDir.mkdirs()) {
			logger.info("Backup directory created: {}", backupPath);
		}
	}

	private byte[] createDatabaseBackup() throws Exception {
		String url = dbUrl.replace("jdbc:postgresql://", "postgresql://");
		URI uri = new URI(url);
		String dbHost = uri.getHost(); // "localhost"
		int dbPort = (uri.getPort() == -1) ? 5432 : uri.getPort(); // 5432 if not specified
		String dbName = uri.getPath().substring(1); // remove leading "/"

		ProcessBuilder pb = new ProcessBuilder("pg_dump", "-h", dbHost, "-p", String.valueOf(dbPort), "-U", dbUsername,
				"-F", "c", // custom format
				"--no-owner", "--no-acl", dbName);

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

	public void writeDatabaseBackupToStream(OutputStream outputStream) throws IOException {
		try (ZipOutputStream zos = new ZipOutputStream(outputStream)) {
			// 1. Stream the database backup directly into the ZIP.
			logger.info("Starting database backup and adding to zip...");
			zos.putNextEntry(new ZipEntry("backup_" + timestamp() + ".sql"));
			try (InputStream dbBackupStream = createDatabaseBackupStream()) {
				dbBackupStream.transferTo(zos);
			}
			zos.closeEntry();
			logger.info("Database dump added successfully.");

			// 2. Stream the assets directory and its contents into the ZIP.
			Path assetsPath = Paths.get(assetsDirPath);
			if (Files.exists(assetsPath) && Files.isDirectory(assetsPath)) {
				logger.info("Adding assets folder to zip...");
				zipDirectoryStream(assetsPath, "assets", zos);
				logger.info("Assets folder added successfully.");
			} else {
				logger.warn("Assets directory not found at: {}", assetsDirPath);
			}

		} catch (Exception e) {
			logger.error("Error while streaming ZIP", e);
			// Rethrow as IOException to be handled by the controller's try-catch block.
			throw new IOException("Error during backup streaming", e);
		}
	}

	private InputStream createDatabaseBackupStream() throws IOException {
		try {
			logger.info("Starting pg_dump process for database backup...");
			// Re-use standard URI methods for better parsing.
			URI uri = new URI(dbUrl.replaceFirst("jdbc:", "")); // Remove "jdbc:" to allow URI parsing.
			String dbHost = uri.getHost();
			int dbPort = uri.getPort() == -1 ? 5432 : uri.getPort();

			ProcessBuilder pb = new ProcessBuilder("pg_dump", "-h", dbHost, "-p", String.valueOf(dbPort), "-U",
					dbUsername, "-F", "c", // custom format
					"--no-owner", "--no-acl", dbName);

			pb.environment().put("PGPASSWORD", dbPassword);
			Process process = pb.start();

			// Consume stderr to prevent the process from hanging and log warnings.
			new Thread(() -> {
				try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
					String line;
					while ((line = reader.readLine()) != null) {
						logger.warn("pg_dump STDERR: {}", line);
					}
				} catch (IOException ignored) {
				}
			}).start();

			return process.getInputStream();
		} catch (URISyntaxException e) {
			logger.error("Invalid DB URL: {}", dbUrl, e);
			throw new IOException("Invalid DB URL", e);
		}
	}

	private void zipDirectoryStream(Path sourceDir, String parentPathInZip, ZipOutputStream zos) throws IOException {
		try (Stream<Path> pathStream = Files.walk(sourceDir)) {
			pathStream.filter(path -> !Files.isDirectory(path)) // Exclude directories themselves, they'll be created
																// implicitly
					.forEach(path -> {
						try {
							// Create the entry name relative to the source directory, including the parent
							// folder in the zip.
							String entryName = parentPathInZip + "/"
									+ sourceDir.relativize(path).toString().replace("\\", "/");

							logger.info("Adding file to zip: {}", entryName);
							zos.putNextEntry(new ZipEntry(entryName));
							Files.copy(path, zos); // Use Files.copy for a robust stream operation
							zos.closeEntry();
						} catch (IOException e) {
							// Wrap IOException in an UncheckedIOException to use with forEach
							throw new UncheckedIOException(e);
						}
					});
		} catch (UncheckedIOException e) {
			throw e.getCause(); // Unwrap the original IOException
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
		logger.info("Dumping Databse");
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
			logger.info("sending zip to drive");
			googleDriveOAuthService.uploadFileToDrivesheduled(zipInputStream, zipFileName, FOLDER_NAME,
					institutionName);
		}
		logger.info("deleting old files");
		googleDriveOAuthService.deleteOldFilesInDriveFolder(FOLDER_NAME, maxFilesToKeep, institutionName);
	}

	public void backupDatabaseToFolder() throws Exception {
		ensureBackupDirectoryExists();

		// 1️⃣ Create the database backup as byte[]
		byte[] sqlData = createDatabaseBackup();
		String timestamp = timestamp();

		// 2️⃣ Prepare the zip file
		Path zipFilePath = Paths.get(backupPath, "backup_" + timestamp + ".zip");

		try (FileOutputStream fos = new FileOutputStream(zipFilePath.toFile());
				ZipOutputStream zos = new ZipOutputStream(fos)) {

			// 3️⃣ Add the .sql file to the ZIP
			ZipEntry sqlEntry = new ZipEntry("backup_" + timestamp + ".sql");
			zos.putNextEntry(sqlEntry);
			zos.write(sqlData);
			zos.closeEntry();

			// 4️⃣ Add the assets folder to the ZIP
			Path assetsPath = Paths.get(assetsDirPath);
			Files.walk(assetsPath).filter(Files::isRegularFile).forEach(path -> {
				try {
					String entryName = assetsPath.relativize(path).toString();
					ZipEntry assetEntry = new ZipEntry("assets/" + entryName);
					zos.putNextEntry(assetEntry);
					Files.copy(path, zos);
					zos.closeEntry();
				} catch (IOException e) {
					throw new RuntimeException("Error adding file to zip: " + path, e);
				}
			});
		}

		// 5️⃣ Clean up old backups if needed
		cleanupOldBackups(backupPath, ".zip", MAX_BACKUPS); // now zip contains both SQL + assets
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
