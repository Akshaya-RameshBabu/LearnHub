package com.knowledgeVista.Migration;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class Restoreservice {
	@Value("${spring.datasource.username}")
	private String dbUsername;

	@Value("${spring.datasource.url}")
	private String dbUrl;
	@Value("${spring.datasource.password}")
	private String dbPassword;
	@Value("${database.name}")
	private String dbName;
	@Value("${upload.backup:data/backup}")
	private String backupDir;

	@Autowired
	private JwtUtil jwtUtil;
	private static final Logger logger = LoggerFactory.getLogger(Restoreservice.class);

	public ResponseEntity<List<String>> listBackupFiles(String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			boolean isAllowed = "SYSADMIN".equals(role) || "ADMIN".equals(role);
			if (!isAllowed) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
			}

			File folder = new File(backupDir);
			if (!folder.exists() || !folder.isDirectory()) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
			}

			// Filter only .zip files and return names
			String[] files = folder.list((dir, name) -> name.toLowerCase().endsWith(".zip"));
			List<String> backupFiles = files != null ? Arrays.asList(files) : Collections.emptyList();

			// Optional: sort by name (latest timestamp first if using timestamp naming)
			backupFiles.sort(Comparator.reverseOrder());

			return ResponseEntity.ok(backupFiles);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(Collections.singletonList("Error reading backup files: " + e.getMessage()));
		}
	}

	public ResponseEntity<?> restoreDatabase(String fileName, String token) {

		String role = jwtUtil.getRoleFromToken(token);
		if (!("SYSADMIN".equals(role) || "ADMIN".equals(role))) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("❌ Unauthorized");
		}

		try {
			Path backupFilePath = Paths.get(backupDir, fileName);
			if (!Files.exists(backupFilePath) || !Files.isRegularFile(backupFilePath)) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("❌ Backup file not found: " + fileName);
			}

			File sqlFile = new File("backup/sql_restore.sql"); // Known path for SQL
			File assetsDir = new File("assets");

			// Delete old assets if exists
			if (assetsDir.exists()) {
				FileUtils.deleteDirectory(assetsDir);
			}

			try (ZipInputStream zis = new ZipInputStream(new FileInputStream(backupFilePath.toFile()))) {
				ZipEntry entry;
				while ((entry = zis.getNextEntry()) != null) {
					File outFile;
					if (entry.getName().endsWith(".sql")) {
						outFile = sqlFile;
					} else {
						outFile = new File(entry.getName()); // relative path
						if (entry.getName().startsWith("assets/")) {
							outFile = new File(assetsDir.getParentFile(), entry.getName()); // project root + assets
						}
					}

					if (entry.isDirectory()) {
						outFile.mkdirs();
					} else {
						if (!outFile.getParentFile().exists()) {
							outFile.getParentFile().mkdirs();
						}
						try (FileOutputStream fos = new FileOutputStream(outFile)) {
							byte[] buffer = new byte[1024];
							int len;
							while ((len = zis.read(buffer)) > 0) {
								fos.write(buffer, 0, len);
							}
						}
					}
				}
			}

			// Execute SQL
			return executeSqlFile(sqlFile);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ Error during restore: " + e.getMessage());
		}
	}

	private ResponseEntity<?> executeSqlFile(File sqlFile) {
		try {
			ProcessBuilder pb = new ProcessBuilder("pg_restore", "-U", dbUsername, "-d", dbName, "--clean",
					"--if-exists", // avoids errors if objects don't exist
					"--no-owner", // avoids ownership issues
					"--no-acl", // avoids privileges issues
					sqlFile.getAbsolutePath());
			pb.environment().put("PGPASSWORD", dbPassword);
			pb.redirectErrorStream(true);
			pb.redirectOutput(ProcessBuilder.Redirect.INHERIT);

			Process process = pb.start();
			int exitCode = process.waitFor();

			if (exitCode == 0) {
				return ResponseEntity.ok("✅ Restore completed successfully ");
			} else {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("❌ Restore failed. Exit code: " + exitCode);
			}
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ SQL execution error: " + e.getMessage());
		}
	}

	public ResponseEntity<?> restoreDatabase(MultipartFile backupZipFile, String token) {
		File tempDir = null;
		try {
			String role = jwtUtil.getRoleFromToken(token);
			boolean isAllowed = "SYSADMIN".equals(role) || "ADMIN".equals(role);
			if (!isAllowed) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
			}

			logger.info("Restore Starts --------------------------------------");

			if (backupZipFile.isEmpty()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST)
						.body("❌ Backup file is empty! Please upload the correct backup file.");
			}

			// Create a temporary directory to extract the zip file
			tempDir = Files.createTempDirectory("db-restore-").toFile();
			File zipFile = new File(tempDir, backupZipFile.getOriginalFilename());
			backupZipFile.transferTo(zipFile);

			File sqlFile = null;
			File extractedAssetsDir = null;

			// Extract SQL + assets folder
			try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFile))) {
				ZipEntry entry;
				while ((entry = zis.getNextEntry()) != null) {
					File newFile = new File(tempDir, entry.getName());

					if (entry.isDirectory()) {
						newFile.mkdirs();
					} else {
						// Ensure parent dirs exist
						if (!newFile.getParentFile().exists()) {
							newFile.getParentFile().mkdirs();
						}

						try (FileOutputStream fos = new FileOutputStream(newFile)) {
							byte[] buffer = new byte[1024];
							int len;
							while ((len = zis.read(buffer)) > 0) {
								fos.write(buffer, 0, len);
							}
						}
					}

					// Detect the extracted SQL file
					if (entry.getName().endsWith(".sql") && !entry.isDirectory()) {
						sqlFile = newFile;
					}

					// Detect the assets folder
					if (entry.getName().startsWith("assets/")) {
						extractedAssetsDir = new File(tempDir, "assets");
					}
				}
			}

			if (sqlFile == null || !sqlFile.exists()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST)
						.body("❌ Restore failed: No .sql file found in the uploaded zip archive.");
			}

			// ✅ Replace existing assets directory with the one from backup
			if (extractedAssetsDir != null && extractedAssetsDir.exists()) {
				File targetAssetsDir = new File("assets"); // keep it at project root

				try {
					if (targetAssetsDir.exists()) {
						FileUtils.deleteDirectory(targetAssetsDir);
						logger.info("Old 'assets' directory deleted.");
					}

					FileUtils.moveDirectory(extractedAssetsDir, targetAssetsDir);
					logger.info("✅ Assets directory restored at: " + targetAssetsDir.getAbsolutePath());
				} catch (IOException e) {
					logger.error("❌ Error restoring assets directory: " + e.getMessage(), e);
				}
			}
			return executeSqlFile(sqlFile);

		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("❌ I/O Error during restore: " + e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body("❌ Unexpected error during restore: " + e.getMessage());
		} finally {
			// Clean up temporary directory
			if (tempDir != null && tempDir.exists()) {
				try {
					FileUtils.deleteDirectory(tempDir);
				} catch (IOException e) {
					logger.warn("Error deleting temporary directory: " + e.getMessage());
				}
			}
		}
	}

}
