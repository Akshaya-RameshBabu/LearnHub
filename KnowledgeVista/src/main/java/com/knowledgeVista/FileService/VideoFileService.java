package com.knowledgeVista.FileService;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.channels.SeekableByteChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VideoFileService {

	@Value("${upload.video.directory}")
	private String videoUploadDirectory;

	private static final Logger logger = LoggerFactory.getLogger(VideoFileService.class);

	// Allowed video MIME types
	private static final Set<String> ALLOWED_VIDEO_TYPES = new HashSet<>(Arrays.asList("video/mp4", "video/mpeg",
			"video/webm", "video/quicktime", "video/x-msvideo", "video/x-flv", "video/x-matroska" // ✅ for MKV support
	));

	private static final Set<String> ALLOWED_VIDEO_EXTENSIONS = Set.of("mp4", "mpeg", "webm", "mov", "avi", "flv",
			"mkv");
	// Build regex pattern from allowed extensions
	private static final Pattern VIDEO_EXTENSION_PATTERN = Pattern
			.compile(".*\\.(" + String.join("|", ALLOWED_VIDEO_EXTENSIONS) + ")$", Pattern.CASE_INSENSITIVE);

	private static final Set<String> ALLOWED_FILE_TYPES = new HashSet<>(
			Arrays.asList("application/pdf", "application/vnd.ms-powerpoint",
					"application/vnd.openxmlformats-officedocument.presentationml.presentation"));

	// Maximum file size (100MB)
	private static final long MAX_FILE_SIZE = 100 * 1024 * 1024;

	public byte[] getFileAsBytes(String filename) throws IOException {
		Path path = Paths.get(videoUploadDirectory, filename);
		return Files.readAllBytes(path);
	}

//	public String saveVideoFile(MultipartFile videoFile) throws IOException, SecurityException {
//		// Validate file
//		validateVideoFile(videoFile);
//
//		// Ensure the upload directory exists
//		Path uploadPath = Paths.get(videoUploadDirectory);
//		if (!Files.exists(uploadPath)) {
//			Files.createDirectories(uploadPath);
//		}
//
//		// Generate a unique file name with timestamp and hash
//		String uniqueFileName = generateSecureFileName(videoFile);
//
//		// Define the file path where the video file will be stored
//		String filePath = uploadPath.resolve(uniqueFileName).toString();
//
//		// Save the file to the server
//		Files.copy(videoFile.getInputStream(), Paths.get(filePath), StandardCopyOption.REPLACE_EXISTING);
//
//		// Calculate and store file hash for integrity checks
//		String fileHash = calculateFileHash(videoFile);
//		storeFileHash(uniqueFileName, fileHash);
//
//		return uniqueFileName;
//	}

	public String saveVideoFile(MultipartFile videoFile, String institutionName) throws IOException {
		// Validate file
		validateVideoFile(videoFile);

		// Build directory: assets/{institutionName}/videos
		String sanitizedInstitution = sanitize(institutionName);
		Path uploadPath = Paths.get(videoUploadDirectory, sanitizedInstitution, "videos");

		// Ensure the directory exists
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}

		// Generate unique file name
		String uniqueFileName = generateSecureFileName(videoFile);
		Path fullFilePath = uploadPath.resolve(uniqueFileName);

		// Save the file
		Files.copy(videoFile.getInputStream(), fullFilePath, StandardCopyOption.REPLACE_EXISTING);

		// Hash and log
		String fileHash = calculateFileHash(videoFile);
		storeFileHash(uniqueFileName, fileHash);
		return Paths.get(sanitizedInstitution, "videos", uniqueFileName).toString().replace("\\", "/");

	}

