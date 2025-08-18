package com.knowledgeVista.Migration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.google.api.client.auth.oauth2.AuthorizationCodeRequestUrl;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.media.MediaHttpUploader;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.knowledgeVista.Email.EmailService;
import com.knowledgeVista.Migration.model.OAuthCredential;
import com.knowledgeVista.Migration.repo.OAuthCredentialRepo;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.config.EncryptionUtil;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class GoogleDriveOAuthService {

	private static final String APPLICATION_NAME = "Learnhub";
	private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
	private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE_FILE);
	private static final Logger logger = LoggerFactory.getLogger(GoogleDriveOAuthService.class);
	@Autowired
	private MuserRepositories muserRepo;
	@Autowired
	private EmailService emailService;
	@Autowired
	private OAuthCredentialsService2 oAuthCredentialService2;
	@Autowired
	private OAuthCredentialRepo OAuthCredentialRepo;
	@Autowired
	private EncryptionUtil encryptionUtil;

	public Credential exchangeCodeAndSaveToken(String code, String institutionName, HttpServletRequest request)
			throws Exception {
		// --- Troubleshooting Tip ---
		// The "connection timed out" issue most likely occurs during the network call
		// to Google's token endpoint. This is usually due to a network or firewall
		// configuration issue on the server where this code is running.
		//
		// The following code adds a try-catch block to provide more detailed error
		// information.
		// Check your application logs for the full stack trace when the timeout occurs.

		// Initialize HTTP transport and JSON factory
		var httpTransport = GoogleNetHttpTransport.newTrustedTransport();

		Optional<OAuthCredential> opcredential = OAuthCredentialRepo.findByInstitutionName(institutionName);
		if (opcredential.isEmpty()) {
			System.err.println("OAuthCredential not found for institution: " + institutionName);
			return null;
		}
		OAuthCredential credential = opcredential.get();

		GoogleClientSecrets.Details details = new GoogleClientSecrets.Details();
		details.setClientId(encryptionUtil.decrypt(credential.getClientId()));
		details.setClientSecret(encryptionUtil.decrypt(credential.getClientSecret()));
		GoogleClientSecrets clientSecrets = new GoogleClientSecrets().setInstalled(details);

		// Set up the Authorization Code Flow
		GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(httpTransport, JSON_FACTORY,
				clientSecrets, SCOPES).setAccessType("offline").build();

		String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

		String redirectUri = baseUrl + "/driveoauth/callback";

		try {
			// --- This is the critical network call that is likely timing out ---
			TokenResponse tokenResponse = flow.newTokenRequest(code).setRedirectUri(redirectUri).execute();
			System.out.println("Successfully received token response from Google.");

			Credential finalCredential = flow.createAndStoreCredential(tokenResponse, "user");

			String refreshToken = tokenResponse.getRefreshToken();
			if (refreshToken != null) {
				credential.setRefreshToken(encryptionUtil.encrypt(refreshToken));
				credential.setUpdatedAt(LocalDateTime.now());
				OAuthCredentialRepo.save(credential);
				System.out.println("Refreshed token saved to repository.");
			} else {
				System.out.println("No refresh token received in the response.");
			}

			return finalCredential;

		} catch (java.net.SocketTimeoutException e) {
			// Handle specific timeout exception
			System.err.println("Connection timed out while exchanging code. This is likely a network issue.");
			System.err.println("Exception details: " + e.getMessage());
			e.printStackTrace();
			return null;
		} catch (com.google.api.client.http.HttpResponseException e) {
			// Handle API-specific errors, which could sometimes be misleading
			System.err.println("Google API returned an error response. Status code: " + e.getStatusCode());
			System.err.println("Error details: " + e.getContent());
			e.printStackTrace();
			return null;
		} catch (Exception e) {
			// Catch any other unexpected exceptions
			System.err.println("An unexpected error occurred during code exchange.");
			System.err.println("Exception details: " + e.getMessage());
			e.printStackTrace();
			return null;
		}
	}

	public String generateAuthUrl(OAuthCredential credential, HttpServletRequest request) throws Exception {
		var httpTransport = GoogleNetHttpTransport.newTrustedTransport();
		GoogleClientSecrets.Details details = new GoogleClientSecrets.Details();
		details.setClientId(encryptionUtil.decrypt(credential.getClientId()));
		details.setClientSecret(encryptionUtil.decrypt(credential.getClientSecret()));
		GoogleClientSecrets clientSecrets = new GoogleClientSecrets().setInstalled(details);
		GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(httpTransport, JSON_FACTORY,
				clientSecrets, SCOPES).setAccessType("offline").setApprovalPrompt("force").build();
		String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

		String redirectUri = baseUrl + "/driveoauth/callback";
		AuthorizationCodeRequestUrl url = flow.newAuthorizationUrl().setRedirectUri(redirectUri)
				.setState(credential.getInstitutionName());
		return url.build();
	}

	public Credential authorizeUserAndGetRefreshToken(String institutionName) throws Exception {
		var httpTransport = GoogleNetHttpTransport.newTrustedTransport();
		OAuthCredential credentials = oAuthCredentialService2.getCredential(institutionName);
		if (credentials == null) {
			throw new RuntimeException(
					"❌ No credentials found for your institution. Please go to 'Drive Backup Settings' and add your Google Cloud OAuth credentials.");
		}

		String clientId = credentials.getClientId();
		String clientSecret = credentials.getClientSecret();
		String RefreshToken = credentials.getRefreshToken();

		GoogleClientSecrets.Details details = new GoogleClientSecrets.Details();
		details.setClientId(clientId);
		details.setClientSecret(clientSecret);
		GoogleClientSecrets clientSecrets = new GoogleClientSecrets().setInstalled(details);

		if (RefreshToken != null && !RefreshToken.isEmpty()) {

			return new GoogleCredential.Builder().setTransport(httpTransport).setJsonFactory(JSON_FACTORY)
					.setClientSecrets(clientId, clientSecret).build().setRefreshToken(RefreshToken);
		} else {
			throw new RuntimeException(
					"❌ Refresh Token not found for your institution. Please authorize your Google Drive access in 'Drive Backup Settings'.");
		}

	}

	public String uploadFileToDrive(InputStream inputStream, String fileName, String folderName, String institutionName)
			throws IOException, GeneralSecurityException, Exception {

		Credential credential = authorizeUserAndGetRefreshToken(institutionName);

		Drive driveService = new Drive.Builder(GoogleNetHttpTransport.newTrustedTransport(), JSON_FACTORY, credential)
				.setApplicationName(APPLICATION_NAME).build();

		String folderId = getOrCreateFolderId(driveService, folderName);

		File fileMetadata = new File();
		fileMetadata.setName(fileName);
		fileMetadata.setParents(Collections.singletonList(folderId));

		byte[] zipBytes = inputStream.readAllBytes(); // Required for getting content length
		InputStreamContent mediaContent = new InputStreamContent("application/zip", new ByteArrayInputStream(zipBytes));
		mediaContent.setLength(zipBytes.length); // Required for resumable

		Drive.Files.Create createRequest = driveService.files().create(fileMetadata, mediaContent)
				.setFields("id, name");

		MediaHttpUploader uploader = createRequest.getMediaHttpUploader();
		uploader.setDirectUploadEnabled(false); // Use resumable
		uploader.setChunkSize(5 * 1024 * 1024); // ✅ 5 MB chunk size

		uploader.setProgressListener(u -> {
			switch (u.getUploadState()) {
			case INITIATION_STARTED:
				logger.info("⏳ Upload initiation started");
				break;
			case INITIATION_COMPLETE:
				logger.info("✅ Upload initiation complete");
				break;
			case MEDIA_IN_PROGRESS:
				logger.info("📤 Uploaded {} bytes", u.getNumBytesUploaded());
				break;
			case MEDIA_COMPLETE:
				logger.info("🎉 Upload complete");
				break;
			case NOT_STARTED:
				logger.info("🚫 Upload not started");
				break;
			}
		});

		File uploadedFile = createRequest.execute();
		return uploadedFile.getId();
	}

	private String getOrCreateFolderId(Drive driveService, String folderName) throws IOException {
		String query = "mimeType='application/vnd.google-apps.folder' and name='" + folderName + "' and trashed=false";
		List<File> folders = driveService.files().list().setQ(query).setFields("files(id, name)").execute().getFiles();

		if (!folders.isEmpty()) {
			return folders.get(0).getId();
		} else {
			File folderMetadata = new File();
			folderMetadata.setName(folderName);
			folderMetadata.setMimeType("application/vnd.google-apps.folder");

			File createdFolder = driveService.files().create(folderMetadata).setFields("id").execute();
			return createdFolder.getId();
		}
	}

	/// For Sheduled Drive Backup -----------------------------------------

	public Credential authorizeUserAndGetRefreshTokensheduled(String institutionName) throws Exception {
		var httpTransport = GoogleNetHttpTransport.newTrustedTransport();
		OAuthCredential credentials = oAuthCredentialService2.getCredential(institutionName);
		if (credentials == null) {
			notifyAdminOfBackupFailure(
					"❌ No credentials found for your institution. Please go to 'Drive Backup Settings' and add your Google Cloud OAuth credentials.",
					institutionName);
			return null;
		}

		String clientId = credentials.getClientId();
		String clientSecret = credentials.getClientSecret();
		String RefreshToken = credentials.getRefreshToken();

		GoogleClientSecrets.Details details = new GoogleClientSecrets.Details();
		details.setClientId(clientId);
		details.setClientSecret(clientSecret);
		GoogleClientSecrets clientSecrets = new GoogleClientSecrets().setInstalled(details);

		if (RefreshToken != null && !RefreshToken.isEmpty()) {

			return new GoogleCredential.Builder().setTransport(httpTransport).setJsonFactory(JSON_FACTORY)
					.setClientSecrets(clientId, clientSecret).build().setRefreshToken(RefreshToken);
		} else {
			logger.error("Errror Uploading the Sheduled Backups REASON: RefreshToken Not Found");
			notifyAdminOfBackupFailure("Errror Uploading the Sheduled Backups REASON: RefreshToken Not Found",
					institutionName);
			return null;
		}

	}

	public void uploadFileToDrivesheduled(InputStream inputStream, String fileName, String folderName,
			String institutionName) throws Exception {

		// Authorize
		var httpTransport = GoogleNetHttpTransport.newTrustedTransport();
		var credentials = oAuthCredentialService2.getCredential(institutionName);
		if (credentials == null) {
			notifyAdminOfBackupFailure(
					"❌ No credentials found. Please go to 'Drive Backup Settings' and add your Google Cloud OAuth credentials.",
					institutionName);
			return;
		}

		String clientId = credentials.getClientId();
		String clientSecret = credentials.getClientSecret();
		String refreshToken = credentials.getRefreshToken();

		GoogleCredential credential = new GoogleCredential.Builder().setTransport(httpTransport)
				.setJsonFactory(JSON_FACTORY).setClientSecrets(clientId, clientSecret).build()
				.setRefreshToken(refreshToken);

		Drive driveService = new Drive.Builder(httpTransport, JSON_FACTORY, credential)
				.setApplicationName(APPLICATION_NAME).build();

		// Get or create folder
		String folderId = getOrCreateFolderId(driveService, folderName);

		File fileMetadata = new File();
		fileMetadata.setName(fileName);
		fileMetadata.setParents(Collections.singletonList(folderId));

		InputStreamContent mediaContent = new InputStreamContent("application/zip", inputStream);
		mediaContent.setLength(-1); // Unknown size for stream
		mediaContent.setCloseInputStream(false);

		Drive.Files.Create createRequest = driveService.files().create(fileMetadata, mediaContent)
				.setFields("id, name");

		// Enable resumable upload with large chunk size
		MediaHttpUploader uploader = createRequest.getMediaHttpUploader();
		uploader.setDirectUploadEnabled(false); // Use resumable
		uploader.setChunkSize(5 * 1024 * 1024); // ✅ 5 MB chunk size

		// Optional: Progress listener
		uploader.setProgressListener((MediaHttpUploader uploaderProgress) -> {
			switch (uploaderProgress.getUploadState()) {
			case INITIATION_STARTED:
				System.out.println("Upload initiation started.");
				break;
			case INITIATION_COMPLETE:
				System.out.println("Upload initiation completed.");
				break;
			case MEDIA_IN_PROGRESS:
				System.out.printf("Uploaded so far: %d bytes\n", uploaderProgress.getNumBytesUploaded());
				break;
			case MEDIA_COMPLETE:
				System.out.println("Upload completed!");
				break;
			}
		});

		createRequest.execute(); // Start upload
	}

	public void deleteOldFilesInDriveFolder(String folderName, int maxFilesToKeep, String institutionName)
			throws Exception {
		Credential credential = authorizeUserAndGetRefreshTokensheduled(institutionName);
		if (credential == null) {
			notifyAdminOfBackupFailure(
					"❌ No credentials found for your institution. Please go to 'Drive Backup Settings' and add your Google Cloud OAuth credentials.",
					institutionName);
		}
		Drive driveService = new Drive.Builder(GoogleNetHttpTransport.newTrustedTransport(), JSON_FACTORY, credential)
				.setApplicationName(APPLICATION_NAME).build();

		String folderId = getOrCreateFolderId(driveService, folderName);

		FileList fileList = driveService.files().list()
				.setQ("'" + folderId + "' in parents and mimeType='application/zip' and trashed = false")
				.setFields("files(id, name, createdTime)").setOrderBy("createdTime asc") // oldest first
				.execute();
		List<File> files = fileList.getFiles();
		if (files.size() > maxFilesToKeep) {
			int toDelete = files.size() - maxFilesToKeep;
			for (int i = 0; i < toDelete; i++) {
				driveService.files().delete(files.get(i).getId()).execute();
			}
		}
	}

	private void notifyAdminOfBackupFailure(String issue, String institutionName) {
		String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
		String subject = "⚠️ Backup Credential Error - " + institutionName;

		String body = "<h2 style='color:#d9534f;'>Backup Initialization Failed</h2>" + "<p><strong>Time:</strong> "
				+ timestamp + "</p>" + "<p><strong>Institution:</strong> " + institutionName + "</p>"
				+ "<p><strong>Issue:</strong> " + issue + "</p>"
				+ "<p><strong>Action Needed:</strong> Please verify Google Drive credentials in the backup settings.</p>";

		try {
			List<String> adminemails = muserRepo.findAdminEmailfromInstitutionName(institutionName);
			emailService.sendHtmlEmailAsync(institutionName, adminemails, List.of(), List.of(), subject, body);
		} catch (Exception e) {
			logger.error("❌ Failed to notify admin about backup failure: {}", e.getMessage());
		}
	}

}
