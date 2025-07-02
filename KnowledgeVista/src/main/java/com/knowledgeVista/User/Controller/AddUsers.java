package com.knowledgeVista.User.Controller;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.knowledgeVista.Email.EmailService;
import com.knowledgeVista.Notification.Service.NotificationService;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.MuserRoles;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.Repository.MuserRoleRepository;
import com.knowledgeVista.User.SecurityConfiguration.CacheService;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.knowledgeVista.User.SecurityConfiguration.OtpService;

import io.jsonwebtoken.io.DecodingException;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class AddUsers {
	@Autowired
	private MuserRepositories muserrepositories;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private MuserRoleRepository muserrolerepository;
	@Autowired
	private BCryptPasswordEncoder passwordEncoder;
	@Autowired
	private NotificationService notiservice;
	@Autowired
	private EmailService emailService;
	@Autowired
	private CacheService cacheService;
	@Autowired
	private OtpService otpService;
	private static final Logger logger = LoggerFactory.getLogger(AddUsers.class);

	public ResponseEntity<?> addTrainer(HttpServletRequest request, String username, String psw, String email,
			LocalDate dob, String phone, String skills, MultipartFile profile, Boolean isActive, String countryCode,
			String token, String otp) {
		try {
			if (!otpService.validateOtp(email, otp)) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
			}
			// Remove OTP after successful verification
			otpService.clearOtp(email);
			String role = jwtUtil.getRoleFromToken(token);
			String adminemail = jwtUtil.getEmailFromToken(token);

			// Perform authentication based on role
			if ("ADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);

				if (existingUser.isPresent()) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("EMAIL");
				} else {
					MuserRoles roletrainer = muserrolerepository.findByroleName("TRAINER");
					Muser trainer = new Muser();
					Optional<Muser> addingadmin = muserrepositories.findByEmail(adminemail);
					if (addingadmin.isPresent()) {

						Muser adding = addingadmin.get();

						trainer.setInstitutionName(adding.getInstitutionName());
						if (username == null || username.trim().isEmpty()) {
							// Extract the part before '@' from the email
							if (email != null && email.contains("@")) {
								username = email.substring(0, email.indexOf("@"));
							}
						}
						trainer.setUsername(username);
						trainer.setEmail(email);
						trainer.setIsActive(isActive);
						trainer.setPassword(psw, passwordEncoder);
						trainer.setPhone(phone);
						trainer.setDob(dob);
						trainer.setSkills(skills);
						trainer.setRole(roletrainer);
						trainer.setCountryCode(countryCode);
						if (profile != null && !profile.isEmpty()) {
							try {
								trainer.setProfile(profile.getBytes());
							} catch (IOException e) {
								e.printStackTrace();
								logger.error("", e);
							}
						}

						muserrepositories.save(trainer);
						List<String> bcc = null;
						List<String> cc = null;
						String institutionname = adding.getInstitutionName();
						String domain = request.getHeader("origin"); // Extracts the domain dynamically

						// Fallback if "Origin" header is not present (e.g., direct backend requests)
						if (domain == null || domain.isEmpty()) {
							domain = request.getScheme() + "://" + request.getServerName();
							if (request.getServerPort() != 80 && request.getServerPort() != 443) {
								domain += ":" + request.getServerPort();
							}
						}

						// Construct the Sign-in Link
						String signInLink = domain + "/login";
						String body = String.format("<html>" + "<body>" + "<h2>Welcome to LearnHub Trainer Portal!</h2>"
								+ "<p>Dear %s,</p>"
								+ "<p>We are thrilled to have you as a trainer at LearnHub. Your expertise will help shape the learning journey of many students.</p>"
								+ "<p>Here are your login credentials:</p>" + "<ul>"
								+ "<li><strong>Username (Email):</strong> %s</li>"
								+ "<li><strong>Password:</strong> %s</li>" + "</ul>" + "<p>As a trainer, you can:</p>"
								+ "<ul>" + "<li>Create and manage courses.</li>"
								+ "<li>Interact with students and address their queries.</li>"
								+ "<li>Track student progress and provide valuable feedback.</li>"
								+ "<li>And Many More....</li>" + "</ul>"
								+ "<p>If you need any assistance, our support team is here to help.</p>"

								+ "<p>Click the link below to sign in:</p>" + "<p><a href='" + signInLink
								+ "' style='font-size:16px; color:blue;'>Sign In</a></p>"
								+ "<p>We look forward to your contribution in making learning more impactful!</p>"
								+ "<p>Best Regards,<br>LearnHub Team</p>" + "</body>" + "</html>",
								trainer.getUsername(), // Trainer Name
								trainer.getEmail(), // Trainer Username (email)
								trainer.getPsw() // Trainer Password
						);

						if (institutionname != null && !institutionname.isEmpty()) {
							try {
								List<String> emailList = new ArrayList<>();
								emailList.add(trainer.getEmail());
								emailService.sendHtmlEmailAsync(institutionname, emailList, cc, bcc,
										"Welcome to LearnHub - Trainer Access Granted!", body);
							} catch (Exception e) {
								logger.error("Error sending mail: " + e.getMessage());
							}
						}

						return ResponseEntity.ok().body("{\"message\": \"saved Successfully\"}");
					} else {

						return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
					}
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (DecodingException ex) {
			// Log the decoding exception
			ex.printStackTrace(); // You can replace this with logging framework like Log4j
			logger.error("", ex);
			// Return an error response indicating invalid token
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		} catch (Exception e) {
			// Log any other exceptions for debugging purposes
			logger.error("", e);
			e.printStackTrace(); // You can replace this with logging framework like Log4j
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

//===========================================ADMIN OR TRAINER -ADDING STUDENT======================================================	  

	public ResponseEntity<?> addStudent(HttpServletRequest request, String username, String psw, String email,
			LocalDate dob, String phone, String skills, MultipartFile profile, Boolean isActive, String countryCode,
			String token, String otp) {
		try {
			if (!otpService.validateOtp(email, otp)) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
			}
			// Remove OTP after successful verification
			otpService.clearOtp(email);
			String role = jwtUtil.getRoleFromToken(token);
			String emailofadd = jwtUtil.getEmailFromToken(token);
			String usernameofadding = "";
			String emailofadding = "";
			String instituiton = "";
			Optional<Muser> optiUser = muserrepositories.findByEmail(emailofadd);
			if (optiUser.isPresent()) {
				Muser addinguser = optiUser.get();
				usernameofadding = addinguser.getUsername();
				emailofadding = addinguser.getEmail();
				instituiton = addinguser.getInstitutionName();
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

			// Perform authentication based on role
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {

				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("EMAIL");
				} else {
					MuserRoles roletrainer = muserrolerepository.findByroleName("USER");
					if (username == null || username.trim().isEmpty()) {
						// Extract the part before '@' from the email
						if (email != null && email.contains("@")) {
							username = email.substring(0, email.indexOf("@"));
						}
					}
					Muser user = new Muser();
					user.setUsername(username);
					user.setEmail(email);
					user.setIsActive(isActive);
					user.setPassword(psw, passwordEncoder);
					user.setPhone(phone);
					user.setDob(dob);
					user.setRole(roletrainer);
					user.setInstitutionName(instituiton);
					user.setSkills(skills);
					user.setCountryCode(countryCode);
					if (profile != null && !profile.isEmpty()) {
						try {
							user.setProfile(profile.getBytes());
						} catch (IOException e) {
							e.printStackTrace();
							logger.error("", e);
						}
					}
					Muser saveduser = muserrepositories.save(user);
					String heading = "New Student Added !";
					String link = "/view/Student/profile/" + saveduser.getEmail();
					String notidescription = "A new Student " + saveduser.getUsername() + " was added";

					Long NotifyId = notiservice.createNotification("UserAdd", usernameofadding, notidescription,
							emailofadding, heading, link, Optional.ofNullable(profile));
					if (NotifyId != null) {
						List<String> notiuserlist = new ArrayList<>();
						notiuserlist.add("ADMIN");
						notiservice.CommoncreateNotificationUser(NotifyId, notiuserlist, instituiton);
					}
					List<String> bcc = null;
					List<String> cc = null;
					String institutionname = instituiton;
					String domain = request.getHeader("origin"); // Extracts the domain dynamically

					// Fallback if "Origin" header is not present (e.g., direct backend requests)
					if (domain == null || domain.isEmpty()) {
						domain = request.getScheme() + "://" + request.getServerName();
						if (request.getServerPort() != 80 && request.getServerPort() != 443) {
							domain += ":" + request.getServerPort();
						}
					}

					// Construct the Sign-in Link
					String signInLink = domain + "/login";
					String body = String.format("<html>" + "<body>" + "<h2>Welcome to LearnHub!</h2>"
							+ "<p>Dear %s,</p>"
							+ "<p>We are excited to have you on board at LearnHub, your gateway to knowledge and growth.</p>"
							+ "<p>Here are your login credentials to access your courses:</p>" + "<ul>"
							+ "<li><strong>Username (Email):</strong> %s</li>"
							+ "<li><strong>Password:</strong> %s</li>" + "</ul>"
							+ "<p>Start exploring your enrolled courses, engage with trainers, and enhance your learning experience.</p>"
							+ "<p>If you need any support, feel free to reach out to our help desk.</p>"

							+ "<p>Click the link below to sign in:</p>" + "<p><a href='" + signInLink
							+ "' style='font-size:16px; color:blue;'>Sign In</a></p>" + "<p>Happy Learning!</p>"
							+ "<p>Best Regards,<br>LearnHub Team</p>" + "</body>" + "</html>", username, email, // Student
																												// Username
																												// (email)
							psw);

					if (institutionname != null && !institutionname.isEmpty()) {
						try {
							List<String> emailList = new ArrayList<>();
							emailList.add(email);
							emailService.sendHtmlEmailAsync(institutionname, emailList, cc, bcc,
									"Welcome to LearnHub - Start Your Learning Journey!", body);
						} catch (Exception e) {
							logger.error("Error sending mail: " + e.getMessage());
						}
					}

					return ResponseEntity.ok().body("{\"message\": \"saved Successfully\"}");
				}
			} else {

				System.out.println("not a trainer or admin");
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (DecodingException ex) {
			// Log the decoding exception
			ex.printStackTrace(); // You can replace this with logging framework like Log4j
			logger.error("", ex);
			// Return an error response indicating invalid token

			System.out.println("catch ");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		} catch (Exception e) {
			// Log any other exceptions for debugging purposes
			e.printStackTrace(); // You can replace this with logging framework like Log4j
			logger.error("", e);
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> DeactivateTrainer(String reason, String email, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("ADMIN".equals(role) || "SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("TRAINER".equals(user.getRole().getRoleName())) {
						user.setIsActive(false);
						user.setInactiveDescription(reason);
						muserrepositories.save(user);
						cacheService.setUserActiveStatus(user.getEmail(), false);
						return ResponseEntity.ok().body("{\"message\": \"DeActivated Successfully\"}");
					}
					return ResponseEntity.notFound().build();
				} else {
					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();
				}
			} else {
				// Return unauthorized status if the role is neither ADMIN nor TRAINER
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			// Log any other exceptions for debugging purposes
			e.printStackTrace(); // You can replace this with logging framework like Log4j
			logger.error("", e);
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> activateTrainer(String email, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("ADMIN".equals(role) || "SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("TRAINER".equals(user.getRole().getRoleName())) {
						user.setIsActive(true);
						user.setLoginAttempts(0);
						user.setInactiveDescription("");
						muserrepositories.save(user);
						cacheService.setUserActiveStatus(user.getEmail(), true);
						return ResponseEntity.ok().body("{\"message\": \"Activated Successfully\"}");
					}
					return ResponseEntity.notFound().build();
				} else {
					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();
				}
			} else {

				// Return unauthorized status if the role is neither ADMIN nor TRAINER
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			// Log any other exceptions for debugging purposes
			e.printStackTrace(); // You can replace this with logging framework like Log4j
			logger.error("", e);
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> DeactivateStudent(String reason, String email, String token) {
		try {

			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("ADMIN".equals(role) || "TRAINER".equals(role) || "SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("USER".equals(user.getRole().getRoleName())) {
						user.setIsActive(false);
						user.setInactiveDescription(reason);
						muserrepositories.save(user);
						cacheService.setUserActiveStatus(user.getEmail(), false);
						return ResponseEntity.ok().body("{\"message\": \"Deactivated Successfully\"}");
					}

					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();

				} else {
					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();
				}
			} else {
				// Return unauthorized status if the role is neither ADMIN nor TRAINER
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			// Log any other exceptions for debugging purposes
			e.printStackTrace(); // You can replace this with logging framework like Log4j
			logger.error("", e);
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> activateStudent(String email, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("ADMIN".equals(role) || "TRAINER".equals(role) || "SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("USER".equals(user.getRole().getRoleName())) {
						user.setIsActive(true);
						user.setLoginAttempts(0);
						user.setInactiveDescription("");
						muserrepositories.save(user);
						cacheService.setUserActiveStatus(user.getEmail(), true);
						return ResponseEntity.ok().body("{\"message\": \"Activated Successfully\"}");
					}

					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();

				} else {
					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();
				}
			} else {
				// Return unauthorized status if the role is neither ADMIN nor TRAINER
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			// Log any other exceptions for debugging purposes
			e.printStackTrace(); // You can replace this with logging framework like Log4j
			logger.error("", e);
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

}