//	public String saveDocumentFile(MultipartFile documentFile) throws IOException, SecurityException {
//		// Validate the document file
//		validateDocumentFile(documentFile);
//
//		// Ensure upload directory exists
//		Path uploadPath = Paths.get(videoUploadDirectory); // You can separate doc dir if needed
//		if (!Files.exists(uploadPath)) {
//			Files.createDirectories(uploadPath);
//		}
//
//		// Generate a secure file name
//		String uniqueFileName = generateSecureFileName(documentFile);
//		String filePath = uploadPath.resolve(uniqueFileName).toString();
//
//		// Save the file
//		Files.copy(documentFile.getInputStream(), Paths.get(filePath), StandardCopyOption.REPLACE_EXISTING);
//
//		// Hash and log
//		String fileHash = calculateFileHash(documentFile);
//		storeFileHash(uniqueFileName, fileHash);
//
//		return uniqueFileName;
//	}

	public String saveDocumentFile(MultipartFile documentFile, String institutionName) throws IOException {
		// Validate file
		validateDocumentFile(documentFile);

		// Build directory: assets/{institutionName}/documents
		String sanitizedInstitution = sanitize(institutionName);
		Path uploadPath = Paths.get(videoUploadDirectory, sanitizedInstitution, "documents");

		// Ensure the directory exists
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}

		// Generate unique file name
		String uniqueFileName = generateSecureFileName(documentFile);
		Path fullFilePath = uploadPath.resolve(uniqueFileName);

		// Save the file
		Files.copy(documentFile.getInputStream(), fullFilePath, StandardCopyOption.REPLACE_EXISTING);

		// Hash and log
		String fileHash = calculateFileHash(documentFile);
		storeFileHash(uniqueFileName, fileHash);

		// Return relative path
		return Paths.get(sanitizedInstitution, "documents", uniqueFileName).toString().replace("\\", "/");
	}

	private void validateDocumentFile(MultipartFile file) throws SecurityException {
		if (file == null || file.isEmpty()) {
			throw new SecurityException("File is empty");
		}

		// Check file size
		if (file.getSize() > MAX_FILE_SIZE) {
			throw new SecurityException("File size exceeds limit: " + MAX_FILE_SIZE);
		}

		// Check content type
		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED_FILE_TYPES.contains(contentType.toLowerCase())) {
			throw new SecurityException("Invalid file type. Allowed: " + ALLOWED_FILE_TYPES);
		}

		// Check extension
		String filename = file.getOriginalFilename();
		if (filename == null || !filename.toLowerCase().matches(".*\\.(pdf|ppt|pptx)$")) {
			throw new SecurityException("Invalid file extension. Allowed: pdf, ppt, pptx");
		}
	}

	private void validateVideoFile(MultipartFile file) throws SecurityException {
		if (file == null || file.isEmpty()) {
			throw new SecurityException("File is empty");
		}

		// Check file size
		if (file.getSize() > MAX_FILE_SIZE) {
			throw new SecurityException("File size exceeds maximum allowed size of " + MAX_FILE_SIZE + " bytes");
		}

		// Validate content type using Spring's content type detection
		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED_VIDEO_TYPES.contains(contentType.toLowerCase())) {
			throw new SecurityException(
					"Invalid file type. Detected: " + contentType + ". Allowed types: " + ALLOWED_VIDEO_TYPES);
		}

		// Validate file extension
		String originalFilename = file.getOriginalFilename();
		if (originalFilename == null || !VIDEO_EXTENSION_PATTERN.matcher(originalFilename).matches()) {
			throw new SecurityException("Invalid file extension. Allowed: mp4, mpeg, webm, mov, avi, flv");
		}

		// Additional validation: Check first few bytes of the file
		try (InputStream is = file.getInputStream()) {
			byte[] header = new byte[32]; // gives more room for deeper format signatures
			int bytesRead = is.read(header);
			if (bytesRead < 12) {
				throw new SecurityException("Invalid file format: file too small");
			}
			validateFileSignature(header);
		} catch (IOException e) {
			throw new SecurityException("Failed to validate file content: " + e.getMessage());
		}
	}

	private void validateFileSignature(byte[] header) throws SecurityException {
		// Scan first 16 bytes to check for known video signatures
		if (searchSignature(header, new byte[] { 0x66, 0x74, 0x79, 0x70 }) || // MP4/MOV/3GP
				searchSignature(header, new byte[] { 0x00, 0x00, 0x01, (byte) 0xBA }) || // MPEG-PS
				searchSignature(header, new byte[] { 0x00, 0x00, 0x01, (byte) 0xB3 }) || // MPEG-1/2
				searchSignature(header,
						new byte[] { 0x30, 0x26, (byte) 0xB2, 0x75, (byte) 0x8E, 0x66, (byte) 0xCF, 0x11 })
				|| // WMV/ASF
				searchSignature(header, new byte[] { 0x1A, 0x45, (byte) 0xDF, (byte) 0xA3 }) || // WebM/MKV
				searchSignature(header, "RIFF".getBytes()) || // AVI (check for "AVI " at offset 8 ideally)
				searchSignature(header, new byte[] { 0x46, 0x4C, 0x56, 0x01 }) // FLV ('FLV' + version)
		) {
			return;
		}
		throw new SecurityException("Invalid file signature: file does not match known video formats");
	}

	private boolean searchSignature(byte[] fileBytes, byte[] signature) {
		int maxOffset = Math.min(16, fileBytes.length - signature.length);
		for (int i = 0; i <= maxOffset; i++) {
			if (matchesAtOffset(fileBytes, signature, i)) {
				return true;
			}
		}
		return false;
	}

	private boolean matchesAtOffset(byte[] fileBytes, byte[] signature, int offset) {
		if (fileBytes.length < offset + signature.length)
			return false;
		for (int i = 0; i < signature.length; i++) {
			if (fileBytes[offset + i] != signature[i])
				return false;
		}
		return true;
	}

	private String generateSecureFileName(MultipartFile file) {
		String timestamp = String.valueOf(System.currentTimeMillis());
		String originalName = file.getOriginalFilename();
		String extension = originalName.substring(originalName.lastIndexOf("."));
		String randomPart = UUID.randomUUID().toString().substring(0, 8);

		return timestamp + "_" + randomPart + extension;
	}

	private String calculateFileHash(MultipartFile file) throws IOException {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(file.getBytes());
			return Base64.getEncoder().encodeToString(hash);
		} catch (NoSuchAlgorithmException e) {
			throw new IOException("Failed to calculate file hash", e);
		}
	}

	private void storeFileHash(String fileName, String hash) {
		// In production, store this in a database
		logger.info("File hash for {}: {}", fileName, hash);
	}
