package com.knowledgeVista.Migration;

import java.time.LocalDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestHeader;

import com.knowledgeVista.Migration.model.OAuthCredential;
import com.knowledgeVista.Migration.repo.OAuthCredentialRepo;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.knowledgeVista.config.EncryptionUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@Service
public class OAuthCredentialService {

	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	private OAuthCredentialRepo credentialRepository;
	@Autowired
	private EncryptionUtil encryptionUtil;
	@Autowired
	private GoogleDriveOAuthService googleAuthservie;

	private static final Logger logger = LoggerFactory.getLogger(OAuthCredentialService.class);

	public ResponseEntity<?> saveOrUpdateCredential(HttpServletRequest request, @Valid OAuthCredential credential,
			@RequestHeader("Authorization") String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String institutionName = jwtUtil.getInstitutionFromToken(token);

			if (!"ADMIN".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body("❌ You are unauthorized to access this resource!");
			}

			Optional<OAuthCredential> optionalCredential = credentialRepository.findByInstitutionName(institutionName);

			// Always encrypt input credentials
			String encryptedClientId = encryptionUtil.encrypt(credential.getClientId());
			String encryptedClientSecret = encryptionUtil.encrypt(credential.getClientSecret());

			OAuthCredential entityToSave;

			if (optionalCredential.isPresent()) {
				OAuthCredential existing = optionalCredential.get();

				boolean clientChanged = !encryptedClientId.equals(existing.getClientId())
						|| !encryptedClientSecret.equals(existing.getClientSecret());

				// If client credentials changed, invalidate refresh token
				if (clientChanged) {
					existing.setRefreshToken(null); // Invalidate old refresh token
				}

				existing.setClientId(encryptedClientId);
				existing.setClientSecret(encryptedClientSecret);
				existing.setUpdatedAt(LocalDateTime.now());

				entityToSave = existing;
			} else {
				credential.setClientId(encryptedClientId);
				credential.setClientSecret(encryptedClientSecret);
				credential.setInstitutionName(institutionName);
				credential.setCreatedAt(LocalDateTime.now());
				credential.setUpdatedAt(LocalDateTime.now());

				entityToSave = credential;
			}

			OAuthCredential saved = credentialRepository.save(entityToSave);

			// If no refresh token, prompt for authorization
			if (entityToSave.getRefreshToken() == null || entityToSave.getRefreshToken().isBlank()) {
				String authUrl = googleAuthservie.generateAuthUrl(saved, request);
				return ResponseEntity.status(HttpStatus.ACCEPTED).body("🔐 Please authorize access: " + authUrl);
			}

			return ResponseEntity.ok("✅ Credential saved successfully for " + institutionName);

		} catch (Exception e) {
			logger.error("❌ Error saving credentials: " + e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ Failed to save credentials. " + e.getMessage());
		}
	}

	public ResponseEntity<String> oauthCallback(String code, String institutionName, HttpServletRequest request) {
		try {
			googleAuthservie.exchangeCodeAndSaveToken(code, institutionName, request);
			return ResponseEntity.ok("✅ Google authorization successful! You may close this window.");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("❌ Failed to authorize. " + e.getMessage());
		}
	}

	public ResponseEntity<?> getDecryptedCredentialByInstitution(String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String institutionName = jwtUtil.getInstitutionFromToken(token);
			if (!"ADMIN".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body("❌ You are unauthorized to access this resource!");
			}
			Optional<OAuthCredential> optionalCredential = credentialRepository.findByInstitutionName(institutionName);

			if (optionalCredential.isPresent()) {
				OAuthCredential credential = optionalCredential.get();
				try {
					credential.setClientId(encryptionUtil.decrypt(credential.getClientId()));
					credential.setClientSecret(encryptionUtil.decrypt(credential.getClientSecret()));
					if (credential.getRefreshToken() != null) {
						credential.setRefreshToken(encryptionUtil.decrypt(credential.getRefreshToken()));
					}
					return ResponseEntity.ok(credential);
				} catch (Exception e) {
					logger.error("Error Decrypting the keys" + e.getMessage());
					return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
				}

			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
			}
		} catch (Exception e) {

			logger.error("Error getting the keys" + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
	}

}
