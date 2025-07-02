package com.knowledgeVista.Settings.Controller;

import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Settings.OpenRouterKeys;
import com.knowledgeVista.Settings.ViewSettings;
import com.knowledgeVista.Settings.Repo.OpenRouterKeyRepo;
import com.knowledgeVista.Settings.Repo.ViewSettingsRepo;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.knowledgeVista.config.EncryptionUtil;

@RestController
@CrossOrigin
public class SettingsController {
	@Autowired
	private ViewSettingsRepo settingsrepo;
	@Autowired
	private OpenRouterKeyRepo openrouterKEyRepo;
	private static final Logger logger = LoggerFactory.getLogger(SettingsController.class);

	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private CourseDetailRepository courserepo;

	public Boolean isViewCourseinLandingPageEnabled() {
		try {
			if (courserepo.count() > 0) {
				Optional<ViewSettings> setting = settingsrepo.findBySettingName("viewCourseInLanding");
				return setting.map(s -> s.getSettingValue()).orElse(true);
			} else {
				return false;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return true;
		}
	}

	public Boolean updateViewCourseInLandingPage(Boolean isEnabled, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role)) {

				Optional<ViewSettings> setting = settingsrepo.findBySettingName("viewCourseInLanding");

				ViewSettings viewSettings;
				if (setting.isPresent()) {
					// Update existing setting
					viewSettings = setting.get();

				} else {
					// Create new setting
					viewSettings = new ViewSettings();
					viewSettings.setSettingName("viewCourseInLanding");

				}
				// Set the new value
				viewSettings.setSettingValue(isEnabled);
				settingsrepo.save(viewSettings);

				return true;
			} else {
				return false;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return false;
		}
	}

	public Boolean isSocialLoginEnabled() {
		try {
			Optional<ViewSettings> setting = settingsrepo.findBySettingName("SocialLogin");
			return setting.map(s -> s.getSettingValue()).orElse(true);
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return true;
		}
	}

	public Boolean updateSocialLogin(Boolean isEnabled, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role)) {

				Optional<ViewSettings> setting = settingsrepo.findBySettingName("SocialLogin");

				ViewSettings viewSettings;
				if (setting.isPresent()) {
					// Update existing setting
					viewSettings = setting.get();

				} else {
					// Create new setting
					viewSettings = new ViewSettings();
					viewSettings.setSettingName("SocialLogin");

				}
				// Set the new value
				viewSettings.setSettingValue(isEnabled);
				settingsrepo.save(viewSettings);

				return true;
			} else {
				return false;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return false;
		}
	}

	public Long setAttendanceThresholdMinutes(Long minutes, String token) {
		try {

			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role)) {
				Optional<ViewSettings> opviewSettings = settingsrepo.findBySettingName("AttendanceThresholdMinutes");
				ViewSettings viewSettings;
				if (opviewSettings.isPresent()) {
					viewSettings = opviewSettings.get();
				} else {
					viewSettings = new ViewSettings();
					viewSettings.setSettingName("AttendanceThresholdMinutes");
				}
				viewSettings.setSettingLongValue(minutes);
				settingsrepo.save(viewSettings);
				return minutes;
			} else {
				return null;
			}
		} catch (Exception e) {
			return null;
		}
	}

	public Long getAttendanceThresholdMinutes() {
		try {
			Optional<ViewSettings> opviewSettings = settingsrepo.findBySettingName("AttendanceThresholdMinutes");
			ViewSettings viewSettings;
			if (opviewSettings.isPresent()) {
				viewSettings = opviewSettings.get();
				return viewSettings.getSettingLongValue();
			} else {
				return 10L;
			}
		} catch (Exception e) {
			return 10L;
		}
	}

	public ResponseEntity<?> saveOpenRouterKeys(String token, String openRouterKey) {
		try {
			String institutionName = jwtUtil.getInstitutionFromToken(token);
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				String key = openrouterKEyRepo.findByInstitution(institutionName);
				OpenRouterKeys keys;
				String encryptedKey;
				try {
					encryptedKey = EncryptionUtil.encrypt(openRouterKey);
				} catch (Exception e) {
					e.printStackTrace();
					return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Encryption failed");
				}
				if (key != null) {
					// Find the entity to update
					keys = openrouterKEyRepo.findAll().stream()
						.filter(k -> institutionName.equals(k.getInstitutionName()))
						.findFirst()
						.orElse(null);
					if (keys != null) {
						keys.setOpenRouterKey(encryptedKey);
						openrouterKEyRepo.save(keys);
						return ResponseEntity.ok("Updated");
					}
				}
				// Create new record
				keys = new OpenRouterKeys();
				keys.setInstitutionName(institutionName);
				keys.setOpenRouterKey(encryptedKey);
				openrouterKEyRepo.save(keys);
				return ResponseEntity.ok("Saved");
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized role");
			}
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
		}
	}

	public ResponseEntity<?> getOpenRouterKeys(String token) {
		try {
			String institutionName = jwtUtil.getInstitutionFromToken(token);
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				String encryptedKey = openrouterKEyRepo.findByInstitution(institutionName);
				if (encryptedKey != null) {
					String decryptedKey;
					try {
						decryptedKey = EncryptionUtil.decrypt(encryptedKey);
					} catch (Exception e) {
						e.printStackTrace();
						return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Decryption failed");
					}
					java.util.Map<String, String> result = new java.util.HashMap<>();
					result.put("openRouterKey", decryptedKey);
					return ResponseEntity.ok(result);
				} else {
					return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized role");
			}
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
		}
	}

}