//
//	public boolean deleteVideoFile(String fileName) {
//		Path filePath = Paths.get(videoUploadDirectory, fileName);
//
//		try {
//			boolean deleted = Files.deleteIfExists(filePath);
//
//			if (deleted) {
//				logger.info("File deleted successfully: {}", fileName);
//			} else {
//				logger.warn("File does not exist or deletion failed: {}", fileName);
//			}
//
//			return deleted; // Return the result to the caller
//		} catch (IOException e) {
//			logger.error("Error occurred while deleting file: " + fileName, e);
//			return false; // Return false in case of an exception
//		}
//	}

	public long getFileSize(String fileName, String path) {
		Path filePath;

		if (path != null && !path.isBlank()) {
			// New format with full relative path (e.g., InstitutionA/videos/filename.mp4)
			filePath = Paths.get(videoUploadDirectory, path);
		} else {
			// Old format: only filename (flat folder structure)
			filePath = Paths.get(videoUploadDirectory, fileName);
		}

		try {
			if (Files.exists(filePath)) {
				// Fetch file size safely
				try (SeekableByteChannel channel = Files.newByteChannel(filePath)) {
					long fileSize = channel.size();
					logger.info("File size: {} bytes", fileSize);
					return fileSize;
				}
			} else {
				logger.info("File does not exist.");
				return 0;
			}
		} catch (IOException e) {
			logger.error("Error occurred while fetching file size for: {}", fileName, e);
			return 0;
		}
	}

	public boolean deleteFile(String fileName, String path) {
		Path filePath;

		if (path != null && !path.isBlank()) {
			// New format with full relative path (e.g., InstitutionA/videos/filename.mp4)
			filePath = Paths.get(videoUploadDirectory, path);
		} else {
			// Old format: only filename (flat folder structure)
			filePath = Paths.get(videoUploadDirectory, fileName);
		}

		try {
			boolean deleted = Files.deleteIfExists(filePath);

			if (deleted) {
				logger.info("File deleted successfully: {}", filePath);
			} else {
				logger.warn("File does not exist or deletion failed: {}", filePath);
			}

			return deleted;
		} catch (IOException e) {
			logger.error("Error occurred while deleting file: " + filePath, e);
			return false;
		}

	}

	public String updateVideoFile(String existingFileName, MultipartFile newVideoFile, String videoUploadDirectory)
			throws IOException {
		// Validate new file
		validateVideoFile(newVideoFile);

		// Generate a unique file name for the updated video
		String uniqueFileName = generateSecureFileName(newVideoFile);

		// Define the file paths for the existing and updated videos
		String existingFilePath = Paths.get(videoUploadDirectory, existingFileName).toString();
		String updatedFilePath = Paths.get(videoUploadDirectory, uniqueFileName).toString();
		String modifiedPath = updatedFilePath.replace("video\\", "");

		// Check if the existing file exists
		if (Files.exists(Path.of(existingFilePath))) {
			// Save the updated file to the specified location
			Files.copy(newVideoFile.getInputStream(), Path.of(updatedFilePath), StandardCopyOption.REPLACE_EXISTING);

			// Calculate and store new file hash
			String fileHash = calculateFileHash(newVideoFile);
			storeFileHash(uniqueFileName, fileHash);

			// Delete the existing file
			Files.deleteIfExists(Path.of(existingFilePath));

			return modifiedPath;
		} else {
			throw new FileNotFoundException("Existing file not found: " + existingFileName);
		}
	}

	public String saveAssignmentFile(MultipartFile videoFile, String institutionName, Long batchId, Long courseId,
			Long userId) throws IOException {
		// Validate file
		validateDocumentFile(videoFile);

		// Build the relative path structure
		String relativePath = Paths
				.get(sanitize(institutionName), "batch_" + batchId, "course_" + courseId, "student_" + userId)
				.toString();

		// Ensure the upload directory exists
		Path uploadPath = Paths.get(videoUploadDirectory, relativePath);
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}

		// Generate a unique file name
		String uniqueFileName = generateSecureFileName(videoFile);

		// Full path to save the file
		Path fullPath = uploadPath.resolve(uniqueFileName);
		Files.copy(videoFile.getInputStream(), fullPath, StandardCopyOption.REPLACE_EXISTING);

		// Calculate and store file hash
		String fileHash = calculateFileHash(videoFile);
		storeFileHash(uniqueFileName, fileHash);

		return Paths.get(relativePath, uniqueFileName).toString().replace("\\", "/");
	}

	private String sanitize(String input) {
		return input.replaceAll("[^a-zA-Z0-9-_\\.]", "_");
	}
}
