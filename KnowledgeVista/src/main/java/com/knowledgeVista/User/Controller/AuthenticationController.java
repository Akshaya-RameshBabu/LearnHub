package com.knowledgeVista.User.Controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Approvals.MuserApprovalRepo;
import com.knowledgeVista.User.Approvals.MuserApprovals;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.CacheService;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.knowledgeVista.User.SecurityConfiguration.TokenBlacklist;

@Service
public class AuthenticationController {
	@Autowired
	private MuserRepositories muserRepositories;
	@Autowired
	private MuserApprovalRepo muserapprovals;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private BCryptPasswordEncoder passwordEncoder;
	@Autowired
	private TokenBlacklist tokenBlacklist;
	@Autowired
	private CacheService cacheService;

	private static final Logger logger = LoggerFactory.getLogger(AuthenticationController.class);

	public ResponseEntity<String> logout(String token) {

		String email = jwtUtil.getEmailFromToken(token);
		Optional<Muser> userOptional = muserRepositories.findByEmail(email);
		if (userOptional.isPresent()) {
			Muser user = userOptional.get();
			user.setLastactive(LocalDateTime.now());
			muserRepositories.save(user);
			tokenBlacklist.blacklistToken(token);
		}
		// Respond with a success message
		return ResponseEntity.ok().body("Logged out successfully");
	}

	public ResponseEntity<?> refreshtoken(String token) {
		try {
			String newtoken = jwtUtil.refreshToken(token);
			return ResponseEntity.ok().body(newtoken);

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> login(Map<String, String> loginRequest) {
		String username = loginRequest.get("username");
		String password = loginRequest.get("password");

		try {
			Optional<Muser> userOptional = muserRepositories.findByEmail(username);

			if (userOptional.isEmpty()) {
				Optional<MuserApprovals> opmuser = muserapprovals.findByEmail(username);
				if (opmuser.isPresent()) {
					Map<String, Object> responseBody = new HashMap<>();
					responseBody.put("message", "Not Approved");
					responseBody.put("Description",
							"Your login has not been approved yet. Please contact the administrator.");
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
				} else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"User not found\"}");
				}
			}

			Muser user = userOptional.get();
			String institution = user.getInstitutionName();

			// Check if user is locked due to too many failed attempts
			if (user.getLoginAttempts() != null && user.getLoginAttempts() >= 5) {
				user.setIsActive(false);
				user.setInactiveDescription(
						"Account locked due to multiple failed login attempts.Contact your Adminstrator");
				muserRepositories.save(user);
				cacheService.setUserActiveStatus(user.getEmail(), false);
				Map<String, Object> responseBody = new HashMap<>();
				responseBody.put("message", "In Active");
				responseBody.put("Description",
						"Account locked due to multiple failed login attempts.Contact your Adminstrator");
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
			}

			// Check if password is stored in plain text (legacy) and needs migration
			if (user.getPsw().equals(password)) {
				// Migrate the password to hashed version
				String encryptedPassword = passwordEncoder.encode(password);
				user.setPsw(encryptedPassword);
				muserRepositories.save(user);
			}

			// Verify password using BCrypt
			if (passwordEncoder.matches(password, user.getPsw())) {
				if (!user.getIsActive()) {
					Map<String, Object> responseBody = new HashMap<>();
					responseBody.put("message", "In Active");
					responseBody.put("Description", user.getInactiveDescription());
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
				}

				// Reset login attempts on successful login
				user.setLoginAttempts(0);
				muserRepositories.save(user);

				// Check if user is USER or TRAINER and verify admin status
				if ((user.getRole().getRoleName().equals("USER") || user.getRole().getRoleName().equals("TRAINER"))) {
					Boolean isActiveAdmin = muserRepositories.getactiveResultByInstitutionName("ADMIN", institution);
					if (!isActiveAdmin) {
						Map<String, Object> responseBody = new HashMap<>();
						responseBody.put("message", "In Active");
						responseBody.put("Description", "Your Institution is Inactive");
						return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
					}
				}

				// Generate JWT token
				String jwtToken = jwtUtil.generateToken(user.getUsername(), user.getRole().getRoleName(),
						user.getInstitutionName(), user.getUserId(), user.getEmail());

				// Update last active timestamp
				user.setLastactive(LocalDateTime.now());
				muserRepositories.save(user);

				// Prepare response body
				Map<String, Object> responseBody = new HashMap<>();
				responseBody.put("token", jwtToken);
				responseBody.put("message", "Login successful");
				responseBody.put("role", user.getRole().getRoleName());
				responseBody.put("email", user.getEmail());
				responseBody.put("userid", user.getUserId());

				return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(responseBody);
			} else {
				// Increment login attempts on failed password, handle null case
				int currentAttempts = user.getLoginAttempts() != null ? user.getLoginAttempts() : 0;
				user.setLoginAttempts(currentAttempts + 1);
				muserRepositories.save(user);

				Map<String, Object> responseBody = new HashMap<>();
				responseBody.put("message", "Incorrect password");
				responseBody.put("attemptsLeft", 5 - (user.getLoginAttempts() != null ? user.getLoginAttempts() : 0));
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
			}
		} catch (Exception e) {
			logger.error("Error during login", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("{\"message\": \"An error occurred during login\"}");
		}
	}

	// ````````````````````````````````````````````````for
	// view`````````````````````````````````````````````

	public ResponseEntity<?> forgetPassword(String email) {
		// Finding the user by email
		Optional<Muser> userOptional = muserRepositories.findByEmail(email);

		// If the user doesn't exist, return 404 Not Found
		if (userOptional.isEmpty()) {
			return ResponseEntity.notFound().build();
		} else {
			// If the user exists, return 200 OK
			return ResponseEntity.ok().build();
		}
	}

	public ResponseEntity<?> resetPassword(String email, String newPassword) {
		try {
			// Finding the user by email
			Optional<Muser> userOptional = muserRepositories.findByEmail(email);

			// If the user doesn't exist, return 404 Not Found
			if (userOptional.isEmpty()) {
				return ResponseEntity.notFound().build();
			}

			Muser validUser = userOptional.get();
			
			// Encrypt the new password using BCryptPasswordEncoder
			String encryptedPassword = passwordEncoder.encode(newPassword);
			validUser.setPsw(encryptedPassword);
			
			muserRepositories.save(validUser);
			
			return ResponseEntity.ok().body("{\"message\": \"Password reset successfully\"}");
		} catch (Exception e) {
			logger.error("Error resetting password", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("{\"message\": \"Error resetting password\"}");
		}
	}
}